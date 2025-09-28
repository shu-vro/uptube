import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { Lucide } from '@react-native-vector-icons/lucide';

export default function Layout() {
  const { colorScheme } = useColorScheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#666666',
        tabBarActiveBackgroundColor: THEME[colorScheme ?? 'light'].primary,
        tabBarStyle: {
          backgroundColor: THEME[colorScheme ?? 'light'].background,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          headerShown: true,
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, size }) => <Lucide name="compass" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          headerShown: false,
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => <Lucide name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shorts"
        options={{
          headerShown: false,
          tabBarLabel: 'Shorts',
          tabBarIcon: ({ color, size }) => <Lucide name="smartphone" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Lucide name="decimals-arrow-right" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
