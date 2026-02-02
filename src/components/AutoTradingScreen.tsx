import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as backendApi from '../services/backendApi';

interface AutoTradingScreenProps {
  onBack?: () => void;
}

export const AutoTradingScreen: React.FC<AutoTradingScreenProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tradingStatus, setTradingStatus] = useState<backendApi.TradingStatus | null>(null);
  const [moneyManagementStatus, setMoneyManagementStatus] = useState<backendApi.MoneyManagementStatus | null>(null);
  const [tradeStats, setTradeStats] = useState<backendApi.TradeStats | null>(null);
  const [recentSignals, setRecentSignals] = useState<backendApi.TradingSignal[]>([]);
  const [openTrades, setOpenTrades] = useState<backendApi.Trade[]>([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const [mt5Connected, setMt5Connected] = useState(false);
  const [toggling, setToggling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Check backend connection first
      const health = await backendApi.testBackendConnection();
      setBackendConnected(health.connected);

      if (!health.connected) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Check MT5 connection status from backend
      const mt5Status = await backendApi.getMt5Status();
      setMt5Connected(mt5Status.isConnected);

      // Fetch all data in parallel
      const [status, mmStatus, stats, signals, trades] = await Promise.all([
        backendApi.getTradingStatus(),
        backendApi.getMoneyManagementStatus(),
        backendApi.getTradeStats(),
        backendApi.getRecentSignals(10),
        backendApi.getOpenTrades(),
      ]);

      setTradingStatus(status);
      setMoneyManagementStatus(mmStatus);
      setTradeStats(stats);
      setRecentSignals(signals);
      setOpenTrades(trades);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleToggleAutoTrading = async () => {
    if (toggling) return;
    
    setToggling(true);
    try {
      const result = await backendApi.toggleAutoTrading();
      setTradingStatus(prev => prev ? { ...prev, enabled: result.enabled } : null);
      Alert.alert('Success', result.message);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to toggle auto trading');
    } finally {
      setToggling(false);
    }
  };

  const handleManualTrigger = async () => {
    try {
      const result = await backendApi.triggerTradingCycle();
      Alert.alert('Success', result.message);
      // Refresh data after trigger
      setTimeout(fetchData, 2000);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to trigger trading cycle');
    }
  };

  const handleAnalyzeMarket = async () => {
    try {
      const signal = await backendApi.analyzeMarket();
      if (signal) {
        Alert.alert(
          `Signal: ${signal.signalType}`,
          `Confidence: ${signal.confidence}%\nStrength: ${signal.strength}\n\n${signal.reasoning}`
        );
      } else {
        Alert.alert('No Signal', 'No trading signal generated');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to analyze market');
    }
  };

  const handleSyncTrades = async () => {
    try {
      await backendApi.syncTrades();
      Alert.alert('Success', 'Trades synced with MT5');
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sync trades');
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSignalColor = (signalType: string) => {
    switch (signalType) {
      case 'BUY': return '#4CAF50';
      case 'SELL': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  // Safe number formatting helper
  const formatNumber = (value: any, decimals: number = 2): string => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toFixed(decimals);
    }
    return '0';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading Auto Trading...</Text>
      </View>
    );
  }

  if (!backendConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFD700" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Auto Trading</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={64} color="#F44336" />
          <Text style={styles.errorTitle}>Backend Not Connected</Text>
          <Text style={styles.errorText}>
            Unable to connect to the trading backend. Make sure the NestJS server is running.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFD700" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Auto Trading</Text>
        <View style={styles.connectionStatus}>
          <View style={[styles.statusDot, { backgroundColor: mt5Connected ? '#4CAF50' : '#FF9800' }]} />
          <Text style={styles.connectionText}>{mt5Connected ? 'MT5 Connected' : 'MT5 Not Connected'}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFD700"
          />
        }
      >
        {/* Auto Trading Toggle Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flash" size={24} color="#FFD700" />
            <Text style={styles.cardTitle}>Auto Trading</Text>
          </View>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>
                {tradingStatus?.enabled ? 'Enabled' : 'Disabled'}
              </Text>
              <Text style={styles.toggleSubtext}>
                {tradingStatus?.symbol} • {tradingStatus?.timeframe}
              </Text>
            </View>
            <Switch
              value={tradingStatus?.enabled || false}
              onValueChange={handleToggleAutoTrading}
              trackColor={{ false: '#3D3D3D', true: '#4CAF50' }}
              thumbColor={tradingStatus?.enabled ? '#FFD700' : '#888'}
              disabled={toggling}
            />
          </View>
          {tradingStatus?.enabled && (
            <View style={styles.nextRunRow}>
              <Ionicons name="time-outline" size={16} color="#888" />
              <Text style={styles.nextRunText}>
                Next run: {tradingStatus?.nextRun ? formatTime(tradingStatus.nextRun) : 'N/A'}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleManualTrigger}>
            <Ionicons name="play-circle" size={28} color="#4CAF50" />
            <Text style={styles.actionText}>Trigger</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleAnalyzeMarket}>
            <Ionicons name="analytics" size={28} color="#2196F3" />
            <Text style={styles.actionText}>Analyze</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleSyncTrades}>
            <Ionicons name="sync" size={28} color="#FF9800" />
            <Text style={styles.actionText}>Sync</Text>
          </TouchableOpacity>
        </View>

        {/* Money Management Card */}
        {moneyManagementStatus && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="wallet" size={24} color="#FFD700" />
              <Text style={styles.cardTitle}>Money Management</Text>
            </View>
            <View style={styles.mmRow}>
              <View style={styles.mmItem}>
                <Text style={styles.mmLabel}>Level</Text>
                <Text style={styles.mmValue}>{moneyManagementStatus.currentLevel.level}</Text>
              </View>
              <View style={styles.mmItem}>
                <Text style={styles.mmLabel}>Lot Size</Text>
                <Text style={styles.mmValue}>{moneyManagementStatus.recommendedLotSize}</Text>
              </View>
              <View style={styles.mmItem}>
                <Text style={styles.mmLabel}>Balance</Text>
                <Text style={styles.mmValue}>
                  ${formatNumber(moneyManagementStatus.accountState?.currentBalance, 0)}
                </Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Daily Target Progress</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(moneyManagementStatus.dailyTargetProgress || 0, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {formatNumber(moneyManagementStatus.dailyTargetProgress, 1)}%
              </Text>
            </View>
            {moneyManagementStatus.shouldStopTrading.stop && (
              <View style={styles.warningBanner}>
                <Ionicons name="warning" size={20} color="#FF9800" />
                <Text style={styles.warningText}>
                  {moneyManagementStatus.shouldStopTrading.reason}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Trade Statistics Card */}
        {tradeStats && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="stats-chart" size={24} color="#FFD700" />
              <Text style={styles.cardTitle}>Statistics</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{tradeStats.totalTrades}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{tradeStats.openTrades}</Text>
                <Text style={styles.statLabel}>Open</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                  {tradeStats.winningTrades}
                </Text>
                <Text style={styles.statLabel}>Wins</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#F44336' }]}>
                  {tradeStats.losingTrades}
                </Text>
                <Text style={styles.statLabel}>Losses</Text>
              </View>
            </View>
            <View style={styles.statsBottom}>
              <View style={styles.statBottomItem}>
                <Text style={styles.statBottomLabel}>Win Rate</Text>
                <Text style={styles.statBottomValue}>{formatNumber(tradeStats.winRate, 1)}%</Text>
              </View>
              <View style={styles.statBottomItem}>
                <Text style={styles.statBottomLabel}>Total Profit</Text>
                <Text
                  style={[
                    styles.statBottomValue,
                    { color: (tradeStats.totalProfit || 0) >= 0 ? '#4CAF50' : '#F44336' },
                  ]}
                >
                  ${formatNumber(tradeStats.totalProfit, 2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Open Trades Card */}
        {openTrades.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="swap-horizontal" size={24} color="#FFD700" />
              <Text style={styles.cardTitle}>Open Trades ({openTrades.length})</Text>
            </View>
            {openTrades.map((trade) => (
              <View key={trade.id} style={styles.tradeItem}>
                <View style={styles.tradeLeft}>
                  <View
                    style={[
                      styles.directionBadge,
                      { backgroundColor: trade.direction === 'BUY' ? '#4CAF50' : '#F44336' },
                    ]}
                  >
                    <Text style={styles.directionText}>{trade.direction}</Text>
                  </View>
                  <View>
                    <Text style={styles.tradeSymbol}>{trade.symbol}</Text>
                    <Text style={styles.tradeLots}>{trade.lotSize} lots @ {trade.entryPrice}</Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.tradeProfit,
                    { color: (trade.profit || 0) >= 0 ? '#4CAF50' : '#F44336' },
                  ]}
                >
                  ${formatNumber(trade.profit, 2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Signals Card */}
        {recentSignals.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="notifications" size={24} color="#FFD700" />
              <Text style={styles.cardTitle}>Recent Signals</Text>
            </View>
            {recentSignals.slice(0, 5).map((signal) => (
              <View key={signal.id} style={styles.signalItem}>
                <View
                  style={[
                    styles.signalBadge,
                    { backgroundColor: getSignalColor(signal.signalType) },
                  ]}
                >
                  <Text style={styles.signalBadgeText}>{signal.signalType}</Text>
                </View>
                <View style={styles.signalInfo}>
                  <Text style={styles.signalSymbol}>{signal.symbol}</Text>
                  <Text style={styles.signalConfidence}>
                    {signal.confidence}% • {signal.strength}
                  </Text>
                </View>
                <Text style={styles.signalTime}>
                  {formatTime(signal.createdAt)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#2D2D2D',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    flex: 1,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    color: '#4CAF50',
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
  },
  toggleSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  nextRunRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3D3D3D',
  },
  nextRunText: {
    color: '#888',
    marginLeft: 8,
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#2D2D2D',
    padding: 16,
    borderRadius: 12,
    minWidth: 100,
  },
  actionText: {
    color: '#FFF',
    marginTop: 8,
    fontSize: 14,
  },
  mmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mmItem: {
    alignItems: 'center',
  },
  mmLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  mmValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#3D3D3D',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#FFF',
    marginTop: 8,
    textAlign: 'right',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3D2D00',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  warningText: {
    color: '#FF9800',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  statsBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#3D3D3D',
  },
  statBottomItem: {
    flex: 1,
  },
  statBottomLabel: {
    fontSize: 12,
    color: '#888',
  },
  statBottomValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  tradeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  tradeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  directionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  directionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tradeSymbol: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tradeLots: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  tradeProfit: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  signalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  signalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  signalBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  signalInfo: {
    flex: 1,
  },
  signalSymbol: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  signalConfidence: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  signalTime: {
    color: '#888',
    fontSize: 12,
  },
  bottomPadding: {
    height: 100,
  },
});

export default AutoTradingScreen;
