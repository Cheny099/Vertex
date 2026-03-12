import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { strategyApi, webhookEventsApi } from "@/api";
import { usePageVisibility } from "@/hooks/use-page-visibility";

function useStrategySignalsModel() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const isPageVisible = usePageVisibility();

  const strategyQuery = useQuery({
    queryKey: ["strategy", id],
    queryFn: () => strategyApi.get(Number(id)),
    enabled: !!id,
  });

  const eventsQuery = useQuery({
    queryKey: ["webhook-events", strategyQuery.data?.strategy_key],
    queryFn: () => webhookEventsApi.list({ strategy_key: strategyQuery.data?.strategy_key || "" }),
    enabled: !!strategyQuery.data?.strategy_key,
    refetchInterval: isPageVisible ? 5000 : false,
  });

  const stats = useMemo(() => {
    if (!eventsQuery.data) {
      return { distinct: 0, dups: 0, total: 0 };
    }

    const distinct = eventsQuery.data.length;
    const dups = eventsQuery.data.reduce((total, current) => total + (current.duplicate_count || 0), 0);
    return {
      distinct,
      dups,
      total: distinct + dups,
    };
  }, [eventsQuery.data]);

  const pageError = (eventsQuery.error || strategyQuery.error) as (Error & { status?: number }) | null;
  const httpStatus = Number(pageError?.status || 0);

  return {
    events: eventsQuery.data,
    httpStatus,
    id,
    isEventsError: eventsQuery.isError,
    isEventsLoading: eventsQuery.isLoading,
    isStrategyError: strategyQuery.isError,
    isStrategyLoading: strategyQuery.isLoading,
    navigate,
    stats,
    strategyData: strategyQuery.data,
  };
}

export { useStrategySignalsModel };
