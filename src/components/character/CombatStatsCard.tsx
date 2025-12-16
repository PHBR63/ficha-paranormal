/**
 * CombatStatsCard - Card consolidado de stats de combate
 * Mostra HP, PE, SAN em um layout compacto e visual
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Zap, Brain, Edit2, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import { cn } from '@/lib/utils';

interface CombatStatsCardProps {
  hpCurrent: number;
  hpMax: number;
  peCurrent: number;
  peMax: number;
  sanCurrent: number;
  sanMax: number;
  onStatsChange?: (stats: { hp: number; pe: number; san: number }) => void;
  className?: string;
}

export function CombatStatsCard({
  hpCurrent,
  hpMax,
  peCurrent,
  peMax,
  sanCurrent,
  sanMax,
  onStatsChange,
  className,
}: CombatStatsCardProps) {
  const [editMode, setEditMode] = useState(false);
  const [tempHp, setTempHp] = useState(hpCurrent);
  const [tempPe, setTempPe] = useState(peCurrent);
  const [tempSan, setTempSan] = useState(sanCurrent);

  // Percentuais para animações
  const hpPercent = (hpCurrent / hpMax) * 100;
  const pePercent = (peCurrent / peMax) * 100;
  const sanPercent = (sanCurrent / sanMax) * 100;

  // Estados críticos
  const isHpLow = hpPercent <= 25;
  const isSanLow = sanPercent <= 30;

  const handleSave = () => {
    onStatsChange?.({
      hp: Math.max(0, Math.min(hpMax, tempHp)),
      pe: Math.max(0, Math.min(peMax, tempPe)),
      san: Math.max(0, Math.min(sanMax, tempSan)),
    });
    setEditMode(false);
  };

  const handleCancel = () => {
    setTempHp(hpCurrent);
    setTempPe(peCurrent);
    setTempSan(sanCurrent);
    setEditMode(false);
  };

  const startEdit = () => {
    setTempHp(hpCurrent);
    setTempPe(peCurrent);
    setTempSan(sanCurrent);
    setEditMode(true);
  };

  return (
    <div className={cn("ordo-panel p-4 space-y-4", className)}>
      {/* Header com botão de edição */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          RECURSOS
        </span>
        {editMode ? (
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleSave}
            >
              <Check className="w-3 h-3 text-primary" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleCancel}
            >
              <X className="w-3 h-3 text-destructive" />
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={startEdit}
          >
            <Edit2 className="w-3 h-3 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* HP - Pontos de Vida */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              isHpLow && "animate-pulse"
            )}>
              <Heart className={cn(
                "w-5 h-5",
                isHpLow ? "text-destructive" : "text-hp"
              )} />
            </div>
            <span className="text-sm font-medium">HP</span>
          </div>
          {editMode ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={tempHp}
                onChange={(e) => setTempHp(parseInt(e.target.value) || 0)}
                className="w-16 h-7 text-center text-sm"
                min={0}
                max={hpMax}
              />
              <span className="text-muted-foreground">/</span>
              <span className="font-display text-lg">{hpMax}</span>
            </div>
          ) : (
            <motion.span 
              key={hpCurrent}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={cn(
                "font-display text-xl",
                isHpLow ? "text-destructive" : "text-hp"
              )}
            >
              {hpCurrent}/{hpMax}
            </motion.span>
          )}
        </div>
        <AnimatedProgress 
          value={editMode ? tempHp : hpCurrent} 
          max={hpMax} 
          variant="hp" 
          size="md" 
          glow={isHpLow} 
        />
      </div>

      {/* PE - Pontos de Esforço */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-pe" />
            <span className="text-sm font-medium">PE</span>
          </div>
          {editMode ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={tempPe}
                onChange={(e) => setTempPe(parseInt(e.target.value) || 0)}
                className="w-16 h-7 text-center text-sm"
                min={0}
                max={peMax}
              />
              <span className="text-muted-foreground">/</span>
              <span className="font-display text-lg">{peMax}</span>
            </div>
          ) : (
            <motion.span 
              key={peCurrent}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="font-display text-xl text-pe"
            >
              {peCurrent}/{peMax}
            </motion.span>
          )}
        </div>
        <AnimatedProgress 
          value={editMode ? tempPe : peCurrent} 
          max={peMax} 
          variant="pe" 
          size="md" 
        />
      </div>

      {/* SAN - Sanidade */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              isSanLow && "animate-pulse"
            )}>
              <Brain className={cn(
                "w-5 h-5",
                isSanLow ? "text-paranormal" : "text-san"
              )} />
            </div>
            <span className="text-sm font-medium">SAN</span>
          </div>
          {editMode ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={tempSan}
                onChange={(e) => setTempSan(parseInt(e.target.value) || 0)}
                className="w-16 h-7 text-center text-sm"
                min={0}
                max={sanMax}
              />
              <span className="text-muted-foreground">/</span>
              <span className="font-display text-lg">{sanMax}</span>
            </div>
          ) : (
            <motion.span 
              key={sanCurrent}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={cn(
                "font-display text-xl",
                isSanLow ? "text-paranormal" : "text-san"
              )}
            >
              {sanCurrent}/{sanMax}
            </motion.span>
          )}
        </div>
        <AnimatedProgress 
          value={editMode ? tempSan : sanCurrent} 
          max={sanMax} 
          variant="san" 
          size="md" 
          glow={isSanLow} 
        />
      </div>

      {/* Indicador de estado crítico */}
      {(isHpLow || isSanLow) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "text-xs text-center py-1 px-2 rounded",
            isHpLow && isSanLow 
              ? "bg-destructive/20 text-destructive" 
              : isHpLow 
                ? "bg-destructive/20 text-destructive"
                : "bg-paranormal/20 text-paranormal"
          )}
        >
          {isHpLow && isSanLow 
            ? "⚠ Estado crítico!" 
            : isHpLow 
              ? "⚠ HP baixo!" 
              : "⚠ Sanidade baixa!"}
        </motion.div>
      )}
    </div>
  );
}