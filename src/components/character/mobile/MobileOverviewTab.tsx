/**
 * MobileOverviewTab - Tab de visão geral extraída do MobileCharacterSheet
 * Exibe HP, PE, SAN, atributos, combate e condições
 */

import { memo, useCallback, useMemo } from 'react';
import type { PrepareTurnApplication } from '../ConditionTurnResolver';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Swords, 
  Dices, 
  Heart,
  Zap,
  Brain,
  Shield,
  Footprints,
  Moon,
  ArrowUp,
  Sparkles,
  Edit2,
  Weight,
  AlertTriangle,
} from '@/components/icons/ordem-icons';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DefenseBonusBreakdown } from '@/hooks/useDefenseBonuses';
import { Progress } from '@/components/ui/progress';
import { CombatStatsCard } from '../CombatStatsCard';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';
import { MobileCombatPanel, type WeaponEntry } from './MobileCombatPanel';
import { MobileRollHistory, useRollHistory, type RollHistoryEntry } from './MobileRollHistory';
import { MobileConditionManager, type ActiveCondition } from './MobileConditionManager';
import { ActiveAdvancedBonusesBar } from '../ActiveAdvancedBonusesBar';
import { MaquinaDeMatarIndicator } from '../MaquinaDeMatarIndicator';
import { AniquiladorPassivesIndicator } from '../AniquiladorPassivesIndicator';
import { BonusSummaryCard } from '../BonusSummaryCard';
import { ClassPowerBonusesPanel } from '../ClassPowerBonusesPanel';
import { RoundControlPanel } from '../RoundControlPanel';
import { MobileClassPowersPanel } from './MobileClassPowersPanel';
import { MobileParanormalPowersActivationPanel } from './MobileParanormalPowersActivationPanel';
import { getPELimitByNex } from '@/lib/dice-roller';
import type { SavedParanormalPower, ParanormalElement } from '@/lib/paranormal-powers';

interface MobileOverviewTabProps {
  character: {
    id: string;
    name: string;
    class: string;
    origin: string;
    nex: number;
    patent: string;
    photo_url?: string | null;
    hp_current: number;
    hp_max: number;
    pe_current: number;
    pe_max: number;
    san_current: number;
    san_max: number;
    defense: number;
    movement: number;
    agility: number;
    strength: number;
    intellect: number;
    presence: number;
    vigor: number;
    class_track?: string | null;
  };
  // Condições separadas do character para evitar conflito de tipos
  conditions: ActiveCondition[];
  originName?: string;
  trackName?: string;
  bonusSummary: any; // Tipo completo do BonusSummary
  totalDefense: number;
  armorSpeedPenalty?: number; // Penalidade de deslocamento da armadura
  /** Status de carga do inventário */
  loadStatus?: {
    currentLoad: number;
    maxCapacity: number;
    isOverloaded: boolean;
    hasInventarioOtimizado?: boolean;
  };
  defenseBonuses: any;
  equippedWeapons: WeaponEntry[];
  weaponBuffs: any[];
  rollHistory: RollHistoryEntry[];
  attributeValidation: {
    isValid: boolean;
    normalized: {
      agility: number | null;
      strength: number | null;
      intellect: number | null;
      presence: number | null;
      vigor: number | null;
    };
  };
  /** Grupos de armas escolhidos em Especialista em Arma */
  especialistaArmaGroups?: string[];
  /** Round tracking props */
  roundTracking?: {
    currentRound: number;
    usedAbilitiesThisRound: string[];
    peSpentThisRound: number;
    peSpentBreakdown: Array<{ abilityName: string; cost: number }>;
    advanceRound: () => void;
    resetCombat: () => void;
    trackPESpent: (abilityName: string, cost: number) => void;
  };
  /** Poderes de classe (para painel de poderes ativáveis) */
  classPowers?: unknown[];
  /** Habilidades (para painel de poderes ativáveis) */
  abilities?: Record<string, unknown>;
  /** Poderes paranormais do personagem */
  paranormalPowers?: SavedParanormalPower[] | null;
  /** Elemento de afinidade */
  elementalAffinity?: ParanormalElement | string | null;
  /** Se a afinidade está ativa (NEX >= 50%) */
  affinityActive?: boolean;
  /** Arma favorita selecionada (para indicador Aniquilador) */
  favoriteWeapon?: {
    id: string;
    name: string;
    damage?: string;
    category?: number;
    effectiveCategory?: number;
  } | null;
  /** Callback para alterar HP */
  onHPChange?: (newHP: number) => void;
  onResourcesChange?: (stats: { hp: number; pe: number; san: number }) => void | boolean | Promise<void | boolean>;
  onOpenDiceRoller: () => void;
  onOpenRest: () => void;
  onLevelUp: () => void;
  onEditStats: () => void;
  onOpenCombat: (weapon: WeaponEntry) => void;
  onRollInitiative: () => void;
  onClearHistory: () => void;
  onRemoveRoll: (id: string) => void;
  onConditionsChange: (conditions: ActiveCondition[]) => void;
  prepareTurnApplication?: PrepareTurnApplication;
  onDamageFromCondition?: (damage: number, isVerdadeiro: boolean) => void;
  onCharacterDeath?: () => void;
  onPEChange: (newPE: number) => void;
  /** Callback para ativar/desativar bônus condicionais */
  onToggleConditionalBonus?: (bonusId: string, active: boolean) => void;
  /** Lista de bônus condicionais ativos */
  activeConditionalBonuses?: string[];
}

export const MobileOverviewTab = memo(function MobileOverviewTab({
  character,
  conditions,
  originName,
  trackName,
  bonusSummary,
  totalDefense,
  armorSpeedPenalty = 0,
  loadStatus,
  defenseBonuses,
  equippedWeapons,
  weaponBuffs,
  rollHistory,
  attributeValidation,
  especialistaArmaGroups = [],
  classPowers = [],
  abilities = {},
  paranormalPowers,
  elementalAffinity,
  affinityActive = false,
  favoriteWeapon,
  onHPChange,
  onResourcesChange,
  onOpenDiceRoller,
  onOpenRest,
  onLevelUp,
  onEditStats,
  onOpenCombat,
  onRollInitiative,
  onClearHistory,
  onRemoveRoll,
  onConditionsChange,
  prepareTurnApplication,
  onDamageFromCondition,
  onCharacterDeath,
  onPEChange,
  onToggleConditionalBonus,
  activeConditionalBonuses = [],
  roundTracking,
}: MobileOverviewTabProps) {
  const peLimit = getPELimitByNex(character.nex);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-3 mt-3"
    >
      {/* Controle de Rodada - compacto para mobile */}
      {roundTracking && (
        <RoundControlPanel
          currentRound={roundTracking.currentRound}
          usedAbilitiesThisRound={roundTracking.usedAbilitiesThisRound}
          peSpentThisRound={roundTracking.peSpentThisRound}
          peSpentBreakdown={roundTracking.peSpentBreakdown}
          onAdvanceRound={roundTracking.advanceRound}
          onResetCombat={roundTracking.resetCombat}
          compact
        />
      )}
      {/* Header compacto com foto e stats principais */}
      <div className="ordo-panel p-3">
        <div className="flex gap-3">
          {/* Foto pequena */}
          <div className="w-16 h-16 rounded-lg bg-secondary/20 border border-border flex-shrink-0 overflow-hidden">
            {character.photo_url ? (
              <img 
                src={character.photo_url} 
                alt={character.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-8 h-8 text-foreground/40" />
              </div>
            )}
          </div>

          {/* Info básica */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">
                  {character.class} • {originName || character.origin}
                </p>
                {trackName && (
                  <p className="text-[9px] text-primary/70">{trackName}</p>
                )}
              </div>
              <div className="text-right">
                <span className="font-display text-xl text-primary">
                  {character.nex}%
                </span>
                <p className="text-[9px] text-muted-foreground">NEX</p>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">
              {character.patent}
            </p>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
          <TooltipProvider delayDuration={300}>
            {/* Botão Rolar Dados */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenDiceRoller}
                  className="flex-1 min-w-[90px] text-xs"
                >
                  <Dices className="w-4 h-4 mr-1" />
                  Rolar
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Abrir rolador de dados para testes e rolagens</p>
              </TooltipContent>
            </Tooltip>

            {/* Botão Descanso */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenRest}
                  className="flex-1 min-w-[90px] text-xs"
                >
                  <Moon className="w-4 h-4 mr-1" />
                  Descanso
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Descanso curto ou longo para recuperar PV, PE e SAN</p>
              </TooltipContent>
            </Tooltip>

            {/* Histórico de Rolagens */}
            <MobileRollHistory
              rolls={rollHistory}
              onClearHistory={onClearHistory}
              onRemoveRoll={onRemoveRoll}
            />

            {/* Botão de Editar Perfil */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEditStats}
                  aria-label="Editar ficha"
                  className="text-xs"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Editar dados pessoais, atributos e perícias</p>
              </TooltipContent>
            </Tooltip>

            {/* Botão de Level Up (apenas se não estiver no máximo) */}
            {character.nex < 99 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLevelUp}
                    aria-label="Subir de NEX"
                    className="text-xs text-primary border-primary/50"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Subir de NEX e escolher novos poderes</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>

      {/* Indicador de Passivas do Aniquilador (A Favorita, Técnica Secreta, Máquina de Matar) - versão compacta para mobile */}
      <AniquiladorPassivesIndicator
        classTrack={character.class_track}
        nex={character.nex}
        favoriteWeapon={favoriteWeapon}
        variant="compact"
        className="ordo-panel"
      />

      {/* Barra de bônus avançados ativos */}
      {bonusSummary.conditionalBonuses?.length > 0 && (
        <ActiveAdvancedBonusesBar
          activeBonuses={bonusSummary.conditionalBonuses.map((b: any) => ({
            id: b.id,
            name: b.name,
            effect: b.effects[0] || '',
            active: b.active,
          }))}
          className="ordo-panel p-3"
        />
      )}

      {/* Barras de recursos */}
      <div className="ordo-panel p-3 space-y-2">
        <CombatStatsCard hpCurrent={character.hp_current} hpMax={character.hp_max}
          peCurrent={character.pe_current} peMax={character.pe_max}
          sanCurrent={character.san_current} sanMax={character.san_max}
          onStatsChange={onResourcesChange} className="border-0 p-0 shadow-none" />

        {/* Stats rápidos */}
        <div className="flex justify-between pt-2 mt-2 border-t border-border text-xs">
          <Popover>
              <PopoverTrigger asChild>
                <button type="button" aria-label="Detalhes da Defesa" className="flex items-center gap-1 cursor-help">
                  <Shield className="w-3 h-3 text-muted-foreground" />
                  <span>DEF </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={totalDefense}
                      initial={{ y: -5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 5, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {totalDefense}
                    </motion.span>
                  </AnimatePresence>
                  <AnimatePresence>
                    {bonusSummary.defense?.total !== 0 && (
                      <motion.span 
                        initial={{ opacity: 0, x: -3 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -3 }}
                        className={cn('text-[9px]', bonusSummary.defense.total > 0 ? 'text-success' : 'text-destructive')}
                      >
                        ({bonusSummary.defense.total > 0 ? '+' : ''}{bonusSummary.defense.total})
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </PopoverTrigger>
              <PopoverContent side="bottom" className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <p className="font-medium">Defesa: {totalDefense}</p>
                  <p className="text-muted-foreground">Base (10 + AGI): {character.defense}</p>
                  {bonusSummary.defense?.breakdown?.map((entry: DefenseBonusBreakdown, index: number) => (
                    <p key={`${entry.source}-${index}`} className={cn('text-xs', (!entry.active || entry.excluded) && 'text-muted-foreground')}>
                      {entry.source}: {entry.bonus > 0 ? '+' : ''}{entry.bonus}
                      {entry.excluded ? ` (não acumula${entry.excludedReason ? `: ${entry.excludedReason}` : ''})` : !entry.active ? ' (inativo)' : ''}
                    </p>
                  ))}
                </div>
              </PopoverContent>
          </Popover>
          {/* Deslocamento com tooltip de breakdown e indicador de sobrecarga */}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center gap-1 cursor-help",
                  loadStatus?.isOverloaded && "text-destructive"
                )}>
                  <Footprints className={cn(
                    "w-3 h-3",
                    loadStatus?.isOverloaded ? "text-destructive" : "text-muted-foreground"
                  )} />
                  <span className={cn(loadStatus?.isOverloaded && "font-medium")}>
                    {(() => {
                      const baseMovement = (character.movement || 9) + (bonusSummary?.movementBonus || 0);
                      return loadStatus?.isOverloaded ? Math.max(0, baseMovement - 3) : baseMovement;
                    })()}m
                  </span>
                  {/* Indicador visual de penalidade por sobrecarga */}
                  {loadStatus?.isOverloaded && (
                    <span className="text-[9px] text-destructive flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      -3
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1.5 text-xs">
                  <p className="font-medium flex justify-between">
                    <span>Deslocamento</span>
                    <span className={cn(loadStatus?.isOverloaded && "text-destructive")}>
                      {(() => {
                        const baseMovement = (character.movement || 9) + (bonusSummary?.movementBonus || 0);
                        return loadStatus?.isOverloaded ? Math.max(0, baseMovement - 3) : baseMovement;
                      })()}m
                    </span>
                  </p>
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground flex justify-between">
                      <span>Base</span>
                      <span>9m</span>
                    </p>
                    {bonusSummary?.movementBreakdown?.map((entry: { source: string; value: number }, idx: number) => (
                      <p key={idx} className="flex justify-between text-primary">
                        <span>{entry.source}</span>
                        <span className="font-medium">+{entry.value}m</span>
                      </p>
                    ))}
                    {armorSpeedPenalty && armorSpeedPenalty > 0 && (
                      <p className="flex justify-between text-destructive">
                        <span>Armadura</span>
                        <span className="font-medium">-{armorSpeedPenalty}m</span>
                      </p>
                    )}
                    {loadStatus?.isOverloaded && (
                      <p className="flex justify-between text-destructive font-medium">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Sobrecarga
                        </span>
                        <span>-3m</span>
                      </p>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-pe" />
            <span>{peLimit} PE/turno</span>
          </div>
          {/* Indicador de Carga do Inventário */}
          {loadStatus && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-1 cursor-help",
                    loadStatus.isOverloaded && "text-destructive"
                  )}>
                    <Weight className="w-3 h-3" />
                    <span className={cn(
                      loadStatus.isOverloaded && "font-medium"
                    )}>
                      {loadStatus.currentLoad}/{loadStatus.maxCapacity}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-2 text-xs">
                    <p className="font-medium flex justify-between">
                      <span>Carga</span>
                      <span className={cn(
                        loadStatus.isOverloaded && "text-destructive"
                      )}>
                        {loadStatus.currentLoad}/{loadStatus.maxCapacity} espaços
                      </span>
                    </p>
                    <Progress 
                      value={Math.min((loadStatus.currentLoad / loadStatus.maxCapacity) * 100, 100)} 
                      className={cn(
                        "h-1.5",
                        loadStatus.isOverloaded && "bg-destructive/20"
                      )}
                    />
                    <div className="space-y-0.5 pt-1 border-t border-border/50">
                      {loadStatus.hasInventarioOtimizado ? (
                        <>
                          <p className="text-primary flex justify-between">
                            <span>Inventário Otimizado</span>
                            <span className="text-muted-foreground text-[10px]">(FOR + INT) × 5</span>
                          </p>
                          <p className="text-muted-foreground flex justify-between">
                            <span>Capacidade total</span>
                            <span className="text-foreground">{loadStatus.maxCapacity}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 italic">
                            -1 espaço por item (mín. 1)
                          </p>
                        </>
                      ) : (
                        <p className="text-muted-foreground flex justify-between">
                          <span>Capacidade (FOR × 5)</span>
                          <span>{loadStatus.maxCapacity}</span>
                        </p>
                      )}
                    </div>
                    {loadStatus.isOverloaded && (
                      <div className="flex items-center gap-1.5 text-destructive pt-1 border-t border-destructive/30">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Sobrecarregado! -5 FOR/AGI/VIG, -3m deslocamento</span>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Atributos */}
      <MobileCollapsibleSection 
        title="ATRIBUTOS" 
        icon={<User className="w-4 h-4" />}
        defaultOpen={true}
      >
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { label: 'AGI', value: attributeValidation.normalized.agility, color: 'text-primary' },
            { label: 'FOR', value: attributeValidation.normalized.strength, color: 'text-destructive' },
            { label: 'INT', value: attributeValidation.normalized.intellect, color: 'text-secondary' },
            { label: 'PRE', value: attributeValidation.normalized.presence, color: 'text-paranormal' },
            { label: 'VIG', value: attributeValidation.normalized.vigor, color: 'text-accent' },
          ].map(attr => (
            <button 
              key={attr.label} 
              className="p-2 bg-muted/30 rounded hover:bg-muted/50 transition-colors active:bg-muted/70"
              onClick={onOpenDiceRoller}
              disabled={attr.value === null}
            >
              <p className="text-[10px] text-muted-foreground">{attr.label}</p>
              <p className={cn("font-display text-xl", attr.value === null ? "text-muted-foreground" : attr.color)}>
                {attr.value !== null ? attr.value : '—'}
              </p>
            </button>
          ))}
        </div>
      </MobileCollapsibleSection>

      {/* Combate */}
      <MobileCollapsibleSection 
        title="COMBATE" 
        icon={<Swords className="w-4 h-4" />}
      >
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ações por turno:</span>
            <span className="text-xs">1P + 1M + 1R</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Limite PE/turno:</span>
            <span className="text-pe font-display">{peLimit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Crítico:</span>
            <span className="text-primary font-display">20</span>
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground mb-1">RESISTÊNCIAS</p>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              <div className="text-center p-1 bg-muted/30 rounded">
                <p className="text-muted-foreground">Fort</p>
                <p className="font-display">
                  {character.vigor}d
                  {defenseBonuses?.resistances?.fortitude > 0 && (
                    <span className="text-success ml-0.5">+{defenseBonuses.resistances.fortitude}</span>
                  )}
                </p>
              </div>
              <div className="text-center p-1 bg-muted/30 rounded">
                <p className="text-muted-foreground">Ref</p>
                <p className="font-display">
                  {character.agility}d
                  {defenseBonuses?.resistances?.reflexos > 0 && (
                    <span className="text-success ml-0.5">+{defenseBonuses.resistances.reflexos}</span>
                  )}
                </p>
              </div>
              <div className="text-center p-1 bg-muted/30 rounded">
                <p className="text-muted-foreground">Von</p>
                <p className="font-display">
                  {character.presence}d
                  {defenseBonuses?.resistances?.vontade > 0 && (
                    <span className="text-success ml-0.5">+{defenseBonuses.resistances.vontade}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </MobileCollapsibleSection>

      {/* Resumo de Bônus Ativos */}
      <BonusSummaryCard summary={bonusSummary} compact />

      {/* Painel de Bônus de Poderes de Classe */}
      {bonusSummary.classPowerBonuses && (
        <ClassPowerBonusesPanel bonuses={bonusSummary.classPowerBonuses} compact />
      )}

      {/* Painel de Poderes de Classe Ativáveis (Incansável, Segurar o Gatilho, etc.) */}
      <MobileClassPowersPanel
        classPowers={classPowers}
        abilities={abilities}
        nex={character.nex}
        peCurrent={character.pe_current}
        onPEChange={onPEChange}
        onTrackPESpent={roundTracking?.trackPESpent}
        onToggleConditionalBonus={onToggleConditionalBonus}
        activeConditionalBonuses={activeConditionalBonuses}
      />

      {/* Painel de Poderes Paranormais Ativáveis (Surto Temporal, Manipular Entropia, etc.) */}
      <MobileParanormalPowersActivationPanel
        paranormalPowers={paranormalPowers}
        nex={character.nex}
        elementalAffinity={elementalAffinity as ParanormalElement | null}
        affinityActive={affinityActive}
        hpCurrent={character.hp_current}
        peCurrent={character.pe_current}
        onHPChange={onHPChange || (() => {})}
        onPEChange={onPEChange}
        onTrackPESpent={roundTracking?.trackPESpent}
        onToggleConditionalBonus={onToggleConditionalBonus}
        activeConditionalBonuses={activeConditionalBonuses}
      />

      {/* Painel de Combate Mobile - sempre exibe, mesmo sem armas (ataque desarmado) */}
      <MobileCombatPanel
        weapons={equippedWeapons}
        weaponBuffs={weaponBuffs}
        agility={character.agility}
        strength={character.strength}
        onWeaponClick={onOpenCombat}
        onRollInitiative={onRollInitiative}
        especialistaArmaGroups={especialistaArmaGroups}
        unarmedDamage={bonusSummary?.unarmedDamage}
        hasArtistaMarcial={!!bonusSummary?.unarmedDamage}
      />

      {/* Gerenciador de Condições Mobile */}
      <MobileConditionManager
        conditions={conditions}
        vigor={character.vigor}
        prepareTurnApplication={prepareTurnApplication}
        onConditionsChange={onConditionsChange}
        onDamageFromCondition={onDamageFromCondition}
        onCharacterDeath={onCharacterDeath}
        characterName={character.name}
      />
    </motion.div>
  );
});

export default MobileOverviewTab;
