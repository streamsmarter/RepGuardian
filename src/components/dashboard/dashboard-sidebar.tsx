'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  MessageSquareText,
  ThumbsUp,
  UserPlus,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/command-center', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/inbox', label: 'Inbox', icon: Inbox },
  { href: '/app/reviews', label: 'Reviews', icon: MessageSquareText },
  { href: '/app/feedback', label: 'Feedback', icon: ThumbsUp },
  { href: '/app/referrals', label: 'Referrals', icon: UserPlus },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-screen w-64 fixed left-0 top-0 z-50 border-r border-[#1a1919] bg-[#0e0e0e] font-sans tracking-tight">
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-[#06b77f] rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#002919]" />
          </div>
          <h1 className="text-xl font-bold text-primary">RepGuardian</h1>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 px-1 opacity-60">
          AI Reputation Monitor
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 transition-colors duration-200',
                isActive
                  ? 'text-primary bg-[#201f1f] font-semibold border-r-2 border-primary'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#201f1f]'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <Button className="w-full py-3 bg-gradient-to-br from-primary to-[#06b77f] text-[#002919] font-bold text-sm rounded-lg hover:opacity-90 active:scale-95 transition-all">
          Upgrade to Pro
        </Button>
      </div>
    </aside>
  );
}
