// API Base URL for FENEC Backend on OCI
export const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'https://alfa-api.servicesbr.duckdns.org/fenec-api';

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}
