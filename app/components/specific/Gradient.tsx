import React from 'react';
import { View, StyleSheet } from 'react-native';
import Spotlight from '../ui/spotlight';
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
      <Spotlight />
    </View>
  );
}
