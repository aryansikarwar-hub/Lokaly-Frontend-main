import { useEffect, useRef, useState, useCallback } from "react";
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
  HiOutlineXMark,
} from "react-icons/hi2";
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
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const HASHTAGS = ["handmadeinindia", "vocalforlocal", "desi", "indianartisan"];

/* ─── tiny helpers ─── */
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ══════════════════════════════════════════
   POST CARD — uniform fixed height
══════════════════════════════════════════ */
function PostCard({ post, onOpen }) {
  const user = useAuthStore((s) => s.user);
  const [liked, setLiked] = useState(post.likes?.includes?.(user?._id));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const img = post.media?.[0]?.url;
  const tagged = post.taggedProducts || [];
  const hasImage = Boolean(img);

  async function toggleLike() {
    if (!user) return;
    setLiked((v) => !v);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch { /* non-fatal */ }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-32px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-2xl overflow-hidden bg-white dark:bg-white/5 border border-ink/5 dark:border-white/8 hover:border-ink/15 dark:hover:border-white/15 hover:shadow-soft transition-all duration-300 flex flex-col"
    >
      {/* ── image — fixed square aspect, always same height ── */}
      <div
        className="relative overflow-hidden cursor-pointer w-full shrink-0"
        style={{ paddingTop: "100%" /* 1:1 square */ }}
        onClick={() => onOpen?.(post)}
      >
        {hasImage ? (
          <img
            src={img}
            alt={post.caption || "post"}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          /* placeholder for text-only posts */
          <div className="absolute inset-0 w-full h-full bg-lavender/20 dark:bg-lavender/10 grid place-items-center">
            <HiOutlinePhoto className="text-4xl text-ink/20 dark:text-cream/20" />
          </div>
        )}

        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* timestamp badge */}
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-ink/50 backdrop-blur-md text-[9px] font-jakarta font-semibold text-white/90 tracking-wide">
          {timeAgo(post.createdAt)}
        </div>

        {/* tagged product chip */}
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

      {/* ── body — flex-1 so all cards stretch to same total height ── */}
      <div className="p-3.5 flex flex-col flex-1">
        {/* author */}
        <Link
          to={`/profile/${post.author?._id}`}
          className="flex items-center gap-2 group/author"
        >
          <Avatar
            src={post.author?.avatar}
            name={post.author?.name}
            size="xs"
            aura={post.author?.trustScore}
          />
          <div className="flex-1 min-w-0">
            <p className="font-jakarta font-semibold text-[11px] text-ink dark:text-cream flex items-center gap-1 truncate group-hover/author:text-coral transition-colors">
              <span className="truncate">{post.author?.shopName || post.author?.name}</span>
              {post.author?.isVerifiedSeller && (
                <HiOutlineShieldCheck className="text-leaf shrink-0 text-xs" />
              )}
            </p>
            <p className="text-[9px] text-ink/40 dark:text-cream/40 font-jakarta">
              {timeAgo(post.createdAt)}
            </p>
          </div>
        </Link>

        {/* caption — fixed 2-line clamp so height stays uniform */}
        <p className="mt-2 text-[11px] text-ink/75 dark:text-cream/70 font-jakarta leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {post.caption || ""}
        </p>

        {/* hashtags */}
        {post.hashtags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.hashtags.slice(0, 3).map((h) => (
              <span
                key={h}
                className="text-[9px] font-jakarta font-bold text-mauve bg-lavender/40 dark:bg-lavender/20 px-1.5 py-0.5 rounded-full tracking-wider"
              >
                #{h}
              </span>
            ))}
          </div>
        )}

        {/* spacer pushes actions to bottom */}
        <div className="flex-1" />

        {/* actions */}
        <div className="mt-3 pt-2.5 border-t border-ink/5 dark:border-white/8 flex items-center gap-4">
          <button
            onClick={toggleLike}
            className="flex items-center gap-1.5 text-[11px] font-jakarta font-semibold text-ink/50 dark:text-cream/50 hover:text-coral dark:hover:text-coral transition group/like"
          >
            <motion.span
              animate={liked ? { scale: [1, 1.35, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {liked
                ? <HiHeart className="text-coral text-sm" />
                : <HiOutlineHeart className="text-sm group-hover/like:text-coral transition" />
              }
            </motion.span>
            {likeCount > 0 && likeCount}
          </button>

          <button
            onClick={() => onOpen?.(post)}
            className="flex items-center gap-1.5 text-[11px] font-jakarta font-semibold text-ink/50 dark:text-cream/50 hover:text-ink dark:hover:text-cream transition"
          >
            <HiOutlineChatBubbleOvalLeft className="text-sm" />
            {post.comments?.length > 0 && post.comments.length}
          </button>

          <button className="flex items-center gap-1.5 text-[11px] font-jakarta font-semibold text-ink/50 dark:text-cream/50 hover:text-ink dark:hover:text-cream transition ml-auto">
            <HiOutlinePaperAirplane className="text-sm" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* ══════════════════════════════════════════
   FEED GRID — uniform CSS grid (not masonry)
══════════════════════════════════════════ */
function FeedGrid({ posts, onOpen }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {posts.map((p) => (
        <PostCard key={p._id} post={p} onOpen={onOpen} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   POST DETAIL MODAL
══════════════════════════════════════════ */
function PostModal({ post, onClose }) {
  const [text, setText] = useState("");
  const [comments, setComments] = useState([]);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!post) return;
    api
      .get(`/posts/${post._id}`)
      .then(({ data }) => setComments(data.post.comments || []));
  }, [post]);

  async function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const { data } = await api.post(`/posts/${post._id}/comment`, { text });
      setComments((c) => [...c, data.comment]);
      setText("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not comment");
    }
  }

  if (!post) return null;

  return (
    <Modal
      open={!!post}
      onClose={onClose}
      title={post.author?.shopName || post.author?.name || "Post"}
      width="max-w-2xl"
    >
      <div className="space-y-4">
        {/* image */}
        {post.media?.[0]?.url && (
          <div className="rounded-xl overflow-hidden">
            <img
              src={post.media[0].url}
              alt=""
              className="w-full max-h-[60vh] object-cover"
            />
          </div>
        )}

        {/* author row */}
        <div className="flex items-center gap-2.5">
          <Avatar
            src={post.author?.avatar}
            name={post.author?.name}
            size="sm"
            aura={post.author?.trustScore}
          />
          <div>
            <p className="font-jakarta font-semibold text-xs text-ink dark:text-cream flex items-center gap-1">
              {post.author?.shopName || post.author?.name}
              {post.author?.isVerifiedSeller && (
                <HiOutlineShieldCheck className="text-leaf text-xs" />
              )}
            </p>
            <p className="text-[10px] text-ink/45 dark:text-cream/45 font-jakarta">
              {timeAgo(post.createdAt)}
            </p>
          </div>
        </div>

        {/* caption */}
        {post.caption && (
          <p className="text-sm text-ink/80 dark:text-cream/80 font-jakarta leading-relaxed">
            {post.caption}
          </p>
        )}

        {/* comments */}
        {comments.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {comments.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-lavender/60 grid place-items-center text-[10px] font-fraunces text-ink shrink-0 mt-0.5">
                  {(c.user?.name || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 rounded-xl bg-cream/60 dark:bg-white/5 px-3 py-2">
                  <p className="text-[11px] font-jakarta font-semibold text-ink dark:text-cream">
                    {c.user?.name || "Buyer"}
                  </p>
                  <p className={`text-[11px] mt-0.5 font-jakarta ${c.moderation?.flagged ? "text-coral italic" : "text-ink/70 dark:text-cream/70"}`}>
                    {c.moderation?.flagged ? "Hidden by Controlled Chats" : c.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* comment input */}
        {user && (
          <form onSubmit={submit} className="flex gap-2 pt-1 border-t border-ink/5 dark:border-white/8">
            <Input
              placeholder="Add a comment..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm">Post</Button>
          </form>
        )}
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════
   COMPOSE MODAL
══════════════════════════════════════════ */
function ComposeModal({ open, onClose, onPosted }) {
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!caption.trim() && media.length === 0) return;

    const uploaded = media.filter((m) => m.url);
    if (media.length > 0 && uploaded.length === 0) {
      toast.error("Please wait for images to finish uploading");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/posts", {
        caption,
        kind: uploaded.length > 0 ? "photo" : "text",
        media: uploaded.map((m) => ({ url: m.url, kind: "image" })),
      });
      onPosted(data.post);
      setCaption("");
      setMedia([]);
      toast.success("Post published! 🎉");
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create post" eyebrow="Share with the gully">
      <form onSubmit={submit} className="space-y-4">
        <MediaUploader
          label="Photos"
          value={media}
          onChange={setMedia}
          multiple
          accept="image/*"
          maxFiles={6}
        />
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
        <Button
          type="submit"
          className="w-full"
          size="md"
          disabled={loading || (!caption.trim() && media.length === 0)}
        >
          {loading ? "Posting..." : "Post to feed"}
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
  const [page, setPage] = useState(1);
  const [hashtag, setHashtag] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [openPost, setOpenPost] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
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
        setPosts((prev) => (p === 1 ? data.items : [...prev, ...data.items]));
        if ((data.items || []).length < 12) setDone(true);
      } finally {
        setLoading(false);
      }
    },
    [loading, done, hashtag],
  );

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setDone(false);
    load(1, hashtag);
    // eslint-disable-next-line
  }, [hashtag]);

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
      { rootMargin: "300px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [page, loading, done, load]);

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
            <Button
              onClick={() => setComposeOpen(true)}
              size="md"
              leftIcon={<HiOutlinePlusCircle />}
              className="shrink-0"
            >
              Create post
            </Button>
          )}
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

      {/* ── feed grid ── */}
      <AnimatePresence mode="wait">
        {posts.length === 0 && !loading ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              title="No posts yet"
              hint="Check back or try a different hashtag"
            />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <FeedGrid posts={posts} onOpen={setOpenPost} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* loading spinner */}
      {loading && (
        <div className="grid place-items-center py-10">
          <Spinner />
        </div>
      )}

      {/* infinite scroll sentinel */}
      <div ref={sentinel} className="h-10" />

      {/* end of feed */}
      {done && posts.length > 0 && (
        <div className="text-center py-10">
          <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-jakarta font-semibold text-ink/30 dark:text-cream/30">
            <span className="w-12 h-px bg-ink/15 dark:bg-cream/15" />
            End of the gully
            <span className="w-12 h-px bg-ink/15 dark:bg-cream/15" />
          </div>
        </div>
      )}

      {/* modals */}
      <PostModal post={openPost} onClose={() => setOpenPost(null)} />
      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onPosted={(p) => {
          setPosts((arr) => [p, ...arr]);
          setComposeOpen(false);
        }}
      />
    </div>
  );
}