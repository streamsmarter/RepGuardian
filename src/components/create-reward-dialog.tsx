/* eslint-disable @typescript-eslint/no-explicit-any */
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface CreateRewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onRewardCreated?: (reward: Reward) => void;
}

interface Reward {
  id: string;
  name: string;
  description: string | null;
  type: string;
  amount: number | null;
  status: string;
  expires_in_days: number | null;
  company_id: string;
}

const REWARD_TYPES = [
  { value: 'discount_percentage', label: 'Discount (%)' },
  { value: 'discount_fixed', label: 'Discount ($)' },
  { value: 'free_service', label: 'Free Service' },
  { value: 'free_item', label: 'Free Item' },
  { value: 'points', label: 'Points' },
];


export function CreateRewardDialog({
  open,
  onOpenChange,
  companyId,
  onRewardCreated,
}: CreateRewardDialogProps) {
  const supabase = createBrowserComponentClient();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('discount_percentage');
  const [amount, setAmount] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [appliesToAllServices, setAppliesToAllServices] = useState(true);

  const resetForm = () => {
    setName('');
    setDescription('');
    setType('discount_percentage');
    setAmount('');
    setExpiresInDays('');
    setAppliesToAllServices(true);
  };

  const createRewardMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase
        .from('reward') as any)
        .insert({
          company_id: companyId,
          name: name.trim(),
          description: description.trim() || null,
          type,
          amount: amount ? parseFloat(amount) : null,
          status: 'active',
          expires_in_days: expiresInDays ? parseInt(expiresInDays, 10) : null,
          applies_to_all_services: appliesToAllServices,
          metadata: {},
        })
        .select()
        .single();

      if (error) throw error;
      return data as Reward;
    },
    onSuccess: (data) => {
      toast.success('Reward created successfully');
      queryClient.invalidateQueries({ queryKey: ['rewards', companyId] });
      onRewardCreated?.(data);
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create reward');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a reward name');
      return;
    }
    createRewardMutation.mutate();
  };

  const showAmountField = ['discount_percentage', 'discount_fixed', 'points'].includes(type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Reward</DialogTitle>
          <DialogDescription>
            Create a reward template that can be attached to referrals, campaigns, and more.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 10% Off Next Visit"
              disabled={createRewardMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              disabled={createRewardMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select value={type} onValueChange={setType} disabled={createRewardMutation.isPending}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REWARD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showAmountField && (
            <div className="space-y-2">
              <Label htmlFor="amount">
                {type === 'discount_percentage' ? 'Percentage' : type === 'points' ? 'Points' : 'Amount ($)'}
              </Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step={type === 'discount_percentage' ? '1' : '0.01'}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={type === 'discount_percentage' ? 'e.g., 10' : 'e.g., 25.00'}
                disabled={createRewardMutation.isPending}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="expiresInDays">Expires In (days)</Label>
            <Input
              id="expiresInDays"
              type="number"
              min="0"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              placeholder="Optional"
              disabled={createRewardMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="appliesToAllServices" className="cursor-pointer">
              Applies to all services
            </Label>
            <Switch
              id="appliesToAllServices"
              checked={appliesToAllServices}
              onCheckedChange={setAppliesToAllServices}
              disabled={createRewardMutation.isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createRewardMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createRewardMutation.isPending}>
              {createRewardMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Reward'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
