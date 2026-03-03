/**
 * GridLayer - Camada de grid do mapa tático (otimizada)
 * 
 * Usa um único Shape com canvas nativo para desenhar o grid inteiro
 * em uma única operação, ao invés de criar centenas de nós React-Konva.
 * O Group é cacheado como bitmap para evitar re-renderizações desnecessárias.
 */

import { useRef, useEffect, useCallback } from 'react';
import { Group, Shape } from 'react-konva';
import Konva from 'konva';

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
  const groupRef = useRef<Konva.Group>(null);

  /**
   * Desenha o grid inteiro usando canvas 2D nativo — 
   * muito mais rápido do que criar um <Line> por célula.
   */
  const drawGrid = useCallback((ctx: Konva.Context) => {
    if (!visible || gridType === 'none') return;

    const totalWidth = widthCells * gridSize;
    const totalHeight = heightCells * gridSize;
    const nativeCtx = ctx._context;

    nativeCtx.strokeStyle = gridColor;
    nativeCtx.lineWidth = 1;

    if (gridType === 'hex') {
      nativeCtx.setLineDash([5, 5]);
    } else {
      nativeCtx.setLineDash([]);
    }

    nativeCtx.beginPath();

    // Linhas verticais
    for (let x = 0; x <= widthCells; x++) {
      const px = x * gridSize;
      nativeCtx.moveTo(px, 0);
      nativeCtx.lineTo(px, totalHeight);
    }

    // Linhas horizontais
    for (let y = 0; y <= heightCells; y++) {
      const py = y * gridSize;
      nativeCtx.moveTo(0, py);
      nativeCtx.lineTo(totalWidth, py);
    }

    nativeCtx.stroke();
  }, [gridSize, gridColor, gridType, widthCells, heightCells, visible]);

  /**
   * Cacheia o Group como bitmap após a renderização.
   * Isso faz o Konva renderizar o grid como uma imagem rasterizada,
   * eliminando o custo de re-desenhar centenas de linhas a cada frame.
   */
  useEffect(() => {
    const group = groupRef.current;
    if (!group || !visible || gridType === 'none') return;

    // Aguarda o próximo frame para garantir que o Shape foi renderizado
    requestAnimationFrame(() => {
      try {
        group.cache({
          pixelRatio: 1, // 1:1 para performance; 2 para retina se necessário
        });
        group.getLayer()?.batchDraw();
      } catch {
        // Ignora erro se o grupo não estiver mais no DOM
      }
    });

    // Limpa o cache quando as props mudam (o effect re-executa e re-cacheia)
    return () => {
      try {
        group.clearCache();
      } catch {
        // Ignora
      }
    };
  }, [gridSize, gridColor, gridType, widthCells, heightCells, visible]);

  if (!visible || gridType === 'none') return null;

  return (
    <Group ref={groupRef} listening={false}>
      <Shape
        sceneFunc={(ctx, shape) => {
          drawGrid(ctx);
          // Não chama fillStrokeShape — já fizemos stroke manual
        }}
        listening={false}
      />
    </Group>
  );
}

export default GridLayer;
