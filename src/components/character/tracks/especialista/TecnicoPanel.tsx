/**
 * TecnicoPanel - Painel unificado responsivo da trilha Técnico
 * 
 * Componente responsivo que adapta a UI para desktop e mobile usando useIsMobile().
 * Usa o hook useTecnicoTrack para lógica compartilhada.
 * 
 * @module tracks/especialista/TecnicoPanel
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wrench, 
  Package, 
  Hammer, 
  Lightbulb, 
  Backpack,
  Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCollapsibleSection } from '../../mobile/MobileCollapsibleSection';
import {
  MobileDrawer,
  MobileDrawerContent,
  MobileDrawerHeader,
  MobileDrawerTitle,
  MobileDrawerTrigger,
  MobileDrawerBody,
} from '@/components/ui/mobile-drawer';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { 
  useTecnicoTrack,
  type UseTecnicoTrackProps 
} from './useTecnicoTrack';

// =====================================================
// Props do Componente
// =====================================================

export interface TecnicoPanelProps extends UseTecnicoTrackProps {}

// =====================================================
// Componente Principal
// =====================================================

import React from 'react';

/**
 * Comparação customizada para evitar re-renders desnecessários.
 * Ignora peCurrent pois mudanças de PE não afetam a estrutura do painel.
 */
function arePropsEqual(prev: TecnicoPanelProps, next: TecnicoPanelProps): boolean {
  return (
    prev.classTrack === next.classTrack &&
    prev.nex === next.nex &&
    prev.onPEChange === next.onPEChange
  );
}

function TecnicoPanelComponent(props: TecnicoPanelProps) {
  const isMobile = useIsMobile();
  const track = useTecnicoTrack(props);

  // Verifica se é a trilha correta
  if (!track.isTecnico) return null;

  // ===== COMPONENTE GRID DE CATEGORIAS =====
  
  const ImprovisarCategoryGrid = () => (
    <div className="grid grid-cols-2 gap-2">
      {[0, 1, 2, 3, 4].map((cat) => {
        const cost = track.getImprovisarCost(cat);
        return (
          <Button
            key={cat}
            variant="outline"
            onClick={() => track.handleImprovisar(cat)}
            disabled={!track.canAffordImprovisar(cat)}
            className={`${isMobile ? 'h-14' : 'h-12'} flex-col`}
          >
            <span className="font-medium">Categoria {cat}</span>
            <span className="text-xs text-muted-foreground">{cost} PE</span>
          </Button>
        );
      })}
    </div>
  );

  const PreparadoCategoryGrid = () => (
    <div className="grid grid-cols-2 gap-2">
      {[1, 2, 3, 4].map((cat) => {
        const cost = track.getPreparadoCost(cat);
        return (
          <Button
            key={cat}
            variant="outline"
            onClick={() => track.handlePreparadoParaTudo(cat)}
            disabled={!track.canAffordPreparado(cat)}
            className={`${isMobile ? 'h-14' : 'h-12'} flex-col`}
          >
            <span className="font-medium">Categoria {cat}</span>
            <span className="text-xs text-muted-foreground">{cost} PE</span>
          </Button>
        );
      })}
    </div>
  );

  // ===== COMPONENTE DE CONTEÚDO =====
  
  const TrackContent = () => (
    <div className="space-y-3">
      {/* NEX 10% - Inventário Otimizado */}
      {track.hasInventarioOtimizado && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Package className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} text-amber-500`} />
            <span className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>Inventário Otimizado</span>
            {!isMobile && <Badge variant="secondary" className="text-[10px]">NEX 10%</Badge>}
            <Badge variant="outline" className="text-[10px] ml-auto">Passiva</Badge>
          </div>
          <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground pl-6 space-y-1`}>
            <p>
              {isMobile 
                ? 'FOR + INT para calcular capacidade de carga.'
                : 'Você soma seu Intelecto à sua Força para calcular sua capacidade de carga.'
              }
            </p>
            {track.carryCapacity !== null && typeof track.carryCapacity === 'number' && (
              <p className="text-primary font-medium">
                Capacidade{isMobile ? '' : ' atual'}: {track.carryCapacity} espaços
              </p>
            )}
          </div>
        </div>
      )}

      {track.hasInventarioOtimizado && track.hasRemendao && <Separator className={`my-${isMobile ? '2' : '3'}`} />}

      {/* NEX 40% - Remendão */}
      {track.hasRemendao && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Hammer className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} text-orange-500`} />
            <span className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>Remendão</span>
            {!isMobile && <Badge variant="secondary" className="text-[10px]">NEX 40%</Badge>}
            {!isMobile && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Gaste 1 ação completa e 1 PE para remover a condição Quebrado de um equipamento adjacente até o final da cena. Além disso, qualquer equipamento geral tem sua categoria reduzida em I para você.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground pl-6 mb-2`}>
            <p>{isMobile ? 'Remove condição Quebrado até o final da cena.' : ''}</p>
          </div>
          <div className="pl-6">
            <Button
              size="sm"
              variant="outline"
              onClick={track.handleRemendao}
              disabled={!track.canAffordRemendao}
              className={`h-8 ${isMobile ? 'w-full' : ''}`}
            >
              <Hammer className="w-3 h-3 mr-1" />
              Remendar (1 PE)
            </Button>
          </div>
        </div>
      )}

      {track.hasRemendao && track.hasImprovisar && <Separator className={`my-${isMobile ? '2' : '3'}`} />}

      {/* NEX 65% - Improvisar */}
      {track.hasImprovisar && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Lightbulb className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} text-yellow-500`} />
            <span className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>Improvisar</span>
            {!isMobile && <Badge variant="secondary" className="text-[10px]">NEX 65%</Badge>}
          </div>
          <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground pl-6 mb-2`}>
            <p>{isMobile ? 'Crie equipamento geral. 2 PE + 2 PE/categoria.' : 'Crie uma versão funcional de um equipamento geral com materiais ao redor.'}</p>
            {!isMobile && <p className="italic">Custo: Ação completa + 2 PE + 2 PE por categoria.</p>}
          </div>
          <div className="pl-6">
            {isMobile ? (
              <MobileDrawer open={track.improvisarDrawerOpen} onOpenChange={track.setImprovisarDrawerOpen}>
                <MobileDrawerTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 w-full">
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Improvisar Equipamento
                  </Button>
                </MobileDrawerTrigger>
                <MobileDrawerContent maxHeight="md">
                  <MobileDrawerHeader>
                    <MobileDrawerTitle>Improvisar Equipamento</MobileDrawerTitle>
                  </MobileDrawerHeader>
                  <MobileDrawerBody useScrollArea={false}>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Escolha a categoria do equipamento:
                      </p>
                      <ImprovisarCategoryGrid />
                      <p className="text-xs text-muted-foreground text-center italic">
                        Inútil ao final da cena.
                      </p>
                    </div>
                  </MobileDrawerBody>
                </MobileDrawerContent>
              </MobileDrawer>
            ) : (
              <Drawer open={track.improvisarDrawerOpen} onOpenChange={track.setImprovisarDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8">
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Improvisar Equipamento
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Improvisar Equipamento</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Escolha a categoria do equipamento geral que deseja improvisar:
                    </p>
                    <ImprovisarCategoryGrid />
                    <p className="text-xs text-muted-foreground text-center italic">
                      O equipamento improvisado se torna inútil ao final da cena.
                    </p>
                  </div>
                </DrawerContent>
              </Drawer>
            )}
          </div>
        </div>
      )}

      {track.hasImprovisar && track.hasPreparadoParaTudo && <Separator className={`my-${isMobile ? '2' : '3'}`} />}

      {/* NEX 99% - Preparado para Tudo */}
      {track.hasPreparadoParaTudo && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Backpack className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} text-emerald-500`} />
            <span className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>Preparado para Tudo</span>
            {!isMobile && <Badge variant="secondary" className="text-[10px]">NEX 99%</Badge>}
          </div>
          <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground pl-6 mb-2`}>
            <p>{isMobile ? 'Encontre qualquer item! 2 PE/categoria.' : 'Você sempre tem o que precisa para qualquer situação!'}</p>
            {!isMobile && <p className="italic">Custo: Ação de movimento + 2 PE por categoria do item.</p>}
          </div>
          <div className="pl-6">
            {isMobile ? (
              <MobileDrawer open={track.preparadoDrawerOpen} onOpenChange={track.setPreparadoDrawerOpen}>
                <MobileDrawerTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 w-full">
                    <Backpack className="w-3 h-3 mr-1" />
                    Encontrar Item
                  </Button>
                </MobileDrawerTrigger>
                <MobileDrawerContent maxHeight="md">
                  <MobileDrawerHeader>
                    <MobileDrawerTitle>Preparado para Tudo</MobileDrawerTitle>
                  </MobileDrawerHeader>
                  <MobileDrawerBody useScrollArea={false}>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Escolha a categoria do item:
                      </p>
                      <PreparadoCategoryGrid />
                      <p className="text-xs text-muted-foreground text-center italic">
                        Exceto armas. Segue regras de inventário.
                      </p>
                    </div>
                  </MobileDrawerBody>
                </MobileDrawerContent>
              </MobileDrawer>
            ) : (
              <Drawer open={track.preparadoDrawerOpen} onOpenChange={track.setPreparadoDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8">
                    <Backpack className="w-3 h-3 mr-1" />
                    Encontrar Item
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Preparado para Tudo</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Escolha a categoria do item que você "lembrou" que colocou na bolsa:
                    </p>
                    <PreparadoCategoryGrid />
                    <p className="text-xs text-muted-foreground text-center italic">
                      O item segue normalmente as regras de inventário. Exceto armas.
                    </p>
                  </div>
                </DrawerContent>
              </Drawer>
            )}
          </div>
        </div>
      )}

      {/* Resumo de habilidades bloqueadas */}
      {!track.hasPreparadoParaTudo && (
        <div className="pt-2 border-t border-border/50">
          <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground`}>
            Próximas{isMobile ? '' : ' habilidades'}:{' '}
            {!track.hasRemendao && 'Remendão (40%), '}
            {!track.hasImprovisar && 'Improvisar (65%), '}
            {!track.hasPreparadoParaTudo && 'Preparado para Tudo (99%)'}
          </p>
        </div>
      )}
    </div>
  );

  // ===== RENDERIZAÇÃO MOBILE =====
  
  if (isMobile) {
    return (
      <MobileCollapsibleSection
        title="Técnico"
        icon={<Wrench className="w-4 h-4" />}
        badge={`${track.activeCount}/4`}
        defaultOpen={false}
      >
        <TrackContent />
      </MobileCollapsibleSection>
    );
  }

  // ===== RENDERIZAÇÃO DESKTOP =====
  
  return (
    <Card className="border-primary/30 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wrench className="w-5 h-5 text-primary" />
          Técnico
          <Badge variant="outline" className="ml-auto text-xs">
            {props.nex}% NEX
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TrackContent />
      </CardContent>
    </Card>
  );
}

/** Componente exportado com memoização para otimização de performance */
export const TecnicoPanel = React.memo(TecnicoPanelComponent, arePropsEqual);

export default TecnicoPanel;
