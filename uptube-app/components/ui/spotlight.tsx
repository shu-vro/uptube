import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type SpotlightProps = {
  leftColor?: string;
  rightColor?: string;
  spotSize?: number;
  blurAmount?: number;
};

const Spotlight: React.FC<SpotlightProps> = ({
  leftColor = '#ff0000',
  rightColor = '#0000ff',
  spotSize = SCREEN_WIDTH * 0.8,
  blurAmount = 15,
}) => {
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];
  return (
    <View style={styles.container} className="h-screen">
      {/* Left spotlight (Red) */}
      <View style={[styles.leftSpot, { width: spotSize, height: spotSize }]}>
        <LinearGradient
          colors={[
            `${leftColor}80`, // 50% opacity at center
            `${leftColor}40`, // 25% opacity
            `${leftColor}20`, // 12% opacity
            `${leftColor}10`, // 6% opacity
            'transparent', // Fully transparent at edges
          ]}
          style={styles.spotGradient}
        />
      </View>

      {/* Right spotlight (Blue) */}
      <View style={[styles.rightSpot, { width: spotSize, height: spotSize }]}>
        <LinearGradient
          colors={[
            `${rightColor}80`, // 50% opacity at center
            `${rightColor}40`, // 25% opacity
            `${rightColor}20`, // 12% opacity
            `${rightColor}10`, // 6% opacity
            'transparent', // Fully transparent at edges
          ]}
          style={styles.spotGradient}
        />
      </View>

      <BlurView
        style={{
          ...StyleSheet.absoluteFillObject,
          height: SCREEN_HEIGHT + 200,
        }}
        blurType={colorScheme === 'dark' ? 'dark' : 'light'}
        blurAmount={20}
        reducedTransparencyFallbackColor={colors.background}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -100,
  },
  leftSpot: {
    position: 'absolute',
    top: -SCREEN_WIDTH * 0.3, // Positioned above screen
    left: -SCREEN_WIDTH * 0.2, // Slightly off left edge
    borderRadius: SCREEN_WIDTH * 0.4, // Circular
  },
  rightSpot: {
    position: 'absolute',
    top: -SCREEN_WIDTH * 0.3, // Positioned above screen
    right: -SCREEN_WIDTH * 0.2, // Slightly off right edge
    borderRadius: SCREEN_WIDTH * 0.4, // Circular
  },
  spotGradient: {
    flex: 1,
    borderRadius: SCREEN_WIDTH * 0.4,
  },
});

export default React.memo(Spotlight);
export { Spotlight };
