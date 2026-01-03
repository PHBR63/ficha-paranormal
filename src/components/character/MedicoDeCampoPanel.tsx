/**
 * MedicoDeCampoPanel - Painel de habilidades da trilha Médico de Campo (Especialista)
 * 
 * REFATORADO PARA CONSUMIR DADOS DO SUE (Sistema Unificado de Efeitos)
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Heart, 
  Stethoscope, 
  Activity, 
  ShieldPlus, 
  Sparkles, 
  Plus, 
  Minus,
  Info,
  CheckCircle2
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type EffectDuration, TRACK_EFFECT_IDS } from '@/hooks';
import type { ComputedEffects } from '@/lib/unified-effects-engine';

// =====================================================
// Funções Auxiliares
// =====================================================

/**
 * Calcula os dados de cura do Paramédico baseado no NEX
 */
function getParamedicoDice(nex: number): { base: number; dieType: string; formula: string } {
  if (nex >= 99) return { base: 5, dieType: 'd10', formula: '5d10' };
  if (nex >= 65) return { base: 4, dieType: 'd10', formula: '4d10' };
  if (nex >= 40) return { base: 3, dieType: 'd10', formula: '3d10' };
  return { base: 2, dieType: 'd10', formula: '2d10' };
}

// =====================================================
// Props do Componente
// =====================================================

interface MedicoDeCampoPanelProps {
  classTrack?: string | null;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  /** Dados consolidados do SUE (opcional - se fornecido, usa dados do SUE) */
  computedEffects?: ComputedEffects;
  /** Callback opcional para aplicar cura a um personagem */
  onHeal?: (amount: number, targetName?: string) => void;
  /** Se a habilidade Reanimação já foi usada nesta cena */
  reanimacaoUsedThisScene?: boolean;
  /** Callback para marcar Reanimação como usada */
  onReanimacaoUsed?: () => void;
  /** Callback para ativar efeito no SUE */
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  /** Verifica se um efeito está ativo */
  isEffectActive?: (id: string) => boolean;
}

// =====================================================
// Componente Principal
// =====================================================

export function MedicoDeCampoPanel({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  computedEffects,
  onHeal,
  reanimacaoUsedThisScene = false,
  onReanimacaoUsed,
  onActivateEffect,
}: MedicoDeCampoPanelProps) {
  const [extraDice, setExtraDice] = useState(0);
  const [showParamedicoDrawer, setShowParamedicoDrawer] = useState(false);
  
  // Verifica se é Médico de Campo (suporta ambos os formatos)
  const isMedicoCampo = classTrack === 'Médico de Campo' || classTrack === 'medico-campo';
  
  // ===== DADOS DO SUE (se disponível) =====
  
  // Dados de cura do SUE
  const sueHealing = computedEffects?.healing;
  
  // Dados de suporte do SUE
  const sueSupport = computedEffects?.support;
  
  // ===== DADOS DERIVADOS =====
  
  // Dados de cura base - usa SUE se disponível
  const healingDice = useMemo(() => {
    if (sueHealing?.baseDice && sueHealing?.dieType) {
      return {
        base: sueHealing.baseDice,
        dieType: sueHealing.dieType,
        formula: `${sueHealing.baseDice}${sueHealing.dieType}`
      };
    }
    return getParamedicoDice(nex);
  }, [sueHealing, nex]);
  
  // Custo total do Paramédico (2 PE base + 1 PE por dado extra)
  const paramedicoCost = 2 + extraDice;
  
  // Habilidades desbloqueadas por NEX
  const hasParamedico = nex >= 10;
  const hasEquipeTrauma = nex >= 40;
  const hasResgate = nex >= 65;
  const hasReanimacao = nex >= 99;

  // ===== DADOS DE SUPORTE DO SUE =====
  
  // Movimento livre para aliado (Resgate)
  const freeMovementAbility = useMemo(() => {
    return sueSupport?.freeMovement ?? null;
  }, [sueSupport]);

  // Bônus ao curar (Resgate)
  const onHealEffects = useMemo(() => {
    return sueSupport?.onHealEffects ?? [];
  }, [sueSupport]);

  // Habilidade de remover condições (Equipe de Trauma)
  const removeConditionAbilities = useMemo(() => {
    return sueSupport?.removeConditionAbilities ?? [];
  }, [sueSupport]);

  // Habilidade de ressurreição (Reanimação)
  const resurrectAbilities = useMemo(() => {
    return sueSupport?.resurrectAbilities ?? [];
  }, [sueSupport]);

  // ===== HANDLERS =====

  /**
   * Abre drawer para configurar Paramédico
   */
  const handleOpenParamedico = useCallback(() => {
    setExtraDice(0);
    setShowParamedicoDrawer(true);
  }, []);

  /**
   * Executa a cura do Paramédico
   */
  const handleUseParamedico = useCallback(() => {
    if (peCurrent < paramedicoCost) {
      toast.error('PE insuficiente', { 
        description: `Paramédico requer ${paramedicoCost} PE (2 base + ${extraDice} extras).` 
      });
      return;
    }

    onPEChange(peCurrent - paramedicoCost);
    
    const totalDice = healingDice.base + extraDice;
    const formula = `${totalDice}d10`;
    
    // Verifica se há bônus de defesa ao curar (Resgate)
    const defenseBonus = onHealEffects.length > 0 ? onHealEffects[0].targetDefenseBonus : 0;
    const defenseBonusText = defenseBonus > 0 ? ` Você e o aliado recebem +${defenseBonus} Defesa.` : '';
    
    toast.success('Paramédico ativado!', {
      description: `Cure ${formula} PV de você ou aliado adjacente.${defenseBonusText} Custo: ${paramedicoCost} PE.${sueHealing ? ' (via SUE)' : ''}`
    });
    
    setShowParamedicoDrawer(false);
  }, [peCurrent, paramedicoCost, extraDice, healingDice.base, onPEChange, onHealEffects, sueHealing]);

  /**
   * Usa Equipe de Trauma (2 PE)
   */
  const handleEquipeTrauma = useCallback(() => {
    if (peCurrent < 2) {
      toast.error('PE insuficiente', { description: 'Equipe de Trauma requer 2 PE.' });
      return;
    }

    onPEChange(peCurrent - 2);
    
    // Verifica condições excluídas do SUE
    const excludedConditions = removeConditionAbilities.length > 0 
      ? removeConditionAbilities[0].excludedConditions 
      : ['morrendo'];
    
    toast.success('Equipe de Trauma ativado!', {
      description: `Remove uma condição negativa (exceto ${excludedConditions.join(', ')}) de aliado adjacente.${sueSupport ? ' (via SUE)' : ''}`
    });
  }, [peCurrent, onPEChange, removeConditionAbilities, sueSupport]);

  /**
   * Usa Reanimação (10 PE, 1x/cena)
   */
  const handleReanimacao = useCallback(() => {
    if (reanimacaoUsedThisScene) {
      toast.warning('Já usado nesta cena', { 
        description: 'Reanimação só pode ser usada 1x por cena.' 
      });
      return;
    }
    
    if (peCurrent < 10) {
      toast.error('PE insuficiente', { description: 'Reanimação requer 10 PE.' });
      return;
    }

    onPEChange(peCurrent - 10);
    onReanimacaoUsed?.();
    
    // Verifica tipos de morte excluídos do SUE
    const excludedDeathTypes = resurrectAbilities.length > 0 
      ? resurrectAbilities[0].excludedDeathTypes 
      : ['dano massivo'];
    
    toast.success('Reanimação ativada!', {
      description: `Traz de volta à vida um personagem que morreu nesta cena (exceto morte por ${excludedDeathTypes.join(', ')}).${sueSupport ? ' (via SUE)' : ''}`
    });
  }, [peCurrent, reanimacaoUsedThisScene, onPEChange, onReanimacaoUsed, resurrectAbilities, sueSupport]);

  // Não renderiza se não for Médico de Campo
  if (!isMedicoCampo) return null;

  return (
    <>
      <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-emerald-400" />
            Médico de Campo
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    <strong>Requisito:</strong> Treinado em Medicina e possuir kit de medicina.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {/* Indicador de dados do SUE */}
            {(sueHealing || sueSupport) && (
              <Badge variant="secondary" className="text-[10px] ml-auto">
                SUE
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          
          {/* Indicador de bônus de suporte do SUE */}
          {sueSupport && (freeMovementAbility || onHealEffects.length > 0) && (
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <p className="text-xs font-medium text-emerald-300">Bônus de Suporte (SUE)</p>
              <div className="flex gap-2 flex-wrap">
                {freeMovementAbility && (
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-300">
                    Movimento livre para aliado
                  </Badge>
                )}
                {onHealEffects.length > 0 && onHealEffects[0].targetDefenseBonus > 0 && (
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-300">
                    +{onHealEffects[0].targetDefenseBonus} Defesa ao curar
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* NEX 10% - Paramédico */}
          {hasParamedico && (
            <div className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium text-sm">Paramédico</span>
                  <Badge variant="outline" className="text-[10px]">NEX 10%</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">2+ PE</Badge>
                  <Button
                    size="sm"
                    variant={peCurrent >= 2 ? "default" : "outline"}
                    disabled={peCurrent < 2}
                    onClick={handleOpenParamedico}
                    className="h-7 text-xs"
                  >
                    Usar
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Cura {healingDice.formula} PV (ação padrão). +1 PE por dado extra.
                {sueHealing && (
                  <span className="text-emerald-400 ml-1">(via SUE)</span>
                )}
              </p>
            </div>
          )}

          {/* NEX 40% - Equipe de Trauma */}
          {hasEquipeTrauma && (
            <div className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <span className="font-medium text-sm">Equipe de Trauma</span>
                  <Badge variant="outline" className="text-[10px]">NEX 40%</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">2 PE</Badge>
                  <Button
                    size="sm"
                    variant={peCurrent >= 2 ? "default" : "outline"}
                    disabled={peCurrent < 2}
                    onClick={handleEquipeTrauma}
                    className="h-7 text-xs"
                  >
                    Usar
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Remove condição negativa (exceto morrendo) de aliado adjacente.
                {removeConditionAbilities.length > 0 && (
                  <span className="text-emerald-400 ml-1">(via SUE)</span>
                )}
              </p>
            </div>
          )}

          {/* NEX 65% - Resgate (Passivo) */}
          {hasResgate && (
            <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/10 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldPlus className="h-4 w-4 text-emerald-300" />
                <span className="font-medium text-sm">Resgate</span>
                <Badge variant="secondary" className="text-[10px]">Passivo</Badge>
                <Badge variant="outline" className="text-[10px]">NEX 65%</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                1x/rodada: ação livre para se aproximar de aliado machucado/morrendo. 
                Ao curar: você e o aliado recebem +5 Defesa até seu próximo turno. 
                Carregar aliados custa metade do espaço.
              </p>
              <div className="flex items-center gap-2 mt-1 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span className="text-xs text-emerald-300">
                  +{onHealEffects.length > 0 ? onHealEffects[0].targetDefenseBonus : 5} Defesa ao curar (você e aliado)
                  {onHealEffects.length > 0 && (
                    <span className="text-muted-foreground ml-1">(via SUE)</span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* NEX 99% - Reanimação */}
          {hasReanimacao && (
            <div className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  <span className="font-medium text-sm">Reanimação</span>
                  <Badge variant="outline" className="text-[10px]">NEX 99%</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">10 PE</Badge>
                  <Badge variant="secondary" className="text-[10px]">1x/cena</Badge>
                  <Button
                    size="sm"
                    variant={reanimacaoUsedThisScene ? "outline" : peCurrent >= 10 ? "default" : "outline"}
                    disabled={peCurrent < 10 || reanimacaoUsedThisScene}
                    onClick={handleReanimacao}
                    className="h-7 text-xs"
                  >
                    {reanimacaoUsedThisScene ? 'Usado' : 'Usar'}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Ação completa. Traz de volta à vida um personagem que morreu nesta cena 
                (exceto morte por dano massivo).
                {resurrectAbilities.length > 0 && (
                  <span className="text-emerald-400 ml-1">(via SUE)</span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drawer para configurar dados extras do Paramédico */}
      <Drawer open={showParamedicoDrawer} onOpenChange={setShowParamedicoDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-emerald-400" />
              Paramédico
              {sueHealing && (
                <Badge variant="secondary" className="text-[10px]">SUE</Badge>
              )}
            </DrawerTitle>
            <DrawerDescription>
              Cure {healingDice.formula} PV base. Adicione dados extras gastando +1 PE cada.
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 space-y-4">
            {/* Seletor de dados extras */}
            <div className="space-y-2">
              <Label className="text-sm">Dados extras de cura (+1 PE cada)</Label>
              <div className="flex items-center gap-3">
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

            {/* Resumo */}
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Dados de cura:</span>
                <span className="font-bold text-emerald-400">
                  {healingDice.base + extraDice}d10
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Custo total:</span>
                <span className="font-bold">
                  {paramedicoCost} PE
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>PE disponível:</span>
                <span>{peCurrent} PE</span>
              </div>
              {/* Mostra bônus de defesa se Resgate estiver desbloqueado */}
              {hasResgate && onHealEffects.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Bônus de Resgate:</span>
                  <span className="font-bold text-emerald-400">
                    +{onHealEffects[0].targetDefenseBonus} Defesa
                  </span>
                </div>
              )}
            </div>
          </div>

          <DrawerFooter>
            <Button 
              onClick={handleUseParamedico}
              disabled={peCurrent < paramedicoCost}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Heart className="h-4 w-4 mr-2" />
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