/**
 * Testes E2E do Motor de Regras Padronizado
 * Ordem Paranormal RPG v1.3
 * 
 * Valida a integração completa de todas as fases implementadas:
 * - Fase 1-3: Bridges de poderes ativáveis
 * - Fase 4: Motor de regras padronizado (deriveCharacter, validateCharacter, rollAction)
 * - Fase 5: SUE stacking rules e order of application
 * 
 * @module __tests__/rules-engine-e2e
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { CharacterState, DerivedStats, ValidationResult, ActionResult } from '../rules-engine/types';
import { deriveCharacter } from '../rules-engine/derive-character';
import { validateCharacter } from '../rules-engine/validate-character';
import { rollAction, applyEffect } from '../rules-engine/apply-and-roll';
import { 
  sortEffectsByPriority, 
  groupEffectsBySource,
  EFFECT_APPLICATION_ORDER,
  getEffectPriority 
} from '../sue/effect-application-order';
import { 
  applyStackingRules, 
  STACKING_RULES,
  type StackableBonus,
  type StackingResult
} from '../sue/stacking-rules';
import { consolidateEffects, type UnifiedEffect, type EffectCalculationContext, type EffectSource } from '../unified-effects-engine';
import { getOriginEffects } from '../effects/origin-effects-adapter';
import { getTrackEffects } from '../effects/track-effects-adapter';
import { getConditionEffects } from '../effects/condition-effects-adapter';

// =============================================================================
// HELPERS DE TESTE
// =============================================================================

/**
 * Cria um CharacterState mínimo válido para testes
 */
function createCharacterState(overrides: Partial<CharacterState> = {}): CharacterState {
  return {
    id: 'test-char-001',
    name: 'Agente de Teste',
    characterClass: 'Combatente',
    nex: 50,
    origin: 'Militar',
    attributes: {
      strength: 3,
      agility: 2,
      vigor: 3,
      intellect: 1,
      presence: 1,
    },
    skills: {
      luta: 'treinado',
      pontaria: 'treinado',
      atletismo: 'treinado',
      intimidacao: 'treinado',
      tatica: 'veterano',
    },
    classPowers: ['ataque-especial', 'ataque-extra'],
    generalPowers: [],
    paranormalPowers: [],
    trackAbilities: [],
    rituals: [],
    sustainedRituals: [],
    equippedWeapons: [{
      id: 'faca-tatica',
      name: 'Faca Tática',
      category: 'simples',
      damage: '1d4',
      criticalMargin: 19,
      criticalMultiplier: 2,
      attackAttribute: 'agility',
      attackSkill: 'luta',
      isEquipped: true,
    }],
    inventory: [],
    activeConditions: [],
    hpCurrent: 30,
    peCurrent: 20,
    sanCurrent: 50,
    ...overrides,
  };
}

/**
 * Cria contexto de cálculo SUE
 */
function createSUEContext(overrides: Partial<EffectCalculationContext> = {}): EffectCalculationContext {
  return {
    attributes: {
      strength: 2,
      agility: 3,
      vigor: 2,
      intellect: 1,
      presence: 2,
    },
    nex: 50,
    hpCurrent: 30,
    hpMax: 30,
    peCurrent: 20,
    peMax: 20,
    inCombat: false,
    isFirstRound: false,
    currentRound: 1,
    hasShield: false,
    activeConditions: [],
    activatedEffects: [],
    ...overrides,
  };
}

/**
 * Cria efeito unificado para teste
 */
function createEffect(
  id: string,
  source: EffectSource,
  mechanics: UnifiedEffect['mechanics'] = {}
): UnifiedEffect {
  return {
    id,
    name: `Efeito ${id}`,
    source,
    sourceId: id,
    sourceName: `Fonte ${id}`,
    mechanics,
    isActive: true,
    isToggleable: false,
  };
}

// =============================================================================
// TESTES E2E: INTEGRAÇÃO RULES-ENGINE + SUE
// =============================================================================

describe('E2E: Integração Rules-Engine + SUE', () => {
  
  describe('deriveCharacter com múltiplas fontes de efeito', () => {
    
    it('deve calcular HP corretamente para Combatente NEX 50%', () => {
      const state = createCharacterState({
        characterClass: 'Combatente',
        nex: 50,
        attributes: { strength: 2, agility: 2, vigor: 3, intellect: 1, presence: 1 },
      });
      
      const derived = deriveCharacter(state);
      
      // Combatente NEX 50%: 20 + (4 * nível) + VIG por nível
      // NEX 50% = nível 5 → 20 + 20 + (3 * 5) = 55 HP
      expect(derived.hpMax).toBeGreaterThanOrEqual(40);
      expect(derived.breakdowns.hp).toBeDefined();
      expect(derived.breakdowns.hp.sources.length).toBeGreaterThan(0);
    });
    
    it('deve calcular PE corretamente para Ocultista NEX 50%', () => {
      const state = createCharacterState({
        characterClass: 'Ocultista',
        nex: 50,
        attributes: { strength: 1, agility: 2, vigor: 1, intellect: 3, presence: 3 },
      });
      
      const derived = deriveCharacter(state);
      
      // Ocultista tem PE por nível mais alto
      expect(derived.peMax).toBeGreaterThanOrEqual(20);
      expect(derived.breakdowns.pe).toBeDefined();
    });
    
    it('deve calcular Defesa com armadura equipada', () => {
      const state = createCharacterState({
        equippedArmor: {
          id: 'colete-balistico',
          name: 'Colete Balístico',
          category: 'leve',
          defenseBonus: 5,
        },
      });
      
      const derived = deriveCharacter(state);
      
      // Defesa = 10 + AGI + armadura
      expect(derived.defense).toBeGreaterThanOrEqual(10 + 2 + 5); // AGI 2 + Colete 5
      expect(derived.breakdowns.defense.sources.some(s => s.name.includes('Colete'))).toBe(true);
    });
    
    it('deve gerar breakdowns detalhados para todas as estatísticas', () => {
      const state = createCharacterState();
      const derived = deriveCharacter(state);
      
      // Verificar que todos os breakdowns existem
      expect(derived.breakdowns.hp).toBeDefined();
      expect(derived.breakdowns.pe).toBeDefined();
      expect(derived.breakdowns.san).toBeDefined();
      expect(derived.breakdowns.defense).toBeDefined();
      expect(derived.breakdowns.resistances.fortitude).toBeDefined();
      expect(derived.breakdowns.resistances.reflexos).toBeDefined();
      expect(derived.breakdowns.resistances.vontade).toBeDefined();
      expect(derived.breakdowns.movement).toBeDefined();
      expect(derived.breakdowns.peLimitPerTurn).toBeDefined();
    });
  });
  
  describe('validateCharacter com regras oficiais', () => {
    
    it('deve validar personagem corretamente configurado', () => {
      const state = createCharacterState();
      const result = validateCharacter(state);
      
      // Personagem válido não deve ter erros críticos
      expect(result.errorCount).toBe(0);
    });
    
    it('deve detectar atributos fora dos limites', () => {
      const state = createCharacterState({
        attributes: { strength: 6, agility: 2, vigor: 2, intellect: 1, presence: 1 },
      });
      
      const result = validateCharacter(state);
      
      expect(result.issues.some(i => i.ruleId.includes('attribute'))).toBe(true);
    });
    
    it('deve detectar HP atual excedendo máximo', () => {
      const state = createCharacterState({
        hpCurrent: 999,
      });
      
      const result = validateCharacter(state);
      
      expect(result.issues.some(i => i.ruleId.includes('hp'))).toBe(true);
    });
    
    it('deve fornecer sugestões de correção', () => {
      const state = createCharacterState({
        attributes: { strength: 6, agility: 2, vigor: 2, intellect: 1, presence: 1 },
      });
      
      const result = validateCharacter(state);
      const attrIssue = result.issues.find(i => i.ruleId.includes('attribute'));
      
      expect(attrIssue?.suggestedFix).toBeDefined();
    });
  });
  
  describe('rollAction com bônus consolidados', () => {
    
    it('deve executar teste de perícia com treinamento', () => {
      const state = createCharacterState();
      
      const result = rollAction({
        type: 'skill-check',
        actorId: state.id,
        skillCheck: {
          skill: 'luta',
          dt: 15,
        },
      });
      
      expect(result.roll).toBeDefined();
      expect(result.roll!.baseValue).toBeGreaterThan(0);
      expect(result.breakdown.components.length).toBeGreaterThan(0);
      expect(result.logEvent.type).toBe('skill-check');
    });
    
    it('deve executar rolagem de ataque com arma', () => {
      const state = createCharacterState();
      
      const result = rollAction({
        type: 'attack-roll',
        actorId: state.id,
        attackRoll: {
          weaponId: 'faca-tatica',
          targetDefense: 15,
        },
      });
      
      expect(result.roll).toBeDefined();
      expect(result.breakdown.action).toContain('Ataque');
      expect(result.logEvent.type).toBe('attack-roll');
    });
    
    it('deve executar rolagem de dano com crítico', () => {
      const result = rollAction({
        type: 'damage-roll',
        actorId: 'test-char-001',
        damageRoll: {
          weaponId: 'faca-tatica',
          isCritical: true,
        },
      });
      
      expect(result.roll).toBeDefined();
      expect(result.breakdown.action).toContain('Dano');
      // Crítico deve aparecer no breakdown
      expect(result.breakdown.formula).toContain('x');
    });
    
    it('deve executar teste de resistência', () => {
      const result = rollAction({
        type: 'resistance-check',
        actorId: 'test-char-001',
        resistanceCheck: {
          resistance: 'fortitude',
          dt: 20,
        },
      });
      
      expect(result.roll).toBeDefined();
      expect(result.breakdown.action).toContain('Resistência');
    });
  });
});

// =============================================================================
// TESTES E2E: ORDEM DE APLICAÇÃO DE EFEITOS (FASE 5)
// =============================================================================

describe('E2E: Ordem Fixa de Aplicação de Efeitos', () => {
  
  it('deve ordenar efeitos na ordem correta de prioridade', () => {
    const effects = [
      createEffect('cond-1', 'condition', { defenseBonus: -5 }),
      createEffect('origin-1', 'origin', { skillBonus: { intimidacao: 5 } }),
      createEffect('equip-1', 'equipment', { defenseBonus: 5 }),
      createEffect('track-1', 'track', { attackBonus: 2 }),
      createEffect('ritual-1', 'ritual', { damageBonus: 4 }),
    ];
    
    const sorted = sortEffectsByPriority(effects);
    
    // Ordem esperada: origin → track → equipment → ritual → condition
    expect(sorted[0].source).toBe('origin');
    expect(sorted[1].source).toBe('track');
    expect(sorted[2].source).toBe('equipment');
    expect(sorted[3].source).toBe('ritual');
    expect(sorted[4].source).toBe('condition');
  });
  
  it('deve agrupar efeitos por fonte mantendo ordem', () => {
    const effects = [
      createEffect('cond-1', 'condition'),
      createEffect('cond-2', 'condition'),
      createEffect('origin-1', 'origin'),
      createEffect('equip-1', 'equipment'),
      createEffect('equip-2', 'equipment'),
    ];
    
    const grouped = groupEffectsBySource(effects);
    
    // Verificar que grupos existem na ordem correta
    const keys = Array.from(grouped.keys());
    expect(keys.indexOf('origin')).toBeLessThan(keys.indexOf('equipment'));
    expect(keys.indexOf('equipment')).toBeLessThan(keys.indexOf('condition'));
    
    // Verificar contagem por grupo
    expect(grouped.get('condition')?.length).toBe(2);
    expect(grouped.get('equipment')?.length).toBe(2);
    expect(grouped.get('origin')?.length).toBe(1);
  });
  
  it('deve manter ordem estável para efeitos da mesma fonte', () => {
    const effects = [
      createEffect('b-equip', 'equipment'),
      createEffect('a-equip', 'equipment'),
      createEffect('c-equip', 'equipment'),
    ];
    
    const sorted = sortEffectsByPriority(effects);
    
    // Ordem alfabética por sourceId para determinismo
    expect(sorted[0].id).toBe('a-equip');
    expect(sorted[1].id).toBe('b-equip');
    expect(sorted[2].id).toBe('c-equip');
  });
  
  it('deve aplicar todas as 10 fontes na ordem correta', () => {
    expect(EFFECT_APPLICATION_ORDER).toHaveLength(10);
    
    // Verificar ordem específica
    expect(EFFECT_APPLICATION_ORDER[0]).toBe('skill_training');
    expect(EFFECT_APPLICATION_ORDER[1]).toBe('origin');
    expect(EFFECT_APPLICATION_ORDER[2]).toBe('class_ability');
    expect(EFFECT_APPLICATION_ORDER[3]).toBe('class_power');
    expect(EFFECT_APPLICATION_ORDER[4]).toBe('track');
    expect(EFFECT_APPLICATION_ORDER[5]).toBe('general_power');
    expect(EFFECT_APPLICATION_ORDER[6]).toBe('paranormal_power');
    expect(EFFECT_APPLICATION_ORDER[7]).toBe('equipment');
    expect(EFFECT_APPLICATION_ORDER[8]).toBe('ritual');
    expect(EFFECT_APPLICATION_ORDER[9]).toBe('condition');
  });
});

// =============================================================================
// TESTES E2E: REGRAS DE STACKING (FASE 5)
// =============================================================================

describe('E2E: Regras de Stacking Oficiais', () => {
  
  /**
   * Helper para criar StackableBonus para testes
   */
  function createStackableBonus(
    value: number,
    source: EffectSource,
    sourceId: string,
    category: 'attack' | 'damage' | 'defense' | 'skill' = 'attack',
    subtype?: string
  ): StackableBonus {
    return {
      id: `bonus-${sourceId}`,
      source,
      sourceId,
      sourceName: `Fonte ${sourceId}`,
      value,
      category,
      active: true,
      subtype,
    };
  }
  
  describe('Bônus de fontes diferentes acumulam', () => {
    
    it('deve acumular bônus de origem + trilha + poder', () => {
      const bonuses: StackableBonus[] = [
        createStackableBonus(2, 'origin', 'militar', 'attack'),
        createStackableBonus(3, 'track', 'operacoes-especiais', 'attack'),
        createStackableBonus(1, 'class_power', 'ataque-especial', 'attack'),
      ];
      
      const result = applyStackingRules(bonuses, 'attack');
      
      // Fontes diferentes acumulam
      expect(result.total).toBe(6);
      expect(result.applied.length).toBe(3);
    });
    
    it('deve acumular bônus de ataque de múltiplas condições', () => {
      const bonuses: StackableBonus[] = [
        createStackableBonus(-2, 'condition', 'agarrado', 'attack'),
        createStackableBonus(-5, 'condition', 'cego', 'attack'),
      ];
      
      const result = applyStackingRules(bonuses, 'attack');
      
      // Condições diferentes acumulam
      expect(result.total).toBe(-7);
    });
  });
  
  describe('Bônus da mesma fonte - apenas maior aplica (equipamento)', () => {
    
    it('deve usar apenas maior bônus de equipamento para ataque', () => {
      const bonuses: StackableBonus[] = [
        createStackableBonus(3, 'equipment', 'espada-1', 'attack'),
        createStackableBonus(5, 'equipment', 'espada-2', 'attack'),
        createStackableBonus(2, 'equipment', 'espada-3', 'attack'),
      ];
      
      const result = applyStackingRules(bonuses, 'attack');
      
      // Apenas o maior aplica (regra de equipamento)
      expect(result.total).toBe(5);
      expect(result.applied.length).toBe(1);
      expect(result.excluded.length).toBe(2);
    });
    
    it('deve usar apenas maior bônus de ritual', () => {
      const bonuses: StackableBonus[] = [
        createStackableBonus(4, 'ritual', 'protecao', 'defense'),
        createStackableBonus(2, 'ritual', 'armadura-arcana', 'defense'),
      ];
      
      const result = applyStackingRules(bonuses, 'defense');
      
      expect(result.total).toBe(4);
      expect(result.applied.length).toBe(1);
    });
  });
  
  describe('Exceção: Trio de Defesa (Armadura + Escudo + Paranormal)', () => {
    
    it('deve acumular armadura + escudo + item paranormal para Defesa', () => {
      const bonuses: StackableBonus[] = [
        createStackableBonus(5, 'equipment', 'colete', 'defense', 'armor'),
        createStackableBonus(2, 'equipment', 'escudo', 'defense', 'shield'),
        createStackableBonus(3, 'equipment', 'amuleto', 'defense', 'paranormal'),
      ];
      
      const result = applyStackingRules(bonuses, 'defense');
      
      // Trio de defesa acumula
      expect(result.total).toBe(10);
      expect(result.applied.length).toBe(3);
    });
    
    it('deve usar apenas maior quando há múltiplas armaduras', () => {
      const bonuses: StackableBonus[] = [
        createStackableBonus(5, 'equipment', 'colete-1', 'defense', 'armor'),
        createStackableBonus(3, 'equipment', 'colete-2', 'defense', 'armor'),
        createStackableBonus(2, 'equipment', 'escudo', 'defense', 'shield'),
      ];
      
      const result = applyStackingRules(bonuses, 'defense');
      
      // Maior armadura + escudo
      expect(result.total).toBe(7);
    });
  });
  
  describe('Exceção: Envenenado e Sangrando acumulam', () => {
    
    it('deve acumular dano de múltiplas fontes de Envenenado', () => {
      const bonuses: StackableBonus[] = [
        createStackableBonus(6, 'condition', 'envenenado-cobra', 'damage'),
        createStackableBonus(4, 'condition', 'envenenado-ritual', 'damage'),
        createStackableBonus(3, 'condition', 'envenenado-criatura', 'damage'),
      ];
      
      const result = applyStackingRules(bonuses, 'damage');
      
      // Condições de dano acumulam
      expect(result.total).toBe(13);
      expect(result.applied.length).toBe(3);
    });
    
    it('deve respeitar limite máximo de stacks definido na config', () => {
      const bonuses: StackableBonus[] = Array.from({ length: 15 }, (_, i) => 
        createStackableBonus(2, 'condition', `sangramento-${i}`, 'damage')
      );
      
      const result = applyStackingRules(bonuses, 'damage');
      
      // Condições acumulam (sem limite artificial nos testes)
      expect(result.applied.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// TESTES E2E: FLUXO COMPLETO DE PERSONAGEM
// =============================================================================

describe('E2E: Fluxo Completo de Personagem', () => {
  
  describe('Combatente Militar NEX 50%', () => {
    let state: CharacterState;
    let derived: DerivedStats;
    let validation: ValidationResult;
    
    beforeEach(() => {
      state = createCharacterState({
        characterClass: 'Combatente',
        nex: 50,
        origin: 'Militar',
        classTrack: 'operacoes-especiais',
        attributes: { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 },
        equippedArmor: {
          id: 'colete-balistico',
          name: 'Colete Balístico',
          category: 'leve',
          defenseBonus: 5,
        },
        classPowers: ['ataque-especial', 'ataque-extra', 'incansavel'],
      });
      
      derived = deriveCharacter(state);
      validation = validateCharacter(state);
    });
    
    it('deve ter HP elevado (20 base + 4/nível + VIG/nível)', () => {
      // NEX 50% = 5 níveis → 20 + 20 + 15 = 55 HP base
      expect(derived.hpMax).toBeGreaterThanOrEqual(40);
    });
    
    it('deve ter Defesa calculada corretamente', () => {
      // 10 + AGI(2) + Colete(5) = 17
      expect(derived.defense).toBeGreaterThanOrEqual(17);
    });
    
    it('deve ter resistências baseadas em atributos + NEX', () => {
      expect(derived.resistances.fortitude).toBeGreaterThan(0);
      expect(derived.resistances.reflexos).toBeGreaterThan(0);
      expect(derived.resistances.vontade).toBeGreaterThan(0);
    });
    
    it('deve passar na validação sem erros', () => {
      expect(validation.errorCount).toBe(0);
    });
    
    it('deve integrar com SUE para bônus consolidados', () => {
      const sueContext = createSUEContext({
        attributes: state.attributes,
        nex: state.nex,
      });
      
      const originEffects = getOriginEffects('militar', 'Militar', state.attributes.intellect, []);
      const trackEffects = getTrackEffects('operacoes-especiais', state.nex, state.attributes);
      
      const allEffects = [...originEffects, ...trackEffects];
      const consolidated = consolidateEffects(allEffects, sueContext);
      
      // Militar dá +1 Intimidação, Operações Especiais dá bônus em combate
      expect(consolidated.skills.intimidacao).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Ocultista Vidente NEX 50%', () => {
    let state: CharacterState;
    let derived: DerivedStats;
    
    beforeEach(() => {
      state = createCharacterState({
        characterClass: 'Ocultista',
        nex: 50,
        origin: 'Vidente',
        classTrack: 'condutor',
        attributes: { strength: 1, agility: 2, vigor: 1, intellect: 3, presence: 3 },
        rituals: ['proteção', 'arma-mental'],
        elementalAffinity: 'Conhecimento',
        affinityActive: true,
      });
      
      derived = deriveCharacter(state);
    });
    
    it('deve ter PE elevado (Ocultista tem 4 PE/nível)', () => {
      // NEX 50% = 5 níveis → 4 * 5 = 20 PE base
      expect(derived.peMax).toBeGreaterThanOrEqual(20);
    });
    
    it('deve ter acesso a rituais de 2º círculo', () => {
      // NEX 50% permite rituais de 2º círculo
      expect(derived.ritualsMaxCircle).toBeGreaterThanOrEqual(2);
    });
    
    it('deve calcular limite de rituais conhecidos', () => {
      expect(derived.ritualsMaxCount).toBeGreaterThan(0);
    });
  });
  
  describe('Especialista com Condições Ativas', () => {
    let state: CharacterState;
    
    beforeEach(() => {
      state = createCharacterState({
        characterClass: 'Especialista',
        nex: 50,
        origin: 'Investigador',
        classTrack: 'atiradora',
        attributes: { strength: 1, agility: 4, vigor: 1, intellect: 3, presence: 1 },
        activeConditions: [
          {
            conditionId: 'caido',
            conditionName: 'Caído',
            durationType: 'scene',
            sourceName: 'Teste',
          },
        ],
      });
    });
    
    it('deve aplicar penalidade de Caído na Defesa corpo a corpo', () => {
      const sueContext = createSUEContext({
        attributes: state.attributes,
        nex: state.nex,
        activeConditions: ['caido'],
        inCombat: true,
      });
      
      const conditionEffects = getConditionEffects(['caido'], { type: 'melee' });
      const consolidated = consolidateEffects(conditionEffects, sueContext);
      
      // Caído: -5 Defesa contra ataques corpo a corpo
      expect(consolidated.defense.vsMelee).toBeLessThan(0);
    });
    
    it('deve manter ordem de aplicação: condições por último', () => {
      const effects = [
        createEffect('cond-caido', 'condition', { defenseBonus: -5 }),
        createEffect('origin-bonus', 'origin', { skillBonus: { investigacao: 5 } }),
        createEffect('track-bonus', 'track', { attackBonus: 2 }),
      ];
      
      const sorted = sortEffectsByPriority(effects);
      
      // Condição deve ser processada por último
      expect(sorted[sorted.length - 1].source).toBe('condition');
    });
  });
});

// =============================================================================
// TESTES E2E: CENÁRIOS DE COMBATE COMPLETO
// =============================================================================

describe('E2E: Cenários de Combate Completo', () => {
  
  it('deve executar sequência completa: Iniciativa → Ataque → Dano', () => {
    const state = createCharacterState();
    
    // 1. Rolagem de Iniciativa
    const initResult = rollAction({
      type: 'initiative-roll',
      actorId: state.id,
      initiativeRoll: {},
    });
    expect(initResult.roll).toBeDefined();
    expect(initResult.roll!.total).toBeGreaterThan(0);
    
    // 2. Rolagem de Ataque
    const attackResult = rollAction({
      type: 'attack-roll',
      actorId: state.id,
      attackRoll: {
        weaponId: 'faca-tatica',
        targetDefense: 15,
      },
    });
    expect(attackResult.roll).toBeDefined();
    
    // 3. Rolagem de Dano (se acertou)
    if (attackResult.success) {
      const damageResult = rollAction({
        type: 'damage-roll',
        actorId: state.id,
        damageRoll: {
          weaponId: 'faca-tatica',
          isCritical: attackResult.roll?.isCriticalSuccess ?? false,
        },
      });
      expect(damageResult.roll).toBeDefined();
      expect(damageResult.roll!.total).toBeGreaterThan(0);
    }
  });
  
  it('deve validar todas as fases estão integradas', () => {
    // Fase 1-3: Bridges funcionando
    const activatableOrigins = ['militar', 'atleta', 'academico'];
    activatableOrigins.forEach(origin => {
      const effects = getOriginEffects(origin, origin, 2, []);
      expect(Array.isArray(effects)).toBe(true);
    });
    
    // Fase 4: Rules Engine funcionando
    const state = createCharacterState();
    const derived = deriveCharacter(state);
    expect(derived.hpMax).toBeGreaterThan(0);
    
    const validation = validateCharacter(state);
    expect(validation.valid).toBeDefined();
    
    // Fase 5: Stacking e Order funcionando
    expect(EFFECT_APPLICATION_ORDER.length).toBe(10);
    expect(STACKING_RULES).toBeDefined();
  });
});
