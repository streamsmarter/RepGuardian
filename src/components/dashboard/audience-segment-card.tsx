'use client';

import { useState } from 'react';
import { Clock, Banknote, RefreshCw, PlusCircle, ShieldCheck, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgramWizard } from '@/lib/program-wizard-context';

interface SegmentCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isActive?: boolean;
  onClick?: () => void;
}

function SegmentCard({ icon: Icon, title, description, isActive, onClick }: SegmentCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'p-5 rounded-lg flex flex-col justify-between group cursor-pointer transition-all',
        isActive
          ? 'bg-[#201f1f] border border-primary/20'
          : 'bg-[#131313] border border-[#484847]/10 hover:bg-[#201f1f]'
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            isActive
              ? 'bg-primary/10 text-primary'
              : 'bg-[#262626] text-muted-foreground group-hover:text-secondary'
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        {isActive ? (
          <span className="text-[11px] font-bold tracking-widest text-primary uppercase">
            Active
          </span>
        ) : (
          <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />
        )}
      </div>
      <div>
        <h4 className="font-bold text-sm mb-1">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

const segments = [
  { id: 'recent', icon: Clock, title: 'Recent Customers', description: 'Purchased in last 30 days' },
  { id: 'high-spenders', icon: Banknote, title: 'High Spenders', description: 'LTV above $1,500.00' },
  { id: 'repeat-buyers', icon: RefreshCw, title: 'Repeat Buyers', description: '3+ completed orders' },
];

export function AudienceSegmentGrid() {
  const { data, updateAudience } = useProgramWizard();
  const [activeSegments, setActiveSegments] = useState<string[]>(data.audience.segments.length > 0 ? data.audience.segments : ['recent']);

  const toggleSegment = (segmentId: string) => {
    const newSegments = activeSegments.includes(segmentId)
      ? activeSegments.filter(s => s !== segmentId)
      : [...activeSegments, segmentId];
    setActiveSegments(newSegments);
    updateAudience({ segments: newSegments });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {segments.map((segment) => (
        <SegmentCard
          key={segment.id}
          icon={segment.icon}
          title={segment.title}
          description={segment.description}
          isActive={activeSegments.includes(segment.id)}
          onClick={() => toggleSegment(segment.id)}
        />
      ))}
      <div className="p-5 rounded-lg border-2 border-dashed border-[#484847]/20 flex flex-col items-center justify-center group cursor-pointer hover:border-primary/40 transition-all text-muted-foreground hover:text-primary">
        <PlusCircle className="w-6 h-6 mb-2" />
        <span className="text-xs font-bold tracking-widest uppercase">Custom Rule</span>
      </div>
    </div>
  );
}

export function PositiveFeedbackToggle() {
  const { data, updateAudience } = useProgramWizard();
  const [isEnabled, setIsEnabled] = useState(data.audience.positiveFeedbackOnly);

  const handleToggle = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    updateAudience({ positiveFeedbackOnly: newValue });
  };

  return (
    <section className="p-8 rounded-xl bg-[#1a1919] border border-[#484847]/15 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />
      <div className="flex items-center justify-between gap-6 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Positive Feedback Only</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Automated safety net: only invite customers who have previously provided high-sentiment
            feedback or 4+ star ratings.
          </p>
        </div>
        <button 
          onClick={handleToggle}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            isEnabled ? "bg-primary shadow-[0_0_15px_rgba(105,246,184,0.2)]" : "bg-[#484847]"
          )}
        >
          <span className={cn(
            "inline-block h-4 w-4 transform rounded-full transition",
            isEnabled ? "translate-x-6 bg-[#002919]" : "translate-x-1 bg-muted-foreground"
          )} />
        </button>
      </div>
    </section>
  );
}
