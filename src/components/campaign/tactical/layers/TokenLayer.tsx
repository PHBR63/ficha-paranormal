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

import { useState, useEffect, useCallback, useRef } from 'react';
import { Layer, Group, Circle, Text, Rect, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { MapToken } from '@/hooks/campaign/useTacticalBoard';

interface TokenLayerProps {
  tokens: MapToken[];
  gridSize: number;
  selectedTokenId: string | null;
  isMaster: boolean;
  /** Desabilita interação (quando outra ferramenta está ativa) */
  listening?: boolean;
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

// Cores das barras de recurso
const BAR_COLORS = {
  hp: { fill: '#ef4444', bg: '#450a0a' },   // Vermelho (PV)
  san: { fill: '#3b82f6', bg: '#172554' },   // Azul (SAN)
  pe: { fill: '#a855f7', bg: '#3b0764' },    // Roxo (PE)
};

/**
 * Barras de recurso (PV/SAN/PE) renderizadas abaixo do token
 */
function TokenResourceBars({ token, size }: { token: MapToken; size: number }) {
  const barWidth = size - 4;
  const barHeight = 3;
  const barSpacing = 1;
  const startY = size + 2;
  const startX = 2;

  const bars = [
    { current: token.hp_current ?? 0, max: token.hp_max ?? 1, color: BAR_COLORS.hp },
    { current: token.san_current ?? 0, max: token.san_max ?? 1, color: BAR_COLORS.san },
    { current: token.pe_current ?? 0, max: token.pe_max ?? 1, color: BAR_COLORS.pe },
  ];

  return (
    <Group listening={false}>
      {bars.map((bar, i) => {
        const ratio = Math.max(0, Math.min(1, bar.current / bar.max));
        const y = startY + i * (barHeight + barSpacing);
        return (
          <Group key={i}>
            {/* Fundo da barra */}
            <Rect
              x={startX}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={bar.color.bg}
              cornerRadius={1}
            />
            {/* Preenchimento */}
            <Rect
              x={startX}
              y={y}
              width={barWidth * ratio}
              height={barHeight}
              fill={bar.color.fill}
              cornerRadius={1}
            />
          </Group>
        );
      })}
    </Group>
  );
}

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const konvaImageRef = useRef<Konva.Image | null>(null);
  
  const size = token.size * gridSize;
  const color = TOKEN_COLORS[token.token_type] || '#666';

  // Detecta se é WebM (animado)
  const isWebM = token.image_url?.toLowerCase().endsWith('.webm') ?? false;

  // Carrega imagem estática do token (se não for WebM)
  useEffect(() => {
    if (!token.image_url || isWebM) {
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
  }, [token.image_url, isWebM]);

  // Carrega vídeo WebM e anima frame a frame
  useEffect(() => {
    if (!token.image_url || !isWebM) {
      // Limpa vídeo anterior se existir
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      return;
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = token.image_url;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    videoRef.current = video;

    // Função de animação: pinta cada frame do vídeo no canvas Konva
    const animate = () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      // Força re-draw da camada Konva para atualizar o frame do vídeo
      const layer = konvaImageRef.current?.getLayer();
      if (layer) {
        layer.batchDraw();
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    video.addEventListener('loadeddata', () => {
      video.play().catch(() => {});
      animFrameRef.current = requestAnimationFrame(animate);
    });

    video.load();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      video.pause();
      video.src = '';
      videoRef.current = null;
    };
  }, [token.image_url, isWebM]);

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

      {/* Círculo do token (imagem estática, WebM animado, ou cor sólida) */}
      {isWebM && videoRef.current ? (
        // Token WebM animado — usa <video> como source do KonvaImage
        <Group clipFunc={(ctx) => {
          ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        }}>
          <KonvaImage
            ref={(node) => { konvaImageRef.current = node; }}
            image={videoRef.current as unknown as HTMLImageElement}
            x={0}
            y={0}
            width={size}
            height={size}
          />
        </Group>
      ) : image ? (
        // Token com imagem estática
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

      {/* Barras de recurso PV/PE/SAN (Fase B) */}
      {token.character_id && token.hp_max != null && token.hp_max > 0 && (
        <TokenResourceBars
          token={token}
          size={size}
        />
      )}

      {/* Nome do token */}
      <Text
        x={0}
        y={size + (token.character_id && token.hp_max ? 18 : 4)}
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
  listening = true,
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
    <Layer listening={listening}>
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
