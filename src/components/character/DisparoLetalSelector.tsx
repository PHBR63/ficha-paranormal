/**
 * DisparoLetalSelector - Seletor para ativar Disparo Letal (Atirador de Elite NEX 40%+)
 * 
 * Funcionalidades:
 * - Toggle para ativar/desativar Disparo Letal
 * - Mostra custo de 1 PE e efeito (+2 margem de ameaça)
 * - Exige declaração da ação Mirar antes da ativação
 * - Valida PE disponível
 * 
 * Regra oficial (Livro Base v1.3):
 * "Quando faz a ação Mirar, você pode gastar 1 PE para aumentar
 * em +2 a margem de ameaça do próximo ataque até o final de seu próximo turno."
 * 
 * @module DisparoLetalSelector
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, AlertCircle, Zap, Info } from '@/components/icons/ordem-icons';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// =====================================================
// Tipos e Interfaces
// =====================================================

/** Configuração do Disparo Letal */
export interface DisparoLetalConfig {
  enabled: boolean;
  mirarDeclared: boolean;
}

/** Resultado do cálculo do Disparo Letal */
export interface DisparoLetalResult {
  enabled: boolean;
  peCost: number;           // Custo de PE (1)
  criticalMarginBonus: number; // Bônus na margem de crítico (+2)
}

/** Props do componente */
export interface DisparoLetalSelectorProps {
  nex: number;
  currentPE: number;
  config: DisparoLetalConfig;
  onConfigChange: (config: DisparoLetalConfig) => void;
  variant?: 'default' | 'compact';
  className?: string;
}

// =====================================================
// Constantes
// =====================================================

const DISPARO_LETAL_PE_COST = 1;
const DISPARO_LETAL_MARGIN_BONUS = 2;
const DISPARO_LETAL_MIN_NEX = 40;

// =====================================================
// Funções Helper
// =====================================================

/**
 * Calcula o resultado do Disparo Letal baseado na configuração
 */
export function calculateDisparoLetalResult(
  nex: number,
  config: DisparoLetalConfig
): DisparoLetalResult {
  // Verifica se tem NEX suficiente
  if (nex < DISPARO_LETAL_MIN_NEX) {
    return {
      enabled: false,
      peCost: 0,
      criticalMarginBonus: 0,
    };
  }

  // Se não está habilitado, retorna valores zerados
  if (!config.enabled || !config.mirarDeclared) {
    return {
      enabled: false,
      peCost: 0,
      criticalMarginBonus: 0,
    };
  }

  return {
    enabled: true,
    peCost: DISPARO_LETAL_PE_COST,
    criticalMarginBonus: DISPARO_LETAL_MARGIN_BONUS,
  };
}

/**
 * Cria uma configuração vazia/desabilitada
 */
export function createEmptyDisparoLetalConfig(): DisparoLetalConfig {
  return { enabled: false, mirarDeclared: false };
}

// =====================================================
// Hook para gerenciar estado
// =====================================================

/**
 * Hook para gerenciar o estado do Disparo Letal
 */
export function useDisparoLetalState() {
  const [config, setConfig] = useState<DisparoLetalConfig>(createEmptyDisparoLetalConfig());

  const resetDisparoLetal = () => {
    setConfig(createEmptyDisparoLetalConfig());
  };

  return {
    config,
    setConfig,
    resetDisparoLetal,
  };
}

// =====================================================
// Componente Principal
// =====================================================

export function DisparoLetalSelector({
  nex,
  currentPE,
  config,
  onConfigChange,
  variant = 'default',
  className,
}: DisparoLetalSelectorProps) {
  // Valida NEX mínimo
  const isUnlocked = nex >= DISPARO_LETAL_MIN_NEX;
  
  // Valida PE disponível
  const canAfford = currentPE >= DISPARO_LETAL_PE_COST;
  const showInsufficientPE = config.enabled && !canAfford;

  // Handler para toggle
  const handleToggle = (enabled: boolean) => {
    onConfigChange({ ...config, enabled: enabled && config.mirarDeclared });
  };

  /** A declaração vale somente para este ataque e é retirada junto da ativação. */
  const handleMirarDeclaration = (declared: boolean) => {
    onConfigChange({ enabled: declared && config.enabled, mirarDeclared: declared });
  };

  const mirarControl = (
    <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs leading-5 text-foreground">
      <Checkbox
        checked={config.mirarDeclared}
        onCheckedChange={checked => handleMirarDeclaration(checked === true)}
        aria-label="Confirmo que fiz a ação Mirar e este é o próximo ataque no prazo"
      />
      <span>Fiz a ação Mirar; este é meu próximo ataque até o fim do meu próximo turno.</span>
    </label>
  );

  // Se não tem NEX suficiente, não renderiza
  if (!isUnlocked) return null;

  // Variante compacta para mobile
  if (variant === 'compact') {
    return (
      <div className={cn(
        "p-3 rounded-lg border transition-all",
        config.enabled 
          ? "bg-amber-500/10 border-amber-500/30" 
          : "bg-muted/50 border-transparent",
        className
      )}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              config.enabled 
                ? "bg-amber-500/20 text-amber-400" 
                : "bg-muted text-muted-foreground"
            )}>
              <Crosshair className="w-4 h-4" />
            </div>
            
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">Disparo Letal</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="h-5 text-[10px] px-1.5 gap-1 border-amber-500/30 text-amber-400">
                  <Zap className="w-2.5 h-2.5" />
                  1 PE
                </Badge>
                <span>-2 margem crítico</span>
              </div>
            </div>
          </div>
          
          <Switch
            checked={config.enabled}
            onCheckedChange={handleToggle}
            disabled={(!canAfford || !config.mirarDeclared) && !config.enabled}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>
        {mirarControl}
        
        {/* Aviso de PE insuficiente */}
        <AnimatePresence>
          {showInsufficientPE && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 flex items-center gap-1.5 text-xs text-destructive"
            >
              <AlertCircle className="w-3 h-3" />
              PE insuficiente
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Variante padrão para desktop
  return (
    <div className={cn(
      "p-4 rounded-lg border transition-all",
      config.enabled 
        ? "bg-amber-500/10 border-amber-500/30" 
        : "bg-muted/30 border-muted",
      className
    )}>
      <div className="flex items-start justify-between gap-4">
        {/* Conteúdo principal */}
        <div className="flex items-start gap-3 flex-1">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
            config.enabled 
              ? "bg-amber-500/20 text-amber-400" 
              : "bg-muted text-muted-foreground"
          )}>
            <Crosshair className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">Disparo Letal</h4>
              <Badge 
                variant="outline" 
                className="h-5 text-[10px] px-1.5 gap-1 border-amber-500/30 text-amber-400"
              >
                <Zap className="w-2.5 h-2.5" />
                1 PE
              </Badge>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">
                      <strong>Requisito:</strong> Ação Mirar<br />
                      <strong>Duração:</strong> Até final do próximo turno<br />
                      <strong>Uso:</strong> Próximo ataque no prazo
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <p className="text-xs text-muted-foreground mb-2">
              Aumenta em <span className="text-amber-400 font-medium">+2</span> a margem de ameaça
            </p>
            
            {/* Preview do efeito */}
            <AnimatePresence>
              {config.enabled && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2"
                >
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 gap-1">
                    <Crosshair className="w-3 h-3" />
                    -{DISPARO_LETAL_MARGIN_BONUS} margem crítico
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Switch */}
        <Switch
          checked={config.enabled}
          onCheckedChange={handleToggle}
          disabled={(!canAfford || !config.mirarDeclared) && !config.enabled}
          className="data-[state=checked]:bg-amber-500"
        />
      </div>
      {mirarControl}
      
      {/* Aviso de PE insuficiente */}
      <AnimatePresence>
        {showInsufficientPE && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-destructive/20 flex items-center gap-2 text-xs text-destructive"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            PE insuficiente para Disparo Letal
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
