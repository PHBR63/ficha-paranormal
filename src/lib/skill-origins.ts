/**
 * Skill Origins - Identifica a origem do treinamento de cada perícia
 * 
 * Determina se uma perícia foi treinada via:
 * - Origem do personagem
 * - Classe (obrigatória ou escolha)
 * - Poder "Treinamento em Perícia"
 * - Perícia livre (pontos de Intelecto)
 */

import { ORIGINS } from './character-data';
import { CLASS_IDS } from './constants/game-ids';

// Tipos de origem do treinamento
export type SkillOriginType = 'origin' | 'class_mandatory' | 'class_choice' | 'free' | 'power_training' | 'unknown';

// Informação completa da origem de uma perícia
export interface SkillOriginInfo {
  type: SkillOriginType;
  source: string; // Nome da fonte (ex: "Acadêmico", "Ocultista", "Treinamento em Perícia")
  level: number; // Nível de treinamento (1=Treinado, 2=Veterano, 3=Expert)
  upgradedBy?: string; // Se foi elevado por poder (ex: "Treinamento em Perícia")
}

// Mapeamento de perícias obrigatórias por classe
const CLASS_MANDATORY_SKILLS: Record<string, string[]> = {
  [CLASS_IDS.COMBATENTE]: [],
  [CLASS_IDS.ESPECIALISTA]: [],
  [CLASS_IDS.OCULTISTA]: ['ocultismo', 'vontade'],
};

// Mapeamento de escolhas de classe
const CLASS_CHOICE_SKILLS: Record<string, string[][]> = {
  [CLASS_IDS.COMBATENTE]: [
    ['luta', 'pontaria'],
    ['fortitude', 'reflexos'],
  ],
  [CLASS_IDS.ESPECIALISTA]: [],
  [CLASS_IDS.OCULTISTA]: [],
};

/**
 * Obtém as perícias de uma origem específica
 */
function getOriginSkillIds(originId: string): string[] {
  const origin = ORIGINS.find(o => o.id === originId);
  if (!origin || !origin.skills) return [];
  
  // Normalizar para IDs lowercase
  return origin.skills.map((s: string) => s.toLowerCase().replace(/\s+/g, ''));
}

/**
 * Obtém o nome da origem
 */
function getOriginName(originId: string): string {
  const origin = ORIGINS.find(o => o.id === originId);
  return origin?.name || originId;
}

/**
 * Obtém o nome da classe
 */
function getClassName(classId: string): string {
  const classNames: Record<string, string> = {
    [CLASS_IDS.COMBATENTE]: 'Combatente',
    [CLASS_IDS.ESPECIALISTA]: 'Especialista',
    [CLASS_IDS.OCULTISTA]: 'Ocultista',
  };
  return classNames[classId] || classId;
}

/**
 * Verifica se uma perícia é uma escolha de classe
 */
function isClassChoiceSkill(classId: string, skillId: string): boolean {
  const choices = CLASS_CHOICE_SKILLS[classId] || [];
  return choices.some(group => group.includes(skillId));
}

/**
 * Calcula as origens de todas as perícias de um personagem
 */
export function calculateSkillOrigins(
  skills: Record<string, number>,
  originId: string,
  classId: string,
  skillTrainingChoices?: Record<string, Array<{ skillId: string; fromLevel: number; toLevel: number }>>
): Record<string, SkillOriginInfo> {
  const result: Record<string, SkillOriginInfo> = {};
  
  // Obter dados básicos
  const originSkills = getOriginSkillIds(originId);
  const originName = getOriginName(originId);
  const className = getClassName(classId);
  const classMandatory = CLASS_MANDATORY_SKILLS[classId] || [];
  
  // Mapear perícias treinadas via poder (para detectar upgrades)
  const powerTrainedSkills: Record<string, { fromLevel: number; toLevel: number }> = {};
  if (skillTrainingChoices) {
    Object.values(skillTrainingChoices).forEach(choices => {
      choices.forEach(choice => {
        powerTrainedSkills[choice.skillId] = {
          fromLevel: choice.fromLevel,
          toLevel: choice.toLevel,
        };
      });
    });
  }
  
  // Processar cada perícia treinada
  Object.entries(skills).forEach(([skillId, level]) => {
    if (level <= 0) return; // Não treinada
    
    // Verificar se foi treinada via poder (nível 0 → 1, 2 ou 3)
    const powerTraining = powerTrainedSkills[skillId];
    if (powerTraining && powerTraining.fromLevel === 0) {
      // Perícia inteiramente obtida via poder
      result[skillId] = {
        type: 'power_training',
        source: 'Treinamento em Perícia',
        level,
      };
      return;
    }
    
    // Determinar origem base
    let baseType: SkillOriginType = 'unknown';
    let baseSource = 'Desconhecida';
    
    if (originSkills.includes(skillId)) {
      baseType = 'origin';
      baseSource = originName;
    } else if (classMandatory.includes(skillId)) {
      baseType = 'class_mandatory';
      baseSource = className;
    } else if (isClassChoiceSkill(classId, skillId)) {
      baseType = 'class_choice';
      baseSource = className;
    } else {
      baseType = 'free';
      baseSource = 'Perícia Livre';
    }
    
    // Verificar se foi elevada por poder
    const upgradedBy = powerTraining ? 'Treinamento em Perícia' : undefined;
    
    result[skillId] = {
      type: baseType,
      source: baseSource,
      level,
      upgradedBy,
    };
  });
  
  return result;
}

/**
 * Gera texto de tooltip para uma perícia
 */
export function getSkillOriginTooltip(info: SkillOriginInfo | undefined): string {
  if (!info) return 'Perícia não treinada';
  
  const levelLabels = ['Destreinado', 'Treinado', 'Veterano', 'Expert'];
  const levelLabel = levelLabels[info.level] || 'Treinado';
  
  const sourceLabels: Record<SkillOriginType, string> = {
    origin: 'Origem',
    class_mandatory: 'Classe (obrigatória)',
    class_choice: 'Classe (escolha)',
    free: 'Perícia Livre',
    power_training: 'Poder',
    unknown: 'Fonte desconhecida',
  };
  
  let tooltip = `${levelLabel}\nFonte: ${sourceLabels[info.type]} (${info.source})`;
  
  if (info.upgradedBy) {
    tooltip += `\nAprimorada por: ${info.upgradedBy}`;
  }
  
  return tooltip;
}

/**
 * Gera ícone/cor para o tipo de origem
 */
export function getSkillOriginStyle(type: SkillOriginType): {
  bgColor: string;
  textColor: string;
  icon: string;
} {
  switch (type) {
    case 'origin':
      return { bgColor: 'bg-blue-500/20', textColor: 'text-blue-400', icon: '📜' };
    case 'class_mandatory':
      return { bgColor: 'bg-orange-500/20', textColor: 'text-orange-400', icon: '⚔️' };
    case 'class_choice':
      return { bgColor: 'bg-orange-500/20', textColor: 'text-orange-400', icon: '⚔️' };
    case 'free':
      return { bgColor: 'bg-green-500/20', textColor: 'text-green-400', icon: '📚' };
    case 'power_training':
      return { bgColor: 'bg-purple-500/20', textColor: 'text-purple-400', icon: '✨' };
    default:
      return { bgColor: 'bg-muted/20', textColor: 'text-muted-foreground', icon: '❓' };
  }
}
