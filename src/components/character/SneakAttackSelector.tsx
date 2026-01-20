/**
 * SneakAttackSelector - Seletor de configuração do Ataque Furtivo
 * 
 * Regras oficiais (Ordem Paranormal v1.3):
 * - Custo: 1 PE (fixo)
 * - Dados determinados automaticamente pelo NEX:
 *   - NEX 10%: +1d6
 *   - NEX 40%: +2d6
 *   - NEX 65%: +3d6
 *   - NEX 99%: +4d6
 * - Condição: 1x/rodada, contra alvo desprevenido/flanqueado
 * - Assassinar (NEX 65%): dobra os dados
 * 
 * @module character/SneakAttackSelector
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Skull, Zap, Info, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// =====================================================
// Tipos e Interfaces
// =====================================================

/** Configuração do Ataque Furtivo selecionada pelo jogador */
export interface SneakAttackConfig {
  /** Se o Ataque Furtivo está habilitado para o próximo ataque */
  enabled: boolean;
}

/** Resultado calculado do Ataque Furtivo */
export interface SneakAttackResult {
  /** Quantidade de dados pelo NEX */
  dice: number;
  /** Se Assassinar está ativo (dobra dados) */
  isDoubled: boolean;
  /** Quantidade final de dados a rolar */
  finalDice: number;
  /** Custo de PE (sempre 1) */
  peCost: number;
}

/** Props do componente SneakAttackSelector */
export interface SneakAttackSelectorProps {
  /** NEX do personagem (determina dados base) */
  nex: number;
  /** PE atual do personagem */
  currentPE: number;
  /** Configuração atual */
  config: SneakAttackConfig;
  /** Callback quando a configuração muda */
  onConfigChange: (config: SneakAttackConfig) => void;
  /** Se Assassinar está ativo */
  assassinarActive?: boolean;
  /** Variante visual */
  variant?: 'default' | 'compact';
  /** Classe CSS adicional */
  className?: string;
}

// =====================================================
// Constantes
// =====================================================

/** Custo fixo de PE do Ataque Furtivo (regra oficial) */
export const SNEAK_ATTACK_PE_COST = 1;

// =====================================================
// Funções Auxiliares
// =====================================================

/**
 * Calcula a quantidade de dados do Ataque Furtivo pelo NEX
 * Conforme tabela oficial do Livro Base v1.3
 */
export function getSneakAttackBaseDice(nex: number): number {
  if (nex >= 99) return 4;
  if (nex >= 65) return 3;
  if (nex >= 40) return 2;
  return 1;
}

/**
 * Calcula o resultado do Ataque Furtivo
 * Custo sempre 1 PE, dados determinados pelo NEX
 */
export function calculateSneakAttackResult(
  nex: number,
  config: SneakAttackConfig,
  assassinarActive: boolean
): SneakAttackResult {
  const dice = getSneakAttackBaseDice(nex);
  const finalDice = assassinarActive ? dice * 2 : dice;
  
  return {
    dice,
    isDoubled: assassinarActive,
    finalDice,
    peCost: SNEAK_ATTACK_PE_COST,
  };
}

/**
 * Cria uma configuração vazia do Ataque Furtivo
 */
export function createEmptySneakAttackConfig(): SneakAttackConfig {
  return {
    enabled: false,
  };
}

// =====================================================
// Componente Principal
// =====================================================

export function SneakAttackSelector({
  nex,
  currentPE,
  config,
  onConfigChange,
  assassinarActive = false,
  variant = 'default',
  className,
}: SneakAttackSelectorProps) {
  // Resultado calculado
  const result = useMemo(
    () => calculateSneakAttackResult(nex, config, assassinarActive),
    [nex, config, assassinarActive]
  );
  
  // Verifica se tem PE suficiente (sempre 1 PE)
  const canAfford = currentPE >= SNEAK_ATTACK_PE_COST;
  const hasInsufficientPE = config.enabled && !canAfford;
  
  // Handler do toggle
  const handleToggle = useCallback((enabled: boolean) => {
    onConfigChange({ enabled });
  }, [onConfigChange]);
  
  // === VARIANTE COMPACTA (MOBILE) ===
  if (variant === 'compact') {
    return (
      <div className={cn(
        "p-3 rounded-lg border transition-all",
        config.enabled 
          ? "bg-purple-950/40 border-purple-500/40" 
          : "bg-muted/30 border-border/50",
        hasInsufficientPE && "border-destructive/50",
        className
      )}>
        {/* Header com toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Crosshair className="h-4 w-4 text-purple-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium">Ataque Furtivo</span>
              <span className="text-xs text-muted-foreground">
                +{result.finalDice}d6 • 1 PE
              </span>
            </div>
            {assassinarActive && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                <Skull className="h-3 w-3 mr-0.5" />
                2x
              </Badge>
            )}
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={handleToggle}
            disabled={!canAfford && !config.enabled}
          />
        </div>
        
        {/* Aviso de PE insuficiente */}
        <AnimatePresence>
          {hasInsufficientPE && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-1 text-xs text-destructive mt-2 pt-2 border-t border-destructive/20">
                <AlertCircle className="h-3 w-3" />
                <span>PE insuficiente!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  
  // === VARIANTE PADRÃO (DESKTOP) ===
  return (
    <div className={cn(
      "p-4 rounded-lg border transition-all",
      config.enabled 
        ? "bg-purple-950/30 border-purple-500/30" 
        : "bg-muted/20 border-border/50",
      hasInsufficientPE && "border-destructive/50",
      className
    )}>
      {/* Header com toggle e info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crosshair className="h-5 w-5 text-purple-400" />
          <span className="font-medium">Ataque Furtivo</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium mb-1">Ataque Furtivo (1 PE)</p>
                <p>1x/rodada contra alvo desprevenido (corpo a corpo, curto ou flanqueando).</p>
                <p className="mt-1 text-purple-300">+{result.dice}d6 dano extra (NEX {nex}%)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Badge de Assassinar */}
          {assassinarActive && (
            <Badge variant="destructive" className="text-xs">
              <Skull className="h-3 w-3 mr-1" />
              Assassinar (2x)
            </Badge>
          )}
          
          {/* Custo de PE fixo */}
          <Badge 
            variant={hasInsufficientPE ? "destructive" : "secondary"}
            className="text-xs"
          >
            <Zap className="h-3 w-3 mr-1" />
            1 PE
          </Badge>
          
          <Switch
            checked={config.enabled}
            onCheckedChange={handleToggle}
            disabled={!canAfford && !config.enabled}
          />
        </div>
      </div>
      
      {/* Info de dados quando ativado */}
      <AnimatePresence>
        {config.enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-purple-500/20">
              {/* Dados */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Dano extra (NEX {nex}%):
                </span>
                <span className={cn(
                  "text-lg font-bold",
                  assassinarActive ? "text-red-400" : "text-purple-300"
                )}>
                  +{result.finalDice}d6
                  {assassinarActive && <span className="text-sm ml-1">(dobrado!)</span>}
                </span>
              </div>
              
              {/* Aviso de PE insuficiente */}
              {hasInsufficientPE && (
                <div className="flex items-center gap-2 mt-3 p-2 rounded bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>PE insuficiente para ativar Ataque Furtivo!</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================================
// Hook para Gerenciar Estado
// =====================================================

/**
 * Hook para gerenciar o estado do Ataque Furtivo
 */
export function useSneakAttackState() {
  const [config, setConfig] = useState<SneakAttackConfig>(createEmptySneakAttackConfig());
  
  const reset = useCallback(() => {
    setConfig(createEmptySneakAttackConfig());
  }, []);
  
  return { config, setConfig, reset };
}
