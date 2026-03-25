/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { Bell, Zap, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '#', label: 'Overview', active: true },
  { href: '#', label: 'Live Ops', active: false },
  { href: '#', label: 'Integrations', active: false },
];

export function CampaignDetailTopbar() {
  return (
    <header className="fixed top-0 right-0 left-64 h-16 z-40 bg-[#0e0e0e]/80 backdrop-blur-md flex items-center justify-between px-8">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => (
            <span
              key={tab.label}
              className={cn(
                'text-sm cursor-pointer transition-colors',
                tab.active
                  ? 'text-primary font-bold border-b-2 border-primary pb-1'
                  : 'text-gray-400 hover:text-primary'
              )}
            >
              {tab.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-gray-400">
          <Bell className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
          <Zap className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
          <Moon className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
        </div>
        <button className="px-4 py-1.5 rounded-full border border-primary/30 text-primary text-xs font-bold hover:bg-primary/10 transition-colors">
          Deploy AI
        </button>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-[#484847]/20">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=campaign"
            alt="User Profile"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
