import { ConhecimentoSymbol, EnergiaSymbol, MedoSymbol, MorteSymbol, SangueSymbol } from '@/components/icons/element-symbols';
/**
 * Element Config - Configuração centralizada para elementos paranormais
 * Usado em rituais, poderes paranormais e outros sistemas
 * 
 * IDs de elementos são sincronizados com: src/lib/constants/game-ids.ts
 * NOTA: Os elementos em game-ids.ts usam inicial maiúscula (Sangue, Morte, etc)
 * enquanto aqui usamos minúsculas para compatibilidade com código existente.
 */

import type { LucideIcon } from '@/components/icons/ordem-icons';
import { ELEMENT_IDS, isValidElementIdIgnoreCase, normalizeElementId } from './constants/game-ids';

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
// Paleta otimizada para UI com contraste adequado para texto, ícones e efeitos
export const ELEMENT_CONFIG: Record<ParanormalElementType, ElementConfig> = {
  sangue: {
    // 🩸 Carne, instinto, dor, sacrifício - visceral, orgânica, brutal
    icon: SangueSymbol,
    emoji: '🩸',
    label: 'Sangue',
    color: 'from-[hsl(var(--element-sangue))]/20 to-[hsl(var(--element-sangue-dark))]/30',
    border: 'border-[hsl(var(--element-sangue-light))]/50',
    text: 'text-[hsl(var(--element-sangue-light))]',
    bg: 'bg-[hsl(var(--element-sangue))]/15',
    badgeBg: 'bg-[hsl(var(--element-sangue))]/25 text-[hsl(var(--element-sangue-light))]',
    glow: 'shadow-[hsl(var(--element-sangue-glow))]/40',
    hex: '#8B1E1E',
    hexLight: '#E57373',
  },
  morte: {
    // ☠️ Cinzas, decadência, fim inevitável - fria, silenciosa, opressiva
    icon: MorteSymbol,
    emoji: '💀',
    label: 'Morte',
    color: 'from-[hsl(var(--element-morte))]/20 to-[hsl(var(--element-morte-dark))]/30',
    border: 'border-[hsl(var(--element-morte-light))]/50',
    text: 'text-[hsl(var(--element-morte-light))]',
    bg: 'bg-[hsl(var(--element-morte))]/15',
    badgeBg: 'bg-[hsl(var(--element-morte))]/25 text-[hsl(var(--element-morte-light))]',
    glow: 'shadow-[hsl(var(--element-morte-glow))]/40',
    hex: '#5A5E5A',
    hexLight: '#B0B3B0',
  },
  conhecimento: {
    // 🧠 Verdade, lógica distorcida, ouro antigo - místico-intelectual, ritualístico
    icon: ConhecimentoSymbol,
    emoji: '📖',
    label: 'Conhecimento',
    color: 'from-[hsl(var(--element-conhecimento))]/20 to-[hsl(var(--element-conhecimento-dark))]/30',
    border: 'border-[hsl(var(--element-conhecimento))]/50',
    text: 'text-[hsl(var(--element-conhecimento-light))]',
    bg: 'bg-[hsl(var(--element-conhecimento))]/15',
    badgeBg: 'bg-[hsl(var(--element-conhecimento))]/25 text-[hsl(var(--element-conhecimento-light))]',
    glow: 'shadow-[hsl(var(--element-conhecimento-glow))]/40',
    hex: '#D4AF37',
    hexLight: '#F2E6A7',
  },
  energia: {
    // ⚡ Caos, tecnologia, distorção, eletricidade - instável, agressiva, vibrante
    icon: EnergiaSymbol,
    emoji: '⚡',
    label: 'Energia',
    color: 'from-[hsl(var(--element-energia))]/20 to-[hsl(var(--element-energia))]/10',
    border: 'border-[hsl(var(--element-energia-light))]/50',
    text: 'text-[hsl(var(--element-energia-light))]',
    bg: 'bg-[hsl(var(--element-energia))]/15',
    badgeBg: 'bg-[hsl(var(--element-energia))]/25 text-[hsl(var(--element-energia-light))]',
    glow: 'shadow-[hsl(var(--element-energia-glow))]/40',
    hex: '#7B3FE4',
    hexLight: '#BFA8FF',
  },
  medo: {
    // 👁️ O invisível, o indefinido, o que observa - antinatural, ambígua, perturbadora
    icon: MedoSymbol,
    emoji: '👻',
    label: 'Medo',
    color: 'from-[hsl(var(--element-medo))]/20 to-[hsl(var(--element-medo-dark))]/30',
    border: 'border-[hsl(var(--element-medo-light))]/50',
    text: 'text-[hsl(var(--element-medo-light))]',
    bg: 'bg-[hsl(var(--element-medo))]/15',
    badgeBg: 'bg-[hsl(var(--element-medo))]/25 text-[hsl(var(--element-medo-light))]',
    glow: 'shadow-[hsl(var(--element-medo-glow))]/40',
    hex: '#D4D4D8',
    hexLight: '#F4F4F5',
  },
};

// Helper para obter configuração de elemento de forma segura
// Usa isValidElementIdIgnoreCase internamente para compatibilidade
export function getElementConfig(element: string | undefined): ElementConfig | null {
  if (!element) return null;
  const key = element.toLowerCase() as ParanormalElementType;
  return ELEMENT_CONFIG[key] || null;
}

// Helper para obter todas as chaves de elementos
export function getElementKeys(): ParanormalElementType[] {
  return Object.keys(ELEMENT_CONFIG) as ParanormalElementType[];
}

/**
 * Valida se um elemento é válido (case-insensitive)
 * Wrapper sobre isValidElementIdIgnoreCase de game-ids.ts
 */
export function isValidElement(element: string): boolean {
  return isValidElementIdIgnoreCase(element);
}

/**
 * Obtém configuração de elemento com normalização automática
 * Aceita elementos em qualquer case
 */
export function getElementConfigSafe(element: string | undefined): ElementConfig | null {
  if (!element) return null;
  
  // Tenta normalizar usando game-ids.ts
  const normalized = normalizeElementId(element);
  if (normalized) {
    const key = normalized.toLowerCase() as ParanormalElementType;
    return ELEMENT_CONFIG[key] || null;
  }
  
  // Fallback para busca direta
  const key = element.toLowerCase() as ParanormalElementType;
  return ELEMENT_CONFIG[key] || null;
}
