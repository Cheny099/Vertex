import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DateRange } from 'react-day-picker';
import { endOfDay, startOfDay } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { adminApi, type AdminAuditLogItem, translateBackendErrorMessage } from '@/api';
import type { ApiError } from '@/api/contracts';

type BadgeVariant = 'destructive' | 'default' | 'secondary' | 'outline';

export const useAuditLogsModel = () => {
  const { t } = useTranslation(['admin', 'common']);
  const [page, setPage] = useState(1);
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [targetId, setTargetId] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['adminAuditLogs', page, actor, action, targetType, targetId, dateRange],
    queryFn: () => adminApi.audit.list({
      page,
      limit: 50,
      actor: actor || undefined,
      action: action || undefined,
      target_type: targetType || undefined,
      target_id: targetId || undefined,
      date_from: dateRange?.from ? startOfDay(dateRange.from).toISOString() : undefined,
      date_to: dateRange?.to ? endOfDay(dateRange.to).toISOString() : undefined,
    }),
    placeholderData: (previousData) => previousData,
  });

  const queryErrorText = useMemo(() => (
    isError
      ? (translateBackendErrorMessage((error as Partial<ApiError>)?.message || '')
        || (error as Partial<ApiError>)?.message
        || t('admin:error_operation_failed'))
      : ''
  ), [error, isError, t]);

  const logs = useMemo<AdminAuditLogItem[]>(
    () => (Array.isArray(data?.items) ? data.items : []),
    [data?.items]
  );

  const handleActorChange = useCallback((value: string) => {
    setActor(value);
    setPage(1);
  }, []);

  const handleActionChange = useCallback((value: string) => {
    setAction(value);
    setPage(1);
  }, []);

  const handleTargetTypeChange = useCallback((value: string) => {
    setTargetType(value);
    setPage(1);
  }, []);

  const handleTargetIdChange = useCallback((value: string) => {
    setTargetId(value);
    setPage(1);
  }, []);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  }, []);

  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const goPrevPage = useCallback(() => {
    setPage((current) => Math.max(1, current - 1));
  }, []);

  const goNextPage = useCallback(() => {
    setPage((current) => current + 1);
  }, []);

  const getActionColor = useCallback((value: string): BadgeVariant => {
    const normalized = value.toLowerCase();
    if (normalized.includes('delete') || normalized.includes('freeze') || normalized.includes('cancel')) return 'destructive';
    if (normalized.includes('create') || normalized.includes('publish') || normalized.includes('login')) return 'default';
    if (normalized.includes('update') || normalized.includes('rotate') || normalized.includes('requeue')) return 'secondary';
    return 'outline';
  }, []);

  const formatAction = useCallback((value: string) => {
    return t(`admin:log_actions.${value}`, { defaultValue: value });
  }, [t]);

  const formatTargetType = useCallback((value: string) => {
    return t(`admin:log_targets.${value}`, { defaultValue: value });
  }, [t]);

  const hasNextPage = useMemo(
    () => !!data && logs.length >= data.limit,
    [data, logs.length]
  );

  return {
    action,
    actor,
    data,
    dateRange,
    formatAction,
    formatTargetType,
    getActionColor,
    goNextPage,
    goPrevPage,
    handleActionChange,
    handleActorChange,
    handleDateRangeChange,
    handleTargetIdChange,
    handleTargetTypeChange,
    hasNextPage,
    isError,
    isLoading,
    logs,
    page,
    queryErrorText,
    refresh,
    t,
    targetId,
    targetType,
  };
};
