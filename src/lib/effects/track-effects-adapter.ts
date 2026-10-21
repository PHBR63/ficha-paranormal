// =====================================================
// Adaptador de Efeitos de Trilha - EXPANDIDO
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Converte habilidades de todas as 10 trilhas (5 Combatente + 5 Especialista)
// para o formato UnifiedEffect.
//
// TRILHAS COMBATENTE:
// - Aniquilador: Especialização em arma favorita
// - Comandante de Campo: Liderança tática
// - Guerreiro: Combate corpo a corpo devastador
// - Operações Especiais: Velocidade e ações adicionais
// - Tropa de Choque: Resistência e proteção
//
// TRILHAS ESPECIALISTA:
// - Atirador de Elite: Precisão com armas de fogo longas
// - Infiltrador: Furtividade e ataques furtivos
// - Médico de Campo: Cura e suporte
// - Negociador: Manipulação social
// - Técnico: Equipamentos e inventário
//

import type { UnifiedEffect, EffectMechanics, AttributeType } from '../unified-effects-engine';
import { getTrackById, getUnlockedAbilities } from '../class-powers/track-registry';
import type { UnifiedTrackAbility, TrackAbilityMechanics } from '../class-powers/track-types';

// =============================================================================
// CONSTANTES DE EFEITOS ATIVÁVEIS POR TRILHA
// =============================================================================

/**
 * IDs dos efeitos ativáveis de cada trilha para integração com useActivatedEffects
 * Formato: track-{ability-id}
 */
export const TRACK_EFFECT_MAPPINGS = {
  // === COMBATENTE ===
  aniquilador: {
    trackId: 'aniquilador',
    effects: {
      'track-tecnica-amplo': { name: 'Técnica Amplo', minNex: 40, peCost: 2 },
      'track-tecnica-destruidor': { name: 'Técnica Destruidor', minNex: 40, peCost: 2 },
      'track-tecnica-letal': { name: 'Técnica Letal', minNex: 65, peCost: 2, stackable: true },
      'track-tecnica-perfurante': { name: 'Técnica Perfurante', minNex: 65, peCost: 2 },
    }
  },
  comandanteCampo: {
    trackId: 'comandante-campo',
    effects: {
      'track-inspirar-confianca': { name: 'Inspirar Confiança', minNex: 10, peCost: 2 },
      'track-estrategista': { name: 'Estrategista', minNex: 40, peCost: 1 },
      'track-brecha-na-guarda': { name: 'Brecha na Guarda', minNex: 65, peCost: 2 },
      'track-oficial-comandante': { name: 'Oficial Comandante', minNex: 99, peCost: 5 },
    }
  },
  guerreiro: {
    trackId: 'guerreiro',
    effects: {
      'track-revidar': { name: 'Revidar', minNex: 40, peCost: 2 },
      'track-forca-opressora': { name: 'Força Opressora', minNex: 65, peCost: 1 },
    }
  },
  operacoesEspeciais: {
    trackId: 'operacoes-especiais',
    effects: {
      'track-ataque-extra': { name: 'Ataque Extra', minNex: 40, peCost: 2 },
      'track-surto-de-adrenalina': { name: 'Surto de Adrenalina', minNex: 65, peCost: 5 },
    }
  },
  tropaChoque: {
    trackId: 'tropa-choque',
    effects: {
      'track-cai-dentro': { name: 'Cai Dentro', minNex: 40, peCost: 1 },
      'track-duro-de-matar': { name: 'Duro de Matar', minNex: 65, peCost: 2 },
    }
  },
  // === ESPECIALISTA ===
  atiradorElite: {
    trackId: 'atirador-elite',
    effects: {
      'track-disparo-letal': { name: 'Disparo Letal', minNex: 40, peCost: 1 },
      'track-disparo-impactante': { name: 'Disparo Impactante', minNex: 65, peCost: 2 },
    }
  },
  infiltrador: {
    trackId: 'infiltrador',
    effects: {
      'track-ataque-furtivo-trilha': { name: 'Ataque Furtivo', minNex: 10, peCost: 1 },
      'track-assassinar': { name: 'Assassinar', minNex: 65, peCost: 3 },
      'track-sombra-fugaz': { name: 'Sombra Fugaz', minNex: 99, peCost: 3 },
    }
  },
  medicoCampo: {
    trackId: 'medico-campo',
    effects: {
      'track-paramedico': { name: 'Paramédico', minNex: 10, peCost: 2 },
      'track-equipe-trauma': { name: 'Equipe de Trauma', minNex: 40, peCost: 2 },
      'track-reanimacao': { name: 'Reanimação', minNex: 99, peCost: 10 },
    }
  },
  negociador: {
    trackId: 'negociador',
    effects: {
      'track-eloquencia': { name: 'Eloquência', minNex: 10, peCost: 1 },
      'track-discurso-motivador': { name: 'Discurso Motivador', minNex: 40, peCost: 4 },
      'track-truque-mestre': { name: 'Truque de Mestre', minNex: 99, peCost: 5 },
    }
  },
  tecnico: {
    trackId: 'tecnico',
    effects: {
      'track-remendo': { name: 'Remendo', minNex: 40, peCost: 1 },
      'track-improvisar': { name: 'Improvisar', minNex: 65, peCost: 2 },
      'track-preparado-para-tudo': { name: 'Preparado para Tudo', minNex: 99, peCost: 3 },
    }
  },
  // === OCULTISTA ===
  condutor: {
    trackId: 'condutor',
    effects: {
      'track-ampliar-ritual': {
        name: 'Ampliar Ritual',
        minNex: 10,
        peCost: 2,
        description: 'Aumenta alcance em um passo OU dobra área de efeito'
      },
      'track-acelerar-ritual': {
        name: 'Acelerar Ritual',
        minNex: 40,
        peCost: 4,
        perRound: true,
        description: 'Conjura ritual como ação livre (1x por rodada)'
      },
      'track-anular-ritual': {
        name: 'Anular Ritual',
        minNex: 65,
        peCost: 0, // Custo variável (igual ao ritual alvo)
        variableCost: true,
        description: 'Teste oposto de Ocultismo para anular ritual'
      },
    }
  },
  flagelador: {
    trackId: 'flagelador',
    effects: {
      'track-poder-do-flagelo': {
        name: 'Poder do Flagelo',
        minNex: 10,
        peCost: 0, // Passivo - gasta PV em vez de PE
        description: 'Pode gastar 2 PV para cada 1 PE ao conjurar rituais'
      },
      'track-abracar-a-dor': {
        name: 'Abraçar a Dor',
        minNex: 40,
        peCost: 2,
        description: 'Reação: reduz dano não-paranormal pela metade'
      },
      'track-absorver-angustia': {
        name: 'Absorver Agonia',
        minNex: 65,
        peCost: 0, // Passivo com trigger
        description: 'Ao reduzir inimigo a 0 PV com ritual, ganha PE temporários iguais ao círculo usado'
      },
    }
  },
  graduado: {
    trackId: 'graduado',
    effects: {
      // Graduado não tem efeitos ativáveis com custo de PE
      // Todas as habilidades são passivas:
      // - Saber Ampliado (NEX 10%): +1 ritual por círculo (passivo)
      // - Grimório Ritualístico (NEX 40%): Intelecto rituais extras (passivo)
      // - Rituais Eficientes (NEX 65%): +5 DT rituais (passivo)
      // - Conhecendo o Medo (NEX 99%): Aprende ritual (passivo)
    }
  },
  intuitivo: {
    trackId: 'intuitivo',
    effects: {
      // Intuitivo foca em resistência mental e paranormal
      // - Mente Sã (NEX 10%): +5 nos testes de resistência contra efeitos paranormais
      // - Presença Poderosa (NEX 40%): Adiciona Presença ao limite de PE por turno para rituais (passivo)
      // - Inabalável (NEX 65%): Resistência a dano mental 10 + teste de Vontade (passivo)
      // - Presença do Medo (NEX 99%): Aprende ritual (passivo)
      // Nenhum efeito ativável com custo de PE - todas são passivas
    }
  },
  // === OCULTISTA - LÂMINA PARANORMAL ===
  laminaParanormal: {
    trackId: 'lamina-paranormal',
    effects: {
      'track-lamina-maldita': {
        name: 'Lâmina Maldita',
        minNex: 10,
        peCost: 1, // +1 PE para reduzir tempo de conjuração para movimento
        description: 'Aprende Amaldiçoar Arma. +1 PE para conjurar como movimento. Usa Ocultismo para ataques.'
      },
      'track-conjuracao-marcial': {
        name: 'Conjuração Marcial',
        minNex: 65,
        peCost: 2,
        perRound: true,
        description: 'Ao conjurar ritual com ação padrão, faz ataque corpo a corpo como ação livre'
      },
    }
  },
} as const;

// =============================================================================
// CONVERSÃO DE MECÂNICAS
// =============================================================================

/**
 * Converte uma habilidade de trilha para EffectMechanics
 * Usa effects.base ao invés de mechanics conforme a interface UnifiedTrackAbility
 * 
 * Suporta todas as 10 trilhas:
 * - Bônus de dano fixo e por atributo
 * - Ataque Furtivo escalonado por NEX
 * - Bônus de crítico, iniciativa, perícias
 * - Redução de categoria
 * - Ações extras
 * - Resistência a dano
 * - E muito mais...
 */
function convertTrackAbilityToMechanics(
  ability: UnifiedTrackAbility,
  attributes: Record<AttributeType, number>,
  nex: number
): EffectMechanics {
  const mechanics: EffectMechanics = {};
  const m = ability.effects?.base;

  if (!m) return mechanics;

  // === BÔNUS DE DANO (com suporte a atributo) ===
  if (m.damageBonus) {
    const dmgBonus = m.damageBonus;

    // Se o bônus usa um atributo, calcula o valor baseado no atributo
    if (dmgBonus.attribute) {
      const attrValue = attributes[dmgBonus.attribute as AttributeType] || 0;

      // Aplica condicionalmente baseado no tipo de arma
      if (dmgBonus.conditions?.weaponType === 'firearm-long') {
        // Mira de Elite: +INT em dano com armas de fogo longas
        mechanics.rangedDamageBonus = attrValue;
        mechanics.conditionalNote = 'Apenas armas de fogo com balas longas';
      } else if (dmgBonus.conditions?.weaponType === 'melee') {
        mechanics.meleeDamageBonus = attrValue;
      } else if (dmgBonus.conditions?.weaponType === 'ranged') {
        mechanics.rangedDamageBonus = attrValue;
      } else {
        mechanics.damageBonus = attrValue;
      }
    }
    // Bônus fixo de dano
    else if (dmgBonus.value) {
      if (dmgBonus.conditions?.weaponType === 'melee') {
        mechanics.meleeDamageBonus = dmgBonus.value;
      } else if (dmgBonus.conditions?.weaponType === 'ranged') {
        mechanics.rangedDamageBonus = dmgBonus.value;
      } else {
        mechanics.damageBonus = dmgBonus.value;
      }
    }

    // Dados extras de dano (Máquina de Matar)
    // Se type === 'weapon', usa marcador especial "NW" (N = count, W = weapon die)
    // que será substituído pelo dado real da arma no momento da rolagem
    if (dmgBonus.extraDice) {
      if (dmgBonus.extraDice.type === 'weapon') {
        // Marcador especial: "1W" significa "1 dado do tipo da arma"
        mechanics.extraDamageDice = `${dmgBonus.extraDice.count}W`;
      } else {
        mechanics.extraDamageDice = `${dmgBonus.extraDice.count}${dmgBonus.extraDice.dieType || 'd6'}`;
      }
    }
  }

  // Ataque Furtivo usa somente a mecânica dedicada abaixo. Incluí-lo nos dados
  // genéricos causava dano passivo e somava a habilidade outra vez ao ativá-la.

  // === BÔNUS DE CRÍTICO ===
  if (m.criticalBonus) {
    if (m.criticalBonus.marginBonus) {
      mechanics.criticalMarginBonus = m.criticalBonus.marginBonus;

      // Se é específico para corpo a corpo (Técnica Letal)
      if (m.criticalBonus.conditions?.weaponType === 'melee') {
        mechanics.conditionalNote = 'Apenas ataques corpo a corpo';
      }
    }
    if (m.criticalBonus.multiplierBonus) {
      mechanics.criticalMultiplierBonus = m.criticalBonus.multiplierBonus;
    }
  }

  // === INICIATIVA (Operações Especiais) ===
  if (m.initiativeBonus) {
    mechanics.initiativeBonus = m.initiativeBonus;
  }

  // === PV ADICIONAL POR NEX (Tropa de Choque - Casca Grossa) ===
  if (m.hpPerNexPercent) {
    // O catálogo guarda PV por ponto de NEX (0,2), não por incremento de 5%.
    const bonus = Math.floor(m.hpPerNexPercent * nex);
    mechanics.hpBonus = bonus;
  }

  // === RESISTÊNCIA PARANORMAL ===
  if (m.paranormalResistance) {
    mechanics.paranormalDamageReduction = m.paranormalResistance;
  }

  // Mente Sã concede bônus apenas ao teste contra o paranormal; não é RD.
  if (m.paranormalResistanceTestBonus) {
    mechanics.paranormalResistanceTestBonus = m.paranormalResistanceTestBonus;
    mechanics.conditionalNote = `+${m.paranormalResistanceTestBonus} em testes de resistência contra efeitos paranormais`;
  }

  // === RESISTÊNCIA A DANO MENTAL ===
  if (m.mentalDamageResistance) {
    mechanics.damageResistance = { mental: m.mentalDamageResistance };
  }

  // === PERÍCIAS ===
  if (m.skillBonus) {
    mechanics.skillBonus = {};
    for (const skill of m.skillBonus.skills) {
      mechanics.skillBonus[skill] = m.skillBonus.bonus;
    }
  }

  // === PROFICIÊNCIAS ===
  if (m.proficiencies) {
    mechanics.grantsProficiency = m.proficiencies;
  }

  // === FLAGS ESPECIAIS ===

  // Usar PV como PE (Flagelador)
  if (m.hpAsPE) {
    mechanics.hpCostPerPE = m.hpCostPerPE;
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push('Pode usar PV como PE para rituais');
  }

  // Ocultismo como ataque (Lâmina Paranormal)
  if (m.occultismAsAttack) {
    // Mapeia diretamente para EffectMechanics.occultismAsAttack
    mechanics.occultismAsAttack = true;

    // Também adiciona aos specialEffects para backward compatibility
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push('Pode usar Ocultismo em ataques corpo a corpo');
  }

  // === DANO MÁXIMO EM CRÍTICO (Atirar para Matar) ===
  if (m.maximumDamageOnCritical) {
    // Mapeia diretamente para EffectMechanics.maximumDamageOnCritical
    mechanics.maximumDamageOnCritical = {
      weaponType: m.maximumDamageOnCritical.weaponType as 'firearm' | 'melee' | 'any',
    };

    // Também adiciona aos specialEffects para backward compatibility
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push('Crítico com arma de fogo causa dano máximo');
    mechanics.maximumDamageOnCrit = true;
  }

  // === MULTIPLICADOR DE ATAQUE ESPECIAL (Guerreiro - Potência Máxima) ===
  if (m.specialAttackMultiplier) {
    mechanics.specialAttackMultiplier = {
      value: m.specialAttackMultiplier,
      weaponRestriction: 'melee', // Potência Máxima é apenas corpo a corpo
    };

    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push(`Ataque Especial: bônus numéricos x${m.specialAttackMultiplier} (corpo a corpo)`);
  }

  // === REDUÇÃO DE DANO (Duro de Matar, Inquebrável) ===
  if (m.damageReduction) {
    if (m.damageReduction.type === 'fixed' && m.damageReduction.fixedAmount) {
      mechanics.damageReduction = m.damageReduction.fixedAmount;
    } else if (m.damageReduction.type === 'half') {
      if (!mechanics.specialEffects) mechanics.specialEffects = [];
      const types = m.damageReduction.damageTypes.join(', ');
      mechanics.specialEffects.push(`Reduz dano ${types} pela metade`);
    }
  }

  // === EFEITOS QUANDO MACHUCADO (Inquebrável) ===
    // IMPORTANTE: Bônus são CONDICIONAIS (metade ou menos dos PV).
  // NÃO mapear para campos estáticos (defenseBonus, damageReduction) para evitar duplicação
  if (m.whenWounded) {
    // Mapeia apenas para EffectMechanics.whenWounded (condicional)
    // O motor unified-effects-engine.ts aplica automaticamente quando isWounded = true
    mechanics.whenWounded = {
      hpThreshold: 50, // Padrão: PV abaixo de 50%
      defenseBonus: m.whenWounded.defenseBonus,
      damageReduction: m.whenWounded.damageResistance,
    };

    // Nota para exibição (sem valores mapeados estaticamente)
    mechanics.conditionalNote = 'Quando machucado (PV ≤ 50%)';
  }

  // === EFEITOS QUANDO MORRENDO (Inquebrável) ===
  if (m.whenDying) {
    // Mapeia diretamente para EffectMechanics.whenDying
    mechanics.whenDying = {
      canAct: m.whenDying.canAct ?? false,
      notHelpless: m.whenDying.notHelpless ?? false,
    };

    // Também adiciona aos specialEffects para backward compatibility
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    if (m.whenDying.canAct) {
      mechanics.specialEffects.push('Pode agir normalmente quando morrendo');
    }
    if (m.whenDying.notHelpless) {
      mechanics.specialEffects.push('Não fica indefeso quando morrendo');
    }
  }

  // === AÇÕES EXTRAS (Operações Especiais, Guerreiro) ===
  if (m.extraActions && m.extraActions.length > 0) {
    if (!mechanics.specialEffects) mechanics.specialEffects = [];

    for (const action of m.extraActions) {
      // Mapeia para extraActionsTrack (apenas a primeira ação - o SUE consolida múltiplas)
      // Esta é uma conversão simplificada; cada habilidade gera seu próprio efeito
      mechanics.extraActionsTrack = {
        type: action.type as 'attack' | 'movement' | 'standard' | 'standard-or-movement' | 'maneuver',
        trigger: action.trigger as 'on-attack' | 'on-block' | 'on-melee-hit' | 'on-ritual-cast' | 'first-round' | 'combat-start' | 'on-demand',
        peCost: 0, // Custo é definido no activation da habilidade
        actionType: 'free',
        weaponRestriction: action.weaponRestriction as 'melee' | 'ranged' | 'firearm' | 'any' | undefined,
        maneuverOptions: action.maneuverOptions,
        replaceDamage: action.replaceDamage,
        perRound: false,
        perScene: false,
      };

      // Adiciona aos specialEffects para backward compatibility
      let desc = '';

      switch (action.type) {
        case 'movement':
          if (action.trigger === 'first-round') {
            desc = 'Ação de movimento adicional na primeira rodada';
          } else {
            desc = 'Ação de movimento adicional';
          }
          break;
        case 'standard':
          if (action.trigger === 'combat-start') {
            desc = 'Ação padrão adicional no início do combate';
          } else {
            desc = 'Ação padrão adicional';
          }
          break;
        case 'standard-or-movement':
          desc = 'Ação padrão ou de movimento adicional';
          break;
        case 'attack':
          if (action.trigger === 'on-block') {
            desc = 'Ataque corpo a corpo ao bloquear';
          } else {
            desc = 'Ataque adicional';
          }
          break;
        case 'maneuver':
          if (action.maneuverOptions) {
            desc = `Manobra: ${action.maneuverOptions.join(' ou ')}`;
          }
          break;
        default:
          desc = `Ação adicional: ${action.type}`;
      }

      if (desc) {
        mechanics.specialEffects.push(desc);
      }
    }
  }

  // === PROVOCAR (Taunt - Cai Dentro) ===
  if (m.taunt) {
    const rangeMapTaunt: Record<string, 'curto' | 'medio' | 'longo'> = {
      'touch': 'curto',
      'short': 'curto',
      'medium': 'medio',
      'long': 'longo',
      'curto': 'curto',
      'medio': 'medio',
      'longo': 'longo',
    };

    mechanics.taunt = {
      range: rangeMapTaunt[m.taunt.range] || 'curto',
      resistanceTest: m.taunt.resistanceTest,
      dtAttribute: m.taunt.dtAttribute as AttributeType,
      peCost: 1, // Default: 1 PE (Cai Dentro)
      actionType: 'reaction', // Default: reação
    };

    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push(`Provocar: alvo deve atacar você (${m.taunt.resistanceTest})`);
  }

  // === CONTROLE DE ESTADO DO ALVO (Assassinar) ===
  if (m.targetStateControl) {
    mechanics.targetStateControl = {
      options: m.targetStateControl.options,
      resistanceTest: m.targetStateControl.resistanceTest,
      dtAttribute: m.targetStateControl.dtAttribute as AttributeType,
    };

    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push(`Controle de estado: ${m.targetStateControl.options.join(' ou ')}`);
  }

  // === BÔNUS DE BLOQUEIO COM VIGOR (Casca Grossa) ===
  if (m.blockVigorBonus) {
    mechanics.blockVigorBonus = true;

    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push('Soma Vigor na RD ao bloquear');
  }

  // === LIDERANÇA (Comandante de Campo) ===
  if (m.leadership) {
    // Converte range do formato track-types para EffectMechanics
    const rangeMap: Record<string, 'curto' | 'medio' | 'longo' | 'alcance-voz'> = {
      'touch': 'curto',
      'short': 'curto',
      'medium': 'medio',
      'long': 'longo',
    };

    // Converte maxAllies para o formato do EffectMechanics
    let maxAlliesValue: number | 'intellect' | 'presence' = 1;
    if (typeof m.leadership.maxAllies === 'number') {
      maxAlliesValue = m.leadership.maxAllies;
    } else if (m.leadership.maxAllies === 'intellect') {
      maxAlliesValue = 'intellect';
    }

    // Converte allyEffects do formato Record<string, boolean> para o esperado
    const allyEffects: {
      rerollTest?: boolean;
      extraMovementAction?: boolean;
      extraAttack?: boolean;
      extraStandardAction?: boolean;
      tempHP?: number;
      bonusToNextTest?: number;
    } = {
      rerollTest: m.leadership.allyEffects.rerollTest ?? false,
      extraMovementAction: m.leadership.allyEffects.extraMovementAction ?? false,
      extraAttack: m.leadership.allyEffects.extraAttack ?? false,
      extraStandardAction: m.leadership.allyEffects.extraStandardAction ?? false,
    };

    mechanics.leadership = {
      range: rangeMap[m.leadership.range] || 'medio',
      maxAllies: maxAlliesValue,
      peCost: 0, // TrackAbilityMechanics não define, usar custo da ativação
      actionType: 'free',
      allyEffects,
    };

    // Também adiciona aos specialEffects para backward compatibility
    if (!mechanics.specialEffects) mechanics.specialEffects = [];

    const range = rangeMap[m.leadership.range] || m.leadership.range;
    let maxAlliesDesc = '';
    if (typeof m.leadership.maxAllies === 'number') {
      maxAlliesDesc = ` (até ${m.leadership.maxAllies} aliados)`;
    } else if (m.leadership.maxAllies === 'intellect') {
      maxAlliesDesc = ` (até Intelecto aliados)`;
    }

    const effects = Object.entries(m.leadership.allyEffects)
      .filter(([_, value]) => value)
      .map(([key]) => {
        switch (key) {
          case 'rerollTest': return 'rerolar teste';
          case 'extraMovementAction': return 'ação de movimento extra';
          case 'extraAttack': return 'ataque adicional';
          case 'extraStandardAction': return 'ação padrão extra';
          default: return key;
        }
      });

    if (effects.length > 0) {
      mechanics.specialEffects.push(
        `Aliados em alcance ${range}${maxAlliesDesc}: ${effects.join(', ')}`
      );
    }
  }

  // === BUFF PARA ALIADOS (Negociador - Discurso Motivador) ===
  if (m.allyBuff) {
    // Converte range para formato do EffectMechanics
    const rangeMap: Record<string, 'curto' | 'medio' | 'longo' | 'alcance-voz'> = {
      'short': 'curto',
      'medium': 'medio',
      'long': 'longo',
    };

    // Converte duration para formato do EffectMechanics
    const durationMap: Record<string, 'scene' | 'combat' | 'turns'> = {
      'scene': 'scene',
      'combat': 'combat',
      'turns': 'turns',
    };

    mechanics.allyBuff = {
      range: rangeMap[m.allyBuff.range] || 'curto',
      skillBonus: m.allyBuff.skillBonus || 0,
      peCost: 0, // Será definido pela ativação da habilidade
      actionType: 'standard',
      duration: durationMap[m.allyBuff.duration] || 'scene',
      includeSelf: m.allyBuff.includeSelf,
    };

    // Também adiciona aos specialEffects para backward compatibility
    if (!mechanics.specialEffects) mechanics.specialEffects = [];

    const range = rangeMap[m.allyBuff.range] || m.allyBuff.range;
    const duration = m.allyBuff.duration === 'scene' ? 'até o final da cena' : m.allyBuff.duration;
    const selfNote = m.allyBuff.includeSelf ? ' (inclui você)' : '';

    mechanics.specialEffects.push(
      `Aliados em alcance ${range}${selfNote}: +${m.allyBuff.skillBonus} em testes de perícia (${duration})`
    );
  }

  // === EFEITO SOCIAL (Negociador - Eloquência) ===
  if (m.socialEffect) {
    // Converte range para formato do EffectMechanics
    const rangeMap: Record<string, 'curto' | 'medio' | 'longo' | 'alcance-voz'> = {
      'short': 'curto',
      'medium': 'medio',
      'long': 'longo',
    };

    // Converte duration para formato do EffectMechanics
    const durationMap: Record<string, 'concentration' | 'scene' | 'turns'> = {
      'concentration': 'concentration',
      'scene': 'scene',
      'turns': 'turns',
    };

    mechanics.socialEffect = {
      range: rangeMap[m.socialEffect.range] || 'curto',
      targetAll: m.socialEffect.targetAll,
      skillOptions: m.socialEffect.skillOptions || [],
      resistanceSkill: m.socialEffect.resistanceSkill,
      effect: m.socialEffect.effect,
      duration: durationMap[m.socialEffect.duration] || 'concentration',
      peCost: 0, // Será definido pela ativação da habilidade
      actionType: 'standard',
      immunityOnSuccess: m.socialEffect.immunityOnSuccess,
      resistanceBonusOnSuccess: 5, // +5 em resistência após sucesso (oficial)
    };

    // Também adiciona aos specialEffects para backward compatibility
    if (!mechanics.specialEffects) mechanics.specialEffects = [];

    const range = rangeMap[m.socialEffect.range] || m.socialEffect.range;
    const skills = m.socialEffect.skillOptions?.join(' / ') || 'perícia social';
    const duration = m.socialEffect.duration === 'concentration' ? 'enquanto concentrar' : m.socialEffect.duration;

    mechanics.specialEffects.push(
      `${skills} vs ${m.socialEffect.resistanceSkill} (alcance ${range}): aplica ${m.socialEffect.effect} (${duration})`
    );
  }

  // === REDE DE CONTATOS (Negociador - Eu Conheço um Cara) ===
  if (m.contacts) {
    mechanics.contacts = {
      usesPerMission: 1, // 1 vez por missão (oficial)
      availableEffects: m.contacts.effects || [],
      gmDiscretion: m.contacts.gmDiscretion ?? true,
      peCost: 0, // Sem custo em PE
      actionType: 'varies',
    };

    // Também adiciona aos specialEffects para backward compatibility
    if (!mechanics.specialEffects) mechanics.specialEffects = [];

    const effects = m.contacts.effects?.join(', ') || 'favores';
    mechanics.specialEffects.push(
      `Rede de contatos: ${effects} (1x por missão, a critério do mestre)`
    );
  }

  // === CÓPIA DE HABILIDADE (Negociador - Truque de Mestre) ===
  if (m.copyAbility) {
    // Converte source para formato do EffectMechanics
    const sourceMap: Record<string, 'ally' | 'enemy' | 'any'> = {
      'ally': 'ally',
      'enemy': 'enemy',
      'any': 'any',
    };

    mechanics.copyAbility = {
      source: sourceMap[m.copyAbility.source] || 'ally',
      seenInScene: m.copyAbility.seenInScene,
      ignorePrerequisites: m.copyAbility.ignorePrerequisites,
      payOriginalCosts: m.copyAbility.payOriginalCosts,
      peCost: 5, // Custo padrão do Truque de Mestre (oficial)
      actionType: 'varies', // Depende da habilidade copiada
    };

    // Também adiciona aos specialEffects para backward compatibility
    if (!mechanics.specialEffects) mechanics.specialEffects = [];

    const sourceDesc = m.copyAbility.source === 'ally' ? 'de aliados' : 'de qualquer um';
    const prereqNote = m.copyAbility.ignorePrerequisites ? ' (ignora pré-requisitos)' : '';

    mechanics.specialEffects.push(
      `Copiar habilidade ${sourceDesc}${prereqNote}: 5 PE + custos originais (1x por cena)`
    );
  }

  // =====================================================
  // TÉCNICO - Mecânicas de inventário e equipamento
  // =====================================================

  // === CAPACIDADE DE CARGA (Inventário Otimizado) ===
  if (m.carryCapacity) {
    // Converte atributo para formato do EffectMechanics
    const attrMap: Record<string, 'strength' | 'agility' | 'vigor' | 'intellect' | 'presence'> = {
      'strength': 'strength',
      'agility': 'agility',
      'vigor': 'vigor',
      'intellect': 'intellect',
      'presence': 'presence',
    };

    mechanics.carryCapacity = {
      addAttribute: attrMap[m.carryCapacity.addAttribute] || 'intellect',
    };

    // Também adiciona aos specialEffects para backward compatibility
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push(
      `+${m.carryCapacity.addAttribute.toUpperCase()} na capacidade de carga`
    );
  }

  // === REDUÇÃO DE ESPAÇO DE ITEM (Inventário Otimizado) ===
  if (m.itemSpaceReduction) {
    mechanics.itemSpaceReduction = m.itemSpaceReduction;

    // Também adiciona aos specialEffects para backward compatibility
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push(
      `Itens ocupam ${m.itemSpaceReduction} espaço(s) a menos (mínimo 1)`
    );
  }

  // === REPARAR EQUIPAMENTO (Remendo) ===
  if (m.repairEquipment) {
    // Converte range para formato do EffectMechanics
    const rangeMap: Record<string, 'self' | 'touch' | 'short'> = {
      'self': 'self',
      'touch': 'touch',
      'adjacent': 'touch',
      'short': 'short',
    };

    mechanics.repairEquipment = {
      range: rangeMap[m.repairEquipment.range] || 'touch',
      removeCondition: m.repairEquipment.removeCondition,
      peCost: 1, // Custo padrão do Remendo
      actionType: 'complete',
    };

    // Também adiciona aos specialEffects para backward compatibility
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push(
      `Reparar equipamento: remove ${m.repairEquipment.removeCondition} (1 PE, ação completa)`
    );
  }

  // === CRIAR EQUIPAMENTO (Improvisar) ===
  if (m.createEquipment) {
    // Converte type para formato do EffectMechanics
    const typeMap: Record<string, 'general' | 'weapon' | 'armor' | 'any'> = {
      'general': 'general',
      'weapon': 'weapon',
      'armor': 'armor',
      'any': 'any',
    };

    // Converte duration para formato do EffectMechanics
    const durationMap: Record<string, 'scene' | 'combat' | 'permanent'> = {
      'scene': 'scene',
      'combat': 'combat',
      'permanent': 'permanent',
    };

    mechanics.createEquipment = {
      type: typeMap[m.createEquipment.type] || 'general',
      duration: durationMap[m.createEquipment.duration] || 'scene',
      destroyedAfter: m.createEquipment.destroyedAfter,
      peCost: 2, // Custo padrão do Improvisar
      actionType: 'complete',
    };

    // Também adiciona aos specialEffects para backward compatibility
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    const destroyNote = m.createEquipment.destroyedAfter ? ' (destruído após)' : '';
    mechanics.specialEffects.push(
      `Improvisar equipamento ${m.createEquipment.type}: dura até fim da cena${destroyNote} (2 PE, ação completa)`
    );
  }

  // === RETIRAR ITEM RETROATIVAMENTE (Preparado para Tudo) ===
  if (m.retrieveItem) {
    mechanics.retrieveItem = {
      excludeWeapons: m.retrieveItem.excludeWeapons,
      retroactive: m.retrieveItem.retroactive,
      peCostPerCategory: 3, // Custo padrão: 3 PE por categoria
      actionType: 'movement',
    };

    // Também adiciona aos specialEffects para backward compatibility
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    const excludeNote = m.retrieveItem.excludeWeapons ? ' (exceto armas)' : '';
    mechanics.specialEffects.push(
      `Retirar item retroativamente${excludeNote}: 3 PE por categoria (ação de movimento)`
    );
  }

  // === CURA (Médico de Campo) ===
  if (m.healing) {
    const scalingDice = m.healing.scalingDice;

    // Encontra dados base (NEX 10%)
    let baseDice = 2; // Padrão do Paramédico
    let dieType = 'd10';

    if (scalingDice && scalingDice[10]) {
      baseDice = scalingDice[10].dice;
      dieType = scalingDice[10].dieType;
    }

    mechanics.healing = {
      baseDice,
      dieType,
      scaling: scalingDice,
      peCost: m.healing.peCost,
      extraDicePECost: m.healing.extraDicePECost,
      range: m.healing.range,
      actionType: 'standard', // Paramédico usa ação padrão
    };
  }

  // === REDUÇÃO DE CATEGORIA (Aniquilador, Técnico) ===
  // Agora mapeado diretamente para categoryReduction do EffectMechanics
  if (m.categoryReduction) {
    mechanics.categoryReduction = {
      amount: m.categoryReduction.amount,
      targetType: m.categoryReduction.targetType,
      requiresChoice: m.categoryReduction.requiresChoice,
      choiceDescription: m.categoryReduction.choiceDescription,
      appliesToAllCarried: m.categoryReduction.appliesToAllCarried,
    };
  }

  // === TÉCNICAS DO ANIQUILADOR ===
  if (m.techniqueEffects && m.techniqueEffects.length > 0) {
    if (!mechanics.specialEffects) mechanics.specialEffects = [];

    const techniqueNames = m.techniqueEffects.map(t => t.name).join(', ');
    mechanics.specialEffects.push(`Técnicas disponíveis: ${techniqueNames} (2 PE cada)`);
  }

  // === MULTIPLICADOR DE ATAQUE ESPECIAL (Potência Máxima) ===
  if (m.specialAttackMultiplier) {
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push(
      `Ataque Especial corpo a corpo: bônus numéricos x${m.specialAttackMultiplier}`
    );
  }

  // === ATAQUE FURTIVO (Infiltrador) ===
  if (m.sneakAttack) {
    // Encontra os dados base para NEX 10%
    const baseEntry = m.sneakAttack.scaling[10] || m.sneakAttack.scaling[5] || { dice: 1, dieType: 'd6' };

    mechanics.sneakAttack = {
      baseDice: baseEntry.dice,
      dieType: baseEntry.dieType,
      scaling: m.sneakAttack.scaling,
      conditions: m.sneakAttack.conditions || [],
      peCost: m.sneakAttack.peCost,
      usesPerRound: m.sneakAttack.usesPerRound,
    };
  }

  // === MULTIPLICADOR DE ATAQUE FURTIVO (Assassinar) ===
  if (m.sneakAttackMultiplier) {
    // Se já tem sneakAttack, adiciona multiplicador
    if (mechanics.sneakAttack) {
      mechanics.sneakAttack.multiplier = m.sneakAttackMultiplier;
    } else {
      // Cria sneakAttack com multiplicador (herdará dados da habilidade base)
      mechanics.sneakAttack = {
        baseDice: 0,
        dieType: 'd6',
        conditions: [],
        peCost: 0,
        usesPerRound: 0,
        multiplier: m.sneakAttackMultiplier,
      };
    }
  }

  // === BÔNUS DE DT DE RITUAL (Graduado - Rituais Eficientes) ===
  // AGORA mapeado corretamente para ritualDTBonus do EffectMechanics
  if (m.ritualDTBonus) {
    mechanics.ritualDTBonus = m.ritualDTBonus;
  }

  // === MODIFICADORES DE RITUAL (Conduíte - Ampliar/Acelerar Ritual) ===
  // Convertidos para ritualModifiers do EffectMechanics para integração com SUE
  if (m.ritualModifier) {
    if (!mechanics.ritualModifiers) mechanics.ritualModifiers = [];

    const mod = m.ritualModifier;

    // Mapeia o tipo do modificador para o formato do SUE
    let modifierType: 'range' | 'action' | 'area' | 'duration' | 'counter' = 'range';
    let modifierId = '';
    let modifierName = '';

    switch (mod.type) {
      case 'range':
        modifierType = 'range';
        modifierId = 'ampliar-ritual-alcance';
        modifierName = 'Ampliar Ritual (Alcance)';
        break;
      case 'speed':
        modifierType = 'action';
        modifierId = 'acelerar-ritual';
        modifierName = 'Acelerar Ritual';
        break;
      case 'counter':
        // Anular Ritual é uma reação com custo variável
        modifierType = 'counter';
        modifierId = 'anular-ritual';
        modifierName = 'Anular Ritual';
        break;
    }

    // Adiciona o modificador ao array
    mechanics.ritualModifiers.push({
      id: modifierId,
      name: modifierName,
      type: modifierType,
      effect: mod.effect,
      peCost: mod.additionalPECost,
      perRound: mod.type === 'speed', // Acelerar Ritual é 1x por rodada
      isActivatable: true, // Todos os modificadores requerem ativação manual
      variableCost: mod.type === 'counter', // Anular Ritual tem custo variável
      actionType: mod.type === 'counter' ? 'reaction' : undefined, // Anular é reação
    });

    // Também adiciona área para Ampliar Ritual (é alternativo ao alcance)
    if (mod.type === 'range') {
      mechanics.ritualModifiers.push({
        id: 'ampliar-ritual-area',
        name: 'Ampliar Ritual (Área)',
        type: 'area',
        effect: 'Dobra a área de efeito do ritual',
        peCost: mod.additionalPECost,
        perRound: false,
        isActivatable: true,
      });
    }
  }

  // === CONTRA-MÁGICA (Anular Ritual - Conduíte) ===
  // Agora mapeado diretamente para counterSpell do EffectMechanics
  if (m.counterSpell) {
    mechanics.counterSpell = {
      costMatchesTarget: m.counterSpell.costMatchesTarget,
      testSkill: m.counterSpell.testSkill,
      testType: m.counterSpell.testType as 'opposed' | 'fixed',
    };
  }

  // === RITUAIS CONCEDIDOS (grantsRitual) ===
  if (m.grantsRitual) {
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    // Formata o nome do ritual de forma legível
    const ritualName = m.grantsRitual
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    mechanics.specialEffects.push(`Ritual concedido: ${ritualName}`);
  }

  // === RECURSO: PV COMO PE (Flagelador) ===
  if (m.hpAsPE) {
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push(`Pode usar PV como PE para rituais (${m.hpCostPerPE ?? 2} PV = 1 PE)`);
  }

  // === PE TEMPORÁRIO (Flagelador, Lâmina Paranormal) ===
  if (m.temporaryPE) {
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    const tp = m.temporaryPE;

    if (tp.trigger === 'on-kill-with-ritual') {
      mechanics.specialEffects.push(`Ao reduzir inimigo a 0 PV com ritual: +PE temporário igual ao círculo do ritual`);
    } else if (tp.trigger === 'on-melee-hit') {
      const max = tp.maxPerScene === 'pe-limit' ? 'limite de PE por turno' : tp.maxPerScene;
      mechanics.specialEffects.push(`Ao acertar ataque corpo a corpo: +${tp.amount} PE temporário (máx: ${max} por cena)`);
    } else if (tp.trigger === 'on-damage') {
      const max = tp.maxPerScene === 'pe-limit' ? 'limite de PE por turno' : tp.maxPerScene;
      mechanics.specialEffects.push(`Ao sofrer dano: recupera PE (metade do dano)`);
    }
  }

  // === RITUAIS BÔNUS (Graduado - Saber Ampliado) ===
  if (m.bonusRituals) {
    // Mapeia diretamente para EffectMechanics.bonusRituals
    mechanics.bonusRituals = {
      perCircle: m.bonusRituals.perCircle,
      ignoresLimit: m.bonusRituals.ignoresLimit ?? true,
      circleRestriction: m.bonusRituals.circleRestriction,
    };

    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push(
      `+${m.bonusRituals.perCircle} ritual extra por círculo (não conta no limite)`
    );
  }

  // === GRIMÓRIO (Graduado) ===
  if (m.grimoire) {
    // Mapeia diretamente para EffectMechanics.grimoire
    mechanics.grimoire = {
      maxRituals: m.grimoire.maxRituals === 'intellect' ? 'intellect' : m.grimoire.maxRituals,
      allowedCircles: m.grimoire.allowedCircles,
      bonusPerNewCircle: m.grimoire.bonusPerNewCircle ?? 0,
      castingAction: (m.grimoire.castingAction as 'standard' | 'complete' | 'extended') || 'complete',
      preparationAction: m.grimoire.preparationAction === 'complete' ? 'full' : undefined,
      requiresWielding: m.grimoire.requiresWielding ?? true,
      inventorySlots: m.grimoire.inventorySlots ?? 1,
    };

    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    const maxRituals = m.grimoire.maxRituals === 'intellect' ? 'Intelecto' : m.grimoire.maxRituals;
    mechanics.specialEffects.push(
      `Grimório: até ${maxRituals} rituais de ${m.grimoire.allowedCircles.join('º ou ')}º círculo`
    );
  }

  // === LIMITE DE PE AMPLIADO (Intuitivo - Presença Poderosa) ===
  if (m.addAttributeToPELimit) {
    // Mapeia diretamente para EffectMechanics.addAttributeToPELimit
    mechanics.addAttributeToPELimit = m.addAttributeToPELimit as AttributeType;

    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    const attrName = m.addAttributeToPELimit === 'presence' ? 'Presença' : m.addAttributeToPELimit;
    mechanics.specialEffects.push(
      `Soma limite de PE por turno à ${attrName} para calcular efeitos de rituais`
    );
  }

  // === BÔNUS DE PODER DE RITUAL (Conduíte Aprimorado) ===
  if (m.ritualPowerBonus) {
    mechanics.ritualPowerBonus = {
      addPELimit: m.ritualPowerBonus.addPELimit ?? false,
      affectsDT: m.ritualPowerBonus.affectsDT ?? false,
      affectsDamage: m.ritualPowerBonus.affectsDamage ?? false,
    };

    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    const effects = [];
    if (m.ritualPowerBonus.affectsDT) effects.push('DT');
    if (m.ritualPowerBonus.affectsDamage) effects.push('dano/cura');
    if (effects.length > 0) {
      mechanics.specialEffects.push(
        `Poder de ritual afeta ${effects.join(' e ')}`
      );
    }
  }

  // === RESTRIÇÃO DE RECUPERAÇÃO DE PV (Flagelador) ===
  if (m.hpRecoveryRestriction) {
    mechanics.hpRecoveryRestriction = m.hpRecoveryRestriction as 'none' | 'rest-only' | 'magic-only';

    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    if (m.hpRecoveryRestriction === 'rest-only') {
      mechanics.specialEffects.push('Só recupera PV com descanso (não cura não-mágica)');
    } else if (m.hpRecoveryRestriction === 'magic-only') {
      mechanics.specialEffects.push('Só recupera PV com rituais ou poderes paranormais');
    }
  }

  // === RD PARANORMAL COM TESTE (Resistência Paranormal) ===
  if (m.paranormalDamageTest) {
    mechanics.paranormalDamageTest = {
      testSkill: m.paranormalDamageTest.testSkill || 'vontade',
      onSuccess: m.paranormalDamageTest.onSuccess as 'negate' | 'half',
      onFailure: m.paranormalDamageTest.onFailure as 'half' | 'full',
      dtType: m.paranormalDamageTest.dtType as 'fixed' | 'ritual-dt' | 'caster-presence' | 'existing-test',
      requiresExistingHalfDamageSave: m.paranormalDamageTest.requiresExistingHalfDamageSave,
      fixedDT: m.paranormalDamageTest.fixedDT,
    };

    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    const successEffect = m.paranormalDamageTest.onSuccess === 'negate' ? 'nega' : 'reduz pela metade';
    mechanics.specialEffects.push(
      m.paranormalDamageTest.requiresExistingHalfDamageSave
        ? 'Em efeito paranormal com teste para metade do dano: sucesso evita o dano; falha aplica o dano normal'
        : `Teste de ${m.paranormalDamageTest.testSkill} vs dano paranormal: ${successEffect} em sucesso`
    );
  }

  // === REDUÇÃO DE DANO MENTAL (Mente Sã) ===
  if (m.mentalDamageResistance) {
    mechanics.mentalDamageResistance = m.mentalDamageResistance;
  }

  // === RD PARANORMAL (Resistência Paranormal) ===
  if (m.paranormalResistance) {
    mechanics.paranormalDamageReduction = m.paranormalResistance;
  }

  // === MODIFICADORES DE PE (Rituais Eficientes) ===
  if (m.peModifiers) {
    mechanics.peModifiers = m.peModifiers;
  }

  // =====================================================
  // FASE 3: SUPORTE (Médico de Campo, Resgate)
  // =====================================================

  // === MOVIMENTO LIVRE PARA ALIADO (Resgate) ===
  if (m.freeMovementTo) {
    // Suporta tanto formato v1.0 (condition singular) quanto v1.3 (conditions array)
    const conditions = m.freeMovementTo.conditions ??
      (m.freeMovementTo.condition ? [m.freeMovementTo.condition] : ['ally-dying']);

    mechanics.freeMovementTo = {
      conditions,
      range: m.freeMovementTo.range,
      perRound: m.freeMovementTo.perRound ?? true,
    };

    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    const condDescMap: Record<string, string> = {
      'ally-dying': 'aliado morrendo',
      'ally-wounded': 'aliado machucado',
      'ally-at-0-hp': 'aliado com 0 PV',
      'any-ally': 'qualquer aliado'
    };
    const condDescs = conditions.map(c => condDescMap[c] || c).join(' ou ');
    const rangeDesc = m.freeMovementTo.range === 'short' ? ' em alcance curto' : '';
    mechanics.specialEffects.push(
      `Movimento livre até ${condDescs}${rangeDesc} (1x por rodada)`
    );
  }

  // === EFEITOS AO CURAR (Médico de Campo - Resgate) ===
  if (m.onHeal) {
    mechanics.onHeal = {
      targetDefenseBonus: m.onHeal.targetDefenseBonus,
      duration: m.onHeal.duration as 'next-attack' | 'end-of-round' | 'turns',
      turns: m.onHeal.turns,
    };

    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    if (m.onHeal.targetDefenseBonus) {
      const durationDesc = m.onHeal.duration === 'next-attack'
        ? 'até o próximo ataque'
        : m.onHeal.duration === 'end-of-round'
          ? 'até o fim da rodada'
          : `por ${m.onHeal.turns} rodadas`;
      mechanics.specialEffects.push(
        `Ao curar: +${m.onHeal.targetDefenseBonus} Defesa para o alvo (${durationDesc})`
      );
    }
  }

  // === REMOÇÃO DE CONDIÇÃO (Equipe de Trauma) ===
  if (m.removeCondition) {
    mechanics.removeCondition = {
      range: m.removeCondition.range as 'self' | 'touch' | 'short',
      excludedConditions: m.removeCondition.excludedConditions || [],
      peCost: m.removeCondition.peCost ?? 2,
      actionType: m.removeCondition.actionType as 'standard' | 'complete',
    };

    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    const rangeDesc = m.removeCondition.range === 'touch' ? 'toque' : m.removeCondition.range;
    const excluded = m.removeCondition.excludedConditions?.join(', ') || 'nenhuma';
    mechanics.specialEffects.push(
      `Remove condição negativa (${rangeDesc}, exceto: ${excluded})`
    );
  }

  // === RESSURREIÇÃO (Reanimação) ===
  if (m.resurrect) {
    mechanics.resurrect = {
      excludedDeathTypes: m.resurrect.excludedDeathTypes || [],
      sameSceneOnly: m.resurrect.sameSceneOnly ?? true,
      usesPerScene: m.resurrect.usesPerScene ?? 1,
      peCost: m.resurrect.peCost ?? 10,
      actionType: m.resurrect.actionType as 'complete' | 'full-round',
      hpRestored: m.resurrect.hpRestored as 'roll' | 'half' | 'full' | 'one',
    };

    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    const hpDesc = m.resurrect.hpRestored === 'one' ? '1 PV (regra desta mesa)'
      : m.resurrect.hpRestored === 'roll' ? 'rolagem de cura'
        : m.resurrect.hpRestored === 'half' ? 'metade dos PV'
          : m.resurrect.hpRestored === 'full' ? 'PV total' : 'PV a definir pela mesa';
    const excluded = m.resurrect.excludedDeathTypes
      ?.map(type => type === 'massive-damage' ? 'morte por dano massivo' : type)
      .join(', ') || 'nenhuma';
    mechanics.specialEffects.push(
      `Reanimar aliado (${mechanics.resurrect.peCost} PE, ${hpDesc}, exceto: ${excluded})`
    );
  }

  // =====================================================
  // FASE 4: INFILTRADOR AVANÇADO
  // =====================================================

  // === REMOVE/REDUZ PENALIDADE DE FURTIVIDADE AO MOVER ===
  if (m.stealthMovementPenalty) {
    // Lida com tipo union: boolean | { removes?: boolean; reducesBy?: number }
    if (typeof m.stealthMovementPenalty === 'boolean') {
      // Se é boolean true, significa que remove a penalidade
      mechanics.stealthMovementPenalty = {
        removes: true,
      };

      if (!mechanics.specialEffects) mechanics.specialEffects = [];
      mechanics.specialEffects.push('Ignora penalidade de furtividade ao mover');
    } else {
      // É um objeto com propriedades detalhadas
      mechanics.stealthMovementPenalty = {
        removes: m.stealthMovementPenalty.removes ?? false,
        reducesBy: m.stealthMovementPenalty.reducesBy,
      };

      if (!mechanics.specialEffects) mechanics.specialEffects = [];
      if (m.stealthMovementPenalty.removes) {
        mechanics.specialEffects.push('Ignora penalidade de furtividade ao mover');
      } else if (m.stealthMovementPenalty.reducesBy) {
        mechanics.specialEffects.push(
          `Reduz penalidade de furtividade ao mover em ${m.stealthMovementPenalty.reducesBy}`
        );
      }
    }
  }

  // === IGNORA PENALIDADES DE FURTIVIDADE ===
  if (m.ignoreStealthPenalty) {
    // Lida com tipo union: boolean | { movementPenalty?: boolean; armorPenalty?: boolean; allPenalties?: boolean }
    if (typeof m.ignoreStealthPenalty === 'boolean') {
      // Se é boolean true, significa que ignora todas as penalidades
      mechanics.ignoreStealthPenalty = {
        movementPenalty: true,
        armorPenalty: true,
        allPenalties: true,
      };

      if (!mechanics.specialEffects) mechanics.specialEffects = [];
      mechanics.specialEffects.push('Ignora todas as penalidades de furtividade');
    } else {
      // É um objeto com propriedades detalhadas
      mechanics.ignoreStealthPenalty = {
        movementPenalty: m.ignoreStealthPenalty.movementPenalty ?? false,
        armorPenalty: m.ignoreStealthPenalty.armorPenalty ?? false,
        allPenalties: m.ignoreStealthPenalty.allPenalties ?? false,
      };

      if (!mechanics.specialEffects) mechanics.specialEffects = [];
      if (m.ignoreStealthPenalty.allPenalties) {
        mechanics.specialEffects.push('Ignora todas as penalidades de furtividade');
      } else {
        const ignored = [];
        if (m.ignoreStealthPenalty.movementPenalty) ignored.push('movimento');
        if (m.ignoreStealthPenalty.armorPenalty) ignored.push('armadura');
        if (ignored.length > 0) {
          mechanics.specialEffects.push(`Ignora penalidade de furtividade: ${ignored.join(', ')}`);
        }
      }
    }
  }

  // === MULTIPLICADOR DE ATAQUE FURTIVO (já mapeado, mas agora também para EffectMechanics) ===
  if (m.sneakAttackMultiplier && typeof m.sneakAttackMultiplier === 'number') {
    mechanics.sneakAttackMultiplier = m.sneakAttackMultiplier;
  }

  // === INVENTÁRIO OTIMIZADO (Técnico) ===
  if (m.itemSpaceReduction) {
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push(
      `Itens ocupam ${m.itemSpaceReduction} espaço a menos`
    );
  }

  if (m.carryCapacity?.addAttribute) {
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    const attrName = m.carryCapacity.addAttribute === 'intellect' ? 'Intelecto' : m.carryCapacity.addAttribute;
    mechanics.specialEffects.push(
      `Soma ${attrName} à capacidade de carga`
    );
  }

  // === DESCRIÇÃO COMO EFEITO ESPECIAL (fallback) ===
  const hasNumericMechanics =
    mechanics.attackBonus || mechanics.damageBonus || mechanics.defenseBonus ||
    mechanics.meleeDamageBonus || mechanics.rangedDamageBonus ||
    mechanics.criticalMarginBonus || mechanics.initiativeBonus ||
    mechanics.hpBonus || mechanics.damageReduction || mechanics.extraDamageDice;

  if (!hasNumericMechanics && !mechanics.specialEffects?.length && ability.description) {
    if (!mechanics.specialEffects) mechanics.specialEffects = [];
    mechanics.specialEffects.push(ability.description);
  }

  return mechanics;
}

/**
 * Verifica se a habilidade requer ativação manual
 */
function requiresActivation(m: TrackAbilityMechanics | undefined): boolean {
  if (!m) return false;
  return m.kind === 'activated' || m.kind === 'reaction';
}

/**
 * Obtém custo de PE da habilidade
 */
function getAbilityPECost(m: TrackAbilityMechanics | undefined): number | undefined {
  if (!m?.activation) return undefined;
  return m.activation.cost;
}

/**
 * Obtém tipo de ação da habilidade
 */
function getAbilityActionType(m: TrackAbilityMechanics | undefined): string | undefined {
  if (!m?.activation) return undefined;
  return m.activation.action as string;
}

// =============================================================================
// FUNÇÕES EXPORTADAS
// =============================================================================

/**
 * Converte habilidades de trilha de um personagem para UnifiedEffect[]
 * 
 * @param trackId - ID da trilha ativa
 * @param nex - NEX do personagem
 * @param attributes - Atributos do personagem
 * @param activatedEffects - IDs de efeitos ativados manualmente
 * @returns Array de efeitos unificados
 */
export function getTrackEffects(
  trackId: string | null | undefined,
  nex: number,
  attributes: Record<AttributeType, number>,
  activatedEffects: string[] = []
): UnifiedEffect[] {
  const effects: UnifiedEffect[] = [];

  if (!trackId) return effects;

  const track = getTrackById(trackId);
  if (!track) return effects;

  const unlockedAbilities = getUnlockedAbilities(trackId, nex);
  // Aniquilador troca a redução I por II/III; esses patamares não são cumulativos.
  const favoriteCategoryReduction = track.id === 'aniquilador'
    ? Math.max(0, ...unlockedAbilities.map(ability => ability.effects.base.categoryReduction?.amount ?? 0))
    : 0;

  for (const ability of unlockedAbilities) {
    const mechanics = convertTrackAbilityToMechanics(ability, attributes, nex);
    if (favoriteCategoryReduction && mechanics.categoryReduction &&
        mechanics.categoryReduction.amount < favoriteCategoryReduction) {
      delete mechanics.categoryReduction;
    }

    // Verifica se a habilidade tem mecânicas relevantes
    const hasMechanics = Object.keys(mechanics).length > 0;
    // Técnica Sublime contém apenas subefeitos. Eles também precisam ser emitidos.
    if (!hasMechanics && !ability.effects?.base?.techniqueEffects?.length) continue;

    // Verifica se é uma habilidade que requer ativação
    const needsActivation = requiresActivation(ability.effects?.base);
    const costPE = getAbilityPECost(ability.effects?.base);
    const actionType = getAbilityActionType(ability.effects?.base);

    const effect: UnifiedEffect = {
      id: `track-${ability.id}`,
      name: ability.name,
      description: ability.description,
      source: 'track',
      sourceId: ability.id,
      sourceName: `Trilha ${track.name}: ${ability.name}`,
      mechanics,
      isActive: needsActivation
        // Reconhece o ID antigo de Surto sem reescrever efeitos já registrados.
        ? activatedEffects.includes(`track-${ability.id}`) ||
          (ability.id === 'surto-de-adrenalina' && activatedEffects.includes('track-surto-adrenalina'))
        : true,
      isToggleable: needsActivation,
      conditions: {
        // Técnica Letal é exclusiva de ataques corpo a corpo, inclusive nos helpers.
        attackType: ability.effects?.base?.criticalBonus?.conditions?.weaponType === 'melee' ? 'melee' : undefined,
        requiresActivation: needsActivation || undefined,
        costPE,
        costAction: actionType as 'free' | 'movement' | 'standard' | 'full' | 'reaction' | undefined,
      },
      priority: ability.minNex, // Maior NEX = maior prioridade
    };

    // Técnica Secreta e Remendão combinam ações pagas e categoria permanente (Base p.26/31).
    // Separar o benefício passivo evita perdê-lo ao desativar a ação ou contá-lo duas vezes.
    if (needsActivation && mechanics.categoryReduction) {
      const categoryReduction = mechanics.categoryReduction;
      delete mechanics.categoryReduction;
      effects.push({
        id: `track-${ability.id}-category-reduction`,
        name: `${ability.name}: redução de categoria`,
        description: `Redução de categoria: ${categoryReduction.amount}.`,
        source: 'track',
        sourceId: ability.id,
        sourceName: effect.sourceName,
        mechanics: { categoryReduction },
        isActive: true,
        isToggleable: false,
        priority: ability.minNex,
      });
    }

    if (hasMechanics) effects.push(effect);

    // === TÉCNICAS ATIVÁVEIS DO ANIQUILADOR ===
    // Processa techniqueEffects para criar efeitos individuais
    if (ability.effects?.base?.techniqueEffects) {
      for (const technique of ability.effects.base.techniqueEffects) {
        const techniqueId = `track-tecnica-${technique.id}`;
        const isActive = activatedEffects.includes(techniqueId);
        
        // Cria mecânicas para a técnica
        const techniqueMechanics: EffectMechanics = {};
        
        if (technique.effects) {
          if ('criticalMarginBonus' in technique.effects && typeof technique.effects.criticalMarginBonus === 'number') {
            techniqueMechanics.criticalMarginBonus = technique.effects.criticalMarginBonus;
          }
          if ('criticalMultiplierBonus' in technique.effects && typeof technique.effects.criticalMultiplierBonus === 'number') {
            techniqueMechanics.criticalMultiplierBonus = technique.effects.criticalMultiplierBonus;
          }
          if ('additionalTargets' in technique.effects && typeof technique.effects.additionalTargets === 'number') {
            if (!techniqueMechanics.specialEffects) techniqueMechanics.specialEffects = [];
            techniqueMechanics.specialEffects.push(`Atinge +${technique.effects.additionalTargets} alvo adicional`);
          }
          if ('ignoreResistance' in technique.effects && typeof technique.effects.ignoreResistance === 'number') {
            if (!techniqueMechanics.specialEffects) techniqueMechanics.specialEffects = [];
            techniqueMechanics.specialEffects.push(`Ignora ${technique.effects.ignoreResistance} de RD`);
          }
        }

        // Só adiciona se tiver mecânicas
        if (Object.keys(techniqueMechanics).length > 0) {
          effects.push({
            id: techniqueId,
            name: technique.name,
            description: technique.description,
            source: 'track',
            sourceId: technique.id,
            sourceName: `Técnica ${track.name}: ${technique.name}`,
            mechanics: techniqueMechanics,
            isActive,
            isToggleable: true,
            conditions: {
              requiresActivation: true,
              costPE: technique.peCost,
              costAction: 'free',
            },
            priority: ability.minNex,
          });
        }
      }
    }

    // Disparo Letal já foi emitido pela conversão normal acima (+2 uma única vez).
  }

  return effects;
}

/**
 * Obtém efeitos de trilha para uma situação específica de combate
 * Filtra baseado no contexto (melee vs ranged)
 */
export function getTrackCombatEffects(
  trackId: string | null | undefined,
  nex: number,
  attributes: Record<AttributeType, number>,
  attackType: 'melee' | 'ranged',
  activatedEffects: string[] = []
): UnifiedEffect[] {
  const allEffects = getTrackEffects(trackId, nex, attributes, activatedEffects);

  // Filtra efeitos que não se aplicam ao contexto
  return allEffects.filter(effect => {
    // Se não tem condição de contexto, sempre se aplica
    if (!effect.conditions) return true;

    // Verifica se o tipo de ataque corresponde
    if (effect.conditions.attackType) {
      if (effect.conditions.attackType !== 'any' && effect.conditions.attackType !== attackType) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Obtém informações de um efeito ativável específico
 */
export function getActivatableEffectInfo(effectId: string): {
  name: string;
  minNex: number;
  peCost: number;
  trackId: string;
  stackable?: boolean;
} | null {
  for (const trackData of Object.values(TRACK_EFFECT_MAPPINGS)) {
    const effects = trackData.effects as Record<string, { name: string; minNex: number; peCost: number; stackable?: boolean }>;
    const effectInfo = effects[effectId];
    if (effectInfo) {
      return {
        name: effectInfo.name,
        minNex: effectInfo.minNex,
        peCost: effectInfo.peCost,
        stackable: effectInfo.stackable,
        trackId: trackData.trackId,
      };
    }
  }
  return null;
}

/**
 * Verifica se um efeito está disponível para um NEX específico
 */
export function isEffectAvailableAtNex(effectId: string, nex: number): boolean {
  const info = getActivatableEffectInfo(effectId);
  return info ? nex >= info.minNex : false;
}

/**
 * Lista todos os efeitos ativáveis de uma trilha
 */
export function getTrackActivatableEffects(trackId: string): Array<{
  id: string;
  name: string;
  minNex: number;
  peCost: number;
}> {
  // Normaliza o trackId para encontrar no mapping
  const normalizedId = (getTrackById(trackId)?.id ?? trackId).toLowerCase().replace(/-/g, '');

  for (const [key, trackData] of Object.entries(TRACK_EFFECT_MAPPINGS)) {
    const mappingId = trackData.trackId.toLowerCase().replace(/-/g, '');
    if (mappingId === normalizedId || key.toLowerCase() === normalizedId) {
      return Object.entries(trackData.effects).map(([id, info]) => ({
        id,
        name: info.name,
        minNex: info.minNex,
        peCost: info.peCost,
      }));
    }
  }

  return [];
}

/**
 * Lista todas as habilidades de trilha disponíveis
 * Útil para debug e documentação
 */
export function listAllTrackAbilities(trackId: string): Array<{
  id: string;
  name: string;
  minNex: number;
  hasMechanics: boolean;
  description: string;
  kind: string;
  peCost?: number;
}> {
  const track = getTrackById(trackId);
  if (!track) return [];

  return track.abilities.map(ability => ({
    id: ability.id,
    name: ability.name,
    minNex: ability.minNex,
    hasMechanics: !!ability.effects?.base && Object.keys(ability.effects.base).length > 0,
    description: ability.description,
    kind: ability.effects?.base?.kind || 'unknown',
    peCost: ability.effects?.base?.activation?.cost,
  }));
}

/**
 * Obtém resumo de bônus de trilha para display
 */
export function getTrackBonusSummary(
  trackId: string | null | undefined,
  nex: number,
  attributes: Record<AttributeType, number>
): {
  trackName: string;
  totalAttack: number;
  totalDamage: number;
  totalMeleeDamage: number;
  totalRangedDamage: number;
  totalDefense: number;
  totalInitiative: number;
  totalCriticalMargin: number;
  totalHP: number;
  categoryReduction: number;
  specialAbilities: string[];
  activatableAbilities: Array<{ name: string; peCost: number; description: string }>;
} {
  const summary = {
    trackName: '',
    totalAttack: 0,
    totalDamage: 0,
    totalMeleeDamage: 0,
    totalRangedDamage: 0,
    totalDefense: 0,
    totalInitiative: 0,
    totalCriticalMargin: 0,
    totalHP: 0,
    categoryReduction: 0,
    specialAbilities: [] as string[],
    activatableAbilities: [] as Array<{ name: string; peCost: number; description: string }>,
  };

  if (!trackId) return summary;

  const track = getTrackById(trackId);
  if (!track) return summary;

  summary.trackName = track.name;

  const effects = getTrackEffects(trackId, nex, attributes);

  for (const effect of effects) {
    const m = effect.mechanics;

    // Se requer ativação, adiciona à lista de ativáveis
    if (effect.isToggleable && effect.conditions?.costPE) {
      summary.activatableAbilities.push({
        name: effect.name,
        peCost: effect.conditions.costPE,
        description: effect.description || '',
      });
    }

    // Só soma mecânicas de efeitos ativos
    if (!effect.isActive) continue;

    summary.totalAttack += (m.attackBonus || 0) + (m.meleeAttackBonus || 0) + (m.rangedAttackBonus || 0);
    summary.totalDamage += m.damageBonus || 0;
    summary.totalMeleeDamage += m.meleeDamageBonus || 0;
    summary.totalRangedDamage += m.rangedDamageBonus || 0;
    summary.totalDefense += m.defenseBonus || 0;
    summary.totalInitiative += m.initiativeBonus || 0;
    summary.totalCriticalMargin += m.criticalMarginBonus || 0;
    summary.totalHP += m.hpBonus || 0;

    // Redução de categoria agora usa dados estruturados do EffectMechanics
    if (m.categoryReduction) {
      summary.categoryReduction += m.categoryReduction.amount;
    }

    // Continua coletando efeitos especiais para exibição
    if (m.specialEffects) {
      summary.specialAbilities.push(...m.specialEffects);
    }
  }

  return summary;
}

/**
 * Obtém bônus de combate aplicáveis de uma trilha
 * Usado pelo CombatRollModal para aplicar automaticamente
 */
export function getTrackCombatBonuses(
  trackId: string | null | undefined,
  nex: number,
  attributes: Record<AttributeType, number>,
  attackType: 'melee' | 'ranged',
  activatedEffects: string[] = [],
  damageContext?: { representedEffectIds: string[]; isLongFirearm: boolean; handledEffectIds?: string[] },
): {
  attackBonus: number;
  damageBonus: number;
  criticalMarginBonus: number;
  criticalMultiplierBonus: number;
  extraDamageDice: string[];
  specialEffects: string[];
  maximumDamageOnCrit: boolean;
} {
  const result = {
    attackBonus: 0,
    damageBonus: 0,
    criticalMarginBonus: 0,
    criticalMultiplierBonus: 0,
    extraDamageDice: [] as string[],
    specialEffects: [] as string[],
    maximumDamageOnCrit: false,
  };

  const effects = getTrackCombatEffects(trackId, nex, attributes, attackType, activatedEffects);

  for (const effect of effects) {
    if (!effect.isActive) continue;

    const m = effect.mechanics;

    // Ataque
    result.attackBonus += m.attackBonus || 0;
    if (attackType === 'melee') {
      result.attackBonus += m.meleeAttackBonus || 0;
    } else {
      result.attackBonus += m.rangedAttackBonus || 0;
    }

    // O resumo já contém esses efeitos: a trilha não pode somá-los novamente.
    // Mira de Elite exige a arma elegível no contexto dos modais de combate.
    const representedDamage = damageContext?.representedEffectIds.includes(effect.id);
    const ineligibleMira = effect.id === 'track-mira-elite' && damageContext && !damageContext.isLongFirearm;
    if (!representedDamage && !ineligibleMira) {
      result.damageBonus += m.damageBonus || 0;
      if (attackType === 'melee') {
        result.damageBonus += m.meleeDamageBonus || 0;
      } else {
        result.damageBonus += m.rangedDamageBonus || 0;
      }
    }

    // O modal trata alguns efeitos condicionais com a arma escolhida.
    const handledByModal = damageContext?.handledEffectIds?.includes(effect.id) ?? false;
    if (!handledByModal) {
      result.criticalMarginBonus += m.criticalMarginBonus || 0;
      result.criticalMultiplierBonus += m.criticalMultiplierBonus || 0;
    }

    // Dados extras
    if (m.extraDamageDice && !handledByModal) {
      result.extraDamageDice.push(m.extraDamageDice);
    }

    // Efeitos especiais
    if (m.specialEffects) {
      result.specialEffects.push(...m.specialEffects);
    }

    // Dano máximo em crítico
    if (m.maximumDamageOnCrit) {
      result.maximumDamageOnCrit = true;
    }
  }

  return result;
}

// =============================================================================
// VERSATILIDADE - TRILHA SECUNDÁRIA
// =============================================================================

/**
 * Obtém efeitos da habilidade de Versatilidade (trilha secundária)
 * 
 * No NEX 50%, o jogador pode escolher o primeiro poder de outra trilha.
 * Esta função retorna apenas os efeitos da habilidade NEX 10% da trilha escolhida.
 * 
 * @param trackId - ID da trilha secundária escolhida via Versatilidade
 * @param abilityId - ID da habilidade específica (sempre a de NEX 10%)
 * @param attributes - Atributos do personagem
 * @param activatedEffects - IDs de efeitos ativados manualmente
 * @returns Array de efeitos unificados da habilidade de Versatilidade
 */
export function getVersatilityTrackEffects(
  trackId: string,
  abilityId: string,
  attributes: Record<AttributeType, number>,
  activatedEffects: string[] = [],
  characterNex: number = 50  // NEX real do personagem para escalonamento correto
): UnifiedEffect[] {
  const effects: UnifiedEffect[] = [];

  if (!trackId || !abilityId) return effects;

  const track = getTrackById(trackId);
  if (!track) return effects;

  // Encontra a habilidade específica (deve ser a de NEX 10%)
  const ability = track.abilities.find(a => a.id === abilityId);
  if (!ability) return effects;

  // Usa o NEX real do personagem para escalonamento correto (ex: Ataque Furtivo 4d6 no NEX 99%)
  const mechanics = convertTrackAbilityToMechanics(ability, attributes, characterNex);

  // Verifica se a habilidade tem mecânicas relevantes
  const hasMechanics = Object.keys(mechanics).length > 0;
  if (!hasMechanics) return effects;

  // Verifica se é uma habilidade que requer ativação
  const needsActivation = requiresActivation(ability.effects?.base);
  const costPE = getAbilityPECost(ability.effects?.base);
  const actionType = getAbilityActionType(ability.effects?.base);

  const effect: UnifiedEffect = {
    id: `versatility-${ability.id}`,
    name: ability.name,
    description: ability.description,
    source: 'track', // Usa source track para consolidação
    sourceId: ability.id,
    sourceName: `Versatilidade (${track.name}): ${ability.name}`,
    mechanics,
    isActive: needsActivation
      ? activatedEffects.includes(`versatility-${ability.id}`)
      : true,
    isToggleable: needsActivation,
    conditions: needsActivation ? {
      requiresActivation: true,
      costPE,
      costAction: actionType as 'free' | 'movement' | 'standard' | 'full' | 'reaction' | undefined,
    } : undefined,
    priority: 50, // NEX 50% = prioridade 50
  };

  effects.push(effect);

  return effects;
}
