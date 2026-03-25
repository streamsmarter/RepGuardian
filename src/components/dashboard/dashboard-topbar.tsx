'use client';

import { Bell, Settings } from 'lucide-react';

export function DashboardTopbar() {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 z-40 bg-[#0e0e0e]/80 backdrop-blur-xl flex justify-end items-center px-8 border-b border-[#1a1919] text-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-primary font-bold text-[11px] uppercase tracking-wider">
            Healthy Status
          </span>
        </div>

        <div className="flex items-center gap-4 text-gray-400">
          <button className="hover:text-primary transition-all">
            <Bell className="w-5 h-5" />
          </button>
          <button className="hover:text-primary transition-all">
            <Settings className="w-5 h-5" />
          </button>
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
