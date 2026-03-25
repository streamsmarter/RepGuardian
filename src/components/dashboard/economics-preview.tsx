'use client';

import { TrendingDown, CheckCircle, ShieldCheck, Info } from 'lucide-react';

export function EconomicsPreview() {
  return (
    <div className="bg-[#201f1f] p-6 rounded-lg border border-[#484847]/10">
      <h4 className="font-bold text-sm mb-6 border-b border-[#484847]/10 pb-4">
        ECONOMICS PREVIEW
      </h4>

      <div className="space-y-6">
        {/* Cost Per Acquisition */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-muted-foreground text-[10px] tracking-widest uppercase">
              Cost Per Acquisition
            </p>
            <p className="text-2xl font-bold">$32.50</p>
          </div>
          <div className="text-primary text-xs flex items-center gap-1">
            <TrendingDown className="w-4 h-4" />
            12% vs. Avg
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
          <div className="h-full bg-primary w-2/3" />
        </div>

        {/* Checklist */}
        <ul className="space-y-4 pt-4">
          <li className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs font-bold">Incentive Alignment</p>
              <p className="text-[11px] text-muted-foreground">
                Both parties receive high-value tokens.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-secondary flex-shrink-0" />
            <div>
              <p className="text-xs font-bold">Fraud Protection</p>
              <p className="text-[11px] text-muted-foreground">
                Min. spend threshold active ($100).
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

export function SimulatedROI() {
  return (
    <div className="bg-[#201f1f] p-6 rounded-lg border border-[#484847]/10">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-sm">SIMULATED ROI</h4>
        <Info className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Chart */}
      <div className="relative h-24 mb-4">
        <svg className="w-full h-full opacity-60" viewBox="0 0 100 40">
          <defs>
            <linearGradient id="gradient-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#69f6b8" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            d="M0 35 Q 25 35, 40 20 T 80 10 T 100 5"
            fill="none"
            stroke="#69f6b8"
            strokeWidth="1.5"
          />
          <path
            d="M0 40 L0 35 Q 25 35, 40 20 T 80 10 T 100 5 L 100 40 Z"
            fill="url(#gradient-area)"
            opacity="0.1"
          />
        </svg>
      </div>

      <div className="text-center">
        <p className="text-3xl font-extrabold text-primary tracking-tighter">4.2x</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
          Est. Return on Reward Spend
        </p>
      </div>
    </div>
  );
}
