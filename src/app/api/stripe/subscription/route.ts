import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createServerComponentClient } from '@/lib/supabase/server';
import {
  getBillingCustomerByCompanyId,
  getBillingPlanByPriceId,
  getCompanyBillingSnapshot,
  resolveCompanyIdForUser,
  setCompanySubscriptionStatus,
} from '@/lib/billing';

type SubscriptionRow = {
  id: string;
  status: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  trial_ends_at: string | null;
  stripe_price_id: string | null;
  stripe_default_payment_method_id: string | null;
  billing_interval: string | null;
  canceled_at: string | null;
  ended_at: string | null;
  past_due_at: string | null;
  plans: {
    id: string;
    name: string;
    price_monthly: number | null;
    price_annual: number | null;
  } | null;
};

async function getScopedSubscription(
  supabase: Awaited<ReturnType<typeof createServerComponentClient>>,
  companyId: string
) {
  const { data } = await supabase
    .from('subscription')
    .select(
      'id,status,stripe_subscription_id,stripe_customer_id,current_period_start,current_period_end,cancel_at_period_end,trial_ends_at,stripe_price_id,stripe_default_payment_method_id,billing_interval,canceled_at,ended_at,past_due_at,plans(id,name,price_monthly,price_annual)'
    )
    .eq('company_id', companyId)
    .maybeSingle() as { data: SubscriptionRow | null };

  return data;
}

function derivePlan(subscription: SubscriptionRow | null) {
  if (!subscription) {
    return null;
  }

  const planFromPrice = getBillingPlanByPriceId(subscription.stripe_price_id);
  if (subscription.plans) {
    return {
      ...subscription.plans,
      name: subscription.plans.name || planFromPrice?.label || 'StreamSmarter',
    };
  }

  if (!planFromPrice) {
    return null;
  }

  return {
    id: `derived-${planFromPrice.key}`,
    name: planFromPrice.label,
    price_monthly: planFromPrice.key === 'monthly' ? planFromPrice.amount : 49.99,
    price_annual: planFromPrice.key === 'annual' ? planFromPrice.amount : 499.99,
  };
}

export async function GET() {
  try {
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

    const [subscription, billingCustomer, companySnapshot] = await Promise.all([
      getScopedSubscription(supabase, companyId),
      getBillingCustomerByCompanyId(supabase, companyId),
      getCompanyBillingSnapshot(supabase, companyId),
    ]);

    return NextResponse.json({
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status || 'inactive',
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            trialEndsAt: subscription.trial_ends_at,
            canceledAt: subscription.canceled_at,
            endedAt: subscription.ended_at,
            pastDueAt: subscription.past_due_at,
            billingAmount:
              subscription.billing_interval === 'year'
                ? subscription.plans?.price_annual ?? null
                : subscription.plans?.price_monthly ?? null,
            billingInterval: subscription.billing_interval,
            stripeSubscriptionId: subscription.stripe_subscription_id,
            plan: derivePlan(subscription),
          }
        : null,
      billing: {
        hasCustomerMapping: Boolean(billingCustomer?.stripe_customer_id),
        stripeCustomerId: billingCustomer?.stripe_customer_id || null,
        paymentMethodConnectedHint: companySnapshot.paymentMethodConnected,
        subscriptionStatusHint: companySnapshot.subscriptionStatus,
        canManageBilling: Boolean(subscription?.stripe_subscription_id),
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json({ error: 'Failed to get subscription' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { cancelImmediately } = await request
      .json()
      .catch(() => ({ cancelImmediately: false as boolean }));
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

    const subscription = await getScopedSubscription(supabase, companyId);
    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    if (cancelImmediately) {
      await getStripe().subscriptions.cancel(subscription.stripe_subscription_id);
      await (supabase.from('subscription') as unknown as {
        update: (data: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<unknown> }
      }).update({
        status: 'canceled',
        cancel_at_period_end: false,
        canceled_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('company_id', companyId);
      await setCompanySubscriptionStatus(supabase, companyId, 'canceled');
    } else {
      await getStripe().subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      await (supabase.from('subscription') as unknown as {
        update: (data: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<unknown> }
      }).update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      }).eq('company_id', companyId);
      await setCompanySubscriptionStatus(supabase, companyId, subscription.status);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { action } = await request.json();
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

    if (action !== 'reactivate') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const subscription = await getScopedSubscription(supabase, companyId);
    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    await getStripe().subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    await (supabase.from('subscription') as unknown as {
      update: (data: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<unknown> }
    }).update({
      cancel_at_period_end: false,
      canceled_at: null,
      updated_at: new Date().toISOString(),
    }).eq('company_id', companyId);
    await setCompanySubscriptionStatus(supabase, companyId, subscription.status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update subscription error:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
