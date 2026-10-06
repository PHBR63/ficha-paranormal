import type { EffectMechanics } from '../unified-effects-engine';

/** Texto comum aos cadastros legados. Livro Base v1.3, pp. 310–311. */
export const BASE_CONDITION_TEXT: Record<string, string> = {
  abalado: '–1d20 em testes. Uma nova aplicação torna o personagem apavorado.',
  apavorado: '–2d20 em testes de perícia. Deve fugir da fonte do medo enquanto a perceber em alcance médio.',
  agarrado: 'Desprevenido e imóvel. –1d20 em ataques; só pode atacar com armas leves.',
  atordoado: 'Desprevenido e não pode fazer ações. Pode realizar reações.',
  caido: '–2d20 em ataques corpo a corpo. Deslocamento 1,5m. Defesa –5 contra corpo a corpo e +5 contra distância.',
  cego: 'Desprevenido e lento. –2d20 em testes de Agilidade e Força; não pode observar e seus alvos têm camuflagem total.',
  debilitado: '–2d20 em testes de Agilidade, Força e Vigor. Uma nova aplicação torna o personagem inconsciente.',
  desprevenido: '–5 na Defesa e –1d20 em Reflexos.',
  doente: 'Sob efeito de uma doença; os efeitos e a duração dependem da doença.',
  enjoado: 'Uma ação padrão ou de movimento por rodada, não ambas.',
  enlouquecendo: 'Três inícios de turno nesta condição na mesma cena, inclusive não consecutivos, tornam o personagem um NPC do mestre. Confira a contagem da cena; a condição não retira o controle das ações imediatamente.',
  enredado: 'Lento e vulnerável. –1d20 em testes de ataque.',
  envenenado: 'Efeitos e duração dependem do veneno. Dano recorrente de venenos sempre se acumula.',
  esmorecido: '–2d20 em testes de Intelecto e Presença.',
  exausto: 'Debilitado, lento e vulnerável. Uma nova aplicação torna o personagem inconsciente.',
  fatigado: 'Fraco e vulnerável. Uma nova aplicação torna o personagem exausto.',
  fraco: '–1d20 em testes de Agilidade, Força e Vigor. Uma nova aplicação torna o personagem debilitado.',
  frustrado: '–1d20 em testes de Intelecto e Presença. Uma nova aplicação torna o personagem esmorecido.',
  inconsciente: 'Indefeso e não pode fazer ações, incluindo reações. Conferir a causa e a forma de despertar.',
  indefeso: '–10 na Defesa, falha automaticamente em Reflexos e pode sofrer golpes de misericórdia. Não torna todos os ataques acertos ou críticos automáticos.',
  lento: 'Deslocamento pela metade, arredondado para baixo em incrementos de 1,5m. Não pode correr nem fazer investidas.',
  machucado: 'Metade ou menos dos PV totais. Esta condição não causa penalidade nem dano adicional.',
  morrendo: 'Três inícios de turno Morrendo na mesma cena, inclusive não consecutivos, causam morte. Dano recebido não avança a contagem. Cura de PV pode encerrar Inconsciente, mas não estabiliza Morrendo.',
  pasmo: 'Não pode fazer ações.',
  perturbado: 'Na primeira ocorrência na cena, recebe um efeito de insanidade.',
  sangrando: 'Início do turno: teste de Vigor DT 20. Sucesso remove a condição; falha perde 1d6 PV. Medicina DT 20 com ação completa também estabiliza.',
  surdo: 'Não pode ouvir. –2d20 em Iniciativa e condição ruim para lançar rituais.',
  surpreendido: 'Desprevenido e não pode fazer ações.',
  vulneravel: '–2 na Defesa.',
};

const physical = (value: number) => ({ agility: value, strength: value, vigor: value });
/** Encerramento informado pela fonte; não presume DTs ou duração por turno. */
export const BASE_CONDITION_REMOVAL: Record<string, string> = {
  ...Object.fromEntries(Object.keys(BASE_CONDITION_TEXT).map(id => [id,
    'Fim da cena, salvo duração ou encerramento específicos definidos pela fonte. Confira com o mestre.'])),
  caido: 'Ação de movimento para levantar-se.',
  machucado: 'Ter mais da metade dos PV totais.',
  perturbado: 'Ter pelo menos metade da SAN total; o efeito narrativo da cena exige conferência com o mestre.',
  sangrando: 'Vigor DT 20 no início do turno, ou ação completa com Medicina DT 20.',
  morrendo: 'Medicina DT 20 +5 por estabilização anterior na cena, ou efeito específico. Curar PV não encerra Morrendo.',
  enlouquecendo: 'Diplomacia DT 20 +5 por vez que foi acalmado na cena, ou recuperar ao menos 1 SAN.',
  inconsciente: 'Conferir a causa. Se causada por zero PV, um efeito que cure ao menos 1 PV a encerra.',
  envenenado: 'Duração e tratamento definidos pelo veneno; sem duração informada, termina no fim da cena.',
  fascinado: 'Ação hostil contra o personagem, ação padrão para sacudi-lo, ou encerramento definido pela fonte.',
};
const mental = (value: number) => ({ intellect: value, presence: value });

/** Mecânicas do lote conferido, separando modificadores de d20 dos valores numéricos. */
export const BASE_CONDITION_MECHANICS: Record<string, {
  mechanics: EffectMechanics;
  contextual?: { melee?: Partial<EffectMechanics>; ranged?: Partial<EffectMechanics> };
}> = {
  abalado: { mechanics: { testDice: { all: -1 } } },
  apavorado: { mechanics: { testDice: { all: -2 }, specialEffects: ['Deve fugir da fonte do medo'] } },
  agarrado: { mechanics: { cannotMove: true, testDice: { attacks: -1 }, specialEffects: ['Só pode atacar com armas leves'] } },
  atordoado: { mechanics: { cannotAct: true } },
  caido: {
    mechanics: { testDice: { melee: -2 }, defenseBonusMelee: -5, defenseBonusRanged: 5, specialEffects: ['Deslocamento limitado a 1,5m'] },
    contextual: { melee: { defenseBonusMelee: -5 }, ranged: { defenseBonusRanged: 5 } },
  },
  cego: { mechanics: { testDice: { attributes: { agility: -2, strength: -2 } }, specialEffects: ['Não pode observar; alvos têm camuflagem total'] } },
  debilitado: { mechanics: { testDice: { attributes: physical(-2) } } },
  desprevenido: { mechanics: { defenseBonus: -5, testDice: { skills: { reflexos: -1 } } } },
  doente: { mechanics: {} },
  enjoado: { mechanics: { specialEffects: [BASE_CONDITION_TEXT.enjoado] } },
  enlouquecendo: { mechanics: { specialEffects: [BASE_CONDITION_TEXT.enlouquecendo] } },
  enredado: { mechanics: { testDice: { attacks: -1 } } },
  envenenado: { mechanics: {} },
  esmorecido: { mechanics: { testDice: { attributes: mental(-2) } } },
  exausto: { mechanics: {} },
  fatigado: { mechanics: {} },
  fraco: { mechanics: { testDice: { attributes: physical(-1) } } },
  frustrado: { mechanics: { testDice: { attributes: mental(-1) } } },
  inconsciente: { mechanics: { cannotAct: true, cannotReact: true, cannotMove: true, isUnconscious: true, isHelpless: true,
    specialEffects: [BASE_CONDITION_TEXT.inconsciente] } },
  indefeso: { mechanics: { defenseBonus: -10, isHelpless: true, specialEffects: [BASE_CONDITION_TEXT.indefeso] } },
  lento: { mechanics: { movementMultiplier: 0.5, specialEffects: ['Não pode correr nem fazer investidas'] } },
  machucado: { mechanics: {} },
  morrendo: { mechanics: { specialEffects: [BASE_CONDITION_TEXT.morrendo] } },
  pasmo: { mechanics: { cannotAct: true } },
  perturbado: { mechanics: { specialEffects: [BASE_CONDITION_TEXT.perturbado] } },
  sangrando: { mechanics: { specialEffects: [BASE_CONDITION_TEXT.sangrando] } },
  surdo: { mechanics: { testDice: { skills: { iniciativa: -2 } }, specialEffects: ['Não pode ouvir; condição ruim para lançar rituais'] } },
  surpreendido: { mechanics: { cannotAct: true } },
  vulneravel: { mechanics: { defenseBonus: -2 } },
};

const DERIVED_CONDITIONS: Record<string, string[]> = {
  agarrado: ['desprevenido', 'imobilizado'], atordoado: ['desprevenido'],
  cego: ['desprevenido', 'lento'], enredado: ['lento', 'vulneravel'],
  fatigado: ['fraco', 'vulneravel'], exausto: ['debilitado', 'lento', 'vulneravel'],
  surpreendido: ['desprevenido'],
  inconsciente: ['indefeso'],
};

/** Expande condições compostas uma vez, preserva IDs persistidos e remove os graus substituídos. */
export function expandBaseConditionIds(ids: string[]): string[] {
  const expanded = new Set(ids);
  for (const id of expanded) {
    for (const derived of DERIVED_CONDITIONS[id] ?? []) expanded.add(derived);
  }
  if (expanded.has('exausto')) expanded.delete('fatigado');
  if (expanded.has('debilitado')) expanded.delete('fraco');
  if (expanded.has('esmorecido')) expanded.delete('frustrado');
  if (expanded.has('apavorado')) expanded.delete('abalado');
  // Indefeso substitui a penalidade de Defesa de Desprevenido, sem somar −5 a −10.
  if (expanded.has('indefeso')) expanded.delete('desprevenido');
  return [...expanded];
}
