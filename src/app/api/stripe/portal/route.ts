import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';
import { getAppUrl, getStripe } from '@/lib/stripe';
import {
  resolveCompanyIdForUser,
  resolveExistingStripeCustomer,
} from '@/lib/billing';

export async function POST(request: NextRequest) {
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

    const stripeCustomer = await resolveExistingStripeCustomer(supabase, companyId);
    if (!stripeCustomer) {
      return NextResponse.json(
        { error: 'No Stripe billing customer exists for this company yet' },
        { status: 400 }
      );
    }

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: stripeCustomer.id,
      return_url: `${getAppUrl(request.nextUrl.origin)}/app/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Stripe billing portal error:', error);
    return NextResponse.json({ error: 'Failed to create billing portal session' }, { status: 500 });
  }
}
