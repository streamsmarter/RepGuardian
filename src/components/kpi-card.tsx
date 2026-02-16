import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number | string;
  change?: string;
  changeType?: 'positive' | 'negative';
  icon?: LucideIcon;
  color?: string;
}

export function KpiCard({ 
  title, 
  value, 
  change, 
  changeType = 'positive',
  icon: Icon, 
  color = '#3ecf8e' 
}: KpiCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-6">
      {Icon && (
        <div 
          className="flex h-12 w-12 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {change && (
            <span 
              className="text-sm"
              style={{ color: changeType === 'positive' ? '#10b981' : '#f43f5e' }}
            >
              {changeType === 'positive' ? '↑' : '↓'}{change}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
