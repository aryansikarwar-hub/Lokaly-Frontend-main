import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiHeart,
  HiOutlineHeart,
  HiOutlineChatBubbleOvalLeft,
  HiOutlinePaperAirplane,
  HiOutlineShoppingBag,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { Avatar } from "./ui/Avatar";
import toast from "react-hot-toast";

export default function PostCard({ post, onOpen }) {
  const user = useAuthStore((s) => s.user);
  const [liked, setLiked] = useState(post.likes?.includes?.(user?._id));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [submitting, setSubmitting] = useState(false);
  const [shared, setShared] = useState(false);
  const [shareCount, setShareCount] = useState(post.shares || 0);

  const img = post.media?.[0]?.url;
  const tagged = post.taggedProducts || [];

  async function toggleLike() {
    if (!user) { toast("Please log in to like posts"); return; }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!user) { toast("Please log in to comment"); return; }
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/posts/${post._id}/comment`, { text: commentText.trim() });
      setComments((c) => [...c, data.comment || { text: commentText.trim(), author: user, _id: Date.now() }]);
      setCommentText("");
      toast.success("Comment added!");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not post comment");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/post/${post._id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.caption || "Lokaly post", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied!");
      }
      if (!shared) {
        setShared(true);
        setShareCount((c) => c + 1);
        api.post(`/posts/${post._id}/share`).catch(() => {});
      }
    } catch { /* user cancelled */ }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mb-2.5 rounded-xl bg-white/85 border border-ink/5 overflow-hidden group hover:border-ink/15 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      {/* Image — compact 4:3 aspect */}
      {img && (
        <div
          className="relative overflow-hidden cursor-pointer"
          style={{ paddingTop: "75%" }}
          onClick={() => onOpen?.(post)}
        >
          <img
            src={img}
            alt=""
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {tagged[0] && (
            <Link
              to={`/product/${tagged[0]._id}`}
              className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur text-ink text-[9px] font-jakarta font-semibold hover:bg-white transition shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <HiOutlineShoppingBag className="text-[10px]" />
              <span className="truncate max-w-[110px]">{tagged[0].title?.slice(0, 22)}</span>
            </Link>
          )}
        </div>
      )}

      {/* Card body */}
      <div className="px-3 py-2">
        <Link to={`/profile/${post.author?._id}`} className="flex items-center gap-1.5">
          <Avatar src={post.author?.avatar} name={post.author?.name} size="xs" aura={post.author?.trustScore} />
          <div className="flex-1 min-w-0">
            <div className="font-jakarta font-semibold text-[11px] text-ink flex items-center gap-0.5 truncate">
              {post.author?.shopName || post.author?.name}
              {post.author?.isVerifiedSeller && (
                <HiOutlineShieldCheck className="text-leaf text-[10px] shrink-0" />
              )}
            </div>
          </div>
        </Link>

        {post.caption && (
          <p className="mt-1.5 text-[11px] text-ink/70 font-jakarta leading-relaxed line-clamp-2">
            {post.caption}
          </p>
        )}

        {post.hashtags?.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {post.hashtags.slice(0, 3).map((h) => (
              <span key={h} className="text-[8px] font-jakarta font-bold text-mauve bg-lavender/40 px-1.5 py-0.5 rounded-full tracking-wider">
                #{h}
              </span>
            ))}
          </div>
        )}

        {/* Action bar */}
        <div className="mt-2 flex items-center gap-0 pt-1.5 border-t border-ink/5">
          {/* Like */}
          <motion.button whileTap={{ scale: 0.82 }} onClick={toggleLike}
            className="flex items-center gap-1 text-[10px] font-jakarta font-semibold px-2 py-1 rounded-lg hover:bg-coral/8 transition-colors">
            <motion.span animate={liked ? { scale: [1, 1.35, 1] } : { scale: 1 }} transition={{ duration: 0.22 }}>
              {liked
                ? <HiHeart className="text-coral text-[13px]" />
                : <HiOutlineHeart className="text-ink/45 text-[13px]" />}
            </motion.span>
            <span className={liked ? "text-coral" : "text-ink/45"}>{likeCount > 0 ? likeCount : ""}</span>
          </motion.button>

          {/* Comment */}
          <motion.button whileTap={{ scale: 0.82 }} onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1 text-[10px] font-jakarta font-semibold px-2 py-1 rounded-lg hover:bg-ink/5 transition-colors">
            <HiOutlineChatBubbleOvalLeft className={`text-[13px] transition-colors ${showComments ? "text-ink" : "text-ink/45"}`} />
            <span className={showComments ? "text-ink" : "text-ink/45"}>{comments.length > 0 ? comments.length : ""}</span>
          </motion.button>

          {/* Share */}
          <motion.button whileTap={{ scale: 0.82 }} onClick={handleShare}
            className="flex items-center gap-1 text-[10px] font-jakarta font-semibold px-2 py-1 rounded-lg hover:bg-ink/5 transition-colors">
            <HiOutlinePaperAirplane className={`text-[13px] transition-colors ${shared ? "text-leaf" : "text-ink/45"}`} />
            <span className={shared ? "text-leaf" : "text-ink/45"}>{shareCount > 0 ? shareCount : ""}</span>
          </motion.button>
        </div>
      </div>

      {/* Comments panel */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden border-t border-ink/5"
          >
            <div className="px-3 py-2 bg-ink/[0.02]">
              {comments.length > 0 && (
                <div className="space-y-1.5 mb-2 max-h-28 overflow-y-auto pr-1">
                  {comments.map((c, i) => (
                    <div key={c._id || i} className="flex items-start gap-1.5">
                      <Avatar src={c.author?.avatar} name={c.author?.name} size="xs" />
                      <div className="flex-1 min-w-0 bg-white/70 rounded-lg px-2 py-1">
                        <span className="font-jakarta font-semibold text-[10px] text-ink/80">{c.author?.name || "User"} </span>
                        <span className="font-jakarta text-[10px] text-ink/65">{c.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={submitComment} className="flex items-center gap-1.5">
                <Avatar src={user?.avatar} name={user?.name} size="xs" />
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={user ? "Write a comment..." : "Log in to comment"}
                  disabled={!user || submitting}
                  className="flex-1 bg-white/80 border border-ink/8 rounded-full px-2.5 py-1 text-[10px] font-jakarta placeholder:text-ink/35 outline-none focus:border-ink/20 transition min-w-0 disabled:opacity-50"
                />
                <motion.button whileTap={{ scale: 0.88 }} type="submit"
                  disabled={!user || !commentText.trim() || submitting}
                  className="shrink-0 w-6 h-6 rounded-full bg-ink/85 text-cream flex items-center justify-center disabled:opacity-30 transition">
                  <HiOutlinePaperAirplane className="text-[10px]" />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}