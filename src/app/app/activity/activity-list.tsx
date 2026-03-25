'use client';

import { useState, useMemo, useEffect } from 'react';
import { Sparkles, Star, Frown, Filter, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface UpdateItem {
  id: string;
  type: 'ai_response' | 'new_review' | 'low_sentiment';
  title: string;
  description: string;
  timestamp: string;
  date: string;
}

interface ActivityListProps {
  companyId: string;
}

const iconMap = {
  ai_response: { icon: Sparkles, bgColor: 'bg-primary/10', iconColor: 'text-primary' },
  new_review: { icon: Star, bgColor: 'bg-secondary/10', iconColor: 'text-secondary' },
  low_sentiment: { icon: Frown, bgColor: 'bg-destructive/10', iconColor: 'text-destructive' },
};

const normalizeType = (color: string | null): UpdateItem['type'] => {
  const s = (color ?? '').toLowerCase();
  if (s.includes('ai') || s.includes('auto') || s.includes('response') || s.includes('green') || s.includes('success')) return 'ai_response';
  if (s.includes('red') || s.includes('critical') || s.includes('negative') || s.includes('conflict') || s.includes('warning') || s.includes('attention')) return 'low_sentiment';
  return 'new_review';
};

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const formatDateGroup = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (itemDate.getTime() === today.getTime()) return 'Today';
  if (itemDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function ActivityList({ companyId }: ActivityListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    ai_response: true,
    new_review: true,
    low_sentiment: true,
  });
  const supabase = createBrowserComponentClient();
  const queryClient = useQueryClient();

  const { data: updates, isLoading } = useQuery({
    queryKey: ['activity-updates', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('update')
        .select('id, created_at, update_title, update_text, update_color, read_status')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching updates:', error);
        throw error;
      }
      return data || [];
    },
  });

  useEffect(() => {
    const markUpdatesAsRead = async () => {
      if (!updates || updates.length === 0) return;
      
      const unreadIds = updates
        .filter((update: { read_status: boolean; id: string }) => update.read_status === false)
        .map((update: { id: string }) => update.id);
      
      if (unreadIds.length === 0) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('update') as any)
        .update({ read_status: true })
        .in('id', unreadIds);

      if (!error) {
        queryClient.invalidateQueries({ queryKey: ['navbar-updates'] });
      }
    };

    markUpdatesAsRead();
  }, [updates, supabase, queryClient]);

  const mappedUpdates: UpdateItem[] = useMemo(() => {
    if (!updates) return [];
    return updates.map((item: any) => ({
      id: item.id,
      type: normalizeType(item.update_color),
      title: item.update_title || 'Update',
      description: item.update_text || '',
      timestamp: formatRelativeTime(item.created_at),
      date: formatDateGroup(item.created_at),
    }));
  }, [updates]);

  const filteredUpdates = mappedUpdates.filter((update) => {
    if (!filters[update.type]) return false;
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      update.title.toLowerCase().includes(searchLower) ||
      update.description.toLowerCase().includes(searchLower)
    );
  });

  const groupedUpdates = filteredUpdates.reduce((acc, update) => {
    if (!acc[update.date]) {
      acc[update.date] = [];
    }
    acc[update.date].push(update);
    return acc;
  }, {} as Record<string, UpdateItem[]>);

  if (isLoading) {
    return (
      <div className="bg-[#1a1919] rounded-2xl overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 bg-[#201f1f]/30">
          <div className="h-6 w-32 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-white/5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-8 py-5 flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading activity...</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1919] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-[#201f1f]/30">
        <h3 className="text-lg font-bold">All Activity</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-9 h-8 w-48 bg-[#201f1f] border-white/10 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-3 bg-[#201f1f] rounded text-muted-foreground hover:text-primary transition-all text-xs font-medium gap-1">
                <Filter className="h-3 w-3" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1919] border-white/10">
              <DropdownMenuCheckboxItem
                checked={filters.ai_response}
                onCheckedChange={(checked) => setFilters({ ...filters, ai_response: checked })}
                className="text-xs cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-primary" />
                  AI Response
                </span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.new_review}
                onCheckedChange={(checked) => setFilters({ ...filters, new_review: checked })}
                className="text-xs cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-secondary" />
                  New Review
                </span>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.low_sentiment}
                onCheckedChange={(checked) => setFilters({ ...filters, low_sentiment: checked })}
                className="text-xs cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Frown className="h-3 w-3 text-destructive" />
                  Low Sentiment
                </span>
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Activity Items */}
      <div className="divide-y divide-white/5">
        {Object.entries(groupedUpdates).map(([date, dateUpdates]) => (
          <div key={date}>
            <div className="px-8 py-3 bg-[#201f1f]/20">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{date}</span>
            </div>
            {dateUpdates.map((activity) => {
              const { icon: Icon, bgColor, iconColor } = iconMap[activity.type];
              return (
                <div
                  key={activity.id}
                  className="px-8 py-5 flex items-start gap-4 hover:bg-[#201f1f] transition-colors"
                >
                  <div className={cn('w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center', bgColor)}>
                    <Icon className={cn('w-4 h-4', iconColor)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-semibold">{activity.title}</p>
                      <span className="text-[10px] text-muted-foreground font-medium">{activity.timestamp}</span>
                    </div>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{activity.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {filteredUpdates.length === 0 && (
          <div className="px-8 py-12 text-center">
            <Frown className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No activity matches your search' : 'No activity yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
