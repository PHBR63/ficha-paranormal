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

// Lista oficial de condições do Livro Base v1.3
export const OP_CONDITIONS = [
  { id: 'agarrado', name: 'Agarrado', description: '-5 em testes de Agilidade, não pode se mover', color: 'bg-orange-500' },
  { id: 'amedrontado', name: 'Amedrontado', description: 'Deve fugir da fonte do medo', color: 'bg-purple-500' },
  { id: 'alquebrado', name: 'Alquebrado', description: '-2 em todos os testes', color: 'bg-gray-500' },
  { id: 'atordoado', name: 'Atordoado', description: 'Perde próxima ação, -5 Defesa', color: 'bg-yellow-500' },
  { id: 'caido', name: 'Caído', description: '-5 em ataques corpo a corpo, +5 contra você', color: 'bg-stone-500' },
  { id: 'cego', name: 'Cego', description: '-5 em testes, -10 em Percepção visual', color: 'bg-slate-700' },
  { id: 'confuso', name: 'Confuso', description: 'Ações aleatórias no início do turno', color: 'bg-pink-500' },
  { id: 'desprevenido', name: 'Desprevenido', description: '-5 Defesa, vulnerável a ataques furtivos', color: 'bg-amber-500' },
  { id: 'exausto', name: 'Exausto', description: 'Deslocamento ÷2, -5 em todos os testes', color: 'bg-red-800' },
  { id: 'fascinado', name: 'Fascinado', description: '-5 Percepção, perde ação se atacado', color: 'bg-rose-400' },
  { id: 'imovel', name: 'Imóvel', description: 'Não pode se mover', color: 'bg-blue-700' },
  { id: 'inconsciente', name: 'Inconsciente', description: 'Indefeso, não age, cai', color: 'bg-neutral-800' },
  { id: 'enjoado', name: 'Enjoado', description: '-2 em todos os testes', color: 'bg-lime-600' },
  { id: 'envenenado', name: 'Envenenado', description: 'Recebe dano por veneno', color: 'bg-green-700' },
  { id: 'paralisado', name: 'Paralisado', description: 'Indefeso, não pode agir ou se mover', color: 'bg-indigo-700' },
  { id: 'pasmo', name: 'Pasmo', description: 'Perde próxima ação padrão', color: 'bg-cyan-500' },
  { id: 'sangrando', name: 'Sangrando', description: 'Perde PV no início do turno', color: 'bg-red-600' },
  { id: 'surdo', name: 'Surdo', description: '-10 Percepção auditiva, -5 Iniciativa', color: 'bg-violet-600' },
  { id: 'traumatizado', name: 'Traumatizado', description: 'Desvantagem em testes mentais', color: 'bg-fuchsia-700' },
  { id: 'vulneravel', name: 'Vulnerável', description: 'Críticos em 18-20, dano +50%', color: 'bg-red-500' },
] as const;

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
    if (activeConditions.includes(conditionId)) {
      onRemove(conditionId);
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
            const condition = OP_CONDITIONS.find(c => c.id === condId);
            if (!condition) return null;
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
            title="Gerenciar condições"
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
            const isActive = activeConditions.includes(condition.id);
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
                    <p className="text-[10px] text-muted-foreground truncate">
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
