/**
 * EffectCategorySection - Seção colapsável para uma categoria de efeitos
 * 
 * Agrupa efeitos por categoria (Combate, Defesa, Recursos, etc.)
 * com suporte a breakdown detalhado e modo compacto.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from '@/components/icons/ordem-icons';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { BreakdownItem } from './sue-debug-types';

interface EffectCategorySectionProps {
  /** Título da seção */
  title: string;
  /** Ícone da categoria */
  icon: React.ElementType;
  /** Cor do ícone/título */
  color: string;
  /** Itens a exibir */
  items: Array<{ 
    label: string; 
    value: number; 
    breakdown?: BreakdownItem[] 
  }>;
  /** Modo compacto */
  compact?: boolean;
  /** Inicia aberto */
  defaultOpen?: boolean;
}

/**
 * Seção colapsável para uma categoria de efeitos computados
 */
export function EffectCategorySection({
  title,
  icon: Icon,
  color,
  items,
  compact,
  defaultOpen = true,
}: EffectCategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  // Só renderiza se houver valores não-zero
  const hasValues = items.some(item => item.value !== 0);
  if (!hasValues) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
          {isOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <Icon className={cn("h-4 w-4", color)} />
          <span className="text-sm font-medium">{title}</span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={cn(
          "grid gap-1 pl-6 pt-1", 
          compact ? "grid-cols-2" : "grid-cols-3"
        )}>
          {items.map((item, idx) => (
            item.value !== 0 && (
              <div 
                key={idx} 
                className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1"
              >
                <span className="text-muted-foreground truncate">
                  {item.label}
                </span>
                <Badge 
                  variant={item.value > 0 ? "default" : "destructive"} 
                  className="text-xs ml-1"
                >
                  {item.value > 0 ? '+' : ''}{item.value}
                </Badge>
              </div>
            )
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
