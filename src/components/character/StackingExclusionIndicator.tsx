/**
 * StackingExclusionIndicator - Indicador de resumo de exclusões por stacking
 * 
 * Mostra um resumo colapsável de todos os bônus excluídos por regras de stacking.
 * Ideal para exibir em painéis de efeitos ativos ou no header de combate.
 * 
 * @module components/character/StackingExclusionIndicator
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Layers, AlertTriangle } from '@/components/icons/ordem-icons';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { UnifiedEffect } from '@/lib/unified-effects-engine';

// =====================================================
// Tipos
// =====================================================

export interface ExcludedEffectInfo {
  effect: UnifiedEffect;
  reason: string;
  replacedBy: string;
}

interface StackingExclusionIndicatorProps {
  /** Lista de efeitos excluídos do SUE Hardening */
  excludedEffects: ExcludedEffectInfo[];
  /** Variante de exibição */
  variant?: 'badge' | 'panel' | 'inline';
  /** Se deve começar expandido (para variant 'panel') */
  defaultExpanded?: boolean;
  /** Classes adicionais */
  className?: string;
}

// =====================================================
// Helpers
// =====================================================

/**
 * Traduz a fonte do efeito para texto legível
 */
function getSourceLabel(source: UnifiedEffect['source']): string {
  const sourceMap: Record<string, string> = {
    origin: 'Origem',
    track: 'Trilha',
    condition: 'Condição',
    ritual: 'Ritual',
    paranormal_power: 'Poder Paranormal',
    class_power: 'Poder de Classe',
    equipment: 'Equipamento',
    item: 'Item',
    general_power: 'Poder Geral',
  };
  return sourceMap[source] || source;
}

/**
 * Obtém cor por tipo de fonte
 */
function getSourceColor(source: UnifiedEffect['source']): string {
  const colorMap: Record<string, string> = {
    origin: 'text-energy',
    track: 'text-primary',
    condition: 'text-destructive',
    ritual: 'text-paranormal',
    paranormal_power: 'text-paranormal',
    class_power: 'text-primary',
    equipment: 'text-amber-500',
    item: 'text-amber-500',
    general_power: 'text-amber-400',
  };
  return colorMap[source] || 'text-muted-foreground';
}

/**
 * Formata razão de exclusão
 */
function formatReason(reason: string): string {
  // Razões comuns do SUE Hardening
  if (reason.includes('ritual')) return 'Rituais não acumulam';
  if (reason.includes('same_source') || reason.includes('mesma fonte')) return 'Mesma fonte: apenas maior';
  if (reason.includes('higher') || reason.includes('maior')) return 'Substituído por bônus maior';
  if (reason.includes('equipment')) return 'Equipamento maior ativo';
  return reason;
}

// =====================================================
// Componente Principal
// =====================================================

export const StackingExclusionIndicator = memo(function StackingExclusionIndicator({
  excludedEffects,
  variant = 'badge',
  defaultExpanded = false,
  className,
}: StackingExclusionIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  // Não renderiza se não há exclusões
  if (excludedEffects.length === 0) return null;

  // Agrupa exclusões por razão para resumo
  const byReason = excludedEffects.reduce((acc, item) => {
    const reason = formatReason(item.reason);
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // ===== Variante Badge: apenas contador com tooltip =====
  if (variant === 'badge') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 gap-1 cursor-help",
              "bg-amber-500/10 border-amber-500/30 text-amber-500",
              "hover:bg-amber-500/20 transition-colors",
              className
            )}
          >
            <Layers className="w-3 h-3" />
            {excludedEffects.length} substituído{excludedEffects.length !== 1 ? 's' : ''}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px]">
          <div className="space-y-2">
            <p className="text-xs font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              Bônus não aplicados por stacking
            </p>
            <p className="text-[10px] text-muted-foreground">
              Seguindo as regras oficiais v1.3, alguns bônus foram substituídos por outros maiores.
            </p>
            <div className="pt-1 border-t border-border/50 space-y-0.5">
              {excludedEffects.slice(0, 5).map((item, idx) => (
                <div key={idx} className="text-[10px] flex items-start gap-1">
                  <span className={cn("shrink-0", getSourceColor(item.effect.source))}>•</span>
                  <span className="text-muted-foreground line-through">{item.effect.name}</span>
                  <span className="text-primary">→ {item.replacedBy}</span>
                </div>
              ))}
              {excludedEffects.length > 5 && (
                <p className="text-[10px] text-muted-foreground">
                  +{excludedEffects.length - 5} mais...
                </p>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // ===== Variante Inline: lista compacta =====
  if (variant === 'inline') {
    return (
      <div className={cn("flex flex-wrap items-center gap-1", className)}>
        <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
          <Layers className="w-3 h-3" />
          Substituídos:
        </span>
        {excludedEffects.slice(0, 3).map((item, idx) => (
          <Tooltip key={idx}>
            <TooltipTrigger asChild>
              <span className={cn(
                "text-[9px] px-1 py-0.5 rounded cursor-help",
                "bg-amber-500/10 text-amber-500 line-through"
              )}>
                {item.effect.name}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px]">
              <p>Substituído por: <span className="text-primary">{item.replacedBy}</span></p>
              <p className="text-muted-foreground">{formatReason(item.reason)}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {excludedEffects.length > 3 && (
          <span className="text-[9px] text-amber-500/70">
            +{excludedEffects.length - 3}
          </span>
        )}
      </div>
    );
  }

  // ===== Variante Panel: painel colapsável completo =====
  return (
    <div className={cn(
      "border border-amber-500/30 rounded-lg bg-amber-500/5",
      className
    )}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 hover:bg-amber-500/10 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-medium text-amber-500">
            Bônus Não Aplicados
          </span>
          <Badge 
            variant="outline" 
            className="text-[9px] px-1 py-0 bg-amber-500/20 border-amber-500/30 text-amber-500"
          >
            {excludedEffects.length}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-amber-500/70" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-500/70" />
        )}
      </button>

      {/* Conteúdo */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 space-y-1.5">
              {/* Resumo por razão */}
              <div className="flex flex-wrap gap-1 pb-1.5 border-b border-amber-500/20">
                {Object.entries(byReason).map(([reason, count]) => (
                  <span
                    key={reason}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500"
                  >
                    {reason}: {count}
                  </span>
                ))}
              </div>

              {/* Lista de efeitos */}
              <div className="space-y-1 max-h-[150px] overflow-y-auto">
                {excludedEffects.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-1.5 rounded bg-muted/30"
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] font-medium text-muted-foreground line-through">
                          {item.effect.name}
                        </span>
                        <span className={cn(
                          "text-[8px] px-1 rounded",
                          getSourceColor(item.effect.source),
                          "bg-muted"
                        )}>
                          {getSourceLabel(item.effect.source)}
                        </span>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {formatReason(item.reason)}
                      </p>
                      <p className="text-[9px] mt-0.5">
                        <span className="text-muted-foreground">Ativo: </span>
                        <span className="text-primary font-medium">{item.replacedBy}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dica */}
              <p className="text-[9px] text-muted-foreground text-center pt-1 border-t border-amber-500/20">
                Regras oficiais v1.3: bônus da mesma fonte não acumulam
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default StackingExclusionIndicator;
