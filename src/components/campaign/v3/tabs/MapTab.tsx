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
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MousePointer2, 
  Move, 
  Ruler, 
  CloudFog, 
  Radio,
  Pencil,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
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
import type { TacticalMap, MapToken, BoardPing } from '@/hooks/campaign/useTacticalBoard';
import type { HighlightedCell } from '@/components/campaign/tactical/layers/HighlightLayer';
import type { MapDrawing } from '@/components/campaign/tactical/layers/DrawingLayer';
import type { MapText } from '@/components/campaign/tactical/layers/TextLayer';

// Tipos de ferramentas
type ToolType = 'select' | 'move' | 'measure' | 'fog' | 'ping' | 'draw' | 'text';

// Cores predefinidas para desenho
const DRAW_COLORS = [
  '#ffffff', '#ff0000', '#00ff00', '#0088ff', 
  '#ffff00', '#ff8800', '#ff00ff', '#00ffff',
];

interface MapTabProps {
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
  /** ID do usuário atual */
  currentUserId?: string;
  /** Classe CSS adicional */
  className?: string;
}

// Configuração das ferramentas
const TOOLS = [
  { id: 'select' as ToolType, icon: MousePointer2, label: 'Selecionar', masterOnly: false },
  { id: 'move' as ToolType, icon: Move, label: 'Mover', masterOnly: false },
  { id: 'measure' as ToolType, icon: Ruler, label: 'Medir', masterOnly: false },
  { id: 'ping' as ToolType, icon: Radio, label: 'Ping', masterOnly: false },
  { id: 'draw' as ToolType, icon: Pencil, label: 'Desenhar', masterOnly: false },
  { id: 'text' as ToolType, icon: Type, label: 'Texto', masterOnly: false },
  { id: 'fog' as ToolType, icon: CloudFog, label: 'Névoa', masterOnly: true },
] as const;

export const MapTab = memo(function MapTab({
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
  currentUserId,
  className,
}: MapTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  // Estado local para ferramentas de desenho
  const [drawTool, setDrawTool] = useState<'pen' | 'line' | 'rect' | 'circle' | 'eraser'>('pen');
  const [drawColor, setDrawColor] = useState('#ffffff');
  const [drawStrokeWidth, setDrawStrokeWidth] = useState(3);
  const [textFontSize, setTextFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#ffffff');

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

  // Filtra ferramentas visíveis (algumas são só para mestre)
  const visibleTools = TOOLS.filter(tool => !tool.masterOnly || isMaster);

  return (
    <div className={cn('relative w-full h-full overflow-hidden', className)}>
      {/* Container do canvas (preenche tudo) */}
      <div 
        ref={containerRef} 
        className="absolute inset-0"
      >
        {map ? (
          <TacticalBoardKonva
            map={map}
            tokens={tokens}
            pings={pings}
            highlightedCells={highlightedCells}
            drawings={drawings}
            texts={texts}
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
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <MapIcon className="h-12 w-12 opacity-50" />
            <p className="text-sm">Nenhum mapa ativo</p>
            {isMaster && maps.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Selecionar mapa
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {maps.map((m) => (
                    <DropdownMenuItem 
                      key={m.id}
                      onClick={() => onMapChange(m.id)}
                    >
                      {m.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {/* Toolbar flutuante (canto superior esquerdo) */}
      {map && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-3 left-3 z-10"
        >
          <div className="flex flex-col gap-1 p-1.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border/50 shadow-lg">
            {visibleTools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              
              return (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onToolChange(tool.id)}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {tool.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* Separador + sub-ferramentas de desenho */}
            {activeTool === 'draw' && (
              <>
                <div className="h-px bg-border/50 my-1" />
                
                {/* Seletor de cor */}
                <div className="flex flex-wrap gap-0.5 px-0.5">
                  {DRAW_COLORS.map(color => (
                    <button
                      key={color}
                      className={cn(
                        'w-4 h-4 rounded-full border border-border/50 transition-transform',
                        drawColor === color && 'ring-2 ring-primary scale-110'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setDrawColor(color)}
                    />
                  ))}
                </div>

                {/* Espessura do traço */}
                <div className="flex items-center gap-1 px-1">
                  {[2, 4, 8].map(w => (
                    <button
                      key={w}
                      className={cn(
                        'flex-1 h-6 rounded flex items-center justify-center text-[10px]',
                        drawStrokeWidth === w 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      )}
                      onClick={() => setDrawStrokeWidth(w)}
                    >
                      {w}px
                    </button>
                  ))}
                </div>

                {/* Undo/Redo */}
                <div className="flex gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={!canUndoDrawing}
                        onClick={onDrawingUndo}
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Desfazer (Ctrl+Z)</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={!canRedoDrawing}
                        onClick={onDrawingRedo}
                      >
                        <Redo2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Refazer (Ctrl+Y)</TooltipContent>
                  </Tooltip>
                </div>

                {/* Limpar tudo (apenas mestre) */}
                {isMaster && onDrawingClearAll && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={onDrawingClearAll}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Limpar todos os desenhos</TooltipContent>
                  </Tooltip>
                )}
              </>
            )}

            {/* Sub-ferramentas de texto */}
            {activeTool === 'text' && (
              <>
                <div className="h-px bg-border/50 my-1" />
                
                {/* Seletor de cor do texto */}
                <div className="flex flex-wrap gap-0.5 px-0.5">
                  {DRAW_COLORS.map(color => (
                    <button
                      key={color}
                      className={cn(
                        'w-4 h-4 rounded-full border border-border/50 transition-transform',
                        textColor === color && 'ring-2 ring-primary scale-110'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setTextColor(color)}
                    />
                  ))}
                </div>

                {/* Tamanho da fonte */}
                <div className="flex items-center gap-1 px-1">
                  {[12, 16, 24].map(s => (
                    <button
                      key={s}
                      className={cn(
                        'flex-1 h-6 rounded flex items-center justify-center text-[10px]',
                        textFontSize === s 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      )}
                      onClick={() => setTextFontSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Controles de zoom (canto inferior direito) */}
      {map && (
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
