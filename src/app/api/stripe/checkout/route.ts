import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLANS } from '@/lib/stripe';
import { createServerComponentClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json();
    
    if (!plan || !['monthly', 'annual'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single() as { data: { company_id: string } | null };

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: 'No company associated with user' },
        { status: 400 }
      );
    }

    // Get the plan ID from your plans table
    const { data: planData } = await supabase
      .from('plans')
      .select('id')
      .eq('interval', plan === 'annual' ? 'year' : 'month')
      .single() as { data: { id: string } | null };

    const selectedPlan = PLANS[plan as keyof typeof PLANS];

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?canceled=true`,
      metadata: {
        userId: user.id,
        companyId: profile.company_id,
        planId: planData?.id || '',
        plan: plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
