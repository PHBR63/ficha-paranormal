/**
 * ConditionSelector - Seletor de condições do sistema OP v1.3
 * 
 * Dropdown para aplicar/remover condições em personagens
 * Lista oficial do Livro Base v1.3
 * 
 * @module components/campaign/v3/master/ConditionSelector
 */

import { memo, useState, useCallback } from 'react';
import { Check, Plus, X, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CONDITIONS } from '@/lib/conditions/condition-definitions';
import { getConditionPresentation, resolveConditionId } from '@/lib/conditions/condition-identity';

// Lista oficial de condições do Livro Base v1.3
export const OP_CONDITIONS = Object.values(CONDITIONS).map(condition => ({
  id: condition.id, name: condition.name,
  description: condition.effect,
  color: 'bg-primary',
}));

interface ConditionSelectorProps {
  /** Condições atualmente ativas */
  activeConditions: string[];
  /** Callback ao aplicar condição */
  onApply: (conditionId: string) => void;
  /** Callback ao remover condição */
  onRemove: (conditionId: string) => void;
  /** Se está processando */
  isLoading?: boolean;
  /** Modo compacto (só ícone) */
  compact?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

export const ConditionSelector = memo(function ConditionSelector({
  activeConditions,
  onApply,
  onRemove,
  isLoading = false,
  compact = false,
  className,
}: ConditionSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleConditionClick = useCallback((conditionId: string) => {
    const originalId = activeConditions.find(id => resolveConditionId(id) === conditionId);
    if (originalId) {
      onRemove(originalId);
    } else {
      onApply(conditionId);
    }
  }, [activeConditions, onApply, onRemove]);

  const hasConditions = activeConditions.length > 0;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Badges de condições ativas */}
      {hasConditions && !compact && (
        <div className="flex flex-wrap gap-1 mr-1">
          {activeConditions.slice(0, 2).map((condId) => {
            const presentation = getConditionPresentation(condId, condId);
            const condition = { ...presentation, color: 'bg-primary' };
            return (
              <Badge
                key={condId}
                variant="outline"
                className={cn(
                  'text-[10px] px-1.5 py-0 h-5 gap-1 cursor-pointer',
                  'hover:bg-destructive/20'
                )}
                onClick={() => onRemove(condId)}
                title={`Remover ${condition.name}`}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', condition.color)} />
                {condition.name}
                <X className="h-2.5 w-2.5" />
              </Badge>
            );
          })}
          {activeConditions.length > 2 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
              +{activeConditions.length - 2}
            </Badge>
          )}
        </div>
      )}

      {/* Dropdown de condições */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn('h-6 w-6', hasConditions && 'border-yellow-500/50')}
            disabled={isLoading}
            title="Gerenciar condições" aria-label="Gerenciar condições"
          >
            {hasConditions ? (
              <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 max-h-[300px] overflow-y-auto">
          <DropdownMenuLabel className="text-xs">Condições (OP v1.3)</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {OP_CONDITIONS.map((condition) => {
            const isActive = activeConditions.some(id => resolveConditionId(id) === condition.id);
            return (
              <DropdownMenuItem
                key={condition.id}
                onClick={() => handleConditionClick(condition.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <span className={cn('w-2 h-2 rounded-full shrink-0', condition.color)} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{condition.name}</span>
                    <p className="text-[10px] text-muted-foreground whitespace-normal">
                      {condition.description}
                    </p>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

export default ConditionSelector;
