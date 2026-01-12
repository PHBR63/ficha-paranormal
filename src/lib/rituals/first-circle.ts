/**
 * Ordem Paranormal RPG - Rituais de 1º Círculo (Unificados)
 * Baseado no Livro Base v1.3
 */

import type { UnifiedRitual } from './types';

// ========================================
// 1º CÍRCULO - CONHECIMENTO
// ========================================

export const KNOWLEDGE_FIRST_CIRCLE: UnifiedRitual[] = [
  {
    id: 'amaldicoar-arma-conhecimento',
    name: 'Amaldiçoar Arma',
    circle: 1,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 arma corpo a corpo ou pacote de munição',
    duration: 'Cena',
    description: 'Quando aprender este ritual, escolha um elemento entre Conhecimento, Energia, Morte e Sangue. Este ritual passa a ser do elemento escolhido. Você imbui a arma ou munições com o elemento, fazendo com que causem +1d6 de dano do tipo do elemento.',
    cost: 1,
    isWeaponBuff: true,
    effects: {
      base: {
        kind: 'buff',
        weaponEffect: { damageBonus: '1d6', damageType: 'conhecimento' },
        summary: 'Arma causa +1d6 de dano de Conhecimento.',
      },
      discente: {
        kind: 'buff',
        weaponEffect: { damageBonus: '2d6', damageType: 'conhecimento' },
        summary: 'Arma causa +2d6 de dano de Conhecimento.',
      },
      verdadeiro: {
        kind: 'buff',
        weaponEffect: { damageBonus: '4d6', damageType: 'conhecimento' },
        summary: 'Arma causa +4d6 de dano de Conhecimento.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o bônus de dano para +2d6.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o bônus de dano para +4d6.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'compreensao-paranormal',
    name: 'Compreensão Paranormal',
    circle: 1,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser ou objeto',
    duration: 'Cena',
    description: 'O ritual confere a você compreensão sobrenatural da linguagem. Se tocar um objeto contendo informação, você entende as palavras mesmo que não conheça seu idioma (idiomas humanos apenas). Se tocar uma pessoa, pode se comunicar com ela. Se tocar um ser não inteligente, pode perceber seus sentimentos básicos.',
    cost: 1,
    resistance: { type: 'vontade', effect: 'anula' },
    effects: {
      base: {
        kind: 'sense',
        senseEffect: { type: 'detect', information: 'idiomas e comunicação' },
        summary: 'Compreende idiomas humanos, comunica-se com seres tocados.',
      },
      discente: {
        kind: 'sense',
        summary: 'Alcance curto, afeta alvos escolhidos.',
      },
      verdadeiro: {
        kind: 'sense',
        summary: 'Fala, entende e escreve qualquer idioma humano.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o alcance para curto e o alvo para alvos escolhidos.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o alcance para pessoal e o alvo para você. Fala, entende e escreve qualquer idioma humano.', circleReq: 3 },
    ],
  },
  {
    id: 'enfeiticar',
    name: 'Enfeitiçar',
    circle: 1,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 pessoa',
    duration: 'Cena',
    description: 'Este ritual torna o alvo prestativo. Ele não fica sob seu controle, mas percebe suas palavras e ações da maneira mais favorável possível. Você recebe +10 em testes de Diplomacia com ele. Um alvo hostil ou em combate recebe +5 no teste de resistência.',
    cost: 1,
    resistance: { type: 'vontade', effect: 'anula' },
    effects: {
      base: {
        kind: 'control',
        mentalControl: { type: 'charm', canForceHarm: false, canForceSuicide: false },
        skillBonus: { skills: ['Diplomacia'], bonus: 10 },
        summary: 'Alvo fica prestativo, +10 Diplomacia.',
      },
      discente: {
        kind: 'control',
        mentalControl: { type: 'suggestion', canForceHarm: false, canForceSuicide: false },
        summary: 'Sugere uma ação aceitável ao alvo.',
      },
      verdadeiro: {
        kind: 'control',
        summary: 'Afeta todos os alvos dentro do alcance.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Você sugere uma ação para o alvo e ele obedece (ação deve parecer aceitável).', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Afeta todos os alvos dentro do alcance.', circleReq: 3 },
    ],
  },
  {
    id: 'ouvir-os-sussurros',
    name: 'Ouvir os Sussurros',
    circle: 1,
    element: 'conhecimento',
    execution: 'Completa',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Instantânea',
    description: 'O ritual conecta você com os sussurros, memórias ecoadas pelo Outro Lado. Faça uma pergunta sobre um evento que você está prestes a fazer (na mesma cena) que possa ser respondida com "sim" ou "não". O mestre rola 1d6 em segredo; com 2-6, funciona. Com 1, falha e oferece "não".',
    cost: 1,
    effects: {
      base: {
        kind: 'sense',
        senseEffect: { type: 'divination', information: 'sim/não sobre evento iminente' },
        summary: 'Pergunta sim/não sobre ação iminente (2-6 no d6 funciona).',
      },
      discente: {
        kind: 'sense',
        summary: 'Execução 1 minuto. Pergunta sobre evento até 1 dia no futuro.',
      },
      verdadeiro: {
        kind: 'sense',
        summary: 'Execução 10 minutos, duração 5 rodadas. Uma pergunta por rodada.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda execução para 1 minuto. Pergunta sobre evento até 1 dia no futuro.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda execução para 10 minutos e duração para 5 rodadas. Uma pergunta por rodada.', circleReq: 3 },
    ],
  },
  {
    id: 'perturbacao',
    name: 'Perturbação',
    circle: 1,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 pessoa',
    duration: 'Instantânea',
    description: 'Você dá uma ordem que o alvo deve ouvir. Se falhar na resistência, deve obedecer. Comandos: Fuja (afasta-se), Largue (solta itens), Pare (fica pasmo), Sente-se (senta no chão), Venha (aproxima-se de você).',
    cost: 1,
    resistance: { type: 'vontade', effect: 'anula' },
    hasModes: true,
    effects: {
      base: {
        kind: 'control',
        modes: [
          { name: 'Fuja', description: 'O alvo gasta seu turno tentando se afastar de você.' },
          { name: 'Largue', description: 'O alvo solta quaisquer itens que esteja segurando.' },
          { name: 'Pare', description: 'O alvo fica pasmo (não pode realizar ações, só reações).' },
          { name: 'Sente-se', description: 'O alvo se senta no chão.' },
          { name: 'Venha', description: 'O alvo gasta seu turno se aproximando de você.' },
        ],
        summary: 'Ordem mental: Fuja, Largue, Pare, Sente-se ou Venha.',
      },
      discente: {
        kind: 'damage',
        damage: { diceCount: 3, diceType: 8, damageType: 'conhecimento' },
        conditions: [{ id: 'abalado', duration: 1 }],
        summary: 'Alvo 1 ser. Comando "Sofra": 3d8 dano Conhecimento + abalado.',
      },
      verdadeiro: {
        kind: 'control',
        summary: 'Alvo até 5 seres OU comando "Ataque" (alvo ataca outro à sua escolha).',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda alvo para 1 ser. Adiciona comando "Sofra": 3d8 dano Conhecimento + abalado.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda alvo para até 5 seres OU adiciona comando "Ataque".', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'tecer-ilusao',
    name: 'Tecer Ilusão',
    circle: 1,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Médio',
    area: 'Até 4 cubos de 1,5m',
    duration: 'Cena',
    description: 'Cria uma ilusão visual (pessoa, parede) ou sonora (grito, uivo). Cria apenas imagens ou sons simples. Seres e objetos atravessam sem dano. A ilusão é dissipada se você sair do alcance.',
    cost: 1,
    resistance: { type: 'vontade', effect: 'anula' },
    effects: {
      base: {
        kind: 'utility',
        summary: 'Ilusão visual ou sonora simples em até 4 cubos de 1,5m.',
      },
      discente: {
        kind: 'utility',
        areaEffect: { shape: 'cubo', length: 8 },
        sustain: { action: 'free' },
        summary: 'Até 8 cubos, sustentada. Som e imagem combinados, sensações táteis.',
      },
      verdadeiro: {
        kind: 'damage',
        damage: { diceCount: 6, diceType: 6, damageType: 'conhecimento' },
        summary: 'Ilusão de perigo mortal. Alvo sofre 6d6 Conhecimento por rodada.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda efeito para 8 cubos, duração sustentada. Som+imagem, odores, sensações táteis.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Ilusão de perigo mortal. Alvo sofre 6d6 dano Conhecimento por rodada (Vontade anula).', circleReq: 3 },
    ],
  },
  {
    id: 'terceiro-olho',
    name: 'Terceiro Olho',
    circle: 1,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Seus olhos se enchem de sigilos e você passa a enxergar auras paranormais em alcance longo. Sabe o elemento da aura e seu poder aproximado (fraca, moderada ou poderosa). Pode descobrir se um ser tem poderes paranormais.',
    cost: 1,
    effects: {
      base: {
        kind: 'sense',
        senseEffect: { type: 'detect', targets: 'auras paranormais', information: 'elemento e poder' },
        summary: 'Enxerga auras paranormais em alcance longo.',
      },
      discente: {
        kind: 'sense',
        summary: 'Duração 1 dia.',
      },
      verdadeiro: {
        kind: 'sense',
        summary: 'Também enxerga objetos e seres invisíveis (formas translúcidas).',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda a duração para 1 dia.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Também enxerga objetos e seres invisíveis.', circleReq: 3 },
    ],
  },
];

// ========================================
// 1º CÍRCULO - ENERGIA
// ========================================

export const ENERGY_FIRST_CIRCLE: UnifiedRitual[] = [
  {
    id: 'amaldicoar-arma-energia',
    name: 'Amaldiçoar Arma',
    circle: 1,
    element: 'energia',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 arma corpo a corpo ou pacote de munição',
    duration: 'Cena',
    description: 'Quando aprender este ritual, escolha um elemento entre Conhecimento, Energia, Morte e Sangue. Este ritual passa a ser do elemento escolhido. Você imbui a arma ou munições com o elemento, fazendo com que causem +1d6 de dano do tipo do elemento.',
    cost: 1,
    isWeaponBuff: true,
    effects: {
      base: {
        kind: 'buff',
        weaponEffect: { damageBonus: '1d6', damageType: 'energia' },
        summary: 'Arma causa +1d6 de dano de Energia.',
      },
      discente: {
        kind: 'buff',
        weaponEffect: { damageBonus: '2d6', damageType: 'energia' },
        summary: 'Arma causa +2d6 de dano de Energia.',
      },
      verdadeiro: {
        kind: 'buff',
        weaponEffect: { damageBonus: '4d6', damageType: 'energia' },
        summary: 'Arma causa +4d6 de dano de Energia.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o bônus de dano para +2d6.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o bônus de dano para +4d6.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'amaldicoar-tecnologia',
    name: 'Amaldiçoar Tecnologia',
    circle: 1,
    element: 'energia',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 acessório ou arma de fogo',
    duration: 'Cena',
    description: 'Você imbui o alvo com Energia, fazendo-o funcionar acima de sua capacidade. O item recebe uma modificação a sua escolha.',
    cost: 1,
    effects: {
      base: {
        kind: 'buff',
        summary: 'Item recebe 1 modificação à sua escolha.',
      },
      discente: {
        kind: 'buff',
        summary: 'Item recebe 2 modificações.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: 'Item recebe 3 modificações.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda para duas modificações.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda para três modificações.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'coincidencia-forcada',
    name: 'Coincidência Forçada',
    circle: 1,
    element: 'energia',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser',
    duration: 'Cena',
    description: 'Você manipula os caminhos do caos para que o alvo tenha mais sorte. O alvo recebe +2 em testes de perícias.',
    cost: 1,
    effects: {
      base: {
        kind: 'buff',
        skillBonus: { skills: ['Todas'], bonus: 2 },
        summary: '+2 em testes de perícias.',
      },
      discente: {
        kind: 'buff',
        summary: 'Muda alvo para aliados à sua escolha.',
      },
      verdadeiro: {
        kind: 'buff',
        skillBonus: { skills: ['Todas'], bonus: 5 },
        summary: 'Aliados à sua escolha, bônus +5.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o alvo para aliados à sua escolha.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o alvo para aliados à sua escolha e o bônus para +5.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'eletrocussao',
    name: 'Eletrocussão',
    circle: 1,
    element: 'energia',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser ou objeto',
    duration: 'Instantânea',
    description: 'Você manifesta e dispara uma corrente elétrica contra o alvo, que sofre 3d6 pontos de dano de eletricidade e fica vulnerável por uma rodada. Se passar no teste de resistência, sofre apenas metade do dano e evita a condição. Contra objetos eletrônicos, causa o dobro de dano e ignora resistência.',
    cost: 1,
    resistance: { type: 'fortitude', effect: 'parcial' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 3, diceType: 6, damageType: 'energia' },
        conditions: [{ id: 'vulneravel', duration: 1 }],
        summary: '3d6 dano de eletricidade + vulnerável por 1 rodada.',
      },
      discente: {
        kind: 'damage',
        damage: { diceCount: 6, diceType: 6, damageType: 'energia' },
        areaEffect: { shape: 'linha', length: 30 },
        summary: 'Área: linha de 30m. 6d6 dano de Energia em todos na área.',
      },
      verdadeiro: {
        kind: 'damage',
        damage: { diceCount: 8, diceType: 6, damageType: 'energia' },
        summary: 'Alvos escolhidos. 8d6 dano de Energia em cada.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda alvo para área: linha de 30m. 6d6 dano de Energia.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda alvo para alvos escolhidos. 8d6 dano de Energia cada.', circleReq: 3 },
    ],
  },
  {
    id: 'embaralhar',
    name: 'Embaralhar',
    circle: 1,
    element: 'energia',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Você cria três cópias ilusórias suas, como hologramas extremamente realistas. Você recebe +6 na Defesa. Cada vez que um ataque erra, uma imagem desaparece e o bônus diminui em 2.',
    cost: 1,
    effects: {
      base: {
        kind: 'buff',
        defenseBonus: 6,
        summary: '+6 Defesa (3 cópias ilusórias). -2 a cada ataque errado.',
      },
      discente: {
        kind: 'buff',
        defenseBonus: 10,
        summary: '+10 Defesa (5 cópias ilusórias).',
      },
      verdadeiro: {
        kind: 'buff',
        defenseBonus: 16,
        conditions: [{ id: 'ofuscado', duration: 1 }],
        summary: '+16 Defesa (8 cópias). Cópias destruídas causam ofuscado.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda número de cópias para 5 (bônus +10 na Defesa).', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda para 8 cópias (+16 Defesa). Cópias destruídas emitem clarão (ofuscado).', circleReq: 3 },
    ],
  },
  {
    id: 'luz',
    name: 'Luz',
    circle: 1,
    element: 'energia',
    execution: 'Livre',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Você emite luz, iluminando a área ao redor. Luz transportada nunca fica invisível (mesmo que sua fonte esteja). Qualquer parte de um item carregado que se estenda além de seu alcance corpo a corpo natural se torna visível.',
    cost: 1,
    effects: {
      base: {
        kind: 'utility',
        summary: 'Emite luz, ilumina área ao redor. Luz transportada nunca fica invisível.',
      },
      discente: {
        kind: 'buff',
        areaEffect: { shape: 'esfera', radius: 3 },
        sustain: { action: 'free' },
        summary: 'Duração sustentada. Gera esfera de invisibilidade 3m (você e aliados dentro).',
      },
      verdadeiro: {
        kind: 'buff',
        sustain: { action: 'free' },
        summary: 'Execução padrão, alcance toque, 1 ser, sustentada. Ataque não dissipa a invisibilidade.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Muda a duração para sustentada. Em vez do normal, gera esfera de invisibilidade 3m (você e aliados dentro se tornam invisíveis).', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Muda execução para padrão, alcance para toque, alvo para 1 ser, duração para sustentada. Ataque não dissipa a invisibilidade.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'polarizacao-caotica',
    name: 'Polarização Caótica',
    circle: 1,
    element: 'energia',
    execution: 'Padrão',
    range: 'Curto',
    target: 'Você',
    duration: 'Sustentada',
    description: 'Você gera uma aura magnética sobrenatural. Atrair: puxa objeto metálico de espaço 2 ou menor. Repelir: resistência a balístico, corte, impacto e perfuração 5.',
    cost: 1,
    resistance: { type: 'vontade', effect: 'anula' },
    isSustainable: true,
    hasModes: true,
    effects: {
      base: {
        kind: 'utility',
        modes: [
          { name: 'Atrair', description: 'Ação de movimento para puxar objeto metálico de espaço 2 ou menor.' },
          { name: 'Repelir', description: 'Resistência a balístico, corte, impacto e perfuração 5.' },
        ],
        summary: 'Aura magnética: Atrair objetos ou Repelir (RD 5 físico).',
      },
      discente: {
        kind: 'damage',
        damage: { diceCount: 1, diceType: 6, bonus: 0 },
        summary: 'Instantânea. Arremessa até 10 objetos/espaços causando dano de impacto.',
      },
      verdadeiro: {
        kind: 'control',
        summary: 'Alcance médio, instantânea. Levita e move ser/objeto de espaço 10 ou menor por 9m.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Duração instantânea. Arremessa até 10 objetos/espaços causando dano de impacto.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Alcance médio, instantânea. Levita e move ser/objeto de espaço 10 por 9m.', circleReq: 3 },
    ],
  },
];

// ========================================
// 1º CÍRCULO - MEDO
// ========================================

export const FEAR_FIRST_CIRCLE: UnifiedRitual[] = [
  {
    id: 'cineraria',
    name: 'Cinerária',
    circle: 1,
    element: 'medo',
    execution: 'Padrão',
    range: 'Curto',
    area: 'Nuvem de 6m de raio',
    duration: 'Cena',
    description: 'Você manifesta uma névoa carregada de essência paranormal. Rituais conjurados dentro da névoa têm sua DT aumentada em +5.',
    cost: 1,
    effects: {
      base: {
        kind: 'utility',
        areaEffect: { shape: 'esfera', radius: 6 },
        summary: 'Névoa de 6m. Rituais dentro têm DT +5.',
      },
      discente: {
        kind: 'utility',
        summary: 'Além do normal, rituais dentro da névoa custam –2 PE.',
      },
      verdadeiro: {
        kind: 'utility',
        summary: 'Além do normal, rituais dentro da névoa causam dano maximizado.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Além do normal, rituais dentro da névoa custam –2 PE.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Além do normal, rituais dentro da névoa causam dano maximizado.', circleReq: 3 },
    ],
  },
];

// ========================================
// 1º CÍRCULO - MORTE
// ========================================

export const DEATH_FIRST_CIRCLE: UnifiedRitual[] = [
  {
    id: 'amaldicoar-arma-morte',
    name: 'Amaldiçoar Arma',
    circle: 1,
    element: 'morte',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 arma corpo a corpo ou pacote de munição',
    duration: 'Cena',
    description: 'Quando aprender este ritual, escolha um elemento entre Conhecimento, Energia, Morte e Sangue. Este ritual passa a ser do elemento escolhido. Você imbui a arma ou munições com o elemento, fazendo com que causem +1d6 de dano do tipo do elemento.',
    cost: 1,
    isWeaponBuff: true,
    effects: {
      base: {
        kind: 'buff',
        weaponEffect: { damageBonus: '1d6', damageType: 'morte' },
        summary: 'Arma causa +1d6 de dano de Morte.',
      },
      discente: {
        kind: 'buff',
        weaponEffect: { damageBonus: '2d6', damageType: 'morte' },
        summary: 'Arma causa +2d6 de dano de Morte.',
      },
      verdadeiro: {
        kind: 'buff',
        weaponEffect: { damageBonus: '4d6', damageType: 'morte' },
        summary: 'Arma causa +4d6 de dano de Morte.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o bônus de dano para +2d6.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o bônus de dano para +4d6.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'cicatrizacao',
    name: 'Cicatrização',
    circle: 1,
    element: 'morte',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Instantânea',
    description: 'Você acelera o tempo ao redor das feridas do alvo, que cicatrizam instantaneamente. O alvo recupera 3d8+3 PV, mas envelhece 1 ano automaticamente.',
    cost: 1,
    effects: {
      base: {
        kind: 'healing',
        healing: { diceCount: 3, diceType: 8, bonus: 3 },
        summary: 'Cura 3d8+3 PV. Alvo envelhece 1 ano.',
      },
      discente: {
        kind: 'healing',
        healing: { diceCount: 5, diceType: 8, bonus: 5 },
        summary: 'Cura 5d8+5 PV.',
      },
      verdadeiro: {
        kind: 'healing',
        healing: { diceCount: 7, diceType: 8, bonus: 7 },
        summary: 'Alcance curto, seres escolhidos. Cura 7d8+7 PV.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Aumenta a cura para 5d8+5 PV.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 9, description: 'Muda alcance para curto, alvo para seres escolhidos. Cura 7d8+7 PV.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'consumir-manancial',
    name: 'Consumir Manancial',
    circle: 1,
    element: 'morte',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Instantânea',
    description: 'Você suga uma pequena porção do tempo de vida de plantas, insetos e até mesmo do solo ao redor, gerando Lodo e recebendo 3d6 pontos de vida temporários. Os PV temporários desaparecem ao final da cena.',
    cost: 1,
    effects: {
      base: {
        kind: 'buff',
        tempHP: { diceCount: 3, diceType: 6 },
        summary: 'Recebe 3d6 PV temporários (até fim da cena).',
      },
      discente: {
        kind: 'buff',
        tempHP: { diceCount: 6, diceType: 6 },
        summary: 'Recebe 6d6 PV temporários.',
      },
      verdadeiro: {
        kind: 'damage',
        damage: { diceCount: 3, diceType: 6, damageType: 'morte' },
        areaEffect: { shape: 'esfera', radius: 6 },
        summary: 'Área 6m. 3d6 dano de Morte em todos. PV temporários = dano total.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda os PV temporários para 6d6.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Área 6m. 3d6 dano Morte em todos. PV temporários = dano total.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'decadencia',
    name: 'Decadência',
    circle: 1,
    element: 'morte',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Instantânea',
    description: 'Espirais de trevas envolvem sua mão e definham o alvo, que sofre 2d8+2 pontos de dano de Morte.',
    cost: 1,
    resistance: { type: 'fortitude', effect: 'reduz_metade' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 2, diceType: 8, bonus: 2, damageType: 'morte' },
        summary: '2d8+2 dano de Morte.',
      },
      discente: {
        kind: 'damage',
        damage: { diceCount: 3, diceType: 8, bonus: 3, damageType: 'morte' },
        summary: 'Sem resistência, 3d8+3 dano. Pode combinar com ataque corpo a corpo.',
      },
      verdadeiro: {
        kind: 'damage',
        damage: { diceCount: 8, diceType: 8, bonus: 8, damageType: 'morte' },
        areaEffect: { shape: 'esfera', radius: 6 },
        summary: 'Área 6m. 8d8+8 dano de Morte em todos.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Sem resistência. 3d8+3 dano. Pode combinar com ataque corpo a corpo.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Área 6m de raio. 8d8+8 dano de Morte em todos na área.', circleReq: 3 },
    ],
  },
  {
    id: 'definhar',
    name: 'Definhar',
    circle: 1,
    element: 'morte',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser',
    duration: 'Cena',
    description: 'Você dispara uma lufada de cinzas que drena as forças do alvo. O alvo fica fatigado. Se passar no teste de resistência, fica vulnerável.',
    cost: 1,
    resistance: { type: 'fortitude', effect: 'parcial' },
    effects: {
      base: {
        kind: 'debuff',
        conditions: [{ id: 'fatigado', duration: 'cena' }],
        summary: 'Alvo fica fatigado (ou vulnerável se passar).',
      },
      discente: {
        kind: 'debuff',
        conditions: [{ id: 'exausto', duration: 'cena' }],
        summary: 'Alvo fica exausto (ou fatigado se passar).',
      },
      verdadeiro: {
        kind: 'debuff',
        summary: 'Como discente, mas alvo até 5 seres.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Alvo fica exausto (fatigado se passar).', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Como discente, mas alvo até 5 seres.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'espirais-da-perdicao',
    name: 'Espirais da Perdição',
    circle: 1,
    element: 'morte',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser',
    duration: 'Cena',
    description: 'Espirais surgem no corpo do alvo, tornando seus movimentos lentos. O alvo sofre –1d20 em testes de ataque.',
    cost: 1,
    effects: {
      base: {
        kind: 'debuff',
        summary: 'Alvo sofre –1d20 em testes de ataque.',
      },
      discente: {
        kind: 'debuff',
        summary: 'Penalidade muda para –2d20.',
      },
      verdadeiro: {
        kind: 'debuff',
        summary: 'Penalidade –2d20, alvo seres escolhidos.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda a penalidade para –2d20.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 8, description: 'Penalidade –2d20, alvo seres escolhidos.', circleReq: 3 },
    ],
  },
  {
    id: 'nuvem-de-cinzas',
    name: 'Nuvem de Cinzas',
    circle: 1,
    element: 'morte',
    execution: 'Padrão',
    range: 'Curto',
    area: 'Nuvem com 6m de raio e 6m de altura',
    duration: 'Cena',
    description: 'Uma nuvem de fuligem espessa eleva-se de um ponto a sua escolha, obscurecendo toda a visão — seres a até 1,5m têm camuflagem leve e seres a partir de 3m têm camuflagem total.',
    cost: 1,
    effects: {
      base: {
        kind: 'utility',
        areaEffect: { shape: 'cilindro', radius: 6, length: 6 },
        summary: 'Nuvem 6m. Camuflagem leve (1,5m) ou total (3m+).',
      },
      discente: {
        kind: 'utility',
        summary: 'Seres escolhidos enxergam através do efeito.',
      },
      verdadeiro: {
        kind: 'debuff',
        summary: 'Nuvem espessa: deslocamento 3m, –2 em testes de ataque.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Seres escolhidos enxergam através do efeito.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Nuvem espessa: deslocamento 3m, –2 em testes de ataque.', circleReq: 3 },
    ],
  },
];

// ========================================
// 1º CÍRCULO - SANGUE
// ========================================

export const BLOOD_FIRST_CIRCLE: UnifiedRitual[] = [
  {
    id: 'amaldicoar-arma-sangue',
    name: 'Amaldiçoar Arma',
    circle: 1,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 arma corpo a corpo ou pacote de munição',
    duration: 'Cena',
    description: 'Quando aprender este ritual, escolha um elemento entre Conhecimento, Energia, Morte e Sangue. Este ritual passa a ser do elemento escolhido. Você imbui a arma ou munições com o elemento, fazendo com que causem +1d6 de dano do tipo do elemento.',
    cost: 1,
    isWeaponBuff: true,
    effects: {
      base: {
        kind: 'buff',
        weaponEffect: { damageBonus: '1d6', damageType: 'sangue' },
        summary: 'Arma causa +1d6 de dano de Sangue.',
      },
      discente: {
        kind: 'buff',
        weaponEffect: { damageBonus: '2d6', damageType: 'sangue' },
        summary: 'Arma causa +2d6 de dano de Sangue.',
      },
      verdadeiro: {
        kind: 'buff',
        weaponEffect: { damageBonus: '4d6', damageType: 'sangue' },
        summary: 'Arma causa +4d6 de dano de Sangue.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o bônus de dano para +2d6.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o bônus de dano para +4d6.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'arma-atroz',
    name: 'Arma Atroz',
    circle: 1,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 arma corpo a corpo',
    duration: 'Sustentada',
    description: 'A arma é recoberta por veias carmesim e passa a exalar uma aura de violência. Ela fornece +2 em testes de ataque e +1 na margem de ameaça.',
    cost: 1,
    isWeaponBuff: true,
    isSustainable: true,
    effects: {
      base: {
        kind: 'buff',
        weaponEffect: { attackBonus: 2, criticalBonus: 1 },
        summary: '+2 em testes de ataque, +1 na margem de ameaça.',
      },
      discente: {
        kind: 'buff',
        weaponEffect: { attackBonus: 5, criticalBonus: 1 },
        summary: '+5 em testes de ataque.',
      },
      verdadeiro: {
        kind: 'buff',
        weaponEffect: { attackBonus: 5, criticalBonus: 2, criticalMultiplierBonus: 1 },
        summary: '+5 ataque, +2 margem de ameaça, +1 multiplicador de crítico.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o bônus para +5 em testes de ataque.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda para +5 ataque, +2 margem de ameaça e +1 multiplicador de crítico.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'armadura-de-sangue',
    name: 'Armadura de Sangue',
    circle: 1,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Seu sangue escorre para fora do corpo, cobrindo-o sob a forma de uma carapaça que fornece +5 em Defesa. Esse bônus é cumulativo com outros rituais, mas não com equipamento.',
    cost: 1,
    effects: {
      base: {
        kind: 'buff',
        defenseBonus: 5,
        summary: '+5 Defesa (cumulativo com rituais, não equipamento).',
      },
      discente: {
        kind: 'buff',
        defenseBonus: 10,
        damageReduction: { amount: 5, types: ['balístico', 'corte', 'impacto', 'perfuração'] },
        summary: '+10 Defesa e resistência 5 a dano físico.',
      },
      verdadeiro: {
        kind: 'buff',
        defenseBonus: 15,
        damageReduction: { amount: 10, types: ['balístico', 'corte', 'impacto', 'perfuração'] },
        summary: '+15 Defesa e resistência 10 a dano físico.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 5, description: 'Fornece +10 na Defesa e resistência a dano físico 5.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 9, description: 'Fornece +15 na Defesa e resistência a dano físico 10.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'corpo-adaptado',
    name: 'Corpo Adaptado',
    circle: 1,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 pessoa ou animal',
    duration: 'Cena',
    description: 'Este ritual modifica a biologia do alvo para permitir a sobrevivência em ambientes hostis. O alvo fica imune a calor e frio extremos, pode respirar na água se respirar ar (ou vice-versa) e não sufoca em fumaça densa.',
    cost: 1,
    effects: {
      base: {
        kind: 'buff',
        summary: 'Imune a calor/frio extremos, respira água/ar, não sufoca em fumaça.',
      },
      discente: {
        kind: 'buff',
        summary: 'Duração 1 dia.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: 'Alcance curto, pessoas ou animais escolhidos.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda a duração para 1 dia.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda alcance para curto e alvo para pessoas ou animais escolhidos.', circleReq: 3 },
    ],
  },
  {
    id: 'distorcer-aparencia',
    name: 'Distorcer Aparência',
    circle: 1,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Você modifica sua aparência de modo a parecer outra pessoa. Isso inclui altura, peso, tom de pele, cor de cabelo, timbre de voz, impressão digital, córnea etc. Você recebe +10 em testes de Enganação para disfarce.',
    cost: 1,
    resistance: { type: 'vontade', effect: 'anula' },
    effects: {
      base: {
        kind: 'buff',
        skillBonus: { skills: ['Enganação'], bonus: 10, context: 'disfarce' },
        summary: 'Muda aparência. +10 Enganação para disfarce.',
      },
      discente: {
        kind: 'buff',
        summary: 'Alcance curto, 1 ser. Alvo involuntário pode resistir.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: 'Como discente, mas alvo seres escolhidos.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda alcance para curto e alvo para 1 ser.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Como discente, mas alvo seres escolhidos.', circleReq: 3 },
    ],
  },
  {
    id: 'fortalecimento-sensorial',
    name: 'Fortalecimento Sensorial',
    circle: 1,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Você potencializa seus sentidos, recebendo +1d20 em Investigação, Luta, Percepção e Pontaria.',
    cost: 1,
    effects: {
      base: {
        kind: 'buff',
        skillBonus: { skills: ['Investigação', 'Luta', 'Percepção', 'Pontaria'], bonus: 0 },
        summary: '+1d20 em Investigação, Luta, Percepção e Pontaria.',
      },
      discente: {
        kind: 'buff',
        summary: 'Além do normal, inimigos sofrem –1d20 em ataques contra você.',
      },
      verdadeiro: {
        kind: 'buff',
        defenseBonus: 10,
        resistanceBonus: 10,
        summary: 'Imune a surpreendido/desprevenido. +10 Defesa e Reflexos.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Além do normal, inimigos sofrem –1d20 em ataques contra você.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Imune a surpreendido/desprevenido. +10 Defesa e Reflexos.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'odio-incontrolavel',
    name: 'Ódio Incontrolável',
    circle: 1,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 pessoa',
    duration: 'Cena',
    description: 'O alvo entra em um frenesi, aumentando sua agressividade e capacidade de luta. Recebe +2 em testes de ataque e rolagens de dano corpo a corpo e resistência a dano físico 5. Não pode fazer ações que exigem calma e deve sempre atacar.',
    cost: 1,
    effects: {
      base: {
        kind: 'buff',
        attackBonus: 2,
        damageBonus: 2,
        damageReduction: { amount: 5, types: ['balístico', 'corte', 'impacto', 'perfuração'] },
        summary: '+2 ataque/dano corpo a corpo, RD 5 físico. Deve atacar sempre.',
      },
      discente: {
        kind: 'buff',
        summary: 'Além do normal, pode fazer ataque corpo a corpo adicional.',
      },
      verdadeiro: {
        kind: 'buff',
        attackBonus: 5,
        damageBonus: 5,
        summary: '+5 ataque/dano. Sofre metade do dano físico.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Além do normal, pode fazer ataque corpo a corpo adicional.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda bônus para +5 e alvo sofre metade do dano físico.', circleReq: 3, affinityReq: true },
    ],
  },
];

// ========================================
// EXPORTAÇÃO COMBINADA
// ========================================

export const FIRST_CIRCLE_RITUALS: UnifiedRitual[] = [
  ...KNOWLEDGE_FIRST_CIRCLE,
  ...ENERGY_FIRST_CIRCLE,
  ...FEAR_FIRST_CIRCLE,
  ...DEATH_FIRST_CIRCLE,
  ...BLOOD_FIRST_CIRCLE,
];
