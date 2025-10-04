import { MoonStarIcon, StarIcon, SunIcon } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { useColorScheme } from 'nativewind';
import { Icon } from '@/components/ui/icon';

const THEME_ICONS = {
  light: SunIcon,
  dark: MoonStarIcon,
};

export default function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <Button
      onPressIn={toggleColorScheme}
      size="icon"
      variant="ghost"
      className="rounded-full web:mx-4">
      <Icon as={THEME_ICONS[colorScheme ?? 'light']} className="size-5" />
    </Button>
  );
}
