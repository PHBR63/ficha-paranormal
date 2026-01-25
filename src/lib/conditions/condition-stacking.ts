/**
 * Regras de Acúmulo (Stacking) de Condições
 * Ordem Paranormal RPG v1.3
 * 
 * Implementa as regras oficiais de acúmulo de efeitos de condições,
 * incluindo a exceção do Envenenado (PDF p.321) onde dano recorrente
 * de múltiplas fontes sempre acumula.
 * 
 * @module condition-stacking
 */

// ========================================
// TIPOS
// ========================================

/**
 * Regra de acúmulo para condições
 */
export type StackingRule = 
  | 'no_stack'      // Não acumula - ignora aplicações adicionais
  | 'refresh'       // Atualiza duração mas não acumula efeito
  | 'highest'       // Usa apenas o maior valor
  | 'sum'           // Soma todos os valores
  | 'accumulate';   // Acumula efeitos específicos (ex: dano de veneno)

/**
 * Configuração de stacking para uma condição
 */
export interface ConditionStackingConfig {
  rule: StackingRule;
  maxStacks?: number;           // Número máximo de pilhas (se aplicável)
  stackProperty?: string;       // Propriedade que acumula (ex: 'damagePerTurn')
  description: string;          // Descrição da regra para UI
}

/**
 * Instância de condição ativa no personagem
 */
export interface ActiveConditionInstance {
  conditionId: string;
  sourceId: string;             // ID único da fonte (ex: 'veneno-aranha-1')
  sourceName: string;           // Nome da fonte (ex: 'Veneno de Aranha')
  stacks: number;               // Número de pilhas atuais
  damagePerTurn?: string;       // Dado de dano por turno (ex: '1d6')
  duration?: number;            // Duração restante em turnos
  appliedAt: number;            // Timestamp de aplicação
  params?: Record<string, unknown>; // Parâmetros adicionais
}

// ========================================
// CONFIGURAÇÕES PADRÃO DE STACKING
// ========================================

/**
 * Regras de stacking padrão para condições
 * A maioria não acumula, mas algumas têm exceções
 */
export const DEFAULT_STACKING_RULES: Record<string, ConditionStackingConfig> = {
  // Condições que NÃO acumulam (comportamento padrão)
  agarrado: { rule: 'no_stack', description: 'Não acumula' },
  atordoado: { rule: 'no_stack', description: 'Não acumula' },
  caido: { rule: 'no_stack', description: 'Não acumula' },
  cego: { rule: 'no_stack', description: 'Não acumula' },
  confuso: { rule: 'no_stack', description: 'Não acumula' },
  debilitado: { rule: 'no_stack', description: 'Não acumula' },
  desprevenido: { rule: 'no_stack', description: 'Não acumula' },
  doente: { rule: 'no_stack', description: 'Não acumula' },
  dominado: { rule: 'no_stack', description: 'Não acumula' },
  enredado: { rule: 'no_stack', description: 'Não acumula' },
  esmorecido: { rule: 'no_stack', description: 'Não acumula' },
  exausto: { rule: 'no_stack', description: 'Não acumula' },
  fascinado: { rule: 'no_stack', description: 'Não acumula' },
  fraco: { rule: 'no_stack', description: 'Não acumula' },
  imobilizado: { rule: 'no_stack', description: 'Não acumula' },
  incapacitado: { rule: 'no_stack', description: 'Não acumula' },
  inconsciente: { rule: 'no_stack', description: 'Não acumula' },
  lento: { rule: 'no_stack', description: 'Não acumula' },
  pasmo: { rule: 'no_stack', description: 'Não acumula' },
  perturbado: { rule: 'no_stack', description: 'Não acumula' },
  surdo: { rule: 'no_stack', description: 'Não acumula' },
  surpreso: { rule: 'no_stack', description: 'Não acumula' },
  vulneravel: { rule: 'no_stack', description: 'Não acumula' },
  
  // Condições que atualizam duração
  apavorado: { rule: 'refresh', description: 'Atualiza duração' },
  amedrontado: { rule: 'refresh', description: 'Atualiza duração' },
  
  // === EXCEÇÕES OFICIAIS (PDF p.321) ===
  
  /**
   * ENVENENADO: Dano recorrente SEMPRE acumula de múltiplas fontes
   * Exemplo: 2 venenos de 1d6 = 2d6 de dano por turno
   */
  envenenado: {
    rule: 'accumulate',
    stackProperty: 'damagePerTurn',
    maxStacks: 10, // Limite de segurança
    description: 'Dano recorrente de veneno acumula de múltiplas fontes',
  },
  
  /**
   * SANGRANDO: Dano recorrente acumula (similar a envenenado)
   */
  sangrando: {
    rule: 'accumulate',
    stackProperty: 'damagePerTurn',
    maxStacks: 10,
    description: 'Dano recorrente de sangramento acumula',
  },
  
  /**
   * FRAGILIZADO: Pode ter múltiplos tipos de vulnerabilidade
   * Cada tipo de dano é rastreado separadamente
   */
  fragilizado: {
    rule: 'sum',
    stackProperty: 'damageType',
    description: 'Vulnerabilidades a tipos diferentes acumulam',
  },
  
  /**
   * MACHUCADO: Dano ao agir acumula
   */
  machucado: {
    rule: 'accumulate',
    stackProperty: 'damageOnAction',
    maxStacks: 5,
    description: 'Dano ao agir acumula de múltiplas fontes',
  },
};

// ========================================
// FUNÇÕES DE STACKING
// ========================================

/**
 * Obtém a configuração de stacking para uma condição
 */
export function getStackingConfig(conditionId: string): ConditionStackingConfig {
  return DEFAULT_STACKING_RULES[conditionId] ?? {
    rule: 'no_stack',
    description: 'Não acumula (padrão)',
  };
}

/**
 * Verifica se uma condição pode acumular
 */
export function canStack(conditionId: string): boolean {
  const config = getStackingConfig(conditionId);
  return config.rule === 'accumulate' || config.rule === 'sum';
}

/**
 * Aplica uma nova instância de condição considerando regras de stacking
 * 
 * @param existingInstances - Instâncias atuais da condição
 * @param newInstance - Nova instância a aplicar
 * @returns Lista atualizada de instâncias
 */
export function applyConditionStacking(
  existingInstances: ActiveConditionInstance[],
  newInstance: ActiveConditionInstance
): ActiveConditionInstance[] {
  const config = getStackingConfig(newInstance.conditionId);
  
  // Encontra instâncias da mesma condição
  const sameCondition = existingInstances.filter(
    i => i.conditionId === newInstance.conditionId
  );
  const otherConditions = existingInstances.filter(
    i => i.conditionId !== newInstance.conditionId
  );
  
  switch (config.rule) {
    case 'no_stack':
      // Não acumula - mantém a existente se houver
      if (sameCondition.length > 0) {
        return existingInstances;
      }
      return [...existingInstances, newInstance];
      
    case 'refresh':
      // Atualiza duração da existente
      if (sameCondition.length > 0) {
        const updated = sameCondition.map(i => ({
          ...i,
          duration: newInstance.duration ?? i.duration,
          appliedAt: Date.now(),
        }));
        return [...otherConditions, ...updated];
      }
      return [...existingInstances, newInstance];
      
    case 'highest':
      // Mantém apenas o maior valor
      if (sameCondition.length > 0) {
        const existingValue = sameCondition[0].stacks;
        if (newInstance.stacks > existingValue) {
          return [...otherConditions, newInstance];
        }
        return existingInstances;
      }
      return [...existingInstances, newInstance];
      
    case 'sum':
    case 'accumulate':
      // Acumula pilhas ou adiciona nova fonte
      const maxStacks = config.maxStacks ?? 99;
      
      // Verifica se já existe uma instância da mesma FONTE
      const existingFromSameSource = sameCondition.find(
        i => i.sourceId === newInstance.sourceId
      );
      
      if (existingFromSameSource) {
        // Mesma fonte: atualiza duração, não acumula
        const updated = sameCondition.map(i => {
          if (i.sourceId === newInstance.sourceId) {
            return {
              ...i,
              duration: newInstance.duration ?? i.duration,
              appliedAt: Date.now(),
            };
          }
          return i;
        });
        return [...otherConditions, ...updated];
      }
      
      // Fonte diferente: acumula se não exceder máximo
      if (sameCondition.length >= maxStacks) {
        // Atingiu limite - não adiciona
        return existingInstances;
      }
      
      // Adiciona nova instância (fonte diferente = dano acumula)
      return [...existingInstances, newInstance];
      
    default:
      return [...existingInstances, newInstance];
  }
}

/**
 * Calcula o dano total por turno de uma condição acumulada
 * 
 * @param conditionId - ID da condição
 * @param instances - Todas as instâncias ativas
 * @returns Total de dano calculado (fórmula ou valor fixo)
 */
export function calculateAccumulatedDamage(
  conditionId: string,
  instances: ActiveConditionInstance[]
): { formula: string; diceCount: number; diceType: number; sources: string[] } {
  const config = getStackingConfig(conditionId);
  const relevantInstances = instances.filter(i => i.conditionId === conditionId);
  
  if (config.rule !== 'accumulate' || relevantInstances.length === 0) {
    return { formula: '0', diceCount: 0, diceType: 0, sources: [] };
  }
  
  // Agrupa danos por tipo de dado
  const damageMap = new Map<string, { count: number; sources: string[] }>();
  
  for (const instance of relevantInstances) {
    const damage = instance.damagePerTurn ?? '1d6'; // Default para veneno
    
    // Parseia o dado (ex: "1d6", "2d4")
    const match = damage.match(/(\d+)d(\d+)/);
    if (match) {
      const key = `d${match[2]}`;
      const existing = damageMap.get(key) ?? { count: 0, sources: [] };
      existing.count += parseInt(match[1]);
      existing.sources.push(instance.sourceName);
      damageMap.set(key, existing);
    }
  }
  
  // Monta a fórmula consolidada
  const parts: string[] = [];
  const sources: string[] = [];
  let totalDiceCount = 0;
  let primaryDiceType = 6;
  
  for (const [key, data] of damageMap) {
    const diceType = parseInt(key.substring(1));
    parts.push(`${data.count}${key}`);
    sources.push(...data.sources);
    totalDiceCount += data.count;
    primaryDiceType = diceType; // Usa o último tipo (simplificação)
  }
  
  return {
    formula: parts.join(' + ') || '0',
    diceCount: totalDiceCount,
    diceType: primaryDiceType,
    sources,
  };
}

/**
 * Remove uma instância específica de condição
 */
export function removeConditionInstance(
  instances: ActiveConditionInstance[],
  conditionId: string,
  sourceId?: string
): ActiveConditionInstance[] {
  if (sourceId) {
    // Remove instância específica
    return instances.filter(
      i => !(i.conditionId === conditionId && i.sourceId === sourceId)
    );
  }
  
  // Remove todas as instâncias da condição
  return instances.filter(i => i.conditionId !== conditionId);
}

/**
 * Formata descrição de condição acumulada para UI
 */
export function formatStackedConditionDescription(
  conditionId: string,
  instances: ActiveConditionInstance[]
): string {
  const config = getStackingConfig(conditionId);
  const relevantInstances = instances.filter(i => i.conditionId === conditionId);
  
  if (relevantInstances.length === 0) {
    return '';
  }
  
  if (relevantInstances.length === 1) {
    const inst = relevantInstances[0];
    if (inst.damagePerTurn) {
      return `${inst.damagePerTurn} por turno (${inst.sourceName})`;
    }
    return inst.sourceName;
  }
  
  // Múltiplas fontes
  const { formula, sources } = calculateAccumulatedDamage(conditionId, instances);
  
  if (conditionId === 'envenenado' || conditionId === 'sangrando') {
    return `${formula} por turno (${sources.length} fontes: ${sources.join(', ')})`;
  }
  
  return `${relevantInstances.length}x (${sources.join(', ')})`;
}
