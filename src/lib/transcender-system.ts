/**
 * Sistema Transcender - Ordem Paranormal RPG
 * 
 * REGRAS OFICIAIS:
 * - Transcender é uma escolha de poder disponível para TODAS as classes
 * - Disponível nos NEX que oferecem escolha de poder (delta > 0 em abilityChoices)
 * - Derivado da tabela oficial NEX_PROGRESSION: [15, 30, 45, 60, 75, 90]
 * - Custo: não ganha Sanidade neste aumento de NEX (override, não dano)
 * - Cada marco de escolha tem 1 slot: pode usar Transcender OU poder de classe
 * - Após escolher, o slot fica consumido/lockado para aquele NEX
 */

import { supabase } from '@/integrations/supabase/client';
import { ParanormalPower, ParanormalElement, PowerChoiceType } from './paranormal-powers';
import { NEX_PROGRESSION, NexProgressionData } from './character-data';

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
  source: string; // Ex: "Poder de Classe NEX 15%"
  abilityName?: string;
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

/**
 * Deriva os marcos de escolha de poder da tabela oficial NEX_PROGRESSION
 * Retorna os NEX onde abilityChoices aumenta (delta > 0)
 * 
 * Resultado esperado: [15, 30, 45, 60, 75, 90]
 */
export function getPowerChoiceMilestones(): number[] {
  const nexValues = Object.keys(NEX_PROGRESSION).map(Number).sort((a, b) => a - b);
  const milestones: number[] = [];
  
  let prevChoices = 0;
  for (const nex of nexValues) {
    const current = NEX_PROGRESSION[nex as keyof typeof NEX_PROGRESSION]?.abilityChoices ?? 0;
    if (current > prevChoices) {
      milestones.push(nex);
      prevChoices = current;
    }
  }
  
  return milestones;
}

/**
 * Verifica se um NEX específico oferece escolha de poder
 * @param targetNex - O NEX alvo para verificar
 * @returns true se este NEX oferece uma escolha de poder
 */
export function isValidPowerChoiceNex(targetNex: number): boolean {
  return getPowerChoiceMilestones().includes(targetNex);
}

/**
 * Obtém as oportunidades de Transcender para um personagem
 * Funciona para TODAS as classes (Combatente, Especialista, Ocultista)
 * 
 * @param currentNex - NEX atual do personagem
 * @returns Lista de oportunidades de escolha até o NEX atual
 */
export function getTranscenderOpportunities(currentNex: number): { nex: number; source: string }[] {
  const milestones = getPowerChoiceMilestones();
  
  return milestones
    .filter(nex => nex <= currentNex)
    .map(nex => ({
      nex,
      source: `Poder de Classe NEX ${nex}%`,
    }));
}

/**
 * Verifica se existe um slot aberto para escolha em um NEX específico
 * Consulta o banco para ver se já existe escolha resolvida para aquele NEX
 * 
 * @param characterId - ID do personagem
 * @param targetNex - NEX alvo
 * @returns Objeto com status do slot e ID da escolha existente (se houver)
 */
export async function hasOpenSlotForNex(
  characterId: string,
  targetNex: number
): Promise<{
  hasSlot: boolean;
  isOpen: boolean;
  existingChoiceId?: string;
  reason?: string;
}> {
  // 1. Verificar se este NEX oferece escolha de poder
  if (!isValidPowerChoiceNex(targetNex)) {
    return {
      hasSlot: false,
      isOpen: false,
      reason: `NEX ${targetNex}% não oferece escolha de poder.`,
    };
  }
  
  // 2. Buscar escolhas existentes para este NEX
  const { data: existingChoices, error } = await supabase
    .from('character_power_choices')
    .select('id, status, choice_type')
    .eq('character_id', characterId)
    .eq('nex', targetNex);
  
  if (error) {
    console.error('Erro ao verificar slots de escolha:', error);
    return {
      hasSlot: true,
      isOpen: false,
      reason: 'Erro ao verificar escolhas anteriores.',
    };
  }
  
  // 3. Se não há escolhas, o slot está aberto
  if (!existingChoices || existingChoices.length === 0) {
    return {
      hasSlot: true,
      isOpen: true,
    };
  }
  
  // 4. Verificar se alguma escolha está resolvida (slot usado)
  const resolvedChoice = existingChoices.find(c => c.status === 'resolved');
  if (resolvedChoice) {
    return {
      hasSlot: true,
      isOpen: false,
      existingChoiceId: resolvedChoice.id,
      reason: `Escolha do NEX ${targetNex}% já utilizada.`,
    };
  }
  
  // 5. Existe escolha em aberto (pode continuar)
  const openChoice = existingChoices.find(c => c.status === 'open');
  return {
    hasSlot: true,
    isOpen: true,
    existingChoiceId: openChoice?.id,
  };
}

/**
 * Verifica se o personagem pode usar Transcender em um determinado NEX
 * Funciona para TODAS as classes
 * 
 * @param characterId - ID do personagem
 * @param userId - ID do usuário
 * @param targetNex - NEX alvo (o NEX para o qual está subindo)
 * @returns Objeto com elegibilidade e razão/ID da escolha existente
 */
export async function canUseTranscender(
  characterId: string,
  userId: string,
  targetNex: number
): Promise<{
  eligible: boolean;
  reason?: string;
  existingChoiceId?: string;
}> {
  // 1. Verificar se este NEX oferece escolha de poder
  if (!isValidPowerChoiceNex(targetNex)) {
    return {
      eligible: false,
      reason: `NEX ${targetNex}% não oferece escolha de poder.`,
    };
  }
  
  // 2. Verificar status do slot
  const slotStatus = await hasOpenSlotForNex(characterId, targetNex);
  
  if (!slotStatus.hasSlot) {
    return {
      eligible: false,
      reason: slotStatus.reason,
    };
  }
  
  if (!slotStatus.isOpen) {
    return {
      eligible: false,
      reason: slotStatus.reason,
      existingChoiceId: slotStatus.existingChoiceId,
    };
  }
  
  // 3. Slot aberto, pode usar Transcender
  return {
    eligible: true,
    existingChoiceId: slotStatus.existingChoiceId,
  };
}

/**
 * Calcula o ganho de Sanidade que seria recebido em um NEX
 * Este valor será "cancelado" (override) ao usar Transcender
 * 
 * @param characterClass - Classe do personagem
 * @param currentNex - NEX atual
 * @param targetNex - NEX alvo
 * @returns Ganho de sanidade que seria perdido
 */
export function calculateTranscenderSanityCost(
  characterClass: string,
  currentNex: number,
  targetNex: number
): number {
  const classData = getClassSanityProgression(characterClass);
  if (!classData) return 0;
  
  // Calcular diferença de SAN entre NEX atual e próximo
  const currentSan = classData.sanBase + (Math.floor(currentNex / 5) - 1) * classData.sanPerNex;
  const nextSan = classData.sanBase + (Math.floor(targetNex / 5) - 1) * classData.sanPerNex;
  
  return Math.max(0, nextSan - currentSan);
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
    .maybeSingle();
  
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
      sanity_delta: -sanityCost, // Negativo pois é perda (override do ganho)
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
 * Reverte uma escolha de Transcender
 * Só permite reverter se o personagem ainda está no mesmo NEX da escolha
 * 
 * @param choiceId - ID da escolha a reverter
 * @param characterId - ID do personagem
 * @param currentNex - NEX atual do personagem
 * @returns Objeto com sucesso e erro se houver
 */
export async function revertTranscenderChoice(
  choiceId: string,
  characterId: string,
  currentNex: number
): Promise<{ 
  success: boolean; 
  error?: string;
  revertedPowerId?: string;
  sanityCostRestored?: number;
}> {
  // 1. Buscar a escolha existente
  const { data: choice, error: fetchError } = await supabase
    .from('character_power_choices')
    .select('*')
    .eq('id', choiceId)
    .eq('character_id', characterId)
    .single();
  
  if (fetchError || !choice) {
    console.error('Erro ao buscar escolha para reverter:', fetchError);
    return { success: false, error: 'Escolha não encontrada.' };
  }
  
  // 2. Verificar se a escolha está resolvida
  if (choice.status !== 'resolved') {
    return { success: false, error: 'Esta escolha ainda não foi finalizada.' };
  }
  
  // 3. Verificar se o personagem ainda está no mesmo NEX
  // Permite reverter apenas se o NEX atual é igual ou menor que o NEX da escolha
  if (currentNex > choice.nex) {
    return { 
      success: false, 
      error: `Não é possível reverter. Você já progrediu além do NEX ${choice.nex}%.` 
    };
  }
  
  // 4. Extrair dados da resolução para retornar
  const resolution = choice.resolution as any;
  const revertedPowerId = resolution?.powerId;
  const sanityCostRestored = Math.abs(choice.sanity_delta || 0);
  
  // 5. Deletar a escolha do banco
  const { error: deleteError } = await supabase
    .from('character_power_choices')
    .delete()
    .eq('id', choiceId);
  
  if (deleteError) {
    console.error('Erro ao reverter escolha de Transcender:', deleteError);
    return { success: false, error: deleteError.message };
  }
  
  return { 
    success: true, 
    revertedPowerId,
    sanityCostRestored,
  };
}

/**
 * Obtém o histórico detalhado de escolhas de Transcender de um personagem
 * com informações sobre se cada escolha pode ser revertida
 */
export async function getTranscenderHistory(
  characterId: string,
  currentNex: number
): Promise<{
  choices: Array<{
    id: string;
    nex: number;
    powerId: string;
    powerName: string;
    sanityCost: number;
    resolvedAt: string;
    canRevert: boolean;
    revertBlockedReason?: string;
  }>;
}> {
  const choices = await getCharacterPowerChoices(characterId);
  
  const transcenderChoices = choices
    .filter(c => c.choice_type === 'transcender' && c.status === 'resolved')
    .map(c => {
      const resolution = c.resolution as any;
      const canRevert = currentNex <= c.nex;
      
      return {
        id: c.id,
        nex: c.nex,
        powerId: resolution?.powerId || '',
        powerName: resolution?.powerName || 'Poder desconhecido',
        sanityCost: Math.abs(c.sanity_delta || 0),
        resolvedAt: c.resolved_at || c.created_at,
        canRevert,
        revertBlockedReason: canRevert 
          ? undefined 
          : `Você já progrediu além do NEX ${c.nex}%`,
      };
    });
  
  return { choices: transcenderChoices };
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
 * Funciona para TODAS as classes
 * 
 * @param characterId - ID do personagem
 * @param currentNex - NEX atual do personagem
 * @returns Oportunidades disponíveis, usadas e contagens
 */
export async function getTranscenderStatus(
  characterId: string,
  currentNex: number
): Promise<{
  opportunities: ChoiceOpportunity[];
  usedCount: number;
  availableCount: number;
}> {
  const rawOpportunities = getTranscenderOpportunities(currentNex);
  const choices = await getCharacterPowerChoices(characterId);
  
  const opportunities: ChoiceOpportunity[] = rawOpportunities.map(opp => {
    // Verificar se existe escolha (Transcender ou outro poder) para este NEX
    const existingChoice = choices.find(c => c.nex === opp.nex);
    
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
