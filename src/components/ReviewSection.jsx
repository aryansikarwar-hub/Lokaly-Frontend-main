import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiStar,
  HiOutlineStar,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineHandThumbUp,
  HiOutlinePhoto,
  HiOutlineXMark,
  HiOutlineCheck,
} from "react-icons/hi2";
import { Avatar } from "./ui/Avatar";
import Badge from "./ui/Badge";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import MediaUploader from "./ui/MediaUploader";
import toast from "react-hot-toast";

// ─── Star Rating Input ────────────────────────────────────────────────────────
function StarInput({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-xl transition-transform hover:scale-110 disabled:cursor-default"
        >
          {star <= (hovered || value) ? (
            <HiStar className="text-tangerine" />
          ) : (
            <HiOutlineStar className="text-ink/30" />
          )}
        </button>
      ))}
      <span className="ml-1.5 text-[11px] font-jakarta text-ink/50">
        {value
          ? ["", "Poor", "Fair", "Good", "Great", "Excellent"][value]
          : "Tap to rate"}
      </span>
    </div>
  );
}

// ─── Review Form ──────────────────────────────────────────────────────────────
function ReviewForm({ productId, existing, onSaved, onCancel }) {
  const [rating, setRating] = useState(existing?.rating || 0);
  const [text, setText] = useState(existing?.text || "");
  const [images, setImages] = useState(existing?.images || []);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!rating) return toast.error("Please select a rating");
    setSaving(true);
    try {
      if (existing) {
        const { data } = await api.patch(`/reviews/${existing._id}`, {
          rating,
          text,
          images,
        });
        onSaved(data.review, "updated");
      } else {
        const { data } = await api.post("/reviews", {
          product: productId,
          rating,
          text,
          images,
        });
        onSaved(data.review, "created");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save review");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onSubmit={submit}
      className="rounded-2xl bg-white/80 border border-coral/20 p-4 space-y-3"
    >
      <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-bold text-coral">
        {existing ? "Edit your review" : "Write a review"}
      </div>

      {/* Star rating */}
      <div>
        <div className="text-[10px] font-jakarta font-semibold text-ink/50 mb-1">
          Rating *
        </div>
        <StarInput value={rating} onChange={setRating} disabled={saving} />
      </div>

      {/* Comment */}
      <div>
        <div className="text-[10px] font-jakarta font-semibold text-ink/50 mb-1">
          Comment
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={3}
          disabled={saving}
          className="w-full rounded-xl bg-white/80 border border-ink/10 focus:border-coral/40 outline-none px-3 py-2 text-xs font-jakarta text-ink placeholder:text-ink/40 resize-none transition"
        />
      </div>

      {/* Image upload */}
      <div>
        <div className="text-[10px] font-jakarta font-semibold text-ink/50 mb-1">
          Photos (optional)
        </div>
        <MediaUploader
          value={images}
          onChange={setImages}
          multiple
          accept="image/*"
          maxFiles={4}
          maxSizeMB={8}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 px-4 py-2 rounded-xl border border-ink/10 text-xs font-jakarta font-semibold text-ink/60 hover:border-ink/30 transition disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !rating}
          className="flex-1 px-4 py-2 rounded-xl bg-coral text-white text-xs font-jakarta font-bold hover:bg-coral/90 transition disabled:opacity-40 flex items-center justify-center gap-1.5"
        >
          <HiOutlineCheck className="text-sm" />
          {saving ? "Saving..." : existing ? "Update" : "Submit review"}
        </button>
      </div>
    </motion.form>
  );
}

// ─── Single Review Card ───────────────────────────────────────────────────────
function ReviewCard({ review, currentUserId, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [liked, setLiked] = useState(
    review.helpfulVotes?.includes(currentUserId),
  );
  const [likeCount, setLikeCount] = useState(review.helpfulVotes?.length || 0);
  const [deleting, setDeleting] = useState(false);
  const isOwner =
    currentUserId && String(review.buyer?._id) === String(currentUserId);

  async function toggleLike() {
    try {
      const { data } = await api.post(`/reviews/${review._id}/helpful`);
      setLiked(data.helpful);
      setLikeCount(data.count);
    } catch {
      toast.error("Could not like review");
    }
  }

  async function deleteReview() {
    if (!window.confirm("Delete your review?")) return;
    setDeleting(true);
    try {
      await api.delete(`/reviews/${review._id}`);
      onDeleted(review._id);
      toast.success("Review deleted");
    } catch {
      toast.error("Could not delete review");
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <ReviewForm
        productId={review.product}
        existing={review}
        onSaved={(updated) => {
          onUpdated(updated);
          setEditing(false);
          toast.success("Review updated!");
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl bg-white/70 p-4 border border-ink/5 space-y-2"
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <Avatar
          src={review.buyer?.avatar}
          name={review.buyer?.name}
          size="xs"
        />
        <div className="flex-1 min-w-0">
          <div className="font-jakarta font-semibold text-xs text-ink truncate flex items-center gap-1.5">
            {review.buyer?.name || "Buyer"}
            {review.isRepeatBuyer && (
              <span className="text-[8px] bg-lavender text-mauve font-bold px-1.5 py-0.5 rounded-full">
                Repeat buyer
              </span>
            )}
          </div>
          {/* Stars */}
          <div className="flex items-center gap-0.5 mt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <HiStar
                key={i}
                className={
                  i < review.rating
                    ? "text-tangerine text-xs"
                    : "text-ink/15 text-xs"
                }
              />
            ))}
            <span className="ml-1 text-[9px] font-jakarta text-ink/40">
              {new Date(review.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Sentiment badge */}
        {review.sentiment?.label === "NEGATIVE" ? (
          <Badge tone="coral">Critical</Badge>
        ) : review.sentiment?.label === "POSITIVE" ? (
          <Badge tone="mint">Positive</Badge>
        ) : null}

        {/* Owner actions */}
        {isOwner && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="w-7 h-7 grid place-items-center rounded-full hover:bg-peach/60 text-ink/40 hover:text-coral transition"
              title="Edit review"
            >
              <HiOutlinePencil className="text-xs" />
            </button>
            <button
              onClick={deleteReview}
              disabled={deleting}
              className="w-7 h-7 grid place-items-center rounded-full hover:bg-coral/10 text-ink/40 hover:text-coral transition disabled:opacity-40"
              title="Delete review"
            >
              <HiOutlineTrash className="text-xs" />
            </button>
          </div>
        )}
      </div>

      {/* Review text */}
      {review.text && (
        <p className="text-[12px] text-ink/75 font-jakarta leading-relaxed">
          {review.text}
        </p>
      )}

      {/* Review images */}
      {review.images?.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {review.images.map((img, i) => (
            <a key={i} href={img.url} target="_blank" rel="noopener noreferrer">
              <img
                src={img.url}
                alt={`Review photo ${i + 1}`}
                className="w-16 h-16 rounded-lg object-cover border border-ink/5 hover:border-coral/30 transition"
              />
            </a>
          ))}
        </div>
      )}

      {/* Like button */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1 text-[10px] font-jakarta font-semibold px-2.5 py-1 rounded-full border transition ${
            liked
              ? "bg-coral/10 border-coral/20 text-coral"
              : "border-ink/10 text-ink/40 hover:border-coral/20 hover:text-coral"
          }`}
        >
          <HiOutlineHandThumbUp className="text-xs" />
          Helpful {likeCount > 0 && `(${likeCount})`}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main ReviewSection ───────────────────────────────────────────────────────
export default function ReviewSection({ productId, initialReviews = [] }) {
  const user = useAuthStore((s) => s.user);
  const [reviews, setReviews] = useState(initialReviews);
  const [showForm, setShowForm] = useState(false);
   
  useEffect(() => {
    if (!productId) return;
    api
      .get(`/reviews/product/${productId}`)
      .then(({ data }) => setReviews(data.items || []))
      .catch(() => {});
  }, [productId]);

  const myReview = reviews.find(
    (r) => String(r.buyer?._id) === String(user?._id),
  );
  const canReview = !!user && !myReview;

  function handleSaved(review, mode) {
    if (mode === "created") {
      // Merge current user as buyer since backend may not populate on create
      const enriched = {
        ...review,
        buyer: review.buyer || {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
        },
      };
      setReviews((prev) => [enriched, ...prev]);
      toast.success("Review submitted! You earned 10 coins 🎉");
    } else {
      setReviews((prev) =>
        prev.map((r) =>
          r._id === review._id ? { ...review, buyer: r.buyer } : r,
        ),
      );
    }
    setShowForm(false);
  }

  function handleDeleted(reviewId) {
    setReviews((prev) => prev.filter((r) => r._id !== reviewId));
  }

  function handleUpdated(updated) {
    setReviews((prev) =>
      prev.map((r) => (r._id === updated._id ? updated : r)),
    );
  }

  return (
    <section className="mt-12">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-1">
            Community feedback
          </div>
          <h2 className="font-fraunces text-xl md:text-2xl text-ink tracking-tight">
            Reviews{" "}
            <span className="text-ink/40 font-normal">({reviews.length})</span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {reviews.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-ink/70 font-jakarta">
              <HiStar className="text-tangerine" />
              <span className="font-semibold text-ink">
                {(
                  reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
                ).toFixed(1)}
              </span>
              <span>average</span>
            </div>
          )}
          {canReview && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 bg-coral text-white text-xs font-jakarta font-bold px-4 py-2 rounded-full hover:bg-coral/90 transition shadow-sm"
            >
              <HiStar className="text-sm" />
              Write a review
            </button>
          )}
        </div>
      </div>

      {/* Review form */}
      <AnimatePresence>
        {showForm && (
          <div className="mb-4">
            <ReviewForm
              productId={productId}
              onSaved={handleSaved}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Not logged in prompt */}
      {!user && (
        <div className="rounded-2xl bg-peach/30 border border-coral/15 p-4 text-center mb-4">
          <p className="text-xs font-jakarta text-ink/60">
            <a
              href="/login"
              className="text-coral font-semibold hover:underline"
            >
              Log in
            </a>{" "}
            to write a review and earn 10 coins!
          </p>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="rounded-2xl bg-white/60 border border-ink/5 p-6 text-center">
          <p className="text-xs text-ink/55 font-jakarta italic">
            No reviews yet — be the first to share your experience.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          <AnimatePresence>
            {reviews.map((r) => (
              <ReviewCard
                key={r._id}
                review={r}
                currentUserId={user?._id}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
