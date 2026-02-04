// Backend NestJS API Service
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Cross-platform storage wrapper (SecureStore for native, localStorage for web)
const Storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// Storage keys for local account info
const LOGIN_CREDENTIALS_KEY = 'mt5_login_credentials';

// Backend API base URL - update this to your computer's IP address
// Use your local IP for physical device testing (e.g., http://192.168.1.4:4000)
// Use http://localhost:4000 for web browser testing
// Use http://10.0.2.2:4000 for Android emulator
const BACKEND_API_URL = 'https://tradingpro-backend-nestjs.vercel.app';
const BACKEND_URL_KEY = 'backend_api_url';

// Get the configured backend URL
export const getBackendUrl = async (): Promise<string> => {
  try {
    const storedUrl = await Storage.getItem(BACKEND_URL_KEY);
    return storedUrl || BACKEND_API_URL;
  } catch {
    return BACKEND_API_URL;
  }
};

// Set the backend URL
export const setBackendUrl = async (url: string): Promise<void> => {
  await Storage.setItem(BACKEND_URL_KEY, url);
};

// Get locally stored account ID (from login)
export const getLoggedInAccountId = async (): Promise<string | null> => {
  try {
    const credentialsStr = await Storage.getItem(LOGIN_CREDENTIALS_KEY);
    if (credentialsStr) {
      const credentials = JSON.parse(credentialsStr);
      return credentials.user?.toString() || null;
    }
    return null;
  } catch (error) {
    console.error('Failed to get logged in account ID:', error);
    return null;
  }
};

// Save login credentials locally
export const saveLoginCredentials = async (credentials: {
  user: number;
  password: string;
  host: string;
  port: number;
}): Promise<void> => {
  await Storage.setItem(LOGIN_CREDENTIALS_KEY, JSON.stringify(credentials));
};

// Clear login credentials
export const clearLoginCredentials = async (): Promise<void> => {
  await Storage.deleteItem(LOGIN_CREDENTIALS_KEY);
};

// Get saved login credentials
export const getSavedCredentials = async (): Promise<{
  user: number;
  password: string;
  host: string;
  port: number;
} | null> => {
  try {
    const credentialsStr = await Storage.getItem(LOGIN_CREDENTIALS_KEY);
    if (credentialsStr) {
      return JSON.parse(credentialsStr);
    }
    return null;
  } catch {
    return null;
  }
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

export interface ScalpingConfig {
  minConfidence: number;
  minRiskReward: number;
  maxSpreadPips: number;
  stopLossPips: number;
  takeProfitPips: number;
  trailingStopPips: number;
  usePartialTakeProfit: boolean;
  partialProfitPercent: number;
  breakEvenAtProfit: number;
  onlyTradeDuringKillZones: boolean;
  allowCounterTrend: boolean;
}

export interface ScalpingStatus {
  enabled: boolean;
  config: ScalpingConfig;
  description: string;
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
  error?: string;
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

export interface Mt5Status {
  isConnected: boolean;
  account?: any;
  error?: string;
}

// Combined dashboard response - all data in one request
export interface DashboardData {
  tradingStatus: TradingStatus;
  scalpingStatus: {
    enabled: boolean;
    config: ScalpingConfig;
  };
  mt5Status: Mt5Status;
  moneyManagementStatus: MoneyManagementStatus | { error: string };
  tradeStats: TradeStats;
  recentSignals: TradingSignal[];
  openTrades: Trade[];
}

export interface DashboardResponse {
  success: boolean;
  duration: string;
  data: DashboardData;
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
  const accountId = await getLoggedInAccountId();
  const accountParam = accountId ? `?accountId=${accountId}` : '';
  const result = await backendFetch<{ success: boolean; data: Trade[]; count: number }>(`/trading/trades/open${accountParam}`);
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
  const accountId = await getLoggedInAccountId();
  const accountParam = accountId ? `&accountId=${accountId}` : '';
  const result = await backendFetch<{ success: boolean; data: TradingSignal[]; count: number }>(
    `/trading/signals?limit=${limit}${accountParam}`
  );
  return result.data;
};

/**
 * Get trading logs
 */
export const getTradingLogs = async (limit: number = 50): Promise<TradingLog[]> => {
  const accountId = await getLoggedInAccountId();
  const accountParam = accountId ? `&accountId=${accountId}` : '';
  const result = await backendFetch<{ success: boolean; data: TradingLog[]; count: number }>(
    `/trading/logs?limit=${limit}${accountParam}`
  );
  return result.data;
};

/**
 * Get trade statistics
 */
export const getTradeStats = async (): Promise<TradeStats> => {
  const accountId = await getLoggedInAccountId();
  const accountParam = accountId ? `?accountId=${accountId}` : '';
  const result = await backendFetch<{ success: boolean; data: TradeStats }>(`/trading/stats${accountParam}`);
  return result.data;
};

/**
 * Get all dashboard data in a single request
 * This significantly reduces load times by combining 7+ API calls into 1
 */
export const getDashboard = async (signalLimit: number = 10): Promise<DashboardData> => {
  const accountId = await getLoggedInAccountId();
  const accountParam = accountId ? `&accountId=${accountId}` : '';
  const result = await backendFetch<DashboardResponse>(`/trading/dashboard?signalLimit=${signalLimit}${accountParam}`);
  return result.data;
};

/**
 * Sync trades with MT5
 */
export const syncTrades = async (): Promise<{ success: boolean; message: string }> => {
  return backendFetch('/trading/sync', { method: 'POST' });
};

// ================== SCALPING MODE ENDPOINTS ==================

/**
 * Get scalping mode status and configuration
 */
export const getScalpingStatus = async (): Promise<ScalpingStatus> => {
  const result = await backendFetch<{ success: boolean; data: ScalpingStatus }>('/trading/scalping/status');
  return result.data;
};

/**
 * Enable aggressive scalping mode
 */
export const enableScalpingMode = async (): Promise<{ success: boolean; message: string; data: any }> => {
  return backendFetch('/trading/scalping/enable', { method: 'POST' });
};

/**
 * Disable scalping mode (use standard ICT strategy)
 */
export const disableScalpingMode = async (): Promise<{ success: boolean; message: string; data: any }> => {
  return backendFetch('/trading/scalping/disable', { method: 'POST' });
};

/**
 * Toggle scalping mode
 */
export const toggleScalpingMode = async (): Promise<{ success: boolean; message: string; data: any }> => {
  // Get current status first
  const status = await getScalpingStatus();
  if (status.enabled) {
    return disableScalpingMode();
  } else {
    return enableScalpingMode();
  }
};

/**
 * Update scalping configuration
 */
export const updateScalpingConfig = async (config: Partial<ScalpingConfig>): Promise<{ success: boolean; data: ScalpingConfig }> => {
  return backendFetch('/trading/scalping/config', {
    method: 'POST',
    body: JSON.stringify(config),
  });
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
  const effectiveAccountId = accountId || await getLoggedInAccountId();
  const query = effectiveAccountId ? `?accountId=${effectiveAccountId}` : '';
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
  const effectiveAccountId = accountId || await getLoggedInAccountId();
  const query = effectiveAccountId ? `?accountId=${effectiveAccountId}` : '';
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
  const effectiveAccountId = accountId || await getLoggedInAccountId();
  const query = effectiveAccountId ? `?accountId=${effectiveAccountId}` : '';
  const result = await backendFetch<{ success: boolean; data: any }>(
    `/money-management/should-trade${query}`
  );
  return result.data;
};

/**
 * Sync account state with MT5
 */
export const syncMoneyManagement = async (accountId?: string): Promise<AccountState> => {
  const effectiveAccountId = accountId || await getLoggedInAccountId();
  const result = await backendFetch<{ success: boolean; data: AccountState }>(
    '/money-management/sync',
    { 
      method: 'POST',
      body: JSON.stringify({ accountId: effectiveAccountId }),
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
 * Modify order SL/TP
 */
export const modifyOrder = async (
  ticket: string,
  stopLoss?: number,
  takeProfit?: number
): Promise<{ success: boolean }> => {
  return backendFetch('/mt5/order/modify', {
    method: 'POST',
    body: JSON.stringify({ ticket, stopLoss, takeProfit }),
  });
};

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

// ================== MT5 TRADING OPERATIONS (via Backend) ==================

export interface BrokerServer {
  label: string;
  host: string;
  port: number;
}

export interface BrokerSearchResult {
  companyName: string;
  results: {
    name: string;
    access: string[];
  }[];
}

export interface Quote {
  symbol: string;
  bid: number;
  ask: number;
  time: string;
  last?: number;
  volume?: number;
}

export interface AccountSummary {
  balance: number;
  credit: number;
  profit: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  leverage: number;
  currency: string;
}

export interface AccountDetails {
  login: number;
  type: string;
  userName: string;
  balance: number;
  credit: number;
  leverage: number;
  country?: string;
  email?: string;
}

export interface OpenOrder {
  ticket: number;
  symbol: string;
  orderType: string;
  lots: number;
  openPrice: number;
  stopLoss: number;
  takeProfit: number;
  profit: number;
  swap: number;
  commission: number;
  openTime: string;
  comment?: string;
}

export interface OrderSendParams {
  symbol: string;
  operation: 'Buy' | 'Sell' | 'BuyLimit' | 'SellLimit' | 'BuyStop' | 'SellStop';
  volume: number;
  price?: number;
  slippage?: number;
  stoploss?: number;
  takeprofit?: number;
  comment?: string;
}

/**
 * Search for brokers by company name
 */
export const searchBrokers = async (companyName: string): Promise<BrokerSearchResult[]> => {
  const result = await backendFetch<{ success: boolean; data: BrokerSearchResult[] }>(
    `/mt5/brokers/search?company=${encodeURIComponent(companyName)}`
  );
  return result.data || [];
};

/**
 * Parse broker search results into server list
 */
export const parseBrokerServers = (searchResults: BrokerSearchResult[]): BrokerServer[] => {
  const servers: BrokerServer[] = [];
  
  searchResults.forEach((result) => {
    result.results.forEach((serverAccess) => {
      serverAccess.access.forEach((hostPort) => {
        const [host, portStr] = hostPort.split(':');
        const port = parseInt(portStr, 10);
        
        servers.push({
          label: `${serverAccess.name} - ${host}`,
          host: host,
          port: port,
        });
      });
    });
  });
  
  return servers;
};

/**
 * Connect to MT5 via backend
 */
export const connectMt5 = async (params: {
  user: number;
  password: string;
  host: string;
  port: number;
}): Promise<{ success: boolean; connected: boolean; error?: string }> => {
  // Save credentials locally
  await saveLoginCredentials(params);
  
  // Send to backend
  const result = await setMt5Credentials(
    params.user.toString(),
    params.password,
    params.host,
    params.port
  );
  
  return result;
};

/**
 * Restore session - check if already connected via backend
 */
export const restoreSession = async (): Promise<boolean> => {
  try {
    const saved = await getSavedCredentials();
    if (!saved) return false;

    // Check if backend is connected with our credentials
    const status = await getMt5Status();
    if (status.isConnected) {
      return true;
    }

    // Try to reconnect with saved credentials
    const result = await connectMt5(saved);
    return result.connected;
  } catch (error) {
    console.error('Failed to restore session:', error);
    return false;
  }
};

/**
 * Clear session and logout
 */
export const clearSession = async (): Promise<void> => {
  await clearLoginCredentials();
  lastEnsureConnectedTime = 0; // Reset so next session will reconnect
};

// Throttle ensureConnected to avoid flooding the backend
let lastEnsureConnectedTime = 0;
const ENSURE_CONNECTED_INTERVAL = 30000; // Only reconnect every 30 seconds max

/**
 * Ensure we're connected with the correct account before making API calls
 * This prevents issues when the shared backend switches to another user's account
 * Throttled to avoid excessive requests
 */
const ensureConnected = async (): Promise<void> => {
  const now = Date.now();
  
  // Skip if we recently ensured connection
  if (now - lastEnsureConnectedTime < ENSURE_CONNECTED_INTERVAL) {
    return;
  }
  
  const saved = await getSavedCredentials();
  if (saved) {
    // Re-send credentials to ensure we're using the right account
    await setMt5Credentials(
      saved.user.toString(),
      saved.password,
      saved.host,
      saved.port
    );
    lastEnsureConnectedTime = now;
  }
};

/**
 * Get account summary via backend
 */
export const getAccountSummary = async (): Promise<AccountSummary> => {
  await ensureConnected();
  const result = await backendFetch<{ success: boolean; data: AccountSummary }>('/mt5/account');
  return result.data;
};

/**
 * Get account details via backend
 */
export const getAccountDetails = async (): Promise<AccountDetails> => {
  await ensureConnected();
  const result = await backendFetch<{ success: boolean; data: AccountDetails }>('/mt5/account/details');
  return result.data;
};

/**
 * Get quote via backend
 */
export const getQuote = async (symbol: string = 'XAUUSDm'): Promise<Quote> => {
  await ensureConnected();
  const result = await backendFetch<{ success: boolean; data: Quote }>(`/mt5/quote?symbol=${encodeURIComponent(symbol)}`);
  return result.data;
};

/**
 * Get opened orders via backend
 */
export const getOpenedOrders = async (): Promise<OpenOrder[]> => {
  await ensureConnected();
  const result = await backendFetch<{ success: boolean; data: OpenOrder[] }>('/mt5/orders');
  return result.data || [];
};

/**
 * Get closed orders via backend
 */
export const getClosedOrders = async (days: number = 30): Promise<OpenOrder[]> => {
  await ensureConnected();
  const result = await backendFetch<{ success: boolean; data: OpenOrder[]; count: number }>(`/mt5/orders/closed?days=${days}`);
  return result.data || [];
};

/**
 * Send order via backend
 */
export const sendOrder = async (params: OrderSendParams): Promise<OpenOrder> => {
  await ensureConnected();
  const result = await backendFetch<{ success: boolean; data: OpenOrder }>('/mt5/order/send', {
    method: 'POST',
    body: JSON.stringify({
      symbol: params.symbol,
      type: params.operation === 'Buy' ? 'BUY' : 'SELL',
      volume: params.volume,
      stopLoss: params.stoploss,
      takeProfit: params.takeprofit,
      comment: params.comment,
    }),
  });
  return result.data;
};

/**
 * Close order via backend
 */
export const closeOrder = async (params: { ticket: number; lots?: number }): Promise<{ success: boolean }> => {
  await ensureConnected();
  return backendFetch('/mt5/order/close', {
    method: 'POST',
    body: JSON.stringify({ ticket: params.ticket.toString(), volume: params.lots }),
  });
};

/**
 * Default broker servers
 */
export const BROKER_SERVERS: BrokerServer[] = [
  {
    label: 'Exness MT5 Trial 14',
    host: '98.130.31.197',
    port: 443,
  },
];
