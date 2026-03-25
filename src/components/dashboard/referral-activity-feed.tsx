'use client';

import { Gift, UserPlus, Rocket, ShieldCheck, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'reward' | 'referral' | 'upgrade' | 'system';
  content: string;
  highlightedUser?: string;
  timestamp: string;
  program: string;
}

const mockActivityData: ActivityItem[] = [
  {
    id: '1',
    type: 'reward',
    content: 'Reward unlocked by',
    highlightedUser: '@cryptopunk',
    timestamp: '2 minutes ago',
    program: 'VIP REWARD',
  },
  {
    id: '2',
    type: 'referral',
    content: 'New referral: Sarah M. joined via Alex P.',
    timestamp: '14 minutes ago',
    program: 'SUMMER SPECIAL',
  },
  {
    id: '3',
    type: 'upgrade',
    content: 'Network tier upgrade: Diamond Catalyst',
    timestamp: '1 hour ago',
    program: 'GLOBAL',
  },
  {
    id: '4',
    type: 'reward',
    content: 'Reward unlocked by',
    highlightedUser: '@neon_dev',
    timestamp: '1 hour ago',
    program: 'VIP REWARD',
  },
  {
    id: '5',
    type: 'system',
    content: 'Anti-fraud audit completed: All green.',
    timestamp: '3 hours ago',
    program: 'SYSTEM',
  },
];

const iconMap: Record<string, { icon: LucideIcon; color: string; hoverBorder: string }> = {
  reward: { icon: Gift, color: 'text-primary', hoverBorder: 'group-hover:border-primary/30' },
  referral: { icon: UserPlus, color: 'text-secondary', hoverBorder: 'group-hover:border-secondary/30' },
  upgrade: { icon: Rocket, color: 'text-primary', hoverBorder: 'group-hover:border-primary/30' },
  system: { icon: ShieldCheck, color: 'text-secondary', hoverBorder: 'group-hover:border-secondary/30' },
};

interface ReferralActivityFeedProps {
  activities?: ActivityItem[];
}

export function ReferralActivityFeed({ activities = mockActivityData }: ReferralActivityFeedProps) {
  return (
    <div className="col-span-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-extrabold text-white">Live Activity</h3>
        <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
      </div>

      <div className="bg-[#262626]/40 backdrop-blur-xl border border-primary/5 rounded-2xl p-4 h-[420px] overflow-y-auto space-y-4">
        {activities.map((activity) => {
          const { icon: Icon, color, hoverBorder } = iconMap[activity.type];

          return (
            <div
              key={activity.id}
              className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full bg-[#1a1919] flex items-center justify-center shrink-0 border border-white/5 transition-all',
                  hoverBorder
                )}
              >
                <Icon className={cn('w-5 h-5', color)} />
              </div>
              <div>
                <p className="text-sm text-white leading-tight font-medium">
                  {activity.content}
                  {activity.highlightedUser && (
                    <span className="text-primary"> {activity.highlightedUser}</span>
                  )}
                </p>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                  {activity.timestamp} • {activity.program}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
