/**
 * DiceRoller - Componente de rolagem de dados simplificado
 * Removida a tabela de DT (o Mestre informa a dificuldade)
 */
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dices, X } from '@/components/icons/ordem-icons';
import { rollSkillTest, DiceRollResult } from '@/lib/dice-roller';

interface DiceRollerProps {
  attributeValue: number;
  skillBonus?: number;
  skillName?: string;
  onRoll?: (result: DiceRollResult) => void;
  className?: string;
}

export function DiceRoller({ 
  attributeValue, 
  skillBonus = 0, 
  skillName,
  onRoll,
  className 
}: DiceRollerProps) {
  const [result, setResult] = useState<DiceRollResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = useCallback(() => {
    setIsRolling(true);
    
    // Animação de rolagem
    setTimeout(() => {
      const rollResult = rollSkillTest({
        attributeValue,
        skillBonus,
        label: skillName,
      });
      
      setResult(rollResult);
      setIsRolling(false);
      onRoll?.(rollResult);
    }, 500);
  }, [attributeValue, skillBonus, skillName, onRoll]);

  const clearResult = () => setResult(null);

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRoll}
        disabled={isRolling}
        className={cn(
          'font-display tracking-wider transition-all duration-300',
          isRolling && 'animate-pulse',
          result?.isCritical && 'border-primary bg-primary/20'
        )}
      >
        <Dices className={cn('w-4 h-4 mr-2', isRolling && 'animate-spin')} />
        ROLAR {attributeValue > 0 ? `${attributeValue}d20` : '2d20'}
      </Button>

      {result && (
        <div className={cn(
          'absolute top-full mt-2 left-0 z-50 min-w-[200px] p-4',
          'bg-card border rounded-lg shadow-xl animate-scale-in',
          result.isCritical ? 'border-primary pulse-glow' : 'border-border'
        )}>
          <button 
            onClick={clearResult}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>

          {result.label && (
            <p className="text-xs text-muted-foreground mb-2">{result.label}</p>
          )}

          {/* Dados rolados */}
          <div className="flex gap-1 mb-3 flex-wrap">
            {result.dice.map((die, i) => (
              <span 
                key={i}
                className={cn(
                  'w-8 h-8 flex items-center justify-center text-sm font-bold rounded',
                  'border transition-all',
                  die === result.keptDice 
                    ? result.isCritical 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-accent text-accent-foreground border-accent'
                    : 'bg-muted/50 text-muted-foreground border-border'
                )}
              >
                {die}
              </span>
            ))}
          </div>

          {result.isDisadvantage && (
            <p className="text-xs text-destructive mb-2">
              ⚠ Atributo 0 - Manteve o menor
            </p>
          )}

          {/* Cálculo */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Dado: <span className="text-foreground">{result.keptDice}</span></p>
            {result.skillBonus > 0 && (
              <p>Perícia: <span className="text-accent">+{result.skillBonus}</span></p>
            )}
            {result.otherBonuses > 0 && (
              <p>Bônus: <span className="text-detail-accent">+{result.otherBonuses}</span></p>
            )}
          </div>

          {/* Total */}
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">TOTAL</p>
            <p className={cn(
              'font-display text-4xl',
              result.isCritical ? 'text-primary' : 'text-foreground'
            )}>
              {result.total}
            </p>
            {result.isCritical && (
              <p className="text-xs text-primary font-bold animate-pulse">
                ★ CRÍTICO!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
