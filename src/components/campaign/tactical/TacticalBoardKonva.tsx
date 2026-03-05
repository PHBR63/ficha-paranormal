/**
 * TacticalBoardKonva - Componente principal do mapa tático usando React-Konva
 * 
 * Renderização declarativa com:
 * - Camadas separadas (background, grid, tokens, fog, pings)
 * - Drag & drop nativo de tokens
 * - Zoom com scroll wheel + pinch (mobile)
 * - Pan com drag no fundo
 * - Seleção de tokens
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import type { MapToken, TacticalMap, BoardPing } from '@/hooks/campaign/useTacticalBoard';
import { useKonvaTransform } from './hooks/useKonvaTransform';
import { BackgroundLayer } from './layers/BackgroundLayer';
import { GridLayer } from './layers/GridLayer';
import { HighlightLayer, HighlightedCell } from './layers/HighlightLayer';
import { FogOfWarLayer } from './layers/FogOfWarLayer';
import { TokenLayer } from './layers/TokenLayer';
import { PingLayer } from './layers/PingLayer';
import { MeasurementLayer } from './layers/MeasurementLayer';
import { DrawingLayer, MapDrawing } from './layers/DrawingLayer';
import { TextLayer, MapText } from './layers/TextLayer';
import { AreaEffectLayer, MapAreaEffect } from './layers/AreaEffectLayer';

export interface TacticalBoardKonvaProps {
  // Dados do mapa
  map: TacticalMap | null;
  tokens: MapToken[];
  pings: BoardPing[];
  highlightedCells: HighlightedCell[];
  
  // Desenhos, textos e áreas de efeito
  drawings: MapDrawing[];
  texts: MapText[];
  areas?: MapAreaEffect[];
  selectedAreaId?: string | null;
  onAreaClick?: (areaId: string) => void;
  onAreaDrag?: (areaId: string, newX: number, newY: number) => void;
  
  // Estado de seleção
  selectedTokenId: string | null;
  
  // Medição
  measureStart: { x: number; y: number } | null;
  measureEnd: { x: number; y: number } | null;
  calculateDistance: (x1: number, y1: number, x2: number, y2: number) => number;
  
  // Ferramenta ativa
  activeTool: 'select' | 'move' | 'measure' | 'fog' | 'ping' | 'draw' | 'text';
  
  // Configurações de desenho
  drawTool: 'pen' | 'line' | 'rect' | 'circle' | 'eraser';
  drawColor: string;
  drawStrokeWidth: number;
  textFontSize: number;
  textColor: string;
  
  // Permissões
  isMaster: boolean;
  currentUserId?: string;
  
  // Dimensões do container
  width: number;
  height: number;
  
  // Callbacks
  onTokenSelect: (tokenId: string | null) => void;
  onTokenMove: (tokenId: string, x: number, y: number) => Promise<boolean>;
  onTokenDoubleClick?: (token: MapToken) => void;
  onCellClick?: (x: number, y: number) => void;
  onMeasureStart?: (x: number, y: number) => void;
  onMeasureEnd?: (x: number, y: number) => void;
  onPing?: (x: number, y: number) => void;
  onFogToggle?: (cells: Array<{ x: number; y: number }>) => void;
  
  // Callbacks de desenho/texto
  onDrawingComplete: (drawing: Omit<MapDrawing, 'id' | 'map_id' | 'created_by' | 'created_at'>) => void;
  onDrawingDelete?: (drawingId: string) => void;
  onTextCreate: (text: Omit<MapText, 'id' | 'map_id' | 'created_by' | 'created_at'>) => void;
  onTextUpdate: (textId: string, data: Partial<MapText>) => void;
  onTextDelete?: (textId: string) => void;
  
  // Integração com combate
  combatMode?: boolean;
  movementRemaining?: number;
  onMovementPreview?: (from: { x: number; y: number }, to: { x: number; y: number }, distance: number, isValid: boolean) => void;
  
  // Sincronização de câmera (Fase E)
  cameraSyncTarget?: { x: number; y: number } | null;
  onCameraSyncHandled?: () => void;
}

export function TacticalBoardKonva({
  map,
  tokens,
  pings,
  highlightedCells,
  drawings,
  texts,
  areas = [],
  selectedAreaId,
  onAreaClick,
  onAreaDrag,
  selectedTokenId,
  measureStart,
  measureEnd,
  calculateDistance,
  activeTool,
  drawTool,
  drawColor,
  drawStrokeWidth,
  textFontSize,
  textColor,
  isMaster,
  currentUserId,
  width,
  height,
  onTokenSelect,
  onTokenMove,
  onTokenDoubleClick,
  onCellClick,
  onMeasureStart,
  onMeasureEnd,
  onPing,
  onFogToggle,
  onDrawingComplete,
  onDrawingDelete,
  onTextCreate,
  onTextUpdate,
  onTextDelete,
  combatMode = false,
  movementRemaining = 9,
  onMovementPreview,
  cameraSyncTarget,
  onCameraSyncHandled,
}: TacticalBoardKonvaProps) {
  const stageRef = useRef<Konva.Stage>(null);
  
  // Estado de drag
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<{ x: number; y: number } | null>(null);
  const [dragToken, setDragToken] = useState<MapToken | null>(null);
  
  // Transform (zoom/pan)
  const transform = useKonvaTransform({
    minScale: 0.1,
    maxScale: 5,
    initialScale: 1,
  });

  // Sincronização de câmera (Fase E)
  useEffect(() => {
    if (!cameraSyncTarget || !map) return;
    const gs = map.grid_size || 40;
    const targetX = cameraSyncTarget.x * gs + gs / 2;
    const targetY = cameraSyncTarget.y * gs + gs / 2;
    transform.centerOnPoint(targetX, targetY, width, height);
    onCameraSyncHandled?.();
  }, [cameraSyncTarget]);

  // Calcula dimensões do mapa (valores padrão se não houver mapa)
  const gridSize = map?.grid_size || 40;
  const widthCells = map?.width_cells || Math.ceil(width / gridSize);
  const heightCells = map?.height_cells || Math.ceil(height / gridSize);
  const mapWidth = widthCells * gridSize;
  const mapHeight = heightCells * gridSize;

  /**
   * Converte coordenadas de pixel para célula do grid
   */
  const pixelToCell = useCallback((px: number, py: number) => {
    return {
      x: Math.floor(px / gridSize),
      y: Math.floor(py / gridSize),
    };
  }, [gridSize]);

  /**
   * Handler de clique no Stage (fundo)
   */
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Ignora cliques em tokens (tratados no TokenLayer)
    if (e.target !== e.currentTarget && e.target.getParent()?.name() !== 'stage-background') {
      return;
    }

    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Converte para coordenadas do mapa (considerando zoom/pan)
    const mapX = (pointer.x - transform.position.x) / transform.scale;
    const mapY = (pointer.y - transform.position.y) / transform.scale;
    const cell = pixelToCell(mapX, mapY);

    // Ação baseada na ferramenta ativa
    switch (activeTool) {
      case 'select':
        onTokenSelect(null);
        break;
      case 'measure':
        if (!measureStart) {
          onMeasureStart?.(cell.x, cell.y);
        } else {
          onMeasureEnd?.(cell.x, cell.y);
        }
        break;
      case 'ping':
        onPing?.(cell.x, cell.y);
        break;
      case 'fog':
        if (isMaster) {
          onFogToggle?.([cell]);
        }
        break;
      default:
        onCellClick?.(cell.x, cell.y);
    }
  }, [activeTool, measureStart, transform, pixelToCell, onTokenSelect, onMeasureStart, onMeasureEnd, onPing, onFogToggle, onCellClick, isMaster]);

  /**
   * Handler de início de drag de token
   */
  const handleTokenDragStart = useCallback((token: MapToken) => {
    setIsDragging(true);
    setDragToken(token);
    setDragStartCell({ x: token.x, y: token.y });
  }, []);

  /**
   * Handler de movimento de drag de token
   */
  const handleTokenDragMove = useCallback((token: MapToken, newX: number, newY: number) => {
    if (!combatMode || !dragStartCell || !onMovementPreview) return;

    const distance = calculateDistance(dragStartCell.x, dragStartCell.y, newX, newY);
    const isValid = distance <= movementRemaining;
    onMovementPreview(dragStartCell, { x: newX, y: newY }, distance, isValid);
  }, [combatMode, dragStartCell, movementRemaining, calculateDistance, onMovementPreview]);

  /**
   * Handler de fim de drag de token
   */
  const handleTokenDragEnd = useCallback(async (tokenId: string, newX: number, newY: number) => {
    setIsDragging(false);
    setDragToken(null);
    setDragStartCell(null);

    // Valida movimento em modo de combate
    if (combatMode && dragStartCell) {
      const distance = calculateDistance(dragStartCell.x, dragStartCell.y, newX, newY);
      if (distance > movementRemaining) {
        // Movimento inválido - não salva
        return;
      }
    }

    // Salva nova posição
    await onTokenMove(tokenId, newX, newY);
  }, [combatMode, dragStartCell, movementRemaining, calculateDistance, onTokenMove]);

  // Sem mapa, não renderiza nada (após todos os hooks)
  if (!map) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Nenhum mapa ativo
      </div>
    );
  }

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      x={transform.position.x}
      y={transform.position.y}
      scaleX={transform.scale}
      scaleY={transform.scale}
      draggable={activeTool === 'select' || activeTool === 'move' || activeTool === 'text'}
      onWheel={transform.handleWheel}
      onTouchStart={transform.handleTouchStart}
      onTouchMove={transform.handleTouchMove}
      onTouchEnd={transform.handleTouchEnd}
      onDragStart={transform.handleDragStart}
      onDragEnd={transform.handleDragEnd}
      onClick={handleStageClick}
      onTap={handleStageClick}
    >
      {/* Layer 1 (base): Background + Grid + Highlights */}
      <Layer listening={false}>
        <BackgroundLayer
          imageUrl={map.image_url}
          width={mapWidth}
          height={mapHeight}
        />
        <GridLayer
          gridSize={gridSize}
          gridColor={map.grid_color}
          gridType={map.grid_type as 'square' | 'hex' | 'none'}
          widthCells={widthCells}
          heightCells={heightCells}
          visible={map.grid_visible}
        />
        <HighlightLayer
          cells={highlightedCells}
          gridSize={gridSize}
        />
      </Layer>

      {/* Layer 2: Desenhos (interativo quando ativo) */}
      <DrawingLayer
        drawings={drawings}
        isDrawing={activeTool === 'draw'}
        drawTool={drawTool}
        drawColor={drawColor}
        drawStrokeWidth={drawStrokeWidth}
        mapWidth={mapWidth}
        mapHeight={mapHeight}
        onDrawingComplete={onDrawingComplete}
        onDrawingDelete={onDrawingDelete}
      />

      {/* Layer 3: Tokens (não-interativo quando desenhando) */}
      <TokenLayer
        tokens={tokens}
        gridSize={gridSize}
        selectedTokenId={selectedTokenId}
        isMaster={isMaster}
        listening={activeTool !== 'draw'}
        onTokenSelect={onTokenSelect}
        onTokenDragStart={handleTokenDragStart}
        onTokenDragMove={handleTokenDragMove}
        onTokenDragEnd={handleTokenDragEnd}
        onTokenDoubleClick={onTokenDoubleClick}
      />

      {/* Layer 3.5: Áreas de efeito (entre tokens e textos) */}
      {areas.length > 0 && (
        <AreaEffectLayer
          areas={areas}
          gridSize={gridSize}
          isMaster={isMaster}
          selectedAreaId={selectedAreaId}
          listening={activeTool !== 'draw'}
          onAreaClick={onAreaClick}
          onAreaDrag={onAreaDrag}
        />
      )}

      {/* Layer 4: Textos (não-interativo quando desenhando) */}
      <TextLayer
        texts={texts}
        isTextMode={activeTool === 'text'}
        defaultFontSize={textFontSize}
        defaultColor={textColor}
        isMaster={isMaster}
        currentUserId={currentUserId}
        listening={activeTool !== 'draw'}
        onTextCreate={onTextCreate}
        onTextUpdate={onTextUpdate}
        onTextDelete={onTextDelete}
      />

      {/* Layer 5 (overlay): FogOfWar + Medição + Pings */}
      <Layer listening={false}>
        <FogOfWarLayer
          revealedCells={map.fog_of_war}
          gridSize={gridSize}
          mapWidth={mapWidth}
          mapHeight={mapHeight}
          isMaster={isMaster}
        />
        <MeasurementLayer
          startCell={measureStart}
          endCell={measureEnd}
          gridSize={gridSize}
          calculateDistance={calculateDistance}
        />
        <PingLayer
          pings={pings}
          gridSize={gridSize}
        />
      </Layer>
    </Stage>
  );
}

export default TacticalBoardKonva;
