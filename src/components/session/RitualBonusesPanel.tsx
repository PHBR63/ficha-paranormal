/**
 * RitualBonusesPanel - Painel de bônus de rituais ativos para sessão de combate
 * Mostra modificadores de ataque, dano, defesa e dados extras de rituais sustentados
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Sword, Target, Shield, Dices, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { RitualCombatSummary } from '@/hooks/useRitualCombatBonuses';

interface RitualBonusesPanelProps {
  summary: RitualCombatSummary;
  className?: string;
}

export function RitualBonusesPanel({ summary, className }: RitualBonusesPanelProps) {
  if (!summary.hasActiveRituals) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "p-3 rounded-lg bg-purple-500/10 border border-purple-500/30",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <motion.div
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
        </motion.div>
        <span className="text-sm font-medium text-purple-300">Rituais Ativos</span>
        <Badge variant="outline" className="ml-auto text-purple-300 border-purple-500/40">
          {summary.bonuses.length}
        </Badge>
      </div>

      {/* Bônus consolidados */}
      <div className="flex flex-wrap gap-2 mb-3">
        {/* Ataque */}
        {summary.totalAttackBonus > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/20 border border-red-500/40"
                >
                  <Target className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-medium text-red-300">
                    +{summary.totalAttackBonus} ATQ
                  </span>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">Bônus de Ataque</p>
                  {summary.bonuses
                    .filter(b => b.attackModifier)
                    .map((b, i) => (
                      <p key={i} className="text-xs flex justify-between gap-3">
                        <span className="text-muted-foreground">{b.source}</span>
                        <span className="text-red-300">+{b.attackModifier}</span>
                      </p>
                    ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Dano */}
        {summary.totalDamageBonus > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.05 }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-500/20 border border-orange-500/40"
                >
                  <Sword className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs font-medium text-orange-300">
                    +{summary.totalDamageBonus} DANO
                  </span>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">Bônus de Dano</p>
                  {summary.bonuses
                    .filter(b => b.damageModifier)
                    .map((b, i) => (
                      <p key={i} className="text-xs flex justify-between gap-3">
                        <span className="text-muted-foreground">{b.source}</span>
                        <span className="text-orange-300">+{b.damageModifier}</span>
                      </p>
                    ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Defesa */}
        {summary.totalDefenseBonus > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/20 border border-blue-500/40"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-medium text-blue-300">
                    +{summary.totalDefenseBonus} DEF
                  </span>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">Bônus de Defesa</p>
                  {summary.bonuses
                    .filter(b => b.defenseModifier)
                    .map((b, i) => (
                      <p key={i} className="text-xs flex justify-between gap-3">
                        <span className="text-muted-foreground">{b.source}</span>
                        <span className="text-blue-300">+{b.defenseModifier}</span>
                      </p>
                    ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* PV Temporários */}
        {summary.totalTempHP > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/20 border border-green-500/40"
                >
                  <Heart className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs font-medium text-green-300">
                    +{summary.totalTempHP} PV temp
                  </span>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">PV Temporários</p>
                  {summary.bonuses
                    .filter(b => b.tempHP)
                    .map((b, i) => (
                      <p key={i} className="text-xs flex justify-between gap-3">
                        <span className="text-muted-foreground">{b.source}</span>
                        <span className="text-green-300">+{b.tempHP}</span>
                      </p>
                    ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Dados extras de arma */}
      {summary.weaponEffects.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Dices className="w-3 h-3" />
            <span>Dados extras em ataques:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {summary.weaponEffects.map((effect, i) => (
              <TooltipProvider key={i}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40"
                    >
                      <span className="text-xs font-mono font-medium text-amber-300">
                        +{effect.extraDice?.count || 1}d{effect.extraDice?.type || 6}
                      </span>
                      {effect.damageType && (
                        <span className="text-[10px] text-amber-400/70">
                          {effect.damageType}
                        </span>
                      )}
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{effect.source}</p>
                    {effect.special && (
                      <p className="text-xs text-muted-foreground">{effect.special}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      )}

      {/* Redução de dano */}
      {summary.damageReductions.length > 0 && (
        <div className="mt-2 pt-2 border-t border-purple-500/20">
          <div className="text-xs space-y-1">
            {summary.damageReductions.map((rd, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-muted-foreground">{rd.source}</span>
                <span className="text-cyan-300 font-medium">
                  RD {rd.amount} ({rd.types.join(', ')})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de rituais */}
      <div className="mt-3 pt-2 border-t border-purple-500/20">
        <div className="text-[10px] text-muted-foreground space-y-0.5">
          {summary.bonuses.map((bonus, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-purple-400" />
              <span>{bonus.source}</span>
              <span className="text-purple-400/60">({bonus.level})</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
