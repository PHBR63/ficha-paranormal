"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MagicCard } from "@/components/ui/magic-card";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { ConditionList } from "@/components/ui/condition-badge";
import { 
  type CombatState, 
  type CombatantState,
  createCombatState,
  rollInitiative,
  sortByInitiative,
  nextTurn,
  createTurnState,
  processStartOfTurn,
  getEffectiveDefense,
  canAct,
} from "@/lib/game-engine";
import {
  executeHooks,
  executeHooksForDamage,
  cleanupExpiredHooks,
  detectDamageInfo,
  getExecutionLog,
  clearExecutionLog,
  type HookExecutionResult,
  type HookExecutionLogEntry,
  type DamageInfo,
} from "@/lib/ritual-hooks-engine";
import {
  processSustainedRitualsOnTurnStart,
  testConcentration,
  getSustainedRitualsForCharacter,
  type SustainedRitual,
} from "@/lib/sustained-rituals";
import { ActiveRitualsPanel } from "./ActiveRitualsPanel";
import { HookExecutionLog } from "./HookExecutionLog";
import { CombatStatsPanel } from "./CombatStatsPanel";
import {
  Swords,
  Play,
  Pause,
  SkipForward,
  Plus,
  X,
  Shield,
  Heart,
  Brain,
  Zap,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";

interface CombatTrackerProps {
  campaignId?: string;
  initialCombatants?: Partial<CombatantState>[];
  onCombatUpdate?: (state: CombatState) => void;
  isMaster?: boolean;
}

export function CombatTracker({
  campaignId,
  initialCombatants = [],
  onCombatUpdate,
  isMaster = true,
}: CombatTrackerProps) {
  const [combatState, setCombatState] = useState<CombatState>(() => {
    const state = createCombatState();
    return state;
  });
  const [newCombatantName, setNewCombatantName] = useState("");
  const [newCombatantAgility, setNewCombatantAgility] = useState(1);
  const [hookLogKey, setHookLogKey] = useState(0); // Force re-render of hook log

  const updateState = useCallback((newState: CombatState) => {
    setCombatState(newState);
    onCombatUpdate?.(newState);
  }, [onCombatUpdate]);

  const addCombatant = useCallback((name: string, agility: number, isNPC = false) => {
    const { total, rolls } = rollInitiative(agility);
    
    const newCombatant: CombatantState = {
      id: crypto.randomUUID(),
      name,
      initiative: total,
      initiativeRoll: rolls,
      hp: 20,
      hpMax: 20,
      pe: 5,
      peMax: 5,
      san: 20,
      sanMax: 20,
      defense: 10,
      baseDefense: 10,
      conditions: [],
      turnState: createTurnState(5),
      isNPC,
    };

    const newCombatants = sortByInitiative([...combatState.combatants, newCombatant]);
    updateState({
      ...combatState,
      combatants: newCombatants,
    });

    setNewCombatantName("");
    setNewCombatantAgility(1);
  }, [combatState, updateState]);

  const removeCombatant = useCallback((id: string) => {
    const newCombatants = combatState.combatants.filter(c => c.id !== id);
    updateState({
      ...combatState,
      combatants: newCombatants,
      currentTurnIndex: Math.min(combatState.currentTurnIndex, newCombatants.length - 1),
    });
  }, [combatState, updateState]);

  const startCombat = useCallback(() => {
    if (combatState.combatants.length < 2) return;

    updateState({
      ...combatState,
      isActive: true,
      round: 1,
      currentTurnIndex: 0,
      log: [{
        timestamp: new Date(),
        type: 'system',
        message: '⚔️ Combate iniciado!',
      }],
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#ff4444', '#ff8800'],
    });
  }, [combatState, updateState]);

  const endCombat = useCallback(() => {
    updateState({
      ...createCombatState(),
      combatants: combatState.combatants.map(c => ({
        ...c,
        turnState: createTurnState(5),
      })),
    });
  }, [combatState, updateState]);

  const handleNextTurn = useCallback(() => {
    const newState = nextTurn(combatState);
    const currentCombatant = newState.combatants[newState.currentTurnIndex];
    
    // Limpa hooks expirados
    const expiredHooks = cleanupExpiredHooks(newState.round);
    
    // Dispara hooks de início de turno
    const turnStartHooks = executeHooks({
      trigger: 'onTurnStart',
      round: newState.round,
      targetId: currentCombatant.id,
    });
    
    // Process start of turn effects
    const turnResult = processStartOfTurn(currentCombatant);
    
    // Processa rituais sustentados
    const sustainedRituals = getSustainedRitualsForCharacter(currentCombatant.id);
    let sustainPECost = 0;
    const sustainMessages: string[] = [];
    
    if (sustainedRituals.length > 0) {
      const sustainResult = processSustainedRitualsOnTurnStart(
        currentCombatant.id,
        newState.round,
        currentCombatant.pe
      );
      sustainPECost = sustainResult.totalPECost;
      sustainMessages.push(...sustainResult.results.map(r => r.message));
    }
    
    // Coleta mensagens dos hooks
    const hookMessages = turnStartHooks.map(h => 
      `⚡ ${h.ritualName}: ${h.modifications?.message || h.effect}`
    );
    
    // Atualiza combatente com dano de condições e custo de sustentação
    const updatedCombatants = newState.combatants.map((c, i) => {
      if (i !== newState.currentTurnIndex) return c;
      return {
        ...c,
        hp: Math.max(0, c.hp - turnResult.damage),
        pe: Math.max(0, c.pe - sustainPECost),
        conditions: c.conditions.filter(cond => !turnResult.removedConditions.includes(cond)),
        dyingCounter: turnResult.dyingCounterReduced && c.dyingCounter !== undefined 
          ? c.dyingCounter - 1 
          : c.dyingCounter,
      };
    });

    // Monta log
    const allMessages = [
      ...turnResult.messages,
      ...hookMessages,
      ...sustainMessages,
    ];
    
    if (expiredHooks.length > 0) {
      allMessages.push(`${expiredHooks.length} efeito(s) de ritual expirou(aram).`);
    }

    updateState({
      ...newState,
      combatants: updatedCombatants,
      log: [
        ...newState.log,
        ...allMessages.map(msg => ({
          timestamp: new Date(),
          type: 'condition' as const,
          message: msg,
        })),
      ],
    });
  }, [combatState, updateState]);

  const updateCombatantHP = useCallback((
    id: string, 
    delta: number, 
    damageType?: string,
    damageSource?: string
  ) => {
    const combatant = combatState.combatants.find(c => c.id === id);
    if (!combatant) return;

    let finalDelta = delta;
    const hookMessages: string[] = [];

    // Se for dano (delta negativo), usa sistema de detecção automática
    if (delta < 0) {
      const damageResult = executeHooksForDamage(
        id,
        Math.abs(delta),
        damageType,
        damageSource,
        {
          currentHP: combatant.hp,
          round: combatState.round,
        }
      );

      // Aplica resultado
      finalDelta = damageResult.blocked ? 0 : -damageResult.finalDamage;
      hookMessages.push(...damageResult.messages);
      
      // Atualiza key para forçar re-render do log
      setHookLogKey(k => k + 1);

      // Testa concentração se recebeu dano
      if (!damageResult.blocked && damageResult.finalDamage > 0) {
        const concentrationResults = testConcentration(id, damageResult.finalDamage);
        for (const result of concentrationResults) {
          hookMessages.push(result.concentrationBroken 
            ? `💔 ${result.message}` 
            : `✨ ${result.message}`);
        }
      }
    }

    const updatedCombatants = combatState.combatants.map(c => {
      if (c.id !== id) return c;
      const newHP = Math.max(0, Math.min(c.hpMax, c.hp + finalDelta));
      return { ...c, hp: newHP };
    });

    updateState({
      ...combatState,
      combatants: updatedCombatants,
      log: [
        ...combatState.log,
        {
          timestamp: new Date(),
          type: finalDelta > 0 ? 'heal' : 'damage',
          target: combatant.name,
          message: `${finalDelta > 0 ? '+' : ''}${finalDelta} PV${damageType ? ` (${damageType})` : ''}`,
        },
        ...hookMessages.map(msg => ({
          timestamp: new Date(),
          type: 'condition' as const,
          message: msg,
        })),
      ],
    });
  }, [combatState, updateState]);

  // Funções específicas para tipos de dano
  const applyFallDamage = useCallback((id: string, fallHeight: number) => {
    // 1d6 por 1.5m de queda (simplificado: altura / 1.5 * 3.5 média)
    const averageDamage = Math.floor((fallHeight / 1.5) * 3.5);
    updateCombatantHP(id, -averageDamage, 'queda', `queda de ${fallHeight}m`);
  }, [updateCombatantHP]);

  const applyProjectileDamage = useCallback((id: string, damage: number, weaponName?: string) => {
    updateCombatantHP(id, -damage, 'balístico', weaponName || 'projétil');
  }, [updateCombatantHP]);

  const currentCombatant = combatState.combatants[combatState.currentTurnIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Swords className="w-6 h-6 text-primary" />
          <div>
            <h3 className="font-display text-xl tracking-wide">COMBAT TRACKER</h3>
            {combatState.isActive && (
              <p className="text-sm text-muted-foreground">
                Rodada {combatState.round} • Turno de {currentCombatant?.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {!combatState.isActive ? (
            <Button
              onClick={startCombat}
              disabled={combatState.combatants.length < 2}
              className="action-button gap-2"
            >
              <Play className="w-4 h-4" />
              Iniciar Combate
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleNextTurn}
                className="gap-2"
              >
                <SkipForward className="w-4 h-4" />
                Próximo Turno
              </Button>
              <Button
                variant="destructive"
                onClick={endCombat}
                className="gap-2"
              >
                <Pause className="w-4 h-4" />
                Encerrar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Add combatant form (only when not in combat) */}
      {!combatState.isActive && isMaster && (
        <div className="flex gap-3 p-4 bg-secondary/30 rounded-lg border border-border">
          <Input
            placeholder="Nome do combatente"
            value={newCombatantName}
            onChange={(e) => setNewCombatantName(e.target.value)}
            className="flex-1"
          />
          <Input
            type="number"
            min={0}
            max={5}
            value={newCombatantAgility}
            onChange={(e) => setNewCombatantAgility(parseInt(e.target.value) || 0)}
            className="w-20"
            placeholder="AGI"
          />
          <Button
            onClick={() => addCombatant(newCombatantName, newCombatantAgility, true)}
            disabled={!newCombatantName}
          >
            <Plus className="w-4 h-4 mr-2" />
            NPC
          </Button>
        </div>
      )}

      {/* Combatants list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {combatState.combatants.map((combatant, index) => {
            const isCurrentTurn = combatState.isActive && index === combatState.currentTurnIndex;
            const effectiveDefense = getEffectiveDefense(combatant.baseDefense, combatant.conditions);
            const canCombatantAct = canAct(combatant.conditions);

            return (
              <motion.div
                key={combatant.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <MagicCard
                  className={cn(
                    "p-4",
                    isCurrentTurn && "ring-2 ring-primary"
                  )}
                  gradientColor={isCurrentTurn ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                  spotlight={isCurrentTurn}
                  tilt={false}
                >
                  <div className="flex items-center gap-4">
                    {/* Initiative order */}
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center font-display text-lg",
                      isCurrentTurn 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>

                    {/* Name and initiative */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg truncate">
                          {combatant.name}
                        </span>
                        {combatant.isNPC && (
                          <span className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
                            NPC
                          </span>
                        )}
                        {isCurrentTurn && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <ChevronRight className="w-4 h-4 text-primary animate-pulse" />
                          </motion.div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>Iniciativa: {combatant.initiative}</span>
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          DEF {effectiveDefense}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4">
                      {/* HP */}
                      <div className="w-24">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Heart className="w-3 h-3 text-primary" />
                          <span>{combatant.hp}/{combatant.hpMax}</span>
                        </div>
                        <AnimatedProgress
                          value={combatant.hp}
                          max={combatant.hpMax}
                          variant="hp"
                          size="sm"
                        />
                      </div>

                      {/* PE */}
                      <div className="w-20">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Zap className="w-3 h-3 text-accent" />
                          <span>{combatant.pe}/{combatant.peMax}</span>
                        </div>
                        <AnimatedProgress
                          value={combatant.pe}
                          max={combatant.peMax}
                          variant="pe"
                          size="sm"
                        />
                      </div>

                      {/* SAN */}
                      <div className="w-20">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Brain className="w-3 h-3 text-paranormal" />
                          <span>{combatant.san}/{combatant.sanMax}</span>
                        </div>
                        <AnimatedProgress
                          value={combatant.san}
                          max={combatant.sanMax}
                          variant="san"
                          size="sm"
                        />
                      </div>
                    </div>

                    {/* HP controls (master only) */}
                    {isMaster && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateCombatantHP(combatant.id, -1)}
                          className="text-destructive"
                        >
                          -1
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateCombatantHP(combatant.id, 1)}
                          className="text-success"
                        >
                          +1
                        </Button>
                      </div>
                    )}

                    {/* Remove button */}
                    {!combatState.isActive && isMaster && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCombatant(combatant.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Conditions */}
                  {combatant.conditions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <ConditionList conditions={combatant.conditions} size="sm" />
                    </div>
                  )}

                  {/* Can't act warning */}
                  {!canCombatantAct && isCurrentTurn && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-2 bg-destructive/20 rounded text-destructive text-sm text-center"
                    >
                      ⚠️ Este combatente não pode agir neste turno
                    </motion.div>
                  )}
                </MagicCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Active Rituals Panel (for current combatant) */}
      {combatState.isActive && currentCombatant && (
        <ActiveRitualsPanel
          characterId={currentCombatant.id}
          characterName={currentCombatant.name}
          sustainedRituals={getSustainedRitualsForCharacter(currentCombatant.id)}
          currentRound={combatState.round}
          currentPE={currentCombatant.pe}
          isMaster={isMaster}
          onConcentrationDropped={(ritual) => {
            updateState({
              ...combatState,
              log: [
                ...combatState.log,
                {
                  timestamp: new Date(),
                  type: 'condition' as const,
                  message: `${currentCombatant.name} encerrou concentração em ${ritual.ritualName}`,
                },
              ],
            });
          }}
        />
      )}

      {/* Combat Stats and Hook Execution Log */}
      {combatState.isActive && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 bg-secondary/30 rounded-lg border border-border">
            <HookExecutionLog
              key={hookLogKey}
              entries={getExecutionLog()}
              onClear={clearExecutionLog}
              maxEntries={20}
            />
          </div>
          <CombatStatsPanel refreshKey={hookLogKey} />
        </div>
      )}

      {/* Combat log */}
      {combatState.log.length > 0 && (
        <div className="mt-6 p-4 bg-secondary/30 rounded-lg border border-border max-h-40 overflow-y-auto">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Log de Combate</h4>
          <div className="space-y-1 text-sm">
            {combatState.log.slice(-10).reverse().map((entry, i) => (
              <div key={i} className="text-muted-foreground">
                <span className="text-xs opacity-50">
                  {entry.timestamp.toLocaleTimeString()}
                </span>
                {' '}{entry.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {combatState.combatants.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Swords className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nenhum combatente adicionado.</p>
          <p className="text-sm">Adicione pelo menos 2 combatentes para iniciar.</p>
        </div>
      )}
    </div>
  );
}
