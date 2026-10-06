/**
 * Testes de Integração SUE - Regras de Acúmulo de Bônus
 * Ordem Paranormal RPG v1.3
 * 
 * FASE 7: Testes avançados cobrindo cenários complexos de
 * combinação de bônus entre múltiplas fontes (origens, trilhas,
 * poderes, rituais, condições e equipamentos).
 * 
 * Regras de Acúmulo (Livro Base v1.3):
 * - Bônus de FONTES DIFERENTES acumulam (origem + trilha + poder)
 * - Bônus da MESMA FONTE NÃO acumulam (dois rituais = maior prevalece)
 * - Exceção: Armadura + Escudo + Bônus Paranormal ACUMULAM
 * - Penalidades SEMPRE acumulam com bônus (soma algébrica)
 * 
 * @module sue-stacking-integration.vitest
 */

import { describe, it, expect } from 'vitest';
import {
  UnifiedEffect,
  EffectMechanics,
  EffectCalculationContext,
  consolidateEffects,
  EffectSource,
} from '../unified-effects-engine';

// =====================================================
// Helpers de Teste
// =====================================================

/**
 * Cria um contexto de cálculo padrão para testes de stacking
 */
function createStackingContext(overrides: Partial<EffectCalculationContext> = {}): EffectCalculationContext {
  return {
    attributes: { strength: 2, agility: 3, vigor: 2, intellect: 3, presence: 2 },
    nex: 50,
    hpCurrent: 40,
    hpMax: 50,
    peCurrent: 20,
    peMax: 25,
    inCombat: true,
    isFirstRound: false,
    currentRound: 2,
    hasShield: false,
    activeConditions: [],
    activatedEffects: [],
    ...overrides,
  };
}

/**
 * Cria um efeito unificado para testes de stacking
 */
function createStackEffect(
  id: string,
  source: EffectSource,
  sourceName: string,
  mechanics: EffectMechanics,
  overrides: Partial<UnifiedEffect> = {}
): UnifiedEffect {
  return {
    id,
    name: `Efeito ${id}`,
    source,
    sourceId: id,
    sourceName,
    mechanics,
    isActive: true,
    isToggleable: false,
    ...overrides,
  };
}

// =====================================================
// GRUPO 1: Acúmulo de Fontes Diferentes
// =====================================================

describe('SUE Stacking: Fontes Diferentes Acumulam', () => {
  it('deve acumular bônus de ataque de origem + trilha + poder de classe', () => {
    // Regra: Bônus de fontes diferentes ACUMULAM
    const effects: UnifiedEffect[] = [
      createStackEffect('origem-militar', 'origin', 'Militar', { attackBonus: 2 }),
      createStackEffect('trilha-combatente', 'track', 'Combatente', { attackBonus: 3 }),
      createStackEffect('poder-mira', 'class_power', 'Mira Aprimorada', { attackBonus: 2 }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    // 2 (origem) + 3 (trilha) + 2 (poder) = 7
    expect(result.attack.general).toBe(7);
    expect(result.attack.breakdown.length).toBe(3);
  });

  it('deve acumular bônus de dano de origem + trilha + poder geral', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('origem-lutador', 'origin', 'Lutador de Rua', { damageBonus: 2 }),
      createStackEffect('trilha-guerreiro', 'track', 'Guerreiro', { meleeDamageBonus: 3 }),
      createStackEffect('poder-ataque-poderoso', 'general_power', 'Ataque Poderoso', { damageBonus: 2 }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    // Dano geral: 2 + 2 = 4
    expect(result.damage.general).toBe(4);
    // Dano corpo a corpo adicional: 3
    expect(result.damage.melee).toBe(3);
  });

  it('deve acumular bônus de defesa de equipamento + poder + condição positiva', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('armadura-tatica', 'equipment', 'Armadura Tática', { defenseBonus: 5 }),
      createStackEffect('poder-esquiva', 'general_power', 'Esquiva Sobrenatural', { defenseBonus: 2 }),
      createStackEffect('buff-protecao', 'condition', 'Proteção Mágica', { defenseBonus: 3 }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    // 5 + 2 + 3 = 10
    expect(result.defense.general).toBe(10);
    expect(result.defense.breakdown.length).toBe(3);
  });

  it('deve acumular bônus de resistências de múltiplas fontes diferentes', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('origem-duro', 'origin', 'Duro de Matar', { fortitudeBonus: 2 }),
      createStackEffect('trilha-agil', 'track', 'Ágil', { reflexosBonus: 3 }),
      createStackEffect('poder-mente-blindada', 'class_power', 'Mente Blindada', { vontadeBonus: 4 }),
      createStackEffect('paranormal-resiliencia', 'paranormal_power', 'Resiliência Paranormal', { 
        allResistancesBonus: 1 
      }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    // Fortitude: 2 + 1 = 3
    expect(result.resistances.fortitude).toBe(3);
    // Reflexos: 3 + 1 = 4
    expect(result.resistances.reflexos).toBe(4);
    // Vontade: 4 + 1 = 5
    expect(result.resistances.vontade).toBe(5);
  });

  it('deve acumular bônus de perícia de origem + trilha + ritual', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('origem-investigador', 'origin', 'Investigador', { 
        skillBonus: { investigacao: 2 } 
      }),
      createStackEffect('trilha-perito', 'track', 'Perito Criminal', { 
        skillBonus: { investigacao: 2, percepcao: 2 } 
      }),
      createStackEffect('ritual-clarividencia', 'ritual', 'Clarividência', { 
        skillBonus: { investigacao: 3, percepcao: 1 } 
      }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    // Investigação: 2 + 2 + 3 = 7
    expect(result.skills['investigacao']?.bonus).toBe(7);
    // Percepção: 2 + 1 = 3
    expect(result.skills['percepcao']?.bonus).toBe(3);
  });
});

// =====================================================
// GRUPO 2: Mesma Fonte Não Acumula (Maior Prevalece)
// =====================================================

describe('SUE Stacking: Mesma Fonte - Maior Prevalece', () => {
  it('deve usar MAIOR bônus quando dois rituais afetam a mesma perícia', () => {
    // Regra: Rituais não acumulam entre si - maior prevalece
    const effects: UnifiedEffect[] = [
      createStackEffect('ritual-visao', 'ritual', 'Visão da Verdade', { 
        skillBonus: { percepcao: 3 } 
      }),
      createStackEffect('ritual-sentidos', 'ritual', 'Sentidos Ampliados', { 
        skillBonus: { percepcao: 5 } 
      }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    // Livro Base v1.3, p. 312: rituais não acumulam.
    expect(result.skills['percepcao']?.bonus).toBe(5);
  });

  it('deve usar MAIOR bônus de defesa quando dois rituais concedem defesa', () => {
    // Múltiplos rituais de defesa - maior prevalece
    const effects: UnifiedEffect[] = [
      createStackEffect('ritual-escudo', 'ritual', 'Escudo Arcano', { defenseBonus: 3 }),
      createStackEffect('ritual-barreira', 'ritual', 'Barreira de Energia', { defenseBonus: 5 }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    expect(result.defense.general).toBe(5); // Maior bônus de ritual.
  });

  it('deve usar MAIOR bônus de PV temporário (não acumula)', () => {
    // PV Temporário NUNCA acumula - usa o maior
    const effects: UnifiedEffect[] = [
      createStackEffect('ritual-vigor', 'ritual', 'Vigor Sobrenatural', { tempHP: 10 }),
      createStackEffect('poder-resiliencia', 'paranormal_power', 'Resiliência', { tempHP: 15 }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    // PV temporário usa Math.max() - CORRETO
    expect(result.resources.tempHP).toBe(15);
  });

  it('deve usar MAIOR bônus de equipamento quando dois itens dão ataque', () => {
    // Dois equipamentos de ataque - maior prevalece
    const effects: UnifiedEffect[] = [
      createStackEffect('arma-comum', 'equipment', 'Pistola', { attackBonus: 1 }),
      createStackEffect('arma-especial', 'equipment', 'Rifle de Precisão', { attackBonus: 2 }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    expect(result.attack.general).toBe(2); // Maior bônus de item.
  });
});

// =====================================================
// GRUPO 3: Penalidades e Bônus (Soma Algébrica)
// =====================================================

describe('SUE Stacking: Penalidades + Bônus = Soma Algébrica', () => {
  it('deve somar penalidade de condição com bônus de poder', () => {
    // Penalidades SEMPRE somam algebricamente com bônus
    const effects: UnifiedEffect[] = [
      createStackEffect('condicao-ferido', 'condition', 'Ferido', { attackBonus: -2 }),
      createStackEffect('poder-furia', 'class_power', 'Fúria de Combate', { attackBonus: 5 }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    // -2 + 5 = 3
    expect(result.attack.general).toBe(3);
  });

  it('deve somar múltiplas penalidades de condições', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('condicao-cego', 'condition', 'Cego', { 
        attackBonus: -5,
        defenseBonus: -5 
      }),
      createStackEffect('condicao-atordoado', 'condition', 'Atordoado', { 
        defenseBonus: -2 
      }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    // Ataque: -5
    expect(result.attack.general).toBe(-5);
    // Defesa: -5 + -2 = -7
    expect(result.defense.general).toBe(-7);
  });

  it('deve calcular corretamente bônus - penalidades em resistências', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('poder-resistencia', 'general_power', 'Resistência Mental', { vontadeBonus: 5 }),
      createStackEffect('condicao-abalado', 'condition', 'Abalado', { vontadeBonus: -2 }),
      createStackEffect('condicao-medo', 'condition', 'Medo', { vontadeBonus: -3 }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    // 5 - 2 - 3 = 0
    expect(result.resistances.vontade).toBe(0);
  });

  it('deve aplicar penalidade de condição Caído na defesa', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('armadura', 'equipment', 'Colete Tático', { defenseBonus: 4 }),
      createStackEffect('trilha-def', 'track', 'Defensor', { defenseBonus: 2 }),
      createStackEffect('condicao-caido', 'condition', 'Caído', { 
        defenseBonus: -5,
        cannotMove: true 
      }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    // 4 + 2 - 5 = 1
    expect(result.defense.general).toBe(1);
    expect(result.flags.cannotMove).toBe(true);
  });
});

// =====================================================
// GRUPO 4: Casos Especiais de Acúmulo
// =====================================================

describe('SUE Stacking: Casos Especiais', () => {
  it('deve acumular Armadura + Escudo + Bônus Paranormal (exceção)', () => {
    // Exceção às regras: Armadura, Escudo e Paranormal ACUMULAM
    const effects: UnifiedEffect[] = [
      createStackEffect('armadura', 'equipment', 'Armadura Pesada', { defenseBonus: 6 }),
      createStackEffect('escudo', 'equipment', 'Escudo Balístico', { defenseBonus: 4 }),
      createStackEffect('poder-forma-fumaca', 'paranormal_power', 'Forma de Fumaça', { defenseBonus: 3 }),
    ];

    const context = createStackingContext({ hasShield: true });
    const result = consolidateEffects(effects, context);

    // 6 + 4 + 3 = 13 (todos acumulam neste caso especial)
    expect(result.defense.general).toBe(13);
  });

  it('deve acumular dados extras de dano de múltiplas fontes', () => {
    // Dados extras SEMPRE acumulam (são diferentes, não bônus numéricos)
    const effects: UnifiedEffect[] = [
      createStackEffect('poder-furtivo', 'class_power', 'Ataque Furtivo', { extraDamageDice: '2d6' }),
      createStackEffect('ritual-lama', 'ritual', 'Lâmina Afiada', { extraDamageDice: '1d4' }),
      createStackEffect('poder-critico', 'general_power', 'Golpe Crítico', { extraDamageDice: '1d8' }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    expect(result.damage.extraDice).toContain('2d6');
    expect(result.damage.extraDice).toContain('1d4');
    expect(result.damage.extraDice).toContain('1d8');
    expect(result.damage.extraDice.length).toBe(3);
  });

  it('deve acumular margem de crítico de múltiplas fontes', () => {
    // Margem de ameaça acumula de todas as fontes
    const effects: UnifiedEffect[] = [
      createStackEffect('poder-critico', 'general_power', 'Golpe Mortal', { criticalMarginBonus: 2 }),
      createStackEffect('trilha-assassino', 'track', 'Assassino', { criticalMarginBonus: 1 }),
      createStackEffect('equipamento-mira', 'equipment', 'Mira Laser', { criticalMarginBonus: 1 }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    // 2 + 1 + 1 = 4
    expect(result.critical.marginBonus).toBe(4);
  });

  it('deve acumular redução de dano física e paranormal separadamente', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('armadura', 'equipment', 'Armadura Tática', { damageReduction: 5 }),
      createStackEffect('poder-couro', 'paranormal_power', 'Couro de Pedra', { damageReduction: 3 }),
      createStackEffect('poder-resistencia', 'paranormal_power', 'Resistência Paranormal', { 
        paranormalDamageReduction: 4 
      }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    // RD Física: 5 + 3 = 8
    expect(result.damageReduction.physical).toBe(8);
    // RD Paranormal: 4
    expect(result.damageReduction.paranormal).toBe(4);
  });

  it('deve acumular proficiências sem duplicatas', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('origem-militar', 'origin', 'Militar', { 
        grantsProficiency: ['armas_simples', 'armas_taticas'] 
      }),
      createStackEffect('trilha-combatente', 'track', 'Combatente', { 
        grantsProficiency: ['armas_taticas', 'armas_pesadas'] 
      }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    expect(result.proficiencies).toContain('armas_simples');
    expect(result.proficiencies).toContain('armas_taticas');
    expect(result.proficiencies).toContain('armas_pesadas');
    // Sem duplicatas
    expect(result.proficiencies.filter(p => p === 'armas_taticas').length).toBe(1);
  });
});

// =====================================================
// GRUPO 5: Bônus de HP/PE com NEX
// =====================================================

describe('SUE Stacking: Recursos com Escalamento por NEX', () => {
  it('deve calcular bônus de HP por NEX corretamente', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('origem-vigor', 'origin', 'Vigoroso', { hpBonus: 5 }),
      createStackEffect('poder-constituicao', 'class_power', 'Constituição de Ferro', { 
        hpBonusPerNex: 1 // +1 PV por 5% de NEX
      }),
    ];

    // NEX 50% = 10 incrementos de 5%
    const result = consolidateEffects(effects, createStackingContext({ nex: 50 }));

    // 5 (fixo) + 10 (1 * 10) = 15
    expect(result.resources.hpBonus).toBe(15);
  });

  it('deve calcular bônus de PE por NEX corretamente', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('classe-ocultista', 'class_ability', 'Ocultista', { 
        peBonusPerNex: 1 // +1 PE por 5% de NEX
      }),
      createStackEffect('poder-reserva', 'general_power', 'Reserva de Energia', { peBonus: 3 }),
    ];

    // NEX 65% = 13 incrementos de 5%
    const context = createStackingContext({ nex: 65 });
    const result = consolidateEffects(effects, context);

    // 13 (1 * 13) + 3 = 16
    expect(result.resources.peBonus).toBe(16);
  });

  it('deve acumular múltiplos bônus por NEX', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('trilha-a', 'track', 'Trilha A', { hpBonusPerNex: 1 }),
      createStackEffect('poder-b', 'class_power', 'Poder B', { hpBonusPerNex: 1 }),
      createStackEffect('origem-c', 'origin', 'Origem C', { hpBonus: 10 }),
    ];

    // NEX 30% = 6 incrementos de 5%
    const context = createStackingContext({ nex: 30 });
    const result = consolidateEffects(effects, context);

    // 6 (1 * 6) + 6 (1 * 6) + 10 = 22
    expect(result.resources.hpBonus).toBe(22);
  });
});

// =====================================================
// GRUPO 6: Breakdown e Rastreabilidade
// =====================================================

describe('SUE Stacking: Breakdown de Fontes', () => {
  it('deve registrar todas as fontes no breakdown de ataque', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('origem-a', 'origin', 'Origem A', { attackBonus: 2 }),
      createStackEffect('trilha-b', 'track', 'Trilha B', { attackBonus: 3 }),
      createStackEffect('poder-c', 'general_power', 'Poder C', { attackBonus: 1 }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    const sources = result.attack.breakdown.map(b => b.source);
    expect(sources).toContain('Origem A');
    expect(sources).toContain('Trilha B');
    expect(sources).toContain('Poder C');
  });

  it('deve registrar valores corretos no breakdown de defesa', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('armadura', 'equipment', 'Armadura Leve', { defenseBonus: 3 }),
      createStackEffect('condicao', 'condition', 'Abalado', { defenseBonus: -1 }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    const armaduraEntry = result.defense.breakdown.find(b => b.source === 'Armadura Leve');
    const condicaoEntry = result.defense.breakdown.find(b => b.source === 'Abalado');

    expect(armaduraEntry?.value).toBe(3);
    expect(condicaoEntry?.value).toBe(-1);
    expect(result.defense.general).toBe(2);
  });

  it('deve registrar fontes de resistências por tipo', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('origem', 'origin', 'Resistente', { fortitudeBonus: 2 }),
      createStackEffect('poder', 'class_power', 'Reflexos Rápidos', { reflexosBonus: 3 }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    const fortitudeBreakdown = result.resistances.breakdown.filter(b => b.resistance === 'fortitude');
    const reflexosBreakdown = result.resistances.breakdown.filter(b => b.resistance === 'reflexos');

    expect(fortitudeBreakdown.length).toBeGreaterThan(0);
    expect(reflexosBreakdown.length).toBeGreaterThan(0);
  });
});

// =====================================================
// GRUPO 7: Movimento e Iniciativa
// =====================================================

describe('SUE Stacking: Movimento e Iniciativa', () => {
  it('deve acumular bônus de movimento de múltiplas fontes', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('origem-veloz', 'origin', 'Velocista', { movementBonus: 3 }),
      createStackEffect('ritual-velocidade', 'ritual', 'Velocidade', { movementBonus: 6 }),
      createStackEffect('poder-corredor', 'general_power', 'Corredor', { movementBonus: 1.5 }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    // 3 + 6 + 1.5 = 10.5
    expect(result.movement.bonus).toBe(10.5);
  });

  it('deve aplicar multiplicador de movimento corretamente', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('movimento-base', 'origin', 'Normal', { movementBonus: 9 }),
      createStackEffect('ritual-velocidade', 'ritual', 'Velocidade Mortal', { movementMultiplier: 2 }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    expect(result.movement.bonus).toBe(9);
    expect(result.movement.multiplier).toBe(2);
  });

  it('deve acumular bônus de iniciativa de múltiplas fontes', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('origem-alerta', 'origin', 'Alerta', { initiativeBonus: 2 }),
      createStackEffect('poder-reflexos', 'general_power', 'Reflexos de Combate', { initiativeBonus: 4 }),
      createStackEffect('trilha-rapido', 'track', 'Primeiro a Agir', { initiativeBonus: 2 }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    // 2 + 4 + 2 = 8
    expect(result.initiative.bonus).toBe(8);
    expect(result.initiative.breakdown.length).toBe(3);
  });
});

// =====================================================
// GRUPO 8: Efeitos Especiais (Não Numéricos)
// =====================================================

describe('SUE Stacking: Efeitos Especiais', () => {
  it('deve coletar todos os efeitos especiais de múltiplas fontes', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('poder-a', 'class_power', 'Poder A', { 
        specialEffects: ['Ignora cobertura parcial'] 
      }),
      createStackEffect('poder-b', 'class_power', 'Poder B', { 
        specialEffects: ['Pode atacar através de paredes'] 
      }),
      createStackEffect('ritual-c', 'ritual', 'Ritual C', { 
        specialEffects: ['Causa dano de fogo'] 
      }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    expect(result.specialEffects.length).toBe(3);
    expect(result.specialEffects.some(e => e.effect === 'Ignora cobertura parcial')).toBe(true);
    expect(result.specialEffects.some(e => e.effect === 'Pode atacar através de paredes')).toBe(true);
    expect(result.specialEffects.some(e => e.effect === 'Causa dano de fogo')).toBe(true);
  });

  it('deve manter efeitos especiais com suas fontes', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('origem-sensitivo', 'origin', 'Sensitivo', { 
        specialEffects: ['Pode sentir presenças paranormais'] 
      }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    expect(result.specialEffects[0].source).toBe('Sensitivo');
    expect(result.specialEffects[0].effect).toBe('Pode sentir presenças paranormais');
  });
});

// =====================================================
// GRUPO 9: Flags de Comportamento
// =====================================================

describe('SUE Stacking: Flags de Comportamento', () => {
  it('deve ativar cannotAct se qualquer efeito definir', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('buff-forca', 'ritual', 'Força', { damageBonus: 5 }),
      createStackEffect('condicao-paralisado', 'condition', 'Paralisado', { cannotAct: true }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    expect(result.flags.cannotAct).toBe(true);
    expect(result.damage.general).toBe(5); // Outros efeitos ainda aplicam
  });

  it('deve combinar múltiplas flags de condições', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('condicao-agarrado', 'condition', 'Agarrado', { 
        cannotMove: true,
        defenseBonus: -2 
      }),
      createStackEffect('condicao-atordoado', 'condition', 'Atordoado', { 
        cannotReact: true,
        defenseBonus: -2 
      }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    expect(result.flags.cannotMove).toBe(true);
    expect(result.flags.cannotReact).toBe(true);
    expect(result.defense.general).toBe(-4);
  });

  it('deve marcar isHelpless e isUnconscious corretamente', () => {
    const effects: UnifiedEffect[] = [
      createStackEffect('condicao-inconsciente', 'condition', 'Inconsciente', { 
        isUnconscious: true,
        isHelpless: true,
        cannotAct: true,
        cannotReact: true,
        cannotMove: true 
      }),
    ];

    const result = consolidateEffects(effects, createStackingContext());

    expect(result.flags.isUnconscious).toBe(true);
    expect(result.flags.isHelpless).toBe(true);
    expect(result.flags.cannotAct).toBe(true);
    expect(result.flags.cannotReact).toBe(true);
    expect(result.flags.cannotMove).toBe(true);
  });
});
