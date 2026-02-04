import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { 
  BROKER_SERVERS, 
  BrokerServer, 
  searchBrokers, 
  parseBrokerServers,
  connectMt5,
} from '../services/backendApi';

interface LoginScreenProps {
  onLoginSuccess: (sessionId: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [accountNumber, setAccountNumber] = useState('');
  const [password, setPassword] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [serverFilter, setServerFilter] = useState('');
  const [availableServers, setAvailableServers] = useState<BrokerServer[]>(BROKER_SERVERS);
  const [selectedServer, setSelectedServer] = useState<BrokerServer>(BROKER_SERVERS[0]);
  const [showServerPicker, setShowServerPicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Filter servers based on search
  const filteredServers = useCallback(() => {
    if (!serverFilter.trim()) return availableServers;
    return availableServers.filter(server =>
      server.label.toLowerCase().includes(serverFilter.toLowerCase())
    );
  }, [availableServers, serverFilter]);

  // Render item for FlatList
  const renderServerItem = useCallback(({ item: server }: { item: BrokerServer }) => (
    <TouchableOpacity
      style={[
        styles.serverOption,
        selectedServer.label === server.label && styles.serverOptionActive,
      ]}
      onPress={() => {
        setSelectedServer(server);
        setShowServerPicker(false);
        setServerFilter('');
      }}
    >
      <Text
        style={[
          styles.serverOptionText,
          selectedServer.label === server.label && styles.serverOptionTextActive,
        ]}
        numberOfLines={1}
      >
        {server.label}
      </Text>
      {selectedServer.label === server.label && (
        <Ionicons name="checkmark" size={20} color="#00D4AA" />
      )}
    </TouchableOpacity>
  ), [selectedServer]);

  const handleCompanySearch = async () => {
    if (!companySearch.trim()) {
      Alert.alert('Error', 'Please enter a company name to search');
      return;
    }

    setIsSearching(true);

    try {
      const results = await searchBrokers(companySearch);
      
      if (results.length === 0) {
        Alert.alert('No Results', 'No servers found for this company. Please try a different name.');
        return;
      }

      const servers = parseBrokerServers(results);
      setAvailableServers(servers);
      
      if (servers.length > 0) {
        setSelectedServer(servers[0]);
      }
      
      Alert.alert(
        'Success',
        `Found ${servers.length} server(s) for ${companySearch}. Please select one from the dropdown.`
      );
    } catch (error) {
      Alert.alert(
        'Search Failed',
        'Unable to search for brokers. Please check your internet connection and try again.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogin = async () => {
    console.log('handleLogin called'); // Debug log
    
    if (!accountNumber.trim()) {
      Alert.alert('Error', 'Please enter your account number');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    console.log('Connecting to:', selectedServer.host, selectedServer.port); // Debug log
    setIsLoading(true);

    try {
      // Connect via backend (saves credentials and connects to MT5)
      console.log('Calling connectMt5...'); // Debug log
      const result = await connectMt5({
        user: parseInt(accountNumber, 10),
        password: password,
        host: selectedServer.host,
        port: selectedServer.port,
      });
      
      console.log('connectMt5 result:', result); // Debug log

      if (result.success && result.connected) {
        console.log('Connected to MT5 via backend');
        onLoginSuccess('backend-session');
      } else {
        throw new Error(result.error || 'Connection failed');
      }
    } catch (error: any) {
      console.error('Login error:', error); // Debug log
      Alert.alert(
        'Connection Failed',
        error.message || 'Unable to connect to the trading server. Please check your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0D1421', '#1A2332', '#0D1421']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="trending-up" size={40} color="#00D4AA" />
            </View>
            <Text style={styles.logoText}>
              Trading<Text style={styles.logoAccent}>Pro</Text>
            </Text>
            <Text style={styles.tagline}>Connect to your MT5 account</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Company Search */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Broker Company</Text>
              <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons name="search-outline" size={20} color="#00D4AA" />
                  </View>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search company (e.g., Exness)"
                    placeholderTextColor="#6B7280"
                    value={companySearch}
                    onChangeText={setCompanySearch}
                    autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={handleCompanySearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <ActivityIndicator color="#0D1421" size="small" />
                  ) : (
                    <Ionicons name="search" size={20} color="#0D1421" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Server Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Trading Server</Text>
              <TouchableOpacity
                style={styles.serverSelector}
                onPress={() => setShowServerPicker(!showServerPicker)}
              >
                <View style={styles.serverIconContainer}>
                  <Ionicons name="server-outline" size={20} color="#00D4AA" />
                </View>
                <Text style={styles.serverText}>{selectedServer.label}</Text>
                <Ionicons
                  name={showServerPicker ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>

              <Modal
                visible={showServerPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                  setShowServerPicker(false);
                  setServerFilter('');
                }}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Select Server</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setShowServerPicker(false);
                          setServerFilter('');
                        }}
                      >
                        <Ionicons name="close" size={24} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Filter input */}
                    <View style={styles.filterContainer}>
                      <Ionicons name="filter-outline" size={18} color="#6B7280" />
                      <TextInput
                        style={styles.filterInput}
                        placeholder="Filter servers..."
                        placeholderTextColor="#6B7280"
                        value={serverFilter}
                        onChangeText={setServerFilter}
                        autoCapitalize="none"
                      />
                      {serverFilter.length > 0 && (
                        <TouchableOpacity onPress={() => setServerFilter('')}>
                          <Ionicons name="close-circle" size={18} color="#6B7280" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.serverCount}>
                      {filteredServers().length} server(s) available
                    </Text>

                    <FlatList
                      data={filteredServers()}
                      renderItem={renderServerItem}
                      keyExtractor={(item, index) => `${item.host}-${item.port}-${index}`}
                      style={styles.serverList}
                      initialNumToRender={15}
                      maxToRenderPerBatch={10}
                      windowSize={10}
                      removeClippedSubviews={true}
                      getItemLayout={(data, index) => ({
                        length: 52,
                        offset: 52 * index,
                        index,
                      })}
                      ListEmptyComponent={
                        <View style={styles.emptyList}>
                          <Ionicons name="server-outline" size={40} color="#6B7280" />
                          <Text style={styles.emptyListText}>No servers found</Text>
                        </View>
                      }
                    />
                  </View>
                </View>
              </Modal>
            </View>

            {/* Account Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Number</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="person-outline" size={20} color="#00D4AA" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your account number"
                  placeholderTextColor="#6B7280"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#00D4AA" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              style={({ pressed }) => [
                { opacity: pressed ? 0.8 : 1 },
                Platform.OS === 'web' ? { cursor: isLoading ? 'not-allowed' : 'pointer' } : {},
              ]}
            >
              <LinearGradient
                colors={['#00D4AA', '#00B894']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="#0D1421" size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={22} color="#0D1421" />
                    <Text style={styles.loginButtonText}>Connect</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {/* Info */}
            <View style={styles.infoContainer}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                Your credentials are securely transmitted
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    ...(Platform.OS === 'web' ? { alignSelf: 'center', width: '100%', maxWidth: 420 } : {}),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logoAccent: {
    color: '#00D4AA',
  },
  tagline: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: Platform.OS === 'web' ? 20 : 24,
    borderWidth: 1,
    borderColor: '#3B4A5E',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1421',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B4A5E',
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    padding: Platform.OS === 'web' ? 12 : 14,
    fontSize: Platform.OS === 'web' ? 14 : 16,
    color: '#FFFFFF',
  },
  searchButton: {
    width: Platform.OS === 'web' ? 44 : 52,
    height: Platform.OS === 'web' ? 44 : 52,
    backgroundColor: '#00D4AA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1421',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B4A5E',
    overflow: 'hidden',
  },
  inputIconContainer: {
    padding: Platform.OS === 'web' ? 12 : 14,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
  },
  input: {
    flex: 1,
    padding: Platform.OS === 'web' ? 12 : 14,
    fontSize: Platform.OS === 'web' ? 14 : 16,
    color: '#FFFFFF',
  },
  eyeButton: {
    padding: 14,
  },
  serverSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1421',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B4A5E',
    overflow: 'hidden',
  },
  serverIconContainer: {
    padding: 14,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
  },
  serverText: {
    flex: 1,
    padding: Platform.OS === 'web' ? 12 : 14,
    fontSize: Platform.OS === 'web' ? 14 : 16,
    color: '#FFFFFF',
  },
  serverDropdown: {
    marginTop: 8,
    backgroundColor: '#0D1421',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B4A5E',
    overflow: 'hidden',
  },
  serverOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3547',
  },
  serverOptionActive: {
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
  },
  serverOptionText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  serverOptionTextActive: {
    color: '#00D4AA',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3B4A5E',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1421',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3B4A5E',
  },
  filterInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#FFFFFF',
  },
  serverCount: {
    fontSize: 12,
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  serverList: {
    flexGrow: 0,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyListText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  loginButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 14 : 16,
    borderRadius: 12,
    marginTop: 8,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1421',
    marginLeft: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
});

export default LoginScreen;
