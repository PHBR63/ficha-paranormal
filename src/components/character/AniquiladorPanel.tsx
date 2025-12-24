/**
 * AniquiladorPanel - Painel para habilidades ativas da trilha Aniquilador
 * 
 * Exibe e permite ativar as habilidades da trilha Aniquilador:
 * - A Favorita (NEX 10%): Passivo - redução de categoria I
 * - Técnica Secreta (NEX 40%): 2 PE - efeitos Amplo/Destruidor
 * - Técnica Sublime (NEX 65%): 2 PE - efeitos Letal/Perfurante
 * - Máquina de Matar (NEX 99%): Passivo - redução III, +2 margem, +1 dado
 */

import { useState, useMemo, useCallback } from 'react';
import { Crosshair, Target, Zap, ChevronDown, Check, Loader2, Plus } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { EffectDuration } from '@/hooks/useActivatedEffects';

// Efeitos da Técnica Secreta/Sublime
interface TechniqueEffect {
  id: string;
  name: string;
  description: string;
  peCost: number;
  minNex: number; // 40 = Técnica Secreta, 65 = Técnica Sublime
  stackable?: boolean;
  maxStacks?: number;
}

const TECHNIQUE_EFFECTS: TechniqueEffect[] = [
  // Técnica Secreta (NEX 40%)
  {
    id: 'amplo',
    name: 'Amplo',
    description: 'Ataque atinge um alvo adicional adjacente ao original',
    peCost: 2,
    minNex: 40,
  },
  {
    id: 'destruidor',
    name: 'Destruidor',
    description: 'Aumenta o multiplicador de crítico em +1',
    peCost: 2,
    minNex: 40,
  },
  // Técnica Sublime (NEX 65%)
  {
    id: 'letal',
    name: 'Letal',
    description: 'Aumenta margem de ameaça em +2 (2x = +5)',
    peCost: 2,
    minNex: 65,
    stackable: true,
    maxStacks: 2,
  },
  {
    id: 'perfurante',
    name: 'Perfurante',
    description: 'Ignora até 5 pontos de resistência a dano',
    peCost: 2,
    minNex: 65,
  },
];

// Passivas da trilha
const PASSIVE_INFO = [
  { name: 'A Favorita', minNex: 10, effect: 'Categoria da arma favorita reduzida em I' },
  { name: 'Técnica Secreta', minNex: 40, effect: 'Categoria reduzida em II' },
  { name: 'Máquina de Matar', minNex: 99, effect: 'Categoria III, +2 margem, +1 dado de dano' },
];

// IDs de efeitos para o SUE
const ANIQUILADOR_EFFECT_IDS = {
  TECNICA_AMPLO: 'track-tecnica-amplo',
  TECNICA_DESTRUIDOR: 'track-tecnica-destruidor',
  TECNICA_LETAL: 'track-tecnica-letal',
  TECNICA_PERFURANTE: 'track-tecnica-perfurante',
} as const;

interface AniquiladorPanelProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  className?: string;
  /** Callback para ativar efeito no SUE */
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  /** Verifica se um efeito está ativo */
  isEffectActive?: (id: string) => boolean;
}

export function AniquiladorPanel({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  className,
  onActivateEffect,
  isEffectActive,
}: AniquiladorPanelProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  
  // Modal para seleção de técnicas
  const [techniqueModalOpen, setTechniqueModalOpen] = useState(false);
  const [selectedEffects, setSelectedEffects] = useState<Record<string, number>>({});

  // Verifica se é trilha Aniquilador
  const isAniquilador = useMemo(() => {
    if (!classTrack) return false;
    const trackNorm = classTrack.toLowerCase().replace(/\s+/g, '-');
    return trackNorm.includes('aniquilador');
  }, [classTrack]);

  // Efeitos disponíveis pelo NEX
  const availableEffects = useMemo(() => {
    return TECHNIQUE_EFFECTS.filter(e => nex >= e.minNex);
  }, [nex]);

  // Passivas desbloqueadas
  const passiveAbilities = useMemo(() => {
    return PASSIVE_INFO.filter(p => nex >= p.minNex);
  }, [nex]);

  // Tem acesso a técnicas ativáveis?
  const hasTechniques = nex >= 40;

  // Calcula custo total das técnicas selecionadas
  const totalCost = useMemo(() => {
    return Object.entries(selectedEffects).reduce((sum, [id, count]) => {
      const effect = TECHNIQUE_EFFECTS.find(e => e.id === id);
      return sum + (effect ? effect.peCost * count : 0);
    }, 0);
  }, [selectedEffects]);

  // Toggle de efeito selecionado
  const toggleEffect = useCallback((effectId: string) => {
    setSelectedEffects(prev => {
      const effect = TECHNIQUE_EFFECTS.find(e => e.id === effectId);
      const currentCount = prev[effectId] || 0;
      
      if (effect?.stackable && effect.maxStacks) {
        // Efeito empilhável: cicla 0 -> 1 -> 2 -> 0
        const nextCount = (currentCount + 1) % (effect.maxStacks + 1);
        if (nextCount === 0) {
          const { [effectId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [effectId]: nextCount };
      }
      
      // Efeito normal: toggle on/off
      if (currentCount > 0) {
        const { [effectId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [effectId]: 1 };
    });
  }, []);

  // Confirmar ativação das técnicas
  const handleConfirmTechniques = useCallback(async () => {
    if (totalCost === 0) {
      toast({
        title: 'Nenhum efeito selecionado',
        variant: 'destructive',
      });
      return;
    }

    if (peCurrent < totalCost) {
      toast({
        title: 'PE insuficiente',
        description: `Você precisa de ${totalCost} PE.`,
        variant: 'destructive',
      });
      return;
    }

    setIsActivating(true);
    await new Promise(r => setTimeout(r, 300));

    const newPE = peCurrent - totalCost;
    onPEChange(newPE);

    // Registra cada efeito ativado no SUE
    const effectNames: string[] = [];
    Object.entries(selectedEffects).forEach(([id, count]) => {
      const effect = TECHNIQUE_EFFECTS.find(e => e.id === id);
      if (!effect) return;
      
      const effectId = `track-tecnica-${id}`;
      const stacks = count > 1 ? ` (${count}x)` : '';
      effectNames.push(`${effect.name}${stacks}`);
      
      onActivateEffect?.(effectId, effect.name, 'next-attack', { stacks: count });
    });

    toast({
      title: 'Técnicas Ativadas!',
      description: (
        <div className="flex flex-col gap-1">
          <span className="text-xs">{effectNames.join(', ')}</span>
          <span className="text-xs text-muted-foreground">
            -{totalCost} PE (restam {newPE})
          </span>
          <span className="text-xs text-primary mt-1">
            Efeitos aplicados ao próximo ataque com a arma favorita.
          </span>
        </div>
      ),
    });

    setIsActivating(false);
    setTechniqueModalOpen(false);
    setSelectedEffects({});
  }, [totalCost, peCurrent, onPEChange, selectedEffects, onActivateEffect, toast]);

  // Não renderiza se não for Aniquilador
  if (!isAniquilador) {
    return null;
  }

  // Se não tem habilidades ativas mas tem passivas
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
          {passiveAbilities.map((passive, idx) => (
            <div key={idx} className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{passive.name}:</span>{' '}
              {passive.effect}
            </div>
          ))}
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
              {passiveAbilities.length > 0 && (
                <div className="p-2 rounded-lg bg-muted/30 border border-border/30 mb-2">
                  <div className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
                    <Check className="w-3 h-3 text-green-500" />
                    Passivas
                  </div>
                  {passiveAbilities.map((passive, idx) => (
                    <div key={idx} className="text-[10px] text-muted-foreground">
                      <span className="text-foreground">{passive.name}</span> — {passive.effect}
                    </div>
                  ))}
                </div>
              )}

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
                      onClick={() => setTechniqueModalOpen(true)}
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

      {/* Modal de seleção de técnicas */}
      <Dialog open={techniqueModalOpen} onOpenChange={setTechniqueModalOpen}>
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

          <div className="space-y-3 py-4">
            {availableEffects.map((effect) => {
              const count = selectedEffects[effect.id] || 0;
              const isSelected = count > 0;

              return (
                <button
                  key={effect.id}
                  onClick={() => toggleEffect(effect.id)}
                  className={cn(
                    'w-full p-3 rounded-lg border-2 transition-all text-left',
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
                      <span className="font-medium">{effect.name}</span>
                      {effect.stackable && (
                        <Badge variant="outline" className="text-[9px]">
                          Empilhável
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {effect.stackable && count > 0 && (
                        <Badge className="bg-red-600 text-[10px]">{count}x</Badge>
                      )}
                      <span className="text-xs text-paranormal">{effect.peCost * (count || 1)} PE</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    {effect.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Resumo do custo */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
            <span className="text-sm font-medium">Custo Total:</span>
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-lg font-bold',
                totalCost > peCurrent ? 'text-destructive' : 'text-paranormal'
              )}>
                {totalCost} PE
              </span>
              <span className="text-xs text-muted-foreground">
                (você tem {peCurrent})
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setTechniqueModalOpen(false);
                setSelectedEffects({});
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              disabled={totalCost === 0 || totalCost > peCurrent || isActivating}
              onClick={handleConfirmTechniques}
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
