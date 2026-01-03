/**
 * LaminaParanormalPanel - Painel para habilidades da trilha Lâmina Paranormal
 * 
 * Habilidades:
 * - Lâmina Maldita (NEX 10%): Aprende Amaldiçoar Arma + modificador
 * - Gladiador Paranormal (NEX 40%): Passivo - PE temp ao acertar corpo a corpo
 * - Conjuração Marcial (NEX 65%): 2 PE - ataque extra após ritual
 * - Lâmina do Medo (NEX 99%): Aprende o ritual
 */

import { useState, useMemo, useCallback } from 'react';
import { Sword, Zap, Swords, Check, Loader2, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { EffectDuration } from '@/hooks/useActivatedEffects';

const PASSIVE_INFO = [
  { 
    name: 'Lâmina Maldita', 
    minNex: 10, 
    effect: 'Aprende Amaldiçoar Arma. +1 PE = ação movimento. Usa Ocultismo para ataque.' 
  },
  { 
    name: 'Gladiador Paranormal', 
    minNex: 40, 
    effect: 'Acerto corpo a corpo = +2 PE temp. Máx/cena = limite PE/turno.' 
  },
  { 
    name: 'Lâmina do Medo', 
    minNex: 99, 
    effect: 'Aprende o ritual Lâmina do Medo' 
  },
];

interface LaminaAbility {
  id: string;
  name: string;
  minNex: number;
  peCost: number;
  actionType: 'free';
  description: string;
  shortEffect: string;
  trigger: string;
}

const LAMINA_ABILITIES: LaminaAbility[] = [
  {
    id: 'conjuracao-marcial',
    name: 'Conjuração Marcial',
    minNex: 65,
    peCost: 2,
    actionType: 'free',
    trigger: '1x por rodada, após ritual de ação padrão',
    description: 'Uma vez por rodada, quando lança um ritual com execução de ação padrão, você pode gastar 2 PE para fazer um ataque corpo a corpo como ação livre.',
    shortEffect: 'Ataque corpo a corpo grátis após ritual',
  },
];

const LAMINA_EFFECT_IDS = {
  CONJURACAO_MARCIAL: 'track-conjuracao-marcial',
} as const;

interface LaminaParanormalPanelProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  onRequestAttack?: () => void;
  className?: string;
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
}

export function LaminaParanormalPanel({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  onRequestAttack,
  className,
  onActivateEffect,
}: LaminaParanormalPanelProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [activatingAbility, setActivatingAbility] = useState<string | null>(null);

  // Verifica se é trilha Lâmina Paranormal
  const isLamina = useMemo(() => {
    if (!classTrack) return false;
    const trackNorm = classTrack.toLowerCase().replace(/\s+/g, '-');
    return trackNorm.includes('lamina') || trackNorm.includes('lâmina');
  }, [classTrack]);

  // Habilidades desbloqueadas
  const unlockedAbilities = useMemo(() => {
    return LAMINA_ABILITIES.filter(a => nex >= a.minNex);
  }, [nex]);

  // Passivas desbloqueadas
  const passives = useMemo(() => {
    return PASSIVE_INFO.filter(p => nex >= p.minNex);
  }, [nex]);

  // Usar Conjuração Marcial
  const handleUseAbility = useCallback(async (ability: LaminaAbility) => {
    if (peCurrent < ability.peCost) {
      toast({ title: 'PE insuficiente', variant: 'destructive' });
      return;
    }

    setActivatingAbility(ability.id);
    await new Promise(r => setTimeout(r, 300));

    const newPE = peCurrent - ability.peCost;
    onPEChange(newPE);

    onActivateEffect?.(LAMINA_EFFECT_IDS.CONJURACAO_MARCIAL, ability.name, 'instant');

    toast({
      title: `${ability.name} ativado!`,
      description: `${ability.shortEffect}. -${ability.peCost} PE`,
    });

    setActivatingAbility(null);
    onRequestAttack?.();
  }, [peCurrent, onPEChange, toast, onActivateEffect, onRequestAttack]);

  if (!isLamina) return null;

  return (
    <Card className={cn('border-violet-500/30 bg-violet-500/5', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-violet-500/10 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Sword className="w-4 h-4 text-violet-500" />
                <span className="font-display tracking-wider uppercase">
                  Lâmina Paranormal
                </span>
                <Badge variant="outline" className="text-[10px] ml-1 border-violet-500/50 text-violet-500">
                  Híbrido
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
                  Passivas & Rituais
                </div>
                {passives.map((passive, idx) => (
                  <div key={idx} className="text-[10px] text-muted-foreground">
                    <span className="text-foreground">{passive.name}</span> — {passive.effect}
                  </div>
                ))}
              </div>
            )}

            {/* Gladiador Paranormal - Lembrete especial */}
            {nex >= 40 && (
              <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="text-xs font-medium text-violet-400">Gladiador Paranormal</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Ao acertar ataque corpo a corpo: <span className="text-violet-400">+2 PE temporários</span>
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
                  className="p-3 rounded-lg border bg-card/50 border-border/50 hover:border-violet-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{ability.name}</span>
                        <Badge 
                          variant="outline" 
                          className="text-[9px] px-1.5 border-green-500/50 text-green-600"
                        >
                          Livre
                        </Badge>
                      </div>
                      <p className="text-[10px] text-violet-500 mt-0.5 italic">
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
                        className="h-7 text-xs gap-1 bg-violet-600 hover:bg-violet-700"
                        disabled={!canAfford || isActivating}
                        onClick={() => handleUseAbility(ability)}
                      >
                        {isActivating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Swords className="w-3 h-3" />
                            Atacar
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
              Combine rituais e combate corpo a corpo com maestria.
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
