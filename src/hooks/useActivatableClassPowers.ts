/**
 * useActivatableClassPowers - Hook para gerenciar poderes de classe ativáveis
 * 
 * Gerencia poderes que gastam PE e têm limites por cena/rodada/turno:
 * - Incansável (2 PE, 1x/cena) - Ação de investigação extra com +5
 * - Segurar o Gatilho (2 PE × ataques, por turno) - Ataque extra com arma de fogo
 * - Combate Defensivo (livre, 1x/rodada) - -5 ataque, +2 Defesa
 * - Golpe Pesado (1 PE, por ataque) - Troca penalidade por dano
 * 
 * @module hooks/useActivatableClassPowers
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

// =====================================================
// Tipos e Interfaces
// =====================================================

/** Tipos de limite de uso */
export type UsageLimit = 'none' | 'perTurn' | 'perRound' | 'perScene';

/** Configuração de um poder ativável */
export interface ActivatableClassPower {
  /** ID único do poder */
  id: string;
  /** Nome de exibição */
  name: string;
  /** Descrição breve do efeito */
  shortEffect: string;
  /** Descrição completa */
  description: string;
  /** Custo base de PE */
  basePECost: number;
  /** Se o custo escala (ex: Segurar o Gatilho) */
  scalingCost?: {
    /** Multiplicador por uso */
    multiplier: number;
    /** Descrição do escalonamento */
    description: string;
  };
  /** Limite de uso */
  limit: UsageLimit;
  /** NEX mínimo para ter o poder */
  minNex: number;
  /** Ícone para exibição */
  icon: 'search' | 'crosshair' | 'shield' | 'swords' | 'zap';
  /** Página de referência */
  pageRef: string;
}

/** Estado de uso de um poder */
export interface PowerUsageState {
  /** Quantidade de vezes usado (para escalonamento) */
  usageCount: number;
  /** Se está marcado como usado (para limites absolutos) */
  isUsed: boolean;
}

/** Props do hook */
export interface UseActivatableClassPowersProps {
  /** Poderes de classe do personagem (JSON) */
  classPowers: unknown[];
  /** Habilidades do personagem (JSON) */
  abilities: Record<string, unknown>;
  /** NEX atual */
  nex: number;
  /** PE atual */
  peCurrent: number;
  /** Callback para alterar PE */
  onPEChange: (newPE: number) => void;
  /** Callback para registrar PE gasto na rodada */
  onTrackPESpent?: (abilityName: string, cost: number) => void;
}

/** Retorno do hook */
export interface UseActivatableClassPowersReturn {
  /** Lista de poderes ativáveis disponíveis */
  availablePowers: ActivatableClassPower[];
  /** Estado de uso de cada poder */
  usageStates: Record<string, PowerUsageState>;
  /** Verifica se pode pagar o custo atual de um poder */
  canAfford: (powerId: string) => boolean;
  /** Calcula o custo atual de um poder (considerando escalonamento) */
  getCurrentCost: (powerId: string) => number;
  /** Ativa um poder (gasta PE e marca como usado) */
  usePower: (powerId: string) => boolean;
  /** Reseta poderes por turno */
  resetTurn: () => void;
  /** Reseta poderes por rodada */
  resetRound: () => void;
  /** Reseta poderes por cena */
  resetScene: () => void;
  /** Total de poderes disponíveis */
  totalPowers: number;
  /** Quantos poderes foram usados */
  usedCount: number;
}

// =====================================================
// Catálogo de Poderes Ativáveis do Combatente
// =====================================================

export const ACTIVATABLE_COMBATENTE_POWERS: ActivatableClassPower[] = [
  {
    id: 'incansavel',
    name: 'Incansável',
    shortEffect: 'Ação de investigação extra com +5',
    description: 'Você pode fazer uma ação de investigação adicional usando Força ou Agilidade como atributo-base. Você recebe +5 no teste.',
    basePECost: 2,
    limit: 'perScene',
    minNex: 15,
    icon: 'search',
    pageRef: 'Livro Base p.46',
  },
  {
    id: 'segurar-gatilho',
    name: 'Segurar o Gatilho',
    shortEffect: 'Ataque extra ao acertar com arma de fogo',
    description: 'Sempre que acerta um ataque com uma arma de fogo, pode fazer outro ataque com a mesma arma contra o mesmo alvo.',
    basePECost: 2,
    scalingCost: {
      multiplier: 1,
      description: '2 PE × ataques já realizados no turno',
    },
    limit: 'perTurn',
    minNex: 60,
    icon: 'crosshair',
    pageRef: 'Livro Base p.47',
  },
  {
    id: 'combate-defensivo',
    name: 'Combate Defensivo',
    shortEffect: '-5 ataque, +2 Defesa até o próximo turno',
    description: 'Ao atacar, você pode sofrer –5 no teste de ataque para receber +2 na Defesa até o seu próximo turno.',
    basePECost: 0,
    limit: 'perRound',
    minNex: 5,
    icon: 'shield',
    pageRef: 'Livro Base p.45',
  },
  {
    id: 'golpe-pesado',
    name: 'Golpe Pesado',
    shortEffect: 'Troca -5 ataque por +1d8 dano',
    description: 'Ao atacar, você pode gastar 1 PE para sofrer –5 no teste de ataque e adicionar +1d8 ao dano.',
    basePECost: 1,
    limit: 'none',
    minNex: 20,
    icon: 'swords',
    pageRef: 'Livro Base p.46',
  },
];

// =====================================================
// Funções Utilitárias
// =====================================================

/**
 * Verifica se o personagem possui um poder específico
 */
function hasPower(
  classPowers: unknown[],
  abilities: Record<string, unknown>,
  powerId: string,
  powerName: string
): boolean {
  // Verifica em classPowers
  if (Array.isArray(classPowers)) {
    const found = classPowers.some((power) => {
      if (typeof power === 'object' && power !== null) {
        const p = power as Record<string, unknown>;
        const id = String(p.id || '').toLowerCase();
        const name = String(p.name || '').toLowerCase();
        return id === powerId.toLowerCase() || name === powerName.toLowerCase();
      }
      return false;
    });
    if (found) return true;
  }

  // Verifica em abilities (formato legado)
  if (abilities && typeof abilities === 'object') {
    const abilityValues = Object.values(abilities);
    const found = abilityValues.some((ability) => {
      if (typeof ability === 'object' && ability !== null) {
        const a = ability as Record<string, unknown>;
        const id = String(a.id || '').toLowerCase();
        const name = String(a.name || '').toLowerCase();
        return id === powerId.toLowerCase() || name === powerName.toLowerCase();
      }
      return false;
    });
    if (found) return true;
  }

  return false;
}

// =====================================================
// Hook Principal
// =====================================================

export function useActivatableClassPowers(
  props: UseActivatableClassPowersProps
): UseActivatableClassPowersReturn {
  const { classPowers, abilities, nex, peCurrent, onPEChange, onTrackPESpent } = props;

  // Estado de uso de cada poder
  const [usageStates, setUsageStates] = useState<Record<string, PowerUsageState>>({});

  // Filtra poderes disponíveis para o personagem
  const availablePowers = useMemo(() => {
    return ACTIVATABLE_COMBATENTE_POWERS.filter((power) => {
      // Verifica NEX mínimo
      if (nex < power.minNex) return false;
      // Verifica se possui o poder
      return hasPower(classPowers, abilities, power.id, power.name);
    });
  }, [classPowers, abilities, nex]);

  // Calcula o custo atual de um poder
  const getCurrentCost = useCallback((powerId: string): number => {
    const power = ACTIVATABLE_COMBATENTE_POWERS.find((p) => p.id === powerId);
    if (!power) return 0;

    const state = usageStates[powerId] || { usageCount: 0, isUsed: false };

    // Se tem escalonamento, multiplica
    if (power.scalingCost) {
      // Para Segurar o Gatilho: 2 PE × (ataques já realizados + 1)
      // Primeiro ataque extra = 2 PE, segundo = 4 PE, terceiro = 6 PE...
      return power.basePECost * (state.usageCount + 1);
    }

    return power.basePECost;
  }, [usageStates]);

  // Verifica se pode pagar
  const canAfford = useCallback((powerId: string): boolean => {
    const power = ACTIVATABLE_COMBATENTE_POWERS.find((p) => p.id === powerId);
    if (!power) return false;

    const state = usageStates[powerId] || { usageCount: 0, isUsed: false };

    // Verifica limite de uso
    if (power.limit !== 'none' && state.isUsed) return false;

    // Verifica PE
    const cost = getCurrentCost(powerId);
    return peCurrent >= cost;
  }, [usageStates, peCurrent, getCurrentCost]);

  // Usa um poder
  const usePower = useCallback((powerId: string): boolean => {
    const power = ACTIVATABLE_COMBATENTE_POWERS.find((p) => p.id === powerId);
    if (!power) {
      toast.error('Poder não encontrado');
      return false;
    }

    if (!canAfford(powerId)) {
      toast.error('PE insuficiente ou poder já usado');
      return false;
    }

    const cost = getCurrentCost(powerId);
    const state = usageStates[powerId] || { usageCount: 0, isUsed: false };

    // Gasta PE
    if (cost > 0) {
      onPEChange(peCurrent - cost);
      onTrackPESpent?.(power.name, cost);
    }

    // Atualiza estado de uso
    setUsageStates((prev) => ({
      ...prev,
      [powerId]: {
        usageCount: state.usageCount + 1,
        isUsed: power.limit !== 'none', // Marca como usado se tiver limite
      },
    }));

    toast.success(`${power.name} ativado!`, {
      description: cost > 0 ? `${cost} PE gastos` : 'Sem custo de PE',
    });

    return true;
  }, [canAfford, getCurrentCost, usageStates, peCurrent, onPEChange, onTrackPESpent]);

  // Reset por turno (limpa Segurar o Gatilho)
  const resetTurn = useCallback(() => {
    setUsageStates((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        const power = ACTIVATABLE_COMBATENTE_POWERS.find((p) => p.id === id);
        if (power?.limit === 'perTurn') {
          next[id] = { usageCount: 0, isUsed: false };
        }
      });
      return next;
    });
  }, []);

  // Reset por rodada
  const resetRound = useCallback(() => {
    setUsageStates((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        const power = ACTIVATABLE_COMBATENTE_POWERS.find((p) => p.id === id);
        if (power?.limit === 'perRound' || power?.limit === 'perTurn') {
          next[id] = { usageCount: 0, isUsed: false };
        }
      });
      return next;
    });
  }, []);

  // Reset por cena
  const resetScene = useCallback(() => {
    setUsageStates({});
  }, []);

  // Contadores
  const usedCount = useMemo(() => {
    return Object.values(usageStates).filter((s) => s.isUsed || s.usageCount > 0).length;
  }, [usageStates]);

  return {
    availablePowers,
    usageStates,
    canAfford,
    getCurrentCost,
    usePower,
    resetTurn,
    resetRound,
    resetScene,
    totalPowers: availablePowers.length,
    usedCount,
  };
}
