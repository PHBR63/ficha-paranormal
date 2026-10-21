/**
 * MasterTab - Aba do mestre da campanha v3 (completa)
 * 
 * Sub-abas: Fichas | Combate | NPCs | Áudio | Handouts | Macros | Bônus
 * 
 * @module components/campaign/v3/tabs/MasterTab
 */

import { memo, useState, useCallback } from 'react';
import { 
  Users, 
  Swords,
  Volume2,
  FileText,
  Terminal,
  Gift,
} from '@/components/icons/ordem-icons';
import {
  Sword as SwordIcon,
} from '@phosphor-icons/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { PlayerControlCard } from '@/components/campaign/v3/master/PlayerControlCard';
import { MasterQuickActions } from '@/components/campaign/v3/master/MasterQuickActions';
import { CombatTracker } from '@/components/campaign/v3/master/CombatTracker';
import { BulkDamageModal } from '@/components/campaign/v3/master/BulkDamageModal';
import { applyDamagePerCharacter } from '@/lib/campaign-bulk-damage';
import { AudioControlPanel } from '@/components/campaign/v3/master/AudioControlPanel';
import { NPCManager } from '@/components/campaign/master';
import { MacrosPanel } from '@/components/campaign/chat';
import { HandoutsManager } from '@/components/campaign/master/HandoutsManager';
import { MemberBonusesPanel } from '@/components/campaign/MemberBonusesPanel';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import type { CampaignCombatController } from '@/hooks/campaign/useCampaignCombat';
import type { SoundScene, CampaignAudio, AudioState } from '@/hooks/campaign/useCampaignAudio';

type MasterSubTab = 'players' | 'combat' | 'npcs' | 'audio' | 'handouts' | 'macros' | 'bonuses';

interface MasterTabProps {
  members: CampaignMemberV2[];
  campaignId: string;
  combat: CampaignCombatController;
  combatAvailable: boolean;
  onModifyHP?: (characterId: string, delta: number) => Promise<boolean>;
  onModifySAN?: (characterId: string, delta: number) => Promise<boolean>;
  onModifyPE?: (characterId: string, delta: number) => Promise<boolean>;
  onApplyCondition?: (characterId: string, conditionName: string) => Promise<boolean>;
  onRemoveCondition?: (characterId: string, conditionName: string) => Promise<boolean>;
  onRestFull?: (characterId: string) => Promise<boolean>;
  onGroupRest?: () => Promise<void>;
  onClearAllConditions?: () => Promise<void>;
  onSendMessage?: (content: string, type?: string, metadata?: Record<string, unknown>) => void;
  isUpdating?: boolean;
  // Áudio
  audioLibrary?: CampaignAudio[];
  soundScenes?: SoundScene[];
  audioState?: AudioState | null;
  audioLoading?: boolean;
  onActivateScene?: (sceneId: string) => Promise<void>;
  onPlaySFX?: (sfxId: string) => void;
  onStopAllAudio?: () => void;
  onSetMasterVolume?: (volume: number) => void;
  onToggleMute?: () => void;
  className?: string;
}

export const MasterTab = memo(function MasterTab({
  members,
  campaignId,
  combat,
  combatAvailable,
  onModifyHP,
  onModifySAN,
  onModifyPE,
  onApplyCondition,
  onRemoveCondition,
  onRestFull,
  onGroupRest,
  onClearAllConditions,
  onSendMessage,
  isUpdating,
  audioLibrary = [],
  soundScenes = [],
  audioState,
  audioLoading,
  onActivateScene,
  onPlaySFX,
  onStopAllAudio,
  onSetMasterVolume,
  onToggleMute,
  className,
}: MasterTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<MasterSubTab>('players');
  const [bulkDamageOpen, setBulkDamageOpen] = useState(false);
  
  // O papel do membro não invalida uma ficha vinculada. O servidor continua
  // conferindo a autorização do mestre em cada ajuste individual.
  const membersWithCharacter = members.filter(m => m.characters);

  // O mesmo contrato de confirmação é usado no painel principal e no mapa.
  const handleBulkDamage = useCallback((characterIds: string[], damage: number) =>
    applyDamagePerCharacter(characterIds, damage, onModifyHP), [onModifyHP]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Barra de ações rápidas (topo fixo) */}
      <MasterQuickActions
        members={members}
        onSendMessage={onSendMessage}
        onGroupRest={onGroupRest}
        onClearAllConditions={onClearAllConditions}
        onOpenBulkDamage={() => setBulkDamageOpen(true)}
        isUpdating={isUpdating}
      />

      {/* Sub-abas */}
      <Tabs 
        value={activeSubTab} 
        onValueChange={(v) => setActiveSubTab(v as MasterSubTab)}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="shrink-0 px-4 pt-2 pb-1 border-b border-border/30 overflow-x-auto">
          <TabsList className="bg-transparent h-9">
            <TabsTrigger value="players" className="gap-1.5 text-xs">
              <Swords className="h-3.5 w-3.5" />
              Fichas
            </TabsTrigger>
            <TabsTrigger value="combat" className="gap-1.5 text-xs">
              <SwordIcon weight="duotone" className="h-3.5 w-3.5" />
              Combate
            </TabsTrigger>
            <TabsTrigger value="npcs" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              NPCs
            </TabsTrigger>
            <TabsTrigger value="audio" className="gap-1.5 text-xs">
              <Volume2 className="h-3.5 w-3.5" />
              Áudio
            </TabsTrigger>
            <TabsTrigger value="handouts" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" />
              Handouts
            </TabsTrigger>
            <TabsTrigger value="macros" className="gap-1.5 text-xs">
              <Terminal className="h-3.5 w-3.5" />
              Macros
            </TabsTrigger>
            <TabsTrigger value="bonuses" className="gap-1.5 text-xs">
              <Gift className="h-3.5 w-3.5" />
              Bônus
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Fichas vinculadas */}
        <TabsContent value="players" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {membersWithCharacter.map((member) => (
                  <PlayerControlCard
                    key={member.id}
                    member={member}
                    onModifyHP={onModifyHP}
                    onModifySAN={onModifySAN}
                    onModifyPE={onModifyPE}
                    onApplyCondition={onApplyCondition}
                    onRemoveCondition={onRemoveCondition}
                    onRestFull={onRestFull}
                    isUpdating={isUpdating}
                  />
                ))}
              </div>

              {membersWithCharacter.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhuma ficha vinculada à campanha</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Combate */}
        <TabsContent value="combat" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              {combatAvailable ? <CombatTracker campaignId={campaignId} members={members} combat={combat} /> : <p>O combate compartilhado está disponível para campanhas da versão atual.</p>}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* NPCs (Fase 4 - componente funcional existente) */}
        <TabsContent value="npcs" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <NPCManager campaignId={campaignId} />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Áudio (Fase 3 - conectado ao hook) */}
        <TabsContent value="audio" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <AudioControlPanel
                audioLibrary={audioLibrary}
                soundScenes={soundScenes}
                audioState={audioState ?? null}
                isLoading={audioLoading}
                onActivateScene={onActivateScene}
                onPlaySFX={onPlaySFX}
                onStopAll={onStopAllAudio}
                onSetMasterVolume={onSetMasterVolume}
                onToggleMute={onToggleMute}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Handouts do Mestre (Fase 5) */}
        <TabsContent value="handouts" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <HandoutsManager campaignId={campaignId} members={members as any} />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Macros (Fase 5) */}
        <TabsContent value="macros" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <MacrosPanel campaignId={campaignId} />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Bônus (Fase 5) */}
        <TabsContent value="bonuses" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <MemberBonusesPanel campaignId={campaignId} />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Modal de dano em área */}
      <BulkDamageModal
        open={bulkDamageOpen}
        onOpenChange={setBulkDamageOpen}
        members={members}
        onApplyDamage={handleBulkDamage}
        canApply={!!onModifyHP}
        serverCampaignId={combatAvailable ? campaignId : undefined}
        isUpdating={isUpdating}
      />
    </div>
  );
});

export default MasterTab;
