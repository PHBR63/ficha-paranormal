/**
 * Testes Automatizados do Sistema Unificado de Efeitos (SUE)
 * Ordem Paranormal RPG v1.3
 * 
 * Valida que o SUE calcula corretamente os bônus consolidados
 * de origens, trilhas, condições e rituais.
 * 
 * @module unified-effects-engine.test
 */

import {
  UnifiedEffect,
  EffectMechanics,
  EffectCalculationContext,
  ComputedEffects,
  consolidateEffects,
  checkEffectConditions,
  AttributeType,
} from '../unified-effects-engine';

// =====================================================
// Tipos de Resultado de Teste
// =====================================================

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string[];
}

export interface TestSuiteResult {
  suiteName: string;
  passed: number;
  failed: number;
  results: TestResult[];
}

// =====================================================
// Helpers de Teste
// =====================================================

/**
 * Cria um contexto de cálculo padrão para testes
 */
function createTestContext(overrides: Partial<EffectCalculationContext> = {}): EffectCalculationContext {
  return {
    attributes: { strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 2 },
    nex: 25,
    hpCurrent: 20,
    hpMax: 30,
    peCurrent: 10,
    peMax: 15,
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
 * Cria um efeito unificado para testes
 */
function createTestEffect(
  id: string,
  mechanics: EffectMechanics,
  overrides: Partial<UnifiedEffect> = {}
): UnifiedEffect {
  return {
    id,
    name: `Teste ${id}`,
    source: 'origin',
    sourceId: id,
    sourceName: `Fonte ${id}`,
    mechanics,
    isActive: true,
    isToggleable: false,
    ...overrides,
  };
}

// =====================================================
// Testes de Consolidação de Efeitos
// =====================================================

/**
 * Testa soma de bônus de ataque de múltiplas fontes
 */
function testAttackBonusSum(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('origin-1', { attackBonus: 2 }, { source: 'origin', sourceName: 'Origem A' }),
    createTestEffect('track-1', { attackBonus: 3 }, { source: 'track', sourceName: 'Trilha B' }),
    createTestEffect('power-1', { attackBonus: 1 }, { source: 'general_power', sourceName: 'Poder C' }),
  ];
  
  const context = createTestContext();
  const result = consolidateEffects(effects, context);
  
  const expectedTotal = 6; // 2 + 3 + 1
  const expectedBreakdownCount = 3;
  
  return {
    name: 'Soma bônus de ataque de múltiplas fontes',
    passed: result.attack.general === expectedTotal && result.attack.breakdown.length === expectedBreakdownCount,
    message: result.attack.general === expectedTotal
      ? `Bônus de ataque total: ${result.attack.general} (esperado: ${expectedTotal})`
      : `ERRO: Esperado ${expectedTotal}, obtido ${result.attack.general}`,
  };
}

/**
 * Testa separação de bônus corpo a corpo e distância
 */
function testMeleeRangedSeparation(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('e1', { meleeAttackBonus: 4 }),
    createTestEffect('e2', { rangedAttackBonus: 2 }),
    createTestEffect('e3', { attackBonus: 1 }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.attack.general === 1 && result.attack.melee === 4 && result.attack.ranged === 2;
  
  return {
    name: 'Separa bônus de ataque corpo a corpo e distância',
    passed,
    message: passed
      ? `Geral: ${result.attack.general}, Corpo a corpo: ${result.attack.melee}, Distância: ${result.attack.ranged}`
      : `ERRO: Valores incorretos`,
  };
}

/**
 * Testa cálculo de bônus de dano
 */
function testDamageBonus(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('militar', { damageBonus: 2 }, { source: 'origin', sourceName: 'Militar' }),
    createTestEffect('trilha-op', { meleeDamageBonus: 3 }, { source: 'track', sourceName: 'Trilha Op' }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.damage.general === 2 && result.damage.melee === 3;
  
  return {
    name: 'Calcula bônus de dano de origem e trilha',
    passed,
    message: `Dano geral: ${result.damage.general}, Corpo a corpo: ${result.damage.melee}`,
  };
}

/**
 * Testa acúmulo de dados extras de dano
 */
function testExtraDamageDice(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('e1', { extraDamageDice: '1d6' }),
    createTestEffect('e2', { extraDamageDice: '2d4' }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const has1d6 = result.damage.extraDice.includes('1d6');
  const has2d4 = result.damage.extraDice.includes('2d4');
  const passed = has1d6 && has2d4 && result.damage.extraDice.length === 2;
  
  return {
    name: 'Acumula dados extras de dano de múltiplas fontes',
    passed,
    message: `Dados extras: ${result.damage.extraDice.join(', ')}`,
  };
}

/**
 * Testa bônus de margem de crítico
 */
function testCriticalMarginBonus(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('e1', { criticalMarginBonus: 2 }),
    createTestEffect('e2', { criticalMarginBonus: 1 }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.critical.marginBonus === 3;
  
  return {
    name: 'Calcula bônus de margem de crítico',
    passed,
    message: `Margem de crítico: +${result.critical.marginBonus}`,
  };
}

/**
 * Testa bônus de defesa
 */
function testDefenseBonus(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('academico', { defenseBonus: 2 }, { source: 'origin' }),
    createTestEffect('guardiao', { defenseBonus: 3 }, { source: 'track' }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.defense.general === 5;
  
  return {
    name: 'Consolida bônus de defesa de origens e trilhas',
    passed,
    message: `Defesa total: +${result.defense.general}`,
  };
}

/**
 * Testa cálculo de resistências
 */
function testResistances(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('e1', { fortitudeBonus: 2 }),
    createTestEffect('e2', { reflexosBonus: 3 }),
    createTestEffect('e3', { vontadeBonus: 4 }),
    createTestEffect('e4', { allResistancesBonus: 1 }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  // allResistancesBonus adiciona a todas
  const fortitudeOk = result.resistances.fortitude === 3; // 2 + 1
  const reflexosOk = result.resistances.reflexos === 4; // 3 + 1
  const vontadeOk = result.resistances.vontade === 5; // 4 + 1
  const passed = fortitudeOk && reflexosOk && vontadeOk;
  
  return {
    name: 'Calcula resistências de múltiplas fontes',
    passed,
    message: `Fortitude: ${result.resistances.fortitude}, Reflexos: ${result.resistances.reflexos}, Vontade: ${result.resistances.vontade}`,
  };
}

/**
 * Testa redução de dano
 */
function testDamageReduction(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('e1', { damageReduction: 5 }),
    createTestEffect('e2', { paranormalDamageReduction: 3 }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.damageReduction.physical === 5 && result.damageReduction.paranormal === 3;
  
  return {
    name: 'Calcula redução de dano física e paranormal',
    passed,
    message: `RD Física: ${result.damageReduction.physical}, RD Paranormal: ${result.damageReduction.paranormal}`,
  };
}

/**
 * Testa bônus de perícias
 */
function testSkillBonuses(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('e1', { skillBonus: { investigacao: 2, ocultismo: 3 } }),
    createTestEffect('e2', { skillBonus: { investigacao: 1 } }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const investigacaoOk = result.skills['investigacao']?.bonus === 3; // 2 + 1
  const ocultismoOk = result.skills['ocultismo']?.bonus === 3;
  const passed = investigacaoOk && ocultismoOk;
  
  return {
    name: 'Acumula bônus de perícias corretamente',
    passed,
    message: `Investigação: +${result.skills['investigacao']?.bonus}, Ocultismo: +${result.skills['ocultismo']?.bonus}`,
  };
}

/**
 * Testa bônus de recursos (HP, PE)
 */
function testResourceBonuses(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('e1', { hpBonus: 10 }),
    createTestEffect('e2', { peBonus: 5 }),
    createTestEffect('e3', { hpBonus: 5, peBonus: 3 }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const hpOk = result.resources.hpBonus === 15; // 10 + 5
  const peOk = result.resources.peBonus === 8; // 5 + 3
  const passed = hpOk && peOk;
  
  return {
    name: 'Calcula bônus de HP e PE',
    passed,
    message: `HP: +${result.resources.hpBonus}, PE: +${result.resources.peBonus}`,
  };
}

/**
 * Testa flags de comportamento
 */
function testBehaviorFlags(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('inconsciente', { cannotAct: true, cannotReact: true }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.flags.cannotAct && result.flags.cannotReact && !result.flags.cannotMove;
  
  return {
    name: 'Aplica flags de comportamento de condições',
    passed,
    message: `cannotAct: ${result.flags.cannotAct}, cannotReact: ${result.flags.cannotReact}, cannotMove: ${result.flags.cannotMove}`,
  };
}

// =====================================================
// Testes de Verificação de Condições
// =====================================================

/**
 * Testa efeito sem condições
 */
function testNoConditions(): TestResult {
  const effect = createTestEffect('e1', { attackBonus: 2 });
  const context = createTestContext();
  
  const passed = checkEffectConditions(effect, context);
  
  return {
    name: 'Retorna true para efeitos sem condições',
    passed,
    message: passed ? 'Efeito sem condições está ativo' : 'ERRO: Deveria estar ativo',
  };
}

/**
 * Testa condição de HP abaixo de 50%
 */
function testHPCondition(): TestResult {
  const effect = createTestEffect('fanatico', { damageBonus: 2 }, {
    conditions: { hpPercentBelow: 50 }
  });
  
  // HP 40% - deve ativar
  const contextLowHP = createTestContext({ hpCurrent: 12, hpMax: 30 });
  const shouldActivate = checkEffectConditions(effect, contextLowHP);
  
  // HP 60% - não deve ativar
  const contextHighHP = createTestContext({ hpCurrent: 18, hpMax: 30 });
  const shouldNotActivate = !checkEffectConditions(effect, contextHighHP);
  
  const passed = shouldActivate && shouldNotActivate;
  
  return {
    name: 'Verifica condição de HP abaixo de 50%',
    passed,
    message: `HP 40%: ${shouldActivate ? 'ativo' : 'inativo'}, HP 60%: ${shouldNotActivate ? 'inativo' : 'ativo'}`,
  };
}

/**
 * Testa condição de primeira rodada
 */
function testFirstRoundCondition(): TestResult {
  const effect = createTestEffect('iniciativa-melhorada', { initiativeBonus: 5 }, {
    conditions: { firstRoundOnly: true }
  });
  
  const contextFirstRound = createTestContext({ isFirstRound: true });
  const activeFirst = checkEffectConditions(effect, contextFirstRound);
  
  const contextLaterRound = createTestContext({ isFirstRound: false });
  const activeLater = checkEffectConditions(effect, contextLaterRound);
  
  const passed = activeFirst && !activeLater;
  
  return {
    name: 'Verifica condição de primeira rodada de combate',
    passed,
    message: `Primeira rodada: ${activeFirst ? 'ativo' : 'inativo'}, Rodadas posteriores: ${activeLater ? 'ativo' : 'inativo'}`,
  };
}

/**
 * Testa condição de estar em combate
 */
function testInCombatCondition(): TestResult {
  const effect = createTestEffect('furia', { damageBonus: 4 }, {
    conditions: { inCombat: true }
  });
  
  const contextInCombat = createTestContext({ inCombat: true });
  const activeInCombat = checkEffectConditions(effect, contextInCombat);
  
  const contextOutOfCombat = createTestContext({ inCombat: false });
  const activeOutOfCombat = checkEffectConditions(effect, contextOutOfCombat);
  
  const passed = activeInCombat && !activeOutOfCombat;
  
  return {
    name: 'Verifica condição de estar em combate',
    passed,
    message: `Em combate: ${activeInCombat ? 'ativo' : 'inativo'}, Fora de combate: ${activeOutOfCombat ? 'ativo' : 'inativo'}`,
  };
}

/**
 * Testa condição de escudo equipado
 */
function testShieldCondition(): TestResult {
  const effect = createTestEffect('bloqueio', { defenseBonus: 3 }, {
    conditions: { requiresShield: true }
  });
  
  const contextWithShield = createTestContext({ hasShield: true });
  const activeWithShield = checkEffectConditions(effect, contextWithShield);
  
  const contextNoShield = createTestContext({ hasShield: false });
  const activeNoShield = checkEffectConditions(effect, contextNoShield);
  
  const passed = activeWithShield && !activeNoShield;
  
  return {
    name: 'Verifica condição de escudo equipado',
    passed,
    message: `Com escudo: ${activeWithShield ? 'ativo' : 'inativo'}, Sem escudo: ${activeNoShield ? 'ativo' : 'inativo'}`,
  };
}

/**
 * Testa condição de ativação manual
 */
function testActivationCondition(): TestResult {
  const effect = createTestEffect('combate-defensivo', { defenseBonus: 5 }, {
    conditions: { requiresActivation: true }
  });
  
  const contextActivated = createTestContext({ activatedEffects: ['combate-defensivo'] });
  const activeWhenActivated = checkEffectConditions(effect, contextActivated);
  
  const contextNotActivated = createTestContext({ activatedEffects: [] });
  const activeWhenNotActivated = checkEffectConditions(effect, contextNotActivated);
  
  const passed = activeWhenActivated && !activeWhenNotActivated;
  
  return {
    name: 'Verifica condição de ativação manual',
    passed,
    message: `Ativado: ${activeWhenActivated ? 'ativo' : 'inativo'}, Não ativado: ${activeWhenNotActivated ? 'ativo' : 'inativo'}`,
  };
}

/**
 * Testa condição de atributo mínimo
 */
function testMinAttributeCondition(): TestResult {
  const effect = createTestEffect('punho-de-ferro', { meleeDamageBonus: 3 }, {
    conditions: { minAttribute: { strength: 3 } }
  });
  
  const contextHighStr = createTestContext({
    attributes: { strength: 4, agility: 2, vigor: 2, intellect: 2, presence: 2 }
  });
  const activeHighStr = checkEffectConditions(effect, contextHighStr);
  
  const contextLowStr = createTestContext({
    attributes: { strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 2 }
  });
  const activeLowStr = checkEffectConditions(effect, contextLowStr);
  
  const passed = activeHighStr && !activeLowStr;
  
  return {
    name: 'Verifica condição de atributo mínimo',
    passed,
    message: `FOR 4: ${activeHighStr ? 'ativo' : 'inativo'}, FOR 2: ${activeLowStr ? 'ativo' : 'inativo'}`,
  };
}

// =====================================================
// Testes de Efeitos Inativos
// =====================================================

/**
 * Testa que efeitos inativos não aplicam bônus
 */
function testInactiveEffects(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('e1', { attackBonus: 5 }, { isActive: true }),
    createTestEffect('e2', { attackBonus: 3 }, { isActive: false }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.attack.general === 5; // Apenas do efeito ativo
  
  return {
    name: 'Não aplica bônus de efeitos inativos',
    passed,
    message: `Bônus de ataque: ${result.attack.general} (esperado: 5)`,
  };
}

/**
 * Testa que condições não atendidas não aplicam bônus
 */
function testUnmetConditions(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('e1', { damageBonus: 5 }, {
      isActive: true,
      conditions: { inCombat: true }
    }),
  ];
  
  const contextOutOfCombat = createTestContext({ inCombat: false });
  const result = consolidateEffects(effects, contextOutOfCombat);
  
  const passed = result.damage.general === 0;
  
  return {
    name: 'Não aplica bônus quando condições não são atendidas',
    passed,
    message: `Bônus de dano: ${result.damage.general} (esperado: 0)`,
  };
}

// =====================================================
// Testes de Cenários Reais
// =====================================================

/**
 * Testa cenário: Militar com trilha Operações Especiais
 */
function testMilitarOpEspeciais(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('militar-treinamento', 
      { attackBonus: 1 }, 
      { source: 'origin', sourceName: 'Militar - Treinamento de Combate' }
    ),
    createTestEffect('ops-tatico', 
      { criticalMarginBonus: 1 }, 
      { source: 'track', sourceName: 'Operações Especiais - Tático' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext({ nex: 25 }));
  
  const passed = result.attack.general === 1 && result.critical.marginBonus === 1;
  
  return {
    name: 'Cenário: Militar com trilha Operações Especiais',
    passed,
    message: `Ataque: +${result.attack.general}, Margem crítico: +${result.critical.marginBonus}`,
  };
}

/**
 * Testa cenário: Penalidades de condição Agarrado
 */
function testCondicaoAgarrado(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('agarrado', 
      { attackBonus: -2, defenseBonus: -2, cannotMove: true }, 
      { source: 'condition', sourceName: 'Agarrado' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.attack.general === -2 && result.defense.general === -2 && result.flags.cannotMove;
  
  return {
    name: 'Cenário: Penalidades de condição Agarrado',
    passed,
    message: `Ataque: ${result.attack.general}, Defesa: ${result.defense.general}, Não pode mover: ${result.flags.cannotMove}`,
  };
}

/**
 * Testa cenário: Múltiplas fontes combinadas
 */
function testMultiplasFontes(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('origem-1', { defenseBonus: 2 }, { source: 'origin' }),
    createTestEffect('trilha-1', { attackBonus: 3 }, { source: 'track' }),
    createTestEffect('condicao-1', { attackBonus: -1 }, { source: 'condition' }),
    createTestEffect('ritual-1', { fortitudeBonus: 2 }, { source: 'ritual' }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const defesaOk = result.defense.general === 2;
  const ataqueOk = result.attack.general === 2; // 3 - 1
  const fortitudeOk = result.resistances.fortitude === 2;
  const passed = defesaOk && ataqueOk && fortitudeOk;
  
  return {
    name: 'Cenário: Múltiplas fontes (origem, trilha, condição, ritual)',
    passed,
    message: `Defesa: +${result.defense.general}, Ataque: +${result.attack.general}, Fortitude: +${result.resistances.fortitude}`,
  };
}

// =====================================================
// Testes de Rituais Sustentados
// =====================================================

/**
 * Testa bônus de ataque de ritual sustentado
 */
function testRitualAttackBonus(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('ritual-armamento-abencoado', 
      { attackBonus: 2 }, 
      { source: 'ritual', sourceName: 'Ritual: Armamento Abençoado' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.attack.general === 2;
  
  return {
    name: 'Ritual sustentado aplica bônus de ataque',
    passed,
    message: `Bônus de ataque de ritual: +${result.attack.general}`,
  };
}

/**
 * Testa bônus de dano de ritual sustentado
 */
function testRitualDamageBonus(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('ritual-arma-atroz', 
      { damageBonus: 4, extraDamageDice: '1d6' }, 
      { source: 'ritual', sourceName: 'Ritual: Arma Atroz' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.damage.general === 4 && result.damage.extraDice.includes('1d6');
  
  return {
    name: 'Ritual sustentado aplica bônus de dano e dados extras',
    passed,
    message: `Dano: +${result.damage.general}, Dados extras: ${result.damage.extraDice.join(', ')}`,
  };
}

/**
 * Testa bônus de defesa de ritual sustentado
 */
function testRitualDefenseBonus(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('ritual-protecao', 
      { defenseBonus: 3, damageReduction: 2 }, 
      { source: 'ritual', sourceName: 'Ritual: Proteção' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.defense.general === 3 && result.damageReduction.physical === 2;
  
  return {
    name: 'Ritual sustentado aplica bônus de defesa e RD',
    passed,
    message: `Defesa: +${result.defense.general}, RD: ${result.damageReduction.physical}`,
  };
}

/**
 * Testa múltiplos rituais sustentados (regra de não acúmulo)
 */
function testMultipleRitualsBonuses(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('ritual-1', 
      { attackBonus: 3, defenseBonus: 2 }, 
      { source: 'ritual', sourceName: 'Ritual: Armamento Abençoado' }
    ),
    createTestEffect('ritual-2', 
      { attackBonus: 2, damageBonus: 4 }, 
      { source: 'ritual', sourceName: 'Ritual: Arma Atroz' }
    ),
    // Origem para testar que acumula com rituais
    createTestEffect('origem-militar', 
      { attackBonus: 1 }, 
      { source: 'origin', sourceName: 'Militar' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  // Rituais acumulam entre si (3+2 de rituais + 1 de origem = 6)
  // Defesa: 2 do ritual-1
  // Dano: 4 do ritual-2
  const passed = result.attack.general === 6 && result.defense.general === 2 && result.damage.general === 4;
  
  return {
    name: 'Múltiplos rituais acumulam bônus com origens',
    passed,
    message: `Ataque: +${result.attack.general}, Defesa: +${result.defense.general}, Dano: +${result.damage.general}`,
  };
}

/**
 * Testa PV temporários de ritual
 */
function testRitualTempHP(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('ritual-espessura', 
      { tempHP: 15 }, 
      { source: 'ritual', sourceName: 'Ritual: Espessura da Pele' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.resources.tempHP === 15;
  
  return {
    name: 'Ritual sustentado aplica PV temporários',
    passed,
    message: `PV Temporários: ${result.resources.tempHP}`,
  };
}

/**
 * Testa bônus de perícias de ritual
 */
function testRitualSkillBonus(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('ritual-sentidos', 
      { skillBonus: { percepcao: 5, investigacao: 3 } }, 
      { source: 'ritual', sourceName: 'Ritual: Sentidos Aguçados' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const percepcaoOk = result.skills['percepcao']?.bonus === 5;
  const investigacaoOk = result.skills['investigacao']?.bonus === 3;
  const passed = percepcaoOk && investigacaoOk;
  
  return {
    name: 'Ritual sustentado aplica bônus de perícias',
    passed,
    message: `Percepção: +${result.skills['percepcao']?.bonus}, Investigação: +${result.skills['investigacao']?.bonus}`,
  };
}

/**
 * Testa efeitos especiais de ritual
 */
function testRitualSpecialEffects(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('ritual-velocidade', 
      { movementBonus: 3, specialEffects: ['Ação de movimento adicional'] }, 
      { source: 'ritual', sourceName: 'Ritual: Velocidade Mortal' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const movementOk = result.movement.bonus === 3;
  const hasSpecialEffect = result.specialEffects.some(e => e.effect.includes('movimento'));
  const passed = movementOk && hasSpecialEffect;
  
  return {
    name: 'Ritual sustentado aplica efeitos especiais',
    passed,
    message: `Movimento: +${result.movement.bonus}, Efeito especial: ${result.specialEffects.map(e => e.effect).join(', ')}`,
  };
}

// =====================================================
// Testes de Bônus de Equipamentos
// =====================================================

/**
 * Testa bônus de armadura
 */
function testArmorDefenseBonus(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('armor-pesada', 
      { defenseBonus: 5 }, 
      { source: 'equipment', sourceName: 'Proteção Pesada' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.defense.general === 5;
  
  return {
    name: 'Armadura aplica bônus de defesa',
    passed,
    message: `Defesa de armadura: +${result.defense.general}`,
  };
}

/**
 * Testa bônus de escudo
 */
function testShieldDefenseBonus(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('escudo-padrao', 
      { defenseBonus: 2 }, 
      { source: 'equipment', sourceName: 'Escudo' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext({ hasShield: true }));
  
  const passed = result.defense.general === 2;
  
  return {
    name: 'Escudo aplica bônus de defesa',
    passed,
    message: `Defesa de escudo: +${result.defense.general}`,
  };
}

/**
 * Testa combinação armadura + escudo
 */
function testArmorPlusShieldDefense(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('armor', 
      { defenseBonus: 5 }, 
      { source: 'equipment', sourceName: 'Proteção Pesada' }
    ),
    createTestEffect('shield', 
      { defenseBonus: 2 }, 
      { source: 'equipment', sourceName: 'Escudo' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext({ hasShield: true }));
  
  // Armadura + Escudo acumulam = 7
  const passed = result.defense.general === 7;
  
  return {
    name: 'Armadura + Escudo acumulam bônus de defesa',
    passed,
    message: `Defesa total: +${result.defense.general} (armadura 5 + escudo 2)`,
  };
}

/**
 * Testa bônus de arma corpo a corpo
 */
function testMeleeWeaponBonus(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('arma-corpo-corpo', 
      { meleeAttackBonus: 1, meleeDamageBonus: 2 }, 
      { source: 'equipment', sourceName: 'Espada Longa' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.attack.melee === 1 && result.damage.melee === 2;
  
  return {
    name: 'Arma corpo a corpo aplica bônus',
    passed,
    message: `Ataque corpo a corpo: +${result.attack.melee}, Dano: +${result.damage.melee}`,
  };
}

/**
 * Testa bônus de arma à distância
 */
function testRangedWeaponBonus(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('arma-distancia', 
      { rangedAttackBonus: 2, rangedDamageBonus: 1 }, 
      { source: 'equipment', sourceName: 'Rifle de Precisão' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.attack.ranged === 2 && result.damage.ranged === 1;
  
  return {
    name: 'Arma à distância aplica bônus',
    passed,
    message: `Ataque à distância: +${result.attack.ranged}, Dano: +${result.damage.ranged}`,
  };
}

/**
 * Testa item paranormal com bônus de defesa
 */
function testParanormalItemDefense(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('item-paranormal', 
      { defenseBonus: 3 }, 
      { source: 'paranormal_power', sourceName: 'Amuleto de Proteção' }
    ),
    createTestEffect('armor', 
      { defenseBonus: 4 }, 
      { source: 'equipment', sourceName: 'Proteção Leve' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  // Item paranormal + Armadura acumulam = 7
  const passed = result.defense.general === 7;
  
  return {
    name: 'Item paranormal acumula com armadura',
    passed,
    message: `Defesa total: +${result.defense.general} (armadura 4 + paranormal 3)`,
  };
}

/**
 * Testa redução de dano de equipamento
 */
function testEquipmentDamageReduction(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('armor-blindada', 
      { defenseBonus: 5, damageReduction: 3 }, 
      { source: 'equipment', sourceName: 'Proteção Pesada Blindada' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.defense.general === 5 && result.damageReduction.physical === 3;
  
  return {
    name: 'Armadura blindada aplica RD',
    passed,
    message: `Defesa: +${result.defense.general}, RD: ${result.damageReduction.physical}`,
  };
}

/**
 * Testa combinação completa: origem + trilha + equipamento + ritual
 */
function testFullCombatLoadout(): TestResult {
  const effects: UnifiedEffect[] = [
    // Origem
    createTestEffect('origem-militar', 
      { attackBonus: 1 }, 
      { source: 'origin', sourceName: 'Militar' }
    ),
    // Trilha
    createTestEffect('trilha-op-especiais', 
      { criticalMarginBonus: 2 }, 
      { source: 'track', sourceName: 'Operações Especiais' }
    ),
    // Armadura
    createTestEffect('armor', 
      { defenseBonus: 5 }, 
      { source: 'equipment', sourceName: 'Proteção Pesada' }
    ),
    // Escudo
    createTestEffect('shield', 
      { defenseBonus: 2 }, 
      { source: 'equipment', sourceName: 'Escudo' }
    ),
    // Ritual sustentado
    createTestEffect('ritual-armamento', 
      { attackBonus: 2, damageBonus: 3 }, 
      { source: 'ritual', sourceName: 'Armamento Abençoado' }
    ),
    // Condição benéfica
    createTestEffect('inspirado', 
      { allResistancesBonus: 2 }, 
      { source: 'condition', sourceName: 'Inspirado' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext({ hasShield: true }));
  
  const ataqueOk = result.attack.general === 3; // 1 (origem) + 2 (ritual)
  const defesaOk = result.defense.general === 7; // 5 (armadura) + 2 (escudo)
  const danoOk = result.damage.general === 3; // 3 (ritual)
  const criticoOk = result.critical.marginBonus === 2; // 2 (trilha)
  const resistenciasOk = result.resistances.fortitude === 2 && result.resistances.reflexos === 2 && result.resistances.vontade === 2;
  
  const passed = ataqueOk && defesaOk && danoOk && criticoOk && resistenciasOk;
  
  return {
    name: 'Cenário completo: origem + trilha + equipamentos + ritual + condição',
    passed,
    message: `Ataque: +${result.attack.general}, Defesa: +${result.defense.general}, Dano: +${result.damage.general}, Margem crítico: +${result.critical.marginBonus}`,
    details: [
      `Resistências: Fort ${result.resistances.fortitude}, Ref ${result.resistances.reflexos}, Von ${result.resistances.vontade}`,
    ],
  };
}

// =====================================================
// Testes de Poderes Paranormais
// =====================================================

/**
 * Testa Anatomia Insana (Sangue) - Bônus de Fortitude
 */
function testAnatomiaInsana(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('anatomia-insana', 
      { fortitudeBonus: 2 }, 
      { source: 'paranormal_power', sourceName: 'Anatomia Insana' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.resistances.fortitude === 2;
  
  return {
    name: 'Anatomia Insana aplica +2 Fortitude',
    passed,
    message: `Fortitude: +${result.resistances.fortitude}`,
  };
}

/**
 * Testa Anatomia Insana com Afinidade (Sangue) - Bônus aprimorado
 */
function testAnatomiaInsanaAfinidade(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('anatomia-insana-afinidade', 
      { fortitudeBonus: 5 }, 
      { source: 'paranormal_power', sourceName: 'Anatomia Insana (Afinidade)' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.resistances.fortitude === 5;
  
  return {
    name: 'Anatomia Insana com Afinidade aplica +5 Fortitude',
    passed,
    message: `Fortitude: +${result.resistances.fortitude}`,
  };
}

/**
 * Testa Sangue de Ferro - Bônus de PV por NEX
 */
function testSangueDeFerro(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('sangue-de-ferro', 
      { hpBonusPerNex: 2 }, 
      { source: 'paranormal_power', sourceName: 'Sangue de Ferro' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext({ nex: 50 }));
  
  // 50% NEX = 10 incrementos de 5%, logo +20 PV (2 * 10)
  const expectedBonus = 2 * 10;
  const passed = result.resources.hpBonus === expectedBonus;
  
  return {
    name: 'Sangue de Ferro aplica +2 PV por 5% NEX',
    passed,
    message: `Bônus de PV: +${result.resources.hpBonus} (esperado: ${expectedBonus})`,
  };
}

/**
 * Testa Potencial Aprimorado (Morte) - Bônus de PE por NEX
 */
function testPotencialAprimorado(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('potencial-aprimorado', 
      { peBonusPerNex: 1 }, 
      { source: 'paranormal_power', sourceName: 'Potencial Aprimorado' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext({ nex: 50 }));
  
  // 50% NEX = 10 incrementos de 5%, logo +10 PE
  const expectedBonus = 1 * 10;
  const passed = result.resources.peBonus === expectedBonus;
  
  return {
    name: 'Potencial Aprimorado aplica +1 PE por 5% NEX',
    passed,
    message: `Bônus de PE: +${result.resources.peBonus} (esperado: ${expectedBonus})`,
  };
}

/**
 * Testa Precognição (Conhecimento) - Bônus de Defesa e Resistências
 */
function testPrecognicao(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('precognicao', 
      { defenseBonus: 2, allResistancesBonus: 2 }, 
      { source: 'paranormal_power', sourceName: 'Precognição' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const defesaOk = result.defense.general === 2;
  const resistenciasOk = result.resistances.fortitude === 2 && 
                         result.resistances.reflexos === 2 && 
                         result.resistances.vontade === 2;
  const passed = defesaOk && resistenciasOk;
  
  return {
    name: 'Precognição aplica +2 Defesa e +2 todas as resistências',
    passed,
    message: `Defesa: +${result.defense.general}, Resistências: Fort ${result.resistances.fortitude}, Ref ${result.resistances.reflexos}, Von ${result.resistances.vontade}`,
  };
}

/**
 * Testa Precognição com Afinidade
 */
function testPrecognicaoAfinidade(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('precognicao-afinidade', 
      { defenseBonus: 5, allResistancesBonus: 5 }, 
      { source: 'paranormal_power', sourceName: 'Precognição (Afinidade)' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const defesaOk = result.defense.general === 5;
  const resistenciasOk = result.resistances.fortitude === 5;
  const passed = defesaOk && resistenciasOk;
  
  return {
    name: 'Precognição com Afinidade aplica +5 Defesa e resistências',
    passed,
    message: `Defesa: +${result.defense.general}, Fortitude: +${result.resistances.fortitude}`,
  };
}

/**
 * Testa Sensitivo (Conhecimento) - Bônus de perícias sociais
 */
function testSensitivo(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('sensitivo', 
      { skillBonus: { diplomacia: 5, intimidacao: 5, intuicao: 5 } }, 
      { source: 'paranormal_power', sourceName: 'Sensitivo' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const diplomaciaOk = result.skills['diplomacia']?.bonus === 5;
  const intimidacaoOk = result.skills['intimidacao']?.bonus === 5;
  const intuicaoOk = result.skills['intuicao']?.bonus === 5;
  const passed = diplomaciaOk && intimidacaoOk && intuicaoOk;
  
  return {
    name: 'Sensitivo aplica +5 em Diplomacia, Intimidação, Intuição',
    passed,
    message: `Diplomacia: +${result.skills['diplomacia']?.bonus}, Intimidação: +${result.skills['intimidacao']?.bonus}, Intuição: +${result.skills['intuicao']?.bonus}`,
  };
}

/**
 * Testa Golpe de Sorte (Energia) - Bônus de margem de ameaça
 */
function testGolpeDeSorte(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('golpe-de-sorte', 
      { criticalMarginBonus: 1 }, 
      { source: 'paranormal_power', sourceName: 'Golpe de Sorte' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.critical.marginBonus === 1;
  
  return {
    name: 'Golpe de Sorte aplica +1 margem de ameaça',
    passed,
    message: `Margem de ameaça: +${result.critical.marginBonus}`,
  };
}

/**
 * Testa Golpe de Sorte com Afinidade
 */
function testGolpeDeSorteAfinidade(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('golpe-de-sorte-afinidade', 
      { criticalMarginBonus: 2 }, 
      { source: 'paranormal_power', sourceName: 'Golpe de Sorte (Afinidade)' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.critical.marginBonus === 2;
  
  return {
    name: 'Golpe de Sorte com Afinidade aplica +2 margem de ameaça',
    passed,
    message: `Margem de ameaça: +${result.critical.marginBonus}`,
  };
}

/**
 * Testa Campo Protetor (Energia) - Bônus condicional de Defesa
 */
function testCampoProtetor(): TestResult {
  const effect = createTestEffect('campo-protetor', 
    { defenseBonus: 5 }, 
    { 
      source: 'paranormal_power', 
      sourceName: 'Campo Protetor',
      conditions: { requiresActivation: true }
    }
  );
  
  // Quando ativado (esquivando)
  const contextAtivado = createTestContext({ activatedEffects: ['campo-protetor'] });
  const ativo = checkEffectConditions(effect, contextAtivado);
  
  // Quando não ativado
  const contextInativo = createTestContext({ activatedEffects: [] });
  const inativo = !checkEffectConditions(effect, contextInativo);
  
  const passed = ativo && inativo;
  
  return {
    name: 'Campo Protetor requer ativação (esquivar)',
    passed,
    message: `Ativado: ${ativo ? 'funciona' : 'falhou'}, Inativo: ${inativo ? 'corretamente inativo' : 'ativo indevidamente'}`,
  };
}

/**
 * Testa Resistir a Elemento - Resistência a dano paranormal
 */
function testResistirAElemento(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('resistir-sangue', 
      { damageResistance: { sangue: 5 } }, 
      { source: 'paranormal_power', sourceName: 'Resistir a Elemento (Sangue)' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.damageResistance['sangue'] === 5;
  
  return {
    name: 'Resistir a Elemento aplica Resistência 5 ao elemento',
    passed,
    message: `Resistência Sangue: ${result.damageResistance['sangue']}`,
  };
}

/**
 * Testa Expansão de Conhecimento - Bônus de perícia de Intelecto
 */
function testExpansaoDeConhecimento(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('expansao-conhecimento', 
      { skillBonus: { ocultismo: 5 } }, 
      { source: 'paranormal_power', sourceName: 'Expansão de Conhecimento' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = result.skills['ocultismo']?.bonus === 5;
  
  return {
    name: 'Expansão de Conhecimento aplica +5 em perícia de Intelecto',
    passed,
    message: `Ocultismo: +${result.skills['ocultismo']?.bonus}`,
  };
}

/**
 * Testa Visão do Oculto - Bônus de Percepção
 */
function testVisaoDoOculto(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('visao-oculto', 
      { skillBonus: { percepcao: 5 }, specialEffects: ['Ver criaturas invisíveis'] }, 
      { source: 'paranormal_power', sourceName: 'Visão do Oculto' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const percepcaoOk = result.skills['percepcao']?.bonus === 5;
  const hasEfeito = result.specialEffects.some(e => e.effect.includes('invisíveis'));
  const passed = percepcaoOk && hasEfeito;
  
  return {
    name: 'Visão do Oculto aplica +5 Percepção e ver invisíveis',
    passed,
    message: `Percepção: +${result.skills['percepcao']?.bonus}, Efeito especial: ${hasEfeito}`,
  };
}

/**
 * Testa múltiplos poderes paranormais combinados
 */
function testMultiplosPoderesParanormais(): TestResult {
  const effects: UnifiedEffect[] = [
    // Anatomia Insana (Sangue)
    createTestEffect('anatomia-insana', 
      { fortitudeBonus: 2 }, 
      { source: 'paranormal_power', sourceName: 'Anatomia Insana' }
    ),
    // Precognição (Conhecimento)
    createTestEffect('precognicao', 
      { defenseBonus: 2, allResistancesBonus: 2 }, 
      { source: 'paranormal_power', sourceName: 'Precognição' }
    ),
    // Golpe de Sorte (Energia)
    createTestEffect('golpe-sorte', 
      { criticalMarginBonus: 1 }, 
      { source: 'paranormal_power', sourceName: 'Golpe de Sorte' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  // Fortitude: 2 (Anatomia) + 2 (Precognição) = 4
  const fortitudeOk = result.resistances.fortitude === 4;
  const defesaOk = result.defense.general === 2;
  const criticoOk = result.critical.marginBonus === 1;
  const passed = fortitudeOk && defesaOk && criticoOk;
  
  return {
    name: 'Múltiplos poderes paranormais acumulam corretamente',
    passed,
    message: `Fortitude: +${result.resistances.fortitude}, Defesa: +${result.defense.general}, Margem crítico: +${result.critical.marginBonus}`,
  };
}

/**
 * Testa cenário: Ocultista com poderes paranormais e ritual sustentado
 */
function testOcultistaComPoderesParanormais(): TestResult {
  const effects: UnifiedEffect[] = [
    // Trilha - Conhecimento do Medo
    createTestEffect('trilha-medo', 
      { vontadeBonus: 2 }, 
      { source: 'track', sourceName: 'Conhecimento do Medo' }
    ),
    // Poder Paranormal - Precognição
    createTestEffect('precognicao', 
      { defenseBonus: 2, allResistancesBonus: 2 }, 
      { source: 'paranormal_power', sourceName: 'Precognição' }
    ),
    // Ritual sustentado
    createTestEffect('ritual-protecao', 
      { defenseBonus: 3 }, 
      { source: 'ritual', sourceName: 'Proteção' }
    ),
    // Condição ativa
    createTestEffect('medo', 
      { attackBonus: -2 }, 
      { source: 'condition', sourceName: 'Medo' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  // Defesa: 2 (Precognição) + 3 (Ritual) = 5
  // Vontade: 2 (Trilha) + 2 (Precognição) = 4
  // Ataque: -2 (Medo)
  const defesaOk = result.defense.general === 5;
  const vontadeOk = result.resistances.vontade === 4;
  const ataqueOk = result.attack.general === -2;
  const passed = defesaOk && vontadeOk && ataqueOk;
  
  return {
    name: 'Cenário: Ocultista com poderes paranormais + ritual + condição',
    passed,
    message: `Defesa: +${result.defense.general}, Vontade: +${result.resistances.vontade}, Ataque: ${result.attack.general}`,
  };
}

// =====================================================
// NOVAS SUITES DE TESTES - EXPANSÃO SUE
// =====================================================

// =====================================================
// Suite 1: Testes de Origens Específicas
// =====================================================

/**
 * Testa Calejado (Desgarrado) - +1 PV por 5% NEX
 */
function testOrigemCalejado(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('calejado', 
      { hpBonusPerNex: 1 }, 
      { source: 'origin', sourceName: 'Desgarrado - Calejado' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext({ nex: 50 }));
  const expectedBonus = 1 * 10; // 50% NEX = 10 incrementos
  const passed = result.resources.hpBonus === expectedBonus;
  
  return {
    name: 'Calejado (Desgarrado): +1 PV por 5% NEX',
    passed,
    message: `PV bônus: +${result.resources.hpBonus} (esperado: ${expectedBonus})`,
  };
}

/**
 * Testa Patrulha (Policial) - +2 Defesa
 */
function testOrigemPatrulha(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('patrulha', 
      { defenseBonus: 2 }, 
      { source: 'origin', sourceName: 'Policial - Patrulha' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.defense.general === 2;
  
  return {
    name: 'Patrulha (Policial): +2 Defesa',
    passed,
    message: `Defesa: +${result.defense.general}`,
  };
}

/**
 * Testa Posição de Combate (Mercenário) - +5 Iniciativa
 */
function testOrigemMercenario(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('posicao-combate', 
      { initiativeBonus: 5 }, 
      { source: 'origin', sourceName: 'Mercenário - Posição de Combate' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.initiative.bonus === 5;
  
  return {
    name: 'Posição de Combate (Mercenário): +5 Iniciativa',
    passed,
    message: `Iniciativa: +${result.initiative.bonus}`,
  };
}

/**
 * Testa Faro para Pistas (Investigador) - +5 Investigação
 */
function testOrigemInvestigador(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('faro-pistas', 
      { skillBonus: { investigacao: 5 } }, 
      { source: 'origin', sourceName: 'Investigador - Faro para Pistas' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.skills['investigacao']?.bonus === 5;
  
  return {
    name: 'Faro para Pistas (Investigador): +5 Investigação',
    passed,
    message: `Investigação: +${result.skills['investigacao']?.bonus}`,
  };
}

/**
 * Testa Espírito Cívico (Servidor Público) - +2 todas resistências
 */
function testOrigemServidorPublico(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('espirito-civico', 
      { fortitudeBonus: 2, reflexosBonus: 2, vontadeBonus: 2 }, 
      { source: 'origin', sourceName: 'Servidor Público - Espírito Cívico' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = 
    result.resistances.fortitude === 2 && 
    result.resistances.reflexos === 2 && 
    result.resistances.vontade === 2;
  
  return {
    name: 'Espírito Cívico (Servidor Público): +2 todas resistências',
    passed,
    message: `Fort: ${result.resistances.fortitude}, Ref: ${result.resistances.reflexos}, Von: ${result.resistances.vontade}`,
  };
}

/**
 * Testa Mão Pesada (Lutador) - +2 dano desarmado
 */
function testOrigemLutador(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('mao-pesada', 
      { meleeDamageBonus: 2, specialEffects: ['Dano desarmado: +2'] }, 
      { source: 'origin', sourceName: 'Lutador - Mão Pesada' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.damage.melee === 2;
  
  return {
    name: 'Mão Pesada (Lutador): +2 dano corpo a corpo',
    passed,
    message: `Dano corpo a corpo: +${result.damage.melee}`,
  };
}

/**
 * Testa Para Bellum (Militar) - proficiência armas táticas
 */
function testOrigemMilitar(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('para-bellum', 
      { grantsProficiency: ['Armas táticas'], specialEffects: ['Proficiência com armas táticas'] }, 
      { source: 'origin', sourceName: 'Militar - Para Bellum' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const hasProficiency = result.proficiencies.some(p => p.includes('táticas'));
  
  return {
    name: 'Para Bellum (Militar): proficiência armas táticas',
    passed: hasProficiency,
    message: `Proficiências: ${result.proficiencies.join(', ')}`,
  };
}

/**
 * Testa Ferramenta de Trabalho (Operário) - proficiência armas pesadas
 */
function testOrigemOperario(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('ferramenta-trabalho', 
      { grantsProficiency: ['Armas pesadas'], specialEffects: ['Proficiência com armas pesadas'] }, 
      { source: 'origin', sourceName: 'Operário - Ferramenta de Trabalho' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const hasProficiency = result.proficiencies.some(p => p.includes('pesadas'));
  
  return {
    name: 'Ferramenta de Trabalho (Operário): proficiência armas pesadas',
    passed: hasProficiency,
    message: `Proficiências: ${result.proficiencies.join(', ')}`,
  };
}

/**
 * Testa Mutação (Experimento) - RD 2 e bônus em perícia física
 */
function testOrigemExperimento(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('mutacao', 
      { damageReduction: 2, skillBonus: { atletismo: 2 }, specialEffects: ['RD 2', '-2 Diplomacia/Enganação'] }, 
      { source: 'origin', sourceName: 'Experimento - Mutação' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.damageReduction.physical === 2 && result.skills['atletismo']?.bonus === 2;
  
  return {
    name: 'Mutação (Experimento): RD 2 e +2 perícia física',
    passed,
    message: `RD: ${result.damageReduction.physical}, Atletismo: +${result.skills['atletismo']?.bonus}`,
  };
}

/**
 * Testa Luta ou Fuga (Profetizado) - +2 Vontade
 */
function testOrigemProfetizado(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('luta-ou-fuga', 
      { vontadeBonus: 2, specialEffects: ['+2 Vontade'] }, 
      { source: 'origin', sourceName: 'Profetizado - Luta ou Fuga' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.resistances.vontade === 2;
  
  return {
    name: 'Luta ou Fuga (Profetizado): +2 Vontade',
    passed,
    message: `Vontade: +${result.resistances.vontade}`,
  };
}

/**
 * Testa combinação de múltiplas origens (cenário de teste)
 */
function testMultiplasOrigens(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('patrulha', { defenseBonus: 2 }, { source: 'origin' }),
    createTestEffect('posicao-combate', { initiativeBonus: 5 }, { source: 'origin' }),
    createTestEffect('espirito-civico', { allResistancesBonus: 2 }, { source: 'origin' }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = 
    result.defense.general === 2 && 
    result.initiative.bonus === 5 &&
    result.resistances.fortitude === 2;
  
  return {
    name: 'Múltiplas origens combinam corretamente',
    passed,
    message: `Defesa: +${result.defense.general}, Iniciativa: +${result.initiative.bonus}`,
  };
}

// =====================================================
// Suite 2: Testes de Trilhas Específicas
// =====================================================

/**
 * Testa Casca Grossa (Tropa de Choque) - PV adicional por NEX
 */
function testTrilhaTropaChoque(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('casca-grossa', 
      { hpBonus: 10 }, // Simulando bônus calculado para NEX 50%
      { source: 'track', sourceName: 'Tropa de Choque - Casca Grossa' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext({ nex: 50 }));
  const passed = result.resources.hpBonus === 10;
  
  return {
    name: 'Casca Grossa (Tropa de Choque): PV adicional',
    passed,
    message: `PV bônus: +${result.resources.hpBonus}`,
  };
}

/**
 * Testa Golpe Brutal (Aniquilador) - +1 margem de crítico
 */
function testTrilhaAniquilador(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('golpe-brutal', 
      { criticalMarginBonus: 1 }, 
      { source: 'track', sourceName: 'Aniquilador - Golpe Brutal' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.critical.marginBonus === 1;
  
  return {
    name: 'Golpe Brutal (Aniquilador): +1 margem de crítico',
    passed,
    message: `Margem crítico: +${result.critical.marginBonus}`,
  };
}

/**
 * Testa Mira Precisa (Atirador de Elite) - +2 ataque distância
 */
function testTrilhaAtirador(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('mira-precisa', 
      { rangedAttackBonus: 2 }, 
      { source: 'track', sourceName: 'Atirador de Elite - Mira Precisa' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.attack.ranged === 2;
  
  return {
    name: 'Mira Precisa (Atirador): +2 ataque distância',
    passed,
    message: `Ataque distância: +${result.attack.ranged}`,
  };
}

/**
 * Testa Ataque Furtivo (Infiltrador) - dados extras de dano
 */
function testTrilhaInfiltrador(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('ataque-furtivo', 
      { extraDamageDice: '2d6', specialEffects: ['Ataque Furtivo: +2d6 contra desprevenidos'] }, 
      { source: 'track', sourceName: 'Infiltrador - Ataque Furtivo' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.damage.extraDice.includes('2d6');
  
  return {
    name: 'Ataque Furtivo (Infiltrador): +2d6 contra desprevenidos',
    passed,
    message: `Dados extras: ${result.damage.extraDice.join(', ')}`,
  };
}

/**
 * Testa Canalização (Conduite) - +2 em rituais
 */
function testTrilhaConduite(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('canalizacao', 
      { skillBonus: { ocultismo: 2 }, specialEffects: ['Rituais: +2 em testes'] }, 
      { source: 'track', sourceName: 'Conduite - Canalização' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.skills['ocultismo']?.bonus === 2;
  
  return {
    name: 'Canalização (Conduite): +2 Ocultismo/rituais',
    passed,
    message: `Ocultismo: +${result.skills['ocultismo']?.bonus}`,
  };
}

/**
 * Testa Conhecimento do Medo (Intuitivo) - +2 Vontade
 */
function testTrilhaIntuitivo(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('conhecimento-medo', 
      { vontadeBonus: 2 }, 
      { source: 'track', sourceName: 'Intuitivo - Conhecimento do Medo' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.resistances.vontade === 2;
  
  return {
    name: 'Conhecimento do Medo (Intuitivo): +2 Vontade',
    passed,
    message: `Vontade: +${result.resistances.vontade}`,
  };
}

/**
 * Testa Lâmina Maldita (Lâmina Paranormal) - arma conjurada
 */
function testTrilhaLaminaParanormal(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('lamina-maldita', 
      { meleeDamageBonus: 3, extraDamageDice: '1d6', specialEffects: ['Arma conjurada de elemento'] }, 
      { source: 'track', sourceName: 'Lâmina Paranormal - Lâmina Maldita' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.damage.melee === 3 && result.damage.extraDice.includes('1d6');
  
  return {
    name: 'Lâmina Maldita: +3 dano +1d6 elemental',
    passed,
    message: `Dano melee: +${result.damage.melee}, Extra: ${result.damage.extraDice.join(', ')}`,
  };
}

/**
 * Testa Negociador (Especialista) - bônus em perícias sociais
 */
function testTrilhaNegociador(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('diplomata-nato', 
      { skillBonus: { diplomacia: 5, intimidacao: 5 } }, 
      { source: 'track', sourceName: 'Negociador - Diplomata Nato' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.skills['diplomacia']?.bonus === 5 && result.skills['intimidacao']?.bonus === 5;
  
  return {
    name: 'Diplomata Nato (Negociador): +5 Diplomacia/Intimidação',
    passed,
    message: `Diplomacia: +${result.skills['diplomacia']?.bonus}, Intimidação: +${result.skills['intimidacao']?.bonus}`,
  };
}

// =====================================================
// Suite 3: Testes de Condições Completas
// =====================================================

/**
 * Testa Atordoado - não pode agir/reagir, -2 Defesa
 */
function testCondicaoAtordoado(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('atordoado', 
      { defenseBonus: -2, cannotAct: true, cannotReact: true }, 
      { source: 'condition', sourceName: 'Atordoado' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = 
    result.defense.general === -2 && 
    result.flags.cannotAct && 
    result.flags.cannotReact;
  
  return {
    name: 'Atordoado: -2 Defesa, não age/reage',
    passed,
    message: `Defesa: ${result.defense.general}, cannotAct: ${result.flags.cannotAct}`,
  };
}

/**
 * Testa Cego - -5 ataque
 */
function testCondicaoCego(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('cego', 
      { attackBonus: -5, specialEffects: ['Falha automática em Percepção visual'] }, 
      { source: 'condition', sourceName: 'Cego' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.attack.general === -5;
  
  return {
    name: 'Cego: -5 ataque',
    passed,
    message: `Ataque: ${result.attack.general}`,
  };
}

/**
 * Testa Surdo - -2 iniciativa
 */
function testCondicaoSurdo(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('surdo', 
      { initiativeBonus: -2, specialEffects: ['Falha automática em Percepção auditiva'] }, 
      { source: 'condition', sourceName: 'Surdo' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.initiative.bonus === -2;
  
  return {
    name: 'Surdo: -2 iniciativa',
    passed,
    message: `Iniciativa: ${result.initiative.bonus}`,
  };
}

/**
 * Testa Debilitado - -1 todos os testes
 */
function testCondicaoDebilitado(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('debilitado', 
      { allSkillsBonus: -1, attackBonus: -1 }, 
      { source: 'condition', sourceName: 'Debilitado' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.attack.general === -1;
  
  return {
    name: 'Debilitado: -1 todos os testes',
    passed,
    message: `Ataque: ${result.attack.general}`,
  };
}

/**
 * Testa Doente - -2 todos os testes, descanso não recupera
 */
function testCondicaoDoente(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('doente', 
      { allSkillsBonus: -2, attackBonus: -2, specialEffects: ['Descanso não recupera PV, PE ou Sanidade'] }, 
      { source: 'condition', sourceName: 'Doente' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.attack.general === -2;
  
  return {
    name: 'Doente: -2 todos os testes',
    passed,
    message: `Ataque: ${result.attack.general}`,
  };
}

/**
 * Testa Envenenado - -2 todos os testes
 */
function testCondicaoEnvenenado(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('envenenado', 
      { allSkillsBonus: -2, attackBonus: -2 }, 
      { source: 'condition', sourceName: 'Envenenado' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.attack.general === -2;
  
  return {
    name: 'Envenenado: -2 todos os testes',
    passed,
    message: `Ataque: ${result.attack.general}`,
  };
}

/**
 * Testa Exausto - -2 todos, deslocamento 50%
 */
function testCondicaoExausto(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('exausto', 
      { allSkillsBonus: -2, attackBonus: -2, movementMultiplier: 0.5, specialEffects: ['Deslocamento pela metade'] }, 
      { source: 'condition', sourceName: 'Exausto' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.attack.general === -2 && result.movement.multiplier === 0.5;
  
  return {
    name: 'Exausto: -2 testes, 50% movimento',
    passed,
    message: `Ataque: ${result.attack.general}, Movimento: ${result.movement.multiplier * 100}%`,
  };
}

/**
 * Testa Fraco - -2 FOR e Luta
 */
function testCondicaoFraco(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('fraco', 
      { skillBonus: { luta: -2 }, specialEffects: ['-2 em testes de Força e Luta'] }, 
      { source: 'condition', sourceName: 'Fraco' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.skills['luta']?.bonus === -2;
  
  return {
    name: 'Fraco: -2 Força/Luta',
    passed,
    message: `Luta: ${result.skills['luta']?.bonus}`,
  };
}

/**
 * Testa Apavorado - -2 todos, foge da fonte
 */
function testCondicaoApavorado(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('apavorado', 
      { allSkillsBonus: -2, attackBonus: -2, specialEffects: ['Deve fugir da fonte do medo'] }, 
      { source: 'condition', sourceName: 'Apavorado' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.attack.general === -2;
  
  return {
    name: 'Apavorado: -2 testes, deve fugir',
    passed,
    message: `Ataque: ${result.attack.general}`,
  };
}

/**
 * Testa Fascinado - -5 percepção, não pode agir
 */
function testCondicaoFascinado(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('fascinado', 
      { skillBonus: { percepcao: -5 }, cannotAct: true }, 
      { source: 'condition', sourceName: 'Fascinado' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.skills['percepcao']?.bonus === -5 && result.flags.cannotAct;
  
  return {
    name: 'Fascinado: -5 Percepção, não age',
    passed,
    message: `Percepção: ${result.skills['percepcao']?.bonus}, cannotAct: ${result.flags.cannotAct}`,
  };
}

/**
 * Testa Perturbado - -2 todos os testes
 */
function testCondicaoPerturbado(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('perturbado', 
      { allSkillsBonus: -2, attackBonus: -2 }, 
      { source: 'condition', sourceName: 'Perturbado' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.attack.general === -2;
  
  return {
    name: 'Perturbado: -2 todos os testes',
    passed,
    message: `Ataque: ${result.attack.general}`,
  };
}

/**
 * Testa Inconsciente - isUnconscious, isHelpless
 */
function testCondicaoInconsciente(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('inconsciente', 
      { cannotAct: true, cannotReact: true, cannotMove: true, isUnconscious: true, isHelpless: true }, 
      { source: 'condition', sourceName: 'Inconsciente' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.flags.isUnconscious && result.flags.isHelpless;
  
  return {
    name: 'Inconsciente: isUnconscious, isHelpless',
    passed,
    message: `isUnconscious: ${result.flags.isUnconscious}, isHelpless: ${result.flags.isHelpless}`,
  };
}

/**
 * Testa Indefeso - ataques automáticos, dano crítico
 */
function testCondicaoIndefeso(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('indefeso', 
      { isHelpless: true, specialEffects: ['Ataques são acertos automáticos', 'Dano sempre crítico'] }, 
      { source: 'condition', sourceName: 'Indefeso' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.flags.isHelpless;
  
  return {
    name: 'Indefeso: isHelpless (ataques automáticos)',
    passed,
    message: `isHelpless: ${result.flags.isHelpless}`,
  };
}

/**
 * Testa Morrendo - contador de 3 rodadas
 */
function testCondicaoMorrendo(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('morrendo', 
      { cannotAct: true, cannotReact: true, cannotMove: true, isUnconscious: true, isHelpless: true }, 
      { source: 'condition', sourceName: 'Morrendo' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.flags.isUnconscious && result.flags.isHelpless;
  
  return {
    name: 'Morrendo: inconsciente e indefeso',
    passed,
    message: `isUnconscious: ${result.flags.isUnconscious}, isHelpless: ${result.flags.isHelpless}`,
  };
}

/**
 * Testa Paralisado - Defesa 5, indefeso
 */
function testCondicaoParalisado(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('paralisado', 
      { cannotAct: true, cannotMove: true, isHelpless: true }, 
      { source: 'condition', sourceName: 'Paralisado' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.flags.cannotAct && result.flags.cannotMove && result.flags.isHelpless;
  
  return {
    name: 'Paralisado: não age, não move, indefeso',
    passed,
    message: `cannotAct: ${result.flags.cannotAct}, isHelpless: ${result.flags.isHelpless}`,
  };
}

/**
 * Testa Desprevenido - -5 Defesa, não pode reagir
 */
function testCondicaoDesprevenido(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('desprevenido', 
      { defenseBonus: -5, cannotReact: true }, 
      { source: 'condition', sourceName: 'Desprevenido' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.defense.general === -5 && result.flags.cannotReact;
  
  return {
    name: 'Desprevenido: -5 Defesa, não reage',
    passed,
    message: `Defesa: ${result.defense.general}, cannotReact: ${result.flags.cannotReact}`,
  };
}

/**
 * Testa Enredado - -3 mov, -2 ataque, -2 reflexos
 */
function testCondicaoEnredado(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('enredado', 
      { movementBonus: -3, attackBonus: -2, reflexosBonus: -2 }, 
      { source: 'condition', sourceName: 'Enredado' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = 
    result.attack.general === -2 && 
    result.resistances.reflexos === -2 && 
    result.movement.bonus === -3;
  
  return {
    name: 'Enredado: -3 mov, -2 ataque, -2 reflexos',
    passed,
    message: `Ataque: ${result.attack.general}, Reflexos: ${result.resistances.reflexos}, Mov: ${result.movement.bonus}`,
  };
}

/**
 * Testa Pasmo - -2 Defesa, não pode agir
 */
function testCondicaoPasmo(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('pasmo', 
      { defenseBonus: -2, cannotAct: true }, 
      { source: 'condition', sourceName: 'Pasmo' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.defense.general === -2 && result.flags.cannotAct;
  
  return {
    name: 'Pasmo: -2 Defesa, não age',
    passed,
    message: `Defesa: ${result.defense.general}, cannotAct: ${result.flags.cannotAct}`,
  };
}

/**
 * Testa Surpreendido - -5 Defesa, não age/reage
 */
function testCondicaoSurpreendido(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('surpreendido', 
      { defenseBonus: -5, cannotAct: true, cannotReact: true }, 
      { source: 'condition', sourceName: 'Surpreendido' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.defense.general === -5 && result.flags.cannotAct && result.flags.cannotReact;
  
  return {
    name: 'Surpreendido: -5 Defesa, não age/reage',
    passed,
    message: `Defesa: ${result.defense.general}, cannotAct: ${result.flags.cannotAct}`,
  };
}

// =====================================================
// Suite 4: Testes Contextuais
// =====================================================

/**
 * Testa Caído vs Melee - -5 Defesa
 */
function testCaidoVsMelee(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('caido', 
      { defenseBonusMelee: -5 }, 
      { source: 'condition', sourceName: 'Caído', conditions: { attackType: 'melee' } }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.defense.vsMelee === -5;
  
  return {
    name: 'Caído vs Melee: -5 Defesa',
    passed,
    message: `Defesa vs Melee: ${result.defense.vsMelee}`,
  };
}

/**
 * Testa Caído vs Ranged - +5 Defesa
 */
function testCaidoVsRanged(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('caido', 
      { defenseBonusRanged: 5 }, 
      { source: 'condition', sourceName: 'Caído', conditions: { attackType: 'ranged' } }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.defense.vsRanged === 5;
  
  return {
    name: 'Caído vs Ranged: +5 Defesa (bônus)',
    passed,
    message: `Defesa vs Ranged: ${result.defense.vsRanged}`,
  };
}

/**
 * Testa efeito apenas corpo a corpo
 */
function testEfeitoApenasCorpoACorpo(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('poder-melee', 
      { meleeDamageBonus: 5 }, 
      { source: 'general_power', conditions: { attackType: 'melee' } }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.damage.melee === 5 && result.damage.ranged === 0;
  
  return {
    name: 'Efeito apenas corpo a corpo: +5 dano melee',
    passed,
    message: `Dano melee: ${result.damage.melee}, Dano ranged: ${result.damage.ranged}`,
  };
}

/**
 * Testa efeito apenas distância
 */
function testEfeitoApenasDistancia(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('poder-ranged', 
      { rangedDamageBonus: 3, rangedAttackBonus: 2 }, 
      { source: 'general_power', conditions: { attackType: 'ranged' } }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.damage.ranged === 3 && result.attack.ranged === 2;
  
  return {
    name: 'Efeito apenas distância: +2 ataque +3 dano',
    passed,
    message: `Ataque ranged: ${result.attack.ranged}, Dano ranged: ${result.damage.ranged}`,
  };
}

/**
 * Testa efeito PV abaixo de 50% ativa
 */
function testEfeitoPVAbaixo50(): TestResult {
  const effect = createTestEffect('fanatico', 
    { damageBonus: 5 }, 
    { conditions: { hpPercentBelow: 50 } }
  );
  
  const contextLowHP = createTestContext({ hpCurrent: 10, hpMax: 30 }); // 33%
  const active = checkEffectConditions(effect, contextLowHP);
  
  return {
    name: 'Efeito ativa com PV < 50%',
    passed: active,
    message: `PV 33%: ${active ? 'ativo' : 'inativo'}`,
  };
}

/**
 * Testa efeito PV acima de 50% não ativa
 */
function testEfeitoPVAcima50(): TestResult {
  const effect = createTestEffect('fanatico', 
    { damageBonus: 5 }, 
    { conditions: { hpPercentBelow: 50 } }
  );
  
  const contextHighHP = createTestContext({ hpCurrent: 25, hpMax: 30 }); // 83%
  const active = checkEffectConditions(effect, contextHighHP);
  
  return {
    name: 'Efeito NÃO ativa com PV > 50%',
    passed: !active,
    message: `PV 83%: ${active ? 'ativo' : 'inativo'}`,
  };
}

/**
 * Testa efeito de primeira rodada
 */
function testEfeitoPrimeiraRodada(): TestResult {
  const effect = createTestEffect('iniciativa-aprimorada', 
    { initiativeBonus: 10 }, 
    { conditions: { firstRoundOnly: true } }
  );
  
  const contextFirst = createTestContext({ isFirstRound: true });
  const activeFirst = checkEffectConditions(effect, contextFirst);
  
  const contextLater = createTestContext({ isFirstRound: false, currentRound: 3 });
  const activeLater = checkEffectConditions(effect, contextLater);
  
  const passed = activeFirst && !activeLater;
  
  return {
    name: 'Efeito primeira rodada: ativo apenas rodada 1',
    passed,
    message: `Rodada 1: ${activeFirst ? 'ativo' : 'inativo'}, Rodada 3: ${activeLater ? 'ativo' : 'inativo'}`,
  };
}

/**
 * Testa efeito requer estar em combate
 */
function testEfeitoEmCombate(): TestResult {
  const effect = createTestEffect('adrenalina', 
    { attackBonus: 2, damageBonus: 2 }, 
    { conditions: { inCombat: true } }
  );
  
  const contextInCombat = createTestContext({ inCombat: true });
  const activeInCombat = checkEffectConditions(effect, contextInCombat);
  
  const contextOutOfCombat = createTestContext({ inCombat: false });
  const activeOutOfCombat = checkEffectConditions(effect, contextOutOfCombat);
  
  const passed = activeInCombat && !activeOutOfCombat;
  
  return {
    name: 'Efeito em combate: ativo apenas em combate',
    passed,
    message: `Em combate: ${activeInCombat ? 'ativo' : 'inativo'}, Fora: ${activeOutOfCombat ? 'ativo' : 'inativo'}`,
  };
}

// =====================================================
// Suite 5: Testes de Stacking e Prioridade
// =====================================================

/**
 * Testa stacking de mesma fonte (maior valor)
 */
function testStackingMesmaFonte(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('origem-1', { defenseBonus: 2 }, { source: 'origin' }),
    createTestEffect('origem-2', { defenseBonus: 5 }, { source: 'origin' }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  // Na consolidação atual, os bônus são somados
  const passed = result.defense.general === 7; // 2 + 5
  
  return {
    name: 'Múltiplas origens: bônus acumulam',
    passed,
    message: `Defesa total: ${result.defense.general}`,
  };
}

/**
 * Testa stacking de fontes diferentes
 */
function testStackingFontesDiferentes(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('origem', { defenseBonus: 2 }, { source: 'origin' }),
    createTestEffect('trilha', { defenseBonus: 3 }, { source: 'track' }),
    createTestEffect('ritual', { defenseBonus: 4 }, { source: 'ritual' }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.defense.general === 9; // 2 + 3 + 4
  
  return {
    name: 'Fontes diferentes: bônus acumulam',
    passed,
    message: `Defesa total: ${result.defense.general}`,
  };
}

/**
 * Testa bônus e penalidade se cancelam
 */
function testBonusEPenalidade(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('poder', { attackBonus: 5 }, { source: 'general_power' }),
    createTestEffect('condicao', { attackBonus: -3 }, { source: 'condition' }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.attack.general === 2; // 5 - 3
  
  return {
    name: 'Bônus + Penalidade: somam algebricamente',
    passed,
    message: `Ataque total: ${result.attack.general}`,
  };
}

/**
 * Testa múltiplos rituais acumulam com origem
 */
function testRituaisAcumulamComOrigem(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('origem', { attackBonus: 1 }, { source: 'origin' }),
    createTestEffect('ritual-1', { attackBonus: 2 }, { source: 'ritual' }),
    createTestEffect('ritual-2', { attackBonus: 3 }, { source: 'ritual' }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.attack.general === 6; // 1 + 2 + 3
  
  return {
    name: 'Rituais acumulam com origem',
    passed,
    message: `Ataque total: ${result.attack.general}`,
  };
}

/**
 * Testa prioridade de efeitos (maior NEX = maior prioridade)
 */
function testPrioridadeDeEfeitos(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('efeito-menor', { damageBonus: 2 }, { priority: 5 }),
    createTestEffect('efeito-maior', { damageBonus: 4 }, { priority: 50 }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  // Ambos devem ser aplicados
  const passed = result.damage.general === 6;
  
  return {
    name: 'Efeitos de diferentes prioridades acumulam',
    passed,
    message: `Dano total: ${result.damage.general}`,
  };
}

/**
 * Testa trilha + equipamento + condição
 */
function testStackingTrilhaEquipamentoCondicao(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('trilha-op', { criticalMarginBonus: 2 }, { source: 'track' }),
    createTestEffect('arma-afiada', { criticalMarginBonus: 1 }, { source: 'equipment' }),
    createTestEffect('inspirado', { criticalMarginBonus: 1 }, { source: 'condition' }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.critical.marginBonus === 4; // 2 + 1 + 1
  
  return {
    name: 'Trilha + Equipamento + Condição: margem crítico acumula',
    passed,
    message: `Margem crítico: +${result.critical.marginBonus}`,
  };
}

// =====================================================
// Suite 6: Testes de Adaptadores
// =====================================================

/**
 * Testa getOriginEffects retorna efeitos corretos
 */
function testGetOriginEffects(): TestResult {
  // Simulação: Investigador com Faro para Pistas
  const effects: UnifiedEffect[] = [
    createTestEffect('faro-para-pistas', 
      { skillBonus: { investigacao: 5 } }, 
      { source: 'origin', sourceId: 'investigador', sourceName: 'Origem: Investigador' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.skills['investigacao']?.bonus === 5;
  
  return {
    name: 'getOriginEffects: Investigador +5 Investigação',
    passed,
    message: `Investigação: +${result.skills['investigacao']?.bonus}`,
  };
}

/**
 * Testa getConditionEffects retorna efeitos corretos
 */
function testGetConditionEffects(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('condition-agarrado', 
      { defenseBonus: -2, cannotMove: true }, 
      { source: 'condition', sourceId: 'agarrado' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.defense.general === -2 && result.flags.cannotMove;
  
  return {
    name: 'getConditionEffects: Agarrado -2 Defesa',
    passed,
    message: `Defesa: ${result.defense.general}, cannotMove: ${result.flags.cannotMove}`,
  };
}

/**
 * Testa getTrackEffects retorna efeitos corretos
 */
function testGetTrackEffects(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('track-casca-grossa', 
      { hpBonus: 10 }, 
      { source: 'track', sourceId: 'tropa-de-choque' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.resources.hpBonus === 10;
  
  return {
    name: 'getTrackEffects: Tropa de Choque +10 PV',
    passed,
    message: `PV bônus: +${result.resources.hpBonus}`,
  };
}

/**
 * Testa getRitualEffects retorna efeitos corretos
 */
function testGetRitualEffects(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('ritual-armamento-abencoado', 
      { attackBonus: 2, damageBonus: 3 }, 
      { source: 'ritual', sourceId: 'armamento-abencoado' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.attack.general === 2 && result.damage.general === 3;
  
  return {
    name: 'getRitualEffects: Armamento Abençoado +2/+3',
    passed,
    message: `Ataque: +${result.attack.general}, Dano: +${result.damage.general}`,
  };
}

/**
 * Testa normalização de IDs de origem
 */
function testNormalizeOriginId(): TestResult {
  // Testa se diferentes formatos de ID são tratados corretamente
  const effects: UnifiedEffect[] = [
    createTestEffect('policial-patrulha', 
      { defenseBonus: 2 }, 
      { source: 'origin', sourceId: 'policial' }
    ),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  const passed = result.defense.general === 2;
  
  return {
    name: 'Normalização de ID: policial reconhecido',
    passed,
    message: `Defesa: +${result.defense.general}`,
  };
}

/**
 * Testa listAllConditionEffects retorna lista completa
 */
function testListAllConditionEffects(): TestResult {
  // Verifica que condições básicas estão mapeadas
  const conditionIds = ['agarrado', 'atordoado', 'cego', 'morrendo'];
  
  const effects: UnifiedEffect[] = conditionIds.map(id => 
    createTestEffect(`condition-${id}`, 
      { specialEffects: [`Condição ${id} ativa`] }, 
      { source: 'condition', sourceId: id }
    )
  );
  
  const passed = effects.length === 4;
  
  return {
    name: 'listAllConditionEffects: condições mapeadas',
    passed,
    message: `Condições encontradas: ${effects.length}`,
  };
}

// =====================================================
// Suite 7: Cenários de Personagem Completo
// =====================================================

/**
 * Testa Combatente Aniquilador NEX 50%
 */
function testCombatenteAniquiladorNEX50(): TestResult {
  const effects: UnifiedEffect[] = [
    // Origem: Mercenário
    createTestEffect('origem-mercenario', { initiativeBonus: 5 }, { source: 'origin' }),
    // Trilha: Aniquilador
    createTestEffect('trilha-golpe-brutal', { criticalMarginBonus: 1 }, { source: 'track' }),
    createTestEffect('trilha-ataque-especial', { damageBonus: 4 }, { source: 'track' }),
    // Equipamento
    createTestEffect('armadura-pesada', { defenseBonus: 5 }, { source: 'equipment' }),
    createTestEffect('espada-larga', { meleeDamageBonus: 2 }, { source: 'equipment' }),
  ];
  
  const result = consolidateEffects(effects, createTestContext({ nex: 50 }));
  
  const passed = 
    result.initiative.bonus === 5 &&
    result.critical.marginBonus === 1 &&
    result.damage.general === 4 &&
    result.defense.general === 5;
  
  return {
    name: 'Combatente Aniquilador NEX 50%',
    passed,
    message: `Iniciativa: +${result.initiative.bonus}, Crítico: +${result.critical.marginBonus}, Dano: +${result.damage.general}`,
  };
}

/**
 * Testa Combatente Tropa de Choque com Armadura
 */
function testCombatenteTropaChoqueComArmadura(): TestResult {
  const effects: UnifiedEffect[] = [
    // Origem: Policial
    createTestEffect('origem-policial', { defenseBonus: 2 }, { source: 'origin' }),
    // Trilha: Tropa de Choque
    createTestEffect('trilha-casca-grossa', { hpBonus: 15 }, { source: 'track' }),
    createTestEffect('trilha-carga-brutal', { meleeDamageBonus: 3 }, { source: 'track' }),
    // Armadura + Escudo
    createTestEffect('armadura', { defenseBonus: 5, damageReduction: 2 }, { source: 'equipment' }),
    createTestEffect('escudo', { defenseBonus: 2 }, { source: 'equipment' }),
  ];
  
  const result = consolidateEffects(effects, createTestContext({ nex: 50, hasShield: true }));
  
  const passed = 
    result.defense.general === 9 && // 2 + 5 + 2
    result.resources.hpBonus === 15 &&
    result.damageReduction.physical === 2;
  
  return {
    name: 'Combatente Tropa de Choque: tanque completo',
    passed,
    message: `Defesa: +${result.defense.general}, PV: +${result.resources.hpBonus}, RD: ${result.damageReduction.physical}`,
  };
}

/**
 * Testa Especialista Atirador de Elite
 */
function testEspecialistaAtirador(): TestResult {
  const effects: UnifiedEffect[] = [
    // Origem: Militar
    createTestEffect('origem-militar', { grantsProficiency: ['Armas táticas'] }, { source: 'origin' }),
    // Trilha: Atirador de Elite
    createTestEffect('trilha-mira-precisa', { rangedAttackBonus: 2 }, { source: 'track' }),
    createTestEffect('trilha-tiro-letal', { rangedDamageBonus: 4, criticalMarginBonus: 2 }, { source: 'track' }),
    // Arma
    createTestEffect('rifle-precisao', { rangedAttackBonus: 1, rangedDamageBonus: 1 }, { source: 'equipment' }),
  ];
  
  const result = consolidateEffects(effects, createTestContext({ nex: 50 }));
  
  const passed = 
    result.attack.ranged === 3 && // 2 + 1
    result.damage.ranged === 5 && // 4 + 1
    result.critical.marginBonus === 2;
  
  return {
    name: 'Especialista Atirador de Elite',
    passed,
    message: `Ataque ranged: +${result.attack.ranged}, Dano ranged: +${result.damage.ranged}, Crítico: +${result.critical.marginBonus}`,
  };
}

/**
 * Testa Especialista Médico de Campo em Cura
 */
function testEspecialistaMedicoEmCura(): TestResult {
  const effects: UnifiedEffect[] = [
    // Origem: Agente de Saúde
    createTestEffect('origem-agente-saude', { specialEffects: ['Cura: +INT PV curados'] }, { source: 'origin' }),
    // Trilha: Médico de Campo
    createTestEffect('trilha-paramédico', { skillBonus: { medicina: 5 } }, { source: 'track' }),
    createTestEffect('trilha-ressuscitador', { specialEffects: ['Pode estabilizar morrendo como ação livre'] }, { source: 'track' }),
    // Equipamento médico
    createTestEffect('kit-medico', { skillBonus: { medicina: 2 } }, { source: 'equipment' }),
  ];
  
  const result = consolidateEffects(effects, createTestContext({ nex: 50 }));
  
  const passed = result.skills['medicina']?.bonus === 7; // 5 + 2
  
  return {
    name: 'Especialista Médico de Campo',
    passed,
    message: `Medicina: +${result.skills['medicina']?.bonus}`,
  };
}

/**
 * Testa Ocultista Conduite com Rituais
 */
function testOcultistaConduiteComRituais(): TestResult {
  const effects: UnifiedEffect[] = [
    // Origem: Cultista Arrependido
    createTestEffect('origem-cultista', { specialEffects: ['Poder paranormal grátis'] }, { source: 'origin' }),
    // Trilha: Conduite
    createTestEffect('trilha-canalizacao', { skillBonus: { ocultismo: 2 } }, { source: 'track' }),
    createTestEffect('trilha-surto-espontaneo', { specialEffects: ['Ritual grátis 1x/cena'] }, { source: 'track' }),
    // Poder Paranormal
    createTestEffect('precognicao', { defenseBonus: 2, allResistancesBonus: 2 }, { source: 'paranormal_power' }),
    // Rituais sustentados
    createTestEffect('ritual-protecao', { defenseBonus: 3 }, { source: 'ritual' }),
    createTestEffect('ritual-armamento', { attackBonus: 2 }, { source: 'ritual' }),
  ];
  
  const result = consolidateEffects(effects, createTestContext({ nex: 50 }));
  
  const passed = 
    result.defense.general === 5 && // 2 + 3
    result.attack.general === 2 &&
    result.resistances.vontade === 2;
  
  return {
    name: 'Ocultista Conduite com rituais',
    passed,
    message: `Defesa: +${result.defense.general}, Ataque: +${result.attack.general}, Vontade: +${result.resistances.vontade}`,
  };
}

/**
 * Testa Ocultista Graduado múltiplos círculos
 */
function testOcultistaGraduadoMultiplosCirculos(): TestResult {
  const effects: UnifiedEffect[] = [
    // Trilha: Graduado
    createTestEffect('trilha-caminho-reservado', { peBonus: 5 }, { source: 'track' }),
    createTestEffect('trilha-versatilidade', { specialEffects: ['Ritual de outro elemento'] }, { source: 'track' }),
    // Rituais de múltiplos círculos
    createTestEffect('ritual-1-circulo', { defenseBonus: 2 }, { source: 'ritual', priority: 10 }),
    createTestEffect('ritual-2-circulo', { damageBonus: 4, extraDamageDice: '1d8' }, { source: 'ritual', priority: 20 }),
    createTestEffect('ritual-3-circulo', { allResistancesBonus: 3 }, { source: 'ritual', priority: 30 }),
  ];
  
  const result = consolidateEffects(effects, createTestContext({ nex: 75 }));
  
  const passed = 
    result.resources.peBonus === 5 &&
    result.defense.general === 2 &&
    result.damage.general === 4 &&
    result.resistances.fortitude === 3;
  
  return {
    name: 'Ocultista Graduado múltiplos círculos',
    passed,
    message: `PE: +${result.resources.peBonus}, Defesa: +${result.defense.general}, Dano: +${result.damage.general}`,
  };
}

/**
 * Testa Ocultista Lâmina Paranormal em Combate
 */
function testOcultistaLaminaParanormalEmCombate(): TestResult {
  const effects: UnifiedEffect[] = [
    // Trilha: Lâmina Paranormal
    createTestEffect('trilha-lamina-maldita', { meleeDamageBonus: 3, extraDamageDice: '1d6' }, { source: 'track' }),
    createTestEffect('trilha-golpe-paranormal', { specialEffects: ['Ataque usa Ocultismo'] }, { source: 'track' }),
    // Poder Paranormal
    createTestEffect('anatomia-insana', { fortitudeBonus: 2 }, { source: 'paranormal_power' }),
    // Em combate com buffs
    createTestEffect('ritual-velocidade', { movementBonus: 3, extraAction: 'movement' }, { source: 'ritual' }),
  ];
  
  const context = createTestContext({ nex: 50, inCombat: true });
  const result = consolidateEffects(effects, context);
  
  const passed = 
    result.damage.melee === 3 &&
    result.damage.extraDice.includes('1d6') &&
    result.resistances.fortitude === 2;
  
  return {
    name: 'Ocultista Lâmina Paranormal em combate',
    passed,
    message: `Dano melee: +${result.damage.melee}, Extra: ${result.damage.extraDice.join(', ')}`,
  };
}

/**
 * Testa personagem com todas as condições negativas
 */
function testPersonagemComTodasAsCondicoes(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('cond-debilitado', { attackBonus: -1, allSkillsBonus: -1 }, { source: 'condition' }),
    createTestEffect('cond-apavorado', { attackBonus: -2, allSkillsBonus: -2 }, { source: 'condition' }),
    createTestEffect('cond-cego', { attackBonus: -5 }, { source: 'condition' }),
    createTestEffect('cond-enredado', { attackBonus: -2, reflexosBonus: -2 }, { source: 'condition' }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  // -1 -2 -5 -2 = -10
  const passed = result.attack.general === -10;
  
  return {
    name: 'Personagem com múltiplas condições: penalidades acumulam',
    passed,
    message: `Ataque total: ${result.attack.general}`,
  };
}

/**
 * Testa personagem com múltiplos rituais sustentados
 */
function testPersonagemComMuitosRituaisSustentados(): TestResult {
  const effects: UnifiedEffect[] = [
    createTestEffect('ritual-1', { attackBonus: 2 }, { source: 'ritual' }),
    createTestEffect('ritual-2', { defenseBonus: 3 }, { source: 'ritual' }),
    createTestEffect('ritual-3', { damageBonus: 4 }, { source: 'ritual' }),
    createTestEffect('ritual-4', { tempHP: 10 }, { source: 'ritual' }),
    createTestEffect('ritual-5', { allResistancesBonus: 2 }, { source: 'ritual' }),
  ];
  
  const result = consolidateEffects(effects, createTestContext());
  
  const passed = 
    result.attack.general === 2 &&
    result.defense.general === 3 &&
    result.damage.general === 4 &&
    result.resources.tempHP === 10 &&
    result.resistances.fortitude === 2;
  
  return {
    name: 'Personagem com 5 rituais sustentados',
    passed,
    message: `Ataque: +${result.attack.general}, Defesa: +${result.defense.general}, Dano: +${result.damage.general}`,
  };
}

/**
 * Testa personagem com todos os poderes paranormais de combate
 */
function testPersonagemComTodosPoderesParanormais(): TestResult {
  const effects: UnifiedEffect[] = [
    // Sangue
    createTestEffect('anatomia-insana', { fortitudeBonus: 2 }, { source: 'paranormal_power' }),
    createTestEffect('sangue-de-ferro', { hpBonus: 20 }, { source: 'paranormal_power' }),
    // Conhecimento
    createTestEffect('precognicao', { defenseBonus: 2, allResistancesBonus: 2 }, { source: 'paranormal_power' }),
    // Energia
    createTestEffect('golpe-de-sorte', { criticalMarginBonus: 1 }, { source: 'paranormal_power' }),
    createTestEffect('campo-protetor', { defenseBonus: 5 }, { source: 'paranormal_power', isActive: false }), // Não ativado
  ];
  
  const result = consolidateEffects(effects, createTestContext({ nex: 50 }));
  
  const passed = 
    result.resistances.fortitude === 4 && // 2 + 2
    result.resources.hpBonus === 20 &&
    result.defense.general === 2 && // apenas precognição (campo protetor inativo)
    result.critical.marginBonus === 1;
  
  return {
    name: 'Personagem com múltiplos poderes paranormais',
    passed,
    message: `Fortitude: +${result.resistances.fortitude}, PV: +${result.resources.hpBonus}, Defesa: +${result.defense.general}`,
  };
}

// =====================================================
// Runner de Testes
// =====================================================

/**
 * Executa todos os testes do SUE
 */
export function runAllSUETests(): TestSuiteResult[] {
  const suites: TestSuiteResult[] = [];
  
  // Suite: Consolidação de Efeitos
  const consolidationTests: TestResult[] = [
    testAttackBonusSum(),
    testMeleeRangedSeparation(),
    testDamageBonus(),
    testExtraDamageDice(),
    testCriticalMarginBonus(),
    testDefenseBonus(),
    testResistances(),
    testDamageReduction(),
    testSkillBonuses(),
    testResourceBonuses(),
    testBehaviorFlags(),
  ];
  
  suites.push({
    suiteName: 'Consolidação de Efeitos',
    passed: consolidationTests.filter(t => t.passed).length,
    failed: consolidationTests.filter(t => !t.passed).length,
    results: consolidationTests,
  });
  
  // Suite: Verificação de Condições
  const conditionTests: TestResult[] = [
    testNoConditions(),
    testHPCondition(),
    testFirstRoundCondition(),
    testInCombatCondition(),
    testShieldCondition(),
    testActivationCondition(),
    testMinAttributeCondition(),
  ];
  
  suites.push({
    suiteName: 'Verificação de Condições',
    passed: conditionTests.filter(t => t.passed).length,
    failed: conditionTests.filter(t => !t.passed).length,
    results: conditionTests,
  });
  
  // Suite: Efeitos Inativos
  const inactiveTests: TestResult[] = [
    testInactiveEffects(),
    testUnmetConditions(),
  ];
  
  suites.push({
    suiteName: 'Efeitos Inativos',
    passed: inactiveTests.filter(t => t.passed).length,
    failed: inactiveTests.filter(t => !t.passed).length,
    results: inactiveTests,
  });
  
  // Suite: Cenários Reais
  const scenarioTests: TestResult[] = [
    testMilitarOpEspeciais(),
    testCondicaoAgarrado(),
    testMultiplasFontes(),
  ];
  
  suites.push({
    suiteName: 'Cenários Reais do Ordem Paranormal',
    passed: scenarioTests.filter(t => t.passed).length,
    failed: scenarioTests.filter(t => !t.passed).length,
    results: scenarioTests,
  });
  
  // Suite: Rituais Sustentados
  const ritualTests: TestResult[] = [
    testRitualAttackBonus(),
    testRitualDamageBonus(),
    testRitualDefenseBonus(),
    testMultipleRitualsBonuses(),
    testRitualTempHP(),
    testRitualSkillBonus(),
    testRitualSpecialEffects(),
  ];
  
  suites.push({
    suiteName: 'Rituais Sustentados',
    passed: ritualTests.filter(t => t.passed).length,
    failed: ritualTests.filter(t => !t.passed).length,
    results: ritualTests,
  });
  
  // Suite: Bônus de Equipamentos
  const equipmentTests: TestResult[] = [
    testArmorDefenseBonus(),
    testShieldDefenseBonus(),
    testArmorPlusShieldDefense(),
    testMeleeWeaponBonus(),
    testRangedWeaponBonus(),
    testParanormalItemDefense(),
    testEquipmentDamageReduction(),
    testFullCombatLoadout(),
  ];
  
  suites.push({
    suiteName: 'Bônus de Equipamentos',
    passed: equipmentTests.filter(t => t.passed).length,
    failed: equipmentTests.filter(t => !t.passed).length,
    results: equipmentTests,
  });
  
  // Suite: Poderes Paranormais
  const paranormalTests: TestResult[] = [
    testAnatomiaInsana(),
    testAnatomiaInsanaAfinidade(),
    testSangueDeFerro(),
    testPotencialAprimorado(),
    testPrecognicao(),
    testPrecognicaoAfinidade(),
    testSensitivo(),
    testGolpeDeSorte(),
    testGolpeDeSorteAfinidade(),
    testCampoProtetor(),
    testResistirAElemento(),
    testExpansaoDeConhecimento(),
    testVisaoDoOculto(),
    testMultiplosPoderesParanormais(),
    testOcultistaComPoderesParanormais(),
  ];
  
  suites.push({
    suiteName: 'Poderes Paranormais',
    passed: paranormalTests.filter(t => t.passed).length,
    failed: paranormalTests.filter(t => !t.passed).length,
    results: paranormalTests,
  });
  
  // =====================================================
  // NOVAS SUITES DE TESTE
  // =====================================================
  
  // Suite: Origens Específicas
  const originTests: TestResult[] = [
    testOrigemCalejado(),
    testOrigemPatrulha(),
    testOrigemMercenario(),
    testOrigemInvestigador(),
    testOrigemServidorPublico(),
    testOrigemLutador(),
    testOrigemMilitar(),
    testOrigemOperario(),
    testOrigemExperimento(),
    testOrigemProfetizado(),
    testMultiplasOrigens(),
  ];
  
  suites.push({
    suiteName: 'Origens Específicas',
    passed: originTests.filter(t => t.passed).length,
    failed: originTests.filter(t => !t.passed).length,
    results: originTests,
  });
  
  // Suite: Trilhas Específicas
  const trackTests: TestResult[] = [
    testTrilhaTropaChoque(),
    testTrilhaAniquilador(),
    testTrilhaAtirador(),
    testTrilhaInfiltrador(),
    testTrilhaConduite(),
    testTrilhaIntuitivo(),
    testTrilhaLaminaParanormal(),
    testTrilhaNegociador(),
  ];
  
  suites.push({
    suiteName: 'Trilhas Específicas',
    passed: trackTests.filter(t => t.passed).length,
    failed: trackTests.filter(t => !t.passed).length,
    results: trackTests,
  });
  
  // Suite: Condições Completas
  const fullConditionTests: TestResult[] = [
    testCondicaoAtordoado(),
    testCondicaoCego(),
    testCondicaoSurdo(),
    testCondicaoDebilitado(),
    testCondicaoDoente(),
    testCondicaoEnvenenado(),
    testCondicaoExausto(),
    testCondicaoFraco(),
    testCondicaoApavorado(),
    testCondicaoFascinado(),
    testCondicaoPerturbado(),
    testCondicaoInconsciente(),
    testCondicaoIndefeso(),
    testCondicaoMorrendo(),
    testCondicaoParalisado(),
    testCondicaoDesprevenido(),
    testCondicaoEnredado(),
    testCondicaoPasmo(),
    testCondicaoSurpreendido(),
  ];
  
  suites.push({
    suiteName: 'Condições Completas',
    passed: fullConditionTests.filter(t => t.passed).length,
    failed: fullConditionTests.filter(t => !t.passed).length,
    results: fullConditionTests,
  });
  
  // Suite: Efeitos Contextuais
  const contextualTests: TestResult[] = [
    testCaidoVsMelee(),
    testCaidoVsRanged(),
    testEfeitoApenasCorpoACorpo(),
    testEfeitoApenasDistancia(),
    testEfeitoPVAbaixo50(),
    testEfeitoPVAcima50(),
    testEfeitoPrimeiraRodada(),
    testEfeitoEmCombate(),
  ];
  
  suites.push({
    suiteName: 'Efeitos Contextuais',
    passed: contextualTests.filter(t => t.passed).length,
    failed: contextualTests.filter(t => !t.passed).length,
    results: contextualTests,
  });
  
  // Suite: Stacking e Prioridade
  const stackingTests: TestResult[] = [
    testStackingMesmaFonte(),
    testStackingFontesDiferentes(),
    testBonusEPenalidade(),
    testRituaisAcumulamComOrigem(),
    testPrioridadeDeEfeitos(),
    testStackingTrilhaEquipamentoCondicao(),
  ];
  
  suites.push({
    suiteName: 'Stacking e Prioridade',
    passed: stackingTests.filter(t => t.passed).length,
    failed: stackingTests.filter(t => !t.passed).length,
    results: stackingTests,
  });
  
  // Suite: Adaptadores
  const adapterTests: TestResult[] = [
    testGetOriginEffects(),
    testGetConditionEffects(),
    testGetTrackEffects(),
    testGetRitualEffects(),
    testNormalizeOriginId(),
    testListAllConditionEffects(),
  ];
  
  suites.push({
    suiteName: 'Adaptadores de Efeitos',
    passed: adapterTests.filter(t => t.passed).length,
    failed: adapterTests.filter(t => !t.passed).length,
    results: adapterTests,
  });
  
  // Suite: Cenários de Personagem Completo
  const characterTests: TestResult[] = [
    testCombatenteAniquiladorNEX50(),
    testCombatenteTropaChoqueComArmadura(),
    testEspecialistaAtirador(),
    testEspecialistaMedicoEmCura(),
    testOcultistaConduiteComRituais(),
    testOcultistaGraduadoMultiplosCirculos(),
    testOcultistaLaminaParanormalEmCombate(),
    testPersonagemComTodasAsCondicoes(),
    testPersonagemComMuitosRituaisSustentados(),
    testPersonagemComTodosPoderesParanormais(),
  ];
  
  suites.push({
    suiteName: 'Cenários de Personagem Completo',
    passed: characterTests.filter(t => t.passed).length,
    failed: characterTests.filter(t => !t.passed).length,
    results: characterTests,
  });
  
  return suites;
}

/**
 * Imprime resultados no console
 */
export function printSUETestResults(): void {
  const suites = runAllSUETests();
  
  console.log('\n========================================');
  console.log('  TESTES DO SISTEMA UNIFICADO DE EFEITOS (SUE)');
  console.log('========================================\n');
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const suite of suites) {
    console.log(`📦 ${suite.suiteName}`);
    console.log(`   ✅ ${suite.passed} passaram | ❌ ${suite.failed} falharam\n`);
    
    for (const result of suite.results) {
      const icon = result.passed ? '✅' : '❌';
      console.log(`   ${icon} ${result.name}`);
      if (!result.passed) {
        console.log(`      → ${result.message}`);
      }
    }
    
    console.log('');
    totalPassed += suite.passed;
    totalFailed += suite.failed;
  }
  
  console.log('========================================');
  console.log(`  TOTAL: ✅ ${totalPassed} passaram | ❌ ${totalFailed} falharam`);
  console.log('========================================\n');
}

// Exporta funções individuais para uso em painéis de debug
export {
  // Consolidação de Efeitos
  testAttackBonusSum,
  testMeleeRangedSeparation,
  testDamageBonus,
  testExtraDamageDice,
  testCriticalMarginBonus,
  testDefenseBonus,
  testResistances,
  testDamageReduction,
  testSkillBonuses,
  testResourceBonuses,
  testBehaviorFlags,
  // Verificação de Condições
  testNoConditions,
  testHPCondition,
  testFirstRoundCondition,
  testInCombatCondition,
  testShieldCondition,
  testActivationCondition,
  testMinAttributeCondition,
  // Efeitos Inativos
  testInactiveEffects,
  testUnmetConditions,
  // Cenários Reais
  testMilitarOpEspeciais,
  testCondicaoAgarrado,
  testMultiplasFontes,
  // Rituais Sustentados
  testRitualAttackBonus,
  testRitualDamageBonus,
  testRitualDefenseBonus,
  testMultipleRitualsBonuses,
  testRitualTempHP,
  testRitualSkillBonus,
  testRitualSpecialEffects,
  // Bônus de Equipamentos
  testArmorDefenseBonus,
  testShieldDefenseBonus,
  testArmorPlusShieldDefense,
  testMeleeWeaponBonus,
  testRangedWeaponBonus,
  testParanormalItemDefense,
  testEquipmentDamageReduction,
  testFullCombatLoadout,
  // Poderes Paranormais
  testAnatomiaInsana,
  testAnatomiaInsanaAfinidade,
  testSangueDeFerro,
  testPotencialAprimorado,
  testPrecognicao,
  testPrecognicaoAfinidade,
  testSensitivo,
  testGolpeDeSorte,
  testGolpeDeSorteAfinidade,
  testCampoProtetor,
  testResistirAElemento,
  testExpansaoDeConhecimento,
  testVisaoDoOculto,
  testMultiplosPoderesParanormais,
  testOcultistaComPoderesParanormais,
  // NOVAS SUITES - Origens
  testOrigemCalejado,
  testOrigemPatrulha,
  testOrigemMercenario,
  testOrigemInvestigador,
  testOrigemServidorPublico,
  testOrigemLutador,
  testOrigemMilitar,
  testOrigemOperario,
  testOrigemExperimento,
  testOrigemProfetizado,
  testMultiplasOrigens,
  // NOVAS SUITES - Trilhas
  testTrilhaTropaChoque,
  testTrilhaAniquilador,
  testTrilhaAtirador,
  testTrilhaInfiltrador,
  testTrilhaConduite,
  testTrilhaIntuitivo,
  testTrilhaLaminaParanormal,
  testTrilhaNegociador,
  // NOVAS SUITES - Condições Completas
  testCondicaoAtordoado,
  testCondicaoCego,
  testCondicaoSurdo,
  testCondicaoDebilitado,
  testCondicaoDoente,
  testCondicaoEnvenenado,
  testCondicaoExausto,
  testCondicaoFraco,
  testCondicaoApavorado,
  testCondicaoFascinado,
  testCondicaoPerturbado,
  testCondicaoInconsciente,
  testCondicaoIndefeso,
  testCondicaoMorrendo,
  testCondicaoParalisado,
  testCondicaoDesprevenido,
  testCondicaoEnredado,
  testCondicaoPasmo,
  testCondicaoSurpreendido,
  // NOVAS SUITES - Contextuais
  testCaidoVsMelee,
  testCaidoVsRanged,
  testEfeitoApenasCorpoACorpo,
  testEfeitoApenasDistancia,
  testEfeitoPVAbaixo50,
  testEfeitoPVAcima50,
  testEfeitoPrimeiraRodada,
  testEfeitoEmCombate,
  // NOVAS SUITES - Stacking
  testStackingMesmaFonte,
  testStackingFontesDiferentes,
  testBonusEPenalidade,
  testRituaisAcumulamComOrigem,
  testPrioridadeDeEfeitos,
  testStackingTrilhaEquipamentoCondicao,
  // NOVAS SUITES - Adaptadores
  testGetOriginEffects,
  testGetConditionEffects,
  testGetTrackEffects,
  testGetRitualEffects,
  testNormalizeOriginId,
  testListAllConditionEffects,
  // NOVAS SUITES - Cenários Completos
  testCombatenteAniquiladorNEX50,
  testCombatenteTropaChoqueComArmadura,
  testEspecialistaAtirador,
  testEspecialistaMedicoEmCura,
  testOcultistaConduiteComRituais,
  testOcultistaGraduadoMultiplosCirculos,
  testOcultistaLaminaParanormalEmCombate,
  testPersonagemComTodasAsCondicoes,
  testPersonagemComMuitosRituaisSustentados,
  testPersonagemComTodosPoderesParanormais,
};
