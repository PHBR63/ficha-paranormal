/**
 * AreaEffectLayer - Camada de áreas de efeito no mapa tático (Fase D)
 * 
 * Renderiza formas geométricas (cone, círculo, linha, quadrado) 
 * representando áreas de efeito de rituais e habilidades.
 * 
 * Cada forma é posicionada em coordenadas de célula do grid e
 * dimensionada em metros (1 célula = 1.5m no OP).
 */

import { Layer, Circle, Rect, Line, Arc, Group, Text } from 'react-konva';
import { memo, useMemo } from 'react';

// Tipo exportado para uso no hook
export interface MapAreaEffect {
  id: string;
  map_id: string;
  created_by: string;
  shape_type: 'cone' | 'circle' | 'line' | 'square';
  origin_x: number;
  origin_y: number;
  radius: number;
  angle: number;
  rotation: number;
  side_length: number;
  line_length: number;
  color: string;
  border_color: string;
  opacity: number;
  label: string | null;
  element: string | null;
  visibility: 'all' | 'master';
  created_at: string;
  updated_at: string;
}

interface AreaEffectLayerProps {
  /** Lista de áreas de efeito ativas */
  areas: MapAreaEffect[];
  /** Tamanho do grid em pixels */
  gridSize: number;
  /** Se o usuário é mestre (para ver áreas ocultas) */
  isMaster: boolean;
  /** Área selecionada (para destaque) */
  selectedAreaId?: string | null;
  /** Permite interação (drag, click) */
  listening?: boolean;
  /** Callback ao clicar numa área */
  onAreaClick?: (areaId: string) => void;
  /** Callback ao arrastar uma área (reposicionar) */
  onAreaDrag?: (areaId: string, newX: number, newY: number) => void;
}

/**
 * Converte cor hex com alpha para rgba
 */
function hexToRgba(hex: string, opacity: number): string {
  // Se já tem alpha no hex (8 chars), usar direto
  if (hex.length === 9) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  // Hex padrão de 6 chars
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Renderiza uma área de efeito individual baseada no shape_type
 */
const AreaEffectShape = memo(function AreaEffectShape({
  area,
  gridSize,
  isSelected,
  onAreaClick,
  onAreaDrag,
}: {
  area: MapAreaEffect;
  gridSize: number;
  isSelected: boolean;
  onAreaClick?: (areaId: string) => void;
  onAreaDrag?: (areaId: string, newX: number, newY: number) => void;
}) {
  // Centro da célula de origem em pixels
  const centerX = area.origin_x * gridSize + gridSize / 2;
  const centerY = area.origin_y * gridSize + gridSize / 2;
  
  const fillColor = hexToRgba(area.color, area.opacity);
  const strokeColor = area.border_color || area.color;
  const strokeWidth = isSelected ? 3 : 1.5;
  
  // Handler de clique
  const handleClick = () => {
    onAreaClick?.(area.id);
  };

  // Handler de drag start - impede que o Stage também seja arrastado
  const handleDragStart = (e: any) => {
    e.cancelBubble = true;
  };

  // Handler de drag end
  const handleDragEnd = (e: any) => {
    e.cancelBubble = true;
    if (!onAreaDrag) return;
    const newCellX = Math.round(e.target.x() / gridSize);
    const newCellY = Math.round(e.target.y() / gridSize);
    // Snap para grid
    e.target.x(newCellX * gridSize + gridSize / 2);
    e.target.y(newCellY * gridSize + gridSize / 2);
    onAreaDrag(area.id, newCellX, newCellY);
  };

  // Props comuns do grupo
  const groupProps = {
    x: centerX,
    y: centerY,
    draggable: !!onAreaDrag,
    onClick: handleClick,
    onTap: handleClick,
    onDragEnd: handleDragEnd,
  };

  switch (area.shape_type) {
    case 'circle': {
      // Raio em pixels (cada célula = 1.5m, raio em metros)
      const radiusPx = (area.radius / 1.5) * gridSize;
      return (
        <Group {...groupProps}>
          <Circle
            x={0}
            y={0}
            radius={radiusPx}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            dash={isSelected ? [8, 4] : undefined}
          />
          {area.label && (
            <Text
              x={-radiusPx}
              y={-10}
              width={radiusPx * 2}
              text={area.label}
              fontSize={12}
              fill={strokeColor}
              align="center"
              fontStyle="bold"
            />
          )}
        </Group>
      );
    }
    
    case 'cone': {
      // Cone: originado no centro, apontando na direção de rotation
      const radiusPx = (area.radius / 1.5) * gridSize;
      const angleDeg = area.angle;
      const rotDeg = area.rotation;
      
      return (
        <Group {...groupProps} rotation={rotDeg}>
          <Arc
            x={0}
            y={0}
            innerRadius={0}
            outerRadius={radiusPx}
            angle={angleDeg}
            rotation={-angleDeg / 2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            dash={isSelected ? [8, 4] : undefined}
          />
          {area.label && (
            <Text
              x={radiusPx * 0.3}
              y={-10}
              text={area.label}
              fontSize={12}
              fill={strokeColor}
              fontStyle="bold"
              rotation={-rotDeg}
            />
          )}
        </Group>
      );
    }
    
    case 'line': {
      // Linha: do centro na direção de rotation, comprimento = line_length
      const lengthPx = (area.line_length / 1.5) * gridSize;
      const widthPx = gridSize * 0.3; // Largura visual da linha
      const rotRad = (area.rotation * Math.PI) / 180;
      
      const endX = Math.cos(rotRad) * lengthPx;
      const endY = Math.sin(rotRad) * lengthPx;
      
      // Calcula pontos perpendiculares para dar "grossura" à linha
      const perpX = Math.cos(rotRad + Math.PI / 2) * widthPx;
      const perpY = Math.sin(rotRad + Math.PI / 2) * widthPx;
      
      const points = [
        -perpX, -perpY,
        endX - perpX, endY - perpY,
        endX + perpX, endY + perpY,
        perpX, perpY,
      ];
      
      return (
        <Group {...groupProps}>
          <Line
            points={points}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            closed
            dash={isSelected ? [8, 4] : undefined}
          />
          {area.label && (
            <Text
              x={endX / 2 - 20}
              y={endY / 2 - 16}
              text={area.label}
              fontSize={12}
              fill={strokeColor}
              fontStyle="bold"
            />
          )}
        </Group>
      );
    }
    
    case 'square': {
      // Quadrado centrado no ponto de origem
      const sidePx = (area.side_length / 1.5) * gridSize;
      
      return (
        <Group {...groupProps} rotation={area.rotation}>
          <Rect
            x={-sidePx / 2}
            y={-sidePx / 2}
            width={sidePx}
            height={sidePx}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            dash={isSelected ? [8, 4] : undefined}
          />
          {area.label && (
            <Text
              x={-sidePx / 2}
              y={-10}
              width={sidePx}
              text={area.label}
              fontSize={12}
              fill={strokeColor}
              align="center"
              fontStyle="bold"
              rotation={-area.rotation}
            />
          )}
        </Group>
      );
    }
    
    default:
      return null;
  }
});

/**
 * Layer completa de áreas de efeito
 */
export const AreaEffectLayer = memo(function AreaEffectLayer({
  areas,
  gridSize,
  isMaster,
  selectedAreaId,
  listening = true,
  onAreaClick,
  onAreaDrag,
}: AreaEffectLayerProps) {
  // Filtra áreas visíveis (mestre vê tudo, jogadores só 'all')
  const visibleAreas = useMemo(() => {
    if (isMaster) return areas;
    return areas.filter(a => a.visibility === 'all');
  }, [areas, isMaster]);

  if (visibleAreas.length === 0) return null;

  return (
    <Layer listening={listening}>
      {visibleAreas.map(area => (
        <AreaEffectShape
          key={area.id}
          area={area}
          gridSize={gridSize}
          isSelected={selectedAreaId === area.id}
          onAreaClick={onAreaClick}
          onAreaDrag={onAreaDrag}
        />
      ))}
    </Layer>
  );
});

export default AreaEffectLayer;
