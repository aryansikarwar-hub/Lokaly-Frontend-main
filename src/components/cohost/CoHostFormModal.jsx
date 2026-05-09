import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HiOutlineXMark,
  HiOutlineSparkles,
  HiOutlineTrash,
} from 'react-icons/hi2';
import Button from '../ui/Button';
import {
  applyAsCoHost,
  updateCoHost,
  deleteCoHost,
} from '../../services/cohostApi';

const CATEGORIES = [
  'Sarees',
  'Pottery',
  'Jewellery',
  'Spices',
  'Ethnic Wear',
  'Madhubani Art',
  'Other',
];

const LANGUAGES = [
  { code: 'HI', name: 'Hindi' },
  { code: 'EN', name: 'English' },
  { code: 'TA', name: 'Tamil' },
  { code: 'TE', name: 'Telugu' },
  { code: 'ML', name: 'Malayalam' },
  { code: 'BN', name: 'Bengali' },
  { code: 'PA', name: 'Punjabi' },
  { code: 'GU', name: 'Gujarati' },
  { code: 'MR', name: 'Marathi' },
  { code: 'KN', name: 'Kannada' },
];

const emptyForm = {
  name: '',
  bio: '',
  profileImage: '',
  category: 'Sarees',
  specialty: '',
  languages: ['EN'],
  perStreamRate: 999,
  location: { city: '', state: '' },
};

export default function CoHostFormModal({
  open,
  onClose,
  existing,         // null = create, object = edit
  onSaved,
  onDeleted,
}) {
  const isEdit = !!existing;
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      if (existing) {
        setForm({
          name: existing.name || '',
          bio: existing.bio || '',
          profileImage: existing.profileImage || '',
          category: existing.category || 'Sarees',
          specialty: existing.specialty || '',
          languages: existing.languages?.length ? existing.languages : ['EN'],
          perStreamRate: existing.perStreamRate || 999,
          location: {
            city: existing.location?.city || '',
            state: existing.location?.state || '',
          },
        });
      } else {
        setForm(emptyForm);
      }
    }
  }, [open, existing]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const updateLoc = (k, v) =>
    setForm((f) => ({ ...f, location: { ...f.location, [k]: v } }));

  const toggleLang = (code) => {
    setForm((f) => {
      const has = f.languages.includes(code);
      const next = has
        ? f.languages.filter((c) => c !== code)
        : [...f.languages, code];
      return { ...f, languages: next };
    });
  };

  const handleSubmit = async () => {
    // Quick validation
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.specialty.trim()) return toast.error('Specialty is required');
    if (!form.location.city.trim()) return toast.error('City is required');
    if (form.languages.length === 0)
      return toast.error('Pick at least one language');
    if (form.perStreamRate < 0) return toast.error('Rate must be positive');

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        perStreamRate: Number(form.perStreamRate),
      };
      const saved = isEdit
        ? await updateCoHost(existing._id, payload)
        : await applyAsCoHost(payload);
      toast.success(isEdit ? 'Profile updated' : 'You are now a co-host! 🎉');
      onSaved?.(saved);
      onClose?.();
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || 'Save failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    if (!confirm('Deactivate your co-host profile? Your existing bookings stay intact.'))
      return;
    setDeleting(true);
    try {
      await deleteCoHost(existing._id);
      toast.success('Profile deactivated');
      onDeleted?.();
      onClose?.();
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || 'Delete failed';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-cream rounded-3xl border border-ink/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-ink/10 grid place-items-center transition"
              aria-label="Close"
            >
              <HiOutlineXMark className="text-ink" />
            </button>

            {/* Header */}
            <div className="p-6 pb-4 border-b border-ink/5">
              <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2 flex items-center gap-1.5">
                <HiOutlineSparkles />
                {isEdit ? 'Edit profile' : 'Become a co-host'}
              </div>
              <h2 className="font-fraunces text-2xl text-ink tracking-tight">
                {isEdit ? 'Update your details' : 'Earn while you host live drops'}
              </h2>
              <p className="text-xs text-ink/55 font-jakarta mt-1.5 max-w-md leading-relaxed">
                Fill out your profile, set your hourly rate, and start receiving
                bookings from sellers across India.
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Profile image URL */}
              <Field label="Profile image URL">
                <input
                  value={form.profileImage}
                  onChange={(e) => update('profileImage', e.target.value)}
                  placeholder="https://… (Cloudinary, etc.)"
                  className={inputCls}
                />
                {form.profileImage && (
                  <img
                    src={form.profileImage}
                    alt=""
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                    className="mt-2 w-20 h-20 rounded-full object-cover border-2 border-mauve/40"
                  />
                )}
              </Field>

              <Field label="Display name">
                <input
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="e.g. Aanya Iyer"
                  className={inputCls}
                />
              </Field>

              <Field label="Short bio">
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => update('bio', e.target.value.slice(0, 500))}
                  placeholder="A line or two about your background and style…"
                  className={`${inputCls} resize-none`}
                />
                <div className="text-[10px] text-ink/40 text-right">
                  {form.bio.length}/500
                </div>
              </Field>

              {/* Category + Specialty */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Category">
                  <select
                    value={form.category}
                    onChange={(e) => update('category', e.target.value)}
                    className={inputCls}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Specialty">
                  <input
                    value={form.specialty}
                    onChange={(e) => update('specialty', e.target.value)}
                    placeholder="Handloom & Sarees"
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* Location */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="City">
                  <input
                    value={form.location.city}
                    onChange={(e) => updateLoc('city', e.target.value)}
                    placeholder="Bengaluru"
                    className={inputCls}
                  />
                </Field>
                <Field label="State (optional)">
                  <input
                    value={form.location.state}
                    onChange={(e) => updateLoc('state', e.target.value)}
                    placeholder="Karnataka"
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* Languages */}
              <Field label="Languages you speak">
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGES.map((l) => {
                    const active = form.languages.includes(l.code);
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => toggleLang(l.code)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-jakarta font-bold transition border ${
                          active
                            ? 'bg-lavender border-mauve text-ink'
                            : 'bg-white/70 border-ink/10 text-ink/60 hover:border-ink/30'
                        }`}
                      >
                        {l.code} <span className="opacity-60 ml-0.5">{l.name}</span>
                      </button>
                    );
                  })}
                </div>
              </Field>

              {/* Rate */}
              <Field label="Per-hour rate (₹)">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50 font-fraunces">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={form.perStreamRate}
                    onChange={(e) => update('perStreamRate', e.target.value)}
                    className={`${inputCls} pl-9 tabular-nums`}
                  />
                </div>
                <div className="text-[10px] text-ink/45 font-jakarta mt-1">
                  Sellers will be charged this rate per hour of streaming.
                </div>
              </Field>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-cream/95 backdrop-blur-sm border-t border-ink/5 p-5 flex items-center justify-between gap-3">
              {isEdit ? (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-jakarta font-semibold text-coral/80 hover:text-coral flex items-center gap-1.5 disabled:opacity-50"
                >
                  <HiOutlineTrash />
                  {deleting ? 'Deactivating…' : 'Deactivate profile'}
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-full text-xs font-jakarta font-semibold text-ink/60 hover:text-ink"
                >
                  Cancel
                </button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting
                    ? 'Saving…'
                    : isEdit
                    ? 'Save changes'
                    : 'Create profile'}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const inputCls =
  'w-full rounded-2xl border border-ink/10 bg-white/70 px-4 py-2.5 text-sm font-jakarta text-ink placeholder:text-ink/30 focus:outline-none focus:border-ink/30 transition';

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/55 mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}