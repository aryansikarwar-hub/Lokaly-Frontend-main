import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TbCoins } from "react-icons/tb";
import {
  HiOutlineArrowUpRight,
  HiOutlineArrowDownLeft,
  HiOutlineClipboardDocumentList,
} from "react-icons/hi2";
import dayjs from "dayjs";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { Reveal } from "../components/animations/Reveal";
import { CountUp } from "../components/animations/CountUp";
import { EmptyState } from "../components/ui/EmptyState";

const REASON_LABELS = {
  review: "Review reward",
  helpful_answer: "Helpful answer",
  live_spin: "Live wheel prize",
  live_game: "Live game reward",
  order_reward: "Order cashback",
  referral_bonus: "Referral milestone",
  equity_cashback: "Equity cashback",
  order_redeem: "Redeemed at checkout",
  admin_adjust: "Admin adjustment",
};

export default function Coins() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState([]);
  const [balance, setBalance] = useState(user?.coins || 0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/coins/ledger")
      .then(({ data }) => {
        setItems(data.items || []);
        setBalance(data.balance);
      })
      .catch(() => {
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const earned = items
    .filter((i) => i.delta > 0)
    .reduce((s, i) => s + i.delta, 0);
  const redeemed = items
    .filter((i) => i.delta < 0)
    .reduce((s, i) => s + Math.abs(i.delta), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <Reveal>
        <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
          Rewards wallet
        </div>
        <h1 className="font-fraunces text-2xl md:text-3xl text-ink dark:text-cream tracking-tight mb-6">
          Community Coins
        </h1>

        {/* Balance card */}
        <div className="rounded-2xl bg-gradient-to-br from-butter to-peach dark:from-[#3A3526] dark:to-[#3A2E44] p-6 text-ink dark:text-cream relative overflow-hidden border border-ink/5 dark:border-white/10">
          <motion.div
            animate={{ rotate: [0, 8, -6, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/25 dark:bg-white/5"
          />
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/60 dark:bg-white/10 grid place-items-center text-tangerine text-xl">
                <TbCoins />
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/60">
                Balance
              </div>
            </div>
            <div className="font-fraunces text-5xl md:text-6xl leading-none tracking-tight">
              <CountUp to={balance} />
              <span className="text-xl text-ink/50 ml-2 font-jakarta font-semibold tracking-normal">
                coins
              </span>
            </div>

            {/* Mini stats */}
            <div className="mt-5 flex items-center gap-6">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-jakarta font-semibold text-ink/50">
                  Lifetime earned
                </div>
                <div className="font-fraunces text-base text-ink mt-0.5 tracking-tight">
                  <CountUp to={earned} />
                </div>
              </div>
              <div className="w-px h-7 bg-ink/10" />
              <div>
                <div className="text-[10px] uppercase tracking-wider font-jakarta font-semibold text-ink/50">
                  Redeemed
                </div>
                <div className="font-fraunces text-base text-ink mt-0.5 tracking-tight">
                  <CountUp to={redeemed} />
                </div>
              </div>
            </div>

            <p className="relative mt-5 text-[11px] font-jakarta text-ink/60 max-w-md leading-relaxed border-t border-ink/10 pt-3">
              1 coin = ₹1. Earn by writing reviews, answering questions, winning
              live games, or referring sellers. Redeem up to 20% of any order at
              checkout.
            </p>
          </div>
        </div>
      </Reveal>

      {/* Ledger */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-ink/50 mb-1">
              Activity
            </div>
            <h3 className="font-fraunces text-xl text-ink dark:text-cream tracking-tight flex items-center gap-2">
              <HiOutlineClipboardDocumentList className="text-mauve" />
              Ledger
            </h3>
          </div>
          {items.length > 0 && (
            <span className="text-[11px] text-ink/50 font-jakarta tabular-nums">
              {items.length} transactions
            </span>
          )}
        </div>

        {loading ? null : items.length === 0 ? (
          <EmptyState
            title="No coin history yet"
            hint="Leave a review to earn your first coins"
          />
        ) : (
          <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-ink/5 dark:border-white/10 divide-y divide-ink/5 dark:divide-white/10 overflow-hidden">
            {items.map((it) => (
              <motion.div
                key={it._id}
                initial={{ opacity: 0, x: -4 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="px-4 py-3 flex items-center gap-3 hover:bg-white/50 dark:hover:bg-white/10 transition"
              >
                <span
                  className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${
                    it.delta >= 0
                      ? "bg-mint text-leaf"
                      : "bg-coral/15 text-coral"
                  }`}
                >
                  {it.delta >= 0 ? (
                    <HiOutlineArrowDownLeft className="text-sm" />
                  ) : (
                    <HiOutlineArrowUpRight className="text-sm" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-jakarta font-semibold text-xs text-ink dark:text-cream truncate">
                    {REASON_LABELS[it.reason] || it.reason}
                  </div>
                  <div className="text-[10px] text-ink/45 font-jakarta mt-0.5">
                    {dayjs(it.createdAt).format("D MMM YYYY · h:mm A")}
                  </div>
                </div>
                <div
                  className={`font-fraunces text-base tracking-tight tabular-nums ${
                    it.delta >= 0 ? "text-leaf" : "text-coral"
                  }`}
                >
                  {it.delta > 0 ? "+" : ""}
                  {it.delta}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
