/**
 * Ordem Paranormal RPG - Rituais de 2º Círculo (Unificados)
 * Migrados para o novo sistema unificado
 */

import type { UnifiedRitual } from './types';

// ========================================
// 2º CÍRCULO - SANGUE
// ========================================

export const BLOOD_SECOND_CIRCLE: UnifiedRitual[] = [
  {
    id: 'aprimorar-fisico',
    name: 'Aprimorar Físico',
    circle: 2,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Cena',
    description: 'Recebe +1 em Agilidade ou Força.',
    cost: 2,
    effects: {
      base: {
        kind: 'buff',
        summary: '+1 em Agilidade ou Força (escolha ao conjurar).',
      },
      discente: {
        kind: 'buff',
        summary: '+2 em Agilidade ou Força.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: '+3 em Agilidade ou Força.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Muda bônus para +2.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Muda bônus para +3.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'descarnar',
    name: 'Descarnar',
    circle: 2,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Instantânea',
    description: 'Causa 6d8 dano (corte/Sangue) e hemorragia. Hemorragia causa 2d8/rodada (Fortitude evita).',
    cost: 2,
    resistance: { type: 'fortitude', effect: 'parcial' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 6, diceType: 8, damageType: 'sangue' },
        conditions: [{ id: 'sangrando', duration: 'sustentado' }],
        resistance: { type: 'fortitude', effect: 'parcial' },
        summary: '6d8 dano de Sangue + hemorragia (2d8/rodada).',
      },
      discente: {
        kind: 'damage',
        damage: { diceCount: 10, diceType: 8, damageType: 'sangue' },
        summary: '10d8 dano, hemorragia 4d8/rodada.',
      },
      verdadeiro: {
        kind: 'buff',
        weaponEffect: { damageBonus: '4d8', damageType: 'sangue' },
        sustain: { action: 'free' },
        summary: 'Sustentado. Ataques causam +4d8 Sangue e hemorragia.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Dano 10d8, hemorragia 4d8.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Alvo você, duração sustentada. Seus ataques causam +4d8 Sangue e hemorragia.', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'flagelo-de-sangue',
    name: 'Flagelo de Sangue',
    circle: 2,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 pessoa',
    duration: 'Cena',
    description: 'Grava marca e dá ordem. Desobediência causa 10d6 dano Sangue e enjoado.',
    cost: 2,
    resistance: { type: 'fortitude', effect: 'parcial' },
    effects: {
      base: {
        kind: 'control',
        mentalControl: { type: 'suggestion', canForceHarm: false, canForceSuicide: false },
        damage: { diceCount: 10, diceType: 6, damageType: 'sangue' },
        resistance: { type: 'fortitude', effect: 'parcial' },
        summary: 'Marca que causa 10d6 e enjoado se desobedecer ordem.',
      },
      discente: {
        kind: 'control',
        summary: 'Pode afetar 1 ser (exceto criaturas de Sangue).',
      },
      verdadeiro: {
        kind: 'control',
        summary: 'Duração de 1 dia.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Muda alvo para "1 ser (exceto Sangue)".', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Duração 1 dia.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'hemofagia',
    name: 'Hemofagia',
    circle: 2,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Instantânea',
    description: 'Causa 6d6 dano Sangue, recupera metade em PV.',
    cost: 2,
    resistance: { type: 'fortitude', effect: 'reduz_metade' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 6, diceType: 6, damageType: 'sangue' },
        healing: { diceCount: 3, diceType: 6 },
        resistance: { type: 'fortitude', effect: 'reduz_metade' },
        summary: '6d6 dano de Sangue, cura metade do dano causado.',
      },
      discente: {
        kind: 'damage',
        summary: 'Sem resistência. Pode combinar com ataque corpo a corpo.',
      },
      verdadeiro: {
        kind: 'buff',
        sustain: { action: 'standard' },
        summary: 'Sustentado. Ação padrão para tocar e causar 4d6 (cura metade).',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Resistência nenhuma. Faz ataque corpo a corpo junto.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Pessoal, sustentada. Ação padrão para tocar e causar 4d6 (recupera metade).', circleReq: 4 },
    ],
  },
  {
    id: 'sede-de-adrenalina',
    name: 'Sede de Adrenalina',
    circle: 2,
    element: 'sangue',
    execution: 'Reação',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Instantânea',
    description: 'Repete teste de Acrobacia/Atletismo falho OU reduz dano de queda em 4d6.',
    cost: 2,
    hasHooks: true,
    effects: {
      base: {
        kind: 'interceptor',
        hooks: [
          { trigger: 'onRoll', effect: 'Repete teste de Acrobacia/Atletismo falho' },
          { trigger: 'onFallDamage', effect: 'Reduz dano de queda em 4d6' },
        ],
        summary: 'Repete teste falho OU reduz dano de queda em 4d6.',
      },
      discente: {
        kind: 'interceptor',
        summary: 'Reduz dano de queda em 8d6.',
      },
      verdadeiro: {
        kind: 'interceptor',
        summary: 'Reduz dano de queda em 12d6.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Reduz queda em 8d6.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Reduz queda em 12d6.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'transfusao-vital',
    name: 'Transfusão Vital',
    circle: 2,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Instantânea',
    description: 'Transfere até 30 PV seus para o alvo.',
    cost: 2,
    effects: {
      base: {
        kind: 'healing',
        healing: { diceCount: 0, diceType: 6, bonus: 30 },
        summary: 'Transfere até 30 PV seus para o alvo.',
      },
      discente: {
        kind: 'healing',
        summary: 'Transfere até 50 PV.',
      },
      verdadeiro: {
        kind: 'healing',
        summary: 'Transfere até 100 PV.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Transfere até 50 PV.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Transfere até 100 PV.', circleReq: 4 },
    ],
  },
];

// ========================================
// 2º CÍRCULO - CONHECIMENTO
// ========================================

export const KNOWLEDGE_SECOND_CIRCLE: UnifiedRitual[] = [
  {
    id: 'aprimorar-mente',
    name: 'Aprimorar Mente',
    circle: 2,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Cena',
    description: 'Recebe +1 em Intelecto ou Presença.',
    cost: 2,
    effects: {
      base: {
        kind: 'buff',
        summary: '+1 em Intelecto ou Presença (escolha ao conjurar).',
      },
      discente: {
        kind: 'buff',
        summary: '+2 em Intelecto ou Presença.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: '+3 em Intelecto ou Presença.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Muda bônus para +2.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Muda bônus para +3.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'aurora-da-verdade',
    name: 'Aurora da Verdade',
    circle: 2,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Curto',
    area: 'Esfera com 3m de raio',
    duration: 'Sustentada',
    description: 'Luz dourada obriga seres na área a falar a verdade. Seres escondidos/invisíveis são revelados.',
    cost: 2,
    resistance: { type: 'vontade', effect: 'parcial' },
    isSustainable: true,
    effects: {
      base: {
        kind: 'control',
        areaEffect: { shape: 'esfera', radius: 3 },
        resistance: { type: 'vontade', effect: 'parcial' },
        sustain: { concentration: true },
        summary: 'Área de 3m onde seres devem falar a verdade. Revela invisíveis.',
      },
      discente: {
        kind: 'control',
        areaEffect: { shape: 'esfera', radius: 9 },
        summary: 'Alcance longo, área de 9m. Conjurador não é afetado.',
      },
      verdadeiro: {
        kind: 'control',
        summary: 'Alcance extremo, área 9m, duração cena (não sustentada).',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Muda alcance para longo, área para 9m de raio, e conjurador não é afetado.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Muda alcance para extremo, área 9m, duração cena.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'deteccao-de-ameacas',
    name: 'Detecção de Ameaças',
    circle: 2,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Pessoal',
    area: 'Esfera de 18m de raio',
    duration: 'Cena',
    description: 'Sente perigo na área. Pode gastar movimento para Percepção (DT 20) e saber direção/distância.',
    cost: 2,
    effects: {
      base: {
        kind: 'sense',
        senseEffect: { type: 'detect', range: 18, targets: 'perigos e armadilhas', information: 'direção e distância' },
        summary: 'Sente perigos em 18m. Pode identificar direção/distância.',
      },
      discente: {
        kind: 'sense',
        summary: 'Não fica desprevenido contra perigos detectados. +5 em resistência vs armadilhas.',
      },
      verdadeiro: {
        kind: 'sense',
        summary: 'Duração de 1 dia.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Não fica desprevenido contra perigos detectados, +5 resistência vs armadilhas.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 5, description: 'Duração 1 dia.', circleReq: 4 },
    ],
  },
  {
    id: 'esconder-dos-olhos',
    name: 'Esconder dos Olhos',
    circle: 2,
    element: 'conhecimento',
    execution: 'Livre',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Invisível (+15 Furtividade). Ataque ou ação hostil encerra.',
    cost: 2,
    effects: {
      base: {
        kind: 'buff',
        skillBonus: { skills: ['Furtividade'], bonus: 15 },
        summary: 'Invisível. +15 Furtividade. Ação hostil encerra.',
      },
      discente: {
        kind: 'buff',
        areaEffect: { shape: 'esfera', radius: 3 },
        sustain: { action: 'free' },
        summary: 'Sustentada. Esfera de invisibilidade 3m (você e aliados).',
      },
      verdadeiro: {
        kind: 'buff',
        sustain: { action: 'free' },
        summary: 'Toque, 1 ser, sustentada. Ataque não dissipa a invisibilidade.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Duração sustentada. Esfera de invisibilidade 3m (você e aliados).', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Ação padrão, toque, 1 ser, sustentada. Ataque não dissipa.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'invadir-mente',
    name: 'Invadir Mente',
    circle: 2,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Médio',
    target: '1 ser ou 2 pessoas voluntárias',
    duration: 'Instantânea',
    description: 'Dano: 6d6 Conhecimento e atordoado (Vontade metade e não atordoa). Ligação Telepática: elo mental entre duas pessoas.',
    cost: 2,
    resistance: { type: 'vontade', effect: 'parcial' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 6, diceType: 6, damageType: 'conhecimento' },
        conditions: [{ id: 'atordoado', duration: 1 }],
        resistance: { type: 'vontade', effect: 'parcial' },
        summary: '6d6 dano Conhecimento + atordoado. OU cria elo telepático entre 2 pessoas.',
      },
      discente: {
        kind: 'damage',
        damage: { diceCount: 10, diceType: 6, damageType: 'conhecimento' },
        summary: '10d6 dano. Elo telepático permite ver pelos sentidos do alvo.',
      },
      verdadeiro: {
        kind: 'damage',
        damage: { diceCount: 10, diceType: 6, damageType: 'conhecimento' },
        summary: '10d6 em seres escolhidos. Elo telepático com até 5 pessoas.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Rajada 10d6. Ligação permite ver pelos sentidos do alvo.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Rajada 10d6 em seres escolhidos. Ligação até 5 pessoas.', circleReq: 4 },
    ],
  },
  {
    id: 'localizacao',
    name: 'Localização',
    circle: 2,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Pessoal',
    area: 'Círculo com 90m de raio',
    duration: 'Cena',
    description: 'Encontra direção/distância de pessoa ou objeto.',
    cost: 2,
    effects: {
      base: {
        kind: 'sense',
        senseEffect: { type: 'locate', range: 90, information: 'direção e distância' },
        summary: 'Localiza pessoa ou objeto em 90m.',
      },
      discente: {
        kind: 'sense',
        summary: 'Encontra caminho/rota em um lugar. Duração 1 hora.',
      },
      verdadeiro: {
        kind: 'sense',
        senseEffect: { type: 'locate', range: 1000 },
        summary: 'Área de 1km de raio.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Toque, 1 pessoa, 1 hora. Encontra caminho/rota em lugar.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Área 1km raio.', circleReq: 4 },
    ],
  },
];

// ========================================
// 2º CÍRCULO - ENERGIA
// ========================================

export const ENERGY_SECOND_CIRCLE: UnifiedRitual[] = [
  {
    id: 'chamas-do-caos',
    name: 'Chamas do Caos',
    circle: 2,
    element: 'energia',
    execution: 'Padrão',
    range: 'Curto',
    target: 'Veja texto',
    duration: 'Cena',
    description: 'Efeitos de fogo: Chamejar (+1d6 dano fogo em arma); Esquentar (objeto causa 1d6 dano/rodada); Extinguir (apaga chama, cria fumaça); Modelar (move chama, causa 3d6 dano ao atravessar ser).',
    cost: 2,
    hasModes: true,
    effects: {
      base: {
        kind: 'utility',
        modes: [
          { name: 'Chamejar', description: '+1d6 dano de fogo em arma' },
          { name: 'Esquentar', description: 'Objeto causa 1d6 dano/rodada' },
          { name: 'Extinguir', description: 'Apaga chama, cria fumaça' },
          { name: 'Modelar', description: 'Move chama, causa 3d6 ao atravessar' },
        ],
        summary: 'Controla fogo com vários efeitos.',
      },
      discente: {
        kind: 'damage',
        damage: { diceCount: 4, diceType: 6, damageType: 'energia' },
        sustain: { action: 'standard' },
        summary: 'Sustentada. Pode projetar labareda (4d6 dano Energia).',
      },
      verdadeiro: {
        kind: 'damage',
        damage: { diceCount: 8, diceType: 6, damageType: 'energia' },
        summary: 'Labareda causa 8d6.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Duração sustentada. Pode projetar labareda (4d6 dano Energia).', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Labareda causa 8d6.', circleReq: 3 },
    ],
  },
  {
    id: 'contencao-fantasmagorica',
    name: 'Contenção Fantasmagórica',
    circle: 2,
    element: 'energia',
    execution: 'Padrão',
    range: 'Médio',
    target: '1 ser',
    duration: 'Cena',
    description: 'Três laços prendem o alvo (agarrado). Pode tentar quebrar (Atletismo) ou destruir laços (Def 10, 10 PV, RD 5).',
    cost: 2,
    resistance: { type: 'reflexos', effect: 'anula' },
    effects: {
      base: {
        kind: 'control',
        conditions: [{ id: 'agarrado', duration: 'cena' }],
        resistance: { type: 'reflexos', effect: 'anula' },
        summary: '3 laços prendem o alvo (agarrado). Laços: Def 10, 10 PV, RD 5.',
      },
      discente: {
        kind: 'control',
        summary: '6 laços. Pode dividir entre múltiplos alvos.',
      },
      verdadeiro: {
        kind: 'control',
        damage: { diceCount: 2, diceType: 6, bonus: 2, damageType: 'energia' },
        summary: 'Laços destruídos explodem (2d6+2 dano Energia).',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: '6 laços, pode escolher múltiplos alvos.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 5, description: 'Laços destruídos explodem (2d6+2 dano Energia).', circleReq: 3, affinityReq: true },
    ],
  },
  {
    id: 'dissonancia-acustica',
    name: 'Dissonância Acústica',
    circle: 2,
    element: 'energia',
    execution: 'Padrão',
    range: 'Médio',
    area: 'Esfera com 6m de raio',
    duration: 'Sustentada',
    description: 'Deixa seres surdos e impede conjuração de rituais na área.',
    cost: 2,
    isSustainable: true,
    effects: {
      base: {
        kind: 'debuff',
        conditions: [{ id: 'surdo', duration: 'sustentado' }],
        areaEffect: { shape: 'esfera', radius: 6 },
        sustain: { concentration: true },
        summary: 'Seres na área ficam surdos. Impede conjuração de rituais.',
      },
      discente: {
        kind: 'utility',
        summary: 'Alvo objeto. Emana silêncio em 3m de raio.',
      },
      verdadeiro: {
        kind: 'utility',
        summary: 'Duração cena. Som não sai da área, mas funciona dentro.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 1, description: 'Muda para alvo objeto. Emana silêncio 3m raio.', circleReq: 2 },
      { name: 'Verdadeiro', cost: 3, description: 'Muda duração para cena. Som não sai da área.', circleReq: 3 },
    ],
  },
  {
    id: 'sopro-do-caos',
    name: 'Sopro do Caos',
    circle: 2,
    element: 'energia',
    execution: 'Padrão',
    range: 'Médio',
    area: 'Varia',
    duration: 'Sustentada',
    description: 'Ascender: levita alvo (vulnável). Sopro: empurra (cone 4,5m). Vento: cria/aumenta vento forte.',
    cost: 2,
    isSustainable: true,
    hasModes: true,
    effects: {
      base: {
        kind: 'control',
        modes: [
          { name: 'Ascender', description: 'Levita alvo (fica vulnerável)' },
          { name: 'Sopro', description: 'Empurra em cone de 4,5m' },
          { name: 'Vento', description: 'Cria ou aumenta vento forte' },
        ],
        sustain: { action: 'free' },
        summary: 'Controla ar/vento com vários efeitos.',
      },
      discente: {
        kind: 'control',
        summary: 'Afeta alvos Grandes.',
      },
      verdadeiro: {
        kind: 'control',
        summary: 'Afeta alvos Enormes.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Afeta alvos Grandes.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 9, description: 'Afeta alvos Enormes.', circleReq: 4 },
    ],
  },
  {
    id: 'tela-de-ruido',
    name: 'Tela de Ruído',
    circle: 2,
    element: 'energia',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Recebe 30 PV temporários contra dano físico. Ou reação para RD 15 contra um ataque.',
    cost: 2,
    hasHooks: true,
    effects: {
      base: {
        kind: 'buff',
        tempHP: { diceCount: 0, diceType: 6, bonus: 30 },
        hooks: [
          { trigger: 'onPreDamage', effect: 'RD 15 contra um ataque (reação)' },
        ],
        summary: '30 PV temporários contra dano físico OU RD 15 como reação.',
      },
      discente: {
        kind: 'buff',
        tempHP: { diceCount: 0, diceType: 6, bonus: 60 },
        summary: '60 PV temporários, RD 30.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: 'Esfera imóvel em alvo Enorme ou menor. Bloqueia tudo.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: '60 PV temporários, RD 30.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Esfera imóvel em alvo Enorme ou menor. Bloqueia tudo.', circleReq: 4 },
    ],
  },
  {
    id: 'tremeluzir',
    name: 'Tremeluzir',
    circle: 2,
    element: 'energia',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Sustentada',
    description: 'Atravessa objetos sólidos (ação movimento, 25% falha). Sofre 1d4 dano Energia/rodada.',
    cost: 2,
    isSustainable: true,
    effects: {
      base: {
        kind: 'transformation',
        damagePerTurn: { diceCount: 1, diceType: 4, damageType: 'energia' },
        sustain: { action: 'free' },
        summary: 'Atravessa objetos sólidos (25% falha). 1d4 dano/rodada.',
      },
      discente: {
        kind: 'transformation',
        summary: 'Pode afetar 1 ser com toque.',
      },
      verdadeiro: {
        kind: 'transformation',
        summary: 'Afeta até 5 seres em alcance curto.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Toque, 1 ser.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 7, description: 'Curto, até 5 seres.', circleReq: 4, affinityReq: true },
    ],
  },
];

// ========================================
// 2º CÍRCULO - MEDO
// ========================================

export const FEAR_SECOND_CIRCLE: UnifiedRitual[] = [
  {
    id: 'protecao-contra-rituais',
    name: 'Proteção contra Rituais',
    circle: 2,
    element: 'medo',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Cena',
    description: 'Você canaliza uma aura de Medo puro, que protege o alvo contra efeitos paranormais. O alvo recebe resistência a dano paranormal 5 e +5 em testes de resistência contra rituais e habilidades de criaturas paranormais.',
    cost: 2,
    effects: {
      base: {
        kind: 'buff',
        damageReduction: { types: ['energia', 'sangue', 'morte', 'conhecimento', 'medo'], amount: 5 },
        resistanceBonus: 5,
        summary: 'RD 5 contra dano paranormal. +5 em resistência vs rituais/criaturas.',
      },
      discente: {
        kind: 'buff',
        summary: 'Afeta até 5 seres tocados.',
      },
      verdadeiro: {
        kind: 'buff',
        damageReduction: { types: ['energia', 'sangue', 'morte', 'conhecimento', 'medo'], amount: 10 },
        resistanceBonus: 10,
        summary: 'Até 5 seres. RD 10, +10 em resistência.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Muda o alvo para até 5 seres tocados.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 6, description: 'Muda para até 5 seres, RD 10 e +10 em resistência.', circleReq: 4 },
    ],
  },
  {
    id: 'rejeitar-nevoa',
    name: 'Rejeitar Névoa',
    circle: 2,
    element: 'medo',
    execution: 'Padrão',
    range: 'Curto',
    area: 'Nuvem de 6m de raio',
    duration: 'Cena',
    description: 'Aumenta custo (+2 PE/círculo) e tempo de execução de rituais na área. Anula Cinerária.',
    cost: 2,
    effects: {
      base: {
        kind: 'debuff',
        areaEffect: { shape: 'esfera', radius: 6 },
        summary: 'Rituais na área custam +2 PE por círculo. Anula Cinerária.',
      },
      discente: {
        kind: 'debuff',
        summary: 'Reduz DT de rituais na área em -5.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 2, description: 'Reduz DT de rituais na área em -5.', circleReq: 3 },
    ],
  },
  {
    id: 'absorcao-de-medo',
    name: 'Absorção de Medo',
    circle: 2,
    element: 'medo',
    execution: 'Reação',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Instantânea',
    description: 'Quando um ritual hostil o atinge, você absorve parte de sua energia. Recupera PE igual ao círculo do ritual.',
    cost: 0,
    hasHooks: true,
    effects: {
      base: {
        kind: 'interceptor',
        hooks: [
          { trigger: 'onPostDamage', effect: 'Recupera PE igual ao círculo do ritual que o atingiu' },
        ],
        summary: 'Reação: recupera PE igual ao círculo do ritual hostil que o atingiu.',
      },
      discente: {
        kind: 'interceptor',
        summary: 'Recupera PE x2 do círculo do ritual.',
      },
      verdadeiro: {
        kind: 'interceptor',
        summary: 'Além de recuperar PE, causa dano igual ao custo do ritual no conjurador.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Recupera PE igual ao dobro do círculo.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 6, description: 'Causa dano igual ao custo do ritual no conjurador.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'barreira-de-medo',
    name: 'Barreira de Medo',
    circle: 2,
    element: 'medo',
    execution: 'Padrão',
    range: 'Curto',
    area: 'Parede de 6m de comprimento e 3m de altura',
    duration: 'Cena',
    description: 'Você cria uma barreira de puro Medo. Seres que atravessam ficam amedrontados se falharem na Vontade.',
    cost: 2,
    resistance: { type: 'vontade', effect: 'anula' },
    effects: {
      base: {
        kind: 'control',
        conditions: [{ id: 'amedrontado', duration: 'cena' }],
        areaEffect: { shape: 'linha', length: 6 },
        resistance: { type: 'vontade', effect: 'anula' },
        summary: 'Parede de 6m. Atravessar causa amedrontado (Vontade anula).',
      },
      discente: {
        kind: 'control',
        conditions: [{ id: 'apavorado', duration: 'cena' }],
        summary: 'Causa apavorado ao atravessar.',
      },
      verdadeiro: {
        kind: 'control',
        summary: 'Parede de 12m. Causa 4d6 de dano de Medo ao atravessar.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Causa apavorado ao invés de amedrontado.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 6, description: 'Parede de 12m. Causa 4d6 dano de Medo.', circleReq: 4, affinityReq: true },
    ],
  },
];

// ========================================
// 2º CÍRCULO - MORTE
// ========================================

export const DEATH_SECOND_CIRCLE: UnifiedRitual[] = [
  {
    id: 'amputar',
    name: 'Amputar',
    circle: 2,
    element: 'morte',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Instantânea',
    description: 'Causa 6d6 dano de Morte e amputa membro se o alvo falhar na Fortitude. Pode curar amputação própria gastando metade do PE máximo.',
    cost: 2,
    resistance: { type: 'fortitude', effect: 'parcial' },
    effects: {
      base: {
        kind: 'damage',
        damage: { diceCount: 6, diceType: 6, damageType: 'morte' },
        resistance: { type: 'fortitude', effect: 'parcial' },
        summary: '6d6 dano Morte. Amputa membro se falhar. Ou cura amputação própria (custa metade PE máx).',
      },
      discente: {
        kind: 'damage',
        summary: 'Pode amputar cabeça. Cura não gera PE máximo.',
      },
      verdadeiro: {
        kind: 'damage',
        damage: { diceCount: 12, diceType: 6, damageType: 'morte' },
        summary: '12d6 dano, amputação em alcance curto.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Pode amputar cabeça. Curar amputação não custa PE máximo.', circleReq: 3, affinityReq: true },
      { name: 'Verdadeiro', cost: 7, description: 'Alcance curto, 12d6 dano.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'armamento-extradimensional',
    name: 'Armamento Extradimensional',
    circle: 2,
    element: 'morte',
    execution: 'Livre',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Permanente',
    description: 'Abre lacuna até 30cm de raio para guardar armas/equipamentos. Conjura novamente para acessar.',
    cost: 1,
    effects: {
      base: {
        kind: 'utility',
        summary: 'Bolso dimensional de até 30cm de raio para armas/equipamentos.',
      },
      discente: {
        kind: 'utility',
        summary: 'Bolso de até 1m de raio.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 3, description: 'Bolso de até 1m de raio.', circleReq: 3 },
    ],
  },
  {
    id: 'banimento',
    name: 'Banimento',
    circle: 2,
    element: 'morte',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 criatura paranormal',
    duration: 'Especial',
    description: 'Expulsa criatura paranormal para o Outro Lado se falhar na Vontade. Demora mais rodadas quanto mais forte a criatura.',
    cost: 2,
    resistance: { type: 'vontade', effect: 'anula' },
    effects: {
      base: {
        kind: 'utility',
        resistance: { type: 'vontade', effect: 'anula' },
        summary: 'Expulsa criatura paranormal para o Outro Lado.',
      },
      discente: {
        kind: 'utility',
        summary: 'Afeta até 3 criaturas. +5 na DT.',
      },
      verdadeiro: {
        kind: 'utility',
        summary: 'Banimento instantâneo. +10 na DT.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 4, description: 'Até 3 criaturas, +5 DT.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 8, description: 'Banimento instantâneo, +10 DT.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'desacelerar-impacto',
    name: 'Desacelerar Impacto',
    circle: 2,
    element: 'morte',
    execution: 'Reação',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Instantânea',
    description: 'Reduz em 5d10 dano de queda ou projétil.',
    cost: 2,
    hasHooks: true,
    effects: {
      base: {
        kind: 'interceptor',
        hooks: [
          { trigger: 'onFallDamage', effect: 'Reduz 5d10 de dano de queda' },
          { trigger: 'onProjectileHit', effect: 'Reduz 5d10 de dano de projétil' },
        ],
        summary: 'Reduz em 5d10 dano de queda ou projétil (reação).',
      },
      discente: {
        kind: 'interceptor',
        summary: 'Reduz 10d10 de dano.',
      },
      verdadeiro: {
        kind: 'interceptor',
        summary: 'Nega dano de queda completamente.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 4, description: 'Reduz 10d10 de dano.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 8, description: 'Nega todo dano de queda.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'paralisia',
    name: 'Paralisia',
    circle: 2,
    element: 'morte',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 ser',
    duration: 'Cena',
    description: 'Alvo fica paralisado se falhar na Fortitude. No turno, pode repetir resistência.',
    cost: 2,
    resistance: { type: 'fortitude', effect: 'anula' },
    effects: {
      base: {
        kind: 'debuff',
        conditions: [{ id: 'paralisado', duration: 'sustentado' }],
        resistance: { type: 'fortitude', effect: 'anula' },
        sustain: { concentration: true },
        summary: 'Alvo fica paralisado. Pode repetir resistência a cada turno.',
      },
      discente: {
        kind: 'debuff',
        conditions: [{ id: 'paralisado', duration: 'cena' }],
        summary: 'Não precisa sustentar. Duração cena.',
      },
      verdadeiro: {
        kind: 'debuff',
        summary: 'Até 5 seres.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 4, description: 'Duração cena, sem sustentar.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 8, description: 'Até 5 seres.', circleReq: 4, affinityReq: true },
    ],
  },
  {
    id: 'velocidade-mortal',
    name: 'Velocidade Mortal',
    circle: 2,
    element: 'morte',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 ser',
    duration: 'Cena',
    description: 'Acelera o tempo. +3m de deslocamento, +1 em Defesa e Reflexos, +1 ação padrão.',
    cost: 2,
    effects: {
      base: {
        kind: 'buff',
        defenseBonus: 1,
        summary: '+3m deslocamento, +1 Defesa/Reflexos, +1 ação padrão por turno.',
      },
      discente: {
        kind: 'buff',
        defenseBonus: 3,
        summary: '+9m, +3 Defesa/Reflexos, +2 ações padrão.',
      },
      verdadeiro: {
        kind: 'buff',
        summary: '+15m, +5 Defesa/Reflexos, +3 ações padrão.',
      },
    },
    enhancements: [
      { name: 'Discente', cost: 4, description: '+9m, +3 em Defesa/Reflexos, +2 ações padrão.', circleReq: 3 },
      { name: 'Verdadeiro', cost: 8, description: '+15m, +5 em Defesa/Reflexos, +3 ações padrão.', circleReq: 4, affinityReq: true },
    ],
  },
];
