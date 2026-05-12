import { useEffect, useState } from "react";
import { HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import api from "../services/api";
import Modal from "./ui/Modal";
import { Input, Textarea } from "./ui/Input";
import { Button } from "./ui/Button";
import MediaUploader from "./ui/MediaUploader";

/* =========================================================
   CATEGORIES
========================================================= */
const CATEGORIES = [
  "Fashion", "Home", "Food", "Beauty", "Electronics", "Handmade",
  "Handloom & Sarees", "Jewellery", "Spices & Pickles", "Home Decor",
  "Ethnic Wear", "Organic Groceries", "Leather & Mojaris",
  "Pottery & Ceramics", "Ayurveda & Wellness", "Indie Beauty",
  "Madhubani Art", "Other",
];

/* =========================================================
   EMPTY STATE
========================================================= */
const EMPTY = {
  title: "",
  description: "",
  category: CATEGORIES[0],
  tags: "",
  price: "",
  compareAtPrice: "",
  stock: "0",
  images: [],
  videos: [],
  attributes: [],
  isActive: true,
};

/* =========================================================
   ATTRIBUTES HELPERS
========================================================= */
function attrsObjectToRows(obj) {
  if (!obj || typeof obj !== "object") return [];
  // Handle Mongoose Map (comes as plain object from JSON)
  const entries = obj instanceof Map ? [...obj.entries()] : Object.entries(obj);
  return entries.map(([key, value]) => ({
    key,
    value: typeof value === "string" ? value : JSON.stringify(value),
  }));
}

function rowsToAttrsObject(rows) {
  const out = {};
  for (const r of rows) {
    const k = (r.key || "").trim();
    if (!k) continue;
    // FIX: ensure value is always a string (Mongoose Map<String, String> requires this)
    out[k] = String(r.value ?? "");
  }
  return out;
}

/* =========================================================
   COMPONENT
========================================================= */
export default function ProductFormModal({
  open,
  mode,
  product,
  onClose,
  onSaved,
}) {
  const isEdit = mode === "edit" || (!mode && !!product);

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState(null);

  /* =======================================================
     LOAD PRODUCT
  ======================================================= */
  useEffect(() => {
    if (!open) return;

    if (product) {
      setForm({
        title: product.title || "",
        description: product.description || "",
        category: product.category || CATEGORIES[0],
        tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
        price: product.price != null ? String(product.price) : "",
        compareAtPrice:
          product.compareAtPrice != null ? String(product.compareAtPrice) : "",
        stock: product.stock != null ? String(product.stock) : "0",
        images: Array.isArray(product.images) ? product.images : [],
        videos: Array.isArray(product.videos) ? product.videos : [],
        attributes: attrsObjectToRows(product.attributes),
        isActive: product.isActive !== false,
      });
    } else {
      setForm(EMPTY);
    }

    setErrors({});
    setApiError(null);
  }, [open, product]);

  /* =======================================================
     UPDATE
  ======================================================= */
  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  /* =======================================================
     ATTRIBUTES
  ======================================================= */
  function setAttrRow(idx, patch) {
    setForm((f) => ({
      ...f,
      attributes: f.attributes.map((row, i) =>
        i === idx ? { ...row, ...patch } : row
      ),
    }));
  }

  function addAttrRow() {
    setForm((f) => ({
      ...f,
      attributes: [...f.attributes, { key: "", value: "" }],
    }));
  }

  function removeAttrRow(idx) {
    setForm((f) => ({
      ...f,
      attributes: f.attributes.filter((_, i) => i !== idx),
    }));
  }

  /* =======================================================
     VALIDATION
  ======================================================= */
  function validate() {
    const e = {};

    if (!form.title.trim()) {
      e.title = "Title is required";
    } else if (form.title.trim().length < 3) {
      e.title = "Title must be at least 3 characters";
    }

    const priceNum = Number(form.price);
    if (!(priceNum > 0)) {
      e.price = "Price must be greater than 0";
    }

    const stockNum = Number(form.stock);
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      e.stock = "Stock must be a non-negative integer";
    }

    if (form.compareAtPrice !== "" && Number(form.compareAtPrice) < 0) {
      e.compareAtPrice = "Must be >= 0";
    }

    if (!form.images.length) {
      e.images = "At least 1 image is required";
    }

    // FIX: Validate that all images have a proper URL (not still uploading)
    const uploadingImages = form.images.filter((img) => !img?.url);
    if (uploadingImages.length > 0) {
      e.images = "Some images are still uploading, please wait...";
    }

    // FIX: Validate attributes — no duplicate keys, no empty keys with values
    const attrKeys = form.attributes
      .map((r) => (r.key || "").trim())
      .filter(Boolean);
    const uniqueKeys = new Set(attrKeys);
    if (uniqueKeys.size !== attrKeys.length) {
      e.attributes = "Attribute keys must be unique";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* =======================================================
     SUBMIT
  ======================================================= */
  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setApiError(null);

    try {
      // FIX: Filter only fully-uploaded images with valid string URLs
      const cleanImages = form.images
        .filter((img) => img?.url && typeof img.url === "string")
        .map((img) => ({
          url: img.url,
          publicId: img.publicId || "",
        }));

      const cleanVideos = form.videos
        .filter((vid) => vid?.url && typeof vid.url === "string")
        .map((vid) => ({
          url: vid.url,
          publicId: vid.publicId || "",
        }));

      // FIX: Convert attributes rows → plain object with string values only
      // Mongoose Map<String,String> requires all values to be strings
      const cleanAttributes = rowsToAttrsObject(form.attributes);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        price: Number(form.price),
        stock: Number(form.stock),
        images: cleanImages,
        videos: cleanVideos,
        attributes: cleanAttributes,
      };

      if (form.compareAtPrice !== "") {
        payload.compareAtPrice = Number(form.compareAtPrice);
      }

      if (isEdit) {
        payload.isActive = !!form.isActive;
      }

      // Debug — remove in production
      console.log("[PRODUCT PAYLOAD]", JSON.stringify(payload, null, 2));

      if (isEdit) {
        await api.patch(`/products/${product._id}`, payload);
      } else {
        await api.post("/products", payload);
      }

      onSaved?.();
      onClose?.();
    } catch (err) {
      console.error("[ProductFormModal] submit error:", err);

      // FIX: Show the actual backend validation message, not a generic one
      const serverMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors)
              .map((e) => e.message || e)
              .join(", ")
          : null) ||
        "Failed to save product";

      setApiError(serverMsg);
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     UI
  ======================================================= */
  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      eyebrow={isEdit ? "Edit listing" : "New listing"}
      title={isEdit ? "Edit product" : "Add a product"}
      width="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* TITLE */}
        <Input
          label="Title"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          error={errors.title}
          placeholder="Handblock cotton saree..."
        />

        {/* DESCRIPTION */}
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Tell the story behind this piece..."
        />

        {/* CATEGORY + TAGS */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block mb-1 text-[11px] font-jakarta font-semibold text-ink/70 dark:text-cream/70 uppercase tracking-wider">
              Category
            </span>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="w-full rounded-xl bg-white/80 dark:bg-ink/60 border border-ink/10 dark:border-cream/15 focus:border-coral/60 outline-none px-3 py-2.5 text-xs text-ink dark:text-cream font-jakarta"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <Input
            label="Tags (comma-separated)"
            value={form.tags}
            onChange={(e) => update("tags", e.target.value)}
            placeholder="cotton, pastel, summer"
          />
        </div>

        {/* PRICING */}
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Price (₹)"
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={(e) => update("price", e.target.value)}
            error={errors.price}
            placeholder="1299"
          />
          <Input
            label="Compare at (₹)"
            type="number"
            min="0"
            step="1"
            value={form.compareAtPrice}
            onChange={(e) => update("compareAtPrice", e.target.value)}
            error={errors.compareAtPrice}
            placeholder="1599"
          />
          <Input
            label="Stock"
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={(e) => update("stock", e.target.value)}
            error={errors.stock}
          />
        </div>

        {/* IMAGES */}
        <div>
          <MediaUploader
            label="Images"
            value={form.images}
            onChange={(v) =>
              setForm((f) => ({ ...f, images: Array.isArray(v) ? v : [] }))
            }
            multiple
            accept="image/*"
            maxFiles={8}
          />
          {errors.images && (
            <span className="block mt-1 text-[11px] text-coral font-jakarta font-medium">
              {errors.images}
            </span>
          )}
        </div>

        {/* VIDEOS */}
        <div>
          <MediaUploader
            label="Videos (optional)"
            value={form.videos}
            onChange={(v) =>
              setForm((f) => ({ ...f, videos: Array.isArray(v) ? v : [] }))
            }
            multiple
            accept="video/*"
            maxFiles={4}
            maxSizeMB={50}
          />
        </div>

        {/* ATTRIBUTES */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-jakarta font-semibold text-ink/70 dark:text-cream/70 uppercase tracking-wider">
              Attributes
            </span>
            <button
              type="button"
              onClick={addAttrRow}
              className="inline-flex items-center gap-1 text-[11px] font-jakarta font-semibold text-coral"
            >
              <HiOutlinePlus /> Add row
            </button>
          </div>

          <div className="space-y-2">
            {form.attributes.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={row.key}
                  onChange={(e) => setAttrRow(i, { key: e.target.value })}
                  placeholder="Key (e.g. Color)"
                  className="flex-1 rounded-xl border px-3 py-2 text-xs"
                />
                <input
                  value={row.value}
                  onChange={(e) => setAttrRow(i, { value: e.target.value })}
                  placeholder="Value (e.g. Red)"
                  className="flex-1 rounded-xl border px-3 py-2 text-xs"
                />
                <button
                  type="button"
                  onClick={() => removeAttrRow(i)}
                  className="w-8 h-8 grid place-items-center text-coral hover:text-coral/70 transition"
                >
                  <HiOutlineTrash />
                </button>
              </div>
            ))}
          </div>

          {errors.attributes && (
            <span className="block mt-1 text-[11px] text-coral font-jakarta font-medium">
              {errors.attributes}
            </span>
          )}
        </div>

        {/* API ERROR */}
        {apiError && (
          <div className="rounded-xl bg-coral/10 border border-coral/30 px-3 py-2 text-[11px] text-coral font-jakarta">
            <strong>Error:</strong> {apiError}
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" variant="coral" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Publish product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}