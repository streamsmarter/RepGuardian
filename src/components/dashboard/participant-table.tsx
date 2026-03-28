'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronRight, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { createBrowserComponentClient } from '@/lib/supabase/client';

interface CampaignRecipient {
  id: string;
  campaign_id: string;
  client_id: string;
  link_id: string | null;
  revenue_generated: number | null;
  client?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone_number: string | null;
  };
  link?: {
    id: string;
    click_count: string | null;
    submission_count: string | null;
    customer_count: string | null;
    refcode: string | null;
  };
}

interface ParticipantTableProps {
  campaignId?: string | null;
}

const getInitials = (firstName: string | null, lastName: string | null): string => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return first + last || '??';
};

const getStatusFromStats = (clicks: number, submissions: number, customers: number): { status: string; label: string } => {
  if (customers >= 3) return { status: 'power-user', label: 'Power User' };
  if (submissions >= 2) return { status: 'high-growth', label: 'High Growth' };
  if (clicks >= 1) return { status: 'active', label: 'Active' };
  return { status: 'new', label: 'New' };
};

const statusStyles: Record<string, string> = {
  'high-growth': 'bg-primary/10 text-primary',
  'active': 'bg-muted-foreground/10 text-muted-foreground',
  'new': 'bg-muted-foreground/10 text-muted-foreground',
  'power-user': 'bg-primary/10 text-primary',
};

const avatarColors = [
  'bg-secondary/20 text-secondary',
  'bg-[#91feef]/20 text-[#74e1d3]',
  'bg-primary/20 text-primary',
];

export function ParticipantTable({ campaignId }: ParticipantTableProps) {
  const supabase = createBrowserComponentClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: recipients, isLoading } = useQuery({
    queryKey: ['campaign-recipients', campaignId],
    queryFn: async () => {
      if (!campaignId) {
        console.log('Debug - No campaignId provided');
        return [];
      }

      console.log('Debug - Fetching recipients for campaign:', campaignId);

      const { data, error } = await (supabase.from('campaign_recipient') as any)
        .select(`
          id,
          campaign_id,
          client_id,
          link_id,
          revenue_generated,
          client:client_id(id, first_name, last_name, email, phone_number),
          link:link_id(id, click_count, submission_count, customer_count, refcode)
        `)
        .eq('campaign_id', campaignId);

      if (error) {
        console.error('Error fetching campaign recipients:', error);
        return [];
      }

      console.log('Debug - Recipients fetched:', data?.length, data);
      return data as CampaignRecipient[];
    },
    enabled: !!campaignId,
  });

  // Filter and search recipients
  const filteredRecipients = useMemo(() => {
    if (!recipients) return [];

    return recipients.filter((recipient) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = [recipient.client?.first_name, recipient.client?.last_name].filter(Boolean).join(' ').toLowerCase();
        const email = (recipient.client?.email || '').toLowerCase();
        const phone = (recipient.client?.phone_number || '').toLowerCase();
        
        if (!name.includes(query) && !email.includes(query) && !phone.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [recipients, searchQuery]);

  if (isLoading) {
    return (
      <div className="col-span-12 bg-[#1a1919] rounded-xl overflow-hidden p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[#262626] rounded w-1/4"></div>
          <div className="h-10 bg-[#262626] rounded"></div>
          <div className="h-10 bg-[#262626] rounded"></div>
          <div className="h-10 bg-[#262626] rounded"></div>
        </div>
      </div>
    );
  }

  if (!recipients || recipients.length === 0) {
    return (
      <div className="col-span-12 bg-[#1a1919] rounded-xl overflow-hidden p-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Participant Performance
        </h3>
        <p className="text-lg font-bold mb-4">Referral Participants</p>
        <p className="text-muted-foreground text-sm">No participants yet. Send referral invites to see them here.</p>
      </div>
    );
  }

  return (
    <div className="col-span-12 bg-[#1a1919] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-8 flex items-center justify-between border-b border-[#484847]/10">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Participant Performance
          </h3>
          <p className="text-lg font-bold">Referral Participants</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search participants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded bg-black border-none focus-visible:ring-1 focus-visible:ring-primary text-sm w-64 placeholder:text-muted-foreground/50"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#131313]">
            <tr>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Referrer
              </th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Status
              </th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
                Submissions
              </th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
                Customers
              </th>
              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
                Revenue
              </th>
              <th className="px-8 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#484847]/5">
            {filteredRecipients.map((recipient, index) => {
              const clicks = parseInt(recipient.link?.click_count || '0', 10);
              const submissions = parseInt(recipient.link?.submission_count || '0', 10);
              const customers = parseInt(recipient.link?.customer_count || '0', 10);
              const { status, label } = getStatusFromStats(clicks, submissions, customers);
              const initials = getInitials(recipient.client?.first_name || null, recipient.client?.last_name || null);
              const name = [recipient.client?.first_name, recipient.client?.last_name].filter(Boolean).join(' ') || 'Unknown';
              const contact = recipient.client?.email || recipient.client?.phone_number || 'No contact';

              return (
                <tr
                  key={recipient.id}
                  className="hover:bg-[#201f1f] transition-colors cursor-pointer group"
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs',
                          avatarColors[index % avatarColors.length]
                        )}
                      >
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{name}</p>
                        <p className="text-[10px] text-muted-foreground">{contact}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                        statusStyles[status] || statusStyles.steady
                      )}
                    >
                      <span
                        className={cn(
                          'w-1 h-1 rounded-full',
                          status === 'steady' ? 'bg-muted-foreground' : 'bg-primary'
                        )}
                      />
                      {label}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-center font-bold">{submissions}</td>
                  <td className="px-8 py-4 text-center font-bold text-primary">{customers}</td>
                  <td className="px-8 py-4 text-center font-bold text-primary">${(recipient.revenue_generated || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-8 py-4 text-right">
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {filteredRecipients.length > 10 && (
        <div className="p-4 bg-[#131313] flex justify-center">
          <button className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            Load more participants
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
