/**
 * Funções de teste de perícia com integração SUE
 * Ordem Paranormal RPG v1.3
 * 
 * Versões avançadas que integram automaticamente os bônus
 * do Sistema Unificado de Efeitos (SUE) nas rolagens.
 */

import type {
  CharacterState,
  ActionResult,
  RollResult,
  BreakdownSource,
  AttributeKey,
  LogEvent,
} from '../types';
import { getSUEBonusesForCharacter, type SUEComputedForRulesEngine } from '../sue-bridge';

// =====================================================
// TIPOS
// =====================================================

/**
 * Contexto expandido para teste de perícia
 */
export interface SkillCheckContext {
  /** Estado completo do personagem */
  characterState: CharacterState;
  
  /** Nome da perícia (key) */
  skill: string;
  
  /** Override de atributo (ex: Conhecimento Aplicado usa INT) */
  attributeOverride?: AttributeKey;
  
  /** Dificuldade do teste (DT) */
  dt?: number;
  
  /** Modificadores manuais do jogador/mestre */
  manualModifiers?: number;
  
  /** Poderes ativados para este teste */
  activatedPowers?: string[];
}

/**
 * Resultado detalhado de teste de perícia
 */
export interface DetailedSkillCheckResult extends ActionResult {
  /** Breakdown detalhado do teste */
  skillCheckBreakdown: {
    /** Nome da perícia */
    skillName: string;
    
    /** Atributo usado */
    attribute: {
      name: string;
      key: AttributeKey;
      value: number;
    };
    
    /** Bônus de treinamento */
    trainingBonus: number;
    
    /** Nível de treinamento */
    trainingLevel: string;
    
    /** Bônus do SUE (poderes, origem, trilha, etc.) */
    sueBonuses: BreakdownSource[];
    
    /** Modificadores manuais */
    manualModifiers: number;
    
    /** Total do teste */
    total: number;
    
    /** DT do teste (se informada) */
    dt?: number;
    
    /** Se passou no teste */
    passed: boolean;
    
    /** Se foi crítico natural (20) */
    isCriticalSuccess: boolean;
    
    /** Se foi falha crítica (1) */
    isCriticalFailure: boolean;
  };
}

// =====================================================
// MAPA DE PERÍCIAS -> ATRIBUTOS
// =====================================================

const SKILL_ATTRIBUTE_MAP: Record<string, AttributeKey> = {
  // Força
  'atletismo': 'strength',
  'luta': 'strength',
  
  // Agilidade
  'acrobacia': 'agility',
  'furtividade': 'agility',
  'pilotagem': 'agility',
  'pontaria': 'agility',
  'reflexos': 'agility',
  
  // Vigor
  'fortitude': 'vigor',
  
  // Intelecto
  'atualidades': 'intellect',
  'ciencias': 'intellect',
  'investigacao': 'intellect',
  'medicina': 'intellect',
  'ocultismo': 'intellect',
  'profissao': 'intellect',
  'sobrevivencia': 'intellect',
  'tatica': 'intellect',
  'tecnologia': 'intellect',
  
  // Presença
  'artes': 'presence',
  'diplomacia': 'presence',
  'enganacao': 'presence',
  'intimidacao': 'presence',
  'intuicao': 'presence',
  'percepcao': 'presence',
  'religiao': 'presence',
  'vontade': 'presence',
};

const ATTRIBUTE_NAMES: Record<AttributeKey, string> = {
  'strength': 'Força',
  'agility': 'Agilidade',
  'vigor': 'Vigor',
  'intellect': 'Intelecto',
  'presence': 'Presença',
};

// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Executa teste de perícia com contexto completo do personagem
 * Integra automaticamente todos os bônus do SUE
 */
export function rollSkillCheckWithContext(context: SkillCheckContext): DetailedSkillCheckResult {
  const { 
    characterState, 
    skill, 
    attributeOverride,
    dt, 
    manualModifiers = 0, 
    activatedPowers = [],
  } = context;
  
  // 1. Determinar atributo da perícia
  const skillKey = skill.toLowerCase().replace(/[áéíóúâêîôûãõç]/g, (c) => {
    const map: Record<string, string> = {
      'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
      'â': 'a', 'ê': 'e', 'î': 'i', 'ô': 'o', 'û': 'u',
      'ã': 'a', 'õ': 'o', 'ç': 'c',
    };
    return map[c] || c;
  });
  
  const attributeKey = attributeOverride || SKILL_ATTRIBUTE_MAP[skillKey] || 'intellect';
  const attributeValue = characterState.attributes[attributeKey];
  const attributeName = ATTRIBUTE_NAMES[attributeKey];
  
  // 2. Obter bônus do SUE
  const sueComputed = getSUEBonusesForCharacter(characterState);
  
  // 3. Calcular bônus de treinamento
  const trainingLevel = characterState.skills[skill] || characterState.skills[skillKey] || 'destreinado';
  const trainingBonus = getTrainingBonus(trainingLevel);
  
  // 4. Coletar bônus do SUE para esta perícia
  const sueBonusSources: BreakdownSource[] = [];
  let totalSUEBonus = 0;
  
  // Bônus específico da perícia do SUE
  const skillSUEBonus = sueComputed.skillBonuses[skill] || sueComputed.skillBonuses[skillKey] || 0;
  if (skillSUEBonus > 0) {
    totalSUEBonus += skillSUEBonus;
    sueBonusSources.push({
      name: 'Bônus de Perícia',
      sourceType: 'power',
      value: skillSUEBonus,
    });
  }
  
  // 5. Verificar poderes ativados que afetam testes
  // (ex: Nerd, Conhecimento Aplicado, etc.)
  // TODO: Integrar com sistema de poderes ativados
  
  // 6. Calcular total de modificadores
  const totalModifiers = attributeValue + trainingBonus + totalSUEBonus + manualModifiers;
  
  // 7. Rolar d20 (considerando pool de dados por atributo positivo/negativo)
  const dicePool = Math.abs(attributeValue) + 1;
  const useHighest = attributeValue >= 0;
  const diceResults: number[] = [];
  
  for (let i = 0; i < dicePool; i++) {
    diceResults.push(rollD20());
  }
  
  const keptDice = useHighest 
    ? Math.max(...diceResults) 
    : Math.min(...diceResults);
  
  // 8. Calcular total
  const total = keptDice + trainingBonus + totalSUEBonus + manualModifiers;
  
  // 9. Determinar resultado
  const isCriticalSuccess = keptDice === 20;
  const isCriticalFailure = keptDice === 1;
  const passed = dt !== undefined ? total >= dt : true;
  
  // 10. Construir resultado
  const roll: RollResult = {
    diceRolled: diceResults,
    diceKept: [keptDice],
    baseValue: attributeValue,
    modifiers: trainingBonus + totalSUEBonus + manualModifiers,
    total,
    naturalRoll: keptDice,
    isCriticalSuccess,
    isCriticalFailure,
  };
  
  const resultText = passed 
    ? (isCriticalSuccess ? 'Sucesso Crítico!' : 'Sucesso') 
    : (isCriticalFailure ? 'Falha Crítica!' : 'Falha');
  
  return {
    success: passed,
    roll,
    breakdown: {
      action: `Teste de ${skill}`,
      components: [
        { label: 'd20', value: keptDice },
        { label: attributeName, value: attributeValue, source: 'attribute' },
        ...(trainingBonus > 0 ? [{ label: `Treinamento (${trainingLevel})`, value: trainingBonus }] : []),
        ...sueBonusSources.map(s => ({ label: s.name, value: s.value })),
        ...(manualModifiers !== 0 ? [{ label: 'Modificador', value: manualModifiers }] : []),
      ],
      formula: `d20 + ${attributeName} + treinamento + bônus`,
      result: `${total}${dt !== undefined ? ` vs DT ${dt}` : ''} - ${resultText}`,
    },
    logEvent: createLogEvent(characterState.id, skill, total, passed, isCriticalSuccess, isCriticalFailure, dt),
    skillCheckBreakdown: {
      skillName: skill,
      attribute: {
        name: attributeName,
        key: attributeKey,
        value: attributeValue,
      },
      trainingBonus,
      trainingLevel,
      sueBonuses: sueBonusSources,
      manualModifiers,
      total,
      dt,
      passed,
      isCriticalSuccess,
      isCriticalFailure,
    },
  };
}

// =====================================================
// HELPERS
// =====================================================

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function getTrainingBonus(level: string | undefined): number {
  switch (level) {
    case 'treinado':
      return 5;
    case 'veterano':
      return 10;
    case 'expert':
      return 15;
    default:
      return 0;
  }
}

function createLogEvent(
  actorId: string,
  skill: string,
  total: number,
  passed: boolean,
  isCriticalSuccess: boolean,
  isCriticalFailure: boolean,
  dt?: number
): LogEvent {
  const resultText = passed 
    ? (isCriticalSuccess ? 'Sucesso Crítico!' : 'Sucesso') 
    : (isCriticalFailure ? 'Falha Crítica!' : 'Falha');
  
  return {
    timestamp: new Date(),
    type: 'skill-check',
    actor: actorId,
    message: `Teste de ${skill}: ${total}${dt !== undefined ? ` vs DT ${dt}` : ''} - ${resultText}`,
    details: {
      skill,
      total,
      passed,
      isCriticalSuccess,
      isCriticalFailure,
      dt,
    },
  };
}
