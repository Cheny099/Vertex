import { useState } from 'react';

import type { Order } from '@/api';

export type HistoryViewMode = 'system' | 'turboflow';
export type TfOrderStatus = 'all' | 'Pending' | 'Filled' | 'Cancelled' | 'Rejected';

export function useHistoryState() {
  const [searchInput, setSearchInput] = useState('');
  const [selectedPair, setSelectedPair] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState<HistoryViewMode>('system');
  const [selectedSystemAccount, setSelectedSystemAccount] = useState('all');
  const [selectedTfAccount, setSelectedTfAccount] = useState('');
  const [tfStatus, setTfStatus] = useState<TfOrderStatus>('all');
  const [systemPage, setSystemPage] = useState(1);
  const [systemPageSize, setSystemPageSize] = useState(20);
  const [tfPage, setTfPage] = useState(1);
  const [tfPageSize, setTfPageSize] = useState(20);
  const [debugOrder, setDebugOrder] = useState<Order | null>(null);

  return {
    searchInput,
    setSearchInput,
    selectedPair,
    setSelectedPair,
    selectedType,
    setSelectedType,
    viewMode,
    setViewMode,
    selectedSystemAccount,
    setSelectedSystemAccount,
    selectedTfAccount,
    setSelectedTfAccount,
    tfStatus,
    setTfStatus,
    systemPage,
    setSystemPage,
    systemPageSize,
    setSystemPageSize,
    tfPage,
    setTfPage,
    tfPageSize,
    setTfPageSize,
    debugOrder,
    setDebugOrder,
  };
}
