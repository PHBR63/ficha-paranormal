/**
 * useDefenseBonuses - Hook para calcular bônus de defesa e resistências de múltiplas fontes
 * 
 * Fontes de bônus consideradas:
 * - Origem: Policial → "Patrulha" (+2 Defesa)
 * - Habilidade de Classe: "Reflexos Defensivos" (+2 Defesa, +2 Resistências)
 * - Habilidade de Classe: "Tanque de Guerra" (+2 Defesa com proteção pesada)
 * - Poder Geral: "Esquiva" (+2 Defesa, não cumulativo com armadura média/pesada)
 * - Rituais Ativos: Rituais sustentados com defenseModifier (Embaralhar, etc.)
 * - Treinamento em Reflexos: +5 (Treinado), +10 (Veterano), +15 (Expert)
 */

import { useMemo } from 'react';
import { getActiveRitualEffect } from '@/lib/rituals/legacy-exports';
import { getSkillBonus, getTrainingLabel } from '@/lib/character-data';

// Interface para breakdown de bônus de defesa
export interface DefenseBonusBreakdown {
  source: string;        // Nome da fonte (ex: "Patrulha", "Reflexos Defensivos")
  type: 'origin' | 'ability' | 'general_power' | 'paranormal' | 'ritual' | 'skill_training';
  bonus: number;         // Valor do bônus
  conditional?: string;  // Condição se houver (ex: "com proteção pesada")
  active: boolean;       // Se o bônus está ativo
  excluded?: boolean;    // Se foi excluído por regra de não acúmulo
  excludedReason?: string; // Motivo da exclusão (ex: "Não acumula com Ritual X")
}

// Interface para bônus de resistências
export interface ResistanceBonuses {
  fortitude: number;    // Bônus em testes de Fortitude (VIG)
  reflexos: number;     // Bônus em testes de Reflexos (AGI)
  vontade: number;      // Bônus em testes de Vontade (PRE)
  breakdown: ResistanceBonusBreakdown[];
}

// Interface para breakdown de bônus de resistência
export interface ResistanceBonusBreakdown {
  source: string;
  type: 'ability' | 'general_power' | 'paranormal' | 'ritual';
  fortitude: number;
  reflexos: number;
  vontade: number;
  active: boolean;
}

// Interface de retorno do hook
export interface DefenseBonuses {
  totalBonus: number;
  breakdown: DefenseBonusBreakdown[];
  // Bônus de resistências
  resistances: ResistanceBonuses;
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

// Interface para ritual ativo
export interface ActiveRitualForDefense {
  ritualId: string;
  ritualName: string;
  enhancements: string[];
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
  activeRituals?: ActiveRitualForDefense[]; // Rituais ativos com defenseModifier
  skills?: Record<string, number>;   // Perícias com nível de treinamento (0-3)
  activeConditionalBonuses?: string[]; // IDs dos bônus condicionais ativos
  intellect?: number;                // Intelecto do personagem (para Sentido Tático)
}

/**
 * Hook que calcula bônus de defesa e resistências de origens, habilidades de classe, poderes gerais e rituais
 */
export function useDefenseBonuses({
  origin,
  abilities,
  generalPowers = [],
  inventory = [],
  activeRituals = [],
  skills = {},
  activeConditionalBonuses = [],
  intellect = 1,
}: UseDefenseBonusesProps): DefenseBonuses {
  return useMemo(() => {
    const breakdown: DefenseBonusBreakdown[] = [];
    const resistanceBreakdown: ResistanceBonusBreakdown[] = [];
    
    // Verifica armaduras equipadas (excluindo escudos)
    const equippedArmor = inventory.find(
      item => item.isEquipped && item.itemType === 'armor' && item.armorType !== 'escudo'
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
    
    // 2. HABILIDADE DE CLASSE: Reflexos Defensivos (+2 Defesa E +2 Resistências)
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
      // Bônus de Defesa
      breakdown.push({
        source: 'Reflexos Defensivos',
        type: 'ability',
        bonus: 2,
        active: true,
      });
      
      // Bônus de Resistências (+2 em Fortitude, Reflexos e Vontade)
      resistanceBreakdown.push({
        source: 'Reflexos Defensivos',
        type: 'ability',
        fortitude: 2,
        reflexos: 2,
        vontade: 2,
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
    
    // 5. PODER GERAL: Resistência Mental (+2 Vontade)
    const hasResistenciaMental = generalPowers.some(p => 
      p.id === 'resistencia-mental' ||
      p.name.toLowerCase().includes('resistência mental') ||
      p.name.toLowerCase().includes('resistencia mental')
    );
    
    if (hasResistenciaMental) {
      resistanceBreakdown.push({
        source: 'Resistência Mental',
        type: 'general_power',
        fortitude: 0,
        reflexos: 0,
        vontade: 2,
        active: true,
      });
    }
    
    // 6. PODER GERAL: Constituição Forte (+2 Fortitude)
    const hasConstituicaoForte = generalPowers.some(p => 
      p.id === 'constituicao-forte' ||
      p.name.toLowerCase().includes('constituição forte') ||
      p.name.toLowerCase().includes('constituicao forte')
    );
    
    if (hasConstituicaoForte) {
      resistanceBreakdown.push({
        source: 'Constituição Forte',
        type: 'general_power',
        fortitude: 2,
        reflexos: 0,
        vontade: 0,
        active: true,
      });
    }
    
    // 7. RITUAIS ATIVOS: Processa rituais sustentados com defenseModifier
    activeRituals.forEach(ritual => {
      const effect = getActiveRitualEffect(ritual.ritualId, ritual.enhancements);
      if (effect?.defenseModifier) {
        breakdown.push({
          source: ritual.ritualName,
          type: 'ritual',
          bonus: effect.defenseModifier,
          active: true,
        });
      }
    });
    
    // 8. TREINAMENTO EM REFLEXOS: +5 (Treinado), +10 (Veterano), +15 (Expert)
    const reflexosTraining = skills['reflexos'] || skills['Reflexos'] || 0;
    if (reflexosTraining > 0) {
      const trainingBonus = getSkillBonus(reflexosTraining);
      breakdown.push({
        source: `Reflexos (${getTrainingLabel(reflexosTraining)})`,
        type: 'skill_training',
        bonus: trainingBonus,
        active: true,
      });
    }
    
    // === HABILIDADES ATIVAS (togglável) ===
    
    // Combate Defensivo: +5 Defesa, -2 ataque (quando ativado manualmente)
    const hasCombateDefensivo = normalizedAbilities.some(a => 
      a.includes('combate defensivo') || a === 'combate-defensivo'
    ) || abilities.some(a => 
      a === 'combate-defensivo' || a === 'Combate Defensivo'
    );
    
    if (hasCombateDefensivo) {
      const isActive = activeConditionalBonuses.includes('combate-defensivo');
      breakdown.push({
        source: 'Combate Defensivo',
        type: 'ability',
        bonus: 5,
        conditional: '-2 ataque até próximo turno',
        active: isActive,
      });
    }
    
    // Sentido Tático: +INT Defesa e resistências (quando ativado manualmente)
    const hasSentidoTatico = normalizedAbilities.some(a => 
      a.includes('sentido tatico') || a === 'sentido-tatico'
    ) || abilities.some(a => 
      a === 'sentido-tatico' || a === 'Sentido Tático'
    );
    
    if (hasSentidoTatico) {
      const isActive = activeConditionalBonuses.includes('sentido-tatico');
      breakdown.push({
        source: 'Sentido Tático',
        type: 'ability',
        bonus: intellect,
        conditional: `2 PE + ação movimento (até fim da cena)`,
        active: isActive,
      });
      
      // Também adiciona às resistências
      resistanceBreakdown.push({
        source: 'Sentido Tático',
        type: 'ability',
        fortitude: intellect,
        reflexos: intellect,
        vontade: intellect,
        active: isActive,
      });
    }
    
    // Inquebrável (Tropa de Choque): +5 Defesa quando machucado
    const hasInquebravel = normalizedAbilities.some(a => 
      a.includes('inquebravel') || a === 'inquebravel'
    ) || abilities.some(a => 
      a === 'inquebravel' || a === 'Inquebrável'
    );
    
    if (hasInquebravel) {
      const isActive = activeConditionalBonuses.includes('inquebravel');
      breakdown.push({
        source: 'Inquebrável',
        type: 'ability',
        bonus: 5,
        conditional: 'quando machucado (PV < 50%)',
        active: isActive,
      });
    }
    
    // Calcula o bônus total de defesa aplicando regras de acúmulo
    // Livro Base v1.3: Rituais não acumulam entre si (usa o maior)
    const activeBreakdown = breakdown.filter(b => b.active);
    
    // Separa rituais dos outros bônus
    const ritualBonuses = activeBreakdown.filter(b => b.type === 'ritual');
    const otherBonuses = activeBreakdown.filter(b => b.type !== 'ritual');
    
    // Rituais: apenas o maior se aplica - marca os excluídos
    let ritualBonus = 0;
    let bestRitualSource = '';
    if (ritualBonuses.length > 0) {
      ritualBonus = Math.max(...ritualBonuses.map(b => b.bonus));
      const bestRitual = ritualBonuses.find(b => b.bonus === ritualBonus);
      bestRitualSource = bestRitual?.source || '';
      
      // Marca rituais excluídos no breakdown original
      breakdown.forEach(b => {
        if (b.type === 'ritual' && b.active && b.source !== bestRitualSource) {
          b.excluded = true;
          b.excludedReason = `Não acumula com ${bestRitualSource} (rituais não acumulam)`;
        }
      });
    }
    
    // Outros bônus: acumulam normalmente (fontes diferentes)
    const otherBonus = otherBonuses.reduce((sum, b) => sum + b.bonus, 0);
    
    const totalBonus = ritualBonus + otherBonus;
    
    // Calcula o bônus total de cada resistência (mesma lógica)
    const activeResistanceBreakdown = resistanceBreakdown.filter(b => b.active);
    
    // Separa rituais de resistências
    const ritualResistances = activeResistanceBreakdown.filter(b => b.type === 'ritual');
    const otherResistances = activeResistanceBreakdown.filter(b => b.type !== 'ritual');
    
    // Rituais: maior de cada resistência
    const ritualFortitude = ritualResistances.length > 0 
      ? Math.max(...ritualResistances.map(b => b.fortitude)) : 0;
    const ritualReflexos = ritualResistances.length > 0 
      ? Math.max(...ritualResistances.map(b => b.reflexos)) : 0;
    const ritualVontade = ritualResistances.length > 0 
      ? Math.max(...ritualResistances.map(b => b.vontade)) : 0;
    
    // Outros: acumulam
    const otherFortitude = otherResistances.reduce((sum, b) => sum + b.fortitude, 0);
    const otherReflexos = otherResistances.reduce((sum, b) => sum + b.reflexos, 0);
    const otherVontade = otherResistances.reduce((sum, b) => sum + b.vontade, 0);
    
    const totalFortitude = ritualFortitude + otherFortitude;
    const totalReflexos = ritualReflexos + otherReflexos;
    const totalVontade = ritualVontade + otherVontade;
    
    return { 
      totalBonus, 
      breakdown,
      resistances: {
        fortitude: totalFortitude,
        reflexos: totalReflexos,
        vontade: totalVontade,
        breakdown: resistanceBreakdown,
      }
    };
  }, [origin, abilities, generalPowers, inventory, activeRituals, skills, activeConditionalBonuses, intellect]);
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

/**
 * Retorna o nome legível de uma resistência
 */
export function getResistanceName(resistance: 'fortitude' | 'reflexos' | 'vontade'): string {
  const names = {
    fortitude: 'Fortitude',
    reflexos: 'Reflexos',
    vontade: 'Vontade',
  };
  return names[resistance];
}

/**
 * Retorna o atributo base de uma resistência
 */
export function getResistanceAttribute(resistance: 'fortitude' | 'reflexos' | 'vontade'): string {
  const attributes = {
    fortitude: 'VIG',
    reflexos: 'AGI',
    vontade: 'PRE',
  };
  return attributes[resistance];
}
