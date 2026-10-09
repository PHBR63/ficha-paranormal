"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MagicCard } from "@/components/ui/magic-card";
import {
  Sparkles,
  Clock,
  Zap,
  Brain,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from '@/components/icons/ordem-icons';
import {
  type SustainedRitual,
  getSustainActionLabel,
  getElementColor,
  dropConcentration,
} from "@/lib/sustained-rituals";
import { getHooksForCharacter, getTriggerLabel, getTriggerIcon } from "@/lib/ritual-hooks-engine";

interface ActiveRitualsPanelProps {
  characterId: string;
  characterName: string;
  sustainedRituals: SustainedRitual[];
  currentRound: number;
  currentPE: number;
  onRitualEnded?: (ritual: SustainedRitual, reason: string) => void;
  onConcentrationDropped?: (ritual: SustainedRitual) => void;
  isMaster?: boolean;
}

export function ActiveRitualsPanel({
  characterId,
  characterName,
  sustainedRituals,
  currentRound,
  currentPE,
  onRitualEnded,
  onConcentrationDropped,
  isMaster = false,
}: ActiveRitualsPanelProps) {
  const [expandedRituals, setExpandedRituals] = useState<Set<string>>(new Set());

  const hooks = getHooksForCharacter(characterId);
  const totalSustainCost = sustainedRituals.reduce(
    (sum, r) => sum + (r.sustain.costPerTurn || 0),
    0
  );

  const toggleExpanded = (ritualId: string) => {
    setExpandedRituals((prev) => {
      const next = new Set(prev);
      if (next.has(ritualId)) {
        next.delete(ritualId);
      } else {
        next.add(ritualId);
      }
      return next;
    });
  };

  const handleDropConcentration = (ritual: SustainedRitual) => {
    const dropped = dropConcentration(ritual.id);
    if (dropped) {
      onConcentrationDropped?.(dropped);
    }
  };

  if (sustainedRituals.length === 0 && hooks.length === 0) {
    return null;
  }

  return (
    <MagicCard className="p-4" gradientColor="hsl(var(--paranormal))">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-paranormal" />
            <h4 className="font-display text-sm tracking-wide">
              RITUAIS ATIVOS
            </h4>
            {sustainedRituals.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {sustainedRituals.length}
              </Badge>
            )}
          </div>

          {totalSustainCost > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <Zap className="w-3 h-3 text-accent" />
              <span className="text-muted-foreground">
                Custo/turno: <span className="text-accent font-medium">{totalSustainCost} PE</span>
              </span>
              {currentPE < totalSustainCost && (
                <AlertTriangle className="w-3 h-3 text-destructive animate-pulse" />
              )}
            </div>
          )}
        </div>

        {/* Rituais sustentados */}
        <AnimatePresence mode="popLayout">
          {sustainedRituals.map((ritual) => {
            const isExpanded = expandedRituals.has(ritual.id);
            const turnsRemaining = ritual.expiresRound
              ? ritual.expiresRound - currentRound
              : undefined;
            const ritualHooks = hooks.filter((h) => h.ritualId === ritual.ritualId);

            return (
              <motion.div
                key={ritual.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-2"
              >
                <div
                  className={cn(
                    "p-3 rounded-lg border transition-colors cursor-pointer",
                    ritual.isConcentrating
                      ? "bg-purple-500/10 border-purple-500/30 hover:border-purple-500/50"
                      : "bg-secondary/50 border-border hover:border-primary/30"
                  )}
                  onClick={() => toggleExpanded(ritual.id)}
                >
                  {/* Ritual header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-medium", getElementColor(ritual.element))}>
                        {ritual.ritualName}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {ritual.circle}º Círculo
                      </Badge>
                      {ritual.isConcentrating && (
                        <Badge className="text-[10px] bg-purple-500/20 text-purple-300 border-purple-500/30">
                          <Brain className="w-2.5 h-2.5 mr-1" />
                          Concentração
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {ritual.sustain.costPerTurn && ritual.sustain.costPerTurn > 0 && (
                        <span className="text-xs text-accent">
                          -{ritual.sustain.costPerTurn} PE/turno
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ritual.turnsActive} turnos ativos
                    </span>
                    {turnsRemaining !== undefined && (
                      <span className={cn(
                        turnsRemaining <= 2 && "text-destructive"
                      )}>
                        {turnsRemaining} turnos restantes
                      </span>
                    )}
                    {ritual.peSpentTotal > 0 && (
                      <span>
                        Total gasto: {ritual.peSpentTotal} PE
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 ml-4 border-l-2 border-border space-y-3">
                        {/* Hooks ativos */}
                        {ritualHooks.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs uppercase tracking-wider text-yellow-400/80 font-medium">
                              ⚡ Gatilhos Ativos
                            </p>
                            {ritualHooks.map((hook) => (
                              <div
                                key={hook.hookId}
                                className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span>{getTriggerIcon(hook.hook.trigger)}</span>
                                  <span className="font-medium text-yellow-300">
                                    {getTriggerLabel(hook.hook.trigger)}
                                  </span>
                                </div>
                                <p className="text-muted-foreground mt-1">
                                  {hook.hook.effect}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Configuração de sustentação */}
                        <div className="text-xs space-y-1">
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Ação de Sustentação:</span>{" "}
                            {getSustainActionLabel(ritual.sustain.action)}
                          </p>
                          {ritual.sustain.endTriggers && ritual.sustain.endTriggers.length > 0 && (
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">Encerra quando:</span>{" "}
                              {ritual.sustain.endTriggers.join(", ")}
                            </p>
                          )}
                        </div>

                        {/* Ações */}
                        {(isMaster || ritual.casterId === characterId) && ritual.isConcentrating && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDropConcentration(ritual);
                            }}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Encerrar Concentração
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Hooks sem ritual sustentado (efeitos instantâneos ainda ativos) */}
        {hooks.filter(h => !sustainedRituals.some(r => r.ritualId === h.ritualId)).length > 0 && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Efeitos Ativos
            </p>
            <div className="space-y-1.5">
              {hooks
                .filter(h => !sustainedRituals.some(r => r.ritualId === h.ritualId))
                .map((hook) => (
                  <div
                    key={hook.hookId}
                    className="p-2 rounded bg-secondary/50 border border-border text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{getTriggerIcon(hook.hook.trigger)}</span>
                        <span className="font-medium">{hook.ritualName}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {getTriggerLabel(hook.hook.trigger)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </MagicCard>
  );
}
