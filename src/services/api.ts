// MT5 API Service
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://mt5.mtapi.io';
const SESSION_KEY = 'mt5_session_id';
const LOGIN_CREDENTIALS_KEY = 'mt5_login_credentials';

export interface BrokerServer {
  label: string;
  host: string;
  port: number;
}

export interface BrokerServerAccess {
  name: string;
  access: string[];
}

export interface BrokerSearchResult {
  companyName: string;
  results: BrokerServerAccess[];
}

export const BROKER_SERVERS: BrokerServer[] = [
  {
    label: 'Exness MT5 Trial 14',
    host: '98.130.31.197',
    port: 443,
  },
  // Add more servers here as needed
];

// Search for brokers by company name
export const searchBrokers = async (companyName: string): Promise<BrokerSearchResult[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/Search?company=${encodeURIComponent(companyName)}`, {
      method: 'GET',
      headers: {
        'accept': 'text/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data: BrokerSearchResult[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching brokers:', error);
    throw error;
  }
};

// Convert search results to BrokerServer list
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

export interface ConnectParams {
  user: number;
  password: string;
  host: string;
  port: number;
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
  method: string;
  type: string;
  isInvestor: boolean;
}

export interface Quote {
  symbol: string;
  bid: number;
  ask: number;
  time: string;
  last: number;
  volume: number;
}

export interface AccountDetails {
  login: number;
  type: string;
  userName: string;
  tradeFlags: number;
  country: string;
  city: string;
  state: string;
  zipCode: string;
  userAddress: string;
  phone: string;
  email: string;
  balance: number;
  credit: number;
  blocked: number;
  leverage: number;
}

export interface DealInternal {
  ticketNumber: number;
  id: string;
  login: number;
  historyTime: number;
  orderTicket: number;
  openTime: number;
  symbol: string;
  type: string;
  direction: string;
  openPrice: number;
  price: number;
  stopLoss: number;
  takeProfit: number;
  volume: number;
  profit: number;
  profitRate: number;
  volumeRate: number;
  commission: number;
  fee: number;
  swap: number;
  expertId: number;
  positionTicket: number;
  comment: string;
  contractSize: number;
  digits: number;
  moneyDigits: number;
  freeProfit: number;
  trailRounder: number;
  openTimeMs: number;
  placedType: string;
  openTimeAsDateTime: string;
  lots: number;
}

export interface OrderInternal {
  ticketNumber: number;
  id: string;
  login: number;
  symbol: string;
  historyTime: number;
  openTime: number;
  expirationTime: number;
  executionTime: number;
  type: string;
  fillPolicy: string;
  expirationType: string;
  placedType: string;
  openPrice: number;
  stopLimitPrice: number;
  price: number;
  stopLoss: number;
  takeProfit: number;
  volume: number;
  requestVolume: number;
  state: string;
  expertId: number;
  dealTicket: number;
  comment: string;
  contractSize: number;
  digits: number;
  baseDigits: number;
  profitRate: number;
  openTimeMs: number;
  ticket: number;
  executionTimeAsDateTime: string;
  lots: number;
  requestLots: number;
  openTimeMsAsDateTime: string;
  openTimeAsDateTime: string;
}

export interface OpenOrder {
  ticket: number;
  profit: number;
  swap: number;
  commission: number;
  fee: number;
  closePrice: number;
  closeTime: string;
  closeLots: number;
  closeComment: string;
  openPrice: number;
  openTime: string;
  lots: number;
  contractSize: number;
  expertId: number;
  placedType: string;
  orderType: string;
  dealType: string;
  symbol: string;
  comment: string;
  state: string;
  stopLoss: number;
  takeProfit: number;
  requestId: number;
  digits: number;
  profitRate: number;
  stopLimitPrice: number;
  dealInternalIn: DealInternal | null;
  dealInternalOut: DealInternal | null;
  orderInternal: OrderInternal | null;
  partialCloseDeals: DealInternal[];
  partialFillDeals: DealInternal[];
  closeVolume: number;
  volume: number;
  expirationType: string;
  expirationTime: string;
  fillPolicy: string;
  openTimestampUTC: number;
  closeTimestampUTC: number;
}

export type OrderOperation = 'Buy' | 'Sell' | 'BuyLimit' | 'SellLimit' | 'BuyStop' | 'SellStop' | 'BuyStopLimit' | 'SellStopLimit' | 'CloseBy' | 'Balance' | 'Credit';
export type ExpirationType = 'GTC' | 'Today' | 'Specified' | 'SpecifiedDay';
export type PlacedType = 'Manually' | 'ByExpert' | 'ByDealer' | 'OnSL' | 'OnTP' | 'OnStopOut' | 'OnRollover' | 'OnVmargin' | 'Gateway' | 'Signal' | 'Settlement' | 'Transfer' | 'Sync' | 'ExternalService' | 'Migration' | 'Mobile' | 'Web' | 'OnSplit' | 'Default';

export interface OrderSendParams {
  symbol: string;
  operation: OrderOperation;
  volume: number;
  price?: number;
  slippage?: number;
  stoploss?: number;
  takeprofit?: number;
  comment?: string;
  expertID?: number;
  stopLimitPrice?: number;
  expiration?: string;
  expirationType?: ExpirationType;
  placedType?: PlacedType;
}

export interface OrderCloseParams {
  ticket: number;
  lots?: number;
  price?: number;
  slippage?: number;
  comment?: string;
}

// Error response from API
export interface ApiErrorResponse {
  code: string;
  message: string;
  stackTrace?: string;
}

class MT5ApiService {
  private sessionId: string | null = null;

  async connect(params: ConnectParams): Promise<string> {
    const url = `${API_BASE_URL}/Connect?user=${params.user}&password=${encodeURIComponent(params.password)}&host=${params.host}&port=${params.port}&connectTimeoutSeconds=30`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'text/plain',
        },
      });

      if (!response.ok) {
        throw new Error(`Connection failed: ${response.status}`);
      }

      const sessionId = await response.text();
      this.sessionId = sessionId.replace(/"/g, '').trim();
      
      // Save session to secure storage
      await this.saveSession(this.sessionId, params);
      
      return this.sessionId;
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  // Save session and credentials to secure storage
  private async saveSession(sessionId: string, credentials: ConnectParams): Promise<void> {
    try {
      await SecureStore.setItemAsync(SESSION_KEY, sessionId);
      await SecureStore.setItemAsync(LOGIN_CREDENTIALS_KEY, JSON.stringify(credentials));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  // Load saved session from storage
  async loadSavedSession(): Promise<{ sessionId: string; credentials: ConnectParams } | null> {
    try {
      const sessionId = await SecureStore.getItemAsync(SESSION_KEY);
      const credentialsStr = await SecureStore.getItemAsync(LOGIN_CREDENTIALS_KEY);
      
      if (sessionId && credentialsStr) {
        const credentials = JSON.parse(credentialsStr) as ConnectParams;
        return { sessionId, credentials };
      }
      return null;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  // Restore session and verify it's still valid
  async restoreSession(): Promise<boolean> {
    try {
      const saved = await this.loadSavedSession();
      if (!saved) return false;

      // Set the session ID
      this.sessionId = saved.sessionId;

      // Verify the session is still valid by making a test call
      try {
        await this.getAccountSummary();
        return true;
      } catch {
        // Session expired, try to reconnect with saved credentials
        console.log('Session expired, reconnecting...');
        try {
          await this.connect(saved.credentials);
          return true;
        } catch {
          // Credentials no longer valid
          await this.clearSavedSession();
          return false;
        }
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      return false;
    }
  }

  // Clear saved session from storage
  async clearSavedSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      await SecureStore.deleteItemAsync(LOGIN_CREDENTIALS_KEY);
      this.sessionId = null;
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  async getAccountSummary(): Promise<AccountSummary> {
    if (!this.sessionId) {
      throw new Error('Not connected. Please connect first.');
    }

    const url = `${API_BASE_URL}/AccountSummary?id=${this.sessionId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'text/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get account summary: ${response.status}`);
      }

      const data: AccountSummary = await response.json();
      return data;
    } catch (error) {
      console.error('Account summary error:', error);
      throw error;
    }
  }

  async getAccountDetails(): Promise<AccountDetails> {
    if (!this.sessionId) {
      throw new Error('Not connected. Please connect first.');
    }

    const url = `${API_BASE_URL}/Account?id=${this.sessionId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'text/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get account details: ${response.status}`);
      }

      const data: AccountDetails = await response.json();
      return data;
    } catch (error) {
      console.error('Account details error:', error);
      throw error;
    }
  }

  async getQuote(symbol: string, msNotOlder: number = 0): Promise<Quote> {
    if (!this.sessionId) {
      throw new Error('Not connected. Please connect first.');
    }

    let url = `${API_BASE_URL}/GetQuote?id=${this.sessionId}&symbol=${encodeURIComponent(symbol)}`;
    
    if (msNotOlder > 0) {
      url += `&msNotOlder=${msNotOlder}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'text/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get quote: ${response.status}`);
      }

      const data = await response.json();
      
      // Check if response is an error
      if (data.code && data.message) {
        throw new Error(data.message);
      }
      
      return data as Quote;
    } catch (error) {
      console.error('Get quote error:', error);
      throw error;
    }
  }

  async getOpenedOrders(sort: 'OpenTime' | 'CloseTime' = 'OpenTime', ascending: boolean = true): Promise<OpenOrder[]> {
    if (!this.sessionId) {
      throw new Error('Not connected. Please connect first.');
    }

    const url = `${API_BASE_URL}/OpenedOrders?id=${this.sessionId}&sort=${sort}&ascending=${ascending}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'text/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get opened orders: ${response.status}`);
      }

      const data: OpenOrder[] = await response.json();
      return data;
    } catch (error) {
      console.error('Opened orders error:', error);
      throw error;
    }
  }

  async getClosedOrders(): Promise<OpenOrder[]> {
    if (!this.sessionId) {
      throw new Error('Not connected. Please connect first.');
    }

    const url = `${API_BASE_URL}/ClosedOrders?id=${this.sessionId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'text/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get closed orders: ${response.status}`);
      }

      const data: OpenOrder[] = await response.json();
      return data;
    } catch (error) {
      console.error('Closed orders error:', error);
      throw error;
    }
  }

  async sendOrder(params: OrderSendParams): Promise<OpenOrder> {
    if (!this.sessionId) {
      throw new Error('Not connected. Please connect first.');
    }

    // Build URL with required parameters
    let url = `${API_BASE_URL}/OrderSend?id=${this.sessionId}&symbol=${encodeURIComponent(params.symbol)}&operation=${params.operation}&volume=${params.volume}`;
    
    // Add optional parameters
    if (params.price !== undefined && params.price > 0) {
      url += `&price=${params.price}`;
    }
    if (params.slippage !== undefined) {
      url += `&slippage=${params.slippage}`;
    }
    if (params.stoploss !== undefined && params.stoploss > 0) {
      url += `&stoploss=${params.stoploss}`;
    }
    if (params.takeprofit !== undefined && params.takeprofit > 0) {
      url += `&takeprofit=${params.takeprofit}`;
    }
    if (params.comment) {
      url += `&comment=${encodeURIComponent(params.comment)}`;
    }
    if (params.expertID !== undefined) {
      url += `&expertID=${params.expertID}`;
    }
    if (params.stopLimitPrice !== undefined && params.stopLimitPrice > 0) {
      url += `&stopLimitPrice=${params.stopLimitPrice}`;
    }
    if (params.expiration) {
      url += `&expiration=${encodeURIComponent(params.expiration)}`;
    }
    if (params.expirationType) {
      url += `&expirationType=${params.expirationType}`;
    }
    if (params.placedType) {
      url += `&placedType=${params.placedType}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'text/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send order: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Check if response is an error
      if (data.code && data.message) {
        throw new Error(data.message);
      }
      
      return data as OpenOrder;
    } catch (error) {
      console.error('Send order error:', error);
      throw error;
    }
  }

  async closeOrder(params: OrderCloseParams): Promise<OpenOrder> {
    if (!this.sessionId) {
      throw new Error('Not connected. Please connect first.');
    }

    // Build URL with required parameters
    let url = `${API_BASE_URL}/OrderClose?id=${this.sessionId}&ticket=${params.ticket}`;
    
    // Add optional parameters
    if (params.lots !== undefined && params.lots > 0) {
      url += `&lots=${params.lots}`;
    }
    if (params.price !== undefined && params.price > 0) {
      url += `&price=${params.price}`;
    }
    if (params.slippage !== undefined) {
      url += `&slippage=${params.slippage}`;
    }
    if (params.comment) {
      url += `&comment=${encodeURIComponent(params.comment)}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'text/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to close order: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Check if response is an error
      if (data.code && data.message) {
        throw new Error(data.message);
      }
      
      return data as OpenOrder;
    } catch (error) {
      console.error('Close order error:', error);
      throw error;
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  setSessionId(id: string): void {
    this.sessionId = id;
  }

  clearSession(): void {
    this.sessionId = null;
  }

  isConnected(): boolean {
    return this.sessionId !== null;
  }
}

export const mt5Api = new MT5ApiService();
export default mt5Api;
