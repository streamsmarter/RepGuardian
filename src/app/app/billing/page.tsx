'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  MessageSquare,
  Brain,
  Rss,
  PenTool,
  GitBranch,
  BarChart3,
  AlertTriangle,
  Lock,
  ShieldCheck,
  Globe,
  BadgeCheck,
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    iconColor: 'text-primary',
    title: 'Automated Review Collection',
    description: 'SMS-driven outreach triggers upon appointment completion.',
  },
  {
    icon: Brain,
    iconColor: 'text-secondary',
    title: 'Sentiment Intelligence',
    description: 'Proprietary AI analyzes feedback tone to detect hidden customer friction.',
  },
  {
    icon: Rss,
    iconColor: 'text-primary',
    title: 'Unified Messenger',
    description: 'Direct SMS integration with Autopilot toggle for 24/7 engagement.',
  },
  {
    icon: PenTool,
    iconColor: 'text-secondary',
    title: 'AI Review Architect',
    description: 'Generate contextual, high-quality review responses with a single click.',
  },
  {
    icon: GitBranch,
    iconColor: 'text-primary',
    title: 'Smart Feedback Routing',
    description: 'Positive vibes to Google; constructive feedback to your private inbox.',
  },
  {
    icon: BarChart3,
    iconColor: 'text-secondary',
    title: 'Diagnostic Analysis',
    description: 'Automated breakdown of systemic business strengths and vulnerabilities.',
  },
];

function BillingPageContent() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  const monthlyPrice = 49.99;
  const annualPrice = 499.99;
  const currentPrice = isAnnual ? annualPrice : monthlyPrice;
  const billingPeriod = isAnnual ? 'Year' : 'Month';

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const router = useRouter();

  useEffect(() => {
    if (success) {
      toast.success('Subscription activated successfully!');
      router.replace('/app/billing');
    }
    if (canceled) {
      toast.error('Checkout was canceled.');
      router.replace('/app/billing');
    }
  }, [success, canceled, router]);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: isAnnual ? 'annual' : 'monthly',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-12 relative min-h-screen">
      {/* Light leak effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(105, 246, 184, 0.04) 0%, transparent 70%)',
        }}
      />

      <section className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-4">
            RepGuardian Subscription
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Unleash autonomous reputation defense. Deploy the intelligent monolith to secure your brand&apos;s digital perimeter.
          </p>
        </div>

        {/* Subscription Toggle */}
        <div className="flex justify-center items-center gap-6 mb-16">
          <span className={`text-sm font-medium uppercase tracking-widest ${!isAnnual ? 'text-primary' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-16 h-8 bg-[#201f1f] rounded-full p-1 relative flex items-center cursor-pointer"
          >
            <div 
              className={`w-6 h-6 bg-primary rounded-full shadow-[0_0_12px_rgba(105,246,184,0.4)] transition-transform duration-200 ${
                isAnnual ? 'translate-x-8' : 'translate-x-0'
              }`}
            />
          </button>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold uppercase tracking-widest ${isAnnual ? 'text-primary' : 'text-muted-foreground'}`}>
              Annual
            </span>
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full border border-primary/20">
              Save 20%
            </span>
          </div>
        </div>

        {/* Main Pricing Card */}
        <div className="bg-[#1a1919] rounded-2xl p-8 md:p-12 relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 blur-[80px] rounded-full" />

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Pricing Sidebar */}
            <div className="lg:w-1/3 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#262626] rounded-full mb-6">
                  <BadgeCheck className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                    Enterprise Protocol
                  </span>
                </div>
                <h3 className="text-4xl font-black tracking-tighter mb-2 italic">
                  RepGuardian
                </h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  The complete autonomous suite for high-stakes brand intelligence.
                </p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-5xl font-extrabold tracking-tight">
                    ${currentPrice.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground text-sm uppercase tracking-widest">
                    / {billingPeriod}
                  </span>
                </div>
                {isAnnual && (
                  <p className="text-[11px] text-primary font-bold uppercase tracking-widest mb-10">
                    Billed annually • Save $100
                  </p>
                )}
                {!isAnnual && (
                  <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mb-10">
                    Billed monthly
                  </p>
                )}
              </div>
              <button 
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full py-5 bg-gradient-to-br from-primary to-[#06b77f] text-[#002919] font-black text-sm uppercase tracking-[0.2em] rounded-lg shadow-[0_20px_40px_-15px_rgba(6,183,127,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(6,183,127,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Activate'
                )}
              </button>
            </div>

            {/* Feature Breakdown: Bento Grid */}
            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-[#201f1f] p-6 rounded-xl border border-[#484847]/10 hover:bg-[#262626] transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center mb-4">
                    <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                  </div>
                  <h4 className="font-bold uppercase tracking-wide mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Anomalous Alerting Section */}
        <div className="mt-12 bg-[#262626]/40 backdrop-blur-xl p-8 rounded-2xl border border-[#484847]/20 flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-bold mb-2">Anomalous Alerting System</h4>
            <p className="text-muted-foreground">
              Receive zero-latency notifications across SMS and Desktop whenever a critical negative experience is detected by the RepGuardian core.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
            <span>Active Monitoring</span>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-20 flex flex-wrap justify-center gap-12 grayscale opacity-40">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-widest">AES-256 Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-widest">Compliance Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-widest">Global API access</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-6 md:p-12 min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <BillingPageContent />
    </Suspense>
  );
}
