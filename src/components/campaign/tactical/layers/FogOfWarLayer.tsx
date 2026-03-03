/**
 * FogOfWarLayer - Camada de névoa de guerra
 * 
 * Renderiza a névoa de guerra que cobre áreas não reveladas.
 * Células reveladas aparecem como "buracos" na névoa.
 * 
 * Nota: Para jogadores, a névoa é completamente opaca.
 * Para o mestre, mostra um indicador visual das áreas reveladas.
 */

import { useMemo } from 'react';
import { Rect, Group } from 'react-konva';

interface FogCell {
  x: number;
  y: number;
}

interface FogOfWarLayerProps {
  revealedCells: FogCell[];
  gridSize: number;
  mapWidth: number;
  mapHeight: number;
  isMaster: boolean;
  visible?: boolean;
}

export function FogOfWarLayer({
  revealedCells,
  gridSize,
  mapWidth,
  mapHeight,
  isMaster,
  visible = true,
}: FogOfWarLayerProps) {
  // Cria um Set para lookup rápido de células reveladas
  const revealedSet = useMemo(() => {
    return new Set(revealedCells.map((c) => `${c.x}-${c.y}`));
  }, [revealedCells]);

  // Calcula as células que devem estar cobertas pela névoa
  const fogCells = useMemo(() => {
    if (!visible || isMaster) return [];

    const cells: Array<{ x: number; y: number }> = [];
    const cols = Math.ceil(mapWidth / gridSize);
    const rows = Math.ceil(mapHeight / gridSize);

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if (!revealedSet.has(`${x}-${y}`)) {
          cells.push({ x, y });
        }
      }
    }

    return cells;
  }, [visible, isMaster, mapWidth, mapHeight, gridSize, revealedSet]);

  // Para o mestre: apenas mostra indicadores visuais das áreas reveladas
  if (isMaster) {
    if (revealedCells.length === 0) return null;

    return (
      <Group listening={false}>
        {revealedCells.map((cell) => (
          <Rect
            key={`revealed-${cell.x}-${cell.y}`}
            x={cell.x * gridSize}
            y={cell.y * gridSize}
            width={gridSize}
            height={gridSize}
            fill="rgba(0, 200, 100, 0.1)"
            stroke="rgba(0, 200, 100, 0.3)"
            strokeWidth={1}
          />
        ))}
      </Group>
    );
  }

  // Para jogadores: névoa sólida cobrindo áreas não reveladas
  if (!visible || fogCells.length === 0) return null;

  return (
    <Group listening={false}>
      {fogCells.map((cell) => (
        <Rect
          key={`fog-${cell.x}-${cell.y}`}
          x={cell.x * gridSize}
          y={cell.y * gridSize}
          width={gridSize}
          height={gridSize}
          fill="rgba(10, 10, 15, 0.92)"
        />
      ))}
    </Group>
  );
}

export default FogOfWarLayer;
