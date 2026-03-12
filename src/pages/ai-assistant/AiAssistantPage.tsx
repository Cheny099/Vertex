import { Sparkles } from "lucide-react";

import {
  AiAssistantStatsGrid,
  AiAssistantStatusBadge,
  AiAssistantStrategyCard,
} from "./components/AiAssistantSummarySections";
import { AiAssistantOptimizationLog } from "./components/AiAssistantOptimizationLog";
import { AiAssistantPerformanceChart } from "./components/AiAssistantPerformanceChart";
import { useAiAssistantModel } from "./hooks/useAiAssistantModel";

function AiAssistantPage() {
  const { chartData, optimizationLogs, statCards, strategySummary, t } = useAiAssistantModel();

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Sparkles className="h-8 w-8 animate-pulse text-primary" />
            {t("admin:ai_assistant.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t("admin:ai_assistant.description")}</p>
        </div>
        <AiAssistantStatusBadge
          title={t("admin:ai_assistant.status_active")}
          subtitle={t("admin:ai_assistant.status_desc")}
        />
      </div>

      <AiAssistantStatsGrid statCards={statCards} />

      <AiAssistantPerformanceChart
        chartData={chartData}
        beforeAiLabel={t("admin:ai_assistant.before_ai")}
        afterAiLabel={t("admin:ai_assistant.after_ai")}
        title={t("admin:ai_assistant.performance_chart")}
        description="Real-time strategy rotation performance visualization."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AiAssistantStrategyCard
          description={t("admin:ai_assistant.active_strategy")}
          notice={t("admin:ai_assistant.ai_notice")}
          subtitle={strategySummary.subtitle}
          title={strategySummary.title}
        />

        <AiAssistantOptimizationLog
          items={optimizationLogs}
          realTimeLabel="Real-time Updates"
          title={t("admin:ai_assistant.optimization_log")}
        />
      </div>
    </div>
  );
}

export default AiAssistantPage;
