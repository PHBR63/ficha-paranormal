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
    pageReference: 'Livro Base v1.3, p.28',
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
    pageReference: 'Livro Base v1.3, p.28',
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
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
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
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
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
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    effects: {
      base: {
        kind: 'choice',
        skillTraining: {
          count: 5,
          dynamicCount: true,     // Quantidade = 5 + Intelecto
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
    pageReference: 'Livro Base v1.3, p.30',
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
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
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
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
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
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    effects: {
      base: {
        kind: 'choice',
        skillTraining: {
          count: 5,
          dynamicCount: true,        // Quantidade = 5 + Intelecto
          targetLevel: 'expert',     // Permite até expert
          allowMultipleLevels: true, // Pode escolher treinado→veterano OU veterano→expert
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
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
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
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
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
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
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
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
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
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
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
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
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
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
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
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    effects: {
      base: {
        kind: 'passive',
        requiresChoice: {
          type: 'item',
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
    // Corrigido: texto oficial usa "por escalar" e não "se posicionar"
    description: 'Você pode gastar 1 PE para ignorar a penalidade em deslocamento por terreno difícil e por escalar até o final do turno. Pré-requisito: treinado em Atletismo.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
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
    // CRÍTICO: Corrigido de +5 para +1d20 conforme texto oficial
    // Os custos e bônus são cumulativos (1 PE = +1d20, 2 PE = +2d20, etc.)
    description: 'Sempre que tiver sucesso em um teste para procurar pistas, você pode gastar 1 PE para receber +1d20 no próximo teste. Os custos e os bônus são cumulativos: se passar num segundo teste, pode pagar 2 PE para receber um total de +2d20 no próximo teste, e assim por diante.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    effects: {
      base: {
        kind: 'triggered',
        activation: {
          cost: 1, // Custo base, aumenta cumulativamente
          action: 'free',
        },
        // Dados extras ao invés de bônus fixo
        extraDice: {
          die: 'd20',
          count: 1,
          cumulative: true, // Cada uso adicional na cena soma +1d20 e +1 PE
        },
        conditions: {
          onSuccessfulClueSearch: true, // Requer sucesso em procurar pistas
        },
      },
    },
    tags: ['investigação', 'cumulativo', 'dados-extras'],
  },
  
  {
    id: 'nerd',
    name: 'Nerd',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Você é um repositório de conhecimento útil (e inútil). Uma vez por cena, pode gastar 2 PE para fazer um teste de Atualidades (DT 20). Se passar: Em investigação: recebe uma pista extra. Em combate: descobre uma fraqueza do inimigo. Em outro contexto: o mestre fornece uma informação relevante.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
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
    // Corrigido: texto oficial EXCLUI armas de fogo da proficiência e do bônus de dano
    description: 'Você recebe proficiência com armas táticas de ataque corpo a corpo e de disparo (exceto de fogo) e +2 em rolagens de dano com armas de corpo a corpo e de disparo.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    effects: {
      base: {
        kind: 'passive',
        // Proficiência em táticas corpo a corpo e disparo SEM armas de fogo
        proficiencies: {
          weapons: ['tactical-melee', 'tactical-ranged-nonfirearm'],
        },
        damageBonus: {
          value: 2,
          conditions: {
            // Bônus apenas para corpo a corpo e disparo (exclui armas de fogo)
            weaponType: ['melee', 'ranged-nonfirearm'],
          },
        },
      },
    },
    tags: ['proficiência', 'dano', 'tático', 'corpo-a-corpo', 'disparo'],
  },
  
  {
    id: 'pensamento-agil',
    name: 'Pensamento Ágil',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Uma vez por rodada, durante uma cena de investigação, você pode gastar 2 PE para fazer uma ação de procurar pistas adicional.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
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
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
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
    // CRÍTICO: Corrigido de +5 para +1d20 conforme texto oficial
    description: 'Você recebe +1d20 no primeiro teste de Diplomacia, Enganação, Intimidação ou Intuição que fizer em uma cena.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    effects: {
      base: {
        kind: 'passive',
        // Dado extra ao invés de bônus fixo
        extraDice: {
          die: 'd20',
          count: 1,
          skills: ['diplomacia', 'enganacao', 'intimidacao', 'intuicao'],
          conditions: { firstInScene: true },
        },
      },
    },
    tags: ['social', 'primeiro-contato', 'dados-extras'],
  },
  
  {
    id: 'transcender-esp',
    name: 'Transcender',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    // Corrigido: texto oficial diz "não ganha Sanidade neste aumento de NEX" (sem menção a NEX)
    description: 'Escolha um poder paranormal (veja a página 114). Você recebe o poder escolhido, mas não ganha Sanidade neste aumento de NEX. Você pode escolher este poder várias vezes.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    isRepeatable: true,
    effects: {
      base: {
        kind: 'repeatable',
        grantsPower: 'paranormal',
        requiresChoice: {
          type: 'power',
          count: 1,
        },
        // Penalidade: não ganha Sanidade neste aumento de NEX
        noSanityGain: true,
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
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
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
  
  // ==================== PODERES ADICIONAIS (Livro Base p.50-52) ====================
  
  {
    id: 'adaptabilidade',
    name: 'Adaptabilidade',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Quando você falha em um teste, pode gastar 1 PE para rolar novamente, somando +1 no segundo teste para cada vez que usou este poder na cena. Você pode usar este poder uma vez por rodada.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    effects: {
      base: {
        kind: 'triggered',
        activation: {
          cost: 1,
          action: 'reaction',
          perRound: true,
        },
        // Re-roll com bônus cumulativo
      },
    },
    tags: ['perícia', 'rolagem', 'reação'],
  },
  
  {
    id: 'aparas-precisas',
    name: 'Aparas Precisas',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Quando está empunhando uma arma leve corpo a corpo, você soma sua Agilidade na Defesa (limitado pela Defesa base da proteção que estiver usando, se houver). Pré-requisitos: Agi 3, treinado em Luta.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    prerequisites: {
      attributes: { agility: 3 },
      skills: [{ skill: 'luta', level: 'trained' }],
    },
    effects: {
      base: {
        kind: 'passive',
        defenseBonus: {
          attribute: 'agility',
          conditions: {
            weaponType: 'light-melee',
          },
        },
      },
    },
    tags: ['defesa', 'corpo-a-corpo', 'passivo'],
  },
  
  {
    id: 'assassinato',
    name: 'Assassinato',
    classId: 'Especialista',
    isCore: false,
    minNex: 45,
    description: 'Quando você acerta um ataque contra um alvo desprevenido, pode gastar 2 PE para rolar novamente todos os dados de dano que não resultaram em seu valor máximo. Pré-requisitos: NEX 45%, treinado em Furtividade.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    prerequisites: {
      minNex: 45,
      skills: [{ skill: 'furtividade', level: 'trained' }],
    },
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 2,
          action: 'free',
        },
        conditions: {
          targetConditions: ['surprised'],
        },
      },
    },
    tags: ['combate', 'dano', 'furtividade'],
  },
  
  {
    id: 'evasao',
    name: 'Evasão',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Quando sofre um efeito que permite um teste de resistência para reduzir o dano à metade, você não sofre nenhum dano se passar. Você ainda sofre dano normal se falhar. Pré-requisito: Agi 3.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    prerequisites: {
      attributes: { agility: 3 },
    },
    effects: {
      base: {
        kind: 'passive',
        // Evasão completa em testes de resistência
      },
    },
    tags: ['defesa', 'resistência', 'passivo'],
  },
  
  {
    id: 'eu-atiro-primeiro',
    name: 'Eu Atiro Primeiro',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Você recebe +5 em testes de Iniciativa e pode sacar uma arma como ação livre.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    effects: {
      base: {
        kind: 'passive',
        skillBonuses: [{
          skill: 'iniciativa',
          value: 5,
        }],
      },
    },
    tags: ['iniciativa', 'combate'],
  },
  
  {
    id: 'explorar-fraqueza',
    name: 'Explorar Fraqueza',
    classId: 'Especialista',
    isCore: false,
    minNex: 30,
    description: 'Quando você acerta um ataque contra um inimigo que teve uma fraqueza revelada por meio de um teste de perícia (como Intuição ou Ocultismo), pode gastar 2 PE para aumentar o dano causado em +2d6. Pré-requisito: NEX 30%.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    prerequisites: {
      minNex: 30,
    },
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 2,
          action: 'free',
        },
        damageBonus: {
          extraDice: '+2d6',
        },
        conditions: {
          weaknessRevealed: true,
        },
      },
    },
    tags: ['combate', 'dano', 'investigação'],
  },
  
  {
    id: 'ligeireza',
    name: 'Ligeireza',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Seu deslocamento aumenta em +3m.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    effects: {
      base: {
        kind: 'passive',
        movementBonus: 3,
      },
    },
    tags: ['movimento', 'passivo'],
  },
  
  {
    id: 'medicina-campo',
    name: 'Medicina de Campo',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Quando você faz um teste de Medicina para primeiros socorros, o paciente recupera 1d6 PV (além de estabilizar se estiver morrendo). O dado aumenta para 2d6 em NEX 35%, 3d6 em NEX 55% e 4d6 em NEX 75%. Pré-requisito: treinado em Medicina.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    prerequisites: {
      skills: [{ skill: 'medicina', level: 'trained' }],
    },
    effects: {
      base: {
        kind: 'scaling',
        healingDice: '1d6',
      },
      progression: {
        35: { kind: 'scaling', healingDice: '2d6' },
        55: { kind: 'scaling', healingDice: '3d6' },
        75: { kind: 'scaling', healingDice: '4d6' },
      },
    },
    tags: ['cura', 'medicina', 'escalável'],
  },
  
  {
    id: 'perdido-multidao',
    name: 'Perdido na Multidão',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Você pode gastar 1 PE e uma ação de movimento para desaparecer em uma multidão. Enquanto houver um número de pessoas igual ou maior que 10 num raio de 30m, você fica oculto e pode se esconder mesmo sem ter onde se esconder. Pré-requisito: treinado em Furtividade.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    prerequisites: {
      skills: [{ skill: 'furtividade', level: 'trained' }],
    },
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 1,
          action: 'movement',
        },
        conditions: {
          crowdPresent: true,
        },
      },
    },
    tags: ['furtividade', 'social'],
  },
  
  {
    id: 'perito-medico',
    name: 'Perito Médico',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Você recebe +5 em testes de Medicina e pode usar um kit médico para tratar de um paciente em uma ação padrão (em vez de ação completa). Pré-requisito: treinado em Medicina.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    prerequisites: {
      skills: [{ skill: 'medicina', level: 'trained' }],
    },
    effects: {
      base: {
        kind: 'passive',
        skillBonuses: [{
          skill: 'medicina',
          value: 5,
        }],
      },
    },
    tags: ['perícia', 'medicina'],
  },
  
  {
    id: 'sabotador',
    name: 'Sabotador',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Você recebe +5 em testes de Crime para sabotagem e pode fazer esses testes como uma ação padrão (em vez de ação de intento). Pré-requisito: treinado em Crime.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    prerequisites: {
      skills: [{ skill: 'crime', level: 'trained' }],
    },
    effects: {
      base: {
        kind: 'passive',
        skillBonuses: [{
          skill: 'crime',
          value: 5,
        }],
      },
    },
    tags: ['perícia', 'crime'],
  },
  
  {
    id: 'mente-investigativa',
    name: 'Mente Investigativa',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Você recebe +1 em Intelecto, até um máximo de 5.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    effects: {
      base: {
        kind: 'passive',
        attributeBonus: {
          attribute: 'intellect',
          value: 1,
          max: 5,
        },
      },
    },
    tags: ['atributo', 'passivo'],
  },
  
  {
    id: 'prestidigitacao',
    name: 'Prestidigitação',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Você pode roubar um objeto pequeno de uma criatura em alcance corpo a corpo sem ser notado. Faça um teste de Crime oposto pela Percepção da vítima. Se você passar, rouba o item. Se falhar, não rouba e a vítima percebe a tentativa.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 0,
          action: 'standard',
        },
      },
    },
    tags: ['crime', 'utilidade'],
  },
  
  {
    id: 'veneficio',
    name: 'Venefício',
    classId: 'Especialista',
    isCore: false,
    minNex: 15,
    description: 'Você sabe criar e aplicar venenos. Você pode comprar venenos e aplicá-los em armas ou bebidas. Além disso, recebe +5 em testes de Fortitude contra venenos.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.28–31',
    effects: {
      base: {
        kind: 'passive',
        resistanceBonus: {
          value: 5,
          types: ['poison'],
        },
      },
    },
    tags: ['veneno', 'resistência'],
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
