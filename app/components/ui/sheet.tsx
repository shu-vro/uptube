import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';

export default function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];
  const snapPoints = useMemo(() => ['50%', '100%'], []);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    // handle back
    const handleBackPress = () => {
      if (open) {
        bottomSheetModalRef.current?.dismiss();
        return true;
      }
      return false;
    };

    if (open) {
      handlePresentModalPress();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }

    const sub = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      sub.remove();
    };
  }, [open, handlePresentModalPress]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        pressBehavior="close"
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={colorScheme === 'dark' ? 0.75 : 0.35}
      />
    ),
    [colorScheme]
  );

  return (
    <BottomSheetModal
      snapPoints={snapPoints}
      index={0}
      ref={bottomSheetModalRef}
      onChange={handleSheetChanges}
      stackBehavior="push"
      enableDismissOnClose
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: colors.muted }}
      backgroundStyle={{ backgroundColor: colors.border }}
      style={styles.sheetContainer}>
      <BottomSheetScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
        showsVerticalScrollIndicator
        indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
        keyboardShouldPersistTaps="handled">
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    zIndex: 1000000000,
  },
});
