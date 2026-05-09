import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineCamera,
  HiOutlineInformationCircle,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { FaRegEye } from "react-icons/fa6";
import Button from "../components/ui/Button";
import { Reveal } from "../components/animations/Reveal";

/* ---------- Frame catalog ----------
   Each frame is an inline SVG renderer. This keeps things zero-asset,
   instant-load, and perfectly themable. Each renderer receives the
   pixel width of the glasses and returns an SVG string.
------------------------------------ */

const FRAMES = {
  aviator: {
    id: "aviator",
    label: "Aviator",
    brand: "Lenskart Air",
    price: 1499,
    widthScale: 2.15, // glasses width = eye-distance * widthScale
    yOffset: -0.05, // vertical nudge (% of glasses height)
    render: (w) => {
      const h = w * 0.42;
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 200 84">
          <defs>
            <linearGradient id="lens-av" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#1a1a1a" stop-opacity="0.55"/>
              <stop offset="100%" stop-color="#3a3a3a" stop-opacity="0.35"/>
            </linearGradient>
          </defs>
          <!-- left lens (teardrop) -->
          <path d="M10 28 Q10 14 30 12 L78 12 Q88 12 86 26 L82 58 Q78 74 56 74 Q22 74 14 50 Z"
            fill="url(#lens-av)" stroke="#d4af37" stroke-width="3"/>
          <!-- right lens -->
          <path d="M190 28 Q190 14 170 12 L122 12 Q112 12 114 26 L118 58 Q122 74 144 74 Q178 74 186 50 Z"
            fill="url(#lens-av)" stroke="#d4af37" stroke-width="3"/>
          <!-- bridge -->
          <path d="M86 22 Q100 18 114 22" stroke="#d4af37" stroke-width="3" fill="none"/>
          <!-- top bar -->
          <path d="M30 12 Q100 6 170 12" stroke="#d4af37" stroke-width="2" fill="none"/>
          <!-- temples -->
          <path d="M10 30 L0 28" stroke="#d4af37" stroke-width="3" fill="none"/>
          <path d="M190 30 L200 28" stroke="#d4af37" stroke-width="3" fill="none"/>
        </svg>`;
    },
  },
  round: {
    id: "round",
    label: "Wayfarer",
    brand: "Ray-Ban Classic",
    price: 2499,
    widthScale: 2.25,
    yOffset: 0,
    render: (w) => {
      const h = w * 0.4;
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 200 80">
          <defs>
            <linearGradient id="lens-wf" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0a0a0a" stop-opacity="0.7"/>
              <stop offset="100%" stop-color="#1a1a1a" stop-opacity="0.5"/>
            </linearGradient>
          </defs>
          <!-- left lens (trapezoidal) -->
          <path d="M8 22 Q10 12 22 10 L82 10 Q92 10 92 22 L88 58 Q86 70 72 70 L26 70 Q12 70 10 58 Z"
            fill="url(#lens-wf)" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
          <!-- right lens -->
          <path d="M192 22 Q190 12 178 10 L118 10 Q108 10 108 22 L112 58 Q114 70 128 70 L174 70 Q188 70 190 58 Z"
            fill="url(#lens-wf)" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>
          <!-- bridge -->
          <path d="M92 24 L108 24" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
          <!-- temples -->
          <path d="M8 28 L0 24" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
          <path d="M192 28 L200 24" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
        </svg>`;
    },
  },
  "cat-eye": {
    id: "cat-eye",
    label: "Cat-eye",
    brand: "Vincent Chase",
    price: 1299,
    widthScale: 2.2,
    yOffset: -0.03,
    render: (w) => {
      const h = w * 0.38;
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 200 76">
          <defs>
            <linearGradient id="lens-ce" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2a1a3a" stop-opacity="0.6"/>
              <stop offset="100%" stop-color="#4a2a5a" stop-opacity="0.4"/>
            </linearGradient>
          </defs>
          <!-- left lens (cat-eye sweep) -->
          <path d="M6 30 Q4 14 24 10 L78 10 Q92 10 94 24 L92 50 Q88 64 70 66 L28 66 Q10 64 6 48 Z"
            fill="url(#lens-ce)" stroke="#7a3a8a" stroke-width="3.5" stroke-linejoin="round"/>
          <!-- right lens -->
          <path d="M194 30 Q196 14 176 10 L122 10 Q108 10 106 24 L108 50 Q112 64 130 66 L172 66 Q190 64 194 48 Z"
            fill="url(#lens-ce)" stroke="#7a3a8a" stroke-width="3.5" stroke-linejoin="round"/>
          <!-- pointed corners -->
          <path d="M6 30 L0 18" stroke="#7a3a8a" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M194 30 L200 18" stroke="#7a3a8a" stroke-width="3.5" stroke-linecap="round"/>
          <!-- bridge -->
          <path d="M94 22 Q100 18 106 22" stroke="#7a3a8a" stroke-width="3.5" fill="none"/>
        </svg>`;
    },
  },
};

const ITEMS = [FRAMES.aviator, FRAMES.round, FRAMES["cat-eye"]];

/* ---------- MediaPipe loader (CDN, no install) ---------- */
const MP_VISION_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let mpModulePromise = null;
function loadMediaPipe() {
  if (!mpModulePromise) {
    mpModulePromise = import(/* @vite-ignore */ `${MP_VISION_URL}/vision_bundle.mjs`);
  }
  return mpModulePromise;
}

export default function ARTryOn() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const smoothRef = useRef(null); // smoothed transform state

  const [active, setActive] = useState(ITEMS[0]);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | tracking | no-face | error
  const activeRef = useRef(active);
  activeRef.current = active;

  /* ----- Initialize: camera + MediaPipe model ----- */
  useEffect(() => {
    let stream;
    let cancelled = false;

    (async () => {
      // 1. camera
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise((res) => {
            if (!videoRef.current) return res();
            videoRef.current.onloadedmetadata = () => res();
          });
        }
      } catch (e) {
        setError("Camera access was denied. Grant permission to try this feature.");
        return;
      }

      // 2. MediaPipe model
      try {
        const vision = await loadMediaPipe();
        const { FilesetResolver, FaceLandmarker } = vision;
        const fileset = await FilesetResolver.forVisionTasks(`${MP_VISION_URL}/wasm`);
        const landmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
          runningMode: "VIDEO",
          numFaces: 1,
        });
        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
        setStatus("no-face");
        startTracking();
      } catch (e) {
        console.error("[AR] model load failed", e);
        setError("Face-tracking model failed to load. Check your connection and refresh.");
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ----- Tracking loop ----- */
  const startTracking = useCallback(() => {
    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !canvas || !landmarker || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Match canvas size to displayed video
      const rect = video.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const t = performance.now();
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        const result = landmarker.detectForVideo(video, t);
        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          drawGlasses(ctx, canvas, result.faceLandmarks[0]);
          if (statusRef.current !== "tracking") setStatus("tracking");
        } else {
          smoothRef.current = null;
          if (statusRef.current !== "no-face") setStatus("no-face");
        }
      } else if (smoothRef.current) {
        // redraw with last known transform for smoother feel
        drawGlassesFromTransform(ctx, canvas, smoothRef.current);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // status ref so loop doesn't trigger re-renders unnecessarily
  const statusRef = useRef(status);
  statusRef.current = status;

  /* ----- Compute glasses transform from landmarks ----- */
  const drawGlasses = (ctx, canvas, landmarks) => {
    // MediaPipe face landmark indices:
    //  - 33  : left eye outer corner
    //  - 263 : right eye outer corner
    //  - 133 : left eye inner corner
    //  - 362 : right eye inner corner
    //  - 168 : nose bridge top (between eyes)
    //  - 6   : nose bridge mid
    const W = canvas.width;
    const H = canvas.height;

    // Note: video is mirrored via CSS (scale-x-[-1]). We must mirror X coords too.
    const toPx = (lm) => ({ x: (1 - lm.x) * W, y: lm.y * H, z: lm.z });

    const leftEyeOuter = toPx(landmarks[33]);
    const rightEyeOuter = toPx(landmarks[263]);
    const noseBridge = toPx(landmarks[168]);

    // Center between eyes
    const cx = (leftEyeOuter.x + rightEyeOuter.x) / 2;
    const cy = (leftEyeOuter.y + rightEyeOuter.y) / 2;

    // Eye distance (used for sizing)
    const dx = rightEyeOuter.x - leftEyeOuter.x;
    const dy = rightEyeOuter.y - leftEyeOuter.y;
    const eyeDist = Math.hypot(dx, dy);

    // Head roll (rotation in image plane)
    const angle = Math.atan2(dy, dx);

    // Use nose bridge for vertical anchoring (more stable than eye-center alone)
    const anchorY = (cy + noseBridge.y * 0.6) / 1.6;

    const target = { cx, cy: anchorY, eyeDist, angle };

    // Smooth (low-pass) to reduce jitter
    const prev = smoothRef.current;
    const a = prev ? 0.35 : 1; // smoothing factor; first frame snaps in
    const smoothed = prev
      ? {
          cx: prev.cx + (target.cx - prev.cx) * a,
          cy: prev.cy + (target.cy - prev.cy) * a,
          eyeDist: prev.eyeDist + (target.eyeDist - prev.eyeDist) * a,
          angle: prev.angle + shortestAngleDelta(prev.angle, target.angle) * a,
        }
      : target;
    smoothRef.current = smoothed;

    drawGlassesFromTransform(ctx, canvas, smoothed);
  };

  const drawGlassesFromTransform = (ctx, canvas, t) => {
    const frame = FRAMES[activeRef.current.id];
    if (!frame) return;

    const glassesW = t.eyeDist * frame.widthScale;
    const img = getFrameImage(frame, glassesW);
    if (!img || !img.complete) return;

    const drawW = glassesW;
    const drawH = (img.naturalHeight / img.naturalWidth) * drawW;
    const yNudge = drawH * frame.yOffset;

    ctx.save();
    ctx.translate(t.cx, t.cy + yNudge);
    ctx.rotate(t.angle);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  };

  /* ----- Cache rendered SVG -> Image objects ----- */
  const imageCacheRef = useRef(new Map());
  const getFrameImage = (frame, width) => {
    // Bucket width to avoid generating an image every frame
    const bucket = Math.round(width / 10) * 10;
    const key = `${frame.id}_${bucket}`;
    const cache = imageCacheRef.current;
    if (cache.has(key)) return cache.get(key);

    const svg = frame.render(bucket);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    cache.set(key, img);
    // cleanup eventually
    img.onload = () => {
      // we keep url alive — small footprint, reused across frames
    };
    return img;
  };

  // Clear smoothing when switching frames so the new one snaps in cleanly
  useEffect(() => {
    smoothRef.current = null;
  }, [active]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10">
      <Reveal>
        <div className="text-[10px] uppercase tracking-[0.25em] font-jakarta font-semibold text-coral mb-2">
          Virtual fitting room
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-fraunces text-2xl md:text-3xl text-ink tracking-tight flex items-center gap-2">
              <FaRegEye className="text-mauve" />
              AR try-on
            </h1>
            <p className="mt-1 text-xs text-ink/55 font-jakarta max-w-md">
              Preview frames on your face before checkout. On-device, no upload.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lavender/50 border border-ink/5 text-[10px] font-jakarta font-semibold text-mauve uppercase tracking-wide">
            <HiOutlineSparkles className="text-xs" />
            Beta
          </div>
        </div>
      </Reveal>

      <div className="mt-6 grid md:grid-cols-[1fr_280px] gap-4">
        {/* Camera viewport */}
        <div
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden bg-ink/10 aspect-[4/3] border border-ink/5"
        >
          {error ? (
            <div className="w-full h-full grid place-items-center p-8">
              <div className="text-center max-w-xs">
                <div className="w-10 h-10 rounded-full bg-coral/15 text-coral grid place-items-center mx-auto mb-2">
                  <HiOutlineInformationCircle className="text-base" />
                </div>
                <p className="text-xs text-ink/70 font-jakarta leading-relaxed">
                  {error}
                </p>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            </>
          )}

          {/* Status pill */}
          {!error && (
            <div className="absolute top-3 left-3">
              <motion.div
                key={status}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-2.5 py-1 rounded-full bg-ink/70 backdrop-blur-md text-cream text-[10px] font-jakarta font-semibold uppercase tracking-wider flex items-center gap-1.5"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    status === "tracking"
                      ? "bg-emerald-400 animate-pulse"
                      : status === "no-face"
                      ? "bg-amber-400"
                      : "bg-coral animate-pulse"
                  }`}
                />
                {status === "loading" && "Loading model…"}
                {status === "no-face" && "Looking for face…"}
                {status === "tracking" && "Tracking"}
              </motion.div>
            </div>
          )}

          {/* Bottom product badge */}
          {!error && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
              <div className="px-3 py-1.5 rounded-full bg-ink/80 backdrop-blur-md text-cream flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
                <span className="text-[10px] font-jakarta font-semibold uppercase tracking-wider">
                  Trying: {active.label}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-cream/90 backdrop-blur text-ink font-fraunces text-sm tracking-tight">
                ₹{active.price.toLocaleString("en-IN")}
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <aside className="space-y-3">
          <div className="rounded-xl bg-lavender/40 border border-ink/5 p-3 flex items-start gap-2">
            <HiOutlineInformationCircle className="text-mauve text-base shrink-0 mt-0.5" />
            <p className="text-[11px] font-jakarta text-ink/70 leading-relaxed">
              Live face-tracking via MediaPipe. Move your head — frames follow.
              Everything runs on your device.
            </p>
          </div>

          <div className="rounded-2xl bg-white/80 border border-ink/5 p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] font-jakarta font-semibold text-ink/50 px-1 mb-2">
              Available frames
            </div>
            <div className="space-y-1">
              {ITEMS.map((it) => {
                const isActive = active.id === it.id;
                return (
                  <button
                    key={it.id}
                    onClick={() => setActive(it)}
                    className={`w-full text-left rounded-xl p-2.5 transition border ${
                      isActive
                        ? "bg-ink text-cream border-ink"
                        : "bg-transparent border-transparent hover:bg-peach/40 text-ink"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-jakarta font-semibold text-xs">
                          {it.label}
                        </div>
                        <div
                          className={`text-[10px] font-jakarta mt-0.5 truncate ${
                            isActive ? "text-cream/60" : "text-ink/50"
                          }`}
                        >
                          {it.brand}
                        </div>
                      </div>
                      <div className="font-fraunces text-sm tracking-tight shrink-0">
                        ₹{it.price.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button className="w-full" size="md" leftIcon={<HiOutlineCamera />}>
            Add {active.label} to cart
          </Button>
        </aside>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */
function shortestAngleDelta(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}