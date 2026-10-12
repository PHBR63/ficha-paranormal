/**
 * PeritoIndicator - Indicador visual para o poder Perito (Especialista)
 * Mostra quais perícias foram escolhidas e o dado extra disponível por NEX
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, Zap } from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';
import { SKILLS } from '@/lib/character-data';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PeritoIndicatorProps {
  /** IDs das perícias escolhidas para Perito */
  chosenSkills: string[];
  /** NEX atual do personagem (para calcular dado extra) */
  nex: number;
  /** Se exibir em modo compacto (inline) */
  compact?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Calcula o dado e custo do Perito baseado no NEX
 * Conforme Livro Base: 1d6 (2PE) → 1d8 (3PE) → 1d10 (4PE) → 1d12 (5PE)
 */
function getPeritoExtraDice(nex: number): { dice: string; cost: number } {
  if (nex >= 85) return { dice: '1d12', cost: 5 };
  if (nex >= 55) return { dice: '1d10', cost: 4 };
  if (nex >= 25) return { dice: '1d8', cost: 3 };
  return { dice: '1d6', cost: 2 };
}

/**
 * Obtém o nome da perícia pelo ID
 */
function getSkillName(skillId: string): string {
  const skill = SKILLS.find(s => s.id === skillId || s.name.toLowerCase() === skillId.toLowerCase());
  return skill?.name || skillId;
}

export const PeritoIndicator = memo(function PeritoIndicator({
  chosenSkills,
  nex,
  compact = false,
  className,
}: PeritoIndicatorProps) {
  if (!chosenSkills || chosenSkills.length === 0) {
    return null;
  }

  const peritoData = getPeritoExtraDice(nex);
  const skillNames = chosenSkills.map(getSkillName);

  if (compact) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                "bg-secondary/20 text-detail-accent border border-secondary/30",
                className
              )}
            >
              <Sparkles className="w-3 h-3" />
              <span>{peritoData.dice} • {chosenSkills.length} perícia{chosenSkills.length > 1 ? 's' : ''}</span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium text-xs">Perito (Especialista)</p>
              <div className="space-y-1">
                {skillNames.map((name, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-1.5 text-xs text-foreground"
                  >
                    <BookOpen className="w-3 h-3 text-detail-accent" />
                    <span>{name}</span>
                    <span className="text-[9px] px-1 py-0.5 bg-secondary/20 rounded text-detail-accent">
                      +{peritoData.dice}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground border-t border-border pt-1">
                Custo: {peritoData.cost} PE por ativação
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Versão expandida (para exibição detalhada)
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 rounded-lg border bg-secondary/5 border-secondary/20",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-secondary/20">
            <Sparkles className="w-3.5 h-3.5 text-detail-accent" />
          </div>
          <span className="text-xs font-medium">Perito</span>
        </div>
        
        <div className="flex items-center gap-1 px-2 py-0.5 bg-secondary/20 text-detail-accent rounded-full text-[10px] font-semibold">
          <Zap className="w-3 h-3" />
          <span>+{peritoData.dice} ({peritoData.cost} PE)</span>
        </div>
      </div>

      {/* Lista de perícias */}
      <div className="flex flex-wrap gap-1.5">
        {skillNames.map((name, idx) => (
          <motion.div
            key={idx}
            layout
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-secondary/10 text-detail-accent border border-secondary/20"
          >
            <BookOpen className="w-3 h-3" />
            <span>{name}</span>
          </motion.div>
        ))}
      </div>

      {/* Info de escalonamento */}
      <div className="mt-2 pt-2 border-t border-secondary/20">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Escalonamento por NEX:</span>
          <div className="flex gap-1">
            <span className={cn("px-1 rounded", nex >= 5 && nex < 25 ? "bg-secondary/20 text-detail-accent" : "")}>
              1d6
            </span>
            <span className={cn("px-1 rounded", nex >= 25 && nex < 55 ? "bg-secondary/20 text-detail-accent" : "")}>
              → 1d8
            </span>
            <span className={cn("px-1 rounded", nex >= 55 && nex < 85 ? "bg-secondary/20 text-detail-accent" : "")}>
              → 1d10
            </span>
            <span className={cn("px-1 rounded", nex >= 85 ? "bg-secondary/20 text-detail-accent" : "")}>
              → 1d12
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default PeritoIndicator;
