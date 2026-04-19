import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerComponentClient } from '@/lib/supabase/server';
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe';
import {
  cacheInvoiceProjection,
  resolveCompanyIdFromStripeReferences,
  setCompanyPaymentMethodConnected,
  upsertSubscriptionProjection,
} from '@/lib/billing';

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const value = (invoice as unknown as {
    subscription?: string | Stripe.Subscription | null;
  }).subscription;

  return typeof value === 'string' ? value : value?.id || null;
}

function getEventMetadata(eventObject: Stripe.Event.Data.Object): Record<string, string> {
  const metadata = (eventObject as unknown as { metadata?: Record<string, string> | null }).metadata;
  return metadata || {};
}

function getEventCustomerId(eventObject: Stripe.Event.Data.Object): string | null {
  const customer = (eventObject as unknown as {
    customer?: string | { id?: string | null } | null;
  }).customer;

  return typeof customer === 'string' ? customer : customer?.id || null;
}

function getEventSubscriptionId(eventObject: Stripe.Event.Data.Object): string | null {
  const subscription = (eventObject as unknown as {
    subscription?: string | { id?: string | null } | null;
  }).subscription;

  return typeof subscription === 'string' ? subscription : subscription?.id || null;
}

async function ensureBillingEventRow(supabase: Awaited<ReturnType<typeof createServerComponentClient>>, event: Stripe.Event) {
  const { data: existing } = await supabase
    .from('billing_event')
    .select('id, processed')
    .eq('stripe_event_id', event.id)
    .maybeSingle() as { data: { id: string; processed: boolean } | null };

  if (existing) {
    return existing;
  }

  const { data } = await (supabase.from('billing_event') as unknown as {
    insert: (payload: Record<string, unknown>) => { select: (columns: string) => { single: () => Promise<{ data: { id: string; processed: boolean } | null }> } }
  }).insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event,
    processed: false,
  }).select('id, processed').single();

  return data;
}

async function updateBillingEvent(
  supabase: Awaited<ReturnType<typeof createServerComponentClient>>,
  eventId: string,
  payload: Record<string, unknown>
) {
  await (supabase.from('billing_event') as unknown as {
    update: (data: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<unknown> }
  }).update(payload).eq('stripe_event_id', eventId);
}

async function getLocalSubscriptionId(
  supabase: Awaited<ReturnType<typeof createServerComponentClient>>,
  stripeSubscriptionId: string | null | undefined
) {
  if (!stripeSubscriptionId) return null;

  const { data } = await supabase
    .from('subscription')
    .select('id')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle() as { data: { id: string } | null };

  return data?.id || null;
}

async function processInvoiceEvent(
  supabase: Awaited<ReturnType<typeof createServerComponentClient>>,
  invoice: Stripe.Invoice,
  statusOverride?: string
) {
  const companyId = await resolveCompanyIdFromStripeReferences(supabase, {
    stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id,
    stripeSubscriptionId: getInvoiceSubscriptionId(invoice),
  });

  if (!companyId) {
    return;
  }

  const localSubscriptionId = await getLocalSubscriptionId(
    supabase,
    getInvoiceSubscriptionId(invoice),
  );

  await cacheInvoiceProjection(supabase, {
    companyId,
    subscriptionId: localSubscriptionId,
    stripeInvoice: {
      ...invoice,
      status: statusOverride || invoice.status,
    } as Stripe.Invoice,
  });

  const stripeSubscriptionId = getInvoiceSubscriptionId(invoice);
  if (stripeSubscriptionId) {
    const patch: Record<string, unknown> = {
      stripe_latest_invoice_id: invoice.id,
      updated_at: new Date().toISOString(),
    };

    if (statusOverride === 'paid') {
      patch.past_due_at = null;
    }

    if (statusOverride === 'payment_failed') {
      patch.status = 'past_due';
      patch.past_due_at = new Date().toISOString();
    }

    await (supabase.from('subscription') as unknown as {
      update: (data: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<unknown> }
    }).update(patch).eq('stripe_subscription_id', stripeSubscriptionId);
  }
}

async function processTrialWillEndEvent(
  supabase: Awaited<ReturnType<typeof createServerComponentClient>>,
  stripeSubscription: Stripe.Subscription
) {
  const stripeCustomerId = typeof stripeSubscription.customer === 'string'
    ? stripeSubscription.customer
    : stripeSubscription.customer?.id || null;
  const companyId = await resolveCompanyIdFromStripeReferences(supabase, {
    stripeCustomerId,
    stripeSubscriptionId: stripeSubscription.id,
  });

  console.log('[stripe webhook] customer.subscription.trial_will_end received', {
    eventCompanyId: companyId,
    stripeCustomerId,
    stripeSubscriptionId: stripeSubscription.id,
    trialEnd: stripeSubscription.trial_end
      ? new Date(stripeSubscription.trial_end * 1000).toISOString()
      : null,
  });
}

async function processEvent(supabase: Awaited<ReturnType<typeof createServerComponentClient>>, event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.trial_will_end': {
      await processTrialWillEndEvent(supabase, event.data.object as Stripe.Subscription);
      return;
    }
    case 'setup_intent.succeeded': {
      const setupIntent = event.data.object as Stripe.SetupIntent;
      const stripeCustomerId = typeof setupIntent.customer === 'string'
        ? setupIntent.customer
        : setupIntent.customer?.id || null;
      const paymentMethodId = typeof setupIntent.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id || null;

      console.log('[stripe webhook] setup_intent.succeeded received', {
        eventId: event.id,
        stripeCustomerId,
        paymentMethodId,
      });

      if (!stripeCustomerId || !paymentMethodId) {
        console.log('[stripe webhook] setup_intent.succeeded missing customer or payment method, skipping default assignment');
        return;
      }

      const customer = await getStripe().customers.retrieve(stripeCustomerId);
      console.log('[stripe webhook] customer default payment method before assignment', {
        stripeCustomerId,
        defaultPaymentMethod:
          !customer.deleted ? customer.invoice_settings?.default_payment_method || null : null,
      });
      if (!customer.deleted && !customer.invoice_settings?.default_payment_method) {
        await getStripe().customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
        console.log('[stripe webhook] assigned first payment method as default', {
          stripeCustomerId,
          paymentMethodId,
        });
      } else {
        console.log('[stripe webhook] customer already had a default payment method, leaving as-is', {
          stripeCustomerId,
          paymentMethodId,
        });
      }

      const companyId = await resolveCompanyIdFromStripeReferences(supabase, { stripeCustomerId });
      if (companyId) {
        await setCompanyPaymentMethodConnected(supabase, companyId, true);
      }
      return;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const stripeSubscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = typeof stripeSubscription.customer === 'string'
        ? stripeSubscription.customer
        : stripeSubscription.customer?.id || null;
      const companyId = await resolveCompanyIdFromStripeReferences(supabase, {
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
      });

      if (!companyId) {
        return;
      }

      await upsertSubscriptionProjection(supabase, {
        companyId,
        userId: stripeSubscription.metadata?.userId || null,
        stripeCustomerId,
        stripeSubscription,
      });
      return;
    }
    case 'invoice.paid': {
      await processInvoiceEvent(supabase, event.data.object as Stripe.Invoice, 'paid');
      return;
    }
    case 'invoice.payment_failed': {
      await processInvoiceEvent(supabase, event.data.object as Stripe.Invoice, 'payment_failed');
      return;
    }
    case 'invoice.created':
    case 'invoice.finalized': {
      await processInvoiceEvent(supabase, event.data.object as Stripe.Invoice);
      return;
    }
    default:
      return;
  }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.log('[stripe webhook] missing stripe-signature header');
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret());
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
  }

  console.log('[stripe webhook] received event', {
    eventId: event.id,
    type: event.type,
    livemode: event.livemode,
  });

  if (event.livemode === isStripeTestMode()) {
    console.error('[stripe webhook] livemode mismatch for current deployment', {
      eventId: event.id,
      type: event.type,
      livemode: event.livemode,
      expectedLivemode: !isStripeTestMode(),
    });
    return NextResponse.json({ error: 'Stripe mode mismatch' }, { status: 400 });
  }

  const supabase = await createServerComponentClient();
  const billingEvent = await ensureBillingEventRow(supabase, event);

  if (billingEvent?.processed) {
    console.log('[stripe webhook] duplicate event ignored', {
      eventId: event.id,
      type: event.type,
    });
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    let companyId: string | null = null;
    let stripeCustomerId: string | null = null;
    let stripeSubscriptionId: string | null = null;

    if ('object' in event.data && event.data.object && typeof event.data.object === 'object') {
      const eventObject = event.data.object as Stripe.Event.Data.Object;
      stripeCustomerId = getEventCustomerId(eventObject);
      stripeSubscriptionId = getEventSubscriptionId(eventObject);

      const metadata = getEventMetadata(eventObject);
      companyId = metadata.companyId
        ? metadata.companyId
        : await resolveCompanyIdFromStripeReferences(supabase, { stripeCustomerId, stripeSubscriptionId });
    }

    await updateBillingEvent(supabase, event.id, {
      company_id: companyId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
    });

    console.log('[stripe webhook] resolved billing event context', {
      eventId: event.id,
      type: event.type,
      companyId,
      stripeCustomerId,
      stripeSubscriptionId,
    });

    await processEvent(supabase, event);

    await updateBillingEvent(supabase, event.id, {
      processed: true,
      processed_at: new Date().toISOString(),
      error_message: null,
    });

    console.log('[stripe webhook] event processed successfully', {
      eventId: event.id,
      type: event.type,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown webhook error';
    console.error('Stripe webhook processing failed:', error);

    await updateBillingEvent(supabase, event.id, {
      error_message: message,
    });

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

function isStripeTestMode() {
  return process.env.NODE_ENV !== 'production';
}
