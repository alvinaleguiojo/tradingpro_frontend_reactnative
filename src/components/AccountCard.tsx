import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Account } from '../types';
import { getCurrentLevel, formatCurrency } from '../data/moneyManagement';

interface AccountCardProps {
  account: Account;
  dailyProfit: number;
  onMoneyManagementPress?: () => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, dailyProfit, onMoneyManagementPress }) => {
  // Safe number formatting helpers
  const safeNumber = (val: any): number => (typeof val === 'number' && !isNaN(val) ? val : 0);
  const formatMoney = (val: any): string => safeNumber(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const safeDailyProfit = safeNumber(dailyProfit);
  const isProfit = safeDailyProfit >= 0;
  const currentLevel = getCurrentLevel(safeNumber(account?.equity));
  
  // Determine account type display
  const getAccountTypeDisplay = () => {
    const type = account.accountType?.toLowerCase() || '';
    if (type.includes('demo') || type.includes('trial')) {
      return { label: 'Demo', color: '#F59E0B' }; // Orange for demo
    } else if (type.includes('live') || type.includes('real')) {
      return { label: 'Live', color: '#00D4AA' }; // Green for live
    } else if (type) {
      return { label: account.accountType, color: '#3B82F6' }; // Blue for other
    }
    return { label: 'Live', color: '#00D4AA' }; // Default to Live
  };
  
  const accountTypeInfo = getAccountTypeDisplay();
  
  return (
    <LinearGradient
      colors={['#1E293B', '#334155']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.accountLabel}>Trading Account</Text>
          <Text style={styles.accountId}>{account.accountId}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${accountTypeInfo.color}20` }]}>
          <View style={[styles.statusDot, { backgroundColor: accountTypeInfo.color }]} />
          <Text style={[styles.statusText, { color: accountTypeInfo.color }]}>{accountTypeInfo.label}</Text>
        </View>
      </View>

      {/* Balance Section */}
      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>Total Equity</Text>
        <Text style={styles.balanceAmount}>
          ${formatMoney(account?.equity)}
        </Text>
        <View style={styles.profitContainer}>
          <Ionicons 
            name={isProfit ? 'trending-up' : 'trending-down'} 
            size={16} 
            color={isProfit ? '#00D4AA' : '#EF4444'} 
          />
          <Text style={[styles.profitText, { color: isProfit ? '#00D4AA' : '#EF4444' }]}>
            {isProfit ? '+' : ''}${safeDailyProfit.toFixed(2)} today
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Balance</Text>
          <Text style={styles.statValue}>
            ${formatMoney(account?.balance)}
          </Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Free Margin</Text>
          <Text style={styles.statValue}>
            ${formatMoney(account?.freeMargin)}
          </Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Open Trades</Text>
          <Text style={styles.statValue}>{safeNumber(account?.openPositions)}</Text>
        </View>
      </View>

      {/* Margin Level */}
      <View style={styles.marginLevelContainer}>
        <View style={styles.marginLevelHeader}>
          <Text style={styles.marginLevelLabel}>Margin Level</Text>
          <Text style={styles.marginLevelValue}>{safeNumber(account?.marginLevel).toFixed(2)}%</Text>
        </View>
        <View style={styles.marginLevelBar}>
          <LinearGradient
            colors={['#00D4AA', '#00B894']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.marginLevelFill, { width: '85%' }]}
          />
        </View>
      </View>

      {/* Money Management Button */}
      <TouchableOpacity 
        style={styles.moneyManagementButton}
        onPress={onMoneyManagementPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#D4AF37', '#FFD700']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.moneyManagementGradient}
        >
          <View style={styles.mmLeftSection}>
            <Ionicons name="bar-chart" size={18} color="#1A1A2E" />
            <View style={styles.mmTextSection}>
              <Text style={styles.mmLabel}>Money Management</Text>
              <Text style={styles.mmLevel}>Level {currentLevel.level} • Lot: {currentLevel.lotSize.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.mmRightSection}>
            <Text style={styles.mmTarget}>Daily: {formatCurrency(currentLevel.dailyTarget)}</Text>
            <Ionicons name="chevron-forward" size={18} color="#1A1A2E" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#3B4A5E',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  accountLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  accountId: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  balanceSection: {
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profitText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#3B4A5E',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  marginLevelContainer: {
    marginTop: 4,
  },
  marginLevelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  marginLevelLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  marginLevelValue: {
    fontSize: 14,
    color: '#00D4AA',
    fontWeight: '600',
  },
  marginLevelBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  marginLevelFill: {
    height: '100%',
    borderRadius: 3,
  },
  moneyManagementButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  moneyManagementGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  mmLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mmTextSection: {
    gap: 2,
  },
  mmLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  mmLevel: {
    fontSize: 11,
    color: '#1A1A2E',
    opacity: 0.8,
  },
  mmRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mmTarget: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A2E',
  },
});

export default AccountCard;
