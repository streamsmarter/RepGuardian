'use client';

import { Banknote, CreditCard, Percent, Gift, LucideIcon } from 'lucide-react';
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
  {
    id: 'free_service',
    icon: Gift,
    title: 'Free Service',
    description: 'Complimentary service',
  },
];

interface RewardTypeSelectorProps {
  selectedType?: RewardType;
  onSelect?: (type: RewardType) => void;
}

export function RewardTypeSelector({ selectedType = 'cash', onSelect }: RewardTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {rewardTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = type.id === selectedType;

        return (
          <button
            key={type.id}
            onClick={() => onSelect?.(type.id)}
            className={cn(
              'p-6 text-left transition-all',
              isSelected
                ? 'bg-[#201f1f] border-2 border-primary'
                : 'bg-[#131313] border border-[#484847]/10 hover:border-primary/50'
            )}
          >
            <Icon
              className={cn('w-6 h-6 mb-3', isSelected ? 'text-primary' : 'text-secondary')}
            />
            <p className="font-bold text-sm">{type.title}</p>
            <p className="text-muted-foreground text-xs mt-1">{type.description}</p>
          </button>
        );
      })}
    </div>
  );
}
