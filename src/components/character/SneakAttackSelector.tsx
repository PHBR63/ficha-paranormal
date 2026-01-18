/**
 * SneakAttackSelector - Seletor de configuração do Ataque Furtivo
 * 
 * Permite ao jogador:
 * - Ativar/desativar Ataque Furtivo (1 PE base)
 * - Escolher PE extra para dados adicionais (+1d6 por PE)
 * - Ver custo total de PE
 * - Indicador visual quando Assassinar está ativo (dados dobrados)
 * 
 * Regras oficiais (Ordem Paranormal v1.3):
 * - NEX 10%: +1d6 (1 PE base)
 * - NEX 40%: +2d6 (1 PE base)
 * - NEX 65%: +3d6 (1 PE base) + Assassinar disponível
 * - NEX 99%: +4d6 (1 PE base) + Sombra Fugaz
 * - Pode gastar PE adicional para +1d6 cada (até limite por rodada)
 * - Assassinar dobra todos os dados
 * 
 * @module character/SneakAttackSelector
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Skull, Plus, Minus, Zap, Info, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getPELimitByNex } from '@/lib/dice-roller';

// =====================================================
// Tipos e Interfaces
// =====================================================

/** Configuração do Ataque Furtivo selecionada pelo jogador */
export interface SneakAttackConfig {
  /** Se o Ataque Furtivo está habilitado */
  enabled: boolean;
  /** PE extra gasto além do custo base de 1 PE */
  extraPE: number;
}

/** Resultado calculado do Ataque Furtivo */
export interface SneakAttackResult {
  /** Quantidade de dados base pelo NEX */
  baseDice: number;
  /** Dados extras pelo PE adicional */
  extraDice: number;
  /** Total de dados antes da dobra */
  totalDice: number;
  /** Se Assassinar está ativo (dobra dados) */
  isDoubled: boolean;
  /** Quantidade final de dados a rolar */
  finalDice: number;
  /** Custo total de PE (1 + extraPE) */
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
// Funções Auxiliares
// =====================================================

/**
 * Calcula a quantidade de dados base do Ataque Furtivo pelo NEX
 */
export function getSneakAttackBaseDice(nex: number): number {
  if (nex >= 99) return 4;
  if (nex >= 65) return 3;
  if (nex >= 40) return 2;
  return 1;
}

/**
 * Calcula o resultado final do Ataque Furtivo
 */
export function calculateSneakAttackResult(
  nex: number,
  config: SneakAttackConfig,
  assassinarActive: boolean
): SneakAttackResult {
  const baseDice = getSneakAttackBaseDice(nex);
  const extraDice = config.extraPE;
  const totalDice = baseDice + extraDice;
  const finalDice = assassinarActive ? totalDice * 2 : totalDice;
  const peCost = 1 + config.extraPE;
  
  return {
    baseDice,
    extraDice,
    totalDice,
    isDoubled: assassinarActive,
    finalDice,
    peCost,
  };
}

/**
 * Cria uma configuração vazia do Ataque Furtivo
 */
export function createEmptySneakAttackConfig(): SneakAttackConfig {
  return {
    enabled: false,
    extraPE: 0,
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
  // Calcula limites e valores
  const peLimit = useMemo(() => getPELimitByNex(nex), [nex]);
  const maxExtraPE = useMemo(() => Math.max(0, peLimit - 1), [peLimit]); // -1 porque 1 PE é o custo base
  
  // Resultado calculado
  const result = useMemo(
    () => calculateSneakAttackResult(nex, config, assassinarActive),
    [nex, config, assassinarActive]
  );
  
  // Verifica se tem PE suficiente
  const canAfford = currentPE >= result.peCost;
  const hasInsufficientPE = config.enabled && !canAfford;
  
  // Handlers
  const handleToggle = useCallback((enabled: boolean) => {
    onConfigChange({
      ...config,
      enabled,
      extraPE: enabled ? config.extraPE : 0,
    });
  }, [config, onConfigChange]);
  
  const handleIncrementExtra = useCallback(() => {
    if (config.extraPE < maxExtraPE && currentPE >= result.peCost + 1) {
      onConfigChange({
        ...config,
        extraPE: config.extraPE + 1,
      });
    }
  }, [config, maxExtraPE, currentPE, result.peCost, onConfigChange]);
  
  const handleDecrementExtra = useCallback(() => {
    if (config.extraPE > 0) {
      onConfigChange({
        ...config,
        extraPE: config.extraPE - 1,
      });
    }
  }, [config, onConfigChange]);
  
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
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium">Ataque Furtivo</span>
            {assassinarActive && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
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
        
        {/* Conteúdo quando ativado */}
        <AnimatePresence>
          {config.enabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t border-purple-500/20 space-y-2">
                {/* Dados e custo */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Dados: <span className="text-purple-300 font-medium">{result.finalDice}d6</span>
                    {assassinarActive && <span className="text-red-400 ml-1">(dobrado!)</span>}
                  </span>
                  <span className={cn(
                    "font-medium",
                    hasInsufficientPE ? "text-destructive" : "text-amber-400"
                  )}>
                    {result.peCost} PE
                  </span>
                </div>
                
                {/* Controle de PE extra */}
                {maxExtraPE > 0 && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">PE Extra (+1d6 cada):</span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6"
                        onClick={handleDecrementExtra}
                        disabled={config.extraPE === 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{config.extraPE}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6"
                        onClick={handleIncrementExtra}
                        disabled={config.extraPE >= maxExtraPE || currentPE < result.peCost + 1}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Aviso de PE insuficiente */}
                {hasInsufficientPE && (
                  <div className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    <span>PE insuficiente!</span>
                  </div>
                )}
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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Crosshair className="h-5 w-5 text-purple-400" />
          <span className="font-medium">Ataque Furtivo</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>1x/rodada contra alvo desprevenido (corpo a corpo, curto ou flanqueando).</p>
                <p className="mt-1">Custo base: 1 PE. Pode gastar PE extra para +1d6 cada.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Badge de Assassinar */}
          {assassinarActive && (
            <Badge variant="destructive" className="text-xs">
              <Skull className="h-3 w-3 mr-1" />
              Assassinar (2x dados)
            </Badge>
          )}
          
          {/* Custo de PE */}
          <Badge 
            variant={hasInsufficientPE ? "destructive" : "secondary"}
            className="text-xs"
          >
            <Zap className="h-3 w-3 mr-1" />
            {result.peCost} PE
          </Badge>
          
          <Switch
            checked={config.enabled}
            onCheckedChange={handleToggle}
            disabled={!canAfford && !config.enabled}
          />
        </div>
      </div>
      
      {/* Conteúdo expandido quando ativado */}
      <AnimatePresence>
        {config.enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-purple-500/20">
              {/* Breakdown de dados */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                {/* Dados base */}
                <div className="text-center p-2 rounded bg-purple-900/20">
                  <div className="text-xs text-muted-foreground mb-1">Dados Base (NEX {nex}%)</div>
                  <div className="text-lg font-bold text-purple-300">{result.baseDice}d6</div>
                </div>
                
                {/* Dados finais */}
                <div className="text-center p-2 rounded bg-purple-900/30">
                  <div className="text-xs text-muted-foreground mb-1">
                    Dados Finais
                    {assassinarActive && <span className="text-red-400 ml-1">(2x)</span>}
                  </div>
                  <div className={cn(
                    "text-lg font-bold",
                    assassinarActive ? "text-red-400" : "text-purple-300"
                  )}>
                    {result.finalDice}d6
                  </div>
                </div>
              </div>
              
              {/* Controle de PE extra */}
              {maxExtraPE > 0 && (
                <div className="flex items-center justify-between p-3 rounded bg-muted/30">
                  <div>
                    <div className="text-sm font-medium">PE Extra</div>
                    <div className="text-xs text-muted-foreground">
                      +1d6 por PE (máx: {maxExtraPE})
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={handleDecrementExtra}
                      disabled={config.extraPE === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <div className="w-12 text-center">
                      <span className="text-lg font-bold">{config.extraPE}</span>
                      <span className="text-xs text-muted-foreground ml-1">PE</span>
                    </div>
                    
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={handleIncrementExtra}
                      disabled={config.extraPE >= maxExtraPE || currentPE < result.peCost + 1}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Aviso de PE insuficiente */}
              {hasInsufficientPE && (
                <div className="flex items-center gap-2 mt-3 p-2 rounded bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>PE insuficiente para ativar Ataque Furtivo!</span>
                </div>
              )}
              
              {/* Resumo */}
              {!hasInsufficientPE && (
                <div className="mt-3 text-xs text-muted-foreground text-center">
                  {result.baseDice}d6 (base) 
                  {result.extraDice > 0 && <span> + {result.extraDice}d6 (extra)</span>}
                  {assassinarActive && <span className="text-red-400"> × 2 (Assassinar)</span>}
                  <span> = </span>
                  <span className="font-bold text-purple-300">{result.finalDice}d6 dano extra</span>
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
