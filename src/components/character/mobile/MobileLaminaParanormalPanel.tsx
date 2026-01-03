/**
 * MobileLaminaParanormalPanel - Versão mobile do painel Lâmina Paranormal
 */

import { useState, useMemo, useCallback } from 'react';
import { Sword, Zap, Swords, Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';

const PASSIVE_INFO = [
  { name: 'Lâmina Maldita', minNex: 10, effect: 'Amaldiçoar Arma + Ocultismo ataque' },
  { name: 'Gladiador Paranormal', minNex: 40, effect: '+2 PE temp ao acertar' },
  { name: 'Lâmina do Medo', minNex: 99, effect: 'Ritual concedido' },
];

type EffectDuration = 'instant' | 'next-turn' | 'round' | 'scene';

interface MobileLaminaParanormalPanelProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  onRequestAttack?: () => void;
  onActivateEffect?: (id: string, name: string, duration?: EffectDuration) => void;
}

export function MobileLaminaParanormalPanel({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  onRequestAttack,
  onActivateEffect,
}: MobileLaminaParanormalPanelProps) {
  const { toast } = useToast();
  const [isActivating, setIsActivating] = useState(false);

  const isLamina = useMemo(() => {
    if (!classTrack) return false;
    const norm = classTrack.toLowerCase();
    return norm.includes('lamina') || norm.includes('lâmina');
  }, [classTrack]);

  const passives = useMemo(() => PASSIVE_INFO.filter(p => nex >= p.minNex), [nex]);
  const hasConjuracaoMarcial = nex >= 65;

  const handleConjuracaoMarcial = useCallback(async () => {
    if (peCurrent < 2) {
      toast({ title: 'PE insuficiente', variant: 'destructive' });
      return;
    }

    setIsActivating(true);
    await new Promise(r => setTimeout(r, 250));

    onPEChange(peCurrent - 2);
    onActivateEffect?.('track-conjuracao-marcial', 'Conjuração Marcial', 'instant');
    toast({ title: 'Conjuração Marcial!', description: 'Ataque corpo a corpo liberado. -2 PE' });
    setIsActivating(false);
    onRequestAttack?.();
  }, [peCurrent, onPEChange, toast, onActivateEffect, onRequestAttack]);

  if (!isLamina) return null;

  return (
    <MobileCollapsibleSection
      title="Lâmina Paranormal"
      icon={<Sword className="w-4 h-4 text-violet-500" />}
      badge={hasConjuracaoMarcial ? 1 : undefined}
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

        {nex >= 40 && (
          <div className="p-2 rounded bg-violet-500/10 border border-violet-500/30">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3 text-violet-500" />
              <span className="text-[10px] font-medium text-violet-400">Gladiador</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Acerto corpo a corpo = +2 PE temp</p>
          </div>
        )}

        {hasConjuracaoMarcial && (
          <div className="p-2 rounded-lg bg-card border border-border/50">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-xs">Conjuração Marcial</span>
                  <Badge variant="outline" className="text-[8px] px-1 border-green-500/50 text-green-600">Livre</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">Ataque após ritual</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-paranormal flex items-center gap-0.5">
                  <Zap className="w-3 h-3" /> 2
                </span>
                <Button size="sm" className="h-6 text-[10px] px-2 bg-violet-600 hover:bg-violet-700" disabled={peCurrent < 2 || isActivating} onClick={handleConjuracaoMarcial}>
                  {isActivating ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Swords className="w-3 h-3 mr-0.5" />Atacar</>}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileCollapsibleSection>
  );
}
