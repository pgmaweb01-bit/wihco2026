import { createServerFn } from "@tanstack/react-start";

export const getEventFn = createServerFn({ method: "GET" }).handler(async () => {
  return {
    name: "WIHCN CON III",
    edition: "3rd Annual Conference",
    theme: "Beyond Leadership",
    subtitle: "Building Legacy & Advancing Innovation",
    message: "A more inclusive healthcare future is possible.",
    dateLong: "Friday, 30 October 2026",
    dateShort: "30 Oct 2026",
    time: "8:30 a.m. – 5:30 p.m.",
    afterParty: "6:00 p.m. – 9:00 p.m.",
    venue: "Harbour Point",
    city: "Lagos",
    hashtag: "#WIHCNCON3",
  };
});
