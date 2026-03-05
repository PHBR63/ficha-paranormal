/**
 * TacticalMapFullscreen - Página standalone do mapa tático em tela cheia
 * 
 * Abre em nova aba via /map/:campaignId, reutilizando os mesmos hooks e
 * componentes do mapa inline. 100% do viewport dedicado ao canvas.
 * Inclui painel lateral do mestre (colapsável) com controles de jogadores.
 * 
 * @module pages/TacticalMapFullscreen
 */

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCampaignData } from '@/hooks/campaign/useCampaignData';
import { useCampaignRealtime } from '@/hooks/campaign/useCampaignRealtime';
import { useMasterActions } from '@/hooks/campaign/useMasterActions';
import { useTacticalBoard } from '@/hooks/campaign/useTacticalBoard';
import { useAreaEffects } from '@/hooks/campaign/useAreaEffects';
import { useAdvancedPings } from '@/hooks/campaign/useAdvancedPings';
import { MapTab } from '@/components/campaign/v3/tabs/MapTab';
import { MasterMapPanel } from '@/components/campaign/v3/map/MasterMapPanel';
import { MapSidePanel } from '@/components/campaign/v3/map/MapSidePanel';
import { ChatSidePanel } from '@/components/campaign/v3/map/ChatSidePanel';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, PanelRightOpen, PanelRightClose, MessageSquare } from 'lucide-react';
import type { DrawToolType } from '@/components/campaign/v3/map/MapToolbar';
import {
  Shield as ShieldIcon,
} from '@phosphor-icons/react';

export default function TacticalMapFullscreen() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;

  // Estado dos painéis laterais
  const [masterPanelOpen, setMasterPanelOpen] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [chatPanelOpen, setChatPanelOpen] = useState(false);

  // Estado local de ferramentas de desenho/texto (para sidebar)
  const [drawTool, setDrawTool] = useState<DrawToolType>('pen');
  const [drawColor, setDrawColor] = useState('#ffffff');
  const [drawStrokeWidth, setDrawStrokeWidth] = useState(3);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textFontSize, setTextFontSize] = useState(16);
  const [gridVisible, setGridVisible] = useState(true);
  const toggleGrid = useCallback(() => setGridVisible(prev => !prev), []);

  // Dados da campanha (para validar permissões e obter membros)
  const campaignData = useCampaignData({
    campaignId: campaignId || '',
    userId: userId || '',
  });

  const { campaign, members, isMaster, loading: campaignLoading } = campaignData;

  // Chat e sessões em tempo real (para enviar mensagens de sistema do mestre)
  const realtimeData = useCampaignRealtime({
    campaignId: campaignId || '',
    userId: userId || '',
    enabled: !!campaignId && !!userId && !campaignLoading && !!campaign,
  });

  const { sendMessage, messages } = realtimeData;

  // Ações do mestre (ajuste PV/PE/SAN, condições)
  const masterActions = useMasterActions({
    campaignId: campaignId || '',
    isMaster,
  });

  // Tabuleiro tático (instância própria desta aba)
  const tacticalBoard = useTacticalBoard({
    campaignId: campaignId || '',
    isMaster,
    enabled: !!campaignId && !campaignLoading && !!campaign,
  });

  // Áreas de efeito (Fase D)
  const areaEffects = useAreaEffects({
    mapId: tacticalBoard.activeMap?.id || null,
    enabled: !!campaignId && !campaignLoading && !!campaign,
  });

  // Pings avançados (Fase E)
  // Nome do usuário atual para exibir nos pings
  const currentMember = members.find(m => m.user_id === userId);
  const currentUserName = currentMember?.characters?.name || currentMember?.profiles?.display_name || 'Jogador';

  const advancedPings = useAdvancedPings({
    campaignId: campaignId || '',
    mapId: tacticalBoard.activeMap?.id || null,
    enabled: !!campaignId && !campaignLoading && !!campaign,
    currentUserName,
    currentUserId: userId,
  });

  // Toggles dos painéis
  const toggleMasterPanel = useCallback(() => {
    setMasterPanelOpen(prev => !prev);
  }, []);
  const toggleSidePanel = useCallback(() => {
    setSidePanelOpen(prev => !prev);
  }, []);
  const toggleChatPanel = useCallback(() => {
    setChatPanelOpen(prev => !prev);
  }, []);

  // Callbacks de ações em lote do mestre
  const handleGroupRest = useCallback(async () => {
    const players = members.filter(m => m.characters && m.role !== 'master');
    for (const p of players) {
      if (p.characters) {
        await masterActions.setHP(p.characters.id, 9999);
        await masterActions.setPE(p.characters.id, 9999);
      }
    }
  }, [members, masterActions]);

  const handleClearAllConditions = useCallback(async () => {
    const players = members.filter(m => m.characters && m.role !== 'master');
    for (const p of players) {
      if (p.characters) {
        await masterActions.clearAllConditions(p.characters.id);
      }
    }
  }, [members, masterActions]);

  const handleRestFull = useCallback(async (charId: string) => {
    const r1 = await masterActions.setHP(charId, 9999);
    const r2 = await masterActions.setPE(charId, 9999);
    return r1 && r2;
  }, [masterActions]);

  // Título da aba do navegador
  useEffect(() => {
    if (campaign?.name) {
      document.title = `🗺️ ${campaign.name} — Mapa Tático`;
    }
    return () => {
      document.title = 'Ordem Paranormal — Ficha Digital';
    };
  }, [campaign?.name]);

  // Contagem de jogadores com personagem
  const playerCount = members.filter(m => m.characters && m.role !== 'master').length;

  // =====================================================
  // EARLY RETURNS
  // =====================================================

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo size="lg" animate glow />
          <p className="text-muted-foreground font-display tracking-wider">VERIFICANDO ACESSO...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Você precisa estar logado para acessar o mapa.</p>
          <Button variant="outline" onClick={() => navigate('/auth')}>
            Fazer login
          </Button>
        </div>
      </div>
    );
  }

  if (campaignLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo size="lg" animate glow />
          <p className="text-muted-foreground font-display tracking-wider">CARREGANDO MAPA...</p>
        </div>
      </div>
    );
  }

  if (!campaign || !campaignId || !userId) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Campanha não encontrada</p>
          <Button variant="outline" onClick={() => navigate('/campaigns')}>
            Voltar para campanhas
          </Button>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER — Mapa em tela cheia + painel do mestre
  // =====================================================

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Header expandido — nome, jogadores, botão mestre */}
      <div className="h-10 flex items-center gap-2 px-3 bg-card/80 backdrop-blur-sm border-b border-border/30 shrink-0 z-20">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => window.close()}
          title="Fechar aba"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <span className="text-xs font-medium text-muted-foreground truncate">
          🗺️ {campaign.name}
        </span>

        {/* Indicador de jogadores + toggle chat */}
        <div className="flex items-center gap-1 ml-auto">
          {playerCount > 0 && (
            <Badge variant="outline" className="text-[10px] h-5 gap-1">
              <Users className="h-3 w-3" />
              {playerCount}
            </Badge>
          )}

          {/* Botão do chat lateral */}
          <Button
            variant={chatPanelOpen ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={toggleChatPanel}
            title={chatPanelOpen ? 'Fechar chat' : 'Abrir chat'}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>

        {/* Botão do painel do mestre (apenas para GM) */}
        {isMaster && (
          <Button
            variant={masterPanelOpen ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={toggleMasterPanel}
            title={masterPanelOpen ? 'Fechar painel do Mestre' : 'Abrir painel do Mestre'}
          >
            <ShieldIcon weight="duotone" className="h-4 w-4 text-primary" />
          </Button>
        )}

        {/* Toggle sidebar de ferramentas */}
        <Button
          variant={sidePanelOpen ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={toggleSidePanel}
          title={sidePanelOpen ? 'Fechar painel lateral' : 'Abrir painel lateral'}
        >
          {sidePanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mapa — ocupa todo o viewport restante */}
      <div className="flex-1 min-h-0 relative">
        <MapTab
          hideToolbar={true}
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
          externalGridVisible={gridVisible}
          onExternalToggleGrid={toggleGrid}
          externalDrawTool={drawTool}
          externalDrawColor={drawColor}
          externalDrawStrokeWidth={drawStrokeWidth}
          externalTextColor={textColor}
          externalTextFontSize={textFontSize}
          areas={areaEffects.areas}
          selectedAreaId={areaEffects.selectedAreaId}
          onAreaClick={areaEffects.selectArea}
          onAreaDrag={areaEffects.moveArea}
        />

        {/* Painel lateral de chat (esquerda, overlay sobre o mapa) */}
        <ChatSidePanel
          open={chatPanelOpen}
          onToggle={toggleChatPanel}
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
        />

        {/* Painel lateral do mestre (overlay sobre o mapa) */}
        {isMaster && (
          <MasterMapPanel
            open={masterPanelOpen}
            onToggle={toggleMasterPanel}
            members={members}
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
            onRestFull={handleRestFull}
            onGroupRest={handleGroupRest}
            onClearAllConditions={handleClearAllConditions}
            onSendMessage={sendMessage}
            isUpdating={masterActions.isUpdating}
          />
        )}

        {/* Sidebar lateral de ferramentas do mapa */}
        <AnimatePresence>
          <MapSidePanel
            open={sidePanelOpen}
            onToggle={toggleSidePanel}
            map={tacticalBoard.activeMap}
            tokens={tacticalBoard.tokens}
            selectedTokenId={tacticalBoard.selectedTokenId}
            members={members}
            isMaster={isMaster}
            campaignId={campaignId}
            zoom={tacticalBoard.zoom}
            onTokenSelect={tacticalBoard.selectToken}
            onTokenCreate={tacticalBoard.createToken}
            onTokenUpdate={tacticalBoard.updateToken}
            onTokenDelete={tacticalBoard.deleteToken}
            activeTool={tacticalBoard.activeTool}
            drawTool={drawTool}
            drawColor={drawColor}
            drawStrokeWidth={drawStrokeWidth}
            onToolChange={tacticalBoard.setActiveTool}
            onDrawToolChange={setDrawTool}
            onDrawColorChange={setDrawColor}
            onDrawStrokeWidthChange={setDrawStrokeWidth}
            canUndoDrawing={tacticalBoard.canUndoDrawing}
            canRedoDrawing={tacticalBoard.canRedoDrawing}
            onDrawingUndo={tacticalBoard.undoDrawing}
            onDrawingRedo={tacticalBoard.redoDrawing}
            onDrawingClearAll={tacticalBoard.clearAllDrawings}
            textColor={textColor}
            textFontSize={textFontSize}
            onTextColorChange={setTextColor}
            onTextFontSizeChange={setTextFontSize}
            onZoomChange={tacticalBoard.setZoom}
            onResetView={tacticalBoard.fitToScreen}
            onFogReveal={tacticalBoard.revealFog}
            onFogHide={tacticalBoard.hideFog}
            gridVisible={gridVisible}
            onToggleGrid={toggleGrid}
            areas={areaEffects.areas}
            selectedAreaId={areaEffects.selectedAreaId}
            onCreateArea={areaEffects.createArea}
            onUpdateArea={areaEffects.updateArea}
            onDeleteArea={areaEffects.deleteArea}
            onClearAllAreas={areaEffects.clearAllAreas}
            onSelectArea={areaEffects.selectArea}
          />
        </AnimatePresence>
      </div>
    </div>
  );
}
