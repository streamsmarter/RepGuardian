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
  Shield,
  PlusCircle,
} from 'lucide-react';
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

export function CampaignDetailSidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col bg-[#0e0e0e] z-50">
      <div className="flex flex-col h-full py-8 gap-y-4">
        {/* Logo */}
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#06b77f] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#002919]" />
            </div>
            <div>
              <h1 className="text-primary font-black tracking-tighter text-xl">StreamSmarter</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Sentinel AI
              </p>
            </div>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname?.startsWith(item.href) ||
              (item.href === '/referral-programs' && pathname?.includes('referral-programs'));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-6 py-3 transition-all duration-300',
                  isActive
                    ? 'bg-[#1a1919] text-primary rounded-r-lg border-l-4 border-primary'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-[#201f1f]'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-semibold tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* New Program Button */}
        <div className="px-6 mb-4">
          <Link href="/create-program">
            <Button className="w-full py-2.5 rounded-lg bg-gradient-to-br from-primary to-[#06b77f] text-[#002919] font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <PlusCircle className="w-4 h-4" />
              New Program
            </Button>
          </Link>
        </div>

        {/* Bottom Section */}
        <div className="mt-auto border-t border-[#484847]/10 pt-4">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-6 py-3 text-gray-500 hover:text-gray-300 transition-all"
              >
                <Icon className="w-5 h-5" />
                <span className="font-semibold tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
