/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Search, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reward {
  id: string;
  name: string;
  description: string | null;
  type: string;
  amount: number | null;
  status: string;
}

interface RewardSearchProps {
  companyId: string;
  label: string;
  placeholder?: string;
  selectedReward: Reward | null;
  onSelect: (reward: Reward | null) => void;
}

const REWARD_TYPE_LABELS: Record<string, string> = {
  discount_percentage: '% Off',
  discount_fixed: '$ Off',
  free_service: 'Free Service',
  free_item: 'Free Item',
  points: 'Points',
};

export function RewardSearch({
  companyId,
  label,
  placeholder = 'Search rewards...',
  selectedReward,
  onSelect,
}: RewardSearchProps) {
  const supabase = createBrowserComponentClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ['rewards', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('reward') as any)
        .select('id, name, description, type, amount, status')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data as Reward[];
    },
    enabled: !!companyId,
  });

  const filteredRewards = rewards.filter((reward) =>
    reward.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (reward: Reward) => {
    onSelect(reward);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setSearchQuery('');
  };

  const formatRewardValue = (reward: Reward) => {
    if (reward.amount === null) return '';
    if (reward.type === 'discount_percentage') return `${reward.amount}%`;
    if (reward.type === 'discount_fixed') return `$${reward.amount}`;
    if (reward.type === 'points') return `${reward.amount} pts`;
    return '';
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div ref={containerRef} className="relative">
        {selectedReward ? (
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
            <Gift className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm">{selectedReward.name}</span>
            <Badge variant="secondary" className="text-xs">
              {REWARD_TYPE_LABELS[selectedReward.type] || selectedReward.type}
              {selectedReward.amount !== null && ` - ${formatRewardValue(selectedReward)}`}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              className="pl-9"
            />
          </div>
        )}

        {isOpen && !selectedReward && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
            <ScrollArea className="max-h-[200px]">
              {isLoading ? (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  Loading rewards...
                </div>
              ) : filteredRewards.length === 0 ? (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'No rewards found' : 'No active rewards'}
                </div>
              ) : (
                <div className="p-1">
                  {filteredRewards.map((reward) => (
                    <button
                      key={reward.id}
                      type="button"
                      className={cn(
                        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
                        'hover:bg-accent hover:text-accent-foreground',
                        'focus:bg-accent focus:text-accent-foreground focus:outline-none'
                      )}
                      onClick={() => handleSelect(reward)}
                    >
                      <Gift className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{reward.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {REWARD_TYPE_LABELS[reward.type] || reward.type}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
