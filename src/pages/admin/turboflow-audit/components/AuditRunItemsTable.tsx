import { useMemo, type ReactNode } from 'react';
import type { TFunction } from 'i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, AlertTriangle, Layers } from 'lucide-react';
import type { AuditItem } from '@/api';
import { AuditRunItemRow } from './AuditRunItemRow';

type SeverityBadgeVariant = 'default' | 'destructive' | 'secondary' | 'outline';

interface AuditRunItemsTableProps {
    t: TFunction;
    itemsLoading: boolean;
    itemsError: boolean;
    itemsErrorObj: unknown;
    itemsData: { items?: AuditItem[] } | undefined;
    toQueryErrorText: (err: unknown) => string;
    getSeverityIcon: (severity?: string) => ReactNode;
    getSeverityBadge: (severity?: string) => SeverityBadgeVariant;
    getKindStyling: (kind: string) => string;
}

export function AuditRunItemsTable({
    t,
    itemsLoading,
    itemsError,
    itemsErrorObj,
    itemsData,
    toQueryErrorText,
    getSeverityIcon,
    getSeverityBadge,
    getKindStyling,
}: AuditRunItemsTableProps) {
    const items = useMemo(
        () => (Array.isArray(itemsData?.items) ? itemsData.items.filter(Boolean) : []),
        [itemsData?.items]
    );

    return (
        <div className="rounded-xl border border-border/50 overflow-hidden shadow-sm">
            <Table className="[&_td]:py-2 [&_td]:px-3 [&_th]:py-2 [&_th]:px-3 text-xs whitespace-nowrap">
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="w-24 pl-6">{t('admin:severity')}</TableHead>
                        <TableHead>{t('admin:kind')}</TableHead>
                        <TableHead>{t('admin:account')}</TableHead>
                        <TableHead>{t('admin:order')}</TableHead>
                        <TableHead className="w-20 text-right pr-6">{t('admin:detail')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(() => {
                        if (itemsLoading) {
                            return (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-50">
                                            <Activity className="h-6 w-6 animate-spin" />
                                            <span className="text-xs font-medium">{t('admin:loading')}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        }

                        if (itemsError) {
                            return (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-destructive">
                                        <div className="flex flex-col items-center gap-2 px-6">
                                            <AlertTriangle className="h-6 w-6 opacity-80" />
                                            <span className="text-xs font-medium break-all">{toQueryErrorText(itemsErrorObj)}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        }

                        if (items.length === 0) {
                            return (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <Layers className="h-8 w-8" />
                                            <span className="text-sm font-medium">{t('admin:no_items')}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        }

                        return items.map((item) => (
                            <AuditRunItemRow
                                key={String(item.id)}
                                t={t}
                                item={item}
                                getSeverityIcon={getSeverityIcon}
                                getSeverityBadge={getSeverityBadge}
                                getKindStyling={getKindStyling}
                            />
                        ));
                    })()}
                </TableBody>
            </Table>
        </div>
    );
}
