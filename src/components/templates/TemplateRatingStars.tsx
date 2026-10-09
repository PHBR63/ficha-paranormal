/**
 * Componente de Estrelas de Avaliação
 * Exibe e permite interação com rating de templates
 * 
 * @module components/templates/TemplateRatingStars
 */

import { useState, useCallback } from 'react';
import { Star } from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TemplateRatingStarsProps {
  /** Rating atual (0-5) */
  rating: number | null;
  /** Número total de avaliações */
  ratingCount?: number;
  /** Callback ao clicar em uma estrela (torna interativo) */
  onRate?: (rating: number) => void;
  /** Tamanho das estrelas */
  size?: 'sm' | 'md' | 'lg';
  /** Se está carregando */
  isLoading?: boolean;
  /** Mostrar contagem de avaliações */
  showCount?: boolean;
  /** Classes adicionais */
  className?: string;
}

const SIZES = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const TEXT_SIZES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function TemplateRatingStars({
  rating,
  ratingCount = 0,
  onRate,
  size = 'md',
  isLoading = false,
  showCount = true,
  className,
}: TemplateRatingStarsProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const isInteractive = !!onRate && !isLoading;
  const displayRating = hoverRating ?? rating ?? 0;

  const handleStarClick = useCallback((starIndex: number) => {
    if (onRate && !isLoading) {
      onRate(starIndex);
    }
  }, [onRate, isLoading]);

  const handleMouseEnter = useCallback((starIndex: number) => {
    if (isInteractive) {
      setHoverRating(starIndex);
    }
  }, [isInteractive]);

  const handleMouseLeave = useCallback(() => {
    setHoverRating(null);
  }, []);

  return (
    <div 
      className={cn('flex items-center gap-1', className)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Estrelas */}
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = starIndex <= displayRating;
          const isHalf = !isFilled && starIndex - 0.5 <= displayRating;
          
          return (
            <motion.button
              key={starIndex}
              type="button"
              disabled={!isInteractive}
              onClick={() => handleStarClick(starIndex)}
              onMouseEnter={() => handleMouseEnter(starIndex)}
              whileHover={isInteractive ? { scale: 1.2 } : undefined}
              whileTap={isInteractive ? { scale: 0.9 } : undefined}
              className={cn(
                'relative focus:outline-none transition-colors',
                isInteractive && 'cursor-pointer hover:text-yellow-400',
                !isInteractive && 'cursor-default',
                isLoading && 'opacity-50'
              )}
              aria-label={`Avaliar ${starIndex} estrela${starIndex > 1 ? 's' : ''}`}
            >
              {/* Estrela de fundo (vazia) */}
              <Star
                className={cn(
                  SIZES[size],
                  'text-muted-foreground/30'
                )}
              />
              
              {/* Estrela preenchida (overlay) */}
              {(isFilled || isHalf) && (
                <Star
                  className={cn(
                    SIZES[size],
                    'absolute inset-0 text-yellow-400 fill-yellow-400',
                    isHalf && 'clip-path-half'
                  )}
                  style={isHalf ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Rating numérico e contagem */}
      {showCount && (
        <span className={cn(TEXT_SIZES[size], 'text-muted-foreground ml-1')}>
          {rating !== null ? (
            <>
              <span className="font-medium text-foreground">
                {rating.toFixed(1)}
              </span>
              {ratingCount > 0 && (
                <span className="ml-1">
                  ({ratingCount})
                </span>
              )}
            </>
          ) : (
            <span className="italic">Sem avaliações</span>
          )}
        </span>
      )}
    </div>
  );
}

// ========================================
// Componente de Rating Interativo (para modal)
// ========================================

interface InteractiveRatingProps {
  currentRating: number | null;
  onRate: (rating: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function InteractiveRating({
  currentRating,
  onRate,
  isLoading = false,
  className,
}: InteractiveRatingProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground">
        Sua avaliação:
      </span>
      <TemplateRatingStars
        rating={currentRating}
        onRate={onRate}
        size="lg"
        showCount={false}
        isLoading={isLoading}
      />
      {currentRating && (
        <span className="text-sm font-medium text-yellow-400">
          {currentRating} estrela{currentRating > 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
