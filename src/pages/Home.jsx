import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  HiOutlineSparkles,
  HiOutlineVideoCamera,
  HiOutlineShoppingBag,
  HiOutlineMapPin,
  HiOutlineShieldCheck,
  HiOutlineChatBubbleLeftRight,
  HiOutlineLanguage,
  HiArrowLongRight,
} from "react-icons/hi2";
import { TbCoins, TbCrystalBall, TbMicrophone } from "react-icons/tb";
import Button from "../components/ui/Button";
import { Magnetic } from "../components/animations/Magnetic";
import { Tilt } from "../components/animations/Tilt";
import { CardStack } from "../components/animations/CardStack";
import { CountUp } from "../components/animations/CountUp";
import { Reveal } from "../components/animations/Reveal";
import NearbySellers from "../features/hyperlocal/NearbySellers";

const FEATURED_SELLERS = [
  {
    name: "Rang Bazaar",
    craft: "Banarasi silk sarees",
    city: "Varanasi",
    tag: "Textiles",
    color: "from-coral to-tangerine",
  },
  {
    name: "Khadi Chowk",
    craft: "Handloom kurtas",
    city: "Lucknow",
    tag: "Apparel",
    color: "from-mint to-leaf",
  },
  {
    name: "Anaar Studio",
    craft: "Blue pottery",
    city: "Jaipur",
    tag: "Ceramics",
    color: "from-lavender to-mauve",
  },
  {
    name: "Dhaaga Collective",
    craft: "Ikkat dupattas",
    city: "Hyderabad",
    tag: "Textiles",
    color: "from-butter to-peach",
  },
  {
    name: "Maati Ghar",
    craft: "Terracotta decor",
    city: "Bastar",
    tag: "Home",
    color: "from-peach to-coral",
  },
];

const FEATURES = [
  {
    icon: HiOutlineVideoCamera,
    color: "bg-coral/10 text-coral",
    title: "Live selling",
    copy: "Flash deals, group-buy unlocks, and spin-the-wheel moments — streamed from the shop floor.",
  },
  {
    icon: HiOutlineShieldCheck,
    color: "bg-mint text-leaf",
    title: "Trust Graph",
    copy: "A six-signal seller score rendered as a visible aura. Buyers know who they are dealing with.",
  },
  {
    icon: TbCoins,
    color: "bg-butter text-tangerine",
    title: "Community Coins",
    copy: "Reviews, answers, and referrals earn coins. Redeemable at checkout across the marketplace.",
  },
  {
    icon: TbCrystalBall,
    color: "bg-lavender text-mauve",
    title: "AI Personal Shopper",
    copy: "Hinglish-native. Queries embed on-device and surface products without cloud round-trips.",
  },
  {
    icon: HiOutlineMapPin,
    color: "bg-peach text-coral",
    title: "Hyperlocal",
    copy: "Artisans within a 10 km radius. Same-day delivery routed through neighbourhood logistics.",
  },
  {
    icon: HiOutlineLanguage,
    color: "bg-mint text-leaf",
    title: "Vernacular first",
    copy: "Browse and transact in 12 Indian languages, with voice shopping for low-literacy buyers.",
  },
];

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const blobY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const headlineY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const headlineOp = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div>
      {/* HERO */}
      <section
        ref={heroRef}
        className="relative overflow-hidden min-h-[84vh] flex items-center"
      >
        <motion.div
          style={{ y: blobY }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-peach/50 rounded-full blur-3xl"
        />
        <motion.div
          style={{ y: blobY }}
          className="absolute -bottom-60 -left-40 w-[500px] h-[500px] bg-lavender/40 rounded-full blur-3xl"
        />

        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-14 md:py-16 grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-14 items-center">
          <motion.div style={{ y: headlineY, opacity: headlineOp }}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 border border-ink/5 text-[10px] font-jakarta font-semibold text-ink/70 tracking-wide uppercase"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
              Social commerce, re-imagined for India
            </motion.div>

            <h1 className="mt-4 font-fraunces text-[2.25rem] md:text-5xl lg:text-[3.75rem] leading-[1.03] text-ink tracking-tight">
              {["Buy", "from", "the", "gully,"].map((w, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.2 + i * 0.06,
                    duration: 0.7,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-block mr-2.5"
                >
                  {w}
                </motion.span>
              ))}
              <br />
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-coral inline-block"
              >
                live from the <span className="italic">heart</span>.
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
             className="mt-5 text-sm md:text-base text-ink/65 dark:text-white/80 font-jakarta max-w-md leading-relaxed"
            >
              A social commerce platform for India&apos;s artisans,
              home-kitchens and neighbourhood shops — built around live video,
              verifiable trust, and community-earned rewards.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              className="mt-6 flex flex-wrap gap-2.5"
            >
              <Magnetic strength={0.25}>
                <Button
                  as={Link}
                  to="/feed"
                  size="md"
                  variant="primary"
                  rightIcon={<HiArrowLongRight />}
                >
                  Explore the feed
                </Button>
              </Magnetic>
              <Magnetic strength={0.25}>
                <Button
                  as={Link}
                  to="/live"
                  size="md"
                  variant="outline"
                  leftIcon={<HiOutlineVideoCamera />}
                >
                  Watch a live drop
                </Button>
              </Magnetic>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.8 }}
              className="mt-10 flex items-center gap-5 md:gap-8"
            >
              <Stat value={1240} suffix="+" label="Artisans onboarded" />
              <div className="w-px h-8 bg-ink/10" />
              <Stat value={52} label="Cities live" />
              <div className="w-px h-8 bg-ink/10" />
              <Stat value={98} suffix="%" label="Avg trust score" />
            </motion.div>
          </motion.div>

          {/* Card stack */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.5,
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <CardStack
                items={FEATURED_SELLERS}
                render={(s) => (
                  <div
                    className={`h-full w-full bg-gradient-to-br ${s.color} p-6 flex flex-col justify-between text-white relative`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[9px] uppercase tracking-[0.2em] opacity-80 font-jakarta font-semibold">
                          Featured seller
                        </div>
                        <h3 className="mt-2.5 font-fraunces text-3xl leading-none">
                          {s.city}
                        </h3>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-jakarta font-semibold px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
                        {s.tag}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[10px] font-jakarta font-semibold uppercase tracking-wider opacity-90">
                          Live now
                        </span>
                      </div>
                      <p className="font-jakarta font-semibold text-lg leading-tight">
                        {s.name}
                      </p>
                      <p className="opacity-80 text-xs font-jakarta mt-0.5">
                        {s.craft}
                      </p>
                      <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[11px] font-jakarta">
                        <span className="opacity-75">Swipe to explore</span>
                        <HiArrowLongRight className="text-base" />
                      </div>
                    </div>
                  </div>
                )}
              />
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-ink/40 text-[9px] font-jakarta uppercase tracking-[0.25em] flex items-center gap-2"
        >
          <span>Scroll</span>
          <motion.span
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-px h-4 bg-ink/40"
          />
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="relative max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="max-w-2xl">
          <Reveal>
            <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-3">
              The platform
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-fraunces text-2xl md:text-4xl text-ink leading-[1.15] tracking-tight">
              Six systems that make neighbourhood commerce feel modern — without
              losing its soul.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-sm text-ink/60 font-jakarta max-w-lg leading-relaxed">
              Built for sellers who do not fit into templated e-commerce. Built
              for buyers who want conversations, provenance, and play.
            </p>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mt-10">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05}>
              <Tilt max={4}>
                <div className="group rounded-2xl bg-white/70 backdrop-blur p-5 border border-ink/5 hover:border-ink/10 transition-all h-full">
                  <div
                    className={`w-9 h-9 rounded-lg grid place-items-center text-base ${f.color}`}
                  >
                    <f.icon />
                  </div>
                  <h3 className="mt-4 font-fraunces text-lg text-ink tracking-tight">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] text-ink/60 font-jakarta leading-relaxed">
                    {f.copy}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-jakarta font-semibold text-ink/40 group-hover:text-coral transition-colors">
                    Learn more <HiArrowLongRight className="text-xs" />
                  </div>
                </div>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Hyperlocal rail */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mb-12">
        <NearbySellers />
      </section>

      {/* How it works */}
      <section className="relative bg-ink text-cream py-16 md:py-24 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-coral/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8">
          <div className="max-w-xl mb-10">
            <Reveal>
              <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-butter mb-3">
                How it works
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="font-fraunces text-2xl md:text-4xl leading-[1.15] tracking-tight">
                Three steps from stranger to regular.
              </h2>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            <Reveal>
              <Step
                n="01"
                icon={HiOutlineShoppingBag}
                title="Discover"
                copy="A feed ranked by karma, not engagement bait. Every product card tells you the seller's trust score upfront."
              />
            </Reveal>
            <Reveal delay={0.08}>
              <Step
                n="02"
                icon={HiOutlineVideoCamera}
                title="Live-shop"
                copy="Join a drop. Ask questions. Unlock group-buy pricing with other buyers. Walk away with a story, not just a parcel."
              />
            </Reveal>
            <Reveal delay={0.16}>
              <Step
                n="03"
                icon={TbCoins}
                title="Earn and redeem"
                copy="Reviews, answers, and referrals compound into Community Coins. Apply them against your next purchase — no expiry games."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Callouts */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="max-w-xl mb-10">
          <Reveal>
            <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-3">
              Built for India
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-fraunces text-2xl md:text-4xl text-ink leading-[1.15] tracking-tight">
              Commerce that meets buyers where they already live.
            </h2>
          </Reveal>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <Reveal>
            <CallOut
              icon={TbMicrophone}
              title="Shop in your voice"
              copy='Speak naturally — "mujhe neeli saree chahiye 1000 ke neeche" — and on-device ML handles transcription and semantic search.'
              to="/voice"
              bg="bg-lavender"
              eyebrow="Voice shopping"
            />
          </Reveal>
          <Reveal delay={0.08}>
            <CallOut
              icon={HiOutlineChatBubbleLeftRight}
              title="Smart FAQ auto-replies"
              copy="Past seller replies embed into a semantic library. Buyer questions route to accurate answers in seconds — not hours."
              to="/messages"
              bg="bg-mint"
              eyebrow="Seller tools"
            />
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, suffix = "", label }) {
  return (
    <div>
      <div className="font-fraunces text-xl md:text-2xl text-ink tracking-tight">
        <CountUp to={value} />
        {suffix}
      </div>
      <div className="text-[9px] md:text-[10px] uppercase tracking-[0.15em] font-jakarta font-semibold text-ink/50 mt-0.5">
        {label}
      </div>
    </div>
  );
}

function Step({ n, icon: Icon, title, copy }) {
  return (
    <div className="border-t border-cream/15 pt-5">
      <div className="flex items-center justify-between mb-5">
        <span className="font-fraunces text-xs text-butter tracking-wider">
          {n}
        </span>
        <div className="w-8 h-8 grid place-items-center rounded-lg bg-cream/10 text-cream text-base border border-cream/10">
          <Icon />
        </div>
      </div>
      <h3 className="font-fraunces text-lg tracking-tight">{title}</h3>
      <p className="mt-2 text-[13px] text-cream/60 font-jakarta leading-relaxed">
        {copy}
      </p>
    </div>
  );
}

function CallOut({ icon: Icon, title, copy, to, bg, eyebrow }) {
  return (
    <Tilt max={4}>
      <Link
        to={to}
        className={`block rounded-2xl p-6 md:p-7 ${bg} relative overflow-hidden group border border-ink/5 h-full`}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="w-9 h-9 grid place-items-center rounded-lg bg-white/40 backdrop-blur text-ink text-base">
            <Icon />
          </div>
          <span className="text-[9px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50">
            {eyebrow}
          </span>
        </div>
        <h3 className="font-fraunces text-lg md:text-xl text-ink tracking-tight">
          {title}
        </h3>
        <p className="mt-2 font-jakarta text-ink/65 text-[13px] leading-relaxed max-w-sm">
          {copy}
        </p>
        <div className="mt-5 inline-flex items-center gap-1.5 text-ink font-jakarta font-semibold text-xs group-hover:gap-2.5 transition-all">
          Try it <HiArrowLongRight className="text-sm" />
        </div>
      </Link>
    </Tilt>
  );
}
