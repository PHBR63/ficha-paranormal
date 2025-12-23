/**
 * MobileOperacoesEspeciaisPanel - Versão mobile do painel Operações Especiais
 * Otimizado para telas pequenas com Drawer para escolhas
 */

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Swords, 
  Wind, 
  AlertTriangle,
  Info,
  Footprints,
  Hand
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { toast } from '@/hooks/use-toast';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';

// Definição das habilidades ativadas
const OPERACOES_ABILITIES = [
  {
    id: 'ataque-extra',
    name: 'Ataque Extra',
    minNex: 40,
    peCost: 2,
    shortEffect: '+1 ataque',
    perRound: true,
    icon: Swords,
  },
  {
    id: 'surto-de-adrenalina',
    name: 'Surto de Adrenalina',
    minNex: 65,
    peCost: 5,
    shortEffect: '+1 ação',
    perRound: true,
    requiresChoice: true,
    icon: Wind,
  },
] as const;

// Habilidades passivas
const PASSIVE_ABILITIES = [
  {
    id: 'iniciativa-aprimorada',
    name: 'Iniciativa Aprimorada',
    minNex: 10,
    effect: '+5 Init, mov. extra (1ª rod.)',
    icon: Zap,
  },
  {
    id: 'sempre-alerta',
    name: 'Sempre Alerta',
    minNex: 99,
    effect: '+1 ação padrão (início)',
    icon: AlertTriangle,
  },
] as const;

interface MobileOperacoesEspeciaisPanelProps {
  classTrack: string | null;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  className?: string;
}

export function MobileOperacoesEspeciaisPanel({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  className,
}: MobileOperacoesEspeciaisPanelProps) {
  const [usedAbilitiesThisRound, setUsedAbilitiesThisRound] = useState<Set<string>>(new Set());
  const [showSurtoDrawer, setShowSurtoDrawer] = useState(false);

  // Verifica se é trilha Operações Especiais
  const isOperacoesEspeciais = useMemo(() => {
    if (!classTrack) return false;
    const normalized = classTrack.toLowerCase().replace(/[^a-z]/g, '');
    return normalized.includes('operacoes') || normalized.includes('especiais') || 
           classTrack === 'operacoes-especiais';
  }, [classTrack]);

  // Filtra habilidades desbloqueadas
  const unlockedActiveAbilities = useMemo(() => 
    OPERACOES_ABILITIES.filter(a => nex >= a.minNex),
    [nex]
  );

  const unlockedPassiveAbilities = useMemo(() =>
    PASSIVE_ABILITIES.filter(a => nex >= a.minNex),
    [nex]
  );

  // Handler para usar habilidade
  const handleUseAbility = useCallback((abilityId: string, peCost: number, abilityName: string) => {
    if (usedAbilitiesThisRound.has(abilityId)) {
      toast({
        title: "Limite por rodada",
        description: `${abilityName} já foi usada.`,
        variant: "destructive",
      });
      return;
    }

    if (peCurrent < peCost) {
      toast({
        title: "PE Insuficiente",
        description: `Precisa de ${peCost} PE.`,
        variant: "destructive",
      });
      return;
    }

    if (abilityId === 'surto-de-adrenalina') {
      setShowSurtoDrawer(true);
      return;
    }

    onPEChange(peCurrent - peCost);
    setUsedAbilitiesThisRound(prev => new Set(prev).add(abilityId));

    toast({
      title: `${abilityName}!`,
      description: `${peCost} PE gastos.`,
    });
  }, [peCurrent, onPEChange, usedAbilitiesThisRound]);

  // Handler para escolha do Surto
  const handleSurtoChoice = useCallback((choice: 'standard' | 'movement') => {
    onPEChange(peCurrent - 5);
    setUsedAbilitiesThisRound(prev => new Set(prev).add('surto-de-adrenalina'));
    setShowSurtoDrawer(false);

    toast({
      title: "Surto de Adrenalina!",
      description: `+1 ${choice === 'standard' ? 'ação padrão' : 'movimento'}.`,
    });
  }, [peCurrent, onPEChange]);

  // Reset de usos
  const resetRoundUsage = useCallback(() => {
    setUsedAbilitiesThisRound(new Set());
  }, []);

  if (!isOperacoesEspeciais || (unlockedActiveAbilities.length === 0 && unlockedPassiveAbilities.length === 0)) {
    return null;
  }

  return (
    <>
      <MobileCollapsibleSection
        title="Operações Especiais"
        icon={<Zap className="w-4 h-4 text-primary" />}
        badge={`${unlockedActiveAbilities.length + unlockedPassiveAbilities.length}`}
        defaultOpen={true}
        className={className}
      >
        <div className="space-y-3">
          {/* Passivos */}
          {unlockedPassiveAbilities.map((ability) => {
            const Icon = ability.icon;
            return (
              <div
                key={ability.id}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border/50"
              >
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium">{ability.name}</span>
                  <p className="text-[10px] text-primary">{ability.effect}</p>
                </div>
                <Badge variant="secondary" className="text-[9px] shrink-0">
                  Passivo
                </Badge>
              </div>
            );
          })}

          {/* Ativadas */}
          {unlockedActiveAbilities.map((ability) => {
            const Icon = ability.icon;
            const isUsed = usedAbilitiesThisRound.has(ability.id);
            const canAfford = peCurrent >= ability.peCost;

            return (
              <motion.div
                key={ability.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md border",
                  isUsed ? "bg-muted/50 opacity-60" : "bg-card"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4 shrink-0",
                  isUsed ? "text-muted-foreground" : "text-primary"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium">{ability.name}</span>
                    <Badge variant="outline" className="text-[9px]">
                      {ability.peCost} PE
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{ability.shortEffect}</p>
                </div>
                <Button
                  size="sm"
                  variant={isUsed ? "outline" : "default"}
                  disabled={isUsed || !canAfford}
                  onClick={() => handleUseAbility(ability.id, ability.peCost, ability.name)}
                  className="h-7 text-[10px] px-2 shrink-0"
                >
                  {isUsed ? "Usada" : "Usar"}
                </Button>
              </motion.div>
            );
          })}

          {/* Reset */}
          {usedAbilitiesThisRound.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetRoundUsage}
              className="w-full text-xs h-7"
            >
              Nova Rodada
            </Button>
          )}
        </div>
      </MobileCollapsibleSection>

      {/* Drawer para Surto de Adrenalina */}
      <Drawer open={showSurtoDrawer} onOpenChange={setShowSurtoDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2 justify-center">
              <Wind className="w-5 h-5 text-primary" />
              Surto de Adrenalina
            </DrawerTitle>
            <DrawerDescription className="text-center">
              Escolha o tipo de ação adicional
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="grid grid-cols-2 gap-3 p-4">
            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col gap-2"
              onClick={() => handleSurtoChoice('standard')}
            >
              <Hand className="w-8 h-8 text-primary" />
              <span className="font-medium">Ação Padrão</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col gap-2"
              onClick={() => handleSurtoChoice('movement')}
            >
              <Footprints className="w-8 h-8 text-primary" />
              <span className="font-medium">Movimento</span>
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center pb-4">
            Custo: 5 PE
          </p>
        </DrawerContent>
      </Drawer>
    </>
  );
}
