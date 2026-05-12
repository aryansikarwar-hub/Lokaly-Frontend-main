// MediaUploader.jsx
// FULLY FIXED VERSION
// Supports:
// ✅ Single image upload
// ✅ Multiple image upload
// ✅ Video upload
// ✅ Auth token
// ✅ Persist login after refresh
// ✅ Backend routes:
//    POST /api/upload
//    POST /api/upload/multi

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

/* =========================================================
   API ORIGIN
========================================================= */

const API_ORIGIN = (() => {
  const raw = import.meta.env.VITE_API_URL;

  if (!raw) return "";

  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
})();

/* =========================================================
   HELPERS
========================================================= */

function absolutizeUrl(url) {
  if (!url) return url;

  if (/^https?:\/\//i.test(url)) return url;

  if (url.startsWith("/") && API_ORIGIN) {
    return `${API_ORIGIN}${url}`;
  }

  return url;
}

function normalizeUploadResponse(data) {
  if (!data) return [];

  const normalize = (x) => ({
    url: absolutizeUrl(x.url),
    publicId: x.publicId || "",
  });

  if (Array.isArray(data.files)) {
    return data.files.map(normalize);
  }

  if (data.url) {
    return [normalize(data)];
  }

  return [];
}

function isImageUrl(url = "") {
  return /\.(png|jpg|jpeg|gif|webp|svg|bmp)(\?|$)/i.test(url);
}

function matchesAccept(file, accept) {
  if (!accept || accept === "*") return true;

  const fileType = file.type.toLowerCase();

  return accept
    .split(",")
    .map((x) => x.trim())
    .some((rule) => {
      if (rule.endsWith("/*")) {
        return fileType.startsWith(rule.replace("/*", "/"));
      }

      return fileType === rule;
    });
}

function toItemArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return [{ url: value }];
  }

  return [];
}

/* =========================================================
   COMPONENT
========================================================= */

export default function MediaUploader({
  value,
  onChange,

  multiple = false,
  accept = "image/*",

  maxFiles = 8,
  maxSizeMB = 50,

  label,
  className,

  disabled = false,
}) {
  const token = useAuthStore((s) => s.token);

  const items = useMemo(() => {
    return toItemArray(value);
  }, [value]);

  /* =======================================================
     FIXED ROUTES
  ======================================================= */

  const resolvedUploadUrl = multiple
    ? `${API_ORIGIN}/api/upload/multi`
    : `${API_ORIGIN}/api/upload`;

  const resolvedFieldName = multiple ? "files" : "file";

  /* =======================================================
     STATE
  ======================================================= */

  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  const [uploads, setUploads] = useState([]);

  const fileRef = useRef(null);

  /* =======================================================
     EMIT VALUE
  ======================================================= */

  const emit = useCallback(
    (next) => {
      if (multiple) {
        onChange?.(next);
      } else {
        onChange?.(next[0]?.url || "");
      }
    },
    [multiple, onChange]
  );

  /* =======================================================
     ERROR
  ======================================================= */

  const triggerError = useCallback((msg) => {
    setError(msg);

    setTimeout(() => {
      setError("");
    }, 3000);
  }, []);

  /* =======================================================
     UPLOAD
  ======================================================= */

  const doUpload = useCallback(
    (file) => {
      return new Promise((resolve) => {
        const id = Math.random().toString(36).slice(2);

        setUploads((prev) => [
          ...prev,
          {
            id,
            name: file.name,
            progress: 0,
          },
        ]);

        const fd = new FormData();

        fd.append(resolvedFieldName, file);

        const xhr = new XMLHttpRequest();

        xhr.open("POST", resolvedUploadUrl, true);

        /* ============================
           AUTH TOKEN
        ============================ */

        if (token) {
          xhr.setRequestHeader(
            "Authorization",
            `Bearer ${token}`
          );
        }

        /* ============================
           PROGRESS
        ============================ */

        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return;

          const progress = Math.round(
            (e.loaded / e.total) * 100
          );

          setUploads((prev) =>
            prev.map((u) =>
              u.id === id
                ? { ...u, progress }
                : u
            )
          );
        };

        /* ============================
           SUCCESS
        ============================ */

        xhr.onload = () => {
          let parsed = {};

          try {
            parsed = JSON.parse(xhr.responseText);
          } catch {}

          if (xhr.status >= 200 && xhr.status < 300) {
            setUploads((prev) =>
              prev.filter((u) => u.id !== id)
            );

            resolve(
              normalizeUploadResponse(parsed)
            );
          } else {
            setUploads((prev) =>
              prev.filter((u) => u.id !== id)
            );

            triggerError(
              parsed?.error ||
                `Upload failed (${xhr.status})`
            );

            resolve([]);
          }
        };

        /* ============================
           NETWORK ERROR
        ============================ */

        xhr.onerror = () => {
          setUploads((prev) =>
            prev.filter((u) => u.id !== id)
          );

          triggerError("Network error");

          resolve([]);
        };

        xhr.send(fd);
      });
    },
    [
      resolvedFieldName,
      resolvedUploadUrl,
      token,
      triggerError,
    ]
  );

  /* =======================================================
     HANDLE FILES
  ======================================================= */

  const handleFiles = useCallback(
    async (fileList) => {
      if (disabled) return;

      const files = Array.from(fileList || []);

      if (!files.length) return;

      const validFiles = [];

      for (const file of files) {
        if (!matchesAccept(file, accept)) {
          triggerError(
            `${file.name} invalid file type`
          );
          continue;
        }

        if (
          file.size >
          maxSizeMB * 1024 * 1024
        ) {
          triggerError(
            `${file.name} exceeds ${maxSizeMB}MB`
          );
          continue;
        }

        validFiles.push(file);
      }

      if (!validFiles.length) return;

      /* ============================
         SINGLE
      ============================ */

      if (!multiple) {
        const result = await doUpload(validFiles[0]);

        if (result.length) {
          emit(result);
        }

        return;
      }

      /* ============================
         MULTIPLE
      ============================ */

      const remaining =
        maxFiles - items.length;

      const selected = validFiles.slice(
        0,
        remaining
      );

      const results = await Promise.all(
        selected.map((f) => doUpload(f))
      );

      const flat = results.flat();

      emit([
        ...items,
        ...flat,
      ]);
    },
    [
      accept,
      disabled,
      doUpload,
      emit,
      items,
      maxFiles,
      maxSizeMB,
      multiple,
      triggerError,
    ]
  );

  /* =======================================================
     REMOVE
  ======================================================= */

  function removeAt(index) {
    const next = items.filter(
      (_, i) => i !== index
    );

    emit(next);
  }

  /* =======================================================
     DROP
  ======================================================= */

  function onDrop(e) {
    e.preventDefault();

    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer?.files;

    if (files?.length) {
      handleFiles(files);
    }
  }

  /* =======================================================
     PICKER
  ======================================================= */

  function openPicker() {
    if (disabled) return;

    fileRef.current?.click();
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <p className="mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          {label}
        </p>
      )}

      {/* INPUT */}

      <input
        ref={fileRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);

          if (fileRef.current) {
            fileRef.current.value = "";
          }
        }}
      />

      {/* DROPZONE */}

      <motion.div
        onClick={openPicker}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDragEnter={(e) => {
          e.preventDefault();

          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();

          setDragActive(false);
        }}
        onDrop={onDrop}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all",
          dragActive
            ? "border-pink-500 bg-pink-500/10"
            : "border-zinc-300 dark:border-zinc-700 hover:border-pink-500"
        )}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
            {dragActive ? (
              <HiOutlineCloudArrowUp className="text-2xl" />
            ) : (
              <HiOutlineArrowUpTray className="text-2xl" />
            )}
          </div>

          <p className="font-semibold">
            {dragActive
              ? "Drop files here"
              : "Click or drag files"}
          </p>

          <p className="text-xs text-zinc-500 mt-1">
            Max {maxSizeMB}MB
          </p>
        </div>
      </motion.div>

      {/* UPLOADS */}

      <AnimatePresence>
        {uploads.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploads.map((u) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border rounded-xl p-3"
              >
                <div className="flex justify-between text-sm mb-2">
                  <span className="truncate">
                    {u.name}
                  </span>

                  <span>
                    {u.progress}%
                  </span>
                </div>

                <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                  <motion.div
                    animate={{
                      width: `${u.progress}%`,
                    }}
                    className="h-full bg-pink-500"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* PREVIEW */}

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-4">
          {items.map((item, index) => (
            <div
              key={item.url + index}
              className="relative aspect-square rounded-xl overflow-hidden border"
            >
              {isImageUrl(item.url) ? (
                <img
                  src={item.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-900">
                  <HiOutlineDocument className="text-2xl mb-1" />
                  VIDEO
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  removeAt(index)
                }
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center"
              >
                <HiXMark />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ERROR */}

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{
              opacity: 0,
              y: -4,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
            }}
            className="text-sm text-red-500 mt-3"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}