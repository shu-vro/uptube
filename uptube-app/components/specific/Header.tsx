import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/text';
import React from 'react';
import { useColorScheme } from 'nativewind';
import Logo from '@/assets/icons/original.svg';
import ThemeToggle from './ThemeToggle';
import { THEME } from '@/lib/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useRouter } from 'expo-router';

export default function Header() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { user } = useAuth();
  return (
    <View className="sticky top-0 flex-row px-2 pb-4">
      <View className="grow flex-row items-center justify-items-start">
        {/* <Image
          source={require('@/assets/images/react-native-reusables-light.png')}
          style={IMAGE_STYLE}
        /> */}
        <Logo width={32} height={32} color={THEME[colorScheme ?? 'light'].foreground} />
        <Text variant="h3">Uptube</Text>
      </View>

      <View>
        {user?.name ? (
          <TouchableOpacity
            onPress={() => {
              router.push('/user/profile');
            }}>
            <Avatar alt={user?.name ?? 'User'}>
              <AvatarFallback className="bg-primary">
                <Text className="font-bold text-black">{user.name[0]}</Text>
              </AvatarFallback>
            </Avatar>
          </TouchableOpacity>
        ) : (
          <ThemeToggle />
        )}
      </View>
    </View>
  );
}
