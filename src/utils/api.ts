import { UserData } from '../types/game';

const API_BASE = '/api/braingames';

export function getSessionToken(): string | null {
  return localStorage.getItem('braingames_session_token');
}

export function getUserEmail(): string | null {
  return localStorage.getItem('braingames_user_email');
}

export function clearAuth(): void {
  localStorage.removeItem('braingames_session_token');
  localStorage.removeItem('braingames_user_email');
}

function setSessionToken(token: string): void {
  localStorage.setItem('braingames_session_token', token);
}

function setUserEmail(email: string): void {
  localStorage.setItem('braingames_user_email', email);
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

export async function requestMagicLink(email: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/auth/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function verifyToken(token: string): Promise<{ session_token?: string; email?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (data.session_token) {
    setSessionToken(data.session_token);
    setUserEmail(data.email);
  }
  return data;
}

export async function checkAuth(): Promise<{ authenticated: boolean; email?: string }> {
  const token = getSessionToken();
  if (!token) return { authenticated: false };
  try {
    const res = await authFetch('/auth/me');
    if (!res.ok) {
      clearAuth();
      return { authenticated: false };
    }
    return res.json();
  } catch {
    return { authenticated: false };
  }
}

export async function logout(): Promise<void> {
  try {
    await authFetch('/auth/logout', { method: 'POST' });
  } catch {
    // OK if server unreachable
  }
  clearAuth();
}

export async function loadProgress(): Promise<UserData | null> {
  try {
    const res = await authFetch('/progress');
    if (!res.ok) return null;
    const { data } = await res.json();
    return data;
  } catch {
    return null;
  }
}

export async function saveProgress(data: UserData): Promise<boolean> {
  try {
    const res = await authFetch('/progress', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch {
    return false;
  }
}
