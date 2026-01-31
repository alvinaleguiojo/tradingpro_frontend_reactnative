import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TradeType } from '../types';

interface TradeModalProps {
  visible: boolean;
  tradeType: TradeType | null;
  price: number;
  lotSize: number;
  currentLevel: number;
  dailyTarget: number;
  onClose: () => void;
  onExecute: () => void;
}

const TradeModal: React.FC<TradeModalProps> = ({ 
  visible, 
  tradeType, 
  price, 
  lotSize,
  currentLevel,
  dailyTarget,
  onClose, 
  onExecute 
}) => {
  const isBuy = tradeType === 'BUY';

  const marginRequired = lotSize * 1000;
  const pipValue = lotSize * 10;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isBuy ? '#00D4AA' : '#EF4444' }]}>
            <View style={styles.headerLeft}>
              <Ionicons 
                name={isBuy ? 'arrow-up-circle' : 'arrow-down-circle'} 
                size={28} 
                color={isBuy ? '#00D4AA' : '#EF4444'} 
              />
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>{tradeType} XAUUSD</Text>
                <Text style={styles.headerSubtitle}>Market Order</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Execution Price</Text>
            <Text style={[styles.priceValue, { color: isBuy ? '#00D4AA' : '#EF4444' }]}>
              ${price?.toFixed(2)}
            </Text>
          </View>

          {/* Money Management Lot Size */}
          <View style={styles.mmSection}>
            <LinearGradient
              colors={['#D4AF37', '#FFD700']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.mmBadge}
            >
              <Ionicons name="shield-checkmark" size={20} color="#1A1A2E" />
              <Text style={styles.mmBadgeText}>Money Management</Text>
            </LinearGradient>
            
            <View style={styles.mmInfo}>
              <View style={styles.mmRow}>
                <Text style={styles.mmLabel}>Current Level</Text>
                <Text style={styles.mmValue}>Level {currentLevel}</Text>
              </View>
              <View style={styles.mmRow}>
                <Text style={styles.mmLabel}>Lot Size</Text>
                <Text style={styles.mmLotValue}>{lotSize.toFixed(2)}</Text>
              </View>
              <View style={styles.mmRow}>
                <Text style={styles.mmLabel}>Daily Target</Text>
                <Text style={styles.mmTargetValue}>${dailyTarget.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.mmNote}>
              <Ionicons name="information-circle" size={16} color="#D4AF37" />
              <Text style={styles.mmNoteText}>
                Lot size is fixed based on your account balance and money management plan.
              </Text>
            </View>
          </View>

          {/* Trade Info */}
          <View style={styles.tradeInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Margin Required</Text>
              <Text style={styles.infoValue}>${marginRequired.toFixed(2)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pip Value</Text>
              <Text style={styles.infoValue}>${pipValue.toFixed(2)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Commission</Text>
              <Text style={styles.infoValue}>$0.00</Text>
            </View>
          </View>

          {/* Execute Button */}
          <TouchableOpacity onPress={onExecute} activeOpacity={0.8}>
            <LinearGradient
              colors={isBuy ? ['#059669', '#047857'] : ['#DC2626', '#B91C1C']}
              style={styles.executeButton}
            >
              <Ionicons 
                name={isBuy ? 'arrow-up' : 'arrow-down'} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.executeButtonText}>
                {tradeType} {lotSize.toFixed(2)} LOT @ ${price?.toFixed(2)}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Warning */}
          <View style={styles.warning}>
            <Ionicons name="warning" size={14} color="#F59E0B" />
            <Text style={styles.warningText}>
              Only one order allowed at a time
            </Text>
          </View>

          {/* Cancel */}
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
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
  modalContainer: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 2,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  closeButton: {
    padding: 4,
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  mmSection: {
    backgroundColor: '#0D1421',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D4AF3730',
  },
  mmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 16,
    gap: 8,
  },
  mmBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  mmInfo: {
    gap: 12,
  },
  mmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mmLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  mmValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mmLotValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D4AF37',
  },
  mmTargetValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D4AA',
  },
  mmNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3B4A5E',
    gap: 8,
  },
  mmNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  tradeInfo: {
    backgroundColor: '#0D1421',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  executeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    gap: 8,
  },
  executeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  warning: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
  },
  cancelButton: {
    alignItems: 'center',
    padding: 14,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});

export default TradeModal;
