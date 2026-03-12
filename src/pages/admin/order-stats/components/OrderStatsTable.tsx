import { memo } from 'react';
import type { TFunction } from 'i18next';
import { AlertCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { OrderTurnoverStatsRow } from '@/api/types';

interface OrderStatsTableProps {
  t: TFunction<'admin' | 'common'>;
  isError: boolean;
  isLoading: boolean;
  errorText: string;
  rows: OrderTurnoverStatsRow[];
  formatUsd: (value: number | null | undefined) => string;
  getGroupLabel: (row: OrderTurnoverStatsRow) => string | number;
  renderQualityWarning: (warning: string) => string;
}

function OrderStatsTableBase({
  t,
  isError,
  isLoading,
  errorText,
  rows,
  formatUsd,
  getGroupLabel,
  renderQualityWarning,
}: OrderStatsTableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table className="[&_td]:py-2 [&_td]:px-3 [&_th]:py-2 [&_th]:px-3 text-xs whitespace-nowrap">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[150px]">{t('admin:group')}</TableHead>
            <TableHead className="text-right w-[160px]">{t('admin:turnover')}</TableHead>
            <TableHead className="text-right w-[160px]">{t('admin:pnl')}</TableHead>
            <TableHead className="text-right w-[80px]">{t('admin:open_pos')}</TableHead>
            <TableHead className="text-right w-[80px]">{t('admin:flat')}</TableHead>
            <TableHead className="text-right w-[100px]">{t('admin:trades')}</TableHead>
            <TableHead className="text-right w-[100px]">{t('admin:win_rate')}</TableHead>
            <TableHead className="text-center w-[150px]">{t('admin:mode')}</TableHead>
            <TableHead className="text-center w-[120px]">{t('admin:coverage')}</TableHead>
            <TableHead className="text-right min-w-[120px]">{t('admin:actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isError ? (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center text-destructive">
                <div className="flex flex-col items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>{t('admin:error_loading_stats')}</span>
                  <span className="text-xs opacity-70">{errorText}</span>
                </div>
              </TableCell>
            </TableRow>
          ) : isLoading ? (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center">
                {t('admin:loading')}
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center">
                {t('admin:no_data')}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{getGroupLabel(row)}</TableCell>
                <TableCell className="text-right font-mono py-4">
                  <div className="flex flex-col items-end">
                    <span>{formatUsd(row.turnover_usd)}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 mt-1 cursor-help">
                            <div className="flex h-1 w-20 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${(row.turnover_usd_executed_notional / (row.turnover_usd || 1)) * 100}%` }}
                              />
                              <div
                                className="h-full bg-amber-400"
                                style={{ width: `${(row.turnover_usd_fallback / (row.turnover_usd || 1)) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground leading-none font-bold">
                              {((row.turnover_usd_executed_notional / (row.turnover_usd || 1)) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                          <p className="font-bold mb-1">{t('admin:fidelity_breakdown')}</p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>{t('admin:fidelity_executed')}: {((row.turnover_usd_executed_notional / (row.turnover_usd || 1)) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span>{t('admin:fidelity_fallback')}: {((row.turnover_usd_fallback / (row.turnover_usd || 1)) * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
                <TableCell className={`text-right font-mono py-4 ${(row.realized_pnl_usd_sum || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatUsd(row.realized_pnl_usd_sum)}
                </TableCell>
                <TableCell className="text-right font-mono py-4">
                  <span className="text-blue-600 font-bold">{row.open_cnt || 0}</span>
                </TableCell>
                <TableCell className="text-right font-mono py-4 text-muted-foreground">
                  {row.flat_cnt || 0}
                </TableCell>
                <TableCell className="text-right font-mono py-4">
                  <div className="flex flex-col items-end">
                    <span>{row.close_cnt || 0}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {row.win_cnt || 0}{t('admin:wins_abbr')} / {row.lose_cnt || 0}{t('admin:losses_abbr')}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono py-4">
                  {(row.close_cnt || 0) > 0 ? (
                    <span>{((row.win_rate || 0) * 100).toFixed(1)}%</span>
                  ) : (
                    <span className="text-muted-foreground/40">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center py-4">
                  {row.turnover_mode && (
                    <span className="text-xs px-3 py-1 rounded-sm bg-muted text-muted-foreground uppercase font-bold tracking-tighter transition-colors select-none whitespace-nowrap">
                      {t(`admin:turnover_mode_${row.turnover_mode}`)}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-center py-4">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-mono font-bold leading-none">{((row.executed_notional_covered?.pct || 0)).toFixed(0)}%</span>
                      <span className="text-xs text-muted-foreground font-mono leading-none">
                        ({row.executed_notional_covered?.covered}/{row.executed_notional_covered?.total})
                      </span>
                    </div>
                    <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${row.executed_notional_covered?.pct || 0}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right py-4">
                  {row.quality_warnings && row.quality_warnings.length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 transition-colors group">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-xs font-bold leading-none">
                          {t('admin:warnings_count', { count: row.quality_warnings.length })}
                        </span>
                        <ChevronDown className="h-3 w-3 opacity-50 group-data-[state=open]:rotate-180 transition-transform" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="text-xs text-amber-600 mt-2 bg-amber-50/50 p-2 rounded border border-dashed border-amber-200 shadow-inner max-w-[400px]">
                        <ul className="text-right list-none space-y-2">
                          {Array.isArray(row.quality_warnings) && row.quality_warnings.map((warning, warningIndex) => (
                            <li key={warningIndex} className="flex items-start justify-end gap-1.5 leading-relaxed">
                              <span className="text-right">{renderQualityWarning(warning)}</span>
                              <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export const OrderStatsTable = memo(OrderStatsTableBase);
