/**
 * GuerreiroPanel - Componente unificado responsivo da trilha Guerreiro
 * 
 * Renderiza UI otimizada para desktop ou mobile baseado em useIsMobile().
 * Utiliza useGuerreiroTrack para lógica compartilhada.
 * 
 * @module tracks/combatente/GuerreiroPanel
 */

import { ArrowDownToLine, MoveHorizontal, ChevronDown, Check, Loader2, Zap, Sword } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { MobileDrawer, MobileDrawerContent, MobileDrawerHeader, MobileDrawerTitle, MobileDrawerDescription, MobileDrawerBody, MobileDrawerFooter } from '@/components/ui/mobile-drawer';
import { MobileButtonGroup } from '@/components/ui/mobile-button-group';
import { MobileCollapsibleSection } from '@/components/character/mobile/MobileCollapsibleSection';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  useGuerreiroTrack,
  GUERREIRO_ABILITIES,
  type UseGuerreiroTrackProps,
  type ManeuverType,
} from './useGuerreiroTrack';

// =====================================================
// Props do Componente
// =====================================================

export interface GuerreiroPanelProps extends UseGuerreiroTrackProps {
  className?: string;
}

// =====================================================
// Componentes Internos Compartilhados
// =====================================================

/** Card de passivas */
function PassivesCard({ passives }: { passives: Array<{ name: string; shortEffect: string }> }) {
  if (passives.length === 0) return null;

  return (
    <div className="p-2 rounded-lg bg-muted/30 border border-border/30 mb-2">
      <div className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
        <Check className="w-3 h-3 text-green-500" />
        Passivas (automatizadas)
      </div>
      {passives.map((passive, idx) => (
        <div key={idx} className="text-[10px] text-muted-foreground">
          <span className="text-foreground">{passive.name}</span>
          {' — '}{passive.shortEffect}
        </div>
      ))}
    </div>
  );
}

/** Opções de manobra para Força Opressora */
function ManeuverOptions({
  selectedManeuver,
  onSelect,
  isMobile,
}: {
  selectedManeuver: ManeuverType | null;
  onSelect: (maneuver: ManeuverType) => void;
  isMobile: boolean;
}) {
  const options = GUERREIRO_ABILITIES.find(a => a.id === 'forca-opressora')?.options || [];
  const icons: Record<string, React.ReactNode> = {
    derrubar: <ArrowDownToLine className="w-4 h-4" />,
    empurrar: <MoveHorizontal className="w-4 h-4" />,
  };

  return (
    <div className={cn('space-y-3', isMobile && 'space-y-2')}>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id as ManeuverType)}
          className={cn(
            'w-full p-3 rounded-lg border-2 text-left transition-all',
            selectedManeuver === opt.id
              ? 'border-orange-500 bg-orange-500/10'
              : 'border-border hover:border-orange-500/50'
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            {icons[opt.id]}
            <span className="font-medium">{opt.name}</span>
          </div>
          <p className="text-xs text-muted-foreground">{opt.description}</p>
        </button>
      ))}
    </div>
  );
}

// =====================================================
// Componente Principal
// =====================================================

import React from 'react';

/**
 * Comparação customizada para evitar re-renders desnecessários.
 * Ignora peCurrent pois mudanças de PE não afetam a estrutura do painel.
 */
function arePropsEqual(prev: GuerreiroPanelProps, next: GuerreiroPanelProps): boolean {
  return (
    prev.classTrack === next.classTrack &&
    prev.nex === next.nex &&
    prev.className === next.className &&
    prev.onPEChange === next.onPEChange &&
    prev.onActivateEffect === next.onActivateEffect
  );
}

function GuerreiroPanelComponent(props: GuerreiroPanelProps) {
  const isMobile = useIsMobile();
  const { className, peCurrent } = props;

  const {
    isGuerreiro,
    isOpen,
    setIsOpen,
    activatingAbility,
    forcaOpressoraModalOpen,
    setForcaOpressoraModalOpen,
    selectedManeuver,
    setSelectedManeuver,
    unlockedAbilities,
    unlockedPassives,
    handleUseRevidar,
    handleOpenForcaOpressora,
    handleConfirmForcaOpressora,
    canAfford,
  } = useGuerreiroTrack(props);

  // Não renderiza se não for Guerreiro
  if (!isGuerreiro) return null;

  // Se só tem passivas
  if (unlockedAbilities.length === 0 && unlockedPassives.length > 0) {
    if (isMobile) {
      return (
        <MobileCollapsibleSection
          title="Guerreiro (Passivo)"
          icon={<Sword className="w-4 h-4 text-orange-500" />}
        >
          <PassivesCard passives={unlockedPassives} />
        </MobileCollapsibleSection>
      );
    }

    return (
      <Card className={cn('border-orange-500/30 bg-orange-500/5', className)}>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sword className="w-4 h-4 text-orange-500" />
            <span className="font-display tracking-wider uppercase">Guerreiro</span>
            <Badge variant="outline" className="text-[10px] ml-1 border-orange-500/50 text-orange-500">
              Passivo
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <PassivesCard passives={unlockedPassives} />
        </CardContent>
      </Card>
    );
  }

  // Se não tem nenhuma habilidade
  if (unlockedAbilities.length === 0) return null;

  // ===== RENDER MOBILE =====
  if (isMobile) {
    return (
      <>
        <MobileCollapsibleSection
          title="Guerreiro"
          icon={<Sword className="w-4 h-4 text-orange-500" />}
          badge={unlockedAbilities.length}
        >
          <div className="space-y-2 p-2">
            <PassivesCard passives={unlockedPassives} />

            {unlockedAbilities.map((ability) => {
              const isActivating = activatingAbility === ability.id;
              const affordable = canAfford(ability.peCost);

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
                      <p className="text-[10px] text-muted-foreground truncate">
                        {ability.shortEffect}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-paranormal flex items-center gap-0.5">
                        <Zap className="w-3 h-3" /> {ability.peCost}
                      </span>
                      <Button
                        size="sm"
                        className="h-6 text-[10px] px-2 bg-orange-600 hover:bg-orange-700"
                        disabled={!affordable || isActivating}
                        onClick={() => {
                          if (ability.id === 'revidar') handleUseRevidar();
                          else handleOpenForcaOpressora();
                        }}
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

        {/* Drawer para Força Opressora */}
        <MobileDrawer open={forcaOpressoraModalOpen} onOpenChange={setForcaOpressoraModalOpen}>
          <MobileDrawerContent maxHeight="md">
            <MobileDrawerHeader>
              <MobileDrawerTitle className="flex items-center gap-2">
                <Sword className="w-5 h-5 text-orange-500" />
                Força Opressora
              </MobileDrawerTitle>
              <MobileDrawerDescription>Escolha a manobra</MobileDrawerDescription>
            </MobileDrawerHeader>

            <MobileDrawerBody useScrollArea={false}>
              <ManeuverOptions
                selectedManeuver={selectedManeuver}
                onSelect={setSelectedManeuver}
                isMobile={true}
              />
            </MobileDrawerBody>

            <MobileDrawerFooter>
              {selectedManeuver === 'derrubar' ? (
                <MobileButtonGroup
                  buttons={[
                    {
                      id: 'knockdown',
                      label: 'Derrubar (1 PE)',
                      onClick: () => handleConfirmForcaOpressora(false),
                      variant: 'secondary',
                      type: 'secondary',
                      disabled: !canAfford(1),
                    },
                    {
                      id: 'knockdown-attack',
                      label: '+ Atacar (2 PE)',
                      onClick: () => handleConfirmForcaOpressora(true),
                      type: 'primary',
                      disabled: !canAfford(2),
                      className: 'bg-orange-600 hover:bg-orange-700',
                    },
                  ]}
                  layout="row"
                />
              ) : (
                <MobileButtonGroup
                  buttons={[
                    {
                      id: 'push',
                      label: 'Empurrar (1 PE)',
                      onClick: () => handleConfirmForcaOpressora(false),
                      type: 'primary',
                      disabled: !selectedManeuver || !canAfford(1),
                      className: 'bg-orange-600 hover:bg-orange-700',
                    },
                  ]}
                />
              )}
            </MobileDrawerFooter>
          </MobileDrawerContent>
        </MobileDrawer>
      </>
    );
  }

  // ===== RENDER DESKTOP =====
  return (
    <>
      <Card className={cn('border-orange-500/30 bg-orange-500/5', className)}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-orange-500/10 transition-colors py-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Sword className="w-4 h-4 text-orange-500" />
                  <span className="font-display tracking-wider uppercase">Guerreiro</span>
                  <Badge variant="outline" className="text-[10px] ml-1 border-orange-500/50 text-orange-500">
                    {unlockedAbilities.length} habilidades
                  </Badge>
                </div>
                <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-3 space-y-2">
              <PassivesCard passives={unlockedPassives} />

              {unlockedAbilities.map((ability) => {
                const isActivating = activatingAbility === ability.id;
                const affordable = canAfford(ability.peCost);
                const isDisabled = !affordable || isActivating;

                return (
                  <div
                    key={ability.id}
                    className="p-3 rounded-lg border transition-all bg-card/50 border-border/50 hover:border-orange-500/50"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
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
                          <p className="text-[10px] text-orange-500 mt-0.5 italic">⚡ {ability.trigger}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ability.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-paranormal" />
                          {ability.peCost} PE
                        </span>
                        {ability.followUp && (
                          <>
                            <span>•</span>
                            <span className="text-orange-500">+{ability.followUp.peCost} PE extra ataque</span>
                          </>
                        )}
                      </div>

                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1 bg-orange-600 hover:bg-orange-700"
                        disabled={isDisabled}
                        onClick={() => {
                          if (ability.id === 'revidar') handleUseRevidar();
                          else handleOpenForcaOpressora();
                        }}
                      >
                        {isActivating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Usar'}
                      </Button>
                    </div>
                  </div>
                );
              })}

              <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/30">
                Use essas habilidades após bloquear ou acertar um ataque corpo a corpo.
              </p>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Modal para Força Opressora */}
      <Dialog open={forcaOpressoraModalOpen} onOpenChange={setForcaOpressoraModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sword className="w-5 h-5 text-orange-500" />
              Força Opressora
            </DialogTitle>
            <DialogDescription>Escolha a manobra que deseja realizar.</DialogDescription>
          </DialogHeader>

          <ManeuverOptions
            selectedManeuver={selectedManeuver}
            onSelect={setSelectedManeuver}
            isMobile={false}
          />

          <DialogFooter className="flex gap-2 sm:gap-0">
            {selectedManeuver === 'derrubar' ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => handleConfirmForcaOpressora(false)}
                  disabled={!canAfford(1)}
                >
                  Derrubar (1 PE)
                </Button>
                <Button
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={() => handleConfirmForcaOpressora(true)}
                  disabled={!canAfford(2)}
                >
                  Derrubar + Atacar (2 PE)
                </Button>
              </>
            ) : (
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => handleConfirmForcaOpressora(false)}
                disabled={!selectedManeuver || !canAfford(1)}
              >
                Empurrar (1 PE)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Componente exportado com memoização para otimização de performance */
export const GuerreiroPanel = React.memo(GuerreiroPanelComponent, arePropsEqual);
