/**
 * MapTab - Aba do mapa tático da campanha v3
 * 
 * Container full-screen para o tabuleiro com:
 * - Toolbar flutuante com ferramentas de desenho, texto e undo/redo
 * - ResizeObserver para altura dinâmica
 * - Integração com TacticalBoardKonva
 * 
 * @module components/campaign/v3/tabs/MapTab
 */

import { memo, useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CreateMapDialog } from './CreateMapDialog';
import { 
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  Map as MapIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import TacticalBoardKonva from '@/components/campaign/tactical/TacticalBoardKonva';
import { MapToolbar, type ToolType, type DrawToolType } from '@/components/campaign/v3/map/MapToolbar';
import type { TacticalMap, MapToken, BoardPing } from '@/hooks/campaign/useTacticalBoard';
import type { HighlightedCell } from '@/components/campaign/tactical/layers/HighlightLayer';
import type { MapDrawing } from '@/components/campaign/tactical/layers/DrawingLayer';
import type { MapText } from '@/components/campaign/tactical/layers/TextLayer';
import type { MapAreaEffect } from '@/components/campaign/tactical/layers/AreaEffectLayer';
import type { MapPin } from '@/hooks/campaign/useMapPins';

// Cores predefinidas removidas — agora ficam no MapToolbar
interface MapTabProps {
  /** Ocultar toolbar lateral esquerda (quando sidebar direita assume) */
  hideToolbar?: boolean;
  /** Mapa ativo */
  map: TacticalMap | null;
  /** Lista de mapas disponíveis */
  maps: TacticalMap[];
  /** Tokens no mapa */
  tokens: MapToken[];
  /** Pings ativos */
  pings: BoardPing[];
  /** Células destacadas */
  highlightedCells: HighlightedCell[];
  /** ID do token selecionado */
  selectedTokenId: string | null;
  /** Ferramenta ativa */
  activeTool: ToolType;
  /** Se é mestre */
  isMaster: boolean;
  /** Zoom atual */
  zoom: number;
  /** Posição do pan */
  panOffset: { x: number; y: number };
  /** Início da medição */
  measureStart: { x: number; y: number } | null;
  /** Fim da medição */
  measureEnd: { x: number; y: number } | null;
  /** Callbacks de navegação */
  onToolChange: (tool: ToolType) => void;
  onMapChange: (mapId: string) => Promise<boolean>;
  onTokenSelect: (tokenId: string | null) => void;
  onTokenMove: (tokenId: string, x: number, y: number) => Promise<boolean>;
  onTokenDoubleClick?: (token: MapToken) => void;
  onZoomChange: (zoom: number) => void;
  onResetView: () => void;
  onMeasureStart?: (x: number, y: number) => void;
  onMeasureEnd?: (x: number, y: number) => void;
  onPing?: (x: number, y: number, color?: string) => void;
  onFogReveal?: (cells: Array<{ x: number; y: number }>) => Promise<boolean>;
  onFogHide?: (cells: Array<{ x: number; y: number }>) => Promise<boolean>;
  calculateDistance: (x1: number, y1: number, x2: number, y2: number) => number;
  /** Desenhos no mapa */
  drawings?: MapDrawing[];
  /** Textos no mapa */
  texts?: MapText[];
  /** Callbacks de desenho */
  onDrawingComplete?: (drawing: Omit<MapDrawing, 'id' | 'map_id' | 'created_by' | 'created_at'>) => void;
  onDrawingDelete?: (drawingId: string) => void;
  onDrawingClearAll?: () => void;
  onDrawingUndo?: () => void;
  onDrawingRedo?: () => void;
  canUndoDrawing?: boolean;
  canRedoDrawing?: boolean;
  /** Callbacks de texto */
  onTextCreate?: (text: Omit<MapText, 'id' | 'map_id' | 'created_by' | 'created_at'>) => void;
  onTextUpdate?: (textId: string, data: Partial<MapText>) => void;
  onTextDelete?: (textId: string) => void;
  /** Callbacks de criação de mapa (mestre) */
  onCreateMap?: (data: Partial<TacticalMap>) => Promise<TacticalMap | null>;
  onUploadMapImage?: (mapId: string, file: File) => Promise<string | null>;
  onSetActiveMap?: (mapId: string) => Promise<boolean>;
  /** ID do usuário atual */
  currentUserId?: string;
  /** Grid visível (controlado externamente) */
  externalGridVisible?: boolean;
  onExternalToggleGrid?: () => void;
  /** Estados de desenho/texto controlados externamente (ex: sidebar fullscreen) */
  externalDrawTool?: 'pen' | 'line' | 'rect' | 'circle' | 'eraser';
  externalDrawColor?: string;
  externalDrawStrokeWidth?: number;
  externalTextColor?: string;
  externalTextFontSize?: number;
  /** Áreas de efeito */
  areas?: MapAreaEffect[];
  selectedAreaId?: string | null;
  onAreaClick?: (areaId: string) => void;
  onAreaDrag?: (areaId: string, newX: number, newY: number) => void;
  /** Pins no mapa (Fase F) */
  pins?: MapPin[];
  selectedPinId?: string | null;
  onPinClick?: (pinId: string) => void;
  onPinDrag?: (pinId: string, newX: number, newY: number) => void;
  /** Duplo-clique em célula (para criar pin) */
  onCellDoubleClick?: (x: number, y: number) => void;
  /** Sincronização de câmera (Fase E) — célula para centralizar */
  cameraSyncTarget?: { x: number; y: number } | null;
  onCameraSyncHandled?: () => void;
  /** Classe CSS adicional */
  className?: string;
}

// Ferramentas movidas para MapToolbar

export const MapTab = memo(function MapTab({
  hideToolbar = false,
  map,
  maps,
  tokens,
  pings,
  highlightedCells,
  selectedTokenId,
  activeTool,
  isMaster,
  zoom,
  measureStart,
  measureEnd,
  onToolChange,
  onMapChange,
  onTokenSelect,
  onTokenMove,
  onTokenDoubleClick,
  onZoomChange,
  onResetView,
  onMeasureStart,
  onMeasureEnd,
  onPing,
  onFogReveal,
  onFogHide,
  calculateDistance,
  drawings = [],
  texts = [],
  onDrawingComplete,
  onDrawingDelete,
  onDrawingClearAll,
  onDrawingUndo,
  onDrawingRedo,
  canUndoDrawing = false,
  canRedoDrawing = false,
  onTextCreate,
  onTextUpdate,
  onTextDelete,
  onCreateMap,
  onUploadMapImage,
  onSetActiveMap,
  currentUserId,
  externalGridVisible,
  onExternalToggleGrid,
  externalDrawTool,
  externalDrawColor,
  externalDrawStrokeWidth,
  externalTextColor,
  externalTextFontSize,
  areas = [],
  selectedAreaId,
  onAreaClick,
  onAreaDrag,
  pins = [],
  selectedPinId,
  onPinClick,
  onPinDrag,
  onCellDoubleClick,
  cameraSyncTarget,
  onCameraSyncHandled,
  className,
}: MapTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  // Estado local para ferramentas de desenho (usa externo se disponível)
  const [localDrawTool, setLocalDrawTool] = useState<'pen' | 'line' | 'rect' | 'circle' | 'eraser'>('pen');
  const [localDrawColor, setLocalDrawColor] = useState('#ffffff');
  const [localDrawStrokeWidth, setLocalDrawStrokeWidth] = useState(3);
  const [localTextFontSize, setLocalTextFontSize] = useState(16);
  const [localTextColor, setLocalTextColor] = useState('#ffffff');

  // Resolve: externo tem prioridade sobre local
  const drawTool = externalDrawTool ?? localDrawTool;
  const drawColor = externalDrawColor ?? localDrawColor;
  const drawStrokeWidth = externalDrawStrokeWidth ?? localDrawStrokeWidth;
  const textFontSize = externalTextFontSize ?? localTextFontSize;
  const textColor = externalTextColor ?? localTextColor;

  // ResizeObserver para dimensões dinâmicas
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        requestAnimationFrame(() => {
          setCanvasSize({ 
            width: Math.floor(width), 
            height: Math.floor(height) 
          });
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Estado de visibilidade do grid (usa externo se disponível, senão local)
  const [localGridVisible, setLocalGridVisible] = useState(true);
  const gridVisible = externalGridVisible !== undefined ? externalGridVisible : localGridVisible;
  const handleToggleGrid = onExternalToggleGrid || (() => setLocalGridVisible(prev => !prev));

  return (
    <div className={cn('relative w-full h-full overflow-hidden', className)}>
      {/* Container do canvas (preenche tudo) */}
      <div 
        ref={containerRef} 
        className="absolute inset-0"
      >
        {map ? (
          <TacticalBoardKonva
            map={{ ...map, grid_visible: gridVisible }}
            tokens={tokens}
            pings={pings}
            highlightedCells={highlightedCells}
            drawings={drawings}
            texts={texts}
            areas={areas}
            selectedAreaId={selectedAreaId}
            onAreaClick={onAreaClick}
            onAreaDrag={onAreaDrag}
            pins={pins}
            selectedPinId={selectedPinId}
            onPinClick={onPinClick}
            onPinDrag={onPinDrag}
            selectedTokenId={selectedTokenId}
            activeTool={activeTool}
            drawTool={drawTool}
            drawColor={drawColor}
            drawStrokeWidth={drawStrokeWidth}
            textFontSize={textFontSize}
            textColor={textColor}
            isMaster={isMaster}
            currentUserId={currentUserId}
            width={canvasSize.width}
            height={canvasSize.height}
            measureStart={measureStart}
            measureEnd={measureEnd}
            calculateDistance={calculateDistance}
            onTokenSelect={onTokenSelect}
            onTokenMove={onTokenMove}
            onTokenDoubleClick={onTokenDoubleClick}
            onMeasureStart={onMeasureStart}
            onMeasureEnd={onMeasureEnd}
            onPing={(x, y) => onPing?.(x, y)}
            onFogToggle={onFogReveal ? async (cells) => { await onFogReveal(cells); } : undefined}
            onDrawingComplete={onDrawingComplete || (() => {})}
            onDrawingDelete={onDrawingDelete}
            onTextCreate={onTextCreate || (() => {})}
            onTextUpdate={onTextUpdate || (() => {})}
            onTextDelete={onTextDelete}
            onCellDoubleClick={onCellDoubleClick}
            cameraSyncTarget={cameraSyncTarget}
            onCameraSyncHandled={onCameraSyncHandled}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full relative overflow-hidden">
            {/* Fundo atmosférico com grid sutil */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'linear-gradient(hsl(var(--muted-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--muted-foreground)) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            {/* Efeito de névoa sutil */}
            <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent opacity-50" />

            {/* Conteúdo central */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 flex flex-col items-center gap-6 max-w-sm text-center px-4"
            >
              {/* Ícone decorativo */}
              <div className="relative">
                <div className="absolute inset-0 blur-xl bg-primary/10 rounded-full scale-150" />
                <div className="relative p-5 rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm">
                  <MapIcon className="h-10 w-10 text-muted-foreground/60" />
                </div>
              </div>

              {/* Texto */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-foreground/80 font-display tracking-wide">
                  Nenhum mapa ativo
                </h3>
                <p className="text-xs text-muted-foreground/60 leading-relaxed">
                  {isMaster 
                    ? 'Crie um novo mapa tático ou selecione um existente para começar a sessão.'
                    : 'Aguarde o mestre configurar o mapa tático para esta sessão.'}
                </p>
              </div>

              {/* Ações do mestre */}
              {isMaster && (
                <div className="flex flex-col items-center gap-2 w-full">
                  {onCreateMap && onUploadMapImage && onSetActiveMap && (
                    <CreateMapDialog
                      onCreateMap={onCreateMap}
                      onUploadMapImage={onUploadMapImage}
                      onSetActiveMap={onSetActiveMap}
                      trigger={
                        <Button size="sm" className="gap-2 w-full max-w-48">
                          <Plus className="h-4 w-4" />
                          Criar Novo Mapa
                        </Button>
                      }
                    />
                  )}

                  {maps.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 w-full max-w-48 text-muted-foreground">
                          <MapIcon className="h-3.5 w-3.5" />
                          Selecionar existente ({maps.length})
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                        {maps.map((m) => (
                          <DropdownMenuItem 
                            key={m.id}
                            onClick={() => onMapChange(m.id)}
                            className="gap-2"
                          >
                            <MapIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            {m.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {map && !hideToolbar && (
        <MapToolbar
          activeTool={activeTool}
          onToolChange={onToolChange}
          drawTool={drawTool}
          onDrawToolChange={setLocalDrawTool}
          drawColor={drawColor}
          onDrawColorChange={setLocalDrawColor}
          drawStrokeWidth={drawStrokeWidth}
          onDrawStrokeWidthChange={setLocalDrawStrokeWidth}
          textColor={textColor}
          onTextColorChange={setLocalTextColor}
          textFontSize={textFontSize}
          onTextFontSizeChange={setLocalTextFontSize}
          isMaster={isMaster}
          gridVisible={gridVisible}
          onToggleGrid={handleToggleGrid}
          canUndoDrawing={canUndoDrawing}
          canRedoDrawing={canRedoDrawing}
          onDrawingUndo={onDrawingUndo}
          onDrawingRedo={onDrawingRedo}
          onDrawingClearAll={onDrawingClearAll}
        />
      )}

      {/* Controles de zoom (canto inferior direito) — oculta quando toolbar está escondida (sidebar assume) */}
      {map && !hideToolbar && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute bottom-3 right-3 z-10"
        >
          <div className="flex items-center gap-1 p-1.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border/50 shadow-lg">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Diminuir zoom</TooltipContent>
            </Tooltip>

            <Badge variant="secondary" className="min-w-12 justify-center text-xs">
              {Math.round(zoom * 100)}%
            </Badge>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onZoomChange(Math.min(5, zoom + 0.1))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Aumentar zoom</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onResetView}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Resetar visualização</TooltipContent>
            </Tooltip>

            {/* Botão Pop Out — abre mapa em nova aba */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (map?.campaign_id) {
                      window.open(`/map/${map.campaign_id}`, '_blank');
                    }
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Abrir em nova aba</TooltipContent>
            </Tooltip>
          </div>
        </motion.div>
      )}

      {/* Seletor de mapa (canto superior direito - apenas mestre) */}
      {isMaster && maps.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-3 right-3 z-10"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-card/90 backdrop-blur-sm"
              >
                <MapIcon className="h-4 w-4 mr-2" />
                {map?.name || 'Mapas'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {maps.map((m) => (
                <DropdownMenuItem 
                  key={m.id}
                  onClick={() => onMapChange(m.id)}
                  className={cn(m.id === map?.id && 'bg-primary/10')}
                >
                  {m.name}
                  {m.is_active && (
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      Ativo
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      )}
    </div>
  );
});

export default MapTab;
