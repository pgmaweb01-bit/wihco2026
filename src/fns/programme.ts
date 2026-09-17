import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/lib/prisma";

export const getProgrammeFn = createServerFn({ method: "GET" }).handler(async () => {
  return prisma.programmeSession.findMany({
    where: { active: true },
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      startTime: true,
      endTime: true,
      sessionType: true,
      displayOrder: true,
    },
  });
});
