/**
 * Ordem Paranormal RPG - Sistema de Efeitos de Rituais
 * Fase 1: Estrutura de dados para efeitos mecânicos dos rituais
 * Define dano, condições aplicadas, modificadores de arma, etc.
 */

import { RitualElement } from './rituals-data';

// ==================== TIPOS DE DANO ====================
export type DamageType = 
  | 'balístico' 
  | 'corte' 
  | 'impacto' 
  | 'perfuração'
  | 'fogo'
  | 'frio'
  | 'elétrico'
  | 'ácido'
  | 'químico';

// Tipo de dano elemental (baseado no elemento do ritual)
export type ElementalDamageType = 'sangue' | 'morte' | 'conhecimento' | 'energia' | 'medo';

// Todos os tipos de dano possíveis
export type AnyDamageType = DamageType | ElementalDamageType | 'mental' | 'verdadeiro';

// ==================== TIPOS DE RESISTÊNCIA ====================
export type ResistanceType = 'fortitude' | 'reflexos' | 'vontade';
export type ResistanceEffect = 'anula' | 'parcial' | 'reduz_metade';

// ==================== INTERFACE DE FÓRMULA DE DANO ====================
export interface DamageFormula {
  diceCount: number;      // Quantidade de dados (ex: 3)
  diceType: number;       // Tipo de dado (ex: 6 para d6)
  bonus?: number;         // Bônus fixo (ex: +3)
  damageType: AnyDamageType;
  ignoresRD?: boolean;    // Dano verdadeiro
}

// ==================== INTERFACE DE EFEITO DE RITUAL ====================
export interface RitualEffect {
  // === Dano ===
  damage?: DamageFormula;

  // === Cura ===
  healing?: {
    diceCount: number;
    diceType: number;
    bonus?: number;
  };

  // === PV Temporários ===
  tempHP?: {
    diceCount: number;
    diceType: number;
    bonus?: number;
  };

  // === Condições Aplicadas ===
  appliesConditions?: {
    conditionId: string;
    duration?: 'rodada' | 'cena' | 'sustentado' | 'permanente';
    turnsCount?: number;
  }[];

  // === Modificadores de Defesa ===
  defenseModifier?: number;

  // === Modificadores de Ataque ===
  attackModifier?: number;

  // === Modificadores de Arma (para Amaldiçoar Arma, Arma Atroz, etc.) ===
  weaponEffect?: {
    bonusDamage?: DamageFormula;  // Dano adicional
    attackBonus?: number;          // Bônus no teste de ataque
    criticalBonus?: number;        // Bônus na margem de ameaça
    criticalMultiplierBonus?: number; // Bônus no multiplicador de crítico
  };

  // === Resistência ===
  resistance?: {
    type: ResistanceType;
    effect: ResistanceEffect;
    dt?: number; // Se não informado, usa DT padrão do ritual
  };

  // === Efeitos de Área ===
  areaEffect?: {
    shape: 'explosão' | 'linha' | 'cone' | 'esfera' | 'cubo';
    radius?: number;  // Em metros
    length?: number;  // Para linhas
  };

  // === Modificadores em Perícias ===
  skillModifier?: {
    skills: string[];
    bonus: number; // Pode ser negativo para penalidades
  };

  // === Proteção/RD ===
  damageReduction?: {
    types: AnyDamageType[];
    amount: number;
  };

  // === Outros efeitos especiais ===
  special?: string; // Descrição de efeitos únicos não categorizáveis
}

// ==================== INTERFACE DE EFEITO POR NÍVEL ====================
export interface RitualEffectsByLevel {
  base: RitualEffect;
  discente?: RitualEffect;
  verdadeiro?: RitualEffect;
}

// ==================== MAPEAMENTO DE RITUAIS → EFEITOS ====================
export const RITUAL_EFFECTS: Record<string, RitualEffectsByLevel> = {
  // === RITUAIS DE DANO - 1º CÍRCULO ===
  
  // Amaldiçoar Arma (todas as versões)
  'amaldicoar-arma-conhecimento': {
    base: {
      weaponEffect: {
        bonusDamage: { diceCount: 1, diceType: 6, damageType: 'conhecimento' },
      },
    },
    discente: {
      weaponEffect: {
        bonusDamage: { diceCount: 2, diceType: 6, damageType: 'conhecimento' },
      },
    },
    verdadeiro: {
      weaponEffect: {
        bonusDamage: { diceCount: 4, diceType: 6, damageType: 'conhecimento' },
      },
    },
  },
  'amaldicoar-arma-energia': {
    base: {
      weaponEffect: {
        bonusDamage: { diceCount: 1, diceType: 6, damageType: 'energia' },
      },
    },
    discente: {
      weaponEffect: {
        bonusDamage: { diceCount: 2, diceType: 6, damageType: 'energia' },
      },
    },
    verdadeiro: {
      weaponEffect: {
        bonusDamage: { diceCount: 4, diceType: 6, damageType: 'energia' },
      },
    },
  },
  'amaldicoar-arma-morte': {
    base: {
      weaponEffect: {
        bonusDamage: { diceCount: 1, diceType: 6, damageType: 'morte' },
      },
    },
    discente: {
      weaponEffect: {
        bonusDamage: { diceCount: 2, diceType: 6, damageType: 'morte' },
      },
    },
    verdadeiro: {
      weaponEffect: {
        bonusDamage: { diceCount: 4, diceType: 6, damageType: 'morte' },
      },
    },
  },
  'amaldicoar-arma-sangue': {
    base: {
      weaponEffect: {
        bonusDamage: { diceCount: 1, diceType: 6, damageType: 'sangue' },
      },
    },
    discente: {
      weaponEffect: {
        bonusDamage: { diceCount: 2, diceType: 6, damageType: 'sangue' },
      },
    },
    verdadeiro: {
      weaponEffect: {
        bonusDamage: { diceCount: 4, diceType: 6, damageType: 'sangue' },
      },
    },
  },

  // Eletrocussão
  'eletrocussao': {
    base: {
      damage: { diceCount: 3, diceType: 6, damageType: 'elétrico' },
      appliesConditions: [{ conditionId: 'vulneravel', duration: 'rodada', turnsCount: 1 }],
      resistance: { type: 'fortitude', effect: 'parcial' },
    },
    discente: {
      damage: { diceCount: 6, diceType: 6, damageType: 'elétrico' },
      areaEffect: { shape: 'linha', length: 30 },
      resistance: { type: 'fortitude', effect: 'parcial' },
    },
    verdadeiro: {
      damage: { diceCount: 8, diceType: 6, damageType: 'elétrico' },
      resistance: { type: 'fortitude', effect: 'parcial' },
    },
  },

  // Embaralhar
  'embaralhar': {
    base: {
      defenseModifier: 6,
      special: 'Cria 3 cópias ilusórias. Cada ataque errado destrói 1 cópia (-2 Defesa).',
    },
    discente: {
      defenseModifier: 10,
      special: 'Cria 5 cópias ilusórias.',
    },
    verdadeiro: {
      defenseModifier: 16,
      special: 'Cria 8 cópias. Atacante fica ofuscado quando destrói cópia.',
      appliesConditions: [{ conditionId: 'cego', duration: 'rodada', turnsCount: 1 }],
    },
  },

  // Decadência
  'decadencia': {
    base: {
      damage: { diceCount: 2, diceType: 8, bonus: 2, damageType: 'morte' },
      resistance: { type: 'fortitude', effect: 'reduz_metade' },
    },
    discente: {
      damage: { diceCount: 3, diceType: 8, bonus: 3, damageType: 'morte' },
      special: 'Combina com ataque corpo a corpo, sem resistência.',
    },
    verdadeiro: {
      damage: { diceCount: 8, diceType: 8, bonus: 8, damageType: 'morte' },
      areaEffect: { shape: 'explosão', radius: 6 },
      resistance: { type: 'fortitude', effect: 'reduz_metade' },
    },
  },

  // Definhar
  'definhar': {
    base: {
      appliesConditions: [{ conditionId: 'exausto', duration: 'cena' }],
      resistance: { type: 'fortitude', effect: 'parcial' },
      special: 'Sucesso na resistência: fica vulnerável em vez de fatigado.',
    },
    discente: {
      appliesConditions: [{ conditionId: 'exausto', duration: 'cena' }],
      resistance: { type: 'fortitude', effect: 'parcial' },
      special: 'Falha: exausto. Sucesso: fatigado.',
    },
    verdadeiro: {
      appliesConditions: [{ conditionId: 'exausto', duration: 'cena' }],
      resistance: { type: 'fortitude', effect: 'parcial' },
      special: 'Até 5 alvos. Falha: exausto. Sucesso: fatigado.',
    },
  },

  // Esfolar
  'esfolar': {
    base: {
      damage: { diceCount: 3, diceType: 4, bonus: 3, damageType: 'corte' },
      appliesConditions: [{ conditionId: 'sangrando', duration: 'permanente' }],
      resistance: { type: 'reflexos', effect: 'parcial' },
    },
    discente: {
      damage: { diceCount: 5, diceType: 4, bonus: 5, damageType: 'corte' },
      appliesConditions: [{ conditionId: 'sangrando', duration: 'permanente' }],
      areaEffect: { shape: 'explosão', radius: 6 },
      resistance: { type: 'reflexos', effect: 'parcial' },
    },
    verdadeiro: {
      damage: { diceCount: 10, diceType: 4, bonus: 10, damageType: 'corte' },
      appliesConditions: [{ conditionId: 'sangrando', duration: 'permanente' }],
      areaEffect: { shape: 'explosão', radius: 6 },
      resistance: { type: 'reflexos', effect: 'reduz_metade' },
      special: 'Passar na resistência não evita sangramento.',
    },
  },

  // Arma Atroz
  'arma-atroz': {
    base: {
      weaponEffect: {
        attackBonus: 2,
        criticalBonus: 1,
      },
    },
    discente: {
      weaponEffect: {
        attackBonus: 5,
        criticalBonus: 1,
      },
    },
    verdadeiro: {
      weaponEffect: {
        attackBonus: 5,
        criticalBonus: 2,
        criticalMultiplierBonus: 1,
      },
    },
  },

  // Armadura de Sangue
  'armadura-de-sangue': {
    base: {
      defenseModifier: 5,
    },
    discente: {
      defenseModifier: 10,
      damageReduction: {
        types: ['balístico', 'corte', 'impacto', 'perfuração'],
        amount: 5,
      },
    },
    verdadeiro: {
      defenseModifier: 15,
      damageReduction: {
        types: ['balístico', 'corte', 'impacto', 'perfuração'],
        amount: 10,
      },
    },
  },

  // Cicatrização
  'cicatrizacao': {
    base: {
      healing: { diceCount: 3, diceType: 8, bonus: 3 },
      special: 'Alvo envelhece 1 ano.',
    },
    discente: {
      healing: { diceCount: 5, diceType: 8, bonus: 5 },
      special: 'Alvo envelhece 1 ano.',
    },
    verdadeiro: {
      healing: { diceCount: 7, diceType: 8, bonus: 7 },
      special: 'Alcance curto, múltiplos alvos. Cada alvo envelhece 1 ano.',
    },
  },

  // Consumir Manancial
  'consumir-manancial': {
    base: {
      tempHP: { diceCount: 3, diceType: 6 },
      special: 'PV temporários desaparecem no fim da cena. Gera Lodo.',
    },
    discente: {
      tempHP: { diceCount: 6, diceType: 6 },
    },
    verdadeiro: {
      damage: { diceCount: 3, diceType: 6, damageType: 'morte' },
      areaEffect: { shape: 'esfera', radius: 6 },
      resistance: { type: 'fortitude', effect: 'reduz_metade' },
      special: 'Recebe PV temporários iguais ao dano total causado.',
    },
  },

  // Fortalecimento Sensorial
  'fortalecimento-sensorial': {
    base: {
      skillModifier: {
        skills: ['Investigação', 'Luta', 'Percepção', 'Pontaria'],
        bonus: 1, // +1d6, será tratado como bônus de dado
      },
    },
    discente: {
      skillModifier: {
        skills: ['Investigação', 'Luta', 'Percepção', 'Pontaria'],
        bonus: 1,
      },
      special: 'Inimigos sofrem -1d6 em ataques contra você.',
    },
    verdadeiro: {
      defenseModifier: 10,
      special: 'Imune a surpresa e desprevenido. +10 em Defesa e Reflexos.',
    },
  },

  // Coincidência Forçada
  'coincidencia-forcada': {
    base: {
      skillModifier: {
        skills: ['*'], // Todas as perícias
        bonus: 2,
      },
    },
    discente: {
      skillModifier: {
        skills: ['*'],
        bonus: 2,
      },
      special: 'Afeta múltiplos aliados.',
    },
    verdadeiro: {
      skillModifier: {
        skills: ['*'],
        bonus: 5,
      },
      special: 'Afeta múltiplos aliados.',
    },
  },

  // Luz
  'luz': {
    base: {
      special: 'Objeto emite luz em área de 9m de raio.',
    },
    discente: {
      appliesConditions: [{ conditionId: 'ofuscado', duration: 'sustentado' }],
      special: 'Cria 4 esferas móveis. Criaturas na área iluminada ficam ofuscadas.',
    },
    verdadeiro: {
      skillModifier: {
        skills: ['Vontade'],
        bonus: 20,
      },
      appliesConditions: [{ conditionId: 'ofuscado', duration: 'cena' }],
      special: 'Luz solar. Aliados +20 Vontade, inimigos ofuscados.',
    },
  },

  // Polarização Caótica
  'polarizacao-caotica': {
    base: {
      damageReduction: {
        types: ['balístico', 'corte', 'impacto', 'perfuração'],
        amount: 5,
      },
      special: 'Atrair: puxa objeto metálico (espaço 2-). Repelir: RD 5 contra metálicos.',
    },
    discente: {
      damage: { diceCount: 1, diceType: 6, damageType: 'impacto' },
      special: 'Arremessa até 10 objetos (dano fixo por objeto). Reflexos reduz metade.',
      resistance: { type: 'reflexos', effect: 'reduz_metade' },
    },
    verdadeiro: {
      special: 'Levita e move ser/objeto (espaço 10-) por 9m.',
    },
  },

  // Amaldiçoar Tecnologia
  'amaldicoar-tecnologia': {
    base: {
      weaponEffect: {
        attackBonus: 0,
      },
      special: 'Concede 1 modificação de arma de fogo à escolha.',
    },
    discente: {
      special: 'Concede 2 modificações de arma de fogo.',
    },
    verdadeiro: {
      special: 'Concede 3 modificações de arma de fogo.',
    },
  },

  // Apagar as Luzes
  'apagar-as-luzes': {
    base: {
      special: 'Apaga fontes de luz em alcance curto.',
    },
    discente: {
      special: 'Apaga fontes de luz em alcance médio.',
    },
    verdadeiro: {
      appliesConditions: [{ conditionId: 'cego', duration: 'cena' }],
      special: 'Apaga fontes de luz em alcance longo e cria escuridão mágica.',
    },
  },

  // Espirais da Perdição
  'espirais-da-perdicao': {
    base: {
      attackModifier: -2, // Representa -1d4 como penalidade média
      special: 'Alvo sofre -1d4 em testes de ataque.',
    },
    discente: {
      attackModifier: -3, // Representa -1d6 como penalidade média
      special: 'Alvo sofre -1d6 em testes de ataque.',
    },
    verdadeiro: {
      attackModifier: -7, // Representa -2d6 como penalidade média
      special: 'Alvos escolhidos sofrem -2d6 em testes de ataque.',
    },
  },

  // Nuvem de Cinzas
  'nuvem-de-cinzas': {
    base: {
      areaEffect: { shape: 'esfera', radius: 6 },
      special: 'Camuflagem leve a 1,5m, total a partir de 3m. Vento dispersa.',
    },
    discente: {
      special: 'Seres escolhidos enxergam através da nuvem.',
    },
    verdadeiro: {
      attackModifier: -2,
      special: 'Nuvem sólida. Deslocamento 3m, -2 em ataque dentro dela.',
    },
  },

  // Corpo Adaptado
  'corpo-adaptado': {
    base: {
      special: 'Imune a calor/frio extremos. Respira na água. Não sufoca em fumaça.',
    },
    discente: {
      special: 'Duração 1 dia.',
    },
    verdadeiro: {
      special: 'Alcance curto, alvos escolhidos.',
    },
  },

  // Ódio Incontrolável
  'odio-incontrolavel': {
    base: {
      attackModifier: 2,
      damageReduction: {
        types: ['balístico', 'corte', 'impacto', 'perfuração'],
        amount: 5,
      },
      special: '+2 ataque/dano corpo a corpo, RD 5 física. Deve sempre atacar.',
    },
    discente: {
      attackModifier: 2,
      damageReduction: {
        types: ['balístico', 'corte', 'impacto', 'perfuração'],
        amount: 5,
      },
      special: '+2 ataque/dano corpo a corpo, RD 5 física. Frenesi intensificado.',
    },
    verdadeiro: {
      attackModifier: 5,
      special: '+5 ataque/dano corpo a corpo. Sofre metade do dano físico.',
    },
  },

  // Distorcer Aparência
  'distorcer-aparencia': {
    base: {
      skillModifier: {
        skills: ['Enganação'],
        bonus: 10,
      },
      special: 'Modifica aparência. +10 Enganação para disfarce.',
      resistance: { type: 'vontade', effect: 'anula' },
    },
    discente: {
      skillModifier: {
        skills: ['Enganação'],
        bonus: 10,
      },
      special: 'Alcance curto, 1 ser. Vontade anula se involuntário.',
    },
    verdadeiro: {
      skillModifier: {
        skills: ['Enganação'],
        bonus: 10,
      },
      special: 'Alcance curto, seres escolhidos.',
    },
  },

  // Desfazer Sinapses
  'desfazer-sinapses': {
    base: {
      damage: { diceCount: 2, diceType: 6, bonus: 2, damageType: 'conhecimento' },
      appliesConditions: [{ conditionId: 'frustrado', duration: 'rodada', turnsCount: 1 }],
      resistance: { type: 'vontade', effect: 'parcial' },
    },
    discente: {
      damage: { diceCount: 3, diceType: 6, bonus: 3, damageType: 'conhecimento' },
      appliesConditions: [{ conditionId: 'frustrado', duration: 'rodada', turnsCount: 1 }],
      special: 'Alcance longo, até 5 alvos.',
      resistance: { type: 'vontade', effect: 'parcial' },
    },
    verdadeiro: {
      damage: { diceCount: 8, diceType: 6, bonus: 8, damageType: 'conhecimento' },
      appliesConditions: [{ conditionId: 'esmorecido', duration: 'cena' }],
      special: 'Alcance extremo. Falha: esmorecido. Sucesso: frustrado.',
      resistance: { type: 'vontade', effect: 'parcial' },
    },
  },

  // Enfeitiçar
  'enfeiticar': {
    base: {
      skillModifier: {
        skills: ['Diplomacia'],
        bonus: 10,
      },
      special: 'Alvo prestativo (+10 Diplomacia). Hostis +5 na resistência.',
      resistance: { type: 'vontade', effect: 'anula' },
    },
    discente: {
      special: 'Pode sugerir uma ação aceitável para o alvo.',
      resistance: { type: 'vontade', effect: 'anula' },
    },
    verdadeiro: {
      skillModifier: {
        skills: ['Diplomacia'],
        bonus: 10,
      },
      special: 'Afeta todos os alvos no alcance.',
      resistance: { type: 'vontade', effect: 'anula' },
    },
  },

  // Terceiro Olho
  'terceiro-olho': {
    base: {
      special: 'Enxerga auras paranormais em alcance longo. Sabe elemento e poder aproximado.',
    },
    discente: {
      special: 'Duração 1 dia.',
    },
    verdadeiro: {
      special: 'Enxerga criaturas e objetos invisíveis.',
    },
  },

  // Cinerária (Medo - 1º Círculo)
  'cineraria': {
    base: {
      areaEffect: { shape: 'esfera', radius: 6 },
      special: 'Névoa paranormal. Rituais na área +5 DT.',
    },
    discente: {
      special: 'Rituais na área +5 DT e -2 PE no custo.',
    },
    verdadeiro: {
      special: 'Rituais na área +5 DT, -2 PE e dano maximizado.',
    },
  },

  // Velocidade Mortal (1º Círculo - Morte)
  'velocidade-mortal': {
    base: {
      special: 'Concede 1 ação de movimento extra por turno.',
    },
    discente: {
      special: 'Concede 1 ação padrão extra por turno.',
    },
    verdadeiro: {
      special: 'Afeta alvos escolhidos em alcance curto.',
    },
  },

  // === RITUAIS DE 2º CÍRCULO ===

  // Caminhos de Sangue
  'caminhos-de-sangue': {
    base: {
      special: 'Teletransporta até 18m para espaço com sangue.',
    },
    discente: {
      areaEffect: { shape: 'esfera', radius: 3 },
      special: 'Cria área de sangue que aplica sangrando.',
      appliesConditions: [{ conditionId: 'sangrando', duration: 'permanente' }],
    },
    verdadeiro: {
      damage: { diceCount: 6, diceType: 6, damageType: 'sangue' },
      areaEffect: { shape: 'esfera', radius: 6 },
      special: 'Cria esfera de sangue que causa 6d6 em inimigos por turno.',
    },
  },

  // Aprimorar Físico
  'aprimorar-fisico': {
    base: {
      special: '+1 em Agilidade ou Força.',
    },
    discente: {
      special: '+2 em Agilidade ou Força.',
    },
    verdadeiro: {
      special: '+3 em Agilidade ou Força.',
    },
  },

  // Descarnar
  'descarnar': {
    base: {
      damage: { diceCount: 6, diceType: 8, damageType: 'sangue' },
      appliesConditions: [{ conditionId: 'sangrando', duration: 'permanente' }],
      resistance: { type: 'fortitude', effect: 'parcial' },
      special: 'Hemorragia causa 2d8/rodada (Fortitude evita).',
    },
    discente: {
      damage: { diceCount: 10, diceType: 8, damageType: 'sangue' },
      appliesConditions: [{ conditionId: 'sangrando', duration: 'permanente' }],
      special: 'Hemorragia causa 4d8/rodada.',
    },
    verdadeiro: {
      weaponEffect: {
        bonusDamage: { diceCount: 4, diceType: 8, damageType: 'sangue' },
      },
      appliesConditions: [{ conditionId: 'sangrando', duration: 'permanente' }],
      special: 'Seus ataques causam +4d8 Sangue e hemorragia.',
    },
  },

  // Flagelo de Sangue
  'flagelo-de-sangue': {
    base: {
      damage: { diceCount: 10, diceType: 6, damageType: 'sangue' },
      appliesConditions: [{ conditionId: 'enjoado', duration: 'cena' }],
      resistance: { type: 'fortitude', effect: 'parcial' },
      special: 'Grava marca. Desobediência causa 10d6 Sangue e enjoado.',
    },
    discente: {
      special: 'Afeta 1 ser (exceto criaturas de Sangue).',
    },
    verdadeiro: {
      special: 'Duração 1 dia.',
    },
  },

  // Hemofagia
  'hemofagia': {
    base: {
      damage: { diceCount: 6, diceType: 6, damageType: 'sangue' },
      healing: { diceCount: 3, diceType: 6 },
      resistance: { type: 'fortitude', effect: 'reduz_metade' },
      special: 'Causa 6d6 Sangue, recupera metade em PV.',
    },
    discente: {
      damage: { diceCount: 6, diceType: 6, damageType: 'sangue' },
      special: 'Sem resistência. Combina com ataque corpo a corpo.',
    },
    verdadeiro: {
      damage: { diceCount: 4, diceType: 6, damageType: 'sangue' },
      special: 'Sustentada. Ação padrão para 4d6 dano, recupera metade.',
    },
  },

  // Sede de Adrenalina
  'sede-de-adrenalina': {
    base: {
      special: 'Repete teste de Acrobacia/Atletismo falho OU reduz dano de queda em 4d6.',
    },
    discente: {
      special: 'Reduz dano de queda em 8d6.',
    },
    verdadeiro: {
      special: 'Reduz dano de queda em 12d6.',
    },
  },

  // Transfusão Vital
  'transfusao-vital': {
    base: {
      healing: { diceCount: 0, diceType: 0, bonus: 30 },
      special: 'Transfere até 30 PV seus para o alvo.',
    },
    discente: {
      healing: { diceCount: 0, diceType: 0, bonus: 50 },
      special: 'Transfere até 50 PV.',
    },
    verdadeiro: {
      healing: { diceCount: 0, diceType: 0, bonus: 100 },
      special: 'Transfere até 100 PV.',
    },
  },

  // Desacelerar Impacto
  'desacelerar-impacto': {
    base: {
      damageReduction: {
        types: ['balístico', 'impacto'],
        amount: 50, // Representa redução de queda
      },
      special: 'Reduz velocidade de queda (sem dano). Projéteis causam metade.',
    },
    verdadeiro: {
      special: 'Aumenta para até 100 espaços.',
    },
  },

  // Eco Espiral
  'eco-espiral': {
    base: {
      resistance: { type: 'fortitude', effect: 'reduz_metade' },
      special: 'Concentra 1ª rodada, descarrega 2ª. Dano igual ao sofrido na concentração.',
    },
    discente: {
      special: 'Até 5 seres.',
    },
    verdadeiro: {
      special: 'Duração 3 rodadas (concentra 2, descarrega 3).',
    },
  },

  // Língua Morta
  'lingua-morta': {
    base: {
      special: 'Cadáver responde 1 pergunta/rodada (máx 3).',
    },
    discente: {
      special: 'Máx 4 perguntas. Cadáver vira Enraizado no fim.',
    },
    verdadeiro: {
      special: 'Máx 5 perguntas. Cadáver vira Marionete no fim.',
    },
  },

  // Miasma Entrópico
  'miasma-entropico': {
    base: {
      damage: { diceCount: 4, diceType: 8, damageType: 'químico' },
      appliesConditions: [{ conditionId: 'enjoado', duration: 'rodada', turnsCount: 1 }],
      areaEffect: { shape: 'esfera', radius: 6 },
      resistance: { type: 'fortitude', effect: 'parcial' },
    },
    discente: {
      damage: { diceCount: 6, diceType: 8, damageType: 'morte' },
      appliesConditions: [{ conditionId: 'enjoado', duration: 'rodada', turnsCount: 1 }],
    },
    verdadeiro: {
      damage: { diceCount: 6, diceType: 8, damageType: 'morte' },
      special: 'Duração 3 rodadas (dano repetido no turno).',
    },
  },

  // Paradoxo
  'paradoxo': {
    base: {
      damage: { diceCount: 6, diceType: 6, damageType: 'morte' },
      areaEffect: { shape: 'esfera', radius: 6 },
      resistance: { type: 'fortitude', effect: 'reduz_metade' },
    },
    discente: {
      damage: { diceCount: 4, diceType: 6, damageType: 'morte' },
      areaEffect: { shape: 'esfera', radius: 1.5 },
      special: 'Duração cena. Causa 4d6 a quem entrar. Pode mover a esfera.',
    },
    verdadeiro: {
      damage: { diceCount: 13, diceType: 6, damageType: 'morte' },
      special: 'Se reduzir a 0 PV, vira cinzas (Fortitude evita).',
    },
  },

  // Aprimorar Mente
  'aprimorar-mente': {
    base: {
      special: '+1 em Intelecto ou Presença.',
    },
    discente: {
      special: '+2 em Intelecto ou Presença.',
    },
    verdadeiro: {
      special: '+3 em Intelecto ou Presença.',
    },
  },

  // Aurora da Verdade
  'aurora-da-verdade': {
    base: {
      areaEffect: { shape: 'esfera', radius: 3 },
      resistance: { type: 'vontade', effect: 'parcial' },
      special: 'Obriga verdade. Revela escondidos/invisíveis.',
    },
    discente: {
      areaEffect: { shape: 'esfera', radius: 9 },
      special: 'Alcance longo, área 9m. Conjurador não é afetado.',
    },
    verdadeiro: {
      areaEffect: { shape: 'esfera', radius: 9 },
      special: 'Alcance extremo, duração cena.',
    },
  },

  // Detecção de Ameaças
  'deteccao-de-ameacas': {
    base: {
      areaEffect: { shape: 'esfera', radius: 18 },
      special: 'Sente perigo na área. Percepção DT 20 para direção/distância.',
    },
    discente: {
      defenseModifier: 5,
      special: 'Não fica desprevenido. +5 resistência vs armadilhas.',
    },
    verdadeiro: {
      special: 'Duração 1 dia.',
    },
  },

  // Esconder dos Olhos
  'esconder-dos-olhos': {
    base: {
      skillModifier: {
        skills: ['Furtividade'],
        bonus: 15,
      },
      special: 'Invisível (+15 Furtividade). Ataque encerra.',
    },
    discente: {
      skillModifier: {
        skills: ['Furtividade'],
        bonus: 15,
      },
      areaEffect: { shape: 'esfera', radius: 3 },
      special: 'Esfera de invisibilidade 3m (você e aliados).',
    },
    verdadeiro: {
      skillModifier: {
        skills: ['Furtividade'],
        bonus: 15,
      },
      special: 'Toque, 1 ser. Ataque não dissipa.',
    },
  },

  // Invadir Mente
  'invadir-mente': {
    base: {
      damage: { diceCount: 6, diceType: 6, damageType: 'conhecimento' },
      appliesConditions: [{ conditionId: 'atordoado', duration: 'rodada', turnsCount: 1 }],
      resistance: { type: 'vontade', effect: 'parcial' },
      special: 'Rajada: 6d6 e atordoado. OU Ligação telepática entre 2 pessoas.',
    },
    discente: {
      damage: { diceCount: 10, diceType: 6, damageType: 'conhecimento' },
      special: 'Rajada 10d6. Ligação permite ver pelos sentidos do alvo.',
    },
    verdadeiro: {
      damage: { diceCount: 10, diceType: 6, damageType: 'conhecimento' },
      special: 'Rajada em seres escolhidos. Ligação até 5 pessoas.',
    },
  },

  // Localização
  'localizacao': {
    base: {
      areaEffect: { shape: 'esfera', radius: 90 },
      special: 'Encontra direção/distância de pessoa ou objeto.',
    },
    discente: {
      special: 'Toque, 1h. Encontra caminho/rota em lugar.',
    },
    verdadeiro: {
      areaEffect: { shape: 'esfera', radius: 1000 },
      special: 'Área 1km de raio.',
    },
  },

  // Chamas do Caos
  'chamas-do-caos': {
    base: {
      weaponEffect: {
        bonusDamage: { diceCount: 1, diceType: 6, damageType: 'fogo' },
      },
      damage: { diceCount: 3, diceType: 6, damageType: 'fogo' },
      special: 'Chamejar: +1d6 fogo. Esquentar: 1d6/rd. Modelar: 3d6 ao atravessar.',
    },
    discente: {
      damage: { diceCount: 4, diceType: 6, damageType: 'energia' },
      resistance: { type: 'reflexos', effect: 'reduz_metade' },
      special: 'Projeta labareda 4d6 Energia.',
    },
    verdadeiro: {
      damage: { diceCount: 8, diceType: 6, damageType: 'energia' },
      special: 'Labareda causa 8d6 Energia.',
    },
  },

  // Contenção Fantasmagórica
  'contencao-fantasmagorica': {
    base: {
      appliesConditions: [{ conditionId: 'agarrado', duration: 'cena' }],
      resistance: { type: 'reflexos', effect: 'anula' },
      special: '3 laços prendem (agarrado). Atletismo ou destruir (Def 10, 10 PV, RD 5).',
    },
    discente: {
      appliesConditions: [{ conditionId: 'agarrado', duration: 'cena' }],
      special: '6 laços, múltiplos alvos.',
    },
    verdadeiro: {
      damage: { diceCount: 2, diceType: 6, bonus: 2, damageType: 'energia' },
      special: 'Laços destruídos explodem (2d6+2 Energia).',
    },
  },

  // Dissonância Acústica
  'dissonancia-acustica': {
    base: {
      appliesConditions: [{ conditionId: 'surdo', duration: 'sustentado' }],
      areaEffect: { shape: 'esfera', radius: 6 },
      special: 'Seres ficam surdos. Impede conjuração de rituais na área.',
    },
    discente: {
      areaEffect: { shape: 'esfera', radius: 3 },
      special: 'Alvo objeto. Emana silêncio 3m raio.',
    },
    verdadeiro: {
      special: 'Duração cena. Som não sai da área.',
    },
  },

  // Sopro do Caos
  'sopro-do-caos': {
    base: {
      appliesConditions: [{ conditionId: 'vulneravel', duration: 'sustentado' }],
      special: 'Ascender: levita (vulnerável). Sopro: empurra. Vento: vento forte.',
    },
    discente: {
      special: 'Afeta alvos Grandes.',
    },
    verdadeiro: {
      special: 'Afeta alvos Enormes.',
    },
  },

  // Tela de Ruído
  'tela-de-ruido': {
    base: {
      tempHP: { diceCount: 0, diceType: 0, bonus: 30 },
      damageReduction: {
        types: ['balístico', 'corte', 'impacto', 'perfuração'],
        amount: 15,
      },
      special: '30 PV temp contra dano físico. OU Reação RD 15 contra 1 ataque.',
    },
    discente: {
      tempHP: { diceCount: 0, diceType: 0, bonus: 60 },
      damageReduction: {
        types: ['balístico', 'corte', 'impacto', 'perfuração'],
        amount: 30,
      },
      special: '60 PV temp, RD 30.',
    },
    verdadeiro: {
      special: 'Esfera imóvel em alvo Enorme-. Bloqueia tudo.',
    },
  },

  // Tremeluzir
  'tremeluzir': {
    base: {
      damage: { diceCount: 1, diceType: 4, damageType: 'energia' },
      special: 'Atravessa objetos sólidos (25% falha). 1d4 Energia/rodada.',
    },
    discente: {
      special: 'Toque, 1 ser.',
    },
    verdadeiro: {
      special: 'Curto, até 5 seres.',
    },
  },

  // Proteção contra Rituais
  'protecao-contra-rituais': {
    base: {
      damageReduction: {
        types: ['sangue', 'morte', 'conhecimento', 'energia', 'medo'],
        amount: 5,
      },
      defenseModifier: 5,
      special: 'RD paranormal 5, +5 resistência vs rituais.',
    },
    discente: {
      special: 'Até 5 seres.',
    },
    verdadeiro: {
      damageReduction: {
        types: ['sangue', 'morte', 'conhecimento', 'energia', 'medo'],
        amount: 10,
      },
      defenseModifier: 10,
      special: 'RD 10, +10 resistência.',
    },
  },

  // Rejeitar Névoa
  'rejeitar-nevoa': {
    base: {
      areaEffect: { shape: 'esfera', radius: 6 },
      special: 'Aumenta custo (+2 PE/círculo) e tempo de rituais na área. Anula Cinerária.',
    },
    discente: {
      special: 'Reduz DT de rituais na área em -5.',
    },
  },

  // === RITUAIS DE MEDO ===

  // Pânico
  'panico': {
    base: {
      appliesConditions: [{ conditionId: 'apavorado', duration: 'cena' }],
      resistance: { type: 'vontade', effect: 'anula' },
    },
    discente: {
      appliesConditions: [{ conditionId: 'apavorado', duration: 'cena' }],
      resistance: { type: 'vontade', effect: 'parcial' },
      special: 'Múltiplos alvos. Sucesso: abalado em vez de apavorado.',
    },
    verdadeiro: {
      appliesConditions: [{ conditionId: 'apavorado', duration: 'cena' }],
      resistance: { type: 'vontade', effect: 'parcial' },
      special: 'Área de 9m. Sucesso: abalado. Falha: apavorado + 3d6 dano mental.',
      damage: { diceCount: 3, diceType: 6, damageType: 'mental' },
    },
  },

  // Sussurros Insanos
  'sussurros-insanos': {
    base: {
      appliesConditions: [{ conditionId: 'confuso', duration: 'cena' }],
      resistance: { type: 'vontade', effect: 'anula' },
    },
    discente: {
      appliesConditions: [{ conditionId: 'confuso', duration: 'cena' }],
      resistance: { type: 'vontade', effect: 'parcial' },
      special: 'Falha por 5+: fica fascinado ouvindo os sussurros.',
    },
    verdadeiro: {
      appliesConditions: [{ conditionId: 'confuso', duration: 'cena' }],
      resistance: { type: 'vontade', effect: 'parcial' },
      special: 'Área de 9m. Pode comandar ações dos afetados.',
    },
  },

  // === RITUAIS DE 3º CÍRCULO ===

  // === SANGUE ===

  // Ferver Sangue
  'ferver-sangue': {
    base: {
      damage: { diceCount: 4, diceType: 8, damageType: 'sangue' },
      appliesConditions: [{ conditionId: 'fraco', duration: 'sustentado' }],
      resistance: { type: 'fortitude', effect: 'parcial' },
      special: 'Sustentado. Causa 4d8 Sangue e fraco por turno. Passar 2x encerra.',
    },
    verdadeiro: {
      damage: { diceCount: 4, diceType: 8, damageType: 'sangue' },
      special: 'Seres escolhidos em alcance curto.',
    },
  },

  // Forma Monstruosa
  'forma-monstruosa': {
    base: {
      attackModifier: 5,
      tempHP: { diceCount: 0, diceType: 0, bonus: 30 },
      special: 'Vira monstro Grande. +5 ataque/dano, 30 PV temp. Fúria (não fala/conjura, deve atacar).',
    },
    discente: {
      special: 'Imune a atordoamento, fadiga, sangramento, sono, veneno.',
    },
    verdadeiro: {
      attackModifier: 10,
      tempHP: { diceCount: 0, diceType: 0, bonus: 50 },
      special: '+10 ataque/dano, 50 PV temp.',
    },
  },

  // Odor da Caçada
  'odor-da-cacada': {
    base: {
      skillModifier: {
        skills: ['Atletismo'],
        bonus: 5,
      },
      special: 'Recebe faro. +5 Atletismo em perseguição, não perde PV por esforço. Fome/Sede depois.',
    },
    discente: {
      special: 'Toque, 1 ser.',
    },
    verdadeiro: {
      special: 'Curto, até 5 seres.',
    },
  },

  // Purgatório
  'purgatorio': {
    base: {
      damage: { diceCount: 6, diceType: 6, damageType: 'sangue' },
      areaEffect: { shape: 'esfera', radius: 6 },
      resistance: { type: 'fortitude', effect: 'parcial' },
      special: 'Inimigos vulneráveis a dano físico. Sair causa 6d6 Sangue e pode impedir movimento.',
    },
  },

  // Vomitar Pestes
  'vomitar-pestes': {
    base: {
      damage: { diceCount: 5, diceType: 12, damageType: 'sangue' },
      resistance: { type: 'reflexos', effect: 'reduz_metade' },
      special: 'Enxame Grande causa 5d12 Sangue. Movimento 12m.',
    },
    discente: {
      appliesConditions: [{ conditionId: 'agarrado', duration: 'sustentado' }],
      special: 'Agarra quem falhar no Reflexos.',
    },
    verdadeiro: {
      special: 'Enxame Enorme (6m), voo 18m.',
    },
  },

  // === MORTE ===

  // Âncora Temporal
  'ancora-temporal': {
    base: {
      appliesConditions: [{ conditionId: 'imóvel', duration: 'sustentado' }],
      resistance: { type: 'vontade', effect: 'parcial' },
      special: 'Impede deslocamento se falhar na Vontade no início do turno. Passar 2x encerra.',
    },
    verdadeiro: {
      special: 'Seres à escolha em alcance curto.',
    },
  },

  // Fedor Pútrido
  'fedor-putrido': {
    base: {
      skillModifier: {
        skills: ['Furtividade'],
        bonus: 5,
      },
      damage: { diceCount: 1, diceType: 4, damageType: 'morte' },
      special: 'Animais se afastam, -20 Diplomacia. +5 Furtividade, +10 Enganação (fingir morto). 1d4 Morte/rd.',
    },
    discente: {
      special: 'Toque, 1 ser.',
    },
    verdadeiro: {
      special: 'Curto, até 5 seres.',
    },
  },

  // Poeira da Podridão
  'poeira-da-podridao': {
    base: {
      damage: { diceCount: 4, diceType: 8, damageType: 'morte' },
      areaEffect: { shape: 'esfera', radius: 6 },
      resistance: { type: 'fortitude', effect: 'reduz_metade' },
      special: 'Nuvem causa 4d8 Morte no início do turno e impede cura.',
    },
    discente: {
      damage: { diceCount: 6, diceType: 8, damageType: 'morte' },
      special: 'Muda para 6d8 de dano.',
    },
    verdadeiro: {
      damage: { diceCount: 6, diceType: 8, damageType: 'morte' },
      special: 'Área 9m de raio.',
    },
  },

  // Tentáculos de Lodo
  'tentaculos-de-lodo': {
    base: {
      damage: { diceCount: 4, diceType: 6, damageType: 'impacto' },
      appliesConditions: [{ conditionId: 'agarrado', duration: 'sustentado' }],
      resistance: { type: 'reflexos', effect: 'anula' },
      special: '4 tentáculos (Def 10, 20 PV). Agarram e causam 4d6 impacto.',
    },
    discente: {
      special: '6 tentáculos.',
    },
    verdadeiro: {
      special: '8 tentáculos que devoram (dano dobrado a agarrados).',
    },
  },

  // Zerar Entropia
  'zerar-entropia': {
    base: {
      special: 'Paralisa alvo no tempo. Invulnerável e não age. Vontade no início do turno para sair.',
    },
    discente: {
      special: 'Afeta objeto Enorme ou menor. Vira estátua temporal.',
    },
    verdadeiro: {
      special: 'Toque, até 5 seres voluntários. Podem sair quando quiserem.',
    },
  },

  // === CONHECIMENTO ===

  // Alterar Memória
  'alterar-memoria': {
    base: {
      resistance: { type: 'vontade', effect: 'anula' },
      special: 'Modifica 5min de memória das últimas 24h.',
    },
    discente: {
      special: 'Modifica 1h de memória.',
    },
    verdadeiro: {
      special: 'Modifica até 1 dia de memória de qualquer época.',
    },
  },

  // Contato Paranormal
  'contato-paranormal': {
    base: {
      special: 'Faz 3 perguntas a entidade. Respostas vagas. Pode exigir serviço.',
    },
    discente: {
      special: 'Faz 5 perguntas.',
    },
    verdadeiro: {
      special: 'Faz 8 perguntas com respostas mais claras.',
    },
  },

  // Mergulho Mental
  'mergulho-mental': {
    base: {
      resistance: { type: 'vontade', effect: 'anula' },
      special: 'Vasculha mente do alvo. Encontra informação superficial.',
    },
    discente: {
      special: 'Encontra memórias profundas. Causa 2d6 dano mental.',
      damage: { diceCount: 2, diceType: 6, damageType: 'conhecimento' },
    },
    verdadeiro: {
      special: 'Controle total sobre memórias. Causa 4d6 dano mental.',
      damage: { diceCount: 4, diceType: 6, damageType: 'conhecimento' },
    },
  },

  // Relembrar Fragmento
  'relembrar-fragmento': {
    base: {
      special: 'Revive memória de objeto ou local (últimas 24h).',
    },
    discente: {
      special: 'Revive memórias de até 1 semana.',
    },
    verdadeiro: {
      special: 'Revive memórias de qualquer época.',
    },
  },

  // Vidência
  'videncia': {
    base: {
      special: 'Cria sensor invisível em local conhecido. Vê e ouve.',
    },
    discente: {
      special: 'Sensor pode se mover 9m/turno.',
    },
    verdadeiro: {
      special: 'Sensor em qualquer lugar do mesmo plano. Conjura rituais através dele.',
    },
  },

  // === ENERGIA ===

  // Convocação Instantânea
  'convocacao-instantanea': {
    base: {
      special: 'Marca objeto Médio ou menor. Pode convocá-lo de qualquer distância.',
    },
    discente: {
      special: 'Marca objeto Grande.',
    },
    verdadeiro: {
      special: 'Marca até 5 objetos.',
    },
  },

  // Milagre Ionizante
  'milagre-ionizante': {
    base: {
      damage: { diceCount: 10, diceType: 6, damageType: 'energia' },
      areaEffect: { shape: 'esfera', radius: 6 },
      resistance: { type: 'reflexos', effect: 'reduz_metade' },
      special: 'Esfera de plasma causa 10d6 Energia.',
    },
    discente: {
      damage: { diceCount: 15, diceType: 6, damageType: 'energia' },
      special: 'Muda para 15d6.',
    },
    verdadeiro: {
      damage: { diceCount: 20, diceType: 6, damageType: 'energia' },
      special: 'Muda para 20d6. Ignora RD.',
    },
  },

  // Mutar
  'mutar': {
    base: {
      special: 'Concede 1 mutação de criatura a você mesmo.',
    },
    discente: {
      special: 'Concede 2 mutações.',
    },
    verdadeiro: {
      special: 'Concede 3 mutações.',
    },
  },

  // Salto Fantasma
  'salto-fantasma': {
    base: {
      special: 'Teletransporta até 30m para local que possa ver.',
    },
    discente: {
      special: 'Teletransporta até 90m.',
    },
    verdadeiro: {
      special: 'Teletransporta até 90m levando até 5 aliados.',
    },
  },

  // Transfigurar Água
  'transfigurar-agua': {
    base: {
      special: 'Controla 4 espaços de água. Move, molda ou congela.',
    },
    discente: {
      damage: { diceCount: 6, diceType: 8, damageType: 'impacto' },
      special: 'Projétil de gelo causa 6d8 impacto.',
    },
    verdadeiro: {
      special: 'Controla 10 espaços. Pode criar Elemental de Água.',
    },
  },

  // Transfigurar Terra
  'transfigurar-terra': {
    base: {
      special: 'Controla 4 espaços de terra/pedra. Move ou molda.',
    },
    discente: {
      damage: { diceCount: 6, diceType: 8, damageType: 'impacto' },
      special: 'Projétil de pedra causa 6d8 impacto.',
    },
    verdadeiro: {
      special: 'Controla 10 espaços. Pode criar Elemental de Terra.',
    },
  },

  // === MEDO ===

  // Dissipar Ritual
  'dissipar-ritual': {
    base: {
      special: 'Dissipa ritual de círculo igual ou menor ao seu limite.',
    },
    discente: {
      special: 'Dissipa rituais de qualquer círculo.',
    },
    verdadeiro: {
      special: 'Dissipa rituais em área de 6m.',
    },
  },
};

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Retorna os efeitos de um ritual pelo ID
 */
export function getRitualEffects(ritualId: string): RitualEffectsByLevel | undefined {
  return RITUAL_EFFECTS[ritualId];
}

/**
 * Retorna o efeito específico de um ritual baseado nos aprimoramentos selecionados
 */
export function getActiveRitualEffect(
  ritualId: string,
  selectedEnhancements: string[]
): RitualEffect | undefined {
  const effects = RITUAL_EFFECTS[ritualId];
  if (!effects) return undefined;

  // Começar com o efeito base
  let activeEffect = { ...effects.base };

  // Aplicar aprimoramentos selecionados (Verdadeiro tem prioridade sobre Discente)
  if (selectedEnhancements.includes('Verdadeiro') && effects.verdadeiro) {
    activeEffect = mergeEffects(activeEffect, effects.verdadeiro);
  } else if (selectedEnhancements.includes('Discente') && effects.discente) {
    activeEffect = mergeEffects(activeEffect, effects.discente);
  }

  return activeEffect;
}

/**
 * Mescla dois efeitos de ritual (aprimoramento sobrescreve base)
 */
function mergeEffects(base: RitualEffect, enhancement: RitualEffect): RitualEffect {
  return {
    ...base,
    ...enhancement,
    // Arrays devem ser mesclados ou substituídos
    appliesConditions: enhancement.appliesConditions || base.appliesConditions,
    // Efeitos de arma devem ser mesclados
    weaponEffect: enhancement.weaponEffect 
      ? { ...base.weaponEffect, ...enhancement.weaponEffect }
      : base.weaponEffect,
  };
}

/**
 * Calcula a fórmula de dano como string legível
 */
export function formatDamageFormula(formula: DamageFormula): string {
  const bonusStr = formula.bonus 
    ? (formula.bonus > 0 ? `+${formula.bonus}` : formula.bonus.toString())
    : '';
  return `${formula.diceCount}d${formula.diceType}${bonusStr}`;
}

/**
 * Verifica se um ritual causa dano direto
 */
export function ritualDealsDamage(ritualId: string): boolean {
  const effects = RITUAL_EFFECTS[ritualId];
  if (!effects) return false;
  
  return !!(
    effects.base.damage ||
    effects.discente?.damage ||
    effects.verdadeiro?.damage
  );
}

/**
 * Verifica se um ritual aplica condições
 */
export function ritualAppliesConditions(ritualId: string): boolean {
  const effects = RITUAL_EFFECTS[ritualId];
  if (!effects) return false;
  
  return !!(
    effects.base.appliesConditions?.length ||
    effects.discente?.appliesConditions?.length ||
    effects.verdadeiro?.appliesConditions?.length
  );
}
