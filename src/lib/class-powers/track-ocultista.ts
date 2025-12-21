/**
 * Trilhas do Ocultista - Ordem Paranormal RPG v1.3
 * 
 * Define as 5 trilhas oficiais do Ocultista com efeitos mecânicos estruturados:
 * - Condutor: Modificação e manipulação de rituais
 * - Flagelador: Usa dor como fonte de poder paranormal
 * - Graduado: Conhecimento expandido de rituais
 * - Intuitivo: Resistência mental e paranormal
 * - Lâmina Paranormal: Combate corpo a corpo com rituais
 * 
 * @module track-ocultista
 */

import type { UnifiedTrack } from './track-types';

/**
 * Trilhas oficiais do Ocultista
 */
export const OCULTISTA_TRACKS: UnifiedTrack[] = [
  // ==========================================================================
  // CONDUTOR
  // Modificação e manipulação de rituais
  // ==========================================================================
  {
    id: 'condutor',
    name: 'Condutor',
    classId: 'Ocultista',
    description: 'Você domina os aspectos fundamentais da conjuração de rituais e é capaz de aumentar o alcance e a velocidade de suas conjurações. Conforme sua conexão com as entidades paranormais aumenta, você se torna capaz de interferir com os rituais de outros ocultistas.',
    pageReference: 'Livro Base p.62',
    abilities: [
      {
        id: 'ampliar-ritual',
        name: 'Ampliar Ritual',
        trackId: 'condutor',
        minNex: 10,
        description: 'Quando lança um ritual, você pode gastar 2 PE para aumentar seu alcance em um passo (de curto para médio, de médio para longo ou de longo para extremo), ou dobrar a área de efeito.',
        pageReference: 'Livro Base p.62',
        isInitial: true,
        effects: {
          base: {
            kind: 'ritual-modifier',
            ritualModifier: {
              type: 'range',
              additionalPECost: 2,
              effect: 'Aumenta alcance em um passo ou dobra área de efeito'
            }
          }
        },
        tags: ['ritual', 'alcance', 'área', 'modificador']
      },
      {
        id: 'acelerar-ritual',
        name: 'Acelerar Ritual',
        trackId: 'condutor',
        minNex: 40,
        description: 'Uma vez por rodada, você pode aumentar o custo de um ritual em 4 PE para conjurá-lo como ação livre.',
        pageReference: 'Livro Base p.62',
        effects: {
          base: {
            kind: 'ritual-modifier',
            ritualModifier: {
              type: 'speed',
              additionalPECost: 4,
              effect: 'Conjura ritual como ação livre'
            },
            activation: {
              perRound: true
            }
          }
        },
        tags: ['ritual', 'velocidade', 'ação-livre', 'modificador']
      },
      {
        id: 'anular-ritual',
        name: 'Anular Ritual',
        trackId: 'condutor',
        minNex: 65,
        description: 'Quando for alvo de um ritual, você pode gastar uma quantidade de PE igual ao custo pago por esse ritual e fazer um teste oposto de Ocultismo contra o conjurador. Se vencer, você anula o ritual, cancelando todos os seus efeitos.',
        pageReference: 'Livro Base p.62',
        effects: {
          base: {
            kind: 'reaction',
            ritualModifier: {
              type: 'counter',
              additionalPECost: 0, // Custo igual ao ritual alvo
              effect: 'Anula ritual com teste oposto de Ocultismo'
            },
            counterSpell: {
              costMatchesTarget: true,
              testSkill: 'ocultismo',
              testType: 'opposed'
            }
          }
        },
        tags: ['ritual', 'contra-mágica', 'reação', 'anulação']
      },
      {
        id: 'canalizar-o-medo',
        name: 'Canalizar o Medo',
        trackId: 'condutor',
        minNex: 99,
        description: 'Você aprende o ritual Canalizar o Medo.',
        pageReference: 'Livro Base p.62',
        effects: {
          base: {
            kind: 'grants-ritual',
            grantsRitual: 'canalizar-o-medo'
          }
        },
        tags: ['ritual', 'ritual-concedido', 'medo']
      }
    ],
    tags: ['rituais', 'modificação', 'contra-mágica']
  },

  // ==========================================================================
  // FLAGELADOR
  // Usa dor como fonte de poder paranormal
  // ==========================================================================
  {
    id: 'flagelador',
    name: 'Flagelador',
    classId: 'Ocultista',
    description: 'Dor é um poderoso catalisador paranormal. Você aprendeu a transformá-la em poder para seus rituais, usando sofrimento como instrumento de destruição.',
    pageReference: 'Livro Base p.62',
    abilities: [
      {
        id: 'poder-do-flagelo',
        name: 'Poder do Flagelo',
        trackId: 'flagelador',
        minNex: 10,
        description: 'Ao conjurar um ritual, você pode gastar seus próprios pontos de vida no lugar de PE (1 PV = 1 PE). Pontos de vida gastos dessa forma só podem ser recuperados com descanso.',
        pageReference: 'Livro Base p.62',
        isInitial: true,
        effects: {
          base: {
            kind: 'resource',
            hpAsPE: true,
            hpRecoveryRestriction: 'rest-only'
          }
        },
        tags: ['recurso', 'pv-como-pe', 'sacrifício']
      },
      {
        id: 'abracar-a-dor',
        name: 'Abraçar a Dor',
        trackId: 'flagelador',
        minNex: 40,
        description: 'Sempre que sofrer dano paranormal, você pode gastar uma reação e 2 PE para reduzir esse dano à metade.',
        pageReference: 'Livro Base p.62',
        effects: {
          base: {
            kind: 'reaction',
            activation: {
              cost: 2,
              action: 'reaction'
            },
            damageReduction: {
              type: 'half',
              damageTypes: ['paranormal']
            }
          }
        },
        tags: ['reação', 'redução-dano', 'dano-paranormal']
      },
      {
        id: 'absorver-angustia',
        name: 'Absorver Angústia',
        trackId: 'flagelador',
        minNex: 65,
        description: 'Sempre que reduzir um ou mais inimigos a 0 PV com um ritual, você recebe PE temporários iguais ao círculo do ritual utilizado. Exemplo: ao usar um ritual de 2º círculo, você recebe 2 PE temporários.',
        pageReference: 'Livro Base p.62',
        effects: {
          base: {
            kind: 'triggered',
            temporaryPE: {
              trigger: 'on-kill-with-ritual',
              amount: 'ritual-circle'
            }
          }
        },
        tags: ['passivo', 'pe-temporário', 'ritual', 'abate']
      },
      {
        id: 'medo-tangivel',
        name: 'Medo Tangível',
        trackId: 'flagelador',
        minNex: 99,
        description: 'Você aprende o ritual Medo Tangível.',
        pageReference: 'Livro Base p.62',
        effects: {
          base: {
            kind: 'grants-ritual',
            grantsRitual: 'medo-tangivel'
          }
        },
        tags: ['ritual', 'ritual-concedido', 'medo']
      }
    ],
    tags: ['rituais', 'sacrifício', 'dor']
  },

  // ==========================================================================
  // GRADUADO
  // Conhecimento expandido de rituais
  // ==========================================================================
  {
    id: 'graduado',
    name: 'Graduado',
    classId: 'Ocultista',
    description: 'Você foca seus estudos e se torna um conjurador versátil e poderoso, conhecendo mais rituais que outros ocultistas e sendo capaz de torná-los mais difíceis de resistir.',
    pageReference: 'Livro Base p.62',
    abilities: [
      {
        id: 'saber-ampliado',
        name: 'Saber Ampliado',
        trackId: 'graduado',
        minNex: 10,
        description: 'Você aprende um ritual de 1º círculo. Sempre que ganhar acesso a um novo círculo, aprende um ritual adicional daquele círculo. Esses rituais não contam no limite de rituais conhecidos.',
        pageReference: 'Livro Base p.62',
        isInitial: true,
        effects: {
          base: {
            kind: 'passive',
            bonusRituals: {
              perCircle: 1,
              ignoresLimit: true
            }
          }
        },
        tags: ['passivo', 'rituais-extras', 'conhecimento']
      },
      {
        id: 'grimorio-ritualistico',
        name: 'Grimório Ritualístico',
        trackId: 'graduado',
        minNex: 40,
        description: 'Você cria um grimório especial, capaz de armazenar rituais que sua mente não conseguiria guardar. Você pode armazenar um número de rituais de 1º ou 2º círculo igual ao seu Intelecto. Sempre que ganhar acesso a um novo círculo, pode incluir um novo ritual no grimório. Rituais do grimório não contam no limite de rituais conhecidos. Para conjurar um ritual do grimório, é necessário empunhar o grimório e gastar uma ação completa para consultar o ritual. O grimório ocupa 1 espaço no inventário. Se for perdido, você pode recriá-lo com duas ações de interlúdio.',
        pageReference: 'Livro Base p.62',
        effects: {
          base: {
            kind: 'passive',
            grimoire: {
              maxRituals: 'intellect',
              allowedCircles: [1, 2],
              bonusPerNewCircle: 1,
              ignoresLimit: true,
              castingAction: 'complete',
              requiresWielding: true,
              inventorySlots: 1,
              recreationCost: '2-interlude-actions'
            }
          }
        },
        tags: ['passivo', 'grimório', 'rituais-extras', 'equipamento']
      },
      {
        id: 'rituais-eficientes',
        name: 'Rituais Eficientes',
        trackId: 'graduado',
        minNex: 65,
        description: 'A DT para resistir aos seus rituais aumenta em +5.',
        pageReference: 'Livro Base p.62',
        effects: {
          base: {
            kind: 'passive',
            ritualDTBonus: 5
          }
        },
        tags: ['passivo', 'dt-ritual', 'potência']
      },
      {
        id: 'conhecendo-o-medo',
        name: 'Conhecendo o Medo',
        trackId: 'graduado',
        minNex: 99,
        description: 'Você aprende o ritual Conhecendo o Medo.',
        pageReference: 'Livro Base p.62',
        effects: {
          base: {
            kind: 'grants-ritual',
            grantsRitual: 'conhecendo-o-medo'
          }
        },
        tags: ['ritual', 'ritual-concedido', 'medo']
      }
    ],
    tags: ['rituais', 'conhecimento', 'versatilidade']
  },

  // ==========================================================================
  // INTUITIVO
  // Resistência mental e paranormal
  // ==========================================================================
  {
    id: 'intuitivo',
    name: 'Intuitivo',
    classId: 'Ocultista',
    description: 'Você expande sua mente para resistir e manipular os efeitos do Outro Lado, focando em força de vontade e resistência paranormal.',
    pageReference: 'Livro Base p.62',
    abilities: [
      {
        id: 'mente-sa',
        name: 'Mente Sã',
        trackId: 'intuitivo',
        minNex: 10,
        description: 'Você compreende melhor as entidades do Outro Lado. Você recebe resistência paranormal +5 (+5 em testes de resistência contra efeitos paranormais).',
        pageReference: 'Livro Base p.62',
        isInitial: true,
        effects: {
          base: {
            kind: 'passive',
            paranormalResistance: 5
          }
        },
        tags: ['passivo', 'resistência', 'paranormal']
      },
      {
        id: 'presenca-poderosa',
        name: 'Presença Poderosa',
        trackId: 'intuitivo',
        minNex: 40,
        description: 'Sua resistência mental faz com que você possa extrair mais do Outro Lado. Você soma seu limite de PE por turno à sua Presença ao conjurar rituais (não afeta a DT).',
        pageReference: 'Livro Base p.62',
        effects: {
          base: {
            kind: 'passive',
            addAttributeToPELimit: 'presence',
            // Soma limite de PE por turno à Presença para calcular efeitos de rituais
            ritualPowerBonus: {
              addPELimit: true,
              affectsDT: false
            }
          }
        },
        tags: ['passivo', 'rituais', 'presença', 'poder']
      },
      {
        id: 'inabalavel',
        name: 'Inabalável',
        trackId: 'intuitivo',
        minNex: 65,
        description: 'Você recebe resistência a dano mental igual a 10. Além disso, quando é alvo de um efeito paranormal, pode fazer um teste de Vontade para reduzir o dano à metade (não sofre dano algum se passar).',
        pageReference: 'Livro Base p.62',
        effects: {
          base: {
            kind: 'passive',
            mentalDamageResistance: 10,
            // Teste de Vontade para reduzir/evitar dano paranormal
            paranormalDamageReduction: {
              testSkill: 'vontade',
              onSuccess: 'negate',
              onFailure: 'half'
            }
          }
        },
        tags: ['passivo', 'resistência', 'mental', 'paranormal']
      },
      {
        id: 'presenca-do-medo',
        name: 'Presença do Medo',
        trackId: 'intuitivo',
        minNex: 99,
        description: 'Você aprende o ritual Presença do Medo.',
        pageReference: 'Livro Base p.62',
        effects: {
          base: {
            kind: 'grants-ritual',
            grantsRitual: 'presenca-do-medo'
          }
        },
        tags: ['ritual', 'ritual-concedido', 'medo']
      }
    ],
    tags: ['resistência', 'mental', 'paranormal']
  },

  // ==========================================================================
  // LÂMINA PARANORMAL
  // Combate corpo a corpo com rituais
  // ==========================================================================
  {
    id: 'lamina-paranormal',
    name: 'Lâmina Paranormal',
    classId: 'Ocultista',
    description: 'Alguns ocultistas preferem unir conhecimento arcano e combate físico, usando o paranormal como extensão de sua lâmina.',
    pageReference: 'Livro Base p.62',
    abilities: [
      {
        id: 'lamina-maldita',
        name: 'Lâmina Maldita',
        trackId: 'lamina-paranormal',
        minNex: 10,
        description: 'Você aprende o ritual Amaldiçoar Arma. Ao conjurá-lo, pode gastar +1 PE para reduzir o tempo de conjuração para movimento. Além disso, ao conjurar esse ritual, você pode usar Ocultismo no lugar de Luta ou Pontaria para testes de ataque com a arma amaldiçoada.',
        pageReference: 'Livro Base p.62',
        isInitial: true,
        effects: {
          base: {
            kind: 'ritual-modifier',
            grantsRitual: 'amaldicoar-arma',
            ritualModifier: {
              type: 'speed',
              additionalPECost: 1,
              effect: 'Reduz tempo de conjuração para ação de movimento',
              specificRitual: 'amaldicoar-arma'
            },
            occultismAsAttack: true // Permite usar Ocultismo no lugar de Luta/Pontaria
          }
        },
        tags: ['ritual', 'ritual-concedido', 'combate', 'ocultismo-ataque']
      },
      {
        id: 'gladiador-paranormal',
        name: 'Gladiador Paranormal',
        trackId: 'lamina-paranormal',
        minNex: 40,
        description: 'Sempre que acerta um ataque corpo a corpo, você recebe 2 PE temporários. Você pode ganhar um número máximo de PE temporários por cena igual ao seu limite de PE por turno. PE temporários desaparecem ao final da cena.',
        pageReference: 'Livro Base p.62',
        effects: {
          base: {
            kind: 'triggered',
            temporaryPE: {
              trigger: 'on-melee-hit',
              amount: 2,
              maxPerScene: 'pe-limit'
            }
          }
        },
        tags: ['passivo', 'pe-temporário', 'corpo-a-corpo']
      },
      {
        id: 'conjuracao-marcial',
        name: 'Conjuração Marcial',
        trackId: 'lamina-paranormal',
        minNex: 65,
        description: 'Uma vez por rodada, quando lança um ritual com execução de ação padrão, você pode gastar 2 PE para fazer um ataque corpo a corpo como ação livre.',
        pageReference: 'Livro Base p.62',
        effects: {
          base: {
            kind: 'activated',
            activation: {
              cost: 2,
              action: 'free',
              perRound: true,
              trigger: 'on-ritual-cast-standard'
            },
            extraActions: [{
              type: 'attack',
              trigger: 'on-ritual-cast',
              weaponRestriction: 'melee'
            }]
          }
        },
        tags: ['ativado', 'ataque-extra', 'ritual', 'corpo-a-corpo']
      },
      {
        id: 'lamina-do-medo',
        name: 'Lâmina do Medo',
        trackId: 'lamina-paranormal',
        minNex: 99,
        description: 'Você aprende o ritual Lâmina do Medo.',
        pageReference: 'Livro Base p.62',
        effects: {
          base: {
            kind: 'grants-ritual',
            grantsRitual: 'lamina-do-medo'
          }
        },
        tags: ['ritual', 'ritual-concedido', 'medo', 'combate']
      }
    ],
    tags: ['combate', 'rituais', 'híbrido']
  }
];
