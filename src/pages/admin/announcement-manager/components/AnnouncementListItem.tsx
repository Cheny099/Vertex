import { memo, useCallback, type MouseEvent } from 'react';
import type { TFunction } from 'i18next';
import { Megaphone, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AnnouncementAdminResponse } from '@/api/types';

interface AnnouncementListItemProps {
    t: TFunction;
    item: AnnouncementAdminResponse;
    toAnnouncementCardDate: (value: string | null | undefined) => string;
    isPublishPending: boolean;
    isUnpublishPending: boolean;
    isDeletePending: boolean;
    onOpenEdit: (id: number) => void;
    onPublish: (id: number) => void;
    onUnpublish: (id: number) => void;
    onDelete: (id: number) => void;
}

function AnnouncementListItemComponent({
    t,
    item,
    toAnnouncementCardDate,
    isPublishPending,
    isUnpublishPending,
    isDeletePending,
    onOpenEdit,
    onPublish,
    onUnpublish,
    onDelete,
}: AnnouncementListItemProps) {
    const handleOpen = useCallback(() => {
        if (item.deleted_at) return;
        onOpenEdit(item.id);
    }, [item.deleted_at, item.id, onOpenEdit]);

    const handlePublish = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            onPublish(item.id);
        },
        [item.id, onPublish]
    );

    const handleUnpublish = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            onUnpublish(item.id);
        },
        [item.id, onUnpublish]
    );

    const handleDelete = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            onDelete(item.id);
        },
        [item.id, onDelete]
    );

    return (
        <div
            className={cn(
                'flex items-center justify-between p-4 rounded-lg border border-border/40 bg-background/50 transition-colors',
                item.deleted_at ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-muted/50'
            )}
            onClick={handleOpen}
        >
            <div className="flex items-center gap-4">
                <div className={cn('p-2 rounded-full', item.show_popup ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary')}>
                    <Megaphone className="w-4 h-4" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold">{item.title}</h4>
                        {item.is_pinned && (
                            <span className="text-xs bg-amber-500/10 text-amber-600 px-1 rounded border border-amber-500/20 font-bold uppercase">
                                {t('admin:is_pinned')}
                            </span>
                        )}
                        {item.deleted_at ? (
                            <span className="text-xs bg-destructive/10 text-destructive px-1 rounded border border-destructive/20 font-bold uppercase">
                                {t('admin:announcements_status_deleted', 'Deleted')}
                            </span>
                        ) : item.is_published ? (
                            <span className="text-xs bg-emerald-500/10 text-emerald-600 px-1 rounded border border-emerald-500/20 font-bold uppercase">
                                {t('admin:published', 'Published')}
                            </span>
                        ) : (
                            <span className="text-xs bg-slate-500/10 text-slate-600 px-1 rounded border border-slate-500/20 font-bold uppercase">
                                {t('admin:draft', 'Draft')}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                        <span className="uppercase bg-secondary px-1.5 rounded">{item.lang}</span>
                        <span>{toAnnouncementCardDate(item.created_at || item.updated_at)}</span>
                        {item.show_popup && <span className="text-red-500 font-bold">{t('admin:popup_badge')}</span>}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {!item.deleted_at &&
                    (item.is_published ? (
                        <Button variant="outline" size="sm" onClick={handleUnpublish} disabled={isUnpublishPending}>
                            {t('admin:announcements_unpublish', 'Unpublish')}
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" onClick={handlePublish} disabled={isPublishPending}>
                            {t('admin:announcements_publish', 'Publish')}
                        </Button>
                    ))}
                {!item.deleted_at && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                        onClick={handleDelete}
                        disabled={isDeletePending}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

export const AnnouncementListItem = memo(AnnouncementListItemComponent);
