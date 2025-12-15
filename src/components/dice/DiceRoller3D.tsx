/**
 * DiceRoller3D - Componente de rolagem de dados com animação 3D
 * Removida a tabela de DT (o Mestre informa a dificuldade)
 */
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dices, Sparkles } from "lucide-react";
import { rollSkillTest, type DiceRollResult } from "@/lib/dice-roller";

interface DiceRoller3DProps {
  attributeValue: number;
  skillBonus?: number;
  skillName?: string;
  onRoll?: (result: DiceRollResult) => void;
  className?: string;
  compact?: boolean;
}

export function DiceRoller3D({
  attributeValue,
  skillBonus = 0,
  skillName = "Teste",
  onRoll,
  className,
  compact = false,
}: DiceRoller3DProps) {
  const [result, setResult] = useState<DiceRollResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showDice, setShowDice] = useState(false);

  const handleRoll = useCallback(() => {
    setIsRolling(true);
    setShowDice(true);

    // Animate for a bit before showing result
    setTimeout(() => {
      const rollResult = rollSkillTest({
        attributeValue,
        skillBonus,
        label: skillName,
      });

      setResult(rollResult);
      setIsRolling(false);

      // Trigger confetti on critical
      if (rollResult.isCritical) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff4444', '#ff8800', '#ffff00'],
        });
      }

      onRoll?.(rollResult);
    }, 1200);
  }, [attributeValue, skillBonus, skillName, onRoll]);

  const clearResult = () => {
    setResult(null);
    setShowDice(false);
  };

  if (compact) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleRoll}
        disabled={isRolling}
        className={cn("gap-2", className)}
      >
        <motion.div
          animate={isRolling ? { rotate: 360 } : {}}
          transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
        >
          <Dices className="w-4 h-4" />
        </motion.div>
        Rolar
      </Button>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Roll button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={handleRoll}
          disabled={isRolling}
          size="lg"
          className="w-full action-button font-display tracking-wider gap-3"
        >
          <motion.div
            animate={isRolling ? { rotate: 360 } : {}}
            transition={{ duration: 0.3, repeat: isRolling ? Infinity : 0 }}
          >
            <Dices className="w-5 h-5" />
          </motion.div>
          {isRolling ? "Rolando..." : `Rolar ${skillName}`}
        </Button>
      </motion.div>

      {/* Dice animation */}
      <AnimatePresence>
        {showDice && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="relative"
          >
            {/* Rolling animation */}
            {isRolling && (
              <div className="flex justify-center gap-2">
                {Array.from({ length: Math.max(1, attributeValue) }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-12 h-12 bg-secondary border-2 border-primary/50 rounded-lg flex items-center justify-center text-2xl font-bold"
                    animate={{
                      rotateX: [0, 360, 720],
                      rotateY: [0, 180, 360],
                      y: [0, -20, 0],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  >
                    ?
                  </motion.div>
                ))}
              </div>
            )}

            {/* Result */}
            {result && !isRolling && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="dossier-card p-4 space-y-4"
              >
                {/* Critical indicator */}
                {result.isCritical && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    className="flex items-center justify-center gap-2 text-primary font-display text-xl"
                  >
                    <Sparkles className="w-5 h-5" />
                    CRÍTICO!
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                )}

                {/* Dice values */}
                <div className="flex justify-center gap-2 flex-wrap">
                  {result.dice.map((die, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotateY: 180 }}
                      animate={{ scale: 1, rotateY: 0 }}
                      transition={{ delay: i * 0.1, type: "spring" }}
                      className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold border-2",
                        die === result.keptDice
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-secondary border-border text-muted-foreground"
                      )}
                    >
                      {die}
                    </motion.div>
                  ))}
                </div>

                {/* Calculation */}
                <div className="text-center space-y-1">
                  <div className="text-sm text-muted-foreground">
                    {result.keptDice}
                    {result.skillBonus > 0 && ` + ${result.skillBonus}`}
                    {result.otherBonuses > 0 && ` + ${result.otherBonuses}`}
                    {result.isDisadvantage && " (Desvantagem)"}
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className={cn(
                      "text-4xl font-display",
                      result.isCritical && "text-primary animate-pulse"
                    )}
                  >
                    = {result.total}
                  </motion.div>
                </div>

                {/* Clear button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearResult}
                  className="w-full"
                >
                  Limpar
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Quick roll button for inline use
interface QuickRollButtonProps {
  attributeValue: number;
  skillBonus?: number;
  label: string;
  onResult?: (result: DiceRollResult) => void;
}

export function QuickRollButton({
  attributeValue,
  skillBonus = 0,
  label,
  onResult,
}: QuickRollButtonProps) {
  const [lastResult, setLastResult] = useState<number | null>(null);

  const handleRoll = () => {
    const result = rollSkillTest({
      attributeValue,
      skillBonus,
      label,
    });
    setLastResult(result.total);
    onResult?.(result);

    if (result.isCritical) {
      confetti({
        particleCount: 50,
        spread: 45,
        origin: { y: 0.8 },
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRoll}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <Dices className="w-3 h-3" />
      {label}
      {lastResult !== null && (
        <motion.span
          key={lastResult}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-primary font-bold"
        >
          [{lastResult}]
        </motion.span>
      )}
    </Button>
  );
}
