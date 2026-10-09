/**
 * MedicoDeCampoPanel - Painel unificado responsivo da trilha Médico de Campo
 * 
 * Componente responsivo que adapta a UI para desktop e mobile usando useIsMobile().
 * Usa o hook useMedicoDeCampoTrack para lógica compartilhada.
 * 
 * @module tracks/especialista/MedicoDeCampoPanel
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/icons/ordem-icons';
import { DrawerClose } from '@/components/ui/drawer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCollapsibleSection } from '../../mobile/MobileCollapsibleSection';
import {
  MobileDrawer,
  MobileDrawerContent,
  MobileDrawerHeader,
  MobileDrawerTitle,
  MobileDrawerDescription,
  MobileDrawerBody,
  MobileDrawerFooter,
} from '@/components/ui/mobile-drawer';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { 
  useMedicoDeCampoTrack,
  type UseMedicoDeCampoTrackProps 
} from './useMedicoDeCampoTrack';
import { HealingRollModal } from '../../HealingRollModal';
import { EquipeTraumaModal, type CampaignAlly } from './EquipeTraumaModal';
import type { ActiveCondition } from '@/hooks/character/useConditions';

// =====================================================
// Props do Componente
// =====================================================

export interface MedicoDeCampoPanelProps extends UseMedicoDeCampoTrackProps {
  /** Trilha de Versatilidade do personagem (NEX 50%) */
  versatilityTrack?: { trackId: string; abilityId: string } | null;
  /** ID do personagem */
  characterId?: string;
  /** Nome do personagem */
  characterName?: string;
  /** Condições ativas do personagem */
  characterConditions?: ActiveCondition[];
  /** Aliados de campanha (modo campanha) */
  campaignAllies?: CampaignAlly[];
  /** Callback para remover condição */
  onRemoveCondition?: (conditionId: string) => Promise<boolean>;
}

// =====================================================
// Componente Principal
// =====================================================

import React from 'react';

/**
 * Comparação customizada para evitar re-renders desnecessários.
 * Ignora peCurrent pois mudanças de PE não afetam a estrutura do painel.
 */
function arePropsEqual(prev: MedicoDeCampoPanelProps, next: MedicoDeCampoPanelProps): boolean {
  return (
    prev.classTrack === next.classTrack &&
    prev.nex === next.nex &&
    prev.reanimacaoUsedThisScene === next.reanimacaoUsedThisScene &&
    prev.onPEChange === next.onPEChange &&
    prev.versatilityTrack?.trackId === next.versatilityTrack?.trackId &&
    prev.versatilityTrack?.abilityId === next.versatilityTrack?.abilityId
  );
}

function MedicoDeCampoPanelComponent(props: MedicoDeCampoPanelProps) {
  const isMobile = useIsMobile();
  const track = useMedicoDeCampoTrack(props);

  // Não renderiza se não for Médico de Campo
  if (!track.isMedicoCampo) return null;

  // ===== COMPONENTE DE CONTEÚDO =====
  
  const TrackContent = () => (
    <div className="space-y-3">
      {/* Indicador de bônus de suporte do SUE (desktop only) */}
      {!isMobile && track.sueSupport && (
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
          <p className="text-xs font-medium text-emerald-300">Bônus de Suporte (SUE)</p>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-300">
              +{track.targetDefenseBonus} Defesa ao curar
            </Badge>
          </div>
        </div>
      )}
      
      {/* NEX 10% - Paramédico */}
      {track.hasParamedico && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-900/30 border border-emerald-500/20">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Heart className="h-4 w-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>Paramédico</span>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                {track.healingDice.formula} PV • 2+ PE
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant={track.canAffordParamedico ? "default" : "outline"}
            disabled={props.peCurrent < 2}
            onClick={track.handleOpenParamedico}
            className="shrink-0"
          >
            Usar
          </Button>
        </div>
      )}

      {/* NEX 40% - Equipe de Trauma */}
      {track.hasEquipeTrauma && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-blue-900/30 border border-blue-500/20">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Activity className="h-4 w-4 text-blue-400 shrink-0" />
            <div className="min-w-0">
              <span className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>Equipe de Trauma</span>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                Remove condição • 2 PE
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant={track.canAffordEquipeTrauma ? "default" : "outline"}
            disabled={!track.canAffordEquipeTrauma}
            onClick={track.handleOpenEquipeTrauma}
            className="shrink-0"
          >
            Usar
          </Button>
        </div>
      )}

      {/* NEX 65% - Resgate (Passivo) */}
      {track.hasResgate && (
        <div className={`p-2 rounded-lg bg-emerald-900/20 border border-emerald-500/10 ${isMobile ? '' : 'space-y-2'}`}>
          <div className="flex items-center gap-2">
            <ShieldPlus className="h-4 w-4 text-emerald-300" />
            <span className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>Resgate</span>
            <Badge variant="secondary" className="text-[10px]">Passivo</Badge>
            {!isMobile && <Badge variant="outline" className="text-[10px]">NEX 65%</Badge>}
          </div>
          <p className={`${isMobile ? 'text-xs mt-1' : 'text-xs'} text-muted-foreground`}>
            {isMobile 
              ? 'Ação livre para aliado machucado. +5 Defesa ao curar.'
              : '1x/rodada: ação livre para se aproximar de aliado machucado/morrendo. Ao curar: você e o aliado recebem +5 Defesa até seu próximo turno.'
            }
          </p>
          {!isMobile && (
            <div className="flex items-center gap-2 mt-1 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span className="text-xs text-emerald-300">
                +{track.targetDefenseBonus} Defesa ao curar (você e aliado)
              </span>
            </div>
          )}
        </div>
      )}

      {/* NEX 99% - Reanimação */}
      {track.hasReanimacao && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-yellow-900/30 border border-yellow-500/20">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Sparkles className="h-4 w-4 text-yellow-400 shrink-0" />
            <div className="min-w-0">
              <span className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>Reanimação</span>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                10 PE • 1x/cena
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant={props.reanimacaoUsedThisScene ? "outline" : track.canAffordReanimacao ? "default" : "outline"}
            disabled={!track.canAffordReanimacao}
            onClick={track.handleReanimacao}
            className="shrink-0"
          >
            {props.reanimacaoUsedThisScene ? 'Usado' : 'Usar'}
          </Button>
        </div>
      )}
    </div>
  );

  // ===== DRAWER DE PARAMÉDICO =====
  
  const ParamedicoDrawerContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm">
          Dados extras de cura (+1 PE cada) — máx {track.maxExtraDice}
        </Label>
        <div className="flex items-center gap-3 justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => track.setExtraDice(Math.max(0, track.extraDice - 1))}
            disabled={track.extraDice === 0}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-2xl font-bold w-12 text-center">{track.extraDice}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => track.setExtraDice(Math.min(track.extraDice + 1, track.maxExtraDice))}
            disabled={!track.canAddExtraDice}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {track.maxExtraDice === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            NEX 40%+ para desbloquear dados extras
          </p>
        )}
      </div>

      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
        <div className="flex justify-between text-sm">
          <span>Cura:</span>
          <span className="font-bold text-emerald-400">{track.healingDice.base + track.extraDice}d10</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Custo:</span>
          <span className="font-bold">{track.paramedicoCost} PE</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Máximo no NEX atual:</span>
          <span>{track.healingDice.base + track.maxExtraDice}d10 ({2 + track.maxExtraDice} PE)</span>
        </div>
      </div>
    </div>
  );

  // ===== RENDERIZAÇÃO MOBILE =====
  
  if (isMobile) {
    return (
      <>
        <MobileCollapsibleSection
          title="Médico de Campo"
          icon={<Stethoscope className="h-4 w-4 text-emerald-400" />}
          badge={`NEX ${props.nex}%`}
        >
          <TrackContent />
        </MobileCollapsibleSection>

        <MobileDrawer open={track.showParamedicoDrawer} onOpenChange={track.setShowParamedicoDrawer}>
          <MobileDrawerContent maxHeight="md">
            <MobileDrawerHeader>
              <MobileDrawerTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-emerald-400" />
                Paramédico
              </MobileDrawerTitle>
              <MobileDrawerDescription>
                Cure {track.healingDice.formula} PV base. +1 PE por dado extra.
              </MobileDrawerDescription>
            </MobileDrawerHeader>
            <MobileDrawerBody useScrollArea={false}>
              <ParamedicoDrawerContent />
            </MobileDrawerBody>
            <MobileDrawerFooter>
              <Button 
                onClick={track.handleUseParamedico}
                disabled={!track.canAffordParamedico}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
              >
                Curar {track.healingDice.base + track.extraDice}d10 PV
              </Button>
              <DrawerClose asChild>
                <Button variant="ghost" className="w-full h-10">
                  <span className="text-sm">Cancelar</span>
                </Button>
              </DrawerClose>
            </MobileDrawerFooter>
          </MobileDrawerContent>
        </MobileDrawer>

        {/* Modal de Rolagem de Cura (Mobile) */}
        <HealingRollModal
          open={track.showHealingRollModal}
          onOpenChange={track.setShowHealingRollModal}
          diceCount={track.pendingHealConfig?.totalDice ?? track.healingDice.base}
          dieType={10}
          bonusFromOrigin={track.healingBonusFromOrigin.value}
          bonusFromOriginSource={track.healingBonusFromOrigin.source}
          abilityName="Paramédico"
          onApplyHealing={track.handleApplyHealing}
          currentHp={track.pvCurrent}
          maxHp={track.pvMax}
        />

        {/* Modal de Equipe de Trauma (Mobile) */}
        <EquipeTraumaModal
          open={track.showEquipeTraumaModal}
          onOpenChange={track.setShowEquipeTraumaModal}
          characterId={props.characterId ?? ''}
          characterName={props.characterName ?? 'Você'}
          characterConditions={props.characterConditions ?? []}
          campaignAllies={props.campaignAllies}
          onConfirm={track.handleEquipeTrauma}
          hasResgate={track.hasResgate}
          defenseBonus={track.targetDefenseBonus}
          peCost={2}
          canAfford={track.canAffordEquipeTrauma}
        />
      </>
    );
  }

  // ===== RENDERIZAÇÃO DESKTOP =====
  
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
            {track.hasSueData && (
              <Badge variant="secondary" className="text-[10px] ml-auto">
                SUE
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrackContent />
        </CardContent>
      </Card>

      <Drawer open={track.showParamedicoDrawer} onOpenChange={track.setShowParamedicoDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-emerald-400" />
              Paramédico
              {track.hasSueData && <Badge variant="secondary" className="text-[10px]">SUE</Badge>}
            </DrawerTitle>
            <DrawerDescription>
              Cure {track.healingDice.formula} PV base. Adicione dados extras gastando +1 PE cada.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <ParamedicoDrawerContent />
          </div>
          <DrawerFooter>
            <Button 
              onClick={track.handleUseParamedico}
              disabled={!track.canAffordParamedico}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Curar {track.healingDice.base + track.extraDice}d10 PV
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Modal de Rolagem de Cura */}
      <HealingRollModal
        open={track.showHealingRollModal}
        onOpenChange={track.setShowHealingRollModal}
        diceCount={track.pendingHealConfig?.totalDice ?? track.healingDice.base}
        dieType={10}
        bonusFromOrigin={track.healingBonusFromOrigin.value}
        bonusFromOriginSource={track.healingBonusFromOrigin.source}
        abilityName="Paramédico"
        onApplyHealing={track.handleApplyHealing}
        currentHp={track.pvCurrent}
        maxHp={track.pvMax}
      />

      {/* Modal de Equipe de Trauma (Desktop) */}
      <EquipeTraumaModal
        open={track.showEquipeTraumaModal}
        onOpenChange={track.setShowEquipeTraumaModal}
        characterId={props.characterId ?? ''}
        characterName={props.characterName ?? 'Você'}
        characterConditions={props.characterConditions ?? []}
        campaignAllies={props.campaignAllies}
        onConfirm={track.handleEquipeTrauma}
        hasResgate={track.hasResgate}
        defenseBonus={track.targetDefenseBonus}
        peCost={2}
        canAfford={track.canAffordEquipeTrauma}
      />
    </>
  );
}

/** Componente exportado com memoização para otimização de performance */
export const MedicoDeCampoPanel = React.memo(MedicoDeCampoPanelComponent, arePropsEqual);
