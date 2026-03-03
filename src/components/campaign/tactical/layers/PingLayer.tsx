/**
 * PingLayer - Camada de pings animados
 * 
 * Renderiza marcadores temporários com animação pulsante.
 * Pings desaparecem automaticamente após alguns segundos.
 */

import { useEffect, useState } from 'react';
import { Circle, Group } from 'react-konva';
import { BoardPing } from '@/hooks/campaign/useTacticalBoard';

interface PingLayerProps {
  pings: BoardPing[];
  gridSize: number;
}

interface AnimatedPingProps {
  ping: BoardPing;
  gridSize: number;
}

/**
 * Componente individual de ping com animação
 */
function AnimatedPing({ ping, gridSize }: AnimatedPingProps) {
  const [animState, setAnimState] = useState({ scale: 1, opacity: 1 });

  useEffect(() => {
    let animationFrame: number;
    
    const animate = () => {
      const age = Date.now() - ping.createdAt;
      const scale = 1 + Math.sin(age / 100) * 0.2;
      const opacity = Math.max(0, 1 - age / 3000);
      
      setAnimState({ scale, opacity });
      
      if (opacity > 0) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [ping.createdAt]);

  const centerX = ping.x * gridSize + gridSize / 2;
  const centerY = ping.y * gridSize + gridSize / 2;

  return (
    <Group
      x={centerX}
      y={centerY}
      scaleX={animState.scale}
      scaleY={animState.scale}
      opacity={animState.opacity}
    >
      {/* Círculo externo (anel pulsante) */}
      <Circle
        radius={15}
        stroke={ping.color}
        strokeWidth={3}
        listening={false}
      />
      
      {/* Círculo interno (ponto central) */}
      <Circle
        radius={5}
        fill={ping.color}
        listening={false}
      />
    </Group>
  );
}

export function PingLayer({ pings, gridSize }: PingLayerProps) {
  // Filtra pings que ainda estão visíveis (menos de 3 segundos)
  const [visiblePings, setVisiblePings] = useState<BoardPing[]>([]);

  useEffect(() => {
    const updatePings = () => {
      const now = Date.now();
      const active = pings.filter((p) => now - p.createdAt < 3000);
      setVisiblePings(active);
    };

    updatePings();
    const interval = setInterval(updatePings, 100);
    
    return () => clearInterval(interval);
  }, [pings]);

  if (visiblePings.length === 0) return null;

  return (
    <Group listening={false}>
      {visiblePings.map((ping) => (
        <AnimatedPing key={ping.id} ping={ping} gridSize={gridSize} />
      ))}
    </Group>
  );
}

export default PingLayer;
