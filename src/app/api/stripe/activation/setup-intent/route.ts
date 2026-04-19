import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import {
  buildStripeMetadata,
  getBillingPlan,
  resolveCompanyIdForUser,
  resolveOrCreateStripeCustomer,
} from '@/lib/billing';

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

    const { stripeCustomer } = await resolveOrCreateStripeCustomer(supabase, {
      companyId,
      user,
    });

    const setupIntent = await getStripe().setupIntents.create({
      customer: stripeCustomer.id,
      automatic_payment_methods: { enabled: true },
      usage: 'off_session',
      metadata: buildStripeMetadata({
        companyId,
        userId: user.id,
        planKey: selectedPlan.key,
      }),
    });

    return NextResponse.json({
      setupIntentId: setupIntent.id,
      clientSecret: setupIntent.client_secret,
      customerId: stripeCustomer.id,
    });
  } catch (error) {
    console.error('Activation setup intent error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to prepare secure payment entry' },
      { status: 500 }
    );
  }
}
