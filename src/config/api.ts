// Base URL of the public API server. Empty means same-origin (web build).
// Native Android and iOS builds set VITE_API_BASE_URL at build time.
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
export const API_BASE: string = env?.VITE_API_BASE_URL ?? '';

export function getApiBaseUrl(): string {
  return API_BASE;
}
