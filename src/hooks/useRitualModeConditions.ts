/**
 * Hook para gerenciar condições automáticas de modos de rituais
 * Integra o sistema de modos de rituais sustentados com o gerenciador de condições
 * 
 * Exemplo de uso: Velocidade Mortal no modo Inverso aplica automaticamente
 * a condição 'velocidade-mortal-inverso' ao conjurador
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { 
  setRitualMode, 
  getAvailableModesForRitual, 
  ritualHasModes,
  getRitualModeDescription,
  calculateInverseDamageTransfer,
  getInverseProtector,
  getInverseProtectionTarget,
  SustainedRitual,
} from '@/lib/sustained-rituals';
import { CONDITIONS, getConditionById } from '@/lib/conditions';

// Interface para condição ativa compatível com ConditionManager
export interface ActiveConditionForRitual {
  id: string;
  name: string;
  turnsRemaining: number | null;
  addedAt: string;
  source?: string; // ID do ritual que aplicou a condição
}

interface UseRitualModeConditionsProps {
  characterId: string;
  characterName: string;
  currentConditions: ActiveConditionForRitual[];
  onConditionsChange: (conditions: ActiveConditionForRitual[]) => void;
}

/**
 * Hook para gerenciar condições aplicadas por modos de rituais
 */
export function useRitualModeConditions({
  characterId,
  characterName,
  currentConditions,
  onConditionsChange,
}: UseRitualModeConditionsProps) {
  
  /**
   * Ativa um modo de ritual e aplica as condições correspondentes
   */
  const activateRitualMode = useCallback((
    sustainedRitualId: string,
    modeName: string,
    targetId?: string,
    targetName?: string
  ) => {
    const result = setRitualMode(sustainedRitualId, modeName, targetId, targetName);
    
    if (!result.success) {
      toast.error(result.message);
      return false;
    }

    // Processa as condições a serem removidas
    let updatedConditions = [...currentConditions];
    
    for (const condToRemove of result.conditionsToRemove) {
      if (condToRemove.characterId === characterId) {
        updatedConditions = updatedConditions.filter(c => c.id !== condToRemove.conditionId);
        const condData = getConditionById(condToRemove.conditionId);
        if (condData) {
          toast.info(`Condição removida: ${condData.name}`);
        }
      }
    }

    // Processa as condições a serem adicionadas
    for (const condToAdd of result.conditionsToAdd) {
      if (condToAdd.characterId === characterId) {
        // Verifica se já existe
        if (!updatedConditions.some(c => c.id === condToAdd.conditionId)) {
          const condData = CONDITIONS[condToAdd.conditionId];
          if (condData) {
            updatedConditions.push({
              id: condToAdd.conditionId,
              name: condData.name,
              turnsRemaining: null, // Dura enquanto o ritual estiver ativo
              addedAt: new Date().toISOString(),
              source: sustainedRitualId,
            });
            toast.success(`⚡ Condição aplicada: ${condData.name}`);
          }
        }
      }
    }

    onConditionsChange(updatedConditions);
    return true;
  }, [characterId, currentConditions, onConditionsChange]);

  /**
   * Remove todas as condições aplicadas por um ritual específico
   */
  const removeRitualConditions = useCallback((ritualSourceId: string) => {
    const updatedConditions = currentConditions.filter(c => c.source !== ritualSourceId);
    
    const removedCount = currentConditions.length - updatedConditions.length;
    if (removedCount > 0) {
      toast.info(`${removedCount} condição(ões) de ritual removida(s)`);
    }
    
    onConditionsChange(updatedConditions);
  }, [currentConditions, onConditionsChange]);

  /**
   * Verifica se o personagem está protegido por modo Inverso de Velocidade Mortal
   * e calcula o dano transferido
   */
  const processIncomingDamage = useCallback((damage: number): {
    finalDamage: number;
    transferredDamage: number;
    protectorId: string | null;
    protectorName: string | null;
    message: string | null;
  } => {
    const protector = getInverseProtector(characterId);
    
    if (!protector) {
      return {
        finalDamage: damage,
        transferredDamage: 0,
        protectorId: null,
        protectorName: null,
        message: null,
      };
    }

    const { casterDamage, targetDamage } = calculateInverseDamageTransfer(damage);
    
    return {
      finalDamage: targetDamage,
      transferredDamage: casterDamage,
      protectorId: protector.casterId,
      protectorName: protector.casterName,
      message: `${protector.casterName} absorve ${casterDamage} de dano através de ${protector.ritualName} (modo Inverso)`,
    };
  }, [characterId]);

  /**
   * Verifica se o personagem está protegendo alguém com modo Inverso
   */
  const getProtectionInfo = useCallback(() => {
    return getInverseProtectionTarget(characterId);
  }, [characterId]);

  /**
   * Retorna os modos disponíveis para um ritual
   */
  const getModesForRitual = useCallback((ritualId: string) => {
    if (!ritualHasModes(ritualId)) return [];
    
    return getAvailableModesForRitual(ritualId).map(modeName => ({
      name: modeName,
      description: getRitualModeDescription(ritualId, modeName) || '',
    }));
  }, []);

  /**
   * Verifica se o personagem tem alguma condição de ritual ativa
   */
  const hasRitualCondition = useCallback((conditionId: string) => {
    return currentConditions.some(c => c.id === conditionId);
  }, [currentConditions]);

  /**
   * Retorna condições de ritual ativas
   */
  const getRitualConditions = useCallback(() => {
    return currentConditions.filter(c => c.source);
  }, [currentConditions]);

  return {
    activateRitualMode,
    removeRitualConditions,
    processIncomingDamage,
    getProtectionInfo,
    getModesForRitual,
    hasRitualCondition,
    getRitualConditions,
  };
}

/**
 * Função utilitária para obter o ícone da condição de modo
 */
export function getRitualConditionIcon(conditionId: string): string {
  const iconMap: Record<string, string> = {
    'velocidade-mortal-inverso': '🛡️⏱️',
    'velocidade-mortal-buff': '⚡',
    'velocidade-mortal-discente': '⚡⚡',
  };
  return iconMap[conditionId] || '✨';
}

/**
 * Função para verificar se uma condição é de ritual
 */
export function isRitualCondition(conditionId: string): boolean {
  return conditionId.startsWith('velocidade-mortal-') || 
         conditionId.includes('-buff') || 
         conditionId.includes('-inverso') ||
         conditionId.includes('-discente');
}
