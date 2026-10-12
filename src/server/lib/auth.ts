import { createHmac } from "node:crypto";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";

import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "wihcn_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export interface SessionData {
  adminId: string;
  email: string;
  role: string;
}

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<SessionData | null> {
  const user = await prisma.adminUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { adminId: user.id, email: user.email, role: user.role };
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is not configured with a strong value");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(session: SessionData): string {
  const payload = Buffer.from(
    JSON.stringify({
      adminId: session.adminId,
      email: session.email,
      role: session.role,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    })
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(
  token: string | null | undefined
): SessionData | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expected = sign(payload);

  if (!constantTimeEqual(signature, expected)) {
    return null;
  }

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    ) as SessionData & { exp?: number };

    if (!data.adminId || !data.email) return null;
    if (
      typeof data.exp !== "number" ||
      data.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return { adminId: data.adminId, email: data.email, role: data.role };
  } catch {
    return null;
  }
}

export function getAdminSession(): SessionData | null {
  let token: string | undefined;
  try {
    token = getCookie(SESSION_COOKIE);
  } catch {
    return null;
  }
  return verifySessionToken(token);
}

export function requireAdmin(): SessionData {
  const session = getAdminSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export function setAdminSessionCookie(session: SessionData): void {
  setCookie(SESSION_COOKIE, createSessionToken(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearAdminSessionCookie(): void {
  deleteCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export function requireAdminOrUnauthorizedResponse(): Response | null {
  try {
    requireAdmin();
    return null;
  } catch {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}