/**
 * Regras de Acúmulo (Stacking) Explícitas - SUE Hardening
 * Ordem Paranormal RPG v1.3
 * 
 * Define as regras oficiais de acúmulo de bônus de forma explícita
 * e centralizada, garantindo consistência em todo o sistema.
 * 
 * REGRAS OFICIAIS (Livro Base v1.3):
 * 1. Bônus de fontes DIFERENTES acumulam
 * 2. Bônus da MESMA fonte NÃO acumulam (usa o maior)
 * 3. Bônus de RITUAIS não acumulam entre si (usa o maior ritual)
 * 4. Bônus de ITENS não acumulam entre si (exceto proteção + escudo + paranormal)
 * 5. Condição ENVENENADO: dano recorrente de múltiplas fontes SEMPRE acumula
 * 6. Condição SANGRANDO: dano recorrente de múltiplas fontes SEMPRE acumula
 * 
 * @module sue/stacking-rules
 */

import type { EffectSource } from '../unified-effects-engine';

// ========================================
// TIPOS DE REGRAS DE STACKING
// ========================================

/**
 * Regra de acúmulo para um tipo de bônus
 */
export type StackingRule = 
  | 'sum_all'              // Soma todos os bônus (regra padrão)
  | 'highest_per_source'   // Usa o maior por tipo de fonte
  | 'highest_same_type'    // Usa o maior entre fontes do mesmo tipo
  | 'no_stack'             // Não acumula - ignora adicionais
  | 'accumulate_damage'    // Acumula dano recorrente (exceção oficial)
  | 'defense_special';     // Regra especial de defesa (armadura+escudo+paranormal)

/**
 * Categoria de bônus para aplicação de regras
 */
export type BonusCategory = 
  | 'attack'           // Bônus de ataque
  | 'damage'           // Bônus de dano
  | 'defense'          // Bônus de defesa
  | 'resistance'       // Bônus de resistência
  | 'skill'            // Bônus de perícia
  | 'resource'         // Bônus de recurso (PV, PE, SAN)
  | 'movement'         // Bônus de movimento
  | 'initiative'       // Bônus de iniciativa
  | 'critical'         // Bônus de crítico
  | 'damage_reduction' // Redução de dano
  | 'special';         // Efeitos especiais

// ========================================
// MATRIZ DE REGRAS DE STACKING
// ========================================

/**
 * Configuração de stacking por fonte
 */
export interface SourceStackingConfig {
  /** Regra padrão para esta fonte */
  defaultRule: StackingRule;
  
  /** Exceções por categoria de bônus */
  categoryOverrides?: Partial<Record<BonusCategory, StackingRule>>;
  
  /** Se múltiplos efeitos da mesma fonte específica acumulam */
  sameInstanceStacks: boolean;
  
  /** Limite máximo de pilhas (se aplicável) */
  maxStacks?: number;
}

/**
 * Matriz completa de regras de stacking por fonte
 */
export const STACKING_RULES: Readonly<Record<EffectSource, SourceStackingConfig>> = {
  // Treinamento: sempre soma (treinado, veterano, expert são excludentes)
  skill_training: {
    defaultRule: 'highest_same_type',
    sameInstanceStacks: false,
    categoryOverrides: {
      skill: 'highest_same_type', // Só o maior nível de treino
    },
  },
  
  // Origem: soma com outras fontes, não consigo mesma
  origin: {
    defaultRule: 'sum_all',
    sameInstanceStacks: false,
  },
  
  // Habilidade de classe: soma com outras fontes
  class_ability: {
    defaultRule: 'sum_all',
    sameInstanceStacks: false,
  },
  
  // Poderes de classe: somam entre si e com outras fontes
  class_power: {
    defaultRule: 'sum_all',
    sameInstanceStacks: true, // Múltiplos poderes diferentes acumulam
  },
  
  // Trilha: soma com outras fontes
  track: {
    defaultRule: 'sum_all',
    sameInstanceStacks: true,
  },
  
  // Poderes gerais: somam entre si e com outras fontes
  general_power: {
    defaultRule: 'sum_all',
    sameInstanceStacks: true,
  },
  
  // Poderes paranormais: somam entre si e com outras fontes
  paranormal_power: {
    defaultRule: 'sum_all',
    sameInstanceStacks: true,
    categoryOverrides: {
      defense: 'sum_all', // Exceção: defesa paranormal sempre acumula
    },
  },
  
  // Equipamento: REGRA ESPECIAL
  equipment: {
    defaultRule: 'highest_same_type',
    sameInstanceStacks: false,
    categoryOverrides: {
      defense: 'defense_special', // Armadura + Escudo + Paranormal acumulam
      attack: 'highest_same_type',
      damage: 'highest_same_type',
    },
  },
  
  // Rituais: NÃO acumulam entre si (exceção oficial)
  ritual: {
    defaultRule: 'highest_same_type',
    sameInstanceStacks: false,
    categoryOverrides: {
      attack: 'highest_same_type',
      damage: 'highest_same_type',
      defense: 'highest_same_type',
      skill: 'highest_same_type',
    },
  },
  
  // Condições: regras específicas por condição
  condition: {
    defaultRule: 'sum_all',
    sameInstanceStacks: false,
    categoryOverrides: {
      // Dano recorrente de veneno/sangramento acumula
      damage: 'accumulate_damage',
    },
    maxStacks: 10, // Limite de segurança
  },
};

// ========================================
// EXCEÇÕES ESPECÍFICAS
// ========================================

/**
 * Condições que acumulam dano recorrente (exceção oficial v1.3 p.321)
 */
export const DAMAGE_ACCUMULATING_CONDITIONS: readonly string[] = [
  'envenenado',
  'sangrando',
  'machucado',
] as const;

/**
 * Tipos de equipamento que acumulam defesa
 */
export const DEFENSE_STACKING_EQUIPMENT: readonly string[] = [
  'armor',      // Armadura
  'shield',     // Escudo
  'paranormal', // Item paranormal
] as const;

/**
 * Verifica se uma condição acumula dano recorrente
 */
export function conditionAccumulatesDamage(conditionId: string): boolean {
  return DAMAGE_ACCUMULATING_CONDITIONS.includes(conditionId.toLowerCase());
}

// ========================================
// FUNÇÕES DE APLICAÇÃO DE STACKING
// ========================================

/**
 * Entrada de bônus para cálculo de stacking
 */
export interface StackableBonus {
  /** Identificador único do bônus */
  id: string;
  
  /** Fonte do bônus */
  source: EffectSource;
  
  /** ID específico da fonte (ex: nome do poder) */
  sourceId: string;
  
  /** Nome legível da fonte */
  sourceName: string;
  
  /** Valor do bônus */
  value: number;
  
  /** Categoria do bônus */
  category: BonusCategory;
  
  /** Se está atualmente ativo */
  active: boolean;
  
  /** Subtipo para regras específicas (ex: 'armor', 'shield') */
  subtype?: string;
}

/**
 * Resultado do cálculo de stacking
 */
export interface StackingResult {
  /** Valor total após aplicar regras */
  total: number;
  
  /** Bônus que foram aplicados */
  applied: StackableBonus[];
  
  /** Bônus que foram excluídos por stacking */
  excluded: StackableBonus[];
  
  /** Breakdown detalhado para UI */
  breakdown: Array<{
    source: string;
    value: number;
    excluded: boolean;
    reason?: string;
  }>;
}

/**
 * Aplica regras de stacking a uma lista de bônus
 */
export function applyStackingRules(
  bonuses: StackableBonus[],
  category: BonusCategory
): StackingResult {
  const activeBonuses = bonuses.filter(b => b.active);
  const applied: StackableBonus[] = [];
  const excluded: StackableBonus[] = [];
  const breakdown: StackingResult['breakdown'] = [];
  
  // Agrupa por fonte
  const bySource = new Map<EffectSource, StackableBonus[]>();
  for (const bonus of activeBonuses) {
    const group = bySource.get(bonus.source) ?? [];
    group.push(bonus);
    bySource.set(bonus.source, group);
  }
  
  // Processa cada grupo de fonte
  for (const source of Object.keys(STACKING_RULES) as EffectSource[]) {
    const group = bySource.get(source);
    if (!group || group.length === 0) continue;
    
    const config = STACKING_RULES[source];
    const rule = config.categoryOverrides?.[category] ?? config.defaultRule;
    
    processSourceGroup(group, rule, category, applied, excluded, breakdown, config);
  }
  
  const total = applied.reduce((sum, b) => sum + b.value, 0);
  
  return { total, applied, excluded, breakdown };
}

/**
 * Processa um grupo de bônus da mesma fonte
 */
function processSourceGroup(
  group: StackableBonus[],
  rule: StackingRule,
  category: BonusCategory,
  applied: StackableBonus[],
  excluded: StackableBonus[],
  breakdown: StackingResult['breakdown'],
  config: SourceStackingConfig
): void {
  switch (rule) {
    case 'sum_all':
      // Todos os bônus acumulam
      for (const bonus of group) {
        applied.push(bonus);
        breakdown.push({
          source: bonus.sourceName,
          value: bonus.value,
          excluded: false,
        });
      }
      break;
      
    case 'highest_per_source': {
      // Usa apenas o maior de cada fonte específica (mesmo sourceId)
      const bySourceId = new Map<string, StackableBonus[]>();
      for (const bonus of group) {
        const existing = bySourceId.get(bonus.sourceId) ?? [];
        existing.push(bonus);
        bySourceId.set(bonus.sourceId, existing);
      }
      
      for (const [, sourceGroup] of bySourceId) {
        const highest = sourceGroup.reduce((max, b) => b.value > max.value ? b : max);
        applied.push(highest);
        breakdown.push({
          source: highest.sourceName,
          value: highest.value,
          excluded: false,
        });
        
        for (const bonus of sourceGroup) {
          if (bonus !== highest) {
            excluded.push(bonus);
            breakdown.push({
              source: bonus.sourceName,
              value: bonus.value,
              excluded: true,
              reason: `Substituído por ${highest.sourceName} (maior valor)`,
            });
          }
        }
      }
      break;
    }
    
    case 'highest_same_type': {
      // Usa apenas o maior de TODA a fonte (rituais, equipamentos)
      const highest = group.reduce((max, b) => b.value > max.value ? b : max);
      applied.push(highest);
      breakdown.push({
        source: highest.sourceName,
        value: highest.value,
        excluded: false,
      });
      
      for (const bonus of group) {
        if (bonus !== highest) {
          excluded.push(bonus);
          breakdown.push({
            source: bonus.sourceName,
            value: bonus.value,
            excluded: true,
            reason: `Substituído por ${highest.sourceName} (maior valor)`,
          });
        }
      }
      break;
    }
    
    case 'no_stack': {
      // Apenas o primeiro bônus aplica
      const [first, ...rest] = group;
      if (first) {
        applied.push(first);
        breakdown.push({
          source: first.sourceName,
          value: first.value,
          excluded: false,
        });
        
        for (const bonus of rest) {
          excluded.push(bonus);
          breakdown.push({
            source: bonus.sourceName,
            value: bonus.value,
            excluded: true,
            reason: 'Não acumula',
          });
        }
      }
      break;
    }
    
    case 'accumulate_damage': {
      // Dano recorrente acumula até maxStacks
      const maxStacks = config.maxStacks ?? 10;
      const toApply = group.slice(0, maxStacks);
      const overflow = group.slice(maxStacks);
      
      for (const bonus of toApply) {
        applied.push(bonus);
        breakdown.push({
          source: bonus.sourceName,
          value: bonus.value,
          excluded: false,
        });
      }
      
      for (const bonus of overflow) {
        excluded.push(bonus);
        breakdown.push({
          source: bonus.sourceName,
          value: bonus.value,
          excluded: true,
          reason: `Limite de ${maxStacks} pilhas atingido`,
        });
      }
      break;
    }
    
    case 'defense_special': {
      // Regra especial de defesa: armadura + escudo + paranormal acumulam
      // Mas múltiplas armaduras ou múltiplos escudos não acumulam
      processDefenseSpecial(group, applied, excluded, breakdown);
      break;
    }
  }
}

/**
 * Processa a regra especial de defesa
 */
function processDefenseSpecial(
  group: StackableBonus[],
  applied: StackableBonus[],
  excluded: StackableBonus[],
  breakdown: StackingResult['breakdown']
): void {
  // Agrupa por subtipo
  const bySubtype = new Map<string, StackableBonus[]>();
  for (const bonus of group) {
    const subtype = bonus.subtype ?? 'other';
    const existing = bySubtype.get(subtype) ?? [];
    existing.push(bonus);
    bySubtype.set(subtype, existing);
  }
  
  // Para cada subtipo, usa o maior valor
  // Mas subtipos diferentes acumulam entre si
  for (const [subtype, subtypeGroup] of bySubtype) {
    if (DEFENSE_STACKING_EQUIPMENT.includes(subtype)) {
      // Tipos que acumulam entre categorias, mas não consigo mesmos
      const highest = subtypeGroup.reduce((max, b) => b.value > max.value ? b : max);
      applied.push(highest);
      breakdown.push({
        source: highest.sourceName,
        value: highest.value,
        excluded: false,
      });
      
      for (const bonus of subtypeGroup) {
        if (bonus !== highest) {
          excluded.push(bonus);
          breakdown.push({
            source: bonus.sourceName,
            value: bonus.value,
            excluded: true,
            reason: `Substituído por ${highest.sourceName} (mesmo tipo)`,
          });
        }
      }
    } else {
      // Outros tipos: usa apenas o maior
      const highest = subtypeGroup.reduce((max, b) => b.value > max.value ? b : max);
      applied.push(highest);
      breakdown.push({
        source: highest.sourceName,
        value: highest.value,
        excluded: false,
      });
      
      for (const bonus of subtypeGroup) {
        if (bonus !== highest) {
          excluded.push(bonus);
          breakdown.push({
            source: bonus.sourceName,
            value: bonus.value,
            excluded: true,
            reason: 'Itens não acumulam',
          });
        }
      }
    }
  }
}

// ========================================
// UTILITÁRIOS DE VALIDAÇÃO
// ========================================

/**
 * Valida se um bônus pode ser aplicado dado o contexto atual
 */
export function canBonusBeApplied(
  bonus: StackableBonus,
  existingBonuses: StackableBonus[]
): { canApply: boolean; reason?: string } {
  const config = STACKING_RULES[bonus.source];
  const rule = config.categoryOverrides?.[bonus.category] ?? config.defaultRule;
  
  // Verifica se já existe um bônus da mesma fonte específica
  const sameSourceId = existingBonuses.find(
    b => b.source === bonus.source && b.sourceId === bonus.sourceId
  );
  
  if (sameSourceId && !config.sameInstanceStacks) {
    return {
      canApply: false,
      reason: `Bônus de ${bonus.sourceName} já aplicado`,
    };
  }
  
  // Verifica limite de pilhas
  if (config.maxStacks) {
    const sameSourceCount = existingBonuses.filter(
      b => b.source === bonus.source
    ).length;
    
    if (sameSourceCount >= config.maxStacks) {
      return {
        canApply: false,
        reason: `Limite de ${config.maxStacks} pilhas atingido`,
      };
    }
  }
  
  return { canApply: true };
}

/**
 * Obtém a regra de stacking para uma combinação fonte/categoria
 */
export function getStackingRule(
  source: EffectSource,
  category: BonusCategory
): StackingRule {
  const config = STACKING_RULES[source];
  return config.categoryOverrides?.[category] ?? config.defaultRule;
}

/**
 * Formata uma explicação legível da regra de stacking
 */
export function formatStackingRuleDescription(rule: StackingRule): string {
  switch (rule) {
    case 'sum_all':
      return 'Todos os bônus acumulam';
    case 'highest_per_source':
      return 'Usa o maior bônus de cada fonte';
    case 'highest_same_type':
      return 'Usa apenas o maior bônus deste tipo';
    case 'no_stack':
      return 'Não acumula';
    case 'accumulate_damage':
      return 'Dano recorrente acumula de múltiplas fontes';
    case 'defense_special':
      return 'Armadura + Escudo + Paranormal acumulam';
    default:
      return 'Regra desconhecida';
  }
}
