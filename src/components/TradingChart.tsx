import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';

interface TradingChartProps {
  symbol?: string;
  interval?: string;
  theme?: 'dark' | 'light';
  height?: number;
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

// Native component using WebView with TradingView
const TradingChartNative: React.FC<TradingChartProps> = ({
  symbol = 'OANDA:XAUUSD',
  interval = '15',
  theme = 'dark',
  height = 400,
}) => {
  // Dynamic import for WebView (only on native)
  const WebView = require('react-native-webview').WebView;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            background-color: ${theme === 'dark' ? '#0D1421' : '#ffffff'}; 
            overflow: hidden;
          }
          .tradingview-widget-container { 
            height: 100vh; 
            width: 100vw; 
          }
          .tradingview-widget-container__widget { 
            height: 100%; 
            width: 100%; 
          }
        </style>
      </head>
      <body>
        <div class="tradingview-widget-container">
          <div class="tradingview-widget-container__widget"></div>
          <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" async>
            ${JSON.stringify({
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
              hide_top_toolbar: false,
              hide_legend: false,
              save_image: false,
              hide_volume: false,
              backgroundColor: theme === 'dark' ? 'rgba(13, 20, 33, 1)' : 'rgba(255, 255, 255, 1)',
            })}
          </script>
        </div>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        scrollEnabled={false}
        renderLoading={() => (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Loading chart...</Text>
          </View>
        )}
      />
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
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1421',
  },
  loadingText: {
    color: '#8E9BAE',
    fontSize: 14,
  },
});

export default TradingChart;
