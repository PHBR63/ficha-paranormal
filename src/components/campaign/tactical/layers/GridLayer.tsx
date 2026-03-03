/**
 * GridLayer - Camada de grid do mapa tático
 * 
 * Renderiza o grid quadrado sobre o mapa.
 * Suporte futuro para grid hexagonal.
 */

import { useMemo, ReactNode } from 'react';
import { Line, Group } from 'react-konva';

interface GridLayerProps {
  gridSize: number;
  gridColor: string;
  gridType: 'square' | 'hex' | 'none';
  widthCells: number;
  heightCells: number;
  visible?: boolean;
}

export function GridLayer({
  gridSize,
  gridColor,
  gridType,
  widthCells,
  heightCells,
  visible = true,
}: GridLayerProps) {
  // Calcula as linhas do grid de forma memoizada
  const gridLines = useMemo(() => {
    if (!visible || gridType === 'none') return null;

    const lines: ReactNode[] = [];
    const totalWidth = widthCells * gridSize;
    const totalHeight = heightCells * gridSize;

    if (gridType === 'square') {
      // Linhas verticais
      for (let x = 0; x <= widthCells; x++) {
        lines.push(
          <Line
            key={`v-${x}`}
            points={[x * gridSize, 0, x * gridSize, totalHeight]}
            stroke={gridColor}
            strokeWidth={1}
            listening={false}
          />
        );
      }

      // Linhas horizontais
      for (let y = 0; y <= heightCells; y++) {
        lines.push(
          <Line
            key={`h-${y}`}
            points={[0, y * gridSize, totalWidth, y * gridSize]}
            stroke={gridColor}
            strokeWidth={1}
            listening={false}
          />
        );
      }
    } else if (gridType === 'hex') {
      // TODO: Implementar grid hexagonal
      // Por enquanto, usa grid quadrado como fallback
      for (let x = 0; x <= widthCells; x++) {
        lines.push(
          <Line
            key={`v-${x}`}
            points={[x * gridSize, 0, x * gridSize, totalHeight]}
            stroke={gridColor}
            strokeWidth={1}
            strokeDash={[5, 5]}
            listening={false}
          />
        );
      }

      for (let y = 0; y <= heightCells; y++) {
        lines.push(
          <Line
            key={`h-${y}`}
            points={[0, y * gridSize, totalWidth, y * gridSize]}
            stroke={gridColor}
            strokeWidth={1}
            strokeDash={[5, 5]}
            listening={false}
          />
        );
      }
    }

    return lines;
  }, [gridSize, gridColor, gridType, widthCells, heightCells, visible]);

  if (!visible || gridType === 'none') return null;

  return (
    <Group listening={false}>
      {gridLines}
    </Group>
  );
}

export default GridLayer;
