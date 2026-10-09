/**
 * MobileCollapsibleSection - Seção colapsável otimizada e memoizada para mobile
 * Versão extraída do MobileCharacterSheet com melhorias de performance
 */

import { useState, memo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';

interface MobileCollapsibleSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  /** Callback quando estado muda */
  onToggle?: (isOpen: boolean) => void;
  /** Classe CSS adicional para o container */
  className?: string;
  /** Classe CSS para o conteúdo */
  contentClassName?: string;
}

export const MobileCollapsibleSection = memo(function MobileCollapsibleSection({ 
  title, 
  icon, 
  children, 
  defaultOpen = false,
  badge,
  onToggle,
  className,
  contentClassName,
}: MobileCollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
    
    // Feedback háptico sutil
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  };

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      <button
        onClick={handleToggle}
        className={cn(
          "w-full flex items-center justify-between p-3 bg-card/50",
          "active:bg-card/70 transition-colors",
          isOpen && "border-b border-border"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <span className="font-display text-sm tracking-wider">{title}</span>
          {badge !== undefined && (
            <span className="px-1.5 py-0.5 text-[10px] bg-primary/20 text-primary rounded">
              {badge}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={cn("p-3 bg-card/30", contentClassName)}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default MobileCollapsibleSection;
