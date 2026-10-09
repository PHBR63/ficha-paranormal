/**
 * TrainingGradeIndicator - Indicador visual das perícias aprimoradas pelo Grau de Treinamento
 * 
 * Exibe as perícias selecionadas com seus upgrades (Treinado→Veterano ou Veterano→Expert)
 * Similar ao EspecialistaArmaIndicator e PeritoIndicator
 * 
 * @module TrainingGradeIndicator
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Check, ArrowRight, Settings, AlertTriangle } from '@/components/icons/ordem-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SKILLS } from '@/lib/character-data';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Tipos
export interface SkillUpgradeChoice {
  skillId: string;
  fromLevel: number;
  toLevel: number;
}

export interface TrainingGradeIndicatorProps {
  /** NEX desta seleção (35 ou 70) */
  nex: 35 | 70;
  /** Escolhas de upgrade de perícias */
  choices: SkillUpgradeChoice[];
  /** Número esperado de escolhas baseado na classe e intelecto */
  expectedCount: number;
  /** Se o componente está em modo compacto */
  compact?: boolean;
  /** Classe CSS adicional */
  className?: string;
  /** Handler para abrir modal de configuração */
  onConfigure?: () => void;
}

// Labels para níveis de treinamento
const LEVEL_LABELS: Record<number, string> = {
  0: 'Destr.',
  1: 'Treinado',
  2: 'Veterano',
  3: 'Expert',
};

// Cores para níveis
const LEVEL_COLORS: Record<number, string> = {
  0: 'bg-muted text-muted-foreground',
  1: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  2: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  3: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

/**
 * Obtém o nome legível de uma perícia pelo ID
 */
function getSkillName(skillId: string): string {
  const skill = SKILLS.find(s => s.id === skillId);
  return skill?.name || skillId.replace(/_/g, ' ');
}

export const TrainingGradeIndicator = memo(function TrainingGradeIndicator({
  nex,
  choices,
  expectedCount,
  compact = false,
  className,
  onConfigure,
}: TrainingGradeIndicatorProps) {
  const isConfigured = choices.length > 0;
  const isComplete = choices.length >= expectedCount;
  
  // Modo compacto para tooltips
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer",
                isComplete
                  ? "bg-green-500/10 border border-green-500/30"
                  : "bg-amber-500/10 border border-amber-500/30",
                className
              )}
              onClick={onConfigure}
            >
              <GraduationCap className={cn(
                "w-4 h-4",
                isComplete ? "text-green-400" : "text-amber-400"
              )} />
              <span className={cn(
                "text-xs font-medium",
                isComplete ? "text-green-400" : "text-amber-400"
              )}>
                {choices.length}/{expectedCount}
              </span>
              {isComplete ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-amber-400" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold text-sm">Grau de Treinamento (NEX {nex}%)</p>
              {isConfigured ? (
                <div className="space-y-1">
                  {choices.map((choice, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-xs">
                      <span>{getSkillName(choice.skillId)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className={cn(
                        "px-1 rounded text-[10px]",
                        LEVEL_COLORS[choice.toLevel]
                      )}>
                        {LEVEL_LABELS[choice.toLevel]}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-400">Clique para configurar</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Modo expandido
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 rounded-lg border space-y-2",
        isComplete
          ? "bg-green-500/5 border-green-500/20"
          : "bg-amber-500/5 border-amber-500/20",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className={cn(
            "w-4 h-4",
            isComplete ? "text-green-400" : "text-amber-400"
          )} />
          <span className="text-xs font-medium text-muted-foreground">
            Perícias Aprimoradas (NEX {nex}%)
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px]",
            isComplete
              ? "bg-green-500/20 text-green-400 border-green-500/30"
              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
          )}
        >
          {choices.length}/{expectedCount}
        </Badge>
      </div>
      
      {/* Lista de perícias ou estado vazio */}
      {isConfigured ? (
        <div className="flex flex-wrap gap-1.5">
          {choices.map((choice, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 px-2 py-1 bg-muted/30 rounded-md border border-border/50"
            >
              <span className="text-xs font-medium">{getSkillName(choice.skillId)}</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <Badge
                variant="outline"
                className={cn("text-[10px] px-1 py-0", LEVEL_COLORS[choice.toLevel])}
              >
                {LEVEL_LABELS[choice.toLevel]}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-amber-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs">Nenhuma perícia configurada</span>
        </div>
      )}
      
      {/* Botão de configuração - sempre visível e destacado quando não configurado */}
      {onConfigure && (
        <Button
          variant={isComplete ? "outline" : "default"}
          size="sm"
          onClick={onConfigure}
          className={cn(
            "w-full text-sm h-10 font-medium",
            isComplete
              ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
              : "bg-amber-500 hover:bg-amber-600 text-black animate-pulse"
          )}
        >
          <Settings className="w-4 h-4 mr-2" />
          {isConfigured ? 'Editar Seleção' : '⚠️ CONFIGURAR PERÍCIAS'}
        </Button>
      )}
    </motion.div>
  );
});

export default TrainingGradeIndicator;
