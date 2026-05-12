import { Link } from "react-router-dom";
import { HiStar, HiOutlineBolt, HiOutlineShieldCheck } from "react-icons/hi2";
import { Tilt } from "./animations/Tilt";
import DeliveryBadge from "./DeliveryBadge";
import { HiOutlineHeart, HiHeart } from "react-icons/hi2";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import { useState } from "react";

const API_ORIGIN = (() => {
  const raw = import.meta.env.VITE_API_URL;
  if (!raw) return "";
  try { return new URL(raw).origin; } catch { return ""; }
})();

function absolutizeUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  if (url.startsWith("/") && API_ORIGIN) return `${API_ORIGIN}${url}`;
  return url;
}

export default function ProductCard({ product }) {
  // Accept either shape:
  //   Mongoose Product:  images: [{ url, publicId }]
  //   HF recommender:    image: "https://..."   (flat string)
  //   Hyperlocal feed:   imageUrl: "..."
  const rawImg =
    product.images?.[0]?.url || product.image || product.imageUrl || "";
  const img = absolutizeUrl(rawImg);
  const seller = product.seller || {};
  const discount = product.compareAtPrice
    ? Math.max(0, Math.round(100 - (product.price / product.compareAtPrice) * 100))
    : 0;

  return (
    <Tilt max={4}>
      <Link
        to={`/product/${product._id}`}
        className="block rounded-2xl bg-white/90 backdrop-blur border border-ink/6 hover:border-ink/18 overflow-hidden group transition-all duration-300 hover:shadow-lg"
      >
        {/* Image container — fixed square aspect with proper object-fit */}
        <div className="relative w-full overflow-hidden bg-peach/25" style={{ paddingTop: "100%" }}>
          {img ? (
            <img
              src={img}
              alt={product.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-peach/30 flex items-center justify-center">
              <span className="text-ink/20 text-4xl font-fraunces">
                {product.title?.[0] || "?"}
              </span>
            </div>
          )}

          {/* Overlays */}
          {product.isFlashDeal && (
            <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-coral text-white text-[9px] font-jakarta font-bold uppercase tracking-wider shadow-sm">
              <HiOutlineBolt className="text-[10px]" /> Flash
            </span>
          )}
          {discount > 0 && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-butter text-ink text-[9px] font-jakarta font-bold uppercase tracking-wider shadow-sm">
              −{discount}%
            </span>
          )}
          {product.delivery?.tier === "same_day" && (
            <div className="absolute bottom-2 left-2">
              <DeliveryBadge delivery={product.delivery} distanceKm={product.distanceKm} compact />
            </div>
          )}

          {/* Hover gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Info section — clean and compact */}
        <div className="p-3">
          {/* Seller */}
          <div className="flex items-center gap-1 text-[10px] text-ink/50 font-jakarta mb-0.5">
            {seller.isVerifiedSeller && (
              <HiOutlineShieldCheck className="text-leaf shrink-0" />
            )}
            <span className="truncate">{seller.shopName || seller.name || "Lokaly shop"}</span>
          </div>

          {/* Product title */}
          <h3 className="font-jakarta font-semibold text-ink line-clamp-2 text-[12px] leading-snug">
            {product.title}
          </h3>

          {/* Price row */}
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-fraunces text-[15px] text-ink tracking-tight leading-none">
              ₹{product.price?.toLocaleString("en-IN")}
            </span>
            {product.compareAtPrice > product.price && (
              <span className="text-[10px] text-ink/35 line-through font-jakarta">
                ₹{product.compareAtPrice?.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-ink/55 font-jakarta">
            <HiStar className="text-tangerine text-[11px] shrink-0" />
            <span className="font-semibold text-ink/75">{Number(product.rating || 0).toFixed(1)}</span>
            <span className="text-ink/25">·</span>
            <span>{product.reviewCount || 0} reviews</span>
          </div>

          {/* Non-same-day delivery */}
          {product.delivery && product.delivery.tier !== "same_day" && (
            <div className="mt-2">
              <DeliveryBadge delivery={product.delivery} distanceKm={product.distanceKm} compact />
            </div>
          )}
        </div>
      </Link>
    </Tilt>
  );
}