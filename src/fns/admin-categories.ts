import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/lib/prisma";

export const getAdminCategoriesFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { attendees: true } },
      },
      orderBy: { name: "asc" },
    });

    return categories;
  });

export const createOrUpdateCategoryFn = createServerFn({ method: "POST" })
  .validator((data: {
    id?: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    active: boolean;
  }) => data)
  .handler(async ({ data }) => {
    if (data.id) {
      const category = await prisma.category.update({
        where: { id: data.id },
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          currency: data.currency,
          active: data.active,
        },
      });
      return category;
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency,
        active: data.active,
      },
    });

    return category;
  });
