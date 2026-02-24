
import { StrategySwitchCampaign } from "@/api/types";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";

interface BulkSwitchStatsProps {
    campaign: StrategySwitchCampaign;
}

export const BulkSwitchStats = ({ campaign }: BulkSwitchStatsProps) => {
    const { t } = useTranslation(['admin', 'strategies', 'common']);

    const counts = campaign.counts || {};
    const total = counts.total || 0;
    const processed = (counts.success || 0) + (counts.failed || 0) + (counts.skipped || 0) + (counts.skipped_conflict || 0);
    const progress = total > 0 ? (processed / total) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* 1. Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                    <span>{t('admin:strategy_switch.campaign_progress')}</span>
                    <span>{Math.round(progress)}% ({processed}/{total})</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {/* 2. Stat Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title={t('common:status.success')}
                    count={counts.success || 0}
                    icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
                    bg="bg-green-500/10"
                    textColor="text-green-700"
                />
                <StatCard
                    title={t('common:status.failed')}
                    count={counts.failed || 0}
                    icon={<XCircle className="w-4 h-4 text-red-500" />}
                    bg="bg-red-500/10"
                    textColor="text-red-700"
                />
                <StatCard
                    title={t('admin:strategy_switch.skipped')}
                    count={(counts.skipped || 0) + (counts.skipped_conflict || 0)}
                    icon={<AlertCircle className="w-4 h-4 text-yellow-500" />}
                    bg="bg-yellow-500/10"
                    textColor="text-yellow-700"
                />
                <StatCard
                    title={t('common:status.pending')}
                    count={counts.pending || 0}
                    icon={<Clock className="w-4 h-4 text-muted-foreground" />}
                    bg="bg-muted"
                    textColor="text-muted-foreground"
                />
            </div>

            {/* 3. Recent Failed Runs List */}
            {campaign.recent_failed_runs && campaign.recent_failed_runs.length > 0 && (
                <Card className="border-destructive/20">
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                            <XCircle className="w-4 h-4" />
                            {t('admin:strategy_switch.recent_failures')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 pb-3">
                        <ScrollArea className="h-[200px]">
                            <div className="space-y-2">
                                {campaign.recent_failed_runs.map((run) => (
                                    <div key={run.run_id} className="text-xs p-2 bg-muted/50 rounded flex flex-col gap-1 border border-destructive/10">
                                        <div className="flex justify-between font-medium">
                                            <span>Run #{run.run_id} (Acc: {run.account_id})</span>
                                            <Badge variant="destructive" className="h-4 text-[9px] px-1">{run.failed_step}</Badge>
                                        </div>
                                        <div className="text-muted-foreground break-all">
                                            {run.error_message || t('common:unknown_error')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

const StatCard = ({ title, count, icon, bg, textColor }: any) => (
    <div className={`p-3 rounded-lg flex flex-col items-center justify-center gap-1 ${bg}`}>
        <div className="flex items-center gap-1.5 opacity-80">
            {icon}
            <span className={`text-xs font-medium ${textColor}`}>{title}</span>
        </div>
        <span className={`text-xl font-bold ${textColor}`}>{count}</span>
    </div>
);
