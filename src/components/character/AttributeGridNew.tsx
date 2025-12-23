/**
 * AttributeGridNew - Grid de atributos estilo ficha de papel
 * Com d20 vermelho clicável para cada atributo
 * OTIMIZAÇÃO: Componente memoizado para evitar re-renders desnecessários
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AttributeGridNewProps {
  attributes: Record<string, number>;
  onRoll?: (attributeValue: number, attributeName: string) => void;
  className?: string;
}

// Nomes dos atributos em português para a ficha
const ATTRIBUTE_DISPLAY: Record<string, { label: string; abbr: string }> = {
  agility: { label: 'Agilidade', abbr: 'AGI' },
  strength: { label: 'Força', abbr: 'FOR' },
  intellect: { label: 'Intelecto', abbr: 'INT' },
  presence: { label: 'Presença', abbr: 'PRE' },
  vigor: { label: 'Vigor', abbr: 'VIG' },
};

// Cores dos atributos
const ATTRIBUTE_COLORS: Record<string, string> = {
  agility: 'hsl(var(--attr-agility))',
  strength: 'hsl(var(--attr-strength))',
  intellect: 'hsl(var(--attr-intellect))',
  presence: 'hsl(var(--attr-presence))',
  vigor: 'hsl(var(--attr-vigor))',
};

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
  const order = ['agility', 'strength', 'intellect', 'presence', 'vigor'];

  return (
    <div className={cn("sheet-panel p-4", className)}>
      <h3 className="font-display text-sm tracking-wider text-primary mb-4 uppercase">
        Atributos
      </h3>
      
      <div className="grid grid-cols-5 gap-3">
        {order.map((key) => {
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
              onClick={() => onRoll?.(value, display.label)}
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
                {display.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
