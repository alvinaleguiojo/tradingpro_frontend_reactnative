import React, { useState, useEffect } from 'react';
import { ScrollView, StatusBar, StyleSheet, Alert, Modal, View, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import {
  Header,
  AccountCard,
  PriceDisplay,
  TradingButtons,
  TradeHistory,
  TradeModal,
  BottomNav,
  LoginScreen,
  SplashScreen,
  MoneyManagement,
  AutoTradingScreen,
  TradingChart,
  useResponsive,
} from './src/components';

import { mockAccountData, mockTradeHistory } from './src/data/mockData';
import { Account, Trade, PriceData, TradeType, TabType } from './src/types';
import { mt5Api, OpenOrder, Quote } from './src/services/api';
import { getCurrentLevel, isDailyTargetReached } from './src/data/moneyManagement';
import { useAppUpdate } from './src/hooks/useAppUpdate';

// Default price data before API loads
const defaultPriceData: PriceData = {
  symbol: 'XAUUSDm',
  name: 'Gold vs USD',
  bid: 0,
  ask: 0,
  spread: 0,
  high: 0,
  low: 0,
  change: 0,
  changePercent: 0,
  timestamp: new Date().toISOString(),
};

// Cross-platform alert function that works on both mobile and web
const showAlert = (title: string, message: string, onOk?: () => void): void => {
  if (Platform.OS === 'web') {
    // Use browser's native alert for web
    window.alert(`${title}\n\n${message}`);
    if (onOk) onOk();
  } else {
    // Use React Native Alert for mobile
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
  }
};

export default function App(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [account, setAccount] = useState<Account>(mockAccountData);
  const [priceData, setPriceData] = useState<PriceData>(defaultPriceData);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [dailyRealizedProfit, setDailyRealizedProfit] = useState<number>(0);
  const [isModalVisible, setModalVisible] = useState<boolean>(false);
  const [tradeType, setTradeType] = useState<TradeType | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('trade');
  const [isMoneyManagementVisible, setMoneyManagementVisible] = useState<boolean>(false);
  const [isChartVisible, setChartVisible] = useState<boolean>(false);

  // Responsive hook - must be called at top level, not after conditionals
  const { isDesktop } = useResponsive();

  // Check for OTA updates automatically
  const { isChecking: isCheckingUpdate, isDownloading: isDownloadingUpdate } = useAppUpdate();

  // Helper to check if a date is today
  // Check if a date string is today (using UTC to match MT5 server time)
  const isToday = (dateString: string): boolean => {
    const date = new Date(dateString);
    const today = new Date();
    // Compare using UTC dates to avoid timezone issues with MT5 server
    return date.getUTCFullYear() === today.getUTCFullYear() &&
           date.getUTCMonth() === today.getUTCMonth() &&
           date.getUTCDate() === today.getUTCDate();
  };

  // Convert OpenOrder from API to Trade type for UI
  const convertOpenOrderToTrade = (order: OpenOrder): Trade => {
    // OpenedOrders endpoint returns active/open positions
    // The state can be: Started, Placed, Filled, Canceled, Rejected, Expired, PartialFill
    const isOpen = !order.closeTime || order.closePrice === 0 || 
                   order.state === 'Started' || order.state === 'Placed' || order.state === 'Filled';
    
    return {
      id: order.ticket.toString(),
      type: order.orderType === 'Buy' ? 'BUY' : 'SELL',
      symbol: order.symbol,
      lotSize: order.lots,
      openPrice: order.openPrice,
      closePrice: order.closePrice > 0 ? order.closePrice : undefined,
      openTime: order.openTime,
      closeTime: order.closeTime,
      profit: order.profit,
      status: isOpen ? 'OPEN' : 'CLOSED',
      stopLoss: order.stopLoss > 0 ? order.stopLoss : undefined,
      takeProfit: order.takeProfit > 0 ? order.takeProfit : undefined,
    };
  };

  // Convert closed order from API to Trade type (always CLOSED)
  const convertClosedOrderToTrade = (order: OpenOrder): Trade => {
    return {
      id: order.ticket.toString(),
      type: order.orderType === 'Buy' ? 'BUY' : 'SELL',
      symbol: order.symbol,
      lotSize: order.lots,
      openPrice: order.openPrice,
      closePrice: order.closePrice > 0 ? order.closePrice : undefined,
      openTime: order.openTime,
      closeTime: order.closeTime,
      profit: order.profit,
      status: 'CLOSED',
      stopLoss: order.stopLoss > 0 ? order.stopLoss : undefined,
      takeProfit: order.takeProfit > 0 ? order.takeProfit : undefined,
    };
  };

  // Fetch all orders (open and closed) from API
  const fetchAllOrders = async () => {
    try {
      // Fetch both open and closed orders in parallel
      const [openOrders, closedOrders] = await Promise.all([
        mt5Api.getOpenedOrders(),
        mt5Api.getClosedOrders()
      ]);
      
      console.log('Fetched open orders:', openOrders.length);
      console.log('Fetched closed orders:', closedOrders.length);
      
      // Filter out non-trade operations (Balance, Credit, etc.) - only keep Buy/Sell trades
      const tradeOrderTypes = ['Buy', 'Sell', 'BuyLimit', 'SellLimit', 'BuyStop', 'SellStop', 'BuyStopLimit', 'SellStopLimit'];
      
      const filteredOpenOrders = openOrders.filter(order => 
        tradeOrderTypes.includes(order.orderType) && order.symbol && order.symbol.length > 0
      );
      const filteredClosedOrders = closedOrders.filter(order => 
        tradeOrderTypes.includes(order.orderType) && order.symbol && order.symbol.length > 0
      );
      
      const openTrades = filteredOpenOrders.map(convertOpenOrderToTrade);
      const closedTrades = filteredClosedOrders.map(convertClosedOrderToTrade);
      
      // Calculate daily realized profit from trades closed today
      const todaysClosedTrades = closedTrades.filter(trade => 
        trade.closeTime && isToday(trade.closeTime)
      );
      const todaysProfit = todaysClosedTrades.reduce((sum, trade) => sum + trade.profit, 0);
      setDailyRealizedProfit(todaysProfit);
      
      // Combine and sort by open time (most recent first)
      const allTrades = [...openTrades, ...closedTrades].sort((a, b) => 
        new Date(b.openTime).getTime() - new Date(a.openTime).getTime()
      );
      
      setTradeHistory(allTrades);
      
      // Update open positions count
      setAccount(prev => ({
        ...prev,
        openPositions: openTrades.length,
      }));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  // Fetch account summary from API
  const fetchAccountSummary = async () => {
    try {
      // Fetch both account summary and details in parallel
      const [summary, details] = await Promise.all([
        mt5Api.getAccountSummary(),
        mt5Api.getAccountDetails()
      ]);
      
      // Only update if we got valid data
      if (summary && details) {
        setAccount({
          accountId: details.userName || `Account ${details.login}` || sessionId || 'MT5 Account',
          name: details.userName || '',
          accountType: details.type || '',
          balance: summary.balance || 0,
          equity: summary.equity || 0,
          profit: summary.profit || 0,
          margin: summary.margin || 0,
          freeMargin: summary.freeMargin || 0,
          marginLevel: summary.marginLevel || 0,
          leverage: summary.leverage || details.leverage || 0,
          currency: summary.currency || 'USD',
          openPositions: 0, // Will be updated when we add positions endpoint
        });
      }
    } catch (error) {
      console.error('Failed to fetch account summary:', error);
    }
  };

  // Check for saved session on app launch
  useEffect(() => {
    const checkSavedSession = async () => {
      try {
        const restored = await mt5Api.restoreSession();
        if (restored) {
          const savedSessionId = mt5Api.getSessionId();
          if (savedSessionId) {
            setSessionId(savedSessionId);
            setIsLoggedIn(true);
            console.log('Session restored successfully');
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        // Clear any corrupted session data
        try {
          await mt5Api.clearSavedSession();
        } catch (clearError) {
          console.error('Failed to clear session:', clearError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkSavedSession();
  }, []);

  // Fetch account data on login and periodically
  useEffect(() => {
    if (!isLoggedIn) return;
    
    // Fetch immediately on login
    fetchAccountSummary();
    fetchAllOrders();
    
    // Fetch every 5 seconds
    const accountInterval = setInterval(() => {
      fetchAccountSummary();
      fetchAllOrders();
    }, 5000);
    
    // Fetch real-time price updates from MT5 API
    const fetchQuote = async () => {
      try {
        const quote: Quote = await mt5Api.getQuote('XAUUSDm');
        
        setPriceData(prevData => {
          const change = quote.bid - (prevData.bid || quote.bid);
          const changePercent = prevData.bid > 0 
            ? ((quote.bid - prevData.bid) / prevData.bid) * 100 
            : 0;
          
          // Calculate spread (difference between ask and bid)
          const spread = Math.round((quote.ask - quote.bid) * 100); // In points
          
          // Update high/low tracking
          const high = prevData.high > 0 ? Math.max(prevData.high, quote.bid) : quote.bid;
          const low = prevData.low > 0 ? Math.min(prevData.low, quote.bid) : quote.bid;
          
          return {
            symbol: quote.symbol,
            name: 'Gold vs USD',
            bid: quote.bid,
            ask: quote.ask,
            spread: spread,
            high: high,
            low: low,
            change: change,
            changePercent: changePercent,
            timestamp: quote.time,
          };
        });
      } catch (error) {
        console.error('Failed to fetch quote:', error);
      }
    };

    // Fetch quote immediately and then every 1 second
    fetchQuote();
    const priceInterval = setInterval(fetchQuote, 1000);
    
    return () => {
      clearInterval(accountInterval);
      clearInterval(priceInterval);
    };
  }, [isLoggedIn]);

  const handleLoginSuccess = (id: string) => {
    setSessionId(id);
    setIsLoggedIn(true);
    console.log('Connected with session ID:', id);
  };

  // Check if there are open orders
  const hasOpenOrders = (): boolean => {
    return tradeHistory.some(trade => trade.status === 'OPEN');
  };

  // Get the lot size from money management based on current balance
  const getRecommendedLotSize = (): number => {
    return getCurrentLevel(account.equity).lotSize;
  };

  const handleTrade = (type: TradeType): void => {
    // Check if daily target is reached
    if (isDailyTargetReached(account.equity, dailyRealizedProfit)) {
      showAlert(
        '🎉 Daily Target Reached!',
        `Congratulations! You've hit your daily target of $${getCurrentLevel(account.equity).dailyTarget.toFixed(2)}.\n\nTrading is paused to protect your profits. Come back tomorrow!`
      );
      return;
    }
    
    // Check if there's already an open order
    if (hasOpenOrders()) {
      showAlert(
        '⚠️ Order Already Open',
        'You already have an open position. Please close it before opening a new trade.\n\nThis helps manage risk according to your money management plan.'
      );
      return;
    }
    
    setTradeType(type);
    setModalVisible(true);
  };

  const executeTrade = async (): Promise<void> => {
    // Double-check target before executing
    if (isDailyTargetReached(account.equity, dailyRealizedProfit)) {
      showAlert('Trading Paused', 'Daily target has been reached.');
      setModalVisible(false);
      return;
    }
    
    // Double-check no open orders
    if (hasOpenOrders()) {
      showAlert('Order Exists', 'Close your current position first.');
      setModalVisible(false);
      return;
    }
    
    const price = tradeType === 'BUY' ? priceData.ask : priceData.bid;
    const operation = tradeType === 'BUY' ? 'Buy' : 'Sell';
    const lotSize = getRecommendedLotSize(); // Use money management lot size
    
    try {
      // Send real order to MT5 API
      // Note: Symbol name may vary by broker (e.g., XAUUSDm, GOLD, XAUUSD.a)
      const order = await mt5Api.sendOrder({
        symbol: priceData.symbol,
        operation: operation,
        volume: lotSize,
        price: price,
        slippage: 10, // Allow 10 points slippage
        comment: 'TradingPro Mobile',
      });
      
      console.log('Order executed:', order);
      
      const executedPrice = order.openPrice || price;
      showAlert(
        'Order Executed',
        `${operation} ${lotSize} lot(s) of ${priceData.symbol} at ${executedPrice.toFixed(2)}\nTicket: ${order.ticket}`
      );
      
      setModalVisible(false);
      
      // Refresh orders from API
      fetchAllOrders();
    } catch (error) {
      console.error('Failed to execute trade:', error);
      showAlert(
        'Order Failed',
        error instanceof Error ? error.message : 'Failed to execute trade. Please try again.'
      );
      setModalVisible(false);
    }
  };

  // Handle closing a trade
  const handleCloseTrade = async (trade: Trade): Promise<void> => {
    try {
      const result = await mt5Api.closeOrder({
        ticket: parseInt(trade.id),
        slippage: 10,
        comment: 'Closed via TradingPro Mobile',
      });
      
      console.log('Order closed:', result);
      
      showAlert(
        'Trade Closed',
        `${trade.type} ${trade.lotSize} lot(s) of ${trade.symbol} closed\nProfit: ${result.profit >= 0 ? '+' : ''}$${result.profit.toFixed(2)}`
      );
      
      // Refresh orders
      fetchAllOrders();
    } catch (error) {
      console.error('Failed to close trade:', error);
      showAlert(
        'Close Failed',
        error instanceof Error ? error.message : 'Failed to close trade. Please try again.'
      );
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await mt5Api.clearSavedSession();
    setIsLoggedIn(false);
    setSessionId(null);
  };

  // Show loading screen while checking saved session
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0D1421" />
        <SplashScreen />
      </SafeAreaProvider>
    );
  }

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0D1421" />
        <SafeAreaView style={styles.loginSafeArea}>
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Desktop layout with chart sidebar
  const renderDesktopLayout = () => {
    // If Auto Trading is active, show it fullscreen on desktop too
    if (activeTab === 'auto') {
      return <AutoTradingScreen onBack={() => setActiveTab('trade')} />;
    }
    
    return (
      <View style={styles.desktopContainer}>
      {/* Left Panel - Trading Controls */}
      <View style={styles.desktopLeftPanel}>
        <ScrollView 
          style={styles.desktopScrollView}
          showsVerticalScrollIndicator={false}
        >
          <AccountCard 
            account={account} 
            dailyProfit={dailyRealizedProfit}
            onMoneyManagementPress={() => setMoneyManagementVisible(true)}
          />
          <PriceDisplay 
            priceData={priceData} 
            onChartPress={() => setChartVisible(true)}
          />
          <TradingButtons 
            onBuy={() => handleTrade('BUY')} 
            onSell={() => handleTrade('SELL')}
            bidPrice={priceData.bid}
            askPrice={priceData.ask}
            disabled={isDailyTargetReached(account.equity, dailyRealizedProfit) || hasOpenOrders()}
            dailyProfit={dailyRealizedProfit}
            dailyTarget={getCurrentLevel(account.equity).dailyTarget}
            hasOpenOrder={hasOpenOrders()}
            recommendedLotSize={getRecommendedLotSize()}
          />
          
          {/* Auto Trading Button for Desktop */}
          <TouchableOpacity 
            style={styles.desktopAutoTradingButton}
            onPress={() => setActiveTab('auto')}
          >
            <View style={styles.desktopAutoTradingContent}>
              <Text style={styles.desktopAutoTradingIcon}>🤖</Text>
              <View>
                <Text style={styles.desktopAutoTradingTitle}>Auto Trading</Text>
                <Text style={styles.desktopAutoTradingSubtitle}>AI-Powered Trading Bot</Text>
              </View>
            </View>
            <Text style={styles.desktopAutoTradingArrow}>→</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Center Panel - Chart */}
      <View style={styles.desktopCenterPanel}>
        <View style={styles.desktopChartHeader}>
          <Text style={styles.desktopChartTitle}>XAUUSD Chart</Text>
        </View>
        <TradingChart 
          symbol="OANDA:XAUUSD" 
          interval="15" 
          theme="dark" 
          height={Dimensions.get('window').height - 140}
        />
      </View>

      {/* Right Panel - History */}
      <View style={styles.desktopRightPanel}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <TradeHistory 
            trades={tradeHistory} 
            currentPrice={priceData.bid} 
            onCloseTrade={handleCloseTrade}
          />
        </ScrollView>
      </View>
    </View>
    );
  };

  // Mobile layout
  const renderMobileLayout = () => (
    <>
      {activeTab === 'auto' ? (
        <AutoTradingScreen onBack={() => setActiveTab('trade')} />
      ) : activeTab === 'history' ? (
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <TradeHistory 
            trades={tradeHistory} 
            currentPrice={priceData.bid} 
            onCloseTrade={handleCloseTrade}
          />
        </ScrollView>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <AccountCard 
            account={account} 
            dailyProfit={dailyRealizedProfit}
            onMoneyManagementPress={() => setMoneyManagementVisible(true)}
          />
          <PriceDisplay 
            priceData={priceData} 
            onChartPress={() => setChartVisible(true)}
          />
          <TradingButtons 
            onBuy={() => handleTrade('BUY')} 
            onSell={() => handleTrade('SELL')}
            bidPrice={priceData.bid}
            askPrice={priceData.ask}
            disabled={isDailyTargetReached(account.equity, dailyRealizedProfit) || hasOpenOrders()}
            dailyProfit={dailyRealizedProfit}
            dailyTarget={getCurrentLevel(account.equity).dailyTarget}
            hasOpenOrder={hasOpenOrders()}
            recommendedLotSize={getRecommendedLotSize()}
          />
        </ScrollView>
      )}

      <BottomNav activeTab={activeTab} onTabPress={setActiveTab} />
    </>
  );

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0D1421" />
      <LinearGradient
        colors={['#0D1421', '#1A2332', '#0D1421']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <Header onLogout={handleLogout} />
          
          {isDesktop ? renderDesktopLayout() : renderMobileLayout()}

          {/* Only show these modals on mobile, desktop has inline */}
          {!isDesktop && (
            <>
              {/* Full Screen Chart Modal */}
              <Modal
                visible={isChartVisible}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setChartVisible(false)}
              >
                <View style={styles.chartModalContainer}>
                  <View style={styles.chartModalHeader}>
                    <Text style={styles.chartModalTitle}>XAUUSD Chart</Text>
                    <TouchableOpacity 
                      style={styles.chartCloseButton}
                      onPress={() => setChartVisible(false)}
                    >
                      <Text style={styles.chartCloseButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <TradingChart 
                    symbol="OANDA:XAUUSD" 
                    interval="15" 
                    theme="dark" 
                    height={Dimensions.get('window').height - 100}
                  />
                </View>
              </Modal>
            </>
          )}

          {/* Trade Modal and Money Management work on both mobile and desktop */}
          <TradeModal 
            visible={isModalVisible}
            tradeType={tradeType}
            price={tradeType === 'BUY' ? priceData.ask : priceData.bid}
            lotSize={getRecommendedLotSize()}
            currentLevel={getCurrentLevel(account.equity).level}
            dailyTarget={getCurrentLevel(account.equity).dailyTarget}
            onClose={() => setModalVisible(false)}
            onExecute={executeTrade}
          />

          <MoneyManagement
            balance={account.equity}
            visible={isMoneyManagementVisible}
            onClose={() => setMoneyManagementVisible(false)}
          />
        </SafeAreaView>
      </LinearGradient>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loginSafeArea: {
    flex: 1,
    backgroundColor: '#0D1421',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  // Desktop Layout Styles
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  desktopLeftPanel: {
    width: 340,
    minWidth: 300,
    flexShrink: 0,
  },
  desktopScrollView: {
    flex: 1,
    paddingRight: 4,
  },
  desktopCenterPanel: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    overflow: 'hidden',
    minWidth: 300,
  },
  desktopChartHeader: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  desktopChartTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  desktopRightPanel: {
    width: 380,
    minWidth: 320,
    flexShrink: 0,
  },
  desktopAutoTradingButton: {
    marginTop: 16,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#3B4A5E',
  },
  desktopAutoTradingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  desktopAutoTradingIcon: {
    fontSize: 28,
  },
  desktopAutoTradingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  desktopAutoTradingSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  desktopAutoTradingArrow: {
    color: '#00D4AA',
    fontSize: 20,
    fontWeight: '600',
  },
  chartModalContainer: {
    flex: 1,
    backgroundColor: '#0D1421',
  },
  chartModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: '#1E293B',
  },
  chartModalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  chartCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
});
