import { useEffect, useState } from "react";
import {
  HiOutlinePlus,
  HiOutlineTrash,
} from "react-icons/hi2";
import api from "../services/api";
import Modal from "./ui/Modal";
import { Input, Textarea } from "./ui/Input";
import { Button } from "./ui/Button";
import MediaUploader from "./ui/MediaUploader";

// Categories — aligned with the existing seller taxonomy. Backend accepts
// free-form strings so these are a reasonable superset that covers both the
// marketplace's artisan-focused labels and the generic buckets requested.
const CATEGORIES = [
  "Fashion",
  "Home",
  "Food",
  "Beauty",
  "Electronics",
  "Handmade",
  "Handloom & Sarees",
  "Jewellery",
  "Spices & Pickles",
  "Home Decor",
  "Ethnic Wear",
  "Organic Groceries",
  "Leather & Mojaris",
  "Pottery & Ceramics",
  "Ayurveda & Wellness",
  "Indie Beauty",
  "Madhubani Art",
  "Other",
];

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
  attributes: [], // [{key, value}]
  isActive: true,
};

function attrsObjectToRows(obj) {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj).map(([key, value]) => ({
    key,
    value: typeof value === "string" ? value : JSON.stringify(value),
  }));
}

function rowsToAttrsObject(rows) {
  const out = {};
  for (const r of rows) {
    const k = (r.key || "").trim();
    if (!k) continue;
    out[k] = r.value ?? "";
  }
  return out;
}

/**
 * ProductFormModal
 * Unified create + edit modal for seller products.
 *
 * Props:
 *   open     – boolean
 *   mode     – 'create' | 'edit' (falls back to 'edit' if `product` is set)
 *   product  – existing product (edit mode)
 *   onClose  – () => void
 *   onSaved  – () => void (called after successful create/update)
 */
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

  // Reset / hydrate form whenever the modal opens
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

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function setAttrRow(idx, patch) {
    setForm((f) => ({
      ...f,
      attributes: f.attributes.map((row, i) =>
        i === idx ? { ...row, ...patch } : row,
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

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    else if (form.title.trim().length < 3)
      e.title = "Title must be at least 3 characters";
    const priceNum = Number(form.price);
    if (!(priceNum > 0)) e.price = "Price must be greater than 0";
    const stockNum = Number(form.stock);
    if (!Number.isInteger(stockNum) || stockNum < 0)
      e.stock = "Stock must be a non-negative integer";
    if (form.compareAtPrice !== "" && Number(form.compareAtPrice) < 0)
      e.compareAtPrice = "Must be >= 0";
    if (!form.images.length) e.images = "At least 1 image is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
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
      images: form.images,
      videos: form.videos,
      attributes: rowsToAttrsObject(form.attributes),
    };
    if (form.compareAtPrice !== "")
      payload.compareAtPrice = Number(form.compareAtPrice);
    if (isEdit) payload.isActive = !!form.isActive;
    try {
      if (isEdit) {
        await api.patch(`/products/${product._id}`, payload);
      } else {
        await api.post("/products", payload);
      }
      onSaved?.();
      onClose?.();
    } catch (err) {
      setApiError(err.response?.data?.error || "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      eyebrow={isEdit ? "Edit listing" : "New listing"}
      title={isEdit ? "Edit product" : "Add a product"}
      width="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="Title"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          error={errors.title}
          placeholder="Handblock cotton saree..."
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Tell the story behind this piece..."
        />

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
                <option key={c} value={c}>
                  {c}
                </option>
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

        {/* Images */}
        <div>
          <MediaUploader
            label="Images"
            value={form.images}
            onChange={(v) => setForm((f) => ({ ...f, images: v }))}
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

        {/* Videos (optional) */}
        <div>
          <MediaUploader
            label="Videos (optional)"
            value={form.videos}
            onChange={(v) => setForm((f) => ({ ...f, videos: v }))}
            multiple
            accept="video/*"
            maxFiles={4}
            maxSizeMB={50}
            uploadUrl="/api/upload/video"
            fieldName="file"
          />
        </div>

        {/* Attributes (optional key-value rows) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-jakarta font-semibold text-ink/70 dark:text-cream/70 uppercase tracking-wider">
              Attributes{" "}
              <span className="opacity-60 normal-case">(optional)</span>
            </span>
            <button
              type="button"
              onClick={addAttrRow}
              className="inline-flex items-center gap-1 text-[11px] font-jakarta font-semibold text-coral hover:text-coral/80"
            >
              <HiOutlinePlus /> Add row
            </button>
          </div>
          {form.attributes.length === 0 ? (
            <p className="text-[11px] font-jakarta italic text-ink/45 dark:text-cream/45">
              e.g. Material → Cotton, Length → 5.5m
            </p>
          ) : (
            <div className="space-y-2">
              {form.attributes.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={row.key}
                    onChange={(e) => setAttrRow(i, { key: e.target.value })}
                    placeholder="Key (e.g. Material)"
                    className="flex-1 rounded-xl bg-white/80 dark:bg-ink/60 border border-ink/10 dark:border-cream/15 focus:border-coral/60 outline-none px-3 py-2 text-xs text-ink dark:text-cream placeholder:text-ink/40 dark:placeholder:text-cream/40 font-jakarta"
                  />
                  <input
                    value={row.value}
                    onChange={(e) => setAttrRow(i, { value: e.target.value })}
                    placeholder="Value (e.g. Cotton)"
                    className="flex-1 rounded-xl bg-white/80 dark:bg-ink/60 border border-ink/10 dark:border-cream/15 focus:border-coral/60 outline-none px-3 py-2 text-xs text-ink dark:text-cream placeholder:text-ink/40 dark:placeholder:text-cream/40 font-jakarta"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttrRow(i)}
                    className="w-8 h-8 grid place-items-center rounded-full text-ink/60 dark:text-cream/60 hover:bg-coral/10 hover:text-coral transition"
                    aria-label="remove row"
                  >
                    <HiOutlineTrash className="text-sm" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {isEdit && (
          <label className="flex items-center gap-2 text-xs font-jakarta text-ink/80 dark:text-cream/80 pt-1">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update("isActive", e.target.checked)}
              className="w-4 h-4 accent-coral"
            />
            Listing is active (visible to buyers)
          </label>
        )}

        {apiError && (
          <div className="rounded-xl bg-coral/10 border border-coral/30 px-3 py-2 text-[11px] font-jakarta text-coral">
            {apiError}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="coral"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Save changes"
                : "Publish product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
