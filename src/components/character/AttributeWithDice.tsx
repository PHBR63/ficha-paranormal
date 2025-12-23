/**
 * AttributeWithDice - Componente de atributo com dado clicável
 * Usa constantes centralizadas de src/lib/constants/attributes.ts
 */

import { motion } from 'framer-motion';
import { Dices } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ATTRIBUTE_ORDER,
  ATTRIBUTE_COLORS,
  ATTRIBUTE_NAMES,
  ABBR_TO_KEY,
  type AttributeKey 
} from '@/lib/constants/attributes';
interface AttributeWithDiceProps {
  label: string;
  value: number;
  onRoll?: (attributeValue: number, attributeName: string) => void;
  className?: string;
}

export function AttributeWithDice({ 
  label, 
  value, 
  onRoll,
  className 
}: AttributeWithDiceProps) {
  // Converte abreviação (AGI) para chave (agility) se necessário
  const key = ABBR_TO_KEY[label] || label as AttributeKey;
  const color = ATTRIBUTE_COLORS[key] || 'hsl(var(--foreground))';
  const fullName = ATTRIBUTE_NAMES[key] || label;
  
  return (
    <motion.div
      className={cn(
        'relative group cursor-pointer',
        'flex flex-col items-center justify-center',
        'p-4 rounded-lg',
        'bg-secondary/50 border border-border',
        'hover:border-primary/50 hover:bg-secondary/70',
        'transition-all duration-200',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onRoll?.(value, fullName)}
    >
      {/* Label - nome completo em português */}
      <p className="text-xs text-muted-foreground font-display tracking-wider mb-1">
        {fullName}
      </p>
      
      {/* Value */}
      <p 
        className="font-display text-4xl transition-colors"
        style={{ color }}
      >
        {value}
      </p>
      
      {/* Dice icon on hover */}
      <motion.div
        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        initial={{ rotate: 0 }}
        whileHover={{ rotate: 20 }}
      >
        <div 
          className="w-7 h-7 rounded-full flex items-center justify-center border-2"
          style={{ 
            backgroundColor: `${color}20`,
            borderColor: color
          }}
        >
          <Dices className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </motion.div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-popover border border-border rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg">
          Clique para rolar {fullName}
        </div>
      </div>
    </motion.div>
  );
}

// Mapeamento interno para compatibilidade com formato antigo
const ABBR_ORDER = ['AGI', 'FOR', 'INT', 'PRE', 'VIG'] as const;
const KEY_TO_ABBR: Record<string, string> = {
  agility: 'AGI',
  strength: 'FOR',
  intellect: 'INT',
  presence: 'PRE',
  vigor: 'VIG',
};
interface AttributeGridProps {
  attributes: Record<string, number>;
  onRoll?: (attributeValue: number, attributeName: string) => void;
}

export function AttributeGrid({ attributes, onRoll }: AttributeGridProps) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {ATTRIBUTE_ORDER.map((key) => {
        const value = attributes[key] || 0;
        const abbr = KEY_TO_ABBR[key];
        
        return (
          <AttributeWithDice
            key={key}
            label={abbr}
            value={value}
            onRoll={onRoll}
          />
        );
      })}
    </div>
  );
}
