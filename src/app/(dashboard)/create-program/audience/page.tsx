'use client';

import { ArrowDown, ChevronRight, Filter, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useProgramWizard } from '@/lib/program-wizard-context';
import {
  AudienceSegmentGrid,
  PositiveFeedbackToggle,
} from '@/components/dashboard/audience-segment-card';
import { SMSPreview } from '@/components/dashboard/sms-preview';

export default function AudiencePage() {
  const router = useRouter();
  const { data } = useProgramWizard();

  const handleNext = () => {
    router.push('/create-program/review');
  };

  return (
    <>
      <div className="px-12 py-8">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-primary text-[11px] font-bold tracking-wider uppercase">
              Step 3 of 4
            </span>
            <div className="h-px flex-1 bg-[#201f1f] max-w-[100px]" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            Audience & <span className="text-secondary">Triggers</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Define the precise segment of customers who will act as your brand advocates and
            configure the logic for automated outreach.
          </p>
        </header>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-8">
          {/* Column 1: Logical Controls */}
          <div className="col-span-12 lg:col-span-7 space-y-8">
            {/* RepGuardian Logic Toggle */}
            <PositiveFeedbackToggle />

            {/* Customer Segment Filters */}
            <section className="p-8 rounded-xl bg-[#1a1919] border border-[#484847]/15">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-lg">Customer Segments</h3>
                <Filter className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
              </div>
              <AudienceSegmentGrid />
            </section>

            {/* Trigger Logic Indicator */}
            <div className="flex items-center gap-4 py-4 px-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Trigger sequence
                </span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
              <ArrowDown className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Column 2: SMS Preview & Actions */}
          <div className="col-span-12 lg:col-span-5 space-y-8">
            <SMSPreview />

            {/* Navigation Controls */}
            <div className="flex flex-col gap-4">
              <Button 
                onClick={handleNext}
                className="w-full py-4 bg-gradient-to-br from-primary to-[#06b77f] text-[#002919] font-extrabold uppercase tracking-widest text-sm shadow-lg shadow-primary/10 hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                Next: Final Review
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Link href="/create-program/rewards">
                <Button
                  variant="ghost"
                  className="w-full py-4 bg-[#262626] text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest transition-all"
                >
                  Back to Rewards
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Floating Help Button */}
      <button className="fixed bottom-8 right-8 w-12 h-12 bg-[#262626] rounded-full flex items-center justify-center text-primary shadow-2xl border border-primary/20 hover:scale-105 transition-all z-50">
        <HelpCircle className="w-5 h-5" />
      </button>
    </>
  );
}
