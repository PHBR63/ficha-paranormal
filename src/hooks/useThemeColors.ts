import { useColorTheme } from '@/contexts/ColorThemeContext';
import { THEME_COLORS, ThemeColors } from '@/lib/theme-colors';

/**
 * Hook to get the current theme's color configuration
 * Use this for dynamic styling of atmospheric effects
 */
export function useThemeColors(): ThemeColors {
  const { colorTheme } = useColorTheme();
  return THEME_COLORS[colorTheme];
}
