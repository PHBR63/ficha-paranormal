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
import { getActiveRitualEffect } from '@/lib/ritual-effects';
import { getSkillBonus, getTrainingLabel } from '@/lib/character-data';

// Interface para breakdown de bônus de defesa
export interface DefenseBonusBreakdown {
  source: string;        // Nome da fonte (ex: "Patrulha", "Reflexos Defensivos")
  type: 'origin' | 'ability' | 'general_power' | 'paranormal' | 'ritual' | 'skill_training';
  bonus: number;         // Valor do bônus
  conditional?: string;  // Condição se houver (ex: "com proteção pesada")
  active: boolean;       // Se o bônus está ativo
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
}: UseDefenseBonusesProps): DefenseBonuses {
  return useMemo(() => {
    const breakdown: DefenseBonusBreakdown[] = [];
    const resistanceBreakdown: ResistanceBonusBreakdown[] = [];
    
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
    
    // Calcula o bônus total de defesa (apenas dos ativos)
    const totalBonus = breakdown
      .filter(b => b.active)
      .reduce((sum, b) => sum + b.bonus, 0);
    
    // Calcula o bônus total de cada resistência
    const totalFortitude = resistanceBreakdown
      .filter(b => b.active)
      .reduce((sum, b) => sum + b.fortitude, 0);
    
    const totalReflexos = resistanceBreakdown
      .filter(b => b.active)
      .reduce((sum, b) => sum + b.reflexos, 0);
    
    const totalVontade = resistanceBreakdown
      .filter(b => b.active)
      .reduce((sum, b) => sum + b.vontade, 0);
    
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
  }, [origin, abilities, generalPowers, inventory, activeRituals, skills]);
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
