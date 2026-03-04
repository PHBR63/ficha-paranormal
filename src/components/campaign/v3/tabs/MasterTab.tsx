/**
 * MasterTab - Aba do mestre da campanha v3 (redesign completo)
 * 
 * Estrutura:
 * - Barra de ações rápidas (topo fixo)
 * - Sub-abas: Jogadores | Combate | NPCs | Áudio
 * - Cards expandidos com barras de progresso e condições
 * 
 * @module components/campaign/v3/tabs/MasterTab
 */

import { memo, useState, useCallback } from 'react';
import { 
  Users, 
  Swords,
  Volume2,
} from 'lucide-react';
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
import { AudioControlPanel } from '@/components/campaign/v3/master/AudioControlPanel';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import type { SoundScene, CampaignAudio, AudioState } from '@/hooks/campaign/useCampaignAudio';

type MasterSubTab = 'players' | 'combat' | 'npcs' | 'audio';

interface MasterTabProps {
  /** Membros da campanha */
  members: CampaignMemberV2[];
  /** Callback para modificar HP */
  onModifyHP?: (characterId: string, delta: number) => Promise<boolean>;
  /** Callback para modificar SAN */
  onModifySAN?: (characterId: string, delta: number) => Promise<boolean>;
  /** Callback para modificar PE */
  onModifyPE?: (characterId: string, delta: number) => Promise<boolean>;
  /** Callback para aplicar condição */
  onApplyCondition?: (characterId: string, conditionName: string) => Promise<boolean>;
  /** Callback para remover condição */
  onRemoveCondition?: (characterId: string, conditionName: string) => Promise<boolean>;
  /** Callback para descanso completo individual */
  onRestFull?: (characterId: string) => Promise<boolean>;
  /** Callback para descanso do grupo */
  onGroupRest?: () => Promise<void>;
  /** Callback para limpar condições de todos */
  onClearAllConditions?: () => Promise<void>;
  /** Callback para dano em área */
  onBulkDamage?: (characterIds: string[], damage: number) => Promise<void>;
  /** Envia mensagem no chat */
  onSendMessage?: (content: string, type?: string, metadata?: Record<string, unknown>) => void;
  /** Se está processando */
  isUpdating?: boolean;
  /** Dados de áudio */
  audioLibrary?: CampaignAudio[];
  soundScenes?: SoundScene[];
  audioState?: AudioState | null;
  audioLoading?: boolean;
  onActivateScene?: (sceneId: string) => Promise<void>;
  onPlaySFX?: (sfxId: string) => void;
  onStopAllAudio?: () => void;
  onSetMasterVolume?: (volume: number) => void;
  onToggleMute?: () => void;
  /** Classe CSS adicional */
  className?: string;
}

export const MasterTab = memo(function MasterTab({
  members,
  onModifyHP,
  onModifySAN,
  onModifyPE,
  onApplyCondition,
  onRemoveCondition,
  onRestFull,
  onGroupRest,
  onClearAllConditions,
  onBulkDamage,
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
  
  // Filtra jogadores com personagem
  const playersWithCharacter = members.filter(m => m.characters && m.role !== 'master');

  // Handler para dano em área
  const handleBulkDamage = useCallback(async (characterIds: string[], damage: number) => {
    if (onBulkDamage) {
      await onBulkDamage(characterIds, damage);
    } else if (onModifyHP) {
      // Fallback: aplica dano individualmente
      for (const charId of characterIds) {
        await onModifyHP(charId, -damage);
      }
    }
  }, [onBulkDamage, onModifyHP]);

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
        <div className="shrink-0 px-4 pt-2 pb-1 border-b border-border/30">
          <TabsList className="bg-transparent h-9">
            <TabsTrigger value="players" className="gap-1.5 text-xs">
              <Swords className="h-3.5 w-3.5" />
              Jogadores
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
          </TabsList>
        </div>

        {/* Jogadores */}
        <TabsContent value="players" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {playersWithCharacter.map((member) => (
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

              {playersWithCharacter.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhum jogador com personagem</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Combate */}
        <TabsContent value="combat" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <CombatTracker members={members} />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* NPCs */}
        <TabsContent value="npcs" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Sistema de NPCs em desenvolvimento</p>
                <p className="text-xs mt-1">Em breve você poderá gerenciar NPCs da campanha</p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Áudio */}
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
      </Tabs>

      {/* Modal de dano em área */}
      <BulkDamageModal
        open={bulkDamageOpen}
        onOpenChange={setBulkDamageOpen}
        members={members}
        onApplyDamage={handleBulkDamage}
        isUpdating={isUpdating}
      />
    </div>
  );
});

export default MasterTab;
