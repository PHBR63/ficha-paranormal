/**
 * WeaponBuffTurnTracker - Componente para controlar rodadas de weapon buffs
 * Permite avançar turnos, ajustar rodadas manualmente e ver buffs expirados
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Timer, 
  Plus, 
  Minus, 
  SkipForward, 
  Clock, 
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Infinity,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WeaponBuff, ELEMENT_BUFF_COLORS } from '@/hooks/useWeaponBuffs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// Props do componente
interface WeaponBuffTurnTrackerProps {
  buffs: WeaponBuff[];
  onAdvanceTurn: () => { expired: WeaponBuff[]; remaining: WeaponBuff[] };
  onSetBuffTurns: (buffId: string, turns: number) => void;
  onRemoveBuff: (buffId: string) => void;
  className?: string;
}

// Badge de duração com ícone
function DurationBadge({ buff }: { buff: WeaponBuff }) {
  const getDurationInfo = () => {
    switch (buff.duration) {
      case 'cena':
        return { 
          text: 'Cena', 
          icon: <Clock className="w-3 h-3" />, 
          color: 'bg-green-500/20 text-green-400 border-green-500/40' 
        };
      case 'sustentado':
        return { 
          text: 'Sustentado', 
          icon: <RefreshCw className="w-3 h-3" />, 
          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' 
        };
      case 'rodadas':
        return { 
          text: `${buff.turnsRemaining ?? 0} rodada(s)`, 
          icon: <Timer className="w-3 h-3" />, 
          color: buff.turnsRemaining && buff.turnsRemaining <= 1 
            ? 'bg-red-500/20 text-red-400 border-red-500/40'
            : 'bg-orange-500/20 text-orange-400 border-orange-500/40' 
        };
      default:
        return { 
          text: 'Permanente', 
          icon: <Infinity className="w-3 h-3" />, 
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' 
        };
    }
  };

  const info = getDurationInfo();

  return (
    <Badge variant="outline" className={cn('gap-1 text-[10px]', info.color)}>
      {info.icon}
      {info.text}
    </Badge>
  );
}

// Componente principal
export function WeaponBuffTurnTracker({
  buffs,
  onAdvanceTurn,
  onSetBuffTurns,
  onRemoveBuff,
  className,
}: WeaponBuffTurnTrackerProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [lastExpired, setLastExpired] = useState<WeaponBuff[]>([]);

  // Buffs com rodadas (para destacar)
  const buffsWithRounds = buffs.filter(b => b.duration === 'rodadas');
  const hasBuffsWithRounds = buffsWithRounds.length > 0;

  // Avançar turno com confirmação
  const handleAdvanceTurn = useCallback(() => {
    const result = onAdvanceTurn();
    
    if (result.expired.length > 0) {
      setLastExpired(result.expired);
      toast.warning(`${result.expired.length} buff(s) expiraram!`, {
        description: result.expired.map(b => b.ritualName).join(', '),
        duration: 4000,
      });
    } else if (hasBuffsWithRounds) {
      toast.success('Turno avançado!', {
        description: `${result.remaining.filter(b => b.duration === 'rodadas').length} buff(s) com rodadas restantes.`,
        duration: 2000,
      });
    }
    
    setShowConfirmDialog(false);
  }, [onAdvanceTurn, hasBuffsWithRounds]);

  // Incrementar/decrementar rodadas manualmente
  const handleAdjustTurns = useCallback((buffId: string, currentTurns: number, delta: number) => {
    const newTurns = Math.max(0, currentTurns + delta);
    onSetBuffTurns(buffId, newTurns);
    
    if (newTurns === 0) {
      toast.info('Buff será removido no próximo avanço de turno.');
    }
  }, [onSetBuffTurns]);

  if (buffs.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header com botão de avançar turno */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-paranormal" />
          <span className="text-sm font-medium">Buffs de Arma</span>
          <Badge variant="secondary" className="text-[10px]">
            {buffs.length}
          </Badge>
        </div>
        
        {hasBuffsWithRounds && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 h-7 text-xs border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
                  onClick={() => setShowConfirmDialog(true)}
                >
                  <SkipForward className="w-3 h-3" />
                  Avançar Turno
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Decrementa 1 rodada de todos os buffs com duração em rodadas</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Lista de buffs com controles de rodadas */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {buffs.map(buff => {
            const colors = ELEMENT_BUFF_COLORS[buff.element] || ELEMENT_BUFF_COLORS.Conhecimento;
            const isRoundsBuff = buff.duration === 'rodadas';
            const isExpiring = isRoundsBuff && (buff.turnsRemaining ?? 0) <= 1;

            return (
              <motion.div
                key={buff.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg border',
                  colors.bg,
                  colors.border,
                  isExpiring && 'ring-1 ring-red-500/50 animate-pulse'
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={cn('font-medium text-sm truncate', colors.text)}>
                    {buff.ritualName}
                  </span>
                  <Badge variant="outline" className={cn('text-[10px]', colors.border, colors.text)}>
                    {buff.element}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  {/* Badge de duração */}
                  <DurationBadge buff={buff} />

                  {/* Controles de ajuste de rodadas (apenas para buffs de rodadas) */}
                  {isRoundsBuff && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleAdjustTurns(buff.id, buff.turnsRemaining ?? 0, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className={cn(
                        'w-5 text-center font-mono text-sm font-bold',
                        isExpiring && 'text-red-400'
                      )}>
                        {buff.turnsRemaining ?? 0}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-green-400"
                        onClick={() => handleAdjustTurns(buff.id, buff.turnsRemaining ?? 0, +1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  )}

                  {/* Botão de remover */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveBuff(buff.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Aviso de buffs prestes a expirar */}
      {buffsWithRounds.some(b => (b.turnsRemaining ?? 0) <= 1) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 p-2 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Alguns buffs expirarão no próximo turno!</span>
        </motion.div>
      )}

      {/* Dialog de confirmação para avançar turno */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SkipForward className="w-5 h-5 text-orange-400" />
              Avançar Turno
            </DialogTitle>
            <DialogDescription>
              Isso irá decrementar 1 rodada de todos os buffs com duração em rodadas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 my-4">
            <p className="text-sm font-medium">Buffs afetados:</p>
            {buffsWithRounds.map(buff => {
              const willExpire = (buff.turnsRemaining ?? 0) <= 1;
              return (
                <div 
                  key={buff.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded text-sm',
                    willExpire ? 'bg-red-500/10 text-red-400' : 'bg-muted/50'
                  )}
                >
                  <span>{buff.ritualName}</span>
                  <span className="font-mono">
                    {buff.turnsRemaining ?? 0} → {Math.max(0, (buff.turnsRemaining ?? 0) - 1)}
                    {willExpire && ' (expira!)'}
                  </span>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleAdvanceTurn}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
