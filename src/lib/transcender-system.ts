/**
 * Sistema Transcender - Ordem Paranormal RPG
 * 
 * Gerencia o uso correto da habilidade Transcender:
 * - Verifica elegibilidade por NEX/trilha
 * - Impede uso múltiplo na mesma oportunidade
 * - Aplica custo de Sanidade atomicamente
 * - Rastreia escolhas e sub-escolhas
 */

import { supabase } from '@/integrations/supabase/client';
import { ParanormalPower, ParanormalElement, PowerChoiceType } from './paranormal-powers';

// Tipos de escolha de poder
export type PowerChoiceType_DB = 'transcender' | 'class_power' | 'track_power';

// Interface para uma escolha de poder salva no banco
export interface PowerChoice {
  id: string;
  character_id: string;
  user_id: string;
  nex: number;
  choice_type: PowerChoiceType_DB;
  status: 'open' | 'resolved';
  resolution?: {
    picked: 'transcender' | string; // ID do poder escolhido
    powerId?: string;
    powerName?: string;
    subchoices?: {
      skills?: string[];
      ritualId?: string;
      resistElement?: ParanormalElement;
    };
  };
  sanity_delta: number;
  created_at: string;
  resolved_at: string | null;
}

// Interface para oportunidade de escolha disponível
export interface ChoiceOpportunity {
  nex: number;
  choiceType: PowerChoiceType_DB;
  source: string; // Ex: "Trilha Condutor", "Classe Ocultista"
  abilityName?: string; // Ex: "Transcender"
  status: 'available' | 'used';
  existingChoiceId?: string;
}

// Interface para validação de sub-escolhas
export interface SubchoiceValidation {
  requiresChoice: boolean;
  choiceType?: PowerChoiceType;
  isComplete: boolean;
  chosenValues?: {
    skills?: string[];
    ritualId?: string;
    resistElement?: ParanormalElement;
  };
}

// NEX que oferecem Transcender nas trilhas de Ocultista
// Baseado nas trilhas oficiais do livro
const OCULTIST_TRANSCENDER_NEX: Record<string, number[]> = {
  'condutor': [40, 65],
  'flagelador': [40, 65],
  'graduado': [10, 40, 65], // Graduado tem mais oportunidades
  'intuitivo': [40, 65],
  'lamina-paranormal': [40, 65],
};

// Trilhas de suplemento que também possuem Transcender
const SUPPLEMENT_TRANSCENDER_NEX: Record<string, number[]> = {
  // Adicionar trilhas de suplemento conforme necessário
};

/**
 * Obtém as oportunidades de escolha de Transcender para um personagem
 */
export function getTranscenderOpportunities(
  characterClass: string,
  trackId: string | null,
  currentNex: number
): { nex: number; source: string }[] {
  const opportunities: { nex: number; source: string }[] = [];
  
  // Ocultistas têm Transcender via trilha
  if (characterClass === 'Ocultista' && trackId) {
    const trackKey = trackId.toLowerCase().replace(/\s+/g, '-');
    const nexValues = OCULTIST_TRANSCENDER_NEX[trackKey] || SUPPLEMENT_TRANSCENDER_NEX[trackKey] || [];
    
    for (const nex of nexValues) {
      if (nex <= currentNex) {
        opportunities.push({
          nex,
          source: `Trilha ${trackId}`,
        });
      }
    }
  }
  
  // Outras classes podem ter Transcender via poderes gerais ou origens específicas
  // (implementar conforme necessário)
  
  return opportunities;
}

/**
 * Verifica se o personagem pode usar Transcender em um determinado NEX
 */
export async function canUseTranscender(
  characterId: string,
  userId: string,
  targetNex: number,
  characterClass: string,
  trackId: string | null
): Promise<{
  eligible: boolean;
  reason?: string;
  existingChoiceId?: string;
}> {
  // 1. Verificar se há oportunidade de Transcender neste NEX
  const opportunities = getTranscenderOpportunities(characterClass, trackId, targetNex);
  const hasOpportunity = opportunities.some(o => o.nex === targetNex);
  
  if (!hasOpportunity) {
    return {
      eligible: false,
      reason: `Não há habilidade Transcender disponível no NEX ${targetNex}% para esta classe/trilha.`,
    };
  }
  
  // 2. Verificar se já existe uma escolha feita para este NEX
  const { data: existingChoices, error } = await supabase
    .from('character_power_choices')
    .select('*')
    .eq('character_id', characterId)
    .eq('nex', targetNex)
    .eq('choice_type', 'transcender');
  
  if (error) {
    console.error('Erro ao verificar escolhas existentes:', error);
    return {
      eligible: false,
      reason: 'Erro ao verificar escolhas anteriores.',
    };
  }
  
  if (existingChoices && existingChoices.length > 0) {
    const choice = existingChoices[0];
    if (choice.status === 'resolved') {
      return {
        eligible: false,
        reason: `Transcender já foi usado no NEX ${targetNex}%.`,
        existingChoiceId: choice.id,
      };
    }
    // Se existe mas não está resolvido, pode continuar
    return {
      eligible: true,
      existingChoiceId: choice.id,
    };
  }
  
  return { eligible: true };
}

/**
 * Calcula o custo de Sanidade ao usar Transcender
 * O custo é o ganho de SAN que seria recebido naquele NEX
 */
export function calculateTranscenderSanityCost(
  characterClass: string,
  currentNex: number,
  targetNex: number
): number {
  // Importar dados de classe
  const classData = getClassSanityProgression(characterClass);
  if (!classData) return 0;
  
  // Calcular diferença de SAN entre NEX atual e próximo
  const currentSan = classData.sanBase + (Math.floor(currentNex / 5) - 1) * classData.sanPerNex;
  const nextSan = classData.sanBase + (Math.floor(targetNex / 5) - 1) * classData.sanPerNex;
  
  return nextSan - currentSan;
}

/**
 * Obtém a progressão de sanidade de uma classe
 */
function getClassSanityProgression(classId: string): { sanBase: number; sanPerNex: number } | null {
  const classProgression: Record<string, { sanBase: number; sanPerNex: number }> = {
    'Combatente': { sanBase: 12, sanPerNex: 3 },
    'Especialista': { sanBase: 16, sanPerNex: 4 },
    'Ocultista': { sanBase: 20, sanPerNex: 5 },
  };
  return classProgression[classId] || null;
}

/**
 * Inicia uma escolha de Transcender (cria registro aberto)
 */
export async function initTranscenderChoice(
  characterId: string,
  userId: string,
  nex: number
): Promise<{ success: boolean; choiceId?: string; error?: string }> {
  // Verifica se já existe
  const { data: existing } = await supabase
    .from('character_power_choices')
    .select('id')
    .eq('character_id', characterId)
    .eq('nex', nex)
    .eq('choice_type', 'transcender')
    .single();
  
  if (existing) {
    return { success: true, choiceId: existing.id };
  }
  
  // Cria novo registro
  const { data, error } = await supabase
    .from('character_power_choices')
    .insert({
      character_id: characterId,
      user_id: userId,
      nex,
      choice_type: 'transcender',
      status: 'open',
      sanity_delta: 0,
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Erro ao criar escolha de Transcender:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, choiceId: data.id };
}

/**
 * Resolve uma escolha de Transcender (finaliza com poder escolhido)
 */
export async function resolveTranscenderChoice(
  choiceId: string,
  power: ParanormalPower,
  sanityCost: number,
  subchoices?: {
    skills?: string[];
    ritualId?: string;
    resistElement?: ParanormalElement;
  }
): Promise<{ success: boolean; error?: string }> {
  const resolution = {
    picked: 'transcender',
    powerId: power.id,
    powerName: power.name,
    subchoices,
  };
  
  const { error } = await supabase
    .from('character_power_choices')
    .update({
      status: 'resolved',
      resolution,
      sanity_delta: -sanityCost, // Negativo pois é perda
      resolved_at: new Date().toISOString(),
    })
    .eq('id', choiceId);
  
  if (error) {
    console.error('Erro ao resolver escolha de Transcender:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

/**
 * Obtém todas as escolhas de poder de um personagem
 */
export async function getCharacterPowerChoices(
  characterId: string
): Promise<PowerChoice[]> {
  const { data, error } = await supabase
    .from('character_power_choices')
    .select('*')
    .eq('character_id', characterId)
    .order('nex', { ascending: true });
  
  if (error) {
    console.error('Erro ao buscar escolhas de poder:', error);
    return [];
  }
  
  return (data || []) as PowerChoice[];
}

/**
 * Verifica se um poder requer sub-escolha e se está completa
 */
export function validatePowerSubchoice(
  power: ParanormalPower,
  subchoices?: {
    skills?: string[];
    ritualId?: string;
    resistElement?: ParanormalElement;
  }
): SubchoiceValidation {
  if (!power.requiresChoice) {
    return { requiresChoice: false, isComplete: true };
  }
  
  switch (power.requiresChoice) {
    case 'skill_intellect':
      // Precisa escolher 1 perícia (ou 2 com afinidade)
      const hasSkills = subchoices?.skills && subchoices.skills.length >= 1;
      return {
        requiresChoice: true,
        choiceType: 'skill_intellect',
        isComplete: !!hasSkills,
        chosenValues: subchoices,
      };
      
    case 'ritual':
      // Precisa escolher um ritual
      return {
        requiresChoice: true,
        choiceType: 'ritual',
        isComplete: !!subchoices?.ritualId,
        chosenValues: subchoices,
      };
      
    case 'element_resistance':
      // Precisa escolher um elemento
      return {
        requiresChoice: true,
        choiceType: 'element_resistance',
        isComplete: !!subchoices?.resistElement,
        chosenValues: subchoices,
      };
      
    default:
      return { requiresChoice: false, isComplete: true };
  }
}

/**
 * Obtém status consolidado de Transcender para um personagem
 */
export async function getTranscenderStatus(
  characterId: string,
  characterClass: string,
  trackId: string | null,
  currentNex: number
): Promise<{
  opportunities: ChoiceOpportunity[];
  usedCount: number;
  availableCount: number;
}> {
  const rawOpportunities = getTranscenderOpportunities(characterClass, trackId, currentNex);
  const choices = await getCharacterPowerChoices(characterId);
  
  const opportunities: ChoiceOpportunity[] = rawOpportunities.map(opp => {
    const existingChoice = choices.find(
      c => c.nex === opp.nex && c.choice_type === 'transcender'
    );
    
    return {
      nex: opp.nex,
      choiceType: 'transcender',
      source: opp.source,
      abilityName: 'Transcender',
      status: existingChoice?.status === 'resolved' ? 'used' : 'available',
      existingChoiceId: existingChoice?.id,
    };
  });
  
  const usedCount = opportunities.filter(o => o.status === 'used').length;
  const availableCount = opportunities.filter(o => o.status === 'available').length;
  
  return { opportunities, usedCount, availableCount };
}
