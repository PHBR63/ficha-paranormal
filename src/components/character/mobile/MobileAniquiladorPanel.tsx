/**
 * MobileAniquiladorPanel - Versão mobile do painel de habilidades da trilha Aniquilador
 * 
 * Habilidades:
 * - A Favorita (NEX 10%): Passivo - redução de categoria I
 * - Técnica Secreta (NEX 40%): 2 PE - efeitos Amplo/Destruidor
 * - Técnica Sublime (NEX 65%): 2 PE - efeitos Letal/Perfurante
 * - Máquina de Matar (NEX 99%): Passivo - redução III, +2 margem, +1 dado
 */

import { useState, useMemo, useCallback } from 'react';
import { Crosshair, Target, Zap, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MobileDrawer, MobileDrawerContent, MobileDrawerHeader, MobileDrawerTitle, MobileDrawerFooter, MobileDrawerDescription, MobileDrawerBody } from '@/components/ui/mobile-drawer';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';

// Efeitos da Técnica Secreta/Sublime
interface TechniqueEffect {
  id: string;
  name: string;
  description: string;
  peCost: number;
  minNex: number;
  stackable?: boolean;
  maxStacks?: number;
}

const TECHNIQUE_EFFECTS: TechniqueEffect[] = [
  { id: 'amplo', name: 'Amplo', description: 'Atinge alvo adicional adjacente', peCost: 2, minNex: 40 },
  { id: 'destruidor', name: 'Destruidor', description: '+1 multiplicador crítico', peCost: 2, minNex: 40 },
  { id: 'letal', name: 'Letal', description: '+2 margem ameaça (2x = +5)', peCost: 2, minNex: 65, stackable: true, maxStacks: 2 },
  { id: 'perfurante', name: 'Perfurante', description: 'Ignora 5 resistência', peCost: 2, minNex: 65 },
];

// Passivas
const PASSIVE_INFO = [
  { name: 'A Favorita', minNex: 10, effect: 'Categoria -I' },
  { name: 'Técnica Secreta', minNex: 40, effect: 'Categoria -II' },
  { name: 'Máquina de Matar', minNex: 99, effect: 'Categoria -III, +2 margem, +1 dado' },
];

// IDs para SUE
const ANIQUILADOR_EFFECT_IDS = {
  TECNICA_AMPLO: 'track-tecnica-amplo',
  TECNICA_DESTRUIDOR: 'track-tecnica-destruidor',
  TECNICA_LETAL: 'track-tecnica-letal',
  TECNICA_PERFURANTE: 'track-tecnica-perfurante',
} as const;

type EffectDuration = 'instant' | 'next-turn' | 'round' | 'scene' | 'concentration' | 'next-attack';

interface MobileAniquiladorPanelProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  onActivateEffect?: (id: string, name: string, duration?: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
}

export function MobileAniquiladorPanel({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  onActivateEffect,
  isEffectActive,
}: MobileAniquiladorPanelProps) {
  const { toast } = useToast();
  const [isActivating, setIsActivating] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEffects, setSelectedEffects] = useState<Record<string, number>>({});

  // Verifica se é Aniquilador
  const isAniquilador = useMemo(() => {
    if (!classTrack) return false;
    return classTrack.toLowerCase().includes('aniquilador');
  }, [classTrack]);

  // Efeitos disponíveis
  const availableEffects = useMemo(() => {
    return TECHNIQUE_EFFECTS.filter(e => nex >= e.minNex);
  }, [nex]);

  // Passivas desbloqueadas
  const passives = useMemo(() => {
    return PASSIVE_INFO.filter(p => nex >= p.minNex);
  }, [nex]);

  const hasTechniques = nex >= 40;

  // Custo total
  const totalCost = useMemo(() => {
    return Object.entries(selectedEffects).reduce((sum, [id, count]) => {
      const effect = TECHNIQUE_EFFECTS.find(e => e.id === id);
      return sum + (effect ? effect.peCost * count : 0);
    }, 0);
  }, [selectedEffects]);

  // Toggle efeito
  const toggleEffect = useCallback((effectId: string) => {
    setSelectedEffects(prev => {
      const effect = TECHNIQUE_EFFECTS.find(e => e.id === effectId);
      const currentCount = prev[effectId] || 0;
      
      if (effect?.stackable && effect.maxStacks) {
        const nextCount = (currentCount + 1) % (effect.maxStacks + 1);
        if (nextCount === 0) {
          const { [effectId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [effectId]: nextCount };
      }
      
      if (currentCount > 0) {
        const { [effectId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [effectId]: 1 };
    });
  }, []);

  // Confirmar técnicas
  const handleConfirm = useCallback(async () => {
    if (totalCost === 0 || peCurrent < totalCost) {
      toast({ title: 'PE insuficiente', variant: 'destructive' });
      return;
    }

    setIsActivating(true);
    await new Promise(r => setTimeout(r, 300));

    const newPE = peCurrent - totalCost;
    onPEChange(newPE);

    const effectNames: string[] = [];
    Object.entries(selectedEffects).forEach(([id, count]) => {
      const effect = TECHNIQUE_EFFECTS.find(e => e.id === id);
      if (!effect) return;
      
      const stacks = count > 1 ? ` (${count}x)` : '';
      effectNames.push(`${effect.name}${stacks}`);
      
      onActivateEffect?.(`track-tecnica-${id}`, effect.name, 'next-attack', { stacks: count });
    });

    toast({
      title: 'Técnicas Ativadas!',
      description: `${effectNames.join(', ')}. -${totalCost} PE`,
    });

    setIsActivating(false);
    setDrawerOpen(false);
    setSelectedEffects({});
  }, [totalCost, peCurrent, onPEChange, selectedEffects, onActivateEffect, toast]);

  if (!isAniquilador) return null;

  // Só passivas
  if (!hasTechniques && passives.length > 0) {
    return (
      <MobileCollapsibleSection
        title="Aniquilador (Passivo)"
        icon={<Crosshair className="w-4 h-4 text-red-500" />}
      >
        <div className="space-y-1 p-2">
          {passives.map((p, i) => (
            <div key={i} className="text-[10px] text-muted-foreground">
              <span className="text-foreground font-medium">{p.name}:</span> {p.effect}
            </div>
          ))}
        </div>
      </MobileCollapsibleSection>
    );
  }

  return (
    <>
      <MobileCollapsibleSection
        title="Aniquilador"
        icon={<Crosshair className="w-4 h-4 text-red-500" />}
        badge={availableEffects.length}
      >
        <div className="space-y-2 p-2">
          {/* Passivas */}
          {passives.length > 0 && (
            <div className="p-2 rounded bg-muted/30 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1 text-green-500 font-medium mb-1">
                <Check className="w-3 h-3" /> Passivas
              </span>
              {passives.map((p, i) => (
                <div key={i}>{p.name}: {p.effect}</div>
              ))}
            </div>
          )}

          {/* Técnicas */}
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
                  onClick={() => setDrawerOpen(true)}
                >
                  <Target className="w-3 h-3 mr-1" />
                  Usar
                </Button>
              </div>
            </div>
          )}
        </div>
      </MobileCollapsibleSection>

      {/* Drawer de seleção */}
      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <MobileDrawerContent maxHeight="lg">
          <MobileDrawerHeader>
            <MobileDrawerTitle className="flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-red-500" />
              Técnicas do Aniquilador
            </MobileDrawerTitle>
            <MobileDrawerDescription>Selecione efeitos (2 PE cada)</MobileDrawerDescription>
          </MobileDrawerHeader>

          <MobileDrawerBody>
            <div className="space-y-2">
              {availableEffects.map((effect) => {
                const count = selectedEffects[effect.id] || 0;
                const isSelected = count > 0;

                return (
                  <button
                    key={effect.id}
                    onClick={() => toggleEffect(effect.id)}
                    className={cn(
                      'w-full p-3 rounded-lg border-2 text-left transition-all',
                      isSelected
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-border'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={isSelected} className="pointer-events-none" />
                        <span className="font-medium text-sm">{effect.name}</span>
                        {effect.stackable && count > 0 && (
                          <Badge className="bg-red-600 text-[10px]">{count}x</Badge>
                        )}
                      </div>
                      <span className="text-xs text-paranormal">{effect.peCost * (count || 1)} PE</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground pl-6 mt-1">
                      {effect.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Custo total */}
            <div className="py-2 border-t border-border/30 mt-4">
              <div className="flex items-center justify-between text-sm">
                <span>Custo Total:</span>
                <span className={cn(
                  'font-bold',
                  totalCost > peCurrent ? 'text-destructive' : 'text-paranormal'
                )}>
                  {totalCost} PE <span className="text-muted-foreground font-normal">(tem {peCurrent})</span>
                </span>
              </div>
            </div>
          </MobileDrawerBody>

          <MobileDrawerFooter>
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={totalCost === 0 || totalCost > peCurrent || isActivating}
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
          </MobileDrawerFooter>
        </MobileDrawerContent>
      </MobileDrawer>
    </>
  );
}
