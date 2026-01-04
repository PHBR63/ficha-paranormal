/**
 * LaminaParanormalPanel - Painel unificado responsivo para a trilha Lâmina Paranormal
 * 
 * Desktop: Card com Collapsible
 * Mobile: MobileCollapsibleSection
 * 
 * Habilidades:
 * - Lâmina Maldita (NEX 10%): Aprende Amaldiçoar Arma + modificador
 * - Gladiador Paranormal (NEX 40%): Passivo - PE temp ao acertar corpo a corpo
 * - Conjuração Marcial (NEX 65%): 2 PE - ataque extra após ritual
 * - Lâmina do Medo (NEX 99%): Aprende o ritual
 * 
 * @module tracks/ocultista/LaminaParanormalPanel
 */

import { useState, memo } from 'react';
import { Sword, Zap, Swords, Check, Loader2, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCollapsibleSection } from '@/components/character/mobile/MobileCollapsibleSection';
import { 
  useLaminaParanormalTrack, 
  type UseLaminaParanormalTrackProps,
} from './useLaminaParanormalTrack';
import type { EffectDuration } from '@/hooks/useActivatedEffects';

// Comparação customizada para evitar re-renders desnecessários
function arePropsEqual(prev: LaminaParanormalPanelProps, next: LaminaParanormalPanelProps): boolean {
  return prev.nex === next.nex && prev.classTrack === next.classTrack && prev.peCurrent === next.peCurrent;
}

// =====================================================
// PROPS DO COMPONENTE
// =====================================================

export interface LaminaParanormalPanelProps extends UseLaminaParanormalTrackProps {
  className?: string;
  isEffectActive?: (id: string) => boolean;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

function LaminaParanormalPanelComponent(props: LaminaParanormalPanelProps) {
  const { className, peCurrent, nex } = props;
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(true);

  const {
    isLamina,
    isActivating,
    hasConjuracaoMarcial,
    hasGladiadorParanormal,
    unlockedPassives,
    handleConjuracaoMarcial,
  } = useLaminaParanormalTrack(props);

  if (!isLamina) return null;

  // =====================================================
  // RENDERIZAÇÃO MOBILE
  // =====================================================

  if (isMobile) {
    return (
      <MobileCollapsibleSection
        title="Lâmina Paranormal"
        icon={<Sword className="w-4 h-4 text-violet-500" />}
        badge={hasConjuracaoMarcial ? 1 : undefined}
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

          {/* Gladiador Paranormal - Lembrete especial */}
          {hasGladiadorParanormal && (
            <div className="p-2 rounded bg-violet-500/10 border border-violet-500/30">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3 h-3 text-violet-500" />
                <span className="text-[10px] font-medium text-violet-400">Gladiador</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Acerto corpo a corpo = +2 PE temp</p>
            </div>
          )}

          {/* Conjuração Marcial */}
          {hasConjuracaoMarcial && (
            <div className="p-2 rounded-lg bg-card border border-border/50">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-xs">Conjuração Marcial</span>
                    <Badge variant="outline" className="text-[8px] px-1 border-green-500/50 text-green-600">
                      Livre
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Ataque após ritual</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-paranormal flex items-center gap-0.5">
                    <Zap className="w-3 h-3" /> 2
                  </span>
                  <Button 
                    size="sm" 
                    className="h-6 text-[10px] px-2 bg-violet-600 hover:bg-violet-700" 
                    disabled={peCurrent < 2 || isActivating} 
                    onClick={handleConjuracaoMarcial}
                  >
                    {isActivating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Swords className="w-3 h-3 mr-0.5" />
                        Atacar
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
    <Card className={cn('border-violet-500/30 bg-violet-500/5', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-violet-500/10 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Sword className="w-4 h-4 text-violet-500" />
                <span className="font-display tracking-wider uppercase">
                  Lâmina Paranormal
                </span>
                <Badge variant="outline" className="text-[10px] ml-1 border-violet-500/50 text-violet-500">
                  Híbrido
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
                  Passivas & Rituais
                </div>
                {unlockedPassives.map((passive, idx) => (
                  <div key={idx} className="text-[10px] text-muted-foreground">
                    <span className="text-foreground">{passive.name}</span> — {passive.effect}
                  </div>
                ))}
              </div>
            )}

            {/* Gladiador Paranormal - Lembrete especial */}
            {hasGladiadorParanormal && (
              <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="text-xs font-medium text-violet-400">Gladiador Paranormal</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Ao acertar ataque corpo a corpo: <span className="text-violet-400">+2 PE temporários</span>
                </p>
              </div>
            )}

            {/* Conjuração Marcial */}
            {hasConjuracaoMarcial && (
              <div className="p-3 rounded-lg border bg-card/50 border-border/50 hover:border-violet-500/50 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">Conjuração Marcial</span>
                      <Badge variant="outline" className="text-[9px] px-1.5 border-green-500/50 text-green-600">
                        Livre
                      </Badge>
                    </div>
                    <p className="text-[10px] text-violet-500 mt-0.5 italic">
                      ⚡ 1x por rodada, após ritual de ação padrão
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ataque corpo a corpo grátis após ritual
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
                      className="h-7 text-xs gap-1 bg-violet-600 hover:bg-violet-700"
                      disabled={peCurrent < 2 || isActivating}
                      onClick={handleConjuracaoMarcial}
                    >
                      {isActivating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Swords className="w-3 h-3" />
                          Atacar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Dica */}
            <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/30">
              Combine rituais e combate corpo a corpo com maestria.
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// OTIMIZAÇÃO: React.memo com comparação customizada para evitar re-renders
export const LaminaParanormalPanel = memo(LaminaParanormalPanelComponent, arePropsEqual);
