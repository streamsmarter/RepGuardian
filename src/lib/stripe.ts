import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
    price: 49.99,
    interval: 'month' as const,
  },
  annual: {
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID!,
    price: 499.99,
    interval: 'year' as const,
  },
};
