/**
 * MobileResistanceCheckModal - Modal de teste de resistência para mobile
 * Interface compacta usando MobileDrawer - PARIDADE COMPLETA COM DESKTOP
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MobileDrawer, 
  MobileDrawerContent, 
  MobileDrawerHeader, 
  MobileDrawerTitle, 
  MobileDrawerBody,
  MobileDrawerFooter 
} from '@/components/ui/mobile-drawer';
import { Button } from '@/components/ui/button';
import { MobileButtonGroup } from '@/components/ui/mobile-button-group';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  Dices, 
  Check, 
  X, 
  Heart,
  Brain,
  Wind,
  ChevronRight,
  Sparkles,
} from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';
import { ResistanceType, ResistanceEffect } from '@/lib/rituals/legacy-exports';
import { getElementConfig } from '@/lib/element-config';

// Ícones e cores para tipos de resistência
const RESISTANCE_CONFIG: Record<ResistanceType, { 
  icon: typeof Shield; 
  color: string; 
  label: string;
  attribute: string;
}> = {
  'fortitude': { icon: Heart, color: 'text-health', label: 'Fortitude', attribute: 'VIG' },
  'reflexos': { icon: Wind, color: 'text-energy', label: 'Reflexos', attribute: 'AGI' },
  'vontade': { icon: Brain, color: 'text-sanity', label: 'Vontade', attribute: 'PRE' },
};

// Descrições dos efeitos de resistência
const EFFECT_DESCRIPTIONS: Record<ResistanceEffect, string> = {
  'anula': 'Sucesso anula completamente o efeito',
  'parcial': 'Sucesso reduz dano à metade ou evita condição',
  'reduz_metade': 'Sucesso reduz o dano à metade',
};

export interface ResistanceCheckResult {
  passed: boolean;
  roll: number;
  total: number;
  dt: number;
  type: ResistanceType;
  effect: ResistanceEffect;
  margin: number;
}

interface MobileResistanceCheckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resistanceType: ResistanceType;
  effect: ResistanceEffect;
  damage?: number;
  defaultDT?: number;
  targetAttributes?: {
    vigor: number;
    agility: number;
    presence: number;
  };
  onResult: (result: ResistanceCheckResult, adjustedDamage?: number) => void;
  // Props adicionais para paridade com desktop
  ritualName?: string;
  ritualElement?: string;
  ritualCircle?: number;
  appliesConditions?: boolean;
}

// Rolar pool de dados
function rollPool(attributeValue: number): { dice: number[]; best: number } {
  const rollD20 = () => Math.floor(Math.random() * 20) + 1;
  
  if (attributeValue <= 0) {
    const dice = [rollD20(), rollD20()];
    return { dice, best: Math.min(...dice) };
  }
  const dice = Array.from({ length: attributeValue }, () => rollD20());
  return { dice, best: Math.max(...dice) };
}

export function MobileResistanceCheckModal({
  open,
  onOpenChange,
  resistanceType,
  effect,
  damage,
  defaultDT = 15,
  targetAttributes,
  onResult,
  ritualName,
  ritualElement,
  ritualCircle,
  appliesConditions,
}: MobileResistanceCheckModalProps) {
  const [customDT, setCustomDT] = useState<string>('');
  const [manualRoll, setManualRoll] = useState<string>('');
  const [rollResult, setRollResult] = useState<{
    dice: number[];
    best: number;
    total: number;
  } | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const config = RESISTANCE_CONFIG[resistanceType];
  const ResistanceIcon = config.icon;
  
  // Calcula DT baseado no círculo do ritual (DT base + 5 por círculo acima do 1º)
  const calculatedDT = defaultDT + ((ritualCircle || 1) - 1) * 5;
  const dt = customDT ? parseInt(customDT) : calculatedDT;

  // Configuração do elemento para gradient background
  const elementConfig = ritualElement ? getElementConfig(ritualElement) : null;

  const targetAttribute = targetAttributes ? (
    resistanceType === 'fortitude' ? targetAttributes.vigor :
    resistanceType === 'reflexos' ? targetAttributes.agility :
    targetAttributes.presence
  ) : null;

  const handleRoll = () => {
    if (targetAttribute === null) return;

    setIsRolling(true);
    setRollResult(null);

    setTimeout(() => {
      const { dice, best } = rollPool(targetAttribute);
      setRollResult({ dice, best, total: best });
      setIsRolling(false);
    }, 500);
  };

  const handleManualRoll = () => {
    const roll = parseInt(manualRoll);
    if (isNaN(roll) || roll < 1 || roll > 20) return;
    setRollResult({ dice: [roll], best: roll, total: roll });
  };

  const testResult = useMemo(() => {
    if (!rollResult) return null;
    const passed = rollResult.total >= dt;
    return {
      passed,
      roll: rollResult.best,
      total: rollResult.total,
      dt,
      type: resistanceType,
      effect,
      margin: rollResult.total - dt,
    };
  }, [rollResult, dt, resistanceType, effect]);

  const adjustedDamage = useMemo(() => {
    if (!testResult || damage === undefined) return undefined;
    switch (effect) {
      case 'anula':
        return testResult.passed ? 0 : damage;
      case 'parcial':
      case 'reduz_metade':
        return testResult.passed ? Math.floor(damage / 2) : damage;
      default:
        return damage;
    }
  }, [testResult, damage, effect]);

  const handleConfirm = () => {
    if (!testResult) return;
    onResult(testResult, adjustedDamage);
    onOpenChange(false);
    setRollResult(null);
    setManualRoll('');
    setCustomDT('');
  };

  const handleClose = () => {
    setRollResult(null);
    setManualRoll('');
    setCustomDT('');
    onOpenChange(false);
  };

  return (
    <MobileDrawer open={open} onOpenChange={handleClose}>
      <MobileDrawerContent maxHeight="lg">
        {/* Gradient background baseado no elemento do ritual */}
        {elementConfig && (
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none rounded-t-[10px]"
            style={{
              background: `linear-gradient(135deg, ${elementConfig.color}40 0%, transparent 50%)`,
            }}
          />
        )}
        
        <MobileDrawerHeader className="relative">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              "bg-gradient-to-br from-background to-muted border-2 border-border"
            )}>
              <ResistanceIcon className={cn("w-5 h-5", config.color)} />
            </div>
            <div className="flex-1">
              <MobileDrawerTitle className="font-display text-base">
                Teste de {config.label}
              </MobileDrawerTitle>
              {ritualName && (
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {ritualName}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="text-[10px]">
                  {config.attribute}
                </Badge>
                {ritualCircle && (
                  <Badge variant="secondary" className="text-[10px]">
                    {ritualCircle}º Círculo
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </MobileDrawerHeader>

        <MobileDrawerBody useScrollArea={false} className="space-y-4 relative">
          {/* Descrição do efeito de resistência */}
          <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3" />
              <span className="font-medium capitalize">{effect}:</span>
              <span>{EFFECT_DESCRIPTIONS[effect]}</span>
            </div>
          </div>

          {/* DT */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
            <div>
              <span className="text-sm">Dificuldade (DT)</span>
              {ritualCircle && ritualCircle > 1 && (
                <p className="text-[10px] text-muted-foreground">
                  Base {defaultDT} + {(ritualCircle - 1) * 5} (círculo)
                </p>
              )}
            </div>
            <Input
              type="number"
              value={customDT}
              onChange={(e) => setCustomDT(e.target.value)}
              placeholder={String(dt)}
              className="w-16 h-8 text-center"
            />
          </div>

          {/* Dano original */}
          {damage !== undefined && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/10 border border-destructive/30">
              <span className="text-sm">Dano original</span>
              <Badge variant="destructive">{damage}</Badge>
            </div>
          )}

          {/* Rolagem */}
          <div className="space-y-2">
            {targetAttribute !== null && (
              <Button
                onClick={handleRoll}
                disabled={isRolling}
                variant="outline"
                className="w-full h-11 gap-2"
              >
                <Dices className={cn("w-4 h-4", isRolling && "animate-spin")} />
                Rolar {targetAttribute}d20
              </Button>
            )}

            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                max={20}
                value={manualRoll}
                onChange={(e) => setManualRoll(e.target.value)}
                placeholder="Resultado manual (1-20)"
                className="flex-1"
              />
              <Button
                onClick={handleManualRoll}
                disabled={!manualRoll}
                variant="secondary"
              >
                Usar
              </Button>
            </div>
          </div>

          {/* Resultado */}
          <AnimatePresence mode="wait">
            {isRolling ? (
              <motion.div
                key="rolling"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <Dices className={cn("w-8 h-8 mx-auto animate-spin", config.color)} />
                <p className="text-sm text-muted-foreground mt-2">Rolando...</p>
              </motion.div>
            ) : rollResult && testResult ? (
              <motion.div
                key="result"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-3"
              >
                {/* Dados */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {rollResult.dice.map((die, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg",
                        "bg-card border-2",
                        die === rollResult.best
                          ? testResult.passed
                            ? "border-success text-success"
                            : "border-destructive text-destructive"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {die}
                    </motion.div>
                  ))}
                </div>

                {/* Resultado final */}
                <div className={cn(
                  "p-4 rounded-lg border-2 text-center",
                  testResult.passed
                    ? "bg-success/10 border-success/50"
                    : "bg-destructive/10 border-destructive/50"
                )}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {testResult.passed ? (
                      <Check className="w-5 h-5 text-success" />
                    ) : (
                      <X className="w-5 h-5 text-destructive" />
                    )}
                    <span className={cn(
                      "text-xl font-bold",
                      testResult.passed ? "text-success" : "text-destructive"
                    )}>
                      {testResult.passed ? 'PASSOU!' : 'FALHOU!'}
                    </span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {rollResult.total} vs DT {dt}
                    <span className={cn(
                      "ml-2",
                      testResult.margin >= 0 ? "text-success" : "text-destructive"
                    )}>
                      ({testResult.margin >= 0 ? '+' : ''}{testResult.margin})
                    </span>
                  </div>

                  {/* Dano ajustado */}
                  {damage !== undefined && adjustedDamage !== undefined && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <div className="flex items-center justify-center gap-1.5 text-sm">
                        <span className="text-muted-foreground">Dano:</span>
                        <span className="line-through text-muted-foreground">{damage}</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <Badge className={cn(
                          adjustedDamage === 0 
                            ? "bg-success/20 text-success" 
                            : adjustedDamage < damage 
                              ? "bg-warning/20 text-warning"
                              : "bg-destructive/20 text-destructive"
                        )}>
                          {adjustedDamage}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Indicador de condição evitada */}
                  {testResult.passed && effect === 'parcial' && appliesConditions && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-success" />
                      <span className="text-xs font-medium text-success">
                        Condição evitada!
                      </span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </MobileDrawerBody>

        <MobileDrawerFooter>
          <MobileButtonGroup
            buttons={[
              {
                id: 'apply',
                label: 'APLICAR RESULTADO',
                icon: <Check />,
                onClick: handleConfirm,
                type: 'primary',
                disabled: !testResult,
                className: testResult?.passed ? 'bg-success hover:bg-success/90' : undefined,
              },
              {
                id: 'cancel',
                label: 'CANCELAR',
                icon: <X />,
                onClick: handleClose,
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
