// Account Types
export interface Account {
  accountId: string;
  name?: string;
  accountType?: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  profit: number;
  openPositions: number;
  currency: string;
  leverage?: number;
  credit?: number;
}

// Price Data Types
export interface PriceData {
  symbol: string;
  name: string;
  bid: number;
  ask: number;
  spread: number;
  high: number;
  low: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

// Trade Types
export type TradeType = 'BUY' | 'SELL';
export type TradeStatus = 'OPEN' | 'CLOSED';

export interface Trade {
  id: string;
  type: TradeType;
  symbol: string;
  lotSize: number;
  openPrice: number;
  closePrice?: number;
  openTime: string;
  closeTime?: string;
  profit: number;
  status: TradeStatus;
  stopLoss?: number;
  takeProfit?: number;
}

// Navigation Types
export type TabType = 'trade' | 'history' | 'account' | 'settings';

// Filter Types
export type TradeFilter = 'all' | 'open' | 'closed';
