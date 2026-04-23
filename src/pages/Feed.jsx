import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { HiOutlinePlusCircle, HiOutlineHashtag } from "react-icons/hi2";
import api from "../services/api";
import { MasonryGrid } from "../components/ui/Masonry";
import PostCard from "../components/PostCard";
import { Reveal } from "../components/animations/Reveal";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import MediaUploader from "../components/ui/MediaUploader";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

const HASHTAGS = ["handmadeinindia", "vocalforlocal", "desi", "indianartisan"];

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
        const params = { page: p, limit: 10 };
        if (tag) params.hashtag = tag;
        const { data } = await api.get("/posts", { params });
        setPosts((prev) => (p === 1 ? data.items : [...prev, ...data.items]));
        if ((data.items || []).length < 10) setDone(true);
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
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [page, loading, done, load]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <Reveal>
        <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
          Today in the gully
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-fraunces text-2xl md:text-3xl text-ink tracking-tight">
              Your feed
            </h1>
            <p className="mt-1 text-xs text-ink/55 font-jakarta">
              Curated by karma, not engagement bait.
            </p>
          </div>
          {user && (
            <Button
              onClick={() => setComposeOpen(true)}
              size="md"
              leftIcon={<HiOutlinePlusCircle />}
            >
              Create post
            </Button>
          )}
        </div>
      </Reveal>

      {/* Hashtag filters */}
      <Reveal delay={0.05}>
        <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setHashtag(null)}
            className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-jakarta font-semibold transition border ${
              !hashtag
                ? "bg-ink text-cream border-ink"
                : "bg-white/60 border-ink/5 text-ink/70 hover:border-ink/20"
            }`}
          >
            All
          </button>
          {HASHTAGS.map((h) => (
            <motion.button
              whileTap={{ scale: 0.96 }}
              key={h}
              onClick={() => setHashtag(h)}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-jakarta font-semibold inline-flex items-center gap-1 transition border ${
                hashtag === h
                  ? "bg-coral text-white border-coral"
                  : "bg-white/60 border-ink/5 text-ink/70 hover:border-ink/20"
              }`}
            >
              <HiOutlineHashtag className="text-xs" /> {h}
            </motion.button>
          ))}
        </div>
      </Reveal>

      <div className="mt-6">
        {posts.length === 0 && !loading ? (
          <EmptyState
            title="No posts yet"
            hint="Check back or try a different hashtag"
          />
        ) : (
          <MasonryGrid>
            {posts.map((p) => (
              <PostCard key={p._id} post={p} onOpen={setOpenPost} />
            ))}
          </MasonryGrid>
        )}
        {loading && (
          <div className="grid place-items-center py-6">
            <Spinner />
          </div>
        )}
        <div ref={sentinel} className="h-10" />
        {done && posts.length > 0 && (
          <div className="text-center text-[11px] uppercase tracking-[0.25em] font-jakarta font-semibold text-ink/40 py-8">
            — End of the gully —
          </div>
        )}
      </div>

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
      title={post.author?.shopName || "Post"}
      width="max-w-2xl"
    >
      {post.media?.[0]?.url && (
        <img
          src={post.media[0].url}
          alt=""
          className="w-full max-h-96 object-cover rounded-xl"
        />
      )}
      <p className="mt-3 text-xs text-ink/75 font-jakarta leading-relaxed">
        {post.caption}
      </p>
      <div className="mt-4 max-h-64 overflow-auto space-y-2">
        {comments.map((c, i) => (
          <div key={i} className="rounded-xl bg-cream/60 p-2.5">
            <div className="text-[11px] font-jakarta font-semibold text-ink">
              {c.user?.name || "Buyer"}
            </div>
            <div
              className={`text-xs mt-0.5 ${
                c.moderation?.flagged ? "text-coral italic" : "text-ink/75"
              }`}
            >
              {c.moderation?.flagged
                ? "Message hidden by Controlled Chats"
                : c.text}
            </div>
          </div>
        ))}
      </div>
      {user && (
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <Input
            placeholder="Add a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm">
            Post
          </Button>
        </form>
      )}
    </Modal>
  );
}

function ComposeModal({ open, onClose, onPosted }) {
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState([]); // [{url, publicId}]

  async function submit(e) {
    e.preventDefault();
    if (!caption && media.length === 0) return;
    try {
      const { data } = await api.post("/posts", {
        caption,
        kind: media.length > 0 ? "photo" : "text",
        media: media.map((m) => ({ url: m.url, kind: "image" })),
      });
      onPosted(data.post);
      setCaption("");
      setMedia([]);
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not post");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create post">
      <form onSubmit={submit} className="space-y-3">
        <MediaUploader
          label="Media"
          value={media}
          onChange={setMedia}
          multiple
          accept="image/*"
          maxFiles={6}
        />
        <Input
          label="Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Naya stock, just in from Varanasi..."
        />
        <Button type="submit" className="w-full" size="md">
          Post to feed
        </Button>
      </form>
    </Modal>
  );
}
