/**
 * RoundControlPanel - Painel de controle de rodada para habilidades 1x/rodada
 * Mostra rodada atual, habilidades usadas e botões de controle
 */

import { motion } from 'framer-motion';
import { RotateCcw, FastForward, Swords, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks';

interface RoundControlPanelProps {
  currentRound: number;
  usedAbilitiesThisRound: string[];
  onAdvanceRound: () => void;
  onResetCombat: () => void;
  className?: string;
}

// Mapa de nomes amigáveis para habilidades
const ABILITY_NAMES: Record<string, string> = {
  'brecha-na-guarda': 'Brecha na Guarda',
  'ataque-extra': 'Ataque Extra',
  'surto-de-adrenalina': 'Surto de Adrenalina',
};

export function RoundControlPanel({
  currentRound,
  usedAbilitiesThisRound,
  onAdvanceRound,
  onResetCombat,
  className,
}: RoundControlPanelProps) {
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

  // Só mostra se tiver alguma habilidade usada ou se estiver em rodada > 1
  if (usedAbilitiesThisRound.length === 0 && currentRound === 1) {
    return null;
  }

  return (
    <Card className={cn("border-amber-500/20 bg-amber-500/5", className)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2">
          {/* Indicador de Rodada */}
          <div className="flex items-center gap-2">
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
          </div>

          {/* Habilidades Usadas */}
          {usedAbilitiesThisRound.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Swords className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {usedAbilitiesThisRound.length} usada{usedAbilitiesThisRound.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-medium text-xs mb-1">Habilidades usadas nesta rodada:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {usedAbilitiesThisRound.map(id => (
                      <li key={id}>• {ABILITY_NAMES[id] || id}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
      </CardContent>
    </Card>
  );
}
