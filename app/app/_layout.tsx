import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import Providers from '@/contexts/Providers';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <Providers>
        {/* the part where you see time, battery, and notifications */}
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        {/* the actual stack from expo-router */}
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="video/[id]"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
        {/* tooltips, modals, and other overlays */}
        <PortalHost />
      </Providers>
    </ThemeProvider>
  );
}
