/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { Bell, Settings } from 'lucide-react';

const navLinks = [
  { href: '/campaigns', label: 'Campaigns' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/reputation', label: 'Reputation' },
  { href: '/automation', label: 'Automation' },
];

export function WizardTopbar() {
  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-[#0e0e0e]">
      <div className="text-xl font-bold tracking-tighter text-primary">Sentinel AI</div>

      <div className="hidden md:flex items-center space-x-8">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-gray-400 hover:text-primary transition-colors text-sm"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center space-x-6">
        <button className="text-gray-400 hover:text-primary transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="text-gray-400 hover:text-primary transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#262626] ring-1 ring-[#484847]/30">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=wizard"
            alt="User avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </nav>
  );
}
