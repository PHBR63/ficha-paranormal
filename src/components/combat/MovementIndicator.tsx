/**
 * MovementIndicator - Indicador visual de movimento no combate
 * 
 * Mostra movimento restante, caminho planejado e validação de distância.
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Footprints,
  MoveRight,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
} from '@/components/icons/ordem-icons';
import type { PendingMovement } from '@/hooks/campaign/useCombatBoardSync';

interface MovementIndicatorProps {
  movementRemaining: number;
  movementMax: number;
  pendingMovement: PendingMovement | null;
  onConfirm: () => void;
  onCancel: () => void;
  onReset?: () => void;
  className?: string;
}

export function MovementIndicator({
  movementRemaining,
  movementMax,
  pendingMovement,
  onConfirm,
  onCancel,
  onReset,
  className,
}: MovementIndicatorProps) {
  const usedMovement = movementMax - movementRemaining;
  const percentUsed = (usedMovement / movementMax) * 100;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Barra de movimento */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-primary" />
            <span className="font-medium">Movimento</span>
          </div>
          <span className="text-muted-foreground">
            {movementRemaining.toFixed(1)}m / {movementMax}m
          </span>
        </div>
        
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              percentUsed > 75 ? "bg-warning" : "bg-primary"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${100 - percentUsed}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        {usedMovement > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Usado: {usedMovement.toFixed(1)}m</span>
            {onReset && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-6 text-xs gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Resetar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Movimento pendente */}
      {pendingMovement && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-3 rounded-lg border",
            pendingMovement.isValid 
              ? "bg-success/10 border-success/30" 
              : "bg-destructive/10 border-destructive/30"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MoveRight className={cn(
                "w-4 h-4",
                pendingMovement.isValid ? "text-success" : "text-destructive"
              )} />
              <span className="font-medium">Movimento Planejado</span>
            </div>
            <Badge variant={pendingMovement.isValid ? "default" : "destructive"}>
              {pendingMovement.distanceMeters.toFixed(1)}m
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span>
              ({pendingMovement.fromCell.x}, {pendingMovement.fromCell.y})
            </span>
            <MoveRight className="w-3 h-3" />
            <span>
              ({pendingMovement.toCell.x}, {pendingMovement.toCell.y})
            </span>
          </div>

          {!pendingMovement.isValid && (
            <div className="flex items-center gap-2 text-sm text-destructive mb-3">
              <AlertTriangle className="w-4 h-4" />
              <span>{pendingMovement.reason}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={pendingMovement.isValid ? "default" : "outline"}
              disabled={!pendingMovement.isValid}
              onClick={onConfirm}
              className="flex-1 gap-2"
            >
              <Check className="w-4 h-4" />
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
