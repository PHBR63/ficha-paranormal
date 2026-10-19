/**
 * AtiradorDeElitePanel - Painel unificado responsivo da trilha Atirador de Elite
 * 
 * Componente responsivo que adapta a UI para desktop e mobile usando useIsMobile().
 * Usa o hook useAtiradorDeEliteTrack para lógica compartilhada.
 * 
 * @module tracks/especialista/AtiradorDeElitePanel
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crosshair, Target, Zap, Skull, CheckCircle2, Loader2 } from '@/components/icons/ordem-icons';
import { DrawerClose } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCollapsibleSection } from '../../mobile/MobileCollapsibleSection';
import {
  MobileDrawer,
  MobileDrawerContent,
  MobileDrawerHeader,
  MobileDrawerTitle,
  MobileDrawerDescription,
  MobileDrawerBody,
  MobileDrawerFooter,
} from '@/components/ui/mobile-drawer';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { 
  useAtiradorDeEliteTrack, 
  ATIRADOR_ABILITIES, 
  MANOBRAS_IMPACTANTE,
  type UseAtiradorDeEliteTrackProps 
} from './useAtiradorDeEliteTrack';

// =====================================================
// Props do Componente
// =====================================================

export interface AtiradorDeElitePanelProps extends UseAtiradorDeEliteTrackProps {}

// =====================================================
// Componente Principal
// =====================================================

import React from 'react';

/**
 * Comparação customizada para evitar re-renders desnecessários.
 * Ignora peCurrent pois mudanças de PE não afetam a estrutura do painel.
 */
function arePropsEqual(prev: AtiradorDeElitePanelProps, next: AtiradorDeElitePanelProps): boolean {
  return (
    prev.classTrack === next.classTrack &&
    prev.nex === next.nex &&
    prev.intellect === next.intellect &&
    prev.onPEChange === next.onPEChange &&
    prev.onActivateEffect === next.onActivateEffect &&
    prev.versatilityTrack?.trackId === next.versatilityTrack?.trackId &&
    prev.versatilityTrack?.abilityId === next.versatilityTrack?.abilityId
  );
}

function AtiradorDeElitePanelComponent(props: AtiradorDeElitePanelProps) {
  const isMobile = useIsMobile();
  const track = useAtiradorDeEliteTrack(props);

  // Não renderiza se não for Atirador de Elite ou não tiver habilidades
  if (!track.isAtiradorElite || track.unlockedAbilities.length === 0) {
    return null;
  }

  // ===== COMPONENTES COMPARTILHADOS =====
  
  const AbilitiesList = () => (
    <div className={isMobile ? "space-y-2" : "space-y-3"}>
      {track.unlockedAbilities.map((ability) => {
        const isActivating = track.activatingAbility === ability.id;
        const canAfford = track.canAffordAbility(ability);
        
        return (
          <div 
            key={ability.id}
            className={`${isMobile ? 'p-2.5' : 'p-3'} rounded-lg bg-background/50 border border-border/50 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {ability.id === 'mira-de-elite' && <Target className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-amber-400`} />}
                {ability.id === 'disparo-letal' && <Zap className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-red-400`} />}
                {ability.id === 'disparo-impactante' && <Target className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-orange-400`} />}
                {ability.id === 'atirar-para-matar' && <Skull className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-red-500`} />}
                <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{ability.name}</span>
                {!isMobile && (
                  <Badge variant="outline" className="text-[10px]">
                    NEX {ability.minNex}%
                  </Badge>
                )}
              </div>
              
              {ability.isPassive ? (
                <Badge variant="secondary" className={`${isMobile ? 'text-[9px] h-5' : 'text-[10px]'}`}>
                  Passiva
                </Badge>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${isMobile ? 'text-[9px] h-5' : 'text-[10px]'}`}>
                    {ability.peCost} PE
                  </Badge>
                  {ability.id === 'disparo-letal' ? (
                    <Badge variant="secondary">Ao Mirar</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant={canAfford ? "default" : "outline"}
                      disabled={!canAfford || isActivating}
                      onClick={() => track.handleUseAbility(ability)}
                      className={isMobile ? "h-6 text-[10px] px-2" : "h-7 text-xs"}
                    >
                      {isActivating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Usar'
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>
              {ability.shortEffect}
            </p>

            {ability.id === 'disparo-letal' && (
              <p className="text-xs text-muted-foreground">
                Selecione a arma em Combate e registre Mirar para gastar 1 PE. No próximo ataque no prazo, ative o benefício já pago. O servidor confirma o custo e o histórico.
              </p>
            )}

            {/* Info extra para Mira de Elite */}
            {ability.id === 'mira-de-elite' && (
              <div className={`flex items-center gap-2 ${isMobile ? 'mt-1.5 p-1.5' : 'mt-1 p-2'} rounded bg-amber-500/10 border border-amber-500/20`}>
                <CheckCircle2 className="h-3 w-3 text-amber-400" />
                <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-amber-300`}>
                  +{track.intellect} dano (INT) com balas longas
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const ManeuverButtons = () => (
    <div className="grid grid-cols-2 gap-2">
      {MANOBRAS_IMPACTANTE.map((manobra) => (
        <Button
          key={manobra.id}
          variant="outline"
          className={`h-auto ${isMobile ? 'py-2.5' : 'py-3'} flex flex-col items-center gap-0.5`}
          onClick={() => track.handleManeuverChoice(manobra)}
        >
          <span className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>{manobra.name}</span>
          <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>{manobra.description}</span>
        </Button>
      ))}
    </div>
  );

  // ===== RENDERIZAÇÃO MOBILE =====
  
  if (isMobile) {
    return (
      <>
        <MobileCollapsibleSection
          title="ATIRADOR DE ELITE"
          icon={<Crosshair className="h-4 w-4 text-amber-400" />}
          defaultOpen={true}
          className="border-amber-500/30"
        >
          <AbilitiesList />
        </MobileCollapsibleSection>

        <MobileDrawer open={track.showManeuverDrawer} onOpenChange={track.setShowManeuverDrawer}>
          <MobileDrawerContent maxHeight="sm">
            <MobileDrawerHeader>
              <MobileDrawerTitle>Disparo Impactante</MobileDrawerTitle>
              <MobileDrawerDescription>Escolha a manobra (2 PE)</MobileDrawerDescription>
            </MobileDrawerHeader>
            <MobileDrawerBody useScrollArea={false}>
              <ManeuverButtons />
            </MobileDrawerBody>
            <MobileDrawerFooter>
              <DrawerClose asChild>
                <Button variant="ghost" className="w-full h-10">
                  <span className="text-sm">Cancelar</span>
                </Button>
              </DrawerClose>
            </MobileDrawerFooter>
          </MobileDrawerContent>
        </MobileDrawer>
      </>
    );
  }

  // ===== RENDERIZAÇÃO DESKTOP =====
  
  return (
    <>
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-amber-400" />
            Atirador de Elite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AbilitiesList />
        </CardContent>
      </Card>

      <Drawer open={track.showManeuverDrawer} onOpenChange={track.setShowManeuverDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Disparo Impactante</DrawerTitle>
            <DrawerDescription>Escolha a manobra que deseja executar (2 PE)</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <ManeuverButtons />
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

/** Componente exportado com memoização para otimização de performance */
export const AtiradorDeElitePanel = React.memo(AtiradorDeElitePanelComponent, arePropsEqual);
