/**
 * MeasurementLayer - Camada de régua de medição
 * 
 * Renderiza linha de medição entre dois pontos
 * com badge mostrando a distância em metros.
 */

import { Line, Rect, Text, Group } from 'react-konva';

interface MeasurementLayerProps {
  startCell: { x: number; y: number } | null;
  endCell: { x: number; y: number } | null;
  gridSize: number;
  calculateDistance: (x1: number, y1: number, x2: number, y2: number) => number;
}

export function MeasurementLayer({
  startCell,
  endCell,
  gridSize,
  calculateDistance,
}: MeasurementLayerProps) {
  if (!startCell || !endCell) return null;

  // Calcula posições em pixels (centro da célula)
  const startX = startCell.x * gridSize + gridSize / 2;
  const startY = startCell.y * gridSize + gridSize / 2;
  const endX = endCell.x * gridSize + gridSize / 2;
  const endY = endCell.y * gridSize + gridSize / 2;

  // Calcula distância
  const distance = calculateDistance(startCell.x, startCell.y, endCell.x, endCell.y);

  // Posição do badge (meio da linha)
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  const badgeWidth = 50;
  const badgeHeight = 20;

  return (
    <Group listening={false}>
      {/* Linha de medição (tracejada) */}
      <Line
        points={[startX, startY, endX, endY]}
        stroke="#f59e0b"
        strokeWidth={3}
        dash={[5, 5]}
      />

      {/* Círculo no início */}
      <Group x={startX} y={startY}>
        <Rect
          x={-4}
          y={-4}
          width={8}
          height={8}
          fill="#f59e0b"
          cornerRadius={2}
        />
      </Group>

      {/* Círculo no fim */}
      <Group x={endX} y={endY}>
        <Rect
          x={-4}
          y={-4}
          width={8}
          height={8}
          fill="#f59e0b"
          cornerRadius={2}
        />
      </Group>

      {/* Badge de distância */}
      <Group x={midX} y={midY}>
        {/* Background */}
        <Rect
          x={-badgeWidth / 2}
          y={-badgeHeight / 2}
          width={badgeWidth}
          height={badgeHeight}
          fill="#000"
          cornerRadius={4}
        />
        
        {/* Texto */}
        <Text
          x={-badgeWidth / 2}
          y={-badgeHeight / 2 + 4}
          width={badgeWidth}
          height={badgeHeight}
          text={`${distance}m`}
          fontSize={12}
          fontStyle="bold"
          fill="#f59e0b"
          align="center"
        />
      </Group>
    </Group>
  );
}

export default MeasurementLayer;
