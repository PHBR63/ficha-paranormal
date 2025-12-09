// Ordem Paranormal RPG v1.3 - Sistema de Condições
// Baseado no livro de regras oficial

export interface Condition {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  effect: string;
  removal?: string;
  autoRemove?: boolean;
  turnsRemaining?: number;
}

export const CONDITIONS: Record<string, Omit<Condition, 'turnsRemaining'>> = {
  sangrando: {
    id: 'sangrando',
    name: 'Sangrando',
    icon: '🩸',
    color: 'health',
    description: 'Você está perdendo sangue de um ferimento grave.',
    effect: 'No início do seu turno, sofra 1d6 de dano verdadeiro (ignora RD).',
    removal: 'Teste de Fortitude DT 20 ou ação de Medicina.',
  },
  vulneravel: {
    id: 'vulneravel',
    name: 'Vulnerável',
    icon: '🛡️',
    color: 'warning',
    description: 'Sua guarda está aberta.',
    effect: 'Defesa -2.',
    removal: 'Gastar uma ação de movimento para se recompor.',
  },
  atordoado: {
    id: 'atordoado',
    name: 'Atordoado',
    icon: '💫',
    color: 'warning',
    description: 'Você está desorientado e confuso.',
    effect: 'Não pode realizar ações. Defesa -2.',
    removal: 'Fim do próximo turno.',
    autoRemove: true,
  },
  agarrado: {
    id: 'agarrado',
    name: 'Agarrado',
    icon: '🤼',
    color: 'warning',
    description: 'Você está sendo segurado por algo ou alguém.',
    effect: 'Deslocamento 0, não pode atacar à distância. Defesa -2.',
    removal: 'Teste de Atletismo ou Luta para se soltar.',
  },
  caido: {
    id: 'caido',
    name: 'Caído',
    icon: '⬇️',
    color: 'muted-foreground',
    description: 'Você está no chão.',
    effect: 'Defesa -5 contra ataques corpo a corpo. +5 contra ataques à distância.',
    removal: 'Gastar ação de movimento para se levantar.',
  },
  cego: {
    id: 'cego',
    name: 'Cego',
    icon: '👁️',
    color: 'muted-foreground',
    description: 'Você não consegue enxergar.',
    effect: 'Falha automática em testes de Percepção visual. -5 em ataques. Inimigos invisíveis contra você.',
    removal: 'Depende da causa.',
  },
  surdo: {
    id: 'surdo',
    name: 'Surdo',
    icon: '👂',
    color: 'muted-foreground',
    description: 'Você não consegue ouvir.',
    effect: 'Falha automática em testes de Percepção auditiva. -2 em Iniciativa.',
    removal: 'Depende da causa.',
  },
  exausto: {
    id: 'exausto',
    name: 'Exausto',
    icon: '😫',
    color: 'warning',
    description: 'Você está completamente esgotado.',
    effect: '-2 em todos os testes e -3m de deslocamento.',
    removal: 'Descanso completo.',
  },
  apavorado: {
    id: 'apavorado',
    name: 'Apavorado',
    icon: '😱',
    color: 'sanity',
    description: 'O medo domina suas ações.',
    effect: 'Deve fugir da fonte do medo. -2 em todos os testes.',
    removal: 'Teste de Vontade DT 15 ou fim da cena.',
  },
  fascinado: {
    id: 'fascinado',
    name: 'Fascinado',
    icon: '😍',
    color: 'energy',
    description: 'Algo capturou completamente sua atenção.',
    effect: '-5 em testes de Percepção. Não pode realizar ações exceto observar a fonte.',
    removal: 'Ameaça óbvia ou fim do efeito.',
  },
  inconsciente: {
    id: 'inconsciente',
    name: 'Inconsciente',
    icon: '💤',
    color: 'muted-foreground',
    description: 'Você está completamente fora de combate.',
    effect: 'Não pode realizar nenhuma ação. Defesa 5. Indefeso.',
    removal: 'Recuperar ao menos 1 PV ou ser acordado.',
  },
  morrendo: {
    id: 'morrendo',
    name: 'Morrendo',
    icon: '💀',
    color: 'destructive',
    description: 'Você está à beira da morte.',
    effect: 'Inconsciente. Contador de 3 rodadas até morrer. Dano reduz 1 rodada.',
    removal: 'Teste de Medicina DT 20 por aliado. Recupera 1 PV.',
  },
  envenenado: {
    id: 'envenenado',
    name: 'Envenenado',
    icon: '🧪',
    color: 'success',
    description: 'Veneno corre em suas veias.',
    effect: 'Varia conforme o veneno. Geralmente dano por turno.',
    removal: 'Teste de Fortitude, Medicina ou antídoto.',
  },
  paralisado: {
    id: 'paralisado',
    name: 'Paralisado',
    icon: '🧊',
    color: 'accent',
    description: 'Você não consegue se mover.',
    effect: 'Não pode se mover ou realizar ações físicas. Defesa 5. Indefeso.',
    removal: 'Depende da causa.',
  },
  debilitado: {
    id: 'debilitado',
    name: 'Debilitado',
    icon: '📉',
    color: 'warning',
    description: 'Suas capacidades estão reduzidas.',
    effect: '-1 em um atributo específico (definido pela causa).',
    removal: 'Descanso ou cura mágica.',
  },
  fragilizado: {
    id: 'fragilizado',
    name: 'Fragilizado',
    icon: '💔',
    color: 'health',
    description: 'Você está enfraquecido e vulnerável.',
    effect: 'Vulnerável a um tipo de dano específico (+50% dano).',
    removal: 'Depende da causa.',
  },
  lento: {
    id: 'lento',
    name: 'Lento',
    icon: '🐢',
    color: 'muted-foreground',
    description: 'Seus movimentos estão prejudicados.',
    effect: 'Deslocamento reduzido pela metade. Apenas 1 ação por turno.',
    removal: 'Depende da causa.',
  },
  imobilizado: {
    id: 'imobilizado',
    name: 'Imobilizado',
    icon: '⛓️',
    color: 'muted-foreground',
    description: 'Você não pode se mover do lugar.',
    effect: 'Deslocamento 0. Pode realizar outras ações normalmente.',
    removal: 'Depende da causa.',
  },
  indefeso: {
    id: 'indefeso',
    name: 'Indefeso',
    icon: '🎯',
    color: 'destructive',
    description: 'Você está completamente exposto.',
    effect: 'Ataques contra você são automáticos e causam dano crítico.',
    removal: 'Sair da condição que causou indefeso.',
  },
  confuso: {
    id: 'confuso',
    name: 'Confuso',
    icon: '❓',
    color: 'sanity',
    description: 'Você não sabe distinguir amigo de inimigo.',
    effect: 'Role 1d6: 1-2 ataca aliado, 3-4 não age, 5-6 age normalmente.',
    removal: 'Teste de Vontade DT 15 ou fim do efeito.',
  },
  perturbado: {
    id: 'perturbado',
    name: 'Perturbado',
    icon: '🌀',
    color: 'sanity',
    description: 'Sua mente está abalada pelo horror.',
    effect: '-2 em todos os testes. Pode agir de forma irracional.',
    removal: 'Descanso ou reduzir SAN atual a 0.',
  },
  enlouquecendo: {
    id: 'enlouquecendo',
    name: 'Enlouquecendo',
    icon: '🤯',
    color: 'destructive',
    description: 'A loucura está tomando conta.',
    effect: 'Não controla suas ações. O Mestre decide o que você faz.',
    removal: 'Cena de descanso e tratamento psicológico.',
  },
};

export const CONDITION_CATEGORIES = {
  combat: ['sangrando', 'vulneravel', 'atordoado', 'agarrado', 'caido'],
  sensory: ['cego', 'surdo'],
  mental: ['apavorado', 'fascinado', 'confuso', 'perturbado', 'enlouquecendo'],
  physical: ['exausto', 'envenenado', 'debilitado', 'fragilizado', 'lento', 'imobilizado'],
  critical: ['inconsciente', 'morrendo', 'paralisado', 'indefeso'],
};

export function getConditionById(id: string): Condition | undefined {
  const condition = CONDITIONS[id];
  if (!condition) return undefined;
  return { ...condition };
}

export function getAllConditions(): Condition[] {
  return Object.values(CONDITIONS);
}

export function getConditionsByCategory(category: keyof typeof CONDITION_CATEGORIES): Condition[] {
  return CONDITION_CATEGORIES[category].map(id => CONDITIONS[id]).filter(Boolean) as Condition[];
}
