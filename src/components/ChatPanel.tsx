import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBackendUrl } from '../services/backendApi';

interface ChatMessage {
  _id: string;
  accountId: string;
  username: string;
  message: string;
  channel: string;
  createdAt: string;
  metadata?: {
    avatar?: string;
    accountBalance?: number;
  };
}

interface ChatPanelProps {
  accountId: string;
  username: string;
  isVisible?: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ accountId, username, isVisible = true }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);
  const [channel, setChannel] = useState<'general' | 'signals' | 'help'>('general');
  const scrollViewRef = useRef<ScrollView>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimeRef = useRef<string | null>(null);

  // Scroll to bottom when keyboard shows
  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => scrollToBottom(), 100);
    });
    return () => keyboardDidShow.remove();
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async (isInitial = false) => {
    try {
      const baseUrl = await getBackendUrl();
      const response = await fetch(`${baseUrl}/chat/messages?channel=${channel}&limit=50`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setMessages(result.data);
        if (result.data.length > 0) {
          lastMessageTimeRef.current = result.data[result.data.length - 1].createdAt;
        }
        if (isInitial) {
          setTimeout(() => scrollToBottom(), 100);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [channel]);

  // Poll for new messages
  const pollNewMessages = useCallback(async () => {
    if (!lastMessageTimeRef.current) return;
    
    try {
      const baseUrl = await getBackendUrl();
      const response = await fetch(
        `${baseUrl}/chat/messages/new?channel=${channel}&since=${lastMessageTimeRef.current}`
      );
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        setMessages(prev => [...prev, ...result.data]);
        lastMessageTimeRef.current = result.data[result.data.length - 1].createdAt;
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Failed to poll messages:', error);
    }
  }, [channel]);

  // Fetch active users
  const fetchActiveUsers = useCallback(async () => {
    try {
      const baseUrl = await getBackendUrl();
      const response = await fetch(`${baseUrl}/chat/stats?channel=${channel}`);
      const result = await response.json();
      if (result.success) {
        setActiveUsers(result.data.activeUsers);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [channel]);

  // Initial load and polling
  useEffect(() => {
    if (isVisible) {
      setIsLoading(true);
      fetchMessages(true);
      fetchActiveUsers();
      
      // Poll every 3 seconds
      pollIntervalRef.current = setInterval(() => {
        pollNewMessages();
        fetchActiveUsers();
      }, 3000);
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isVisible, channel, fetchMessages, pollNewMessages, fetchActiveUsers]);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;
    
    setIsSending(true);
    try {
      const baseUrl = await getBackendUrl();
      const response = await fetch(`${baseUrl}/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          username,
          message: newMessage.trim(),
          channel,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        setMessages(prev => [...prev, result.data]);
        setNewMessage('');
        lastMessageTimeRef.current = result.data.createdAt;
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAvatarColor = (id: string): string => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const channels: { key: 'general' | 'signals' | 'help'; label: string; icon: string }[] = [
    { key: 'general', label: 'General', icon: 'chatbubbles' },
    { key: 'signals', label: 'Signals', icon: 'analytics' },
    { key: 'help', label: 'Help', icon: 'help-circle' },
  ];

  if (!isVisible) return null;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 60}
    >
      {/* Channel Tabs with Online Badge */}
      <View style={styles.channelTabsRow}>
        <View style={styles.channelTabs}>
          {channels.map((ch) => (
            <TouchableOpacity
              key={ch.key}
              style={[styles.channelTab, channel === ch.key && styles.channelTabActive]}
              onPress={() => setChannel(ch.key)}
            >
              <Ionicons 
                name={ch.icon as any} 
                size={14} 
                color={channel === ch.key ? '#000' : '#8E9BAE'} 
              />
              <Text style={[styles.channelTabText, channel === ch.key && styles.channelTabTextActive]}>
                {ch.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>{activeUsers} online</Text>
        </View>
      </View>

      {/* Messages */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFD700" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onContentSizeChange={() => scrollToBottom()}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-ellipses-outline" size={32} color="#3B4A5E" />
              <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
            </View>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.accountId === accountId;
              return (
                <View
                  key={msg._id}
                  style={[styles.messageRow, isOwn && styles.messageRowOwn]}
                >
                  {!isOwn && (
                    <View style={[styles.avatar, { backgroundColor: getAvatarColor(msg.accountId) }]}>
                      <Text style={styles.avatarText}>{msg.username.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={[styles.messageBubble, isOwn && styles.messageBubbleOwn]}>
                    {!isOwn && <Text style={styles.messageUsername}>{msg.username}</Text>}
                    <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
                      {msg.message}
                    </Text>
                    <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
                      {formatTime(msg.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#6B7280"
          maxLength={500}
          multiline
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newMessage.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Ionicons name="send" size={18} color="#000" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A2332',
    borderRadius: 0,
    overflow: 'hidden',
    flex: 1,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  onlineText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  channelTabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  channelTabs: {
    flexDirection: 'row',
    gap: 6,
  },
  channelTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#2D3748',
    gap: 4,
  },
  channelTabActive: {
    backgroundColor: '#FFD700',
  },
  channelTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E9BAE',
  },
  channelTabTextActive: {
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#8E9BAE',
    marginTop: 8,
    fontSize: 12,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 12,
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  messageBubble: {
    backgroundColor: '#2D3748',
    borderRadius: 12,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '75%',
  },
  messageBubbleOwn: {
    backgroundColor: '#3B82F6',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 4,
  },
  messageUsername: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  messageTextOwn: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 9,
    color: '#8E9BAE',
    marginTop: 4,
    textAlign: 'right',
  },
  messageTimeOwn: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#3B4A5E',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#2D3748',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
    maxHeight: 80,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatPanel;
