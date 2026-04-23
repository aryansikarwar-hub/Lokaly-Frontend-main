import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState(token ? 'verifying' : 'missing');
  const [message, setMessage] = useState(
    token
      ? 'Verifying your email...'
      : 'No verification token found in the link.'
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .post('/auth/verify-email', { token })
      .then((res) => {
        if (cancelled) return;
        setStatus('success');
        setMessage(res?.data?.message || 'Your email is verified. Welcome aboard!');
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('error');
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Verification failed. The link may be invalid or expired.';
        setMessage(msg);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const tone =
    status === 'success'
      ? 'text-leaf'
      : status === 'error' || status === 'missing'
      ? 'text-coral'
      : 'text-mauve';

  return (
    <div className="min-h-screen grid place-items-center bg-cream dark:bg-ink px-4">
      <div className="w-full max-w-md rounded-3xl bg-white/80 dark:bg-white/5 border border-ink/5 dark:border-white/10 shadow-soft p-8 text-center">
        <div className="mb-2 text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-ink/50 dark:text-cream/50">
          Lokaly
        </div>
        <h1 className="font-fraunces text-2xl text-ink dark:text-cream mb-3">
          Email verification
        </h1>
        <p className={`font-jakarta text-sm ${tone}`}>{message}</p>

        <div className="mt-6 flex flex-col items-center gap-2">
          {status === 'success' && (
            <Link
              to="/login"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-ink text-cream text-xs font-jakarta font-semibold hover:bg-ink/90"
            >
              Continue to log in
            </Link>
          )}
          {(status === 'error' || status === 'missing') && (
            <Link
              to="/signup"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-coral text-white text-xs font-jakarta font-semibold hover:bg-coral/90"
            >
              Back to sign up
            </Link>
          )}
          <Link
            to="/"
            className="text-[11px] font-jakarta font-semibold text-ink/60 dark:text-cream/60 hover:text-ink dark:hover:text-cream mt-1"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
