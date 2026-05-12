// components/ui/DirectMediaUploader.jsx
// Self-contained uploader — stable image/video preview + upload

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineCloudArrowUp,
  HiOutlineXMark,
  HiOutlinePhoto,
  HiOutlineVideoCamera,
  HiOutlineCheck,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";

import { Spinner } from "./Spinner";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function DirectMediaUploader({
  value = [],
  onChange,
  accept = "image/*",
  maxFiles = 1,
  maxSizeMB,
  label = "Upload",
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  // SAFE ARRAY
  const items = Array.isArray(value) ? value : [];

  // ✅ Always keep latest items in ref to avoid stale closure in async uploadFile
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const isVideo = accept.includes("video");
  const defaultMaxSize = isVideo ? 100 : 10;
  const sizeLimit = (maxSizeMB || defaultMaxSize) * 1024 * 1024;

  // =========================
  // CLEANUP OBJECT URLS
  // =========================
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item?.preview?.startsWith?.("blob:")) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // UPDATE ITEM
  // ✅ Uses itemsRef to avoid stale closure in async uploadFile
  // =========================
  const updateItem = useCallback(
    (idx, patch) => {
      const latest = itemsRef.current;
      onChange?.(latest.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    },
    [onChange]
  );

  // =========================
  // REMOVE ITEM
  // ✅ Uses itemsRef to avoid stale closure in async uploadFile
  // =========================
  const removeItem = useCallback(
    (idx) => {
      const latest = itemsRef.current;
      // revoke blob url if present
      const item = latest[idx];
      if (item?.preview?.startsWith?.("blob:")) {
        URL.revokeObjectURL(item.preview);
      }
      onChange?.(latest.filter((_, i) => i !== idx));
    },
    [onChange]
  );

  // =========================
  // UPLOAD FILE
  // =========================
  async function uploadFile(file, idx) {
    console.log("[UPLOAD START]", file);

    // FILE SIZE VALIDATION
    if (file.size > sizeLimit) {
      toast.error(
        `${file.name} too big (max ${maxSizeMB || defaultMaxSize}MB)`
      );
      removeItem(idx);
      return;
    }

    try {
      // ===================================
      // CLOUDINARY UPLOAD
      // ===================================
      const cloudName = import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env?.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (cloudName && uploadPreset) {
        console.log("[UPLOAD] Using Cloudinary");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const resourceType = file.type.startsWith("video/") ? "video" : "image";

        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`
        );

        // PROGRESS
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            updateItem(idx, { progress });
          }
        };

        const data = await new Promise((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(
                new Error(`Cloudinary ${xhr.status}: ${xhr.responseText}`)
              );
            }
          };
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(formData);
        });

        console.log("[UPLOAD SUCCESS]", data);

        updateItem(idx, {
          url: data.secure_url || data.url,
          publicId: data.public_id,
          uploaded: true,
          progress: 100,
          kind: resourceType,
        });

        return;
      }

      // ===================================
      // BACKEND UPLOAD
      // ===================================
      console.log("[UPLOAD] Using Backend");

      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "kind",
        file.type.startsWith("video/") ? "video" : "image"
      );

      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          const progress = Math.round((e.loaded / (e.total || 1)) * 100);
          updateItem(idx, { progress });
        },
      });

      console.log("[BACKEND SUCCESS]", data);

      const uploadedUrl = data?.url || data?.secure_url || data?.location;

      if (!uploadedUrl) throw new Error("No URL returned");

      updateItem(idx, {
        url: uploadedUrl,
        uploaded: true,
        progress: 100,
        kind: file.type.startsWith("video/") ? "video" : "image",
      });
    } catch (err) {
      console.error("[UPLOAD FAILED]", err);

      toast.error(
        err?.response?.data?.error || err.message || "Upload failed"
      );

      updateItem(idx, { error: true, progress: 0 });
    }
  }

  // =========================
  // HANDLE FILES
  // =========================
  function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const remaining = maxFiles - items.length;
    const toAdd = files.slice(0, remaining);

    if (files.length > remaining) {
      toast.error(`Max ${maxFiles} file(s) allowed`);
    }

    // CREATE PREVIEWS
    const newItems = toAdd.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      kind: file.type.startsWith("video/") ? "video" : "image",
      preview: URL.createObjectURL(file),
      progress: 0,
      uploaded: false,
      error: false,
      url: "",
    }));

    console.log("[NEW ITEMS]", newItems);

    const startIdx = items.length;
    onChange?.([...items, ...newItems]);

    // START UPLOAD
    toAdd.forEach((file, i) => {
      uploadFile(file, startIdx + i);
    });
  }

  // =========================
  // DRAG DROP
  // =========================
  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  const Icon = isVideo ? HiOutlineVideoCamera : HiOutlinePhoto;

  return (
    <div className="space-y-3">
      {/* ========================= */}
      {/* UPLOAD BOX */}
      {/* ========================= */}

      {items.length < maxFiles && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`w-full rounded-xl border-2 border-dashed p-6 transition-all flex flex-col items-center justify-center gap-2 ${
            dragging
              ? "border-coral bg-coral/10 scale-[0.98]"
              : "border-ink/15 dark:border-white/15 hover:border-coral/40 hover:bg-coral/5"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-coral/15 to-mauve/15 grid place-items-center">
            <HiOutlineCloudArrowUp className="text-2xl text-coral" />
          </div>

          <p className="text-xs font-bold text-ink dark:text-cream">
            {dragging
              ? "Drop karo!"
              : `${label} ke liye click ya drag karo`}
          </p>

          <p className="text-[10px] text-ink/40 dark:text-cream/40">
            {isVideo
              ? `MP4, MOV, WEBM · Max ${maxSizeMB || defaultMaxSize}MB`
              : `JPG, PNG, WEBP · Max ${maxSizeMB || defaultMaxSize}MB`}
          </p>
        </button>
      )}

      {/* ========================= */}
      {/* INPUT */}
      {/* ========================= */}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* ========================= */}
      {/* PREVIEW GRID */}
      {/* ========================= */}

      <AnimatePresence>
        {items.length > 0 && (
          <div
            className={`grid gap-2 ${
              isVideo ? "grid-cols-1" : "grid-cols-3"
            }`}
          >
            {items.map((item, idx) => {
              const mediaSrc =
                item.uploaded && item.url ? item.url : item.preview;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`relative rounded-xl overflow-hidden bg-ink/5 border border-ink/10 ${
                    isVideo
                      ? "aspect-[9/16] max-h-56 mx-auto w-full sm:w-40"
                      : "aspect-square"
                  }`}
                >
                  {/* VIDEO */}
                  {item.kind === "video" ? (
                    <video
                      src={mediaSrc || ""}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      controls={item.uploaded}
                    />
                  ) : (
                    // IMAGE
                    <img
                      src={mediaSrc || ""}
                      alt="preview"
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.log("[IMAGE FAILED]", item);
                        e.currentTarget.src =
                          "https://via.placeholder.com/300x300?text=Preview";
                      }}
                    />
                  )}

                  {/* PROGRESS OVERLAY */}
                  {!item.uploaded && !item.error && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm grid place-items-center">
                      <div className="text-white text-center">
                        <Spinner size={18} />
                        <p className="text-[10px] font-bold mt-1">
                          {item.progress || 0}%
                        </p>
                      </div>
                    </div>
                  )}

                  {/* PROGRESS BAR */}
                  {!item.uploaded && !item.error && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-coral transition-all"
                        style={{ width: `${item.progress || 0}%` }}
                      />
                    </div>
                  )}

                  {/* SUCCESS */}
                  {item.uploaded && (
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white grid place-items-center">
                      <HiOutlineCheck className="text-xs" />
                    </div>
                  )}

                  {/* ERROR */}
                  {item.error && (
                    <div className="absolute inset-0 bg-red-500/80 grid place-items-center text-white text-center p-2">
                      <HiOutlineExclamationTriangle className="text-xl mx-auto mb-1" />
                      <p className="text-[9px] font-bold">Failed</p>
                    </div>
                  )}

                  {/* REMOVE */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(idx);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur text-white grid place-items-center hover:bg-red-500 transition"
                  >
                    <HiOutlineXMark className="text-xs" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}