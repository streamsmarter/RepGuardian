'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type ProgramType = 'referral' | 'reactivation' | 'upsells' | 'promo' | 'loyalty';

export interface ProgramIdentity {
  name: string;
  description: string;
  internalLabel: string;
  programType: ProgramType;
}

export type RewardType = 'cash' | 'credit' | 'percentage' | 'free_service';

export interface ProgramRewards {
  referrerRewardType: RewardType;
  referrerAmount: number;
  referrerMinSpend: number;
  referredRewardType: RewardType;
  referredAmount: number;
  referredMinSpend: number;
}

export interface ProgramAudience {
  segments: string[];
  positiveFeedbackOnly: boolean;
}

export interface ProgramWizardData {
  identity: ProgramIdentity;
  rewards: ProgramRewards;
  audience: ProgramAudience;
  clientCount: number;
}

interface ProgramWizardContextType {
  data: ProgramWizardData;
  updateIdentity: (identity: Partial<ProgramIdentity>) => void;
  updateRewards: (rewards: Partial<ProgramRewards>) => void;
  updateAudience: (audience: Partial<ProgramAudience>) => void;
  setClientCount: (count: number) => void;
  resetWizard: () => void;
  isStepValid: (step: number) => boolean;
}

const defaultData: ProgramWizardData = {
  identity: {
    name: '',
    description: '',
    internalLabel: '',
    programType: 'referral',
  },
  rewards: {
    referrerRewardType: 'cash',
    referrerAmount: 25,
    referrerMinSpend: 100,
    referredRewardType: 'percentage',
    referredAmount: 15,
    referredMinSpend: 0,
  },
  audience: {
    segments: [],
    positiveFeedbackOnly: true,
  },
  clientCount: 0,
};

const ProgramWizardContext = createContext<ProgramWizardContextType | undefined>(undefined);

export function ProgramWizardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProgramWizardData>(defaultData);

  const updateIdentity = (identity: Partial<ProgramIdentity>) => {
    setData((prev) => ({
      ...prev,
      identity: { ...prev.identity, ...identity },
    }));
  };

  const updateRewards = (rewards: Partial<ProgramRewards>) => {
    setData((prev) => ({
      ...prev,
      rewards: { ...prev.rewards, ...rewards },
    }));
  };

  const updateAudience = (audience: Partial<ProgramAudience>) => {
    setData((prev) => ({
      ...prev,
      audience: { ...prev.audience, ...audience },
    }));
  };

  const setClientCount = (count: number) => {
    setData((prev) => ({ ...prev, clientCount: count }));
  };

  const resetWizard = () => {
    setData(defaultData);
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return data.identity.name.trim().length > 0 && data.identity.programType === 'referral';
      case 2:
        return data.rewards.referrerAmount > 0 && data.rewards.referredAmount > 0;
      case 3:
        return true;
      case 4:
        return isStepValid(1) && isStepValid(2) && isStepValid(3);
      default:
        return false;
    }
  };

  return (
    <ProgramWizardContext.Provider
      value={{
        data,
        updateIdentity,
        updateRewards,
        updateAudience,
        setClientCount,
        resetWizard,
        isStepValid,
      }}
    >
      {children}
    </ProgramWizardContext.Provider>
  );
}

export function useProgramWizard() {
  const context = useContext(ProgramWizardContext);
  if (context === undefined) {
    throw new Error('useProgramWizard must be used within a ProgramWizardProvider');
  }
  return context;
}
