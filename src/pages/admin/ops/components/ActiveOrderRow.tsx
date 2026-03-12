import { memo } from 'react';
import type { TFunction } from 'i18next';
import { AlertTriangle, Eye, RefreshCw, XCircle } from 'lucide-react';

import type { Order } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ActiveOrderRowProps = {
  t: TFunction;
  order: Order;
  isRequeuePending: boolean;
  isCancelPending: boolean;
  onRequeue: (orderId: number) => void;
  onCancel: (orderId: number) => void;
  onView: (order: Order) => void;
};

function ActiveOrderRowImpl({
  t,
  order,
  isRequeuePending,
  isCancelPending,
  onRequeue,
  onCancel,
  onView,
}: ActiveOrderRowProps) {
  return (
    <TableRow className="group transition-all hover:bg-slate-50/80">
      <TableCell className="relative font-mono text-xs text-muted-foreground pl-4">
        <div
          className={`absolute left-0 top-0 bottom-0 w-[3px] opacity-0 group-hover:opacity-100 transition-all ${order.side.toLowerCase() === 'buy' ? 'bg-blue-600 shadow-[2px_0_10px_rgba(37,99,235,0.3)]' : 'bg-red-600 shadow-[2px_0_10px_rgba(220,38,38,0.3)]'}`}
        />
        #{order.id}
      </TableCell>
      <TableCell className="font-mono text-xs">{order.account_id}</TableCell>
      <TableCell className="py-4">
        <div className="flex flex-col min-w-[140px]">
          <span className="font-black text-sm tracking-tight text-slate-900 mb-1.5 uppercase">{order.symbol}</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant={order.side.toLowerCase() === 'buy' ? 'default' : 'destructive'}
              className={`text-xs px-1.5 py-0 h-4.5 font-bold uppercase ${order.side.toLowerCase() === 'buy' ? 'bg-blue-600 shadow-[0_2px_10px_rgba(37,99,235,0.2)]' : 'bg-red-600 shadow-[0_2px_10px_rgba(220,38,38,0.2)]'}`}
            >
              {order.side}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={`text-xs px-1.5 py-0 h-4.5 font-bold border-slate-200 bg-slate-50/50 ${order.status === 'FAILED' ? 'bg-red-50 text-red-600 border-red-100 shadow-sm animate-pulse cursor-help' : ''}`}
                  >
                    {t(`admin:status_labels.${order.status}`)}
                  </Badge>
                </TooltipTrigger>
                {(order.error_message || order.last_error) && (
                  <TooltipContent className="max-w-[300px] text-xs bg-slate-900 text-white border-0 shadow-2xl p-3">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span className="font-bold">{t('admin:error_reason')}</span>
                    </div>
                    <p className="font-mono break-all leading-relaxed text-slate-300">{order.error_message || order.last_error}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-xs px-1 py-0 h-4 capitalize">
          {order.action ? t(`admin:log_actions.${order.action}`, { defaultValue: order.action }) : '-'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-mono text-sm">{order.quantity}</span>
          {order.executed_price > 0 && <span className="text-xs text-muted-foreground line-clamp-1">@ {order.executed_price}</span>}
        </div>
      </TableCell>
      <TableCell className="font-mono text-xs uppercase text-muted-foreground">
        {order.exchange ? t(`common:exchanges.${order.exchange.toLowerCase()}`, { defaultValue: order.exchange }) : t('common:exchanges.turboflow')}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 hover:bg-orange-100 hover:text-orange-700"
            title={t('admin:requeue_single')}
            disabled={isRequeuePending}
            onClick={() => onRequeue(order.id)}
          >
            <RefreshCw className={`h-4 w-4 ${isRequeuePending ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
            title={t('admin:cancel_order')}
            disabled={isCancelPending}
            onClick={() => onCancel(order.id)}
          >
            <XCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title={t('admin:view_data')}
            onClick={() => onView(order)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export const ActiveOrderRow = memo(ActiveOrderRowImpl);
