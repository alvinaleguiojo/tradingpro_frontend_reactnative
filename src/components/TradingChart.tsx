import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TradingChartProps {
  symbol?: string;
  interval?: string;
  theme?: 'dark' | 'light';
  height?: number;
  onClose?: () => void;
}

// Web component using TradingView widget
const TradingChartWeb: React.FC<TradingChartProps> = ({
  symbol = 'OANDA:XAUUSD',
  interval = '15',
  theme = 'dark',
  height = 400,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';

    // Create TradingView widget script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: interval,
      timezone: 'Etc/UTC',
      theme: theme,
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      hide_volume: false,
      backgroundColor: theme === 'dark' ? 'rgba(13, 20, 33, 1)' : 'rgba(255, 255, 255, 1)',
      gridColor: theme === 'dark' ? 'rgba(42, 46, 57, 0.3)' : 'rgba(42, 46, 57, 0.1)',
    });

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';

    const widgetInner = document.createElement('div');
    widgetInner.className = 'tradingview-widget-container__widget';
    widgetInner.style.height = 'calc(100% - 32px)';
    widgetInner.style.width = '100%';

    widgetContainer.appendChild(widgetInner);
    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, interval, theme]);

  return (
    <div
      ref={containerRef}
      style={{
        height: height,
        width: '100%',
        backgroundColor: theme === 'dark' ? '#0D1421' : '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    />
  );
};

// Native component - Opens TradingView in browser
// Note: WebView requires a native rebuild. This version works with OTA updates.
const TradingChartNative: React.FC<TradingChartProps> = ({
  symbol = 'XAUUSD',
  theme = 'dark',
  height = 400,
  onClose,
}) => {
  const [isOpening, setIsOpening] = useState(false);

  // TradingView chart URL
  const chartUrl = `https://www.tradingview.com/chart/?symbol=${symbol}`;

  const openChart = useCallback(async () => {
    setIsOpening(true);
    try {
      const supported = await Linking.canOpenURL(chartUrl);
      if (supported) {
        await Linking.openURL(chartUrl);
      }
    } catch (error) {
      console.error('Error opening chart:', error);
    } finally {
      setIsOpening(false);
      // Close the modal after opening external browser
      onClose?.();
    }
  }, [chartUrl, onClose]);

  // Auto-open the chart when component mounts
  useEffect(() => {
    openChart();
  }, []);

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.nativeContainer}>
        <Ionicons name="trending-up" size={48} color="#FFD700" />
        <Text style={styles.title}>TradingView Chart</Text>
        <Text style={styles.subtitle}>Opening {symbol} chart in browser...</Text>
        
        <TouchableOpacity 
          style={styles.openButton} 
          onPress={openChart}
          disabled={isOpening}
        >
          <Ionicons name="open-outline" size={20} color="#0D1421" />
          <Text style={styles.openButtonText}>
            {isOpening ? 'Opening...' : 'Open TradingView Chart'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Tip: Use TradingView app for best mobile experience
        </Text>
      </View>
    </View>
  );
};

// Main component that switches based on platform
const TradingChart: React.FC<TradingChartProps> = (props) => {
  if (Platform.OS === 'web') {
    return <TradingChartWeb {...props} />;
  }
  return <TradingChartNative {...props} />;
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0D1421',
  },
  nativeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    color: '#8E9BAE',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  openButtonText: {
    color: '#0D1421',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    color: '#8E9BAE',
    fontSize: 12,
    marginTop: 24,
    textAlign: 'center',
  },
});

export default TradingChart;
