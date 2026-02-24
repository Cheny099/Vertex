/**
 * @anchor-id TYPE_DEFINITIONS
 * @module-type types
 * @disposable false
 * @description 数据类型定义 - 后端对接时根据 API 文档调整
 */

// ===== 策略相关类型 =====

export interface Strategy {
    id: string;
    name: string;
    description: string;
    pair: string;
    status: StrategyStatus;
    profit: string;
    profitValue: string;
    trades: number;
    winRate: string;
    runtime: string;
    investment: string;
}

export type StrategyStatus = 'running' | 'paused' | 'stopped';

export interface CreateStrategyDto {
    name: string;
    type: string;
    pair: string;
    investment: number;
    // ... 待后端定义
}

// ===== 持仓相关类型 =====

export interface Position {
    id: string;
    symbol: string;
    side: 'long' | 'short';
    size: string;
    entryPrice: string;
    currentPrice: string;
    unrealizedPnl: string;
    unrealizedPnlPercent: string;
}

// ===== 交易记录类型 =====

export interface Trade {
    id: string;
    strategyName: string;
    pair: string;
    side: 'buy' | 'sell';
    price: string;
    amount: string;
    total: string;
    fee: string;
    time: string;
    pnl?: string;
}

export interface TradeHistoryParams {
    page?: number;
    limit?: number;
    strategyId?: string;
    startDate?: string;
    endDate?: string;
}

// ===== 仪表盘类型 =====

export interface DashboardStats {
    totalAssets: string;
    todayPnl: string;
    todayPnlPercent: string;
    runningStrategies: number;
    totalStrategies: number;
    totalProfit: string;
    totalProfitPercent: string;
}



// ===== 用户相关类型 =====

export interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    is_admin?: boolean;
    can_subscribe?: boolean;
    invite_code_id?: number | null;
    invite_channel?: string | null;
}

// ===== API 响应类型 =====

export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
