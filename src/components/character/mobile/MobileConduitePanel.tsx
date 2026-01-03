/**
 * MobileConduitePanel - Versão mobile do painel Conduíte
 */

import { useState, useMemo, useCallback } from 'react';
import { Waves, Zap, Timer, ShieldX, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';

interface ConduiteAbility {
  id: string;
  name: string;
  minNex: number;
  peCost: number | 'variable';
  actionType: 'free' | 'reaction';
  shortEffect: string;
  trigger?: string;
}

const CONDUITE_ABILITIES: ConduiteAbility[] = [
  { id: 'ampliar-ritual', name: 'Ampliar Ritual', minNex: 10, peCost: 2, actionType: 'free', trigger: 'Ao conjurar', shortEffect: '+1 alcance ou 2x área' },
  { id: 'acelerar-ritual', name: 'Acelerar Ritual', minNex: 40, peCost: 4, actionType: 'free', trigger: '1x/rodada', shortEffect: 'Ação livre' },
  { id: 'anular-ritual', name: 'Anular Ritual', minNex: 65, peCost: 'variable', actionType: 'reaction', trigger: 'Alvo de ritual', shortEffect: 'Anula ritual' },
];

const PASSIVE_INFO = [
  { name: 'Canalizar o Medo', minNex: 99, effect: 'Ritual concedido' },
];

type EffectDuration = 'instant' | 'next-turn' | 'round' | 'scene';

interface MobileConduitePanelProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  onActivateEffect?: (id: string, name: string, duration?: EffectDuration) => void;
}

export function MobileConduitePanel({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  onActivateEffect,
}: MobileConduitePanelProps) {
  const { toast } = useToast();
  const [activatingAbility, setActivatingAbility] = useState<string | null>(null);

  const isConduite = useMemo(() => {
    if (!classTrack) return false;
    const trackNorm = classTrack.toLowerCase();
    return trackNorm.includes('conduit') || trackNorm.includes('conduíte') || trackNorm === 'condutor';
  }, [classTrack]);

  const unlockedAbilities = useMemo(() => CONDUITE_ABILITIES.filter(a => nex >= a.minNex), [nex]);
  const passives = useMemo(() => PASSIVE_INFO.filter(p => nex >= p.minNex), [nex]);

  const handleUseAbility = useCallback(async (ability: ConduiteAbility) => {
    if (ability.peCost === 'variable') {
      toast({ title: ability.name, description: 'Gaste PE = custo do ritual inimigo.' });
      return;
    }
    if (peCurrent < ability.peCost) {
      toast({ title: 'PE insuficiente', variant: 'destructive' });
      return;
    }

    setActivatingAbility(ability.id);
    await new Promise(r => setTimeout(r, 250));

    onPEChange(peCurrent - ability.peCost);
    onActivateEffect?.(`track-${ability.id}`, ability.name, 'instant');
    toast({ title: `${ability.name}!`, description: `-${ability.peCost} PE` });
    setActivatingAbility(null);
  }, [peCurrent, onPEChange, toast, onActivateEffect]);

  if (!isConduite) return null;

  return (
    <MobileCollapsibleSection
      title="Conduíte"
      icon={<Waves className="w-4 h-4 text-blue-500" />}
      badge={unlockedAbilities.length}
    >
      <div className="space-y-2 p-2">
        {passives.length > 0 && (
          <div className="p-2 rounded bg-muted/30 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1 text-green-500 font-medium mb-1">
              <Check className="w-3 h-3" /> Rituais
            </span>
            {passives.map((p, i) => <div key={i}>{p.name}</div>)}
          </div>
        )}

        {unlockedAbilities.map((ability) => {
          const isActivating = activatingAbility === ability.id;
          const canAfford = ability.peCost === 'variable' || peCurrent >= ability.peCost;

          return (
            <div key={ability.id} className="p-2 rounded-lg bg-card border border-border/50">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-xs">{ability.name}</span>
                    <Badge variant="outline" className={cn('text-[8px] px-1', ability.actionType === 'reaction' ? 'border-yellow-500/50 text-yellow-600' : 'border-green-500/50 text-green-600')}>
                      {ability.actionType === 'reaction' ? 'Reação' : 'Livre'}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{ability.shortEffect}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-paranormal flex items-center gap-0.5">
                    <Zap className="w-3 h-3" /> {ability.peCost === 'variable' ? '?' : ability.peCost}
                  </span>
                  <Button size="sm" className="h-6 text-[10px] px-2 bg-blue-600 hover:bg-blue-700" disabled={!canAfford || isActivating} onClick={() => handleUseAbility(ability)}>
                    {isActivating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Usar'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </MobileCollapsibleSection>
  );
}
