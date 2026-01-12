/**
 * Ordem Paranormal RPG - Rituais de 3º Círculo (Oficiais)
 * Baseado no documento oficial - 17 rituais
 * 
 * Conhecimento (4): Alterar Memória, Contato Paranormal, Mergulho Mental, Vidência
 * Energia (4): Convocação Instantânea, Salto Fantasma, Transfigurar Água, Transfigurar Terra
 * Medo (1): Dissipar Ritual
 * Morte (4): Âncora Temporal, Poeira da Podridão, Tentáculos de Lodo, Zerar Entropia
 * Sangue (4): Ferver Sangue, Forma Monstruosa, Purgatório, Vomitar Pestes
 */

import type { UnifiedRitual } from './types';

// ========================================
// 3º CÍRCULO - CONHECIMENTO (4 rituais)
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
    description: 'Você invade a mente do alvo e altera ou apaga suas memórias de até uma hora atrás. Se escolher alterar as memórias, você pode mudar detalhes de eventos recentes, como a identidade de alguém encontrado ou o endereço de um lugar visitado, mas não reescrever completamente esses eventos. O alvo recupera suas memórias após 1d4 dias.',
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
      { name: 'Verdadeiro', cost: 4, description: 'Pode alterar/apagar memórias de até 24h atrás.', circleReq: 4 },
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
    duration: '1 dia',
    description: 'Você barganha com a entidade de Conhecimento para que o auxilie durante o dia, em troca de se alimentar de sua Sanidade. Quando o ritual é conjurado, você recebe seis d6. Sempre que fizer um teste de perícia, você pode gastar um desses d6, rolá-lo e adicionar o resultado no teste. No entanto, essa ajuda tem um preço: sempre que rolar um 6 no dado, a entidade toma 2 pontos de Sanidade de você. Se você ficar sem dados ou chegar a Sanidade 0, o ritual acaba.',
    cost: 4,
    effects: {
      base: {
        kind: 'buff',
        summary: 'Recebe 6d6 para somar em testes de perícia. Rolar 6 = perde 2 Sanidade.',
      },
      discente: {
        kind: 'buff',
        summary: 'Muda os dados para d8. Rolar 8 = perde 3 Sanidade.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: 'Muda os dados para d12. Rolar 12 = perde 5 Sanidade.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 4, description: 'Dados d8 (rolar 8 = -3 Sanidade).', circleReq: 4 },
      { name: 'Verdadeiro', cost: 9, description: 'Dados d12 (rolar 12 = -5 Sanidade).', circleReq: 4, affinityReq: true },
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
    description: 'Você mergulha nos pensamentos do alvo para descobrir informações sobre ele. Durante o mergulho, você fica desprevenido. No início de cada turno seu que estiver sustentando o efeito e tocando o alvo, ele deve fazer um teste de Vontade. Se falhar, deve responder uma pergunta sua que possa ser respondida com "sim" ou "não", sendo incapaz de mentir.',
    cost: 4,
    resistance: { type: 'vontade', effect: 'parcial' },
    isSustainable: true,
    effects: {
      base: {
        kind: 'sense',
        senseEffect: { type: 'scry', targets: 'pensamentos', information: 'sim/não' },
        resistance: { type: 'vontade', effect: 'parcial' },
        sustain: { concentration: true },
        summary: 'Lê pensamentos. Pergunta sim/não se falhar em Vontade. Você fica desprevenido.',
      },
      verdadeiro: {
        kind: 'sense',
        summary: 'Execução 1 dia, alcance ilimitado. Precisa de cuba de água, máscara e info do alvo.',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 4, description: 'Execução 1 dia, alcance ilimitado (cuba de água + máscara).', circleReq: 4 },
    ],
  },
  {
    id: 'videncia',
    name: 'Vidência',
    circle: 3,
    element: 'conhecimento',
    execution: 'Completa',
    range: 'Ilimitado',
    target: '1 ser',
    duration: '5 rodadas',
    description: 'Através de uma superfície reflexiva, como um espelho, uma bacia de água ou mesmo uma TV desligada, você pode ver e ouvir um ser escolhido e seus arredores (cerca de 6m em qualquer direção). O alvo pode estar a qualquer distância, mas tem direito a um teste de resistência no início de cada um de seus turnos para impedir a Vidência naquele turno. Se o alvo passar em dois testes seguidos, o ritual é encerrado e o alvo fica imune a ele por uma semana.',
    cost: 4,
    resistance: { type: 'vontade', effect: 'anula' },
    effects: {
      base: {
        kind: 'sense',
        senseEffect: { type: 'scry', information: 'visão e audição do alvo e arredores (6m)' },
        resistance: { type: 'vontade', effect: 'anula' },
        summary: 'Vê/ouve alvo por 5 rodadas através de superfície reflexiva. Passar 2x encerra.',
      },
    },
    enhancements: [],
  },
];

// ========================================
// 3º CÍRCULO - ENERGIA (4 rituais)
// ========================================

export const ENERGY_THIRD_CIRCLE: UnifiedRitual[] = [
  {
    id: 'convocacao-instantanea',
    name: 'Convocação Instantânea',
    circle: 3,
    element: 'energia',
    execution: 'Padrão',
    range: 'Ilimitado',
    target: '1 objeto de até 2 espaços',
    duration: 'Instantânea',
    description: 'Você invoca um objeto de qualquer lugar para sua mão. O item deve ter sido previamente preparado com o símbolo do ritual e pode ocupar no máximo 2 espaços. Se o objeto estiver sendo empunhado por outra pessoa, ela pode fazer um teste de Vontade para negar o efeito, mas você saberá onde o objeto está e quem o está carregando. Por até 1h depois da convocação, você pode gastar uma ação de movimento para enviar o objeto de volta.',
    cost: 4,
    resistance: { type: 'vontade', effect: 'anula' },
    effects: {
      base: {
        kind: 'utility',
        summary: 'Invoca objeto preparado (até 2 espaços) para sua mão. Pode devolver em 1h.',
      },
      discente: {
        kind: 'utility',
        summary: 'Objeto de até 10 espaços.',
      },
      verdadeiro: {
        kind: 'utility',
        summary: 'Cria esconderijo permanente no Outro Lado (recipiente Médio, até 10 espaços). Perde 1 PE permanentemente.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 4, description: 'Objeto até 10 espaços.' },
      { name: 'Verdadeiro', cost: 9, description: 'Esconderijo permanente no Outro Lado. Perde 1 PE permanente.' },
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
    description: 'Seu corpo se transforma momentaneamente em Energia pura e viaja até outro ponto. Você não precisa perceber nem ter linha de efeito ao seu destino, podendo apenas imaginá-lo, desde que já tenha observado o local de alguma forma. Uma vez transportado, você não pode agir pelo resto do seu turno. Este ritual não permite que você apareça dentro de um corpo sólido.',
    cost: 4,
    effects: {
      base: {
        kind: 'utility',
        summary: 'Teletransporta para ponto em alcance médio. Não age no resto do turno.',
      },
      discente: {
        kind: 'interceptor',
        hooks: [{ trigger: 'onPreDamage', effect: 'Salta 1,5m como reação, +10 Defesa/Reflexos' }],
        summary: 'Reação: salta 1,5m adjacente, +10 Defesa e Reflexos contra o efeito.',
      },
      verdadeiro: {
        kind: 'utility',
        summary: 'Alcance longo. Pode levar até 2 seres voluntários que esteja tocando.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Reação. Salta 1,5m, +10 Defesa/Reflexos.' },
      { name: 'Verdadeiro', cost: 4, description: 'Alcance longo, até 2 voluntários.' },
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
    description: 'Você canaliza Energia sobre um corpo de água, para que ele adquira movimentos e comportamentos paranormais e caóticos. Escolha um efeito: Congelar (congela água, prende nadadores), Derreter (gelo vira água), Enchente (eleva nível 4,5m ou +6m deslocamento de barco), Evaporar (5d8 dano de Energia, Fortitude metade), Partir (diminui nível 4,5m ou cria redemoinho).',
    cost: 4,
    hasModes: true,
    effects: {
      base: {
        kind: 'utility',
        modes: [
          { name: 'Congelar', description: 'Congela água na área, prende nadadores' },
          { name: 'Derreter', description: 'Gelo vira água' },
          { name: 'Enchente', description: 'Eleva nível 4,5m ou +6m deslocamento barco' },
          { name: 'Evaporar', description: '5d8 dano de Energia (Fortitude metade)' },
          { name: 'Partir', description: 'Diminui nível 4,5m ou cria redemoinho' },
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
      { name: 'Verdadeiro', cost: 5, description: 'Enchente +12m, Evaporar 10d8.' },
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
    description: 'Você imbui terra, pedra, lama, argila ou areia na área com Energia. Escolha um efeito: Amolecer (desabamento 10d6 ou terreno difícil), Modelar (cria objetos Enormes ou menores, sem mecanismos), Solidificar (transforma lama/areia em terra/pedra, prende pés).',
    cost: 4,
    hasModes: true,
    effects: {
      base: {
        kind: 'utility',
        modes: [
          { name: 'Amolecer', description: 'Desabamento 10d6 impacto (Reflexos metade) ou terreno difícil' },
          { name: 'Modelar', description: 'Cria objetos Enormes ou menores, sem mecanismos' },
          { name: 'Solidificar', description: 'Transforma lama/areia em terra/pedra, prende pés' },
        ],
        summary: 'Controla terra/pedra com vários efeitos.',
      },
      discente: {
        kind: 'utility',
        summary: 'Aumenta para 15 cubos com 1,5m de lado.',
      },
      verdadeiro: {
        kind: 'utility',
        summary: 'Também afeta minerais e metais.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: '15 cubos.' },
      { name: 'Verdadeiro', cost: 7, description: 'Afeta minerais e metais.', circleReq: 4 },
    ],
  },
];

// ========================================
// 3º CÍRCULO - MEDO (1 ritual)
// ========================================

export const FEAR_THIRD_CIRCLE: UnifiedRitual[] = [
  {
    id: 'dissipar-ritual',
    name: 'Dissipar Ritual',
    circle: 3,
    element: 'medo',
    execution: 'Padrão',
    range: 'Médio',
    target: '1 ser ou objeto, ou esfera com 3m de raio',
    duration: 'Instantânea',
    description: 'Você dissipa rituais ativos, como se a duração deles tivesse acabado. Efeitos de rituais instantâneos não podem ser dissipados. Faça um teste de Ocultismo; você anula quaisquer rituais ativos no alvo ou na área com DT igual ou menor que o resultado do teste. Você pode conjurar esse ritual em um item amaldiçoado para que se torne um item mundano (perdendo seus poderes) por um dia. Se o item estiver em posse de alguém, seu usuário pode fazer um teste de Vontade para negar o efeito.',
    cost: 4,
    effects: {
      base: {
        kind: 'utility',
        summary: 'Encerra rituais ativos (Ocultismo vs DT). Anula item amaldiçoado por 1 dia.',
      },
    },
    enhancements: [],
  },
];

// ========================================
// 3º CÍRCULO - MORTE (4 rituais)
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
    description: 'Uma aura espiralada surge sobre o alvo. No início de cada turno dele, ele deve fazer um teste de Vontade. Se falhar, não poderá se deslocar naquele turno (ele ainda pode agir, só não pode se deslocar). Se o alvo passar nesse teste dois turnos seguidos o efeito termina.',
    cost: 4,
    resistance: { type: 'vontade', effect: 'parcial' },
    effects: {
      base: {
        kind: 'debuff',
        actionRestrictions: ['cannotMove'],
        resistance: { type: 'vontade', effect: 'parcial' },
        summary: 'Impede deslocamento se falhar em Vontade. Passar 2x seguidos encerra.',
      },
      verdadeiro: {
        kind: 'debuff',
        summary: 'Muda o alvo para "seres à sua escolha".',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 4, description: 'Alvo: seres à sua escolha.', circleReq: 4 },
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
    description: 'Você manifesta uma nuvem de poeira que apodrece os seres na área. Ao conjurar o ritual, e no início de cada um de seus turnos, seres e objetos na área sofrem 4d8 pontos de dano de Morte (Fortitude reduz à metade). Alvos que falharem no teste também não podem recuperar PV de nenhuma forma por uma rodada.',
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
        summary: '4d8 Morte/turno. Impede cura se falhar.',
      },
      verdadeiro: {
        kind: 'damage',
        damagePerTurn: { diceCount: 4, diceType: 8, bonus: 16, damageType: 'morte' },
        summary: 'Dano 4d8+16.',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 4, description: 'Dano 4d8+16.' },
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
    description: 'Uma fenda sombria se abre no chão, de onde surgem tentáculos feitos de Lodo da Morte. Ao conjurar o ritual e no início de cada um de seus turnos, você faz um teste da manobra agarrar (usando Ocultismo em vez de Luta) contra cada alvo na área. Se você vencer, o ser é agarrado; se já estava agarrado, é esmagado, sofrendo 4d6 pontos de dano (metade impacto, metade Morte). A área conta como terreno difícil. Os tentáculos são imunes a dano.',
    cost: 4,
    effects: {
      base: {
        kind: 'control',
        damage: { diceCount: 4, diceType: 6, damageType: 'morte' },
        conditions: [{ id: 'agarrado', duration: 'cena' }],
        areaEffect: { shape: 'esfera', radius: 6 },
        summary: 'Tentáculos agarram (Ocultismo) e causam 4d6 dano. Terreno difícil.',
      },
      verdadeiro: {
        kind: 'control',
        damage: { diceCount: 6, diceType: 6, damageType: 'morte' },
        areaEffect: { shape: 'esfera', radius: 9 },
        summary: 'Raio 9m, dano 6d6.',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 5, description: 'Raio 9m, dano 6d6.' },
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
    description: 'Você zera completamente a entropia do alvo em relação ao ambiente, deixando-o paralisado. Se passar na resistência, em vez disso fica lento. No início de cada um de seus turnos, o alvo pode gastar uma ação completa para fazer um novo teste de Vontade. Se passar, encerra o efeito.',
    cost: 4,
    resistance: { type: 'vontade', effect: 'parcial' },
    effects: {
      base: {
        kind: 'debuff',
        conditions: [{ id: 'paralisado', duration: 'cena', saveEnds: true }],
        resistance: { type: 'vontade', effect: 'parcial' },
        summary: 'Paralisado (lento se passar). Teste de Vontade por turno para encerrar.',
      },
      discente: {
        kind: 'debuff',
        summary: 'Muda o alvo para "1 ser" (não apenas pessoa).',
      },
      verdadeiro: {
        kind: 'debuff',
        summary: 'Muda o alvo para "seres escolhidos".',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 4, description: 'Alvo: 1 ser.', circleReq: 4 },
      { name: 'Verdadeiro', cost: 11, description: 'Alvo: seres escolhidos.', circleReq: 4, affinityReq: true },
    ],
  },
];

// ========================================
// 3º CÍRCULO - SANGUE (4 rituais)
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
    description: 'O sangue do alvo aquece até entrar em ebulição. Quando o ritual é conjurado, e no início de cada turno do alvo, ele deve fazer um teste de Fortitude. Se falhar, sofre 4d8 pontos de dano de Sangue e fica fraco; se passar, sofre metade do dano e não fica fraco nesta rodada. Se o alvo passar nesse teste dois turnos seguidos o efeito termina.',
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
        summary: '4d8 dano Sangue + fraco se falhar. Passar 2x seguidos encerra.',
      },
      verdadeiro: {
        kind: 'damage',
        summary: 'Muda o alvo para "seres escolhidos".',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 4, description: 'Alvo: seres escolhidos.', circleReq: 4, affinityReq: true },
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
    description: 'Seu corpo se transforma, assumindo uma forma que combina suas características com as de uma criatura de Sangue. Seu tamanho muda para Grande e você recebe +5 em testes de ataque e rolagens de dano corpo a corpo e 30 PV temporários. Enquanto transformado, você não pode falar nem conjurar rituais e deve atacar o ser mais próximo. Se for aliado, teste de Vontade para escolher outro alvo.',
    cost: 4,
    effects: {
      base: {
        kind: 'transformation',
        attackBonus: 5,
        damageBonus: 5,
        tempHP: { diceCount: 0, diceType: 6, bonus: 30 },
        actionRestrictions: ['mustAttack', 'cannotSpeak', 'cannotCast'],
        summary: 'Forma Grande. +5 ataque/dano corpo a corpo, 30 PV temp. Fúria.',
      },
      discente: {
        kind: 'transformation',
        summary: 'Imune a atordoamento, fadiga, sangramento, sono e veneno.',
      },
      verdadeiro: {
        kind: 'transformation',
        attackBonus: 10,
        damageBonus: 10,
        tempHP: { diceCount: 0, diceType: 6, bonus: 50 },
        summary: '+10 ataque/dano, 50 PV temporários.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Imune a atordoamento, fadiga, sangramento, sono, veneno.', circleReq: 4 },
      { name: 'Verdadeiro', cost: 9, description: '+10 bônus, 50 PV temporários.', circleReq: 4, affinityReq: true },
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
    description: 'Você faz brotar uma poça de sangue pegajoso na área afetada. Inimigos na área se tornam vulneráveis a dano balístico, de corte, de impacto e de perfuração. Um alvo que tente sair da área é acometido de uma dor terrível; sofre 6d6 pontos de dano de Sangue e deve fazer um teste de Fortitude. Se passar, consegue sair. Se falhar, não consegue se mover e perde a ação de movimento.',
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
        summary: 'Inimigos vulneráveis a dano físico. 6d6 Sangue ao tentar sair.',
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
    area: 'Enxame Grande (quadrado de 3m)',
    duration: 'Sustentada',
    description: 'Você vomita um enxame de pequenas criaturas de Sangue, que surge em um ponto adjacente a sua escolha. O enxame pode passar pelo espaço de outros seres. No final de cada um de seus turnos, o enxame causa 5d12 pontos de dano de Sangue a qualquer ser no espaço dele (Reflexos reduz à metade). Você pode gastar uma ação de movimento para mover o enxame com deslocamento de 12m.',
    cost: 4,
    resistance: { type: 'reflexos', effect: 'reduz_metade' },
    isSustainable: true,
    effects: {
      base: {
        kind: 'summon',
        damage: { diceCount: 5, diceType: 12, damageType: 'sangue' },
        resistance: { type: 'reflexos', effect: 'reduz_metade' },
        sustain: { action: 'move' },
        summary: 'Enxame Grande. 5d12 Sangue/turno. Movimento 12m.',
      },
      discente: {
        kind: 'summon',
        conditions: [{ id: 'agarrado', duration: 1 }],
        summary: 'Quem falhar no Reflexos fica agarrado.',
      },
      verdadeiro: {
        kind: 'summon',
        summary: 'Enxame Enorme (cubo de 6m), voo 18m.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Agarra quem falhar no Reflexos.' },
      { name: 'Verdadeiro', cost: 5, description: 'Enxame Enorme (6m), voo 18m.' },
    ],
  },
];
