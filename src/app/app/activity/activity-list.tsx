'use client';

import { useState } from 'react';
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

interface UpdateItem {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  time: string;
  date: string;
}

const mockUpdates: UpdateItem[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Negative Review Alert',
    description: 'John Smith left a 1-star review mentioning poor customer service experience',
    time: '5 min ago',
    date: 'Today',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Response Needed',
    description: '3 clients are awaiting a response for more than 24 hours',
    time: '1 hour ago',
    date: 'Today',
  },
  {
    id: '3',
    type: 'success',
    title: 'Issue Resolved',
    description: 'Sarah Johnson marked her complaint as resolved after follow-up',
    time: '2 hours ago',
    date: 'Today',
  },
  {
    id: '4',
    type: 'info',
    title: 'New Client Added',
    description: 'Mike Williams was added to your client list',
    time: '3 hours ago',
    date: 'Today',
  },
  {
    id: '5',
    type: 'critical',
    title: 'Escalation Required',
    description: 'Emily Davis has requested to speak with a manager',
    time: '5 hours ago',
    date: 'Today',
  },
  {
    id: '6',
    type: 'success',
    title: 'Positive Review Received',
    description: 'Robert Brown left a 5-star review praising your team',
    time: '6 hours ago',
    date: 'Today',
  },
  {
    id: '7',
    type: 'warning',
    title: 'Follow-up Reminder',
    description: 'Scheduled follow-up with Lisa Anderson is due',
    time: '8 hours ago',
    date: 'Today',
  },
  {
    id: '8',
    type: 'info',
    title: 'Review Request Sent',
    description: 'Automated review request sent to 5 clients',
    time: 'Yesterday',
    date: 'Yesterday',
  },
  {
    id: '9',
    type: 'success',
    title: 'Customer Recovered',
    description: 'James Wilson decided to continue service after resolution',
    time: 'Yesterday',
    date: 'Yesterday',
  },
  {
    id: '10',
    type: 'critical',
    title: 'Complaint Filed',
    description: 'New complaint received from Jennifer Martinez',
    time: 'Yesterday',
    date: 'Yesterday',
  },
];

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

export function ActivityList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    critical: true,
    warning: true,
    success: true,
    info: true,
  });

  const filteredUpdates = mockUpdates.filter((update) => {
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
