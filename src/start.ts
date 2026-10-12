import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";
import { getRequestProtocol } from "@tanstack/react-start/server";

import { renderErrorPage } from "./lib/error-page";

// Origin of the Neon Managed Better Auth gateway (see NEON_AUTH_URL). Client
// auth calls (sign-in, token, reset) are cross-origin fetches, so it must be
// allowed by connect-src.
const NEON_AUTH_ORIGIN =
  "https://ep-soft-hat-b4451rsm.neonauth.c-6.us-east-2.aws.neon.tech";

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://paystack.shop",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${NEON_AUTH_ORIGIN}`,
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const securityHeadersMiddleware = createMiddleware().server(async ({ next }) => {
  const result = await next();
  const headers = result.response.headers;

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=(), payment=(self)");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");

  const protocol = getRequestProtocol({ xForwardedProto: true });
  if (protocol === "https") {
    headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  headers.set("Content-Security-Policy", CSP);

  return result;
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

// Admin pages render their guard client-side, so the session cookie on the
// Neon auth origin must be translated into an Authorization header on every
// server-function call. The JWT is fetched lazily and cached (see
// src/lib/neon-auth.ts) to keep the value fresh without hammering the gateway.
const neonAuthMiddleware = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    try {
      const { getAuthToken } = await import("./lib/neon-auth");
      const token = await getAuthToken();
      if (token) {
        return next({ headers: { authorization: `Bearer ${token}` } });
      }
    } catch {}
    return next();
  },
);

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeadersMiddleware, errorMiddleware, csrfMiddleware],
  functionMiddleware: [neonAuthMiddleware],
}));