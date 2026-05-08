import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  HiOutlineBolt,
  HiOutlineUserGroup,
  HiOutlineSparkles,
  HiOutlineHeart,
  HiOutlineFire,
  HiOutlineShoppingBag,
  HiOutlinePaperAirplane,
  HiOutlineClock,
  HiOutlineTag,
  HiOutlineChartBar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineShoppingCart,
  HiOutlineQuestionMarkCircle,
  HiOutlineChevronRight,
  HiOutlineGift,
  HiOutlineVideoCamera,
  HiOutlineMicrophone,
  HiOutlineStop,
  HiMiniSignal,
} from "react-icons/hi2";
import { TbFlame, TbHeartFilled, TbStar, TbCoin } from "react-icons/tb";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { useAuthStore } from "../store/authStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Spinner } from "../components/ui/Spinner";
import SpinTheWheel from "../components/SpinTheWheel";
import { createClient, createTracks, APP_ID } from "../services/agora";

// ─── Constants ────────────────────────────────────────────────────────────────
const REACTION_ICONS = [TbHeartFilled, TbFlame, TbStar, HiOutlineHeart];
const EMOJIS = ["❤️", "🔥", "😍", "🌸", "✨", "🙏", "😮", "👏"];
const CHAT_TABS = [
  { id: "chat", label: "Chat", icon: HiOutlineChatBubbleLeftRight },
  { id: "shop", label: "Shop", icon: HiOutlineShoppingCart, count: 4 },
  { id: "qa",   label: "Q&A",  icon: HiOutlineQuestionMarkCircle, count: 2 },
  { id: "poll", label: "Poll", icon: HiOutlineChartBar },
];

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_SESSION = {
  _id: "mock-1", roomId: "mock-room-1",
  title: "Kanchipuram Silk Sarees – Live Drop",
  category: "Handloom & Textiles", status: "live",
  coverImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&q=80",
  host: { name: "Lakshmi Weaves", shopName: "Lakshmi Weaves", avatar: null },
  featuredProducts: [
    { _id: "p1", title: "Magenta Kanjivaram", price: 4200, originalPrice: 6800, stock: 3,
      images: [{ url: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=200&q=80" }] },
    { _id: "p2", title: "Silver Jhumkas", price: 890, originalPrice: 1250, stock: 12,
      images: [{ url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=200&q=80" }] },
    { _id: "p3", title: "Pure Silk Dupatta", price: 1450, originalPrice: 1450, stock: 7,
      images: [{ url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&q=80" }] },
    { _id: "p4", title: "Mango Achaar 500g", price: 320, originalPrice: 320, stock: 20,
      images: [{ url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&q=80" }] },
  ],
  groupBuy: { participants: Array(7).fill(null), threshold: 10 },
  stats: { peakViewers: 2928, heartsSent: 12400, itemsSold: 47, coinsEarned: 280 },
  isMock: true,
};

const MOCK_CHAT = [
  { user: "Aditi",  text: "Add to cart NOW!", bought: true },
  { user: "Sanjay", text: "From which loom?" },
  { user: "Rohan",  text: "Beautiful work 🙏" },
  { user: "Nisha",  text: "Cash on delivery? 💚" },
  { user: "Priya",  text: "Is it pure silk?" },
  { user: "Deepak", text: "Can you show the border more?" },
  { user: "Meera",  text: "Shipping to Pune?" },
  { user: "Raj",    text: "Price is very reasonable 👍" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const avatarBg = (name = "V") => `hsl(${(name.charCodeAt(0) * 5) % 360},55%,82%)`;
const pctOff = (p, o) => (o > p ? Math.round((1 - p / o) * 100) : 0);

// Check if user is a seller (has shopName or role === 'seller')
const isUserSeller = (user) => {
  if (!user) return false;
  return user.role === "seller" || user.isSeller || !!user.shopName;
};

// Check if current user is the host of this session
const isHostOfSession = (user, session) => {
  if (!user || !session?.host) return false;
  const hostId = session.host._id || session.host;
  return String(user._id) === String(hostId);
};

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, value, label, accent }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/75 border border-ink/5">
      <Icon className={`text-lg shrink-0 ${accent}`} />
      <div>
        <div className="font-fraunces text-sm text-ink leading-none">{value}</div>
        <div className="text-[9px] font-jakarta text-ink/40 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

// ─── Product Cards ─────────────────────────────────────────────────────────────
function ProductCard({ p, compact }) {
  const pct = pctOff(p.price, p.originalPrice);
  if (compact) return (
    <Link to={`/product/${p._id}`}
      className="shrink-0 w-36 rounded-xl bg-white/80 border border-ink/5 p-2 flex flex-col gap-1.5 hover:shadow-md hover:border-coral/20 transition group">
      <div className="relative w-full h-24 rounded-lg overflow-hidden bg-peach/20">
        <img src={p.images?.[0]?.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        {pct > 0 && <span className="absolute top-1 right-1 bg-coral text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{pct}%</span>}
        {p.stock <= 5 && <span className="absolute bottom-1 left-1 bg-black/55 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{p.stock} left</span>}
      </div>
      <div className="text-[10px] font-jakarta font-semibold text-ink line-clamp-1">{p.title}</div>
      <div className="flex items-center justify-between gap-1">
        <span className="font-fraunces text-xs text-ink">₹{p.price?.toLocaleString("en-IN")}</span>
        <button className="text-[8px] bg-coral text-white font-bold px-1.5 py-0.5 rounded-full hover:bg-coral/80 transition">Buy</button>
      </div>
    </Link>
  );
  return (
    <Link
      to={`/product/${p._id}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-peach/25 border border-transparent hover:border-coral/10 transition group"
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
        <img src={p.images?.[0]?.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
        {pct > 0 && <span className="absolute top-0.5 right-0.5 bg-coral text-white text-[7px] font-bold px-1 rounded-full">{pct}%</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-jakarta font-semibold text-ink line-clamp-1">{p.title}</div>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="font-fraunces text-sm text-ink">₹{p.price?.toLocaleString("en-IN")}</span>
          {p.originalPrice > p.price && <span className="text-[9px] text-ink/30 line-through">₹{p.originalPrice?.toLocaleString("en-IN")}</span>}
        </div>
        {p.stock <= 5 && <div className="text-[9px] text-coral font-semibold">Only {p.stock} left!</div>}
      </div>
      <button className="bg-coral text-white text-[9px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-coral/80 transition shrink-0">
        Buy
      </button>
    </Link>
  );
}

// ─── Go Live Modal Component ──────────────────────────────────────────────────
function GoLiveModal({ open, onClose, onCreated }) {
  const [step, setStep] = useState("form"); // form | permissions | done
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [permError, setPermError] = useState("");
  const [previewStream, setPreviewStream] = useState(null);
  const previewRef = useRef(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep("form");
      setTitle("");
      setCategory("");
      setLoading(false);
      setPermError("");
      if (previewStream) {
        previewStream.getTracks().forEach((t) => t.stop());
        setPreviewStream(null);
      }
    }
  }, [open]);

  // Attach preview stream to video element
  useEffect(() => {
    if (previewStream && previewRef.current) {
      previewRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  // Cleanup preview stream on unmount
  useEffect(() => {
    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [previewStream]);

  async function requestPermissions(audioOnly = false) {
    setPermError("");
    setLoading(true);
    try {
      // 1) Browser feature check
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw Object.assign(new Error("Your browser does not support camera/mic access. Try Chrome, Edge or Firefox."), { name: "UnsupportedError" });
      }

      // 2) HTTPS check (getUserMedia requires secure context except on localhost)
      if (!window.isSecureContext) {
        throw Object.assign(new Error("Camera/Mic requires HTTPS. Please use the secure (https://) version of the site."), { name: "InsecureContextError" });
      }

      // 3) Enumerate devices to give precise error messages
      // Note: device labels are empty until permission is granted once,
      // but kind/deviceId are visible — enough to know if hardware exists.
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter((d) => d.kind === "videoinput");
      const mics = devices.filter((d) => d.kind === "audioinput");
      console.log("[GoLive] Devices found →", {
        cameras: cams.length,
        microphones: mics.length,
        devices: devices.map((d) => ({ kind: d.kind, label: d.label || "(label hidden)" })),
      });

      const wantVideo = !audioOnly && cams.length > 0;
      const wantAudio = mics.length > 0;

      if (!wantVideo && !wantAudio) {
        throw Object.assign(
          new Error(
            "No camera or microphone detected on this device.\n\n" +
            "Fixes to try:\n" +
            "1. Close apps that may be using the camera (Teams, WhatsApp, Skype, Zoom).\n" +
            "2. Windows → Settings → Privacy & security → Camera → turn ON 'Camera access' AND 'Let desktop apps access your camera'.\n" +
            "3. Same for Microphone.\n" +
            "4. Test hardware at https://webcamtests.com — if it fails there too, the hardware/driver is the issue."
          ),
          { name: "NotFoundError" }
        );
      }

      // 4) Request the stream
      const constraints = {
        video: wantVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: wantAudio,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setPreviewStream(stream);
      setStep("permissions");

      // Non-fatal warning when running audio-only
      if (!wantVideo) {
        setPermError("⚠️ Running in audio-only mode (no camera available). Viewers will hear you but won't see video.");
      }
    } catch (err) {
      console.error("❌ Permission error:", err.name, err.message, err);

      let msg = "";
      switch (err.name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
          msg = "Camera/Microphone access was blocked. Click the 🔒 lock icon in your browser address bar → set Camera & Microphone to 'Allow' → reload the page.";
          break;
        case "NotFoundError":
        case "DevicesNotFoundError":
          msg = err.message;
          break;
        case "NotReadableError":
        case "TrackStartError":
          msg = "Camera/Mic is locked by another app. Close Teams, WhatsApp, Skype, Zoom, OBS, or any video-call app and try again.";
          break;
        case "OverconstrainedError":
          msg = "Your camera doesn't support the requested resolution. Try the 'Audio Only' option as a workaround.";
          break;
        case "SecurityError":
          msg = "Browser blocked the request for security reasons. Make sure you're on https:// and the site has permission.";
          break;
        case "AbortError":
          msg = "Camera/Mic request was interrupted. Please try again.";
          break;
        case "TypeError":
          msg = "Invalid camera/mic configuration. Please refresh the page and try again.";
          break;
        case "InsecureContextError":
        case "UnsupportedError":
          msg = err.message;
          break;
        default:
          msg = "Could not access camera/microphone: " + (err.message || err.name || "Unknown error");
      }
      setPermError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function startSession() {
    if (!title.trim()) return;
    setLoading(true);
    setPermError("");
    try {
      console.log("🔴 Step 1: Creating session...");
      const { data } = await api.post("/live/sessions", { title, category });
      console.log("🔴 Step 2: Session created:", data.session);

      console.log("🔴 Step 3: Starting session...");
      await api.post(`/live/sessions/${data.session._id}/start`);
      console.log("🔴 Step 4: Session started");

      // Stop preview stream — Agora will create its own tracks
      if (previewStream) {
        previewStream.getTracks().forEach((t) => t.stop());
        setPreviewStream(null);
      }

      onCreated(data.session);
    } catch (err) {
      console.error("❌ GoLive error:", err);
      const msg = err.response?.data?.error || err.message || "Failed to start session";
      setPermError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 grid place-items-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-coral/10 grid place-items-center">
              <HiMiniSignal className="text-coral text-base" />
            </div>
            <h2 className="font-fraunces text-lg text-ink">
              {step === "form" ? "Start a Live Session" : "Camera Preview"}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-ink/30 hover:text-ink text-xl w-8 h-8 grid place-items-center rounded-full hover:bg-ink/5 transition disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          {step === "form" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-jakarta font-bold uppercase tracking-wider text-ink/50">
                  Session Title *
                </label>
                <Input
                  placeholder="e.g. Fresh sarees just in!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-jakarta font-bold uppercase tracking-wider text-ink/50">
                  Category
                </label>
                <Input
                  placeholder="e.g. Handloom & Textiles"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Permission notice */}
              <div className="rounded-xl bg-peach/30 border border-coral/15 p-3 flex gap-2.5">
                <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                  <HiOutlineVideoCamera className="text-coral text-sm" />
                  <HiOutlineMicrophone className="text-coral text-sm" />
                </div>
                <div className="text-[10px] font-jakarta text-ink/70 leading-relaxed">
                  We'll need access to your <strong>camera</strong> and{" "}
                  <strong>microphone</strong> to start streaming. Your browser will ask for permission in the next step.
                </div>
              </div>

              {permError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-[11px] font-jakarta text-red-700 whitespace-pre-line leading-relaxed">
                  {permError}
                </div>
              )}

              <Button
                onClick={() => requestPermissions(false)}
                disabled={loading || !title.trim()}
                className="w-full"
              >
                {loading ? (
                  <Spinner />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <HiOutlineVideoCamera className="text-base" />
                    Allow Camera & Mic
                  </span>
                )}
              </Button>

              {/* Fallback: audio-only (useful when no webcam is available) */}
              {permError && (
                <button
                  onClick={() => requestPermissions(true)}
                  disabled={loading || !title.trim()}
                  className="w-full text-[11px] font-jakarta font-semibold text-ink/60 underline decoration-dotted underline-offset-2 hover:text-coral transition disabled:opacity-40"
                >
                  <HiOutlineMicrophone className="inline text-sm mr-1" />
                  Try Audio Only (no camera)
                </button>
              )}
            </>
          )}

          {step === "permissions" && (
            <>
              {/* Live preview */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-ink">
                <video
                  ref={previewRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
                  PREVIEW
                </div>
              </div>

              <div className="rounded-xl bg-mint/10 border border-mint/30 p-3 flex items-center gap-2">
                <span className="text-base">✅</span>
                <div className="text-[11px] font-jakarta text-leaf">
                  Camera and microphone are working. Ready to go live!
                </div>
              </div>

              {permError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-[11px] font-jakarta text-red-700">
                  {permError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (previewStream) {
                      previewStream.getTracks().forEach((t) => t.stop());
                      setPreviewStream(null);
                    }
                    setStep("form");
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-ink/10 text-xs font-jakarta font-semibold text-ink/60 hover:border-ink/30 hover:text-ink transition disabled:opacity-40"
                >
                  Back
                </button>
                <Button onClick={startSession} disabled={loading} className="flex-1">
                  {loading ? (
                    <Spinner />
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      Go Live Now
                    </span>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LiveStream() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const videoRef = useRef(null);
  const clientRef = useRef(null);
  const tracksRef = useRef(null);
  const chatEndRef = useRef(null);

  const [sessions, setSessions] = useState([]);
  const [active, setActive] = useState(null);
  const [viewers, setViewers] = useState(0);
  const [chat, setChat] = useState([]);
  const [text, setText] = useState("");
  const [bursts, setBursts] = useState([]);
  const [flashDeal, setFlashDeal] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [isMock, setIsMock] = useState(false);
  const [chatTab, setChatTab] = useState("chat");
  const [liveTime, setLiveTime] = useState(2972);
  const [showSpin, setShowSpin] = useState(false);
  const [activePoll, setActivePoll] = useState(null);
  const [showGoLive, setShowGoLive] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [endingSession, setEndingSession] = useState(false);

  // Derived: is current user the host of the active session?
  const userIsSeller = isUserSeller(user);
  const userIsHost = active && !isMock && isHostOfSession(user, active);

  async function goLive(session) {
    // Refresh sessions list and switch to the new session
    try {
      const { data } = await api.get("/live/sessions");
      const all = data.sessions || [];
      setSessions(all);
    } catch (e) {
      console.error("Failed to reload sessions", e);
    }
    setActive(session);
    setIsMock(false);
    setShowGoLive(false);
  }

  async function endLive() {
    if (!active || !userIsHost) return;
    if (!window.confirm("End this live session?")) return;
    setEndingSession(true);
    try {
      await api.post(`/live/sessions/${active._id}/end`);
      // Cleanup local Agora state
      if (tracksRef.current) {
        tracksRef.current.forEach((t) => {
          try { t.stop(); t.close(); } catch {}
        });
        tracksRef.current = null;
      }
      if (clientRef.current) {
        try { await clientRef.current.leave(); } catch {}
      }
      // Reset UI to mock state
      setSessions([MOCK_SESSION]);
      setActive(MOCK_SESSION);
      setIsMock(true);
      setIsPublishing(false);
    } catch (err) {
      console.error("Failed to end session", err);
      alert("Failed to end session: " + (err.response?.data?.error || err.message));
    } finally {
      setEndingSession(false);
    }
  }

  // ─── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = setInterval(() => setLiveTime((t) => t + 1), 1000);
    return () => clearInterval(h);
  }, []);

  // ─── Auto-scroll chat ───────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // ─── Mock chat injection ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMock) return;
    setViewers(2928);
    let i = 0;
    const inject = () => {
      if (i < MOCK_CHAT.length) {
        setChat((c) => [...c.slice(-49), MOCK_CHAT[i++]]);
        setTimeout(inject, 1400 + Math.random() * 2200);
      }
    };
    const t = setTimeout(inject, 700);
    return () => clearTimeout(t);
  }, [isMock]);

  // ─── Load sessions ──────────────────────────────────────────────────────────
  useEffect(() => {
    api
      .get("/live/sessions")
      .then(({ data }) => {
        const all = data.sessions || [];
        const live = all.filter((s) => s.status === "live");
        const target = id ? all.find((s) => s._id === id) : live[0];
        if (target) {
          setSessions(all);
          setActive(target);
          setIsMock(false);
        } else {
          setSessions([MOCK_SESSION]);
          setActive(MOCK_SESSION);
          setIsMock(true);
        }
      })
      .catch(() => {
        setSessions([MOCK_SESSION]);
        setActive(MOCK_SESSION);
        setIsMock(true);
      });
  }, [id]);

  // ─── Socket listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!active || isMock) return;
    const s = getSocket();
    s.emit("live:join", { roomId: active.roomId });
    const onViewer = ({ count }) => setViewers(count);
    const onChat   = (msg) => setChat((c) => [...c.slice(-49), msg]);
    const onReact  = () => fireReaction();
    const onFlash  = (deal) => {
      setFlashDeal(deal);
      const end = new Date(deal.endsAt).getTime();
      const tick = () => {
        const l = Math.max(0, Math.round((end - Date.now()) / 1000));
        setCountdown(l);
        if (l <= 0) setFlashDeal(null);
      };
      tick();
      const h = setInterval(tick, 1000);
      return () => clearInterval(h);
    };
    s.on("live:viewerCount", onViewer);
    s.on("live:chat", onChat);
    s.on("live:reaction", onReact);
    s.on("live:flashDeal", onFlash);
    return () => {
      s.emit("live:leave", { roomId: active.roomId });
      s.off("live:viewerCount", onViewer);
      s.off("live:chat", onChat);
      s.off("live:reaction", onReact);
      s.off("live:flashDeal", onFlash);
    };
  }, [active, isMock]);

  // ─── Agora live stream ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!active || isMock) return;
    if (!videoRef.current) return;

    let mounted = true;
    const localClient = createClient();
    clientRef.current = localClient;

    const init = async () => {
      try {
        const isHost = isHostOfSession(user, active);
        // ✅ Agora SDK valid roles: "host" | "audience"
        const agoraRole = isHost ? "host" : "audience";
        // Backend may still expect publisher/subscriber semantics — send both to be safe
        const backendRole = isHost ? "publisher" : "subscriber";

        console.log(`[live] Joining as ${agoraRole}, isHost=${isHost}, user=${user?._id}`);
        await localClient.setClientRole(agoraRole);

        // 🔑 Get token + appID from backend
        // Backend returns { token, uid, appID } — we prefer appID from backend
        // because it's always in sync with the token. Env var is a fallback only.
        const { data } = await api.post("/agora/token", {
          channelName: active.roomId,
          role: backendRole,
        });

        if (!mounted) return;

        // 🛡️ Resolve which APP_ID to use:
        //   1. Prefer the appID returned by the backend (most reliable)
        //   2. Fall back to VITE_AGORA_APP_ID env var
        //   3. If neither exists, abort with a clear error
        const resolvedAppId = data.appID || data.appId || APP_ID;

        if (!resolvedAppId) {
          console.error(
            "❌ Agora APP_ID could not be resolved.\n" +
            "Backend did not return appID in /agora/token response, " +
            "and VITE_AGORA_APP_ID is not set in env. " +
            "Add VITE_AGORA_APP_ID to .env / Vercel → Environment Variables, then redeploy."
          );
          if (isHost) {
            alert("⚠️ Live streaming is not configured. Agora App ID is missing.");
          }
          return;
        }

        console.log(`[live] Using Agora APP_ID: ${resolvedAppId.slice(0, 8)}…`);

        await localClient.join(resolvedAppId, active.roomId, data.token, data.uid || null);
        console.log(`[live] Joined channel: ${active.roomId}`);

        if (agoraRole === "host") {
          try {
            const tracks = await createTracks();
            if (!mounted) {
              tracks.forEach((t) => { t.stop(); t.close(); });
              return;
            }
            tracksRef.current = tracks;
            await localClient.publish(tracks);
            setIsPublishing(true);
            console.log("[live] Publishing local tracks");
            if (videoRef.current) {
              tracks[1].play(videoRef.current);
            }
          } catch (trackErr) {
            console.error("[live] Track creation error:", trackErr);
            if (trackErr.code === "PERMISSION_DENIED" || trackErr.message?.includes("Permission")) {
              alert("Camera/Microphone permission denied. Please allow access and refresh the page.");
            } else if (trackErr.code === "DEVICE_NOT_FOUND" || trackErr.name === "NotFoundError") {
              alert("No camera/microphone found. Check Windows privacy settings and that no other app (Teams, WhatsApp, Skype) is using the camera.");
            } else {
              alert("Failed to access camera/mic: " + (trackErr.message || trackErr.code || "Unknown error"));
            }
          }
        }

        localClient.on("user-published", async (remoteUser, mediaType) => {
          try {
            await localClient.subscribe(remoteUser, mediaType);
            console.log(`[live] Subscribed to ${remoteUser.uid} (${mediaType})`);
            if (mediaType === "video" && videoRef.current && mounted) {
              const existingPlayer = document.getElementById(`remote-${remoteUser.uid}`);
              if (existingPlayer) existingPlayer.remove();
              const player = document.createElement("div");
              player.id = `remote-${remoteUser.uid}`;
              player.style.width = "100%";
              player.style.height = "100%";
              player.style.position = "absolute";
              player.style.top = "0";
              player.style.left = "0";
              videoRef.current.appendChild(player);
              remoteUser.videoTrack.play(player);
            }
            if (mediaType === "audio") {
              remoteUser.audioTrack.play();
            }
          } catch (err) {
            console.error("[live] Subscribe error:", err);
          }
        });

        localClient.on("user-unpublished", (remoteUser, mediaType) => {
          if (mediaType === "video") {
            const player = document.getElementById(`remote-${remoteUser.uid}`);
            if (player) player.remove();
            console.log(`[live] Removed player for ${remoteUser.uid}`);
          }
        });

        localClient.on("user-left", (remoteUser) => {
          const player = document.getElementById(`remote-${remoteUser.uid}`);
          if (player) player.remove();
        });
      } catch (err) {
        console.error("[live] Agora init error:", err);
      }
    };

    init();

    return () => {
      mounted = false;
      console.log("[live] Cleaning up Agora resources");
      setIsPublishing(false);
      if (tracksRef.current) {
        tracksRef.current.forEach((track) => {
          try { track.stop(); track.close(); } catch (e) { /* ignore */ }
        });
        tracksRef.current = null;
      }
      if (localClient) {
        localClient.leave().catch(() => {});
        localClient.removeAllListeners();
      }
      if (videoRef.current) {
        const remotePlayers = videoRef.current.querySelectorAll('[id^="remote-"]');
        remotePlayers.forEach((p) => p.remove());
      }
    };
  }, [active?._id, user?._id, isMock]);

  const fireReaction = useCallback(() => {
    const bid = Math.random();
    const Icon = REACTION_ICONS[Math.floor(Math.random() * REACTION_ICONS.length)];
    setBursts((b) => [...b, { id: bid, Icon, left: 15 + Math.random() * 70 }]);
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== bid)), 1800);
  }, []);

  function sendChat(e) {
    e?.preventDefault?.();
    if (!text.trim() || !active) return;
    if (isMock) {
      setChat((c) => [...c.slice(-49), { user: user?.name || "You", text: text.trim(), isMe: true }]);
    } else {
      getSocket().emit("live:chat", { roomId: active.roomId, text: text.trim() });
    }
    setText("");
  }

  function sendReaction() {
    fireReaction();
    if (!active || isMock) return;
    getSocket().emit("live:reaction", { roomId: active.roomId, emoji: "heart" });
  }

  async function spin() {
    if (!active || !user || isMock) return;
    try {
      await api.post(`/live/sessions/${active._id}/spin`);
    } catch {}
  }

  if (!active) return (
    <div className="min-h-[60vh] grid place-items-center"><Spinner /></div>
  );

  const stats = active.stats || {};
  const grpCount = active.groupBuy?.participants?.length || 0;
  const grpMax = active.groupBuy?.threshold || 10;
  const grpPct = Math.round((grpCount / grpMax) * 100);

  // Should we show the floating "Go Live" button for sellers?
  // Show it when: user is a seller, AND they're not currently hosting a live session
  const showGoLiveFAB = user && userIsSeller && !userIsHost;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">

      {/* Hero header — always visible for sellers */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isMock ? (
              <span className="inline-flex items-center gap-1.5 bg-ink/8 text-ink/60 text-[9px] font-bold px-2.5 py-1 rounded-full">
                EXPLORE LIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-coral text-white text-[9px] font-bold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE NOW
              </span>
            )}
            {userIsHost && (
              <span className="inline-flex items-center gap-1 bg-mint/15 text-leaf text-[9px] font-bold px-2 py-1 rounded-full">
                ★ You're hosting
              </span>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            {!userIsHost && user && userIsSeller && (
              <button
                onClick={() => setShowGoLive(true)}
                className="flex items-center gap-1.5 text-xs font-jakarta font-bold text-white bg-coral px-4 py-2 rounded-full hover:bg-coral/90 transition shadow-md hover:shadow-lg"
              >
                <HiMiniSignal className="text-base" />
                Go Live
              </button>
            )}
            {userIsHost && (
              <button
                onClick={endLive}
                disabled={endingSession}
                className="flex items-center gap-1.5 text-xs font-jakarta font-bold text-white bg-red-500 px-4 py-2 rounded-full hover:bg-red-600 transition shadow-md disabled:opacity-50"
              >
                <HiOutlineStop className="text-base" />
                {endingSession ? "Ending..." : "End Live"}
              </button>
            )}
          </div>
        </div>

        {isMock && (
          <div className="mt-3">
            <h1 className="font-fraunces text-2xl sm:text-3xl text-ink tracking-tight leading-snug">
              Watch artisans <span className="text-coral italic">create magic</span>,{" "}
              <br className="hidden sm:block" />shop in real time.
            </h1>
            <p className="text-ink/45 font-jakarta text-xs mt-1 max-w-sm">
              Tune into live drops from neighbourhood sellers across India.
              Ask, react, and grab one-of-a-kind pieces before they're gone.
            </p>
          </div>
        )}
      </div>

      {/* Session strip */}
      {sessions.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          {sessions.map((s) => (
            <button key={s._id} onClick={() => setActive(s)}
              className={`shrink-0 rounded-xl overflow-hidden border-2 transition-all ${active._id === s._id ? "border-coral shadow-md" : "border-transparent opacity-65 hover:opacity-100"}`}>
              <div className="relative w-36 h-20 bg-peach/30">
                {s.coverImage && <img src={s.coverImage} className="w-full h-full object-cover" alt={s.title} />}
                {s.status === "live" && (
                  <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 bg-coral text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                    <span className="w-1 h-1 rounded-full bg-white animate-pulse" />LIVE
                  </span>
                )}
                <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/70 text-white text-[9px] font-jakarta font-semibold line-clamp-1">
                  {s.title}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Main grid */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-4 items-start">

        {/* ── LEFT ─────────────────────────────────────── */}
        <div className="flex flex-col gap-3 min-w-0">

          {/* Video */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-ink shadow-xl border border-ink/5">
            <div ref={videoRef} className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40 pointer-events-none" />

            {/* Top-left LIVE badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-coral text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE
              </span>
              {userIsHost && isPublishing && (
                <span className="inline-flex items-center gap-1 bg-mint/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                  <HiOutlineVideoCamera className="text-xs" />ON AIR
                </span>
              )}
            </div>

            {/* Top-right stats */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[10px] font-jakarta font-semibold text-white bg-black/35 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <HiOutlineFire className="text-coral text-xs" />{(viewers || stats.peakViewers || 0).toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-jakarta font-semibold text-white bg-black/35 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <HiOutlineUserGroup className="text-mint text-xs" />{grpCount}/{grpMax}
              </span>
            </div>

            {/* Host info */}
            <div className="absolute top-10 left-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full grid place-items-center font-fraunces font-bold text-sm border-2 border-white/40 bg-coral text-white">
                {(active.host?.shopName || active.host?.name || "L")[0]}
              </div>
              <div>
                <div className="font-jakarta font-bold text-[11px] text-white leading-none">{active.host?.shopName || active.host?.name}</div>
                <div className="text-[9px] text-white/55 font-jakarta">4.9★ · 2.1k followers</div>
              </div>
              {!userIsHost && (
                <button className="text-[9px] bg-white text-ink font-bold px-2 py-0.5 rounded-full hover:bg-peach transition ml-1">
                  + Follow
                </button>
              )}
            </div>

            {/* Empty state for non-host before any publisher joins */}
            {!userIsHost && !isMock && (
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="text-center text-white/60">
                  <div className="text-3xl mb-2 opacity-50">📡</div>
                  <div className="text-xs font-jakarta">Waiting for host to start streaming…</div>
                </div>
              </div>
            )}

            {/* Flash deal banner */}
            <AnimatePresence>
              {(flashDeal || isMock) && (
                <motion.div
                  initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                  className="absolute top-[68px] left-3 right-3 flex items-center gap-2 bg-coral/90 backdrop-blur text-white px-3 py-1.5 rounded-xl text-[10px] font-jakarta font-bold shadow-lg"
                >
                  <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}>
                    <HiOutlineBolt className="text-sm" />
                  </motion.span>
                  {flashDeal ? `FLASH DEAL · ${countdown}s LEFT` : "FLASH DEAL · 8 MIN LEFT"}
                  <span className="ml-auto font-normal text-white/80">
                    {flashDeal ? `${flashDeal.discountPct}% off` : "10% off · code "}
                    {!flashDeal && <span className="font-bold text-white">LIVE10</span>}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom: title + reaction */}
            <div className="absolute bottom-3 inset-x-3 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[8px] uppercase tracking-[0.2em] font-jakarta font-semibold text-white/55 mb-0.5">{active.category || "Live drop"}</div>
                <div className="font-fraunces text-lg sm:text-xl text-white tracking-tight line-clamp-1">{active.title}</div>
              </div>
              <button onClick={sendReaction}
                className="w-10 h-10 rounded-full bg-white/15 backdrop-blur border border-white/20 grid place-items-center text-white hover:bg-white/25 transition shrink-0">
                <HiOutlineHeart className="text-base" />
              </button>
            </div>

            {/* Reaction bursts */}
            {bursts.map((b) => {
              const Icon = b.Icon;
              return (
                <motion.div key={b.id}
                  className="absolute bottom-12 text-xl text-white pointer-events-none"
                  initial={{ y: 0, opacity: 1, scale: 0.8, x: `${b.left}%` }}
                  animate={{ y: -220, opacity: 0, scale: 1.4 }}
                  transition={{ duration: 1.6, ease: "easeOut" }}
                >
                  <Icon />
                </motion.div>
              );
            })}
          </div>

          {/* Products strip */}
          {active.featuredProducts?.length > 0 && (
            <div className="rounded-2xl bg-white/70 border border-ink/5 p-3">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <HiOutlineTag className="text-coral text-xs" />
                  <span className="text-[9px] uppercase tracking-[0.2em] font-jakarta font-bold text-ink/50">Tagged in this drop</span>
                  <span className="text-[9px] font-bold text-coral bg-coral/10 px-1.5 py-0.5 rounded-full">{active.featuredProducts.length}</span>
                </div>
                <button className="text-[9px] font-jakarta font-semibold text-coral flex items-center gap-0.5 hover:gap-1.5 transition-all">
                  View all <HiOutlineChevronRight className="text-xs" />
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {active.featuredProducts.map((p) => <ProductCard key={p._id} p={p} compact />)}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatPill icon={HiOutlineUserGroup} value={(viewers || stats.peakViewers || 0).toLocaleString()} label="Live viewers" accent="text-coral" />
            <StatPill icon={TbHeartFilled} value={stats.heartsSent ? `${(stats.heartsSent / 1000).toFixed(1)}k` : "0"} label="Hearts sent" accent="text-coral" />
            <StatPill icon={HiOutlineShoppingBag} value={stats.itemsSold || 0} label="Items sold" accent="text-leaf" />
            <StatPill icon={TbCoin} value={`+${stats.coinsEarned || 0}`} label="Coins earned" accent="text-amber-500" />
          </div>

          {/* Group buy */}
          <div className="rounded-2xl bg-white/70 border border-ink/5 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <HiOutlineUserGroup className="text-leaf text-sm" />
                <span className="text-xs font-jakarta font-semibold text-ink">Group Buy</span>
                <span className="text-[9px] bg-mint/15 text-leaf font-bold px-1.5 py-0.5 rounded-full">{grpCount}/{grpMax} joined</span>
              </div>
              <span className="text-[10px] font-jakarta text-coral font-bold">{grpMax - grpCount} more needed!</span>
            </div>
            <div className="h-2 rounded-full bg-ink/8 overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-leaf to-mint rounded-full"
                initial={{ width: 0 }} animate={{ width: `${grpPct}%` }} transition={{ duration: 1, ease: "easeOut" }} />
            </div>
            <button
              onClick={() => user && api.post(`/live/sessions/${active._id}/group-buy/join`).catch(() => {})}
              className="mt-2 w-full text-[10px] font-jakarta font-semibold text-white bg-leaf rounded-lg py-1.5 hover:bg-leaf/80 transition"
            >
              Join Group Buy
            </button>
          </div>

          {/* Spin the wheel */}
          <div className="rounded-2xl bg-white/70 border border-ink/5 overflow-hidden">
            <button onClick={() => setShowSpin((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-peach/20 transition">
              <div className="flex items-center gap-2">
                <HiOutlineGift className="text-coral text-base" />
                <span className="text-xs font-jakarta font-semibold text-ink">Spin the Wheel</span>
                <span className="text-[9px] bg-coral/10 text-coral font-bold px-1.5 py-0.5 rounded-full">Win prizes!</span>
              </div>
              <motion.div animate={{ rotate: showSpin ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <HiOutlineChevronRight className="text-ink/30" />
              </motion.div>
            </button>
            <AnimatePresence>
              {showSpin && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="p-3 pt-0"><SpinTheWheel onSpun={spin} /></div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: "🛡️", title: "Buyer Protection", desc: "Money back guarantee" },
              { icon: "🚚", title: "Local Delivery", desc: "Direct from maker" },
              { icon: "↩️", title: "7-day Returns", desc: "No questions asked" },
            ].map((b) => (
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

        {/* ── RIGHT: Chat sidebar ───────────────────────── */}
        <aside
          className="rounded-2xl bg-white/80 border border-ink/5 flex flex-col overflow-hidden shadow-sm lg:sticky lg:top-20"
          style={{ height: "min(calc(100vh - 96px), 680px)" }}
        >
          {/* Tabs */}
          <div className="flex border-b border-ink/5 shrink-0">
            {CHAT_TABS.map((tab) => (
              <button key={tab.id} onClick={() => setChatTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 border-b-2 transition ${chatTab === tab.id ? "border-coral text-coral" : "border-transparent text-ink/35 hover:text-ink/55"}`}>
                <tab.icon className="text-sm" />
                <div className="flex items-center gap-0.5">
                  <span className="text-[8px] font-jakarta font-bold uppercase tracking-wider">{tab.label}</span>
                  {tab.count && (
                    <span className="w-3.5 h-3.5 rounded-full bg-coral text-white text-[7px] grid place-items-center font-bold">{tab.count}</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* ── CHAT TAB ── */}
          {chatTab === "chat" && (
            <>
              {/* Currently selling banner */}
              {active.featuredProducts?.[0] && (
                <div className="mx-3 mt-3 shrink-0 rounded-xl bg-gradient-to-r from-peach/60 to-coral/5 border border-coral/15 p-2.5 flex items-center gap-2.5">
                  <div className="w-1 h-10 rounded-full bg-coral shrink-0" />
                  <img
                    src={active.featuredProducts[0].images?.[0]?.url}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[7px] uppercase tracking-widest font-bold text-coral">• Selling Now</div>
                    <div className="text-[10px] font-jakarta font-semibold text-ink line-clamp-1">
                      {active.featuredProducts[0].title}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-fraunces text-xs text-ink">
                        ₹{active.featuredProducts[0].price?.toLocaleString("en-IN")}
                      </span>
                      {active.featuredProducts[0].originalPrice > active.featuredProducts[0].price && (
                        <span className="text-[8px] text-ink/30 line-through">
                          ₹{active.featuredProducts[0].originalPrice?.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="bg-coral text-white text-[9px] font-bold px-2 py-1.5 rounded-lg hover:bg-coral/80 transition shrink-0">
                    Buy
                  </button>
                </div>
              )}

              {/* Chat header */}
              <div className="px-3 py-2 shrink-0 flex items-center justify-between border-b border-ink/5">
                <span className="text-[9px] font-jakarta text-ink/40 uppercase tracking-wider flex items-center gap-1">
                  <HiOutlineSparkles className="text-coral" />Live chat
                </span>
                <span className="text-[9px] font-jakarta text-leaf font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-leaf animate-pulse" />Live
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {chat.length === 0 && (
                  <p className="text-ink/35 font-jakarta italic text-[10px] pt-2">Chat will light up once people join...</p>
                )}
                {chat.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-1.5">
                    <div
                      className="w-5 h-5 rounded-full shrink-0 grid place-items-center text-[8px] font-bold text-ink/70 mt-0.5"
                      style={{ background: avatarBg(m.user) }}
                    >
                      {(m.user || "V")[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={`text-[10px] font-jakarta font-bold leading-none ${m.isMe ? "text-coral" : "text-ink"}`}>
                          {m.user || "viewer"}
                        </span>
                        {m.bought && <span className="text-[7px] bg-mint/20 text-leaf font-bold px-1 py-0.5 rounded-full">Bought</span>}
                      </div>
                      <span className="text-[11px] font-jakarta text-ink/70 break-words">{m.text}</span>
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Emoji bar */}
              <div className="px-3 py-1.5 border-t border-ink/5 flex gap-2 overflow-x-auto shrink-0">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => setText((t) => t + e)} className="text-sm hover:scale-125 transition-transform leading-none">{e}</button>
                ))}
              </div>

              {/* Input */}
              <form onSubmit={sendChat} className="p-2 border-t border-ink/5 flex gap-1.5 shrink-0">
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Say something nice..." className="flex-1 text-xs" />
                <Button type="submit" size="sm" leftIcon={<HiOutlinePaperAirplane className="text-xs" />}>Send</Button>
              </form>
            </>
          )}

          {/* ── SHOP TAB ── */}
          {chatTab === "shop" && (
            <div className="flex-1 overflow-y-auto py-2">
              {(active.featuredProducts || []).map((p) => (
                <ProductCard key={p._id} p={p} compact={false} />
              ))}
            </div>
          )}

          {/* ── Q&A TAB ── */}
          {chatTab === "qa" && (
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {[
                { q: "Is this pure silk?", a: "Yes! 100% pure Kanchipuram silk with zari border." },
                { q: "Do you ship internationally?", a: "Currently India only, international launching soon!" },
              ].map((item, i) => (
                <div key={i} className="rounded-xl bg-peach/20 border border-coral/10 p-3">
                  <div className="text-[10px] font-jakarta font-semibold text-ink mb-1">❓ {item.q}</div>
                  <div className="text-[10px] font-jakarta text-ink/60">↳ {item.a}</div>
                </div>
              ))}
              <button className="w-full rounded-xl border border-dashed border-ink/15 py-2.5 text-[10px] font-jakarta text-ink/40 hover:border-coral/30 hover:text-coral transition">
                + Ask a question
              </button>
            </div>
          )}

          {/* ── POLL TAB ── */}
          {chatTab === "poll" && (
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {!activePoll ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-peach/40 grid place-items-center text-2xl">📊</div>
                  <div className="font-fraunces text-base text-ink">No active poll</div>
                  <div className="text-[10px] font-jakarta text-ink/40 max-w-[160px]">The seller will start one soon. Stay tuned!</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {activePoll.options.map((opt, i) => {
                    const total = activePoll.options.reduce((s, o) => s + o.votes, 0);
                    const pct = total ? Math.round((opt.votes / total) * 100) : 0;
                    return (
                      <button
                        key={i}
                        onClick={() => api.post(`/live/sessions/${active._id}/poll/${activePoll._id}/vote`, { optionIndex: i })}
                        className="w-full text-left rounded-xl border border-ink/10 overflow-hidden hover:border-coral/30 transition"
                      >
                        <div className="px-3 py-2 relative">
                          <div className="absolute inset-0 bg-coral/10 transition-all" style={{ width: `${pct}%` }} />
                          <div className="relative flex justify-between text-[11px] font-jakarta">
                            <span>{opt.text}</span>
                            <span className="text-ink/40">{pct}%</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Floating Go Live FAB for sellers (mobile + always-accessible CTA) */}
      {showGoLiveFAB && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          onClick={() => setShowGoLive(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-coral text-white px-5 py-3.5 rounded-full shadow-2xl hover:bg-coral/90 transition group"
        >
          <span className="relative flex">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-50 animate-ping" />
            <HiMiniSignal className="text-base relative" />
          </span>
          <span className="font-jakarta font-bold text-sm">Go Live</span>
        </motion.button>
      )}

      {/* Go Live Modal */}
      <AnimatePresence>
        <GoLiveModal
          open={showGoLive}
          onClose={() => setShowGoLive(false)}
          onCreated={goLive}
        />
      </AnimatePresence>
    </div>
  );
}