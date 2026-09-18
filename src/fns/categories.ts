import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/lib/prisma";

export const getCategoriesFn = createServerFn({ method: "GET" }).handler(async () => {
  return prisma.registrationCategory.findMany({
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
});
