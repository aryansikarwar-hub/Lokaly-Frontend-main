import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlinePlusCircle, HiOutlineHashtag, HiHeart, HiOutlineHeart,
  HiOutlineChatBubbleOvalLeft, HiOutlinePaperAirplane, HiOutlineShieldCheck,
  HiOutlineShoppingBag, HiOutlinePhoto, HiOutlineBookmark, HiBookmark,
  HiOutlineShare, HiOutlinePlay, HiOutlineFilm, HiOutlinePencilSquare,
  HiOutlineTrash, HiOutlineEllipsisHorizontal, HiOutlineSparkles, HiOutlineFire,
  HiOutlineStar, HiOutlineVideoCamera, HiOutlineRectangleStack,
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

const HASHTAGS = ["handmadeinindia","vocalforlocal","desi","indianartisan","craftlove","supportlocal"];
const TRENDING_TOPICS = [
  { tag: "handmadeinindia", count: "12.4K posts" },
  { tag: "desi", count: "8.1K posts" },
  { tag: "vocalforlocal", count: "5.6K posts" },
];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* POST CARD */
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

  useEffect(() => {
    function handle(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function toggleLike() {
    if (!user) { toast.error("Login karein pehle"); return; }
    setLiked((v) => !v); setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      setLiked(data.liked); setLikeCount(data.likeCount);
    } catch { toast.error("Like update nahi hua"); }
  }

  function toggleSave() {
    if (!user) { toast.error("Login karein pehle"); return; }
    setSaved((v) => !v);
    toast.success(saved ? "Saved se hata diya" : "Post save ho gayi 🔖");
  }

  function handleShare() {
    const url = `${window.location.origin}/feed?post=${post._id}`;
    if (navigator.share) navigator.share({ title: post.author?.name, text: post.caption, url });
    else { navigator.clipboard.writeText(url); toast.success("Link copied! 🔗"); }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
      className="group bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-ink/5 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-2">
        <Link to={`/profile/${post.author?._id}`}>
          <Avatar src={post.author?.avatar} name={post.author?.name} size={32} />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${post.author?._id}`} className="text-xs font-semibold text-ink dark:text-cream leading-tight truncate block">{post.author?.name || "Seller"}</Link>
          <p className="text-[10px] text-ink/40">{timeAgo(post.createdAt)}</p>
        </div>
        {post.author?.isVerified && <HiOutlineShieldCheck className="text-sm text-coral shrink-0" />}
        {isOwner && (
          <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setMenuOpen((v) => !v)} className="w-7 h-7 rounded-full flex items-center justify-center text-ink/40 hover:bg-ink/5 transition">
              <HiOutlineEllipsisHorizontal className="text-base" />
            </button>
            {menuOpen && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-white dark:bg-zinc-800 border border-ink/10 shadow-lg py-1 z-20">
                <button onClick={() => { setMenuOpen(false); onEdited?.(post); }} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-ink/5"><HiOutlinePencilSquare /> Edit</button>
                <button onClick={async () => {
                  if (!window.confirm("Delete karni hai?")) return;
                  try { await api.delete(`/posts/${post._id}`); toast.success("Post delete ho gayi"); onDeleted?.(post._id); }
                  catch { toast.error("Delete nahi ho saki"); }
                }} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-coral hover:bg-coral/5"><HiOutlineTrash /> Delete</button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {img && (
        <div className="relative overflow-hidden bg-ink/5 cursor-pointer" onClick={() => onOpen?.(post)}>
          <img src={img} alt="" className="w-full aspect-square object-cover group-hover:scale-[1.02] transition-transform duration-500" />
          {tagged.length > 0 && (
            <div className="absolute bottom-2 left-2">
              <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                <HiOutlineShoppingBag className="text-xs" /> {tagged.length} products
              </span>
            </div>
          )}
          {post.media?.length > 1 && (
            <div className="absolute top-2 right-2">
              <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                <HiOutlineRectangleStack className="text-xs" /> {post.media.length}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="px-3.5 pt-2.5 pb-3">
        <div className="flex items-center gap-0.5 mb-2">
          <button onClick={toggleLike} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${liked ? "text-red-500 bg-red-50 dark:bg-red-950/30" : "text-ink/50 hover:bg-ink/5"}`}>
            {liked ? <HiHeart className="text-base" /> : <HiOutlineHeart className="text-base" />}
            {likeCount > 0 && likeCount}
          </button>
          <button onClick={() => onOpen?.(post)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-ink/50 hover:bg-ink/5 transition">
            <HiOutlineChatBubbleOvalLeft className="text-base" /> {post.commentCount > 0 && post.commentCount}
          </button>
          <button onClick={handleShare} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-ink/50 hover:bg-ink/5 transition">
            <HiOutlinePaperAirplane className="text-base" />
          </button>
          <div className="flex-1" />
          <button onClick={toggleSave} className={`px-2 py-1 rounded-lg text-xs transition ${saved ? "text-mauve" : "text-ink/40 hover:bg-ink/5"}`}>
            {saved ? <HiBookmark className="text-base" /> : <HiOutlineBookmark className="text-base" />}
          </button>
        </div>
        {post.caption && (
          <p className="text-xs text-ink dark:text-cream/80 leading-relaxed line-clamp-2">
            <span className="font-semibold">{post.author?.name?.split(" ")[0]} </span>{post.caption}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* REEL CARD */
function ReelCard({ reel, onPlay, onDeleted, onEdited }) {
  const user = useAuthStore((s) => s.user);
  const [liked, setLiked] = useState(reel.likes?.includes?.(user?._id));
  const [likeCount, setLikeCount] = useState(reel.likes?.length || 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isOwner = user?._id === reel.author?._id;
  const thumb = reel.thumbnail || reel.media?.[0]?.url;

  useEffect(() => {
    function handle(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function toggleLike() {
    if (!user) { toast.error("Login karein pehle"); return; }
    setLiked((v) => !v); setLikeCount((c) => c + (liked ? -1 : 1));
    try { const { data } = await api.post(`/posts/${reel._id}/like`); setLiked(data.liked); setLikeCount(data.likeCount); }
    catch {}
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
      className="relative rounded-2xl overflow-hidden bg-ink aspect-[9/16] group cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-300"
      onClick={() => onPlay?.(reel)}
    >
      {thumb ? (
        <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-coral/40 to-mauve/40 grid place-items-center">
          <HiOutlineFilm className="text-5xl text-white/30" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition duration-200">
        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 grid place-items-center">
          <HiOutlinePlay className="text-white text-2xl ml-0.5" />
        </div>
      </div>
      {isOwner && (
        <div ref={menuRef} className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setMenuOpen((v) => !v)} className="w-8 h-8 rounded-full bg-black/50 text-white grid place-items-center">
            <HiOutlineEllipsisHorizontal />
          </button>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-white dark:bg-zinc-900 border border-ink/10 shadow-lg py-1">
              <button onClick={() => { setMenuOpen(false); onEdited?.(reel); }} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-ink/5"><HiOutlinePencilSquare /> Edit</button>
              <button onClick={async () => {
                if (!window.confirm("Yeh reel delete karni hai?")) return;
                try { await api.delete(`/posts/${reel._id}`); toast.success("Reel delete ho gayi"); onDeleted?.(reel._id); }
                catch { toast.error("Delete nahi ho saki"); }
              }} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-coral hover:bg-coral/5"><HiOutlineTrash /> Delete</button>
            </motion.div>
          )}
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        {reel.caption && <p className="text-white text-[11px] font-semibold line-clamp-2 mb-2">{reel.caption}</p>}
        <div className="flex items-center justify-between">
          <button onClick={(e) => { e.stopPropagation(); toggleLike(); }} className={`flex items-center gap-1 text-[11px] font-semibold transition-colors ${liked ? "text-red-400" : "text-white/80"}`}>
            {liked ? <HiHeart className="text-sm" /> : <HiOutlineHeart className="text-sm" />}
            {likeCount > 0 && likeCount}
          </button>
          <Link to={`/profile/${reel.author?._id}`} className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Avatar src={reel.author?.avatar} name={reel.author?.name} size={20} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* VIDEO MODAL */
function VideoModal({ reel, onClose }) {
  const videoRef = useRef(null);
  const videoUrl = reel?.media?.find((m) => m.kind === "video")?.url;
  useEffect(() => { if (videoRef.current && videoUrl) videoRef.current.play().catch(() => {}); }, [videoUrl]);
  if (!reel) return null;
  return (
    <Modal open={!!reel} onClose={onClose} title={reel.author?.name || "Reel"}>
      <div className="space-y-3">
        {videoUrl ? (
          <video ref={videoRef} src={videoUrl} controls className="w-full rounded-xl max-h-[60vh] bg-black" />
        ) : (
          <div className="w-full aspect-video bg-ink/10 rounded-xl grid place-items-center"><HiOutlineFilm className="text-4xl text-ink/30" /></div>
        )}
        {reel.caption && <p className="text-sm text-ink dark:text-cream">{reel.caption}</p>}
      </div>
    </Modal>
  );
}

/* POST MODAL */
function PostModal({ post, onClose }) {
  const [idx, setIdx] = useState(0);
  if (!post) return null;
  const imgs = post.media?.filter((m) => m.kind === "image" || !m.kind) || [];
  return (
    <Modal open={!!post} onClose={onClose} title="">
      <div className="space-y-4 -mt-2">
        {imgs.length > 0 && (
          <div className="relative rounded-xl overflow-hidden bg-ink/5">
            <img src={imgs[idx]?.url} alt="" className="w-full max-h-[50vh] object-contain" />
            {imgs.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {imgs.map((_, i) => <button key={i} onClick={() => setIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-white scale-125" : "bg-white/50"}`} />)}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-2.5">
          <Avatar src={post.author?.avatar} name={post.author?.name} size={36} />
          <div>
            <p className="text-sm font-semibold text-ink dark:text-cream">{post.author?.name}</p>
            <p className="text-[11px] text-ink/40">{timeAgo(post.createdAt)}</p>
          </div>
        </div>
        {post.caption && <p className="text-sm text-ink dark:text-cream/80 leading-relaxed">{post.caption}</p>}
      </div>
    </Modal>
  );
}

/* COMPOSE MODAL */
function ComposeModal({ open, onClose, onPosted, editPost }) {
  const [caption, setCaption] = useState(editPost?.caption || "");
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(editPost);
  useEffect(() => { if (editPost) setCaption(editPost.caption || ""); }, [editPost]);

  async function submit(e) {
    e.preventDefault();
    if (!caption.trim() && media.length === 0) return;
    const uploaded = media.filter((m) => m.url);
    if (media.length > 0 && uploaded.length === 0) { toast.error("Images upload hone do pehle"); return; }
    setLoading(true);
    try {
      let data;
      if (isEdit) { ({ data } = await api.patch(`/posts/${editPost._id}`, { caption })); toast.success("Post update ho gayi ✅"); }
      else { ({ data } = await api.post("/posts", { caption, kind: uploaded.length > 0 ? "photo" : "text", media: uploaded.map((m) => ({ url: m.url, kind: "image" })) })); toast.success("Post publish ho gayi 🎉"); }
      onPosted(data.post, isEdit);
      setCaption(""); setMedia([]);
    } catch (err) { toast.error(err.response?.data?.error || "Post nahi ho saki"); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Post edit karo" : "Post banao"}>
      <form onSubmit={submit} className="space-y-4">
        {!isEdit && <MediaUploader label="Photos" value={media} onChange={setMedia} multiple accept="image/*" maxFiles={6} />}
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption likho..." rows={3} className="w-full rounded-xl border border-ink/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-coral resize-none" />
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Loading..." : isEdit ? "Update Post" : "Publish Post"}</Button>
      </form>
    </Modal>
  );
}

/* REEL MODAL with Thumbnail (3-step wizard) */
function ReelModal({ open, onClose, onPosted, editReel }) {
  const [caption, setCaption] = useState(editReel?.caption || "");
  const [media, setMedia] = useState([]);
  const [thumbnail, setThumbnail] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const isEdit = Boolean(editReel);

  useEffect(() => { if (editReel) setCaption(editReel.caption || ""); }, [editReel]);
  useEffect(() => { if (!open) { setStep(0); setMedia([]); setThumbnail([]); setCaption(""); } }, [open]);

  const videoUploaded = media.filter((m) => m.url);
  const thumbUploaded = thumbnail.filter((m) => m.url);

  async function submit() {
    setLoading(true);
    try {
      let data;
      if (isEdit) {
        ({ data } = await api.patch(`/posts/${editReel._id}`, { caption }));
        toast.success("Reel update ho gayi ✅");
      } else {
        const payload = { caption, kind: "video", media: videoUploaded.map((m) => ({ url: m.url, kind: "video" })) };
        if (thumbUploaded.length > 0) payload.thumbnail = thumbUploaded[0].url;
        ({ data } = await api.post("/posts", payload));
        toast.success("Reel upload ho gayi 🎬");
      }
      onPosted(data.post, isEdit);
      setCaption(""); setMedia([]); setThumbnail([]);
    } catch (err) { toast.error(err.response?.data?.error || "Reel upload fail"); }
    finally { setLoading(false); }
  }

  const steps = [
    { label: "Video", icon: <HiOutlineVideoCamera /> },
    { label: "Thumbnail", icon: <HiOutlinePhoto /> },
    { label: "Publish", icon: <HiOutlineSparkles /> },
  ];

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Reel edit karo" : "Reel upload karo 🎬"}>
      {!isEdit ? (
        <div className="space-y-5">
          {/* Steps */}
          <div className="flex items-center">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center flex-1">
                <button
                  onClick={() => { if (i === 0 || (i === 1 && videoUploaded.length > 0) || (i === 2 && videoUploaded.length > 0)) setStep(i); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all flex-1 justify-center ${
                    i === step ? "bg-coral text-white shadow-sm" : i < step ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "bg-ink/5 text-ink/40"
                  }`}
                >
                  {s.icon} {s.label}
                </button>
                {i < steps.length - 1 && <div className={`h-px w-3 transition-colors ${i < step ? "bg-emerald-400" : "bg-ink/10"}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="rounded-xl border-2 border-dashed border-ink/10 p-4">
                  <MediaUploader label="Video file" value={media} onChange={setMedia} accept="video/*" maxFiles={1} />
                </div>
                {videoUploaded.length > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-600 text-sm">
                    <HiOutlineSparkles className="text-lg shrink-0" /> Video ready! Ab thumbnail add karo.
                  </div>
                )}
                <Button type="button" className="w-full" disabled={videoUploaded.length === 0} onClick={() => setStep(1)}>Next: Thumbnail →</Button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="text-center p-3 bg-mauve/5 rounded-xl border border-mauve/10">
                  <HiOutlinePhoto className="text-3xl text-mauve mx-auto mb-1" />
                  <p className="text-xs font-semibold text-ink/70">Thumbnail add karo</p>
                  <p className="text-[10px] text-ink/40 mt-0.5">Thumbnail se reel zyada attractive lagti hai! Recommended: 9:16</p>
                </div>
                <div className="rounded-xl border-2 border-dashed border-mauve/20 p-4 bg-mauve/5">
                  <MediaUploader label="Thumbnail image (optional)" value={thumbnail} onChange={setThumbnail} accept="image/*" maxFiles={1} />
                </div>
                {thumbUploaded.length > 0 && (
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-ink/5">
                    <img src={thumbUploaded[0].url} alt="Thumbnail preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition">
                      <HiOutlinePlay className="text-white text-4xl" />
                    </div>
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">Preview</div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="button" className="flex-1 bg-white dark:bg-zinc-800 text-ink dark:text-cream border border-ink/10 hover:bg-ink/5" onClick={() => setStep(0)}>← Back</Button>
                  <Button type="button" className="flex-1" onClick={() => setStep(2)}>{thumbUploaded.length > 0 ? "Next →" : "Skip →"}</Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex gap-3 p-3 bg-ink/3 rounded-xl border border-ink/5">
                  {thumbUploaded.length > 0 ? (
                    <img src={thumbUploaded[0].url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-mauve/20 grid place-items-center shrink-0"><HiOutlineFilm className="text-mauve text-xl" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink dark:text-cream">{videoUploaded.length > 0 ? "✅ Video ready" : "❌ No video"}</p>
                    <p className="text-[10px] text-ink/50 mt-0.5">{thumbUploaded.length > 0 ? "✅ Thumbnail set" : "⚠️ Default frame use hoga"}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink/70 mb-1.5">Caption</label>
                  <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Reel ke baare mein kuch batao... #hashtag" rows={3} className="w-full rounded-xl border border-ink/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-coral resize-none" />
                  <p className="text-[10px] text-ink/30 mt-1">{caption.length}/300</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" className="flex-1 bg-white dark:bg-zinc-800 text-ink dark:text-cream border border-ink/10 hover:bg-ink/5" onClick={() => setStep(1)}>← Back</Button>
                  <button type="button" onClick={submit} disabled={loading || videoUploaded.length === 0}
                    className="flex-1 bg-gradient-to-r from-coral to-mauve text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {loading ? <><Spinner size={14} /> Uploading...</> : <><TbVideoPlus className="text-base" /> Publish Reel</>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption..." rows={3} className="w-full rounded-xl border border-ink/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-coral resize-none" />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Loading..." : "Update Reel"}</Button>
        </form>
      )}
    </Modal>
  );
}

/* TRENDING SIDEBAR */
function TrendingSidebar({ hashtag, setHashtag }) {
  return (
    <div className="hidden xl:block w-64 shrink-0">
      <div className="sticky top-24 space-y-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-ink/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineFire className="text-coral text-lg" />
            <h3 className="text-sm font-bold text-ink dark:text-cream">Trending Now</h3>
          </div>
          <div className="space-y-2">
            {TRENDING_TOPICS.map((t, i) => (
              <button key={t.tag} onClick={() => setHashtag(hashtag === t.tag ? null : t.tag)}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all ${hashtag === t.tag ? "bg-coral/10 text-coral" : "hover:bg-ink/5 text-ink/70 dark:text-cream/70"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink/30 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold">#{t.tag}</p>
                    <p className="text-[10px] text-ink/40">{t.count}</p>
                  </div>
                  {i === 0 && <HiOutlineFire className="text-xs text-coral" />}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-gradient-to-br from-mauve/10 to-coral/10 rounded-2xl border border-mauve/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineSparkles className="text-mauve text-lg" />
            <h3 className="text-sm font-bold text-ink dark:text-cream">Creator Tips</h3>
          </div>
          <ul className="space-y-2 text-[11px] text-ink/60 dark:text-cream/60">
            <li className="flex items-start gap-1.5"><HiOutlineStar className="text-amber-400 shrink-0 mt-0.5" /> Thumbnail add karo — 3x zyada views milenge</li>
            <li className="flex items-start gap-1.5"><HiOutlineStar className="text-amber-400 shrink-0 mt-0.5" /> Trending hashtags use karo reach ke liye</li>
            <li className="flex items-start gap-1.5"><HiOutlineStar className="text-amber-400 shrink-0 mt-0.5" /> Evening 6-9 PM mein post karo max engagement ke liye</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* MAIN FEED */
export default function Feed() {
  const user = useAuthStore((s) => s.user);
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [hashtag, setHashtag] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [composeOpen, setComposeOpen] = useState(false);
  const [reelOpen, setReelOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editingReel, setEditingReel] = useState(null);
  const [openPost, setOpenPost] = useState(null);
  const [playingReel, setPlayingReel] = useState(null);
  const sentinel = useRef(null);
  const [searchParams] = useSearchParams();

  const load = useCallback(async (p = 1, tag = hashtag) => {
    if (loading || done) return;
    setLoading(true);
    try {
      const params = { page: p, limit: 12 };
      if (tag) params.hashtag = tag;
      const { data } = await api.get("/posts", { params });
      const items = data.items || [];
      const photoPosts = items.filter((i) => i.kind !== "video");
      const videoReels = items.filter((i) => i.kind === "video");
      setPosts((prev) => p === 1 ? photoPosts : [...prev, ...photoPosts]);
      setReels((prev) => p === 1 ? videoReels : [...prev, ...videoReels]);
      if (items.length < 12) setDone(true);
    } finally { setLoading(false); }
  }, [loading, done, hashtag]);

  useEffect(() => { setPosts([]); setReels([]); setPage(1); setDone(false); load(1, hashtag); }, [hashtag]);

  useEffect(() => {
    const postId = searchParams.get("post");
    if (!postId) { setOpenPost(null); return; }
    api.get(`/posts/${postId}`).then(({ data }) => { if (data?.post) setOpenPost(data.post); }).catch(() => setOpenPost(null));
  }, [searchParams]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && !done) { const next = page + 1; setPage(next); load(next); }
    }, { rootMargin: "300px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [page, loading, done, load]);

  function handlePostPosted(post, isEdit) {
    if (isEdit) setPosts((arr) => arr.map((p) => p._id === post._id ? post : p));
    else setPosts((arr) => [post, ...arr]);
    setComposeOpen(false); setEditingPost(null);
  }

  function handleReelPosted(reel, isEdit) {
    if (isEdit) setReels((arr) => arr.map((r) => r._id === reel._id ? reel : r));
    else setReels((arr) => [reel, ...arr]);
    setReelOpen(false); setEditingReel(null);
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-6 md:py-8">
      <Reveal>
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-coral/10 text-coral text-[10px] font-semibold px-2.5 py-1 rounded-full mb-2 uppercase tracking-wider">
              <HiOutlineFire className="text-xs" /> Today in the gully
            </div>
            <h1 className="font-fraunces text-2xl md:text-3xl text-ink dark:text-cream tracking-tight">Your Feed</h1>
            <p className="text-xs text-ink/40 mt-0.5">Curated by karma ✨</p>
          </div>
          {user && (
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setComposeOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-ink/10 text-xs font-semibold text-ink dark:text-cream hover:bg-ink/5 transition shadow-sm">
                <HiOutlinePhoto className="text-base" />
                <span className="hidden sm:inline">Create Post</span><span className="sm:hidden">Post</span>
              </button>
              <button onClick={() => setReelOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-coral to-mauve text-white text-xs font-semibold hover:opacity-90 transition shadow-sm">
                <TbVideoPlus className="text-base" />
                <span className="hidden sm:inline">Upload Reel</span><span className="sm:hidden">Reel</span>
              </button>
            </div>
          )}
        </div>
      </Reveal>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 mb-5 bg-white/60 dark:bg-white/5 rounded-full p-1 w-fit border border-ink/5 shadow-sm">
            {[
              { key: "posts", label: "Photos", icon: <HiOutlinePhoto />, count: posts.length },
              { key: "reels", label: "Reels", icon: <HiOutlineFilm />, count: reels.length },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all ${activeTab === tab.key ? "bg-ink dark:bg-white text-white dark:text-ink shadow-sm" : "text-ink/50 hover:text-ink/80"}`}>
                {tab.icon} {tab.label}
                {tab.count > 0 && <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-white/20" : "bg-ink/10"}`}>{tab.count}</span>}
              </button>
            ))}
          </div>

          {/* Hashtags */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
            <button onClick={() => setHashtag(null)} className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${!hashtag ? "bg-ink text-white border-ink shadow-sm" : "bg-white dark:bg-zinc-800 text-ink/60 border-ink/10 hover:border-ink/20"}`}>All</button>
            {HASHTAGS.map((h) => (
              <button key={h} onClick={() => setHashtag(hashtag === h ? null : h)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border flex items-center gap-1 transition-all ${hashtag === h ? "bg-coral text-white border-coral shadow-sm" : "bg-white dark:bg-zinc-800 text-ink/60 border-ink/10 hover:border-coral/30"}`}>
                <HiOutlineHashtag className="text-[10px]" />{h}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "posts" && (
              <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {posts.length === 0 && !loading ? (
                  <div className="text-center py-16">
                    <HiOutlinePhoto className="text-5xl text-ink/20 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-ink/40">Koi post nahi</p>
                    {user && <button onClick={() => setComposeOpen(true)} className="mt-3 text-coral text-xs font-semibold hover:underline">Pehli post banao →</button>}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {posts.map((p, i) => (
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
                {reels.length === 0 && !loading ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-coral/20 to-mauve/20 grid place-items-center mx-auto mb-3">
                      <TbVideoPlus className="text-2xl text-coral" />
                    </div>
                    <p className="text-sm font-semibold text-ink/40 mb-1">Koi reel nahi</p>
                    <p className="text-xs text-ink/30 mb-3">Thumbnail ke saath reel upload karo aur zyada views pao!</p>
                    {user && (
                      <button onClick={() => setReelOpen(true)} className="px-4 py-2 bg-gradient-to-r from-coral to-mauve text-white text-xs font-semibold rounded-full hover:opacity-90 transition">
                        Pehli Reel Upload Karo 🎬
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {reels.map((r, i) => (
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
          <div ref={sentinel} className="h-10" />
        </div>

        <TrendingSidebar hashtag={hashtag} setHashtag={setHashtag} />
      </div>

      <PostModal post={openPost} onClose={() => setOpenPost(null)} />
      <ComposeModal open={composeOpen} onClose={() => { setComposeOpen(false); setEditingPost(null); }} onPosted={handlePostPosted} editPost={editingPost} />
      <ReelModal open={reelOpen} onClose={() => { setReelOpen(false); setEditingReel(null); }} onPosted={handleReelPosted} editReel={editingReel} />
      <VideoModal reel={playingReel} onClose={() => setPlayingReel(null)} />
    </div>
  );
}