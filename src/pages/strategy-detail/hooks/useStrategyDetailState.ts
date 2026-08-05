import { useState } from 'react';

import type { LegalDocKey, PeriodKey, Subscription } from '@/api';
import type { UiMode } from '../utils';

export interface StrategySubscriptionDraft {
  accountId: string;
  positionMode: UiMode;
  // null is "the field is empty or mid-edit", which a number input needs to be able to express -
  // see #30. Every consumer already reads it as `Number(positionValue || fallback)`.
  positionValue: number | null;
  positionPct: number;
  leverage: number;
}

export function useStrategyDetailState() {
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [activePeriod, setActivePeriod] = useState<PeriodKey>('all');
  const [isSecretOpen, setIsSecretOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  const [newSub, setNewSub] = useState<StrategySubscriptionDraft>({
    accountId: '',
    positionMode: 'fixed',
    positionValue: 100,
    positionPct: 0.1,
    leverage: 50,
  });

  const [legalError, setLegalError] = useState<{ docKey: LegalDocKey; version: string } | null>(null);

  return {
    isAddSubOpen,
    setIsAddSubOpen,
    activePeriod,
    setActivePeriod,
    isSecretOpen,
    setIsSecretOpen,
    isInviteModalOpen,
    setIsInviteModalOpen,
    editingSub,
    setEditingSub,
    newSub,
    setNewSub,
    legalError,
    setLegalError,
  };
}
