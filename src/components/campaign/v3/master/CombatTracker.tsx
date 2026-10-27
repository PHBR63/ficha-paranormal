/**
 * CombatTracker - Tracker de iniciativa e rodadas do combate
 * 
 * Lista ordenada de personagens por iniciativa, contador de rodadas,
 * indicador visual de turno atual.
 * 
 * @module components/campaign/v3/master/CombatTracker
 */

import { memo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sword as SwordIcon,
  Play as PlayIcon,
  SkipForward as SkipForwardIcon,
  ArrowCounterClockwise as ArrowCounterClockwiseIcon,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CampaignScenePanel } from '../CampaignScenePanel';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import type { CampaignCombatController } from '@/hooks/campaign/useCampaignCombat';
import { advanceCombatTurn, removeCombatant, sortCombatants, type CombatantEntry } from '@/lib/campaign-combat';
import { MedicalExtraActionGrant } from './MedicalExtraActionGrant';
import { AttackDefenseChoicePanel } from './AttackDefenseChoicePanel';
import { AttackTargetResolutionPanel } from './AttackTargetResolutionPanel';
import { MassiveDamagePanel } from './MassiveDamagePanel';
import { CounterattackPanel } from './CounterattackPanel';
import { PreparedActionPanel } from './PreparedActionPanel';

interface CombatTrackerProps {
  campaignId: string;
  members: CampaignMemberV2[];
  combat: CampaignCombatController;
  className?: string;
}

/** Valida o rascunho antes de enviar a iniciativa inteira ao servidor. */
function isValidInitiative(value: string): boolean {
  const initiative = value === '' ? 0 : Number(value);
  return Number.isInteger(initiative) && Math.abs(initiative) <= 1000;
}

export const CombatTracker = memo(function CombatTracker({
  campaignId,
  members,
  combat,
  className,
}: CombatTrackerProps) {
  const { active: combatActive, round, currentTurnIndex, combatants } = combat.state;
  const updateCombat = combat.update;
  const [initiativeDrafts, setInitiativeDrafts] = useState<Record<string, string>>({});

  // Descarta edições de participantes removidos ou de um combate encerrado em outra aba.
  useEffect(() => {
    const activeIds = new Set(combatActive ? combatants.map(entry => entry.id) : []);
    setInitiativeDrafts(previous => {
      const entries = Object.entries(previous).filter(([id]) => activeIds.has(id));
      return entries.length === Object.keys(previous).length ? previous : Object.fromEntries(entries);
    });
  }, [combatActive, combatants]);

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

    void updateCombat(() => ({ active: true, round: 1, currentTurnIndex: 0, combatants: entries }));
  }, [members, updateCombat]);

  // Próximo turno
  const handleNextTurn = useCallback(() => {
    void updateCombat(advanceCombatTurn);
  }, [updateCombat]);

  // Atualiza iniciativa de um combatente
  const handleInitiativeChange = useCallback((id: string, value: string) => {
    const numVal = value === '' ? 0 : Number(value);
    if (!isValidInitiative(value)) return;
    void updateCombat(state => sortCombatants(state, state.combatants.map(c => c.id === id ? { ...c, initiative: numVal } : c)))
      .then(saved => { if (saved) setInitiativeDrafts(previous => { const next = { ...previous }; delete next[id]; return next; }); });
  }, [updateCombat]);

  // Adicionar NPC ao combate
  const [npcName, setNpcName] = useState('');
  const handleAddNPC = useCallback(() => {
    if (!npcName.trim()) return;
    void updateCombat(state => sortCombatants(state, [
      ...state.combatants,
      {
        id: `npc-${crypto.randomUUID()}`,
        name: npcName.trim(),
        initiative: 0,
        isNPC: true,
      },
    ])).then(saved => { if (saved) setNpcName(''); });
  }, [npcName, updateCombat]);

  // Remove combatente
  const handleRemoveCombatant = useCallback((id: string) => {
    void updateCombat(state => removeCombatant(state, id));
  }, [updateCombat]);

  if (combat.loading) return <p role="status">Carregando combate...</p>;
  if (combat.error) return (
    <div role="alert" className="space-y-3">
      <CampaignScenePanel key={campaignId} campaignId={campaignId} combat={combat} isMaster />
      <p>{combat.error}</p>
      <Button onClick={() => { void combat.reload(); }}>Recarregar combate</Button>
    </div>
  );

  // Estado sem combate ativo
  if (!combatActive) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <CampaignScenePanel key={campaignId} campaignId={campaignId} combat={combat} isMaster />
        <SwordIcon weight="duotone" className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-sm text-muted-foreground mb-4">Nenhum combate em andamento</p>
        <Button disabled={combat.saving || combat.sceneEndPending} onClick={handleStartCombat} className="gap-2 mt-4">
          <PlayIcon weight="duotone" className="h-4 w-4" />
          Iniciar Combate
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4 min-w-0', className)}>
      <CampaignScenePanel key={campaignId} campaignId={campaignId} combat={combat} isMaster />
      <fieldset disabled={combat.saving || combat.sceneEndPending} className="space-y-4 min-w-0">
      <p role="status" className="text-xs text-muted-foreground">{combat.saving ? 'Salvando combate...' : combat.connected ? 'Combate sincronizado' : 'Reconectando ao combate...'}</p>
      {/* Header do combate */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Badge variant="default" className="text-sm px-3 py-1 gap-1.5">
            <SwordIcon weight="duotone" className="h-4 w-4" />
            Rodada {round}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {combatants.length ? `Turno ${currentTurnIndex + 1} de ${combatants.length}` : 'Aguardando participantes'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleNextTurn}
            disabled={combatants.length === 0 || Object.keys(initiativeDrafts).length > 0}
          >
            <SkipForwardIcon weight="duotone" className="h-3.5 w-3.5" />
            Próximo
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => { void updateCombat(state => ({ ...state, round: 1, currentTurnIndex: 0 })); }}
            aria-label="Reiniciar ordem de combate"
          >
            <ArrowCounterClockwiseIcon weight="duotone" className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {Object.values(initiativeDrafts).some(value => !isValidInitiative(value)) && (
        <p role="alert" className="text-xs text-destructive">A iniciativa deve ser um número inteiro entre -1000 e 1000.</p>
      )}

      {combatants[currentTurnIndex] && members.some(member => member.characters?.id === combatants[currentTurnIndex].id) &&
        <MedicalExtraActionGrant key={`${campaignId}:${combatants[currentTurnIndex].id}:${round}:${currentTurnIndex}`}
          campaignId={campaignId} characterId={combatants[currentTurnIndex].id}
          characterName={combatants[currentTurnIndex].name} />}

      <AttackDefenseChoicePanel key={`defense-choice:${campaignId}:${combat.sceneNumber}:${round}`}
        campaignId={campaignId} scene={combat.sceneNumber} round={round} members={members} />
      <CounterattackPanel campaignId={campaignId} />
      <AttackTargetResolutionPanel key={`target-resolution:${campaignId}:${combat.sceneNumber}:${round}`}
        campaignId={campaignId} scene={combat.sceneNumber} round={round} members={members} />
      <MassiveDamagePanel campaignId={campaignId} />
      <PreparedActionPanel key={`prepared-actions:${campaignId}:${combat.sceneNumber}:${round}`}
        campaignId={campaignId} members={members} onCombatChanged={combat.reload} />

      {/* Lista de combatentes */}
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-1.5">
          <AnimatePresence>
            {combatants.map((combatant, index) => {
              const isCurrent = index === currentTurnIndex;
              // O estado do combate guarda uma foto inicial; a ficha vinculada é a fonte atual dos PV.
              const linkedCharacter = combatant.isNPC
                ? null
                : members.find(member => member.characters?.id === combatant.id)?.characters;
              const hpCurrent = combatant.isNPC ? combatant.hpCurrent : linkedCharacter?.hp_current;
              const hpMax = combatant.isNPC ? combatant.hpMax : linkedCharacter?.hp_max;
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
                        {hpCurrent !== undefined && (
                          <p className="text-[10px] text-muted-foreground">
                            PV {hpCurrent}/{hpMax}
                          </p>
                        )}
                      </div>

                      {/* Input de iniciativa */}
                      <Input
                        type="number"
                        min={-1000}
                        max={1000}
                        step={1}
                        aria-label={`Iniciativa de ${combatant.name}`}
                        aria-invalid={!isValidInitiative(initiativeDrafts[combatant.id] ?? String(combatant.initiative))}
                        value={initiativeDrafts[combatant.id] ?? combatant.initiative}
                        onChange={(event) => setInitiativeDrafts(previous => ({ ...previous, [combatant.id]: event.target.value }))}
                        onKeyDown={(event) => { if (event.key === 'Enter') handleInitiativeChange(combatant.id, initiativeDrafts[combatant.id] ?? String(combatant.initiative)); }}
                        className="h-7 w-14 text-xs text-center"
                        placeholder="INI"
                        title="Iniciativa"
                      />
                      {initiativeDrafts[combatant.id] !== undefined && (
                        <Button size="sm" variant="outline" disabled={!isValidInitiative(initiativeDrafts[combatant.id])} onClick={() => handleInitiativeChange(combatant.id, initiativeDrafts[combatant.id])}>Salvar</Button>
                      )}

                      {/* Remover */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveCombatant(combatant.id)}
                        title="Remover do combate"
                        aria-label={`Remover ${combatant.name} do combate`}
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
          maxLength={100}
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
    </fieldset>
    </div>
  );
});

export default CombatTracker;
