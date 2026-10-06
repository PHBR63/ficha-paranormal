/**
 * Ordem Paranormal RPG - Rituais de 2º Círculo (Oficiais)
 * Baseado no Livro Base v1.3
 * Tabela5.2, p.119: custo básico de 2º círculo = 3 PE.
 */

import type { UnifiedRitual } from './types';

// ========================================
// 2º CÍRCULO - CONHECIMENTO (5 rituais)
// ========================================

export const KNOWLEDGE_SECOND_CIRCLE: UnifiedRitual[] = [
  {
    id: 'aprimorar-mente',
    name: 'Aprimorar Mente',
    circle: 2,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Cena',
    description: 'O alvo tem sua mente energizada por fagulhos do Conhecimento. Ele recebe +1 em Intelecto ou Presença, à escolha dele.',
    cost: 3,
    effects: {
      base: {
        kind: 'buff',
        summary: '+1 em Intelecto ou Presença (escolha ao conjurar).',
      },
      discente: {
        kind: 'buff',
        summary: '+2 em Intelecto ou Presença.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: '+3 em Intelecto ou Presença.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Muda bônus para +2.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Muda bônus para +3.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'deteccao-de-ameacas',
    name: 'Detecção de Ameaças',
    circle: 2,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Pessoal',
    area: 'Esfera de 18m de raio',
    duration: 'Cena',
    description: 'Você recebe uma percepção aguçada sobre perigos à sua volta. Quando um ser hostil ou armadilha entra na área do efeito, você tem uma sensação de perigo e pode gastar uma ação de movimento para fazer um teste de Percepção (DT 20). Se passar, sabe a direção e distância do perigo.',
    cost: 3,
    effects: {
      base: {
        kind: 'sense',
        senseEffect: { type: 'detect', range: 18, targets: 'perigos e armadilhas', information: 'direção e distância' },
        summary: 'Sente perigos em 18m. Pode identificar direção/distância.',
      },
      discente: {
        kind: 'sense',
        summary: 'Não fica desprevenido contra perigos detectados. +5 em resistência vs armadilhas.',
      },
      verdadeiro: {
        kind: 'sense',
        summary: 'Duração de 1 dia.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Não fica desprevenido contra perigos detectados, +5 resistência vs armadilhas.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 5, description: 'Duração 1 dia.', circleReq: 4 },
    ],
  },
  {
    id: 'esconder-dos-olhos',
    name: 'Esconder dos Olhos',
    circle: 2,
    element: 'conhecimento',
    execution: 'Livre',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Você fica invisível, incluindo seu equipamento, recebendo camuflagem total e +15 em testes de Furtividade. O efeito termina se você faz um ataque ou usa uma habilidade hostil.',
    cost: 3,
    effects: {
      base: {
        kind: 'buff',
        skillBonus: { skills: ['Furtividade'], bonus: 15 },
        summary: 'Invisível. +15 Furtividade. Ação hostil encerra.',
      },
      discente: {
        kind: 'buff',
        areaEffect: { shape: 'esfera', radius: 3 },
        sustain: { action: 'free' },
        summary: 'Sustentada. Esfera de invisibilidade 3m (você e aliados).',
      },
      verdadeiro: {
        kind: 'buff',
        sustain: { action: 'free' },
        summary: 'Toque, 1 ser, sustentada. Ataque não dissipa a invisibilidade.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Duração sustentada. Esfera de invisibilidade 3m (você e aliados).', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Ação padrão, toque, 1 ser, sustentada. Ataque não dissipa.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'invadir-mente',
    name: 'Invadir Mente',
    circle: 2,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Médio',
    target: '1 ser ou 2 pessoas voluntárias',
    duration: 'Instantânea',
    description: 'Rajada Mental: 6d6 dano de Conhecimento e atordoado (Vontade metade e não atordoa). Ligação Telepática: elo mental entre duas pessoas por 1 dia.',
    cost: 3,
    resistance: { type: 'vontade', effect: 'parcial' },
    hasModes: true,
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 6, diceType: 6, damageType: 'conhecimento' },
        conditions: [{ id: 'atordoado', duration: 1 }],
        modes: [
          { name: 'Rajada Mental', description: '6d6 dano Conhecimento + atordoado' },
          { name: 'Ligação Telepática', description: 'Elo mental entre 2 pessoas por 1 dia' },
        ],
        summary: 'Rajada: 6d6 dano Conhecimento + atordoado. OU Ligação telepática.',
      },
      discente: {
        kind: 'damage',
        damage: { diceCount: 10, diceType: 6, damageType: 'conhecimento' },
        summary: 'Rajada 10d6. Ligação permite ver pelos sentidos do alvo.',
      },
      verdadeiro: {
        kind: 'damage',
        summary: 'Rajada 10d6 em seres escolhidos. Ligação até 5 pessoas.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Rajada 10d6. Ligação permite ver pelos sentidos do alvo.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Rajada 10d6 em seres escolhidos. Ligação até 5 pessoas.', circleReq: 4 },
    ],
  },
  {
    id: 'localizacao',
    name: 'Localização',
    circle: 2,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Pessoal',
    area: 'Círculo com 90m de raio',
    duration: 'Cena',
    description: 'Encontra direção/distância de pessoa ou objeto. Pode pensar em termos gerais ou específicos.',
    cost: 3,
    effects: {
      base: {
        kind: 'sense',
        senseEffect: { type: 'locate', range: 90, information: 'direção e distância' },
        summary: 'Localiza pessoa ou objeto em 90m.',
      },
      discente: {
        kind: 'sense',
        summary: 'Toque, 1 pessoa, 1 hora. Encontra caminho/rota em lugar.',
      },
      verdadeiro: {
        kind: 'sense',
        senseEffect: { type: 'locate', range: 1000 },
        summary: 'Área de 1km de raio.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Toque, 1 pessoa, 1 hora. Encontra caminho/rota em lugar.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Área 1km raio.', circleReq: 4 },
    ],
  },
];

// ========================================
// 2º CÍRCULO - ENERGIA (5 rituais)
// ========================================

export const ENERGY_SECOND_CIRCLE: UnifiedRitual[] = [
  {
    id: 'chamas-do-caos',
    name: 'Chamas do Caos',
    circle: 2,
    element: 'energia',
    execution: 'Padrão',
    range: 'Curto',
    target: 'Veja texto',
    duration: 'Cena',
    description: 'Manipula calor e fogo. Chamejar: +1d6 dano fogo em arma. Esquentar: objeto causa 1d6 dano/rodada. Extinguir: apaga chama, cria fumaça. Modelar: move chama, causa 3d6 ao atravessar.',
    cost: 3,
    hasModes: true,
    effects: {
      base: {
        kind: 'utility',
        modes: [
          { name: 'Chamejar', description: '+1d6 dano de fogo em arma' },
          { name: 'Esquentar', description: 'Objeto causa 1d6 dano/rodada' },
          { name: 'Extinguir', description: 'Apaga chama, cria fumaça' },
          { name: 'Modelar', description: 'Move chama, causa 3d6 ao atravessar' },
        ],
        summary: 'Controla fogo com vários efeitos.',
      },
      discente: {
        kind: 'damage',
        damage: { diceCount: 4, diceType: 6, damageType: 'energia' },
        sustain: { action: 'movement' },
        summary: 'Sustentada. Pode projetar labareda (4d6 dano Energia).',
      },
      verdadeiro: {
        kind: 'damage',
        damage: { diceCount: 8, diceType: 6, damageType: 'energia' },
        summary: 'Labareda causa 8d6.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Duração sustentada. Pode projetar labareda (4d6 dano Energia).', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Labareda causa 8d6.', circleReq: 3 },
    ],
  },
  {
    id: 'contencao-fantasmagorica',
    name: 'Contenção Fantasmagórica',
    circle: 2,
    element: 'energia',
    execution: 'Padrão',
    range: 'Médio',
    target: '1 ser',
    duration: 'Cena',
    description: 'Três laços de Energia surgem e prendem o alvo (agarrado). Pode tentar quebrar com Atletismo ou destruir: cada laço tem Def 10, 10 PV, RD 5.',
    cost: 3,
    resistance: { type: 'reflexos', effect: 'anula' },
    effects: {
      base: {
        kind: 'control',
        conditions: [{ id: 'agarrado', duration: 'cena' }],
        summary: '3 laços prendem o alvo (agarrado). Laços: Def 10, 10 PV, RD 5.',
      },
      discente: {
        kind: 'control',
        summary: '6 laços. Pode dividir entre múltiplos alvos.',
      },
      verdadeiro: {
        kind: 'control',
        damage: { diceCount: 2, diceType: 6, bonus: 2, damageType: 'energia' },
        summary: 'Laços destruídos explodem (2d6+2 dano Energia).',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: '6 laços, pode escolher múltiplos alvos.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 5, description: 'Laços destruídos explodem (2d6+2 dano Energia).', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'dissonancia-acustica',
    name: 'Dissonância Acústica',
    circle: 2,
    element: 'energia',
    execution: 'Padrão',
    range: 'Médio',
    area: 'Esfera com 6m de raio',
    duration: 'Sustentada',
    description: 'Cria área de dissonância sonora. Seres dentro ficam surdos e não podem conjurar rituais.',
    cost: 3,
    isSustainable: true,
    effects: {
      base: {
        kind: 'debuff',
        conditions: [{ id: 'surdo', duration: 'sustentado' }],
        areaEffect: { shape: 'esfera', radius: 6 },
        summary: 'Seres na área ficam surdos. Impede conjuração de rituais.',
      },
      discente: {
        kind: 'utility',
        summary: 'Alvo objeto. Emana silêncio em 3m de raio.',
      },
      verdadeiro: {
        kind: 'utility',
        summary: 'Duração cena. Som não sai da área, mas funciona dentro.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 1, description: 'Muda para alvo objeto. Emana silêncio 3m raio.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 3, description: 'Muda duração para cena. Som não sai da área.', circleReq: 3 },
    ],
  },
  {
    id: 'sopro-do-caos',
    name: 'Sopro do Caos',
    circle: 2,
    element: 'energia',
    execution: 'Padrão',
    range: 'Médio',
    area: 'Varia',
    duration: 'Sustentada',
    description: 'Ascender: levita alvo Médio (vulnerável). Sopro: empurra em cone 4,5m. Vento: cria/aumenta vento forte.',
    cost: 3,
    isSustainable: true,
    hasModes: true,
    effects: {
      base: {
        kind: 'control',
        modes: [
          { name: 'Ascender', description: 'Levita alvo Médio (fica vulnerável). Sobe/desce 6m/rodada.' },
          { name: 'Sopro', description: 'Empurra alvos Médios ou menores em cone de 4,5m.' },
          { name: 'Vento', description: 'Cria ou aumenta efeito de vento em um passo.' },
        ],
        summary: 'Controla ar/vento com vários efeitos.',
      },
      discente: {
        kind: 'control',
        summary: 'Afeta alvos Grandes.',
      },
      verdadeiro: {
        kind: 'control',
        summary: 'Afeta alvos Enormes.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Afeta alvos Grandes.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 9, description: 'Afeta alvos Enormes.', circleReq: 4 },
    ],
  },
  {
    id: 'tela-de-ruido',
    name: 'Tela de Ruído',
    circle: 2,
    element: 'energia',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Cria película de Energia que absorve energia cinética. Recebe 30 PV temporários contra dano físico. Alternativamente, conjura como reação para resistência 15 contra um dano.',
    cost: 3,
    effects: {
      base: {
        kind: 'buff',
        tempHP: { diceCount: 0, diceType: 6, bonus: 30 },
        summary: '30 PV temporários contra dano físico OU RD 15 como reação.',
      },
      discente: {
        kind: 'buff',
        tempHP: { diceCount: 0, diceType: 6, bonus: 60 },
        summary: '60 PV temporários, RD 30.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: 'Alcance curto, 1 ser ou objeto Enorme. Esfera imóvel que bloqueia tudo.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: '60 PV temporários, RD 30.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Alcance curto, esfera imóvel que bloqueia tudo.', circleReq: 4 },
    ],
  },
];

// ========================================
// 2º CÍRCULO - MEDO (2 rituais)
// ========================================

export const FEAR_SECOND_CIRCLE: UnifiedRitual[] = [
  {
    id: 'protecao-contra-rituais',
    name: 'Proteção contra Rituais',
    circle: 2,
    element: 'medo',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Cena',
    description: 'Você canaliza uma aura de Medo puro, que protege o alvo contra efeitos paranormais. O alvo recebe resistência a dano paranormal 5 e +5 em testes de resistência contra rituais e habilidades de criaturas paranormais.',
    cost: 3,
    effects: {
      base: {
        kind: 'buff',
        damageReduction: { types: ['energia', 'sangue', 'morte', 'conhecimento', 'medo'], amount: 5 },
        resistanceBonus: 5,
        summary: 'RD 5 contra dano paranormal. +5 em resistência vs rituais/criaturas.',
      },
      discente: {
        kind: 'buff',
        summary: 'Afeta até 5 seres tocados.',
      },
      verdadeiro: {
        kind: 'buff',
        damageReduction: { types: ['energia', 'sangue', 'morte', 'conhecimento', 'medo'], amount: 10 },
        resistanceBonus: 10,
        summary: 'Até 5 seres. RD 10, +10 em resistência.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Muda o alvo para até 5 seres tocados.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 6, description: 'Muda para até 5 seres, RD 10 e +10 em resistência.', circleReq: 4 },
    ],
  },
  {
    id: 'rejeitar-nevoa',
    name: 'Rejeitar Névoa',
    circle: 2,
    element: 'medo',
    execution: 'Padrão',
    range: 'Curto',
    area: 'Nuvem de 6m de raio',
    duration: 'Cena',
    description: 'Rituais conjurados dentro da área têm seu custo aumentado em +2 PE por círculo e sua execução aumentada em um passo. Anula os efeitos de Cinerária.',
    cost: 3,
    effects: {
      base: {
        kind: 'debuff',
        areaEffect: { shape: 'esfera', radius: 6 },
        summary: 'Rituais na área custam +2 PE por círculo, execução +1 passo. Anula Cinerária.',
      },
      discente: {
        kind: 'debuff',
        summary: 'Além do normal, DT de rituais na área diminui em -5.',
      },
      verdadeiro: {
        kind: 'debuff',
        summary: 'Como discente, e dano de rituais na névoa é sempre mínimo.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Além do normal, DT de rituais na área diminui em -5.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 5, description: 'Como discente, e dano de rituais na névoa é sempre mínimo.', circleReq: 3 },
    ],
  },
];

// ========================================
// 2º CÍRCULO - MORTE (5 rituais)
// ========================================

export const DEATH_SECOND_CIRCLE: UnifiedRitual[] = [
  {
    id: 'desacelerar-impacto',
    name: 'Desacelerar Impacto',
    circle: 2,
    element: 'morte',
    execution: 'Reação',
    range: 'Curto',
    target: '1 ser ou objetos somando até 10 espaços',
    duration: 'Especial',
    description: 'O alvo cai lentamente (18m/rodada) sem causar dano. Se o alvo for um projétil, causa metade do dano normal.',
    cost: 3,
    effects: {
      base: {
        kind: 'interceptor',
        summary: 'Alvo cai lentamente (18m/rodada) sem dano. Projéteis causam metade do dano.',
      },
      verdadeiro: {
        kind: 'interceptor',
        summary: 'Aumenta para seres/objetos somando até 100 espaços.',
      },
    },
    enhancements: [
      { name: 'Verdadeiro', cost: 3, description: 'Aumenta para seres/objetos somando até 100 espaços.', circleReq: 3 },
    ],
  },
  {
    id: 'eco-espiral',
    name: 'Eco Espiral',
    circle: 2,
    element: 'morte',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser',
    duration: '2 rodadas',
    description: 'Manifesta cópia do alvo feita de cinzas. No 1º turno concentra, no 2º descarrega: alvo sofre dano de Morte igual ao dano que sofreu na rodada de concentração.',
    cost: 3,
    resistance: { type: 'fortitude', effect: 'reduz_metade' },
    effects: {
      base: {
        kind: 'damage',
        summary: 'Concentra 1 rodada, descarrega na 2ª. Dano = dano sofrido pelo alvo na rodada de concentração.',
      },
      discente: {
        kind: 'damage',
        summary: 'Alvo até 5 seres.',
      },
      verdadeiro: {
        kind: 'damage',
        summary: 'Duração 3 rodadas. Pode concentrar nas duas primeiras e descarregar na terceira.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Muda alvo para até 5 seres.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Duração 3 rodadas.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'miasma-entropico',
    name: 'Miasma Entrópico',
    circle: 2,
    element: 'morte',
    execution: 'Padrão',
    range: 'Médio',
    area: 'Nuvem com 6m de raio',
    duration: 'Instantânea',
    description: 'Cria explosão de emanações tóxicas. Seres na área sofrem 4d8 pontos de dano químico e ficam enjoados por 1 rodada. Se passarem na resistência, sofrem metade do dano e não ficam enjoados.',
    cost: 3,
    resistance: { type: 'fortitude', effect: 'parcial' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 4, diceType: 8, damageType: 'químico' },
        conditions: [{ id: 'enjoado', duration: 1 }],
        areaEffect: { shape: 'esfera', radius: 6 },
        summary: '4d8 dano químico + enjoado por 1 rodada.',
      },
      discente: {
        kind: 'damage',
        damage: { diceCount: 6, diceType: 8, damageType: 'morte' },
        summary: '6d8 dano de Morte.',
      },
      verdadeiro: {
        kind: 'damage',
        summary: 'Como discente, mas duração 3 rodadas. Dano repetido no início de cada turno.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Muda dano para 6d8 de Morte.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Como discente, duração 3 rodadas. Dano repetido.', circleReq: 3 },
    ],
  },
  {
    id: 'paradoxo',
    name: 'Paradoxo',
    circle: 2,
    element: 'morte',
    execution: 'Padrão',
    range: 'Médio',
    target: '1 ser ou objeto, ou esfera com 3m de raio',
    duration: 'Instantânea',
    description: 'Dissipa rituais ativos. Faça um teste de Ocultismo; anula rituais com DT igual ou menor que o resultado. Pode tornar item amaldiçoado mundano por 1 dia.',
    cost: 3,
    effects: {
      base: {
        kind: 'utility',
        summary: 'Dissipa rituais ativos (teste de Ocultismo). Torna item amaldiçoado mundano por 1 dia.',
      },
    },
    enhancements: [],
  },
  {
    id: 'velocidade-mortal',
    name: 'Velocidade Mortal',
    circle: 2,
    element: 'morte',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser',
    duration: 'Sustentada',
    description: 'Você distorce a passagem do tempo ao redor do alvo, tornando-o extremamente veloz. O alvo pode realizar uma ação de movimento adicional por turno.',
    cost: 3,
    isSustainable: true,
    effects: {
      base: {
        kind: 'buff',
        summary: '+1 ação de movimento adicional por turno.',
      },
      discente: {
        kind: 'buff',
        summary: 'Em vez de movimento, +1 ação padrão adicional por turno.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: 'Muda alvo para alvos escolhidos.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Em vez de movimento, +1 ação padrão adicional.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Muda alvo para alvos escolhidos.', circleReq: 4, affinityReq: true },
    ],
  },
];

// ========================================
// 2º CÍRCULO - SANGUE (5 rituais)
// ========================================

export const BLOOD_SECOND_CIRCLE: UnifiedRitual[] = [
  {
    id: 'aprimorar-fisico',
    name: 'Aprimorar Físico',
    circle: 2,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Cena',
    description: 'O alvo tem seus músculos tonificados e seus ligamentos reforçados, recebendo +1 em Agilidade ou Força, à escolha dele.',
    cost: 3,
    effects: {
      base: {
        kind: 'buff',
        summary: '+1 em Agilidade ou Força (escolha ao conjurar).',
      },
      discente: {
        kind: 'buff',
        summary: '+2 em Agilidade ou Força.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: '+3 em Agilidade ou Força.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Muda bônus para +2.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Muda bônus para +3.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'descarnar',
    name: 'Descarnar',
    circle: 2,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Instantânea',
    description: 'Lacerações se manifestam na pele e órgãos do alvo, que sofre 6d8 pontos de dano (metade corte, metade Sangue) e fica com hemorragia severa (2d8/turno, Fortitude para estancar).',
    cost: 3,
    resistance: { type: 'fortitude', effect: 'parcial' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 6, diceType: 8, damageType: 'sangue' },
        conditions: [{ id: 'sangrando', duration: 'sustentado' }],
        summary: '6d8 dano (corte/Sangue) + hemorragia (2d8/rodada).',
      },
      discente: {
        kind: 'damage',
        damage: { diceCount: 10, diceType: 8, damageType: 'sangue' },
        summary: '10d8 dano, hemorragia 4d8/rodada.',
      },
      verdadeiro: {
        kind: 'buff',
        weaponEffect: { damageBonus: '4d8', damageType: 'sangue' },
        sustain: { action: 'free' },
        summary: 'Sustentado. Ataques causam +4d8 Sangue e hemorragia.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Dano 10d8, hemorragia 4d8.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Alvo você, duração sustentada. Seus ataques causam +4d8 Sangue e hemorragia.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'flagelo-de-sangue',
    name: 'Flagelo de Sangue',
    circle: 2,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 pessoa',
    duration: 'Cena',
    description: 'Você toca uma pessoa, gravando uma marca escarificada no corpo dela enquanto profere uma ordem. A cada rodada que o alvo desobedecer, a marca causa 10d6 dano de Sangue e deixa o alvo enjoado.',
    cost: 3,
    resistance: { type: 'fortitude', effect: 'parcial' },
    effects: {
      base: {
        kind: 'control',
        mentalControl: { type: 'suggestion', canForceHarm: false, canForceSuicide: false },
        damage: { diceCount: 10, diceType: 6, damageType: 'sangue' },
        summary: 'Marca que causa 10d6 e enjoado se desobedecer ordem.',
      },
      discente: {
        kind: 'control',
        summary: 'Alvo 1 ser (exceto criaturas de Sangue).',
      },
      verdadeiro: {
        kind: 'control',
        summary: 'Duração de 1 dia.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Muda alvo para 1 ser (exceto Sangue).', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Duração 1 dia.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'hemofagia',
    name: 'Hemofagia',
    circle: 2,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Instantânea',
    description: 'Você arranca o sangue do corpo do alvo através da pele dele, causando 6d6 pontos de dano de Sangue. Você então absorve esse sangue, recuperando pontos de vida iguais à metade do dano causado.',
    cost: 3,
    resistance: { type: 'fortitude', effect: 'reduz_metade' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 6, diceType: 6, damageType: 'sangue' },
        healing: { diceCount: 3, diceType: 6 },
        summary: '6d6 dano de Sangue, cura metade do dano causado.',
      },
      discente: {
        kind: 'damage',
        summary: 'Sem resistência. Pode combinar com ataque corpo a corpo.',
      },
      verdadeiro: {
        kind: 'buff',
        sustain: { action: 'standard' },
        summary: 'Sustentado. Ação padrão para tocar e causar 4d6 (cura metade).',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Resistência nenhuma. Faz ataque corpo a corpo junto.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Pessoal, sustentada. Ação padrão para tocar e causar 4d6 (recupera metade).', circleReq: 4 },
    ],
  },
  {
    id: 'transfusao-vital',
    name: 'Transfusão Vital',
    circle: 2,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Instantânea',
    description: 'Você toca outro ser e transfere sua própria energia vital para ele, podendo perder até 30 pontos de vida para que o alvo recupere a mesma quantidade em PV. Você não pode ficar com menos de 1 PV.',
    cost: 3,
    effects: {
      base: {
        kind: 'healing',
        healing: { diceCount: 0, diceType: 6, bonus: 30 },
        summary: 'Transfere até 30 PV seus para o alvo.',
      },
      discente: {
        kind: 'healing',
        summary: 'Transfere até 50 PV.',
      },
      verdadeiro: {
        kind: 'healing',
        summary: 'Transfere até 100 PV.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Transfere até 50 PV.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Transfere até 100 PV.', circleReq: 4 },
    ],
  },
];
