import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const SESSION_SECRET = process.env.SESSION_SECRET || "wihcn-con3-dev-secret";

export interface SessionData {
  adminId: string;
  email: string;
  role: string;
}

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<SessionData | null> {
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { adminId: user.id, email: user.email, role: user.role };
}

export function createSessionCookie(session: SessionData): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64");
  const signature = Buffer.from(
    `${payload}:${SESSION_SECRET}`
  ).toString("base64");
  return `wihcn_session=${payload}.${signature}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`;
}

export function parseSessionCookie(cookieHeader: string | null): SessionData | null {
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...val] = c.trim().split("=");
      return [key, val.join("=")];
    })
  );

  const raw = cookies["wihcn_session"];
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expectedSig = Buffer.from(
    `${payload}:${SESSION_SECRET}`
  ).toString("base64");

  if (signature !== expectedSig) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64").toString()) as SessionData;
    if (!data.adminId || !data.email) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearSessionCookie(): string {
  return "wihcn_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0";
}

export function requireAdmin(cookieHeader: string | null): SessionData {
  const session = parseSessionCookie(cookieHeader);
  if (!session) {
    throw new Response(null, {
      status: 302,
      headers: { Location: "/admin/login" },
    });
  }
  return session;
}
