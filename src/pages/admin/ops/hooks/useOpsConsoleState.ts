import { useState } from 'react';
import type { Order } from '@/api';

export type CloseParams = {
  account_id: string;
  symbol: string;
  pos_side: 'long' | 'short';
  qty: string;
  reason: string;
};

export type BatchRequeueParams = {
  statuses: string[];
  limit: number;
  reason: string;
};

export type ActionConfirmState = {
  open: boolean;
  title: string;
  desc: string;
  onConfirm: () => void;
};

export function useOpsConsoleState() {
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeParams, setCloseParams] = useState<CloseParams>({
    account_id: '',
    symbol: '',
    pos_side: 'long',
    qty: '',
    reason: 'Admin Force Close',
  });

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [symbolFilter, setSymbolFilter] = useState('');
  const [accountIdFilter, setAccountIdFilter] = useState('');
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);

  const [batchParams, setBatchParams] = useState<BatchRequeueParams>({
    statuses: ['FAILED', 'CANCELLED'],
    limit: 50,
    reason: 'Admin Batch Requeue',
  });

  const [searchSubId, setSearchSubId] = useState('');
  const [freezeReason, setFreezeReason] = useState('');
  const [targetSubId, setTargetSubId] = useState<number | null>(null);

  const [actionConfirm, setActionConfirm] = useState<ActionConfirmState>({
    open: false,
    title: '',
    desc: '',
    onConfirm: () => {},
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return {
    closeDialogOpen,
    setCloseDialogOpen,
    closeParams,
    setCloseParams,
    page,
    setPage,
    statusFilter,
    setStatusFilter,
    symbolFilter,
    setSymbolFilter,
    accountIdFilter,
    setAccountIdFilter,
    isAutoRefresh,
    setIsAutoRefresh,
    batchParams,
    setBatchParams,
    searchSubId,
    setSearchSubId,
    freezeReason,
    setFreezeReason,
    targetSubId,
    setTargetSubId,
    actionConfirm,
    setActionConfirm,
    selectedOrder,
    setSelectedOrder,
  };
}
