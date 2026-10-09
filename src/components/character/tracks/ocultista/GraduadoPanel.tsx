/**
 * GraduadoPanel - Painel unificado responsivo para a trilha Graduado
 * 
 * Desktop: Card com Collapsible
 * Mobile: MobileCollapsibleSection
 * 
 * Habilidades (todas passivas):
 * - Saber Ampliado (NEX 10%): +1 ritual por círculo
 * - Grimório Ritualístico (NEX 40%): Armazena rituais extras
 * - Rituais Eficientes (NEX 65%): DT +5 nos seus rituais
 * - Conhecendo o Medo (NEX 99%): Aprende o ritual
 * 
 * @module tracks/ocultista/GraduadoPanel
 */

import { useState, memo } from 'react';
import { BookOpen, Check, ChevronDown } from '@/components/icons/ordem-icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCollapsibleSection } from '@/components/character/mobile/MobileCollapsibleSection';
import { 
  useGraduadoTrack, 
  type UseGraduadoTrackProps,
} from './useGraduadoTrack';

// Comparação customizada para evitar re-renders desnecessários
function arePropsEqual(prev: GraduadoPanelProps, next: GraduadoPanelProps): boolean {
  return prev.nex === next.nex 
    && prev.classTrack === next.classTrack
    && prev.className === next.className
    && prev.versatilityTrack?.trackId === next.versatilityTrack?.trackId
    && prev.versatilityTrack?.abilityId === next.versatilityTrack?.abilityId;
}

// =====================================================
// PROPS DO COMPONENTE
// =====================================================

export interface GraduadoPanelProps extends UseGraduadoTrackProps {
  className?: string;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

// Componente interno para ser memoizado
function GraduadoPanelComponent(props: GraduadoPanelProps) {
  const { className } = props;
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(true);

  const {
    isGraduado,
    hasGrimorio,
    unlockedAbilities,
    grimorioCapacity,
  } = useGraduadoTrack(props);

  if (!isGraduado) return null;

  // =====================================================
  // RENDERIZAÇÃO MOBILE
  // =====================================================

  if (isMobile) {
    if (unlockedAbilities.length === 0) return null;

    return (
      <MobileCollapsibleSection
        title="Graduado"
        icon={<BookOpen className="w-4 h-4 text-purple-500" />}
        className={className}
      >
        <div className="space-y-1.5 p-2">
          {unlockedAbilities.map((ability) => {
            const Icon = ability.icon;
            return (
              <div key={ability.id} className="flex items-center gap-2 p-2 rounded bg-card border border-border/50">
                <Icon className="w-3 h-3 text-purple-500 flex-shrink-0" />
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
          {hasGrimorio && (
            <p className="text-[10px] text-purple-400 text-center pt-1">
              📚 Grimório: {grimorioCapacity} rituais
            </p>
          )}
        </div>
      </MobileCollapsibleSection>
    );
  }

  // =====================================================
  // RENDERIZAÇÃO DESKTOP
  // =====================================================

  return (
    <Card className={cn('border-purple-500/30 bg-purple-500/5', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-purple-500/10 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-500" />
                <span className="font-display tracking-wider uppercase">
                  Graduado
                </span>
                <Badge variant="outline" className="text-[10px] ml-1 border-purple-500/50 text-purple-500">
                  Conhecimento
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
            {/* Habilidades */}
            {unlockedAbilities.map((ability) => {
              const Icon = ability.icon;
              
              return (
                <div 
                  key={ability.id} 
                  className="p-3 rounded-lg border bg-card/50 border-border/50"
                >
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded bg-purple-500/20">
                      <Icon className="w-4 h-4 text-purple-500" />
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
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ability.effect}
                      </p>
                      {ability.id === 'grimorio-ritualistico' && (
                        <p className="text-[10px] text-purple-400 mt-1">
                          📚 Capacidade do Grimório: {grimorioCapacity} rituais
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Dica */}
            <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/30">
              Foco em conhecimento e versatilidade ritualística.
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// OTIMIZAÇÃO: React.memo com comparação customizada para evitar re-renders
// quando apenas HP/PE/SAN mudam (não afetam este painel)
export const GraduadoPanel = memo(GraduadoPanelComponent, arePropsEqual);
