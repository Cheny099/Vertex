import { memo } from 'react';
import type { TFunction } from 'i18next';
import { Bug, Ban, MoreVertical, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HistoryTradeActionsMenuProps {
  t: TFunction;
  canCancel: boolean;
  canDebug: boolean;
  canRetry: boolean;
  isCancelPending: boolean;
  isDebugPending: boolean;
  isReorderPending: boolean;
  isRetryPending: boolean;
  onCancel: () => void;
  onDebug: () => void;
  onRetryOrReorder: () => void;
}

function HistoryTradeActionsMenuComponent({
  t,
  canCancel,
  canDebug,
  canRetry,
  isCancelPending,
  isDebugPending,
  isReorderPending,
  isRetryPending,
  onCancel,
  onDebug,
  onRetryOrReorder,
}: HistoryTradeActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canRetry && (
          <DropdownMenuItem
            disabled={isRetryPending || isReorderPending}
            onClick={onRetryOrReorder}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('history:actions.retry')}
          </DropdownMenuItem>
        )}

        {canCancel && (
          <DropdownMenuItem
            className="text-destructive font-bold"
            disabled={isCancelPending}
            onSelect={onCancel}
          >
            <Ban className="w-4 h-4 mr-2" />
            {t('history:actions.cancel')}
          </DropdownMenuItem>
        )}

        {canDebug && (
          <DropdownMenuItem
            disabled={isDebugPending}
            onClick={onDebug}
          >
            <Bug className="w-4 h-4 mr-2" />
            {t('history:actions.debug')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const HistoryTradeActionsMenu = memo(HistoryTradeActionsMenuComponent);
