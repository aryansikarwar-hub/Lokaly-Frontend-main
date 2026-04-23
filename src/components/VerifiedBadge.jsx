export default function VerifiedBadge({ isVerifiedSeller = false, size = 14, className = '', title = 'Verified seller' }) {
  if (!isVerifiedSeller) return null;
  return (
    <span
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center shrink-0 text-white ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <path
          fill="#2196F3"
          d="M12 1l2.6 2.1 3.3-.4.9 3.2 3.2.9-.4 3.3L24 12l-2.4 1.9.4 3.3-3.2.9-.9 3.2-3.3-.4L12 23l-2.6-2.1-3.3.4-.9-3.2-3.2-.9.4-3.3L0 12l2.4-1.9-.4-3.3L5.2 5.9l.9-3.2 3.3.4L12 1z"
        />
        <path
          fill="#ffffff"
          d="M10.6 15.6l-3-3 1.4-1.4 1.6 1.6 4.2-4.2 1.4 1.4-5.6 5.6z"
        />
      </svg>
    </span>
  );
}
