/**
 * Poderes de Classe: ESPECIALISTA
 * Ordem Paranormal RPG v1.3 - Livro Base
 * 
 * O Especialista é a classe focada em perícias, investigação e 
 * adaptabilidade. Seus poderes oferecem versatilidade em testes,
 * bônus de perícia e habilidades de suporte.
 */

import { UnifiedClassPower } from './types';

/**
 * Todos os poderes do Especialista, incluindo habilidades core e escolhíveis
 */
export const ESPECIALISTA_POWERS: UnifiedClassPower[] = [
  // ==================== HABILIDADES CORE (AUTOMÁTICAS) ====================
  
  {
    id: 'ecletico',
    name: 'Eclético',
    classId: 'Especialista',
    isCore: true,
    minNex: 5,
    description: 'Quando faz um teste de uma perícia, você pode gastar 2 PE para receber os benefícios de ser treinado nessa perícia.',
    pageReference: 'Livro Base p.49',
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 2,
          action: 'free',
        },
      },
    },
    tags: ['perícia', 'versatilidade'],
  },
  
  {
    id: 'perito',
    name: 'Perito',
    classId: 'Especialista',
    isCore: true,
    minNex: 5,
    description: 'Escolha duas perícias nas quais você é treinado (exceto Luta e Pontaria). Quando faz um teste de uma dessas perícias, pode gastar 2 PE para somar +1d6 ao resultado. Conforme avança de NEX, o dado e custo melhoram: +1d8 (3 PE) em NEX 25%, +1d10 (4 PE) em NEX 55%, +1d12 (5 PE) em NEX 85%.',
    pageReference: 'Livro Base p.49',
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 2,
          action: 'free',
        },
        requiresChoice: {
          type: 'skill',
          count: 2,
        },
        skillBonuses: [{
          skill: [], // Definido pela escolha
          value: 0, // +1d6 (calculado em runtime)
        }],
      },
      progression: {
        25: {
          kind: 'activated',
          activation: { cost: 3, action: 'free' },
          // +1d8
        },
        55: {
          kind: 'activated',
          activation: { cost: 4, action: 'free' },
          // +1d10
        },
        85: {
          kind: 'activated',
          activation: { cost: 5, action: 'free' },
          // +1d12
        },
      },
    },
    tags: ['perícia', 'dados-extras', 'escalável'],
  },
  
  {
    id: 'habilidade-trilha-especialista',
    name: 'Habilidade de Trilha',
    classId: 'Especialista',
    isCore: true,
    minNex: 10,
    description: 'Em NEX 10%, você escolhe uma das trilhas de especialista disponíveis e recebe o primeiro poder da trilha escolhida. Você recebe um novo poder da trilha escolhida em NEX 40%, 65% e 99%.',
    pageReference: 'Livro Base p.49',
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
    id: 'aumento-atributo-20-esp',
    name: 'Aumento de Atributo',
    classId: 'Especialista',
    isCore: true,
    minNex: 20,
    description: 'Aumente um atributo em +1. Você não pode aumentar um atributo além de 5 dessa forma.',
    pageReference: 'Livro Base p.49',
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
    id: 'grau-treinamento-35-esp',
    name: 'Grau de Treinamento',
    classId: 'Especialista',
    isCore: true,
    minNex: 35,
    description: 'Escolha um número de perícias treinadas igual a 5 + Int. O grau de treinamento dessas perícias aumenta em um nível (treinado → veterano → expert).',
    pageReference: 'Livro Base p.49',
    effects: {
      base: {
        kind: 'choice',
        skillTraining: {
          count: 5, // +Int calculado em runtime
          targetLevel: 'veteran',
        },
      },
    },
    tags: ['progressão', 'perícia'],
  },
  
  {
    id: 'engenhosidade',
    name: 'Engenhosidade',
    classId: 'Especialista',
    isCore: true,
    minNex: 40,
    description: 'Em NEX 40%, quando usa sua habilidade Eclético, você pode gastar 2 PE adicionais para receber os benefícios de ser veterano na perícia. Em NEX 75%, você pode gastar 4 PE adicionais para receber os benefícios de ser expert na perícia.',
    pageReference: 'Livro Base p.49',
    effects: {
      base: {
        kind: 'passive',
        // Melhora o Eclético
        peModifiers: [{
          value: -2, // Custo adicional
          targets: ['ecletico-veterano'],
        }],
      },
      progression: {
        75: {
          kind: 'passive',
          peModifiers: [{
            value: -4,
            targets: ['ecletico-expert'],
          }],
        },
      },
    },
    tags: ['perícia', 'versatilidade', 'escalável'],
  },
  
  {
    id: 'aumento-atributo-50-esp',
    name: 'Aumento de Atributo',
    classId: 'Especialista',
    isCore: true,
    minNex: 50,
    description: 'Aumente um atributo em +1. Você não pode aumentar um atributo além de 5 dessa forma.',
    pageReference: 'Livro Base p.49',
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
    id: 'versatilidade-esp',
    name: 'Versatilidade',
    classId: 'Especialista',
    isCore: true,
    minNex: 50,
    description: 'Escolha entre receber um poder de especialista ou o primeiro poder de uma trilha de especialista que não a sua.',
    pageReference: 'Livro Base p.49',
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
    id: 'grau-treinamento-70-esp',
    name: 'Grau de Treinamento',
    classId: 'Especialista',
    isCore: true,
    minNex: 70,
    description: 'Escolha um número de perícias treinadas igual a 5 + Int. O grau de treinamento dessas perícias aumenta em um nível (treinado → veterano → expert).',
    pageReference: 'Livro Base p.49',
    effects: {
      base: {
        kind: 'choice',
        skillTraining: {
          count: 5,
          targetLevel: 'veteran',
        },
      },
    },
    tags: ['progressão', 'perícia'],
  },
  
  {
    id: 'aumento-atributo-80-esp',
    name: 'Aumento de Atributo',
    classId: 'Especialista',
    isCore: true,
    minNex: 80,
    description: 'Aumente um atributo em +1. Você não pode aumentar um atributo além de 5 dessa forma.',
    pageReference: 'Livro Base p.49',
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
    id: 'aumento-atributo-95-esp',
    name: 'Aumento de Atributo',
    classId: 'Especialista',
    isCore: true,
    minNex: 95,
    description: 'Aumente um atributo em +1. Você não pode aumentar um atributo além de 5 dessa forma.',
    pageReference: 'Livro Base p.49',
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
    id: 'artista-marcial-esp',
    name: 'Artista Marcial',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Seus ataques desarmados causam 1d6 de dano, podendo causar dano letal e contam como armas ágeis. Em NEX 35%, o dano aumenta para 1d8 e, em NEX 70%, para 1d10.',
    pageReference: 'Livro Base p.50',
    effects: {
      base: {
        kind: 'scaling',
        grantsUnarmedDamage: {
          baseDice: '1d6',
          scaling: [
            { nex: 35, dice: '1d8' },
            { nex: 70, dice: '1d10' },
          ],
        },
        grantsAgileProperty: true,
      },
    },
    tags: ['combate', 'desarmado', 'escalável'],
  },
  
  {
    id: 'balistica-avancada',
    name: 'Balística Avançada',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Você recebe proficiência com armas táticas de fogo e +2 em rolagens de dano com armas de fogo.',
    pageReference: 'Livro Base p.50',
    effects: {
      base: {
        kind: 'passive',
        proficiencies: {
          weapons: ['tactical'],
        },
        damageBonus: {
          value: 2,
          conditions: {
            weaponType: 'firearm',
          },
        },
      },
    },
    tags: ['proficiência', 'dano', 'arma-de-fogo'],
  },
  
  {
    id: 'conhecimento-aplicado',
    name: 'Conhecimento Aplicado',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Quando faz um teste de perícia (exceto Luta e Pontaria), você pode gastar 2 PE para mudar o atributo-base da perícia para Intelecto. Pré-requisito: Int 2.',
    pageReference: 'Livro Base p.50',
    prerequisites: {
      attributes: { intellect: 2 },
    },
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 2,
          action: 'free',
        },
        attributeSwap: {
          skills: [], // Todas exceto Luta e Pontaria
          newAttribute: 'intellect',
          cost: 2,
        },
      },
    },
    tags: ['perícia', 'versatilidade'],
  },
  
  {
    id: 'hacker',
    name: 'Hacker',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Você recebe +5 em testes de Tecnologia para invadir sistemas e elimina o tempo necessário para hackear qualquer sistema para uma ação completa. Pré-requisito: treinado em Tecnologia.',
    pageReference: 'Livro Base p.50',
    prerequisites: {
      skills: [{ skill: 'tecnologia', level: 'trained' }],
    },
    effects: {
      base: {
        kind: 'passive',
        skillBonuses: [{
          skill: 'tecnologia',
          value: 5,
        }],
      },
    },
    tags: ['perícia', 'tecnologia'],
  },
  
  {
    id: 'maos-rapidas',
    name: 'Mãos Rápidas',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Ao fazer um teste de Crime, você pode pagar 1 PE para fazê-lo como uma ação livre. Pré-requisitos: Agi 3, treinado em Crime.',
    pageReference: 'Livro Base p.50',
    prerequisites: {
      attributes: { agility: 3 },
      skills: [{ skill: 'crime', level: 'trained' }],
    },
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 1,
          action: 'free',
        },
      },
    },
    tags: ['perícia', 'crime', 'ação-livre'],
  },
  
  {
    id: 'mochila-utilidades',
    name: 'Mochila de Utilidades',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Um item à sua escolha (exceto armas) conta como se estivesse uma categoria abaixo e ocupa 1 espaço a menos.',
    pageReference: 'Livro Base p.50',
    effects: {
      base: {
        kind: 'passive',
        requiresChoice: {
          type: 'skill', // Item
          count: 1,
        },
      },
    },
    tags: ['utilidade', 'inventário'],
  },
  
  {
    id: 'movimento-tatico',
    name: 'Movimento Tático',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Você pode gastar 1 PE para ignorar penalidades em deslocamento por terreno difícil e se posicionar até o final do turno. Pré-requisito: treinado em Atletismo.',
    pageReference: 'Livro Base p.50',
    prerequisites: {
      skills: [{ skill: 'atletismo', level: 'trained' }],
    },
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 1,
          action: 'free',
        },
      },
    },
    tags: ['movimento', 'tático'],
  },
  
  {
    id: 'na-trilha-certa',
    name: 'Na Trilha Certa',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Sempre que tiver sucesso em um teste para procurar pistas, você pode gastar 1 PE para receber +5 no próximo teste. Os custos e os bônus são cumulativos.',
    pageReference: 'Livro Base p.50',
    effects: {
      base: {
        kind: 'triggered',
        activation: {
          cost: 1,
          action: 'free',
        },
        skillBonuses: [{
          skill: 'investigacao',
          value: 5,
        }],
        conditions: {
          duringInvestigation: true,
        },
      },
    },
    tags: ['investigação', 'cumulativo'],
  },
  
  {
    id: 'nerd',
    name: 'Nerd',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Você é um repositório de conhecimento útil (e inútil). Uma vez por cena, pode gastar 2 PE para fazer um teste de Atualidades (DT 20). Se passar: Em investigação: recebe uma pista extra. Em combate: descobre uma fraqueza do inimigo. Em outro contexto: o mestre fornece uma informação relevante.',
    pageReference: 'Livro Base p.50',
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 2,
          action: 'standard',
          perScene: true,
        },
      },
    },
    tags: ['conhecimento', 'utilidade'],
  },
  
  {
    id: 'ninja-urbano',
    name: 'Ninja Urbano',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Você recebe proficiência com armas táticas de ataque corpo a corpo e de disparo e recebe +2 em rolagens de dano com essas armas.',
    pageReference: 'Livro Base p.50',
    effects: {
      base: {
        kind: 'passive',
        proficiencies: {
          weapons: ['tactical'],
        },
        damageBonus: {
          value: 2,
          conditions: {
            weaponType: 'tactical',
          },
        },
      },
    },
    tags: ['proficiência', 'dano', 'tático'],
  },
  
  {
    id: 'pensamento-agil',
    name: 'Pensamento Ágil',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Uma vez por rodada, durante uma cena de investigação, você pode gastar 2 PE para fazer uma ação de procurar pistas adicional.',
    pageReference: 'Livro Base p.51',
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 2,
          action: 'none',
          perRound: true,
        },
        extraActions: [{
          actionType: 'investigation',
          cost: 2,
        }],
        conditions: {
          duringInvestigation: true,
        },
      },
    },
    tags: ['investigação', 'ação-extra'],
  },
  
  {
    id: 'perito-explosivos',
    name: 'Perito em Explosivos',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Você soma seu Intelecto à DT para resistir aos seus explosivos e pode excluir um número de alvos da explosão igual ao seu valor de Intelecto.',
    pageReference: 'Livro Base p.51',
    effects: {
      base: {
        kind: 'passive',
        // Modificadores especiais para explosivos
      },
    },
    tags: ['explosivos', 'especialização'],
  },
  
  {
    id: 'primeira-impressao',
    name: 'Primeira Impressão',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Você recebe +5 no primeiro teste de Diplomacia, Enganação, Intimidação ou Intuição que fizer em uma cena.',
    pageReference: 'Livro Base p.51',
    effects: {
      base: {
        kind: 'passive',
        skillBonuses: [
          { skill: 'diplomacia', value: 5, conditions: { firstInScene: true } },
          { skill: 'enganacao', value: 5, conditions: { firstInScene: true } },
          { skill: 'intimidacao', value: 5, conditions: { firstInScene: true } },
          { skill: 'intuicao', value: 5, conditions: { firstInScene: true } },
        ],
      },
    },
    tags: ['social', 'primeiro-contato'],
  },
  
  {
    id: 'transcender-esp',
    name: 'Transcender',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Escolha um poder paranormal (veja p. 114). Você recebe o poder escolhido, mas não ganha Sanidade nem aumento de NEX. Você pode escolher este poder várias vezes.',
    pageReference: 'Livro Base p.51',
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
    id: 'treinamento-pericia-esp',
    name: 'Treinamento em Perícia',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Escolha duas perícias. Em NEX 35%, pode escolher perícias treinadas para se tornarem veteranas. Em NEX 70%, pode escolher perícias veteranas para se tornarem expert. Você pode escolher este poder várias vezes.',
    pageReference: 'Livro Base p.51',
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
];

/**
 * Retorna todos os poderes core do Especialista
 */
export function getEspecialistaCorePowers(): UnifiedClassPower[] {
  return ESPECIALISTA_POWERS.filter(p => p.isCore);
}

/**
 * Retorna todos os poderes escolhíveis do Especialista
 */
export function getEspecialistaChoosablePowers(): UnifiedClassPower[] {
  return ESPECIALISTA_POWERS.filter(p => !p.isCore);
}

/**
 * Retorna poderes disponíveis para um NEX específico
 */
export function getEspecialistaPowersAtNex(nex: number): UnifiedClassPower[] {
  return ESPECIALISTA_POWERS.filter(p => p.minNex <= nex);
}
