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
} from "react-icons/hi2";
import { TbFlame, TbHeartFilled, TbStar } from "react-icons/tb";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { useAuthStore } from "../store/authStore";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Avatar } from "../components/ui/Avatar";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import SpinTheWheel from "../components/SpinTheWheel";

const REACTION_ICONS = [TbHeartFilled, TbFlame, TbStar, HiOutlineHeart];

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
  const user = useAuthStore((s) => s.user);
  const videoRef = useRef(null);

  useEffect(() => {
    api.get("/live/sessions").then(({ data }) => {
      const live = (data.sessions || []).filter((s) => s.status === "live");
      setSessions(data.sessions || []);
      const target = id
        ? (data.sessions || []).find((s) => s._id === id)
        : live[0];
      if (target) setActive(target);
    });
  }, [id]);

  useEffect(() => {
    if (!active) return;
    const s = getSocket();
    s.emit("live:join", { roomId: active.roomId });
    const onViewer = ({ count }) => setViewers(count);
    const onChat = (msg) => setChat((c) => [...c.slice(-49), msg]);
    const onReaction = () => {
      const id = Math.random();
      const Icon =
        REACTION_ICONS[Math.floor(Math.random() * REACTION_ICONS.length)];
      setBursts((b) => [...b, { id, Icon, left: 20 + Math.random() * 60 }]);
      setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1800);
    };
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
  }, [active]);

  function sendChat(e) {
    e?.preventDefault?.();
    if (!text.trim() || !active) return;
    getSocket().emit("live:chat", { roomId: active.roomId, text: text.trim() });
    setText("");
  }

  function sendReaction() {
    if (!active) return;
    getSocket().emit("live:reaction", {
      roomId: active.roomId,
      emoji: "heart",
    });
  }

  async function spin() {
    if (!active || !user) return;
    try {
      await api.post(`/live/sessions/${active._id}/spin`);
    } catch {
      /* ignore */
    }
  }

  if (sessions.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16">
        <EmptyState
          title="No live drops right now"
          hint="Scheduled drops will appear here when they start"
          icon={<HiOutlineVideoCamera />}
        />
      </div>
    );
  }

  if (!active)
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <Spinner />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 grid lg:grid-cols-[1fr_300px] gap-4">
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
                    <span className="w-1 h-1 rounded-full bg-white animate-pulse" />{" "}
                    LIVE
                  </span>
                )}
                <div className="absolute bottom-0 inset-x-0 p-1.5 text-white bg-gradient-to-t from-black/70 text-[10px] font-jakarta font-semibold line-clamp-1">
                  {s.title}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Video */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-ink border border-ink/5">
          {active.coverImage ? (
            <img
              src={active.coverImage}
              alt={active.title}
              className="w-full h-full object-cover blur-[1px]"
            />
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

          {/* Top left — host info */}
          <div className="absolute top-3 left-3 flex items-center gap-2 text-white">
            <Avatar
              src={active.host?.avatar}
              name={active.host?.name}
              size="xs"
            />
            <span className="font-jakarta font-semibold text-xs">
              {active.host?.shopName || active.host?.name}
            </span>
            <Badge tone="coral">
              <HiOutlineFire className="text-xs" />{" "}
              {viewers || active.stats?.peakViewers || 0}
            </Badge>
          </div>

          {/* Top right — group buy */}
          <div className="absolute top-3 right-3">
            <Badge tone="mint">
              <HiOutlineUserGroup className="text-xs" />{" "}
              {active.groupBuy?.participants?.length || 0}/
              {active.groupBuy?.threshold || 10}
            </Badge>
          </div>

          {/* Flash deal */}
          <AnimatePresence>
            {flashDeal && (
              <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                className="absolute top-14 left-1/2 -translate-x-1/2 rounded-full bg-coral text-white px-4 py-1.5 flex items-center gap-2 font-jakarta font-bold text-xs shadow-lg"
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <HiOutlineBolt className="text-sm" />
                </motion.span>
                FLASH {flashDeal.discountPct}% OFF — {countdown}s
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom — title + reaction */}
          <div className="absolute bottom-3 inset-x-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-white/70 mb-1">
                {active.category || "Live drop"}
              </div>
              <div className="font-fraunces text-lg text-white tracking-tight line-clamp-1">
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
                animate={{ y: -240, opacity: 0, scale: 1.2 }}
                transition={{ duration: 1.6, ease: "easeOut" }}
                className="absolute bottom-10 text-white text-2xl pointer-events-none"
              >
                <Icon />
              </motion.div>
            );
          })}
        </div>

        {/* Below the video */}
        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/80 p-4 border border-ink/5">
            <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 mb-1">
              Showcased
            </div>
            <h4 className="font-fraunces text-base text-ink tracking-tight mb-2">
              Featured products
            </h4>
            <div className="space-y-1.5">
              {(active.featuredProducts || []).slice(0, 4).map((p) => (
                <Link
                  key={p._id}
                  to={`/product/${p._id}`}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-peach/40 transition"
                >
                  <img
                    src={p.images?.[0]?.url}
                    alt={p.title}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-jakarta font-semibold text-ink line-clamp-1">
                      {p.title}
                    </div>
                    <div className="font-fraunces text-xs text-ink/70 tracking-tight">
                      ₹{p.price?.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <HiOutlineShoppingBag className="text-coral text-sm shrink-0" />
                </Link>
              ))}
            </div>
          </div>
          <SpinTheWheel onSpun={spin} />
        </div>
      </div>

      {/* Chat sidebar */}
      <aside className="rounded-2xl bg-white/80 border border-ink/5 flex flex-col min-h-[500px] overflow-hidden">
        <div className="px-4 py-3 border-b border-ink/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50">
              Crowd
            </div>
            <h4 className="font-fraunces text-sm text-ink tracking-tight flex items-center gap-1.5">
              <HiOutlineSparkles className="text-coral" /> Live chat
            </h4>
          </div>
          <span className="text-[10px] text-leaf font-jakarta font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-leaf animate-pulse" />{" "}
            Live
          </span>
        </div>
        <div className="flex-1 overflow-auto px-4 py-3 space-y-1.5 text-xs">
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
              className={m.flagged ? "text-coral italic" : "text-ink/85"}
            >
              <span className="font-jakarta font-semibold text-ink">
                viewer
              </span>
              <span className="ml-1.5">{m.text}</span>
            </motion.div>
          ))}
        </div>
        <form
          onSubmit={sendChat}
          className="p-2 border-t border-ink/5 flex gap-2"
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Say something..."
            className="flex-1"
          />
          <Button type="submit" size="sm" leftIcon={<HiOutlinePaperAirplane />}>
            Send
          </Button>
        </form>
      </aside>
    </div>
  );
}
