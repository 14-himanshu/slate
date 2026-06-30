// Centralised API client — all calls go through here
// Automatically attaches the JWT token from localStorage

const getApiBase = () => {
  const url = import.meta.env.VITE_BACKEND_URL;
  if (url) return url.endsWith('/') ? url.slice(0, -1) : url;
  
  // Robust fallback for local development
   
  return import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:8080`;
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
  statusMessage?: string;
}): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/user/update`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  const data = await handleResponse<{ user: UserProfile }>(res);
  return data.user;
}

export async function deleteAccount(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/user`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleResponse(res);
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

export async function requestPasswordReset(username: string): Promise<{ code: string, message: string }> {
  const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  return await handleResponse<{ code: string, message: string }>(res);
}

export async function resetPassword(username: string, code: string, newPassword: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, code, newPassword }),
  });
  return await handleResponse<{ message: string }>(res);
}

import type { DirectConversationSummary, UserSummary } from '../types';

export async function searchUsers(query: string): Promise<UserSummary[]> {
  const res = await fetch(`${API_BASE}/api/user/search?q=${encodeURIComponent(query)}`, { headers: authHeaders() });
  const data = await handleResponse<{ users: UserSummary[] }>(res);
  return data.users;
}

export async function searchMessages(query: string): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/api/user/search-messages?q=${encodeURIComponent(query)}`, { headers: authHeaders() });
  const data = await handleResponse<{ messages: Message[] }>(res);
  return data.messages;
}

export async function updatePublicKey(publicKey: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/user/public-key`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ publicKey })
  });
  await handleResponse(res);
}

export async function fetchDirectConversations(): Promise<DirectConversationSummary[]> {
  const res = await fetch(`${API_BASE}/api/dm/conversations`, { headers: authHeaders() });
  const data = await handleResponse<{ conversations: DirectConversationSummary[] }>(res);
  return data.conversations;
}

export async function createDirectConversation(userId: string): Promise<DirectConversationSummary> {
  const res = await fetch(`${API_BASE}/api/dm/conversations`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ userId })
  });
  const data = await handleResponse<{ conversation: DirectConversationSummary }>(res);
  return data.conversation;
}

export async function markDirectConversationRead(conversationId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/dm/conversations/${conversationId}/read`, {
    method: 'POST',
    headers: authHeaders()
  });
  await handleResponse(res);
}

export async function deleteDirectConversation(conversationId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/dm/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  await handleResponse(res);
}

export async function fetchLinkPreview(url: string): Promise<{ title: string | null; description: string | null; image: string | null; url: string }> {
  const res = await fetch(`${API_BASE}/api/metadata/link-preview?url=${encodeURIComponent(url)}`, { headers: authHeaders() });
  const data = await handleResponse<{ metadata: { title: string | null; description: string | null; image: string | null; url: string } }>(res);
  return data.metadata;
}

import type { RoomSummary } from '../types';

export async function createRoom(name: string, description?: string): Promise<RoomSummary> {
  const res = await fetch(`${API_BASE}/api/rooms`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name, description })
  });
  return await handleResponse<RoomSummary>(res);
}

export async function getRoom(roomId: string): Promise<RoomSummary> {
  const res = await fetch(`${API_BASE}/api/rooms/${encodeURIComponent(roomId)}`, { headers: authHeaders() });
  return await handleResponse<RoomSummary>(res);
}

export async function getUserRooms(): Promise<RoomSummary[]> {
  const res = await fetch(`${API_BASE}/api/rooms/user`, { headers: authHeaders() });
  return await handleResponse<RoomSummary[]>(res);
}

// ── Bookmarks ────────────────────────────────────────────────────────

import type { Message } from '../types';

export async function fetchSavedMessages(): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/api/user/bookmarks`, { headers: authHeaders() });
  const data = await handleResponse<{ messages: Message[] }>(res);
  return data.messages;
}

export async function saveMessage(messageId: string, type: 'room' | 'dm'): Promise<void> {
  const res = await fetch(`${API_BASE}/api/user/bookmarks`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ messageId, type })
  });
  await handleResponse(res);
}

export async function unsaveMessage(messageId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/user/bookmarks/${encodeURIComponent(messageId)}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  await handleResponse(res);
}

// ── Pins ────────────────────────────────────────────────────────
// TODO: Implement backend endpoints for pinning
export async function pinMessage(messageId: string, type: 'room' | 'dm'): Promise<void> {
  console.warn('pinMessage is not fully implemented in the backend yet.');
  return Promise.resolve();
}

export async function unpinMessage(messageId: string): Promise<void> {
  console.warn('unpinMessage is not fully implemented in the backend yet.');
  return Promise.resolve();
}
