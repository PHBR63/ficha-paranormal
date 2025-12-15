/**
 * DiceRollModal - Modal de rolagem imediata de dados
 * Abre instantaneamente ao clicar em uma perícia/atributo
 * Rola automaticamente e exibe resultado com animação
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, X, RotateCcw, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { DiceRollResult, rollSkillTest } from '@/lib/dice-roller';

// Interface para props da modal
interface DiceRollModalProps {
  open: boolean;
  onClose: () => void;
  label: string;
  attributeValue: number;
  skillBonus?: number;
  onRollComplete?: (result: DiceRollResult) => void;
}

export function DiceRollModal({
  open,
  onClose,
  label,
  attributeValue,
  skillBonus = 0,
  onRollComplete,
}: DiceRollModalProps) {
  // Estado da rolagem
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<DiceRollResult | null>(null);
  const [animatingDice, setAnimatingDice] = useState<number[]>([]);
  const [hasRolled, setHasRolled] = useState(false);

  // Função para rolar os dados - sem dependências que causem loop
  const rollDice = useCallback(() => {
    setIsRolling(true);
    setResult(null);

    // Simula animação dos dados por 1.2 segundos
    const animationFrames = 15;
    let frame = 0;
    const diceCount = attributeValue <= 0 ? 2 : attributeValue;
    
    const interval = setInterval(() => {
      // Gera dados aleatórios para animação
      const randomDice = Array.from({ length: diceCount }, () => 
        Math.floor(Math.random() * 20) + 1
      );
      setAnimatingDice(randomDice);
      
      frame++;
      if (frame >= animationFrames) {
        clearInterval(interval);
        
        // Executa rolagem real
        const rollResult = rollSkillTest({
          attributeValue,
          skillBonus,
          label,
        });
        
        setResult(rollResult);
        setAnimatingDice(rollResult.dice);
        setIsRolling(false);
        
        // Dispara confetti em crítico
        if (rollResult.isCritical) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ffd700', '#ff6b6b', '#4ecdc4'],
          });
        }
        
        // Callback para histórico
        onRollComplete?.(rollResult);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [attributeValue, skillBonus, label, onRollComplete]);

  // Rola automaticamente APENAS quando a modal abre pela primeira vez
  useEffect(() => {
    if (open && !hasRolled) {
      const timeout = setTimeout(() => {
        rollDice();
        setHasRolled(true);
      }, 200);
      return () => clearTimeout(timeout);
    }
    
    // Reset ao fechar
    if (!open) {
      setResult(null);
      setAnimatingDice([]);
      setHasRolled(false);
    }
  }, [open, hasRolled, rollDice]);

  // Calcula total para exibição
  const total = result?.total || 0;
  const diceCount = attributeValue <= 0 ? 2 : attributeValue;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wider text-center flex items-center justify-center gap-2">
            <Dices className="w-5 h-5 text-primary" />
            {label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Área dos dados */}
          <div className="flex flex-wrap justify-center gap-3 min-h-[80px]">
            <AnimatePresence mode="popLayout">
              {animatingDice.map((die, index) => (
                <motion.div
                  key={`${index}-${die}`}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ 
                    scale: 1, 
                    rotate: isRolling ? [0, 180, 360] : 0,
                  }}
                  exit={{ scale: 0 }}
                  transition={{ 
                    duration: isRolling ? 0.1 : 0.3,
                    repeat: isRolling ? Infinity : 0,
                  }}
                  className={cn(
                    'w-14 h-14 rounded-lg flex items-center justify-center font-display text-xl font-bold',
                    'border-2 shadow-lg',
                    // Destaca o dado mantido (maior ou menor)
                    result && die === result.keptDice
                      ? result.isCritical
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-yellow-500/30'
                        : 'bg-primary/20 border-primary text-primary shadow-primary/30'
                      : 'bg-muted/50 border-border text-muted-foreground'
                  )}
                >
                  {die}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Info do pool */}
          <div className="text-center text-sm text-muted-foreground">
            {attributeValue <= 0 ? (
              <span className="text-destructive">
                ⚠ Desvantagem: rola {diceCount}d20 e pega o MENOR
              </span>
            ) : (
              <span>
                Pool de {diceCount}d20 — pega o MAIOR
              </span>
            )}
          </div>

          {/* Resultado */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {/* Breakdown do cálculo */}
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="px-3 py-1 rounded bg-secondary/50 font-medium">
                    d20: {result.keptDice}
                  </span>
                  {skillBonus > 0 && (
                    <>
                      <span className="text-muted-foreground">+</span>
                      <span className="px-3 py-1 rounded bg-primary/20 text-primary font-medium">
                        Perícia: +{skillBonus}
                      </span>
                    </>
                  )}
                </div>

                {/* Total grande */}
                <motion.div 
                  className="text-center"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                >
                  <div className={cn(
                    'font-display text-6xl font-bold',
                    result.isCritical && 'text-yellow-500 animate-pulse',
                    result.isDisadvantage && !result.isCritical && 'text-destructive'
                  )}>
                    {total}
                  </div>
                  
                  {/* Badges de status */}
                  <div className="flex justify-center gap-2 mt-2">
                    {result.isCritical && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-sm font-display"
                      >
                        <Sparkles className="w-4 h-4" />
                        CRÍTICO!
                      </motion.span>
                    )}
                    {result.isDisadvantage && (
                      <span className="px-3 py-1 rounded-full bg-destructive/20 text-destructive text-sm font-display">
                        DESVANTAGEM
                      </span>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botões de ação */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={rollDice}
              disabled={isRolling}
              className="flex-1 font-display"
            >
              <RotateCcw className={cn('w-4 h-4 mr-2', isRolling && 'animate-spin')} />
              ROLAR NOVAMENTE
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="font-display"
            >
              <X className="w-4 h-4 mr-2" />
              FECHAR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
