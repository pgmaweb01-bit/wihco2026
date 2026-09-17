import { createServerFn } from "@tanstack/react-start";
import { prisma } from "@/server/lib/prisma";

export const getAdminFaqsFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const faqs = await prisma.faq.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return faqs;
  });

export const createOrUpdateFaqFn = createServerFn({ method: "POST" })
  .validator((data: {
    id?: string;
    question: string;
    answer: string;
    displayOrder: number;
    active: boolean;
  }) => data)
  .handler(async ({ data }) => {
    if (data.id) {
      const faq = await prisma.faq.update({
        where: { id: data.id },
        data: {
          question: data.question,
          answer: data.answer,
          displayOrder: data.displayOrder,
          active: data.active,
        },
      });
      return faq;
    }

    const faq = await prisma.faq.create({
      data: {
        question: data.question,
        answer: data.answer,
        displayOrder: data.displayOrder,
        active: data.active,
      },
    });

    return faq;
  });

export const deleteFaqFn = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const faq = await prisma.faq.delete({
      where: { id: data.id },
    });

    return faq;
  });
