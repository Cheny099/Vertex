/**
 * @anchor-id RECENT_TRADES
 * @module-type component
 * @disposable false
 * @mock-data trades 数组为临时 Mock，后端对接时替换
 */

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { turboflowApi, accountApi } from '@/api';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const RecentTrades = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();

  // 获取账户列表以确定从哪个账户获取交易记录
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountApi.list,
    staleTime: 60000,
  });

  const firstAccountId = accounts?.find(a => a.is_active && !a.deleted_at)?.id;

  // 获取最近交易 (仅当有活跃账户时)
  const { data: trades = [] } = useQuery({
    queryKey: ['recentTrades', firstAccountId],
    queryFn: async () => {
      if (!firstAccountId) return [];
      try {
        const res = await turboflowApi.getOrders({ account_id: firstAccountId, page_size: 5 });
        return res.data || [];
      } catch (e) {
        console.warn('Failed to fetch recent trades', e);
        return [];
      }
    },
    enabled: !!firstAccountId,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="glass-card rounded-xl overflow-hidden h-full"
    >
      <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('recent_trades.title')}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border">
              <th className="text-left p-4 font-medium">{t('recent_trades.table.time')}</th>
              <th className="text-left p-4 font-medium">{t('recent_trades.table.pair')}</th>
              <th className="text-left p-4 font-medium">{t('recent_trades.table.type')}</th>
              <th className="text-right p-4 font-medium">{t('recent_trades.table.price')}</th>
              <th className="text-right p-4 font-medium">{t('recent_trades.table.volume')}</th>
              <th className="text-right p-4 font-medium">{t('recent_trades.table.pnl')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {trades.map((trade: any, index: number) => {
              const side = trade.order_way === 1 ? 'buy' : 'sell';
              const rawPnl = trade.done_pnl;
              const parsed = rawPnl != null && rawPnl !== '' ? parseFloat(rawPnl) : null;
              const profit = parsed !== null && Number.isFinite(parsed) ? parsed : null;

              return (
                <motion.tr
                  key={trade.id || index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                  className="hover:bg-secondary/30 transition-colors"
                >
                  <td className="p-4 text-sm font-mono text-muted-foreground">
                    {new Date(trade.created_at || trade.updated_at).toLocaleString()}
                  </td>
                  <td className="p-4 text-sm font-medium">{trade.symbol || trade.pair_id}</td>
                  <td className="p-4">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                      side === 'buy'
                        ? "bg-profit/10 text-profit"
                        : "bg-loss/10 text-loss"
                    )}>
                      {side === 'buy' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {side === 'buy' ? t('recent_trades.table.buy') : t('recent_trades.table.sell')}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-right font-mono">
                    <div className="flex flex-col items-end">
                      <span>{trade.deal_price || trade.price || '--'}</span>
                      {['Filled', 'Finished'].includes(trade.order_status) && !trade.deal_price && (
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
                      <span>{trade.done_vol || trade.vol || '--'}</span>
                    </div>
                  </td>
                  <td className={cn(
                    "p-4 text-sm text-right font-mono font-bold",
                    profit !== null
                      ? profit > 0 ? "text-profit" : profit < 0 ? "text-loss" : "text-muted-foreground"
                      : "text-muted-foreground"
                  )}>
                    {profit !== null ? `${profit > 0 ? '+' : ''}${profit.toFixed(2)}` : '--'}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-border">
        <button
          onClick={() => navigate('/history')}
          className="w-full py-2 text-sm text-primary hover:text-primary-light transition-colors"
        >
          {t('recent_trades.view_all')}
        </button>
      </div>
    </motion.div>
  );
};

export default RecentTrades;
