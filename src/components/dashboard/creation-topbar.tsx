'use client';

import Link from 'next/link';
import { Bell, Zap, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/referral-programs', label: 'Overview', active: false },
  { href: '/create-program', label: 'Live Ops', active: true },
  { href: '/integrations', label: 'Integrations', active: false },
];

export function CreationTopbar() {
  return (
    <header className="fixed top-0 right-0 left-64 h-16 z-40 bg-[#0e0e0e]/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-8 w-full h-full">
        {/* Tabs */}
        <div className="flex items-center gap-8">
          <nav className="flex items-center gap-6 text-sm font-medium">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'transition-colors',
                  tab.active
                    ? 'text-primary font-bold border-b-2 border-primary pb-1'
                    : 'text-gray-400 hover:text-primary'
                )}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground mr-4">
            <Bell className="w-5 h-5 cursor-pointer active:scale-95 hover:text-primary transition-colors" />
            <Zap className="w-5 h-5 cursor-pointer active:scale-95 hover:text-primary transition-colors" />
            <Moon className="w-5 h-5 cursor-pointer active:scale-95 hover:text-primary transition-colors" />
          </div>
          <Button className="bg-gradient-to-br from-primary to-[#06b77f] text-[#002919] px-4 py-1.5 rounded text-sm font-bold active:scale-95 transition-all">
            Deploy AI
          </Button>
        </div>
      </div>
    </header>
  );
}
