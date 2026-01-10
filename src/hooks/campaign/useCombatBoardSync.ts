/**
 * useCombatBoardSync - Hook para sincronizar combate com tabuleiro tático
 * 
 * Vincula combatentes a tokens, calcula alcance e valida movimento.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { MapToken, TacticalBoardReturn } from './useTacticalBoard';
import { type CombatantState } from '@/lib/game-engine';

// Interface para combatente vinculado a token
export interface LinkedCombatant {
  combatantId: string;
  tokenId: string;
  characterId?: string;
}

// Interface para movimento pendente
export interface PendingMovement {
  combatantId: string;
  tokenId: string;
  fromCell: { x: number; y: number };
  toCell: { x: number; y: number };
  distanceMeters: number;
  isValid: boolean;
  reason?: string;
}

// Interface para alcance de ataque
export interface AttackRange {
  attackerId: string;
  targetId: string;
  distanceMeters: number;
  isInRange: boolean;
  weaponRange?: number;
}

// Props do hook
export interface UseCombatBoardSyncProps {
  board: TacticalBoardReturn | null;
  combatants: CombatantState[];
  currentTurnCombatantId?: string;
  isMaster: boolean;
  movementPerRound?: number; // Movimento padrão em metros (default: 9m)
}

// Retorno do hook
export interface CombatBoardSyncReturn {
  // Estado de vinculação
  linkedCombatants: LinkedCombatant[];
  unlinkedCombatants: CombatantState[];
  unlinkedTokens: MapToken[];
  
  // Movimento
  pendingMovement: PendingMovement | null;
  movementRemaining: number;
  hasMovedThisTurn: boolean;
  
  // Ações de vinculação
  linkCombatantToToken: (combatantId: string, tokenId: string) => void;
  unlinkCombatant: (combatantId: string) => void;
  autoLinkByCharacterId: () => number; // Retorna número de vinculações automáticas
  
  // Ações de movimento
  previewMovement: (combatantId: string, toX: number, toY: number) => PendingMovement | null;
  confirmMovement: () => Promise<boolean>;
  cancelMovement: () => void;
  teleportToken: (combatantId: string, toX: number, toY: number) => Promise<boolean>;
  
  // Cálculos de alcance
  calculateRange: (fromCombatantId: string, toCombatantId: string) => AttackRange | null;
  getTargetsInRange: (combatantId: string, rangeMeters: number) => AttackRange[];
  
  // Destaque no mapa
  highlightCurrentTurn: () => void;
  highlightMovementRange: (combatantId: string) => { x: number; y: number }[];
  
  // Utilitários
  getTokenForCombatant: (combatantId: string) => MapToken | null;
  getCombatantForToken: (tokenId: string) => CombatantState | null;
  getCombatantPosition: (combatantId: string) => { x: number; y: number } | null;
}

export function useCombatBoardSync({
  board,
  combatants,
  currentTurnCombatantId,
  isMaster,
  movementPerRound = 9, // 9 metros padrão (6 células de 1.5m)
}: UseCombatBoardSyncProps): CombatBoardSyncReturn {
  
  // Estado de vinculação combatente <-> token
  const [linkedCombatants, setLinkedCombatants] = useState<LinkedCombatant[]>([]);
  
  // Estado de movimento
  const [pendingMovement, setPendingMovement] = useState<PendingMovement | null>(null);
  const [movementUsed, setMovementUsed] = useState<Record<string, number>>({});

  // =====================================================
  // CÁLCULOS DERIVADOS
  // =====================================================

  // Combatentes sem token vinculado
  const unlinkedCombatants = useMemo(() => {
    const linkedIds = new Set(linkedCombatants.map(l => l.combatantId));
    return combatants.filter(c => !linkedIds.has(c.id));
  }, [combatants, linkedCombatants]);

  // Tokens sem combatente vinculado (apenas PCs e NPCs)
  const unlinkedTokens = useMemo(() => {
    if (!board) return [];
    const linkedTokenIds = new Set(linkedCombatants.map(l => l.tokenId));
    return board.tokens.filter(t => 
      !linkedTokenIds.has(t.id) && 
      (t.token_type === 'pc' || t.token_type === 'npc' || t.token_type === 'creature')
    );
  }, [board?.tokens, linkedCombatants]);

  // Movimento restante para combatente atual
  const movementRemaining = useMemo(() => {
    if (!currentTurnCombatantId) return movementPerRound;
    const used = movementUsed[currentTurnCombatantId] || 0;
    return Math.max(0, movementPerRound - used);
  }, [currentTurnCombatantId, movementUsed, movementPerRound]);

  // Se moveu neste turno
  const hasMovedThisTurn = useMemo(() => {
    if (!currentTurnCombatantId) return false;
    return (movementUsed[currentTurnCombatantId] || 0) > 0;
  }, [currentTurnCombatantId, movementUsed]);

  // =====================================================
  // VINCULAÇÃO COMBATENTE <-> TOKEN
  // =====================================================

  // Vincular combatente a token
  const linkCombatantToToken = useCallback((combatantId: string, tokenId: string) => {
    // Remove vinculações anteriores para este combatente ou token
    setLinkedCombatants(prev => {
      const filtered = prev.filter(l => 
        l.combatantId !== combatantId && l.tokenId !== tokenId
      );
      
      // Busca character_id do token se disponível
      const token = board?.tokens.find(t => t.id === tokenId);
      
      return [...filtered, {
        combatantId,
        tokenId,
        characterId: token?.character_id || undefined,
      }];
    });
  }, [board?.tokens]);

  // Desvincular combatente
  const unlinkCombatant = useCallback((combatantId: string) => {
    setLinkedCombatants(prev => prev.filter(l => l.combatantId !== combatantId));
  }, []);

  // Vincular automaticamente por character_id
  const autoLinkByCharacterId = useCallback(() => {
    if (!board) return 0;
    
    let linkedCount = 0;
    const newLinks: LinkedCombatant[] = [...linkedCombatants];
    
    // Para cada token com character_id
    for (const token of board.tokens) {
      if (!token.character_id) continue;
      
      // Verifica se já está vinculado
      if (newLinks.some(l => l.tokenId === token.id)) continue;
      
      // Procura combatente com mesmo nome (heurística simples)
      // Em implementação completa, usaria character_id real
      const matchingCombatant = combatants.find(c => 
        c.name.toLowerCase() === token.name.toLowerCase() &&
        !newLinks.some(l => l.combatantId === c.id)
      );
      
      if (matchingCombatant) {
        newLinks.push({
          combatantId: matchingCombatant.id,
          tokenId: token.id,
          characterId: token.character_id,
        });
        linkedCount++;
      }
    }
    
    if (linkedCount > 0) {
      setLinkedCombatants(newLinks);
    }
    
    return linkedCount;
  }, [board, combatants, linkedCombatants]);

  // =====================================================
  // UTILITÁRIOS DE BUSCA
  // =====================================================

  // Obter token para combatente
  const getTokenForCombatant = useCallback((combatantId: string): MapToken | null => {
    if (!board) return null;
    const link = linkedCombatants.find(l => l.combatantId === combatantId);
    if (!link) return null;
    return board.tokens.find(t => t.id === link.tokenId) || null;
  }, [board, linkedCombatants]);

  // Obter combatente para token
  const getCombatantForToken = useCallback((tokenId: string): CombatantState | null => {
    const link = linkedCombatants.find(l => l.tokenId === tokenId);
    if (!link) return null;
    return combatants.find(c => c.id === link.combatantId) || null;
  }, [combatants, linkedCombatants]);

  // Obter posição do combatente (em células)
  const getCombatantPosition = useCallback((combatantId: string): { x: number; y: number } | null => {
    const token = getTokenForCombatant(combatantId);
    if (!token) return null;
    return { x: token.x, y: token.y };
  }, [getTokenForCombatant]);

  // =====================================================
  // MOVIMENTO
  // =====================================================

  // Pré-visualizar movimento (calcula distância e validade)
  const previewMovement = useCallback((
    combatantId: string, 
    toX: number, 
    toY: number
  ): PendingMovement | null => {
    if (!board) return null;
    
    const token = getTokenForCombatant(combatantId);
    if (!token) {
      return {
        combatantId,
        tokenId: '',
        fromCell: { x: 0, y: 0 },
        toCell: { x: toX, y: toY },
        distanceMeters: 0,
        isValid: false,
        reason: 'Combatente não vinculado a token',
      };
    }
    
    const fromCell = { x: token.x, y: token.y };
    const toCell = { x: toX, y: toY };
    
    // Calcula distância em metros
    const distanceMeters = board.calculateDistance(fromCell.x, fromCell.y, toX, toY);
    
    // Verifica se movimento é válido
    const usedThisTurn = movementUsed[combatantId] || 0;
    const remaining = movementPerRound - usedThisTurn;
    const isValid = distanceMeters <= remaining;
    
    const movement: PendingMovement = {
      combatantId,
      tokenId: token.id,
      fromCell,
      toCell,
      distanceMeters,
      isValid,
      reason: isValid ? undefined : `Distância (${distanceMeters}m) excede movimento restante (${remaining}m)`,
    };
    
    setPendingMovement(movement);
    return movement;
  }, [board, getTokenForCombatant, movementPerRound, movementUsed]);

  // Confirmar movimento pendente
  const confirmMovement = useCallback(async (): Promise<boolean> => {
    if (!board || !pendingMovement || !pendingMovement.isValid) {
      return false;
    }
    
    // Move o token no tabuleiro
    const success = await board.moveToken(
      pendingMovement.tokenId,
      pendingMovement.toCell.x,
      pendingMovement.toCell.y
    );
    
    if (success) {
      // Registra movimento usado
      setMovementUsed(prev => ({
        ...prev,
        [pendingMovement.combatantId]: (prev[pendingMovement.combatantId] || 0) + pendingMovement.distanceMeters,
      }));
    }
    
    setPendingMovement(null);
    return success;
  }, [board, pendingMovement]);

  // Cancelar movimento pendente
  const cancelMovement = useCallback(() => {
    setPendingMovement(null);
  }, []);

  // Teleportar token (ignora limite de movimento - apenas mestre)
  const teleportToken = useCallback(async (
    combatantId: string, 
    toX: number, 
    toY: number
  ): Promise<boolean> => {
    if (!board || !isMaster) return false;
    
    const token = getTokenForCombatant(combatantId);
    if (!token) return false;
    
    return board.moveToken(token.id, toX, toY);
  }, [board, isMaster, getTokenForCombatant]);

  // =====================================================
  // CÁLCULO DE ALCANCE
  // =====================================================

  // Calcular alcance entre dois combatentes
  const calculateRange = useCallback((
    fromCombatantId: string, 
    toCombatantId: string,
    weaponRange?: number
  ): AttackRange | null => {
    if (!board) return null;
    
    const fromToken = getTokenForCombatant(fromCombatantId);
    const toToken = getTokenForCombatant(toCombatantId);
    
    if (!fromToken || !toToken) return null;
    
    const distanceMeters = board.calculateDistance(
      fromToken.x, fromToken.y,
      toToken.x, toToken.y
    );
    
    // Alcance padrão corpo-a-corpo: 1.5m
    const range = weaponRange ?? 1.5;
    
    return {
      attackerId: fromCombatantId,
      targetId: toCombatantId,
      distanceMeters,
      isInRange: distanceMeters <= range,
      weaponRange: range,
    };
  }, [board, getTokenForCombatant]);

  // Obter todos os alvos em alcance
  const getTargetsInRange = useCallback((
    combatantId: string, 
    rangeMeters: number
  ): AttackRange[] => {
    if (!board) return [];
    
    const results: AttackRange[] = [];
    
    for (const otherCombatant of combatants) {
      if (otherCombatant.id === combatantId) continue;
      
      const range = calculateRange(combatantId, otherCombatant.id, rangeMeters);
      if (range && range.isInRange) {
        results.push(range);
      }
    }
    
    return results;
  }, [board, combatants, calculateRange]);

  // =====================================================
  // DESTAQUE NO MAPA
  // =====================================================

  // Destacar token do combatente atual
  const highlightCurrentTurn = useCallback(() => {
    if (!board || !currentTurnCombatantId) return;
    
    const token = getTokenForCombatant(currentTurnCombatantId);
    if (token) {
      board.selectToken(token.id);
      
      // Envia ping na posição do token
      const pixelPos = board.cellToPixel(token.x, token.y);
      board.sendPing(pixelPos.x, pixelPos.y, '#00ff00');
    }
  }, [board, currentTurnCombatantId, getTokenForCombatant]);

  // Calcular células alcançáveis para movimento
  const highlightMovementRange = useCallback((combatantId: string): { x: number; y: number }[] => {
    if (!board) return [];
    
    const token = getTokenForCombatant(combatantId);
    if (!token) return [];
    
    const usedThisTurn = movementUsed[combatantId] || 0;
    const remaining = movementPerRound - usedThisTurn;
    const cellsReachable = Math.floor(remaining / 1.5); // 1.5m por célula
    
    const cells: { x: number; y: number }[] = [];
    
    // Gera todas as células dentro do alcance (quadrado simplificado)
    for (let dx = -cellsReachable; dx <= cellsReachable; dx++) {
      for (let dy = -cellsReachable; dy <= cellsReachable; dy++) {
        const distance = board.calculateDistance(token.x, token.y, token.x + dx, token.y + dy);
        if (distance <= remaining) {
          cells.push({ x: token.x + dx, y: token.y + dy });
        }
      }
    }
    
    return cells;
  }, [board, getTokenForCombatant, movementPerRound, movementUsed]);

  // =====================================================
  // RESET DE MOVIMENTO POR RODADA
  // =====================================================

  // Reset movimento quando muda o turno
  useEffect(() => {
    if (currentTurnCombatantId) {
      // Limpa movimento do combatente ao iniciar seu turno
      setMovementUsed(prev => {
        const next = { ...prev };
        delete next[currentTurnCombatantId];
        return next;
      });
    }
  }, [currentTurnCombatantId]);

  return {
    // Estado de vinculação
    linkedCombatants,
    unlinkedCombatants,
    unlinkedTokens,
    
    // Movimento
    pendingMovement,
    movementRemaining,
    hasMovedThisTurn,
    
    // Ações de vinculação
    linkCombatantToToken,
    unlinkCombatant,
    autoLinkByCharacterId,
    
    // Ações de movimento
    previewMovement,
    confirmMovement,
    cancelMovement,
    teleportToken,
    
    // Cálculos de alcance
    calculateRange,
    getTargetsInRange,
    
    // Destaque no mapa
    highlightCurrentTurn,
    highlightMovementRange,
    
    // Utilitários
    getTokenForCombatant,
    getCombatantForToken,
    getCombatantPosition,
  };
}
