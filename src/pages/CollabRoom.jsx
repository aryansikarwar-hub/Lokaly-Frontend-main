import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineUsers,
  HiOutlinePlay,
  HiOutlineSparkles,
  HiOutlineShoppingBag,
  HiOutlinePaperAirplane,
} from "react-icons/hi2";
import { Reveal } from "../components/animations/Reveal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const SAMPLE_PEERS = [
  { name: "Aanya", city: "Bengaluru", color: "#FF6B6B" },
  { name: "Kavya", city: "Chennai", color: "#FFA94D" },
  { name: "Priya", city: "Jaipur", color: "#51CF66" },
  { name: "Rohan", city: "Kochi", color: "#E4D4F4" },
];

export default function CollabRoom() {
  const { id } = useParams();
  const [msgs, setMsgs] = useState([
    { from: "Aanya", text: "this saree is gorgeous" },
    { from: "Priya", text: "if you pick the lehenga, I will grab the dupatta" },
    { from: "Kavya", text: "group buy unlocks at 10 — lets go" },
  ]);
  const [text, setText] = useState("");
  const [cart] = useState([
    { title: "Banarasi silk saree — red", by: "Aanya", price: 4899 },
    { title: "Kundan choker set", by: "Priya", price: 2299 },
    { title: "Chikankari anarkali", by: "Kavya", price: 2499 },
  ]);

  useEffect(() => {
    const h = setInterval(() => {
      setMsgs((m) =>
        [
          ...m,
          {
            from: SAMPLE_PEERS[Math.floor(Math.random() * SAMPLE_PEERS.length)]
              .name,
            text: pickBackground(),
          },
        ].slice(-30),
      );
    }, 6000);
    return () => clearInterval(h);
  }, []);

  function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setMsgs((m) => [...m, { from: "You", text: text.trim() }]);
    setText("");
  }

  const total = cart.reduce((s, c) => s + c.price, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10 grid lg:grid-cols-[1fr_320px] gap-4">
      <div>
        <Reveal>
          <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
            Group shopping
          </div>
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <h1 className="font-fraunces text-2xl md:text-3xl text-ink tracking-tight flex items-center gap-2">
              <HiOutlineUsers className="text-mauve" />
              Collab room
              <span className="text-ink/40 font-normal">
                #{id || "gully-party"}
              </span>
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mint/60 border border-white text-[10px] font-jakarta font-semibold text-leaf uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-leaf animate-pulse" />
              Synced
            </div>
          </div>
        </Reveal>

        {/* Watch party video */}
        <div className="mt-5 relative rounded-2xl overflow-hidden bg-ink aspect-video grid place-items-center text-white border border-ink/5">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-coral via-tangerine to-lavender opacity-60"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 12, repeat: Infinity }}
          />
          <div className="relative text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-white/20 backdrop-blur grid place-items-center border border-white/30">
              <HiOutlinePlay className="text-2xl" />
            </div>
            <div className="mt-3 font-fraunces text-xl tracking-tight">
              Synced watch party
            </div>
            <div className="text-[11px] opacity-75 font-jakarta mt-1">
              Everyone watches the same stream, in sync
            </div>
          </div>
        </div>

        {/* Peers */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wider font-jakarta font-semibold text-ink/50">
            With you now
          </span>
          <div className="flex -space-x-2">
            {SAMPLE_PEERS.map((p) => (
              <div
                key={p.name}
                title={`${p.name} · ${p.city}`}
                className="w-8 h-8 rounded-full ring-2 ring-cream grid place-items-center font-jakarta font-bold text-white text-xs"
                style={{ background: p.color }}
              >
                {p.name[0]}
              </div>
            ))}
            <div className="w-8 h-8 rounded-full ring-2 ring-cream bg-ink/10 grid place-items-center font-jakarta font-semibold text-ink/60 text-[10px]">
              +2
            </div>
          </div>
        </div>

        {/* Split cart */}
        <section className="mt-5 rounded-2xl bg-white/80 border border-ink/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 mb-1">
                Shared basket
              </div>
              <h4 className="font-fraunces text-base text-ink tracking-tight flex items-center gap-1.5">
                <HiOutlineShoppingBag className="text-coral" />
                Split cart
              </h4>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider font-jakarta font-semibold text-ink/45">
                Total
              </div>
              <div className="font-fraunces text-lg text-ink tracking-tight">
                ₹{total.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          <ul className="divide-y divide-ink/5">
            {cart.map((c, i) => (
              <li key={i} className="flex items-center gap-2 py-2.5">
                <span className="px-2 py-0.5 rounded-full bg-peach font-jakarta font-bold text-[10px] text-ink tracking-wide uppercase shrink-0">
                  {c.by}
                </span>
                <span className="flex-1 text-xs text-ink font-jakarta truncate">
                  {c.title}
                </span>
                <span className="font-fraunces text-sm text-ink tracking-tight shrink-0">
                  ₹{c.price.toLocaleString("en-IN")}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-center justify-between border-t border-ink/5 pt-3">
            <span className="text-[11px] text-ink/50 font-jakarta">
              Everyone pays their share
            </span>
            <Button size="sm" leftIcon={<HiOutlineSparkles />}>
              Checkout together
            </Button>
          </div>
        </section>
      </div>

      {/* Chat sidebar */}
      <aside className="rounded-2xl bg-white/80 border border-ink/5 flex flex-col overflow-hidden min-h-[400px]">
        <div className="px-4 py-3 border-b border-ink/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50">
              Room chat
            </div>
            <h4 className="font-fraunces text-sm text-ink tracking-tight">
              Chat
            </h4>
          </div>
          <span className="text-[10px] text-leaf font-jakarta font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-leaf animate-pulse" />{" "}
            Live
          </span>
        </div>
        <div className="flex-1 overflow-auto px-4 py-3 space-y-1.5 text-xs">
          {msgs.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span
                className={`font-jakarta font-semibold ${
                  m.from === "You" ? "text-coral" : "text-ink"
                }`}
              >
                {m.from}
              </span>
              <span className="text-ink/75 ml-1.5">{m.text}</span>
            </motion.div>
          ))}
        </div>
        <form onSubmit={send} className="p-2 border-t border-ink/5 flex gap-2">
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

function pickBackground() {
  const pool = [
    "has anyone ordered from this seller before",
    "the mango achaar here is legit",
    "pincode 400058 gets same-day delivery",
    "that chikankari is giving wedding vibes",
    "we are 6 short of the group buy unlock",
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}
