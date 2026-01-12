/**
 * Tipos para Sistema Unificado de Rituais
 * Ordem Paranormal RPG v1.3
 */

export interface RitualEnhancement {
    name: 'Discente' | 'Verdadeiro';
    cost: number;
    description: string;
    circleReq?: number;
    affinityReq?: boolean;
}

export interface WeaponEffectConfig {
    damageBonus?: number | string; // Número ou "1d6"
    attackBonus?: number;
    criticalBonus?: number;
    criticalMultiplierBonus?: number;
    extraDice?: {
        diceCount: number;
        diceType: number;
    };
    damageType?: string;
    special?: string;
}

export interface RitualMechanics {
    // Combate
    attackBonus?: number;
    damageBonus?: number | string;
    defenseBonus?: number;

    // Resistência e Redução
    damageReduction?: {
        amount: number;
        types?: string[];
    };
    resistanceBonus?: number;

    // Perícias
    skillBonus?: {
        skills: string[];
        bonus: number;
        isContextual?: boolean;
        context?: string;
    };

    // PV temporários
    tempHP?: {
        diceCount: number;
        diceType: number;
        bonus?: number;
    };

    // Efeitos de arma
    weaponEffect?: WeaponEffectConfig;

    // Condições e Restrições
    conditions?: Array<{ id: string }>;
    actionRestrictions?: string[];

    // Efeitos Especiais
    areaEffect?: {
        shape: string;
        radius?: number;
        length?: number;
    };
    mentalControl?: {
        type: string;
    };
    senseEffect?: {
        type: string;
        range?: number;
        information?: string;
    };

    // Outros
    damage?: any; // Informacional
    damagePerTurn?: any; // Informacional
    summary?: string;
}

export interface UnifiedRitual {
    id: string;
    name: string;
    element: string; // 'Sangue', 'Morte', 'Energia', 'Conhecimento', 'Medo'
    circle: number;
    description?: string;
    cost: number;

    // Configuração
    isSustainable?: boolean;
    duration?: string;
    range?: string;
    execution?: string;
    resistance?: string;
    target?: string;

    // Flag helper
    isWeaponBuff?: boolean;

    // Aprimoramentos
    enhancements?: RitualEnhancement[];

    // Efeitos mecânicos por nível
    effects: {
        base: RitualMechanics;
        discente?: RitualMechanics;
        verdadeiro?: RitualMechanics;
    };
}
