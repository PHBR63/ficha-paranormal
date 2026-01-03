/**
 * FlageladorPanel - Painel para habilidades da trilha Flagelador
 * 
 * Habilidades:
 * - Poder do Flagelo (NEX 10%): Passivo - usa PV como PE
 * - Abraçar a Dor (NEX 40%): 2 PE - reduz dano paranormal à metade
 * - Absorver Angústia (NEX 65%): Passivo - PE temporários ao matar com ritual
 * - Medo Tangível (NEX 99%): Aprende o ritual
 */

import { useState, useMemo, useCallback } from 'react';
import { Flame, Zap, Heart, ShieldHalf, Check, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { EffectDuration } from '@/hooks/useActivatedEffects';

const PASSIVE_INFO = [
  { name: 'Poder do Flagelo', minNex: 10, effect: 'Use PV como PE (1:1). Só recupera com descanso.' },
  { name: 'Absorver Angústia', minNex: 65, effect: 'Ao matar com ritual: +PE temp = círculo' },
  { name: 'Medo Tangível', minNex: 99, effect: 'Aprende o ritual Medo Tangível' },
];

interface FlageladorAbility {
  id: string;
  name: string;
  minNex: number;
  peCost: number;
  actionType: 'reaction';
  description: string;
  shortEffect: string;
  trigger: string;
}

const FLAGELADOR_ABILITIES: FlageladorAbility[] = [
  {
    id: 'abracar-a-dor',
    name: 'Abraçar a Dor',
    minNex: 40,
    peCost: 2,
    actionType: 'reaction',
    trigger: 'Ao sofrer dano paranormal',
    description: 'Sempre que sofrer dano paranormal, você pode gastar uma reação e 2 PE para reduzir esse dano à metade.',
    shortEffect: 'Reduz dano paranormal à metade',
  },
];

const FLAGELADOR_EFFECT_IDS = {
  ABRACAR_DOR: 'track-abracar-dor',
} as const;

interface FlageladorPanelProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  className?: string;
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
}

export function FlageladorPanel({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  className,
  onActivateEffect,
}: FlageladorPanelProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [activatingAbility, setActivatingAbility] = useState<string | null>(null);

  // Verifica se é trilha Flagelador
  const isFlagelador = useMemo(() => {
    if (!classTrack) return false;
    return classTrack.toLowerCase().includes('flagelador');
  }, [classTrack]);

  // Habilidades desbloqueadas
  const unlockedAbilities = useMemo(() => {
    return FLAGELADOR_ABILITIES.filter(a => nex >= a.minNex);
  }, [nex]);

  // Passivas desbloqueadas
  const passives = useMemo(() => {
    return PASSIVE_INFO.filter(p => nex >= p.minNex);
  }, [nex]);

  // Usar Abraçar a Dor
  const handleUseAbility = useCallback(async (ability: FlageladorAbility) => {
    if (peCurrent < ability.peCost) {
      toast({ title: 'PE insuficiente', variant: 'destructive' });
      return;
    }

    setActivatingAbility(ability.id);
    await new Promise(r => setTimeout(r, 300));

    const newPE = peCurrent - ability.peCost;
    onPEChange(newPE);

    onActivateEffect?.(FLAGELADOR_EFFECT_IDS.ABRACAR_DOR, ability.name, 'instant');

    toast({
      title: `${ability.name} ativado!`,
      description: `${ability.shortEffect}. -${ability.peCost} PE`,
    });

    setActivatingAbility(null);
  }, [peCurrent, onPEChange, toast, onActivateEffect]);

  if (!isFlagelador) return null;

  return (
    <Card className={cn('border-red-600/30 bg-red-600/5', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-red-600/10 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-600" />
                <span className="font-display tracking-wider uppercase">
                  Flagelador
                </span>
                <Badge variant="outline" className="text-[10px] ml-1 border-red-600/50 text-red-600">
                  Sacrifício
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
            {/* Passivas */}
            {passives.length > 0 && (
              <div className="p-2 rounded-lg bg-muted/30 border border-border/30 mb-2">
                <div className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" />
                  Passivas
                </div>
                {passives.map((passive, idx) => (
                  <div key={idx} className="text-[10px] text-muted-foreground">
                    <span className="text-foreground">{passive.name}</span> — {passive.effect}
                  </div>
                ))}
              </div>
            )}

            {/* Poder do Flagelo - Dica especial */}
            {nex >= 10 && (
              <div className="p-2 rounded-lg bg-red-900/20 border border-red-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium text-red-400">Poder do Flagelo</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Ao conjurar rituais, você pode gastar PV no lugar de PE (1 PV = 1 PE).
                  <span className="text-red-400 block mt-0.5">⚠️ PV gastos só recuperam com descanso.</span>
                </p>
              </div>
            )}

            {/* Habilidades ativas */}
            {unlockedAbilities.map((ability) => {
              const isActivating = activatingAbility === ability.id;
              const canAfford = peCurrent >= ability.peCost;

              return (
                <div 
                  key={ability.id} 
                  className="p-3 rounded-lg border bg-card/50 border-border/50 hover:border-red-600/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{ability.name}</span>
                        <Badge 
                          variant="outline" 
                          className="text-[9px] px-1.5 border-yellow-500/50 text-yellow-600"
                        >
                          Reação
                        </Badge>
                      </div>
                      <p className="text-[10px] text-red-500 mt-0.5 italic">
                        ⚡ {ability.trigger}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ability.shortEffect}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-paranormal flex items-center gap-0.5">
                        <Zap className="w-3 h-3" />
                        {ability.peCost}
                      </span>
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs gap-1 bg-red-600 hover:bg-red-700"
                        disabled={!canAfford || isActivating}
                        onClick={() => handleUseAbility(ability)}
                      >
                        {isActivating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <ShieldHalf className="w-3 h-3" />
                            Usar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Dica */}
            <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/30">
              Transforme dor em poder. Sacrifique PV para rituais mais fortes.
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
