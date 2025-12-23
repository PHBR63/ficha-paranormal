/**
 * MobileQuickActions - Barra flutuante de ações rápidas para mobile
 * Permite acesso rápido a rolagens, descanso e outras ações frequentes
 */

import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dices, 
  Moon, 
  Shield, 
  Zap, 
  Brain,
  Sparkles,
  Plus,
  X,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  color?: string;
  onClick: () => void;
}

interface MobileQuickActionsProps {
  onRollDice: () => void;
  onRest: () => void;
  onResistance?: (type: 'fortitude' | 'reflexos' | 'vontade') => void;
  onCastRitual?: () => void;
  className?: string;
}

// Componente memoizado para performance
export const MobileQuickActions = memo(function MobileQuickActions({
  onRollDice,
  onRest,
  onResistance,
  onCastRitual,
  className,
}: MobileQuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Define ações disponíveis
  const actions: QuickAction[] = [
    {
      id: 'dice',
      icon: Dices,
      label: 'Rolar Dados',
      color: 'bg-primary text-primary-foreground',
      onClick: onRollDice,
    },
    {
      id: 'rest',
      icon: Moon,
      label: 'Descanso',
      color: 'bg-secondary text-secondary-foreground',
      onClick: onRest,
    },
  ];
  
  // Adiciona ações de resistência se disponíveis
  if (onResistance) {
    actions.push(
      {
        id: 'fortitude',
        icon: Shield,
        label: 'Fortitude',
        color: 'bg-green-600 text-white',
        onClick: () => onResistance('fortitude'),
      },
      {
        id: 'reflexos',
        icon: Zap,
        label: 'Reflexos',
        color: 'bg-blue-600 text-white',
        onClick: () => onResistance('reflexos'),
      },
      {
        id: 'vontade',
        icon: Brain,
        label: 'Vontade',
        color: 'bg-purple-600 text-white',
        onClick: () => onResistance('vontade'),
      }
    );
  }
  
  // Adiciona ação de ritual se disponível
  if (onCastRitual) {
    actions.push({
      id: 'ritual',
      icon: Sparkles,
      label: 'Conjurar',
      color: 'bg-paranormal text-white',
      onClick: onCastRitual,
    });
  }
  
  // Handler com feedback háptico
  const handleAction = useCallback((action: QuickAction) => {
    // Feedback háptico
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    action.onClick();
    setIsExpanded(false);
  }, []);
  
  // Toggle do menu
  const toggleExpanded = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <div className={cn("fixed bottom-20 right-4 z-40", className)}>
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Overlay escuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 -z-10"
              onClick={() => setIsExpanded(false)}
            />
            
            {/* Lista de ações */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-16 right-0 flex flex-col gap-2 items-end"
            >
              {actions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: 20, y: 10 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0, 
                    y: 0,
                    transition: { delay: index * 0.05 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    x: 20,
                    transition: { delay: (actions.length - index) * 0.02 }
                  }}
                  className="flex items-center gap-2"
                >
                  {/* Label */}
                  <span className="px-2 py-1 bg-background/90 backdrop-blur-sm rounded text-xs font-medium shadow-lg border border-border">
                    {action.label}
                  </span>
                  
                  {/* Botão da ação */}
                  <Button
                    size="icon"
                    className={cn(
                      "w-12 h-12 rounded-full shadow-lg",
                      action.color
                    )}
                    onClick={() => handleAction(action)}
                  >
                    <action.icon className="w-5 h-5" />
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* FAB principal */}
      <motion.div
        animate={{ rotate: isExpanded ? 45 : 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <Button
          size="icon"
          onClick={toggleExpanded}
          className={cn(
            "w-14 h-14 rounded-full shadow-xl",
            isExpanded 
              ? "bg-muted text-muted-foreground" 
              : "bg-primary text-primary-foreground"
          )}
        >
          {isExpanded ? (
            <X className="w-6 h-6" />
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </Button>
      </motion.div>
      
      {/* Indicador de ações (quando fechado) */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
          >
            <span className="text-[10px] text-white font-bold">
              {actions.length}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default MobileQuickActions;
