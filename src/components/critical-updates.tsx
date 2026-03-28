/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface UpdateItem {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  time: string;
}

type UpdateRow = {
  id: string;
  created_at?: string | null;
  company_id?: string | null;
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

function normalizeType(u: UpdateRow): UpdateItem['type'] {
  const s = (u.type ?? u.severity ?? u.level ?? u.status ?? '').toLowerCase();
  if (s.includes('critical') || s.includes('urgent') || s.includes('sev1') || s.includes('high')) return 'critical';
  if (s.includes('warning') || s.includes('attention') || s.includes('needs') || s.includes('conflict')) return 'warning';
  if (s.includes('success') || s.includes('resolved') || s.includes('fixed')) return 'success';
  return 'info';
}

function timeAgo(iso?: string | null) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - t);

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;

  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function rowToItem(u: UpdateRow): UpdateItem {
  const fallbackText = u.update_text?.trim() ?? '';
  const rawTitle = (u.update_title ?? u.title ?? u.message ?? '').trim();
  const title = !rawTitle || rawTitle.toLowerCase() === 'update' ? (fallbackText || 'Update') : rawTitle;
  const description = u.update_text ?? u.description ?? u.body ?? '';

  return {
    id: u.id,
    type: normalizeType(u),
    title,
    description: description === title ? '' : description,
    time: timeAgo(u.created_at),
  };
}

export function CriticalUpdates() {
  const [rows, setRows] = useState<UpdateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/updates', {
          cache: 'no-store',
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? 'Failed to load updates');

        if (!cancelled) setRows(json.data ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load updates');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => rows.slice(0, 5).map(rowToItem), [rows]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b">
        <h3 className="font-semibold text-base">Updates</h3>
        <p className="text-xs text-muted-foreground mt-1">Recent activity requiring attention</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-3">
          {loading ? (
            <div className="p-3 rounded-lg border flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading updates...
            </div>
          ) : error ? (
            <div className="p-3 rounded-lg border text-sm text-muted-foreground">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="p-3 rounded-lg border text-sm text-muted-foreground">
              No updates yet.
            </div>
          ) : (
            items.map((update) => (
              <div
                key={update.id}
                className={`p-3 rounded-lg border-l-4 transition-colors hover:bg-muted/50 cursor-pointer ${getAccentColor(
                  update.type
                )}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(update.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{update.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{update.time}</span>
                    </div>
                    {!!update.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{update.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="px-6 py-3 border-t">
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
