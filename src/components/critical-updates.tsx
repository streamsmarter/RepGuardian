'use client';

import Link from 'next/link';
import { AlertTriangle, Bell, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { createBrowserComponentClient } from '@/lib/supabase/client';

interface UpdateItem {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  time: string;
}

interface CriticalUpdatesProps {
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

const getIcon = (type: UpdateItem['type']) => {
  switch (type) {
    case 'critical':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'info':
      return <Bell className="h-4 w-4 text-blue-500" />;
  }
};

const getAccentColor = (type: UpdateItem['type']) => {
  switch (type) {
    case 'critical':
      return 'border-l-red-500 bg-red-500/5';
    case 'warning':
      return 'border-l-amber-500 bg-amber-500/5';
    case 'success':
      return 'border-l-emerald-500 bg-emerald-500/5';
    case 'info':
      return 'border-l-blue-500 bg-blue-500/5';
  }
};

export function CriticalUpdates({ companyId }: CriticalUpdatesProps) {
  const supabase = createBrowserComponentClient();

  const { data: updates, isLoading } = useQuery({
    queryKey: ['dashboard-updates', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('update') as any)
        .select('id, created_at, update_title, update_text, update_color')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const mappedUpdates: UpdateItem[] = (updates || []).map((item: any) => ({
    id: item.id,
    type: mapColorToType(item.update_color),
    title: item.update_title || 'Update',
    description: item.update_text || '',
    time: formatRelativeTime(item.created_at),
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold text-base">Activity</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Latest updates from your business</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading ? (
            <div className="text-sm text-muted-foreground px-1 py-2">Loading activity...</div>
          ) : mappedUpdates.length === 0 ? (
            <div className="text-sm text-muted-foreground px-1 py-2">No activity found.</div>
          ) : (
            mappedUpdates.map((update) => (
              <div
                key={update.id}
                className={`p-3 rounded-lg border-l-4 transition-colors hover:bg-muted/50 cursor-pointer ${getAccentColor(update.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(update.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{update.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{update.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{update.description}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-3 border-t">
        <Link href="/app/activity">
          <Button variant="ghost" className="w-full justify-between text-sm group hover:text-white">
            View all activity
            <ArrowRight className="h-4 w-4 group-hover:text-white" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
