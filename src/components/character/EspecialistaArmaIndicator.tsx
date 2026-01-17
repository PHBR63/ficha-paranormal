/**
 * EspecialistaArmaIndicator - Indicador visual para Especialista em Arma
 * Mostra quais grupos de armas estão selecionados e se o bônus está ativo
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sword, Target, Zap, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWeaponGroupName, getWeaponGroupForWeapon, WEAPON_GROUPS } from '@/lib/constants/weapon-groups';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EspecialistaArmaIndicatorProps {
  /** Grupos de armas escolhidos pelo jogador */
  chosenGroups: string[];
  /** ID da arma equipada (para detecção automática) */
  equippedWeaponId?: string;
  /** Nome da arma equipada (para detecção automática) */
  equippedWeaponName?: string;
  /** Se exibir em modo compacto (inline) */
  compact?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Ícone do grupo de arma baseado no ID
 */
function getGroupIcon(groupId: string) {
  const group = WEAPON_GROUPS.find(g => g.id === groupId);
  if (group?.icon) {
    const IconComponent = group.icon;
    return <IconComponent className="w-3 h-3" />;
  }
  return <Sword className="w-3 h-3" />;
}

export const EspecialistaArmaIndicator = memo(function EspecialistaArmaIndicator({
  chosenGroups,
  equippedWeaponId,
  equippedWeaponName,
  compact = false,
  className,
}: EspecialistaArmaIndicatorProps) {
  if (!chosenGroups || chosenGroups.length === 0) {
    return null;
  }

  // Detecta grupo da arma equipada
  const equippedWeaponGroup = getWeaponGroupForWeapon(equippedWeaponId || '') 
    || getWeaponGroupForWeapon(equippedWeaponName || '');

  // Conta quantos grupos estão ativos
  const activeGroupsCount = chosenGroups.filter(g => g === equippedWeaponGroup).length;
  const hasActiveBonus = activeGroupsCount > 0;

  if (compact) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                hasActiveBonus 
                  ? "bg-success/20 text-success border border-success/30" 
                  : "bg-muted text-muted-foreground border border-border",
                className
              )}
            >
              {hasActiveBonus ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>+2 ATQ/DANO</span>
                </>
              ) : (
                <>
                  <Sword className="w-3 h-3" />
                  <span>{chosenGroups.length} grupo{chosenGroups.length > 1 ? 's' : ''}</span>
                </>
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium text-xs">Especialista em Arma</p>
              <div className="space-y-1">
                {chosenGroups.map(groupId => {
                  const isActive = groupId === equippedWeaponGroup;
                  const groupName = getWeaponGroupName(groupId);
                  return (
                    <div 
                      key={groupId}
                      className={cn(
                        "flex items-center gap-1.5 text-xs",
                        isActive ? "text-success" : "text-muted-foreground"
                      )}
                    >
                      {isActive ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        getGroupIcon(groupId)
                      )}
                      <span>{groupName}</span>
                      {isActive && (
                        <span className="text-[9px] px-1 py-0.5 bg-success/20 rounded">
                          ATIVO
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {hasActiveBonus && equippedWeaponName && (
                <p className="text-[10px] text-success/80 border-t border-border pt-1">
                  Arma equipada: {equippedWeaponName}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Versão expandida (para exibição detalhada)
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 rounded-lg border",
        hasActiveBonus 
          ? "bg-success/5 border-success/20" 
          : "bg-muted/30 border-border",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-6 h-6 rounded flex items-center justify-center",
            hasActiveBonus ? "bg-success/20" : "bg-muted"
          )}>
            <Target className={cn(
              "w-3.5 h-3.5",
              hasActiveBonus ? "text-success" : "text-muted-foreground"
            )} />
          </div>
          <span className="text-xs font-medium">Especialista em Arma</span>
        </div>
        
        <AnimatePresence mode="wait">
          {hasActiveBonus ? (
            <motion.div
              key="active"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex items-center gap-1 px-2 py-0.5 bg-success/20 text-success rounded-full text-[10px] font-semibold"
            >
              <Zap className="w-3 h-3" />
              <span>+2 ATQ / +2 DANO</span>
            </motion.div>
          ) : (
            <motion.span
              key="inactive"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] text-muted-foreground"
            >
              Equipe uma arma do grupo
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Lista de grupos */}
      <div className="flex flex-wrap gap-1.5">
        {chosenGroups.map(groupId => {
          const isActive = groupId === equippedWeaponGroup;
          const groupName = getWeaponGroupName(groupId);
          
          return (
            <motion.div
              key={groupId}
              layout
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-xs",
                isActive 
                  ? "bg-success/20 text-success border border-success/30" 
                  : "bg-muted/50 text-muted-foreground border border-border"
              )}
            >
              {isActive ? (
                <Check className="w-3 h-3" />
              ) : (
                getGroupIcon(groupId)
              )}
              <span>{groupName}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Info da arma equipada quando ativa */}
      <AnimatePresence>
        {hasActiveBonus && equippedWeaponName && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 pt-2 border-t border-success/20"
          >
            <div className="flex items-center gap-1.5 text-[10px] text-success/80">
              <Shield className="w-3 h-3" />
              <span>Arma equipada: <strong>{equippedWeaponName}</strong></span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default EspecialistaArmaIndicator;
