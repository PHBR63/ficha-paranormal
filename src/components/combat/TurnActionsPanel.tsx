/**
 * TurnActionsPanel - Painel visual de ações do turno
 * Mostra ações disponíveis e permite marcar como usadas
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, 
  Move, 
  Hand, 
  Shield, 
  Target, 
  Zap,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { type TurnState } from '@/lib/game-engine';

interface TurnActionsPanelProps {
  turnState: TurnState;
  combatantName: string;
  onMarkAction: (action: 'standard' | 'move' | 'reaction') => void;
  onResetActions: () => void;
  onFullAction: () => void; // Marca padrão + movimento
  isCurrentTurn: boolean;
  isMaster: boolean;
}

// Configuração das ações
const ACTIONS = [
  {
    id: 'standard' as const,
    key: 'hasActed' as const,
    name: 'Padrão',
    shortName: 'P',
    icon: Swords,
    color: 'primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    textColor: 'text-primary',
    description: 'Atacar, usar habilidade ou conjurar ritual',
  },
  {
    id: 'move' as const,
    key: 'hasMoved' as const,
    name: 'Movimento',
    shortName: 'M',
    icon: Move,
    color: 'accent',
    bgColor: 'bg-accent/10',
    borderColor: 'border-accent/30',
    textColor: 'text-accent',
    description: 'Mover-se até seu deslocamento',
  },
  {
    id: 'reaction' as const,
    key: 'hasReacted' as const,
    name: 'Reação',
    shortName: 'R',
    icon: Shield,
    color: 'yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-400',
    description: 'Resposta a gatilhos (fora do turno)',
  },
];

export function TurnActionsPanel({
  turnState,
  combatantName,
  onMarkAction,
  onResetActions,
  onFullAction,
  isCurrentTurn,
  isMaster,
}: TurnActionsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  // Verifica se uma ação foi usada
  const isActionUsed = (key: 'hasActed' | 'hasMoved' | 'hasReacted') => turnState[key];

  // Mapeia ID para key
  const actionIdToKey = (id: 'standard' | 'move' | 'reaction'): 'hasActed' | 'hasMoved' | 'hasReacted' => {
    switch (id) {
      case 'standard': return 'hasActed';
      case 'move': return 'hasMoved';
      case 'reaction': return 'hasReacted';
    }
  };

  // Todas as ações principais usadas?
  const allMainActionsUsed = turnState.hasActed && turnState.hasMoved;

  return (
    <div className={cn(
      "rounded-lg border transition-all",
      isCurrentTurn 
        ? "bg-primary/5 border-primary/20" 
        : "bg-card border-border opacity-75"
    )}>
      {/* Header compacto */}
      <div 
        className="flex items-center justify-between p-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Ações</span>
          
          {/* Indicadores visuais compactos */}
          <div className="flex items-center gap-1">
            {ACTIONS.map(action => {
              const used = isActionUsed(action.key);
              const Icon = action.icon;
              
              return (
                <div
                  key={action.id}
                  className={cn(
                    "w-6 h-6 rounded flex items-center justify-center transition-all",
                    used 
                      ? "bg-muted text-muted-foreground" 
                      : `${action.bgColor} ${action.textColor}`
                  )}
                  title={`${action.name}: ${used ? 'Usada' : 'Disponível'}`}
                >
                  {used ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Icon className="w-3 h-3" />
                  )}
                </div>
              );
            })}
          </div>

          {/* PE do turno */}
          <Badge 
            variant={turnState.peSpentThisTurn >= turnState.peLimit ? "destructive" : "secondary"}
            className="text-[10px] px-1.5 py-0"
          >
            <Zap className="w-2.5 h-2.5 mr-0.5" />
            {turnState.peSpentThisTurn}/{turnState.peLimit}
          </Badge>
        </div>

        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          {expanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </Button>
      </div>

      {/* Painel expandido */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {/* Ações individuais */}
              {ACTIONS.map(action => {
                const used = isActionUsed(action.key);
                const Icon = action.icon;
                
                return (
                  <div
                    key={action.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg border transition-all",
                      used 
                        ? "bg-muted/50 border-muted" 
                        : `${action.bgColor} ${action.borderColor}`
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn(
                        "w-4 h-4",
                        used ? "text-muted-foreground" : action.textColor
                      )} />
                      <div>
                        <span className={cn(
                          "text-sm font-medium",
                          used && "line-through text-muted-foreground"
                        )}>
                          {action.name}
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                    </div>

                    {isMaster && isCurrentTurn && (
                      <Button
                        variant={used ? "outline" : "secondary"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAction(action.id);
                        }}
                      >
                        {used ? 'Restaurar' : 'Usar'}
                      </Button>
                    )}
                  </div>
                );
              })}

              {/* Ação Completa */}
              {isMaster && isCurrentTurn && !allMainActionsUsed && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFullAction();
                  }}
                >
                  <Target className="w-3 h-3" />
                  Ação Completa (Padrão + Movimento)
                </Button>
              )}

              {/* Reset */}
              {isMaster && isCurrentTurn && (turnState.hasActed || turnState.hasMoved || turnState.hasReacted) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs gap-2 text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResetActions();
                  }}
                >
                  <RotateCcw className="w-3 h-3" />
                  Resetar Ações
                </Button>
              )}

              {/* Aviso de ações limitadas */}
              {turnState.actionsRemaining < 2 && (
                <div className="p-2 bg-destructive/10 rounded text-xs text-destructive text-center">
                  ⚠️ Condição Lento: apenas {turnState.actionsRemaining} ação disponível
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
