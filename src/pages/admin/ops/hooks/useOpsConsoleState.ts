import { useState } from 'react';
import type { Order } from '@/api';

export type CloseParams = {
  account_id: string;
  symbol: string;
  pos_side: 'long' | 'short';
  qty: string;
  reason: string;
};

/** The value this card has always used; also the fallback when the field is left empty. */
export const DEFAULT_REQUEUE_LIMIT = 50;

export type BatchRequeueParams = {
  statuses: string[];
  /** null while the field is empty; the request then omits it and the backend default applies. */
  limit: number | null;
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
  const [statusFilter, setStatusFilterRaw] = useState<string>('all');
  const [symbolFilter, setSymbolFilterRaw] = useState('');
  const [accountIdFilter, setAccountIdFilterRaw] = useState('');
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);

  // The orders query is keyed by page as well as by the filters, so a filter change while on a
  // later page asks for an offset the filtered result set does not have and the table renders an
  // empty state. Resetting here covers every caller, rather than relying on each one to remember.
  const setStatusFilter: typeof setStatusFilterRaw = (value) => {
    setStatusFilterRaw(value);
    setPage(1);
  };
  const setSymbolFilter: typeof setSymbolFilterRaw = (value) => {
    setSymbolFilterRaw(value);
    setPage(1);
  };
  const setAccountIdFilter: typeof setAccountIdFilterRaw = (value) => {
    setAccountIdFilterRaw(value);
    setPage(1);
  };

  const [batchParams, setBatchParams] = useState<BatchRequeueParams>({
    statuses: ['FAILED', 'CANCELLED'],
    limit: DEFAULT_REQUEUE_LIMIT,
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
