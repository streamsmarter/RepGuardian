import Stripe from 'stripe';
import type { User } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe';

type SupabaseLike = Awaited<
  ReturnType<typeof import('@/lib/supabase/server').createServerComponentClient>
>;

const useStripeTestMode = process.env.NODE_ENV !== 'production';

function getConfiguredPriceId(
  liveKey: 'STRIPE_MONTHLY_PRICE_ID' | 'STRIPE_ANNUAL_PRICE_ID',
  testKey: 'STRIPE_TEST_MONTHLY_PRICE_ID' | 'STRIPE_TEST_ANNUAL_PRICE_ID'
) {
  const priceId = useStripeTestMode ? process.env[testKey] : process.env[liveKey];

  if (!priceId) {
    return '';
  }

  const expectedPrefix = useStripeTestMode ? 'price_' : 'price_';
  if (!priceId.startsWith(expectedPrefix)) {
    throw new Error(`Expected Stripe price id with prefix ${expectedPrefix}`);
  }

  return priceId;
}

export type BillingPlanKey = 'monthly' | 'annual';

export type BillingPlanConfig = {
  key: BillingPlanKey;
  label: string;
  appPlanName: string;
  priceId: string;
  interval: 'month' | 'year';
  amount: number;
};

export type BillingCustomerRow = {
  id: string;
  stripe_customer_id: string;
  email: string | null;
  name: string | null;
  user_id: string | null;
  metadata: Record<string, string> | null;
  status: string | null;
};

export type StripePaymentMethodSummary = {
  id: string;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
};

const PLAN_CACHE_TTL_MS = 5 * 60 * 1000;
const appPlanIdCache = new Map<BillingPlanKey, { expiresAt: number; planId: string | null }>();

export const BILLING_PLANS: Record<BillingPlanKey, BillingPlanConfig> = {
  monthly: {
    key: 'monthly',
    label: 'StreamSmarter Monthly',
    appPlanName: 'StreamSmarter Monthly',
    priceId: getConfiguredPriceId('STRIPE_MONTHLY_PRICE_ID', 'STRIPE_TEST_MONTHLY_PRICE_ID'),
    interval: 'month',
    amount: 49.99,
  },
  annual: {
    key: 'annual',
    label: 'StreamSmarter Annual',
    appPlanName: 'StreamSmarter Annual',
    priceId: getConfiguredPriceId('STRIPE_ANNUAL_PRICE_ID', 'STRIPE_TEST_ANNUAL_PRICE_ID'),
    interval: 'year',
    amount: 499.99,
  },
};

export function getBillingPlan(plan: string): BillingPlanConfig | null {
  if (plan in BILLING_PLANS) {
    return BILLING_PLANS[plan as BillingPlanKey];
  }

  return null;
}

export function getBillingPlanByPriceId(priceId: string | null | undefined): BillingPlanConfig | null {
  if (!priceId) return null;
  return Object.values(BILLING_PLANS).find((plan) => plan.priceId === priceId) || null;
}

export async function resolveCompanyIdForUser(
  supabase: SupabaseLike,
  userId: string
): Promise<string | null> {
  const { data: appUser } = await supabase
    .from('app_user')
    .select('company_id')
    .eq('user_id', userId)
    .single() as { data: { company_id: string } | null };

  if (appUser?.company_id) {
    return appUser.company_id;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .single() as { data: { company_id: string } | null };

  return profile?.company_id || null;
}

export async function getBillingCustomerByCompanyId(supabase: SupabaseLike, companyId: string) {
  const { data } = await supabase
    .from('billing_customer')
    .select('id, stripe_customer_id, email, name, user_id, metadata, status')
    .eq('company_id', companyId)
    .maybeSingle() as { data: BillingCustomerRow | null };

  return data;
}

export async function getCompanyBillingSnapshot(supabase: SupabaseLike, companyId: string) {
  const { data } = await supabase
    .from('company')
    .select('name, payment_method_connected, subscription_status')
    .eq('id', companyId)
    .single() as {
      data: {
        name: string;
        payment_method_connected: boolean | null;
        subscription_status: string | null;
      } | null;
    };

  return {
    companyName: data?.name || null,
    paymentMethodConnected: data?.payment_method_connected === true,
    subscriptionStatus: data?.subscription_status || null,
  };
}

export async function getCompanyName(supabase: SupabaseLike, companyId: string): Promise<string | null> {
  const snapshot = await getCompanyBillingSnapshot(supabase, companyId);
  return snapshot.companyName;
}

export async function setCompanyPaymentMethodConnected(
  supabase: SupabaseLike,
  companyId: string,
  connected: boolean
) {
  await (supabase.from('company') as unknown as {
    update: (data: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<unknown> }
  }).update({
    payment_method_connected: connected,
  }).eq('id', companyId);
}

export async function setCompanySubscriptionStatus(
  supabase: SupabaseLike,
  companyId: string,
  status: string | null
) {
  await (supabase.from('company') as unknown as {
    update: (data: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<unknown> }
  }).update({
    subscription_status: status,
  }).eq('id', companyId);
}

export async function getActiveStripeCustomer(
  stripeCustomerId: string
): Promise<Stripe.Customer | null> {
  try {
    const customer = await getStripe().customers.retrieve(stripeCustomerId);
    return customer.deleted ? null : customer;
  } catch (error) {
    console.warn('[billing] Stripe customer lookup failed', {
      stripeCustomerId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

async function searchStripeCustomerByCompanyId(companyId: string): Promise<Stripe.Customer | null> {
  try {
    const result = await getStripe().customers.search({
      query: `metadata['companyId']:'${companyId}'`,
      limit: 5,
    });

    return result.data.find((customer) => !customer.deleted) || null;
  } catch (error) {
    console.warn('[billing] Stripe customer search by companyId failed', {
      companyId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

export async function upsertBillingCustomerMapping(
  supabase: SupabaseLike,
  params: {
    companyId: string;
    stripeCustomerId: string;
    userId?: string | null;
    email?: string | null;
    name?: string | null;
    metadata?: Record<string, string>;
    status?: string | null;
  }
) {
  await (supabase.from('billing_customer') as unknown as {
    upsert: (payload: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>
  }).upsert(
    {
      company_id: params.companyId,
      stripe_customer_id: params.stripeCustomerId,
      user_id: params.userId || null,
      email: params.email || null,
      name: params.name || null,
      metadata: params.metadata || {},
      status: params.status || 'active',
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'company_id',
    }
  );
}

export async function clearBillingCustomerMapping(
  supabase: SupabaseLike,
  companyId: string
) {
  await (supabase.from('billing_customer') as unknown as {
    delete: () => { eq: (column: string, value: string) => Promise<unknown> }
  }).delete().eq('company_id', companyId);
}

async function persistStripeCustomerMapping(
  supabase: SupabaseLike,
  params: {
    companyId: string;
    stripeCustomer: Stripe.Customer;
    user: User;
    companyName?: string | null;
  }
) {
  await upsertBillingCustomerMapping(supabase, {
    companyId: params.companyId,
    stripeCustomerId: params.stripeCustomer.id,
    userId: params.user.id,
    email: params.user.email || params.stripeCustomer.email || null,
    name: params.companyName || params.stripeCustomer.name || null,
    metadata: {
      companyId: params.companyId,
      userId: params.user.id,
    },
    status: 'active',
  });

  const persisted = await getBillingCustomerByCompanyId(supabase, params.companyId);
  return (
    persisted || {
      id: '',
      stripe_customer_id: params.stripeCustomer.id,
      email: params.user.email || params.stripeCustomer.email || null,
      name: params.companyName || params.stripeCustomer.name || null,
      user_id: params.user.id,
      metadata: {
        companyId: params.companyId,
        userId: params.user.id,
      },
      status: 'active',
    }
  );
}

export async function resolveExistingStripeCustomer(
  supabase: SupabaseLike,
  companyId: string
): Promise<Stripe.Customer | null> {
  const existing = await getBillingCustomerByCompanyId(supabase, companyId);
  if (existing?.stripe_customer_id) {
    const customer = await getActiveStripeCustomer(existing.stripe_customer_id);
    if (customer) {
      return customer;
    }

    console.warn('[billing] stale mapped customer found while resolving existing customer', {
      companyId,
      stripeCustomerId: existing.stripe_customer_id,
    });
  }

  return searchStripeCustomerByCompanyId(companyId);
}

export async function resolveOrCreateStripeCustomer(
  supabase: SupabaseLike,
  params: { companyId: string; user: User; companyName?: string | null }
) {
  const mappedCustomer = await getBillingCustomerByCompanyId(supabase, params.companyId);
  if (mappedCustomer?.stripe_customer_id) {
    const activeMappedCustomer = await getActiveStripeCustomer(mappedCustomer.stripe_customer_id);
    if (activeMappedCustomer) {
      console.log('[billing] reused mapped Stripe customer', {
        companyId: params.companyId,
        stripeCustomerId: activeMappedCustomer.id,
      });
      return {
        stripeCustomer: activeMappedCustomer,
        billingCustomer: mappedCustomer,
        source: 'mapping' as const,
      };
    }

    console.warn('[billing] stale mapped customer detected', {
      companyId: params.companyId,
      stripeCustomerId: mappedCustomer.stripe_customer_id,
    });
    console.warn('[billing] deleted or missing mapped customer; clearing local mapping', {
      companyId: params.companyId,
      stripeCustomerId: mappedCustomer.stripe_customer_id,
    });
    await clearBillingCustomerMapping(supabase, params.companyId);
  }

  const searchedCustomer = await searchStripeCustomerByCompanyId(params.companyId);
  if (searchedCustomer) {
    const persisted = await persistStripeCustomerMapping(supabase, {
      companyId: params.companyId,
      stripeCustomer: searchedCustomer,
      user: params.user,
      companyName: params.companyName,
    });

    console.log('[billing] restored Stripe customer mapping from Stripe search', {
      companyId: params.companyId,
      stripeCustomerId: searchedCustomer.id,
    });

    return {
      stripeCustomer: searchedCustomer,
      billingCustomer: persisted,
      source: 'search' as const,
    };
  }

  const createdCustomer = await getStripe().customers.create(
    {
      email: params.user.email || undefined,
      name: params.companyName || undefined,
      metadata: {
        companyId: params.companyId,
        userId: params.user.id,
      },
    }
  );

  const persisted = await persistStripeCustomerMapping(supabase, {
    companyId: params.companyId,
    stripeCustomer: createdCustomer,
    user: params.user,
    companyName: params.companyName,
  });

  console.log('[billing] created Stripe customer for company', {
    companyId: params.companyId,
    stripeCustomerId: createdCustomer.id,
  });
  console.log('[billing] remapped company to recreated Stripe customer', {
    companyId: params.companyId,
    stripeCustomerId: createdCustomer.id,
  });

  return {
    stripeCustomer: createdCustomer,
    billingCustomer: persisted,
    source: 'created' as const,
  };
}

function summarizeCardPaymentMethod(
  paymentMethod: Stripe.PaymentMethod,
  defaultPaymentMethodId: string | null
): StripePaymentMethodSummary {
  return {
    id: paymentMethod.id,
    brand: paymentMethod.card?.brand || null,
    last4: paymentMethod.card?.last4 || null,
    expMonth: paymentMethod.card?.exp_month || null,
    expYear: paymentMethod.card?.exp_year || null,
    isDefault: paymentMethod.id === defaultPaymentMethodId,
  };
}

export async function getStripeCustomerPaymentContext(stripeCustomerId: string) {
  const customer = await getActiveStripeCustomer(stripeCustomerId);
  if (!customer) {
    return {
      defaultPaymentMethod: null,
      paymentMethods: [] as StripePaymentMethodSummary[],
      defaultPaymentMethodId: null,
    };
  }

  const defaultPaymentMethodId =
    typeof customer.invoice_settings?.default_payment_method === 'string'
      ? customer.invoice_settings.default_payment_method
      : customer.invoice_settings?.default_payment_method?.id || null;

  const paymentMethods = await getStripe().paymentMethods.list({
    customer: stripeCustomerId,
    type: 'card',
  });

  return {
    defaultPaymentMethod:
      paymentMethods.data
        .map((paymentMethod) => summarizeCardPaymentMethod(paymentMethod, defaultPaymentMethodId))
        .find((paymentMethod) => paymentMethod.isDefault) || null,
    paymentMethods: paymentMethods.data.map((paymentMethod) =>
      summarizeCardPaymentMethod(paymentMethod, defaultPaymentMethodId)
    ),
    defaultPaymentMethodId,
  };
}

export async function getStripeCustomerDefaultPaymentMethodId(stripeCustomerId: string) {
  const customer = await getActiveStripeCustomer(stripeCustomerId);
  if (!customer) {
    return null;
  }

  return typeof customer.invoice_settings?.default_payment_method === 'string'
    ? customer.invoice_settings.default_payment_method
    : customer.invoice_settings?.default_payment_method?.id || null;
}

export async function attachPaymentMethodToCustomer(
  paymentMethodId: string,
  stripeCustomerId: string
) {
  const paymentMethod = await getStripe().paymentMethods.retrieve(paymentMethodId);
  const attachedCustomerId =
    typeof paymentMethod.customer === 'string'
      ? paymentMethod.customer
      : paymentMethod.customer?.id || null;

  if (attachedCustomerId && attachedCustomerId !== stripeCustomerId) {
    throw new Error('Payment method does not belong to this customer');
  }

  if (!attachedCustomerId) {
    await getStripe().paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });
  }

  return paymentMethodId;
}

export async function setCustomerDefaultPaymentMethod(
  stripeCustomerId: string,
  paymentMethodId: string
) {
  await getStripe().customers.update(stripeCustomerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}

export async function resolveAppPlanId(
  supabase: SupabaseLike,
  planKey: BillingPlanKey
): Promise<string | null> {
  const cached = appPlanIdCache.get(planKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.planId;
  }

  const config = getBillingPlan(planKey);
  if (!config) {
    return null;
  }

  const { data } = await supabase
    .from('plans')
    .select('id, name, price_monthly, price_annual, is_active') as {
      data: Array<{
        id: string;
        name: string;
        price_monthly: number | null;
        price_annual: number | null;
        is_active: boolean | null;
      }> | null;
    };

  const plans = (data || []).filter((plan) => plan.is_active !== false);
  const normalizedTarget = config.appPlanName.trim().toLowerCase();

  const exactMatch = plans.find((plan) => plan.name.trim().toLowerCase() === normalizedTarget);
  if (exactMatch) {
    appPlanIdCache.set(planKey, {
      expiresAt: Date.now() + PLAN_CACHE_TTL_MS,
      planId: exactMatch.id,
    });
    return exactMatch.id;
  }

  if (planKey === 'monthly') {
    const resolvedPlanId =
      plans.find((plan) => /month/i.test(plan.name))?.id ||
      plans.find((plan) => plan.price_monthly === config.amount)?.id ||
      null;
    appPlanIdCache.set(planKey, {
      expiresAt: Date.now() + PLAN_CACHE_TTL_MS,
      planId: resolvedPlanId,
    });
    return resolvedPlanId;
  }

  const resolvedPlanId =
    plans.find((plan) => /annual|year/i.test(plan.name))?.id ||
    plans.find((plan) => plan.price_annual === config.amount)?.id ||
    null;
  appPlanIdCache.set(planKey, {
    expiresAt: Date.now() + PLAN_CACHE_TTL_MS,
    planId: resolvedPlanId,
  });
  return resolvedPlanId;
}

export function buildStripeMetadata(params: {
  companyId: string;
  userId: string;
  planKey: BillingPlanKey;
  planId?: string | null;
}) {
  return {
    companyId: params.companyId,
    userId: params.userId,
    plan: params.planKey,
    ...(params.planId ? { planId: params.planId } : {}),
  };
}

export async function resolveCompanyIdFromStripeReferences(
  supabase: SupabaseLike,
  params: { stripeCustomerId?: string | null; stripeSubscriptionId?: string | null }
): Promise<string | null> {
  if (params.stripeCustomerId) {
    const { data: billingCustomer } = await supabase
      .from('billing_customer')
      .select('company_id')
      .eq('stripe_customer_id', params.stripeCustomerId)
      .single() as { data: { company_id: string } | null };

    if (billingCustomer?.company_id) {
      return billingCustomer.company_id;
    }
  }

  if (params.stripeSubscriptionId) {
    const { data: subscription } = await supabase
      .from('subscription')
      .select('company_id')
      .eq('stripe_subscription_id', params.stripeSubscriptionId)
      .single() as { data: { company_id: string } | null };

    if (subscription?.company_id) {
      return subscription.company_id;
    }

    try {
      const stripeSubscription = await getStripe().subscriptions.retrieve(
        params.stripeSubscriptionId
      );
      const stripeCustomerId =
        typeof stripeSubscription.customer === 'string'
          ? stripeSubscription.customer
          : stripeSubscription.customer?.id || null;

      if (stripeCustomerId) {
        return resolveCompanyIdFromStripeReferences(supabase, {
          stripeCustomerId,
        });
      }
    } catch (error) {
      console.error('[billing] failed to resolve company from Stripe subscription', error);
    }
  }

  return null;
}

function buildSubscriptionProjectionPatch(
  stripeSubscription: Stripe.Subscription,
  stripeCustomerId: string | null,
  planId: string | null,
  userId?: string | null
) {
  const stripePrice = stripeSubscription.items.data[0]?.price || null;
  const latestInvoiceId =
    typeof stripeSubscription.latest_invoice === 'string'
      ? stripeSubscription.latest_invoice
      : stripeSubscription.latest_invoice?.id || null;
  const defaultPaymentMethodId =
    typeof stripeSubscription.default_payment_method === 'string'
      ? stripeSubscription.default_payment_method
      : stripeSubscription.default_payment_method?.id || null;

  return {
    plan_id: planId,
    user_id: userId || null,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscription.id,
    status: stripeSubscription.status,
    trial_ends_at: stripeSubscription.trial_end
      ? new Date(stripeSubscription.trial_end * 1000).toISOString()
      : null,
    current_period_start: (stripeSubscription as unknown as { current_period_start?: number })
      .current_period_start
      ? new Date(
          (stripeSubscription as unknown as { current_period_start: number }).current_period_start *
            1000
        ).toISOString()
      : null,
    current_period_end: (stripeSubscription as unknown as { current_period_end?: number })
      .current_period_end
      ? new Date(
          (stripeSubscription as unknown as { current_period_end: number }).current_period_end * 1000
        ).toISOString()
      : null,
    cancel_at_period_end: stripeSubscription.cancel_at_period_end,
    canceled_at: stripeSubscription.canceled_at
      ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
      : null,
    ended_at: stripeSubscription.ended_at
      ? new Date(stripeSubscription.ended_at * 1000).toISOString()
      : null,
    past_due_at: stripeSubscription.status === 'past_due' ? new Date().toISOString() : null,
    stripe_price_id: stripePrice?.id || null,
    stripe_product_id:
      typeof stripePrice?.product === 'string' ? stripePrice.product : stripePrice?.product?.id || null,
    stripe_default_payment_method_id: defaultPaymentMethodId,
    stripe_latest_invoice_id: latestInvoiceId,
    collection_method: stripeSubscription.collection_method,
    currency: stripeSubscription.currency,
    billing_interval: stripePrice?.recurring?.interval || null,
    updated_at: new Date().toISOString(),
    metadata: stripeSubscription.metadata || {},
  };
}

export async function upsertSubscriptionProjection(
  supabase: SupabaseLike,
  params: {
    companyId: string;
    userId?: string | null;
    stripeCustomerId?: string | null;
    stripeSubscription: Stripe.Subscription;
  }
) {
  const stripePrice = params.stripeSubscription.items.data[0]?.price || null;
  const derivedPlan = getBillingPlanByPriceId(stripePrice?.id || null);
  const metadataPlanId = params.stripeSubscription.metadata?.planId || null;
  const planId =
    metadataPlanId || (derivedPlan ? await resolveAppPlanId(supabase, derivedPlan.key) : null);
  const stripeCustomerId =
    params.stripeCustomerId ||
    (typeof params.stripeSubscription.customer === 'string'
      ? params.stripeSubscription.customer
      : params.stripeSubscription.customer?.id || null);
  const patch = buildSubscriptionProjectionPatch(
    params.stripeSubscription,
    stripeCustomerId,
    planId,
    params.userId
  );

  await setCompanySubscriptionStatus(supabase, params.companyId, params.stripeSubscription.status);
  if (patch.stripe_default_payment_method_id) {
    await setCompanyPaymentMethodConnected(supabase, params.companyId, true);
  }

  if (!planId) {
    console.warn('[billing] no local plan mapping for Stripe subscription; updating existing row if present', {
      companyId: params.companyId,
      stripeSubscriptionId: params.stripeSubscription.id,
      stripePriceId: stripePrice?.id || null,
    });

    await (supabase.from('subscription') as unknown as {
      update: (data: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<unknown> }
    }).update({
      ...patch,
      plan_id: undefined,
    }).eq('stripe_subscription_id', params.stripeSubscription.id);

    return;
  }

  await (supabase.from('subscription') as unknown as {
    upsert: (payload: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>
  }).upsert(
    {
      company_id: params.companyId,
      ...patch,
    },
    {
      onConflict: 'company_id',
    }
  );
}

export async function cacheInvoiceProjection(
  supabase: SupabaseLike,
  params: { companyId: string; subscriptionId?: string | null; stripeInvoice: Stripe.Invoice }
) {
  const paymentIntentId = (params.stripeInvoice as unknown as {
    payment_intent?: string | Stripe.PaymentIntent | null;
  }).payment_intent;

  await (supabase.from('invoice') as unknown as {
    upsert: (payload: Record<string, unknown>, options?: Record<string, unknown>) => Promise<unknown>
  }).upsert(
    {
      company_id: params.companyId,
      subscription_id: params.subscriptionId || null,
      stripe_invoice_id: params.stripeInvoice.id,
      stripe_customer_id:
        typeof params.stripeInvoice.customer === 'string'
          ? params.stripeInvoice.customer
          : params.stripeInvoice.customer?.id || null,
      stripe_payment_intent_id:
        typeof paymentIntentId === 'string' ? paymentIntentId : paymentIntentId?.id || null,
      amount_due: (params.stripeInvoice.amount_due || 0) / 100,
      amount_paid: (params.stripeInvoice.amount_paid || 0) / 100,
      amount_remaining: (params.stripeInvoice.amount_remaining || 0) / 100,
      currency: params.stripeInvoice.currency || 'usd',
      status: params.stripeInvoice.status || 'open',
      hosted_invoice_url: params.stripeInvoice.hosted_invoice_url,
      invoice_pdf: params.stripeInvoice.invoice_pdf,
      period_start: params.stripeInvoice.period_start
        ? new Date(params.stripeInvoice.period_start * 1000).toISOString()
        : null,
      period_end: params.stripeInvoice.period_end
        ? new Date(params.stripeInvoice.period_end * 1000).toISOString()
        : null,
      due_date: params.stripeInvoice.due_date
        ? new Date(params.stripeInvoice.due_date * 1000).toISOString()
        : null,
      paid_at: params.stripeInvoice.status_transitions.paid_at
        ? new Date(params.stripeInvoice.status_transitions.paid_at * 1000).toISOString()
        : null,
      metadata: params.stripeInvoice.metadata || {},
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'stripe_invoice_id',
    }
  );
}
