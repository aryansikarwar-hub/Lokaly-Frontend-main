import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineBolt, HiOutlineUserGroup, HiOutlineSparkles,
  HiOutlineHeart, HiOutlineFire, HiOutlineShoppingBag,
  HiOutlinePaperAirplane, HiOutlineClock, HiOutlineTag,
  HiOutlineChartBar, HiOutlineChatBubbleLeftRight,
  HiOutlineShoppingCart, HiOutlineQuestionMarkCircle,
  HiOutlineChevronRight, HiOutlineGift, HiMiniSignal,
  HiOutlineCheckCircle, HiOutlineXCircle,
} from "react-icons/hi2";
import { TbFlame, TbHeartFilled, TbStar, TbCoin } from "react-icons/tb";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { useAuthStore } from "../store/authStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Spinner } from "../components/ui/Spinner";
import SpinTheWheel from "../components/SpinTheWheel";

// ─── Constants ────────────────────────────────────────────────────────────────
const REACTION_ICONS = [TbHeartFilled, TbFlame, TbStar, HiOutlineHeart];
const EMOJIS = ["❤️","🔥","😍","🌸","✨","🙏","😮","👏"];
const CHAT_TABS = [
  { id:"chat", label:"Chat", icon:HiOutlineChatBubbleLeftRight },
  { id:"shop", label:"Shop", icon:HiOutlineShoppingCart },
  { id:"poll", label:"Poll", icon:HiOutlineChartBar },
];

// ─── Mock fallback (shown when no live session exists) ────────────────────────
const MOCK_SESSION = {
  _id:"mock-1", roomId:"mock-room-1",
  title:"Kanchipuram Silk Sarees – Live Drop",
  category:"Handloom & Textiles", status:"live",
  coverImage:"https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&q=80",
  host:{ name:"Lakshmi Weaves", shopName:"Lakshmi Weaves", avatar:null },
  featuredProducts:[
    { _id:"p1", title:"Magenta Kanjivaram", price:4200, originalPrice:6800, stock:3,
      images:[{url:"https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&q=80"}] },
    { _id:"p2", title:"Silver Jhumkas", price:890, originalPrice:1250, stock:12,
      images:[{url:"https://images.unsplash.com/photo-1630019852942-f89202989a59?w=400&q=80"}] },
    { _id:"p3", title:"Pure Silk Dupatta", price:1450, originalPrice:1450, stock:7,
      images:[{url:"https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80"}] },
    { _id:"p4", title:"Mango Achaar 500g", price:320, originalPrice:320, stock:20,
      images:[{url:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80"}] },
  ],
  groupBuy:{ participants:Array(7).fill(null), threshold:10, discountPct:12, unlocked:false },
  polls:[], flashDeals:[],
  stats:{ peakViewers:2928, heartsSent:12400, itemsSold:47, coinsEarned:280 },
  isMock:true,
};
const MOCK_CHAT = [
  { user:"Aditi",  text:"Add to cart NOW!", bought:true },
  { user:"Sanjay", text:"From which loom?" },
  { user:"Rohan",  text:"Beautiful work 🙏" },
  { user:"Nisha",  text:"Cash on delivery? 💚" },
  { user:"Priya",  text:"Is it pure silk?" },
  { user:"Deepak", text:"Can you show the border more?" },
  { user:"Meera",  text:"Shipping to Pune?" },
  { user:"Raj",    text:"Very reasonable price 👍" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (s) =>
  `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const avatarBg = (name="V") =>
  `hsl(${(name.charCodeAt(0)*5)%360},55%,82%)`;
const pctOff = (p,o) => o>p ? Math.round((1-p/o)*100) : 0;

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{y:20,opacity:0,scale:0.95}} animate={{y:0,opacity:1,scale:1}} exit={{y:-10,opacity:0,scale:0.95}}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-xs font-jakarta font-semibold text-white ${t.type==="error"?"bg-red-500":"bg-ink"}`}>
            {t.type==="error"
              ? <HiOutlineXCircle className="text-sm shrink-0"/>
              : <HiOutlineCheckCircle className="text-sm shrink-0"/>}
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({ icon:Icon, value, label, accent }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/75 border border-ink/5">
      <Icon className={`text-lg shrink-0 ${accent}`}/>
      <div>
        <div className="font-fraunces text-sm text-ink leading-none">{value}</div>
        <div className="text-[9px] font-jakarta text-ink/40 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ p, compact, onFlashClaim, activeFlashDeal }) {
  const pct = pctOff(p.price, p.originalPrice);
  const flashForThis = activeFlashDeal?.product === p._id ? activeFlashDeal : null;

  if (compact) return (
    <Link to={`/product/${p.slug||p._id}`}
      className="shrink-0 w-36 rounded-xl bg-white/80 border border-ink/5 p-2 flex flex-col gap-1.5 hover:shadow-md hover:border-coral/20 transition group">
      <div className="relative w-full h-24 rounded-lg overflow-hidden bg-peach/20">
        <img src={p.images?.[0]?.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500"/>
        {pct>0 && <span className="absolute top-1 right-1 bg-coral text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{pct}%</span>}
        {p.stock<=5 && <span className="absolute bottom-1 left-1 bg-black/55 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{p.stock} left</span>}
      </div>
      <div className="text-[10px] font-jakarta font-semibold text-ink line-clamp-1">{p.title}</div>
      <div className="flex items-center justify-between gap-1">
        <span className="font-fraunces text-xs text-ink">₹{p.price?.toLocaleString("en-IN")}</span>
        <button className="text-[8px] bg-coral text-white font-bold px-1.5 py-0.5 rounded-full hover:bg-coral/80 transition">Buy</button>
      </div>
    </Link>
  );

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-peach/25 border border-transparent hover:border-coral/10 transition group">
      <Link to={`/product/${p.slug||p._id}`} className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
        <img src={p.images?.[0]?.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500"/>
        {pct>0 && <span className="absolute top-0.5 right-0.5 bg-coral text-white text-[7px] font-bold px-1 rounded-full">{pct}%</span>}
      </Link>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-jakarta font-semibold text-ink line-clamp-1">{p.title}</div>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="font-fraunces text-sm text-ink">₹{p.price?.toLocaleString("en-IN")}</span>
          {p.originalPrice>p.price && <span className="text-[9px] text-ink/30 line-through">₹{p.originalPrice?.toLocaleString("en-IN")}</span>}
        </div>
        {p.stock<=5 && <div className="text-[9px] text-coral font-semibold">Only {p.stock} left!</div>}
        {flashForThis && (
          <div className="text-[9px] text-white bg-coral font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5">
            ⚡ {flashForThis.discountPct}% FLASH
          </div>
        )}
      </div>
      {flashForThis
        ? <button onClick={()=>onFlashClaim(flashForThis._id)}
            className="bg-coral text-white text-[9px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-coral/80 transition shrink-0">
            Claim
          </button>
        : <Link to={`/product/${p.slug||p._id}`}
            className="bg-coral text-white text-[9px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-coral/80 transition shrink-0">
            Buy
          </Link>
      }
    </div>
  );
}

// ─── Poll Component ───────────────────────────────────────────────────────────
function PollCard({ poll, sessionId, onVoted, isMock }) {
  const [voted, setVoted]   = useState(null);
  const [loading, setLoading] = useState(false);
  const total = poll.options.reduce((s,o) => s+o.votes, 0);

  async function vote(idx) {
    if (voted!==null || isMock) return;
    setLoading(true);
    try {
      await api.post(`/live/sessions/${sessionId}/poll/${poll._id}/vote`, { optionIndex: idx });
      setVoted(idx);
      onVoted?.();
    } catch(e) {
      // already voted or error — just mark locally
      setVoted(idx);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl bg-peach/20 border border-coral/10 p-3">
      <div className="text-[11px] font-jakarta font-semibold text-ink mb-2">{poll.question}</div>
      <div className="space-y-1.5">
        {poll.options.map((opt,i) => {
          const pct = total>0 ? Math.round((opt.votes/total)*100) : 0;
          const isVoted = voted===i;
          return (
            <button key={i} onClick={()=>vote(i)} disabled={voted!==null||loading}
              className={`w-full text-left rounded-lg overflow-hidden border transition ${isVoted?"border-coral":"border-ink/10 hover:border-coral/30"}`}>
              <div className="relative px-3 py-2">
                {voted!==null && (
                  <div className="absolute inset-0 rounded-lg transition-all duration-700"
                    style={{ width:`${pct}%`, background: isVoted?"rgba(255,107,74,0.15)":"rgba(0,0,0,0.04)" }}/>
                )}
                <div className="relative flex items-center justify-between gap-2">
                  <span className="text-[10px] font-jakarta font-semibold text-ink">{opt.text}</span>
                  {voted!==null && <span className="text-[9px] font-bold text-ink/50 shrink-0">{pct}%</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 text-[9px] font-jakarta text-ink/40">{total} votes</div>
    </div>
  );
}

// ─── Spin Result Modal ────────────────────────────────────────────────────────
function SpinResultModal({ prize, onClose }) {
  if (!prize) return null;
  const emoji = prize.type==="coins" ? "🪙" : prize.type==="shipping" ? "🚚" : prize.type==="none" ? "😅" : "🎉";
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{scale:0.85,y:20}} animate={{scale:1,y:0}} exit={{scale:0.85,y:20}}
        className="bg-white rounded-3xl p-8 text-center max-w-xs w-full shadow-2xl"
        onClick={e=>e.stopPropagation()}>
        <div className="text-5xl mb-3">{emoji}</div>
        <div className="font-fraunces text-2xl text-ink mb-1">{prize.label}</div>
        <div className="text-xs font-jakarta text-ink/50 mb-4">
          {prize.type==="none" ? "Better luck next time!" : "Prize credited to your account!"}
        </div>
        <button onClick={onClose}
          className="w-full bg-coral text-white font-jakarta font-bold text-sm py-2.5 rounded-xl hover:bg-coral/80 transition">
          Awesome!
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LiveStream() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const videoRef   = useRef(null);
  const chatEndRef = useRef(null);
  const toastTimer = useRef({});

  // Core state
  const [sessions,    setSessions]    = useState([]);
  const [active,      setActive]      = useState(null);
  const [viewers,     setViewers]     = useState(0);
  const [chat,        setChat]        = useState([]);
  const [text,        setText]        = useState("");
  const [bursts,      setBursts]      = useState([]);
  const [isMock,      setIsMock]      = useState(false);
  const [chatTab,     setChatTab]     = useState("chat");
  const [liveTime,    setLiveTime]    = useState(0);
  const [showSpin,    setShowSpin]    = useState(false);
  const [toasts,      setToasts]      = useState([]);

  // Backend-driven state
  const [flashDeal,   setFlashDeal]   = useState(null);   // live:flashDeal socket event
  const [countdown,   setCountdown]   = useState(null);
  const [polls,       setPolls]       = useState([]);      // from session.polls + live:poll socket
  const [groupBuy,    setGroupBuy]    = useState(null);    // live join response
  const [spinPrize,   setSpinPrize]   = useState(null);   // spin result modal
  const [joiningGrp,  setJoiningGrp]  = useState(false);
  const [claimingFD,  setClaimingFD]  = useState(false);
  const [spinning,    setSpinning]    = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const toast = useCallback((msg, type="success") => {
    const tid = Date.now();
    setToasts(t => [...t, { id:tid, msg, type }]);
    toastTimer.current[tid] = setTimeout(() =>
      setToasts(t => t.filter(x => x.id!==tid)), 3000);
  }, []);

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = setInterval(() => setLiveTime(t => t+1), 1000);
    return () => clearInterval(h);
  }, []);

  // ── Auto-scroll chat ────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [chat]);

  // ── Mock chat injection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMock) return;
    setViewers(2928);
    setGroupBuy(MOCK_SESSION.groupBuy);
    setPolls([]);
    let i = 0;
    const inject = () => {
      if (i < MOCK_CHAT.length) {
        setChat(c => [...c.slice(-49), MOCK_CHAT[i++]]);
        setTimeout(inject, 1400 + Math.random()*2200);
      }
    };
    const t = setTimeout(inject, 800);
    return () => clearTimeout(t);
  }, [isMock]);

  // ── Load sessions (status=all so we see scheduled + live) ──────────────────
  useEffect(() => {
    api.get("/live/sessions?status=all")
      .then(({ data }) => {
        const all  = data.sessions || [];
        const live = all.filter(s => s.status==="live");
        const target = id ? all.find(s=>s._id===id) : live[0];
        if (target) {
          setSessions(all);
          activateSession(target);
          setIsMock(false);
        } else {
          setSessions([MOCK_SESSION]);
          activateSession(MOCK_SESSION);
          setIsMock(true);
        }
      })
      .catch(() => {
        setSessions([MOCK_SESSION]);
        activateSession(MOCK_SESSION);
        setIsMock(true);
      });
  }, [id]); // eslint-disable-line

  function activateSession(s) {
    setActive(s);
    setChat([]);
    setGroupBuy(s.groupBuy || null);
    setPolls(s.polls || []);
    setFlashDeal(null);
    setCountdown(null);
    setLiveTime(0);
  }

  // ── Socket wiring ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active || isMock) return;
    const sock = getSocket();
    sock.emit("live:join", { roomId: active.roomId });

    // viewer count
    const onViewer  = ({ count }) => setViewers(count);

    // chat messages — server sends { user, text, flagged? }
    const onChat    = (msg) => setChat(c => [...c.slice(-49), msg]);

    // reactions — just trigger a visual burst
    const onReact   = () => fireReaction();

    // flash deal — server sends the deal object (has _id, product, discountPct, endsAt)
    const onFlash   = (deal) => {
      setFlashDeal(deal);
      const endsAt = new Date(deal.endsAt).getTime();
      const tick   = () => {
        const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
        setCountdown(left);
        if (left <= 0) setFlashDeal(null);
      };
      tick();
      const h = setInterval(tick, 1000);
      return () => clearInterval(h);
    };

    // poll added by host
    const onPoll    = (poll) => setPolls(p => [...p, poll]);

    // poll votes updated
    const onPollUpd = (poll) =>
      setPolls(p => p.map(x => x._id===poll._id ? poll : x));

    // flash deal claimed by someone
    const onClaimed = ({ dealId, remaining }) => {
      setFlashDeal(d => d?._id===dealId ? { ...d, remaining } : d);
    };

    // group buy unlocked
    const onGrpUnlocked = ({ discountPct }) => {
      setGroupBuy(g => g ? { ...g, unlocked:true, discountPct } : g);
      toast(`🎉 Group buy unlocked! ${discountPct}% off for everyone!`);
    };

    // spin result broadcast (show to the spinner only)
    const onSpin = ({ user: uid, prize }) => {
      if (String(uid) === String(user?._id)) setSpinPrize(prize);
    };

    sock.on("live:viewerCount",     onViewer);
    sock.on("live:chat",            onChat);
    sock.on("live:reaction",        onReact);
    sock.on("live:flashDeal",       onFlash);
    sock.on("live:poll",            onPoll);
    sock.on("live:pollUpdate",      onPollUpd);
    sock.on("live:dealClaimed",     onClaimed);
    sock.on("live:groupBuyUnlocked",onGrpUnlocked);
    sock.on("live:spin",            onSpin);

    return () => {
      sock.emit("live:leave", { roomId: active.roomId });
      sock.off("live:viewerCount",      onViewer);
      sock.off("live:chat",             onChat);
      sock.off("live:reaction",         onReact);
      sock.off("live:flashDeal",        onFlash);
      sock.off("live:poll",             onPoll);
      sock.off("live:pollUpdate",       onPollUpd);
      sock.off("live:dealClaimed",      onClaimed);
      sock.off("live:groupBuyUnlocked", onGrpUnlocked);
      sock.off("live:spin",             onSpin);
    };
  }, [active, isMock, user]); // eslint-disable-line

  // ── Reaction burst ──────────────────────────────────────────────────────────
  const fireReaction = useCallback(() => {
    const bid  = Math.random();
    const Icon = REACTION_ICONS[Math.floor(Math.random()*REACTION_ICONS.length)];
    setBursts(b => [...b, { id:bid, Icon, left:15+Math.random()*70 }]);
    setTimeout(() => setBursts(b => b.filter(x => x.id!==bid)), 1800);
  }, []);

  // ── Send chat ───────────────────────────────────────────────────────────────
  function sendChat(e) {
    e?.preventDefault?.();
    if (!text.trim() || !active) return;
    if (isMock) {
      setChat(c => [...c.slice(-49), { user: user?.name||"You", text:text.trim(), isMe:true }]);
    } else {
      getSocket().emit("live:chat", { roomId:active.roomId, text:text.trim() });
    }
    setText("");
  }

  // ── Send reaction ───────────────────────────────────────────────────────────
  function sendReaction() {
    fireReaction();
    if (!active || isMock) return;
    getSocket().emit("live:reaction", { roomId:active.roomId, emoji:"heart" });
  }

  // ── Spin the wheel → POST /live/sessions/:id/spin ───────────────────────────
  async function handleSpin() {
    if (!active || !user || isMock) {
      toast("Log in to spin!", "error"); return;
    }
    setSpinning(true);
    try {
      const { data } = await api.post(`/live/sessions/${active._id}/spin`);
      // server emits live:spin over socket; we also set prize directly as fallback
      if (data.prize) setSpinPrize(data.prize);
    } catch(err) {
      toast(err?.response?.data?.message || "Couldn't spin right now", "error");
    } finally {
      setSpinning(false);
    }
  }

  // ── Join group buy → POST /live/sessions/:id/group-buy/join ─────────────────
  async function handleJoinGroupBuy() {
    if (!active || !user) { toast("Log in to join group buy", "error"); return; }
    if (isMock) { toast("Joined group buy! (demo)"); return; }
    setJoiningGrp(true);
    try {
      const { data } = await api.post(`/live/sessions/${active._id}/group-buy/join`);
      setGroupBuy(data.groupBuy);
      toast("You joined the group buy! 🎉");
    } catch(err) {
      toast(err?.response?.data?.message || "Couldn't join group buy", "error");
    } finally {
      setJoiningGrp(false);
    }
  }

  // ── Claim flash deal → POST /live/sessions/:id/flash-deal/:dealId/claim ─────
  async function handleFlashClaim(dealId) {
    if (!active || !user) { toast("Log in to claim", "error"); return; }
    if (isMock) { toast("Claimed! (demo)"); return; }
    setClaimingFD(true);
    try {
      await api.post(`/live/sessions/${active._id}/flash-deal/${dealId}/claim`);
      toast("Flash deal claimed! ⚡");
    } catch(err) {
      toast(err?.response?.data?.message || "Couldn't claim deal", "error");
    } finally {
      setClaimingFD(false);
    }
  }

  // ── Refresh polls ────────────────────────────────────────────────────────────
  async function refreshPolls() {
    if (!active || isMock) return;
    try {
      const { data } = await api.get(`/live/sessions/${active._id}`);
      setPolls(data.session?.polls || []);
    } catch {}
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (!active) return (
    <div className="min-h-[60vh] grid place-items-center"><Spinner/></div>
  );

  const stats    = active.stats || {};
  const grpCount = groupBuy?.participants?.length || 0;
  const grpMax   = groupBuy?.threshold || 10;
  const grpPct   = Math.min(100, Math.round((grpCount/grpMax)*100));
  const alreadyInGroup = user && groupBuy?.participants?.some(p => String(p._id||p)===String(user._id));

  // Active flash deal (not expired)
  const activeFlash = flashDeal && new Date(flashDeal.endsAt) > new Date() ? flashDeal : null;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <Toast toasts={toasts}/>

      {/* Spin prize modal */}
      <AnimatePresence>
        {spinPrize && <SpinResultModal prize={spinPrize} onClose={()=>setSpinPrize(null)}/>}
      </AnimatePresence>

      {/* ── Hero strip (mock/no-session mode) ─────────────── */}
      <AnimatePresence>
        {isMock && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="mb-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-coral text-white text-[9px] font-bold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/>LIVE NOW
              </span>
              <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-mint/15 text-leaf border border-leaf/20">✓ VERIFIED SELLER</span>
              <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">🔥 TRENDING #1</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h1 className="font-fraunces text-2xl sm:text-3xl text-ink tracking-tight leading-snug">
                  Watch artisans <span className="text-coral italic">create magic</span>,{" "}
                  <br className="hidden sm:block"/>shop in real time.
                </h1>
                <p className="text-ink/45 font-jakarta text-xs mt-1 max-w-sm">
                  Tune into live drops from neighbourhood sellers across India. Grab one-of-a-kind pieces before they're gone.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="flex items-center gap-1.5 text-xs font-jakarta font-semibold text-ink/60 border border-ink/10 px-3 py-1.5 rounded-full hover:border-ink/30 transition">
                  <HiOutlineClock className="text-sm"/>Schedule
                </button>
                <button className="flex items-center gap-1.5 text-xs font-jakarta font-bold text-white bg-ink px-3 py-1.5 rounded-full hover:bg-ink/80 transition">
                  <HiMiniSignal className="text-sm text-coral"/>Go Live
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Session strip ──────────────────────────────────── */}
      {sessions.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          {sessions.map(s => (
            <button key={s._id}
              onClick={() => { activateSession(s); setIsMock(false); }}
              className={`shrink-0 rounded-xl overflow-hidden border-2 transition-all ${active._id===s._id?"border-coral shadow-md":"border-transparent opacity-65 hover:opacity-100"}`}>
              <div className="relative w-36 h-20 bg-peach/30">
                {s.coverImage && <img src={s.coverImage} className="w-full h-full object-cover" alt={s.title}/>}
                {s.status==="live" && (
                  <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 bg-coral text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                    <span className="w-1 h-1 rounded-full bg-white animate-pulse"/>LIVE
                  </span>
                )}
                {s.status==="scheduled" && (
                  <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 bg-ink/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                    <HiOutlineClock className="text-[8px]"/>SOON
                  </span>
                )}
                <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/70 text-white text-[9px] font-jakarta font-semibold line-clamp-1">{s.title}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Main grid ─────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-4 items-start">

        {/* ════ LEFT COLUMN ════════════════════════════════ */}
        <div className="flex flex-col gap-3 min-w-0">

          {/* ── Video player ──────────────────────────────── */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-ink shadow-xl border border-ink/5">
            {active.coverImage
              ? <img src={active.coverImage} alt={active.title} className="w-full h-full object-cover"/>
              : <video ref={videoRef} className="w-full h-full object-cover" muted playsInline/>
            }
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40"/>

            {/* Top-left: LIVE + timer + HD */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-coral text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/>LIVE
              </span>
              <span className="text-[9px] font-jakarta font-semibold text-white/80 bg-black/35 px-2 py-0.5 rounded-full backdrop-blur-sm">
                {fmtTime(liveTime)}
              </span>
              <span className="text-[9px] font-jakarta font-semibold text-white/80 bg-black/35 px-2 py-0.5 rounded-full backdrop-blur-sm">HD</span>
            </div>

            {/* Top-right: viewers + group */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[10px] font-jakarta font-semibold text-white bg-black/35 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <HiOutlineFire className="text-coral text-xs"/>
                {(viewers||stats.peakViewers||0).toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-jakarta font-semibold text-white bg-black/35 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <HiOutlineUserGroup className="text-mint text-xs"/>{grpCount}/{grpMax}
              </span>
            </div>

            {/* Host row */}
            <div className="absolute top-10 left-3 flex items-center gap-2">
              {active.host?.avatar
                ? <img src={active.host.avatar} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-white/40"/>
                : <div className="w-8 h-8 rounded-full grid place-items-center font-fraunces font-bold text-sm border-2 border-white/40 bg-coral text-white">
                    {(active.host?.shopName||active.host?.name||"L")[0]}
                  </div>
              }
              <div>
                <div className="font-jakarta font-bold text-[11px] text-white leading-none">
                  {active.host?.shopName||active.host?.name}
                  {active.host?.isVerifiedSeller && <span className="ml-1 text-mint">✓</span>}
                </div>
                {active.host?.trustScore && (
                  <div className="text-[9px] text-white/55 font-jakarta">{active.host.trustScore}★ seller</div>
                )}
              </div>
              <button className="text-[9px] bg-white text-ink font-bold px-2 py-0.5 rounded-full hover:bg-peach transition ml-1">
                + Follow
              </button>
            </div>

            {/* Flash deal banner */}
            <AnimatePresence>
              {activeFlash && (
                <motion.div initial={{y:-20,opacity:0}} animate={{y:0,opacity:1}} exit={{y:-20,opacity:0}}
                  className="absolute top-[68px] left-3 right-3 flex items-center gap-2 bg-coral/90 backdrop-blur text-white px-3 py-1.5 rounded-xl text-[10px] font-jakarta font-bold shadow-lg">
                  <motion.span animate={{scale:[1,1.3,1]}} transition={{repeat:Infinity,duration:0.9}}>
                    <HiOutlineBolt className="text-sm"/>
                  </motion.span>
                  FLASH {activeFlash.discountPct}% OFF
                  <span className="font-normal">·</span>
                  <span className="tabular-nums">{countdown}s left</span>
                  {activeFlash.remaining !== undefined && (
                    <span className="font-normal text-white/70 ml-auto">{activeFlash.remaining} claims left</span>
                  )}
                  <button onClick={()=>handleFlashClaim(activeFlash._id)} disabled={claimingFD}
                    className="ml-2 bg-white text-coral text-[8px] font-bold px-2 py-0.5 rounded-full hover:bg-peach transition shrink-0 disabled:opacity-50">
                    {claimingFD ? "..." : "Claim"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom: title + heart */}
            <div className="absolute bottom-3 inset-x-3 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[8px] uppercase tracking-[0.2em] font-jakarta font-semibold text-white/55 mb-0.5">{active.category||"Live drop"}</div>
                <div className="font-fraunces text-lg sm:text-xl text-white tracking-tight line-clamp-1">{active.title}</div>
              </div>
              <button onClick={sendReaction}
                className="w-10 h-10 rounded-full bg-white/15 backdrop-blur border border-white/20 grid place-items-center text-white hover:bg-white/25 transition shrink-0">
                <HiOutlineHeart className="text-base"/>
              </button>
            </div>

            {/* Reaction bursts */}
            {bursts.map(b => {
              const Icon = b.Icon;
              return (
                <motion.div key={b.id} className="absolute bottom-12 text-xl text-white pointer-events-none"
                  initial={{y:0,opacity:1,scale:0.8,x:`${b.left}%`}}
                  animate={{y:-220,opacity:0,scale:1.4}}
                  transition={{duration:1.6,ease:"easeOut"}}>
                  <Icon/>
                </motion.div>
              );
            })}
          </div>

          {/* ── Product strip ──────────────────────────────── */}
          {active.featuredProducts?.length > 0 && (
            <div className="rounded-2xl bg-white/70 border border-ink/5 p-3">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <HiOutlineTag className="text-coral text-xs"/>
                  <span className="text-[9px] uppercase tracking-[0.2em] font-jakarta font-bold text-ink/50">Tagged in this drop</span>
                  <span className="text-[9px] font-bold text-coral bg-coral/10 px-1.5 py-0.5 rounded-full">{active.featuredProducts.length}</span>
                </div>
                <button className="text-[9px] font-jakarta font-semibold text-coral flex items-center gap-0.5 hover:gap-1.5 transition-all">
                  View all <HiOutlineChevronRight className="text-xs"/>
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {active.featuredProducts.map(p =>
                  <ProductCard key={p._id} p={p} compact
                    activeFlashDeal={activeFlash} onFlashClaim={handleFlashClaim}/>
                )}
              </div>
            </div>
          )}

          {/* ── Stats row ──────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatPill icon={HiOutlineUserGroup}  value={(viewers||stats.peakViewers||0).toLocaleString()} label="Live viewers" accent="text-coral"/>
            <StatPill icon={TbHeartFilled}        value={stats.heartsSent?`${(stats.heartsSent/1000).toFixed(1)}k`:"0"} label="Hearts sent"  accent="text-coral"/>
            <StatPill icon={HiOutlineShoppingBag} value={stats.itemsSold||0} label="Items sold"   accent="text-leaf"/>
            <StatPill icon={TbCoin}               value={`+${stats.coinsEarned||0}`} label="Coins earned" accent="text-amber-500"/>
          </div>

          {/* ── Group buy ──────────────────────────────────── */}
          <div className="rounded-2xl bg-white/70 border border-ink/5 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <HiOutlineUserGroup className="text-leaf text-sm"/>
                <span className="text-xs font-jakarta font-semibold text-ink">Group Buy</span>
                {groupBuy?.unlocked
                  ? <span className="text-[9px] bg-leaf text-white font-bold px-1.5 py-0.5 rounded-full">🎉 Unlocked!</span>
                  : <span className="text-[9px] bg-mint/15 text-leaf font-bold px-1.5 py-0.5 rounded-full">{grpCount}/{grpMax} joined</span>
                }
              </div>
              {!groupBuy?.unlocked && !alreadyInGroup && (
                <button onClick={handleJoinGroupBuy} disabled={joiningGrp}
                  className="text-[9px] bg-leaf text-white font-bold px-2.5 py-1 rounded-full hover:bg-leaf/80 transition disabled:opacity-50">
                  {joiningGrp ? "Joining..." : "Join Group Buy"}
                </button>
              )}
              {alreadyInGroup && !groupBuy?.unlocked && (
                <span className="text-[9px] text-leaf font-jakarta font-semibold">✓ You're in!</span>
              )}
              {groupBuy?.unlocked && (
                <span className="text-[9px] font-jakarta font-bold text-leaf">{groupBuy.discountPct}% off unlocked!</span>
              )}
            </div>
            <div className="h-2 rounded-full bg-ink/8 overflow-hidden">
              <motion.div className={`h-full rounded-full ${groupBuy?.unlocked?"bg-leaf":"bg-gradient-to-r from-leaf to-mint"}`}
                initial={{width:0}} animate={{width:`${grpPct}%`}} transition={{duration:1,ease:"easeOut"}}/>
            </div>
            <div className="mt-1.5 text-[9px] font-jakarta text-ink/40">
              {groupBuy?.unlocked
                ? `Everyone gets ${groupBuy.discountPct}% off now!`
                : `${grpMax-grpCount} more buyers needed to unlock group discount`}
            </div>
          </div>

          {/* ── Spin the Wheel ─────────────────────────────── */}
          <div className="rounded-2xl bg-white/70 border border-ink/5 overflow-hidden">
            <button onClick={()=>setShowSpin(v=>!v)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-peach/20 transition">
              <div className="flex items-center gap-2">
                <HiOutlineGift className="text-coral text-base"/>
                <span className="text-xs font-jakarta font-semibold text-ink">Spin the Wheel</span>
                <span className="text-[9px] bg-coral/10 text-coral font-bold px-1.5 py-0.5 rounded-full">Win prizes!</span>
              </div>
              <motion.div animate={{rotate:showSpin?90:0}} transition={{duration:0.2}}>
                <HiOutlineChevronRight className="text-ink/30"/>
              </motion.div>
            </button>
            <AnimatePresence>
              {showSpin && (
                <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                  <div className="p-3 pt-0">
                    <SpinTheWheel onSpun={handleSpin} loading={spinning}/>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Trust badges ───────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {icon:"🛡️",title:"Buyer Protection",desc:"Money back guarantee"},
              {icon:"🚚",title:"Local Delivery",desc:"Direct from maker"},
              {icon:"↩️",title:"7-day Returns",desc:"No questions asked"},
            ].map(b=>(
              <div key={b.title} className="rounded-xl bg-white/60 border border-ink/5 px-3 py-2.5 flex items-start gap-2">
                <span className="text-base leading-none mt-0.5">{b.icon}</span>
                <div>
                  <div className="text-[10px] font-jakarta font-semibold text-ink">{b.title}</div>
                  <div className="text-[9px] font-jakarta text-ink/40 mt-0.5">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ════ RIGHT: Chat sidebar ════════════════════════ */}
        <aside className="rounded-2xl bg-white/80 border border-ink/5 flex flex-col overflow-hidden shadow-sm lg:sticky lg:top-20"
          style={{height:"min(calc(100vh - 96px), 700px)"}}>

          {/* Tabs */}
          <div className="flex border-b border-ink/5 shrink-0">
            {CHAT_TABS.map(tab=>(
              <button key={tab.id} onClick={()=>setChatTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 border-b-2 transition ${chatTab===tab.id?"border-coral text-coral":"border-transparent text-ink/35 hover:text-ink/55"}`}>
                <tab.icon className="text-sm"/>
                <div className="flex items-center gap-0.5">
                  <span className="text-[8px] font-jakarta font-bold uppercase tracking-wider">{tab.label}</span>
                  {tab.id==="poll" && polls.length>0 &&
                    <span className="w-3.5 h-3.5 rounded-full bg-coral text-white text-[7px] grid place-items-center font-bold">{polls.length}</span>}
                  {tab.id==="shop" && active.featuredProducts?.length>0 &&
                    <span className="w-3.5 h-3.5 rounded-full bg-coral text-white text-[7px] grid place-items-center font-bold">{active.featuredProducts.length}</span>}
                </div>
              </button>
            ))}
          </div>

          {/* ── CHAT TAB ──────────────────────────────────── */}
          {chatTab==="chat" && <>
            {/* Featured product pinned */}
            {active.featuredProducts?.[0] && (
              <div className="mx-3 mt-3 shrink-0 rounded-xl bg-gradient-to-r from-peach/60 to-coral/5 border border-coral/15 p-2.5 flex items-center gap-2.5">
                <div className="w-1 h-10 rounded-full bg-coral shrink-0"/>
                <img src={active.featuredProducts[0].images?.[0]?.url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0"/>
                <div className="flex-1 min-w-0">
                  <div className="text-[7px] uppercase tracking-widest font-bold text-coral">• Selling Now</div>
                  <div className="text-[10px] font-jakarta font-semibold text-ink line-clamp-1">{active.featuredProducts[0].title}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-fraunces text-xs text-ink">₹{active.featuredProducts[0].price?.toLocaleString("en-IN")}</span>
                    {active.featuredProducts[0].originalPrice>active.featuredProducts[0].price && (
                      <span className="text-[8px] text-ink/30 line-through">₹{active.featuredProducts[0].originalPrice?.toLocaleString("en-IN")}</span>
                    )}
                  </div>
                </div>
                <Link to={`/product/${active.featuredProducts[0].slug||active.featuredProducts[0]._id}`}
                  className="bg-coral text-white text-[9px] font-bold px-2 py-1.5 rounded-lg hover:bg-coral/80 transition shrink-0">
                  Buy
                </Link>
              </div>
            )}

            <div className="px-3 py-2 shrink-0 flex items-center justify-between border-b border-ink/5">
              <span className="text-[9px] font-jakarta text-ink/40 uppercase tracking-wider flex items-center gap-1">
                <HiOutlineSparkles className="text-coral"/>Live chat
              </span>
              <span className="text-[9px] font-jakarta text-leaf font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-leaf animate-pulse"/>Live
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {chat.length===0 && (
                <p className="text-ink/35 font-jakarta italic text-[10px] pt-2">Chat will light up once people join...</p>
              )}
              {chat.map((m,i)=>(
                <motion.div key={i} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}}
                  className={`flex items-start gap-1.5 ${m.flagged?"opacity-40":""}`}>
                  <div className="w-5 h-5 rounded-full shrink-0 grid place-items-center text-[8px] font-bold text-ink/70 mt-0.5"
                    style={{background:avatarBg(m.user||m.username||"V")}}>
                    {(m.user||m.username||"V")[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={`text-[10px] font-jakarta font-bold leading-none ${m.isMe?"text-coral":"text-ink"}`}>
                        {m.user||m.username||"viewer"}
                      </span>
                      {m.bought && <span className="text-[7px] bg-mint/20 text-leaf font-bold px-1 py-0.5 rounded-full">Bought</span>}
                      {m.flagged && <span className="text-[7px] bg-red-100 text-red-500 font-bold px-1 py-0.5 rounded-full">Flagged</span>}
                    </div>
                    <span className="text-[11px] font-jakarta text-ink/70 break-words">{m.text}</span>
                  </div>
                </motion.div>
              ))}
              <div ref={chatEndRef}/>
            </div>

            <div className="px-3 py-1.5 border-t border-ink/5 flex gap-2 overflow-x-auto shrink-0">
              {EMOJIS.map(e=>(
                <button key={e} onClick={()=>setText(t=>t+e)} className="text-sm hover:scale-125 transition-transform leading-none">{e}</button>
              ))}
            </div>

            <form onSubmit={sendChat} className="p-2 border-t border-ink/5 flex gap-1.5 shrink-0">
              <Input value={text} onChange={e=>setText(e.target.value)} placeholder="Say something nice..."
                className="flex-1 text-xs" disabled={!user&&!isMock}/>
              <Button type="submit" size="sm" leftIcon={<HiOutlinePaperAirplane className="text-xs"/>}
                disabled={!user&&!isMock}>
                Send
              </Button>
            </form>
            {!user && (
              <p className="text-center text-[9px] font-jakarta text-ink/30 pb-2">Log in to chat</p>
            )}
          </>}

          {/* ── SHOP TAB ──────────────────────────────────── */}
          {chatTab==="shop" && (
            <div className="flex-1 overflow-y-auto py-2">
              {active.featuredProducts?.length===0 && (
                <p className="text-center text-[11px] font-jakarta text-ink/40 pt-8">No products tagged yet</p>
              )}
              {(active.featuredProducts||[]).map(p=>
                <ProductCard key={p._id} p={p} compact={false}
                  activeFlashDeal={activeFlash} onFlashClaim={handleFlashClaim}/>
              )}
            </div>
          )}

          {/* ── POLL TAB ──────────────────────────────────── */}
          {chatTab==="poll" && (
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {polls.length===0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
                  <div className="w-12 h-12 rounded-2xl bg-peach/40 grid place-items-center text-2xl">📊</div>
                  <div className="font-fraunces text-base text-ink">No active poll</div>
                  <div className="text-[10px] font-jakarta text-ink/40 max-w-[160px]">The seller will start one soon.</div>
                  <button onClick={refreshPolls}
                    className="text-[9px] font-jakarta text-coral font-semibold hover:underline">
                    Refresh
                  </button>
                </div>
              ) : (
                polls.map(poll =>
                  <PollCard key={poll._id} poll={poll} sessionId={active._id}
                    onVoted={refreshPolls} isMock={isMock}/>
                )
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}