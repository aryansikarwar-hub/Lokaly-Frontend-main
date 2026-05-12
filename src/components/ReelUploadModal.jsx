/**
 * ReelUploadModal.jsx
 * Fixed version
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

  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
})();

function absolutize(url) {
  if (!url) return url;

  if (
    /^https?:\/\//i.test(url) ||
    url.startsWith("data:")
  ) {
    return url;
  }

  if (url.startsWith("/") && API_ORIGIN) {
    return `${API_ORIGIN}${url}`;
  }

  return url;
}

// ======================================================
// VIDEO UPLOAD FUNCTION
// ======================================================

function uploadVideoFile(file, token, onProgress) {
  return new Promise((resolve, reject) => {

    const endpoint = `${API_ORIGIN}/api/upload`;

    const fd = new FormData();
    fd.append("file", file);

    const xhr = new XMLHttpRequest();

    xhr.open("POST", endpoint, true);

    xhr.timeout = 120000;

    if (token) {
      xhr.setRequestHeader(
        "Authorization",
        `Bearer ${token}`
      );
    }

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        onProgress(
          Math.round((ev.loaded / ev.total) * 100)
        );
      }
    };

    xhr.onload = () => {
      let parsed;

      try {
        parsed = JSON.parse(xhr.responseText);
      } catch {
        parsed = null;
      }

      if (
        xhr.status >= 200 &&
        xhr.status < 300 &&
        parsed?.url
      ) {
        resolve({
          url: absolutize(parsed.url),
          publicId: parsed.publicId || "",
          kind: parsed.kind || "video",
          width: parsed.width || null,
          height: parsed.height || null,
          duration: parsed.duration || null,
        });
      } else {
        reject(
          new Error(
            parsed?.error ||
            `Upload failed (${xhr.status})`
          )
        );
      }
    };

    xhr.onerror = () => {
      reject(
        new Error(
          "Network error — backend check karo"
        )
      );
    };

    xhr.ontimeout = () => {
      reject(
        new Error(
          "Upload timeout — server slow hai"
        )
      );
    };

    xhr.send(fd);
  });
}

// ======================================================
// STEPS
// ======================================================

const STEP_PICK = "pick";
const STEP_CAMERA = "camera";
const STEP_EDIT = "edit";
const STEP_UPLOAD = "upload";
const STEP_DONE = "done";

// ======================================================
// COMPONENT
// ======================================================

export default function ReelUploadModal({
  open,
  onClose,
  onPosted,
  editReel,
}) {

  const token = useAuthStore((s) => s.token);

  const [step, setStep] = useState(STEP_PICK);

  const [videoFile, setVideoFile] = useState(null);

  const [videoSrc, setVideoSrc] = useState("");

  const [caption, setCaption] = useState(
    editReel?.caption || ""
  );

  const [description, setDescription] =
    useState(editReel?.description || "");

  const [progress, setProgress] = useState(0);

  const [error, setError] = useState(null);

  const [dragActive, setDragActive] =
    useState(false);

  const [playing, setPlaying] =
    useState(false);

  // CAMERA
  const [cameraStream, setCameraStream] =
    useState(null);

  const [cameraRecording, setCameraRecording] =
    useState(false);

  const [recordTime, setRecordTime] =
    useState(0);

  const fileRef = useRef(null);

  const videoPreview = useRef(null);

  const cameraVideo = useRef(null);

  const mediaRecRef = useRef(null);

  const timerRef = useRef(null);

  const isEdit = Boolean(editReel);

  // ======================================================
  // RESET
  // ======================================================

  useEffect(() => {
    if (open) {
      setStep(isEdit ? STEP_EDIT : STEP_PICK);

      setCaption(editReel?.caption || "");

      setDescription(
        editReel?.description || ""
      );

      setProgress(0);

      setError(null);

      setPlaying(false);
    }
  }, [open, isEdit, editReel]);

  // ======================================================
  // CLEANUP
  // ======================================================

  useEffect(() => {
    return () => {
      if (
        videoSrc &&
        videoSrc.startsWith("blob:")
      ) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  // ======================================================
  // FILE PICK
  // ======================================================

  function onFileChange(e) {
    const file = e.target.files?.[0];

    if (file) receiveFile(file);

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }

  function receiveFile(file) {

    if (!file.type.startsWith("video/")) {
      setError(
        "Sirf video upload karo"
      );
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      setError(
        "Video 200MB se chhoti honi chahiye"
      );
      return;
    }

    setError(null);

    const src = URL.createObjectURL(file);

    setVideoFile(file);

    setVideoSrc(src);

    setStep(STEP_EDIT);
  }

  // ======================================================
  // DRAG DROP
  // ======================================================

  const onDrop = useCallback((e) => {

    e.preventDefault();

    setDragActive(false);

    const file =
      e.dataTransfer?.files?.[0];

    if (file) receiveFile(file);

  }, []);

  // ======================================================
  // PLAY / PAUSE
  // ======================================================

  function togglePlay() {

    const v = videoPreview.current;

    if (!v) return;

    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  // ======================================================
  // SUBMIT
  // ======================================================

  async function handleSubmit() {

    if (!videoFile) {
      setError("Video select karo");
      return;
    }

    if (!caption.trim()) {
      setError("Caption likho");
      return;
    }

    try {

      setStep(STEP_UPLOAD);

      setProgress(0);

      setError(null);

      // ==========================================
      // STEP 1 — VIDEO UPLOAD
      // ==========================================

      console.log("[Upload] Starting");

      const uploaded =
        await uploadVideoFile(
          videoFile,
          token,
          setProgress
        );

      console.log(
        "[Upload] Success:",
        uploaded
      );

      // ==========================================
      // STEP 2 — CREATE POST
      // ==========================================

      const payload = {
        caption: caption.trim(),

        description:
          description.trim(),

        kind: "video",

        media: [
          {
            url: uploaded.url,
            kind: "video",
            width: uploaded.width,
            height: uploaded.height,
            duration: uploaded.duration,
          },
        ],
      };

      console.log(
        "[Post] Creating:",
        payload
      );

      const { data } =
        await api.post(
          "/posts",
          payload
        );

      console.log(
        "[Post] Created:",
        data
      );

      // ==========================================
      // SUCCESS
      // ==========================================

      setStep(STEP_DONE);

      toast.success(
        "Reel upload ho gayi 🎬"
      );

      setTimeout(() => {

        onPosted?.(
          data.post,
          false
        );

        handleClose();

      }, 1200);

    } catch (err) {

      console.error(err);

      setError(
        err?.response?.data?.error ||
        err.message ||
        "Upload fail hua"
      );

      setStep(STEP_EDIT);
    }
  }

  // ======================================================
  // CLOSE
  // ======================================================

  function handleClose() {

    setVideoFile(null);

    setVideoSrc("");

    setCaption("");

    setDescription("");

    setProgress(0);

    setError(null);

    setStep(STEP_PICK);

    onClose();
  }

  if (!open) return null;

  // ======================================================
  // UI
  // ======================================================

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-lg rounded-3xl bg-[#111] overflow-hidden border border-white/10">

            {/* HEADER */}

            <div className="flex items-center justify-between p-4 border-b border-white/10">

              <h2 className="text-white font-semibold">
                Reel Upload
              </h2>

              <button
                onClick={handleClose}
                className="text-white"
              >
                <HiOutlineXMark />
              </button>
            </div>

            {/* BODY */}

            <div className="p-5">

              {step === STEP_PICK && (

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() =>
                    setDragActive(false)
                  }
                  onDrop={onDrop}
                  onClick={() =>
                    fileRef.current?.click()
                  }
                  className="border-2 border-dashed border-white/20 rounded-2xl p-10 text-center cursor-pointer"
                >

                  <HiOutlineArrowUpTray className="mx-auto text-4xl text-white/60 mb-4" />

                  <p className="text-white">
                    Video upload karo
                  </p>

                  <p className="text-white/40 text-sm mt-2">
                    MP4 / MOV / WEBM
                  </p>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={onFileChange}
                  />
                </div>
              )}

              {step === STEP_EDIT && (

                <div className="space-y-4">

                  <div className="rounded-2xl overflow-hidden bg-black">

                    <video
                      ref={videoPreview}
                      src={videoSrc}
                      className="w-full max-h-[420px]"
                      loop
                      playsInline
                    />
                  </div>

                  <button
                    onClick={togglePlay}
                    className="w-full py-2 rounded-xl bg-white/10 text-white"
                  >
                    {playing
                      ? "Pause"
                      : "Play"}
                  </button>

                  <textarea
                    value={caption}
                    onChange={(e) =>
                      setCaption(
                        e.target.value
                      )
                    }
                    placeholder="Caption..."
                    className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white"
                  />

                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                    placeholder="Description..."
                    className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white"
                  />

                  {error && (
                    <p className="text-red-400 text-sm">
                      {error}
                    </p>
                  )}

                  <button
                    onClick={handleSubmit}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
                  >
                    Publish Reel 🚀
                  </button>
                </div>
              )}

              {step === STEP_UPLOAD && (

                <div className="py-10 text-center">

                  <HiOutlineFilm className="mx-auto text-5xl text-white mb-4" />

                  <p className="text-white mb-4">
                    Upload ho raha hai...
                  </p>

                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-pink-500"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  <p className="text-white/50 text-sm mt-3">
                    {progress}%
                  </p>
                </div>
              )}

              {step === STEP_DONE && (

                <div className="py-10 text-center">

                  <HiOutlineCheckCircle className="mx-auto text-6xl text-green-500 mb-4" />

                  <p className="text-white font-semibold">
                    Reel upload ho gayi 🎉
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}