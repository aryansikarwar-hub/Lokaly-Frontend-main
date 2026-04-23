import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
} from "react-icons/hi2";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import { Reveal } from "../components/animations/Reveal";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";

const CATEGORIES = [
  "All",
  "Handloom & Sarees",
  "Jewellery",
  "Spices & Pickles",
  "Home Decor",
  "Ethnic Wear",
  "Organic Groceries",
  "Leather & Mojaris",
  "Pottery & Ceramics",
  "Ayurveda & Wellness",
  "Indie Beauty",
  "Madhubani Art",
];

const SORTS = [
  { key: "new", label: "Newest" },
  { key: "popular", label: "Most popular" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
  { key: "rating", label: "Top rated" },
];

export default function Products() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("new");
  const [max, setMax] = useState(20000);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    const params = { sort, limit: 24 };
    if (q) params.q = q;
    if (category !== "All") params.category = category;
    if (max < 20000) params.maxPrice = max;
    api
      .get("/products", { params })
      .then(({ data }) => {
        if (!cancel) setItems(data.items || []);
      })
      .catch(() => {
        if (!cancel) setItems([]);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [q, category, sort, max]);

  const hasActiveFilters = category !== "All" || max < 20000 || q.length > 0;

  function clearFilters() {
    setCategory("All");
    setMax(20000);
    setQ("");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <Reveal>
        <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
          Handpicked by karma
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-fraunces text-2xl md:text-3xl text-ink tracking-tight">
              Shop the bazaar
            </h1>
            <p className="mt-1 text-xs text-ink/55 font-jakarta">
              Browse products from verified sellers across India.
            </p>
          </div>
          {/* Search */}
          <div className="flex items-center gap-1.5 bg-white/70 rounded-full px-3 py-2 border border-ink/5 w-full md:w-72 focus-within:border-ink/20 transition">
            <HiOutlineMagnifyingGlass className="text-ink/50 text-sm shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search sarees, pickles, pottery..."
              className="bg-transparent outline-none flex-1 text-xs placeholder:text-ink/40 font-jakarta min-w-0"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="text-ink/40 hover:text-ink transition shrink-0"
                aria-label="Clear search"
              >
                <HiOutlineXMark className="text-sm" />
              </button>
            )}
          </div>
        </div>
      </Reveal>

      {/* Category chips */}
      <Reveal delay={0.05}>
        <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {CATEGORIES.map((c) => {
            const isActive = category === c;
            return (
              <motion.button
                whileTap={{ scale: 0.96 }}
                key={c}
                onClick={() => setCategory(c)}
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-jakarta font-semibold transition border ${
                  isActive
                    ? "bg-ink text-cream border-ink"
                    : "bg-white/60 border-ink/5 text-ink/70 hover:border-ink/20"
                }`}
              >
                {c}
              </motion.button>
            );
          })}
        </div>
      </Reveal>

      {/* Filter / sort bar */}
      <div className="mt-4 rounded-2xl bg-white/60 border border-ink/5 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Price slider */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 text-ink/60 shrink-0">
            <HiOutlineAdjustmentsHorizontal className="text-sm" />
            <span className="text-[10px] uppercase tracking-wider font-jakarta font-semibold">
              Max price
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="20000"
            step="100"
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
            className="w-32 md:w-48 accent-coral"
          />
          <span className="text-xs font-jakarta font-semibold text-ink tabular-nums">
            ₹{max.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-[11px] font-jakarta font-semibold text-ink/60 hover:text-coral transition inline-flex items-center gap-1"
            >
              <HiOutlineXMark className="text-sm" /> Clear
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider font-jakarta font-semibold text-ink/50">
              Sort
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-full bg-white border border-ink/10 hover:border-ink/20 px-3 py-1.5 text-[11px] font-jakarta font-semibold text-ink outline-none cursor-pointer transition"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      {!loading && items.length > 0 && (
        <div className="mt-4 text-[11px] text-ink/50 font-jakarta">
          Showing {items.length} {items.length === 1 ? "product" : "products"}
          {category !== "All" && (
            <>
              {" "}
              in <span className="font-semibold text-ink/75">{category}</span>
            </>
          )}
        </div>
      )}

      {/* Results grid */}
      <div className="mt-4">
        {loading ? (
          <div className="grid place-items-center py-20">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No products match your filters"
            hint="Try widening the price range or clearing filters"
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {items.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(0.02 * i, 0.25), duration: 0.4 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
