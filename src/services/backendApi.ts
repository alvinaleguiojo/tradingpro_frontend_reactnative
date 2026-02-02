// Backend NestJS API Service
import * as SecureStore from 'expo-secure-store';

// Backend API base URL - update this to your computer's IP address
// Use your local IP for physical device testing (e.g., http://192.168.1.4:4000)
// Use http://localhost:4000 for web browser testing
// Use http://10.0.2.2:4000 for Android emulator
const BACKEND_API_URL = 'https://tradingpro-backend-nestjs.vercel.app';
const BACKEND_URL_KEY = 'backend_api_url';

// Get the configured backend URL
export const getBackendUrl = async (): Promise<string> => {
  try {
    const storedUrl = await SecureStore.getItemAsync(BACKEND_URL_KEY);
    return storedUrl || BACKEND_API_URL;
  } catch {
    return BACKEND_API_URL;
  }
};

// Set the backend URL
export const setBackendUrl = async (url: string): Promise<void> => {
  await SecureStore.setItemAsync(BACKEND_URL_KEY, url);
};

// ================== TYPES ==================

export interface MoneyManagementLevel {
  level: number;
  balance: number;
  lotSize: number;
  dailyTarget: number;
  weeklyTarget: number;
  monthlyTarget: number;
  completed: boolean;
}

export interface AccountState {
  id: string;
  accountId: string;
  currentBalance: number;
  currentLevel: number;
  currentLotSize: number;
  dailyProfit: number;
  weeklyProfit: number;
  monthlyProfit: number;
  dailyTargetReached: boolean;
  weeklyTargetReached: boolean;
  monthlyTargetReached: boolean;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  lastTradingDay: string;
}

export interface MoneyManagementStatus {
  accountState: AccountState;
  currentLevel: MoneyManagementLevel;
  nextLevel: MoneyManagementLevel | null;
  progressToNextLevel: number;
  dailyTargetProgress: number;
  weeklyTargetProgress: number;
  monthlyTargetProgress: number;
  recommendedLotSize: number;
  shouldStopTrading: {
    stop: boolean;
    reason: string | null;
  };
}

export interface TradingStatus {
  enabled: boolean;
  running: boolean;
  symbol: string;
  timeframe: string;
  nextRun: string;
}

export interface TradingSignal {
  id: string;
  symbol: string;
  timeframe: string;
  signalType: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  strength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  reasoning: string;
  ictAnalysis: any;
  createdAt: string;
}

export interface Trade {
  id: string;
  mt5Ticket: number;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  profit: number;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  openedAt: string;
  closedAt: string | null;
}

export interface TradeStats {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
}

export interface TradingLog {
  id: string;
  eventType: string;
  message: string;
  data: any;
  level: 'info' | 'warn' | 'error';
  createdAt: string;
}

export interface MarketAnalysis {
  symbol: string;
  timeframe: string;
  marketStructure: any;
  orderBlocks: any[];
  fairValueGaps: any[];
  liquidityLevels: any[];
  killZone: any;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  recommendedAction: 'BUY' | 'SELL' | 'WAIT';
}

// ================== API FUNCTIONS ==================

// Generic fetch wrapper
const backendFetch = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const baseUrl = await getBackendUrl();
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
};

// ================== TRADING ENDPOINTS ==================

/**
 * Get auto trading status
 */
export const getTradingStatus = async (): Promise<TradingStatus> => {
  const result = await backendFetch<{ success: boolean; data: TradingStatus }>('/trading/status');
  return result.data;
};

/**
 * Enable auto trading
 */
export const enableAutoTrading = async (): Promise<{ success: boolean; message: string; enabled: boolean }> => {
  return backendFetch('/trading/enable', { method: 'POST' });
};

/**
 * Disable auto trading
 */
export const disableAutoTrading = async (): Promise<{ success: boolean; message: string; enabled: boolean }> => {
  return backendFetch('/trading/disable', { method: 'POST' });
};

/**
 * Toggle auto trading
 */
export const toggleAutoTrading = async (): Promise<{ success: boolean; message: string; enabled: boolean }> => {
  return backendFetch('/trading/toggle', { method: 'POST' });
};

/**
 * Manually trigger trading cycle
 */
export const triggerTradingCycle = async (): Promise<{ success: boolean; message: string }> => {
  return backendFetch('/trading/trigger', { method: 'POST' });
};

/**
 * Analyze market (without executing trade)
 */
export const analyzeMarket = async (
  symbol: string = 'XAUUSDm',
  timeframe: string = 'M15'
): Promise<TradingSignal | null> => {
  const result = await backendFetch<{ success: boolean; data: TradingSignal | null }>(
    `/trading/analyze?symbol=${symbol}&timeframe=${timeframe}`
  );
  return result.data;
};

/**
 * Get open trades
 */
export const getOpenTrades = async (): Promise<Trade[]> => {
  const result = await backendFetch<{ success: boolean; data: Trade[]; count: number }>('/trading/trades/open');
  return result.data;
};

/**
 * Get trade history (closed trades) from MT5
 */
export const getTradeHistory = async (days: number = 30): Promise<any[]> => {
  const result = await backendFetch<{ success: boolean; data: any[]; count: number }>(
    `/mt5/trade-history?days=${days}`
  );
  return result.data || [];
};

/**
 * Get deals history (includes deposits/withdrawals) from MT5
 */
export const getDealsHistory = async (days: number = 30): Promise<any[]> => {
  const result = await backendFetch<{ success: boolean; data: any[]; count: number }>(
    `/mt5/deals?days=${days}`
  );
  return result.data || [];
};

/**
 * Get recent signals
 */
export const getRecentSignals = async (limit: number = 20): Promise<TradingSignal[]> => {
  const result = await backendFetch<{ success: boolean; data: TradingSignal[]; count: number }>(
    `/trading/signals?limit=${limit}`
  );
  return result.data;
};

/**
 * Get trading logs
 */
export const getTradingLogs = async (limit: number = 50): Promise<TradingLog[]> => {
  const result = await backendFetch<{ success: boolean; data: TradingLog[]; count: number }>(
    `/trading/logs?limit=${limit}`
  );
  return result.data;
};

/**
 * Get trade statistics
 */
export const getTradeStats = async (): Promise<TradeStats> => {
  const result = await backendFetch<{ success: boolean; data: TradeStats }>('/trading/stats');
  return result.data;
};

/**
 * Sync trades with MT5
 */
export const syncTrades = async (): Promise<{ success: boolean; message: string }> => {
  return backendFetch('/trading/sync', { method: 'POST' });
};

// ================== MONEY MANAGEMENT ENDPOINTS ==================

/**
 * Get all money management levels
 */
export const getMoneyManagementLevels = async (): Promise<MoneyManagementLevel[]> => {
  const result = await backendFetch<{ success: boolean; data: MoneyManagementLevel[] }>(
    '/money-management/levels'
  );
  return result.data;
};

/**
 * Get money management status
 */
export const getMoneyManagementStatus = async (accountId?: string): Promise<MoneyManagementStatus> => {
  const query = accountId ? `?accountId=${accountId}` : '';
  const result = await backendFetch<{ success: boolean; data: MoneyManagementStatus }>(
    `/money-management/status${query}`
  );
  return result.data;
};

/**
 * Get current level
 */
export const getCurrentLevel = async (balance: number): Promise<MoneyManagementLevel> => {
  const result = await backendFetch<{ success: boolean; data: MoneyManagementLevel }>(
    `/money-management/current-level?balance=${balance}`
  );
  return result.data;
};

/**
 * Get lot size for balance
 */
export const getLotSize = async (balance: number): Promise<{ balance: number; lotSize: number; level: number }> => {
  const result = await backendFetch<{ success: boolean; data: { balance: number; lotSize: number; level: number } }>(
    `/money-management/lot-size?balance=${balance}`
  );
  return result.data;
};

/**
 * Get daily progress
 */
export const getDailyProgress = async (accountId?: string): Promise<{
  dailyProfit: number;
  dailyTarget: number;
  progressPercent: number;
  targetReached: boolean;
}> => {
  const query = accountId ? `?accountId=${accountId}` : '';
  const result = await backendFetch<{ success: boolean; data: any }>(
    `/money-management/daily-progress${query}`
  );
  return result.data;
};

/**
 * Check if should trade
 */
export const shouldTrade = async (accountId?: string): Promise<{
  canTrade: boolean;
  reason: string | null;
}> => {
  const query = accountId ? `?accountId=${accountId}` : '';
  const result = await backendFetch<{ success: boolean; data: any }>(
    `/money-management/should-trade${query}`
  );
  return result.data;
};

/**
 * Sync account state with MT5
 */
export const syncMoneyManagement = async (accountId?: string): Promise<AccountState> => {
  const result = await backendFetch<{ success: boolean; data: AccountState }>(
    '/money-management/sync',
    { 
      method: 'POST',
      body: JSON.stringify({ accountId }),
    }
  );
  return result.data;
};

// ================== ANALYSIS ENDPOINTS ==================

/**
 * Get full market analysis
 */
export const getFullAnalysis = async (
  symbol: string = 'XAUUSDm',
  timeframe: string = 'M15'
): Promise<MarketAnalysis> => {
  const result = await backendFetch<{ success: boolean; data: MarketAnalysis }>(
    `/analysis/full?symbol=${symbol}&timeframe=${timeframe}`
  );
  return result.data;
};

/**
 * Get AI-powered analysis
 */
export const getAiAnalysis = async (
  symbol: string = 'XAUUSDm',
  timeframe: string = 'M15'
): Promise<any> => {
  const result = await backendFetch<{ success: boolean; data: any }>(
    `/analysis/ai?symbol=${symbol}&timeframe=${timeframe}`
  );
  return result.data;
};

// ================== MT5 ENDPOINTS ==================

/**
 * Check MT5 connection status
 */
export const getMt5ConnectionStatus = async (): Promise<{
  connected: boolean;
  accountId: string | null;
  balance: number | null;
  equity: number | null;
}> => {
  const result = await backendFetch<{ success: boolean; data: any }>('/mt5/status');
  return result.data;
};

/**
 * Get quote from backend MT5
 */
export const getBackendQuote = async (symbol: string = 'XAUUSDm'): Promise<{
  symbol: string;
  bid: number;
  ask: number;
  time: string;
}> => {
  const result = await backendFetch<{ success: boolean; data: any }>(`/mt5/quote?symbol=${symbol}`);
  return result.data;
};

// ================== MT5 CREDENTIALS ==================

/**
 * Set MT5 credentials on backend (sync from frontend login)
 */
export const setMt5Credentials = async (
  user: string,
  password: string,
  host: string,
  port: number = 443
): Promise<{ success: boolean; connected: boolean; accountInfo?: any; error?: string }> => {
  try {
    const baseUrl = await getBackendUrl();
    const response = await fetch(`${baseUrl}/mt5/set-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, password, host, port }),
    });
    const data = await response.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      connected: false,
      error: error.message,
    };
  }
};

/**
 * Get MT5 connection status from backend
 */
export const getMt5Status = async (): Promise<{
  hasCredentials: boolean;
  isConnected: boolean;
  accountInfo?: any;
}> => {
  try {
    const baseUrl = await getBackendUrl();
    const response = await fetch(`${baseUrl}/mt5/status`, { method: 'GET' });
    const result = await response.json();
    // Backend returns { success, data: { hasCredentials, connected, ... } }
    return {
      hasCredentials: result.data?.hasCredentials || false,
      isConnected: result.data?.connected || false,
      accountInfo: result.data || null,
    };
  } catch {
    return {
      hasCredentials: false,
      isConnected: false,
    };
  }
};

// ================== HEALTH CHECK ==================

/**
 * Check backend health
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const baseUrl = await getBackendUrl();
    const response = await fetch(`${baseUrl}/health`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Test backend connection
 */
export const testBackendConnection = async (): Promise<{
  connected: boolean;
  url: string;
  error?: string;
}> => {
  const baseUrl = await getBackendUrl();
  try {
    const response = await fetch(`${baseUrl}/health`, { method: 'GET' });
    return {
      connected: response.ok,
      url: baseUrl,
    };
  } catch (error: any) {
    return {
      connected: false,
      url: baseUrl,
      error: error.message,
    };
  }
};
