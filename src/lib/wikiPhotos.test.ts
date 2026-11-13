import { describe, expect, it } from 'vitest';
import { DISHES } from '../engine';
import { PHOTO_SOURCES, fetchWikiPhotos, parseCredits, parsePageImages, pickPhotos } from './wikiPhotos';

describe('photo sources', () => {
  it('only lists real dishes, and never a generic page for a vegetarian dish', () => {
    const ids = new Set([...DISHES.map((d) => d.id), 'steamed-rice']);
    const generic = /^(Pizza|Biryani|Fried rice|Pulao|Taco|Lasagna|Shawarma|Green curry|Pad thai|Tom yum|Kofta|Halva)$/;
    for (const [dish, titles] of Object.entries(PHOTO_SOURCES)) {
      expect(ids.has(dish), dish).toBe(true);
      const d = DISHES.find((x) => x.id === dish);
      if (d?.diet === 'Veg') for (const t of titles) expect(generic.test(t), `${dish} → ${t}`).toBe(false);
    }
  });
});

describe('parsing Wikipedia answers', () => {
  const pageImages = {
    query: {
      normalized: [{ from: 'Sambar_(dish)', to: 'Sambar (dish)' }],
      redirects: [{ from: 'Kanda poha', to: 'Poha (dish)' }],
      pages: {
        '1': { title: 'Poha (dish)', thumbnail: { source: 'https://upload.wikimedia.org/poha-480.jpg' }, pageimage: 'Poha_plate.jpg' },
        '2': { title: 'Sambar (dish)', thumbnail: { source: 'https://upload.wikimedia.org/sambar-480.jpg' }, pageimage: 'Sambar_bowl.jpg' },
        '-1': { title: 'Nonexistent dish', missing: '' },
        '3': { title: 'Upma' },
      },
    },
  };

  it('follows normalised titles and redirects, and skips pages without a free photo', () => {
    const found = parsePageImages(pageImages, ['Kanda poha', 'Sambar_(dish)', 'Nonexistent dish', 'Upma']);
    expect(found.get('Kanda poha')).toEqual({ thumb: 'https://upload.wikimedia.org/poha-480.jpg', file: 'Poha_plate.jpg' });
    expect(found.get('Sambar_(dish)')?.file).toBe('Sambar_bowl.jpg');
    expect(found.has('Nonexistent dish')).toBe(false);
    expect(found.has('Upma')).toBe(false);
  });

  it('picks the first article that has a photo', () => {
    const found = new Map([['B', { thumb: 'b.jpg', file: 'B.jpg' }]]);
    expect(pickPhotos({ x: ['A', 'B'], y: ['A'] }, found)).toEqual({ x: { thumb: 'b.jpg', file: 'B.jpg' } });
  });

  it('reads photographer and licence as plain text', () => {
    const credits = parseCredits({
      query: {
        pages: {
          '5': {
            title: 'File:Poha plate.jpg',
            imageinfo: [
              {
                descriptionurl: 'https://commons.wikimedia.org/wiki/File:Poha_plate.jpg',
                extmetadata: { Artist: { value: '<a href="//x">Asha &amp; Ravi</a>' }, LicenseShortName: { value: 'CC BY-SA 4.0' } },
              },
            ],
          },
        },
      },
    });
    expect(credits.get('Poha plate.jpg')).toEqual({ credit: 'Asha & Ravi', license: 'CC BY-SA 4.0', page: 'https://commons.wikimedia.org/wiki/File:Poha_plate.jpg' });
  });

  it('puts it all together, with credits matched to dishes', async () => {
    const fakeFetch = (async (url: string) => {
      const u = new URL(url);
      expect(u.searchParams.get('origin')).toBe('*');
      const body =
        u.searchParams.get('prop') === 'pageimages'
          ? pageImages
          : {
              query: {
                pages: {
                  '5': {
                    title: 'File:Poha plate.jpg',
                    imageinfo: [{ descriptionurl: 'https://commons.wikimedia.org/wiki/File:Poha_plate.jpg', extmetadata: { Artist: { value: 'Asha' }, LicenseShortName: { value: 'CC BY 4.0' } } }],
                  },
                },
              },
            };
      return new Response(JSON.stringify(body), { status: 200 });
    }) as unknown as typeof fetch;
    const photos = await fetchWikiPhotos(fakeFetch);
    expect(photos.poha).toEqual({
      src: 'https://upload.wikimedia.org/poha-480.jpg',
      credit: 'Asha',
      license: 'CC BY 4.0',
      page: 'https://commons.wikimedia.org/wiki/File:Poha_plate.jpg',
    });
  });
});
