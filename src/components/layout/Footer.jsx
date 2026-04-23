import { Link } from "react-router-dom";
import { FiGithub, FiInstagram, FiYoutube, FiTwitter } from "react-icons/fi";
import { HiOutlineHeart } from "react-icons/hi2";

export default function Footer() {
  return (
    <footer className="mt-12 bg-ink text-cream">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-10 grid grid-cols-2 md:grid-cols-5 gap-6">
        {/* Brand block */}
        <div className="col-span-2 md:col-span-2">
          <div className="flex items-center gap-1.5">
            <span className="w-8 h-8 rounded-xl bg-coral-gradient grid place-items-center text-white font-fraunces text-sm">
              L
            </span>
            <span className="font-fraunces text-lg tracking-tight">Lokaly</span>
          </div>

          <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-butter mt-3 mb-1.5">
            Local love, big stories
          </div>

          <p className="text-xs text-cream/65 max-w-sm leading-relaxed font-jakarta">
            India's social commerce hub for artisans, home-kitchens, and
            neighbourhood shops. Built on trust, karma, and community coins.
          </p>

          <div className="flex gap-1.5 mt-4">
            {[
              { Icon: FiGithub, label: "GitHub" },
              { Icon: FiInstagram, label: "Instagram" },
              { Icon: FiYoutube, label: "YouTube" },
              { Icon: FiTwitter, label: "Twitter" },
            ].map(({ Icon, label }, i) => (
              <a
                key={i}
                href="#"
                aria-label={label}
                className="w-8 h-8 rounded-full grid place-items-center bg-cream/10 hover:bg-coral text-cream transition"
              >
                <Icon className="text-sm" />
              </a>
            ))}
          </div>
        </div>

        <FooterCol
          title="Shop"
          items={[
            { to: "/products", label: "All products" },
            { to: "/feed", label: "Social feed" },
            { to: "/live", label: "Live now" },
            { to: "/leaderboard", label: "Local heroes" },
          ]}
        />
        <FooterCol
          title="Sell"
          items={[
            { to: "/signup?role=seller", label: "Become a seller" },
            { to: "/cohosts", label: "Find a co-host" },
            { to: "/dashboard", label: "Seller dashboard" },
          ]}
        />
        <FooterCol
          title="Lokaly"
          items={[
            { to: "/coins", label: "Community coins" },
            { to: "/ar-tryon", label: "AR try-on" },
            { to: "/voice", label: "Voice shop" },
          ]}
        />
      </div>

      <div className="border-t border-cream/10 py-4 px-4 text-center text-[10px] text-cream/50 font-jakarta flex items-center justify-center gap-1 flex-wrap">
        Made with
        <HiOutlineHeart className="text-coral text-sm" />
        in Bengaluru
        <span className="text-cream/20 mx-1">·</span>
        <span>© {new Date().getFullYear()} Lokaly</span>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }) {
  return (
    <div>
      <h5 className="font-jakarta font-semibold text-peach text-[10px] uppercase tracking-[0.2em] mb-2.5">
        {title}
      </h5>
      <ul className="space-y-1.5">
        {items.map((i) => (
          <li key={i.to}>
            <Link
              to={i.to}
              className="text-xs text-cream/65 hover:text-cream transition font-jakarta"
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
