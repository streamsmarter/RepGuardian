'use client';

import { Banknote, CreditCard, Percent, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RewardType } from '@/lib/program-wizard-context';

interface RewardTypeOption {
  id: RewardType;
  icon: LucideIcon;
  title: string;
  description: string;
}

const rewardTypes: RewardTypeOption[] = [
  {
    id: 'cash',
    icon: Banknote,
    title: 'Cash Credit',
    description: 'Direct wallet balance',
  },
  {
    id: 'credit',
    icon: CreditCard,
    title: 'Store Credit',
    description: 'Credit for future use',
  },
  {
    id: 'percentage',
    icon: Percent,
    title: 'Percentage',
    description: 'Off next purchase',
  },
];

interface RewardTypeSelectorProps {
  selectedType?: RewardType;
  onSelect?: (type: RewardType) => void;
}

export function RewardTypeSelector({ selectedType = 'cash', onSelect }: RewardTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
      {rewardTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = type.id === selectedType;

        return (
          <button
            key={type.id}
            onClick={() => onSelect?.(type.id)}
            className={cn(
              'p-4 md:p-6 text-left transition-all rounded-lg flex sm:flex-col items-center sm:items-start gap-3 sm:gap-0',
              isSelected
                ? 'bg-[#201f1f] border-2 border-primary'
                : 'bg-[#131313] border border-[#484847]/10 hover:border-primary/50'
            )}
          >
            <Icon
              className={cn('w-5 h-5 md:w-6 md:h-6 sm:mb-3 flex-shrink-0', isSelected ? 'text-primary' : 'text-secondary')}
            />
            <div className="flex-1 sm:flex-none">
              <p className="font-bold text-sm">{type.title}</p>
              <p className="text-muted-foreground text-xs mt-0.5 sm:mt-1">{type.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
