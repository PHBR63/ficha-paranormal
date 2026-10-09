/**
 * MobileCombatTracker - Versão otimizada do CombatTracker para dispositivos móveis
 * Combat 7.6: Layout compacto, gestos touch e performance otimizada
 */

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import {
  type CombatState,
  type CombatantState,
  getEffectiveDefense,
  canAct,
} from "@/lib/game-engine";
import {
  Swords,
  Play,
  SkipForward,
  ChevronRight,
  Shield,
  Heart,
  Zap,
  Brain,
  Plus,
  Minus,
  MoreVertical,
  AlertTriangle,
  X,
} from '@/components/icons/ordem-icons';

interface MobileCombatTrackerProps {
  combatState: CombatState;
  onStateChange: (state: CombatState) => void;
  isMaster?: boolean;
  onNextTurn?: () => void;
  onStartCombat?: () => void;
  onEndCombat?: () => void;
}

// Componente de card de combatente otimizado para mobile
function MobileCombatantCard({
  combatant,
  isCurrentTurn,
  isMaster,
  onHPChange,
  onRemove,
}: {
  combatant: CombatantState;
  isCurrentTurn: boolean;
  isMaster: boolean;
  onHPChange: (delta: number) => void;
  onRemove?: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const effectiveDefense = getEffectiveDefense(combatant.baseDefense, combatant.conditions);
  const canCombatantAct = canAct(combatant.conditions);

  // Swipe para dano/cura rápida (apenas mestre)
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isMaster) return;
    
    const threshold = 50;
    if (info.offset.x > threshold) {
      // Swipe direita = cura
      onHPChange(1);
    } else if (info.offset.x < -threshold) {
      // Swipe esquerda = dano
      onHPChange(-1);
    }
  }, [isMaster, onHPChange]);

  return (
    <motion.div
      layout
      drag={isMaster ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className={cn(
        "relative bg-card rounded-lg border p-3 touch-pan-y",
        isCurrentTurn && "ring-2 ring-primary border-primary",
        !canCombatantAct && "opacity-60"
      )}
    >
      {/* Indicador visual de swipe */}
      {isMaster && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-destructive/20 to-transparent rounded-l-lg flex items-center justify-start pl-1 pointer-events-none opacity-0 group-active:opacity-100">
            <Minus className="w-3 h-3 text-destructive" />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-green-500/20 to-transparent rounded-r-lg flex items-center justify-end pr-1 pointer-events-none opacity-0 group-active:opacity-100">
            <Plus className="w-3 h-3 text-green-500" />
          </div>
        </>
      )}

      <div className="flex items-center gap-2">
        {/* Indicador de turno atual */}
        {isCurrentTurn && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ChevronRight className="w-4 h-4 text-primary" />
          </motion.div>
        )}

        {/* Nome e info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "font-medium text-sm truncate",
              isCurrentTurn && "text-primary"
            )}>
              {combatant.name}
            </span>
            {combatant.isNPC && (
              <span className="text-[10px] px-1 py-0.5 bg-muted rounded text-muted-foreground shrink-0">
                NPC
              </span>
            )}
          </div>
          
          {/* Stats compactos */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
            <span>INI {combatant.initiative}</span>
            <span className="flex items-center gap-0.5">
              <Shield className="w-2.5 h-2.5" />
              {effectiveDefense}
            </span>
          </div>
        </div>

        {/* Barras de recursos compactas */}
        <div className="flex flex-col gap-1 w-20">
          {/* HP */}
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-primary shrink-0" />
            <AnimatedProgress
              value={combatant.hp}
              max={combatant.hpMax}
              variant="hp"
              size="sm"
              className="flex-1"
            />
            <span className="text-[9px] text-muted-foreground w-8 text-right">
              {combatant.hp}/{combatant.hpMax}
            </span>
          </div>
          
          {/* PE */}
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-accent shrink-0" />
            <AnimatedProgress
              value={combatant.pe}
              max={combatant.peMax}
              variant="pe"
              size="sm"
              className="flex-1"
            />
            <span className="text-[9px] text-muted-foreground w-8 text-right">
              {combatant.pe}/{combatant.peMax}
            </span>
          </div>
        </div>

        {/* Ações rápidas */}
        {isMaster && (
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => onHPChange(-5)}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-green-500"
              onClick={() => onHPChange(5)}
            >
              <Plus className="w-3 h-3" />
            </Button>
            <Sheet open={showActions} onOpenChange={setShowActions}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto">
                <SheetHeader>
                  <SheetTitle>{combatant.name}</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-2 py-4">
                  <Button variant="outline" onClick={() => { onHPChange(-10); setShowActions(false); }}>
                    -10 PV
                  </Button>
                  <Button variant="outline" onClick={() => { onHPChange(10); setShowActions(false); }}>
                    +10 PV
                  </Button>
                  <Button variant="outline" onClick={() => { onHPChange(-25); setShowActions(false); }}>
                    -25 PV
                  </Button>
                  <Button variant="outline" onClick={() => { onHPChange(25); setShowActions(false); }}>
                    +25 PV
                  </Button>
                  {onRemove && (
                    <Button 
                      variant="destructive" 
                      className="col-span-2"
                      onClick={() => { onRemove(); setShowActions(false); }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remover do Combate
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>

      {/* Condições compactas (legadas) */}
      {combatant.conditions.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex flex-wrap gap-1">
            {combatant.conditions.slice(0, 3).map((cond, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">
                {cond}
              </span>
            ))}
            {combatant.conditions.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                +{combatant.conditions.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Aviso de não pode agir */}
      {!canCombatantAct && isCurrentTurn && (
        <div className="mt-2 p-1.5 bg-destructive/20 rounded text-destructive text-xs text-center flex items-center justify-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Não pode agir
        </div>
      )}
    </motion.div>
  );
}

export function MobileCombatTracker({
  combatState,
  onStateChange,
  isMaster = false,
  onNextTurn,
  onStartCombat,
  onEndCombat,
}: MobileCombatTrackerProps) {
  const currentCombatant = combatState.combatants[combatState.currentTurnIndex];

  const updateCombatantHP = useCallback((id: string, delta: number) => {
    const updatedCombatants = combatState.combatants.map(c => {
      if (c.id !== id) return c;
      const newHP = Math.max(0, Math.min(c.hpMax, c.hp + delta));
      return { ...c, hp: newHP };
    });

    onStateChange({
      ...combatState,
      combatants: updatedCombatants,
    });
  }, [combatState, onStateChange]);

  const removeCombatant = useCallback((id: string) => {
    const newCombatants = combatState.combatants.filter(c => c.id !== id);
    onStateChange({
      ...combatState,
      combatants: newCombatants,
      currentTurnIndex: Math.min(combatState.currentTurnIndex, newCombatants.length - 1),
    });
  }, [combatState, onStateChange]);

  return (
    <div className="flex flex-col h-full">
      {/* Header compacto */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-display text-base tracking-wide">COMBATE</h3>
            {combatState.isActive && (
              <p className="text-xs text-muted-foreground">
                R{combatState.round} • {currentCombatant?.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-1.5">
          {!combatState.isActive ? (
            <Button
              onClick={onStartCombat}
              disabled={combatState.combatants.length < 2}
              size="sm"
              className="gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              Iniciar
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onNextTurn}
                className="gap-1.5"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Próximo
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onEndCombat}
              >
                Encerrar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Indicador de combatente atual (grande) */}
      {combatState.isActive && currentCombatant && (
        <motion.div
          key={currentCombatant.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-primary/10 border-b border-primary/30"
        >
          <div className="text-center">
            <span className="text-xs text-primary uppercase tracking-wider">Turno Atual</span>
            <h2 className="font-display text-xl text-primary">{currentCombatant.name}</h2>
            <div className="flex items-center justify-center gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-primary" />
                {currentCombatant.hp}/{currentCombatant.hpMax}
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-accent" />
                {currentCombatant.pe}/{currentCombatant.peMax}
              </span>
              <span className="flex items-center gap-1">
                <Brain className="w-4 h-4 text-paranormal" />
                {currentCombatant.san}/{currentCombatant.sanMax}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Lista de combatentes */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence mode="popLayout">
          {combatState.combatants.map((combatant, index) => (
            <MobileCombatantCard
              key={combatant.id}
              combatant={combatant}
              isCurrentTurn={combatState.isActive && index === combatState.currentTurnIndex}
              isMaster={isMaster}
              onHPChange={(delta) => updateCombatantHP(combatant.id, delta)}
              onRemove={!combatState.isActive && isMaster ? () => removeCombatant(combatant.id) : undefined}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Navegação por swipe (indicador) */}
      {combatState.combatants.length > 3 && (
        <div className="flex justify-center gap-1 py-2 border-t border-border">
          {combatState.combatants.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                i === combatState.currentTurnIndex ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {combatState.combatants.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-muted-foreground">
          <Swords className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">Nenhum combatente</p>
          <p className="text-xs">Adicione pelo menos 2 para iniciar</p>
        </div>
      )}
    </div>
  );
}
