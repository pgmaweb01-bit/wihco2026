/**
 * Registration kill switch.
 *
 * Set to `true` to close registration and disable all payment-gateway access:
 * the registration form is replaced with a notice, `createRegistrationFn`
 * refuses new registrations and `initializePaymentFn` refuses to create
 * Paystack transactions. Existing paid attendees are unaffected; while the
 * gateway is disconnected (`PAYMENT_GATEWAY_ENABLED = false`) admins settle
 * offline payments with the manual "Mark Paid" action.
 */
export const REGISTRATION_CLOSED = true;

export const REGISTRATION_CLOSED_MESSAGE =
  "Registration for WIHCN CON III is now closed. If you have already paid and have not received your ticket, please contact the organising team at admin@wihcn.com with your payment receipt.";
