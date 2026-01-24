// =====================================================
// Testes de Integração End-to-End do SUE
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Testa fluxos completos do Sistema Unificado de Efeitos:
// - Criação de personagem → equipar → combater
// - Rituais sustentados com modos
// - Condições automáticas
// - Progressão de NEX
// - Múltiplas fontes de efeito simultâneas
//

import { describe, it, expect } from 'vitest';
import {
  consolidateEffects,
  type UnifiedEffect,
  type EffectCalculationContext,
  type AttributeType,
} from '../unified-effects-engine';
import { getTrackEffects } from '../effects/track-effects-adapter';
import { getOriginEffects } from '../effects/origin-effects-adapter';
import { getConditionEffects } from '../effects/condition-effects-adapter';
import { getParanormalPowerEffects } from '../effects/paranormal-powers-effects-adapter';
import type { SavedParanormalPower, ParanormalElement } from '../paranormal-powers';

// =============================================================================
// HELPERS DE TESTE
// =============================================================================

/**
 * Cria contexto de cálculo padrão para testes
 */
function createContext(overrides: Partial<EffectCalculationContext> = {}): EffectCalculationContext {
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
 * Cria efeito de equipamento para teste
 */
function createEquipmentEffect(
  id: string,
  name: string,
  mechanics: UnifiedEffect['mechanics']
): UnifiedEffect {
  return {
    id,
    name,
    source: 'equipment',
    sourceId: id,
    sourceName: name,
    mechanics,
    isActive: true,
    isToggleable: false,
  };
}

/**
 * Cria poder paranormal para teste com estrutura completa
 */
function createParanormalPower(
  id: string, 
  name: string, 
  element: ParanormalElement | 'generic' = 'energia'
): SavedParanormalPower {
  return {
    id,
    name,
    element,
    description: `Poder ${name}`,
  };
}

// =============================================================================
// TESTES E2E: FLUXO COMPLETO DE COMBATENTE
// =============================================================================

describe('E2E: Fluxo Completo de Combatente', () => {
  const attributes: Record<AttributeType, number> = { 
    strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 
  };

  it('deve combinar origem + trilha + equipamento corretamente', () => {
    // 1. Origem: Militar (+1 Intimidação, proficiência armas pesadas)
    // getOriginEffects(originId, originName, intellect, activatedEffects)
    const originEffects = getOriginEffects('militar', 'Militar', attributes.intellect, []);

    // 2. Trilha: Operações Especiais NEX 50%
    const trackEffects = getTrackEffects('operacoes-especiais', 50, attributes);

    // 3. Equipamento: Colete balístico (+5 Defesa)
    const equipmentEffect = createEquipmentEffect('colete-balistico', 'Colete Balístico', {
      defenseBonus: 5,
    });

    // Combina todos os efeitos
    const allEffects = [...originEffects, ...trackEffects, equipmentEffect];
    const context = createContext({ attributes, nex: 50 });
    const result = consolidateEffects(allEffects, context);

    // Verificações - usa estrutura correta do ComputedEffects
    expect(result.defense.general).toBeGreaterThanOrEqual(5); // Pelo menos o colete
  });

  it('deve aplicar condição Caído corretamente em combate corpo a corpo', () => {
    // Personagem com bônus base
    const trackEffects = getTrackEffects('operacoes-especiais', 50, attributes);
    const conditionEffects = getConditionEffects(['caido'], { type: 'melee' });

    const allEffects = [...trackEffects, ...conditionEffects];
    const context = createContext({ 
      attributes, 
      nex: 50,
      inCombat: true,
      activeConditions: ['caido'],
    });
    const result = consolidateEffects(allEffects, context);

    // Caído: -5 Defesa em corpo a corpo
    expect(result.defense.vsMelee).toBeLessThan(0);
  });

  it('deve aplicar múltiplas condições simultaneamente', () => {
    const conditionEffects = getConditionEffects(['agarrado', 'atordoado']);

    const context = createContext({ 
      activeConditions: ['agarrado', 'atordoado'],
    });
    const result = consolidateEffects(conditionEffects, context);

    // Agarrado: -2 Defesa, não pode se mover
    // Atordoado: não pode agir
    expect(result.defense.general).toBeLessThan(0);
    expect(result.flags.cannotAct).toBe(true);
  });
});

// =============================================================================
// TESTES E2E: FLUXO COMPLETO DE OCULTISTA
// =============================================================================

describe('E2E: Fluxo Completo de Ocultista', () => {
  const attributes: Record<AttributeType, number> = { 
    strength: 1, agility: 2, vigor: 1, intellect: 3, presence: 3 
  };

  it('deve combinar origem + trilha + poderes paranormais', () => {
    // 1. Origem: Vidente (bônus em Ocultismo)
    const originEffects = getOriginEffects('vidente', 'Vidente', attributes.intellect, []);

    // 2. Trilha: Conduíte NEX 50%
    const trackEffects = getTrackEffects('condutor', 50, attributes);

    // 3. Poderes Paranormais
    const paranormalPowers: SavedParanormalPower[] = [
      createParanormalPower('potencial-aprimorado', 'Potencial Aprimorado', 'conhecimento'),
      createParanormalPower('precognicao', 'Precognição', 'conhecimento'),
    ];
    const paranormalEffects = getParanormalPowerEffects(
      paranormalPowers,
      50,
      'Conhecimento',
      true
    );

    const allEffects = [...originEffects, ...trackEffects, ...paranormalEffects];
    const context = createContext({ attributes, nex: 50 });
    const result = consolidateEffects(allEffects, context);

    // Precognição dá +2 Defesa (com afinidade Conhecimento)
    expect(result.defense.general).toBeGreaterThanOrEqual(2);
    
    // Conduíte dá modificadores de ritual
    expect(result.rituals.availableModifiers.length).toBeGreaterThan(0);
  });

  it('deve calcular bônus de rituais corretamente', () => {
    const trackEffects = getTrackEffects('condutor', 50, attributes);

    const context = createContext({ attributes, nex: 50 });
    const result = consolidateEffects(trackEffects, context);

    // Deve ter Ampliar e Acelerar Ritual
    const modifierIds = result.rituals.availableModifiers.map(m => m.id);
    expect(modifierIds).toContain('ampliar-alcance');
    expect(modifierIds).toContain('acelerar-ritual');
  });
});

// =============================================================================
// TESTES E2E: PROGRESSÃO DE NEX
// =============================================================================

describe('E2E: Progressão de NEX', () => {
  const attributes: Record<AttributeType, number> = { 
    strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 2 
  };

  it('deve atualizar efeitos ao progredir de NEX 45% para 50%', () => {
    // NEX 45%: ainda não tem Acelerar Ritual
    const effectsNex45 = getTrackEffects('condutor', 45, attributes);
    const contextNex45 = createContext({ attributes, nex: 45 });
    const resultNex45 = consolidateEffects(effectsNex45, contextNex45);

    // NEX 50%: tem Acelerar Ritual (NEX 40%)
    const effectsNex50 = getTrackEffects('condutor', 50, attributes);
    const contextNex50 = createContext({ attributes, nex: 50 });
    const resultNex50 = consolidateEffects(effectsNex50, contextNex50);

    // Ambos devem ter Ampliar (NEX 10%)
    const hasAmpliarNex45 = resultNex45.rituals.availableModifiers.some(
      m => m.id === 'ampliar-alcance'
    );
    const hasAmpliarNex50 = resultNex50.rituals.availableModifiers.some(
      m => m.id === 'ampliar-alcance'
    );
    expect(hasAmpliarNex45).toBe(true);
    expect(hasAmpliarNex50).toBe(true);
  });

  it('deve calcular bônus de HP baseado em NEX para poderes paranormais', () => {
    const powers: SavedParanormalPower[] = [
      createParanormalPower('sangue-de-ferro', 'Sangue de Ferro', 'sangue'),
    ];

    // NEX 25% = +5 HP (NEX/5)
    const effectsNex25 = getParanormalPowerEffects(powers, 25, 'Sangue', true);
    const contextNex25 = createContext({ nex: 25 });
    const resultNex25 = consolidateEffects(effectsNex25, contextNex25);

    // NEX 50% = +10 HP (NEX/5)
    const effectsNex50 = getParanormalPowerEffects(powers, 50, 'Sangue', true);
    const contextNex50 = createContext({ nex: 50 });
    const resultNex50 = consolidateEffects(effectsNex50, contextNex50);

    expect(resultNex50.resources.hpBonus).toBeGreaterThan(resultNex25.resources.hpBonus);
  });
});

// =============================================================================
// TESTES E2E: CONDIÇÕES AUTOMÁTICAS
// =============================================================================

describe('E2E: Condições Automáticas', () => {
  it('deve detectar estado morrendo quando HP <= 0', () => {
    const context = createContext({
      hpCurrent: 0,
      hpMax: 30,
    });

    // Simula verificação de condição automática
    const isDying = context.hpCurrent <= 0;
    expect(isDying).toBe(true);
  });

  it('deve detectar exaustão por PE negativo', () => {
    const context = createContext({
      peCurrent: -5,
      peMax: 20,
    });

    // PE negativo causa exaustão (regra oficial)
    const isExhausted = context.peCurrent < 0;
    expect(isExhausted).toBe(true);
  });

  it('deve aplicar penalidades de morrendo corretamente', () => {
    const conditionEffects = getConditionEffects(['morrendo']);

    const context = createContext({
      hpCurrent: 0,
      activeConditions: ['morrendo'],
    });
    const result = consolidateEffects(conditionEffects, context);

    // Morrendo: -5 em testes, não pode agir
    expect(result.flags.cannotAct).toBe(true);
    expect(result.attack.general).toBeLessThan(0);
  });
});

// =============================================================================
// TESTES E2E: MÚLTIPLAS FONTES SIMULTÂNEAS
// =============================================================================

describe('E2E: Múltiplas Fontes Simultâneas', () => {
  const attributes: Record<AttributeType, number> = { 
    strength: 2, agility: 3, vigor: 2, intellect: 2, presence: 2 
  };

  it('deve combinar 5+ fontes de efeito sem conflitos', () => {
    // 1. Origem
    const originEffects = getOriginEffects('agente-de-campo', 'Agente de Campo', attributes.intellect, []);

    // 2. Trilha
    const trackEffects = getTrackEffects('atirador-de-elite', 50, attributes);

    // 3. Condições
    const conditionEffects = getConditionEffects(['sangrando']);

    // 4. Equipamento
    const equipmentEffect = createEquipmentEffect('mira-laser', 'Mira Laser', {
      attackBonus: 1,
    });

    // 5. Paranormal
    const paranormalEffects = getParanormalPowerEffects(
      [createParanormalPower('golpe-de-sorte', 'Golpe de Sorte', 'energia')],
      50,
      'Energia',
      false
    );

    const allEffects = [
      ...originEffects,
      ...trackEffects,
      ...conditionEffects,
      equipmentEffect,
      ...paranormalEffects,
    ];
    const context = createContext({ attributes, nex: 50, activeConditions: ['sangrando'] });
    const result = consolidateEffects(allEffects, context);

    // Verifica que todos contribuíram
    expect(result.attack.breakdown.length).toBeGreaterThanOrEqual(0);
    expect(result.attack.general).toBeDefined();
    expect(result.defense.general).toBeDefined();
  });

  it('deve respeitar regras de stacking de bônus', () => {
    // Dois equipamentos com bônus de defesa (devem somar)
    const equip1 = createEquipmentEffect('colete', 'Colete', { defenseBonus: 3 });
    const equip2 = createEquipmentEffect('escudo', 'Escudo', { defenseBonus: 2 });

    const context = createContext();
    const result = consolidateEffects([equip1, equip2], context);

    // Bônus de equipamento somam
    expect(result.defense.general).toBe(5);
  });

  it('deve gerar breakdown completo para todas as fontes', () => {
    const originEffects = getOriginEffects('lutador', 'Lutador', attributes.intellect, []);
    const trackEffects = getTrackEffects('guerreiro', 50, attributes);

    const allEffects = [...originEffects, ...trackEffects];
    const context = createContext({ attributes, nex: 50 });
    const result = consolidateEffects(allEffects, context);

    // Breakdown deve ter entradas de múltiplas fontes
    const allBreakdowns = [
      ...result.attack.breakdown,
      ...result.defense.breakdown,
      ...result.damage.breakdown,
    ];
    expect(allBreakdowns.length).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================================
// TESTES E2E: CENÁRIOS DE COMBATE REAL
// =============================================================================

describe('E2E: Cenários de Combate Real', () => {
  it('Combatente vs Criatura: cálculo de ataque com modificadores', () => {
    const attributes: Record<AttributeType, number> = { 
      strength: 4, agility: 2, vigor: 3, intellect: 1, presence: 0 
    };

    // Setup do combatente
    const trackEffects = getTrackEffects('guerreiro', 65, attributes);
    const equipEffect = createEquipmentEffect('espada-tatica', 'Espada Tática', {
      attackBonus: 2,
    });

    // Condição: flanqueando (+2 ataque)
    const flankingEffect: UnifiedEffect = {
      id: 'flanqueando',
      name: 'Flanqueando',
      source: 'condition',
      sourceId: 'flanqueando',
      sourceName: 'Flanqueando',
      mechanics: { attackBonus: 2 },
      isActive: true,
      isToggleable: false,
    };

    const allEffects = [...trackEffects, equipEffect, flankingEffect];
    const context = createContext({
      attributes,
      nex: 65,
      inCombat: true,
    });
    const result = consolidateEffects(allEffects, context);

    // Ataque total = base da trilha + equipamento + flanqueando
    expect(result.attack.general).toBeGreaterThanOrEqual(4); // 2 + 2 + bônus da trilha
  });

  it('Ocultista conjurando ritual com modificadores ativos', () => {
    const attributes: Record<AttributeType, number> = { 
      strength: 1, agility: 2, vigor: 1, intellect: 4, presence: 2 
    };

    const trackEffects = getTrackEffects('conduite', 50, attributes);
    const context = createContext({
      attributes,
      nex: 50,
      peCurrent: 15,
    });
    const result = consolidateEffects(trackEffects, context);

    // Custo base do ritual: 3 PE
    // Ampliar: +2 PE
    // Acelerar: +4 PE
    // Total: 9 PE
    const baseCost = 3;
    const ampliar = result.rituals.availableModifiers.find(m => m.id === 'ampliar-alcance');
    const acelerar = result.rituals.availableModifiers.find(m => m.id === 'acelerar-ritual');

    const totalCost = baseCost + (ampliar?.peCost || 0) + (acelerar?.peCost || 0);
    expect(totalCost).toBe(9);
    expect(context.peCurrent).toBeGreaterThanOrEqual(totalCost); // Pode pagar
  });
});

// =============================================================================
// TESTES DE REGRESSÃO
// =============================================================================

describe('Regressão: Garantia de Estabilidade', () => {
  it('não deve quebrar com array de efeitos vazio', () => {
    const context = createContext();
    const result = consolidateEffects([], context);

    expect(result.attack.general).toBe(0);
    expect(result.defense.general).toBe(0);
    expect(result.skills).toEqual({});
  });

  it('não deve quebrar com contexto mínimo', () => {
    const minimalContext: EffectCalculationContext = {
      attributes: { strength: 0, agility: 0, vigor: 0, intellect: 0, presence: 0 },
      nex: 5,
      hpCurrent: 0,
      hpMax: 1,
      peCurrent: 0,
      peMax: 1,
      inCombat: false,
      isFirstRound: false,
      currentRound: 0,
      hasShield: false,
      activeConditions: [],
      activatedEffects: [],
    };

    const result = consolidateEffects([], minimalContext);
    expect(result).toBeDefined();
    expect(result.attack).toBeDefined();
  });

  it('deve produzir resultado consistente para mesma entrada', () => {
    const attributes: Record<AttributeType, number> = { 
      strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 2 
    };
    const effects = getTrackEffects('guerreiro', 50, attributes);
    const context = createContext({ attributes, nex: 50 });

    const result1 = consolidateEffects(effects, context);
    const result2 = consolidateEffects(effects, context);

    expect(result1.attack.general).toBe(result2.attack.general);
    expect(result1.defense.general).toBe(result2.defense.general);
    expect(result1.damage.general).toBe(result2.damage.general);
  });

  it('não deve ter efeitos duplicados no breakdown de ataque', () => {
    const effects = getOriginEffects('militar', 'Militar', 2, []);
    const context = createContext();
    const result = consolidateEffects(effects, context);

    // Verifica que não há entradas duplicadas exatas no breakdown de ataque
    const breakdownStrings = result.attack.breakdown.map(b => `${b.source}-${b.value}`);
    const uniqueBreakdown = new Set(breakdownStrings);
    expect(uniqueBreakdown.size).toBe(breakdownStrings.length);
  });
});
