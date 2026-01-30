/**
 * TokenLayer - Camada de tokens arrastáveis
 * 
 * Renderiza tokens de personagens, criaturas e objetos.
 * Suporta:
 * - Drag and drop nativo
 * - Seleção de tokens
 * - Auras de luz
 * - Badges de condições
 */

import { useState, useEffect, useCallback } from 'react';
import { Layer, Group, Circle, Text, Rect, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { MapToken } from '@/hooks/campaign/useTacticalBoard';

interface TokenLayerProps {
  tokens: MapToken[];
  gridSize: number;
  selectedTokenId: string | null;
  isMaster: boolean;
  onTokenSelect: (tokenId: string | null) => void;
  onTokenDragStart?: (token: MapToken) => void;
  onTokenDragMove?: (token: MapToken, newX: number, newY: number) => void;
  onTokenDragEnd: (tokenId: string, newX: number, newY: number) => void;
  onTokenDoubleClick?: (token: MapToken) => void;
}

// Cores por tipo de token
const TOKEN_COLORS: Record<string, string> = {
  pc: '#3b82f6',
  npc: '#22c55e',
  creature: '#ef4444',
  object: '#a855f7',
  marker: '#f59e0b',
};

interface TokenShapeProps {
  token: MapToken;
  gridSize: number;
  isSelected: boolean;
  isMaster: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDoubleClick?: () => void;
}

/**
 * Componente individual de token
 */
function TokenShape({
  token,
  gridSize,
  isSelected,
  isMaster,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDoubleClick,
}: TokenShapeProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  
  const size = token.size * gridSize;
  const color = TOKEN_COLORS[token.token_type] || '#666';

  // Carrega imagem do token (se houver)
  useEffect(() => {
    if (!token.image_url) {
      setImage(null);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = token.image_url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [token.image_url]);

  // Handlers de drag
  // Handler de drag - cancela bubble para não mover o Stage junto
  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true; // Impede propagação para o Stage
    onDragStart();
  }, [onDragStart]);

  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true; // Impede propagação para o Stage
    const x = Math.floor(e.target.x() / gridSize);
    const y = Math.floor(e.target.y() / gridSize);
    onDragMove(x, y);
  }, [gridSize, onDragMove]);

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true; // Impede propagação para o Stage
    
    // Snap to grid
    const x = Math.round(e.target.x() / gridSize);
    const y = Math.round(e.target.y() / gridSize);
    
    // Atualiza posição visual para encaixar no grid
    e.target.x(x * gridSize);
    e.target.y(y * gridSize);
    
    onDragEnd(x, y);
  }, [gridSize, onDragEnd]);

  // Verifica se pode arrastar
  const canDrag = !token.locked && (isMaster || token.token_type === 'pc');

  return (
    <Group
      x={token.x * gridSize}
      y={token.y * gridSize}
      draggable={canDrag}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onDoubleClick}
      onDblTap={onDoubleClick}
    >
      {/* Aura de luz (renderizada primeiro, atrás do token) */}
      {token.light_radius > 0 && (
        <Circle
          x={size / 2}
          y={size / 2}
          radius={token.light_radius * gridSize}
          fillRadialGradientStartPoint={{ x: 0, y: 0 }}
          fillRadialGradientEndPoint={{ x: 0, y: 0 }}
          fillRadialGradientStartRadius={size / 2}
          fillRadialGradientEndRadius={token.light_radius * gridSize}
          fillRadialGradientColorStops={[0, token.light_color + '40', 1, 'transparent']}
          listening={false}
        />
      )}

      {/* Círculo do token (ou imagem) */}
      {image ? (
        // Token com imagem
        <Group clipFunc={(ctx) => {
          ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        }}>
          <KonvaImage
            image={image}
            x={0}
            y={0}
            width={size}
            height={size}
          />
        </Group>
      ) : (
        // Token sem imagem (círculo colorido)
        <Circle
          x={size / 2}
          y={size / 2}
          radius={size / 2 - 2}
          fill={color}
        />
      )}

      {/* Borda do token (seleção) */}
      <Circle
        x={size / 2}
        y={size / 2}
        radius={size / 2 - 2}
        stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.5)'}
        strokeWidth={isSelected ? 3 : 2}
        listening={false}
      />

      {/* Indicador de locked (apenas para mestre) */}
      {token.locked && isMaster && (
        <Text
          x={2}
          y={2}
          text="🔒"
          fontSize={12}
          listening={false}
        />
      )}

      {/* Badge de condições */}
      {token.conditions.length > 0 && (
        <Group x={size - 10} y={2}>
          <Circle
            radius={8}
            fill="#f59e0b"
          />
          <Text
            x={-4}
            y={-5}
            text={token.conditions.length.toString()}
            fontSize={10}
            fontStyle="bold"
            fill="#000"
            listening={false}
          />
        </Group>
      )}

      {/* Nome do token */}
      <Text
        x={0}
        y={size + 4}
        width={size}
        text={token.name.substring(0, 10)}
        fontSize={11}
        fontStyle="bold"
        fill="#fff"
        align="center"
        shadowColor="#000"
        shadowBlur={3}
        listening={false}
      />
    </Group>
  );
}

export function TokenLayer({
  tokens,
  gridSize,
  selectedTokenId,
  isMaster,
  onTokenSelect,
  onTokenDragStart,
  onTokenDragMove,
  onTokenDragEnd,
  onTokenDoubleClick,
}: TokenLayerProps) {
  // Ordena tokens: selecionado por último (em cima)
  const sortedTokens = [...tokens].sort((a, b) => {
    if (a.id === selectedTokenId) return 1;
    if (b.id === selectedTokenId) return -1;
    return 0;
  });

  return (
    <Layer>
      {sortedTokens.map((token) => (
        <TokenShape
          key={token.id}
          token={token}
          gridSize={gridSize}
          isSelected={token.id === selectedTokenId}
          isMaster={isMaster}
          onSelect={() => onTokenSelect(token.id)}
          onDragStart={() => onTokenDragStart?.(token)}
          onDragMove={(x, y) => onTokenDragMove?.(token, x, y)}
          onDragEnd={(x, y) => onTokenDragEnd(token.id, x, y)}
          onDoubleClick={() => onTokenDoubleClick?.(token)}
        />
      ))}
    </Layer>
  );
}

export default TokenLayer;
