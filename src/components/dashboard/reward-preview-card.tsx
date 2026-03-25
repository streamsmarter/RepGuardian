'use client';

import { Wallet, Ticket } from 'lucide-react';

interface RewardPreviewProps {
  referrerAmount: string;
  referrerType: string;
  referredAmount: string;
  referredType: string;
}

export function RewardPreviewCard({
  referrerAmount = '$25.00',
  referrerType = 'Direct Credit',
  referredAmount = '15% OFF',
  referredType = 'Cart Discount',
}: RewardPreviewProps) {
  return (
    <div className="pt-8 border-t border-[#484847]/10">
      <h3 className="text-lg font-bold mb-4">Reward Preview</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* Referrer Reward */}
        <div className="bg-[#1a1919] p-6 rounded-xl border border-[#484847]/5">
          <p className="text-[10px] font-bold text-muted-foreground mb-2">REFERRER GETS</p>
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl">{referrerAmount}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{referrerType}</p>
        </div>

        {/* Referred Reward */}
        <div className="bg-[#1a1919] p-6 rounded-xl border border-[#484847]/5">
          <p className="text-[10px] font-bold text-muted-foreground mb-2">REFERRED GETS</p>
          <div className="flex items-center gap-3">
            <Ticket className="w-6 h-6 text-secondary" />
            <span className="font-bold text-xl">{referredAmount}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{referredType}</p>
        </div>
      </div>
    </div>
  );
}
