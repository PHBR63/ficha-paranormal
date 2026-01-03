/**
 * GraduadoPanel - Painel para habilidades da trilha Graduado
 * 
 * Habilidades (todas passivas):
 * - Saber Ampliado (NEX 10%): +1 ritual por círculo
 * - Grimório Ritualístico (NEX 40%): Armazena rituais extras
 * - Rituais Eficientes (NEX 65%): DT +5 nos seus rituais
 * - Conhecendo o Medo (NEX 99%): Aprende o ritual
 */

import { useState, useMemo } from 'react';
import { BookOpen, Check, ChevronDown, Sparkles, BookMarked } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const GRADUADO_ABILITIES = [
  { 
    id: 'saber-ampliado',
    name: 'Saber Ampliado', 
    minNex: 10, 
    effect: '+1 ritual de cada círculo (não conta no limite)',
    icon: Sparkles,
  },
  { 
    id: 'grimorio-ritualistico',
    name: 'Grimório Ritualístico', 
    minNex: 40, 
    effect: 'Armazena rituais 1º/2º círculo = INT. Ação completa para conjurar.',
    icon: BookMarked,
  },
  { 
    id: 'rituais-eficientes',
    name: 'Rituais Eficientes', 
    minNex: 65, 
    effect: 'DT dos seus rituais +5',
    icon: Sparkles,
  },
  { 
    id: 'conhecendo-o-medo',
    name: 'Conhecendo o Medo', 
    minNex: 99, 
    effect: 'Aprende o ritual Conhecendo o Medo',
    icon: BookOpen,
  },
];

interface GraduadoPanelProps {
  classTrack: string | null | undefined;
  nex: number;
  intellect?: number;
  className?: string;
}

export function GraduadoPanel({
  classTrack,
  nex,
  intellect = 1,
  className,
}: GraduadoPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Verifica se é trilha Graduado
  const isGraduado = useMemo(() => {
    if (!classTrack) return false;
    return classTrack.toLowerCase().includes('graduado');
  }, [classTrack]);

  // Habilidades desbloqueadas
  const unlockedAbilities = useMemo(() => {
    return GRADUADO_ABILITIES.filter(a => nex >= a.minNex);
  }, [nex]);

  if (!isGraduado) return null;

  return (
    <Card className={cn('border-purple-500/30 bg-purple-500/5', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-purple-500/10 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-500" />
                <span className="font-display tracking-wider uppercase">
                  Graduado
                </span>
                <Badge variant="outline" className="text-[10px] ml-1 border-purple-500/50 text-purple-500">
                  Conhecimento
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
            {/* Habilidades */}
            {unlockedAbilities.map((ability) => {
              const Icon = ability.icon;
              
              return (
                <div 
                  key={ability.id} 
                  className="p-3 rounded-lg border bg-card/50 border-border/50"
                >
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded bg-purple-500/20">
                      <Icon className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{ability.name}</span>
                        <Badge 
                          variant="outline" 
                          className="text-[9px] px-1.5 border-green-500/50 text-green-600"
                        >
                          <Check className="w-2 h-2 mr-0.5" />
                          Passivo
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ability.effect}
                      </p>
                      {ability.id === 'grimorio-ritualistico' && (
                        <p className="text-[10px] text-purple-400 mt-1">
                          📚 Capacidade do Grimório: {intellect} rituais
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Dica */}
            <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/30">
              Foco em conhecimento e versatilidade ritualística.
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
