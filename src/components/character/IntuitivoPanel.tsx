/**
 * IntuitivoPanel - Painel para habilidades da trilha Intuitivo
 * 
 * Habilidades (todas passivas):
 * - Mente Sã (NEX 10%): Resistência paranormal +5
 * - Presença Poderosa (NEX 40%): +PE limit à Presença para rituais
 * - Inabalável (NEX 65%): RD Mental 10 + teste Vontade
 * - Presença do Medo (NEX 99%): Aprende o ritual
 */

import { useState, useMemo } from 'react';
import { Brain, Check, ChevronDown, Shield, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const INTUITIVO_ABILITIES = [
  { 
    id: 'mente-sa',
    name: 'Mente Sã', 
    minNex: 10, 
    effect: 'Resistência paranormal +5 (testes contra efeitos paranormais)',
    icon: Shield,
    highlight: '+5 Resistência',
  },
  { 
    id: 'presenca-poderosa',
    name: 'Presença Poderosa', 
    minNex: 40, 
    effect: 'Soma limite de PE/turno à Presença para efeitos de rituais (não afeta DT)',
    icon: Sparkles,
  },
  { 
    id: 'inabalavel',
    name: 'Inabalável', 
    minNex: 65, 
    effect: 'RD Mental 10. Teste Vontade: sucesso = sem dano, falha = metade.',
    icon: Shield,
    highlight: 'RD Mental 10',
  },
  { 
    id: 'presenca-do-medo',
    name: 'Presença do Medo', 
    minNex: 99, 
    effect: 'Aprende o ritual Presença do Medo',
    icon: Brain,
  },
];

interface IntutivoPanelProps {
  classTrack: string | null | undefined;
  nex: number;
  presence?: number;
  peLimitPerTurn?: number;
  className?: string;
}

export function IntuitivoPanel({
  classTrack,
  nex,
  presence = 1,
  peLimitPerTurn = 2,
  className,
}: IntutivoPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Verifica se é trilha Intuitivo
  const isIntuitivo = useMemo(() => {
    if (!classTrack) return false;
    return classTrack.toLowerCase().includes('intuitivo');
  }, [classTrack]);

  // Habilidades desbloqueadas
  const unlockedAbilities = useMemo(() => {
    return INTUITIVO_ABILITIES.filter(a => nex >= a.minNex);
  }, [nex]);

  // Cálculo do bônus de Presença Poderosa
  const presencaPoderosaBonuses = useMemo(() => {
    if (nex < 40) return null;
    return {
      base: presence,
      bonus: peLimitPerTurn,
      total: presence + peLimitPerTurn,
    };
  }, [nex, presence, peLimitPerTurn]);

  if (!isIntuitivo) return null;

  return (
    <Card className={cn('border-cyan-500/30 bg-cyan-500/5', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-cyan-500/10 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-cyan-500" />
                <span className="font-display tracking-wider uppercase">
                  Intuitivo
                </span>
                <Badge variant="outline" className="text-[10px] ml-1 border-cyan-500/50 text-cyan-500">
                  Resistência
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
            {/* Resumo de bônus */}
            {nex >= 10 && (
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-cyan-400">Bônus Ativos</span>
                  <div className="flex gap-2">
                    <Badge className="bg-cyan-600 text-[10px]">
                      +5 Res. Paranormal
                    </Badge>
                    {nex >= 65 && (
                      <Badge className="bg-cyan-600 text-[10px]">
                        RD Mental 10
                      </Badge>
                    )}
                  </div>
                </div>
                {presencaPoderosaBonuses && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Presença para rituais: {presencaPoderosaBonuses.base} + {presencaPoderosaBonuses.bonus} = {presencaPoderosaBonuses.total}
                  </p>
                )}
              </div>
            )}

            {/* Habilidades */}
            {unlockedAbilities.map((ability) => {
              const Icon = ability.icon;
              
              return (
                <div 
                  key={ability.id} 
                  className="p-3 rounded-lg border bg-card/50 border-border/50"
                >
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded bg-cyan-500/20">
                      <Icon className="w-4 h-4 text-cyan-500" />
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
                        {ability.highlight && (
                          <Badge className="bg-cyan-600 text-[9px]">
                            {ability.highlight}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ability.effect}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Dica */}
            <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/30">
              Foco em resistência mental e poder paranormal defensivo.
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
