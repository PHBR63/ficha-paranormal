/**
 * ClassPowersActivationPanel - Painel de ativação de poderes de classe
 * 
 * Exibe poderes de classe do Combatente que gastam PE e permitem
 * ativação standalone sem depender de contexto de rolagem.
 * 
 * Suporta:
 * - Incansável (2 PE, 1x/cena)
 * - Segurar o Gatilho (2 PE × ataques, por turno)
 * - Combate Defensivo (0 PE, 1x/rodada)
 * - Golpe Pesado (1 PE, por ataque)
 * 
 * @module components/character/ClassPowersActivationPanel
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Crosshair, 
  Shield, 
  Swords, 
  Zap, 
  ChevronDown,
  RotateCcw,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  useActivatableClassPowers,
  type UseActivatableClassPowersProps,
  type ActivatableClassPower,
} from '@/hooks/useActivatableClassPowers';

// =====================================================
// Mapeamento de Ícones
// =====================================================

const POWER_ICONS: Record<string, React.ReactNode> = {
  search: <Search className="w-4 h-4" />,
  crosshair: <Crosshair className="w-4 h-4" />,
  shield: <Shield className="w-4 h-4" />,
  swords: <Swords className="w-4 h-4" />,
  zap: <Zap className="w-4 h-4" />,
};

// Mapeamento de labels de limite
const LIMIT_LABELS: Record<string, string> = {
  perTurn: '1x/turno',
  perRound: '1x/rodada',
  perScene: '1x/cena',
  none: 'Sem limite',
};

// =====================================================
// Props do Componente
// =====================================================

export interface ClassPowersActivationPanelProps extends UseActivatableClassPowersProps {
  /** Classe adicional para estilização */
  className?: string;
}

// =====================================================
// Componente Principal (Desktop)
// =====================================================

export function ClassPowersActivationPanel(props: ClassPowersActivationPanelProps) {
  const { className } = props;
  const [isOpen, setIsOpen] = useState(true);

  const {
    availablePowers,
    usageStates,
    canAfford,
    getCurrentCost,
    usePower,
    resetTurn,
    resetRound,
    resetScene,
    totalPowers,
    usedCount,
    isBonusActive,
  } = useActivatableClassPowers(props);

  // Não renderiza se não houver poderes
  if (totalPowers === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Card className={cn('border-amber-500/30 bg-card/50', className)}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-amber-500" />
                  <span className="font-display tracking-wider uppercase">Poderes Ativáveis</span>
                  <Badge variant="outline" className="text-[10px] ml-1 border-amber-500/50 text-amber-500">
                    {totalPowers}
                  </Badge>
                  {usedCount > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {usedCount} usado(s)
                    </Badge>
                  )}
                </div>
                <ChevronDown
                  className={cn('w-4 h-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
                />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-3 space-y-2">
              <AnimatePresence>
                {availablePowers.map((power) => (
                  <PowerCard
                    key={power.id}
                    power={power}
                    usageState={usageStates[power.id]}
                    currentCost={getCurrentCost(power.id)}
                    canAfford={canAfford(power.id)}
                    isBonusActive={isBonusActive(power.id)}
                    onUse={() => usePower(power.id)}
                  />
                ))}
              </AnimatePresence>

              {/* Botões de Reset */}
              <div className="flex gap-2 pt-2 border-t border-border/30">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetTurn}
                      className="flex-1 h-7 text-[10px]"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Novo Turno
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Reseta Segurar o Gatilho</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetRound}
                      className="flex-1 h-7 text-[10px]"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Nova Rodada
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Reseta poderes por rodada e turno</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetScene}
                      className="flex-1 h-7 text-[10px]"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Nova Cena
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Reseta todos os poderes (incluindo 1x/cena)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </TooltipProvider>
  );
}

// =====================================================
// Componente de Card de Poder Individual
// =====================================================

interface PowerCardProps {
  power: ActivatableClassPower;
  usageState?: { usageCount: number; isUsed: boolean };
  currentCost: number;
  canAfford: boolean;
  isBonusActive: boolean;
  onUse: () => void;
}

function PowerCard({ power, usageState, currentCost, canAfford, isBonusActive, onUse }: PowerCardProps) {
  const state = usageState || { usageCount: 0, isUsed: false };
  const isUsed = power.limit !== 'none' && state.isUsed;

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className={cn(
        'p-3 rounded-lg border transition-all',
        isUsed
          ? 'bg-muted/30 border-muted opacity-60'
          : 'bg-card/50 border-border/50 hover:border-amber-500/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          {/* Ícone */}
          <div className={cn('shrink-0 mt-0.5', isUsed ? 'text-muted-foreground' : 'text-amber-500')}>
            {POWER_ICONS[power.icon]}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-sm">{power.name}</span>
              
              {/* Custo de PE */}
              {currentCost > 0 ? (
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-[9px]',
                    power.scalingCost && state.usageCount > 0 && 'border-orange-500/50 text-orange-500'
                  )}
                >
                  {currentCost} PE
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[9px]">
                  Livre
                </Badge>
              )}

              {/* Limite */}
              <Badge variant="secondary" className="text-[9px]">
                {LIMIT_LABELS[power.limit]}
              </Badge>

              {/* Indicador de bônus ativo */}
              {power.conditionalBonusId && isBonusActive && (
                <Badge variant="default" className="text-[9px] bg-green-600 hover:bg-green-700">
                  ATIVO
                </Badge>
              )}

              {/* Contador de uso (para escalonamento) */}
              {power.scalingCost && state.usageCount > 0 && (
                <Badge variant="destructive" className="text-[9px]">
                  {state.usageCount}x usado
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-1">{power.shortEffect}</p>

            {/* Aviso de escalonamento */}
            {power.scalingCost && (
              <p className="text-[10px] text-orange-500/80 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {power.scalingCost.description}
              </p>
            )}
          </div>
        </div>

        {/* Botão de Usar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={isUsed ? 'ghost' : 'default'}
              className={cn(
                'h-7 text-xs shrink-0',
                !isUsed && 'bg-amber-600 hover:bg-amber-700'
              )}
              disabled={!canAfford}
              onClick={onUse}
            >
              {isUsed ? 'Usada' : 'Usar'}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <div className="text-xs space-y-1">
              <p className="font-medium">{power.name}</p>
              <p className="text-muted-foreground">{power.description}</p>
              <p className="text-[10px] italic">{power.pageRef}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </motion.div>
  );
}

export default ClassPowersActivationPanel;
