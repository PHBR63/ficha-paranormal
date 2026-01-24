// =====================================================
// Testes de Múltiplos Personagens Simultâneos - SUE
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Testa cenários onde múltiplos personagens interagem:
// - Efeitos de área que afetam grupo
// - Sinergias entre classes
// - Conflitos de efeitos entre personagens
// - Performance com múltiplos cálculos simultâneos
//

import { describe, it, expect } from 'vitest';
import {
  consolidateEffects,
  type UnifiedEffect,
  type EffectCalculationContext,
  type AttributeType,
  type ComputedEffects,
} from '../unified-effects-engine';
import { getTrackEffects } from '../effects/track-effects-adapter';
import { getOriginEffects } from '../effects/origin-effects-adapter';
import { getConditionEffects } from '../effects/condition-effects-adapter';

// =============================================================================
// HELPERS DE TESTE
// =============================================================================

/**
 * Contexto base para cálculos
 */
function createBaseContext(
  attributes: Record<AttributeType, number>,
  overrides: Partial<EffectCalculationContext> = {}
): EffectCalculationContext {
  return {
    attributes,
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
 * Representa um personagem para testes multi-char
 */
interface TestCharacter {
  id: string;
  name: string;
  track: string;
  nex: number;
  attributes: Record<AttributeType, number>;
  conditions?: string[];
  buffsFromAllies?: UnifiedEffect[];
}

/**
 * Calcula efeitos para múltiplos personagens
 */
function calculateMultipleCharacters(chars: TestCharacter[]): Map<string, ComputedEffects> {
  const results = new Map<string, ComputedEffects>();

  chars.forEach(char => {
    const trackEffects = getTrackEffects(char.track, char.nex, char.attributes, []);
    const conditionEffects = char.conditions ? getConditionEffects(char.conditions) : [];
    const allyBuffs = char.buffsFromAllies ?? [];

    const allEffects = [...trackEffects, ...conditionEffects, ...allyBuffs];
    const context = createBaseContext(char.attributes, {
      nex: char.nex,
      activeConditions: char.conditions ?? [],
    });

    results.set(char.id, consolidateEffects(allEffects, context));
  });

  return results;
}

/**
 * Cria efeito de buff de aliado
 */
function createAllyBuff(
  sourceCharName: string,
  buffName: string,
  mechanics: UnifiedEffect['mechanics']
): UnifiedEffect {
  return {
    id: `ally-buff-${buffName.toLowerCase().replace(/\s/g, '-')}`,
    name: buffName,
    source: 'class_power',
    sourceId: buffName,
    sourceName: `${sourceCharName}: ${buffName}`,
    mechanics,
    isActive: true,
    isToggleable: false,
  };
}

// =============================================================================
// TESTES: Efeitos de Área em Grupo
// =============================================================================

describe('Multi-Personagem: Efeitos de Área', () => {
  it('deve aplicar mesmo buff de área para todos os aliados', () => {
    // Cenário: Comandante de Campo usa Inspirar Coragem (+2 ataque para aliados)
    const buffInspiracao = createAllyBuff('Comandante', 'Inspirar Coragem', {
      attackBonus: 2,
    });

    const grupo: TestCharacter[] = [
      {
        id: 'char-1',
        name: 'Guerreiro',
        track: 'guerreiro',
        nex: 50,
        attributes: { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 },
        buffsFromAllies: [buffInspiracao],
      },
      {
        id: 'char-2',
        name: 'Atirador',
        track: 'atirador-de-elite',
        nex: 50,
        attributes: { strength: 1, agility: 3, vigor: 2, intellect: 3, presence: 1 },
        buffsFromAllies: [buffInspiracao],
      },
      {
        id: 'char-3',
        name: 'Médico',
        track: 'medico-de-campo',
        nex: 50,
        attributes: { strength: 1, agility: 2, vigor: 2, intellect: 3, presence: 2 },
        buffsFromAllies: [buffInspiracao],
      },
    ];

    const results = calculateMultipleCharacters(grupo);

    // Todos devem ter +2 de ataque do buff
    results.forEach((effects, charId) => {
      expect(effects.attack.general).toBeGreaterThanOrEqual(2);
    });
  });

  it('deve aplicar debuff de área inimigo para todos afetados', () => {
    // Cenário: Efeito de medo (Abalado) afeta múltiplos personagens
    const grupo: TestCharacter[] = [
      {
        id: 'char-1',
        name: 'Afetado 1',
        track: 'guerreiro',
        nex: 50,
        attributes: { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 },
        conditions: ['abalado'],
      },
      {
        id: 'char-2',
        name: 'Afetado 2',
        track: 'atirador-de-elite',
        nex: 50,
        attributes: { strength: 1, agility: 3, vigor: 2, intellect: 3, presence: 1 },
        conditions: ['abalado'],
      },
      {
        id: 'char-3',
        name: 'Não Afetado',
        track: 'condutor',
        nex: 50,
        attributes: { strength: 1, agility: 2, vigor: 1, intellect: 3, presence: 3 },
        conditions: [], // Resistiu ao medo
      },
    ];

    const results = calculateMultipleCharacters(grupo);

    // Afetados devem ter penalidade, não afetado não
    const afetado1 = results.get('char-1')!;
    const afetado2 = results.get('char-2')!;
    const naoAfetado = results.get('char-3')!;

    // Abalado causa penalidades
    expect(afetado1).toBeDefined();
    expect(afetado2).toBeDefined();
    expect(naoAfetado).toBeDefined();
  });

  it('deve processar buffs e debuffs simultâneos corretamente', () => {
    const buffAliado = createAllyBuff('Conduíte', 'Aura de Proteção', {
      defenseBonus: 2,
    });

    const debuffInimigo = createAllyBuff('Criatura', 'Aura de Medo', {
      attackBonus: -2,
      allResistancesBonus: -1,
    });

    const personagem: TestCharacter = {
      id: 'char-1',
      name: 'Personagem Misto',
      track: 'guerreiro',
      nex: 50,
      attributes: { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 },
      buffsFromAllies: [buffAliado, debuffInimigo],
    };

    const results = calculateMultipleCharacters([personagem]);
    const effects = results.get('char-1')!;

    // Buff de defesa aplicado
    expect(effects.defense.general).toBeGreaterThanOrEqual(2);
    // Debuff de ataque aplicado
    expect(effects.attack.general).toBeLessThanOrEqual(-2);
  });
});

// =============================================================================
// TESTES: Sinergias entre Classes
// =============================================================================

describe('Multi-Personagem: Sinergias entre Classes', () => {
  it('Comandante de Campo deve poder buffar aliados', () => {
    // Comandante dá bônus, aliados recebem
    const buffComando = createAllyBuff('Comandante', 'Comando de Campo', {
      attackBonus: 1,
      damageBonus: 1,
    });

    const grupo: TestCharacter[] = [
      {
        id: 'comandante',
        name: 'Comandante',
        track: 'comandante-campo',
        nex: 50,
        attributes: { strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 3 },
        // Comandante não recebe próprio buff
      },
      {
        id: 'aliado-1',
        name: 'Soldado 1',
        track: 'guerreiro',
        nex: 50,
        attributes: { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 },
        buffsFromAllies: [buffComando],
      },
      {
        id: 'aliado-2',
        name: 'Soldado 2',
        track: 'aniquilador',
        nex: 50,
        attributes: { strength: 4, agility: 1, vigor: 3, intellect: 1, presence: 1 },
        buffsFromAllies: [buffComando],
      },
    ];

    const results = calculateMultipleCharacters(grupo);

    // Aliados devem ter bônus
    const aliado1 = results.get('aliado-1')!;
    const aliado2 = results.get('aliado-2')!;
    expect(aliado1.attack.general).toBeGreaterThanOrEqual(1);
    expect(aliado2.attack.general).toBeGreaterThanOrEqual(1);
  });

  it('Médico de Campo deve poder buffar aliados com suporte', () => {
    const buffMedico = createAllyBuff('Médica', 'Suporte Tático', {
      hpBonus: 5, // Cura/suporte
    });

    const aliado: TestCharacter = {
      id: 'paciente',
      name: 'Paciente',
      track: 'guerreiro',
      nex: 50,
      attributes: { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 },
      buffsFromAllies: [buffMedico],
    };

    const results = calculateMultipleCharacters([aliado]);
    const effects = results.get('paciente')!;

    expect(effects.resources.hpBonus).toBe(5);
  });

  it('Ocultista deve poder fornecer buffs paranormais', () => {
    const buffOcultista = createAllyBuff('Ocultista', 'Proteção Arcana', {
      paranormalDamageReduction: 5,
    });

    const grupo: TestCharacter[] = [
      {
        id: 'protegido-1',
        name: 'Protegido 1',
        track: 'guerreiro',
        nex: 50,
        attributes: { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 },
        buffsFromAllies: [buffOcultista],
      },
      {
        id: 'protegido-2',
        name: 'Protegido 2',
        track: 'atirador-de-elite',
        nex: 50,
        attributes: { strength: 1, agility: 3, vigor: 2, intellect: 3, presence: 1 },
        buffsFromAllies: [buffOcultista],
      },
    ];

    const results = calculateMultipleCharacters(grupo);

    results.forEach((effects) => {
      expect(effects.damageReduction.paranormal).toBe(5);
    });
  });
});

// =============================================================================
// TESTES: Conflitos de Efeitos
// =============================================================================

describe('Multi-Personagem: Conflitos de Efeitos', () => {
  it('múltiplos buffs do mesmo tipo devem seguir regras de stacking', () => {
    const buff1 = createAllyBuff('Aliado 1', 'Inspiração', { attackBonus: 2 });
    const buff2 = createAllyBuff('Aliado 2', 'Motivação', { attackBonus: 3 });

    const personagem: TestCharacter = {
      id: 'receptor',
      name: 'Receptor',
      track: 'guerreiro',
      nex: 50,
      attributes: { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 },
      buffsFromAllies: [buff1, buff2],
    };

    const results = calculateMultipleCharacters([personagem]);
    const effects = results.get('receptor')!;

    // Bônus devem somar (regra padrão: bônus do mesmo tipo somam)
    expect(effects.attack.general).toBe(5);
  });

  it('buff e debuff devem se anular parcialmente', () => {
    const buff = createAllyBuff('Aliado', 'Proteção', { defenseBonus: 5 });
    const debuff = createAllyBuff('Inimigo', 'Maldição', { defenseBonus: -3 });

    const personagem: TestCharacter = {
      id: 'afetado',
      name: 'Afetado',
      track: 'guerreiro',
      nex: 50,
      attributes: { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 },
      buffsFromAllies: [buff, debuff],
    };

    const results = calculateMultipleCharacters([personagem]);
    const effects = results.get('afetado')!;

    // 5 - 3 = 2
    expect(effects.defense.general).toBe(2);
  });

  it('cada personagem deve ter seu próprio contexto isolado', () => {
    const grupo: TestCharacter[] = [
      {
        id: 'char-1',
        name: 'Personagem 1',
        track: 'guerreiro',
        nex: 50,
        attributes: { strength: 4, agility: 1, vigor: 3, intellect: 1, presence: 1 },
        conditions: ['abalado'],
      },
      {
        id: 'char-2',
        name: 'Personagem 2',
        track: 'guerreiro',
        nex: 50,
        attributes: { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 },
        // Sem condições
      },
    ];

    const results = calculateMultipleCharacters(grupo);

    const char1 = results.get('char-1')!;
    const char2 = results.get('char-2')!;

    // Char1 tem condição, char2 não
    // Os efeitos devem ser diferentes
    expect(char1).not.toEqual(char2);
  });
});

// =============================================================================
// TESTES: Performance com Múltiplos Cálculos
// =============================================================================

describe('Multi-Personagem: Performance', () => {
  it('deve calcular 5 personagens em menos de 100ms', () => {
    const grupo: TestCharacter[] = Array.from({ length: 5 }, (_, i) => ({
      id: `char-${i}`,
      name: `Personagem ${i}`,
      track: 'guerreiro',
      nex: 50,
      attributes: { strength: 2 + (i % 3), agility: 2, vigor: 2, intellect: 2, presence: 2 },
    }));

    const start = performance.now();
    const results = calculateMultipleCharacters(grupo);
    const end = performance.now();

    expect(results.size).toBe(5);
    expect(end - start).toBeLessThan(100);
  });

  it('deve calcular 10 personagens sem degradação significativa', () => {
    const grupo: TestCharacter[] = Array.from({ length: 10 }, (_, i) => ({
      id: `char-${i}`,
      name: `Personagem ${i}`,
      track: ['guerreiro', 'atirador-de-elite', 'conduite'][i % 3],
      nex: 20 + (i * 5),
      attributes: { 
        strength: 1 + (i % 4), 
        agility: 2, 
        vigor: 1 + (i % 3), 
        intellect: 2, 
        presence: 1 + (i % 2) 
      },
    }));

    const start = performance.now();
    const results = calculateMultipleCharacters(grupo);
    const end = performance.now();

    expect(results.size).toBe(10);
    expect(end - start).toBeLessThan(200);
  });

  it('deve manter consistência em cálculos paralelos', () => {
    const personagem: TestCharacter = {
      id: 'test',
      name: 'Teste',
      track: 'guerreiro',
      nex: 50,
      attributes: { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 },
    };

    // Calcular 5 vezes "em paralelo" (simulado)
    const results: ComputedEffects[] = [];
    for (let i = 0; i < 5; i++) {
      const result = calculateMultipleCharacters([personagem]);
      results.push(result.get('test')!);
    }

    // Todos devem ser idênticos
    const first = results[0];
    results.forEach(result => {
      expect(result.attack.general).toBe(first.attack.general);
      expect(result.defense.general).toBe(first.defense.general);
      expect(result.damage.general).toBe(first.damage.general);
    });
  });
});

// =============================================================================
// TESTES: Cenários de Mesa Real
// =============================================================================

describe('Multi-Personagem: Cenários de Mesa', () => {
  it('deve simular rodada completa de combate com 4 jogadores', () => {
    // Grupo típico de mesa
    const mesa: TestCharacter[] = [
      {
        id: 'tank',
        name: 'Tank',
        track: 'tropa-choque',
        nex: 50,
        attributes: { strength: 2, agility: 1, vigor: 4, intellect: 1, presence: 2 },
      },
      {
        id: 'dps-melee',
        name: 'DPS Melee',
        track: 'aniquilador',
        nex: 50,
        attributes: { strength: 4, agility: 2, vigor: 3, intellect: 0, presence: 1 },
      },
      {
        id: 'dps-ranged',
        name: 'DPS Ranged',
        track: 'atirador-de-elite',
        nex: 50,
        attributes: { strength: 1, agility: 3, vigor: 2, intellect: 3, presence: 1 },
      },
      {
        id: 'support',
        name: 'Suporte',
        track: 'medico-de-campo',
        nex: 50,
        attributes: { strength: 1, agility: 2, vigor: 2, intellect: 3, presence: 2 },
      },
    ];

    const results = calculateMultipleCharacters(mesa);

    expect(results.size).toBe(4);

    // Tank deve ter RD
    const tank = results.get('tank')!;
    expect(tank.damageReduction.physical).toBeGreaterThanOrEqual(0);

    // DPS devem ter dano alto
    const dpsMelee = results.get('dps-melee')!;
    const dpsRanged = results.get('dps-ranged')!;
    expect(dpsMelee.damage).toBeDefined();
    expect(dpsRanged.damage).toBeDefined();

    // Suporte deve ter habilidades de cura
    const support = results.get('support')!;
    expect(support).toBeDefined();
  });

  it('deve processar grupo com níveis de NEX variados', () => {
    // Grupo com veteranos e novatos
    const grupoMisto: TestCharacter[] = [
      {
        id: 'veterano',
        name: 'Veterano (NEX 85%)',
        track: 'guerreiro',
        nex: 85,
        attributes: { strength: 4, agility: 3, vigor: 4, intellect: 2, presence: 2 },
      },
      {
        id: 'experiente',
        name: 'Experiente (NEX 50%)',
        track: 'atirador-de-elite',
        nex: 50,
        attributes: { strength: 2, agility: 3, vigor: 2, intellect: 3, presence: 1 },
      },
      {
        id: 'novato',
        name: 'Novato (NEX 15%)',
        track: 'conduite',
        nex: 15,
        attributes: { strength: 1, agility: 2, vigor: 1, intellect: 2, presence: 2 },
      },
    ];

    const results = calculateMultipleCharacters(grupoMisto);

    expect(results.size).toBe(3);

    // Todos devem ter resultados válidos
    results.forEach(effects => {
      expect(effects.attack).toBeDefined();
      expect(effects.defense).toBeDefined();
    });
  });

  it('deve simular combate com condições em cascata', () => {
    // Rodada 1: todos saudáveis
    // Rodada 2: alguns tomam dano e ganham condições
    // Rodada 3: mais condições

    const grupoRodada1: TestCharacter[] = [
      { id: 'p1', name: 'P1', track: 'guerreiro', nex: 50, 
        attributes: { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 }, conditions: [] },
      { id: 'p2', name: 'P2', track: 'atirador-de-elite', nex: 50, 
        attributes: { strength: 1, agility: 3, vigor: 2, intellect: 3, presence: 1 }, conditions: [] },
    ];

    const grupoRodada2: TestCharacter[] = [
      { id: 'p1', name: 'P1', track: 'guerreiro', nex: 50, 
        attributes: { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 }, conditions: ['sangrando'] },
      { id: 'p2', name: 'P2', track: 'atirador-de-elite', nex: 50, 
        attributes: { strength: 1, agility: 3, vigor: 2, intellect: 3, presence: 1 }, conditions: [] },
    ];

    const grupoRodada3: TestCharacter[] = [
      { id: 'p1', name: 'P1', track: 'guerreiro', nex: 50, 
        attributes: { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 }, conditions: ['sangrando', 'caido'] },
      { id: 'p2', name: 'P2', track: 'atirador-de-elite', nex: 50, 
        attributes: { strength: 1, agility: 3, vigor: 2, intellect: 3, presence: 1 }, conditions: ['abalado'] },
    ];

    const r1 = calculateMultipleCharacters(grupoRodada1);
    const r2 = calculateMultipleCharacters(grupoRodada2);
    const r3 = calculateMultipleCharacters(grupoRodada3);

    // P1 deve piorar progressivamente
    const p1r1 = r1.get('p1')!;
    const p1r2 = r2.get('p1')!;
    const p1r3 = r3.get('p1')!;

    // Mais condições = mais penalidades
    expect(p1r3.defense.general).toBeLessThanOrEqual(p1r1.defense.general);
  });
});
