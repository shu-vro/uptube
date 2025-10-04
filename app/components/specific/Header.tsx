import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import React from 'react';
import { useColorScheme } from 'nativewind';
import Logo from '@/assets/icons/original.svg';
import ThemeToggle from './ThemeToggle';
import { THEME } from '@/lib/theme';

export default function Header() {
  const { colorScheme } = useColorScheme();
  return (
    <View className="sticky top-0 flex-row px-2 pb-4">
      <View className="grow flex-row items-center justify-items-start">
        {/* <Image
          source={require('@/assets/images/react-native-reusables-light.png')}
          style={IMAGE_STYLE}
        /> */}
        <Logo width={32} height={32} color={THEME[colorScheme ?? 'light'].foreground} />
        <Text variant="h3">Header</Text>
      </View>
      <View>
        <ThemeToggle />
      </View>
    </View>
  );
}
