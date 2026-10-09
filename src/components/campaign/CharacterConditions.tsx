/**
 * CharacterConditions - Gerenciador de condições do personagem
 * 
 * NOTA: Radix Tooltip removido para evitar React Error #185 (Maximum update depth exceeded)
 * Em listas dinâmicas, TooltipTrigger dispara setRef() em cascata causando loop infinito
 * Solução: usar atributo title nativo do HTML
 * 
 * @see memory/architecture/restricao-tooltip-radix-listas-dinamicas
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
// ScrollArea removido - usando overflow nativo para evitar bug #185 com React 19
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
// Tooltip do Radix removido - causa loop #185 em listas dinâmicas
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CONDITIONS, CONDITION_CATEGORIES, type Condition } from '@/lib/conditions';
import { Plus, X, AlertTriangle, Info } from '@/components/icons/ordem-icons';

interface CharacterConditionsProps {
  conditions: string[];
  onConditionsChange?: (conditions: string[]) => void;
  readonly?: boolean;
  compact?: boolean;
}

export function CharacterConditions({
  conditions,
  onConditionsChange,
  readonly = false,
  compact = false,
}: CharacterConditionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const activeConditions = conditions
    .map(id => CONDITIONS[id])
    .filter(Boolean);

  const toggleCondition = (conditionId: string) => {
    if (readonly || !onConditionsChange) return;

    if (conditions.includes(conditionId)) {
      onConditionsChange(conditions.filter(c => c !== conditionId));
    } else {
      onConditionsChange([...conditions, conditionId]);
    }
  };

  const removeCondition = (conditionId: string) => {
    if (readonly || !onConditionsChange) return;
    onConditionsChange(conditions.filter(c => c !== conditionId));
  };

  // Modo compacto: usa atributo title nativo em vez de Radix Tooltip (evita loop #185)
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {activeConditions.length === 0 ? (
          <span className="text-xs text-muted-foreground">Sem condições</span>
        ) : (
          activeConditions.map((condition) => (
            <Badge
              key={condition.id}
              variant="outline"
              title={`${condition.name}: ${condition.effect}`}
              className={cn(
                'text-xs cursor-help',
                condition.id === 'morrendo' && 'border-destructive text-destructive animate-pulse',
                condition.id === 'sangrando' && 'border-health text-health',
                condition.id === 'vulneravel' && 'border-warning text-warning'
              )}
            >
              {condition.icon} {condition.name}
            </Badge>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">Condições</h4>
        {!readonly && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <Plus className="w-3 h-3 mr-1" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-xl tracking-wider">
                  GERENCIAR CONDIÇÕES
                </DialogTitle>
                <DialogDescription>
                  Selecione as condições ativas do personagem.
                </DialogDescription>
              </DialogHeader>
              
              <div className="max-h-[60vh] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                <div className="space-y-6 pr-4">
                  {/* Combat Conditions */}
                  <ConditionCategory
                    title="Combate"
                    icon="⚔️"
                    conditionIds={CONDITION_CATEGORIES.combat}
                    activeConditions={conditions}
                    onToggle={toggleCondition}
                  />

                  {/* Sensory Conditions */}
                  <ConditionCategory
                    title="Sentidos"
                    icon="👁️"
                    conditionIds={CONDITION_CATEGORIES.sensory}
                    activeConditions={conditions}
                    onToggle={toggleCondition}
                  />

                  {/* Mental Conditions */}
                  <ConditionCategory
                    title="Mental"
                    icon="🧠"
                    conditionIds={CONDITION_CATEGORIES.mental}
                    activeConditions={conditions}
                    onToggle={toggleCondition}
                  />

                  {/* Physical Conditions */}
                  <ConditionCategory
                    title="Físico"
                    icon="💪"
                    conditionIds={CONDITION_CATEGORIES.physical}
                    activeConditions={conditions}
                    onToggle={toggleCondition}
                  />

                  {/* Critical Conditions */}
                  <ConditionCategory
                    title="Crítico"
                    icon="💀"
                    conditionIds={CONDITION_CATEGORIES.critical}
                    activeConditions={conditions}
                    onToggle={toggleCondition}
                    danger
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Lista de condições ativas - usa title nativo (evita loop #185) */}
      <div className="flex flex-wrap gap-2">
        {activeConditions.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhuma condição ativa</p>
        ) : (
          activeConditions.map((condition) => {
            // Tooltip nativo concatenado (nome + efeito + remoção)
            const tooltipText = [
              `${condition.name}: ${condition.effect}`,
              condition.removal ? `Remoção: ${condition.removal}` : null,
            ].filter(Boolean).join(' | ');

            return (
              <div
                key={condition.id}
                title={tooltipText}
                className={cn(
                  'group flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all cursor-help',
                  'bg-muted/30 hover:bg-muted/50',
                  condition.id === 'morrendo' && 'border-destructive bg-destructive/10 animate-pulse',
                  condition.id === 'sangrando' && 'border-health bg-health/10',
                  condition.id === 'vulneravel' && 'border-warning bg-warning/10',
                  condition.id === 'apavorado' && 'border-sanity bg-sanity/10',
                  condition.id === 'enlouquecendo' && 'border-destructive bg-destructive/10'
                )}
              >
                <span className="text-base">{condition.icon}</span>
                <span className="text-sm font-medium">{condition.name}</span>
                {!readonly && (
                  <button
                    onClick={() => removeCondition(condition.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  >
                    <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

interface ConditionCategoryProps {
  title: string;
  icon: string;
  conditionIds: string[];
  activeConditions: string[];
  onToggle: (id: string) => void;
  danger?: boolean;
}

function ConditionCategory({
  title,
  icon,
  conditionIds,
  activeConditions,
  onToggle,
  danger,
}: ConditionCategoryProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h3 className={cn(
          'font-display text-sm tracking-wider',
          danger && 'text-destructive'
        )}>
          {title}
        </h3>
        {danger && <AlertTriangle className="w-4 h-4 text-destructive" />}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {conditionIds.map((id) => {
          const condition = CONDITIONS[id];
          if (!condition) return null;
          
          const isActive = activeConditions.includes(id);

          return (
            <button
              key={id}
              onClick={() => onToggle(id)}
              className={cn(
                'flex items-start gap-2 p-3 rounded-lg border text-left transition-all',
                isActive
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-muted/30 hover:border-border/80 hover:bg-muted/50',
                danger && isActive && 'border-destructive bg-destructive/10'
              )}
            >
              <span className="text-xl">{condition.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'font-medium text-sm',
                    isActive && (danger ? 'text-destructive' : 'text-primary')
                  )}>
                    {condition.name}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {condition.effect}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
