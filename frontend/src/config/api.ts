/**
 * Browser API URL resolver & network client for Vidyapath.
 * - Deployed sites use their same-origin /api proxy.
 * - Vite development uses the local /api proxy.
 * - VITE_API_BASE_URL can point the web app at a separate API host when needed.
 * - In all environments: Safely wraps `fetch` and `.json()` so that HTML error responses
 *   (e.g. Render waking up from sleep, 502/503) never crash the app with "<!DOCTYPE" JSON parse errors.
 */

const rawEnvUrl = ((import.meta as any).env?.VITE_API_BASE_URL as string) || '';
export const API_BASE_URL = rawEnvUrl.replace(/\/+$/, '');

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) return cleanPath;
  return `${API_BASE_URL}${cleanPath}`;
}

// Global window.fetch patch to guarantee all /api calls reach the right host and parse safely
if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url: string = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input instanceof Request) {
      url = input.url;
    }

    // Rewrite relative /api/... calls when an external API host is configured.
    if (API_BASE_URL && (url.startsWith('/api/') || url === '/api')) {
      const resolved = getApiUrl(url);
      if (typeof input === 'string' || input instanceof URL) {
        input = resolved;
      } else {
        input = new Request(resolved, input);
      }
    }

    try {
      const res = await originalFetch(input, init);

      // Wrap .json() safely so HTML responses (such as Render cold-start or 502/503)
      // return a structured error instead of throwing a SyntaxError for "<!DOCTYPE"
      const originalJson = res.json.bind(res);
      res.json = async () => {
        try {
          const clone = res.clone();
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            return await originalJson();
          }

          const text = await clone.text();
          if (text.trim().startsWith('<') || text.includes('<!DOCTYPE')) {
            if (res.status === 502 || res.status === 503 || res.status === 504) {
              return {
                success: false,
                error: 'Vidyapath cloud server is currently waking up on Render. Please retry in 10-15 seconds.',
              };
            }
            if (res.status === 404) {
              return {
                success: false,
                error: 'API endpoint not found (HTTP 404). Please ensure backend is reachable.',
              };
            }
            return {
              success: false,
              error: `Server responded with HTML (Status ${res.status}). Please check server connection.`,
            };
          }

          return JSON.parse(text);
        } catch (err: any) {
          return {
            success: false,
            error: err.message || 'Could not parse response from server.',
          };
        }
      };

      return res;
    } catch (networkErr: any) {
      // Re-throw or handle connection refused
      throw networkErr;
    }
  };
}
