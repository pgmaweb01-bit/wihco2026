import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/lib/prisma";

export const getCategoriesFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return await prisma.registrationCategory.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        currency: true,
        period: true,
      },
    });
  } catch {
    // Fallback if period column doesn't exist yet
    const rows = await prisma.registrationCategory.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        currency: true,
      },
    });
    return rows.map((r) => ({ ...r, period: "early_bird" }));
  }
});
