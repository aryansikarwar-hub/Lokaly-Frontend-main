import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlinePhoto,
  HiOutlineSparkles,
  HiOutlineMusicalNote,
  HiOutlinePlayCircle,
} from "react-icons/hi2";
import Button from "../components/ui/Button";
import MediaUploader from "../components/ui/MediaUploader";
import { Reveal } from "../components/animations/Reveal";

const SCRIPTS = [
  {
    at: 0,
    caption: "Naya stock just dropped",
    transform: { scale: 1.02, rotate: 0 },
  },
  {
    at: 1,
    caption: "Straight from the karigar",
    transform: { scale: 1.1, rotate: -1 },
  },
  {
    at: 2,
    caption: "Handwoven in Varanasi",
    transform: { scale: 1.15, rotate: 0.5 },
  },
  {
    at: 3,
    caption: "Only 5 pieces left",
    transform: { scale: 1.05, rotate: 0 },
  },
  {
    at: 4,
    caption: "Shop live tonight, 7 PM",
    transform: { scale: 1.1, rotate: -0.5 },
  },
];

const TRACKS = [
  { id: "dhol", label: "Dhol Jhooma", mood: "Upbeat" },
  { id: "veena", label: "Veena Groove", mood: "Calm" },
  { id: "indie", label: "Hinglish Indie", mood: "Youthful" },
  { id: "rajasthani", label: "Rajasthani Drift", mood: "Festive" },
];

export default function StoryToReel() {
  const [image, setImage] = useState("");
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);
  const [track, setTrack] = useState(TRACKS[0].id);

  function play() {
    setPlaying(true);
    setFrame(0);
    let i = 0;
    const h = setInterval(() => {
      i += 1;
      if (i >= SCRIPTS.length) {
        clearInterval(h);
        setPlaying(false);
        return;
      }
      setFrame(i);
    }, 2200);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <Reveal>
        <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
          Creator tool
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-fraunces text-2xl md:text-3xl text-ink tracking-tight flex items-center gap-2">
              <HiOutlineSparkles className="text-mauve" />
              Story to reel
            </h1>
            <p className="mt-1 text-xs text-ink/55 font-jakarta max-w-md">
              One photo, fifteen seconds, auto-captioned. Turn any product shot
              into a shareable reel.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lavender/50 border border-white text-[10px] font-jakarta font-semibold text-mauve uppercase tracking-wide">
            <HiOutlineSparkles className="text-xs" />
            Beta
          </div>
        </div>
      </Reveal>

      <div className="mt-6 grid md:grid-cols-[1fr_320px] gap-5">
        {/* Preview phone */}
        <div className="flex justify-center">
          <div className="relative aspect-[9/16] w-full max-w-[280px] rounded-[28px] overflow-hidden bg-ink/90 border-[4px] border-ink shadow-xl">
            {image ? (
              <>
                <AnimatePresence>
                  <motion.img
                    key={frame}
                    src={image}
                    alt=""
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ opacity: 1, ...SCRIPTS[frame].transform }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>

                {/* Top HUD */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between text-white">
                  <div className="flex gap-0.5">
                    {SCRIPTS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-0.5 w-6 rounded-full ${
                          i <= frame ? "bg-white" : "bg-white/30"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[9px] font-jakarta font-semibold uppercase tracking-wider opacity-80">
                    {TRACKS.find((t) => t.id === track)?.label}
                  </div>
                </div>

                {/* Bottom caption */}
                <motion.div
                  key={`cap-${frame}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-5 inset-x-5 text-white font-fraunces text-lg tracking-tight drop-shadow-lg leading-tight"
                >
                  {SCRIPTS[frame].caption}
                </motion.div>
              </>
            ) : (
              <div className="absolute inset-0 grid place-items-center text-white/60 px-6">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-white/10 border border-white/15 grid place-items-center">
                    <HiOutlinePhoto className="text-xl" />
                  </div>
                  <p className="mt-3 text-xs font-jakarta text-white/70 leading-relaxed">
                    Upload a photo to preview your reel
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <aside className="space-y-3">
          {/* Step 1 */}
          <div className="rounded-2xl bg-white/80 border border-ink/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-coral/15 text-coral font-jakarta font-bold text-[10px] grid place-items-center">
                1
              </span>
              <h4 className="font-fraunces text-sm text-ink tracking-tight">
                Upload a photo
              </h4>
            </div>
            <MediaUploader
              value={image}
              onChange={setImage}
              accept="image/*"
              maxSizeMB={10}
            />
          </div>

          {/* Step 2 — audio picker */}
          <div className="rounded-2xl bg-white/80 border border-ink/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-coral/15 text-coral font-jakarta font-bold text-[10px] grid place-items-center">
                2
              </span>
              <h4 className="font-fraunces text-sm text-ink tracking-tight flex items-center gap-1">
                <HiOutlineMusicalNote className="text-mauve text-sm" /> Pick
                audio
              </h4>
            </div>
            <div className="space-y-1">
              {TRACKS.map((t) => {
                const isActive = track === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTrack(t.id)}
                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition border ${
                      isActive
                        ? "bg-butter/80 border-butter"
                        : "bg-transparent border-transparent hover:bg-butter/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <HiOutlinePlayCircle
                        className={`text-base ${isActive ? "text-coral" : "text-ink/40"}`}
                      />
                      <span className="font-jakarta font-semibold text-xs text-ink">
                        {t.label}
                      </span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-jakarta font-semibold text-ink/45">
                      {t.mood}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3 — generate */}
          <div className="rounded-2xl bg-white/80 border border-ink/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-coral/15 text-coral font-jakarta font-bold text-[10px] grid place-items-center">
                3
              </span>
              <h4 className="font-fraunces text-sm text-ink tracking-tight">
                Generate reel
              </h4>
            </div>
            <p className="text-[11px] text-ink/55 font-jakarta leading-relaxed mb-3">
              Auto-captioned, auto-scored. Ready to share in 15 seconds.
            </p>
            <Button
              className="w-full"
              size="md"
              disabled={!image || playing}
              onClick={play}
            >
              {playing ? "Playing reel..." : "Generate 15s reel"}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
