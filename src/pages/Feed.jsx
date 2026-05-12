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

const HASHTAGS = [
  "handmadeinindia",
  "vocalforlocal",
  "desi",
  "indianartisan",
];

/* =========================================================
   HELPERS
========================================================= */

function timeAgo(dateStr) {
  if (!dateStr) return "";

  const diff = (Date.now() - new Date(dateStr)) / 1000;

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

  return `${Math.floor(diff / 86400)}d ago`;
}

/* =========================================================
   POST CARD
========================================================= */

function PostCard({ post, onOpen, onDeleted, onEdited }) {
  const user = useAuthStore((s) => s.user);

  const [liked, setLiked] = useState(
    post.likes?.includes?.(user?._id)
  );

  const [likeCount, setLikeCount] = useState(
    post.likes?.length || 0
  );

  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);

  const img = post.media?.[0]?.url;

  const tagged = post.taggedProducts || [];

  const isOwner = user?._id === post.author?._id;

  useEffect(() => {
    function handle(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handle);

    return () =>
      document.removeEventListener("mousedown", handle);
  }, []);

  async function toggleLike() {
    if (!user) {
      toast.error("Login karein pehle");
      return;
    }

    setLiked((v) => !v);
    setLikeCount((c) => c + (liked ? -1 : 1));

    try {
      const { data } = await api.post(
        `/posts/${post._id}/like`
      );

      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch {
      toast.error("Like update nahi hua");
    }
  }

  function toggleSave() {
    if (!user) {
      toast.error("Login karein pehle");
      return;
    }

    setSaved((v) => !v);

    toast.success(
      saved
        ? "Saved se hata diya"
        : "Post save ho gayi 🔖"
    );
  }

  function handleShare() {
    const url = `${window.location.origin}/feed?post=${post._id}`;

    if (navigator.share) {
      navigator.share({
        title: post.author?.name,
        text: post.caption,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copy ho gaya 📋");
    }
  }

  async function handleDelete() {
    if (!window.confirm("Yeh post delete karni hai?")) return;

    try {
      await api.delete(`/posts/${post._id}`);

      toast.success("Post delete ho gayi");

      onDeleted?.(post._id);
    } catch (err) {
      console.error(err);
      toast.error("Delete nahi ho saki");
    }

    setMenuOpen(false);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group relative rounded-2xl overflow-hidden bg-white dark:bg-white/5 border border-ink/5 dark:border-white/10 hover:shadow-soft transition-all duration-300 flex flex-col"
    >
      {/* IMAGE */}

      <div
        className="relative overflow-hidden cursor-pointer w-full shrink-0"
        style={{ paddingTop: "100%" }}
        onClick={() => onOpen?.(post)}
      >
        {img ? (
          <img
            src={img}
            alt="post"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-lavender/10 grid place-items-center">
            <HiOutlinePhoto className="text-4xl text-ink/20" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />

        {/* TIME */}

        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur text-[10px] text-white font-semibold">
          {timeAgo(post.createdAt)}
        </div>

        {/* OWNER MENU */}

        {isOwner && (
          <div
            ref={menuRef}
            className="absolute top-2 right-2"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="w-8 h-8 rounded-full bg-black/50 backdrop-blur grid place-items-center text-white"
            >
              <HiOutlineEllipsisHorizontal />
            </button>

            {menuOpen && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.95,
                  y: -5,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-white dark:bg-zinc-900 border border-ink/10 shadow-lg py-1 z-50"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onEdited?.(post);
                  }}
                  className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-ink/5"
                >
                  <HiOutlinePencilSquare />
                  Edit
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 text-coral hover:bg-coral/5"
                >
                  <HiOutlineTrash />
                  Delete
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* TAGGED PRODUCT */}

        {tagged[0] && (
          <Link
            to={`/product/${tagged[0]._id}`}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-ink text-[10px] font-semibold shadow-soft"
          >
            <HiOutlineShoppingBag className="text-coral text-xs" />

            <span className="truncate max-w-[120px]">
              {tagged[0].title}
            </span>
          </Link>
        )}
      </div>

      {/* BODY */}

      <div className="p-3.5 flex flex-col flex-1">
        <Link
          to={`/profile/${post.author?._id}`}
          className="flex items-center gap-2"
        >
          <Avatar
            src={post.author?.avatar}
            name={post.author?.name}
            size="xs"
            aura={post.author?.trustScore}
          />

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[11px] text-ink dark:text-cream flex items-center gap-1 truncate">
              <span className="truncate">
                {post.author?.shopName ||
                  post.author?.name}
              </span>

              {post.author?.isVerifiedSeller && (
                <HiOutlineShieldCheck className="text-leaf text-xs shrink-0" />
              )}
            </p>

            <p className="text-[9px] text-ink/40">
              {timeAgo(post.createdAt)}
            </p>
          </div>
        </Link>

        <p className="mt-2 text-[11px] text-ink/70 dark:text-cream/70 leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {post.caption}
        </p>

        {post.hashtags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.hashtags.slice(0, 3).map((h) => (
              <span
                key={h}
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-lavender/30 text-mauve font-bold"
              >
                #{h}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* ACTIONS */}

        <div className="mt-3 pt-2.5 border-t border-ink/5 flex items-center gap-3">
          {/* LIKE */}

          <button
            onClick={toggleLike}
            className="flex items-center gap-1 text-[11px] text-ink/50 hover:text-coral transition"
          >
            {liked ? (
              <HiHeart className="text-coral text-sm" />
            ) : (
              <HiOutlineHeart className="text-sm" />
            )}

            {likeCount > 0 && (
              <span>{likeCount}</span>
            )}
          </button>

          {/* COMMENT */}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.(post);
            }}
            className="flex items-center gap-1 text-[11px] text-ink/50 hover:text-ink transition"
          >
            <HiOutlineChatBubbleOvalLeft className="text-sm" />

            {post.comments?.length > 0 && (
              <span>{post.comments.length}</span>
            )}
          </button>

          {/* SHARE */}

          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-[11px] text-ink/50 hover:text-ink transition"
          >
            <HiOutlinePaperAirplane className="text-sm" />
          </button>

          {/* SAVE */}

          <button
            onClick={toggleSave}
            className="ml-auto flex items-center gap-1 text-[11px] text-ink/50 hover:text-amber-500 transition"
          >
            {saved ? (
              <HiBookmark className="text-amber-500 text-sm" />
            ) : (
              <HiOutlineBookmark className="text-sm" />
            )}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   REEL CARD
========================================================= */

function ReelCard({
  reel,
  onPlay,
  onDeleted,
  onEdited,
}) {
  const user = useAuthStore((s) => s.user);

  const [liked, setLiked] = useState(
    reel.likes?.includes?.(user?._id)
  );

  const [likeCount, setLikeCount] = useState(
    reel.likes?.length || 0
  );

  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);

  const isOwner = user?._id === reel.author?._id;

  const thumb =
    reel.thumbnail || reel.media?.[0]?.url;

  useEffect(() => {
    function handle(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handle);

    return () =>
      document.removeEventListener(
        "mousedown",
        handle
      );
  }, []);

  async function toggleLike() {
    if (!user) {
      toast.error("Login karein pehle");
      return;
    }

    setLiked((v) => !v);
    setLikeCount((c) => c + (liked ? -1 : 1));

    try {
      const { data } = await api.post(
        `/posts/${reel._id}/like`
      );

      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch {}
  }

  async function handleDelete() {
    if (!window.confirm("Yeh reel delete karni hai?"))
      return;

    try {
      await api.delete(`/posts/${reel._id}`);

      toast.success("Reel delete ho gayi");

      onDeleted?.(reel._id);
    } catch {
      toast.error("Delete nahi ho saki");
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
        <img
          src={thumb}
          alt=""
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-coral/40 to-mauve/40 grid place-items-center">
          <HiOutlineFilm className="text-5xl text-white/30" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {/* PLAY */}

      <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition">
        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 grid place-items-center">
          <HiOutlinePlay className="text-white text-2xl ml-0.5" />
        </div>
      </div>

      {/* MENU */}

      {isOwner && (
        <div
          ref={menuRef}
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 rounded-full bg-black/50 text-white grid place-items-center"
          >
            <HiOutlineEllipsisHorizontal />
          </button>

          {menuOpen && (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-white dark:bg-zinc-900 border border-ink/10 shadow-lg py-1"
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdited?.(reel);
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-ink/5"
              >
                <HiOutlinePencilSquare />
                Edit
              </button>

              <button
                onClick={handleDelete}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-coral hover:bg-coral/5"
              >
                <HiOutlineTrash />
                Delete
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* BOTTOM */}

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
      </div>
    </motion.div>
  );
}

/* =========================================================
   VIDEO MODAL
========================================================= */

function VideoModal({ reel, onClose }) {
  const videoRef = useRef(null);

  const videoUrl = reel?.media?.find(
    (m) => m.kind === "video"
  )?.url;

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.play().catch(() => {});
    }
  }, [videoUrl]);

  if (!reel) return null;

  return (
    <Modal
      open={!!reel}
      onClose={onClose}
      title={reel.author?.name || "Reel"}
      width="max-w-sm"
    >
      <div className="space-y-3">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            className="w-full rounded-xl max-h-[70vh] bg-ink"
          />
        ) : (
          <div className="w-full h-64 rounded-xl bg-ink/10 grid place-items-center">
            <p className="text-xs text-ink/40">
              Video unavailable
            </p>
          </div>
        )}

        {reel.caption && (
          <p className="text-sm text-ink/80 dark:text-cream/80">
            {reel.caption}
          </p>
        )}
      </div>
    </Modal>
  );
}

/* =========================================================
   POST MODAL
========================================================= */

function PostModal({ post, onClose }) {
  const user = useAuthStore((s) => s.user);

  const [text, setText] = useState("");
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!post) return;

    api
      .get(`/posts/${post._id}`)
      .then(({ data }) => {
        setComments(data.post.comments || []);
      })
      .catch(() => {});
  }, [post]);

  async function submit(e) {
    e.preventDefault();

    if (!text.trim()) return;

    try {
      const { data } = await api.post(
        `/posts/${post._id}/comment`,
        { text }
      );

      setComments((c) => [...c, data.comment]);

      setText("");
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          "Comment nahi ho saka"
      );
    }
  }

  if (!post) return null;

  return (
    <Modal
      open={!!post}
      onClose={onClose}
      title={
        post.author?.shopName ||
        post.author?.name ||
        "Post"
      }
      width="max-w-2xl"
    >
      <div className="space-y-4">
        {post.media?.[0]?.url && (
          <div className="rounded-xl overflow-hidden">
            <img
              src={post.media[0].url}
              alt=""
              className="w-full max-h-[55vh] object-cover"
            />
          </div>
        )}

        {post.caption && (
          <p className="text-sm text-ink/80 dark:text-cream/80 leading-relaxed">
            {post.caption}
          </p>
        )}

        {comments.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {comments.map((c, i) => (
              <div
                key={i}
                className="rounded-xl bg-cream/60 dark:bg-white/5 px-3 py-2"
              >
                <p className="text-[11px] font-semibold">
                  {c.user?.name || "User"}
                </p>

                <p className="text-[11px] text-ink/70 dark:text-cream/70">
                  {c.text}
                </p>
              </div>
            ))}
          </div>
        )}

        {user && (
          <form
            onSubmit={submit}
            className="flex gap-2 pt-1 border-t border-ink/5"
          >
            <Input
              placeholder="Comment likho..."
              value={text}
              onChange={(e) =>
                setText(e.target.value)
              }
              className="flex-1"
            />

            <Button type="submit" size="sm">
              Post
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
}

/* =========================================================
   COMPOSE MODAL
========================================================= */

function ComposeModal({
  open,
  onClose,
  onPosted,
  editPost,
}) {
  const [caption, setCaption] = useState(
    editPost?.caption || ""
  );

  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(editPost);

  useEffect(() => {
    if (editPost) {
      setCaption(editPost.caption || "");
    }
  }, [editPost]);

  async function submit(e) {
    e.preventDefault();

    if (!caption.trim() && media.length === 0)
      return;

    const uploaded = media.filter((m) => m.url);

    if (
      media.length > 0 &&
      uploaded.length === 0
    ) {
      toast.error("Images upload hone do pehle");
      return;
    }

    setLoading(true);

    try {
      let data;

      if (isEdit) {
        ({ data } = await api.patch(
          `/posts/${editPost._id}`,
          { caption }
        ));

        toast.success("Post update ho gayi ✅");
      } else {
        ({ data } = await api.post("/posts", {
          caption,
          kind:
            uploaded.length > 0
              ? "photo"
              : "text",
          media: uploaded.map((m) => ({
            url: m.url,
            kind: "image",
          })),
        }));

        toast.success("Post publish ho gayi 🎉");
      }

      onPosted(data.post, isEdit);

      setCaption("");
      setMedia([]);
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          "Post nahi ho saki"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isEdit
          ? "Post edit karo"
          : "Post banao"
      }
    >
      <form
        onSubmit={submit}
        className="space-y-4"
      >
        {!isEdit && (
          <MediaUploader
            label="Photos"
            value={media}
            onChange={setMedia}
            multiple
            accept="image/*"
            maxFiles={6}
          />
        )}

        <textarea
          value={caption}
          onChange={(e) =>
            setCaption(e.target.value)
          }
          placeholder="Caption likho..."
          rows={3}
          className="w-full rounded-xl border border-ink/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-coral resize-none"
        />

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading
            ? "Loading..."
            : isEdit
            ? "Update Post"
            : "Publish Post"}
        </Button>
      </form>
    </Modal>
  );
}

/* =========================================================
   REEL MODAL
========================================================= */

function ReelModal({
  open,
  onClose,
  onPosted,
  editReel,
}) {
  const [caption, setCaption] = useState(
    editReel?.caption || ""
  );

  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(editReel);

  useEffect(() => {
    if (editReel) {
      setCaption(editReel.caption || "");
    }
  }, [editReel]);

  async function submit(e) {
    e.preventDefault();

    const uploaded = media.filter((m) => m.url);

    setLoading(true);

    try {
      let data;

      if (isEdit) {
        ({ data } = await api.patch(
          `/posts/${editReel._id}`,
          { caption }
        ));

        toast.success("Reel update ho gayi ✅");
      } else {
        ({ data } = await api.post("/posts", {
          caption,
          kind: "video",
          media: uploaded.map((m) => ({
            url: m.url,
            kind: "video",
          })),
        }));

        toast.success("Reel upload ho gayi 🎬");
      }

      onPosted(data.post, isEdit);

      setCaption("");
      setMedia([]);
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          "Reel upload fail"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isEdit
          ? "Reel edit karo"
          : "Reel upload karo"
      }
    >
      <form
        onSubmit={submit}
        className="space-y-4"
      >
        {!isEdit && (
          <MediaUploader
            label="Video"
            value={media}
            onChange={setMedia}
            accept="video/*"
            maxFiles={1}
          />
        )}

        <textarea
          value={caption}
          onChange={(e) =>
            setCaption(e.target.value)
          }
          placeholder="Caption..."
          rows={3}
          className="w-full rounded-xl border border-ink/10 bg-white dark:bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-coral resize-none"
        />

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading
            ? "Loading..."
            : isEdit
            ? "Update Reel"
            : "Publish Reel"}
        </Button>
      </form>
    </Modal>
  );
}

/* =========================================================
   MAIN FEED
========================================================= */

export default function Feed() {
  const user = useAuthStore((s) => s.user);

  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const [hashtag, setHashtag] = useState(null);

  const [activeTab, setActiveTab] =
    useState("posts");

  const [composeOpen, setComposeOpen] =
    useState(false);

  const [reelOpen, setReelOpen] =
    useState(false);

  const [editingPost, setEditingPost] =
    useState(null);

  const [editingReel, setEditingReel] =
    useState(null);

  const [openPost, setOpenPost] =
    useState(null);

  const [playingReel, setPlayingReel] =
    useState(null);

  const sentinel = useRef(null);

  const [searchParams] = useSearchParams();

  const load = useCallback(
    async (p = 1, tag = hashtag) => {
      if (loading || done) return;

      setLoading(true);

      try {
        const params = {
          page: p,
          limit: 12,
        };

        if (tag) {
          params.hashtag = tag;
        }

        const { data } = await api.get(
          "/posts",
          { params }
        );

        const items = data.items || [];

        const photoPosts = items.filter(
          (i) => i.kind !== "video"
        );

        const videoReels = items.filter(
          (i) => i.kind === "video"
        );

        setPosts((prev) =>
          p === 1
            ? photoPosts
            : [...prev, ...photoPosts]
        );

        setReels((prev) =>
          p === 1
            ? videoReels
            : [...prev, ...videoReels]
        );

        if (items.length < 12) {
          setDone(true);
        }
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

    if (!postId) {
      setOpenPost(null);
      return;
    }

    api
      .get(`/posts/${postId}`)
      .then(({ data }) => {
        if (data?.post) {
          setOpenPost(data.post);
        }
      })
      .catch(() => {
        setOpenPost(null);
      });
  }, [searchParams]);

  useEffect(() => {
    const el = sentinel.current;

    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loading &&
          !done
        ) {
          const next = page + 1;

          setPage(next);

          load(next);
        }
      },
      {
        rootMargin: "300px",
      }
    );

    obs.observe(el);

    return () => obs.disconnect();
  }, [page, loading, done, load]);

  function handlePostPosted(post, isEdit) {
    if (isEdit) {
      setPosts((arr) =>
        arr.map((p) =>
          p._id === post._id ? post : p
        )
      );
    } else {
      setPosts((arr) => [post, ...arr]);
    }

    setComposeOpen(false);
    setEditingPost(null);
  }

  function handleReelPosted(reel, isEdit) {
    if (isEdit) {
      setReels((arr) =>
        arr.map((r) =>
          r._id === reel._id ? reel : r
        )
      );
    } else {
      setReels((arr) => [reel, ...arr]);
    }

    setReelOpen(false);
    setEditingReel(null);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* HEADER */}

      <Reveal>
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-coral font-semibold mb-1">
              Today in the gully
            </p>

            <h1 className="font-fraunces text-3xl text-ink dark:text-cream">
              Your Feed
            </h1>

            <p className="text-xs text-ink/50 mt-1">
              Curated by karma.
            </p>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() =>
                  setComposeOpen(true)
                }
                leftIcon={
                  <HiOutlinePlusCircle />
                }
              >
                Create Post
              </Button>

              <Button
                onClick={() =>
                  setReelOpen(true)
                }
                leftIcon={<TbVideoPlus />}
                className="bg-mauve hover:bg-mauve/90 text-white border-0"
              >
                Reel
              </Button>
            </div>
          )}
        </div>
      </Reveal>

      {/* TABS */}

      <div className="flex items-center gap-1 mb-6 bg-white/60 dark:bg-white/5 rounded-full p-1 w-fit border border-ink/5">
        {[
          {
            key: "posts",
            label: "Photos",
            icon: <HiOutlinePhoto />,
          },
          {
            key: "reels",
            label: "Reels",
            icon: <HiOutlineFilm />,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() =>
              setActiveTab(tab.key)
            }
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-semibold transition ${
              activeTab === tab.key
                ? "bg-ink text-white"
                : "text-ink/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* HASHTAGS */}

      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
        <button
          onClick={() => setHashtag(null)}
          className={`px-3 py-1.5 rounded-full text-[11px] border ${
            !hashtag
              ? "bg-ink text-white"
              : "bg-white text-ink/60"
          }`}
        >
          All
        </button>

        {HASHTAGS.map((h) => (
          <button
            key={h}
            onClick={() =>
              setHashtag(
                hashtag === h ? null : h
              )
            }
            className={`px-3 py-1.5 rounded-full text-[11px] border flex items-center gap-1 ${
              hashtag === h
                ? "bg-coral text-white border-coral"
                : "bg-white text-ink/60"
            }`}
          >
            <HiOutlineHashtag />
            {h}
          </button>
        ))}
      </div>

      {/* POSTS */}

      <AnimatePresence mode="wait">
        {activeTab === "posts" && (
          <motion.div
            key="posts"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {posts.length === 0 &&
            !loading ? (
              <EmptyState
                title="Koi post nahi"
                hint="Pehli post banao"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {posts.map((p) => (
                  <PostCard
                    key={p._id}
                    post={p}
                    onOpen={setOpenPost}
                    onDeleted={(id) =>
                      setPosts((arr) =>
                        arr.filter(
                          (x) => x._id !== id
                        )
                      )
                    }
                    onEdited={(post) => {
                      setEditingPost(post);
                      setComposeOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* REELS */}

        {activeTab === "reels" && (
          <motion.div
            key="reels"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {reels.length === 0 &&
            !loading ? (
              <EmptyState
                title="Koi reel nahi"
                hint="Pehli reel upload karo"
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {reels.map((r) => (
                  <ReelCard
                    key={r._id}
                    reel={r}
                    onPlay={setPlayingReel}
                    onDeleted={(id) =>
                      setReels((arr) =>
                        arr.filter(
                          (x) => x._id !== id
                        )
                      )
                    }
                    onEdited={(reel) => {
                      setEditingReel(reel);
                      setReelOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOADER */}

      {loading && (
        <div className="grid place-items-center py-10">
          <Spinner />
        </div>
      )}

      <div ref={sentinel} className="h-10" />

      {/* MODALS */}

      <PostModal
        post={openPost}
        onClose={() => setOpenPost(null)}
      />

      <ComposeModal
        open={composeOpen}
        onClose={() => {
          setComposeOpen(false);
          setEditingPost(null);
        }}
        onPosted={handlePostPosted}
        editPost={editingPost}
      />

      <ReelModal
        open={reelOpen}
        onClose={() => {
          setReelOpen(false);
          setEditingReel(null);
        }}
        onPosted={handleReelPosted}
        editReel={editingReel}
      />

      <VideoModal
        reel={playingReel}
        onClose={() =>
          setPlayingReel(null)
        }
      />
    </div>
  );
}