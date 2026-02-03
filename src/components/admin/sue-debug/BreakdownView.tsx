/**
 * BreakdownView - Visualização de efeitos por fonte
 * 
 * Agrupa efeitos por tipo de fonte (Origem, Trilha, etc.)
 * em seções colapsáveis com contador de ativos/inativos.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { ChevronDown, Check, X, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { UnifiedEffect, UnifiedEffectsResult } from '@/hooks';
import { SOURCE_CONFIG } from './sue-debug-constants';
import type { SourceType } from './sue-debug-types';

interface BreakdownViewProps {
  bySource: UnifiedEffectsResult['bySource'];
  compact?: boolean;
}

/**
 * Visualiza efeitos agrupados por tipo de fonte
 */
export function BreakdownView({ bySource, compact }: BreakdownViewProps) {
  return (
    <div className="space-y-3">
      {(Object.entries(bySource) as [SourceType, UnifiedEffect[]][]).map(([source, effects]) => {
        if (effects.length === 0) return null;
        
        const config = SOURCE_CONFIG[source];
        const Icon = config?.icon || Zap;
        const activeCount = effects.filter(e => e.isActive).length;

        return (
          <Collapsible key={source}>
            <CollapsibleTrigger asChild>
              <div className={cn(
                "flex items-center justify-between p-2 rounded-lg cursor-pointer",
                "hover:bg-muted/50 transition-colors",
                config?.bgColor || 'bg-muted/30'
              )}>
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", config?.color)} />
                  <span className="text-sm font-medium">{config?.label || source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {activeCount}/{effects.length}
                  </Badge>
                  <ChevronDown className="h-3 w-3" />
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1 pl-4 pt-2">
                {effects.map((effect) => (
                  <div 
                    key={effect.id}
                    className={cn(
                      "flex items-center justify-between text-xs p-1 rounded",
                      "bg-background/50",
                      !effect.isActive && "opacity-50"
                    )}
                  >
                    <span className="truncate">{effect.name}</span>
                    <div className="flex items-center gap-1">
                      {effect.isActive ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <X className="h-3 w-3 text-destructive" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
