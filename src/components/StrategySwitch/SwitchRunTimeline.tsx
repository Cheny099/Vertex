
import { StrategySwitchRun } from "@/api/types";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle, Clock, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface SwitchRunTimelineProps {
    run: StrategySwitchRun;
}

interface SwitchRunAction {
    step: string;
    status?: string;
    at?: string;
    error?: string;
    message?: string;
    details?: Record<string, unknown>;
}

export const SwitchRunTimeline = ({ run }: SwitchRunTimelineProps) => {
    const { t } = useTranslation(['admin', 'strategies', 'common']);

    // Extract actions from meta
    const actions: SwitchRunAction[] = Array.isArray(run.meta?.actions) ? run.meta.actions : [];

    // If no actions recorded yet
    if (actions.length === 0) {
        return (
            <div className="text-sm text-muted-foreground p-4 text-center space-y-2">
                <div>{t('admin:strategy_switch.waiting_for_steps', 'Waiting for execution steps...')}</div>
                {(run.status === 'FAILED' || run.status === 'CANCELLED') && (
                    <div className="text-xs text-destructive font-mono bg-destructive/5 p-2 rounded border border-destructive/10">
                        {run.error_message || `Task ${run.status}`}
                    </div>
                )}
            </div>
        );
    }

    return (
        <ScrollArea className="h-[300px] w-full pr-4">
            <div className="relative border-l border-muted ml-3 space-y-6 py-2">
                {actions.map((action, index) => {
                    const isLast = index === actions.length - 1;
                    const isFailed = action.status === 'FAILED' || run.status === 'FAILED' && isLast;
                    const isSuccess = action.status === 'SUCCESS' || action.status === 'COMPLETED';
                    const isRunning = action.status === 'RUNNING' || action.status === 'STARTED';

                    return (
                        <div key={index} className="relative pl-6">
                            {/* Icon Dot */}
                            <div className={cn(
                                "absolute -left-[9px] top-0 bg-background rounded-full p-0.5",
                                isFailed ? "text-red-500" :
                                    isSuccess ? "text-green-500" :
                                        isRunning ? "text-blue-500" : "text-muted-foreground"
                            )}>
                                {isFailed ? <XCircle className="w-4 h-4" /> :
                                    isSuccess ? <CheckCircle2 className="w-4 h-4" /> :
                                        isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                            <Circle className="w-4 h-4" />}
                            </div>

                            {/* Content */}
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">
                                        {t(`strategies:switch_step.${action.step}`, action.step) as string}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-auto font-mono">
                                        {action.at ? new Date(action.at).toLocaleTimeString() : '-'}
                                    </span>
                                </div>

                                {/* Detailed status/message */}
                                {action.message && (
                                    <div className="text-xs text-muted-foreground">
                                        {action.message}
                                    </div>
                                )}

                                {/* Error Output (if any) */}
                                {(action.error || (isFailed && run.error_message && isLast)) && (
                                    <div className="mt-1 p-2 bg-destructive/10 text-destructive text-xs rounded border border-destructive/20 font-mono break-all">
                                        {action.error || run.error_message}
                                    </div>
                                )}

                                {/* Collapsible Details (if complex data exists) */}
                                {action.details && Object.keys(action.details).length > 0 && (
                                    <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value="details" className="border-none">
                                            <AccordionTrigger className="py-1 text-xs text-muted-foreground hover:no-underline">
                                                {t('common:view_details')}
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <pre className="text-[10px] bg-muted p-2 rounded overflow-auto max-h-[100px]">
                                                    {JSON.stringify(action.details, null, 2)}
                                                </pre>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
};
