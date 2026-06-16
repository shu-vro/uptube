import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { ChevronRight, Plus } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';

type SectionHeaderProps = {
  title: string;
  onPress?: () => void;
  onAdd?: () => void;
};

export function SectionHeader({ title, onPress, onAdd }: SectionHeaderProps) {
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];

  return (
    <View className="mb-3 flex-row items-center justify-between px-4">
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        className="flex-row items-center gap-1 active:opacity-70">
        <Text className="text-lg font-semibold">{title}</Text>
        {onPress ? <ChevronRight size={20} color={colors.foreground} /> : null}
      </Pressable>
      {onAdd ? (
        <Pressable onPress={onAdd} className="rounded-full p-1 active:bg-muted">
          <Plus size={24} color={colors.foreground} />
        </Pressable>
      ) : null}
    </View>
  );
}
