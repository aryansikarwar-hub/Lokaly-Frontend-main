import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const API_URL = `${API_BASE.replace(/\/$/, '')}/chat`;

/**
 * Lokaly AI Chatbot Widget
 * - Floating icon bottom-left
 * - Custom chat UI with API integration
 * - Real-time messaging with shopping assistant
 */
export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    // Load from localStorage on mount
    try {
      const saved = localStorage.getItem('lokaly_chat_history');
      return saved ? JSON.parse(saved) : [
        {
          role: 'bot',
          text: "Namaste! 🙏 I'm your Lokaly shopping assistant. Ask me about local products, sarees, pickles, or anything you'd like to buy!",
          products: [],
          time: new Date().toISOString(),
        },
      ];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Drag state — button position persisted in localStorage
  const [btnPos, setBtnPos] = useState(() => {
    try {
      const saved = localStorage.getItem('lokaly_chat_btn_pos');
      return saved ? JSON.parse(saved) : { x: 0, y: 0 };
    } catch { return { x: 0, y: 0 }; }
  });
  const dragStartRef = useRef(null); // tracks if it's a drag vs click
  const isDraggingRef = useRef(false);

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lokaly_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // Body scroll lock on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Add user message
    const userMsg = {
      role: 'user',
      text,
      time: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Send last 8 turns as context so the LLM can reason across the conversation.
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'bot')
        .slice(-8)
        .map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, history }),
      });

      if (!res.ok) {
        throw new Error(`Server error ${res.status}`);
      }

      const data = await res.json();

      const botMsg = {
        role: 'bot',
        text: data.answer || "Sorry, I couldn't process that. Try again?",
        why: data.why || '',
        followups: Array.isArray(data.followups) ? data.followups : [],
        products: Array.isArray(data.products) ? data.products : [],
        time: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        role: 'bot',
        text: '⚠️ Something went wrong. Please try again in a moment.',
        products: [],
        time: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'bot',
        text: "Namaste! 🙏 I'm your Lokaly shopping assistant. Ask me about local products, sarees, pickles, or anything you'd like to buy!",
        products: [],
        time: new Date().toISOString(),
      },
    ]);
  };

  return (
    <>
      {/* Draggable Floating Button */}
      <motion.button
        drag
        dragMomentum={false}
        dragElastic={0.1}
        dragConstraints={{
          top: -(window.innerHeight - 100),
          left: -(window.innerWidth - 80),
          right: window.innerWidth - 80,
          bottom: window.innerHeight - 100,
        }}
        initial={{ x: btnPos.x, y: btnPos.y, scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onDragStart={() => { isDraggingRef.current = false; dragStartRef.current = Date.now(); }}
        onDrag={() => { isDraggingRef.current = true; }}
        onDragEnd={(_, info) => {
          // Save position
          const newPos = { x: btnPos.x + info.offset.x, y: btnPos.y + info.offset.y };
          setBtnPos(newPos);
          try { localStorage.setItem('lokaly_chat_btn_pos', JSON.stringify(newPos)); } catch {}
        }}
        onClick={() => {
          // Only toggle if it wasn't a drag
          if (!isDraggingRef.current) setIsOpen((p) => !p);
          isDraggingRef.current = false;
        }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        className="fixed bottom-5 left-5 z-[9998] w-14 h-14 rounded-full
                   bg-gradient-to-br from-[#E07856] to-[#B8492C]
                   shadow-lg shadow-black/20 hover:shadow-xl
                   flex items-center justify-center
                   text-white transition-shadow duration-200
                   ring-4 ring-white/40 dark:ring-black/20
                   cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              width="26" height="26" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </motion.svg>
          )}
        </AnimatePresence>

        {!isOpen && (
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 ring-2 ring-white" />
          </span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed z-[9999]
                       bottom-24 left-5
                       w-[calc(100vw-2.5rem)] sm:w-[400px]
                       h-[70vh] sm:h-[600px] max-h-[700px]
                       bg-white dark:bg-[#1a1424]
                       rounded-2xl shadow-2xl shadow-black/30
                       border border-black/10 dark:border-white/10
                       overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3
                            bg-gradient-to-r from-[#E07856] to-[#B8492C]
                            text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur">
                  <span className="text-lg">🛍️</span>
                </div>
                <div>
                  <div className="font-semibold text-sm leading-tight">Lokaly AI</div>
                  <div className="text-[11px] opacity-90 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                    Shopping Assistant
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label="Clear chat"
                  title="Clear chat"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2"
                       strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2.5"
                       strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3
                            bg-[#FFF8F0] dark:bg-[#1a1424]
                            scroll-smooth">
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={idx}
                  msg={msg}
                  onFollowup={(q) => { setInput(q); inputRef.current?.focus(); }}
                />
              ))}

              {isLoading && <TypingIndicator />}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-black/10 dark:border-white/10 p-3 bg-white dark:bg-[#1a1424] shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about local products..."
                  rows={1}
                  disabled={isLoading}
                  className="flex-1 resize-none rounded-2xl px-4 py-2.5
                             bg-gray-100 dark:bg-[#2B2438]
                             text-gray-900 dark:text-white
                             placeholder-gray-500 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#E07856]
                             disabled:opacity-50 max-h-24"
                  style={{ minHeight: '40px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E07856] to-[#B8492C]
                             text-white flex items-center justify-center
                             hover:shadow-lg transition-all
                             disabled:opacity-40 disabled:cursor-not-allowed
                             shrink-0"
                  aria-label="Send"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2"
                       strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <div className="text-[10px] text-gray-400 mt-1.5 text-center">
                Powered by Lokaly AI · Press Enter to send
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ===== Sub-components ===== */

function MessageBubble({ msg, onFollowup }) {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isUser && (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E07856] to-[#B8492C]
                          flex items-center justify-center text-xs shrink-0 mt-0.5">
            🛍️
          </div>
        )}
        <div>
          <div
            className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
              isUser
                ? 'bg-gradient-to-br from-[#E07856] to-[#B8492C] text-white rounded-br-sm'
                : msg.isError
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-bl-sm'
                : 'bg-white dark:bg-[#2B2438] text-gray-900 dark:text-white rounded-bl-sm shadow-sm border border-black/5 dark:border-white/5'
            }`}
          >
            {msg.text}
          </div>

          {/* "Why these?" — explanation from LLM */}
          {!isUser && msg.why && (
            <div className="mt-1 text-[11px] italic text-gray-500 dark:text-gray-400 px-1">
              {msg.why}
            </div>
          )}

          {/* Product suggestions */}
          {!isUser && msg.products && msg.products.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {msg.products.slice(0, 3).map((product, i) => (
                <ProductCard key={i} product={product} />
              ))}
            </div>
          )}

          {/* Follow-up question chips */}
          {!isUser && msg.followups && msg.followups.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {msg.followups.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onFollowup?.(q)}
                  className="px-3 py-1 rounded-full bg-[#E07856]/10 hover:bg-[#E07856]/20
                             border border-[#E07856]/30 text-[#B8492C] dark:text-[#E07856]
                             text-[11px] font-medium transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ProductCard({ product }) {
  // Handle different possible product shapes
  const name = product.name || product.title || product.productName || 'Product';
  const price = product.price || product.cost;
  const id = product.id || product._id;

  const handleClick = () => {
    if (id) {
      window.location.href = `/product/${id}`;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left bg-white dark:bg-[#2B2438] border border-[#E07856]/30
                 rounded-xl px-3 py-2 hover:border-[#E07856] transition-colors
                 flex items-center justify-between gap-2"
    >
      <div className="text-xs">
        <div className="font-medium text-gray-900 dark:text-white truncate">{name}</div>
        {price && <div className="text-[#E07856] font-semibold">₹{price}</div>}
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" className="text-[#E07856] shrink-0">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="flex gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E07856] to-[#B8492C]
                        flex items-center justify-center text-xs shrink-0">
          🛍️
        </div>
        <div className="bg-white dark:bg-[#2B2438] px-4 py-3 rounded-2xl rounded-bl-sm
                        shadow-sm border border-black/5 dark:border-white/5">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-[#E07856] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-[#E07856] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-[#E07856] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}