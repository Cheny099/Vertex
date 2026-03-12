import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import type { AuditItemPageResponse, AuditRunDetail } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Globe, Layers } from 'lucide-react';
import { AuditItemsFilterBar } from './AuditItemsFilterBar';
import { AuditRunItemsTable } from './AuditRunItemsTable';
import { AuditBackfillStatusCard } from './AuditBackfillStatusCard';
import { AuditExchangeStatsGrid } from './AuditExchangeStatsGrid';
import { AuditSummaryCardsGrid } from './AuditSummaryCardsGrid';
import type {
  BackfillContext,
  ExchangeStatsRow,
  SummaryCardItem,
} from './audit-run-insights-panel-types';

type SeverityBadgeVariant = 'default' | 'destructive' | 'secondary' | 'outline';

interface AuditRunInsightsPanelProps {
  t: TFunction;
  runDetail?: AuditRunDetail;
  backfillContext: BackfillContext;
  exchangeStatsRows: ExchangeStatsRow[];
  summaryCards: SummaryCardItem[];
  kindFilter: string;
  kindFilterDisplayValue: string;
  severityFilter: string;
  itemsLoading: boolean;
  itemsError: boolean;
  itemsErrorObj: unknown;
  itemsData: AuditItemPageResponse | undefined;
  onSummaryCardClick: (key: string, filterKind: string) => void;
  onKindFilterInput: (value: string) => void;
  onClearKindFilter: () => void;
  onSeverityFilterChange: (value: string) => void;
  onResetFilters: () => void;
  toQueryErrorText: (err: unknown) => string;
  getSeverityIcon: (severity?: string) => ReactNode;
  getSeverityBadge: (severity?: string) => SeverityBadgeVariant;
  getKindStyling: (kind: string) => string;
}

export function AuditRunInsightsPanel({
  t,
  runDetail,
  backfillContext,
  exchangeStatsRows,
  summaryCards,
  kindFilter,
  kindFilterDisplayValue,
  severityFilter,
  itemsLoading,
  itemsError,
  itemsErrorObj,
  itemsData,
  onSummaryCardClick,
  onKindFilterInput,
  onClearKindFilter,
  onSeverityFilterChange,
  onResetFilters,
  toQueryErrorText,
  getSeverityIcon,
  getSeverityBadge,
  getKindStyling,
}: AuditRunInsightsPanelProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {runDetail && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {backfillContext.exists && (
            <AuditBackfillStatusCard backfillContext={backfillContext} t={t} />
          )}

          <div className="flex flex-col justify-center p-4 rounded-3xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                {runDetail.scope === 'exchanges' ? (
                  <Globe className="h-4 w-4 text-primary" />
                ) : (
                  <Layers className="h-4 w-4 text-primary" />
                )}
              </div>
              <div>
                <div className="text-xs font-black text-muted-foreground uppercase tracking-widest leading-tight">
                  {t('admin:audit_scope')}
                </div>
                <div className="text-sm font-bold text-primary capitalize">
                  {t(`admin:scope_${runDetail.scope || 'users'}`)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AuditExchangeStatsGrid exchangeStatsRows={exchangeStatsRows} t={t} />

      <AuditSummaryCardsGrid
        summaryCards={summaryCards}
        onSummaryCardClick={onSummaryCardClick}
        t={t}
      />

      <AuditItemsFilterBar
        t={t}
        kindFilter={kindFilter}
        kindFilterDisplayValue={kindFilterDisplayValue}
        severityFilter={severityFilter}
        onKindFilterInput={onKindFilterInput}
        onClearKindFilter={onClearKindFilter}
        onSeverityFilterChange={onSeverityFilterChange}
        onResetFilters={onResetFilters}
      />

      <AuditRunItemsTable
        t={t}
        itemsLoading={itemsLoading}
        itemsError={itemsError}
        itemsErrorObj={itemsErrorObj}
        itemsData={itemsData}
        toQueryErrorText={toQueryErrorText}
        getSeverityIcon={getSeverityIcon}
        getSeverityBadge={getSeverityBadge}
        getKindStyling={getKindStyling}
      />
    </div>
  );
}
