import { createFileRoute } from "@tanstack/react-router";
import QRCode from "qrcode";

export const Route = createFileRoute("/api/qr/$token")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { token } = params;
        const origin = new URL(request.url).origin;
        const ticketUrl = `${origin}/ticket/${token}`;

        try {
          const buffer = await QRCode.toBuffer(ticketUrl, {
            width: 600,
            margin: 2,
            color: { dark: "#082266", light: "#ffffff" },
          });

          return new Response(new Uint8Array(buffer), {
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "public, max-age=86400",
            },
          });
        } catch (error) {
          console.error("QR generation error:", error);
          return new Response("Not Found", { status: 404 });
        }
      },
    },
  },
  component: () => null,
});