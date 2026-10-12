import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import {
  authenticateAdmin,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  getAdminSession,
} from "@/server/lib/auth";
import {
  getLoginRateLimitStatus,
  recordLoginFailure,
  resetLoginAttempts,
} from "@/server/lib/rate-limit";

export const adminLoginFn = createServerFn({ method: "POST" })
  .validator((input: { email: string; password: string }) => {
    return {
      email: input.email.trim().toLowerCase(),
      password: input.password,
    };
  })
  .handler(async ({ data }) => {
    const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";

    if (getLoginRateLimitStatus(ip, data.email).limited) {
      return {
        success: false,
        error: "Too many attempts. Try again in a few minutes.",
      };
    }

    const admin = await authenticateAdmin(data.email, data.password);

    if (!admin) {
      recordLoginFailure(ip, data.email);
      return { success: false, error: "Invalid credentials" };
    }

    resetLoginAttempts(ip, data.email);
    setAdminSessionCookie(admin);

    return { success: true, email: admin.email };
  });

export const adminLogoutFn = createServerFn({ method: "POST" })
  .validator(() => ({}))
  .handler(async () => {
    clearAdminSessionCookie();
    return { success: true };
  });

export const getAdminSessionFn = createServerFn({ method: "GET" })
  .handler(async () => {
    return getAdminSession();
  });