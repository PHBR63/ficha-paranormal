/**
 * IntuitivoPanel - Painel unificado responsivo para a trilha Intuitivo
 * 
 * Desktop: Card com Collapsible
 * Mobile: MobileCollapsibleSection
 * 
 * Habilidades (todas passivas):
 * - Mente Sã (NEX 10%): Resistência paranormal +5
 * - Presença Poderosa (NEX 40%): +PE limit à Presença para rituais
 * - Inabalável (NEX 65%): RD Mental 10 + teste Vontade
 * - Presença do Medo (NEX 99%): Aprende o ritual
 * 
 * @module tracks/ocultista/IntuitivoPanel
 */

import { useState, memo } from 'react';
import { Brain, Check, ChevronDown } from '@/components/icons/ordem-icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCollapsibleSection } from '@/components/character/mobile/MobileCollapsibleSection';
import { 
  useIntuitivoTrack, 
  type UseIntuitivoTrackProps,
} from './useIntuitivoTrack';

// Comparação customizada para evitar re-renders desnecessários
function arePropsEqual(prev: IntutivoPanelProps, next: IntutivoPanelProps): boolean {
  return prev.nex === next.nex 
    && prev.classTrack === next.classTrack
    && prev.versatilityTrack?.trackId === next.versatilityTrack?.trackId
    && prev.versatilityTrack?.abilityId === next.versatilityTrack?.abilityId;
}

// =====================================================
// PROPS DO COMPONENTE
// =====================================================

export interface IntutivoPanelProps extends UseIntuitivoTrackProps {
  className?: string;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

function IntutivoPanelComponent(props: IntutivoPanelProps) {
  const { className, nex } = props;
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(true);

  const {
    isIntuitivo,
    hasMenteSa,
    hasInabalavel,
    unlockedAbilities,
    presencaPoderosaBonuses,
  } = useIntuitivoTrack(props);

  if (!isIntuitivo) return null;

  // =====================================================
  // RENDERIZAÇÃO MOBILE
  // =====================================================

  if (isMobile) {
    if (unlockedAbilities.length === 0) return null;

    return (
      <MobileCollapsibleSection
        title="Intuitivo"
        icon={<Brain className="w-4 h-4 text-cyan-500" />}
        className={className}
      >
        <div className="space-y-1.5 p-2">
          {/* Resumo de bônus ativos */}
          <div className="flex flex-wrap gap-1 mb-2">
            {hasMenteSa && <Badge className="bg-cyan-600 text-[9px]">+5 Res. Paranormal</Badge>}
            {hasInabalavel && <Badge className="bg-cyan-600 text-[9px]">RD Mental 10</Badge>}
          </div>

          {unlockedAbilities.map((ability) => {
            const Icon = ability.icon;
            return (
              <div key={ability.id} className="flex items-center gap-2 p-2 rounded bg-card border border-border/50">
                <Icon className="w-3 h-3 text-cyan-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium">{ability.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">{ability.effect}</span>
                </div>
                <Badge variant="outline" className="text-[8px] px-1 border-green-500/50 text-green-600">
                  <Check className="w-2 h-2" />
                </Badge>
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
    <Card className={cn('border-cyan-500/30 bg-cyan-500/5', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-cyan-500/10 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-cyan-500" />
                <span className="font-display tracking-wider uppercase">
                  Intuitivo
                </span>
                <Badge variant="outline" className="text-[10px] ml-1 border-cyan-500/50 text-cyan-500">
                  Resistência
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
            {/* Resumo de bônus */}
            {hasMenteSa && (
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-cyan-400">Bônus Ativos</span>
                  <div className="flex gap-2">
                    <Badge className="bg-cyan-600 text-[10px]">
                      +5 Res. Paranormal
                    </Badge>
                    {hasInabalavel && (
                      <Badge className="bg-cyan-600 text-[10px]">
                        RD Mental 10
                      </Badge>
                    )}
                  </div>
                </div>
                {presencaPoderosaBonuses && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Presença para rituais: {presencaPoderosaBonuses.base} + {presencaPoderosaBonuses.bonus} = {presencaPoderosaBonuses.total}
                  </p>
                )}
              </div>
            )}

            {/* Habilidades */}
            {unlockedAbilities.map((ability) => {
              const Icon = ability.icon;
              
              return (
                <div 
                  key={ability.id} 
                  className="p-3 rounded-lg border bg-card/50 border-border/50"
                >
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded bg-cyan-500/20">
                      <Icon className="w-4 h-4 text-cyan-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{ability.name}</span>
                        <Badge 
                          variant="outline" 
                          className="text-[9px] px-1.5 border-green-500/50 text-green-600"
                        >
                          <Check className="w-2 h-2 mr-0.5" />
                          Passivo
                        </Badge>
                        {ability.highlight && (
                          <Badge className="bg-cyan-600 text-[9px]">
                            {ability.highlight}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ability.effect}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Dica */}
            <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/30">
              Foco em resistência mental e poder paranormal defensivo.
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// OTIMIZAÇÃO: React.memo com comparação customizada para evitar re-renders
export const IntuitivoPanel = memo(IntutivoPanelComponent, arePropsEqual);
