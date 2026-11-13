import { useState } from 'react';
import type { Dish } from '../engine';
import photos from '../data/photos.json';
import { DishArt } from './DishArt';

// Real dish photos. Each entry in src/data/photos.json looks like:
//   "poha": { "src": "https://…/640px-Poha.jpg", "credit": "Photographer name",
//             "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:…" }
// Use only photos you are allowed to use (your own, bought, or free-licensed with credit).
// Dishes without a photo, or whose photo fails to load, show the drawn picture instead.

export interface Photo {
  src: string;
  credit?: string;
  license?: string;
  page?: string;
}

const PHOTOS = photos as Record<string, Photo>;

export function getPhoto(dishId: string): Photo | null {
  return PHOTOS[dishId] ?? null;
}

export function DishPicture({ dish, size = 56, className = '', cover = false }: { dish: Dish; size?: number; className?: string; cover?: boolean }) {
  const photo = getPhoto(dish.id);
  const [failed, setFailed] = useState(false);
  if (!photo || failed) return <DishArt dish={dish} size={size} className={className} cover={cover} />;
  return (
    <img
      className={`dish-art dish-photo ${className}`}
      src={photo.src}
      width={size}
      height={size}
      alt={`Photo of ${dish.name}`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
