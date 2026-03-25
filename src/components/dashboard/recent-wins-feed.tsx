'use client';

import { cn } from '@/lib/utils';

interface WinItem {
  id: string;
  type: 'conversion' | 'milestone';
  title: string;
  description: string;
  reward?: string;
}

const mockWins: WinItem[] = [
  {
    id: '1',
    type: 'conversion',
    title: 'New Conversion',
    description: 'Alex Rivera referred Jordan S.',
    reward: '+$50.00 Awarded',
  },
  {
    id: '2',
    type: 'conversion',
    title: 'New Conversion',
    description: 'Sarah Chen referred 2 users.',
    reward: '+$100.00 Awarded',
  },
  {
    id: '3',
    type: 'milestone',
    title: 'Milestone Reached',
    description: '1,000 Total Referrals passed.',
  },
];

export function RecentWinsFeed() {
  return (
    <div className="col-span-12 lg:col-span-3 bg-[#1a1919] rounded-xl p-8">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
        Recent Wins
      </h3>

      <div className="space-y-6">
        {mockWins.map((win) => (
          <div key={win.id} className="flex gap-4">
            <div
              className={cn(
                'w-2 h-2 rounded-full mt-1.5 shrink-0',
                win.type === 'conversion' ? 'bg-primary' : 'bg-secondary'
              )}
            />
            <div>
              <p className="text-xs font-bold text-foreground">{win.title}</p>
              <p className="text-[10px] text-muted-foreground">{win.description}</p>
              {win.reward && (
                <p className="text-[9px] text-primary font-bold mt-1">{win.reward}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-8 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
        View Audit Log
      </button>
    </div>
  );
}
