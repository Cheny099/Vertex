/**
 * @anchor-id LEADERBOARD_PAGE
 * @module-type page
 * @disposable false
 * @description 排行榜页面
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaderboardApi, dashboardApi, strategyApi } from '@/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

import { useTranslation } from 'react-i18next'; // Import hook

type Scope = 'daily' | 'total' | 'strategies';

const Leaderboard = () => {
  const { t } = useTranslation(['leaderboard']); // Use namespace
  const [scope, setScope] = useState<Scope>('daily');

  const { data: leaderboard, isLoading: isLbLoading } = useQuery({
    queryKey: ['leaderboard', scope],
    queryFn: () => leaderboardApi.getGlobal({ scope: scope as any, limit: 20 }),
    enabled: scope !== 'strategies',
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardApi.getStats(),
    enabled: scope === 'strategies',
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: allStrategies } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => strategyApi.getAll(),
    enabled: scope === 'strategies',
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const isLoading = scope === 'strategies' ? isStatsLoading : isLbLoading;

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400 fill-gray-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-amber-600 fill-amber-600" />;
      default:
        return (
          <span className="font-bold text-muted-foreground w-6 text-center">
            {index + 1}
          </span>
        );
    }
  };

  const title = scope === 'strategies' ? t('titles.hot_strategies') : t('titles.revenue_rank');

  const desc =
    scope === 'strategies'
      ? t('descriptions.strategies')
      : scope === 'daily'
        ? t('descriptions.daily')
        : t('descriptions.total');

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-8 h-8 text-primary" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{desc}</CardDescription>
            </div>

            <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)} className="w-[320px]">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="daily">{t('scopes.daily')}</TabsTrigger>
                <TabsTrigger value="total">{t('scopes.total')}</TabsTrigger>
                <TabsTrigger value="strategies">{t('scopes.strategies')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="w-32 h-6" />
                  <Skeleton className="w-20 h-6" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{t('table.rank')}</TableHead>
                  <TableHead>{scope === 'strategies' ? t('table.strategy') : t('table.user')}</TableHead>
                  <TableHead className="text-right">
                    {scope === 'strategies' ? t('table.subscribers') : t('table.pnl')}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {scope === 'strategies' ? (
                  (stats?.strategies || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">{t('table.empty_strategies')}</TableCell>
                    </TableRow>
                  ) : (
                    (stats?.strategies || [])
                      .sort((a, b) => b.subscription_count - a.subscription_count)
                      .map((item, index) => {
                        const strategy = (allStrategies || []).find((s) => s.id === item.strategy_id);
                        return (
                          <TableRow key={item.strategy_id}>
                            <TableCell>{getRankIcon(index)}</TableCell>
                            <TableCell className="font-medium">
                              {strategy?.name || `Strategy #${item.strategy_id}`}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {t('subscribers_unit', { count: item.subscription_count })}
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )
                ) : (
                  (leaderboard?.items?.length || 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        {t('table.empty_users')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaderboard?.items.map((item, index) => (
                      <TableRow key={item.user_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center justify-center w-8">
                            {getRankIcon(index)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                              <User className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <span className="font-medium">{item.display_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={cn(
                              "font-mono font-bold",
                              item.pnl > 0 ? "text-profit" : item.pnl < 0 ? "text-loss" : "text-muted-foreground"
                            )}
                          >
                            {item.pnl > 0 ? '+' : ''}{item.pnl.toFixed(2)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;
