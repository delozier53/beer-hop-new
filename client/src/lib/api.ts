// client/src/lib/api.ts
export const API_BASE =
  import.meta.env.VITE_API_BASE !== undefined
    ? import.meta.env.VITE_API_BASE
    : '';
// usage: fetch(`${API_BASE}/api/whatever`)
