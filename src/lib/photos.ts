import manual from '../data/photos.json';

// Dish photos are our own pictures in public/photos/<dish id>.jpg, listed in
// src/data/photos.json. Dishes without one show their drawn picture (DishArt.tsx).

export interface Photo {
  src: string;
  /** Where the photo came from, for our records only (never shown in the app) */
  source?: string;
  /** Shown under the photo when set */
  credit?: string;
  license?: string;
  page?: string;
  /** Set to keep the drawn picture for this dish */
  hide?: boolean;
}

const PHOTOS = manual as Record<string, Photo>;

/** The photo to show for a dish, or null to show its drawn picture. */
export function usePhoto(dishId: string): Photo | null {
  const own = PHOTOS[dishId];
  return own?.src && !own.hide ? own : null;
}
