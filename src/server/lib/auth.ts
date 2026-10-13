import { createRemoteJWKSet, jwtVerify } from "jose";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { NEON_AUTH_URL_DEFAULT } from "../../lib/neon-auth-config";

export interface SessionData {
  adminId: string;
  email: string;
  role: string;
  name?: string;
}

const NEON_AUTH_URL = (
  process.env.NEON_AUTH_URL ||
  import.meta.env.VITE_NEON_AUTH_URL ||
  NEON_AUTH_URL_DEFAULT
).replace(/\/+$/, "");

const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ?? "raynovastudio@gmail.com"
).toLowerCase();

const NEON_AUTH_ORIGIN = NEON_AUTH_URL ? new URL(NEON_AUTH_URL).origin : "";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${NEON_AUTH_URL}/.well-known/jwks.json`));
  }
  return jwks;
}

async function verifyAdminToken(token: string): Promise<SessionData | null> {
  if (!NEON_AUTH_URL || !NEON_AUTH_ORIGIN) return null;
  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: NEON_AUTH_ORIGIN,
      audience: NEON_AUTH_ORIGIN,
    });

    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
    if (!email || email !== ADMIN_EMAIL) return null;
    if (payload.emailVerified !== true) return null;

    return {
      adminId: typeof payload.sub === "string" ? payload.sub : email,
      email: email,
      role: "admin",
      name: typeof payload.name === "string" ? payload.name : undefined,
    };
  } catch {
    return null;
  }
}

function readBearerToken(): string | null {
  let headers: Headers;
  try {
    headers = getRequestHeaders();
  } catch {
    return null;
  }

  const auth = headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;

  const token = auth.slice("Bearer ".length).trim();
  return token ? token : null;
}

export async function getAdminSession(): Promise<SessionData | null> {
  const token = readBearerToken();
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function requireAdmin(): Promise<SessionData> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireAdminOrUnauthorizedResponse(): Promise<Response | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}