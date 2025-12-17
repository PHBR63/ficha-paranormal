// Hook para aplicação automática de condições baseado em recursos do personagem
// Ordem Paranormal RPG v1.3

import { useCallback } from 'react';
import { 
  checkAutoConditions, 
  processDyingCounter,
  reduceDyingCounterFromDamage,
  stabilizeDyingCharacter,
  type AutoConditionResult,
  type DyingResult 
} from '@/lib/game-engine';
import { toast } from 'sonner';

/**
 * Interface para condição ativa (como salvo no banco)
 */
export interface ActiveCondition {
  id: string;
  name: string;
  turnsRemaining: number | null;
  addedAt: string;
  dyingCounter?: number; // Para condição morrendo
}

/**
 * Interface para resultado do processamento de condições
 */
export interface ConditionProcessResult {
  newConditions: ActiveCondition[];
  messages: string[];
  isDead: boolean;
}

/**
 * Hook para gerenciar aplicação automática de condições
 */
export function useAutoConditions() {
  /**
   * Processa mudanças de HP/SAN e aplica condições automaticamente
   */
  const processResourceChange = useCallback((
    hp: number,
    hpMax: number,
    san: number,
    sanMax: number,
    currentConditions: ActiveCondition[]
  ): ConditionProcessResult => {
    // Extrai IDs das condições atuais
    const conditionIds = currentConditions.map(c => c.id);
    
    // Verifica condições automáticas
    const result = checkAutoConditions(hp, hpMax, san, sanMax, conditionIds);
    
    let newConditions = [...currentConditions];
    const allMessages: string[] = [];
    let isDead = false;

    // Remove condições que devem ser removidas
    if (result.conditionsToRemove.length > 0) {
      newConditions = newConditions.filter(c => !result.conditionsToRemove.includes(c.id));
    }

    // Adiciona novas condições
    for (const conditionId of result.conditionsToAdd) {
      // Verifica se já não existe
      if (!newConditions.some(c => c.id === conditionId)) {
        const newCondition: ActiveCondition = {
          id: conditionId,
          name: getConditionName(conditionId),
          turnsRemaining: null,
          addedAt: new Date().toISOString(),
        };

        // Se for morrendo, adiciona contador
        if (conditionId === 'morrendo' && result.dyingCounter !== undefined) {
          newCondition.dyingCounter = result.dyingCounter;
        }

        newConditions.push(newCondition);
      }
    }

    // Exibe mensagens
    for (const message of result.messages) {
      allMessages.push(message);
      
      // Toast visual para condições críticas
      if (message.includes('MORRENDO') || message.includes('enlouquecendo')) {
        toast.error(message, { duration: 5000 });
      } else if (message.includes('estabilizado') || message.includes('recuperou')) {
        toast.success(message, { duration: 3000 });
      } else {
        toast.warning(message, { duration: 3000 });
      }
    }

    return {
      newConditions,
      messages: allMessages,
      isDead,
    };
  }, []);

  /**
   * Processa início de turno para personagem com condição Morrendo
   */
  const processDyingTurn = useCallback((
    currentConditions: ActiveCondition[]
  ): ConditionProcessResult => {
    const morrendoCondition = currentConditions.find(c => c.id === 'morrendo');
    
    if (!morrendoCondition || morrendoCondition.dyingCounter === undefined) {
      return {
        newConditions: currentConditions,
        messages: [],
        isDead: false,
      };
    }

    const result = processDyingCounter(morrendoCondition.dyingCounter);
    const allMessages: string[] = [result.message];

    if (result.isDead) {
      toast.error(result.message, { duration: 10000 });
      return {
        newConditions: currentConditions,
        messages: allMessages,
        isDead: true,
      };
    }

    // Atualiza contador
    const newConditions = currentConditions.map(c => {
      if (c.id === 'morrendo') {
        return { ...c, dyingCounter: result.newCounter };
      }
      return c;
    });

    toast.warning(result.message, { duration: 5000 });

    return {
      newConditions,
      messages: allMessages,
      isDead: false,
    };
  }, []);

  /**
   * Processa dano adicional enquanto morrendo
   */
  const processDamageWhileDying = useCallback((
    currentConditions: ActiveCondition[],
    damageReceived: number
  ): ConditionProcessResult => {
    const morrendoCondition = currentConditions.find(c => c.id === 'morrendo');
    
    if (!morrendoCondition || morrendoCondition.dyingCounter === undefined) {
      return {
        newConditions: currentConditions,
        messages: [],
        isDead: false,
      };
    }

    const result = reduceDyingCounterFromDamage(morrendoCondition.dyingCounter, damageReceived);
    const allMessages: string[] = result.message ? [result.message] : [];

    if (result.isDead) {
      toast.error(result.message, { duration: 10000 });
      return {
        newConditions: currentConditions,
        messages: allMessages,
        isDead: true,
      };
    }

    // Atualiza contador
    const newConditions = currentConditions.map(c => {
      if (c.id === 'morrendo') {
        return { ...c, dyingCounter: result.newCounter };
      }
      return c;
    });

    if (result.message) {
      toast.warning(result.message, { duration: 5000 });
    }

    return {
      newConditions,
      messages: allMessages,
      isDead: false,
    };
  }, []);

  /**
   * Estabiliza personagem morrendo (teste de Medicina bem sucedido)
   */
  const stabilizeCharacter = useCallback((
    currentConditions: ActiveCondition[]
  ): { newConditions: ActiveCondition[]; newHP: number; message: string } => {
    const result = stabilizeDyingCharacter();
    
    // Remove morrendo, mantém inconsciente
    const newConditions = currentConditions.filter(c => c.id !== 'morrendo');
    
    // Garante que inconsciente está presente
    if (!newConditions.some(c => c.id === 'inconsciente')) {
      newConditions.push({
        id: 'inconsciente',
        name: 'Inconsciente',
        turnsRemaining: null,
        addedAt: new Date().toISOString(),
      });
    }

    toast.success(result.message, { duration: 5000 });

    return {
      newConditions,
      newHP: result.newHP,
      message: result.message,
    };
  }, []);

  return {
    processResourceChange,
    processDyingTurn,
    processDamageWhileDying,
    stabilizeCharacter,
  };
}

/**
 * Helper para obter nome da condição
 */
function getConditionName(id: string): string {
  const names: Record<string, string> = {
    inconsciente: 'Inconsciente',
    morrendo: 'Morrendo',
    enlouquecendo: 'Enlouquecendo',
    perturbado: 'Perturbado',
  };
  return names[id] || id;
}
