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
  testNoConditions,
  testHPCondition,
  testFirstRoundCondition,
  testInCombatCondition,
  testShieldCondition,
  testActivationCondition,
  testMinAttributeCondition,
  testInactiveEffects,
  testUnmetConditions,
  testMilitarOpEspeciais,
  testCondicaoAgarrado,
  testMultiplasFontes,
};
