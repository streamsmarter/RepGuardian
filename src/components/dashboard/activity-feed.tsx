'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Star, Frown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ActivityItem {
  id: string;
  type: 'ai_response' | 'new_review' | 'low_sentiment';
  title: string;
  description: string;
  timestamp: string;
  rating?: number;
  highlightedText?: string;
  highlightColor?: string;
}

type UpdateRow = {
  id: string;
  created_at?: string | null;
  type?: string | null;
  severity?: string | null;
  level?: string | null;
  status?: string | null;
  title?: string | null;
  message?: string | null;
  description?: string | null;
  body?: string | null;
  update_title?: string | null;
  update_text?: string | null;
};

const iconMap = {
  ai_response: { icon: Sparkles, bgColor: 'bg-primary/10', iconColor: 'text-primary' },
  new_review: { icon: Star, bgColor: 'bg-secondary/10', iconColor: 'text-secondary' },
  low_sentiment: { icon: Frown, bgColor: 'bg-destructive/10', iconColor: 'text-destructive' },
};

function normalizeType(u: UpdateRow): ActivityItem['type'] {
  const s = (u.type ?? u.severity ?? u.level ?? u.status ?? '').toLowerCase();
  if (s.includes('ai') || s.includes('auto') || s.includes('response')) return 'ai_response';
  if (s.includes('review') || s.includes('new') || s.includes('success')) return 'new_review';
  if (s.includes('low') || s.includes('negative') || s.includes('conflict') || s.includes('warning') || s.includes('attention')) return 'low_sentiment';
  return 'new_review'; // default
}

function timeAgo(iso?: string | null) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - t);

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function rowToItem(u: UpdateRow): ActivityItem {
  const fallbackText = u.update_text?.trim() ?? '';
  const rawTitle = (u.update_title ?? u.title ?? u.message ?? '').trim();
  const title = !rawTitle || rawTitle.toLowerCase() === 'update' ? (fallbackText || 'Update') : rawTitle;
  const description = u.update_text ?? u.description ?? u.body ?? '';
  const type = normalizeType(u);

  return {
    id: u.id,
    type,
    title,
    description: description === title ? '' : description,
    timestamp: timeAgo(u.created_at),
    highlightColor: type === 'low_sentiment' ? 'text-destructive' : undefined,
  };
}

export function ActivityFeed() {
  const [rows, setRows] = useState<UpdateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchUpdates() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/updates', { cache: 'no-store' });
        const json = await res.json();

        if (!res.ok) throw new Error(json?.error ?? 'Failed to load updates');
        if (!cancelled) setRows(json.data ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load updates');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchUpdates();
    return () => { cancelled = true; };
  }, []);

  const activities = useMemo(() => rows.slice(0, 5).map(rowToItem), [rows]);

  return (
    <div className="col-span-12 lg:col-span-12 bg-[#1a1919] rounded-2xl overflow-hidden">
      <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-[#201f1f]/30">
        <h3 className="text-lg font-bold">Recent Activity</h3>
        <Link href="/app/activity" className="text-xs text-primary font-bold hover:underline">View All Logs</Link>
      </div>
      <div className="divide-y divide-white/5">
        {loading ? (
          <div className="px-8 py-5 flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading activity...
          </div>
        ) : error ? (
          <div className="px-8 py-5 text-sm text-muted-foreground">
            {error}
          </div>
        ) : activities.length === 0 ? (
          <div className="px-8 py-5 text-sm text-muted-foreground">
            No recent activity.
          </div>
        ) : (
          activities.map((activity) => {
            const { icon: Icon, bgColor, iconColor } = iconMap[activity.type];

            return (
              <div
                key={activity.id}
                className="px-8 py-5 flex items-start gap-4 hover:bg-[#201f1f] transition-colors"
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center',
                    bgColor
                  )}
                >
                  <Icon className={cn('w-4 h-4', iconColor)} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-semibold">{activity.title}</p>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {activity.timestamp}
                    </span>
                  </div>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {activity.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
