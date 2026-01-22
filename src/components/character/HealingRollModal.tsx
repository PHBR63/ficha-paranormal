/**
 * HealingRollModal - Modal de rolagem e aplicação de cura
 * 
 * Modal reutilizável para habilidades de cura (Paramédico, rituais, etc.)
 * Exibe dados rolados, bônus de origem (ex: INT de Agente de Saúde),
 * permite selecionar alvo e aplica a cura no HP do personagem.
 * 
 * @module components/character/HealingRollModal
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Target, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  MobileDrawer,
  MobileDrawerContent,
  MobileDrawerHeader,
  MobileDrawerTitle,
  MobileDrawerDescription,
  MobileDrawerBody,
  MobileDrawerFooter,
} from '@/components/ui/mobile-drawer';
import { DrawerClose } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

// =====================================================
// Tipos e Interfaces
// =====================================================

export interface HealingRollModalProps {
  /** Modal aberto */
  open: boolean;
  /** Callback para fechar o modal */
  onOpenChange: (open: boolean) => void;
  /** Quantidade de dados a rolar */
  diceCount: number;
  /** Tipo do dado (10 para d10) */
  dieType: number;
  /** Bônus fixo adicional (não relacionado a origem) */
  flatBonus?: number;
  /** Bônus de cura de origem (ex: INT de Agente de Saúde) */
  bonusFromOrigin: number;
  /** Nome da fonte do bônus de origem */
  bonusFromOriginSource: string | null;
  /** Nome da habilidade de cura */
  abilityName: string;
  /** Callback ao aplicar a cura */
  onApplyHealing?: (amount: number, target: 'self' | string) => void;
  /** HP atual do personagem */
  currentHp: number;
  /** HP máximo do personagem */
  maxHp: number;
  /** Lista de alvos disponíveis (futuro: aliados de campanha) */
  availableTargets?: Array<{ id: string; name: string; currentHp: number; maxHp: number }>;
}

// =====================================================
// Componente de Dado Individual
// =====================================================

interface DieDisplayProps {
  value: number;
  index: number;
  dieType: number;
}

function DieDisplay({ value, index, dieType }: DieDisplayProps) {
  const isMaxRoll = value === dieType;
  const isMinRoll = value === 1;
  
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        delay: index * 0.1,
        type: 'spring',
        stiffness: 200,
        damping: 15
      }}
      className={cn(
        'w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold border-2 shadow-lg',
        isMaxRoll && 'bg-emerald-500/30 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/50',
        isMinRoll && 'bg-red-500/30 border-red-400 text-red-300',
        !isMaxRoll && !isMinRoll && 'bg-muted/50 border-muted-foreground/30 text-foreground'
      )}
    >
      {value}
    </motion.div>
  );
}

// =====================================================
// Componente Principal
// =====================================================

export function HealingRollModal({
  open,
  onOpenChange,
  diceCount,
  dieType,
  flatBonus = 0,
  bonusFromOrigin,
  bonusFromOriginSource,
  abilityName,
  onApplyHealing,
  currentHp,
  maxHp,
  availableTargets = [],
}: HealingRollModalProps) {
  const isMobile = useIsMobile();
  
  // Estados
  const [rolledDice, setRolledDice] = useState<number[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<'self' | string>('self');
  const [hasApplied, setHasApplied] = useState(false);
  
  // Rolar dados ao abrir o modal
  useEffect(() => {
    if (open && rolledDice.length === 0 && !isRolling) {
      rollDice();
    }
  }, [open]);
  
  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setRolledDice([]);
      setIsRolling(false);
      setSelectedTarget('self');
      setHasApplied(false);
    }
  }, [open]);
  
  /**
   * Rola os dados de cura
   */
  const rollDice = useCallback(() => {
    setIsRolling(true);
    setRolledDice([]);
    
    // Simular rolagem com delay visual
    const newDice: number[] = [];
    for (let i = 0; i < diceCount; i++) {
      newDice.push(Math.floor(Math.random() * dieType) + 1);
    }
    
    // Revelar dados um a um
    setTimeout(() => {
      setRolledDice(newDice);
      setIsRolling(false);
    }, 200);
  }, [diceCount, dieType]);
  
  // Cálculo do total
  const diceTotal = useMemo(() => {
    return rolledDice.reduce((sum, d) => sum + d, 0);
  }, [rolledDice]);
  
  const totalHealing = useMemo(() => {
    return diceTotal + bonusFromOrigin + flatBonus;
  }, [diceTotal, bonusFromOrigin, flatBonus]);
  
  // Calcular HP final do alvo
  const targetHpData = useMemo(() => {
    if (selectedTarget === 'self') {
      const newHp = Math.min(currentHp + totalHealing, maxHp);
      const actualHeal = newHp - currentHp;
      return {
        current: currentHp,
        max: maxHp,
        afterHeal: newHp,
        actualHeal,
        isCapped: newHp === maxHp && totalHealing > actualHeal,
      };
    }
    
    // Alvo de campanha
    const target = availableTargets.find(t => t.id === selectedTarget);
    if (target) {
      const newHp = Math.min(target.currentHp + totalHealing, target.maxHp);
      const actualHeal = newHp - target.currentHp;
      return {
        current: target.currentHp,
        max: target.maxHp,
        afterHeal: newHp,
        actualHeal,
        isCapped: newHp === target.maxHp && totalHealing > actualHeal,
      };
    }
    
    return { current: 0, max: 0, afterHeal: 0, actualHeal: 0, isCapped: false };
  }, [selectedTarget, currentHp, maxHp, totalHealing, availableTargets]);
  
  /**
   * Aplica a cura no alvo selecionado
   */
  const handleApply = useCallback(() => {
    if (onApplyHealing && !hasApplied) {
      onApplyHealing(targetHpData.actualHeal, selectedTarget);
      setHasApplied(true);
    }
  }, [onApplyHealing, targetHpData.actualHeal, selectedTarget, hasApplied]);
  
  // ===== CONTEÚDO DO MODAL =====
  
  const ModalContent = () => (
    <div className="space-y-4">
      {/* Área de Dados Rolados */}
      <div className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">Rolagem de Cura</p>
        
        {/* Dados visuais */}
        <div className="flex flex-wrap justify-center gap-2 min-h-[56px]">
          <AnimatePresence mode="wait">
            {isRolling ? (
              <motion.div
                key="rolling"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-muted-foreground animate-pulse"
              >
                Rolando {diceCount}d{dieType}...
              </motion.div>
            ) : (
              rolledDice.map((value, idx) => (
                <DieDisplay 
                  key={`die-${idx}`}
                  value={value} 
                  index={idx} 
                  dieType={dieType} 
                />
              ))
            )}
          </AnimatePresence>
        </div>
        
        {/* Soma dos dados */}
        {rolledDice.length > 0 && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-semibold"
          >
            = {diceTotal}
          </motion.p>
        )}
      </div>
      
      {/* Bônus de Origem */}
      {(bonusFromOrigin > 0 || flatBonus > 0) && rolledDice.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: diceCount * 0.1 + 0.2 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {bonusFromOrigin > 0 && bonusFromOriginSource && (
            <Badge 
              variant="outline" 
              className="bg-purple-500/20 border-purple-500/40 text-purple-300"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {bonusFromOriginSource}: +{bonusFromOrigin}
            </Badge>
          )}
          {flatBonus > 0 && (
            <Badge 
              variant="outline" 
              className="bg-blue-500/20 border-blue-500/40 text-blue-300"
            >
              Bônus: +{flatBonus}
            </Badge>
          )}
        </motion.div>
      )}
      
      {/* Total de Cura */}
      {rolledDice.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: diceCount * 0.1 + 0.3 }}
          className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center"
        >
          <p className="text-sm text-emerald-300 mb-1">Total de Cura</p>
          <p className="text-3xl font-bold text-emerald-400 flex items-center justify-center gap-2">
            <Heart className="w-6 h-6" />
            {totalHealing} PV
          </p>
        </motion.div>
      )}
      
      {/* Seleção de Alvo */}
      {rolledDice.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: diceCount * 0.1 + 0.4 }}
          className="space-y-2"
        >
          <Label className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4" />
            Alvo da Cura
          </Label>
          
          <RadioGroup
            value={selectedTarget}
            onValueChange={(v) => setSelectedTarget(v as 'self' | string)}
            className="space-y-2"
          >
            {/* Próprio personagem */}
            <div className={cn(
              'flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer',
              selectedTarget === 'self' 
                ? 'bg-emerald-500/10 border-emerald-500/40' 
                : 'bg-muted/30 border-muted-foreground/20 hover:bg-muted/50'
            )}>
              <RadioGroupItem value="self" id="self" />
              <Label htmlFor="self" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Você mesmo
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {currentHp}/{maxHp} PV
                  </span>
                </div>
              </Label>
            </div>
            
            {/* Alvos de campanha (futuro) */}
            {availableTargets.map(target => (
              <div 
                key={target.id}
                className={cn(
                  'flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer',
                  selectedTarget === target.id 
                    ? 'bg-emerald-500/10 border-emerald-500/40' 
                    : 'bg-muted/30 border-muted-foreground/20 hover:bg-muted/50'
                )}
              >
                <RadioGroupItem value={target.id} id={target.id} />
                <Label htmlFor={target.id} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span>{target.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {target.currentHp}/{target.maxHp} PV
                    </span>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </motion.div>
      )}
      
      {/* Preview do HP após cura */}
      {rolledDice.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: diceCount * 0.1 + 0.5 }}
          className="p-3 rounded-lg bg-muted/30 border border-muted-foreground/20"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">HP após cura:</span>
            <span className="font-medium">
              <span className="text-muted-foreground">{targetHpData.current}</span>
              <span className="mx-1">→</span>
              <span className={cn(
                'font-bold',
                targetHpData.isCapped ? 'text-amber-400' : 'text-emerald-400'
              )}>
                {targetHpData.afterHeal}/{targetHpData.max}
              </span>
              {targetHpData.isCapped && (
                <span className="text-xs text-amber-400 ml-1">(máx)</span>
              )}
            </span>
          </div>
          {targetHpData.actualHeal < totalHealing && (
            <p className="text-xs text-amber-400 mt-1">
              Cura efetiva: +{targetHpData.actualHeal} PV (limite de HP máximo)
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
  
  // ===== RENDERIZAÇÃO MOBILE =====
  
  if (isMobile) {
    return (
      <MobileDrawer open={open} onOpenChange={onOpenChange}>
        <MobileDrawerContent maxHeight="lg">
          <MobileDrawerHeader>
            <MobileDrawerTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-emerald-400" />
              {abilityName}
            </MobileDrawerTitle>
            <MobileDrawerDescription>
              Rolagem de {diceCount}d{dieType} 
              {bonusFromOrigin > 0 && bonusFromOriginSource && ` +${bonusFromOrigin} (${bonusFromOriginSource})`}
            </MobileDrawerDescription>
          </MobileDrawerHeader>
          
          <MobileDrawerBody useScrollArea={true}>
            <ModalContent />
          </MobileDrawerBody>
          
          <MobileDrawerFooter>
            {rolledDice.length > 0 && !hasApplied ? (
              <>
                <Button
                  onClick={handleApply}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Aplicar Cura (+{targetHpData.actualHeal} PV)
                </Button>
                <Button
                  variant="outline"
                  onClick={rollDice}
                  className="w-full h-10"
                >
                  Rolar Novamente
                </Button>
              </>
            ) : hasApplied ? (
              <DrawerClose asChild>
                <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700">
                  Fechar
                </Button>
              </DrawerClose>
            ) : null}
            
            {!hasApplied && (
              <DrawerClose asChild>
                <Button variant="ghost" className="w-full h-10">
                  Cancelar
                </Button>
              </DrawerClose>
            )}
          </MobileDrawerFooter>
        </MobileDrawerContent>
      </MobileDrawer>
    );
  }
  
  // ===== RENDERIZAÇÃO DESKTOP =====
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-emerald-400" />
            {abilityName}
          </DialogTitle>
          <DialogDescription>
            Rolagem de {diceCount}d{dieType}
            {bonusFromOrigin > 0 && bonusFromOriginSource && ` +${bonusFromOrigin} (${bonusFromOriginSource})`}
          </DialogDescription>
        </DialogHeader>
        
        <ModalContent />
        
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {rolledDice.length > 0 && !hasApplied ? (
            <>
              <Button
                onClick={handleApply}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <Heart className="w-4 h-4 mr-2" />
                Aplicar Cura (+{targetHpData.actualHeal} PV)
              </Button>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={rollDice}
                  className="flex-1"
                >
                  Rolar Novamente
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </>
          ) : hasApplied ? (
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Fechar
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
