import { ColorTheme } from '@/contexts/ColorThemeContext';

export interface ThemeColors {
  /** Cor HEX primária do tema (corresponde à --primary do CSS) */
  primary: string;
  /** Cor HEX secundária/mais clara */
  secondary: string;
  /** String RGB para FlickeringGrid (e.g., "124, 58, 237") */
  rgb: string;
  /** Cores de gradiente para fundos atmosféricos */
  gradient: {
    via: string;
    dark: string;
  };
  /** Nome do elemento paranormal correspondente ao tema */
  element: 'sangue' | 'morte' | 'conhecimento' | 'energia' | 'medo';
}

/**
 * Configurações de cor por tema, alinhadas com os CSS vars e o ThemeSelector.
 * 
 * - Purple  → Pulso Entrópico   → Energia      (roxo elétrico)
 * - Red     → Carnificina Viva  → Sangue       (vermelho visceral)
 * - Green   → Sigilo Dourado    → Conhecimento (dourado arcano)
 * - Blue    → Abismo Observador → Medo         (verde espectral)
 * - Amber   → Cinza Terminal    → Morte        (cinza fúnebre)
 */
export const THEME_COLORS: Record<ColorTheme, ThemeColors> = {
  purple: {
    primary: '#7C3AED',
    secondary: '#A78BFA',
    rgb: '124, 58, 237',
    gradient: {
      via: '#1A0520',
      dark: '#0D0512',
    },
    element: 'energia',
  },
  red: {
    primary: '#BD2626',
    secondary: '#E06060',
    rgb: '189, 38, 38',
    gradient: {
      via: '#1A0505',
      dark: '#0D0A0B',
    },
    element: 'sangue',
  },
  green: {
    primary: '#D4A51A',
    secondary: '#F0E09A',
    rgb: '212, 165, 26',
    gradient: {
      via: '#1A1505',
      dark: '#0D0B08',
    },
    element: 'conhecimento',
  },
  blue: {
    primary: '#70FFBA',
    secondary: '#3DFFC4',
    rgb: '112, 255, 186',
    gradient: {
      via: '#051A15',
      dark: '#0A0D0B',
    },
    element: 'medo',
  },
  amber: {
    primary: '#8A8E8A',
    secondary: '#AEB1AE',
    rgb: '138, 142, 138',
    gradient: {
      via: '#121212',
      dark: '#0A0A0A',
    },
    element: 'morte',
  },
};

/**
 * Retorna o valor HSL da --primary para cada tema (sem hsl() wrapper)
 * Deve corresponder exatamente ao CSS em index.css
 */
export function getThemeCSSVar(theme: ColorTheme): string {
  const vars: Record<ColorTheme, string> = {
    purple: '262 75% 57%',
    red: '0 65% 45%',
    green: '43 66% 52%',
    blue: '157 100% 72%',
    amber: '120 2% 55%',
  };
  return vars[theme];
}
