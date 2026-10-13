/* Client-side helpers for the Neon Managed Better Auth API.
 *
 * The session cookie lives on the Neon auth origin, so every call here is a
 * cross-origin fetch with credentials: "include". The server never sees the
 * session cookie; instead the client fetches a short-lived JWT via /token and
 * forwards it as an Authorization header on server-function calls (see
 * src/start.ts functionMiddleware).
 */

import { NEON_AUTH_URL_DEFAULT } from "./neon-auth-config";

const AUTH_URL = (
  import.meta.env.VITE_NEON_AUTH_URL || NEON_AUTH_URL_DEFAULT
).replace(/\/+$/, "");

export class NeonAuthError extends Error {
  code: string;

  constructor(message: string, code = "NEON_AUTH_ERROR") {
    super(message);
    this.name = "NeonAuthError";
    this.code = code;
  }
}

async function jsonFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${AUTH_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;

  if (!res.ok) {
    const message =
      (data && (String(data.message ?? "") || String(data.error ?? ""))) ||
      `Request failed (${res.status})`;
    throw new NeonAuthError(message, String(data?.code ?? "") || undefined);
  }

  return data as T;
}

export interface NeonUser {
  id: string;
  email: string;
  name?: string;
  emailVerified?: boolean;
  role?: string;
}

interface SignInResponse {
  token?: string;
  user?: NeonUser;
  session?: { id: string; expiresAt: string; userId: string };
}

interface SessionResponse {
  session?: { id: string; expiresAt: string; userId: string } | null;
  user?: NeonUser | null;
}

interface TokenResponse {
  token?: string;
}

let cachedToken: string | undefined;
let cachedTokenAt = 0;

const TOKEN_CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchAuthToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedToken && now - cachedTokenAt < TOKEN_CACHE_TTL_MS) {
    return cachedToken;
  }

  try {
    const data = await jsonFetch<TokenResponse>("/token", { method: "GET" });
    const token = data?.token ?? null;
    if (token) {
      cachedToken = token;
      cachedTokenAt = now;
    }
    return token;
  } catch {
    return null;
  }
}

export function clearCachedToken(): void {
  cachedToken = undefined;
  cachedTokenAt = 0;
}

export async function getAuthToken(): Promise<string | null> {
  return fetchAuthToken();
}

export async function signInNeon(
  email: string,
  password: string,
): Promise<SignInResponse> {
  clearCachedToken();
  return jsonFetch<SignInResponse>("/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getNeonSession(): Promise<SessionResponse> {
  return jsonFetch<SessionResponse>("/get-session", { method: "GET" });
}

export async function signOutNeon(): Promise<void> {
  clearCachedToken();
  try {
    await jsonFetch("/sign-out", { method: "POST", body: "{}" });
  } catch {
    // The auth session cookie will still expire server-side; ignoring errors
    // here keeps logout non-blocking.
  }
}

export async function requestPasswordResetNeon(
  email: string,
  redirectTo: string,
): Promise<void> {
  await jsonFetch("/request-password-reset", {
    method: "POST",
    body: JSON.stringify({ email, redirectTo }),
  });
}

export async function completePasswordResetNeon(input: {
  email: string;
  token: string;
  newPassword: string;
}): Promise<void> {
  await jsonFetch("/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}