import type { TFunction } from 'i18next';
import type { AnnouncementLang } from '@/api/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface AnnouncementFiltersBarProps {
  t: TFunction<'admin' | 'common'>;
  lang: AnnouncementLang;
  includeUnpublished: boolean;
  includeDeleted: boolean;
  onLangChange: (value: AnnouncementLang) => void;
  onIncludeUnpublishedChange: (checked: boolean) => void;
  onIncludeDeletedChange: (checked: boolean) => void;
}

export function AnnouncementFiltersBar({
  t,
  lang,
  includeUnpublished,
  includeDeleted,
  onLangChange,
  onIncludeUnpublishedChange,
  onIncludeDeletedChange,
}: AnnouncementFiltersBarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Select value={lang} onValueChange={(value) => onLangChange(value as AnnouncementLang)}>
        <SelectTrigger className="h-10 bg-white/80">
          <SelectValue placeholder={t('admin:announcements_filter_lang', 'Language')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('admin:announcements_lang_all', 'All languages')}</SelectItem>
          <SelectItem value="zh">{t('admin:lang_zh')}</SelectItem>
          <SelectItem value="en">{t('admin:lang_en')}</SelectItem>
        </SelectContent>
      </Select>
      <div className="h-10 flex items-center justify-between rounded-lg border border-slate-200/70 bg-white/70 px-3">
        <Label htmlFor="include-unpublished" className="text-sm font-medium">
          {t('admin:announcements_filter_include_unpublished', 'Include unpublished')}
        </Label>
        <Switch
          id="include-unpublished"
          checked={includeUnpublished}
          onCheckedChange={onIncludeUnpublishedChange}
        />
      </div>
      <div className="h-10 flex items-center justify-between rounded-lg border border-slate-200/70 bg-white/70 px-3">
        <Label htmlFor="include-deleted" className="text-sm font-medium">
          {t('admin:announcements_filter_include_deleted', 'Include deleted')}
        </Label>
        <Switch
          id="include-deleted"
          checked={includeDeleted}
          onCheckedChange={onIncludeDeletedChange}
        />
      </div>
    </div>
  );
}
