import { useState } from 'react';
import { embedUrl, platformName, thumbnailUrl, videosFor, watchUrl, type HowToVideo } from '../engine';

/** One video: a still picture with a play button; the real player loads only when tapped. */
function VideoTile({ video, dishName }: { video: HowToVideo; dishName: string }) {
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const thumb = thumbnailUrl(video);
  const where = platformName(video);
  const tall = video.short || video.platform === 'instagram';
  return (
    <figure className={`howto${tall ? ' is-tall' : ''}`}>
      <div className="howto-frame">
        {playing ? (
          <iframe
            src={embedUrl(video)}
            title={`${dishName}: video by ${video.creator}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
          />
        ) : (
          <button type="button" className="howto-play" onClick={() => setPlaying(true)} aria-label={`Play ${dishName} video by ${video.creator}`}>
            {thumb && !thumbFailed && <img src={thumb} alt="" loading="lazy" decoding="async" onError={() => setThumbFailed(true)} />}
            <span className="howto-play-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26">
                <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <figcaption className="howto-credit">
        <span>
          Video by <strong>{video.creator}</strong>
          {video.lang ? ` · in ${video.lang}` : ''}
        </span>
        <a href={watchUrl(video)} target="_blank" rel="noopener noreferrer">
          Watch on {where}
        </a>
      </figcaption>
    </figure>
  );
}

/** "Watch how to make it": creator videos for a dish or drink. Shows nothing if there are none yet. */
export function HowToVideos({ id, name }: { id: string; name: string }) {
  const videos = videosFor(id);
  if (!videos.length) return null;
  return (
    <section className="howto-section" aria-labelledby={`howto-${id}`}>
      <h3 id={`howto-${id}`}>Watch how to make it</h3>
      {videos.map((v) => (
        <VideoTile key={v.id ?? v.url} video={v} dishName={name} />
      ))}
      <p className="muted small">Videos belong to their creators and play from {videos.some((v) => v.platform === 'instagram') ? 'YouTube or Instagram' : 'YouTube'}. Their recipe may differ a little from ours.</p>
    </section>
  );
}
