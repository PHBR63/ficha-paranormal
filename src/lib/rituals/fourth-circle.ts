/**
 * Ordem Paranormal RPG - Rituais de 4º Círculo (Unificados)
 * Migrados para o novo sistema unificado
 */

import type { UnifiedRitual } from './types';

// ========================================
// 4º CÍRCULO - SANGUE
// ========================================

export const BLOOD_FOURTH_CIRCLE: UnifiedRitual[] = [
  {
    id: 'capturar-o-coracao',
    name: 'Capturar o Coração',
    circle: 4,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 pessoa',
    duration: 'Cena',
    description: 'Paixão obsessiva. Alvo ajuda você se falhar na Vontade no turno. Passar 2x encerra.',
    cost: 6,
    resistance: { type: 'vontade', effect: 'parcial' },
    effects: {
      base: {
        kind: 'control',
        mentalControl: { type: 'charm', canForceHarm: false, canForceSuicide: false },
        resistance: { type: 'vontade', effect: 'parcial' },
        summary: 'Alvo tem paixão obsessiva. Ajuda você se falhar em Vontade.',
      },
    },
    enhancements: [],
  },
  {
    id: 'involucro-de-carne',
    name: 'Invólucro de Carne',
    circle: 4,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Curto',
    area: '1 clone seu',
    duration: 'Cena',
    description: 'Cria cópia física (sem mente). Pode dar ordem (movimento) ou controlar (transe).',
    cost: 6,
    effects: {
      base: {
        kind: 'summon',
        sustain: { action: 'move' },
        summary: 'Cria clone físico. Ordem (movimento) ou controle total (transe).',
      },
    },
    enhancements: [],
  },
  {
    id: 'martirio-de-sangue',
    name: 'Martírio de Sangue',
    circle: 4,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Especial',
    description: 'Transformação final. +5 ataque/dano/defesa, 30 PV temp, faro, visão no escuro, ataque letal. Perde personagem no fim da cena (vira criatura).',
    cost: 6,
    effects: {
      base: {
        kind: 'narrativeOverride',
        attackBonus: 5,
        damageBonus: 5,
        defenseBonus: 5,
        tempHP: { diceCount: 0, diceType: 6, bonus: 30 },
        summary: 'IRREVERSÍVEL. +5 tudo, 30 PV temp. MORRE ao fim da cena.',
      },
      discente: {
        kind: 'narrativeOverride',
        attackBonus: 10,
        damageBonus: 10,
        defenseBonus: 10,
        tempHP: { diceCount: 0, diceType: 6, bonus: 40 },
        summary: '+10 tudo, 40 PV temp.',
      },
      verdadeiro: {
        kind: 'narrativeOverride',
        attackBonus: 20,
        damageBonus: 20,
        defenseBonus: 20,
        tempHP: { diceCount: 0, diceType: 6, bonus: 50 },
        summary: '+20 tudo, 50 PV temp.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 5, description: 'Bônus +10, 40 PV temp.', affinityReq: true },
      { name: 'Verdadeiro', cost: 10, description: 'Bônus +20, 50 PV temp.', affinityReq: true },
    ],
  },
  {
    id: 'vinculo-de-sangue',
    name: 'Vínculo de Sangue',
    circle: 4,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser',
    duration: 'Cena',
    description: 'Divide dano com o alvo (ele sofre metade do seu dano se falhar). Ou você sofre metade do dano dele (inverso).',
    cost: 6,
    resistance: { type: 'fortitude', effect: 'anula' },
    hasModes: true,
    hasHooks: true,
    effects: {
      base: {
        kind: 'interceptor',
        modes: [
          { name: 'Ofensivo', description: 'Alvo sofre metade do seu dano' },
          { name: 'Protetor', description: 'Você sofre metade do dano do alvo' },
        ],
        hooks: [
          { trigger: 'onPostDamage', effect: 'Divide dano entre vinculados' },
        ],
        resistance: { type: 'fortitude', effect: 'anula' },
        summary: 'Vincula você ao alvo. Divide dano (ofensivo ou protetor).',
      },
    },
    enhancements: [],
  },
];

// ========================================
// 4º CÍRCULO - MORTE
// ========================================

export const DEATH_FOURTH_CIRCLE: UnifiedRitual[] = [
  {
    id: 'convocar-o-algoz',
    name: 'Convocar o Algoz',
    circle: 4,
    element: 'morte',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 pessoa',
    duration: 'Sustentada',
    description: 'Cria algoz que persegue vítima. Causa abalado (Vontade) ou 0 PV/6d6 Morte (Fortitude).',
    cost: 6,
    resistance: { type: 'vontade', effect: 'parcial' },
    isSustainable: true,
    effects: {
      base: {
        kind: 'summon',
        damage: { diceCount: 6, diceType: 6, damageType: 'morte' },
        conditions: [{ id: 'abalado', duration: 'sustentado' }],
        sustain: { concentration: true },
        summary: 'Algoz persegue alvo. Abalado (Vontade) ou 0 PV/6d6 (Fortitude).',
      },
    },
    enhancements: [],
  },
  {
    id: 'distorcao-temporal',
    name: 'Distorção Temporal',
    circle: 4,
    element: 'morte',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Especial',
    description: 'Bolsão temporal por 3 rodadas. Você age mas não interage com externo.',
    cost: 6,
    effects: {
      base: {
        kind: 'stateOverride',
        summary: 'Cria bolsão temporal por 3 rodadas. Age sem interagir com exterior.',
      },
    },
    enhancements: [],
  },
  {
    id: 'fim-inevitavel',
    name: 'Fim Inevitável',
    circle: 4,
    element: 'morte',
    execution: 'Completa',
    range: 'Longo',
    area: 'Buraco negro com 1,5m de diâmetro',
    duration: 'Especial',
    description: 'Puxa seres (30m) e deixa caídos. Dano 100 Morte se tocar.',
    cost: 6,
    resistance: { type: 'fortitude', effect: 'parcial' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 0, diceType: 6, bonus: 100, damageType: 'morte' },
        conditions: [{ id: 'caido', duration: 1 }],
        resistance: { type: 'fortitude', effect: 'parcial' },
        summary: 'Buraco negro por 4 rodadas. Puxa seres. 100 dano se tocar.',
      },
      discente: {
        kind: 'damage',
        summary: '5 rodadas. Você é imune.',
      },
      verdadeiro: {
        kind: 'damage',
        summary: '6 rodadas. Escolhidos são imunes.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 5, description: '5 rodadas, você imune.', affinityReq: true },
      { name: 'Verdadeiro', cost: 10, description: '6 rodadas, escolhidos imunes.', affinityReq: true },
    ],
  },
  {
    id: 'singularidade-temporal',
    name: 'Singularidade Temporal',
    circle: 4,
    element: 'morte',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 objeto não paranormal Médio',
    duration: 'Instantânea',
    description: 'Avança tempo do objeto (destrói/danifica).',
    cost: 6,
    effects: {
      base: {
        kind: 'utility',
        summary: 'Avança tempo de objeto Médio (destrói/danifica).',
      },
      discente: {
        kind: 'utility',
        summary: 'Afeta objetos Grandes.',
      },
      verdadeiro: {
        kind: 'utility',
        summary: 'Afeta objetos Enormes.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 5, description: 'Grande.', affinityReq: true },
      { name: 'Verdadeiro', cost: 10, description: 'Enorme.', affinityReq: true },
    ],
  },
];

// ========================================
// 4º CÍRCULO - CONHECIMENTO
// ========================================

export const KNOWLEDGE_FOURTH_CIRCLE: UnifiedRitual[] = [
  {
    id: 'controle-mental',
    name: 'Controle Mental',
    circle: 4,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Médio',
    target: '1 pessoa ou animal',
    duration: 'Sustentada',
    description: 'Você domina a mente do alvo, que obedece todos os seus comandos, exceto ordens suicidas. Um alvo tem direito a um teste de Vontade no final de cada um de seus turnos para se livrar do efeito.',
    cost: 6,
    resistance: { type: 'vontade', effect: 'parcial' },
    isSustainable: true,
    effects: {
      base: {
        kind: 'control',
        mentalControl: { type: 'dominate', canForceHarm: true, canForceSuicide: false },
        resistance: { type: 'vontade', effect: 'parcial' },
        sustain: { concentration: true },
        summary: 'Domina mente. Obedece comandos (exceto suicídio). Teste por turno.',
      },
      discente: {
        kind: 'control',
        summary: 'Afeta até 5 pessoas ou animais.',
      },
      verdadeiro: {
        kind: 'control',
        summary: 'Afeta até 10 pessoas ou animais.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 5, description: 'Até cinco pessoas ou animais.', affinityReq: true },
      { name: 'Verdadeiro', cost: 10, description: 'Até dez pessoas ou animais.', affinityReq: true },
    ],
  },
  {
    id: 'inexistir',
    name: 'Inexistir',
    circle: 4,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Instantânea',
    description: 'Causa 10d12+10 Conhecimento (apaga da existência se zerar PV). Se passar, 2d12 e debilitado.',
    cost: 6,
    resistance: { type: 'vontade', effect: 'parcial' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 10, diceType: 12, bonus: 10, damageType: 'conhecimento' },
        conditions: [{ id: 'debilitado', duration: 'cena' }],
        resistance: { type: 'vontade', effect: 'parcial' },
        summary: '10d12+10 dano. Apaga da existência se zerar. Se passar: 2d12 + debilitado.',
      },
      discente: {
        kind: 'damage',
        damage: { diceCount: 15, diceType: 12, bonus: 15, damageType: 'conhecimento' },
        summary: '15d12+15 (resistido: 3d12).',
      },
      verdadeiro: {
        kind: 'damage',
        damage: { diceCount: 20, diceType: 12, bonus: 20, damageType: 'conhecimento' },
        summary: '20d12+20 (resistido: 4d12).',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 5, description: 'Dano 15d12+15 (resistido 3d12).', affinityReq: true },
      { name: 'Verdadeiro', cost: 10, description: 'Dano 20d12+20 (resistido 4d12).', affinityReq: true },
    ],
  },
  {
    id: 'possessao',
    name: 'Possessão',
    circle: 4,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Longo',
    target: '1 pessoa viva ou morta',
    duration: 'Especial',
    description: 'Você projeta sua consciência no corpo de uma pessoa viva ou morta, assumindo controle total.',
    cost: 6,
    resistance: { type: 'vontade', effect: 'anula' },
    effects: {
      base: {
        kind: 'control',
        mentalControl: { type: 'possession', canForceHarm: true, canForceSuicide: false },
        resistance: { type: 'vontade', effect: 'anula' },
        summary: 'Projeta consciência em corpo vivo/morto. Controle total por 1 dia.',
      },
    },
    enhancements: [],
  },
  {
    id: 'pronunciar-sigilo',
    name: 'Pronunciar Sigilo',
    circle: 4,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser',
    duration: 'Instantânea',
    description: 'Efeitos: Esquecer (atordoado/desprevenido), Cegar (cego/ofuscado), Matar (morre/10d8 dano).',
    cost: 6,
    resistance: { type: 'vontade', effect: 'parcial' },
    hasModes: true,
    effects: {
      base: {
        kind: 'damage',
        modes: [
          { name: 'Esquecer', description: 'Atordoado (desprevenido se passar)' },
          { name: 'Cegar', description: 'Cego (ofuscado se passar)' },
          { name: 'Matar', description: 'Morre (10d8 dano se passar)' },
        ],
        damage: { diceCount: 10, diceType: 8, damageType: 'conhecimento' },
        resistance: { type: 'vontade', effect: 'parcial' },
        summary: 'Palavra de poder: Esquecer, Cegar ou Matar.',
      },
      discente: {
        kind: 'damage',
        summary: 'Alcance extremo.',
      },
      verdadeiro: {
        kind: 'damage',
        summary: 'Afeta até 5 seres.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 5, description: 'Alcance extremo.', affinityReq: true },
      { name: 'Verdadeiro', cost: 10, description: 'Até 5 seres.', affinityReq: true },
    ],
  },
];

// ========================================
// 4º CÍRCULO - ENERGIA
// ========================================

export const ENERGY_FOURTH_CIRCLE: UnifiedRitual[] = [
  {
    id: 'alterar-destino',
    name: 'Alterar Destino',
    circle: 4,
    element: 'energia',
    execution: 'Reação',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Instantânea',
    description: 'Recebe +15 em resistência ou Defesa.',
    cost: 6,
    hasHooks: true,
    effects: {
      base: {
        kind: 'interceptor',
        hooks: [
          { trigger: 'onPreDamage', effect: '+15 em Defesa como reação' },
          { trigger: 'onRoll', effect: '+15 em teste de resistência como reação' },
        ],
        defenseBonus: 15,
        resistanceBonus: 15,
        summary: 'Reação: +15 em resistência ou Defesa.',
      },
      verdadeiro: {
        kind: 'interceptor',
        summary: 'Pode afetar aliado em alcance curto.',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 5, description: 'Alcance curto, alvo aliado.', affinityReq: true },
    ],
  },
  {
    id: 'deflagracao-de-energia',
    name: 'Deflagração de Energia',
    circle: 4,
    element: 'energia',
    execution: 'Completa',
    range: 'Pessoal',
    area: 'Explosão de 15m de raio',
    duration: 'Instantânea',
    description: 'Causa 30d10 Energia. Quebra eletrônicos. Metade dano se passar.',
    cost: 6,
    resistance: { type: 'fortitude', effect: 'reduz_metade' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 30, diceType: 10, damageType: 'energia' },
        areaEffect: { shape: 'esfera', radius: 15 },
        resistance: { type: 'fortitude', effect: 'reduz_metade' },
        summary: '30d10 Energia em 15m. Quebra eletrônicos.',
      },
      verdadeiro: {
        kind: 'damage',
        summary: 'Afeta apenas alvos escolhidos.',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 5, description: 'Afeta apenas alvos escolhidos.', affinityReq: true },
    ],
  },
  {
    id: 'teletransporte',
    name: 'Teletransporte',
    circle: 4,
    element: 'energia',
    execution: 'Padrão',
    range: 'Toque',
    target: 'Até 5 seres voluntários',
    duration: 'Instantânea',
    description: 'Teletransporta até 1000km. Teste Ocultismo define precisão.',
    cost: 6,
    effects: {
      base: {
        kind: 'utility',
        summary: 'Teletransporta até 5 seres para até 1000km.',
      },
      verdadeiro: {
        kind: 'utility',
        summary: 'Qualquer lugar na Terra.',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 5, description: 'Qualquer lugar na Terra.', affinityReq: true },
    ],
  },
];

// ========================================
// 4º CÍRCULO - MEDO
// ========================================

export const FEAR_FOURTH_CIRCLE: UnifiedRitual[] = [
  {
    id: 'canalizar-o-medo',
    name: 'Canalizar o Medo',
    circle: 4,
    element: 'medo',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 pessoa',
    duration: 'Especial',
    description: 'Você transfere parte de seu poder para outra pessoa. Escolha um ritual de até 3º círculo; o alvo pode conjurá-lo uma vez sem PE. Seus PE máximos diminuem até o ritual ser usado.',
    cost: 6,
    effects: {
      base: {
        kind: 'buff',
        summary: 'Transfere ritual de até 3º círculo. Alvo conjura 1x sem PE.',
      },
    },
    enhancements: [],
  },
  {
    id: 'conhecendo-o-medo',
    name: 'Conhecendo o Medo',
    circle: 4,
    element: 'medo',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 pessoa',
    duration: 'Instantânea',
    description: 'Sanidade a 0 (enlouquecendo). Se passar, 10d6 mental e apavorado.',
    cost: 6,
    resistance: { type: 'vontade', effect: 'parcial' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 10, diceType: 6, damageType: 'mental' },
        conditions: [{ id: 'apavorado', duration: 'cena' }],
        resistance: { type: 'vontade', effect: 'parcial' },
        summary: 'Sanidade a 0 (enlouquece). Se passar: 10d6 mental + apavorado.',
      },
    },
    enhancements: [],
  },
  {
    id: 'lamina-do-medo',
    name: 'Lâmina do Medo',
    circle: 4,
    element: 'medo',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Instantânea',
    description: 'Golpe reduz PV a 0 (morrendo). Se passar, 10d8 Medo e apavorado. Ferimento nunca cicatriza.',
    cost: 6,
    resistance: { type: 'fortitude', effect: 'parcial' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 10, diceType: 8, damageType: 'medo' },
        conditions: [{ id: 'apavorado', duration: 'cena' }],
        resistance: { type: 'fortitude', effect: 'parcial' },
        summary: 'PV a 0 (morrendo). Se passar: 10d8 Medo + apavorado.',
      },
    },
    enhancements: [],
  },
  {
    id: 'medo-tangivel',
    name: 'Medo Tangível',
    circle: 4,
    element: 'medo',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Imune a condições e crítico/furtivo. Dano físico não reduz PV abaixo de 1.',
    cost: 6,
    hasHooks: true,
    effects: {
      base: {
        kind: 'stateOverride',
        hooks: [
          { trigger: 'onReduceHP', effect: 'Dano físico não reduz PV abaixo de 1' },
        ],
        summary: 'Imune a condições e crítico/furtivo. Dano físico não mata.',
      },
    },
    enhancements: [],
  },
  {
    id: 'presenca-do-medo',
    name: 'Presença do Medo',
    circle: 4,
    element: 'medo',
    execution: 'Padrão',
    range: 'Pessoal',
    area: 'Emanação de 9m de raio',
    duration: 'Sustentada',
    description: 'Causa 5d8 mental + 5d8 Medo e atordoado (Vontade reduz metade e evita atordoado).',
    cost: 6,
    resistance: { type: 'vontade', effect: 'parcial' },
    isSustainable: true,
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 5, diceType: 8, damageType: 'medo' },
        conditions: [{ id: 'atordoado', duration: 1 }],
        areaEffect: { shape: 'emanação', radius: 9 },
        resistance: { type: 'vontade', effect: 'parcial' },
        sustain: { action: 'free' },
        summary: '5d8 mental + 5d8 Medo + atordoado em emanação de 9m.',
      },
    },
    enhancements: [],
  },
];
