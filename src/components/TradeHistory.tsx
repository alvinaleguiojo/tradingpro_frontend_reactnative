import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, RefreshControl, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trade } from '../types';
import { getOpenTrades, getTradeHistory, modifyOrder } from '../services/backendApi';

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
  stopLoss?: number;
  takeProfit?: number;
}

interface TradeHistoryProps {
  trades?: Trade[];
  currentPrice?: number;
  onCloseTrade?: (trade: Trade) => void;
}


const TradeHistory: React.FC<TradeHistoryProps> = ({ trades: propTrades, currentPrice, onCloseTrade }) => {
  const [filter, setFilter] = useState<FilterType>('open');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalDeposits, setTotalDeposits] = useState(0);
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // Backend-provided totals (across all pages, not just loaded items)
  const [totalClosedCount, setTotalClosedCount] = useState(0);
  const [totalProfitAll, setTotalProfitAll] = useState(0);
  // Open trades state
  const [openTradesItems, setOpenTradesItems] = useState<HistoryItem[]>([]);
  const [isLoadingOpen, setIsLoadingOpen] = useState(false);

  // SL/TP Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTrade, setEditingTrade] = useState<HistoryItem | null>(null);
  const [editStopLoss, setEditStopLoss] = useState('');
  const [editTakeProfit, setEditTakeProfit] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const safeNumber = (val: any): number => (typeof val === 'number' && !isNaN(val) ? val : 0);

  /**
   * Calculate potential profit/loss based on SL and TP
   * For XAUUSD: 1 pip = $0.10 per 0.01 lot = $10 per 1.0 lot
   */
  const calculatePotentialPL = (
    tradeType: 'BUY' | 'SELL' | undefined,
    openPrice: number,
    stopLoss: number,
    takeProfit: number,
    volume: number
  ): { potentialLoss: number; potentialProfit: number } => {
    if (!openPrice || !volume) {
      return { potentialLoss: 0, potentialProfit: 0 };
    }
    
    // For Gold (XAUUSD): $1 move = $100 per 1.0 lot, $1 per 0.01 lot
    // So pip value = $10 per 1.0 lot per pip ($0.10 per 0.01 lot)
    const dollarPerPoint = volume * 100; // $100 per point for 1.0 lot
    
    let potentialLoss = 0;
    let potentialProfit = 0;
    
    if (tradeType === 'BUY') {
      // BUY: Loss if price goes down to SL, Profit if price goes up to TP
      if (stopLoss > 0) {
        potentialLoss = (openPrice - stopLoss) * dollarPerPoint;
      }
      if (takeProfit > 0) {
        potentialProfit = (takeProfit - openPrice) * dollarPerPoint;
      }
    } else if (tradeType === 'SELL') {
      // SELL: Loss if price goes up to SL, Profit if price goes down to TP
      if (stopLoss > 0) {
        potentialLoss = (stopLoss - openPrice) * dollarPerPoint;
      }
      if (takeProfit > 0) {
        potentialProfit = (openPrice - takeProfit) * dollarPerPoint;
      }
    }
    
    return { 
      potentialLoss: Math.abs(potentialLoss), 
      potentialProfit: Math.abs(potentialProfit) 
    };
  };


  // Fetch paginated trade history (closed trades)
  const fetchTradeHistoryPage = useCallback(async (pageToFetch = 1, append = false) => {
    try {
      if (pageToFetch === 1) setIsLoading(true);
      else setIsLoadingMore(true);
      const res = await getTradeHistory(90, pageToFetch, pageSize);
      setTotalPages(res.totalPages || 1);
      setPage(res.page || 1);
      // Store backend-provided totals (across ALL trades, not just this page)
      setTotalClosedCount(res.total || 0);
      if (res.totalProfit !== undefined) {
        setTotalProfitAll(res.totalProfit);
      }
      const mapped: HistoryItem[] = (res.data || []).map((trade: any) => {
        const orderType = String(trade.direction || trade.orderType || trade.dealType || trade.type || '').toUpperCase();
        const isBuy = orderType.includes('BUY') || orderType === '0';
        return {
          id: String(trade.mt5Ticket || trade.ticket || trade.order || trade.id),
          type: 'trade' as const,
          tradeType: (isBuy ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
          symbol: trade.symbol,
          volume: safeNumber(trade.lotSize || trade.lots || trade.closeLots || trade.volume),
          openPrice: safeNumber(trade.entryPrice || trade.openPrice || trade.price),
          closePrice: safeNumber(trade.exitPrice || trade.closePrice),
          profit: safeNumber(trade.profit),
          status: 'CLOSED' as const,
          time: trade.closedAt || trade.closeTime || trade.time || new Date().toISOString(),
          comment: trade.comment || trade.notes,
        };
      });
      setHistoryItems(prev => append ? [...prev, ...mapped] : mapped);
    } catch (error) {
      console.error('Error fetching paginated trade history:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [pageSize]);

  // Fetch open trades from backend
  const fetchOpenTrades = useCallback(async () => {
    setIsLoadingOpen(true);
    try {
      const trades = await getOpenTrades();
      const mapped: HistoryItem[] = (trades || []).map((trade: any) => ({
        id: String(trade.mt5Ticket || trade.id),
        type: 'trade' as const,
        tradeType: (trade.direction || 'BUY') as 'BUY' | 'SELL',
        symbol: trade.symbol,
        volume: safeNumber(trade.lotSize || trade.lots),
        openPrice: safeNumber(trade.entryPrice || trade.openPrice),
        closePrice: undefined,
        profit: safeNumber(trade.profit),
        status: 'OPEN' as const,
        time: trade.openedAt || trade.openTime || new Date().toISOString(),
        stopLoss: safeNumber(trade.stopLoss),
        takeProfit: safeNumber(trade.takeProfit),
      }));
      setOpenTradesItems(mapped);
    } catch (error) {
      console.error('Error fetching open trades:', error);
    } finally {
      setIsLoadingOpen(false);
    }
  }, []);

  // Initial load: fetch both closed and open trades
  useEffect(() => {
    fetchTradeHistoryPage(1, false);
    fetchOpenTrades();
  }, [fetchTradeHistoryPage, fetchOpenTrades]);

  // Auto-refresh open trades so "Open" tab stays current
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOpenTrades();
    }, 10000); // 10s
    return () => clearInterval(interval);
  }, [fetchOpenTrades]);

  // Load more handler
  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      fetchTradeHistoryPage(page + 1, true);
    }
  };

  // Refresh handler
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchTradeHistoryPage(1, false);
    fetchOpenTrades();
  }, [fetchTradeHistoryPage, fetchOpenTrades]);

  // Filter items based on selected tab
  const filteredItems = filter === 'open' ? openTradesItems : historyItems;

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

  // Summary stats: use backend totals for accuracy across all pages
  const openTradesCount = openTradesItems.length;
  const closedTradesCount = totalClosedCount;
  const totalProfit = totalProfitAll;

  const filters: { key: FilterType; label: string }[] = [
    { key: 'open', label: 'Open' },
    { key: 'closed', label: 'Closed' },
  ];


  if (isLoading || (filter === 'open' && isLoadingOpen && openTradesItems.length === 0)) {
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

      {/* History List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FFD700" />
        }
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 20 &&
            !isLoadingMore &&
            page < totalPages
          ) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
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
          
          // Handle close trade button press
          const handleCloseTrade = () => {
            if (onCloseTrade && item.status === 'OPEN') {
              // Convert HistoryItem back to Trade type for the callback
              const trade: Trade = {
                id: item.id,
                type: item.tradeType || 'BUY',
                symbol: item.symbol || 'XAUUSDm',
                lotSize: item.volume || 0.01,
                openPrice: item.openPrice || 0,
                closePrice: item.closePrice,
                openTime: item.time,
                profit: item.profit,
                status: item.status,
              };
              onCloseTrade(trade);
            }
          };

          // Handle edit SL/TP button press
          const handleEditSlTp = () => {
            setEditingTrade(item);
            setEditStopLoss(item.stopLoss?.toString() || '');
            setEditTakeProfit(item.takeProfit?.toString() || '');
            setEditModalVisible(true);
          };
          
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
                  {/* SL/TP Display with Potential P/L */}
                  <View style={styles.slTpContainer}>
                    <Text style={[styles.slTpText, { color: '#EF4444' }]}>
                      SL: {item.stopLoss && item.stopLoss > 0 ? item.stopLoss.toFixed(2) : '--'}
                    </Text>
                    <Text style={styles.slTpDivider}>|</Text>
                    <Text style={[styles.slTpText, { color: '#10B981' }]}>
                      TP: {item.takeProfit && item.takeProfit > 0 ? item.takeProfit.toFixed(2) : '--'}
                    </Text>
                    {item.status === 'OPEN' && (
                      <TouchableOpacity onPress={handleEditSlTp} style={styles.editSlTpButton}>
                        <Ionicons name="pencil" size={12} color="#FFD700" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {/* Potential Profit/Loss Display */}
                  {item.status === 'OPEN' && (item.stopLoss || item.takeProfit) && (
                    <View style={styles.potentialPlContainer}>
                      {(() => {
                        const { potentialLoss, potentialProfit } = calculatePotentialPL(
                          item.tradeType,
                          safeNumber(item.openPrice),
                          safeNumber(item.stopLoss),
                          safeNumber(item.takeProfit),
                          safeNumber(item.volume)
                        );
                        return (
                          <>
                            {potentialLoss > 0 && (
                              <Text style={styles.potentialLoss}>
                                Risk: -${potentialLoss.toFixed(2)}
                              </Text>
                            )}
                            {potentialProfit > 0 && (
                              <Text style={styles.potentialProfit}>
                                Target: +${potentialProfit.toFixed(2)}
                              </Text>
                            )}
                          </>
                        );
                      })()}
                    </View>
                  )}
                  <Text style={styles.itemTime}>{formatDate(item.time)}</Text>
                </View>
              </View>
              
              <View style={styles.itemRight}>
                <Text style={[styles.itemProfit, { color: isProfit ? '#00D4AA' : '#EF4444' }]}>
                  {isProfit ? '+' : ''}{item.profit.toFixed(2)}
                </Text>
                <Text style={styles.itemCurrency}>USD</Text>
                {item.status === 'OPEN' && onCloseTrade && (
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={handleCloseTrade}
                  >
                    <Ionicons name="close-circle" size={14} color="#FFFFFF" />
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {filteredItems.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#3B4A5E" />
        <Text style={styles.emptyText}>No history found</Text>
          </View>
        )}
        {/* Pagination: Load More Button (only for closed trades tab) */}
        {filter === 'closed' && page < totalPages && !isLoading && filteredItems.length > 0 && (
          <TouchableOpacity style={{ padding: 16, alignItems: 'center' }} onPress={handleLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? (
              <ActivityIndicator size="small" color="#FFD700" />
            ) : (
              <Text style={{ color: '#FFD700', fontWeight: '600' }}>Load More</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Edit SL/TP Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit SL/TP</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#8E9BAE" />
              </TouchableOpacity>
            </View>

            {editingTrade && (
              <View style={styles.modalTradeInfo}>
                <Text style={styles.modalTradeSymbol}>{editingTrade.symbol}</Text>
                <Text style={styles.modalTradeDetails}>
                  {editingTrade.tradeType} {editingTrade.volume?.toFixed(2)} @ {editingTrade.openPrice?.toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Stop Loss</Text>
              <TextInput
                style={styles.textInput}
                value={editStopLoss}
                onChangeText={setEditStopLoss}
                placeholder="Enter stop loss price"
                placeholderTextColor="#6B7280"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Take Profit</Text>
              <TextInput
                style={styles.textInput}
                value={editTakeProfit}
                onChangeText={setEditTakeProfit}
                placeholder="Enter take profit price"
                placeholderTextColor="#6B7280"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={async () => {
                  if (!editingTrade) return;
                  setIsSaving(true);
                  try {
                    const sl = parseFloat(editStopLoss) || 0;
                    const tp = parseFloat(editTakeProfit) || 0;
                    const result = await modifyOrder(editingTrade.id, sl, tp);
                    if (result.success) {
                      Alert.alert('Success', 'SL/TP updated successfully');
                      setEditModalVisible(false);
                      // Refresh data
                      fetchOpenTrades();
                    } else {
                      Alert.alert('Error', 'Failed to update SL/TP');
                    }
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'Failed to update SL/TP');
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#0D1421" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  // SL/TP Display Styles
  slTpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  slTpText: {
    fontSize: 11,
    fontWeight: '500',
  },
  slTpDivider: {
    color: '#4B5563',
    marginHorizontal: 6,
    fontSize: 11,
  },
  editSlTpButton: {
    marginLeft: 8,
    padding: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 4,
  },
  // Potential P/L Styles
  potentialPlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 10,
  },
  potentialLoss: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  potentialProfit: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#3B4A5E',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalTradeInfo: {
    backgroundColor: '#0D1421',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalTradeSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalTradeDetails: {
    fontSize: 13,
    color: '#8E9BAE',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E9BAE',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#0D1421',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3B4A5E',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFD700',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#0D1421',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default TradeHistory;
