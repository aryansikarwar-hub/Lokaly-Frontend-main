import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineCamera,
  HiOutlineInformationCircle,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { FaRegEye } from "react-icons/fa6";
import Button from "../components/ui/Button";
import { Reveal } from "../components/animations/Reveal";

const ITEMS = [
  {
    id: "aviator",
    label: "Aviator",
    brand: "Lenskart Air",
    price: 1499,
    top: "32%",
    width: "42%",
  },
  {
    id: "round",
    label: "Wayfarer",
    brand: "Ray-Ban Classic",
    price: 2499,
    top: "30%",
    width: "46%",
  },
  {
    id: "cat-eye",
    label: "Cat-eye",
    brand: "Vincent Chase",
    price: 1299,
    top: "34%",
    width: "44%",
  },
];

export default function ARTryOn() {
  const videoRef = useRef(null);
  const [active, setActive] = useState(ITEMS[0]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setError(
          "Camera access was denied. Grant permission to try this feature.",
        );
      }
    })();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

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
        <div className="relative rounded-2xl overflow-hidden bg-ink/10 aspect-[4/3] border border-ink/5">
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
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          )}

          {/* Glasses overlay */}
          {!error && (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 0.85, y: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 18 }}
              style={{ top: active.top, width: active.width }}
              className="absolute left-1/2 -translate-x-1/2 rounded-full bg-ink border-[6px] border-ink aspect-[3/1] pointer-events-none"
            />
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
              Demo overlay. Full MindAR face-tracking kicks in during the live
              demo.
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
