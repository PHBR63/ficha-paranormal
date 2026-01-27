/**
 * FlageladorPanel - Painel unificado responsivo para a trilha Flagelador
 * 
 * Desktop: Card com Collapsible
 * Mobile: MobileCollapsibleSection
 * 
 * Habilidades:
 * - Poder do Flagelo (NEX 10%): Passivo - usa PV como PE
 * - Abraçar a Dor (NEX 40%): 2 PE - reduz dano paranormal à metade
 * - Absorver Angústia (NEX 65%): Passivo - PE temp ao matar com ritual
 * - Medo Tangível (NEX 99%): Aprende o ritual
 * 
 * @module tracks/ocultista/FlageladorPanel
 */

import { useState, memo } from 'react';
import { Flame, Zap, Heart, ShieldHalf, Check, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCollapsibleSection } from '@/components/character/mobile/MobileCollapsibleSection';
import { 
  useFlageladorTrack, 
  type UseFlageladorTrackProps,
} from './useFlageladorTrack';
import type { EffectDuration } from '@/hooks/useActivatedEffects';

// Comparação customizada para evitar re-renders desnecessários
function arePropsEqual(prev: FlageladorPanelProps, next: FlageladorPanelProps): boolean {
  return prev.nex === next.nex 
    && prev.classTrack === next.classTrack 
    && prev.peCurrent === next.peCurrent
    && prev.versatilityTrack?.trackId === next.versatilityTrack?.trackId
    && prev.versatilityTrack?.abilityId === next.versatilityTrack?.abilityId;
}

// =====================================================
// PROPS DO COMPONENTE
// =====================================================

export interface FlageladorPanelProps extends UseFlageladorTrackProps {
  className?: string;
  isEffectActive?: (id: string) => boolean;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

function FlageladorPanelComponent(props: FlageladorPanelProps) {
  const { className, peCurrent } = props;
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(true);

  const {
    isFlagelador,
    isActivating,
    hasAbracarDor,
    hasPoderDoFlagelo,
    unlockedPassives,
    handleAbracarDor,
  } = useFlageladorTrack(props);

  if (!isFlagelador) return null;

  // =====================================================
  // RENDERIZAÇÃO MOBILE
  // =====================================================

  if (isMobile) {
    return (
      <MobileCollapsibleSection
        title="Flagelador"
        icon={<Flame className="w-4 h-4 text-red-600" />}
        badge={hasAbracarDor ? 1 : undefined}
        className={className}
      >
        <div className="space-y-2 p-2">
          {/* Passivas */}
          {unlockedPassives.length > 0 && (
            <div className="p-2 rounded bg-muted/30 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1 text-green-500 font-medium mb-1">
                <Check className="w-3 h-3" /> Passivas
              </span>
              {unlockedPassives.map((p, i) => <div key={i}>{p.name}: {p.effect}</div>)}
            </div>
          )}

          {/* Poder do Flagelo - Dica especial */}
          {hasPoderDoFlagelo && (
            <div className="p-2 rounded bg-red-900/20 border border-red-500/30">
              <div className="flex items-center gap-1.5 mb-1">
                <Heart className="w-3 h-3 text-red-500" />
                <span className="text-[10px] font-medium text-red-400">Poder do Flagelo</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Use PV no lugar de PE para rituais</p>
            </div>
          )}

          {/* Abraçar a Dor */}
          {hasAbracarDor && (
            <div className="p-2 rounded-lg bg-card border border-border/50">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-xs">Abraçar a Dor</span>
                    <Badge variant="outline" className="text-[8px] px-1 border-yellow-500/50 text-yellow-600">
                      Reação
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">½ dano paranormal</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-paranormal flex items-center gap-0.5">
                    <Zap className="w-3 h-3" /> 2
                  </span>
                  <Button 
                    size="sm" 
                    className="h-6 text-[10px] px-2 bg-red-600 hover:bg-red-700" 
                    disabled={peCurrent < 2 || isActivating} 
                    onClick={handleAbracarDor}
                  >
                    {isActivating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <ShieldHalf className="w-3 h-3 mr-0.5" />
                        Usar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </MobileCollapsibleSection>
    );
  }

  // =====================================================
  // RENDERIZAÇÃO DESKTOP
  // =====================================================

  return (
    <Card className={cn('border-red-600/30 bg-red-600/5', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-red-600/10 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-600" />
                <span className="font-display tracking-wider uppercase">
                  Flagelador
                </span>
                <Badge variant="outline" className="text-[10px] ml-1 border-red-600/50 text-red-600">
                  Sacrifício
                </Badge>
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
            {/* Passivas */}
            {unlockedPassives.length > 0 && (
              <div className="p-2 rounded-lg bg-muted/30 border border-border/30 mb-2">
                <div className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" />
                  Passivas
                </div>
                {unlockedPassives.map((passive, idx) => (
                  <div key={idx} className="text-[10px] text-muted-foreground">
                    <span className="text-foreground">{passive.name}</span> — {passive.effect}
                  </div>
                ))}
              </div>
            )}

            {/* Poder do Flagelo - Dica especial */}
            {hasPoderDoFlagelo && (
              <div className="p-2 rounded-lg bg-red-900/20 border border-red-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium text-red-400">Poder do Flagelo</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Ao conjurar rituais, você pode gastar PV no lugar de PE (1 PV = 1 PE).
                  <span className="text-red-400 block mt-0.5">⚠️ PV gastos só recuperam com descanso.</span>
                </p>
              </div>
            )}

            {/* Abraçar a Dor */}
            {hasAbracarDor && (
              <div className="p-3 rounded-lg border bg-card/50 border-border/50 hover:border-red-600/50 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">Abraçar a Dor</span>
                      <Badge variant="outline" className="text-[9px] px-1.5 border-yellow-500/50 text-yellow-600">
                        Reação
                      </Badge>
                    </div>
                    <p className="text-[10px] text-red-500 mt-0.5 italic">
                      ⚡ Ao sofrer dano paranormal
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reduz dano paranormal à metade
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-paranormal flex items-center gap-0.5">
                      <Zap className="w-3 h-3" />
                      2
                    </span>
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-xs gap-1 bg-red-600 hover:bg-red-700"
                      disabled={peCurrent < 2 || isActivating}
                      onClick={handleAbracarDor}
                    >
                      {isActivating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <ShieldHalf className="w-3 h-3" />
                          Usar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Dica */}
            <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/30">
              Transforme dor em poder. Sacrifique PV para rituais mais fortes.
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// OTIMIZAÇÃO: React.memo com comparação customizada para evitar re-renders
export const FlageladorPanel = memo(FlageladorPanelComponent, arePropsEqual);
