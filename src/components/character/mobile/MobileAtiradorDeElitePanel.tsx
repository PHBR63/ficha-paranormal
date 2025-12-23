/**
 * MobileAtiradorDeElitePanel - Versão mobile do painel Atirador de Elite
 * 
 * Habilidades:
 * - NEX 10%: Mira de Elite (passiva) - Proficiência balas longas + INT em dano
 * - NEX 40%: Disparo Letal (1 PE) - +2 margem de ameaça ao mirar
 * - NEX 65%: Disparo Impactante (2 PE) - Manobra ao invés de dano
 * - NEX 99%: Atirar para Matar (passiva) - Crítico = dano máximo
 */

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crosshair, Target, Zap, Skull, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';

// Tipos de manobras disponíveis para Disparo Impactante
const MANOBRAS_IMPACTANTE = [
  { id: 'derrubar', name: 'Derrubar', description: 'Derruba o alvo' },
  { id: 'desarmar', name: 'Desarmar', description: 'Desarma o alvo' },
  { id: 'empurrar', name: 'Empurrar', description: 'Empurra o alvo' },
  { id: 'quebrar', name: 'Quebrar', description: 'Quebra item do alvo' },
];

// Interface para habilidades da trilha
interface AtiradorAbility {
  id: string;
  name: string;
  minNex: number;
  peCost: number;
  isPassive: boolean;
  shortEffect: string;
}

// Definição das habilidades do Atirador de Elite
const ATIRADOR_ABILITIES: AtiradorAbility[] = [
  {
    id: 'mira-de-elite',
    name: 'Mira de Elite',
    minNex: 10,
    peCost: 0,
    isPassive: true,
    shortEffect: 'Proficiência balas longas + INT em dano',
  },
  {
    id: 'disparo-letal',
    name: 'Disparo Letal',
    minNex: 40,
    peCost: 1,
    isPassive: false,
    shortEffect: '+2 margem de ameaça (ao mirar)',
  },
  {
    id: 'disparo-impactante',
    name: 'Disparo Impactante',
    minNex: 65,
    peCost: 2,
    isPassive: false,
    shortEffect: 'Manobra ao invés de dano',
  },
  {
    id: 'atirar-para-matar',
    name: 'Atirar para Matar',
    minNex: 99,
    peCost: 0,
    isPassive: true,
    shortEffect: 'Crítico = dano máximo',
  },
];

interface MobileAtiradorDeElitePanelProps {
  classTrack?: string | null;
  nex: number;
  peCurrent: number;
  intellect: number;
  onPEChange: (newPE: number) => void;
}

export function MobileAtiradorDeElitePanel({
  classTrack,
  nex,
  peCurrent,
  intellect,
  onPEChange,
}: MobileAtiradorDeElitePanelProps) {
  const [activatingAbility, setActivatingAbility] = useState<string | null>(null);
  const [showManeuverDrawer, setShowManeuverDrawer] = useState(false);

  // Verifica se é Atirador de Elite
  const isAtiradorElite = classTrack === 'Atirador de Elite';

  // Filtra habilidades desbloqueadas pelo NEX
  const unlockedAbilities = useMemo(() => 
    ATIRADOR_ABILITIES.filter(ability => nex >= ability.minNex),
    [nex]
  );

  // Handler para usar habilidade ativa
  const handleUseAbility = useCallback(async (ability: AtiradorAbility) => {
    if (ability.isPassive) return;
    
    if (peCurrent < ability.peCost) {
      toast.error(`PE insuficiente para ${ability.name}`);
      return;
    }

    if (ability.id === 'disparo-impactante') {
      setShowManeuverDrawer(true);
      return;
    }

    setActivatingAbility(ability.id);

    try {
      onPEChange(peCurrent - ability.peCost);
      toast.success(`${ability.name} ativado!`, {
        description: ability.shortEffect,
      });
    } finally {
      setTimeout(() => setActivatingAbility(null), 300);
    }
  }, [peCurrent, onPEChange]);

  // Handler para escolher manobra do Disparo Impactante
  const handleManeuverChoice = useCallback((manobra: typeof MANOBRAS_IMPACTANTE[0]) => {
    const ability = ATIRADOR_ABILITIES.find(a => a.id === 'disparo-impactante')!;
    
    if (peCurrent < ability.peCost) {
      toast.error(`PE insuficiente`);
      setShowManeuverDrawer(false);
      return;
    }

    onPEChange(peCurrent - ability.peCost);
    toast.success(`Disparo Impactante: ${manobra.name}`);
    setShowManeuverDrawer(false);
  }, [peCurrent, onPEChange]);

  if (!isAtiradorElite || unlockedAbilities.length === 0) {
    return null;
  }

  return (
    <>
      <MobileCollapsibleSection
        title="ATIRADOR DE ELITE"
        icon={<Crosshair className="h-4 w-4 text-amber-400" />}
        defaultOpen={true}
        className="border-amber-500/30"
      >
        <div className="space-y-2">
          {unlockedAbilities.map((ability) => {
            const isActivating = activatingAbility === ability.id;
            const canAfford = peCurrent >= ability.peCost;

            return (
              <div 
                key={ability.id}
                className="p-2.5 rounded-lg bg-background/50 border border-border/50"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {ability.id === 'mira-de-elite' && <Target className="h-3.5 w-3.5 text-amber-400" />}
                    {ability.id === 'disparo-letal' && <Zap className="h-3.5 w-3.5 text-red-400" />}
                    {ability.id === 'disparo-impactante' && <Target className="h-3.5 w-3.5 text-orange-400" />}
                    {ability.id === 'atirar-para-matar' && <Skull className="h-3.5 w-3.5 text-red-500" />}
                    <span className="font-medium text-xs">{ability.name}</span>
                  </div>
                  
                  {ability.isPassive ? (
                    <Badge variant="secondary" className="text-[9px] h-5">
                      Passiva
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[9px] h-5">
                        {ability.peCost} PE
                      </Badge>
                      <Button
                        size="sm"
                        variant={canAfford ? "default" : "outline"}
                        disabled={!canAfford || isActivating}
                        onClick={() => handleUseAbility(ability)}
                        className="h-6 text-[10px] px-2"
                      >
                        {isActivating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          'Usar'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                
                <p className="text-[10px] text-muted-foreground">
                  {ability.shortEffect}
                </p>

                {/* Info extra para Mira de Elite */}
                {ability.id === 'mira-de-elite' && (
                  <div className="flex items-center gap-1.5 mt-1.5 p-1.5 rounded bg-amber-500/10 border border-amber-500/20">
                    <CheckCircle2 className="h-3 w-3 text-amber-400" />
                    <span className="text-[10px] text-amber-300">
                      +{intellect} dano (INT) com balas longas
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </MobileCollapsibleSection>

      {/* Drawer para escolha de manobra */}
      <Drawer open={showManeuverDrawer} onOpenChange={setShowManeuverDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Disparo Impactante</DrawerTitle>
            <DrawerDescription>
              Escolha a manobra (2 PE)
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 grid grid-cols-2 gap-2">
            {MANOBRAS_IMPACTANTE.map((manobra) => (
              <Button
                key={manobra.id}
                variant="outline"
                className="h-auto py-2.5 flex flex-col items-center gap-0.5"
                onClick={() => handleManeuverChoice(manobra)}
              >
                <span className="font-medium text-sm">{manobra.name}</span>
                <span className="text-[10px] text-muted-foreground">{manobra.description}</span>
              </Button>
            ))}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
