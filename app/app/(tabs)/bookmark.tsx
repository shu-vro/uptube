import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import Sheet from '@/components/ui/sheet';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Profile() {
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  return (
    <SafeAreaView>
      <Text className="mb-4 text-xl font-semibold">Bookmark</Text>
      <Button onPress={() => setOpen(true)}>
        <Text>Open Bottom Sheet</Text>
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <Text>Content for the first sheet</Text>
        <Button onPress={() => setOpen2(true)}>
          <Text>Open Bottom Sheet</Text>
        </Button>
      </Sheet>
      <Sheet open={open2} onClose={() => setOpen2(false)}>
        <Text>Awesome 🎉</Text>
        <Text>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Illum error ad amet eveniet, in
          laudantium consequatur corrupti eius repellat sint dolor aspernatur aut quod. Adipisci
          deserunt dolore animi illum natus!
        </Text>
      </Sheet>
    </SafeAreaView>
  );
}
