/**
 * CampaignShell - Container principal da campanha v3
 * 
 * Estrutura minimalista:
 * - Header compacto (48px)
 * - Navegação consolidada (4-5 abas)
 * - Conteúdo central (expande para preencher)
 * - StatusBar inferior (56px)
 * 
 * Usa Singleton Pattern para hooks de dados
 * 
 * @module pages/CampaignShell
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCampaignData } from '@/hooks/campaign/useCampaignData';
import { useCampaignRealtime } from '@/hooks/campaign/useCampaignRealtime';
import { useCampaignPresence } from '@/hooks/campaign/useCampaignPresence';
import { useTacticalBoard } from '@/hooks/campaign/useTacticalBoard';
import { useMasterActions } from '@/hooks/campaign/useMasterActions';
import { useCampaignAudio } from '@/hooks/campaign/useCampaignAudio';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CampaignHeader,
  CampaignNavigation,
  CampaignStatusBar,
  PanelTab,
  ChatTab,
  MapTab,
  MapListTab,
  ResourcesTab,
  MasterTab,
  type CampaignTab,
} from '@/components/campaign/v3';
import { 
  DiceRollModal, 
  CampaignSettingsModal,
  QuickNotesModal,
  type DiceRollMetadata,
} from '@/components/campaign/v3/modals';

export default function CampaignShell() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  // Estado local
  const [activeTab, setActiveTab] = useState<CampaignTab>('panel');
  const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickNotesOpen, setIsQuickNotesOpen] = useState(false);

  // =====================================================
  // HOOKS DE DADOS (Singleton Pattern)
  // =====================================================

  const campaignData = useCampaignData({
    campaignId: campaignId || '',
    userId: userId || '',
  });

  const { campaign, members, isMaster, loading: campaignLoading } = campaignData;

  // Chat e sessões em tempo real
  const realtimeData = useCampaignRealtime({
    campaignId: campaignId || '',
    userId: userId || '',
    enabled: !!campaignId && !!userId && !campaignLoading,
  });

  const { 
    messages, 
    activeSession, 
    unreadCount, 
    isConnected, 
    sendMessage,
    startSession,
    endSession,
    markAsRead,
  } = realtimeData;

  // Presença
  const currentMember = useMemo(() => 
    members.find(m => m.user_id === userId),
    [members, userId]
  );

  const presenceData = useCampaignPresence({
    campaignId: campaignId || '',
    userId: userId || '',
    userName: currentMember?.profiles?.display_name || undefined,
    userAvatar: currentMember?.profiles?.avatar_url || undefined,
    enabled: !!campaignId && !!userId && !campaignLoading,
  });

  const { presenceMap, onlineUsers } = presenceData;

  // Tabuleiro tático
  const tacticalBoard = useTacticalBoard({
    campaignId: campaignId || '',
    isMaster,
    enabled: !!campaignId && !campaignLoading,
  });

  // Ações do mestre
  const masterActions = useMasterActions({
    campaignId: campaignId || '',
    isMaster,
  });

  // Áudio da campanha (Fase 3)
  const audioData = useCampaignAudio(campaignId || '', isMaster);

  // =====================================================
  // CALLBACKS
  // =====================================================

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleOpenDice = useCallback(() => {
    setIsDiceModalOpen(true);
  }, []);

  const handleOpenNotes = useCallback(() => {
    setIsQuickNotesOpen(true);
  }, []);

  const handleStartSession = useCallback(async () => {
    await startSession();
  }, [startSession]);

  const handleEndSession = useCallback(async () => {
    if (activeSession) {
      await endSession(activeSession.id);
    }
  }, [endSession, activeSession]);

  const handleDiceRoll = useCallback((
    description: string, 
    metadata: DiceRollMetadata, 
    isHidden: boolean
  ) => {
    if (isHidden) {
      sendMessage(description, 'dice_roll', { ...metadata, hidden: true } as Record<string, unknown>);
    } else {
      sendMessage(description, 'dice_roll', metadata as unknown as Record<string, unknown>);
    }
  }, [sendMessage]);

  // Marca como lidas ao entrar no chat
  useEffect(() => {
    if (activeTab === 'chat') {
      markAsRead();
    }
  }, [activeTab, markAsRead]);

  // =====================================================
  // EARLY RETURNS
  // =====================================================

  if (!campaignId || !userId) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Campanha não encontrada</p>
      </div>
    );
  }

  if (campaignLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="h-12 border-b border-border/50 px-4 flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-5 w-48" />
          <div className="flex-1" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="h-11 border-b border-border/50 flex items-center justify-center gap-4 px-4">
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
        </div>
        <div className="flex-1 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-40 rounded-lg" />
          </div>
        </div>
        <div className="h-14 border-t border-border/50 px-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="flex-1" />
          <Skeleton className="h-8 w-24 rounded" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Campanha não encontrada</p>
          <button 
            onClick={() => navigate('/campaigns')}
            className="text-primary hover:underline"
          >
            Voltar para campanhas
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header compacto */}
      <CampaignHeader
        campaignName={campaign.name}
        currentSession={activeSession?.session_number}
        hasActiveSession={!!activeSession}
        onlineCount={onlineUsers.length}
        isConnected={isConnected}
        isMaster={isMaster}
        onOpenSettings={isMaster ? handleOpenSettings : undefined}
      />

      {/* Navegação consolidada */}
      <CampaignNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMaster={isMaster}
        unreadCount={unreadCount}
      />

      {/* Conteúdo principal */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'panel' && (
          <PanelTab
            members={members}
            activeSession={activeSession}
            presenceMap={presenceMap}
          />
        )}

        {activeTab === 'chat' && (
          <ChatTab
            messages={messages}
            currentUserId={userId}
            masterId={campaign.master_id}
            isMaster={isMaster}
            onSendMessage={sendMessage}
            onApplyDamage={isMaster ? async (charId, amount, charName) => {
              const success = await masterActions.adjustHP(charId, amount);
              if (success) {
                await sendMessage(
                  `**${charName}** recebeu ${amount > 0 ? '+' : ''}${amount} PV`,
                  'system'
                );
              }
              return success;
            } : undefined}
            onMarkAsRead={markAsRead}
          />
        )}

        {activeTab === 'map' && campaignId && (
          <MapListTab
            campaignId={campaignId}
            maps={tacticalBoard.maps}
            activeMap={tacticalBoard.activeMap}
            isMaster={isMaster}
            onCreateMap={tacticalBoard.createMap}
            onUploadMapImage={tacticalBoard.uploadMapImage}
            onSetActiveMap={tacticalBoard.setActiveMap}
          />
        )}

        {activeTab === 'resources' && (
          <ResourcesTab
            campaignId={campaignId}
            isMaster={isMaster}
          />
        )}

        {activeTab === 'master' && isMaster && (
          <MasterTab
            members={members}
            campaignId={campaignId}
            onModifyHP={async (charId, delta) => {
              const member = members.find(m => m.characters?.id === charId);
              const charName = member?.characters?.name || 'Personagem';
              const success = await masterActions.adjustHP(charId, delta);
              if (success) {
                await sendMessage(
                  delta < 0
                    ? `💀 **${charName}** recebeu **${Math.abs(delta)}** de dano`
                    : `💚 **${charName}** recuperou **${delta}** PV`,
                  delta < 0 ? 'event_damage' : 'event_heal',
                  { amount: Math.abs(delta), targetName: charName, characterId: charId }
                );
              }
              return success;
            }}
            onModifySAN={masterActions.adjustSAN}
            onModifyPE={masterActions.adjustPE}
            onApplyCondition={masterActions.applyCondition}
            onRemoveCondition={masterActions.removeCondition}
            onRestFull={async (charId) => {
              const r1 = await masterActions.setHP(charId, 9999);
              const r2 = await masterActions.setPE(charId, 9999);
              return r1 && r2;
            }}
            onGroupRest={async () => {
              const players = members.filter(m => m.characters && m.role !== 'master');
              for (const p of players) {
                if (p.characters) {
                  await masterActions.setHP(p.characters.id, 9999);
                  await masterActions.setPE(p.characters.id, 9999);
                }
              }
            }}
            onClearAllConditions={async () => {
              const players = members.filter(m => m.characters && m.role !== 'master');
              for (const p of players) {
                if (p.characters) {
                  await masterActions.clearAllConditions(p.characters.id);
                }
              }
            }}
            onSendMessage={sendMessage}
            isUpdating={masterActions.isUpdating}
            // Áudio (Fase 3)
            audioLibrary={audioData.audioLibrary}
            soundScenes={audioData.soundScenes}
            audioState={audioData.audioState}
            audioLoading={audioData.isLoading}
            onActivateScene={audioData.activateScene}
            onPlaySFX={audioData.playSFX}
            onStopAllAudio={audioData.stopAllAudio}
            onSetMasterVolume={audioData.setMasterVolume}
            onToggleMute={audioData.toggleMute}
          />
        )}
      </main>

      {/* Barra de status inferior */}
      <CampaignStatusBar
        members={members}
        presenceMap={presenceMap}
        isMaster={isMaster}
        hasActiveSession={!!activeSession}
        onOpenDice={handleOpenDice}
        onOpenNotes={handleOpenNotes}
        onStartSession={isMaster ? handleStartSession : undefined}
        onEndSession={isMaster ? handleEndSession : undefined}
      />

      {/* Modal de rolagem de dados */}
      <DiceRollModal
        open={isDiceModalOpen}
        onOpenChange={setIsDiceModalOpen}
        isMaster={isMaster}
        onRoll={handleDiceRoll}
      />

      {/* Modal de configurações (Fase 1) */}
      {isMaster && (
        <CampaignSettingsModal
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          campaignId={campaignId}
          campaignName={campaign.name}
          campaignDescription={campaign.description}
          members={members}
          onMemberUpdate={campaignData.refetch}
        />
      )}

      {/* Modal de notas rápidas (Fase 1) */}
      <QuickNotesModal
        open={isQuickNotesOpen}
        onOpenChange={setIsQuickNotesOpen}
        campaignId={campaignId}
      />
    </div>
  );
}
