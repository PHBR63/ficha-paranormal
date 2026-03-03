/**
 * BackgroundLayer - Camada de imagem de fundo do mapa
 * 
 * Carrega e renderiza a imagem de fundo do mapa tático.
 * Suporta fallback para cor de fundo quando não há imagem.
 */

import { useEffect, useState } from 'react';
import { Group, Rect, Image as KonvaImage } from 'react-konva';

interface BackgroundLayerProps {
  imageUrl: string | null;
  width: number;
  height: number;
  fallbackColor?: string;
}

export function BackgroundLayer({ 
  imageUrl, 
  width, 
  height,
  fallbackColor = 'rgba(20, 20, 30, 0.95)',
}: BackgroundLayerProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  // Carrega a imagem quando a URL muda
  useEffect(() => {
    if (!imageUrl) {
      setImage(null);
      setError(false);
      return;
    }

    setIsLoading(true);
    setError(false);

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      setImage(img);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setImage(null);
      setError(true);
      setIsLoading(false);
    };
    
    img.src = imageUrl;

    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  return (
    <Group listening={false}>
      {/* Fundo padrão (fallback ou quando não há imagem) */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={fallbackColor}
      />

      {/* Imagem de fundo (quando carregada) */}
      {image && !error && (
        <KonvaImage
          image={image}
          x={0}
          y={0}
          width={width}
          height={height}
        />
      )}

      {/* Indicador de erro (opcional, pode ser estilizado) */}
      {error && (
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="rgba(50, 20, 20, 0.9)"
        />
      )}
    </Group>
  );
}

export default BackgroundLayer;
