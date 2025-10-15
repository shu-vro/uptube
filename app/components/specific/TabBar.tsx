import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useLinkBuilder } from '@react-navigation/native';
import { BlurView } from '@react-native-community/blur';
import { PlatformPressable } from '@react-navigation/elements';
import { Text } from '../ui/text';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import React, { useEffect, useState } from 'react';
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];
  const [dimention, setDimention] = useState({ width: 100, height: 20 });

  const buttonWidth = dimention.width / state.routes.length;

  const onTabbarLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimention({ width, height });
  };

  const tabPositionX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: tabPositionX.value }],
      width: buttonWidth,
      height: dimention.height,
    };
  });

  useEffect(() => {
    const targetX = buttonWidth * state.index;
    tabPositionX.value = withSpring(targetX, { damping: 100, stiffness: 1000 });
  }, [state.index, buttonWidth, dimention.width, state.routes.length]);

  return (
    <View
      onLayout={onTabbarLayout}
      className="absolute bottom-2 mx-4 flex-row items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-black/10 backdrop-blur-xl dark:bg-white/10"
      style={styles.tabbar}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={colorScheme === 'dark' ? 'dark' : 'light'}
        blurAmount={20}
        reducedTransparencyFallbackColor={colors.background}
      />
      <Animated.View
        className="absolute left-0 top-0 z-0 mx-0 rounded-2xl bg-primary"
        style={[animatedStyle]}
      />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          tabPositionX.value = withSpring(buttonWidth * index, {
            duration: 300,
          });
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };
        return (
          <TabBarItem
            key={route.key}
            route={route}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            options={options}
            label={
              typeof label === 'function'
                ? label({
                    focused: isFocused,
                    color: isFocused ? colors.primary : colors.foreground,
                    position: 'beside-icon',
                    children: route.name,
                  })
                : label
            }
          />
        );
      })}
    </View>
  );
}

function TabBarItem({
  route,
  isFocused,
  onPress,
  onLongPress,
  options,
  label,
}: Partial<React.ComponentProps<typeof PlatformPressable>> & {
  route: any;
  isFocused: boolean;
  options: any;
  label: any;
}) {
  const { colorScheme } = useColorScheme();
  const { buildHref } = useLinkBuilder();
  const colors = THEME[colorScheme ?? 'light'];
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0, {
      duration: 300,
    });
  }, [scale, isFocused]);

  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [0, 1], [1, 0]);

    return {
      opacity,
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    const iconScale = interpolate(scale.value, [0, 1], [1, 1.8]);
    const top = interpolate(scale.value, [0, 1], [0, 9]);

    return {
      transform: [{ scale: iconScale }],
      top,
    };
  });

  return (
    <PlatformPressable
      className="items-center justify-center gap-1 py-2"
      key={route.key}
      href={buildHref(route.name, route.params)}
      accessibilityState={isFocused ? { selected: true } : {}}
      testID={options.tabBarButtonTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={{ flex: 1 }}>
      <Animated.View style={animatedIconStyle}>
        {options.tabBarIcon?.({
          focused: isFocused,
          color: isFocused ? colors.background : colors.foreground,
          size: 24,
        })}
      </Animated.View>
      <Animated.View style={animatedTextStyle}>
        <Text className="text-xs">{label}</Text>
      </Animated.View>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    shadowColor: 'black',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowRadius: 10,
    shadowOpacity: 0.12,
  },
});
