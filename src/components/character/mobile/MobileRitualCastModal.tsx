import type { PETurnBudget } from '@/services/pe-turn-budget-service';
import { CastingConcentrationForm } from '@/components/character/CastingConcentrationForm';
import { DEFAULT_CASTING_CONCENTRATION, validateCastingConcentration, type CastingConcentrationContext } from '@/lib/rituals/casting-concentration';
import type { RitualResolutionRoll } from '@/lib/ritual-roll-history';
import type { RitualResistanceBonuses } from '@/lib/rituals/ritual-resistance';
/**
 * MobileRitualCastModal - Modal de conjuração de rituais para mobile
 * Interface compacta com seleção de aprimoramentos como chips
 * Integrado com MobileRitualEffectWizard para processar efeitos automaticamente
 * 
 * ATUALIZADO: Integrado ao Sistema Unificado de Efeitos (SUE)
 */

import { useState, useMemo } from 'react';
import { useRitualConfirmation, type RitualConfirmationResult } from '@/hooks/character/useRitualConfirmation';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  MobileDrawer, 
  MobileDrawerContent, 
  MobileDrawerHeader, 
  MobileDrawerTitle, 
  MobileDrawerDescription,
  MobileDrawerBody,
  MobileDrawerFooter 
} from '@/components/ui/mobile-drawer';
import { MobileButtonGroup } from '@/components/ui/mobile-button-group';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Zap, 
  Sparkles,
  Clock,
  Target,
  Timer,
  Shield,
  Lock,
  Flame,
  Check,
  X,
  Wand2,
  TrendingUp,
  Minus,
  Settings2,
  ArrowUpRight,
  Maximize2,
  FastForward,
  ShieldX,
} from '@/components/icons/ordem-icons';
import { Input } from '@/components/ui/input';

// Ícones para tipos de modificadores de trilha
const MODIFIER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  range: ArrowUpRight,
  area: Maximize2,
  action: FastForward,
  duration: Timer,
  counter: ShieldX,
};
import { cn } from '@/lib/utils';
import { Ritual } from '@/lib/rituals/legacy-exports';
import type { UnifiedRitual } from '@/lib/rituals/types';
import { getElementConfig } from '@/lib/element-config';
import { useRitualValidation, TurnPEState, type RitualBonuses } from '@/hooks';
import { getRitualById } from '@/lib/rituals/ritual-registry';
import { calculateRitualResistanceDT } from '@/lib/rituals/ritual-resistance';
import { MobileRitualEffectWizard } from './MobileRitualEffectWizard';
import { ActiveCondition } from './MobileConditionManager';
import type { AnyDamageType, SustainConfig } from '@/lib/rituals/legacy-exports';

// Efeito de partículas do elemento
function triggerElementParticles(elementHex: string, elementHexLight: string) {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.7 },
    colors: [elementHex, elementHexLight, '#ffffff'],
    ticks: 150,
  });
}

type RitualInput = Ritual | UnifiedRitual;

interface MobileRitualCastModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ritual: RitualInput | null;
  peCurrent: number;
  temporaryPE?: number;
  peBudget?: PETurnBudget;
  peBudgetLoading?: boolean;
  peBudgetError?: string;
  peMax: number;
  isNonOccultist?: boolean;
  nex?: number;
  elementalAffinity?: string | null;
  turnPEState?: TurnPEState;
  onConfirm: (ritual: RitualInput, peCost: number, enhancements: string[], activeModifiers?: string[], counterRitualCost?: number, concentration?: CastingConcentrationContext) => RitualConfirmationResult;
  // Callbacks para efeitos do wizard
  applicationTargetId?: string;
  targetResistanceBonuses?: RitualResistanceBonuses;
  targetAttributes?: { vigor: number; agility: number; presence: number };
  applicationTarget?: React.ReactNode;
  onApplyDamage?: (damage: number, type: AnyDamageType, ignoresRD: boolean) => void | Promise<void>;
  onApplyHealing?: (amount: number, type: 'healing' | 'tempHP') => void | Promise<void>;
  onApplyConditions?: (conditions: ActiveCondition[]) => void | Promise<void>;
  onResolutionRoll?: (result: RitualResolutionRoll) => void;
  onAddWeaponBuff?: (ritual: Ritual, enhancements: string[]) => void | Promise<void>;
  onActivateSustained?: (ritual: Ritual, enhancements: string[], sustain: SustainConfig) => void | Promise<void>;
  // Se true, abre o wizard automaticamente após conjurar
  autoOpenWizard?: boolean;
  // === Bônus do SUE ===
  ritualBonuses?: RitualBonuses | null;
  intellect?: number;
  /** Bônus de limite de PE por turno do SUE (ex: Universitário: Dedicação = +1) */
  peLimitBonus?: number;
  /** Presença de quem conjura; não usa os atributos do alvo para calcular a DT. */
  casterPresence?: number;
}

export function MobileRitualCastModal({
  open,
  onOpenChange,
  ritual,
  peCurrent,
  temporaryPE = 0,
  peBudget,
  peBudgetLoading = false,
  peBudgetError,
  peMax,
  isNonOccultist = false,
  nex = 5,
  elementalAffinity,
  turnPEState,
  onConfirm,
  // Props do wizard
  targetAttributes,
  targetResistanceBonuses,
  applicationTargetId,
  applicationTarget,
  onApplyDamage,
  onApplyHealing,
  onApplyConditions,
  onResolutionRoll,
  onAddWeaponBuff,
  onActivateSustained,
  autoOpenWizard = true,
  // SUE props
  ritualBonuses,
  intellect = 0,
  peLimitBonus = 0,
  casterPresence = 0,
}: MobileRitualCastModalProps) {
  const confirmation = useRitualConfirmation(open);
  const [concentration, setConcentration] = useState(DEFAULT_CASTING_CONCENTRATION);
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>([]);
  // Estado dos modificadores de trilha ativados
  const [activeModifiers, setActiveModifiers] = useState<string[]>([]);
  // Estado para custo do ritual alvo (Anular Ritual)
  const [counterRitualCost, setCounterRitualCost] = useState<number>(0);
  
  // Estado para controlar abertura automática do wizard
  const [wizardEnabled, setWizardEnabled] = useState(autoOpenWizard);
  
  // Estado para o wizard de efeitos
  const [wizardOpen, setWizardOpen] = useState(false);
  const [castRitual, setCastRitual] = useState<Ritual | null>(null);
  const [castEnhancements, setCastEnhancements] = useState<string[]>([]);
  const [castPeCost, setCastPeCost] = useState(0);

  // Hook de validação COM bônus de limite de PE
  const {
    maxCircle,
    peLimitPerTurn,
    validatePECost,
    getAvailableEnhancements,
  } = useRitualValidation(nex, elementalAffinity, peCurrent + temporaryPE, peMax + temporaryPE, peBudget ? { peSpentThisTurn: peBudget.tracked ? peBudget.spent : 0, turnNumber: peBudget.number ?? peBudget.round ?? 0, confirmedLimit: peBudget.ritualLimit, tracked: peBudget.tracked } : turnPEState, peLimitBonus, isNonOccultist);

  const enhancementsWithValidation = useMemo(() => {
    if (!ritual) return [];
    return getAvailableEnhancements(ritual);
  }, [ritual, getAvailableEnhancements]);

  // === INTEGRAÇÃO SUE: Calcula reduções de PE ===
  const sueReduction = useMemo(() => {
    if (!ritualBonuses || !ritual) return 0;
    return ritualBonuses.getPEReductionForRitual(ritual.element, ritual.range);
  }, [ritualBonuses, ritual]);

  // === INTEGRAÇÃO SUE: Calcula bônus de DT ===
  const sueDTBonus = useMemo(() => {
    if (!ritualBonuses || !ritual) return 0;
    return ritualBonuses.getDTForRitual(ritual.element);
  }, [ritualBonuses, ritual]);

  // === INTEGRAÇÃO SUE: Calcula bônus de dano/cura ===
  const sueDamageBonus = useMemo(() => {
    if (!ritualBonuses) return 0;
    return ritualBonuses.damageBonus + (ritualBonuses.damageAttributeBonus?.value || 0);
  }, [ritualBonuses]);

  // === INTEGRAÇÃO SUE: Custo adicional de modificadores ativos ===
  const modifiersCost = useMemo(() => {
    if (!ritualBonuses) return 0;
    return activeModifiers.reduce((total, modId) => {
      const mod = ritualBonuses.availableModifiers.find(m => m.id === modId);
      if (!mod) return total;
      
      // Custo variável para Anular Ritual: usa o custo do ritual alvo
      if (mod.variableCost && mod.type === 'counter') {
        return total + counterRitualCost;
      }
      
      return total + (mod.peCost || 0);
    }, 0);
  }, [ritualBonuses, activeModifiers, counterRitualCost]);
  
  // Verifica se Anular Ritual está ativo
  const isCounterActive = useMemo(() => {
    if (!ritualBonuses) return false;
    return activeModifiers.some(modId => {
      const mod = ritualBonuses.availableModifiers.find(m => m.id === modId);
      return mod?.type === 'counter' && mod?.variableCost;
    });
  }, [ritualBonuses, activeModifiers]);

  // === EARLY RETURN após todos os hooks ===
  if (!ritual) return null;

  const elementConfig = getElementConfig(ritual.element);
  const ElementIcon = elementConfig?.icon || Sparkles;
  // Calcula custo base (com redução do SUE)
  // p.119: todas as classes usam o mesmo custo. Custos gratuitos explícitos continuam gratuitos.
  // Atualiza objetos legados pelo ID; mantém rituais personalizados e gratuidade explícita.
  const rawBaseCost = ritual.cost === 0 ? 0 : (getRitualById(ritual.id)?.cost ?? ritual.cost);
  const baseCost = rawBaseCost === 0 ? 0 : Math.max(1, rawBaseCost - sueReduction);

  const validSelectedEnhancements = selectedEnhancements.filter(enhName => {
    const enh = enhancementsWithValidation.find(e => e.name === enhName);
    return enh?.validation.isValid;
  });

  const enhancementsCost = validSelectedEnhancements.reduce((total, enhName) => {
    const enh = ritual.enhancements?.find(e => e.name === enhName);
    return total + (enh ? enh.cost : 0);
  }, 0);

  // Custo total (inclui modificadores de trilha)
  const totalCost = baseCost + enhancementsCost + modifiersCost;

  // Valida exatamente o débito confirmado, incluindo descontos e modificadores.
  const peValidation = validatePECost(totalCost, [], false, selectedEnhancements.length === 0 && totalCost <= baseCost);

  const canCast = !peBudgetLoading && !peBudgetError && peValidation.isValid && ritual.circle <= maxCircle;

  const toggleEnhancement = (enhName: string) => {
    const enh = enhancementsWithValidation.find(e => e.name === enhName);
    if (!enh?.validation.isValid) return;

    setSelectedEnhancements(prev =>
      // Livro Base v1.3 p.121: selecionar outra forma substitui a anterior.
      prev.includes(enhName) ? [] : [enhName]
    );
  };

  // Toggle de modificador de trilha
  const toggleModifier = (modifierId: string) => {
    setActiveModifiers(prev =>
      prev.includes(modifierId)
        ? prev.filter(id => id !== modifierId)
        : [...prev, modifierId]
    );
  };

  const handleConfirm = () => {
    if (!canCast || !ritual || validateCastingConcentration(concentration)) return;
    void confirmation.confirm(
      () => onConfirm(ritual, totalCost, validSelectedEnhancements, activeModifiers, isCounterActive ? counterRitualCost : undefined, concentration),
      result => {
        const effectsAllowed = typeof result !== 'object' || result.effectsAllowed;
        if (effectsAllowed && elementConfig) triggerElementParticles(elementConfig.hex, elementConfig.hexLight);
        // Efeitos só começam depois que o débito foi confirmado.
        if (effectsAllowed && wizardEnabled && 'id' in ritual) {
          setCastRitual(ritual as Ritual);
          setCastEnhancements(validSelectedEnhancements);
          setCastPeCost(totalCost);
          setWizardOpen(true);
        }
        setConcentration(DEFAULT_CASTING_CONCENTRATION);
        setSelectedEnhancements([]);
        setActiveModifiers([]);
        onOpenChange(false);
      },
    );
  };

  // Handler para fechar wizard e limpar estado
  const handleWizardComplete = () => {
    setCastRitual(null);
    setCastEnhancements([]);
    setCastPeCost(0);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (confirmation.isConfirming) return;
    if (!isOpen) {
      setConcentration(DEFAULT_CASTING_CONCENTRATION);
      setSelectedEnhancements([]);
      setActiveModifiers([]);
      setCounterRitualCost(0);
    }
    onOpenChange(isOpen);
  };

  return (
    <>
    <MobileDrawer open={open} onOpenChange={handleOpenChange}>
      <MobileDrawerContent maxHeight="xl">
        <MobileDrawerHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              elementConfig?.bg || "bg-muted",
              elementConfig?.border || "border-border",
              "border"
            )}>
              <ElementIcon className={cn("w-5 h-5", elementConfig?.text || "text-muted-foreground")} />
            </div>
            <div className="flex-1">
              <MobileDrawerTitle className={cn(
                "font-display text-base",
                elementConfig?.text || "text-foreground"
              )}>
                {ritual.name}
              </MobileDrawerTitle>
              <MobileDrawerDescription className="sr-only">
                Escolha o aprimoramento e confira o custo em PE antes de conjurar.
              </MobileDrawerDescription>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={cn("text-[10px]", elementConfig?.badgeBg)}>
                  {ritual.circle}º Círculo
                </Badge>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {ritual.element}
                </Badge>
              </div>
            </div>
          </div>
        </MobileDrawerHeader>

        {/* Rolagem nativa mantém custos acessíveis dentro da altura flexível do drawer. */}
        <MobileDrawerBody useScrollArea={false}>
          <div className="space-y-4">
<CastingConcentrationForm value={concentration} onChange={setConcentration} peCost={totalCost} disabled={confirmation.isConfirming} />
            {/* Info compacta */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{ritual.execution}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                <span>{ritual.range}</span>
              </div>
              {ritual.duration && (
                <div className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  <span>{ritual.duration}</span>
                </div>
              )}
              {ritual.resistance && (
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>
                    {typeof ritual.resistance === 'string' 
                      ? ritual.resistance 
                      : ritual.resistance.type}
                  </span>
                </div>
              )}
            </div>

            {/* Descrição */}
            <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
              {ritual.description}
            </p>

            {/* === BÔNUS DO SUE (versão compacta mobile) === */}
            {ritualBonuses?.hasAnyBonus && (
              <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                {sueDTBonus > 0 && (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-[10px]">
                    <Target className="w-3 h-3 mr-1" />
                    +{sueDTBonus} DT
                  </Badge>
                )}
                {sueDamageBonus > 0 && (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{sueDamageBonus} dano/cura
                  </Badge>
                )}
                {sueReduction > 0 && (
                  <Badge variant="outline" className="bg-pe/10 text-pe border-pe/30 text-[10px]">
                    <Minus className="w-3 h-3 mr-1" />
                    {sueReduction} PE
                  </Badge>
                )}
              </div>
            )}

            {/* Custo base */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
              <span className="text-sm">Custo Base</span>
              <div className="flex items-center gap-1.5">
                {sueReduction > 0 && (
                  <span className="text-[10px] text-muted-foreground line-through">
                    {rawBaseCost} PE
                  </span>
                )}
                <Badge className="bg-pe/20 text-pe border-pe/50">
                  {baseCost} PE
                </Badge>
              </div>
            </div>

            {/* Aprimoramentos como chips */}
            {enhancementsWithValidation.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase">Aprimoramentos</p>
                <div className="flex flex-wrap gap-1.5">
                  {enhancementsWithValidation.map((enh, i) => {
                    const enhCost = enh.cost;
                    const isSelected = selectedEnhancements.includes(enh.name);
                    const isLocked = !enh.validation.isValid;
                    
                    return (
                      <div key={i} className="max-w-full space-y-1">
                      <motion.button
                        onClick={() => toggleEnhancement(enh.name)}
                        disabled={isLocked}
                        aria-describedby={isLocked ? `enhancement-requirement-${i}` : undefined}
                        whileTap={{ scale: isLocked ? 1 : 0.95 }}
                        className={cn(
                          "px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
                          "flex items-center gap-1.5 border",
                          isLocked 
                            ? "bg-muted/30 border-muted text-muted-foreground/50 cursor-not-allowed"
                            : isSelected
                              ? `${elementConfig?.bg || 'bg-primary/20'} ${elementConfig?.border || 'border-primary'} ${elementConfig?.text || 'text-primary'}`
                              : "bg-card border-border hover:bg-accent/50"
                        )}
                      >
                        {isLocked ? (
                          <Lock className="w-3 h-3" />
                        ) : isSelected ? (
                          <Check className="w-3 h-3" />
                        ) : null}
                        {enh.name}
                        <span className="text-[10px] opacity-70">+{enhCost}</span>
                      </motion.button>
                      {isLocked && (
                        <p id={`enhancement-requirement-${i}`} className="max-w-[260px] text-xs text-muted-foreground">
                          {enh.validation.reason || 'Requisitos deste aprimoramento não atendidos.'}
                        </p>
                      )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* === MODIFICADORES DE TRILHA (Ampliar/Acelerar/Anular Ritual) - Mobile === */}
            {ritualBonuses?.hasAnyModifier && (
              <div className="space-y-2 p-2.5 rounded-lg bg-accent/5 border border-accent/20">
                <p className="text-[10px] text-accent-foreground uppercase tracking-wider flex items-center gap-1">
                  <Settings2 className="w-3 h-3" />
                  Modificadores de Trilha
                </p>
                
                {/* Modificadores padrão como chips */}
                <div className="flex flex-wrap gap-1.5">
                  {ritualBonuses.availableModifiers
                    .filter(mod => !(mod.type === 'counter' && mod.variableCost))
                    .map((mod) => {
                      const isActive = activeModifiers.includes(mod.id);
                      const ModIcon = MODIFIER_ICONS[mod.type] || Settings2;
                      
                      return (
                        <motion.button
                          key={mod.id}
                          onClick={() => toggleModifier(mod.id)}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
                            "flex items-center gap-1.5 border",
                            isActive
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-card border-border hover:bg-accent/50"
                          )}
                        >
                          <ModIcon className="w-3 h-3" />
                          {mod.name}
                          <span className="text-[10px] opacity-70">+{mod.peCost}</span>
                          {mod.perRound && (
                            <Clock className="w-2.5 h-2.5 text-yellow-500" />
                          )}
                          {isActive && <Check className="w-3 h-3" />}
                        </motion.button>
                      );
                    })}
                </div>
                
                {/* Interface especial para Anular Ritual */}
                {ritualBonuses.availableModifiers
                  .filter(mod => mod.type === 'counter' && mod.variableCost)
                  .map((mod) => {
                    const isActive = activeModifiers.includes(mod.id);
                    const ModIcon = MODIFIER_ICONS[mod.type] || Settings2;
                    
                    return (
                      <motion.div
                        key={mod.id}
                        initial={false}
                        animate={{
                          borderColor: isActive 
                            ? 'hsl(var(--destructive))' 
                            : 'hsl(var(--border))',
                        }}
                        className={cn(
                          "p-2.5 rounded-lg border transition-colors mt-2",
                          isActive 
                            ? "bg-destructive/5 border-destructive/50" 
                            : "bg-card"
                        )}
                      >
                        {/* Header com toggle */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <div className={cn(
                              "w-7 h-7 rounded-md flex items-center justify-center",
                              isActive ? "bg-destructive/20" : "bg-muted"
                            )}>
                              <ModIcon className={cn(
                                "w-4 h-4",
                                isActive ? "text-destructive" : "text-muted-foreground"
                              )} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className={cn(
                                  "text-xs font-medium",
                                  isActive && "text-destructive"
                                )}>
                                  {mod.name}
                                </span>
                                {mod.actionType === 'reaction' && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-[9px] py-0 h-4 bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
                                  >
                                    Reação
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                {mod.effect}
                              </p>
                            </div>
                          </div>
                          <motion.button
                            onClick={() => toggleModifier(mod.id)}
                            whileTap={{ scale: 0.9 }}
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center border transition-colors",
                              isActive 
                                ? "bg-destructive text-destructive-foreground border-destructive" 
                                : "bg-muted border-border"
                            )}
                          >
                            {isActive ? <Check className="w-4 h-4" /> : <ShieldX className="w-4 h-4" />}
                          </motion.button>
                        </div>
                        
                        {/* Input de custo do ritual alvo */}
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2.5 pt-2.5 border-t border-border/50 space-y-2"
                          >
                            <p className="text-[10px] text-muted-foreground">
                              Custo do ritual alvo:
                            </p>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={1}
                                max={99}
                                value={counterRitualCost || ''}
                                onChange={(e) => setCounterRitualCost(Math.max(0, parseInt(e.target.value) || 0))}
                                placeholder="PE"
                                className="w-20 h-8 text-center text-sm"
                              />
                              <span className="text-xs text-muted-foreground">PE</span>
                              <div className="flex-1 text-right">
                                <Badge 
                                  variant="outline" 
                                  className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]"
                                >
                                  = {counterRitualCost} PE
                                </Badge>
                              </div>
                            </div>
                            {/* Validação visual de PE para Anular Ritual */}
                            {counterRitualCost > 0 && (
                              <div className="mt-1.5 space-y-1">
                                <div className="flex items-center justify-between text-[9px]">
                                  <span className="text-muted-foreground">PE disponível</span>
                                  <span className={cn(
                                    peCurrent + temporaryPE >= counterRitualCost ? "text-green-500" : "text-destructive"
                                  )}>
                                    {peCurrent + temporaryPE} / {counterRitualCost}
                                  </span>
                                </div>
                                <div className="h-1 rounded-full bg-muted overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, ((peCurrent + temporaryPE) / counterRitualCost) * 100)}%` }}
                                    className={cn(
                                      "h-full rounded-full",
                                      peCurrent + temporaryPE >= counterRitualCost ? "bg-green-500" : "bg-destructive"
                                    )}
                                  />
                                </div>
                                {peCurrent + temporaryPE < counterRitualCost && (
                                  <p className="text-[8px] text-destructive">
                                    PE insuficiente
                                  </p>
                                )}
                              </div>
                            )}
                            <p className="text-[9px] text-muted-foreground italic">
                              Teste oposto de Ocultismo
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                
                {/* Custo adicional dos modificadores */}
                {modifiersCost > 0 && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-border/50 text-xs">
                    <span className="text-muted-foreground">Modificadores</span>
                    <Badge variant="outline" className="bg-pe/10 text-pe border-pe/30 text-[10px]">
                      +{modifiersCost} PE
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Toggle do wizard de efeitos */}
            <TooltipProvider>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-help">
                      <Wand2 className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="wizard-toggle" className="text-xs cursor-pointer">
                        Processar efeitos
                      </Label>
                      <span className="text-xs text-muted-foreground">Guia a resolução após consumir PE. Efeitos exigem alvo e confirmação; cancelar mantém o registro pendente.</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px] text-center">
                    <p className="text-xs">
                      {wizardEnabled 
                        ? "Após conjurar, um assistente guiará você pelos efeitos: dano, cura, resistências, condições e buffs."
                        : "Conjuração rápida: o ritual será lançado sem processar efeitos automaticamente."}
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Switch
                  id="wizard-toggle"
                  checked={wizardEnabled}
                  onCheckedChange={setWizardEnabled}
                  className="scale-90"
                />
              </div>
            </TooltipProvider>

            {/* Custo total */}
            <div className={cn(
              "p-3 rounded-lg border-2",
              canCast 
                ? "bg-success/5 border-success/30" 
                : "bg-destructive/5 border-destructive/30"
            )}>
              <div className="flex items-center justify-between">
                <span className="font-display text-sm">Custo Total</span>
                <div className="text-right">
                  <span className={cn(
                    "text-2xl font-bold",
                    canCast ? "text-pe" : "text-destructive"
                  )}>
                    {totalCost}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">PE</span>
                </div>
              </div>
              
              {/* Barra de PE */}
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>PE Atual</span>
                  <span>{peCurrent} / {peMax}</span>
                </div>
                {peBudgetLoading && <p role="status">Conferindo orçamento no servidor…</p>}
                {peBudgetError && <p role="alert">{peBudgetError}</p>}
                {peBudget && <p role="status" className="text-xs text-muted-foreground">{peBudget.tracked ? `Gasto confirmado neste turno: ${peBudget.spent} PE · limite para rituais: ${peBudget.ritualLimit} PE.` : 'Sem controle de turnos ativo; o gasto será registrado sem criar turno.'}</p>}
                {temporaryPE > 0 && <p role="status" className="text-xs text-muted-foreground">PE temporários: {temporaryPE} · Disponível: {peCurrent + temporaryPE} PE. Temporários serão consumidos primeiro.</p>}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all",
                      canCast ? "bg-pe" : "bg-destructive"
                    )}
                    style={{ width: `${Math.max(0, (peCurrent / peMax) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Erro de validação */}
              {!canCast && (
                <p className="text-[10px] text-destructive mt-2 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {ritual.circle > maxCircle ? `Requer ${ritual.circle}º círculo (seu máximo: ${maxCircle}º)` : peValidation.reason}
                </p>
              )}
            </div>
          </div>
        </MobileDrawerBody>

        <MobileDrawerFooter>
          {confirmation.error && <p role="alert" className="text-sm text-destructive">{confirmation.error}</p>}
          <MobileButtonGroup
            buttons={[
              {
                id: 'cast',
                label: confirmation.isConfirming ? 'CONFIRMANDO...' : 'CONJURAR',
                icon: <Sparkles />,
                onClick: handleConfirm,
                type: 'primary',
                disabled: !canCast || !!validateCastingConcentration(concentration) || confirmation.isConfirming,
                className: canCast && elementConfig?.bg ? elementConfig.bg : undefined,
              },
              {
                id: 'cancel',
                label: 'CANCELAR',
                icon: <X />,
                onClick: () => handleOpenChange(false),
                disabled: confirmation.isConfirming,
                variant: 'ghost',
                type: 'secondary',
              },
            ]}
          />
        </MobileDrawerFooter>
      </MobileDrawerContent>
    </MobileDrawer>

    {/* Wizard de efeitos do ritual - Integrado ao SUE */}
    <MobileRitualEffectWizard
      open={wizardOpen}
      onOpenChange={setWizardOpen}
      ritual={castRitual}
      enhancements={castEnhancements}
      peCost={castPeCost}
      casterResistanceDT={calculateRitualResistanceDT(
        nex, casterPresence, peLimitBonus,
        castRitual ? ritualBonuses?.getDTForRitual(castRitual.element) ?? 0 : 0,
      )}
      targetAttributes={targetAttributes}
      targetResistanceBonuses={targetResistanceBonuses}
      applicationTargetId={applicationTargetId}
      applicationTarget={applicationTarget}
      onApplyDamage={onApplyDamage}
      onApplyHealing={onApplyHealing}
      onApplyConditions={onApplyConditions}
      onResolutionRoll={onResolutionRoll}
      onAddWeaponBuff={onAddWeaponBuff}
      onActivateSustained={onActivateSustained}
      onComplete={handleWizardComplete}
      // Propagação dos bônus do SUE para o Wizard
      ritualDamageBonus={ritualBonuses?.damageBonus || 0}
      damageAttributeBonus={ritualBonuses?.damageAttributeBonus ? {
        attribute: 'Intelecto',
        value: intellect
      } : undefined}
    />
  </>
  );
}
