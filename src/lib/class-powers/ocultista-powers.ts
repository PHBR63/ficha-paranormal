/**
 * Poderes de Classe: OCULTISTA
 * Ordem Paranormal RPG v1.3 - Livro Base
 * 
 * O Ocultista é a classe focada em rituais, conhecimento paranormal
 * e manipulação de Pontos de Esforço. Seus poderes melhoram rituais,
 * reduzem custos de PE e concedem habilidades de investigação paranormal.
 */

import { UnifiedClassPower } from './types';

/**
 * Todos os poderes do Ocultista, incluindo habilidades core e escolhíveis
 */
export const OCULTISTA_POWERS: UnifiedClassPower[] = [
  // ==================== HABILIDADES CORE (AUTOMÁTICAS) ====================
  
  {
    id: 'escolhido-pelo-outro-lado',
    name: 'Escolhido pelo Outro Lado',
    classId: 'Ocultista',
    isCore: true,
    minNex: 5,
    description: 'Você teve uma experiência paranormal e foi marcado pelo Outro Lado, absorvendo conhecimento proibido necessário para realizar rituais. Você pode lançar rituais de 1º círculo. Conforme seu NEX aumenta, pode lançar rituais de círculos maiores: 2º círculo em NEX 25%, 3º círculo em NEX 55%, 4º círculo em NEX 85%. Você começa com três rituais de 1º círculo e aprende um ritual adicional sempre que avança de NEX.',
    pageReference: 'Livro Base p.52',
    effects: {
      base: {
        kind: 'passive',
        // Habilita conjuração de rituais - mecânica principal
      },
      progression: {
        25: {
          kind: 'passive',
          // Habilita 2º círculo
        },
        55: {
          kind: 'passive',
          // Habilita 3º círculo
        },
        85: {
          kind: 'passive',
          // Habilita 4º círculo
        },
      },
    },
    tags: ['ritual', 'core', 'progressão'],
  },
  
  {
    id: 'habilidade-trilha-ocultista',
    name: 'Habilidade de Trilha',
    classId: 'Ocultista',
    isCore: true,
    minNex: 10,
    description: 'Em NEX 10%, você escolhe uma das trilhas de ocultista disponíveis e recebe o primeiro poder da trilha escolhida. Você recebe um novo poder da trilha em NEX 40%, 65% e 99%.',
    pageReference: 'Livro Base p.52',
    effects: {
      base: {
        kind: 'choice',
        requiresChoice: {
          type: 'power',
          count: 1,
        },
      },
    },
    tags: ['trilha', 'progressão'],
  },
  
  {
    id: 'aumento-atributo-20-ocult',
    name: 'Aumento de Atributo',
    classId: 'Ocultista',
    isCore: true,
    minNex: 20,
    description: 'Em NEX 20%, aumente um atributo à sua escolha em +1. Nenhum atributo pode ultrapassar 5 por esse método.',
    pageReference: 'Livro Base p.52',
    effects: {
      base: {
        kind: 'choice',
        requiresChoice: {
          type: 'attribute',
          count: 1,
        },
      },
    },
    tags: ['progressão', 'atributo'],
  },
  
  {
    id: 'segundo-circulo',
    name: '2º Círculo de Rituais',
    classId: 'Ocultista',
    isCore: true,
    minNex: 25,
    description: 'Você pode lançar rituais de 2º círculo.',
    pageReference: 'Livro Base p.52',
    effects: {
      base: {
        kind: 'passive',
      },
    },
    tags: ['ritual', 'círculo', 'progressão'],
  },
  
  {
    id: 'grau-treinamento-35-ocult',
    name: 'Grau de Treinamento',
    classId: 'Ocultista',
    isCore: true,
    minNex: 35,
    description: 'Em NEX 35%, escolha um número de perícias treinadas igual a 3 + Int. O grau de treinamento dessas perícias aumenta em um nível (treinado → veterano → expert).',
    pageReference: 'Livro Base p.52',
    effects: {
      base: {
        kind: 'choice',
        skillTraining: {
          count: 3, // +Int calculado em runtime
          targetLevel: 'veteran',
        },
      },
    },
    tags: ['progressão', 'perícia'],
  },
  
  {
    id: 'aumento-atributo-50-ocult',
    name: 'Aumento de Atributo',
    classId: 'Ocultista',
    isCore: true,
    minNex: 50,
    description: 'Em NEX 50%, aumente um atributo à sua escolha em +1. Nenhum atributo pode ultrapassar 5 por esse método.',
    pageReference: 'Livro Base p.52',
    effects: {
      base: {
        kind: 'choice',
        requiresChoice: {
          type: 'attribute',
          count: 1,
        },
      },
    },
    tags: ['progressão', 'atributo'],
  },
  
  {
    id: 'versatilidade-ocult',
    name: 'Versatilidade',
    classId: 'Ocultista',
    isCore: true,
    minNex: 50,
    description: 'Em NEX 50%, escolha entre receber um poder de ocultista ou receber o primeiro poder de uma trilha de ocultista que não a sua.',
    pageReference: 'Livro Base p.52',
    effects: {
      base: {
        kind: 'choice',
        requiresChoice: {
          type: 'power',
          count: 1,
        },
      },
    },
    tags: ['progressão', 'versatilidade'],
  },
  
  {
    id: 'terceiro-circulo',
    name: '3º Círculo de Rituais',
    classId: 'Ocultista',
    isCore: true,
    minNex: 55,
    description: 'Você pode lançar rituais de 3º círculo.',
    pageReference: 'Livro Base p.52',
    effects: {
      base: {
        kind: 'passive',
      },
    },
    tags: ['ritual', 'círculo', 'progressão'],
  },
  
  {
    id: 'grau-treinamento-70-ocult',
    name: 'Grau de Treinamento',
    classId: 'Ocultista',
    isCore: true,
    minNex: 70,
    description: 'Em NEX 70%, escolha um número de perícias treinadas igual a 3 + Int. O grau de treinamento dessas perícias aumenta em um nível (treinado → veterano → expert).',
    pageReference: 'Livro Base p.52',
    effects: {
      base: {
        kind: 'choice',
        skillTraining: {
          count: 3,
          targetLevel: 'veteran',
        },
      },
    },
    tags: ['progressão', 'perícia'],
  },
  
  {
    id: 'aumento-atributo-80-ocult',
    name: 'Aumento de Atributo',
    classId: 'Ocultista',
    isCore: true,
    minNex: 80,
    description: 'Em NEX 80%, aumente um atributo à sua escolha em +1. Nenhum atributo pode ultrapassar 5 por esse método.',
    pageReference: 'Livro Base p.52',
    effects: {
      base: {
        kind: 'choice',
        requiresChoice: {
          type: 'attribute',
          count: 1,
        },
      },
    },
    tags: ['progressão', 'atributo'],
  },
  
  {
    id: 'quarto-circulo',
    name: '4º Círculo de Rituais',
    classId: 'Ocultista',
    isCore: true,
    minNex: 85,
    description: 'Você pode lançar rituais de 4º círculo.',
    pageReference: 'Livro Base p.52',
    effects: {
      base: {
        kind: 'passive',
      },
    },
    tags: ['ritual', 'círculo', 'progressão'],
  },
  
  {
    id: 'aumento-atributo-95-ocult',
    name: 'Aumento de Atributo',
    classId: 'Ocultista',
    isCore: true,
    minNex: 95,
    description: 'Em NEX 95%, aumente um atributo à sua escolha em +1. Nenhum atributo pode ultrapassar 5 por esse método.',
    pageReference: 'Livro Base p.52',
    effects: {
      base: {
        kind: 'choice',
        requiresChoice: {
          type: 'attribute',
          count: 1,
        },
      },
    },
    tags: ['progressão', 'atributo'],
  },
  
  // ==================== PODERES ESCOLHÍVEIS ====================
  
  {
    id: 'camuflar-ocultismo',
    name: 'Camuflar Ocultismo',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Você pode gastar uma ação livre para esconder símbolos e sigilos desenhados ou gravados em objetos ou na sua pele, tornando-os invisíveis para outras pessoas além de você. Além disso, ao lançar um ritual, pode gastar +2 PE para lançá-lo sem componentes ritualísticos e sem gesticular, usando apenas concentração. Outros seres só perceberão que você lançou um ritual se passarem em um teste de Ocultismo (DT 25).',
    pageReference: 'Livro Base p.53',
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 2,
          action: 'free',
        },
        // Permite conjurar rituais de forma furtiva
      },
    },
    tags: ['ritual', 'furtividade', 'utilidade'],
  },
  
  {
    id: 'criar-selo',
    name: 'Criar Selo',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Você sabe fabricar selos paranormais de rituais que conhece. Fabricar um selo gasta uma ação de intento e um número de PE igual ao custo do ritual. Você pode ter um número máximo de selos criados ao mesmo tempo igual à sua Presença.',
    pageReference: 'Livro Base p.53',
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 0, // Custo = custo do ritual
          action: 'complete',
        },
      },
    },
    tags: ['ritual', 'selo', 'crafting'],
  },
  
  {
    id: 'envolto-em-misterio',
    name: 'Envolto em Mistério',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Sua aparência e postura assombrosas permitem manipular e assustar pessoas ignorantes ou supersticiosas. O mestre define quando esse poder pode ser usado. Como regra geral, você recebe +5 em Enganação e Intimidação contra pessoas não treinadas em Ocultismo.',
    pageReference: 'Livro Base p.53',
    effects: {
      base: {
        kind: 'passive',
        skillBonuses: [
          { skill: 'enganacao', value: 5 },
          { skill: 'intimidacao', value: 5 },
        ],
      },
    },
    tags: ['social', 'intimidação'],
  },
  
  {
    id: 'especialista-em-elemento',
    name: 'Especialista em Elemento',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Escolha um elemento. A DT para resistir aos seus rituais desse elemento aumenta em +2.',
    pageReference: 'Livro Base p.53',
    effects: {
      base: {
        kind: 'choice',
        requiresChoice: {
          type: 'element',
          count: 1,
          options: ['Sangue', 'Morte', 'Energia', 'Conhecimento', 'Medo'],
        },
      },
    },
    tags: ['ritual', 'elemento', 'dt'],
  },
  
  {
    id: 'ferramentas-paranormais',
    name: 'Ferramentas Paranormais',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Você reduz a categoria de um item paranormal em 1 e pode ativar itens paranormais sem pagar seu custo em PE.',
    pageReference: 'Livro Base p.53',
    effects: {
      base: {
        kind: 'passive',
        // Reduz categoria de itens paranormais
      },
    },
    tags: ['item', 'paranormal', 'economia'],
  },
  
  {
    id: 'guiado-pelo-paranormal',
    name: 'Guiado pelo Paranormal',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Uma vez por cena, você pode gastar 2 PE para fazer uma ação de investigação adicional.',
    pageReference: 'Livro Base p.53',
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 2,
          action: 'standard',
          perScene: true,
        },
        extraActions: [{
          actionType: 'investigation',
          cost: 2,
          perScene: true,
        }],
      },
    },
    tags: ['investigação', 'ação-extra'],
  },
  
  {
    id: 'identificacao-paranormal',
    name: 'Identificação Paranormal',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Você recebe +10 em testes de Ocultismo para identificar criaturas, objetos ou rituais paranormais.',
    pageReference: 'Livro Base p.53',
    effects: {
      base: {
        kind: 'passive',
        skillBonuses: [{
          skill: 'ocultismo',
          value: 10,
        }],
      },
    },
    tags: ['perícia', 'ocultismo', 'identificação'],
  },
  
  {
    id: 'improvisar-componentes',
    name: 'Improvisar Componentes',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Uma vez por cena, você pode gastar uma ação completa para fazer um teste de Investigação (DT 15). Se passar, encontra objetos que podem servir como componentes ritualísticos de um elemento à sua escolha. O mestre decide se é possível usar este poder na cena atual.',
    pageReference: 'Livro Base p.53',
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 0,
          action: 'complete',
          perScene: true,
        },
      },
    },
    tags: ['ritual', 'componentes', 'investigação'],
  },
  
  {
    id: 'intuicao-paranormal',
    name: 'Intuição Paranormal',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Sempre que usa a ação facilitar investigação, você soma seu Intelecto ou Presença no teste (à sua escolha).',
    pageReference: 'Livro Base p.53',
    effects: {
      base: {
        kind: 'passive',
        // Soma Int ou Pre em facilitar investigação
      },
    },
    tags: ['investigação', 'atributo'],
  },
  
  {
    id: 'ritual-potente',
    name: 'Ritual Potente',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Você soma seu Intelecto nas rolagens de dano ou efeitos de cura de seus rituais. Pré-requisito: Int 2.',
    pageReference: 'Livro Base p.54',
    prerequisites: {
      attributes: { intellect: 2 },
    },
    effects: {
      base: {
        kind: 'passive',
        damageBonus: {
          attribute: 'intellect',
        },
      },
    },
    tags: ['ritual', 'dano', 'cura', 'passivo'],
  },
  
  {
    id: 'ritual-predileto',
    name: 'Ritual Predileto',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Escolha um ritual que você conhece. O custo desse ritual é reduzido em –1 PE. Essa redução se acumula com reduções vindas de outras fontes.',
    pageReference: 'Livro Base p.54',
    effects: {
      base: {
        kind: 'choice',
        requiresChoice: {
          type: 'ritual',
          count: 1,
        },
        peModifiers: [{
          value: -1,
          targets: [], // O ritual escolhido
        }],
      },
    },
    tags: ['ritual', 'economia-pe'],
  },
  
  {
    id: 'tatuagem-ritualistica',
    name: 'Tatuagem Ritualística',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Símbolos marcados em sua pele reduzem em –1 PE o custo de rituais de alcance pessoal que têm você como alvo.',
    pageReference: 'Livro Base p.54',
    effects: {
      base: {
        kind: 'passive',
        peModifiers: [{
          value: -1,
          targets: ['pessoal'], // Rituais de alcance pessoal
        }],
      },
    },
    tags: ['ritual', 'economia-pe', 'passivo'],
  },
  
  {
    id: 'transcender-ocult',
    name: 'Transcender',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Escolha um poder paranormal. Você recebe o poder escolhido, mas não ganha Sanidade neste aumento de NEX. Você pode escolher este poder várias vezes.',
    pageReference: 'Livro Base p.54',
    isRepeatable: true,
    effects: {
      base: {
        kind: 'repeatable',
        grantsPower: 'paranormal',
        requiresChoice: {
          type: 'power',
          count: 1,
        },
      },
    },
    tags: ['paranormal', 'transcendência', 'repetível'],
  },
  
  {
    id: 'treinamento-pericia-ocult',
    name: 'Treinamento em Perícia',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Escolha duas perícias. Você recebe treinamento nessas perícias. A partir de NEX 35%, você pode escolher perícias nas quais já é treinado para se tornar veterano. A partir de NEX 70%, você pode escolher perícias nas quais já é veterano para se tornar expert. Você pode escolher este poder várias vezes.',
    pageReference: 'Livro Base p.54',
    isRepeatable: true,
    effects: {
      base: {
        kind: 'choice',
        skillTraining: {
          count: 2,
          targetLevel: 'trained',
        },
      },
      progression: {
        35: {
          kind: 'choice',
          skillTraining: {
            count: 2,
            targetLevel: 'veteran',
          },
        },
        70: {
          kind: 'choice',
          skillTraining: {
            count: 2,
            targetLevel: 'expert',
          },
        },
      },
    },
    tags: ['perícia', 'treinamento', 'repetível'],
  },
  
  // ==================== PODERES COM REQUISITO DE NEX MAIOR ====================
  
  {
    id: 'mestre-em-elemento',
    name: 'Mestre em Elemento',
    classId: 'Ocultista',
    isCore: false,
    minNex: 45,
    description: 'Escolha um elemento. O custo para lançar rituais desse elemento diminui em –1 PE. Pré-requisitos: Especialista em Elemento escolhido, NEX 45%.',
    pageReference: 'Livro Base p.54',
    prerequisites: {
      minNex: 45,
      powers: ['especialista-em-elemento'],
    },
    effects: {
      base: {
        kind: 'choice',
        requiresChoice: {
          type: 'element',
          count: 1,
          options: ['Sangue', 'Morte', 'Energia', 'Conhecimento', 'Medo'],
        },
        peModifiers: [{
          value: -1,
          targets: [], // Rituais do elemento escolhido
        }],
      },
    },
    tags: ['ritual', 'elemento', 'economia-pe'],
  },
  
  {
    id: 'fluxo-de-poder',
    name: 'Fluxo de Poder',
    classId: 'Ocultista',
    isCore: false,
    minNex: 60,
    description: 'Você pode manter dois efeitos sustentados de rituais ativos ao mesmo tempo com apenas uma ação livre, pagando o custo de cada efeito separadamente. Pré-requisito: NEX 60%.',
    pageReference: 'Livro Base p.54',
    prerequisites: {
      minNex: 60,
    },
    effects: {
      base: {
        kind: 'passive',
        // Permite sustentar 2 rituais com 1 ação
      },
    },
    tags: ['ritual', 'sustentação', 'avançado'],
  },
  
  // ==================== PODERES ADICIONAIS (Livro Base p.53-54) ====================
  
  {
    id: 'conhecimento-arcano',
    name: 'Conhecimento Arcano',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Você recebe +2 rituais iniciais conhecidos e, sempre que ganha acesso a um novo círculo de rituais, aprende um ritual extra desse círculo.',
    pageReference: 'Livro Base p.53',
    effects: {
      base: {
        kind: 'passive',
        extraRituals: 2,
      },
    },
    tags: ['ritual', 'conhecimento'],
  },
  
  {
    id: 'prece',
    name: 'Prece',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Uma vez por dia, você pode gastar uma hora rezando e meditando para recuperar PE igual à sua Presença (mínimo 1).',
    pageReference: 'Livro Base p.54',
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 0,
          action: 'complete',
          perDay: true,
        },
        peRecovery: {
          attribute: 'presence',
          minimum: 1,
        },
      },
    },
    tags: ['recuperação', 'pe', 'diário'],
  },
  
  {
    id: 'surto-adrenalina',
    name: 'Surto de Adrenalina',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Uma vez por cena, você pode gastar 2 PE para realizar uma ação padrão adicional em seu turno.',
    pageReference: 'Livro Base p.54',
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 2,
          action: 'free',
          perScene: true,
        },
        extraActions: [{
          actionType: 'standard',
          cost: 2,
          perScene: true,
        }],
      },
    },
    tags: ['ação-extra', 'combate'],
  },
  
  {
    id: 'foco-aprimorado',
    name: 'Foco Aprimorado',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Você pode usar Intelecto ou Presença em vez de Força para manobras de agarrar, e pode manter uma criatura agarrada usando apenas uma mão.',
    pageReference: 'Livro Base p.53',
    effects: {
      base: {
        kind: 'passive',
        attributeSwap: {
          skill: 'luta',
          newAttribute: ['intellect', 'presence'],
          forManeuver: 'grapple',
        },
      },
    },
    tags: ['combate', 'manobra'],
  },
  
  {
    id: 'armamento-paranormal',
    name: 'Armamento Paranormal',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Você recebe proficiência com armas simples e táticas de corpo a corpo e armas simples de disparo. Quando empunha uma dessas armas, pode gastar 1 PE para que ela cause dano paranormal até o final da cena.',
    pageReference: 'Livro Base p.53',
    effects: {
      base: {
        kind: 'activated',
        proficiencies: {
          weapons: ['simple-melee', 'tactical-melee', 'simple-ranged'],
        },
        activation: {
          cost: 1,
          action: 'free',
        },
        damageType: 'paranormal',
      },
    },
    tags: ['proficiência', 'combate', 'paranormal'],
  },
  
  {
    id: 'poder-oculto',
    name: 'Poder Oculto',
    classId: 'Ocultista',
    isCore: false,
    minNex: 30,
    description: 'Você recebe +1 em Presença, até um máximo de 5. Pré-requisito: NEX 30%.',
    pageReference: 'Livro Base p.54',
    prerequisites: {
      minNex: 30,
    },
    effects: {
      base: {
        kind: 'passive',
        attributeBonus: {
          attribute: 'presence',
          value: 1,
          max: 5,
        },
      },
    },
    tags: ['atributo', 'passivo'],
  },
  
  {
    id: 'ritual-aprendido',
    name: 'Ritual Aprendido',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Você aprende um ritual de qualquer círculo que possa conjurar. Você pode escolher este poder várias vezes.',
    pageReference: 'Livro Base p.54',
    isRepeatable: true,
    effects: {
      base: {
        kind: 'choice',
        requiresChoice: {
          type: 'ritual',
          count: 1,
        },
      },
    },
    tags: ['ritual', 'conhecimento', 'repetível'],
  },
  
  {
    id: 'resistencia-paranormal',
    name: 'Resistência Paranormal',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Você recebe resistência a dano paranormal 5.',
    pageReference: 'Livro Base p.54',
    effects: {
      base: {
        kind: 'passive',
        damageReduction: {
          value: 5,
          types: ['paranormal'],
        },
      },
    },
    tags: ['defesa', 'resistência', 'paranormal'],
  },
  
  {
    id: 'sangue-extradimensional',
    name: 'Sangue Extradimensional',
    classId: 'Ocultista',
    isCore: false,
    minNex: 15,
    description: 'Você pode gastar PV no lugar de PE para lançar rituais (na proporção de 2 PV por PE). Caso sofra dano, você deve fazer um teste de Vontade (DT = 10 + dano sofrido) para não perder a concentração em rituais sustentados.',
    pageReference: 'Livro Base p.54',
    effects: {
      base: {
        kind: 'passive',
        hpAsPE: {
          ratio: 2, // 2 PV = 1 PE
        },
      },
    },
    tags: ['ritual', 'pv', 'pe'],
  },
];

/**
 * Retorna todos os poderes core do Ocultista
 */
export function getOcultistaCorePowers(): UnifiedClassPower[] {
  return OCULTISTA_POWERS.filter(p => p.isCore);
}

/**
 * Retorna todos os poderes escolhíveis do Ocultista
 */
export function getOcultistaChoosablePowers(): UnifiedClassPower[] {
  return OCULTISTA_POWERS.filter(p => !p.isCore);
}

/**
 * Retorna poderes disponíveis para um NEX específico
 */
export function getOcultistaPowersAtNex(nex: number): UnifiedClassPower[] {
  return OCULTISTA_POWERS.filter(p => p.minNex <= nex);
}

/**
 * Retorna o círculo máximo de rituais disponível para um NEX
 */
export function getMaxRitualCircle(nex: number): number {
  if (nex >= 85) return 4;
  if (nex >= 55) return 3;
  if (nex >= 25) return 2;
  return 1;
}
