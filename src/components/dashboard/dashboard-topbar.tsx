/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, AlertTriangle, CheckCircle2, Clock, Info, Menu, X, LayoutDashboard, Inbox, MessageSquareText, UserPlus, HeartHandshake, Shield } from 'lucide-react';
import { useSidebar } from '@/lib/sidebar-context';
import { usePathname } from 'next/navigation';
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

const mobileNavItems = [
  { href: '/command-center', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/inbox', label: 'Inbox', icon: Inbox },
  { href: '/app/reviews', label: 'Reviews', icon: MessageSquareText },
  { href: '/app/referral', label: 'Referrals', icon: UserPlus },
  { href: '/app/recovery', label: 'Reengagement', icon: HeartHandshake },
];

export function DashboardTopbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserComponentClient();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState<string>('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    setMounted(true);
    const getCompanyId = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user?.id) {
          setCompanyId(null);
          return;
        }

        const { data: appUser } = await supabase
          .from('app_user')
          .select('company_id, name')
          .eq('user_id', user.id)
          .single() as { data: { company_id: string; name: string | null } | null };
        if (appUser?.company_id) {
          setCompanyId(appUser.company_id);

          const { data: company } = await supabase
            .from('company')
            .select('subscription_status')
            .eq('id', appUser.company_id)
            .single() as { data: { subscription_status: string | null } | null };

          setSubscriptionStatus(company?.subscription_status || null);
        }
        if (appUser?.name) {
          const names = appUser.name.trim().split(' ');
          const initials = names.length >= 2
            ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
            : names[0][0].toUpperCase();
          setUserInitials(initials);
        } else if (user.email) {
          setUserInitials(user.email[0].toUpperCase());
        }
      } catch {
        setCompanyId(null);
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
    <>
    <header className={`fixed top-0 right-0 h-16 z-40 bg-[#0e0e0e]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 border-b border-[#1a1919] text-sm transition-all duration-300 w-full ${isCollapsed ? 'md:w-[calc(100%-5rem)]' : 'md:w-[calc(100%-16rem)]'}`}>
      {/* Mobile Menu Button & Logo */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-[#1a1919] rounded-lg transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-primary to-[#06b77f] rounded-lg flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-[#002919]" />
          </div>
          <span className="text-base font-bold text-primary">RepGuardian</span>
        </div>
      </div>
      
      {/* Desktop spacer */}
      <div className="hidden md:block" />
      
      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-4 text-gray-400">
          {/* Subscription Status Badge */}
          {mounted && (subscriptionStatus === 'active' || subscriptionStatus?.includes('trial')) && (
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              subscriptionStatus === 'active' 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'bg-secondary/10 text-secondary border border-secondary/20'
            }`}>
              {subscriptionStatus === 'active' ? 'Pro' : 'Trial'}
            </span>
          )}
          {/* Notifications Dropdown */}
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 hover:!bg-transparent hover:text-primary transition-all cursor-pointer">
                  <Bell className="w-5 h-5" />
                  {hasUnreadUpdates && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 bg-[#0e0e0e]/80 backdrop-blur-xl border-[#1a1919]" align="end" forceMount>
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
          <div className="w-8 h-8 rounded-full border border-white/10 bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-xs">{userInitials || '?'}</span>
          </div>
        </div>
      </div>
    </header>

    {/* Mobile Navigation Menu */}
    {mobileMenuOpen && (
      <div className="fixed inset-0 top-16 z-30 bg-[#0e0e0e] md:hidden">
        <nav className="flex flex-col p-4 space-y-1">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary bg-[#201f1f] font-semibold'
                    : 'text-[#e6e1e1] hover:text-white hover:bg-[#201f1f]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          {/* Billing link for mobile */}
          {subscriptionStatus !== 'active' && (
            <Link
              href="/app/billing"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 mt-4 px-4 py-3 bg-gradient-to-br from-primary to-[#06b77f] text-[#002919] font-bold rounded-lg"
            >
              Upgrade to Pro
            </Link>
          )}
        </nav>
      </div>
    )}
    </>
  );
}
