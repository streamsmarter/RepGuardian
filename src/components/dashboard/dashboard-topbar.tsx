/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, AlertTriangle, CheckCircle2, Clock, Info } from 'lucide-react';
import { useSidebar } from '@/app/app/layout';
import { useQuery } from '@tanstack/react-query';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

type UpdateType = 'critical' | 'warning' | 'info' | 'success';

const mapColorToType = (color: string | null): UpdateType => {
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

const getIcon = (type: UpdateType) => {
  switch (type) {
    case 'critical':
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case 'warning':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'info':
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

export function DashboardTopbar() {
  const router = useRouter();
  const supabase = createBrowserComponentClient();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    setMounted(true);
    const getCompanyId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const { data: appUser } = await supabase
          .from('app_user')
          .select('company_id')
          .eq('user_id', user.id)
          .single() as { data: { company_id: string } | null };
        if (appUser?.company_id) {
          setCompanyId(appUser.company_id);
        }
      }
    };
    getCompanyId();
  }, [supabase]);

  const { data: updates } = useQuery({
    queryKey: ['navbar-updates', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('update')
        .select('id, update_title, update_text, update_color, created_at, read_status')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const hasUnreadUpdates = updates?.some((update: any) => update.read_status === false) ?? false;

  return (
    <header className={`fixed top-0 right-0 h-16 z-40 bg-[#0e0e0e]/80 backdrop-blur-xl flex justify-end items-center px-8 border-b border-[#1a1919] text-sm transition-all duration-300 ${isCollapsed ? 'w-[calc(100%-5rem)]' : 'w-[calc(100%-16rem)]'}`}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-gray-400">
          {/* Notifications Dropdown */}
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 hover:bg-transparent hover:text-primary transition-all">
                  <Bell className="w-5 h-5" />
                  {hasUnreadUpdates && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 bg-[#0e0e0e]/95 backdrop-blur-xl border-[#1a1919]" align="end" forceMount>
                <DropdownMenuLabel className="text-white">Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#1a1919]" />
                {updates && updates.length > 0 ? (
                  updates.map((update: any) => {
                    const type = mapColorToType(update.update_color);
                    return (
                      <DropdownMenuItem
                        key={update.id}
                        className="flex items-start gap-3 p-3 cursor-pointer focus:bg-[#1a1919] focus:text-white"
                        onClick={() => router.push('/app/activity')}
                      >
                        <div className="mt-0.5">{getIcon(type)}</div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none text-white">
                            {update.update_title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {update.update_text}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(update.created_at)}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                )}
                <DropdownMenuSeparator className="bg-[#1a1919]" />
                <DropdownMenuItem
                  className="justify-center text-primary font-medium cursor-pointer focus:bg-[#1a1919] focus:text-primary"
                  onClick={() => router.push('/app/activity')}
                >
                  See all activity
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button className="hover:text-primary transition-all">
              <Bell className="w-5 h-5" />
            </button>
          )}
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-muted">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
              alt="User avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
