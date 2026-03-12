import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { accountApi, userApi } from '@/api';
import { LIMIT_OTHER, LIMIT_TF } from '@/pages/settings/settings-helpers';

export function useSettingsQueries() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.getProfile(),
  });

  const { data: accounts, isLoading: isAccountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountApi.list(),
  });

  const invalidateAccountData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['account-status'] });
  }, [queryClient]);

  const { turboflowCount, otherCount } = useMemo(() => {
    const list = accounts ?? [];
    let tf = 0;
    let other = 0;

    for (const account of list) {
      if (account.exchange === 'turboflow') tf += 1;
      else other += 1;
    }

    return { turboflowCount: tf, otherCount: other };
  }, [accounts]);

  const isLimitReached = useCallback(
    (exchange: string) => {
      if (exchange === 'turboflow') return turboflowCount >= LIMIT_TF;
      return otherCount >= LIMIT_OTHER;
    },
    [otherCount, turboflowCount]
  );

  return {
    profile,
    isProfileLoading,
    accounts,
    isAccountsLoading,
    turboflowCount,
    otherCount,
    isLimitReached,
    invalidateAccountData,
  };
}
