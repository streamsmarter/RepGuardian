'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/lib/sidebar-context';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Inbox,
  MessageSquareText,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
} from 'lucide-react';
import { BrainLogo } from '@/components/brain-logo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/command-center', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/inbox', label: 'Inbox', icon: Inbox },
  { href: '/app/reviews', label: 'Reviews', icon: MessageSquareText },
  { href: '/app/referral', label: 'Referrals', icon: UserPlus },
  { href: '/app/recovery', label: 'Reengagement', icon: HeartHandshake },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const supabase = createBrowserComponentClient();

  useEffect(() => {
    const getSubscriptionStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;

        const { data: appUser } = await supabase
          .from('app_user')
          .select('company_id')
          .eq('user_id', user.id)
          .single() as { data: { company_id: string } | null };

        if (appUser?.company_id) {
          const { data: company } = await supabase
            .from('company')
            .select('subscription_status')
            .eq('id', appUser.company_id)
            .single() as { data: { subscription_status: string | null } | null };

          setSubscriptionStatus(company?.subscription_status || null);
        }
      } catch {
        // Ignore errors
      }
    };
    getSubscriptionStatus();
  }, [supabase]);

  const isActiveSubscription = subscriptionStatus === 'active';

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col h-screen fixed left-0 top-0 z-50 border-r border-[#1a1919] bg-[#0e0e0e]/80 backdrop-blur-xl font-sans tracking-tight transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className={cn("py-8", isCollapsed ? "px-4" : "px-6")}>
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-[#06b77f] rounded-lg flex items-center justify-center flex-shrink-0">
            <BrainLogo className="w-7 h-7 text-[#002919]" />
          </div>
          {!isCollapsed && <h1 className="text-xl font-bold text-primary">StreamSmarter</h1>}
        </div>
        {!isCollapsed && (
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 px-1 opacity-60">
            AI Growth Accelerator
          </p>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-[#1a1919] border border-[#2a2a2a] rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all z-50"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <nav className={cn("flex-1 space-y-2 mt-4", isCollapsed ? "px-2" : "px-4")}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 py-3 transition-colors duration-200 rounded-lg',
                isCollapsed ? 'justify-center px-2' : 'px-4',
                isActive
                  ? 'text-primary bg-[#201f1f] font-semibold'
                  : 'text-[#e6e1e1] hover:text-white hover:bg-[#201f1f]'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!isCollapsed && !isActiveSubscription && (
        <div className="p-6">
          <Link href="/app/billing">
            <Button className="w-full py-3 bg-gradient-to-br from-primary to-[#06b77f] text-[#002919] font-bold text-sm rounded-lg hover:opacity-90 active:scale-95 transition-all">
              Upgrade to Pro
            </Button>
          </Link>
        </div>
      )}
    </aside>
  );
}
