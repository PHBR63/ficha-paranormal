/**
 * TropaDeChoquePanel - Componente unificado responsivo da trilha Tropa de Choque
 * 
 * Renderiza UI otimizada para desktop ou mobile baseado em useIsMobile().
 * Utiliza useTropaDeChoqueTrack para lógica compartilhada.
 * 
 * @module tracks/combatente/TropaDeChoquePanel
 */

import { motion } from 'framer-motion';
import { Shield, ShieldAlert, Heart, Skull, ChevronDown, ChevronUp, Info, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MobileCollapsibleSection } from '@/components/character/mobile/MobileCollapsibleSection';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  useTropaDeChoqueTrack,
  TROPA_ABILITIES,
  PASSIVE_ABILITIES,
  type UseTropaDeChoqueTrackProps,
  type TropaAbility,
  type PassiveAbility,
} from './useTropaDeChoqueTrack';

// =====================================================
// Props do Componente
// =====================================================

export interface TropaDeChoquePanelProps extends UseTropaDeChoqueTrackProps {
  className?: string;
}

// =====================================================
// Componentes Internos
// =====================================================

/** Ícones para cada habilidade */
const abilityIcons: Record<string, React.ElementType> = {
  'cai-dentro': ShieldAlert,
  'duro-de-matar': Heart,
  'casca-grossa': Shield,
  'inquebravel': Skull,
};

/** Card de alerta de bônus quando machucado */
function WoundedBonusAlert({
  defenseBonus,
  damageResistance,
  canActWhileDying,
  sources,
  compact = false,
}: {
  defenseBonus: number;
  damageResistance: number;
  canActWhileDying: boolean;
  sources?: string[];
  compact?: boolean;
}) {
  if (defenseBonus === 0 && damageResistance === 0) return null;

  return (
    <div className={cn(
      'rounded-md bg-destructive/10 border border-destructive/30 space-y-1',
      compact ? 'p-2' : 'p-2'
    )}>
      <p className={cn(
        'font-medium text-destructive flex items-center gap-1',
        compact ? 'text-[10px]' : 'text-xs'
      )}>
        <AlertTriangle className="w-3 h-3" />
        Inquebrável Ativo {compact ? '' : '(Machucado)'}
      </p>
      <div className="flex gap-2 flex-wrap">
        {defenseBonus > 0 && (
          <Badge variant="outline" className={cn(
            'border-destructive/30 text-destructive',
            compact ? 'text-[9px]' : 'text-[10px]'
          )}>
            +{defenseBonus} {compact ? 'Def' : 'Defesa'}
          </Badge>
        )}
        {damageResistance > 0 && (
          <Badge variant="outline" className={cn(
            'border-destructive/30 text-destructive',
            compact ? 'text-[9px]' : 'text-[10px]'
          )}>
            RD {damageResistance}
          </Badge>
        )}
        {canActWhileDying && (
          <Badge variant="outline" className={cn(
            'border-destructive/30 text-destructive',
            compact ? 'text-[9px]' : 'text-[10px]'
          )}>
            {compact ? 'Age morrendo' : 'Pode agir morrendo'}
          </Badge>
        )}
      </div>
      {sources && sources.length > 0 && !compact && (
        <p className="text-[10px] text-muted-foreground">
          Fonte: {sources.join(', ')}
        </p>
      )}
    </div>
  );
}

/** Card de passiva */
function PassiveCard({
  passive,
  isWounded,
  cascaGrossaHP,
  vigor,
  compact = false,
}: {
  passive: PassiveAbility;
  isWounded: boolean;
  cascaGrossaHP: number;
  vigor: number;
  compact?: boolean;
}) {
  const Icon = abilityIcons[passive.id] || Shield;
  const isInquebravel = passive.id === 'inquebravel';
  const isActive = isInquebravel && isWounded;

  return (
    <div className={cn(
      'flex items-start gap-2 rounded-md border border-border/50',
      isActive ? 'bg-destructive/10 border-destructive/30' : 'bg-muted/30',
      compact ? 'items-center p-2' : 'p-2'
    )}>
      <Icon className={cn(
        'shrink-0',
        compact ? 'w-4 h-4' : 'w-4 h-4 mt-0.5',
        isActive ? 'text-destructive' : 'text-primary'
      )} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>{passive.name}</span>
          {!compact && (
            <Badge variant="secondary" className="text-[10px]">
              NEX {passive.minNex}%
            </Badge>
          )}
          {passive.id === 'casca-grossa' && (
            <Badge variant="outline" className={cn(
              'text-primary border-primary/30',
              compact ? 'text-[9px]' : 'text-[10px]'
            )}>
              +{cascaGrossaHP} PV
            </Badge>
          )}
          {isActive && (
            <Badge variant="destructive" className={compact ? 'text-[9px]' : 'text-[10px]'}>
              ATIVO
            </Badge>
          )}
        </div>
        <p className={cn('text-primary', compact ? 'text-[10px]' : 'text-xs mt-0.5')}>{passive.effect}</p>
        {!compact && passive.conditionalEffect && (
          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {passive.conditionalEffect}
            {passive.id === 'casca-grossa' && ` (+${vigor} RD)`}
          </p>
        )}
      </div>
      {compact && !isActive && (
        <Badge variant="secondary" className="text-[9px] shrink-0">
          Passivo
        </Badge>
      )}
    </div>
  );
}

// =====================================================
// Componente Principal
// =====================================================

import React from 'react';

/**
 * Comparação customizada para evitar re-renders desnecessários.
 * Ignora peCurrent e currentHP pois mudanças não afetam a estrutura do painel.
 */
function arePropsEqual(prev: TropaDeChoquePanelProps, next: TropaDeChoquePanelProps): boolean {
  return (
    prev.classTrack === next.classTrack &&
    prev.nex === next.nex &&
    prev.className === next.className &&
    prev.vigor === next.vigor &&
    prev.onPEChange === next.onPEChange
  );
}

function TropaDeChoquePanelComponent(props: TropaDeChoquePanelProps) {
  const isMobile = useIsMobile();
  const { className } = props;

  const {
    isTropaDeChoque,
    isOpen,
    setIsOpen,
    unlockedAbilities,
    unlockedPassives,
    vigorDT,
    isWounded,
    cascaGrossaHP,
    vigor,
    woundedDefenseBonus,
    woundedDamageResistance,
    canActWhileDying,
    sueWoundedBonuses,
    handleUseAbility,
    canAfford,
    hasProgression,
  } = useTropaDeChoqueTrack(props);

  // Não renderiza se não for Tropa de Choque
  if (!isTropaDeChoque || (unlockedAbilities.length === 0 && unlockedPassives.length === 0)) {
    return null;
  }

  // ===== RENDER MOBILE =====
  if (isMobile) {
    return (
      <MobileCollapsibleSection
        title="Tropa de Choque"
        icon={<Shield className="w-4 h-4 text-primary" />}
        badge={`${unlockedAbilities.length + unlockedPassives.length}`}
        defaultOpen={true}
        className={className}
      >
        <div className="space-y-3">
          <WoundedBonusAlert
            defenseBonus={woundedDefenseBonus}
            damageResistance={woundedDamageResistance}
            canActWhileDying={canActWhileDying}
            compact={true}
          />

          {unlockedPassives.map((passive) => (
            <PassiveCard
              key={passive.id}
              passive={passive}
              isWounded={isWounded}
              cascaGrossaHP={cascaGrossaHP}
              vigor={vigor}
              compact={true}
            />
          ))}

          {unlockedAbilities.map((ability) => {
            const Icon = abilityIcons[ability.id] || Shield;
            const affordable = canAfford(ability.peCost);
            const hasProg = hasProgression(ability);

            return (
              <motion.div
                key={ability.id}
                className="flex items-center gap-2 p-2 rounded-md border border-border/50 bg-card"
              >
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs font-medium">{ability.name}</span>
                    <Badge variant="outline" className="text-[9px]">
                      {ability.peCost} PE
                    </Badge>
                    {hasProg && (
                      <Badge variant="outline" className="text-[9px] text-energy border-energy/30">
                        <Zap className="w-2 h-2" />
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {ability.shortEffect}
                    {ability.usesVigorDT && ` (DT ${vigorDT})`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  disabled={!affordable}
                  onClick={() => handleUseAbility(ability)}
                  className="h-7 text-[10px] px-2 shrink-0"
                >
                  Usar
                </Button>
              </motion.div>
            );
          })}
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Tropa de Choque
                <Badge variant="outline" className="ml-1 text-[10px]">
                  {unlockedAbilities.length + unlockedPassives.length} habilidades
                </Badge>
                {(woundedDefenseBonus > 0 || woundedDamageResistance > 0) && (
                  <Badge variant="destructive" className="text-[10px]">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Machucado
                  </Badge>
                )}
              </CardTitle>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            <WoundedBonusAlert
              defenseBonus={woundedDefenseBonus}
              damageResistance={woundedDamageResistance}
              canActWhileDying={canActWhileDying}
              sources={sueWoundedBonuses?.sources}
            />

            {/* Passivos */}
            {unlockedPassives.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Passivos & Condicionais</p>
                {unlockedPassives.map((passive) => (
                  <PassiveCard
                    key={passive.id}
                    passive={passive}
                    isWounded={isWounded}
                    cascaGrossaHP={cascaGrossaHP}
                    vigor={vigor}
                  />
                ))}
              </div>
            )}

            {/* Reações */}
            {unlockedAbilities.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Reações</p>
                {unlockedAbilities.map((ability) => {
                  const Icon = abilityIcons[ability.id] || Shield;
                  const affordable = canAfford(ability.peCost);
                  const hasProg = hasProgression(ability);

                  return (
                    <motion.div
                      key={ability.id}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 p-2 rounded-md border border-border/50 bg-card hover:border-primary/30 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{ability.name}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {ability.peCost} PE
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {ability.actionType === 'reaction' ? 'Reação' : 'Ação'}
                          </Badge>
                          {hasProg && (
                            <Badge variant="outline" className="text-[10px] text-energy border-energy/30">
                              <Zap className="w-2 h-2 mr-0.5" />
                              {ability.progressionText}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{ability.shortEffect}</p>

                        {ability.usesVigorDT && (
                          <p className="text-[10px] text-primary mt-0.5">
                            DT: 10 + Vigor ({vigor}) = <span className="font-bold">{vigorDT}</span>
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="default"
                            disabled={!affordable}
                            onClick={() => handleUseAbility(ability)}
                            className="h-7 text-xs"
                          >
                            Usar ({ability.peCost} PE)
                          </Button>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="text-[10px] text-muted-foreground underline flex items-center gap-1">
                                  <Info className="w-3 h-3" />
                                  Ver descrição
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-xs">
                                <p className="text-xs">{ability.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

/** Componente exportado com memoização para otimização de performance */
export const TropaDeChoquePanel = React.memo(TropaDeChoquePanelComponent, arePropsEqual);
