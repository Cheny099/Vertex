export interface BackfillContext {
  exists: boolean;
  enabled: boolean;
  running: boolean;
  totalBackfilled: number;
  totalFailed: number;
  lookback: unknown;
  limitCount: unknown;
}

export interface ExchangeStatsRow {
  exchange: string;
  scanned: number;
  updated: number;
  failed: number;
  missingExternal: number;
  missingPrice: number;
  missingNotional: number;
  missingExecutedAt: number;
}

export interface SummaryCardItem {
  key: string;
  displayKey: string;
  count: unknown;
  isAmount: boolean;
  isError: boolean;
  isWarn: boolean;
  filterKind: string;
  isClicked: boolean;
  isRelated: boolean;
}
