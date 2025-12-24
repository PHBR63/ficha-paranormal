/**
 * MobileGuerreiroPanel - Versão mobile do painel de habilidades da trilha Guerreiro
 * 
 * Habilidades ativas:
 * - Revidar (NEX 40%): Reação + 2 PE - contra-ataque após bloqueio
 * - Força Opressora (NEX 65%): Livre + 1 PE - manobra derrubar/empurrar
 */

import { useState, useMemo, useCallback } from 'react';
import { Sword, Shield, ArrowDownToLine, MoveHorizontal, Check, Loader2, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerDescription } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';

// Mesmas definições do desktop
interface GuerreiroAbility {
  id: string;
  name: string;
  minNex: number;
  peCost: number;
  actionType: 'reaction' | 'free';
  description: string;
  shortEffect: string;
  trigger?: string;
  followUp?: {
    description: string;
    peCost: number;
  };
  options?: {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
  }[];
}

const GUERREIRO_ABILITIES: GuerreiroAbility[] = [
  {
    id: 'revidar',
    name: 'Revidar',
    minNex: 40,
    peCost: 2,
    actionType: 'reaction',
    trigger: 'Após bloquear ataque corpo a corpo',
    description: 'Quando você bloqueia um ataque corpo a corpo, pode gastar uma reação e 2 PE para fazer um ataque corpo a corpo contra o inimigo.',
    shortEffect: 'Contra-ataque após bloquear',
  },
  {
    id: 'forca-opressora',
    name: 'Força Opressora',
    minNex: 65,
    peCost: 1,
    actionType: 'free',
    trigger: 'Após acertar ataque corpo a corpo',
    description: 'Quando acerta um ataque corpo a corpo, pode gastar 1 PE para derrubar ou empurrar o inimigo.',
    shortEffect: 'Manobra grátis após acertar',
    followUp: {
      description: 'Se derrubar, pode gastar +1 PE para ataque adicional.',
      peCost: 1,
    },
    options: [
      {
        id: 'derrubar',
        name: 'Derrubar',
        description: 'Inimigo fica caído. +1 PE = ataque extra.',
        icon: <ArrowDownToLine className="w-4 h-4" />,
      },
      {
        id: 'empurrar',
        name: 'Empurrar',
        description: '+5/10 dano. Empurra 1,5m/5 margem.',
        icon: <MoveHorizontal className="w-4 h-4" />,
      },
    ],
  },
];

const PASSIVE_INFO = [
  { name: 'Técnica Letal', minNex: 10, effect: '+2 margem crítico corpo a corpo' },
  { name: 'Potência Máxima', minNex: 99, effect: '2x Ataque Especial corpo a corpo' },
];

type EffectDuration = 'instant' | 'next-turn' | 'round' | 'scene' | 'concentration';

interface MobileGuerreiroPanelProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  onRequestAttack?: () => void;
  onActivateEffect?: (id: string, name: string, duration?: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
}

// IDs de efeitos do Guerreiro
const GUERREIRO_EFFECT_IDS = {
  REVIDAR: 'track-revidar',
  FORCA_OPRESSORA: 'track-forca-opressora',
} as const;

export function MobileGuerreiroPanel({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  onRequestAttack,
  onActivateEffect,
  isEffectActive,
}: MobileGuerreiroPanelProps) {
  const { toast } = useToast();
  const [activatingAbility, setActivatingAbility] = useState<string | null>(null);
  const [forcaOpressoraOpen, setForcaOpressoraOpen] = useState(false);
  const [selectedManeuver, setSelectedManeuver] = useState<'derrubar' | 'empurrar' | null>(null);

  // Verifica se é trilha Guerreiro
  const isGuerreiro = useMemo(() => {
    if (!classTrack) return false;
    return classTrack.toLowerCase().includes('guerreiro');
  }, [classTrack]);

  // Habilidades desbloqueadas
  const unlockedAbilities = useMemo(() => {
    if (!isGuerreiro) return [];
    return GUERREIRO_ABILITIES.filter(a => nex >= a.minNex);
  }, [isGuerreiro, nex]);

  // Passivas desbloqueadas
  const passives = useMemo(() => {
    return PASSIVE_INFO.filter(p => nex >= p.minNex);
  }, [nex]);

  // Usar Revidar
  const handleUseRevidar = useCallback(async () => {
    const ability = GUERREIRO_ABILITIES.find(a => a.id === 'revidar')!;
    
    if (peCurrent < ability.peCost) {
      toast({ title: 'PE insuficiente', variant: 'destructive' });
      return;
    }

    setActivatingAbility(ability.id);
    await new Promise(r => setTimeout(r, 300));

    const newPE = peCurrent - ability.peCost;
    onPEChange(newPE);

    // Registra no SUE
    onActivateEffect?.(GUERREIRO_EFFECT_IDS.REVIDAR, 'Revidar', 'instant');

    toast({
      title: `${ability.name} ativado!`,
      description: `${ability.shortEffect}. -${ability.peCost} PE`,
    });

    setActivatingAbility(null);
    onRequestAttack?.();
  }, [peCurrent, onPEChange, toast, onRequestAttack]);

  // Confirmar Força Opressora
  const handleConfirmForcaOpressora = useCallback(async (withExtra: boolean) => {
    const ability = GUERREIRO_ABILITIES.find(a => a.id === 'forca-opressora')!;
    const cost = withExtra ? 2 : 1;

    if (peCurrent < cost) {
      toast({ title: 'PE insuficiente', variant: 'destructive' });
      return;
    }

    setActivatingAbility(ability.id);
    await new Promise(r => setTimeout(r, 300));

    const newPE = peCurrent - cost;
    onPEChange(newPE);

    const action = selectedManeuver === 'derrubar' 
      ? (withExtra ? 'Derrubar + Ataque' : 'Derrubar')
      : 'Empurrar';

    // Registra no SUE
    onActivateEffect?.(GUERREIRO_EFFECT_IDS.FORCA_OPRESSORA, 'Força Opressora', 'instant', { maneuver: selectedManeuver, withExtra });

    toast({
      title: `Força Opressora - ${action}`,
      description: `-${cost} PE`,
    });

    setActivatingAbility(null);
    setForcaOpressoraOpen(false);
    setSelectedManeuver(null);

    if (withExtra) onRequestAttack?.();
  }, [peCurrent, onPEChange, selectedManeuver, toast, onRequestAttack]);

  if (!isGuerreiro) return null;

  // Se só tem passivas
  if (unlockedAbilities.length === 0 && passives.length > 0) {
    return (
      <MobileCollapsibleSection
        title="Guerreiro (Passivo)"
        icon={<Sword className="w-4 h-4 text-orange-500" />}
      >
        <div className="space-y-1 p-2">
          {passives.map((p, i) => (
            <div key={i} className="text-[10px] text-muted-foreground">
              <span className="text-foreground font-medium">{p.name}:</span> {p.effect}
            </div>
          ))}
        </div>
      </MobileCollapsibleSection>
    );
  }

  if (unlockedAbilities.length === 0) return null;

  return (
    <>
      <MobileCollapsibleSection
        title="Guerreiro"
        icon={<Sword className="w-4 h-4 text-orange-500" />}
        badge={unlockedAbilities.length}
      >
        <div className="space-y-2 p-2">
          {/* Passivas */}
          {passives.length > 0 && (
            <div className="p-2 rounded bg-muted/30 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1 text-green-500 font-medium mb-1">
                <Check className="w-3 h-3" /> Passivas
              </span>
              {passives.map((p, i) => (
                <div key={i}>{p.name}: {p.effect}</div>
              ))}
            </div>
          )}

          {/* Habilidades ativas */}
          {unlockedAbilities.map((ability) => {
            const isActivating = activatingAbility === ability.id;
            const canAfford = peCurrent >= ability.peCost;

            return (
              <div key={ability.id} className="p-2 rounded-lg bg-card border border-border/50">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-xs">{ability.name}</span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          'text-[8px] px-1',
                          ability.actionType === 'reaction' 
                            ? 'border-yellow-500/50 text-yellow-600' 
                            : 'border-green-500/50 text-green-600'
                        )}
                      >
                        {ability.actionType === 'reaction' ? 'Reação' : 'Livre'}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {ability.shortEffect}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-paranormal flex items-center gap-0.5">
                      <Zap className="w-3 h-3" /> {ability.peCost}
                    </span>
                    <Button
                      size="sm"
                      className="h-6 text-[10px] px-2 bg-orange-600 hover:bg-orange-700"
                      disabled={!canAfford || isActivating}
                      onClick={() => {
                        if (ability.id === 'revidar') handleUseRevidar();
                        else setForcaOpressoraOpen(true);
                      }}
                    >
                      {isActivating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Usar'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </MobileCollapsibleSection>

      {/* Drawer para Força Opressora */}
      <Drawer open={forcaOpressoraOpen} onOpenChange={setForcaOpressoraOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Sword className="w-5 h-5 text-orange-500" />
              Força Opressora
            </DrawerTitle>
            <DrawerDescription>Escolha a manobra</DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-3">
            {GUERREIRO_ABILITIES.find(a => a.id === 'forca-opressora')?.options?.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedManeuver(opt.id as 'derrubar' | 'empurrar')}
                className={cn(
                  'w-full p-3 rounded-lg border-2 text-left transition-all',
                  selectedManeuver === opt.id
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-border'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {opt.icon}
                  <span className="font-medium">{opt.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </button>
            ))}

            {selectedManeuver === 'derrubar' && (
              <div className="p-2 rounded bg-orange-500/10 border border-orange-500/30 text-xs">
                <AlertTriangle className="w-3 h-3 text-orange-500 inline mr-1" />
                Se derrubar, +1 PE = ataque adicional
              </div>
            )}
          </div>

          <DrawerFooter>
            {selectedManeuver === 'derrubar' ? (
              <div className="flex gap-2 w-full">
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={peCurrent < 1}
                  onClick={() => handleConfirmForcaOpressora(false)}
                >
                  Derrubar (1 PE)
                </Button>
                <Button
                  className="flex-1 bg-orange-600"
                  disabled={peCurrent < 2}
                  onClick={() => handleConfirmForcaOpressora(true)}
                >
                  + Atacar (2 PE)
                </Button>
              </div>
            ) : (
              <Button
                className="w-full bg-orange-600"
                disabled={!selectedManeuver || peCurrent < 1}
                onClick={() => handleConfirmForcaOpressora(false)}
              >
                Empurrar (1 PE)
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
