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
  /** ID do bônus condicional a ser ativado (se aplicável) */
  conditionalBonusId?: string;
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
  /** Callback para ativar/desativar bônus condicionais */
  onToggleConditionalBonus?: (bonusId: string, active: boolean) => void;
  /** Lista de bônus condicionais ativos (para indicador visual) */
  activeConditionalBonuses?: string[];
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
  /** Verifica se o bônus condicional de um poder está ativo */
  isBonusActive: (powerId: string) => boolean;
}

// =====================================================
// Catálogo de Poderes Ativáveis do Combatente
// =====================================================

export const ACTIVATABLE_COMBATENTE_POWERS: ActivatableClassPower[] = [
  // ===== PODERES ATIVÁVEIS COM CUSTO DE PE =====
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
    id: 'ataque-de-oportunidade',
    name: 'Ataque de Oportunidade',
    shortEffect: 'Ataque corpo a corpo quando inimigo sai de adjacência',
    description: 'Quando um ser sai voluntariamente de um espaço adjacente ao seu, você pode gastar uma reação e 1 PE para fazer um ataque corpo a corpo contra ele.',
    basePECost: 1,
    limit: 'none',
    minNex: 15,
    icon: 'swords',
    pageRef: 'Livro Base p.46',
  },
  {
    id: 'golpe-demolidor',
    name: 'Golpe Demolidor',
    shortEffect: 'Dobra dano contra objetos/manobra quebrar',
    description: 'Quando usa a manobra quebrar ou ataca um objeto, você pode gastar 1 PE para causar o dobro de dano.',
    basePECost: 1,
    limit: 'none',
    minNex: 15,
    icon: 'swords',
    pageRef: 'Livro Base p.46',
  },
  {
    id: 'presteza-atletica',
    name: 'Presteza Atlética',
    shortEffect: 'Usa For/Agi em teste de investigação, aliado ganha +1d20',
    description: 'Ao facilitar uma investigação, você pode gastar 1 PE para usar Força ou Agilidade no lugar do atributo-base. Se passar, o próximo aliado a usar o bônus recebe +1d20.',
    basePECost: 1,
    limit: 'none',
    minNex: 15,
    icon: 'search',
    pageRef: 'Livro Base p.46',
  },
  {
    id: 'sentido-tatico',
    name: 'Sentido Tático',
    shortEffect: '+Int em Defesa e resistências até fim da cena',
    description: 'Você pode gastar uma ação de movimento e 2 PE para analisar o ambiente. Recebe bônus em Defesa e testes de resistência igual ao seu Intelecto até o final da cena.',
    basePECost: 2,
    limit: 'perScene',
    minNex: 15,
    icon: 'shield',
    pageRef: 'Livro Base p.47',
    conditionalBonusId: 'sentido-tatico', // Ativa bônus de +INT Defesa/Resistências
  },
  {
    id: 'tiro-de-cobertura',
    name: 'Tiro de Cobertura',
    shortEffect: 'Força inimigo a se proteger (efeito de medo)',
    description: 'Você pode gastar uma ação padrão e 1 PE para disparar na direção de um ser. Faça Pontaria contra Vontade do alvo. Se vencer, ele não pode sair do lugar e sofre -5 em ataques.',
    basePECost: 1,
    limit: 'none',
    minNex: 15,
    icon: 'crosshair',
    pageRef: 'Livro Base p.47',
  },
  
  // ===== PODERES SEM CUSTO DE PE (ATIVAÇÃO OPCIONAL) =====
  {
    id: 'combate-defensivo',
    name: 'Combate Defensivo',
    shortEffect: '-2 ataque, +5 Defesa até o próximo turno',
    description: 'Ao usar a ação agredir, você pode combater defensivamente. Sofre -2 em todos os testes de ataque, mas recebe +5 na Defesa até o seu próximo turno.',
    basePECost: 0,
    limit: 'perRound',
    minNex: 15,
    icon: 'shield',
    pageRef: 'Livro Base p.46',
    conditionalBonusId: 'combate-defensivo', // Ativa bônus de -2 ataque, +5 Defesa
  },
  {
    id: 'combater-duas-armas',
    name: 'Combater com Duas Armas',
    shortEffect: '-2 ataque, dois ataques (até próximo turno)',
    description: 'Se estiver empunhando duas armas (pelo menos uma leve) e fizer a ação agredir, pode fazer dois ataques. Sofre -2 em todos os testes de ataque até o próximo turno.',
    basePECost: 0,
    limit: 'perRound',
    minNex: 15,
    icon: 'swords',
    pageRef: 'Livro Base p.46',
    conditionalBonusId: 'combater-duas-armas', // Ativa penalidade de -2 ataque
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
  const { 
    classPowers, 
    abilities, 
    nex, 
    peCurrent, 
    onPEChange, 
    onTrackPESpent,
    onToggleConditionalBonus,
    activeConditionalBonuses = [],
  } = props;

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

    // Ativa bônus condicional se definido
    if (power.conditionalBonusId && onToggleConditionalBonus) {
      onToggleConditionalBonus(power.conditionalBonusId, true);
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
  }, [canAfford, getCurrentCost, usageStates, peCurrent, onPEChange, onTrackPESpent, onToggleConditionalBonus]);

  // Reset por turno (limpa Segurar o Gatilho)
  const resetTurn = useCallback(() => {
    // Desativa bônus condicionais de poderes perTurn
    ACTIVATABLE_COMBATENTE_POWERS.forEach((power) => {
      if (power.limit === 'perTurn' && power.conditionalBonusId && onToggleConditionalBonus) {
        onToggleConditionalBonus(power.conditionalBonusId, false);
      }
    });

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
  }, [onToggleConditionalBonus]);

  // Reset por rodada
  const resetRound = useCallback(() => {
    // Desativa bônus condicionais de poderes perRound e perTurn
    ACTIVATABLE_COMBATENTE_POWERS.forEach((power) => {
      if ((power.limit === 'perRound' || power.limit === 'perTurn') && 
          power.conditionalBonusId && onToggleConditionalBonus) {
        onToggleConditionalBonus(power.conditionalBonusId, false);
      }
    });

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
  }, [onToggleConditionalBonus]);

  // Reset por cena
  const resetScene = useCallback(() => {
    // Desativa TODOS os bônus condicionais de poderes ativáveis
    ACTIVATABLE_COMBATENTE_POWERS.forEach((power) => {
      if (power.conditionalBonusId && onToggleConditionalBonus) {
        onToggleConditionalBonus(power.conditionalBonusId, false);
      }
    });

    setUsageStates({});
  }, [onToggleConditionalBonus]);

  // Verifica se um bônus condicional de poder está ativo
  const isBonusActive = useCallback((powerId: string): boolean => {
    const power = ACTIVATABLE_COMBATENTE_POWERS.find((p) => p.id === powerId);
    if (!power?.conditionalBonusId) return false;
    return activeConditionalBonuses.includes(power.conditionalBonusId);
  }, [activeConditionalBonuses]);

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
    isBonusActive,
  };
}
