import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiStar,
  HiOutlineUserGroup,
  HiOutlineMapPin,
  HiOutlineVideoCamera,
  HiOutlineFunnel,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineCalendarDays,
} from 'react-icons/hi2';
import { Avatar } from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Reveal } from '../components/animations/Reveal';
import { Tilt } from '../components/animations/Tilt';
import {
  fetchCoHosts,
  fetchMyCoHostProfile,
} from '../services/cohostApi';
import { useAuthStore } from '../store/authStore';
import BookCoHostModal from '../components/cohost/BookCoHostModal';
import CoHostFormModal from '../components/cohost/CoHostFormModal';
import MyBookingsDrawer from '../components/cohost/MyBookingsDrawer';

const FILTERS = ['All', 'Sarees', 'Pottery', 'Jewellery', 'Spices', 'Ethnic Wear'];

export default function CoHosts() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [hosts, setHosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  // Current user's own cohost profile (null if not a cohost)
  const [myProfile, setMyProfile] = useState(null);

  // Modal state
  const [bookingHost, setBookingHost] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showBookings, setShowBookings] = useState(false);

  const loadHosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'All' ? { category: filter } : {};
      const res = await fetchCoHosts(params);
      setHosts(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error('Could not load co-hosts');
      setHosts([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadMyProfile = useCallback(async () => {
    if (!token) {
      setMyProfile(null);
      return;
    }
    try {
      const data = await fetchMyCoHostProfile();
      setMyProfile(data);
    } catch {
      setMyProfile(null);
    }
  }, [token]);

  useEffect(() => {
    loadHosts();
  }, [loadHosts]);

  useEffect(() => {
    loadMyProfile();
  }, [loadMyProfile]);

  const handleBookClick = (host) => {
    if (!token) {
      toast.error('Please log in to book a co-host');
      return;
    }
    if (host.user?._id === user?._id || host.user === user?._id) {
      toast.error("You can't book your own profile");
      return;
    }
    setBookingHost(host);
  };

  const handleCreateClick = () => {
    if (!token) {
      toast.error('Please log in first');
      return;
    }
    setEditing(false);
    setShowFormModal(true);
  };

  const handleEditClick = () => {
    setEditing(true);
    setShowFormModal(true);
  };

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
            {hosts.length} of {total} hosts
          </div>
        </div>
      </Reveal>

      {/* Action bar — Create/Edit profile + My bookings */}
      <Reveal delay={0.04}>
        <div className="mt-5 flex items-center gap-2 flex-wrap">
          {token && (
            <button
              onClick={() => setShowBookings(true)}
              className="px-4 py-2 rounded-full text-xs font-jakarta font-semibold bg-white/80 border border-ink/10 text-ink hover:border-ink/30 transition flex items-center gap-1.5"
            >
              <HiOutlineCalendarDays />
              My bookings
            </button>
          )}

          {token && (
            myProfile ? (
              <button
                onClick={handleEditClick}
                className="px-4 py-2 rounded-full text-xs font-jakarta font-semibold bg-lavender border border-mauve/30 text-ink hover:bg-lavender/80 transition flex items-center gap-1.5"
              >
                <HiOutlinePencil />
                Edit my co-host profile
              </button>
            ) : (
              <button
                onClick={handleCreateClick}
                className="px-4 py-2 rounded-full text-xs font-jakarta font-bold bg-ink text-cream hover:bg-ink/90 transition flex items-center gap-1.5"
              >
                <HiOutlinePlus />
                Become a co-host
              </button>
            )
          )}
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
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-jakarta font-semibold transition border ${
                  isActive
                    ? 'bg-ink text-cream border-ink'
                    : 'bg-white/60 border-ink/5 text-ink/70 hover:border-ink/20'
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* Grid */}
      {loading ? (
        <div className="mt-10 grid place-items-center py-12">
          <Spinner size={36} />
        </div>
      ) : hosts.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white/60 border border-ink/5 p-8 text-center">
          <p className="text-xs text-ink/55 font-jakarta italic">
            No hosts match this filter yet.
          </p>
        </div>
      ) : (
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
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={h.profileImage}
                      name={h.name}
                      size="md"
                      aura={Math.round((h.rating || 4) * 18)}
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
                        {h.rating?.toFixed(1) || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-ink/70 font-jakarta font-semibold">
                    {h.specialty}
                  </div>

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

                  <div className="mt-3 pt-3 border-t border-ink/5 flex items-center justify-between text-[10px] text-ink/50 font-jakarta">
                    <span className="tabular-nums">
                      {h.streamsHosted || 0} streams hosted
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        h.isAvailable ? 'text-leaf' : 'text-ink/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          h.isAvailable ? 'bg-leaf animate-pulse' : 'bg-ink/30'
                        }`}
                      />
                      {h.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-2">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider font-jakarta font-semibold text-ink/45">
                        Per hour
                      </div>
                      <div className="font-fraunces text-lg text-ink tracking-tight mt-0.5 tabular-nums">
                        ₹{h.perStreamRate?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      leftIcon={<HiOutlineVideoCamera />}
                      onClick={() => handleBookClick(h)}
                      disabled={!h.isAvailable}
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

      {/* Modals */}
      <BookCoHostModal
        open={!!bookingHost}
        coHost={bookingHost}
        onClose={() => setBookingHost(null)}
        onBooked={() => {
          loadHosts();
          setShowBookings(true);
        }}
      />

      <CoHostFormModal
        open={showFormModal}
        existing={editing ? myProfile : null}
        onClose={() => setShowFormModal(false)}
        onSaved={(saved) => {
          setMyProfile(saved);
          loadHosts();
        }}
        onDeleted={() => {
          setMyProfile(null);
          loadHosts();
        }}
      />

      <MyBookingsDrawer
        open={showBookings}
        onClose={() => setShowBookings(false)}
      />
    </div>
  );
}