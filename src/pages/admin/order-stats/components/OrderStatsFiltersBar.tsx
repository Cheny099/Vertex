import type { Dispatch, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { OrderStatsGroupBy } from '../utils';

interface OrderStatsFiltersBarProps {
  t: TFunction<'admin' | 'common'>;
  dateRange: DateRange | undefined;
  setDateRange: Dispatch<SetStateAction<DateRange | undefined>>;
  groupBy: OrderStatsGroupBy;
  onGroupByChange: (value: string) => void;
  exchange: string;
  onExchangeChange: (value: string) => void;
}

export function OrderStatsFiltersBar({
  t,
  dateRange,
  setDateRange,
  groupBy,
  onGroupByChange,
  exchange,
  onExchangeChange,
}: OrderStatsFiltersBarProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="w-auto">
        <DatePickerWithRange date={dateRange} setDate={setDateRange} />
      </div>
      <div className="w-[150px]">
        <Select value={groupBy} onValueChange={onGroupByChange}>
          <SelectTrigger className="h-10 bg-white/80">
            <SelectValue placeholder={t('admin:group_by')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">{t('admin:group_day')}</SelectItem>
            <SelectItem value="user">{t('admin:group_user')}</SelectItem>
            <SelectItem value="account">{t('admin:group_account')}</SelectItem>
            <SelectItem value="symbol">{t('admin:group_symbol')}</SelectItem>
            <SelectItem value="strategy">{t('admin:group_strategy')}</SelectItem>
            <SelectItem value="subscription">{t('admin:group_subscription')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="w-[150px]">
        <Select value={exchange} onValueChange={onExchangeChange}>
          <SelectTrigger className="h-10 bg-white/80">
            <SelectValue placeholder={t('admin:exchange')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin:status_all')}</SelectItem>
            <SelectItem value="binance_futures">{t('common:exchanges.binance_futures')}</SelectItem>
            <SelectItem value="gate_futures">{t('common:exchanges.gate_futures')}</SelectItem>
            <SelectItem value="week">{t('common:exchanges.week')}</SelectItem>
            <SelectItem value="turboflow">{t('common:exchanges.turboflow')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
