/**
 * @anchor-id HISTORY_PAGE
 * @module-type page
 * @disposable false
 * @mock-data trades and stats are temporary mocks until API data is fully connected.
 */

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownRight,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  MoreVertical,
  RotateCcw,
  Ban,
  Bug,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { orderApi, turboflowApi, accountApi, translateBackendErrorMessage, type Order } from '@/api';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';

const types = ['all', 'buy', 'sell'];
const pageSizeOptions = [5, 10, 20, 50];
const tfOrderStatuses = ['all', 'Pending', 'Filled', 'Cancelled', 'Rejected'] as const;

const HistoryPage = () => {
  const { t, i18n } = useTranslation(['history', 'common']); // Add namespaces

  // State
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPair, setSelectedPair] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState<'system' | 'turboflow'>('system');
  const [selectedSystemAccount, setSelectedSystemAccount] = useState('all');
  const [selectedTfAccount, setSelectedTfAccount] = useState('');
  const [tfStatus, setTfStatus] = useState<(typeof tfOrderStatuses)[number]>('all');
  const [systemPage, setSystemPage] = useState(1);
  const [systemPageSize, setSystemPageSize] = useState(20);
  const [tfPage, setTfPage] = useState(1);
  const [tfPageSize, setTfPageSize] = useState(20);
  const [debugOrder, setDebugOrder] = useState<any>(null);

  const queryClient = useQueryClient();

  const getToastErrorMessage = (error: any) => {
    const rawMessage = typeof error?.message === 'string' ? error.message : t('common:unknown_error');
    return translateBackendErrorMessage(rawMessage);
  };

  const getFailureCode = (trade: Order): string | undefined => {
    return trade.failure_code || trade.public_error?.code;
  };

  const getMappedFailureMessage = (trade: Order): string | undefined => {
    const code = getFailureCode(trade);
    if (!code) return undefined;
    const key = `history:table.failure_map.${code}`;
    return i18n.exists(key) ? t(key) : undefined;
  };

  const getMappedFailureAction = (trade: Order): string | undefined => {
    const code = getFailureCode(trade);
    if (!code) return undefined;
    const key = `history:table.failure_action_map.${code}`;
    return i18n.exists(key) ? t(key) : undefined;
  };

  // Queries
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountApi.list,
  });

  const turboflowAccounts = useMemo(
    () => accounts.filter((acc) => acc.exchange === 'turboflow'),
    [accounts]
  );

  useEffect(() => {
    if (viewMode !== 'turboflow') return;
    if (turboflowAccounts.length === 0) {
      if (selectedTfAccount !== '') setSelectedTfAccount('');
      return;
    }
    const exists = turboflowAccounts.some((acc) => acc.id.toString() === selectedTfAccount);
    if (!selectedTfAccount || !exists) {
      setSelectedTfAccount(turboflowAccounts[0].id.toString());
      setTfPage(1);
    }
  }, [viewMode, turboflowAccounts, selectedTfAccount]);

  const {
    data: systemOrdersData,
    isLoading: isSystemLoading,
    isError: isSystemError,
    error: systemError,
  } = useQuery({
    queryKey: ['orders', 'history', selectedSystemAccount, systemPage, systemPageSize],
    queryFn: () =>
      orderApi.getHistory({
        include_pnl: true,
        page_num: systemPage,
        page_size: systemPageSize,
        account_id: selectedSystemAccount === 'all' ? undefined : Number(selectedSystemAccount),
      }),
    placeholderData: keepPreviousData,
    enabled: viewMode === 'system',
  });

  // TurboFlow Orders
  const {
    data: tfOrdersData,
    isLoading: isTfLoading,
    isError: isTfError,
    error: tfError,
  } = useQuery({
    queryKey: ['turboflow-orders', selectedTfAccount, tfStatus, tfPage, tfPageSize],
    queryFn: async () => {
      if (!selectedTfAccount) {
        return { data: [], count: 0, page_count: 0, page_num: tfPage, page_size: tfPageSize };
      }
      return turboflowApi.getOrders({
        account_id: Number(selectedTfAccount),
        status: tfStatus === 'all' ? undefined : tfStatus,
        page_num: tfPage,
        page_size: tfPageSize,
      });
    },
    placeholderData: keepPreviousData,
    enabled: viewMode === 'turboflow' && !!selectedTfAccount,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchTerm(searchInput);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (viewMode !== 'system') return;
    if (!systemOrdersData?.has_more) return;

    const nextPage = systemPage + 1;
    queryClient.prefetchQuery({
      queryKey: ['orders', 'history', selectedSystemAccount, nextPage, systemPageSize],
      queryFn: () =>
        orderApi.getHistory({
          include_pnl: true,
          page_num: nextPage,
          page_size: systemPageSize,
          account_id: selectedSystemAccount === 'all' ? undefined : Number(selectedSystemAccount),
        }),
    });
  }, [queryClient, viewMode, systemOrdersData?.has_more, systemPage, systemPageSize, selectedSystemAccount]);

  useEffect(() => {
    if (viewMode !== 'turboflow') return;
    if (!selectedTfAccount) return;
    const pageCount = tfOrdersData?.page_count ?? 0;
    if (pageCount === 0 || tfPage >= pageCount) return;

    const nextPage = tfPage + 1;
    queryClient.prefetchQuery({
      queryKey: ['turboflow-orders', selectedTfAccount, tfStatus, nextPage, tfPageSize],
      queryFn: () =>
        turboflowApi.getOrders({
          account_id: Number(selectedTfAccount),
          status: tfStatus === 'all' ? undefined : tfStatus,
          page_num: nextPage,
          page_size: tfPageSize,
        }),
    });
  }, [queryClient, viewMode, selectedTfAccount, tfOrdersData?.page_count, tfPage, tfPageSize, tfStatus]);

  // Mutations
  const cancelMutation = useMutation({
    mutationFn: orderApi.cancel,
    onSuccess: () => {
      toast.success(t('history:actions.cancel_success'));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => toast.error(getToastErrorMessage(error))
  });

  const retryMutation = useMutation({
    mutationFn: orderApi.retry,
    onSuccess: () => {
      toast.success(t('history:actions.retry_success'));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => toast.error(getToastErrorMessage(error))
  });

  const debugMutation = useMutation({
    mutationFn: orderApi.debug,
    onSuccess: (data) => setDebugOrder(data),
    onError: (error: any) => toast.error(getToastErrorMessage(error))
  });

  // Reorder is complex, just placeholder for now or reuse retry
  const reorderMutation = { isPending: false, mutate: (order: any) => { console.log('Reorder', order); } };


  // Normalize Trades
  const allTrades = useMemo<Order[]>(() => {
    if (viewMode === 'system') {
      return (systemOrdersData?.items || []) as Order[];
    } else {
      const list = tfOrdersData?.data || [];
      // Map TF data to UI format (compatible with Order interface)
      return list.map((item: any) => {
        const parseNum = (val: any) => {
          if (val === undefined || val === null || val === '' || val === '-' || val === '--') return undefined;
          const n = Number(val);
          return Number.isNaN(n) ? undefined : n;
        };

        const sideMap = () => {
          if (item.side) return item.side;
          if (item.direction) return item.direction === 'long' ? 'buy' : 'sell';
          if (item.order_way !== undefined) return item.order_way === 1 ? 'buy' : 'sell';
          return 'buy';
        };

        return {
          ...item,
          id: item.id || item.order_id,
          created_at: item.created_at || item.open_time,
          updated_at: item.updated_at || item.open_time,
          symbol: item.symbol || item.pair || item.pair_id || '--',
          side: sideMap(),
          account_id: Number(selectedTfAccount || item.account_id || 0),
          price: parseNum(item.deal_price ?? item.price ?? item.avg_price),
          quantity: parseNum(item.done_vol ?? item.quantity ?? item.amount ?? item.done_amount),
          realized_pnl: parseNum(item.done_pnl ?? item.realized_pnl ?? item.profit),
          status: item.order_status || item.status || 'UNKNOWN',
        };
      }) as Order[];
    }
  }, [viewMode, systemOrdersData, tfOrdersData, selectedTfAccount]);

  const isLoading = viewMode === 'system' ? isSystemLoading : isTfLoading;
  const isError = viewMode === 'system' ? isSystemError : isTfError;
  const queryError = viewMode === 'system' ? systemError : tfError;
  const queryErrorMessage = isError ? getToastErrorMessage(queryError) : '';


  // Filters logic
  const filteredTrades = useMemo(() => {
    const activeAccount = viewMode === 'system' ? selectedSystemAccount : selectedTfAccount;
    return allTrades.filter((trade: Order) => {
      const matchAccount =
        activeAccount === 'all' || activeAccount === '' || trade.account_id === Number(activeAccount);
      const matchPair = selectedPair === 'all' || String(trade.symbol).replace('/', '').includes(selectedPair.replace('/', ''));
      const matchType =
        selectedType === 'all' ||
        (selectedType === 'buy' && trade.side === 'buy') ||
        (selectedType === 'sell' && trade.side === 'sell');

      const matchSearch =
        searchTerm === '' ||
        String(trade.symbol).toLowerCase().includes(searchTerm.toLowerCase());

      return matchAccount && matchPair && matchType && matchSearch;
    });
  }, [allTrades, selectedSystemAccount, selectedTfAccount, selectedPair, selectedType, searchTerm, viewMode]);

  // Use current server page data only (no extra local slicing)
  const displayedTrades = filteredTrades;

  const pairOptions = useMemo(() => {
    const set = new Set<string>();
    displayedTrades.forEach((trade) => {
      const symbol = String(trade.symbol || '').trim();
      if (symbol && symbol !== '--') set.add(symbol);
    });
    return ['all', ...Array.from(set)];
  }, [displayedTrades]);

  const hasLocalFilters = selectedPair !== 'all' || selectedType !== 'all' || searchTerm.trim() !== '';

  // Stats - Translate labels
  const stats = useMemo(() => {
    const tfServerTotal = tfOrdersData?.count ?? 0;
    const totalCount =
      viewMode === 'turboflow'
        ? hasLocalFilters
          ? displayedTrades.length
          : tfServerTotal
        : displayedTrades.length;
    const totalScope =
      viewMode === 'turboflow'
        ? hasLocalFilters
          ? t('history:stats.scope_filtered_page')
          : t('history:stats.scope_server_total')
        : t('history:stats.scope_page');

    const buyTrades = displayedTrades.filter((t: Order) => t.side === 'buy');
    const totalProfit = displayedTrades.reduce((acc: number, t: Order) => acc + (Number(t.realized_pnl) || 0), 0);

    return [
      {
        label: viewMode === 'system' ? t('history:stats.total_orders') : t('history:stats.total_volume'),
        value: `${totalCount} ${t('history:stats.count')}`,
        subValue: totalScope
      },
      { label: t('history:stats.buy'), value: `${buyTrades.length} ${t('history:stats.count')}`, subValue: t('history:stats.scope_page') },
      { label: t('history:stats.sell'), value: `${displayedTrades.length - buyTrades.length} ${t('history:stats.count')}`, subValue: t('history:stats.scope_page') },
      {
        label: t('history:stats.pnl'),
        value: totalProfit.toFixed(2),
        subValue: t('history:stats.pnl_closed'),
        color: totalProfit > 0 ? 'text-profit' : totalProfit < 0 ? 'text-loss' : ''
      },
    ];
  }, [displayedTrades, hasLocalFilters, tfOrdersData?.count, viewMode, t]);

  const clearFilters = () => {
    setSelectedPair('all');
    setSelectedType('all');
    setSearchInput('');
    setSearchTerm('');
    if (viewMode === 'system') {
      setSystemPage(1);
    } else {
      setTfPage(1);
    }
  };

  const hasFilters = selectedPair !== 'all' || selectedType !== 'all' || searchInput !== '';

  const currentPage = viewMode === 'system' ? systemPage : tfPage;
  const currentPageSize = viewMode === 'system' ? systemPageSize : tfPageSize;
  const setCurrentPage = (value: number | ((prev: number) => number)) => {
    if (viewMode === 'system') {
      setSystemPage((prev) => (typeof value === 'function' ? value(prev) : value));
    } else {
      setTfPage((prev) => (typeof value === 'function' ? value(prev) : value));
    }
  };
  const setCurrentPageSize = (size: number) => {
    if (viewMode === 'system') {
      setSystemPageSize(size);
      setSystemPage(1);
    } else {
      setTfPageSize(size);
      setTfPage(1);
    }
  };

  const tfTotal = tfOrdersData?.count ?? 0;
  const tfPageCount = tfOrdersData?.page_count ?? 0;
  const systemHasMore = !!systemOrdersData?.has_more;
  const showingStart = displayedTrades.length === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
  const showingEnd = displayedTrades.length === 0 ? 0 : showingStart + displayedTrades.length - 1;
  const showingTotal =
    viewMode === 'turboflow'
      ? tfTotal
      : systemHasMore
        ? `${showingEnd}+`
        : showingEnd;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">{t('history:title')}</h1>
          <p className="text-muted-foreground">{t('history:subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="bg-muted p-1 rounded-lg">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="system">{t('history:tabs.system')}</TabsTrigger>
              <TabsTrigger value="turboflow">{t('history:tabs.turboflow')}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            {t('history:actions.export')}
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="bg-card rounded-xl shadow-card border border-border/50 p-4"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={cn("text-xl font-semibold font-mono mt-1", stat.color)}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.subValue}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Input
            placeholder={t('history:filters.search_placeholder')}
            className="pl-4"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select
            value={viewMode === 'system' ? selectedSystemAccount : selectedTfAccount}
            onValueChange={(v) => {
              if (viewMode === 'system') {
                setSelectedSystemAccount(v);
                setSystemPage(1);
              } else {
                setSelectedTfAccount(v);
                setTfPage(1);
              }
            }}
          >
            <SelectTrigger className="w-[160px] border-primary/50 bg-primary/5">
              <SelectValue placeholder={t('history:filters.account_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {viewMode === 'system' ? (
                <>
                  <SelectItem value="all">{t('history:filters.all_accounts')}</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>
                      {acc.name} ({acc.exchange})
                    </SelectItem>
                  ))}
                </>
              ) : (
                turboflowAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id.toString()}>
                    {acc.name} ({acc.exchange})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {viewMode === 'turboflow' && (
            <Select
              value={tfStatus}
              onValueChange={(v) => {
                setTfStatus(v as (typeof tfOrderStatuses)[number]);
                setTfPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] border-primary/50 bg-primary/5">
                <SelectValue placeholder={t('history:filters.status_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('history:filters.all')}</SelectItem>
                <SelectItem value="Pending">{t('history:filters.tf_status.pending')}</SelectItem>
                <SelectItem value="Filled">{t('history:filters.tf_status.filled')}</SelectItem>
                <SelectItem value="Cancelled">{t('history:filters.tf_status.cancelled')}</SelectItem>
                <SelectItem value="Rejected">{t('history:filters.tf_status.rejected')}</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select value={selectedPair} onValueChange={(v) => { setSelectedPair(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('history:filters.pair_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {pairOptions.map(pair => (
                <SelectItem key={pair} value={pair}>
                  {pair === 'all' ? t('history:filters.all') : pair}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder={t('history:filters.type_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {types.map(type => (
                <SelectItem key={type} value={type}>
                  {type === 'all' ? t('history:filters.all') :
                    type === 'buy' ? t('history:filters.buy') : t('history:filters.sell')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              {t('history:filters.clear')}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Trades Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border bg-secondary/30">
                <th className="text-left p-4 font-medium">{t('history:table.time')}</th>
                <th className="text-left p-4 font-medium">{t('history:table.pair')}</th>
                <th className="text-left p-4 font-medium">{t('history:table.side')}</th>
                <th className="text-left p-4 font-medium">{t('history:table.account')}</th>
                <th className="text-right p-4 font-medium">{t('history:table.price')}</th>
                <th className="text-right p-4 font-medium">{t('history:table.amount')}</th>
                <th className="text-right p-4 font-medium">{t('history:table.pnl')}</th>
                <th className="text-center p-4 font-medium">{t('history:table.status')}</th>
                <th className="text-right p-4 font-medium">{t('history:table.action')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {displayedTrades.length > 0 ? (
                displayedTrades.map((trade: Order, index: number) => {
                  const rawStatus = String(trade.status || '').toUpperCase();
                  const isSuccess = ['FILLED', 'COMPLETED', 'FINISHED'].includes(rawStatus);
                  const isFailure = ['FAILED', 'CANCELED', 'CANCELLED', 'EXPIRED'].includes(rawStatus);
                  const isBlocked = trade.failure_code === 'SUBSCRIPTION_BLOCKED' || trade.public_error?.code === 'SUBSCRIPTION_BLOCKED';

                  const canShowError = ['FAILED', 'EXPIRED', 'PROCESSING'].includes(rawStatus);

                  // 鉁?Handle SUBSCRIPTION_BLOCKED specific messages
                  const rawError = (() => {
                    if (isBlocked) {
                      const details = trade.public_error?.details || {};
                      if (details.blocked_by === 'is_frozen' || trade.is_frozen) {
                        return t('history:table.errors.blocked_frozen');
                      }
                      if (details.blocked_by === 'block_open' || trade.block_open) {
                        return t('history:table.errors.blocked_open');
                      }
                      return (
                        getMappedFailureMessage(trade) ||
                        trade.failure_message ||
                        trade.public_error?.message ||
                        t('history:table.failure_map.SUBSCRIPTION_BLOCKED')
                      );
                    }
                    return (
                      getMappedFailureMessage(trade) ||
                      trade.failure_message ||
                      trade.public_error?.message ||
                      trade.error_message ||
                      trade.last_error
                    );
                  })();

                  const normalizedRawError = typeof rawError === 'string' ? rawError : String(rawError ?? '');
                  const showTooltip = viewMode === 'system' && (canShowError || isBlocked) && !!normalizedRawError;
                  const displayError = showTooltip && normalizedRawError.length > 200
                    ? `${normalizedRawError.slice(0, 200)}${t('history:table.truncated_suffix')}`
                    : normalizedRawError;
                  const mappedFailureAction = getMappedFailureAction(trade);
                  const displayFailureAction = mappedFailureAction || trade.failure_action;

                  const statusLabel = (() => {
                    const s = trade.status?.toLowerCase();
                    if (viewMode === 'turboflow') {
                      if (['filled', 'completed'].includes(s)) return t('history:table.status_map.filled');
                      if (['partially_filled'].includes(s)) return t('history:table.status_map.partially_filled');
                      if (['cancelled', 'canceled'].includes(s)) return t('history:table.status_map.canceled');
                      if (['partially_canceled', 'partially_cancelled'].includes(s)) return t('history:table.status_map.partially_canceled');
                      if (s === 'pending' || s === 'new') return t('history:table.status_map.pending');
                      if (s === 'rejected' || s === 'failed') return t('history:table.status_map.failed');
                      const raw = String(trade.status || '').toUpperCase();
                      if (!raw || raw === '-' || raw === '--') return '--';
                      return raw;
                    }

                    // system
                    // Normalize checking
                    const sysRaw = String(trade.status || '').toUpperCase();
                    if (['FILLED', 'COMPLETED', 'FINISHED'].includes(sysRaw)) return t('history:table.status_map.filled');
                    if (sysRaw === 'FAILED') {
                      if (isBlocked) return t('history:table.status_map.blocked');

                      const errMsg = (trade.failure_message || trade.error_message || '').toLowerCase();
                      if (errMsg.includes('cancelled') || errMsg.includes('canceled')) {
                        return t('history:table.status_map.canceled');
                      }
                      return t('history:table.status_map.failed');
                    }
                    if (sysRaw === 'EXPIRED') return t('history:table.status_map.expired');
                    if (['CANCELED', 'CANCELLED'].includes(sysRaw)) return t('history:table.status_map.canceled');
                    if (['PROCESSING', 'PENDING', 'NEW'].includes(sysRaw)) return t('history:table.status_map.pending');
                    return trade.status || '--';
                  })();

                  return (
                    <motion.tr
                      key={trade.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.05 * index }}
                      className="hover:bg-secondary/30 transition-colors"
                    >
                      <td className="p-4 text-sm font-mono text-muted-foreground">
                        {trade.created_at ? format(new Date(trade.created_at), 'yyyy-MM-dd HH:mm:ss') : '--'}
                      </td>
                      <td className="p-4 text-sm font-medium">{trade.symbol}</td>

                      <td className="p-4">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                          trade.side === 'buy'
                            ? "bg-profit/10 text-profit"
                            : "bg-loss/10 text-loss"
                        )}>
                          {trade.side === 'buy' ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {trade.side === 'buy' ? t('history:filters.buy') : t('history:filters.sell')}
                        </span>
                      </td>

                      <td className="p-4 text-sm text-muted-foreground font-mono">
                        {accounts.find(a => a.id === trade.account_id)?.name || trade.account_id}
                      </td>

                      <td className="p-4 text-sm text-right font-mono">
                        <div className="flex flex-col items-end">
                          <span>{trade.executed_price ?? trade.price ?? '--'}</span>
                          {trade.status === 'COMPLETED' && (trade.executed_price === undefined || trade.executed_price === null) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 text-[9px] text-warning mt-0.5 cursor-help">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    {t('common:audit.missing_price')}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('common:audit.missing_price_desc')}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-right font-mono">
                        <div className="flex flex-col items-end">
                          <span>{trade.executed_qty ?? trade.quantity ?? '--'}</span>
                          {trade.status === 'COMPLETED' && (trade.executed_notional_usd === undefined || trade.executed_notional_usd === null) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-[8px] h-3 border-warning/50 text-warning px-1 mt-0.5 font-normal cursor-help">
                                    {t('history:table.missing_usd')}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('common:audit.missing_notional_desc')}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </td>

                      <td className={cn(
                        "p-4 text-sm text-right font-mono font-bold",
                        (trade.realized_pnl || 0) > 0 ? "text-profit" : (trade.realized_pnl || 0) < 0 ? "text-loss" : "text-muted-foreground"
                      )}>
                        {trade.realized_pnl !== undefined && trade.realized_pnl !== null ? (trade.realized_pnl > 0 ? '+' : '') + Number(trade.realized_pnl).toFixed(2) : '--'}
                      </td>

                      <td className="p-4 text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={cn(
                                "inline-flex px-2 py-1 rounded text-xs font-medium items-center",
                                showTooltip ? "cursor-help" : "cursor-default",
                                isSuccess || statusLabel === t('history:table.status_map.filled') ? "bg-profit/10 text-profit" :
                                  isBlocked ? "bg-orange-500/15 text-orange-600 border border-orange-500/20" :
                                    isFailure || statusLabel === t('history:table.status_map.failed') || statusLabel === t('history:table.status_map.canceled') ? "bg-destructive/10 text-destructive" :
                                      "bg-warning/10 text-warning"
                              )}>
                                {statusLabel}
                                {showTooltip && <AlertCircle className="w-3 h-3 ml-1" />}
                              </span>
                            </TooltipTrigger>

                            {showTooltip && (
                              <TooltipContent>
                                <div className="max-w-xs space-y-2">
                                  <p className="font-semibold text-destructive">{displayError}</p>
                                  {displayFailureAction && (
                                    <p className="text-xs p-2 bg-secondary/50 rounded border-l-2 border-primary">
                                      {t('history:actions.suggested_action')}: {displayFailureAction}
                                    </p>
                                  )}
                                </div>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </td>

                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {viewMode === 'system' && (trade.status === 'FAILED' || trade.status === 'EXPIRED') && (
                              <DropdownMenuItem
                                disabled={retryMutation.isPending || reorderMutation.isPending}
                                onClick={() => {
                                  if (trade.status === 'EXPIRED') {
                                    reorderMutation.mutate(trade);
                                  } else {
                                    retryMutation.mutate(trade.id as number);
                                  }
                                }}
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                {t('history:actions.retry')}
                              </DropdownMenuItem>
                            )}

                            {viewMode === 'system' && (trade.status === 'PENDING' || trade.status === 'PROCESSING') && (
                              <DropdownMenuItem
                                className="text-destructive font-bold"
                                disabled={cancelMutation.isPending}
                                onSelect={() => {
                                  toast(t('history:actions.cancel_confirm_title'), {
                                    description: t('history:actions.cancel_confirm_desc', { id: trade.id }),
                                    action: {
                                      label: t('history:actions.cancel_confirm_btn'),
                                      onClick: () => cancelMutation.mutate(trade.id as number),
                                    },
                                    cancel: {
                                      label: t('history:actions.cancel_cancel_btn'),
                                      onClick: () => { },
                                    },
                                  });
                                }}
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                {t('history:actions.cancel')}
                              </DropdownMenuItem>
                            )}

                            {viewMode === 'system' && (
                              <DropdownMenuItem
                                disabled={debugMutation.isPending}
                                onClick={() => debugMutation.mutate(trade.id as number)}
                              >
                                <Bug className="w-4 h-4 mr-2" />
                                {t('history:actions.debug')}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    {isLoading ? (
                      t('common:loading')
                    ) : isError ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-medium text-destructive">{t('history:table.error_title')}</span>
                        <span className="text-xs text-muted-foreground">{queryErrorMessage || t('common:unknown_error')}</span>
                      </div>
                    ) : (
                      t('history:table.empty')
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              {t('history:pagination.showing', {
                start: showingStart,
                end: showingEnd,
                total: showingTotal
              })}
            </p>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('history:pagination.per_page')}</span>
              <Select
                value={currentPageSize.toString()}
                onValueChange={(v) => setCurrentPageSize(Number(v))}
              >
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map(size => (
                    <SelectItem key={size} value={size.toString()}>{size} {t('history:stats.unit_orders')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t('history:pagination.prev')}
            </Button>

            <div className="flex items-center gap-1">
              {viewMode === 'turboflow' ? (
                Array.from({ length: tfPageCount }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'ghost'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))
              ) : (
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0" disabled>
                  {currentPage}
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={viewMode === 'system' ? !systemHasMore : currentPage >= tfPageCount}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              {t('history:pagination.next')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Debug Dialog */}
      <Dialog open={!!debugOrder} onOpenChange={() => setDebugOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('history:actions.debug_title', { id: debugOrder?.id ?? '--' })}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 bg-secondary/30 rounded-lg border border-border mt-2">
            <pre className="text-xs font-mono whitespace-pre-wrap">
              {JSON.stringify(debugOrder, null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryPage;

