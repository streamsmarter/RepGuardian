import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';
import {
  getBillingPlan,
  getCompanyBillingSnapshot,
  resolveAppPlanId,
  resolveCompanyIdForUser,
} from '@/lib/billing';

/**
 * POST /api/stripe/activation/context
 *
 * Fast, read-only route that loads activation context from LOCAL data only.
 * Uses company.payment_method_connected as the source of truth for whether
 * a default payment method exists - NO Stripe API calls.
 *
 * This keeps the activation modal opening instant.
 */
export async function POST(request: NextRequest) {
  try {
    const { plan } = (await request.json()) as { plan?: string };
    const selectedPlan = plan ? getBillingPlan(plan) : null;

    if (!selectedPlan) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

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

    // All local queries - no Stripe API calls
    const [billingSnapshot, planId] = await Promise.all([
      getCompanyBillingSnapshot(supabase, companyId),
      resolveAppPlanId(supabase, selectedPlan.key),
    ]);

    return NextResponse.json({
      companyId,
      customerEmail: user.email || '',
      plan: {
        key: selectedPlan.key,
        label: selectedPlan.label,
        amount: selectedPlan.amount,
        interval: selectedPlan.interval,
      },
      planId,
      // Use local payment_method_connected flag - no Stripe call needed
      hasDefaultPaymentMethod: billingSnapshot.paymentMethodConnected,
      // We don't need to return detailed payment method info here
      // The subscribe route will fetch it from Stripe only when needed
      defaultPaymentMethod: null,
    });
  } catch (error) {
    console.error('Activation context error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load activation context' },
      { status: 500 }
    );
  }
}
