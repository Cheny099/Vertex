import { memo } from 'react';
import type { TFunction } from 'i18next';
import { Filter, RefreshCw, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type AuditItemsFilterBarProps = {
  t: TFunction;
  kindFilter: string;
  kindFilterDisplayValue: string;
  severityFilter: string;
  onKindFilterInput: (value: string) => void;
  onClearKindFilter: () => void;
  onSeverityFilterChange: (value: string) => void;
  onResetFilters: () => void;
};

function AuditItemsFilterBarImpl({
  t,
  kindFilter,
  kindFilterDisplayValue,
  severityFilter,
  onKindFilterInput,
  onClearKindFilter,
  onSeverityFilterChange,
  onResetFilters,
}: AuditItemsFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center p-2 rounded-xl bg-slate-50 border border-slate-200 shadow-sm shadow-slate-200/50">
      <div className="flex items-center gap-2 mr-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          {t('admin:filter_data')}
        </span>
      </div>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
        <Input
          placeholder={t('admin:filter_kind')}
          value={kindFilterDisplayValue}
          onChange={(e) => onKindFilterInput(e.target.value)}
          className="h-9 pl-9 bg-background/50 border-border/50 focus-visible:ring-primary/20 transition-all font-medium"
        />
        {kindFilter && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-50 hover:opacity-100"
            onClick={onClearKindFilter}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Select value={severityFilter || 'all'} onValueChange={onSeverityFilterChange}>
          <SelectTrigger className="h-9 w-[120px] bg-background/50 border-border/50">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  !severityFilter
                    ? 'bg-muted-foreground/30'
                    : severityFilter === 'error'
                      ? 'bg-destructive'
                      : severityFilter === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                )}
              />
              <SelectValue placeholder={t('admin:severity')} />
            </div>
          </SelectTrigger>
          <SelectContent className="backdrop-blur-md">
            <SelectItem value="all">{t('admin:severity_all')}</SelectItem>
            <SelectItem value="info">{t('admin:severity_info')}</SelectItem>
            <SelectItem value="warning">{t('admin:severity_warning')}</SelectItem>
            <SelectItem value="error">{t('admin:severity_error')}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 bg-background/50 border-border/50"
          onClick={onResetFilters}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export const AuditItemsFilterBar = memo(AuditItemsFilterBarImpl);

