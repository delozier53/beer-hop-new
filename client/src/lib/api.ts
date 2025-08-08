import { supabase } from './supabase';

export const API_BASE =
  import.meta.env.VITE_API_BASE !== undefined ? import.meta.env.VITE_API_BASE : '';

export async function authFetch(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');

  return fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' });
}
