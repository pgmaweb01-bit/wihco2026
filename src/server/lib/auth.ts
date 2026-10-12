import { createRemoteJWKSet, jwtVerify } from "jose";
import { getRequestHeaders } from "@tanstack/react-start/server";

export interface SessionData {
  adminId: string;
  email: string;
  role: string;
  name?: string;
}

const NEON_AUTH_URL = (
  process.env.NEON_AUTH_URL ??
  (typeof import.meta.env !== "undefined"
    ? import.meta.env.VITE_NEON_AUTH_URL
    : undefined) ??
  ""
).replace(/\/+$/, "");

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "admin@wihcn.com").toLowerCase();

if (!NEON_AUTH_URL) {
  throw new Error(
    "NEON_AUTH_URL is not configured. Add it to Vercel environment variables.",
  );
}

const NEON_AUTH_ORIGIN = new URL(NEON_AUTH_URL).origin;
const JWKS_URL = `${NEON_AUTH_URL}/.well-known/jwks.json`;

const jwks = createRemoteJWKSet(new URL(JWKS_URL));

async function verifyAdminToken(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, jwks, {
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