import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineShoppingBag,
  HiOutlineHeart,
  HiOutlineShieldExclamation,
  HiOutlineBolt,
  HiOutlineArchiveBox,
  HiOutlineChatBubbleLeftRight,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineCurrencyRupee,
  HiOutlineCog6Tooth,
  HiOutlineEnvelope,
  HiOutlineCheckBadge,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import { TbCoins } from "react-icons/tb";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { Reveal } from "../components/animations/Reveal";
import { CountUp } from "../components/animations/CountUp";
import { Spinner } from "../components/ui/Spinner";
import Badge from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import Input, { Textarea } from "../components/ui/Input";
import Button from "../components/ui/Button";
import MediaUploader from "../components/ui/MediaUploader";
import TrustGraph from "../components/TrustGraph";
import Sidebar from "../components/Sidebar";
import VerifiedBadge from "../components/VerifiedBadge";
import ProductFormModal from "../components/ProductFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import dayjs from "dayjs";

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState(searchParams.get("tab") || "overview");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [stress, setStress] = useState(null);
  const [flagged, setFlagged] = useState([]);
  const [karma, setKarma] = useState(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [productsError, setProductsError] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "seller" && user.role !== "admin") {
      navigate("/buyer/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const qp = searchParams.get("tab");
    if (qp && qp !== tab) setTab(qp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function onSelectTab(key) {
    setTab(key);
    const next = new URLSearchParams(searchParams);
    next.set("tab", key);
    setSearchParams(next, { replace: true });
  }

  const refetchProducts = useCallback(async () => {
    try {
      const { data } = await api.get("/products/mine");
      setProducts(data.items || []);
      setProductsError(null);
    } catch (err) {
      setProductsError(err.response?.data?.error || "Failed to load products");
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      api.get("/orders/seller").then((r) => r.data.orders).catch(() => []),
      api.get("/products/mine").then((r) => r.data.items).catch(() => []),
      api.get("/stress/mine").then((r) => r.data).catch(() => null),
      api.get("/faq/flagged").then((r) => r.data.items).catch(() => []),
      api.get("/stress/karma").then((r) => r.data).catch(() => null),
    ]).then(([o, p, s, f, k]) => {
      setOrders(o);
      setProducts(p);
      setStress(s);
      setFlagged(f);
      setKarma(k);
      setLoading(false);
    });
  }, [user]);

  const gmv = useMemo(
    () =>
      orders
        .filter((o) =>
          ["paid", "packed", "shipped", "delivered"].includes(o.status),
        )
        .reduce((s, o) => s + (o.total || 0), 0),
    [orders],
  );

  const totalRevenue = useMemo(
    () => orders.reduce((s, o) => s + (o.total || 0), 0),
    [orders],
  );

  const pending = orders.filter((o) =>
    ["pending", "paid", "packed"].includes(o.status),
  ).length;

  function requestDelete(p) {
    setDeleteError(null);
    setDeleteTarget(p);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/products/${deleteTarget._id}`);
      await refetchProducts();
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.response?.data?.error || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setModalMode("create");
    setModalOpen(true);
  }

  function openEdit(p) {
    setEditing(p);
    setModalMode("edit");
    setModalOpen(true);
  }

  if (!user)
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-sm text-ink/70 dark:text-cream/70">
          Please{" "}
          <Link to="/login" className="text-coral dark:text-peach">
            log in
          </Link>
        </p>
      </div>
    );

  if (loading)
    return (
      <div className="min-h-[50vh] grid place-items-center bg-cream dark:bg-ink">
        <Spinner />
      </div>
    );

  return (
    <div className="md:flex md:min-h-[calc(100vh-4rem)] bg-cream dark:bg-ink">
      <Sidebar role={user.role} active={tab} onNavigate={onSelectTab} />

      <div className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10">
          <Reveal>
            <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral dark:text-peach mb-2">
              Welcome back, {user.name.split(" ")[0]}
            </div>
            <div className="flex items-center gap-4">
              <Avatar
                src={user.avatar}
                name={user.name}
                size="lg"
                aura={user.trustScore}
              />
              <div className="flex-1 min-w-0">
                <h1 className="font-fraunces text-2xl md:text-3xl text-ink dark:text-cream tracking-tight truncate flex items-center gap-2">
                  <span className="truncate">{user.shopName || "Dashboard"}</span>
                  {user.isVerifiedSeller && <VerifiedBadge />}
                </h1>
                <div className="mt-1 text-[11px] text-ink/65 dark:text-cream/70 font-jakarta flex items-center gap-2 flex-wrap">
                  <span>
                    Role{" "}
                    <strong className="text-ink dark:text-cream">
                      {user.role}
                    </strong>
                  </span>
                  <span className="text-ink/20 dark:text-cream/20">·</span>
                  <span>
                    Referral{" "}
                    <strong className="text-ink dark:text-cream">
                      {user.referralCode}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="mt-6">
            {tab === "overview" && (
              <div className="grid md:grid-cols-4 gap-3">
                <KpiCard
                  icon={<HiOutlineBolt />}
                  label="Total revenue"
                  value={
                    <>
                      <span className="text-sm">₹</span>
                      <CountUp to={totalRevenue} />
                    </>
                  }
                  tone="from-coral to-tangerine text-white"
                />
                <KpiCard
                  icon={<HiOutlineShoppingBag />}
                  label="Total orders"
                  value={<CountUp to={orders.length} />}
                  tone="from-mint to-lavender text-ink dark:text-cream"
                />
                <KpiCard
                  icon={<HiOutlineArchiveBox />}
                  label="Total products"
                  value={<CountUp to={products.length} />}
                  tone="from-butter to-peach text-ink dark:text-cream"
                />
                <KpiCard
                  icon={<TbCoins />}
                  label="Coin balance"
                  value={<CountUp to={user.coins || 0} />}
                  tone="from-lavender to-mint text-ink dark:text-cream"
                />

                <KpiCard
                  icon={<HiOutlineCurrencyRupee />}
                  label="GMV last 30d"
                  value={
                    <>
                      <span className="text-sm">₹</span>
                      <CountUp to={gmv} />
                    </>
                  }
                  tone="from-peach to-butter text-ink dark:text-cream"
                />
                <KpiCard
                  icon={<HiOutlineArchiveBox />}
                  label="Pending"
                  value={<CountUp to={pending} />}
                  tone="from-mint to-butter text-ink dark:text-cream"
                />

                <div className="md:col-span-2 rounded-2xl bg-white/85 dark:bg-[#2a2436] border border-ink/5 dark:border-white/10 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/55 dark:text-cream/55 mb-1">
                        Latest activity
                      </div>
                      <h4 className="font-fraunces text-base text-ink dark:text-cream tracking-tight">
                        Recent orders
                      </h4>
                    </div>
                    <button
                      onClick={() => onSelectTab("orders")}
                      className="text-[11px] font-jakarta font-semibold text-ink/60 dark:text-cream/60 hover:text-coral dark:hover:text-peach transition"
                    >
                      View all →
                    </button>
                  </div>

                  {orders.slice(0, 6).map((o) => (
                    <Link
                      to={`/order/${o._id}`}
                      key={o._id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-peach/40 dark:hover:bg-white/5 transition"
                    >
                      <img
                        src={o.items[0]?.image}
                        alt=""
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-jakarta font-semibold text-ink dark:text-cream line-clamp-1">
                          {o.items[0]?.title}
                        </div>
                        <div className="text-[10px] text-ink/50 dark:text-cream/50 mt-0.5">
                          {dayjs(o.createdAt).fromNow?.() ||
                            dayjs(o.createdAt).format("D MMM")}
                        </div>
                      </div>
                      <Badge tone="peach">{o.status}</Badge>
                      <div className="font-fraunces text-xs text-ink dark:text-cream tracking-tight">
                        ₹{o.total?.toLocaleString("en-IN")}
                      </div>
                    </Link>
                  ))}

                  {orders.length === 0 && (
                    <p className="mt-2 text-xs text-ink/50 dark:text-cream/50 font-jakarta italic">
                      No orders yet
                    </p>
                  )}
                </div>

                {karma && (
                  <div className="md:col-span-2">
                    <div className="rounded-2xl bg-white/85 dark:bg-[#2a2436] border border-ink/5 dark:border-white/10 p-4 shadow-sm">
                      <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/55 dark:text-cream/55 mb-2">
                        Seller signals
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-fraunces text-base text-ink dark:text-cream tracking-tight flex items-center gap-2">
                          <HiOutlineShieldExclamation className="text-coral dark:text-peach" />
                          Trust graph
                        </h4>
                      </div>

                      <div className="rounded-2xl bg-cream/70 dark:bg-[#201b2c] border border-ink/5 dark:border-white/10 p-4 overflow-hidden">
                        <TrustGraph
                          trustScore={user.trustScore}
                          fraudKarma={karma.fraudKarma}
                          breakdown={{}}
                          verified={user.isVerifiedSeller}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "orders" && (
              <div className="rounded-2xl bg-white/85 dark:bg-[#2a2436] border border-ink/5 dark:border-white/10 divide-y divide-ink/5 dark:divide-white/10 overflow-hidden shadow-sm">
                {orders.length === 0 && (
                  <div className="p-6 text-center text-xs text-ink/50 dark:text-cream/50 font-jakarta italic">
                    No orders yet
                  </div>
                )}
                {orders.map((o) => (
                  <Link
                    to={`/order/${o._id}`}
                    key={o._id}
                    className="flex items-center gap-3 p-3 hover:bg-peach/40 dark:hover:bg-white/5 transition"
                  >
                    <img
                      src={o.items[0]?.image}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-jakarta font-semibold text-ink dark:text-cream font-mono">
                        #{String(o._id).slice(-8).toUpperCase()}
                      </div>
                      <div className="text-[11px] text-ink/55 dark:text-cream/55 mt-0.5">
                        {o.buyer?.name} · {dayjs(o.createdAt).format("D MMM")}
                      </div>
                    </div>
                    <Badge tone="mint">{o.status}</Badge>
                    <div className="font-fraunces text-base text-ink dark:text-cream tracking-tight">
                      ₹{o.total?.toLocaleString("en-IN")}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {tab === "products" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral dark:text-peach mb-1">
                      Your listings
                    </div>
                    <h3 className="font-fraunces text-lg text-ink dark:text-cream tracking-tight">
                      {products.length} product{products.length === 1 ? "" : "s"}
                    </h3>
                  </div>
                  <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-1.5 rounded-full bg-coral text-white font-jakarta font-semibold text-xs px-4 py-2 hover:bg-coral/90 transition"
                  >
                    <HiOutlinePlus className="text-sm" /> Add Product
                  </button>
                </div>

                {productsError && (
                  <div className="mb-3 rounded-xl bg-coral/10 border border-coral/30 px-3 py-2 text-[11px] font-jakarta text-coral dark:text-peach">
                    {productsError}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {products.map((p) => (
                    <div
                      key={p._id}
                      className="rounded-xl bg-white/85 dark:bg-[#2a2436] border border-ink/5 dark:border-white/10 overflow-hidden group shadow-sm"
                    >
                      <Link
                        to={`/product/${p._id}`}
                        className="block hover:-translate-y-0.5 transition"
                      >
                        <img
                          src={p.images?.[0]?.url}
                          alt=""
                          className="w-full aspect-square object-cover"
                        />
                      </Link>
                      <div className="p-3">
                        <div className="text-xs font-jakarta font-semibold text-ink dark:text-cream line-clamp-2 min-h-[2.25rem]">
                          {p.title}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[11px]">
                          <span className="font-fraunces text-sm text-ink dark:text-cream tracking-tight">
                            ₹{p.price}
                          </span>
                          <span
                            className={`font-jakarta ${
                              p.stock === 0
                                ? "text-coral dark:text-peach"
                                : "text-leaf dark:text-mint"
                            }`}
                          >
                            {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <button
                            onClick={() => openEdit(p)}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-full bg-cream dark:bg-white/5 border border-ink/10 dark:border-white/10 text-ink dark:text-cream text-[11px] font-jakarta font-semibold px-2.5 py-1 hover:border-ink/30 dark:hover:border-white/20 transition"
                          >
                            <HiOutlinePencilSquare className="text-xs" /> Edit
                          </button>
                          <button
                            onClick={() => requestDelete(p)}
                            className="inline-flex items-center justify-center rounded-full bg-coral/10 dark:bg-coral/20 text-coral hover:bg-coral hover:text-white text-[11px] font-jakarta font-semibold px-2.5 py-1 transition"
                            aria-label="delete"
                          >
                            <HiOutlineTrash className="text-xs" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <div className="col-span-full text-center py-10 rounded-2xl bg-white/70 dark:bg-[#2a2436] border border-dashed border-ink/15 dark:border-white/15">
                      <p className="text-xs text-ink/50 dark:text-cream/50 font-jakarta italic mb-3">
                        No products listed yet
                      </p>
                      <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-1.5 rounded-full bg-coral text-white font-jakarta font-semibold text-xs px-4 py-2 hover:bg-coral/90 transition"
                      >
                        <HiOutlinePlus className="text-sm" /> Add your first product
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "stress" && (
              <div className="rounded-2xl bg-white/85 dark:bg-[#2a2436] border border-ink/5 dark:border-white/10 p-5 shadow-sm">
                <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral dark:text-peach mb-2">
                  Operational health
                </div>
                <h3 className="font-fraunces text-xl text-ink dark:text-cream tracking-tight flex items-center gap-2">
                  <HiOutlineShieldExclamation className="text-coral dark:text-peach" />
                  Stress radar
                </h3>
                <p className="text-xs text-ink/60 dark:text-cream/60 font-jakarta mt-1">
                  Proactive coaching when your shop shows strain.
                </p>
                <div className="mt-5 flex items-center gap-5 flex-wrap">
                  <Gauge score={stress?.score || 0} />
                  <div className="flex-1 min-w-[240px]">
                    {(stress?.signals || []).length === 0 ? (
                      <div className="rounded-xl bg-mint/40 dark:bg-mint/15 border border-white/50 dark:border-white/10 p-3">
                        <p className="text-xs text-leaf dark:text-mint font-jakarta font-semibold">
                          You're cruising — no stress signals detected.
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {(stress?.signals || []).map((s) => (
                          <li
                            key={s.key}
                            className="rounded-xl bg-cream dark:bg-white/5 border border-ink/5 dark:border-white/10 p-3"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                tone={
                                  s.level === "high"
                                    ? "coral"
                                    : s.level === "medium"
                                      ? "peach"
                                      : "mint"
                                }
                              >
                                {s.level}
                              </Badge>
                              <span className="text-[10px] text-ink/45 dark:text-cream/45 font-jakarta uppercase tracking-wider">
                                Weight {s.weight}
                              </span>
                            </div>
                            <div className="text-xs text-ink dark:text-cream font-jakarta">
                              {s.message}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === "chats" && (
              <div className="rounded-2xl bg-white/85 dark:bg-[#2a2436] border border-ink/5 dark:border-white/10 divide-y divide-ink/5 dark:divide-white/10 overflow-hidden shadow-sm">
                {flagged.length === 0 && (
                  <div className="p-8 text-center">
                    <div className="text-xs text-leaf dark:text-mint font-jakarta font-semibold">
                      No flagged chats — karma cruise
                    </div>
                  </div>
                )}
                {flagged.map((m) => (
                  <div key={m._id} className="p-3 flex items-center gap-3">
                    <Avatar
                      src={m.from?.avatar}
                      name={m.from?.name}
                      size="xs"
                      aura={m.from?.fraudKarma}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-jakarta font-semibold text-ink dark:text-cream flex items-center gap-1">
                        <HiOutlineHeart className="text-coral dark:text-peach text-xs" />{" "}
                        {m.from?.name}
                      </div>
                      <div className="text-[11px] text-coral dark:text-peach italic mt-0.5">
                        Hidden by Controlled Chats
                      </div>
                    </div>
                    <Badge tone="coral">{m.moderation?.label || "flagged"}</Badge>
                  </div>
                ))}
              </div>
            )}

            {tab === "settings" && (
              <SellerSettingsTab
                user={user}
                onSaved={(u) => hydrate(token, u)}
              />
            )}

            {tab === "admin" && user.role === "admin" && <AdminPanel />}
          </div>
        </div>
      </div>

      <ProductFormModal
        open={modalOpen}
        mode={modalMode}
        product={editing}
        onClose={() => setModalOpen(false)}
        onSaved={refetchProducts}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete product?"
        message={
          deleteError ? (
            <>
              <span className="block mb-1">
                {deleteTarget
                  ? `"${deleteTarget.title}" will be removed from your shop.`
                  : ""}
              </span>
              <span className="text-coral">{deleteError}</span>
            </>
          ) : deleteTarget ? (
            <>
              "{deleteTarget.title}" will be removed from your shop. Buyers won't see it anymore.
              This action can't be undone.
            </>
          ) : null
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => {
          if (deleting) return;
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        loading={deleting}
      />
    </div>
  );
}

function KpiCard({ icon, label, value, tone }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`rounded-2xl p-4 border border-ink/5 dark:border-white/10 bg-gradient-to-br ${tone} shadow-sm`}
    >
      <div className="text-lg opacity-70">{icon}</div>
      <div className="mt-2 text-[10px] uppercase font-jakarta font-semibold tracking-[0.2em] opacity-80">
        {label}
      </div>
      <div className="font-fraunces text-2xl tracking-tight mt-0.5">
        {value}
      </div>
    </motion.div>
  );
}

function Gauge({ score }) {
  const color = score >= 60 ? "#FF6B6B" : score >= 30 ? "#FFA94D" : "#51CF66";
  const pct = Math.min(100, score);
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          className="dark:stroke-white/10"
          strokeWidth="8"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 44}
          initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
          animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - pct / 100) }}
          transition={{ duration: 1.2 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-fraunces text-2xl text-ink dark:text-cream leading-none tracking-tight">
            <CountUp to={pct} />
          </div>
          <div className="text-[9px] text-ink/50 dark:text-cream/50 uppercase tracking-[0.2em] font-jakarta font-semibold mt-1">
            Stress
          </div>
        </div>
      </div>
    </div>
  );
}

const SELLER_COUNTRIES = [
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

const SHOP_CATEGORIES = [
  "Handloom & Sarees",
  "Jewellery",
  "Spices & Pickles",
  "Home Decor",
  "Ethnic Wear",
  "Organic Groceries",
  "Leather & Mojaris",
  "Pottery & Ceramics",
  "Ayurveda & Wellness",
  "Indie Beauty",
  "Madhubani Art",
  "Other",
];

function SellerSettingsTab({ user, onSaved }) {
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [shopName, setShopName] = useState(user.shopName || "");
  const [shopCategory, setShopCategory] = useState(
    user.shopCategory || SHOP_CATEGORIES[0],
  );
  const [locationCity, setLocationCity] = useState(
    user.location?.city || (typeof user.location === "string" ? user.location : ""),
  );
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
        shopName,
        shopCategory,
        location: locationCity ? { city: locationCity } : undefined,
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
      className="max-w-2xl rounded-2xl bg-white/85 dark:bg-[#2a2436] border border-ink/5 dark:border-white/10 p-5 space-y-4 shadow-sm"
    >
      <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral dark:text-peach">
        Shop profile
      </div>

      <div className="flex items-center gap-4">
        <MediaUploader
          value={avatar}
          onChange={setAvatar}
          variant="avatar"
          accept="image/*"
          maxSizeMB={5}
        />
        <div className="flex-1 min-w-0">
          <div className="font-fraunces text-lg text-ink dark:text-cream tracking-tight truncate">
            {shopName || name || "Your shop"}
          </div>
          <p className="text-[11px] font-jakarta text-ink/60 dark:text-cream/60 mt-0.5">
            Drop an image, click, or paste from clipboard to update your logo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />
        <Input
          label="Shop name"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="Varanasi Weaves Co."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block">
          <span className="block mb-1 text-[11px] font-jakarta font-semibold text-ink/70 dark:text-cream/70 uppercase tracking-wider">
            Shop category
          </span>
          <select
            value={shopCategory}
            onChange={(e) => setShopCategory(e.target.value)}
            className="w-full rounded-xl bg-white/80 dark:bg-[#201b2c] border border-ink/10 dark:border-white/10 focus:border-coral/60 outline-none px-3 py-2.5 text-xs text-ink dark:text-cream font-jakarta"
          >
            {SHOP_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="Shop city"
          value={locationCity}
          onChange={(e) => setLocationCity(e.target.value)}
          placeholder="Varanasi"
        />
      </div>

      <div>
        <span className="block mb-1 text-[11px] font-jakarta font-semibold text-ink/70 dark:text-cream/70 uppercase tracking-wider">
          Email
        </span>
        <div className="flex items-stretch gap-2">
          <input
            value={user.email || ""}
            readOnly
            className="flex-1 rounded-xl bg-ink/5 dark:bg-white/5 border border-ink/10 dark:border-white/10 outline-none px-3 py-2.5 text-xs text-ink/70 dark:text-cream/70 font-jakarta cursor-not-allowed"
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
            <span className="inline-flex items-center gap-1 text-[11px] font-jakarta font-semibold text-leaf dark:text-mint px-2">
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
        placeholder="Tell buyers about your craft (max 280 characters)"
      />
      <div className="-mt-2 text-[10px] font-jakarta text-ink/45 dark:text-cream/45 text-right">
        {bio.length}/280
      </div>

      <div className="pt-2 border-t border-ink/5 dark:border-white/10">
        <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/60 dark:text-cream/60 mb-2">
          Pickup / return address
        </div>
        <div className="space-y-3">
          <Input
            label="Street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="123 Gully Street"
          />
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-2 gap-3">
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
                className="w-full rounded-xl bg-white/80 dark:bg-[#201b2c] border border-ink/10 dark:border-white/10 focus:border-coral/60 outline-none px-3 py-2.5 text-xs text-ink dark:text-cream font-jakarta"
              >
                {SELLER_COUNTRIES.map((c) => (
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

function AdminPanel() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function reindex() {
    setBusy(true);
    try {
      const { data } = await api.post("/ml/reindex");
      setMsg(`Re-indexed ${data.indexed} products.`);
    } catch (e) {
      setMsg(e.response?.data?.error || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white/85 dark:bg-[#2a2436] border border-ink/5 dark:border-white/10 p-5 space-y-3 shadow-sm">
      <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral dark:text-peach mb-2">
        Operator tools
      </div>
      <h3 className="font-fraunces text-xl text-ink dark:text-cream tracking-tight flex items-center gap-2">
        <HiOutlineChatBubbleLeftRight className="text-mauve" /> Admin controls
      </h3>
      <button
        onClick={reindex}
        disabled={busy}
        className="rounded-full bg-ink dark:bg-white text-cream dark:text-ink font-jakarta font-semibold text-xs px-4 py-2 disabled:opacity-50 transition"
      >
        {busy ? "Re-indexing..." : "Re-build product embeddings"}
      </button>
      {msg && (
        <div className="text-xs text-ink/60 dark:text-cream/60 font-jakarta">
          {msg}
        </div>
      )}
    </div>
  );
}