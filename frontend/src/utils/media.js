// Backend-uploaded images are stored as relative paths like
// "/uploads/properties/xxx.jpg". Locally, Vite's dev proxy makes that work
// as-is. In production, frontend (Vercel) and backend (Render) live on
// different domains, so relative paths need the backend's origin prepended.
// Seeded demo images and any admin-entered banner URLs are already
// absolute (https://...), so this passes those through unchanged.
const API_ORIGIN = import.meta.env.VITE_API_URL || '';

export function getImageUrl(url) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_ORIGIN}${url}`;
}