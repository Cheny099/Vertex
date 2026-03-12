import type { TFunction } from 'i18next';
import type { AuditItem } from '@/api';

export interface AuditDetailSectionsProps {
  t: TFunction;
  item: AuditItem;
}
