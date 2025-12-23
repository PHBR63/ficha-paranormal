/**
 * Element Config - Configuração centralizada para elementos paranormais
 * Usado em rituais, poderes paranormais e outros sistemas
 * 
 * IDs de elementos são sincronizados com: src/lib/constants/game-ids.ts
 * NOTA: Os elementos em game-ids.ts usam inicial maiúscula (Sangue, Morte, etc)
 * enquanto aqui usamos minúsculas para compatibilidade com código existente.
 */

import { 
  Droplets, 
  Skull, 
  BookOpen, 
  Zap, 
  Ghost,
  type LucideIcon 
} from 'lucide-react';
import { ELEMENT_IDS } from './constants/game-ids';

// Tipos de elementos disponíveis (em minúsculo para compatibilidade)
// Sincronizado com ELEMENT_IDS de game-ids.ts
export type ParanormalElementType = 'sangue' | 'morte' | 'conhecimento' | 'energia' | 'medo';

// Validação: garante que os elementos locais correspondem aos de game-ids.ts
const _elementIdValidation: Record<ParanormalElementType, string> = {
  sangue: ELEMENT_IDS.SANGUE,
  morte: ELEMENT_IDS.MORTE,
  conhecimento: ELEMENT_IDS.CONHECIMENTO,
  energia: ELEMENT_IDS.ENERGIA,
  medo: ELEMENT_IDS.MEDO,
};

// Interface para configuração visual de elementos
export interface ElementConfig {
  icon: LucideIcon;
  emoji: string;
  label: string;
  color: string;         // Gradiente de fundo
  border: string;        // Cor da borda
  text: string;          // Cor do texto
  bg: string;            // Background sólido
  badgeBg: string;       // Background para badges
  glow: string;          // Cor do glow/shadow
  hex: string;           // Cor hexadecimal para efeitos
  hexLight: string;      // Cor hexadecimal clara
}

// Configuração visual centralizada para cada elemento
export const ELEMENT_CONFIG: Record<ParanormalElementType, ElementConfig> = {
  sangue: {
    icon: Droplets,
    emoji: '🩸',
    label: 'Sangue',
    color: 'from-red-500/20 to-red-900/20',
    border: 'border-red-500/50',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    badgeBg: 'bg-red-500/20 text-red-300',
    glow: 'shadow-red-500/30',
    hex: '#ef4444',
    hexLight: '#fca5a5',
  },
  morte: {
    icon: Skull,
    emoji: '💀',
    label: 'Morte',
    color: 'from-purple-900/20 to-purple-950/20',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    badgeBg: 'bg-purple-500/20 text-purple-300',
    glow: 'shadow-purple-500/30',
    hex: '#a855f7',
    hexLight: '#d8b4fe',
  },
  conhecimento: {
    icon: BookOpen,
    emoji: '📖',
    label: 'Conhecimento',
    color: 'from-blue-500/20 to-blue-900/20',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    badgeBg: 'bg-blue-500/20 text-blue-300',
    glow: 'shadow-blue-500/30',
    hex: '#3b82f6',
    hexLight: '#93c5fd',
  },
  energia: {
    icon: Zap,
    emoji: '⚡',
    label: 'Energia',
    color: 'from-yellow-500/20 to-amber-900/20',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    badgeBg: 'bg-yellow-500/20 text-yellow-300',
    glow: 'shadow-yellow-500/30',
    hex: '#eab308',
    hexLight: '#fde047',
  },
  medo: {
    icon: Ghost,
    emoji: '👻',
    label: 'Medo',
    color: 'from-emerald-500/20 to-emerald-900/20',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    badgeBg: 'bg-emerald-500/20 text-emerald-300',
    glow: 'shadow-emerald-500/30',
    hex: '#10b981',
    hexLight: '#6ee7b7',
  },
};

// Helper para obter configuração de elemento de forma segura
export function getElementConfig(element: string | undefined): ElementConfig | null {
  if (!element) return null;
  const key = element.toLowerCase() as ParanormalElementType;
  return ELEMENT_CONFIG[key] || null;
}

// Helper para obter todas as chaves de elementos
export function getElementKeys(): ParanormalElementType[] {
  return Object.keys(ELEMENT_CONFIG) as ParanormalElementType[];
}
