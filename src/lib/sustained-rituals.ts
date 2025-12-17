/**
 * Ordem Paranormal RPG - Sistema de Rituais Sustentados
 * Gerencia rituais ativos com custo por turno e concentração
 */

import { SustainConfig } from './ritual-effects';
import { 
  registerRitualHooks, 
  unregisterRitualHooks, 
  getHooksForCharacter,
  type ActiveRitualHook 
} from './ritual-hooks-engine';

// ========================================
// INTERFACES
// ========================================

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
