import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import {
  HiOutlineShoppingBag,
  HiOutlineClipboardDocumentList,
  HiOutlineHeart,
  HiOutlineChatBubbleLeftRight,
  HiOutlineStar,
  HiOutlineCog6Tooth,
  HiOutlineTrash,
  HiOutlineArrowRightCircle,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineEnvelope,
  HiOutlineCheckBadge,
} from "react-icons/hi2";
import VerifiedBadge from "../components/VerifiedBadge";
import { TbCoins } from "react-icons/tb";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";
import Sidebar from "../components/Sidebar";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import Input, { Textarea } from "../components/ui/Input";
import MediaUploader from "../components/ui/MediaUploader";
import { CountUp } from "../components/animations/CountUp";
import { Reveal } from "../components/animations/Reveal";
import NewChatModal from "../components/chat/NewChatModal";

const WISHLIST_KEY = "lokaly.wishlist";

function readWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeWishlist(ids) {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export default function BuyerDashboard() {
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overview";

  // Role guard
  useEffect(() => {
    if (!user) return;
    if (user.role === "seller" || user.role === "admin") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  function setTab(key) {
    const next = new URLSearchParams(params);
    next.set("tab", key);
    setParams(next, { replace: true });
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-sm text-ink/60 dark:text-cream/60 font-jakarta">
          Please{" "}
          <Link to="/login" className="text-coral font-semibold">
            log in
          </Link>{" "}
          to view your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <Sidebar role="buyer" active={tab} />

      <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-10 overflow-x-hidden">
        <Reveal>
          <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
            Welcome back, {user.name?.split(" ")[0] || "friend"}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Avatar
              src={user.avatar}
              name={user.name}
              size="lg"
              aura={user.trustScore}
            />
            <div className="flex-1 min-w-0">
              <h1 className="font-fraunces text-xl sm:text-2xl md:text-3xl text-ink dark:text-cream tracking-tight flex items-center gap-2 flex-wrap">
                <span className="truncate">Your buyer dashboard</span>
                {user.emailVerified && (
                  <HiOutlineCheckBadge
                    className="text-leaf shrink-0"
                    title="Email verified"
                  />
                )}
              </h1>
              <div className="mt-1 text-[11px] text-ink/55 dark:text-cream/55 font-jakarta flex items-center gap-2 flex-wrap">
                <span>
                  Coins{" "}
                  <strong className="text-ink/80 dark:text-cream/80">
                    {user.coins || 0}
                  </strong>
                </span>
                <span className="text-ink/20">·</span>
                <span>
                  Referral{" "}
                  <strong className="text-ink/80 dark:text-cream/80">
                    {user.referralCode || "—"}
                  </strong>
                </span>
                <span className="text-ink/20">·</span>
                {user.emailVerified ? (
                  <Badge tone="mint">Verified</Badge>
                ) : (
                  <Badge tone="coral">Email unverified</Badge>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-6">
          {tab === "overview" && <OverviewTab user={user} setTab={setTab} />}
          {tab === "orders" && <OrdersTab />}
          {tab === "wishlist" && <WishlistTab />}
          {tab === "coins" && <CoinsTab user={user} />}
          {tab === "reviews" && <ReviewsTab user={user} />}
          {tab === "chats" && <ChatsTab />}
          {tab === "settings" && (
            <SettingsTab user={user} onSaved={(u) => hydrate(token, u)} />
          )}
        </div>
      </main>
    </div>
  );
}

// ---------- Overview ----------
function OverviewTab({ user, setTab }) {
  const [orders, setOrders] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/orders/mine").then((r) => r.data).catch(() => ({})),
      api.get("/coins/ledger").then((r) => r.data).catch(() => ({})),
    ])
      .then(([o, c]) => {
        setOrders(o?.orders || o?.items || []);
        setLedger(c?.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const active = orders.filter((o) =>
    ["pending", "paid", "packed", "shipped"].includes(o.status),
  ).length;

  if (loading)
    return (
      <div className="min-h-[40vh] grid place-items-center">
        <Spinner />
      </div>
    );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KpiCard
        icon={<HiOutlineShoppingBag />}
        label="Total orders"
        value={<CountUp to={orders.length} />}
        tone="from-coral to-tangerine text-white"
      />
      <KpiCard
        icon={<HiOutlineClipboardDocumentList />}
        label="Active"
        value={<CountUp to={active} />}
        tone="from-peach to-butter text-ink"
      />
      <KpiCard
        icon={<TbCoins />}
        label="Coins"
        value={<CountUp to={user.coins || 0} />}
        tone="from-lavender to-mint text-ink"
      />
      <KpiCard
        icon={<HiOutlineHeart />}
        label="Wishlist"
        value={<CountUp to={readWishlist().length} />}
        tone="from-mint to-lavender text-ink"
      />

      <div className="col-span-2 md:col-span-2 rounded-2xl bg-white/80 dark:bg-white/5 border border-ink/5 dark:border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 dark:text-cream/50 mb-1">
              Latest activity
            </div>
            <h4 className="font-fraunces text-base text-ink dark:text-cream tracking-tight">
              Recent orders
            </h4>
          </div>
          <button
            onClick={() => setTab("orders")}
            className="text-[11px] font-jakarta font-semibold text-ink/50 dark:text-cream/50 hover:text-coral transition"
          >
            View all →
          </button>
        </div>
        {orders.slice(0, 5).map((o) => (
          <Link
            to={`/order/${o._id}`}
            key={o._id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-peach/40 dark:hover:bg-white/5 transition"
          >
            {o.items?.[0]?.image && (
              <img
                src={o.items[0].image}
                alt=""
                className="w-9 h-9 rounded-lg object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-jakarta font-semibold text-ink dark:text-cream line-clamp-1">
                {o.items?.[0]?.title || `Order #${String(o._id).slice(-6)}`}
              </div>
              <div className="text-[10px] text-ink/45 dark:text-cream/45 mt-0.5 font-jakarta">
                {dayjs(o.createdAt).format("D MMM YYYY")}
              </div>
            </div>
            <Badge tone="peach">{o.status}</Badge>
            <div className="font-fraunces text-xs text-ink dark:text-cream tracking-tight shrink-0">
              ₹{o.total?.toLocaleString("en-IN")}
            </div>
          </Link>
        ))}
        {orders.length === 0 && (
          <p className="mt-2 text-xs text-ink/50 dark:text-cream/50 font-jakarta italic">
            No orders yet —{" "}
            <Link to="/products" className="text-coral">
              browse products
            </Link>
          </p>
        )}
      </div>

      <div className="col-span-2 md:col-span-2 rounded-2xl bg-white/80 dark:bg-white/5 border border-ink/5 dark:border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 dark:text-cream/50 mb-1">
              Rewards wallet
            </div>
            <h4 className="font-fraunces text-base text-ink dark:text-cream tracking-tight">
              Coin activity
            </h4>
          </div>
          <button
            onClick={() => setTab("coins")}
            className="text-[11px] font-jakarta font-semibold text-ink/50 dark:text-cream/50 hover:text-coral transition"
          >
            Full history →
          </button>
        </div>
        {ledger.slice(0, 5).map((it) => (
          <div
            key={it._id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-peach/40 dark:hover:bg-white/5 transition"
          >
            <span
              className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${
                it.delta >= 0 ? "bg-mint text-leaf" : "bg-coral/15 text-coral"
              }`}
            >
              <TbCoins className="text-sm" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-jakarta font-semibold text-ink dark:text-cream truncate capitalize">
                {it.reason?.replaceAll("_", " ") || "Coin event"}
              </div>
              <div className="text-[10px] text-ink/45 dark:text-cream/45 mt-0.5 font-jakarta">
                {dayjs(it.createdAt).format("D MMM · h:mm A")}
              </div>
            </div>
            <div
              className={`font-fraunces text-base tracking-tight tabular-nums shrink-0 ${
                it.delta >= 0 ? "text-leaf" : "text-coral"
              }`}
            >
              {it.delta > 0 ? "+" : ""}
              {it.delta}
            </div>
          </div>
        ))}
        {ledger.length === 0 && (
          <p className="mt-2 text-xs text-ink/50 dark:text-cream/50 font-jakarta italic">
            No coin activity yet
          </p>
        )}
      </div>
    </div>
  );
}

// ---------- My Orders ----------
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/orders/mine")
      .then(({ data }) => setOrders(data?.orders || data?.items || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="min-h-[40vh] grid place-items-center">
        <Spinner />
      </div>
    );

  if (orders.length === 0)
    return (
      <EmptyState
        title="No orders yet"
        hint="When you place an order it'll show up here."
      />
    );

  return (
    <div className="rounded-2xl bg-white/80 dark:bg-white/5 border border-ink/5 dark:border-white/10 divide-y divide-ink/5 dark:divide-white/10 overflow-hidden">
      {orders.map((o) => {
        const delivered = o.status === "delivered";
        return (
          <div
            key={o._id}
            className="flex items-center gap-3 p-3 hover:bg-peach/40 dark:hover:bg-white/5 transition flex-wrap sm:flex-nowrap"
          >
            {o.items?.[0]?.image && (
              <img
                src={o.items[0].image}
                alt=""
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-jakarta font-semibold text-ink dark:text-cream font-mono">
                #{String(o._id).slice(-8).toUpperCase()}
              </div>
              <div className="text-[11px] text-ink/55 dark:text-cream/55 mt-0.5 truncate font-jakarta">
                {o.items?.[0]?.title} ·{" "}
                {dayjs(o.createdAt).format("D MMM YYYY")}
              </div>
            </div>
            <Badge tone={delivered ? "mint" : "peach"}>{o.status}</Badge>
            <div className="font-fraunces text-base text-ink dark:text-cream tracking-tight shrink-0">
              ₹{o.total?.toLocaleString("en-IN")}
            </div>
            <Link
              to={`/order/${o._id}`}
              className="text-[11px] font-jakarta font-semibold text-ink/70 dark:text-cream/70 hover:text-coral transition shrink-0"
            >
              Track →
            </Link>
            {delivered && (
              <Link
                to={`/product/${o.items?.[0]?.product || ""}#review`}
                className="text-[11px] font-jakarta font-semibold rounded-full px-3 py-1 bg-coral text-white hover:opacity-90 shrink-0"
              >
                Review
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------- Wishlist ----------
function WishlistTab() {
  const [ids, setIds] = useState(() => readWishlist());
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverSupported, setServerSupported] = useState(null);
  const addToCart = useCartStore((s) => s.add);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/wishlist")
      .then(({ data }) => {
        if (cancelled) return;
        setServerSupported(true);
        const items = data?.items || data?.wishlist || data || [];
        const list = (Array.isArray(items) ? items : []).map(
          (it) => it?.product || it,
        );
        setProducts(list.filter(Boolean));
      })
      .catch((e) => {
        if (cancelled) return;
        if (e.response?.status === 404) setServerSupported(false);
        else setServerSupported(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (serverSupported !== false) return;
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    Promise.all(
      ids.map((id) =>
        api
          .get(`/products/${id}`)
          .then((r) => r.data?.product || r.data)
          .catch(() => null),
      ),
    ).then((list) => setProducts(list.filter(Boolean)));
  }, [ids, serverSupported]);

  function remove(productId) {
    const next = ids.filter((id) => id !== productId);
    writeWishlist(next);
    setIds(next);
  }

  async function moveToCart(productId) {
    try {
      await addToCart(productId, 1);
      toast.success("Added to cart");
      remove(productId);
    } catch (e) {
      toast.error(e.response?.data?.error || "Could not add to cart");
    }
  }

  if (loading)
    return (
      <div className="min-h-[40vh] grid place-items-center">
        <Spinner />
      </div>
    );

  if (products.length === 0)
    return (
      <EmptyState
        title="Your wishlist is empty"
        hint="Tap the heart on any product to save it for later."
      />
    );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {products.map((p) => (
        <div
          key={p._id}
          className="rounded-xl bg-white/80 dark:bg-white/5 border border-ink/5 dark:border-white/10 overflow-hidden flex flex-col"
        >
          <Link to={`/product/${p._id}`}>
            <img
              src={p.images?.[0]?.url}
              alt=""
              className="w-full aspect-square object-cover"
            />
          </Link>
          <div className="p-3 flex-1 flex flex-col">
            <div className="text-xs font-jakarta font-semibold text-ink dark:text-cream line-clamp-2">
              {p.title}
            </div>
            <div className="mt-1 font-fraunces text-sm text-ink dark:text-cream tracking-tight">
              ₹{p.price}
            </div>
            <div className="mt-auto pt-3 flex gap-1.5">
              <button
                onClick={() => moveToCart(p._id)}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-full bg-coral text-white font-jakarta font-semibold text-[10px] px-2 py-1.5 hover:opacity-90"
              >
                <HiOutlineArrowRightCircle /> Move to cart
              </button>
              <button
                onClick={() => remove(p._id)}
                aria-label="Remove"
                className="w-8 h-8 grid place-items-center rounded-full bg-peach/60 dark:bg-white/10 text-ink dark:text-cream hover:bg-peach transition"
              >
                <HiOutlineTrash className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Coins ----------
function CoinsTab({ user }) {
  const [items, setItems] = useState([]);
  const [balance, setBalance] = useState(user?.coins || 0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/coins/ledger")
      .then(({ data }) => {
        setItems(data.items || []);
        if (typeof data.balance === "number") setBalance(data.balance);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="min-h-[30vh] grid place-items-center">
        <Spinner />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-butter to-peach p-5 border border-ink/5 flex items-center gap-4 flex-wrap">
        <div className="w-12 h-12 rounded-xl bg-white/70 grid place-items-center text-tangerine text-xl shrink-0">
          <TbCoins />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/60">
            Balance
          </div>
          <div className="font-fraunces text-3xl text-ink tracking-tight">
            <CountUp to={balance} /> coins
          </div>
        </div>
        <Link
          to="/coins"
          className="text-[11px] font-jakarta font-semibold rounded-full px-3 py-1.5 bg-ink text-cream hover:opacity-90 shrink-0"
        >
          View full coin history
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No coin activity yet"
          hint="Leave a review or win a live game to earn coins."
        />
      ) : (
        <div className="rounded-2xl bg-white/80 dark:bg-white/5 border border-ink/5 dark:border-white/10 divide-y divide-ink/5 dark:divide-white/10 overflow-hidden">
          {items.slice(0, 10).map((it) => (
            <div
              key={it._id}
              className="p-3 flex items-center gap-3 hover:bg-white/60 dark:hover:bg-white/5 transition"
            >
              <span
                className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${
                  it.delta >= 0
                    ? "bg-mint text-leaf"
                    : "bg-coral/15 text-coral"
                }`}
              >
                <TbCoins className="text-sm" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-jakarta font-semibold text-ink dark:text-cream truncate capitalize">
                  {it.reason?.replaceAll("_", " ") || "Coin event"}
                </div>
                <div className="text-[10px] text-ink/45 dark:text-cream/45 mt-0.5 font-jakarta">
                  {dayjs(it.createdAt).format("D MMM YYYY · h:mm A")}
                </div>
              </div>
              <div
                className={`font-fraunces text-base tracking-tight tabular-nums shrink-0 ${
                  it.delta >= 0 ? "text-leaf" : "text-coral"
                }`}
              >
                {it.delta > 0 ? "+" : ""}
                {it.delta}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Reviews ----------
function ReviewsTab({ user }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/reviews/mine");
        const items = data?.items || data?.reviews || data || [];
        setReviews(Array.isArray(items) ? items : []);
        return;
      } catch (e1) {
        if (e1.response?.status !== 404) {
          // fall through
        }
      }
      try {
        const { data } = await api.get("/reviews", {
          params: { buyer: user?._id || "me" },
        });
        const items = data?.items || data?.reviews || [];
        setReviews(Array.isArray(items) ? items : []);
      } catch {
        setReviews([]);
        setNote(
          "Reviews filter not available yet — check back once the endpoint lands.",
        );
      }
    }
    load().finally(() => setLoading(false));
  }, [user?._id]);

  if (loading)
    return (
      <div className="min-h-[30vh] grid place-items-center">
        <Spinner />
      </div>
    );

  if (reviews.length === 0)
    return (
      <div className="space-y-3">
        {note && (
          <div className="rounded-xl bg-lavender/40 dark:bg-white/5 border border-ink/5 dark:border-white/10 p-3 text-[11px] font-jakarta text-ink/70 dark:text-cream/70">
            {note}
          </div>
        )}
        <EmptyState
          title="You haven't written any reviews"
          hint="After an order is delivered you can leave a review and earn coins."
        />
      </div>
    );

  return (
    <div className="space-y-2">
      {reviews.map((r) => (
        <div
          key={r._id}
          className="rounded-2xl bg-white/80 dark:bg-white/5 border border-ink/5 dark:border-white/10 p-4"
        >
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <HiOutlineStar className="text-butter shrink-0" />
            <span className="font-fraunces text-sm text-ink dark:text-cream">
              {r.rating}
            </span>
            <span className="text-[10px] text-ink/45 dark:text-cream/45 font-jakarta">
              {dayjs(r.createdAt).format("D MMM YYYY")}
            </span>
          </div>
          <p className="text-xs text-ink/80 dark:text-cream/80 font-jakarta leading-relaxed">
            {r.text || r.body}
          </p>
          {r.product?._id && (
            <Link
              to={`/product/${r.product._id}`}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-jakarta font-semibold text-coral"
            >
              View product <HiOutlineArrowTopRightOnSquare className="text-xs" />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------- Chats ----------
function ChatsTab() {
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/chat/conversations")
      .then(({ data }) => setConvos(data.conversations || []))
      .catch(() => setConvos([]))
      .finally(() => setLoading(false));
  }, []);

  async function handlePick(conv, u) {
    navigate(`/messages?to=${u?._id || conv?.participants?.[0]?._id}`);
  }

  if (loading)
    return (
      <div className="min-h-[30vh] grid place-items-center">
        <Spinner />
      </div>
    );

  return (
    <div className="rounded-2xl bg-white/80 dark:bg-white/5 border border-ink/5 dark:border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink/5 dark:border-white/10 flex-wrap gap-2">
        <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 dark:text-cream/50">
          Recent conversations
        </div>
        <Button
          size="sm"
          variant="primary"
          leftIcon={<HiOutlineChatBubbleBottomCenterText />}
          onClick={() => setNewChatOpen(true)}
        >
          New chat
        </Button>
      </div>
      {convos.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="No conversations yet"
            hint="Start a chat from any product page or tap 'New chat'."
          />
        </div>
      ) : (
        <ul className="divide-y divide-ink/5 dark:divide-white/10">
          {convos.slice(0, 10).map((c) => (
            <li key={c.id}>
              <div className="flex items-center gap-3 p-3 hover:bg-peach/40 dark:hover:bg-white/5 transition">
                <Avatar
                  src={c.other?.avatar}
                  name={c.other?.name}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-jakarta font-semibold text-ink dark:text-cream truncate">
                    {c.other?.shopName || c.other?.name}
                  </div>
                  <div className="text-[11px] text-ink/55 dark:text-cream/55 truncate mt-0.5">
                    {c.lastMessage?.text || "—"}
                  </div>
                </div>
                <Link
                  to={`/messages?to=${c.other?._id}`}
                  className="text-[11px] font-jakarta font-semibold rounded-full px-3 py-1 bg-ink text-cream hover:opacity-90 shrink-0"
                >
                  Open
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <NewChatModal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onSelect={handlePick}
      />
    </div>
  );
}

// ---------- Settings ----------
const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "United Arab Emirates",
  "Singapore",
  "Germany",
  "France",
  "Japan",
  "Other",
];

function SettingsTab({ user, onSaved }) {
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [phone, setPhone] = useState(user.phone || "");
  const addr = user.address || {};
  const [street, setStreet] = useState(addr.street || "");
  const [city, setCity] = useState(addr.city || "");
  const [state, setStateField] = useState(addr.state || "");
  const [pincode, setPincode] = useState(addr.pincode || "");
  const [country, setCountry] = useState(addr.country || "India");
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function save(e) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        bio: (bio || "").slice(0, 280),
        avatar,
        phone,
        address: { street, city, state, pincode, country },
      };
      const { data } = await api.patch("/auth/me", payload);
      toast.success("Profile updated");
      if (data?.user) onSaved?.(data.user);
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    setVerifying(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification email sent — check console in dev");
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not send verification");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="w-full max-w-2xl rounded-2xl bg-white/80 dark:bg-white/5 border border-ink/5 dark:border-white/10 p-4 sm:p-5 space-y-4"
    >
      {/* ── Avatar uploader row ── */}
      {/* FIX: was flex row causing "savan kushwah" text to overflow right.
          Now stacks vertically on small screens and sits side-by-side only
          when there is enough room (sm+). min-w-0 on the text container
          ensures truncation works correctly at every width. */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="shrink-0 self-start">
          <MediaUploader
            value={avatar}
            onChange={setAvatar}
            variant="avatar"
            accept="image/*"
            maxSizeMB={5}
          />
        </div>
        <div className="min-w-0 w-full">
          <div className="font-fraunces text-lg text-ink dark:text-cream tracking-tight truncate">
            {name || "Your profile"}
          </div>
          <p className="text-[11px] font-jakarta text-ink/55 dark:text-cream/55 mt-0.5 leading-relaxed">
            Drop an image, click, or paste from clipboard to update your avatar.
          </p>
        </div>
      </div>

      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        required
      />

      {/* Email row */}
      <div>
        <span className="block mb-1 text-[11px] font-jakarta font-semibold text-ink/70 dark:text-cream/70 uppercase tracking-wider">
          Email
        </span>
        <div className="flex items-stretch gap-2 flex-wrap sm:flex-nowrap">
          <input
            value={user.email || ""}
            readOnly
            className="flex-1 min-w-0 rounded-xl bg-ink/5 dark:bg-white/5 border border-ink/10 dark:border-cream/10 outline-none px-3 py-2.5 text-xs text-ink/70 dark:text-cream/70 font-jakarta cursor-not-allowed"
          />
          {!user.emailVerified && (
            <Button
              type="button"
              size="sm"
              variant="coral"
              onClick={resendVerification}
              disabled={verifying}
              leftIcon={<HiOutlineEnvelope />}
            >
              {verifying ? "Sending..." : "Verify email"}
            </Button>
          )}
          {user.emailVerified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-jakarta font-semibold text-leaf px-2 shrink-0">
              <HiOutlineCheckBadge /> Verified
            </span>
          )}
        </div>
      </div>

      <Input
        label="Phone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+91 98765 43210"
      />

      <Textarea
        label="Bio"
        value={bio}
        onChange={(e) => setBio(e.target.value.slice(0, 280))}
        placeholder="Tell people about yourself (max 280 characters)"
      />
      <div className="-mt-2 text-[10px] font-jakarta text-ink/45 dark:text-cream/45 text-right">
        {bio.length}/280
      </div>

      {/* Shipping address */}
      <div className="pt-2 border-t border-ink/5 dark:border-white/10">
        <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/60 dark:text-cream/60 mb-2">
          Shipping address
        </div>
        <div className="space-y-3">
          <Input
            label="Street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="123 Gully Street"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Bengaluru"
            />
            <Input
              label="State"
              value={state}
              onChange={(e) => setStateField(e.target.value)}
              placeholder="Karnataka"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="560001"
            />
            <label className="block">
              <span className="block mb-1 text-[11px] font-jakarta font-semibold text-ink/70 dark:text-cream/70 uppercase tracking-wider">
                Country
              </span>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl bg-white/80 dark:bg-white/5 border border-ink/10 dark:border-cream/10 focus:border-coral/60 outline-none px-3 py-2.5 text-xs text-ink dark:text-cream font-jakarta"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={busy} leftIcon={<HiOutlineCog6Tooth />}>
          {busy ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

// ---------- Small bits ----------
function KpiCard({ icon, label, value, tone }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`rounded-2xl p-4 border border-ink/5 bg-gradient-to-br ${tone}`}
    >
      <div className="text-lg opacity-80">{icon}</div>
      <div className="mt-2 text-[10px] uppercase font-jakarta font-semibold tracking-[0.2em] opacity-80">
        {label}
      </div>
      <div className="font-fraunces text-2xl tracking-tight mt-0.5">
        {value}
      </div>
    </motion.div>
  );
}
