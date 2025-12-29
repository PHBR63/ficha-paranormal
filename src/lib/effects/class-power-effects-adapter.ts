// =====================================================
// Adaptador de Efeitos de Poderes de Classe
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Converte poderes de classe (Combatente, Especialista, Ocultista)
// para o formato UnifiedEffect, com foco em poderes que afetam rituais.
//
// PODERES MAPEADOS:
// - Especialista em Elemento (+2 DT rituais do elemento)
// - Mestre em Elemento (-1 PE rituais do elemento)
// - Ritual Potente (+Intelecto em dano/cura de rituais)
// - Ritual Predileto (-1 PE no ritual escolhido)
// - Tatuagem Ritualística (-1 PE rituais alcance pessoal)
//

import type { UnifiedEffect, EffectMechanics, AttributeType } from '../unified-effects-engine';

// =====================================================
// Tipos
// =====================================================

/**
 * Poder de classe ativo com escolhas do jogador
 */
export interface ActiveClassPower {
  id: string;                      // ID do poder (ex: 'especialista-em-elemento')
  name: string;                    // Nome do poder
  classId: string;                 // Classe do poder
  nex: number;                     // NEX em que foi adquirido
  choices?: {
    element?: string;              // Elemento escolhido (Sangue, Morte, etc.)
    ritual?: string;               // Ritual escolhido (para Ritual Predileto)
    attribute?: string;            // Atributo escolhido
    skill?: string;                // Perícia escolhida
  };
}

/**
 * Configuração de efeito de poder de classe
 */
interface ClassPowerEffectConfig {
  id: string;
  name: string;
  description: string;
  getEffects: (
    power: ActiveClassPower, 
    attributes: Record<AttributeType, number>
  ) => Partial<EffectMechanics>;
  requiresChoice?: boolean;
  choiceType?: 'element' | 'ritual' | 'attribute' | 'skill';
}

// =====================================================
// Mapeamento de Poderes de Classe para Efeitos
// =====================================================

const CLASS_POWER_EFFECT_CONFIGS: Record<string, ClassPowerEffectConfig> = {
  // === PODERES DE OCULTISTA COM EFEITOS EM RITUAIS ===
  
  'especialista-em-elemento': {
    id: 'especialista-em-elemento',
    name: 'Especialista em Elemento',
    description: '+2 na DT para resistir aos seus rituais do elemento escolhido',
    requiresChoice: true,
    choiceType: 'element',
    getEffects: (power, _attributes) => {
      const element = power.choices?.element;
      if (!element) return {};
      
      return {
        ritualDTBonusByElement: { [element]: 2 },
      };
    },
  },
  
  'mestre-em-elemento': {
    id: 'mestre-em-elemento',
    name: 'Mestre em Elemento',
    description: '-1 PE para lançar rituais do elemento escolhido',
    requiresChoice: true,
    choiceType: 'element',
    getEffects: (power, _attributes) => {
      const element = power.choices?.element;
      if (!element) return {};
      
      return {
        ritualPEReductionByElement: { [element]: 1 },
      };
    },
  },
  
  'ritual-potente': {
    id: 'ritual-potente',
    name: 'Ritual Potente',
    description: 'Soma Intelecto nas rolagens de dano ou efeitos de cura de rituais',
    requiresChoice: false,
    getEffects: (_power, _attributes) => {
      return {
        ritualDamageAttributeBonus: 'intellect',
      };
    },
  },
  
  'ritual-predileto': {
    id: 'ritual-predileto',
    name: 'Ritual Predileto',
    description: '-1 PE no custo do ritual escolhido',
    requiresChoice: true,
    choiceType: 'ritual',
    getEffects: (power, _attributes) => {
      const ritual = power.choices?.ritual;
      if (!ritual) return {};
      
      // Retorna redução específica para o ritual - 
      // A aplicação específica será feita no modal de ritual
      return {
        ritualPEReduction: 1,
        specialEffects: [`Ritual Predileto: -1 PE em ${ritual}`],
      };
    },
  },
  
  'tatuagem-ritualistica': {
    id: 'tatuagem-ritualistica',
    name: 'Tatuagem Ritualística',
    description: '-1 PE em rituais de alcance pessoal que têm você como alvo',
    requiresChoice: false,
    getEffects: (_power, _attributes) => {
      return {
        ritualPEReductionByRange: { 'pessoal': 1 },
      };
    },
  },
  
  // === PODERES COM BÔNUS DE PERÍCIA ===
  
  'envolto-em-misterio': {
    id: 'envolto-em-misterio',
    name: 'Envolto em Mistério',
    description: '+5 em Enganação e Intimidação contra não-treinados em Ocultismo',
    requiresChoice: false,
    getEffects: (_power, _attributes) => {
      return {
        skillBonus: {
          'enganacao': 5,
          'intimidacao': 5,
        },
        conditionalNote: 'Contra pessoas não treinadas em Ocultismo',
      };
    },
  },
  
  'identificacao-paranormal': {
    id: 'identificacao-paranormal',
    name: 'Identificação Paranormal',
    description: '+10 em Ocultismo para identificar criaturas, objetos ou rituais paranormais',
    requiresChoice: false,
    getEffects: (_power, _attributes) => {
      return {
        skillBonus: {
          'ocultismo': 10,
        },
        conditionalNote: 'Para identificar criaturas, objetos ou rituais paranormais',
      };
    },
  },
  
  // === PODERES DE COMBATE (COMBATENTE) ===
  
  'ataque-especial-combatente': {
    id: 'ataque-especial-combatente',
    name: 'Ataque Especial',
    description: 'Ao fazer um ataque, pode gastar 1 PE para +5 na rolagem ou +1d8 no dano',
    requiresChoice: false,
    getEffects: (_power, _attributes) => {
      return {
        // Efeito ativável - será tratado pelo useActivatedEffects
        specialEffects: ['Ataque Especial: +1 PE → +5 ataque OU +1d8 dano'],
      };
    },
  },
  
  'golpe-brutal': {
    id: 'golpe-brutal',
    name: 'Golpe Brutal',
    description: 'Aumenta margem de ameaça corpo a corpo em +2',
    requiresChoice: false,
    getEffects: (_power, _attributes) => {
      return {
        criticalMarginBonus: 2,
        conditionalNote: 'Apenas ataques corpo a corpo',
      };
    },
  },
  
  'golpe-pesado': {
    id: 'golpe-pesado',
    name: 'Golpe Pesado',
    description: '+2 no dano corpo a corpo',
    requiresChoice: false,
    getEffects: (_power, _attributes) => {
      return {
        meleeDamageBonus: 2,
      };
    },
  },
  
  'golpe-demolidor': {
    id: 'golpe-demolidor',
    name: 'Golpe Demolidor',
    description: '+4 no dano corpo a corpo',
    requiresChoice: false,
    getEffects: (_power, _attributes) => {
      return {
        meleeDamageBonus: 4,
      };
    },
  },
  
  // === PODERES DE COMBATE (ESPECIALISTA) ===
  
  'mira-firme': {
    id: 'mira-firme',
    name: 'Mira Firme',
    description: '+2 no dano à distância',
    requiresChoice: false,
    getEffects: (_power, _attributes) => {
      return {
        rangedDamageBonus: 2,
      };
    },
  },
  
  'balistica-avancada': {
    id: 'balistica-avancada',
    name: 'Balística Avançada',
    description: '+2 no dano com armas de fogo',
    requiresChoice: false,
    getEffects: (_power, _attributes) => {
      return {
        rangedDamageBonus: 2,
        conditionalNote: 'Apenas armas de fogo',
      };
    },
  },
};

// =====================================================
// Função Principal de Conversão
// =====================================================

/**
 * Converte poderes de classe ativos para UnifiedEffect[]
 * 
 * @param classPowers - Lista de poderes de classe do personagem
 * @param nex - NEX atual do personagem
 * @param attributes - Atributos do personagem
 * @param activatedEffects - IDs de efeitos ativados manualmente
 * @returns Array de UnifiedEffect
 */
export function getClassPowerEffects(
  classPowers: ActiveClassPower[],
  nex: number,
  attributes: Record<AttributeType, number>,
  activatedEffects: string[] = []
): UnifiedEffect[] {
  const effects: UnifiedEffect[] = [];
  
  for (const power of classPowers) {
    const config = CLASS_POWER_EFFECT_CONFIGS[power.id];
    
    // Se não há configuração de efeito para este poder, pula
    if (!config) continue;
    
    // Se requer escolha mas não tem, o poder não está completo
    if (config.requiresChoice && !hasValidChoice(power, config.choiceType)) {
      continue;
    }
    
    // Obtém as mecânicas do efeito
    const mechanics = config.getEffects(power, attributes);
    
    // Se não há mecânicas, pula
    if (Object.keys(mechanics).length === 0) continue;
    
    // Determina se o efeito precisa de ativação manual
    const requiresActivation = mechanics.specialEffects?.some(
      e => e.includes('+') && e.includes('PE')
    ) ?? false;
    
    // Cria o UnifiedEffect
    const effect: UnifiedEffect = {
      id: `class-power-${power.id}`,
      name: config.name,
      description: config.description,
      source: 'class_power',
      sourceId: power.id,
      sourceName: `${power.classId}: ${config.name}`,
      mechanics,
      conditions: requiresActivation ? {
        requiresActivation: true,
        costPE: 1, // Custo padrão, pode ser ajustado
      } : undefined,
      isActive: requiresActivation 
        ? activatedEffects.includes(`class-power-${power.id}`)
        : true,
      isToggleable: requiresActivation,
    };
    
    effects.push(effect);
  }
  
  return effects;
}

/**
 * Verifica se um poder tem uma escolha válida do tipo especificado
 */
function hasValidChoice(power: ActiveClassPower, choiceType?: string): boolean {
  if (!choiceType) return true;
  if (!power.choices) return false;
  
  switch (choiceType) {
    case 'element':
      return !!power.choices.element;
    case 'ritual':
      return !!power.choices.ritual;
    case 'attribute':
      return !!power.choices.attribute;
    case 'skill':
      return !!power.choices.skill;
    default:
      return true;
  }
}

// =====================================================
// Funções Auxiliares
// =====================================================

/**
 * Retorna lista de poderes que requerem escolha
 */
export function getPowersRequiringChoice(): string[] {
  return Object.entries(CLASS_POWER_EFFECT_CONFIGS)
    .filter(([_, config]) => config.requiresChoice)
    .map(([id]) => id);
}

/**
 * Retorna o tipo de escolha requerido por um poder
 */
export function getChoiceTypeForPower(powerId: string): string | undefined {
  return CLASS_POWER_EFFECT_CONFIGS[powerId]?.choiceType;
}

/**
 * Verifica se um poder tem configuração de efeitos
 */
export function hasPowerEffects(powerId: string): boolean {
  return !!CLASS_POWER_EFFECT_CONFIGS[powerId];
}

/**
 * Lista todos os poderes com efeitos configurados (para debug)
 */
export function listAllClassPowerEffects(): Array<{ id: string; name: string; description: string }> {
  return Object.entries(CLASS_POWER_EFFECT_CONFIGS).map(([id, config]) => ({
    id,
    name: config.name,
    description: config.description,
  }));
}

/**
 * Obtém informações sobre o efeito de um poder específico
 */
export function getClassPowerEffectInfo(powerId: string): ClassPowerEffectConfig | undefined {
  return CLASS_POWER_EFFECT_CONFIGS[powerId];
}
