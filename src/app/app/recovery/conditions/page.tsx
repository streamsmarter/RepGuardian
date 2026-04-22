'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ReengagementConditionsPage() {
  const router = useRouter();
  const supabase = createBrowserComponentClient();
  const [inactivityDays, setInactivityDays] = useState(30);
  const [message, setMessage] = useState('');
  const [companyName, setCompanyName] = useState('Your Business');
  const [isSaving, setIsSaving] = useState(false);

  const maxCharacters = 160;
  const characterCount = message.length;

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;

        const { data: appUser } = await supabase
          .from('app_user')
          .select('company_id')
          .eq('user_id', user.id)
          .single() as { data: { company_id: string } | null };

        if (appUser?.company_id) {
          const { data: company } = await supabase
            .from('company')
            .select('name, reengagement_metadata')
            .eq('id', appUser.company_id)
            .single() as { data: { name: string | null; reengagement_metadata: unknown } | null };

          if (company?.name) {
            setCompanyName(company.name);
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const metadata = company?.reengagement_metadata as any;
          if (metadata) {
            if (metadata.preferred_cadence_days) setInactivityDays(metadata.preferred_cadence_days);
            if (metadata.message) setMessage(metadata.message);
          }
        }
      } catch {
        // Ignore errors
      }
    };
    loadSettings();
  }, [supabase]);

  const insertVariable = (variable: string) => {
    const insertion = `{${variable}}`;
    if (characterCount + insertion.length <= maxCharacters) {
      setMessage(prev => prev + insertion);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    console.log('Save clicked - starting save process');
    console.log('Message:', message);
    console.log('Inactivity Days:', inactivityDays);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User:', user?.id);
      if (!user?.id) throw new Error('Not authenticated');

      const { data: appUser } = await supabase
        .from('app_user')
        .select('company_id')
        .eq('user_id', user.id)
        .single() as { data: { company_id: string } | null };

      console.log('App User:', appUser);
      if (!appUser?.company_id) throw new Error('No company found');

      console.log('Updating reengagement metadata via RPC');
      
      const { error } = await (supabase.rpc as any)('update_reengagement_metadata', {
        p_metadata: {
          message: message,
          preferred_cadence_days: inactivityDays,
        },
      });

      console.log('RPC result - error:', error);

      if (error) {
        console.error('Update error:', error);
        throw new Error(error.message || 'Failed to update settings');
      }

      toast.success('Settings saved successfully');
      router.push('/app/recovery');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const previewMessage = message
    .replace('{name}', 'Alex')
    .replace('{booking_link}', 'book.example.com/yourshop');

  return (
    <div className="px-8 py-8 min-h-screen" style={{
      backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(105, 246, 184, 0.05) 1px, transparent 0)',
      backgroundSize: '24px 24px',
    }}>
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Active</span>
        </div>
        <h1 className="font-black text-4xl tracking-tight text-white mb-2">Win-Back Settings</h1>
        <p className="text-muted-foreground">
          Automatically bring back inactive customers. Set when to reach out and what to say.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column - Form */}
        <div className="col-span-7 space-y-8">
          {/* Inactivity Period Card */}
          <div className="bg-[#1a1919] rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-white">When to Reach Out</h2>
              </div>
            </div>
            
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
              Days Since Last Visit
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={inactivityDays}
                onChange={(e) => setInactivityDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 bg-[#0e0e0e] border border-white/10 rounded-lg px-4 py-3 text-white text-lg font-mono focus:outline-none focus:border-primary/50 transition-colors"
                min={1}
              />
              <span className="px-4 py-3 bg-[#262626] rounded-lg text-muted-foreground font-bold text-sm uppercase tracking-wider">
                Days
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              We&apos;ll send a message after a customer hasn&apos;t visited for this many days.
            </p>
          </div>

          {/* Message Card */}
          <div className="bg-[#1a1919] rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-white">Your Message</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { insertVariable('name'); (e.target as HTMLButtonElement).blur(); }}
                  className="px-3 py-1.5 bg-[#262626] hover:bg-primary/20 hover:text-primary border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider text-white transition-colors"
                >
                  + Customer Name
                </button>
                <button
                  type="button"
                  onClick={(e) => { insertVariable('booking_link'); (e.target as HTMLButtonElement).blur(); }}
                  className="px-3 py-1.5 bg-[#262626] hover:bg-primary/20 hover:text-primary border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider text-white transition-colors"
                >
                  + Booking Link
                </button>
              </div>
            </div>

            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
              Message Text
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, maxCharacters))}
              placeholder="Hi {name}, we miss you! Come book your next visit: {booking_link}"
              className="w-full h-40 bg-[#0e0e0e] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none"
            />
            <div className="flex items-center justify-end mt-3">
              <span className="text-xs font-bold">
                <span className={`font-mono ${characterCount > maxCharacters * 0.9 ? 'text-secondary' : 'text-primary'}`}>
                  {characterCount}
                </span>
                <span className="text-muted-foreground"> / {maxCharacters} characters</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/app/recovery')}
              className="px-6 py-3 text-muted-foreground hover:text-white font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !message.trim()}
              className="px-8 py-3 bg-gradient-to-br from-primary to-[#06b77f] text-[#002919] font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(105,246,184,0.2)]"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>

        {/* Right Column - Phone Preview */}
        <div className="col-span-5">
          <div className="sticky top-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center mb-4">
              Message Preview
            </p>
            
            {/* iPhone Frame - Dark Mode */}
            <div className="mx-auto w-[340px] bg-[#1c1c1e] rounded-[3.5rem] p-3 border-[3px] border-[#3a3a3c] shadow-2xl relative">
              
              <div className="bg-[#000000] rounded-[3rem] overflow-hidden">
                {/* iOS Status Bar */}
                <div className="flex items-center justify-between px-8 pt-4 pb-2 text-white text-sm font-semibold">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3C7.46 3 3.34 4.78.29 7.67c-.18.18-.29.43-.29.71 0 .28.11.53.29.71l2.48 2.48c.18.18.43.29.71.29.27 0 .52-.11.7-.28.79-.74 1.69-1.36 2.66-1.85.33-.16.56-.5.56-.9V6.5c1.82-.54 3.76-.54 5.58 0v2.33c0 .4.23.74.56.9.98.49 1.87 1.12 2.66 1.85.18.18.43.28.7.28.28 0 .53-.11.71-.29l2.48-2.48c.18-.18.29-.43.29-.71 0-.28-.11-.53-.29-.71C20.66 4.78 16.54 3 12 3z"/>
                    </svg>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 22h20V2z"/>
                    </svg>
                    <svg className="w-6 h-3" viewBox="0 0 28 14" fill="currentColor">
                      <rect x="0" y="0" width="25" height="14" rx="3" stroke="currentColor" strokeWidth="1" fill="none"/>
                      <rect x="2" y="2" width="19" height="10" rx="1.5" fill="currentColor"/>
                      <rect x="26" y="4" width="2" height="6" rx="1" fill="currentColor"/>
                    </svg>
                  </div>
                </div>

                {/* iOS Messages App Header */}
                <div className="px-4 pb-2 border-b border-[#38383a]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-[#06b77f] flex items-center justify-center text-white font-bold text-sm">
                      {companyName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{companyName}</p>
                      <p className="text-xs text-[#8e8e93]">Text Message</p>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="px-4 py-6 min-h-[380px] bg-[#000000]">
                  {/* Incoming Message Bubble */}
                  <div className="flex justify-start mb-2">
                    <div className="max-w-[85%] bg-[#262628] rounded-2xl rounded-bl-md px-4 py-2.5 overflow-hidden">
                      <p className="text-[15px] text-white leading-snug break-words whitespace-pre-wrap">
                        {previewMessage || `Hi Alex, we miss you! Come book your next visit: book.example.com/yourshop`}
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#8e8e93] ml-1">Just now</p>
                </div>

                {/* iOS Message Input */}
                <div className="px-3 pb-8 pt-2 bg-[#000000] border-t border-[#38383a]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#1c1c1e] flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#8e8e93]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="flex-1 bg-[#1c1c1e] rounded-full px-4 py-2 border border-[#38383a]">
                      <span className="text-[#8e8e93] text-sm">Text Message</span>
                    </div>
                  </div>
                </div>

                {/* Home Indicator */}
                <div className="flex justify-center pb-2 bg-[#000000]">
                  <div className="w-32 h-1 bg-white/30 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
