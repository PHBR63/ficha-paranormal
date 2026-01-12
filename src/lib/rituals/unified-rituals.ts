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
                summary: 'Arma causa +1d6 de dano',
                weaponEffect: {
                    damageBonus: '1d6',
                    special: 'Dano elemental'
                }
            },
            discente: {
                summary: 'Arma causa +2d6 de dano',
                weaponEffect: {
                    damageBonus: '2d6',
                    special: 'Dano elemental'
                }
            },
            verdadeiro: {
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
        isSustainable: false, // Pode ser sustentado em outras versões, mas aqui é Cena
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
                defenseBonus: 5,
                summary: '+5 Defesa'
            },
            discente: {
                defenseBonus: 10,
                summary: '+10 Defesa'
            },
            verdadeiro: {
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
        duration: 'instantanea', // Sustentada na versão Discente
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
                damage: '2d8+2',
                summary: '2d8+2 dano de Morte'
            },
            discente: {
                damage: '4d8+4',
                damagePerTurn: '2d8+2', // Exemplo
                summary: 'Dano contínuo'
            }
        }
    }
];
