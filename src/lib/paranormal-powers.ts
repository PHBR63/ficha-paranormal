/**
 * Ordem Paranormal RPG - Suplemento Sobrevivendo ao Horror
 * Sistema de Poderes Paranormais
 * 
 * Poderes Paranormais são habilidades passivas ligadas a elementos do Outro Lado.
 * Diferem de rituais por serem permanentes e não consumirem PE para ativar.
 */

// Tipos de elementos paranormais
export type ParanormalElement = 'sangue' | 'morte' | 'conhecimento' | 'energia' | 'medo';

// Interface para efeitos dos poderes
export interface PowerEffect {
  type: 'stat_bonus' | 'reroll' | 'immunity' | 'resistance' | 'damage_bonus' | 'special';
  target?: string; // ex: 'pv_max', 'san_max', 'initiative', 'defense'
  value?: number;
  description: string;
}

// Interface principal do Poder Paranormal
export interface ParanormalPower {
  id: string;
  name: string;
  element: ParanormalElement;
  description: string;
  effect: PowerEffect;
  sanityLoss?: number; // Perda permanente de SAN ao adquirir
  requirement?: string; // Requisito para adquirir
}

// ==================== PODERES PARANORMAIS ====================

export const PARANORMAL_POWERS: ParanormalPower[] = [
  // === PODERES DE SANGUE ===
  {
    id: 'sangue-de-ferro',
    name: 'Sangue de Ferro',
    element: 'sangue',
    description: 'Seu sangue carrega uma vitalidade sobrenatural. Você é mais resistente, mas sua mente sofre com a conexão ao Outro Lado.',
    effect: {
      type: 'stat_bonus',
      target: 'pv_max',
      value: 5,
      description: '+5 PV máximo, -5 SAN máxima'
    },
    sanityLoss: 5,
  },
  {
    id: 'instinto-selvagem',
    name: 'Instinto Selvagem',
    element: 'sangue',
    description: 'Seus sentidos primais foram aguçados pelo paranormal. Você reage mais rápido e nunca é pego de surpresa.',
    effect: {
      type: 'stat_bonus',
      target: 'initiative',
      value: 2,
      description: '+2 em Iniciativa e não pode ser surpreendido'
    },
  },
  {
    id: 'regeneracao-menor',
    name: 'Regeneração Menor',
    element: 'sangue',
    description: 'Ferimentos leves se curam rapidamente. No início de cada turno fora de combate, você recupera 1 PV.',
    effect: {
      type: 'special',
      description: 'Recupera 1 PV por turno fora de combate'
    },
  },

  // === PODERES DE MORTE ===
  {
    id: 'toque-necrotico',
    name: 'Toque Necrótico',
    element: 'morte',
    description: 'Suas mãos carregam a essência da morte. Seus ataques desarmados drenam a vida do alvo.',
    effect: {
      type: 'damage_bonus',
      target: 'unarmed',
      value: 4,
      description: 'Ataques desarmados causam +1d4 dano necrótico'
    },
  },
  {
    id: 'visao-do-alem',
    name: 'Visão do Além',
    element: 'morte',
    description: 'Você pode ver através do véu entre os mundos. Enxerga criaturas e entidades invisíveis do Outro Lado.',
    effect: {
      type: 'special',
      description: 'Enxerga criaturas invisíveis do Outro Lado'
    },
  },
  {
    id: 'aura-mortuaria',
    name: 'Aura Mortuária',
    element: 'morte',
    description: 'Uma aura de morte emana de você. Mortos-vivos não o atacam automaticamente e você recebe +2 em interações com eles.',
    effect: {
      type: 'special',
      description: 'Mortos-vivos são neutros e +2 em testes sociais com eles'
    },
  },

  // === PODERES DE CONHECIMENTO ===
  {
    id: 'pre-cognicao',
    name: 'Pré-cognição',
    element: 'conhecimento',
    description: 'Você vislumbra fragmentos do futuro. Não pode ser pego desprevenido e é imune à condição Surpreso.',
    effect: {
      type: 'immunity',
      target: 'surprised',
      description: 'Imune a Desprevenido e Surpreso'
    },
  },
  {
    id: 'mente-expandida',
    name: 'Mente Expandida',
    element: 'conhecimento',
    description: 'Sua consciência se expande além do normal. Você pode se comunicar telepaticamente com aliados em alcance curto.',
    effect: {
      type: 'special',
      description: 'Comunicação telepática em alcance curto (9m)'
    },
  },
  {
    id: 'memoria-perfeita',
    name: 'Memória Perfeita',
    element: 'conhecimento',
    description: 'Você nunca esquece nada que viu ou ouviu. Recebe +2 em testes de Investigação e Ciências.',
    effect: {
      type: 'stat_bonus',
      target: 'investigation',
      value: 2,
      description: '+2 em Investigação e Ciências'
    },
  },

  // === PODERES DE ENERGIA ===
  {
    id: 'sorte',
    name: 'Sorte',
    element: 'energia',
    description: 'A energia do Outro Lado manipula a probabilidade a seu favor. Uma vez por teste, pode re-rolar resultado 1.',
    effect: {
      type: 'reroll',
      value: 1,
      description: 'Pode re-rolar resultado 1 uma vez por teste'
    },
  },
  {
    id: 'resistencia-paranormal',
    name: 'Resistência Paranormal',
    element: 'energia',
    description: 'Seu corpo desenvolveu resistência às energias do Outro Lado. Recebe RD 2 contra dano paranormal.',
    effect: {
      type: 'resistance',
      target: 'paranormal',
      value: 2,
      description: 'RD 2 contra dano paranormal'
    },
  },
  {
    id: 'conducao-energetica',
    name: 'Condução Energética',
    element: 'energia',
    description: 'Você canaliza energia elemental através do seu corpo. Pode gastar 1 PE para adicionar 1d6 de dano elemental a um ataque.',
    effect: {
      type: 'special',
      description: 'Gastar 1 PE para +1d6 dano elemental em um ataque'
    },
  },

  // === PODERES DE MEDO ===
  {
    id: 'medo-contagiante',
    name: 'Medo Contagiante',
    element: 'medo',
    description: 'Seu medo se espalha para os outros. Alvos de seus rituais de Medo sofrem -2 adicional em seus testes.',
    effect: {
      type: 'stat_bonus',
      target: 'fear_rituals',
      value: -2,
      description: 'Alvos de rituais de Medo sofrem -2 extra'
    },
  },
  {
    id: 'aura-de-terror',
    name: 'Aura de Terror',
    element: 'medo',
    description: 'Uma aura de medo emana de você. Inimigos em alcance curto sofrem -1 em ataques contra você.',
    effect: {
      type: 'stat_bonus',
      target: 'enemy_attack',
      value: -1,
      description: 'Inimigos em alcance curto sofrem -1 em ataques contra você'
    },
  },
  {
    id: 'alimentar-se-do-medo',
    name: 'Alimentar-se do Medo',
    element: 'medo',
    description: 'Você absorve o medo alheio. Quando uma criatura em alcance curto falha em um teste de Vontade contra medo, você recupera 1 PE.',
    effect: {
      type: 'special',
      description: 'Recupera 1 PE quando criatura próxima falha teste contra medo'
    },
  },
];

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Retorna todos os poderes de um elemento específico
 */
export function getPowersByElement(element: ParanormalElement): ParanormalPower[] {
  return PARANORMAL_POWERS.filter(power => power.element === element);
}

/**
 * Retorna um poder pelo ID
 */
export function getPowerById(id: string): ParanormalPower | undefined {
  return PARANORMAL_POWERS.find(power => power.id === id);
}

/**
 * Calcula modificadores de stats baseado nos poderes ativos
 */
export function calculatePowerModifiers(powerIds: string[]): Record<string, number> {
  const modifiers: Record<string, number> = {};
  
  for (const id of powerIds) {
    const power = getPowerById(id);
    if (power && power.effect.type === 'stat_bonus' && power.effect.target && power.effect.value) {
      modifiers[power.effect.target] = (modifiers[power.effect.target] || 0) + power.effect.value;
    }
  }
  
  return modifiers;
}

/**
 * Verifica se um personagem pode re-rolar resultado 1 (poder Sorte)
 */
export function hasRerollOne(powerIds: string[]): boolean {
  return powerIds.includes('sorte');
}

/**
 * Verifica se um personagem é imune a ser surpreendido (poder Pré-cognição)
 */
export function isImmuneSurprised(powerIds: string[]): boolean {
  return powerIds.includes('pre-cognicao');
}

/**
 * Retorna a descrição formatada de todos os efeitos ativos
 */
export function getActivePowerEffects(powerIds: string[]): string[] {
  const effects: string[] = [];
  
  for (const id of powerIds) {
    const power = getPowerById(id);
    if (power) {
      effects.push(`${power.name}: ${power.effect.description}`);
    }
  }
  
  return effects;
}

// Ícones por elemento para a UI
export const ELEMENT_ICONS: Record<ParanormalElement, string> = {
  sangue: '🩸',
  morte: '💀',
  conhecimento: '📚',
  energia: '⚡',
  medo: '👁️',
};

// Cores por elemento para a UI
export const ELEMENT_COLORS: Record<ParanormalElement, string> = {
  sangue: 'text-red-500',
  morte: 'text-purple-500',
  conhecimento: 'text-blue-500',
  energia: 'text-yellow-500',
  medo: 'text-green-500',
};
