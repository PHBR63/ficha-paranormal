/**
 * AtmosphericEffects - Efeitos atmosféricos condicionais
 * 
 * Renderiza efeitos visuais (FlickeringGrid, Particles) apenas quando apropriado:
 * - Respeita preferência de movimento reduzido do sistema
 * - Desativa em dispositivos de baixo desempenho
 * - Desativa em mobile para economia de bateria
 * 
 * @module components/character/AtmosphericEffects
 */

import { memo, useMemo } from 'react';
import { useIsMobile } from '@/hooks';
import { useShouldDisableEffects } from '@/hooks/useReducedMotion';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { Particles } from '@/components/ui/particles';

interface AtmosphericEffectsProps {
  /** Cor das partículas (hex) */
  particleColor?: string;
  /** Quantidade de partículas */
  particleQuantity?: number;
  /** Cor do grid (hex) */
  gridColor?: string;
  /** Opacidade máxima do grid (0-1) */
  gridMaxOpacity?: number;
  /** Se deve forçar desabilitar os efeitos */
  forceDisable?: boolean;
  /** Classes CSS adicionais para o container */
  className?: string;
}

/**
 * Componente de efeitos atmosféricos com carregamento condicional
 * Não renderiza nada se os efeitos devem ser desabilitados
 */
export const AtmosphericEffects = memo(function AtmosphericEffects({
  particleColor = '#6b21a8',
  particleQuantity = 50,
  gridColor = '#6b21a8',
  gridMaxOpacity = 0.12,
  forceDisable = false,
  className,
}: AtmosphericEffectsProps) {
  const isMobile = useIsMobile();
  const shouldDisableEffects = useShouldDisableEffects();

  // Calcula se deve renderizar os efeitos
  const shouldRender = useMemo(() => {
    // Desabilita se forçado
    if (forceDisable) return false;
    // Desabilita em mobile para economia de bateria
    if (isMobile) return false;
    // Desabilita se preferência de movimento reduzido ou baixo desempenho
    if (shouldDisableEffects) return false;
    
    return true;
  }, [forceDisable, isMobile, shouldDisableEffects]);

  // Não renderiza nada se desabilitado
  if (!shouldRender) {
    return null;
  }

  return (
    <>
      {/* Grid de fundo com flicker sutil */}
      <FlickeringGrid
        className={className || "pointer-events-none absolute inset-0 z-0 opacity-30"}
        squareSize={4}
        gridGap={6}
        color={gridColor}
        maxOpacity={gridMaxOpacity}
        flickerChance={0.1}
      />

      {/* Partículas flutuantes */}
      <Particles
        className="pointer-events-none absolute inset-0"
        quantity={particleQuantity}
        staticity={50}
        color={particleColor}
        size={0.5}
      />
    </>
  );
});

/**
 * Hook para verificar se efeitos atmosféricos estão habilitados
 * Útil para componentes que precisam ajustar seu comportamento
 */
export function useAtmosphericEffectsEnabled(): boolean {
  const isMobile = useIsMobile();
  const shouldDisableEffects = useShouldDisableEffects();
  
  return !isMobile && !shouldDisableEffects;
}

export default AtmosphericEffects;
