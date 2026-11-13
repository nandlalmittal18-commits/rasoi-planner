import { useState } from 'react';
import type { Dish } from '../engine';
import { usePhoto } from '../lib/photos';
import { DishArt } from './DishArt';

/** A real photo of the dish when one is available, otherwise its drawn picture. */
export function DishPicture({ dish, size = 56, className = '', cover = false }: { dish: Dish; size?: number; className?: string; cover?: boolean }) {
  const photo = usePhoto(dish.id);
  const [failed, setFailed] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<string | null>(null);
  if (!photo || failed === photo.src) return <DishArt dish={dish} size={size} className={className} cover={cover} />;
  return (
    <span className={`dish-photo-wrap ${className}`} style={{ width: size, height: size }}>
      <DishArt dish={dish} size={size} cover={cover} />
      <img
        className={`dish-art dish-photo${loaded === photo.src ? ' is-loaded' : ''}`}
        src={photo.src}
        width={size}
        height={size}
        alt={`Photo of ${dish.name}`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(photo.src)}
        onError={() => setFailed(photo.src)}
      />
    </span>
  );
}
