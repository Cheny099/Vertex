import { memo } from 'react';
import type { TFunction } from 'i18next';
import { format } from 'date-fns';
import type { AdminAuditLogItem } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AuditLogMetaDialog } from './AuditLogMetaDialog';

type BadgeVariant = 'destructive' | 'default' | 'secondary' | 'outline';

interface AuditLogsTableProps {
  t: TFunction<'admin' | 'common'>;
  logs: AdminAuditLogItem[];
  isError: boolean;
  isLoading: boolean;
  queryErrorText: string;
  getActionColor: (value: string) => BadgeVariant;
  formatAction: (value: string) => string;
  formatTargetType: (value: string) => string;
}

function AuditLogsTableBase({
  t,
  logs,
  isError,
  isLoading,
  queryErrorText,
  getActionColor,
  formatAction,
  formatTargetType,
}: AuditLogsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">{t('admin:column_time')}</TableHead>
            <TableHead>{t('admin:column_actor')}</TableHead>
            <TableHead>{t('admin:column_action')}</TableHead>
            <TableHead>{t('admin:column_target')}</TableHead>
            <TableHead className="w-[80px]">{t('admin:column_meta')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isError ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-destructive">
                {queryErrorText}
              </TableCell>
            </TableRow>
          ) : isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                {t('admin:loading')}
              </TableCell>
            </TableRow>
          ) : logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                {t('admin:no_data')}
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                </TableCell>
                <TableCell>{log.actor_email}</TableCell>
                <TableCell>
                  <Badge variant={getActionColor(log.action)}>
                    {formatAction(log.action)}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <span className="font-sans text-sm">{formatTargetType(log.target_type)}</span>
                  {log.target_id && (
                    <span className="ml-1 text-muted-foreground">
                      {log.target_id === 'batch' ? `(${t('admin:status_all')})` : `#${log.target_id}`}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {log.meta ? (
                    <AuditLogMetaDialog
                      t={t}
                      log={log}
                      formatAction={formatAction}
                      formatTargetType={formatTargetType}
                    />
                  ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled />
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export const AuditLogsTable = memo(AuditLogsTableBase);
