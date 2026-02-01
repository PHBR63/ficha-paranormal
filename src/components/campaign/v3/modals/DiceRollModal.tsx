/**
 * DiceRollModal - Modal de rolagem rápida de dados
 * 
 * Funcionalidades:
 * - Input para expressão de dados (2d20+5, 3d6, etc.)
 * - Parser compatível com OP v1.3
 * - Animação de rolagem usando Framer Motion
 * - Histórico de últimas rolagens
 * - Envio automático para o chat
 * - Rolagens ocultas (mestre)
 * - Suporte a vantagem/desvantagem
 * 
 * @module components/campaign/v3/modals/DiceRollModal
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Eye, EyeOff, History, X, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Interface para resultado de rolagem
export interface DiceRollResult {
  expression: string;
  rolls: number[];
  modifier: number;
  total: number;
  isHidden: boolean;
  advantage?: 'advantage' | 'disadvantage';
  criticalHit?: boolean;
  criticalFail?: boolean;
  timestamp: Date;
}

// Interface para metadados enviados ao chat
export interface DiceRollMetadata {
  expression: string;
  rolls: number[];
  modifier: number;
  total: number;
  advantage?: 'advantage' | 'disadvantage';
  criticalHit?: boolean;
  criticalFail?: boolean;
}

interface DiceRollModalProps {
  /** Se o modal está aberto */
  open: boolean;
  /** Callback para fechar o modal */
  onOpenChange: (open: boolean) => void;
  /** Se o usuário é mestre */
  isMaster?: boolean;
  /** Callback ao rolar dados */
  onRoll?: (description: string, metadata: DiceRollMetadata, isHidden: boolean) => void;
}

// Presets rápidos de dados comuns
const DICE_PRESETS = [
  { label: 'd20', expression: '1d20' },
  { label: '2d20', expression: '2d20' },
  { label: 'd12', expression: '1d12' },
  { label: 'd10', expression: '1d10' },
  { label: 'd8', expression: '1d8' },
  { label: 'd6', expression: '1d6' },
  { label: '2d6', expression: '2d6' },
  { label: '3d6', expression: '3d6' },
  { label: 'd4', expression: '1d4' },
  { label: 'd100', expression: '1d100' },
];

// Parser de expressão de dados
function parseDiceExpression(expression: string): { count: number; sides: number; modifier: number } | null {
  // Remove espaços e converte para minúsculas
  const cleaned = expression.toLowerCase().replace(/\s/g, '');
  
  // Regex para expressões tipo "2d20+5", "1d6-2", "d20"
  const match = cleaned.match(/^(\d*)d(\d+)([+-]\d+)?$/);
  
  if (!match) return null;
  
  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;
  
  if (count < 1 || count > 100 || sides < 2 || sides > 1000) return null;
  
  return { count, sides, modifier };
}

// Função para rolar dados
function rollDice(count: number, sides: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
}

// Componente de dado animado
const AnimatedDie = memo(function AnimatedDie({ 
  value, 
  sides,
  index,
  isCritical,
  isCriticalFail,
}: { 
  value: number;
  sides: number;
  index: number;
  isCritical?: boolean;
  isCriticalFail?: boolean;
}) {
  return (
    <motion.div
      initial={{ rotateX: 0, rotateY: 0, scale: 0 }}
      animate={{ 
        rotateX: [0, 360, 720, 0],
        rotateY: [0, 360, 720, 0],
        scale: [0, 1.2, 1],
      }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: 'easeOut',
      }}
      className={cn(
        'w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg',
        'border-2 shadow-lg',
        isCritical && 'bg-green-500/20 border-green-500 text-green-500',
        isCriticalFail && 'bg-destructive/20 border-destructive text-destructive',
        !isCritical && !isCriticalFail && 'bg-primary/10 border-primary text-primary',
      )}
    >
      {value}
    </motion.div>
  );
});

// Item de histórico
const HistoryItem = memo(function HistoryItem({
  result,
  onClick,
}: {
  result: DiceRollResult;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-mono">{result.expression}</span>
        <div className="flex items-center gap-2">
          {result.isHidden && <EyeOff className="h-3 w-3 text-muted-foreground" />}
          <Badge 
            variant={result.criticalHit ? 'default' : result.criticalFail ? 'destructive' : 'outline'}
            className="font-mono"
          >
            {result.total}
          </Badge>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">
        [{result.rolls.join(', ')}]{result.modifier !== 0 && ` ${result.modifier > 0 ? '+' : ''}${result.modifier}`}
      </p>
    </button>
  );
});

export const DiceRollModal = memo(function DiceRollModal({
  open,
  onOpenChange,
  isMaster = false,
  onRoll,
}: DiceRollModalProps) {
  const [expression, setExpression] = useState('1d20');
  const [isHidden, setIsHidden] = useState(false);
  const [advantage, setAdvantage] = useState<'advantage' | 'disadvantage' | null>(null);
  const [lastResult, setLastResult] = useState<DiceRollResult | null>(null);
  const [history, setHistory] = useState<DiceRollResult[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Foca no input ao abrir
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.select(), 100);
    }
  }, [open]);

  // Função para executar rolagem
  const executeRoll = useCallback(() => {
    const parsed = parseDiceExpression(expression);
    if (!parsed) return;

    setIsRolling(true);

    // Simula animação
    setTimeout(() => {
      let rolls = rollDice(parsed.count, parsed.sides);
      let total: number;

      // Vantagem/Desvantagem para d20
      if (advantage && parsed.sides === 20 && parsed.count === 1) {
        const secondRoll = rollDice(1, 20);
        rolls = [rolls[0], secondRoll[0]];
        
        if (advantage === 'advantage') {
          total = Math.max(...rolls) + parsed.modifier;
        } else {
          total = Math.min(...rolls) + parsed.modifier;
        }
      } else {
        total = rolls.reduce((a, b) => a + b, 0) + parsed.modifier;
      }

      // Verifica críticos (apenas para d20)
      const criticalHit = parsed.sides === 20 && parsed.count === 1 && 
        (advantage === 'advantage' ? Math.max(...rolls) === 20 : rolls[0] === 20);
      const criticalFail = parsed.sides === 20 && parsed.count === 1 && 
        (advantage === 'disadvantage' ? Math.min(...rolls) === 1 : rolls[0] === 1);

      const result: DiceRollResult = {
        expression,
        rolls,
        modifier: parsed.modifier,
        total,
        isHidden,
        advantage: advantage || undefined,
        criticalHit,
        criticalFail,
        timestamp: new Date(),
      };

      setLastResult(result);
      setHistory(prev => [result, ...prev.slice(0, 19)]); // Mantém últimas 20
      setIsRolling(false);

      // Envia para o chat
      if (onRoll) {
        const rollDescription = `🎲 ${expression}${advantage ? ` (${advantage === 'advantage' ? 'vantagem' : 'desvantagem'})` : ''}: [${rolls.join(', ')}]${parsed.modifier !== 0 ? ` ${parsed.modifier > 0 ? '+' : ''}${parsed.modifier}` : ''} = **${total}**${criticalHit ? ' 🌟 CRÍTICO!' : ''}${criticalFail ? ' 💀 FALHA CRÍTICA!' : ''}`;
        
        onRoll(rollDescription, {
          expression,
          rolls,
          modifier: parsed.modifier,
          total,
          advantage: advantage || undefined,
          criticalHit,
          criticalFail,
        }, isHidden);
      }
    }, 600);
  }, [expression, isHidden, advantage, onRoll]);

  // Handler de tecla Enter
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isRolling) {
      executeRoll();
    }
  }, [executeRoll, isRolling]);

  // Seleciona preset
  const handlePresetClick = useCallback((preset: string) => {
    setExpression(preset);
    inputRef.current?.focus();
  }, []);

  // Repete rolagem do histórico
  const handleHistoryClick = useCallback((result: DiceRollResult) => {
    setExpression(result.expression);
    setShowHistory(false);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dices className="h-5 w-5 text-primary" />
            Rolar Dados
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Input de expressão */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="2d20+5"
              className="font-mono text-center text-lg"
              disabled={isRolling}
            />
            <Button 
              onClick={executeRoll} 
              disabled={isRolling || !parseDiceExpression(expression)}
              className="gap-2"
            >
              <Dices className="h-4 w-4" />
              Rolar
            </Button>
          </div>

          {/* Presets rápidos */}
          <div className="flex flex-wrap gap-1.5">
            {DICE_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs font-mono"
                onClick={() => handlePresetClick(preset.expression)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Opções */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {/* Vantagem */}
              <Toggle
                pressed={advantage === 'advantage'}
                onPressedChange={(pressed) => setAdvantage(pressed ? 'advantage' : null)}
                size="sm"
                className="gap-1 text-xs"
                title="Vantagem (rola 2d20, usa o maior)"
              >
                <ChevronUp className="h-3.5 w-3.5" />
                Vantagem
              </Toggle>
              
              {/* Desvantagem */}
              <Toggle
                pressed={advantage === 'disadvantage'}
                onPressedChange={(pressed) => setAdvantage(pressed ? 'disadvantage' : null)}
                size="sm"
                className="gap-1 text-xs"
                title="Desvantagem (rola 2d20, usa o menor)"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                Desvantagem
              </Toggle>
            </div>

            <div className="flex items-center gap-1">
              {/* Rolagem oculta (só mestre) */}
              {isMaster && (
                <Toggle
                  pressed={isHidden}
                  onPressedChange={setIsHidden}
                  size="sm"
                  className="gap-1 text-xs"
                  title="Rolagem oculta (só você vê)"
                >
                  {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  Oculta
                </Toggle>
              )}

              {/* Histórico */}
              <Toggle
                pressed={showHistory}
                onPressedChange={setShowHistory}
                size="sm"
                className="gap-1 text-xs"
              >
                <History className="h-3.5 w-3.5" />
                Histórico
              </Toggle>
            </div>
          </div>

          {/* Área de resultado / histórico */}
          <div className="min-h-[120px] border rounded-lg bg-muted/30 overflow-hidden">
            <AnimatePresence mode="wait">
              {showHistory ? (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ScrollArea className="h-[180px]">
                    <div className="p-2 space-y-1">
                      {history.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">
                          Nenhuma rolagem ainda
                        </p>
                      ) : (
                        history.map((result, i) => (
                          <HistoryItem
                            key={i}
                            result={result}
                            onClick={() => handleHistoryClick(result)}
                          />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </motion.div>
              ) : lastResult ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-4 flex flex-col items-center gap-3"
                >
                  {/* Dados animados */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {lastResult.rolls.map((roll, i) => (
                      <AnimatedDie
                        key={i}
                        value={roll}
                        sides={parseInt(expression.match(/d(\d+)/)?.[1] || '20', 10)}
                        index={i}
                        isCritical={lastResult.criticalHit && (
                          lastResult.advantage === 'advantage' 
                            ? roll === Math.max(...lastResult.rolls)
                            : i === 0
                        )}
                        isCriticalFail={lastResult.criticalFail && (
                          lastResult.advantage === 'disadvantage'
                            ? roll === Math.min(...lastResult.rolls)
                            : i === 0
                        )}
                      />
                    ))}
                  </div>

                  {/* Total */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      [{lastResult.rolls.join(', ')}]
                      {lastResult.modifier !== 0 && ` ${lastResult.modifier > 0 ? '+' : ''}${lastResult.modifier}`}
                    </p>
                    <div className={cn(
                      'text-3xl font-bold flex items-center gap-2',
                      lastResult.criticalHit && 'text-green-500',
                      lastResult.criticalFail && 'text-destructive',
                    )}>
                      {lastResult.criticalHit && <Sparkles className="h-6 w-6" />}
                      {lastResult.total}
                      {lastResult.criticalHit && <Sparkles className="h-6 w-6" />}
                    </div>
                    {lastResult.criticalHit && (
                      <Badge variant="default" className="mt-2 bg-green-500">
                        ACERTO CRÍTICO!
                      </Badge>
                    )}
                    {lastResult.criticalFail && (
                      <Badge variant="destructive" className="mt-2">
                        FALHA CRÍTICA!
                      </Badge>
                    )}
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-[120px] flex items-center justify-center"
                >
                  <div className="text-center text-muted-foreground">
                    <Dices className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Digite uma expressão e role os dados</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default DiceRollModal;
