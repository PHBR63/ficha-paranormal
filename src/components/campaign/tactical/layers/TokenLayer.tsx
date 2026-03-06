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

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  /** Callback de redimensionamento do token (novo tamanho em unidades de grid) */
  onTokenResize?: (tokenId: string, newSize: number) => void;
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

/**
 * Handles de redimensionamento nos cantos do token selecionado.
 * Arraste o handle inferior-direito para alterar o tamanho.
 */
function TokenResizeHandles({
  size,
  gridSize,
  tokenSize,
  onResize,
}: {
  size: number;
  gridSize: number;
  tokenSize: number;
  onResize: (newSize: number) => void;
}) {
  const handleSize = 8;
  const handleColor = '#3b82f6';
  const handleStroke = '#fff';

  // Posições dos 4 cantos (apenas visual) + handle ativo no canto inferior-direito
  const corners = [
    { x: -handleSize / 2, y: -handleSize / 2, active: false },
    { x: size - handleSize / 2, y: -handleSize / 2, active: false },
    { x: -handleSize / 2, y: size - handleSize / 2, active: false },
    { x: size - handleSize / 2, y: size - handleSize / 2, active: true },
  ];

  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
  }, []);

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    // Calcula novo tamanho baseado na posição do handle
    const newPixelSize = Math.max(
      e.target.x() + handleSize / 2,
      e.target.y() + handleSize / 2
    );
    // Converte pixels para unidades de grid, mínimo 1, máximo 6
    const newGridSize = Math.max(1, Math.min(6, Math.round(newPixelSize / gridSize)));
    
    // Reseta a posição do handle para o lugar correto
    const finalPixel = newGridSize * gridSize;
    e.target.x(finalPixel - handleSize / 2);
    e.target.y(finalPixel - handleSize / 2);
    
    if (newGridSize !== tokenSize) {
      onResize(newGridSize);
    }
  }, [gridSize, tokenSize, onResize, handleSize]);

  return (
    <Group listening={true}>
      {corners.map((corner, i) => (
        <Rect
          key={i}
          x={corner.x}
          y={corner.y}
          width={handleSize}
          height={handleSize}
          fill={handleColor}
          stroke={handleStroke}
          strokeWidth={1}
          cornerRadius={2}
          draggable={corner.active}
          onDragStart={(e) => { e.cancelBubble = true; }}
          onDragMove={corner.active ? handleDragMove : undefined}
          onDragEnd={corner.active ? handleDragEnd : undefined}
          cursor={corner.active ? 'nwse-resize' : 'default'}
        />
      ))}
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
  onResize?: (newSize: number) => void;
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
  onResize,
}: TokenShapeProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  // Canvas proxy: é o que o Konva realmente renderiza — recebe pixels frescos a cada frame
  const [proxyCanvas, setProxyCanvas] = useState<HTMLCanvasElement | null>(null);
  const konvaImageRef = useRef<Konva.Image | null>(null);
  const konvaAnimRef = useRef<Konva.Animation | null>(null);
  // Refs para elementos DOM de mídia (não disparam re-render)
  const gifDomRef = useRef<HTMLImageElement | null>(null);
  const videoDomRef = useRef<HTMLVideoElement | null>(null);
  const proxyCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const size = token.size * gridSize;
  const color = TOKEN_COLORS[token.token_type] || '#666';

  // Detecta tipo de mídia animada (suporta URLs com query params)
  const imageUrl = token.image_url ?? '';
  const urlPath = useMemo(() => {
    try { return new URL(imageUrl).pathname.toLowerCase(); }
    catch { return imageUrl.toLowerCase(); }
  }, [imageUrl]);
  const isWebM = urlPath.endsWith('.webm');
  const isGif = urlPath.endsWith('.gif');
  const isAnimated = isWebM || isGif;

  // Carrega imagem estática do token (se não for animado)
  useEffect(() => {
    if (!token.image_url || isAnimated) {
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
  }, [token.image_url, isAnimated]);

  /**
   * Carrega mídia animada (GIF ou WebM) e cria um canvas proxy.
   * O canvas proxy recebe pixels frescos a cada frame via drawImage(),
   * garantindo que o Konva sempre renderize o frame atual da animação.
   * 
   * Fluxo: img/video → drawImage cada frame → proxyCanvas → KonvaImage
   */
  useEffect(() => {
    if (!token.image_url || !isAnimated) {
      // Limpa tudo quando não é animado
      if (konvaAnimRef.current) {
        konvaAnimRef.current.stop();
        konvaAnimRef.current = null;
      }
      if (gifDomRef.current?.parentNode) {
        gifDomRef.current.parentNode.removeChild(gifDomRef.current);
        gifDomRef.current = null;
      }
      if (videoDomRef.current) {
        videoDomRef.current.pause();
        videoDomRef.current.src = '';
        if (videoDomRef.current.parentNode) videoDomRef.current.parentNode.removeChild(videoDomRef.current);
        videoDomRef.current = null;
      }
      setProxyCanvas(null);
      proxyCtxRef.current = null;
      return;
    }

    console.log(`[TokenAnim] Carregando ${isGif ? 'GIF' : 'WebM'} para token "${token.name}":`, token.image_url);

    // Cria o canvas proxy que será a fonte do KonvaImage
    const canvas = document.createElement('canvas');

    const startAnimationLoop = (mediaEl: HTMLImageElement | HTMLVideoElement, w: number, h: number) => {
      canvas.width = Math.min(w, 512); // Limita resolução para performance
      canvas.height = Math.min(h, 512);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error(`[TokenAnim] ❌ Falha ao criar contexto 2D para "${token.name}"`);
        return;
      }
      proxyCtxRef.current = ctx;
      setProxyCanvas(canvas);
      console.log(`[TokenAnim] ✅ Proxy canvas criado para "${token.name}" (${canvas.width}x${canvas.height})`);
    };

    if (isGif) {
      // --- GIF: usa <img> no DOM ---
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      // Elemento DEVE estar visível para o browser animar frames do GIF
      // Usamos 1x1px real no canto, não -9999px (Chrome otimiza offscreen)
      img.style.cssText = 'position:fixed;bottom:0;right:0;width:1px;height:1px;pointer-events:none;z-index:-9999;opacity:0.01;';
      document.body.appendChild(img);
      gifDomRef.current = img;

      img.onload = () => {
        console.log(`[TokenAnim] ✅ GIF carregado para "${token.name}" (${img.naturalWidth}x${img.naturalHeight})`);
        startAnimationLoop(img, img.naturalWidth, img.naturalHeight);
      };
      img.onerror = (e) => {
        console.error(`[TokenAnim] ❌ Erro ao carregar GIF para "${token.name}":`, e);
      };
      img.src = token.image_url;

    } else if (isWebM) {
      // --- WebM: usa <video> no DOM ---
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.style.cssText = 'position:fixed;bottom:0;right:0;width:1px;height:1px;pointer-events:none;z-index:-9999;opacity:0.01;';
      document.body.appendChild(video);
      videoDomRef.current = video;

      video.addEventListener('loadeddata', () => {
        console.log(`[TokenAnim] ✅ WebM carregado para "${token.name}" (${video.videoWidth}x${video.videoHeight})`);
        video.play().catch(() => {});
        startAnimationLoop(video, video.videoWidth, video.videoHeight);
      });
      video.addEventListener('error', (e) => {
        console.error(`[TokenAnim] ❌ Erro ao carregar WebM para "${token.name}":`, e);
      });
      video.src = token.image_url;
      video.load();
    }

    return () => {
      // Cleanup completo
      if (konvaAnimRef.current) {
        konvaAnimRef.current.stop();
        konvaAnimRef.current = null;
      }
      if (gifDomRef.current?.parentNode) {
        gifDomRef.current.onload = null;
        gifDomRef.current.onerror = null;
        gifDomRef.current.parentNode.removeChild(gifDomRef.current);
        gifDomRef.current = null;
      }
      if (videoDomRef.current) {
        videoDomRef.current.pause();
        videoDomRef.current.src = '';
        if (videoDomRef.current.parentNode) videoDomRef.current.parentNode.removeChild(videoDomRef.current);
        videoDomRef.current = null;
      }
      setProxyCanvas(null);
      proxyCtxRef.current = null;
    };
  }, [token.image_url, isGif, isWebM, isAnimated, token.name]);

  /**
   * Inicia Konva.Animation quando o proxyCanvas estiver pronto.
   * A cada frame, copia pixels frescos da mídia para o proxy canvas,
   * então Konva redesenha o KonvaImage com os novos pixels.
   */
  useEffect(() => {
    if (!proxyCanvas) return;

    // Espera o próximo frame para garantir que o KonvaImage já montou
    const raf = requestAnimationFrame(() => {
      const node = konvaImageRef.current;
      const layer = node?.getLayer();
      const ctx = proxyCtxRef.current;
      const mediaEl = gifDomRef.current || videoDomRef.current;

      if (!layer || !ctx || !mediaEl) {
        console.warn(`[TokenAnim] ⚠️ Aguardando dependências para "${token.name}" (layer=${!!layer}, ctx=${!!ctx}, media=${!!mediaEl})`);
        // Retry após 200ms
        const retry = setTimeout(() => {
          const retryLayer = konvaImageRef.current?.getLayer();
          if (retryLayer && proxyCtxRef.current && (gifDomRef.current || videoDomRef.current)) {
            const retryMedia = (gifDomRef.current || videoDomRef.current)!;
            const anim = new Konva.Animation(() => {
              proxyCtxRef.current?.clearRect(0, 0, proxyCanvas.width, proxyCanvas.height);
              proxyCtxRef.current?.drawImage(retryMedia, 0, 0, proxyCanvas.width, proxyCanvas.height);
            }, retryLayer);
            anim.start();
            konvaAnimRef.current = anim;
            console.log(`[TokenAnim] 🎬 Animação iniciada (retry) para "${token.name}"`);
          } else {
            console.error(`[TokenAnim] ❌ Não foi possível iniciar animação para "${token.name}" após retry`);
          }
        }, 200);
        return () => clearTimeout(retry);
      }

      console.log(`[TokenAnim] 🎬 Iniciando Konva.Animation com proxy canvas para "${token.name}"`);
      const anim = new Konva.Animation(() => {
        // Copia frame atual da mídia para o proxy canvas
        ctx.clearRect(0, 0, proxyCanvas.width, proxyCanvas.height);
        ctx.drawImage(mediaEl, 0, 0, proxyCanvas.width, proxyCanvas.height);
      }, layer);
      anim.start();
      konvaAnimRef.current = anim;
    });

    return () => {
      cancelAnimationFrame(raf);
      if (konvaAnimRef.current) {
        konvaAnimRef.current.stop();
        konvaAnimRef.current = null;
        console.log(`[TokenAnim] ⏹️ Animação parada para "${token.name}"`);
      }
    };
  }, [proxyCanvas, token.name]);

  // Handlers de drag - cancela bubble para não mover o Stage junto
  const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    onDragStart();
  }, [onDragStart]);

  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const x = Math.floor(e.target.x() / gridSize);
    const y = Math.floor(e.target.y() / gridSize);
    onDragMove(x, y);
  }, [gridSize, onDragMove]);

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const x = Math.round(e.target.x() / gridSize);
    const y = Math.round(e.target.y() / gridSize);
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

      {/* Token animado (GIF ou WebM) — usa proxyCanvas como fonte */}
      {isAnimated && proxyCanvas ? (
        <Group clipFunc={(ctx) => {
          ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
        }}>
          <KonvaImage
            ref={(node) => { konvaImageRef.current = node; }}
            image={proxyCanvas as unknown as HTMLImageElement}
            x={0}
            y={0}
            width={size}
            height={size}
          />
        </Group>
      ) : image ? (
        /* Token com imagem estática */
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
        /* Token sem imagem (círculo colorido) */
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

      {/* Handles de redimensionamento (visíveis quando selecionado e pode editar) */}
      {isSelected && canDrag && onResize && (
        <TokenResizeHandles
          size={size}
          gridSize={gridSize}
          tokenSize={token.size}
          onResize={onResize}
        />
      )}
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
  onTokenResize,
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
          onResize={onTokenResize ? (newSize) => onTokenResize(token.id, newSize) : undefined}
        />
      ))}
    </Layer>
  );
}

export default TokenLayer;
