// Dialog fullscreen para Modo Sessão Presencial
// Ordem Paranormal RPG v1.3

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  Swords, 
  Clock, 
  Dices, 
  ScrollText,
  AlertTriangle,
  User,
  Sword,
  Sparkles,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { SessionCombatPanel } from './SessionCombatPanel';
import { TurnTracker } from './TurnTracker';
import { QuickResistanceRolls } from './QuickResistanceRolls';
import { SessionLog, useSessionLog, type SessionLogEntry } from './SessionLog';
import { SessionAttackPanel } from './SessionAttackPanel';
import { SessionRitualPanel } from './SessionRitualPanel';
import { SkillRollsPanel } from './SkillRollsPanel';
import { ConditionManagerPanel, type ConditionWithDuration } from './ConditionManagerPanel';
import { ConditionList } from '@/components/ui/condition-badge';
import { processStartOfTurn } from '@/lib/game-engine';
import { getActiveRitualEffect } from '@/lib/ritual-effects';
import type { ActiveCondition } from '@/hooks/useAutoConditions';
import type { Ritual } from '@/lib/rituals-data';
import type { TurnPEState } from '@/hooks/useRitualValidation';
import type { WeaponBuff } from '@/hooks/useWeaponBuffs';

interface WeaponData {
  id: string;
  name: string;
  type: string;
  damage: string;
  criticalRange?: number;
  criticalMultiplier?: number;
  range?: string;
  ammo?: { current: number; max: number };
  special?: string[];
  category?: string;
}

interface CharacterData {
  id: string;
  name: string;
  nex: number;
  hp: number;
  hpMax: number;
  pe: number;
  peMax: number;
  san: number;
  sanMax: number;
  defense: number;
  // Atributos
  vigor: number;
  agility: number;
  presence: number;
  intellect: number;
  strength: number;
  // Skills
  skills: Record<string, { trained: boolean; bonus: number; veteran?: boolean; expert?: boolean }>;
  // Inventário
  inventory: Array<{
    id?: string;
    name: string;
    isEquipped?: boolean;
    itemType?: string;
    rd?: number;
    armorType?: string;
    weaponType?: string;
    damage?: string;
    criticalRange?: number;
    criticalMultiplier?: number;
    range?: string;
    ammo?: { current: number; max: number };
  }>;
  // Condições
  conditions: ActiveCondition[];
  // Rituais conhecidos
  rituals?: Ritual[];
  // Classe e afinidade
  class?: string;
  elementalAffinity?: string | null;
}

interface SessionModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: CharacterData;
  onCharacterUpdate: (updates: Partial<CharacterData>) => void;
}

export function SessionModeDialog({
  open,
  onOpenChange,
  character,
  onCharacterUpdate,
}: SessionModeDialogProps) {
  const { entries, addEntry, removeEntry, clearEntries } = useSessionLog();
  const [activeTab, setActiveTab] = useState('combat');
  const [turnPEState, setTurnPEState] = useState<TurnPEState>({ peSpentThisTurn: 0, turnNumber: 1 });
  const [currentRound, setCurrentRound] = useState(1);
  const [conditionsWithDuration, setConditionsWithDuration] = useState<ConditionWithDuration[]>([]);
  const [weaponBuffs, setWeaponBuffs] = useState<WeaponBuff[]>([]);

  // Sincroniza condições com duration tracking
  useEffect(() => {
    const existingIds = conditionsWithDuration.map(c => c.id);
    const characterConditionIds = character.conditions.map(c => c.id);
    
    // Adiciona novas condições
    const newConditions = character.conditions
      .filter(c => !existingIds.includes(c.id))
      .map(c => ({ id: c.id }));
    
    // Remove condições que não existem mais
    const updatedConditions = conditionsWithDuration.filter(c => characterConditionIds.includes(c.id));
    
    if (newConditions.length > 0 || updatedConditions.length !== conditionsWithDuration.length) {
      setConditionsWithDuration([...updatedConditions, ...newConditions]);
    }
  }, [character.conditions]);

  // Calcula RD total das armaduras equipadas
  const totalRD = character.inventory
    .filter(item => 
      item.isEquipped && 
      item.itemType === 'armor' && 
      item.armorType !== 'escudo'
    )
    .reduce((sum, item) => sum + (item.rd || 0), 0);

  // Extrai armas equipadas do inventário
  const equippedWeapons: WeaponData[] = character.inventory
    .filter(item => item.isEquipped && item.weaponType)
    .map(item => ({
      id: item.id || item.name,
      name: item.name,
      type: item.weaponType || 'Corpo a Corpo',
      damage: item.damage || '1d4',
      criticalRange: item.criticalRange,
      criticalMultiplier: item.criticalMultiplier,
      range: item.range,
      ammo: item.ammo,
    }));

  // Bônus de resistências (se treinado)
  const getSkillBonus = (skillId: string): number => {
    const skill = character.skills[skillId];
    return skill?.trained ? (skill.bonus || 0) : 0;
  };

  // Verifica se é ocultista
  const isOccultist = ['Ocultista'].includes(character.class || '');

  // Handlers
  const handleHPChange = useCallback((newHP: number, damage?: number) => {
    onCharacterUpdate({ hp: newHP } as Partial<CharacterData>);
  }, [onCharacterUpdate]);

  const handlePEChange = useCallback((newPE: number) => {
    onCharacterUpdate({ pe: newPE } as Partial<CharacterData>);
  }, [onCharacterUpdate]);

  const handleSANChange = useCallback((newSAN: number) => {
    onCharacterUpdate({ san: newSAN } as Partial<CharacterData>);
  }, [onCharacterUpdate]);

  const handleConditionsChange = useCallback((conditions: ActiveCondition[]) => {
    onCharacterUpdate({ conditions } as Partial<CharacterData>);
    
    // Log de mudanças de condição
    const currentIds = character.conditions.map(c => c.id);
    const newIds = conditions.map(c => c.id);
    
    const added = conditions.filter(c => !currentIds.includes(c.id));
    const removed = character.conditions.filter(c => !newIds.includes(c.id));
    
    added.forEach(c => {
      addEntry('condition', `Condição adicionada: ${c.name}`, { conditionId: c.id });
    });
    
    removed.forEach(c => {
      addEntry('condition', `Condição removida: ${c.name}`, { conditionId: c.id });
    });
  }, [onCharacterUpdate, character.conditions, addEntry]);

  const handleLogEntry = useCallback((entry: Omit<SessionLogEntry, 'id' | 'timestamp'>) => {
    addEntry(entry.type, entry.message, entry.details, entry.canUndo);
  }, [addEntry]);

  const handleUndo = useCallback((entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry || !entry.details?.previousValue === undefined) return;

    // Desfaz baseado no tipo
    switch (entry.type) {
      case 'damage':
      case 'heal':
        if (entry.details.previousValue !== undefined) {
          onCharacterUpdate({ hp: entry.details.previousValue } as Partial<CharacterData>);
        }
        break;
      case 'pe':
        if (entry.details.previousValue !== undefined) {
          onCharacterUpdate({ pe: entry.details.previousValue } as Partial<CharacterData>);
        }
        break;
      case 'san':
        if (entry.details.previousValue !== undefined) {
          onCharacterUpdate({ san: entry.details.previousValue } as Partial<CharacterData>);
        }
        break;
    }

    removeEntry(entryId);
    addEntry('system', `Ação desfeita: ${entry.message}`);
  }, [entries, onCharacterUpdate, removeEntry, addEntry]);

  const handleTurnStart = useCallback(() => {
    addEntry('turn', 'Início do turno');
    
    // Processa condições com duração
    const updatedConditions = conditionsWithDuration.map(c => {
      if (c.turnsRemaining !== undefined && c.turnsRemaining > 0) {
        return { ...c, turnsRemaining: c.turnsRemaining - 1 };
      }
      return c;
    });
    
    // Remove condições que expiraram
    const expiredConditions = updatedConditions.filter(c => c.turnsRemaining === 0);
    const activeConditions = updatedConditions.filter(c => c.turnsRemaining !== 0);
    
    if (expiredConditions.length > 0) {
      setConditionsWithDuration(activeConditions);
      expiredConditions.forEach(c => {
        addEntry('condition', `Condição expirou: ${c.id}`);
      });
      // Atualiza condições do personagem
      const newConditions = character.conditions.filter(
        cc => !expiredConditions.some(ec => ec.id === cc.id)
      );
      onCharacterUpdate({ conditions: newConditions } as Partial<CharacterData>);
    }
    
    // Cria um CombatantState temporário para processar efeitos
    const combatantState = {
      id: character.id,
      name: character.name,
      initiative: 0,
      initiativeRoll: [],
      hp: character.hp,
      hpMax: character.hpMax,
      pe: character.pe,
      peMax: character.peMax,
      san: character.san,
      sanMax: character.sanMax,
      defense: character.defense,
      baseDefense: character.defense,
      conditions: character.conditions.map(c => c.id),
      turnState: {
        peSpentThisTurn: 0,
        peLimit: 5,
        hasActed: false,
        hasMoved: false,
        hasReacted: false,
        actionsRemaining: 2,
      },
      dyingCounter: character.conditions.find(c => c.id === 'morrendo')?.dyingCounter,
    };
    
    const result = processStartOfTurn(combatantState);

    // Aplica dano de condições
    if (result.damage > 0) {
      const newHP = character.hp - result.damage;
      onCharacterUpdate({ hp: newHP } as Partial<CharacterData>);
      addEntry('damage', `Dano de início de turno: -${result.damage} HP`);
    }

    if (result.sanDamage > 0) {
      const newSAN = Math.max(0, character.san - result.sanDamage);
      onCharacterUpdate({ san: newSAN } as Partial<CharacterData>);
      addEntry('san', `Dano de sanidade de início de turno: -${result.sanDamage} SAN`);
    }

    // Log de mensagens do sistema
    result.messages.forEach(msg => {
      addEntry('system', msg);
    });
  }, [character, onCharacterUpdate, addEntry, conditionsWithDuration]);

  const handleTurnEnd = useCallback(() => {
    addEntry('turn', 'Fim do turno');
    // Reset PE spent this turn
    setTurnPEState(prev => ({ ...prev, peSpentThisTurn: 0 }));
  }, [addEntry]);

  const handleNewRound = useCallback(() => {
    setCurrentRound(prev => prev + 1);
    setTurnPEState(prev => ({ peSpentThisTurn: 0, turnNumber: prev.turnNumber + 1 }));
    addEntry('turn', `Nova rodada: ${currentRound + 1}`);
  }, [addEntry, currentRound]);

  const handleRollResult = useCallback((result: { type: string; roll: number; total: number }) => {
    addEntry('roll', `${result.type}: d20(${result.roll}) = ${result.total}`, {
      rollResult: result.total
    });
  }, [addEntry]);

  // Attack handlers
  const handleAttackResult = useCallback((result: any) => {
    let message = `Ataque com ${result.weaponName}: d20(${result.attackRoll}) + ${result.modifier} = ${result.total}`;
    if (result.isCritical) message += ' [CRÍTICO!]';
    if (result.isCriticalFail) message += ' [FALHA CRÍTICA]';
    if (result.damageTotal !== undefined) {
      message += ` | Dano: ${result.damageTotal}`;
    }
    addEntry('roll', message, { attackResult: result });
  }, [addEntry]);

  const handleAmmoConsume = useCallback((weaponId: string) => {
    const updatedInventory = character.inventory.map(item => {
      if ((item.id || item.name) === weaponId && item.ammo) {
        return {
          ...item,
          ammo: { ...item.ammo, current: Math.max(0, item.ammo.current - 1) }
        };
      }
      return item;
    });
    onCharacterUpdate({ inventory: updatedInventory } as Partial<CharacterData>);
  }, [character.inventory, onCharacterUpdate]);

  // Ritual handlers
  const handleRitualCast = useCallback((ritual: Ritual, cost: number, enhancements: string[]) => {
    const enhStr = enhancements.length > 0 ? ` [${enhancements.join(', ')}]` : '';
    addEntry('ritual', `Ritual conjurado: ${ritual.name}${enhStr} (-${cost} PE)`, {
      ritualId: ritual.id,
      cost,
      enhancements,
      previousPE: character.pe,
    }, true);

    // Check if ritual has weapon effect and add buff
    const effect = getActiveRitualEffect(ritual.id, enhancements);
    if (effect?.weaponEffect) {
      const newBuff: WeaponBuff = {
        id: `${ritual.id}-${Date.now()}`,
        ritualId: ritual.id,
        ritualName: ritual.name,
        element: ritual.element,
        bonusDamage: effect.weaponEffect.bonusDamage,
        attackBonus: effect.weaponEffect.attackBonus,
        criticalBonus: effect.weaponEffect.criticalBonus,
        criticalMultiplierBonus: effect.weaponEffect.criticalMultiplierBonus,
        appliedAt: new Date().toISOString(),
        duration: 'cena',
        enhancements,
      };
      setWeaponBuffs(prev => [...prev, newBuff]);
      addEntry('system', `Buff de arma aplicado: ${ritual.name}`);
    }
  }, [addEntry, character.pe]);

  // Weapon buff handlers
  const handleRemoveWeaponBuff = useCallback((buffId: string) => {
    setWeaponBuffs(prev => prev.filter(b => b.id !== buffId));
    addEntry('system', 'Buff de arma removido');
  }, [addEntry]);

  const handleClearWeaponBuffs = useCallback(() => {
    setWeaponBuffs([]);
    addEntry('system', 'Todos os buffs de arma limpos');
  }, [addEntry]);

  const handlePESpend = useCallback((amount: number): boolean => {
    if (amount > character.pe) return false;
    
    const newPE = character.pe - amount;
    onCharacterUpdate({ pe: newPE } as Partial<CharacterData>);
    setTurnPEState(prev => ({ ...prev, peSpentThisTurn: prev.peSpentThisTurn + amount }));
    
    return true;
  }, [character.pe, onCharacterUpdate]);

  // Skill roll handlers
  const handleSkillRollResult = useCallback((result: any) => {
    let message = `Teste de ${result.skillName}: d20(${result.roll}) + ${result.modifier} = ${result.total}`;
    if (result.dt) {
      message += ` vs DT ${result.dt}`;
      if (result.success !== undefined) {
        message += result.success ? ' [SUCESSO]' : ' [FALHA]';
      }
    }
    if (result.isCritical) message += ' [20 NATURAL!]';
    if (result.isCriticalFail) message += ' [FALHA CRÍTICA]';
    addEntry('roll', message, { skillResult: result });
  }, [addEntry]);

  // Condition manager handlers
  const handleAddCondition = useCallback((conditionId: string, duration?: number, source?: string) => {
    // Verifica se já existe
    if (character.conditions.some(c => c.id === conditionId)) return;
    
    const { CONDITIONS } = require('@/lib/conditions');
    const conditionData = CONDITIONS[conditionId];
    if (!conditionData) return;
    
    const newCondition: ActiveCondition = {
      id: conditionId,
      name: conditionData.name,
      turnsRemaining: duration || null,
      addedAt: new Date(),
    };
    
    // Adiciona ao tracking de duração
    setConditionsWithDuration(prev => [
      ...prev, 
      { id: conditionId, turnsRemaining: duration, appliedAt: currentRound, source }
    ]);
    
    onCharacterUpdate({ 
      conditions: [...character.conditions, newCondition] 
    } as Partial<CharacterData>);
    
    addEntry('condition', `Condição aplicada: ${conditionData.name}${duration ? ` (${duration} turnos)` : ''}${source ? ` - ${source}` : ''}`);
  }, [character.conditions, onCharacterUpdate, addEntry, currentRound]);

  const handleRemoveCondition = useCallback((conditionId: string) => {
    const condition = character.conditions.find(c => c.id === conditionId);
    if (!condition) return;
    
    setConditionsWithDuration(prev => prev.filter(c => c.id !== conditionId));
    onCharacterUpdate({ 
      conditions: character.conditions.filter(c => c.id !== conditionId) 
    } as Partial<CharacterData>);
    
    addEntry('condition', `Condição removida: ${condition.name}`);
  }, [character.conditions, onCharacterUpdate, addEntry]);

  const handleUpdateConditionDuration = useCallback((conditionId: string, newDuration: number | undefined) => {
    setConditionsWithDuration(prev => 
      prev.map(c => c.id === conditionId ? { ...c, turnsRemaining: newDuration } : c)
    );
  }, []);

  // Modificador de condições para resistências
  const conditionModifier = character.conditions.reduce((mod, c) => {
    if (c.id === 'perturbado' || c.id === 'exausto') return mod - 2;
    return mod;
  }, 0);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case '1': setActiveTab('combat'); break;
        case '2': setActiveTab('turn'); break;
        case '3': setActiveTab('attacks'); break;
        case '4': setActiveTab('rituals'); break;
        case '5': setActiveTab('skills'); break;
        case '6': setActiveTab('conditions'); break;
        case '7': setActiveTab('log'); break;
        case 'Escape': onOpenChange(false); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b bg-muted/30 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <DialogTitle className="text-base">{character.name}</DialogTitle>
              <Badge variant="secondary" className="text-xs">
                NEX {character.nex}%
              </Badge>
              <Badge variant="outline" className="text-xs">
                Rodada {currentRound}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Condições Ativas */}
        {character.conditions.length > 0 && (
          <div className="px-4 py-2 border-b bg-warning/5 shrink-0">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
              <span className="text-xs font-medium text-warning">Condições Ativas</span>
            </div>
            <ConditionList 
              conditions={character.conditions.map(c => c.id)}
              size="sm"
              maxVisible={6}
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full grid grid-cols-7 shrink-0 rounded-none border-b bg-transparent h-10">
            <TabsTrigger value="combat" className="text-xs gap-1 data-[state=active]:bg-muted px-2">
              <Swords className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Combate</span>
            </TabsTrigger>
            <TabsTrigger value="turn" className="text-xs gap-1 data-[state=active]:bg-muted px-2">
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Turno</span>
            </TabsTrigger>
            <TabsTrigger value="attacks" className="text-xs gap-1 data-[state=active]:bg-muted px-2">
              <Sword className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ataques</span>
            </TabsTrigger>
            <TabsTrigger value="rituals" className="text-xs gap-1 data-[state=active]:bg-muted px-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Rituais</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="text-xs gap-1 data-[state=active]:bg-muted px-2">
              <Dices className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Perícias</span>
            </TabsTrigger>
            <TabsTrigger value="conditions" className="text-xs gap-1 data-[state=active]:bg-muted px-2">
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Condições</span>
            </TabsTrigger>
            <TabsTrigger value="log" className="text-xs gap-1 data-[state=active]:bg-muted px-2">
              <ScrollText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              {/* Combate Tab */}
              <TabsContent value="combat" className="mt-0 p-4">
                <SessionCombatPanel
                  hp={character.hp}
                  hpMax={character.hpMax}
                  pe={character.pe}
                  peMax={character.peMax}
                  san={character.san}
                  sanMax={character.sanMax}
                  defense={character.defense}
                  rd={totalRD}
                  conditions={character.conditions}
                  onHPChange={handleHPChange}
                  onPEChange={handlePEChange}
                  onSANChange={handleSANChange}
                  onConditionsChange={handleConditionsChange}
                  onLogEntry={handleLogEntry}
                />
              </TabsContent>

              {/* Turno Tab */}
              <TabsContent value="turn" className="mt-0 p-4">
                <TurnTracker
                  nex={character.nex}
                  peCurrent={character.pe}
                  conditions={character.conditions.map(c => c.id)}
                  onTurnStart={handleTurnStart}
                  onTurnEnd={handleTurnEnd}
                  onNewRound={handleNewRound}
                  onPESpend={(amount) => {
                    if (amount > character.pe) return false;
                    handlePEChange(character.pe - amount);
                    setTurnPEState(prev => ({ ...prev, peSpentThisTurn: prev.peSpentThisTurn + amount }));
                    addEntry('pe', `PE gasto: -${amount}`, { value: amount, previousValue: character.pe }, true);
                    return true;
                  }}
                />
              </TabsContent>

              {/* Ataques Tab */}
              <TabsContent value="attacks" className="mt-0 p-4">
                <SessionAttackPanel
                  weapons={equippedWeapons}
                  attributes={{
                    agility: character.agility,
                    strength: character.strength,
                    intellect: character.intellect,
                    presence: character.presence,
                    vigor: character.vigor,
                  }}
                  skills={character.skills}
                  conditions={character.conditions.map(c => c.id)}
                  weaponBuffs={weaponBuffs}
                  onAttackResult={handleAttackResult}
                  onAmmoConsume={handleAmmoConsume}
                  onRemoveWeaponBuff={handleRemoveWeaponBuff}
                />
              </TabsContent>

              {/* Rituais Tab */}
              <TabsContent value="rituals" className="mt-0 p-4">
                <SessionRitualPanel
                  rituals={character.rituals || []}
                  nex={character.nex}
                  peCurrent={character.pe}
                  peMax={character.peMax}
                  elementalAffinity={character.elementalAffinity}
                  turnPEState={turnPEState}
                  isNonOccultist={!isOccultist}
                  onCast={handleRitualCast}
                  onPESpend={handlePESpend}
                />
              </TabsContent>

              {/* Perícias Tab */}
              <TabsContent value="skills" className="mt-0 p-4">
                <SkillRollsPanel
                  skills={character.skills}
                  attributes={{
                    agility: character.agility,
                    strength: character.strength,
                    intellect: character.intellect,
                    presence: character.presence,
                    vigor: character.vigor,
                  }}
                  conditionModifier={conditionModifier}
                  onRollResult={handleSkillRollResult}
                />
              </TabsContent>

              {/* Condições Tab */}
              <TabsContent value="conditions" className="mt-0 p-4">
                <ConditionManagerPanel
                  conditions={conditionsWithDuration}
                  currentRound={currentRound}
                  onAdd={handleAddCondition}
                  onRemove={handleRemoveCondition}
                  onUpdateDuration={handleUpdateConditionDuration}
                />
              </TabsContent>

              {/* Log Tab */}
              <TabsContent value="log" className="mt-0 p-4">
                <SessionLog
                  entries={entries}
                  onUndo={handleUndo}
                  onClear={clearEntries}
                  maxHeight="calc(100vh - 280px)"
                />
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>

        {/* Keyboard shortcuts hint */}
        <div className="px-4 py-2 border-t bg-muted/20 text-[10px] text-muted-foreground flex justify-center gap-4 shrink-0">
          <span>1-7: Abas</span>
          <span>ESC: Fechar</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
