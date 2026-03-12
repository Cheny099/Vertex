import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Clock, Fingerprint } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useStrategySignalsModel } from "./hooks/useStrategySignalsModel";

function StrategySignalsPage() {
  const { t } = useTranslation(["strategies", "common"]);
  const {
    events,
    httpStatus,
    isEventsError,
    isEventsLoading,
    isStrategyError,
    isStrategyLoading,
    navigate,
    stats,
    strategyData,
  } = useStrategySignalsModel();

  if (isStrategyLoading || (strategyData && isEventsLoading)) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <Skeleton key={item} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const isUnauthorized = httpStatus === 401;
  const isForbidden = httpStatus === 403;
  const isNotFound = httpStatus === 404;

  if (isStrategyError || isEventsError) {
    if (isNotFound) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 lg:p-8">
          <p className="text-muted-foreground">{t("strategies:signals.not_found_error")}</p>
          <Button variant="link" onClick={() => navigate("/strategies")}>{t("strategies:detail.back_list")}</Button>
        </div>
      );
    }

    if (isUnauthorized || isForbidden) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 p-6 lg:p-8">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold">{t("strategies:signals.permission_title")}</h2>
          <p className="text-muted-foreground">{t("strategies:signals.permission_desc")}</p>
          <Button onClick={() => navigate("/strategies")}>{t("strategies:detail.back_list")}</Button>
        </div>
      );
    }

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 p-6 lg:p-8">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">{t("strategies:signals.load_failed")}</h2>
        <Button onClick={() => navigate(-1)}>{t("common:back")}</Button>
      </div>
    );
  }

  if (!strategyData) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 lg:p-8">
        <p className="text-muted-foreground">{t("strategies:signals.not_found_error")}</p>
        <Button variant="link" onClick={() => navigate("/strategies")}>{t("strategies:detail.back_list")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("strategies:signals.title")}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{strategyData.name}</span>
            <Badge variant="outline" className="font-mono text-xs">{strategyData.strategy_key}</Badge>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <p className="text-xs uppercase text-muted-foreground">{t("strategies:signals.total_signals")}</p>
          <p className="mt-1 font-mono text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <p className="text-xs uppercase text-muted-foreground">{t("strategies:signals.distinct_events")}</p>
          <p className="mt-1 font-mono text-2xl font-bold text-primary">{stats.distinct}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <p className="text-xs uppercase text-muted-foreground">{t("strategies:signals.duplicate_filtered")}</p>
          <p className="mt-1 font-mono text-2xl font-bold text-yellow-500">{stats.dups}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Clock className="h-5 w-5 text-primary" />
          {t("strategies:signals.event_log")}
        </h3>

        {events && events.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border/40 bg-card/50">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group flex flex-col border-b border-border/40 p-4 transition-colors last:border-0 hover:bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("h-2 w-2 rounded-full", event.is_duplicate || event.duplicate_count > 0 ? "bg-yellow-500" : "bg-green-500")} />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{t("strategies:signals.event_id", "ID")}: {event.id}</span>
                        {event.duplicate_count > 0 ? (
                          <Badge variant="secondary" className="h-4 border-yellow-500/20 bg-yellow-500/10 px-1 text-[10px] text-yellow-600">
                            {event.duplicate_count} {t("strategies:signals.dups_abbr")}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground" title={t("strategies:signals.payload_hash_title", "Payload Hash")}>
                        <Fingerprint className="h-3 w-3" />
                        <span className="font-mono">{event.payload_hash.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-right">
                    <p className="font-mono text-sm font-medium">{new Date(event.created_at).toLocaleTimeString()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleDateString()}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("strategies:signals.last_seen", { defaultValue: "Last seen" })}: {new Date(event.last_seen_at || event.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
            <p>{t("strategies:signals.no_events")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StrategySignalsPage;
