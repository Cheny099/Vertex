import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { aiPerformanceSeries } from "../mockData";

type StatCard = {
  accent?: "green" | "primary";
  description: string;
  title: string;
  value: string;
  badgeLabel?: string;
};

type StrategySummary = {
  subtitle: string;
  title: string;
};

type OptimizationLogItem = {
  id: number;
  isLatest: boolean;
  summary: string;
  timeLabel: string;
  title: string;
};

function useAiAssistantModel() {
  const { t } = useTranslation(["admin", "common"]);

  const statCards = useMemo<StatCard[]>(
    () => [
      {
        description: t("admin:ai_assistant.before_ai"),
        title: t("admin:ai_assistant.roi_label"),
        value: "18.52%",
      },
      {
        accent: "primary",
        badgeLabel: "HIGH",
        description: t("admin:ai_assistant.after_ai"),
        title: t("admin:ai_assistant.roi_label"),
        value: "118.40%",
      },
      {
        accent: "green",
        description: t("admin:ai_assistant.roi_improvement"),
        title: t("admin:ai_assistant.multiplier_label"),
        value: "+539%",
      },
    ],
    [t],
  );

  const strategySummary = useMemo<StrategySummary>(
    () => ({
      subtitle: "AI Selected - High Confidence",
      title: "ETH 极限趋势策略 v4.2",
    }),
    [],
  );

  const optimizationLogs = useMemo<OptimizationLogItem[]>(
    () =>
      [1, 2, 3].map((id) => ({
        id,
        isLatest: id === 1,
        summary: t("admin:ai_assistant.switch_reason"),
        timeLabel: id === 1 ? t("admin:ai_assistant.log_time_now") : t("admin:ai_assistant.log_time_hours_ago", { hours: id * 4 }),
        title: t("admin:ai_assistant.log_event_switch"),
      })),
    [t],
  );

  return {
    chartData: aiPerformanceSeries,
    optimizationLogs,
    statCards,
    strategySummary,
    t,
  };
}

export { useAiAssistantModel };
