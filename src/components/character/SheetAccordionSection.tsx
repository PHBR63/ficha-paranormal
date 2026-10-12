/**
 * SheetAccordionSection - Seção colapsável genérica para a ficha
 * Usado para Habilidades, Pessoas Importantes, Itens, etc.
 */

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LucideIcon, Zap } from '@/components/icons/ordem-icons';
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
    secondary: 'text-detail-accent',
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
  isActive?: boolean;
}

export function SheetAccordionItem({
  title,
  description,
  badge,
  badgeVariant = 'default',
  onClick,
  isActive = false,
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
        "p-3 rounded-lg sheet-panel-inner relative",
        "transition-all duration-200",
        onClick && "cursor-pointer hover:border-primary/30",
        isActive && "ring-2 ring-primary/50 bg-primary/5"
      )}
      whileHover={onClick ? { scale: 1.01 } : undefined}
      onClick={onClick}
    >
      {isActive && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <Zap className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={cn(
              "font-medium text-sm",
              isActive && "text-primary"
            )}>{title}</p>
            {isActive && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-semibold uppercase">
                Ativo
              </span>
            )}
          </div>
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
