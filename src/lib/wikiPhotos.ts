// Real dish photos from Wikipedia / Wikimedia Commons, fetched by the app itself.
//
// For each dish, src/data/photo-sources.json lists Wikipedia article titles. The app asks
// Wikipedia for each article's main photo (free-licensed photos only) and then for the
// photographer's name and licence, which we must show as credit. Results are cached on
// the phone (see storage.ts), so this happens about once every two weeks.

import sources from '../data/photo-sources.json';

export interface Photo {
  src: string;
  credit?: string;
  license?: string;
  page?: string;
  /** Set in photos.json to keep the drawn picture for this dish */
  hide?: boolean;
}

const API = 'https://en.wikipedia.org/w/api.php';
const BATCH = 50;

export const PHOTO_SOURCES: Record<string, string[]> = Object.fromEntries(
  Object.entries(sources as Record<string, string | string[]>).filter(
    (entry): entry is [string, string[]] => !entry[0].startsWith('_') && Array.isArray(entry[1]),
  ),
);

/** Changes whenever photo-sources.json changes, so old cached photos are refreshed. */
export const SOURCES_VERSION = (() => {
  const text = JSON.stringify(PHOTO_SOURCES);
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return `v1-${h.toString(36)}`;
})();

// ---------------------------------------------------------------- parsing (pure, tested)

interface Mapping {
  from: string;
  to: string;
}
interface PageImagesResponse {
  query?: {
    normalized?: Mapping[];
    redirects?: Mapping[];
    pages?: Record<string, { title: string; missing?: string; thumbnail?: { source: string }; pageimage?: string }>;
  };
}
interface ImageInfoResponse {
  query?: {
    normalized?: Mapping[];
    pages?: Record<
      string,
      {
        title: string;
        imageinfo?: { descriptionurl?: string; extmetadata?: Record<string, { value?: string } | undefined> }[];
      }
    >;
  };
}

const spaced = (s: string) => s.replace(/_/g, ' ');

/** For each requested article title: its main photo (thumbnail URL and file name), if free. */
export function parsePageImages(resp: PageImagesResponse, requested: string[]): Map<string, { thumb: string; file: string }> {
  const q = resp.query ?? {};
  const norm = new Map((q.normalized ?? []).map((m) => [m.from, m.to]));
  const redir = new Map((q.redirects ?? []).map((m) => [m.from, m.to]));
  const byTitle = new Map(Object.values(q.pages ?? {}).map((p) => [p.title, p]));
  const out = new Map<string, { thumb: string; file: string }>();
  for (const title of requested) {
    let t = norm.get(title) ?? title;
    t = redir.get(t) ?? t;
    const page = byTitle.get(t);
    if (page && !('missing' in page) && page.thumbnail?.source && page.pageimage) {
      out.set(title, { thumb: page.thumbnail.source, file: page.pageimage });
    }
  }
  return out;
}

function plainText(html: string | undefined): string | undefined {
  if (!html) return undefined;
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text || undefined;
}

/** Photographer and licence for each file name (keys use spaces, without "File:"). */
export function parseCredits(resp: ImageInfoResponse): Map<string, { credit?: string; license?: string; page?: string }> {
  const out = new Map<string, { credit?: string; license?: string; page?: string }>();
  for (const p of Object.values(resp.query?.pages ?? {})) {
    const info = p.imageinfo?.[0];
    if (!info) continue;
    const meta = info.extmetadata ?? {};
    out.set(spaced(p.title.replace(/^File:/, '')), {
      credit: plainText(meta.Artist?.value)?.slice(0, 80),
      license: plainText(meta.LicenseShortName?.value),
      page: info.descriptionurl,
    });
  }
  return out;
}

/** The first listed article with a free photo wins. */
export function pickPhotos(
  dishSources: Record<string, string[]>,
  found: Map<string, { thumb: string; file: string }>,
): Record<string, { thumb: string; file: string }> {
  const out: Record<string, { thumb: string; file: string }> = {};
  for (const [dish, titles] of Object.entries(dishSources)) {
    const hit = titles.map((t) => found.get(t)).find(Boolean);
    if (hit) out[dish] = hit;
  }
  return out;
}

// ---------------------------------------------------------------- fetching

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function getJson<T>(fetchFn: typeof fetch, params: Record<string, string>): Promise<T> {
  const url = `${API}?${new URLSearchParams({ format: 'json', origin: '*', ...params }).toString()}`;
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(`Wikipedia answered ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchWikiPhotos(fetchFn: typeof fetch = fetch): Promise<Record<string, Photo>> {
  const titles = [...new Set(Object.values(PHOTO_SOURCES).flat())];
  const found = new Map<string, { thumb: string; file: string }>();
  for (const batch of chunks(titles, BATCH)) {
    const resp = await getJson<PageImagesResponse>(fetchFn, {
      action: 'query',
      redirects: '1',
      prop: 'pageimages',
      piprop: 'thumbnail|name',
      pithumbsize: '480',
      pilicense: 'free',
      titles: batch.join('|'),
    });
    parsePageImages(resp, batch).forEach((v, k) => found.set(k, v));
  }

  const chosen = pickPhotos(PHOTO_SOURCES, found);
  const files = [...new Set(Object.values(chosen).map((c) => c.file))];
  const credits = new Map<string, { credit?: string; license?: string; page?: string }>();
  for (const batch of chunks(files, BATCH)) {
    try {
      const resp = await getJson<ImageInfoResponse>(fetchFn, {
        action: 'query',
        prop: 'imageinfo',
        iiprop: 'extmetadata|url',
        iiextmetadatafilter: 'Artist|LicenseShortName',
        titles: batch.map((f) => `File:${f}`).join('|'),
      });
      parseCredits(resp).forEach((v, k) => credits.set(k, v));
    } catch {
      /* photos still show; credit falls back to a link to the file page */
    }
  }

  const photos: Record<string, Photo> = {};
  for (const [dish, { thumb, file }] of Object.entries(chosen)) {
    const c = credits.get(spaced(file));
    photos[dish] = {
      src: thumb,
      credit: c?.credit ?? 'Wikimedia Commons',
      license: c?.license,
      page: c?.page ?? `https://en.wikipedia.org/wiki/File:${encodeURIComponent(file)}`,
    };
  }
  return photos;
}
