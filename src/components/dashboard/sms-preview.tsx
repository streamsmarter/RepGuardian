'use client';

import { Pencil, User } from 'lucide-react';

export function SMSPreview() {
  return (
    <section className="bg-[#262626]/40 backdrop-blur-xl p-8 rounded-2xl border border-[#484847]/20 flex flex-col items-center">
      <div className="w-full mb-6 flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase tracking-wider text-secondary">
          Live SMS Preview
        </h3>
        <Pencil className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
      </div>

      {/* Phone Shell */}
      <div className="w-[280px] h-[480px] bg-black rounded-[3rem] border-[6px] border-[#2c2c2c] relative overflow-hidden shadow-2xl">
        {/* Screen Header */}
        <div className="pt-8 px-4 flex justify-center border-b border-[#262626] pb-2 bg-[#050505]">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#262626] mb-1 flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground">Sentinel AI Business</span>
          </div>
        </div>

        {/* Messages Container */}
        <div className="p-4 space-y-4">
          <div className="flex flex-col">
            <span className="text-[8px] text-muted-foreground/50 self-center mb-2">
              Today 10:42 AM
            </span>
            <div className="bg-[#262626] p-3 rounded-2xl rounded-tl-sm max-w-[85%]">
              <p className="text-xs leading-relaxed text-foreground">
                Hi {'{customer_name}'}! We saw your recent order. Because you're a top customer,
                we'd love for you to join our referral program. Refer a friend and you both get 20%
                off! Link: sentnl.ai/referral
              </p>
            </div>
          </div>
        </div>

        {/* Message Input Mock */}
        <div className="absolute bottom-4 left-0 w-full px-4">
          <div className="bg-[#1a1919] h-8 rounded-full flex items-center px-4">
            <div className="text-[10px] text-muted-foreground">iMessage</div>
          </div>
        </div>
      </div>

      {/* Meta Data */}
      <div className="mt-8 w-full grid grid-cols-2 gap-4">
        <div className="p-3 bg-[#131313] rounded-lg border border-[#484847]/5">
          <span className="text-[10px] text-muted-foreground uppercase block mb-1">
            Character Count
          </span>
          <span className="font-bold text-sm">154 / 160</span>
        </div>
        <div className="p-3 bg-[#131313] rounded-lg border border-[#484847]/5">
          <span className="text-[10px] text-muted-foreground uppercase block mb-1">
            Estimated Cost
          </span>
          <span className="font-bold text-sm text-primary">$0.02 / msg</span>
        </div>
      </div>
    </section>
  );
}
