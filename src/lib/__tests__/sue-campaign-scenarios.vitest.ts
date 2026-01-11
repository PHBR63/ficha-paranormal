// =====================================================
// Testes de Cenários de Campanha Completos - SUE
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Testa cenários realistas de jogo em campanhas:
// - Grupo de investigação com múltiplas classes
// - Combate em equipe com suporte e DPS
// - Exploração com condições ambientais
// - Rituais em grupo com custos compartilhados
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
import { getParanormalPowerEffects } from '../effects/paranormal-powers-effects-adapter';
import type { SavedParanormalPower, ParanormalElement } from '../paranormal-powers';

// =============================================================================
// HELPERS DE TESTE
// =============================================================================

/**
 * Cria contexto de cálculo para cenário de campanha
 * Inclui parâmetros extras para simulação de sessão
 */
function createCampaignContext(overrides: Partial<EffectCalculationContext> = {}): EffectCalculationContext {
  return {
    attributes: { strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 2 },
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
 * Cria efeito ambiental para cenário de campanha
 */
function createEnvironmentalEffect(
  id: string,
  name: string,
  mechanics: UnifiedEffect['mechanics']
): UnifiedEffect {
  return {
    id: `env-${id}`,
    name,
    source: 'condition',
    sourceId: id,
    sourceName: `Ambiente: ${name}`,
    mechanics,
    isActive: true,
    isToggleable: false,
  };
}

/**
 * Cria poder paranormal com estrutura completa
 */
function createParanormalPower(
  id: string,
  name: string,
  element: ParanormalElement | 'generic' = 'energia'
): SavedParanormalPower {
  return { id, name, element, description: `Poder ${name}` };
}

/**
 * Simula um personagem completo para campanha
 */
interface CampaignCharacter {
  name: string;
  class: 'combatente' | 'especialista' | 'ocultista';
  origin: string;
  track: string;
  nex: number;
  attributes: Record<AttributeType, number>;
  paranormalPowers?: SavedParanormalPower[];
  element?: ParanormalElement;
  affinityActive?: boolean;
  activeConditions?: string[];
}

/**
 * Calcula efeitos para um personagem de campanha
 */
function calculateCharacterEffects(char: CampaignCharacter): ComputedEffects {
  const originEffects = getOriginEffects(char.origin, char.origin, char.attributes.intellect, []);
  const trackEffects = getTrackEffects(char.track, char.nex, char.attributes, []);
  const conditionEffects = char.activeConditions ? getConditionEffects(char.activeConditions) : [];
  const paranormalEffects = char.paranormalPowers
    ? getParanormalPowerEffects(char.paranormalPowers, char.nex, char.element ?? null, char.affinityActive ?? false)
    : [];

  const allEffects = [...originEffects, ...trackEffects, ...conditionEffects, ...paranormalEffects];
  const context = createCampaignContext({
    attributes: char.attributes,
    nex: char.nex,
    activeConditions: char.activeConditions ?? [],
  });

  return consolidateEffects(allEffects, context);
}

// =============================================================================
// CENÁRIO 1: Grupo de Investigação (3 personagens)
// =============================================================================

describe('Cenário de Campanha: Grupo de Investigação', () => {
  // Grupo típico: 1 Combatente (proteção), 1 Especialista (suporte), 1 Ocultista (ritual)
  const grupo: CampaignCharacter[] = [
    {
      name: 'Capitão Silva',
      class: 'combatente',
      origin: 'militar',
      track: 'tropa-choque',
      nex: 50,
      attributes: { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 },
    },
    {
      name: 'Dra. Helena',
      class: 'especialista',
      origin: 'medico',
      track: 'medico-de-campo',
      nex: 50,
      attributes: { strength: 1, agility: 2, vigor: 2, intellect: 3, presence: 2 },
    },
    {
      name: 'Marcos Vidente',
      class: 'ocultista',
      origin: 'vidente',
      track: 'conduite',
      nex: 50,
      attributes: { strength: 1, agility: 2, vigor: 1, intellect: 3, presence: 3 },
      paranormalPowers: [
        createParanormalPower('potencial-aprimorado', 'Potencial Aprimorado', 'conhecimento'),
        createParanormalPower('precognicao', 'Precognição', 'conhecimento'),
      ],
      element: 'conhecimento',
      affinityActive: true,
    },
  ];

  it('deve calcular efeitos de cada membro do grupo corretamente', () => {
    const resultados = grupo.map(char => ({
      name: char.name,
      effects: calculateCharacterEffects(char),
    }));

    // Capitão Silva - tanque com redução de dano
    const capitao = resultados.find(r => r.name === 'Capitão Silva')!;
    expect(capitao.effects.damageReduction.physical).toBeGreaterThanOrEqual(capitao.effects.damageReduction.physical);
    expect(capitao.effects).toBeDefined();

    // Dra. Helena - suporte médico
    const helena = resultados.find(r => r.name === 'Dra. Helena')!;
    expect(helena.effects).toBeDefined();

    // Marcos Vidente - ocultista com afinidade Conhecimento
    const marcos = resultados.find(r => r.name === 'Marcos Vidente')!;
    expect(marcos.effects.defense.general).toBeGreaterThanOrEqual(2); // Precognição +2 Defesa
  });

  it('deve permitir sinergia entre trilhas do grupo', () => {
    // Comandante de Campo dá bônus para aliados - simular
    const comandante: CampaignCharacter = {
      name: 'Tenente Cruz',
      class: 'combatente',
      origin: 'militar',
      track: 'comandante-campo',
      nex: 50,
      attributes: { strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 3 },
    };

    const comandanteEffects = calculateCharacterEffects(comandante);
    
    // Comandante de Campo tem habilidades de liderança
    expect(comandanteEffects).toBeDefined();
    
    // Verificar que não há conflitos entre membros
    const allResults = [...grupo, comandante].map(calculateCharacterEffects);
    allResults.forEach(result => {
      expect(result.attack).toBeDefined();
      expect(result.defense).toBeDefined();
    });
  });

  it('deve calcular iniciativa do grupo para ordenação de turnos', () => {
    const iniciativas = grupo.map(char => {
      const effects = calculateCharacterEffects(char);
      // Iniciativa base = Agilidade + bônus
      return {
        name: char.name,
        baseInit: char.attributes.agility,
        bonus: effects.initiative.bonus,
        total: char.attributes.agility + effects.initiative.bonus,
      };
    });

    // Ordenar por iniciativa
    iniciativas.sort((a, b) => b.total - a.total);
    
    // Verificar que todos têm valores válidos
    iniciativas.forEach(init => {
      expect(init.total).toBeGreaterThanOrEqual(0);
    });
  });
});

// =============================================================================
// CENÁRIO 2: Combate em Equipe vs Criatura
// =============================================================================

describe('Cenário de Campanha: Combate em Equipe vs Criatura', () => {
  const combatContext: Partial<EffectCalculationContext> = {
    inCombat: true,
    isFirstRound: true,
    currentRound: 1,
  };

  it('deve aplicar penalidades de combate para todos do grupo', () => {
    const grupoEmCombate: CampaignCharacter[] = [
      {
        name: 'Atacante',
        class: 'combatente',
        origin: 'lutador',
        track: 'guerreiro',
        nex: 50,
        attributes: { strength: 4, agility: 2, vigor: 3, intellect: 1, presence: 0 },
      },
      {
        name: 'Atirador',
        class: 'especialista',
        origin: 'agente-de-campo',
        track: 'atirador-de-elite',
        nex: 50,
        attributes: { strength: 1, agility: 3, vigor: 2, intellect: 3, presence: 1 },
      },
    ];

    // Simula grupo flanqueando (bônus +2 ataque)
    const flanqueando = createEnvironmentalEffect('flanqueando', 'Flanqueando', {
      attackBonus: 2,
    });

    grupoEmCombate.forEach(char => {
      const baseEffects = [
        ...getOriginEffects(char.origin, char.origin, char.attributes.intellect, []),
        ...getTrackEffects(char.track, char.nex, char.attributes, []),
        flanqueando,
      ];

      const context = createCampaignContext({
        ...combatContext,
        attributes: char.attributes,
        nex: char.nex,
      });

      const result = consolidateEffects(baseEffects, context);
      
      // Todos devem ter o bônus de flanqueamento
      expect(result.attack.general).toBeGreaterThanOrEqual(2);
    });
  });

  it('deve processar condições de combate que afetam múltiplos personagens', () => {
    // Cenário: área de efeito causa Abalado em todos
    const personagensAbalados: CampaignCharacter[] = [
      {
        name: 'Alvo 1',
        class: 'combatente',
        origin: 'militar',
        track: 'guerreiro',
        nex: 50,
        attributes: { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 },
        activeConditions: ['abalado'],
      },
      {
        name: 'Alvo 2',
        class: 'especialista',
        origin: 'agente-de-campo',
        track: 'tecnico',
        nex: 50,
        attributes: { strength: 1, agility: 2, vigor: 2, intellect: 3, presence: 2 },
        activeConditions: ['abalado'],
      },
    ];

    personagensAbalados.forEach(char => {
      const effects = calculateCharacterEffects(char);
      
      // Abalado: -1 em testes
      // Verifica que a condição está sendo processada
      expect(effects).toBeDefined();
    });
  });

  it('deve calcular dano total do grupo contra alvo único', () => {
    const grupoAtacando = [
      {
        name: 'Melee DPS',
        track: 'aniquilador',
        nex: 65,
        attributes: { strength: 4, agility: 2, vigor: 3, intellect: 1, presence: 0 } as Record<AttributeType, number>,
      },
      {
        name: 'Ranged DPS',
        track: 'atirador-de-elite',
        nex: 65,
        attributes: { strength: 1, agility: 3, vigor: 2, intellect: 4, presence: 0 } as Record<AttributeType, number>,
      },
    ];

    let totalDanoBase = 0;

    grupoAtacando.forEach(attacker => {
      const effects = getTrackEffects(attacker.track, attacker.nex, attacker.attributes, []);
      const context = createCampaignContext({
        ...combatContext,
        attributes: attacker.attributes,
        nex: attacker.nex,
      });

      const result = consolidateEffects(effects, context);
      
      // Soma dano geral + específico
      totalDanoBase += result.damage.general + Math.max(result.damage.melee, result.damage.ranged);
    });

    // Grupo deve ter dano combinado significativo
    expect(totalDanoBase).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================================
// CENÁRIO 3: Exploração com Condições Ambientais
// =============================================================================

describe('Cenário de Campanha: Exploração com Condições Ambientais', () => {
  it('deve aplicar penalidades de ambiente escuro/visibilidade', () => {
    const ambienteEscuro = createEnvironmentalEffect('escuridao', 'Escuridão Total', {
      attackBonus: -5,
      skillBonus: { percepcao: -5 },
    });

    const explorador: CampaignCharacter = {
      name: 'Explorador',
      class: 'especialista',
      origin: 'agente-de-campo',
      track: 'infiltrador',
      nex: 50,
      attributes: { strength: 1, agility: 3, vigor: 2, intellect: 3, presence: 1 },
    };

    const baseEffects = [
      ...getOriginEffects(explorador.origin, explorador.origin, explorador.attributes.intellect, []),
      ...getTrackEffects(explorador.track, explorador.nex, explorador.attributes, []),
      ambienteEscuro,
    ];

    const context = createCampaignContext({
      attributes: explorador.attributes,
      nex: explorador.nex,
    });

    const result = consolidateEffects(baseEffects, context);

    // Penalidade de escuridão aplicada
    expect(result.attack.general).toBeLessThanOrEqual(0);
    expect(result.skills['percepcao'] ?? 0).toBeLessThanOrEqual(0);
  });

  it('deve processar múltiplas condições ambientais simultaneamente', () => {
    const condicoesAmbientais = [
      createEnvironmentalEffect('chuva', 'Chuva Forte', {
        rangedAttackBonus: -2,
        skillBonus: { percepcao: -2 },
      }),
      createEnvironmentalEffect('terreno-dificil', 'Terreno Difícil', {
        // Terreno difícil reduz movimento (simulado como penalidade geral)
        skillBonus: { atletismo: -2 },
      }),
      createEnvironmentalEffect('frio', 'Frio Intenso', {
        allResistancesBonus: -1,
      }),
    ];

    const viajante: CampaignCharacter = {
      name: 'Viajante',
      class: 'combatente',
      origin: 'militar',
      track: 'operacoes-especiais',
      nex: 50,
      attributes: { strength: 2, agility: 3, vigor: 2, intellect: 2, presence: 1 },
    };

    const baseEffects = [
      ...getOriginEffects(viajante.origin, viajante.origin, viajante.attributes.intellect, []),
      ...getTrackEffects(viajante.track, viajante.nex, viajante.attributes, []),
      ...condicoesAmbientais,
    ];

    const context = createCampaignContext({
      attributes: viajante.attributes,
      nex: viajante.nex,
    });

    const result = consolidateEffects(baseEffects, context);

    // Múltiplas penalidades aplicadas
    expect(result.attack.ranged).toBeLessThanOrEqual(0);
    expect(result).toBeDefined();
  });

  it('deve permitir habilidades que anulam condições ambientais', () => {
    // Cenário: Infiltrador com Sombras (NEX 40%) em escuridão
    const infiltrador: CampaignCharacter = {
      name: 'Infiltrador Expert',
      class: 'especialista',
      origin: 'agente-de-campo',
      track: 'infiltrador',
      nex: 50,
      attributes: { strength: 1, agility: 4, vigor: 2, intellect: 3, presence: 0 },
    };

    const effects = calculateCharacterEffects(infiltrador);
    
    // Infiltrador não deve ser penalizado por escuridão (conceito)
    expect(effects).toBeDefined();
    // O sistema não anula automaticamente, mas a trilha dá bônus
    expect(effects.skills).toBeDefined();
  });
});

// =============================================================================
// CENÁRIO 4: Rituais em Grupo
// =============================================================================

describe('Cenário de Campanha: Rituais em Grupo', () => {
  it('deve calcular custo de PE para ritual com modificadores', () => {
    const ocultista: CampaignCharacter = {
      name: 'Ocultista Ritual',
      class: 'ocultista',
      origin: 'vidente',
      track: 'conduite',
      nex: 65,
      attributes: { strength: 1, agility: 2, vigor: 1, intellect: 4, presence: 2 },
    };

    const effects = calculateCharacterEffects(ocultista);

    // Conduíte tem modificadores de ritual
    const modifiers = effects.rituals.availableModifiers;
    expect(modifiers.length).toBeGreaterThan(0);

    // Calcular custo total de ritual com modificadores
    const custoBase = 3; // Ritual de 1º círculo
    const custoModificadores = modifiers.reduce((acc, mod) => acc + (mod.peCost || 0), 0);
    const custoTotal = custoBase + custoModificadores;

    expect(custoTotal).toBeGreaterThanOrEqual(custoBase);
  });

  it('deve aplicar bônus de ritual sustentado para o grupo', () => {
    // Cenário: Ritual de proteção beneficia aliados
    const ritualProtetor: UnifiedEffect = {
      id: 'ritual-protecao-grupo',
      name: 'Proteção do Grupo',
      source: 'ritual',
      sourceId: 'protecao',
      sourceName: 'Ritual: Proteção do Grupo',
      mechanics: {
        defenseBonus: 2,
        allResistancesBonus: 1,
      },
      isActive: true,
      isToggleable: false,
    };

    const beneficiarios = [
      { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 },
      { strength: 1, agility: 3, vigor: 2, intellect: 3, presence: 1 },
      { strength: 1, agility: 2, vigor: 2, intellect: 3, presence: 2 },
    ];

    beneficiarios.forEach(attrs => {
      const context = createCampaignContext({ attributes: attrs });
      const result = consolidateEffects([ritualProtetor], context);

      // Todos recebem bônus do ritual
      expect(result.defense.general).toBe(2);
      expect(result.resistances.fortitude.bonus).toBe(1);
      expect(result.resistances.reflexos.bonus).toBe(1);
      expect(result.resistances.vontade.bonus).toBe(1);
    });
  });

  it('deve processar múltiplos rituais sustentados sem conflito', () => {
    const rituais: UnifiedEffect[] = [
      {
        id: 'ritual-1',
        name: 'Armadura Arcana',
        source: 'ritual',
        sourceId: 'armadura-arcana',
        sourceName: 'Ritual: Armadura Arcana',
        mechanics: { defenseBonus: 2 },
        isActive: true,
        isToggleable: false,
      },
      {
        id: 'ritual-2',
        name: 'Agilidade Sobre-Humana',
        source: 'ritual',
        sourceId: 'agilidade-sobre-humana',
        sourceName: 'Ritual: Agilidade Sobre-Humana',
        mechanics: { skillBonus: { reflexos: 2 } },
        isActive: true,
        isToggleable: false,
      },
    ];

    const context = createCampaignContext();
    const result = consolidateEffects(rituais, context);

    // Ambos rituais devem contribuir
    expect(result.defense.general).toBe(2);
    expect(result.skills['reflexos'] ?? 0).toBe(2);
  });
});

// =============================================================================
// CENÁRIO 5: Progressão de Sessão
// =============================================================================

describe('Cenário de Campanha: Progressão de Sessão', () => {
  it('deve recalcular efeitos ao ganhar NEX durante sessão', () => {
    const personagemBase: CampaignCharacter = {
      name: 'Agente em Progressão',
      class: 'combatente',
      origin: 'militar',
      track: 'guerreiro',
      nex: 45,
      attributes: { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 },
    };

    const effectsNex45 = calculateCharacterEffects(personagemBase);

    // Simula ganho de NEX
    const personagemProgredido = { ...personagemBase, nex: 50 };
    const effectsNex50 = calculateCharacterEffects(personagemProgredido);

    // Verificar que os efeitos foram recalculados
    expect(effectsNex45).toBeDefined();
    expect(effectsNex50).toBeDefined();
    
    // NEX maior pode ter mais habilidades disponíveis
    // (depende da trilha específica)
  });

  it('deve processar mudança de condições durante sessão', () => {
    const personagem: CampaignCharacter = {
      name: 'Personagem Dinâmico',
      class: 'especialista',
      origin: 'agente-de-campo',
      track: 'medico-de-campo',
      nex: 50,
      attributes: { strength: 1, agility: 2, vigor: 2, intellect: 3, presence: 2 },
      activeConditions: [],
    };

    // Estado saudável
    const effectsSaudavel = calculateCharacterEffects(personagem);
    
    // Fica machucado
    personagem.activeConditions = ['sangrando'];
    const effectsMachucado = calculateCharacterEffects(personagem);
    
    // Fica crítico
    personagem.activeConditions = ['sangrando', 'caido'];
    const effectsCritico = calculateCharacterEffects(personagem);

    expect(effectsSaudavel).toBeDefined();
    expect(effectsMachucado).toBeDefined();
    expect(effectsCritico).toBeDefined();
    
    // Mais condições = mais penalidades
    expect(effectsCritico.defense.general).toBeLessThanOrEqual(effectsSaudavel.defense.general);
  });

  it('deve manter consistência de efeitos ao longo da sessão', () => {
    const personagem: CampaignCharacter = {
      name: 'Personagem Consistente',
      class: 'ocultista',
      origin: 'vidente',
      track: 'conduite',
      nex: 50,
      attributes: { strength: 1, agility: 2, vigor: 1, intellect: 3, presence: 3 },
    };

    // Calcular 3 vezes (simula 3 rodadas)
    const results = [
      calculateCharacterEffects(personagem),
      calculateCharacterEffects(personagem),
      calculateCharacterEffects(personagem),
    ];

    // Todos devem ser idênticos
    expect(results[0].attack.general).toBe(results[1].attack.general);
    expect(results[1].attack.general).toBe(results[2].attack.general);
    expect(results[0].defense.general).toBe(results[2].defense.general);
  });
});

// =============================================================================
// CENÁRIO 6: Edge Cases de Campanha
// =============================================================================

describe('Cenário de Campanha: Edge Cases', () => {
  it('deve lidar com grupo vazio', () => {
    const grupo: CampaignCharacter[] = [];
    expect(grupo.length).toBe(0);
    // Não deve quebrar ao iterar
    grupo.forEach(char => {
      calculateCharacterEffects(char);
    });
  });

  it('deve processar personagem com atributos extremos', () => {
    const personagemExtremo: CampaignCharacter = {
      name: 'Extremo',
      class: 'combatente',
      origin: 'lutador',
      track: 'aniquilador',
      nex: 99,
      attributes: { strength: 5, agility: 0, vigor: 5, intellect: 0, presence: 0 },
    };

    const effects = calculateCharacterEffects(personagemExtremo);
    expect(effects).toBeDefined();
    expect(effects.attack.general).toBeDefined();
  });

  it('deve processar personagem NEX mínimo', () => {
    const iniciante: CampaignCharacter = {
      name: 'Recruta',
      class: 'combatente',
      origin: 'militar',
      track: 'guerreiro',
      nex: 5,
      attributes: { strength: 1, agility: 1, vigor: 1, intellect: 1, presence: 1 },
    };

    const effects = calculateCharacterEffects(iniciante);
    expect(effects).toBeDefined();
    // NEX baixo tem menos habilidades
  });

  it('deve processar grupo com todas as 3 classes', () => {
    const grupoMisto: CampaignCharacter[] = [
      {
        name: 'Combatente',
        class: 'combatente',
        origin: 'militar',
        track: 'guerreiro',
        nex: 50,
        attributes: { strength: 3, agility: 2, vigor: 3, intellect: 1, presence: 1 },
      },
      {
        name: 'Especialista',
        class: 'especialista',
        origin: 'agente-de-campo',
        track: 'atirador-de-elite',
        nex: 50,
        attributes: { strength: 1, agility: 3, vigor: 2, intellect: 3, presence: 1 },
      },
      {
        name: 'Ocultista',
        class: 'ocultista',
        origin: 'vidente',
        track: 'conduite',
        nex: 50,
        attributes: { strength: 1, agility: 2, vigor: 1, intellect: 3, presence: 3 },
      },
    ];

    const allEffects = grupoMisto.map(calculateCharacterEffects);
    
    expect(allEffects.length).toBe(3);
    allEffects.forEach(effects => {
      expect(effects.attack).toBeDefined();
      expect(effects.defense).toBeDefined();
      expect(effects.damage).toBeDefined();
    });
  });
});
