import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiStar,
  HiOutlineShieldCheck,
  HiOutlineBolt,
  HiOutlineMapPin,
  HiOutlineHeart,
  HiOutlineChatBubbleLeftRight,
  HiOutlineShoppingBag,
  HiOutlineTruck,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import api from "../services/api";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { Spinner } from "../components/ui/Spinner";
import { Reveal } from "../components/animations/Reveal";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [adding, setAdding] = useState(false);
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const addToCart = useCartStore((s) => s.add);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/products/${id}`)
      .then(({ data }) => setProduct(data.product))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
    api
      .get(`/reviews/product/${id}`)
      .then(({ data }) => setReviews(data.items || []))
      .catch(() => setReviews([]));
  }, [id]);

  if (loading)
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Spinner />
      </div>
    );
  if (!product)
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="font-fraunces text-2xl text-ink tracking-tight">
          Product not found
        </h1>
      </div>
    );

  const images = product.images?.length ? product.images : [{ url: "" }];
  const seller = product.seller || {};
  const discount = product.compareAtPrice
    ? Math.max(
        0,
        Math.round(100 - (product.price / product.compareAtPrice) * 100),
      )
    : 0;

  async function handleAddToCart() {
    if (!user) {
      toast("Please log in");
      nav("/login");
      return;
    }
    setAdding(true);
    try {
      await addToCart(product._id, 1);
      toast.success("Added to cart");
    } catch (e) {
      toast.error(e.response?.data?.error || "Could not add");
    } finally {
      setAdding(false);
    }
  }

  async function handleBuyNow() {
    await handleAddToCart();
    nav("/cart");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10">
      {/* Breadcrumb */}
      <div className="text-[10px] text-ink/45 font-jakarta mb-4 flex items-center gap-1.5">
        <Link to="/" className="hover:text-coral transition">
          Home
        </Link>
        <span>/</span>
        <Link to="/products" className="hover:text-coral transition">
          Products
        </Link>
        <span>/</span>
        <span className="text-ink/70 truncate">{product.title}</span>
      </div>

      <div className="grid md:grid-cols-5 gap-6 md:gap-8">
        {/* Image gallery */}
        <div className="md:col-span-3">
          <motion.div
            key={activeImg}
            initial={{ opacity: 0, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-peach/30 border border-ink/5"
          >
            <img
              src={images[activeImg]?.url}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            {product.isFlashDeal && (
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-coral text-white text-[10px] font-bold uppercase tracking-wider">
                <HiOutlineBolt className="text-xs" /> Flash deal
              </span>
            )}
          </motion.div>
          {images.length > 1 && (
            <div className="mt-2.5 grid grid-cols-5 gap-1.5">
              {images.map((im, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                    activeImg === i
                      ? "border-coral"
                      : "border-ink/5 hover:border-ink/20"
                  }`}
                >
                  <img
                    src={im.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="md:col-span-2">
          <Reveal>
            <div className="flex items-center gap-1.5 flex-wrap">
              {seller.isVerifiedSeller && (
                <Badge tone="mint" icon={<HiOutlineShieldCheck />}>
                  Verified
                </Badge>
              )}
              <Badge tone="peach">{product.category}</Badge>
              {discount > 0 && <Badge tone="coral">−{discount}% off</Badge>}
            </div>

            <h1 className="mt-3 font-fraunces text-2xl md:text-3xl text-ink tracking-tight leading-[1.15]">
              {product.title}
            </h1>

            <div className="mt-2 flex items-center gap-2 text-[11px] text-ink/60 font-jakarta">
              <div className="flex items-center gap-0.5">
                <HiStar className="text-tangerine text-sm" />
                <span className="font-semibold text-ink">
                  {Number(product.rating || 0).toFixed(1)}
                </span>
              </div>
              <span className="text-ink/25">·</span>
              <span>{product.reviewCount || 0} reviews</span>
              <span className="text-ink/25">·</span>
              <span>{product.salesCount || 0} sold</span>
            </div>

            {/* Price */}
            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-fraunces text-3xl text-ink tracking-tight">
                ₹{product.price?.toLocaleString("en-IN")}
              </span>
              {product.compareAtPrice > product.price && (
                <span className="text-xs text-ink/40 line-through font-jakarta">
                  ₹{product.compareAtPrice?.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {/* CTA buttons */}
            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleBuyNow}
                className="flex-1"
                size="md"
                leftIcon={<HiOutlineBolt />}
                disabled={adding}
              >
                Buy now
              </Button>
              <Button
                onClick={handleAddToCart}
                className="flex-1"
                size="md"
                variant="outline"
                leftIcon={<HiOutlineShoppingBag />}
                disabled={adding}
              >
                {adding ? "Adding..." : "Add to cart"}
              </Button>
            </div>

            {/* Trust strip */}
            <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-ink/50 font-jakarta">
              <div className="flex items-center gap-1">
                <HiOutlineTruck className="text-sm" /> Ships in 2–4 days
              </div>
              <div className="flex items-center gap-1">
                <HiOutlineArrowPath className="text-sm" /> 7-day returns
              </div>
              <div className="flex items-center gap-1">
                <HiOutlineShieldCheck className="text-sm" /> Secure payment
              </div>
            </div>

            {/* Seller card */}
            <div className="mt-5 rounded-2xl bg-white/70 p-4 border border-ink/5">
              <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 mb-2">
                Sold by
              </div>
              <Link
                to={`/profile/${seller._id}`}
                className="flex items-center gap-2.5"
              >
                <Avatar
                  src={seller.avatar}
                  name={seller.name}
                  size="sm"
                  aura={seller.trustScore}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-jakarta font-semibold text-xs text-ink flex items-center gap-1 truncate">
                    {seller.shopName || seller.name}
                    {seller.isVerifiedSeller && (
                      <HiOutlineShieldCheck className="text-leaf text-sm shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-ink/55 flex items-center gap-1 mt-0.5">
                    <HiOutlineMapPin className="text-xs" />
                    {seller.location?.city || "India"}
                    <span className="text-ink/25">·</span>
                    Trust {seller.trustScore || 50}
                  </div>
                </div>
              </Link>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                <Link
                  to={`/messages?to=${seller._id}`}
                  className="rounded-full bg-peach text-ink text-[11px] font-jakarta font-semibold py-1.5 text-center hover:bg-peach/80 inline-flex items-center justify-center gap-1 transition"
                >
                  <HiOutlineChatBubbleLeftRight className="text-sm" /> Message
                </Link>
                <button className="rounded-full bg-lavender text-ink text-[11px] font-jakarta font-semibold py-1.5 hover:bg-lavender/80 inline-flex items-center justify-center gap-1 transition">
                  <HiOutlineHeart className="text-sm" /> Save
                </button>
              </div>
            </div>

            {/* About */}
            <div className="mt-5">
              <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 mb-1.5">
                Description
              </div>
              <p className="text-xs text-ink/70 font-jakarta leading-relaxed">
                {product.description}
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-1">
              Community feedback
            </div>
            <h2 className="font-fraunces text-xl md:text-2xl text-ink tracking-tight">
              Reviews{" "}
              <span className="text-ink/40 font-normal">
                ({reviews.length})
              </span>
            </h2>
          </div>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-ink/70 font-jakarta">
              <HiStar className="text-tangerine" />
              <span className="font-semibold text-ink">
                {Number(product.rating || 0).toFixed(1)}
              </span>
              <span>average</span>
            </div>
          )}
        </div>
        {reviews.length === 0 ? (
          <div className="rounded-2xl bg-white/60 border border-ink/5 p-6 text-center">
            <p className="text-xs text-ink/55 font-jakarta italic">
              No reviews yet — be the first to share your experience.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {reviews.slice(0, 6).map((r) => (
              <div
                key={r._id}
                className="rounded-2xl bg-white/70 p-4 border border-ink/5"
              >
                <div className="flex items-center gap-2">
                  <Avatar
                    src={r.buyer?.avatar}
                    name={r.buyer?.name}
                    size="xs"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-jakarta font-semibold text-xs text-ink truncate">
                      {r.buyer?.name || "Buyer"}
                    </div>
                    <div className="flex items-center text-[11px]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <HiStar
                          key={i}
                          className={
                            i < r.rating ? "text-tangerine" : "text-ink/15"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  {r.sentiment?.label === "NEGATIVE" ? (
                    <Badge tone="coral">Critical</Badge>
                  ) : (
                    <Badge tone="mint">Positive</Badge>
                  )}
                </div>
                <p className="mt-2 text-[12px] text-ink/75 font-jakarta leading-relaxed">
                  {r.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
