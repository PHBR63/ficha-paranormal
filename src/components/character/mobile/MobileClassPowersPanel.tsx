/**
 * MobileClassPowersPanel - Versão mobile do painel de poderes ativáveis
 * 
 * Renderiza poderes de classe ativáveis com UI otimizada para touch.
 * Usa MobileCollapsibleSection para consistência visual.
 * 
 * @module components/character/mobile/MobileClassPowersPanel
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Crosshair, 
  Shield, 
  Swords, 
  Zap, 
  RotateCcw,
  Info,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';
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

export interface MobileClassPowersPanelProps extends UseActivatableClassPowersProps {
  /** Classe adicional para estilização */
  className?: string;
}

// =====================================================
// Componente Principal
// =====================================================

export function MobileClassPowersPanel(props: MobileClassPowersPanelProps) {
  const { className } = props;

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
  } = useActivatableClassPowers(props);

  // Não renderiza se não houver poderes
  if (totalPowers === 0) {
    return null;
  }

  return (
    <MobileCollapsibleSection
      title="Poderes Ativáveis"
      icon={<Swords className="w-4 h-4 text-amber-500" />}
      badge={usedCount > 0 ? `${usedCount}/${totalPowers}` : `${totalPowers}`}
      defaultOpen={true}
      className={className}
    >
      <div className="space-y-3">
        <AnimatePresence>
          {availablePowers.map((power) => (
            <MobilePowerCard
              key={power.id}
              power={power}
              usageState={usageStates[power.id]}
              currentCost={getCurrentCost(power.id)}
              canAfford={canAfford(power.id)}
              onUse={() => usePower(power.id)}
            />
          ))}
        </AnimatePresence>

        {/* Botões de Reset */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30">
          <Button
            variant="outline"
            size="sm"
            onClick={resetTurn}
            className="h-8 text-[10px] flex-col gap-0.5"
          >
            <RotateCcw className="w-3 h-3" />
            Turno
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetRound}
            className="h-8 text-[10px] flex-col gap-0.5"
          >
            <RotateCcw className="w-3 h-3" />
            Rodada
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetScene}
            className="h-8 text-[10px] flex-col gap-0.5"
          >
            <RotateCcw className="w-3 h-3" />
            Cena
          </Button>
        </div>
      </div>
    </MobileCollapsibleSection>
  );
}

// =====================================================
// Componente de Card de Poder (Mobile)
// =====================================================

interface MobilePowerCardProps {
  power: ActivatableClassPower;
  usageState?: { usageCount: number; isUsed: boolean };
  currentCost: number;
  canAfford: boolean;
  onUse: () => void;
}

function MobilePowerCard({ power, usageState, currentCost, canAfford, onUse }: MobilePowerCardProps) {
  const state = usageState || { usageCount: 0, isUsed: false };
  const isUsed = power.limit !== 'none' && state.isUsed;
  const notAffordable = !canAfford && !isUsed;

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className={cn(
        'flex items-center gap-2 p-2 rounded-md border',
        isUsed ? 'bg-muted/50 opacity-60' : 'bg-card'
      )}
    >
      {/* Ícone */}
      <div className={cn('shrink-0', isUsed ? 'text-muted-foreground' : 'text-amber-500')}>
        {POWER_ICONS[power.icon]}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs font-medium">{power.name}</span>
          
          {/* Custo */}
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
        </div>

        <p className="text-[10px] text-muted-foreground line-clamp-1">{power.shortEffect}</p>

        {/* Contador de uso (para escalonamento) */}
        {power.scalingCost && state.usageCount > 0 && (
          <p className="text-[9px] text-orange-500 flex items-center gap-0.5 mt-0.5">
            <Info className="w-2.5 h-2.5" />
            {state.usageCount}x usado • próximo: {currentCost} PE
          </p>
        )}
      </div>

      {/* Indicador de PE insuficiente */}
      {notAffordable && (
        <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
      )}

      {/* Botão */}
      <Button
        size="sm"
        variant={isUsed ? 'outline' : 'default'}
        disabled={!canAfford}
        onClick={onUse}
        className={cn(
          'h-7 text-[10px] px-2 shrink-0',
          !isUsed && canAfford && 'bg-amber-600 hover:bg-amber-700'
        )}
      >
        {isUsed ? 'Usada' : 'Usar'}
      </Button>
    </motion.div>
  );
}

export default MobileClassPowersPanel;
