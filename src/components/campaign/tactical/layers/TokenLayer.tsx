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
   * 
   * Para GIF: usa ImageDecoder API (WebCodecs) para decodificar frame a frame
   * de forma confiável, sem depender do browser animar o <img>.
   * Fallback: usa <img> visível atrás do canvas para browsers sem ImageDecoder.
   * 
   * Para WebM: usa <video> com autoplay.
   */
  useEffect(() => {
    if (!token.image_url || !isAnimated) {
      // Limpa tudo quando não é animado
      if (konvaAnimRef.current) {
        konvaAnimRef.current.stop();
        konvaAnimRef.current = null;
      }
      cleanupDomElements();
      setProxyCanvas(null);
      proxyCtxRef.current = null;
      return;
    }

    let cancelled = false;
    const canvas = document.createElement('canvas');

    console.log(`[TokenAnim] Carregando ${isGif ? 'GIF' : 'WebM'} para token "${token.name}":`, token.image_url);

    if (isGif) {
      // --- GIF: usa ImageDecoder API se disponível ---
      if ('ImageDecoder' in window) {
        loadGifWithImageDecoder(token.image_url, token.name, canvas, cancelled);
      } else {
        loadGifWithFallback(token.image_url, token.name, canvas, cancelled);
      }
    } else if (isWebM) {
      loadWebM(token.image_url, token.name, canvas, cancelled);
    }

    return () => {
      cancelled = true;
      if (konvaAnimRef.current) {
        konvaAnimRef.current.stop();
        konvaAnimRef.current = null;
      }
      // Limpa timer de frames GIF
      if (gifFrameTimerRef.current) {
        clearTimeout(gifFrameTimerRef.current);
        gifFrameTimerRef.current = null;
      }
      cleanupDomElements();
      setProxyCanvas(null);
      proxyCtxRef.current = null;
    };
  }, [token.image_url, isGif, isWebM, isAnimated, token.name]);

  // Ref para timer de frames do GIF (ImageDecoder)
  const gifFrameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref para ImageDecoder
  const imageDecoderRef = useRef<any>(null);

  /** Limpa elementos DOM auxiliares (img/video ocultos) */
  const cleanupDomElements = useCallback(() => {
    if (gifDomRef.current) {
      gifDomRef.current.onload = null;
      gifDomRef.current.onerror = null;
      const parent = gifDomRef.current.parentNode;
      if (parent?.parentNode) parent.parentNode.removeChild(parent);
      else if (gifDomRef.current.parentNode) gifDomRef.current.parentNode.removeChild(gifDomRef.current);
      gifDomRef.current = null;
    }
    if (videoDomRef.current) {
      videoDomRef.current.pause();
      videoDomRef.current.src = '';
      if (videoDomRef.current.parentNode) videoDomRef.current.parentNode.removeChild(videoDomRef.current);
      videoDomRef.current = null;
    }
    if (imageDecoderRef.current) {
      try { imageDecoderRef.current.close?.(); } catch {}
      imageDecoderRef.current = null;
    }
  }, []);

  /**
   * Carrega GIF usando ImageDecoder API (WebCodecs) — decodifica frame a frame.
   * Funciona em Chrome 94+, Edge 94+. Não depende da visibilidade do elemento.
   */
  const loadGifWithImageDecoder = useCallback(async (
    url: string, name: string, canvas: HTMLCanvasElement, cancelled: boolean
  ) => {
    try {
      // Busca o GIF completo como ArrayBuffer para garantir que todos os frames estejam disponíveis
      const response = await fetch(url);
      if (cancelled) return;
      const arrayBuffer = await response.arrayBuffer();
      if (cancelled) return;

      const decoder = new (window as any).ImageDecoder({
        data: new Uint8Array(arrayBuffer),
        type: 'image/gif',
      });
      imageDecoderRef.current = decoder;

      // Aguarda o decoder processar completamente o blob
      await decoder.tracks.ready;
      if (cancelled) { decoder.close(); return; }

      // Aguarda decoder.completed para garantir que TODOS os frames foram parseados
      await decoder.completed;
      if (cancelled) { decoder.close(); return; }

      const track = decoder.tracks.selectedTrack;
      const frameCount = track.frameCount;
      console.log(`[TokenAnim] ✅ GIF decodificado para "${name}" — ${frameCount} frames (completo)`);

      // Se for GIF estático (1 frame), trata como imagem normal
      if (frameCount <= 1) {
        const firstFrame = await decoder.decode({ frameIndex: 0 });
        if (cancelled) { firstFrame.image.close(); decoder.close(); return; }
        const w = firstFrame.image.displayWidth;
        const h = firstFrame.image.displayHeight;
        canvas.width = Math.min(w, 512);
        canvas.height = Math.min(h, 512);
        const ctx = canvas.getContext('2d');
        if (!ctx) { firstFrame.image.close(); return; }
        proxyCtxRef.current = ctx;
        ctx.drawImage(firstFrame.image, 0, 0, canvas.width, canvas.height);
        firstFrame.image.close();
        setProxyCanvas(canvas);
        console.log(`[TokenAnim] ℹ️ GIF estático para "${name}" — renderizado como imagem fixa`);
        return;
      }

      // Configura canvas proxy com dimensões do primeiro frame
      const firstFrame = await decoder.decode({ frameIndex: 0 });
      if (cancelled) { firstFrame.image.close(); decoder.close(); return; }
      
      const w = firstFrame.image.displayWidth;
      const h = firstFrame.image.displayHeight;
      canvas.width = Math.min(w, 512);
      canvas.height = Math.min(h, 512);
      const ctx = canvas.getContext('2d');
      if (!ctx) { firstFrame.image.close(); return; }
      proxyCtxRef.current = ctx;
      setProxyCanvas(canvas);

      // Desenha primeiro frame
      ctx.drawImage(firstFrame.image, 0, 0, canvas.width, canvas.height);
      firstFrame.image.close();

      let frameIndex = 0;

      // Loop de frames — usa setTimeout com duração real de cada frame
      const drawNextFrame = async () => {
        if (cancelled) return;
        try {
          frameIndex = (frameIndex + 1) % frameCount;
          const result = await decoder.decode({ frameIndex });
          if (cancelled) { result.image.close(); return; }

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(result.image, 0, 0, canvas.width, canvas.height);

          // Duração do frame em microsegundos → milissegundos
          const durationMs = Math.max((result.image.duration || 100000) / 1000, 16);
          result.image.close();

          gifFrameTimerRef.current = setTimeout(drawNextFrame, durationMs);
        } catch (e) {
          // Frame pode não estar disponível, retry
          if (!cancelled) {
            gifFrameTimerRef.current = setTimeout(drawNextFrame, 100);
          }
        }
      };

      // Inicia loop após duração do primeiro frame
      gifFrameTimerRef.current = setTimeout(drawNextFrame, 100);
      console.log(`[TokenAnim] 🎬 Loop de frames ImageDecoder iniciado para "${name}"`);

    } catch (error) {
      console.error(`[TokenAnim] ❌ ImageDecoder falhou para "${name}":`, error);
      // Fallback para método <img>
      if (!cancelled) loadGifWithFallback(url, name, canvas, cancelled);
    }
  }, []);

  /**
   * Fallback: carrega GIF via <img> visível no DOM (para browsers sem ImageDecoder).
   * Posiciona a img em tamanho real mas com z-index: -1 (atrás do canvas).
   */
  const loadGifWithFallback = useCallback((
    url: string, name: string, canvas: HTMLCanvasElement, cancelled: boolean
  ) => {
    if (cancelled || !document.body) return;
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    // Imagem visível no viewport, tamanho real, atrás de tudo
    img.style.cssText = 'position:fixed;left:0;top:0;width:200px;height:200px;z-index:-1;pointer-events:none;opacity:1;';
    document.body.appendChild(img);
    gifDomRef.current = img;

    img.onload = () => {
      if (cancelled) return;
      console.log(`[TokenAnim] ✅ GIF (fallback) carregado para "${name}" (${img.naturalWidth}x${img.naturalHeight})`);
      canvas.width = Math.min(img.naturalWidth, 512);
      canvas.height = Math.min(img.naturalHeight, 512);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      proxyCtxRef.current = ctx;
      setProxyCanvas(canvas);
    };
    img.onerror = (e) => {
      console.error(`[TokenAnim] ❌ Erro ao carregar GIF (fallback) para "${name}":`, e);
    };
    img.src = url;
  }, []);

  /** Carrega WebM via <video> */
  const loadWebM = useCallback((
    url: string, name: string, canvas: HTMLCanvasElement, cancelled: boolean
  ) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;pointer-events:none;z-index:-1;opacity:0.01;';
    document.body.appendChild(video);
    videoDomRef.current = video;

    video.addEventListener('loadeddata', () => {
      if (cancelled) return;
      console.log(`[TokenAnim] ✅ WebM carregado para "${name}" (${video.videoWidth}x${video.videoHeight})`);
      video.play().catch(() => {});
      canvas.width = Math.min(video.videoWidth, 512);
      canvas.height = Math.min(video.videoHeight, 512);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      proxyCtxRef.current = ctx;
      setProxyCanvas(canvas);
    });
    video.addEventListener('error', (e) => {
      console.error(`[TokenAnim] ❌ Erro ao carregar WebM para "${name}":`, e);
    });
    video.src = url;
    video.load();
  }, []);

  /**
   * Inicia Konva.Animation para atualizar o canvas proxy.
   * Para ImageDecoder (GIF): só precisa de batchDraw periódico (frames já são escritos pelo timer).
   * Para fallback (GIF <img>) ou WebM (<video>): copia pixels da mídia a cada frame.
   */
  useEffect(() => {
    if (!proxyCanvas) return;

    const raf = requestAnimationFrame(() => {
      const node = konvaImageRef.current;
      const layer = node?.getLayer();
      if (!layer) {
        // Retry
        const retry = setTimeout(() => {
          const retryLayer = konvaImageRef.current?.getLayer();
          if (retryLayer) startKonvaAnim(retryLayer);
        }, 200);
        return () => clearTimeout(retry);
      }
      startKonvaAnim(layer);
    });

    function startKonvaAnim(layer: Konva.Layer) {
      const mediaEl = gifDomRef.current || videoDomRef.current;
      const ctx = proxyCtxRef.current;

      if (imageDecoderRef.current) {
        // ImageDecoder: frames já são escritos pelo timer, só precisa batchDraw
        console.log(`[TokenAnim] 🎬 batchDraw loop (ImageDecoder) para "${token.name}"`);
        const anim = new Konva.Animation(() => {
          // Noop — o timer do ImageDecoder já escreve no canvas
        }, layer);
        anim.start();
        konvaAnimRef.current = anim;
      } else if (mediaEl && ctx) {
        // Fallback: copia pixels da mídia (img/video) para o proxy canvas
        console.log(`[TokenAnim] 🎬 Konva.Animation (fallback) para "${token.name}"`);
        const anim = new Konva.Animation(() => {
          ctx.clearRect(0, 0, proxyCanvas.width, proxyCanvas.height);
          ctx.drawImage(mediaEl, 0, 0, proxyCanvas.width, proxyCanvas.height);
        }, layer);
        anim.start();
        konvaAnimRef.current = anim;
      } else {
        console.warn(`[TokenAnim] ⚠️ Sem mídia para animar "${token.name}"`);
      }
    }

    return () => {
      cancelAnimationFrame(raf);
      if (konvaAnimRef.current) {
        konvaAnimRef.current.stop();
        konvaAnimRef.current = null;
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
