/**
 * Marquee — infinite horizontal scroller, uses the `marquee` keyframe.
 * Pass `items` as ReactNodes. Gap controlled via Tailwind classes on children.
 */
export function Marquee({ items, pauseOnHover = true, className = '' }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className={`flex gap-10 whitespace-nowrap animate-marquee ${pauseOnHover ? 'hover:[animation-play-state:paused]' : ''}`}>
        {items.map((it, i) => <div key={i} className="shrink-0">{it}</div>)}
        {items.map((it, i) => <div key={`dup-${i}`} aria-hidden className="shrink-0">{it}</div>)}
      </div>
    </div>
  );
}

export default Marquee;
