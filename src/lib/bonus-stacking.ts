/**
 * Ordem Paranormal RPG v1.3 - Sistema de Acúmulo de Bônus
 * 
 * Regras oficiais:
 * 1. Bônus de fontes DIFERENTES acumulam
 * 2. Bônus da MESMA fonte NÃO acumulam (usa o maior)
 * 3. Bônus de RITUAIS não acumulam entre si (usa o maior ritual)
 * 4. Bônus de ITENS não acumulam entre si (exceto proteção + escudo + paranormal)
 */

export type BonusSourceType = 
  | 'origin'          // Origem
  | 'ability'         // Habilidade de classe
  | 'general_power'   // Poder geral
  | 'paranormal'      // Poder paranormal
  | 'equipment'       // Equipamento (arma, item)
  | 'armor'           // Armadura (proteção)
  | 'shield'          // Escudo
  | 'ritual'          // Ritual
  | 'condition'       // Condição
  | 'skill_training'  // Treinamento em perícia
  | 'other';          // Outros

export interface BonusEntry {
  source: string;           // Nome da fonte específica
  type: BonusSourceType;    // Tipo da fonte
  value: number;            // Valor do bônus
  active: boolean;          // Se está ativo
  conditional?: string;     // Condição para ativação
}

export interface StackingResult {
  total: number;
  breakdown: BonusEntry[];
  appliedBonuses: BonusEntry[];
  excludedBonuses: BonusEntry[];
}

/**
 * Calcula o total de bônus aplicando as regras oficiais de acúmulo
 * 
 * @param bonuses - Lista de todos os bônus disponíveis
 * @returns Total calculado com breakdown
 */
export function calculateStackedBonus(bonuses: BonusEntry[]): StackingResult {
  const activeBonuses = bonuses.filter(b => b.active);
  const appliedBonuses: BonusEntry[] = [];
  const excludedBonuses: BonusEntry[] = [];
  
  // Agrupa por tipo de fonte
  const byType = new Map<BonusSourceType, BonusEntry[]>();
  
  for (const bonus of activeBonuses) {
    const existing = byType.get(bonus.type) || [];
    existing.push(bonus);
    byType.set(bonus.type, existing);
  }
  
  // Processa cada tipo conforme regras
  for (const [type, typeBonuses] of byType) {
    switch (type) {
      // RITUAIS: Não acumulam entre si - usa o maior
      case 'ritual': {
        const bestRitual = getHighestBonus(typeBonuses);
        if (bestRitual) {
          appliedBonuses.push(bestRitual);
          excludedBonuses.push(...typeBonuses.filter(b => b !== bestRitual));
        }
        break;
      }
      
      // EQUIPAMENTOS (exceto armadura/escudo): Não acumulam - usa o maior
      case 'equipment': {
        const bestEquipment = getHighestBonus(typeBonuses);
        if (bestEquipment) {
          appliedBonuses.push(bestEquipment);
          excludedBonuses.push(...typeBonuses.filter(b => b !== bestEquipment));
        }
        break;
      }
      
      // ARMADURA, ESCUDO, PARANORMAL: Acumulam entre si (exceção oficial)
      case 'armor':
      case 'shield':
      case 'paranormal': {
        appliedBonuses.push(...typeBonuses);
        break;
      }
      
      // ORIGEM, HABILIDADE, PODER GERAL, CONDIÇÕES: Todos acumulam (fontes diferentes)
      case 'origin':
      case 'ability':
      case 'general_power':
      case 'condition':
      case 'skill_training':
      case 'other': {
        appliedBonuses.push(...typeBonuses);
        break;
      }
      
      default: {
        appliedBonuses.push(...typeBonuses);
      }
    }
  }
  
  // Calcula total
  const total = appliedBonuses.reduce((sum, b) => sum + b.value, 0);
  
  return {
    total,
    breakdown: bonuses,
    appliedBonuses,
    excludedBonuses,
  };
}

/**
 * Calcula bônus de defesa com regras específicas
 * Armadura + Escudo + Bônus Paranormal ACUMULAM
 * Outros bônus de mesma fonte não acumulam
 */
export function calculateDefenseBonus(bonuses: BonusEntry[]): StackingResult {
  const activeBonuses = bonuses.filter(b => b.active);
  const appliedBonuses: BonusEntry[] = [];
  const excludedBonuses: BonusEntry[] = [];
  
  // Separa por tipo
  const armorBonuses = activeBonuses.filter(b => b.type === 'armor');
  const shieldBonuses = activeBonuses.filter(b => b.type === 'shield');
  const paranormalBonuses = activeBonuses.filter(b => b.type === 'paranormal');
  const ritualBonuses = activeBonuses.filter(b => b.type === 'ritual');
  const otherBonuses = activeBonuses.filter(b => 
    !['armor', 'shield', 'paranormal', 'ritual'].includes(b.type)
  );
  
  // Armadura: usa o maior (não acumula múltiplas armaduras)
  const bestArmor = getHighestBonus(armorBonuses);
  if (bestArmor) {
    appliedBonuses.push(bestArmor);
    excludedBonuses.push(...armorBonuses.filter(b => b !== bestArmor));
  }
  
  // Escudo: usa o maior (não acumula múltiplos escudos)
  const bestShield = getHighestBonus(shieldBonuses);
  if (bestShield) {
    appliedBonuses.push(bestShield);
    excludedBonuses.push(...shieldBonuses.filter(b => b !== bestShield));
  }
  
  // Paranormal: acumulam todos (Forma de Fumaça, etc.)
  appliedBonuses.push(...paranormalBonuses);
  
  // Rituais: usa o maior (não acumulam entre si)
  const bestRitual = getHighestBonus(ritualBonuses);
  if (bestRitual) {
    appliedBonuses.push(bestRitual);
    excludedBonuses.push(...ritualBonuses.filter(b => b !== bestRitual));
  }
  
  // Outros (origem, habilidade, poder geral): acumulam
  appliedBonuses.push(...otherBonuses);
  
  const total = appliedBonuses.reduce((sum, b) => sum + b.value, 0);
  
  return {
    total,
    breakdown: bonuses,
    appliedBonuses,
    excludedBonuses,
  };
}

/**
 * Calcula bônus de dano com regras específicas
 */
export function calculateDamageBonus(bonuses: BonusEntry[]): StackingResult {
  const activeBonuses = bonuses.filter(b => b.active);
  const appliedBonuses: BonusEntry[] = [];
  const excludedBonuses: BonusEntry[] = [];
  
  // Separa rituais dos outros
  const ritualBonuses = activeBonuses.filter(b => b.type === 'ritual');
  const otherBonuses = activeBonuses.filter(b => b.type !== 'ritual');
  
  // Rituais: usa o maior
  const bestRitual = getHighestBonus(ritualBonuses);
  if (bestRitual) {
    appliedBonuses.push(bestRitual);
    excludedBonuses.push(...ritualBonuses.filter(b => b !== bestRitual));
  }
  
  // Outros: acumulam (poderes, habilidades, etc.)
  appliedBonuses.push(...otherBonuses);
  
  const total = appliedBonuses.reduce((sum, b) => sum + b.value, 0);
  
  return {
    total,
    breakdown: bonuses,
    appliedBonuses,
    excludedBonuses,
  };
}

/**
 * Retorna o bônus com maior valor de uma lista
 */
function getHighestBonus(bonuses: BonusEntry[]): BonusEntry | null {
  if (bonuses.length === 0) return null;
  return bonuses.reduce((max, current) => 
    current.value > max.value ? current : max
  );
}

/**
 * Verifica se dois bônus são da mesma fonte específica
 */
export function isSameSource(a: BonusEntry, b: BonusEntry): boolean {
  return a.type === b.type && a.source === b.source;
}

/**
 * Formata mensagem de exclusão de bônus
 */
export function formatExclusionReason(bonus: BonusEntry, appliedBonus: BonusEntry): string {
  if (bonus.type === 'ritual') {
    return `Não acumula com ${appliedBonus.source} (rituais não acumulam)`;
  }
  if (bonus.type === 'equipment') {
    return `Não acumula com ${appliedBonus.source} (itens não acumulam)`;
  }
  return `Não acumula com ${appliedBonus.source}`;
}
