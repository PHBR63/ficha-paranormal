/**
 * MobileLeadershipPanel - Versão mobile do painel de habilidades de liderança
 * 
 * Otimizado para telas pequenas com layout compacto e botões touch-friendly
 */

import { useState, useMemo, useCallback } from 'react';
import { Users, Zap, Crown, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';

// Definição das habilidades de Comandante de Campo
interface LeadershipAbility {
  id: string;
  name: string;
  minNex: number;
  peCost: number;
  actionType: 'reaction' | 'standard';
  range: 'short' | 'medium';
  shortEffect: string;
  maxAllies?: number | 'intellect';
  perRound?: boolean;
  costPerTarget?: boolean;
}

const COMANDANTE_ABILITIES: LeadershipAbility[] = [
  {
    id: 'inspirar-confianca',
    name: 'Inspirar Confiança',
    minNex: 10,
    peCost: 2,
    actionType: 'reaction',
    range: 'short',
    shortEffect: 'Aliado rerola teste',
    maxAllies: 1,
  },
  {
    id: 'estrategista',
    name: 'Estrategista',
    minNex: 40,
    peCost: 1,
    actionType: 'standard',
    range: 'short',
    shortEffect: '+1 movimento',
    maxAllies: 'intellect',
    costPerTarget: true,
  },
  {
    id: 'brecha-na-guarda',
    name: 'Brecha na Guarda',
    minNex: 65,
    peCost: 2,
    actionType: 'reaction',
    range: 'medium',
    shortEffect: 'Ataque extra',
    maxAllies: 1,
    perRound: true,
  },
  {
    id: 'oficial-comandante',
    name: 'Oficial Comandante',
    minNex: 99,
    peCost: 5,
    actionType: 'standard',
    range: 'medium',
    shortEffect: '+1 ação padrão',
  },
];

interface MobileLeadershipPanelProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  intellect: number;
  onPEChange: (newPE: number) => void;
  usedAbilitiesThisRound?: string[];
  onAbilityUsed?: (abilityId: string) => void;
}

export function MobileLeadershipPanel({
  classTrack,
  nex,
  peCurrent,
  intellect,
  onPEChange,
  usedAbilitiesThisRound = [],
  onAbilityUsed,
}: MobileLeadershipPanelProps) {
  const { toast } = useToast();
  const [activatingAbility, setActivatingAbility] = useState<string | null>(null);

  // Verifica se é trilha Comandante de Campo
  const isComandanteCampo = useMemo(() => {
    if (!classTrack) return false;
    const trackNorm = classTrack.toLowerCase().replace(/\s+/g, '-');
    return trackNorm.includes('comandante') || trackNorm === 'comandante-campo';
  }, [classTrack]);

  // Filtra habilidades desbloqueadas pelo NEX
  const unlockedAbilities = useMemo(() => {
    if (!isComandanteCampo) return [];
    return COMANDANTE_ABILITIES.filter(a => nex >= a.minNex);
  }, [isComandanteCampo, nex]);

  // Máximo de aliados para Estrategista
  const maxAlliesForEstrategista = Math.max(1, intellect);

  // Handler para usar habilidade
  const handleUseAbility = useCallback(async (ability: LeadershipAbility) => {
    if (ability.perRound && usedAbilitiesThisRound.includes(ability.id)) {
      toast({
        title: 'Já usada',
        description: `${ability.name} só pode ser usada 1x/rodada.`,
        variant: 'destructive',
      });
      return;
    }

    if (peCurrent < ability.peCost) {
      toast({
        title: 'PE insuficiente',
        variant: 'destructive',
      });
      return;
    }

    setActivatingAbility(ability.id);
    await new Promise(resolve => setTimeout(resolve, 250));

    const newPE = peCurrent - ability.peCost;
    onPEChange(newPE);
    onAbilityUsed?.(ability.id);

    toast({
      title: `${ability.name}`,
      description: `${ability.shortEffect} • -${ability.peCost} PE`,
    });

    setActivatingAbility(null);
  }, [peCurrent, onPEChange, onAbilityUsed, usedAbilitiesThisRound, toast]);

  // Não renderiza se não for Comandante de Campo
  if (!isComandanteCampo || unlockedAbilities.length === 0) {
    return null;
  }

  return (
    <MobileCollapsibleSection
      title="LIDERANÇA"
      icon={<Crown className="w-4 h-4 text-primary" />}
      badge={unlockedAbilities.length}
      defaultOpen={true}
    >
      <div className="space-y-2">
        {unlockedAbilities.map((ability) => {
          const isUsed = ability.perRound && usedAbilitiesThisRound.includes(ability.id);
          const isActivating = activatingAbility === ability.id;
          const canAfford = peCurrent >= ability.peCost;
          const isDisabled = isUsed || !canAfford || isActivating;

          return (
            <div 
              key={ability.id}
              className={cn(
                'p-2.5 rounded-lg border flex items-center gap-3 transition-all',
                isUsed 
                  ? 'bg-muted/30 border-muted opacity-50'
                  : 'bg-card/50 border-border/50'
              )}
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-sm truncate">{ability.name}</span>
                  {ability.perRound && (
                    <Badge variant="secondary" className="text-[8px] px-1 py-0">
                      1x
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5 text-paranormal" />
                    {ability.costPerTarget ? `${ability.peCost}/aliado` : ability.peCost}
                  </span>
                  <span>•</span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'text-[8px] px-1 py-0',
                      ability.actionType === 'reaction' 
                        ? 'border-yellow-500/50 text-yellow-600' 
                        : 'border-blue-500/50 text-blue-600'
                    )}
                  >
                    {ability.actionType === 'reaction' ? 'Reação' : 'Padrão'}
                  </Badge>
                  {ability.maxAllies && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5" />
                        {ability.maxAllies === 'intellect' 
                          ? maxAlliesForEstrategista
                          : ability.maxAllies
                        }
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Botão */}
              <Button
                size="sm"
                variant={isUsed ? 'ghost' : 'default'}
                className="h-8 w-16 text-xs shrink-0"
                disabled={isDisabled}
                onClick={() => handleUseAbility(ability)}
              >
                {isActivating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isUsed ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  'Usar'
                )}
              </Button>
            </div>
          );
        })}

        <p className="text-[9px] text-muted-foreground text-center pt-1.5">
          Efeitos de suporte aplicados a aliados
        </p>
      </div>
    </MobileCollapsibleSection>
  );
}
