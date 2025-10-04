import React from 'react';
import { View, StyleSheet } from 'react-native';
// import Spotlight from '../ui/spotlight';
// import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur';

export default function Gradient() {
  return (
    // pointerEvents="none" lets touches pass through
    <View
      pointerEvents="none"
      className="absolute inset-0 -z-10"
      accessible={false}
      importantForAccessibility="no-hide-descendants">
      {/* <Spotlight /> */}
      {/* <LinearGradient
        colors={['#ff7a7a', '#7f5af0']} // adjust colors
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      /> */}
      {/* optional soft blur on top of gradient
      <BlurView intensity={35} style={StyleSheet.absoluteFill} tint="default" /> */}
    </View>
  );
}
