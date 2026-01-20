/**
 * MobileOverviewTab - Tab de visão geral extraída do MobileCharacterSheet
 * Exibe HP, PE, SAN, atributos, combate e condições
 */

import { memo, useCallback, useMemo } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedProgress } from '@/components/ui/animated-progress';
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
import { BonusSummaryCard } from '../BonusSummaryCard';
import { ClassPowerBonusesPanel } from '../ClassPowerBonusesPanel';
import { RoundControlPanel } from '../RoundControlPanel';
import { getPELimitByNex } from '@/lib/dice-roller';

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
  };
  // Condições separadas do character para evitar conflito de tipos
  conditions: ActiveCondition[];
  originName?: string;
  trackName?: string;
  bonusSummary: any; // Tipo completo do BonusSummary
  totalDefense: number;
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
  };
  onOpenDiceRoller: () => void;
  onOpenRest: () => void;
  onLevelUp: () => void;
  onEditStats: () => void;
  onOpenCombat: (weapon: WeaponEntry) => void;
  onRollInitiative: () => void;
  onClearHistory: () => void;
  onRemoveRoll: (id: string) => void;
  onConditionsChange: (conditions: ActiveCondition[]) => void;
  onDamageFromCondition?: (damage: number, isVerdadeiro: boolean) => void;
  onCharacterDeath?: () => void;
}

export const MobileOverviewTab = memo(function MobileOverviewTab({
  character,
  conditions,
  originName,
  trackName,
  bonusSummary,
  totalDefense,
  defenseBonuses,
  equippedWeapons,
  weaponBuffs,
  rollHistory,
  attributeValidation,
  especialistaArmaGroups = [],
  onOpenDiceRoller,
  onOpenRest,
  onLevelUp,
  onEditStats,
  onOpenCombat,
  onRollInitiative,
  onClearHistory,
  onRemoveRoll,
  onConditionsChange,
  onDamageFromCondition,
  onCharacterDeath,
  roundTracking,
}: MobileOverviewTabProps) {
  const peLimit = getPELimitByNex(character.nex);
  
  // Estados críticos
  const hpPercent = (character.hp_current / character.hp_max) * 100;
  const sanPercent = (character.san_current / character.san_max) * 100;
  const isHpLow = hpPercent <= 25;
  const isSanLow = sanPercent <= 30;

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
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <TooltipProvider delayDuration={300}>
            {/* Botão Rolar Dados */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenDiceRoller}
                  className="flex-1 text-xs"
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
                  className="flex-1 text-xs"
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
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">RECURSOS</span>
          <Button variant="ghost" size="sm" onClick={onEditStats} className="h-6 text-[10px]">
            Editar
          </Button>
        </div>

        {/* HP */}
        <div className="flex items-center gap-2">
          <Heart className={cn("w-4 h-4 flex-shrink-0", isHpLow ? "text-destructive" : "text-hp")} />
          <div className="flex-1">
            <AnimatedProgress value={character.hp_current} max={character.hp_max} variant="hp" size="sm" />
          </div>
          <span className={cn("text-xs font-display w-14 text-right", isHpLow ? "text-destructive" : "text-hp")}>
            {character.hp_current}/{character.hp_max}
          </span>
        </div>

        {/* PE */}
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-pe flex-shrink-0" />
          <div className="flex-1">
            <AnimatedProgress value={character.pe_current} max={character.pe_max} variant="pe" size="sm" />
          </div>
          <span className="text-xs font-display text-pe w-14 text-right">
            {character.pe_current}/{character.pe_max}
          </span>
        </div>

        {/* SAN */}
        <div className="flex items-center gap-2">
          <Brain className={cn("w-4 h-4 flex-shrink-0", isSanLow ? "text-paranormal" : "text-san")} />
          <div className="flex-1">
            <AnimatedProgress value={character.san_current} max={character.san_max} variant="san" size="sm" />
          </div>
          <span className={cn("text-xs font-display w-14 text-right", isSanLow ? "text-paranormal" : "text-san")}>
            {character.san_current}/{character.san_max}
          </span>
        </div>

        {/* Stats rápidos */}
        <div className="flex justify-between pt-2 mt-2 border-t border-border text-xs">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
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
                    {bonusSummary.defense?.total > 0 && (
                      <motion.span 
                        initial={{ opacity: 0, x: -3 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -3 }}
                        className="text-[9px] text-success"
                      >
                        (+{bonusSummary.defense.total})
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <p className="font-medium">Defesa: {totalDefense}</p>
                  <p className="text-muted-foreground">Base (10 + AGI): {character.defense}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center gap-1">
            <Footprints className="w-3 h-3 text-muted-foreground" />
            <span>{character.movement}m</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-pe" />
            <span>{peLimit} PE/turno</span>
          </div>
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

      {/* Painel de Combate Mobile */}
      {equippedWeapons.length > 0 && (
        <MobileCombatPanel
          weapons={equippedWeapons}
          weaponBuffs={weaponBuffs}
          agility={character.agility}
          onWeaponClick={onOpenCombat}
          onRollInitiative={onRollInitiative}
          especialistaArmaGroups={especialistaArmaGroups}
        />
      )}

      {/* Gerenciador de Condições Mobile */}
      <MobileConditionManager
        conditions={conditions}
        onConditionsChange={onConditionsChange}
        onDamageFromCondition={onDamageFromCondition}
        onCharacterDeath={onCharacterDeath}
        characterName={character.name}
      />
    </motion.div>
  );
});

export default MobileOverviewTab;
