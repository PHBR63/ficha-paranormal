"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Zap,
  ChevronDown,
  ChevronRight,
  Shield,
  Target,
  ArrowDown,
  Crosshair,
  Clock,
  Activity,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  type HookExecutionLogEntry,
  getTriggerLabel,
  getTriggerIcon,
  type DamageCategory,
} from "@/lib/ritual-hooks-engine";

interface HookExecutionLogProps {
  entries: HookExecutionLogEntry[];
  onClear?: () => void;
  maxEntries?: number;
  compact?: boolean;
}

const CATEGORY_COLORS: Record<DamageCategory, string> = {
  physical: "text-orange-400",
  ballistic: "text-red-400",
  elemental: "text-cyan-400",
  paranormal: "text-purple-400",
  fall: "text-yellow-400",
  environmental: "text-green-400",
  unknown: "text-muted-foreground",
};

const CATEGORY_LABELS: Record<DamageCategory, string> = {
  physical: "Físico",
  ballistic: "Balístico",
  elemental: "Elemental",
  paranormal: "Paranormal",
  fall: "Queda",
  environmental: "Ambiente",
  unknown: "Desconhecido",
};

const CATEGORY_ICONS: Record<DamageCategory, typeof Shield> = {
  physical: Target,
  ballistic: Crosshair,
  elemental: Zap,
  paranormal: Activity,
  fall: ArrowDown,
  environmental: Activity,
  unknown: Shield,
};

export function HookExecutionLog({
  entries,
  onClear,
  maxEntries = 50,
  compact = false,
}: HookExecutionLogProps) {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(true);

  const displayEntries = entries.slice(-maxEntries);

  const toggleEntry = (id: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium">Log de Hooks</span>
          <Badge variant="secondary" className="text-xs">
            {entries.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-7 px-2 text-xs"
          >
            {showDetails ? (
              <EyeOff className="w-3 h-3 mr-1" />
            ) : (
              <Eye className="w-3 h-3 mr-1" />
            )}
            {showDetails ? "Compacto" : "Detalhado"}
          </Button>
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Entries */}
      <div className="h-[300px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pr-3">
        <AnimatePresence mode="popLayout">
          {displayEntries.reverse().map((entry) => {
            const isExpanded = expandedEntries.has(entry.id);
            const CategoryIcon = entry.damageInfo
              ? CATEGORY_ICONS[entry.damageInfo.category]
              : Shield;

            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-2"
              >
                <div
                  className={cn(
                    "p-3 rounded-lg border transition-all cursor-pointer",
                    entry.results.some((r) => r.modifications?.blockDamage)
                      ? "bg-green-500/10 border-green-500/30"
                      : entry.results.length > 0
                        ? "bg-yellow-500/10 border-yellow-500/30"
                        : "bg-secondary/50 border-border",
                    compact && "p-2"
                  )}
                  onClick={() => toggleEntry(entry.id)}
                >
                  {/* Main row */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-lg">{getTriggerIcon(entry.trigger)}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {getTriggerLabel(entry.trigger)}
                        </span>
                        {entry.triggers.length > 1 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{entry.triggers.length - 1} trigger(s)
                          </Badge>
                        )}
                        {entry.damageInfo && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] gap-1",
                              CATEGORY_COLORS[entry.damageInfo.category]
                            )}
                          >
                            <CategoryIcon className="w-2.5 h-2.5" />
                            {CATEGORY_LABELS[entry.damageInfo.category]}
                          </Badge>
                        )}
                      </div>

                      {/* Quick summary */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                        {entry.results.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-yellow-400">
                              {entry.results.length} hook(s) disparado(s)
                            </span>
                          </>
                        )}
                        {entry.finalDamage !== undefined && (
                          <>
                            <span>•</span>
                            <span
                              className={cn(
                                entry.blocked ? "text-green-400" : "text-destructive"
                              )}
                            >
                              {entry.blocked
                                ? "Bloqueado!"
                                : `${entry.finalDamage} dano final`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && showDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                          {/* Damage detection chain */}
                          {entry.damageInfo && (
                            <div className="space-y-1.5">
                              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                📊 Detecção de Dano
                              </p>
                              <div className="p-2 rounded bg-secondary/50 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Tipo:</span>
                                  <span className="font-medium">{entry.damageInfo.type}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Categoria:</span>
                                  <span
                                    className={cn(
                                      "font-medium",
                                      CATEGORY_COLORS[entry.damageInfo.category]
                                    )}
                                  >
                                    {CATEGORY_LABELS[entry.damageInfo.category]}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                                  {entry.damageInfo.isProjectile && (
                                    <Badge variant="outline" className="text-[10px] text-red-400">
                                      <Crosshair className="w-2.5 h-2.5 mr-1" />
                                      Projétil
                                    </Badge>
                                  )}
                                  {entry.damageInfo.isFall && (
                                    <Badge variant="outline" className="text-[10px] text-yellow-400">
                                      <ArrowDown className="w-2.5 h-2.5 mr-1" />
                                      Queda
                                    </Badge>
                                  )}
                                  {entry.damageInfo.isMelee && (
                                    <Badge variant="outline" className="text-[10px] text-orange-400">
                                      <Target className="w-2.5 h-2.5 mr-1" />
                                      Corpo a corpo
                                    </Badge>
                                  )}
                                  {entry.damageInfo.isRanged && !entry.damageInfo.isProjectile && (
                                    <Badge variant="outline" className="text-[10px] text-blue-400">
                                      Distância
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Triggers chain */}
                          {entry.triggers.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                🔗 Cadeia de Triggers
                              </p>
                              <div className="flex items-center gap-1 flex-wrap">
                                {entry.triggers.map((trigger, i) => (
                                  <div key={trigger} className="flex items-center">
                                    <Badge variant="outline" className="text-[10px]">
                                      {getTriggerIcon(trigger)} {getTriggerLabel(trigger)}
                                    </Badge>
                                    {i < entry.triggers.length - 1 && (
                                      <ChevronRight className="w-3 h-3 text-muted-foreground mx-0.5" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Hook results */}
                          {entry.results.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                ⚡ Hooks Executados
                              </p>
                              <div className="space-y-2">
                                {entry.results.map((result, i) => (
                                  <div
                                    key={`${result.hookId}-${i}`}
                                    className={cn(
                                      "p-2 rounded text-xs",
                                      result.modifications?.blockDamage
                                        ? "bg-green-500/20 border border-green-500/30"
                                        : "bg-yellow-500/10 border border-yellow-500/20"
                                    )}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-yellow-300">
                                        {result.ritualName}
                                      </span>
                                      {result.triggeredBy && (
                                        <Badge variant="outline" className="text-[10px]">
                                          {getTriggerIcon(result.triggeredBy)}{" "}
                                          {getTriggerLabel(result.triggeredBy)}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-muted-foreground">{result.effect}</p>

                                    {/* Modifications */}
                                    {result.modifications && (
                                      <div className="mt-1.5 pt-1.5 border-t border-border/30 space-y-0.5">
                                        {result.modifications.blockDamage && (
                                          <div className="flex items-center gap-1 text-green-400">
                                            <Shield className="w-3 h-3" />
                                            <span>Dano bloqueado completamente</span>
                                          </div>
                                        )}
                                        {result.modifications.damageModifier !== undefined && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-muted-foreground">
                                              Modificador de dano:
                                            </span>
                                            <span
                                              className={cn(
                                                "font-medium",
                                                result.modifications.damageModifier < 0
                                                  ? "text-green-400"
                                                  : "text-destructive"
                                              )}
                                            >
                                              {result.modifications.damageModifier > 0 ? "+" : ""}
                                              {result.modifications.damageModifier}
                                            </span>
                                          </div>
                                        )}
                                        {result.modifications.newDamageAmount !== undefined && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-muted-foreground">
                                              Dano resultante:
                                            </span>
                                            <span className="font-medium text-foreground">
                                              {result.modifications.newDamageAmount}
                                            </span>
                                          </div>
                                        )}
                                        {result.modifications.rollModifier !== undefined && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-muted-foreground">
                                              Modificador de teste:
                                            </span>
                                            <span
                                              className={cn(
                                                "font-medium",
                                                result.modifications.rollModifier > 0
                                                  ? "text-green-400"
                                                  : "text-destructive"
                                              )}
                                            >
                                              {result.modifications.rollModifier > 0 ? "+" : ""}
                                              {result.modifications.rollModifier}
                                            </span>
                                          </div>
                                        )}
                                        {result.modifications.preventDeath && (
                                          <div className="flex items-center gap-1 text-red-400">
                                            <span>💀</span>
                                            <span>Morte prevenida</span>
                                          </div>
                                        )}
                                        {result.modifications.message && (
                                          <p className="text-accent italic">
                                            "{result.modifications.message}"
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Damage summary */}
                          {entry.originalDamage !== undefined && (
                            <div className="p-2 rounded bg-secondary/50 border border-border">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Dano original:</span>
                                <span className="font-medium text-destructive">
                                  {entry.originalDamage}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs mt-1">
                                <span className="text-muted-foreground">Dano final:</span>
                                <span
                                  className={cn(
                                    "font-medium",
                                    entry.blocked
                                      ? "text-green-400"
                                      : entry.finalDamage !== undefined &&
                                          entry.finalDamage < entry.originalDamage
                                        ? "text-yellow-400"
                                        : "text-destructive"
                                  )}
                                >
                                  {entry.blocked ? "0 (Bloqueado)" : entry.finalDamage}
                                </span>
                              </div>
                              {entry.originalDamage !== entry.finalDamage && !entry.blocked && (
                                <div className="flex items-center justify-between text-xs mt-1 pt-1 border-t border-border/30">
                                  <span className="text-muted-foreground">Redução:</span>
                                  <span className="font-medium text-green-400">
                                    -{(entry.originalDamage - (entry.finalDamage || 0))} (
                                    {Math.round(
                                      ((entry.originalDamage - (entry.finalDamage || 0)) /
                                        entry.originalDamage) *
                                        100
                                    )}
                                    %)
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* No hooks triggered */}
                          {entry.results.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">
                              Nenhum hook ativo para este trigger.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
