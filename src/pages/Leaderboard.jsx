import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineTrophy,
  HiStar,
  HiOutlineMapPin,
  HiOutlineShoppingBag,
} from "react-icons/hi2";
import { TbCrown, TbMedal, TbCoins } from "react-icons/tb";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { Avatar } from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import { Reveal } from "../components/animations/Reveal";
import { Spinner } from "../components/ui/Spinner";
import VerifiedBadge from "../components/VerifiedBadge";

const CITIES = [
  "All",
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Jaipur",
  "Lucknow",
  "Varanasi",
];

const ROLES = [
  { key: "seller", label: "Sellers" },
  { key: "buyer", label: "Buyers" },
];

export default function Leaderboard() {
  const me = useAuthStore((s) => s.user);
  const [rows, setRows] = useState([]);
  const [city, setCity] = useState("All");
  const [role, setRole] = useState("seller");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSyncing(false);
    const params = { limit: 50, role };
    if (city !== "All") params.city = city;

    api
      .get("/leaderboard", { params })
      .then(({ data }) => {
        if (cancelled) return;
        // Pinned contract: array of flat user rows. Also accept {items} or
        // {entries} shapes defensively.
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (Array.isArray(data?.items)) list = data.items;
        else if (Array.isArray(data?.entries)) list = data.entries;
        // Normalise older {userId, meta:{...}} shape into the flat contract.
        list = list.map((r) => ({
          _id: r._id || r.userId,
          name: r.name,
          avatar: r.avatar,
          shopName: r.shopName || r.meta?.shopName,
          role: r.role,
          coins: r.coins ?? r.meta?.coins ?? (r.score ?? 0),
          trustScore: r.trustScore ?? r.meta?.trustScore ?? 0,
          salesCount: r.salesCount ?? r.meta?.salesCount ?? 0,
          reviewCount: r.reviewCount ?? r.meta?.reviewCount ?? 0,
          rating: r.rating ?? r.meta?.rating ?? 0,
          rank: r.rank,
          city: r.city ?? r.meta?.city,
          isVerifiedSeller:
            r.isVerifiedSeller ?? r.meta?.isVerifiedSeller ?? false,
        }));
        setRows(list);
      })
      .catch(async (e) => {
        if (cancelled) return;
        // 404 → backend leaderboard not live yet. Fall back to the old
        // aggregation (/products?sort=rating) so the page still renders.
        if (e.response?.status === 404) {
          setSyncing(true);
          if (role === "seller") {
            try {
              const { data } = await api.get("/products", {
                params: { sort: "rating", limit: 100 },
              });
              const items = data?.items || [];
              const bySeller = new Map();
              for (const p of items) {
                const s = p.seller;
                if (!s?._id) continue;
                if (city !== "All" && s.location?.city !== city) continue;
                const prev = bySeller.get(s._id) || {
                  _id: s._id,
                  name: s.name,
                  avatar: s.avatar,
                  shopName: s.shopName,
                  role: "seller",
                  coins: 0,
                  trustScore: s.trustScore || 0,
                  salesCount: 0,
                  reviewCount: 0,
                  rating: 0,
                  city: s.location?.city,
                  isVerifiedSeller: !!s.isVerifiedSeller,
                  _ratingSum: 0,
                  _ratingN: 0,
                };
                prev.salesCount += p.salesCount || 0;
                if (p.rating) {
                  prev._ratingSum += p.rating;
                  prev._ratingN += 1;
                }
                bySeller.set(s._id, prev);
              }
              const list = Array.from(bySeller.values())
                .map((r) => ({
                  ...r,
                  rating: r._ratingN ? r._ratingSum / r._ratingN : 0,
                }))
                .sort(
                  (a, b) =>
                    (b.trustScore || 0) - (a.trustScore || 0) ||
                    (b.rating || 0) - (a.rating || 0),
                )
                .slice(0, 50)
                .map((r, i) => ({ ...r, rank: i + 1 }));
              if (!cancelled) setRows(list);
            } catch {
              if (!cancelled) setRows([]);
            }
          } else {
            if (!cancelled) setRows([]);
          }
        } else {
          setError("Could not load leaderboard");
          setRows([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [city, role]);

  const ranked = useMemo(
    () =>
      rows.map((r, i) => ({
        ...r,
        rank: r.rank ?? i + 1,
      })),
    [rows],
  );

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const PODIUM_ICON = [TbCrown, TbMedal, HiOutlineTrophy];
  const PODIUM_TONE = ["coral", "peach", "butter"];

  const primaryLabel = role === "seller" ? "Trust" : "Coins";
  const primaryValue = (s) =>
    role === "seller" ? (s.trustScore ?? 0) : (s.coins ?? 0);

  const isMe = (s) => me?._id && String(me._id) === String(s._id);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <Reveal>
        <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
          Weekly local heroes
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-fraunces text-2xl md:text-3xl text-ink dark:text-cream tracking-tight flex items-center gap-2">
              <HiOutlineTrophy className="text-mauve" />
              Karma leaderboard
            </h1>
            <p className="mt-1 text-xs text-ink/55 dark:text-cream/55 font-jakarta">
              {role === "seller"
                ? "Top sellers ranked by trust score and community karma."
                : "Top buyers ranked by coins earned and community impact."}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Role toggle */}
            <div className="inline-flex rounded-full bg-white/80 dark:bg-ink/80 border border-ink/10 dark:border-cream/10 p-0.5">
              {ROLES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRole(r.key)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-jakarta font-semibold transition ${
                    role === r.key
                      ? "bg-ink text-cream dark:bg-coral dark:text-white"
                      : "text-ink/60 dark:text-cream/60 hover:text-ink dark:hover:text-cream"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-full bg-white/80 dark:bg-ink/80 px-3 py-1.5 border border-ink/10 dark:border-cream/10 text-xs font-jakarta font-semibold text-ink dark:text-cream cursor-pointer hover:border-ink/20 dark:hover:border-cream/20 transition"
            >
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </Reveal>

      {syncing && (
        <div className="mt-4 rounded-xl bg-butter/70 dark:bg-butter/20 border border-butter text-ink dark:text-cream px-4 py-2.5 text-[11px] font-jakarta flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-tangerine animate-pulse" />
          Leaderboard syncing… showing best-effort ranks from product ratings.
        </div>
      )}

      {loading ? (
        <div className="mt-10 grid place-items-center">
          <Spinner />
        </div>
      ) : error ? (
        <div className="mt-10 rounded-2xl bg-white/80 dark:bg-ink/80 border border-ink/5 dark:border-cream/10 p-8 text-center">
          <p className="font-jakarta text-sm text-coral">{error}</p>
        </div>
      ) : ranked.length === 0 ? (
        <div className="mt-10 rounded-2xl bg-gradient-to-br from-peach to-butter dark:from-ink/80 dark:to-ink/60 border border-ink/5 dark:border-cream/10 p-10 text-center">
          <div className="text-3xl mb-2">🌟</div>
          <h3 className="font-fraunces text-xl text-ink dark:text-cream tracking-tight">
            No data yet — be the first!
          </h3>
          <p className="mt-1 text-xs text-ink/60 dark:text-cream/60 font-jakarta max-w-sm mx-auto">
            {role === "seller"
              ? "List your first product to start climbing the trust ladder."
              : "Make your first purchase or leave a review to earn coins."}
          </p>
          <Link
            to={role === "seller" ? "/dashboard?tab=products" : "/products"}
            className="inline-flex items-center gap-1.5 mt-4 rounded-full bg-ink text-cream dark:bg-coral dark:text-white font-jakarta font-semibold text-xs px-4 py-2 hover:opacity-90 transition"
          >
            {role === "seller" ? "Add a product" : "Browse products"}
          </Link>
        </div>
      ) : (
        <>
          {/* Podium */}
          <div className="mt-6 grid md:grid-cols-3 gap-3">
            {top3.map((s, i) => {
              const Icon = PODIUM_ICON[i];
              const mine = isMe(s);
              const showVerified =
                !!s.isVerifiedSeller || s.role === "seller";
              return (
                <motion.div
                  key={s._id || i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i }}
                  className={`rounded-2xl p-4 border relative overflow-hidden ${
                    i === 0
                      ? "bg-gradient-to-br from-coral to-tangerine text-white border-ink/5"
                      : i === 1
                        ? "bg-gradient-to-br from-peach to-butter text-ink border-ink/5"
                        : "bg-gradient-to-br from-lavender to-mint text-ink border-ink/5"
                  } ${mine ? "ring-2 ring-offset-2 ring-coral ring-offset-cream dark:ring-offset-ink" : ""}`}
                >
                  <div
                    className={`absolute top-3 left-3 text-[10px] uppercase tracking-[0.2em] font-jakarta font-bold ${
                      i === 0 ? "text-white/80" : "text-ink/60"
                    }`}
                  >
                    Rank {String(s.rank).padStart(2, "0")}
                  </div>

                  <motion.span
                    animate={{ rotate: [0, 6, -4, 0], scale: [1, 1.08, 1] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute top-3 right-3 text-2xl opacity-80"
                  >
                    <Icon />
                  </motion.span>

                  <Link
                    to={`/profile/${s._id}`}
                    className="flex items-center gap-2.5 mt-6"
                  >
                    <Avatar
                      src={s.avatar}
                      name={s.name}
                      size="md"
                      aura={s.trustScore}
                    />
                    <div className="min-w-0">
                      <div className="font-fraunces text-base tracking-tight truncate flex items-center gap-1">
                        <span className="truncate">
                          {s.shopName || s.name}
                        </span>
                        <VerifiedBadge
                          isVerifiedSeller={showVerified}
                          size={14}
                        />
                      </div>
                      <div
                        className={`text-[10px] flex items-center gap-1 mt-0.5 ${
                          i === 0 ? "text-white/80" : "text-ink/60"
                        }`}
                      >
                        <HiOutlineMapPin className="text-xs" />
                        <span className="truncate">{s.city || "India"}</span>
                      </div>
                    </div>
                  </Link>

                  <div className="mt-4 flex items-end gap-5 flex-wrap">
                    <PodiumStat
                      label={primaryLabel}
                      value={primaryValue(s)}
                      big
                      light={i === 0}
                    />
                    {role === "seller" ? (
                      <PodiumStat
                        label="Sales"
                        value={s.salesCount ?? 0}
                        light={i === 0}
                      />
                    ) : (
                      <PodiumStat
                        label="Reviews"
                        value={s.reviewCount ?? 0}
                        light={i === 0}
                      />
                    )}
                    {typeof s.rating === "number" && s.rating > 0 && (
                      <PodiumStat
                        label="Rating"
                        value={Number(s.rating).toFixed(1)}
                        light={i === 0}
                      />
                    )}
                  </div>

                  <Badge tone={PODIUM_TONE[i]} className="mt-3">
                    {mine ? "That's you!" : "Local hero this week"}
                  </Badge>
                </motion.div>
              );
            })}
          </div>

          {/* Rest of the leaderboard */}
          {rest.length > 0 && (
            <section className="mt-6 rounded-2xl bg-white/80 dark:bg-ink/80 border border-ink/5 dark:border-cream/10 divide-y divide-ink/5 dark:divide-cream/10 overflow-hidden">
              <div className="px-4 py-2.5 bg-cream/40 dark:bg-white/5">
                <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 dark:text-cream/50">
                  {role === "seller" ? "Rising sellers" : "Rising buyers"}
                </div>
              </div>
              {rest.map((s, i) => {
                const mine = isMe(s);
                const showVerified =
                  !!s.isVerifiedSeller || s.role === "seller";
                return (
                  <motion.div
                    key={s._id || i}
                    initial={{ opacity: 0, x: -6 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: i * 0.02 }}
                    className={`px-4 py-2.5 flex items-center gap-3 transition ${
                      mine
                        ? "bg-coral/10 dark:bg-coral/15 ring-1 ring-inset ring-coral/40"
                        : "hover:bg-peach/20 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="w-7 text-ink/45 dark:text-cream/45 font-fraunces text-sm tracking-tight shrink-0 tabular-nums">
                      {String(s.rank).padStart(2, "0")}
                    </span>
                    <Avatar
                      src={s.avatar}
                      name={s.name}
                      size="xs"
                      aura={s.trustScore}
                    />
                    <Link to={`/profile/${s._id}`} className="flex-1 min-w-0">
                      <div className="font-jakarta font-semibold text-xs text-ink dark:text-cream flex items-center gap-1 truncate">
                        <span className="truncate">
                          {s.shopName || s.name}
                        </span>
                        <VerifiedBadge
                          isVerifiedSeller={showVerified}
                          size={12}
                        />
                        {mine && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-coral text-white font-bold ml-1">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-ink/50 dark:text-cream/50 mt-0.5">
                        {s.city || "India"}
                      </div>
                    </Link>
                    <div className="flex items-center gap-4 text-[11px] font-jakarta">
                      <div className="text-right">
                        <div className="text-[9px] uppercase tracking-wider text-ink/45 dark:text-cream/45 flex items-center gap-0.5 justify-end">
                          {role === "buyer" && (
                            <TbCoins className="text-[10px]" />
                          )}
                          {primaryLabel}
                        </div>
                        <div className="font-fraunces text-sm text-ink dark:text-cream tracking-tight tabular-nums">
                          {primaryValue(s)}
                        </div>
                      </div>
                      {role === "seller" ? (
                        <div className="text-right hidden sm:block">
                          <div className="text-[9px] uppercase tracking-wider text-ink/45 dark:text-cream/45 flex items-center gap-0.5 justify-end">
                            <HiOutlineShoppingBag className="text-[10px]" />
                            Sales
                          </div>
                          <div className="font-fraunces text-sm text-ink dark:text-cream tracking-tight tabular-nums">
                            {s.salesCount ?? 0}
                          </div>
                        </div>
                      ) : (
                        <div className="text-right hidden sm:block">
                          <div className="text-[9px] uppercase tracking-wider text-ink/45 dark:text-cream/45">
                            Reviews
                          </div>
                          <div className="font-fraunces text-sm text-ink dark:text-cream tracking-tight tabular-nums">
                            {s.reviewCount ?? 0}
                          </div>
                        </div>
                      )}
                      {typeof s.rating === "number" && s.rating > 0 && (
                        <div className="flex items-center gap-0.5 text-butter">
                          <HiStar className="text-sm fill-butter" />
                          <span className="font-fraunces text-xs text-ink dark:text-cream tracking-tight tabular-nums">
                            {Number(s.rating).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function PodiumStat({ label, value, big, light }) {
  return (
    <div>
      <div
        className={`text-[9px] uppercase tracking-[0.2em] font-jakarta font-semibold ${
          light ? "text-white/70" : "text-ink/55"
        }`}
      >
        {label}
      </div>
      <div
        className={`font-fraunces ${big ? "text-2xl" : "text-xl"} tracking-tight mt-0.5 tabular-nums`}
      >
        {value}
      </div>
    </div>
  );
}
