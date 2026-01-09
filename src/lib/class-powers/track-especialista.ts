/**
 * Trilhas do Especialista - Ordem Paranormal RPG v1.3
 * 
 * Define as 5 trilhas oficiais do Especialista com efeitos mecânicos estruturados:
 * - Atirador de Elite: Precisão mortal com armas de fogo de longo alcance
 * - Infiltrador: Furtividade e ataques furtivos
 * - Médico de Campo: Cura e suporte médico
 * - Negociador: Manipulação social e diplomacia
 * - Técnico: Inventário e equipamentos
 * 
 * @module track-especialista
 */

import type { UnifiedTrack } from './track-types';

/**
 * Trilhas oficiais do Especialista
 */
export const ESPECIALISTA_TRACKS: UnifiedTrack[] = [
  // ==========================================================================
  // ATIRADOR DE ELITE
  // Precisão com armas de fogo de longo alcance
  // ==========================================================================
  {
    id: 'atirador-elite',
    name: 'Atirador de Elite',
    classId: 'Especialista',
    description: 'Um tiro, uma morte. Ao contrário dos combatentes, você é perito em neutralizar ameaças à distância, terminando uma briga antes mesmo que ela comece. Você trata sua arma como uma ferramenta de precisão, sendo capaz de executar façanhas incríveis.',
    pageReference: 'Livro Base p.54',
    abilities: [
      {
        id: 'mira-elite',
        name: 'Mira de Elite',
        trackId: 'atirador-elite',
        minNex: 10,
        description: 'Você recebe proficiência com armas de fogo que usam balas longas e soma seu Intelecto nas rolagens de dano com essas armas.',
        pageReference: 'Livro Base p.54',
        isInitial: true,
        effects: {
          base: {
            kind: 'passive',
            proficiencies: ['armas-fogo-longas'],
            damageBonus: {
              attribute: 'intellect',
              conditions: { weaponType: 'firearm-long' }
            }
          }
        },
        tags: ['passivo', 'proficiência', 'dano', 'armas-longas']
      },
      {
        id: 'disparo-letal',
        name: 'Disparo Letal',
        trackId: 'atirador-elite',
        minNex: 40,
        description: 'Uma vez por rodada, quando faz a ação Mirar, você pode gastar 1 PE para aumentar em +2 a margem de ameaça do próximo ataque que fizer até o final de seu próximo turno.',
        pageReference: 'Livro Base p.54',
        effects: {
          base: {
            kind: 'activated',
            activation: {
              cost: 1,
              action: 'free', // Parte da ação mirar
              trigger: 'on-aim',
              perRound: true, // Uma vez por rodada
            },
            criticalBonus: {
              marginBonus: 2,
              duration: 'next-turn', // Até o final do próximo turno
            }
          }
        },
        tags: ['ativado', 'crítico', 'mirar', 'uma-vez-por-rodada']
      },
      {
        id: 'disparo-impactante',
        name: 'Disparo Impactante',
        trackId: 'atirador-elite',
        minNex: 65,
        description: 'Quando ataca com uma arma de fogo, você pode gastar 2 PE e, em vez de causar dano, fazer uma manobra entre: derrubar, desarmar, empurrar ou quebrar.',
        pageReference: 'Livro Base p.54',
        effects: {
          base: {
            kind: 'activated',
            activation: {
              cost: 2,
              action: 'free' // Substitui dano do ataque
            },
            extraActions: [{
              type: 'maneuver',
              maneuverOptions: ['derrubar', 'desarmar', 'empurrar', 'quebrar'],
              trigger: 'on-firearm-hit',
              replaceDamage: true
            }]
          }
        },
        tags: ['ativado', 'manobra', 'arma-de-fogo', 'controle']
      },
      {
        id: 'atirar-matar',
        name: 'Atirar para Matar',
        trackId: 'atirador-elite',
        minNex: 99,
        description: 'Quando faz um acerto crítico com uma arma de fogo, você causa dano máximo, sem precisar rolar os dados.',
        pageReference: 'Livro Base p.54',
        effects: {
          base: {
            kind: 'triggered',
            // Dano máximo em crítico com arma de fogo
            maximumDamageOnCritical: {
              weaponType: 'firearm'
            }
          }
        },
        tags: ['passivo', 'crítico', 'dano-máximo', 'arma-de-fogo']
      }
    ],
    tags: ['combate', 'precisão', 'armas-de-fogo']
  },

  // ==========================================================================
  // INFILTRADOR
  // Furtividade e ataques furtivos
  // ==========================================================================
  {
    id: 'infiltrador',
    name: 'Infiltrador',
    classId: 'Especialista',
    description: 'Você é um perito em infiltração e sabe neutralizar alvos desprevenidos sem causar alarde. Combinando talento acrobático, destreza manual e conhecimento técnico, você é capaz de superar qualquer barreira de defesa, mesmo quando a missão parece impossível.',
    pageReference: 'Livro Base p.54',
    abilities: [
      {
        id: 'ataque-furtivo-trilha',
        name: 'Ataque Furtivo',
        trackId: 'infiltrador',
        minNex: 10,
        description: 'Você sabe atingir os pontos vitais de um inimigo distraído. Uma vez por rodada, quando atinge um alvo desprevenido com um ataque corpo a corpo ou em alcance curto, ou um alvo que você esteja flanqueando, você pode gastar 1 PE para causar +1d6 pontos de dano do mesmo tipo da arma. O dano adicional aumenta para +2d6 em NEX 40%, +3d6 em NEX 65% e +4d6 em NEX 99%.',
        pageReference: 'Livro Base p.54',
        isInitial: true,
        effects: {
          base: {
            kind: 'scaling',
            activation: {
              cost: 1,
              action: 'free',
              perRound: true
            },
            sneakAttack: {
              scaling: {
                5: { dice: 1, dieType: 'd6' },
                10: { dice: 1, dieType: 'd6' },
                40: { dice: 2, dieType: 'd6' },
                65: { dice: 3, dieType: 'd6' },
                99: { dice: 4, dieType: 'd6' }
              },
              // Condições: alvo desprevenido OU flanqueado
              conditions: ['target-unaware', 'target-flanked'],
              // Restrição de alcance: corpo a corpo OU curto
              rangeRestriction: ['melee', 'short'],
              peCost: 1,
              usesPerRound: 1
            }
          }
        },
        tags: ['ativado', 'dano-extra', 'furtividade', 'escalonamento', 'uma-vez-por-rodada']
      },
      {
        id: 'gatuno',
        name: 'Gatuno',
        trackId: 'infiltrador',
        minNex: 40,
        description: 'Você recebe +5 em Atletismo e Crime e pode percorrer seu deslocamento normal quando se esconder sem penalidade (veja a perícia Furtividade).',
        pageReference: 'Livro Base p.54',
        effects: {
          base: {
            kind: 'passive',
            skillBonus: {
              skills: ['atletismo', 'crime'],
              bonus: 5
            },
            // Remove penalidade de movimento ao se esconder
            stealthMovementPenalty: false
          }
        },
        tags: ['passivo', 'perícia', 'furtividade', 'movimento']
      },
      {
        id: 'assassinar',
        name: 'Assassinar',
        trackId: 'infiltrador',
        minNex: 65,
        description: 'Você pode gastar uma ação de movimento e 3 PE para analisar um alvo em alcance curto. Até o final do seu próximo turno, seu primeiro Ataque Furtivo que causar dano a ele tem seus dados de dano extras dessa habilidade dobrados. Além disso, se sofrer dano de seu ataque, o alvo fica inconsciente ou morrendo, à sua escolha (Fortitude — DT Agi evita).',
        pageReference: 'Livro Base p.54',
        effects: {
          base: {
            kind: 'activated',
            activation: {
              cost: 3,
              action: 'movement',
              range: 'short'  // Alcance curto para analisar o alvo
            },
            duration: 'next-turn',  // Até o final do próximo turno
            // Dobra dados do Ataque Furtivo
            sneakAttackMultiplier: 2,
            // Controle de estado do alvo
            targetStateControl: {
              options: ['unconscious', 'dying'],
              resistanceTest: 'fortitude',
              dtAttribute: 'agility'
            }
          }
        },
        tags: ['ativado', 'assassinato', 'dano-dobrado', 'controle']
      },
      {
        id: 'sombra-fugaz',
        name: 'Sombra Fugaz',
        trackId: 'infiltrador',
        minNex: 99,
        description: 'Quando faz um teste de Furtividade após atacar ou fazer outra ação chamativa, você pode gastar 3 PE para não sofrer a penalidade de –3d20 no teste.',
        pageReference: 'Livro Base p.54',
        effects: {
          base: {
            kind: 'activated',
            activation: {
              cost: 3,
              action: 'free'
            },
            // Remove penalidade de -3d20 em Furtividade após ação chamativa (v1.3)
            ignoreStealthPenalty: {
              type: 'dice-penalty',
              value: 3  // -3d20
            }
          }
        },
        tags: ['ativado', 'furtividade', 'assassinato']
      }
    ],
    tags: ['furtividade', 'assassinato', 'infiltração']
  },

  // ==========================================================================
  // MÉDICO DE CAMPO
  // Cura e suporte médico
  // Requisito Especial: Treinado em Medicina + kit de medicina
  // ==========================================================================
  {
    id: 'medico-campo',
    name: 'Médico de Campo',
    classId: 'Especialista',
    description: 'Você é treinado em técnicas de primeiros socorros e tratamento de emergência, o que torna você um membro valioso para qualquer grupo de agentes. Ao contrário dos profissionais de saúde convencionais, você está acostumado com o campo de batalha e sabe tomar decisões rápidas no meio do caos.',
    pageReference: 'Livro Base p.54',
    requirements: {
      trainedSkills: ['Medicina'],
      items: ['kit de medicina']
    },
    abilities: [
      {
        id: 'paramedico',
        name: 'Paramédico',
        trackId: 'medico-campo',
        minNex: 10,
        description: 'Você pode usar 1 ação padrão e 2 PE para curar 2d10 pontos de vida de si mesmo ou de um aliado adjacente. Você pode curar +1d10 PV respectivamente em NEX 40%, 65% e 99%, gastando +1 PE por dado adicional de cura.',
        pageReference: 'Livro Base p.54',
        isInitial: true,
        effects: {
          base: {
            kind: 'scaling',
            activation: {
              cost: 2,
              action: 'standard'
            },
            healing: {
              baseDice: '2d10',
              scalingDice: {
                10: { dice: 2, dieType: 'd10' },
                40: { dice: 3, dieType: 'd10' },
                65: { dice: 4, dieType: 'd10' },
                99: { dice: 5, dieType: 'd10' }
              },
              peCost: 2,
              extraDicePECost: 1,
              range: 'touch'
            }
          }
        },
        tags: ['ativado', 'cura', 'escalonamento', 'suporte']
      },
      {
        id: 'equipe-trauma',
        name: 'Equipe de Trauma',
        trackId: 'medico-campo',
        minNex: 40,
        description: 'Você pode usar uma ação padrão e 2 PE para remover uma condição negativa (exceto morrendo) de um aliado adjacente.',
        pageReference: 'Livro Base p.54',
        effects: {
          base: {
            kind: 'activated',
            activation: {
              cost: 2,
              action: 'standard'
            },
            removeCondition: {
              range: 'touch',
              excludedConditions: ['morrendo']
            }
          }
        },
        tags: ['ativado', 'cura', 'condição', 'suporte']
      },
      {
        id: 'resgate',
        name: 'Resgate',
        trackId: 'medico-campo',
        minNex: 65,
        description: 'Uma vez por rodada, se estiver em alcance curto de um aliado machucado ou morrendo, você pode se aproximar do aliado com 1 ação livre (desde que seja capaz de fazê-lo usando seu deslocamento normal). Além disso, sempre que curar PV ou remover condições do aliado, você e o aliado recebem +5 na Defesa até o início do seu próximo turno. Por fim, para você, o total de espaços ocupados por carregar um personagem é reduzido pela metade.',
        pageReference: 'Livro Base p.54',
        effects: {
          base: {
            kind: 'passive',
            // Movimento livre para aliado machucado OU morrendo em alcance curto
            freeMovementTo: {
              conditions: ['ally-wounded', 'ally-dying'],
              range: 'short',
              perRound: true
            },
            // Bônus de Defesa ao curar (para ambos: curador e alvo)
            onHeal: {
              selfDefenseBonus: 5,
              targetDefenseBonus: 5,
              duration: 'start-of-next-turn'
            },
            // Redução de espaço ao carregar personagem
            carryingCapacity: {
              carryPersonReduction: 0.5
            }
          }
        },
        tags: ['passivo', 'movimento', 'cura', 'defesa', 'utilidade']
      },
      {
        id: 'reanimacao',
        name: 'Reanimação',
        trackId: 'medico-campo',
        minNex: 99,
        description: 'Uma vez por cena, você pode gastar uma ação completa e 10 PE para trazer de volta à vida um personagem que tenha morrido na mesma cena (exceto morte por dano massivo).',
        pageReference: 'Livro Base p.54',
        effects: {
          base: {
            kind: 'activated',
            activation: {
              cost: 10,
              action: 'complete',
              perScene: true
            },
            resurrect: {
              excludedDeathTypes: ['massive-damage'],
              sameSceneOnly: true
            }
          }
        },
        tags: ['ativado', 'ressurreição', 'cura', 'supremo']
      }
    ],
    tags: ['suporte', 'cura', 'médico']
  },

  // ==========================================================================
  // NEGOCIADOR
  // Manipulação social e diplomacia
  // ==========================================================================
  {
    id: 'negociador',
    name: 'Negociador',
    classId: 'Especialista',
    description: 'Você é um diplomata habilidoso, capaz de influenciar aliados e adversários com palavras afiadas, usando empatia, persuasão e manipulação.',
    pageReference: 'Livro Base p.54',
    abilities: [
      {
        id: 'eloquencia',
        name: 'Eloquência',
        trackId: 'negociador',
        minNex: 10,
        description: 'Você pode gastar 1 PE para afetar todas as pessoas em alcance curto com sua fala. Faça um teste de Diplomacia, Enganação ou Intimidação contra a Vontade dos alvos. Se vencer, os alvos ficam fascinados enquanto você se concentrar. Se atacar alguém, a fascinação acaba. Um alvo bem-sucedido recebe +5 em resistência e tem direito a novo teste por rodada. Uma pessoa que passe no teste fica imune a este efeito por 1 dia.',
        pageReference: 'Livro Base p.54',
        isInitial: true,
        effects: {
          base: {
            kind: 'activated',
            activation: {
              cost: 1,
              action: 'standard'
            },
            socialEffect: {
              range: 'short',
              targetAll: true,
              skillOptions: ['diplomacia', 'enganacao', 'intimidacao'],
              resistanceSkill: 'vontade',
              effect: 'fascinated',
              duration: 'concentration',
              immunityOnSuccess: '1-day'
            }
          }
        },
        tags: ['ativado', 'social', 'fascinação', 'área']
      },
      {
        id: 'discurso-motivador',
        name: 'Discurso Motivador',
        trackId: 'negociador',
        minNex: 40,
        description: 'Você pode gastar uma ação padrão e 4 PE para inspirar seus aliados. Você e todos os aliados em alcance curto ganham +1 em testes de perícia até o final da cena. Em NEX 65%, pode gastar 8 PE para conceder +2 em vez disso.',
        pageReference: 'Livro Base p.54',
        effects: {
          base: {
            kind: 'scaling',
            activation: {
              cost: 4,
              action: 'standard'
            },
            allyBuff: {
              range: 'short',
              skillBonus: 1,
              duration: 'scene',
              includeSelf: true
            }
          },
          progression: {
            65: {
              kind: 'scaling',
              activation: {
                cost: 8,
                action: 'standard'
              },
              allyBuff: {
                range: 'short',
                skillBonus: 2,
                duration: 'scene',
                includeSelf: true
              }
            }
          }
        },
        tags: ['ativado', 'suporte', 'perícia', 'aliados']
      },
      {
        id: 'eu-conheco-um-cara',
        name: 'Eu Conheço um Cara',
        trackId: 'negociador',
        minNex: 65,
        description: 'Uma vez por missão, você pode ativar sua rede de contatos para trocar equipamentos, obter informações, resgatar alguém ou resolver um problema similar. O mestre define quando essa habilidade pode ser usada e quais favores podem ser obtidos.',
        pageReference: 'Livro Base p.54',
        effects: {
          base: {
            kind: 'activated',
            activation: {
              cost: 0,
              action: 'varies',
              perMission: true
            },
            contacts: {
              effects: ['equipment-trade', 'information', 'rescue', 'problem-solving'],
              gmDiscretion: true
            }
          }
        },
        tags: ['ativado', 'contatos', 'utilidade', 'roleplay']
      },
      {
        id: 'truque-mestre',
        name: 'Truque de Mestre',
        trackId: 'negociador',
        minNex: 99,
        description: 'Você pode gastar 5 PE para simular o efeito de qualquer habilidade que tenha visto um aliado usar durante a cena. Você ignora pré-requisitos, paga todos os custos e usa os parâmetros como se tivesse a habilidade.',
        pageReference: 'Livro Base p.54',
        effects: {
          base: {
            kind: 'activated',
            activation: {
              cost: 5,
              action: 'varies'
            },
            copyAbility: {
              source: 'ally',
              seenInScene: true,
              ignorePrerequisites: true,
              payOriginalCosts: true
            }
          }
        },
        tags: ['ativado', 'cópia', 'versatilidade', 'supremo']
      }
    ],
    tags: ['social', 'diplomacia', 'manipulação']
  },

  // ==========================================================================
  // TÉCNICO
  // Inventário e equipamentos
  // ==========================================================================
  {
    id: 'tecnico',
    name: 'Técnico',
    classId: 'Especialista',
    description: 'Sua principal habilidade é a manutenção, reparo e improvisação de equipamentos, garantindo que o grupo esteja sempre preparado.',
    pageReference: 'Livro Base p.54',
    abilities: [
      {
        id: 'inventario-otimizado',
        name: 'Inventário Otimizado',
        trackId: 'tecnico',
        minNex: 10,
        description: 'Você soma seu Intelecto à Força para calcular sua capacidade de carga. Além disso, itens ocupam 1 espaço a menos (mas nunca reduzido a 0).',
        pageReference: 'Livro Base p.54',
        isInitial: true,
        effects: {
          base: {
            kind: 'passive',
            carryCapacity: {
              addAttribute: 'intellect'
            },
            itemSpaceReduction: 1
          }
        },
        tags: ['passivo', 'inventário', 'capacidade']
      },
      {
        id: 'remendo',
        name: 'Remendo',
        trackId: 'tecnico',
        minNex: 40,
        description: 'Você pode gastar uma ação completa e 1 PE para remover a condição quebrado de um equipamento adjacente. Além disso, qualquer equipamento que você carregue tem sua categoria reduzida em 1 (mas nunca reduzida a 0).',
        pageReference: 'Livro Base p.54',
        effects: {
          base: {
            kind: 'activated',
            activation: {
              cost: 1,
              action: 'complete'
            },
            repairEquipment: {
              range: 'touch',
              removeCondition: 'quebrado'
            },
            categoryReduction: {
              amount: 1,
              targetType: 'any-weapon',
              appliesToAllCarried: true
            }
          }
        },
        tags: ['ativado', 'reparo', 'categoria', 'equipamento']
      },
      {
        id: 'improvisar',
        name: 'Improvisar',
        trackId: 'tecnico',
        minNex: 65,
        description: 'Você pode improvisar equipamentos com materiais ao redor. Escolha um equipamento geral e gaste uma ação completa e 2 PE. Esse item funciona normalmente até o final da cena, mas é inutilizado ao término.',
        pageReference: 'Livro Base p.54',
        effects: {
          base: {
            kind: 'activated',
            activation: {
              cost: 2,
              action: 'complete'
            },
            createEquipment: {
              type: 'general',
              duration: 'scene',
              destroyedAfter: true
            }
          }
        },
        tags: ['ativado', 'criação', 'improviso', 'equipamento']
      },
      {
        id: 'preparado-para-tudo',
        name: 'Preparado para Tudo',
        trackId: 'tecnico',
        minNex: 99,
        description: 'Sempre que precisar de um item qualquer (exceto armas), você pode gastar uma ação de movimento e 3 PE por categoria para declarar que ele estava guardado em sua mochila. Depois disso, o item segue normalmente as regras de inventário.',
        pageReference: 'Livro Base p.54',
        effects: {
          base: {
            kind: 'activated',
            activation: {
              cost: 3, // Por categoria
              action: 'movement',
              costPerCategory: true
            },
            retrieveItem: {
              excludeWeapons: true,
              retroactive: true
            }
          }
        },
        tags: ['ativado', 'inventário', 'preparação', 'supremo']
      }
    ],
    tags: ['equipamento', 'inventário', 'utilidade']
  }
];
