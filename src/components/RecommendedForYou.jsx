import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlineSparkles, HiArrowLongRight } from "react-icons/hi2";
import { Reveal } from "./animations/Reveal";
import { getForYouRecommendations } from "../services/api";

export default function RecommendedForYou({ userCity = "Indore", interest = null }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getForYouRecommendations(userCity, interest)
      .then((data) => {
        if (cancelled) return;

        // ✅ FIX: API response nested ho sakta hai
        // Case 1: data.recommendations = [...] (direct array)
        // Case 2: data.recommendations = { recommendations: [...] } (nested object from HuggingFace)
        const reco = data.recommendations;
        const list = Array.isArray(reco)
          ? reco
          : Array.isArray(reco?.recommendations)
            ? reco.recommendations
            : [];

        setProducts(list);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userCity, interest]);

  // Loading state - branded skeleton
  if (loading) {
    return (
      <section className="py-8">
        <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-3">
          Personalised for you
        </div>
        <div className="h-7 w-72 bg-peach/40 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-[4/5] rounded-2xl bg-peach/30 border border-ink/5 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-8">
      <Reveal>
        <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2 flex items-center gap-1.5">
              <HiOutlineSparkles className="text-sm" />
              Personalised for you
            </div>
            <h2 className="font-fraunces text-2xl md:text-3xl text-ink tracking-tight leading-[1.15]">
              Picked from your neighbourhood.
            </h2>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {products.slice(0, 8).map((p, idx) => (
          <Reveal key={p.id || p._id || idx} delay={idx * 0.04}>
            <RecoCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// Branded card matching tumhare design system
function RecoCard({ product }) {
  const id = product._id || product.id;
  const title = product.title || product.name || product.business_name || "Untitled";
  const image = product.image || product.imageUrl || product.image_url || product.images?.[0]?.url;
  const price = product.price;
  const city = product.city_name || product.city || product.location?.city;
  const category = product.category || product.tag;

  return (
    <Link
      to={id ? `/products/${id}` : "#"}
      className="group block rounded-2xl overflow-hidden bg-white/70 border border-ink/5 hover:border-ink/15 transition-all"
    >
      <div className="aspect-[4/5] bg-peach/30 relative overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-ink/20 font-fraunces text-4xl">
            {title.charAt(0)}
          </div>
        )}
        {category && (
          <span className="absolute top-2 left-2 text-[9px] uppercase tracking-wider font-jakarta font-semibold px-2 py-0.5 rounded-full bg-white/80 backdrop-blur text-ink/70 border border-ink/5">
            {category}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-jakarta font-semibold text-xs text-ink truncate">
          {title}
        </h3>
        {city && (
          <div className="text-[10px] text-ink/50 font-jakarta mt-0.5 truncate">
            {city}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between">
          {price ? (
            <span className="font-fraunces text-sm text-ink tracking-tight">
              ₹{Number(price).toLocaleString("en-IN")}
            </span>
          ) : (
            <span className="text-[10px] text-ink/40 font-jakarta italic">
              View details
            </span>
          )}
          <HiArrowLongRight className="text-ink/30 group-hover:text-coral group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}