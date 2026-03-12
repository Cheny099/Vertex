import type { Locale } from 'date-fns';
import { format } from 'date-fns';

import type { AnnouncementLang } from '@/api/types';

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
} as const;

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
} as const;

export type AnnouncementFormData = {
  title: string;
  content_md: string;
  lang: AnnouncementLang;
  show_popup: boolean;
  is_pinned: boolean;
  popup_start_at: string;
  popup_end_at: string;
};

export type AnnouncementFilters = {
  lang: AnnouncementLang;
  include_unpublished: boolean;
  include_deleted: boolean;
  limit: number;
  offset: number;
};

export const DEFAULT_FORM: AnnouncementFormData = {
  title: '',
  content_md: '',
  lang: 'zh',
  show_popup: false,
  is_pinned: false,
  popup_start_at: '',
  popup_end_at: '',
};

export const toDatetimeLocalValue = (raw?: string | null): string => {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

export const toApiDateTime = (raw: string): string | null => {
  if (!raw.trim()) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

export const parseLocalDateTime = (raw: string): Date | null => {
  if (!raw.trim()) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

export type DateTimeFieldProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  timeLabel: string;
  clearLabel: string;
  calendarLocale: Locale;
};

export function resolveAnnouncementMeta(total: number, filters: AnnouncementFilters) {
  const pageSize = filters.limit || 50;
  const offset = filters.offset || 0;
  const currentPage = Math.floor(offset / pageSize) + 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = offset > 0;
  const canNext = offset + pageSize < total;
  return { pageSize, offset, currentPage, totalPages, canPrev, canNext };
}

export function toAnnouncementCardDate(input?: string | null): string {
  try {
    const d = new Date(input || Date.now());
    return isNaN(d.getTime()) ? '-' : format(d, 'yyyy-MM-dd HH:mm');
  } catch {
    return '-';
  }
}
