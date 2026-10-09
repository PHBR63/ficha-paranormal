/**
 * CharacterCombatTracker - Tracker de combate integrado à ficha individual
 * 
 * Funcionalidades:
 * - Rolagem de iniciativa (1d20 + AGI)
 * - Controle de turnos com contador de rodadas
 * - Aplicação rápida de dano/cura
 * - Indicador de condições que afetam o combate
 * - Log de ações do combate
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Swords,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Shield,
  Heart,
  Zap,
  Minus,
  Plus,
  Target,
  Crosshair,
  Timer,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';
import { getEffectiveDefense, canAct, canMove, getTestModifier } from '@/lib/game-engine';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Interface para dados do personagem
interface CharacterCombatData {
  name: string;
  agility: number;
  defense: number;
  hp_current: number;
  hp_max: number;
  pe_current: number;
  pe_max: number;
  conditions: string[];
}

// Interface para entrada no log de combate
interface CombatLogEntry {
  id: string;
  timestamp: Date;
  type: 'initiative' | 'damage' | 'heal' | 'turn' | 'round' | 'action' | 'condition';
  message: string;
}

// Interface para estado do combate
interface CombatState {
  isActive: boolean;
  round: number;
  initiative: number | null;
  initiativeRoll: number | null;
  isMyTurn: boolean;
  turnsTaken: number;
}

interface CharacterCombatTrackerProps {
  character: CharacterCombatData;
  onHPChange: (newHP: number) => void;
  onPEChange: (newPE: number) => void;
  activeConditionalBonuses?: string[];
}

// Função para rolar d20
const rollD20 = (): number => Math.floor(Math.random() * 20) + 1;

export function CharacterCombatTracker({
  character,
  onHPChange,
  onPEChange,
  activeConditionalBonuses = [],
}: CharacterCombatTrackerProps) {
  // Conta bônus condicionais ativos
  const activeBonusCount = activeConditionalBonuses.length;
  // Estado do combate
  const [combatState, setCombatState] = useState<CombatState>({
    isActive: false,
    round: 0,
    initiative: null,
    initiativeRoll: null,
    isMyTurn: false,
    turnsTaken: 0,
  });

  // Estado do log de combate
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);

  // Estado para input de dano/cura
  const [damageInput, setDamageInput] = useState<string>('');
  const [healInput, setHealInput] = useState<string>('');

  // Estado para expansão do painel
  const [isExpanded, setIsExpanded] = useState(false);

  // Calcula defesa efetiva com condições
  const effectiveDefense = getEffectiveDefense(character.defense, character.conditions);
  const canCharacterAct = canAct(character.conditions);
  const canCharacterMove = canMove(character.conditions);
  const testModifier = getTestModifier(character.conditions);

  // Adiciona entrada ao log
  const addLogEntry = (type: CombatLogEntry['type'], message: string) => {
    const entry: CombatLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      message,
    };
    setCombatLog(prev => [entry, ...prev].slice(0, 50)); // Mantém últimas 50 entradas
  };

  // Rola iniciativa
  const handleRollInitiative = () => {
    const roll = rollD20();
    const total = roll + character.agility;

    setCombatState(prev => ({
      ...prev,
      initiative: total,
      initiativeRoll: roll,
      isActive: true,
      round: prev.round === 0 ? 1 : prev.round,
    }));

    addLogEntry('initiative', `🎲 Iniciativa: ${roll} + ${character.agility} (AGI) = ${total}`);
  };

  // Inicia novo combate
  const handleStartCombat = () => {
    handleRollInitiative();
    addLogEntry('round', '⚔️ Combate iniciado!');
  };

  // Encerra combate
  const handleEndCombat = () => {
    setCombatState({
      isActive: false,
      round: 0,
      initiative: null,
      initiativeRoll: null,
      isMyTurn: false,
      turnsTaken: 0,
    });
    addLogEntry('round', '🏁 Combate encerrado');
  };

  // Marca início do meu turno
  const handleStartMyTurn = () => {
    setCombatState(prev => ({
      ...prev,
      isMyTurn: true,
    }));
    addLogEntry('turn', `▶️ Turno de ${character.name} iniciado (Rodada ${combatState.round})`);
  };

  // Encerra meu turno
  const handleEndMyTurn = () => {
    setCombatState(prev => ({
      ...prev,
      isMyTurn: false,
      turnsTaken: prev.turnsTaken + 1,
    }));
    addLogEntry('turn', `⏹️ Turno de ${character.name} encerrado`);
  };

  // Próxima rodada
  const handleNextRound = () => {
    setCombatState(prev => ({
      ...prev,
      round: prev.round + 1,
      isMyTurn: false,
    }));
    addLogEntry('round', `🔄 Rodada ${combatState.round + 1} iniciada`);
  };

  // Aplica dano
  const handleApplyDamage = () => {
    const damage = parseInt(damageInput);
    if (isNaN(damage) || damage <= 0) return;

    const newHP = Math.max(0, character.hp_current - damage);
    onHPChange(newHP);
    addLogEntry('damage', `💔 Recebeu ${damage} de dano (PV: ${character.hp_current} → ${newHP})`);
    setDamageInput('');
  };

  // Aplica cura
  const handleApplyHeal = () => {
    const heal = parseInt(healInput);
    if (isNaN(heal) || heal <= 0) return;

    const newHP = Math.min(character.hp_max, character.hp_current + heal);
    onHPChange(newHP);
    addLogEntry('heal', `💚 Recuperou ${heal} PV (PV: ${character.hp_current} → ${newHP})`);
    setHealInput('');
  };

  // Atalho para dano rápido
  const handleQuickDamage = (amount: number) => {
    const newHP = Math.max(0, character.hp_current - amount);
    onHPChange(newHP);
    addLogEntry('damage', `💔 -${amount} PV (${character.hp_current} → ${newHP})`);
  };

  // Atalho para cura rápida
  const handleQuickHeal = (amount: number) => {
    const newHP = Math.min(character.hp_max, character.hp_current + amount);
    onHPChange(newHP);
    addLogEntry('heal', `💚 +${amount} PV (${character.hp_current} → ${newHP})`);
  };

  // Gasta PE
  const handleSpendPE = (amount: number) => {
    if (character.pe_current < amount) return;
    const newPE = character.pe_current - amount;
    onPEChange(newPE);
    addLogEntry('action', `✨ Gastou ${amount} PE (${character.pe_current} → ${newPE})`);
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="ordo-panel overflow-hidden">
        {/* Header colapsável */}
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <Swords className="w-5 h-5 text-primary" />
            <span className="font-display tracking-wider text-sm">COMBAT TRACKER</span>
            {combatState.isActive && (
              <Badge variant="default" className="animate-pulse">
                Rodada {combatState.round}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Indicador de Bônus Condicionais Ativos */}
            {activeBonusCount > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/50"
                    >
                      <Zap className="w-3 h-3 text-amber-500 animate-pulse" />
                      <span className="text-xs font-bold text-amber-500">{activeBonusCount}</span>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold text-amber-500">Bônus Condicionais Ativos</p>
                      <ul className="text-xs space-y-0.5">
                        {activeConditionalBonuses.map((bonusId) => (
                          <li key={bonusId} className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {bonusId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {combatState.initiative !== null && (
              <Badge variant="outline" className="font-mono">
                Init: {combatState.initiative}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4 border-t border-border">
            {/* Status do Combate */}
            {!combatState.isActive ? (
              // Não em combate
              <Button onClick={handleStartCombat} className="w-full font-display">
                <Play className="w-4 h-4 mr-2" />
                INICIAR COMBATE
              </Button>
            ) : (
              // Em combate
              <div className="space-y-4">
                {/* Iniciativa e Rodada */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/30">
                    <p className="text-xs text-muted-foreground uppercase">Iniciativa</p>
                    <p className="font-display text-2xl text-primary">{combatState.initiative}</p>
                    <p className="text-xs text-muted-foreground">
                      🎲{combatState.initiativeRoll} + {character.agility}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase">Rodada</p>
                    <p className="font-display text-2xl">{combatState.round}</p>
                    <p className="text-xs text-muted-foreground">
                      {combatState.turnsTaken} turnos
                    </p>
                  </div>
                  <div className="text-center p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase">Defesa</p>
                    <p className={cn(
                      "font-display text-2xl",
                      effectiveDefense < character.defense && "text-destructive",
                      effectiveDefense > character.defense && "text-green-500"
                    )}>
                      {effectiveDefense}
                    </p>
                    {effectiveDefense !== character.defense && (
                      <p className="text-xs text-muted-foreground">
                        base: {character.defense}
                      </p>
                    )}
                  </div>
                </div>

                {/* Avisos de condições */}
                {(!canCharacterAct || !canCharacterMove || testModifier !== 0) && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg space-y-1">
                    {!canCharacterAct && (
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        Você não pode agir neste turno!
                      </div>
                    )}
                    {!canCharacterMove && canCharacterAct && (
                      <div className="flex items-center gap-2 text-orange-500 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        Você não pode se mover neste turno!
                      </div>
                    )}
                    {testModifier !== 0 && (
                      <div className="flex items-center gap-2 text-orange-500 text-sm">
                        <Target className="w-4 h-4" />
                        Modificador em testes: {testModifier > 0 ? '+' : ''}{testModifier}
                      </div>
                    )}
                  </div>
                )}

                {/* Controle de turno */}
                <div className="flex gap-2">
                  {!combatState.isMyTurn ? (
                    <Button
                      onClick={handleStartMyTurn}
                      className="flex-1 font-display"
                      disabled={!canCharacterAct}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      INICIAR MEU TURNO
                    </Button>
                  ) : (
                    <Button
                      onClick={handleEndMyTurn}
                      variant="secondary"
                      className="flex-1 font-display"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      ENCERRAR MEU TURNO
                    </Button>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleNextRound}
                          variant="outline"
                          size="icon"
                        >
                          <SkipForward className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Próxima Rodada</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleRollInitiative}
                          variant="outline"
                          size="icon"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Rolar Iniciativa Novamente</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Controles de Dano/Cura */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Dano */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Crosshair className="w-3 h-3 text-destructive" />
                      DANO
                    </div>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min={1}
                        value={damageInput}
                        onChange={(e) => setDamageInput(e.target.value)}
                        placeholder="Valor"
                        className="flex-1 h-8 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyDamage()}
                      />
                      <Button
                        onClick={handleApplyDamage}
                        variant="destructive"
                        size="sm"
                        className="h-8"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      {[1, 5, 10].map(amount => (
                        <Button
                          key={amount}
                          onClick={() => handleQuickDamage(amount)}
                          variant="outline"
                          size="sm"
                          className="flex-1 h-7 text-xs text-destructive hover:bg-destructive/10"
                        >
                          -{amount}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Cura */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Heart className="w-3 h-3 text-green-500" />
                      CURA
                    </div>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        min={1}
                        value={healInput}
                        onChange={(e) => setHealInput(e.target.value)}
                        placeholder="Valor"
                        className="flex-1 h-8 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyHeal()}
                      />
                      <Button
                        onClick={handleApplyHeal}
                        variant="default"
                        size="sm"
                        className="h-8 bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      {[1, 5, 10].map(amount => (
                        <Button
                          key={amount}
                          onClick={() => handleQuickHeal(amount)}
                          variant="outline"
                          size="sm"
                          className="flex-1 h-7 text-xs text-green-500 hover:bg-green-500/10"
                        >
                          +{amount}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Gasto rápido de PE */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Zap className="w-3 h-3 text-primary" />
                    GASTAR PE ({character.pe_current}/{character.pe_max})
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 5].map(amount => (
                      <Button
                        key={amount}
                        onClick={() => handleSpendPE(amount)}
                        variant="outline"
                        size="sm"
                        disabled={character.pe_current < amount}
                        className="flex-1 h-7 text-xs"
                      >
                        -{amount} PE
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Botão de encerrar combate */}
                <Button
                  onClick={handleEndCombat}
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-destructive"
                >
                  Encerrar Combate
                </Button>
              </div>
            )}

            {/* Log de Combate */}
            {combatLog.length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Log de Combate
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  <AnimatePresence>
                    {combatLog.slice(0, 10).map((entry) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          "text-xs py-1 px-2 rounded",
                          entry.type === 'damage' && "bg-destructive/10 text-destructive",
                          entry.type === 'heal' && "bg-green-500/10 text-green-500",
                          entry.type === 'initiative' && "bg-primary/10 text-primary",
                          entry.type === 'turn' && "bg-secondary text-foreground",
                          entry.type === 'round' && "bg-primary/5 text-primary font-medium",
                          entry.type === 'action' && "bg-accent/10 text-accent-foreground",
                        )}
                      >
                        <span className="opacity-50 mr-1">
                          {entry.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {entry.message}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
