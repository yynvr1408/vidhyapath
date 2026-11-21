/**
 * Global API URL resolver for Vidyapath.
 * - When deployed on Netlify: Relative URLs (e.g. `/api/...`) are automatically proxied
 *   to the Render backend by Netlify Edge CDN via netlify.toml, avoiding all CORS preflights.
 * - When running in standalone mode, Android APK, or custom domain: VITE_API_BASE_URL can
 *   be specified to point directly to Render (e.g. `https://vidyapath.onrender.com`).
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) return cleanPath;
  return `${API_BASE_URL}${cleanPath}`;
}
