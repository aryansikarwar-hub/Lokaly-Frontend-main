import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineArrowLongRight,
  HiOutlineInformationCircle,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Reveal } from "../components/animations/Reveal";

export default function Login() {
  const [email, setEmail] = useState("demo@lokaly.in");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const [params] = useSearchParams();
  const hydrate = useAuthStore((s) => s.hydrate);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      hydrate(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name.split(" ")[0]}`);
      nav(params.get("next") || "/feed");
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
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
        className="hidden md:flex items-center justify-center bg-coral-gradient p-10 relative overflow-hidden"
      >
        {/* Subtle background shapes */}
        <motion.div
          animate={{ rotate: [0, 6, -4, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-white/15 rounded-full blur-2xl"
        />
        <motion.div
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 right-10 w-72 h-72 bg-white/10 rounded-full blur-2xl"
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative text-white max-w-md">
          <div className="text-[10px] uppercase tracking-[0.3em] font-jakarta font-semibold text-white/80 mb-3">
            Welcome back
          </div>
          <h1 className="font-fraunces text-4xl lg:text-5xl leading-[1.08] tracking-tight">
            Local shops,
            <br />
            big stories.
          </h1>
          <p className="mt-5 font-jakarta text-sm text-white/85 leading-relaxed max-w-sm">
            Sign in to browse the feed, watch a live drop, and meet our Varanasi
            weavers.
          </p>

          {/* Trust strip */}
          <div className="mt-8 flex items-center gap-5 text-[11px] font-jakarta text-white/75">
            <div>
              <div className="font-fraunces text-lg text-white tracking-tight">
                1,240+
              </div>
              <div className="text-[10px] uppercase tracking-wider mt-0.5">
                Artisans
              </div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <div className="font-fraunces text-lg text-white tracking-tight">
                52
              </div>
              <div className="text-[10px] uppercase tracking-wider mt-0.5">
                Cities
              </div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <div className="font-fraunces text-lg text-white tracking-tight">
                98%
              </div>
              <div className="text-[10px] uppercase tracking-wider mt-0.5">
                Trust score
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 md:p-8">
        <Reveal>
          <div className="w-full max-w-sm">
            <Link to="/" className="inline-flex items-center gap-1.5 mb-8">
              <span className="w-8 h-8 rounded-xl bg-coral-gradient grid place-items-center text-white font-fraunces text-sm">
                L
              </span>
              <span className="font-fraunces text-lg text-ink">Lokaly</span>
            </Link>

            <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
              Sign in
            </div>
            <h2 className="font-fraunces text-2xl md:text-3xl text-ink tracking-tight">
              Log in to your account
            </h2>
            <p className="text-xs text-ink/55 mt-1.5 font-jakarta">
              New here?{" "}
              <Link
                to="/signup"
                className="text-coral underline-offset-4 hover:underline font-semibold"
              >
                Create an account
              </Link>
            </p>

            <form onSubmit={submit} className="mt-6 space-y-3">
              <Input
                type="email"
                label="Email"
                leftIcon={<HiOutlineEnvelope />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <Input
                type="password"
                label="Password"
                leftIcon={<HiOutlineLockClosed />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-[11px] text-ink/60 font-jakarta cursor-pointer">
                  <input type="checkbox" className="accent-coral" />
                  Remember me
                </label>
                <Link
                  to="#"
                  className="text-[11px] font-jakarta font-semibold text-ink/60 hover:text-coral transition"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                size="md"
                rightIcon={<HiOutlineArrowLongRight />}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-[10px] text-ink/40 font-jakarta text-center">
              By signing in, you agree to Lokaly's Terms and Privacy Policy.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
