/**
 * MobileFlageladorPanel - Versão mobile do painel Flagelador
 */

import { useState, useMemo, useCallback } from 'react';
import { Flame, Zap, Heart, ShieldHalf, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';

const PASSIVE_INFO = [
  { name: 'Poder do Flagelo', minNex: 10, effect: 'PV como PE (1:1)' },
  { name: 'Absorver Angústia', minNex: 65, effect: '+PE temp ao matar' },
  { name: 'Medo Tangível', minNex: 99, effect: 'Ritual concedido' },
];

type EffectDuration = 'instant' | 'next-turn' | 'round' | 'scene';

interface MobileFlageladorPanelProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  onActivateEffect?: (id: string, name: string, duration?: EffectDuration) => void;
}

export function MobileFlageladorPanel({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  onActivateEffect,
}: MobileFlageladorPanelProps) {
  const { toast } = useToast();
  const [isActivating, setIsActivating] = useState(false);

  const isFlagelador = useMemo(() => classTrack?.toLowerCase().includes('flagelador') ?? false, [classTrack]);
  const passives = useMemo(() => PASSIVE_INFO.filter(p => nex >= p.minNex), [nex]);
  const hasAbracarDor = nex >= 40;

  const handleAbracarDor = useCallback(async () => {
    if (peCurrent < 2) {
      toast({ title: 'PE insuficiente', variant: 'destructive' });
      return;
    }

    setIsActivating(true);
    await new Promise(r => setTimeout(r, 250));

    onPEChange(peCurrent - 2);
    onActivateEffect?.('track-abracar-dor', 'Abraçar a Dor', 'instant');
    toast({ title: 'Abraçar a Dor!', description: 'Dano paranormal reduzido à metade. -2 PE' });
    setIsActivating(false);
  }, [peCurrent, onPEChange, toast, onActivateEffect]);

  if (!isFlagelador) return null;

  return (
    <MobileCollapsibleSection
      title="Flagelador"
      icon={<Flame className="w-4 h-4 text-red-600" />}
      badge={hasAbracarDor ? 1 : undefined}
    >
      <div className="space-y-2 p-2">
        {passives.length > 0 && (
          <div className="p-2 rounded bg-muted/30 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1 text-green-500 font-medium mb-1">
              <Check className="w-3 h-3" /> Passivas
            </span>
            {passives.map((p, i) => <div key={i}>{p.name}: {p.effect}</div>)}
          </div>
        )}

        {nex >= 10 && (
          <div className="p-2 rounded bg-red-900/20 border border-red-500/30">
            <div className="flex items-center gap-1.5 mb-1">
              <Heart className="w-3 h-3 text-red-500" />
              <span className="text-[10px] font-medium text-red-400">Poder do Flagelo</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Use PV no lugar de PE para rituais</p>
          </div>
        )}

        {hasAbracarDor && (
          <div className="p-2 rounded-lg bg-card border border-border/50">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-xs">Abraçar a Dor</span>
                  <Badge variant="outline" className="text-[8px] px-1 border-yellow-500/50 text-yellow-600">Reação</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">½ dano paranormal</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-paranormal flex items-center gap-0.5">
                  <Zap className="w-3 h-3" /> 2
                </span>
                <Button size="sm" className="h-6 text-[10px] px-2 bg-red-600 hover:bg-red-700" disabled={peCurrent < 2 || isActivating} onClick={handleAbracarDor}>
                  {isActivating ? <Loader2 className="w-3 h-3 animate-spin" /> : <><ShieldHalf className="w-3 h-3 mr-0.5" />Usar</>}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileCollapsibleSection>
  );
}
