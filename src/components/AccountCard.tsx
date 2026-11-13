import type { SyncState } from '../lib/storage';

export interface Account {
  id: string;
  email: string;
  name: string;
}

interface Props {
  account: Account | null;
  ready: boolean;
  sync: SyncState;
  onSignIn: () => void;
  onSignOut: () => void;
  onRetry: () => void;
}

/** Sign in with Google, or show who is signed in. */
export function AccountCard({ account, ready, sync, onSignIn, onSignOut, onRetry }: Props) {
  if (!ready) {
    return (
      <div className="card account">
        <p className="muted">Checking your account…</p>
      </div>
    );
  }
  if (!account) {
    return (
      <div className="card account">
        <div>
          <h3>Save your family online</h3>
          <p className="muted small">
            Sign in to keep your menu on every phone in the house. Without signing in, it stays on this phone only.
          </p>
        </div>
        <button type="button" className="btn btn-google" onClick={onSignIn}>
          <GoogleMark /> Continue with Google
        </button>
        <p className="muted small">
          We use only your name and email to save your family’s menu. See our <a href="./privacy.html">Privacy Policy</a>.
        </p>
      </div>
    );
  }
  const initial = (account.name || account.email || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="card account is-signed-in">
      <div className="account-who">
        <span className="avatar" aria-hidden="true">
          {initial}
        </span>
        <div className="account-text">
          <strong>{account.name || 'Signed in'}</strong>
          <span className="muted small">{account.email}</span>
          {sync.state === 'saving' && <span className="muted small">Saving to your account…</span>}
          {(sync.state === 'saved' || sync.state === 'idle') && <span className="saved-online small">Menu saved to your account</span>}
        </div>
      </div>
      <button type="button" className="btn btn-quiet btn-small" onClick={onSignOut}>
        Sign out
      </button>
      {sync.state === 'error' && (
        <div className="sync-error" role="alert">
          <p>
            <strong>Not saved online yet.</strong> Your family is safe on this phone.
          </p>
          <p className="small">Reason: {sync.message}</p>
          <button type="button" className="btn btn-primary btn-small" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

/** Google's four-colour "G", as used on sign-in buttons. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.3.8-4.7l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}
