/**
 * useSkillRoll - Hook para preparação e execução de testes de perícia
 * 
 * Centraliza a lógica de rolagem de perícias que estava duplicada
 * entre desktop e mobile, integrando com o SUE para bônus automáticos.
 * 
 * @module hooks/character/useSkillRoll
 */

import { useCallback, useMemo } from 'react';
import type { BonusSource } from '@/components/dice/DiceRollModal';
import { useSkillRollWithSUE, type SkillRollCharacterConfig } from '@/hooks/sue/useSkillRollWithSUE';

/** Interface simplificada de fonte de bônus para uso interno */
interface SimpleBonusSource {
  source: string;
  value: number;
  description?: string;
}

/** Atributo base para cálculo de pool */
export type AttributeType = 'strength' | 'agility' | 'vigor' | 'intellect' | 'presence';

/** Entrada de perícia para rolagem */
export interface SkillRollInput {
  /** ID da perícia (ex: 'atletismo', 'ocultismo') */
  skillId: string;
  /** Nome para exibição */
  skillName: string;
  /** Nível de treinamento (0-3) */
  trainingLevel: number;
  /** Atributo base da perícia */
  attribute: AttributeType;
  /** Valor do atributo base */
  attributeValue: number;
  /** Bônus adicionais específicos */
  additionalBonuses?: BonusSource[];
  /** Dados extras (ex: Discurso Motivador) */
  extraDice?: number;
  /** DT do teste, se conhecido */
  dt?: number;
}

/** Contexto do personagem para bônus do SUE */
export interface SkillRollCharacterContext {
  characterId?: string;
  characterName?: string;
  origin: string;
  characterClass: string;
  classTrack?: string | null;
  nex: number;
  skills: Record<string, number>;
  classPowers?: string[];
  generalPowers?: string[];
  paranormalPowers?: Array<{ id: string; name: string; element: string; description: string }>;
  activeConditions?: string[];
  // Atributos
  strength: number;
  agility: number;
  vigor: number;
  intellect: number;
  presence: number;
}

/** Configuração preparada para o modal de rolagem */
export interface PreparedSkillRoll {
  /** Label para o modal */
  label: string;
  /** Pool de dados (atributo base) */
  pool: number;
  /** Bônus total calculado */
  bonus: number;
  /** Fontes de bônus para breakdown */
  bonusSources: BonusSource[];
  /** Dados extras */
  extraDice: number;
  /** Atributo sendo testado (para poderes ativáveis) */
  testedAttribute: AttributeType;
  /** ID da perícia */
  skillId: string;
}

interface UseSkillRollReturn {
  /** Prepara uma rolagem de perícia para o modal */
  prepareRoll: (input: SkillRollInput) => PreparedSkillRoll;
  /** Obtém breakdown de bônus para uma perícia */
  getSkillBreakdown: (skillId: string) => {
    total: number;
    sources: Array<{ source: string; value: number; description?: string }>;
  };
}

/**
 * Hook para preparação e execução de testes de perícia
 * 
 * @param context - Contexto do personagem para bônus do SUE
 * @returns Funções para preparar e executar rolagens
 */
export function useSkillRoll(context: SkillRollCharacterContext): UseSkillRollReturn {
  // Monta configuração para o hook do SUE
  const sueConfig = useMemo<SkillRollCharacterConfig>(() => ({
    characterId: context.characterId,
    characterName: context.characterName,
    origin: context.origin,
    characterClass: context.characterClass,
    classTrack: context.classTrack || undefined,
    nex: context.nex,
    skills: context.skills,
    classPowers: context.classPowers || [],
    generalPowers: context.generalPowers || [],
    paranormalPowers: context.paranormalPowers || [],
    activeConditions: context.activeConditions || [],
    attributes: {
      strength: context.strength,
      agility: context.agility,
      vigor: context.vigor,
      intellect: context.intellect,
      presence: context.presence,
    },
  }), [
    context.characterId,
    context.characterName,
    context.origin,
    context.characterClass,
    context.classTrack,
    context.nex,
    context.skills,
    context.classPowers,
    context.generalPowers,
    context.paranormalPowers,
    context.activeConditions,
    context.strength,
    context.agility,
    context.vigor,
    context.intellect,
    context.presence,
  ]);
  
  // Hook do SUE para bônus automáticos
  const { getSkillBonusBreakdown } = useSkillRollWithSUE(sueConfig);
  
  // Obtém breakdown de bônus
  const getSkillBreakdown = useCallback((skillId: string) => {
    const breakdown = getSkillBonusBreakdown(skillId);
    // O hook retorna { skillBonus, trainingLevel }
    // Convertemos para o formato esperado
    return {
      total: breakdown.skillBonus,
      trainingLevel: breakdown.trainingLevel,
      sources: [
        {
          source: 'Treinamento',
          value: breakdown.skillBonus,
          description: breakdown.trainingLevel,
        },
      ] as Array<{ source: string; value: number; description?: string }>,
    };
  }, [getSkillBonusBreakdown]);
  
  // Prepara uma rolagem para o modal
  const prepareRoll = useCallback((input: SkillRollInput): PreparedSkillRoll => {
    // Obtém bônus do SUE
    const sueBonuses = getSkillBreakdown(input.skillId);
    
    // Monta fontes de bônus convertidas para o formato do DiceRollModal
    const bonusSources: BonusSource[] = [
      ...sueBonuses.sources.map(s => ({
        label: s.source,
        value: s.value,
        type: 'skill' as const,
        description: s.description || '',
      })),
      ...(input.additionalBonuses || []),
    ];
    
    // Calcula bônus total
    const totalBonus = bonusSources.reduce((acc, b) => acc + b.value, 0);
    
    return {
      label: `Teste de ${input.skillName}`,
      pool: input.attributeValue,
      bonus: totalBonus,
      bonusSources,
      extraDice: input.extraDice || 0,
      testedAttribute: input.attribute,
      skillId: input.skillId,
    };
  }, [getSkillBreakdown]);
  
  return {
    prepareRoll,
    getSkillBreakdown,
  };
}

/**
 * Helper para obter o atributo base de uma perícia
 */
export function getSkillBaseAttribute(skillId: string): AttributeType {
  // Mapeamento de perícias para atributos (baseado no Livro Base v1.3)
  const attributeMap: Record<string, AttributeType> = {
    // Agilidade
    'acrobacia': 'agility',
    'atletismo': 'agility',
    'furtividade': 'agility',
    'luta': 'agility',
    'pilotagem': 'agility',
    'pontaria': 'agility',
    'reflexos': 'agility',
    
    // Vigor (Fortitude)
    'fortitude': 'vigor',
    
    // Intelecto
    'atualidades': 'intellect',
    'ciencias': 'intellect',
    'crime': 'intellect',
    'investigacao': 'intellect',
    'medicina': 'intellect',
    'ocultismo': 'intellect',
    'profissao': 'intellect',
    'sobrevivencia': 'intellect',
    'tatica': 'intellect',
    'tecnologia': 'intellect',
    
    // Presença
    'artes': 'presence',
    'diplomacia': 'presence',
    'enganacao': 'presence',
    'intimidacao': 'presence',
    'intuicao': 'presence',
    'percepcao': 'presence',
    'vontade': 'presence',
    
    // Vigor (Resistência)
    'resistencia': 'vigor',
  };
  
  // Normaliza o ID removendo acentos
  const normalizedId = skillId
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  return attributeMap[normalizedId] || 'intellect';
}
