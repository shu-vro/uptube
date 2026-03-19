import React from 'react';
import FeaturesProvider from './FeaturesContext';
import { AuthProvider } from './AuthContext';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FeaturesProvider>
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
        </GestureHandlerRootView>
      </AuthProvider>
    </FeaturesProvider>
  );
}
