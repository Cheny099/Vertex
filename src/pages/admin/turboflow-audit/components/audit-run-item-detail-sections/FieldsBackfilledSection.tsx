import { CheckCircle, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { safeT } from '../../utils';
import type { AuditDetailSectionsProps } from './types';

export function FieldsBackfilledSection({ t, item }: AuditDetailSectionsProps) {
  if (!item.detail?.fields) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 text-sm font-bold text-emerald-600">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            <Zap className="h-4 w-4" />
          </div>
          <span>{safeT(t, 'admin:backfilled_fields')}</span>
        </div>
        {Array.isArray(item.detail.fields_updated) && (
          <Badge variant="outline" className="text-xs font-black border-emerald-500/30 text-emerald-600 bg-emerald-500/5 px-2.5 shadow-sm">
            {t('admin:backfill_update_msg', { count: item.detail.fields_updated.length })}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(item.detail.fields).map(([field, value]) => (
          <div
            key={field}
            className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white/40 border border-border/50 shadow-sm group transition-all hover:border-emerald-500/30 hover:shadow-md"
          >
            <span className="text-xs uppercase font-black text-muted-foreground tracking-widest leading-none">
              {safeT(t, `admin:field_labels.${String(field).toLowerCase()}`, String(field))}
            </span>
            <div className="flex items-center justify-between gap-2 overflow-hidden">
              <span className="font-mono text-sm font-black text-emerald-600 truncate">{String(value)}</span>
              <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <CheckCircle className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
