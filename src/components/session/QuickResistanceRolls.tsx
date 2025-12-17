// Rolagens rápidas de resistência para sessões presenciais
// Ordem Paranormal RPG v1.3

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Zap, 
  Brain,
  Dices,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface RollResult {
  type: 'fortitude' | 'reflexos' | 'vontade';
  roll: number;
  modifier: number;
  total: number;
  timestamp: Date;
}

interface QuickResistanceRollsProps {
  // Atributos base
  vigor: number;
  agility: number;
  presence: number;
  // Bônus de perícia (se treinado)
  fortitudeBonus?: number;
  reflexosBonus?: number;
  vontadeBonus?: number;
  // Modificadores de condições
  conditionModifier?: number;
  // Callback
  onRoll?: (result: RollResult) => void;
  className?: string;
}

const COMMON_DTS = [15, 20, 25, 30];

const RESISTANCE_CONFIG = {
  fortitude: {
    label: 'Fortitude',
    icon: Shield,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    description: 'VIG + treinado'
  },
  reflexos: {
    label: 'Reflexos',
    icon: Zap,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    description: 'AGI + treinado'
  },
  vontade: {
    label: 'Vontade',
    icon: Brain,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'PRE + treinado'
  }
} as const;

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export function QuickResistanceRolls({
  vigor,
  agility,
  presence,
  fortitudeBonus = 0,
  reflexosBonus = 0,
  vontadeBonus = 0,
  conditionModifier = 0,
  onRoll,
  className
}: QuickResistanceRollsProps) {
  const [lastResult, setLastResult] = useState<RollResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const getModifier = useCallback((type: RollResult['type']): number => {
    switch (type) {
      case 'fortitude':
        return vigor + fortitudeBonus + conditionModifier;
      case 'reflexos':
        return agility + reflexosBonus + conditionModifier;
      case 'vontade':
        return presence + vontadeBonus + conditionModifier;
    }
  }, [vigor, agility, presence, fortitudeBonus, reflexosBonus, vontadeBonus, conditionModifier]);

  const handleRoll = useCallback((type: RollResult['type']) => {
    setIsRolling(true);
    
    // Pequeno delay para efeito visual
    setTimeout(() => {
      const roll = rollD20();
      const modifier = getModifier(type);
      const total = roll + modifier;

      const result: RollResult = {
        type,
        roll,
        modifier,
        total,
        timestamp: new Date(),
      };

      setLastResult(result);
      setIsRolling(false);
      onRoll?.(result);
    }, 200);
  }, [getModifier, onRoll]);

  const checkAgainstDT = (dt: number): boolean | null => {
    if (!lastResult) return null;
    return lastResult.total >= dt;
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Botões de Resistência */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(RESISTANCE_CONFIG) as Array<keyof typeof RESISTANCE_CONFIG>).map(type => {
          const config = RESISTANCE_CONFIG[type];
          const Icon = config.icon;
          const modifier = getModifier(type);
          const isSelected = lastResult?.type === type;

          return (
            <Button
              key={type}
              variant="outline"
              className={cn(
                "flex flex-col h-auto py-2 px-2 gap-1 transition-all",
                config.borderColor,
                isSelected && config.bgColor,
                isRolling && "animate-pulse"
              )}
              onClick={() => handleRoll(type)}
              disabled={isRolling}
            >
              <Icon className={cn("w-5 h-5", config.color)} />
              <span className="text-xs font-medium">{config.label}</span>
              <span className={cn("text-[10px]", config.color)}>
                +{modifier}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Resultado */}
      <AnimatePresence mode="wait">
        {lastResult && (
          <motion.div
            key={lastResult.timestamp.getTime()}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
              "rounded-lg border p-3 space-y-2",
              RESISTANCE_CONFIG[lastResult.type].bgColor,
              RESISTANCE_CONFIG[lastResult.type].borderColor
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dices className={cn("w-4 h-4", RESISTANCE_CONFIG[lastResult.type].color)} />
                <span className="text-sm font-medium">
                  {RESISTANCE_CONFIG[lastResult.type].label}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "font-mono",
                    lastResult.roll === 20 && "bg-green-500 text-white",
                    lastResult.roll === 1 && "bg-destructive text-destructive-foreground"
                  )}
                >
                  d20: {lastResult.roll}
                </Badge>
                <span className="text-muted-foreground">+</span>
                <span className="font-mono">{lastResult.modifier}</span>
                <span className="text-muted-foreground">=</span>
                <span className={cn(
                  "font-bold text-lg",
                  RESISTANCE_CONFIG[lastResult.type].color
                )}>
                  {lastResult.total}
                </span>
              </div>
            </div>

            {/* DTs Comuns */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">vs DT:</span>
              <div className="flex gap-1">
                {COMMON_DTS.map(dt => {
                  const passed = checkAgainstDT(dt);
                  return (
                    <Badge
                      key={dt}
                      variant="outline"
                      className={cn(
                        "text-xs font-mono",
                        passed === true && "bg-green-500/20 text-green-500 border-green-500/30",
                        passed === false && "bg-destructive/20 text-destructive border-destructive/30"
                      )}
                    >
                      {dt}
                      {passed !== null && (
                        passed ? (
                          <Check className="w-3 h-3 ml-0.5" />
                        ) : (
                          <X className="w-3 h-3 ml-0.5" />
                        )
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Crítico/Falha Crítica */}
            {lastResult.roll === 20 && (
              <div className="text-xs text-green-500 font-medium">
                🎯 CRÍTICO NATURAL!
              </div>
            )}
            {lastResult.roll === 1 && (
              <div className="text-xs text-destructive font-medium">
                💀 FALHA CRÍTICA!
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dica */}
      {!lastResult && (
        <div className="text-center text-xs text-muted-foreground py-2">
          Clique em uma resistência para rolar
        </div>
      )}
    </div>
  );
}
