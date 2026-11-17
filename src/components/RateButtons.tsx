import { ThumbDownIcon, ThumbUpIcon } from './icons';

/** Thumbs up / down for a dish. Tapping the same thumb again clears it. */
export function RateButtons({ name, value, onRate }: { name: string; value?: 1 | -1; onRate: (v: 1 | -1 | 0) => void }) {
  return (
    <div className="rate" role="group" aria-label={`Does your family like ${name}?`}>
      <button
        type="button"
        className={`rate-btn${value === 1 ? ' is-up' : ''}`}
        aria-pressed={value === 1}
        title="We like this: suggest it more often"
        onClick={() => onRate(value === 1 ? 0 : 1)}
      >
        <ThumbUpIcon /> <span>{value === 1 ? 'Liked' : 'Like'}</span>
      </button>
      <button
        type="button"
        className={`rate-btn${value === -1 ? ' is-down' : ''}`}
        aria-pressed={value === -1}
        title="Not for us: suggest it less often"
        onClick={() => onRate(value === -1 ? 0 : -1)}
      >
        <ThumbDownIcon /> <span className="visually-hidden">Not for us</span>
      </button>
    </div>
  );
}
