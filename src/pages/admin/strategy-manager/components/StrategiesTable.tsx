import React from 'react';
import { Link } from 'react-router-dom';
import {
    AlertTriangle,
    BarChart2,
    MoreHorizontal,
    Pause,
    Play,
    ShieldAlert,
    TrendingUp,
    Upload,
    Zap,
} from 'lucide-react';
import type { Strategy } from '@/api/types';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    getStrategyMetrics,
    parseStrategyConfig,
    renderPercentMetric,
    renderStrategyStatusBadge,
    renderStrategyTypeBadge,
} from '../utils';

interface StrategiesTableProps {
    strategies: Strategy[];
    isLoading: boolean;
    isError: boolean;
    strategyErrorText: string;
    t: (key: string, fallback?: string) => string;
    onPublish: (id: number) => void;
    onUnpublish: (id: number) => void;
    onViewSecret: (id: number) => void;
    onRotateSecret: (id: number) => void;
    onImport: (id: number) => void;
}

export const StrategiesTable = React.memo(({
    strategies,
    isLoading,
    isError,
    strategyErrorText,
    t,
    onPublish,
    onUnpublish,
    onViewSecret,
    onRotateSecret,
    onImport,
}: StrategiesTableProps) => (
    <div className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
        <Table className="[&_td]:py-2 [&_td]:px-3 [&_th]:py-2 [&_th]:px-3 text-xs whitespace-nowrap">
            <TableHeader>
                <TableRow className="bg-slate-50/50">
                    <TableHead className="w-[80px] font-bold">{t('column_id')}</TableHead>
                    <TableHead className="font-bold">{t('column_strategy_name')}</TableHead>
                    <TableHead className="font-bold">{t('column_strategy_type')}</TableHead>
                    <TableHead className="font-bold">{t('column_strategy_pair')}</TableHead>
                    <TableHead className="font-bold text-center">{t('column_strategy_roi')}</TableHead>
                    <TableHead className="font-bold text-center">{t('column_strategy_mdd')}</TableHead>
                    <TableHead className="font-bold text-center">{t('column_strategy_winrate')}</TableHead>
                    <TableHead className="font-bold">{t('column_status')}</TableHead>
                    <TableHead className="text-right font-bold">{t('column_actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {strategies.map((strategy) => {
                    const parsedConfig = parseStrategyConfig(strategy, t('all_pairs'));
                    const metrics = getStrategyMetrics(strategy);

                    return (
                        <TableRow key={strategy.id} className="group hover:bg-slate-50/80 transition-colors">
                            <TableCell className="text-xs font-medium text-slate-400">#{strategy.id}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-900">{strategy.name}</span>
                                    <span className="text-xs font-mono text-slate-400 mt-0.5">{strategy.strategy_key}</span>
                                </div>
                            </TableCell>
                            <TableCell>{renderStrategyTypeBadge(parsedConfig.type, t)}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-xs uppercase font-bold text-slate-500 border-slate-200">
                                    {parsedConfig.pair}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-center">{renderPercentMetric(metrics.return_pct)}</TableCell>
                            <TableCell className="text-center">
                                <span className="text-xs font-semibold text-rose-500 underline decoration-rose-500/20 underline-offset-4">
                                    {typeof metrics.max_drawdown_pct === 'number'
                                        ? `${Math.abs(metrics.max_drawdown_pct).toFixed(2)}%`
                                        : '--'}
                                </span>
                            </TableCell>
                            <TableCell className="text-center">
                                <span className="text-xs font-bold text-slate-700">
                                    {typeof metrics.win_rate === 'number' ? `${metrics.win_rate.toFixed(1)}%` : '--'}
                                </span>
                            </TableCell>
                            <TableCell>{renderStrategyStatusBadge(strategy.status, t)}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg group-hover:bg-white transition-colors">
                                            <MoreHorizontal className="h-4 w-4 text-slate-400 group-hover:text-slate-900" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-2xl border-none shadow-2xl p-2">
                                        <DropdownMenuLabel className="text-xs font-black uppercase text-slate-400 px-3 py-2">
                                            {t('actions')}
                                        </DropdownMenuLabel>
                                        <Link to={`/admin/strategies/${strategy.id}/edit`}>
                                            <DropdownMenuItem className="rounded-xl cursor-pointer">
                                                <TrendingUp className="mr-3 h-4 w-4 text-primary" /> {t('edit_strategy')}
                                            </DropdownMenuItem>
                                        </Link>
                                        <DropdownMenuSeparator className="bg-slate-50" />

                                        {strategy.status === 'active' ? (
                                            <DropdownMenuItem
                                                className="rounded-xl text-amber-600 focus:bg-amber-50 focus:text-amber-600 cursor-pointer"
                                                onClick={() => onUnpublish(strategy.id)}
                                            >
                                                <Pause className="mr-3 h-4 w-4" /> {t('unpublish')}
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem
                                                className="rounded-xl text-emerald-600 focus:bg-emerald-50 focus:text-emerald-600 cursor-pointer"
                                                onClick={() => onPublish(strategy.id)}
                                            >
                                                <Play className="mr-3 h-4 w-4" /> {t('publish')}
                                            </DropdownMenuItem>
                                        )}

                                        <DropdownMenuItem className="rounded-xl cursor-pointer" onClick={() => onViewSecret(strategy.id)}>
                                            <ShieldAlert className="mr-3 h-4 w-4 text-amber-500" /> {t('view_secret')}
                                        </DropdownMenuItem>

                                        <DropdownMenuItem className="rounded-xl cursor-pointer" onClick={() => onRotateSecret(strategy.id)}>
                                            <Zap className="mr-3 h-4 w-4 text-sky-500" /> {t('rotate_secret')}
                                        </DropdownMenuItem>

                                        <DropdownMenuItem className="rounded-xl cursor-pointer" onClick={() => onImport(strategy.id)}>
                                            <Upload className="mr-3 h-4 w-4 text-indigo-500" /> {t('import_csv')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    );
                })}

                {!strategies.length && !isLoading && !isError && (
                    <TableRow>
                        <TableCell colSpan={9} className="h-64 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                                <BarChart2 className="w-12 h-12 opacity-20" />
                                <p className="font-medium">{t('no_data')}</p>
                            </div>
                        </TableCell>
                    </TableRow>
                )}

                {isError && !isLoading && (
                    <TableRow>
                        <TableCell colSpan={9} className="h-64 text-center">
                            <div className="flex flex-col items-center justify-center text-rose-500 gap-3">
                                <AlertTriangle className="w-12 h-12 opacity-80" />
                                <p className="font-medium">{strategyErrorText}</p>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
));

StrategiesTable.displayName = 'StrategiesTable';
