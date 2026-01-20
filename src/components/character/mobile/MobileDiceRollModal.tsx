/**
 * MobileDiceRollModal - Modal de rolagem de dados otimizado para mobile
 * Usa Drawer (vaul) para melhor UX em telas pequenas
 * Rola automaticamente ao abrir e exibe resultado com animação
 * 
 * PARIDADE DESKTOP: Suporta ativação de poderes (Saber é Poder, etc.)
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, RotateCcw, X, Sparkles, Info, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  MobileDrawer,
  MobileDrawerContent,
  MobileDrawerHeader,
  MobileDrawerTitle,
  MobileDrawerDescription,
  MobileDrawerBody,
  MobileDrawerFooter 
} from '@/components/ui/mobile-drawer';
import { MobileButtonGroup } from '@/components/ui/mobile-button-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { DiceRollResult, rollSkillTest } from '@/lib/dice-roller';
import { 
  usePowerActivation, 
  type ActivatablePower 
} from '@/components/dice/PowerActivationPanel';
import { calculatePowerActivationEffects } from '@/lib/class-powers/activatable-powers-bridge';

// Interface para detalhamento de bônus por origem
export interface BonusSource {
  label: string;
  value: number;
  type: 'skill' | 'resistance' | 'power' | 'track' | 'origin' | 'item' | 'other';
  description?: string;
  sourceName?: string;
}

// Props do modal mobile (com paridade desktop para ativação de poderes)
interface MobileDiceRollModalProps {
  open: boolean;
  onClose: () => void;
  label: string;
  attributeValue: number;
  skillBonus?: number;
  resistanceBonus?: number;
  bonusSources?: BonusSource[];
  onRollComplete?: (result: DiceRollResult) => void;
  // Novas props para ativação de poderes (paridade desktop)
  activatablePowers?: ActivatablePower[];
  peCurrent?: number;
  nex?: number;
  intellect?: number;
  onPEChange?: (newPE: number) => void;
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
  // Novas props para ativação de poderes
  activatablePowers = [],
  peCurrent = 0,
  nex = 5,
  intellect = 1,
  onPEChange,
}: MobileDiceRollModalProps) {
  // Estados
  const [phase, setPhase] = useState<'idle' | 'rolling' | 'done'>('idle');
  const [displayDice, setDisplayDice] = useState<number[]>([]);
  const [result, setResult] = useState<DiceRollResult | null>(null);
  const [isPowerPanelExpanded, setIsPowerPanelExpanded] = useState(true);
  
  // Refs (React 19: valor inicial obrigatório)
  const hasRolledRef = useRef<boolean>(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Hook para gerenciar ativação de poderes (paridade desktop)
  const {
    activationStates,
    togglePower,
    resetActivations,
    getActivePowers,
    getTotalPECost,
  } = usePowerActivation(activatablePowers);

  // Calcular efeitos dos poderes ativados
  const activatedPowerEffects = useMemo(() => {
    const activePowers = getActivePowers();
    let extraBonus = 0;
    const extraDice: string[] = [];
    let attributeSwap: string | undefined;
    const notes: string[] = [];
    
    for (const ap of activePowers) {
      const effects = calculatePowerActivationEffects(ap.powerId, nex, intellect);
      extraBonus += effects.skillBonusChange;
      if (effects.extraDice) extraDice.push(effects.extraDice);
      if (effects.attributeSwap) attributeSwap = effects.attributeSwap;
      if (effects.specialNote) notes.push(effects.specialNote);
    }
    
    return { extraBonus, extraDice, attributeSwap, notes };
  }, [getActivePowers, nex, intellect]);

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
        
        // Rolagem real com bônus de poderes ativados
        const powerBonus = activatedPowerEffects.extraBonus;
        const totalBonus = skillBonus + resistanceBonus + powerBonus;
        const rollResult = rollSkillTest({
          attributeValue,
          skillBonus: totalBonus,
          label,
        });
        
        setDisplayDice(rollResult.dice);
        setResult(rollResult);
        setPhase('done');
        
        // Descontar PE dos poderes ativados
        const peCost = getTotalPECost();
        if (peCost > 0 && onPEChange) {
          onPEChange(Math.max(0, peCurrent - peCost));
        }
        
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
  }, [attributeValue, skillBonus, resistanceBonus, activatedPowerEffects.extraBonus, label, diceCount, onRollComplete, getTotalPECost, onPEChange, peCurrent]);

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
      resetActivations(); // Reset ativação de poderes
    }
  }, [open, resetActivations]);

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
    <MobileDrawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <MobileDrawerContent maxHeight="lg">
        <MobileDrawerHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Dices className="w-5 h-5 text-primary" />
            <MobileDrawerTitle className="font-display text-lg tracking-wider">
              {label}
            </MobileDrawerTitle>
          </div>
          <MobileDrawerDescription className="text-xs">
            {attributeValue <= 0 
              ? `Desvantagem: ${diceCount}d20, pega o menor`
              : `Pool de ${diceCount}d20, pega o maior`
            }
          </MobileDrawerDescription>
        </MobileDrawerHeader>

        <MobileDrawerBody useScrollArea={false}>
          <div className="space-y-4">
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

            {/* Painel de ativação de poderes - mobile-friendly */}
            {activatablePowers.length > 0 && peCurrent > 0 && (
              <div className="border-t border-border pt-3 mt-3">
                <button
                  onClick={() => setIsPowerPanelExpanded(!isPowerPanelExpanded)}
                  className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-500" />
                    Poderes Ativáveis ({activatablePowers.length})
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-[10px]">
                      PE: {peCurrent} | Custo: {getTotalPECost()}
                    </span>
                    {isPowerPanelExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                </button>
                
                <AnimatePresence>
                  {isPowerPanelExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2">
                        {activatablePowers.map((power) => {
                          const isActive = activationStates.find(s => s.powerId === power.id)?.isActive || false;
                          const canAfford = peCurrent >= (power.peCost || 0);
                          
                          return (
                            <div
                              key={power.id}
                              className={cn(
                                'flex items-center justify-between p-2 rounded-lg border transition-colors',
                                isActive 
                                  ? 'bg-accent/20 border-accent' 
                                  : 'bg-muted/30 border-border',
                                !canAfford && !isActive && 'opacity-50'
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium truncate">
                                    {power.name}
                                  </span>
                                  {power.peCost && power.peCost > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary shrink-0">
                                      {power.peCost} PE
                                    </span>
                                  )}
                                </div>
                                {power.description && (
                                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                    {power.description}
                                  </p>
                                )}
                              </div>
                              <Switch
                                checked={isActive}
                                onCheckedChange={(checked) => {
                                  if (canAfford || isActive) {
                                    togglePower(power.id, checked);
                                  }
                                }}
                                disabled={!canAfford && !isActive}
                                className="ml-2 shrink-0 scale-90"
                              />
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Indicador de bônus ativo */}
                      {activatedPowerEffects.extraBonus > 0 && (
                        <div className="mt-2 p-2 rounded bg-accent/10 border border-accent/30">
                          <div className="flex items-center gap-1.5 text-xs text-accent">
                            <Sparkles className="w-3 h-3" />
                            <span>Bônus ativado: +{activatedPowerEffects.extraBonus}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

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
                    
                    {/* Badges de poderes ativados - indicador visual no breakdown */}
                    {getActivePowers().map((activePower) => {
                      // Buscar dados completos do poder na lista de poderes ativáveis
                      const powerData = activatablePowers.find(p => p.id === activePower.powerId);
                      if (!powerData) return null;
                      
                      const effects = calculatePowerActivationEffects(activePower.powerId, nex, intellect);
                      if (effects.skillBonusChange === 0) return null;
                      
                      return (
                        <TooltipProvider key={activePower.powerId} delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="px-2 py-1 rounded font-medium flex items-center gap-1 bg-accent/20 text-accent-foreground">
                                <Zap className="w-3 h-3 text-accent" />
                                +{effects.skillBonusChange} {powerData.name}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px] text-xs">
                              <p className="font-medium">{powerData.name}</p>
                              <p className="text-muted-foreground mt-0.5">
                                {powerData.description || `Bônus de +${effects.skillBonusChange} ativado por ${powerData.peCost || 0} PE`}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                    
                    {/* Indicador de PE consumido */}
                    {getTotalPECost() > 0 && (
                      <span className="px-2 py-1 rounded font-medium flex items-center gap-1 bg-destructive/20 text-destructive">
                        -{getTotalPECost()} PE
                      </span>
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
        </MobileDrawerBody>

        <MobileDrawerFooter>
          <MobileButtonGroup
            buttons={[
              {
                id: 'reroll',
                label: 'ROLAR NOVAMENTE',
                icon: <RotateCcw className={cn(isRolling && 'animate-spin')} />,
                onClick: executeRoll,
                variant: 'outline',
                type: 'secondary',
                disabled: isRolling,
              },
              {
                id: 'close',
                label: '',
                icon: <X />,
                onClick: onClose,
                variant: 'ghost',
                type: 'secondary',
              },
            ]}
          />
        </MobileDrawerFooter>
      </MobileDrawerContent>
    </MobileDrawer>
  );
}
