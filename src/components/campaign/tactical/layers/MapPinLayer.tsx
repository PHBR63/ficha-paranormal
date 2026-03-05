/**
 * MapPinLayer - Camada de pins (notas/handouts) no mapa tático (Fase F)
 * 
 * Renderiza ícones clicáveis em coordenadas do grid.
 * Pins do mestre com visibility='master' têm visual diferenciado.
 */

import { memo, useCallback } from 'react';
import { Layer, Group, Circle, Text, Rect } from 'react-konva';
import type { MapPin } from '@/hooks/campaign/useMapPins';

interface MapPinLayerProps {
  pins: MapPin[];
  gridSize: number;
  isMaster: boolean;
  selectedPinId: string | null;
  listening?: boolean;
  onPinClick?: (pinId: string) => void;
  onPinDrag?: (pinId: string, newX: number, newY: number) => void;
}

/** Renderiza um pin individual */
const PinShape = memo(function PinShape({
  pin,
  gridSize,
  isSelected,
  isMaster,
  onPinClick,
  onPinDrag,
}: {
  pin: MapPin;
  gridSize: number;
  isSelected: boolean;
  isMaster: boolean;
  onPinClick?: (pinId: string) => void;
  onPinDrag?: (pinId: string, newX: number, newY: number) => void;
}) {
  // Centro da célula
  const cx = pin.x * gridSize + gridSize / 2;
  const cy = pin.y * gridSize + gridSize / 2;

  const handleClick = useCallback(() => {
    onPinClick?.(pin.id);
  }, [pin.id, onPinClick]);

  const handleDragEnd = useCallback((e: any) => {
    if (!onPinDrag) return;
    const newCellX = Math.round((e.target.x() - gridSize / 2) / gridSize);
    const newCellY = Math.round((e.target.y() - gridSize / 2) / gridSize);
    // Snap para grid
    e.target.x(newCellX * gridSize + gridSize / 2);
    e.target.y(newCellY * gridSize + gridSize / 2);
    onPinDrag(pin.id, newCellX, newCellY);
  }, [pin.id, gridSize, onPinDrag]);

  // Visual: master-only pins ficam semitransparentes para o mestre
  const isMasterOnly = pin.visibility === 'master';
  const opacity = isMasterOnly ? 0.6 : 1;

  return (
    <Group
      x={cx}
      y={cy}
      draggable={!!onPinDrag}
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleDragEnd}
      opacity={opacity}
    >
      {/* Sombra de seleção */}
      {isSelected && (
        <Circle
          radius={16}
          stroke={pin.color}
          strokeWidth={2}
          dash={[4, 2]}
          listening={false}
        />
      )}

      {/* Fundo circular do pin */}
      <Circle
        radius={12}
        fill={pin.color}
        stroke={isSelected ? '#ffffff' : '#00000066'}
        strokeWidth={isSelected ? 2 : 1}
        shadowColor="#000000"
        shadowBlur={4}
        shadowOpacity={0.4}
        shadowOffsetY={2}
      />

      {/* Ícone do pin (emoji) */}
      <Text
        text={pin.icon}
        fontSize={14}
        x={-7}
        y={-8}
        listening={false}
      />

      {/* Título abaixo do pin */}
      {pin.title && (
        <Group y={16} listening={false}>
          {/* Fundo do texto para legibilidade */}
          <Rect
            x={-40}
            y={-2}
            width={80}
            height={14}
            fill="#000000aa"
            cornerRadius={3}
          />
          <Text
            text={pin.title}
            fontSize={10}
            fill="#ffffff"
            fontStyle="bold"
            x={-40}
            y={0}
            width={80}
            align="center"
            ellipsis={true}
            wrap="none"
          />
        </Group>
      )}

      {/* Indicador de master-only */}
      {isMasterOnly && isMaster && (
        <Text
          text="🔒"
          fontSize={9}
          x={6}
          y={-16}
          listening={false}
        />
      )}

      {/* Indicador de handout */}
      {pin.pin_type === 'handout' && (
        <Text
          text="📄"
          fontSize={9}
          x={-14}
          y={-16}
          listening={false}
        />
      )}
    </Group>
  );
});

export const MapPinLayer = memo(function MapPinLayer({
  pins,
  gridSize,
  isMaster,
  selectedPinId,
  listening = true,
  onPinClick,
  onPinDrag,
}: MapPinLayerProps) {
  // Filtra: jogadores só veem pins com visibility='all'
  const visiblePins = isMaster ? pins : pins.filter(p => p.visibility === 'all');

  if (visiblePins.length === 0) return null;

  return (
    <Layer listening={listening}>
      {visiblePins.map(pin => (
        <PinShape
          key={pin.id}
          pin={pin}
          gridSize={gridSize}
          isSelected={selectedPinId === pin.id}
          isMaster={isMaster}
          onPinClick={onPinClick}
          onPinDrag={onPinDrag}
        />
      ))}
    </Layer>
  );
});

export default MapPinLayer;
