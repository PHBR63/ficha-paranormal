/**
 * MobileGraduadoPanel - Versão mobile do painel Graduado
 */

import { useMemo } from 'react';
import { BookOpen, Check, Sparkles, BookMarked } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';

const GRADUADO_ABILITIES = [
  { id: 'saber-ampliado', name: 'Saber Ampliado', minNex: 10, effect: '+1 ritual/círculo', icon: Sparkles },
  { id: 'grimorio', name: 'Grimório', minNex: 40, effect: 'Rituais extras = INT', icon: BookMarked },
  { id: 'rituais-eficientes', name: 'Rituais Eficientes', minNex: 65, effect: 'DT +5', icon: Sparkles },
  { id: 'conhecendo-medo', name: 'Conhecendo o Medo', minNex: 99, effect: 'Ritual', icon: BookOpen },
];

interface MobileGraduadoPanelProps {
  classTrack: string | null | undefined;
  nex: number;
  intellect?: number;
}

export function MobileGraduadoPanel({ classTrack, nex, intellect = 1 }: MobileGraduadoPanelProps) {
  const isGraduado = useMemo(() => classTrack?.toLowerCase().includes('graduado') ?? false, [classTrack]);
  const abilities = useMemo(() => GRADUADO_ABILITIES.filter(a => nex >= a.minNex), [nex]);

  if (!isGraduado || abilities.length === 0) return null;

  return (
    <MobileCollapsibleSection
      title="Graduado"
      icon={<BookOpen className="w-4 h-4 text-purple-500" />}
    >
      <div className="space-y-1.5 p-2">
        {abilities.map((ability) => {
          const Icon = ability.icon;
          return (
            <div key={ability.id} className="flex items-center gap-2 p-2 rounded bg-card border border-border/50">
              <Icon className="w-3 h-3 text-purple-500 flex-shrink-0" />
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
        {nex >= 40 && (
          <p className="text-[10px] text-purple-400 text-center pt-1">
            📚 Grimório: {intellect} rituais
          </p>
        )}
      </div>
    </MobileCollapsibleSection>
  );
}
