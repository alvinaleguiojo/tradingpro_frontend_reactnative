import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
}

interface NavItem {
  id: TabType;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabPress }) => {
  const navItems: NavItem[] = [
    { id: 'trade', icon: 'trending-up', label: 'Trade' },
    { id: 'auto', icon: 'flash', label: 'Auto' },
    { id: 'history', icon: 'time-outline', label: 'History' },
    { id: 'account', icon: 'wallet-outline', label: 'Account' },
    { id: 'settings', icon: 'settings-outline', label: 'Settings' },
  ];

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <TouchableOpacity 
            key={item.id}
            style={styles.navItem}
            onPress={() => onTabPress(item.id)}
          >
            <Ionicons 
              name={item.icon} 
              size={24} 
              color={isActive ? '#00D4AA' : '#6B7280'} 
            />
            <Text style={[styles.navText, isActive && styles.navTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#151E2D',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A3547',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  navTextActive: {
    color: '#00D4AA',
  },
});

export default BottomNav;
