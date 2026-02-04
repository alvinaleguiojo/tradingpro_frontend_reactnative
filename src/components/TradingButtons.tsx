import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface TradingButtonsProps {
  onBuy: () => void;
  onSell: () => void;
  bidPrice: number;
  askPrice: number;
  disabled?: boolean;
  dailyProfit?: number;
  dailyTarget?: number;
  hasOpenOrder?: boolean;
  recommendedLotSize?: number;
}

const TradingButtons: React.FC<TradingButtonsProps> = ({ 
  onBuy, 
  onSell, 
  bidPrice, 
  askPrice,
  disabled = false,
  dailyProfit = 0,
  dailyTarget = 0,
  hasOpenOrder = false,
  recommendedLotSize = 0.01,
}) => {
  // Safe number helper
  const safeNumber = (val: any): number => (typeof val === 'number' && !isNaN(val) ? val : 0);
  
  const safeBidPrice = safeNumber(bidPrice);
  const safeAskPrice = safeNumber(askPrice);
  const safeDailyProfit = safeNumber(dailyProfit);
  const safeDailyTarget = safeNumber(dailyTarget);
  const safeLotSize = safeNumber(recommendedLotSize) || 0.01;
  
  const targetReached = disabled && safeDailyProfit >= safeDailyTarget && safeDailyTarget > 0 && !hasOpenOrder;
  const orderOpen = hasOpenOrder;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>Quick Trade</Text>
        <View style={styles.lotBadge}>
          <Text style={styles.lotBadgeText}>Lot: {safeLotSize.toFixed(2)}</Text>
        </View>
      </View>
      
      {/* Target Reached Banner */}
      {targetReached && (
        <View style={styles.targetReachedBanner}>
          <LinearGradient
            colors={['#059669', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.targetReachedGradient}
          >
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <View style={styles.targetReachedText}>
              <Text style={styles.targetReachedTitle}>🎉 Daily Target Reached!</Text>
              <Text style={styles.targetReachedSubtitle}>
                Profit: ${safeDailyProfit.toFixed(2)} / Target: ${safeDailyTarget.toFixed(2)}
              </Text>
              <Text style={styles.targetReachedMessage}>
                Trading is paused. Come back tomorrow!
              </Text>
            </View>
            <Ionicons name="trophy" size={24} color="#FFD700" />
          </LinearGradient>
        </View>
      )}

      {/* Order Open Banner */}
      {orderOpen && !targetReached && (
        <View style={styles.orderOpenBanner}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.orderOpenGradient}
          >
            <Ionicons name="swap-horizontal" size={20} color="#1A1A2E" />
            <Text style={styles.orderOpenText}>Position Open - Close it before opening a new trade</Text>
          </LinearGradient>
        </View>
      )}
      
      <View style={[styles.buttonsRow, disabled && styles.buttonsDisabled]}>
        {/* SELL Button */}
        <TouchableOpacity 
          style={styles.buttonWrapper}
          onPress={disabled ? undefined : onSell}
          activeOpacity={disabled ? 1 : 0.8}
          disabled={disabled}
        >
          <LinearGradient
            colors={disabled ? ['#4B5563', '#374151'] : ['#DC2626', '#B91C1C']}
            style={styles.button}
          >
            <View style={styles.buttonContent}>
              <View style={styles.buttonHeader}>
                <Ionicons name="arrow-down" size={20} color={disabled ? '#9CA3AF' : '#FFFFFF'} />
                <Text style={[styles.buttonLabel, disabled && styles.disabledText]}>SELL</Text>
              </View>
              <Text style={[styles.buttonPrice, disabled && styles.disabledText]}>{safeBidPrice.toFixed(2)}</Text>
              <Text style={[styles.buttonSubtext, disabled && styles.disabledSubtext]}>
                {orderOpen ? 'Close Position First' : (disabled ? 'Trading Paused' : 'At Market Price')}
              </Text>
            </View>
            {!disabled && <View style={styles.buttonGlow} />}
            {disabled && (
              <View style={styles.lockOverlay}>
                <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* BUY Button */}
        <TouchableOpacity 
          style={styles.buttonWrapper}
          onPress={disabled ? undefined : onBuy}
          activeOpacity={disabled ? 1 : 0.8}
          disabled={disabled}
        >
          <LinearGradient
            colors={disabled ? ['#4B5563', '#374151'] : ['#059669', '#047857']}
            style={styles.button}
          >
            <View style={styles.buttonContent}>
              <View style={styles.buttonHeader}>
                <Ionicons name="arrow-up" size={20} color={disabled ? '#9CA3AF' : '#FFFFFF'} />
                <Text style={[styles.buttonLabel, disabled && styles.disabledText]}>BUY</Text>
              </View>
              <Text style={[styles.buttonPrice, disabled && styles.disabledText]}>{safeAskPrice.toFixed(2)}</Text>
              <Text style={[styles.buttonSubtext, disabled && styles.disabledSubtext]}>
                {orderOpen ? 'Close Position First' : (disabled ? 'Trading Paused' : 'At Market Price')}
              </Text>
            </View>
            {!disabled && <View style={styles.buttonGlow} />}
            {disabled && (
              <View style={styles.lockOverlay}>
                <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Money Management Info */}
      <View style={styles.mmInfoBar}>
        <View style={styles.mmInfoItem}>
          <Ionicons name="shield-checkmark" size={16} color="#D4AF37" />
          <Text style={styles.mmInfoText}>Lot size controlled by Money Management</Text>
        </View>
        <View style={styles.mmInfoItem}>
          <Ionicons name="alert-circle" size={16} color="#F59E0B" />
          <Text style={styles.mmInfoText}>Only 1 order at a time</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  lotBadge: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lotBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  targetReachedBanner: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  targetReachedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  targetReachedText: {
    flex: 1,
    alignItems: 'center',
  },
  targetReachedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  targetReachedSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A7F3D0',
    marginBottom: 2,
  },
  targetReachedMessage: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  orderOpenBanner: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  orderOpenGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  orderOpenText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonsDisabled: {
    opacity: 0.7,
  },
  button: {
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonContent: {
    alignItems: 'center',
  },
  buttonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 6,
    letterSpacing: 2,
  },
  buttonPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  lockOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  disabledSubtext: {
    color: 'rgba(156, 163, 175, 0.7)',
  },
  mmInfoBar: {
    marginTop: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#3B4A5E',
    gap: 8,
  },
  mmInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mmInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default TradingButtons;
