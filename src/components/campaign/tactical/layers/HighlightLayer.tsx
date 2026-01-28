/**
 * HighlightLayer - Camada de células destacadas
 * 
 * Renderiza células de movimento, alcance, caminho e alvos.
 * Usado em modo de combate para indicar áreas válidas.
 */

import { useMemo } from 'react';
import { Layer, Rect, Group } from 'react-konva';

export interface HighlightedCell {
  x: number;
  y: number;
  type: 'reachable' | 'unreachable' | 'target' | 'path';
}

interface HighlightLayerProps {
  cells: HighlightedCell[];
  gridSize: number;
}

// Cores por tipo de highlight
const HIGHLIGHT_COLORS: Record<HighlightedCell['type'], { fill: string; stroke: string }> = {
  reachable: {
    fill: 'rgba(34, 197, 94, 0.25)',
    stroke: 'rgba(34, 197, 94, 0.6)',
  },
  unreachable: {
    fill: 'rgba(239, 68, 68, 0.15)',
    stroke: 'rgba(239, 68, 68, 0.4)',
  },
  target: {
    fill: 'rgba(251, 191, 36, 0.3)',
    stroke: 'rgba(251, 191, 36, 0.7)',
  },
  path: {
    fill: 'rgba(59, 130, 246, 0.3)',
    stroke: 'rgba(59, 130, 246, 0.7)',
  },
};

export function HighlightLayer({ cells, gridSize }: HighlightLayerProps) {
  // Agrupa células por tipo para otimizar renderização
  const cellsByType = useMemo(() => {
    const grouped: Record<HighlightedCell['type'], HighlightedCell[]> = {
      reachable: [],
      unreachable: [],
      target: [],
      path: [],
    };

    cells.forEach((cell) => {
      grouped[cell.type].push(cell);
    });

    return grouped;
  }, [cells]);

  if (cells.length === 0) return null;

  return (
    <Layer listening={false}>
      {/* Renderiza cada tipo de célula em grupos separados */}
      {(Object.keys(cellsByType) as HighlightedCell['type'][]).map((type) => {
        const typeCells = cellsByType[type];
        if (typeCells.length === 0) return null;

        const colors = HIGHLIGHT_COLORS[type];

        return (
          <Group key={type}>
            {typeCells.map((cell) => (
              <Rect
                key={`${cell.x}-${cell.y}`}
                x={cell.x * gridSize + 1}
                y={cell.y * gridSize + 1}
                width={gridSize - 2}
                height={gridSize - 2}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={1.5}
                cornerRadius={2}
              />
            ))}
          </Group>
        );
      })}
    </Layer>
  );
}

export default HighlightLayer;
