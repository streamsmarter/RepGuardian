'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, Zap, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/referral-programs', label: 'Overview' },
  { href: '/referral-programs/live-ops', label: 'Live Ops', active: true },
  { href: '/referral-programs/integrations', label: 'Integrations' },
];

export function ReferralTopbar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 right-0 left-64 h-16 z-40 bg-[#0e0e0e]/80 backdrop-blur-md text-sm font-medium">
      <div className="flex items-center justify-between px-8 w-full h-full">
        {/* Tabs */}
        <div className="flex items-center gap-8">
          {tabs.map((tab) => {
            const isActive = tab.active || pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'transition-colors',
                  isActive
                    ? 'text-primary font-bold border-b-2 border-primary pb-1'
                    : 'text-gray-400 hover:text-primary'
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-6">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Scan protocols..."
              className="bg-black border-none rounded-full pl-10 pr-4 py-1.5 text-xs w-48 focus-visible:ring-1 focus-visible:ring-primary/50 placeholder:text-[#777575] h-auto"
            />
          </div>

          {/* Icons */}
          <div className="flex items-center gap-4 text-muted-foreground">
            <Bell className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
            <Zap className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
            <Moon className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
          </div>

          {/* User Avatar */}
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <div className="w-8 h-8 rounded-full bg-[#293ca0] flex items-center justify-center overflow-hidden">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=sentinel"
                alt="User Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
