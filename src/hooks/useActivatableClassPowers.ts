/**
 * useActivatableClassPowers - Hook para gerenciar poderes de classe ativáveis
 * 
 * Gerencia poderes que gastam PE e têm limites por cena/rodada/turno:
 * - Incansável (2 PE, 1x/cena) - Investigação extra usando Força ou Agilidade
 * - Segurar o Gatilho (2 PE × ataques, por turno) - Ataque extra com arma de fogo
 * - Combate Defensivo - Penalidade em ataques e +5 Defesa
 * - Golpe Demolidor (1 PE) - Dois dados extras contra objetos
 * 
 * @module hooks/useActivatableClassPowers
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
    shortEffect: 'Investigação extra usando Força ou Agilidade',
    description: 'Uma vez por cena, você pode fazer uma ação de investigação adicional usando Força ou Agilidade como atributo-base, sem bônus numérico adicional.',
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
    shortEffect: '+2 dados de dano contra objetos/manobra quebrar',
    description: 'Quando usa a manobra quebrar ou ataca um objeto, você pode gastar 1 PE para causar dois dados de dano extra do mesmo tipo de sua arma.',
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
    conditionalBonusId: 'sentido-tatico',
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
    shortEffect: '-1d20 ataque, +5 Defesa até o próximo turno',
    description: 'Ao usar a ação agredir, você pode combater defensivamente. Sofre -1d20 em todos os testes de ataque, mas recebe +5 na Defesa até o seu próximo turno.',
    basePECost: 0,
    limit: 'perRound',
    minNex: 15,
    icon: 'shield',
    pageRef: 'Livro Base p.46',
    conditionalBonusId: 'combate-defensivo',
  },
  {
    id: 'combater-duas-armas',
    name: 'Combater com Duas Armas',
    shortEffect: '-1d20 ataque, dois ataques (até próximo turno)',
    description: 'Se estiver empunhando duas armas (pelo menos uma leve) e fizer a ação agredir, pode fazer dois ataques. Sofre -1d20 em todos os testes de ataque até o próximo turno.',
    basePECost: 0,
    limit: 'perRound',
    minNex: 15,
    icon: 'swords',
    pageRef: 'Livro Base p.46',
    conditionalBonusId: 'combater-duas-armas',
  },
];

// =====================================================
// Catálogo de Poderes Ativáveis do Especialista
// =====================================================

export const ACTIVATABLE_ESPECIALISTA_POWERS: ActivatableClassPower[] = [
  {
    id: 'conhecimento-aplicado',
    name: 'Conhecimento Aplicado',
    shortEffect: 'Próximo teste de perícia usa Intelecto',
    description: 'Quando faz um teste de perícia (exceto Luta e Pontaria), você pode gastar 2 PE para mudar o atributo-base da perícia para Intelecto.',
    basePECost: 2,
    limit: 'none', // Pode usar várias vezes (cada uso afeta apenas o próximo teste)
    minNex: 15,
    icon: 'zap',
    pageRef: 'Livro Base p.50',
    conditionalBonusId: 'conhecimento-aplicado-ativo', // Marca estado "ativo para próximo teste"
  },
  {
    id: 'nerd',
    name: 'Nerd',
    shortEffect: 'Teste de Atualidades (DT 20) para info extra',
    description: 'Uma vez por cena, pode gastar 2 PE para fazer um teste de Atualidades (DT 20). Se passar: pista extra, fraqueza do inimigo ou informação relevante.',
    basePECost: 2,
    limit: 'perScene',
    minNex: 15,
    icon: 'search',
    pageRef: 'Livro Base p.50',
  },
  {
    id: 'maos-rapidas',
    name: 'Mãos Rápidas',
    shortEffect: 'Teste de Crime como ação livre',
    description: 'Ao fazer um teste de Crime, você pode pagar 1 PE para fazê-lo como uma ação livre.',
    basePECost: 1,
    limit: 'none',
    minNex: 15,
    icon: 'zap',
    pageRef: 'Livro Base p.50',
  },
  // ===== NOVOS PODERES: Na Trilha Certa + Pensamento Ágil =====
  {
    id: 'na-trilha-certa',
    name: 'Na Trilha Certa',
    shortEffect: '+1d20 cumulativo após sucesso em procurar pistas',
    description: 'Sempre que tiver sucesso em um teste para procurar pistas, pode gastar PE para receber +1d20 no próximo teste. Custos e bônus são cumulativos (1 PE = +1d20, 2 PE total = +2d20, etc.).',
    basePECost: 1,
    scalingCost: {
      multiplier: 1,
      description: 'Custo aumenta +1 PE por uso na cena',
    },
    limit: 'perScene', // Reseta na cena, mas cumulativo dentro dela
    minNex: 15,
    icon: 'search',
    pageRef: 'Livro Base p.50',
    conditionalBonusId: 'na-trilha-certa-ativo',
  },
  {
    id: 'pensamento-agil',
    name: 'Pensamento Ágil',
    shortEffect: 'Ação extra de procurar pistas (1x/rodada)',
    description: 'Durante cena de investigação, gaste 2 PE para fazer uma ação adicional de procurar pistas.',
    basePECost: 2,
    limit: 'perRound',
    minNex: 15,
    icon: 'search',
    pageRef: 'Livro Base p.51',
  },
];

// Array combinado para o hook poder usar todos os poderes
export const ALL_ACTIVATABLE_POWERS: ActivatableClassPower[] = [
  ...ACTIVATABLE_COMBATENTE_POWERS,
  ...ACTIVATABLE_ESPECIALISTA_POWERS,
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
  // Reservas síncronas evitam usar o mesmo saldo/contador em ativações antes do render.
  const usageStatesRef = useRef(usageStates);
  const availablePERef = useRef(peCurrent);
  useEffect(() => {
    availablePERef.current = peCurrent;
  }, [peCurrent]);

  /** Publica um novo estado de uso e atualiza a reserva usada pelo próximo comando. */
  const updateUsageStates = useCallback((next: Record<string, PowerUsageState>) => {
    usageStatesRef.current = next;
    setUsageStates(next);
  }, []);

  // Filtra poderes disponíveis para o personagem (Combatente + Especialista)
  const availablePowers = useMemo(() => {
    return ALL_ACTIVATABLE_POWERS.filter((power) => {
      // Verifica NEX mínimo
      if (nex < power.minNex) return false;
      // Verifica se possui o poder
      return hasPower(classPowers, abilities, power.id, power.name);
    });
  }, [classPowers, abilities, nex]);

  // Calcula o custo atual de um poder
  const getCurrentCost = useCallback((powerId: string): number => {
    const power = ALL_ACTIVATABLE_POWERS.find((p) => p.id === powerId);
    if (!power) return 0;

    const state = usageStatesRef.current[powerId] || { usageCount: 0, isUsed: false };

    // Se tem escalonamento, multiplica
    if (power.scalingCost) {
      // Para Segurar o Gatilho: 2 PE × (ataques já realizados + 1)
      // Primeiro ataque extra = 2 PE, segundo = 4 PE, terceiro = 6 PE...
      return power.basePECost * (state.usageCount + 1);
    }

    return power.basePECost;
  }, []);

  // Verifica se pode pagar
  const canAfford = useCallback((powerId: string): boolean => {
    const power = availablePowers.find((p) => p.id === powerId);
    if (!power) return false;

    const state = usageStatesRef.current[powerId] || { usageCount: 0, isUsed: false };

    // Poderes com scalingCost podem ser usados várias vezes no período
    // Só os poderes sem scalingCost respeitam isUsed como bloqueio absoluto
    if (power.limit !== 'none' && state.isUsed && !power.scalingCost) {
      return false;
    }

    // Verifica PE
    const cost = getCurrentCost(powerId);
    return Number.isFinite(availablePERef.current) && availablePERef.current >= cost;
  }, [availablePowers, getCurrentCost]);

  // Usa um poder
  const usePower = useCallback((powerId: string): boolean => {
    const power = availablePowers.find((p) => p.id === powerId);
    if (!power) {
      toast.error('Poder indisponível para este personagem');
      return false;
    }

    if (!canAfford(powerId)) {
      toast.error('PE insuficiente ou poder já usado');
      return false;
    }

    const cost = getCurrentCost(powerId);
    const state = usageStatesRef.current[powerId] || { usageCount: 0, isUsed: false };

    // Reserva o uso antes de callbacks externos, inclusive em ativações reentrantes.
    updateUsageStates({
      ...usageStatesRef.current,
      [powerId]: {
        usageCount: state.usageCount + 1,
        isUsed: power.limit !== 'none' && !power.scalingCost,
      },
    });

    // Gasta PE
    if (cost > 0) {
      const remainingPE = availablePERef.current - cost;
      availablePERef.current = remainingPE;
      onPEChange(remainingPE);
      onTrackPESpent?.(power.name, cost);
    }

    // Ativa bônus condicional se definido
    if (power.conditionalBonusId && onToggleConditionalBonus) {
      onToggleConditionalBonus(power.conditionalBonusId, true);
    }

    // Mensagem específica para Conhecimento Aplicado
    if (powerId === 'conhecimento-aplicado') {
      toast.success(`${power.name} ativado!`, {
        description: `${cost} PE gastos. O PRÓXIMO teste de perícia usará Intelecto.`,
      });
    } else {
      toast.success(`${power.name} ativado!`, {
        description: cost > 0 ? `${cost} PE gastos` : 'Sem custo de PE',
      });
    }

    return true;
  }, [availablePowers, canAfford, getCurrentCost, updateUsageStates, onPEChange, onTrackPESpent, onToggleConditionalBonus]);

  // Reset por turno (limpa Segurar o Gatilho)
  const resetTurn = useCallback(() => {
    // Desativa bônus condicionais de poderes perTurn
    ALL_ACTIVATABLE_POWERS.forEach((power) => {
      if (power.limit === 'perTurn' && power.conditionalBonusId && onToggleConditionalBonus) {
        onToggleConditionalBonus(power.conditionalBonusId, false);
      }
    });

    const next = { ...usageStatesRef.current };
    Object.keys(next).forEach((id) => {
      const power = ALL_ACTIVATABLE_POWERS.find((p) => p.id === id);
      if (power?.limit === 'perTurn') {
        next[id] = { usageCount: 0, isUsed: false };
      }
    });
    updateUsageStates(next);
  }, [onToggleConditionalBonus, updateUsageStates]);

  // Reset por rodada
  const resetRound = useCallback(() => {
    // Desativa bônus condicionais de poderes perRound e perTurn
    ALL_ACTIVATABLE_POWERS.forEach((power) => {
      if ((power.limit === 'perRound' || power.limit === 'perTurn') && 
          power.conditionalBonusId && onToggleConditionalBonus) {
        onToggleConditionalBonus(power.conditionalBonusId, false);
      }
    });

    const next = { ...usageStatesRef.current };
    Object.keys(next).forEach((id) => {
      const power = ALL_ACTIVATABLE_POWERS.find((p) => p.id === id);
      if (power?.limit === 'perRound' || power?.limit === 'perTurn') {
        next[id] = { usageCount: 0, isUsed: false };
      }
    });
    updateUsageStates(next);
  }, [onToggleConditionalBonus, updateUsageStates]);

  // Reset por cena
  const resetScene = useCallback(() => {
    // Desativa TODOS os bônus condicionais de poderes ativáveis
    ALL_ACTIVATABLE_POWERS.forEach((power) => {
      if (power.conditionalBonusId && onToggleConditionalBonus) {
        onToggleConditionalBonus(power.conditionalBonusId, false);
      }
    });

    updateUsageStates({});
  }, [onToggleConditionalBonus, updateUsageStates]);

  // Verifica se um bônus condicional de poder está ativo
  const isBonusActive = useCallback((powerId: string): boolean => {
    const power = ALL_ACTIVATABLE_POWERS.find((p) => p.id === powerId);
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
