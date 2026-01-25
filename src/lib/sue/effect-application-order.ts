/**
 * Ordem Fixa de Aplicação de Efeitos - SUE Hardening
 * Ordem Paranormal RPG v1.3
 * 
 * Define a ordem determinística em que efeitos de diferentes fontes
 * são aplicados para garantir resultados consistentes e reproduzíveis.
 * 
 * REGRA FUNDAMENTAL: A ordem de aplicação afeta apenas o processamento
 * interno - o resultado final segue as regras de stacking oficiais.
 * 
 * @module sue/effect-application-order
 */

import type { EffectSource } from '../unified-effects-engine';

// ========================================
// ORDEM DE APLICAÇÃO DE EFEITOS
// ========================================

/**
 * Ordem fixa de prioridade para aplicação de efeitos.
 * Efeitos são processados nesta ordem para garantir determinismo.
 * 
 * JUSTIFICATIVA DA ORDEM:
 * 1. Base/Atributos: Valores fundamentais do personagem
 * 2. Treinamento: Bônus de perícias treinadas (sempre aplicam)
 * 3. Origem: Bônus passivos da origem do personagem
 * 4. Classe: Habilidades base da classe
 * 5. Trilha: Habilidades da trilha de especialização
 * 6. Poderes Gerais: Poderes escolhidos pelo jogador
 * 7. Poderes Paranormais: Poderes elementais/sobrenaturais
 * 8. Equipamento: Modificadores de itens equipados
 * 9. Rituais: Efeitos de rituais sustentados
 * 10. Condições: Modificadores de condições ativas (aplicam por último)
 */
export const EFFECT_APPLICATION_ORDER: readonly EffectSource[] = [
  'skill_training',    // 1. Treinamento em perícias (base)
  'origin',            // 2. Origem do personagem
  'class_ability',     // 3. Habilidade base da classe
  'class_power',       // 4. Poder de classe selecionado
  'track',             // 5. Habilidade da trilha
  'general_power',     // 6. Poder geral
  'paranormal_power',  // 7. Poder paranormal
  'equipment',         // 8. Equipamento
  'ritual',            // 9. Ritual sustentado
  'condition',         // 10. Condição ativa (última camada)
] as const;

/**
 * Mapa de prioridade numérica para lookup rápido
 */
export const EFFECT_PRIORITY_MAP: Readonly<Record<EffectSource, number>> = {
  skill_training: 1,
  origin: 2,
  class_ability: 3,
  class_power: 4,
  track: 5,
  general_power: 6,
  paranormal_power: 7,
  equipment: 8,
  ritual: 9,
  condition: 10,
};

/**
 * Obtém a prioridade numérica de uma fonte de efeito
 * Valores menores = processado primeiro
 */
export function getEffectPriority(source: EffectSource): number {
  return EFFECT_PRIORITY_MAP[source] ?? 99;
}

/**
 * Compara duas fontes para ordenação
 * Retorna negativo se a < b, positivo se a > b, 0 se igual
 */
export function compareEffectSources(a: EffectSource, b: EffectSource): number {
  return getEffectPriority(a) - getEffectPriority(b);
}

// ========================================
// CATEGORIAS DE EFEITOS
// ========================================

/**
 * Categoria de efeito para regras de stacking
 */
export type EffectCategory = 
  | 'permanent'    // Efeitos permanentes (origem, classe, treino)
  | 'active'       // Efeitos de poderes ativos/togglados
  | 'equipment'    // Efeitos de equipamento
  | 'temporary'    // Efeitos temporários (rituais, buffs)
  | 'debuff';      // Condições negativas

/**
 * Mapeamento de fonte para categoria
 */
export const SOURCE_CATEGORY_MAP: Readonly<Record<EffectSource, EffectCategory>> = {
  skill_training: 'permanent',
  origin: 'permanent',
  class_ability: 'permanent',
  class_power: 'active',
  track: 'active',
  general_power: 'active',
  paranormal_power: 'active',
  equipment: 'equipment',
  ritual: 'temporary',
  condition: 'debuff',
};

/**
 * Obtém a categoria de uma fonte de efeito
 */
export function getEffectCategory(source: EffectSource): EffectCategory {
  return SOURCE_CATEGORY_MAP[source];
}

// ========================================
// FLAGS DE COMPORTAMENTO
// ========================================

/**
 * Flags que indicam comportamentos especiais de fontes
 */
export interface SourceBehaviorFlags {
  /** Se bônus da fonte acumulam entre si (múltiplos itens da mesma fonte) */
  stacksWithSelf: boolean;
  
  /** Se a fonte pode ser desativada pelo jogador */
  canBeToggled: boolean;
  
  /** Se a fonte depende de contexto (arma equipada, turno, etc.) */
  isContextual: boolean;
  
  /** Se a fonte pode aplicar penalidades (valores negativos) */
  canApplyPenalties: boolean;
  
  /** Se a fonte sobrescreve outras fontes do mesmo tipo */
  overridesSameType: boolean;
}

/**
 * Flags de comportamento por fonte
 */
export const SOURCE_BEHAVIOR_FLAGS: Readonly<Record<EffectSource, SourceBehaviorFlags>> = {
  skill_training: {
    stacksWithSelf: false,     // Apenas um nível de treino por perícia
    canBeToggled: false,       // Sempre ativo
    isContextual: false,       // Não depende de contexto
    canApplyPenalties: false,  // Só dá bônus
    overridesSameType: true,   // Maior nível sobrescreve
  },
  origin: {
    stacksWithSelf: false,     // Uma origem por personagem
    canBeToggled: true,        // Algumas origens têm poderes ativáveis
    isContextual: true,        // Algumas dependem de contexto (arma, situação)
    canApplyPenalties: false,  // Só dá bônus
    overridesSameType: false,  // N/A (só uma origem)
  },
  class_ability: {
    stacksWithSelf: false,     // Uma classe por personagem
    canBeToggled: false,       // Habilidades base sempre ativas
    isContextual: false,       // Não contextual
    canApplyPenalties: false,  // Só bônus
    overridesSameType: false,  // N/A
  },
  class_power: {
    stacksWithSelf: true,      // Múltiplos poderes acumulam
    canBeToggled: true,        // Poderes podem ser ativados
    isContextual: true,        // Muitos dependem de contexto
    canApplyPenalties: true,   // Alguns têm trade-offs
    overridesSameType: false,  // Acumulam
  },
  track: {
    stacksWithSelf: true,      // Habilidades de trilha acumulam
    canBeToggled: true,        // Algumas são ativáveis
    isContextual: true,        // Dependem de NEX e contexto
    canApplyPenalties: false,  // Só bônus
    overridesSameType: false,  // Acumulam
  },
  general_power: {
    stacksWithSelf: true,      // Múltiplos poderes gerais acumulam
    canBeToggled: true,        // Alguns são ativáveis
    isContextual: true,        // Alguns condicionais
    canApplyPenalties: true,   // Trade-offs possíveis
    overridesSameType: false,  // Acumulam
  },
  paranormal_power: {
    stacksWithSelf: true,      // Poderes paranormais acumulam
    canBeToggled: true,        // Maioria é ativável
    isContextual: true,        // Dependem de PE, elemento, etc.
    canApplyPenalties: true,   // Custos e efeitos colaterais
    overridesSameType: false,  // Acumulam
  },
  equipment: {
    stacksWithSelf: false,     // Itens do mesmo tipo NÃO acumulam (exceto defesa)
    canBeToggled: true,        // Equipar/desequipar
    isContextual: true,        // Depende do item estar equipado
    canApplyPenalties: true,   // Penalidades de armadura
    overridesSameType: true,   // Maior bônus vence
  },
  ritual: {
    stacksWithSelf: false,     // Rituais NÃO acumulam entre si
    canBeToggled: true,        // Sustentar/encerrar
    isContextual: true,        // Dependem de sustentação
    canApplyPenalties: true,   // Efeitos negativos possíveis
    overridesSameType: true,   // Maior bônus vence
  },
  condition: {
    stacksWithSelf: true,      // Algumas condições acumulam (envenenado)
    canBeToggled: false,       // Aplicadas externamente
    isContextual: false,       // Sempre ativas enquanto presentes
    canApplyPenalties: true,   // Maioria é negativa
    overridesSameType: false,  // Depende da condição específica
  },
};

/**
 * Obtém as flags de comportamento de uma fonte
 */
export function getSourceBehavior(source: EffectSource): SourceBehaviorFlags {
  return SOURCE_BEHAVIOR_FLAGS[source];
}

// ========================================
// UTILITÁRIOS DE ORDENAÇÃO
// ========================================

/**
 * Interface mínima para efeitos ordenáveis
 */
export interface OrderableEffect {
  source: EffectSource;
  sourceId: string;
  priority?: number;
}

/**
 * Ordena uma lista de efeitos pela ordem fixa de aplicação
 * Mantém ordem estável para efeitos da mesma fonte (por sourceId)
 */
export function sortEffectsByPriority<T extends OrderableEffect>(effects: T[]): T[] {
  return [...effects].sort((a, b) => {
    // Primeiro, ordena por fonte
    const sourceDiff = compareEffectSources(a.source, b.source);
    if (sourceDiff !== 0) return sourceDiff;
    
    // Mesmo fonte: usa prioridade customizada se definida
    if (a.priority !== undefined && b.priority !== undefined) {
      const priorityDiff = a.priority - b.priority;
      if (priorityDiff !== 0) return priorityDiff;
    }
    
    // Fallback: ordem alfabética por sourceId para determinismo
    return a.sourceId.localeCompare(b.sourceId);
  });
}

/**
 * Agrupa efeitos por fonte, mantendo a ordem de aplicação
 */
export function groupEffectsBySource<T extends OrderableEffect>(
  effects: T[]
): Map<EffectSource, T[]> {
  const sorted = sortEffectsByPriority(effects);
  const grouped = new Map<EffectSource, T[]>();
  
  // Inicializa grupos na ordem correta
  for (const source of EFFECT_APPLICATION_ORDER) {
    grouped.set(source, []);
  }
  
  // Distribui efeitos
  for (const effect of sorted) {
    const group = grouped.get(effect.source);
    if (group) {
      group.push(effect);
    }
  }
  
  // Remove grupos vazios
  for (const [source, group] of grouped) {
    if (group.length === 0) {
      grouped.delete(source);
    }
  }
  
  return grouped;
}

/**
 * Retorna efeitos de uma categoria específica, ordenados
 */
export function getEffectsByCategory<T extends OrderableEffect>(
  effects: T[],
  category: EffectCategory
): T[] {
  return sortEffectsByPriority(
    effects.filter(e => getEffectCategory(e.source) === category)
  );
}
