import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trade } from '../types';
import { getOpenTrades, getTradeHistory, getDealsHistory } from '../services/backendApi';

type FilterType = 'all' | 'open' | 'closed' | 'deposits';

interface HistoryItem {
  id: string;
  type: 'trade' | 'deposit' | 'withdrawal';
  tradeType?: 'BUY' | 'SELL';
  symbol?: string;
  volume?: number;
  openPrice?: number;
  closePrice?: number;
  profit: number;
  status: 'OPEN' | 'CLOSED';
  time: string;
  comment?: string;
}

interface TradeHistoryProps {
  trades?: Trade[];
  currentPrice?: number;
  onCloseTrade?: (trade: Trade) => void;
}

const TradeHistory: React.FC<TradeHistoryProps> = ({ trades: propTrades, currentPrice, onCloseTrade }) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalDeposits, setTotalDeposits] = useState(0);

  const safeNumber = (val: any): number => (typeof val === 'number' && !isNaN(val) ? val : 0);

  const fetchAllData = useCallback(async () => {
    try {
      const items: HistoryItem[] = [];
      let deposits = 0;

      // First, use props trades if available (these come from MT5 sync)
      if (propTrades && Array.isArray(propTrades) && propTrades.length > 0) {
        propTrades.forEach((trade: any) => {
          const isBuy = trade.type?.includes('Buy') || trade.type === 'BUY' || trade.type === 0;
          items.push({
            id: trade.ticket || trade.id || `trade-${Math.random()}`,
            type: 'trade',
            tradeType: isBuy ? 'BUY' : 'SELL',
            symbol: trade.symbol,
            volume: safeNumber(trade.volume || trade.lotSize),
            openPrice: safeNumber(trade.openPrice),
            closePrice: safeNumber(trade.closePrice),
            profit: safeNumber(trade.profit),
            status: trade.status === 'OPEN' ? 'OPEN' : 'CLOSED',
            time: trade.openTime || trade.closeTime || new Date().toISOString(),
            comment: trade.comment,
          });
        });
      }

      // Try to fetch additional data from backend (open trades from MT5)
      try {
        const openTrades = await getOpenTrades();
        if (Array.isArray(openTrades)) {
          openTrades.forEach((trade: any) => {
            // Avoid duplicates
            const existingIds = items.map(i => i.id);
            const tradeId = trade.ticket || trade.id;
            if (tradeId && !existingIds.includes(tradeId)) {
              items.push({
                id: tradeId,
                type: 'trade',
                tradeType: trade.type?.includes('Buy') || trade.type === 'BUY' || trade.type === 0 ? 'BUY' : 'SELL',
                symbol: trade.symbol,
                volume: safeNumber(trade.volume || trade.lotSize),
                openPrice: safeNumber(trade.openPrice),
                profit: safeNumber(trade.profit),
                status: 'OPEN',
                time: trade.openTime || new Date().toISOString(),
                comment: trade.comment,
              });
            }
          });
        }
      } catch (e) {
        console.log('Could not fetch open trades from backend');
      }
      
      // Try to fetch closed trades history
      try {
        const closedTrades = await getTradeHistory(90);
        if (Array.isArray(closedTrades)) {
          closedTrades.forEach((trade: any) => {
            const existingIds = items.map(i => i.id);
            const tradeId = trade.ticket || trade.order;
            if (tradeId && !existingIds.includes(tradeId)) {
              items.push({
                id: tradeId,
                type: 'trade',
                tradeType: trade.type?.includes('Buy') || trade.type === 'BUY' || trade.type === 0 ? 'BUY' : 'SELL',
                symbol: trade.symbol,
                volume: safeNumber(trade.volume),
                openPrice: safeNumber(trade.openPrice || trade.price),
                closePrice: safeNumber(trade.closePrice),
                profit: safeNumber(trade.profit),
                status: 'CLOSED',
                time: trade.closeTime || trade.time || new Date().toISOString(),
                comment: trade.comment,
              });
            }
          });
        }
      } catch (e) {
        console.log('Could not fetch trade history from backend');
      }
      
      // Try to fetch deals (deposits/withdrawals)
      try {
        const deals = await getDealsHistory(90);
        if (Array.isArray(deals)) {
          deals.forEach((deal: any) => {
            const dealType = deal.type?.toString().toLowerCase() || '';
            const entry = deal.entry?.toString().toLowerCase() || '';
            const isBalanceOp = dealType.includes('balance') || entry === 'balance' || deal.symbol === '' || !deal.symbol;
            
            if (isBalanceOp && deal.profit !== 0) {
              const isDeposit = safeNumber(deal.profit) > 0;
              if (isDeposit) {
                deposits += safeNumber(deal.profit);
              }
              items.push({
                id: deal.ticket || deal.deal || `deal-${Math.random()}`,
                type: isDeposit ? 'deposit' : 'withdrawal',
                profit: safeNumber(deal.profit),
                status: 'CLOSED',
                time: deal.time || new Date().toISOString(),
                comment: deal.comment || (isDeposit ? 'Deposit' : 'Withdrawal'),
              });
            }
          });
        }
      } catch (e) {
        console.log('Could not fetch deals from backend');
      }
      
      setTotalDeposits(deposits);
      
      // Sort by time descending
      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      
      setHistoryItems(items);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [propTrades]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData, propTrades]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchAllData();
  }, [fetchAllData]);

  const filteredItems = historyItems.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'open') return item.type === 'trade' && item.status === 'OPEN';
    if (filter === 'closed') return item.type === 'trade' && item.status === 'CLOSED';
    if (filter === 'deposits') return item.type === 'deposit' || item.type === 'withdrawal';
    return true;
  });

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  // Calculate summary stats
  const openTradesCount = historyItems.filter(t => t.type === 'trade' && t.status === 'OPEN').length;
  const closedTradesCount = historyItems.filter(t => t.type === 'trade' && t.status === 'CLOSED').length;
  const totalProfit = historyItems
    .filter(t => t.type === 'trade')
    .reduce((sum, t) => sum + t.profit, 0);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'closed', label: 'Closed' },
    { key: 'deposits', label: 'Deposits' },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Trading History</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={18} color="#8E9BAE" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filters.map((filterOption) => (
          <TouchableOpacity 
            key={filterOption.key}
            style={[styles.filterButton, filter === filterOption.key && styles.filterButtonActive]}
            onPress={() => setFilter(filterOption.key)}
          >
            <Text style={[styles.filterText, filter === filterOption.key && styles.filterTextActive]}>
              {filterOption.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Ionicons name="swap-horizontal" size={18} color="#3B82F6" />
          <Text style={styles.summaryLabel}>Open</Text>
          <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>{openTradesCount}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Ionicons name="checkmark-circle" size={18} color="#6B7280" />
          <Text style={styles.summaryLabel}>Closed</Text>
          <Text style={styles.summaryValue}>{closedTradesCount}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Ionicons name="trending-up" size={18} color={totalProfit >= 0 ? '#00D4AA' : '#EF4444'} />
          <Text style={styles.summaryLabel}>Profit/Loss</Text>
          <Text style={[styles.summaryValue, { color: totalProfit >= 0 ? '#00D4AA' : '#EF4444' }]}>
            {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Deposits Summary (if deposits filter) */}
      {filter === 'deposits' && (
        <View style={styles.depositsSummary}>
          <Ionicons name="wallet" size={20} color="#FFD700" />
          <Text style={styles.depositsLabel}>Total Deposits:</Text>
          <Text style={styles.depositsValue}>${totalDeposits.toFixed(2)}</Text>
        </View>
      )}

      {/* History List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FFD700" />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.map((item, index) => {
          const isProfit = item.profit >= 0;
          
          if (item.type === 'deposit' || item.type === 'withdrawal') {
            // Deposit/Withdrawal item
            return (
              <View 
                key={item.id} 
                style={[styles.historyItem, index !== filteredItems.length - 1 && styles.historyItemBorder]}
              >
                <View style={styles.itemLeft}>
                  <View style={[styles.typeBadge, { 
                    backgroundColor: item.type === 'deposit' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' 
                  }]}>
                    <Ionicons 
                      name={item.type === 'deposit' ? 'arrow-down' : 'arrow-up'} 
                      size={14} 
                      color={item.type === 'deposit' ? '#10B981' : '#EF4444'} 
                    />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>
                      {item.type === 'deposit' ? '💰 Deposit' : '💸 Withdrawal'}
                    </Text>
                    <Text style={styles.itemTime}>{formatDate(item.time)}</Text>
                    {item.comment && <Text style={styles.itemComment}>{item.comment}</Text>}
                  </View>
                </View>
                <View style={styles.itemRight}>
                  <Text style={[styles.itemAmount, { color: item.type === 'deposit' ? '#10B981' : '#EF4444' }]}>
                    {item.type === 'deposit' ? '+' : ''}{item.profit.toFixed(2)}
                  </Text>
                  <Text style={styles.itemCurrency}>USD</Text>
                </View>
              </View>
            );
          }

          // Trade item
          const isBuy = item.tradeType === 'BUY';
          
          return (
            <View 
              key={item.id} 
              style={[styles.historyItem, index !== filteredItems.length - 1 && styles.historyItemBorder]}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.typeBadge, { 
                  backgroundColor: isBuy ? 'rgba(0, 212, 170, 0.15)' : 'rgba(239, 68, 68, 0.15)' 
                }]}>
                  <Ionicons 
                    name={isBuy ? 'arrow-up' : 'arrow-down'} 
                    size={12} 
                    color={isBuy ? '#00D4AA' : '#EF4444'} 
                  />
                  <Text style={[styles.typeText, { color: isBuy ? '#00D4AA' : '#EF4444' }]}>
                    {item.tradeType}
                  </Text>
                </View>
                
                <View style={styles.itemInfo}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemSymbol}>{item.symbol}</Text>
                    <View style={[styles.statusBadge, { 
                      backgroundColor: item.status === 'OPEN' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(107, 114, 128, 0.15)' 
                    }]}>
                      <Text style={[styles.statusText, { color: item.status === 'OPEN' ? '#3B82F6' : '#6B7280' }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemDetails}>
                    {safeNumber(item.volume).toFixed(2)} Lot @ {safeNumber(item.openPrice).toFixed(2)}
                  </Text>
                  <Text style={styles.itemTime}>{formatDate(item.time)}</Text>
                </View>
              </View>
              
              <View style={styles.itemRight}>
                <Text style={[styles.itemProfit, { color: isProfit ? '#00D4AA' : '#EF4444' }]}>
                  {isProfit ? '+' : ''}{item.profit.toFixed(2)}
                </Text>
                <Text style={styles.itemCurrency}>USD</Text>
              </View>
            </View>
          );
        })}

        {filteredItems.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#3B4A5E" />
            <Text style={styles.emptyText}>No {filter === 'all' ? 'history' : filter} found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#8E9BAE',
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FFD700',
  },
  filterText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#0D1421',
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3B4A5E',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#3B4A5E',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  depositsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  depositsLabel: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  depositsValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B4A5E',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A3547',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  itemInfo: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  itemSymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  itemDetails: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  itemTime: {
    fontSize: 11,
    color: '#6B7280',
  },
  itemComment: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemProfit: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemCurrency: {
    fontSize: 11,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
});

export default TradeHistory;
