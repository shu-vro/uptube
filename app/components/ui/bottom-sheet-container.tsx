import React, { ReactNode, useEffect, useRef } from 'react';
import { Animated, Dimensions, StatusBar, View, StyleSheet } from 'react-native';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type Props = {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  headerHeight: number;
  videoHeight: number;
};

export function BottomSheetContainer({
  isOpen,
  onClose,
  children,
  headerHeight,
  videoHeight,
}: Props) {
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];

  // Calculate available height
  // If in fullscreen, headerHeight is 0, videoHeight is usually huge,
  // but typically this sheet only shows when NOT fullscreen.
  const availableHeight =
    SCREEN_HEIGHT - (StatusBar.currentHeight || 0) - headerHeight - videoHeight;

  // Start off-screen (translationY = availableHeight)
  // We want to animate to 0
  const slideAnim = useRef(new Animated.Value(availableHeight)).current;

  useEffect(() => {
    // Update the initial value if dimensions change and it's closed
    if (!isOpen) {
      slideAnim.setValue(availableHeight);
    }
  }, [availableHeight, isOpen]);

  useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 10,
        restDisplacementThreshold: 4,
        restSpeedThreshold: 4,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: availableHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, availableHeight]);

  // If not open and animation finished (roughly), we could return null.
  // But purely CSS/transform hiding is smoother.
  // We can use pointerEvents to disable touches when "closed".

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: availableHeight,
          backgroundColor: colors.background, // or colors.card
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents={isOpen ? 'auto' : 'none'}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 1000,
    overflow: 'hidden',
    // slight shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
    paddingTop: 8,
  },
});
