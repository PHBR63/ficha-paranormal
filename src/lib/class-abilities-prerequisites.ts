/**
 * Ponte de Pré-requisitos para Poderes de Classe
 * 
 * Este arquivo conecta o sistema legado (class-abilities.ts) com o 
 * sistema unificado de poderes (class-powers/) para fornecer validação
 * de pré-requisitos durante a criação de personagem.
 * 
 * @module class-abilities-prerequisites
 */

import { getPowerById } from '@/lib/class-powers/power-registry';
import type { UnifiedClassPower, PowerPrerequisites } from '@/lib/class-powers/types';

// ================== MAPEAMENTO DE IDS ==================

/**
 * Mapeia IDs do sistema legado (class-abilities.ts) para IDs do sistema unificado (class-powers/)
 * Alguns poderes têm IDs idênticos, outros têm sufixos de classe
 */
const LEGACY_TO_UNIFIED_ID_MAP: Record<string, string> = {
  // Especialista - IDs que diferem
  'artista-marcial-esp': 'artista-marcial-esp',
  'conhecimento-aplicado': 'conhecimento-aplicado',
  'hacker': 'hacker',
  'maos-rapidas': 'maos-rapidas',
  'nerd': 'nerd',
  'ninja-urbano': 'ninja-urbano',
  'perito-explosivos': 'perito-explosivos',
  'primeira-impressao': 'primeira-impressao',
  'balistica-avancada': 'balistica-avancada',
  'mochila-utilidades': 'mochila-utilidades',
  'movimento-tatico': 'movimento-tatico',
  'na-trilha-certa': 'na-trilha-certa',
  'pensamento-agil': 'pensamento-agil',
  'transcender-esp': 'transcender-esp',
  'treinamento-pericia-esp': 'treinamento-pericia-esp',
  'adaptabilidade': 'adaptabilidade',
  'aparas-precisas': 'aparas-precisas',
  
  // Combatente
  'armamento-pesado': 'armamento-pesado',
  'artista-marcial': 'artista-marcial',
  'ataque-de-oportunidade': 'ataque-de-oportunidade',
  'combater-duas-armas': 'combater-duas-armas',
  'combate-defensivo': 'combate-defensivo',
  'golpe-demolidor': 'golpe-demolidor',
  'golpe-pesado': 'golpe-pesado',
  'incansavel': 'incansavel',
  'presteza-atletica': 'presteza-atletica',
  'protecao-pesada': 'protecao-pesada',
  'reflexos-defensivos': 'reflexos-defensivos',
  'saque-rapido': 'saque-rapido',
  'segurar-gatilho': 'segurar-gatilho',
  'sentido-tatico': 'sentido-tatico',
  'tanque-de-guerra': 'tanque-de-guerra',
  'tiro-certeiro': 'tiro-certeiro',
  'tiro-de-cobertura': 'tiro-de-cobertura',
  // Transcender do Combatente usa ID 'transcender-comb' no sistema unificado
  'transcender': 'transcender-comb',
  'transcender-comb': 'transcender-comb',
  'treinamento-pericia': 'treinamento-pericia-comb',
  'treinamento-pericia-comb': 'treinamento-pericia-comb',
  
  // Ocultista
  'afinidade-elemental': 'afinidade-elemental',
  'celebrar-ritual': 'celebrar-ritual',
  'devorar-entranha': 'devorar-entranha',
  'encarar-morte': 'encarar-morte',
  'escapista': 'escapista',
  'familiar': 'familiar',
  'foco-vital': 'foco-vital',
  'golpe-de-energia': 'golpe-de-energia',
  'inimigo-do-paranormal': 'inimigo-do-paranormal',
  'mestre-do-medo': 'mestre-do-medo',
  'preparar-ritual': 'preparar-ritual',
  'resistencia-ocultista': 'resistencia-ocultista',
  'sangue-extradimensional': 'sangue-extradimensional',
  'transcender-ocultista': 'transcender-ocultista',
  'treinamento-pericia-ocult': 'treinamento-pericia-ocult',
};

// ================== TIPOS ==================

/**
 * Resultado da verificação de pré-requisitos
 */
export interface PrerequisiteCheckResult {
  meets: boolean;
  missing: string[];
  details: PrerequisiteDetail[];
}

/**
 * Detalhe de um pré-requisito específico
 */
export interface PrerequisiteDetail {
  type: 'attribute' | 'skill' | 'power' | 'nex' | 'proficiency';
  label: string;
  required: string | number;
  current: string | number;
  isMet: boolean;
}

/**
 * Dados do personagem necessários para verificar pré-requisitos
 */
export interface CharacterDataForPrerequisites {
  nex: number;
  attributes: {
    strength: number;
    agility: number;
    vigor: number;
    intellect: number;
    presence: number;
  };
  trainedSkills: string[]; // IDs de perícias treinadas
  skillLevels?: Record<string, number>; // 1 = treinado, 2 = veterano, 3 = expert
  powers: string[]; // IDs de poderes possuídos
  proficiencies?: string[];
}

// ================== FUNÇÕES PRINCIPAIS ==================

/**
 * Obtém o ID unificado a partir de um ID legado
 */
export function getUnifiedPowerId(legacyId: string): string {
  return LEGACY_TO_UNIFIED_ID_MAP[legacyId] || legacyId;
}

/**
 * Obtém os pré-requisitos de um poder pelo ID (legado ou unificado)
 */
export function getPowerPrerequisites(powerId: string): PowerPrerequisites | undefined {
  const unifiedId = getUnifiedPowerId(powerId);
  const power = getPowerById(unifiedId);
  return power?.prerequisites;
}

/**
 * Obtém o poder unificado pelo ID (legado ou unificado)
 */
export function getUnifiedPower(powerId: string): UnifiedClassPower | undefined {
  const unifiedId = getUnifiedPowerId(powerId);
  return getPowerById(unifiedId);
}

/**
 * Verifica se um personagem atende aos pré-requisitos de um poder
 */
export function checkPowerPrerequisites(
  powerId: string,
  characterData: CharacterDataForPrerequisites
): PrerequisiteCheckResult {
  const prerequisites = getPowerPrerequisites(powerId);
  
  // Se não há pré-requisitos, o personagem atende automaticamente
  if (!prerequisites) {
    return { meets: true, missing: [], details: [] };
  }
  
  const missing: string[] = [];
  const details: PrerequisiteDetail[] = [];
  
  // Verificar NEX mínimo
  if (prerequisites.minNex && characterData.nex < prerequisites.minNex) {
    const label = `NEX ${prerequisites.minNex}%`;
    missing.push(label);
    details.push({
      type: 'nex',
      label: 'NEX',
      required: prerequisites.minNex,
      current: characterData.nex,
      isMet: false,
    });
  }
  
  // Verificar atributos
  if (prerequisites.attributes) {
    const attrNames: Record<string, string> = {
      strength: 'Força',
      agility: 'Agilidade',
      vigor: 'Vigor',
      intellect: 'Intelecto',
      presence: 'Presença',
    };
    
    for (const [attr, minValue] of Object.entries(prerequisites.attributes)) {
      const currentValue = characterData.attributes[attr as keyof typeof characterData.attributes] || 0;
      const isMet = currentValue >= minValue;
      const label = `${attrNames[attr] || attr} ${minValue}`;
      
      if (!isMet) {
        missing.push(label);
      }
      
      details.push({
        type: 'attribute',
        label: attrNames[attr] || attr,
        required: minValue,
        current: currentValue,
        isMet,
      });
    }
  }
  
  // Verificar perícias
  if (prerequisites.skills) {
    const levelNames: Record<string, string> = {
      trained: 'Treinado',
      veteran: 'Veterano',
      expert: 'Expert',
    };
    
    const levelValues: Record<string, number> = {
      untrained: 0,
      trained: 1,
      veteran: 2,
      expert: 3,
    };
    
    for (const skillReq of prerequisites.skills) {
      const skillId = skillReq.skill;
      const requiredLevel = skillReq.level || 'trained';
      const requiredLevelValue = levelValues[requiredLevel] || 1;
      
      // Verificar nível atual da perícia
      const currentLevelValue = characterData.skillLevels?.[skillId] 
        || (characterData.trainedSkills.includes(skillId) ? 1 : 0);
      
      const isMet = currentLevelValue >= requiredLevelValue;
      
      // Formatar nome da perícia
      const skillName = formatSkillName(skillId);
      const label = `${skillName} (${levelNames[requiredLevel] || requiredLevel})`;
      
      if (!isMet) {
        missing.push(label);
      }
      
      details.push({
        type: 'skill',
        label: skillName,
        required: levelNames[requiredLevel] || requiredLevel,
        current: currentLevelValue > 0 
          ? Object.entries(levelValues).find(([, v]) => v === currentLevelValue)?.[0] || 'untrained'
          : 'Não treinado',
        isMet,
      });
    }
  }
  
  // Verificar poderes necessários
  if (prerequisites.powers) {
    for (const requiredPowerId of prerequisites.powers) {
      const isMet = characterData.powers.includes(requiredPowerId) ||
                    characterData.powers.includes(getUnifiedPowerId(requiredPowerId));
      
      const power = getUnifiedPower(requiredPowerId);
      const label = power?.name || requiredPowerId;
      
      if (!isMet) {
        missing.push(label);
      }
      
      details.push({
        type: 'power',
        label,
        required: 'Possuir',
        current: isMet ? 'Possui' : 'Não possui',
        isMet,
      });
    }
  }
  
  // Verificar proficiências
  if (prerequisites.proficiencies && characterData.proficiencies) {
    for (const prof of prerequisites.proficiencies) {
      const isMet = characterData.proficiencies.includes(prof);
      const label = `Proficiência: ${formatProficiency(prof)}`;
      
      if (!isMet) {
        missing.push(label);
      }
      
      details.push({
        type: 'proficiency',
        label: formatProficiency(prof),
        required: 'Possuir',
        current: isMet ? 'Possui' : 'Não possui',
        isMet,
      });
    }
  }
  
  return {
    meets: missing.length === 0,
    missing,
    details,
  };
}

/**
 * Verifica se um poder tem pré-requisitos definidos
 */
export function hasPowerPrerequisites(powerId: string): boolean {
  const prerequisites = getPowerPrerequisites(powerId);
  if (!prerequisites) return false;
  
  return !!(
    prerequisites.minNex ||
    prerequisites.attributes ||
    prerequisites.skills ||
    prerequisites.powers ||
    prerequisites.proficiencies
  );
}

/**
 * Formata descrição textual dos pré-requisitos
 */
export function formatPrerequisitesText(powerId: string): string | null {
  const prerequisites = getPowerPrerequisites(powerId);
  if (!prerequisites) return null;
  
  const parts: string[] = [];
  
  // Atributos
  if (prerequisites.attributes) {
    const attrAbbrev: Record<string, string> = {
      strength: 'For',
      agility: 'Agi',
      vigor: 'Vig',
      intellect: 'Int',
      presence: 'Pre',
    };
    
    for (const [attr, value] of Object.entries(prerequisites.attributes)) {
      parts.push(`${attrAbbrev[attr] || attr} ${value}`);
    }
  }
  
  // Perícias
  if (prerequisites.skills) {
    for (const skillReq of prerequisites.skills) {
      const skillName = formatSkillName(skillReq.skill);
      const level = skillReq.level || 'trained';
      
      if (level === 'trained') {
        parts.push(`treinado em ${skillName}`);
      } else if (level === 'veteran') {
        parts.push(`veterano em ${skillName}`);
      } else if (level === 'expert') {
        parts.push(`expert em ${skillName}`);
      }
    }
  }
  
  // Poderes
  if (prerequisites.powers) {
    for (const powerId of prerequisites.powers) {
      const power = getUnifiedPower(powerId);
      parts.push(power?.name || powerId);
    }
  }
  
  // NEX
  if (prerequisites.minNex) {
    parts.push(`NEX ${prerequisites.minNex}%`);
  }
  
  return parts.length > 0 ? `Pré-requisitos: ${parts.join(', ')}.` : null;
}

// ================== HELPERS ==================

/**
 * Formata nome da perícia para exibição
 */
function formatSkillName(skillId: string): string {
  const skillNames: Record<string, string> = {
    acrobacia: 'Acrobacia',
    adestramento: 'Adestramento',
    artes: 'Artes',
    atletismo: 'Atletismo',
    atualidades: 'Atualidades',
    ciencias: 'Ciências',
    crime: 'Crime',
    diplomacia: 'Diplomacia',
    enganacao: 'Enganação',
    fortitude: 'Fortitude',
    furtividade: 'Furtividade',
    iniciativa: 'Iniciativa',
    intimidacao: 'Intimidação',
    intuicao: 'Intuição',
    investigacao: 'Investigação',
    luta: 'Luta',
    medicina: 'Medicina',
    ocultismo: 'Ocultismo',
    percepcao: 'Percepção',
    pilotagem: 'Pilotagem',
    pontaria: 'Pontaria',
    profissao: 'Profissão',
    reflexos: 'Reflexos',
    religiao: 'Religião',
    sobrevivencia: 'Sobrevivência',
    tatica: 'Tática',
    tecnologia: 'Tecnologia',
    vontade: 'Vontade',
  };
  
  return skillNames[skillId] || skillId.charAt(0).toUpperCase() + skillId.slice(1);
}

/**
 * Formata proficiência para exibição
 */
function formatProficiency(profId: string): string {
  const profNames: Record<string, string> = {
    'light': 'Armas Simples',
    'tactical': 'Armas Táticas',
    'heavy': 'Armas Pesadas',
    'light-protection': 'Proteções Leves',
    'heavy-protection': 'Proteções Pesadas',
  };
  
  return profNames[profId] || profId;
}

/**
 * Lista todos os poderes de uma classe que têm pré-requisitos
 */
export function getPowersWithPrerequisites(classId: string): string[] {
  const powersWithPrereqs: string[] = [];
  
  for (const legacyId of Object.keys(LEGACY_TO_UNIFIED_ID_MAP)) {
    const power = getUnifiedPower(legacyId);
    if (power && power.classId === classId && power.prerequisites) {
      powersWithPrereqs.push(legacyId);
    }
  }
  
  return powersWithPrereqs;
}
