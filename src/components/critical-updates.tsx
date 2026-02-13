'use client';

import Link from 'next/link';
import { AlertTriangle, Bell, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface UpdateItem {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  time: string;
}

const mockUpdates: UpdateItem[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Negative Review Alert',
    description: 'John Smith left a 1-star review',
    time: '5 min ago',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Response Needed',
    description: '3 clients awaiting response',
    time: '1 hour ago',
  },
  {
    id: '3',
    type: 'success',
    title: 'Issue Resolved',
    description: 'Sarah Johnson marked as resolved',
    time: '2 hours ago',
  },
  {
    id: '4',
    type: 'info',
    title: 'New Client Added',
    description: 'Mike Williams joined',
    time: '3 hours ago',
  },
];

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

export function CriticalUpdates() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold text-base">Critical Issues & Updates</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Recent activity requiring attention</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {mockUpdates.map((update) => (
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
          ))}
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
