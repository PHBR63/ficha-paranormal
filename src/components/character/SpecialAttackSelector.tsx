/**
 * SpecialAttackSelector - Componente para seleção do Ataque Especial do Combatente
 * 
 * Permite distribuir livremente os bônus entre ataque e dano conforme as regras oficiais:
 * - Custo base: 2 PE para +5
 * - Escalonamento por NEX: +1 PE adicional para +5 extra
 * - Distribuição: cada +5 pode ser aplicado separadamente
 * - Integração com Força Bruta (+2/PE no dano) e Potência Máxima (dobra corpo a corpo)
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Sword, Target, Zap, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  getSpecialAttackOptions,
  calculateSpecialAttackFinal,
  calculateDynamicPECost,
  SpecialAttackConfig,
  SpecialAttackResult,
  hasSpecialAttack,
  hasForcaBrutaAbility,
  isMeleeWeapon,
  createEmptySpecialAttackConfig,
} from '@/lib/class-powers/special-attack-utils';

interface SpecialAttackSelectorProps {
  /** NEX do personagem */
  nex: number;
  /** Lista de habilidades do personagem */
  abilities: string[];
  /** Tipo da arma (para detectar corpo a corpo) */
  weaponType?: string;
  /** Se Potência Máxima está ativa */
  hasPotenciaMaxima?: boolean;
  /** PE atual do personagem */
  currentPE: number;
  /** Configuração atual do Ataque Especial */
  config: SpecialAttackConfig;
  /** Callback quando a configuração muda */
  onConfigChange: (config: SpecialAttackConfig) => void;
  /** Variante visual (compact para mobile) */
  variant?: 'default' | 'compact';
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Componente de seleção do Ataque Especial com distribuição flexível
 */
export function SpecialAttackSelector({
  nex,
  abilities,
  weaponType,
  hasPotenciaMaxima = false,
  currentPE,
  config,
  onConfigChange,
  variant = 'default',
  className,
}: SpecialAttackSelectorProps) {
  // Verifica se possui a habilidade Ataque Especial
  const canUseSpecialAttack = useMemo(() => hasSpecialAttack(abilities), [abilities]);
  
  // Verifica se possui Força Bruta
  const hasForcaBruta = useMemo(() => hasForcaBrutaAbility(abilities), [abilities]);
  
  // Verifica se é arma corpo a corpo (para Potência Máxima)
  const isMelee = useMemo(() => isMeleeWeapon(weaponType), [weaponType]);
  
  // Opções baseadas no NEX
  const options = useMemo(() => getSpecialAttackOptions(nex), [nex]);
  
  // Calcula o resultado final
  const result = useMemo((): SpecialAttackResult => {
    return calculateSpecialAttackFinal(
      nex,
      config,
      hasForcaBruta,
      hasPotenciaMaxima,
      isMelee
    );
  }, [nex, config, hasForcaBruta, hasPotenciaMaxima, isMelee]);
  
  // Total de incrementos usados
  const totalUsed = config.attackIncrements + config.damageIncrements;
  const incrementsRemaining = options.increments - totalUsed;
  
  // Custo dinâmico baseado nos incrementos usados (não no tier máximo)
  const dynamicPECost = useMemo(() => 
    calculateDynamicPECost(totalUsed),
    [totalUsed]
  );
  
  // Verifica se pode pagar pelo menos 1 incremento (custo mínimo = 2 PE)
  const canAfford = currentPE >= 2;
  
  // Toggle ativar/desativar
  const handleToggle = useCallback((enabled: boolean) => {
    if (enabled && !canAfford) return;
    onConfigChange({
      ...config,
      enabled,
      // Reset se desabilitando
      attackIncrements: enabled ? config.attackIncrements : 0,
      damageIncrements: enabled ? config.damageIncrements : 0,
    });
  }, [config, onConfigChange, canAfford]);
  
  // Incrementar ataque
  const incrementAttack = useCallback(() => {
    if (!config.enabled || incrementsRemaining <= 0) return;
    onConfigChange({
      ...config,
      attackIncrements: config.attackIncrements + 1,
    });
  }, [config, onConfigChange, incrementsRemaining]);
  
  // Decrementar ataque
  const decrementAttack = useCallback(() => {
    if (!config.enabled || config.attackIncrements <= 0) return;
    onConfigChange({
      ...config,
      attackIncrements: config.attackIncrements - 1,
    });
  }, [config, onConfigChange]);
  
  // Incrementar dano
  const incrementDamage = useCallback(() => {
    if (!config.enabled || incrementsRemaining <= 0) return;
    onConfigChange({
      ...config,
      damageIncrements: config.damageIncrements + 1,
    });
  }, [config, onConfigChange, incrementsRemaining]);
  
  // Decrementar dano
  const decrementDamage = useCallback(() => {
    if (!config.enabled || config.damageIncrements <= 0) return;
    onConfigChange({
      ...config,
      damageIncrements: config.damageIncrements - 1,
    });
  }, [config, onConfigChange]);
  
  // Atalho: tudo para ataque
  const allToAttack = useCallback(() => {
    if (!config.enabled) return;
    onConfigChange({
      ...config,
      attackIncrements: options.increments,
      damageIncrements: 0,
    });
  }, [config, onConfigChange, options.increments]);
  
  // Atalho: tudo para dano
  const allToDamage = useCallback(() => {
    if (!config.enabled) return;
    onConfigChange({
      ...config,
      attackIncrements: 0,
      damageIncrements: options.increments,
    });
  }, [config, onConfigChange, options.increments]);
  
  // Se não possui a habilidade, não renderiza
  if (!canUseSpecialAttack) {
    return null;
  }
  
  // Variante compacta para mobile
  if (variant === 'compact') {
    return (
      <div className={cn("space-y-2", className)}>
        {/* Header com toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Switch
              aria-label="Ativar Ataque Especial"
              checked={config.enabled}
              onCheckedChange={handleToggle}
              disabled={!canAfford}
            />
            <span className="text-sm font-medium">Ataque Especial</span>
            <Badge variant={dynamicPECost > 0 ? "default" : "secondary"} className="text-xs">
              {dynamicPECost > 0 ? dynamicPECost : `max ${options.maxPECost}`} PE
            </Badge>
          </div>
          <Badge variant="outline" className="text-xs">
            {options.nexTier}
          </Badge>
        </div>
        
        {/* Controles quando ativo */}
        <AnimatePresence>
          {config.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {/* Barra de progressão de custo de PE */}
              <div className="flex items-center justify-center gap-1">
                {Array.from({ length: options.increments }, (_, i) => {
                  const incrementNumber = i + 1;
                  const peCostForThis = 1 + incrementNumber; // 2 PE, 3 PE, 4 PE, 5 PE
                  const isActive = totalUsed >= incrementNumber;
                  const isCurrent = totalUsed === incrementNumber;
                  return (
                    <motion.div
                      key={i}
                      className={cn(
                        "flex items-center justify-center rounded-md text-xs font-medium transition-all",
                        "h-6 min-w-[36px] px-1",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted/50 text-muted-foreground",
                        isCurrent && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                      )}
                      animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {peCostForThis} PE
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Distribuição */}
              <div className="grid grid-cols-2 gap-2">
                {/* Ataque */}
                <div className="flex items-center justify-between bg-blue-500/10 rounded-lg p-2">
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-blue-400" />
                    <span className="text-xs">Atk</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      aria-label="Reduzir bônus de ataque especial"
                      onClick={decrementAttack}
                      disabled={config.attackIncrements <= 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-bold text-blue-400 min-w-[32px] text-center">
                      +{result.attackBonus}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      aria-label="Aumentar bônus de ataque especial"
                      onClick={incrementAttack}
                      disabled={incrementsRemaining <= 0}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Dano */}
                <div className="flex items-center justify-between bg-red-500/10 rounded-lg p-2">
                  <div className="flex items-center gap-1">
                    <Sword className="h-3 w-3 text-red-400" />
                    <span className="text-xs">Dano</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      aria-label="Reduzir bônus de dano especial"
                      onClick={decrementDamage}
                      disabled={config.damageIncrements <= 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-bold text-red-400 min-w-[32px] text-center">
                      +{result.damageBonus}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      aria-label="Aumentar bônus de dano especial"
                      onClick={incrementDamage}
                      disabled={incrementsRemaining <= 0}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Badges de poderes ativos */}
              <div className="flex flex-wrap gap-1">
                {hasForcaBruta && config.damageIncrements > 0 && (
                  <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/30">
                    Força Bruta (+{dynamicPECost * 2})
                  </Badge>
                )}
                {hasPotenciaMaxima && isMelee && (
                  <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
                    Potência Máxima (x2)
                  </Badge>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Aviso PE insuficiente */}
        {!canAfford && (
          <p className="text-xs text-destructive">
            PE insuficiente ({currentPE}/2 mínimo necessário)
          </p>
        )}
      </div>
    );
  }
  
  // Variante padrão (desktop)
  return (
    <TooltipProvider>
      <div className={cn(
        "rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3",
        !canAfford && "opacity-60",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              aria-label="Ativar Ataque Especial"
              checked={config.enabled}
              onCheckedChange={handleToggle}
              disabled={!canAfford}
            />
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium">Ataque Especial</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={dynamicPECost > 0 ? "default" : "secondary"}>
              {dynamicPECost > 0 ? dynamicPECost : `max ${options.maxPECost}`} PE
            </Badge>
            <Badge variant="outline">
              {options.nexTier}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">
                  Gaste 2 PE para +5 em ataque ou dano. Cada +5 adicional custa +1 PE (máx {options.maxPECost} PE).
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        {/* Controles quando ativo */}
        <AnimatePresence>
          {config.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {/* Barra de progressão de custo de PE (desktop) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progressão de custo:</span>
                  <span>Usados: {totalUsed} / Disponíveis: {options.increments}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {Array.from({ length: options.increments }, (_, i) => {
                    const incrementNumber = i + 1;
                    const peCostForThis = 1 + incrementNumber; // 2 PE, 3 PE, 4 PE, 5 PE
                    const bonusForThis = incrementNumber * 5; // +5, +10, +15, +20
                    const isActive = totalUsed >= incrementNumber;
                    const isCurrent = totalUsed === incrementNumber;
                    return (
                      <Tooltip key={i}>
                        <TooltipTrigger asChild>
                          <motion.div
                            className={cn(
                              "flex flex-col items-center justify-center rounded-lg transition-all cursor-help",
                              "h-12 min-w-[52px] px-2 border",
                              isActive 
                                ? "bg-primary/20 border-primary text-primary" 
                                : "bg-muted/30 border-muted text-muted-foreground",
                              isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg"
                            )}
                            animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            <span className="text-sm font-bold">{peCostForThis} PE</span>
                            <span className="text-[10px] opacity-70">+{bonusForThis}</span>
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{incrementNumber}º incremento: +{bonusForThis} total por {peCostForThis} PE</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
              
              {/* Controles de distribuição */}
              <div className="grid grid-cols-2 gap-4">
                {/* Bônus de Ataque */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium">Ataque</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Destinar todo o bônus especial ao ataque"
                      onClick={allToAttack}
                      className="text-xs h-6"
                    >
                      Tudo
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 bg-blue-500/10 rounded-lg p-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Reduzir bônus de ataque especial"
                      onClick={decrementAttack}
                      disabled={config.attackIncrements <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <div className="text-center min-w-[60px]">
                      <div className="text-2xl font-bold text-blue-400">
                        +{result.attackBonus}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({config.attackIncrements}x +5)
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Aumentar bônus de ataque especial"
                      onClick={incrementAttack}
                      disabled={incrementsRemaining <= 0}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Bônus de Dano */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sword className="h-4 w-4 text-red-400" />
                      <span className="text-sm font-medium">Dano</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Destinar todo o bônus especial ao dano"
                      onClick={allToDamage}
                      className="text-xs h-6"
                    >
                      Tudo
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 bg-red-500/10 rounded-lg p-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Reduzir bônus de dano especial"
                      onClick={decrementDamage}
                      disabled={config.damageIncrements <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <div className="text-center min-w-[60px]">
                      <div className="text-2xl font-bold text-red-400">
                        +{result.damageBonus}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({config.damageIncrements}x +5)
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Aumentar bônus de dano especial"
                      onClick={incrementDamage}
                      disabled={incrementsRemaining <= 0}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Poderes especiais ativos */}
              {(hasForcaBruta || (hasPotenciaMaxima && isMelee)) && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                  {hasForcaBruta && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "bg-orange-500/10 text-orange-400 border-orange-500/30",
                            config.damageIncrements === 0 && "opacity-50"
                          )}
                        >
                          Força Bruta {config.damageIncrements > 0 && `(+${dynamicPECost * 2} dano)`}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>+2 de dano por PE gasto quando você adiciona bônus ao dano</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {hasPotenciaMaxima && isMelee && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className="bg-purple-500/10 text-purple-400 border-purple-500/30"
                        >
                          Potência Máxima (x2)
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Dobra todos os bônus do Ataque Especial em ataques corpo a corpo</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
              
              {/* Breakdown */}
              {result.breakdown.length > 0 && (
                <div className="text-xs text-muted-foreground border-t border-border/50 pt-2 space-y-1">
                  {result.breakdown.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Aviso PE insuficiente */}
        {!canAfford && (
          <p className="text-xs text-destructive text-center">
            PE insuficiente ({currentPE}/2 mínimo necessário)
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Hook para gerenciar o estado do Ataque Especial
 */
export function useSpecialAttackState() {
  const [config, setConfig] = useState<SpecialAttackConfig>(createEmptySpecialAttackConfig());
  
  const reset = useCallback(() => {
    setConfig(createEmptySpecialAttackConfig());
  }, []);
  
  return {
    config,
    setConfig,
    reset,
  };
}
