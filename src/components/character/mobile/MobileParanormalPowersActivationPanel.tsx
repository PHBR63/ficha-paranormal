/**
 * MobileParanormalPowersActivationPanel - Versão mobile do painel de poderes paranormais ativáveis
 * 
 * Renderiza poderes paranormais ativáveis com UI otimizada para touch.
 * Segue o Livro Base v1.3 (páginas 114-116)
 * 
 * @module components/character/mobile/MobileParanormalPowersActivationPanel
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap,
  Clock,
  Dice1,
  Heart,
  Shield,
  Sword,
  Sparkles,
  Skull,
  RotateCcw,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';
import {
  useActivatableParanormalPowers,
  type UseActivatableParanormalPowersProps,
  type ActivatableParanormalPower,
  type ParanormalPowerUsageState,
} from '@/hooks/useActivatableParanormalPowers';
import { ELEMENT_COLORS, ELEMENT_BG_COLORS } from '@/lib/paranormal-powers';

// =====================================================
// Mapeamento de Ícones
// =====================================================

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

// Mapeamento de labels de limite
const LIMIT_LABELS: Record<string, string> = {
  perTurn: '1x/turno',
  perRound: '1x/rodada',
  perScene: '1x/cena',
  perSession: '1x/sessão',
  none: 'Sem limite',
};

// =====================================================
// Props do Componente
// =====================================================

export interface MobileParanormalPowersActivationPanelProps extends UseActivatableParanormalPowersProps {
  /** Classe adicional para estilização */
  className?: string;
}

// =====================================================
// Componente Principal
// =====================================================

export function MobileParanormalPowersActivationPanel(props: MobileParanormalPowersActivationPanelProps) {
  const { className } = props;

  const {
    availablePowers,
    usageStates,
    canUse,
    getRemainingUses,
    usePower: consultPower,
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
    <MobileCollapsibleSection
      title="Poderes Paranormais"
      icon={<Sparkles className="w-4 h-4 text-purple-500" />}
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
              remainingUses={getRemainingUses(power.id)}
              canUse={canUse(power.id)}
              isBonusActive={isBonusActive(power.id)}
              onUse={() => consultPower(power.id)}
            />
          ))}
        </AnimatePresence>

        {/* Botões de Reset */}
        {availablePowers.some(power => !power.manualResolution) && <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-border/30">
          <Button
            variant="outline"
            size="sm"
            onClick={resetTurn}
            className="h-8 text-[9px] flex-col gap-0.5 px-1"
          >
            <RotateCcw className="w-3 h-3" />
            Turno
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetRound}
            className="h-8 text-[9px] flex-col gap-0.5 px-1"
          >
            <RotateCcw className="w-3 h-3" />
            Rodada
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetScene}
            className="h-8 text-[9px] flex-col gap-0.5 px-1"
          >
            <RotateCcw className="w-3 h-3" />
            Cena
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetSession}
            className="h-8 text-[9px] flex-col gap-0.5 px-1 text-amber-500 border-amber-500/30"
          >
            <RotateCcw className="w-3 h-3" />
            Sessão
          </Button>
        </div>}
      </div>
    </MobileCollapsibleSection>
  );
}

// =====================================================
// Componente de Card de Poder (Mobile)
// =====================================================

interface MobilePowerCardProps {
  power: ActivatableParanormalPower & { hasAffinity: boolean };
  usageState?: ParanormalPowerUsageState;
  remainingUses: number;
  canUse: boolean;
  isBonusActive: boolean;
  onUse: () => void;
}

function MobilePowerCard({ 
  power, 
  usageState, 
  remainingUses, 
  canUse, 
  isBonusActive, 
  onUse 
}: MobilePowerCardProps) {
  const Icon = POWER_ICONS[power.icon];
  const elementColor = ELEMENT_COLORS[power.element] || 'text-muted-foreground';
  const elementBg = ELEMENT_BG_COLORS[power.element] || 'bg-muted';

  // Determina o estado visual
  const isUsed = power.limit !== 'none' && remainingUses <= 0;
  const hasLimitedUses = power.limit !== 'none' && power.usesPerPeriod < 999;
  const notAffordable = !canUse && !isUsed;

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className={cn(
        'flex flex-wrap items-center gap-2 p-2 rounded-md border',
        isUsed 
          ? 'bg-muted/50 opacity-60' 
          : isBonusActive 
          ? 'bg-primary/10 border-primary/50' 
          : 'bg-card'
      )}
    >
      {/* Ícone do poder */}
      <div className={cn('shrink-0 p-1.5 rounded', elementBg)}>
        <Icon className={cn('w-4 h-4', elementColor)} />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs font-medium">{power.name}</span>
          
          {/* Badge de afinidade */}
          {power.hasAffinity && (
            <Badge variant="default" className="text-[8px] px-1 py-0 h-4">
              <Sparkles className="w-2 h-2 mr-0.5" />
              Afinidade
            </Badge>
          )}
          
          {/* Badge de ativo */}
          {isBonusActive && (
            <Badge 
              variant="outline" 
              className="text-[8px] px-1 py-0 h-4 border-primary text-primary animate-pulse"
            >
              <Check className="w-2 h-2 mr-0.5" />
              ATIVO
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 flex-wrap mt-0.5">
          {/* Custo */}
          {power.costType !== 'none' && power.costValue > 0 && (
            <Badge 
              variant="outline" 
              className={cn(
                'text-[8px] px-1 py-0 h-4',
                power.costType === 'pv' 
                  ? 'border-red-500/50 text-red-400' 
                  : 'border-blue-500/50 text-blue-400'
              )}
            >
              {power.costValue} {power.costType.toUpperCase()}
            </Badge>
          )}

          {/* Limite de uso */}
          {hasLimitedUses && (
            <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4">
              {remainingUses}/{usageState?.maxUses || power.usesPerPeriod} {LIMIT_LABELS[power.limit]}
            </Badge>
          )}

          {/* Limite ilimitado */}
          {!hasLimitedUses && power.costType === 'none' && (
            <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4">
              {power.manualResolution ? 'Manual' : LIMIT_LABELS['none']}
            </Badge>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
          {power.shortEffect}
        </p>
      </div>

      {/* Indicador de PE/PV insuficiente */}
      {notAffordable && (
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
      )}

      {power.manualResolution && <details className="text-xs max-w-full">
        <summary>Regra</summary><p className="whitespace-normal break-words">{power.description}</p>
        <p>Consulta manual: nenhum efeito, gasto ou uso é confirmado aqui.</p>
      </details>}
      {/* Botão */}
      <Button
        size="sm"
        variant={isUsed ? 'outline' : isBonusActive ? 'secondary' : 'default'}
        disabled={!canUse}
        onClick={onUse}
        className={cn(
          'h-7 text-[10px] px-2 shrink-0',
          !isUsed && canUse && !isBonusActive && 'bg-purple-600 hover:bg-purple-700'
        )}
      >
        {power.manualResolution ? 'Conferir' : isUsed ? 'Usada' : isBonusActive ? 'Ativo' : 'Usar'}
      </Button>
    </motion.div>
  );
}

export default MobileParanormalPowersActivationPanel;
