/**
 * Registro Unificado de Rituais (Adaptador para Testes)
 * Ordem Paranormal RPG v1.3
 */

import type { UnifiedRitual } from './types';

export const UNIFIED_RITUALS: UnifiedRitual[] = [
    // =====================================================
    // 1º CÍRCULO
    // =====================================================
    {
        id: 'amaldicoar-arma',
        name: 'Amaldiçoar Arma',
        element: 'Sangue',
        circle: 1,
        cost: 1,
        range: 'toque',
        execution: 'padrao',
        duration: 'cena',
        isWeaponBuff: true,
        description: 'Sua arma causa +1d6 de dano do elemento escolhido.',
        enhancements: [
            {
                name: 'Discente',
                cost: 2,
                description: 'Muda para +2d6 de dano.',
                circleReq: 2
            },
            {
                name: 'Verdadeiro',
                cost: 5,
                description: 'Muda para +4d6 de dano e ignora resistências.',
                circleReq: 3
            }
        ],
        effects: {
            base: {
                kind: 'buff',
                summary: 'Arma causa +1d6 de dano',
                weaponEffect: {
                    damageBonus: '1d6',
                    special: 'Dano elemental'
                }
            },
            discente: {
                kind: 'buff',
                summary: 'Arma causa +2d6 de dano',
                weaponEffect: {
                    damageBonus: '2d6',
                    special: 'Dano elemental'
                }
            },
            verdadeiro: {
                kind: 'buff',
                summary: 'Arma causa +4d6 de dano',
                weaponEffect: {
                    damageBonus: '4d6',
                    special: 'Dano elemental (ignora resistência)'
                }
            }
        }
    },
    {
        id: 'armadura-arcana',
        name: 'Armadura Arcana',
        element: 'Energia',
        circle: 1,
        cost: 1,
        range: 'pessoal',
        execution: 'reacao',
        duration: 'cena',
        isSustainable: false,
        description: 'Aumenta sua Defesa em +5.',
        enhancements: [
            {
                name: 'Discente',
                cost: 2,
                description: 'Aumenta o bônus para +10.',
                circleReq: 2
            },
            {
                name: 'Verdadeiro',
                cost: 5,
                description: 'Aumenta o bônus para +15 e fornece RD 5.',
                circleReq: 3
            }
        ],
        effects: {
            base: {
                kind: 'buff',
                defenseBonus: 5,
                summary: '+5 Defesa'
            },
            discente: {
                kind: 'buff',
                defenseBonus: 10,
                summary: '+10 Defesa'
            },
            verdadeiro: {
                kind: 'buff',
                defenseBonus: 15,
                damageReduction: { amount: 5 },
                summary: '+15 Defesa e RD 5'
            }
        }
    },
    {
        id: 'decadencia',
        name: 'Decadência',
        element: 'Morte',
        circle: 1,
        cost: 1,
        range: 'toque',
        execution: 'padrao',
        duration: 'instantanea',
        description: 'Causa 2d8+2 pontos de dano de Morte.',
        enhancements: [
            {
                name: 'Discente',
                cost: 2,
                description: 'Dano aumenta para 4d8+4 e duração muda para sustentada.',
                circleReq: 2
            }
        ],
        effects: {
            base: {
                kind: 'damage',
                damage: { diceCount: 2, diceType: 8, bonus: 2, damageType: 'morte' },
                summary: '2d8+2 dano de Morte'
            },
            discente: {
                kind: 'damage',
                damage: { diceCount: 4, diceType: 8, bonus: 4, damageType: 'morte' },
                summary: 'Dano contínuo'
            }
        }
    },
    // Ritual de teste para testes
    {
        id: 'arma-atroz',
        name: 'Arma Atroz',
        element: 'sangue',
        circle: 1,
        cost: 1,
        range: 'Toque',
        execution: 'Padrão',
        duration: 'Cena',
        isWeaponBuff: true,
        description: 'Uma arma empunhada fica coberta por uma energia sombria que causa ferimentos terríveis.',
        enhancements: [
            {
                name: 'Discente',
                cost: 2,
                description: 'Aumenta o dano adicional para +2d6.',
                circleReq: 2
            },
            {
                name: 'Verdadeiro',
                cost: 5,
                description: 'Aumenta o dano adicional para +4d6.',
                circleReq: 3
            }
        ],
        effects: {
            base: {
                kind: 'buff',
                weaponEffect: {
                    damageBonus: '1d6',
                    damageType: 'morte'
                },
                summary: 'Arma causa +1d6 de dano de morte'
            },
            discente: {
                kind: 'buff',
                weaponEffect: {
                    damageBonus: '2d6',
                    damageType: 'morte'
                },
                summary: 'Arma causa +2d6 de dano de morte'
            },
            verdadeiro: {
                kind: 'buff',
                weaponEffect: {
                    damageBonus: '4d6',
                    damageType: 'morte'
                },
                summary: 'Arma causa +4d6 de dano de morte'
            }
        }
    }
];

// Mapa para busca rápida por ID (exportado para testes)
export const RITUAL_BY_ID = new Map<string, UnifiedRitual>(
    UNIFIED_RITUALS.map(r => [r.id, r])
);
