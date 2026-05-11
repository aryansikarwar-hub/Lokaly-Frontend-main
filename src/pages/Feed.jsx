import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlinePlusCircle,
  HiOutlineHashtag,
  HiHeart,
  HiOutlineHeart,
  HiOutlineChatBubbleOvalLeft,
  HiOutlinePaperAirplane,
  HiOutlineShieldCheck,
  HiOutlineShoppingBag,
  HiOutlinePhoto,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlineShare,
  HiOutlinePlay,
  HiOutlineFilm,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineEllipsisHorizontal,
  HiOutlineXMark,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { TbVideoPlus } from "react-icons/tb";
import api from "../services/api";
import { Reveal } from "../components/animations/Reveal";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import MediaUploader from "../components/ui/MediaUploader";
import { useAuthStore } from "../store/authStore";
import { Avatar } from "../components/ui/Avatar";
import toast from "react-hot-toast";

const HASHTAGS = ["handmadeinindia", "vocalforlocal", "desi", "indianartisan"];

/* ─── helpers ─── */
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ══════════════════════════════════════════
   POST CARD
══════════════════════════════════════════ */
function PostCard({ post, onOpen, onDeleted, onEdited }) {
  const user = useAuthStore((s) => s.user);
  const [liked, setLiked] = useState(post.likes?.includes?.(user?._id));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const img = post.media?.[0]?.url;
  const tagged = post.taggedProducts || [];
  const isOwner = user?._id === post.author?._id;

  // Close menu on outside click
  useEffect(() => {
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function toggleLike() {
    if (!user) return toast.error("Login karein pehle");
    setLiked((v) => !v);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch { /* non-fatal */ }
  }

  function toggleSave() {
    if (!user) return toast.error("Login karein pehle");
    setSaved((v) => !v);
    toast.success(saved ? "Saved se hataya" : "Post save ho gayi! 🔖");
  }

  function handleShare() {
    const url = `${window.location.origin}/feed?post=${post._id}`;
    if (navigator.share) {
      navigator.share({ title: post.author?.name, text: post.caption, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copy ho gaya! 📋");
    }
  }

  async function handleDelete() {
    if (!window.confirm("Yeh post delete karni hai?")) return;
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success("Post delete ho gayi");
      onDeleted?.(post._id);
    } catch {
      toast.error("Delete nahi ho saki");
    }
    setMenuOpen(false);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-32px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-2xl overflow-hidden bg-white dark:bg-white/5 border border-ink/5 dark:border-white/8 hover:border-ink/15 dark:hover:border-white/15 hover:shadow-soft transition-all duration-300 flex flex-col"
    >
      {/* ── image ── */}
      <div
        className="relative overflow-hidden cursor-pointer w-full shrink-0"
        style={{ paddingTop: "100%" }}
        onClick={() => onOpen?.(post)}
      >
        {img ? (
          <img
            src={img}
            alt={post.caption || "post"}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-lavender/20 dark:bg-lavender/10 grid place-items-center">
            <HiOutlinePhoto className="text-4xl text-ink/20 dark:text-cream/20" />
          </div>
        )}

        {/* overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* timestamp */}
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-ink/50 backdrop-blur-md text-[9px] font-jakarta font-semibold text-white/90 tracking-wide">
          {timeAgo(post.createdAt)}
        </div>

        {/* owner menu */}
        {isOwner && (
          <div ref={menuRef} className="absolute top-2.5 right-2.5">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="w-7 h-7 grid place-items-center rounded-full bg-ink/50 backdrop-blur-md text-white/80 hover:bg-ink/70 transition"
            >
              <HiOutlineEllipsisHorizontal className="text-sm" />
            </button>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-white dark:bg-zinc-900 border border-ink/10 dark:border-white/10 shadow-lg py-1 z-50"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdited?.(post); }}
                  className="w-full text-left px-3 py-2 text-xs font-jakarta text-ink/70 dark:text-cream/70 hover:bg-ink/5 dark:hover:bg-white/5 flex items-center gap-2"
                >
                  <HiOutlinePencilSquare className="text-sm" /> Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  className="w-full text-left px-3 py-2 text-xs font-jakarta text-coral hover:bg-coral/5 flex items-center gap-2"
                >
                  <HiOutlineTrash className="text-sm" /> Delete
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* tagged product */}
        {tagged[0] && (
          <Link
            to={`/product/${tagged[0]._id}`}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur text-ink text-[10px] font-jakarta font-semibold hover:bg-white transition shadow-soft"
          >
            <HiOutlineShoppingBag className="text-xs text-coral" />
            <span className="truncate max-w-[130px]">{tagged[0].title?.slice(0, 26)}</span>
          </Link>
        )}
      </div>

      {/* ── body ── */}
      <div className="p-3.5 flex flex-col flex-1">
        <Link to={`/profile/${post.author?._id}`} className="flex items-center gap-2 group/author">
          <Avatar src={post.author?.avatar} name={post.author?.name} size="xs" aura={post.author?.trustScore} />
          <div className="flex-1 min-w-0">
            <p className="font-jakarta font-semibold text-[11px] text-ink dark:text-cream flex items-center gap-1 truncate group-hover/author:text-coral transition-colors">
              <span className="truncate">{post.author?.shopName || post.author?.name}</span>
              {post.author?.isVerifiedSeller && (
                <HiOutlineShieldCheck className="text-leaf shrink-0 text-xs" />
              )}
            </p>
            <p className="text-[9px] text-ink/40 dark:text-cream/40 font-jakarta">{timeAgo(post.createdAt)}</p>
          </div>
        </Link>

        <p className="mt-2 text-[11px] text-ink/75 dark:text-cream/70 font-jakarta leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {post.caption || ""}
        </p>

        {post.hashtags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.hashtags.slice(0, 3).map((h) => (
              <span key={h} className="text-[9px] font-jakarta font-bold text-mauve bg-lavender/40 dark:bg-lavender/20 px-1.5 py-0.5 rounded-full tracking-wider">
                #{h}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* ── actions bar ── */}
        <div className="mt-3 pt-2.5 border-t border-ink/5 dark:border-white/8 flex items-center gap-3">
          {/* Like */}
          <button
            onClick={toggleLike}
            className="flex items-center gap-1.5 text-[11px] font-jakarta font-semibold text-ink/50 dark:text-cream/50 hover:text-coral transition group/like"
          >
            <motion.span animate={liked ? { scale: [1, 1.4, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}>
              {liked ? <HiHeart className="text-coral text-sm" /> : <HiOutlineHeart className="text-sm" />}
            </motion.span>
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          {/* Comment */}
          <button
            onClick={() => onOpen?.(post)}
            className="flex items-center gap-1.5 text-[11px] font-jakarta font-semibold text-ink/50 dark:text-cream/50 hover:text-ink dark:hover:text-cream transition"
          >
            <HiOutlineChatBubbleOvalLeft className="text-sm" />
            {post.comments?.length > 0 && <span>{post.comments.length}</span>}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-[11px] font-jakarta font-semibold text-ink/50 dark:text-cream/50 hover:text-ink dark:hover:text-cream transition"
          >
            <HiOutlinePaperAirplane className="text-sm" />
          </button>

          {/* Save — pushed to right */}
          <button
            onClick={toggleSave}
            className="flex items-center gap-1.5 text-[11px] font-jakarta font-semibold text-ink/50 dark:text-cream/50 hover:text-amber-500 transition ml-auto"
          >
            <motion.span animate={saved ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.25 }}>
              {saved ? <HiBookmark className="text-amber-500 text-sm" /> : <HiOutlineBookmark className="text-sm" />}
            </motion.span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* ══════════════════════════════════════════
   REEL CARD
══════════════════════════════════════════ */
function ReelCard({ reel, onPlay, onDeleted, onEdited }) {
  const user = useAuthStore((s) => s.user);
  const [liked, setLiked] = useState(reel.likes?.includes?.(user?._id));
  const [likeCount, setLikeCount] = useState(reel.likes?.length || 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isOwner = user?._id === reel.author?._id;
  const thumb = reel.thumbnail || reel.media?.[0]?.url;

  useEffect(() => {
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function toggleLike() {
    if (!user) return toast.error("Login karein pehle");
    setLiked((v) => !v);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      const { data } = await api.post(`/posts/${reel._id}/like`);
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch { }
  }

  async function handleDelete() {
    if (!window.confirm("Yeh reel delete karni hai?")) return;
    try {
      await api.delete(`/posts/${reel._id}`);
      toast.success("Reel delete ho gayi");
      onDeleted?.(reel._id);
    } catch {
      toast.error("Delete nahi ho saki");
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/feed?post=${reel._id}`;
    if (navigator.share) {
      navigator.share({ title: reel.author?.name, text: reel.caption, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copy ho gaya! 📋");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl overflow-hidden bg-ink aspect-[9/16] group cursor-pointer"
      onClick={() => onPlay?.(reel)}
    >
      {thumb ? (
        <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-coral/40 to-mauve/40 grid place-items-center">
          <HiOutlineFilm className="text-5xl text-white/30" />
        </div>
      )}

      {/* dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />

      {/* play button */}
      <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md grid place-items-center border border-white/30">
          <HiOutlinePlay className="text-white text-2xl ml-0.5" />
        </div>
      </div>

      {/* owner menu */}
      {isOwner && (
        <div ref={menuRef} className="absolute top-2.5 right-2.5 z-10" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-7 h-7 grid place-items-center rounded-full bg-ink/50 backdrop-blur-md text-white/80 hover:bg-ink/70 transition"
          >
            <HiOutlineEllipsisHorizontal className="text-sm" />
          </button>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-white dark:bg-zinc-900 border border-ink/10 shadow-lg py-1 z-50"
            >
              <button
                onClick={() => { setMenuOpen(false); onEdited?.(reel); }}
                className="w-full text-left px-3 py-2 text-xs font-jakarta text-ink/70 hover:bg-ink/5 flex items-center gap-2"
              >
                <HiOutlinePencilSquare className="text-sm" /> Edit
              </button>
              <button
                onClick={handleDelete}
                className="w-full text-left px-3 py-2 text-xs font-jakarta text-coral hover:bg-coral/5 flex items-center gap-2"
              >
                <HiOutlineTrash className="text-sm" /> Delete
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white font-jakarta text-[11px] font-semibold line-clamp-2 leading-relaxed">
          {reel.caption}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); toggleLike(); }}
            className="flex items-center gap-1 text-[10px] font-jakarta font-semibold text-white/70 hover:text-coral transition"
          >
            {liked ? <HiHeart className="text-coral text-sm" /> : <HiOutlineHeart className="text-sm" />}
            {likeCount > 0 && likeCount}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleShare(); }}
            className="flex items-center gap-1 text-[10px] font-jakarta text-white/70 hover:text-white transition"
          >
            <HiOutlinePaperAirplane className="text-sm" />
          </button>
          <Link
            to={`/profile/${reel.author?._id}`}
            onClick={(e) => e.stopPropagation()}
            className="ml-auto flex items-center gap-1.5"
          >
            <Avatar src={reel.author?.avatar} name={reel.author?.name} size="xs" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   VIDEO PLAYER MODAL
══════════════════════════════════════════ */
function VideoModal({ reel, onClose }) {
  const videoRef = useRef(null);
  const videoUrl = reel?.media?.find((m) => m.kind === "video")?.url;

  useEffect(() => {
    if (videoRef.current && videoUrl) videoRef.current.play().catch(() => { });
  }, [videoUrl]);

  if (!reel) return null;
  return (
    <Modal open={!!reel} onClose={onClose} title={reel.author?.name || "Reel"} width="max-w-sm">
      <div className="space-y-3">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full rounded-xl max-h-[70vh] bg-ink"
            playsInline
          />
        ) : (
          <div className="w-full h-64 bg-ink/10 rounded-xl grid place-items-center">
            <p className="text-xs font-jakarta text-ink/40">Video not available</p>
          </div>
        )}
        {reel.caption && (
          <p className="text-sm font-jakarta text-ink/80 dark:text-cream/80 leading-relaxed">{reel.caption}</p>
        )}
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════
   POST DETAIL MODAL (with comment + share + save)
══════════════════════════════════════════ */
function PostModal({ post, onClose }) {
  const [text, setText] = useState("");
  const [comments, setComments] = useState([]);
  const [saved, setSaved] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!post) return;
    api.get(`/posts/${post._id}`).then(({ data }) => setComments(data.post.comments || []));
  }, [post]);

  async function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const { data } = await api.post(`/posts/${post._id}/comment`, { text });
      setComments((c) => [...c, data.comment]);
      setText("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Comment nahi ho saka");
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/feed?post=${post._id}`;
    if (navigator.share) {
      navigator.share({ title: post.author?.name, text: post.caption, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copy ho gaya! 📋");
    }
  }

  if (!post) return null;
  return (
    <Modal open={!!post} onClose={onClose} title={post.author?.shopName || post.author?.name || "Post"} width="max-w-2xl">
      <div className="space-y-4">
        {post.media?.[0]?.url && (
          <div className="rounded-xl overflow-hidden">
            <img src={post.media[0].url} alt="" className="w-full max-h-[55vh] object-cover" />
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <Avatar src={post.author?.avatar} name={post.author?.name} size="sm" aura={post.author?.trustScore} />
          <div className="flex-1">
            <p className="font-jakarta font-semibold text-xs text-ink dark:text-cream flex items-center gap-1">
              {post.author?.shopName || post.author?.name}
              {post.author?.isVerifiedSeller && <HiOutlineShieldCheck className="text-leaf text-xs" />}
            </p>
            <p className="text-[10px] text-ink/45 dark:text-cream/45 font-jakarta">{timeAgo(post.createdAt)}</p>
          </div>
          {/* share + save in modal */}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={handleShare} className="w-8 h-8 grid place-items-center rounded-full bg-ink/5 dark:bg-white/5 text-ink/50 hover:text-ink dark:hover:text-cream transition">
              <HiOutlineShare className="text-sm" />
            </button>
            <button onClick={() => { setSaved((v) => !v); toast.success(saved ? "Unsaved" : "Saved! 🔖"); }}
              className="w-8 h-8 grid place-items-center rounded-full bg-ink/5 dark:bg-white/5 transition">
              {saved ? <HiBookmark className="text-amber-500 text-sm" /> : <HiOutlineBookmark className="text-sm text-ink/50" />}
            </button>
          </div>
        </div>

        {post.caption && (
          <p className="text-sm text-ink/80 dark:text-cream/80 font-jakarta leading-relaxed">{post.caption}</p>
        )}

        {comments.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {comments.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-lavender/60 grid place-items-center text-[10px] font-fraunces text-ink shrink-0 mt-0.5">
                  {(c.user?.name || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 rounded-xl bg-cream/60 dark:bg-white/5 px-3 py-2">
                  <p className="text-[11px] font-jakarta font-semibold text-ink dark:text-cream">{c.user?.name || "Buyer"}</p>
                  <p className={`text-[11px] mt-0.5 font-jakarta ${c.moderation?.flagged ? "text-coral italic" : "text-ink/70 dark:text-cream/70"}`}>
                    {c.moderation?.flagged ? "Hidden by Controlled Chats" : c.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {user && (
          <form onSubmit={submit} className="flex gap-2 pt-1 border-t border-ink/5 dark:border-white/8">
            <Input placeholder="Comment likho..." value={text} onChange={(e) => setText(e.target.value)} className="flex-1" />
            <Button type="submit" size="sm">Post</Button>
          </form>
        )}
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════
   COMPOSE MODAL (Image Post)
══════════════════════════════════════════ */
function ComposeModal({ open, onClose, onPosted, editPost }) {
  const [caption, setCaption] = useState(editPost?.caption || "");
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(editPost);

  useEffect(() => {
    if (editPost) setCaption(editPost.caption || "");
  }, [editPost]);

  async function submit(e) {
    e.preventDefault();
    if (!caption.trim() && media.length === 0) return;

    const uploaded = media.filter((m) => m.url);
    if (media.length > 0 && uploaded.length === 0) {
      toast.error("Images upload hone do pehle");
      return;
    }

    setLoading(true);
    try {
      let data;
      if (isEdit) {
        ({ data } = await api.patch(`/posts/${editPost._id}`, { caption }));
        toast.success("Post update ho gayi! ✅");
      } else {
        ({ data } = await api.post("/posts", {
          caption,
          kind: uploaded.length > 0 ? "photo" : "text",
          media: uploaded.map((m) => ({ url: m.url, kind: "image" })),
        }));
        toast.success("Post publish ho gayi! 🎉");
      }
      onPosted(data.post, isEdit);
      setCaption("");
      setMedia([]);
    } catch (err) {
      toast.error(err.response?.data?.error || "Post nahi ho saki");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Post edit karo" : "Post banao"} eyebrow="Share with the gully">
      <form onSubmit={submit} className="space-y-4">
        {!isEdit && (
          <MediaUploader label="Photos" value={media} onChange={setMedia} multiple accept="image/*" maxFiles={6} />
        )}
        <div>
          <label className="block mb-1.5 text-xs font-jakarta font-semibold text-ink/70 dark:text-cream/70 uppercase tracking-wider">
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Naya stock, just in from Varanasi..."
            rows={3}
            className="w-full rounded-xl bg-white/80 dark:bg-white/5 border border-ink/10 dark:border-white/10 focus:border-coral outline-none px-3 py-2.5 text-xs text-ink dark:text-cream font-jakarta placeholder:text-ink/35 dark:placeholder:text-cream/35 resize-none transition"
          />
        </div>
        <Button type="submit" className="w-full" size="md" disabled={loading || (!caption.trim() && media.length === 0)}>
          {loading ? (isEdit ? "Update ho raha hai..." : "Post ho raha hai...") : (isEdit ? "Update karo" : "Post to feed")}
        </Button>
      </form>
    </Modal>
  );
}

/* ══════════════════════════════════════════
   REEL COMPOSE MODAL (Video Upload + CRUD)
══════════════════════════════════════════ */
function ReelModal({ open, onClose, onPosted, editReel }) {
  const [caption, setCaption] = useState(editReel?.caption || "");
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(editReel);

  useEffect(() => {
    if (editReel) setCaption(editReel.caption || "");
  }, [editReel]);

  async function submit(e) {
    e.preventDefault();
    if (!caption.trim() && media.length === 0 && !isEdit) {
      toast.error("Video ya caption zaroori hai");
      return;
    }

    const uploaded = media.filter((m) => m.url);
    if (!isEdit && media.length > 0 && uploaded.length === 0) {
      toast.error("Video upload hone do pehle");
      return;
    }

    setLoading(true);
    try {
      let data;
      if (isEdit) {
        ({ data } = await api.patch(`/posts/${editReel._id}`, { caption }));
        toast.success("Reel update ho gayi! ✅");
      } else {
        ({ data } = await api.post("/posts", {
          caption,
          kind: "video",
          media: uploaded.map((m) => ({ url: m.url, kind: "video" })),
        }));
        toast.success("Reel upload ho gayi! 🎬");
      }
      onPosted(data.post, isEdit);
      setCaption("");
      setMedia([]);
    } catch (err) {
      toast.error(err.response?.data?.error || "Reel nahi ho saki");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Reel edit karo" : "Reel upload karo"} eyebrow="Video content">
      <form onSubmit={submit} className="space-y-4">
        {!isEdit && (
          <div>
            <MediaUploader
              label="Video"
              value={media}
              onChange={setMedia}
              accept="video/*"
              maxFiles={1}
            />
            <p className="mt-1.5 text-[10px] text-ink/40 dark:text-cream/40 font-jakarta">
              MP4, MOV supported. Max 100MB.
            </p>
          </div>
        )}
        <div>
          <label className="block mb-1.5 text-xs font-jakarta font-semibold text-ink/70 dark:text-cream/70 uppercase tracking-wider">
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Yeh reel kis baare mein hai..."
            rows={3}
            className="w-full rounded-xl bg-white/80 dark:bg-white/5 border border-ink/10 dark:border-white/10 focus:border-coral outline-none px-3 py-2.5 text-xs text-ink dark:text-cream font-jakarta placeholder:text-ink/35 dark:placeholder:text-cream/35 resize-none transition"
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          size="md"
          disabled={loading || (!isEdit && !caption.trim() && media.length === 0)}
        >
          {loading
            ? (isEdit ? "Update ho raha hai..." : "Upload ho raha hai...")
            : (isEdit ? "Reel update karo" : "Reel publish karo")}
        </Button>
      </form>
    </Modal>
  );
}

/* ══════════════════════════════════════════
   MAIN FEED PAGE
══════════════════════════════════════════ */
export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(1);
  const [hashtag, setHashtag] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [openPost, setOpenPost] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [reelOpen, setReelOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editingReel, setEditingReel] = useState(null);
  const [playingReel, setPlayingReel] = useState(null);
  const [activeTab, setActiveTab] = useState("posts"); // 'posts' | 'reels'
  const [searchParams] = useSearchParams();
  const sentinel = useRef(null);
  const user = useAuthStore((s) => s.user);

  const load = useCallback(
    async (p = 1, tag = hashtag) => {
      if (loading || done) return;
      setLoading(true);
      try {
        const params = { page: p, limit: 12 };
        if (tag) params.hashtag = tag;
        const { data } = await api.get("/posts", { params });
        const items = data.items || [];
        const photoPosts = items.filter((i) => i.kind !== "video");
        const videoReels = items.filter((i) => i.kind === "video");
        setPosts((prev) => (p === 1 ? photoPosts : [...prev, ...photoPosts]));
        setReels((prev) => (p === 1 ? videoReels : [...prev, ...videoReels]));
        if (items.length < 12) setDone(true);
      } finally {
        setLoading(false);
      }
    },
    [loading, done, hashtag]
  );

  useEffect(() => {
    setPosts([]);
    setReels([]);
    setPage(1);
    setDone(false);
    load(1, hashtag);
  }, [hashtag]);

  useEffect(() => {
    const postId = searchParams.get("post");
    if (!postId) { setOpenPost(null); return; }
    if (openPost?._id === postId) return;
    api.get(`/posts/${postId}`).then(({ data }) => { if (data?.post) setOpenPost(data.post); }).catch(() => setOpenPost(null));
  }, [searchParams]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !done) {
          const next = page + 1;
          setPage(next);
          load(next);
        }
      },
      { rootMargin: "300px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [page, loading, done, load]);

  function handlePostPosted(post, isEdit) {
    if (isEdit) {
      setPosts((arr) => arr.map((p) => (p._id === post._id ? post : p)));
    } else {
      setPosts((arr) => [post, ...arr]);
    }
    setComposeOpen(false);
    setEditingPost(null);
  }

  function handleReelPosted(reel, isEdit) {
    if (isEdit) {
      setReels((arr) => arr.map((r) => (r._id === reel._id ? reel : r)));
    } else {
      setReels((arr) => [reel, ...arr]);
    }
    setReelOpen(false);
    setEditingReel(null);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── header ── */}
      <Reveal>
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-1.5">
              Today in the gully
            </p>
            <h1 className="font-fraunces text-2xl sm:text-3xl text-ink dark:text-cream tracking-tight">
              Your feed
            </h1>
            <p className="mt-1 text-xs text-ink/50 dark:text-cream/50 font-jakarta">
              Curated by karma, not engagement bait.
            </p>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setComposeOpen(true)}
                size="md"
                leftIcon={<HiOutlinePlusCircle />}
                className="shrink-0"
              >
                Create post
              </Button>
              <Button
                onClick={() => setReelOpen(true)}
                size="md"
                leftIcon={<TbVideoPlus />}
                className="shrink-0 bg-mauve hover:bg-mauve/90 text-white border-0"
              >
                Reel
              </Button>
            </div>
          )}
        </div>
      </Reveal>

      {/* ── tabs: Posts / Reels ── */}
      <Reveal delay={0.03}>
        <div className="flex items-center gap-1 mb-5 bg-white/60 dark:bg-white/5 border border-ink/5 dark:border-white/10 rounded-full p-1 w-fit">
          {[
            { key: "posts", label: "Photos", icon: <HiOutlinePhoto className="text-sm" /> },
            { key: "reels", label: "Reels", icon: <HiOutlineFilm className="text-sm" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-jakarta font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-ink dark:bg-white/20 text-cream shadow-soft"
                  : "text-ink/50 dark:text-cream/50 hover:text-ink dark:hover:text-cream"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </Reveal>

      {/* ── hashtag filters ── */}
      <Reveal delay={0.05}>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none -mx-1 px-1">
          <button
            onClick={() => setHashtag(null)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-jakarta font-semibold transition-all border ${
              !hashtag
                ? "bg-ink dark:bg-cream text-cream dark:text-ink border-ink dark:border-cream shadow-soft"
                : "bg-white/60 dark:bg-white/5 border-ink/8 dark:border-white/10 text-ink/60 dark:text-cream/60 hover:border-ink/20"
            }`}
          >
            All
          </button>
          {HASHTAGS.map((h) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={h}
              onClick={() => setHashtag(h === hashtag ? null : h)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-jakarta font-semibold inline-flex items-center gap-1 transition-all border ${
                hashtag === h
                  ? "bg-coral text-white border-coral shadow-pop"
                  : "bg-white/60 dark:bg-white/5 border-ink/8 dark:border-white/10 text-ink/60 dark:text-cream/60 hover:border-coral/40 hover:text-coral"
              }`}
            >
              <HiOutlineHashtag className="text-xs" />
              {h}
            </motion.button>
          ))}
        </div>
      </Reveal>

      {/* ── POSTS TAB ── */}
      <AnimatePresence mode="wait">
        {activeTab === "posts" && (
          <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {posts.length === 0 && !loading ? (
              <EmptyState title="Koi post nahi" hint="Pehli post banao ya alag hashtag try karo" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {posts.map((p) => (
                  <PostCard
                    key={p._id}
                    post={p}
                    onOpen={setOpenPost}
                    onDeleted={(id) => setPosts((arr) => arr.filter((x) => x._id !== id))}
                    onEdited={(post) => { setEditingPost(post); setComposeOpen(true); }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── REELS TAB ── */}
        {activeTab === "reels" && (
          <motion.div key="reels" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {reels.length === 0 && !loading ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-mauve/10 grid place-items-center mx-auto mb-4">
                  <HiOutlineFilm className="text-3xl text-mauve/60" />
                </div>
                <p className="font-fraunces text-lg text-ink dark:text-cream">Koi reel nahi abhi</p>
                <p className="text-xs text-ink/45 dark:text-cream/45 font-jakarta mt-1">Pehli reel upload karo!</p>
                {user && (
                  <Button onClick={() => setReelOpen(true)} size="sm" className="mt-4 bg-mauve hover:bg-mauve/90 text-white border-0">
                    <TbVideoPlus className="mr-1.5" /> Reel upload karo
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {reels.map((r) => (
                  <ReelCard
                    key={r._id}
                    reel={r}
                    onPlay={setPlayingReel}
                    onDeleted={(id) => setReels((arr) => arr.filter((x) => x._id !== id))}
                    onEdited={(reel) => { setEditingReel(reel); setReelOpen(true); }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="grid place-items-center py-10"><Spinner /></div>
      )}

      <div ref={sentinel} className="h-10" />

      {done && posts.length > 0 && activeTab === "posts" && (
        <div className="text-center py-10">
          <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-jakarta font-semibold text-ink/30 dark:text-cream/30">
            <span className="w-12 h-px bg-ink/15 dark:bg-cream/15" />
            End of the gully
            <span className="w-12 h-px bg-ink/15 dark:bg-cream/15" />
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <PostModal post={openPost} onClose={() => setOpenPost(null)} />

      <ComposeModal
        open={composeOpen}
        onClose={() => { setComposeOpen(false); setEditingPost(null); }}
        onPosted={handlePostPosted}
        editPost={editingPost}
      />

      <ReelModal
        open={reelOpen}
        onClose={() => { setReelOpen(false); setEditingReel(null); }}
        onPosted={handleReelPosted}
        editReel={editingReel}
      />

      <VideoModal reel={playingReel} onClose={() => setPlayingReel(null)} />
    </div>
  );
}