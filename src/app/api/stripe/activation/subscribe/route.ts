import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerComponentClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import {
  attachPaymentMethodToCustomer,
  buildStripeMetadata,
  getBillingPlan,
  getCompanyName,
  getStripeCustomerDefaultPaymentMethodId,
  resolveAppPlanId,
  resolveCompanyIdForUser,
  resolveOrCreateStripeCustomer,
  setCompanyPaymentMethodConnected,
  setCustomerDefaultPaymentMethod,
  upsertSubscriptionProjection,
} from '@/lib/billing';

const RETRIABLE_SUBSCRIPTION_STATUSES = new Set([
  'active',
  'trialing',
  'past_due',
  'unpaid',
]);
const SUBSCRIPTION_TRIAL_PERIOD_DAYS = 7;

function elapsedMs(startedAt: number) {
  return Date.now() - startedAt;
}

type NormalizedSubscriptionResponse = {
  subscription: {
    id: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    trialEndsAt: string | null;
    billingAmount: number | null;
    billingInterval: string | null;
    stripeSubscriptionId: string;
    plan: {
      id: string;
      name: string;
      price_monthly: number;
      price_annual: number;
    };
  };
  requiresAction: boolean;
  frontendConfirmationRequired: boolean;
  latestInvoiceId: string | null;
  latestInvoiceStatus: string | null;
  latestInvoiceHasConfirmationSecret: boolean;
  latestInvoiceHasPaymentIntent: boolean;
  confirmationClientSecret: string | null;
  confirmationTokenType: 'invoice_confirmation_secret' | 'payment_intent' | null;
  paymentIntentId: string | null;
  paymentIntentClientSecret: string | null;
  paymentIntentStatus: string | null;
  billingMode: string | null;
  stripeApiVersion: string | null;
  usedPaymentMethodId: string;
  reusedExistingSubscription: boolean;
};

type NormalizedInvoicePaymentIntentState = {
  latestInvoiceId: string | null;
  latestInvoiceStatus: string | null;
  latestInvoiceHasConfirmationSecret: boolean;
  latestInvoiceHasPaymentIntent: boolean;
  confirmationClientSecret: string | null;
  confirmationTokenType: 'invoice_confirmation_secret' | 'payment_intent' | null;
  paymentIntent: Stripe.PaymentIntent | null;
  paymentIntentId: string | null;
  paymentIntentStatus: string | null;
  paymentIntentClientSecret: string | null;
  frontendConfirmationRequired: boolean;
};

const CLIENT_CONFIRMABLE_PAYMENT_INTENT_STATUSES = new Set([
  'requires_action',
  'requires_confirmation',
]);

async function normalizeInvoicePaymentIntentState(
  stripeSubscription: Stripe.Subscription
): Promise<NormalizedInvoicePaymentIntentState> {
  const stripe = getStripe();
  const latestInvoiceReference = stripeSubscription.latest_invoice;

  if (!latestInvoiceReference) {
    return {
      latestInvoiceId: null,
      latestInvoiceStatus: null,
      latestInvoiceHasConfirmationSecret: false,
      latestInvoiceHasPaymentIntent: false,
      confirmationClientSecret: null,
      confirmationTokenType: null,
      paymentIntent: null,
      paymentIntentId: null,
      paymentIntentStatus: null,
      paymentIntentClientSecret: null,
      frontendConfirmationRequired: false,
    };
  }

  let latestInvoice: Stripe.Invoice | null = null;

  if (typeof latestInvoiceReference === 'string') {
    latestInvoice = await stripe.invoices.retrieve(latestInvoiceReference, {
      expand: ['payment_intent', 'confirmation_secret'],
    });
  } else {
    latestInvoice = latestInvoiceReference;
  }

  const confirmationSecret = latestInvoice.confirmation_secret || null;

  const paymentIntent = (latestInvoice as Stripe.Invoice & {
    payment_intent?: string | Stripe.PaymentIntent | null;
  }).payment_intent;

  if (!paymentIntent) {
    return {
      latestInvoiceId: latestInvoice.id,
      latestInvoiceStatus: latestInvoice.status,
      latestInvoiceHasConfirmationSecret: Boolean(confirmationSecret?.client_secret),
      latestInvoiceHasPaymentIntent: false,
      confirmationClientSecret: confirmationSecret?.client_secret || null,
      confirmationTokenType: confirmationSecret?.client_secret
        ? 'invoice_confirmation_secret'
        : null,
      paymentIntent: null,
      paymentIntentId: null,
      paymentIntentStatus: null,
      paymentIntentClientSecret: null,
      frontendConfirmationRequired: Boolean(confirmationSecret?.client_secret),
    };
  }

  if (typeof paymentIntent === 'string') {
    try {
      const resolvedPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent);
      return {
        latestInvoiceId: latestInvoice.id,
        latestInvoiceStatus: latestInvoice.status,
        latestInvoiceHasConfirmationSecret: Boolean(confirmationSecret?.client_secret),
        latestInvoiceHasPaymentIntent: true,
        confirmationClientSecret:
          confirmationSecret?.client_secret || resolvedPaymentIntent.client_secret || null,
        confirmationTokenType: confirmationSecret?.client_secret
          ? 'invoice_confirmation_secret'
          : resolvedPaymentIntent.client_secret
            ? 'payment_intent'
            : null,
        paymentIntent: resolvedPaymentIntent,
        paymentIntentId: resolvedPaymentIntent.id,
        paymentIntentStatus: resolvedPaymentIntent.status,
        paymentIntentClientSecret: resolvedPaymentIntent.client_secret || null,
        frontendConfirmationRequired:
          Boolean(confirmationSecret?.client_secret) ||
          CLIENT_CONFIRMABLE_PAYMENT_INTENT_STATUSES.has(resolvedPaymentIntent.status),
      };
    } catch {
      return {
        latestInvoiceId: latestInvoice.id,
        latestInvoiceStatus: latestInvoice.status,
        latestInvoiceHasConfirmationSecret: Boolean(confirmationSecret?.client_secret),
        latestInvoiceHasPaymentIntent: true,
        confirmationClientSecret: confirmationSecret?.client_secret || null,
        confirmationTokenType: confirmationSecret?.client_secret
          ? 'invoice_confirmation_secret'
          : null,
        paymentIntent: null,
        paymentIntentId: paymentIntent,
        paymentIntentStatus: null,
        paymentIntentClientSecret: null,
        frontendConfirmationRequired: Boolean(confirmationSecret?.client_secret),
      };
    }
  }

  return {
    latestInvoiceId: latestInvoice.id,
    latestInvoiceStatus: latestInvoice.status,
    latestInvoiceHasConfirmationSecret: Boolean(confirmationSecret?.client_secret),
    latestInvoiceHasPaymentIntent: true,
    confirmationClientSecret:
      confirmationSecret?.client_secret || paymentIntent.client_secret || null,
    confirmationTokenType: confirmationSecret?.client_secret
      ? 'invoice_confirmation_secret'
      : paymentIntent.client_secret
        ? 'payment_intent'
        : null,
    paymentIntent,
    paymentIntentId: paymentIntent.id,
    paymentIntentStatus: paymentIntent.status,
    paymentIntentClientSecret: paymentIntent.client_secret || null,
    frontendConfirmationRequired:
      Boolean(confirmationSecret?.client_secret) ||
      CLIENT_CONFIRMABLE_PAYMENT_INTENT_STATUSES.has(paymentIntent.status),
  };
}

function serializeSubscription(
  stripeSubscription: Stripe.Subscription,
  selectedPlan: NonNullable<ReturnType<typeof getBillingPlan>>,
  planId: string | null
): NormalizedSubscriptionResponse['subscription'] {
  const stripePrice = stripeSubscription.items.data[0]?.price || null;

  return {
    id: stripeSubscription.id,
    status: stripeSubscription.status,
    currentPeriodStart: (stripeSubscription as unknown as { current_period_start?: number })
      .current_period_start
      ? new Date(
          (stripeSubscription as unknown as { current_period_start: number }).current_period_start *
            1000
        ).toISOString()
      : null,
    currentPeriodEnd: (stripeSubscription as unknown as { current_period_end?: number })
      .current_period_end
      ? new Date(
          (stripeSubscription as unknown as { current_period_end: number }).current_period_end * 1000
        ).toISOString()
      : null,
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    trialEndsAt: stripeSubscription.trial_end
      ? new Date(stripeSubscription.trial_end * 1000).toISOString()
      : null,
    billingAmount: stripePrice?.unit_amount != null ? stripePrice.unit_amount / 100 : selectedPlan.amount,
    billingInterval: stripePrice?.recurring?.interval || selectedPlan.interval,
    stripeSubscriptionId: stripeSubscription.id,
    plan: {
      id: planId || `derived-${selectedPlan.key}`,
      name: selectedPlan.label,
      price_monthly: selectedPlan.key === 'monthly' ? selectedPlan.amount : BILLING_PLAN_FALLBACK.monthly,
      price_annual: selectedPlan.key === 'annual' ? selectedPlan.amount : BILLING_PLAN_FALLBACK.annual,
    },
  };
}

const BILLING_PLAN_FALLBACK = {
  monthly: 49.99,
  annual: 499.99,
};

async function resolveReusableSubscription(params: {
  stripeCustomerId: string;
  priceId: string;
  companyId: string;
  planKey: string;
}) {
  const stripe = getStripe();
  const subscriptions = await stripe.subscriptions.list({
    customer: params.stripeCustomerId,
    status: 'all',
    limit: 20,
    expand: ['data.latest_invoice.payment_intent', 'data.latest_invoice.confirmation_secret'],
  });

  const matchingSubscriptions = subscriptions.data.filter((subscription) => {
    const hasMatchingPrice = subscription.items.data.some(
      (item) => item.price.id === params.priceId
    );

    if (!hasMatchingPrice) {
      return false;
    }

    return (
      subscription.metadata?.companyId === params.companyId ||
      subscription.metadata?.plan === params.planKey
    );
  });

  const directlyReusableSubscription =
    matchingSubscriptions.find((subscription) =>
      RETRIABLE_SUBSCRIPTION_STATUSES.has(subscription.status)
    ) || null;

  if (directlyReusableSubscription) {
    return {
      reusableSubscription: directlyReusableSubscription,
      discardedIncompleteSubscriptionId: null,
    };
  }

  const incompleteSubscription =
    matchingSubscriptions.find((subscription) => subscription.status === 'incomplete') || null;

  if (!incompleteSubscription) {
    return {
      reusableSubscription: null,
      discardedIncompleteSubscriptionId: null,
    };
  }

  const normalizedInvoicePaymentIntent = await normalizeInvoicePaymentIntentState(
    incompleteSubscription
  );
  const hasUsablePaymentIntent =
    Boolean(normalizedInvoicePaymentIntent.confirmationClientSecret);

  if (hasUsablePaymentIntent) {
    console.info('[billing][activation-subscribe] Reusing recoverable incomplete subscription', {
      companyId: params.companyId,
      stripeCustomerId: params.stripeCustomerId,
      stripeSubscriptionId: incompleteSubscription.id,
      latestInvoiceId: normalizedInvoicePaymentIntent.latestInvoiceId,
      latestInvoiceStatus: normalizedInvoicePaymentIntent.latestInvoiceStatus,
      latestInvoiceHasConfirmationSecret:
        normalizedInvoicePaymentIntent.latestInvoiceHasConfirmationSecret,
      latestInvoiceHasPaymentIntent:
        normalizedInvoicePaymentIntent.latestInvoiceHasPaymentIntent,
      paymentIntentId: normalizedInvoicePaymentIntent.paymentIntentId,
      paymentIntentStatus: normalizedInvoicePaymentIntent.paymentIntentStatus,
      billingMode: incompleteSubscription.billing_mode?.type || null,
      stripeApiVersion: '2025-04-30.basil',
    });

    return {
      reusableSubscription: incompleteSubscription,
      discardedIncompleteSubscriptionId: null,
    };
  }

  console.warn('[billing][activation-subscribe] Discarding stale incomplete subscription', {
    companyId: params.companyId,
    stripeCustomerId: params.stripeCustomerId,
    stripeSubscriptionId: incompleteSubscription.id,
    latestInvoiceId: normalizedInvoicePaymentIntent.latestInvoiceId,
    latestInvoiceStatus: normalizedInvoicePaymentIntent.latestInvoiceStatus,
    latestInvoiceHasConfirmationSecret:
      normalizedInvoicePaymentIntent.latestInvoiceHasConfirmationSecret,
    latestInvoiceHasPaymentIntent:
      normalizedInvoicePaymentIntent.latestInvoiceHasPaymentIntent,
    paymentIntentId: normalizedInvoicePaymentIntent.paymentIntentId,
    paymentIntentStatus: normalizedInvoicePaymentIntent.paymentIntentStatus,
    billingMode: incompleteSubscription.billing_mode?.type || null,
    stripeApiVersion: '2025-04-30.basil',
  });

  await stripe.subscriptions.cancel(incompleteSubscription.id);

  return {
    reusableSubscription: null,
    discardedIncompleteSubscriptionId: incompleteSubscription.id,
  };
}

export async function POST(request: NextRequest) {
  const requestStartedAt = Date.now();

  try {
    const stripe = getStripe();
    const stripeApiVersion = stripe.getApiField('version') || null;
    const { plan, useDefaultPaymentMethod, paymentMethodId } = (await request.json()) as {
      plan?: string;
      useDefaultPaymentMethod?: boolean;
      paymentMethodId?: string | null;
    };

    const selectedPlan = plan ? getBillingPlan(plan) : null;
    if (!selectedPlan) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    if (!selectedPlan.priceId) {
      return NextResponse.json(
        { error: `Stripe price is not configured for ${selectedPlan.label}` },
        { status: 500 }
      );
    }

    const authAndContextStartedAt = Date.now();
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = await resolveCompanyIdForUser(supabase, user.id);
    if (!companyId) {
      return NextResponse.json({ error: 'No company associated with user' }, { status: 400 });
    }
    console.info('[billing][activation-subscribe] auth/context resolved', {
      elapsedMs: elapsedMs(authAndContextStartedAt),
      companyId,
    });

    const customerResolutionStartedAt = Date.now();
    const [companyName, planId] = await Promise.all([
      getCompanyName(supabase, companyId),
      resolveAppPlanId(supabase, selectedPlan.key),
    ]);

    const { stripeCustomer } = await resolveOrCreateStripeCustomer(supabase, {
      companyId,
      user,
      companyName,
    });
    console.info('[billing][activation-subscribe] customer resolved', {
      elapsedMs: elapsedMs(customerResolutionStartedAt),
      companyId,
      stripeCustomerId: stripeCustomer.id,
    });

    let resolvedPaymentMethodId: string | null = null;

    if (paymentMethodId) {
      resolvedPaymentMethodId = await attachPaymentMethodToCustomer(paymentMethodId, stripeCustomer.id);
      await setCustomerDefaultPaymentMethod(stripeCustomer.id, resolvedPaymentMethodId);
      await setCompanyPaymentMethodConnected(supabase, companyId, true);
    } else if (useDefaultPaymentMethod) {
      resolvedPaymentMethodId = await getStripeCustomerDefaultPaymentMethodId(stripeCustomer.id);
    }

    if (!resolvedPaymentMethodId) {
      return NextResponse.json(
        { error: 'A usable default payment method is required to activate this plan' },
        { status: 400 }
      );
    }

    const metadata = buildStripeMetadata({
      companyId,
      userId: user.id,
      planKey: selectedPlan.key,
      planId,
    });

    const reusableSubscriptionStartedAt = Date.now();
    const { reusableSubscription, discardedIncompleteSubscriptionId } =
      await resolveReusableSubscription({
      stripeCustomerId: stripeCustomer.id,
      priceId: selectedPlan.priceId,
      companyId,
      planKey: selectedPlan.key,
    });
    console.info('[billing][activation-subscribe] reusable subscription check completed', {
      elapsedMs: elapsedMs(reusableSubscriptionStartedAt),
      companyId,
      stripeCustomerId: stripeCustomer.id,
      reusedExistingSubscription: Boolean(reusableSubscription),
      discardedIncompleteSubscriptionId,
    });

    const subscriptionMutationStartedAt = Date.now();
    const stripeSubscription = reusableSubscription
      ? await stripe.subscriptions.update(reusableSubscription.id, {
          default_payment_method: resolvedPaymentMethodId,
          expand: ['latest_invoice.payment_intent', 'latest_invoice.confirmation_secret'],
        })
      : await stripe.subscriptions.create(
          {
            customer: stripeCustomer.id,
            items: [{ price: selectedPlan.priceId }],
            trial_period_days: SUBSCRIPTION_TRIAL_PERIOD_DAYS,
            default_payment_method: resolvedPaymentMethodId,
            collection_method: 'charge_automatically',
            payment_behavior: 'default_incomplete',
            trial_settings: {
              end_behavior: {
                missing_payment_method: 'cancel',
              },
            },
            billing_mode: {
              type: 'flexible',
            },
            payment_settings: {
              save_default_payment_method: 'on_subscription',
            },
            metadata,
            expand: ['latest_invoice.payment_intent', 'latest_invoice.confirmation_secret'],
          },
          {
            idempotencyKey: `activation:${companyId}:${selectedPlan.key}:${crypto.randomUUID()}`,
          }
        );
    console.info('[billing][activation-subscribe] subscription mutation completed', {
      elapsedMs: elapsedMs(subscriptionMutationStartedAt),
      companyId,
      stripeCustomerId: stripeCustomer.id,
      stripeSubscriptionId: stripeSubscription.id,
      reusedExistingSubscription: Boolean(reusableSubscription),
    });

    const localProjectionStartedAt = Date.now();
    await upsertSubscriptionProjection(supabase, {
      companyId,
      userId: user.id,
      stripeCustomerId: stripeCustomer.id,
      stripeSubscription,
    });
    console.info('[billing][activation-subscribe] local projection updated', {
      elapsedMs: elapsedMs(localProjectionStartedAt),
      companyId,
      stripeSubscriptionId: stripeSubscription.id,
    });

    const invoiceNormalizationStartedAt = Date.now();
    const normalizedInvoicePaymentIntent = await normalizeInvoicePaymentIntentState(
      stripeSubscription
    );
    console.info('[billing][activation-subscribe] invoice/payment normalization completed', {
      elapsedMs: elapsedMs(invoiceNormalizationStartedAt),
      companyId,
      stripeSubscriptionId: stripeSubscription.id,
      latestInvoiceId: normalizedInvoicePaymentIntent.latestInvoiceId,
      paymentIntentId: normalizedInvoicePaymentIntent.paymentIntentId,
    });

    console.info('[billing][activation-subscribe] Stripe subscription created or updated', {
      elapsedMsTotal: elapsedMs(requestStartedAt),
      companyId,
      stripeCustomerId: stripeCustomer.id,
      stripeSubscriptionId: stripeSubscription.id,
      reusedExistingSubscription: Boolean(reusableSubscription),
      discardedIncompleteSubscriptionId,
      subscriptionStatus: stripeSubscription.status,
      latestInvoiceId: normalizedInvoicePaymentIntent.latestInvoiceId,
      latestInvoiceStatus: normalizedInvoicePaymentIntent.latestInvoiceStatus,
      latestInvoiceHasConfirmationSecret:
        normalizedInvoicePaymentIntent.latestInvoiceHasConfirmationSecret,
      latestInvoiceHasPaymentIntent:
        normalizedInvoicePaymentIntent.latestInvoiceHasPaymentIntent,
      confirmationTokenType: normalizedInvoicePaymentIntent.confirmationTokenType,
      paymentIntentId: normalizedInvoicePaymentIntent.paymentIntentId,
      paymentIntentStatus: normalizedInvoicePaymentIntent.paymentIntentStatus,
      billingMode: stripeSubscription.billing_mode?.type || null,
      stripeApiVersion,
      frontendConfirmationRequired:
        normalizedInvoicePaymentIntent.frontendConfirmationRequired,
    });

    if (
      !normalizedInvoicePaymentIntent.confirmationClientSecret &&
      stripeSubscription.status === 'incomplete'
    ) {
      console.error(
        '[billing][activation-subscribe] Missing confirmation secret for incomplete subscription',
        {
          companyId,
          stripeCustomerId: stripeCustomer.id,
          stripeSubscriptionId: stripeSubscription.id,
          subscriptionStatus: stripeSubscription.status,
          latestInvoiceId: normalizedInvoicePaymentIntent.latestInvoiceId,
          latestInvoiceStatus: normalizedInvoicePaymentIntent.latestInvoiceStatus,
          latestInvoiceHasConfirmationSecret:
            normalizedInvoicePaymentIntent.latestInvoiceHasConfirmationSecret,
          latestInvoiceHasPaymentIntent:
            normalizedInvoicePaymentIntent.latestInvoiceHasPaymentIntent,
          paymentIntentId: normalizedInvoicePaymentIntent.paymentIntentId,
          billingMode: stripeSubscription.billing_mode?.type || null,
          stripeApiVersion,
        }
      );

      return NextResponse.json(
        {
          error:
            'Stripe did not return a payment intent for this incomplete subscription. Please try again.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json<NormalizedSubscriptionResponse>({
      subscription: serializeSubscription(stripeSubscription, selectedPlan, planId),
      requiresAction: normalizedInvoicePaymentIntent.frontendConfirmationRequired,
      frontendConfirmationRequired:
        normalizedInvoicePaymentIntent.frontendConfirmationRequired,
      latestInvoiceId: normalizedInvoicePaymentIntent.latestInvoiceId,
      latestInvoiceStatus: normalizedInvoicePaymentIntent.latestInvoiceStatus,
      latestInvoiceHasConfirmationSecret:
        normalizedInvoicePaymentIntent.latestInvoiceHasConfirmationSecret,
      latestInvoiceHasPaymentIntent:
        normalizedInvoicePaymentIntent.latestInvoiceHasPaymentIntent,
      confirmationClientSecret: normalizedInvoicePaymentIntent.confirmationClientSecret,
      confirmationTokenType: normalizedInvoicePaymentIntent.confirmationTokenType,
      paymentIntentId: normalizedInvoicePaymentIntent.paymentIntentId,
      paymentIntentClientSecret: normalizedInvoicePaymentIntent.paymentIntentClientSecret,
      paymentIntentStatus: normalizedInvoicePaymentIntent.paymentIntentStatus,
      billingMode: stripeSubscription.billing_mode?.type || null,
      stripeApiVersion,
      usedPaymentMethodId: resolvedPaymentMethodId,
      reusedExistingSubscription: Boolean(reusableSubscription),
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to activate subscription' },
      { status: 500 }
    );
  }
}
