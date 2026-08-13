// Thin fetch wrapper — this is the "API Calls" layer on the frontend side.
// It attaches the JWT access token, and transparently retries once with a
// refreshed token if the server says the access token expired (401).
const BASE_URL = '/api';

function getTokens() {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  };
}

function setAccessToken(token) {
  localStorage.setItem('accessToken', token);
}

export function setTokens({ accessToken, refreshToken }) {
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function refreshAccessToken() {
  const { refreshToken } = getTokens();
  if (!refreshToken) throw new Error('No refresh token available');

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  setAccessToken(data.accessToken);
  return data.accessToken;
}

// The single function every page/component calls. Async/await + one retry
// loop — no need for a separate promise-chain version, this is the pattern
// you'd actually ship.
export async function apiFetch(path, options = {}, isRetry = false) {
  const { accessToken } = getTokens();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 && !isRetry) {
    try {
      await refreshAccessToken();
      return apiFetch(path, options, true); // retry exactly once
    } catch {
      clearTokens();
      window.location.href = '/login';
      throw new Error('Session expired, please log in again');
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  if (res.status === 204) return null;
  return res.json();
}
