/**
 * useKonvaTransform - Hook para gerenciar zoom/pan do Stage Konva
 * 
 * Suporta:
 * - Zoom com scroll wheel (desktop)
 * - Pinch to zoom (mobile/touch)
 * - Pan com drag no fundo
 * - Limites de zoom configuráveis
 */

import { useState, useCallback, useRef } from 'react';
import Konva from 'konva';

export interface TransformState {
  scale: number;
  position: { x: number; y: number };
}

interface UseKonvaTransformOptions {
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  initialPosition?: { x: number; y: number };
}

export function useKonvaTransform(options: UseKonvaTransformOptions = {}) {
  const {
    minScale = 0.1,
    maxScale = 5,
    initialScale = 1,
    initialPosition = { x: 0, y: 0 },
  } = options;

  const [scale, setScale] = useState(initialScale);
  const [position, setPosition] = useState(initialPosition);
  const [isPanning, setIsPanning] = useState(false);
  
  // Referência ao último ponto de toque para pinch
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const lastDist = useRef<number>(0);

  /**
   * Calcula a distância entre dois pontos (para pinch)
   */
  const getDistance = useCallback((p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }, []);

  /**
   * Calcula o centro entre dois pontos (para pinch)
   */
  const getCenter = useCallback((p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  }, []);

  /**
   * Handler para zoom via scroll wheel
   */
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    // Calcula novo scale baseado na direção do scroll
    const scaleBy = 1.1;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    // Limita o zoom
    newScale = Math.max(minScale, Math.min(maxScale, newScale));
    
    // Mantém o ponto sob o cursor fixo durante o zoom
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };
    
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    
    setScale(newScale);
    setPosition(newPos);
  }, [scale, position, minScale, maxScale]);

  /**
   * Handler para início de toque (suporte a pinch)
   */
  const handleTouchStart = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];
    
    if (touch1 && touch2) {
      // Dois dedos - inicia pinch
      e.evt.preventDefault();
      lastCenter.current = getCenter(
        { x: touch1.clientX, y: touch1.clientY },
        { x: touch2.clientX, y: touch2.clientY }
      );
      lastDist.current = getDistance(
        { x: touch1.clientX, y: touch1.clientY },
        { x: touch2.clientX, y: touch2.clientY }
      );
    }
  }, [getCenter, getDistance]);

  /**
   * Handler para movimento de toque (suporte a pinch)
   */
  const handleTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];
    
    if (!touch1 || !touch2 || !lastCenter.current) return;
    
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const p1 = { x: touch1.clientX, y: touch1.clientY };
    const p2 = { x: touch2.clientX, y: touch2.clientY };
    
    const newCenter = getCenter(p1, p2);
    const dist = getDistance(p1, p2);
    
    if (!lastDist.current) return;
    
    // Calcula novo scale baseado na mudança de distância
    const pointTo = {
      x: (newCenter.x - position.x) / scale,
      y: (newCenter.y - position.y) / scale,
    };
    
    let newScale = scale * (dist / lastDist.current);
    newScale = Math.max(minScale, Math.min(maxScale, newScale));
    
    // Calcula nova posição considerando o movimento do centro
    const dx = newCenter.x - lastCenter.current.x;
    const dy = newCenter.y - lastCenter.current.y;
    
    const newPos = {
      x: newCenter.x - pointTo.x * newScale + dx,
      y: newCenter.y - pointTo.y * newScale + dy,
    };
    
    setScale(newScale);
    setPosition(newPos);
    
    lastDist.current = dist;
    lastCenter.current = newCenter;
  }, [scale, position, minScale, maxScale, getCenter, getDistance]);

  /**
   * Handler para fim de toque
   */
  const handleTouchEnd = useCallback(() => {
    lastCenter.current = null;
    lastDist.current = 0;
  }, []);

  /**
   * Handler para início de drag (pan)
   */
  const handleDragStart = useCallback(() => {
    setIsPanning(true);
  }, []);

  /**
   * Handler para fim de drag (pan)
   */
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    setIsPanning(false);
    setPosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  }, []);

  /**
   * Zoom in manual
   */
  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(maxScale, s * 1.2));
  }, [maxScale]);

  /**
   * Zoom out manual
   */
  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(minScale, s / 1.2));
  }, [minScale]);

  /**
   * Reseta para zoom e posição inicial
   */
  const resetTransform = useCallback(() => {
    setScale(initialScale);
    setPosition(initialPosition);
  }, [initialScale, initialPosition]);

  /**
   * Centraliza a view em um ponto específico
   */
  const centerOnPoint = useCallback((x: number, y: number, stageWidth: number, stageHeight: number) => {
    setPosition({
      x: stageWidth / 2 - x * scale,
      y: stageHeight / 2 - y * scale,
    });
  }, [scale]);

  /**
   * Define zoom para um valor específico
   */
  const setZoomLevel = useCallback((newScale: number) => {
    setScale(Math.max(minScale, Math.min(maxScale, newScale)));
  }, [minScale, maxScale]);

  return {
    // Estado
    scale,
    position,
    isPanning,
    
    // Handlers para Stage
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDragStart,
    handleDragEnd,
    
    // Ações manuais
    zoomIn,
    zoomOut,
    resetTransform,
    centerOnPoint,
    setZoomLevel,
    setPosition,
    
    // Estado derivado
    zoomPercentage: Math.round(scale * 100),
  };
}
