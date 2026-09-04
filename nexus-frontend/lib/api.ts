import { User, AgentChatResponse, TokenResponse } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'nexus_access_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function removeStoredToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function mimicAuth(role?: 'expert' | 'client', user_id?: number): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/auth/mimic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, user_id }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Auth mimic failed' }));
    throw new Error(errData.detail || 'Failed to authenticate');
  }

  const data: TokenResponse = await res.json();
  setStoredToken(data.access_token);
  return data;
}

export async function getMe(): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Unauthenticated');
  }

  return res.json();
}

export async function sendAgentMessage(message: string, sessionId?: string): Promise<AgentChatResponse> {
  const res = await fetch(`${API_BASE}/agent/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      message,
      session_id: sessionId,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Failed to send message' }));
    throw new Error(errData.detail || 'Error communicating with NEXUS agent');
  }

  return res.json();
}

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
}

// Legacy compatibility stubs for deprecated components
export const api = {
  getToken: getStoredToken,
  setToken: setStoredToken,
  clearToken: removeStoredToken,
  mimicAuth,
  getMe,
  getUserMe: getMe,
  demoLogin: async () => mimicAuth(),
  sendAgentMessage,
  describeExpert: async (input: string) => sendAgentMessage(input),
  describeClientProblem: async (input: string) => sendAgentMessage(input),
  answerClientQuestion: async (input: string) => sendAgentMessage(input),
  addOffering: async (offering: any) => ({ success: true }),
  approveDraft: async (draftId: string) => ({ success: true }),
  getHealth: async () => ({ status: 'ok' }),
};
