/**
 * useReducedMotion - Hook para detectar preferência de movimento reduzido
 * 
 * Respeita a configuração do sistema operacional do usuário para
 * reduzir animações e efeitos visuais em dispositivos com baixo desempenho
 * ou para usuários com sensibilidade a movimento.
 * 
 * @module hooks/useReducedMotion
 */

import { useState, useEffect } from 'react';

/**
 * Hook que detecta se o usuário prefere movimento reduzido
 * @returns true se o usuário preferir movimento reduzido
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Verifica se a API está disponível
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Define o valor inicial
    setPrefersReducedMotion(mediaQuery.matches);

    // Handler para mudanças na preferência
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Adiciona listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook que retorna true se efeitos visuais devem ser desabilitados
 * Combina preferência de movimento reduzido com detecção de mobile
 * para otimizar performance em dispositivos modestos
 */
export function useShouldDisableEffects(): boolean {
  const prefersReducedMotion = useReducedMotion();
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  useEffect(() => {
    // Detecta dispositivos de baixo desempenho
    // Verifica: memória baixa, CPU lenta, ou conexão lenta
    if (typeof navigator !== 'undefined') {
      // APIs experimentais - podem não estar disponíveis em todos os browsers
      const navExtended = navigator as Navigator & { 
        deviceMemory?: number; 
        hardwareConcurrency?: number; 
      };
      const memory = navExtended.deviceMemory;
      const cores = navExtended.hardwareConcurrency;
      
      // Considera baixo desempenho se:
      // - Menos de 4GB de RAM
      // - Menos de 4 cores
      const lowMemory = memory !== undefined && memory < 4;
      const lowCores = cores !== undefined && cores < 4;
      
      setIsLowPerformance(lowMemory || lowCores);
    }
  }, []);

  return prefersReducedMotion || isLowPerformance;
}
