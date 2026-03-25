'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBrowserComponentClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RewardSearch } from '@/components/reward-search';
import { CreateRewardDialog } from '@/components/create-reward-dialog';
import { Loader2, Plus, Users } from 'lucide-react';

interface Reward {
  id: string;
  name: string;
  description: string | null;
  type: string;
  amount: number | null;
  status: string;
}

interface CreateReferralProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  bookingLink: string | null;
  onProgramCreated?: () => void;
}

export function CreateReferralProgramDialog({
  open,
  onOpenChange,
  companyId,
  bookingLink,
  onProgramCreated,
}: CreateReferralProgramDialogProps) {
  const supabase = createBrowserComponentClient();
  const queryClient = useQueryClient();

  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [referrerReward, setReferrerReward] = useState<Reward | null>(null);
  const [referredReward, setReferredReward] = useState<Reward | null>(null);
  const [showCreateRewardDialog, setShowCreateRewardDialog] = useState(false);

  const resetForm = () => {
    setProgramName('');
    setProgramDescription('');
    setReferrerReward(null);
    setReferredReward(null);
  };

  const createProgramMutation = useMutation({
    mutationFn: async () => {
      if (!referrerReward || !referredReward) {
        throw new Error('Both referrer and referred rewards are required');
      }

      const payload = [
        {
          campaign_type: 'referral',
          company_id: companyId,
          program_name: programName.trim(),
          program_description: programDescription.trim() || null,
          attribution_days: 30,
          referrer_reward_id: referrerReward.id,
          referred_reward_id: referredReward.id,
          qualification_rules: {
            referrer_rules: {
              minimum_lifetime_spend: null,
              must_be_existing_client: true,
            },
            referred_client_rules: {
              must_be_new_client: true,
              minimum_purchase_amount: null,
              minimum_completed_appointments: 1,
            },
          },
        },
      ];

      const response = await fetch('https://apex-art.app.n8n.cloud/webhook/refpush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create referral program');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Referral program created successfully');
      resetForm();
      onOpenChange(false);
      onProgramCreated?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create referral program');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!programName.trim()) {
      toast.error('Please enter a program name');
      return;
    }
    if (!referrerReward || !referredReward) {
      toast.error('Please select both referrer and referred rewards');
      return;
    }
    createProgramMutation.mutate();
  };

  const handleRewardCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['rewards', companyId] });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Referral Program</DialogTitle>
            <DialogDescription>
              Set up rewards for referrers and new clients
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="programName">Program Name *</Label>
              <Input
                id="programName"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="e.g., Summer Referral Program"
                disabled={createProgramMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="programDescription">Description</Label>
              <Input
                id="programDescription"
                value={programDescription}
                onChange={(e) => setProgramDescription(e.target.value)}
                placeholder="Optional description"
                disabled={createProgramMutation.isPending}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Rewards</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowCreateRewardDialog(true)}
                className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
              >
                <Plus className="mr-1 h-3 w-3" />
                New Reward
              </Button>
            </div>

            <RewardSearch
              companyId={companyId}
              label="Referrer Reward (for the client who refers) *"
              placeholder="Search rewards for referrer..."
              selectedReward={referrerReward}
              onSelect={setReferrerReward}
            />

            <RewardSearch
              companyId={companyId}
              label="Referred Reward (for the new client) *"
              placeholder="Search rewards for referred client..."
              selectedReward={referredReward}
              onSelect={setReferredReward}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createProgramMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createProgramMutation.isPending}>
                {createProgramMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Create Program
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CreateRewardDialog
        open={showCreateRewardDialog}
        onOpenChange={setShowCreateRewardDialog}
        companyId={companyId}
        onRewardCreated={handleRewardCreated}
      />
    </>
  );
}
