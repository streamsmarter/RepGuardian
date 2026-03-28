'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface GoogleRatingGaugeCardProps {
  rating?: number | null;
  isLoading?: boolean;
}

const clampRating = (rating: number) => Math.max(0, Math.min(5, rating));

export function GoogleRatingGaugeCard({ rating = 0, isLoading = false }: GoogleRatingGaugeCardProps) {
  const normalizedRating = clampRating(rating);
  const circumference = 2 * Math.PI * 44;
  const progress = normalizedRating / 5;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="col-span-3 flex flex-col justify-center border-r border-white/5 pr-6">
      <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
          <div className="w-[86%] h-[86%] rounded-full bg-primary/6 blur-2xl" />
          <div className="absolute w-full h-full border border-primary/15 rounded-full animate-[spin_20s_linear_infinite]" />
          <div className="absolute w-[82%] h-[82%] border border-primary/8 rounded-full animate-[spin_20s_linear_infinite_reverse]" />
        </div>

        {isLoading ? (
          <Skeleton className="h-full w-full rounded-full" />
        ) : (
          <>
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="#201f1f"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="#69f6b8"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  filter: 'drop-shadow(0 0 3px rgba(105, 246, 184, 0.25))',
                  transition: 'stroke-dashoffset 0.8s ease-out',
                }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[10px] text-[#adaaaa] uppercase font-bold tracking-[0.3em]">Google</p>
              <p className="text-5xl font-black text-white font-mono">{normalizedRating.toFixed(1)}</p>
              <p className="text-[10px] text-primary uppercase font-bold tracking-widest">
                Rating
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
