import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import Sheet from '@/components/ui/sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExampleYTDLUsage } from '@/components/examples/YTDLUsageExample';

export default function Profile() {
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  return (
    <SafeAreaView>
      <Text className="mb-4 text-xl font-semibold">Bookmark</Text>
      <ExampleYTDLUsage videoId="dQw4w9WgXcQ" />
    </SafeAreaView>
  );
}
