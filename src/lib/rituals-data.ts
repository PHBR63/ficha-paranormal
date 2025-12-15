// Ordem Paranormal RPG v1.3 - Sistema de Rituais
// Inclui conteúdo do suplemento "Sobrevivendo ao Horror"

import { SUPPLEMENT_RITUALS } from './supplement-rituals';
export interface Ritual {
  id: string;
  name: string;
  circle: number; // 1 a 4
  element: 'sangue' | 'morte' | 'conhecimento' | 'energia' | 'medo';
  execution: string; // Padrão, Completa, Reação, etc.
  range: string;
  target: string;
  duration: string;
  resistance?: string;
  description: string;
  cost: number; // Custo em PE
  enhancements?: RitualEnhancement[];
}

export interface RitualEnhancement {
  cost: number; // PE adicional
  description: string;
}

// ==================== RITUAIS DE 1º CÍRCULO ====================

export const FIRST_CIRCLE_RITUALS: Ritual[] = [
  // SANGUE
  {
    id: 'curar-ferimentos',
    name: 'Curar Ferimentos',
    circle: 1,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 criatura',
    duration: 'Instantânea',
    description: 'Você canaliza energia vital para curar ferimentos. O alvo recupera 2d8+2 PV.',
    cost: 1,
    enhancements: [
      { cost: 2, description: 'Aumenta a cura em +1d8+1.' },
      { cost: 2, description: 'Muda o alcance para curto.' },
      { cost: 5, description: 'Muda o alvo para criaturas à sua escolha no alcance.' },
    ],
  },
  {
    id: 'armamento-vital',
    name: 'Armamento Vital',
    circle: 1,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Você cria uma arma feita do seu próprio sangue. A arma causa 1d8 de dano e tem crítico 19.',
    cost: 1,
    enhancements: [
      { cost: 2, description: 'O dano aumenta em um passo (1d10, 1d12, 2d6...).' },
      { cost: 2, description: 'A arma passa a ter crítico ×3.' },
    ],
  },
  {
    id: 'transferir-vida',
    name: 'Transferir Vida',
    circle: 1,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 criatura',
    duration: 'Instantânea',
    description: 'Você transfere sua força vital. Você perde até 2d8 PV e o alvo recupera a mesma quantidade.',
    cost: 0,
    enhancements: [
      { cost: 1, description: 'Aumenta a transferência em +1d8.' },
    ],
  },

  // MORTE
  {
    id: 'decadencia',
    name: 'Decadência',
    circle: 1,
    element: 'morte',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 criatura',
    duration: 'Instantânea',
    resistance: 'Fortitude parcial',
    description: 'Você envelhece o alvo momentaneamente, causando 2d6 de dano. Se falhar no teste, fica debilitado por 1 rodada.',
    cost: 1,
    enhancements: [
      { cost: 2, description: 'Aumenta o dano em +1d6.' },
      { cost: 2, description: 'O alvo fica debilitado mesmo se passar no teste.' },
    ],
  },
  {
    id: 'sussurros-dos-mortos',
    name: 'Sussurros dos Mortos',
    circle: 1,
    element: 'morte',
    execution: 'Completa',
    range: 'Curto',
    target: '1 corpo',
    duration: 'Cena',
    description: 'Você faz um cadáver sussurrar respostas. Pode fazer até 5 perguntas simples sobre eventos que o morto presenciou.',
    cost: 1,
    enhancements: [
      { cost: 2, description: 'Pode fazer perguntas mais complexas.' },
      { cost: 5, description: 'O corpo pode se erguer temporariamente para demonstrar eventos.' },
    ],
  },
  {
    id: 'toque-vampirico',
    name: 'Toque Vampírico',
    circle: 1,
    element: 'morte',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 criatura',
    duration: 'Instantânea',
    resistance: 'Fortitude parcial',
    description: 'Você drena a vida do alvo. Causa 2d6 de dano e você recupera PV igual à metade do dano causado.',
    cost: 1,
    enhancements: [
      { cost: 2, description: 'Aumenta o dano em +1d6.' },
      { cost: 3, description: 'Você recupera PV igual ao dano total.' },
    ],
  },

  // CONHECIMENTO
  {
    id: 'detectar-ameacas',
    name: 'Detectar Ameaças',
    circle: 1,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Você sente presenças hostis. Descobre a localização de criaturas hostis em alcance médio e não pode ser surpreendido.',
    cost: 1,
    enhancements: [
      { cost: 1, description: 'Você sabe o nível de ameaça das criaturas detectadas.' },
      { cost: 2, description: 'Aumenta o alcance para longo.' },
    ],
  },
  {
    id: 'compreensao',
    name: 'Compreensão',
    circle: 1,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Você compreende qualquer idioma falado ou escrito.',
    cost: 1,
    enhancements: [
      { cost: 2, description: 'Você também pode falar e escrever no idioma.' },
      { cost: 2, description: 'Muda o alvo para até 5 criaturas.' },
    ],
  },
  {
    id: 'leitura-da-mente',
    name: 'Leitura da Mente',
    circle: 1,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 criatura',
    duration: 'Sustentada',
    resistance: 'Vontade anula',
    description: 'Você lê os pensamentos superficiais do alvo. Recebe +5 em testes contra ele.',
    cost: 2,
    enhancements: [
      { cost: 2, description: 'Você pode fazer perguntas mentais que o alvo responde involuntariamente.' },
      { cost: 3, description: 'Você acessa memórias recentes do alvo.' },
    ],
  },

  // ENERGIA
  {
    id: 'explosao-elemental',
    name: 'Explosão Elemental',
    circle: 1,
    element: 'energia',
    execution: 'Padrão',
    range: 'Médio',
    target: 'Esfera de 3m de raio',
    duration: 'Instantânea',
    resistance: 'Reflexos parcial',
    description: 'Você cria uma explosão de energia elemental (escolha: fogo, frio, eletricidade ou ácido). Causa 3d6 de dano.',
    cost: 2,
    enhancements: [
      { cost: 2, description: 'Aumenta o dano em +2d6.' },
      { cost: 2, description: 'Aumenta o raio em +3m.' },
    ],
  },
  {
    id: 'projecao-energia',
    name: 'Projeção de Energia',
    circle: 1,
    element: 'energia',
    execution: 'Padrão',
    range: 'Médio',
    target: '1 criatura',
    duration: 'Instantânea',
    description: 'Você dispara um raio de energia. Faz um ataque à distância que causa 2d8 de dano.',
    cost: 1,
    enhancements: [
      { cost: 2, description: 'Aumenta o dano em +1d8.' },
      { cost: 1, description: 'O alvo fica cego por 1 rodada.' },
    ],
  },
  {
    id: 'barreira',
    name: 'Barreira',
    circle: 1,
    element: 'energia',
    execution: 'Reação',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Instantânea',
    description: 'Você cria uma barreira de energia que concede +5 em Defesa contra um ataque.',
    cost: 1,
    enhancements: [
      { cost: 2, description: 'A barreira protege até 3 aliados adjacentes.' },
      { cost: 3, description: 'O bônus aumenta para +10.' },
    ],
  },

  // MEDO
  {
    id: 'amedrontar',
    name: 'Amedrontar',
    circle: 1,
    element: 'medo',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 criatura',
    duration: 'Cena',
    resistance: 'Vontade parcial',
    description: 'O alvo fica com medo de você. Sofre -2 em ataques contra você. Se falhar no teste, foge por 1 rodada.',
    cost: 1,
    enhancements: [
      { cost: 2, description: 'A penalidade aumenta para -4.' },
      { cost: 3, description: 'O alvo fica paralisado por 1 rodada se falhar no teste.' },
    ],
  },
  {
    id: 'perturbacao',
    name: 'Perturbação',
    circle: 1,
    element: 'medo',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 criatura',
    duration: 'Cena',
    resistance: 'Vontade anula',
    description: 'Você causa alucinações perturbadoras. O alvo sofre -2 em todos os testes.',
    cost: 1,
    enhancements: [
      { cost: 2, description: 'A penalidade aumenta para -4.' },
      { cost: 2, description: 'Afeta até 3 criaturas.' },
    ],
  },
  {
    id: 'visao-do-medo',
    name: 'Visão do Medo',
    circle: 1,
    element: 'medo',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 criatura',
    duration: 'Instantânea',
    resistance: 'Vontade parcial',
    description: 'Você mostra ao alvo sua maior fobia. Causa 2d6 de dano mental. Se falhar no teste, fica atordoado por 1 rodada.',
    cost: 1,
    enhancements: [
      { cost: 2, description: 'Aumenta o dano em +1d6.' },
      { cost: 3, description: 'Mesmo se passar no teste, o alvo fica abalado por 1 rodada.' },
    ],
  },
];

// ==================== RITUAIS DE 2º CÍRCULO ====================

export const SECOND_CIRCLE_RITUALS: Ritual[] = [
  // SANGUE
  {
    id: 'cura-completa',
    name: 'Cura Completa',
    circle: 2,
    element: 'sangue',
    execution: 'Completa',
    range: 'Toque',
    target: '1 criatura',
    duration: 'Instantânea',
    description: 'Você canaliza energia vital intensa. O alvo recupera 5d8+5 PV e é curado de uma condição (envenenado, cego, etc).',
    cost: 3,
    enhancements: [
      { cost: 2, description: 'Cura uma condição adicional.' },
      { cost: 5, description: 'Regenera um membro perdido.' },
    ],
  },
  {
    id: 'sangue-fervente',
    name: 'Sangue Fervente',
    circle: 2,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 criatura',
    duration: 'Sustentada',
    resistance: 'Fortitude parcial',
    description: 'O sangue do alvo ferve. Causa 3d8 de dano por turno. Metade se passar no teste.',
    cost: 3,
    enhancements: [
      { cost: 3, description: 'O dano aumenta para 5d8.' },
      { cost: 2, description: 'Afeta até 3 criaturas.' },
    ],
  },

  // MORTE
  {
    id: 'animar-mortos',
    name: 'Animar Mortos',
    circle: 2,
    element: 'morte',
    execution: 'Completa',
    range: 'Toque',
    target: '1 cadáver',
    duration: 'Cena',
    description: 'Você anima um cadáver como zumbi que obedece seus comandos. Tem PV igual ao seu NEX.',
    cost: 3,
    enhancements: [
      { cost: 3, description: 'O zumbi tem o dobro de PV.' },
      { cost: 5, description: 'Anima até 3 cadáveres.' },
    ],
  },
  {
    id: 'drenar-vitalidade',
    name: 'Drenar Vitalidade',
    circle: 2,
    element: 'morte',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 criatura',
    duration: 'Instantânea',
    resistance: 'Fortitude parcial',
    description: 'Você drena a força vital. Causa 4d8 de dano e você recupera metade como PV temporários.',
    cost: 3,
    enhancements: [
      { cost: 3, description: 'O dano aumenta para 6d8.' },
      { cost: 2, description: 'Você recupera PE igual a 1/4 do dano.' },
    ],
  },

  // CONHECIMENTO
  {
    id: 'localizar',
    name: 'Localizar',
    circle: 2,
    element: 'conhecimento',
    execution: 'Completa',
    range: 'Ilimitado',
    target: '1 criatura ou objeto',
    duration: 'Sustentada',
    description: 'Você sabe a direção e distância aproximada de um alvo que você conhece ou possui algo relacionado.',
    cost: 2,
    enhancements: [
      { cost: 3, description: 'Você vê a área ao redor do alvo.' },
      { cost: 5, description: 'Você pode se teletransportar até o alvo.' },
    ],
  },
  {
    id: 'visao-verdadeira',
    name: 'Visão Verdadeira',
    circle: 2,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Você enxerga a verdade. Vê através de ilusões, disfarces e invisibilidade.',
    cost: 2,
    enhancements: [
      { cost: 2, description: 'Vê também auras paranormais e mágicas.' },
      { cost: 3, description: 'Afeta aliados em alcance curto.' },
    ],
  },

  // ENERGIA
  {
    id: 'relampago',
    name: 'Relâmpago',
    circle: 2,
    element: 'energia',
    execution: 'Padrão',
    range: 'Linha de 30m',
    target: 'Linha',
    duration: 'Instantânea',
    resistance: 'Reflexos parcial',
    description: 'Você dispara um relâmpago que atinge todos na linha. Causa 6d6 de dano elétrico.',
    cost: 3,
    enhancements: [
      { cost: 3, description: 'O dano aumenta para 8d6.' },
      { cost: 2, description: 'Alvos que falharem ficam paralisados por 1 rodada.' },
    ],
  },
  {
    id: 'bola-de-fogo',
    name: 'Bola de Fogo',
    circle: 2,
    element: 'energia',
    execution: 'Padrão',
    range: 'Longo',
    target: 'Esfera de 6m de raio',
    duration: 'Instantânea',
    resistance: 'Reflexos parcial',
    description: 'Você lança uma bola de fogo que explode. Causa 6d6 de dano de fogo.',
    cost: 3,
    enhancements: [
      { cost: 3, description: 'O dano aumenta para 10d6.' },
      { cost: 2, description: 'O fogo persiste por 3 rodadas, causando 2d6 por turno a quem entrar.' },
    ],
  },

  // MEDO
  {
    id: 'pavor',
    name: 'Pavor',
    circle: 2,
    element: 'medo',
    execution: 'Padrão',
    range: 'Médio',
    target: 'Criaturas à sua escolha',
    duration: 'Cena',
    resistance: 'Vontade parcial',
    description: 'Você emana uma aura de terror. Alvos que falharem fogem em pânico. Mesmo passando, sofrem -4 em testes.',
    cost: 3,
    enhancements: [
      { cost: 3, description: 'Alvos que falharem ficam paralisados de medo.' },
      { cost: 2, description: 'A duração aumenta para 1 dia.' },
    ],
  },
  {
    id: 'pesadelo',
    name: 'Pesadelo',
    circle: 2,
    element: 'medo',
    execution: 'Completa',
    range: 'Ilimitado',
    target: '1 criatura',
    duration: '1 noite',
    resistance: 'Vontade anula',
    description: 'Você invade os sonhos do alvo. Ele não recupera PV, PE ou SAN naquela noite e acorda fatigado.',
    cost: 2,
    enhancements: [
      { cost: 3, description: 'O alvo sofre 3d6 de dano mental.' },
      { cost: 5, description: 'Você pode enviar uma mensagem ou imagem específica.' },
    ],
  },
];

// ==================== RITUAIS DE 3º CÍRCULO ====================

export const THIRD_CIRCLE_RITUALS: Ritual[] = [
  // SANGUE
  {
    id: 'regeneracao',
    name: 'Regeneração',
    circle: 3,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 criatura',
    duration: 'Sustentada',
    description: 'O alvo regenera ferimentos. Recupera 3d8 PV no início de cada turno seu.',
    cost: 5,
    enhancements: [
      { cost: 3, description: 'A regeneração aumenta para 5d8.' },
      { cost: 5, description: 'O alvo pode regenerar membros perdidos em 1 minuto.' },
    ],
  },
  {
    id: 'frenesi',
    name: 'Frenesi',
    circle: 3,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Você entra em frenesi. Recebe +4 em ataques, +8 em dano e +20 PV temporários, mas -4 em Defesa.',
    cost: 5,
    enhancements: [
      { cost: 3, description: 'Os bônus aumentam para +6/+12.' },
      { cost: 5, description: 'Não sofre a penalidade em Defesa.' },
    ],
  },

  // MORTE
  {
    id: 'circulo-da-morte',
    name: 'Círculo da Morte',
    circle: 3,
    element: 'morte',
    execution: 'Padrão',
    range: 'Médio',
    target: 'Esfera de 6m de raio',
    duration: 'Instantânea',
    resistance: 'Fortitude parcial',
    description: 'Energia de morte se espalha. Criaturas na área sofrem 10d6 de dano. Metade se passarem.',
    cost: 6,
    enhancements: [
      { cost: 4, description: 'O dano aumenta para 15d6.' },
      { cost: 3, description: 'Criaturas reduzidas a 0 PV se erguem como zumbis sob seu controle.' },
    ],
  },

  // CONHECIMENTO
  {
    id: 'controle-mental',
    name: 'Controle Mental',
    circle: 3,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 criatura',
    duration: 'Sustentada',
    resistance: 'Vontade anula',
    description: 'Você controla as ações do alvo. Ele faz o que você mandar, mas pode fazer um novo teste por rodada.',
    cost: 6,
    enhancements: [
      { cost: 3, description: 'O alvo só faz novo teste se receber dano.' },
      { cost: 5, description: 'Afeta até 3 criaturas.' },
    ],
  },

  // ENERGIA
  {
    id: 'tempestade',
    name: 'Tempestade',
    circle: 3,
    element: 'energia',
    execution: 'Completa',
    range: 'Longo',
    target: 'Área de 30m de raio',
    duration: 'Sustentada',
    description: 'Você cria uma tempestade. Criaturas na área sofrem 4d6 de dano por turno e têm deslocamento reduzido pela metade.',
    cost: 6,
    enhancements: [
      { cost: 4, description: 'O dano aumenta para 6d6.' },
      { cost: 3, description: 'Raios atingem um alvo por turno, causando 8d6 adicional.' },
    ],
  },

  // MEDO
  {
    id: 'loucura',
    name: 'Loucura',
    circle: 3,
    element: 'medo',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 criatura',
    duration: 'Cena',
    resistance: 'Vontade anula',
    description: 'O alvo enlouquece temporariamente. Age de forma errática, determinada pelo mestre.',
    cost: 5,
    enhancements: [
      { cost: 5, description: 'A loucura é permanente (só pode ser curada com ritual de 4º círculo).' },
      { cost: 3, description: 'Afeta até 3 criaturas.' },
    ],
  },
];

// ==================== RITUAIS DE 4º CÍRCULO ====================

export const FOURTH_CIRCLE_RITUALS: Ritual[] = [
  // SANGUE
  {
    id: 'ressurreicao',
    name: 'Ressurreição',
    circle: 4,
    element: 'sangue',
    execution: '1 hora',
    range: 'Toque',
    target: '1 criatura morta',
    duration: 'Instantânea',
    description: 'Você traz uma criatura de volta à vida. A criatura ressurge com 1 PV e perde 5 pontos de SAN permanentemente.',
    cost: 10,
    enhancements: [
      { cost: 5, description: 'A criatura ressurge com metade dos PV.' },
      { cost: 10, description: 'A perda de SAN é reduzida para 2.' },
    ],
  },
  {
    id: 'forma-sangue',
    name: 'Forma de Sangue',
    circle: 4,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Você se transforma em uma criatura de sangue. Recebe +6 em ataques, imunidade a críticos e resistência a dano 10.',
    cost: 8,
  },

  // MORTE
  {
    id: 'palavra-morte',
    name: 'Palavra de Morte',
    circle: 4,
    element: 'morte',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 criatura',
    duration: 'Instantânea',
    resistance: 'Fortitude anula',
    description: 'Você pronuncia uma palavra que mata. Se o alvo falhar, morre instantaneamente.',
    cost: 10,
    enhancements: [
      { cost: 5, description: 'Mesmo se passar, o alvo sofre 10d6 de dano.' },
    ],
  },
  {
    id: 'forma-morte',
    name: 'Forma da Morte',
    circle: 4,
    element: 'morte',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Você se torna uma criatura de morte. Recebe voo, invisibilidade, imunidade a efeitos mentais e seus ataques causam +3d6 de dano de morte.',
    cost: 8,
  },

  // CONHECIMENTO
  {
    id: 'onisciencia',
    name: 'Onisciência',
    circle: 4,
    element: 'conhecimento',
    execution: 'Completa',
    range: 'Ilimitado',
    target: 'Especial',
    duration: '1 pergunta',
    description: 'Você faz uma pergunta a uma entidade cósmica e recebe uma resposta verdadeira (embora possivelmente enigmática).',
    cost: 10,
  },

  // ENERGIA
  {
    id: 'apocalipse',
    name: 'Apocalipse',
    circle: 4,
    element: 'energia',
    execution: 'Completa',
    range: 'Longo',
    target: 'Área de 60m de raio',
    duration: 'Instantânea',
    resistance: 'Reflexos parcial',
    description: 'Você desencadeia destruição absoluta. Tudo na área sofre 20d6 de dano. Estruturas são destruídas automaticamente.',
    cost: 15,
  },

  // MEDO
  {
    id: 'forma-medo',
    name: 'Forma do Medo',
    circle: 4,
    element: 'medo',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Você se torna a personificação do medo. Criaturas que o virem devem passar em Vontade ou fogem em pânico. Você é imune a medo.',
    cost: 8,
  },
  {
    id: 'tormento-eterno',
    name: 'Tormento Eterno',
    circle: 4,
    element: 'medo',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 criatura',
    duration: 'Permanente',
    resistance: 'Vontade anula',
    description: 'O alvo é assombrado por pesadelos eternos. Nunca mais consegue descansar normalmente e perde 1 SAN por dia.',
    cost: 10,
    enhancements: [
      { cost: 5, description: 'A perda de SAN aumenta para 1d6 por dia.' },
    ],
  },
];

// ==================== TODOS OS RITUAIS ====================

export const ALL_RITUALS: Ritual[] = [
  ...FIRST_CIRCLE_RITUALS,
  ...SECOND_CIRCLE_RITUALS,
  ...THIRD_CIRCLE_RITUALS,
  ...FOURTH_CIRCLE_RITUALS,
  ...SUPPLEMENT_RITUALS, // Rituais do suplemento "Sobrevivendo ao Horror"
];

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Retorna rituais disponíveis para um círculo máximo
 */
export function getRitualsByMaxCircle(maxCircle: number): Ritual[] {
  return ALL_RITUALS.filter(ritual => ritual.circle <= maxCircle);
}

/**
 * Retorna rituais de um elemento específico
 */
export function getRitualsByElement(element: string): Ritual[] {
  return ALL_RITUALS.filter(ritual => ritual.element === element);
}

/**
 * Retorna rituais de um círculo específico
 */
export function getRitualsByCircle(circle: number): Ritual[] {
  return ALL_RITUALS.filter(ritual => ritual.circle === circle);
}

/**
 * Retorna o círculo máximo de ritual disponível para um NEX
 */
export function getMaxRitualCircle(nex: number): number {
  if (nex >= 50) return 4;
  if (nex >= 35) return 3;
  if (nex >= 20) return 2;
  return 1;
}

/**
 * Retorna quantos rituais um Ocultista conhece baseado no NEX
 */
export function getRitualCount(nex: number): number {
  // Base: 1 ritual no NEX 5%, +1 por 5% de NEX adicional
  return Math.floor(nex / 5);
}
