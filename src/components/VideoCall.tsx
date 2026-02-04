import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Only import WebView for native platforms
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

interface VideoCallProps {
  visible: boolean;
  roomName: string;
  displayName: string;
  onClose: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({
  visible,
  roomName,
  displayName,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Jitsi Meet - use 8x8.vc (allows anonymous meetings without login)
  const jitsiServer = '8x8.vc';
  
  // Create safe room name (alphanumeric only)
  const safeRoomName = `TradingPro${roomName.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  // Jitsi URL with config - 8x8.vc format
  const jitsiUrl = `https://${jitsiServer}/vpaas-magic-cookie-public/${safeRoomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true&userInfo.displayName="${encodeURIComponent(displayName)}"`;

  // For web, hide loading after a short delay since iframe doesn't have onLoad callback reliably
  useEffect(() => {
    if (Platform.OS === 'web' && visible) {
      const timer = setTimeout(() => setIsLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Reset loading state when opening
  useEffect(() => {
    if (visible) {
      setIsLoading(true);
    }
  }, [visible]);

  // Injected JS to customize Jitsi interface
  const injectedJS = `
    (function() {
      // Hide some UI elements for cleaner look
      const style = document.createElement('style');
      style.textContent = \`
        .oOdoW { display: none !important; }
      \`;
      document.head.appendChild(style);
    })();
    true;
  `;

  if (!visible) return null;

  // Web version - use iframe
  if (Platform.OS === 'web') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="videocam" size={22} color="#FFD700" />
              <Text style={styles.headerTitle}>Video Call</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.roomText}>{safeRoomName}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Connecting to video call...</Text>
            </View>
          )}

          {/* Jitsi iframe for web */}
          <iframe
            src={jitsiUrl}
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#000',
            }}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            onLoad={() => setIsLoading(false)}
          />

          {/* Bottom Controls */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.endCallButton} onPress={onClose}>
              <Ionicons name="call" size={24} color="#FFFFFF" />
              <Text style={styles.endCallText}>Leave Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Mobile version - use WebView
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="videocam" size={22} color="#FFD700" />
            <Text style={styles.headerTitle}>Video Call</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.roomText}>{safeRoomName}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Connecting to video call...</Text>
          </View>
        )}

        {/* Jitsi WebView for mobile */}
        {WebView && (
          <WebView
            source={{ uri: jitsiUrl }}
            style={styles.webview}
            onLoadEnd={() => setIsLoading(false)}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            injectedJavaScript={injectedJS}
            mediaCapturePermissionGrantType="grant"
            allowsProtectedMedia={true}
            mixedContentMode="always"
            allowsBackForwardNavigationGestures={false}
          />
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.endCallButton} onPress={onClose}>
            <Ionicons name="call" size={24} color="#FFFFFF" />
            <Text style={styles.endCallText}>Leave Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1421',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    backgroundColor: '#1A2332',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roomText: {
    color: '#8E9BAE',
    fontSize: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D1421',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 14,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: '#1A2332',
  },
  endCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
  },
  endCallText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default VideoCall;
