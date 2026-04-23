import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TbWand } from 'react-icons/tb';
import { HiXMark, HiOutlinePaperAirplane, HiOutlineSparkles } from 'react-icons/hi2';
import api from '../../services/api';
import { CardStack } from '../../components/animations/CardStack';

const SUGGESTIONS = [
  'blue saree under 1500',
  'gift for mom — handmade',
  'festive diya set diwali',
  'pottery for new home',
];

export default function AIShopperPanel() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);

  async function ask(q) {
    const body = (q || query).trim();
    if (!body) return;
    setHistory((h) => [...h, { role: 'user', text: body }]);
    setQuery('');
    setLoading(true);
    try {
      const { data } = await api.post('/ml/search', { query: body, topK: 6 });
      setResults(data.hits || []);
      setHistory((h) => [
        ...h,
        { role: 'bot', text: `Found ${data.hits?.length || 0} matches — swipe through them` },
      ]);
    } catch {
      setHistory((h) => [
        ...h,
        { role: 'bot', text: 'Hugging Face model is warming up. Try again in a moment.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.4 }}
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
            className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-end md:place-items-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              key="ai-shopper-panel"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.28 }}
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
                          className={`max-w-[85%] ${m.role === 'user' ? 'ml-auto' : ''}`}
                        >
                          <div
                            className={`rounded-2xl px-4 py-2 text-sm inline-block ${
                              m.role === 'user'
                                ? 'bg-coral text-white'
                                : 'bg-white dark:bg-white/10 border border-white dark:border-white/10 text-ink dark:text-cream'
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

                <div className="p-5 bg-gradient-to-b from-lavender/40 to-peach/40 dark:from-white/5 dark:to-white/5 overflow-hidden border-l border-white/60 dark:border-white/10">
                  <div className="text-xs font-jakarta text-ink/70 dark:text-cream/70 mb-2 flex items-center gap-1">
                    <HiOutlineSparkles /> swipe results
                  </div>
                  {results.length > 0 ? (
                    <CardStack
                      items={results}
                      render={(r) => (
                        <Link to={`/product/${r.product._id}`} className="block h-full">
                          <div className="h-full w-full relative">
                            <img
                              src={r.product.images?.[0]?.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
                            <div className="absolute bottom-4 left-4 right-4 text-white">
                              <div className="text-[10px] opacity-70">
                                {Math.round(r.score * 100)}% match
                              </div>
                              <div className="font-jakarta font-semibold line-clamp-2">
                                {r.product.title}
                              </div>
                              <div className="font-fraunces text-2xl">
                                &#8377;{r.product.price?.toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        </Link>
                      )}
                    />
                  ) : (
                    <div className="h-full grid place-items-center text-mauve text-sm font-caveat">
                      results appear here as a swipable stack
                    </div>
                  )}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  ask();
                }}
                className="flex gap-2 items-center border-t border-ink/5 dark:border-white/10 p-3"
              >
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ask in english or hinglish..."
                  className="flex-1 rounded-full bg-white dark:bg-white/10 border border-white dark:border-white/10 px-4 py-3 text-sm outline-none text-ink dark:text-cream placeholder:text-ink/40 dark:placeholder:text-cream/40"
                />
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  type="submit"
                  className="w-11 h-11 rounded-full bg-coral text-white grid place-items-center disabled:opacity-50"
                  disabled={loading}
                  aria-label="send"
                >
                  <HiOutlinePaperAirplane />
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
