import { prisma } from "../lib/prisma";

export async function generateAttendeeId(): Promise<string> {
  const year = "26";
  const prefix = `WIHCN${year}-`;

  const lastAttendee = await prisma.attendee.findFirst({
    where: {
      attendeeId: { startsWith: prefix },
    },
    orderBy: { attendeeId: "desc" },
    select: { attendeeId: true },
  });

  let nextNumber = 1;
  if (lastAttendee?.attendeeId) {
    const lastNum = parseInt(lastAttendee.attendeeId.replace(prefix, ""), 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(6, "0")}`;
}
