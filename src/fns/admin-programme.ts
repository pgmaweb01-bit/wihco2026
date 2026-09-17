import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/lib/prisma";

export const getAdminProgrammeFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const sessions = await prisma.programmeSession.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return sessions;
  });

export const createOrUpdateProgrammeFn = createServerFn({ method: "POST" })
  .validator((data: {
    id?: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    sessionType: string;
    displayOrder: number;
    active: boolean;
  }) => data)
  .handler(async ({ data }) => {
    const sessionData = {
      title: data.title,
      description: data.description,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      sessionType: data.sessionType,
      displayOrder: data.displayOrder,
      active: data.active,
    };

    if (data.id) {
      const session = await prisma.programmeSession.update({
        where: { id: data.id },
        data: sessionData,
      });
      return session;
    }

    const session = await prisma.programmeSession.create({
      data: sessionData,
    });

    return session;
  });

export const deleteProgrammeFn = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await prisma.programmeSession.delete({
      where: { id: data.id },
    });

    return session;
  });
