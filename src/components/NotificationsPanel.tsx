import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRecentSignals, getTradingLogs, TradingSignal, TradingLog } from '../services/backendApi';

interface Notification {
  id: string;
  type: 'signal' | 'trade_opened' | 'trade_closed' | 'error' | 'info';
  title: string;
  message: string;
  time: string;
  data?: any;
  isRead?: boolean;
}

interface NotificationsPanelProps {
  visible: boolean;
  onClose: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'signals' | 'trades'>('all');

  const fetchNotifications = useCallback(async () => {
    try {
      const [signals, logs] = await Promise.all([
        getRecentSignals(20).catch(() => []),
        getTradingLogs(50).catch(() => []),
      ]);

      const notificationItems: Notification[] = [];

      // Convert signals to notifications
      if (Array.isArray(signals)) {
        signals.forEach((signal: TradingSignal) => {
          const icon = signal.signalType === 'BUY' ? '📈' : signal.signalType === 'SELL' ? '📉' : '⏸️';
          notificationItems.push({
            id: `signal-${signal.id}`,
            type: 'signal',
            title: `${icon} ${signal.signalType} Signal - ${signal.symbol}`,
            message: `Confidence: ${signal.confidence}% | Entry: $${signal.entryPrice?.toFixed(2) || 'N/A'} | ${signal.strength}`,
            time: signal.createdAt,
            data: signal,
          });
        });
      }

      // Convert trading logs to notifications
      if (Array.isArray(logs)) {
        logs.forEach((log: TradingLog) => {
          let type: Notification['type'] = 'info';
          let icon = '📋';

          if (log.eventType === 'TRADE_OPENED') {
            type = 'trade_opened';
            icon = '🟢';
          } else if (log.eventType === 'TRADE_CLOSED') {
            type = 'trade_closed';
            icon = '🔴';
          } else if (log.eventType === 'SIGNAL_GENERATED') {
            // Skip signals here as we already have them
            return;
          } else if (log.level === 'error') {
            type = 'error';
            icon = '⚠️';
          }

          notificationItems.push({
            id: `log-${log.id}`,
            type,
            title: `${icon} ${log.eventType.replace(/_/g, ' ')}`,
            message: log.message,
            time: log.createdAt,
            data: log.data,
          });
        });
      }

      // Sort by time (newest first)
      notificationItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      setNotifications(notificationItems);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      fetchNotifications();
    }
  }, [visible, fetchNotifications]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchNotifications();
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'signal':
        return { name: 'analytics', color: '#3B82F6' };
      case 'trade_opened':
        return { name: 'arrow-up-circle', color: '#10B981' };
      case 'trade_closed':
        return { name: 'checkmark-circle', color: '#6B7280' };
      case 'error':
        return { name: 'warning', color: '#EF4444' };
      default:
        return { name: 'information-circle', color: '#8E9BAE' };
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'signals') return n.type === 'signal';
    if (filter === 'trades') return n.type === 'trade_opened' || n.type === 'trade_closed';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="notifications" size={24} color="#FFD700" />
              <Text style={styles.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#8E9BAE" />
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            {(['all', 'signals', 'trades'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterButton, filter === f && styles.filterButtonActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FFD700" />
              }
              showsVerticalScrollIndicator={false}
            >
              {filteredNotifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="notifications-off-outline" size={48} color="#3B4A5E" />
                  <Text style={styles.emptyText}>No notifications</Text>
                </View>
              ) : (
                filteredNotifications.map((notification, index) => {
                  const icon = getNotificationIcon(notification.type);
                  return (
                    <View
                      key={notification.id}
                      style={[
                        styles.notificationItem,
                        index !== filteredNotifications.length - 1 && styles.notificationItemBorder,
                      ]}
                    >
                      <View style={[styles.iconContainer, { backgroundColor: `${icon.color}20` }]}>
                        <Ionicons name={icon.name as any} size={20} color={icon.color} />
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        <Text style={styles.notificationMessage} numberOfLines={2}>
                          {notification.message}
                        </Text>
                        <Text style={styles.notificationTime}>{formatTime(notification.time)}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1A2332',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3B4A5E',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2D3748',
  },
  filterButtonActive: {
    backgroundColor: '#FFD700',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E9BAE',
  },
  filterTextActive: {
    color: '#000000',
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
  scrollView: {
    flex: 1,
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
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'flex-start',
  },
  notificationItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 74, 94, 0.5)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 11,
    color: '#6B7280',
  },
});

export default NotificationsPanel;
