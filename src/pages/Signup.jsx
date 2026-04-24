import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineBuildingStorefront,
  HiOutlineArrowLongRight,
  HiOutlineCheck,
  HiOutlineChevronDown,
} from "react-icons/hi2";
import { FiUser } from "react-icons/fi";
import { TbBuildingStore } from "react-icons/tb";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Reveal } from "../components/animations/Reveal";

/* ─────────────────────────── constants ─────────────────────────── */

const CATEGORIES = [
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
];

const BENEFITS = [
  "Build trust with a Karma aura that grows with every review",
  "Earn Community Coins for helpful answers and reviews",
  "Refer a seller and earn 2% lifetime equity cashback",
];

/* ─────────────────────────── sub-components ─────────────────────── */

/**
 * Floating blob — purely decorative, pointer-events off
 */
function Blob({ className, animateProps, transitionProps }) {
  return (
    <motion.div
      animate={animateProps}
      transition={transitionProps}
      className={`absolute rounded-full blur-2xl pointer-events-none ${className}`}
    />
  );
}

/* ─────────────────────────── main component ─────────────────────── */

export default function Signup() {
  const [params] = useSearchParams();
  const [role, setRole] = useState(
    params.get("role") === "seller" ? "seller" : "buyer"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopCategory, setShopCategory] = useState(CATEGORIES[0]);
  const [referralCode, setReferralCode] = useState(params.get("ref") || "");
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();
  const hydrate = useAuthStore((s) => s.hydrate);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name, email, password, role, referralCode };
      if (role === "seller") {
        payload.shopName = shopName;
        payload.shopCategory = shopCategory;
      }
      const { data } = await api.post("/auth/signup", payload);
      hydrate(data.token, data.user);
      toast.success("Welcome to Lokaly 🎉");
      nav(role === "seller" ? "/dashboard" : "/feed");
    } catch (err) {
      toast.error(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  /* ── render ── */
  return (
    <div className="min-h-screen flex flex-col md:grid md:grid-cols-2">
      {/* ══════════════ LEFT — marketing panel ══════════════ */}
      <motion.aside
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="
          hidden md:flex
          items-center justify-center
          bg-gradient-to-br from-lavender to-peach
          p-8 lg:p-12 xl:p-16
          relative overflow-hidden
          min-h-screen
        "
      >
        {/* decorative blobs */}
        <Blob
          className="-top-20 -right-20 w-72 lg:w-96 h-72 lg:h-96 bg-white/25"
          animateProps={{ rotate: [0, -6, 4, 0] }}
          transitionProps={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <Blob
          className="-bottom-24 -left-20 w-64 lg:w-80 h-64 lg:h-80 bg-white/15"
          animateProps={{ y: [0, -14, 0] }}
          transitionProps={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* subtle grid overlay */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right,#000 1px,transparent 1px),linear-gradient(to bottom,#000 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* content */}
        <div className="relative text-ink max-w-sm lg:max-w-md z-10">
          <p className="text-[10px] uppercase tracking-[0.3em] font-jakarta font-semibold text-coral mb-3">
            Join the bazaar
          </p>
          <h1 className="font-fraunces text-3xl lg:text-4xl xl:text-5xl leading-[1.08] tracking-tight">
            Every sale is a<br />small namaste.
          </h1>
          <p className="mt-4 text-sm text-ink/70 font-jakarta leading-relaxed">
            Build your shop, your community, and your trust score — all on one
            platform.
          </p>

          <ul className="mt-7 space-y-3">
            {BENEFITS.map((text, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.1 }}
                className="flex items-start gap-2.5 text-xs text-ink/80 font-jakarta leading-relaxed"
              >
                <span className="w-4 h-4 shrink-0 mt-0.5 rounded-full bg-coral/20 grid place-items-center">
                  <HiOutlineCheck className="text-coral text-[10px]" />
                </span>
                {text}
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.aside>

      {/* ══════════════ RIGHT — form panel ══════════════ */}
      <main
        className="
          flex items-start md:items-center justify-center
          min-h-screen
          px-4 py-8
          sm:px-6 sm:py-10
          md:px-8 md:py-12
          bg-white
          overflow-y-auto
        "
      >
        <Reveal>
          <div className="w-full max-w-[360px] sm:max-w-sm">

            {/* ── logo ── */}
            <Link to="/" className="inline-flex items-center gap-1.5 mb-6">
              <span className="w-8 h-8 rounded-xl bg-coral-gradient grid place-items-center text-white font-fraunces text-sm select-none">
                L
              </span>
              <span className="font-fraunces text-lg text-ink">Lokaly</span>
            </Link>

            {/* ── heading ── */}
            <p className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-1.5">
              Get started
            </p>
            <h2 className="font-fraunces text-2xl sm:text-3xl text-ink tracking-tight">
              Create your account
            </h2>
            <p className="text-xs text-ink/55 mt-1.5 font-jakarta">
              Already a member?{" "}
              <Link
                to="/login"
                className="text-coral font-semibold hover:underline underline-offset-4"
              >
                Log in
              </Link>
            </p>

            {/* ── role selector ── */}
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 mb-2">
                I'm joining as
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "buyer",  label: "Shopper", Icon: FiUser,          hint: "Discover & buy" },
                  { key: "seller", label: "Seller",  Icon: TbBuildingStore, hint: "Sell & stream"  },
                ].map(({ key, label, Icon, hint }) => {
                  const active = role === key;
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setRole(key)}
                      className={`
                        rounded-xl p-3 text-left border transition-all duration-200
                        focus-visible:ring-2 focus-visible:ring-coral focus-visible:outline-none
                        ${active
                          ? "border-coral bg-coral/5 shadow-sm"
                          : "border-ink/8 bg-white/60 hover:border-ink/20 hover:bg-white"}
                      `}
                    >
                      <Icon className={`text-base ${active ? "text-coral" : "text-ink/70"}`} />
                      <p className="mt-1.5 font-jakarta font-semibold text-xs text-ink">{label}</p>
                      <p className="text-[10px] text-ink/50 font-jakarta mt-0.5">{hint}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── form ── */}
            <form onSubmit={submit} className="mt-5 space-y-3" noValidate>
              <Input
                label="Full name"
                autoComplete="name"
                leftIcon={<HiOutlineUser />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                type="email"
                label="Email"
                autoComplete="email"
                leftIcon={<HiOutlineEnvelope />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                label="Password"
                autoComplete="new-password"
                leftIcon={<HiOutlineLockClosed />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />

              {/* seller-only fields with animated mount/unmount */}
              <AnimatePresence initial={false}>
                {role === "seller" && (
                  <motion.div
                    key="seller-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="space-y-3 overflow-hidden"
                  >
                    <Input
                      label="Shop name"
                      leftIcon={<HiOutlineBuildingStorefront />}
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      required
                    />

                    {/* category select */}
                    <label className="block">
                      <span className="block mb-1.5 text-xs font-jakarta font-semibold text-ink/75">
                        Category
                      </span>
                      <div className="relative">
                        <select
                          value={shopCategory}
                          onChange={(e) => setShopCategory(e.target.value)}
                          className="
                            w-full appearance-none rounded-xl
                            bg-white/80 border border-ink/10
                            focus:border-coral focus:ring-1 focus:ring-coral
                            outline-none
                            pl-3 pr-8 py-2.5
                            text-xs text-ink font-jakarta
                            cursor-pointer transition
                          "
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <HiOutlineChevronDown
                          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 text-sm"
                        />
                      </div>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              <Input
                label="Referral code (optional)"
                autoComplete="off"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              />

              <Button
                type="submit"
                className="w-full mt-2"
                size="md"
                rightIcon={<HiOutlineArrowLongRight />}
                disabled={loading}
              >
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>

            {/* ── fine print ── */}
            <p className="mt-5 text-[10px] text-ink/40 font-jakarta text-center leading-relaxed">
              By creating an account you agree to Lokaly's{" "}
              <Link to="/terms" className="underline underline-offset-2 hover:text-ink/60 transition">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="underline underline-offset-2 hover:text-ink/60 transition">
                Privacy Policy
              </Link>
              .
            </p>

          </div>
        </Reveal>
      </main>
    </div>
  );
}
