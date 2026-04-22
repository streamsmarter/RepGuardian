import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;
const useStripeTestMode = process.env.NODE_ENV !== 'production';
const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2026-03-25.dahlia';

function assertStripeKeyPrefix(key: string, expectedPrefix: 'sk_test_' | 'sk_live_' | 'pk_test_' | 'pk_live_') {
  if (!key.startsWith(expectedPrefix)) {
    throw new Error(`Expected Stripe key with prefix ${expectedPrefix}`);
  }
}

function getServerStripeSecretKey(): string {
  const key = useStripeTestMode ? process.env.STRIPE_TEST_SECRET_KEY : process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error(
      useStripeTestMode
        ? 'STRIPE_TEST_SECRET_KEY is not set'
        : 'STRIPE_SECRET_KEY is not set'
    );
  }

  assertStripeKeyPrefix(key, useStripeTestMode ? 'sk_test_' : 'sk_live_');

  return key;
}

export function getStripePublishableKey(): string {
  const key = useStripeTestMode
    ? process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY
    : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!key) {
    throw new Error(
      useStripeTestMode
        ? 'NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY is not set'
        : 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set'
    );
  }

  assertStripeKeyPrefix(key, useStripeTestMode ? 'pk_test_' : 'pk_live_');

  return key;
}

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(getServerStripeSecretKey(), {
      apiVersion: STRIPE_API_VERSION,
      typescript: true,
    });
  }

  return stripeInstance;
}

export function getAppUrl(fallbackOrigin?: string): string {
  return process.env.NEXT_PUBLIC_APP_URL || fallbackOrigin || 'http://localhost:3000';
}

export function getStripeWebhookSecret(): string {
  const secret = useStripeTestMode ? process.env.STRIPE_TEST_WEBHOOK_SECRET : process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error(
      useStripeTestMode
        ? 'STRIPE_TEST_WEBHOOK_SECRET is not set'
        : 'STRIPE_WEBHOOK_SECRET is not set'
    );
  }

  return secret;
}
