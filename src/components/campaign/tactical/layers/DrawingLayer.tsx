/**
 * DrawingLayer - Camada de desenhos no mapa tático
 * 
 * Renderiza desenhos persistidos e captura novos strokes.
 * Ferramentas: caneta (freehand), linha reta, retângulo, círculo, borracha.
 * Cada stroke é salvo no banco ao soltar o mouse.
 */

import { useState, useCallback, useRef } from 'react';
import { Layer, Line, Rect, Circle, Group } from 'react-konva';
import Konva from 'konva';

/** Estrutura de um desenho persistido */
export interface MapDrawing {
  id: string;
  map_id: string;
  created_by: string;
  tool: 'pen' | 'line' | 'rect' | 'circle' | 'eraser';
  points: number[]; // Array flat [x1, y1, x2, y2, ...]
  color: string;
  stroke_width: number;
  opacity: number;
  created_at: string;
}

interface DrawingLayerProps {
  /** Desenhos já salvos no banco */
  drawings: MapDrawing[];
  /** Se o modo de desenho está ativo */
  isDrawing: boolean;
  /** Ferramenta de desenho ativa */
  drawTool: 'pen' | 'line' | 'rect' | 'circle' | 'eraser';
  /** Cor do traço */
  drawColor: string;
  /** Espessura do traço */
  drawStrokeWidth: number;
  /** Callback ao finalizar um stroke */
  onDrawingComplete: (drawing: Omit<MapDrawing, 'id' | 'map_id' | 'created_by' | 'created_at'>) => void;
  /** Callback ao deletar um desenho (borracha) */
  onDrawingDelete?: (drawingId: string) => void;
}

/**
 * Renderiza um desenho individual baseado na ferramenta usada
 */
function DrawingShape({ drawing }: { drawing: MapDrawing }) {
  const { tool, points, color, stroke_width, opacity } = drawing;

  if (tool === 'eraser') return null;

  if (tool === 'pen' || tool === 'line') {
    return (
      <Line
        points={points}
        stroke={color}
        strokeWidth={stroke_width}
        opacity={opacity}
        lineCap="round"
        lineJoin="round"
        tension={tool === 'pen' ? 0.5 : 0}
        listening={false}
        globalCompositeOperation="source-over"
      />
    );
  }

  if (tool === 'rect' && points.length >= 4) {
    const [x1, y1, x2, y2] = points;
    return (
      <Rect
        x={Math.min(x1, x2)}
        y={Math.min(y1, y2)}
        width={Math.abs(x2 - x1)}
        height={Math.abs(y2 - y1)}
        stroke={color}
        strokeWidth={stroke_width}
        opacity={opacity}
        listening={false}
      />
    );
  }

  if (tool === 'circle' && points.length >= 4) {
    const [cx, cy, ex, ey] = points;
    const radius = Math.sqrt((ex - cx) ** 2 + (ey - cy) ** 2);
    return (
      <Circle
        x={cx}
        y={cy}
        radius={radius}
        stroke={color}
        strokeWidth={stroke_width}
        opacity={opacity}
        listening={false}
      />
    );
  }

  return null;
}

export function DrawingLayer({
  drawings,
  isDrawing,
  drawTool,
  drawColor,
  drawStrokeWidth,
  onDrawingComplete,
  onDrawingDelete,
}: DrawingLayerProps) {
  // Estado do stroke atual (enquanto o usuário desenha)
  const [currentPoints, setCurrentPoints] = useState<number[]>([]);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);

  /** Inicia um novo stroke */
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing) return;
    e.cancelBubble = true;

    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getRelativePointerPosition();
    if (!pos) return;

    setIsMouseDown(true);
    startPointRef.current = { x: pos.x, y: pos.y };

    if (drawTool === 'pen' || drawTool === 'eraser') {
      setCurrentPoints([pos.x, pos.y]);
    } else {
      // Para linha, retângulo e círculo: guarda ponto inicial
      setCurrentPoints([pos.x, pos.y, pos.x, pos.y]);
    }
  }, [isDrawing, drawTool]);

  /** Atualiza o stroke enquanto o mouse move */
  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isMouseDown || !isDrawing) return;
    e.cancelBubble = true;

    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getRelativePointerPosition();
    if (!pos) return;

    if (drawTool === 'pen' || drawTool === 'eraser') {
      setCurrentPoints(prev => [...prev, pos.x, pos.y]);
    } else {
      // Atualiza ponto final para linha/rect/circle
      setCurrentPoints(prev => {
        if (prev.length < 2) return prev;
        return [prev[0], prev[1], pos.x, pos.y];
      });
    }
  }, [isMouseDown, isDrawing, drawTool]);

  /** Finaliza o stroke e envia para persistência */
  const handleMouseUp = useCallback(() => {
    if (!isMouseDown || !isDrawing) return;
    setIsMouseDown(false);

    if (currentPoints.length < 4 && (drawTool === 'pen' || drawTool === 'eraser')) {
      // Stroke muito curto, ignora
      setCurrentPoints([]);
      return;
    }

    // Envia desenho para persistência
    onDrawingComplete({
      tool: drawTool,
      points: currentPoints,
      color: drawTool === 'eraser' ? '#000000' : drawColor,
      stroke_width: drawTool === 'eraser' ? drawStrokeWidth * 3 : drawStrokeWidth,
      opacity: drawTool === 'eraser' ? 1 : 1,
    });

    setCurrentPoints([]);
    startPointRef.current = null;
  }, [isMouseDown, isDrawing, currentPoints, drawTool, drawColor, drawStrokeWidth, onDrawingComplete]);

  return (
    <Layer
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Desenhos salvos */}
      {drawings.map((drawing) => (
        <DrawingShape key={drawing.id} drawing={drawing} />
      ))}

      {/* Stroke atual (preview) */}
      {isMouseDown && currentPoints.length >= 2 && (
        <>
          {(drawTool === 'pen' || drawTool === 'eraser') && (
            <Line
              points={currentPoints}
              stroke={drawTool === 'eraser' ? '#ff0000' : drawColor}
              strokeWidth={drawTool === 'eraser' ? drawStrokeWidth * 3 : drawStrokeWidth}
              opacity={drawTool === 'eraser' ? 0.5 : 1}
              lineCap="round"
              lineJoin="round"
              tension={0.5}
              listening={false}
              dash={drawTool === 'eraser' ? [5, 5] : undefined}
            />
          )}

          {drawTool === 'line' && currentPoints.length >= 4 && (
            <Line
              points={currentPoints}
              stroke={drawColor}
              strokeWidth={drawStrokeWidth}
              lineCap="round"
              listening={false}
            />
          )}

          {drawTool === 'rect' && currentPoints.length >= 4 && (
            <Rect
              x={Math.min(currentPoints[0], currentPoints[2])}
              y={Math.min(currentPoints[1], currentPoints[3])}
              width={Math.abs(currentPoints[2] - currentPoints[0])}
              height={Math.abs(currentPoints[3] - currentPoints[1])}
              stroke={drawColor}
              strokeWidth={drawStrokeWidth}
              listening={false}
            />
          )}

          {drawTool === 'circle' && currentPoints.length >= 4 && (
            <Circle
              x={currentPoints[0]}
              y={currentPoints[1]}
              radius={Math.sqrt(
                (currentPoints[2] - currentPoints[0]) ** 2 +
                (currentPoints[3] - currentPoints[1]) ** 2
              )}
              stroke={drawColor}
              strokeWidth={drawStrokeWidth}
              listening={false}
            />
          )}
        </>
      )}
    </Layer>
  );
}

export default DrawingLayer;
