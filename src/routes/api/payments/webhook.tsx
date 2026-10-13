import { createFileRoute } from "@tanstack/react-router";
import { processWebhookFn } from "@/fns/payment";

const MAX_WEBHOOK_BODY_BYTES = 1_000_000;

export const Route = createFileRoute("/api/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.text();
          const signature = request.headers.get("x-paystack-signature") || "";

          if (body.length > MAX_WEBHOOK_BODY_BYTES) {
            return new Response(JSON.stringify({ error: "Payload too large" }), {
              status: 413,
              headers: { "Content-Type": "application/json" },
            });
          }

          try {
            const result = await processWebhookFn({
              data: { body, signature },
            });

            return new Response(JSON.stringify(result), {
              headers: { "Content-Type": "application/json" },
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : "";

            // Client errors (bad signature / malformed payload): do not 500,
            // Paystack should not retry these indefinitely.
            if (
              message.includes("Invalid webhook signature") ||
              message.includes("Invalid webhook payload") ||
              message.includes("missing reference")
            ) {
              return new Response(JSON.stringify({ error: "Rejected" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
              });
            }

            console.error("Webhook error:", error);
            return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch (error) {
          console.error("Webhook error:", error);
          return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
  component: () => null,
});
