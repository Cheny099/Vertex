import { ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FieldsBackfilledSection } from './audit-run-item-detail-sections/FieldsBackfilledSection';
import { ExternalMissingLocalSection } from './audit-run-item-detail-sections/ExternalMissingLocalSection';
import { MissingFieldSection } from './audit-run-item-detail-sections/MissingFieldSection';
import { NotionalMismatchSection } from './audit-run-item-detail-sections/NotionalMismatchSection';
import { StatusMismatchSection } from './audit-run-item-detail-sections/StatusMismatchSection';
import type { AuditDetailSectionsProps } from './audit-run-item-detail-sections/types';

export function AuditAdviceSection({ t, item }: AuditDetailSectionsProps) {
  if (!item.detail?.advice) {
    return null;
  }

  return (
    <div className="p-4 rounded-2xl bg-primary/[0.03] border border-dashed border-primary/20 flex items-start gap-4 shadow-inner group transition-all hover:bg-primary/[0.05]">
      <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
        <ShieldAlert className="h-5 w-5" />
      </div>
      <div className="text-xs space-y-1.5 flex-1">
        <div className="flex items-center justify-between">
          <span className="font-black text-primary uppercase tracking-widest text-xs opacity-70">
            {t('admin:audit_advice')}
          </span>
          <Badge
            variant="outline"
            className="text-xs h-4 px-1.5 opacity-40 border-primary/20 pointer-events-none uppercase font-bold"
          >
            {t('admin:audit_advice')}
          </Badge>
        </div>
        <p className="leading-relaxed font-bold text-slate-700 italic">"{item.detail.advice}"</p>
      </div>
    </div>
  );
}

export function AuditKindStructuredSection({ t, item }: AuditDetailSectionsProps) {
  if (!item.detail) {
    return null;
  }

  if (item.kind === 'STATUS_MISMATCH') {
    return <StatusMismatchSection t={t} item={item} />;
  }

  if (item.kind === 'NOTIONAL_MISMATCH') {
    return <NotionalMismatchSection t={t} item={item} />;
  }

  if (item.kind === 'EXTERNAL_MISSING_LOCAL' || item.kind === 'LOCAL_NOT_FOUND_IN_ORDER_LIST') {
    return <ExternalMissingLocalSection t={t} item={item} />;
  }

  if (
    item.kind === 'LOCAL_COMPLETED_MISSING_TF_ORDER_ID'
    || item.kind === 'COMPLETED_NO_EXEC_PRICE'
    || item.kind === 'CLOSE_NO_PNL'
  ) {
    return <MissingFieldSection t={t} item={item} />;
  }

  if (item.kind === 'FIELDS_BACKFILLED' && item.detail.fields) {
    return <FieldsBackfilledSection t={t} item={item} />;
  }

  return null;
}
