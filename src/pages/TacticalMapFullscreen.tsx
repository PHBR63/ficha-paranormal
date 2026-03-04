/**
 * TacticalMapFullscreen - Página standalone do mapa tático em tela cheia
 * 
 * Abre em nova aba via /map/:campaignId, reutilizando os mesmos hooks e
 * componentes do mapa inline. 100% do viewport dedicado ao canvas.
 * 
 * @module pages/TacticalMapFullscreen
 */

import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCampaignData } from '@/hooks/campaign/useCampaignData';
import { useTacticalBoard } from '@/hooks/campaign/useTacticalBoard';
import { MapTab } from '@/components/campaign/v3/tabs/MapTab';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TacticalMapFullscreen() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;

  // Dados da campanha (para validar permissões)
  const campaignData = useCampaignData({
    campaignId: campaignId || '',
    userId: userId || '',
  });

  const { campaign, isMaster, loading: campaignLoading } = campaignData;

  // Tabuleiro tático (instância própria desta aba)
  const tacticalBoard = useTacticalBoard({
    campaignId: campaignId || '',
    isMaster,
    enabled: !!campaignId && !campaignLoading && !!campaign,
  });

  // Título da aba do navegador
  useEffect(() => {
    if (campaign?.name) {
      document.title = `🗺️ ${campaign.name} — Mapa Tático`;
    }
    return () => {
      document.title = 'Ordem Paranormal — Ficha Digital';
    };
  }, [campaign?.name]);

  // =====================================================
  // EARLY RETURNS
  // =====================================================

  // Carregando autenticação
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

  // Não autenticado
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

  // Carregando campanha
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

  // Campanha não encontrada
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
  // RENDER — Mapa em tela cheia
  // =====================================================

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Header mínimo — nome da campanha + botão voltar */}
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
      </div>

      {/* Mapa — ocupa todo o viewport restante */}
      <div className="flex-1 min-h-0 relative">
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
      </div>
    </div>
  );
}
