import { createServerFn } from "@tanstack/react-start";
import {
  authenticateAdmin,
  createSessionCookie,
  clearSessionCookie,
} from "@/server/lib/auth";

export const adminLoginFn = createServerFn({ method: "POST" })
  .validator((input: { email: string; password: string }) => {
    return { email: input.email, password: input.password };
  })
  .handler(async ({ data }) => {
    const admin = await authenticateAdmin(data.email, data.password);

    if (!admin) {
      return { success: false, error: "Invalid credentials" };
    }

    const cookie = createSessionCookie(admin);

    return { success: true, email: admin.email, cookie };
  });

export const adminLogoutFn = createServerFn({ method: "POST" })
  .validator(() => ({}))
  .handler(async () => {
    const cookie = clearSessionCookie();

    return { success: true, cookie };
  });
