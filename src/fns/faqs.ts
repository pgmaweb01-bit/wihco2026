import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/lib/prisma";

export const getFaqsFn = createServerFn({ method: "GET" }).handler(async () => {
  return prisma.faq.findMany({
    where: { active: true },
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      question: true,
      answer: true,
      displayOrder: true,
    },
  });
});
