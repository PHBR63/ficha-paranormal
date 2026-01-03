// Ordem Paranormal RPG v1.3 - Sistema de Condições
// Baseado no livro de regras oficial - Atualizado com todas as condições e efeitos contextuais

// ==================== TIPOS DE DANO ====================

export interface DamageType {
  id: string;
  name: string;
  category: 'physical' | 'elemental' | 'paranormal';
}

export const DAMAGE_TYPES: DamageType[] = [
  // Físicos
  { id: 'balístico', name: 'Balístico', category: 'physical' },
  { id: 'corte', name: 'Corte', category: 'physical' },
  { id: 'impacto', name: 'Impacto', category: 'physical' },
  { id: 'perfuração', name: 'Perfuração', category: 'physical' },
  // Elementais
  { id: 'fogo', name: 'Fogo', category: 'elemental' },
  { id: 'frio', name: 'Frio', category: 'elemental' },
  { id: 'eletricidade', name: 'Eletricidade', category: 'elemental' },
  { id: 'químico', name: 'Químico', category: 'elemental' },
  // Paranormais
  { id: 'mental', name: 'Mental', category: 'paranormal' },
  { id: 'sangue', name: 'Sangue', category: 'paranormal' },
  { id: 'morte', name: 'Morte', category: 'paranormal' },
  { id: 'conhecimento', name: 'Conhecimento', category: 'paranormal' },
  { id: 'energia', name: 'Energia', category: 'paranormal' },
  { id: 'medo', name: 'Medo', category: 'paranormal' },
];

/**
 * Parâmetros específicos para condições que requerem informações adicionais
 * Livro Base v1.3 - Algumas condições têm efeitos variáveis
 */
export interface ConditionParams {
  /** Fragilizado: tipo de dano que causa +50% */
  damageType?: 'balístico' | 'corte' | 'impacto' | 'perfuração' | 'fogo' | 'frio' | 'eletricidade' | 'químico' | 'mental' | 'sangue' | 'morte' | 'conhecimento' | 'energia' | 'medo';
  /** Machucado: dano máximo da arma que causou a condição */
  weaponMaxDamage?: number;
  /** Machucado: nome da arma para referência */
  weaponName?: string;
  /** Envenenado: dado de dano do veneno (ex: "1d6", "2d4") */
  poisonDamage?: string;
  /** Envenenado: DT do teste de Fortitude */
  poisonDT?: number;
  /** Envenenado: nome do veneno */
  poisonName?: string;
  /** Genérico: descrição adicional do efeito */
  customEffect?: string;
}

/**
 * Interface principal para condições
 * Inclui suporte para modificadores contextuais (corpo a corpo vs distância)
 */
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
  /** Parâmetros adicionais para condições com efeitos variáveis */
  params?: ConditionParams;
  /** IDs de condições que suportam parâmetros */
  hasParams?: boolean;
}

/**
 * Interface para modificadores contextuais
 * Permite efeitos diferentes dependendo do tipo de ataque/situação
 */
export interface ContextualModifier {
  melee?: number;      // Modificador para ataques corpo a corpo
  ranged?: number;     // Modificador para ataques à distância
  attack?: number;     // Modificador para ataques em geral
  initiative?: number; // Modificador para iniciativa
  perception?: number; // Modificador para percepção
}

/**
 * Lista completa de condições do Ordem Paranormal RPG v1.3
 * Inclui todas as condições do livro básico + Desprevenido e Surpreendido
 */
export const CONDITIONS: Record<string, Omit<Condition, 'turnsRemaining'>> = {
  // === CONDIÇÕES DE COMBATE ===
  agarrado: {
    id: 'agarrado',
    name: 'Agarrado',
    icon: '🤼',
    color: 'warning',
    description: 'Você está sendo segurado por algo ou alguém.',
    effect: 'Deslocamento 0. Não pode atacar à distância. –2 Defesa.',
    removal: 'Teste de Atletismo ou Luta para se soltar.',
  },
  atordoado: {
    id: 'atordoado',
    name: 'Atordoado',
    icon: '💫',
    color: 'warning',
    description: 'Você está desorientado e incapaz de agir.',
    effect: 'Não pode realizar ações ou reações. –2 Defesa.',
    removal: 'Fim do próximo turno.',
    autoRemove: true,
  },
  caido: {
    id: 'caido',
    name: 'Caído',
    icon: '⬇️',
    color: 'muted-foreground',
    description: 'Você está no chão.',
    effect: '–5 Defesa contra ataques corpo a corpo. +5 Defesa contra ataques à distância.',
    removal: 'Gastar ação de movimento para se levantar.',
  },
  desprevenido: {
    id: 'desprevenido',
    name: 'Desprevenido',
    icon: '😶',
    color: 'warning',
    description: 'Você não está preparado para o perigo.',
    effect: 'Não pode usar reações. –5 Defesa.',
    removal: 'Perceber a ameaça ou fim do turno.',
  },
  enredado: {
    id: 'enredado',
    name: 'Enredado',
    icon: '🕸️',
    color: 'warning',
    description: 'Você está preso em algo que restringe seus movimentos.',
    effect: '–3m deslocamento. –2 em ataques e Reflexos.',
    removal: 'Teste de Atletismo ou Acrobacia, ou destruir o que prende.',
  },
  pasmo: {
    id: 'pasmo',
    name: 'Pasmo',
    icon: '😯',
    color: 'warning',
    description: 'Você ficou brevemente paralisado de surpresa.',
    effect: 'Não pode realizar ações. –2 Defesa.',
    removal: 'Fim do seu próximo turno.',
    autoRemove: true,
  },
  sangrando: {
    id: 'sangrando',
    name: 'Sangrando',
    icon: '🩸',
    color: 'health',
    description: 'Você está perdendo sangue de um ferimento grave.',
    effect: 'No início do seu turno, sofre 1d6 de dano (ignora RD).',
    removal: 'Teste de Fortitude DT 15 ou tratamento médico.',
  },
  surpreendido: {
    id: 'surpreendido',
    name: 'Surpreendido',
    icon: '😲',
    color: 'warning',
    description: 'Você foi pego de surpresa!',
    effect: 'Não age na primeira rodada. Desprevenido contra atacantes que te surpreenderam.',
    removal: 'Fim da primeira rodada de combate.',
    autoRemove: true,
  },
  vulneravel: {
    id: 'vulneravel',
    name: 'Vulnerável',
    icon: '🛡️',
    color: 'warning',
    description: 'Sua guarda está aberta.',
    effect: '–2 Defesa.',
    removal: 'Gastar uma ação de movimento para se recompor.',
  },

  // === CONDIÇÕES SENSORIAIS ===
  cego: {
    id: 'cego',
    name: 'Cego',
    icon: '👁️',
    color: 'muted-foreground',
    description: 'Você não consegue enxergar.',
    effect: 'Falha automática em testes de Percepção visual. –5 em ataques. Todos os inimigos são invisíveis para você.',
    removal: 'Depende da causa.',
  },
  surdo: {
    id: 'surdo',
    name: 'Surdo',
    icon: '👂',
    color: 'muted-foreground',
    description: 'Você não consegue ouvir.',
    effect: 'Falha automática em testes de Percepção auditiva. –2 em Iniciativa.',
    removal: 'Depende da causa.',
  },

  // === CONDIÇÕES FÍSICAS ===
  debilitado: {
    id: 'debilitado',
    name: 'Debilitado',
    icon: '📉',
    color: 'warning',
    description: 'Suas capacidades estão reduzidas.',
    effect: '–1 em todos os testes.',
    removal: 'Descanso ou cura.',
  },
  doente: {
    id: 'doente',
    name: 'Doente',
    icon: '🤒',
    color: 'warning',
    description: 'Você está sofrendo de uma enfermidade.',
    effect: '–2 em todos os testes. Descanso não recupera PV, PE ou Sanidade.',
    removal: 'Tratamento médico ou tempo.',
  },
  enjoado: {
    id: 'enjoado',
    name: 'Enjoado',
    icon: '🤢',
    color: 'warning',
    description: 'Você está com náuseas.',
    effect: 'Só pode realizar uma ação padrão por rodada.',
    removal: 'Depende da causa.',
  },
  envenenado: {
    id: 'envenenado',
    name: 'Envenenado',
    icon: '🧪',
    color: 'success',
    description: 'Veneno corre em suas veias.',
    effect: '–2 em todos os testes. Efeitos adicionais variam conforme o veneno.',
    removal: 'Teste de Fortitude, tratamento ou antídoto.',
    hasParams: true,
  },
  esmorecido: {
    id: 'esmorecido',
    name: 'Esmorecido',
    icon: '😔',
    color: 'muted-foreground',
    description: 'Você está desanimado e sem energia.',
    effect: '–2 em todos os testes de perícia.',
    removal: 'Descanso ou encorajamento.',
  },
  exausto: {
    id: 'exausto',
    name: 'Exausto',
    icon: '😫',
    color: 'warning',
    description: 'Você está completamente esgotado.',
    effect: '–2 em todos os testes. Deslocamento pela metade.',
    removal: 'Descanso completo.',
  },
  fraco: {
    id: 'fraco',
    name: 'Fraco',
    icon: '💪',
    color: 'warning',
    description: 'Sua força física está comprometida.',
    effect: '–2 em testes de Força e Luta. Capacidade de carga pela metade.',
    removal: 'Descanso ou cura.',
  },
  fragilizado: {
    id: 'fragilizado',
    name: 'Fragilizado',
    icon: '💔',
    color: 'health',
    description: 'Você está vulnerável a um tipo de dano.',
    effect: 'Vulnerável a um tipo de dano específico (sofre +50% de dano desse tipo).',
    removal: 'Depende da causa.',
    hasParams: true,
  },
  imobilizado: {
    id: 'imobilizado',
    name: 'Imóvel',
    icon: '⛓️',
    color: 'muted-foreground',
    description: 'Você não pode se mover do lugar.',
    effect: 'Deslocamento 0. Pode realizar outras ações normalmente.',
    removal: 'Depende da causa.',
  },
  lento: {
    id: 'lento',
    name: 'Lento',
    icon: '🐢',
    color: 'muted-foreground',
    description: 'Seus movimentos estão prejudicados.',
    effect: 'Deslocamento pela metade. Apenas 1 ação por turno.',
    removal: 'Depende da causa.',
  },
  machucado: {
    id: 'machucado',
    name: 'Machucado',
    icon: '🩹',
    color: 'health',
    description: 'Você está gravemente ferido e qualquer esforço piora a situação.',
    effect: 'Ao realizar qualquer ação, sofre dano igual ao dano máximo da arma que causou a condição.',
    removal: 'Descanso completo ou cura.',
    hasParams: true,
  },

  // === CONDIÇÕES MENTAIS ===
  apavorado: {
    id: 'apavorado',
    name: 'Apavorado',
    icon: '😱',
    color: 'sanity',
    description: 'O medo domina suas ações.',
    effect: 'Deve fugir da fonte do medo por todos os meios. –2 em todos os testes.',
    removal: 'Teste de Vontade DT 15 ou perder de vista a fonte.',
  },
  confuso: {
    id: 'confuso',
    name: 'Confuso',
    icon: '❓',
    color: 'sanity',
    description: 'Você não sabe distinguir amigo de inimigo.',
    effect: 'No início do turno, role 1d6: 1-2 ataca aliado mais próximo, 3-4 não faz nada, 5-6 age normalmente.',
    removal: 'Teste de Vontade DT 15 ou fim do efeito.',
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
  fascinado: {
    id: 'fascinado',
    name: 'Fascinado',
    icon: '😍',
    color: 'energy',
    description: 'Algo capturou completamente sua atenção.',
    effect: '–5 em testes de Percepção. Não pode realizar ações exceto observar a fonte.',
    removal: 'Ameaça óbvia ou fim do efeito.',
  },
  frustrado: {
    id: 'frustrado',
    name: 'Frustrado',
    icon: '😤',
    color: 'sanity',
    description: 'Você está frustrado e bloqueado mentalmente.',
    effect: 'Não pode gastar PE.',
    removal: 'Descanso ou encorajamento.',
  },
  perturbado: {
    id: 'perturbado',
    name: 'Perturbado',
    icon: '🌀',
    color: 'sanity',
    description: 'Sua mente está abalada pelo horror.',
    effect: '–2 em todos os testes. Pode agir de forma irracional.',
    removal: 'Descanso ou reduzir SAN atual a 0.',
  },

  // === CONDIÇÕES CRÍTICAS ===
  inconsciente: {
    id: 'inconsciente',
    name: 'Inconsciente',
    icon: '💤',
    color: 'muted-foreground',
    description: 'Você está completamente fora de combate.',
    effect: 'Não pode realizar nenhuma ação. Defesa 5. Indefeso.',
    removal: 'Recuperar ao menos 1 PV ou ser acordado.',
  },
  indefeso: {
    id: 'indefeso',
    name: 'Indefeso',
    icon: '🎯',
    color: 'destructive',
    description: 'Você está completamente exposto.',
    effect: 'Ataques contra você são acertos automáticos e causam dano crítico.',
    removal: 'Sair da condição que causou indefeso.',
  },
  morrendo: {
    id: 'morrendo',
    name: 'Morrendo',
    icon: '💀',
    color: 'destructive',
    description: 'Você está à beira da morte.',
    effect: 'Inconsciente. Contador de 3 rodadas até morrer. Dano adicional reduz 1 rodada.',
    removal: 'Teste de Medicina DT 20 por aliado ou recuperar 1 PV.',
  },
  paralisado: {
    id: 'paralisado',
    name: 'Paralisado',
    icon: '🧊',
    color: 'accent',
    description: 'Você não consegue se mover.',
    effect: 'Não pode realizar ações físicas. Defesa 5. Indefeso.',
    removal: 'Depende da causa.',
  },

  // === CONDIÇÕES DE RITUAIS ===
  'velocidade-mortal-inverso': {
    id: 'velocidade-mortal-inverso',
    name: 'Velocidade Mortal (Inverso)',
    icon: '⏱️',
    color: 'death',
    description: 'Você está ligado a um alvo através do ritual Velocidade Mortal no modo inverso.',
    effect: 'Você recebe metade de todo o dano que o alvo receberia. O dano é aplicado a você antes de ser reduzido no alvo.',
    removal: 'Encerrar a sustentação do ritual.',
  },
  'velocidade-mortal-buff': {
    id: 'velocidade-mortal-buff',
    name: 'Velocidade Mortal',
    icon: '⚡',
    color: 'death',
    description: 'Você está sob o efeito do ritual Velocidade Mortal.',
    effect: 'Pode realizar uma ação de movimento adicional por turno. Esta ação não pode ser usada para conjurar rituais.',
    removal: 'Fim da sustentação do ritual.',
  },
  'velocidade-mortal-discente': {
    id: 'velocidade-mortal-discente',
    name: 'Velocidade Mortal (Discente)',
    icon: '⚡',
    color: 'death',
    description: 'Você está sob o efeito do ritual Velocidade Mortal com aprimoramento Discente.',
    effect: 'Pode realizar uma ação padrão adicional por turno.',
    removal: 'Fim da sustentação do ritual.',
  },
};

/**
 * Modificadores de defesa contextuais por condição
 * Usado para condições como Caído que têm efeitos diferentes por tipo de ataque
 */
export const CONTEXTUAL_DEFENSE_MODIFIERS: Record<string, ContextualModifier> = {
  caido: {
    melee: -5,
    ranged: +5,
  },
  desprevenido: {
    melee: -5,
    ranged: -5,
  },
  surpreendido: {
    melee: -5,
    ranged: -5,
  },
};

/**
 * Modificadores de ataque por condição
 */
export const ATTACK_MODIFIERS: Record<string, number> = {
  cego: -5,
  enredado: -2,
};

/**
 * Modificadores de iniciativa por condição
 */
export const INITIATIVE_MODIFIERS: Record<string, number> = {
  surdo: -2,
};

/**
 * Modificadores gerais de teste por condição (acumulam)
 */
export const TEST_MODIFIERS: Record<string, number> = {
  apavorado: -2,
  debilitado: -1,
  doente: -2,
  envenenado: -2,
  esmorecido: -2,
  exausto: -2,
  perturbado: -2,
};

/**
 * Categorias de condições para organização na UI
 */
export const CONDITION_CATEGORIES = {
  combat: ['agarrado', 'atordoado', 'caido', 'desprevenido', 'enredado', 'pasmo', 'sangrando', 'surpreendido', 'vulneravel'],
  sensory: ['cego', 'surdo'],
  mental: ['apavorado', 'confuso', 'enlouquecendo', 'fascinado', 'frustrado', 'perturbado'],
  physical: ['debilitado', 'doente', 'enjoado', 'envenenado', 'esmorecido', 'exausto', 'fraco', 'fragilizado', 'imobilizado', 'lento', 'machucado'],
  critical: ['inconsciente', 'indefeso', 'morrendo', 'paralisado'],
  ritual: ['velocidade-mortal-inverso', 'velocidade-mortal-buff', 'velocidade-mortal-discente'],
};

/**
 * Obtém uma condição pelo ID
 */
export function getConditionById(id: string): Condition | undefined {
  const condition = CONDITIONS[id];
  if (!condition) return undefined;
  return { ...condition };
}

/**
 * Obtém todas as condições
 */
export function getAllConditions(): Condition[] {
  return Object.values(CONDITIONS);
}

/**
 * Obtém condições por categoria
 */
export function getConditionsByCategory(category: keyof typeof CONDITION_CATEGORIES): Condition[] {
  return CONDITION_CATEGORIES[category].map(id => CONDITIONS[id]).filter(Boolean) as Condition[];
}

/**
 * Calcula o modificador de defesa contextual
 */
export function getContextualDefenseModifier(conditionId: string, attackType: 'melee' | 'ranged'): number {
  const modifier = CONTEXTUAL_DEFENSE_MODIFIERS[conditionId];
  if (!modifier) return 0;
  return modifier[attackType] ?? 0;
}

/**
 * Calcula o modificador de ataque por condições
 */
export function getAttackModifierFromConditions(conditions: string[]): number {
  let modifier = 0;
  for (const conditionId of conditions) {
    if (ATTACK_MODIFIERS[conditionId]) {
      modifier += ATTACK_MODIFIERS[conditionId];
    }
  }
  return modifier;
}

/**
 * Calcula o modificador de iniciativa por condições
 */
export function getInitiativeModifierFromConditions(conditions: string[]): number {
  let modifier = 0;
  for (const conditionId of conditions) {
    if (INITIATIVE_MODIFIERS[conditionId]) {
      modifier += INITIATIVE_MODIFIERS[conditionId];
    }
  }
  return modifier;
}

/**
 * Calcula o modificador de teste por condições
 */
export function getTestModifierFromConditions(conditions: string[]): number {
  let modifier = 0;
  for (const conditionId of conditions) {
    if (TEST_MODIFIERS[conditionId]) {
      modifier += TEST_MODIFIERS[conditionId];
    }
  }
  return modifier;
}

/**
 * Calcula o modificador de defesa total
 */
export function getTotalDefenseModifier(conditions: string[]): number {
  let modifier = 0;
  
  for (const conditionId of conditions) {
    const condition = CONDITIONS[conditionId];
    if (!condition) continue;
    
    switch (conditionId) {
      case 'agarrado':
      case 'atordoado':
      case 'pasmo':
      case 'vulneravel':
        modifier -= 2;
        break;
      case 'desprevenido':
        modifier -= 5;
        break;
    }
  }
  
  return modifier;
}

/**
 * Retorna penalidades de ação
 */
export function getActionPenalties(conditions: string[]): { canAct: boolean; canReact: boolean; actionsReduced: boolean } {
  let canAct = true;
  let canReact = true;
  let actionsReduced = false;
  
  for (const conditionId of conditions) {
    switch (conditionId) {
      case 'atordoado':
      case 'inconsciente':
      case 'morrendo':
      case 'paralisado':
        canAct = false;
        canReact = false;
        break;
      case 'desprevenido':
        canReact = false;
        break;
      case 'enjoado':
      case 'lento':
        actionsReduced = true;
        break;
    }
  }
  
  return { canAct, canReact, actionsReduced };
}

/**
 * Verifica se tem uma condição específica
 */
export function hasCondition(conditions: string[], conditionId: string): boolean {
  return conditions.includes(conditionId);
}

/**
 * Verifica se pode realizar ações
 */
export function canPerformActions(conditions: string[]): boolean {
  const incapacitating = ['atordoado', 'inconsciente', 'morrendo', 'paralisado', 'enlouquecendo'];
  return !conditions.some(c => incapacitating.includes(c));
}

/**
 * Verifica se está incapacitado
 */
export function isIncapacitated(conditions: string[]): boolean {
  return !canPerformActions(conditions);
}

/**
 * Calcula modificador de defesa com stacking
 */
export function getStackingDefenseModifier(conditions: string[]): number {
  let total = 0;
  
  const defenseModifiers: Record<string, number> = {
    'agarrado': -2,
    'atordoado': -2,
    'pasmo': -2,
    'vulneravel': -2,
    'desprevenido': -5,
  };
  
  for (const conditionId of conditions) {
    if (defenseModifiers[conditionId]) {
      total += defenseModifiers[conditionId];
    }
  }
  
  return total;
}
