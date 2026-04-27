'use client';

import { MessageSquare, AlertTriangle, TrendingUp, Clock, Zap, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Clock,
  Zap,
};

interface StatCardProps {
  iconName: string;
  iconBgColor: string;
  iconColor: string;
  label: string;
  labelColor: string;
  title: string;
  value: string | number;
  footerIconName: string;
  footerIconColor: string;
  footerText: string;
}

export function StatCard({
  iconName,
  iconBgColor,
  iconColor,
  label,
  labelColor,
  title,
  value,
  footerIconName,
  footerIconColor,
  footerText,
}: StatCardProps) {
  const Icon = iconMap[iconName] || MessageSquare;
  const FooterIcon = iconMap[footerIconName] || TrendingUp;

  return (
    <div className="col-span-1 md:col-span-4 bg-[#1a1919] rounded-2xl p-6 hover:bg-[#201f1f] transition-all cursor-pointer group w-full">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform',
            iconBgColor
          )}
        >
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        <span className={cn('text-[10px] font-bold tracking-widest uppercase', labelColor)}>
          {label}
        </span>
      </div>
      <div className="mt-6">
        <p className="text-muted-foreground text-xs">{title}</p>
        <h4 className="text-3xl font-bold mt-1">{value}</h4>
      </div>
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
        <FooterIcon className={cn('w-4 h-4', footerIconColor)} />
        <span className="text-[10px] text-muted-foreground font-medium">{footerText}</span>
      </div>
    </div>
  );
}

interface AutopilotCardProps {
  title: string;
  description: string;
  iconName: string;
}

export function AutopilotCard({ title, description, iconName }: AutopilotCardProps) {
  const Icon = iconMap[iconName] || Zap;

  return (
    <div className="col-span-1 md:col-span-4 bg-[#131313] border border-white/5 rounded-2xl p-6 flex flex-col justify-center items-center text-center w-full">
      <div className="w-12 h-12 rounded-full bg-[#262626]/40 backdrop-blur-xl flex items-center justify-center text-[#06b77f] mb-4">
        <Icon className="w-5 h-5" />
      </div>
      <h5 className="font-bold text-sm">{title}</h5>
      <p className="text-muted-foreground text-[11px] mt-1">{description}</p>
    </div>
  );
}
