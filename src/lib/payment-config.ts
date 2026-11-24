/**
 * Payment gateway kill switch.
 *
 * Set to `true` to reconnect Paystack. While `false`:
 *  - no outbound request is ever made to Paystack (initialize, verify, list)
 *  - the webhook endpoint answers 410 Gone without processing the payload
 *  - `verifyPaymentFn` only reads our own database
 *  - admin "Verify Payment" / "Sync Paystack" reconciliation is refused
 *
 * Existing payment and ticket records are untouched, so the admin "Mark Paid"
 * flow still works for money received before the gateway was disconnected.
 */
export const PAYMENT_GATEWAY_ENABLED = false;

export const PAYMENT_GATEWAY_DISABLED_MESSAGE =
  "The payment gateway is disconnected. Online payments are closed — existing payments must be reconciled manually by an administrator.";
