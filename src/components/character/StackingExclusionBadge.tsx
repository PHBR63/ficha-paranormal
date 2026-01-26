/**
 * StackingExclusionBadge - Indicador visual de bônus excluídos por regras de stacking
 * 
 * Mostra quando um efeito foi substituído por outro maior seguindo as regras oficiais
 * do Ordem Paranormal RPG v1.3:
 * - Bônus da mesma fonte: apenas o maior se aplica
 * - Rituais: nunca acumulam entre si
 * - Equipamentos: maior valor exceto "Trio de Defesa"
 * 
 * @module components/character/StackingExclusionBadge
 */

import { memo } from 'react';
import { AlertTriangle, Info, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// =====================================================
// Tipos
// =====================================================

export interface ExcludedEffect {
  /** ID do efeito excluído */
  effectId: string;
  /** Nome do efeito excluído */
  effectName: string;
  /** Razão da exclusão */
  reason: string;
  /** Nome do efeito que o substituiu */
  replacedBy: string;
  /** Categoria do bônus (attack, damage, defense, etc.) */
  category?: string;
}

interface StackingExclusionBadgeProps {
  /** Efeito que foi excluído */
  exclusion: ExcludedEffect;
  /** Variante de exibição */
  variant?: 'inline' | 'compact' | 'detailed';
  /** Classes adicionais */
  className?: string;
}

// =====================================================
// Helpers de Exibição
// =====================================================

/**
 * Traduz razões de exclusão para texto legível em PT-BR
 */
function getExclusionReasonText(reason: string): string {
  const reasonMap: Record<string, string> = {
    'same_source': 'Mesma fonte: apenas maior valor',
    'ritual_no_stack': 'Rituais não acumulam',
    'equipment_higher': 'Equipamento maior ativo',
    'replaced_by_higher': 'Substituído por bônus maior',
    'stacking_limit': 'Limite de acúmulo atingido',
  };
  return reasonMap[reason] || reason;
}

/**
 * Traduz categorias de bônus para texto legível
 */
function getCategoryText(category?: string): string {
  if (!category) return '';
  const categoryMap: Record<string, string> = {
    'attack': 'Ataque',
    'damage': 'Dano',
    'defense': 'Defesa',
    'skill': 'Perícia',
    'resistance': 'Resistência',
    'healing': 'Cura',
    'movement': 'Movimento',
    'initiative': 'Iniciativa',
  };
  return categoryMap[category] || category;
}

// =====================================================
// Componente Principal
// =====================================================

export const StackingExclusionBadge = memo(function StackingExclusionBadge({
  exclusion,
  variant = 'inline',
  className,
}: StackingExclusionBadgeProps) {
  const reasonText = getExclusionReasonText(exclusion.reason);
  const categoryText = getCategoryText(exclusion.category);

  // Variante compacta: apenas ícone com tooltip
  if (variant === 'compact') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(
            "inline-flex items-center justify-center w-4 h-4 rounded-full",
            "bg-amber-500/20 text-amber-500 cursor-help",
            className
          )}>
            <Layers className="w-2.5 h-2.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="text-xs font-medium">{exclusion.effectName}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {reasonText}
          </p>
          <p className="text-[10px] text-primary mt-0.5">
            → {exclusion.replacedBy}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Variante inline: badge pequeno com tooltip
  if (variant === 'inline') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] px-1.5 py-0 gap-1 cursor-help",
              "bg-amber-500/10 border-amber-500/30 text-amber-500",
              "hover:bg-amber-500/20 transition-colors",
              className
            )}
          >
            <Layers className="w-2.5 h-2.5" />
            Substituído
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px]">
          <div className="space-y-1">
            <p className="text-xs font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              Bônus não aplicado
            </p>
            <p className="text-[10px] text-muted-foreground">
              {reasonText}
            </p>
            <div className="pt-1 border-t border-border/50">
              <p className="text-[10px]">
                <span className="text-muted-foreground">Efeito ativo: </span>
                <span className="text-primary font-medium">{exclusion.replacedBy}</span>
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Variante detalhada: card expandido
  return (
    <div className={cn(
      "flex items-start gap-2 p-2 rounded-md",
      "bg-amber-500/10 border border-amber-500/30",
      className
    )}>
      <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-amber-500">
          Bônus não acumulado
          {categoryText && <span className="text-muted-foreground ml-1">({categoryText})</span>}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {reasonText}
        </p>
        <p className="text-[10px] mt-1">
          <span className="text-muted-foreground">Substituído por: </span>
          <span className="text-primary font-medium">{exclusion.replacedBy}</span>
        </p>
      </div>
    </div>
  );
});

// =====================================================
// Componente de Lista de Exclusões
// =====================================================

interface StackingExclusionsListProps {
  /** Lista de efeitos excluídos */
  exclusions: ExcludedEffect[];
  /** Título opcional */
  title?: string;
  /** Classes adicionais */
  className?: string;
}

export const StackingExclusionsList = memo(function StackingExclusionsList({
  exclusions,
  title = 'Bônus não aplicados',
  className,
}: StackingExclusionsListProps) {
  if (exclusions.length === 0) return null;

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-[10px] font-medium text-amber-500 flex items-center gap-1">
        <Layers className="w-3 h-3" />
        {title} ({exclusions.length})
      </p>
      <div className="space-y-1">
        {exclusions.map((exclusion) => (
          <StackingExclusionBadge
            key={exclusion.effectId}
            exclusion={exclusion}
            variant="detailed"
          />
        ))}
      </div>
    </div>
  );
});

export default StackingExclusionBadge;
