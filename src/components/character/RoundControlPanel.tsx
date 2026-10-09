/**
 * RoundControlPanel - Painel de controle de rodada para habilidades 1x/rodada
 * Mostra rodada atual, PE gasto, habilidades usadas e botões de controle
 */

import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, FastForward, Swords, Clock, Zap, ChevronDown, ChevronUp } from '@/components/icons/ordem-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks';
import { useState } from 'react';

interface RoundControlPanelProps {
  currentRound: number;
  usedAbilitiesThisRound: string[];
  peSpentThisRound?: number;
  peSpentBreakdown?: Array<{ abilityName: string; cost: number }>;
  onAdvanceRound: () => void;
  onResetCombat: () => void;
  className?: string;
  /** Modo compacto para mobile */
  compact?: boolean;
}

// Mapa de nomes amigáveis para habilidades
const ABILITY_NAMES: Record<string, string> = {
  'brecha-na-guarda': 'Brecha na Guarda',
  'ataque-extra': 'Ataque Extra',
  'surto-de-adrenalina': 'Surto de Adrenalina',
  'disparo-letal': 'Disparo Letal',
};

export function RoundControlPanel({
  currentRound,
  usedAbilitiesThisRound,
  peSpentThisRound = 0,
  peSpentBreakdown = [],
  onAdvanceRound,
  onResetCombat,
  className,
  compact = false,
}: RoundControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleAdvanceRound = () => {
    onAdvanceRound();
    toast({
      title: `Rodada ${currentRound + 1}`,
      description: "Habilidades de 1x/rodada liberadas.",
    });
  };

  const handleResetCombat = () => {
    onResetCombat();
    toast({
      title: "Novo Combate",
      description: "Contador de rodada e usos resetados.",
    });
  };

  // Mostra se tiver qualquer atividade nesta rodada
  const hasActivity = usedAbilitiesThisRound.length > 0 || peSpentThisRound > 0;
  
  // Sempre mostra se rodada > 1 ou se tiver atividade
  if (!hasActivity && currentRound === 1) {
    return null;
  }

  // Versão compacta para mobile
  if (compact) {
    return (
      <Card className={cn("border-amber-500/20 bg-amber-500/5", className)}>
        <CardContent className="p-2">
          <div className="flex items-center justify-between gap-2">
            {/* Rodada + Stats */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-medium">R{currentRound}</span>
              </div>
              
              {peSpentThisRound > 0 && (
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-purple-400" />
                  <span className="text-xs text-purple-400 font-medium">{peSpentThisRound}</span>
                </div>
              )}
              
              {usedAbilitiesThisRound.length > 0 && (
                <div className="flex items-center gap-1">
                  <Swords className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{usedAbilitiesThisRound.length}</span>
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAdvanceRound}
                className="h-7 px-2 text-xs text-amber-500 hover:bg-amber-500/10"
              >
                <FastForward className="w-3 h-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleResetCombat}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-amber-500/20 bg-amber-500/5", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-2">
            {/* Indicador de Rodada */}
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5"
              >
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">Rodada</span>
                <Badge variant="outline" className="text-amber-500 border-amber-500/30 font-display text-base px-2">
                  {currentRound}
                </Badge>
              </motion.div>

              {/* PE Gasto Indicador */}
              {peSpentThisRound > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30"
                      >
                        <Zap className="w-3 h-3 text-purple-400" />
                        <span className="text-xs font-medium text-purple-400">{peSpentThisRound} PE</span>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="font-medium text-xs mb-1">PE gasto nesta rodada:</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {peSpentBreakdown.map((entry, idx) => (
                          <li key={idx}>• {entry.abilityName}: {entry.cost} PE</li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Habilidades Usadas + Expand */}
            <div className="flex items-center gap-2">
              {usedAbilitiesThisRound.length > 0 && (
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Swords className="w-3 h-3" />
                    <span>{usedAbilitiesThisRound.length} usada{usedAbilitiesThisRound.length > 1 ? 's' : ''}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </Button>
                </CollapsibleTrigger>
              )}

              {/* Botões de Controle */}
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAdvanceRound}
                        className="h-7 px-2 text-xs border-amber-500/30 hover:bg-amber-500/10"
                      >
                        <FastForward className="w-3 h-3 mr-1" />
                        Próxima
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Avançar para rodada {currentRound + 1}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleResetCombat}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Novo combate (resetar rodada 1)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* Lista expandida de habilidades usadas */}
          <CollapsibleContent>
            <AnimatePresence>
              {isExpanded && usedAbilitiesThisRound.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 pt-3 border-t border-amber-500/20"
                >
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                    Habilidades usadas nesta rodada
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {usedAbilitiesThisRound.map(id => (
                      <Badge 
                        key={id} 
                        variant="secondary" 
                        className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/20"
                      >
                        {ABILITY_NAMES[id] || id}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}
