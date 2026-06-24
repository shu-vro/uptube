import { Pressable, View } from 'react-native';
import React from 'react';
import { Text } from '@/components/ui/text';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { THEME } from '@/lib/theme';
import { useColorScheme } from 'nativewind';
import { cn } from '@/lib/utils';

type SimpleHeaderProps = {
  title: string;
  separator?: boolean;
};

export default function SimpleHeader({ title, separator = false }: SimpleHeaderProps) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];
  return (
    <View
      className={cn('flex-row items-center px-4 py-3 pl-0', separator && 'border-b border-border')}>
      <Pressable onPress={() => router.back()} className="mr-0 rounded-full p-2 active:bg-muted">
        <ArrowLeft size={24} color={colors.foreground} />
      </Pressable>
      <Text variant="h4" numberOfLines={1} className="flex-1">
        {title}
      </Text>
    </View>
  );
}
