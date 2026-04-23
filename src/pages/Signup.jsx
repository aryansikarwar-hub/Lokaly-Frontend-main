import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineBuildingStorefront,
  HiOutlineArrowLongRight,
  HiOutlineSparkles,
  HiOutlineCheck,
} from "react-icons/hi2";
import { FiUser } from "react-icons/fi";
import { TbBuildingStore } from "react-icons/tb";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Reveal } from "../components/animations/Reveal";

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

export default function Signup() {
  const [params] = useSearchParams();
  const [role, setRole] = useState(
    params.get("role") === "seller" ? "seller" : "buyer",
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
      toast.success("Welcome to Lokaly");
      nav(role === "seller" ? "/dashboard" : "/feed");
    } catch (err) {
      toast.error(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left — marketing panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hidden md:flex items-center justify-center bg-gradient-to-br from-lavender to-peach p-10 relative overflow-hidden"
      >
        <motion.div
          animate={{ rotate: [0, -6, 4, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-white/25 rounded-full blur-2xl"
        />
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-24 -left-20 w-80 h-80 bg-white/15 rounded-full blur-2xl"
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative text-ink max-w-md">
          <div className="text-[10px] uppercase tracking-[0.3em] font-jakarta font-semibold text-coral mb-3">
            Join the bazaar
          </div>
          <h1 className="font-fraunces text-4xl lg:text-5xl leading-[1.08] tracking-tight">
            Every sale is a
            <br />
            small namaste.
          </h1>
          <p className="mt-5 text-sm text-ink/70 font-jakarta leading-relaxed max-w-sm">
            Build your shop, your community, and your trust score — all on one
            platform.
          </p>

          <ul className="mt-7 space-y-3">
            {BENEFITS.map((t, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-start gap-2.5 text-xs text-ink/80 font-jakarta leading-relaxed"
              >
                <span className="w-4 h-4 rounded-full bg-coral/20 grid place-items-center shrink-0 mt-0.5">
                  <HiOutlineCheck className="text-coral text-[10px]" />
                </span>
                <span>{t}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 md:p-8">
        <Reveal>
          <div className="w-full max-w-sm">
            <Link to="/" className="inline-flex items-center gap-1.5 mb-6">
              <span className="w-8 h-8 rounded-xl bg-coral-gradient grid place-items-center text-white font-fraunces text-sm">
                L
              </span>
              <span className="font-fraunces text-lg text-ink">Lokaly</span>
            </Link>

            <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
              Get started
            </div>
            <h2 className="font-fraunces text-2xl md:text-3xl text-ink tracking-tight">
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

            {/* Role selector */}
            <div className="mt-5">
              <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 mb-2">
                I'm joining as
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  {
                    key: "buyer",
                    label: "Shopper",
                    icon: FiUser,
                    hint: "Discover & buy",
                  },
                  {
                    key: "seller",
                    label: "Seller",
                    icon: TbBuildingStore,
                    hint: "Sell & stream",
                  },
                ].map((r) => (
                  <button
                    type="button"
                    key={r.key}
                    onClick={() => setRole(r.key)}
                    className={`rounded-xl p-3 text-left border transition ${
                      role === r.key
                        ? "border-coral bg-coral/5"
                        : "border-ink/5 bg-white/60 hover:border-ink/20"
                    }`}
                  >
                    <r.icon
                      className={`text-base ${
                        role === r.key ? "text-coral" : "text-ink/70"
                      }`}
                    />
                    <div className="mt-1.5 font-jakarta font-semibold text-xs text-ink">
                      {r.label}
                    </div>
                    <div className="text-[10px] text-ink/50 font-jakarta mt-0.5">
                      {r.hint}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-3">
              <Input
                label="Full name"
                leftIcon={<HiOutlineUser />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                type="email"
                label="Email"
                leftIcon={<HiOutlineEnvelope />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                label="Password"
                leftIcon={<HiOutlineLockClosed />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              {role === "seller" && (
                <>
                  <Input
                    label="Shop name"
                    leftIcon={<HiOutlineBuildingStorefront />}
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    required
                  />
                  <label className="block">
                    <span className="block mb-1.5 text-xs font-jakarta font-semibold text-ink/75">
                      Category
                    </span>
                    <select
                      value={shopCategory}
                      onChange={(e) => setShopCategory(e.target.value)}
                      className="w-full rounded-xl bg-white/80 border border-ink/10 focus:border-coral outline-none px-3 py-2.5 text-xs text-ink font-jakarta cursor-pointer transition"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              <Input
                label="Referral code (optional)"
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
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <p className="mt-5 text-[10px] text-ink/40 font-jakarta text-center leading-relaxed">
              By creating an account, you agree to Lokaly's Terms of Service and
              Privacy Policy.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
