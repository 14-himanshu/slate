// Centralised API client — all calls go through here
// Automatically attaches the JWT token from localStorage

const getApiBase = () => {
  const url = import.meta.env.VITE_BACKEND_URL;
  if (url) return url.endsWith('/') ? url.slice(0, -1) : url;
  
  // Robust fallback for local development
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal ? 'http://localhost:8080' : '';
};

const API_BASE = getApiBase();

function getToken(): string | null {
  return localStorage.getItem('chat_token');
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_username');
    window.location.reload();
    throw new Error('Session expired. Please sign in again.');
  }
  const json = await res.json() as T & { error?: string };
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? 'Request failed.');
  }
  return json;
}

import type { UserProfile } from '../types';

export async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/user/me`, {
    headers: authHeaders(),
  });
  const data = await handleResponse<{ user: UserProfile }>(res);
  return data.user;
}

export async function updateProfile(body: {
  username?: string;
  bio?: string;
  status?: string;
}): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/user/update`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  const data = await handleResponse<{ user: UserProfile }>(res);
  return data.user;
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const form = new FormData();
  form.append('avatar', file);
  const res = await fetch(`${API_BASE}/api/user/avatar`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  const data = await handleResponse<{ user: UserProfile }>(res);
  return data.user;
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/user/change-password`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  await handleResponse<{ message: string }>(res);
}

// ── Auth ─────────────────────────────────────────────────────────

export async function signup(username: string, password: string): Promise<{ token: string, username: string }> {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return await handleResponse<{ token: string, username: string }>(res);
}

export async function login(username: string, password: string): Promise<{ token: string, username: string }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return await handleResponse<{ token: string, username: string }>(res);
}
