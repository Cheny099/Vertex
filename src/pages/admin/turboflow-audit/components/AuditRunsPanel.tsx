import type { TFunction } from 'i18next';
import type { AuditRunResponse } from '@/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Activity, ChevronRight, Globe, History, Layers, RefreshCw, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatSecure, safeT, toRecord } from '../utils';

type StatusVariant = 'default' | 'destructive' | 'outline' | 'secondary';

interface AuditRunsPanelProps {
  t: TFunction;
  runsLoading: boolean;
  runsError: boolean;
  runsErrorText: string;
  runs: AuditRunResponse[];
  selectedRunId: number | null;
  onSelectRun: (id: number) => void;
  onRefresh: () => void;
  getStatusVariant: (status?: string) => StatusVariant;
  getStatusLabel: (status?: string) => string;
}

export function AuditRunsPanel({
  t,
  runsLoading,
  runsError,
  runsErrorText,
  runs,
  selectedRunId,
  onSelectRun,
  onRefresh,
  getStatusVariant,
  getStatusLabel,
}: AuditRunsPanelProps) {
  return (
    <Card className="lg:col-span-1 bg-white/60 backdrop-blur-md border border-white/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t('admin:audit_runs')}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onRefresh} className="hover:rotate-180 transition-transform duration-500">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          {runsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Activity className="h-8 w-8 animate-pulse text-primary/40" />
              <span className="text-sm font-medium animate-pulse">{t('admin:loading')}</span>
            </div>
          ) : runsError ? (
            <div className="flex flex-col items-center justify-center py-20 text-destructive gap-3 px-6 text-center">
              <AlertTriangle className="h-10 w-10 opacity-80" />
              <span className="text-sm font-medium">{runsErrorText}</span>
            </div>
          ) : runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 opacity-60">
              <Layers className="h-10 w-10 text-muted-foreground/20" />
              <span className="text-sm">{t('admin:no_runs')}</span>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {runs.filter(Boolean).map((run) => {
                const s = toRecord(run.summary);
                const errCount = Number(s.error ?? s.ERROR ?? 0);
                const warnCount = Number(s.warning ?? s.WARN ?? s.WARNING ?? 0);
                const runMode = run.params?.mode === 'full' ? 'full' : 'local_only';

                return (
                  <div
                    key={String(run.id)}
                    onClick={() => onSelectRun(run.id)}
                    className={cn(
                      'group p-4 cursor-pointer transition-all relative overflow-hidden',
                      selectedRunId === run.id ? 'bg-primary/5' : 'hover:bg-muted/30',
                    )}
                  >
                    {selectedRunId === run.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-primary">#{String(run.id)}</span>
                        <Badge
                          variant={getStatusVariant(run.status)}
                          className={cn('text-xs uppercase font-bold px-1.5 py-0', run.status === 'running' && 'animate-pulse')}
                        >
                          {getStatusLabel(run.status)}
                        </Badge>
                      </div>
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 transition-transform text-muted-foreground/50',
                          selectedRunId === run.id
                            ? 'translate-x-0 opacity-100'
                            : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100',
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Globe className="h-3 w-3" />
                      {formatSecure(run.started_at, 'MM-dd HH:mm:ss')}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs bg-background/50 border-border/50 text-muted-foreground">
                          {runMode === 'full' ? <Zap className="h-2.5 w-2.5 mr-1 text-amber-500" /> : <Layers className="h-2.5 w-2.5 mr-1 text-blue-500" />}
                          {safeT(t, runMode === 'full' ? 'admin:mode_full' : 'admin:mode_local_only')}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        {Number(errCount) > 0 && (
                          <div className="flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="h-3 w-3" />
                            {String(errCount)}
                          </div>
                        )}
                        {Number(warnCount) > 0 && (
                          <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="h-3 w-3" />
                            {String(warnCount)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
