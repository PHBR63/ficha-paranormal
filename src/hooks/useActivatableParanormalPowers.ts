/**
 * useActivatableParanormalPowers - Hook para gerenciar poderes paranormais ativáveis
 * 
 * Gerencia poderes paranormais que têm limites por cena/sessão ou custos especiais:
 * - Surto Temporal (1x ou 2x/cena) - Ação padrão extra
 * - Manipular Entropia (1x/cena) - Rolar 2d20 ou 3d20 e escolher
 * - Escapar da Morte (1x ou 2x/sessão) - Não morre ao chegar a 0 PV
 * - Arma de Sangue (custo: 2 PV) - Criar arma corpo a corpo
 * - Campo Protetor (ao esquivar) - +5 ou +10 Defesa
 * 
 * Segue o Livro Base v1.3 (páginas 114-116)
 * 
 * @module hooks/useActivatableParanormalPowers
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { SavedParanormalPower, ParanormalElement } from '@/lib/paranormal-powers';

// =====================================================
// Tipos e Interfaces
// =====================================================

/** Tipos de limite de uso para poderes paranormais */
export type ParanormalUsageLimit = 'none' | 'perTurn' | 'perRound' | 'perScene' | 'perSession';

/** Tipo de custo do poder */
export type PowerCostType = 'pe' | 'pv' | 'none';

/** Configuração de um poder paranormal ativável */
export interface ActivatableParanormalPower {
  /** ID único do poder (deve coincidir com o ID do catálogo de poderes) */
  id: string;
  /** Nome de exibição */
  name: string;
  /** Descrição breve do efeito */
  shortEffect: string;
  /** Descrição completa */
  description: string;
  /** Tipo de custo (PE, PV ou nenhum) */
  costType: PowerCostType;
  /** Valor do custo */
  costValue: number;
  /** Limite de uso */
  limit: ParanormalUsageLimit;
  /** Quantidade de usos por período (considerando afinidade ou não) */
  usesPerPeriod: number;
  /** Quantidade de usos com afinidade (se aplicável) */
  usesWithAffinity?: number;
  /** Elemento do poder (para calcular afinidade) */
  element: ParanormalElement | 'generic';
  /** Ícone para exibição */
  icon: 'zap' | 'clock' | 'dice' | 'heart' | 'shield' | 'sword' | 'sparkles' | 'skull';
  /** Página de referência no livro */
  pageRef: string;
  /** Se o poder é passivo (sempre ativo, sem ativação manual) */
  isPassive?: boolean;
  /** ID do bônus condicional no SUE (se aplicável) */
  conditionalBonusId?: string;
}

/** Estado de uso de um poder paranormal */
export interface ParanormalPowerUsageState {
  /** Quantidade de vezes usado no período atual */
  usageCount: number;
  /** Máximo de usos neste período */
  maxUses: number;
}

/** Props do hook */
export interface UseActivatableParanormalPowersProps {
  /** Poderes paranormais do personagem */
  paranormalPowers: SavedParanormalPower[] | null | undefined;
  /** NEX atual do personagem */
  nex: number;
  /** Elemento de afinidade (se houver) */
  elementalAffinity?: ParanormalElement | string | null;
  /** Se a afinidade está ativa (NEX >= 50%) */
  affinityActive?: boolean;
  /** PV atual */
  hpCurrent: number;
  /** PE atual */
  peCurrent: number;
  /** Callback para alterar HP */
  onHPChange: (newHP: number) => void;
  /** Callback para alterar PE */
  onPEChange: (newPE: number) => void;
  /** Callback para registrar PE gasto */
  onTrackPESpent?: (abilityName: string, cost: number) => void;
  /** Callback para ativar/desativar bônus condicionais */
  onToggleConditionalBonus?: (bonusId: string, active: boolean) => void;
  /** Lista de bônus condicionais ativos */
  activeConditionalBonuses?: string[];
}

/** Retorno do hook */
export interface UseActivatableParanormalPowersReturn {
  /** Lista de poderes ativáveis disponíveis */
  availablePowers: (ActivatableParanormalPower & { hasAffinity: boolean })[];
  /** Estado de uso de cada poder */
  usageStates: Record<string, ParanormalPowerUsageState>;
  /** Verifica se pode usar um poder */
  canUse: (powerId: string) => boolean;
  /** Calcula o custo atual de um poder */
  getCost: (powerId: string) => { type: PowerCostType; value: number };
  /** Quantidade de usos restantes */
  getRemainingUses: (powerId: string) => number;
  /** Usa um poder */
  usePower: (powerId: string) => boolean;
  /** Reseta poderes por turno */
  resetTurn: () => void;
  /** Reseta poderes por rodada */
  resetRound: () => void;
  /** Reseta poderes por cena */
  resetScene: () => void;
  /** Reseta poderes por sessão */
  resetSession: () => void;
  /** Total de poderes ativáveis */
  totalPowers: number;
  /** Quantos poderes foram usados */
  usedCount: number;
  /** Verifica se um bônus condicional está ativo */
  isBonusActive: (powerId: string) => boolean;
}

// =====================================================
// Catálogo de Poderes Paranormais Ativáveis
// =====================================================

/**
 * Poderes paranormais que requerem ativação manual
 * Baseado no Livro Base v1.3 (páginas 114-116)
 */
export const ACTIVATABLE_PARANORMAL_POWERS: ActivatableParanormalPower[] = [
  // ===== PODERES DE SANGUE =====
  {
    id: 'arma-de-sangue',
    name: 'Arma de Sangue',
    shortEffect: 'Cria arma corpo a corpo (1d10, ameaça 19)',
    description: 'Você pode gastar 2 PV para criar uma arma corpo a corpo feita de sangue cristalizado. A arma tem dano de 1d10 e ameaça em 19.',
    costType: 'pv',
    costValue: 2,
    limit: 'none',
    usesPerPeriod: 999, // Sem limite de uso
    element: 'sangue',
    icon: 'sword',
    pageRef: 'Livro Base p.114',
  },
  {
    id: 'sangue-vivo',
    name: 'Sangue Vivo',
    shortEffect: 'Regenera 1d6 (ou 2d6) PV no início do turno',
    description: 'Você regenera 1d6 pontos de vida no início de cada um de seus turnos. Com afinidade, regenera 2d6 PV.',
    costType: 'none',
    costValue: 0,
    limit: 'perTurn',
    usesPerPeriod: 1,
    element: 'sangue',
    icon: 'heart',
    pageRef: 'Livro Base p.114',
  },

  // ===== PODERES DE MORTE =====
  {
    id: 'escapar-da-morte',
    name: 'Escapar da Morte',
    shortEffect: 'Ao cair a 0 PV, fica com 1 PV',
    description: 'Uma vez por sessão, quando você seria reduzido a 0 PV ou menos, você fica com 1 PV. Com afinidade: 2x por sessão.',
    costType: 'none',
    costValue: 0,
    limit: 'perSession',
    usesPerPeriod: 1,
    usesWithAffinity: 2,
    element: 'morte',
    icon: 'skull',
    pageRef: 'Livro Base p.115',
  },
  {
    id: 'surto-temporal',
    name: 'Surto Temporal',
    shortEffect: 'Ação padrão adicional no seu turno',
    description: 'Uma vez por cena, você pode realizar uma ação padrão adicional no seu turno. Com afinidade: 2x por cena.',
    costType: 'none',
    costValue: 0,
    limit: 'perScene',
    usesPerPeriod: 1,
    usesWithAffinity: 2,
    element: 'morte',
    icon: 'clock',
    pageRef: 'Livro Base p.115',
  },
  {
    id: 'potencial-reaproveitado',
    name: 'Potencial Reaproveitado',
    shortEffect: 'Recupera PE ao matar criatura',
    description: 'Ao matar uma criatura paranormal, você recupera PE igual ao círculo máximo de ritual dela (mínimo 1). Com afinidade: recupera o dobro.',
    costType: 'none',
    costValue: 0,
    limit: 'none',
    usesPerPeriod: 999,
    element: 'morte',
    icon: 'zap',
    pageRef: 'Livro Base p.115',
    isPassive: true,
  },

  // ===== PODERES DE CONHECIMENTO =====
  {
    id: 'percepcao-paranormal',
    name: 'Percepção Paranormal',
    shortEffect: 'Detecta presenças paranormais',
    description: 'Você detecta a presença de criaturas e objetos paranormais em alcance médio, sabendo a direção e distância. Com afinidade: sabe elemento e círculo.',
    costType: 'none',
    costValue: 0,
    limit: 'none',
    usesPerPeriod: 999,
    element: 'conhecimento',
    icon: 'sparkles',
    pageRef: 'Livro Base p.115',
    isPassive: true,
  },

  // ===== PODERES DE ENERGIA =====
  {
    id: 'afortunado',
    name: 'Afortunado',
    shortEffect: 'Rerola resultado 1 (ou 1-2) em d20',
    description: 'Sempre que rolar 1 em um d20, você pode rerolar o dado. Com afinidade: pode rerolar resultado 1 ou 2.',
    costType: 'none',
    costValue: 0,
    limit: 'none',
    usesPerPeriod: 999,
    element: 'energia',
    icon: 'dice',
    pageRef: 'Livro Base p.116',
    isPassive: true,
  },
  {
    id: 'campo-protetor',
    name: 'Campo Protetor',
    shortEffect: '+5 (ou +10) Defesa ao esquivar',
    description: 'Você recebe +5 em Defesa quando usa a ação esquivar. Com afinidade: +10 em Defesa.',
    costType: 'none',
    costValue: 0,
    limit: 'perRound',
    usesPerPeriod: 1,
    element: 'energia',
    icon: 'shield',
    pageRef: 'Livro Base p.116',
    conditionalBonusId: 'campo-protetor',
  },
  {
    id: 'manipular-entropia',
    name: 'Manipular Entropia',
    shortEffect: 'Rola 2d20 (ou 3d20) e escolhe o melhor',
    description: 'Uma vez por cena, você pode rolar 2d20 em um teste e escolher o melhor resultado. Com afinidade: rola 3d20.',
    costType: 'none',
    costValue: 0,
    limit: 'perScene',
    usesPerPeriod: 1,
    element: 'energia',
    icon: 'dice',
    pageRef: 'Livro Base p.116',
  },
  {
    id: 'causalidade-fortuita',
    name: 'Causalidade Fortuita',
    shortEffect: 'Crítico causa condição aleatória',
    description: 'Quando você acerta um ataque crítico, o alvo sofre uma condição aleatória por 1 rodada. Com afinidade: dura 1d4 rodadas.',
    costType: 'none',
    costValue: 0,
    limit: 'none',
    usesPerPeriod: 999,
    element: 'energia',
    icon: 'sparkles',
    pageRef: 'Livro Base p.116',
    isPassive: true,
  },
];

// =====================================================
// Hook Principal
// =====================================================

export function useActivatableParanormalPowers(
  props: UseActivatableParanormalPowersProps
): UseActivatableParanormalPowersReturn {
  const {
    paranormalPowers,
    nex,
    elementalAffinity,
    affinityActive = false,
    hpCurrent,
    peCurrent,
    onHPChange,
    onPEChange,
    onTrackPESpent,
    onToggleConditionalBonus,
    activeConditionalBonuses = [],
  } = props;

  // Estado de uso de cada poder
  const [usageStates, setUsageStates] = useState<Record<string, ParanormalPowerUsageState>>({});

  // Verifica se o personagem possui um poder específico
  const hasPower = useCallback((powerId: string): boolean => {
    if (!paranormalPowers || paranormalPowers.length === 0) return false;
    return paranormalPowers.some(p => p.id === powerId);
  }, [paranormalPowers]);

  // Verifica se o poder tem bônus de afinidade
  const hasAffinityBonus = useCallback((power: ActivatableParanormalPower): boolean => {
    if (!affinityActive || !elementalAffinity) return false;
    if (power.element === 'generic') return false;
    return power.element === elementalAffinity;
  }, [affinityActive, elementalAffinity]);

  // Filtra poderes disponíveis (que o personagem possui e não são passivos)
  const availablePowers = useMemo(() => {
    return ACTIVATABLE_PARANORMAL_POWERS
      .filter(power => hasPower(power.id) && !power.isPassive)
      .map(power => ({
        ...power,
        hasAffinity: hasAffinityBonus(power),
      }));
  }, [hasPower, hasAffinityBonus]);

  // Calcula o máximo de usos para um poder
  const getMaxUses = useCallback((power: ActivatableParanormalPower): number => {
    const hasAff = hasAffinityBonus(power);
    if (hasAff && power.usesWithAffinity !== undefined) {
      return power.usesWithAffinity;
    }
    return power.usesPerPeriod;
  }, [hasAffinityBonus]);

  // Calcula o custo de um poder
  const getCost = useCallback((powerId: string): { type: PowerCostType; value: number } => {
    const power = ACTIVATABLE_PARANORMAL_POWERS.find(p => p.id === powerId);
    if (!power) return { type: 'none', value: 0 };
    return { type: power.costType, value: power.costValue };
  }, []);

  // Calcula usos restantes
  const getRemainingUses = useCallback((powerId: string): number => {
    const power = ACTIVATABLE_PARANORMAL_POWERS.find(p => p.id === powerId);
    if (!power) return 0;
    
    const maxUses = getMaxUses(power);
    const state = usageStates[powerId] || { usageCount: 0, maxUses };
    
    return Math.max(0, maxUses - state.usageCount);
  }, [getMaxUses, usageStates]);

  // Verifica se pode usar um poder
  const canUse = useCallback((powerId: string): boolean => {
    const power = ACTIVATABLE_PARANORMAL_POWERS.find(p => p.id === powerId);
    if (!power) return false;
    if (!hasPower(powerId)) return false;

    // Verifica limite de uso
    const remaining = getRemainingUses(powerId);
    if (power.limit !== 'none' && remaining <= 0) return false;

    // Verifica custo
    const cost = getCost(powerId);
    if (cost.type === 'pe' && peCurrent < cost.value) return false;
    if (cost.type === 'pv' && hpCurrent < cost.value) return false;

    return true;
  }, [hasPower, getRemainingUses, getCost, peCurrent, hpCurrent]);

  // Usa um poder
  const usePower = useCallback((powerId: string): boolean => {
    const power = ACTIVATABLE_PARANORMAL_POWERS.find(p => p.id === powerId);
    if (!power) {
      toast.error('Poder não encontrado');
      return false;
    }

    if (!canUse(powerId)) {
      toast.error('Não é possível usar este poder agora');
      return false;
    }

    const cost = getCost(powerId);
    const maxUses = getMaxUses(power);
    const state = usageStates[powerId] || { usageCount: 0, maxUses };

    // Gasta recurso
    if (cost.type === 'pe' && cost.value > 0) {
      onPEChange(peCurrent - cost.value);
      onTrackPESpent?.(power.name, cost.value);
    } else if (cost.type === 'pv' && cost.value > 0) {
      onHPChange(hpCurrent - cost.value);
    }

    // Ativa bônus condicional se definido
    if (power.conditionalBonusId && onToggleConditionalBonus) {
      onToggleConditionalBonus(power.conditionalBonusId, true);
    }

    // Atualiza estado de uso
    setUsageStates(prev => ({
      ...prev,
      [powerId]: {
        usageCount: state.usageCount + 1,
        maxUses,
      },
    }));

    // Mensagem de sucesso
    const hasAff = hasAffinityBonus(power);
    const affinityLabel = hasAff ? ' (Afinidade)' : '';
    
    let costLabel = '';
    if (cost.type === 'pe' && cost.value > 0) {
      costLabel = `${cost.value} PE gastos`;
    } else if (cost.type === 'pv' && cost.value > 0) {
      costLabel = `${cost.value} PV gastos`;
    }

    toast.success(`${power.name}${affinityLabel} ativado!`, {
      description: costLabel || `Usos restantes: ${getRemainingUses(powerId) - 1}`,
    });

    return true;
  }, [canUse, getCost, getMaxUses, usageStates, peCurrent, hpCurrent, onPEChange, onHPChange, onTrackPESpent, onToggleConditionalBonus, hasAffinityBonus, getRemainingUses]);

  // Reseta poderes por turno
  const resetTurn = useCallback(() => {
    ACTIVATABLE_PARANORMAL_POWERS.forEach(power => {
      if (power.limit === 'perTurn' && power.conditionalBonusId && onToggleConditionalBonus) {
        onToggleConditionalBonus(power.conditionalBonusId, false);
      }
    });

    setUsageStates(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        const power = ACTIVATABLE_PARANORMAL_POWERS.find(p => p.id === id);
        if (power?.limit === 'perTurn') {
          next[id] = { usageCount: 0, maxUses: next[id]?.maxUses || 1 };
        }
      });
      return next;
    });
  }, [onToggleConditionalBonus]);

  // Reseta poderes por rodada
  const resetRound = useCallback(() => {
    ACTIVATABLE_PARANORMAL_POWERS.forEach(power => {
      if ((power.limit === 'perRound' || power.limit === 'perTurn') && 
          power.conditionalBonusId && onToggleConditionalBonus) {
        onToggleConditionalBonus(power.conditionalBonusId, false);
      }
    });

    setUsageStates(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        const power = ACTIVATABLE_PARANORMAL_POWERS.find(p => p.id === id);
        if (power?.limit === 'perRound' || power?.limit === 'perTurn') {
          next[id] = { usageCount: 0, maxUses: next[id]?.maxUses || 1 };
        }
      });
      return next;
    });
  }, [onToggleConditionalBonus]);

  // Reseta poderes por cena
  const resetScene = useCallback(() => {
    ACTIVATABLE_PARANORMAL_POWERS.forEach(power => {
      if ((power.limit === 'perScene' || power.limit === 'perRound' || power.limit === 'perTurn') && 
          power.conditionalBonusId && onToggleConditionalBonus) {
        onToggleConditionalBonus(power.conditionalBonusId, false);
      }
    });

    setUsageStates(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        const power = ACTIVATABLE_PARANORMAL_POWERS.find(p => p.id === id);
        if (power && power.limit !== 'perSession') {
          next[id] = { usageCount: 0, maxUses: next[id]?.maxUses || 1 };
        }
      });
      return next;
    });
  }, [onToggleConditionalBonus]);

  // Reseta poderes por sessão (todos)
  const resetSession = useCallback(() => {
    ACTIVATABLE_PARANORMAL_POWERS.forEach(power => {
      if (power.conditionalBonusId && onToggleConditionalBonus) {
        onToggleConditionalBonus(power.conditionalBonusId, false);
      }
    });

    setUsageStates({});
  }, [onToggleConditionalBonus]);

  // Verifica se um bônus condicional está ativo
  const isBonusActive = useCallback((powerId: string): boolean => {
    const power = ACTIVATABLE_PARANORMAL_POWERS.find(p => p.id === powerId);
    if (!power?.conditionalBonusId) return false;
    return activeConditionalBonuses.includes(power.conditionalBonusId);
  }, [activeConditionalBonuses]);

  // Contadores
  const usedCount = useMemo(() => {
    return Object.values(usageStates).filter(s => s.usageCount > 0).length;
  }, [usageStates]);

  return {
    availablePowers,
    usageStates,
    canUse,
    getCost,
    getRemainingUses,
    usePower,
    resetTurn,
    resetRound,
    resetScene,
    resetSession,
    totalPowers: availablePowers.length,
    usedCount,
    isBonusActive,
  };
}
