import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
import Badge from "./ui/Badge";

export default function PostCard({ post, onOpen }) {
  const user = useAuthStore((s) => s.user);
  const [liked, setLiked] = useState(post.likes?.includes?.(user?._id));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const img = post.media?.[0]?.url;
  const tagged = post.taggedProducts || [];

  async function toggleLike() {
    if (!user) return;
    setLiked(!liked);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch {
      /* non-fatal */
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mb-3 rounded-2xl bg-white/80 border border-ink/5 overflow-hidden group hover:border-ink/15 transition-colors"
    >
      {img && (
        <div className="relative overflow-hidden">
          <img
            src={img}
            alt=""
            className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            loading="lazy"
          />
          {tagged[0] && (
            <Link
              to={`/product/${tagged[0]._id}`}
              className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur text-ink text-[10px] font-jakarta font-semibold hover:bg-white transition"
            >
              <HiOutlineShoppingBag className="text-xs" />
              <span className="truncate max-w-[140px]">
                {tagged[0].title?.slice(0, 28)}
              </span>
            </Link>
          )}
        </div>
      )}
      <div className="p-3">
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
            <div className="font-jakarta font-semibold text-xs text-ink flex items-center gap-1 truncate">
              {post.author?.shopName || post.author?.name}
              {post.author?.isVerifiedSeller && (
                <HiOutlineShieldCheck className="text-leaf text-sm shrink-0" />
              )}
            </div>
          </div>
        </Link>

        {post.caption && (
          <p className="mt-2 text-[12px] text-ink/75 font-jakarta leading-relaxed line-clamp-3">
            {post.caption}
          </p>
        )}

        {post.hashtags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.hashtags.slice(0, 4).map((h) => (
              <span
                key={h}
                className="text-[9px] font-jakarta font-bold text-mauve bg-lavender/40 px-1.5 py-0.5 rounded-full tracking-wider"
              >
                #{h}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-3 text-ink/60 pt-2 border-t border-ink/5">
          <button
            onClick={toggleLike}
            className="flex items-center gap-1 text-[11px] font-jakarta font-semibold hover:text-coral transition"
          >
            {liked ? (
              <HiHeart className="text-coral text-base" />
            ) : (
              <HiOutlineHeart className="text-base" />
            )}
            {likeCount}
          </button>
          <button
            onClick={() => onOpen?.(post)}
            className="flex items-center gap-1 text-[11px] font-jakarta font-semibold hover:text-ink transition"
          >
            <HiOutlineChatBubbleOvalLeft className="text-base" />
            {post.comments?.length || 0}
          </button>
          <button className="flex items-center gap-1 text-[11px] font-jakarta font-semibold hover:text-ink transition">
            <HiOutlinePaperAirplane className="text-base" />
            {post.shares || 0}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
