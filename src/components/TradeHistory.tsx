import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trade, TradeFilter } from '../types';

interface TradeHistoryProps {
  trades: Trade[];
  currentPrice: number;
  onCloseTrade?: (trade: Trade) => void;
}

const TradeHistory: React.FC<TradeHistoryProps> = ({ trades, currentPrice, onCloseTrade }) => {
  const [filter, setFilter] = useState<TradeFilter>('all');
  
  // Safe number helper
  const safeNumber = (val: any): number => (typeof val === 'number' && !isNaN(val) ? val : 0);
  
  // Ensure trades is an array
  const safeTrades = Array.isArray(trades) ? trades : [];
  
  const filteredTrades = safeTrades.filter(trade => {
    if (filter === 'all') return true;
    if (filter === 'open') return trade.status === 'OPEN';
    if (filter === 'closed') return trade.status === 'CLOSED';
    return true;
  });

  const calculateProfit = (trade: Trade): number => {
    // Use profit directly from the API - it's already calculated by MT5
    return safeNumber(trade?.profit);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalProfit = safeTrades.reduce((sum, t) => sum + calculateProfit(t), 0);
  const openTradesCount = safeTrades.filter(t => t.status === 'OPEN').length;

  const filters: TradeFilter[] = ['all', 'open', 'closed'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Trade History</Text>
        <View style={styles.filterContainer}>
          {filters.map((filterOption) => (
            <TouchableOpacity 
              key={filterOption}
              style={[styles.filterButton, filter === filterOption && styles.filterButtonActive]}
              onPress={() => setFilter(filterOption)}
            >
              <Text style={[styles.filterText, filter === filterOption && styles.filterTextActive]}>
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Trades</Text>
          <Text style={styles.summaryValue}>{safeTrades.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Open</Text>
          <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>{openTradesCount}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total P/L</Text>
          <Text style={[styles.summaryValue, { color: totalProfit >= 0 ? '#00D4AA' : '#EF4444' }]}>
            {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Trade List */}
      <View style={styles.listContainer}>
        {filteredTrades.map((trade, index) => {
          const profit = calculateProfit(trade);
          const isBuy = trade.type === 'BUY';
          const isProfit = profit >= 0;
          
          return (
            <View 
              key={trade.id} 
              style={[styles.tradeItem, index !== filteredTrades.length - 1 && styles.tradeItemBorder]}
            >
              <View style={styles.tradeLeft}>
                <View style={[styles.typeBadge, { backgroundColor: isBuy ? 'rgba(0, 212, 170, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                  <Ionicons 
                    name={isBuy ? 'arrow-up' : 'arrow-down'} 
                    size={12} 
                    color={isBuy ? '#00D4AA' : '#EF4444'} 
                  />
                  <Text style={[styles.typeText, { color: isBuy ? '#00D4AA' : '#EF4444' }]}>
                    {trade.type}
                  </Text>
                </View>
                
                <View style={styles.tradeInfo}>
                  <View style={styles.tradeHeader}>
                    <Text style={styles.tradeSymbol}>{trade.symbol}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: trade.status === 'OPEN' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(107, 114, 128, 0.15)' }]}>
                      <Text style={[styles.statusText, { color: trade.status === 'OPEN' ? '#3B82F6' : '#6B7280' }]}>
                        {trade.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.tradeLot}>
                    {safeNumber(trade.lotSize).toFixed(2)} Lot @ {safeNumber(trade.openPrice).toFixed(2)}
                  </Text>
                  <Text style={styles.tradeTime}>{formatDate(trade.openTime)}</Text>
                </View>
              </View>
              
              <View style={styles.tradeRight}>
                <Text style={[styles.tradeProfit, { color: isProfit ? '#00D4AA' : '#EF4444' }]}>
                  {isProfit ? '+' : ''}{profit.toFixed(2)}
                </Text>
                <Text style={styles.tradeProfitLabel}>USD</Text>
                {trade.status === 'OPEN' && onCloseTrade && (
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => {
                      Alert.alert(
                        'Close Trade',
                        `Close ${trade.type} ${trade.lotSize} lot(s) of ${trade.symbol}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Close', style: 'destructive', onPress: () => onCloseTrade(trade) }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {filteredTrades.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={48} color="#3B4A5E" />
          <Text style={styles.emptyText}>No trades found</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 2,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  filterButtonActive: {
    backgroundColor: '#00D4AA',
  },
  filterText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
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
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3B4A5E',
    marginTop: 12,
  },
  tradeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 2,
  },
  tradeItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A3547',
    marginBottom: 4,
  },
  tradeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  tradeInfo: {
    flex: 1,
  },
  tradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  tradeSymbol: {
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
  tradeLot: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  tradeTime: {
    fontSize: 11,
    color: '#6B7280',
  },
  tradeRight: {
    alignItems: 'flex-end',
  },
  tradeProfit: {
    fontSize: 16,
    fontWeight: '700',
  },
  tradeProfitLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  closeButton: {
    marginTop: 6,
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
});

export default TradeHistory;
