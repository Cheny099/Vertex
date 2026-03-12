import { memo } from 'react';
import type { TFunction } from 'i18next';
import { format } from 'date-fns';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AdminInviteListItem } from '@/api/types';

interface InviteCodesTableProps {
  t: TFunction<'admin' | 'common'>;
  items: AdminInviteListItem[];
  isError: boolean;
  isLoading: boolean;
  queryErrorText: string;
  revokePendingId?: number;
  onRequestRevoke: (id: number) => void;
}

function InviteCodesTableBase({
  t,
  items,
  isError,
  isLoading,
  queryErrorText,
  revokePendingId,
  onRequestRevoke,
}: InviteCodesTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('admin:invites.column_id', 'ID')}</TableHead>
            <TableHead>{t('admin:invites.column_channel', 'Channel')}</TableHead>
            <TableHead>{t('admin:invites.column_code', 'Code Hint')}</TableHead>
            <TableHead>{t('admin:invites.column_uses', 'Usage')}</TableHead>
            <TableHead>{t('admin:invites.column_status', 'Status')}</TableHead>
            <TableHead>{t('admin:invites.column_created', 'Created At')}</TableHead>
            <TableHead>{t('admin:invites.column_expires', 'Expires At')}</TableHead>
            <TableHead className="text-right">{t('admin:invites.column_actions', 'Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isError ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-destructive">
                {queryErrorText}
              </TableCell>
            </TableRow>
          ) : isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
              </TableCell>
            </TableRow>
          ) : !items.length ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                {t('admin:no_data', 'No data available')}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const isRevoked = !!item.revoked_at;
              const isFullyUsed = item.used_count >= item.max_uses;

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.id}</TableCell>
                  <TableCell>
                    <span className="font-medium">{item.channel || '-'}</span>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={item.notes}>
                        {item.notes}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">{item.code_hint}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={isFullyUsed ? 'text-warning font-medium' : ''}>
                        {item.used_count} / {item.max_uses}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isRevoked ? (
                      <Badge variant="destructive" className="bg-destructive/20 text-destructive border-0">
                        {t('admin:invites.status_revoked', 'Revoked')}
                      </Badge>
                    ) : isFullyUsed ? (
                      <Badge variant="outline" className="opacity-50">
                        {t('admin:invites.status_exhausted', 'Exhausted')}
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none border-0">
                        {t('admin:invites.status_active', 'Active')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.expires_at ? format(new Date(item.expires_at), 'yyyy-MM-dd HH:mm') : t('admin:invites.never_expire', 'Never')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={isRevoked}
                      onClick={() => onRequestRevoke(item.id)}
                    >
                      {revokePendingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export const InviteCodesTable = memo(InviteCodesTableBase);
