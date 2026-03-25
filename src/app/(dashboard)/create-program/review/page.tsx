'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  IdentityCard,
  RewardsCard,
  AudienceTargetingCard,
} from '@/components/dashboard/review-summary-card';
import {
  ProjectedImpactCard,
  DeployButton,
  ConfigurationStatus,
} from '@/components/dashboard/projected-impact-card';

export default function ReviewPage() {
  return (
    <>
      {/* Decorative Ambient Glows */}
      <div className="fixed top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[30vw] h-[30vw] bg-secondary/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="pb-12 px-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-12">
            <span className="text-primary text-[11px] tracking-wider uppercase font-bold">
              Step 4 of 4
            </span>
            <h1 className="text-4xl font-extrabold mt-2 text-foreground">Review & Deploy</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Validate your referral architecture. Our AI engine has analyzed your configurations to
              project initial campaign momentum.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Summary Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Identity & Rewards Bento Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <IdentityCard />
                <RewardsCard />
              </div>

              {/* Audience Targeting Card (Wide) */}
              <AudienceTargetingCard />
            </div>

            {/* AI Projection & Action Column */}
            <div className="space-y-8">
              <ProjectedImpactCard />
              <DeployButton />
              <ConfigurationStatus />

              {/* Back Navigation */}
              <Link href="/create-program/audience">
                <Button
                  variant="ghost"
                  className="w-full py-4 bg-[#262626] text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Audience
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
