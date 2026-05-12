import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlinePlusCircle, HiOutlineHashtag, HiHeart, HiOutlineHeart,
  HiOutlineChatBubbleOvalLeft, HiOutlinePaperAirplane, HiOutlineShieldCheck,
  HiOutlineShoppingBag, HiOutlinePhoto, HiOutlineBookmark, HiBookmark,
  HiOutlinePlay, HiOutlineFilm, HiOutlinePencilSquare,
  HiOutlineTrash, HiOutlineEllipsisHorizontal, HiOutlineSparkles, HiOutlineFire,
  HiOutlineStar, HiOutlineVideoCamera,
  HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlineCheck, HiOutlineEye,
  HiOutlineClock, HiOutlineMusicalNote, HiOutlineMapPin,
  HiOutlineSpeakerWave, HiOutlineSpeakerXMark,
  HiOutlineUserGroup, HiOutlineGlobeAlt, HiOutlineArrowUp,
} from "react-icons/hi2";
import { TbVideoPlus, TbWand } from "react-icons/tb";
import api from "../services/api";
import { Reveal } from "../components/animations/Reveal";
import { Spinner } from "../components/ui/Spinner";
import { Modal } from "../components/ui/Modal";
import Button from "../components/ui/Button";
import MediaUploader from "../components/ui/DirectMediaUploader";
import { useAuthStore } from "../store/authStore";
import { Avatar } from "../components/ui/Avatar";
import toast from "react-hot-toast";

const HASHTAGS = ["handmadeinindia","vocalforlocal","desi","indianartisan","craftlove","supportlocal","madeinindia","artisanal","ethnic","traditional"];
const TRENDING_TOPICS = [
  { tag: "handmadeinindia", count: "12.4K", growth: "+24%" },
  { tag: "desi", count: "8.1K", growth: "+18%" },
  { tag: "vocalforlocal", count: "5.6K", growth: "+12%" },
  { tag: "indianartisan", count: "3.2K", growth: "+8%" },
];
const FEED_FILTERS = [
  { key: "all", label: "All", icon: HiOutlineGlobeAlt },
  { key: "following", label: "Following", icon: HiOutlineUserGroup },
  { key: "trending", label: "Trending", icon: HiOutlineFire },
  { key: "nearby", label: "Nearby", icon: HiOutlineMapPin },
];
const EMOJI_REACTIONS = ["❤️", "🔥", "👏", "😍", "🙌", "✨"];

/* ===================== SAFE HELPERS ===================== */
// CRITICAL: always returns an array, never throws
const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  if (typeof v === "object") return Object.values(v);
  return [];
};

// Extract URL from MediaUploader item (handles many shapes)
const getMediaUrl = (item) => {
  if (!item) return null;
  if (typeof item === "string") return item;
  return item.url || item.secure_url || item.src || item.path || null;
};

// Build clean media items from uploader array
const cleanMedia = (arr, kind = "image") => {
  return toArray(arr)
    .map((m) => {
      const url = getMediaUrl(m);
      return url ? { url, kind } : null;
    })
    .filter(Boolean);
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (isNaN(diff)) return "";
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
}

function formatCount(n) {
  const num = Number(n) || 0;
  if (num < 1000) return num;
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
}

/* ===================== STORIES STRIP ===================== */
function StoriesStrip({ user }) {
  const stories = useMemo(() => [
    { id: "your", name: "Your Story", avatar: user?.avatar, isYou: true, unseen: false },
    { id: 1, name: "Priya Crafts", avatar: null, unseen: true, gradient: "from-coral via-pink-500 to-mauve" },
    { id: 2, name: "Khadi Studio", avatar: null, unseen: true, gradient: "from-amber-400 via-coral to-pink-500" },
    { id: 3, name: "Rajasthan Art", avatar: null, unseen: true, gradient: "from-emerald-400 via-teal-500 to-cyan-500" },
    { id: 4, name: "Block Print Co", avatar: null, unseen: false, gradient: "from-purple-500 via-mauve to-pink-500" },
    { id: 5, name: "Banaras Silk", avatar: null, unseen: true, gradient: "from-rose-400 via-fuchsia-500 to-indigo-500" },
    { id: 6, name: "Madhubani", avatar: null, unseen: false, gradient: "from-orange-400 to-coral" },
  ], [user]);

  return (
    <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-ink/5 p-3 mb-5 overflow-hidden">
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
        {stories.map((s) => (
          <button key={s.id} type="button" className="shrink-0 flex flex-col items-center gap-1.5 group">
            <div className="relative">
              <div className={`w-16 h-16 rounded-full p-[2.5px] ${
                s.isYou ? "bg-ink/10" :
                s.unseen ? `bg-gradient-to-tr ${s.gradient || "from-coral to-mauve"}` :
                "bg-ink/15"
              }`}>
                <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 p-[2px]">
                  {s.avatar ? (
                    <img src={s.avatar} alt={s.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className={`w-full h-full rounded-full bg-gradient-to-br ${s.gradient || "from-coral/30 to-mauve/30"} grid place-items-center text-white font-bold text-lg`}>
                      {s.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
              {s.isYou && (
                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-coral text-white grid place-items-center border-2 border-white dark:border-zinc-900">
                  <HiOutlinePlusCircle className="text-sm" />
                </div>
              )}
            </div>
            <span className="text-[10px] text-ink/60 dark:text-cream/60 font-medium truncate max-w-[64px]">
              {s.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===================== POST CARD ===================== */
function PostCard({ post, onOpen, onDeleted, onEdited }) {
  const user = useAuthStore((s) => s.user);
  const safeLikes = toArray(post?.likes);
  const [liked, setLiked] = useState(safeLikes.includes?.(user?._id) ?? false);
  const [likeCount, setLikeCount] = useState(safeLikes.length || 0);
  const [saved, setSaved] = useState(Boolean(post?.savedByMe));
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [activeReaction, setActiveReaction] = useState(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const menuRef = useRef(null);
  const reactionRef = useRef(null);
  const longPressTimer = useRef(null);

  const allImages = useMemo(
    () => toArray(post?.media).filter((m) => m && (m.kind === "image" || !m.kind) && m.url),
    [post?.media]
  );
  const img = allImages[carouselIdx]?.url || allImages[0]?.url;
  const tagged = toArray(post?.taggedProducts);
  const isOwner = user?._id === post?.author?._id;

  useEffect(() => {
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (reactionRef.current && !reactionRef.current.contains(e.target)) setShowReactions(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function toggleLike() {
    if (!user) { toast.error("Login karein pehle"); return; }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    if (!wasLiked) setActiveReaction("❤️");
    else setActiveReaction(null);
    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      if (typeof data?.liked === "boolean") setLiked(data.liked);
      if (typeof data?.likeCount === "number") setLikeCount(data.likeCount);
    } catch {
      // revert on error
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
      toast.error("Like update nahi hua");
    }
  }

  function handleLongPressStart() {
    longPressTimer.current = setTimeout(() => setShowReactions(true), 400);
  }
  function handleLongPressEnd() {
    clearTimeout(longPressTimer.current);
  }
  function pickReaction(emoji) {
    setActiveReaction(emoji);
    setShowReactions(false);
    if (!liked) { setLiked(true); setLikeCount((c) => c + 1); }
    toast.success(`${emoji} reacted`);
  }

  async function toggleSave() {
    if (!user) { toast.error("Login karein pehle"); return; }
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      await api.post(`/posts/${post._id}/save`).catch(() => {});
      toast.success(wasSaved ? "Saved se hata diya" : "Post save ho gayi 🔖");
    } catch {}
  }

  function handleShare() {
    const url = `${window.location.origin}/feed?post=${post._id}`;
    if (navigator.share) {
      navigator.share({ title: post.author?.name, text: post.caption, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      toast.success("Link copied! 🔗");
    }
  }

  if (!post?._id) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-ink/5 shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-2">
        <Link to={`/profile/${post.author?._id || ""}`} className="relative">
          <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-coral to-mauve">
            <div className="p-[1.5px] rounded-full bg-white dark:bg-zinc-900">
              <Avatar src={post.author?.avatar} name={post.author?.name} size={30} />
            </div>
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Link to={`/profile/${post.author?._id || ""}`} className="text-xs font-semibold text-ink dark:text-cream leading-tight truncate hover:underline">
              {post.author?.name || "Seller"}
            </Link>
            {post.author?.isVerified && <HiOutlineShieldCheck className="text-xs text-coral shrink-0" />}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-ink/40">
            <span>{timeAgo(post.createdAt)}</span>
            {post.location && (<><span>·</span><HiOutlineMapPin className="text-[10px]" /><span className="truncate max-w-[80px]">{post.location}</span></>)}
          </div>
        </div>
        {!isOwner && user && (
          <button type="button" className="text-[10px] font-bold text-coral hover:text-coral/80 transition px-2 py-0.5 rounded-md hover:bg-coral/5">
            + Follow
          </button>
        )}
        {isOwner && (
          <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setMenuOpen((v) => !v)} className="w-7 h-7 rounded-full flex items-center justify-center text-ink/40 hover:bg-ink/5 transition">
              <HiOutlineEllipsisHorizontal className="text-base" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-full mt-1 w-40 rounded-xl bg-white dark:bg-zinc-800 border border-ink/10 shadow-lg py-1 z-20">
                  <button type="button" onClick={() => { setMenuOpen(false); onEdited?.(post); }} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-ink/5 transition">
                    <HiOutlinePencilSquare /> Edit
                  </button>
                  <button type="button" onClick={async () => {
                    if (!window.confirm("Delete karni hai?")) return;
                    try { await api.delete(`/posts/${post._id}`); toast.success("Post delete ho gayi"); onDeleted?.(post._id); }
                    catch { toast.error("Delete nahi ho saki"); }
                  }} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-coral hover:bg-coral/5 transition">
                    <HiOutlineTrash /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Media */}
      {img && (
        <div className="relative overflow-hidden bg-ink/5 cursor-pointer" onClick={() => onOpen?.(post)} onDoubleClick={(e) => { e.stopPropagation(); toggleLike(); }}>
          <img src={img} alt="" className="w-full aspect-square object-cover group-hover:scale-[1.02] transition-transform duration-700" />

          <AnimatePresence>
            {activeReaction && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 grid place-items-center pointer-events-none text-7xl"
              >
                {activeReaction}
              </motion.div>
            )}
          </AnimatePresence>

          {allImages.length > 1 && (
            <>
              <div className="absolute top-2 right-2">
                <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                  {carouselIdx + 1}/{allImages.length}
                </span>
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {allImages.map((_, i) => (
                  <button key={i} type="button" onClick={(e) => { e.stopPropagation(); setCarouselIdx(i); }} className={`h-1 rounded-full transition-all ${i === carouselIdx ? "w-4 bg-white" : "w-1 bg-white/60"}`} />
                ))}
              </div>
              {carouselIdx > 0 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); setCarouselIdx((i) => i - 1); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur text-white grid place-items-center opacity-0 group-hover:opacity-100 transition">←</button>
              )}
              {carouselIdx < allImages.length - 1 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); setCarouselIdx((i) => i + 1); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur text-white grid place-items-center opacity-0 group-hover:opacity-100 transition">→</button>
              )}
            </>
          )}

          {tagged.length > 0 && (
            <div className="absolute bottom-2 left-2">
              <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                <HiOutlineShoppingBag className="text-xs" /> {tagged.length} products
              </span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-3.5 pt-2.5 pb-3">
        <div className="flex items-center gap-0.5 mb-2 relative">
          <div ref={reactionRef} className="relative">
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 8 }}
                  className="absolute bottom-full mb-2 left-0 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-ink/10 px-2 py-1.5 flex items-center gap-1 z-30"
                >
                  {EMOJI_REACTIONS.map((emo) => (
                    <button key={emo} type="button" onClick={() => pickReaction(emo)} className="text-xl hover:scale-125 transition-transform">
                      {emo}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="button"
              onClick={toggleLike}
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={handleLongPressStart}
              onTouchEnd={handleLongPressEnd}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${liked ? "text-red-500 bg-red-50 dark:bg-red-950/30" : "text-ink/50 hover:bg-ink/5"}`}
            >
              {liked ? <HiHeart className="text-base" /> : <HiOutlineHeart className="text-base" />}
              {likeCount > 0 && formatCount(likeCount)}
            </button>
          </div>
          <button type="button" onClick={() => onOpen?.(post)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-ink/50 hover:bg-ink/5 transition">
            <HiOutlineChatBubbleOvalLeft className="text-base" /> {post.commentCount > 0 && formatCount(post.commentCount)}
          </button>
          <button type="button" onClick={handleShare} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-ink/50 hover:bg-ink/5 transition">
            <HiOutlinePaperAirplane className="text-base" />
          </button>
          {post.views > 0 && (
            <span className="ml-1 flex items-center gap-1 text-[10px] text-ink/30">
              <HiOutlineEye className="text-xs" /> {formatCount(post.views)}
            </span>
          )}
          <div className="flex-1" />
          <button type="button" onClick={toggleSave} className={`px-2 py-1 rounded-lg text-xs transition ${saved ? "text-mauve" : "text-ink/40 hover:bg-ink/5"}`}>
            {saved ? <HiBookmark className="text-base" /> : <HiOutlineBookmark className="text-base" />}
          </button>
        </div>
        {post.caption && (
          <p className="text-xs text-ink dark:text-cream/80 leading-relaxed line-clamp-2">
            <span className="font-semibold">{post.author?.name?.split(" ")[0]} </span>
            {post.caption}
          </p>
        )}
        {post.commentCount > 0 && (
          <button type="button" onClick={() => onOpen?.(post)} className="text-[10px] text-ink/40 hover:text-ink/60 mt-1 transition">
            View all {post.commentCount} comments
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ===================== REEL CARD ===================== */
function ReelCard({ reel, onPlay, onDeleted, onEdited }) {
  const user = useAuthStore((s) => s.user);
  const safeLikes = toArray(reel?.likes);
  const [liked, setLiked] = useState(safeLikes.includes?.(user?._id) ?? false);
  const [likeCount, setLikeCount] = useState(safeLikes.length || 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isOwner = user?._id === reel?.author?._id;
  const thumb = reel?.thumbnail || toArray(reel?.media)[0]?.url;
  const duration = reel?.duration || "0:30";

  useEffect(() => {
    function handle(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function toggleLike() {
    if (!user) { toast.error("Login karein pehle"); return; }
    const wasLiked = liked;
    setLiked(!wasLiked); setLikeCount((c) => c + (wasLiked ? -1 : 1));
    try {
      const { data } = await api.post(`/posts/${reel._id}/like`);
      if (typeof data?.liked === "boolean") setLiked(data.liked);
      if (typeof data?.likeCount === "number") setLikeCount(data.likeCount);
    } catch {
      setLiked(wasLiked); setLikeCount((c) => c + (wasLiked ? 1 : -1));
    }
  }

  if (!reel?._id) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
      className="relative rounded-2xl overflow-hidden bg-ink aspect-[9/16] group cursor-pointer shadow-md hover:shadow-2xl hover:shadow-coral/20 transition-all duration-300"
      onClick={() => onPlay?.(reel)}
    >
      {thumb ? (
        <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-coral/40 to-mauve/40 grid place-items-center">
          <HiOutlineFilm className="text-5xl text-white/30" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />

      <div className="absolute top-2 left-2 flex items-center gap-1.5">
        <span className="bg-black/60 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
          <HiOutlineClock className="text-[10px]" /> {duration}
        </span>
        {reel.views > 1000 && (
          <span className="bg-coral/90 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
            <HiOutlineFire className="text-[10px]" /> Hot
          </span>
        )}
      </div>

      <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition duration-300">
        <motion.div whileHover={{ scale: 1.1 }} className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 grid place-items-center">
          <HiOutlinePlay className="text-white text-2xl ml-0.5" />
        </motion.div>
      </div>

      {isOwner && (
        <div ref={menuRef} className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => setMenuOpen((v) => !v)} className="w-7 h-7 rounded-full bg-black/50 backdrop-blur text-white grid place-items-center hover:bg-black/70 transition">
            <HiOutlineEllipsisHorizontal />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-white dark:bg-zinc-900 border border-ink/10 shadow-lg py-1">
                <button type="button" onClick={() => { setMenuOpen(false); onEdited?.(reel); }} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-ink/5"><HiOutlinePencilSquare /> Edit</button>
                <button type="button" onClick={async () => {
                  if (!window.confirm("Yeh reel delete karni hai?")) return;
                  try { await api.delete(`/posts/${reel._id}`); toast.success("Reel delete ho gayi"); onDeleted?.(reel._id); }
                  catch { toast.error("Delete nahi ho saki"); }
                }} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-coral hover:bg-coral/5"><HiOutlineTrash /> Delete</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white text-[11px] font-semibold line-clamp-2">
          {reel.caption}
        </p>

        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike();
            }}
            className="flex items-center gap-1 text-[10px] text-white/70 hover:text-coral"
          >
            {liked ? (
              <HiHeart className="text-coral text-sm" />
            ) : (
              <HiOutlineHeart className="text-sm" />
            )}

            {likeCount > 0 && likeCount}
          </button>

          <Link
            to={`/profile/${reel.author?._id}`}
            onClick={(e) => e.stopPropagation()}F
            className="ml-auto"
          >
            <Avatar
              src={reel.author?.avatar}
              name={reel.author?.name}
              size="xs"
            />
          </Link>
        </div>
        {reel.caption && <p className="text-white text-[11px] font-medium line-clamp-2 mb-2 drop-shadow-md">{reel.caption}</p>}
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={(e) => { e.stopPropagation(); toggleLike(); }} className={`flex items-center gap-1 text-[11px] font-bold transition-colors ${liked ? "text-red-400" : "text-white"}`}>
            {liked ? <HiHeart className="text-sm" /> : <HiOutlineHeart className="text-sm" />}
            {likeCount > 0 && formatCount(likeCount)}
          </button>
          {reel.views > 0 && (
            <span className="flex items-center gap-1 text-white/80 text-[10px] font-medium">
              <HiOutlineEye className="text-xs" /> {formatCount(reel.views)}
            </span>
          )}
        </div>
      </div>

      {reel.music && (
        <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-full">
          <HiOutlineMusicalNote className="text-xs animate-pulse" />
        </div>
      )}
    </motion.div>
  );
}

/* ===================== VIDEO MODAL ===================== */
function VideoModal({ reel, onClose }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoUrl = toArray(reel?.media).find((m) => m?.kind === "video")?.url;

  useEffect(() => {
    if (videoRef.current && videoUrl) videoRef.current.play().catch(() => {});
  }, [videoUrl]);

  function togglePlay() {
    if (!videoRef.current) return;
    if (playing) videoRef.current.pause();
    else videoRef.current.play().catch(() => {});
    setPlaying(!playing);
  }

  function onTimeUpdate() {
    if (!videoRef.current) return;
    const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(p || 0);
  }

  if (!reel) return null;

  return (
    <Modal open={!!reel} onClose={onClose} title="">
      <div className="space-y-3 -mt-2">
        <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-[65vh] mx-auto" onClick={togglePlay}>
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              poster={reel.thumbnail}
              loop
              muted={muted}
              playsInline
              onTimeUpdate={onTimeUpdate}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full grid place-items-center"><HiOutlineFilm className="text-4xl text-white/30" /></div>
          )}

          <AnimatePresence>
            {!playing && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md grid place-items-center">
                  <HiOutlinePlay className="text-white text-3xl ml-1" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button type="button" onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur text-white grid place-items-center">
            {muted ? <HiOutlineSpeakerXMark /> : <HiOutlineSpeakerWave />}
          </button>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div className="h-full bg-coral transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-1">
          <Avatar src={reel.author?.avatar} name={reel.author?.name} size={34} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink dark:text-cream truncate">{reel.author?.name}</p>
            <p className="text-[11px] text-ink/40">{timeAgo(reel.createdAt)}</p>
          </div>
          <button type="button" className="text-xs font-bold text-white bg-coral px-3 py-1.5 rounded-full hover:opacity-90 shrink-0">Follow</button>
        </div>

        {reel.caption && <p className="text-sm text-ink dark:text-cream/80 leading-relaxed px-1">{reel.caption}</p>}
      </div>
    </Modal>
  );
}

/* ===================== POST MODAL ===================== */
function PostModal({ post, onClose }) {
  const [idx, setIdx] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loadingC, setLoadingC] = useState(false);

  useEffect(() => {
    if (!post?._id) return;
    setLoadingC(true);
    api.get(`/posts/${post._id}/comments`)
      .then(({ data }) => setComments(toArray(data?.items || data?.comments)))
      .catch(() => setComments([]))
      .finally(() => setLoadingC(false));
  }, [post?._id]);

  async function postComment() {
    if (!newComment.trim() || !post?._id) return;
    try {
      const { data } = await api.post(`/posts/${post._id}/comments`, { text: newComment });
      if (data?.comment) setComments((c) => [data.comment, ...c]);
      else setComments((c) => [{ _id: Date.now(), text: newComment, createdAt: new Date() }, ...c]);
      setNewComment("");
      toast.success("Comment added");
    } catch { toast.error("Comment fail"); }
  }

  if (!post) return null;
  const imgs = toArray(post.media).filter((m) => m && (m.kind === "image" || !m.kind) && m.url);

  return (
    <Modal open={!!post} onClose={onClose} title="">
      <div className="space-y-4 -mt-2 max-h-[80vh] overflow-y-auto scrollbar-none">
        {imgs.length > 0 && (
          <div className="relative rounded-xl overflow-hidden bg-ink/5">
            <img src={imgs[idx]?.url} alt="" className="w-full max-h-[50vh] object-contain" />
            {imgs.length > 1 && (
              <>
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                  {imgs.map((_, i) => <button key={i} type="button" onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />)}
                </div>
                {idx > 0 && <button type="button" onClick={() => setIdx(idx - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur text-white grid place-items-center">←</button>}
                {idx < imgs.length - 1 && <button type="button" onClick={() => setIdx(idx + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur text-white grid place-items-center">→</button>}
              </>
            )}
          </div>
        )}
        <div className="flex items-center gap-2.5">
          <Avatar src={post.author?.avatar} name={post.author?.name} size={36} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink dark:text-cream truncate">{post.author?.name}</p>
            <p className="text-[11px] text-ink/40">{timeAgo(post.createdAt)}</p>
          </div>
          <button type="button" className="text-xs font-bold text-coral hover:bg-coral/5 px-3 py-1 rounded-full shrink-0">+ Follow</button>
        </div>
        {post.caption && <p className="text-sm text-ink dark:text-cream/80 leading-relaxed">{post.caption}</p>}

        {/* Comments */}
        <div className="border-t border-ink/5 pt-3 space-y-3">
          <div className="flex items-center gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") postComment(); }}
              placeholder="Comment likho..."
              className="flex-1 bg-ink/5 dark:bg-white/5 rounded-full px-4 py-2 text-xs outline-none focus:bg-coral/5 transition"
            />
            <button type="button" onClick={postComment} disabled={!newComment.trim()} className="text-xs font-bold text-coral disabled:opacity-40">
              Post
            </button>
          </div>
          {loadingC ? (
            <div className="text-center py-4"><Spinner size={16} /></div>
          ) : comments.length > 0 ? (
            <div className="space-y-2.5 max-h-48 overflow-y-auto">
              {comments.map((c) => (
                <div key={c._id || c.id || Math.random()} className="flex gap-2">
                  <Avatar src={c.author?.avatar} name={c.author?.name} size={26} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px]">
                      <span className="font-semibold">{c.author?.name || "User"}</span>{" "}
                      <span className="text-ink/70 dark:text-cream/70">{c.text}</span>
                    </p>
                    <p className="text-[9px] text-ink/30 mt-0.5">{timeAgo(c.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-ink/40 text-center py-2">Pehla comment karo!</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ===================== COMPOSE MODAL ===================== */
function ComposeModal({ open, onClose, onPosted, editPost }) {
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const isEdit = Boolean(editPost);

  useEffect(() => {
    if (open) {
      setCaption(editPost?.caption || "");
      setMedia([]);
      setLocation(editPost?.location || "");
      setPrivacy(editPost?.privacy || "public");
    }
  }, [open, editPost]);

  async function submit(e) {
    e?.preventDefault?.();
    const cleaned = cleanMedia(media, "image");
    if (!caption.trim() && cleaned.length === 0 && !isEdit) {
      toast.error("Caption ya photo zaroori hai");
      return;
    }
    if (toArray(media).length > 0 && cleaned.length === 0) {
      toast.error("Image upload hone ka wait karo");
      return;
    }
    setLoading(true);
    try {
      let data;
      if (isEdit) {
        ({ data } = await api.patch(`/posts/${editPost._id}`, { caption, location, privacy }));
        toast.success("Post update ho gayi ✅");
      } else {
        ({ data } = await api.post("/posts", {
          caption,
          kind: cleaned.length > 0 ? "photo" : "text",
          media: cleaned,
          location: location || undefined,
          privacy,
        }));
        toast.success("Post publish ho gayi 🎉");
      }
      onPosted?.(data?.post || data, isEdit);
      setCaption(""); setMedia([]); setLocation("");
    } catch (err) {
      console.error("Post error:", err);
      toast.error(err?.response?.data?.error || err?.response?.data?.message || "Post nahi ho saki");
    } finally { setLoading(false); }
  }

  const charCount = caption.length;
  const maxChars = 2200;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Post edit karo" : "Naya post ✨"}>
      <form onSubmit={submit} className="space-y-4">
        {!isEdit && (
          <div className="rounded-xl border-2 border-dashed border-ink/10 p-4 hover:border-coral/30 transition">
            <MediaUploader
              label="Photos add karo"
              value={toArray(media)}
              onChange={(v) => setMedia(toArray(v))}
              multiple
              accept="image/*"
              maxFiles={10}
            />
          </div>
        )}

        <div className="relative">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, maxChars))}
            placeholder="Apni story share karo... #hashtag use karo"
            rows={4}
            className="w-full rounded-xl border border-ink/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-coral resize-none transition"
          />
          <div className="absolute bottom-2 right-3 text-[10px] text-ink/30">{charCount}/{maxChars}</div>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-ink/40 uppercase tracking-wider mb-1.5">Quick hashtags</p>
          <div className="flex flex-wrap gap-1.5">
            {HASHTAGS.slice(0, 6).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setCaption((c) => c.includes(`#${h}`) ? c : `${c} #${h}`.trim())}
                className="px-2 py-1 rounded-full bg-coral/10 text-coral text-[10px] font-medium hover:bg-coral/20 transition"
              >
                #{h}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="relative">
            <HiOutlineMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 text-sm" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-ink/10 bg-white dark:bg-white/5 text-xs outline-none focus:border-coral"
            />
          </div>
          <select value={privacy} onChange={(e) => setPrivacy(e.target.value)} className="px-3 py-2 rounded-xl border border-ink/10 bg-white dark:bg-white/5 text-xs outline-none focus:border-coral">
            <option value="public">🌐 Public</option>
            <option value="followers">👥 Followers only</option>
            <option value="private">🔒 Only me</option>
          </select>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <span className="flex items-center justify-center gap-2"><Spinner size={14} /> Publishing...</span> : isEdit ? "Update Post" : "🚀 Publish Post"}
        </Button>
      </form>
    </Modal>
  );
}

/* ===================== REEL MODAL (4-step wizard) ===================== */
function ReelModal({ open, onClose, onPosted, editReel }) {
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState([]);
  const [thumbnail, setThumbnail] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [autoThumbFrames, setAutoThumbFrames] = useState([]);
  const [selectedFrameIdx, setSelectedFrameIdx] = useState(null);
  const [thumbMode, setThumbMode] = useState("upload");
  const [extractingFrames, setExtractingFrames] = useState(false);
  const [music, setMusic] = useState("");
  const [location, setLocation] = useState("");
  const isEdit = Boolean(editReel);

  useEffect(() => {
    if (open) {
      setCaption(editReel?.caption || "");
      setMedia([]);
      setThumbnail([]);
      setStep(0);
      setAutoThumbFrames([]);
      setSelectedFrameIdx(null);
      setThumbMode("upload");
      setMusic(editReel?.music || "");
      setLocation(editReel?.location || "");
    }
  }, [open, editReel]);

  // SAFE: always cast to array first
  const videoCleaned = useMemo(() => cleanMedia(media, "video"), [media]);
  const thumbCleaned = useMemo(() => cleanMedia(thumbnail, "image"), [thumbnail]);
  const hasVideo = videoCleaned.length > 0;
  const hasThumbnail = thumbCleaned.length > 0 || selectedFrameIdx !== null;

  async function extractFrames() {
    if (!hasVideo) return;
    const url = videoCleaned[0].url;
    setExtractingFrames(true);
    setAutoThumbFrames([]);

    try {
      const video = document.createElement("video");
      video.src = url;
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;

      await new Promise((res, rej) => {
        const timeout = setTimeout(() => rej(new Error("timeout")), 10000);
        video.onloadedmetadata = () => { clearTimeout(timeout); res(); };
        video.onerror = () => { clearTimeout(timeout); rej(new Error("load error")); };
      });

      const duration = video.duration || 10;
      const positions = [duration * 0.1, duration * 0.3, duration * 0.5, duration * 0.75];
      const frames = [];

      const canvas = document.createElement("canvas");
      canvas.width = 360;
      canvas.height = 640;
      const ctx = canvas.getContext("2d");

      for (const pos of positions) {
        try {
          video.currentTime = pos;
          await new Promise((res) => {
            const t = setTimeout(res, 2000);
            video.onseeked = () => { clearTimeout(t); res(); };
          });
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL("image/jpeg", 0.7));
        } catch (e) { console.warn("Frame skip:", e); }
      }
      setAutoThumbFrames(frames);
      if (frames.length === 0) toast.error("Frames extract nahi ho paye, image upload karo");
    } catch (e) {
      console.warn("Frame extract failed", e);
      toast.error("Video se frames nahi nikle. Manual upload try karo");
    } finally {
      setExtractingFrames(false);
    }
  }

  useEffect(() => {
    if (step === 1 && hasVideo && autoThumbFrames.length === 0 && thumbMode === "frames") {
      extractFrames();
    }
    // eslint-disable-next-line
  }, [step, thumbMode, hasVideo]);

  async function submit() {
    if (!isEdit && !hasVideo) {
      toast.error("Video upload karo pehle");
      return;
    }
    setLoading(true);
    try {
      let data;
      if (isEdit) {
        ({ data } = await api.patch(`/posts/${editReel._id}`, { caption, music, location }));
        toast.success("Reel update ho gayi ✅");
      } else {
        const payload = {
          caption,
          kind: "video",
          media: videoCleaned,
          music: music || undefined,
          location: location || undefined,
        };
        if (thumbCleaned.length > 0) payload.thumbnail = thumbCleaned[0].url;
        else if (selectedFrameIdx !== null && autoThumbFrames[selectedFrameIdx]) {
          payload.thumbnail = autoThumbFrames[selectedFrameIdx];
        }
        ({ data } = await api.post("/posts", payload));
        toast.success("Reel upload ho gayi 🎬");
      }
      onPosted?.(data?.post || data, isEdit);
    } catch (err) {
      console.error("Reel error:", err);
      toast.error(err?.response?.data?.error || err?.response?.data?.message || "Reel upload fail");
    } finally { setLoading(false); }
  }

  const steps = [
    { label: "Video", icon: <HiOutlineVideoCamera /> },
    { label: "Thumbnail", icon: <HiOutlinePhoto /> },
    { label: "Details", icon: <HiOutlineSparkles /> },
    { label: "Publish", icon: <HiOutlineCheck /> },
  ];

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Reel edit karo" : "🎬 Reel banao"}>
      {!isEdit ? (
        <div className="space-y-5">
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => { if (i === 0 || (i >= 1 && hasVideo)) setStep(i); }}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-[10px] font-semibold transition-all flex-1 justify-center min-w-0 ${
                    i === step ? "bg-gradient-to-r from-coral to-mauve text-white shadow-sm scale-105" :
                    i < step ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                    "bg-ink/5 text-ink/40"
                  }`}
                >
                  <span className="text-sm">{i < step ? <HiOutlineCheck /> : s.icon}</span>
                  <span className="hidden sm:inline truncate">{s.label}</span>
                </button>
                {i < steps.length - 1 && <div className={`h-0.5 w-1.5 sm:w-3 transition-colors ${i < step ? "bg-emerald-400" : "bg-ink/10"}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="text-center p-3 bg-gradient-to-br from-coral/5 to-mauve/5 rounded-xl border border-coral/10">
                  <HiOutlineVideoCamera className="text-3xl text-coral mx-auto mb-1" />
                  <p className="text-xs font-bold text-ink dark:text-cream">Video upload karo</p>
                  <p className="text-[10px] text-ink/40 mt-0.5">9:16 portrait • Max 60 sec • Best quality</p>
                </div>
                <div className="rounded-xl border-2 border-dashed border-coral/20 p-4 bg-coral/5 hover:border-coral/40 transition">
                  <MediaUploader
                    label="Video file"
                    value={toArray(media)}
                    onChange={(v) => setMedia(toArray(v))}
                    accept="video/*"
                    maxFiles={1}
                  />
                </div>
                {hasVideo && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-xl overflow-hidden aspect-[9/16] max-h-56 mx-auto bg-black">
                    <video src={videoCleaned[0].url} className="w-full h-full object-contain" muted loop autoPlay playsInline />
                    <div className="absolute top-2 left-2 bg-emerald-500/90 backdrop-blur text-white text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <HiOutlineCheck /> Ready
                    </div>
                  </motion.div>
                )}
                <Button type="button" className="w-full" disabled={!hasVideo} onClick={() => setStep(1)}>
                  {!hasVideo ? "Video upload karo" : "Next: Thumbnail →"}
                </Button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="text-center p-3 bg-gradient-to-br from-mauve/5 to-pink-100/30 dark:to-mauve/10 rounded-xl border border-mauve/10">
                  <HiOutlinePhoto className="text-3xl text-mauve mx-auto mb-1" />
                  <p className="text-xs font-bold text-ink dark:text-cream">Thumbnail set karo</p>
                  <p className="text-[10px] text-ink/40 mt-0.5">Achhi thumbnail = 3x zyada views 🚀</p>
                </div>

                <div className="flex items-center gap-1 bg-ink/5 dark:bg-white/5 rounded-full p-1">
                  <button type="button" onClick={() => setThumbMode("upload")} className={`flex-1 py-1.5 rounded-full text-[11px] font-semibold transition flex items-center justify-center gap-1.5 ${thumbMode === "upload" ? "bg-white dark:bg-zinc-800 text-ink dark:text-cream shadow-sm" : "text-ink/50"}`}>
                    <HiOutlinePhoto /> Upload Image
                  </button>
                  <button type="button" onClick={() => setThumbMode("frames")} className={`flex-1 py-1.5 rounded-full text-[11px] font-semibold transition flex items-center justify-center gap-1.5 ${thumbMode === "frames" ? "bg-white dark:bg-zinc-800 text-ink dark:text-cream shadow-sm" : "text-ink/50"}`}>
                    <TbWand /> Pick From Video
                  </button>
                </div>

                {thumbMode === "upload" && (
                  <>
                    <div className="rounded-xl border-2 border-dashed border-mauve/20 p-4 bg-mauve/5">
                      <MediaUploader
                        label="Thumbnail image"
                        value={toArray(thumbnail)}
                        onChange={(v) => { setThumbnail(toArray(v)); setSelectedFrameIdx(null); }}
                        accept="image/*"
                        maxFiles={1}
                      />
                    </div>
                    {thumbCleaned.length > 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative rounded-xl overflow-hidden aspect-[9/16] max-h-64 mx-auto bg-ink/5">
                        <img src={thumbCleaned[0].url} alt="Thumbnail" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute top-2 left-2 bg-emerald-500/90 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">✓ Preview</div>
                        <button type="button" onClick={() => setThumbnail([])} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur text-white grid place-items-center">
                          <HiOutlineXMark />
                        </button>
                      </motion.div>
                    )}
                  </>
                )}

                {thumbMode === "frames" && (
                  <div className="space-y-3">
                    {extractingFrames ? (
                      <div className="text-center py-10 bg-ink/5 rounded-xl">
                        <Spinner />
                        <p className="text-[11px] text-ink/50 mt-2">Frames extract ho rahe hain...</p>
                      </div>
                    ) : autoThumbFrames.length > 0 ? (
                      <>
                        <p className="text-[10px] font-semibold text-ink/50 uppercase tracking-wider">Pick a frame</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {autoThumbFrames.map((frame, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => { setSelectedFrameIdx(i); setThumbnail([]); }}
                              className={`relative aspect-[9/16] rounded-lg overflow-hidden border-2 transition-all ${selectedFrameIdx === i ? "border-coral shadow-md scale-105" : "border-transparent hover:border-ink/20"}`}
                            >
                              <img src={frame} alt={`Frame ${i + 1}`} className="w-full h-full object-cover" />
                              {selectedFrameIdx === i && (
                                <div className="absolute inset-0 bg-coral/20 grid place-items-center">
                                  <div className="w-6 h-6 rounded-full bg-coral text-white grid place-items-center">
                                    <HiOutlineCheck className="text-xs" />
                                  </div>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <button type="button" onClick={extractFrames} className="w-full py-6 bg-mauve/5 rounded-xl border-2 border-dashed border-mauve/30 text-mauve text-xs font-semibold hover:bg-mauve/10 transition flex flex-col items-center gap-2">
                        <TbWand className="text-2xl" />
                        Extract Frames From Video
                      </button>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="button" className="flex-1 bg-white dark:bg-zinc-800 text-ink dark:text-cream border border-ink/10 hover:bg-ink/5" onClick={() => setStep(0)}>← Back</Button>
                  <Button type="button" className="flex-1" onClick={() => setStep(2)}>{hasThumbnail ? "Next →" : "Skip →"}</Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-1.5 block">Caption</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value.slice(0, 300))}
                    placeholder="Reel ke baare mein... #hashtag use karo"
                    rows={3}
                    className="w-full rounded-xl border border-ink/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-coral resize-none"
                  />
                  <p className="text-[10px] text-ink/30 mt-1 text-right">{caption.length}/300</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {HASHTAGS.slice(0, 5).map((h) => (
                    <button key={h} type="button" onClick={() => setCaption((c) => c.includes(`#${h}`) ? c : `${c} #${h}`.trim())} className="px-2 py-1 rounded-full bg-coral/10 text-coral text-[10px] font-medium hover:bg-coral/20 transition">
                      #{h}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <HiOutlineMusicalNote className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 text-sm" />
                    <input value={music} onChange={(e) => setMusic(e.target.value)} placeholder="Music (optional)" className="w-full pl-8 pr-3 py-2 rounded-xl border border-ink/10 bg-white dark:bg-white/5 text-xs outline-none focus:border-coral" />
                  </div>
                  <div className="relative">
                    <HiOutlineMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 text-sm" />
                    <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="w-full pl-8 pr-3 py-2 rounded-xl border border-ink/10 bg-white dark:bg-white/5 text-xs outline-none focus:border-coral" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="button" className="flex-1 bg-white dark:bg-zinc-800 text-ink dark:text-cream border border-ink/10 hover:bg-ink/5" onClick={() => setStep(1)}>← Back</Button>
                  <Button type="button" className="flex-1" onClick={() => setStep(3)}>Next →</Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <p className="text-[10px] font-bold text-ink/50 uppercase tracking-wider">Final Review</p>

                <div className="flex gap-3 p-3 bg-gradient-to-br from-coral/5 to-mauve/5 rounded-xl border border-coral/10">
                  <div className="w-20 aspect-[9/16] rounded-lg overflow-hidden shrink-0 bg-ink/10 relative">
                    {thumbCleaned.length > 0 ? (
                      <img src={thumbCleaned[0].url} alt="" className="w-full h-full object-cover" />
                    ) : selectedFrameIdx !== null && autoThumbFrames[selectedFrameIdx] ? (
                      <img src={autoThumbFrames[selectedFrameIdx]} alt="" className="w-full h-full object-cover" />
                    ) : hasVideo ? (
                      <video src={videoCleaned[0].url} muted className="w-full h-full object-cover" playsInline />
                    ) : (
                      <div className="w-full h-full grid place-items-center"><HiOutlineFilm className="text-ink/30" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <HiOutlineCheck className="text-emerald-500" />
                      <span className="text-ink/70 dark:text-cream/70 font-medium">Video ready</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      {hasThumbnail ? (
                        <><HiOutlineCheck className="text-emerald-500" /><span className="text-ink/70 dark:text-cream/70 font-medium">Custom thumbnail</span></>
                      ) : (
                        <><HiOutlineXMark className="text-amber-500" /><span className="text-ink/50">Auto thumbnail</span></>
                      )}
                    </div>
                    {caption && <p className="text-[10px] text-ink/60 dark:text-cream/60 line-clamp-2 italic">"{caption}"</p>}
                    {music && <div className="flex items-center gap-1 text-[10px] text-mauve"><HiOutlineMusicalNote /> {music}</div>}
                    {location && <div className="flex items-center gap-1 text-[10px] text-coral"><HiOutlineMapPin /> {location}</div>}
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 border border-amber-100 dark:border-amber-900/30">
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                    <HiOutlineSparkles /> PRO TIPS
                  </p>
                  <ul className="text-[10px] text-amber-700/80 dark:text-amber-400/70 space-y-0.5">
                    <li>• 6-9 PM mein post karo — 2x engagement</li>
                    <li>• 3 relevant hashtags zaroor use karo</li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button type="button" className="flex-1 bg-white dark:bg-zinc-800 text-ink dark:text-cream border border-ink/10 hover:bg-ink/5" onClick={() => setStep(2)}>← Back</Button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={loading || !hasVideo}
                    className="flex-1 bg-gradient-to-r from-coral to-mauve text-white py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-coral/30"
                  >
                    {loading ? <><Spinner size={14} /> Publishing...</> : <><TbVideoPlus className="text-base" /> Publish Reel 🎬</>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption..." rows={3} className="w-full rounded-xl border border-ink/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-coral resize-none" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input value={music} onChange={(e) => setMusic(e.target.value)} placeholder="Music" className="px-3 py-2 rounded-xl border border-ink/10 bg-white dark:bg-white/5 text-xs outline-none focus:border-coral" />
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="px-3 py-2 rounded-xl border border-ink/10 bg-white dark:bg-white/5 text-xs outline-none focus:border-coral" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Loading..." : "Update Reel"}</Button>
        </form>
      )}
    </Modal>
  );
}

/* ===================== TRENDING SIDEBAR ===================== */
function TrendingSidebar({ hashtag, setHashtag }) {
  return (
    <aside className="hidden xl:block w-72 shrink-0">
      <div className="sticky top-24 space-y-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-ink/5 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-coral to-mauve grid place-items-center">
                <HiOutlineFire className="text-white text-sm" />
              </div>
              <h3 className="text-sm font-bold text-ink dark:text-cream">Trending Now</h3>
            </div>
            <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full">LIVE</span>
          </div>
          <div className="space-y-1">
            {TRENDING_TOPICS.map((t, i) => (
              <button key={t.tag} type="button" onClick={() => setHashtag(hashtag === t.tag ? null : t.tag)} className={`w-full text-left px-3 py-2 rounded-xl transition-all group ${hashtag === t.tag ? "bg-coral/10 text-coral" : "hover:bg-ink/5 text-ink/70 dark:text-cream/70"}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black w-5 ${i === 0 ? "text-coral" : "text-ink/30"}`}>#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">#{t.tag}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-ink/40">
                      <span>{t.count} posts</span>
                      <span className="text-emerald-500 font-bold">{t.growth}</span>
                    </div>
                  </div>
                  <HiOutlineArrowUp className="text-[10px] text-emerald-500 shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-ink/5 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center">
                <HiOutlineSparkles className="text-white text-sm" />
              </div>
              <h3 className="text-sm font-bold text-ink dark:text-cream">Aapke liye</h3>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { name: "Khadi Studio", craft: "Handloom", followers: "12.4K", gradient: "from-emerald-400 to-teal-500" },
              { name: "Madhubani Art", craft: "Painting", followers: "8.7K", gradient: "from-amber-400 to-orange-500" },
              { name: "Block Print Co", craft: "Textile", followers: "5.2K", gradient: "from-rose-400 to-pink-500" },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.gradient} grid place-items-center text-white font-bold text-sm shrink-0`}>
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink dark:text-cream truncate">{c.name}</p>
                  <p className="text-[10px] text-ink/40">{c.craft} · {c.followers}</p>
                </div>
                <button type="button" className="text-[10px] font-bold text-coral hover:bg-coral/5 px-2 py-1 rounded-full transition">Follow</button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-mauve/10 via-coral/5 to-amber-100/30 dark:to-amber-900/10 rounded-2xl border border-mauve/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-mauve to-pink-500 grid place-items-center">
              <HiOutlineSparkles className="text-white text-sm" />
            </div>
            <h3 className="text-sm font-bold text-ink dark:text-cream">Creator Tips</h3>
          </div>
          <ul className="space-y-2 text-[11px] text-ink/70 dark:text-cream/70">
            <li className="flex items-start gap-1.5"><HiOutlineStar className="text-amber-400 shrink-0 mt-0.5" /><span>Custom thumbnail = <b>3x views</b></span></li>
            <li className="flex items-start gap-1.5"><HiOutlineStar className="text-amber-400 shrink-0 mt-0.5" /><span>Trending hashtags use karo</span></li>
            <li className="flex items-start gap-1.5"><HiOutlineStar className="text-amber-400 shrink-0 mt-0.5" /><span><b>6-9 PM</b> peak engagement</span></li>
            <li className="flex items-start gap-1.5"><HiOutlineStar className="text-amber-400 shrink-0 mt-0.5" /><span>Pehle 3 sec mein hook lagao</span></li>
          </ul>
        </div>

        <p className="text-[9px] text-ink/30 text-center px-3">
          © {new Date().getFullYear()} · Made with ❤️ in India
        </p>
      </div>
    </aside>
  );
}

/* ===================== FAB ===================== */
function FloatingActionButton({ onPost, onReel }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-20 right-4 sm:hidden z-30">
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-16 right-0 flex flex-col gap-2">
            <motion.button type="button" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }} transition={{ delay: 0.05 }} onClick={() => { onPost(); setOpen(false); }} className="bg-white dark:bg-zinc-800 text-ink dark:text-cream px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold border border-ink/10">
              <HiOutlinePhoto /> Post
            </motion.button>
            <motion.button type="button" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }} transition={{ delay: 0.1 }} onClick={() => { onReel(); setOpen(false); }} className="bg-gradient-to-r from-coral to-mauve text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold">
              <TbVideoPlus /> Reel
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button type="button" whileTap={{ scale: 0.9 }} animate={{ rotate: open ? 45 : 0 }} onClick={() => setOpen(!open)} className="w-14 h-14 rounded-full bg-gradient-to-br from-coral to-mauve text-white grid place-items-center shadow-xl shadow-coral/30">
        <HiOutlinePlusCircle className="text-2xl" />
      </motion.button>
    </div>
  );
}

/* ===================== MAIN FEED ===================== */
export default function Feed() {
  const user = useAuthStore((s) => s.user);
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [hashtag, setHashtag] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [reelOpen, setReelOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editingReel, setEditingReel] = useState(null);
  const [openPost, setOpenPost] = useState(null);
  const [playingReel, setPlayingReel] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sentinel = useRef(null);
  const [searchParams] = useSearchParams();

  const load = useCallback(async (p = 1, tag = hashtag, filter = activeFilter) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 12 };
      if (tag) params.hashtag = tag;
      if (filter && filter !== "all") params.filter = filter;
      const { data } = await api.get("/posts", { params });
      // SAFE: handle multiple response shapes
      const items = toArray(data?.items || data?.posts || data);
      const photoPosts = items.filter((i) => i && i.kind !== "video");
      const videoReels = items.filter((i) => i && i.kind === "video");
      setPosts((prev) => p === 1 ? photoPosts : [...prev, ...photoPosts]);
      setReels((prev) => p === 1 ? videoReels : [...prev, ...videoReels]);
      if (items.length < 12) setDone(true);
    } catch (err) {
      console.error("Feed load:", err);
      if (p === 1) { setPosts([]); setReels([]); }
    } finally { setLoading(false); }
  }, [hashtag, activeFilter]);

  useEffect(() => {
    setPosts([]); setReels([]); setPage(1); setDone(false);
    load(1, hashtag, activeFilter);
    // eslint-disable-next-line
  }, [hashtag, activeFilter]);

  useEffect(() => {
    const postId = searchParams.get("post");
    if (!postId) { setOpenPost(null); return; }
    api.get(`/posts/${postId}`)
      .then(({ data }) => { if (data?.post) setOpenPost(data.post); else if (data?._id) setOpenPost(data); })
      .catch(() => setOpenPost(null));
  }, [searchParams]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && !done) {
        const next = page + 1;
        setPage(next);
        load(next);
      }
    }, { rootMargin: "300px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [page, loading, done, load]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handlePostPosted(post, isEdit) {
    if (!post?._id) return;
    if (isEdit) setPosts((arr) => arr.map((p) => p._id === post._id ? post : p));
    else setPosts((arr) => [post, ...arr]);
    setComposeOpen(false); setEditingPost(null);
  }

  function handleReelPosted(reel, isEdit) {
    if (!reel?._id) return;
    if (isEdit) setReels((arr) => arr.map((r) => r._id === reel._id ? reel : r));
    else setReels((arr) => [reel, ...arr]);
    setReelOpen(false); setEditingReel(null);
  }

  const filteredPosts = useMemo(() => {
    if (!searchQuery) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter((p) =>
      p?.caption?.toLowerCase().includes(q) ||
      p?.author?.name?.toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

  const filteredReels = useMemo(() => {
    if (!searchQuery) return reels;
    const q = searchQuery.toLowerCase();
    return reels.filter((r) =>
      r?.caption?.toLowerCase().includes(q) ||
      r?.author?.name?.toLowerCase().includes(q)
    );
  }, [reels, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-5 md:py-8">
      <Reveal>
        <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-coral/10 to-mauve/10 text-coral text-[10px] font-bold px-2.5 py-1 rounded-full mb-2 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
              Live in the gully
            </div>
            <h1 className="font-fraunces text-2xl md:text-3xl lg:text-4xl text-ink dark:text-cream tracking-tight leading-none">
              Your Feed
            </h1>
            <p className="text-xs text-ink/40 mt-1">Curated by karma · Updated real-time ✨</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={() => setSearchOpen(!searchOpen)} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-ink/10 text-xs font-semibold text-ink dark:text-cream hover:bg-ink/5 transition shadow-sm">
              <HiOutlineMagnifyingGlass className="text-base" />
              <span>Search</span>
            </button>
            {user && (
              <>
                <button type="button" onClick={() => setComposeOpen(true)} className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-ink/10 text-xs font-semibold text-ink dark:text-cream hover:bg-ink/5 transition shadow-sm">
                  <HiOutlinePhoto className="text-base" /> Post
                </button>
                <button type="button" onClick={() => setReelOpen(true)} className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-coral to-mauve text-white text-xs font-bold hover:shadow-lg hover:shadow-coral/30 transition shadow-sm">
                  <TbVideoPlus className="text-base" /> Upload Reel
                </button>
              </>
            )}
          </div>
        </div>
      </Reveal>

      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
            <div className="relative">
              <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts, reels, creators..."
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white dark:bg-zinc-800 border border-ink/10 text-sm outline-none focus:border-coral transition"
                autoFocus
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70">
                  <HiOutlineXMark />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {user && <StoriesStrip user={user} />}

          <div className="flex items-center gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1">
            {FEED_FILTERS.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActiveFilter(f.key)}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                    activeFilter === f.key
                      ? "bg-ink dark:bg-white text-white dark:text-ink shadow-sm"
                      : "bg-white dark:bg-zinc-800 text-ink/60 dark:text-cream/60 border border-ink/10 hover:border-ink/30"
                  }`}
                >
                  <Icon className="text-sm" /> {f.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mb-5 gap-2">
            <div className="flex items-center gap-1 bg-white/60 dark:bg-white/5 rounded-full p-1 w-fit border border-ink/5 shadow-sm">
              {[
                { key: "posts", label: "Photos", icon: <HiOutlinePhoto />, count: filteredPosts.length },
                { key: "reels", label: "Reels", icon: <HiOutlineFilm />, count: filteredReels.length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                    activeTab === tab.key
                      ? "bg-ink dark:bg-white text-white dark:text-ink shadow-sm"
                      : "text-ink/50 dark:text-cream/50 hover:text-ink/80"
                  }`}
                >
                  {tab.icon} {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeTab === tab.key ? "bg-white/20" : "bg-ink/10"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setSearchOpen(!searchOpen)} className="sm:hidden w-9 h-9 rounded-full bg-white dark:bg-zinc-800 border border-ink/10 grid place-items-center text-ink/60">
              <HiOutlineMagnifyingGlass />
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
            <button type="button" onClick={() => setHashtag(null)} className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${!hashtag ? "bg-ink text-white border-ink shadow-sm" : "bg-white dark:bg-zinc-800 text-ink/60 border-ink/10 hover:border-ink/20"}`}>
              All
            </button>
            {HASHTAGS.map((h) => (
              <button key={h} type="button" onClick={() => setHashtag(hashtag === h ? null : h)} className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border flex items-center gap-1 transition-all ${hashtag === h ? "bg-coral text-white border-coral shadow-sm" : "bg-white dark:bg-zinc-800 text-ink/60 border-ink/10 hover:border-coral/30"}`}>
                <HiOutlineHashtag className="text-[10px]" />{h}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "posts" && (
              <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {filteredPosts.length === 0 && !loading ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-coral/10 to-mauve/10 grid place-items-center mx-auto mb-4">
                      <HiOutlinePhoto className="text-3xl text-coral" />
                    </div>
                    <p className="text-sm font-bold text-ink/60 mb-1">{searchQuery ? "Kuch nahi mila" : "Koi post nahi"}</p>
                    <p className="text-xs text-ink/40 mb-4">{searchQuery ? "Different keywords try karo" : "Pehli post banake start karo"}</p>
                    {user && !searchQuery && (
                      <button type="button" onClick={() => setComposeOpen(true)} className="px-4 py-2 bg-gradient-to-r from-coral to-mauve text-white text-xs font-bold rounded-full hover:shadow-lg transition">
                        Pehli post banao →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPosts.map((p, i) => (
                      <motion.div key={p._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.3) }}>
                        <PostCard post={p} onOpen={setOpenPost} onDeleted={(id) => setPosts((arr) => arr.filter((x) => x._id !== id))} onEdited={(post) => { setEditingPost(post); setComposeOpen(true); }} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "reels" && (
              <motion.div key="reels" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {filteredReels.length === 0 && !loading ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-coral/20 to-mauve/20 grid place-items-center mx-auto mb-4">
                      <TbVideoPlus className="text-3xl text-coral" />
                    </div>
                    <p className="text-sm font-bold text-ink/60 mb-1">{searchQuery ? "Koi reel nahi mili" : "Koi reel nahi"}</p>
                    <p className="text-xs text-ink/40 mb-4">{searchQuery ? "Try different search" : "Thumbnail ke saath reel upload karo!"}</p>
                    {user && !searchQuery && (
                      <button type="button" onClick={() => setReelOpen(true)} className="px-4 py-2 bg-gradient-to-r from-coral to-mauve text-white text-xs font-bold rounded-full hover:shadow-lg transition">
                        Pehli Reel Upload Karo 🎬
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredReels.map((r, i) => (
                      <motion.div key={r._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i * 0.04, 0.25) }}>
                        <ReelCard reel={r} onPlay={setPlayingReel} onDeleted={(id) => setReels((arr) => arr.filter((x) => x._id !== id))} onEdited={(reel) => { setEditingReel(reel); setReelOpen(true); }} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {loading && <div className="grid place-items-center py-10"><Spinner /></div>}
          {done && (posts.length > 0 || reels.length > 0) && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-[11px] text-ink/40 bg-ink/5 px-4 py-2 rounded-full">
                <HiOutlineSparkles /> Aap end pe pahunch gaye ✨
              </div>
            </div>
          )}
          <div ref={sentinel} className="h-10" />
        </div>

        <TrendingSidebar hashtag={hashtag} setHashtag={setHashtag} />
      </div>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="hidden sm:flex fixed bottom-6 right-6 w-11 h-11 rounded-full bg-ink dark:bg-white text-white dark:text-ink items-center justify-center shadow-lg z-30 hover:scale-110 transition-transform"
          >
            <HiOutlineArrowUp />
          </motion.button>
        )}
      </AnimatePresence>

      {user && <FloatingActionButton onPost={() => setComposeOpen(true)} onReel={() => setReelOpen(true)} />}

      <PostModal post={openPost} onClose={() => setOpenPost(null)} />
      <ComposeModal open={composeOpen} onClose={() => { setComposeOpen(false); setEditingPost(null); }} onPosted={handlePostPosted} editPost={editingPost} />
      <ReelModal open={reelOpen} onClose={() => { setReelOpen(false); setEditingReel(null); }} onPosted={handleReelPosted} editReel={editingReel} />
      <VideoModal reel={playingReel} onClose={() => setPlayingReel(null)} />
    </div>
  );
}