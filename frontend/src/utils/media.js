
const API_ORIGIN = import.meta.env.VITE_API_URL || '';

export function getImageUrl(url) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_ORIGIN}${url}`;
}