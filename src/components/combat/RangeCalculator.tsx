/**
 * RangeCalculator - Calculadora de alcance entre combatentes
 * 
 * Mostra distâncias, verifica alcance de armas e lista alvos disponíveis.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// ScrollArea removido - usando overflow nativo para evitar bug #185 com React 19
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Target,
  Crosshair,
  Ruler,
  Check,
  X,
  Sword,
  Zap,
} from '@/components/icons/ordem-icons';
import type { CombatantState } from '@/lib/game-engine';
import type { AttackRange } from '@/hooks/campaign/useCombatBoardSync';

// Alcances de armas comuns em Ordem Paranormal
const WEAPON_RANGES = {
  'Corpo-a-corpo': 1.5,
  'Arma curta': 9,
  'Espingarda': 15,
  'Rifle': 60,
  'Rifle de precisão': 120,
  'Lançado (curto)': 6,
  'Lançado (médio)': 12,
};

interface RangeCalculatorProps {
  currentCombatantId: string;
  combatants: CombatantState[];
  onCalculateRange: (fromId: string, toId: string) => AttackRange | null;
  onGetTargetsInRange: (combatantId: string, range: number) => AttackRange[];
  className?: string;
}

export function RangeCalculator({
  currentCombatantId,
  combatants,
  onCalculateRange,
  onGetTargetsInRange,
  className,
}: RangeCalculatorProps) {
  const [selectedRange, setSelectedRange] = useState<number>(1.5);
  const [customRange, setCustomRange] = useState<string>('');
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  // Calcula distância para alvo selecionado
  const targetRange = useMemo(() => {
    if (!selectedTargetId) return null;
    return onCalculateRange(currentCombatantId, selectedTargetId);
  }, [currentCombatantId, selectedTargetId, onCalculateRange]);

  // Lista todos os combatentes com suas distâncias
  const allTargets = useMemo(() => {
    return combatants
      .filter(c => c.id !== currentCombatantId)
      .map(c => ({
        combatant: c,
        range: onCalculateRange(currentCombatantId, c.id),
      }))
      .filter(t => t.range !== null)
      .sort((a, b) => (a.range?.distanceMeters || 0) - (b.range?.distanceMeters || 0));
  }, [combatants, currentCombatantId, onCalculateRange]);

  // Alvos no alcance selecionado
  const targetsInRange = useMemo(() => {
    const range = customRange ? parseFloat(customRange) : selectedRange;
    if (isNaN(range)) return [];
    return onGetTargetsInRange(currentCombatantId, range);
  }, [currentCombatantId, selectedRange, customRange, onGetTargetsInRange]);

  // Handler para alcance customizado
  const handleCustomRangeChange = (value: string) => {
    setCustomRange(value);
    if (value && !isNaN(parseFloat(value))) {
      setSelectedRange(parseFloat(value));
    }
  };

  const currentRange = customRange ? parseFloat(customRange) : selectedRange;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Seletor de alcance */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Ruler className="w-4 h-4" />
          Alcance da Arma
        </Label>
        
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(WEAPON_RANGES).map(([name, range]) => (
            <Button
              key={name}
              variant={selectedRange === range && !customRange ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedRange(range);
                setCustomRange('');
              }}
              className="text-xs"
            >
              {name} ({range}m)
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Input
            type="number"
            placeholder="Alcance personalizado (m)"
            value={customRange}
            onChange={(e) => handleCustomRangeChange(e.target.value)}
            className="w-40"
          />
          {customRange && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCustomRange('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Alvos no alcance */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Alvos em {currentRange}m
          </Label>
          <Badge variant={targetsInRange.length > 0 ? "default" : "secondary"}>
            {targetsInRange.length} alvo(s)
          </Badge>
        </div>

        <div className="h-[200px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent rounded-lg border border-border p-2">
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {allTargets.map(({ combatant, range }) => {
                const inRange = range && range.distanceMeters <= currentRange;
                
                return (
                  <motion.div
                    key={combatant.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer",
                      inRange ? "bg-success/10 hover:bg-success/20" : "bg-secondary/30 hover:bg-secondary/50",
                      selectedTargetId === combatant.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedTargetId(
                      selectedTargetId === combatant.id ? null : combatant.id
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-6 h-6 rounded flex items-center justify-center",
                        inRange ? "bg-success/20" : "bg-secondary"
                      )}>
                        {inRange ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <X className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      <span className={cn(
                        "font-medium",
                        !inRange && "text-muted-foreground"
                      )}>
                        {combatant.name}
                      </span>
                      {combatant.isNPC && (
                        <Badge variant="outline" className="text-xs">NPC</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={inRange ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {range?.distanceMeters.toFixed(1)}m
                      </Badge>
                      
                      {inRange && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <Crosshair className="w-4 h-4 text-destructive" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2">
                            <div className="space-y-2 text-sm">
                              <p className="font-medium">Atacar {combatant.name}</p>
                              <p className="text-muted-foreground">
                                Distância: {range?.distanceMeters.toFixed(1)}m
                              </p>
                              <p className="text-muted-foreground">
                                Defesa: {combatant.defense}
                              </p>
                              <div className="flex gap-1">
                                <Button size="sm" className="flex-1 gap-1">
                                  <Sword className="w-3 h-3" />
                                  Atacar
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              
              {allTargets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum alvo com posição definida</p>
                  <p className="text-xs">Vincule combatentes aos tokens do mapa</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Resumo de alcance */}
      {targetsInRange.length > 0 && (
        <div className="p-3 bg-success/10 rounded-lg border border-success/30">
          <div className="flex items-center gap-2 text-sm text-success">
            <Zap className="w-4 h-4" />
            <span>
              <strong>{targetsInRange.length}</strong> alvo(s) ao alcance de {currentRange}m
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
