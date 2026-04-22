import { loadStripe } from '@stripe/stripe-js';

let stripePromise: ReturnType<typeof loadStripe> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    // Defer key validation to runtime (client-side only)
    if (typeof window === 'undefined') {
      // During SSR/build, return a promise that resolves to null
      return Promise.resolve(null);
    }

    const useStripeTestMode = process.env.NODE_ENV !== 'production';
    const key = useStripeTestMode
      ? process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY
      : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!key) {
      console.error(
        useStripeTestMode
          ? 'NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY is not set'
          : 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set'
      );
      return Promise.resolve(null);
    }

    const expectedPrefix = useStripeTestMode ? 'pk_test_' : 'pk_live_';
    if (!key.startsWith(expectedPrefix)) {
      console.error(`Expected Stripe key with prefix ${expectedPrefix}`);
      return Promise.resolve(null);
    }

    stripePromise = loadStripe(key);
  }
  return stripePromise;
};
