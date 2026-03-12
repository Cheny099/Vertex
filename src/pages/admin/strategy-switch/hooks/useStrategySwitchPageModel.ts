import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translateBackendErrorMessage } from '@/api';
import type { ApiError } from '@/api/contracts';
import { usePageVisibility } from '@/hooks/use-page-visibility';
import { useStrategySwitchBulkFlow } from './useStrategySwitchBulkFlow';
import { useStrategySwitchSingleFlow } from './useStrategySwitchSingleFlow';

export function useStrategySwitchPageModel() {
  const { t } = useTranslation(['admin', 'common']);
  const isPageVisible = usePageVisibility();
  const [activeTab, setActiveTab] = useState('single');

  const toErrorText = useCallback(
    (err: unknown) =>
      translateBackendErrorMessage((err as Partial<ApiError>)?.message || '') ||
      (err as Partial<ApiError>)?.message ||
      t('admin:error_operation_failed'),
    [t]
  );

  const getStatusLabel = useCallback(
    (status?: string) => {
      if (!status) return '-';
      return t(`admin:status_labels.${status}`, { defaultValue: status });
    },
    [t]
  );

  const rawSinglePanelProps = useStrategySwitchSingleFlow({
    isPageVisible,
    t,
    toErrorText,
  });

  const rawBulkPanelProps = useStrategySwitchBulkFlow({
    isPageVisible,
    t,
    toErrorText,
  });

  const singlePanelProps = useMemo(
    () => ({
      ...rawSinglePanelProps,
      getStatusLabel,
    }),
    [getStatusLabel, rawSinglePanelProps]
  );

  const bulkPanelProps = useMemo(
    () => ({
      ...rawBulkPanelProps,
      getStatusLabel,
    }),
    [getStatusLabel, rawBulkPanelProps]
  );

  return {
    t,
    activeTab,
    setActiveTab,
    singlePanelProps,
    bulkPanelProps,
  };
}
