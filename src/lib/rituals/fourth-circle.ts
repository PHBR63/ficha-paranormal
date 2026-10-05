/**
 * Ordem Paranormal RPG - Rituais de 4º Círculo (Oficiais)
 * Baseado no documento oficial - 17 rituais
 * 
 * Conhecimento (3): Controle Mental, Inexistir, Possessão
 * Energia (3): Alterar Destino, Deflagração de Energia, Teletransporte
 * Medo (5): Canalizar o Medo, Conhecendo o Medo, Lâmina do Medo, Medo Tangível, Presença do Medo
 * Morte (3): Convocar o Algoz, Distorção Temporal, Fim Inevitável
 * Sangue (3): Capturar o Coração, Invólucro de Carne, Vínculo de Sangue
 */

import type { UnifiedRitual } from './types';

// ========================================
// 4º CÍRCULO - CONHECIMENTO (3 rituais)
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
    description: 'Você domina a mente do alvo, que obedece todos os seus comandos, exceto ordens suicidas. Um alvo tem direito a um teste de Vontade no final de cada um de seus turnos para se livrar do efeito. Alvos que passarem no teste ficam pasmos por 1 rodada (apenas uma vez por cena). Requer afinidade com Conhecimento.',
    cost: 10,
    resistance: { type: 'vontade', effect: 'parcial' },
    isSustainable: true,
    effects: {
      base: {
        kind: 'control',
        mentalControl: { type: 'dominate', canForceHarm: true, canForceSuicide: false },
        resistance: { type: 'vontade', effect: 'parcial' },
        sustain: { concentration: true },
        summary: 'Domina mente. Obedece comandos (exceto suicídio). Teste Vontade por turno.',
      },
      discente: {
        kind: 'control',
        summary: 'Muda alvo para até 5 pessoas ou animais.',
      },
      verdadeiro: {
        kind: 'control',
        summary: 'Muda alvo para até 10 pessoas ou animais.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 5, description: 'Até 5 pessoas ou animais.' },
      { name: 'Verdadeiro', cost: 10, description: 'Até 10 pessoas ou animais.' },
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
    description: 'Este é um ritual extremamente cruel, que já condenou grandes agentes da Ordem ao oblívio. Você toca o alvo com a intenção de apagá-lo por completo da existência, causando 10d12+10 pontos de dano de Conhecimento. Se o alvo passar no teste de resistência, em vez disso sofre 2d12 pontos de dano e fica debilitado por uma rodada. Se os PV do alvo forem reduzidos a 0 ou menos, ele será completamente apagado, não restando nenhum traço de sua existência. Requer afinidade.',
    cost: 10,
    resistance: { type: 'vontade', effect: 'parcial' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 10, diceType: 12, bonus: 10, damageType: 'conhecimento' },
        conditions: [{ id: 'debilitado', duration: 1 }],
        resistance: { type: 'vontade', effect: 'parcial' },
        summary: '10d12+10 Conhecimento. Apaga da existência se zerar PV. Se passar: 2d12 + debilitado.',
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
      { name: 'Discente', cost: 5, description: 'Dano 15d12+15 (resistido 3d12).' },
      { name: 'Verdadeiro', cost: 10, description: 'Dano 20d12+20 (resistido 4d12).' },
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
    duration: '1 dia',
    description: 'Você projeta sua consciência no corpo de uma pessoa viva ou morta. Enquanto possuir o alvo, você assume o controle total do corpo dele (se o alvo estiver vivo, a consciência dele troca de lugar com a sua, ficando inerte dentro do seu corpo desacordado). Você usa sua ficha, mas com os atributos físicos (AGI, FOR, VIG) e deslocamento do alvo. Se o alvo passar no teste de resistência, sabe que você tentou possuí-lo e fica imune por um dia. Se qualquer um dos envolvidos morrer, a mente sobrevivente fica presa no corpo novo permanentemente.',
    cost: 10,
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
];

// ========================================
// 4º CÍRCULO - ENERGIA (3 rituais)
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
    description: 'Você vislumbra seu futuro próximo, analisando milhões de possibilidades e escolhendo a melhor. Você recebe +15 em um teste de resistência ou na Defesa contra um ataque.',
    cost: 10,
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
        summary: 'Muda alcance para curto e alvo para um aliado à sua escolha.',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 5, description: 'Alcance curto, alvo: um aliado.', affinityReq: true },
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
    description: 'Você acumula uma quantidade imensa de Energia, então a libera em uma explosão intensa, como uma estrela em plena terra. Todos na área sofrem 3d10 x 10 pontos de dano de Energia e todos os itens tecnológicos (armas de fogo, acessórios e utensílios) param de funcionar (estão quebrados). Você não é afetado pela explosão. Alvos que passem no teste de Fortitude sofrem metade do dano e seus itens voltam a funcionar após 1d4 rodadas.',
    cost: 10,
    resistance: { type: 'fortitude', effect: 'reduz_metade' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 30, diceType: 10, damageType: 'energia' },
        areaEffect: { shape: 'esfera', radius: 15 },
        resistance: { type: 'fortitude', effect: 'reduz_metade' },
        summary: '3d10x10 (30d10) Energia em 15m. Quebra eletrônicos. Você é imune.',
      },
      verdadeiro: {
        kind: 'damage',
        summary: 'Afeta apenas alvos à sua escolha.',
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
    description: 'O ritual transforma o corpo e equipamento dos alvos em energia pura e os faz reaparecer num lugar a sua escolha a até 1.000km. Teste de Ocultismo define precisão: DT 25 (frequente), DT 30 (uma vez), DT 35 (descrição). Se falhar, chega em lugar errado (até 1d10x10 km). Se falhar por 5+, ritual falha, gasta PE e fica atordoado 1d4 rodadas.',
    cost: 10,
    effects: {
      base: {
        kind: 'utility',
        summary: 'Teletransporta até 5 seres para até 1.000km. Ocultismo define precisão.',
      },
      verdadeiro: {
        kind: 'utility',
        summary: 'Pode se teletransportar para qualquer lugar na Terra.',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 5, description: 'Qualquer lugar na Terra.', affinityReq: true },
    ],
  },
];

// ========================================
// 4º CÍRCULO - MEDO (5 rituais)
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
    duration: 'Permanente até ser descarregada',
    description: 'Você transfere parte de seu poder para outra pessoa. Escolha um ritual de até 3º círculo que você conheça; o alvo pode conjurar este ritual em sua forma básica uma vez, sem pagar seu custo em PE (mas pode usar formas avançadas gastando seus próprios PE para isso). Até o ritual transferido ser conjurado, seus PE máximos diminuem em um valor igual ao custo dele.',
    cost: 10,
    effects: {
      base: {
        kind: 'buff',
        summary: 'Transfere ritual de até 3º círculo. Alvo conjura 1x sem PE. Seus PE máx diminuem até usar.',
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
    description: 'Você manifesta medo absoluto na mente do alvo. Se ele falhar no teste de resistência, a Sanidade dele é reduzida a 0 e ele fica enlouquecendo. Se ele passar, sofre 10d6 pontos de dano mental e fica apavorado por 1 rodada. Uma pessoa que fique insana pelo efeito deste ritual se transforma em uma criatura paranormal a critério do mestre.',
    cost: 10,
    resistance: { type: 'vontade', effect: 'parcial' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 10, diceType: 6, damageType: 'mental' },
        conditions: [{ id: 'apavorado', duration: 1 }, { id: 'enlouquecendo', duration: 'permanent' }],
        resistance: { type: 'vontade', effect: 'parcial' },
        summary: 'Sanidade a 0 + enlouquecendo se falhar. Se passar: 10d6 mental + apavorado.',
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
    description: 'Você manifesta uma lâmina impossível, descrita apenas como uma "fenda na Realidade", com a qual golpeia um alvo adjacente. Se o alvo falhar no teste de Fortitude, seus PV são reduzidos a 0 e ele fica morrendo; se passar, sofre 10d8 pontos de dano de Medo (ignora todas as resistências) e fica apavorado por uma rodada. Se sobreviver, o ferimento nunca cicatriza e a pessoa vive em dor constante. Aprender este ritual requer um poder de trilha específico.',
    cost: 10,
    resistance: { type: 'fortitude', effect: 'parcial' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 10, diceType: 8, damageType: 'medo' },
        conditions: [{ id: 'morrendo', duration: 'permanent' }, { id: 'apavorado', duration: 1 }],
        resistance: { type: 'fortitude', effect: 'parcial' },
        summary: 'PV a 0 + morrendo se falhar. Se passar: 10d8 Medo (ignora resistências) + apavorado.',
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
    description: 'O ritual transforma seu corpo em uma manifestação do Medo, tornando-o imune a efeitos mundanos. Você fica imune às condições atordoado, cego, debilitado, enjoado, envenenado, exausto, fatigado, fraco, lento, ofuscado e paralisado, além de doenças e venenos, e não sofre dano adicional por acertos críticos e ataques furtivos. Além disso, dano do tipo balístico, corte, impacto ou perfuração não podem reduzir seu total de pontos de vida abaixo de 1.',
    cost: 10,
    hasHooks: true,
    effects: {
      base: {
        kind: 'stateOverride',
        hooks: [
          { trigger: 'onReduceHP', effect: 'Dano físico não reduz PV abaixo de 1' },
        ],
        summary: 'Imune a condições e crítico/furtivo. Dano físico não mata (mínimo 1 PV).',
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
    description: 'Você se torna um receptáculo para o Medo puro, emanando ondas de pavor e ruína. Alvos dentro da área no momento da conjuração ou no início de cada um de seus turnos sofrem 5d8 de dano mental e 5d8 de dano de Medo (Vontade reduz ambos à metade). Alvos que falharem no teste ficam atordoados por uma rodada (este efeito funciona apenas uma vez por cena).',
    cost: 10,
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
        summary: '5d8 mental + 5d8 Medo + atordoado (1x/cena). Emanação 9m.',
      },
    },
    enhancements: [],
  },
];

// ========================================
// 4º CÍRCULO - MORTE (3 rituais)
// ========================================

export const DEATH_FOURTH_CIRCLE: UnifiedRitual[] = [
  {
    id: 'convocar-o-algoz',
    name: 'Convocar o Algoz',
    circle: 4,
    element: 'morte',
    execution: 'Padrão',
    range: '1,5m',
    target: '1 pessoa',
    duration: 'Sustentada',
    description: 'Usando os medos subconscientes do alvo, você manipula a espiral da Morte para criar uma imagem daquilo que ele mais teme. Apenas a vítima vê o algoz com nitidez; outros enxergam um vulto sombrio. O algoz surge adjacente a você. No fim de cada turno seu, ele flutua 12m em direção à vítima. Em alcance curto: Vontade ou abalado. Adjacente: Fortitude ou 0 PV; se passar, 6d6 Morte (não mata). O algoz é incorpóreo, imune a dano, e só desaparece se deixar o alvo morrendo ou for dissipado.',
    cost: 10,
    resistance: { type: 'vontade', effect: 'parcial' },
    isSustainable: true,
    effects: {
      base: {
        kind: 'summon',
        damage: { diceCount: 6, diceType: 6, damageType: 'morte' },
        conditions: [{ id: 'abalado', duration: 'sustentado' }],
        sustain: { concentration: true },
        summary: 'Algoz persegue vítima. Abalado (Vontade) ou 0 PV/6d6 Morte (Fortitude).',
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
    target: 'Veja texto',
    duration: '3 rodadas',
    description: 'Este ritual distorce o fluxo de tempo em relação a você, criando um pequeno bolsão temporal que dura 3 rodadas. Durante este tempo, você pode agir, mas não pode se deslocar do lugar nem interagir com seres e objetos. Da mesma forma, efeitos contínuos não o afetam, e quaisquer efeitos que você iniciar não afetarão a área ao seu redor. Efeitos de área com duração maior que este efeito vão agir normalmente quando o bolsão temporal acabar.',
    cost: 10,
    effects: {
      base: {
        kind: 'stateOverride',
        summary: 'Bolsão temporal por 3 rodadas. Age sem interagir com exterior nem se deslocar.',
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
    range: 'Extremo',
    area: 'Buraco negro com 1,5m de diâmetro',
    duration: '4 rodadas',
    description: 'Você cria um vácuo em um espaço desocupado a sua escolha. No início de cada um de seus quatro turnos seguintes, todos os seres a até 90m do vácuo, incluindo você, devem fazer um teste de Fortitude. Em caso de falha, ficam caídos e são puxados 30m na direção do vácuo. Objetos soltos também são puxados. Seres podem gastar uma ação de movimento para se segurar em objeto fixo (+5 no teste). Seres e objetos que iniciem seu turno tocando o vácuo sofrem 100 pontos de dano de Morte por rodada.',
    cost: 10,
    resistance: { type: 'fortitude', effect: 'parcial' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 0, diceType: 6, bonus: 100, damageType: 'morte' },
        conditions: [{ id: 'caido', duration: 1 }],
        areaEffect: { shape: 'esfera', radius: 90 },
        resistance: { type: 'fortitude', effect: 'parcial' },
        summary: 'Buraco negro por 4 rodadas. Puxa 30m se falhar. 100 dano se tocar.',
      },
      discente: {
        kind: 'damage',
        summary: '5 rodadas. Você não é afetado.',
      },
      verdadeiro: {
        kind: 'damage',
        summary: '6 rodadas. Seres escolhidos dentro do alcance não são afetados.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 5, description: '5 rodadas, você não é afetado.', affinityReq: true },
      { name: 'Verdadeiro', cost: 10, description: '6 rodadas, seres escolhidos são imunes.', affinityReq: true },
    ],
  },
];

// ========================================
// 4º CÍRCULO - SANGUE (3 rituais)
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
    description: 'Você desperta uma paixão doentia e obcecada por você no alvo, que passa a querer agradá-lo a todo custo, mesmo que para isso precise ficar contra seus amigos. No início de cada turno do alvo ele deve fazer um teste de Vontade. Se falhar, age de forma a ajudá-lo na melhor de suas capacidades naquele turno. Se o alvo passar nesse teste dois turnos seguidos o efeito termina.',
    cost: 10,
    resistance: { type: 'vontade', effect: 'parcial' },
    effects: {
      base: {
        kind: 'control',
        mentalControl: { type: 'charm', canForceHarm: false, canForceSuicide: false },
        resistance: { type: 'vontade', effect: 'parcial' },
        summary: 'Paixão obsessiva. Ajuda você se falhar em Vontade. Passar 2x encerra.',
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
    description: 'Você manifesta uma poça de sangue no chão, de onde emerge uma cópia sua. Ela é idêntica em aparência e capacidades (mesmas estatísticas) e surge com uma cópia de todo equipamento mundano que você estiver carregando. A cópia não tem consciência (INT e PRE nulos) e não age sem ordem. Você pode gastar uma ação de movimento para dar uma ordem, ou entrar em transe e controlá-la diretamente. Percepção (DT do ritual) identifica como cópia. A cópia se desfaz se chegar a 0 PV ou sair do alcance.',
    cost: 10,
    effects: {
      base: {
        kind: 'summon',
        sustain: { action: 'move' },
        summary: 'Cria clone físico. Ordem (movimento) ou controle total (transe). Desfaz se 0 PV.',
      },
    },
    enhancements: [],
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
    description: 'Você manifesta um símbolo de Sangue no seu corpo e no corpo do alvo. Sempre que você sofrer dano, o alvo deve fazer um teste de Fortitude. Se ele falhar, você sofre apenas metade do dano e ele sofre a metade restante. Você pode conjurar o ritual com efeito inverso, fazendo com que você receba metade de todo o dano que o alvo receberia. Alvos voluntários não precisam fazer testes de resistência.',
    cost: 10,
    resistance: { type: 'fortitude', effect: 'anula' },
    hasModes: true,
    hasHooks: true,
    effects: {
      base: {
        kind: 'interceptor',
        modes: [
          { name: 'Ofensivo', description: 'Alvo sofre metade do seu dano (Fortitude)' },
          { name: 'Protetor', description: 'Você sofre metade do dano do alvo (voluntário)' },
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
