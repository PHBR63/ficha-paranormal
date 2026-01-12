/**
 * Ordem Paranormal RPG - Rituais de 3º Círculo (Unificados)
 * Migrados para o novo sistema unificado
 */

import type { UnifiedRitual } from './types';

// ========================================
// 3º CÍRCULO - SANGUE
// ========================================

export const BLOOD_THIRD_CIRCLE: UnifiedRitual[] = [
  {
    id: 'ferver-sangue',
    name: 'Ferver Sangue',
    circle: 3,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser',
    duration: 'Sustentada',
    description: 'Causa 4d8 dano Sangue e fraco se falhar na Fortitude no turno. Passar 2x encerra.',
    cost: 4,
    resistance: { type: 'fortitude', effect: 'parcial' },
    isSustainable: true,
    effects: {
      base: {
        kind: 'damage',
        damagePerTurn: { diceCount: 4, diceType: 8, damageType: 'sangue' },
        conditions: [{ id: 'fraco', duration: 1 }],
        resistance: { type: 'fortitude', effect: 'parcial' },
        sustain: { concentration: true },
        summary: '4d8 dano Sangue/turno + fraco se falhar. Passar 2x encerra.',
      },
      verdadeiro: {
        kind: 'damage',
        summary: 'Afeta seres escolhidos.',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 4, description: 'Seres escolhidos.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'forma-monstruosa',
    name: 'Forma Monstruosa',
    circle: 3,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Vira monstro (Grande). +5 ataque/dano, 30 PV temp. Fúria (não fala/conjura, deve atacar).',
    cost: 4,
    effects: {
      base: {
        kind: 'transformation',
        attackBonus: 5,
        damageBonus: 5,
        tempHP: { diceCount: 0, diceType: 6, bonus: 30 },
        actionRestrictions: ['mustAttack', 'cannotSpeak', 'cannotCast'],
        summary: 'Forma Grande. +5 ataque/dano, 30 PV temp. Fúria.',
      },
      discente: {
        kind: 'transformation',
        summary: 'Imune a atordoamento, fadiga, sangramento, sono, veneno.',
      },
      verdadeiro: {
        kind: 'transformation',
        attackBonus: 10,
        damageBonus: 10,
        tempHP: { diceCount: 0, diceType: 6, bonus: 50 },
        summary: '+10 ataque/dano, 50 PV temp.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Imune a atordoamento, fadiga, sangramento, sono, veneno.', circleReq: 4 },
      { name: 'Verdadeiro', cost: 9, description: '+10 bônus, 50 PV temp.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'odor-da-cacada',
    name: 'Odor da Caçada',
    circle: 3,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Recebe faro. +5 Atletismo em perseguição e não perde PV por esforço. Fica com Fome/Sede depois.',
    cost: 4,
    effects: {
      base: {
        kind: 'buff',
        senseEffect: { type: 'detect', targets: 'cheiros', information: 'faro' },
        skillBonus: { skills: ['Atletismo'], bonus: 5, context: 'em perseguição' },
        summary: 'Faro. +5 Atletismo em perseguição. Fome/Sede ao fim.',
      },
      discente: {
        kind: 'buff',
        summary: 'Pode afetar 1 ser com toque.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: 'Afeta até 5 seres em alcance curto.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 4, description: 'Toque, 1 ser.', circleReq: 4 },
      { name: 'Verdadeiro', cost: 9, description: 'Curto, até 5 seres.', affinityReq: true },
    ],
  },
  {
    id: 'purgatorio',
    name: 'Purgatório',
    circle: 3,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Curto',
    area: 'Área de 6m de raio',
    duration: 'Sustentada',
    description: 'Inimigos vulneráveis a dano físico. Sair causa 6d6 Sangue e pode impedir movimento.',
    cost: 4,
    resistance: { type: 'fortitude', effect: 'parcial' },
    isSustainable: true,
    effects: {
      base: {
        kind: 'debuff',
        conditions: [{ id: 'vulneravel', duration: 'sustentado' }],
        damage: { diceCount: 6, diceType: 6, damageType: 'sangue' },
        areaEffect: { shape: 'esfera', radius: 6 },
        sustain: { concentration: true },
        resistance: { type: 'fortitude', effect: 'parcial' },
        summary: 'Inimigos na área vulneráveis. 6d6 ao sair.',
      },
    },
    enhancements: [],
  },
  {
    id: 'vomitar-pestes',
    name: 'Vomitar Pestes',
    circle: 3,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Médio',
    area: 'Enxame Grande',
    duration: 'Sustentada',
    description: 'Enxame causa 5d12 Sangue. Movimento 12m.',
    cost: 4,
    resistance: { type: 'reflexos', effect: 'reduz_metade' },
    isSustainable: true,
    effects: {
      base: {
        kind: 'summon',
        damage: { diceCount: 5, diceType: 12, damageType: 'sangue' },
        resistance: { type: 'reflexos', effect: 'reduz_metade' },
        sustain: { action: 'move' },
        summary: 'Invoca enxame Grande. 5d12 Sangue. Movimento 12m.',
      },
      discente: {
        kind: 'summon',
        conditions: [{ id: 'agarrado', duration: 1 }],
        summary: 'Agarra quem falhar no Reflexos.',
      },
      verdadeiro: {
        kind: 'summon',
        summary: 'Enxame Enorme (6m), voo 18m.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Agarra quem falhar no Reflexos.', circleReq: 4 },
      { name: 'Verdadeiro', cost: 5, description: 'Enxame Enorme (6m), voo 18m.', affinityReq: true },
    ],
  },
];

// ========================================
// 3º CÍRCULO - MORTE
// ========================================

export const DEATH_THIRD_CIRCLE: UnifiedRitual[] = [
  {
    id: 'ancora-temporal',
    name: 'Âncora Temporal',
    circle: 3,
    element: 'morte',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser',
    duration: 'Cena',
    description: 'Impede deslocamento se falhar na Vontade no início do turno. Passar 2x encerra.',
    cost: 4,
    resistance: { type: 'vontade', effect: 'parcial' },
    effects: {
      base: {
        kind: 'debuff',
        actionRestrictions: ['cannotMove'],
        resistance: { type: 'vontade', effect: 'parcial' },
        summary: 'Impede movimento se falhar em Vontade. Passar 2x encerra.',
      },
      verdadeiro: {
        kind: 'debuff',
        summary: 'Afeta seres à escolha.',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 4, description: 'Seres à escolha.', circleReq: 4 },
    ],
  },
  {
    id: 'fedor-putrido',
    name: 'Fedor Pútrido',
    circle: 3,
    element: 'morte',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Sustentada',
    description: 'Animais se afastam, -20 Diplomacia. +5 Furtividade, +10 Enganação (fingir morto). Sofre 1d4 dano Morte/rodada.',
    cost: 4,
    isSustainable: true,
    effects: {
      base: {
        kind: 'buff',
        skillBonus: { skills: ['Furtividade'], bonus: 5 },
        damagePerTurn: { diceCount: 1, diceType: 4, damageType: 'morte' },
        sustain: { action: 'free' },
        summary: '+5 Furtividade, +10 Enganação (fingir morto). -20 Diplomacia. 1d4 dano/rodada.',
      },
      discente: {
        kind: 'buff',
        summary: 'Pode afetar 1 ser com toque.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: 'Afeta até 5 seres em alcance curto.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 4, description: 'Toque, 1 ser.', circleReq: 4 },
      { name: 'Verdadeiro', cost: 9, description: 'Curto, até 5 seres.', affinityReq: true },
    ],
  },
  {
    id: 'poeira-da-podridao',
    name: 'Poeira da Podridão',
    circle: 3,
    element: 'morte',
    execution: 'Padrão',
    range: 'Médio',
    area: 'Nuvem com 6m de raio',
    duration: 'Sustentada',
    description: 'Causa 4d8 dano Morte no início do turno e impede cura. Metade se passar.',
    cost: 4,
    resistance: { type: 'fortitude', effect: 'reduz_metade' },
    isSustainable: true,
    effects: {
      base: {
        kind: 'damage',
        damagePerTurn: { diceCount: 4, diceType: 8, damageType: 'morte' },
        areaEffect: { shape: 'esfera', radius: 6 },
        resistance: { type: 'fortitude', effect: 'reduz_metade' },
        sustain: { concentration: true },
        summary: '4d8 Morte/turno. Impede cura na área.',
      },
      verdadeiro: {
        kind: 'damage',
        damagePerTurn: { diceCount: 4, diceType: 8, bonus: 16, damageType: 'morte' },
        summary: 'Dano 4d8+16.',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 4, description: 'Dano 4d8+16.', circleReq: 4 },
    ],
  },
  {
    id: 'tentaculos-de-lodo',
    name: 'Tentáculos de Lodo',
    circle: 3,
    element: 'morte',
    execution: 'Padrão',
    range: 'Médio',
    area: 'Círculo com 6m de raio',
    duration: 'Cena',
    description: 'Tentáculos agarram (Ocultismo vs Luta). Dano 4d6 se agarrar/esmagar. Terreno difícil.',
    cost: 4,
    effects: {
      base: {
        kind: 'control',
        damage: { diceCount: 4, diceType: 6, damageType: 'morte' },
        conditions: [{ id: 'agarrado', duration: 'cena' }],
        areaEffect: { shape: 'esfera', radius: 6 },
        summary: 'Tentáculos agarram e causam 4d6. Terreno difícil.',
      },
      verdadeiro: {
        kind: 'control',
        damage: { diceCount: 6, diceType: 6, damageType: 'morte' },
        areaEffect: { shape: 'esfera', radius: 9 },
        summary: 'Raio 9m, dano 6d6.',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 5, description: 'Raio 9m, dano 6d6.', circleReq: 4 },
    ],
  },
  {
    id: 'zerar-entropia',
    name: 'Zerar Entropia',
    circle: 3,
    element: 'morte',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 pessoa',
    duration: 'Cena',
    description: 'Deixa paralisado (ou lento se passar). Teste por turno para encerrar.',
    cost: 4,
    resistance: { type: 'vontade', effect: 'parcial' },
    effects: {
      base: {
        kind: 'debuff',
        conditions: [{ id: 'paralisado', duration: 'cena', saveEnds: true }],
        resistance: { type: 'vontade', effect: 'parcial' },
        summary: 'Alvo paralisado (lento se passar). Teste por turno.',
      },
      discente: {
        kind: 'debuff',
        summary: 'Alvo "1 ser" (não apenas pessoa).',
      },
      verdadeiro: {
        kind: 'debuff',
        summary: 'Afeta seres escolhidos.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 4, description: 'Alvo "1 ser".', circleReq: 4 },
      { name: 'Verdadeiro', cost: 11, description: 'Seres escolhidos.', circleReq: 4, affinityReq: true },
    ],
  },
];

// ========================================
// 3º CÍRCULO - CONHECIMENTO
// ========================================

export const KNOWLEDGE_THIRD_CIRCLE: UnifiedRitual[] = [
  {
    id: 'alterar-memoria',
    name: 'Alterar Memória',
    circle: 3,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 pessoa',
    duration: 'Instantânea',
    description: 'Altera/apaga memórias de até 1h atrás. Recupera em 1d4 dias.',
    cost: 4,
    resistance: { type: 'vontade', effect: 'anula' },
    effects: {
      base: {
        kind: 'control',
        mentalControl: { type: 'suggestion', canForceHarm: false, canForceSuicide: false },
        resistance: { type: 'vontade', effect: 'anula' },
        summary: 'Altera/apaga memórias de até 1h atrás. Recupera em 1d4 dias.',
      },
      verdadeiro: {
        kind: 'control',
        summary: 'Pode alterar memórias de até 24h atrás.',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 4, description: 'Até 24h atrás.', circleReq: 4 },
    ],
  },
  {
    id: 'contato-paranormal',
    name: 'Contato Paranormal',
    circle: 3,
    element: 'conhecimento',
    execution: 'Completa',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Especial',
    description: 'Recebe seis d6 para somar em perícias. Se rolar 6, perde 2 Sanidade.',
    cost: 4,
    effects: {
      base: {
        kind: 'buff',
        summary: '6d6 para somar em perícias (1/teste). Rolar 6 = -2 Sanidade.',
      },
      discente: {
        kind: 'buff',
        summary: 'd8 em vez de d6 (rolar 8 = -3 Sanidade).',
      },
      verdadeiro: {
        kind: 'buff',
        summary: 'd12 (rolar 12 = -5 Sanidade).',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 4, description: 'd8 (perde 3 sanidade no 8).', circleReq: 4 },
      { name: 'Verdadeiro', cost: 9, description: 'd12 (perde 5 sanidade no 12).', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'mergulho-mental',
    name: 'Mergulho Mental',
    circle: 3,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 pessoa',
    duration: 'Sustentada',
    description: 'Lê pensamentos. Alvo responde pergunta sim/não se falhar na Vontade.',
    cost: 4,
    resistance: { type: 'vontade', effect: 'parcial' },
    isSustainable: true,
    effects: {
      base: {
        kind: 'sense',
        senseEffect: { type: 'scry', targets: 'pensamentos', information: 'sim/não' },
        resistance: { type: 'vontade', effect: 'parcial' },
        sustain: { concentration: true },
        summary: 'Lê pensamentos. Pergunta sim/não se falhar em Vontade.',
      },
      verdadeiro: {
        kind: 'sense',
        summary: 'Execução 1 dia, alcance ilimitado (precisa de cuba de água).',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 4, description: 'Execução 1 dia, alcance ilimitado.', circleReq: 4 },
    ],
  },
  {
    id: 'relembrar-fragmento',
    name: 'Relembrar Fragmento',
    circle: 3,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 objeto',
    duration: 'Instantânea',
    description: 'Restaura objeto escrito danificado/ilegível se tiver um fragmento.',
    cost: 4,
    effects: {
      base: {
        kind: 'utility',
        summary: 'Restaura objeto escrito danificado usando um fragmento.',
      },
      discente: {
        kind: 'utility',
        summary: 'Restauração dura até o fim da missão.',
      },
      verdadeiro: {
        kind: 'utility',
        summary: 'Pode alterar objeto imperceptivelmente (falsificação perfeita).',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 4, description: 'Restaurado até o fim da missão.', circleReq: 4 },
      { name: 'Verdadeiro', cost: 9, description: 'Altera o objeto imperceptivelmente.', affinityReq: true },
    ],
  },
  {
    id: 'videncia',
    name: 'Vidência',
    circle: 3,
    element: 'conhecimento',
    execution: 'Completa',
    range: 'Especial',
    target: '1 ser',
    duration: 'Especial',
    description: 'Vê/ouve alvo através de superfície reflexiva. Teste por turno para impedir. Precisa de info do alvo.',
    cost: 4,
    resistance: { type: 'vontade', effect: 'anula' },
    effects: {
      base: {
        kind: 'sense',
        senseEffect: { type: 'scry', information: 'visão e audição' },
        resistance: { type: 'vontade', effect: 'anula' },
        summary: 'Vê/ouve alvo por 5 rodadas através de espelho.',
      },
    },
    enhancements: [],
  },
];

// ========================================
// 3º CÍRCULO - ENERGIA
// ========================================

export const ENERGY_THIRD_CIRCLE: UnifiedRitual[] = [
  {
    id: 'convocacao-instantanea',
    name: 'Convocação Instantânea',
    circle: 3,
    element: 'energia',
    execution: 'Padrão',
    range: 'Especial',
    target: '1 objeto de até 2 espaços',
    duration: 'Instantânea',
    description: 'Invoca objeto preparado para a mão. Pode devolver em 1h.',
    cost: 4,
    resistance: { type: 'vontade', effect: 'anula' },
    effects: {
      base: {
        kind: 'utility',
        summary: 'Invoca objeto preparado (até 2 espaços) para sua mão.',
      },
      discente: {
        kind: 'utility',
        summary: 'Objeto de até 10 espaços.',
      },
      verdadeiro: {
        kind: 'utility',
        summary: 'Cria esconderijo permanente no Outro Lado (10 espaços). -1 PE máximo.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 4, description: 'Objeto até 10 espaços.', circleReq: 4 },
      { name: 'Verdadeiro', cost: 9, description: 'Esconderijo permanente no Outro Lado. Perde 1 PE permanente.', affinityReq: true },
    ],
  },
  {
    id: 'milagre-ionizante',
    name: 'Milagre Ionizante',
    circle: 3,
    element: 'energia',
    execution: 'Completa',
    range: 'Toque',
    target: '1 ser',
    duration: 'Instantânea',
    description: 'Cura doença ou veneno. Alvo deve passar Fortitude (DT 30) ou pega vírus infectcídio.',
    cost: 4,
    effects: {
      base: {
        kind: 'healing',
        healing: { diceCount: 0, diceType: 6, removesConditions: ['envenenado', 'doente'] },
        resistance: { type: 'fortitude', effect: 'anula', dt: 30 },
        summary: 'Cura doença/veneno. Fortitude DT 30 ou pega vírus.',
      },
    },
    enhancements: [],
  },
  {
    id: 'mutar',
    name: 'Mutar',
    circle: 3,
    element: 'energia',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Inibe som emitido e recebido (surdo, silencioso). +10 Furtividade. Não pode falar.',
    cost: 4,
    effects: {
      base: {
        kind: 'buff',
        conditions: [{ id: 'surdo', duration: 'cena' }],
        skillBonus: { skills: ['Furtividade'], bonus: 10 },
        actionRestrictions: ['cannotSpeak'],
        summary: 'Silencioso e surdo. +10 Furtividade. Não pode falar.',
      },
      discente: {
        kind: 'buff',
        summary: 'Pode afetar 1 ser com toque.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: 'Afeta até 5 seres em alcance curto.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 4, description: 'Toque, 1 ser.', circleReq: 4 },
      { name: 'Verdadeiro', cost: 9, description: 'Curto, até 5 seres.', affinityReq: true },
    ],
  },
  {
    id: 'salto-fantasma',
    name: 'Salto Fantasma',
    circle: 3,
    element: 'energia',
    execution: 'Padrão',
    range: 'Médio',
    target: 'Você',
    duration: 'Instantânea',
    description: 'Teletransporte para ponto visto/imaginado. Não age no resto do turno.',
    cost: 4,
    effects: {
      base: {
        kind: 'utility',
        summary: 'Teletransporta para ponto em alcance médio. Não age depois.',
      },
      discente: {
        kind: 'interceptor',
        hooks: [{ trigger: 'onPreDamage', effect: 'Salta 1,5m como reação, +10 Defesa/Reflexos' }],
        summary: 'Reação: salta 1,5m, +10 Defesa/Reflexos.',
      },
      verdadeiro: {
        kind: 'utility',
        summary: 'Alcance longo. Pode levar 2 voluntários.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Reação. Salta 1,5m, +10 Defesa/Reflexos.', circleReq: 4 },
      { name: 'Verdadeiro', cost: 4, description: 'Alcance longo, leva 2 voluntários.', affinityReq: true },
    ],
  },
  {
    id: 'transfigurar-agua',
    name: 'Transfigurar Água',
    circle: 3,
    element: 'energia',
    execution: 'Padrão',
    range: 'Longo',
    area: 'Esfera com 30m de raio',
    duration: 'Cena',
    description: 'Efeitos: Congelar, Derreter, Enchente, Evaporar (5d8 dano), Partir.',
    cost: 4,
    hasModes: true,
    effects: {
      base: {
        kind: 'utility',
        modes: [
          { name: 'Congelar', description: 'Congela água na área' },
          { name: 'Derreter', description: 'Derrete gelo na área' },
          { name: 'Enchente', description: 'Eleva nível ou +6m deslocamento de barco' },
          { name: 'Evaporar', description: '5d8 dano de Energia' },
          { name: 'Partir', description: 'Abre caminho ou cria redemoinho' },
        ],
        areaEffect: { shape: 'esfera', radius: 30 },
        summary: 'Controla água com vários efeitos.',
      },
      verdadeiro: {
        kind: 'utility',
        damage: { diceCount: 10, diceType: 8, damageType: 'energia' },
        summary: 'Enchente +12m, Evaporar 10d8.',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 5, description: 'Enchente +12m, Evaporar 10d8.', circleReq: 4 },
    ],
  },
  {
    id: 'transfigurar-terra',
    name: 'Transfigurar Terra',
    circle: 3,
    element: 'energia',
    execution: 'Padrão',
    range: 'Longo',
    area: '9 cubos com 1,5m de lado',
    duration: 'Instantânea',
    description: 'Efeitos: Amolecer (desabamento ou terreno difícil), Modelar (cria objetos/paredes), Solidificar (prende pés).',
    cost: 4,
    hasModes: true,
    effects: {
      base: {
        kind: 'utility',
        modes: [
          { name: 'Amolecer', description: 'Desabamento 10d6 ou terreno difícil' },
          { name: 'Modelar', description: 'Cria objetos ou paredes' },
          { name: 'Solidificar', description: 'Prende pés de alvos' },
        ],
        summary: 'Controla terra/pedra com vários efeitos.',
      },
      discente: {
        kind: 'utility',
        summary: '15 cubos.',
      },
      verdadeiro: {
        kind: 'utility',
        summary: 'Afeta minerais e metais.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: '15 cubos.', circleReq: 4 },
      { name: 'Verdadeiro', cost: 7, description: 'Afeta minerais e metais.', circleReq: 4 },
    ],
  },
];

// ========================================
// 3º CÍRCULO - MEDO
// ========================================

export const FEAR_THIRD_CIRCLE: UnifiedRitual[] = [
  {
    id: 'dissipar-ritual',
    name: 'Dissipar Ritual',
    circle: 3,
    element: 'medo',
    execution: 'Padrão',
    range: 'Médio',
    target: '1 ser/objeto ou esfera 3m raio',
    duration: 'Instantânea',
    description: 'Encerra rituais ativos (teste Ocultismo vs DT). Anula item amaldiçoado por 1 dia.',
    cost: 4,
    effects: {
      base: {
        kind: 'utility',
        summary: 'Encerra rituais ativos (Ocultismo vs DT). Anula item amaldiçoado por 1 dia.',
      },
    },
    enhancements: [],
  },
  {
    id: 'ancora-de-medo',
    name: 'Âncora de Medo',
    circle: 3,
    element: 'medo',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser',
    duration: 'Sustentada',
    description: 'Você ancora o medo no alvo. Ele sofre 3d8 de dano de Medo no início de cada turno e fica amedrontado enquanto sustentado.',
    cost: 4,
    resistance: { type: 'vontade', effect: 'parcial' },
    isSustainable: true,
    effects: {
      base: {
        kind: 'damage',
        damagePerTurn: { diceCount: 3, diceType: 8, damageType: 'medo' },
        conditions: [{ id: 'amedrontado', duration: 'sustentado' }],
        resistance: { type: 'vontade', effect: 'parcial' },
        sustain: { concentration: true },
        summary: '3d8 dano Medo/turno + amedrontado enquanto sustentado.',
      },
      verdadeiro: {
        kind: 'damage',
        damagePerTurn: { diceCount: 5, diceType: 8, damageType: 'medo' },
        summary: '5d8 dano/turno. Afeta até 3 seres.',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 5, description: '5d8 dano, até 3 seres.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'escudo-do-medo',
    name: 'Escudo do Medo',
    circle: 3,
    element: 'medo',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Você cria um escudo de puro Medo ao seu redor. Recebe RD 10 contra dano paranormal e quem o ataca corpo a corpo sofre 2d6 de dano de Medo.',
    cost: 4,
    effects: {
      base: {
        kind: 'buff',
        damageReduction: { types: ['energia', 'sangue', 'morte', 'conhecimento', 'medo'], amount: 10 },
        summary: 'RD 10 contra dano paranormal. Atacantes corpo a corpo sofrem 2d6 Medo.',
      },
      discente: {
        kind: 'buff',
        summary: 'RD 15. Atacantes sofrem 4d6 Medo.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: 'RD 20. Atacantes sofrem 6d6 Medo e ficam amedrontados.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 4, description: 'RD 15, 4d6 dano.', circleReq: 4 },
      { name: 'Verdadeiro', cost: 8, description: 'RD 20, 6d6 dano, amedrontado.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'pesadelo-vivo',
    name: 'Pesadelo Vivo',
    circle: 3,
    element: 'medo',
    execution: 'Padrão',
    range: 'Médio',
    target: '1 ser',
    duration: 'Cena',
    description: 'Você manifesta o maior medo do alvo como uma criatura ilusória. Se falhar na Vontade, o alvo fica paralisado de terror enquanto a ilusão existir.',
    cost: 4,
    resistance: { type: 'vontade', effect: 'parcial' },
    effects: {
      base: {
        kind: 'control',
        conditions: [{ id: 'paralisado', duration: 'cena', saveEnds: true }],
        resistance: { type: 'vontade', effect: 'parcial' },
        summary: 'Manifesta medo do alvo. Paralisado se falhar (lento se passar).',
      },
      verdadeiro: {
        kind: 'control',
        summary: 'Afeta até 3 seres. Ilusão causa 4d8 de dano de Medo/turno.',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 5, description: 'Até 3 seres, 4d8 dano/turno.', circleReq: 4, affinityReq: true },
    ],
  },
];
