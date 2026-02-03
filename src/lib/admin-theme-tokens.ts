/**
 * Tokens semânticos para cores do sistema administrativo
 * 
 * Centraliza as cores utilizadas nos painéis admin para facilitar
 * manutenção e garantir consistência visual.
 * 
 * NOTA: Usamos tokens semânticos em vez de cores hardcoded para:
 * 1. Manter consistência visual
 * 2. Facilitar mudanças globais de tema
 * 3. Melhorar acessibilidade
 */

// =====================================================
// Cores de Status para Validação
// =====================================================

export const STATUS_COLORS = {
  /** Sucesso/Aprovado - usar para indicar status positivo */
  success: {
    text: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-500',
  },
  /** Erro/Reprovado - usar para indicar falhas */
  error: {
    text: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
    icon: 'text-destructive',
  },
  /** Aviso/Warning - usar para alertas */
  warning: {
    text: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: 'text-amber-500',
  },
  /** Info - usar para informações neutras */
  info: {
    text: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    icon: 'text-primary',
  },
} as const;

// =====================================================
// Cores de Roles/Permissões
// =====================================================

export const ROLE_COLORS = {
  admin: {
    text: 'text-amber-500',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
  },
  moderator: {
    text: 'text-sky-500',
    bg: 'bg-sky-500/20',
    border: 'border-sky-500/30',
  },
  user: {
    text: 'text-muted-foreground',
    bg: '',
    border: '',
  },
} as const;

// =====================================================
// Cores de Categorias de Validação
// =====================================================

export const CATEGORY_COLORS = {
  // Rituais e magia
  rituals: {
    base: 'text-primary',
    detailed: 'text-violet-500',
    cost: 'text-sky-500',
    resistance: 'text-amber-500',
    enhancement: 'text-emerald-500',
    enhancementCost: 'text-cyan-500',
    circles: 'text-rose-500',
    elements: 'text-amber-500',
  },
  // Outros sistemas
  conditions: 'text-amber-500',
  modifiers: 'text-primary',
  damageTypes: 'text-amber-500',
  paranormalPowers: 'text-primary',
  origins: 'text-muted-foreground',
  classes: 'text-primary',
  tracks: 'text-primary',
  classPowers: 'text-primary',
} as const;

// =====================================================
// Cores de Fontes SUE (Sistema Unificado de Efeitos)
// =====================================================

export const SUE_SOURCE_COLORS = {
  origin: {
    text: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
  track: {
    text: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  condition: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  ritual: {
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
  paranormal_power: {
    text: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
  class_power: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
} as const;

// =====================================================
// Cores de Categorias de Efeitos (Computed Effects)
// =====================================================

export const EFFECT_CATEGORY_COLORS = {
  combat: 'text-rose-400',
  defense: 'text-sky-400',
  resources: 'text-pink-400',
  skills: 'text-cyan-400',
  movement: 'text-emerald-400',
  special: 'text-violet-400',
  advanced: 'text-amber-400',
  occultist: 'text-violet-400',
  flags: 'text-amber-400',
  sneakAttack: 'text-violet-400',
  healing: 'text-pink-400',
  resistances: 'text-emerald-400',
} as const;

// =====================================================
// Utilitários
// =====================================================

/**
 * Retorna classes CSS para um status
 */
export function getStatusClasses(status: 'success' | 'error' | 'warning' | 'info') {
  return STATUS_COLORS[status];
}

/**
 * Retorna classes CSS para uma role
 */
export function getRoleClasses(role: 'admin' | 'moderator' | 'user') {
  return ROLE_COLORS[role];
}

/**
 * Retorna a classe de cor para uma fonte SUE
 */
export function getSUESourceColor(source: keyof typeof SUE_SOURCE_COLORS) {
  return SUE_SOURCE_COLORS[source];
}

/**
 * Retorna a classe de cor para uma categoria de efeito
 */
export function getEffectCategoryColor(category: keyof typeof EFFECT_CATEGORY_COLORS) {
  return EFFECT_CATEGORY_COLORS[category];
}
