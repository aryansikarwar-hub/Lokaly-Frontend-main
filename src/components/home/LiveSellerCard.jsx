import { useNavigate } from "react-router-dom";
import { HiArrowLongRight } from "react-icons/hi2";
import { useAgoraHoverPreview } from "../../hooks/useAgoraHoverPreview";

// Color palette mapping by category
const CATEGORY_COLORS = {
  "Handloom & Sarees": "from-coral to-tangerine",
  "Ethnic Wear": "from-mint to-leaf",
  "Pottery & Ceramics": "from-lavender to-mauve",
  Jewellery: "from-butter to-peach",
  "Home Decor": "from-peach to-coral",
  "Spices & Pickles": "from-tangerine to-coral",
  "Madhubani Art": "from-lavender to-mauve",
  "Organic Groceries": "from-mint to-leaf",
  "Leather & Mojaris": "from-butter to-peach",
  "Ayurveda & Wellness": "from-mint to-leaf",
  "Indie Beauty": "from-lavender to-mauve",
  "Kids Toys (Channapatna)": "from-butter to-peach",
  "Blue Pottery": "from-lavender to-mauve",
  default: "from-coral to-tangerine",
};

/**
 * LiveSellerCard
 *
 * @param {Object}  stream      — the stream payload from /api/live/featured
 * @param {boolean} autoplay    — when true AND stream is live, mini-player
 *                                starts automatically (used for the top card).
 *                                For non-top cards, falls back to hover-to-preview.
 */
export default function LiveSellerCard({ stream, autoplay = false }) {
  const navigate = useNavigate();

  // 🆕 Decide if this card should auto-stream
  const shouldAutoplay =
    autoplay && stream.status === "live" && Boolean(stream.roomId);

  const { containerRef, isPreviewing, onHoverStart, onHoverEnd } =
    useAgoraHoverPreview({
      autoStart: shouldAutoplay ? { channelName: stream.roomId } : null,
    });

  const gradient =
    CATEGORY_COLORS[stream.category] || CATEGORY_COLORS.default;

  const handleClick = () => {
    navigate(`/live/${stream.streamId}`);
  };

  const handleMouseEnter = () => {
    // Hover preview only when we're NOT already autoplaying
    if (!shouldAutoplay && stream.status === "live" && stream.roomId) {
      onHoverStart({ channelName: stream.roomId });
    }
  };

  const statusLabel =
    stream.status === "live"
      ? "Live now"
      : stream.status === "scheduled"
        ? "Coming soon"
        : "Recent stream";

  // 🆕 Smart headline: city → state → shopName → title
  const headline =
    stream.host?.city ||
    stream.host?.state ||
    stream.host?.shopName ||
    stream.title ||
    "Lokaly";

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onHoverEnd}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`h-full w-full bg-gradient-to-br ${gradient} p-6 flex flex-col justify-between text-white relative cursor-pointer overflow-hidden`}
    >
      {/* TOP — Featured seller + category badge */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <div className="text-[9px] uppercase tracking-[0.2em] opacity-80 font-jakarta font-semibold">
            Featured seller
          </div>
          <h3 className="mt-2.5 font-fraunces text-3xl leading-none">
            {headline}
          </h3>
        </div>
        <span className="text-[9px] uppercase tracking-wider font-jakarta font-semibold px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
          {stream.category}
        </span>
      </div>

      {/* MIDDLE — Mini player area (thumbnail or live preview) */}
      <div className="absolute inset-x-6 top-[100px] bottom-[140px] rounded-xl overflow-hidden bg-black/15">
        {/* Agora video container — shows whenever previewing (hover OR autoplay) */}
        <div
          ref={containerRef}
          className={`absolute inset-0 transition-opacity duration-300 ${
            isPreviewing ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Thumbnail / placeholder (hidden once preview is live) */}
        {!isPreviewing && (
          <>
            {stream.coverImage ? (
              <img
                src={stream.coverImage}
                alt={stream.host.shopName}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center text-white/70">
                  <div className="text-3xl mb-2">📡</div>
                  <div className="text-[10px] font-jakarta">
                    {stream.status === "live"
                      ? shouldAutoplay
                        ? "Connecting…"
                        : "Hover to preview"
                      : statusLabel}
                  </div>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </>
        )}

        {/* Viewer count overlay (top right) */}
        {stream.status === "live" && stream.viewers > 0 && (
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-jakarta font-semibold flex items-center gap-1 z-10">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            {stream.viewers.toLocaleString()}
          </div>
        )}

        {/* 🆕 Muted-autoplay chip: subtle hint that audio is off */}
        {isPreviewing && (
          <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-jakarta font-medium z-10 flex items-center gap-1">
            <span>🔇</span>
            <span>Muted</span>
          </div>
        )}

        {/* Hover hint (only when NOT autoplaying and NOT previewing) */}
        {!isPreviewing && !shouldAutoplay && stream.status === "live" && (
          <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-jakarta font-medium z-10">
            Hover to preview
          </div>
        )}
      </div>

      {/* BOTTOM — Live now + shop name + product + swipe hint */}
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-2.5">
          <span
            className={`w-1.5 h-1.5 rounded-full bg-white ${
              stream.status === "live" ? "animate-pulse" : ""
            }`}
          />
          <span className="text-[10px] font-jakarta font-semibold uppercase tracking-wider opacity-90">
            {statusLabel}
          </span>
        </div>
        <p className="font-jakarta font-semibold text-lg leading-tight">
          {stream.host.shopName}
        </p>
        <p className="opacity-80 text-xs font-jakarta mt-0.5 line-clamp-1">
          {stream.title}
        </p>
        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[11px] font-jakarta">
          <span className="opacity-75">Tap to watch</span>
          <HiArrowLongRight className="text-base" />
        </div>
      </div>
    </div>
  );
}