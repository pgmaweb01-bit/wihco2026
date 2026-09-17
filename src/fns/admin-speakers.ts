import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/lib/prisma";

export const getAdminSpeakersFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const speakers = await prisma.speaker.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return speakers;
  });

export const createOrUpdateSpeakerFn = createServerFn({ method: "POST" })
  .validator((data: {
    id?: string;
    name: string;
    title: string;
    organisation: string;
    biography: string;
    imageUrl: string;
    role: string;
    displayOrder: number;
    active: boolean;
  }) => data)
  .handler(async ({ data }) => {
    if (data.id) {
      const speaker = await prisma.speaker.update({
        where: { id: data.id },
        data: {
          name: data.name,
          title: data.title,
          organisation: data.organisation,
          biography: data.biography,
          imageUrl: data.imageUrl,
          role: data.role,
          displayOrder: data.displayOrder,
          active: data.active,
        },
      });
      return speaker;
    }

    const speaker = await prisma.speaker.create({
      data: {
        name: data.name,
        title: data.title,
        organisation: data.organisation,
        biography: data.biography,
        imageUrl: data.imageUrl,
        role: data.role,
        displayOrder: data.displayOrder,
        active: data.active,
      },
    });

    return speaker;
  });

export const deleteSpeakerFn = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const speaker = await prisma.speaker.delete({
      where: { id: data.id },
    });

    return speaker;
  });
