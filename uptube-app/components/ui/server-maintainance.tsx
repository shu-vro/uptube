import React, { useState } from 'react';
import { TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './text';
import MaintainanceImage from '@/assets/svgs/maintenance.svg';
import ConnectionLostImage from '@/assets/svgs/connection_lost.svg';

const messageTypes = {
  maintainance: {
    title: "We'll be back soon",
    description:
      "Our servers are currently under maintenance. We're working hard to bring everything back online as quickly as possible.",
    image: <ConnectionLostImage width={220} height={220} />,
  },
  'something-went-wrong': {
    title: 'Something went wrong',
    description:
      'An unexpected error occurred while connecting to our servers. Please check your connection and try again.',
    image: <MaintainanceImage width={220} height={220} />,
  },
};

export default function ServerMaintenance({
  onRetry,
  type = 'maintainance',
  message,
}: {
  onRetry?: () => Promise<void> | void;
  type?: keyof typeof messageTypes;
  message?: string;
}) {
  const [loading, setLoading] = useState(false);
  const { title, description } = messageTypes[type];

  const handleRetry = async () => {
    if (loading) return;
    try {
      setLoading(true);
      await (onRetry ? onRetry() : new Promise((r) => setTimeout(r, 1500)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background p-5">
      <View className="w-full max-w-[520px] items-center rounded-[18px] bg-card px-6 py-9 shadow-lg shadow-black/40">
        {messageTypes[type].image}

        <Text className="mt-2 text-center text-[22px] font-extrabold">{title}</Text>

        <Text className="mt-2.5 px-1.5 text-center text-[14px] leading-5">
          {message || description}
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry connection"
          className={`shadow-pribg-primary/20 mt-5 min-w-[140px] items-center justify-center rounded-lg bg-primary px-9 py-3 shadow-lg ${
            loading ? 'opacity-75' : ''
          }`}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-[16px] font-extrabold text-black">Retry</Text>
          )}
        </TouchableOpacity>

        <Text className="mt-3.5 px-2 text-center text-[12px]">
          If the problem persists, please contact support or try again later.
        </Text>
      </View>
    </SafeAreaView>
  );
}
