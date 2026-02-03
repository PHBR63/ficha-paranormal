/**
 * Componente de Roadmap de Progressão
 * Exibe sugestões de evolução do personagem por NEX
 * Visual de timeline interativa com marcos de progressão
 * 
 * @module components/templates/ProgressionRoadmap
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Sparkles,
  BookOpen,
  Target,
  ChevronRight,
  CheckCircle2,
  Circle,
  Zap,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { TemplateProgression, TemplateProgressionSuggestion } from '@/types/templates';

// ========================================
// Tipos e Interfaces
// ========================================

interface ProgressionRoadmapProps {
  /** Lista de sugestões de progressão */
  progression: TemplateProgression[];
  /** NEX atual do personagem (para destacar próximos passos) */
  currentNex?: number;
  /** Classe do personagem (para styling) */
  classId?: string;
  /** Modo compacto para cards */
  compact?: boolean;
  /** Classes adicionais */
  className?: string;
}

interface ProgressionStepProps {
  step: TemplateProgression;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  isLast: boolean;
  classId?: string;
  compact?: boolean;
}

// ========================================
// Constantes de Estilo
// ========================================

// Cores por classe
const CLASS_COLORS: Record<string, { primary: string; secondary: string; glow: string }> = {
  combatente: {
    primary: 'text-red-500',
    secondary: 'bg-red-500/10 border-red-500/30',
    glow: 'shadow-red-500/20',
  },
  especialista: {
    primary: 'text-blue-500',
    secondary: 'bg-blue-500/10 border-blue-500/30',
    glow: 'shadow-blue-500/20',
  },
  ocultista: {
    primary: 'text-purple-500',
    secondary: 'bg-purple-500/10 border-purple-500/30',
    glow: 'shadow-purple-500/20',
  },
};

// Cores por faixa de NEX (patentes aproximadas)
const NEX_COLORS: Record<string, string> = {
  '5': 'bg-gray-500',      // Recruta
  '10': 'bg-emerald-500',  // Operador
  '15': 'bg-emerald-600',  // Operador
  '20': 'bg-blue-500',     // Agente Especial
  '25': 'bg-blue-600',     // Agente Especial
  '30': 'bg-indigo-500',   // Agente de Elite
  '40': 'bg-purple-500',   // Patentes altas
  '50': 'bg-amber-500',    // Oficial de Operações
  '60': 'bg-orange-500',   // Patentes superiores
  '70': 'bg-red-500',      // Patentes superiores
  '99': 'bg-rose-600',     // Máximo
};

// Obtém cor por NEX
function getNexColor(nex: number): string {
  const breakpoints = Object.keys(NEX_COLORS).map(Number).sort((a, b) => a - b);
  for (const bp of breakpoints) {
    if (nex <= bp) return NEX_COLORS[bp.toString()];
  }
  return NEX_COLORS['99'];
}

// ========================================
// Componente de Passo Individual
// ========================================

function ProgressionStep({
  step,
  index,
  isActive,
  isCompleted,
  isLast,
  classId = 'combatente',
  compact = false,
}: ProgressionStepProps) {
  const colors = CLASS_COLORS[classId.toLowerCase()] || CLASS_COLORS.combatente;
  const nexColor = getNexColor(step.nex);

  // Ícone de status
  const StatusIcon = isCompleted ? CheckCircle2 : isActive ? Zap : Circle;

  // Determina ícone do tipo de sugestão
  const getSuggestionIcon = (suggestion: TemplateProgressionSuggestion) => {
    if (suggestion.power) return Sparkles;
    if (suggestion.ritual) return BookOpen;
    if (suggestion.attribute_increase) return Target;
    return Star;
  };

  const SuggestionIcon = getSuggestionIcon(step.suggestions);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'relative flex gap-4',
        !isLast && 'pb-6'
      )}
    >
      {/* Linha de conexão vertical */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-[15px] top-8 w-0.5 h-[calc(100%-2rem)]',
            isCompleted ? colors.primary.replace('text-', 'bg-') : 'bg-border'
          )}
        />
      )}

      {/* Indicador de status */}
      <div className="relative z-10 shrink-0">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
            isCompleted && `${colors.secondary} ${colors.primary}`,
            isActive && `${colors.secondary} ${colors.primary} shadow-lg ${colors.glow}`,
            !isCompleted && !isActive && 'bg-muted border-border text-muted-foreground'
          )}
        >
          <StatusIcon className="w-4 h-4" />
        </div>
      </div>

      {/* Conteúdo do passo */}
      <div className={cn('flex-1 min-w-0', compact && 'pb-2')}>
        {/* Header com NEX */}
        <div className="flex items-center gap-2 mb-2">
          <Badge
            className={cn(
              'font-mono text-xs text-white',
              nexColor,
              isActive && 'animate-pulse'
            )}
          >
            NEX {step.nex}%
          </Badge>
          {isActive && (
            <Badge variant="outline" className="text-xs border-primary text-primary">
              Próximo
            </Badge>
          )}
          {isCompleted && (
            <Badge variant="outline" className="text-xs border-green-500 text-green-500">
              Concluído
            </Badge>
          )}
        </div>

        {/* Card de sugestão */}
        <Card
          className={cn(
            'transition-all',
            isActive && `border-2 ${colors.secondary}`,
            compact && 'py-2'
          )}
        >
          <CardContent className={cn('p-3 space-y-2', compact && 'py-2')}>
            {/* Poder sugerido */}
            {step.suggestions.power && (
              <div className="flex items-start gap-2">
                <Sparkles className={cn('w-4 h-4 mt-0.5 shrink-0', colors.primary)} />
                <div>
                  <p className="text-xs text-muted-foreground">Poder</p>
                  <p className="text-sm font-medium">{step.suggestions.power}</p>
                </div>
              </div>
            )}

            {/* Ritual sugerido */}
            {step.suggestions.ritual && (
              <div className="flex items-start gap-2">
                <BookOpen className={cn('w-4 h-4 mt-0.5 shrink-0', colors.primary)} />
                <div>
                  <p className="text-xs text-muted-foreground">Ritual</p>
                  <p className="text-sm font-medium">{step.suggestions.ritual}</p>
                </div>
              </div>
            )}

            {/* Aumento de atributo */}
            {step.suggestions.attribute_increase && (
              <div className="flex items-start gap-2">
                <Target className={cn('w-4 h-4 mt-0.5 shrink-0', colors.primary)} />
                <div>
                  <p className="text-xs text-muted-foreground">Atributo</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {Object.entries(step.suggestions.attribute_increase).map(([attr, bonus]) => (
                      <Badge key={attr} variant="secondary" className="text-xs">
                        +{bonus} {attr.charAt(0).toUpperCase() + attr.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notas adicionais */}
            {step.suggestions.notes && (
              <p className="text-xs text-muted-foreground italic border-t border-border/50 pt-2 mt-2">
                {step.suggestions.notes}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// ========================================
// Componente Principal
// ========================================

export function ProgressionRoadmap({
  progression,
  currentNex = 5,
  classId = 'combatente',
  compact = false,
  className,
}: ProgressionRoadmapProps) {
  // Ordena progressão por NEX
  const sortedProgression = useMemo(() => {
    return [...progression].sort((a, b) => a.nex - b.nex);
  }, [progression]);

  // Encontra índice do passo ativo (próximo NEX a alcançar)
  const activeIndex = useMemo(() => {
    return sortedProgression.findIndex(step => step.nex > currentNex);
  }, [sortedProgression, currentNex]);

  // Estatísticas
  const stats = useMemo(() => {
    const completed = sortedProgression.filter(s => s.nex <= currentNex).length;
    const total = sortedProgression.length;
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100) || 0,
    };
  }, [sortedProgression, currentNex]);

  const colors = CLASS_COLORS[classId?.toLowerCase()] || CLASS_COLORS.combatente;

  if (progression.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
        <TrendingUp className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">
          Nenhuma sugestão de progressão disponível
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className={cn('w-5 h-5', colors.primary)} />
          <h3 className="font-semibold">Roadmap de Progressão</h3>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1">
                {stats.completed}/{stats.total}
                <span className="text-muted-foreground">({stats.percentage}%)</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{stats.completed} de {stats.total} marcos alcançados</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Barra de progresso visual */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            colors.primary.replace('text-', 'bg-')
          )}
          initial={{ width: 0 }}
          animate={{ width: `${stats.percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Timeline de progressão */}
      <div className="space-y-0">
        {sortedProgression.map((step, index) => (
          <ProgressionStep
            key={`${step.nex}-${index}`}
            step={step}
            index={index}
            isActive={index === activeIndex}
            isCompleted={step.nex <= currentNex}
            isLast={index === sortedProgression.length - 1}
            classId={classId}
            compact={compact}
          />
        ))}
      </div>

      {/* Mensagem de conclusão */}
      {stats.completed === stats.total && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'flex items-center justify-center gap-2 p-4 rounded-lg border',
            colors.secondary
          )}
        >
          <CheckCircle2 className={cn('w-5 h-5', colors.primary)} />
          <p className="font-medium">Todos os marcos de progressão foram alcançados!</p>
        </motion.div>
      )}
    </div>
  );
}

// ========================================
// Versão Compacta para Cards
// ========================================

interface MiniProgressionProps {
  progression: TemplateProgression[];
  classId?: string;
  maxItems?: number;
  className?: string;
}

export function MiniProgression({
  progression,
  classId = 'combatente',
  maxItems = 3,
  className,
}: MiniProgressionProps) {
  const colors = CLASS_COLORS[classId?.toLowerCase()] || CLASS_COLORS.combatente;
  const sortedProgression = [...progression].sort((a, b) => a.nex - b.nex);
  const displayItems = sortedProgression.slice(0, maxItems);
  const remaining = sortedProgression.length - maxItems;

  if (progression.length === 0) return null;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <TrendingUp className="w-3 h-3" />
        <span>Progressão</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {displayItems.map((step, idx) => (
          <TooltipProvider key={idx}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs cursor-help',
                    idx === 0 && colors.secondary
                  )}
                >
                  NEX {step.nex}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {step.suggestions.power && <p>Poder: {step.suggestions.power}</p>}
                {step.suggestions.ritual && <p>Ritual: {step.suggestions.ritual}</p>}
                {step.suggestions.notes && <p className="text-muted-foreground">{step.suggestions.notes}</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {remaining > 0 && (
          <Badge variant="secondary" className="text-xs">
            +{remaining}
          </Badge>
        )}
      </div>
    </div>
  );
}
