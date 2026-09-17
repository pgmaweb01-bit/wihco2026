import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/lib/prisma";

export const getSpeakersFn = createServerFn({ method: "GET" }).handler(async () => {
  return prisma.speaker.findMany({
    where: { active: true },
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      name: true,
      title: true,
      organisation: true,
      biography: true,
      imageUrl: true,
      role: true,
      displayOrder: true,
    },
  });
});
