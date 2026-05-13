import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiStar,
  HiOutlineShieldCheck,
  HiOutlineBolt,
  HiOutlineMapPin,
  HiOutlineHeart,
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
import {
  isWishlisted,
  toggleWishlist,
} from "../store/wishlistStore";

import SimilarProducts from "../components/SimilarProducts";
import ReviewSection from "../components/ReviewSection";
import VerifiedBadge from "../components/VerifiedBadge";

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

  // =========================================
  // LOAD PRODUCT
  // =========================================

  useEffect(() => {
    setLoading(true);

    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        console.log("[PRODUCT DATA]", data);

        setProduct(data.product);

        setSaved(isWishlisted(id));
      })
      .catch((err) => {
        console.error(err);

        setProduct(null);
      })
      .finally(() => setLoading(false));

    api
      .post(`/hyperlocal/products/${id}/view`)
      .catch(() => {});
  }, [id]);

  // =========================================
  // WISHLIST STATUS
  // =========================================

  useEffect(() => {
    if (product?._id) {
      setSaved(isWishlisted(product._id));
    }
  }, [product?._id]);

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Spinner />
      </div>
    );
  }

  // =========================================
  // PRODUCT NOT FOUND
  // =========================================

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="font-fraunces text-2xl text-ink tracking-tight">
          Product not found
        </h1>
      </div>
    );
  }

  // =========================================
  // NORMALIZE IMAGES
  // Supports:
  // ["url"]
  // [{ url }]
  // =========================================

  const images = Array.isArray(product.images)
    ? product.images.map((img) =>
        typeof img === "string"
          ? { url: img }
          : img
      )
    : [{ url: "" }];

  const seller = product.seller || {};

  const discount = product.compareAtPrice
    ? Math.max(
        0,
        Math.round(
          100 -
            (product.price /
              product.compareAtPrice) *
              100
        )
      )
    : 0;

  // =========================================
  // ADD TO CART
  // =========================================

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
      toast.error(
        e.response?.data?.error ||
          "Could not add"
      );
    } finally {
      setAdding(false);
    }
  }

  // =========================================
  // BUY NOW
  // =========================================

  async function handleBuyNow() {
    await handleAddToCart();

    nav("/cart");
  }

  // =========================================
  // SAVE
  // =========================================

  function handleSave() {
    if (!user) {
      toast("Please log in to save products");

      nav("/login");

      return;
    }

    const added = toggleWishlist(product._id);

    setSaved(added);

    toast.success(
      added
        ? "Saved to wishlist ❤️"
        : "Removed from wishlist"
    );
  }

  // =========================================
  // IMAGE NAVIGATION
  // =========================================

  function prevImg() {
    setActiveImg((i) =>
      i === 0 ? images.length - 1 : i - 1
    );
  }

  function nextImg() {
    setActiveImg((i) =>
      i === images.length - 1 ? 0 : i + 1
    );
  }

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
      {/* ========================= */}
      {/* BREADCRUMB */}
      {/* ========================= */}

      <div className="text-[10px] text-ink/40 font-jakarta mb-5 flex items-center gap-1.5 flex-wrap">
        <Link
          to="/"
          className="hover:text-coral transition"
        >
          Home
        </Link>

        <span>/</span>

        <Link
          to="/products"
          className="hover:text-coral transition"
        >
          Products
        </Link>

        <span>/</span>

        <span className="text-ink/60 truncate max-w-[180px]">
          {product.title}
        </span>
      </div>

      <div className="grid md:grid-cols-12 gap-6 md:gap-10">
        {/* ========================= */}
        {/* IMAGE GALLERY */}
        {/* ========================= */}

        <div className="md:col-span-6 lg:col-span-7">
          {/* MAIN IMAGE */}

          <div
            className="relative rounded-2xl overflow-hidden bg-peach/20 border border-ink/5 cursor-pointer group"
            style={{ paddingTop: "100%" }}
            onClick={() => {
              if (seller?._id) {
                nav(`/profile/${seller._id}`);
              }
            }}
            title={seller?.name ? `View ${seller.name}'s profile` : "View seller profile"}
          >
            {/* Hover overlay */}
            {seller?._id && (
              <div className="absolute inset-0 z-10 bg-ink/0 group-hover:bg-ink/30 transition-all duration-300 flex items-center justify-center pointer-events-none">
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center gap-2">
                  <Avatar
                    src={seller?.avatar}
                    name={seller?.name || "Seller"}
                    size={56}
                    className="ring-4 ring-white shadow-xl"
                  />
                  <span className="bg-white/90 backdrop-blur text-ink text-xs font-jakarta font-semibold px-3 py-1 rounded-full shadow">
                    {seller?.name || "View Seller"}
                  </span>
                </div>
              </div>
            )}
            <motion.img
              key={activeImg}
              src={
                images[activeImg]?.url || ""
              }
              alt={product.title}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{
                opacity: 0,
                scale: 1.02,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 0.3,
              }}
              onError={(e) => {
                console.log(
                  "[BROKEN IMAGE]",
                  images
                );

                e.currentTarget.src =
                  "https://via.placeholder.com/800x800?text=No+Image";
              }}
            />

            {/* FLASH DEAL */}

            {product.isFlashDeal && (
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-coral text-white text-[10px] font-bold uppercase tracking-wider shadow">
                <HiOutlineBolt className="text-xs" />
                Flash deal
              </span>
            )}

            {/* DISCOUNT */}

            {discount > 0 && (
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-butter text-ink text-[10px] font-bold uppercase tracking-wider shadow">
                −{discount}% off
              </span>
            )}

            {/* NAV BUTTONS */}

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImg(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow hover:bg-white transition z-20"
                >
                  <HiOutlineChevronLeft className="text-ink text-sm" />
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); nextImg(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow hover:bg-white transition z-20"
                >
                  <HiOutlineChevronRight className="text-ink text-sm" />
                </button>

                {/* DOTS */}

                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setActiveImg(i); }}
                      className={`w-1.5 h-1.5 rounded-full transition-all z-20 ${
                        i === activeImg
                          ? "bg-white w-4"
                          : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ========================= */}
          {/* THUMBNAILS */}
          {/* ========================= */}

          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((im, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setActiveImg(i)
                  }
                  className={`relative rounded-xl overflow-hidden border-2 transition aspect-square ${
                    activeImg === i
                      ? "border-coral shadow-sm"
                      : "border-ink/8 hover:border-ink/20"
                  }`}
                >
                  <img
                    src={im?.url || ""}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/200x200?text=No+Image";
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ========================= */}
        {/* PRODUCT INFO */}
        {/* ========================= */}

        <div className="md:col-span-6 lg:col-span-5">
          <Reveal>
            {/* BADGES */}

            <div className="flex items-center gap-1.5 flex-wrap">
              {seller.isVerifiedSeller && (
                <Badge
                  tone="mint"
                  icon={
                    <HiOutlineShieldCheck />
                  }
                >
                  Verified seller
                </Badge>
              )}

              <Badge tone="peach">
                {product.category}
              </Badge>
            </div>

            {/* TITLE */}

            <h1 className="mt-3 font-fraunces text-2xl md:text-3xl text-ink tracking-tight leading-[1.15]">
              {product.title}
            </h1>

            {/* RATING */}

            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-0.5">
                {Array.from({
                  length: 5,
                }).map((_, i) => (
                  <HiStar
                    key={i}
                    className={
                      i <
                      Math.round(
                        product.rating || 0
                      )
                        ? "text-tangerine text-sm"
                        : "text-ink/15 text-sm"
                    }
                  />
                ))}
              </div>

              <span className="text-[11px] font-jakarta font-semibold text-ink/70">
                {Number(
                  product.rating || 0
                ).toFixed(1)}
              </span>
            </div>

            {/* PRICE */}

            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-fraunces text-4xl text-ink tracking-tight">
                ₹
                {product.price?.toLocaleString(
                  "en-IN"
                )}
              </span>

              {product.compareAtPrice >
                product.price && (
                <span className="text-sm text-ink/35 line-through font-jakarta">
                  ₹
                  {product.compareAtPrice?.toLocaleString(
                    "en-IN"
                  )}
                </span>
              )}
            </div>

            {/* BUTTONS */}

            <div className="mt-5 flex gap-2.5">
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
                leftIcon={
                  <HiOutlineShoppingBag />
                }
                disabled={adding}
              >
                {adding
                  ? "Adding..."
                  : "Add to cart"}
              </Button>
            </div>

            {/* DESCRIPTION */}

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

            {/* ========================= */}
            {/* SELLER PROFILE CARD */}
            {/* ========================= */}

            {seller?._id && (
              <div className="mt-6 border-t border-ink/8 pt-5">
                <div className="text-[9px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/40 mb-3">
                  Sold by
                </div>

                <Link
                  to={`/profile/${seller._id}`}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-peach/30 hover:bg-peach/50 border border-ink/5 hover:border-ink/10 transition-all group"
                >
                  <Avatar
                    src={seller.avatar}
                    name={seller.name || "Seller"}
                    size="md"
                    aura={seller.trustScore}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-jakarta font-semibold text-sm text-ink truncate">
                        {seller.shopName || seller.name || "Local Seller"}
                      </span>
                      {seller.isVerifiedSeller && (
                        <VerifiedBadge isVerifiedSeller size={13} />
                      )}
                    </div>

                    {seller.location?.city && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <HiOutlineMapPin className="text-ink/40 text-[10px] shrink-0" />
                        <span className="text-[10px] text-ink/50 font-jakarta">
                          {seller.location.city}
                        </span>
                      </div>
                    )}

                    {seller.bio && (
                      <p className="text-[11px] text-ink/55 font-jakarta mt-1 line-clamp-1">
                        {seller.bio}
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] font-jakarta font-semibold text-coral group-hover:translate-x-0.5 transition-transform shrink-0">
                    View →
                  </span>
                </Link>
              </div>
            )}
          </Reveal>
        </div>
      </div>

      {/* REVIEWS */}

      <ReviewSection productId={product._id} />

      {/* SIMILAR PRODUCTS */}

      <SimilarProducts productId={product._id} />
    </div>
  );
}