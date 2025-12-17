/**
 * Ordem Paranormal RPG - Motor de Execução de Hooks de Rituais
 * Sistema para registrar, gerenciar e disparar hooks de rituais ativos
 */

import { Hook, HookTrigger, RitualEffect, getActiveRitualEffect } from './ritual-effects';

// ========================================
// TIPOS DE DANO E DETECÇÃO
// ========================================

export type DamageCategory = 
  | 'physical'      // Corte, Impacto, Perfuração
  | 'ballistic'     // Balístico (armas de fogo, projéteis)
  | 'elemental'     // Fogo, Frio, Eletricidade, Químico
  | 'paranormal'    // Energia, Conhecimento, Sangue, Morte, Medo
  | 'fall'          // Queda
  | 'environmental' // Ambiente (afogamento, sufocamento)
  | 'unknown';

export interface DamageInfo {
  amount: number;
  type: string;
  category: DamageCategory;
  source?: string;
  isProjectile: boolean;
  isFall: boolean;
  isMelee: boolean;
  isRanged: boolean;
  element?: string;
}

// Mapeamento de tipos de dano para categorias
const DAMAGE_TYPE_CATEGORIES: Record<string, DamageCategory> = {
  // Físico
  'corte': 'physical',
  'impacto': 'physical',
  'perfuração': 'physical',
  'contusão': 'physical',
  
  // Balístico
  'balístico': 'ballistic',
  'balistico': 'ballistic',
  'projétil': 'ballistic',
  'projetil': 'ballistic',
  'tiro': 'ballistic',
  
  // Elemental
  'fogo': 'elemental',
  'frio': 'elemental',
  'eletricidade': 'elemental',
  'químico': 'elemental',
  'quimico': 'elemental',
  'ácido': 'elemental',
  'acido': 'elemental',
  
  // Paranormal
  'energia': 'paranormal',
  'conhecimento': 'paranormal',
  'sangue': 'paranormal',
  'morte': 'paranormal',
  'medo': 'paranormal',
  
  // Queda
  'queda': 'fall',
  
  // Ambiente
  'afogamento': 'environmental',
  'sufocamento': 'environmental',
};

// Palavras-chave que indicam projétil
const PROJECTILE_KEYWORDS = [
  'balístico', 'balistico', 'projétil', 'projetil', 'tiro',
  'bala', 'flecha', 'dardo', 'arremesso', 'lançado',
  'arma de fogo', 'pistola', 'rifle', 'espingarda'
];

// Palavras-chave que indicam dano de queda
const FALL_KEYWORDS = ['queda', 'caiu', 'precipício', 'altura'];

/**
 * Detecta automaticamente informações do dano baseado no tipo e contexto
 */
export function detectDamageInfo(
  amount: number,
  damageType?: string,
  source?: string
): DamageInfo {
  const typeLower = (damageType || '').toLowerCase();
  const sourceLower = (source || '').toLowerCase();
  
  // Detecta categoria
  let category: DamageCategory = 'unknown';
  for (const [key, cat] of Object.entries(DAMAGE_TYPE_CATEGORIES)) {
    if (typeLower.includes(key)) {
      category = cat;
      break;
    }
  }
  
  // Detecta se é projétil
  const isProjectile = PROJECTILE_KEYWORDS.some(kw => 
    typeLower.includes(kw) || sourceLower.includes(kw)
  );
  
  // Detecta se é queda
  const isFall = FALL_KEYWORDS.some(kw => 
    typeLower.includes(kw) || sourceLower.includes(kw)
  ) || category === 'fall';
  
  // Detecta corpo a corpo vs distância
  const isRanged = isProjectile || sourceLower.includes('distância') || 
                   sourceLower.includes('arremesso');
  const isMelee = !isRanged && (category === 'physical' || 
                  sourceLower.includes('corpo a corpo'));
  
  // Detecta elemento paranormal
  let element: string | undefined;
  if (category === 'paranormal') {
    const elements = ['energia', 'conhecimento', 'sangue', 'morte', 'medo'];
    element = elements.find(e => typeLower.includes(e));
  }
  
  return {
    amount,
    type: damageType || 'desconhecido',
    category,
    source,
    isProjectile,
    isFall,
    isMelee,
    isRanged,
    element,
  };
}

/**
 * Determina quais triggers específicos devem ser disparados
 */
export function getTriggersForDamage(damageInfo: DamageInfo): HookTrigger[] {
  const triggers: HookTrigger[] = ['onPreDamage'];
  
  if (damageInfo.isFall) {
    triggers.push('onFallDamage');
  }
  
  if (damageInfo.isProjectile) {
    triggers.push('onProjectileHit');
  }
  
  return triggers;
}

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
  damageInfo?: DamageInfo; // Info completa do dano
  targetId?: string;
  sourceId?: string;
  weaponName?: string;
  
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
  triggeredBy?: HookTrigger;
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
// LOG DE EXECUÇÃO DE HOOKS
// ========================================

export interface HookExecutionLogEntry {
  id: string;
  timestamp: number;
  trigger: HookTrigger;
  triggers: HookTrigger[]; // Todos os triggers verificados
  damageInfo?: DamageInfo;
  originalDamage?: number;
  finalDamage?: number;
  blocked: boolean;
  results: HookExecutionResult[];
  targetId?: string;
  messages: string[];
}

let executionLog: HookExecutionLogEntry[] = [];
let logIdCounter = 0;

/**
 * Retorna o log de execução de hooks
 */
export function getExecutionLog(): HookExecutionLogEntry[] {
  return [...executionLog];
}

/**
 * Limpa o log de execução
 */
export function clearExecutionLog(): void {
  executionLog = [];
}

/**
 * Adiciona uma entrada ao log
 */
function addLogEntry(entry: Omit<HookExecutionLogEntry, 'id' | 'timestamp'>): HookExecutionLogEntry {
  logIdCounter++;
  const logEntry: HookExecutionLogEntry = {
    ...entry,
    id: `log_${logIdCounter}_${Date.now()}`,
    timestamp: Date.now(),
  };
  executionLog.push(logEntry);
  
  // Mantém apenas as últimas 100 entradas
  if (executionLog.length > 100) {
    executionLog = executionLog.slice(-100);
  }
  
  return logEntry;
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
      results.push({ ...result, triggeredBy: context.trigger });
    }
  }
  
  return results;
}

/**
 * Dispara hooks para um evento de dano com detecção automática
 * Esta é a função principal para uso externo
 */
export function executeHooksForDamage(
  targetId: string,
  damageAmount: number,
  damageType?: string,
  damageSource?: string,
  additionalContext?: Partial<HookExecutionContext>
): { 
  results: HookExecutionResult[];
  finalDamage: number;
  blocked: boolean;
  messages: string[];
  logEntry: HookExecutionLogEntry;
} {
  // Detecta informações do dano
  const damageInfo = detectDamageInfo(damageAmount, damageType, damageSource);
  
  // Determina quais triggers disparar
  const triggers = getTriggersForDamage(damageInfo);
  
  const allResults: HookExecutionResult[] = [];
  const messages: string[] = [];
  let currentDamage = damageAmount;
  let blocked = false;
  
  // Executa hooks para cada trigger relevante em ordem de especificidade
  // (triggers específicos primeiro, depois genéricos)
  const orderedTriggers = triggers.sort((a, b) => {
    // onFallDamage e onProjectileHit são mais específicos
    const specificTriggers: HookTrigger[] = ['onFallDamage', 'onProjectileHit'];
    const aSpecific = specificTriggers.includes(a) ? 0 : 1;
    const bSpecific = specificTriggers.includes(b) ? 0 : 1;
    return aSpecific - bSpecific;
  });
  
  for (const trigger of orderedTriggers) {
    if (blocked) break; // Se já foi bloqueado, não precisa continuar
    
    const context: HookExecutionContext = {
      trigger,
      damageAmount: currentDamage,
      damageType,
      damageInfo,
      targetId,
      ...additionalContext,
    };
    
    const results = executeHooks(context);
    allResults.push(...results);
    
    // Processa modificações
    for (const result of results) {
      if (result.modifications?.blockDamage) {
        blocked = true;
        currentDamage = 0;
        messages.push(`🛡️ ${result.ritualName}: ${result.modifications.message || 'Dano bloqueado!'}`);
      } else if (result.modifications?.newDamageAmount !== undefined) {
        const oldDamage = currentDamage;
        currentDamage = result.modifications.newDamageAmount;
        messages.push(`🛡️ ${result.ritualName}: Dano ${oldDamage} → ${currentDamage}`);
      } else if (result.modifications?.message) {
        messages.push(`⚡ ${result.ritualName}: ${result.modifications.message}`);
      }
    }
  }
  
  // Registra no log
  const logEntry = addLogEntry({
    trigger: orderedTriggers[0] || 'onPreDamage',
    triggers: orderedTriggers,
    damageInfo,
    originalDamage: damageAmount,
    finalDamage: currentDamage,
    blocked,
    results: allResults,
    targetId,
    messages,
  });
  
  return {
    results: allResults,
    finalDamage: currentDamage,
    blocked,
    messages,
    logEntry,
  };
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
  const damageInfo = context.damageInfo;
  
  // Condições baseadas em tipo de dano (usando DamageInfo se disponível)
  if (conditionLower.includes('dano não é de medo')) {
    if (damageInfo) return damageInfo.element !== 'medo';
    return context.damageType?.toLowerCase() !== 'medo';
  }
  
  if (conditionLower.includes('dano de queda')) {
    if (damageInfo) return damageInfo.isFall;
    return context.damageType?.toLowerCase() === 'queda';
  }
  
  if (conditionLower.includes('projétil') || conditionLower.includes('projetil')) {
    if (damageInfo) return damageInfo.isProjectile;
    return context.damageType?.toLowerCase().includes('balístico') ||
           context.damageType?.toLowerCase().includes('perfuração');
  }
  
  if (conditionLower.includes('corpo a corpo') || conditionLower.includes('melee')) {
    if (damageInfo) return damageInfo.isMelee;
    return context.damageType?.toLowerCase().includes('corte') ||
           context.damageType?.toLowerCase().includes('impacto');
  }
  
  if (conditionLower.includes('distância') || conditionLower.includes('ranged')) {
    if (damageInfo) return damageInfo.isRanged;
    return false;
  }
  
  // Condições baseadas em categoria
  if (conditionLower.includes('dano físico')) {
    if (damageInfo) return damageInfo.category === 'physical';
    return false;
  }
  
  if (conditionLower.includes('dano paranormal') || conditionLower.includes('dano de elemento')) {
    if (damageInfo) return damageInfo.category === 'paranormal';
    return false;
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
 * Processa hooks de interceptação (Desacelerar Impacto, Armadura de Sangue)
 */
function processInterceptorHook(
  hook: Hook,
  context: HookExecutionContext
): HookExecutionResult['modifications'] {
  const effectLower = hook.effect.toLowerCase();
  const damageInfo = context.damageInfo;
  
  // ===== DANO DE QUEDA (onFallDamage) =====
  if (context.trigger === 'onFallDamage') {
    // Ignora completamente
    if (effectLower.includes('ignora') || effectLower.includes('imune')) {
      return {
        blockDamage: true,
        newDamageAmount: 0,
        message: 'Dano de queda ignorado (ritual ativo)!',
      };
    }
    
    // Reduz pela metade
    if (effectLower.includes('metade') && context.damageAmount) {
      return {
        newDamageAmount: Math.floor(context.damageAmount / 2),
        message: 'Dano de queda reduzido pela metade!',
      };
    }
    
    // Redução fixa
    const reductionMatch = hook.effect.match(/reduz?\s*(\d+)/i);
    if (reductionMatch && context.damageAmount) {
      const reduction = parseInt(reductionMatch[1]);
      return {
        damageModifier: -reduction,
        newDamageAmount: Math.max(0, context.damageAmount - reduction),
        message: `Dano de queda reduzido em ${reduction}!`,
      };
    }
  }
  
  // ===== PROJÉTEIS (onProjectileHit) =====
  if (context.trigger === 'onProjectileHit') {
    // Bloqueia completamente
    if (effectLower.includes('bloqueia') || effectLower.includes('desvia')) {
      return {
        blockDamage: true,
        newDamageAmount: 0,
        message: 'Projétil bloqueado/desviado!',
      };
    }
    
    // RD contra projéteis
    const rdMatch = hook.effect.match(/rd\s*(\d+)/i) || hook.effect.match(/(\d+)\s*de\s*rd/i);
    if (rdMatch && context.damageAmount) {
      const rd = parseInt(rdMatch[1]);
      return {
        damageModifier: -rd,
        newDamageAmount: Math.max(0, context.damageAmount - rd),
        message: `RD ${rd} contra projéteis aplicada!`,
      };
    }
    
    // Redução percentual
    if (effectLower.includes('metade') && context.damageAmount) {
      return {
        newDamageAmount: Math.floor(context.damageAmount / 2),
        message: 'Dano de projétil reduzido pela metade!',
      };
    }
  }
  
  // Processamento genérico baseado no tipo de dano detectado
  if (damageInfo) {
    // Verificações baseadas na categoria
    if (damageInfo.category === 'ballistic' && effectLower.includes('balístico')) {
      const rdMatch = hook.effect.match(/rd\s*(\d+)/i);
      if (rdMatch && context.damageAmount) {
        const rd = parseInt(rdMatch[1]);
        return {
          damageModifier: -rd,
          newDamageAmount: Math.max(0, context.damageAmount - rd),
          message: `RD ${rd} contra dano balístico!`,
        };
      }
    }
    
    if (damageInfo.element && effectLower.includes(damageInfo.element)) {
      // Resistência elemental específica
      if (effectLower.includes('imune') || effectLower.includes('ignora')) {
        return {
          blockDamage: true,
          newDamageAmount: 0,
          message: `Imune a dano de ${damageInfo.element}!`,
        };
      }
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
