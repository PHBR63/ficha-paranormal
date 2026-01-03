/**
 * MobileIntuitivoPanel - Versão mobile do painel Intuitivo
 */

import { useMemo } from 'react';
import { Brain, Check, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';

const INTUITIVO_ABILITIES = [
  { id: 'mente-sa', name: 'Mente Sã', minNex: 10, effect: '+5 Res. Paranormal', icon: Shield },
  { id: 'presenca-poderosa', name: 'Presença Poderosa', minNex: 40, effect: '+PE limit à PRE', icon: Brain },
  { id: 'inabalavel', name: 'Inabalável', minNex: 65, effect: 'RD Mental 10', icon: Shield },
  { id: 'presenca-medo', name: 'Presença do Medo', minNex: 99, effect: 'Ritual', icon: Brain },
];

interface MobileIntutivoPanelProps {
  classTrack: string | null | undefined;
  nex: number;
}

export function MobileIntuitivoPanel({ classTrack, nex }: MobileIntutivoPanelProps) {
  const isIntuitivo = useMemo(() => classTrack?.toLowerCase().includes('intuitivo') ?? false, [classTrack]);
  const abilities = useMemo(() => INTUITIVO_ABILITIES.filter(a => nex >= a.minNex), [nex]);

  if (!isIntuitivo || abilities.length === 0) return null;

  return (
    <MobileCollapsibleSection
      title="Intuitivo"
      icon={<Brain className="w-4 h-4 text-cyan-500" />}
    >
      <div className="space-y-1.5 p-2">
        {/* Resumo de bônus ativos */}
        <div className="flex flex-wrap gap-1 mb-2">
          {nex >= 10 && <Badge className="bg-cyan-600 text-[9px]">+5 Res. Paranormal</Badge>}
          {nex >= 65 && <Badge className="bg-cyan-600 text-[9px]">RD Mental 10</Badge>}
        </div>

        {abilities.map((ability) => {
          const Icon = ability.icon;
          return (
            <div key={ability.id} className="flex items-center gap-2 p-2 rounded bg-card border border-border/50">
              <Icon className="w-3 h-3 text-cyan-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium">{ability.name}</span>
                <span className="text-[10px] text-muted-foreground ml-1.5">{ability.effect}</span>
              </div>
              <Badge variant="outline" className="text-[8px] px-1 border-green-500/50 text-green-600">
                <Check className="w-2 h-2" />
              </Badge>
            </div>
          );
        })}
      </div>
    </MobileCollapsibleSection>
  );
}
