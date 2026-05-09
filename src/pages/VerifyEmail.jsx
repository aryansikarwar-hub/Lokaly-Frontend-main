import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiOutlineEnvelope,
  HiOutlineCheckBadge,
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
} from 'react-icons/hi2';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Spinner } from '../components/ui/Spinner';

// ============= LEGACY TOKEN-BASED FLOW =============
// Old emails contain ?token=xxx — handle that path too.
function LegacyTokenVerify({ token }) {
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('Verifying your email…');
  const hydrate = useAuthStore((s) => s.hydrate);
  const storedToken = useAuthStore((s) => s.token);

  useEffect(() => {
    let cancelled = false;
    api
      .post('/auth/verify-email', { token })
      .then((res) => {
        if (cancelled) return;
        setStatus('success');
        setMessage('Your email is verified. Welcome aboard!');
        if (res?.data?.user && storedToken) hydrate(storedToken, res.data.user);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('error');
        setMessage(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            'Verification failed. The link may be invalid or expired.'
        );
      });
    return () => {
      cancelled = true;
    };
  }, [token, hydrate, storedToken]);

  return (
    <ResultCard
      status={status}
      message={message}
      successCta={{ to: '/dashboard?tab=settings', label: 'Back to settings' }}
      errorCta={{ to: '/dashboard?tab=settings', label: 'Try OTP instead' }}
    />
  );
}

// ============= MAIN PAGE =============

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const legacyToken = searchParams.get('token');
  const emailFromQuery = searchParams.get('email');

  const user = useAuthStore((s) => s.user);
  const authToken = useAuthStore((s) => s.token);
  const hydrate = useAuthStore((s) => s.hydrate);
  const navigate = useNavigate();

  // If user landed via legacy email link → run that flow
  if (legacyToken) return <LegacyTokenVerify token={legacyToken} />;

  // Need to be logged in for OTP flow
  if (!authToken) {
    return (
      <ResultCard
        status="error"
        message="Please log in first to verify your email."
        errorCta={{ to: '/login', label: 'Go to log in' }}
      />
    );
  }

  // Already verified
  if (user?.isEmailVerified || user?.emailVerified) {
    return (
      <ResultCard
        status="success"
        message="Your email is already verified."
        successCta={{ to: '/dashboard?tab=settings', label: 'Back to settings' }}
      />
    );
  }

  return (
    <OtpFlow
      email={user?.email || emailFromQuery || ''}
      onVerified={(updatedUser) => {
        if (authToken) hydrate(authToken, updatedUser);
        toast.success('Email verified! 🎉');
        setTimeout(() => navigate('/dashboard?tab=settings'), 1200);
      }}
    />
  );
}

// ============= OTP FLOW =============

function OtpFlow({ email, onVerified }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);          // sec until resend allowed
  const [expiresIn, setExpiresIn] = useState(0);        // sec until OTP expires
  const [hasSentOnce, setHasSentOnce] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState(null);            // shown only in dev when SMTP off
  const inputRefs = useRef([]);

  // Auto-send first OTP on mount
  const sendOtp = useCallback(async () => {
    setSending(true);
    setError('');
    try {
      const { data } = await api.post('/auth/email/send-otp');
      if (data.alreadyVerified) {
        setVerified(true);
        return;
      }
      setHasSentOnce(true);
      setCooldown(data.cooldownSec || 60);
      setExpiresIn(data.expiresInSec || 600);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      if (data.devOtp) {
        setDevOtp(data.devOtp);
        toast(`Dev mode: OTP is ${data.devOtp}`, { icon: '🔑', duration: 8000 });
      } else {
        toast.success(`Code sent to ${email || 'your email'}`);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Could not send code. Try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }, [email]);

  useEffect(() => {
    sendOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Expiry ticker
  useEffect(() => {
    if (expiresIn <= 0) return;
    const t = setInterval(() => setExpiresIn((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [expiresIn]);

  const handleChange = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    setError('');

    // Auto-advance
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus();

    // Auto-submit when all 6 filled
    if (digit && idx === 5 && next.every((d) => d !== '')) {
      submit(next.join(''));
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    } else if (e.key === 'Enter') {
      const code = otp.join('');
      if (code.length === 6) submit(code);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData.getData('text') || '')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (!pasted) return;
    const next = pasted.padEnd(6, '').split('').slice(0, 6);
    while (next.length < 6) next.push('');
    setOtp(next);
    setError('');
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
    if (pasted.length === 6) submit(pasted);
  };

  const submit = async (code) => {
    if (verifying) return;
    setVerifying(true);
    setError('');
    try {
      const { data } = await api.post('/auth/email/verify-otp', { otp: code });
      setVerified(true);
      setTimeout(() => onVerified?.(data.user), 800);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Verification failed';
      setError(msg);
      // Clear and refocus on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  // ============= SUCCESS SCREEN =============
  if (verified) {
    return (
      <Shell>
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 14, stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-leaf/20 grid place-items-center mx-auto mb-4"
        >
          <HiOutlineCheckBadge className="text-5xl text-leaf" />
        </motion.div>
        <h1 className="font-fraunces text-2xl text-ink dark:text-cream tracking-tight mb-2">
          Email verified!
        </h1>
        <p className="text-sm text-ink/60 dark:text-cream/60 font-jakarta">
          Redirecting you back to settings…
        </p>
      </Shell>
    );
  }

  // ============= OTP ENTRY =============
  return (
    <Shell>
      <Link
        to="/dashboard?tab=settings"
        className="absolute top-6 left-6 text-xs font-jakarta font-semibold text-ink/60 dark:text-cream/60 hover:text-ink dark:hover:text-cream flex items-center gap-1"
      >
        <HiOutlineArrowLeft />
        Back
      </Link>

      <div className="w-16 h-16 rounded-2xl bg-coral/10 grid place-items-center mx-auto mb-4">
        <HiOutlineEnvelope className="text-3xl text-coral" />
      </div>

      <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
        Email verification
      </div>
      <h1 className="font-fraunces text-3xl text-ink dark:text-cream tracking-tight mb-2">
        Enter the 6-digit code
      </h1>
      <p className="text-sm text-ink/60 dark:text-cream/60 font-jakarta leading-relaxed">
        We sent a verification code to{' '}
        <span className="font-semibold text-ink dark:text-cream break-all">
          {email || 'your email'}
        </span>
      </p>

      {/* Initial loading */}
      {sending && !hasSentOnce && (
        <div className="my-8 flex justify-center">
          <Spinner size={32} />
        </div>
      )}

      {/* OTP inputs */}
      {hasSentOnce && (
        <div className="mt-7">
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onFocus={(e) => e.target.select()}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                disabled={verifying}
                aria-label={`Digit ${idx + 1}`}
                className={`w-11 h-14 sm:w-12 sm:h-16 rounded-2xl text-center font-fraunces text-2xl sm:text-3xl tabular-nums bg-white/80 dark:bg-white/5 border-2 transition outline-none disabled:opacity-50
                  ${
                    error
                      ? 'border-coral/60 text-coral'
                      : digit
                      ? 'border-ink dark:border-cream text-ink dark:text-cream'
                      : 'border-ink/10 dark:border-white/10 text-ink dark:text-cream focus:border-mauve'
                  }`}
              />
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-xs text-coral font-jakarta font-semibold text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verifying spinner */}
          {verifying && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink/60 dark:text-cream/60 font-jakarta">
              <Spinner size={16} />
              Verifying…
            </div>
          )}

          {/* Expiry */}
          {expiresIn > 0 && !verifying && !error && (
            <p className="mt-4 text-[11px] text-ink/45 dark:text-cream/45 font-jakarta text-center tabular-nums">
              Code expires in {fmtTime(expiresIn)}
            </p>
          )}

          {/* Resend */}
          <div className="mt-6 text-center">
            <span className="text-xs text-ink/55 dark:text-cream/55 font-jakarta">
              Didn't get the code?{' '}
            </span>
            {cooldown > 0 ? (
              <span className="text-xs text-ink/40 dark:text-cream/40 font-jakarta tabular-nums">
                Resend in {cooldown}s
              </span>
            ) : (
              <button
                onClick={sendOtp}
                disabled={sending}
                className="text-xs font-jakarta font-bold text-coral hover:text-coral/80 inline-flex items-center gap-1 disabled:opacity-50"
              >
                <HiOutlineArrowPath className={sending ? 'animate-spin' : ''} />
                {sending ? 'Sending…' : 'Resend code'}
              </button>
            )}
          </div>

          {/* Dev OTP hint */}
          {devOtp && (
            <div className="mt-5 rounded-xl bg-butter/30 border border-butter/50 px-3 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wider font-jakarta font-bold text-ink/60">
                Dev mode (SMTP not configured)
              </div>
              <div className="font-fraunces text-lg tabular-nums text-ink mt-0.5">
                Code: {devOtp}
              </div>
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}

// ============= SHARED UI =============

function Shell({ children }) {
  return (
    <div className="min-h-screen grid place-items-center bg-cream dark:bg-ink px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md rounded-3xl bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-ink/5 dark:border-white/10 shadow-xl p-8 text-center"
      >
        {children}
      </motion.div>
    </div>
  );
}

function ResultCard({ status, message, successCta, errorCta }) {
  const iconBg = status === 'success' ? 'bg-leaf/20' : status === 'error' ? 'bg-coral/15' : 'bg-mauve/15';
  const iconColor = status === 'success' ? 'text-leaf' : status === 'error' ? 'text-coral' : 'text-mauve';

  return (
    <Shell>
      {status === 'verifying' ? (
        <div className="my-4 flex justify-center">
          <Spinner size={36} />
        </div>
      ) : (
        <div className={`w-16 h-16 rounded-2xl ${iconBg} grid place-items-center mx-auto mb-4`}>
          {status === 'success' ? (
            <HiOutlineCheckBadge className={`text-3xl ${iconColor}`} />
          ) : (
            <HiOutlineEnvelope className={`text-3xl ${iconColor}`} />
          )}
        </div>
      )}
      <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
        Lokaly
      </div>
      <h1 className="font-fraunces text-2xl text-ink dark:text-cream tracking-tight mb-3">
        Email verification
      </h1>
      <p className="font-jakarta text-sm text-ink/65 dark:text-cream/65">{message}</p>

      <div className="mt-6 flex flex-col items-center gap-2">
        {status === 'success' && successCta && (
          <Link
            to={successCta.to}
            className="inline-flex items-center gap-1 px-5 py-2 rounded-full bg-ink text-cream text-xs font-jakarta font-semibold hover:bg-ink/90"
          >
            {successCta.label}
          </Link>
        )}
        {status === 'error' && errorCta && (
          <Link
            to={errorCta.to}
            className="inline-flex items-center gap-1 px-5 py-2 rounded-full bg-coral text-white text-xs font-jakarta font-semibold hover:bg-coral/90"
          >
            {errorCta.label}
          </Link>
        )}
        <Link
          to="/"
          className="text-[11px] font-jakarta font-semibold text-ink/50 dark:text-cream/50 hover:text-ink dark:hover:text-cream mt-1"
        >
          ← Back to home
        </Link>
      </div>
    </Shell>
  );
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}