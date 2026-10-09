/**
 * ConduitePanel - Painel unificado responsivo para a trilha Conduíte
 * 
 * Desktop: Card com Collapsible
 * Mobile: MobileCollapsibleSection
 * 
 * Habilidades:
 * - Ampliar Ritual (NEX 10%): 2 PE - +1 alcance ou 2x área
 * - Acelerar Ritual (NEX 40%): 4 PE - conjura como ação livre
 * - Anular Ritual (NEX 65%): PE variável - anula ritual inimigo
 * - Canalizar o Medo (NEX 99%): Aprende o ritual
 * 
 * @module tracks/ocultista/ConduitePanel
 */

import { useState, memo } from 'react';
import { Waves, Zap, Timer, ShieldX, Check, Loader2, ChevronDown } from '@/components/icons/ordem-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCollapsibleSection } from '@/components/character/mobile/MobileCollapsibleSection';
import { 
  useConduiteTrack, 
  type UseConduiteTrackProps,
  type ConduiteAbility,
} from './useConduiteTrack';
import type { EffectDuration } from '@/hooks/useActivatedEffects';

// Comparação customizada para evitar re-renders desnecessários
function arePropsEqual(prev: ConduitePanelProps, next: ConduitePanelProps): boolean {
  return (
    prev.nex === next.nex && 
    prev.classTrack === next.classTrack && 
    prev.peCurrent === next.peCurrent &&
    prev.versatilityTrack?.trackId === next.versatilityTrack?.trackId &&
    prev.versatilityTrack?.abilityId === next.versatilityTrack?.abilityId
  );
}

// =====================================================
// PROPS DO COMPONENTE
// =====================================================

export interface ConduitePanelProps extends UseConduiteTrackProps {
  className?: string;
  isEffectActive?: (id: string) => boolean;
  /** Trilha de Versatilidade do personagem (se houver) */
  versatilityTrack?: { trackId: string; abilityId: string } | null;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

function ConduitePanelComponent(props: ConduitePanelProps) {
  const { className } = props;
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(true);

  const {
    isConduite,
    activatingAbility,
    unlockedAbilities,
    unlockedPassives,
    canAffordAbility,
    handleUseAbility,
  } = useConduiteTrack(props);

  if (!isConduite) return null;

  // =====================================================
  // RENDERIZAÇÃO MOBILE
  // =====================================================

  if (isMobile) {
    return (
      <MobileCollapsibleSection
        title="Conduíte"
        icon={<Waves className="w-4 h-4 text-blue-500" />}
        badge={unlockedAbilities.length}
        className={className}
      >
        <div className="space-y-2 p-2">
          {/* Passivas/Rituais concedidos */}
          {unlockedPassives.length > 0 && (
            <div className="p-2 rounded bg-muted/30 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1 text-green-500 font-medium mb-1">
                <Check className="w-3 h-3" /> Rituais
              </span>
              {unlockedPassives.map((p, i) => <div key={i}>{p.name}</div>)}
            </div>
          )}

          {/* Habilidades ativas */}
          {unlockedAbilities.map((ability) => {
            const isActivating = activatingAbility === ability.id;
            const canAfford = canAffordAbility(ability);

            return (
              <div key={ability.id} className="p-2 rounded-lg bg-card border border-border/50">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-xs">{ability.name}</span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          'text-[8px] px-1',
                          ability.actionType === 'reaction' 
                            ? 'border-yellow-500/50 text-yellow-600' 
                            : 'border-green-500/50 text-green-600'
                        )}
                      >
                        {ability.actionType === 'reaction' ? 'Reação' : 'Livre'}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{ability.shortEffect}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-paranormal flex items-center gap-0.5">
                      <Zap className="w-3 h-3" /> {ability.peCost === 'variable' ? '?' : ability.peCost}
                    </span>
                    <Button 
                      size="sm" 
                      className="h-6 text-[10px] px-2 bg-blue-600 hover:bg-blue-700" 
                      disabled={!canAfford || isActivating} 
                      onClick={() => handleUseAbility(ability)}
                    >
                      {isActivating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Usar'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </MobileCollapsibleSection>
    );
  }

  // =====================================================
  // RENDERIZAÇÃO DESKTOP
  // =====================================================

  return (
    <Card className={cn('border-blue-500/30 bg-blue-500/5', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-blue-500/10 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-blue-500" />
                <span className="font-display tracking-wider uppercase">
                  Conduíte
                </span>
                {unlockedAbilities.length > 0 && (
                  <Badge variant="outline" className="text-[10px] ml-1 border-blue-500/50 text-blue-500">
                    {unlockedAbilities.length}
                  </Badge>
                )}
              </div>
              <ChevronDown 
                className={cn(
                  'w-4 h-4 text-muted-foreground transition-transform',
                  isOpen && 'rotate-180'
                )} 
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-3 space-y-2">
            {/* Passivas/Rituais concedidos */}
            {unlockedPassives.length > 0 && (
              <div className="p-2 rounded-lg bg-muted/30 border border-border/30 mb-2">
                <div className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" />
                  Rituais Concedidos
                </div>
                {unlockedPassives.map((passive, idx) => (
                  <div key={idx} className="text-[10px] text-muted-foreground">
                    <span className="text-foreground">{passive.name}</span> — {passive.effect}
                  </div>
                ))}
              </div>
            )}

            {/* Habilidades ativas */}
            {unlockedAbilities.map((ability) => {
              const isActivating = activatingAbility === ability.id;
              const canAfford = canAffordAbility(ability);

              return (
                <div 
                  key={ability.id} 
                  className="p-3 rounded-lg border bg-card/50 border-border/50 hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{ability.name}</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-[9px] px-1.5',
                            ability.actionType === 'reaction' 
                              ? 'border-yellow-500/50 text-yellow-600'
                              : 'border-green-500/50 text-green-600'
                          )}
                        >
                          {ability.actionType === 'reaction' ? 'Reação' : 'Livre'}
                        </Badge>
                      </div>
                      {ability.trigger && (
                        <p className="text-[10px] text-blue-500 mt-0.5 italic">
                          ⚡ {ability.trigger}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {ability.shortEffect}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-paranormal flex items-center gap-0.5">
                        <Zap className="w-3 h-3" />
                        {ability.peCost === 'variable' ? '?' : ability.peCost}
                      </span>
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700"
                        disabled={!canAfford || isActivating}
                        onClick={() => handleUseAbility(ability)}
                      >
                        {isActivating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : ability.id === 'anular-ritual' ? (
                          <>
                            <ShieldX className="w-3 h-3" />
                            Anular
                          </>
                        ) : ability.id === 'acelerar-ritual' ? (
                          <>
                            <Timer className="w-3 h-3" />
                            Acelerar
                          </>
                        ) : (
                          'Usar'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Dica */}
            <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/30">
              Modifique seus rituais com alcance, velocidade e contra-mágica.
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// OTIMIZAÇÃO: React.memo com comparação customizada para evitar re-renders
export const ConduitePanel = memo(ConduitePanelComponent, arePropsEqual);
