/**
 * PowerActivationPanel - Painel para ativar poderes durante testes de perícia
 * 
 * Permite ativar poderes do Especialista como:
 * - Conhecimento Aplicado (trocar atributo para INT)
 * - Mãos Rápidas (ação livre)
 * - Nerd (teste de Atualidades para info)
 * - Eclético (usar perícia como treinado)
 * - Perito (dado extra em perícia escolhida)
 * 
 * @module PowerActivationPanel
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Brain, Hand, BookOpen, Sparkles, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// ========================================
// TIPOS
// ========================================

/**
 * Poder ativável durante um teste
 */
export interface ActivatablePower {
  id: string;
  name: string;
  description: string;
  peCost: number;
  effect: string;
  icon: 'brain' | 'hand' | 'book' | 'zap' | 'sparkles';
  // Tipo de efeito
  effectType: 'attribute_swap' | 'free_action' | 'knowledge_check' | 'skill_trained' | 'extra_dice';
  // Para troca de atributo
  newAttribute?: 'intellect' | 'agility' | 'strength' | 'presence' | 'vigor';
  // Para dados extras
  extraDice?: string; // ex: "1d6"
  // Perícias aplicáveis (vazio = todas exceto Luta/Pontaria)
  applicableSkills?: string[];
  // Perícias excluídas
  excludedSkills?: string[];
}

/**
 * Estado de ativação de um poder
 */
export interface PowerActivationState {
  powerId: string;
  isActive: boolean;
  peCost: number;
}

/**
 * Props do componente
 */
interface PowerActivationPanelProps {
  // Poderes disponíveis para ativar
  availablePowers: ActivatablePower[];
  // Estado de ativação de cada poder
  activationStates: PowerActivationState[];
  // PE atual do personagem
  peCurrent: number;
  // Callback quando um poder é ativado/desativado
  onPowerToggle: (powerId: string, isActive: boolean) => void;
  // Perícia sendo testada (para filtrar poderes aplicáveis)
  currentSkill?: string;
  // Classes CSS adicionais
  className?: string;
  // Se o painel está expandido
  isExpanded?: boolean;
  // Toggle de expansão
  onExpandToggle?: () => void;
}

// ========================================
// ÍCONES
// ========================================

const POWER_ICONS = {
  brain: Brain,
  hand: Hand,
  book: BookOpen,
  zap: Zap,
  sparkles: Sparkles,
};

// ========================================
// CONSTANTES - PODERES DO ESPECIALISTA
// ========================================

/**
 * Lista de poderes ativáveis do Especialista
 * Estes são os poderes que podem ser usados durante testes de perícia
 */
export const ESPECIALISTA_ACTIVATABLE_POWERS: ActivatablePower[] = [
  {
    id: 'conhecimento-aplicado',
    name: 'Conhecimento Aplicado',
    description: 'Troca o atributo-base da perícia para Intelecto.',
    peCost: 2,
    effect: 'Usar INT no teste',
    icon: 'brain',
    effectType: 'attribute_swap',
    newAttribute: 'intellect',
    excludedSkills: ['luta', 'pontaria'],
  },
  {
    id: 'maos-rapidas',
    name: 'Mãos Rápidas',
    description: 'Faz o teste de Crime como ação livre.',
    peCost: 1,
    effect: 'Ação livre',
    icon: 'hand',
    effectType: 'free_action',
    applicableSkills: ['crime'],
  },
  {
    id: 'nerd',
    name: 'Nerd',
    description: 'Teste de Atualidades (DT 20) para obter informação útil.',
    peCost: 2,
    effect: 'Info extra (1x/cena)',
    icon: 'book',
    effectType: 'knowledge_check',
    applicableSkills: ['atualidades'],
  },
  {
    id: 'ecletico',
    name: 'Eclético',
    description: 'Recebe os benefícios de ser treinado na perícia.',
    peCost: 2,
    effect: '+5 (treinado)',
    icon: 'zap',
    effectType: 'skill_trained',
    excludedSkills: ['luta', 'pontaria'],
  },
  {
    id: 'perito',
    name: 'Perito',
    description: 'Soma dado extra ao resultado do teste.',
    peCost: 2,
    effect: '+1d6',
    icon: 'sparkles',
    effectType: 'extra_dice',
    extraDice: '1d6',
    excludedSkills: ['luta', 'pontaria'],
  },
];

// ========================================
// HELPERS
// ========================================

/**
 * Verifica se um poder é aplicável à perícia atual
 */
function isPowerApplicable(power: ActivatablePower, skillId?: string): boolean {
  if (!skillId) return true;
  
  const normalizedSkill = skillId.toLowerCase().replace(/\s+/g, '');
  
  // Se tem lista de perícias aplicáveis, verifica
  if (power.applicableSkills && power.applicableSkills.length > 0) {
    return power.applicableSkills.some(s => 
      normalizedSkill.includes(s.toLowerCase().replace(/\s+/g, ''))
    );
  }
  
  // Se tem lista de perícias excluídas, verifica
  if (power.excludedSkills && power.excludedSkills.length > 0) {
    return !power.excludedSkills.some(s => 
      normalizedSkill.includes(s.toLowerCase().replace(/\s+/g, ''))
    );
  }
  
  return true;
}

/**
 * Calcula o dado do Perito baseado no NEX
 */
export function getPeritoExtraDice(nex: number): { dice: string; cost: number } {
  if (nex >= 85) return { dice: '1d12', cost: 5 };
  if (nex >= 55) return { dice: '1d10', cost: 4 };
  if (nex >= 25) return { dice: '1d8', cost: 3 };
  return { dice: '1d6', cost: 2 };
}

/**
 * Calcula o nível do Eclético baseado no NEX
 */
export function getEcleticoLevel(nex: number): { level: string; baseCost: number; extraCost: number } {
  if (nex >= 75) return { level: 'expert', baseCost: 2, extraCost: 4 }; // 2 + 4 = 6 PE
  if (nex >= 40) return { level: 'veteran', baseCost: 2, extraCost: 2 }; // 2 + 2 = 4 PE
  return { level: 'trained', baseCost: 2, extraCost: 0 }; // 2 PE
}

// ========================================
// COMPONENTE
// ========================================

export function PowerActivationPanel({
  availablePowers,
  activationStates,
  peCurrent,
  onPowerToggle,
  currentSkill,
  className,
  isExpanded = true,
  onExpandToggle,
}: PowerActivationPanelProps) {
  // Filtra poderes aplicáveis à perícia atual
  const applicablePowers = useMemo(() => {
    return availablePowers.filter(power => isPowerApplicable(power, currentSkill));
  }, [availablePowers, currentSkill]);

  // Calcula PE total que será gasto
  const totalPECost = useMemo(() => {
    return activationStates
      .filter(s => s.isActive)
      .reduce((sum, s) => sum + s.peCost, 0);
  }, [activationStates]);

  // Verifica se pode pagar pelo poder
  const canAffordPower = (power: ActivatablePower) => {
    const currentState = activationStates.find(s => s.powerId === power.id);
    if (currentState?.isActive) return true; // Já ativo, pode desativar
    return peCurrent >= totalPECost + power.peCost;
  };

  // Se não há poderes aplicáveis, não renderiza
  if (applicablePowers.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Collapsible open={isExpanded} onOpenChange={onExpandToggle}>
        <div className={cn("space-y-2", className)}>
          {/* Header */}
          <CollapsibleTrigger asChild>
            <button 
              className="w-full flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Poderes Disponíveis</span>
                {totalPECost > 0 && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                    -{totalPECost} PE
                  </Badge>
                )}
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>

          {/* Lista de poderes */}
          <CollapsibleContent>
            <AnimatePresence mode="popLayout">
              <div className="space-y-1.5 pt-1">
                {applicablePowers.map((power) => {
                  const Icon = POWER_ICONS[power.icon];
                  const state = activationStates.find(s => s.powerId === power.id);
                  const isActive = state?.isActive || false;
                  const canAfford = canAffordPower(power);
                  const isDisabled = !canAfford && !isActive;

                  return (
                    <motion.div
                      key={power.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg transition-all",
                          isActive 
                            ? "bg-primary/15 border border-primary/30"
                            : "bg-muted/30 hover:bg-muted/50",
                          isDisabled && "opacity-50"
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Icon className={cn(
                            "w-4 h-4 shrink-0",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )} />
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex-1 min-w-0 cursor-help">
                                <p className={cn(
                                  "text-sm font-medium truncate",
                                  isActive && "text-primary"
                                )}>
                                  {power.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {power.effect}
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              <p className="font-medium">{power.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {power.description}
                              </p>
                            </TooltipContent>
                          </Tooltip>

                          {/* Custo em PE */}
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-xs shrink-0",
                              isActive && "bg-primary/20 text-primary"
                            )}
                          >
                            {power.peCost} PE
                          </Badge>
                        </div>

                        {/* Toggle */}
                        <div className="ml-2 shrink-0">
                          {isDisabled ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="p-1">
                                  <AlertCircle className="w-4 h-4 text-destructive/50" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p className="text-xs">PE insuficiente</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Switch
                              checked={isActive}
                              onCheckedChange={(checked) => onPowerToggle(power.id, checked)}
                              className="data-[state=checked]:bg-primary"
                            />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>

            {/* Aviso de PE */}
            {totalPECost > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 p-2 rounded bg-primary/10 border border-primary/20"
              >
                <p className="text-xs text-primary text-center">
                  Custo total: <span className="font-bold">{totalPECost} PE</span>
                  {' '}(Atual: {peCurrent} PE → {peCurrent - totalPECost} PE)
                </p>
              </motion.div>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>
    </TooltipProvider>
  );
}

/**
 * Hook para gerenciar estado de ativação de poderes
 */
export function usePowerActivation(availablePowers: ActivatablePower[]) {
  const [activationStates, setActivationStates] = React.useState<PowerActivationState[]>(
    availablePowers.map(p => ({ powerId: p.id, isActive: false, peCost: p.peCost }))
  );

  const togglePower = React.useCallback((powerId: string, isActive: boolean) => {
    setActivationStates(prev => 
      prev.map(s => s.powerId === powerId ? { ...s, isActive } : s)
    );
  }, []);

  const resetActivations = React.useCallback(() => {
    setActivationStates(prev => prev.map(s => ({ ...s, isActive: false })));
  }, []);

  const getActivePowers = React.useCallback(() => {
    return activationStates.filter(s => s.isActive);
  }, [activationStates]);

  const getTotalPECost = React.useCallback(() => {
    return activationStates
      .filter(s => s.isActive)
      .reduce((sum, s) => sum + s.peCost, 0);
  }, [activationStates]);

  return {
    activationStates,
    togglePower,
    resetActivations,
    getActivePowers,
    getTotalPECost,
  };
}
