import { motion } from 'framer-motion';
import { Dices } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttributeWithDiceProps {
  label: string;
  value: number;
  onRoll?: (attributeValue: number, attributeName: string) => void;
  className?: string;
}

const ATTRIBUTE_COLORS: Record<string, string> = {
  AGI: 'hsl(var(--accent))',
  FOR: 'hsl(var(--destructive))',
  INT: 'hsl(var(--primary))',
  PRE: 'hsl(var(--paranormal))',
  VIG: 'hsl(var(--success))',
};

const ATTRIBUTE_FULL_NAMES: Record<string, string> = {
  AGI: 'Agilidade',
  FOR: 'Força',
  INT: 'Intelecto',
  PRE: 'Presença',
  VIG: 'Vigor',
};

export function AttributeWithDice({ 
  label, 
  value, 
  onRoll,
  className 
}: AttributeWithDiceProps) {
  const color = ATTRIBUTE_COLORS[label] || 'hsl(var(--foreground))';
  const fullName = ATTRIBUTE_FULL_NAMES[label] || label;
  
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
      {/* Label */}
      <p className="text-xs text-muted-foreground font-display tracking-wider mb-1">
        {label}
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

interface AttributeGridProps {
  attributes: Record<string, number>;
  onRoll?: (attributeValue: number, attributeName: string) => void;
}

export function AttributeGrid({ attributes, onRoll }: AttributeGridProps) {
  const order = ['AGI', 'FOR', 'INT', 'PRE', 'VIG'];
  const attributeMap: Record<string, string> = {
    agility: 'AGI',
    strength: 'FOR',
    intellect: 'INT',
    presence: 'PRE',
    vigor: 'VIG',
  };
  
  return (
    <div className="grid grid-cols-5 gap-3">
      {order.map((label) => {
        const key = Object.keys(attributeMap).find(k => attributeMap[k] === label);
        const value = key ? attributes[key] || 0 : 0;
        
        return (
          <AttributeWithDice
            key={label}
            label={label}
            value={value}
            onRoll={onRoll}
          />
        );
      })}
    </div>
  );
}
