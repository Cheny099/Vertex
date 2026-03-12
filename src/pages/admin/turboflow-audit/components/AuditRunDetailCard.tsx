import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import { AlertTriangle, Activity, FileText, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AuditRunDetailCardProps {
  t: TFunction;
  selectedRunId: number | null;
  detailLoading: boolean;
  detailError: boolean;
  detailErrorText: string;
  children: ReactNode;
}

export function AuditRunDetailCard({
  t,
  selectedRunId,
  detailLoading,
  detailError,
  detailErrorText,
  children,
}: AuditRunDetailCardProps) {
  return (
    <Card className="lg:col-span-2 bg-white/60 backdrop-blur-md border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)] flex flex-col">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {selectedRunId ? t('admin:run_detail', { id: selectedRunId }) : t('admin:select_run')}
          </CardTitle>
          {selectedRunId && (
            <Badge variant="outline" className="font-mono text-xs bg-muted/50">
              ID: {String(selectedRunId)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-6">
        {!selectedRunId ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground gap-4">
            <div className="p-4 rounded-full bg-muted/30">
              <Search className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-lg">{t('admin:select_run')}</p>
              <p className="text-sm opacity-60">{t('admin:select_run_to_view')}</p>
            </div>
          </div>
        ) : detailLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Activity className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm font-medium animate-pulse">{t('admin:loading')}</span>
          </div>
        ) : detailError ? (
          <div className="flex flex-col items-center justify-center py-32 text-destructive gap-3 px-6 text-center">
            <AlertTriangle className="h-10 w-10 opacity-80" />
            <span className="text-sm font-medium">{detailErrorText}</span>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
