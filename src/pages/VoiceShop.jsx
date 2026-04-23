import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineStopCircle,
  HiOutlineInformationCircle,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { TbMicrophone } from "react-icons/tb";
import api from "../services/api";
import { Reveal } from "../components/animations/Reveal";
import ProductCard from "../components/ProductCard";

const LANGS = [
  { code: "hi-IN", label: "HI", name: "Hindi" },
  { code: "en-IN", label: "EN", name: "English" },
  { code: "ta-IN", label: "TA", name: "Tamil" },
  { code: "bn-IN", label: "BN", name: "Bengali" },
];

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
  const recRef = useRef(null);

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

  async function search(q) {
    try {
      const { data } = await api.post("/ml/search", { query: q, topK: 8 });
      setResults(data.hits || []);
    } catch {
      setResults([]);
    }
  }

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
            {/* FIX 1: text-ink/55 → explicit dark mode color */}
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
          {/* Pulse rings when listening */}
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

          {/* FIX 2: bg-ink dark mode pe invisible tha → dark:bg-white/15 se visible ring milegi */}
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

        {/* FIX 3: text-ink/50 → dark:text-cream/50 */}
        <div className="mt-4 text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-ink/50 dark:text-cream/50">
          {listening ? "Listening..." : "Tap to speak"}
        </div>

        {/* Language picker */}
        {/* FIX 4: bg-white/70 language picker dark mode mein barely visible tha */}
        <div className="mt-5 inline-flex items-center gap-0.5 bg-white/70 dark:bg-white/8 border border-ink/5 dark:border-white/10 rounded-full p-1">
          {LANGS.map((l) => (
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
      </div>

      {/* Transcript */}
      <div className="mt-8 min-h-[60px] flex items-center justify-center">
        {transcript ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* FIX 5: text-ink/45 → dark:text-cream/45 */}
            <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/45 dark:text-cream/45 mb-2">
              Transcript
            </div>
            <div className="font-fraunces text-xl md:text-2xl text-ink dark:text-cream tracking-tight leading-tight max-w-2xl">
              "{transcript}"
            </div>
          </motion.div>
        ) : (
          <div className="text-center">
            {/* FIX 6: Try saying label */}
            <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/40 dark:text-cream/40 mb-2">
              Try saying
            </div>
            {/* FIX 7: Example queries text-ink/55 → dark:text-cream/55 */}
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

      {/* Results */}
      {results.length > 0 && (
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
        {/* FIX 8: text-ink/70 → dark:text-cream/70 */}
        <p className="text-[11px] font-jakarta text-ink/70 dark:text-cream/70 leading-relaxed">
          Your voice transcript is processed by our local ML service — queries
          are embedded and matched semantically. Audio is never stored.
        </p>
      </div>
    </div>
  );
}
