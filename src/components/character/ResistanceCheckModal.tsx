/**
 * ResistanceCheckModal - Modal para testes de resistência contra rituais
 * Fase 4: Sistema de resistência com Fortitude/Reflexos/Vontade
 * Calcula DT, permite rolar resistência e aplica efeitos parciais/totais
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MobileModal,
  MobileModalContent,
  MobileModalHeader,
  MobileModalBody,
  MobileModalFooter,
  MobileModalTitle,
} from '@/components/ui/mobile-modal';
import { DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  Dices, 
  Check, 
  X, 
  Zap,
  Heart,
  Brain,
  Wind,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Ritual, ResistanceType, ResistanceEffect, RitualEffect } from '@/lib/rituals/legacy-exports';
import { getElementConfig } from '@/lib/element-config';

// Ícones para tipos de resistência
const RESISTANCE_ICONS: Record<ResistanceType, typeof Shield> = {
  'fortitude': Heart,
  'reflexos': Wind,
  'vontade': Brain,
};

// Cores para tipos de resistência
const RESISTANCE_COLORS: Record<ResistanceType, string> = {
  'fortitude': 'text-health',
  'reflexos': 'text-energy',
  'vontade': 'text-sanity',
};

// Atributos associados às resistências
const RESISTANCE_ATTRIBUTES: Record<ResistanceType, string> = {
  'fortitude': 'VIG',
  'reflexos': 'AGI',
  'vontade': 'PRE',
};

// Interface para resultado do teste
export interface ResistanceCheckResult {
  passed: boolean;
  roll: number;
  total: number;
  dt: number;
  type: ResistanceType;
  effect: ResistanceEffect;
  margin: number; // Diferença entre total e DT (positivo = passou)
}

interface ResistanceCheckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ritual: Ritual | null;
  effect: RitualEffect | null;
  damage?: number; // Dano original do ritual
  onResult: (result: ResistanceCheckResult, adjustedDamage?: number) => void;
  // Atributos do alvo (para rolagem automática)
  targetAttributes?: {
    vigor: number;
    agility: number;
    presence: number;
  };
  defaultDT?: number;
}

// Função para rolar um d20
function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

// Função para rolar pool de dados (maior de N d20)
function rollPool(attributeValue: number): { dice: number[]; best: number } {
  if (attributeValue <= 0) {
    // Desvantagem: rola 2d20 e pega o menor
    const dice = [rollD20(), rollD20()];
    return { dice, best: Math.min(...dice) };
  }
  const dice = Array.from({ length: attributeValue }, () => rollD20());
  return { dice, best: Math.max(...dice) };
}

export function ResistanceCheckModal({
  open,
  onOpenChange,
  ritual,
  effect,
  damage,
  onResult,
  targetAttributes,
  defaultDT = 15,
}: ResistanceCheckModalProps) {
  // Estados
  const [customDT, setCustomDT] = useState<string>('');
  const [manualRoll, setManualRoll] = useState<string>('');
  const [rollResult, setRollResult] = useState<{
    dice: number[];
    best: number;
    total: number;
  } | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // Obtém configuração de resistência do efeito
  const resistance = effect?.resistance;
  if (!ritual || !resistance) return null;

  // Configuração visual
  const elementConfig = getElementConfig(ritual.element);
  const ResistanceIcon = RESISTANCE_ICONS[resistance.type] || Shield;
  const resistanceColor = RESISTANCE_COLORS[resistance.type] || 'text-foreground';
  const attributeLabel = RESISTANCE_ATTRIBUTES[resistance.type];

  // DT do teste (customizado ou padrão baseado no círculo)
  const dt = customDT ? parseInt(customDT) : (resistance.dt || defaultDT + (ritual.circle - 1) * 5);

  // Atributo do alvo para rolagem automática
  const targetAttribute = targetAttributes ? (
    resistance.type === 'fortitude' ? targetAttributes.vigor :
    resistance.type === 'reflexos' ? targetAttributes.agility :
    targetAttributes.presence
  ) : null;

  // Função para rolar resistência
  const handleRoll = () => {
    if (targetAttribute === null) return;

    setIsRolling(true);
    setRollResult(null);

    setTimeout(() => {
      const { dice, best } = rollPool(targetAttribute);
      const total = best; // Resistência não tem bônus de perícia normalmente
      
      setRollResult({ dice, best, total });
      setIsRolling(false);
    }, 500);
  };

  // Função para usar rolagem manual
  const handleManualRoll = () => {
    const roll = parseInt(manualRoll);
    if (isNaN(roll) || roll < 1 || roll > 20) return;

    setRollResult({
      dice: [roll],
      best: roll,
      total: roll,
    });
  };

  // Calcula resultado do teste
  const testResult = useMemo(() => {
    if (!rollResult) return null;

    const passed = rollResult.total >= dt;
    const margin = rollResult.total - dt;

    return {
      passed,
      roll: rollResult.best,
      total: rollResult.total,
      dt,
      type: resistance.type,
      effect: resistance.effect,
      margin,
    };
  }, [rollResult, dt, resistance]);

  // Calcula dano ajustado baseado no resultado
  const adjustedDamage = useMemo(() => {
    if (!testResult || damage === undefined) return undefined;

    switch (resistance.effect) {
      case 'anula':
        return testResult.passed ? 0 : damage;
      case 'parcial':
      case 'reduz_metade':
        return testResult.passed ? Math.floor(damage / 2) : damage;
      default:
        return damage;
    }
  }, [testResult, damage, resistance.effect]);

  // Handler para confirmar resultado
  const handleConfirm = () => {
    if (!testResult) return;
    onResult(testResult, adjustedDamage);
    onOpenChange(false);
    // Reset states
    setRollResult(null);
    setManualRoll('');
    setCustomDT('');
  };

  // Reset ao fechar
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setRollResult(null);
      setManualRoll('');
      setCustomDT('');
    }
    onOpenChange(isOpen);
  };

  return (
    <MobileModal open={open} onOpenChange={handleOpenChange}>
      <MobileModalContent size="sm" className="overflow-visible">
        {/* Gradient background */}
        <div className={cn(
          "absolute inset-x-0 top-0 h-24 rounded-t-lg opacity-30",
          `bg-gradient-to-b ${elementConfig?.color || 'from-primary/20 to-transparent'}`
        )} />

        <MobileModalHeader className="relative">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br from-background to-muted border-2",
                "border-border"
              )}
            >
              <ResistanceIcon className={cn("w-6 h-6", resistanceColor)} />
            </motion.div>

            <div>
              <MobileModalTitle className="font-display tracking-wider">
                Teste de {resistance.type.charAt(0).toUpperCase() + resistance.type.slice(1)}
              </MobileModalTitle>
              <p className="text-sm text-muted-foreground">
                {ritual.name}
              </p>
            </div>
          </div>
        </MobileModalHeader>

        <MobileModalBody useScrollArea={false}>
          <div className="space-y-4">
            {/* Info do teste */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Dificuldade (DT)</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={customDT}
                    onChange={(e) => setCustomDT(e.target.value)}
                    placeholder={String(dt)}
                    className="w-16 h-8 text-center"
                  />
                  <Badge variant="outline" className={resistanceColor}>
                    {attributeLabel}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Efeito: <span className="capitalize">{resistance.effect.replace('_', ' ')}</span>
                {resistance.effect === 'anula' && ' (sucesso anula completamente)'}
                {resistance.effect === 'parcial' && ' (sucesso reduz dano à metade ou evita condição)'}
                {resistance.effect === 'reduz_metade' && ' (sucesso reduz dano à metade)'}
              </p>
            </div>

            {/* Dano original (se houver) */}
            {damage !== undefined && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/10 border border-destructive/30">
                <span className="text-sm">Dano original</span>
                <Badge variant="destructive">{damage}</Badge>
              </div>
            )}

            {/* Área de rolagem */}
            <div className="space-y-3">
              {/* Rolagem automática (se tiver atributos do alvo) */}
              {targetAttribute !== null && (
                <Button
                  onClick={handleRoll}
                  disabled={isRolling}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Dices className={cn("w-4 h-4", isRolling && "animate-spin")} />
                  Rolar {targetAttribute}d20 ({attributeLabel} {targetAttribute})
                </Button>
              )}

              {/* Rolagem manual */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Resultado manual (1-20)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={manualRoll}
                    onChange={(e) => setManualRoll(e.target.value)}
                    placeholder="Resultado do d20"
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleManualRoll}
                  disabled={!manualRoll}
                  variant="secondary"
                  className="self-end"
                >
                  Usar
                </Button>
              </div>
            </div>

            {/* Resultado da rolagem */}
            <AnimatePresence mode="wait">
              {isRolling ? (
                <motion.div
                  key="rolling"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-4"
                >
                  <Dices className={cn("w-8 h-8 mx-auto animate-spin", resistanceColor)} />
                  <p className="text-sm text-muted-foreground mt-2">Rolando...</p>
                </motion.div>
              ) : rollResult && testResult ? (
                <motion.div
                  key="result"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-3"
                >
                  {/* Dados rolados */}
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
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {testResult.passed ? (
                        <Check className="w-6 h-6 text-success" />
                      ) : (
                        <X className="w-6 h-6 text-destructive" />
                      )}
                      <span className={cn(
                        "text-2xl font-bold",
                        testResult.passed ? "text-success" : "text-destructive"
                      )}>
                        {testResult.passed ? 'PASSOU!' : 'FALHOU!'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
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
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm text-muted-foreground">Dano:</span>
                          <span className="text-sm line-through text-muted-foreground">{damage}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
                        {testResult.passed && resistance.effect === 'parcial' && effect?.appliesConditions && (
                          <p className="text-xs text-success mt-1">
                            Condição evitada!
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </MobileModalBody>

        <MobileModalFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!testResult}
            className={cn(
              "gap-2",
              testResult?.passed && "bg-success hover:bg-success/90"
            )}
          >
            <Check className="w-4 h-4" />
            Aplicar Resultado
          </Button>
        </MobileModalFooter>
      </MobileModalContent>
    </MobileModal>
  );
}
