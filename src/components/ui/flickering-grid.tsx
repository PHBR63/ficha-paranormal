/**
 * FlickeringGrid - Background com grid que pisca
 * Simula instabilidade da Membrana
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface FlickeringGridProps {
  className?: string;
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  maxOpacity?: number;
  width?: number | string;
  height?: number | string;
}

export function FlickeringGrid({
  className,
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = 'rgb(139, 0, 0)',
  maxOpacity = 0.3,
  width = '100%',
  height = '100%',
}: FlickeringGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  const setupCanvas = useCallback((canvas: HTMLCanvasElement, width: number, height: number) => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    return ctx;
  }, []);

  const drawGrid = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    col: number,
    row: number
  ) => {
    ctx.clearRect(0, 0, width, height);
    
    for (let i = 0; i < col; i++) {
      for (let j = 0; j < row; j++) {
        if (Math.random() < flickerChance) {
          ctx.fillStyle = color;
          ctx.globalAlpha = Math.random() * maxOpacity;
          ctx.fillRect(
            i * (squareSize + gridGap),
            j * (squareSize + gridGap),
            squareSize,
            squareSize
          );
        }
      }
    }
  }, [color, flickerChance, gridGap, maxOpacity, squareSize]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !isInView) return;

    const rect = container.getBoundingClientRect();
    const ctx = setupCanvas(canvas, rect.width, rect.height);
    if (!ctx) return;

    const col = Math.ceil(rect.width / (squareSize + gridGap));
    const row = Math.ceil(rect.height / (squareSize + gridGap));

    let animationId: number;
    let lastTime = 0;
    const fps = 15;
    const interval = 1000 / fps;

    const animate = (time: number) => {
      if (time - lastTime >= interval) {
        lastTime = time;
        drawGrid(ctx, rect.width, rect.height, col, row);
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [isInView, drawGrid, setupCanvas, squareSize, gridGap]);

  return (
    <div 
      ref={containerRef}
      className={cn('absolute inset-0 overflow-hidden', className)}
      style={{ width, height }}
    >
      <canvas 
        ref={canvasRef}
        className="pointer-events-none"
      />
    </div>
  );
}
