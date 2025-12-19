import { ColorTheme } from '@/contexts/ColorThemeContext';

export interface ThemeColors {
  /** Primary HEX color for components */
  primary: string;
  /** Secondary/lighter HEX color */
  secondary: string;
  /** RGB string for FlickeringGrid (e.g., "139, 0, 0") */
  rgb: string;
  /** Gradient colors */
  gradient: {
    via: string;
    dark: string;
  };
  /** Ordem Paranormal element name */
  element: 'sangue' | 'morte' | 'conhecimento' | 'energia' | 'medo';
}

/**
 * Theme color configurations based on Ordem Paranormal elements
 * - Purple (Morte): Death element - abyssal purple
 * - Red (Sangue): Blood element - ritual red
 * - Green (Conhecimento): Knowledge element - emerald
 * - Blue (Medo): Fear element - spectral cyan
 * - Amber (Energia): Energy element - arcane amber
 */
export const THEME_COLORS: Record<ColorTheme, ThemeColors> = {
  purple: {
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    rgb: '139, 92, 246',
    gradient: {
      via: '#1A0520',
      dark: '#0D0512',
    },
    element: 'morte',
  },
  red: {
    primary: '#8B0000',
    secondary: '#B22222',
    rgb: '139, 0, 0',
    gradient: {
      via: '#1A0505',
      dark: '#0D0A0B',
    },
    element: 'sangue',
  },
  green: {
    primary: '#22C55E',
    secondary: '#4ADE80',
    rgb: '34, 197, 94',
    gradient: {
      via: '#051A0A',
      dark: '#0A0D0B',
    },
    element: 'conhecimento',
  },
  blue: {
    primary: '#0EA5E9',
    secondary: '#38BDF8',
    rgb: '14, 165, 233',
    gradient: {
      via: '#051520',
      dark: '#0A0D12',
    },
    element: 'medo',
  },
  amber: {
    primary: '#F59E0B',
    secondary: '#FBBF24',
    rgb: '245, 158, 11',
    gradient: {
      via: '#1A1205',
      dark: '#0D0B08',
    },
    element: 'energia',
  },
};

/**
 * Get CSS variable value for current theme
 */
export function getThemeCSSVar(theme: ColorTheme): string {
  const vars: Record<ColorTheme, string> = {
    purple: '263 70% 50%',
    red: '0 100% 27%',
    green: '142 71% 45%',
    blue: '199 89% 48%',
    amber: '38 92% 50%',
  };
  return vars[theme];
}
