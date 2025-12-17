/**
 * Ordem Paranormal RPG - Motor de Execução de Hooks de Rituais
 * Sistema para registrar, gerenciar e disparar hooks de rituais ativos
 */

import { Hook, HookTrigger, RitualEffect, getActiveRitualEffect } from './ritual-effects';

// ========================================
// INTERFACES
// ========================================

export interface ActiveRitualHook {
  hookId: string;
  ritualId: string;
  ritualName: string;
  casterId: string;
  hook: Hook;
  expiresAt?: number; // Rodada em que expira
  usesRemaining?: number; // Para hooks com limite de uso
}

export interface HookExecutionContext {
  // Contexto do evento
  trigger: HookTrigger;
  round?: number;
  
  // Dados do evento
  rollResult?: number;
  rollType?: string;
  damageAmount?: number;
  damageType?: string;
  targetId?: string;
  sourceId?: string;
  
  // Estado do personagem
  currentHP?: number;
  currentPE?: number;
  currentSAN?: number;
}

export interface HookExecutionResult {
  hookId: string;
  ritualName: string;
  effect: string;
  applied: boolean;
  modifications?: {
    rollModifier?: number;
    damageModifier?: number;
    blockDamage?: boolean;
    preventDeath?: boolean;
    newDamageAmount?: number;
    message?: string;
  };
}

// ========================================
// ESTADO GLOBAL DE HOOKS ATIVOS
// ========================================

let activeHooks: ActiveRitualHook[] = [];
let hookIdCounter = 0;

// ========================================
// FUNÇÕES DE GERENCIAMENTO
// ========================================

/**
 * Gera um ID único para o hook
 */
function generateHookId(): string {
  hookIdCounter++;
  return `hook_${hookIdCounter}_${Date.now()}`;
}

/**
 * Registra hooks de um ritual conjurado
 */
export function registerRitualHooks(
  ritualId: string,
  ritualName: string,
  casterId: string,
  selectedEnhancements: string[],
  currentRound: number = 0,
  duration?: number
): ActiveRitualHook[] {
  const effect = getActiveRitualEffect(ritualId, selectedEnhancements);
  if (!effect?.hooks || effect.hooks.length === 0) return [];

  const registeredHooks: ActiveRitualHook[] = effect.hooks.map(hook => ({
    hookId: generateHookId(),
    ritualId,
    ritualName,
    casterId,
    hook,
    expiresAt: duration ? currentRound + duration : undefined,
  }));

  activeHooks = [...activeHooks, ...registeredHooks];
  return registeredHooks;
}

/**
 * Remove todos os hooks de um ritual específico
 */
export function unregisterRitualHooks(ritualId: string, casterId?: string): void {
  activeHooks = activeHooks.filter(h => {
    if (casterId) {
      return !(h.ritualId === ritualId && h.casterId === casterId);
    }
    return h.ritualId !== ritualId;
  });
}

/**
 * Remove um hook específico por ID
 */
export function unregisterHookById(hookId: string): void {
  activeHooks = activeHooks.filter(h => h.hookId !== hookId);
}

/**
 * Remove hooks expirados
 */
export function cleanupExpiredHooks(currentRound: number): ActiveRitualHook[] {
  const expired = activeHooks.filter(h => h.expiresAt !== undefined && h.expiresAt <= currentRound);
  activeHooks = activeHooks.filter(h => h.expiresAt === undefined || h.expiresAt > currentRound);
  return expired;
}

/**
 * Retorna todos os hooks ativos
 */
export function getActiveHooks(): ActiveRitualHook[] {
  return [...activeHooks];
}

/**
 * Retorna hooks ativos de um personagem específico
 */
export function getHooksForCharacter(casterId: string): ActiveRitualHook[] {
  return activeHooks.filter(h => h.casterId === casterId);
}

/**
 * Limpa todos os hooks ativos
 */
export function clearAllHooks(): void {
  activeHooks = [];
}

// ========================================
// EXECUÇÃO DE HOOKS
// ========================================

/**
 * Dispara todos os hooks que correspondem ao trigger
 */
export function executeHooks(context: HookExecutionContext): HookExecutionResult[] {
  const results: HookExecutionResult[] = [];
  
  // Filtra hooks que correspondem ao trigger
  const relevantHooks = activeHooks.filter(h => h.hook.trigger === context.trigger);
  
  // Ordena por prioridade (maior primeiro)
  const sortedHooks = relevantHooks.sort((a, b) => 
    (b.hook.priority || 0) - (a.hook.priority || 0)
  );
  
  for (const activeHook of sortedHooks) {
    const result = executeSingleHook(activeHook, context);
    if (result.applied) {
      results.push(result);
    }
  }
  
  return results;
}

/**
 * Executa um hook específico
 */
function executeSingleHook(
  activeHook: ActiveRitualHook,
  context: HookExecutionContext
): HookExecutionResult {
  const { hook, ritualName, hookId } = activeHook;
  
  // Verifica condição se existir
  if (hook.condition && !evaluateCondition(hook.condition, context)) {
    return {
      hookId,
      ritualName,
      effect: hook.effect,
      applied: false,
    };
  }
  
  // Processa o efeito baseado no trigger
  const modifications = processHookEffect(hook, context);
  
  return {
    hookId,
    ritualName,
    effect: hook.effect,
    applied: true,
    modifications,
  };
}

/**
 * Avalia uma condição do hook
 */
function evaluateCondition(condition: string, context: HookExecutionContext): boolean {
  const conditionLower = condition.toLowerCase();
  
  // Condições baseadas em tipo de dano
  if (conditionLower.includes('dano não é de medo')) {
    return context.damageType?.toLowerCase() !== 'medo';
  }
  
  if (conditionLower.includes('dano de queda')) {
    return context.damageType?.toLowerCase() === 'queda';
  }
  
  if (conditionLower.includes('projétil')) {
    return context.damageType?.toLowerCase().includes('balístico') ||
           context.damageType?.toLowerCase().includes('perfuração');
  }
  
  // Condições baseadas em teste
  if (conditionLower.includes('teste de')) {
    return context.rollType !== undefined;
  }
  
  // Por padrão, considera a condição satisfeita
  return true;
}

/**
 * Processa o efeito de um hook e retorna modificações
 */
function processHookEffect(
  hook: Hook,
  context: HookExecutionContext
): HookExecutionResult['modifications'] {
  const effectLower = hook.effect.toLowerCase();
  
  switch (hook.trigger) {
    case 'onRoll':
      return processRollHook(hook, context);
      
    case 'onPreDamage':
      return processPreDamageHook(hook, context);
      
    case 'onFallDamage':
    case 'onProjectileHit':
      return processInterceptorHook(hook, context);
      
    case 'onReduceHP':
      return processReduceHPHook(hook, context);
      
    case 'onDeath':
      return processDeathHook(hook, context);
      
    case 'onTurnStart':
    case 'onTurnEnd':
      return processTurnHook(hook, context);
      
    default:
      return { message: hook.effect };
  }
}

/**
 * Processa hooks de rolagem (Alterar Destino)
 */
function processRollHook(
  hook: Hook,
  context: HookExecutionContext
): HookExecutionResult['modifications'] {
  const effectLower = hook.effect.toLowerCase();
  
  // Alterar Destino - permite rerolar
  if (effectLower.includes('rolar novamente') || effectLower.includes('rerola')) {
    return {
      message: `${hook.effect}. Role novamente e escolha o resultado.`,
    };
  }
  
  // Bônus numérico em teste
  const bonusMatch = hook.effect.match(/([+-]\d+)/);
  if (bonusMatch) {
    return {
      rollModifier: parseInt(bonusMatch[1]),
      message: `Modificador de teste: ${bonusMatch[1]}`,
    };
  }
  
  return { message: hook.effect };
}

/**
 * Processa hooks de pré-dano (Tela de Ruído)
 */
function processPreDamageHook(
  hook: Hook,
  context: HookExecutionContext
): HookExecutionResult['modifications'] {
  const effectLower = hook.effect.toLowerCase();
  
  // Bloqueio total de dano
  if (effectLower.includes('bloqueia') || effectLower.includes('anula dano')) {
    return {
      blockDamage: true,
      newDamageAmount: 0,
      message: 'Dano bloqueado completamente!',
    };
  }
  
  // Redução de dano
  const reductionMatch = hook.effect.match(/reduz?\s*(\d+)/i);
  if (reductionMatch && context.damageAmount) {
    const reduction = parseInt(reductionMatch[1]);
    const newDamage = Math.max(0, context.damageAmount - reduction);
    return {
      damageModifier: -reduction,
      newDamageAmount: newDamage,
      message: `Dano reduzido em ${reduction}!`,
    };
  }
  
  // Metade do dano
  if (effectLower.includes('metade') && context.damageAmount) {
    const newDamage = Math.floor(context.damageAmount / 2);
    return {
      newDamageAmount: newDamage,
      message: 'Dano reduzido pela metade!',
    };
  }
  
  return { message: hook.effect };
}

/**
 * Processa hooks de interceptação (Desacelerar Impacto)
 */
function processInterceptorHook(
  hook: Hook,
  context: HookExecutionContext
): HookExecutionResult['modifications'] {
  const effectLower = hook.effect.toLowerCase();
  
  // Anula dano de queda
  if (context.trigger === 'onFallDamage' && effectLower.includes('ignora')) {
    return {
      blockDamage: true,
      newDamageAmount: 0,
      message: 'Dano de queda ignorado!',
    };
  }
  
  // Redução de dano de projétil
  if (context.trigger === 'onProjectileHit') {
    const reductionMatch = hook.effect.match(/(\d+)\s*de\s*rd/i);
    if (reductionMatch && context.damageAmount) {
      const reduction = parseInt(reductionMatch[1]);
      return {
        damageModifier: -reduction,
        newDamageAmount: Math.max(0, context.damageAmount - reduction),
        message: `RD ${reduction} contra projéteis!`,
      };
    }
  }
  
  return { message: hook.effect };
}

/**
 * Processa hooks de redução de HP (Medo Tangível)
 */
function processReduceHPHook(
  hook: Hook,
  context: HookExecutionContext
): HookExecutionResult['modifications'] {
  const effectLower = hook.effect.toLowerCase();
  
  // Não reduz abaixo de 1 PV
  if (effectLower.includes('não reduz abaixo de 1') || effectLower.includes('mínimo 1')) {
    if (context.currentHP !== undefined && context.damageAmount !== undefined) {
      const potentialHP = context.currentHP - context.damageAmount;
      if (potentialHP < 1) {
        return {
          newDamageAmount: Math.max(0, context.currentHP - 1),
          message: 'HP não pode ser reduzido abaixo de 1 (Medo Tangível)!',
          preventDeath: true,
        };
      }
    }
  }
  
  return { message: hook.effect };
}

/**
 * Processa hooks de morte (Vínculo de Sangue)
 */
function processDeathHook(
  hook: Hook,
  context: HookExecutionContext
): HookExecutionResult['modifications'] {
  const effectLower = hook.effect.toLowerCase();
  
  // Previne morte
  if (effectLower.includes('não morre') || effectLower.includes('sobrevive')) {
    return {
      preventDeath: true,
      message: 'Morte prevenida pelo ritual!',
    };
  }
  
  return { message: hook.effect };
}

/**
 * Processa hooks de turno
 */
function processTurnHook(
  hook: Hook,
  context: HookExecutionContext
): HookExecutionResult['modifications'] {
  return {
    message: hook.effect,
  };
}

// ========================================
// HELPERS PARA INTEGRAÇÃO COM UI
// ========================================

/**
 * Retorna descrição amigável do trigger
 */
export function getTriggerLabel(trigger: HookTrigger): string {
  const labels: Record<HookTrigger, string> = {
    onRoll: 'Ao rolar dado',
    onPreDamage: 'Antes de receber dano',
    onPostDamage: 'Após receber dano',
    onFallDamage: 'Ao sofrer dano de queda',
    onProjectileHit: 'Ao ser atingido por projétil',
    onReduceHP: 'Ao ter PV reduzido',
    onTurnStart: 'Início do turno',
    onTurnEnd: 'Fim do turno',
    onDeath: 'Ao morrer',
    onCast: 'Ao conjurar',
    onConcentrationBreak: 'Ao perder concentração',
  };
  return labels[trigger] || trigger;
}

/**
 * Retorna ícone sugerido para o trigger
 */
export function getTriggerIcon(trigger: HookTrigger): string {
  const icons: Record<HookTrigger, string> = {
    onRoll: '🎲',
    onPreDamage: '🛡️',
    onPostDamage: '💥',
    onFallDamage: '⬇️',
    onProjectileHit: '🎯',
    onReduceHP: '❤️',
    onTurnStart: '▶️',
    onTurnEnd: '⏹️',
    onDeath: '💀',
    onCast: '✨',
    onConcentrationBreak: '💔',
  };
  return icons[trigger] || '⚡';
}
