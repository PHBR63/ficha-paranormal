/**
 * MobileRitualCastModal - Modal de conjuração de rituais para mobile
 * Interface compacta com seleção de aprimoramentos como chips
 * Integrado com MobileRitualEffectWizard para processar efeitos automaticamente
 * 
 * ATUALIZADO: Integrado ao Sistema Unificado de Efeitos (SUE)
 */

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerFooter 
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from 'lucide-react';
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
import { useRitualValidation, TurnPEState } from '@/hooks/useRitualValidation';
import { MobileRitualEffectWizard } from './MobileRitualEffectWizard';
import { ActiveCondition } from './MobileConditionManager';
import type { AnyDamageType, SustainConfig } from '@/lib/rituals/legacy-exports';
import type { RitualBonuses } from '@/hooks/useRitualBonusesFromSUE';

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
  peMax: number;
  isNonOccultist?: boolean;
  nex?: number;
  elementalAffinity?: string | null;
  turnPEState?: TurnPEState;
  onConfirm: (ritual: RitualInput, peCost: number, enhancements: string[], activeModifiers?: string[], counterRitualCost?: number) => void;
  // Callbacks para efeitos do wizard
  targetAttributes?: { vigor: number; agility: number; presence: number };
  onApplyDamage?: (damage: number, type: AnyDamageType, ignoresRD: boolean) => void;
  onApplyHealing?: (amount: number, type: 'healing' | 'tempHP') => void;
  onApplyConditions?: (conditions: ActiveCondition[]) => void;
  onAddWeaponBuff?: (ritual: Ritual, enhancements: string[]) => void;
  onActivateSustained?: (ritual: Ritual, enhancements: string[], sustain: SustainConfig) => void;
  // Se true, abre o wizard automaticamente após conjurar
  autoOpenWizard?: boolean;
  // === Bônus do SUE ===
  ritualBonuses?: RitualBonuses | null;
  intellect?: number;
}

export function MobileRitualCastModal({
  open,
  onOpenChange,
  ritual,
  peCurrent,
  peMax,
  isNonOccultist = false,
  nex = 5,
  elementalAffinity,
  turnPEState,
  onConfirm,
  // Props do wizard
  targetAttributes,
  onApplyDamage,
  onApplyHealing,
  onApplyConditions,
  onAddWeaponBuff,
  onActivateSustained,
  autoOpenWizard = true,
  // SUE props
  ritualBonuses,
  intellect = 0,
}: MobileRitualCastModalProps) {
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

  const {
    maxCircle,
    peLimitPerTurn,
    validatePECost,
    getAvailableEnhancements,
  } = useRitualValidation(nex, elementalAffinity, peCurrent, peMax, turnPEState);

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
  const costMultiplier = isNonOccultist ? 2 : 1;

  // Calcula custo base (com redução do SUE)
  const rawBaseCost = ritual.cost * costMultiplier;
  const baseCost = Math.max(1, rawBaseCost - sueReduction);

  const validSelectedEnhancements = selectedEnhancements.filter(enhName => {
    const enh = enhancementsWithValidation.find(e => e.name === enhName);
    return enh?.validation.isValid;
  });

  const enhancementsCost = validSelectedEnhancements.reduce((total, enhName) => {
    const enh = ritual.enhancements?.find(e => e.name === enhName);
    return total + (enh ? enh.cost * costMultiplier : 0);
  }, 0);

  // Custo total (inclui modificadores de trilha)
  const totalCost = baseCost + enhancementsCost + modifiersCost;

  const peValidation = validatePECost(
    ritual.cost,
    validSelectedEnhancements.map(name => {
      const enh = ritual.enhancements?.find(e => e.name === name);
      return { name, cost: enh?.cost || 0 };
    }),
    isNonOccultist
  );

  const canCast = peValidation.isValid;

  const toggleEnhancement = (enhName: string) => {
    const enh = enhancementsWithValidation.find(e => e.name === enhName);
    if (!enh?.validation.isValid) return;

    setSelectedEnhancements(prev =>
      prev.includes(enhName)
        ? prev.filter(e => e !== enhName)
        : [...prev, enhName]
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

  const handleConfirm = useCallback(() => {
    if (!canCast || !ritual) return;
    
    if (elementConfig) {
      triggerElementParticles(elementConfig.hex, elementConfig.hexLight);
    }
    
    // Chama o callback de confirmação (inclui counterRitualCost se Anular Ritual estiver ativo)
    onConfirm(ritual, totalCost, validSelectedEnhancements, activeModifiers, isCounterActive ? counterRitualCost : undefined);
    
    // Se wizard está ativo e o ritual é do tipo Ritual (não UnifiedRitual), abre o wizard
    if (wizardEnabled && 'id' in ritual) {
      setCastRitual(ritual as Ritual);
      setCastEnhancements(validSelectedEnhancements);
      setCastPeCost(totalCost);
      
      // Fecha o modal de cast e abre o wizard após um delay
      setTimeout(() => {
        setSelectedEnhancements([]);
        setActiveModifiers([]);
        onOpenChange(false);
        setWizardOpen(true);
      }, 300);
    } else {
      setSelectedEnhancements([]);
      setActiveModifiers([]);
      onOpenChange(false);
    }
  }, [canCast, ritual, elementConfig, totalCost, validSelectedEnhancements, activeModifiers, isCounterActive, counterRitualCost, wizardEnabled, onConfirm, onOpenChange]);

  // Handler para fechar wizard e limpar estado
  const handleWizardComplete = useCallback(() => {
    setCastRitual(null);
    setCastEnhancements([]);
    setCastPeCost(0);
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedEnhancements([]);
      setActiveModifiers([]);
      setCounterRitualCost(0);
    }
    onOpenChange(isOpen);
  };

  return (
    <>
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
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
              <DrawerTitle className={cn(
                "font-display text-base",
                elementConfig?.text || "text-foreground"
              )}>
                {ritual.name}
              </DrawerTitle>
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
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
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
                    const enhCost = enh.cost * costMultiplier;
                    const isSelected = selectedEnhancements.includes(enh.name);
                    const isLocked = !enh.validation.isValid;
                    
                    return (
                      <motion.button
                        key={i}
                        onClick={() => toggleEnhancement(enh.name)}
                        disabled={isLocked}
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
                                    peCurrent >= counterRitualCost ? "text-green-500" : "text-destructive"
                                  )}>
                                    {peCurrent} / {counterRitualCost}
                                  </span>
                                </div>
                                <div className="h-1 rounded-full bg-muted overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (peCurrent / counterRitualCost) * 100)}%` }}
                                    className={cn(
                                      "h-full rounded-full",
                                      peCurrent >= counterRitualCost ? "bg-green-500" : "bg-destructive"
                                    )}
                                  />
                                </div>
                                {peCurrent < counterRitualCost && (
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
              {!peValidation.isValid && peValidation.reason && (
                <p className="text-[10px] text-destructive mt-2 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {peValidation.reason}
                </p>
              )}
            </div>
          </div>
        </ScrollArea>

        <DrawerFooter className="pt-2">
          <Button
            onClick={handleConfirm}
            disabled={!canCast}
            className={cn(
              "w-full h-12 font-display gap-2",
              canCast && elementConfig?.bg
            )}
          >
            <Sparkles className="w-5 h-5" />
            CONJURAR
          </Button>
          <Button variant="ghost" onClick={() => handleOpenChange(false)} className="font-display">
            <X className="w-4 h-4 mr-2" />
            CANCELAR
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>

    {/* Wizard de efeitos do ritual - Integrado ao SUE */}
    <MobileRitualEffectWizard
      open={wizardOpen}
      onOpenChange={setWizardOpen}
      ritual={castRitual}
      enhancements={castEnhancements}
      peCost={castPeCost}
      targetAttributes={targetAttributes}
      onApplyDamage={onApplyDamage}
      onApplyHealing={onApplyHealing}
      onApplyConditions={onApplyConditions}
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
