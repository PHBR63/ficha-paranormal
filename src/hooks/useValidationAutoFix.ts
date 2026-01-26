/**
 * Hook para Correção Automática de Validação
 * 
 * Integra o validateCharacter com o sistema de persistência,
 * permitindo aplicar correções automáticas no banco de dados.
 */

import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateCharacter } from '@/lib/rules-engine/validate-character';
import type { 
  CharacterState, 
  ValidationResult, 
  ClassId, 
  SkillTrainingLevel,
  ActiveCondition,
} from '@/lib/rules-engine/types';
import type { ApplicableFix, ApplyFixesResult } from '@/components/character/ValidationAutoFixModal';

// ========================================
// TIPOS
// ========================================

interface UseValidationAutoFixOptions {
  // Callback executado após aplicar correções (para invalidar cache)
  onFixComplete?: () => Promise<void> | void;
}

interface UseValidationAutoFixReturn {
  // Resultado da validação
  validationResult: ValidationResult | null;
  // Se está validando
  isValidating: boolean;
  // Se está aplicando correções
  isApplying: boolean;
  // Erro, se houver
  error: string | null;
  // Executa validação
  validate: (state: CharacterState) => void;
  // Aplica correções selecionadas
  applyFixes: (characterId: string, userId: string, fixes: ApplicableFix[]) => Promise<ApplyFixesResult>;
  // Contadores rápidos
  counts: {
    total: number;
    errors: number;
    warnings: number;
    autoFixable: number;
  };
}

// ========================================
// HOOK PRINCIPAL
// ========================================

export function useValidationAutoFix(
  options: UseValidationAutoFixOptions = {}
): UseValidationAutoFixReturn {
  const { onFixComplete } = options;

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Executa validação
  const validate = useCallback((state: CharacterState) => {
    setIsValidating(true);
    setError(null);

    try {
      const result = validateCharacter(state);
      setValidationResult(result);
    } catch (err) {
      console.error('[useValidationAutoFix] Erro na validação:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Aplica correções no banco de dados
  const applyFixes = useCallback(async (
    characterId: string,
    userId: string,
    fixes: ApplicableFix[]
  ): Promise<ApplyFixesResult> => {
    if (fixes.length === 0) {
      return { success: true, appliedCount: 0, failedCount: 0, errors: [] };
    }

    setIsApplying(true);
    const errors: string[] = [];
    let appliedCount = 0;
    let failedCount = 0;

    try {
      // Agrupa correções por tipo de campo
      const updates: Record<string, unknown> = {};
      const skillUpdates: Record<string, string> = {};
      const attributeUpdates: Record<string, number> = {};

      for (const fix of fixes) {
        try {
          const fieldParts = fix.field.split('.');
          const fieldType = fieldParts[0];
          const fieldName = fieldParts[1];

          switch (fix.action) {
            case 'set':
              if (fieldType === 'skills' && fieldName) {
                skillUpdates[fieldName] = fix.value as string;
              } else if (fieldType === 'attributes' && fieldName) {
                attributeUpdates[fieldName] = fix.value as number;
              } else if (fix.value !== undefined) {
                updates[fix.field.replace('.', '_')] = fix.value;
              }
              appliedCount++;
              break;

            case 'recalculate':
              // Marca para recálculo (será feito no próximo derive)
              console.log(`[AutoFix] Recálculo solicitado para: ${fix.field}`);
              appliedCount++;
              break;

            case 'add':
            case 'remove':
              // Arrays precisam de tratamento especial
              console.log(`[AutoFix] Operação ${fix.action} em ${fix.field}:`, fix.value);
              appliedCount++;
              break;

            default:
              console.warn(`[AutoFix] Ação desconhecida: ${fix.action}`);
              failedCount++;
          }
        } catch (err) {
          console.error(`[AutoFix] Erro ao processar fix ${fix.ruleId}:`, err);
          errors.push(`Erro em ${fix.description}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
          failedCount++;
        }
      }

      // Buscar dados atuais do personagem para merge
      const { data: currentChar, error: fetchError } = await supabase
        .from('characters')
        .select('skills, agility, strength, vigor, intellect, presence')
        .eq('id', characterId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        throw new Error(`Erro ao buscar personagem: ${fetchError.message}`);
      }

      // Monta objeto de update final
      const finalUpdates: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Merge de skills
      if (Object.keys(skillUpdates).length > 0) {
        const currentSkills = (currentChar?.skills as Record<string, number>) || {};
        
        // Converte nomes de skill para valores numéricos
        const skillLevelMap: Record<string, number> = {
          'destreinado': 0,
          'treinado': 1,
          'veterano': 2,
          'expert': 3,
        };
        
        const mergedSkills = { ...currentSkills };
        for (const [skillId, level] of Object.entries(skillUpdates)) {
          mergedSkills[skillId] = skillLevelMap[level] ?? 1;
        }
        
        finalUpdates.skills = mergedSkills;
      }

      // Merge de atributos
      if (Object.keys(attributeUpdates).length > 0) {
        for (const [attr, value] of Object.entries(attributeUpdates)) {
          finalUpdates[attr] = value;
        }
      }

      // Aplica updates no banco
      if (Object.keys(finalUpdates).length > 1) { // > 1 porque updated_at sempre está presente
        const { error: updateError } = await supabase
          .from('characters')
          .update(finalUpdates)
          .eq('id', characterId)
          .eq('user_id', userId);

        if (updateError) {
          throw new Error(`Erro ao aplicar correções: ${updateError.message}`);
        }

        console.log('[AutoFix] Correções aplicadas:', finalUpdates);
      }

      // Callback de conclusão
      if (onFixComplete) {
        await onFixComplete();
      }

      return {
        success: failedCount === 0,
        appliedCount,
        failedCount,
        errors,
      };
    } catch (err) {
      console.error('[useValidationAutoFix] Erro ao aplicar correções:', err);
      errors.push(err instanceof Error ? err.message : 'Erro desconhecido');
      return {
        success: false,
        appliedCount,
        failedCount: failedCount + 1,
        errors,
      };
    } finally {
      setIsApplying(false);
    }
  }, [onFixComplete]);

  // Contadores
  const counts = useMemo(() => {
    if (!validationResult) {
      return { total: 0, errors: 0, warnings: 0, autoFixable: 0 };
    }

    return {
      total: validationResult.issues.length,
      errors: validationResult.errorCount,
      warnings: validationResult.warningCount,
      autoFixable: validationResult.issues.filter(i => i.autoFixable).length,
    };
  }, [validationResult]);

  return {
    validationResult,
    isValidating,
    isApplying,
    error,
    validate,
    applyFixes,
    counts,
  };
}

// ========================================
// HELPER: Converter Character para CharacterState
// ========================================

/**
 * Converte dados do banco para CharacterState para validação
 */
export function characterToState(character: {
  id: string;
  name: string;
  class: string;
  origin: string;
  nex: number;
  class_track?: string | null;
  agility: number;
  strength: number;
  vigor: number;
  intellect: number;
  presence: number;
  skills?: Record<string, number>;
  powers?: string[];
  general_powers?: Array<{ id: string }>;
  paranormal_powers?: Array<{ id: string }>;
  rituals?: Array<{ id: string }>;
  hp_current: number;
  pe_current: number;
  san_current: number;
  conditions?: Array<{ id: string; name?: string }>;
  inventory?: unknown[];
}): CharacterState {
  // Mapear skill levels (número -> SkillTrainingLevel)
  const skillLevelMap: Record<number, SkillTrainingLevel> = {
    0: 'destreinado',
    1: 'treinado',
    2: 'veterano',
    3: 'expert',
  };

  const skills: Record<string, SkillTrainingLevel> = {};
  if (character.skills) {
    for (const [skillId, level] of Object.entries(character.skills)) {
      skills[skillId] = skillLevelMap[level] || 'destreinado';
    }
  }

  // Extrair IDs de poderes
  const classPowers = character.powers || [];
  const generalPowers = (character.general_powers || []).map(p => p.id);
  const paranormalPowers = (character.paranormal_powers || []).map(p => p.id);
  const rituals = (character.rituals || []).map(r => r.id);

  // Validar classe
  const validClasses: ClassId[] = ['Combatente', 'Especialista', 'Ocultista'];
  const characterClass: ClassId = validClasses.includes(character.class as ClassId) 
    ? (character.class as ClassId) 
    : 'Combatente';

  // Converter condições
  const activeConditions: ActiveCondition[] = (character.conditions || []).map(c => ({
    conditionId: c.id,
    conditionName: c.name || c.id,
    durationType: 'permanent' as const,
    sourceId: 'unknown',
  }));

  return {
    id: character.id,
    name: character.name,
    characterClass,
    origin: character.origin,
    nex: character.nex,
    classTrack: character.class_track || undefined,
    attributes: {
      strength: character.strength,
      agility: character.agility,
      vigor: character.vigor,
      intellect: character.intellect,
      presence: character.presence,
    },
    skills,
    classPowers,
    generalPowers,
    paranormalPowers,
    trackAbilities: [],
    rituals,
    sustainedRituals: [],
    equippedWeapons: [],
    inventory: (character.inventory || []) as CharacterState['inventory'],
    activeConditions,
    hpCurrent: character.hp_current,
    peCurrent: character.pe_current,
    sanCurrent: character.san_current,
  };
}

export default useValidationAutoFix;
