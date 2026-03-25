'use client';

import { Pencil, CreditCard, Target, Eye, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  label: string;
  icon: LucideIcon;
}

const steps: Step[] = [
  { id: 1, label: 'Identity', icon: Pencil },
  { id: 2, label: 'Rewards', icon: CreditCard },
  { id: 3, label: 'Audience', icon: Target },
  { id: 4, label: 'Review', icon: Eye },
];

interface ProgressStepperProps {
  currentStep?: number;
}

export function ProgressStepper({ currentStep = 1 }: ProgressStepperProps) {
  return (
    <div className="flex items-center justify-between mb-16 relative">
      {/* Background Line */}
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#484847]/30 -translate-y-1/2 -z-10" />

      {steps.map((step) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;

        return (
          <div key={step.id} className="flex flex-col items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all',
                isActive
                  ? 'bg-primary text-[#002919] shadow-[0_0_15px_-3px_rgba(105,246,184,0.3)]'
                  : isCompleted
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-[#262626] border border-[#484847]/50 text-muted-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-widest',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
