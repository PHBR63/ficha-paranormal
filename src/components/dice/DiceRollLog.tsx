import { DiceRollResult } from '@/lib/dice-roller';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DiceRollLogProps {
  rolls: DiceRollResult[];
  maxRolls?: number;
  className?: string;
}

export function DiceRollLog({ rolls, maxRolls = 10, className }: DiceRollLogProps) {
  const displayRolls = rolls.slice(-maxRolls).reverse();

  if (displayRolls.length === 0) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground', className)}>
        Nenhuma rolagem ainda
      </div>
    );
  }

  return (
    <ScrollArea className={cn('h-[300px]', className)}>
      <div className="space-y-2 p-2">
        {displayRolls.map((roll, index) => (
          <div
            key={index}
            className={cn(
              'p-3 rounded-lg border animate-fade-in',
              roll.isCritical 
                ? 'bg-primary/10 border-primary/30' 
                : 'bg-card border-border'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {roll.label || 'Teste'}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(roll.timestamp, { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Dados */}
              <div className="flex gap-1">
                {roll.dice.map((die, i) => (
                  <span
                    key={i}
                    className={cn(
                      'w-6 h-6 flex items-center justify-center text-xs font-bold rounded',
                      die === roll.keptDice
                        ? roll.isCritical
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent text-accent-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {die}
                  </span>
                ))}
              </div>

              {roll.skillBonus > 0 && (
                <span className="text-xs text-accent">+{roll.skillBonus}</span>
              )}

              <span className="text-muted-foreground">=</span>

              <span className={cn(
                'font-display text-xl',
                roll.isCritical ? 'text-primary' : 'text-foreground'
              )}>
                {roll.total}
              </span>

              {roll.isCritical && (
                <span className="text-xs text-primary font-bold">★ CRIT</span>
              )}

              {roll.isDisadvantage && (
                <span className="text-xs text-destructive">⚠ Desv.</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
