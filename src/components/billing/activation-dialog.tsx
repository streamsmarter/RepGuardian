'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Elements,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import type {
  Appearance,
  StripeElementsOptions,
  StripeLinkAuthenticationElementChangeEvent,
} from '@stripe/stripe-js';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  Wallet,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getStripe as getStripeClient } from '@/lib/stripe-client';

type BillingPlanOption = {
  id: 'monthly' | 'annual';
  label: string;
  price: number;
  interval: 'Month' | 'Year';
  note: string;
};

type PaymentMethodSummary = {
  id: string;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
};

type SubscriptionProjection = {
  id: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean | null;
  trialEndsAt: string | null;
  billingAmount?: number | null;
  billingInterval?: string | null;
  plan: {
    id: string;
    name: string;
    price_monthly: number;
    price_annual: number;
  } | null;
  stripeSubscriptionId: string | null;
};

type ActivationContextResponse = {
  companyId: string;
  customerEmail: string;
  plan: {
    key: string;
    label: string;
    amount: number;
    interval: 'month' | 'year';
  };
  planId: string | null;
  hasDefaultPaymentMethod: boolean;
  // defaultPaymentMethod is no longer returned to avoid Stripe API calls
  // The subscribe route fetches payment method details only when needed
  defaultPaymentMethod?: PaymentMethodSummary | null;
};

type SubscribeResponse = {
  subscription: SubscriptionProjection;
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
  error?: string;
};

type ActivationPhase =
  | 'idle'
  | 'loading_activation_context'
  | 'default_method_available'
  | 'preparing_setup_intent'
  | 'collecting_new_method'
  | 'confirming_setup'
  | 'creating_subscription'
  | 'requires_action'
  | 'activation_succeeded'
  | 'activation_failed';

type ActivationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: BillingPlanOption;
  onActivationSuccess: (subscription: SubscriptionProjection) => void;
};

type SecurePaymentFormProps = {
  isBusy: boolean;
  progressLabel: string;
  customerEmail: string;
  plan: BillingPlanOption;
  onBack: () => void;
  onSubmitPaymentMethod: (paymentMethodId: string) => Promise<void>;
  onPhaseChange: (phase: ActivationPhase) => void;
  onError: (message: string) => void;
};

const stripePromise = getStripeClient();
const APP_FONT_STACK =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const appearance: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#69f6b8',
    colorBackground: '#171616',
    colorText: '#f4eeee',
    colorDanger: '#ff6b6b',
    colorTextSecondary: '#a8a2a2',
    colorSuccess: '#69f6b8',
    colorIcon: '#69f6b8',
    borderRadius: '18px',
    fontFamily: APP_FONT_STACK,
  },
  rules: {
    '.Input': {
      backgroundColor: '#1f1d1d',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: 'none',
      color: '#f4eeee',
      padding: '14px 16px',
    },
    '.Input:focus': {
      border: '1px solid rgba(105,246,184,0.55)',
      boxShadow: '0 0 0 1px rgba(105,246,184,0.25)',
    },
    '.Input::placeholder': {
      color: '#8f8888',
    },
    '.Tab': {
      backgroundColor: '#1b1a1a',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: 'none',
      borderRadius: '18px',
      color: '#d9d0d0',
    },
    '.Tab--selected': {
      borderColor: 'rgba(105,246,184,0.65)',
      color: '#69f6b8',
      backgroundColor: '#151414',
      boxShadow: '0 0 0 1px rgba(105,246,184,0.2)',
    },
    '.Label': {
      color: '#d9d0d0',
      fontWeight: '700',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      fontSize: '12px',
    },
    '.Block': {
      backgroundColor: '#171616',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: 'none',
    },
    '.CodeInput': {
      backgroundColor: '#1f1d1d',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: 'none',
    },
  },
};

const CLIENT_CONFIRMABLE_PAYMENT_INTENT_STATUSES = new Set([
  'requires_action',
  'requires_confirmation',
  'processing',
]);

function getActivationProgressLabel(phase: ActivationPhase) {
  switch (phase) {
    case 'confirming_setup':
      return 'Saving payment method...';
    case 'creating_subscription':
      return 'Creating subscription...';
    case 'requires_action':
      return 'Confirming with your bank...';
    default:
      return 'Activating...';
  }
}

function ErrorBanner({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[#f1d6d6]">{message}</p>
          {actionLabel && onAction ? (
            <button
              onClick={onAction}
              className="mt-3 rounded-lg bg-[#262626] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#333]"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SecurePaymentForm({
  isBusy,
  progressLabel,
  customerEmail,
  plan,
  onBack,
  onSubmitPaymentMethod,
  onPhaseChange,
  onError,
}: SecurePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isConfirming, setIsConfirming] = useState(false);
  const [linkEmail, setLinkEmail] = useState(customerEmail);
  const [billingName, setBillingName] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Secure payment form is still loading. Please try again in a moment.');
      return;
    }

    setIsConfirming(true);
    onError('');
    onPhaseChange('confirming_setup');

    try {
      const result = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: window.location.href,
          payment_method_data: {
            billing_details: {
              name: billingName || undefined,
              email: linkEmail || undefined,
            },
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message || 'Stripe could not confirm your payment method.');
      }

      const paymentMethodId =
        typeof result.setupIntent.payment_method === 'string'
          ? result.setupIntent.payment_method
          : result.setupIntent.payment_method?.id || null;

      if (!paymentMethodId) {
        throw new Error(
          'Stripe confirmed the payment method, but no payment method ID was returned.'
        );
      }

      await onSubmitPaymentMethod(paymentMethodId);
    } catch (error) {
      onPhaseChange('activation_failed');
      onError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while saving your payment method.'
      );
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-6 lg:grid-cols-[minmax(300px,0.78fr)_minmax(0,1.22fr)]">
        <div className="space-y-5">
          <div className="rounded-[28px] border border-[#484847]/20 bg-[#1a1919] p-5">
            <div className="rounded-[24px] border border-white/8 bg-[#191818] p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Payment summary
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-base font-semibold text-white">Subscription activation</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Save a payment method and activate recurring billing securely in-app.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#141313] p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="text-white">
                      {plan.label} / {plan.interval}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Contact</span>
                    <span className={linkEmail ? 'text-white' : 'text-muted-foreground'}>
                      {linkEmail || 'Add email'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cardholder</span>
                    <span className={billingName ? 'text-white' : 'text-muted-foreground'}>
                      {billingName || 'Add full name'}
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#141313] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Due today</span>
                    <span className="text-2xl font-semibold text-white">
                      ${plan.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    The first successful subscription payment activates your selected plan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 p-4 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <p>
              Choose from the payment methods Stripe makes available for your region and device.
              Your payment details stay encrypted and securely handled by Stripe.
            </p>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(105,246,184,0.08),transparent_32%),linear-gradient(180deg,#1f1d1d_0%,#141313_100%)] p-6 text-white shadow-[0_24px_60px_-18px_rgba(0,0,0,0.6)]">
          <div className="mx-auto max-w-[580px] space-y-5">
            <div className="rounded-[22px] border border-white/8 bg-[#1a1919] p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Express checkout</p>
                  <p className="text-xs text-muted-foreground">
                    Stripe will show accelerated checkout when the current browser supports it.
                  </p>
                </div>
              </div>
              <div className="rounded-[20px] border border-white/8 bg-[#151414] p-3">
                <LinkAuthenticationElement
                  options={{
                    defaultValues: {
                      email: customerEmail,
                    },
                  }}
                  onChange={(event: StripeLinkAuthenticationElementChangeEvent) => {
                    setLinkEmail(event.value.email);
                  }}
                />
              </div>
            </div>

            <div className="rounded-[22px] border border-white/8 bg-[#1a1919] p-6">
              <label className="mb-4 block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  Full name
                </span>
                <input
                  value={billingName}
                  onChange={(event) => setBillingName(event.target.value)}
                  placeholder="Jane Diaz"
                  autoComplete="name"
                  className="w-full rounded-[18px] border border-white/8 bg-[#151414] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
                />
              </label>

              <div className="rounded-[20px] border border-white/8 bg-[#151414] p-4">
                <PaymentElement
                  options={{
                    layout: {
                      type: 'tabs',
                      defaultCollapsed: false,
                      spacedAccordionItems: false,
                    },
                    wallets: {
                      applePay: 'auto',
                      googlePay: 'auto',
                    },
                    business: {
                      name: 'RepGuardian',
                    },
                    fields: {
                      billingDetails: {
                        name: 'auto',
                        email: 'never',
                        address: 'if_required',
                      },
                    },
                  }}
                />
              </div>

              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                The payment options shown here are the live options Stripe can use for this setup
                and subscription activation flow.
              </p>
              {isBusy ? (
                <div className="mt-4 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-primary">
                  {progressLabel}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-lg bg-[#262626] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#333]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!stripe || !elements || isBusy || isConfirming}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-primary to-[#06b77f] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#002919] transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {isBusy || isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isBusy || isConfirming ? progressLabel : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export function ActivationDialog({
  open,
  onOpenChange,
  plan,
  onActivationSuccess,
}: ActivationDialogProps) {
  const [phase, setPhase] = useState<ActivationPhase>('idle');
  const [activationContext, setActivationContext] = useState<ActivationContextResponse | null>(null);
  const [setupIntentClientSecret, setSetupIntentClientSecret] = useState<string | null>(null);
  const [flowError, setFlowError] = useState('');
  const [lastAction, setLastAction] = useState<'load_context' | 'setup_intent' | 'activate_default' | 'activate_new' | null>(null);

  const elementsOptions = useMemo<StripeElementsOptions | null>(() => {
    if (!setupIntentClientSecret) {
      return null;
    }

    return {
      clientSecret: setupIntentClientSecret,
      appearance,
      paymentMethodCreation: 'manual',
    };
  }, [setupIntentClientSecret]);

  const resetState = useCallback(() => {
    setPhase('idle');
    setActivationContext(null);
    setSetupIntentClientSecret(null);
    setFlowError('');
    setLastAction(null);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (phase !== 'activation_succeeded') {
      return;
    }

    const timeout = window.setTimeout(() => {
      onOpenChange(false);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [onOpenChange, open, phase]);

  const loadActivationContext = useCallback(async () => {
    setLastAction('load_context');
    setFlowError('');
    setPhase('loading_activation_context');

    try {
      const response = await fetch('/api/stripe/activation/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.id }),
      });
      const data = (await response.json()) as ActivationContextResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load activation context');
      }

      setActivationContext(data);
      if (data.hasDefaultPaymentMethod) {
        setPhase('default_method_available');
      } else {
        setPhase('preparing_setup_intent');
      }
    } catch (error) {
      setPhase('activation_failed');
      setFlowError(
        error instanceof Error ? error.message : 'Failed to load activation context'
      );
    }
  }, [plan.id]);

  const prepareSetupIntent = useCallback(async () => {
    setLastAction('setup_intent');
    setFlowError('');
    setPhase('preparing_setup_intent');

    try {
      const response = await fetch('/api/stripe/activation/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.id }),
      });
      const data = (await response.json()) as { clientSecret?: string; error?: string };

      if (!response.ok || !data.clientSecret) {
        throw new Error(data.error || 'Failed to prepare secure payment entry');
      }

      setSetupIntentClientSecret(data.clientSecret);
      setPhase('collecting_new_method');
    } catch (error) {
      setPhase('activation_failed');
      setFlowError(
        error instanceof Error ? error.message : 'Failed to prepare secure payment entry'
      );
    }
  }, [plan.id]);

  const handleRequiresAction = useCallback(
    async (
      clientSecret: string,
      confirmationTokenType: 'invoice_confirmation_secret' | 'payment_intent' | null
    ) => {
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe.js is not available');
    }

    setPhase('requires_action');
    console.info('[billing][activation-dialog] Triggering client payment confirmation', {
      clientConfirmationTriggered: true,
      confirmationTokenType,
    });
    const result =
      confirmationTokenType === 'invoice_confirmation_secret'
        ? await stripe.confirmPayment({
            clientSecret,
            confirmParams: {
              return_url: window.location.href,
            },
            redirect: 'if_required',
          })
        : await stripe.confirmCardPayment(clientSecret);

    if (result.error) {
      console.error('[billing][activation-dialog] Client payment confirmation failed', {
        clientConfirmationTriggered: true,
        confirmationTokenType,
        finalPostConfirmationStatus: (result as any).paymentIntent?.status || null,
        error: result.error.message || 'Payment authentication failed',
      });
      throw new Error(result.error.message || 'Payment authentication failed');
    }

    console.info('[billing][activation-dialog] Client payment confirmation completed', {
      clientConfirmationTriggered: true,
      confirmationTokenType,
      finalPostConfirmationStatus: (result as any).paymentIntent?.status || null,
      paymentIntentId: (result as any).paymentIntent?.id || null,
    });

    return (result as any).paymentIntent;
  }, []);

  const confirmPaymentIntentIfNeeded = useCallback(
    async (data: SubscribeResponse) => {
      const paymentIntentStatus = data.paymentIntentStatus;
      const confirmationClientSecret =
        data.confirmationClientSecret || data.paymentIntentClientSecret;
      const confirmationTokenType =
        data.confirmationTokenType || (data.paymentIntentClientSecret ? 'payment_intent' : null);

      console.info('[billing][activation-dialog] Evaluating subscription payment intent', {
        subscriptionStatus: data.subscription.status,
        latestInvoiceId: data.latestInvoiceId,
        latestInvoiceStatus: data.latestInvoiceStatus,
        latestInvoiceHasConfirmationSecret: data.latestInvoiceHasConfirmationSecret,
        latestInvoiceHasPaymentIntent: data.latestInvoiceHasPaymentIntent,
        paymentIntentId: data.paymentIntentId,
        paymentIntentStatus,
        confirmationTokenType,
        billingMode: data.billingMode,
        stripeApiVersion: data.stripeApiVersion,
        requiresAction: data.requiresAction,
        frontendConfirmationRequired: data.frontendConfirmationRequired,
      });

      if (paymentIntentStatus === 'requires_payment_method') {
        console.warn('[billing][activation-dialog] Payment intent requires a new payment method', {
          latestInvoiceId: data.latestInvoiceId,
          paymentIntentId: data.paymentIntentId,
          paymentIntentStatus,
          clientConfirmationTriggered: false,
        });
        throw new Error('Stripe could not charge this payment method. Try a different one.');
      }

      if (!confirmationClientSecret) {
        console.info('[billing][activation-dialog] No client confirmation triggered', {
          latestInvoiceId: data.latestInvoiceId,
          latestInvoiceStatus: data.latestInvoiceStatus,
          paymentIntentId: data.paymentIntentId,
          paymentIntentStatus,
          confirmationTokenType,
          clientConfirmationTriggered: false,
        });

        if (data.subscription.status === 'incomplete') {
          console.error(
            '[billing][activation-dialog] Missing confirmation client secret for incomplete subscription',
            {
              latestInvoiceId: data.latestInvoiceId,
              latestInvoiceStatus: data.latestInvoiceStatus,
              paymentIntentId: data.paymentIntentId,
              paymentIntentStatus,
              confirmationTokenType,
              clientConfirmationTriggered: false,
            }
          );
          throw new Error(
            'Payment confirmation was required, but Stripe did not return the payment details needed to finish activation.'
          );
        }

        return;
      }

      if (paymentIntentStatus === 'succeeded') {
        console.info('[billing][activation-dialog] Payment already succeeded; skipping client confirmation', {
          latestInvoiceId: data.latestInvoiceId,
          latestInvoiceStatus: data.latestInvoiceStatus,
          paymentIntentId: data.paymentIntentId,
          paymentIntentStatus,
          confirmationTokenType,
          clientConfirmationTriggered: false,
          finalPostConfirmationStatus: 'succeeded',
        });
        return;
      }

      if (
        confirmationTokenType === 'invoice_confirmation_secret' ||
        (paymentIntentStatus && CLIENT_CONFIRMABLE_PAYMENT_INTENT_STATUSES.has(paymentIntentStatus))
      ) {
        const confirmedPaymentIntent = await handleRequiresAction(
          confirmationClientSecret,
          confirmationTokenType
        );
        const finalStatus = confirmedPaymentIntent?.status || null;

        if (finalStatus === 'requires_payment_method') {
          throw new Error('Stripe could not charge this payment method. Try a different one.');
        }

        if (finalStatus && finalStatus !== 'succeeded' && finalStatus !== 'processing') {
          throw new Error(`Payment confirmation ended in "${finalStatus}". Please try again.`);
        }

        return;
      }

      console.warn('[billing][activation-dialog] Unexpected payment intent state; attempting client confirmation', {
        latestInvoiceId: data.latestInvoiceId,
        latestInvoiceStatus: data.latestInvoiceStatus,
        paymentIntentId: data.paymentIntentId,
        paymentIntentStatus,
        confirmationTokenType,
        clientConfirmationTriggered: true,
      });

      const confirmedPaymentIntent = await handleRequiresAction(
        confirmationClientSecret,
        confirmationTokenType
      );
      const finalStatus = confirmedPaymentIntent?.status || null;

      if (finalStatus === 'requires_payment_method') {
        throw new Error('Stripe could not charge this payment method. Try a different one.');
      }

      if (finalStatus && finalStatus !== 'succeeded' && finalStatus !== 'processing') {
        throw new Error(`Payment confirmation ended in "${finalStatus}". Please try again.`);
      }
    },
    [handleRequiresAction]
  );

  const createSubscription = useCallback(
    async (payload: { useDefaultPaymentMethod?: boolean; paymentMethodId?: string | null }) => {
      setFlowError('');
      setPhase('creating_subscription');

      try {
        const response = await fetch('/api/stripe/activation/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: plan.id,
            useDefaultPaymentMethod: payload.useDefaultPaymentMethod || false,
            paymentMethodId: payload.paymentMethodId || null,
          }),
        });

        const data = (await response.json()) as SubscribeResponse;
        if (!response.ok) {
          throw new Error(data.error || 'Failed to activate subscription');
        }

        await confirmPaymentIntentIfNeeded(data);

        setPhase('activation_succeeded');
        onActivationSuccess(data.subscription);
        toast.success('Subscription activated successfully');
      } catch (error) {
        setPhase('activation_failed');
        const message =
          error instanceof Error ? error.message : 'Failed to activate subscription';
        setFlowError(message);
        toast.error(message);
      }
    },
    [confirmPaymentIntentIfNeeded, onActivationSuccess, plan.id]
  );

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    const loadContext = async () => {
      setPhase('loading_activation_context');
      setFlowError('');
      setSetupIntentClientSecret(null);

      try {
        const contextResponse = await fetch('/api/stripe/activation/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: plan.id }),
        });
        const contextData = (await contextResponse.json()) as ActivationContextResponse & { error?: string };

        if (!contextResponse.ok) {
          throw new Error(contextData.error || 'Failed to load activation context');
        }

        setActivationContext(contextData);

        if (contextData.hasDefaultPaymentMethod) {
          setPhase('default_method_available');
        } else {
          await prepareSetupIntent();
        }
      } catch (error) {
        setPhase('activation_failed');
        setFlowError(
          error instanceof Error ? error.message : 'Failed to load activation'
        );
      }
    };

    void loadContext();
  }, [open, plan.id, prepareSetupIntent, resetState]);

  const retry = async () => {
    if (lastAction === 'load_context') {
      await loadActivationContext();
      return;
    }

    if (lastAction === 'setup_intent' || lastAction === 'activate_new') {
      await prepareSetupIntent();
      return;
    }

    if (lastAction === 'activate_default') {
      await createSubscription({ useDefaultPaymentMethod: true });
      return;
    }

    await loadActivationContext();
  };

  const isBusy =
    phase === 'loading_activation_context' ||
    phase === 'preparing_setup_intent' ||
    phase === 'confirming_setup' ||
    phase === 'creating_subscription' ||
    phase === 'requires_action';
  const progressLabel = getActivationProgressLabel(phase);

  const shouldShowDefaultMethod =
    activationContext?.hasDefaultPaymentMethod &&
    (phase === 'default_method_available' ||
      (phase === 'activation_failed' && lastAction === 'activate_default'));

  const shouldShowNewMethodForm =
    Boolean(elementsOptions) &&
    (phase === 'collecting_new_method' ||
      phase === 'confirming_setup' ||
      phase === 'creating_subscription' ||
      phase === 'requires_action' ||
      (phase === 'activation_failed' &&
        (lastAction === 'setup_intent' || lastAction === 'activate_new')));

  const renderBody = () => {
    if (phase === 'loading_activation_context') {
      return (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      );
    }

    if (phase === 'activation_succeeded') {
      return (
        <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-primary/20 bg-primary/10 shadow-[0_0_50px_rgba(105,246,184,0.12)]">
            <CheckCircle2 className="h-12 w-12 animate-pulse text-primary" />
          </div>
          <h3 className="mt-8 text-3xl font-extrabold tracking-tight text-white">
            Payment Complete
          </h3>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Your subscription is now activating. This window will close automatically.
          </p>
        </div>
      );
    }

    if (
      phase === 'activation_failed' &&
      (lastAction === 'activate_default' || lastAction === 'activate_new')
    ) {
      return (
        <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 shadow-[0_0_50px_rgba(255,113,108,0.12)]">
            <XCircle className="h-12 w-12 animate-pulse text-destructive" />
          </div>
          <h3 className="mt-8 text-3xl font-extrabold tracking-tight text-white">
            Payment Failed
          </h3>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            {flowError || 'We could not complete the activation. This window will close automatically.'}
          </p>
        </div>
      );
    }

    if (!activationContext) {
      return flowError ? (
        <ErrorBanner message={flowError} actionLabel="Retry" onAction={() => void retry()} />
      ) : null;
    }

    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-[#484847]/20 bg-[#201f1f] p-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Selected Plan
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold">{plan.label}</span>
            <span className="text-muted-foreground">
              ${plan.price.toFixed(2)} / {plan.interval}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{plan.note}</p>
        </div>

        {flowError ? (
          <ErrorBanner message={flowError} actionLabel="Retry" onAction={() => void retry()} />
        ) : null}

        {shouldShowDefaultMethod ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
              Saved payment method
            </p>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#262626]">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">Your default payment method is on file</p>
                <p className="text-sm text-muted-foreground">
                  Ready to use for this subscription
                </p>
              </div>
            </div>
            <div className="mb-4 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <p>
                We&apos;ll use your saved default payment method to activate this subscription
                securely inside the app. Stripe may still request authentication if your bank
                requires it.
              </p>
            </div>
            {isBusy ? (
              <div className="mb-4 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-primary">
                {progressLabel}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setLastAction('activate_default');
                  void createSubscription({ useDefaultPaymentMethod: true });
                }}
                disabled={isBusy}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-primary to-[#06b77f] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#002919] transition-all hover:brightness-110 disabled:opacity-50"
              >
                {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isBusy ? progressLabel : 'Activate With Saved Method'}
              </button>
              <button
                onClick={() => void prepareSetupIntent()}
                disabled={isBusy}
                className="rounded-lg bg-[#262626] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#333] disabled:opacity-50"
              >
                Use a New Payment Method
              </button>
            </div>
          </div>
        ) : null}

        {phase === 'preparing_setup_intent' ? (
          <div className="flex items-center justify-center py-10">
            <div className="flex items-center gap-3 text-sm text-primary">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Preparing secure payment form...</span>
            </div>
          </div>
        ) : null}

        {shouldShowNewMethodForm && !activationContext.hasDefaultPaymentMethod ? (
          <div className="space-y-4">
            {elementsOptions ? (
              <Elements stripe={stripePromise} options={elementsOptions}>
                <SecurePaymentForm
                  isBusy={isBusy}
                  progressLabel={progressLabel}
                  customerEmail={activationContext.customerEmail}
                  plan={plan}
                  onBack={() => onOpenChange(false)}
                  onSubmitPaymentMethod={async (paymentMethodId) => {
                    setLastAction('activate_new');
                    await createSubscription({ paymentMethodId });
                  }}
                  onPhaseChange={setPhase}
                  onError={setFlowError}
                />
              </Elements>
            ) : null}
          </div>
        ) : null}

        {shouldShowNewMethodForm && activationContext.hasDefaultPaymentMethod && elementsOptions ? (
          <div className="space-y-4">
            <Elements stripe={stripePromise} options={elementsOptions}>
              <SecurePaymentForm
                isBusy={isBusy}
                progressLabel={progressLabel}
                customerEmail={activationContext.customerEmail}
                plan={plan}
                onBack={() => setPhase('default_method_available')}
                onSubmitPaymentMethod={async (paymentMethodId) => {
                  setLastAction('activate_new');
                  await createSubscription({ paymentMethodId });
                }}
                onPhaseChange={setPhase}
                onError={setFlowError}
              />
            </Elements>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden border-[#2c2b2b] bg-[#141313] p-0 text-white">
        <div className="border-b border-white/5 p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Complete Activation</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Activate your plan without leaving the app. Stripe securely handles payment method
              collection and any required authentication.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">{renderBody()}</div>
      </DialogContent>
    </Dialog>
  );
}
