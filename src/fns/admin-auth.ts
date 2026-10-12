import { createServerFn } from "@tanstack/react-start";
import { getAdminSession } from "@/server/lib/auth";

export const getAdminSessionFn = createServerFn({ method: "GET" }).handler(
  async () => {
    return getAdminSession();
  },
);