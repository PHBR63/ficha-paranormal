/**
 * MacroBar - Barra de macros de rolagem rápida
 * 
 * Exibe macros do personagem para acesso rápido durante o jogo.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// ScrollArea removido - usando overflow nativo para evitar bug #185 com React 19
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dices,
  Plus,
  Settings,
  Trash2,
  Edit,
  MoreVertical,
  Sword,
  Shield,
  Target,
  Heart,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
} from '@/components/icons/ordem-icons';
import type { RollMacro, MacroType } from './MacroEditor';

// Mapeamento de ícones
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  dices: Dices,
  sword: Sword,
  shield: Shield,
  target: Target,
  heart: Heart,
  sparkles: Sparkles,
  zap: Zap,
};

// Mapeamento de cores
const COLOR_MAP: Record<string, string> = {
  default: 'bg-accent hover:bg-accent/80',
  red: 'bg-red-500 hover:bg-red-600',
  green: 'bg-green-500 hover:bg-green-600',
  blue: 'bg-blue-500 hover:bg-blue-600',
  purple: 'bg-purple-500 hover:bg-purple-600',
  yellow: 'bg-yellow-500 hover:bg-yellow-600',
  orange: 'bg-orange-500 hover:bg-orange-600',
};

interface MacroBarProps {
  macros: RollMacro[];
  onRoll: (macro: RollMacro) => void;
  onEdit: (macro: RollMacro) => void;
  onDelete: (macroId: string) => void;
  onAddNew: () => void;
  className?: string;
  compact?: boolean;
}

export function MacroBar({
  macros,
  onRoll,
  onEdit,
  onDelete,
  onAddNew,
  className,
  compact = false,
}: MacroBarProps) {
  const [expanded, setExpanded] = useState(!compact);

  // Filtra apenas macros visíveis na barra
  const visibleMacros = useMemo(() => 
    macros.filter(m => m.showInBar),
    [macros]
  );

  // Agrupa por tipo
  const macrosByType = useMemo(() => {
    return visibleMacros.reduce((acc, macro) => {
      if (!acc[macro.type]) {
        acc[macro.type] = [];
      }
      acc[macro.type].push(macro);
      return acc;
    }, {} as Record<MacroType, RollMacro[]>);
  }, [visibleMacros]);

  if (visibleMacros.length === 0 && !compact) {
    return (
      <div className={cn(
        'flex items-center justify-center p-4 border border-dashed border-border rounded-lg',
        className
      )}>
        <div className="text-center">
          <Dices className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground mb-2">
            Nenhuma macro configurada
          </p>
          <Button variant="outline" size="sm" onClick={onAddNew} className="gap-2">
            <Plus className="w-4 h-4" />
            Criar Macro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dices className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Macros Rápidas</span>
          <Badge variant="secondary" className="text-xs">
            {visibleMacros.length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddNew}
            className="h-7 w-7 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
          {compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-7 w-7 p-0"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Lista de Macros */}
      <AnimatePresence>
        {(expanded || !compact) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-full overflow-x-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              <div className="flex gap-2 pb-2">
                <TooltipProvider delayDuration={300}>
                  {visibleMacros.map((macro) => (
                    <MacroButton
                      key={macro.id}
                      macro={macro}
                      onRoll={() => onRoll(macro)}
                      onEdit={() => onEdit(macro)}
                      onDelete={() => onDelete(macro.id)}
                    />
                  ))}
                </TooltipProvider>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Botão individual de macro
 */
function MacroButton({
  macro,
  onRoll,
  onEdit,
  onDelete,
}: {
  macro: RollMacro;
  onRoll: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = ICON_MAP[macro.icon || 'dices'] || Dices;
  const colorClass = COLOR_MAP[macro.color || 'default'] || COLOR_MAP.default;

  // Formata a rolagem
  const rollFormula = `${macro.diceCount}d${macro.diceType}${
    macro.bonus > 0 ? `+${macro.bonus}` : macro.bonus < 0 ? macro.bonus : ''
  }`;

  return (
    <div className="flex-shrink-0 group relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="default"
            size="sm"
            onClick={onRoll}
            className={cn(
              'h-9 px-3 gap-2 text-white border-0 transition-all',
              colorClass
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="max-w-[80px] truncate">{macro.name}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <div className="space-y-1">
            <p className="font-medium">{macro.name}</p>
            <p className="text-xs text-muted-foreground">{rollFormula}</p>
            {macro.description && (
              <p className="text-xs">{macro.description}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Menu de contexto */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'absolute -top-1 -right-1 h-5 w-5 rounded-full',
              'bg-background border border-border shadow-sm',
              'opacity-0 group-hover:opacity-100 transition-opacity'
            )}
          >
            <MoreVertical className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={onRoll}>
            <Dices className="w-4 h-4 mr-2" />
            Rolar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Versão inline/compacta para uso em outros componentes
 */
export function MacroBarInline({
  macros,
  onRoll,
  maxVisible = 5,
  className,
}: {
  macros: RollMacro[];
  onRoll: (macro: RollMacro) => void;
  maxVisible?: number;
  className?: string;
}) {
  const visibleMacros = macros.filter(m => m.showInBar).slice(0, maxVisible);
  const remaining = macros.filter(m => m.showInBar).length - maxVisible;

  if (visibleMacros.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <TooltipProvider delayDuration={300}>
        {visibleMacros.map((macro) => {
          const Icon = ICON_MAP[macro.icon || 'dices'] || Dices;
          const colorClass = COLOR_MAP[macro.color || 'default'] || COLOR_MAP.default;

          return (
            <Tooltip key={macro.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  onClick={() => onRoll(macro)}
                  className={cn('h-7 w-7 text-white border-0', colorClass)}
                >
                  <Icon className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{macro.name}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>

      {remaining > 0 && (
        <Badge variant="secondary" className="text-xs">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}
