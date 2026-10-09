/**
 * RawEffectsView - Visualização dos efeitos brutos do SUE
 * 
 * Exibe a lista de efeitos não computados com filtro de busca
 * e indicação de status (ativo/inativo).
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { Zap } from '@/components/icons/ordem-icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UnifiedEffect } from '@/hooks';
import { SOURCE_CONFIG } from './sue-debug-constants';
import type { SourceType } from './sue-debug-types';

interface RawEffectsViewProps {
  effects: UnifiedEffect[];
  compact?: boolean;
}

/**
 * Visualiza a lista de efeitos brutos do SUE
 */
export function RawEffectsView({ effects, compact }: RawEffectsViewProps) {
  if (effects.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        Nenhum efeito encontrado
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {effects.map((effect) => {
        const config = SOURCE_CONFIG[effect.source as SourceType];
        const Icon = config?.icon || Zap;
        
        return (
          <div 
            key={effect.id}
            className={cn(
              "p-2 rounded-lg border",
              config?.bgColor || 'bg-muted/30',
              "border-border/50",
              !effect.isActive && "opacity-50"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", config?.color || 'text-muted-foreground')} />
                <span className="text-sm font-medium">{effect.name}</span>
                {!effect.isActive && (
                  <Badge variant="secondary" className="text-xs">Inativo</Badge>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                {config?.label || effect.source}
              </Badge>
            </div>
            {effect.sourceName && (
              <div className="text-xs text-muted-foreground mt-1 pl-6">
                Fonte: {effect.sourceName}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
