import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationsPanel from './NotificationsPanel';

interface HeaderProps {
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogoutPress = () => {
    if (Platform.OS === 'web') {
      // Use browser's native confirm dialog for web
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed && onLogout) {
        onLogout();
      }
    } else {
      // Use React Native Alert for mobile
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: onLogout },
        ]
      );
    }
  };

  return (
    <View style={styles.header}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoIcon}>
          <Ionicons name="trending-up" size={18} color="#00D4AA" />
        </View>
        <Text style={styles.logoText}>
          Trading<Text style={styles.logoAccent}>Pro</Text>
        </Text>
      </View>
      
      {/* Right Actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity 
          style={styles.notificationBtn}
          onPress={() => setShowNotifications(true)}
        >
          <Ionicons name="notifications-outline" size={22} color="#9CA3AF" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Notifications Panel */}
      <NotificationsPanel 
        visible={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3B4A5E',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logoAccent: {
    color: '#00D4AA',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBtn: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  logoutBtn: {
    marginLeft: 12,
    padding: 8,
  },
});

export default Header;
