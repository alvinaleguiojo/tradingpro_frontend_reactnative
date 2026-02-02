import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform, ScaledSize } from 'react-native';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  showSidebar?: boolean;
}

const DESKTOP_BREAKPOINT = 768;
const MAX_CONTENT_WIDTH = 1400;

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
      setDimensions(window);
    });
    
    return () => subscription?.remove();
  }, []);
  
  const isDesktop = Platform.OS === 'web' && dimensions.width >= DESKTOP_BREAKPOINT;
  const isTablet = dimensions.width >= 600 && dimensions.width < DESKTOP_BREAKPOINT;
  const isMobile = dimensions.width < 600;
  
  return {
    width: dimensions.width,
    height: dimensions.height,
    isDesktop,
    isTablet,
    isMobile,
    isWeb: Platform.OS === 'web',
  };
};

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ 
  children, 
  sidebar,
  showSidebar = true,
}) => {
  const { isDesktop, width } = useResponsive();
  
  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        <View style={[styles.desktopContent, { maxWidth: MAX_CONTENT_WIDTH }]}>
          {showSidebar && sidebar && (
            <View style={styles.sidebar}>
              {sidebar}
            </View>
          )}
          <View style={[styles.mainContent, showSidebar && sidebar ? styles.mainContentWithSidebar : null]}>
            {children}
          </View>
        </View>
      </View>
    );
  }
  
  return <View style={styles.mobileContainer}>{children}</View>;
};

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#0D1421',
  },
  desktopContent: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 24,
  },
  sidebar: {
    width: 320,
    paddingRight: 24,
    paddingTop: 16,
  },
  mainContent: {
    flex: 1,
    paddingTop: 16,
  },
  mainContentWithSidebar: {
    paddingLeft: 0,
  },
  mobileContainer: {
    flex: 1,
  },
});

export default ResponsiveLayout;
