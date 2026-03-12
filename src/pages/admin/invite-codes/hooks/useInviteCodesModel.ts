import { useCallback, useMemo, useState } from 'react';
import type React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { adminApi, translateBackendErrorMessage, type AdminInviteCreateRequest } from '@/api';
import type { ApiError } from '@/api/contracts';
import { logger } from '@/lib/logger';
import {
  DEFAULT_ACTION_CONFIRM,
  DEFAULT_NEW_INVITE,
  type CreatedInviteCode,
  type InviteActionConfirmState,
} from '../utils';

export const useInviteCodesModel = () => {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createdCode, setCreatedCode] = useState<CreatedInviteCode | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [actionConfirm, setActionConfirm] = useState<InviteActionConfirmState>(DEFAULT_ACTION_CONFIRM);
  const [newInvite, setNewInvite] = useState<AdminInviteCreateRequest>(DEFAULT_NEW_INVITE);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminInvites', page],
    queryFn: () => adminApi.invites.list({ page, limit: 20, include_revoked: true }),
  });

  const toErrorText = useCallback((err: unknown) => (
    translateBackendErrorMessage((err as Partial<ApiError>)?.message || '')
    || (err as Partial<ApiError>)?.message
    || t('admin:error_operation_failed')
  ), [t]);

  const queryErrorText = useMemo(
    () => (isError ? toErrorText(error) : ''),
    [error, isError, toErrorText]
  );

  const pageSize = 20;
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const resetNewInvite = useCallback(() => {
    setCreatedCode(null);
    setHasCopied(false);
    setNewInvite({ ...DEFAULT_NEW_INVITE, expires_at: '' });
  }, []);

  const closeCreateDialog = useCallback(() => {
    setIsCreateOpen(false);
    resetNewInvite();
  }, [resetNewInvite]);

  const createMutation = useMutation({
    mutationFn: (payload: AdminInviteCreateRequest) => adminApi.invites.create(payload),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: ['adminInvites'] });
      setCreatedCode({ plainCode: response.code, channel: response.channel || null });
      setHasCopied(false);
    },
    onError: (mutationError: unknown) => {
      toast.error(toErrorText(mutationError));
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: number) => adminApi.invites.revoke(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['adminInvites'] });
      toast.success(t('admin:invites.revoked_success', 'Invite code successfully revoked.'));
    },
    onError: (mutationError: unknown) => {
      toast.error(toErrorText(mutationError));
    },
  });

  const handleCreate = useCallback((event: React.FormEvent) => {
    event.preventDefault();

    let expiresAtIso = undefined;
    if (newInvite.expires_at) {
      expiresAtIso = new Date(newInvite.expires_at).toISOString();
    }

    createMutation.mutate({
      ...newInvite,
      channel: newInvite.channel?.trim() || undefined,
      notes: newInvite.notes?.trim() || undefined,
      expires_at: expiresAtIso,
    });
  }, [createMutation, newInvite]);

  const handleCopy = useCallback((event?: React.MouseEvent) => {
    if (!createdCode) return;

    const textToCopy = createdCode.plainCode;
    const onSuccess = () => {
      setHasCopied(true);
      toast.success(t('admin:copy_success', 'Copied to clipboard'));
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy).then(onSuccess).catch((copyError) => {
        toast.error(t('admin:invites.copy_failed', 'Failed to copy using clipboard API.'));
        logger.error(copyError);
      });
      return;
    }

    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.width = '2rem';
    textArea.style.height = '2rem';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';

    const container = event?.currentTarget?.parentElement || document.body;
    container.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        onSuccess();
      } else {
        toast.error(t('admin:invites.copy_failed', 'Copy failed'));
      }
    } catch (copyError) {
      toast.error(t('admin:invites.copy_failed', 'Copy failed'));
      logger.error('Fallback: Oops, unable to copy', copyError);
    }

    container.removeChild(textArea);
  }, [createdCode, t]);

  const handleCloseCreate = useCallback((open: boolean) => {
    if (open) {
      setIsCreateOpen(true);
      return;
    }

    if (createdCode && !hasCopied) {
      setActionConfirm({
        open: true,
        title: t('admin:warning', 'Warning'),
        desc: t('admin:invites.warning_not_copied', 'You have not copied the code! Once closed, you will NEVER see the full code again. Close anyway?'),
        onConfirm: closeCreateDialog,
      });
      return;
    }

    closeCreateDialog();
  }, [closeCreateDialog, createdCode, hasCopied, t]);

  const openCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const requestRevoke = useCallback((id: number) => {
    setActionConfirm({
      open: true,
      title: t('admin:confirm', 'Confirm'),
      desc: t('admin:invites.revoke_confirm', 'Are you sure you want to revoke this code? It will immediately stop working for new users.'),
      onConfirm: () => revokeMutation.mutate(id),
    });
  }, [revokeMutation, t]);

  const handleConfirmOpenChange = useCallback((open: boolean) => {
    setActionConfirm((prev) => ({ ...prev, open }));
  }, []);

  const handleConfirmAction = useCallback(() => {
    actionConfirm.onConfirm();
    setActionConfirm((prev) => ({ ...prev, open: false }));
  }, [actionConfirm]);

  const goPrevPage = useCallback(() => {
    setPage((current) => Math.max(1, current - 1));
  }, []);

  const goNextPage = useCallback(() => {
    setPage((current) => Math.min(totalPages, current + 1));
  }, [totalPages]);

  return {
    actionConfirm,
    closeCreateDialog,
    createMutation,
    createdCode,
    data,
    goNextPage,
    goPrevPage,
    handleCloseCreate,
    handleConfirmAction,
    handleConfirmOpenChange,
    handleCopy,
    handleCreate,
    hasCopied,
    isCreateOpen,
    isError,
    isLoading,
    newInvite,
    openCreate,
    page,
    queryErrorText,
    requestRevoke,
    revokeMutation,
    setNewInvite,
    total,
    totalPages,
  };
};
