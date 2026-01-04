/**
 * AniquiladorPanel - Componente unificado responsivo para trilha Aniquilador
 * 
 * Renderiza automaticamente a versão apropriada (desktop/mobile) baseado
 * no tamanho da tela usando o hook useMobile().
 * 
 * Habilidades da trilha (Livro Base v1.3):
 * - A Favorita (NEX 10%): Passivo - redução de categoria I
 * - Técnica Secreta (NEX 40%): 2 PE - efeitos Amplo/Destruidor
 * - Técnica Sublime (NEX 65%): 2 PE - efeitos Letal/Perfurante
 * - Máquina de Matar (NEX 99%): Passivo - redução III, +2 margem, +1 dado
 * 
 * @module tracks/combatente
 */

import { Crosshair, Target, Zap, ChevronDown, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  MobileDrawer, 
  MobileDrawerContent, 
  MobileDrawerHeader, 
  MobileDrawerTitle, 
  MobileDrawerFooter, 
  MobileDrawerDescription, 
  MobileDrawerBody 
} from '@/components/ui/mobile-drawer';
import { cn } from '@/lib/utils';
import { useIsMobile, type EffectDuration } from '@/hooks';
import { useState } from 'react';
import { 
  useAniquiladorTrack, 
  type TechniqueEffect,
  type PassiveAbility,
} from './useAniquiladorTrack';
import type { ComputedEffects } from '@/lib/unified-effects-engine';

// ==================== PROPS ====================

export interface AniquiladorPanelProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  className?: string;
  /** Callback para ativar efeito no SUE */
  onActivateEffect?: (
    id: string, 
    name: string, 
    duration: EffectDuration, 
    metadata?: Record<string, unknown>
  ) => void;
  /** Verifica se um efeito está ativo */
  isEffectActive?: (id: string) => boolean;
  /** Dados consolidados do SUE (opcional) */
  computedEffects?: ComputedEffects;
}

// ==================== COMPONENTES INTERNOS ====================

/** Cartão de passivas (compartilhado) */
function PassivesCard({ passives, compact = false }: { passives: PassiveAbility[]; compact?: boolean }) {
  if (passives.length === 0) return null;
  
  return (
    <div className={cn(
      'p-2 rounded-lg bg-muted/30 border border-border/30',
      compact ? 'text-[10px]' : 'text-xs'
    )}>
      <div className={cn(
        'text-muted-foreground font-medium mb-1 flex items-center gap-1',
        compact ? 'text-[10px]' : 'text-[10px]'
      )}>
        <Check className="w-3 h-3 text-green-500" />
        Passivas
      </div>
      {passives.map((passive, idx) => (
        <div key={idx} className="text-muted-foreground">
          <span className="text-foreground">{passive.name}</span> — {passive.effect}
        </div>
      ))}
    </div>
  );
}

/** Lista de efeitos selecionáveis (compartilhado) */
function EffectsList({
  effects,
  selectedEffects,
  onToggle,
  compact = false,
}: {
  effects: TechniqueEffect[];
  selectedEffects: Record<string, number>;
  onToggle: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-2">
      {effects.map((effect) => {
        const count = selectedEffects[effect.id] || 0;
        const isSelected = count > 0;

        return (
          <button
            key={effect.id}
            onClick={() => onToggle(effect.id)}
            className={cn(
              'w-full rounded-lg border-2 transition-all text-left',
              compact ? 'p-2' : 'p-3',
              isSelected
                ? 'border-red-500 bg-red-500/10'
                : 'border-border hover:border-red-500/50'
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={isSelected} 
                  className="pointer-events-none"
                />
                <span className={cn('font-medium', compact ? 'text-sm' : '')}>
                  {effect.name}
                </span>
                {effect.stackable && !compact && (
                  <Badge variant="outline" className="text-[9px]">
                    Empilhável
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {effect.stackable && count > 0 && (
                  <Badge className="bg-red-600 text-[10px]">{count}x</Badge>
                )}
                <span className="text-xs text-paranormal">
                  {effect.peCost * (count || 1)} PE
                </span>
              </div>
            </div>
            <p className={cn(
              'text-muted-foreground pl-6',
              compact ? 'text-[10px]' : 'text-xs'
            )}>
              {effect.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

/** Resumo de custo (compartilhado) */
function CostSummary({ 
  totalCost, 
  peCurrent, 
  compact = false 
}: { 
  totalCost: number; 
  peCurrent: number;
  compact?: boolean;
}) {
  return (
    <div className={cn(
      'flex items-center justify-between',
      compact ? 'py-2 border-t border-border/30' : 'p-3 rounded-lg bg-muted/30 border border-border/30'
    )}>
      <span className={cn('font-medium', compact ? 'text-sm' : 'text-sm')}>
        Custo Total:
      </span>
      <div className="flex items-center gap-2">
        <span className={cn(
          'font-bold',
          compact ? 'text-base' : 'text-lg',
          totalCost > peCurrent ? 'text-destructive' : 'text-paranormal'
        )}>
          {totalCost} PE
        </span>
        <span className="text-xs text-muted-foreground">
          (tem {peCurrent})
        </span>
      </div>
    </div>
  );
}

// ==================== COMPONENTE PRINCIPAL ====================

import React from 'react';

/**
 * Comparação customizada para evitar re-renders desnecessários.
 * Ignora peCurrent pois mudanças de PE não afetam a estrutura do painel.
 */
function arePropsEqual(prev: AniquiladorPanelProps, next: AniquiladorPanelProps): boolean {
  return (
    prev.classTrack === next.classTrack &&
    prev.nex === next.nex &&
    prev.className === next.className &&
    prev.onPEChange === next.onPEChange &&
    prev.onActivateEffect === next.onActivateEffect &&
    prev.isEffectActive === next.isEffectActive
  );
}

function AniquiladorPanelComponent({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  className,
  onActivateEffect,
  isEffectActive,
}: AniquiladorPanelProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(true);

  const {
    isAniquilador,
    isActivating,
    modalOpen,
    selectedEffects,
    availableEffects,
    passiveAbilities,
    hasTechniques,
    totalCost,
    canActivate,
    toggleEffect,
    handleConfirm,
    openModal,
    closeModal,
    setModalOpen,
  } = useAniquiladorTrack({
    classTrack,
    nex,
    peCurrent,
    onPEChange,
    onActivateEffect,
  });

  // Não renderiza se não for Aniquilador
  if (!isAniquilador) {
    return null;
  }

  // ==================== MOBILE ====================
  if (isMobile) {
    // Apenas passivas (NEX < 40%)
    if (!hasTechniques && passiveAbilities.length > 0) {
      return (
        <div className={cn('rounded-lg border border-red-500/30 bg-red-500/5', className)}>
          <div className="p-3 flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-red-500" />
            <span className="font-medium text-sm">Aniquilador</span>
            <Badge variant="outline" className="text-[10px] border-red-500/50 text-red-500">
              Passivo
            </Badge>
          </div>
          <div className="px-3 pb-3">
            <PassivesCard passives={passiveAbilities} compact />
          </div>
        </div>
      );
    }

    return (
      <>
        <div className={cn('rounded-lg border border-red-500/30 bg-red-500/5', className)}>
          <div className="p-3 space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-red-500" />
                <span className="font-medium text-sm">Aniquilador</span>
                {availableEffects.length > 0 && (
                  <Badge className="bg-red-600 text-[10px]">
                    {availableEffects.length}
                  </Badge>
                )}
              </div>
            </div>

            {/* Passivas */}
            <PassivesCard passives={passiveAbilities} compact />

            {/* Botão de técnicas */}
            {hasTechniques && (
              <div className="p-2 rounded-lg bg-card border border-border/50">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-xs">Técnicas Secretas</span>
                      <Badge 
                        variant="outline" 
                        className="text-[8px] px-1 border-green-500/50 text-green-600"
                      >
                        Livre
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {availableEffects.length} efeitos • 2 PE cada
                    </p>
                  </div>
                  
                  <Button
                    size="sm"
                    className="h-6 text-[10px] px-2 bg-red-600 hover:bg-red-700"
                    onClick={openModal}
                  >
                    <Target className="w-3 h-3 mr-1" />
                    Usar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Drawer */}
        <MobileDrawer open={modalOpen} onOpenChange={setModalOpen}>
          <MobileDrawerContent maxHeight="lg">
            <MobileDrawerHeader>
              <MobileDrawerTitle className="flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-red-500" />
                Técnicas do Aniquilador
              </MobileDrawerTitle>
              <MobileDrawerDescription>
                Selecione efeitos (2 PE cada)
              </MobileDrawerDescription>
            </MobileDrawerHeader>

            <MobileDrawerBody>
              <EffectsList
                effects={availableEffects}
                selectedEffects={selectedEffects}
                onToggle={toggleEffect}
                compact
              />
              <div className="mt-4">
                <CostSummary totalCost={totalCost} peCurrent={peCurrent} compact />
              </div>
            </MobileDrawerBody>

            <MobileDrawerFooter>
              <Button
                className="w-full h-12 bg-red-600 hover:bg-red-700"
                disabled={!canActivate || isActivating}
                onClick={handleConfirm}
              >
                {isActivating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-1.5" />
                    <span>Ativar ({totalCost} PE)</span>
                  </>
                )}
              </Button>
            </MobileDrawerFooter>
          </MobileDrawerContent>
        </MobileDrawer>
      </>
    );
  }

  // ==================== DESKTOP ====================
  
  // Apenas passivas (NEX < 40%)
  if (!hasTechniques && passiveAbilities.length > 0) {
    return (
      <Card className={cn('border-red-500/30 bg-red-500/5', className)}>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Crosshair className="w-4 h-4 text-red-500" />
            <span className="font-display tracking-wider uppercase">
              Aniquilador
            </span>
            <Badge variant="outline" className="text-[10px] ml-1 border-red-500/50 text-red-500">
              Passivo
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <PassivesCard passives={passiveAbilities} />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn('border-red-500/30 bg-red-500/5', className)}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-red-500/10 transition-colors py-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-red-500" />
                  <span className="font-display tracking-wider uppercase">
                    Aniquilador
                  </span>
                  {hasTechniques && (
                    <Badge variant="outline" className="text-[10px] ml-1 border-red-500/50 text-red-500">
                      Técnicas
                    </Badge>
                  )}
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
              <PassivesCard passives={passiveAbilities} />

              {/* Técnicas Ativáveis */}
              {hasTechniques && (
                <div className="p-3 rounded-lg border bg-card/50 border-border/50 hover:border-red-500/50 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">Técnicas Secretas</span>
                        <Badge 
                          variant="outline" 
                          className="text-[9px] px-1.5 border-green-500/50 text-green-600"
                        >
                          Livre
                        </Badge>
                      </div>
                      <p className="text-[10px] text-red-500 mt-0.5 italic">
                        ⚡ Ao atacar com arma favorita
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Combine efeitos gastando 2 PE cada.
                        {nex >= 65 && ' Inclui Letal e Perfurante.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-paranormal" />
                        2 PE/efeito
                      </span>
                      <span>•</span>
                      <span>{availableEffects.length} efeitos disponíveis</span>
                    </div>

                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-xs gap-1 bg-red-600 hover:bg-red-700"
                      onClick={openModal}
                    >
                      <Target className="w-3 h-3" />
                      Usar Técnica
                    </Button>
                  </div>
                </div>
              )}

              {/* Dica de uso */}
              <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/30">
                Use técnicas ao atacar com sua arma favorita.
              </p>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Desktop Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-red-500" />
              Técnicas do Aniquilador
            </DialogTitle>
            <DialogDescription>
              Selecione os efeitos para aplicar ao ataque. Custo: 2 PE por efeito.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <EffectsList
              effects={availableEffects}
              selectedEffects={selectedEffects}
              onToggle={toggleEffect}
            />
          </div>

          <CostSummary totalCost={totalCost} peCurrent={peCurrent} />

          <DialogFooter>
            <Button variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              disabled={!canActivate || isActivating}
              onClick={handleConfirm}
            >
              {isActivating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Target className="w-4 h-4 mr-1" />
                  Ativar ({totalCost} PE)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Componente exportado com memoização para otimização de performance */
export const AniquiladorPanel = React.memo(AniquiladorPanelComponent, arePropsEqual);
