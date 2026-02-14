'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, Bell, CheckCircle2, Clock, Filter, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface UpdateItem {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  time: string;
  date: string;
}

interface ActivityListProps {
  companyId: string;
}

const mapColorToType = (color: string | null): UpdateItem['type'] => {
  switch (color?.toLowerCase()) {
    case 'red':
    case 'critical':
      return 'critical';
    case 'amber':
    case 'yellow':
    case 'warning':
      return 'warning';
    case 'green':
    case 'success':
      return 'success';
    case 'blue':
    case 'info':
    default:
      return 'info';
  }
};

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
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

const getIcon = (type: UpdateItem['type']) => {
  switch (type) {
    case 'critical':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <Clock className="h-5 w-5 text-amber-500" />;
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case 'info':
      return <Bell className="h-5 w-5 text-blue-500" />;
  }
};

const getAccentColor = (type: UpdateItem['type']) => {
  switch (type) {
    case 'critical':
      return 'border-l-red-500 bg-red-500/5 hover:bg-red-500/10';
    case 'warning':
      return 'border-l-amber-500 bg-amber-500/5 hover:bg-amber-500/10';
    case 'success':
      return 'border-l-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10';
    case 'info':
      return 'border-l-blue-500 bg-blue-500/5 hover:bg-blue-500/10';
  }
};

const getTypeBadge = (type: UpdateItem['type']) => {
  const styles = {
    critical: { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-500' },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500', text: 'text-amber-500' },
    success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500', text: 'text-emerald-500' },
    info: { bg: 'bg-blue-500/10', border: 'border-blue-500', text: 'text-blue-500' },
  };
  const labels = {
    critical: 'Critical',
    warning: 'Warning',
    success: 'Success',
    info: 'Info',
  };
  const s = styles[type];
  return (
    <Badge className={`border ${s.bg} ${s.border} ${s.text}`}>
      {labels[type]}
    </Badge>
  );
};

export function ActivityList({ companyId }: ActivityListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    critical: true,
    warning: true,
    success: true,
    info: true,
  });
  const supabase = createBrowserComponentClient();

  const { data: updates, isLoading, error: queryError } = useQuery({
    queryKey: ['activity-updates', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('update')
        .select('id, created_at, update_title, update_text, update_color')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching updates:', error);
        throw error;
      }
      return data || [];
    },
  });

  // Debug log
  console.log('Updates data:', updates, 'Loading:', isLoading, 'Error:', queryError);

  const mappedUpdates: UpdateItem[] = useMemo(() => {
    if (!updates) return [];
    return updates.map((item: any) => ({
      id: item.id,
      type: mapColorToType(item.update_color),
      title: item.update_title || 'Update',
      description: item.update_text || '',
      time: formatRelativeTime(item.created_at),
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
      <div className="flex flex-col h-[600px]">
        <div className="p-4 border-b flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Search and Filter */}
      <div className="p-4 border-b flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search activity..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={filters.critical}
              onCheckedChange={(checked) => setFilters({ ...filters, critical: checked })}
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Critical
              </span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.warning}
              onCheckedChange={(checked) => setFilters({ ...filters, warning: checked })}
            >
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Warning
              </span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.success}
              onCheckedChange={(checked) => setFilters({ ...filters, success: checked })}
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Success
              </span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filters.info}
              onCheckedChange={(checked) => setFilters({ ...filters, info: checked })}
            >
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-500" />
                Info
              </span>
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {Object.entries(groupedUpdates).map(([date, updates]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
              <div className="space-y-2">
                {updates.map((update) => (
                  <div
                    key={update.id}
                    className={`p-4 rounded-lg border-l-4 transition-colors cursor-pointer ${getAccentColor(update.type)}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5">{getIcon(update.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{update.title}</p>
                            {getTypeBadge(update.type)}
                          </div>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">{update.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{update.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredUpdates.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              {searchQuery ? 'No activity matches your search' : 'No activity found'}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
