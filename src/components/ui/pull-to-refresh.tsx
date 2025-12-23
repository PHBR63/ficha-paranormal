/**
 * PullToRefresh - Componente de pull-to-refresh para mobile
 * Detecta gesto de arrastar para baixo e dispara callback de atualização
 */

import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  /** Altura do threshold para ativar o refresh (default: 80px) */
  threshold?: number;
  /** Classe CSS adicional */
  className?: string;
  /** Desabilita o pull-to-refresh */
  disabled?: boolean;
}

type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'done';

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className,
  disabled = false,
}: PullToRefreshProps) {
  const [state, setState] = useState<RefreshState>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const y = useMotionValue(0);
  
  // Transforma o valor Y em opacidade e rotação do ícone
  const opacity = useTransform(y, [0, threshold * 0.5, threshold], [0, 0.5, 1]);
  const rotate = useTransform(y, [0, threshold], [0, 180]);
  const scale = useTransform(y, [0, threshold * 0.5, threshold], [0.5, 0.8, 1]);
  
  // Handler para início do arraste
  const handleDragStart = useCallback((_: any, info: PanInfo) => {
    if (disabled) return;
    
    // Verifica se está no topo da página
    const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
    if (scrollTop > 5) return;
    
    startY.current = info.point.y;
    setState('pulling');
  }, [disabled]);
  
  // Handler durante o arraste
  const handleDrag = useCallback((_: any, info: PanInfo) => {
    if (disabled || state === 'refreshing') return;
    
    const delta = info.point.y - startY.current;
    
    // Só permite arrastar para baixo
    if (delta < 0) {
      y.set(0);
      return;
    }
    
    // Aplica resistência exponencial
    const resistance = 0.4;
    const adjustedDelta = Math.pow(delta, resistance) * 3;
    
    y.set(Math.min(adjustedDelta, threshold * 1.5));
    
    // Atualiza estado baseado na posição
    if (adjustedDelta >= threshold) {
      setState('ready');
    } else {
      setState('pulling');
    }
  }, [disabled, state, threshold, y]);
  
  // Handler para fim do arraste
  const handleDragEnd = useCallback(async () => {
    if (disabled || state === 'refreshing') return;
    
    const currentY = y.get();
    
    if (currentY >= threshold && state === 'ready') {
      // Mantém no topo durante o refresh
      y.set(threshold * 0.7);
      setState('refreshing');
      
      try {
        await onRefresh();
        setState('done');
        
        // Breve delay para mostrar "concluído"
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error('Erro ao atualizar:', error);
      }
    }
    
    // Retorna à posição inicial
    y.set(0);
    setState('idle');
  }, [disabled, onRefresh, state, threshold, y]);
  
  // Trigger de vibração háptica
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {/* Indicador de pull-to-refresh */}
      <motion.div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-10"
        style={{
          top: -40,
          opacity,
        }}
      >
        <motion.div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "bg-background/90 border border-border shadow-lg backdrop-blur-sm",
            state === 'ready' && "bg-primary/20 border-primary/50",
            state === 'refreshing' && "bg-primary/10",
            state === 'done' && "bg-success/20 border-success/50"
          )}
          style={{ scale }}
        >
          {state === 'refreshing' ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <motion.div style={{ rotate }}>
              <RefreshCw 
                className={cn(
                  "w-5 h-5",
                  state === 'ready' ? "text-primary" : "text-muted-foreground",
                  state === 'done' && "text-success"
                )} 
              />
            </motion.div>
          )}
        </motion.div>
        
        {/* Texto de feedback */}
        <motion.span
          className={cn(
            "absolute top-12 text-[10px] font-medium",
            state === 'ready' ? "text-primary" : "text-muted-foreground",
            state === 'done' && "text-success"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: state !== 'idle' ? 1 : 0 }}
        >
          {state === 'pulling' && 'Puxe para atualizar'}
          {state === 'ready' && 'Solte para atualizar'}
          {state === 'refreshing' && 'Atualizando...'}
          {state === 'done' && 'Atualizado!'}
        </motion.span>
      </motion.div>
      
      {/* Conteúdo arrastável */}
      <motion.div
        style={{ y }}
        drag={disabled ? false : "y"}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}

export default PullToRefresh;
