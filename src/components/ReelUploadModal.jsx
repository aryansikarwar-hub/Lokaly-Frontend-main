/**
 * ReelUploadModal.jsx
 * Full-featured reel upload modal:
 *  - File upload via drag-drop or file picker
 *  - Camera recording (if supported by browser)
 *  - Video preview with trim indicator
 *  - Caption + Description fields
 *  - Upload progress with XHR
 *  - Like / Comment / Share work via parent (existing API)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HiOutlineVideoCamera,
  HiOutlineArrowUpTray,
  HiOutlineXMark,
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineCamera,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineFilm,
  HiArrowLeft,
} from "react-icons/hi2";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import toast from "react-hot-toast";

const API_ORIGIN = (() => {
  const raw = import.meta.env.VITE_API_URL;
  if (!raw) return "";
  try { return new URL(raw).origin; } catch { return ""; }
})();

function absolutize(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  if (url.startsWith("/") && API_ORIGIN) return `${API_ORIGIN}${url}`;
  return url;
}

// Upload video file via XHR with progress
function uploadVideoFile(file, token, onProgress) {
  return new Promise((resolve, reject) => {
    const endpoint = `${API_ORIGIN}/api/upload/video`;
    const fd = new FormData();
    fd.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) onProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = () => {
      let parsed;
      try { parsed = JSON.parse(xhr.responseText); } catch { parsed = null; }
      if (xhr.status >= 200 && xhr.status < 300 && parsed?.url) {
        resolve({ url: absolutize(parsed.url), publicId: parsed.publicId || "" });
      } else {
        reject(new Error(parsed?.error || `Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error — check your connection"));
    xhr.send(fd);
  });
}

/* ── Steps ─────────────────────────────────────────────── */
const STEP_PICK   = "pick";    // Choose: upload or camera
const STEP_CAMERA = "camera";  // Live camera recording
const STEP_EDIT   = "edit";    // Preview + caption + description
const STEP_UPLOAD = "upload";  // Uploading…
const STEP_DONE   = "done";    // Success

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function ReelUploadModal({ open, onClose, onPosted, editReel }) {
  const token = useAuthStore((s) => s.token);

  const [step, setStep]           = useState(STEP_PICK);
  const [videoFile, setVideoFile] = useState(null);    // File object
  const [videoSrc, setVideoSrc]   = useState("");      // Object URL for preview
  const [caption, setCaption]     = useState(editReel?.caption || "");
  const [description, setDescription] = useState(editReel?.description || "");
  const [progress, setProgress]   = useState(0);
  const [error, setError]         = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [playing, setPlaying]     = useState(false);

  // Camera state
  const [cameraStream, setCameraStream]       = useState(null);
  const [cameraRecording, setCameraRecording] = useState(false);
  const [recordedChunks, setRecordedChunks]   = useState([]);
  const [recordTime, setRecordTime]           = useState(0);

  const fileRef      = useRef(null);
  const videoPreview = useRef(null);
  const cameraVideo  = useRef(null);
  const mediaRecRef  = useRef(null);
  const timerRef     = useRef(null);

  const isEdit = Boolean(editReel);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStep(isEdit ? STEP_EDIT : STEP_PICK);
      setCaption(editReel?.caption || "");
      setDescription(editReel?.description || "");
      setProgress(0);
      setError(null);
      setPlaying(false);
    }
  }, [open, isEdit, editReel]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (videoSrc && videoSrc.startsWith("blob:")) URL.revokeObjectURL(videoSrc);
    };
  }, [videoSrc]);

  // Cleanup camera on unmount / close
  useEffect(() => {
    if (!open) stopCamera();
    return () => stopCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    clearInterval(timerRef.current);
    setCameraRecording(false);
    setRecordTime(0);
  }

  function handleClose() {
    stopCamera();
    setVideoFile(null);
    setVideoSrc("");
    setStep(STEP_PICK);
    onClose();
  }

  // ── File picked from disk ────────────────────────────
  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (file) receiveFile(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  function receiveFile(file) {
    if (!file.type.startsWith("video/")) {
      setError("Sirf video file choose karo (mp4, mov, webm)");
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setError("File 200MB se chhoti honi chahiye");
      return;
    }
    setError(null);
    const src = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoSrc(src);
    setStep(STEP_EDIT);
  }

  // ── Drag & Drop ──────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) receiveFile(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Camera ───────────────────────────────────────────
  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 720, height: 1280 },
        audio: true,
      });
      setCameraStream(stream);
      setStep(STEP_CAMERA);
      setTimeout(() => {
        if (cameraVideo.current) {
          cameraVideo.current.srcObject = stream;
          cameraVideo.current.play().catch(() => {});
        }
      }, 100);
    } catch (err) {
      setError("Camera access nahi mili: " + err.message);
    }
  }

  function startRecording() {
    if (!cameraStream) return;
    const chunks = [];
    setRecordedChunks([]);
    const rec = new MediaRecorder(cameraStream, { mimeType: "video/webm;codecs=vp9,opus" });
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const file = new File([blob], `reel_${Date.now()}.webm`, { type: "video/webm" });
      const src = URL.createObjectURL(blob);
      setVideoFile(file);
      setVideoSrc(src);
      stopCamera();
      setStep(STEP_EDIT);
    };
    mediaRecRef.current = rec;
    rec.start(100);
    setCameraRecording(true);
    setRecordTime(0);
    timerRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
  }

  function stopRecording() {
    clearInterval(timerRef.current);
    setCameraRecording(false);
    mediaRecRef.current?.stop();
  }

  // ── Video preview play/pause ──────────────────────────
  function togglePlay() {
    const v = videoPreview.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }

  // ── Submit ────────────────────────────────────────────
  async function handleSubmit() {
    if (isEdit) {
      // Just update caption/description
      setStep(STEP_UPLOAD);
      try {
        const { data } = await api.patch(`/posts/${editReel._id}`, { caption, description });
        toast.success("Reel update ho gayi ✅");
        onPosted?.(data.post, true);
        handleClose();
      } catch (err) {
        setError(err.response?.data?.error || "Update fail hua");
        setStep(STEP_EDIT);
      }
      return;
    }

    if (!videoFile) { setError("Pehle video choose karo"); return; }
    if (!caption.trim()) { setError("Caption zaroor likho"); return; }

    setStep(STEP_UPLOAD);
    setProgress(0);
    setError(null);

    try {
      // 1. Upload video to Cloudinary via backend
      const uploaded = await uploadVideoFile(videoFile, token, setProgress);

      // 2. Create post with kind=reel
      const { data } = await api.post("/posts", {
        caption: caption.trim(),
        description: description.trim(),
        kind: "reel",
        media: [{ url: uploaded.url, publicId: uploaded.publicId, kind: "video" }],
      });

      setStep(STEP_DONE);
      toast.success("Reel upload ho gayi 🎬");
      setTimeout(() => {
        onPosted?.(data.post, false);
        handleClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "Upload fail hua");
      setStep(STEP_EDIT);
    }
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ scale: 0.94, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-lg rounded-3xl overflow-hidden"
            style={{ background: "var(--color-bg, #0e0e12)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              {step !== STEP_PICK && step !== STEP_DONE && (
                <button
                  onClick={() => { if (step === STEP_CAMERA) stopCamera(); setStep(STEP_PICK); }}
                  className="w-8 h-8 rounded-full grid place-items-center text-white/60 hover:text-white transition"
                >
                  <HiArrowLeft />
                </button>
              )}
              <h2 className="font-semibold text-sm text-white mx-auto">
                {isEdit ? "Reel Edit Karo" :
                 step === STEP_PICK   ? "Reel Banao" :
                 step === STEP_CAMERA ? "Recording..." :
                 step === STEP_EDIT   ? "Preview & Publish" :
                 step === STEP_UPLOAD ? "Upload Ho Raha Hai..." :
                 "Reel Upload Ho Gayi! 🎬"}
              </h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full grid place-items-center text-white/60 hover:text-white transition"
              >
                <HiOutlineXMark />
              </button>
            </div>

            {/* STEP: PICK */}
            {step === STEP_PICK && (
              <div className="p-6 space-y-4">
                {/* Drag & Drop Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`relative cursor-pointer rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 p-10 transition-all ${
                    dragActive
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/15 hover:border-white/30 hover:bg-white/5"
                  }`}
                >
                  <div className="w-14 h-14 rounded-full bg-white/10 grid place-items-center text-white/60">
                    <HiOutlineArrowUpTray className="text-2xl" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white/90">
                      {dragActive ? "Drop karo yahan!" : "Video upload karo"}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      MP4, MOV, WEBM · max 200MB · drag & drop ya click
                    </p>
                  </div>
                </div>

                {/* OR Camera */}
                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-white/30 font-semibold">YA</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <button
                  onClick={startCamera}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition"
                >
                  <HiOutlineCamera className="text-lg" />
                  Camera se reel banao
                </button>

                {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                <input ref={fileRef} type="file" accept="video/*" className="sr-only" onChange={onFileChange} />
              </div>
            )}

            {/* STEP: CAMERA */}
            {step === STEP_CAMERA && (
              <div className="relative">
                <video
                  ref={cameraVideo}
                  autoPlay
                  muted
                  playsInline
                  className="w-full aspect-[9/16] object-cover bg-black max-h-[60vh]"
                />
                {/* Timer */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-mono">
                  {cameraRecording ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      {String(Math.floor(recordTime / 60)).padStart(2, "0")}:{String(recordTime % 60).padStart(2, "0")}
                    </span>
                  ) : "Camera Ready"}
                </div>
                {/* Controls */}
                <div className="absolute bottom-6 inset-x-0 flex justify-center">
                  {!cameraRecording ? (
                    <button
                      onClick={startRecording}
                      className="w-16 h-16 rounded-full bg-red-500 border-4 border-white hover:scale-105 active:scale-95 transition"
                    />
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="w-16 h-16 rounded-full bg-red-500 border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition"
                    >
                      <span className="w-5 h-5 rounded bg-white" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP: EDIT (preview + caption + description) */}
            {step === STEP_EDIT && (
              <div className="p-5 space-y-4">
                {/* Video Preview */}
                {videoSrc && (
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-72">
                    <video
                      ref={videoPreview}
                      src={videoSrc}
                      playsInline
                      loop
                      className="w-full h-full object-contain"
                      onPlay={() => setPlaying(true)}
                      onPause={() => setPlaying(false)}
                    />
                    <button
                      onClick={togglePlay}
                      className="absolute inset-0 grid place-items-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur border border-white/20 grid place-items-center text-white">
                        {playing
                          ? <HiOutlinePause className="text-xl" />
                          : <HiOutlinePlay className="text-xl ml-0.5" />}
                      </div>
                    </button>
                    {/* Remove button */}
                    {!isEdit && (
                      <button
                        onClick={() => { setVideoFile(null); setVideoSrc(""); setStep(STEP_PICK); }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white grid place-items-center hover:bg-red-500 transition"
                      >
                        <HiOutlineTrash className="text-sm" />
                      </button>
                    )}
                  </div>
                )}

                {/* Caption */}
                <div>
                  <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                    Caption *
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Apni reel ke baare mein likho... #hashtag bhi daal sakte ho"
                    rows={2}
                    maxLength={300}
                    className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 px-3 py-2.5 text-sm text-white outline-none resize-none placeholder-white/30 transition"
                  />
                  <p className="text-[10px] text-white/30 text-right mt-0.5">{caption.length}/300</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Zyada detail mein batao apni reel ke baare mein..."
                    rows={3}
                    maxLength={1000}
                    className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 px-3 py-2.5 text-sm text-white outline-none resize-none placeholder-white/30 transition"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!caption.trim() && !isEdit}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isEdit ? "Update Karo ✅" : "Reel Publish Karo 🚀"}
                </button>
              </div>
            )}

            {/* STEP: UPLOADING */}
            {step === STEP_UPLOAD && (
              <div className="p-8 flex flex-col items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 grid place-items-center">
                  <HiOutlineFilm className="text-3xl text-white" />
                </div>
                <div className="w-full">
                  <div className="flex justify-between text-xs text-white/50 mb-2">
                    <span>Upload ho raha hai...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-white/40 text-center">
                  Thoda wait karo, video upload aur process ho rahi hai ☁️
                </p>
              </div>
            )}

            {/* STEP: DONE */}
            {step === STEP_DONE && (
              <div className="p-8 flex flex-col items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="w-20 h-20 rounded-full bg-green-500 grid place-items-center"
                >
                  <HiOutlineCheckCircle className="text-4xl text-white" />
                </motion.div>
                <p className="text-white font-semibold">Reel publish ho gayi! 🎉</p>
                <p className="text-xs text-white/40 text-center">Feed pe dikhnay lagegi thodi der mein</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}