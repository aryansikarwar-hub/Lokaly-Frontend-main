import { useEffect, useState } from "react";
import api from "../../services/api";
import Modal from "../ui/Modal";
import { Input, Textarea } from "../ui/Input";
import { Button } from "../ui/Button";
import MediaUploader from "../ui/MediaUploader";

const CATEGORIES = [
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
  isActive: true,
};

export default function ProductFormModal({ open, onClose, onSaved, product }) {
  const isEdit = !!product;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState(null);

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

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
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
      videos: [],
      attributes: {},
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
              className="w-full rounded-xl bg-white/80 dark:bg-ink/60 border border-ink/10 dark:border-cream/10 focus:border-coral/60 outline-none px-3 py-2.5 text-xs text-ink dark:text-cream font-jakarta"
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

        <div>
          <MediaUploader
            label="Images"
            value={form.images}
            onChange={(v) => update("images", v)}
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
            {saving ? "Saving..." : isEdit ? "Save changes" : "Publish product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
