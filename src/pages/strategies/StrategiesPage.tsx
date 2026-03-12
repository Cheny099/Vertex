import { motion } from 'framer-motion';
import { ArrowDownAz, ArrowUpAz, CheckCircle, Play, Search, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { StrategyMarketCard } from './components/StrategyMarketCard';
import { type SortField, type TabType, useStrategiesPageModel } from './hooks/useStrategiesPageModel';

const TABS: Array<{ id: TabType; icon: typeof Play }> = [
  { id: 'running', icon: Play },
  { id: 'library', icon: Zap },
  { id: 'my', icon: CheckCircle },
];

export default function StrategiesPage() {
  const { t } = useTranslation(['strategies']);
  const { isAdmin } = useAuth();
  const {
    activeTab,
    filteredStrategies,
    getStatusLabel,
    getStatusTone,
    getTypeLabel,
    isLoading,
    isSubscribed,
    libraryCount,
    myCount,
    runningCount,
    searchQuery,
    setActiveTab,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    sortBy,
    sortOrder,
  } = useStrategiesPageModel();

  const getTabCount = (tabId: TabType) => {
    if (tabId === 'running') return runningCount;
    if (tabId === 'my') return myCount;
    return libraryCount;
  };

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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">{t('strategies:title')}</h1>
          <p className="text-muted-foreground">{t('strategies:subtitle')}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 border-b border-border pb-4 overflow-x-auto scrollbar-hide"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={
              activeTab === tab.id
                ? 'flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap flex-1 sm:flex-none bg-primary text-primary-foreground shadow-md'
                : 'flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap flex-1 sm:flex-none hover:bg-secondary text-muted-foreground hover:text-foreground'
            }
          >
            <tab.icon className="w-4 h-4 hidden xs:block" />
            <span className="font-medium text-sm sm:text-base">{t(`strategies:tabs.${tab.id}`)}</span>
            <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs h-5 px-1.5 min-w-[1.25rem] flex items-center justify-center">
              {getTabCount(tab.id)}
            </Badge>
          </button>
        ))}
      </motion.div>

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
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center shrink-0">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortField)}>
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
            onClick={() => setSortOrder((previous) => (previous === 'asc' ? 'desc' : 'asc'))}
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            className="shrink-0 h-10 w-10"
          >
            {sortOrder === 'asc' ? <ArrowUpAz className="w-4 h-4" /> : <ArrowDownAz className="w-4 h-4" />}
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {filteredStrategies.map((strategy, index) => (
          <StrategyMarketCard
            key={strategy.id}
            getStatusLabel={getStatusLabel}
            getStatusTone={getStatusTone}
            getTypeLabel={getTypeLabel}
            index={index}
            isAdmin={isAdmin}
            isSubscribed={isSubscribed(strategy.id)}
            strategy={strategy}
            t={t}
          />
        ))}
      </div>

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
}
