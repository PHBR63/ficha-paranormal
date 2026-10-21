"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MagicCard } from "@/components/ui/magic-card";
import { AnimatedProgress } from "@/components/ui/animated-progress";
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
import { TacticalPauseModal } from "./TacticalPauseModal";
import { TurnActionsPanel } from "./TurnActionsPanel";
import { PreparedActionsList, type PreparedAction } from "./PreparedActionBadge";
import { ConditionBadges } from "@/components/character/conditions/ConditionBadges";
import { QuickAddConditionButton } from "@/components/character/conditions/ConditionManager";
import { CombatWeaponBuffsPanel } from "./CombatWeaponBuffsPanel";
import { TurnTimer, TurnTimerInline } from "./TurnTimer";
import { useCombatConditions, type LocalCombatCondition } from "@/hooks/combat/useCombatConditions";
import { useCombatWeaponBuffs } from "@/hooks/combat/useCombatWeaponBuffs";
import { useTurnTimer } from "@/hooks/combat/useTurnTimer";
import { useWeaponBuffs, type WeaponBuff } from "@/hooks/useWeaponBuffs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
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
  Clock,
  AlertTriangle,
  Timer,
} from '@/components/icons/ordem-icons';
import confetti from "canvas-confetti";

// Interface para props com buffs de personagem
interface CharacterBuffsData {
  buffs: WeaponBuff[];
  advanceTurn: () => { expired: WeaponBuff[]; remaining: WeaponBuff[] };
  setBuffTurns: (buffId: string, turns: number) => void;
  removeBuff: (buffId: string) => void;
}

interface CombatTrackerProps {
  campaignId?: string;
  initialCombatants?: Partial<CombatantState>[];
  onCombatUpdate?: (state: CombatState) => void;
  isMaster?: boolean;
  /** Mapa de characterId -> dados de buffs para integração com weapon buffs */
  characterBuffsMap?: Map<string, CharacterBuffsData>;
}

export function CombatTracker({
  campaignId,
  initialCombatants = [],
  onCombatUpdate,
  isMaster = true,
  characterBuffsMap = new Map(),
}: CombatTrackerProps) {
  const { user } = useAuth();
  const [combatState, setCombatState] = useState<CombatState>(() => {
    const state = createCombatState();
    return state;
  });
  const [newCombatantName, setNewCombatantName] = useState("");
  const [newCombatantAgility, setNewCombatantAgility] = useState(1);
  const [hookLogKey, setHookLogKey] = useState(0); // Force re-render of hook log

  // Novos estados para combate avançado
  const [tacticalPauseOpen, setTacticalPauseOpen] = useState(false);
  const [preparedActions, setPreparedActions] = useState<PreparedAction[]>([]);
  const [delayedCombatants, setDelayedCombatants] = useState<string[]>([]);

  // Estado de condições locais por combatente (para NPCs sem personagem vinculado)
  const [combatantConditions, setCombatantConditions] = useState<Record<string, LocalCombatCondition[]>>({});

  // Extrai IDs de personagens vinculados para sync em tempo real
  const linkedCharacterIds = useMemo(() => {
    return combatState.combatants
      .filter(c => c.characterId)
      .map(c => c.characterId as string);
  }, [combatState.combatants]);

  // Hook de gerenciamento de condições com realtime sync
  const conditionsHook = useCombatConditions({
    campaignId,
    userId: user?.id,
    enabled: !!user?.id,
    characterIds: linkedCharacterIds,
  });

  // Hook de sincronização de buffs de arma com combate
  const weaponBuffsHook = useCombatWeaponBuffs({
    combatants: combatState.combatants,
    currentRound: combatState.round,
    isActive: combatState.isActive,
    characterBuffsMap,
    onBuffsExpired: useCallback((results) => {
      // Adiciona mensagens ao log de combate
      const newLogEntries = results.flatMap(r => r.messages.map(msg => ({
        timestamp: new Date(),
        type: 'condition' as const,
        message: msg,
      })));

      if (newLogEntries.length > 0) {
        setCombatState(prev => ({
          ...prev,
          log: [...prev.log, ...newLogEntries],
        }));
      }
    }, []),
  });

  // Combatente atual (para uso nos hooks abaixo)
  const currentCombatant = combatState.combatants[combatState.currentTurnIndex];

  // Hook do timer de turno (Combat 8)
  const turnTimer = useTurnTimer({
    isActive: combatState.isActive,
    currentTurnIndex: combatState.currentTurnIndex,
    currentCombatantId: currentCombatant?.id,
    currentCombatantName: currentCombatant?.name,
    currentRound: combatState.round,
    onTimerExpire: undefined, // Será tratado separadamente para evitar dependências circulares
    onAlert: useCallback((secondsRemaining: number, combatantName: string) => {
      if (secondsRemaining === 15) {
        toast({
          title: "⏳ 15 segundos restantes",
          description: `Turno de ${combatantName}`,
        });
      } else if (secondsRemaining === 5) {
        toast({
          title: "⚠️ 5 segundos!",
          description: `${combatantName} precisa agir rapidamente!`,
          variant: "destructive",
        });
      }
    }, []),
  });

  // Sincroniza condições do BD com estado local quando mudam via realtime
  useEffect(() => {
    if (Object.keys(conditionsHook.syncedConditions).length === 0) return;

    // Atualiza condições locais para combatentes com characterId
    setCombatantConditions(prev => {
      const updated = { ...prev };

      // combatState.combatants acessado via closure - sempre valor mais recente
      for (const combatant of combatState.combatants) {
        if (combatant.characterId && conditionsHook.syncedConditions[combatant.characterId]) {
          updated[combatant.id] = conditionsHook.syncedConditions[combatant.characterId];
        }
      }

      return updated;
    });
  }, [conditionsHook.syncedConditions]); // combatState.combatants removido - evita loop infinito #185

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

  const handleNextTurn = useCallback(async () => {
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

    // Processa condições no início do turno (sistema novo)
    const localConditions = combatantConditions[currentCombatant.id] || [];
    const conditionEffects = conditionsHook.processConditionEffects(currentCombatant, localConditions);
    const decrementResult = await conditionsHook.decrementOnTurnStart(currentCombatant, localConditions);

    // Remove condições expiradas do estado local
    if (decrementResult.expiredConditions.length > 0) {
      setCombatantConditions(prev => ({
        ...prev,
        [currentCombatant.id]: (prev[currentCombatant.id] || []).filter(
          c => !decrementResult.expiredConditions.includes(c.id)
        ).map(c => {
          // Decrementa duração das condições que decrementam no início do turno
          if (c.decrementsAt === 'start_of_turn' && c.durationType === 'rounds' && c.durationRemaining !== null) {
            return { ...c, durationRemaining: c.durationRemaining - 1 };
          }
          return c;
        }),
      }));
    }

    // Coleta mensagens dos hooks
    const hookMessages = turnStartHooks.map(h =>
      `⚡ ${h.ritualName}: ${h.modifications?.message || h.effect}`
    );

    // Atualiza combatente com dano de condições e custo de sustentação
    const totalConditionDamage = turnResult.damage + conditionEffects.damage;
    const updatedCombatants = newState.combatants.map((c, i) => {
      if (i !== newState.currentTurnIndex) return c;
      return {
        ...c,
        hp: Math.max(0, c.hp - totalConditionDamage),
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
      ...conditionEffects.messages,
      ...decrementResult.messages,
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
  }, [combatState, updateState, combatantConditions, conditionsHook]);

  // Adiar turno (Delay)
  const handleDelayTurn = useCallback(() => {
    const current = combatState.combatants[combatState.currentTurnIndex];
    if (!current) return;

    setDelayedCombatants(prev => [...prev, current.id]);

    const newState = nextTurn(combatState);
    updateState({
      ...newState,
      log: [
        ...newState.log,
        {
          timestamp: new Date(),
          type: 'system' as const,
          message: `⏳ ${current.name} adiou seu turno`,
        },
      ],
    });
  }, [combatState, updateState]);

  // Preparar ação
  const handlePrepareAction = useCallback((trigger: string, action: string) => {
    const current = combatState.combatants[combatState.currentTurnIndex];
    if (!current) return;

    const preparedAction: PreparedAction = {
      id: crypto.randomUUID(),
      combatantId: current.id,
      combatantName: current.name,
      trigger,
      action,
      round: combatState.round,
      isActive: true,
    };

    setPreparedActions(prev => [...prev, preparedAction]);

    const updatedCombatants = combatState.combatants.map(c =>
      c.id === current.id
        ? { ...c, turnState: { ...c.turnState, hasActed: true } }
        : c
    );

    updateState({
      ...combatState,
      combatants: updatedCombatants,
      log: [
        ...combatState.log,
        {
          timestamp: new Date(),
          type: 'system' as const,
          message: `🎯 ${current.name} preparou uma ação: "${trigger}"`,
        },
      ],
    });
  }, [combatState, updateState]);

  // Ativar ação preparada
  const handleTriggerPreparedAction = useCallback((actionId: string) => {
    const action = preparedActions.find(a => a.id === actionId);
    if (!action) return;

    setPreparedActions(prev => prev.filter(a => a.id !== actionId));

    const updatedCombatants = combatState.combatants.map(c =>
      c.id === action.combatantId
        ? { ...c, turnState: { ...c.turnState, hasReacted: true } }
        : c
    );

    updateState({
      ...combatState,
      combatants: updatedCombatants,
      log: [
        ...combatState.log,
        {
          timestamp: new Date(),
          type: 'system' as const,
          message: `⚡ ${action.combatantName} ativou ação preparada: ${action.action}`,
        },
      ],
    });
  }, [combatState, preparedActions, updateState]);

  // Cancelar ação preparada
  const handleCancelPreparedAction = useCallback((actionId: string) => {
    setPreparedActions(prev => prev.filter(a => a.id !== actionId));
  }, []);

  // Marcar ação como usada
  const handleMarkAction = useCallback((combatantId: string, action: 'standard' | 'move' | 'reaction') => {
    const updatedCombatants = combatState.combatants.map(c => {
      if (c.id !== combatantId) return c;

      const newTurnState = { ...c.turnState };
      switch (action) {
        case 'standard':
          newTurnState.hasActed = !newTurnState.hasActed;
          break;
        case 'move':
          newTurnState.hasMoved = !newTurnState.hasMoved;
          break;
        case 'reaction':
          newTurnState.hasReacted = !newTurnState.hasReacted;
          break;
      }

      return { ...c, turnState: newTurnState };
    });

    updateState({ ...combatState, combatants: updatedCombatants });
  }, [combatState, updateState]);

  // Resetar ações
  const handleResetActions = useCallback((combatantId: string) => {
    const updatedCombatants = combatState.combatants.map(c =>
      c.id === combatantId
        ? { ...c, turnState: { ...c.turnState, hasActed: false, hasMoved: false, hasReacted: false } }
        : c
    );
    updateState({ ...combatState, combatants: updatedCombatants });
  }, [combatState, updateState]);

  // Ação completa
  const handleFullAction = useCallback((combatantId: string) => {
    const updatedCombatants = combatState.combatants.map(c =>
      c.id === combatantId
        ? { ...c, turnState: { ...c.turnState, hasActed: true, hasMoved: true } }
        : c
    );
    updateState({ ...combatState, combatants: updatedCombatants });
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

  // currentCombatant já declarado acima

  return (
    <div className="space-y-6">
      <p role="note" className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-foreground">
        Este painel de combate legado é manual e local. A mesa confirma ações preparadas,
        seus gatilhos e o prazo até o próximo turno do personagem. Reações comuns não
        têm um limite geral por rodada; limites de defesas especiais são conferidos à parte.
      </p>
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

      {/* Turn Timer - Exibe durante combate ativo */}
      {combatState.isActive && currentCombatant && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-secondary/20 rounded-lg border border-border">
          {/* Timer Compacto para mobile, completo para desktop */}
          <div className="hidden md:block w-full max-w-xs">
            <TurnTimer
              timerState={turnTimer.timerState}
              config={turnTimer.config}
              formattedTime={turnTimer.formattedTime}
              isWarning={turnTimer.isWarning}
              isCritical={turnTimer.isCritical}
              combatantName={currentCombatant.name}
              onStart={turnTimer.startTimer}
              onStop={turnTimer.stopTimer}
              onTogglePause={turnTimer.togglePause}
              onReset={turnTimer.resetTimer}
              onAddTime={turnTimer.addTime}
              onConfigChange={turnTimer.updateConfig}
            />
          </div>

          {/* Versão compacta para mobile */}
          <div className="md:hidden flex items-center gap-3 w-full">
            <div className="flex items-center gap-2 flex-1">
              <Timer className={cn(
                "w-5 h-5",
                turnTimer.isCritical ? "text-destructive animate-pulse" :
                  turnTimer.isWarning ? "text-amber-500" :
                    turnTimer.timerState.isRunning ? "text-emerald-500" :
                      "text-muted-foreground"
              )} />
              <span className={cn(
                "font-mono text-xl font-bold",
                turnTimer.isCritical ? "text-destructive" :
                  turnTimer.isWarning ? "text-amber-500" :
                    turnTimer.timerState.isRunning ? "text-emerald-500" :
                      "text-muted-foreground"
              )}>
                {turnTimer.formattedTime}
              </span>
              <span className="text-sm text-muted-foreground truncate">
                {currentCombatant.name}
              </span>
            </div>

            <div className="flex gap-1">
              {!turnTimer.timerState.isRunning ? (
                <Button size="sm" variant="outline" onClick={turnTimer.startTimer} className="gap-1">
                  <Play className="w-3.5 h-3.5" />
                  Iniciar
                </Button>
              ) : (
                <>
                  <Button size="icon" variant="ghost" onClick={turnTimer.togglePause} className="h-8 w-8">
                    {turnTimer.timerState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => turnTimer.addTime(30)} className="h-8 w-8">
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={turnTimer.resetTimer} className="h-8 w-8">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Info do turno atual para desktop */}
          <div className="hidden md:flex flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground">Turno Atual</span>
            <span className="font-display text-lg">{currentCombatant.name}</span>
            <span className="text-xs text-muted-foreground">
              Rodada {combatState.round}
            </span>
          </div>
        </div>
      )}

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

                  {/* Condições do sistema novo + condições legadas */}
                  {((combatantConditions[combatant.id] || []).length > 0 || combatant.conditions.length > 0) && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
                      {/* Condições do novo sistema */}
                      {(combatantConditions[combatant.id] || []).length > 0 && (
                        <ConditionBadges
                          conditions={(combatantConditions[combatant.id] || []).map(c => ({
                            id: c.id,
                            character_id: combatant.id,
                            user_id: user?.id || '',
                            condition_id: c.conditionId,
                            condition_name: c.conditionName,
                            condition_type: 'condition' as const,
                            description: c.description || null,
                            mechanical_effect: c.mechanicalEffect || null,
                            duration_type: c.durationType,
                            duration_total: c.durationRemaining,
                            duration_remaining: c.durationRemaining,
                            decrements_at: c.decrementsAt,
                            stacks: c.stacks,
                            max_stacks: null,
                            source_name: c.sourceName || null,
                            source_type: null,
                            icon: c.icon || null,
                            color: c.color || null,
                            can_be_removed: true,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            campaign_id: campaignId || null,
                            session_id: null,
                            applied_at_round: null,
                            applied_at_turn: null,
                          }))}
                          onRemove={isMaster ? async (conditionId) => {
                            setCombatantConditions(prev => ({
                              ...prev,
                              [combatant.id]: (prev[combatant.id] || []).filter(c => c.id !== conditionId),
                            }));
                            return true;
                          } : undefined}
                          compact
                          maxVisible={4}
                        />
                      )}

                      {/* Condições legadas (strings) - exibe como badges simples */}
                      {combatant.conditions.length > 0 && (combatantConditions[combatant.id] || []).length === 0 && (
                        <div className="flex flex-wrap gap-1">
                          {combatant.conditions.map((cond, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded bg-destructive/20 text-destructive">
                              {cond}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Botão de adicionar condição (apenas para mestres) */}
                      {isMaster && (
                        <QuickAddConditionButton
                          onAdd={async (data) => {
                            const newCondition = await conditionsHook.applyCondition(combatant.id, data);
                            setCombatantConditions(prev => ({
                              ...prev,
                              [combatant.id]: [...(prev[combatant.id] || []), newCondition],
                            }));
                          }}
                          className="ml-auto"
                        />
                      )}
                    </div>
                  )}

                  {/* Botão para adicionar condição quando não há nenhuma */}
                  {(combatantConditions[combatant.id] || []).length === 0 && combatant.conditions.length === 0 && isMaster && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <QuickAddConditionButton
                        onAdd={async (data) => {
                          const newCondition = await conditionsHook.applyCondition(combatant.id, data);
                          setCombatantConditions(prev => ({
                            ...prev,
                            [combatant.id]: [...(prev[combatant.id] || []), newCondition],
                          }));
                        }}
                      />
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

      {/* Painel de Buffs de Arma - exibe buffs ativos durante o combate */}
      {combatState.isActive && weaponBuffsHook.totalActiveBuffs > 0 && (
        <CombatWeaponBuffsPanel
          combatantBuffs={weaponBuffsHook.combatantBuffs}
          hasTurnBasedBuffs={weaponBuffsHook.hasTurnBasedBuffsInCombat}
          totalBuffs={weaponBuffsHook.totalActiveBuffs}
          currentCombatantId={currentCombatant?.id}
          onAdvanceTurn={isMaster ? weaponBuffsHook.advanceAllBuffTurns : undefined}
          onRemoveBuff={isMaster ? (characterId, buffId) => {
            const charData = characterBuffsMap.get(characterId);
            if (charData) {
              charData.removeBuff(buffId);
            }
          } : undefined}
          onAdjustTurns={isMaster ? (characterId, buffId, delta) => {
            const charData = characterBuffsMap.get(characterId);
            if (charData) {
              const buff = charData.buffs.find(b => b.id === buffId);
              if (buff && buff.turnsRemaining !== undefined) {
                charData.setBuffTurns(buffId, Math.max(0, buff.turnsRemaining + delta));
              }
            }
          } : undefined}
          className="mt-4"
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
