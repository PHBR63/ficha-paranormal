/**
 * EffectSourceBadge - Badge visual para identificar a fonte de um efeito
 * 
 * Exibe um ícone e label coloridos de acordo com o tipo de fonte
 * (Origem, Trilha, Condição, Ritual, Poder Paranormal, Poder de Classe).
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SOURCE_CONFIG } from './sue-debug-constants';
import type { SourceType } from './sue-debug-types';

interface EffectSourceBadgeProps {
  /** Tipo da fonte do efeito */
  source: SourceType;
  /** Mostra apenas o ícone (modo compacto) */
  iconOnly?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Badge visual para exibir a fonte de um efeito SUE
 */
export function EffectSourceBadge({ 
  source, 
  iconOnly = false,
  className 
}: EffectSourceBadgeProps) {
  const config = SOURCE_CONFIG[source];
  
  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {source}
      </Badge>
    );
  }

  const Icon = config.icon;

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        config.bgColor,
        "border-none",
        className
      )}
    >
      <Icon className={cn("h-3 w-3", config.color, !iconOnly && "mr-1")} />
      {!iconOnly && <span className={config.color}>{config.label}</span>}
    </Badge>
  );
}
