import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HiOutlineArrowUpTray,
  HiOutlineCloudArrowUp,
  HiOutlinePhoto,
  HiOutlineDocument,
  HiXMark,
} from "react-icons/hi2";
import { useAuthStore } from "../../store/authStore";
import { cn } from "../../lib/cn";

/**
 * Normalize a backend upload response into a flat array of { url, publicId }.
 */
const API_ORIGIN = (() => {
  const raw = import.meta.env.VITE_API_URL;
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
})();

function absolutizeUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  if (url.startsWith("/") && API_ORIGIN) return `${API_ORIGIN}${url}`;
  return url;
}

function normalizeUploadResponse(data) {
  if (!data) return [];
  const pick = (x) =>
    x && typeof x === "object" && x.url
      ? { url: absolutizeUrl(x.url), publicId: x.publicId }
      : null;
  if (Array.isArray(data)) return data.map(pick).filter(Boolean);
  if (Array.isArray(data.files)) return data.files.map(pick).filter(Boolean);
  if (Array.isArray(data.images)) return data.images.map(pick).filter(Boolean);
  if (Array.isArray(data.items)) return data.items.map(pick).filter(Boolean);
  if (data.image?.url) return [pick(data.image)];
  if (data.video?.url) return [pick(data.video)];
  if (data.item?.url) return [pick(data.item)];
  if (data.url) return [pick(data)];
  return [];
}

function isImageUrl(url = "") {
  return /\.(png|jpe?g|gif|webp|avif|svg|bmp)(\?|$)/i.test(url) || url.startsWith("data:image/");
}

function toItemArray(value, multiple) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) =>
        typeof v === "string"
          ? { url: v }
          : v && typeof v === "object" && v.url
          ? { url: v.url, publicId: v.publicId }
          : null,
      )
      .filter(Boolean);
  }
  if (typeof value === "string" && value) return [{ url: value }];
  if (typeof value === "object" && value.url) {
    return [{ url: value.url, publicId: value.publicId }];
  }
  return [];
}

function matchesAccept(file, accept) {
  if (!accept || accept === "*" || accept === "*/*") return true;
  const parts = accept.split(",").map((p) => p.trim().toLowerCase());
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  for (const p of parts) {
    if (!p) continue;
    if (p.startsWith(".") && name.endsWith(p)) return true;
    if (p.endsWith("/*")) {
      const prefix = p.slice(0, -1);
      if (type.startsWith(prefix)) return true;
    } else if (p === type) return true;
  }
  return false;
}

export default function MediaUploader({
  value,
  onChange,
  multiple = false,
  accept = "image/*",
  maxFiles,
  maxSizeMB = 8,
  uploadUrl,
  fieldName,
  variant = "square",
  label,
  className,
  disabled = false,
}) {
  const token = useAuthStore((s) => s.token);
  const resolvedMaxFiles = maxFiles ?? (multiple ? 8 : 1);
  const isVideo = (accept || "").includes("video");
  // Backend multer expects `file` on single endpoints and `files` on array endpoints.
  const resolvedFieldName = fieldName ?? (multiple ? "files" : "file");
  const resolvedUploadUrl =
    uploadUrl ??
    (multiple
      ? "/api/upload/images"
      : isVideo
      ? "/api/upload/video"
      : "/api/upload/image");
  const resolvedFullUrl = /^https?:\/\//i.test(resolvedUploadUrl)
    ? resolvedUploadUrl
    : API_ORIGIN
    ? `${API_ORIGIN}${resolvedUploadUrl}`
    : resolvedUploadUrl;

  const items = useMemo(() => toItemArray(value, multiple), [value, multiple]);

  const [dragActive, setDragActive] = useState(false);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState(null);
  const [uploads, setUploads] = useState([]); // [{ id, name, progress, error }]
  const fileRef = useRef(null);
  const rootRef = useRef(null);
  const dragCounter = useRef(0);

  const emit = useCallback(
    (next) => {
      if (multiple) {
        onChange?.(next.map((x) => ({ url: x.url, publicId: x.publicId })));
      } else {
        const first = next[0];
        onChange?.(first?.url || "");
      }
    },
    [multiple, onChange],
  );

  const triggerError = useCallback((msg) => {
    setError(msg);
    setShake(true);
    window.setTimeout(() => setShake(false), 520);
  }, []);

  const doUpload = useCallback(
    (file) => {
      return new Promise((resolve) => {
        const id = Math.random().toString(36).slice(2);
        setUploads((u) => [
          ...u,
          { id, name: file.name, progress: 0, error: null },
        ]);
        const fd = new FormData();
        fd.append(resolvedFieldName, file);
        const xhr = new XMLHttpRequest();
        xhr.open("POST", resolvedFullUrl, true);
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.upload.onprogress = (ev) => {
          if (!ev.lengthComputable) return;
          const pct = Math.round((ev.loaded / ev.total) * 100);
          setUploads((u) =>
            u.map((x) => (x.id === id ? { ...x, progress: pct } : x)),
          );
        };
        xhr.onload = () => {
          let parsed;
          try {
            parsed = JSON.parse(xhr.responseText || "{}");
          } catch {
            parsed = null;
          }
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploads((u) => u.filter((x) => x.id !== id));
            const normalized = normalizeUploadResponse(parsed);
            resolve(normalized);
          } else {
            const msg =
              parsed?.error || parsed?.message || `Upload failed (${xhr.status})`;
            setUploads((u) =>
              u.map((x) =>
                x.id === id ? { ...x, error: msg, progress: 0 } : x,
              ),
            );
            window.setTimeout(() => {
              setUploads((u) => u.filter((x) => x.id !== id));
            }, 2400);
            triggerError(msg);
            resolve([]);
          }
        };
        xhr.onerror = () => {
          setUploads((u) =>
            u.map((x) =>
              x.id === id ? { ...x, error: "Network error", progress: 0 } : x,
            ),
          );
          window.setTimeout(() => {
            setUploads((u) => u.filter((x) => x.id !== id));
          }, 2400);
          triggerError("Network error");
          resolve([]);
        };
        xhr.send(fd);
      });
    },
    [resolvedFieldName, resolvedFullUrl, token, triggerError],
  );

  const handleFiles = useCallback(
    async (fileList) => {
      if (disabled) return;
      const files = Array.from(fileList || []);
      if (!files.length) return;

      const accepted = [];
      for (const f of files) {
        if (!matchesAccept(f, accept)) {
          triggerError(`"${f.name}" is not an accepted type`);
          continue;
        }
        if (f.size > maxSizeMB * 1024 * 1024) {
          triggerError(`"${f.name}" is over ${maxSizeMB}MB`);
          continue;
        }
        accepted.push(f);
      }
      if (!accepted.length) return;

      setError(null);
      const remaining = Math.max(0, resolvedMaxFiles - items.length);
      const toUpload = multiple ? accepted.slice(0, remaining) : accepted.slice(0, 1);
      if (!toUpload.length) {
        triggerError(`Max ${resolvedMaxFiles} file${resolvedMaxFiles === 1 ? "" : "s"}`);
        return;
      }

      if (!multiple) {
        const out = await doUpload(toUpload[0]);
        if (out.length) emit(out.slice(0, 1));
        return;
      }

      const results = await Promise.all(toUpload.map((f) => doUpload(f)));
      const flat = results.flat();
      if (flat.length) emit([...items, ...flat].slice(0, resolvedMaxFiles));
    },
    [
      accept,
      disabled,
      doUpload,
      emit,
      items,
      maxSizeMB,
      multiple,
      resolvedMaxFiles,
      triggerError,
    ],
  );

  // Drag and drop
  const onDragEnter = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      dragCounter.current += 1;
      if (e.dataTransfer?.items?.length) setDragActive(true);
    },
    [disabled],
  );
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setDragActive(false);
  }, []);
  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setDragActive(false);
      if (disabled) return;
      const files = e.dataTransfer?.files;
      if (files?.length) handleFiles(files);
    },
    [disabled, handleFiles],
  );

  // Paste from clipboard (when dropzone is focused or hovered)
  useEffect(() => {
    function onPaste(e) {
      if (disabled) return;
      if (!rootRef.current) return;
      const active = document.activeElement;
      if (!rootRef.current.contains(active)) return;
      const files = [];
      for (const item of e.clipboardData?.items || []) {
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length) {
        e.preventDefault();
        handleFiles(files);
      }
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [disabled, handleFiles]);

  function openPicker() {
    if (disabled) return;
    fileRef.current?.click();
  }

  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      openPicker();
    }
  }

  function removeAt(idx) {
    const next = items.filter((_, i) => i !== idx);
    emit(next);
  }

  // Layout variants
  const isAvatar = variant === "avatar";
  const isBanner = variant === "banner";

  const zoneShape = isAvatar
    ? "w-24 h-24 rounded-full"
    : isBanner
    ? "w-full aspect-[3/1] rounded-2xl"
    : "w-full min-h-[140px] rounded-2xl";

  const showZone = multiple ? items.length < resolvedMaxFiles : items.length === 0;

  const canAddMore = items.length < resolvedMaxFiles;
  const singlePreview = !multiple && items[0];

  return (
    <div ref={rootRef} className={cn("w-full", className)}>
      {label && (
        <span className="block mb-1 text-[11px] font-jakarta font-semibold text-ink/70 dark:text-cream/70 uppercase tracking-wider">
          {label}
        </span>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          if (fileRef.current) fileRef.current.value = "";
        }}
      />

      {/* Single-item (avatar/banner/square) preview swap */}
      {!multiple && singlePreview ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "relative overflow-hidden group border border-ink/10 dark:border-cream/10 bg-white/60 dark:bg-white/5",
            zoneShape,
          )}
        >
          {isImageUrl(singlePreview.url) ? (
            <img
              src={singlePreview.url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-ink/60 dark:text-cream/60 p-4 text-[11px] font-jakarta text-center">
              <div className="flex flex-col items-center gap-1">
                <HiOutlineDocument className="text-xl" />
                <span className="truncate max-w-full">{singlePreview.url.split("/").pop()}</span>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => removeAt(0)}
            aria-label="Remove"
            className="absolute top-1.5 right-1.5 w-7 h-7 grid place-items-center rounded-full bg-ink/70 text-cream hover:bg-coral transition opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <HiXMark />
          </button>
          <button
            type="button"
            onClick={openPicker}
            className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] font-jakarta font-semibold rounded-full px-2.5 py-1 bg-white/90 text-ink opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
          >
            Replace
          </button>
        </motion.div>
      ) : null}

      {/* Dropzone */}
      {showZone && (
        <motion.div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={label || "Upload media"}
          aria-disabled={disabled}
          onKeyDown={onKeyDown}
          onClick={openPicker}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "group relative cursor-pointer border-2 border-dashed flex items-center justify-center transition outline-none",
            "bg-white/40 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10",
            "focus-visible:ring-2 focus-visible:ring-coral/40",
            zoneShape,
            dragActive
              ? "border-coral bg-coral/10 dark:bg-coral/20"
              : error
              ? "border-coral/60"
              : "border-ink/15 dark:border-cream/15 hover:border-coral/50",
            disabled && "opacity-50 cursor-not-allowed",
            !multiple && singlePreview ? "mt-2" : "",
          )}
        >
          <div className="flex flex-col items-center gap-1 px-3 text-center pointer-events-none">
            <motion.span
              animate={dragActive ? { y: -3 } : { y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
              className={cn(
                "grid place-items-center rounded-full",
                isAvatar ? "w-8 h-8" : "w-10 h-10",
                dragActive
                  ? "bg-coral text-white"
                  : "bg-peach/60 dark:bg-white/10 text-ink/70 dark:text-cream/70",
              )}
            >
              {dragActive ? (
                <HiOutlineCloudArrowUp className="text-lg" />
              ) : isAvatar ? (
                <HiOutlinePhoto className="text-base" />
              ) : (
                <HiOutlineArrowUpTray className="text-base" />
              )}
            </motion.span>
            {!isAvatar && (
              <>
                <p className="text-[11px] font-jakarta font-semibold text-ink/80 dark:text-cream/80">
                  {dragActive
                    ? "Drop to upload"
                    : multiple
                    ? `Drop images or click to browse`
                    : `Drop an image or click to browse`}
                </p>
                <p className="text-[10px] font-jakarta text-ink/45 dark:text-cream/45">
                  Paste supported · up to {maxSizeMB}MB
                  {multiple && ` · max ${resolvedMaxFiles}`}
                </p>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Multi thumbnails */}
      {multiple && (
        <div
          className={cn(
            "grid gap-2 mt-2",
            isBanner ? "grid-cols-3" : "grid-cols-4",
          )}
        >
          <AnimatePresence>
            {items.map((it, i) => (
              <motion.div
                key={(it.publicId || it.url) + i}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                className="relative aspect-square rounded-lg overflow-hidden border border-ink/5 dark:border-cream/10 bg-white/60 dark:bg-white/5 group"
              >
                {isImageUrl(it.url) ? (
                  <img
                    src={it.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-ink/60 dark:text-cream/60 p-1.5 text-[9px] font-jakarta text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <HiOutlineDocument className="text-base" />
                      <span className="truncate max-w-full">
                        {it.url.split("/").pop()}
                      </span>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label="Remove"
                  className="absolute top-1 right-1 w-6 h-6 grid place-items-center rounded-full bg-ink/70 text-cream hover:bg-coral transition"
                >
                  <HiXMark className="text-xs" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* In-progress uploads */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-1.5 overflow-hidden"
          >
            {uploads.map((u) => (
              <li
                key={u.id}
                className="rounded-xl bg-white/70 dark:bg-white/5 border border-ink/5 dark:border-cream/10 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-jakarta font-semibold text-ink/80 dark:text-cream/80">
                    {u.name}
                  </span>
                  <span className="text-[10px] font-jakarta tabular-nums text-ink/55 dark:text-cream/55">
                    {u.error ? "Failed" : `${u.progress}%`}
                  </span>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-ink/10 dark:bg-cream/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${u.error ? 100 : u.progress}%` }}
                    transition={{ ease: "easeOut", duration: 0.25 }}
                    className={cn(
                      "h-full",
                      u.error ? "bg-coral" : "bg-gradient-to-r from-coral to-tangerine",
                    )}
                  />
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 text-[11px] font-jakarta font-medium text-coral"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Add-more affordance for multiple */}
      {multiple && items.length > 0 && canAddMore && !showZone && (
        <button
          type="button"
          onClick={openPicker}
          className="mt-2 text-[11px] font-jakarta font-semibold text-coral hover:text-coral/80"
        >
          + Add more
        </button>
      )}
    </div>
  );
}

export { MediaUploader };
