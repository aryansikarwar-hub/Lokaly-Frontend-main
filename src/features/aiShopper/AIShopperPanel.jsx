import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TbWand, TbSortDescending, TbShoppingBagPlus, TbBolt } from "react-icons/tb";
import {
  HiXMark,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiOutlineAdjustmentsHorizontal,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import api, { getSimilarProducts } from "../../services/api";
import { CardStack } from "../../components/animations/CardStack";
import { useAIShopperStore } from "../../store/aiShopperStore";
import useCartStore from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import VoiceMicButton from "./VoiceMicButton";
import PurchasePreview from "./PurchasePreview";

// 14 Indian languages — keeping the list aligned with VoiceShop.jsx
const VOICE_LANGS = [
  { code: "hi-IN", label: "HI", native: "हिं", name: "हिन्दी" },
  { code: "en-IN", label: "EN", native: "EN", name: "English" },
  { code: "ta-IN", label: "TA", native: "த", name: "தமிழ்" },
  { code: "bn-IN", label: "BN", native: "ব", name: "বাংলা" },
  { code: "gu-IN", label: "GU", native: "ગુ", name: "ગુજરાતી" },
  { code: "mr-IN", label: "MR", native: "मरा", name: "मराठी" },
  { code: "te-IN", label: "TE", native: "తె", name: "తెలుగు" },
  { code: "kn-IN", label: "KN", native: "ಕ", name: "ಕನ್ನಡ" },
  { code: "ml-IN", label: "ML", native: "മ", name: "മലയാളം" },
  { code: "pa-IN", label: "PA", native: "ਪ", name: "ਪੰਜਾਬੀ" },
];

function speakBack(text, langCode) {
  if (!text) return;
  try {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langCode || "en-IN";
    u.rate = 1.0;
    u.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) =>
      v.lang?.toLowerCase().startsWith((langCode || "en").toLowerCase().split("-")[0]),
    );
    if (match) u.voice = match;
    window.speechSynthesis.speak(u);
  } catch (_) {
    /* TTS failed — non-fatal */
  }
}

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
  const navigate = useNavigate();
  const cartAdd = useCartStore((s) => s.add);
  const cartFetch = useCartStore((s) => s.fetch);
  const token = useAuthStore((s) => s.token);

  const [query, setQuery] = useState("");
  const [interim, setInterim] = useState(""); // live STT preview
  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [history, setHistory] = useState([]);
  const [sort, setSort] = useState("best_buy");
  const [filters, setFilters] = useState({ city: "", category: "", maxPrice: 0 });
  const [filtersOpen, setFiltersOpen] = useState(false);
  // When a buy_now / add_to_cart voice intent had no anchor but did return
  // candidate products, we surface a sticky banner that lets the user act on
  // the top match in one tap (or one more "buy now" voice command).
  const [pendingIntent, setPendingIntent] = useState(null); // 'buy_now' | 'add_to_cart' | null
  const lastTopRef = useRef(null); // anchor product for voice "add to cart"
  // Last-mile confirmation card. When set, we render <PurchasePreview /> so
  // the user can see what we're about to buy + cancel before /checkout.
  const [pendingPurchase, setPendingPurchase] = useState(null);

  // Drag state
  const [btnPos, setBtnPos] = useState(() => {
    try {
      const saved = localStorage.getItem('lokaly_ai_btn_pos');
      return saved ? JSON.parse(saved) : { x: 0, y: 0 };
    } catch { return { x: 0, y: 0 }; }
  });
  const isDraggingRef = useRef(false);

  // Derive filter option lists from current results
  const cities = useMemo(
    () => Array.from(new Set(results.map((h) => h.product.city_name).filter(Boolean))).sort(),
    [results],
  );
  const categories = useMemo(
    () => Array.from(new Set(results.map((h) => h.product.category).filter(Boolean))).sort(),
    [results],
  );
  const priceCeiling = useMemo(
    () => results.reduce((m, h) => Math.max(m, Number(h.product.price) || 0), 0),
    [results],
  );

  // Compute composite "best buy" score on the client too (mirrors backend logic)
  const scored = useMemo(() => {
    if (results.length === 0) return [];
    const prices = results.map((h) => Number(h.product.price) || 0);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const span = maxP - minP || 1;
    return results.map((h) => {
      const priceQuality = 1 - ((Number(h.product.price) || maxP) - minP) / span;
      // 0.65 match · 0.35 price-quality (cheaper is better)
      const composite = 0.65 * (h.score || 0) + 0.35 * priceQuality;
      return { ...h, _composite: composite, _priceQuality: priceQuality };
    });
  }, [results]);

  // "You may like" — fetch similar products for the top match
  useEffect(() => {
    const topId = results[0]?.product?._id;
    if (!topId) {
      setSimilar([]);
      return;
    }
    let cancelled = false;
    getSimilarProducts(topId)
      .then((data) => {
        if (cancelled) return;
        const seen = new Set(results.map((r) => r.product._id));
        const list = (data?.similar || [])
          .map((p) => {
            const id = String(p._id || p.id || "");
            if (!id || seen.has(id)) return null;
            const rawImg = p.images?.[0]?.url || p.image || p.imageUrl || "";
            return {
              _id: id,
              title: p.title || "",
              price: p.price,
              image: absolutizeUrl(rawImg),
              city_name: p.city_name || "",
            };
          })
          .filter(Boolean)
          .slice(0, 6);
        setSimilar(list);
      })
      .catch(() => {
        if (!cancelled) setSimilar([]);
      });
    return () => {
      cancelled = true;
    };
  }, [results]);

  // Apply filters + sort
  const visibleResults = useMemo(() => {
    let list = scored.filter((h) => {
      if (filters.city && h.product.city_name !== filters.city) return false;
      if (filters.category && h.product.category !== filters.category) return false;
      if (filters.maxPrice && Number(h.product.price) > filters.maxPrice) return false;
      return true;
    });
    if (sort === "best_buy") list = [...list].sort((a, b) => b._composite - a._composite);
    if (sort === "match") list = [...list].sort((a, b) => (b.score || 0) - (a.score || 0));
    if (sort === "price_asc")
      list = [...list].sort((a, b) => (a.product.price || 0) - (b.product.price || 0));
    if (sort === "price_desc")
      list = [...list].sort((a, b) => (b.product.price || 0) - (a.product.price || 0));
    if (list.length > 0) list[0] = { ...list[0], _bestBuy: true };
    return list;
  }, [scored, filters, sort]);

  /**
   * Anchor product = whatever the user is currently looking at. Used for
   * voice commands like "add this to cart" / "buy now". Falls back to the
   * top of the latest results.
   */
  function getAnchor() {
    return lastTopRef.current || results[0]?.product || null;
  }

  async function handleAddToCart(product) {
    if (!product) {
      toast.error("Pehle koi product khojiye");
      return;
    }
    if (!token) {
      toast.error("Login to add to cart");
      navigate("/login");
      setOpen(false);
      return;
    }
    try {
      await cartAdd(String(product._id), 1);
      toast.success(`Added: ${product.title}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not add to cart");
    }
  }

  /**
   * Buy now is a 2-step flow now:
   *   1. Open the PurchasePreview card so the user sees exactly what's about
   *      to be ordered.
   *   2. On confirm (tap or 4s auto-elapse) → add to cart + redirect to
   *      /checkout. On cancel → leave cart untouched.
   */
  function handleBuyNow(product) {
    if (!product) return;
    if (!token) {
      toast.error("Login to checkout");
      navigate("/login");
      setOpen(false);
      return;
    }
    setPendingPurchase(product);
  }

  async function confirmPurchase() {
    const product = pendingPurchase;
    if (!product) return;
    setPendingPurchase(null);
    try {
      await cartAdd(String(product._id), 1);
      toast.success(`Buying: ${product.title}`);
      setOpen(false);
      // Pass the product id so /checkout can highlight + scroll to it in the
      // "You're buying" panel, making it crystal clear which item came from
      // the voice command.
      navigate(`/checkout?product=${encodeURIComponent(String(product._id))}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not start checkout");
    }
  }

  async function handleCheckout() {
    if (!token) {
      toast.error("Login to checkout");
      navigate("/login");
      setOpen(false);
      return;
    }
    await cartFetch().catch(() => {});
    setOpen(false);
    navigate("/checkout");
  }

  /**
   * Unified ask flow. `viaVoice` = true when triggered by mic, in which case
   * we hit /voice/parse to extract a structured intent (add_to_cart / buy_now /
   * checkout / search) and act on it. Text input goes straight to
   * /recommendations/search for fewer hops.
   */
  async function ask(q, viaVoice = false) {
    const body = (q || query).trim();
    if (!body) return;
    setHistory((h) => [...h, { role: "user", text: body }]);
    setQuery("");
    setInterim("");
    setLoading(true);
    setFilters({ city: "", category: "", maxPrice: 0 });
    setSimilar([]);
    try {
      let intentObj = null;
      let list = [];

      if (viaVoice) {
        const { data } = await api.post("/voice/parse", { query: body });
        intentObj = data?.intent || null;
        list = Array.isArray(data?.results) ? data.results : [];

        // Speak back the assistant's response (TTS)
        if (intentObj?.spoken_response) speakBack(intentObj.spoken_response, voiceLang);

        // Route non-search intents to cart/checkout handlers when an anchor
        // exists (i.e. user is already looking at a specific product).
        // Otherwise we fall through to render the candidate products and
        // surface a "pending intent" banner.
        const anchorBefore = getAnchor();
        if (intentObj?.action === "add_to_cart") {
          if (anchorBefore && list.length === 0) {
            await handleAddToCart(anchorBefore);
            setHistory((h) => [
              ...h,
              { role: "bot", text: `Added "${anchorBefore.title}" to cart` },
            ]);
            setLoading(false);
            return;
          }
          // No anchor or candidate list returned — let the user pick.
          setPendingIntent(list.length > 0 ? "add_to_cart" : null);
        } else if (intentObj?.action === "buy_now") {
          if (anchorBefore && list.length === 0) {
            await handleBuyNow(anchorBefore);
            setLoading(false);
            return;
          }
          setPendingIntent(list.length > 0 ? "buy_now" : null);
        } else if (intentObj?.action === "checkout") {
          await handleCheckout();
          setLoading(false);
          return;
        } else {
          setPendingIntent(null);
        }
        // Fall through — render the result list (or empty).
      } else {
        setPendingIntent(null);
        const { data } = await api.post("/recommendations/search", { query: body });
        list = Array.isArray(data?.results) ? data.results : [];
      }

      const hits = list
        .map((p) => {
          const id = String(p._id || p.id || "");
          if (!id) return null;
          const rawImg = p.images?.[0]?.url || p.image || p.imageUrl || "";
          return {
            score: typeof p.match_score === "number" ? p.match_score / 100 : 0,
            product: {
              _id: id,
              title: p.title || "",
              price: p.price,
              images: rawImg ? [{ url: absolutizeUrl(rawImg) }] : [],
              city_name: p.city_name || "",
              category: p.category || "",
              shop_name: p.shop_name || "",
            },
          };
        })
        .filter(Boolean);
      setResults(hits);
      if (hits[0]?.product) lastTopRef.current = hits[0].product;
      setHistory((h) => [
        ...h,
        {
          role: "bot",
          text: hits.length
            ? `Found ${hits.length} matches — swipe through them`
            : "Koi match nahi mila — try a product name like 'saree' or 'pottery'.",
        },
      ]);
    } catch {
      setHistory((h) => [
        ...h,
        {
          role: "bot",
          text: "Hugging Face model is warming up. Try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <motion.button
        type="button"
        drag
        dragMomentum={false}
        dragElastic={0.1}
        dragConstraints={{
          top: -(window.innerHeight - 100),
          left: -(window.innerWidth - 80),
          right: window.innerWidth - 80,
          bottom: window.innerHeight - 100,
        }}
        initial={{ x: btnPos.x, y: btnPos.y, scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.4 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onDragStart={() => { isDraggingRef.current = false; }}
        onDrag={() => { isDraggingRef.current = true; }}
        onDragEnd={(_, info) => {
          const newPos = { x: btnPos.x + info.offset.x, y: btnPos.y + info.offset.y };
          setBtnPos(newPos);
          try { localStorage.setItem('lokaly_ai_btn_pos', JSON.stringify(newPos)); } catch {}
        }}
        onClick={() => {
          if (!isDraggingRef.current) setOpen(true);
          isDraggingRef.current = false;
        }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-coral-gradient shadow-pop text-white grid place-items-center cursor-grab active:cursor-grabbing"
        aria-label="Open AI shopper"
        style={{ touchAction: 'none' }}
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
            className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-end md:place-items-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              key="ai-shopper-panel"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{
                type: "tween",
                ease: [0.22, 1, 0.36, 1],
                duration: 0.28,
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-cream dark:bg-[#2A2438] w-full md:w-[720px] md:rounded-3xl rounded-t-3xl border border-white dark:border-white/10 shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center gap-2 px-5 py-4 border-b border-ink/5 dark:border-white/10">
                <div className="w-9 h-9 rounded-xl bg-coral text-white grid place-items-center">
                  <TbWand />
                </div>
                <div className="flex-1">
                  <div className="font-fraunces text-lg text-ink dark:text-cream">
                    AI Personal Shopper
                  </div>
                  <div className="text-xs font-caveat text-mauve -mt-0.5">
                    powered by Hugging Face — MiniLM-L6-v2 embeddings
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 grid place-items-center rounded-full hover:bg-peach dark:hover:bg-white/10 text-ink dark:text-cream"
                  aria-label="close"
                >
                  <HiXMark />
                </button>
              </div>

              <div className="flex-1 grid md:grid-cols-[1fr_320px] overflow-hidden">
                <div className="p-5 overflow-auto">
                  {history.length === 0 ? (
                    <div>
                      <div className="font-caveat text-2xl text-ink dark:text-cream">
                        Namaste, what are you looking for?
                      </div>
                      <p className="text-sm text-ink/70 dark:text-cream/70 mt-1">
                        Try one of these
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {SUGGESTIONS.map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => ask(s)}
                            className="px-3 py-1.5 rounded-full bg-white dark:bg-white/10 border border-white dark:border-white/10 text-sm font-jakarta text-ink dark:text-cream hover:bg-peach/40 dark:hover:bg-white/20"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {history.map((m, i) => (
                        <div
                          key={i}
                          className={`max-w-[85%] ${m.role === "user" ? "ml-auto" : ""}`}
                        >
                          <div
                            className={`rounded-2xl px-4 py-2 text-sm inline-block ${
                              m.role === "user"
                                ? "bg-coral text-white"
                                : "bg-white dark:bg-white/10 border border-white dark:border-white/10 text-ink dark:text-cream"
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div className="text-sm text-mauve font-caveat">
                          thinking in Hugging Face embeddings…
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-5 bg-gradient-to-b from-lavender/40 to-peach/40 dark:from-white/5 dark:to-white/5 overflow-hidden border-l border-white/60 dark:border-white/10 flex flex-col">
                  {/* Pending-intent banner — surfaces "you said buy/add but I
                      need a product" with a one-tap action on the top match. */}
                  {pendingIntent && visibleResults[0]?.product && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-3 rounded-2xl bg-coral text-white px-3 py-2.5 flex items-center gap-2 shadow-pop"
                    >
                      <div className="text-[11px] font-jakarta flex-1 leading-snug">
                        {pendingIntent === "buy_now"
                          ? "You said buy — pick one to checkout, ya 'pehla wala buy now' boliye."
                          : "You said add to cart — pick one or speak again."}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const top = visibleResults[0].product;
                          if (pendingIntent === "buy_now") handleBuyNow(top);
                          else handleAddToCart(top);
                          setPendingIntent(null);
                        }}
                        className="shrink-0 px-2.5 py-1 rounded-full bg-white text-coral text-[11px] font-jakarta font-bold hover:bg-cream"
                      >
                        {pendingIntent === "buy_now" ? "Buy top match →" : "Add top match →"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingIntent(null)}
                        aria-label="dismiss"
                        className="shrink-0 w-6 h-6 grid place-items-center rounded-full hover:bg-white/20"
                      >
                        <HiXMark className="text-sm" />
                      </button>
                    </motion.div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-jakarta text-ink/70 dark:text-cream/70 flex items-center gap-1">
                      <HiOutlineSparkles /> {visibleResults.length} of {results.length}
                    </div>
                    {results.length > 0 && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setFiltersOpen((v) => !v)}
                          className="px-2 py-1 rounded-full bg-white/70 dark:bg-white/10 border border-white dark:border-white/10 text-[11px] font-jakarta text-ink dark:text-cream flex items-center gap-1 hover:bg-white"
                          aria-expanded={filtersOpen}
                          aria-label="filters"
                        >
                          <HiOutlineAdjustmentsHorizontal /> filter
                        </button>
                        <select
                          value={sort}
                          onChange={(e) => setSort(e.target.value)}
                          className="px-2 py-1 rounded-full bg-white/70 dark:bg-white/10 border border-white dark:border-white/10 text-[11px] font-jakarta text-ink dark:text-cream outline-none"
                          aria-label="sort"
                        >
                          {SORT_OPTIONS.map((o) => (
                            <option key={o.key} value={o.key}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {filtersOpen && results.length > 0 && (
                    <div className="mb-3 p-3 rounded-2xl bg-white/70 dark:bg-white/10 border border-white dark:border-white/10 space-y-2">
                      {cities.length > 1 && (
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] uppercase tracking-wider text-ink/50 dark:text-cream/50 font-jakarta w-14">
                            City
                          </label>
                          <select
                            value={filters.city}
                            onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
                            className="flex-1 text-xs px-2 py-1 rounded-md bg-white dark:bg-white/10 border border-ink/5 dark:border-white/10 outline-none"
                          >
                            <option value="">All</option>
                            {cities.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      {categories.length > 1 && (
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] uppercase tracking-wider text-ink/50 dark:text-cream/50 font-jakarta w-14">
                            Type
                          </label>
                          <select
                            value={filters.category}
                            onChange={(e) =>
                              setFilters((f) => ({ ...f, category: e.target.value }))
                            }
                            className="flex-1 text-xs px-2 py-1 rounded-md bg-white dark:bg-white/10 border border-ink/5 dark:border-white/10 outline-none"
                          >
                            <option value="">All</option>
                            {categories.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      {priceCeiling > 0 && (
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] uppercase tracking-wider text-ink/50 dark:text-cream/50 font-jakarta w-14">
                            Max ₹
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={priceCeiling}
                            step={Math.max(50, Math.round(priceCeiling / 100))}
                            value={filters.maxPrice || priceCeiling}
                            onChange={(e) =>
                              setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }))
                            }
                            className="flex-1 accent-coral"
                          />
                          <div className="text-[11px] font-jakarta text-ink dark:text-cream tabular-nums w-20 text-right">
                            ≤ ₹{(filters.maxPrice || priceCeiling).toLocaleString("en-IN")}
                          </div>
                        </div>
                      )}
                      {(filters.city || filters.category || filters.maxPrice) && (
                        <button
                          type="button"
                          onClick={() => setFilters({ city: "", category: "", maxPrice: 0 })}
                          className="text-[11px] font-jakarta text-coral hover:underline"
                        >
                          reset filters
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex-1 min-h-0">
                    {visibleResults.length > 0 ? (
                      <CardStack
                        items={visibleResults}
                        render={(r, _idx, isTop) => (
                          <div className="h-full w-full relative">
                            <img
                              src={r.product.images?.[0]?.url}
                              alt=""
                              className="w-full h-full object-cover pointer-events-none select-none"
                              draggable={false}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent pointer-events-none" />
                            {r._bestBuy && (
                              <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-butter text-tangerine text-[10px] font-jakarta font-bold uppercase tracking-wider shadow-pop flex items-center gap-1 pointer-events-none">
                                <TbSortDescending className="text-xs" /> Best buy
                              </div>
                            )}
                            {isTop && (
                              <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/80 backdrop-blur text-ink/70 text-[9px] font-jakarta uppercase tracking-wider pointer-events-none">
                                swipe ← →
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white pointer-events-none">
                              <div className="text-[10px] opacity-70">
                                {Math.round(r.score * 100)}% match
                                {r.product.city_name ? ` · ${r.product.city_name}` : ""}
                              </div>
                              <div className="font-jakarta font-semibold line-clamp-2">
                                {r.product.title}
                              </div>
                              <div className="font-fraunces text-2xl">
                                &#8377;{r.product.price?.toLocaleString("en-IN")}
                              </div>
                              {r._bestBuy && (
                                <div className="text-[10px] opacity-80 font-caveat mt-0.5">
                                  cheapest of the strong matches
                                </div>
                              )}
                              <div className="pointer-events-auto mt-3 flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(r.product);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-ink text-xs font-jakarta font-semibold shadow-pop hover:bg-peach transition"
                                >
                                  <TbShoppingBagPlus className="text-sm" /> Add
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBuyNow(r.product);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-coral text-white text-xs font-jakarta font-semibold shadow-pop hover:bg-coral/90 transition"
                                >
                                  <TbBolt className="text-sm" /> Buy now
                                </button>
                                <Link
                                  to={`/product/${r.product._id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpen(false);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur text-white text-xs font-jakarta font-semibold border border-white/40 hover:bg-white/30 transition"
                                >
                                  Details →
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}
                      />
                    ) : results.length > 0 ? (
                      <div className="h-full grid place-items-center text-mauve text-sm font-caveat text-center px-4">
                        no matches with these filters — try resetting
                      </div>
                    ) : (
                      <div className="h-full grid place-items-center text-mauve text-sm font-caveat">
                        results appear here as a swipable stack
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {similar.length > 0 && (
                <div className="border-t border-ink/5 dark:border-white/10 px-5 py-3 bg-cream dark:bg-[#2A2438]">
                  <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
                    You may also like
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                    {similar.map((p) => (
                      <Link
                        key={p._id}
                        to={`/product/${p._id}`}
                        onClick={() => setOpen(false)}
                        className="shrink-0 w-32 rounded-xl overflow-hidden bg-white dark:bg-white/10 border border-white dark:border-white/10 hover:border-coral/40 transition-all"
                      >
                        <div className="aspect-square bg-peach/30 overflow-hidden">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.title}
                              loading="lazy"
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-ink/20 font-fraunces text-2xl">
                              {p.title?.[0] || "?"}
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <div className="text-[11px] font-jakarta font-semibold text-ink dark:text-cream truncate">
                            {p.title}
                          </div>
                          {p.price != null && (
                            <div className="text-[11px] font-fraunces text-ink/80 dark:text-cream/80">
                              ₹{Number(p.price).toLocaleString("en-IN")}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-ink/5 dark:border-white/10 p-3">
                {/* Voice command hint chips — make actions discoverable */}
                {results.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2 pl-1">
                    <span className="text-[10px] uppercase tracking-wider font-jakarta text-ink/40 dark:text-cream/40 self-center">
                      Try saying:
                    </span>
                    {[
                      "add to cart",
                      "buy now",
                      "checkout karo",
                      "isse sasta",
                    ].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => ask(s, true)}
                        className="px-2 py-0.5 rounded-full bg-coral/10 border border-coral/30 text-[10px] font-jakarta text-coral hover:bg-coral/20"
                      >
                        "{s}"
                      </button>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    ask();
                  }}
                  className="flex gap-2 items-center"
                >
                  <VoiceMicButton
                    lang={voiceLang}
                    onLangChange={setVoiceLang}
                    languages={VOICE_LANGS}
                    busy={loading}
                    onInterim={(text) => setInterim(text)}
                    onFinalTranscript={(text) => {
                      setInterim("");
                      ask(text, true);
                    }}
                  />
                  <input
                    value={interim || query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      interim
                        ? "listening…"
                        : "speak or type — english, hindi, hinglish…"
                    }
                    readOnly={!!interim}
                    className={`flex-1 rounded-full border px-4 py-3 text-sm outline-none ${
                      interim
                        ? "bg-coral/10 border-coral/40 text-coral italic"
                        : "bg-white dark:bg-white/10 border-white dark:border-white/10 text-ink dark:text-cream placeholder:text-ink/40 dark:placeholder:text-cream/40"
                    }`}
                  />
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    type="submit"
                    className="w-11 h-11 rounded-full bg-coral text-white grid place-items-center disabled:opacity-50"
                    disabled={loading || (!query.trim() && !interim)}
                    aria-label="send"
                  >
                    <HiOutlinePaperAirplane />
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last-mile purchase confirmation card. Renders OUTSIDE the panel
          modal so it stays visible even if the user closed the AI shopper. */}
      {pendingPurchase && (
        <PurchasePreview
          product={pendingPurchase}
          onConfirm={confirmPurchase}
          onCancel={() => {
            setPendingPurchase(null);
            toast("Cancelled", { icon: "↩️" });
          }}
        />
      )}
    </>
  );
}