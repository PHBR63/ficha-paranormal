/**
 * NegociadorPanel - Painel unificado responsivo da trilha Negociador
 * 
 * Componente responsivo que adapta a UI para desktop e mobile usando useIsMobile().
 * Usa o hook useNegociadorTrack para lógica compartilhada.
 * 
 * @module tracks/especialista/NegociadorPanel
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MobileButtonGroup } from '@/components/ui/mobile-button-group';
import { 
  MessageCircle, 
  Users, 
  Handshake, 
  Sparkles, 
  Mic2,
  Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCollapsibleSection } from '../../mobile/MobileCollapsibleSection';
import { 
  useNegociadorTrack,
  type UseNegociadorTrackProps 
} from './useNegociadorTrack';

// =====================================================
// Props do Componente
// =====================================================

export interface NegociadorPanelProps extends UseNegociadorTrackProps {
  /** Trilha de Versatilidade do personagem (se houver) */
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
function arePropsEqual(prev: NegociadorPanelProps, next: NegociadorPanelProps): boolean {
  return (
    prev.classTrack === next.classTrack &&
    prev.nex === next.nex &&
    prev.onPEChange === next.onPEChange &&
    prev.versatilityTrack?.trackId === next.versatilityTrack?.trackId &&
    prev.versatilityTrack?.abilityId === next.versatilityTrack?.abilityId
  );
}

function NegociadorPanelComponent(props: NegociadorPanelProps) {
  const isMobile = useIsMobile();
  const track = useNegociadorTrack(props);

  // Não renderiza se não for Negociador
  if (!track.isNegociador) return null;

  // ===== COMPONENTE DE CONTEÚDO =====
  
  const TrackContent = () => (
    <div className="space-y-3">
      {/* NEX 10% - Eloquência */}
      {track.hasEloquencia && (
        <div className={`${isMobile ? 'flex items-center justify-between gap-2' : ''} p-${isMobile ? '2' : '3'} rounded-lg bg-${isMobile ? 'pink-900/30' : 'background/50'} border border-${isMobile ? 'pink-500/20' : 'border/50'} space-y-2`}>
          <div className={`flex items-center ${isMobile ? 'gap-2 flex-1 min-w-0' : 'justify-between'}`}>
            <div className="flex items-center gap-2">
              <Mic2 className="h-4 w-4 text-pink-400" />
              <span className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>Eloquência</span>
              {!isMobile && <Badge variant="outline" className="text-[10px]">NEX 10%</Badge>}
              {track.isConcentrating && (
                <Badge variant="default" className={`${isMobile ? 'text-[10px] px-1' : 'text-[10px]'} bg-pink-600`}>
                  {isMobile ? 'Ativo' : 'Concentrando'}
                </Badge>
              )}
            </div>
            {!isMobile && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">1 PE</Badge>
                <Button
                  size="sm"
                  variant={track.isConcentrating ? "secondary" : track.canAffordEloquencia ? "default" : "outline"}
                  disabled={!track.isConcentrating && !track.canAffordEloquencia}
                  onClick={() => track.handleEloquencia(1)}
                  className="h-7 text-xs"
                >
                  {track.isConcentrating ? 'Encerrar' : 'Usar'}
                </Button>
              </div>
            )}
          </div>
          
          {isMobile ? (
            <>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm">Eloquência</span>
                  {track.isConcentrating && (
                    <Badge variant="default" className="text-[10px] bg-pink-600 px-1">Ativo</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Fascina alvos • 1 PE</p>
              </div>
              <Button
                size="sm"
                variant={track.isConcentrating ? "secondary" : track.canAffordEloquencia ? "default" : "outline"}
                disabled={!track.isConcentrating && !track.canAffordEloquencia}
                onClick={() => track.handleEloquencia(1)}
                className="shrink-0"
              >
                {track.isConcentrating ? 'Parar' : 'Usar'}
              </Button>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Teste Diplomacia/Enganação/Intimidação vs Vontade. Alvos ficam fascinados (concentração). 
                Alvo hostil/em combate: +5 resistência e novo teste por rodada.
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                      <Info className="h-3 w-3" />
                      <span>Ver detalhes completos</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Ação completa. 1 PE por alvo em alcance curto. Quem passar no teste fica imune por 1 dia.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      )}

      {/* NEX 40% - Discurso Motivador */}
      {track.hasDiscursoMotivador && (
        <div className={`p-${isMobile ? '2' : '3'} rounded-lg bg-${isMobile ? 'blue-900/30' : 'background/50'} border border-${isMobile ? 'blue-500/20' : 'border/50'} space-y-2`}>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-400" />
            <span className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>Discurso Motivador</span>
            {!isMobile && <Badge variant="outline" className="text-[10px]">NEX 40%</Badge>}
          </div>
          <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
            {isMobile ? '+2 perícias para você e aliados' : 'Você e aliados em alcance curto ganham bônus em testes de perícia até o fim da cena.'}
          </p>
          
          {isMobile ? (
            <MobileButtonGroup
              buttons={[
                {
                  id: 'discurso-4pe',
                  label: '4 PE',
                  onClick: () => track.handleDiscursoMotivador(false),
                  variant: track.canAffordDiscurso ? 'default' : 'outline',
                  type: 'secondary',
                  disabled: !track.canAffordDiscurso,
                },
                ...(track.canUseEnhancedDiscurso ? [{
                  id: 'discurso-8pe',
                  label: '8 PE',
                  onClick: () => track.handleDiscursoMotivador(true),
                  variant: (track.canAffordEnhancedDiscurso ? 'default' : 'outline') as 'default' | 'outline',
                  type: 'secondary' as const,
                  disabled: !track.canAffordEnhancedDiscurso,
                }] : []),
              ]}
              layout="row"
              gap="sm"
            />
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={track.canAffordDiscurso ? "default" : "outline"}
                disabled={!track.canAffordDiscurso}
                onClick={() => track.handleDiscursoMotivador(false)}
                className="h-7 text-xs flex-1"
              >
                +2 (4 PE)
              </Button>
              {track.canUseEnhancedDiscurso && (
                <Button
                  size="sm"
                  variant={track.canAffordEnhancedDiscurso ? "default" : "outline"}
                  disabled={!track.canAffordEnhancedDiscurso}
                  onClick={() => track.handleDiscursoMotivador(true)}
                  className="h-7 text-xs flex-1"
                >
                  +2 (8 PE)
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* NEX 65% - Eu Conheço um Cara */}
      {track.hasConhecoCara && (
        <div className={`flex items-center justify-between gap-2 p-${isMobile ? '2' : '3'} rounded-lg bg-${isMobile ? 'green-900/30' : 'background/50'} border border-${isMobile ? 'green-500/20' : 'border/50'}`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Handshake className="h-4 w-4 text-green-400 shrink-0" />
            <div className="min-w-0">
              <span className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>Eu Conheço um Cara</span>
              {!isMobile && <Badge variant="outline" className="text-[10px] ml-2">NEX 65%</Badge>}
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                {isMobile ? 'Rede de contatos • 1x/missão' : 'Ative sua rede de contatos: troca de equipamentos, informações, resgates ou resolver problemas.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isMobile && <Badge variant="secondary" className="text-[10px]">1x/missão</Badge>}
            <Button
              size="sm"
              variant={track.conhecoCaraUsedThisMission ? "outline" : "default"}
              disabled={track.conhecoCaraUsedThisMission}
              onClick={track.handleConhecoCara}
              className={isMobile ? '' : "h-7 text-xs"}
            >
              {track.conhecoCaraUsedThisMission ? 'Usado' : 'Usar'}
            </Button>
          </div>
        </div>
      )}

      {/* NEX 99% - Truque de Mestre */}
      {track.hasTruqueMestre && (
        <div className={`flex items-center justify-between gap-2 p-${isMobile ? '2' : '3'} rounded-lg bg-${isMobile ? 'yellow-900/30' : 'background/50'} border border-${isMobile ? 'yellow-500/20' : 'border/50'}`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Sparkles className="h-4 w-4 text-yellow-400 shrink-0" />
            <div className="min-w-0">
              <span className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>Truque de Mestre</span>
              {!isMobile && <Badge variant="outline" className="text-[10px] ml-2">NEX 99%</Badge>}
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                {isMobile ? 'Copia habilidade • 5 PE' : 'Simule qualquer habilidade que um aliado usou nesta cena. Ignora pré-requisitos, mas paga todos os custos.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isMobile && <Badge variant="outline" className="text-[10px]">5 PE</Badge>}
            <Button
              size="sm"
              variant={track.canAffordTruqueMestre ? "default" : "outline"}
              disabled={!track.canAffordTruqueMestre}
              onClick={track.handleTruqueMestre}
              className={isMobile ? '' : "h-7 text-xs"}
            >
              Usar
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // ===== RENDERIZAÇÃO MOBILE =====
  
  if (isMobile) {
    return (
      <MobileCollapsibleSection
        title="Negociador"
        icon={<MessageCircle className="h-4 w-4 text-pink-400" />}
        badge={`NEX ${props.nex}%`}
      >
        <TrackContent />
      </MobileCollapsibleSection>
    );
  }

  // ===== RENDERIZAÇÃO DESKTOP =====
  
  return (
    <Card className="border-pink-500/30 bg-gradient-to-br from-pink-950/20 to-background">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-pink-400" />
          Negociador
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TrackContent />
      </CardContent>
    </Card>
  );
}

/** Componente exportado com memoização para otimização de performance */
export const NegociadorPanel = React.memo(NegociadorPanelComponent, arePropsEqual);
