// Rastreador de turno para sessões presenciais
// Ordem Paranormal RPG v1.3

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Zap, 
  Footprints,
  Shield,
  Swords,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPELimitByNex } from '@/lib/dice-roller';
import { motion, AnimatePresence } from 'framer-motion';

interface TurnState {
  isActive: boolean;
  round: number;
  peSpentThisTurn: number;
  actionsUsed: number;
  movementUsed: boolean;
  reactionUsed: boolean;
}

interface TurnTrackerProps {
  nex: number;
  peCurrent: number;
  conditions?: string[];
  onTurnStart?: () => void;
  onTurnEnd?: () => void;
  onPESpend?: (amount: number) => boolean;
  onNewRound?: () => void;
  className?: string;
}

export function TurnTracker({
  nex,
  peCurrent,
  conditions = [],
  onTurnStart,
  onTurnEnd,
  onPESpend,
  onNewRound,
  className
}: TurnTrackerProps) {
  const [turnState, setTurnState] = useState<TurnState>({
    isActive: false,
    round: 1,
    peSpentThisTurn: 0,
    actionsUsed: 0,
    movementUsed: false,
    reactionUsed: false,
  });

  const peLimit = getPELimitByNex(nex);
  const hasLento = conditions.includes('lento');
  const maxActions = hasLento ? 1 : 2;
  const peRemaining = peLimit - turnState.peSpentThisTurn;
  const isAtPELimit = turnState.peSpentThisTurn >= peLimit;

  const handleStartTurn = useCallback(() => {
    setTurnState(prev => ({
      ...prev,
      isActive: true,
      actionsUsed: 0,
      movementUsed: false,
      reactionUsed: false,
      peSpentThisTurn: 0,
    }));
    onTurnStart?.();
  }, [onTurnStart]);

  const handleEndTurn = useCallback(() => {
    setTurnState(prev => ({
      ...prev,
      isActive: false,
    }));
    onTurnEnd?.();
  }, [onTurnEnd]);

  const handleNewRound = useCallback(() => {
    setTurnState(prev => ({
      ...prev,
      round: prev.round + 1,
      isActive: false,
      peSpentThisTurn: 0,
      actionsUsed: 0,
      movementUsed: false,
      reactionUsed: false,
    }));
    onNewRound?.();
  }, [onNewRound]);

  const handleSpendPE = useCallback((amount: number) => {
    if (turnState.peSpentThisTurn + amount > peLimit) {
      return false;
    }
    if (amount > peCurrent) {
      return false;
    }
    
    const success = onPESpend?.(amount) ?? true;
    if (success) {
      setTurnState(prev => ({
        ...prev,
        peSpentThisTurn: prev.peSpentThisTurn + amount,
      }));
    }
    return success;
  }, [turnState.peSpentThisTurn, peLimit, peCurrent, onPESpend]);

  const handleUseAction = useCallback(() => {
    if (turnState.actionsUsed < maxActions) {
      setTurnState(prev => ({
        ...prev,
        actionsUsed: prev.actionsUsed + 1,
      }));
    }
  }, [turnState.actionsUsed, maxActions]);

  const handleUseMovement = useCallback(() => {
    setTurnState(prev => ({
      ...prev,
      movementUsed: true,
    }));
  }, []);

  const handleUseReaction = useCallback(() => {
    setTurnState(prev => ({
      ...prev,
      reactionUsed: true,
    }));
  }, []);

  const resetTurn = useCallback(() => {
    setTurnState(prev => ({
      ...prev,
      peSpentThisTurn: 0,
      actionsUsed: 0,
      movementUsed: false,
      reactionUsed: false,
    }));
  }, []);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header com Round */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={turnState.isActive ? "default" : "secondary"} className="font-mono">
            Rodada {turnState.round}
          </Badge>
          {turnState.isActive && (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              TURNO ATIVO
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewRound}
          className="h-7 text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Nova Rodada
        </Button>
      </div>

      {/* PE do Turno */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-energy">
            <Zap className="w-3.5 h-3.5" />
            PE este turno
          </span>
          <span className={cn(
            "font-mono",
            isAtPELimit && "text-destructive"
          )}>
            {turnState.peSpentThisTurn}/{peLimit}
          </span>
        </div>
        <Progress 
          value={(turnState.peSpentThisTurn / peLimit) * 100} 
          className={cn(
            "h-2",
            isAtPELimit && "[&>div]:bg-destructive"
          )}
        />
        <AnimatePresence>
          {isAtPELimit && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-1.5 text-xs text-destructive"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Limite de PE por turno atingido!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recursos do Turno */}
      <div className="grid grid-cols-3 gap-2">
        {/* Ações */}
        <button
          onClick={handleUseAction}
          disabled={turnState.actionsUsed >= maxActions || !turnState.isActive}
          className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors",
            turnState.actionsUsed >= maxActions
              ? "border-muted bg-muted/30 text-muted-foreground"
              : "border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary"
          )}
        >
          <Swords className="w-4 h-4" />
          <span className="text-[10px] font-medium">AÇÕES</span>
          <span className="text-xs font-mono">
            {maxActions - turnState.actionsUsed}/{maxActions}
          </span>
        </button>

        {/* Movimento */}
        <button
          onClick={handleUseMovement}
          disabled={turnState.movementUsed || !turnState.isActive}
          className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors",
            turnState.movementUsed
              ? "border-muted bg-muted/30 text-muted-foreground"
              : "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-500"
          )}
        >
          <Footprints className="w-4 h-4" />
          <span className="text-[10px] font-medium">MOVIMENTO</span>
          <span className="text-xs font-mono">
            {turnState.movementUsed ? "✗" : "✓"}
          </span>
        </button>

        {/* Reação */}
        <button
          onClick={handleUseReaction}
          disabled={turnState.reactionUsed || !turnState.isActive}
          className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors",
            turnState.reactionUsed
              ? "border-muted bg-muted/30 text-muted-foreground"
              : "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500"
          )}
        >
          <Shield className="w-4 h-4" />
          <span className="text-[10px] font-medium">REAÇÃO</span>
          <span className="text-xs font-mono">
            {turnState.reactionUsed ? "✗" : "✓"}
          </span>
        </button>
      </div>

      {/* Condição Lento */}
      {hasLento && (
        <div className="flex items-center gap-1.5 text-xs text-warning bg-warning/10 px-2 py-1.5 rounded">
          <AlertCircle className="w-3.5 h-3.5" />
          Condição Lento: apenas 1 ação por turno
        </div>
      )}

      {/* Botões de Turno */}
      <div className="flex gap-2">
        {!turnState.isActive ? (
          <Button
            onClick={handleStartTurn}
            className="flex-1"
            size="sm"
          >
            <Play className="w-4 h-4 mr-1.5" />
            Iniciar Turno
          </Button>
        ) : (
          <>
            <Button
              onClick={handleEndTurn}
              variant="secondary"
              className="flex-1"
              size="sm"
            >
              <Square className="w-4 h-4 mr-1.5" />
              Fim do Turno
            </Button>
            <Button
              onClick={resetTurn}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Quick PE Spend */}
      <div className="space-y-1.5">
        <span className="text-xs text-muted-foreground">Gastar PE:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 5].map(amount => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              disabled={
                !turnState.isActive ||
                turnState.peSpentThisTurn + amount > peLimit ||
                amount > peCurrent
              }
              onClick={() => handleSpendPE(amount)}
            >
              {amount} PE
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
