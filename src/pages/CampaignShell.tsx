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
import { Skeleton } from '@/components/ui/skeleton';
import {
  CampaignHeader,
  CampaignNavigation,
  CampaignStatusBar,
  PanelTab,
  ChatTab,
  MapTab,
  ResourcesTab,
  MasterTab,
  type CampaignTab,
} from '@/components/campaign/v3';
import { DiceRollModal, type DiceRollMetadata } from '@/components/campaign/v3/modals';

export default function CampaignShell() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  // Estado local - DEVE vir antes de qualquer hook condicional
  const [activeTab, setActiveTab] = useState<CampaignTab>('panel');
  const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);

  // =====================================================
  // HOOKS DE DADOS (Singleton Pattern)
  // CRÍTICO: Todos os hooks ANTES de qualquer early return
  // =====================================================

  // Dados principais da campanha - enabled somente se tiver IDs válidos
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

  // Presença - busca dados do membro atual
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

  // Ações do mestre (ajuste HP/PE/SAN, condições)
  const masterActions = useMasterActions({
    campaignId: campaignId || '',
    isMaster,
  });

  // =====================================================
  // CALLBACKS (memoizados para estabilidade)
  // =====================================================

  // Callback para abrir configurações
  const handleOpenSettings = useCallback(() => {
    // TODO: Implementar modal de configurações
    console.log('Abrir configurações');
  }, []);

  // Callback para rolagem rápida de dados
  const handleOpenDice = useCallback(() => {
    setIsDiceModalOpen(true);
  }, []);

  // Callback para notas rápidas
  const handleOpenNotes = useCallback(() => {
    // TODO: Implementar modal de notas
    console.log('Abrir notas');
  }, []);

  // Callback para iniciar sessão
  const handleStartSession = useCallback(async () => {
    await startSession();
  }, [startSession]);

  // Callback para encerrar sessão
  const handleEndSession = useCallback(async () => {
    if (activeSession) {
      await endSession(activeSession.id);
    }
  }, [endSession, activeSession]);

  // Callback para enviar rolagem ao chat
  const handleDiceRoll = useCallback((
    description: string, 
    metadata: DiceRollMetadata, 
    isHidden: boolean
  ) => {
    if (isHidden) {
      // Rolagem oculta - só mestre vê
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
  // EARLY RETURNS (após todos os hooks)
  // =====================================================

  // Validação de parâmetros
  if (!campaignId || !userId) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Campanha não encontrada</p>
      </div>
    );
  }

  // Loading state
  if (campaignLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Header skeleton */}
        <div className="h-12 border-b border-border/50 px-4 flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-5 w-48" />
          <div className="flex-1" />
          <Skeleton className="h-5 w-20" />
        </div>

        {/* Navigation skeleton */}
        <div className="h-11 border-b border-border/50 flex items-center justify-center gap-4 px-4">
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-40 rounded-lg" />
          </div>
        </div>

        {/* StatusBar skeleton */}
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

  // Campanha não encontrada
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
            onSendMessage={sendMessage}
            onMarkAsRead={markAsRead}
          />
        )}

        {activeTab === 'map' && (
          <MapTab
            map={tacticalBoard.activeMap}
            maps={tacticalBoard.maps}
            tokens={tacticalBoard.tokens}
            pings={tacticalBoard.pings}
            highlightedCells={tacticalBoard.highlightedCells}
            selectedTokenId={tacticalBoard.selectedTokenId}
            activeTool={tacticalBoard.activeTool}
            isMaster={isMaster}
            zoom={tacticalBoard.zoom}
            panOffset={tacticalBoard.panOffset}
            measureStart={tacticalBoard.measureStart}
            measureEnd={tacticalBoard.measureEnd}
            onToolChange={tacticalBoard.setActiveTool}
            onMapChange={tacticalBoard.setActiveMap}
            onTokenSelect={tacticalBoard.selectToken}
            onTokenMove={tacticalBoard.moveToken}
            onZoomChange={tacticalBoard.setZoom}
            onResetView={tacticalBoard.fitToScreen}
            onMeasureStart={tacticalBoard.startMeasure}
            onMeasureEnd={tacticalBoard.endMeasure}
            onPing={tacticalBoard.sendPing}
            onFogReveal={tacticalBoard.revealFog}
            onFogHide={tacticalBoard.hideFog}
            calculateDistance={tacticalBoard.calculateDistance}
            drawings={tacticalBoard.drawings}
            texts={tacticalBoard.texts}
            onDrawingComplete={tacticalBoard.createDrawing}
            onDrawingDelete={tacticalBoard.deleteDrawing}
            onDrawingClearAll={tacticalBoard.clearAllDrawings}
            onDrawingUndo={tacticalBoard.undoDrawing}
            onDrawingRedo={tacticalBoard.redoDrawing}
            canUndoDrawing={tacticalBoard.canUndoDrawing}
            canRedoDrawing={tacticalBoard.canRedoDrawing}
            onTextCreate={tacticalBoard.createText}
            onTextUpdate={tacticalBoard.updateText}
            onTextDelete={tacticalBoard.deleteText}
            onCreateMap={tacticalBoard.createMap}
            onUploadMapImage={tacticalBoard.uploadMapImage}
            onSetActiveMap={tacticalBoard.setActiveMap}
            currentUserId={userId}
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
            onModifyHP={masterActions.adjustHP}
            onModifySAN={masterActions.adjustSAN}
            onModifyPE={masterActions.adjustPE}
            onApplyCondition={masterActions.applyCondition}
            onRemoveCondition={masterActions.removeCondition}
            isUpdating={masterActions.isUpdating}
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
    </div>
  );
}
