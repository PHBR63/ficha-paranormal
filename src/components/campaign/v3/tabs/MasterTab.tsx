/**
 * MasterTab - Aba exclusiva do mestre da campanha v3
 * 
 * Ferramentas do GM:
 * - Controle de NPCs
 * - Macros rápidas
 * - Controle de áudio
 * - Gerenciamento de bônus
 * - Ações em personagens
 * 
 * @module components/campaign/v3/tabs/MasterTab
 */

import { memo, useState, useCallback } from 'react';
import { 
  Users, 
  Zap, 
  Volume2, 
  Swords,
  Heart,
  Brain,
  Minus,
  Plus,
  RefreshCw
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ConditionSelector } from '@/components/campaign/v3/master/ConditionSelector';
import { AudioControlPanel } from '@/components/campaign/v3/master/AudioControlPanel';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import type { SoundScene, CampaignAudio, AudioState } from '@/hooks/campaign/useCampaignAudio';

type MasterSubTab = 'npcs' | 'macros' | 'audio' | 'players';

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

// Card de controle rápido de personagem
const PlayerControlCard = memo(function PlayerControlCard({
  member,
  onModifyHP,
  onModifySAN,
  onModifyPE,
  onApplyCondition,
  onRemoveCondition,
  isUpdating,
}: {
  member: CampaignMemberV2;
  onModifyHP?: (characterId: string, delta: number) => Promise<boolean>;
  onModifySAN?: (characterId: string, delta: number) => Promise<boolean>;
  onModifyPE?: (characterId: string, delta: number) => Promise<boolean>;
  onApplyCondition?: (characterId: string, conditionName: string) => Promise<boolean>;
  onRemoveCondition?: (characterId: string, conditionName: string) => Promise<boolean>;
  isUpdating?: boolean;
}) {
  const character = member.characters;
  
  // Handlers memoizados para condições - ANTES do early return
  const characterId = character?.id || '';
  
  const handleApplyCondition = useCallback((conditionId: string) => {
    if (characterId) {
      onApplyCondition?.(characterId, conditionId);
    }
  }, [characterId, onApplyCondition]);

  const handleRemoveCondition = useCallback((conditionId: string) => {
    if (characterId) {
      onRemoveCondition?.(characterId, conditionId);
    }
  }, [characterId, onRemoveCondition]);

  // Early return após hooks
  if (!character) return null;

  const displayName = character.name;
  const avatarUrl = character.photo_url;
  const initials = displayName.substring(0, 2).toUpperCase();
  
  // Condições ativas (array de strings)
  const activeConditions = character.conditions || [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">
              {displayName}
            </CardTitle>
            <CardDescription className="text-xs">
              {character.class} • NEX {character.nex}%
            </CardDescription>
          </div>
          {/* Seletor de condições */}
          <ConditionSelector
            activeConditions={activeConditions}
            onApply={handleApplyCondition}
            onRemove={handleRemoveCondition}
            isLoading={isUpdating}
          />
        </div>
      </CardHeader>
      
      <CardContent className="px-3 pb-3 space-y-2">
        {/* Controle de HP */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <Heart className="h-3.5 w-3.5 text-destructive" />
            <span className="font-medium">
              {character.hp_current}/{character.hp_max}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() => onModifyHP?.(character.id, -5)}
              disabled={isUpdating}
              title="-5 PV"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() => onModifyHP?.(character.id, 5)}
              disabled={isUpdating}
              title="+5 PV"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Controle de SAN */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <Brain className="h-3.5 w-3.5 text-purple-500" />
            <span className="font-medium">
              {character.san_current}/{character.san_max}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() => onModifySAN?.(character.id, -1)}
              disabled={isUpdating}
              title="-1 SAN"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() => onModifySAN?.(character.id, 1)}
              disabled={isUpdating}
              title="+1 SAN"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Controle de PE */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">
              {character.pe_current}/{character.pe_max}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() => onModifyPE?.(character.id, -1)}
              disabled={isUpdating}
              title="-1 PE"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() => onModifyPE?.(character.id, 1)}
              disabled={isUpdating}
              title="+1 PE"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export const MasterTab = memo(function MasterTab({
  members,
  onModifyHP,
  onModifySAN,
  onModifyPE,
  onApplyCondition,
  onRemoveCondition,
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
  
  // Filtra membros com personagem (exclui mestre sem char)
  const playersWithCharacter = members.filter(m => m.characters && m.role !== 'master');

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Tabs 
        value={activeSubTab} 
        onValueChange={(v) => setActiveSubTab(v as MasterSubTab)}
        className="flex flex-col h-full"
      >
        <div className="shrink-0 px-4 pt-3 pb-2 border-b border-border/30">
          <TabsList className="bg-transparent h-9">
            <TabsTrigger value="players" className="gap-1.5 text-xs">
              <Swords className="h-3.5 w-3.5" />
              Jogadores
            </TabsTrigger>
            <TabsTrigger value="npcs" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              NPCs
            </TabsTrigger>
            <TabsTrigger value="macros" className="gap-1.5 text-xs">
              <Zap className="h-3.5 w-3.5" />
              Macros
            </TabsTrigger>
            <TabsTrigger value="audio" className="gap-1.5 text-xs">
              <Volume2 className="h-3.5 w-3.5" />
              Áudio
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Controle de jogadores */}
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

        {/* Macros */}
        <TabsContent value="macros" className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Sistema de macros em desenvolvimento</p>
                <p className="text-xs mt-1">Em breve você poderá criar ações rápidas</p>
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
    </div>
  );
});

export default MasterTab;
