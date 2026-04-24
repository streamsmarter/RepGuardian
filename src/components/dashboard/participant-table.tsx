'use client';

import { useState, useMemo, useEffect } from 'react';
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

interface ReferredClient {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  referred_by: string | null;
  created_at: string | null;
  referrer?: {
    first_name: string | null;
    last_name: string | null;
  };
}

interface ParticipantTableProps {
  campaignId?: string | null;
}

type TabType = 'participants' | 'referred' | 'pending';

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
  const [activeTab, setActiveTab] = useState<TabType>('participants');
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Get company ID
  useEffect(() => {
    const getCompanyId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      const { data: appUser } = await supabase
        .from('app_user')
        .select('company_id')
        .eq('user_id', user.id)
        .single() as { data: { company_id: string } | null };

      if (appUser?.company_id) {
        setCompanyId(appUser.company_id);
      }
    };
    getCompanyId();
  }, [supabase]);

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

  // Fetch referred clients (clients with referred_by not null)
  const { data: referredClients, isLoading: isLoadingReferred } = useQuery({
    queryKey: ['referred-clients', companyId],
    queryFn: async () => {
      console.log('Debug - Fetching referred clients for company:', companyId);
      if (!companyId) {
        console.log('Debug - No companyId, returning empty');
        return [];
      }

      // First, let's try fetching ALL clients for this company to see if RLS works
      const { data: allClients, error: allError } = await (supabase.from('client') as any)
        .select('id, first_name, last_name, referred_by')
        .eq('company_id', companyId);

      console.log('Debug - All clients for company:', { allClients, allError });

      if (allError) {
        console.error('Error fetching all clients:', allError);
        return [];
      }

      // Filter clients with referred_by not null
      const referredData = (allClients || []).filter((c: any) => c.referred_by !== null);
      console.log('Debug - Filtered referred clients:', referredData);

      // Now fetch full details for referred clients
      if (referredData.length === 0) {
        return [];
      }

      const referredIds = referredData.map((c: any) => c.id);
      const { data, error } = await (supabase.from('client') as any)
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone_number,
          referred_by,
          created_at
        `)
        .in('id', referredIds);

      console.log('Debug - Referred clients full data:', { data, error });

      if (error) {
        console.error('Error fetching referred clients details:', error);
        return [];
      }

      // Fetch referrer names for each referred client
      const clientsWithReferrers = await Promise.all(
        (data || []).map(async (client: ReferredClient) => {
          if (client.referred_by) {
            const { data: referrer } = await (supabase.from('client') as any)
              .select('first_name, last_name')
              .eq('id', client.referred_by)
              .single();
            return { ...client, referrer };
          }
          return client;
        })
      );

      return clientsWithReferrers as ReferredClient[];
    },
    enabled: !!companyId,
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

  // Filter and search referred clients
  const filteredReferredClients = useMemo(() => {
    if (!referredClients) return [];

    return referredClients.filter((client) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = [client.first_name, client.last_name].filter(Boolean).join(' ').toLowerCase();
        const email = (client.email || '').toLowerCase();
        const phone = (client.phone_number || '').toLowerCase();
        
        if (!name.includes(query) && !email.includes(query) && !phone.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [referredClients, searchQuery]);

  // Filter pending referrals (participants with clicks but no customers yet)
  const pendingReferrals = useMemo(() => {
    if (!recipients) return [];
    return recipients.filter((recipient) => {
      const clicks = parseInt(recipient.link?.click_count || '0', 10);
      const customers = parseInt(recipient.link?.customer_count || '0', 10);
      return clicks > 0 && customers === 0;
    }).filter((recipient) => {
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

  const isLoadingData = activeTab === 'participants' ? isLoading : isLoadingReferred;

  if (isLoadingData) {
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

  const hasNoData = activeTab === 'participants' 
    ? (!recipients || recipients.length === 0)
    : activeTab === 'referred'
    ? (!referredClients || referredClients.length === 0)
    : pendingReferrals.length === 0;

  return (
    <div className="col-span-1 md:col-span-12 bg-[#1a1919] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#484847]/10">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Participant Performance
          </h3>
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-[#131313] rounded-lg p-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => { setActiveTab('participants'); setSearchQuery(''); }}
              className={cn(
                'px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-bold transition-colors whitespace-nowrap',
                activeTab === 'participants'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Participants
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('referred'); setSearchQuery(''); }}
              className={cn(
                'px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-bold transition-colors whitespace-nowrap',
                activeTab === 'referred'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Referred
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('pending'); setSearchQuery(''); }}
              className={cn(
                'px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-bold transition-colors whitespace-nowrap',
                activeTab === 'pending'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Pending
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded bg-black border-none focus-visible:ring-1 focus-visible:ring-primary text-sm w-full md:w-64 placeholder:text-muted-foreground/50"
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

      {hasNoData ? (
        <div className="p-8">
          <p className="text-muted-foreground text-sm">
            {activeTab === 'participants' 
              ? 'No participants yet. Send referral invites to see them here.'
              : activeTab === 'referred'
              ? 'No referred clients yet. Clients who were referred will appear here.'
              : 'No pending referrals. Referrals with clicks but no conversions will appear here.'}
          </p>
        </div>
      ) : activeTab === 'participants' ? (
        <>
          {/* Participants Table */}
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
        </>
      ) : activeTab === 'referred' ? (
        <>
          {/* Referred Clients Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#131313]">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Client
                  </th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Referred By
                  </th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Contact
                  </th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Date Joined
                  </th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#484847]/5">
                {filteredReferredClients.map((client, index) => {
                  const initials = getInitials(client.first_name, client.last_name);
                  const name = [client.first_name, client.last_name].filter(Boolean).join(' ') || 'Unknown';
                  const referrerName = client.referrer 
                    ? [client.referrer.first_name, client.referrer.last_name].filter(Boolean).join(' ') 
                    : 'Unknown';
                  const contact = client.email || client.phone_number || 'No contact';
                  const dateJoined = client.created_at 
                    ? new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '-';

                  return (
                    <tr
                      key={client.id}
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
                          <p className="text-sm font-bold">{name}</p>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-sm text-muted-foreground">{referrerName}</span>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-sm text-muted-foreground">{contact}</span>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-sm text-muted-foreground">{dateJoined}</span>
                      </td>
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
          {filteredReferredClients.length > 10 && (
            <div className="p-4 bg-[#131313] flex justify-center">
              <button className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                Load more clients
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : activeTab === 'pending' ? (
        <>
          {/* Pending Referrals Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#131313]">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Referrer
                  </th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
                    Clicks
                  </th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
                    Submissions
                  </th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Contact
                  </th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#484847]/5">
                {pendingReferrals.map((recipient, index) => {
                  const initials = getInitials(recipient.client?.first_name || null, recipient.client?.last_name || null);
                  const name = [recipient.client?.first_name, recipient.client?.last_name].filter(Boolean).join(' ') || 'Unknown';
                  const clicks = parseInt(recipient.link?.click_count || '0', 10);
                  const submissions = parseInt(recipient.link?.submission_count || '0', 10);
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
                          <p className="text-sm font-bold">{name}</p>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className="text-sm font-bold text-secondary">{clicks}</span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className="text-sm font-bold">{submissions}</span>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-sm text-muted-foreground">{contact}</span>
                      </td>
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
          {pendingReferrals.length > 10 && (
            <div className="p-4 bg-[#131313] flex justify-center">
              <button className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                Load more pending referrals
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
