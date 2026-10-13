/**
 * Payment security unit tests — run with: npx tsx scripts/payment-security-tests.ts
 * Covers webhook signature validation, callback URL allowlisting, and
 * server-side amount/currency settlement guards. No network or DB required.
 */
import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import {
  validateWebhookSignature,
  getAllowedCallbackUrls,
  resolvePaymentCallbackUrl,
  getAppBaseUrl,
  getPaymentPageUrl,
  getPaystackSecretKey,
} from "../src/server/lib/paystack";
import {
  getServerPrice,
  toKobo,
  isAmountMatch,
  isCurrencyMatch,
  REGISTRATION_PRICING,
  PAYSTACK_CURRENCY,
} from "../src/server/lib/pricing";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err instanceof Error ? err.message : err}`);
  }
}

const SECRET = "sk_test_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1234";
const BODY = JSON.stringify({ event: "charge.success", data: { reference: "r" } });

function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
  const prev: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(vars)) {
    prev[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

console.log("\n── Webhook signature validation ──");

test("valid signature passes (timing-safe compare)", () => {
  withEnv({ PAYSTACK_SECRET_KEY: SECRET }, () => {
    const sig = createHmac("sha512", SECRET).update(BODY).digest("hex");
    assert.equal(validateWebhookSignature(BODY, sig), true);
  });
});

test("tampered body fails", () => {
  withEnv({ PAYSTACK_SECRET_KEY: SECRET }, () => {
    const sig = createHmac("sha512", SECRET).update(BODY).digest("hex");
    assert.equal(validateWebhookSignature(BODY + " ", sig), false);
  });
});

test("forged signature fails", () => {
  withEnv({ PAYSTACK_SECRET_KEY: SECRET }, () => {
    const sig = createHmac("sha512", "sk_test_attacker_key_0000000000000000")
      .update(BODY)
      .digest("hex");
    assert.equal(validateWebhookSignature(BODY, sig), false);
  });
});

test("missing signature fails", () => {
  withEnv({ PAYSTACK_SECRET_KEY: SECRET }, () => {
    assert.equal(validateWebhookSignature(BODY, null), false);
    assert.equal(validateWebhookSignature(BODY, undefined), false);
    assert.equal(validateWebhookSignature(BODY, ""), false);
  });
});

test("missing secret key fails closed (no empty-key HMAC)", () => {
  withEnv({ PAYSTACK_SECRET_KEY: undefined }, () => {
    const emptyKeySig = createHmac("sha512", "").update(BODY).digest("hex");
    assert.equal(validateWebhookSignature(BODY, emptyKeySig), false);
    assert.equal(getPaystackSecretKey(), null);
  });
});

test("whitespace-only secret fails closed", () => {
  withEnv({ PAYSTACK_SECRET_KEY: "   " }, () => {
    assert.equal(getPaystackSecretKey(), null);
    assert.equal(validateWebhookSignature(BODY, "x"), false);
  });
});

test("short secret (<16 chars) fails closed", () => {
  withEnv({ PAYSTACK_SECRET_KEY: "sk_short" }, () => {
    const sig = createHmac("sha512", "sk_short").update(BODY).digest("hex");
    assert.equal(validateWebhookSignature(BODY, sig), false);
  });
});

console.log("\n── Callback URL allowlist ──");

test("https APP_URL yields https://…/payment-success", () => {
  withEnv(
    { APP_URL: "https://www.conference-wihcn.xyz", PAYSTACK_EXTRA_CALLBACK_URLS: undefined },
    () => {
      assert.equal(getAppBaseUrl(), "https://www.conference-wihcn.xyz");
      assert.deepEqual(getAllowedCallbackUrls(), [
        "https://www.conference-wihcn.xyz/payment-success",
      ]);
      assert.equal(resolvePaymentCallbackUrl(), "https://www.conference-wihcn.xyz/payment-success");
    },
  );
});

test("trailing slash on APP_URL is normalized", () => {
  withEnv({ APP_URL: "https://www.conference-wihcn.xyz/" }, () => {
    assert.equal(resolvePaymentCallbackUrl(), "https://www.conference-wihcn.xyz/payment-success");
  });
});

test("localhost http APP_URL allowed for local dev", () => {
  withEnv({ APP_URL: "http://localhost:3000" }, () => {
    assert.equal(resolvePaymentCallbackUrl(), "http://localhost:3000/payment-success");
  });
});

test("non-https remote APP_URL is rejected", () => {
  withEnv({ APP_URL: "http://evil.example.com" }, () => {
    assert.equal(getAppBaseUrl(), null);
    assert.deepEqual(getAllowedCallbackUrls(), []);
    assert.equal(resolvePaymentCallbackUrl(), undefined);
  });
});

test("malformed APP_URL is rejected", () => {
  withEnv({ APP_URL: "not a url" }, () => {
    assert.equal(getAppBaseUrl(), null);
    assert.equal(resolvePaymentCallbackUrl(), undefined);
  });
});

test("unset APP_URL yields no callback (dashboard default used)", () => {
  withEnv({ APP_URL: undefined }, () => {
    assert.equal(resolvePaymentCallbackUrl(), undefined);
  });
});

test("extra callback URLs: https accepted, http remote rejected", () => {
  withEnv(
    {
      APP_URL: "https://www.conference-wihcn.xyz",
      PAYSTACK_EXTRA_CALLBACK_URLS:
        "https://other.example.com/done, http://phish.example.com/x, garbage",
    },
    () => {
      const urls = getAllowedCallbackUrls();
      assert.ok(urls.includes("https://www.conference-wihcn.xyz/payment-success"));
      assert.ok(urls.includes("https://other.example.com/done"));
      assert.ok(!urls.some((u) => u.includes("phish.example.com")));
      assert.ok(!urls.some((u) => u.includes("garbage")));
    },
  );
});

test("client-supplied URL cannot enter the allowlist (no client input path)", () => {
  // The allowlist is built purely from env — there is no parameter that
  // accepts a caller-controlled URL. resolvePaymentCallbackUrl() takes none.
  withEnv({ APP_URL: "https://www.conference-wihcn.xyz" }, () => {
    assert.equal(resolvePaymentCallbackUrl.length, 0);
  });
});

console.log("\n── Payment page URL ──");

test("default payment page URL used when env unset", () => {
  withEnv({ PAYSTACK_PAYMENT_PAGE_URL: undefined }, () => {
    assert.equal(getPaymentPageUrl(), "https://paystack.shop/pay/wihcniii2026");
  });
});

test("env override replaces payment page URL", () => {
  withEnv({ PAYSTACK_PAYMENT_PAGE_URL: "https://paystack.shop/pay/custom" }, () => {
    assert.equal(getPaymentPageUrl(), "https://paystack.shop/pay/custom");
  });
});

console.log("\n── Server pricing & settlement guards ──");

test("all known categories return positive prices", () => {
  for (const id of Object.keys(REGISTRATION_PRICING)) {
    const price = getServerPrice(id);
    assert.ok(price > 0, `${id} should be > 0`);
    assert.equal(price, REGISTRATION_PRICING[id]);
  }
});

test("unknown category throws", () => {
  assert.throws(() => getServerPrice("hacker-category"), /Invalid registration category/);
  assert.throws(() => getServerPrice(""), /Invalid registration category/);
});

test("toKobo converts naira to kobo", () => {
  assert.equal(toKobo(35000), 3_500_000);
  assert.equal(toKobo(50000), 5_000_000);
  assert.equal(toKobo(0.01), 1);
});

test("amount match: exact price accepted, underpayment rejected", () => {
  const expected = getServerPrice("virtual"); // 35000
  assert.equal(isAmountMatch(toKobo(expected), expected), true);
  assert.equal(isAmountMatch(toKobo(expected) - 1, expected), false); // 1 kobo short
  assert.equal(isAmountMatch(1, expected), false); // ₦0.01 attack
  assert.equal(isAmountMatch(toKobo(expected) * 2, expected), false); // overpay still flagged
  assert.equal(isAmountMatch(0, expected), false);
  assert.equal(isAmountMatch(NaN, expected), false);
  assert.equal(isAmountMatch(-100, expected), false);
});

test("amount match works for every category", () => {
  for (const id of Object.keys(REGISTRATION_PRICING)) {
    const price = getServerPrice(id);
    assert.equal(isAmountMatch(toKobo(price), price), true, id);
    assert.equal(isAmountMatch(toKobo(price) - 100, price), false, id);
  }
});

test("currency match: NGN ok, others rejected, missing defaults to NGN", () => {
  assert.equal(isCurrencyMatch("NGN", "NGN"), true);
  assert.equal(isCurrencyMatch("ngn", "NGN"), true);
  assert.equal(isCurrencyMatch("USD", "NGN"), false);
  assert.equal(isCurrencyMatch("GHS", PAYSTACK_CURRENCY), false);
  assert.equal(isCurrencyMatch(undefined, "NGN"), false);
  assert.equal(isCurrencyMatch("", "NGN"), false);
  assert.equal(isCurrencyMatch("NGN", undefined), true); // expected defaults to NGN
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
