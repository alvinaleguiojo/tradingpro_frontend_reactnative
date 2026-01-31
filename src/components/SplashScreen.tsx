import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Logo Icon */}
      <View style={styles.logoContainer}>
        <Svg width={120} height={120} viewBox="0 0 400 400">
          <Rect width="400" height="400" rx="48" fill="#1E293B" />
          <Path
            d="M100 300L176 224L236 284L316 144"
            stroke="#00D4AA"
            strokeWidth="36"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="316" cy="144" r="24" fill="#00D4AA" />
        </Svg>
      </View>

      {/* App Name */}
      <View style={styles.textContainer}>
        <Text style={styles.titleWhite}>Trading</Text>
        <Text style={styles.titleAccent}>Pro</Text>
      </View>

      {/* Loading indicator */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingDot} />
        <View style={[styles.loadingDot, styles.loadingDotDelay1]} />
        <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1421',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleWhite: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  titleAccent: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#00D4AA',
  },
  loadingContainer: {
    flexDirection: 'row',
    marginTop: 48,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00D4AA',
    marginHorizontal: 4,
    opacity: 0.4,
  },
  loadingDotDelay1: {
    opacity: 0.7,
  },
  loadingDotDelay2: {
    opacity: 1,
  },
});

export default SplashScreen;
