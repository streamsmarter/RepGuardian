'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Award,
  Users,
  Settings,
  HelpCircle,
  UserCircle,
  Plus,
} from 'lucide-react';
import { BrainLogo } from '@/components/brain-logo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/command-center', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/referral-programs', label: 'Programs', icon: Award },
  { href: '/audience', label: 'Audience', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const bottomNavItems = [
  { href: '/support', label: 'Support', icon: HelpCircle },
  { href: '/account', label: 'Account', icon: UserCircle },
];

export function ReferralSidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col bg-[#0e0e0e] z-50 font-sans font-semibold tracking-tight">
      <div className="flex flex-col h-full py-8 gap-y-4">
        {/* Logo */}
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <BrainLogo className="w-8 h-8 text-[#002919]" />
          </div>
          <div className="flex flex-col">
            <span className="text-primary font-black tracking-tighter text-xl">StreamSmarter</span>
            <span className="text-xs text-muted-foreground font-medium tracking-widest uppercase">
              Sentinel AI
            </span>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 transition-all duration-300',
                  isActive
                    ? 'bg-[#1a1919] text-primary rounded-r-lg border-l-4 border-primary'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-[#201f1f]'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto px-4 pt-4 border-t border-white/5 space-y-1">
          <Button className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-xl bg-gradient-to-br from-primary to-[#06b77f] text-[#002919] font-bold text-sm hover:opacity-90 active:scale-95 transition-all">
            <Plus className="w-4 h-4" />
            New Program
          </Button>

          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-300 hover:bg-[#201f1f] transition-all duration-300"
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
