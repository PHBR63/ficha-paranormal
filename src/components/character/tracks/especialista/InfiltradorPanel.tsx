/**
 * InfiltradorPanel - Painel unificado responsivo da trilha Infiltrador
 * 
 * Componente responsivo que adapta a UI para desktop e mobile usando useIsMobile().
 * Usa o hook useInfiltradorTrack para lógica compartilhada.
 * 
 * @module tracks/especialista/InfiltradorPanel
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crosshair, Eye, Skull, Ghost, Zap, Info } from '@/components/icons/ordem-icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCollapsibleSection } from '../../mobile/MobileCollapsibleSection';
import { 
  useInfiltradorTrack,
  type UseInfiltradorTrackProps 
} from './useInfiltradorTrack';

// =====================================================
// Props do Componente
// =====================================================

export interface InfiltradorPanelProps extends UseInfiltradorTrackProps {
  /** Trilha de Versatilidade do personagem (NEX 50%) */
  versatilityTrack?: { trackId: string; abilityId: string } | null;
}

// =====================================================
// Componente Principal
// =====================================================

import React from 'react';

/**
 * Comparação customizada para evitar re-renders desnecessários.
 * Ignora peCurrent pois mudanças de PE não afetam a estrutura do painel.
 */
function arePropsEqual(prev: InfiltradorPanelProps, next: InfiltradorPanelProps): boolean {
  return (
    prev.classTrack === next.classTrack &&
    prev.nex === next.nex &&
    prev.agility === next.agility &&
    prev.onPEChange === next.onPEChange &&
    prev.onActivateEffect === next.onActivateEffect &&
    prev.versatilityTrack?.trackId === next.versatilityTrack?.trackId &&
    prev.versatilityTrack?.abilityId === next.versatilityTrack?.abilityId
  );
}

function InfiltradorPanelComponent(props: InfiltradorPanelProps) {
  const isMobile = useIsMobile();
  const track = useInfiltradorTrack(props);

  // Só renderiza se for trilha infiltrador
  if (!track.isInfiltrador) return null;

  // ===== COMPONENTE DE CONTEÚDO =====
  
  const TrackContent = () => (
    <div className="space-y-2">
      {/* Indicador de bônus de furtividade do SUE (desktop only) */}
      {!isMobile && track.sueStealthBonuses && (track.removesStealthMovementPenalty || track.ignoresStealthPenalties) && (
        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 space-y-1">
          <p className="text-xs font-medium text-purple-300">Bônus de Furtividade (SUE)</p>
          <div className="flex gap-2 flex-wrap">
            {track.removesStealthMovementPenalty && (
              <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-300">
                Sem penalidade de movimento
              </Badge>
            )}
            {track.ignoresStealthPenalties && (
              <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-300">
                Ignora todas as penalidades
              </Badge>
            )}
          </div>
        </div>
      )}
      
      {/* NEX 10% - Ataque Furtivo */}
      {track.hasAtaqueFurtivo && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-purple-900/30 border border-purple-500/20">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Crosshair className="h-4 w-4 text-purple-400 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'} truncate`}>Ataque Furtivo</span>
                {!isMobile && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>1x/rodada. Contra alvo desprevenido (corpo a corpo, curto ou flanqueando), causa {track.sneakAttackDice} dano extra.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>
                {track.sneakAttackDice} • 1 PE • 1x/rodada
                {(track.assassinarActive || track.sneakAttackMultiplier > 1) && (
                  <span className="text-red-400 ml-1">(x{track.sneakAttackMultiplier}!)</span>
                )}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant={track.ataqueFurtivoUsedThisRound ? "outline" : "default"}
            disabled={!track.canAffordAtaqueFurtivo}
            onClick={() => track.handleAtaqueFurtivo()}
            className={isMobile ? "h-7 px-2 text-xs" : "shrink-0"}
          >
            <Zap className="h-3 w-3 mr-1" />
            {track.ataqueFurtivoUsedThisRound ? 'Usado' : 'Ativar'}
          </Button>
        </div>
      )}

      {/* NEX 40% - Gatuno (Passivo) */}
      {track.hasGatuno && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-900/20 border border-purple-500/10">
          <Eye className="h-4 w-4 text-purple-300 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Gatuno</span>
              <Badge variant="secondary" className={`${isMobile ? 'text-[8px] px-1 h-4' : 'text-[10px] px-1'}`}>Passivo</Badge>
            </div>
            <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>
              +5 Atletismo/Crime. Esconder sem penalidade.
            </p>
          </div>
        </div>
      )}

      {/* NEX 65% - Assassinar */}
      {track.hasAssassinar && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-purple-900/30 border border-purple-500/20">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Skull className="h-4 w-4 text-red-400 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'} truncate`}>Assassinar</span>
                {!isMobile && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Gaste ação de movimento + 3 PE. Próximo Ataque Furtivo dobra dados. Se causar dano, alvo fica inconsciente/morrendo (Fort DT {track.assassinarDT} evita).</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          DT = 10 + {track.assassinarPeLimit} (Limite PE) + {track.agility} (Agi) = {track.assassinarDT}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>
                3 PE • Fort DT {track.assassinarDT}
              </p>
              {!isMobile && (
                <p className="text-[10px] text-primary/70 mt-0.5">
                  10 + {track.assassinarPeLimit} (Limite PE) + {track.agility} (Agi)
                </p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant={track.assassinarActive ? "secondary" : "default"}
            disabled={!track.canAffordAssassinar}
            onClick={track.handleAssassinar}
            className={isMobile ? "h-7 px-2 text-xs" : "shrink-0"}
          >
            {track.assassinarActive ? 'Ativo' : 'Preparar'}
          </Button>
        </div>
      )}

      {/* NEX 99% - Sombra Fugaz */}
      {track.hasSombraFugaz && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-purple-900/30 border border-purple-500/20">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Ghost className="h-4 w-4 text-purple-300 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'} truncate`}>Sombra Fugaz</span>
                {!isMobile && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Após atacar ou ação chamativa, gaste 3 PE para ignorar a penalidade de -20 no teste de Furtividade.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>
                3 PE • Ignora -20 Furtividade
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="default"
            disabled={!track.canAffordSombraFugaz}
            onClick={track.handleSombraFugaz}
            className={isMobile ? "h-7 px-2 text-xs" : "shrink-0"}
          >
            <Ghost className="h-3 w-3 mr-1" />
            Usar
          </Button>
        </div>
      )}
    </div>
  );

  // ===== RENDERIZAÇÃO MOBILE =====
  
  if (isMobile) {
    return (
      <MobileCollapsibleSection
        title="Trilha do Infiltrador"
        icon={<Eye className="h-4 w-4 text-purple-400" />}
        badge={`NEX ${props.nex}%`}
        defaultOpen={true}
      >
        <TrackContent />
      </MobileCollapsibleSection>
    );
  }

  // ===== RENDERIZAÇÃO DESKTOP =====
  
  return (
    <Card className="border-purple-500/30 bg-purple-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5 text-purple-400" />
          Trilha do Infiltrador
          <Badge variant="outline" className="ml-auto text-xs">
            NEX {props.nex}%
          </Badge>
          {track.hasSueData && (
            <Badge variant="secondary" className="text-[10px]">
              SUE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TrackContent />
      </CardContent>
    </Card>
  );
}

/** Componente exportado com memoização para otimização de performance */
export const InfiltradorPanel = React.memo(InfiltradorPanelComponent, arePropsEqual);
