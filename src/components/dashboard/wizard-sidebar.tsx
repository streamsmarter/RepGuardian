'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Fingerprint, Gift, Users, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const wizardSteps = [
  { href: '/create-program', label: 'Identity', icon: Fingerprint },
  { href: '/create-program/rewards', label: 'Rewards', icon: Gift },
  { href: '/create-program/audience', label: 'Audience', icon: Users },
  { href: '/create-program/review', label: 'Review', icon: Rocket },
];

export function WizardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 flex flex-col py-6 bg-[#0e0e0e] z-40">
      <div className="px-6 mb-10">
        <h2 className="text-primary font-bold text-lg">Wizard</h2>
        <p className="text-gray-500 text-xs">Referral Engine</p>
      </div>

      <nav className="flex-1 space-y-1">
        {wizardSteps.map((step) => {
          const Icon = step.icon;
          const isActive = pathname === step.href;

          return (
            <Link
              key={step.href}
              href={step.href}
              className={cn(
                'flex items-center gap-4 px-6 py-3 transition-all cursor-pointer',
                isActive
                  ? 'bg-[#1a1919] text-primary border-r-2 border-primary'
                  : 'text-gray-500 hover:bg-[#201f1f] hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-xs">{step.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 mt-auto">
        <Button
          variant="ghost"
          className="w-full py-2 bg-[#262626] text-foreground text-xs font-semibold rounded hover:bg-[#2c2c2c] transition-all"
        >
          Save Draft
        </Button>
      </div>
    </aside>
  );
}
