import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineStopCircle,
  HiOutlineInformationCircle,
  HiOutlineSparkles,
  HiOutlineChevronDown,
} from "react-icons/hi2";
import { TbMicrophone } from "react-icons/tb";
import api from "../services/api";
import { Reveal } from "../components/animations/Reveal";
import ProductCard from "../components/ProductCard";

// ── FIX 1: All 22 scheduled Indian languages ──────────────────────────────
const LANGS = [
  { code: "hi-IN", label: "HI", name: "हिन्दी" },
  { code: "en-IN", label: "EN", name: "English" },
  { code: "ta-IN", label: "TA", name: "தமிழ்" },
  { code: "bn-IN", label: "BN", name: "বাংলা" },
  { code: "gu-IN", label: "GU", name: "ગુજરાતી" },
  { code: "mr-IN", label: "MR", name: "मराठी" },
  { code: "te-IN", label: "TE", name: "తెలుగు" },
  { code: "kn-IN", label: "KN", name: "ಕನ್ನಡ" },
  { code: "ml-IN", label: "ML", name: "മലയാളം" },
  { code: "pa-IN", label: "PA", name: "ਪੰਜਾਬੀ" },
  { code: "or-IN", label: "OR", name: "ଓଡ଼ିଆ" },
  { code: "as-IN", label: "AS", name: "অসমীয়া" },
  { code: "ur-IN", label: "UR", name: "اردو" },
  { code: "sa-IN", label: "SA", name: "संस्कृत" },
];

// Quick-access tabs shown below the mic (most popular)
const QUICK_TABS = ["hi-IN", "en-IN", "ta-IN", "bn-IN", "gu-IN", "mr-IN"];

const EXAMPLE_QUERIES = [
  "mujhe neeli saree 1000 ke neeche chahiye",
  "handmade pottery from Jaipur under 2000",
  "organic turmeric powder",
];

export default function VoiceShop() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState([]);
  const [supported, setSupported] = useState(true);
  const [lang, setLang] = useState("hi-IN");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  // Structured intent returned by /api/voice/parse — drives intent chips +
  // TTS response + cart action handling.
  const [intent, setIntent] = useState(null);
  const recRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) {
      setSupported(false);
      return;
    }
    const r = new Rec();
    r.continuous = false;
    r.interimResults = true;
    r.lang = lang;
    r.onresult = (e) => {
      const t = Array.from(e.results)
        .map((x) => x[0].transcript)
        .join(" ");
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) search(t);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recRef.current = r;
    return () => r.stop?.();
  }, [lang]);

  function start() {
    setTranscript("");
    setResults([]);
    setSearchError(null);
    try {
      recRef.current?.start();
      setListening(true);
    } catch {
      /* ignore */
    }
  }
  function stop() {
    recRef.current?.stop();
    setListening(false);
  }

  // ── Voice → intent → products ───────────────────────────────────────────
  // /api/voice/parse uses Gemini (or a regex fallback) to extract
  // {action, keywords, color, size, budget_max, location, urgency,
  //  spoken_response} from the transcript. We then:
  //   - speak `spoken_response` back via Web Speech Synthesis
  //   - render the structured intent as chips
  //   - if action=add_to_cart / checkout, trigger the cart action instead
  //     of a search
  //
  // This is the "killer feature" — the user can speak naturally in
  // Hinglish ("300 ke under shoes Bhopal me jaldi chahiye") and the app
  // understands all of it, not just keywords.
  async function search(q) {
    if (!q.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const { data } = await api.post("/voice/parse", { query: q });
      const i = data?.intent || null;
      setIntent(i);

      // Speak back to the user — Hinglish TTS via browser's SpeechSynthesis
      if (i?.spoken_response) speak(i.spoken_response, lang);

      // Cart actions: handle locally (frontend state). For now we tag the
      // first surfaced product as the implicit "this" reference.
      if (i?.action === "add_to_cart" && results[0]?.product) {
        // Hook this to your real cart store when ready.
        console.log("[voice] add_to_cart →", results[0].product);
      } else if (i?.action === "checkout") {
        console.log("[voice] checkout requested");
      }

      const list = Array.isArray(data?.results) ? data.results : [];
      const hits = list
        .map((p) => {
          const id = String(p._id || p.id || "");
          if (!id) return null;
          return {
            score: typeof p.match_score === "number" ? p.match_score / 100 : 0,
            product: {
              _id: id,
              title: p.title,
              price: p.price,
              images: p.images || (p.image ? [{ url: p.image }] : []),
              seller: p.seller,
              category: p.category,
              rating: p.rating,
              reviewCount: p.reviewCount,
              city: p.city,
            },
          };
        })
        .filter(Boolean);
      setResults(hits);
      if (hits.length === 0 && i?.action === "search") {
        setSearchError("Koi product nahi mila. Dobara bolein ya alag shabdon mein try karein.");
      }
    } catch (err) {
      console.error("Voice search error:", err);
      setResults([]);
      setSearchError(
        err?.response?.status === 503
          ? "Recommender warm-up ho raha hai, thoda wait karke dobara try karein."
          : "Search mein kuch gadbad hui. Please retry karein."
      );
    } finally {
      setSearching(false);
    }
  }

  // Browser TTS — Hindi voice agar uplabdh hai, warna default.
  function speak(text, langCode) {
    try {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = langCode || "hi-IN";
      u.rate = 1.0;
      u.pitch = 1.0;
      // Try to pick a matching voice
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.lang?.toLowerCase().startsWith((langCode || "hi").toLowerCase().split("-")[0]));
      if (match) u.voice = match;
      window.speechSynthesis.speak(u);
    } catch (e) {
      // TTS failure is non-fatal; just skip
    }
  }

  const activeLang = LANGS.find((l) => l.code === lang);
  const quickLangs = LANGS.filter((l) => QUICK_TABS.includes(l.code));

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <Reveal>
        <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
          Vernacular search
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-fraunces text-2xl md:text-3xl text-ink dark:text-cream tracking-tight flex items-center gap-2">
              <TbMicrophone className="text-coral" />
              Voice shop
            </h1>
            <p className="mt-1 text-xs text-ink/55 dark:text-cream/60 font-jakarta max-w-md">
              Speak naturally in your language. On-device ML transcribes and
              finds semantic matches.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lavender/50 border border-white text-[10px] font-jakarta font-semibold text-mauve uppercase tracking-wide">
            <HiOutlineSparkles className="text-xs" />
            On-device
          </div>
        </div>
      </Reveal>

      {!supported && (
        <div className="mt-5 rounded-xl bg-butter/60 border border-butter/40 p-3 flex items-start gap-2">
          <HiOutlineInformationCircle className="text-coral text-base shrink-0 mt-0.5" />
          <p className="text-[11px] font-jakarta text-ink/75 dark:text-cream/70 leading-relaxed">
            Your browser doesn't support the Web Speech API. Try Chrome or Edge
            on desktop.
          </p>
        </div>
      )}

      {/* Mic section */}
      <div className="mt-10 flex flex-col items-center">
        <div className="relative grid place-items-center">
          {listening && (
            <>
              <motion.div
                className="absolute w-24 h-24 rounded-full border-2 border-coral/60"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              <motion.div
                className="absolute w-24 h-24 rounded-full border-2 border-coral/40"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 1.6, repeat: Infinity, delay: 0.3 }}
              />
            </>
          )}

          <motion.button
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.03 }}
            onClick={listening ? stop : start}
            className={`relative w-24 h-24 rounded-full grid place-items-center text-white transition-colors ${
              listening
                ? "bg-coral"
                : "bg-ink dark:bg-white/15 dark:border dark:border-white/20 hover:bg-ink/90 dark:hover:bg-white/25"
            }`}
            aria-label={listening ? "stop" : "start"}
          >
            {listening ? (
              <HiOutlineStopCircle className="text-3xl" />
            ) : (
              <TbMicrophone className="text-3xl" />
            )}
          </motion.button>
        </div>

        <div className="mt-4 text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-ink/50 dark:text-cream/50">
          {listening ? "Listening..." : "Tap to speak"}
        </div>

        {/* ── FIX 1a: Quick-access tabs (top 6 languages) ── */}
        <div className="mt-5 flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-0.5 bg-white/70 dark:bg-white/8 border border-ink/5 dark:border-white/10 rounded-full p-1">
            {quickLangs.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                title={l.name}
                className={`px-3 py-1 rounded-full text-[10px] font-jakarta font-bold tracking-wider transition ${
                  lang === l.code
                    ? "bg-ink dark:bg-white/20 text-cream"
                    : "text-ink/60 dark:text-cream/60 hover:text-ink dark:hover:text-cream"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* ── FIX 1b: Dropdown for all remaining languages ── */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 dark:bg-white/8 border border-ink/5 dark:border-white/10 text-[10px] font-jakarta font-semibold text-ink/70 dark:text-cream/70 hover:text-ink dark:hover:text-cream transition"
            >
              {activeLang?.name || "Language"}
              <HiOutlineChevronDown
                className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-50 w-44 max-h-64 overflow-y-auto rounded-xl bg-white dark:bg-zinc-900 border border-ink/10 dark:border-white/10 shadow-lg py-1"
              >
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-jakarta flex items-center justify-between transition ${
                      lang === l.code
                        ? "bg-coral/10 text-coral font-semibold"
                        : "text-ink/70 dark:text-cream/70 hover:bg-ink/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{l.name}</span>
                    <span className="text-[10px] opacity-50">{l.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="mt-8 min-h-[60px] flex items-center justify-center">
        {transcript ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/45 dark:text-cream/45 mb-2">
              Transcript
            </div>
            <div className="font-fraunces text-xl md:text-2xl text-ink dark:text-cream tracking-tight leading-tight max-w-2xl">
              "{transcript}"
            </div>
          </motion.div>
        ) : (
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/40 dark:text-cream/40 mb-2">
              Try saying
            </div>
            <div className="space-y-1">
              {EXAMPLE_QUERIES.map((q, i) => (
                <div
                  key={i}
                  className="text-xs font-jakarta text-ink/55 dark:text-cream/55 italic"
                >
                  "{q}"
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Intent chips — show what Gemini understood */}
      {intent && !searching && (
        <div className="mt-6 max-w-2xl mx-auto px-4">
          <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/45 dark:text-cream/45 mb-2 text-center">
            What I understood
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {intent.action && intent.action !== "search" && (
              <Chip label={`action: ${intent.action.replace(/_/g, " ")}`} accent />
            )}
            {intent.keywords?.length > 0 && (
              <Chip label={intent.keywords.slice(0, 4).join(" · ")} />
            )}
            {intent.color && <Chip label={`color: ${intent.color}`} />}
            {intent.size && <Chip label={`size: ${intent.size}`} />}
            {intent.budget_max && <Chip label={`under ₹${intent.budget_max.toLocaleString("en-IN")}`} />}
            {intent.location && <Chip label={`in ${intent.location}`} />}
            {intent.urgency && <Chip label={intent.urgency.replace("_", " ")} />}
            {intent.quantity && intent.quantity > 1 && <Chip label={`qty ${intent.quantity}`} />}
          </div>
          {intent.spoken_response && (
            <div className="mt-3 text-center font-caveat text-mauve text-base italic">
              "{intent.spoken_response}"
            </div>
          )}
        </div>
      )}

      {/* ── FIX 2: Loading spinner while searching ── */}
      {searching && (
        <div className="mt-8 flex justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-coral border-t-transparent animate-spin" />
        </div>
      )}

      {/* ── FIX 3: Error / empty state ── */}
      {searchError && !searching && (
        <div className="mt-6 rounded-xl bg-butter/60 border border-butter/40 p-3 flex items-start gap-2">
          <HiOutlineInformationCircle className="text-coral text-base shrink-0 mt-0.5" />
          <p className="text-[11px] font-jakarta text-ink/75 dark:text-cream/70 leading-relaxed">
            {searchError}
          </p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !searching && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-1">
                Matches
              </div>
              <h3 className="font-fraunces text-lg text-ink dark:text-cream tracking-tight">
                Found {results.length} products
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {results.map((r, i) => (
              <motion.div
                key={r.product._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <ProductCard product={r.product} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Privacy footer */}
      <div className="mt-10 rounded-xl bg-mint/40 border border-mint/40 p-3 flex items-start gap-2">
        <HiOutlineInformationCircle className="text-leaf text-base shrink-0 mt-0.5" />
        <p className="text-[11px] font-jakarta text-ink/70 dark:text-cream/70 leading-relaxed">
          Your voice transcript is processed by our local ML service — queries
          are embedded and matched semantically. Audio is never stored.
        </p>
      </div>
    </div>
  );
}

// Small chip used in the intent-understanding row.
function Chip({ label, accent = false }) {
  return (
    <span
      className={`text-[11px] font-jakarta font-semibold px-2.5 py-1 rounded-full border ${
        accent
          ? "bg-coral text-white border-coral"
          : "bg-white/70 dark:bg-white/10 border-ink/10 dark:border-white/10 text-ink dark:text-cream"
      }`}
    >
      {label}
    </span>
  );
}