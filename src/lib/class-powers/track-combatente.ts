/**
 * Trilhas do Combatente - Ordem Paranormal RPG v1.3
 * 
 * Define as 5 trilhas oficiais do Combatente com efeitos mecânicos estruturados:
 * - Aniquilador: Especialização em arma favorita com redução de categoria
 * - Comandante de Campo: Liderança e suporte tático para aliados
 * - Guerreiro: Combate corpo a corpo devastador
 * - Operações Especiais: Ações adicionais e velocidade
 * - Tropa de Choque: Resistência e proteção
 * 
 * @module track-combatente
 */

import type { UnifiedTrack } from './track-types';

/**
 * Trilhas oficiais do Combatente
 */
export const COMBATENTE_TRACKS: UnifiedTrack[] = [
  // ==========================================================================
  // ANIQUILADOR
  // Especialização em uma arma específica com redução de categoria progressiva
  // ==========================================================================
  {
    id: 'aniquilador',
    name: 'Aniquilador',
    classId: 'Combatente',
    description: 'Você é treinado para abater alvos com eficiência e velocidade. Suas armas são suas melhores amigas e você cuida tão bem delas quanto de seus companheiros de equipe. Talvez até melhor.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    abilities: [
      {
        id: 'a-favorita',
        name: 'A Favorita',
        trackId: 'aniquilador',
        minNex: 10,
        description: 'Escolha uma arma para ser sua favorita, como katana ou fuzil de assalto. A categoria da arma escolhida é reduzida em I.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        isInitial: true,
        effects: {
          base: {
            kind: 'passive',
            categoryReduction: {
              amount: 1,
              targetType: 'specific-weapon',
              requiresChoice: true,
              choiceDescription: 'Escolha uma arma para ser sua favorita'
            }
          }
        },
        tags: ['redução-categoria', 'arma-favorita', 'passivo']
      },
      {
        id: 'tecnica-secreta',
        name: 'Técnica Secreta',
        trackId: 'aniquilador',
        minNex: 40,
        description: 'A categoria da arma favorita passa a ser reduzida em II. Quando faz um ataque com ela, você pode gastar 2 PE para executar um dos efeitos abaixo como parte do ataque. Você pode adicionar mais efeitos gastando +2 PE por efeito adicional.\n\n• Amplo. O ataque pode atingir um alvo adicional em seu alcance e adjacente ao original (use o mesmo teste de ataque para ambos).\n• Destruidor. Aumenta o multiplicador de crítico da arma em +1.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        effects: {
          base: {
            kind: 'activated',
            categoryReduction: {
              amount: 2,
              targetType: 'specific-weapon',
              requiresChoice: false // Usa a mesma arma escolhida em A Favorita
            },
            techniqueEffects: [
              {
                id: 'amplo',
                name: 'Amplo',
                description: 'O ataque pode atingir um alvo adicional em seu alcance e adjacente ao original',
                peCost: 2,
                effects: { additionalTargets: 1 }
              },
              {
                id: 'destruidor',
                name: 'Destruidor',
                description: 'Aumenta o multiplicador de crítico da arma em +1',
                peCost: 2,
                effects: { criticalMultiplierBonus: 1 }
              }
            ],
            activation: {
              cost: 2,
              action: 'free',
              additionalCostPerEffect: 2
            }
          }
        },
        tags: ['redução-categoria', 'técnica', 'ativado', 'crítico']
      },
      {
        id: 'tecnica-sublime',
        name: 'Técnica Sublime',
        trackId: 'aniquilador',
        minNex: 65,
        description: 'Você adiciona os seguintes efeitos à lista de sua Técnica Secreta:\n\n• Letal. Aumenta a margem de ameaça em +2. Você pode escolher este efeito duas vezes para aumentar a margem de ameaça em +5.\n• Perfurante. Ignora até 5 pontos de resistência a dano de qualquer tipo do alvo.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        effects: {
          base: {
            kind: 'activated',
            techniqueEffects: [
              {
                id: 'letal',
                name: 'Letal',
                description: 'Aumenta a margem de ameaça em +2 (pode ser escolhido 2x para +5)',
                peCost: 2,
                effects: { criticalMarginBonus: 2 }
              },
              {
                id: 'perfurante',
                name: 'Perfurante',
                description: 'Ignora até 5 pontos de resistência a dano de qualquer tipo do alvo',
                peCost: 2,
                effects: { ignoreResistance: 5 }
              }
            ]
          }
        },
        tags: ['técnica', 'ativado', 'crítico', 'penetração']
      },
      {
        id: 'maquina-de-matar',
        name: 'Máquina de Matar',
        trackId: 'aniquilador',
        minNex: 99,
        description: 'A categoria da arma favorita passa a ser reduzida em III, ela recebe +2 na margem de ameaça e seu dano aumenta em um dado do mesmo tipo.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        effects: {
          base: {
            kind: 'passive',
            categoryReduction: {
              amount: 3,
              targetType: 'specific-weapon',
              requiresChoice: false
            },
            criticalBonus: {
              marginBonus: 2
            },
            damageBonus: {
              extraDice: { type: 'weapon', count: 1 }
            }
          }
        },
        tags: ['redução-categoria', 'passivo', 'crítico', 'dano-extra']
      }
    ],
    tags: ['combate', 'arma-favorita', 'especialização']
  },

  // ==========================================================================
  // COMANDANTE DE CAMPO
  // Liderança tática e suporte para aliados
  // ==========================================================================
  {
    id: 'comandante-campo',
    name: 'Comandante de Campo',
    classId: 'Combatente',
    description: 'Sem um oficial uma batalha não passa de uma briga de bar. Você é treinado para coordenar e auxiliar seus companheiros em combate, tomando decisões rápidas e tirando melhor proveito da situação e do talento de seus aliados.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    abilities: [
      {
        id: 'inspirar-confianca',
        name: 'Inspirar Confiança',
        trackId: 'comandante-campo',
        minNex: 10,
        description: 'Sua liderança inspira seus aliados. Você pode gastar uma reação e 2 PE para fazer um aliado em alcance curto rolar novamente um teste recém realizado.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        isInitial: true,
        effects: {
          base: {
            kind: 'reaction',
            activation: {
              cost: 2,
              action: 'reaction'
            },
            leadership: {
              range: 'short',
              maxAllies: 1,
              allyEffects: { rerollTest: true }
            }
          }
        },
        tags: ['liderança', 'reação', 'suporte', 'rerolagem']
      },
      {
        id: 'estrategista',
        name: 'Estrategista',
        trackId: 'comandante-campo',
        minNex: 40,
        description: 'Você pode direcionar aliados em alcance curto. Gaste uma ação padrão e 1 PE para direcionar aliados (máximo igual ao seu Intelecto). No próximo turno dos aliados afetados, eles ganham uma ação de movimento adicional.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        effects: {
          base: {
            kind: 'activated',
            activation: {
              cost: 1, // 1 PE total
              action: 'standard',
              costPerTarget: false // Corrigido: 1 PE total, não por aliado
            },
            leadership: {
              range: 'short',
              maxAllies: 'intellect',
              allyEffects: { extraMovementAction: true }
            }
          }
        },
        tags: ['liderança', 'ação-padrão', 'suporte', 'movimento']
      },
      {
        id: 'brecha-na-guarda',
        name: 'Brecha na Guarda',
        trackId: 'comandante-campo',
        minNex: 65,
        description: 'Uma vez por rodada, quando um aliado causar dano em um inimigo que esteja em seu alcance curto, você pode gastar uma reação e 2 PE para que você ou outro aliado em alcance curto faça um ataque adicional contra o mesmo inimigo. Além disso, o alcance de Inspirar Confiança e Estrategista aumenta para médio.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        effects: {
          base: {
            kind: 'reaction',
            activation: {
              cost: 2,
              action: 'reaction',
              perRound: true
            },
            leadership: {
              range: 'medium', // Upgrade de alcance
              maxAllies: 1,
              allyEffects: { extraAttack: true }
            }
          }
        },
        tags: ['liderança', 'reação', 'ataque-extra', 'alcance']
      },
      {
        id: 'oficial-comandante',
        name: 'Oficial Comandante',
        trackId: 'comandante-campo',
        minNex: 99,
        description: 'Você pode gastar uma ação padrão e 5 PE para que cada aliado que você possa ver em alcance médio receba uma ação padrão adicional no próximo turno dele.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        effects: {
          base: {
            kind: 'activated',
            activation: {
              cost: 5,
              action: 'standard'
            },
            leadership: {
              range: 'medium',
              maxAllies: undefined, // Todos que puder ver
              allyEffects: { extraStandardAction: true }
            }
          }
        },
        tags: ['liderança', 'ação-padrão', 'suporte', 'ação-extra']
      }
    ],
    tags: ['suporte', 'liderança', 'tático']
  },

  // ==========================================================================
  // GUERREIRO
  // Combate corpo a corpo devastador
  // ==========================================================================
  {
    id: 'guerreiro',
    name: 'Guerreiro',
    classId: 'Combatente',
    description: 'Você treinou sua musculatura e movimentos a ponto de transformar seu corpo em uma verdadeira arma. Com golpes corpo a corpo tão poderosos quanto uma bala, você enfrenta inimigos sem medo.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    abilities: [
      {
        id: 'tecnica-letal',
        name: 'Técnica Letal',
        trackId: 'guerreiro',
        minNex: 10,
        description: 'Você recebe um aumento de +2 na margem de ameaça com todos os seus ataques corpo a corpo.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        isInitial: true,
        effects: {
          base: {
            kind: 'passive',
            criticalBonus: {
              marginBonus: 2,
              conditions: { weaponType: 'melee' }
            }
          }
        },
        tags: ['passivo', 'crítico', 'corpo-a-corpo']
      },
      {
        id: 'revidar',
        name: 'Revidar',
        trackId: 'guerreiro',
        minNex: 40,
        description: 'Sempre que bloquear um ataque, você pode gastar uma reação e 2 PE para fazer um ataque corpo a corpo no inimigo que o atacou.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        effects: {
          base: {
            kind: 'reaction',
            activation: {
              cost: 2,
              action: 'reaction'
            },
            extraActions: [{
              type: 'attack',
              trigger: 'on-block',
              weaponRestriction: 'melee'
            }]
          }
        },
        tags: ['reação', 'contra-ataque', 'corpo-a-corpo']
      },
      {
        id: 'forca-opressora',
        name: 'Força Opressora',
        trackId: 'guerreiro',
        minNex: 65,
        description: 'Quando acerta um ataque corpo a corpo, você pode gastar 1 PE para realizar uma manobra derrubar ou empurrar contra o alvo do ataque como ação livre. Se escolher empurrar, recebe um bônus de +5 para cada 10 pontos de dano que causou no alvo. Se escolher derrubar e vencer no teste oposto, você pode gastar 1 PE para fazer um ataque adicional contra o alvo caído.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        effects: {
          base: {
            kind: 'triggered',
            activation: {
              cost: 1,
              action: 'free'
            },
            extraActions: [{
              type: 'maneuver',
              maneuverOptions: ['derrubar', 'empurrar'],
              trigger: 'on-melee-hit'
            }]
          }
        },
        tags: ['manobra', 'corpo-a-corpo', 'controle']
      },
      {
        id: 'potencia-maxima',
        name: 'Potência Máxima',
        trackId: 'guerreiro',
        minNex: 99,
        description: 'Quando usa seu Ataque Especial com armas corpo a corpo, todos os bônus numéricos são dobrados. Por exemplo, se usar 5 PE para receber +5 no ataque e +15 no dano, você recebe +10 no ataque e +30 no dano.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        effects: {
          base: {
            kind: 'passive',
            // Dobra os bônus do Ataque Especial para armas corpo a corpo
            specialAttackMultiplier: 2
          }
        },
        tags: ['passivo', 'ataque-especial', 'corpo-a-corpo', 'multiplicador']
      }
    ],
    tags: ['combate', 'corpo-a-corpo', 'ofensivo']
  },

  // ==========================================================================
  // OPERAÇÕES ESPECIAIS
  // Velocidade e ações adicionais
  // ==========================================================================
  {
    id: 'operacoes-especiais',
    name: 'Operações Especiais',
    classId: 'Combatente',
    description: 'Você é um combatente eficaz. Suas ações são calculadas e otimizadas, sempre antevendo os movimentos inimigos e se posicionando da maneira mais inteligente no campo de batalha.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    abilities: [
      {
        id: 'iniciativa-aprimorada',
        name: 'Iniciativa Aprimorada',
        trackId: 'operacoes-especiais',
        minNex: 10,
        description: 'Você recebe +5 em Iniciativa e uma ação de movimento adicional na primeira rodada.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        isInitial: true,
        effects: {
          base: {
            kind: 'passive',
            initiativeBonus: 5,
            extraActions: [{
              type: 'movement',
              trigger: 'first-round'
            }]
          }
        },
        tags: ['passivo', 'iniciativa', 'movimento', 'primeira-rodada']
      },
      {
        id: 'ataque-extra',
        name: 'Ataque Extra',
        trackId: 'operacoes-especiais',
        minNex: 40,
        description: 'Uma vez por rodada, quando faz um ataque, você pode gastar 2 PE para fazer um ataque adicional.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        effects: {
          base: {
            kind: 'activated',
            activation: {
              cost: 2,
              action: 'free',
              perRound: true
            },
            extraActions: [{
              type: 'attack',
              trigger: 'on-attack'
            }]
          }
        },
        tags: ['ativado', 'ataque-extra', 'ação-livre']
      },
      {
        id: 'surto-de-adrenalina',
        name: 'Surto de Adrenalina',
        trackId: 'operacoes-especiais',
        minNex: 65,
        description: 'Uma vez por rodada, você pode gastar 5 PE para realizar uma ação padrão ou de movimento adicional.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        effects: {
          base: {
            kind: 'activated',
            activation: {
              cost: 5,
              action: 'free',
              perRound: true
            },
            extraActions: [{
              type: 'standard-or-movement',
              trigger: 'on-demand'
            }]
          }
        },
        tags: ['ativado', 'ação-extra', 'versatilidade']
      },
      {
        id: 'sempre-alerta',
        name: 'Sempre Alerta',
        trackId: 'operacoes-especiais',
        minNex: 99,
        description: 'Você recebe uma ação padrão adicional no início de cada cena de combate.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        effects: {
          base: {
            kind: 'passive',
            extraActions: [{
              type: 'standard',
              trigger: 'combat-start'
            }]
          }
        },
        tags: ['passivo', 'ação-extra', 'início-combate']
      }
    ],
    tags: ['velocidade', 'ações', 'tático']
  },

  // ==========================================================================
  // TROPA DE CHOQUE
  // Resistência e proteção
  // ==========================================================================
  {
    id: 'tropa-choque',
    name: 'Tropa de Choque',
    classId: 'Combatente',
    description: 'Você é duro na queda. Treinou seu corpo para resistir a traumas físicos, tornando-o praticamente inquebrável, e por isso não teme se colocar entre seus aliados e o perigo.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    abilities: [
      {
        id: 'casca-grossa',
        name: 'Casca Grossa',
        trackId: 'tropa-choque',
        minNex: 10,
        description: 'Você recebe +1 PV para cada 5% de NEX e, quando faz um bloqueio, soma seu Vigor na resistência a dano recebida.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        isInitial: true,
        effects: {
          base: {
            kind: 'passive',
            hpPerNexPercent: 0.2, // +1 PV por 5% = 0.2 por 1%
            blockVigorBonus: true
          }
        },
        tags: ['passivo', 'pv-extra', 'bloqueio', 'resistência']
      },
      {
        id: 'cai-dentro',
        name: 'Cai Dentro',
        trackId: 'tropa-choque',
        minNex: 40,
        description: 'Sempre que um oponente em alcance curto ataca um de seus aliados, você pode gastar uma reação e 1 PE para fazer com que esse oponente faça um teste de Vontade (DT Vig). Se falhar, o oponente deve atacar você em vez de seu aliado. Este poder só funciona se você puder ser efetivamente atacado e estiver no alcance do ataque. Um oponente que passe no teste de Vontade não pode ser afetado por seu poder Cai Dentro até o final da cena.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        effects: {
          base: {
            kind: 'reaction',
            activation: {
              cost: 1,
              action: 'reaction'
            },
            // Força inimigo a atacar você
            taunt: {
              range: 'short',
              resistanceTest: 'vontade',
              dtAttribute: 'vigor'
            }
          }
        },
        tags: ['reação', 'proteção', 'aliados', 'provocar']
      },
      {
        id: 'duro-de-matar',
        name: 'Duro de Matar',
        trackId: 'tropa-choque',
        minNex: 65,
        description: 'Ao sofrer dano não paranormal, você pode gastar uma reação e 2 PE para reduzir esse dano à metade. Em NEX 85%, você pode usar esta habilidade para reduzir dano paranormal.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        effects: {
          base: {
            kind: 'reaction',
            activation: {
              cost: 2,
              action: 'reaction'
            },
            damageReduction: {
              type: 'half',
              damageTypes: ['physical'] // Inicialmente só dano não-paranormal
            }
          },
          progression: {
            85: {
              kind: 'reaction',
              damageReduction: {
                type: 'half',
                damageTypes: ['physical', 'paranormal'] // Em NEX 85% inclui paranormal
              }
            }
          }
        },
        tags: ['reação', 'redução-dano', 'sobrevivência']
      },
      {
        id: 'inquebravel',
        name: 'Inquebrável',
        trackId: 'tropa-choque',
        minNex: 99,
        description: 'Enquanto estiver machucado, você recebe +5 na Defesa e resistência a dano 5. Enquanto estiver morrendo, em vez do normal, você não fica indefeso e ainda pode realizar ações. Você ainda segue as regras de morte normalmente.',
        pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
        effects: {
          base: {
            kind: 'triggered',
            // Efeitos quando machucado
            whenWounded: {
              defenseBonus: 5,
              damageResistance: 5
            },
            // Efeitos quando morrendo
            whenDying: {
              canAct: true,
              notHelpless: true
            }
          }
        },
        tags: ['passivo', 'machucado', 'morrendo', 'resistência']
      }
    ],
    tags: ['defesa', 'resistência', 'proteção']
  }
];
