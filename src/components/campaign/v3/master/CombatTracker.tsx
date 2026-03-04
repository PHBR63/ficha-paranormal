/**
 * CombatTracker - Tracker de iniciativa e rodadas do combate
 * 
 * Lista ordenada de personagens por iniciativa, contador de rodadas,
 * indicador visual de turno atual.
 * 
 * @module components/campaign/v3/master/CombatTracker
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sword as SwordIcon,
  Play as PlayIcon,
  Stop as StopIcon,
  SkipForward as SkipForwardIcon,
  ArrowCounterClockwise as ArrowCounterClockwiseIcon,
  DotsSixVertical as DotsSixVerticalIcon,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';

interface CombatantEntry {
  id: string;
  name: string;
  initiative: number;
  photoUrl?: string | null;
  isNPC?: boolean;
  hpCurrent?: number;
  hpMax?: number;
}

interface CombatTrackerProps {
  members: CampaignMemberV2[];
  className?: string;
}

export const CombatTracker = memo(function CombatTracker({
  members,
  className,
}: CombatTrackerProps) {
  const [combatActive, setCombatActive] = useState(false);
  const [round, setRound] = useState(1);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [combatants, setCombatants] = useState<CombatantEntry[]>([]);

  // Inicializa combate com personagens da campanha
  const handleStartCombat = useCallback(() => {
    const entries: CombatantEntry[] = members
      .filter(m => m.characters && m.role !== 'master')
      .map(m => ({
        id: m.characters!.id,
        name: m.characters!.name,
        initiative: 0,
        photoUrl: m.characters!.photo_url,
        hpCurrent: m.characters!.hp_current,
        hpMax: m.characters!.hp_max,
      }));

    setCombatants(entries);
    setCombatActive(true);
    setRound(1);
    setCurrentTurnIndex(0);
  }, [members]);

  // Encerra combate
  const handleEndCombat = useCallback(() => {
    setCombatActive(false);
    setCombatants([]);
    setRound(1);
    setCurrentTurnIndex(0);
  }, []);

  // Próximo turno
  const handleNextTurn = useCallback(() => {
    if (combatants.length === 0) return;

    const nextIndex = currentTurnIndex + 1;
    if (nextIndex >= combatants.length) {
      // Nova rodada
      setRound(r => r + 1);
      setCurrentTurnIndex(0);
    } else {
      setCurrentTurnIndex(nextIndex);
    }
  }, [combatants.length, currentTurnIndex]);

  // Atualiza iniciativa de um combatente
  const handleInitiativeChange = useCallback((id: string, value: string) => {
    const numVal = parseInt(value) || 0;
    setCombatants(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, initiative: numVal } : c);
      // Reordena por iniciativa decrescente
      return updated.sort((a, b) => b.initiative - a.initiative);
    });
  }, []);

  // Adicionar NPC ao combate
  const [npcName, setNpcName] = useState('');
  const handleAddNPC = useCallback(() => {
    if (!npcName.trim()) return;
    setCombatants(prev => [
      ...prev,
      {
        id: `npc-${Date.now()}`,
        name: npcName.trim(),
        initiative: 0,
        isNPC: true,
      },
    ].sort((a, b) => b.initiative - a.initiative));
    setNpcName('');
  }, [npcName]);

  // Remove combatente
  const handleRemoveCombatant = useCallback((id: string) => {
    setCombatants(prev => {
      const filtered = prev.filter(c => c.id !== id);
      // Ajusta turno se necessário
      if (currentTurnIndex >= filtered.length) {
        setCurrentTurnIndex(0);
      }
      return filtered;
    });
  }, [currentTurnIndex]);

  // Estado sem combate ativo
  if (!combatActive) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <SwordIcon weight="duotone" className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-sm text-muted-foreground mb-4">Nenhum combate em andamento</p>
        <Button onClick={handleStartCombat} className="gap-2">
          <PlayIcon weight="duotone" className="h-4 w-4" />
          Iniciar Combate
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header do combate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="default" className="text-sm px-3 py-1 gap-1.5">
            <SwordIcon weight="duotone" className="h-4 w-4" />
            Rodada {round}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Turno {currentTurnIndex + 1} de {combatants.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleNextTurn}
          >
            <SkipForwardIcon weight="duotone" className="h-3.5 w-3.5" />
            Próximo
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => { setRound(1); setCurrentTurnIndex(0); }}
          >
            <ArrowCounterClockwiseIcon weight="duotone" className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleEndCombat}
          >
            <StopIcon weight="duotone" className="h-3.5 w-3.5" />
            Encerrar
          </Button>
        </div>
      </div>

      {/* Lista de combatentes */}
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-1.5">
          <AnimatePresence>
            {combatants.map((combatant, index) => {
              const isCurrent = index === currentTurnIndex;
              return (
                <motion.div
                  key={combatant.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <Card className={cn(
                    'transition-all duration-300',
                    isCurrent && 'border-primary/60 bg-primary/5 shadow-sm',
                  )}>
                    <CardContent className="p-2.5 flex items-center gap-2">
                      {/* Indicador de turno */}
                      <div className={cn(
                        'w-1.5 h-8 rounded-full shrink-0 transition-colors',
                        isCurrent ? 'bg-primary' : 'bg-border',
                      )} />

                      {/* Avatar */}
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={combatant.photoUrl || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {combatant.isNPC ? 'NPC' : combatant.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Nome */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-xs font-medium truncate',
                          isCurrent && 'text-primary font-semibold',
                        )}>
                          {combatant.name}
                          {combatant.isNPC && (
                            <span className="text-[10px] text-muted-foreground ml-1">(NPC)</span>
                          )}
                        </p>
                        {combatant.hpCurrent !== undefined && (
                          <p className="text-[10px] text-muted-foreground">
                            PV {combatant.hpCurrent}/{combatant.hpMax}
                          </p>
                        )}
                      </div>

                      {/* Input de iniciativa */}
                      <Input
                        type="number"
                        value={combatant.initiative || ''}
                        onChange={(e) => handleInitiativeChange(combatant.id, e.target.value)}
                        className="h-7 w-14 text-xs text-center"
                        placeholder="INI"
                        title="Iniciativa"
                      />

                      {/* Remover */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveCombatant(combatant.id)}
                        title="Remover do combate"
                      >
                        ×
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Adicionar NPC */}
      <div className="flex items-center gap-2">
        <Input
          value={npcName}
          onChange={(e) => setNpcName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddNPC()}
          placeholder="Nome do NPC..."
          className="h-8 text-xs"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs shrink-0"
          onClick={handleAddNPC}
          disabled={!npcName.trim()}
        >
          + NPC
        </Button>
      </div>
    </div>
  );
});

export default CombatTracker;
