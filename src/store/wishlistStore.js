const WISHLIST_KEY = "lokaly.wishlist";

function readWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeWishlist(ids) {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
  } catch {}
}

export function isWishlisted(productId) {
  return readWishlist().includes(String(productId));
}

export function toggleWishlist(productId) {
  const id = String(productId);
  const current = readWishlist();
  const exists = current.includes(id);
  const next = exists ? current.filter((x) => x !== id) : [...current, id];
  writeWishlist(next);
  return !exists; // returns true if added, false if removed
}
