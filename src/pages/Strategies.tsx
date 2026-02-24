
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Play, Pause, Settings2, MoreVertical,
  Search, History as HistoryIcon, BarChart3, LineChart,
  Zap, Edit2, Copy, CheckCircle, ArrowUpDown, ArrowDownAz, ArrowUpAz
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { strategyApi, subscriptionApi, type Strategy } from '@/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

// Tab 类型定义
type TabType = 'running' | 'library' | 'my';
type SortField = 'newest' | 'roi' | 'drawdown' | 'win_rate' | 'profit_factor';
type SortOrder = 'asc' | 'desc';

const Strategies = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation(['strategies', 'common']); // Add namespaces
  const [activeTab, setActiveTab] = useState<TabType>('running');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('newest');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const typeMap: Record<string, string> = {
    'grid': t('strategies:types.grid'),
    'trend': t('strategies:types.trend'),
    'martingale': t('strategies:types.martingale'),
    'fixed': t('strategies:types.fixed'),
  };

  // 使用 React Query 获取策略列表和订阅列表
  const { data: allStrategies = [], isLoading: isStrategiesLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => strategyApi.getAll(),
    refetchInterval: 5000,
  });

  const { data: subscriptions = [], isLoading: isSubsLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionApi.list(),
  });

  const isLoading = isStrategiesLoading || isSubsLoading;

  // 辅助函数：检查策略是否已订阅
  const isSubscribed = (strategyId: number) => subscriptions.some(s => s.strategy_id === strategyId);

  // Tab Labels
  const tabs = [
    { id: 'running' as TabType, label: t('strategies:tabs.running'), icon: Play },
    { id: 'library' as TabType, label: t('strategies:tabs.library'), icon: Zap },
    { id: 'my' as TabType, label: t('strategies:tabs.my'), icon: CheckCircle },
  ];

  // 根据 Tab 筛选策略
  const filteredStrategies = useMemo(() => {
    let result = [...allStrategies];

    // Tab 筛选
    if (activeTab === 'running') {
      // 运行中 = 已订阅 且 策略状态为活跃/非活跃
      result = result.filter(s => isSubscribed(s.id) && (s.status === 'active' || s.status === 'inactive'));
    } else if (activeTab === 'library') {
      // 策略库 = 所有策略
      result = [...allStrategies];
    } else if (activeTab === 'my') {
      // 已订阅 = 只要订阅了就显示
      result = result.filter(s => isSubscribed(s.id));
    }

    // 搜索筛选
    if (searchQuery) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 排序逻辑
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'newest':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'roi':
          comparison = (a.metrics?.all?.return_pct || 0) - (b.metrics?.all?.return_pct || 0);
          break;
        case 'drawdown':
          comparison = (a.metrics?.all?.max_drawdown_pct || 0) - (b.metrics?.all?.max_drawdown_pct || 0);
          break;
        case 'win_rate':
          comparison = (a.metrics?.all?.win_rate || 0) - (b.metrics?.all?.win_rate || 0);
          break;
        case 'profit_factor':
          comparison = (a.metrics?.all?.profit_factor || 0) - (b.metrics?.all?.profit_factor || 0);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [allStrategies, subscriptions, activeTab, searchQuery, sortBy, sortOrder]);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">{t('strategies:title')}</h1>
          <p className="text-muted-foreground">{t('strategies:subtitle')}</p>
        </div>
        {/* 用户无法创建策略，隐藏新建按钮 */}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 border-b border-border pb-4 overflow-x-auto scrollbar-hide"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap flex-1 sm:flex-none",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "hover:bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-4 h-4 hidden xs:block" />
            <span className="font-medium text-sm sm:text-base">{tab.label}</span>
            <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs h-5 px-1.5 min-w-[1.25rem] flex items-center justify-center">
              {allStrategies.filter(s =>
                tab.id === 'running' ? (isSubscribed(s.id) && (s.status === 'active' || s.status === 'inactive')) :
                  tab.id === 'library' ? true :
                    isSubscribed(s.id)
              ).length}
            </Badge>
          </button>
        ))}
      </motion.div>

      {/* Search and Sort */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2 sm:gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('strategies:search_placeholder')}
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center shrink-0">
          <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortField)}>
            <SelectTrigger className="w-[110px] sm:w-[160px] h-10 px-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="truncate text-foreground font-medium">{t(`strategies:sort.options.${sortBy}`)}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t('strategies:sort.options.newest')}</SelectItem>
              <SelectItem value="roi">{t('strategies:sort.options.roi')}</SelectItem>
              <SelectItem value="drawdown">{t('strategies:sort.options.drawdown')}</SelectItem>
              <SelectItem value="win_rate">{t('strategies:sort.options.win_rate')}</SelectItem>
              <SelectItem value="profit_factor">{t('strategies:sort.options.profit_factor')}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            title={sortOrder === 'asc' ? "Ascending" : "Descending"}
            className="shrink-0 h-10 w-10"
          >
            {sortOrder === 'asc' ? <ArrowUpAz className="w-4 h-4" /> : <ArrowDownAz className="w-4 h-4" />}
          </Button>
        </div>
      </motion.div>

      {/* Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {filteredStrategies.map((strategy, index) => (
          <motion.div
            key={strategy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
            className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/strategies/${strategy.id}`)}
          >
            <div className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    strategy.status === 'active' && "bg-profit/10",
                    strategy.status === 'inactive' && "bg-warning/10",
                    !strategy.status && "bg-muted"
                  )}>
                    {strategy.status === 'active' ? (
                      <Play className="w-4 h-4 text-profit fill-profit" />
                    ) : (
                      <Pause className="w-4 h-4 text-warning" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{strategy.name}</h3>
                      {isSubscribed(strategy.id) && (
                        <Badge variant="outline" className="text-[10px] bg-profit/5 text-profit border-profit/20">
                          {t('strategies:card.subscribed')}
                        </Badge>
                      )}
                      <Badge
                        variant={strategy.status === 'active' ? 'default' : 'secondary'}
                        className={cn(
                          "text-xs",
                          strategy.status === 'active' && "bg-profit/10 text-profit border-profit/20",
                          strategy.status === 'inactive' && "bg-warning/10 text-warning border-warning/20"
                        )}
                      >
                        {strategy.status === 'active' ? t('strategies:card.online') : t('strategies:card.maintenance')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{strategy.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => navigate(`/strategies/${strategy.id}/signals`)}>
                        <HistoryIcon className="w-4 h-4 mr-2" />
                        {t('strategies:card.menu.history')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>


              {/* 核心数据矩阵 (Metrics Matrix) */}
              <div className="grid grid-cols-2 gap-2 mb-4 bg-secondary/10 rounded-lg p-2.5 border border-border/50">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{t('strategies:card.labels.roi_all')}</span>
                  <span className={cn(
                    "font-mono text-lg font-bold tracking-tight",
                    (strategy.metrics?.all?.return_pct || 0) >= 0 ? "text-profit" : "text-destructive"
                  )}>
                    {strategy.metrics?.all ? `${(strategy.metrics.all.return_pct).toFixed(1)}%` : '--'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{t('strategies:card.labels.max_drawdown')}</span>
                  <span className="font-mono text-lg font-bold text-foreground tracking-tight">
                    {strategy.metrics?.all ? `${(strategy.metrics.all.max_drawdown_pct).toFixed(1)}%` : '--'}
                  </span>
                </div>
                <div className="flex flex-col pt-2 border-t border-border/40">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{t('strategies:card.labels.win_rate')}</span>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {strategy.metrics?.all ? `${(strategy.metrics.all.win_rate).toFixed(0)}%` : '--'}
                  </span>
                </div>
                <div className="flex flex-col pt-2 border-t border-border/40">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{t('strategies:card.labels.profit_factor')}</span>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {strategy.metrics?.all?.profit_factor != null ? strategy.metrics.all.profit_factor.toFixed(1) : '--'}
                  </span>
                </div>
              </div>

              {/* 基础信息 (Secondary Info - Moved Down) */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 bg-secondary/20 p-2 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  <span>{strategy.pair || strategy.config?.pair || '-'}</span>
                </div>
                <div className="w-px h-3 bg-border"></div>
                <div>{typeMap[strategy.type || ''] || typeMap[strategy.config?.type || ''] || strategy.type || '-'}</div>
                <div className="w-px h-3 bg-border"></div>
                <div>{new Date(strategy.created_at).toLocaleDateString()}</div>
              </div>

              {/* Action Buttons - Enhanced */}
              <div className="flex items-center justify-end pt-4 border-t border-border">
                <div className="flex gap-2 items-center">
                  {!isSubscribed(strategy.id) ? (
                    <Button
                      size="sm"
                      className="gradient-primary h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/strategies/${strategy.id}`);
                      }}
                    >
                      {t('strategies:card.actions.subscribe')}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/strategies/${strategy.id}`);
                        }}
                      >
                        {t('strategies:card.actions.manage')}
                      </Button>
                    </div>
                  )}

                  {/* 移动端菜单入口 */}
                  <div className="md:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/strategies/${strategy.id}`);
                      }}
                    >
                      {t('strategies:card.actions.view')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredStrategies.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Zap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('strategies:empty.title')}</h3>
          <p className="text-muted-foreground">{t('strategies:empty.desc')}</p>
        </motion.div>
      )}
    </div>
  );
};

export default Strategies;
