import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  SUPPORTED_LANGS,
  getLanguage,
  setLanguage,
} from "../../lib/googleTranslate";
import {
  HiOutlineShoppingBag,
  HiOutlineVideoCamera,
  HiOutlineSparkles,
  HiOutlineGlobeAlt,
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineUserCircle,
  HiOutlineSquares2X2,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineArrowRightOnRectangle,
} from "react-icons/hi2";
import { FiUser } from "react-icons/fi";
import { Avatar } from "../ui/Avatar";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import CoinsWidget from "../../features/coins/CoinsWidget";
import ThemeToggle from "../ThemeToggle";
import VerifiedBadge from "../VerifiedBadge";
import { useTheme } from "../../context/ThemeContext";
import { useEffect, useRef, useState } from "react";

function renderVerifiedBadge(user, size = 12) {
  if (!user) return null;
  const verified = user.isVerifiedSeller === true || user.isEmailVerified === true;
  if (!verified) return null;
  const title = user.isVerifiedSeller === true ? "Verified seller" : "Email verified";
  return <VerifiedBadge isVerifiedSeller size={size} title={title} />;
}

const links = [
  { to: "/feed", label: "Feed", icon: HiOutlineSparkles },
  { to: "/products", label: "Shop", icon: HiOutlineShoppingBag },
  { to: "/live", label: "Live", icon: HiOutlineVideoCamera },
  { to: "/leaderboard", label: "Leaderboard", icon: HiOutlineGlobeAlt },
];

function resolveRole(user) {
  if (user?.role) return user.role;
  try {
    const raw = localStorage.getItem("lokaly.user");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.role) return parsed.role;
    }
  } catch (_) {}
  return "buyer";
}

function resolveUserId(user) {
  return user?._id || user?.id || "me";
}

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { cart, fetch } = useCartStore();
  const cartCount = (cart?.items || []).reduce((s, i) => s + i.quantity, 0);
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  const role = resolveRole(user);
  const myId = resolveUserId(user);
  const dashboardPath =
    role === "buyer" ? "/buyer/dashboard" : "/dashboard";

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    try { localStorage.removeItem("lokaly.user"); } catch (_) {}
    navigate("/login");
  };

  useEffect(() => {
    if (user) fetch();
  }, [user, fetch]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-40 backdrop-blur-xl bg-cream/80 dark:bg-ink/80 border-b border-ink/5 dark:border-white/5"
      >
        <div className="max-w-7xl mx-auto px-3 lg:px-6 py-2 flex items-center gap-2 lg:gap-3">
          <Link to="/" className="flex items-center gap-1.5 shrink-0">
            <span className="w-8 h-8 rounded-xl bg-coral-gradient shadow-pop grid place-items-center text-white font-fraunces text-sm">
              L
            </span>
            <span className="font-fraunces text-base text-ink tracking-tight">
              Lokaly
            </span>
            <span className="hidden xl:inline-block text-[10px] uppercase tracking-[0.2em] text-ink/40 font-jakarta font-semibold ml-2 whitespace-nowrap">
              Local love, live
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-0.5 ml-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-2.5 py-1.5 rounded-full font-jakarta text-xs font-semibold flex items-center gap-1 transition whitespace-nowrap ${
                    isActive
                      ? "bg-peach text-ink"
                      : "text-ink/70 hover:bg-peach/50"
                  }`
                }
              >
                <l.icon className="text-sm" />
                {l.label}
              </NavLink>
            ))}
          </div>

          <div className="flex-1" />

          <div className="hidden xl:flex items-center gap-1.5 bg-white/70 rounded-full px-2.5 py-1.5 border border-ink/5 w-48 focus-within:border-ink/20 transition">
            <HiOutlineMagnifyingGlass className="text-ink/50 shrink-0 text-sm" />
            <input
              placeholder="Search sarees, pickles..."
              className="bg-transparent outline-none flex-1 text-xs placeholder:text-ink/40 min-w-0 font-jakarta"
            />
          </div>

          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="xl:hidden w-8 h-8 grid place-items-center rounded-full hover:bg-peach/60 text-ink shrink-0"
            aria-label="Search"
          >
            <HiOutlineMagnifyingGlass className="text-base" />
          </button>

          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>

          {user && (
            <div className="hidden lg:inline-flex shrink-0">
              <CoinsWidget />
            </div>
          )}

          <Link
            to="/cart"
            className="relative w-8 h-8 grid place-items-center rounded-full hover:bg-peach/60 text-ink shrink-0"
            aria-label="Cart"
          >
            <HiOutlineShoppingBag className="text-base" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-coral text-white text-[9px] font-bold rounded-full w-4 h-4 grid place-items-center">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            className="hidden sm:grid w-8 h-8 place-items-center rounded-full hover:bg-peach/60 dark:hover:bg-white/10 text-ink dark:text-cream shrink-0"
            aria-label="Notifications"
          >
            <HiOutlineBell className="text-base" />
          </button>

          <ThemeToggle />

          {user ? (
            <div className="relative shrink-0" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                aria-label="Profile menu"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-coral/50"
              >
                <Avatar
                  src={user.avatar}
                  name={user.name}
                  size="xs"
                  aura={user.trustScore}
                />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    role="menu"
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-cream dark:bg-ink border border-ink/5 dark:border-white/10 shadow-xl p-1 z-50"
                  >
                    <div className="px-3 py-2 border-b border-ink/5 dark:border-white/10">
                      <div className="font-jakarta font-semibold text-xs text-ink dark:text-cream truncate flex items-center gap-1">
                        <span className="truncate">{user.name || "You"}</span>
                        {renderVerifiedBadge(user, 12)}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider font-jakarta font-semibold text-ink/50 dark:text-cream/50 mt-0.5">
                        {role}
                      </div>
                    </div>
                    <button
                      onClick={() => { setProfileOpen(false); navigate(`/profile/${myId}`); }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-jakarta font-semibold text-ink/80 dark:text-cream/80 hover:bg-peach/60 dark:hover:bg-white/10 transition"
                      role="menuitem"
                    >
                      <HiOutlineUserCircle className="text-base" /> View Profile
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); navigate(dashboardPath); }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-jakarta font-semibold text-ink/80 dark:text-cream/80 hover:bg-peach/60 dark:hover:bg-white/10 transition"
                      role="menuitem"
                    >
                      <HiOutlineSquares2X2 className="text-base" /> Dashboard
                    </button>
                    <button
                      onClick={() => { toggleTheme(); }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-jakarta font-semibold text-ink/80 dark:text-cream/80 hover:bg-peach/60 dark:hover:bg-white/10 transition"
                      role="menuitem"
                    >
                      {theme === "dark" ? <HiOutlineSun className="text-base" /> : <HiOutlineMoon className="text-base" />}
                      Theme: {theme === "dark" ? "Dark" : "Light"}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-jakarta font-semibold text-coral hover:bg-coral/10 transition"
                      role="menuitem"
                    >
                      <HiOutlineArrowRightOnRectangle className="text-base" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-ink text-cream text-xs font-jakarta font-semibold hover:bg-ink/90 shrink-0 whitespace-nowrap"
            >
              <FiUser className="text-xs" /> Log in
            </Link>
          )}

          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-8 h-8 grid place-items-center rounded-full hover:bg-peach/60 text-ink shrink-0"
            aria-label="Menu"
          >
            <HiOutlineBars3 className="text-xl" />
          </button>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="xl:hidden overflow-hidden border-t border-ink/5 bg-cream/80 backdrop-blur-xl"
            >
              <div className="max-w-7xl mx-auto px-3 lg:px-6 py-2">
                <div className="flex items-center gap-1.5 bg-white/80 rounded-full px-3 py-2 border border-ink/5">
                  <HiOutlineMagnifyingGlass className="text-ink/50 shrink-0 text-sm" />
                  <input
                    autoFocus
                    placeholder="Search sarees, pickles, pottery..."
                    className="bg-transparent outline-none flex-1 text-xs placeholder:text-ink/40 min-w-0 font-jakarta"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[80%] max-w-xs bg-cream shadow-2xl lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-ink/10">
                <div className="flex items-center gap-1.5">
                  <span className="w-8 h-8 rounded-xl bg-coral-gradient shadow-pop grid place-items-center text-white font-fraunces text-sm">
                    L
                  </span>
                  <span className="font-fraunces text-base text-ink tracking-tight">
                    Lokaly
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 grid place-items-center rounded-full hover:bg-peach/60 text-ink"
                  aria-label="Close menu"
                >
                  <HiOutlineXMark className="text-xl" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-3">
                {user ? (
                  <Link
                    to={`/profile/${myId}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-ink/5 dark:border-white/10 mb-3"
                  >
                    <Avatar
                      src={user.avatar}
                      name={user.name}
                      size="sm"
                      aura={user.trustScore}
                    />
                    <div className="min-w-0">
                      <div className="font-jakarta font-semibold text-ink text-xs truncate flex items-center gap-1">
                        <span className="truncate">{user.name}</span>
                        {renderVerifiedBadge(user, 12)}
                      </div>
                      <div className="text-[10px] text-ink/55 font-jakarta mt-0.5">
                        View profile →
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-ink text-cream text-xs font-jakarta font-semibold mb-3"
                  >
                    <FiUser className="text-sm" /> Log in
                  </Link>
                )}

                {user && (
                  <div className="mb-3">
                    <CoinsWidget />
                  </div>
                )}

                <div className="text-[9px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/40 px-2 mb-1.5">
                  Navigate
                </div>
                <div className="space-y-0.5">
                  {links.map((l) => (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-jakarta font-semibold text-xs transition ${
                          isActive
                            ? "bg-peach text-ink"
                            : "text-ink/75 hover:bg-peach/50"
                        }`
                      }
                    >
                      <l.icon className="text-base" />
                      {l.label}
                    </NavLink>
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-ink/10">
                  <div className="text-[9px] font-jakarta font-semibold text-ink/40 px-2 mb-1.5 uppercase tracking-[0.2em]">
                    Language
                  </div>
                  <LanguageSwitcher fullWidth />
                </div>
              </nav>

              <div className="px-4 py-3 border-t border-ink/10">
                <div className="text-center text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-ink/40">
                  Local love, live
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function LanguageSwitcher({ fullWidth = false }) {
  const [open, setOpen] = useState(false);
  const current = getLanguage();
  const currentLang =
    SUPPORTED_LANGS.find((l) => l.code === current) || SUPPORTED_LANGS[0];

  return (
    <div className={`relative ${fullWidth ? "w-full" : ""}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 rounded-full bg-white/70 border border-ink/5 px-2.5 py-1 text-[10px] font-jakarta font-bold uppercase tracking-wider text-ink/70 hover:text-ink transition notranslate ${
          fullWidth ? "w-full justify-between" : ""
        }`}
        translate="no"
        aria-label="Change language"
      >
        <HiOutlineGlobeAlt className="text-sm" />
        <span>{currentLang.label}</span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute z-50 mt-1.5 rounded-2xl bg-cream border border-ink/5 shadow-xl p-1 max-h-72 overflow-auto notranslate ${
                fullWidth ? "left-0 right-0" : "right-0 w-44"
              }`}
              translate="no"
            >
              {SUPPORTED_LANGS.map((l) => {
                const active = l.code === current;
                return (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-jakarta font-semibold transition ${
                      active
                        ? "bg-lavender text-ink"
                        : "text-ink/70 hover:bg-peach/60 hover:text-ink"
                    }`}
                  >
                    <span className="inline-grid place-items-center w-7 text-[10px] font-bold uppercase tracking-wider text-ink/60">
                      {l.label}
                    </span>
                    <span>{l.name}</span>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
