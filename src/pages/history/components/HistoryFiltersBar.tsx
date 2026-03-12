import { memo } from 'react';
import type { TFunction } from 'i18next';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HistoryAccountOption {
  id: number;
  name: string;
  exchange: string;
}

interface HistoryFiltersBarProps {
  t: TFunction;
  viewMode: 'system' | 'turboflow';
  searchInput: string;
  onSearchChange: (value: string) => void;
  accountValue: string;
  onAccountChange: (value: string) => void;
  accounts: HistoryAccountOption[];
  turboflowAccounts: HistoryAccountOption[];
  tfStatus: string;
  onTfStatusChange: (value: string) => void;
  selectedPair: string;
  onPairChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  hasFilters: boolean;
  onClear: () => void;
  pairOptions: string[];
  typeOptions: string[];
}

function HistoryFiltersBarComponent({
  t,
  viewMode,
  searchInput,
  onSearchChange,
  accountValue,
  onAccountChange,
  accounts,
  turboflowAccounts,
  tfStatus,
  onTfStatusChange,
  selectedPair,
  onPairChange,
  selectedType,
  onTypeChange,
  hasFilters,
  onClear,
  pairOptions,
  typeOptions,
}: HistoryFiltersBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col sm:flex-row gap-4"
    >
      <div className="relative flex-1">
        <Input
          placeholder={t('history:filters.search_placeholder')}
          className="pl-4"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={accountValue} onValueChange={onAccountChange}>
          <SelectTrigger className="w-[160px] border-primary/50 bg-primary/5">
            <SelectValue placeholder={t('history:filters.account_placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {viewMode === 'system' ? (
              <>
                <SelectItem value="all">{t('history:filters.all_accounts')}</SelectItem>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id.toString()}>
                    {acc.name} ({acc.exchange})
                  </SelectItem>
                ))}
              </>
            ) : (
              turboflowAccounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id.toString()}>
                  {acc.name} ({acc.exchange})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {viewMode === 'turboflow' && (
          <Select value={tfStatus} onValueChange={onTfStatusChange}>
            <SelectTrigger className="w-[160px] border-primary/50 bg-primary/5">
              <SelectValue placeholder={t('history:filters.status_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('history:filters.all')}</SelectItem>
              <SelectItem value="Pending">{t('history:filters.tf_status.pending')}</SelectItem>
              <SelectItem value="Filled">{t('history:filters.tf_status.filled')}</SelectItem>
              <SelectItem value="Cancelled">{t('history:filters.tf_status.cancelled')}</SelectItem>
              <SelectItem value="Rejected">{t('history:filters.tf_status.rejected')}</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Select value={selectedPair} onValueChange={onPairChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('history:filters.pair_placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {pairOptions.map((pair) => (
              <SelectItem key={pair} value={pair}>
                {pair === 'all' ? t('history:filters.all') : pair}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder={t('history:filters.type_placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((type) => (
              <SelectItem key={type} value={type}>
                {type === 'all'
                  ? t('history:filters.all')
                  : type === 'buy'
                    ? t('history:filters.buy')
                    : t('history:filters.sell')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="w-4 h-4 mr-1" />
            {t('history:filters.clear')}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export const HistoryFiltersBar = memo(HistoryFiltersBarComponent);
