/**
 * PingLayer - Camada de pings avançados (Fase E)
 * 
 * Renderiza 3 tipos de ping no mapa:
 * - normal: Círculo pulsante padrão
 * - alert: Alerta vermelho com ondas expandindo + ícone ⚠
 * - camera_sync: Ícone de olho + destaque na posição
 * 
 * Também exibe mensagem de texto se presente.
 */

import { useEffect, useState } from 'react';
import { Circle, Group, Text, RegularPolygon, Ring } from 'react-konva';
import type { BoardPing } from '@/hooks/campaign/useTacticalBoard';

// Re-exporta para compat
type AdvancedPing = BoardPing;

interface PingLayerProps {
  pings: BoardPing[];
  gridSize: number;
}

interface AnimatedPingProps {
  ping: BoardPing;
  gridSize: number;
}

/**
 * Ping normal - círculo pulsante simples
 */
function NormalPing({ ping, gridSize }: AnimatedPingProps) {
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
    return () => cancelAnimationFrame(animationFrame);
  }, [ping.createdAt]);

  const cx = ping.x * gridSize + gridSize / 2;
  const cy = ping.y * gridSize + gridSize / 2;

  return (
    <Group x={cx} y={cy} scaleX={animState.scale} scaleY={animState.scale} opacity={animState.opacity}>
      <Circle radius={15} stroke={ping.color} strokeWidth={3} listening={false} />
      <Circle radius={5} fill={ping.color} listening={false} />
      {ping.message && (
        <Text
          text={ping.message}
          fontSize={12}
          fill={ping.color}
          fontStyle="bold"
          y={-28}
          align="center"
          offsetX={50}
          width={100}
          listening={false}
        />
      )}
      {ping.senderName && (
        <Text
          text={ping.senderName}
          fontSize={10}
          fill="#ffffffcc"
          y={20}
          align="center"
          offsetX={40}
          width={80}
          listening={false}
        />
      )}
    </Group>
  );
}

/**
 * Ping de alerta - efeito dramático com ondas expandindo
 */
function AlertPing({ ping, gridSize }: AnimatedPingProps) {
  const [animState, setAnimState] = useState({
    innerScale: 1,
    outerScale: 1,
    waveScale: 1,
    opacity: 1,
    pulseOpacity: 1,
  });

  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      const age = Date.now() - ping.createdAt;
      const fadeOut = Math.max(0, 1 - age / 5000);
      
      // Pulso interno rápido
      const innerScale = 1 + Math.sin(age / 80) * 0.3;
      // Anel externo cresce e desaparece em loop
      const wavePhase = (age % 1200) / 1200;
      const waveScale = 1 + wavePhase * 2.5;
      const pulseOpacity = Math.max(0, 1 - wavePhase);

      setAnimState({
        innerScale,
        outerScale: 1,
        waveScale,
        opacity: fadeOut,
        pulseOpacity,
      });

      if (fadeOut > 0) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [ping.createdAt]);

  const cx = ping.x * gridSize + gridSize / 2;
  const cy = ping.y * gridSize + gridSize / 2;

  return (
    <Group x={cx} y={cy} opacity={animState.opacity}>
      {/* Onda expandindo */}
      <Ring
        innerRadius={18 * animState.waveScale}
        outerRadius={22 * animState.waveScale}
        fill="#ff000044"
        stroke="#ff0000"
        strokeWidth={2}
        opacity={animState.pulseOpacity}
        listening={false}
      />
      
      {/* Triângulo de alerta ⚠ */}
      <Group scaleX={animState.innerScale} scaleY={animState.innerScale}>
        <RegularPolygon
          sides={3}
          radius={14}
          fill="#ff0000"
          stroke="#ffffff"
          strokeWidth={2}
          listening={false}
        />
        <Text
          text="!"
          fontSize={16}
          fill="#ffffff"
          fontStyle="bold"
          x={-5}
          y={-8}
          listening={false}
        />
      </Group>

      {/* Mensagem de alerta */}
      {ping.message && (
        <Text
          text={ping.message}
          fontSize={14}
          fill="#ff4444"
          fontStyle="bold"
          y={-35}
          align="center"
          offsetX={60}
          width={120}
          shadowColor="#000000"
          shadowBlur={4}
          shadowOpacity={0.8}
          listening={false}
        />
      )}
      {ping.senderName && (
        <Text
          text={ping.senderName}
          fontSize={10}
          fill="#ff8888"
          y={22}
          align="center"
          offsetX={40}
          width={80}
          listening={false}
        />
      )}
    </Group>
  );
}

/**
 * Ping de sincronização de câmera - ícone de olho
 */
function CameraSyncPing({ ping, gridSize }: AnimatedPingProps) {
  const [animState, setAnimState] = useState({ scale: 1, opacity: 1 });

  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      const age = Date.now() - ping.createdAt;
      const fadeOut = Math.max(0, 1 - age / 3000);
      const scale = 1 + Math.sin(age / 150) * 0.15;
      setAnimState({ scale, opacity: fadeOut });
      if (fadeOut > 0) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [ping.createdAt]);

  const cx = ping.x * gridSize + gridSize / 2;
  const cy = ping.y * gridSize + gridSize / 2;

  return (
    <Group x={cx} y={cy} scaleX={animState.scale} scaleY={animState.scale} opacity={animState.opacity}>
      {/* Crosshair */}
      <Circle radius={20} stroke="#00ccff" strokeWidth={2} dash={[6, 3]} listening={false} />
      <Circle radius={6} fill="#00ccff" listening={false} />
      
      {/* Texto "Olhem aqui!" */}
      <Text
        text={ping.message || 'Olhem aqui!'}
        fontSize={13}
        fill="#00ccff"
        fontStyle="bold"
        y={-32}
        align="center"
        offsetX={55}
        width={110}
        shadowColor="#000000"
        shadowBlur={3}
        shadowOpacity={0.8}
        listening={false}
      />
      {ping.senderName && (
        <Text
          text={ping.senderName}
          fontSize={10}
          fill="#88ddffcc"
          y={25}
          align="center"
          offsetX={40}
          width={80}
          listening={false}
        />
      )}
    </Group>
  );
}

/**
 * Componente roteador - escolhe o visual baseado no tipo
 */
function AnimatedPing({ ping, gridSize }: AnimatedPingProps) {
  switch (ping.type) {
    case 'alert':
      return <AlertPing ping={ping} gridSize={gridSize} />;
    case 'camera_sync':
      return <CameraSyncPing ping={ping} gridSize={gridSize} />;
    default:
      return <NormalPing ping={ping} gridSize={gridSize} />;
  }
}

export function PingLayer({ pings, gridSize }: PingLayerProps) {
  // Filtra pings que ainda estão visíveis
  const [visiblePings, setVisiblePings] = useState<AdvancedPing[]>([]);

  useEffect(() => {
    const updatePings = () => {
      const now = Date.now();
      const active = pings.filter((p) => {
        const maxAge = p.type === 'alert' ? 5000 : 3000;
        return now - p.createdAt < maxAge;
      });
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
