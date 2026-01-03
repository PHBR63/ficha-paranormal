/**
 * ConduitePanel - Painel para habilidades da trilha Conduíte
 * 
 * Habilidades ativas:
 * - Ampliar Ritual (NEX 10%): 2 PE - aumenta alcance/área
 * - Acelerar Ritual (NEX 40%): 4 PE - conjura como ação livre
 * - Anular Ritual (NEX 65%): PE variável - anula ritual inimigo
 * - Canalizar o Medo (NEX 99%): Aprende o ritual
 */

import { useState, useMemo, useCallback } from 'react';
import { Waves, Zap, Timer, ShieldX, Check, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { EffectDuration } from '@/hooks/useActivatedEffects';

// Definição das habilidades da trilha Conduíte
interface ConduiteAbility {
  id: string;
  name: string;
  minNex: number;
  peCost: number | 'variable';
  actionType: 'free' | 'reaction' | 'passive';
  description: string;
  shortEffect: string;
  trigger?: string;
  isPassive?: boolean;
}

const CONDUITE_ABILITIES: ConduiteAbility[] = [
  {
    id: 'ampliar-ritual',
    name: 'Ampliar Ritual',
    minNex: 10,
    peCost: 2,
    actionType: 'free',
    trigger: 'Ao conjurar ritual',
    description: 'Quando lança um ritual, você pode gastar 2 PE para aumentar seu alcance em um passo ou dobrar a área de efeito.',
    shortEffect: '+1 passo alcance ou 2x área',
  },
  {
    id: 'acelerar-ritual',
    name: 'Acelerar Ritual',
    minNex: 40,
    peCost: 4,
    actionType: 'free',
    trigger: '1x por rodada',
    description: 'Uma vez por rodada, você pode aumentar o custo de um ritual em 4 PE para conjurá-lo como ação livre.',
    shortEffect: 'Conjura como ação livre',
  },
  {
    id: 'anular-ritual',
    name: 'Anular Ritual',
    minNex: 65,
    peCost: 'variable',
    actionType: 'reaction',
    trigger: 'Ao ser alvo de ritual',
    description: 'Quando for alvo de um ritual, pode gastar PE igual ao custo do ritual e fazer teste oposto de Ocultismo para anulá-lo.',
    shortEffect: 'Anula ritual inimigo',
  },
];

const PASSIVE_INFO = [
  { name: 'Canalizar o Medo', minNex: 99, effect: 'Aprende o ritual Canalizar o Medo' },
];

// IDs de efeitos para o SUE
const CONDUITE_EFFECT_IDS = {
  AMPLIAR: 'track-ampliar-ritual',
  ACELERAR: 'track-acelerar-ritual',
  ANULAR: 'track-anular-ritual',
} as const;

interface ConduitePanelProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  className?: string;
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
}

export function ConduitePanel({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  className,
  onActivateEffect,
}: ConduitePanelProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [activatingAbility, setActivatingAbility] = useState<string | null>(null);

  // Verifica se é trilha Conduíte (ID: condutor)
  const isConduite = useMemo(() => {
    if (!classTrack) return false;
    const trackNorm = classTrack.toLowerCase().replace(/\s+/g, '-');
    return trackNorm.includes('conduit') || trackNorm.includes('conduíte') || trackNorm === 'condutor';
  }, [classTrack]);

  // Habilidades desbloqueadas
  const unlockedAbilities = useMemo(() => {
    return CONDUITE_ABILITIES.filter(a => nex >= a.minNex);
  }, [nex]);

  // Passivas desbloqueadas
  const passives = useMemo(() => {
    return PASSIVE_INFO.filter(p => nex >= p.minNex);
  }, [nex]);

  // Usar habilidade
  const handleUseAbility = useCallback(async (ability: ConduiteAbility) => {
    if (ability.peCost === 'variable') {
      toast({
        title: ability.name,
        description: 'Gaste PE igual ao custo do ritual inimigo e faça teste de Ocultismo.',
      });
      return;
    }

    if (peCurrent < ability.peCost) {
      toast({ title: 'PE insuficiente', variant: 'destructive' });
      return;
    }

    setActivatingAbility(ability.id);
    await new Promise(r => setTimeout(r, 300));

    const newPE = peCurrent - ability.peCost;
    onPEChange(newPE);

    const effectId = ability.id === 'ampliar-ritual' 
      ? CONDUITE_EFFECT_IDS.AMPLIAR 
      : CONDUITE_EFFECT_IDS.ACELERAR;
    
    onActivateEffect?.(effectId, ability.name, 'instant');

    toast({
      title: `${ability.name} ativado!`,
      description: `${ability.shortEffect}. -${ability.peCost} PE`,
    });

    setActivatingAbility(null);
  }, [peCurrent, onPEChange, toast, onActivateEffect]);

  if (!isConduite) return null;

  // Se só tem passivas ou habilidade inicial
  const hasActiveAbilities = unlockedAbilities.length > 0;

  return (
    <Card className={cn('border-blue-500/30 bg-blue-500/5', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-blue-500/10 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-blue-500" />
                <span className="font-display tracking-wider uppercase">
                  Conduíte
                </span>
                {hasActiveAbilities && (
                  <Badge variant="outline" className="text-[10px] ml-1 border-blue-500/50 text-blue-500">
                    {unlockedAbilities.length}
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
            {passives.length > 0 && (
              <div className="p-2 rounded-lg bg-muted/30 border border-border/30 mb-2">
                <div className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" />
                  Rituais Concedidos
                </div>
                {passives.map((passive, idx) => (
                  <div key={idx} className="text-[10px] text-muted-foreground">
                    <span className="text-foreground">{passive.name}</span> — {passive.effect}
                  </div>
                ))}
              </div>
            )}

            {/* Habilidades ativas */}
            {unlockedAbilities.map((ability) => {
              const isActivating = activatingAbility === ability.id;
              const canAfford = ability.peCost === 'variable' || peCurrent >= ability.peCost;

              return (
                <div 
                  key={ability.id} 
                  className="p-3 rounded-lg border bg-card/50 border-border/50 hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{ability.name}</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-[9px] px-1.5',
                            ability.actionType === 'reaction' 
                              ? 'border-yellow-500/50 text-yellow-600'
                              : ability.actionType === 'free'
                              ? 'border-green-500/50 text-green-600'
                              : 'border-gray-500/50 text-gray-600'
                          )}
                        >
                          {ability.actionType === 'reaction' ? 'Reação' : 
                           ability.actionType === 'free' ? 'Livre' : 'Passivo'}
                        </Badge>
                      </div>
                      {ability.trigger && (
                        <p className="text-[10px] text-blue-500 mt-0.5 italic">
                          ⚡ {ability.trigger}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {ability.shortEffect}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-paranormal flex items-center gap-0.5">
                        <Zap className="w-3 h-3" />
                        {ability.peCost === 'variable' ? '?' : ability.peCost}
                      </span>
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700"
                        disabled={!canAfford || isActivating}
                        onClick={() => handleUseAbility(ability)}
                      >
                        {isActivating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : ability.id === 'anular-ritual' ? (
                          <>
                            <ShieldX className="w-3 h-3" />
                            Anular
                          </>
                        ) : ability.id === 'acelerar-ritual' ? (
                          <>
                            <Timer className="w-3 h-3" />
                            Acelerar
                          </>
                        ) : (
                          'Usar'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Dica */}
            <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/30">
              Modifique seus rituais com alcance, velocidade e contra-mágica.
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
