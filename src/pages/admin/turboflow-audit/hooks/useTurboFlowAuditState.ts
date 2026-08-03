import { useState } from 'react';

export function useTurboFlowAuditState() {
  const [lookbackDays, setLookbackDays] = useState<number | null>(7);
  const [mode, setMode] = useState<'local_only' | 'full'>('local_only');
  const [dryRun, setDryRun] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [kindFilter, setKindFilter] = useState<string>('');
  const [clickedKey, setClickedKey] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('');

  return {
    lookbackDays,
    setLookbackDays,
    mode,
    setMode,
    dryRun,
    setDryRun,
    selectedRunId,
    setSelectedRunId,
    kindFilter,
    setKindFilter,
    clickedKey,
    setClickedKey,
    severityFilter,
    setSeverityFilter,
  };
}
