import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  HiStar,
  HiOutlineUserGroup,
  HiOutlineMapPin,
  HiOutlineVideoCamera,
  HiOutlineFunnel,
} from "react-icons/hi2";
import { Avatar } from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import { Reveal } from "../components/animations/Reveal";
import { Tilt } from "../components/animations/Tilt";

const HOSTS = [
  {
    id: 1,
    name: "Aanya Iyer",
    city: "Bengaluru",
    niche: "Handloom & Sarees",
    rating: 4.9,
    streams: 127,
    rate: 1499,
    avatar: "https://i.pravatar.cc/200?u=host1",
    langs: ["HI", "EN", "TA"],
  },
  {
    id: 2,
    name: "Rohan Nair",
    city: "Kochi",
    niche: "Spices & Pickles",
    rating: 4.8,
    streams: 89,
    rate: 1199,
    avatar: "https://i.pravatar.cc/200?u=host2",
    langs: ["EN", "ML"],
  },
  {
    id: 3,
    name: "Priya Sharma",
    city: "Jaipur",
    niche: "Pottery & Ceramics",
    rating: 4.9,
    streams: 156,
    rate: 1699,
    avatar: "https://i.pravatar.cc/200?u=host3",
    langs: ["HI", "EN"],
  },
  {
    id: 4,
    name: "Kavya Reddy",
    city: "Hyderabad",
    niche: "Ethnic Wear",
    rating: 4.7,
    streams: 64,
    rate: 999,
    avatar: "https://i.pravatar.cc/200?u=host4",
    langs: ["TE", "EN", "HI"],
  },
  {
    id: 5,
    name: "Arjun Singh",
    city: "Delhi",
    niche: "Jewellery",
    rating: 4.9,
    streams: 203,
    rate: 1899,
    avatar: "https://i.pravatar.cc/200?u=host5",
    langs: ["HI", "PA", "EN"],
  },
  {
    id: 6,
    name: "Meera Banerjee",
    city: "Kolkata",
    niche: "Madhubani Art",
    rating: 4.8,
    streams: 112,
    rate: 1299,
    avatar: "https://i.pravatar.cc/200?u=host6",
    langs: ["BN", "HI", "EN"],
  },
];

const FILTERS = [
  { key: "All", match: () => true },
  { key: "Sarees", match: (h) => h.niche.includes("Sarees") },
  { key: "Pottery", match: (h) => h.niche.includes("Pottery") },
  { key: "Jewellery", match: (h) => h.niche.includes("Jewellery") },
  { key: "Spices", match: (h) => h.niche.includes("Spices") },
];

export default function CoHosts() {
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter);
    return HOSTS.filter(f?.match || (() => true));
  }, [filter]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <Reveal>
        <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
          Talent marketplace
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-fraunces text-2xl md:text-3xl text-ink tracking-tight flex items-center gap-2">
              <HiOutlineUserGroup className="text-mauve" />
              Co-host marketplace
            </h1>
            <p className="mt-1.5 max-w-xl text-xs text-ink/55 font-jakarta leading-relaxed">
              Hire a vetted co-host for your next live drop. Every co-host
              carries a karma score, language skills, and a transparent
              per-stream rate.
            </p>
          </div>
          <div className="text-[11px] text-ink/50 font-jakarta">
            {filtered.length} of {HOSTS.length} hosts
          </div>
        </div>
      </Reveal>

      {/* Filter chips */}
      <Reveal delay={0.05}>
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <div className="flex items-center gap-1 text-ink/40 shrink-0 pr-1">
            <HiOutlineFunnel className="text-sm" />
            <span className="text-[10px] uppercase tracking-wider font-jakarta font-semibold">
              Filter
            </span>
          </div>
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-jakarta font-semibold transition border ${
                  isActive
                    ? "bg-ink text-cream border-ink"
                    : "bg-white/60 border-ink/5 text-ink/70 hover:border-ink/20"
                }`}
              >
                {f.key}
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* Host grid */}
      <div className="mt-5 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((h, i) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Tilt max={4}>
              <div className="group rounded-2xl bg-white/80 border border-ink/5 p-4 hover:border-ink/15 transition h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <Avatar
                    src={h.avatar}
                    name={h.name}
                    size="md"
                    aura={Math.round(h.rating * 18)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-fraunces text-base text-ink tracking-tight truncate">
                      {h.name}
                    </div>
                    <div className="text-[11px] text-ink/55 font-jakarta flex items-center gap-1 mt-0.5">
                      <HiOutlineMapPin className="text-xs shrink-0" />
                      <span className="truncate">{h.city}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-butter shrink-0">
                    <HiStar className="text-sm fill-butter" />
                    <span className="font-jakarta font-bold text-xs text-ink tabular-nums">
                      {h.rating}
                    </span>
                  </div>
                </div>

                {/* Niche */}
                <div className="mt-3 text-[11px] text-ink/70 font-jakarta font-semibold">
                  {h.niche}
                </div>

                {/* Languages */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {h.langs.map((l) => (
                    <span
                      key={l}
                      className="text-[9px] rounded-full bg-lavender/60 px-1.5 py-0.5 font-jakarta font-bold text-ink tracking-wider"
                    >
                      {l}
                    </span>
                  ))}
                </div>

                {/* Streams metric */}
                <div className="mt-3 pt-3 border-t border-ink/5 flex items-center justify-between text-[10px] text-ink/50 font-jakarta">
                  <span className="tabular-nums">
                    {h.streams} streams hosted
                  </span>
                  <span className="text-leaf flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-leaf animate-pulse" />
                    Available
                  </span>
                </div>

                {/* Rate + CTA */}
                <div className="mt-4 flex items-end justify-between gap-2">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider font-jakarta font-semibold text-ink/45">
                      Per stream
                    </div>
                    <div className="font-fraunces text-lg text-ink tracking-tight mt-0.5 tabular-nums">
                      ₹{h.rate.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <Button size="sm" leftIcon={<HiOutlineVideoCamera />}>
                    Book
                  </Button>
                </div>
              </div>
            </Tilt>
          </motion.div>
        ))}
      </div>

      {/* Empty state when filter yields nothing */}
      {filtered.length === 0 && (
        <div className="mt-8 rounded-2xl bg-white/60 border border-ink/5 p-8 text-center">
          <p className="text-xs text-ink/55 font-jakarta italic">
            No hosts match this filter yet.
          </p>
        </div>
      )}
    </div>
  );
}
