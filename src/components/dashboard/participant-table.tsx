'use client';

import { Search, Filter, ChevronRight, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Participant {
  id: string;
  initials: string;
  name: string;
  email: string;
  status: 'high-growth' | 'steady' | 'power-user';
  statusLabel: string;
  invitesSent: number;
  successful: number;
  rewardsEarned: string;
  avatarColor: string;
}

const mockParticipants: Participant[] = [
  {
    id: '1',
    initials: 'AM',
    name: 'Adrian Miller',
    email: 'adrian@example.com',
    status: 'high-growth',
    statusLabel: 'High Growth',
    invitesSent: 142,
    successful: 38,
    rewardsEarned: '$1,900.00',
    avatarColor: 'bg-secondary/20 text-secondary',
  },
  {
    id: '2',
    initials: 'SL',
    name: 'Sarah Lund',
    email: 's.lund@corp.io',
    status: 'steady',
    statusLabel: 'Steady',
    invitesSent: 89,
    successful: 12,
    rewardsEarned: '$600.00',
    avatarColor: 'bg-[#91feef]/20 text-[#74e1d3]',
  },
  {
    id: '3',
    initials: 'JW',
    name: 'James Wu',
    email: 'j.wu@tech-flow.com',
    status: 'power-user',
    statusLabel: 'Power User',
    invitesSent: 210,
    successful: 45,
    rewardsEarned: '$2,250.00',
    avatarColor: 'bg-primary/20 text-primary',
  },
];

const statusStyles = {
  'high-growth': 'bg-primary/10 text-primary',
  steady: 'bg-muted-foreground/10 text-muted-foreground',
  'power-user': 'bg-primary/10 text-primary',
};

export function ParticipantTable() {
  return (
    <div className="col-span-12 bg-[#1a1919] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-8 flex items-center justify-between border-b border-[#484847]/10">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Participant Performance
          </h3>
          <p className="text-lg font-bold">Top Influencers</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search participants..."
              className="pl-10 pr-4 py-2 rounded bg-black border-none focus-visible:ring-1 focus-visible:ring-primary text-sm w-64 placeholder:text-muted-foreground/50"
            />
          </div>
          <button className="p-2 rounded bg-[#201f1f] hover:bg-[#262626] transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#131313]">
            <tr>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Client
              </th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Status
              </th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
                Invites Sent
              </th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
                Successful
              </th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">
                Rewards Earned
              </th>
              <th className="px-8 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#484847]/5">
            {mockParticipants.map((participant) => (
              <tr
                key={participant.id}
                className="hover:bg-[#201f1f] transition-colors cursor-pointer group"
              >
                <td className="px-8 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs',
                        participant.avatarColor
                      )}
                    >
                      {participant.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{participant.name}</p>
                      <p className="text-[10px] text-muted-foreground">{participant.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-4">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                      statusStyles[participant.status]
                    )}
                  >
                    <span
                      className={cn(
                        'w-1 h-1 rounded-full',
                        participant.status === 'steady' ? 'bg-muted-foreground' : 'bg-primary'
                      )}
                    />
                    {participant.statusLabel}
                  </span>
                </td>
                <td className="px-8 py-4 text-center font-bold">{participant.invitesSent}</td>
                <td className="px-8 py-4 text-center font-bold">{participant.successful}</td>
                <td className="px-8 py-4 text-right font-bold text-primary">
                  {participant.rewardsEarned}
                </td>
                <td className="px-8 py-4 text-right">
                  <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 bg-[#131313] flex justify-center">
        <button className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
          Load more participants
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
