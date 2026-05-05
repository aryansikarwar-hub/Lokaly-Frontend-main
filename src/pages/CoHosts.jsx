import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  HiStar,
  HiOutlineUserGroup,
  HiOutlineMapPin,
  HiOutlineVideoCamera,
  HiOutlineFunnel,
} from "react-icons/hi2";
import api from "../services/api";
import { Avatar } from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import { Reveal } from "../components/animations/Reveal";
import { Tilt } from "../components/animations/Tilt";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import BookCoHostModal from "../components/BookCoHostModal";

const FILTERS = [
  { key: "All", value: null },
  { key: "Sarees", value: "Sarees" },
  { key: "Pottery", value: "Pottery" },
  { key: "Jewellery", value: "Jewellery" },
  { key: "Spices", value: "Spices" },
];

export default function CoHosts() {
  const [filter, setFilter] = useState("All");
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHost, setSelectedHost] = useState(null);

  useEffect(() => {
    let cancel = false;
    setLoading(true);

    const filterObj = FILTERS.find((f) => f.key === filter);
    const params = {};
    if (filterObj?.value) params.category = filterObj.value;

    api
      .get("/cohosts", { params })
      .then(({ data }) => {
        if (!cancel) setHosts(data.data || []);
      })
      .catch(() => {
        if (!cancel) setHosts([]);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });

    return () => {
      cancel = true;
    };
  }, [filter]);

  function handleBookClick(host) {
    setSelectedHost(host);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <Reveal>
        <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
          Talent marketplace
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-fraunces text-2xl md:text-3xl text-ink tracking-tight flex items-center gap-2">
              <HiOutlineUserGroup className="text-mauve" />
              Co-host marketplace
            </h1>
            <p className="mt-1.5 max-w-xl text-xs text-ink/55 font-jakarta leading-relaxed">
              Hire a vetted co-host for your next live drop. Every co-host
              carries a karma score, language skills, and a transparent
              per-stream rate.
            </p>
          </div>
          <div className="text-[11px] text-ink/50 font-jakarta">
            {loading ? "Loading..." : `${hosts.length} of ${hosts.length} hosts`}
          </div>
        </div>
      </Reveal>

      {/* Filter chips */}
      <Reveal delay={0.05}>
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <div className="flex items-center gap-1 text-ink/40 shrink-0 pr-1">
            <HiOutlineFunnel className="text-sm" />
            <span className="text-[10px] uppercase tracking-wider font-jakarta font-semibold">
              Filter
            </span>
          </div>
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <motion.button
                whileTap={{ scale: 0.96 }}
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-jakarta font-semibold transition border ${
                  isActive
                    ? "bg-ink text-cream border-ink"
                    : "bg-white/60 border-ink/5 text-ink/70 hover:border-ink/20"
                }`}
              >
                {f.key}
              </motion.button>
            );
          })}
        </div>
      </Reveal>

      {/* Loading state */}
      {loading && (
        <div className="grid place-items-center py-20">
          <Spinner />
        </div>
      )}

      {/* Empty state */}
      {!loading && hosts.length === 0 && (
        <div className="mt-8">
          <EmptyState
            title="No hosts match this filter yet"
            hint="Try a different category or check back soon"
          />
        </div>
      )}

      {/* Host grid */}
      {!loading && hosts.length > 0 && (
        <div className="mt-5 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {hosts.map((h, i) => (
            <motion.div
              key={h._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Tilt max={4}>
                <div className="group rounded-2xl bg-white/80 border border-ink/5 p-4 hover:border-ink/15 transition h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={h.profileImage}
                      name={h.name}
                      size="md"
                      aura={Math.round((h.rating || 0) * 18)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-fraunces text-base text-ink tracking-tight truncate">
                        {h.name}
                      </div>
                      <div className="text-[11px] text-ink/55 font-jakarta flex items-center gap-1 mt-0.5">
                        <HiOutlineMapPin className="text-xs shrink-0" />
                        <span className="truncate">{h.location?.city}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-butter shrink-0">
                      <HiStar className="text-sm fill-butter" />
                      <span className="font-jakarta font-bold text-xs text-ink tabular-nums">
                        {h.rating}
                      </span>
                    </div>
                  </div>

                  {/* Specialty */}
                  <div className="mt-3 text-[11px] text-ink/70 font-jakarta font-semibold">
                    {h.specialty}
                  </div>

                  {/* Languages */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(h.languages || []).map((l) => (
                      <span
                        key={l}
                        className="text-[9px] rounded-full bg-lavender/60 px-1.5 py-0.5 font-jakarta font-bold text-ink tracking-wider"
                      >
                        {l}
                      </span>
                    ))}
                  </div>

                  {/* Streams metric */}
                  <div className="mt-3 pt-3 border-t border-ink/5 flex items-center justify-between text-[10px] text-ink/50 font-jakarta">
                    <span className="tabular-nums">
                      {h.streamsHosted || 0} streams hosted
                    </span>
                    {h.isAvailable !== false ? (
                      <span className="text-leaf flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-leaf animate-pulse" />
                        Available
                      </span>
                    ) : (
                      <span className="text-ink/40 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-ink/30" />
                        Busy
                      </span>
                    )}
                  </div>

                  {/* Rate + CTA */}
                  <div className="mt-4 flex items-end justify-between gap-2">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider font-jakarta font-semibold text-ink/45">
                        Per stream
                      </div>
                      <div className="font-fraunces text-lg text-ink tracking-tight mt-0.5 tabular-nums">
                        ₹{(h.perStreamRate || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      leftIcon={<HiOutlineVideoCamera />}
                      onClick={() => handleBookClick(h)}
                      disabled={h.isAvailable === false}
                    >
                      Book
                    </Button>
                  </div>
                </div>
              </Tilt>
            </motion.div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <BookCoHostModal
        host={selectedHost}
        open={!!selectedHost}
        onClose={() => setSelectedHost(null)}
        onSuccess={() => {
          // Optionally refresh the list
        }}
      />
    </div>
  );
}