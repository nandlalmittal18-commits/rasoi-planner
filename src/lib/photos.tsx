import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import manual from '../data/photos.json';
import { storage } from './storage';
import { SOURCES_VERSION, fetchWikiPhotos, type Photo } from './wikiPhotos';

// Which photo each dish shows:
//  1. src/data/photos.json (your own or bought photos, or { "hide": true } to keep the drawing)
//  2. otherwise the photo found on Wikipedia (see wikiPhotos.ts)
//  3. otherwise the drawn picture

const MANUAL = manual as Record<string, Photo>;
const PhotoContext = createContext<Record<string, Photo>>({});

export function PhotoProvider({ children }: { children: ReactNode }) {
  const [cached] = useState(() => storage.loadPhotoCache<Record<string, Photo>>(SOURCES_VERSION));
  const [wiki, setWiki] = useState<Record<string, Photo>>(cached ?? {});

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    fetchWikiPhotos()
      .then((photos) => {
        if (cancelled) return;
        setWiki(photos);
        if (Object.keys(photos).length) storage.savePhotoCache(SOURCES_VERSION, photos);
      })
      .catch(() => {
        /* offline or Wikipedia unreachable: the drawn pictures stay */
      });
    return () => {
      cancelled = true;
    };
  }, [cached]);

  return <PhotoContext.Provider value={wiki}>{children}</PhotoContext.Provider>;
}

/** The photo to show for a dish, or null to show its drawn picture. */
export function usePhoto(dishId: string): Photo | null {
  const wiki = useContext(PhotoContext);
  const own = MANUAL[dishId];
  if (own?.hide) return null;
  return own?.src ? own : (wiki[dishId] ?? null);
}
