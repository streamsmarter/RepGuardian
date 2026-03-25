'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, PartyPopper, Gift, Phone, ArrowRight, Lock, Loader2 } from 'lucide-react';

function formatToE164(input: string, countryCode: string = '1'): string | null {
  const digitsOnly = input.replace(/\D/g, '');

  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }

  if (digitsOnly.length === 10) {
    return `+${countryCode}${digitsOnly}`;
  }

  if (digitsOnly.length >= 11 && digitsOnly.length <= 15) {
    return `+${digitsOnly}`;
  }

  return null;
}

function isValidPhoneInput(input: string): boolean {
  return /^[\d\s()\-+.]*$/.test(input);
}

function ReferForm() {
  const searchParams = useSearchParams();
  const refcode = searchParams.get('refcode');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (isValidPhoneInput(value)) {
      setPhoneNumber(value);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    const formattedPhone = formatToE164(phoneNumber);
    if (!formattedPhone) {
      setError('Please enter a valid phone number (e.g., 747-251-0029)');
      return;
    }

    if (!refcode) {
      setError('Invalid referral link');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/refer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: formattedPhone,
          refcode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (data.booking_link) {
        window.location.href = data.booking_link;
      } else {
        setError('Unable to redirect. Please try again.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!refcode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e0e0e] p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-red-500">
              Invalid Link
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-4">
            This referral link is invalid or has expired.
          </h1>
          <p className="text-[#adaaaa] text-sm">
            Please contact the person who shared this link with you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0e0e0e] text-white min-h-screen flex flex-col overflow-x-hidden selection:bg-primary/30">
      {/* Top Decorative Line */}
      <div className="fixed top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent z-50" />

      {/* Header Navigation */}
      <nav className="w-full sticky top-0 bg-[#0e0e0e] flex items-center justify-center px-6 h-16 z-40">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="font-bold tracking-[0.05em] uppercase text-[0.6875rem] text-primary">
            SENTINEL REWARDS
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md flex flex-col items-center text-center space-y-10">
          {/* Atmospheric Glow Background */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

          {/* Welcome Section */}
          <section className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <PartyPopper className="w-3.5 h-3.5 text-primary" />
              <span className="text-[0.625rem] font-bold tracking-[0.1em] text-primary uppercase">
                Exclusive Access
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              You&apos;ve been invited
            </h1>
            <p className="text-[#adaaaa] text-base leading-relaxed max-w-[320px] mx-auto">
              Enter your phone number to activate your{' '}
              <span className="text-primary font-semibold">15% discount</span> for your next
              booking.
            </p>
          </section>

          {/* Reward Visual Card */}
          <div className="w-full bg-[#1a1919] p-6 rounded-xl border border-[#484847]/15 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Gift className="w-16 h-16 text-primary" />
            </div>
            <div className="flex flex-col items-start text-left space-y-1">
              <span className="text-[0.6875rem] font-bold tracking-widest text-[#adaaaa] uppercase">
                Your Reward Status
              </span>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold text-primary">15% OFF</span>
              </div>
            </div>
          </div>

          {/* Core Action Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="flex flex-col items-start space-y-2 w-full">
              <label className="text-[0.6875rem] font-medium text-[#adaaaa] uppercase tracking-wider ml-1">
                Phone Number
              </label>
              <div className="relative w-full">
                <input
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  disabled={isSubmitting}
                  autoComplete="tel"
                  maxLength={20}
                  className="w-full bg-black text-white text-lg px-5 py-4 rounded-lg border-0 ring-1 ring-[#484847]/20 focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-[#777575]/50 shadow-inner"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40">
                  <Phone className="w-5 h-5" />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting || !phoneNumber.trim()}
              className="w-full py-5 px-8 rounded-lg font-bold text-[#002919] tracking-wide uppercase text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #69f6b8 0%, #06b77f 100%)',
                boxShadow: '0 0 20px rgba(105, 246, 184, 0.2)',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Activate Reward
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[0.75rem] text-[#adaaaa]/80 italic">
              Your reward will be automatically applied when you book with this phone number.
            </p>
          </form>

          {/* Trust Signals */}
          <footer className="pt-8 w-full border-t border-[#484847]/5">
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-1.5 grayscale opacity-60">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[0.625rem] font-bold tracking-widest uppercase">
                  Sentinel Verified
                </span>
              </div>
              <div className="h-4 w-px bg-[#484847]/20" />
              <div className="flex items-center gap-1.5 grayscale opacity-60">
                <Lock className="w-4 h-4" />
                <span className="text-[0.625rem] font-bold tracking-widest uppercase">
                  Encrypted & Secure
                </span>
              </div>
            </div>
          </footer>
        </div>
      </main>

      {/* Bottom Decorative Line */}
      <div className="fixed bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e0e0e] p-4">
      <div className="text-center">
        <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
        <p className="text-[#adaaaa] text-sm uppercase tracking-widest">Loading...</p>
      </div>
    </div>
  );
}

export default function ReferPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReferForm />
    </Suspense>
  );
}
