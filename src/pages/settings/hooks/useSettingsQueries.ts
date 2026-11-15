import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { accountApi, userApi } from '@/api';

export function useSettingsQueries() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.getProfile(),
  });

  const { data: accounts, isLoading: isAccountsLoading, isError: accountsFailed, isFetching: isAccountsFetching, refetch: retryAccounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountApi.list(),
  });

  const invalidateAccountData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['account-status'] });
  }, [queryClient]);

  return {
    profile,
    isProfileLoading,
    accounts,
    isAccountsLoading,
    accountsFailed,
    isAccountsFetching,
    retryAccounts,
    invalidateAccountData,
  };
}
