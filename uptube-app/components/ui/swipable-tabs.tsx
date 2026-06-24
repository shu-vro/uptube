import React, { ReactNode, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';

type Tab = {
  key: string;
  title: string;
  component: ReactNode;
};

type Props = {
  tabs: Tab[];
  initialTabKey?: string;
  onTabChange?: (key: string) => void;
};

const SCREEN_WIDTH = Dimensions.get('window').width;

const TabContentWrapper = ({ width, children }: { width: number; children: ReactNode }) => (
  <View style={{ width, overflow: 'hidden', flex: 1 }}>{children}</View>
);

export function SwipableTabs({ tabs, initialTabKey, onTabChange }: Props) {
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState(initialTabKey || tabs[0]?.key);
  const [layoutWidth, setLayoutWidth] = useState(SCREEN_WIDTH);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onLayout = (e: any) => {
    setLayoutWidth(e.nativeEvent.layout.width);
  };

  useEffect(() => {
    if (initialTabKey) {
      const index = tabs.findIndex((t) => t.key === initialTabKey);
      if (index !== -1) {
        setTimeout(() => scrollToIndex(index), 0);
        setActiveTab(initialTabKey);
      }
    }
  }, [initialTabKey]);

  const scrollToIndex = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: index * layoutWidth, animated: true });
  };

  const handleTabPress = (key: string, index: number) => {
    setActiveTab(key);
    scrollToIndex(index);
    onTabChange?.(key);
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / layoutWidth);
    const newTabKey = tabs[index]?.key;
    if (newTabKey && newTabKey !== activeTab) {
      setActiveTab(newTabKey);
      onTabChange?.(newTabKey);
    }
  };

  const indicatorLeft = scrollX.interpolate({
    inputRange: tabs.map((_, i) => i * layoutWidth),
    outputRange: tabs.map((_, i) => (i * layoutWidth) / tabs.length),
  });

  return (
    <View className="flex-1" onLayout={onLayout}>
      {/* Tab Header */}
      <View className="relative flex-row border-b border-border">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => handleTabPress(tab.key, index)}
              className="flex-1 items-center justify-center py-3">
              <Text
                className={`text-sm font-bold ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
        {/* Animated Indicator */}
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: 2,
            width: `${100 / tabs.length}%`,
            backgroundColor: colors.primary,
            transform: [{ translateX: indicatorLeft }],
          }}
        />
      </View>

      {/* Tab Content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}>
        {tabs.map((tab) => (
          <TabContentWrapper key={tab.key} width={layoutWidth}>
            {tab.component}
          </TabContentWrapper>
        ))}
      </ScrollView>
    </View>
  );
}
