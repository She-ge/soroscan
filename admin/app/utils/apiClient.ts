/**
 * Lightweight fetch wrapper for the SoroScan Django backend.
 *
 * Auth: reads a JWT access token from localStorage key `soroscan_access_token`,
 * falling back to the `NEXT_PUBLIC_API_KEY` env variable for API-key auth.
 * Both approaches send a single Authorization header that the backend accepts.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

function getAuthHeader(): Record<string, string> {
  if (typeof window !== 'undefined') {
    const jwt = localStorage.getItem('soroscan_access_token');
    if (jwt) return { Authorization: `Bearer ${jwt}` };
  }
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  if (apiKey) return { Authorization: `ApiKey ${apiKey}` };
  return {};
}

export interface ApiError {
  status: number;
  message: string;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw { status: res.status, message: body || res.statusText } as ApiError;
  }

  return res.json() as Promise<T>;
}
