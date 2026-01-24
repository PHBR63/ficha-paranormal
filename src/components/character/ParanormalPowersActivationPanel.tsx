/**
 * ParanormalPowersActivationPanel - Painel de ativação de poderes paranormais
 * 
 * Exibe poderes paranormais ativáveis do personagem com controle de uso,
 * custos de PE/PV e integração com o sistema de bônus condicionais.
 * 
 * Segue o Livro Base v1.3 (páginas 114-116)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ChevronDown,
  RotateCcw,
  Zap,
  Clock,
  Dice1,
  Heart,
  Shield,
  Sword,
  Sparkles,
  Skull,
  AlertCircle,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useActivatableParanormalPowers,
  UseActivatableParanormalPowersProps,
  ActivatableParanormalPower,
  ParanormalPowerUsageState,
} from '@/hooks/useActivatableParanormalPowers';
import { ELEMENT_COLORS, ELEMENT_BG_COLORS } from '@/lib/paranormal-powers';

// =====================================================
// Constantes
// =====================================================

/** Mapeamento de ícones */
const POWER_ICONS: Record<ActivatableParanormalPower['icon'], React.FC<{ className?: string }>> = {
  zap: Zap,
  clock: Clock,
  dice: Dice1,
  heart: Heart,
  shield: Shield,
  sword: Sword,
  sparkles: Sparkles,
  skull: Skull,
};

/** Labels para limites de uso */
const LIMIT_LABELS: Record<string, string> = {
  perTurn: 'Por turno',
  perRound: 'Por rodada',
  perScene: 'Por cena',
  perSession: 'Por sessão',
  none: 'Ilimitado',
};

// =====================================================
// Props
// =====================================================

export interface ParanormalPowersActivationPanelProps extends UseActivatableParanormalPowersProps {
  className?: string;
}

// =====================================================
// Componente de Card de Poder
// =====================================================

interface PowerCardProps {
  power: ActivatableParanormalPower & { hasAffinity: boolean };
  usageState?: ParanormalPowerUsageState;
  remainingUses: number;
  canUse: boolean;
  isBonusActive: boolean;
  onUse: () => void;
}

function PowerCard({
  power,
  usageState,
  remainingUses,
  canUse,
  isBonusActive,
  onUse,
}: PowerCardProps) {
  const Icon = POWER_ICONS[power.icon];
  const elementColor = ELEMENT_COLORS[power.element] || 'text-muted-foreground';
  const elementBg = ELEMENT_BG_COLORS[power.element] || 'bg-muted';

  // Determina o estado visual
  const isUsed = power.limit !== 'none' && remainingUses <= 0;
  const hasLimitedUses = power.limit !== 'none' && power.usesPerPeriod < 999;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all',
        isUsed
          ? 'bg-muted/30 border-muted opacity-60'
          : isBonusActive
          ? 'bg-primary/10 border-primary/50 shadow-sm shadow-primary/20'
          : 'bg-card border-border hover:border-primary/30'
      )}
    >
      {/* Ícone do poder */}
      <div className={cn('p-2 rounded-lg', elementBg)}>
        <Icon className={cn('w-4 h-4', elementColor)} />
      </div>

      {/* Info do poder */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{power.name}</span>
          
          {/* Badge de afinidade */}
          {power.hasAffinity && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              Afinidade
            </Badge>
          )}
          
          {/* Badge de ativo */}
          {isBonusActive && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary text-primary animate-pulse">
              <Check className="w-2.5 h-2.5 mr-0.5" />
              ATIVO
            </Badge>
          )}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-xs text-muted-foreground truncate cursor-help">
              {power.shortEffect}
            </p>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs">{power.description}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{power.pageRef}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Custo */}
      {power.costType !== 'none' && power.costValue > 0 && (
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] px-1.5',
            power.costType === 'pv' ? 'border-red-500/50 text-red-400' : 'border-blue-500/50 text-blue-400'
          )}
        >
          {power.costValue} {power.costType.toUpperCase()}
        </Badge>
      )}

      {/* Limite de uso */}
      {hasLimitedUses && (
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-[10px] px-1.5">
            {remainingUses}/{usageState?.maxUses || power.usesPerPeriod}
          </Badge>
          <span className="text-[9px] text-muted-foreground">
            {LIMIT_LABELS[power.limit]}
          </span>
        </div>
      )}

      {/* Botão de uso */}
      <Button
        size="sm"
        variant={isUsed ? 'ghost' : isBonusActive ? 'secondary' : 'default'}
        onClick={onUse}
        disabled={!canUse}
        className={cn(
          'h-7 text-xs min-w-[60px]',
          !canUse && 'opacity-50'
        )}
      >
        {isUsed ? 'Usada' : isBonusActive ? 'Ativo' : 'Usar'}
      </Button>

      {/* Indicador de PE/PV insuficiente */}
      {!canUse && !isUsed && (
        <Tooltip>
          <TooltipTrigger>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {power.costType === 'pe' ? 'PE insuficiente' : 
               power.costType === 'pv' ? 'PV insuficiente' : 
               'Não disponível'}
            </p>
          </TooltipContent>
        </Tooltip>
      )}
    </motion.div>
  );
}

// =====================================================
// Componente Principal
// =====================================================

export function ParanormalPowersActivationPanel(props: ParanormalPowersActivationPanelProps) {
  const { className } = props;
  const [isOpen, setIsOpen] = useState(true);

  const {
    availablePowers,
    usageStates,
    canUse,
    getRemainingUses,
    usePower,
    resetTurn,
    resetRound,
    resetScene,
    resetSession,
    totalPowers,
    usedCount,
    isBonusActive,
  } = useActivatableParanormalPowers(props);

  // Não renderiza se não houver poderes ativáveis
  if (totalPowers === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Card className={cn('border-purple-500/30 bg-card/50', className)}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="font-display tracking-wider uppercase">Poderes Paranormais</span>
                  <Badge variant="outline" className="text-[10px] ml-1 border-purple-500/50 text-purple-500">
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
                    remainingUses={getRemainingUses(power.id)}
                    canUse={canUse(power.id)}
                    isBonusActive={isBonusActive(power.id)}
                    onUse={() => usePower(power.id)}
                  />
                ))}
              </AnimatePresence>

              {/* Botões de Reset */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
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
                    <p className="text-xs">Reseta poderes por turno (Sangue Vivo)</p>
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
                    <p className="text-xs">Reseta poderes por rodada (Campo Protetor)</p>
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
                    <p className="text-xs">Reseta poderes por cena (Surto Temporal, Manipular Entropia)</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetSession}
                      className="flex-1 h-7 text-[10px] text-amber-500 hover:text-amber-400"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Nova Sessão
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Reseta TODOS os poderes (incluindo Escapar da Morte)</p>
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

export default ParanormalPowersActivationPanel;
