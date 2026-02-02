import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  moneyManagementLevels,
  getCurrentLevel,
  getNextLevel,
  getProgressToNextLevel,
  formatCurrency,
  MoneyLevel,
} from '../data/moneyManagement';

interface MoneyManagementProps {
  balance: number;
  visible: boolean;
  onClose: () => void;
}

export const MoneyManagement: React.FC<MoneyManagementProps> = ({
  balance,
  visible,
  onClose,
}) => {
  const currentLevel = getCurrentLevel(balance);
  const nextLevel = getNextLevel(balance);
  const progress = getProgressToNextLevel(balance);

  const renderLevelRow = (level: MoneyLevel, index: number) => {
    const isCurrentLevel = level.level === currentLevel.level;
    const isCompleted = balance >= level.balance;

    return (
      <View
        key={level.level}
        style={[
          styles.levelRow,
          isCurrentLevel && styles.currentLevelRow,
          index % 2 === 0 && styles.evenRow,
        ]}
      >
        <View style={styles.levelCell}>
          <Text style={[styles.cellText, isCurrentLevel && styles.currentLevelText]}>
            {level.level}
          </Text>
        </View>
        <View style={styles.balanceCell}>
          <Text style={[styles.cellText, isCurrentLevel && styles.currentLevelText]}>
            {formatCurrency(level.balance)}
          </Text>
        </View>
        <View style={styles.lotCell}>
          <Text style={[styles.cellText, styles.lotText, isCurrentLevel && styles.currentLevelText]}>
            {level.lotSize.toFixed(2)}
          </Text>
        </View>
        <View style={styles.targetCell}>
          <Text style={[styles.cellText, isCurrentLevel && styles.currentLevelText]}>
            {formatCurrency(level.dailyTarget)}
          </Text>
        </View>
        <View style={styles.checkCell}>
          {isCompleted ? (
            <Ionicons name="checkmark-circle" size={20} color="#00C853" />
          ) : (
            <Ionicons name="ellipse-outline" size={20} color="#666" />
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <LinearGradient
            colors={['#D4AF37', '#FFD700', '#D4AF37']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Money Management</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1A1A2E" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Current Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Current Level</Text>
                <Text style={styles.statusValue}>{currentLevel.level}</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Balance</Text>
                <Text style={styles.statusValue}>{formatCurrency(balance)}</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Lot Size</Text>
                <Text style={styles.lotValue}>{currentLevel.lotSize.toFixed(2)}</Text>
              </View>
            </View>

            {/* Progress to next level */}
            {nextLevel && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progress to Level {nextLevel.level}</Text>
                  <Text style={styles.progressPercent}>{progress.toFixed(1)}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.nextTarget}>
                  Next: {formatCurrency(nextLevel.balance)} ({formatCurrency(nextLevel.balance - balance)} to go)
                </Text>
              </View>
            )}

            {/* Daily/Weekly/Monthly Targets */}
            <View style={styles.targetsRow}>
              <View style={styles.targetItem}>
                <Text style={styles.targetLabel}>Daily</Text>
                <Text style={styles.targetValue}>{formatCurrency(currentLevel.dailyTarget)}</Text>
              </View>
              <View style={styles.targetItem}>
                <Text style={styles.targetLabel}>Weekly</Text>
                <Text style={styles.targetValue}>{formatCurrency(currentLevel.weeklyTarget)}</Text>
              </View>
              <View style={styles.targetItem}>
                <Text style={styles.targetLabel}>Monthly</Text>
                <Text style={styles.targetValue}>{formatCurrency(currentLevel.monthlyTarget)}</Text>
              </View>
            </View>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.levelCell}>
              <Text style={styles.headerText}>Lvl</Text>
            </View>
            <View style={styles.balanceCell}>
              <Text style={styles.headerText}>Balance</Text>
            </View>
            <View style={styles.lotCell}>
              <Text style={styles.headerText}>Lot</Text>
            </View>
            <View style={styles.targetCell}>
              <Text style={styles.headerText}>Daily</Text>
            </View>
            <View style={styles.checkCell}>
              <Text style={styles.headerText}>✓</Text>
            </View>
          </View>

          {/* Levels Table */}
          <ScrollView style={styles.tableScroll} showsVerticalScrollIndicator={true}>
            {moneyManagementLevels.map((level, index) => renderLevelRow(level, index))}
          </ScrollView>

          {/* Info Footer */}
          <View style={styles.footer}>
            <Ionicons name="information-circle" size={16} color="#D4AF37" />
            <Text style={styles.footerText}>
              Targets: Daily 3% | Weekly 15% | Monthly 60%
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  closeButton: {
    padding: 4,
  },
  statusCard: {
    backgroundColor: '#252542',
    margin: 12,
    borderRadius: 12,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  lotValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#888',
  },
  progressPercent: {
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#1A1A2E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 4,
  },
  nextTarget: {
    fontSize: 11,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
  targetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#1A1A2E',
    paddingTop: 12,
  },
  targetItem: {
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  targetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00C853',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#D4AF37',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  tableScroll: {
    maxHeight: 300,
  },
  levelRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#252542',
  },
  evenRow: {
    backgroundColor: 'rgba(37, 37, 66, 0.5)',
  },
  currentLevelRow: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
  },
  levelCell: {
    width: 35,
    alignItems: 'center',
  },
  balanceCell: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  lotCell: {
    width: 50,
    alignItems: 'center',
  },
  targetCell: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  checkCell: {
    width: 30,
    alignItems: 'center',
  },
  cellText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  lotText: {
    color: '#D4AF37',
    fontWeight: '600',
  },
  currentLevelText: {
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#252542',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: '#888',
  },
});

export default MoneyManagement;
