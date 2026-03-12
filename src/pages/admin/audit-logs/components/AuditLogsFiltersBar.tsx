import type { TFunction } from 'i18next';
import type { DateRange } from 'react-day-picker';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';

interface AuditLogsFiltersBarProps {
  t: TFunction<'admin' | 'common'>;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  dateRange: DateRange | undefined;
  onActorChange: (value: string) => void;
  onActionChange: (value: string) => void;
  onTargetTypeChange: (value: string) => void;
  onTargetIdChange: (value: string) => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function AuditLogsFiltersBar({
  t,
  actor,
  action,
  targetType,
  targetId,
  dateRange,
  onActorChange,
  onActionChange,
  onTargetTypeChange,
  onTargetIdChange,
  onDateRangeChange,
}: AuditLogsFiltersBarProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('admin:filter_actor_placeholder')}
            value={actor}
            onChange={(e) => onActorChange(e.target.value)}
            className="h-10 pl-8 bg-white/80"
          />
        </div>
      </div>
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder={t('admin:filter_action_placeholder')}
          value={action}
          onChange={(e) => onActionChange(e.target.value)}
          className="h-10 bg-white/80"
        />
      </div>
      <div className="w-[180px]">
        <Input
          placeholder={t('admin:filter_target_placeholder')}
          value={targetType}
          onChange={(e) => onTargetTypeChange(e.target.value)}
          className="h-10 bg-white/80"
        />
      </div>
      <div className="w-[180px]">
        <Input
          placeholder={t('admin:filter_target_id_placeholder', 'Target ID')}
          value={targetId}
          onChange={(e) => onTargetIdChange(e.target.value)}
          className="h-10 bg-white/80"
        />
      </div>
      <div className="w-auto">
        <DatePickerWithRange
          date={dateRange}
          setDate={onDateRangeChange}
        />
      </div>
    </div>
  );
}
