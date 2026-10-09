/**
 * PreparedActionBadge - Badge para ações preparadas
 * Mostra ações preparadas e permite ativá-las
 */
import { useState } from 'react';
import { Target, Zap, X, Play } from '@/components/icons/ordem-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface PreparedAction {
  id: string;
  combatantId: string;
  combatantName: string;
  trigger: string;
  action: string;
  round: number;
  isActive: boolean;
}

interface PreparedActionBadgeProps {
  action: PreparedAction;
  onTrigger: () => void;
  onCancel: () => void;
  isMaster: boolean;
}

export function PreparedActionBadge({ 
  action, 
  onTrigger, 
  onCancel,
  isMaster 
}: PreparedActionBadgeProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Badge 
          variant="outline" 
          className={cn(
            "cursor-pointer transition-all gap-1",
            action.isActive 
              ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400 animate-pulse"
              : "bg-muted border-border"
          )}
        >
          <Target className="w-3 h-3" />
          Ação Preparada
        </Badge>
      </PopoverTrigger>
      
      <PopoverContent className="w-72" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Ação Preparada</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Gatilho:</span>
              <p className="text-foreground">{action.trigger}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Ação:</span>
              <p className="text-foreground">{action.action}</p>
            </div>
            <div className="text-xs text-muted-foreground">
              Preparado na rodada {action.round}
            </div>
          </div>

          {isMaster && (
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button
                size="sm"
                className="flex-1 gap-1"
                onClick={() => {
                  onTrigger();
                  setOpen(false);
                }}
              >
                <Zap className="w-3 h-3" />
                Ativar!
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onCancel();
                  setOpen(false);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Lista de ações preparadas ativas
interface PreparedActionsListProps {
  actions: PreparedAction[];
  onTrigger: (actionId: string) => void;
  onCancel: (actionId: string) => void;
  isMaster: boolean;
}

export function PreparedActionsList({ 
  actions, 
  onTrigger, 
  onCancel,
  isMaster 
}: PreparedActionsListProps) {
  if (actions.length === 0) return null;

  return (
    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-4 h-4 text-yellow-400" />
        <span className="text-sm font-medium">Ações Preparadas</span>
      </div>
      
      <div className="space-y-2">
        {actions.map(action => (
          <div 
            key={action.id}
            className="flex items-center justify-between p-2 bg-background/50 rounded"
          >
            <div className="min-w-0">
              <span className="text-sm font-medium">{action.combatantName}</span>
              <p className="text-xs text-muted-foreground truncate">
                {action.trigger}
              </p>
            </div>
            
            {isMaster && (
              <div className="flex gap-1 ml-2">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 px-2 gap-1"
                  onClick={() => onTrigger(action.id)}
                >
                  <Zap className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => onCancel(action.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
