/**
 * MobileMedicoDeCampoPanel - Versão mobile do painel Médico de Campo
 * 
 * Requisito Especial: Treinado em Medicina + kit de medicina
 * 
 * Habilidades:
 * - NEX 10%: Paramédico - Cura 2d10 PV (escala com NEX), +1 PE por dado extra
 * - NEX 40%: Equipe de Trauma - Remove condição negativa (exceto morrendo)
 * - NEX 65%: Resgate - Movimento livre para aliado machucado, +5 Defesa ao curar
 * - NEX 99%: Reanimação - Traz aliado de volta à vida (1x/cena)
 */

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Stethoscope, 
  Activity, 
  ShieldPlus, 
  Sparkles, 
  Plus, 
  Minus,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';

/**
 * Calcula os dados de cura do Paramédico baseado no NEX
 */
function getParamedicoDice(nex: number): { base: number; formula: string } {
  if (nex >= 99) return { base: 5, formula: '5d10' };
  if (nex >= 65) return { base: 4, formula: '4d10' };
  if (nex >= 40) return { base: 3, formula: '3d10' };
  return { base: 2, formula: '2d10' };
}

type EffectDuration = 'instant' | 'next-turn' | 'round' | 'scene' | 'concentration';

interface MobileMedicoDeCampoPanelProps {
  classTrack?: string | null;
  nex: number;
  peCurrent: number;
  onPEChange: (delta: number) => void;
  reanimacaoUsedThisScene?: boolean;
  onReanimacaoUsed?: () => void;
  onActivateEffect?: (id: string, name: string, duration?: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
}

export function MobileMedicoDeCampoPanel({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  reanimacaoUsedThisScene = false,
  onReanimacaoUsed,
}: MobileMedicoDeCampoPanelProps) {
  const [extraDice, setExtraDice] = useState(0);
  const [showParamedicoDrawer, setShowParamedicoDrawer] = useState(false);
  
  // Verifica se é Médico de Campo
  const isMedicoCampo = classTrack === 'Médico de Campo' || classTrack === 'medico-campo';
  
  // Dados de cura base
  const healingDice = useMemo(() => getParamedicoDice(nex), [nex]);
  
  // Custo total do Paramédico
  const paramedicoCost = 2 + extraDice;
  
  // Habilidades desbloqueadas
  const hasParamedico = nex >= 10;
  const hasEquipeTrauma = nex >= 40;
  const hasResgate = nex >= 65;
  const hasReanimacao = nex >= 99;

  const handleOpenParamedico = useCallback(() => {
    setExtraDice(0);
    setShowParamedicoDrawer(true);
  }, []);

  const handleUseParamedico = useCallback(() => {
    if (peCurrent < paramedicoCost) {
      toast.error('PE insuficiente');
      return;
    }
    onPEChange(-paramedicoCost);
    const totalDice = healingDice.base + extraDice;
    toast.success(`Paramédico: cure ${totalDice}d10 PV`);
    setShowParamedicoDrawer(false);
  }, [peCurrent, paramedicoCost, extraDice, healingDice.base, onPEChange]);

  const handleEquipeTrauma = useCallback(() => {
    if (peCurrent < 2) {
      toast.error('PE insuficiente');
      return;
    }
    onPEChange(-2);
    toast.success('Equipe de Trauma: remova uma condição');
  }, [peCurrent, onPEChange]);

  const handleReanimacao = useCallback(() => {
    if (reanimacaoUsedThisScene) {
      toast.warning('Já usado nesta cena');
      return;
    }
    if (peCurrent < 10) {
      toast.error('PE insuficiente');
      return;
    }
    onPEChange(-10);
    onReanimacaoUsed?.();
    toast.success('Reanimação ativada!');
  }, [peCurrent, reanimacaoUsedThisScene, onPEChange, onReanimacaoUsed]);

  if (!isMedicoCampo) return null;

  return (
    <>
      <MobileCollapsibleSection
        title="Médico de Campo"
        icon={<Stethoscope className="h-4 w-4 text-emerald-400" />}
        badge={`NEX ${nex}%`}
      >
        <div className="space-y-3">
          {/* Paramédico */}
          {hasParamedico && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-900/30 border border-emerald-500/20">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Heart className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="font-medium text-sm">Paramédico</span>
                  <p className="text-xs text-muted-foreground">
                    {healingDice.formula} PV • 2+ PE
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={peCurrent >= 2 ? "default" : "outline"}
                disabled={peCurrent < 2}
                onClick={handleOpenParamedico}
                className="shrink-0"
              >
                Usar
              </Button>
            </div>
          )}

          {/* Equipe de Trauma */}
          {hasEquipeTrauma && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-blue-900/30 border border-blue-500/20">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Activity className="h-4 w-4 text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <span className="font-medium text-sm">Equipe de Trauma</span>
                  <p className="text-xs text-muted-foreground">
                    Remove condição • 2 PE
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={peCurrent >= 2 ? "default" : "outline"}
                disabled={peCurrent < 2}
                onClick={handleEquipeTrauma}
                className="shrink-0"
              >
                Usar
              </Button>
            </div>
          )}

          {/* Resgate (Passivo) */}
          {hasResgate && (
            <div className="p-2 rounded-lg bg-emerald-900/20 border border-emerald-500/10">
              <div className="flex items-center gap-2">
                <ShieldPlus className="h-4 w-4 text-emerald-300" />
                <span className="font-medium text-sm">Resgate</span>
                <Badge variant="secondary" className="text-[10px]">Passivo</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ação livre para aliado machucado. +5 Defesa ao curar.
              </p>
            </div>
          )}

          {/* Reanimação */}
          {hasReanimacao && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-yellow-900/30 border border-yellow-500/20">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Sparkles className="h-4 w-4 text-yellow-400 shrink-0" />
                <div className="min-w-0">
                  <span className="font-medium text-sm">Reanimação</span>
                  <p className="text-xs text-muted-foreground">
                    10 PE • 1x/cena
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={reanimacaoUsedThisScene ? "outline" : peCurrent >= 10 ? "default" : "outline"}
                disabled={peCurrent < 10 || reanimacaoUsedThisScene}
                onClick={handleReanimacao}
                className="shrink-0"
              >
                {reanimacaoUsedThisScene ? 'Usado' : 'Usar'}
              </Button>
            </div>
          )}
        </div>
      </MobileCollapsibleSection>

      {/* Drawer do Paramédico */}
      <Drawer open={showParamedicoDrawer} onOpenChange={setShowParamedicoDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-emerald-400" />
              Paramédico
            </DrawerTitle>
            <DrawerDescription>
              Cure {healingDice.formula} PV base. +1 PE por dado extra.
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Dados extras (+1 PE cada)</Label>
              <div className="flex items-center gap-3 justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setExtraDice(Math.max(0, extraDice - 1))}
                  disabled={extraDice === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-2xl font-bold w-12 text-center">{extraDice}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setExtraDice(extraDice + 1)}
                  disabled={peCurrent < paramedicoCost + 1}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Cura:</span>
                <span className="font-bold text-emerald-400">{healingDice.base + extraDice}d10</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Custo:</span>
                <span className="font-bold">{paramedicoCost} PE</span>
              </div>
            </div>
          </div>

          <DrawerFooter>
            <Button 
              onClick={handleUseParamedico}
              disabled={peCurrent < paramedicoCost}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Curar {healingDice.base + extraDice}d10 PV
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}