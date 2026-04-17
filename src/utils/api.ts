/**
 * Helper function to make authenticated API requests
 * Automatically includes the JWT token from localStorage
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://atelier-backend-git-deploy-juanngzs-projects.vercel.app';

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('authToken');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as HeadersInit),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });
}
