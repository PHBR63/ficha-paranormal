/**
 * FogOfWarLayer - Camada de névoa de guerra (otimizada)
 * 
 * Usa Shape com canvas nativo + cache bitmap para performance.
 * Em vez de criar centenas de <Rect> individuais, desenha tudo
 * em uma única operação canvas e cacheia como imagem rasterizada.
 */

import { useRef, useEffect, useMemo, useCallback } from 'react';
import { Group, Shape } from 'react-konva';
import Konva from 'konva';

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
  const groupRef = useRef<Konva.Group>(null);

  // Set para lookup rápido de células reveladas
  const revealedSet = useMemo(() => {
    return new Set(revealedCells.map((c) => `${c.x}-${c.y}`));
  }, [revealedCells]);

  const cols = Math.ceil(mapWidth / gridSize);
  const rows = Math.ceil(mapHeight / gridSize);

  /**
   * Desenha a névoa para jogadores usando canvas nativo.
   * Pinta tudo de escuro e pula as células reveladas.
   */
  const drawPlayerFog = useCallback((ctx: Konva.Context) => {
    const nativeCtx = ctx._context;
    nativeCtx.fillStyle = 'rgba(10, 10, 15, 0.92)';

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if (!revealedSet.has(`${x}-${y}`)) {
          nativeCtx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
        }
      }
    }
  }, [cols, rows, gridSize, revealedSet]);

  /**
   * Desenha indicadores de células reveladas para o mestre.
   */
  const drawMasterOverlay = useCallback((ctx: Konva.Context) => {
    const nativeCtx = ctx._context;

    nativeCtx.fillStyle = 'rgba(0, 200, 100, 0.1)';
    nativeCtx.strokeStyle = 'rgba(0, 200, 100, 0.3)';
    nativeCtx.lineWidth = 1;

    for (const cell of revealedCells) {
      const px = cell.x * gridSize;
      const py = cell.y * gridSize;
      nativeCtx.fillRect(px, py, gridSize, gridSize);
      nativeCtx.strokeRect(px, py, gridSize, gridSize);
    }
  }, [revealedCells, gridSize]);

  /**
   * Cacheia o Group como bitmap após renderização.
   */
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const shouldRender = isMaster
      ? revealedCells.length > 0
      : visible;

    if (!shouldRender) return;

    requestAnimationFrame(() => {
      try {
        group.cache({ pixelRatio: 1 });
        group.getLayer()?.batchDraw();
      } catch {
        // Ignora se o grupo não estiver mais no DOM
      }
    });

    return () => {
      try {
        group.clearCache();
      } catch {
        // Ignora
      }
    };
  }, [revealedCells, gridSize, mapWidth, mapHeight, isMaster, visible]);

  // Mestre sem células reveladas — nada a mostrar
  if (isMaster && revealedCells.length === 0) return null;

  // Jogador com fog desabilitado
  if (!isMaster && !visible) return null;

  return (
    <Group ref={groupRef} listening={false}>
      <Shape
        sceneFunc={(ctx) => {
          if (isMaster) {
            drawMasterOverlay(ctx);
          } else {
            drawPlayerFog(ctx);
          }
        }}
        listening={false}
      />
    </Group>
  );
}

export default FogOfWarLayer;
