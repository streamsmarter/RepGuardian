/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, Bell, CheckCircle2, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

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

export function Navbar() {
  const router = useRouter();
  const supabase = createBrowserComponentClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState<string>('?');
  const [mounted, setMounted] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
        setUserInitial(user.email[0].toUpperCase());
      }
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
    getUser();
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
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const hasUnreadUpdates = updates?.some((update: any) => update.read_status === false) ?? false;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Logo and brand name */}
        <Link href="/app" className="flex items-center gap-2">
          <Image
            src="/Logo 1.svg"
            alt="RepGuardian Logo"
            width={30}
            height={30}
            className="h-[30px] w-[30px]"
          />
          <span className="text-xl font-bold tracking-tight">RepGuardian</span>
        </Link>

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 hover:bg-muted hover:text-foreground">
                  <Bell className="h-5 w-5" />
                  {hasUnreadUpdates && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end" forceMount>
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {updates && updates.length > 0 ? (
                  updates.map((update: any) => {
                    const type = mapColorToType(update.update_color);
                    return (
                      <DropdownMenuItem
                        key={update.id}
                        className="flex items-start gap-3 p-3 cursor-pointer focus:bg-muted focus:text-foreground"
                        onClick={() => router.push('/app/activity')}
                      >
                        <div className="mt-0.5">{getIcon(type)}</div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
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
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="justify-center text-primary font-medium cursor-pointer focus:bg-muted focus:text-primary"
                  onClick={() => router.push('/app/activity')}
                >
                  See all updates
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-5 w-5" />
            </Button>
          )}

          {/* Profile */}
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium text-sm">
                    {userInitial}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Account</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail || 'Loading...'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/app')}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/app/inbox')}>
                  Conversations
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/app/feedback')}>
                  Feedback
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium text-sm">
              {userInitial}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
