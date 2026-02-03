import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { 
            height: 100%;
            width: 100%;
            background-color: ${theme === 'dark' ? '#131722' : '#ffffff'}; 
            overflow: hidden;
          }
          .tradingview-widget-container { 
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            height: 100%;
            width: 100%;
          }
          .tradingview-widget-container__widget { 
            height: 100% !important;
            width: 100% !important;
          }
          iframe {
            height: 100% !important;
            width: 100% !important;
          }
        </style>
      </head>
      <body>
        <div class="tradingview-widget-container">
          <div class="tradingview-widget-container__widget" style="height:100%;width:100%;"></div>
          <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" async>
            ${JSON.stringify({
              autosize: true,
              width: '100%',
              height: '100%',
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
              backgroundColor: theme === 'dark' ? 'rgba(19, 23, 34, 1)' : 'rgba(255, 255, 255, 1)',
            })}
          </script>
        </div>
      </body>
    </html>
  `;

  if (hasError) {
    return (
      <View style={[styles.container, styles.errorContainer, { height }]}>
        <Text style={styles.errorText}>⚠️ Failed to load chart</Text>
        <Text style={styles.errorSubtext}>Please check your internet connection</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading chart...</Text>
        </View>
      )}
      <WebView
        source={{ html: htmlContent }}
        style={[styles.webview, isLoading && { opacity: 0 }]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        scrollEnabled={false}
        originWhitelist={['*']}
        mixedContentMode="always"
        allowsFullscreenVideo={true}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        onHttpError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1421',
    zIndex: 10,
  },
  loadingText: {
    color: '#8E9BAE',
    fontSize: 14,
    marginTop: 12,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  errorSubtext: {
    color: '#8E9BAE',
    fontSize: 14,
    marginTop: 8,
  },
});

export default TradingChart;
