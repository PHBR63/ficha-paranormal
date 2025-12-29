/**
 * RitualCastModal - Modal de confirmação para conjurar rituais
 * Permite escolher aprimoramentos e mostra custo total em PE
 * Inclui validação de requisitos de círculo/afinidade e limite de PE por turno
 * 
 * ATUALIZADO: Integrado ao Sistema Unificado de Efeitos (SUE)
 * Exibe automaticamente bônus de DT, dano/cura e reduções de PE
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Zap, 
  AlertTriangle, 
  Sparkles,
  Clock,
  Target,
  Timer,
  Shield,
  Users,
  Lock,
  Flame,
  Info,
  TrendingUp,
  Minus,
  Settings2,
  ArrowUpRight,
  Maximize2,
  FastForward,
  ShieldX,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Ritual } from '@/lib/rituals/legacy-exports';
import type { UnifiedRitual } from '@/lib/rituals/types';
import { getElementConfig } from '@/lib/element-config';
import { useRitualValidation, TurnPEState } from '@/hooks/useRitualValidation';
import type { RitualBonuses } from '@/hooks/useRitualBonusesFromSUE';

// Função para disparar efeito de partículas do elemento
function triggerElementParticles(elementHex: string, elementHexLight: string) {
  // Primeiro burst - partículas do elemento
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.6, x: 0.5 },
    colors: [elementHex, elementHexLight, '#ffffff'],
    ticks: 200,
    gravity: 0.8,
    scalar: 1.2,
    shapes: ['circle', 'square'],
  });

  // Segundo burst com delay - efeito de "energia"
  setTimeout(() => {
    confetti({
      particleCount: 30,
      spread: 100,
      origin: { y: 0.5, x: 0.5 },
      colors: [elementHex, elementHexLight],
      ticks: 150,
      gravity: 0.6,
      scalar: 0.8,
      shapes: ['circle'],
    });
  }, 150);
}

// Tipo que suporta tanto rituais legados quanto unificados
type RitualInput = Ritual | UnifiedRitual;

interface RitualCastModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ritual: RitualInput | null;
  peCurrent: number;
  peMax: number;
  isNonOccultist?: boolean;
  nex?: number;
  elementalAffinity?: string | null;
  turnPEState?: TurnPEState;
  onConfirm: (ritual: RitualInput, peCost: number, enhancements: string[], activeModifiers?: string[]) => void;
  // === Bônus do SUE ===
  ritualBonuses?: RitualBonuses | null;
  intellect?: number; // Para cálculo de Ritual Potente
}

// Ícones para tipos de modificadores
const MODIFIER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  range: ArrowUpRight,
  area: Maximize2,
  action: FastForward,
  duration: Timer,
  counter: ShieldX,
};

export function RitualCastModal({
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
  ritualBonuses,
  intellect = 0,
}: RitualCastModalProps) {
  // Estado dos aprimoramentos selecionados
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>([]);
  // Estado dos modificadores de trilha ativados
  const [activeModifiers, setActiveModifiers] = useState<string[]>([]);
  // Estado para custo do ritual alvo (Anular Ritual)
  const [counterRitualCost, setCounterRitualCost] = useState<number>(0);

  // Hook de validação de rituais
  const {
    maxCircle,
    peLimitPerTurn,
    validateEnhancement,
    validatePECost,
    getAvailableEnhancements,
  } = useRitualValidation(nex, elementalAffinity, peCurrent, peMax, turnPEState);

  // Aprimoramentos com validação
  const enhancementsWithValidation = useMemo(() => {
    if (!ritual) return [];
    return getAvailableEnhancements(ritual);
  }, [ritual, getAvailableEnhancements]);

  if (!ritual) return null;

  // Configuração visual do elemento
  const elementConfig = getElementConfig(ritual.element);
  const ElementIcon = elementConfig?.icon || Sparkles;

  // Multiplicador de custo para não-ocultistas
  const costMultiplier = isNonOccultist ? 2 : 1;

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

  // Calcula custo base (com redução do SUE)
  const rawBaseCost = ritual.cost * costMultiplier;
  const baseCost = Math.max(1, rawBaseCost - sueReduction);

  // Filtra apenas aprimoramentos válidos selecionados
  const validSelectedEnhancements = selectedEnhancements.filter(enhName => {
    const enh = enhancementsWithValidation.find(e => e.name === enhName);
    return enh?.validation.isValid;
  });

  // Calcula custo dos aprimoramentos (apenas válidos)
  const enhancementsCost = validSelectedEnhancements.reduce((total, enhName) => {
    const enh = ritual.enhancements?.find(e => e.name === enhName);
    return total + (enh ? enh.cost * costMultiplier : 0);
  }, 0);

  // Custo total (inclui modificadores de trilha)
  const totalCost = baseCost + enhancementsCost + modifiersCost;

  // Validação de PE com limite por turno
  const peValidation = validatePECost(
    ritual.cost,
    validSelectedEnhancements.map(name => {
      const enh = ritual.enhancements?.find(e => e.name === name);
      return { name, cost: enh?.cost || 0 };
    }),
    isNonOccultist
  );

  // Pode conjurar se validação de PE passar
  const canCast = peValidation.isValid;

  // Toggle de aprimoramento (só permite se válido)
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

  // Handler de confirmação com efeito visual
  const handleConfirm = () => {
    if (canCast && elementConfig) {
      // Dispara efeito de partículas antes de fechar
      triggerElementParticles(elementConfig.hex, elementConfig.hexLight);
      
      // Pequeno delay para o efeito ser visível
      setTimeout(() => {
        onConfirm(ritual, totalCost, validSelectedEnhancements, activeModifiers);
        setSelectedEnhancements([]);
        setActiveModifiers([]);
        onOpenChange(false);
      }, 300);
    } else if (canCast) {
      // Fallback sem efeito se não tiver config de elemento
      onConfirm(ritual, totalCost, validSelectedEnhancements, activeModifiers);
      setSelectedEnhancements([]);
      setActiveModifiers([]);
      onOpenChange(false);
    }
  };

  // Reset ao fechar
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedEnhancements([]);
      setActiveModifiers([]);
      setCounterRitualCost(0);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        {/* Header com visual do elemento */}
        <div className={cn(
          "absolute inset-x-0 top-0 h-24 rounded-t-lg opacity-30",
          `bg-gradient-to-b ${elementConfig?.color || 'from-primary/20 to-transparent'}`
        )} />

        <DialogHeader className="relative">
          <div className="flex items-center gap-3">
            {/* Ícone do elemento */}
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              elementConfig?.bg || "bg-muted",
              elementConfig?.border || "border-border",
              "border"
            )}>
              <ElementIcon className={cn("w-6 h-6", elementConfig?.text || "text-muted-foreground")} />
            </div>

            <div>
              <DialogTitle className={cn(
                "font-display tracking-wider",
                elementConfig?.text || "text-foreground"
              )}>
                Conjurar {ritual.name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-xs", elementConfig?.badgeBg)}>
                  {ritual.circle}º Círculo
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {ritual.element}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 py-4">
            {/* Info do ritual */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{ritual.execution}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Target className="w-3 h-3" />
                <span>{ritual.range}</span>
              </div>
              {ritual.duration && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Timer className="w-3 h-3" />
                  <span>{ritual.duration}</span>
                </div>
              )}
              {ritual.resistance && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>
                    {typeof ritual.resistance === 'string' 
                      ? ritual.resistance 
                      : `${ritual.resistance.type?.charAt(0).toUpperCase()}${ritual.resistance.type?.slice(1) || ''}`}
                  </span>
                </div>
              )}
              {ritual.target && (
                <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                  <Users className="w-3 h-3" />
                  <span>{ritual.target}</span>
                </div>
              )}
            </div>

            {/* Descrição */}
            <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
              {ritual.description}
            </p>

            {/* === BÔNUS DO SUE === */}
            {ritualBonuses?.hasAnyBonus && (
              <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs font-medium text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" />
                  Bônus Ativos
                </p>
                
                {/* Bônus de DT */}
                {sueDTBonus > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Aumento de DT</span>
                          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                            +{sueDTBonus} DT
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="font-medium mb-1">Fontes do bônus:</p>
                        {ritualBonuses.dtBreakdown.map((b, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            {b.source}: +{b.value}{b.element ? ` (${b.element})` : ''}
                          </p>
                        ))}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* Bônus de Dano/Cura */}
                {sueDamageBonus > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Dano/Cura</span>
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                            +{sueDamageBonus}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="font-medium mb-1">Fontes do bônus:</p>
                        {ritualBonuses.damageBreakdown.map((b, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            {b.source}: +{b.value}
                          </p>
                        ))}
                        {ritualBonuses.damageAttributeBonus && (
                          <p className="text-xs text-primary mt-1">
                            ({ritualBonuses.damageAttributeBonus.attribute.toUpperCase()} = {ritualBonuses.damageAttributeBonus.value})
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* Redução de PE */}
                {sueReduction > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Redução de PE</span>
                          <Badge variant="outline" className="bg-pe/10 text-pe border-pe/30">
                            <Minus className="w-3 h-3 mr-0.5" />
                            {sueReduction} PE
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="font-medium mb-1">Fontes da redução:</p>
                        {ritualBonuses.peBreakdown.map((b, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            {b.source}: -{b.value} PE{b.element ? ` (${b.element})` : ''}{b.range ? ` (${b.range})` : ''}
                          </p>
                        ))}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}

            {/* === MODIFICADORES DE TRILHA (Ampliar/Acelerar Ritual) === */}
            {ritualBonuses?.hasAnyModifier && (
              <div className="space-y-2 p-3 rounded-lg bg-accent/5 border border-accent/20">
                <p className="text-xs font-medium text-accent-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Settings2 className="w-3 h-3" />
                  Modificadores de Trilha
                </p>
                
                <div className="space-y-2">
                  {ritualBonuses.availableModifiers.map((mod) => {
                    const isActive = activeModifiers.includes(mod.id);
                    const ModIcon = MODIFIER_ICONS[mod.type] || Settings2;
                    const isCounterMod = mod.type === 'counter' && mod.variableCost;
                    
                    // Interface especial para Anular Ritual (counter com custo variável)
                    if (isCounterMod) {
                      return (
                        <motion.div
                          key={mod.id}
                          initial={false}
                          animate={{
                            scale: isActive ? 1.02 : 1,
                            borderColor: isActive 
                              ? 'hsl(var(--destructive))' 
                              : 'hsl(var(--border))',
                          }}
                          className={cn(
                            "p-3 rounded-lg border transition-colors",
                            isActive 
                              ? "bg-destructive/5 border-destructive/50" 
                              : "bg-card hover:bg-accent/5"
                          )}
                        >
                          <div className="space-y-3">
                            {/* Header do modificador */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-8 h-8 rounded-md flex items-center justify-center",
                                  isActive ? "bg-destructive/20" : "bg-muted"
                                )}>
                                  <ModIcon className={cn(
                                    "w-4 h-4",
                                    isActive ? "text-destructive" : "text-muted-foreground"
                                  )} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "font-medium text-sm",
                                      isActive && "text-destructive"
                                    )}>
                                      {mod.name}
                                    </span>
                                    {mod.actionType === 'reaction' && (
                                      <Badge 
                                        variant="outline" 
                                        className="text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
                                      >
                                        Reação
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {mod.effect}
                                  </p>
                                </div>
                              </div>
                              <Switch
                                checked={isActive}
                                onCheckedChange={() => toggleModifier(mod.id)}
                              />
                            </div>
                            
                            {/* Input de custo do ritual alvo */}
                            {isActive && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 pt-2 border-t border-border/50"
                              >
                                <Label htmlFor="counter-cost" className="text-xs text-muted-foreground">
                                  Custo do ritual que está sendo anulado:
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    id="counter-cost"
                                    type="number"
                                    min={1}
                                    max={99}
                                    value={counterRitualCost || ''}
                                    onChange={(e) => setCounterRitualCost(Math.max(0, parseInt(e.target.value) || 0))}
                                    placeholder="PE"
                                    className="w-24 h-9 text-center"
                                  />
                                  <span className="text-sm text-muted-foreground">PE</span>
                                  <div className="flex-1 text-right">
                                    <Badge 
                                      variant="outline" 
                                      className="bg-destructive/10 text-destructive border-destructive/30"
                                    >
                                      Custo: {counterRitualCost} PE
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">
                                  Você paga PE igual ao custo do ritual que está anulando.
                                  Exige teste oposto de Ocultismo.
                                </p>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      );
                    }
                    
                    // Interface padrão para outros modificadores
                    return (
                      <motion.div
                        key={mod.id}
                        initial={false}
                        animate={{
                          scale: isActive ? 1.02 : 1,
                          borderColor: isActive 
                            ? 'hsl(var(--primary))' 
                            : 'hsl(var(--border))',
                        }}
                        className={cn(
                          "p-2.5 rounded-lg border transition-colors",
                          isActive 
                            ? "bg-primary/5" 
                            : "bg-card hover:bg-accent/5"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className={cn(
                              "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                              isActive ? "bg-primary/20" : "bg-muted"
                            )}>
                              <ModIcon className={cn(
                                "w-4 h-4",
                                isActive ? "text-primary" : "text-muted-foreground"
                              )} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-medium text-sm truncate",
                                  isActive && "text-primary"
                                )}>
                                  {mod.name}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs shrink-0",
                                    isActive && "bg-pe/10 text-pe border-pe/30"
                                  )}
                                >
                                  +{mod.peCost} PE
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {mod.effect}
                              </p>
                              {mod.perRound && (
                                <p className="text-[10px] text-yellow-500/80 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  1× por rodada
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <Switch
                            checked={isActive}
                            onCheckedChange={() => toggleModifier(mod.id)}
                            className="shrink-0"
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Custo adicional dos modificadores */}
                {modifiersCost > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-sm">
                    <span className="text-muted-foreground">Custo dos modificadores</span>
                    <Badge variant="outline" className="bg-pe/10 text-pe border-pe/30">
                      +{modifiersCost} PE
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Custo base */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
              <span className="text-sm font-medium">Custo Base</span>
              <div className="flex items-center gap-2">
                {sueReduction > 0 && (
                  <span className="text-xs text-muted-foreground line-through">
                    {rawBaseCost} PE
                  </span>
                )}
                <Badge className="bg-pe/20 text-pe border-pe/50">
                  {baseCost} PE
                </Badge>
                {isNonOccultist && (
                  <span className="text-[10px] text-yellow-400">
                    (×2 não-ocultista)
                  </span>
                )}
              </div>
            </div>

            {/* Aprimoramentos com validação */}
            {enhancementsWithValidation.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Aprimoramentos (opcional)
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Info className="w-3 h-3" />
                          <span>Seu círculo: {maxCircle}º</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Baseado no seu NEX ({nex}%)</p>
                        {elementalAffinity && (
                          <p className="text-xs text-muted-foreground">
                            Afinidade: {elementalAffinity}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {enhancementsWithValidation.map((enh, i) => {
                  const enhCost = enh.cost * costMultiplier;
                  const isSelected = selectedEnhancements.includes(enh.name);
                  const isLocked = !enh.validation.isValid;
                  
                  return (
                    <TooltipProvider key={i}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div
                            initial={false}
                            animate={{
                              scale: isSelected && !isLocked ? 1.02 : 1,
                              borderColor: isLocked 
                                ? 'hsl(var(--muted))' 
                                : isSelected 
                                  ? 'hsl(var(--primary))' 
                                  : 'hsl(var(--border))',
                            }}
                            className={cn(
                              "p-3 rounded-lg border transition-colors",
                              isLocked 
                                ? "bg-muted/30 cursor-not-allowed opacity-60" 
                                : isSelected 
                                  ? "bg-primary/5 cursor-pointer" 
                                  : "bg-card hover:bg-accent/5 cursor-pointer"
                            )}
                            onClick={() => !isLocked && toggleEnhancement(enh.name)}
                          >
                            <div className="flex items-start gap-3">
                              {isLocked ? (
                                <Lock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                              ) : (
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleEnhancement(enh.name)}
                                  className="mt-0.5"
                                  disabled={isLocked}
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={cn(
                                    "font-medium text-sm",
                                    isLocked && "text-muted-foreground",
                                    isSelected && !isLocked && elementConfig?.text
                                  )}>
                                    {enh.name}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    {enh.validation.requiresAffinity && (
                                      <Flame className={cn(
                                        "w-3 h-3",
                                        isLocked ? "text-muted-foreground" : "text-orange-400"
                                      )} />
                                    )}
                                    <Badge 
                                      variant="outline" 
                                      className={cn(
                                        "text-xs",
                                        isLocked && "bg-muted/50 text-muted-foreground"
                                      )}
                                    >
                                      +{enhCost} PE
                                    </Badge>
                                  </div>
                                </div>
                                <p className={cn(
                                  "text-xs mt-1",
                                  isLocked ? "text-muted-foreground/70" : "text-muted-foreground"
                                )}>
                                  {enh.description}
                                </p>
                                {isLocked && enh.validation.reason && (
                                  <p className="text-[10px] text-destructive/80 mt-1 flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    {enh.validation.reason}
                                  </p>
                                )}
                                {!isLocked && enh.requirements && (
                                  <p className="text-[10px] text-success/80 mt-1 flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    {enh.requirements} ✓
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </TooltipTrigger>
                        {isLocked && (
                          <TooltipContent side="left">
                            <p className="font-medium">Requisito não atendido</p>
                            <p className="text-xs text-muted-foreground">{enh.validation.reason}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            )}

            {/* Resumo de custo com validação de PE por turno */}
            <div className={cn(
              "p-4 rounded-lg border-2",
              canCast 
                ? "bg-success/5 border-success/30" 
                : "bg-destructive/5 border-destructive/30"
            )}>
              <div className="flex items-center justify-between">
                <span className="font-display tracking-wider">Custo Total</span>
                <div className="text-right">
                  <span className={cn(
                    "text-2xl font-bold",
                    canCast ? "text-pe" : "text-destructive"
                  )}>
                    {totalCost}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">PE</span>
                </div>
              </div>
              
              {/* Barra de PE */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>PE Atual</span>
                  <span>{peCurrent} / {peMax}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-300",
                      canCast ? "bg-pe" : "bg-destructive"
                    )}
                    style={{ width: `${(peCurrent / peMax) * 100}%` }}
                  />
                  {/* Indicador do custo */}
                  <div 
                    className="h-full bg-foreground/30 -mt-2"
                    style={{ 
                      width: `${(totalCost / peMax) * 100}%`,
                      marginLeft: `${Math.max(0, ((peCurrent - totalCost) / peMax) * 100)}%`
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Após conjurar: <span className={cn(
                    "font-medium",
                    peCurrent - totalCost < 0 ? "text-destructive" : "text-pe"
                  )}>
                    {Math.max(0, peCurrent - totalCost)} PE
                  </span>
                </p>
              </div>

              {/* Limite de PE por turno */}
              {turnPEState && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Limite por turno</span>
                    <span className={cn(
                      "font-medium",
                      peValidation.exceedsLimit ? "text-destructive" : "text-pe"
                    )}>
                      {turnPEState.peSpentThisTurn + totalCost} / {peLimitPerTurn} PE
                    </span>
                  </div>
                  {peValidation.exceedsLimit && (
                    <p className="text-[10px] text-yellow-400/80 mt-1">
                      Excede em {peValidation.exceededBy} PE o limite do turno
                    </p>
                  )}
                </div>
              )}

              {/* Mensagem de erro */}
              {!canCast && (
                <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {peValidation.reason}
                </p>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canCast}
            className={cn(
              "gap-2",
              canCast && elementConfig?.bg,
              canCast && elementConfig?.text,
              canCast && "hover:opacity-90"
            )}
          >
            <Zap className="w-4 h-4" />
            Conjurar ({totalCost} PE)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
