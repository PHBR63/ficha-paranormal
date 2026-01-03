/**
 * ComandanteCampoPanel - Componente unificado responsivo da trilha Comandante de Campo
 * 
 * Renderiza UI otimizada para desktop ou mobile baseado em useIsMobile().
 * Utiliza useComandanteCampoTrack para lógica compartilhada.
 * 
 * @module tracks/combatente/ComandanteCampoPanel
 */

import { Users, Zap, Crown, Check, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MobileCollapsibleSection } from '@/components/character/mobile/MobileCollapsibleSection';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  useComandanteCampoTrack,
  type UseComandanteCampoTrackProps,
  type LeadershipAbility,
} from './useComandanteCampoTrack';

// =====================================================
// Props do Componente
// =====================================================

export interface ComandanteCampoPanelProps extends UseComandanteCampoTrackProps {
  className?: string;
}

// =====================================================
// Componentes Internos
// =====================================================

/** Card de habilidade para desktop */
function AbilityCard({
  ability,
  isUsed,
  isActivating,
  canAfford,
  maxAllies,
  onUse,
}: {
  ability: LeadershipAbility;
  isUsed: boolean;
  isActivating: boolean;
  canAfford: boolean;
  maxAllies: number;
  onUse: () => void;
}) {
  const isDisabled = isUsed || !canAfford || isActivating;

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all',
        isUsed
          ? 'bg-muted/30 border-muted opacity-60'
          : 'bg-card/50 border-border/50 hover:border-primary/50'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{ability.name}</span>
            <Badge
              variant="outline"
              className={cn(
                'text-[9px] px-1.5',
                ability.actionType === 'reaction'
                  ? 'border-yellow-500/50 text-yellow-600'
                  : 'border-blue-500/50 text-blue-600'
              )}
            >
              {ability.actionType === 'reaction' ? 'Reação' : 'Padrão'}
            </Badge>
            {ability.perRound && (
              <Badge variant="secondary" className="text-[9px]">
                1x/rodada
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{ability.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-paranormal" />
            {ability.costPerTarget ? `${ability.peCost}/aliado` : ability.peCost} PE
          </span>
          {ability.maxAllies && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                máx {maxAllies} aliado{maxAllies > 1 ? 's' : ''}
              </span>
            </>
          )}
          <span>•</span>
          <span>Alcance {ability.range === 'short' ? 'curto' : 'médio'}</span>
        </div>

        <Button
          size="sm"
          variant={isUsed ? 'ghost' : 'default'}
          className="h-7 text-xs gap-1"
          disabled={isDisabled}
          onClick={onUse}
        >
          {isActivating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isUsed ? (
            <>
              <Check className="w-3 h-3" />
              Usada
            </>
          ) : (
            'Usar'
          )}
        </Button>
      </div>
    </div>
  );
}

/** Card de habilidade para mobile */
function MobileAbilityCard({
  ability,
  isUsed,
  isActivating,
  canAfford,
  maxAllies,
  onUse,
}: {
  ability: LeadershipAbility;
  isUsed: boolean;
  isActivating: boolean;
  canAfford: boolean;
  maxAllies: number;
  onUse: () => void;
}) {
  const isDisabled = isUsed || !canAfford || isActivating;

  return (
    <div
      className={cn(
        'p-2.5 rounded-lg border flex items-center gap-3 transition-all',
        isUsed
          ? 'bg-muted/30 border-muted opacity-50'
          : 'bg-card/50 border-border/50'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-sm truncate">{ability.name}</span>
          {ability.perRound && (
            <Badge variant="secondary" className="text-[8px] px-1 py-0">
              1x
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5 text-paranormal" />
            {ability.costPerTarget ? `${ability.peCost}/aliado` : ability.peCost}
          </span>
          <span>•</span>
          <Badge
            variant="outline"
            className={cn(
              'text-[8px] px-1 py-0',
              ability.actionType === 'reaction'
                ? 'border-yellow-500/50 text-yellow-600'
                : 'border-blue-500/50 text-blue-600'
            )}
          >
            {ability.actionType === 'reaction' ? 'Reação' : 'Padrão'}
          </Badge>
          {ability.maxAllies && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Users className="w-2.5 h-2.5" />
                {maxAllies}
              </span>
            </>
          )}
        </div>
      </div>

      <Button
        size="sm"
        variant={isUsed ? 'ghost' : 'default'}
        className="h-8 w-16 text-xs shrink-0"
        disabled={isDisabled}
        onClick={onUse}
      >
        {isActivating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isUsed ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          'Usar'
        )}
      </Button>
    </div>
  );
}

// =====================================================
// Componente Principal
// =====================================================

export function ComandanteCampoPanel(props: ComandanteCampoPanelProps) {
  const isMobile = useIsMobile();
  const { className } = props;

  const {
    isComandanteCampo,
    isOpen,
    setIsOpen,
    activatingAbility,
    unlockedAbilities,
    handleUseAbility,
    canAfford,
    isAbilityUsedThisRound,
    getMaxAllies,
  } = useComandanteCampoTrack(props);

  // Não renderiza se não for Comandante de Campo
  if (!isComandanteCampo || unlockedAbilities.length === 0) return null;

  // ===== RENDER MOBILE =====
  if (isMobile) {
    return (
      <MobileCollapsibleSection
        title="LIDERANÇA"
        icon={<Crown className="w-4 h-4 text-primary" />}
        badge={unlockedAbilities.length}
        defaultOpen={true}
      >
        <div className="space-y-2">
          {unlockedAbilities.map((ability) => (
            <MobileAbilityCard
              key={ability.id}
              ability={ability}
              isUsed={ability.perRound ? isAbilityUsedThisRound(ability.id) : false}
              isActivating={activatingAbility === ability.id}
              canAfford={canAfford(ability.peCost)}
              maxAllies={getMaxAllies(ability.maxAllies)}
              onUse={() => handleUseAbility(ability)}
            />
          ))}

          <p className="text-[9px] text-muted-foreground text-center pt-1.5">
            Efeitos de suporte aplicados a aliados
          </p>
        </div>
      </MobileCollapsibleSection>
    );
  }

  // ===== RENDER DESKTOP =====
  return (
    <Card className={cn('border-primary/20 bg-card/50', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-primary" />
                <span className="font-display tracking-wider uppercase">Comandante de Campo</span>
                <Badge variant="outline" className="text-[10px] ml-1">
                  {unlockedAbilities.length} habilidades
                </Badge>
              </div>
              <ChevronDown
                className={cn('w-4 h-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-3 space-y-2">
            {unlockedAbilities.map((ability) => (
              <AbilityCard
                key={ability.id}
                ability={ability}
                isUsed={ability.perRound ? isAbilityUsedThisRound(ability.id) : false}
                isActivating={activatingAbility === ability.id}
                canAfford={canAfford(ability.peCost)}
                maxAllies={getMaxAllies(ability.maxAllies)}
                onUse={() => handleUseAbility(ability)}
              />
            ))}

            <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/30">
              Habilidades de suporte para coordenar aliados em combate
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
