/**
 * OperacoesEspeciaisPanel - Componente unificado responsivo da trilha Operações Especiais
 * 
 * Renderiza UI otimizada para desktop ou mobile baseado em useIsMobile().
 * Utiliza useOperacoesEspeciaisTrack para lógica compartilhada.
 * 
 * @module tracks/combatente/OperacoesEspeciaisPanel
 */

import { Zap, Swords, Wind, ChevronDown, Hand, Footprints } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { MobileDrawer, MobileDrawerContent, MobileDrawerHeader, MobileDrawerTitle, MobileDrawerDescription, MobileDrawerBody } from '@/components/ui/mobile-drawer';
import { MobileCollapsibleSection } from '@/components/character/mobile/MobileCollapsibleSection';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  useOperacoesEspeciaisTrack,
  OPERACOES_ABILITIES,
  PASSIVE_ABILITIES,
  type UseOperacoesEspeciaisTrackProps,
  type SurtoChoice,
} from './useOperacoesEspeciaisTrack';

// =====================================================
// Props do Componente
// =====================================================

export interface OperacoesEspeciaisPanelProps extends UseOperacoesEspeciaisTrackProps {
  className?: string;
}

// =====================================================
// Componentes Internos
// =====================================================

/** Lista de passivas */
function PassivesList({ passives }: { passives: typeof PASSIVE_ABILITIES }) {
  if (passives.length === 0) return null;

  return (
    <>
      {passives.map((passive) => (
        <div
          key={passive.id}
          className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border/50"
        >
          <Zap className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium">{passive.name}</span>
            <p className="text-[10px] text-primary">{passive.effect}</p>
          </div>
          <Badge variant="secondary" className="text-[9px] shrink-0">
            Passivo
          </Badge>
        </div>
      ))}
    </>
  );
}

/** Botões de escolha do Surto de Adrenalina */
function SurtoChoiceButtons({
  onChoice,
  isMobile,
}: {
  onChoice: (choice: SurtoChoice) => void;
  isMobile: boolean;
}) {
  return (
    <div className={cn('grid gap-3', isMobile ? 'grid-cols-2' : 'grid-cols-2')}>
      <Button
        variant="outline"
        className="h-auto py-6 flex flex-col gap-2"
        onClick={() => onChoice('standard')}
      >
        <Hand className={cn('text-primary', isMobile ? 'w-8 h-8' : 'w-10 h-10')} />
        <span className="font-medium">Ação Padrão</span>
      </Button>

      <Button
        variant="outline"
        className="h-auto py-6 flex flex-col gap-2"
        onClick={() => onChoice('movement')}
      >
        <Footprints className={cn('text-primary', isMobile ? 'w-8 h-8' : 'w-10 h-10')} />
        <span className="font-medium">Movimento</span>
      </Button>
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
function arePropsEqual(prev: OperacoesEspeciaisPanelProps, next: OperacoesEspeciaisPanelProps): boolean {
  return (
    prev.classTrack === next.classTrack &&
    prev.nex === next.nex &&
    prev.className === next.className &&
    prev.onPEChange === next.onPEChange &&
    prev.onActivateEffect === next.onActivateEffect
  );
}

function OperacoesEspeciaisPanelComponent(props: OperacoesEspeciaisPanelProps) {
  const isMobile = useIsMobile();
  const { className, peCurrent } = props;

  const {
    isOperacoesEspeciais,
    isOpen,
    setIsOpen,
    showSurtoModal,
    setShowSurtoModal,
    unlockedAbilities,
    unlockedPassives,
    hasLocalUsage,
    handleUseAbility,
    handleSurtoChoice,
    resetRoundUsage,
    canAfford,
    isAbilityUsed,
  } = useOperacoesEspeciaisTrack(props);

  // Não renderiza se não for Operações Especiais
  if (!isOperacoesEspeciais || (unlockedAbilities.length === 0 && unlockedPassives.length === 0)) {
    return null;
  }

  // Ícones para habilidades
  const abilityIcons: Record<string, React.ReactNode> = {
    'ataque-extra': <Swords className="w-4 h-4" />,
    'surto-de-adrenalina': <Wind className="w-4 h-4" />,
  };

  // ===== RENDER MOBILE =====
  if (isMobile) {
    return (
      <>
        <MobileCollapsibleSection
          title="Operações Especiais"
          icon={<Zap className="w-4 h-4 text-primary" />}
          badge={`${unlockedAbilities.length + unlockedPassives.length}`}
          defaultOpen={true}
          className={className}
        >
          <div className="space-y-3">
            <PassivesList passives={unlockedPassives} />

            {unlockedAbilities.map((ability) => {
              const isUsed = ability.perRound ? isAbilityUsed(ability.id) : false;
              const affordable = canAfford(ability.peCost);

              return (
                <motion.div
                  key={ability.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-md border',
                    isUsed ? 'bg-muted/50 opacity-60' : 'bg-card'
                  )}
                >
                  <div className={cn('shrink-0', isUsed ? 'text-muted-foreground' : 'text-primary')}>
                    {abilityIcons[ability.id]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium">{ability.name}</span>
                      <Badge variant="outline" className="text-[9px]">
                        {ability.peCost} PE
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{ability.shortEffect}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isUsed ? 'outline' : 'default'}
                    disabled={isUsed || !affordable}
                    onClick={() => handleUseAbility(ability)}
                    className="h-7 text-[10px] px-2 shrink-0"
                  >
                    {isUsed ? 'Usada' : 'Usar'}
                  </Button>
                </motion.div>
              );
            })}

            {hasLocalUsage && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetRoundUsage}
                className="w-full text-xs h-7"
              >
                Nova Rodada
              </Button>
            )}
          </div>
        </MobileCollapsibleSection>

        {/* Drawer para Surto de Adrenalina */}
        <MobileDrawer open={showSurtoModal} onOpenChange={setShowSurtoModal}>
          <MobileDrawerContent maxHeight="sm">
            <MobileDrawerHeader>
              <MobileDrawerTitle className="flex items-center gap-2 justify-center">
                <Wind className="w-5 h-5 text-primary" />
                Surto de Adrenalina
              </MobileDrawerTitle>
              <MobileDrawerDescription className="text-center">
                Escolha o tipo de ação adicional
              </MobileDrawerDescription>
            </MobileDrawerHeader>

            <MobileDrawerBody useScrollArea={false}>
              <SurtoChoiceButtons onChoice={handleSurtoChoice} isMobile={true} />
              <p className="text-xs text-muted-foreground text-center pt-4">
                Custo: 5 PE
              </p>
            </MobileDrawerBody>
          </MobileDrawerContent>
        </MobileDrawer>
      </>
    );
  }

  // ===== RENDER DESKTOP =====
  return (
    <>
      <Card className={cn('border-primary/20 bg-card/50', className)}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="font-display tracking-wider uppercase">Operações Especiais</span>
                  <Badge variant="outline" className="text-[10px] ml-1">
                    {unlockedAbilities.length + unlockedPassives.length} habilidades
                  </Badge>
                </div>
                <ChevronDown
                  className={cn('w-4 h-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
                />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-3 space-y-2">
              <PassivesList passives={unlockedPassives} />

              {unlockedAbilities.map((ability) => {
                const isUsed = ability.perRound ? isAbilityUsed(ability.id) : false;
                const affordable = canAfford(ability.peCost);

                return (
                  <motion.div
                    key={ability.id}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'p-3 rounded-lg border transition-all',
                      isUsed
                        ? 'bg-muted/30 border-muted opacity-60'
                        : 'bg-card/50 border-border/50 hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{ability.name}</span>
                          <Badge variant="outline" className="text-[9px]">
                            {ability.peCost} PE
                          </Badge>
                          {ability.perRound && (
                            <Badge variant="secondary" className="text-[9px]">
                              1x/rodada
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{ability.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-2">
                      <Button
                        size="sm"
                        variant={isUsed ? 'ghost' : 'default'}
                        className="h-7 text-xs"
                        disabled={isUsed || !affordable}
                        onClick={() => handleUseAbility(ability)}
                      >
                        {isUsed ? 'Usada' : 'Usar'}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}

              {hasLocalUsage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetRoundUsage}
                  className="w-full text-xs"
                >
                  Nova Rodada
                </Button>
              )}

              <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/30">
                Ações extras para dominar o combate
              </p>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Modal para Surto de Adrenalina */}
      <Dialog open={showSurtoModal} onOpenChange={setShowSurtoModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-primary" />
              Surto de Adrenalina
            </DialogTitle>
            <DialogDescription>
              Escolha o tipo de ação adicional que deseja realizar.
            </DialogDescription>
          </DialogHeader>

          <SurtoChoiceButtons onChoice={handleSurtoChoice} isMobile={false} />

          <DialogFooter>
            <p className="text-xs text-muted-foreground w-full text-center">
              Custo: 5 PE
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Componente exportado com memoização para otimização de performance */
export const OperacoesEspeciaisPanel = React.memo(OperacoesEspeciaisPanelComponent, arePropsEqual);
