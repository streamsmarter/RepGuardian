'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Brain,
  Calendar,
  ExternalLink,
  GitBranch,
  Loader2,
  MessageSquare,
  PenTool,
  RefreshCw,
  Rss,
  X,
} from 'lucide-react';
import { ActivationDialog } from '@/components/billing/activation-dialog';
import { BILLING_PLANS } from '@/lib/billing';

type PlanOption = 'monthly' | 'annual';

interface Subscription {
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
}

interface BillingState {
  hasCustomerMapping: boolean;
  stripeCustomerId: string | null;
  paymentMethodConnectedHint: boolean;
  subscriptionStatusHint: string | null;
  canManageBilling: boolean;
}

const PLAN_OPTIONS: Array<{
  id: PlanOption;
  label: string;
  badge?: string;
  price: number;
  interval: 'Month' | 'Year';
  note: string;
}> = [
  { id: 'monthly', label: 'Monthly', price: BILLING_PLANS.monthly.amount, interval: 'Month', note: 'Billed monthly' },
  { id: 'annual', label: 'Annual', badge: 'Save 20%', price: BILLING_PLANS.annual.amount, interval: 'Year', note: 'Billed annually - Save $100' },
];

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Automated Review Collection',
    description: 'SMS-driven outreach triggers upon appointment completion.',
  },
  {
    icon: Brain,
    title: 'Sentiment Intelligence',
    description: 'Proprietary AI analyzes feedback tone to detect hidden customer friction.',
  },
  {
    icon: Rss,
    title: 'Unified Messenger',
    description: 'Direct SMS integration with Autopilot toggle for 24/7 engagement.',
  },
  {
    icon: PenTool,
    title: 'AI Review Architect',
    description: 'Generate contextual, high-quality review responses with a single click.',
  },
  {
    icon: GitBranch,
    title: 'Smart Feedback Routing',
    description: 'Positive vibes to Google; constructive feedback to your private inbox.',
  },
  {
    icon: BarChart3,
    title: 'Diagnostic Analysis',
    description: 'Automated breakdown of systemic business strengths and vulnerabilities.',
  },
];

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanOption>('annual');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingState, setBillingState] = useState<BillingState | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [isActivationOpen, setIsActivationOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const activePlanOption = useMemo(
    () => PLAN_OPTIONS.find((plan) => plan.id === selectedPlan) || PLAN_OPTIONS[1],
    [selectedPlan]
  );

  const fetchSubscription = useCallback(async () => {
    try {
      const response = await fetch('/api/stripe/subscription');
      const data = await response.json();
      if (response.ok) {
        setSubscription(data.subscription);
        setBillingState(data.billing || null);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setIsLoadingSubscription(false);
    }
  }, []);

  useEffect(() => {
    void fetchSubscription();
  }, [fetchSubscription]);

  const MANAGEABLE_SUBSCRIPTION_STATUSES = ['active', 'trialing', 'past_due', 'unpaid', 'incomplete'];
  const TERMINAL_SUBSCRIPTION_STATUSES = ['canceled', 'incomplete_expired'];

  const hasManageableSubscription =
    subscription &&
    MANAGEABLE_SUBSCRIPTION_STATUSES.includes(subscription.status) &&
    !TERMINAL_SUBSCRIPTION_STATUSES.includes(subscription.status);

  const formatDate = (dateString: string | null) =>
    !dateString
      ? 'N/A'
      : new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean | null) => {
    if (cancelAtPeriodEnd) return <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-bold uppercase tracking-wider text-yellow-400">Canceling</span>;
    if (status === 'active') return <span className="rounded-full bg-primary/20 px-2 py-1 text-xs font-bold uppercase tracking-wider text-primary">Active</span>;
    if (status === 'trialing') return <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs font-bold uppercase tracking-wider text-blue-400">Trial</span>;
    if (status === 'past_due') return <span className="rounded-full bg-destructive/20 px-2 py-1 text-xs font-bold uppercase tracking-wider text-destructive">Past Due</span>;
    if (status === 'canceled') return <span className="rounded-full bg-gray-500/20 px-2 py-1 text-xs font-bold uppercase tracking-wider text-gray-400">Canceled</span>;
    return <span className="rounded-full bg-gray-500/20 px-2 py-1 text-xs font-bold uppercase tracking-wider text-gray-400">{status}</span>;
  };

  const handleOpenPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create billing portal session');
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('Billing portal error:', error);
      toast.error('Failed to open Stripe billing portal');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) return;

    setIsCanceling(true);
    try {
      const response = await fetch('/api/stripe/subscription', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelImmediately: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      toast.success('Subscription will be canceled at the end of your billing period');
      await fetchSubscription();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setIsReactivating(true);
    try {
      const response = await fetch('/api/stripe/subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      });

      if (!response.ok) {
        throw new Error('Failed to reactivate subscription');
      }

      toast.success('Subscription reactivated successfully');
      await fetchSubscription();
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
      toast.error('Failed to reactivate subscription');
    } finally {
      setIsReactivating(false);
    }
  };

  return (
    <div className="relative min-h-screen p-6 md:p-12">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at center, rgba(105, 246, 184, 0.04) 0%, transparent 70%)' }}
      />

      <section className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-5xl font-extrabold tracking-tighter md:text-6xl">
            RepGuardian Subscription
          </h2>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Unleash autonomous reputation defense. Deploy the intelligent monolith to secure your
            brand&apos;s digital perimeter.
          </p>
        </div>

        {hasManageableSubscription ? (
          <div className="relative mb-8 overflow-hidden rounded-2xl bg-[#1a1919] p-8">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/5 blur-[80px]" />
            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-xl font-bold">Current Subscription</h3>
                    {getStatusBadge(subscription.status, subscription.cancelAtPeriodEnd)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {subscription.plan?.name || 'RepGuardian Pro'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold">
                    ${(subscription.billingAmount ?? (subscription.billingInterval === 'year' ? subscription.plan?.price_annual : subscription.plan?.price_monthly) ?? 49.99).toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{subscription.billingInterval === 'year' ? 'yr' : 'mo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-[#262626] p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Current Period
                  </div>
                  <p className="font-semibold">
                    {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
                {subscription.cancelAtPeriodEnd ? (
                  <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                    <div className="mb-1 flex items-center gap-2 text-sm text-yellow-400">
                      <AlertTriangle className="h-4 w-4" />
                      Cancellation Scheduled
                    </div>
                    <p className="font-semibold text-yellow-400">
                      Access ends {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                {subscription.cancelAtPeriodEnd ? (
                  <button
                    onClick={() => void handleReactivateSubscription()}
                    disabled={isReactivating}
                    className="flex items-center gap-2 rounded-lg bg-primary/10 px-6 py-3 font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                  >
                    {isReactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Reactivate Subscription
                  </button>
                ) : (
                  <button
                    onClick={() => void handleCancelSubscription()}
                    disabled={isCanceling}
                    className="flex items-center gap-2 rounded-lg bg-destructive/10 px-6 py-3 font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
                  >
                    {isCanceling ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    Cancel Subscription
                  </button>
                )}
                <button
                  onClick={() => void handleOpenPortal()}
                  disabled={isOpeningPortal || !billingState?.canManageBilling}
                  className="flex items-center gap-2 rounded-lg bg-[#262626] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#333] disabled:opacity-50"
                >
                  {isOpeningPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  Manage Billing
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-16 flex justify-center">
            <div className="inline-flex flex-wrap items-center gap-3 rounded-2xl border border-[#484847]/20 bg-[#1a1919] p-3">
              {PLAN_OPTIONS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-[#484847]/20 bg-[#201f1f] text-muted-foreground hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold uppercase tracking-widest">{plan.label}</span>
                      {plan.badge ? (
                        <span className="rounded-full border border-primary/20 bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                          {plan.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs">
                      ${plan.price.toFixed(2)}
                      {plan.interval === 'One-Time' ? '' : ` / ${plan.interval}`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!hasManageableSubscription ? (
          <div className="relative overflow-hidden rounded-2xl bg-[#1a1919] p-8 md:p-12">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/5 blur-[80px]" />
            <div className="flex flex-col gap-12 lg:flex-row">
              <div className="flex flex-col justify-between lg:w-1/3">
                <div>
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#262626] px-3 py-1">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                      Enterprise Protocol
                    </span>
                  </div>
                  <h3 className="mb-2 text-4xl font-black italic tracking-tighter">RepGuardian</h3>
                  <p className="mb-8 leading-relaxed text-muted-foreground">
                    The complete autonomous suite for high-stakes brand intelligence.
                  </p>
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold tracking-tight">
                      ${activePlanOption.price.toFixed(2)}
                    </span>
                    <span className="text-sm uppercase tracking-widest text-muted-foreground">
                      {activePlanOption.interval === 'One-Time' ? '' : ` / ${activePlanOption.interval}`}
                    </span>
                  </div>
                  <p
                    className={`mb-6 text-[11px] font-bold uppercase tracking-widest ${
                      selectedPlan === 'annual' ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {activePlanOption.note}
                  </p>
                </div>
                <button
                  onClick={() => setIsActivationOpen(true)}
                  className="w-full rounded-lg bg-gradient-to-br from-primary to-[#06b77f] py-5 text-sm font-black uppercase tracking-[0.2em] text-[#002919] shadow-[0_20px_40px_-15px_rgba(6,183,127,0.3)] transition-all hover:shadow-[0_25px_50px_-12px_rgba(6,183,127,0.4)] active:scale-[0.98]"
                >
                  Activate
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:w-2/3 md:grid-cols-2">
                {FEATURES.map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-xl border border-[#484847]/10 bg-[#201f1f] p-6 transition-colors hover:bg-[#262626]"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-black">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="mb-2 font-bold uppercase tracking-wide">{feature.title}</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <ActivationDialog
        open={isActivationOpen}
        onOpenChange={setIsActivationOpen}
        plan={activePlanOption}
        onActivationSuccess={(nextSubscription) => {
          setSubscription(nextSubscription);
          void fetchSubscription();
        }}
      />
    </div>
  );
}
