/**
 * useOpportunityAttacks - Hook para detectar e gerenciar ataques de oportunidade
 * 
 * Detecta quando um combatente sai da adjacência de um inimigo durante movimento,
 * permitindo ao mestre ou ao sistema oferecer ataques de oportunidade.
 * 
 * Regra Ordem Paranormal:
 * - Ataque de oportunidade ocorre quando um personagem sai da área ameaçada
 *   de um inimigo sem usar a ação Esquivar ou habilidades especiais.
 * - Área ameaçada padrão: 1,5m (adjacente)
 */

import { useState, useCallback, useMemo } from 'react';
import type { CombatantState } from '@/lib/game-engine';

// Interface para ataque de oportunidade pendente
export interface OpportunityAttack {
  id: string;
  movingCombatantId: string;
  movingCombatantName: string;
  attackerId: string;
  attackerName: string;
  fromCell: { x: number; y: number };
  toCell: { x: number; y: number };
  timestamp: Date;
  resolved: boolean;
  resolution?: 'attack' | 'pass' | 'cancelled';
}

// Interface para combatente com posição
interface CombatantWithPosition {
  combatant: CombatantState;
  position: { x: number; y: number };
}

// Props do hook
export interface UseOpportunityAttacksProps {
  combatants: CombatantState[];
  getCombatantPosition: (combatantId: string) => { x: number; y: number } | null;
  calculateDistance: (fromX: number, fromY: number, toX: number, toY: number) => number;
  threatRange?: number; // Alcance de ameaça em metros (default: 1.5m)
  onOpportunityAttack?: (attack: OpportunityAttack) => void;
}

// Retorno do hook
export interface UseOpportunityAttacksReturn {
  // Estado
  pendingAttacks: OpportunityAttack[];
  hasUnresolvedAttacks: boolean;
  
  // Detecção
  checkMovementForOpportunity: (
    movingCombatantId: string,
    fromCell: { x: number; y: number },
    toCell: { x: number; y: number }
  ) => OpportunityAttack[];
  
  // Resolução
  resolveAttack: (attackId: string, resolution: 'attack' | 'pass' | 'cancelled') => void;
  resolveAllPending: (resolution: 'pass' | 'cancelled') => void;
  clearResolved: () => void;
  
  // Utilitários
  getThreateningCombatants: (combatantId: string) => CombatantWithPosition[];
  isInThreatRange: (combatantId: string, targetId: string) => boolean;
}

export function useOpportunityAttacks({
  combatants,
  getCombatantPosition,
  calculateDistance,
  threatRange = 1.5, // 1.5m = adjacência
  onOpportunityAttack,
}: UseOpportunityAttacksProps): UseOpportunityAttacksReturn {
  
  // Estado de ataques pendentes
  const [pendingAttacks, setPendingAttacks] = useState<OpportunityAttack[]>([]);

  // Verifica se há ataques não resolvidos
  const hasUnresolvedAttacks = useMemo(() => {
    return pendingAttacks.some(a => !a.resolved);
  }, [pendingAttacks]);

  /**
   * Obtém todos os combatentes que ameaçam um alvo específico
   * (estão adjacentes e são hostis)
   */
  const getThreateningCombatants = useCallback((combatantId: string): CombatantWithPosition[] => {
    const targetPos = getCombatantPosition(combatantId);
    if (!targetPos) return [];

    const target = combatants.find(c => c.id === combatantId);
    if (!target) return [];

    const threatening: CombatantWithPosition[] = [];

    for (const other of combatants) {
      // Ignora a si mesmo
      if (other.id === combatantId) continue;
      
      // Ignora mortos ou incapacitados (usa hp se existir)
      const otherHp = (other as any).currentHp ?? (other as any).hp ?? 1;
      if (otherHp <= 0) continue;
      
      // Ignora aliados (simplificação: mesma equipe = não ameaça)
      // Em OP, NPCs ameaçam PCs e vice-versa
      const targetType = (target as any).type ?? 'pc';
      const otherType = (other as any).type ?? 'npc';
      const isHostile = targetType !== otherType;
      if (!isHostile) continue;

      const otherPos = getCombatantPosition(other.id);
      if (!otherPos) continue;

      // Verifica distância
      const distance = calculateDistance(targetPos.x, targetPos.y, otherPos.x, otherPos.y);
      if (distance <= threatRange) {
        threatening.push({
          combatant: other,
          position: otherPos,
        });
      }
    }

    return threatening;
  }, [combatants, getCombatantPosition, calculateDistance, threatRange]);

  /**
   * Verifica se um combatente está no alcance de ameaça de outro
   */
  const isInThreatRange = useCallback((combatantId: string, targetId: string): boolean => {
    const pos1 = getCombatantPosition(combatantId);
    const pos2 = getCombatantPosition(targetId);
    
    if (!pos1 || !pos2) return false;
    
    const distance = calculateDistance(pos1.x, pos1.y, pos2.x, pos2.y);
    return distance <= threatRange;
  }, [getCombatantPosition, calculateDistance, threatRange]);

  /**
   * Verifica movimento para ataques de oportunidade
   * Retorna lista de ataques gerados
   */
  const checkMovementForOpportunity = useCallback((
    movingCombatantId: string,
    fromCell: { x: number; y: number },
    toCell: { x: number; y: number }
  ): OpportunityAttack[] => {
    const movingCombatant = combatants.find(c => c.id === movingCombatantId);
    if (!movingCombatant) return [];

    // Ignora se o combatente está morto
    const movingHp = (movingCombatant as any).currentHp ?? (movingCombatant as any).hp ?? 1;
    if (movingHp <= 0) return [];

    const newAttacks: OpportunityAttack[] = [];

    // Verifica cada combatente hostil
    for (const other of combatants) {
      // Ignora a si mesmo
      if (other.id === movingCombatantId) continue;
      
      // Ignora mortos
      const otherHp = (other as any).currentHp ?? (other as any).hp ?? 1;
      if (otherHp <= 0) continue;
      
      // Ignora aliados
      const movingType = (movingCombatant as any).type ?? 'pc';
      const otherType = (other as any).type ?? 'npc';
      const isHostile = movingType !== otherType;
      if (!isHostile) continue;

      const otherPos = getCombatantPosition(other.id);
      if (!otherPos) continue;

      // Calcula distâncias antes e depois do movimento
      const distanceBefore = calculateDistance(fromCell.x, fromCell.y, otherPos.x, otherPos.y);
      const distanceAfter = calculateDistance(toCell.x, toCell.y, otherPos.x, otherPos.y);

      // Verifica se estava adjacente ANTES e está saindo
      // Condição: estava dentro do alcance E agora está fora
      const wasAdjacent = distanceBefore <= threatRange;
      const isLeavingThreat = distanceAfter > threatRange;

      if (wasAdjacent && isLeavingThreat) {
        const attack: OpportunityAttack = {
          id: `oo-${Date.now()}-${other.id}`,
          movingCombatantId,
          movingCombatantName: movingCombatant.name,
          attackerId: other.id,
          attackerName: other.name,
          fromCell,
          toCell,
          timestamp: new Date(),
          resolved: false,
        };

        newAttacks.push(attack);
        onOpportunityAttack?.(attack);
      }
    }

    if (newAttacks.length > 0) {
      setPendingAttacks(prev => [...prev, ...newAttacks]);
    }

    return newAttacks;
  }, [combatants, getCombatantPosition, calculateDistance, threatRange, onOpportunityAttack]);

  /**
   * Resolve um ataque de oportunidade específico
   */
  const resolveAttack = useCallback((
    attackId: string, 
    resolution: 'attack' | 'pass' | 'cancelled'
  ) => {
    setPendingAttacks(prev => prev.map(attack => 
      attack.id === attackId
        ? { ...attack, resolved: true, resolution }
        : attack
    ));
  }, []);

  /**
   * Resolve todos os ataques pendentes com a mesma resolução
   */
  const resolveAllPending = useCallback((resolution: 'pass' | 'cancelled') => {
    setPendingAttacks(prev => prev.map(attack => 
      !attack.resolved
        ? { ...attack, resolved: true, resolution }
        : attack
    ));
  }, []);

  /**
   * Remove ataques já resolvidos do histórico
   */
  const clearResolved = useCallback(() => {
    setPendingAttacks(prev => prev.filter(a => !a.resolved));
  }, []);

  return {
    // Estado
    pendingAttacks,
    hasUnresolvedAttacks,
    
    // Detecção
    checkMovementForOpportunity,
    
    // Resolução
    resolveAttack,
    resolveAllPending,
    clearResolved,
    
    // Utilitários
    getThreateningCombatants,
    isInThreatRange,
  };
}
