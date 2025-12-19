/**
 * Ordem Paranormal RPG - Sistema de Rituais Sustentados
 * Gerencia rituais ativos com custo por turno e concentração
 */

import { SustainConfig } from './rituals/legacy-exports';
import { 
  registerRitualHooks, 
  unregisterRitualHooks, 
  getHooksForCharacter,
  type ActiveRitualHook 
} from './ritual-hooks-engine';

// ========================================
// INTERFACES
// ========================================

/**
 * Modo ativo de um ritual (para rituais com modos como Velocidade Mortal)
 */
export interface RitualModeState {
  modeName: string;
  targetId?: string;        // ID do alvo (para modo inverso, quem está protegido)
  targetName?: string;      // Nome do alvo
  appliedConditions: string[]; // Condições aplicadas pelo modo
}

export interface SustainedRitual {
  id: string;
  ritualId: string;
  ritualName: string;
  casterId: string;
  casterName: string;
  
  // Configuração de sustentação
  sustain: SustainConfig;
  
  // Estado atual
  turnsActive: number;
  peSpentTotal: number;
  isConcentrating: boolean;
  
  // Modo ativo do ritual (para rituais com modos)
  activeMode?: RitualModeState;
  
  // Duração
  startedRound: number;
  expiresRound?: number;
  
  // Hooks registrados
  hookIds: string[];
  
  // Metadados
  element: string;
  circle: number;
  selectedEnhancements: string[];
}

export interface SustainResult {
  success: boolean;
  peSpent: number;
  message: string;
  ritualEnded?: boolean;
  endReason?: string;
}

export interface ConcentrationCheckResult {
  success: boolean;
  roll: number;
  dt: number;
  message: string;
  concentrationBroken: boolean;
}

// ========================================
// ESTADO GLOBAL
// ========================================

let sustainedRituals: SustainedRitual[] = [];
let ritualIdCounter = 0;

// ========================================
// FUNÇÕES DE GERENCIAMENTO
// ========================================

function generateRitualId(): string {
  ritualIdCounter++;
  return `sustained_${ritualIdCounter}_${Date.now()}`;
}

/**
 * Ativa um ritual sustentado
 */
export function activateSustainedRitual(
  ritualId: string,
  ritualName: string,
  casterId: string,
  casterName: string,
  sustain: SustainConfig,
  element: string,
  circle: number,
  selectedEnhancements: string[],
  currentRound: number
): SustainedRitual {
  // Registra hooks do ritual
  const hooks = registerRitualHooks(
    ritualId,
    ritualName,
    casterId,
    selectedEnhancements,
    currentRound,
    sustain.maxDuration
  );

  const sustained: SustainedRitual = {
    id: generateRitualId(),
    ritualId,
    ritualName,
    casterId,
    casterName,
    sustain,
    turnsActive: 0,
    peSpentTotal: 0,
    isConcentrating: sustain.concentration || false,
    startedRound: currentRound,
    expiresRound: sustain.maxDuration ? currentRound + sustain.maxDuration : undefined,
    hookIds: hooks.map(h => h.hookId),
    element,
    circle,
    selectedEnhancements,
  };

  sustainedRituals = [...sustainedRituals, sustained];
  return sustained;
}

/**
 * Desativa um ritual sustentado
 */
export function deactivateSustainedRitual(sustainedId: string, reason?: string): SustainedRitual | null {
  const ritual = sustainedRituals.find(r => r.id === sustainedId);
  if (!ritual) return null;

  // Remove hooks do ritual
  unregisterRitualHooks(ritual.ritualId, ritual.casterId);
  
  // Remove da lista
  sustainedRituals = sustainedRituals.filter(r => r.id !== sustainedId);
  
  return ritual;
}

/**
 * Processa início de turno para rituais sustentados
 */
export function processSustainedRitualsOnTurnStart(
  casterId: string,
  currentRound: number,
  currentPE: number
): { 
  results: SustainResult[]; 
  totalPECost: number;
  endedRituals: SustainedRitual[];
} {
  const results: SustainResult[] = [];
  const endedRituals: SustainedRitual[] = [];
  let totalPECost = 0;

  const casterRituals = sustainedRituals.filter(r => r.casterId === casterId);

  for (const ritual of casterRituals) {
    ritual.turnsActive++;
    
    // Verifica expiração
    if (ritual.expiresRound && currentRound >= ritual.expiresRound) {
      const ended = deactivateSustainedRitual(ritual.id, 'Duração expirada');
      if (ended) endedRituals.push(ended);
      results.push({
        success: false,
        peSpent: 0,
        message: `${ritual.ritualName} expirou.`,
        ritualEnded: true,
        endReason: 'Duração máxima atingida',
      });
      continue;
    }

    // Cobra custo de PE por turno
    const peCost = ritual.sustain.costPerTurn || 0;
    if (peCost > 0) {
      if (currentPE < peCost) {
        // PE insuficiente - ritual termina
        const ended = deactivateSustainedRitual(ritual.id, 'PE insuficiente');
        if (ended) endedRituals.push(ended);
        results.push({
          success: false,
          peSpent: 0,
          message: `${ritual.ritualName} encerrado (PE insuficiente).`,
          ritualEnded: true,
          endReason: 'PE insuficiente para sustentar',
        });
        continue;
      }

      ritual.peSpentTotal += peCost;
      totalPECost += peCost;
      currentPE -= peCost; // Atualiza para próximo ritual na cadeia

      results.push({
        success: true,
        peSpent: peCost,
        message: `${ritual.ritualName} sustentado (-${peCost} PE).`,
      });
    } else {
      results.push({
        success: true,
        peSpent: 0,
        message: `${ritual.ritualName} mantido ativo.`,
      });
    }
  }

  return { results, totalPECost, endedRituals };
}

/**
 * Testa concentração quando o conjurador sofre dano
 */
export function testConcentration(
  casterId: string,
  damageReceived: number,
  vontadeBonus: number = 0
): ConcentrationCheckResult[] {
  const results: ConcentrationCheckResult[] = [];
  const concentratingRituals = sustainedRituals.filter(
    r => r.casterId === casterId && r.isConcentrating
  );

  // DT = 10 ou metade do dano, o que for maior
  const dt = Math.max(10, Math.floor(damageReceived / 2));

  for (const ritual of concentratingRituals) {
    // Simula rolagem de Vontade
    const roll = Math.floor(Math.random() * 20) + 1 + vontadeBonus;
    const success = roll >= dt;

    if (!success) {
      // Concentração quebrada
      deactivateSustainedRitual(ritual.id, 'Concentração quebrada');
    }

    results.push({
      success,
      roll,
      dt,
      message: success 
        ? `Concentração mantida em ${ritual.ritualName} (${roll} vs DT ${dt})`
        : `Concentração quebrada em ${ritual.ritualName}! (${roll} vs DT ${dt})`,
      concentrationBroken: !success,
    });
  }

  return results;
}

/**
 * Encerra concentração voluntariamente
 */
export function dropConcentration(sustainedId: string): SustainedRitual | null {
  return deactivateSustainedRitual(sustainedId, 'Concentração encerrada voluntariamente');
}

// ========================================
// CONSULTAS
// ========================================

/**
 * Retorna todos os rituais sustentados
 */
export function getAllSustainedRituals(): SustainedRitual[] {
  return [...sustainedRituals];
}

/**
 * Retorna rituais sustentados de um personagem
 */
export function getSustainedRitualsForCharacter(casterId: string): SustainedRitual[] {
  return sustainedRituals.filter(r => r.casterId === casterId);
}

/**
 * Retorna rituais que requerem concentração
 */
export function getConcentratingRituals(casterId: string): SustainedRitual[] {
  return sustainedRituals.filter(r => r.casterId === casterId && r.isConcentrating);
}

/**
 * Verifica se um personagem está concentrando em algo
 */
export function isConcentrating(casterId: string): boolean {
  return sustainedRituals.some(r => r.casterId === casterId && r.isConcentrating);
}

/**
 * Retorna custo total de PE por turno para um personagem
 */
export function getTotalSustainCost(casterId: string): number {
  return sustainedRituals
    .filter(r => r.casterId === casterId)
    .reduce((sum, r) => sum + (r.sustain.costPerTurn || 0), 0);
}

/**
 * Limpa todos os rituais sustentados
 */
export function clearAllSustainedRituals(): void {
  // Remove todos os hooks
  for (const ritual of sustainedRituals) {
    unregisterRitualHooks(ritual.ritualId, ritual.casterId);
  }
  sustainedRituals = [];
}

// ========================================
// HELPERS DE UI
// ========================================

/**
 * Retorna label amigável para o tipo de ação de sustentação
 */
export function getSustainActionLabel(action?: SustainConfig['action']): string {
  const labels: Record<string, string> = {
    free: 'Ação Livre',
    move: 'Ação de Movimento',
    standard: 'Ação Padrão',
    full: 'Ação Completa',
  };
  return action ? labels[action] || 'Livre' : 'Livre';
}

/**
 * Retorna cor do elemento
 */
export function getElementColor(element: string): string {
  const colors: Record<string, string> = {
    sangue: 'text-red-400',
    morte: 'text-purple-400',
    energia: 'text-yellow-400',
    conhecimento: 'text-blue-400',
    medo: 'text-gray-400',
  };
  return colors[element.toLowerCase()] || 'text-muted-foreground';
}

// ========================================
// SISTEMA DE MODOS DE RITUAL
// ========================================

/**
 * Configuração de modos para rituais específicos
 * Define quais condições são aplicadas automaticamente por modo
 */
export const RITUAL_MODE_CONDITIONS: Record<string, Record<string, { 
  casterConditions: string[]; 
  targetConditions: string[];
  description: string;
}>> = {
  'velocidade-mortal': {
    'Normal': {
      casterConditions: [],
      targetConditions: ['velocidade-mortal-buff'],
      description: 'Alvo ganha ação de movimento adicional por turno.',
    },
    'Inverso': {
      casterConditions: ['velocidade-mortal-inverso'],
      targetConditions: [],
      description: 'Conjurador recebe 50% do dano que o alvo receberia.',
    },
  },
};

/**
 * Condições aplicadas pelo Discente de Velocidade Mortal
 */
export const RITUAL_ENHANCEMENT_CONDITIONS: Record<string, Record<string, {
  replacesCondition?: string;
  newCondition: string;
}>> = {
  'velocidade-mortal': {
    'Discente': {
      replacesCondition: 'velocidade-mortal-buff',
      newCondition: 'velocidade-mortal-discente',
    },
  },
};

/**
 * Define o modo ativo de um ritual sustentado
 * Retorna as condições que devem ser aplicadas/removidas
 */
export function setRitualMode(
  sustainedId: string,
  modeName: string,
  targetId?: string,
  targetName?: string
): {
  success: boolean;
  conditionsToAdd: { characterId: string; conditionId: string }[];
  conditionsToRemove: { characterId: string; conditionId: string }[];
  message: string;
} {
  const ritual = sustainedRituals.find(r => r.id === sustainedId);
  if (!ritual) {
    return {
      success: false,
      conditionsToAdd: [],
      conditionsToRemove: [],
      message: 'Ritual não encontrado.',
    };
  }

  const modeConfig = RITUAL_MODE_CONDITIONS[ritual.ritualId];
  if (!modeConfig || !modeConfig[modeName]) {
    return {
      success: false,
      conditionsToAdd: [],
      conditionsToRemove: [],
      message: `Modo "${modeName}" não disponível para este ritual.`,
    };
  }

  const conditionsToAdd: { characterId: string; conditionId: string }[] = [];
  const conditionsToRemove: { characterId: string; conditionId: string }[] = [];

  // Remove condições do modo anterior (se existir)
  if (ritual.activeMode) {
    const oldMode = modeConfig[ritual.activeMode.modeName];
    if (oldMode) {
      // Remove condições do conjurador
      for (const condId of oldMode.casterConditions) {
        conditionsToRemove.push({ characterId: ritual.casterId, conditionId: condId });
      }
      // Remove condições do alvo anterior
      if (ritual.activeMode.targetId) {
        for (const condId of oldMode.targetConditions) {
          conditionsToRemove.push({ characterId: ritual.activeMode.targetId, conditionId: condId });
        }
      }
    }
  }

  // Aplica condições do novo modo
  const newMode = modeConfig[modeName];
  
  // Condições do conjurador
  for (const condId of newMode.casterConditions) {
    conditionsToAdd.push({ characterId: ritual.casterId, conditionId: condId });
  }

  // Condições do alvo
  if (targetId) {
    // Verifica se tem aprimoramento que muda a condição
    const enhancementConfig = RITUAL_ENHANCEMENT_CONDITIONS[ritual.ritualId];
    for (let condId of newMode.targetConditions) {
      // Checa se algum enhancement substitui essa condição
      if (enhancementConfig) {
        for (const enhancement of ritual.selectedEnhancements) {
          const enhConfig = enhancementConfig[enhancement];
          if (enhConfig && enhConfig.replacesCondition === condId) {
            condId = enhConfig.newCondition;
          }
        }
      }
      conditionsToAdd.push({ characterId: targetId, conditionId: condId });
    }
  }

  // Atualiza o estado do ritual
  const ritualIndex = sustainedRituals.findIndex(r => r.id === sustainedId);
  if (ritualIndex >= 0) {
    sustainedRituals[ritualIndex] = {
      ...ritual,
      activeMode: {
        modeName,
        targetId,
        targetName,
        appliedConditions: conditionsToAdd.map(c => c.conditionId),
      },
    };
  }

  return {
    success: true,
    conditionsToAdd,
    conditionsToRemove,
    message: `Modo "${modeName}" ativado para ${ritual.ritualName}.`,
  };
}

/**
 * Retorna os modos disponíveis para um ritual
 */
export function getAvailableModesForRitual(ritualId: string): string[] {
  const modeConfig = RITUAL_MODE_CONDITIONS[ritualId];
  if (!modeConfig) return [];
  return Object.keys(modeConfig);
}

/**
 * Verifica se um ritual tem modos disponíveis
 */
export function ritualHasModes(ritualId: string): boolean {
  return !!RITUAL_MODE_CONDITIONS[ritualId];
}

/**
 * Retorna a descrição de um modo de ritual
 */
export function getRitualModeDescription(ritualId: string, modeName: string): string | null {
  const modeConfig = RITUAL_MODE_CONDITIONS[ritualId];
  if (!modeConfig || !modeConfig[modeName]) return null;
  return modeConfig[modeName].description;
}

/**
 * Calcula o dano transferido pelo modo Inverso de Velocidade Mortal
 * Retorna o dano que o conjurador deve receber (50% do dano original)
 */
export function calculateInverseDamageTransfer(
  originalDamage: number,
  ritualId: string = 'velocidade-mortal'
): { casterDamage: number; targetDamage: number } {
  // Velocidade Mortal Inverso: conjurador recebe 50% do dano
  if (ritualId === 'velocidade-mortal') {
    const casterDamage = Math.floor(originalDamage / 2);
    const targetDamage = originalDamage - casterDamage; // Alvo recebe a outra metade
    return { casterDamage, targetDamage };
  }
  
  return { casterDamage: 0, targetDamage: originalDamage };
}

/**
 * Verifica se um personagem está protegendo alguém com modo Inverso
 */
export function getInverseProtectionTarget(casterId: string): {
  targetId: string;
  targetName: string;
  ritualName: string;
} | null {
  const inverseRitual = sustainedRituals.find(
    r => r.casterId === casterId && 
         r.ritualId === 'velocidade-mortal' && 
         r.activeMode?.modeName === 'Inverso' &&
         r.activeMode?.targetId
  );
  
  if (!inverseRitual || !inverseRitual.activeMode?.targetId) return null;
  
  return {
    targetId: inverseRitual.activeMode.targetId,
    targetName: inverseRitual.activeMode.targetName || 'Alvo',
    ritualName: inverseRitual.ritualName,
  };
}

/**
 * Verifica se um personagem está sendo protegido por modo Inverso
 */
export function getInverseProtector(targetId: string): {
  casterId: string;
  casterName: string;
  ritualName: string;
} | null {
  const protectingRitual = sustainedRituals.find(
    r => r.ritualId === 'velocidade-mortal' && 
         r.activeMode?.modeName === 'Inverso' &&
         r.activeMode?.targetId === targetId
  );
  
  if (!protectingRitual) return null;
  
  return {
    casterId: protectingRitual.casterId,
    casterName: protectingRitual.casterName,
    ritualName: protectingRitual.ritualName,
  };
}
