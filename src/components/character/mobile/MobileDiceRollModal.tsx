/**
 * MobileDiceRollModal - Modal de rolagem de dados otimizado para mobile
 * Usa Drawer (vaul) para melhor UX em telas pequenas
 * Rola automaticamente ao abrir e exibe resultado com animação
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, RotateCcw, X, Sparkles, Info } from 'lucide-react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerFooter 
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { DiceRollResult, rollSkillTest } from '@/lib/dice-roller';

// Interface para detalhamento de bônus por origem
export interface BonusSource {
  label: string;
  value: number;
  type: 'skill' | 'resistance' | 'power' | 'track' | 'origin' | 'item' | 'other';
  description?: string;
  sourceName?: string;
}

// Props do modal mobile
interface MobileDiceRollModalProps {
  open: boolean;
  onClose: () => void;
  label: string;
  attributeValue: number;
  skillBonus?: number;
  resistanceBonus?: number;
  bonusSources?: BonusSource[];
  onRollComplete?: (result: DiceRollResult) => void;
}

// Componente de dado individual
function DiceDisplay({ 
  value, 
  isHighlighted, 
  isCritical,
  index 
}: { 
  value: number; 
  isHighlighted: boolean;
  isCritical: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: -20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
      className={cn(
        'w-12 h-12 rounded-lg flex items-center justify-center font-display text-lg font-bold',
        'border-2 shadow-lg',
        isHighlighted
          ? isCritical
            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
            : 'bg-primary/20 border-primary text-primary'
          : 'bg-muted/50 border-border text-muted-foreground'
      )}
    >
      {value}
    </motion.div>
  );
}

export function MobileDiceRollModal({
  open,
  onClose,
  label,
  attributeValue,
  skillBonus = 0,
  resistanceBonus = 0,
  bonusSources = [],
  onRollComplete,
}: MobileDiceRollModalProps) {
  // Estados
  const [phase, setPhase] = useState<'idle' | 'rolling' | 'done'>('idle');
  const [displayDice, setDisplayDice] = useState<number[]>([]);
  const [result, setResult] = useState<DiceRollResult | null>(null);
  
  // Refs
  const hasRolledRef = useRef(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Cores para cada tipo de bônus
  const bonusTypeColors: Record<BonusSource['type'], string> = {
    skill: 'bg-primary/20 text-primary',
    resistance: 'bg-green-500/20 text-green-500',
    power: 'bg-purple-500/20 text-purple-500',
    track: 'bg-orange-500/20 text-orange-500',
    origin: 'bg-blue-500/20 text-blue-500',
    item: 'bg-amber-500/20 text-amber-500',
    other: 'bg-secondary/50 text-secondary-foreground',
  };

  // Calcula quantidade de dados
  const diceCount = attributeValue <= 0 ? 2 : attributeValue;

  // Função para executar a rolagem
  const executeRoll = useCallback(() => {
    // Limpa animação anterior
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }

    setPhase('rolling');
    setResult(null);
    
    let frameCount = 0;
    const maxFrames = 10;
    
    // Animação de números aleatórios
    animationRef.current = setInterval(() => {
      const randomValues = Array.from({ length: diceCount }, () => 
        Math.floor(Math.random() * 20) + 1
      );
      setDisplayDice(randomValues);
      
      frameCount++;
      
      if (frameCount >= maxFrames) {
        if (animationRef.current) {
          clearInterval(animationRef.current);
          animationRef.current = null;
        }
        
        // Rolagem real
        const totalBonus = skillBonus + resistanceBonus;
        const rollResult = rollSkillTest({
          attributeValue,
          skillBonus: totalBonus,
          label,
        });
        
        setDisplayDice(rollResult.dice);
        setResult(rollResult);
        setPhase('done');
        
        // Confetti em crítico
        if (rollResult.isCritical) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#ffd700', '#ff6b6b', '#4ecdc4'],
          });
        }
        
        onRollComplete?.(rollResult);
      }
    }, 80);
  }, [attributeValue, skillBonus, resistanceBonus, label, diceCount, onRollComplete]);

  // Auto-rolar ao abrir
  useEffect(() => {
    if (open && !hasRolledRef.current) {
      hasRolledRef.current = true;
      const timer = setTimeout(executeRoll, 200);
      return () => clearTimeout(timer);
    }
  }, [open, executeRoll]);

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
      setPhase('idle');
      setDisplayDice([]);
      setResult(null);
      hasRolledRef.current = false;
    }
  }, [open]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  const total = result?.total || 0;
  const isRolling = phase === 'rolling';

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-center pb-0">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Dices className="w-5 h-5 text-primary" />
            <DrawerTitle className="font-display text-lg tracking-wider">
              {label}
            </DrawerTitle>
          </div>
          <DrawerDescription className="text-xs">
            {attributeValue <= 0 
              ? `Desvantagem: ${diceCount}d20, pega o menor`
              : `Pool de ${diceCount}d20, pega o maior`
            }
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-6 space-y-4">
          {/* Área dos dados */}
          <div className="flex flex-wrap justify-center gap-2 min-h-[60px]">
            {displayDice.map((die, index) => (
              <DiceDisplay
                key={`dice-${index}`}
                value={die}
                isHighlighted={result !== null && die === result.keptDice}
                isCritical={result?.isCritical || false}
                index={index}
              />
            ))}
            
            {/* Placeholder */}
            {displayDice.length === 0 && (
              <div className="flex gap-2">
                {Array.from({ length: diceCount }).map((_, i) => (
                  <div 
                    key={`placeholder-${i}`}
                    className="w-12 h-12 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center"
                  >
                    <Dices className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resultado */}
          <AnimatePresence mode="wait">
            {result && phase === 'done' && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {/* Breakdown compacto */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
                  <span className="px-2 py-1 rounded bg-secondary/50 font-medium">
                    d20: {result.keptDice}
                  </span>
                  
                  {bonusSources.length > 0 ? (
                    bonusSources.filter(s => s.value !== 0).map((source, idx) => (
                      <TooltipProvider key={idx} delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={cn(
                              'px-2 py-1 rounded font-medium flex items-center gap-1',
                              bonusTypeColors[source.type]
                            )}>
                              {source.label}: {source.value > 0 ? '+' : ''}{source.value}
                              {(source.description || source.sourceName) && (
                                <Info className="w-3 h-3 opacity-60" />
                              )}
                            </span>
                          </TooltipTrigger>
                          {(source.description || source.sourceName) && (
                            <TooltipContent side="top" className="max-w-[200px] text-xs">
                              <p className="font-medium">{source.sourceName || source.label}</p>
                              {source.description && (
                                <p className="text-muted-foreground mt-0.5">{source.description}</p>
                              )}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    ))
                  ) : (
                    <>
                      {skillBonus > 0 && (
                        <span className="px-2 py-1 rounded bg-primary/20 text-primary font-medium">
                          Perícia: +{skillBonus}
                        </span>
                      )}
                      {resistanceBonus > 0 && (
                        <span className="px-2 py-1 rounded bg-green-500/20 text-green-500 font-medium">
                          Resistência: +{resistanceBonus}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Total grande */}
                <div className="text-center">
                  <motion.div 
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className={cn(
                      'font-display text-5xl font-bold',
                      result.isCritical && 'text-yellow-500',
                      result.isDisadvantage && !result.isCritical && 'text-destructive'
                    )}
                  >
                    {total}
                  </motion.div>
                  
                  {/* Badges de status */}
                  <div className="flex justify-center gap-2 mt-2">
                    {result.isCritical && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-display"
                      >
                        <Sparkles className="w-3 h-3" />
                        CRÍTICO!
                      </motion.span>
                    )}
                    {result.isDisadvantage && (
                      <span className="px-2 py-1 rounded-full bg-destructive/20 text-destructive text-xs font-display">
                        DESVANTAGEM
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Indicador de rolagem */}
          {isRolling && (
            <div className="text-center text-muted-foreground text-sm animate-pulse">
              Rolando dados...
            </div>
          )}
        </div>

        <DrawerFooter className="pt-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={executeRoll}
              disabled={isRolling}
              className="flex-1 font-display h-12"
            >
              <RotateCcw className={cn('w-4 h-4 mr-2', isRolling && 'animate-spin')} />
              ROLAR NOVAMENTE
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="font-display h-12"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
