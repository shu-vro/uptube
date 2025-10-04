// import React, { useEffect } from 'react';
// import { View, StyleSheet, Dimensions } from 'react-native';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withRepeat,
//   withSequence,
//   withTiming,
//   interpolate,
//   Easing,
// } from 'react-native-reanimated';
// import { LinearGradient } from 'expo-linear-gradient';

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// type SpotlightProps = {
//   leftColor?: string;
//   rightColor?: string;
//   mixedColor?: string;
//   duration?: number;
//   spotSize?: number;
// };

// const Spotlight: React.FC<SpotlightProps> = ({
//   leftColor = '#ff6b6b', // Red
//   rightColor = '#4ecdc4', // Teal
//   mixedColor = '#a8e6cf', // Mixed green
//   duration = 4,
//   spotSize = SCREEN_WIDTH * 0.8,
// }) => {
//   // Animation value that oscillates between 0 and 1
//   const animValue = useSharedValue(0);

//   useEffect(() => {
//     const d = duration * 1000;
//     animValue.value = withRepeat(
//       withSequence(
//         withTiming(1, { duration: d, easing: Easing.inOut(Easing.sin) }),
//         withTiming(0, { duration: d, easing: Easing.inOut(Easing.sin) })
//       ),
//       -1,
//       false
//     );
//   }, [duration, animValue]);

//   // Left spotlight animation (bright when animValue is 0, dim when 1)
//   const leftSpotStyle = useAnimatedStyle(() => {
//     const opacity = interpolate(animValue.value, [0, 1], [0.8, 0.2]);
//     const scale = interpolate(animValue.value, [0, 1], [1.2, 0.8]);

//     return {
//       opacity,
//       transform: [{ scale }],
//     };
//   });

//   // Right spotlight animation (dim when animValue is 0, bright when 1)
//   const rightSpotStyle = useAnimatedStyle(() => {
//     const opacity = interpolate(animValue.value, [0, 1], [0.2, 0.8]);
//     const scale = interpolate(animValue.value, [0, 1], [0.8, 1.2]);

//     return {
//       opacity,
//       transform: [{ scale }],
//     };
//   });

//   return (
//     <View pointerEvents="none" style={styles.container}>
//       {/* Background gradient that blends the two colors */}
//       <LinearGradient
//         colors={[
//           `${leftColor}15`, // 15% opacity
//           `${mixedColor}25`, // 25% opacity in center
//           `${rightColor}15`, // 15% opacity
//         ]}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//         style={StyleSheet.absoluteFill}
//       />

//       {/* Left spotlight */}
//       <Animated.View
//         style={[styles.leftSpot, { width: spotSize, height: spotSize }, leftSpotStyle]}>
//         <LinearGradient
//           colors={[
//             `${leftColor}60`, // 60% opacity at center
//             `${leftColor}30`, // 30% opacity
//             `${leftColor}10`, // 10% opacity
//             'transparent',
//           ]}
//           style={styles.spotGradient}
//         />
//       </Animated.View>

//       {/* Right spotlight */}
//       <Animated.View
//         style={[styles.rightSpot, { width: spotSize, height: spotSize }, rightSpotStyle]}>
//         <LinearGradient
//           colors={[
//             `${rightColor}60`, // 60% opacity at center
//             `${rightColor}30`, // 30% opacity
//             `${rightColor}10`, // 10% opacity
//             'transparent',
//           ]}
//           style={styles.spotGradient}
//         />
//       </Animated.View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     ...StyleSheet.absoluteFillObject,
//     zIndex: -1,
//   },
//   leftSpot: {
//     position: 'absolute',
//     top: -SCREEN_WIDTH * 0.3, // Positioned above screen
//     left: -SCREEN_WIDTH * 0.2, // Slightly off left edge
//     borderRadius: SCREEN_WIDTH * 0.4, // Circular
//   },
//   rightSpot: {
//     position: 'absolute',
//     top: -SCREEN_WIDTH * 0.3, // Positioned above screen
//     right: -SCREEN_WIDTH * 0.2, // Slightly off right edge
//     borderRadius: SCREEN_WIDTH * 0.4, // Circular
//   },
//   spotGradient: {
//     flex: 1,
//     borderRadius: SCREEN_WIDTH * 0.4,
//   },
// });

// export default React.memo(Spotlight);
// export { Spotlight };
