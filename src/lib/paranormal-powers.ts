/**
 * Ordem Paranormal RPG - Sistema de Poderes Paranormais
 * Baseado no livro oficial (páginas 114-116)
 * 
 * Poderes Paranormais são habilidades obtidas via "Transcender" (habilidade de classe).
 * Quando o personagem atinge NEX 50%, escolhe uma Afinidade Elemental.
 * Poderes do elemento de afinidade têm efeitos aprimorados.
 */

// Tipos de elementos paranormais oficiais (4 elementos, sem "medo")
export type ParanormalElement = 'sangue' | 'morte' | 'conhecimento' | 'energia';

// Interface para pré-requisitos de poderes
export interface PowerPrerequisite {
  element?: ParanormalElement;
  count?: number; // Ex: "Morte 2" = precisa de 2 poderes de Morte
}

// Interface para efeitos dos poderes
export interface PowerEffect {
  type: 'stat_bonus' | 'reroll' | 'immunity' | 'resistance' | 'damage_bonus' | 'special' | 'skill_bonus';
  target?: string;
  value?: number;
  description: string;
}

// Tipos de escolhas que um poder pode requerer
export type PowerChoiceType = 'skill_intellect' | 'ritual' | 'element_resistance';

// Interface principal do Poder Paranormal
export interface ParanormalPower {
  id: string;
  name: string;
  element: ParanormalElement | 'generic'; // 'generic' para poderes universais
  description: string;
  affinityEffect?: string; // Efeito aprimorado quando tem Afinidade
  prerequisite?: PowerPrerequisite;
  effect: PowerEffect;
  isGeneric?: boolean; // Pode ser escolhido múltiplas vezes (como Resistir a Elemento)
  requiresChoice?: PowerChoiceType; // Tipo de escolha que o poder requer
}

// Interface para poder paranormal salvo no personagem (com escolhas)
export interface SavedParanormalPower {
  id: string;
  name: string;
  element: ParanormalElement | 'generic';
  description: string;
  choices?: {
    skills?: string[];              // Para Expansão de Conhecimento
    ritualId?: string;              // Para Aprender Ritual
    resistElement?: ParanormalElement; // Para Resistir a Elemento
  };
}

// ==================== PODERES PARANORMAIS OFICIAIS (22 poderes) ====================

export const PARANORMAL_POWERS: ParanormalPower[] = [
  // === PODERES DE SANGUE (5 poderes) ===
  {
    id: 'anatomia-insana',
    name: 'Anatomia Insana',
    element: 'sangue',
    description: 'Seu corpo foi alterado pelo Outro Lado. Você recebe +2 em testes de resistência a Fortitude.',
    affinityEffect: 'Com afinidade: +5 em testes de resistência a Fortitude.',
    effect: {
      type: 'stat_bonus',
      target: 'fortitude',
      value: 2,
      description: '+2 em testes de Fortitude (ou +5 com afinidade)'
    },
  },
  {
    id: 'arma-de-sangue',
    name: 'Arma de Sangue',
    element: 'sangue',
    description: 'Você pode gastar 2 PV para criar uma arma corpo a corpo feita de sangue cristalizado. A arma tem dano de 1d10 e ameaça em 19.',
    affinityEffect: 'Com afinidade: a arma causa +2 de dano.',
    effect: {
      type: 'special',
      description: 'Criar arma de sangue (1d10, ameaça 19, ou +2 dano com afinidade)'
    },
  },
  {
    id: 'sangue-de-ferro',
    name: 'Sangue de Ferro',
    element: 'sangue',
    description: 'Seu sangue é mais resistente. Você recebe +2 PV por NEX.',
    affinityEffect: 'Com afinidade: você recebe +4 PV por NEX.',
    effect: {
      type: 'stat_bonus',
      target: 'pv_per_nex',
      value: 2,
      description: '+2 PV por NEX (ou +4 com afinidade)'
    },
  },
  {
    id: 'sangue-fervente',
    name: 'Sangue Fervente',
    element: 'sangue',
    prerequisite: { element: 'sangue', count: 1 },
    description: 'O sangue no seu corpo é mais quente. Você recebe +1d6 de dano em rituais de Sangue.',
    affinityEffect: 'Com afinidade: +2d6 de dano em rituais de Sangue.',
    effect: {
      type: 'damage_bonus',
      target: 'blood_rituals',
      value: 1,
      description: '+1d6 em rituais de Sangue (ou +2d6 com afinidade)'
    },
  },
  {
    id: 'sangue-vivo',
    name: 'Sangue Vivo',
    element: 'sangue',
    prerequisite: { element: 'sangue', count: 2 },
    description: 'Seu sangue regenera seu corpo. No início de cada turno, você recupera 1d6 PV.',
    affinityEffect: 'Com afinidade: você recupera 2d6 PV por turno.',
    effect: {
      type: 'special',
      description: 'Regenera 1d6 PV por turno (ou 2d6 com afinidade)'
    },
  },

  // === PODERES DE MORTE (5 poderes) ===
  {
    id: 'encarar-a-morte',
    name: 'Encarar a Morte',
    element: 'morte',
    description: 'Você já olhou para a morte. Você só morre quando chega a -10 PV (em vez de -5).',
    affinityEffect: 'Com afinidade: você só morre quando chega a -20 PV.',
    effect: {
      type: 'special',
      description: 'Morre em -10 PV (ou -20 com afinidade)'
    },
  },
  {
    id: 'escapar-da-morte',
    name: 'Escapar da Morte',
    element: 'morte',
    prerequisite: { element: 'morte', count: 1 },
    description: 'Uma vez por sessão, quando você seria reduzido a 0 PV ou menos, você fica com 1 PV.',
    affinityEffect: 'Com afinidade: você pode usar este poder duas vezes por sessão.',
    effect: {
      type: 'special',
      description: '1/sessão: não morre ao chegar a 0 PV (ou 2/sessão com afinidade)'
    },
  },
  {
    id: 'potencial-aprimorado',
    name: 'Potencial Aprimorado',
    element: 'morte',
    description: 'Sua conexão com o Outro Lado aumenta seu potencial. Você recebe +1 PE por NEX.',
    affinityEffect: 'Com afinidade: você recebe +2 PE por NEX.',
    effect: {
      type: 'stat_bonus',
      target: 'pe_per_nex',
      value: 1,
      description: '+1 PE por NEX (ou +2 com afinidade)'
    },
  },
  {
    id: 'potencial-reaproveitado',
    name: 'Potencial Reaproveitado',
    element: 'morte',
    prerequisite: { element: 'morte', count: 1 },
    description: 'Quando você mata uma criatura, recupera PE igual ao círculo máximo de ritual que ela poderia lançar (mínimo 1).',
    affinityEffect: 'Com afinidade: você recupera o dobro de PE.',
    effect: {
      type: 'special',
      description: 'Recupera PE ao matar (ou o dobro com afinidade)'
    },
  },
  {
    id: 'surto-temporal',
    name: 'Surto Temporal',
    element: 'morte',
    prerequisite: { element: 'morte', count: 2 },
    description: 'Uma vez por cena, você pode realizar uma ação padrão adicional no seu turno.',
    affinityEffect: 'Com afinidade: você pode usar este poder duas vezes por cena.',
    effect: {
      type: 'special',
      description: 'Ação extra 1/cena (ou 2/cena com afinidade)'
    },
  },

  // === PODERES DE CONHECIMENTO (5 poderes) ===
  {
    id: 'expansao-de-conhecimento',
    name: 'Expansão de Conhecimento',
    element: 'conhecimento',
    description: 'Sua mente foi expandida. Você recebe +5 em uma perícia baseada em Intelecto à sua escolha.',
    affinityEffect: 'Com afinidade: você recebe +5 em duas perícias baseadas em Intelecto.',
    requiresChoice: 'skill_intellect',
    effect: {
      type: 'skill_bonus',
      target: 'intellect_skill',
      value: 5,
      description: '+5 em 1 perícia de Intelecto (ou 2 com afinidade)'
    },
  },
  {
    id: 'percepcao-paranormal',
    name: 'Percepção Paranormal',
    element: 'conhecimento',
    description: 'Você pode sentir presenças paranormais em alcance médio. Você sabe a direção e a distância aproximada.',
    affinityEffect: 'Com afinidade: você também sabe o elemento e o círculo da criatura.',
    effect: {
      type: 'special',
      description: 'Detecta presenças paranormais (ou detalhes com afinidade)'
    },
  },
  {
    id: 'precognicao',
    name: 'Precognição',
    element: 'conhecimento',
    prerequisite: { element: 'conhecimento', count: 1 },
    description: 'Você vislumbra o futuro próximo. Você recebe +2 em Defesa e +2 em testes de resistência.',
    affinityEffect: 'Com afinidade: +5 em Defesa e +5 em testes de resistência.',
    effect: {
      type: 'stat_bonus',
      target: 'defense_and_resistance',
      value: 2,
      description: '+2 Defesa e resistências (ou +5 com afinidade)'
    },
  },
  {
    id: 'sensitivo',
    name: 'Sensitivo',
    element: 'conhecimento',
    description: 'Você sente emoções alheias. Recebe +5 em Diplomacia, Intimidação e Intuição.',
    affinityEffect: 'Com afinidade: +10 nessas perícias.',
    effect: {
      type: 'skill_bonus',
      target: 'social_skills',
      value: 5,
      description: '+5 em Diplomacia, Intimidação, Intuição (ou +10 com afinidade)'
    },
  },
  {
    id: 'visao-do-oculto',
    name: 'Visão do Oculto',
    element: 'conhecimento',
    prerequisite: { element: 'conhecimento', count: 2 },
    description: 'Você enxerga o invisível. Você recebe +5 em Percepção e pode ver criaturas e objetos invisíveis.',
    affinityEffect: 'Com afinidade: +10 em Percepção.',
    effect: {
      type: 'skill_bonus',
      target: 'perception',
      value: 5,
      description: '+5 Percepção e ver invisíveis (ou +10 com afinidade)'
    },
  },

  // === PODERES DE ENERGIA (5 poderes) ===
  {
    id: 'afortunado',
    name: 'Afortunado',
    element: 'energia',
    description: 'A sorte está ao seu lado. Você pode rolar novamente um d20 que tenha resultado 1.',
    affinityEffect: 'Com afinidade: você pode rolar novamente d20 que tenham resultado 1 ou 2.',
    effect: {
      type: 'reroll',
      value: 1,
      description: 'Rerolar resultado 1 (ou 1-2 com afinidade)'
    },
  },
  {
    id: 'campo-protetor',
    name: 'Campo Protetor',
    element: 'energia',
    prerequisite: { element: 'energia', count: 1 },
    description: 'Um campo de energia o protege. Você recebe +5 em Defesa quando usa a ação esquivar.',
    affinityEffect: 'Com afinidade: +10 em Defesa ao esquivar.',
    effect: {
      type: 'stat_bonus',
      target: 'defense_dodge',
      value: 5,
      description: '+5 Defesa ao esquivar (ou +10 com afinidade)'
    },
  },
  {
    id: 'causalidade-fortuita',
    name: 'Causalidade Fortuita',
    element: 'energia',
    description: 'O acaso conspira a seu favor. Quando você acerta um ataque crítico, o alvo sofre uma condição aleatória por 1 rodada.',
    affinityEffect: 'Com afinidade: a condição dura 1d4 rodadas.',
    effect: {
      type: 'special',
      description: 'Crítico causa condição aleatória (ou mais duração com afinidade)'
    },
  },
  {
    id: 'golpe-de-sorte',
    name: 'Golpe de Sorte',
    element: 'energia',
    prerequisite: { element: 'energia', count: 1 },
    description: 'Seus golpes são mais precisos. Você recebe +1 na margem de ameaça de seus ataques.',
    affinityEffect: 'Com afinidade: +2 na margem de ameaça.',
    effect: {
      type: 'stat_bonus',
      target: 'threat_margin',
      value: 1,
      description: '+1 margem de ameaça (ou +2 com afinidade)'
    },
  },
  {
    id: 'manipular-entropia',
    name: 'Manipular Entropia',
    element: 'energia',
    prerequisite: { element: 'energia', count: 2 },
    description: 'Uma vez por cena, você pode rolar 2d20 em um teste e escolher o melhor resultado.',
    affinityEffect: 'Com afinidade: você pode rolar 3d20.',
    effect: {
      type: 'special',
      description: '1/cena: rolar 2d20 e escolher (ou 3d20 com afinidade)'
    },
  },

  // === PODERES GENÉRICOS (2 poderes) ===
  {
    id: 'aprender-ritual',
    name: 'Aprender Ritual',
    element: 'generic',
    isGeneric: true,
    description: 'Você aprende um ritual adicional de qualquer círculo que possa lançar.',
    requiresChoice: 'ritual',
    effect: {
      type: 'special',
      description: 'Aprende 1 ritual adicional'
    },
  },
  {
    id: 'resistir-a-elemento',
    name: 'Resistir a Elemento',
    element: 'generic',
    isGeneric: true,
    description: 'Escolha um elemento (Sangue, Morte, Conhecimento ou Energia). Você recebe resistência 5 a esse elemento.',
    requiresChoice: 'element_resistance',
    effect: {
      type: 'resistance',
      target: 'element',
      value: 5,
      description: 'Resistência 5 a um elemento escolhido'
    },
  },
];

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Retorna todos os poderes de um elemento específico
 */
export function getPowersByElement(element: ParanormalElement | 'generic'): ParanormalPower[] {
  return PARANORMAL_POWERS.filter(power => power.element === element);
}

/**
 * Retorna um poder pelo ID
 */
export function getPowerById(id: string): ParanormalPower | undefined {
  return PARANORMAL_POWERS.find(power => power.id === id);
}

/**
 * Conta quantos poderes de um elemento o personagem possui
 */
export function getElementPowerCount(element: ParanormalElement, powerIds: string[]): number {
  return powerIds.filter(id => {
    const power = getPowerById(id);
    return power && power.element === element;
  }).length;
}

/**
 * Verifica se o personagem pode escolher um poder (pré-requisitos)
 */
export function canChoosePower(power: ParanormalPower, characterPowerIds: string[]): boolean {
  // Poderes genéricos sempre podem ser escolhidos (mas só uma vez, a menos que isGeneric)
  if (power.element === 'generic') {
    return power.isGeneric || !characterPowerIds.includes(power.id);
  }
  
  // Se não tem pré-requisito, pode escolher
  if (!power.prerequisite) {
    return !characterPowerIds.includes(power.id);
  }
  
  // Verifica o pré-requisito
  const { element, count } = power.prerequisite;
  if (element && count) {
    const elementCount = getElementPowerCount(element, characterPowerIds);
    if (elementCount < count) {
      return false;
    }
  }
  
  return !characterPowerIds.includes(power.id);
}

/**
 * Retorna o efeito do poder (base ou com afinidade)
 */
export function getPowerEffect(power: ParanormalPower, hasAffinity: boolean, characterAffinity?: ParanormalElement): string {
  // Se tem afinidade e o poder é do mesmo elemento
  if (hasAffinity && characterAffinity && power.element === characterAffinity && power.affinityEffect) {
    return power.affinityEffect;
  }
  return power.description;
}

/**
 * Calcula modificadores de stats baseado nos poderes ativos
 */
export function calculatePowerModifiers(
  powerIds: string[], 
  nex: number = 5,
  hasAffinity: boolean = false,
  affinityElement?: ParanormalElement
): Record<string, number> {
  const modifiers: Record<string, number> = {};
  
  for (const id of powerIds) {
    const power = getPowerById(id);
    if (!power) continue;
    
    const isAffinityBonus = hasAffinity && affinityElement === power.element;
    
    switch (power.id) {
      case 'sangue-de-ferro':
        // +2 PV por NEX (ou +4 com afinidade)
        const pvBonus = isAffinityBonus ? 4 : 2;
        modifiers['pv_bonus'] = (modifiers['pv_bonus'] || 0) + (pvBonus * Math.floor(nex / 5));
        break;
        
      case 'potencial-aprimorado':
        // +1 PE por NEX (ou +2 com afinidade)
        const peBonus = isAffinityBonus ? 2 : 1;
        modifiers['pe_bonus'] = (modifiers['pe_bonus'] || 0) + (peBonus * Math.floor(nex / 5));
        break;
        
      case 'anatomia-insana':
        modifiers['fortitude'] = (modifiers['fortitude'] || 0) + (isAffinityBonus ? 5 : 2);
        break;
        
      case 'precognicao':
        const defBonus = isAffinityBonus ? 5 : 2;
        modifiers['defense'] = (modifiers['defense'] || 0) + defBonus;
        modifiers['resistance'] = (modifiers['resistance'] || 0) + defBonus;
        break;
        
      case 'sensitivo':
        const socialBonus = isAffinityBonus ? 10 : 5;
        modifiers['diplomacia'] = (modifiers['diplomacia'] || 0) + socialBonus;
        modifiers['intimidacao'] = (modifiers['intimidacao'] || 0) + socialBonus;
        modifiers['intuicao'] = (modifiers['intuicao'] || 0) + socialBonus;
        break;
        
      case 'visao-do-oculto':
        modifiers['percepcao'] = (modifiers['percepcao'] || 0) + (isAffinityBonus ? 10 : 5);
        break;
        
      case 'golpe-de-sorte':
        modifiers['threat_margin'] = (modifiers['threat_margin'] || 0) + (isAffinityBonus ? 2 : 1);
        break;
        
      case 'campo-protetor':
        modifiers['defense_dodge'] = (modifiers['defense_dodge'] || 0) + (isAffinityBonus ? 10 : 5);
        break;
    }
  }
  
  return modifiers;
}

/**
 * Verifica se pode rerolar resultado 1 (poder Afortunado)
 */
export function hasRerollOne(powerIds: string[]): boolean {
  return powerIds.includes('afortunado');
}

/**
 * Verifica se pode rerolar resultado 1 e 2 (Afortunado com afinidade)
 */
export function getRerollRange(powerIds: string[], hasAffinity: boolean, affinityElement?: ParanormalElement): number {
  if (!powerIds.includes('afortunado')) return 0;
  
  // Com afinidade de Energia, pode rerolar 1 ou 2
  if (hasAffinity && affinityElement === 'energia') return 2;
  
  return 1;
}

/**
 * Retorna a descrição formatada de todos os efeitos ativos
 */
export function getActivePowerEffects(
  powerIds: string[],
  hasAffinity: boolean = false,
  affinityElement?: ParanormalElement
): string[] {
  const effects: string[] = [];
  
  for (const id of powerIds) {
    const power = getPowerById(id);
    if (power) {
      const effect = getPowerEffect(power, hasAffinity, affinityElement);
      effects.push(`${power.name}: ${effect}`);
    }
  }
  
  return effects;
}

// Ícones por elemento para a UI
export const ELEMENT_ICONS: Record<ParanormalElement | 'generic', string> = {
  sangue: '🩸',
  morte: '💀',
  conhecimento: '📚',
  energia: '⚡',
  generic: '✨',
};

// Cores por elemento para a UI (usando classes Tailwind)
export const ELEMENT_COLORS: Record<ParanormalElement | 'generic', string> = {
  sangue: 'text-red-500',
  morte: 'text-purple-500',
  conhecimento: 'text-blue-500',
  energia: 'text-yellow-500',
  generic: 'text-gray-400',
};

// Cores de fundo por elemento
export const ELEMENT_BG_COLORS: Record<ParanormalElement | 'generic', string> = {
  sangue: 'bg-red-500/10 border-red-500/50',
  morte: 'bg-purple-500/10 border-purple-500/50',
  conhecimento: 'bg-blue-500/10 border-blue-500/50',
  energia: 'bg-yellow-500/10 border-yellow-500/50',
  generic: 'bg-gray-500/10 border-gray-500/50',
};

// Labels dos elementos
export const ELEMENT_LABELS: Record<ParanormalElement | 'generic', string> = {
  sangue: 'Sangue',
  morte: 'Morte',
  conhecimento: 'Conhecimento',
  energia: 'Energia',
  generic: 'Genérico',
};

// Descrições das afinidades
export const AFFINITY_DESCRIPTIONS: Record<ParanormalElement, string> = {
  sangue: 'Afinidade com Sangue amplia seus poderes de vitalidade e regeneração.',
  morte: 'Afinidade com Morte aumenta sua resistência e permite manipular a própria mortalidade.',
  conhecimento: 'Afinidade com Conhecimento expande sua percepção e habilidades mentais.',
  energia: 'Afinidade com Energia melhora sua sorte e capacidade de manipular o acaso.',
};
