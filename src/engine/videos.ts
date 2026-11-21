// How-to videos from food creators (src/data/videos.json, built from scripts/videos.json).
// We never copy videos: they play in YouTube's or Instagram's own player, always with the creator's name.

import raw from '../data/videos.json';

export type VideoPlatform = 'youtube' | 'instagram';

export interface HowToVideo {
  platform: VideoPlatform;
  /** YouTube video id (the 11 letters after watch?v=) */
  id?: string;
  /** Instagram post or reel link */
  url?: string;
  creator: string;
  /** Spoken language, when we know it */
  lang?: 'Hindi' | 'English';
  /** A YouTube Short (vertical, under a minute) */
  short?: boolean;
}

const VIDEOS = raw as Record<string, HowToVideo[]>;

/** Videos for a dish or drink id (empty if none yet). */
export function videosFor(id: string): HowToVideo[] {
  return VIDEOS[id] ?? [];
}

export function hasVideo(id: string): boolean {
  return videosFor(id).length > 0;
}

/** How many dishes and drinks have at least one video. */
export const VIDEO_COUNT = Object.keys(VIDEOS).length;

/** The page on YouTube or Instagram, for the "Watch on …" link. */
export function watchUrl(v: HowToVideo): string {
  if (v.platform === 'youtube') return v.short ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`;
  return v.url!;
}

/** The official embedded player (YouTube's privacy-enhanced mode, or Instagram's embed page). */
export function embedUrl(v: HowToVideo): string {
  if (v.platform === 'youtube') return `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&playsinline=1`;
  return `${v.url!.replace(/\/?$/, '/')}embed/`;
}

/** Still picture shown before the person presses play (YouTube only). */
export function thumbnailUrl(v: HowToVideo): string | null {
  return v.platform === 'youtube' ? `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` : null;
}

export function platformName(v: HowToVideo): string {
  return v.platform === 'youtube' ? 'YouTube' : 'Instagram';
}
