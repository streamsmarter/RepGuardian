"use client"

import Image from 'next/image';

export function DashboardHeader() {
  return (
    <div className="relative overflow-hidden rounded-3xl mt-2">
      <Image
        src="/hero_bg.svg"
        alt="Dashboard background"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/0" />
      <div className="relative z-10 px-6 py-[72px]">
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-white/80">
          Overview of your business performance and recent activity.
        </p>
      </div>
    </div>
  );
}
