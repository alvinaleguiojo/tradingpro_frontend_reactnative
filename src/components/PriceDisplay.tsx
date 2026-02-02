import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PriceData } from '../types';

interface PriceDisplayProps {
  priceData: PriceData;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ priceData }) => {
  const flashAnim = useRef(new Animated.Value(0)).current;
  
  // Safe number helper
  const safeNumber = (val: any): number => (typeof val === 'number' && !isNaN(val) ? val : 0);
  
  const safeBid = safeNumber(priceData?.bid);
  const safeChange = safeNumber(priceData?.change);
  const safeChangePercent = safeNumber(priceData?.changePercent);
  const safeAsk = safeNumber(priceData?.ask);
  const safeHigh = safeNumber(priceData?.high);
  const safeLow = safeNumber(priceData?.low);
  const safeSpread = safeNumber(priceData?.spread);
  
  const prevPriceRef = useRef(safeBid);
  
  const isUp = safeChange >= 0;
  
  useEffect(() => {
    if (prevPriceRef.current !== safeBid) {
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
      prevPriceRef.current = safeBid;
    }
  }, [safeBid, flashAnim]);

  const backgroundColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1E293B', isUp ? 'rgba(0, 212, 170, 0.2)' : 'rgba(239, 68, 68, 0.2)'],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      {/* Symbol Header */}
      <View style={styles.symbolHeader}>
        <View style={styles.symbolInfo}>
          <View style={styles.symbolIcon}>
            <MaterialCommunityIcons name="gold" size={24} color="#FFD700" />
          </View>
          <View>
            <Text style={styles.symbolName}>{priceData.symbol}</Text>
            <Text style={styles.symbolFullName}>{priceData.name}</Text>
          </View>
        </View>
        
        <View style={[styles.changeBadge, { backgroundColor: isUp ? 'rgba(0, 212, 170, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
          <Ionicons 
            name={isUp ? 'arrow-up' : 'arrow-down'} 
            size={14} 
            color={isUp ? '#00D4AA' : '#EF4444'} 
          />
          <Text style={[styles.changeText, { color: isUp ? '#00D4AA' : '#EF4444' }]}>
            {isUp ? '+' : ''}{safeChangePercent.toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* Main Price */}
      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>Current Price</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceDollar}>$</Text>
          <Text style={styles.priceValue}>{safeBid.toFixed(2)}</Text>
          <Ionicons 
            name={isUp ? 'caret-up' : 'caret-down'} 
            size={20} 
            color={isUp ? '#00D4AA' : '#EF4444'}
            style={styles.priceArrow}
          />
        </View>
        <Text style={[styles.priceChange, { color: isUp ? '#00D4AA' : '#EF4444' }]}>
          {isUp ? '+' : ''}{safeChange.toFixed(2)} USD
        </Text>
      </View>

      {/* Bid/Ask Spread */}
      <View style={styles.spreadContainer}>
        <View style={styles.bidAskItem}>
          <Text style={styles.bidAskLabel}>BID</Text>
          <Text style={styles.bidPrice}>{safeBid.toFixed(2)}</Text>
        </View>
        
        <View style={styles.spreadIndicator}>
          <Text style={styles.spreadLabel}>SPREAD</Text>
          <Text style={styles.spreadValue}>{(safeSpread * 100).toFixed(0)}</Text>
        </View>
        
        <View style={styles.bidAskItem}>
          <Text style={styles.bidAskLabel}>ASK</Text>
          <Text style={styles.askPrice}>{safeAsk.toFixed(2)}</Text>
        </View>
      </View>

      {/* High/Low */}
      <View style={styles.highLowContainer}>
        <View style={styles.highLowItem}>
          <Ionicons name="arrow-up-circle" size={16} color="#00D4AA" />
          <Text style={styles.highLowLabel}>High</Text>
          <Text style={styles.highLowValue}>${safeHigh.toFixed(2)}</Text>
        </View>
        
        <View style={styles.highLowDivider} />
        
        <View style={styles.highLowItem}>
          <Ionicons name="arrow-down-circle" size={16} color="#EF4444" />
          <Text style={styles.highLowLabel}>Low</Text>
          <Text style={styles.highLowValue}>${safeLow.toFixed(2)}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#3B4A5E',
  },
  symbolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  symbolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  symbolName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  symbolFullName: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priceDollar: {
    fontSize: 24,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 4,
  },
  priceValue: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  priceArrow: {
    marginLeft: 8,
    marginTop: 8,
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  spreadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bidAskItem: {
    alignItems: 'center',
    flex: 1,
  },
  bidAskLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
    letterSpacing: 1,
  },
  bidPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EF4444',
  },
  askPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00D4AA',
  },
  spreadIndicator: {
    alignItems: 'center',
    backgroundColor: '#2A3547',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  spreadLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  spreadValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  highLowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highLowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  highLowLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 6,
    marginRight: 8,
  },
  highLowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  highLowDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#3B4A5E',
    marginHorizontal: 16,
  },
});

export default PriceDisplay;
