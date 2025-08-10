export const API_BASE =
  import.meta.env.VITE_API_BASE !== undefined ? import.meta.env.VITE_API_BASE : '';

export async function authFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  
  // For now, we'll use a hardcoded user ID for demo purposes
  // In a real app, this would come from your authentication system
  const storedUser = localStorage.getItem("beer-hop-user");
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      headers.set('x-user-id', userData.id);
    } catch (error) {
      console.error("Error parsing stored user data:", error);
    }
  }
  
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');

  return fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' });
}
