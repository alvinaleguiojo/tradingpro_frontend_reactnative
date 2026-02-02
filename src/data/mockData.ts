import { Account, Trade, PriceData } from '../types';

// Initial Account Data (empty placeholder until real data loads)
export const mockAccountData: Account = {
  accountId: '',
  name: '',
  balance: 0,
  equity: 0,
  margin: 0,
  freeMargin: 0,
  marginLevel: 0,
  profit: 0,
  openPositions: 0,
  currency: 'USD',
};

// Base price for XAUUSDm
let basePrice = 2045.50;

// Generate realistic price fluctuations
export const generatePriceData = (): PriceData => {
  // Random price movement between -2 and +2
  const change = (Math.random() - 0.5) * 4;
  basePrice = basePrice + change;
  
  // Keep price in realistic range
  if (basePrice < 2000) basePrice = 2000;
  if (basePrice > 2100) basePrice = 2100;
  
  const spread = 0.50; // Typical spread for XAUUSDm
  const bid = basePrice;
  const ask = basePrice + spread;
  
  const dailyChange = basePrice - 2040.25;
  const dailyChangePercent = (dailyChange / 2040.25) * 100;
  
  return {
    symbol: 'XAUUSDm',
    name: 'Gold vs US Dollar',
    bid: parseFloat(bid.toFixed(2)),
    ask: parseFloat(ask.toFixed(2)),
    spread: spread,
    high: parseFloat((basePrice + 5.30).toFixed(2)),
    low: parseFloat((basePrice - 8.20).toFixed(2)),
    change: parseFloat(dailyChange.toFixed(2)),
    changePercent: parseFloat(dailyChangePercent.toFixed(2)),
    timestamp: new Date().toISOString(),
  };
};

// Mock Trade History
export const mockTradeHistory: Trade[] = [
  {
    id: '1',
    type: 'BUY',
    symbol: 'XAUUSD',
    lotSize: 0.10,
    openPrice: 2038.50,
    closePrice: 2045.20,
    openTime: '2026-01-31T08:30:00Z',
    closeTime: '2026-01-31T10:45:00Z',
    profit: 67.00,
    status: 'CLOSED',
  },
  {
    id: '2',
    type: 'SELL',
    symbol: 'XAUUSD',
    lotSize: 0.05,
    openPrice: 2052.30,
    closePrice: 2048.80,
    openTime: '2026-01-30T14:20:00Z',
    closeTime: '2026-01-30T16:55:00Z',
    profit: 35.00,
    status: 'CLOSED',
  },
  {
    id: '3',
    type: 'BUY',
    symbol: 'XAUUSD',
    lotSize: 0.15,
    openPrice: 2041.00,
    openTime: '2026-01-31T09:15:00Z',
    profit: 67.50,
    status: 'OPEN',
  },
  {
    id: '4',
    type: 'SELL',
    symbol: 'XAUUSD',
    lotSize: 0.08,
    openPrice: 2055.80,
    closePrice: 2060.20,
    openTime: '2026-01-29T11:00:00Z',
    closeTime: '2026-01-29T15:30:00Z',
    profit: -35.20,
    status: 'CLOSED',
  },
  {
    id: '5',
    type: 'BUY',
    symbol: 'XAUUSD',
    lotSize: 0.20,
    openPrice: 2028.40,
    closePrice: 2042.60,
    openTime: '2026-01-28T09:00:00Z',
    closeTime: '2026-01-28T17:00:00Z',
    profit: 284.00,
    status: 'CLOSED',
  },
  {
    id: '6',
    type: 'BUY',
    symbol: 'XAUUSD',
    lotSize: 0.12,
    openPrice: 2035.20,
    openTime: '2026-01-31T07:45:00Z',
    profit: 123.60,
    status: 'OPEN',
  },
  {
    id: '7',
    type: 'SELL',
    symbol: 'XAUUSD',
    lotSize: 0.10,
    openPrice: 2048.90,
    openTime: '2026-01-31T06:30:00Z',
    profit: 39.00,
    status: 'OPEN',
  },
];

// Price history for mini chart (last 24 data points)
export const priceHistory: number[] = [
  2035.20, 2036.80, 2034.50, 2038.20, 2040.10, 2039.50,
  2041.30, 2043.80, 2042.20, 2045.60, 2044.30, 2046.90,
  2045.50, 2047.20, 2048.80, 2046.40, 2044.90, 2047.30,
  2049.10, 2048.20, 2050.40, 2049.80, 2047.60, 2045.50,
];
