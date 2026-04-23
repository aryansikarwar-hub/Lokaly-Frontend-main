/**
 * On-device embeddings via @xenova/transformers (MiniLM L6 v2, 384 dims).
 * Used by the AI Shopper panel to re-rank server results locally and to
 * demonstrate the "no-API-key ML" story on the demo stage.
 */

let _pipe = null;
let _loading = null;

export async function loadEmbedder() {
  if (_pipe) return _pipe;
  if (_loading) return _loading;
  _loading = (async () => {
    const { pipeline } = await import('@xenova/transformers');
    _pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    return _pipe;
  })();
  return _loading;
}

export async function embed(text) {
  const p = await loadEmbedder();
  const out = await p(String(text).slice(0, 512), { pooling: 'mean', normalize: true });
  return Array.from(out.data);
}

export function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}
