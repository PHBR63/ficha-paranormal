/**
 * Dados das Condições Oficiais - Ordem Paranormal RPG
 * 
 * Baseado no Livro de Regras v1.3
 * Cada condição possui seus efeitos mecânicos conforme o sistema oficial.
 */

import { BASE_CONDITION_TEXT } from './conditions/base-condition-rules';

export type ConditionCategory = 'mental' | 'physical' | 'movement' | 'sensory' | 'combat' | 'special';

export interface ConditionDefinition {
  id: string;
  name: string;
  description: string;
  mechanicalEffect: string;
  category: ConditionCategory;
  icon: string;
  color: string;
  // Se a condição pode ser acumulada
  stackable: boolean;
  // Condições que esta remove ou impede
  removes?: string[];
  // Condições que impedem esta
  blockedBy?: string[];
  // Se causa outras condições
  causes?: string[];
}

/**
 * Condições oficiais do Ordem Paranormal RPG
 */
export const CONDITIONS: Record<string, ConditionDefinition> = {
  // === CONDIÇÕES MENTAIS ===
  abalado: {
    id: 'abalado',
    name: 'Abalado',
    description: 'Você está assustado e inseguro. Pode agir normalmente, mas sofre penalidades.',
    mechanicalEffect: '–1 em testes.',
    category: 'mental',
    icon: 'brain',
    color: 'yellow',
    stackable: false,
  },
  
  apavorado: {
    id: 'apavorado',
    name: 'Apavorado',
    description: 'Dominado pelo medo, você foge da fonte de pavor.',
    mechanicalEffect: 'Foge da fonte de medo. –2 em testes.',
    category: 'mental',
    icon: 'ghost',
    color: 'purple',
    stackable: false,
    removes: ['abalado'],
  },
  
  atordoado: {
    id: 'atordoado',
    name: 'Atordoado',
    description: 'Você está tonto e confuso, mal conseguindo reagir.',
    mechanicalEffect: 'Não pode fazer ações. –5 em Defesa.',
    category: 'mental',
    icon: 'zap',
    color: 'orange',
    stackable: false,
  },
  
  confuso: {
    id: 'confuso',
    name: 'Confuso',
    description: 'Sua mente está bagunçada e você age de forma errática.',
    mechanicalEffect: 'Role 1d6 no início do turno para determinar ação.',
    category: 'mental',
    icon: 'shuffle',
    color: 'pink',
    stackable: false,
  },
  
  fascinado: {
    id: 'fascinado',
    name: 'Fascinado',
    description: 'Você está encantado e distraído por algo.',
    mechanicalEffect: '–5 em Percepção. Não pode agir contra a fonte.',
    category: 'mental',
    icon: 'sparkles',
    color: 'cyan',
    stackable: false,
  },
  
  pasmo: {
    id: 'pasmo',
    name: 'Pasmo',
    description: 'Você está surpreso e não consegue reagir.',
    mechanicalEffect: 'Não pode fazer ações de reação até seu próximo turno.',
    category: 'mental',
    icon: 'alert-circle',
    color: 'slate',
    stackable: false,
  },
  
  // === CONDIÇÕES FÍSICAS ===
  debilitado: {
    id: 'debilitado',
    name: 'Debilitado',
    description: 'Você está muito fraco, mal conseguindo se mover.',
    mechanicalEffect: 'Deslocamento reduzido pela metade. –2 em ataques.',
    category: 'physical',
    icon: 'battery-low',
    color: 'amber',
    stackable: false,
  },
  
  enjoado: {
    id: 'enjoado',
    name: 'Enjoado',
    description: 'Você está nauseado e pode vomitar a qualquer momento.',
    mechanicalEffect: 'Só pode realizar uma ação padrão por turno.',
    category: 'physical',
    icon: 'frown',
    color: 'green',
    stackable: false,
  },
  
  exausto: {
    id: 'exausto',
    name: 'Exausto',
    description: 'Você está completamente esgotado física e mentalmente.',
    mechanicalEffect: 'Deslocamento 1,5m. –5 em testes. Não pode correr.',
    category: 'physical',
    icon: 'battery-warning',
    color: 'red',
    stackable: false,
    removes: ['fatigado'],
  },
  
  fatigado: {
    id: 'fatigado',
    name: 'Fatigado',
    description: 'Você está cansado e precisa de descanso.',
    mechanicalEffect: '–2 em testes. Não pode correr.',
    category: 'physical',
    icon: 'moon',
    color: 'blue',
    stackable: false,
  },
  
  fraco: {
    id: 'fraco',
    name: 'Fraco',
    description: 'Você está enfraquecido, com pouca força física.',
    mechanicalEffect: '–2 em testes de Força e dano corpo a corpo.',
    category: 'physical',
    icon: 'arrow-down',
    color: 'gray',
    stackable: false,
  },
  
  inconsciente: {
    id: 'inconsciente',
    name: 'Inconsciente',
    description: 'Você está desmaiado e completamente indefeso.',
    mechanicalEffect: 'Indefeso. Não pode agir.',
    category: 'physical',
    icon: 'eye-off',
    color: 'slate',
    stackable: false,
    causes: ['indefeso'],
  },
  
  machucado: {
    id: 'machucado',
    name: 'Machucado',
    description: 'Você sofreu ferimentos que o deixam vulnerável.',
    mechanicalEffect: '–2 em Defesa e testes de resistência.',
    category: 'physical',
    icon: 'heart-crack',
    color: 'red',
    stackable: false,
  },
  
  sangrando: {
    id: 'sangrando',
    name: 'Sangrando',
    description: 'Você está perdendo sangue e fica mais fraco a cada momento.',
    mechanicalEffect: 'Perde 1d6 PV no início de cada turno.',
    category: 'physical',
    icon: 'droplets',
    color: 'red',
    stackable: true,
  },
  
  // === CONDIÇÕES DE MOVIMENTO ===
  agarrado: {
    id: 'agarrado',
    name: 'Agarrado',
    description: 'Você está sendo segurado por uma criatura ou efeito.',
    mechanicalEffect: 'Desprevenido. Imóvel. –2 em ataques.',
    category: 'movement',
    icon: 'grip',
    color: 'orange',
    stackable: false,
    causes: ['desprevenido', 'imovel'],
  },
  
  caido: {
    id: 'caido',
    name: 'Caído',
    description: 'Você está no chão, em desvantagem.',
    mechanicalEffect: '–5 em ataques corpo a corpo. Atacantes adjacentes têm +5.',
    category: 'movement',
    icon: 'person-standing',
    color: 'brown',
    stackable: false,
  },
  
  enredado: {
    id: 'enredado',
    name: 'Enredado',
    description: 'Você está preso em algo que limita seus movimentos.',
    mechanicalEffect: 'Lento. –2 em ataques e Defesa.',
    category: 'movement',
    icon: 'link',
    color: 'emerald',
    stackable: false,
    causes: ['lento'],
  },
  
  imovel: {
    id: 'imovel',
    name: 'Imóvel',
    description: 'Você não pode se mover de seu lugar.',
    mechanicalEffect: 'Deslocamento 0.',
    category: 'movement',
    icon: 'anchor',
    color: 'stone',
    stackable: false,
  },
  
  lento: {
    id: 'lento',
    name: 'Lento',
    description: 'Seus movimentos estão lentos e pesados.',
    mechanicalEffect: 'Deslocamento reduzido pela metade. Só pode 1 ação por turno.',
    category: 'movement',
    icon: 'snail',
    color: 'blue',
    stackable: false,
  },
  
  paralisado: {
    id: 'paralisado',
    name: 'Paralisado',
    description: 'Você não pode mover seu corpo de forma alguma.',
    mechanicalEffect: 'Indefeso. Não pode agir fisicamente.',
    category: 'movement',
    icon: 'lock',
    color: 'purple',
    stackable: false,
    causes: ['indefeso'],
  },
  
  // === CONDIÇÕES SENSORIAIS ===
  cego: {
    id: 'cego',
    name: 'Cego',
    description: 'Você não consegue enxergar nada.',
    mechanicalEffect: '–5 em testes que dependem de visão. 50% chance de errar ataques.',
    category: 'sensory',
    icon: 'eye-off',
    color: 'gray',
    stackable: false,
  },
  
  surdo: {
    id: 'surdo',
    name: 'Surdo',
    description: 'Você não consegue ouvir nada.',
    mechanicalEffect: '–5 em Iniciativa e Percepção.',
    category: 'sensory',
    icon: 'ear-off',
    color: 'gray',
    stackable: false,
  },
  
  // === CONDIÇÕES DE COMBATE ===
  desprevenido: {
    id: 'desprevenido',
    name: 'Desprevenido',
    description: 'Você está distraído ou não viu o ataque chegando.',
    mechanicalEffect: '–5 em Defesa.',
    category: 'combat',
    icon: 'shield-off',
    color: 'red',
    stackable: false,
  },
  
  indefeso: {
    id: 'indefeso',
    name: 'Indefeso',
    description: 'Você está completamente vulnerável a ataques.',
    mechanicalEffect: 'Defesa 5. Ataques corpo a corpo são críticos automáticos.',
    category: 'combat',
    icon: 'shield-x',
    color: 'red',
    stackable: false,
  },
  
  vulneravel: {
    id: 'vulneravel',
    name: 'Vulnerável',
    description: 'Você está exposto a um tipo específico de dano.',
    mechanicalEffect: 'Sofre +50% de dano de uma fonte específica.',
    category: 'combat',
    icon: 'shield-alert',
    color: 'orange',
    stackable: true,
  },
  
  // === CONDIÇÕES ESPECIAIS ===
  em_chamas: {
    id: 'em_chamas',
    name: 'Em Chamas',
    description: 'Você está pegando fogo!',
    mechanicalEffect: 'Sofre 1d6 de dano de fogo no início do turno. Ação padrão para apagar.',
    category: 'special',
    icon: 'flame',
    color: 'orange',
    stackable: false,
  },
  
  envenenado: {
    id: 'envenenado',
    name: 'Envenenado',
    description: 'Um veneno está correndo em suas veias.',
    mechanicalEffect: '–2 em testes. Pode ter efeitos adicionais dependendo do veneno.',
    category: 'special',
    icon: 'skull',
    color: 'green',
    stackable: true,
  },
  
  petrificado: {
    id: 'petrificado',
    name: 'Petrificado',
    description: 'Você foi transformado em pedra.',
    mechanicalEffect: 'Indefeso. Não pode agir. Resistência +10.',
    category: 'special',
    icon: 'mountain',
    color: 'stone',
    stackable: false,
    causes: ['indefeso'],
  },
  
  possesso: {
    id: 'possesso',
    name: 'Possesso',
    description: 'Uma entidade controla seu corpo.',
    mechanicalEffect: 'Controlado pelo mestre ou entidade.',
    category: 'special',
    icon: 'ghost',
    color: 'purple',
    stackable: false,
  },
};

/**
 * Lista de todas as condições ordenadas por categoria
 */
for (const [id, text] of Object.entries(BASE_CONDITION_TEXT)) {
  if (CONDITIONS[id]) CONDITIONS[id].mechanicalEffect = text;
}
CONDITIONS.machucado.description = BASE_CONDITION_TEXT.machucado;
CONDITIONS.vulneravel.description = 'Sua defesa está comprometida.';
CONDITIONS.vulneravel.stackable = false;

export const CONDITION_LIST = Object.values(CONDITIONS);

/**
 * Condições agrupadas por categoria
 */
export const CONDITIONS_BY_CATEGORY: Record<ConditionCategory, ConditionDefinition[]> = {
  mental: CONDITION_LIST.filter(c => c.category === 'mental'),
  physical: CONDITION_LIST.filter(c => c.category === 'physical'),
  movement: CONDITION_LIST.filter(c => c.category === 'movement'),
  sensory: CONDITION_LIST.filter(c => c.category === 'sensory'),
  combat: CONDITION_LIST.filter(c => c.category === 'combat'),
  special: CONDITION_LIST.filter(c => c.category === 'special'),
};

/**
 * Labels das categorias
 */
export const CATEGORY_LABELS: Record<ConditionCategory, string> = {
  mental: 'Mental',
  physical: 'Física',
  movement: 'Movimento',
  sensory: 'Sensorial',
  combat: 'Combate',
  special: 'Especial',
};

/**
 * Busca uma condição pelo ID
 */
export function getConditionById(id: string): ConditionDefinition | undefined {
  return CONDITIONS[id];
}

/**
 * Busca condições pelo nome (parcial)
 */
export function searchConditions(query: string): ConditionDefinition[] {
  const lowerQuery = query.toLowerCase();
  return CONDITION_LIST.filter(c => 
    c.name.toLowerCase().includes(lowerQuery) ||
    c.description.toLowerCase().includes(lowerQuery)
  );
}
