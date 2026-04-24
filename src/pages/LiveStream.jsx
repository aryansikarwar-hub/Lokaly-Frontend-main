import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineBolt,
  HiOutlineUserGroup,
  HiOutlineSparkles,
  HiOutlineHeart,
  HiOutlineFire,
  HiOutlineShoppingBag,
  HiOutlineVideoCamera,
  HiOutlinePaperAirplane,
  HiOutlineClock,
  HiOutlineTag,
  HiOutlineChartBar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineShoppingCart,
  HiOutlineQuestionMarkCircle,
} from "react-icons/hi2";
import { TbFlame, TbHeartFilled, TbStar, TbCoin } from "react-icons/tb";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { useAuthStore } from "../store/authStore";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Avatar } from "../components/ui/Avatar";
import { Spinner } from "../components/ui/Spinner";
import SpinTheWheel from "../components/SpinTheWheel";

const REACTION_ICONS = [TbHeartFilled, TbFlame, TbStar, HiOutlineHeart];

// ── Mock data shown when no real sessions exist ──────────────────────────────
const MOCK_SESSION = {
  _id: "mock-1",
  roomId: "mock-room-1",
  title: "Kanchipuram Silk Sarees – Live Drop",
  category: "Handloom & Textiles",
  status: "live",
  coverImage:
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&q=80",
  host: {
    name: "Lakshmi Weaves",
    shopName: "Lakshmi Weaves",
    avatar: null,
  },
  featuredProducts: [
    {
      _id: "p1",
      title: "Magenta Kanjivaram",
      price: 4200,
      originalPrice: 6800,
      stock: 3,
      images: [
        {
          url: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=100&q=80",
        },
      ],
    },
    {
      _id: "p2",
      title: "Silver Jhumkas",
      price: 890,
      originalPrice: 1250,
      stock: 12,
      images: [
        {
          url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=100&q=80",
        },
      ],
    },
    {
      _id: "p3",
      title: "Pure Silk Dupatta",
      price: 1450,
      originalPrice: 1450,
      stock: 7,
      images: [
        {
          url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&q=80",
        },
      ],
    },
    {
      _id: "p4",
      title: "Mango Achaar 500g",
      price: 320,
      originalPrice: 320,
      stock: 20,
      images: [
        {
          url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=100&q=80",
        },
      ],
    },
  ],
  groupBuy: { participants: Array(7).fill(null), threshold: 10 },
  stats: { peakViewers: 2928, heartsSent: 12400, itemsSold: 47, coinsEarned: 280 },
  isMock: true,
};

const MOCK_CHAT = [
  { user: "Aditi", text: "Add to cart NOW!", bought: true },
  { user: "Sanjay", text: "From which loom?" },
  { user: "Rohan", text: "Beautiful work 🙏" },
  { user: "Nisha", text: "Cash on delivery? 💚" },
  { user: "Priya", text: "Is it pure silk?" },
  { user: "Deepak", text: "Can you show the border more?" },
];

const MOCK_SESSIONS = [MOCK_SESSION];

// Stat card
function StatCard({ icon: Icon, value, label, color = "coral" }) {
  const colors = {
    coral: "bg-coral/10 text-coral",
    mint: "bg-mint/10 text-leaf",
    gold: "bg-amber-50 text-amber-500",
    ink: "bg-ink/5 text-ink/60",
  };
  return (
    <div className="rounded-2xl bg-white/80 border border-ink/5 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl grid place-items-center text-lg ${colors[color]}`}>
        <Icon />
      </div>
      <div>
        <div className="font-fraunces text-lg text-ink tracking-tight leading-none">
          {value}
        </div>
        <div className="text-[10px] font-jakarta text-ink/50 uppercase tracking-wider mt-0.5">
          {label}
        </div>
      </div>
    </div>
  );
}

// Chat tab selector
const CHAT_TABS = [
  { id: "chat", label: "Chat", icon: HiOutlineChatBubbleLeftRight },
  { id: "shop", label: "Shop", icon: HiOutlineShoppingCart, count: 4 },
  { id: "qa", label: "Q&A", icon: HiOutlineQuestionMarkCircle, count: 2 },
  { id: "poll", label: "Poll", icon: HiOutlineChartBar },
];

export default function LiveStream() {
  const { id } = useParams();
  const [sessions, setSessions] = useState([]);
  const [active, setActive] = useState(null);
  const [viewers, setViewers] = useState(0);
  const [chat, setChat] = useState([]);
  const [text, setText] = useState("");
  const [bursts, setBursts] = useState([]);
  const [flashDeal, setFlashDeal] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [isMockMode, setIsMockMode] = useState(false);
  const [chatTab, setChatTab] = useState("chat");
  const [liveTime, setLiveTime] = useState(0);
  const chatEndRef = useRef(null);
  const user = useAuthStore((s) => s.user);
  const videoRef = useRef(null);

  // Live timer
  useEffect(() => {
    const h = setInterval(() => setLiveTime((t) => t + 1), 1000);
    return () => clearInterval(h);
  }, []);

  const fmtTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  // Seed mock chat with animation
  useEffect(() => {
    if (!isMockMode) return;
    let i = 0;
    const inject = () => {
      if (i < MOCK_CHAT.length) {
        setChat((c) => [...c.slice(-49), MOCK_CHAT[i++]]);
        setTimeout(inject, 1800 + Math.random() * 2000);
      }
    };
    const t = setTimeout(inject, 1000);
    return () => clearTimeout(t);
  }, [isMockMode]);

  // Mock viewers counter
  useEffect(() => {
    if (!isMockMode) return;
    setViewers(2928);
  }, [isMockMode]);

  useEffect(() => {
    api
      .get("/live/sessions")
      .then(({ data }) => {
        const all = data.sessions || [];
        const live = all.filter((s) => s.status === "live");
        setSessions(all);
        const target = id ? all.find((s) => s._id === id) : live[0];
        if (target) {
          setActive(target);
          setIsMockMode(false);
        } else {
          // No live session — show demo UI
          setSessions(MOCK_SESSIONS);
          setActive(MOCK_SESSION);
          setIsMockMode(true);
        }
      })
      .catch(() => {
        setSessions(MOCK_SESSIONS);
        setActive(MOCK_SESSION);
        setIsMockMode(true);
      });
  }, [id]);

  useEffect(() => {
    if (!active || isMockMode) return;
    const s = getSocket();
    s.emit("live:join", { roomId: active.roomId });
    const onViewer = ({ count }) => setViewers(count);
    const onChat = (msg) => setChat((c) => [...c.slice(-49), msg]);
    const onReaction = () => fireReaction();
    const onFlash = (deal) => {
      setFlashDeal(deal);
      const endsAt = new Date(deal.endsAt).getTime();
      const tick = () => {
        const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
        setCountdown(left);
        if (left <= 0) setFlashDeal(null);
      };
      tick();
      const h = setInterval(tick, 1000);
      return () => clearInterval(h);
    };
    s.on("live:viewerCount", onViewer);
    s.on("live:chat", onChat);
    s.on("live:reaction", onReaction);
    s.on("live:flashDeal", onFlash);
    return () => {
      s.emit("live:leave", { roomId: active.roomId });
      s.off("live:viewerCount", onViewer);
      s.off("live:chat", onChat);
      s.off("live:reaction", onReaction);
      s.off("live:flashDeal", onFlash);
    };
  }, [active, isMockMode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  function fireReaction() {
    const bid = Math.random();
    const Icon = REACTION_ICONS[Math.floor(Math.random() * REACTION_ICONS.length)];
    setBursts((b) => [...b, { id: bid, Icon, left: 20 + Math.random() * 60 }]);
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== bid)), 1800);
  }

  function sendChat(e) {
    e?.preventDefault?.();
    if (!text.trim() || !active) return;
    if (isMockMode) {
      setChat((c) => [...c.slice(-49), { user: user?.name || "You", text: text.trim(), isMe: true }]);
    } else {
      getSocket().emit("live:chat", { roomId: active.roomId, text: text.trim() });
    }
    setText("");
  }

  function sendReaction() {
    fireReaction();
    if (!active || isMockMode) return;
    getSocket().emit("live:reaction", { roomId: active.roomId, emoji: "heart" });
  }

  async function spin() {
    if (!active || !user || isMockMode) return;
    try {
      await api.post(`/live/sessions/${active._id}/spin`);
    } catch {}
  }

  if (!active) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <Spinner />
      </div>
    );
  }

  const stats = active.stats || {};

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
      {/* Hero header — shown in mock/demo mode */}
      {isMockMode && (
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-coral text-white text-[10px] font-jakarta font-bold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE NOW
            </span>
            <span className="inline-flex items-center gap-1.5 bg-mint/20 text-leaf text-[10px] font-jakarta font-bold px-2.5 py-1 rounded-full border border-leaf/20">
              ✓ VERIFIED SELLER
            </span>
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 text-[10px] font-jakarta font-bold px-2.5 py-1 rounded-full border border-amber-200">
              🔥 TRENDING #1
            </span>
          </div>
          <h1 className="font-fraunces text-3xl md:text-4xl text-ink tracking-tight leading-tight mb-2">
            Watch artisans{" "}
            <span className="text-coral italic">create magic</span>,{" "}
            <br className="hidden md:block" />
            shop in real time.
          </h1>
          <p className="text-ink/50 font-jakarta text-sm max-w-md">
            Tune into live drops from neighbourhood sellers across India.
            Ask, react, and grab one-of-a-kind pieces before they're gone.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div>
          {/* Session selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {sessions.map((s) => (
              <button
                key={s._id}
                onClick={() => setActive(s)}
                className={`shrink-0 rounded-xl overflow-hidden border-2 transition ${
                  active._id === s._id
                    ? "border-coral"
                    : "border-transparent hover:border-ink/10"
                }`}
              >
                <div className="relative w-40 h-24 bg-peach/30">
                  {s.coverImage && (
                    <img
                      src={s.coverImage}
                      className="w-full h-full object-cover"
                      alt={s.title}
                    />
                  )}
                  {s.status === "live" && (
                    <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 bg-coral text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-white animate-pulse" /> LIVE
                    </span>
                  )}
                  <div className="absolute bottom-0 inset-x-0 p-1.5 text-white bg-gradient-to-t from-black/70 text-[10px] font-jakarta font-semibold line-clamp-1">
                    {s.title}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ── Video player ────────────────────────────────── */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-ink border border-ink/5 shadow-xl">
            {active.coverImage ? (
              <img
                src={active.coverImage}
                alt={active.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

            {/* Top bar */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
              {/* Left: live badge + timer + host */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-coral text-white text-[9px] font-bold px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                </span>
                <span className="text-white/80 text-[10px] font-jakarta font-semibold bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {fmtTime(liveTime)}
                </span>
                <span className="text-white/80 text-[10px] font-jakarta font-semibold bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  HD
                </span>
              </div>
              {/* Right: viewers + group */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white text-[10px] font-jakarta font-semibold px-2 py-0.5 rounded-full">
                  <HiOutlineFire className="text-coral text-xs" />
                  {(viewers || active.stats?.peakViewers || 0).toLocaleString()}
                </div>
                <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white text-[10px] font-jakarta font-semibold px-2 py-0.5 rounded-full">
                  <HiOutlineUserGroup className="text-mint text-xs" />
                  {active.groupBuy?.participants?.length || 0}/
                  {active.groupBuy?.threshold || 10}
                </div>
              </div>
            </div>

            {/* Host info row */}
            <div className="absolute top-10 left-3 flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-full bg-coral grid place-items-center font-fraunces text-sm font-bold border-2 border-white/30">
                {(active.host?.shopName || active.host?.name || "L")[0]}
              </div>
              <div>
                <div className="font-jakarta font-bold text-xs leading-none">
                  {active.host?.shopName || active.host?.name}
                </div>
                <div className="text-white/60 text-[9px] font-jakarta">
                  Kanchipuram · 4.9★ · 2.1k followers
                </div>
              </div>
              <button className="ml-1 bg-white text-ink text-[9px] font-jakarta font-bold px-2 py-0.5 rounded-full hover:bg-peach transition">
                + Follow
              </button>
            </div>

            {/* Flash deal */}
            <AnimatePresence>
              {(flashDeal || isMockMode) && (
                <motion.div
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -30, opacity: 0 }}
                  className="absolute top-[72px] left-3 right-3 flex items-center gap-2 bg-coral/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl font-jakarta font-bold text-[11px] shadow-lg"
                >
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    <HiOutlineBolt className="text-sm" />
                  </motion.span>
                  FLASH DEAL · 8 MIN LEFT
                  <span className="ml-auto text-white/80 font-normal">
                    10% off everything with code{" "}
                    <span className="font-bold text-white">LIVE10</span>
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom — title + reaction */}
            <div className="absolute bottom-3 inset-x-3 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[9px] uppercase tracking-[0.2em] font-jakarta font-semibold text-white/60 mb-0.5">
                  {active.category || "Live drop"}
                </div>
                <div className="font-fraunces text-xl text-white tracking-tight line-clamp-1">
                  {active.title}
                </div>
              </div>
              <button
                onClick={sendReaction}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur grid place-items-center text-white hover:bg-white/30 transition shrink-0 border border-white/20"
                aria-label="React"
              >
                <HiOutlineHeart className="text-base" />
              </button>
            </div>

            {/* Reaction bursts */}
            {bursts.map((b) => {
              const Icon = b.Icon;
              return (
                <motion.div
                  key={b.id}
                  initial={{ y: 0, opacity: 1, scale: 0.8, x: `${b.left}%` }}
                  animate={{ y: -240, opacity: 0, scale: 1.4 }}
                  transition={{ duration: 1.6, ease: "easeOut" }}
                  className="absolute bottom-10 text-white text-2xl pointer-events-none"
                >
                  <Icon />
                </motion.div>
              );
            })}
          </div>

          {/* Tagged products strip */}
          {active.featuredProducts?.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <HiOutlineTag className="text-ink/40 text-xs" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/40">
                  Tagged in this drop
                </span>
                <span className="text-[10px] font-jakarta text-coral font-bold">
                  {active.featuredProducts.length}
                </span>
                <button className="ml-auto text-[10px] font-jakarta text-coral font-semibold hover:underline">
                  View all →
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {active.featuredProducts.map((p, i) => (
                  <Link
                    key={p._id}
                    to={`/product/${p._id}`}
                    className="shrink-0 rounded-xl bg-white/80 border border-ink/5 p-2 flex items-center gap-2 hover:shadow-md transition min-w-[160px]"
                  >
                    <img
                      src={p.images?.[0]?.url}
                      alt={p.title}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] font-jakarta font-semibold text-ink line-clamp-1">
                        {p.title}
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-fraunces text-xs text-ink tracking-tight">
                          ₹{p.price?.toLocaleString("en-IN")}
                        </span>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <span className="text-[9px] text-ink/30 line-through">
                            ₹{p.originalPrice?.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      {p.stock <= 5 && (
                        <div className="text-[9px] text-coral font-jakarta font-semibold">
                          {p.stock} left
                        </div>
                      )}
                      <button className="mt-1 text-[9px] bg-coral text-white font-jakarta font-bold px-2 py-0.5 rounded-full hover:bg-coral/90 transition">
                        Buy
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={HiOutlineUserGroup}
              value={(viewers || stats.peakViewers || 0).toLocaleString()}
              label="Live viewers"
              color="coral"
            />
            <StatCard
              icon={TbHeartFilled}
              value={stats.heartsSent ? `${(stats.heartsSent / 1000).toFixed(1)}k` : "0"}
              label="Hearts sent"
              color="coral"
            />
            <StatCard
              icon={HiOutlineShoppingBag}
              value={stats.itemsSold || 0}
              label="Items sold"
              color="mint"
            />
            <StatCard
              icon={TbCoin}
              value={`+${stats.coinsEarned || 0}`}
              label="Coins earned"
              color="gold"
            />
          </div>

          {/* Trust badges */}
          <div className="mt-4 grid md:grid-cols-3 gap-3">
            {[
              { icon: "🛡️", title: "Buyer protection", desc: "Secure payment, money back if it doesn't arrive" },
              { icon: "🚚", title: "Local delivery", desc: "Direct from maker, tracked end-to-end" },
              { icon: "↩️", title: "7-day returns", desc: "Easy refunds on defects, no questions asked" },
            ].map((b) => (
              <div key={b.title} className="rounded-2xl bg-white/60 border border-ink/5 p-3 flex items-start gap-3">
                <span className="text-lg">{b.icon}</span>
                <div>
                  <div className="text-xs font-jakarta font-semibold text-ink">{b.title}</div>
                  <div className="text-[10px] font-jakarta text-ink/50 mt-0.5">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* SpinTheWheel */}
          <div className="mt-4">
            <SpinTheWheel onSpun={spin} />
          </div>
        </div>

        {/* ── Chat sidebar ──────────────────────────────────── */}
        <aside className="rounded-2xl bg-white/80 border border-ink/5 flex flex-col min-h-[600px] overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-ink/5">
            {CHAT_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setChatTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-3 text-[10px] font-jakarta font-semibold uppercase tracking-wider transition ${
                  chatTab === tab.id
                    ? "text-coral border-b-2 border-coral"
                    : "text-ink/40 hover:text-ink/60"
                }`}
              >
                {tab.label}
                {tab.count && (
                  <span className="w-4 h-4 rounded-full bg-coral/10 text-coral text-[9px] grid place-items-center">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {chatTab === "chat" && (
            <>
              {/* Featured product in chat */}
              {active.featuredProducts?.[0] && (
                <div className="mx-3 mt-3 rounded-xl bg-peach/30 border border-coral/10 p-2.5 flex items-center gap-2.5">
                  <div className="w-1.5 h-12 rounded-full bg-coral shrink-0" />
                  <img
                    src={active.featuredProducts[0].images?.[0]?.url}
                    alt={active.featuredProducts[0].title}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[8px] uppercase tracking-[0.15em] font-jakarta font-bold text-coral">
                      • Selling Now
                    </div>
                    <div className="text-xs font-jakarta font-semibold text-ink line-clamp-1">
                      {active.featuredProducts[0].title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-fraunces text-sm text-ink">
                        ₹{active.featuredProducts[0].price?.toLocaleString("en-IN")}
                      </span>
                      {active.featuredProducts[0].originalPrice > active.featuredProducts[0].price && (
                        <span className="text-[9px] text-ink/30 line-through">
                          ₹{active.featuredProducts[0].originalPrice?.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="bg-coral text-white text-[9px] font-jakarta font-bold px-2.5 py-1.5 rounded-lg hover:bg-coral/90 transition shrink-0">
                    Buy
                  </button>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-auto px-3 py-3 space-y-2 text-xs">
                {chat.length === 0 && (
                  <p className="text-ink/40 font-jakarta italic text-[11px]">
                    Chat will light up once people join.
                  </p>
                )}
                {chat.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-start gap-2 ${m.flagged ? "text-coral italic" : ""}`}
                  >
                    <div
                      className="w-6 h-6 rounded-full bg-peach shrink-0 grid place-items-center text-[9px] font-bold text-ink mt-0.5"
                      style={{
                        background: `hsl(${(m.user?.charCodeAt(0) || 65) * 5 % 360}, 60%, 85%)`,
                      }}
                    >
                      {(m.user || "V")[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-jakarta font-semibold text-[10px] text-ink">
                          {m.user || "viewer"}
                        </span>
                        {m.bought && (
                          <span className="text-[8px] bg-mint/20 text-leaf font-jakarta font-bold px-1.5 py-0.5 rounded-full">
                            Bought
                          </span>
                        )}
                      </div>
                      <span className="text-ink/70 font-jakarta text-[11px]">{m.text}</span>
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Emoji quick row */}
              <div className="px-3 py-1.5 border-t border-ink/5 flex gap-2 overflow-x-auto">
                {["❤️", "🔥", "😍", "🌸", "✨", "🙏", "😮", "👏"].map((e) => (
                  <button
                    key={e}
                    onClick={() => setText((t) => t + e)}
                    className="text-base hover:scale-125 transition-transform"
                  >
                    {e}
                  </button>
                ))}
              </div>

              {/* Input */}
              <form
                onSubmit={sendChat}
                className="p-2 border-t border-ink/5 flex gap-2"
              >
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Say something nice..."
                  className="flex-1"
                />
                <Button type="submit" size="sm" leftIcon={<HiOutlinePaperAirplane />}>
                  Send
                </Button>
              </form>
            </>
          )}

          {chatTab === "shop" && (
            <div className="flex-1 overflow-auto px-3 py-3 space-y-2">
              {(active.featuredProducts || []).map((p) => (
                <Link
                  key={p._id}
                  to={`/product/${p._id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-peach/30 transition border border-transparent hover:border-coral/10"
                >
                  <img
                    src={p.images?.[0]?.url}
                    alt={p.title}
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-jakarta font-semibold text-ink line-clamp-1">
                      {p.title}
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="font-fraunces text-sm text-ink">
                        ₹{p.price?.toLocaleString("en-IN")}
                      </span>
                      {p.originalPrice > p.price && (
                        <span className="text-[9px] text-ink/30 line-through">
                          ₹{p.originalPrice?.toLocaleString("en-IN")}
                        </span>
                      )}
                      {p.originalPrice > p.price && (
                        <span className="text-[9px] bg-coral/10 text-coral font-bold px-1 rounded">
                          {Math.round((1 - p.price / p.originalPrice) * 100)}% off
                        </span>
                      )}
                    </div>
                    {p.stock <= 5 && (
                      <div className="text-[9px] text-coral font-jakarta font-semibold mt-0.5">
                        Only {p.stock} left!
                      </div>
                    )}
                  </div>
                  <button className="bg-coral text-white text-[9px] font-jakarta font-bold px-2.5 py-1.5 rounded-lg hover:bg-coral/90 transition">
                    Buy
                  </button>
                </Link>
              ))}
            </div>
          )}

          {chatTab === "qa" && (
            <div className="flex-1 overflow-auto px-3 py-3 space-y-3">
              {[
                { q: "Is this pure silk?", a: "Yes! 100% pure Kanchipuram silk with zari border." },
                { q: "Do you ship internationally?", a: "Currently India only, but international launching soon!" },
              ].map((item, i) => (
                <div key={i} className="rounded-xl bg-peach/20 border border-coral/10 p-3">
                  <div className="text-[10px] font-jakarta font-semibold text-ink mb-1">
                    ❓ {item.q}
                  </div>
                  <div className="text-[10px] font-jakarta text-ink/70">
                    ↳ {item.a}
                  </div>
                </div>
              ))}
            </div>
          )}

          {chatTab === "poll" && (
            <div className="flex-1 flex items-center justify-center px-4 text-center">
              <div>
                <div className="text-3xl mb-3">📊</div>
                <div className="font-fraunces text-sm text-ink">No active poll</div>
                <div className="text-[11px] font-jakarta text-ink/40 mt-1">
                  The seller will start one soon
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}