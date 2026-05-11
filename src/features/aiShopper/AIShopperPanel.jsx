import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TbWand, TbSortDescending } from "react-icons/tb";
import {
  HiXMark,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi2";
import api from "../../services/api";
import { CardStack } from "../../components/animations/CardStack";
import { useAIShopperStore } from "../../store/aiShopperStore";

const SUGGESTIONS = [
  "blue saree under 1500",
  "gift for mom — handmade",
  "festive diya set diwali",
  "pottery for new home",
];

const SORT_OPTIONS = [
  { key: "best_buy", label: "Best buy" },
  { key: "match", label: "Best match" },
  { key: "price_asc", label: "Price ↑" },
  { key: "price_desc", label: "Price ↓" },
];

export default function AIShopperPanel() {
  const open = useAIShopperStore((s) => s.open);
  const setOpen = useAIShopperStore((s) => s.setOpen);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [sort, setSort] = useState("best_buy");
  const [filters, setFilters] = useState({ city: "", category: "", maxPrice: 0 });
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Mobile: which tab is active — "chat" or "results"
  const [mobileTab, setMobileTab] = useState("chat");

  const cities = useMemo(
    () => Array.from(new Set(results.map((h) => h.product.city_name).filter(Boolean))).sort(),
    [results]
  );
  const categories = useMemo(
    () => Array.from(new Set(results.map((h) => h.product.category).filter(Boolean))).sort(),
    [results]
  );
  const priceCeiling = useMemo(
    () => results.reduce((m, h) => Math.max(m, Number(h.product.price) || 0), 0),
    [results]
  );

  const scored = useMemo(() => {
    if (results.length === 0) return [];
    const prices = results.map((h) => Number(h.product.price) || 0);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const span = maxP - minP || 1;
    return results.map((h) => {
      const priceQuality = 1 - ((Number(h.product.price) || maxP) - minP) / span;
      const composite = 0.65 * (h.score || 0) + 0.35 * priceQuality;
      return { ...h, _composite: composite, _priceQuality: priceQuality };
    });
  }, [results]);

  const visibleResults = useMemo(() => {
    let list = scored.filter((h) => {
      if (filters.city && h.product.city_name !== filters.city) return false;
      if (filters.category && h.product.category !== filters.category) return false;
      if (filters.maxPrice && Number(h.product.price) > filters.maxPrice) return false;
      return true;
    });
    if (sort === "best_buy") list = [...list].sort((a, b) => b._composite - a._composite);
    if (sort === "match") list = [...list].sort((a, b) => (b.score || 0) - (a.score || 0));
    if (sort === "price_asc") list = [...list].sort((a, b) => (a.product.price || 0) - (b.product.price || 0));
    if (sort === "price_desc") list = [...list].sort((a, b) => (b.product.price || 0) - (a.product.price || 0));
    if (list.length > 0) list[0] = { ...list[0], _bestBuy: true };
    return list;
  }, [scored, filters, sort]);

  async function ask(q) {
    const body = (q || query).trim();
    if (!body) return;
    setHistory((h) => [...h, { role: "user", text: body }]);
    setQuery("");
    setLoading(true);
    setFilters({ city: "", category: "", maxPrice: 0 });
    try {
      const { data } = await api.post("/recommendations/search", { query: body });
      const list = Array.isArray(data?.results) ? data.results : [];
      const hits = list.map((p) => ({
        score: typeof p.match_score === "number" ? p.match_score / 100 : 0,
        product: {
          _id: p._id || p.id || "",
          title: p.title || "",
          price: p.price,
          images: p.image ? [{ url: p.image }] : [],
          city_name: p.city_name || "",
          category: p.category || "",
          shop_name: p.shop_name || "",
        },
      }));
      setResults(hits);
      setHistory((h) => [
        ...h,
        {
          role: "bot",
          text: hits.length
            ? `Found ${hits.length} matches — swipe through them`
            : "Koi match nahi mila — try a product name like 'saree' or 'pottery'.",
        },
      ]);
      // Auto-switch to results tab on mobile when results come in
      if (hits.length > 0) setMobileTab("results");
    } catch {
      setHistory((h) => [
        ...h,
        { role: "bot", text: "Hugging Face model is warming up. Try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* FAB trigger button */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.4 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-coral-gradient shadow-pop text-white grid place-items-center"
        aria-label="Open AI shopper"
      >
        <TbWand className="text-2xl" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="ai-shopper-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-end md:items-center justify-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              key="ai-shopper-panel"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.28 }}
              onClick={(e) => e.stopPropagation()}
              className="
                bg-cream dark:bg-[#2A2438]
                w-full md:w-[760px]
                rounded-t-3xl md:rounded-3xl
                border border-white/80 dark:border-white/10
                shadow-2xl
                flex flex-col
                overflow-hidden
                /* Mobile: full height bottom sheet; Desktop: fixed max-height */
                h-[92dvh] md:h-auto md:max-h-[85vh]
              "
            >
              {/* ── Header ── */}
              <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-ink/5 dark:border-white/10 shrink-0">
                <div className="w-8 h-8 rounded-xl bg-coral text-white grid place-items-center shrink-0">
                  <TbWand className="text-base" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-fraunces text-base text-ink dark:text-cream leading-tight">
                    AI Personal Shopper
                  </div>
                  <div className="text-[10px] font-jakarta text-mauve/80 truncate">
                    powered by Hugging Face — MiniLM-L6-v2
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 grid place-items-center rounded-full hover:bg-peach dark:hover:bg-white/10 text-ink dark:text-cream transition shrink-0"
                  aria-label="close"
                >
                  <HiXMark className="text-lg" />
                </button>
              </div>

              {/* ── Mobile Tab Switcher (hidden on md+) ── */}
              <div className="flex md:hidden border-b border-ink/5 dark:border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileTab("chat")}
                  className={`flex-1 py-2.5 text-xs font-jakarta font-semibold transition-colors ${
                    mobileTab === "chat"
                      ? "text-coral border-b-2 border-coral"
                      : "text-ink/50 dark:text-cream/50"
                  }`}
                >
                  Chat
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab("results")}
                  className={`flex-1 py-2.5 text-xs font-jakarta font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    mobileTab === "results"
                      ? "text-coral border-b-2 border-coral"
                      : "text-ink/50 dark:text-cream/50"
                  }`}
                >
                  Results
                  {visibleResults.length > 0 && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-coral text-white text-[9px] font-bold">
                      {visibleResults.length}
                    </span>
                  )}
                </button>
              </div>

              {/* ── Body ── */}
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">

                {/* LEFT — Chat panel */}
                <div
                  className={`
                    flex-1 flex flex-col min-h-0 overflow-hidden
                    ${mobileTab === "results" ? "hidden md:flex" : "flex"}
                  `}
                >
                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {history.length === 0 ? (
                      <div>
                        <div className="font-fraunces text-xl text-ink dark:text-cream leading-snug">
                          Namaste, what are you looking for?
                        </div>
                        <p className="text-xs text-ink/60 dark:text-cream/60 mt-1 font-jakarta">
                          Try one of these suggestions
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {SUGGESTIONS.map((s) => (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              key={s}
                              onClick={() => ask(s)}
                              className="px-3 py-1.5 rounded-full bg-white dark:bg-white/10 border border-ink/8 dark:border-white/10 text-xs font-jakarta text-ink dark:text-cream hover:bg-coral hover:text-white hover:border-coral transition-all"
                            >
                              {s}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {history.map((m, i) => (
                          <div
                            key={i}
                            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs font-jakarta leading-relaxed ${
                                m.role === "user"
                                  ? "bg-coral text-white rounded-br-sm"
                                  : "bg-white dark:bg-white/10 border border-ink/6 dark:border-white/10 text-ink dark:text-cream rounded-bl-sm"
                              }`}
                            >
                              {m.text}
                            </div>
                          </div>
                        ))}
                        {loading && (
                          <div className="flex justify-start">
                            <div className="bg-white dark:bg-white/10 border border-ink/6 dark:border-white/10 rounded-2xl rounded-bl-sm px-3.5 py-2">
                              <div className="flex items-center gap-1">
                                {[0, 1, 2].map((i) => (
                                  <motion.span
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full bg-mauve"
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mobile: show "View Results" banner after results arrive */}
                  {visibleResults.length > 0 && mobileTab === "chat" && (
                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      type="button"
                      onClick={() => setMobileTab("results")}
                      className="mx-4 mb-2 md:hidden flex items-center justify-between bg-coral/10 border border-coral/20 text-coral rounded-xl px-4 py-2.5 text-xs font-jakarta font-semibold"
                    >
                      <span>View {visibleResults.length} results →</span>
                      <HiOutlineChevronRight className="text-sm" />
                    </motion.button>
                  )}

                  {/* Input form */}
                  <form
                    onSubmit={(e) => { e.preventDefault(); ask(); }}
                    className="flex gap-2 items-center border-t border-ink/5 dark:border-white/10 p-3 shrink-0"
                  >
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="ask in english or hinglish..."
                      className="flex-1 rounded-full bg-white dark:bg-white/10 border border-ink/8 dark:border-white/10 px-4 py-2.5 text-sm outline-none text-ink dark:text-cream placeholder:text-ink/35 dark:placeholder:text-cream/35 min-w-0"
                    />
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      type="submit"
                      className="w-10 h-10 rounded-full bg-coral text-white grid place-items-center disabled:opacity-50 shrink-0 transition"
                      disabled={loading}
                      aria-label="send"
                    >
                      <HiOutlinePaperAirplane className="text-sm" />
                    </motion.button>
                  </form>
                </div>

                {/* RIGHT — Results panel */}
                <div
                  className={`
                    md:w-[300px] lg:w-[320px] shrink-0
                    bg-gradient-to-b from-lavender/40 to-peach/30 dark:from-white/5 dark:to-white/5
                    border-t md:border-t-0 md:border-l border-white/60 dark:border-white/10
                    flex flex-col min-h-0 overflow-hidden
                    ${mobileTab === "chat" ? "hidden md:flex" : "flex"}
                  `}
                >
                  {/* Results header */}
                  <div className="flex items-center justify-between px-3 py-2.5 shrink-0 border-b border-white/50 dark:border-white/10">
                    <div className="text-xs font-jakarta text-ink/60 dark:text-cream/60 flex items-center gap-1">
                      <HiOutlineSparkles className="text-[11px]" />
                      {visibleResults.length} of {results.length}
                    </div>
                    {results.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFiltersOpen((v) => !v)}
                          className="px-2 py-1 rounded-full bg-white/80 dark:bg-white/10 border border-white dark:border-white/10 text-[10px] font-jakarta text-ink dark:text-cream flex items-center gap-1 hover:bg-white transition"
                          aria-expanded={filtersOpen}
                        >
                          <HiOutlineAdjustmentsHorizontal className="text-[10px]" /> Filter
                        </button>
                        <select
                          value={sort}
                          onChange={(e) => setSort(e.target.value)}
                          className="px-2 py-1 rounded-full bg-white/80 dark:bg-white/10 border border-white dark:border-white/10 text-[10px] font-jakarta text-ink dark:text-cream outline-none cursor-pointer"
                        >
                          {SORT_OPTIONS.map((o) => (
                            <option key={o.key} value={o.key}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Filter panel */}
                  <AnimatePresence>
                    {filtersOpen && results.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden shrink-0"
                      >
                        <div className="mx-3 my-2 p-3 rounded-2xl bg-white/80 dark:bg-white/10 border border-white dark:border-white/10 space-y-2">
                          {cities.length > 1 && (
                            <div className="flex items-center gap-2">
                              <label className="text-[9px] uppercase tracking-wider text-ink/45 font-jakarta w-12 shrink-0">City</label>
                              <select
                                value={filters.city}
                                onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
                                className="flex-1 text-xs px-2 py-1 rounded-lg bg-white dark:bg-white/10 border border-ink/5 dark:border-white/10 outline-none min-w-0"
                              >
                                <option value="">All</option>
                                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                          )}
                          {categories.length > 1 && (
                            <div className="flex items-center gap-2">
                              <label className="text-[9px] uppercase tracking-wider text-ink/45 font-jakarta w-12 shrink-0">Type</label>
                              <select
                                value={filters.category}
                                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                                className="flex-1 text-xs px-2 py-1 rounded-lg bg-white dark:bg-white/10 border border-ink/5 dark:border-white/10 outline-none min-w-0"
                              >
                                <option value="">All</option>
                                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                          )}
                          {priceCeiling > 0 && (
                            <div className="flex items-center gap-2">
                              <label className="text-[9px] uppercase tracking-wider text-ink/45 font-jakarta w-12 shrink-0">Max ₹</label>
                              <input
                                type="range"
                                min={0}
                                max={priceCeiling}
                                step={Math.max(50, Math.round(priceCeiling / 100))}
                                value={filters.maxPrice || priceCeiling}
                                onChange={(e) => setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }))}
                                className="flex-1 accent-coral min-w-0"
                              />
                              <span className="text-[10px] font-jakarta text-ink dark:text-cream tabular-nums w-16 text-right shrink-0">
                                ≤ ₹{(filters.maxPrice || priceCeiling).toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}
                          {(filters.city || filters.category || filters.maxPrice > 0) && (
                            <button
                              type="button"
                              onClick={() => setFilters({ city: "", category: "", maxPrice: 0 })}
                              className="text-[10px] font-jakarta text-coral hover:underline"
                            >
                              Reset filters
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Card stack / empty state */}
                  <div className="flex-1 min-h-0 p-3">
                    {visibleResults.length > 0 ? (
                      <CardStack
                        items={visibleResults}
                        render={(r) => (
                          <Link to={`/product/${r.product._id}`} className="block h-full">
                            <div className="h-full w-full relative rounded-2xl overflow-hidden">
                              <img
                                src={r.product.images?.[0]?.url}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = "none"; }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              {r._bestBuy && (
                                <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-butter text-tangerine text-[9px] font-jakarta font-bold uppercase tracking-wider shadow flex items-center gap-1">
                                  <TbSortDescending className="text-[10px]" /> Best buy
                                </div>
                              )}
                              <div className="absolute bottom-4 left-3 right-3 text-white">
                                <div className="text-[10px] opacity-70 font-jakarta">
                                  {Math.round(r.score * 100)}% match
                                  {r.product.city_name ? ` · ${r.product.city_name}` : ""}
                                </div>
                                <div className="font-jakarta font-semibold text-sm line-clamp-2 mt-0.5">
                                  {r.product.title}
                                </div>
                                <div className="font-fraunces text-2xl mt-1">
                                  ₹{r.product.price?.toLocaleString("en-IN")}
                                </div>
                                {r._bestBuy && (
                                  <div className="text-[10px] opacity-70 font-jakarta mt-0.5">
                                    cheapest of the strong matches
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        )}
                      />
                    ) : results.length > 0 ? (
                      <div className="h-full grid place-items-center text-mauve text-sm font-jakarta text-center px-4">
                        No matches with these filters — try resetting
                      </div>
                    ) : (
                      <div className="h-full grid place-items-center text-center px-4">
                        <div>
                          <div className="text-3xl mb-2">🛍️</div>
                          <p className="text-mauve text-xs font-jakarta leading-relaxed">
                            Results appear here as a swipable stack
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile: back to chat */}
                  {mobileTab === "results" && (
                    <button
                      type="button"
                      onClick={() => setMobileTab("chat")}
                      className="md:hidden mx-3 mb-3 flex items-center gap-1.5 text-xs font-jakarta font-semibold text-ink/50 hover:text-ink transition"
                    >
                      <HiOutlineChevronLeft className="text-sm" /> Back to chat
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}