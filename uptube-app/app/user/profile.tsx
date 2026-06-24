import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/card';
import SimpleHeader from '@/components/specific/SimpleHeader';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { THEME_ICONS } from '@/components/specific/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { Icon } from '@/components/ui/icon';
import { useColorScheme } from 'nativewind';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <SafeAreaView className="bg-background px-2">
      <SimpleHeader title="Profile" />

      <Card className="mt-4 bg-white pt-0">
        <Pressable
          onPress={() => {
            toggleColorScheme();
          }}
          className="px-4">
          <View className="flex flex-row items-center justify-between">
            <Text>Toggle Theme</Text>
            <Icon as={THEME_ICONS[colorScheme ?? 'light']} className="size-5" />
          </View>
        </Pressable>
        <Separator />
        <Pressable
          className="px-4"
          onPress={() => {
            logout();
          }}>
          <View>
            <Text>Log Out</Text>
          </View>
        </Pressable>
      </Card>
    </SafeAreaView>
  );
}
