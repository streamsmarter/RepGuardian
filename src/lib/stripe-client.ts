import { loadStripe } from '@stripe/stripe-js';

const useStripeTestMode = process.env.NODE_ENV !== 'production';

function getStripePublishableKey(): string {
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

  const expectedPrefix = useStripeTestMode ? 'pk_test_' : 'pk_live_';
  if (!key.startsWith(expectedPrefix)) {
    throw new Error(`Expected Stripe key with prefix ${expectedPrefix}`);
  }

  return key;
}

let stripePromise: ReturnType<typeof loadStripe> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(getStripePublishableKey());
  }
  return stripePromise;
};
