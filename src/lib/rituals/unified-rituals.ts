/**
 * Ordem Paranormal RPG - Rituais Unificados
 * FONTE ÚNICA DE VERDADE para todos os rituais do sistema
 * 
 * Este arquivo consolida todos os rituais oficiais importados dos módulos por círculo.
 */

import type {
  UnifiedRitual,
  RitualElement,
  RitualCircle,
} from './types';

// Importa rituais de 2º, 3º e 4º círculo dos módulos separados
import {
  BLOOD_SECOND_CIRCLE,
  KNOWLEDGE_SECOND_CIRCLE,
  ENERGY_SECOND_CIRCLE,
  FEAR_SECOND_CIRCLE,
  DEATH_SECOND_CIRCLE,
} from './second-circle';

import {
  BLOOD_THIRD_CIRCLE,
  DEATH_THIRD_CIRCLE,
  KNOWLEDGE_THIRD_CIRCLE,
  ENERGY_THIRD_CIRCLE,
  FEAR_THIRD_CIRCLE,
} from './third-circle';

import {
  BLOOD_FOURTH_CIRCLE,
  DEATH_FOURTH_CIRCLE,
  KNOWLEDGE_FOURTH_CIRCLE,
  ENERGY_FOURTH_CIRCLE,
  FEAR_FOURTH_CIRCLE,
} from './fourth-circle';

// ========================================
// RITUAIS DE 1º CÍRCULO - SANGUE
// ========================================

const BLOOD_FIRST_CIRCLE: UnifiedRitual[] = [
  {
    id: 'amaldicoar-arma-sangue',
    name: 'Amaldiçoar Arma (Sangue)',
    circle: 1,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 arma corpo a corpo ou pacote de munição',
    duration: 'Cena',
    description: 'Você imbui a arma ou munições com o elemento Sangue, fazendo com que causem +1d6 de dano do tipo do elemento.',
    cost: 1,
    isWeaponBuff: true,
    effects: {
      base: {
        kind: 'buff',
        weaponEffect: {
          damageBonus: '1d6',
          damageType: 'sangue',
        },
        summary: 'Arma causa +1d6 de dano de Sangue.',
      },
      discente: {
        kind: 'buff',
        weaponEffect: {
          damageBonus: '2d6',
          damageType: 'sangue',
        },
        summary: 'Arma causa +2d6 de dano de Sangue.',
      },
      verdadeiro: {
        kind: 'buff',
        weaponEffect: {
          damageBonus: '4d6',
          damageType: 'sangue',
        },
        summary: 'Arma causa +4d6 de dano de Sangue.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o bônus de dano para +2d6.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o bônus de dano para +4d6.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'arma-atroz',
    name: 'Arma Atroz',
    circle: 1,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 arma corpo a corpo',
    duration: 'Sustentada',
    description: 'A arma é recoberta por veias carmesim e passa a exalar uma aura de violência. Ela fornece +2 em testes de ataque e +1 na margem de ameaça.',
    cost: 1,
    isWeaponBuff: true,
    isSustainable: true,
    effects: {
      base: {
        kind: 'buff',
        weaponEffect: {
          attackBonus: 2,
          criticalBonus: 1,
        },
        sustain: { action: 'free' },
        summary: '+2 em ataques e +1 na margem de ameaça.',
      },
      discente: {
        kind: 'buff',
        weaponEffect: {
          attackBonus: 5,
          criticalBonus: 1,
        },
        sustain: { action: 'free' },
        summary: '+5 em ataques e +1 na margem de ameaça.',
      },
      verdadeiro: {
        kind: 'buff',
        weaponEffect: {
          attackBonus: 5,
          criticalBonus: 2,
          criticalMultiplierBonus: 1,
        },
        sustain: { action: 'free' },
        summary: '+5 em ataques, +2 na margem de ameaça e +1 no multiplicador de crítico.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o bônus para +5 em testes de ataque.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o bônus para +5 em testes de ataque, +2 na margem de ameaça e no multiplicador de crítico.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'armadura-de-sangue',
    name: 'Armadura de Sangue',
    circle: 1,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Seu sangue escorre para fora do corpo, cobrindo-o sob a forma de uma carapaça que fornece +5 em Defesa. Esse bônus é cumulativo com outros rituais, mas não com bônus fornecido por equipamento.',
    cost: 1,
    effects: {
      base: {
        kind: 'buff',
        defenseBonus: 5,
        summary: '+5 em Defesa (cumulativo com rituais, não com equipamento).',
      },
      discente: {
        kind: 'buff',
        defenseBonus: 10,
        damageReduction: { types: ['balístico', 'corte', 'impacto', 'perfuração'], amount: 5 },
        summary: '+10 em Defesa e RD 5 contra dano físico.',
      },
      verdadeiro: {
        kind: 'buff',
        defenseBonus: 15,
        damageReduction: { types: ['balístico', 'corte', 'impacto', 'perfuração'], amount: 10 },
        summary: '+15 em Defesa e RD 10 contra dano físico.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 5, description: 'Muda o efeito para "fornece +10 na Defesa e resistência a balístico, corte, impacto e perfuração 5".', circleReq: 3 },
      { name: 'Verdadeiro', cost: 9, description: 'Muda o efeito para "fornece +15 na Defesa e resistência a balístico, corte, impacto e perfuração 10".', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'corpo-adaptado',
    name: 'Corpo Adaptado',
    circle: 1,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 pessoa ou animal',
    duration: 'Cena',
    description: 'O alvo fica imune a calor e frio extremos, pode respirar na água se respirar ar (ou vice-versa) e não sufoca em fumaça densa.',
    cost: 1,
    effects: {
      base: {
        kind: 'buff',
        summary: 'Imune a calor/frio extremos, respira água/ar, não sufoca em fumaça.',
      },
      discente: {
        kind: 'buff',
        summary: 'Como base, mas duração de 1 dia.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: 'Afeta pessoas ou animais escolhidos em alcance curto.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda a duração para 1 dia.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o alcance para "curto" e o alvo para "pessoas ou animais escolhidos".', circleReq: 3 },
    ],
  },
  {
    id: 'esfolar',
    name: 'Esfolar',
    circle: 1,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser',
    duration: 'Instantânea',
    description: 'O alvo sofre 3d4+3 pontos de dano de corte e fica sangrando. Se passar, metade do dano e evita condição.',
    cost: 1,
    resistance: { type: 'reflexos', effect: 'parcial' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 3, diceType: 4, bonus: 3, damageType: 'corte' },
        conditions: [{ id: 'sangrando', duration: 'sustentado' }],
        resistance: { type: 'reflexos', effect: 'parcial' },
        summary: '3d4+3 dano de corte + sangramento.',
      },
      discente: {
        kind: 'damage',
        damage: { diceCount: 5, diceType: 4, bonus: 5, damageType: 'corte' },
        conditions: [{ id: 'sangrando', duration: 'sustentado' }],
        areaEffect: { shape: 'esfera', radius: 6 },
        summary: '5d4+5 dano de corte em área de 6m + sangramento.',
      },
      verdadeiro: {
        kind: 'damage',
        damage: { diceCount: 10, diceType: 4, bonus: 10, damageType: 'corte' },
        conditions: [{ id: 'sangrando', duration: 'sustentado' }],
        areaEffect: { shape: 'esfera', radius: 6 },
        summary: '10d4+10 dano de corte em área de 6m. Resistência não evita sangramento.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda alcance para médio, dano para 5d4+5 e alvo para explosão com 6m de raio.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda alcance para longo, dano para 10d4+10. Passar na resistência não evita a condição.', circleReq: 3 },
    ],
  },
  {
    id: 'fortalecimento-sensorial',
    name: 'Fortalecimento Sensorial',
    circle: 1,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Recebe +1d6 em Investigação, Luta, Percepção e Pontaria.',
    cost: 1,
    effects: {
      base: {
        kind: 'buff',
        skillBonus: {
          skills: ['Investigação', 'Luta', 'Percepção', 'Pontaria'],
          bonus: '1d6',
        },
        summary: '+1d6 em Investigação, Luta, Percepção e Pontaria.',
      },
      discente: {
        kind: 'buff',
        skillBonus: {
          skills: ['Investigação', 'Luta', 'Percepção', 'Pontaria'],
          bonus: '1d6',
        },
        summary: '+1d6 nas perícias. Inimigos sofrem -1d6 em ataques contra você.',
      },
      verdadeiro: {
        kind: 'buff',
        defenseBonus: 10,
        resistanceBonus: 10,
        summary: 'Imune a surpreso e desprevenido. +10 em Defesa e Reflexos.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Inimigos sofrem -1d6 em testes de ataque contra você.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Fica imune a surpreendido e desprevenido e recebe +10 em Defesa e Reflexos.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'odio-incontrolavel',
    name: 'Ódio Incontrolável',
    circle: 1,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 pessoa',
    duration: 'Cena',
    description: 'O alvo entra em um frenesi, aumentando sua agressividade e capacidade de luta. Ele recebe +2 em testes de ataque e rolagens de dano corpo a corpo e resistência a balístico, corte, impacto e perfuração 5. Enquanto o efeito durar, o alvo não pode fazer nenhuma ação que exige calma e concentração (como usar a perícia Furtividade ou conjurar rituais), e deve sempre atacar um alvo em sua rodada, mesmo que seja um aliado se ele for o único a seu alcance.',
    cost: 1,
    effects: {
      base: {
        kind: 'buff',
        attackBonus: 2,
        damageBonus: 2,
        damageReduction: { types: ['balístico', 'corte', 'impacto', 'perfuração'], amount: 5 },
        actionRestrictions: ['mustAttack', 'cannotConcentrate', 'cannotStealth', 'cannotCast'],
        summary: '+2 ataque/dano corpo a corpo, RD 5. Deve atacar todo turno, não pode usar furtividade ou rituais.',
      },
      discente: {
        kind: 'buff',
        attackBonus: 2,
        damageBonus: 2,
        damageReduction: { types: ['balístico', 'corte', 'impacto', 'perfuração'], amount: 5 },
        actionRestrictions: ['mustAttack', 'cannotConcentrate', 'cannotStealth', 'cannotCast'],
        summary: 'Como base + ataque adicional ao usar ação agredir.',
      },
      verdadeiro: {
        kind: 'buff',
        attackBonus: 5,
        damageBonus: 5,
        damageReduction: { types: ['balístico', 'corte', 'impacto', 'perfuração'], amount: 10 }, // Representa "metade do dano" como RD maior
        actionRestrictions: ['mustAttack', 'cannotConcentrate', 'cannotStealth', 'cannotCast'],
        summary: '+5 ataque/dano, metade do dano físico. Deve atacar todo turno.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Ao usar ação agredir, pode fazer um ataque corpo a corpo adicional contra o mesmo alvo.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o bônus de ataque e dano para +5 e o alvo passa a sofrer apenas metade do dano dos tipos balístico, corte, impacto e perfuração.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'distorcer-aparencia',
    name: 'Distorcer Aparência',
    circle: 1,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Você modifica sua aparência de modo a parecer outra pessoa. Isso inclui altura, peso, tom de pele, cor de cabelo, timbre de voz, impressão digital, córnea etc. Você recebe +10 em testes de Enganação para disfarce, mas não recebe habilidades da nova forma nem modifica suas demais estatísticas.',
    cost: 1,
    resistance: { type: 'vontade', effect: 'anula' },
    effects: {
      base: {
        kind: 'buff',
        skillBonus: { skills: ['Enganação'], bonus: 10, context: 'para disfarce' },
        summary: '+10 em Enganação para disfarce.',
      },
      discente: {
        kind: 'buff',
        skillBonus: { skills: ['Enganação'], bonus: 10, context: 'para disfarce' },
        resistance: { type: 'vontade', effect: 'anula' },
        summary: 'Pode disfarçar 1 ser em alcance curto. Alvo involuntário faz Vontade.',
      },
      verdadeiro: {
        kind: 'buff',
        skillBonus: { skills: ['Enganação'], bonus: 10, context: 'para disfarce' },
        summary: 'Disfarça seres escolhidos em alcance curto.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o alcance para "curto" e o alvo para "1 ser". Um alvo involuntário pode anular o efeito com um teste de Vontade.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Como em Discente, mas muda o alvo para "seres escolhidos".', circleReq: 3 },
    ],
  },
];

// ========================================
// RITUAIS DE 1º CÍRCULO - MORTE
// ========================================

const DEATH_FIRST_CIRCLE: UnifiedRitual[] = [
  {
    id: 'amaldicoar-arma-morte',
    name: 'Amaldiçoar Arma (Morte)',
    circle: 1,
    element: 'morte',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 arma corpo a corpo ou pacote de munição',
    duration: 'Cena',
    description: 'Você imbui a arma ou munições com o elemento Morte, fazendo com que causem +1d6 de dano do tipo do elemento.',
    cost: 1,
    isWeaponBuff: true,
    effects: {
      base: {
        kind: 'buff',
        weaponEffect: { damageBonus: '1d6', damageType: 'morte' },
        summary: 'Arma causa +1d6 de dano de Morte.',
      },
      discente: {
        kind: 'buff',
        weaponEffect: { damageBonus: '2d6', damageType: 'morte' },
        summary: 'Arma causa +2d6 de dano de Morte.',
      },
      verdadeiro: {
        kind: 'buff',
        weaponEffect: { damageBonus: '4d6', damageType: 'morte' },
        summary: 'Arma causa +4d6 de dano de Morte.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o bônus de dano para +2d6.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o bônus de dano para +4d6.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'apagar-as-luzes',
    name: 'Apagar as Luzes',
    circle: 1,
    element: 'morte',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Instantânea',
    description: 'Ao conjurar esse ritual, qualquer fonte de luz em alcance curto de você, natural ou artificial, é apagada.',
    cost: 1,
    effects: {
      base: {
        kind: 'utility',
        summary: 'Apaga fontes de luz em alcance curto.',
      },
      discente: {
        kind: 'utility',
        summary: 'Apaga fontes de luz em alcance médio.',
      },
      verdadeiro: {
        kind: 'utility',
        summary: 'Apaga fontes de luz em alcance longo e cria escuridão mágica.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o alcance para médio.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o alcance para longo e cria escuridão mágica.', circleReq: 3 },
    ],
  },
  {
    id: 'cicatrizacao',
    name: 'Cicatrização',
    circle: 1,
    element: 'morte',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Instantânea',
    description: 'Você acelera o tempo ao redor das feridas do alvo, que cicatrizam instantaneamente. O alvo recupera 3d8+3 PV, mas envelhece 1 ano automaticamente.',
    cost: 1,
    effects: {
      base: {
        kind: 'healing',
        healing: { diceCount: 3, diceType: 8, bonus: 3 },
        summary: 'Cura 3d8+3 PV. Alvo envelhece 1 ano.',
      },
      discente: {
        kind: 'healing',
        healing: { diceCount: 5, diceType: 8, bonus: 5 },
        summary: 'Cura 5d8+5 PV. Alvo envelhece 1 ano.',
      },
      verdadeiro: {
        kind: 'healing',
        healing: { diceCount: 7, diceType: 8, bonus: 7 },
        summary: 'Cura 7d8+7 PV em seres escolhidos em alcance curto.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Aumenta a cura para 5d8+5 PV.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 9, description: 'Muda o alcance para "curto", o alvo para "seres escolhidos" e aumenta a cura para 7d8+7 PV.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'consumir-manancial',
    name: 'Consumir Manancial',
    circle: 1,
    element: 'morte',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Instantânea',
    description: 'Você suga uma pequena porção do tempo de vida ao redor, gerando Lodo e recebendo 3d6 pontos de vida temporários. Os PV temporários desaparecem ao final da cena.',
    cost: 1,
    effects: {
      base: {
        kind: 'buff',
        tempHP: { diceCount: 3, diceType: 6, duration: 'cena' },
        summary: 'Recebe 3d6 PV temporários. Gera Lodo.',
      },
      discente: {
        kind: 'buff',
        tempHP: { diceCount: 6, diceType: 6, duration: 'cena' },
        summary: 'Recebe 6d6 PV temporários.',
      },
      verdadeiro: {
        kind: 'damage',
        damage: { diceCount: 3, diceType: 6, damageType: 'morte' },
        areaEffect: { shape: 'esfera', radius: 6 },
        resistance: { type: 'fortitude', effect: 'reduz_metade' },
        summary: 'Causa 3d6 de dano em área de 6m e recebe PV temporários iguais ao dano total.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda os PV temporários recebidos para 6d6.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o alvo para área de 6m. Causa 3d6 de dano de Morte e recebe PV temporários iguais ao dano total.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'decadencia',
    name: 'Decadência',
    circle: 1,
    element: 'morte',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Instantânea',
    description: 'O alvo sofre 2d8+2 pontos de dano de Morte.',
    cost: 1,
    resistance: { type: 'fortitude', effect: 'reduz_metade' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 2, diceType: 8, bonus: 2, damageType: 'morte' },
        resistance: { type: 'fortitude', effect: 'reduz_metade' },
        summary: '2d8+2 dano de Morte.',
      },
      discente: {
        kind: 'damage',
        damage: { diceCount: 3, diceType: 8, bonus: 3, damageType: 'morte' },
        summary: '3d8+3 dano. Pode ser combinado com ataque corpo a corpo.',
      },
      verdadeiro: {
        kind: 'damage',
        damage: { diceCount: 8, diceType: 8, bonus: 8, damageType: 'morte' },
        areaEffect: { shape: 'esfera', radius: 6 },
        summary: '8d8+8 dano de Morte em área de 6m.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda a resistência para "nenhuma" e o dano para 3d8+3. Como parte da execução, faz um ataque corpo a corpo.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o alcance para "pessoal", alvo para área de 6m de raio e dano para 8d8+8.', circleReq: 3 },
    ],
  },
  {
    id: 'definhar',
    name: 'Definhar',
    circle: 1,
    element: 'morte',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser',
    duration: 'Cena',
    description: 'O alvo fica fatigado. Se passar na resistência, fica vulnerável.',
    cost: 1,
    resistance: { type: 'fortitude', effect: 'parcial' },
    effects: {
      base: {
        kind: 'debuff',
        conditions: [{ id: 'fatigado', duration: 'cena' }],
        resistance: { type: 'fortitude', effect: 'parcial' },
        summary: 'Alvo fica fatigado. Se passar, fica vulnerável.',
      },
      discente: {
        kind: 'debuff',
        conditions: [{ id: 'exausto', duration: 'cena' }],
        resistance: { type: 'fortitude', effect: 'parcial' },
        summary: 'Alvo fica exausto. Se passar, fica fatigado.',
      },
      verdadeiro: {
        kind: 'debuff',
        conditions: [{ id: 'exausto', duration: 'cena' }],
        resistance: { type: 'fortitude', effect: 'parcial' },
        summary: 'Até 5 seres ficam exaustos (fatigados se passarem).',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'O alvo fica exausto. Se passar na resistência, fica fatigado.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Como discente, mas muda o alvo para "até 5 seres".', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'espirais-da-perdicao',
    name: 'Espirais da Perdição',
    circle: 1,
    element: 'morte',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser',
    duration: 'Cena',
    description: 'O alvo sofre -1d4 em testes de ataque.',
    cost: 1,
    effects: {
      base: {
        kind: 'debuff',
        attackBonus: -4, // Representação de -1d4 média
        summary: 'Alvo sofre -1d4 em testes de ataque.',
      },
      discente: {
        kind: 'debuff',
        attackBonus: -6, // Representação de -1d6 média
        summary: 'Alvo sofre -1d6 em testes de ataque.',
      },
      verdadeiro: {
        kind: 'debuff',
        attackBonus: -12, // Representação de -2d6 média
        summary: 'Seres escolhidos sofrem -2d6 em testes de ataque.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda a penalidade para -1d6.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 8, description: 'Muda a penalidade para -2d6 e o alvo para "seres escolhidos".', circleReq: 3 },
    ],
  },
  {
    id: 'nuvem-de-cinzas',
    name: 'Nuvem de Cinzas',
    circle: 1,
    element: 'morte',
    execution: 'Padrão',
    range: 'Curto',
    area: 'Nuvem com 6m de raio e 6m de altura',
    duration: 'Cena',
    description: 'Obscurece visão (camuflagem leve a 1,5m, total a partir de 3m). Vento dispersa.',
    cost: 1,
    effects: {
      base: {
        kind: 'utility',
        areaEffect: { shape: 'cilindro', radius: 6 },
        summary: 'Cria nuvem que obscurece visão.',
      },
      discente: {
        kind: 'utility',
        areaEffect: { shape: 'cilindro', radius: 6 },
        summary: 'Pode escolher seres que enxergam através da nuvem.',
      },
      verdadeiro: {
        kind: 'utility',
        areaEffect: { shape: 'cilindro', radius: 6 },
        summary: 'Nuvem quase sólida. Deslocamento 3m máximo e -2 em ataques dentro dela.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Pode escolher seres no alcance para enxergar através da nuvem.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Nuvem quase sólida. Deslocamento dentro dela reduz para 3m e sofrem -2 em ataque.', circleReq: 3 },
    ],
  },
];

// DEATH_SECOND_CIRCLE é importado de ./second-circle.ts

// ========================================
// RITUAIS DE 1º CÍRCULO - ENERGIA
// ========================================

const ENERGY_FIRST_CIRCLE: UnifiedRitual[] = [
  {
    id: 'amaldicoar-arma-energia',
    name: 'Amaldiçoar Arma (Energia)',
    circle: 1,
    element: 'energia',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 arma corpo a corpo ou pacote de munição',
    duration: 'Cena',
    description: 'Você imbui a arma ou munições com o elemento Energia, fazendo com que causem +1d6 de dano do tipo do elemento.',
    cost: 1,
    isWeaponBuff: true,
    effects: {
      base: {
        kind: 'buff',
        weaponEffect: { damageBonus: '1d6', damageType: 'energia' },
        summary: 'Arma causa +1d6 de dano de Energia.',
      },
      discente: {
        kind: 'buff',
        weaponEffect: { damageBonus: '2d6', damageType: 'energia' },
        summary: 'Arma causa +2d6 de dano de Energia.',
      },
      verdadeiro: {
        kind: 'buff',
        weaponEffect: { damageBonus: '4d6', damageType: 'energia' },
        summary: 'Arma causa +4d6 de dano de Energia.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o bônus de dano para +2d6.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o bônus de dano para +4d6.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'amaldicoar-tecnologia',
    name: 'Amaldiçoar Tecnologia',
    circle: 1,
    element: 'energia',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 acessório ou arma de fogo',
    duration: 'Cena',
    description: 'Você imbui o alvo com Energia, fazendo-o funcionar acima de sua capacidade. O item recebe uma modificação a sua escolha.',
    cost: 1,
    effects: {
      base: {
        kind: 'buff',
        summary: 'Item recebe 1 modificação à escolha.',
      },
      discente: {
        kind: 'buff',
        summary: 'Item recebe 2 modificações à escolha.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: 'Item recebe 3 modificações à escolha.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda para duas modificações.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda para três modificações.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'eletrocussao',
    name: 'Eletrocussão',
    circle: 1,
    element: 'energia',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser ou objeto',
    duration: 'Instantânea',
    description: 'O alvo sofre 3d6 pontos de dano de eletricidade e fica vulnerável por uma rodada. Se passar, metade do dano e evita a condição. Dobro de dano em eletrônicos.',
    cost: 1,
    resistance: { type: 'fortitude', effect: 'parcial' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 3, diceType: 6, damageType: 'eletricidade' },
        conditions: [{ id: 'vulneravel', duration: 1 }],
        resistance: { type: 'fortitude', effect: 'parcial' },
        summary: '3d6 dano de eletricidade + vulnerável por 1 rodada.',
      },
      discente: {
        kind: 'damage',
        damage: { diceCount: 6, diceType: 6, damageType: 'eletricidade' },
        areaEffect: { shape: 'linha', length: 30 },
        summary: '6d6 de dano em linha de 30m.',
      },
      verdadeiro: {
        kind: 'damage',
        damage: { diceCount: 8, diceType: 6, damageType: 'eletricidade' },
        summary: '8d6 de dano em alvos escolhidos.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o alvo para "área: linha de 30m". Causa 6d6 de dano em todos na área.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o alvo para "alvos escolhidos". Dispara relâmpagos causando 8d6 em cada alvo.', circleReq: 3 },
    ],
  },
  {
    id: 'embaralhar',
    name: 'Embaralhar',
    circle: 1,
    element: 'energia',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Cria 3 cópias ilusórias. Recebe +6 na Defesa. Se um ataque errar, uma cópia some e o bônus diminui em 2.',
    cost: 1,
    effects: {
      base: {
        kind: 'buff',
        defenseBonus: 6,
        summary: '+6 na Defesa (3 cópias). Cada ataque errado remove +2.',
      },
      discente: {
        kind: 'buff',
        defenseBonus: 10,
        summary: '+10 na Defesa (5 cópias).',
      },
      verdadeiro: {
        kind: 'buff',
        defenseBonus: 16,
        summary: '+16 na Defesa (8 cópias). Atacante fica ofuscado ao destruir cópia.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda para 5 cópias (+10 na Defesa).', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda para 8 cópias (+16 na Defesa). Quando uma cópia é destruída, o atacante fica ofuscado por uma rodada.', circleReq: 3 },
    ],
  },
  {
    id: 'luz',
    name: 'Luz',
    circle: 1,
    element: 'energia',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 objeto',
    duration: 'Cena',
    description: 'Objeto emite luz em área de 9m de raio.',
    cost: 1,
    resistance: { type: 'vontade', effect: 'anula' },
    effects: {
      base: {
        kind: 'utility',
        areaEffect: { shape: 'esfera', radius: 9 },
        summary: 'Objeto emite luz em 9m de raio.',
      },
      discente: {
        kind: 'utility',
        summary: 'Cria 4 esferas brilhantes móveis que ofuscam e removem camuflagem.',
      },
      verdadeiro: {
        kind: 'utility',
        summary: 'Luz solar. Aliados recebem +20 em Vontade, inimigos ficam ofuscados.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda alcance para longo e cria 4 esferas brilhantes móveis de 10cm.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Luz cálida como o sol. Aliados recebem +20 em Vontade, inimigos ficam ofuscados.', circleReq: 3 },
    ],
  },
  {
    id: 'coincidencia-forcada',
    name: 'Coincidência Forçada',
    circle: 1,
    element: 'energia',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser',
    duration: 'Cena',
    description: 'Você manipula os caminhos do caos para que o alvo tenha mais sorte. O alvo recebe +2 em testes de perícias.',
    cost: 1,
    effects: {
      base: {
        kind: 'buff',
        skillBonus: { skills: ['*'], bonus: 2 }, // Todas as perícias
        summary: '+2 em todos os testes de perícias.',
      },
      discente: {
        kind: 'buff',
        skillBonus: { skills: ['*'], bonus: 2 },
        summary: '+2 em perícias para aliados escolhidos.',
      },
      verdadeiro: {
        kind: 'buff',
        skillBonus: { skills: ['*'], bonus: 5 },
        summary: '+5 em perícias para aliados escolhidos.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o alvo para aliados à sua escolha.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o alvo para aliados à sua escolha e o bônus para +5.', circleReq: 3, affinityReq: true },
    ],
  },
];

// ========================================
// RITUAIS DE 1º CÍRCULO - CONHECIMENTO
// ========================================

const KNOWLEDGE_FIRST_CIRCLE: UnifiedRitual[] = [
  {
    id: 'amaldicoar-arma-conhecimento',
    name: 'Amaldiçoar Arma (Conhecimento)',
    circle: 1,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 arma corpo a corpo ou pacote de munição',
    duration: 'Cena',
    description: 'Você imbui a arma ou munições com o elemento Conhecimento, fazendo com que causem +1d6 de dano do tipo do elemento.',
    cost: 1,
    isWeaponBuff: true,
    effects: {
      base: {
        kind: 'buff',
        weaponEffect: { damageBonus: '1d6', damageType: 'conhecimento' },
        summary: 'Arma causa +1d6 de dano de Conhecimento.',
      },
      discente: {
        kind: 'buff',
        weaponEffect: { damageBonus: '2d6', damageType: 'conhecimento' },
        summary: 'Arma causa +2d6 de dano de Conhecimento.',
      },
      verdadeiro: {
        kind: 'buff',
        weaponEffect: { damageBonus: '4d6', damageType: 'conhecimento' },
        summary: 'Arma causa +4d6 de dano de Conhecimento.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o bônus de dano para +2d6.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o bônus de dano para +4d6.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'compreensao-paranormal',
    name: 'Compreensão Paranormal',
    circle: 1,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser ou objeto',
    duration: 'Cena',
    description: 'Se tocar um objeto com informação, você entende as palavras (idioma humano). Se tocar uma pessoa, pode se comunicar (idioma comum). Se tocar um ser não inteligente, percebe sentimentos básicos.',
    cost: 1,
    resistance: { type: 'vontade', effect: 'anula' },
    effects: {
      base: {
        kind: 'sense',
        senseEffect: { type: 'commune', information: 'compreensão básica' },
        summary: 'Entende idiomas escritos, comunica-se com pessoas, percebe sentimentos.',
      },
      discente: {
        kind: 'sense',
        senseEffect: { type: 'commune', information: 'compreensão de alvos múltiplos' },
        summary: 'Afeta alvos escolhidos em alcance curto.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: 'Você pode falar, entender e escrever qualquer idioma humano.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o alcance para "curto" e o alvo para "alvos escolhidos".', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Você pode falar, entender e escrever qualquer idioma humano.', circleReq: 3 },
    ],
  },
  {
    id: 'desfazer-sinapses',
    name: 'Desfazer Sinapses',
    circle: 1,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser',
    duration: 'Instantânea',
    description: 'O alvo sofre 2d6+2 pontos de dano de Conhecimento e fica frustrado por uma rodada. Se passar no teste, sofre metade do dano e evita a condição.',
    cost: 1,
    resistance: { type: 'vontade', effect: 'parcial' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 2, diceType: 6, bonus: 2, damageType: 'conhecimento' },
        conditions: [{ id: 'frustrado', duration: 1 }],
        resistance: { type: 'vontade', effect: 'parcial' },
        summary: '2d6+2 dano de Conhecimento + frustrado por 1 rodada.',
      },
      discente: {
        kind: 'damage',
        damage: { diceCount: 3, diceType: 6, bonus: 3, damageType: 'conhecimento' },
        summary: '3d6+3 de dano em até 5 seres em alcance longo.',
      },
      verdadeiro: {
        kind: 'damage',
        damage: { diceCount: 8, diceType: 6, bonus: 8, damageType: 'conhecimento' },
        conditions: [{ id: 'esmorecido', duration: 1 }],
        summary: '8d6+8 de dano. Alvo fica esmorecido (se passar, frustrado).',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o alcance para longo, o dano para 3d6+3 e o alvo para até 5 seres.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o dano para 8d6+8 e a condição para esmorecido.', circleReq: 3 },
    ],
  },
  {
    id: 'enfeiticar',
    name: 'Enfeitiçar',
    circle: 1,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 pessoa',
    duration: 'Cena',
    description: 'Torna o alvo prestativo (+10 em Diplomacia). Hostis recebem +5 na resistência. Ações hostis dissipam o efeito.',
    cost: 1,
    resistance: { type: 'vontade', effect: 'anula' },
    effects: {
      base: {
        kind: 'control',
        mentalControl: { type: 'charm', canForceHarm: false, canForceSuicide: false },
        resistance: { type: 'vontade', effect: 'anula' },
        summary: 'Alvo fica prestativo (+10 em Diplomacia).',
      },
      discente: {
        kind: 'control',
        mentalControl: { type: 'suggestion', canForceHarm: false, canForceSuicide: false },
        summary: 'Pode sugerir uma ação para o alvo obedecer.',
      },
      verdadeiro: {
        kind: 'control',
        mentalControl: { type: 'charm', canForceHarm: false, canForceSuicide: false },
        summary: 'Afeta todos os alvos dentro do alcance.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Sugere uma ação para o alvo e ele obedece.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Afeta todos os alvos dentro do alcance.', circleReq: 3 },
    ],
  },
  {
    id: 'terceiro-olho',
    name: 'Terceiro Olho',
    circle: 1,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Enxerga auras paranormais em alcance longo. Sabe elemento e poder aproximado. Pode gastar ação de movimento para analisar ser em alcance médio.',
    cost: 1,
    effects: {
      base: {
        kind: 'sense',
        senseEffect: { type: 'detect', range: 30, targets: ['auras paranormais'], information: 'elemento e poder' },
        summary: 'Enxerga auras paranormais em alcance longo.',
      },
      discente: {
        kind: 'sense',
        senseEffect: { type: 'detect', range: 30, targets: ['auras paranormais'], information: 'elemento e poder' },
        summary: 'Duração de 1 dia.',
      },
      verdadeiro: {
        kind: 'sense',
        senseEffect: { type: 'detect', range: 30, targets: ['auras paranormais', 'invisíveis'], information: 'elemento e poder' },
        summary: 'Enxerga invisíveis.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda duração para 1 dia.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Enxerga invisíveis.', circleReq: 3 },
    ],
  },
  {
    id: 'tecer-ilusao',
    name: 'Tecer Ilusão',
    circle: 1,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Médio',
    area: 'Ilusão até 4 cubos de 1,5m',
    duration: 'Cena',
    description: 'Cria ilusão visual ou sonora simples.',
    cost: 1,
    resistance: { type: 'vontade', effect: 'anula' },
    effects: {
      base: {
        kind: 'utility',
        resistance: { type: 'vontade', effect: 'anula' },
        summary: 'Cria ilusão visual ou sonora (até 4 cubos de 1,5m).',
      },
      discente: {
        kind: 'utility',
        summary: 'Até 8 cubos, ilusão completa (som, cheiro, temperatura). Sustentada.',
      },
      verdadeiro: {
        kind: 'damage',
        damage: { diceCount: 6, diceType: 6, damageType: 'conhecimento' },
        summary: 'Cria ilusão de perigo mortal que causa 6d6 de dano se alvo falhar em Vontade.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Até 8 cubos, duração sustentada. Ilusão completa (som, cheiro, temperatura).', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Cria ilusão de perigo mortal. Alvo que falhar na Vontade sofre 6d6 de dano de Conhecimento.', circleReq: 3 },
    ],
  },
];

// ========================================
// RITUAIS DE 1º CÍRCULO - MEDO
// ========================================

const FEAR_FIRST_CIRCLE: UnifiedRitual[] = [
  {
    id: 'amaldicoar-arma-medo',
    name: 'Amaldiçoar Arma (Medo)',
    circle: 1,
    element: 'medo',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 arma corpo a corpo ou pacote de munição',
    duration: 'Cena',
    description: 'Você imbui a arma ou munições com o elemento Medo, fazendo com que causem +1d6 de dano do tipo do elemento.',
    cost: 1,
    isWeaponBuff: true,
    effects: {
      base: {
        kind: 'buff',
        weaponEffect: { damageBonus: '1d6', damageType: 'medo' },
        summary: 'Arma causa +1d6 de dano de Medo.',
      },
      discente: {
        kind: 'buff',
        weaponEffect: { damageBonus: '2d6', damageType: 'medo' },
        summary: 'Arma causa +2d6 de dano de Medo.',
      },
      verdadeiro: {
        kind: 'buff',
        weaponEffect: { damageBonus: '4d6', damageType: 'medo' },
        summary: 'Arma causa +4d6 de dano de Medo.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Muda o bônus de dano para +2d6.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Muda o bônus de dano para +4d6.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'cineraria',
    name: 'Cinerária',
    circle: 1,
    element: 'medo',
    execution: 'Padrão',
    range: 'Curto',
    area: 'Nuvem de 6m de raio',
    duration: 'Cena',
    description: 'Você manifesta uma névoa carregada de essência paranormal. Rituais conjurados dentro da névoa têm sua DT aumentada em +5.',
    cost: 1,
    effects: {
      base: {
        kind: 'buff',
        areaEffect: { shape: 'esfera', radius: 6 },
        summary: 'Rituais conjurados na névoa têm DT +5.',
      },
      discente: {
        kind: 'buff',
        areaEffect: { shape: 'esfera', radius: 6 },
        summary: 'Rituais na névoa têm DT +5 e custam -2 PE.',
      },
      verdadeiro: {
        kind: 'buff',
        areaEffect: { shape: 'esfera', radius: 6 },
        summary: 'Rituais na névoa têm DT +5, -2 PE e dano maximizado.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Além do normal, rituais conjurados dentro da névoa custam -2 PE.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Além do normal, rituais conjurados dentro da névoa causam dano maximizado.', circleReq: 3 },
    ],
  },
  {
    id: 'aura-de-medo',
    name: 'Aura de Medo',
    circle: 1,
    element: 'medo',
    execution: 'Padrão',
    range: 'Pessoal',
    area: 'Emanação de 3m de raio',
    duration: 'Sustentada',
    description: 'Você exala uma aura de medo puro. Criaturas na área ficam amedrontadas se falharem na Vontade.',
    cost: 1,
    resistance: { type: 'vontade', effect: 'anula' },
    isSustainable: true,
    effects: {
      base: {
        kind: 'debuff',
        conditions: [{ id: 'amedrontado', duration: 'sustentado' }],
        areaEffect: { shape: 'emanação', radius: 3 },
        resistance: { type: 'vontade', effect: 'anula' },
        sustain: { action: 'free', concentration: true },
        summary: 'Aura 3m. Criaturas na área ficam amedrontadas (Vontade anula).',
      },
      discente: {
        kind: 'debuff',
        conditions: [{ id: 'apavorado', duration: 'sustentado' }],
        areaEffect: { shape: 'emanação', radius: 6 },
        summary: 'Aura 6m. Criaturas ficam apavoradas.',
      },
      verdadeiro: {
        kind: 'debuff',
        conditions: [{ id: 'apavorado', duration: 'sustentado' }],
        areaEffect: { shape: 'emanação', radius: 9 },
        summary: 'Aura 9m. Criaturas ficam apavoradas e sofrem -2 em testes.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Raio de 6m. Criaturas ficam apavoradas.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Raio de 9m. Apavoradas e -2 em testes.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'limiar-do-medo',
    name: 'Limiar do Medo',
    circle: 1,
    element: 'medo',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Você se conecta com o Medo. Recebe +2 em Intimidação e percebe o maior medo de criaturas em 9m.',
    cost: 1,
    effects: {
      base: {
        kind: 'buff',
        skillBonus: { skills: ['Intimidação'], bonus: 2 },
        senseEffect: { type: 'detect', range: 9, information: 'maior medo da criatura' },
        summary: '+2 em Intimidação. Percebe o maior medo de criaturas em 9m.',
      },
      discente: {
        kind: 'buff',
        skillBonus: { skills: ['Intimidação'], bonus: 5 },
        summary: '+5 em Intimidação. Percebe medos e fraquezas.',
      },
      verdadeiro: {
        kind: 'buff',
        skillBonus: { skills: ['Intimidação'], bonus: 10 },
        summary: '+10 em Intimidação. Vantagem contra criaturas amedrontadas.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: '+5 em Intimidação e percebe fraquezas.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: '+10 em Intimidação. Vantagem contra amedrontados.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'sussurros-do-medo',
    name: 'Sussurros do Medo',
    circle: 1,
    element: 'medo',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser',
    duration: 'Cena',
    description: 'Você implanta vozes de horror na mente do alvo. Ele fica abalado se falhar na Vontade.',
    cost: 1,
    resistance: { type: 'vontade', effect: 'parcial' },
    effects: {
      base: {
        kind: 'debuff',
        conditions: [{ id: 'abalado', duration: 'cena' }],
        resistance: { type: 'vontade', effect: 'parcial' },
        summary: 'Alvo fica abalado. Se passar, fica vulnerável.',
      },
      discente: {
        kind: 'debuff',
        conditions: [{ id: 'amedrontado', duration: 'cena' }],
        summary: 'Alvo fica amedrontado. Se passar, fica abalado.',
      },
      verdadeiro: {
        kind: 'debuff',
        conditions: [{ id: 'apavorado', duration: 'cena' }],
        summary: 'Alvo fica apavorado. Se passar, fica amedrontado.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Alvo fica amedrontado (abalado se passar).', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: 'Alvo fica apavorado (amedrontado se passar).', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'toque-do-medo',
    name: 'Toque do Medo',
    circle: 1,
    element: 'medo',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Instantânea',
    description: 'Seu toque transmite puro terror. Causa 2d8 de dano de Medo.',
    cost: 1,
    resistance: { type: 'vontade', effect: 'reduz_metade' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 2, diceType: 8, damageType: 'medo' },
        resistance: { type: 'vontade', effect: 'reduz_metade' },
        summary: '2d8 de dano de Medo.',
      },
      discente: {
        kind: 'damage',
        damage: { diceCount: 4, diceType: 8, damageType: 'medo' },
        conditions: [{ id: 'abalado', duration: 1 }],
        summary: '4d8 de dano de Medo + abalado por 1 rodada.',
      },
      verdadeiro: {
        kind: 'damage',
        damage: { diceCount: 6, diceType: 8, damageType: 'medo' },
        conditions: [{ id: 'amedrontado', duration: 1 }],
        summary: '6d8 de dano de Medo + amedrontado por 1 rodada.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: '4d8 dano + abalado 1 rodada.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 5, description: '6d8 dano + amedrontado 1 rodada.', circleReq: 3, affinityReq: true },
    ],
  },
];

// ========================================
// EXPORTAÇÃO CONSOLIDADA
// ========================================

/** Todos os rituais unificados do sistema */
export const UNIFIED_RITUALS: UnifiedRitual[] = [
  // 1º Círculo
  ...BLOOD_FIRST_CIRCLE,
  ...DEATH_FIRST_CIRCLE,
  ...ENERGY_FIRST_CIRCLE,
  ...KNOWLEDGE_FIRST_CIRCLE,
  ...FEAR_FIRST_CIRCLE,
  // 2º Círculo
  ...BLOOD_SECOND_CIRCLE,
  ...KNOWLEDGE_SECOND_CIRCLE,
  ...ENERGY_SECOND_CIRCLE,
  ...FEAR_SECOND_CIRCLE,
  ...DEATH_SECOND_CIRCLE,
  // 3º Círculo
  ...BLOOD_THIRD_CIRCLE,
  ...DEATH_THIRD_CIRCLE,
  ...KNOWLEDGE_THIRD_CIRCLE,
  ...ENERGY_THIRD_CIRCLE,
  ...FEAR_THIRD_CIRCLE,
  // 4º Círculo
  ...BLOOD_FOURTH_CIRCLE,
  ...DEATH_FOURTH_CIRCLE,
  ...KNOWLEDGE_FOURTH_CIRCLE,
  ...ENERGY_FOURTH_CIRCLE,
  ...FEAR_FOURTH_CIRCLE,
];

// Mapas para acesso rápido
export const RITUAL_BY_ID = new Map<string, UnifiedRitual>(
  UNIFIED_RITUALS.map(r => [r.id, r])
);

export const RITUALS_BY_CIRCLE = new Map<RitualCircle, UnifiedRitual[]>();
export const RITUALS_BY_ELEMENT = new Map<RitualElement, UnifiedRitual[]>();

// Inicializa mapas
for (const ritual of UNIFIED_RITUALS) {
  // Por círculo
  const byCircle = RITUALS_BY_CIRCLE.get(ritual.circle) || [];
  byCircle.push(ritual);
  RITUALS_BY_CIRCLE.set(ritual.circle, byCircle);
  
  // Por elemento
  const byElement = RITUALS_BY_ELEMENT.get(ritual.element) || [];
  byElement.push(ritual);
  RITUALS_BY_ELEMENT.set(ritual.element, byElement);
}
