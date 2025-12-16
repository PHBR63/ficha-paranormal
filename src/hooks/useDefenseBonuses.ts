/**
 * useDefenseBonuses - Hook para calcular bônus de defesa de múltiplas fontes
 * 
 * Fontes de bônus consideradas:
 * - Origem: Policial → "Patrulha" (+2 Defesa)
 * - Habilidade de Classe: "Reflexos Defensivos" (+2 Defesa)
 * - Habilidade de Classe: "Tanque de Guerra" (+2 Defesa com proteção pesada)
 * - Poder Geral: "Esquiva" (+2 Defesa, não cumulativo com armadura média/pesada)
 */

import { useMemo } from 'react';

// Interface para breakdown de bônus de defesa
export interface DefenseBonusBreakdown {
  source: string;        // Nome da fonte (ex: "Patrulha", "Reflexos Defensivos")
  type: 'origin' | 'ability' | 'general_power' | 'paranormal';
  bonus: number;         // Valor do bônus
  conditional?: string;  // Condição se houver (ex: "com proteção pesada")
  active: boolean;       // Se o bônus está ativo
}

// Interface de retorno do hook
export interface DefenseBonuses {
  totalBonus: number;
  breakdown: DefenseBonusBreakdown[];
}

// Tipos de armadura para verificação
type ArmorType = 'leve' | 'media' | 'pesada' | 'light' | 'medium' | 'heavy';

// Interface para item de inventário com dados de armadura
interface InventoryItemWithArmor {
  id?: string;
  name: string;
  isEquipped?: boolean;
  itemType?: string;
  armorType?: string;
}

// Props do hook
interface UseDefenseBonusesProps {
  origin: string;                    // ID da origem do personagem
  abilities: string[];               // Lista de habilidades de classe
  generalPowers?: Array<{            // Lista de poderes gerais
    id: string;
    name: string;
    description?: string;
    category?: string;
  }>;
  inventory?: InventoryItemWithArmor[]; // Inventário para verificar armaduras equipadas
}

/**
 * Hook que calcula bônus de defesa de origens, habilidades de classe e poderes gerais
 */
export function useDefenseBonuses({
  origin,
  abilities,
  generalPowers = [],
  inventory = [],
}: UseDefenseBonusesProps): DefenseBonuses {
  return useMemo(() => {
    const breakdown: DefenseBonusBreakdown[] = [];
    
    // Verifica armaduras equipadas
    const equippedArmor = inventory.find(
      item => item.isEquipped && item.itemType === 'armor'
    );
    
    // Normaliza o tipo de armadura para verificação
    const armorType = equippedArmor?.armorType?.toLowerCase() as ArmorType | undefined;
    const isWearingMediumOrHeavy = armorType && 
      ['media', 'pesada', 'medium', 'heavy'].includes(armorType);
    const isWearingHeavy = armorType && 
      ['pesada', 'heavy'].includes(armorType);
    
    // Normaliza as habilidades para comparação (lowercase, sem acentos)
    const normalizedAbilities = abilities.map(a => 
      typeof a === 'string' ? a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : ''
    );
    
    // 1. ORIGEM: Policial → Patrulha (+2 Defesa)
    if (origin === 'policial') {
      breakdown.push({
        source: 'Patrulha',
        type: 'origin',
        bonus: 2,
        active: true,
      });
    }
    
    // 2. HABILIDADE DE CLASSE: Reflexos Defensivos (+2 Defesa)
    // Verifica variações do nome da habilidade
    const hasReflexosDefensivos = normalizedAbilities.some(a => 
      a.includes('reflexos defensivos') || 
      a.includes('reflexos-defensivos') ||
      a === 'reflexos-defensivos'
    ) || abilities.some(a => 
      a === 'reflexos-defensivos' ||
      a === 'Reflexos Defensivos'
    );
    
    if (hasReflexosDefensivos) {
      breakdown.push({
        source: 'Reflexos Defensivos',
        type: 'ability',
        bonus: 2,
        active: true,
      });
    }
    
    // 3. HABILIDADE DE CLASSE: Tanque de Guerra (+2 Defesa com proteção pesada)
    const hasTanqueDeGuerra = normalizedAbilities.some(a => 
      a.includes('tanque de guerra') || 
      a.includes('tanque-de-guerra') ||
      a === 'tanque-de-guerra'
    ) || abilities.some(a => 
      a === 'tanque-de-guerra' ||
      a === 'Tanque de Guerra'
    );
    
    if (hasTanqueDeGuerra) {
      breakdown.push({
        source: 'Tanque de Guerra',
        type: 'ability',
        bonus: 2,
        conditional: 'com proteção pesada',
        active: isWearingHeavy || false,
      });
    }
    
    // 4. PODER GERAL: Esquiva (+2 Defesa, não cumulativo com armadura média/pesada)
    const hasEsquiva = generalPowers.some(p => 
      p.id === 'esquiva' ||
      p.name.toLowerCase() === 'esquiva'
    );
    
    if (hasEsquiva) {
      breakdown.push({
        source: 'Esquiva',
        type: 'general_power',
        bonus: 2,
        conditional: 'sem armadura média/pesada',
        active: !isWearingMediumOrHeavy,
      });
    }
    
    // Calcula o bônus total (apenas dos ativos)
    const totalBonus = breakdown
      .filter(b => b.active)
      .reduce((sum, b) => sum + b.bonus, 0);
    
    return { totalBonus, breakdown };
  }, [origin, abilities, generalPowers, inventory]);
}

/**
 * Função utilitária para verificar se uma habilidade específica existe
 */
export function hasAbility(abilities: string[], abilityId: string): boolean {
  const normalized = abilityId.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return abilities.some(a => {
    if (typeof a !== 'string') return false;
    const normalizedA = a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalizedA.includes(normalized) || a === abilityId;
  });
}
