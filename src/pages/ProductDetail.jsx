import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiStar,
  HiOutlineShieldCheck,
  HiOutlineBolt,
  HiOutlineMapPin,
  HiOutlineHeart,
  HiHeart,
  HiOutlineChatBubbleLeftRight,
  HiOutlineShoppingBag,
  HiOutlineTruck,
  HiOutlineArrowPath,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
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
import { isWishlisted, toggleWishlist } from "../store/wishlistStore";
import SimilarProducts from "../components/SimilarProducts";
import ReviewSection from "../components/ReviewSection";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const addToCart = useCartStore((s) => s.add);

  useEffect(() => {
    if (product?._id) setSaved(isWishlisted(product._id));
  }, [product?._id]);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data.product);
        setSaved(isWishlisted(id));
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
    api.post(`/hyperlocal/products/${id}/view`).catch(() => {});
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
        <h1 className="font-fraunces text-2xl text-ink tracking-tight">Product not found</h1>
      </div>
    );

  const images = product.images?.length ? product.images : [{ url: "" }];
  const seller = product.seller || {};
  const discount = product.compareAtPrice
    ? Math.max(0, Math.round(100 - (product.price / product.compareAtPrice) * 100))
    : 0;

  async function handleAddToCart() {
    if (!user) { toast("Please log in"); nav("/login"); return; }
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

  function handleSave() {
    if (!user) {
      toast("Please log in to save products");
      nav("/login");
      return;
    }
    const added = toggleWishlist(product._id);
    setSaved(added);
    toast.success(added ? "Saved to wishlist ❤️" : "Removed from wishlist");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
      {/* Breadcrumb */}
      <div className="text-[10px] text-ink/40 font-jakarta mb-5 flex items-center gap-1.5 flex-wrap">
        <Link to="/" className="hover:text-coral transition">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-coral transition">Products</Link>
        <span>/</span>
        <span className="text-ink/60 truncate max-w-[180px]">{product.title}</span>
      </div>

      <div className="grid md:grid-cols-12 gap-6 md:gap-10">
        {/* ── Image Gallery ── */}
        <div className="md:col-span-6 lg:col-span-7">
          {/* Main image */}
          <div className="relative rounded-2xl overflow-hidden bg-peach/20 border border-ink/5" style={{ paddingTop: "100%" }}>
            <motion.img
              key={activeImg}
              src={images[activeImg]?.url}
              alt={product.title}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            />
            {product.isFlashDeal && (
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-coral text-white text-[10px] font-bold uppercase tracking-wider shadow">
                <HiOutlineBolt className="text-xs" /> Flash deal
              </span>
            )}
            {discount > 0 && (
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-butter text-ink text-[10px] font-bold uppercase tracking-wider shadow">
                −{discount}% off
              </span>
            )}

            {/* Image nav arrows (only if multiple) */}
            {images.length > 1 && (
              <>
                <button onClick={prevImg}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow hover:bg-white transition">
                  <HiOutlineChevronLeft className="text-ink text-sm" />
                </button>
                <button onClick={nextImg}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow hover:bg-white transition">
                  <HiOutlineChevronRight className="text-ink text-sm" />
                </button>
                {/* Dot indicators */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeImg ? "bg-white w-4" : "bg-white/50"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((im, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`relative rounded-xl overflow-hidden border-2 transition aspect-square ${
                    activeImg === i ? "border-coral shadow-sm" : "border-ink/8 hover:border-ink/20"
                  }`}
                >
                  <img src={im.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info panel ── */}
        <div className="md:col-span-6 lg:col-span-5">
          <Reveal>
            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {seller.isVerifiedSeller && (
                <Badge tone="mint" icon={<HiOutlineShieldCheck />}>Verified seller</Badge>
              )}
              <Badge tone="peach">{product.category}</Badge>
            </div>

            {/* Title */}
            <h1 className="mt-3 font-fraunces text-2xl md:text-3xl text-ink tracking-tight leading-[1.15]">
              {product.title}
            </h1>

            {/* Rating + sales */}
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <HiStar key={i} className={i < Math.round(product.rating || 0) ? "text-tangerine text-sm" : "text-ink/15 text-sm"} />
                ))}
              </div>
              <span className="text-[11px] font-jakarta font-semibold text-ink/70">
                {Number(product.rating || 0).toFixed(1)}
              </span>
              <span className="text-ink/20 text-xs">·</span>
              <span className="text-[11px] font-jakarta text-ink/55">{product.reviewCount || 0} reviews</span>
              <span className="text-ink/20 text-xs">·</span>
              <span className="text-[11px] font-jakarta text-ink/55">{product.salesCount || 0} sold</span>
            </div>

            {/* Price */}
            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-fraunces text-4xl text-ink tracking-tight">
                ₹{product.price?.toLocaleString("en-IN")}
              </span>
              {product.compareAtPrice > product.price && (
                <span className="text-sm text-ink/35 line-through font-jakarta">
                  ₹{product.compareAtPrice?.toLocaleString("en-IN")}
                </span>
              )}
              {discount > 0 && (
                <span className="text-xs font-jakarta font-bold text-coral">
                  You save ₹{(product.compareAtPrice - product.price)?.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {/* CTA buttons */}
            <div className="mt-5 flex gap-2.5">
              <Button onClick={handleBuyNow} className="flex-1" size="md"
                leftIcon={<HiOutlineBolt />} disabled={adding}>
                Buy now
              </Button>
              <Button onClick={handleAddToCart} className="flex-1" size="md" variant="outline"
                leftIcon={<HiOutlineShoppingBag />} disabled={adding}>
                {adding ? "Adding..." : "Add to cart"}
              </Button>
            </div>

            {/* Trust strip */}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-ink/50 font-jakarta bg-peach/20 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <HiOutlineTruck className="text-sm text-ink/40" />
                Ships in 2–4 days
              </div>
              <div className="flex items-center gap-1.5">
                <HiOutlineArrowPath className="text-sm text-ink/40" />
                7-day returns
              </div>
              <div className="flex items-center gap-1.5">
                <HiOutlineShieldCheck className="text-sm text-ink/40" />
                Secure payment
              </div>
            </div>

            {/* Seller card */}
            <div className="mt-5 rounded-2xl bg-white/80 border border-ink/6 overflow-hidden">
              <div className="px-4 py-3 border-b border-ink/5">
                <div className="text-[9px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/40">
                  Sold by
                </div>
              </div>
              <div className="p-4">
                <Link to={`/profile/${seller._id}`} className="flex items-center gap-3 group/seller">
                  <Avatar src={seller.avatar} name={seller.name} size="sm" aura={seller.trustScore} />
                  <div className="flex-1 min-w-0">
                    <div className="font-jakarta font-semibold text-sm text-ink flex items-center gap-1 group-hover/seller:text-coral transition-colors truncate">
                      {seller.shopName || seller.name}
                      {seller.isVerifiedSeller && (
                        <HiOutlineShieldCheck className="text-leaf text-sm shrink-0" />
                      )}
                    </div>
                    <div className="text-[10px] text-ink/50 flex items-center gap-1 mt-0.5 font-jakarta">
                      <HiOutlineMapPin className="text-[10px]" />
                      {seller.location?.city || "India"}
                      <span className="text-ink/20">·</span>
                      <span>Trust {seller.trustScore || 50}/100</span>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={handleSave}
                  className={`rounded-full text-[11px] font-jakarta font-semibold py-1.5 hover:opacity-90 inline-flex items-center justify-center gap-1 transition ${
                    saved
                      ? "bg-coral text-white"
                      : "bg-lavender text-ink hover:bg-lavender/80"
                  }`}
                >
                  <HiOutlineHeart
                    className={`text-sm ${saved ? "fill-white" : ""}`}
                  />
                  {saved ? "Saved ❤️" : "Save"}
                </button>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-5">
                <div className="text-[9px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/40 mb-2">
                  Description
                </div>
                <p className="text-xs text-ink/70 font-jakarta leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </Reveal>
        </div>
      </div>

      {/* Reviews */}
      <ReviewSection productId={product._id} />

      {/* Similar Products */}
      <SimilarProducts productId={product._id} />
    </div>
  );
}