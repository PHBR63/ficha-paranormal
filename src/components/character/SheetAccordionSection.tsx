/**
 * SheetAccordionSection - Seção colapsável genérica para a ficha
 * Usado para Habilidades, Pessoas Importantes, Itens, etc.
 */

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SheetAccordionSectionProps {
  title: string;
  icon?: LucideIcon;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'paranormal' | 'destructive' | 'secondary';
}

export function SheetAccordionSection({
  title,
  icon: Icon,
  count,
  defaultOpen = false,
  children,
  className,
  variant = 'default',
}: SheetAccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Cores por variante
  const variantColors = {
    default: 'text-primary',
    paranormal: 'text-paranormal',
    destructive: 'text-destructive',
    secondary: 'text-secondary',
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn("sheet-panel", className)}>
        <CollapsibleTrigger asChild>
          <motion.div
            className={cn(
              "flex items-center justify-between p-4 cursor-pointer",
              "hover:bg-primary/5 transition-colors rounded-lg"
            )}
            whileHover={{ scale: 1.005 }}
          >
            <div className="flex items-center gap-2">
              {Icon && <Icon className={cn("w-4 h-4", variantColors[variant])} />}
              <span className={cn(
                "font-display text-sm tracking-wider uppercase",
                variantColors[variant]
              )}>
                {title}
              </span>
              {count !== undefined && count > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({count})
                </span>
              )}
            </div>
            <ChevronDown 
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </motion.div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 pb-4"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Componente auxiliar para item de lista dentro do acordeão
interface SheetAccordionItemProps {
  title: string;
  description?: string;
  badge?: string;
  badgeVariant?: 'default' | 'paranormal' | 'destructive' | 'secondary';
  onClick?: () => void;
}

export function SheetAccordionItem({
  title,
  description,
  badge,
  badgeVariant = 'default',
  onClick,
}: SheetAccordionItemProps) {
  const badgeColors = {
    default: 'bg-primary/20 text-primary',
    paranormal: 'bg-paranormal/20 text-paranormal',
    destructive: 'bg-destructive/20 text-destructive',
    secondary: 'bg-secondary/50 text-secondary-foreground',
  };

  return (
    <motion.div
      className={cn(
        "p-3 rounded-lg sheet-panel-inner",
        "transition-all duration-200",
        onClick && "cursor-pointer hover:border-primary/30"
      )}
      whileHover={onClick ? { scale: 1.01 } : undefined}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>
        {badge && (
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded flex-shrink-0",
            badgeColors[badgeVariant]
          )}>
            {badge}
          </span>
        )}
      </div>
    </motion.div>
  );
}
