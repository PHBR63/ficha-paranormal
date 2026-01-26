/**
 * Hook para rastrear o poder "Primeira Impressão" do Especialista
 * Ordem Paranormal RPG v1.3 - Livro Base p.51
 * 
 * "Você recebe +1d20 no primeiro teste de Diplomacia, Enganação, 
 * Intimidação ou Intuição que fizer em uma cena."
 * 
 * Este hook rastreia quais dessas 4 perícias já foram testadas na cena atual,
 * permitindo que o +1d20 seja aplicado automaticamente no primeiro teste.
 */

import { useState, useCallback, useMemo } from 'react';

// Perícias elegíveis para Primeira Impressão
const PRIMEIRA_IMPRESSAO_SKILLS = ['diplomacia', 'enganacao', 'intimidacao', 'intuicao'];

/**
 * Normaliza string removendo acentos, espaços e hífen para comparação
 */
function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[\s-]+/g, '');          // Remove espaços e hífens
}

// Normalização para comparação (remove acentos, lowercase)
const normalizeSkill = (skill: string): string => {
  return normalizeForComparison(skill);
};

// Verifica se uma perícia é elegível para Primeira Impressão
export function isEligibleForPrimeiraImpressao(skillId: string): boolean {
  const normalized = normalizeSkill(skillId);
  return PRIMEIRA_IMPRESSAO_SKILLS.some(s => normalizeSkill(s) === normalized);
}

// Interface para verificar se personagem tem o poder
export interface PrimeiraImpressaoContext {
  /** Array de poderes de classe do personagem */
  classPowers?: unknown[];
  /** Objeto ou array de habilidades do personagem (abilities) */
  abilities?: Record<string, unknown> | unknown[];
  /** Classe do personagem */
  characterClass?: string;
}

// Verifica se personagem possui o poder Primeira Impressão
export function hasPrimeiraImpressaoPower(context: PrimeiraImpressaoContext): boolean {
  const { classPowers, abilities, characterClass } = context;
  
  // Apenas Especialistas podem ter este poder
  if (characterClass && characterClass !== 'Especialista') {
    return false;
  }
  
  // Verifica em classPowers (array de poderes)
  if (Array.isArray(classPowers)) {
    const found = classPowers.some((power) => {
      if (typeof power === 'string') {
        const normalized = normalizeSkill(power);
        return normalized === 'primeiraimpressao' || normalized === 'primeira-impressao';
      }
      if (typeof power === 'object' && power !== null) {
        const p = power as Record<string, unknown>;
        const id = normalizeSkill(String(p.id || ''));
        const name = normalizeSkill(String(p.name || ''));
        return id === 'primeiraimpressao' || id === 'primeira-impressao' ||
               name === 'primeiraimpressao' || name === 'primeiraimpress' ||
               name.includes('primeiraimpressao');
      }
      return false;
    });
    if (found) return true;
  }
  
  // Verifica em abilities (objeto/record ou array)
  if (abilities) {
    if (Array.isArray(abilities)) {
      // Abilities como array
      const found = abilities.some((ability) => {
        if (typeof ability === 'string') {
          const normalized = normalizeSkill(ability);
          return normalized === 'primeiraimpressao' || normalized === 'primeira-impressao';
        }
        if (typeof ability === 'object' && ability !== null) {
          const a = ability as Record<string, unknown>;
          const id = normalizeSkill(String(a.id || ''));
          const name = normalizeSkill(String(a.name || ''));
          return id === 'primeiraimpressao' || id === 'primeira-impressao' ||
                 name.includes('primeiraimpressao');
        }
        return false;
      });
      if (found) return true;
    } else if (typeof abilities === 'object') {
      // Abilities como objeto/record
      const abilityKeys = Object.keys(abilities);
      const found = abilityKeys.some((key) => {
        const normalized = normalizeSkill(key);
        return normalized === 'primeiraimpressao' || normalized === 'primeira-impressao';
      });
      if (found) return true;
      
      // Verifica valores que podem ser objetos com id/name
      const abilityValues = Object.values(abilities);
      return abilityValues.some((ability) => {
        if (typeof ability === 'object' && ability !== null) {
          const a = ability as Record<string, unknown>;
          const id = normalizeSkill(String(a.id || ''));
          const name = normalizeSkill(String(a.name || ''));
          return id === 'primeiraimpressao' || id === 'primeira-impressao' ||
                 name.includes('primeiraimpressao');
        }
        return false;
      });
    }
  }
  
  return false;
}

// Retorno do hook
export interface UsePrimeiraImpressaoReturn {
  /** Verifica se uma perícia específica ainda não foi testada nesta cena */
  isFirstTestInScene: (skillId: string) => boolean;
  /** Marca uma perícia como já testada na cena */
  markSkillAsTested: (skillId: string) => void;
  /** Reseta o rastreamento (nova cena) */
  resetSceneTracking: () => void;
  /** Lista de perícias já testadas na cena */
  testedSkillsInScene: string[];
  /** Verifica se personagem tem o poder Primeira Impressão */
  hasPower: boolean;
  /** Verifica se deve aplicar +1d20 para uma perícia */
  shouldApplyExtraDice: (skillId: string) => boolean;
  /** Obtém o número de dados extras para uma perícia (0 ou 1) */
  getExtraDiceForSkill: (skillId: string) => number;
}

/**
 * Hook para gerenciar o poder Primeira Impressão
 * Rastreia quais das 4 perícias sociais já foram testadas na cena
 */
export function usePrimeiraImpressao(context: PrimeiraImpressaoContext): UsePrimeiraImpressaoReturn {
  // Set de perícias já testadas nesta cena
  const [testedSkills, setTestedSkills] = useState<Set<string>>(new Set());
  
  // Verifica se personagem tem o poder
  const hasPower = useMemo(() => {
    return hasPrimeiraImpressaoPower(context);
  }, [context]);
  
  // Verifica se uma perícia ainda não foi testada nesta cena
  const isFirstTestInScene = useCallback((skillId: string): boolean => {
    if (!isEligibleForPrimeiraImpressao(skillId)) return false;
    const normalized = normalizeSkill(skillId);
    return !testedSkills.has(normalized);
  }, [testedSkills]);
  
  // Marca uma perícia como testada
  const markSkillAsTested = useCallback((skillId: string): void => {
    if (!isEligibleForPrimeiraImpressao(skillId)) return;
    const normalized = normalizeSkill(skillId);
    setTestedSkills(prev => new Set([...prev, normalized]));
  }, []);
  
  // Reseta o rastreamento (nova cena)
  const resetSceneTracking = useCallback((): void => {
    setTestedSkills(new Set());
  }, []);
  
  // Verifica se deve aplicar +1d20
  const shouldApplyExtraDice = useCallback((skillId: string): boolean => {
    return hasPower && isFirstTestInScene(skillId);
  }, [hasPower, isFirstTestInScene]);
  
  // Obtém dados extras (0 ou 1)
  const getExtraDiceForSkill = useCallback((skillId: string): number => {
    return shouldApplyExtraDice(skillId) ? 1 : 0;
  }, [shouldApplyExtraDice]);
  
  // Lista de perícias testadas para debug/UI
  const testedSkillsInScene = useMemo(() => {
    return Array.from(testedSkills);
  }, [testedSkills]);
  
  return {
    isFirstTestInScene,
    markSkillAsTested,
    resetSceneTracking,
    testedSkillsInScene,
    hasPower,
    shouldApplyExtraDice,
    getExtraDiceForSkill,
  };
}
