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
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { SessionCombatPanel } from './SessionCombatPanel';
import { TurnTracker } from './TurnTracker';
import { QuickResistanceRolls } from './QuickResistanceRolls';
import { SessionLog, useSessionLog, type SessionLogEntry } from './SessionLog';
import { ConditionList } from '@/components/ui/condition-badge';
import { processStartOfTurn } from '@/lib/game-engine';
import type { ActiveCondition } from '@/hooks/useAutoConditions';

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
  // Atributos para resistências
  vigor: number;
  agility: number;
  presence: number;
  // Skills relevantes
  skills: Record<string, { trained: boolean; bonus: number }>;
  // Inventário para RD
  inventory: Array<{
    name: string;
    isEquipped?: boolean;
    itemType?: string;
    rd?: number;
    armorType?: string;
  }>;
  // Condições
  conditions: ActiveCondition[];
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

  // Calcula RD total das armaduras equipadas
  const totalRD = character.inventory
    .filter(item => 
      item.isEquipped && 
      item.itemType === 'armor' && 
      item.armorType !== 'escudo'
    )
    .reduce((sum, item) => sum + (item.rd || 0), 0);

  // Bônus de resistências (se treinado)
  const getSkillBonus = (skillId: string): number => {
    const skill = character.skills[skillId];
    return skill?.trained ? (skill.bonus || 0) : 0;
  };

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
  }, [character, onCharacterUpdate, addEntry]);

  const handleTurnEnd = useCallback(() => {
    addEntry('turn', 'Fim do turno');
  }, [addEntry]);

  const handleRollResult = useCallback((result: { type: string; roll: number; total: number }) => {
    addEntry('roll', `${result.type}: d20(${result.roll}) = ${result.total}`, {
      rollResult: result.total
    });
  }, [addEntry]);

  // Modificador de condições para resistências
  const conditionModifier = character.conditions.reduce((mod, c) => {
    if (c.id === 'perturbado' || c.id === 'exausto') return mod - 2;
    return mod;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[90vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b bg-muted/30 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <DialogTitle className="text-base">{character.name}</DialogTitle>
              <Badge variant="secondary" className="text-xs">
                NEX {character.nex}%
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
          <TabsList className="w-full grid grid-cols-4 shrink-0 rounded-none border-b bg-transparent h-10">
            <TabsTrigger value="combat" className="text-xs gap-1.5 data-[state=active]:bg-muted">
              <Swords className="w-3.5 h-3.5" />
              Combate
            </TabsTrigger>
            <TabsTrigger value="turn" className="text-xs gap-1.5 data-[state=active]:bg-muted">
              <Clock className="w-3.5 h-3.5" />
              Turno
            </TabsTrigger>
            <TabsTrigger value="rolls" className="text-xs gap-1.5 data-[state=active]:bg-muted">
              <Dices className="w-3.5 h-3.5" />
              Testes
            </TabsTrigger>
            <TabsTrigger value="log" className="text-xs gap-1.5 data-[state=active]:bg-muted">
              <ScrollText className="w-3.5 h-3.5" />
              Log
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
                  onPESpend={(amount) => {
                    if (amount > character.pe) return false;
                    handlePEChange(character.pe - amount);
                    addEntry('pe', `PE gasto: -${amount}`, { value: amount, previousValue: character.pe }, true);
                    return true;
                  }}
                />
              </TabsContent>

              {/* Testes Tab */}
              <TabsContent value="rolls" className="mt-0 p-4">
                <QuickResistanceRolls
                  vigor={character.vigor}
                  agility={character.agility}
                  presence={character.presence}
                  fortitudeBonus={getSkillBonus('fortitude')}
                  reflexosBonus={getSkillBonus('reflexos')}
                  vontadeBonus={getSkillBonus('vontade')}
                  conditionModifier={conditionModifier}
                  onRoll={handleRollResult}
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
      </DialogContent>
    </Dialog>
  );
}
