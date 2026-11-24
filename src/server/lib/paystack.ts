import { createHmac } from "node:crypto";
import { PAYMENT_GATEWAY_ENABLED, PAYMENT_GATEWAY_DISABLED_MESSAGE } from "@/lib/payment-config";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const DEFAULT_PAYMENT_PAGE_URL = "https://paystack.shop/pay/wihcniii2026";

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    metadata: Record<string, unknown>;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

/**
 * Secret key is read at call time (not module load) and never falls back to
 * an empty string — an empty key would let anyone forge webhook signatures.
 */
export function getPaystackSecretKey(): string | null {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

function requirePaystackSecretKey(): string {
  const key = getPaystackSecretKey();
  if (!key) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured — refusing to call Paystack");
  }
  return key;
}

/**
 * Gateway kill switch. Every outbound Paystack call funnels through this, so
 * disconnecting the gateway cannot be bypassed by a stray code path or a
 * caller that forgets to check the flag.
 */
function assertPaymentGatewayEnabled(): void {
  if (!PAYMENT_GATEWAY_ENABLED) {
    throw new Error(PAYMENT_GATEWAY_DISABLED_MESSAGE);
  }
}

/** Base URL of the deployed app, or null when APP_URL is unset/invalid. */
export function getAppBaseUrl(): string | null {
  const raw = process.env.APP_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Allowlist of URLs Paystack may redirect to after checkout.
 *
 * Built only from server-controlled config (APP_URL plus an optional
 * comma-separated PAYSTACK_EXTRA_CALLBACK_URLS). Client input can never
 * influence this list.
 */
export function getAllowedCallbackUrls(): string[] {
  const urls: string[] = [];

  const base = getAppBaseUrl();
  if (base) {
    urls.push(`${base}/payment-success`);
  }

  const extra = process.env.PAYSTACK_EXTRA_CALLBACK_URLS?.trim();
  if (extra) {
    for (const part of extra.split(",")) {
      const candidate = part.trim();
      if (!candidate) continue;
      try {
        const url = new URL(candidate);
        if (
          url.protocol === "https:" ||
          url.hostname === "localhost" ||
          url.hostname === "127.0.0.1"
        ) {
          urls.push(url.toString());
        }
      } catch {
        // ignore malformed entries
      }
    }
  }

  return urls;
}

/** Returns an allowlisted callback URL, or undefined to use Paystack's dashboard default. */
export function resolvePaymentCallbackUrl(): string | undefined {
  return getAllowedCallbackUrls()[0];
}

/** Static Paystack Payment Page URL, overridable via env. */
export function getPaymentPageUrl(): string {
  return process.env.PAYSTACK_PAYMENT_PAGE_URL?.trim() || DEFAULT_PAYMENT_PAGE_URL;
}

export async function initializePaystackTransaction(params: {
  email: string;
  amount: number;
  reference: string;
  currency?: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitResponse> {
  assertPaymentGatewayEnabled();
  const secretKey = requirePaystackSecretKey();

  const body: Record<string, unknown> = {
    email: params.email,
    amount: Math.round(params.amount * 100),
    reference: params.reference,
    currency: params.currency ?? "NGN",
    metadata: params.metadata ?? {},
  };

  const callbackUrl = resolvePaymentCallbackUrl();
  if (callbackUrl) {
    body.callback_url = callbackUrl;
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paystack initialization failed: ${error}`);
  }

  return response.json();
}

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerifyResponse> {
  assertPaymentGatewayEnabled();
  const secretKey = requirePaystackSecretKey();

  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paystack verification failed: ${error}`);
  }

  return response.json();
}

export interface PaystackTransactionSummary {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  customer?: { email?: string };
  metadata?: Record<string, unknown> | string | null;
}

export interface PaystackListResponse {
  status: boolean;
  message: string;
  data: PaystackTransactionSummary[];
  meta?: { page: number; perPage: number; pageCount: number; total: number };
}

/**
 * List transactions captured by the Paystack account. Used by admin-side
 * reconciliation: static Payment Page checkouts never expose our reference,
 * so success is matched by payer email instead.
 */
export async function listPaystackTransactions(params: {
  email?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
}): Promise<PaystackListResponse> {
  assertPaymentGatewayEnabled();
  const secretKey = requirePaystackSecretKey();

  const query = new URLSearchParams();
  if (params.email) query.set("customer", params.email);
  if (params.status) query.set("status", params.status);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  query.set("page", String(params.page ?? 1));
  query.set("perPage", String(params.perPage ?? 100));

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction?${query.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paystack transaction list failed: ${error}`);
  }

  return response.json();
}

export function validateWebhookSignature(
  body: string,
  signature: string | null | undefined,
): boolean {
  if (!signature) return false;

  const secretKey = getPaystackSecretKey();
  // Fail closed: without a real secret we cannot validate, and signing with
  // an empty/short key would be forgeable.
  if (!secretKey || secretKey.length < 16) return false;

  const expected = createHmac("sha512", secretKey).update(body).digest("hex");

  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}
