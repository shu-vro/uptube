import { Text, TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { THEME } from '@/lib/theme';
import { useColorScheme } from 'nativewind';

function Card({ className, ...props }: ViewProps & React.RefAttributes<View>) {
  const { colorScheme } = useColorScheme();
  const colors = THEME[colorScheme ?? 'light'];
  return (
    <TextClassContext.Provider value="text-card-foreground relative">
      <View
        className={cn(
          'flex flex-col gap-4 rounded-xl border-2 border-border bg-card pb-4 shadow-sm shadow-black/5 dark:bg-muted/30',
          className
        )}
        {...props}>
        <BlurView
          // style={}
          blurType={colorScheme === 'dark' ? 'dark' : 'light'}
          blurAmount={20}
          reducedTransparencyFallbackColor={colors.background}
        />
        {props.children}
      </View>
    </TextClassContext.Provider>
  );
}

function CardHeader({ className, ...props }: ViewProps & React.RefAttributes<View>) {
  return <View className={cn('flex flex-col gap-1.5 px-6', className)} {...props} />;
}

function CardTitle({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<Text>) {
  return (
    <Text
      role="heading"
      aria-level={3}
      className={cn('font-semibold leading-none', className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<Text>) {
  return <Text className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

function CardContent({ className, ...props }: ViewProps & React.RefAttributes<View>) {
  return <View className={cn('px-6', className)} {...props} />;
}

function CardFooter({ className, ...props }: ViewProps & React.RefAttributes<View>) {
  return <View className={cn('flex flex-row items-center px-6', className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
