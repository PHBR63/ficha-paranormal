/**
 * Trilhas do Ocultista - Ordem Paranormal RPG v1.3
 *
 * Define as 5 trilhas oficiais do Ocultista:
 * - Conduíte: Especialista em alcance e efeitos de área
 * - Flagelador: Converte sofrimento em recursos para rituais
 * - Graduado: Mestre dos rituais com grimório
 * - Intuitivo: Resistência mental e investigação
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
    // CONDUITE
    // ==========================================================================
    {
        id: 'condutor',
        name: 'Conduíte',
        classId: 'Ocultista',
        description: 'Você funciona como um canal direto para o Outro Lado.',
        pageReference: 'Livro Base v1.3 p.34',
        abilities: [
            {
                id: 'ampliar-ritual',
                name: 'Ampliar Ritual',
                trackId: 'condutor',
                minNex: 10,
                description: 'Você pode gastar 2 PE para aumentar o alcance de um ritual em um passo (curto para médio, médio para longo, longo para extremo) ou dobrar sua área de efeito.',
                pageReference: 'Livro Base v1.3 p.34',
                isInitial: true,
                effects: {
                    base: {
                        kind: 'activated',
                        activation: {
                            cost: 2,
                            action: 'free'
                        },
                        ritualModifier: {
                            type: 'range', // Simplificado para 'range', lógica de escolha tratada na implementação
                            additionalPECost: 2, // Livro Base p.34: +2 PE na conjuração selecionada.
                            effect: 'ampliar'
                        }
                    }
                },
                tags: ['ritual', 'alcance', 'área']
            },
            {
                id: 'acelerar-ritual',
                name: 'Acelerar Ritual',
                trackId: 'condutor',
                minNex: 40,
                description: 'Uma vez por rodada, aumente o custo do ritual em 4 PE para conjurá-lo como ação livre.',
                pageReference: 'Livro Base v1.3 p.34',
                effects: {
                    base: {
                        kind: 'activated',
                        activation: {
                            cost: 4,
                            action: 'free',
                            perRound: true
                        },
                        ritualModifier: {
                            type: 'speed',
                            additionalPECost: 4,
                            effect: 'acelerar'
                        }
                    }
                },
                tags: ['ação-livre', 'velocidade']
            },
            {
                id: 'anular-ritual',
                name: 'Anular Ritual',
                trackId: 'condutor',
                minNex: 65,
                description: 'Quando for alvo de um ritual, pague o custo gasto pelo conjurador e dispute Ocultismo para tentar anulá-lo.',
                pageReference: 'Livro Base v1.3 p.34',
                effects: {
                    base: {
                        kind: 'reaction',
                        activation: {
                            cost: 0, // Custo variável: counterSpell usa o custo pago pelo conjurador.
                            action: 'reaction'
                        },
                        counterSpell: {
                            costMatchesTarget: true,
                            testSkill: 'ocultismo',
                            testType: 'opposed'
                        },
                        ritualModifier: {
                            type: 'counter',
                            additionalPECost: 0,
                            effect: 'anular'
                        }
                    }
                },
                tags: ['reação', 'anular']
            },
            {
                id: 'condutor-maximo',
                name: 'Canalizar o Medo',
                trackId: 'condutor',
                minNex: 99,
                description: 'Você aprende o ritual Canalizar o Medo.',
                pageReference: 'Livro Base v1.3 p.34',
                effects: {
                    base: {
                        kind: 'passive',
                        grantsRitual: 'canalizar-o-medo'
                    }
                },
                tags: ['passivo', 'upgrade']
            }
        ],
        tags: ['rituais', 'suporte', 'alcance']
    },

    // ==========================================================================
    // FLAGELO
    // ==========================================================================
    {
        id: 'flagelador',
        name: 'Flagelador',
        classId: 'Ocultista',
        description: 'Você usa seu próprio corpo como combustível para o paranormal.',
        pageReference: 'Livro Base v1.3 p.34',
        abilities: [
            {
                id: 'poder-do-sangue',
                name: 'Poder do Flagelo',
                trackId: 'flagelador',
                minNex: 10,
                description: 'Ao conjurar rituais, cada PE pode ser pago com 2 PV; esses PV só se recuperam com descanso.',
                pageReference: 'Livro Base v1.3 p.34',
                isInitial: true,
                effects: {
                    base: {
                        kind: 'passive',
                        hpAsPE: true,
                        hpCostPerPE: 2,
                        hpRecoveryRestriction: 'rest-only'
                    }
                },
                tags: ['sangue', 'economia', 'vida']
            },
            {
                id: 'abracar-a-dor',
                name: 'Abraçar a Dor',
                trackId: 'flagelador',
                minNex: 40,
                description: 'Uma reação e 2 PE reduzem à metade um dano não paranormal sofrido.',
                pageReference: 'Livro Base v1.3 p.34',
                effects: {
                    base: {
                        kind: 'reaction',
                        activation: {
                            cost: 2,
                            action: 'reaction'
                        },
                        damageReduction: {
                            type: 'half',
                            damageTypes: ['non-paranormal'] // Inclui dano não paranormal além do físico.
                        }
                    }
                },
                tags: ['defesa', 'rd']
            },
            {
                id: 'absorver-angustia',
                name: 'Absorver Agonia',
                trackId: 'flagelador',
                minNex: 65,
                description: 'Ao reduzir inimigo(s) a 0 PV com um ritual, receba PE temporários iguais ao círculo usado.',
                pageReference: 'Livro Base v1.3 p.34–35',
                effects: {
                    base: {
                        kind: 'passive',
                        temporaryPE: {
                            trigger: 'on-kill-with-ritual',
                            amount: 'ritual-circle'
                        }
                    }
                },
                tags: ['recuperação', 'pe']
            },
            {
                id: 'flagelo-maximo',
                name: 'Medo Tangível',
                trackId: 'flagelador',
                minNex: 99,
                description: 'Você aprende o ritual Medo Tangível.',
                pageReference: 'Livro Base v1.3 p.35',
                effects: {
                    base: {
                        kind: 'passive',
                        grantsRitual: 'medo-tangivel'
                    }
                },
                tags: ['vida', 'tanque']
            }
        ],
        tags: ['sangue', 'pv']
    },

    // ==========================================================================
    // GRADUADO
    // ==========================================================================
    {
        id: 'graduado',
        name: 'Graduado',
        classId: 'Ocultista',
        description: 'Você estuda o paranormal de forma acadêmica através de um grimório.',
        pageReference: 'Livro Base v1.3 p.35',
        abilities: [
            {
                id: 'saber-ampliado',
                name: 'Saber Ampliado',
                trackId: 'graduado',
                minNex: 10,
                description: 'Aprenda um ritual extra ao acessar cada círculo; essas escolhas não ocupam o limite de rituais conhecidos.',
                pageReference: 'Livro Base v1.3 p.35',
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
                tags: ['grimório', 'rituais']
            },
            {
                id: 'grimorio-ritualistico',
                name: 'Grimório Ritualístico',
                trackId: 'graduado',
                minNex: 40,
                description: 'Um grimório guarda rituais de 1º/2º círculo iguais ao Intelecto, sem ocupar o limite; exige empunhá-lo e preparar a leitura com ação completa.',
                pageReference: 'Livro Base v1.3 p.35',
                effects: {
                    base: {
                        kind: 'passive',
                        grimoire: {
                            maxRituals: 'intellect',
                            allowedCircles: [1, 2],
                            bonusPerNewCircle: 1,
                            ignoresLimit: true,
                            // Campo legado; a ação completa prepara a leitura, não executa o ritual.
                            castingAction: 'complete',
                            preparationAction: 'complete',
                            requiresWielding: true,
                            inventorySlots: 1,
                            recreationCost: 'two-interlude-actions'
                        }
                    }
                },
                tags: ['dt', 'poder']
            },
            {
                id: 'rituais-eficientes',
                name: 'Rituais Eficientes',
                trackId: 'graduado',
                minNex: 65,
                description: 'A DT para resistir a todos os seus rituais aumenta em 5.',
                pageReference: 'Livro Base v1.3 p.35',
                effects: {
                    base: {
                        kind: 'passive',
                        ritualDTBonus: 5
                    }
                },
                tags: ['economia', 'pe']
            },
            {
                id: 'graduado-maximo',
                name: 'Conhecendo o Medo',
                trackId: 'graduado',
                minNex: 99,
                description: 'Você aprende o ritual Conhecendo o Medo.',
                pageReference: 'Livro Base v1.3 p.35',
                effects: {
                    base: {
                        kind: 'passive',
                        grantsRitual: 'conhecendo-o-medo'
                    }
                },
                tags: ['conhecimento', 'rituais']
            }
        ],
        tags: ['estudo', 'grimório']
    },

    // ==========================================================================
    // INTUITIVO
    // ==========================================================================
    {
        id: 'intuitivo',
        name: 'Intuitivo',
        classId: 'Ocultista',
        description: 'Sua mente é uma fortaleza contra os horrores do Outro Lado.',
        pageReference: 'Livro Base v1.3 p.35',
        abilities: [
            {
                id: 'mente-sa',
                name: 'Mente Sã',
                trackId: 'intuitivo',
                minNex: 10,
                description: 'Receba +5 em testes de resistência contra efeitos paranormais.',
                pageReference: 'Livro Base v1.3 p.35',
                isInitial: true,
                effects: {
                    base: {
                        kind: 'passive',
                        paranormalResistanceTestBonus: 5
                    }
                },
                tags: ['defesa-mental', 'vontade']
            },
            {
                id: 'presenca-poderosa',
                name: 'Presença Poderosa',
                trackId: 'intuitivo',
                minNex: 40,
                description: 'Some Presença ao limite de PE por turno somente para conjurar rituais; a DT não muda.',
                pageReference: 'Livro Base v1.3 p.35',
                effects: {
                    base: {
                        kind: 'passive',
                        addAttributeToPELimit: 'presence'
                    }
                },
                tags: ['pe', 'presença']
            },
            {
                id: 'inabalavel',
                name: 'Inabalável',
                trackId: 'intuitivo',
                minNex: 65,
                description: 'Receba RD mental e paranormal 10; sucesso em Vontade que já reduziria dano paranormal à metade passa a anulá-lo.',
                pageReference: 'Livro Base v1.3 p.35',
                effects: {
                    base: {
                        kind: 'passive',
                        mentalDamageResistance: 10,
                        paranormalResistance: 10,
                        paranormalDamageTest: {
                            testSkill: 'vontade',
                            onSuccess: 'negate',
                            onFailure: 'full',
                            dtType: 'existing-test',
                            requiresExistingHalfDamageSave: true
                        }
                    }
                },
                tags: ['imunidade', 'rd']
            },
            {
                id: 'intuitivo-maximo',
                name: 'Presença do Medo',
                trackId: 'intuitivo',
                minNex: 99,
                description: 'Você aprende o ritual Presença do Medo.',
                pageReference: 'Livro Base v1.3 p.35',
                effects: {
                    base: {
                        kind: 'passive',
                        grantsRitual: 'presenca-do-medo'
                    }
                },
                tags: ['compreensão', 'poder']
            }
        ],
        tags: ['mental', 'resistência']
    },

    // ==========================================================================
    // LÂMINA PARANORMAL
    // ==========================================================================
    {
        id: 'lamina-paranormal',
        name: 'Lâmina Paranormal',
        classId: 'Ocultista',
        description: 'Você canaliza o medo através de uma arma corpo a corpo.',
        pageReference: 'Livro Base v1.3 p.35',
        abilities: [
            {
                id: 'lamina-maldita',
                name: 'Lâmina Maldita',
                trackId: 'lamina-paranormal',
                minNex: 10,
                description: 'Aprenda Amaldiçoar Arma; se já o conhecia, +1 PE permite execução de movimento. Sob seu ritual, a arma usa Ocultismo em vez de Luta ou Pontaria.',
                pageReference: 'Livro Base v1.3 p.35',
                isInitial: true,
                effects: {
                    base: {
                        kind: 'passive',
                        occultismAsAttack: true,
                        grantsRitual: 'amaldicoar-arma'
                    }
                },
                tags: ['combate', 'ocultismo']
            },
            {
                id: 'gladiador-paranormal',
                name: 'Gladiador Paranormal',
                trackId: 'lamina-paranormal',
                minNex: 40,
                description: 'Acerto corpo a corpo em inimigo gera 2 PE temporários, limitados por cena ao limite de PE e perdidos ao fim dela.',
                pageReference: 'Livro Base v1.3 p.35',
                effects: {
                    base: {
                        kind: 'passive',
                        temporaryPE: {
                            trigger: 'on-melee-hit',
                            amount: 2,
                            maxPerScene: 'pe-limit'
                        }
                    }
                },
                tags: ['pe', 'recuperação']
            },
            {
                id: 'conjuracao-marcial',
                name: 'Conjuração Marcial',
                trackId: 'lamina-paranormal',
                minNex: 65,
                description: 'Uma vez por rodada, após ritual de execução padrão, 2 PE permitem um ataque corpo a corpo livre.',
                pageReference: 'Livro Base v1.3 p.35',
                effects: {
                    base: {
                        kind: 'activated',
                        activation: {
                            cost: 2,
                            action: 'free',
                            perRound: true
                        },
                        extraActions: [
                            {
                                type: 'attack',
                                trigger: 'on-ritual-cast',
                                weaponRestriction: 'melee'
                            }
                        ]
                    }
                },
                tags: ['ação-extra', 'combate']
            },
            {
                id: 'lamina-maxima',
                name: 'Lâmina do Medo',
                trackId: 'lamina-paranormal',
                minNex: 99,
                description: 'Você aprende o ritual Lâmina do Medo.',
                pageReference: 'Livro Base v1.3 p.35',
                effects: {
                    base: {
                        kind: 'passive',
                        grantsRitual: 'lamina-do-medo'
                    }
                },
                tags: ['dano', 'máximo']
            }
        ],
        tags: ['combate', 'híbrido']
    }
];
