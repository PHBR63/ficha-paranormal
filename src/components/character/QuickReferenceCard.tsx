/**
 * QuickReferenceCard - Card de referência rápida de regras
 * Mostra limite de PE, ações de combate e resistências com bônus
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ChevronDown, 
  Zap, 
  Target, 
  Shield, 
  Footprints,
  Brain 
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getPELimitByNex } from '@/lib/dice-roller';
import { ResistanceBonuses } from '@/hooks/useDefenseBonuses';

interface QuickReferenceCardProps {
  nex: number;
  vigor: number;
  agility: number;
  presence: number;
  // Bônus de resistências opcionais
  resistanceBonuses?: ResistanceBonuses;
  className?: string;
}

export function QuickReferenceCard({ 
  nex, 
  vigor, 
  agility, 
  presence,
  resistanceBonuses,
  className 
}: QuickReferenceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const peLimit = getPELimitByNex(nex);

  // Extrai bônus de resistências (defaults para 0)
  const fortBonus = resistanceBonuses?.fortitude || 0;
  const refBonus = resistanceBonuses?.reflexos || 0;
  const vonBonus = resistanceBonuses?.vontade || 0;
  const resistanceBreakdown = resistanceBonuses?.breakdown || [];

  return (
    <div className={cn("ordo-panel overflow-hidden", className)}>
      {/* Header sempre visível */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="font-display text-sm tracking-wider">REFERÊNCIA RÁPIDA</span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform",
          isExpanded && "rotate-180"
        )} />
      </button>

      {/* Conteúdo compacto sempre visível */}
      <div className="px-3 pb-3 grid grid-cols-2 gap-2">
        {/* Limite de PE */}
        <div className="flex items-center gap-2 p-2 bg-pe/10 rounded-lg">
          <Zap className="w-4 h-4 text-pe" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">PE/Turno</p>
            <p className="font-display text-lg text-pe">{peLimit}</p>
          </div>
        </div>

        {/* Crítico */}
        <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
          <Target className="w-4 h-4 text-primary" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Crítico</p>
            <p className="font-display text-lg text-primary">20</p>
          </div>
        </div>
      </div>

      {/* Conteúdo expandido */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-3 space-y-3">
              {/* Resistências */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase mb-2">RESISTÊNCIAS</p>
                <div className="grid grid-cols-3 gap-2">
                  {/* Fortitude */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-2 bg-muted/30 rounded text-center cursor-help">
                          <div className="flex items-center justify-center gap-1 text-destructive mb-1">
                            <Shield className="w-3 h-3" />
                            <span className="text-[10px] uppercase">Fort</span>
                          </div>
                          <p className="font-display text-lg">
                            {vigor}
                            {fortBonus > 0 && (
                              <span className="text-success text-sm ml-0.5">+{fortBonus}</span>
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground">VIG</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <p className="font-medium">Fortitude (VIG)</p>
                        <p className="text-muted-foreground">Pool: {vigor}d20</p>
                        {fortBonus > 0 && (
                          <>
                            <p className="text-success">Bônus: +{fortBonus}</p>
                            {resistanceBreakdown.filter(b => b.fortitude > 0 && b.active).map((b, i) => (
                              <p key={i} className="text-[10px]">{b.source}: +{b.fortitude}</p>
                            ))}
                          </>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Reflexos */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-2 bg-muted/30 rounded text-center cursor-help">
                          <div className="flex items-center justify-center gap-1 text-primary mb-1">
                            <Footprints className="w-3 h-3" />
                            <span className="text-[10px] uppercase">Ref</span>
                          </div>
                          <p className="font-display text-lg">
                            {agility}
                            {refBonus > 0 && (
                              <span className="text-success text-sm ml-0.5">+{refBonus}</span>
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground">AGI</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <p className="font-medium">Reflexos (AGI)</p>
                        <p className="text-muted-foreground">Pool: {agility}d20</p>
                        {refBonus > 0 && (
                          <>
                            <p className="text-success">Bônus: +{refBonus}</p>
                            {resistanceBreakdown.filter(b => b.reflexos > 0 && b.active).map((b, i) => (
                              <p key={i} className="text-[10px]">{b.source}: +{b.reflexos}</p>
                            ))}
                          </>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Vontade */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-2 bg-muted/30 rounded text-center cursor-help">
                          <div className="flex items-center justify-center gap-1 text-paranormal mb-1">
                            <Brain className="w-3 h-3" />
                            <span className="text-[10px] uppercase">Von</span>
                          </div>
                          <p className="font-display text-lg">
                            {presence}
                            {vonBonus > 0 && (
                              <span className="text-success text-sm ml-0.5">+{vonBonus}</span>
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground">PRE</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        <p className="font-medium">Vontade (PRE)</p>
                        <p className="text-muted-foreground">Pool: {presence}d20</p>
                        {vonBonus > 0 && (
                          <>
                            <p className="text-success">Bônus: +{vonBonus}</p>
                            {resistanceBreakdown.filter(b => b.vontade > 0 && b.active).map((b, i) => (
                              <p key={i} className="text-[10px]">{b.source}: +{b.vontade}</p>
                            ))}
                          </>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Ações de combate */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase mb-2">AÇÕES POR TURNO</p>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                    1 Padrão
                  </span>
                  <span className="px-2 py-1 bg-secondary/20 text-secondary text-xs rounded">
                    1 Movimento
                  </span>
                  <span className="px-2 py-1 bg-accent/20 text-accent-foreground text-xs rounded">
                    1 Reação
                  </span>
                  <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                    ∞ Livres
                  </span>
                </div>
              </div>

              {/* Dicas */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Ação padrão pode virar movimento extra</p>
                <p>• Movimento pode ser dividido (antes/depois)</p>
                <p>• Reação = 1x até seu próximo turno</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
