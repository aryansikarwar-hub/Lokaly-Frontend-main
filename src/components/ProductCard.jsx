import { Link } from "react-router-dom";
import { HiStar, HiOutlineBolt, HiOutlineShieldCheck } from "react-icons/hi2";
import { Tilt } from "./animations/Tilt";

export default function ProductCard({ product }) {
  const img = product.images?.[0]?.url;
  const seller = product.seller || {};
  const discount = product.compareAtPrice
    ? Math.max(
        0,
        Math.round(100 - (product.price / product.compareAtPrice) * 100),
      )
    : 0;

  return (
    <Tilt max={4}>
      <Link
        to={`/product/${product._id}`}
        className="block rounded-2xl bg-white/80 backdrop-blur border border-ink/5 hover:border-ink/15 overflow-hidden group transition-all"
      >
        <div className="relative aspect-[4/5] bg-peach/30 overflow-hidden">
          {img && (
            <img
              src={img}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              loading="lazy"
            />
          )}
          {product.isFlashDeal && (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-coral text-white text-[9px] font-jakarta font-bold uppercase tracking-wider">
              <HiOutlineBolt className="text-xs" /> Flash
            </span>
          )}
          {discount > 0 && (
            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-butter text-ink text-[9px] font-jakarta font-bold uppercase tracking-wider">
              −{discount}%
            </span>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-center gap-1 text-[10px] text-ink/50 font-jakarta">
            {seller.isVerifiedSeller && (
              <HiOutlineShieldCheck className="text-leaf shrink-0" />
            )}
            <span className="truncate">
              {seller.shopName || seller.name || "Lokaly shop"}
            </span>
          </div>
          <h3 className="mt-1 font-jakarta font-semibold text-ink line-clamp-2 text-xs leading-snug">
            {product.title}
          </h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-fraunces text-base text-ink tracking-tight">
              ₹{product.price?.toLocaleString("en-IN")}
            </span>
            {product.compareAtPrice > product.price && (
              <span className="text-[10px] text-ink/40 line-through font-jakarta">
                ₹{product.compareAtPrice?.toLocaleString("en-IN")}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-ink/55 font-jakarta">
            <HiStar className="text-tangerine text-xs" />
            <span className="font-semibold text-ink/75">
              {Number(product.rating || 0).toFixed(1)}
            </span>
            <span className="text-ink/30">·</span>
            <span>{product.reviewCount || 0} reviews</span>
          </div>
        </div>
      </Link>
    </Tilt>
  );
}
