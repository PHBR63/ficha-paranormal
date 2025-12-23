/**
 * AttributeGridNew - Grid de atributos estilo ficha de papel
 * Com d20 vermelho clicável para cada atributo
 * OTIMIZAÇÃO: Componente memoizado para evitar re-renders desnecessários
 * 
 * Usa constantes centralizadas de src/lib/constants/attributes.ts
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { 
  ATTRIBUTE_ORDER, 
  ATTRIBUTE_DISPLAY, 
  ATTRIBUTE_COLORS,
  type AttributeKey 
} from '@/lib/constants/attributes';

interface AttributeGridNewProps {
  attributes: Record<string, number>;
  onRoll?: (attributeValue: number, attributeName: string) => void;
  className?: string;
}

// Componente do D20 vermelho
function D20Icon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={cn("w-6 h-6", className)}
    >
      <path d="M12 2L2 7L12 12L22 7L12 2Z" />
      <path d="M2 17L12 22L22 17L12 12L2 17Z" opacity="0.7" />
      <path d="M2 7V17L12 12V2L2 7Z" opacity="0.5" />
      <path d="M22 7V17L12 12V2L22 7Z" opacity="0.5" />
    </svg>
  );
}

export const AttributeGridNew = memo(function AttributeGridNew({ 
  attributes, 
  onRoll, 
  className 
}: AttributeGridNewProps) {
  

  return (
    <div className={cn("sheet-panel p-4", className)}>
      <h3 className="font-display text-sm tracking-wider text-primary mb-4 uppercase">
        Atributos
      </h3>
      
      <div className="grid grid-cols-5 gap-3">
        {ATTRIBUTE_ORDER.map((key) => {
          const value = attributes[key] || 0;
          const display = ATTRIBUTE_DISPLAY[key];
          const color = ATTRIBUTE_COLORS[key];
          
          return (
            <div
              key={key}
              className={cn(
                "relative group cursor-pointer",
                "flex flex-col items-center justify-center",
                "p-3 rounded-lg",
                "sheet-panel-inner",
                "hover:border-primary/50 hover:scale-[1.03] active:scale-[0.97]",
                "transition-all duration-200"
              )}
              onClick={() => onRoll?.(value, display.name)}
            >
              {/* D20 vermelho clicável */}
              <div className="absolute -top-2 -right-2 text-destructive opacity-70 group-hover:opacity-100 group-hover:rotate-12 transition-all duration-200">
                <D20Icon className="w-5 h-5" />
              </div>
              
              {/* Valor do atributo */}
              <span 
                className="font-display text-3xl"
                style={{ color }}
              >
                {value}
              </span>
              
              {/* Nome do atributo - nome completo em português */}
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                {display.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
