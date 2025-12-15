/**
 * DiceRollModal - Modal de rolagem imediata de dados
 * Abre instantaneamente ao clicar em uma perícia/atributo
 * Rola automaticamente e exibe resultado com animação
 * 
 * REFATORADO: Removida animação infinita problemática
 * Usa animação simples de fade/scale sem loops
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, X, RotateCcw, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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

// Componente de dado individual - animação simples sem loop
function DiceDisplay({ 
  value, 
  isHighlighted, 
  isCritical,
  isAnimating 
}: { 
  value: number; 
  isHighlighted: boolean;
  isCritical: boolean;
  isAnimating: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        rotate: isAnimating ? 360 : 0,
      }}
      transition={{ 
        duration: 0.3,
        rotate: { duration: 0.5, ease: "easeOut" }
      }}
      className={cn(
        'w-14 h-14 rounded-lg flex items-center justify-center font-display text-xl font-bold',
        'border-2 shadow-lg transition-colors duration-300',
        isHighlighted
          ? isCritical
            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-yellow-500/30'
            : 'bg-primary/20 border-primary text-primary shadow-primary/30'
          : 'bg-muted/50 border-border text-muted-foreground'
      )}
    >
      {value}
    </motion.div>
  );
}

export function DiceRollModal({
  open,
  onClose,
  label,
  attributeValue,
  skillBonus = 0,
  onRollComplete,
}: DiceRollModalProps) {
  // Estados
  const [phase, setPhase] = useState<'idle' | 'rolling' | 'done'>('idle');
  const [displayDice, setDisplayDice] = useState<number[]>([]);
  const [result, setResult] = useState<DiceRollResult | null>(null);
  
  // Ref para controlar se já rolou nesta abertura
  const hasRolledRef = useRef(false);
  // Ref para o intervalo de animação
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Calcula quantidade de dados
  const diceCount = attributeValue <= 0 ? 2 : attributeValue;

  // Função para executar a rolagem
  const executeRoll = () => {
    // Limpa qualquer animação anterior
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }

    setPhase('rolling');
    setResult(null);
    
    let frameCount = 0;
    const maxFrames = 12;
    
    // Animação de números aleatórios
    animationRef.current = setInterval(() => {
      const randomValues = Array.from({ length: diceCount }, () => 
        Math.floor(Math.random() * 20) + 1
      );
      setDisplayDice(randomValues);
      
      frameCount++;
      
      if (frameCount >= maxFrames) {
        // Para a animação
        if (animationRef.current) {
          clearInterval(animationRef.current);
          animationRef.current = null;
        }
        
        // Executa a rolagem real
        const rollResult = rollSkillTest({
          attributeValue,
          skillBonus,
          label,
        });
        
        setDisplayDice(rollResult.dice);
        setResult(rollResult);
        setPhase('done');
        
        // Confetti em crítico
        if (rollResult.isCritical) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ffd700', '#ff6b6b', '#4ecdc4'],
          });
        }
        
        // Callback
        onRollComplete?.(rollResult);
      }
    }, 100);
  };

  // Efeito para auto-rolar quando abre
  useEffect(() => {
    if (open && !hasRolledRef.current) {
      hasRolledRef.current = true;
      // Pequeno delay antes de rolar
      const timer = setTimeout(() => {
        executeRoll();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Efeito para resetar quando fecha
  useEffect(() => {
    if (!open) {
      // Limpa animação se estiver rodando
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
      // Reset estados
      setPhase('idle');
      setDisplayDice([]);
      setResult(null);
      hasRolledRef.current = false;
    }
  }, [open]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  // Handler para rolar novamente
  const handleReroll = () => {
    executeRoll();
  };

  const total = result?.total || 0;
  const isRolling = phase === 'rolling';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wider text-center flex items-center justify-center gap-2">
            <Dices className="w-5 h-5 text-primary" />
            {label}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {attributeValue <= 0 
              ? `Desvantagem: ${diceCount}d20, pega o menor`
              : `Pool de ${diceCount}d20, pega o maior`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Área dos dados */}
          <div className="flex flex-wrap justify-center gap-3 min-h-[80px]">
            {displayDice.map((die, index) => (
              <DiceDisplay
                key={`dice-${index}`}
                value={die}
                isHighlighted={result !== null && die === result.keptDice}
                isCritical={result?.isCritical || false}
                isAnimating={isRolling}
              />
            ))}
            
            {/* Placeholder quando não há dados */}
            {displayDice.length === 0 && (
              <div className="flex gap-3">
                {Array.from({ length: diceCount }).map((_, i) => (
                  <div 
                    key={`placeholder-${i}`}
                    className="w-14 h-14 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center"
                  >
                    <Dices className="w-6 h-6 text-muted-foreground/50" />
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
                transition={{ duration: 0.2 }}
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
                <div className="text-center">
                  <motion.div 
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    className={cn(
                      'font-display text-6xl font-bold',
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
                        transition={{ delay: 0.1 }}
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

          {/* Botões de ação */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleReroll}
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
