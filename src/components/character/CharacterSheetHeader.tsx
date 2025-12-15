/**
 * CharacterSheetHeader - Cabeçalho compacto da ficha com avatar e stats principais
 * Layout estilo ficha de papel com barras de HP, PE, XP lado a lado
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Heart, Zap, Star, Edit2, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import { cn } from '@/lib/utils';

interface CharacterSheetHeaderProps {
  name: string;
  photoUrl?: string | null;
  characterClass: string;
  origin: string;
  nex: number;
  patent: string;
  hpCurrent: number;
  hpMax: number;
  peCurrent: number;
  peMax: number;
  sanCurrent: number;
  sanMax: number;
  defense: number;
  movement: number;
  onStatsChange?: (stats: { hp: number; pe: number; san: number }) => void;
  onLevelUp?: () => void;
  className?: string;
}

// Estados de condição crítica
interface ConditionStates {
  lesaoGrave: boolean;
  inconsciente: boolean;
  morrendo: boolean;
}

export function CharacterSheetHeader({
  name,
  photoUrl,
  characterClass,
  origin,
  nex,
  patent,
  hpCurrent,
  hpMax,
  peCurrent,
  peMax,
  sanCurrent,
  sanMax,
  defense,
  movement,
  onStatsChange,
  onLevelUp,
  className,
}: CharacterSheetHeaderProps) {
  // Estado de edição
  const [editMode, setEditMode] = useState(false);
  const [tempHp, setTempHp] = useState(hpCurrent);
  const [tempPe, setTempPe] = useState(peCurrent);
  const [tempSan, setTempSan] = useState(sanCurrent);
  
  // Estados de condição (visual apenas por enquanto)
  const [conditions, setConditions] = useState<ConditionStates>({
    lesaoGrave: false,
    inconsciente: false,
    morrendo: false,
  });

  // Calcular percentuais
  const hpPercent = (hpCurrent / hpMax) * 100;
  const isHpLow = hpPercent <= 25;

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
    <div className={cn("sheet-panel p-4 space-y-4", className)}>
      {/* Linha principal: Avatar + Info + Stats */}
      <div className="flex gap-4">
        {/* Avatar grande */}
        <motion.div 
          className="w-28 h-28 rounded-lg sheet-panel-inner flex-shrink-0 overflow-hidden"
          whileHover={{ scale: 1.02 }}
        >
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary/20">
              <Shield className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
        </motion.div>

        {/* Informações do personagem */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Nome do personagem */}
          <div>
            <h2 className="font-display text-2xl tracking-wider truncate text-primary">
              {name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {characterClass} • {origin}
            </p>
          </div>

          {/* NEX e Patente */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase">NEX</span>
              <motion.span 
                key={nex}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="font-display text-2xl text-secondary"
              >
                {nex}%
              </motion.span>
            </div>
            <span className="patent-badge text-xs">{patent}</span>
            {nex < 99 && onLevelUp && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLevelUp}
                className="text-xs h-6 border-primary/50 text-primary hover:bg-primary/10"
              >
                ↑ SUBIR
              </Button>
            )}
          </div>
        </div>

        {/* Botão de edição */}
        <div className="flex flex-col items-end">
          {editMode ? (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}>
                <Check className="w-4 h-4 text-primary" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancel}>
                <X className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={startEdit}>
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Barras de recursos: HP, PE, SAN */}
      <div className="grid grid-cols-3 gap-4">
        {/* HP */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Heart className={cn("w-4 h-4", isHpLow ? "text-destructive" : "text-destructive/70")} />
              <span className="text-xs font-medium">HP</span>
            </div>
            {editMode ? (
              <Input
                type="number"
                value={tempHp}
                onChange={(e) => setTempHp(parseInt(e.target.value) || 0)}
                className="w-14 h-6 text-center text-xs"
                min={0}
                max={hpMax}
              />
            ) : (
              <span className={cn("text-sm font-display", isHpLow && "text-destructive")}>
                {hpCurrent}/{hpMax}
              </span>
            )}
          </div>
          <AnimatedProgress value={editMode ? tempHp : hpCurrent} max={hpMax} variant="hp" size="sm" />
        </div>

        {/* PE */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-success" />
              <span className="text-xs font-medium">PE</span>
            </div>
            {editMode ? (
              <Input
                type="number"
                value={tempPe}
                onChange={(e) => setTempPe(parseInt(e.target.value) || 0)}
                className="w-14 h-6 text-center text-xs"
                min={0}
                max={peMax}
              />
            ) : (
              <span className="text-sm font-display text-success">
                {peCurrent}/{peMax}
              </span>
            )}
          </div>
          <AnimatedProgress value={editMode ? tempPe : peCurrent} max={peMax} variant="pe" size="sm" />
        </div>

        {/* SAN */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-paranormal" />
              <span className="text-xs font-medium">SAN</span>
            </div>
            {editMode ? (
              <Input
                type="number"
                value={tempSan}
                onChange={(e) => setTempSan(parseInt(e.target.value) || 0)}
                className="w-14 h-6 text-center text-xs"
                min={0}
                max={sanMax}
              />
            ) : (
              <span className="text-sm font-display text-paranormal">
                {sanCurrent}/{sanMax}
              </span>
            )}
          </div>
          <AnimatedProgress value={editMode ? tempSan : sanCurrent} max={sanMax} variant="san" size="sm" />
        </div>
      </div>

      {/* Estados de condição + Stats secundários */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        {/* Checkboxes de estado */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <Checkbox 
              checked={conditions.lesaoGrave}
              onCheckedChange={(checked) => setConditions(prev => ({ ...prev, lesaoGrave: !!checked }))}
              className="w-4 h-4"
            />
            Lesão grave
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <Checkbox 
              checked={conditions.inconsciente}
              onCheckedChange={(checked) => setConditions(prev => ({ ...prev, inconsciente: !!checked }))}
              className="w-4 h-4"
            />
            Inconsciente
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <Checkbox 
              checked={conditions.morrendo}
              onCheckedChange={(checked) => setConditions(prev => ({ ...prev, morrendo: !!checked }))}
              className="w-4 h-4"
            />
            Morrendo
          </label>
        </div>

        {/* Stats secundários */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">DEF</span>
            <span className="font-display text-lg text-primary">{defense}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">DESL</span>
            <span className="font-display text-lg">{movement}m</span>
          </div>
        </div>
      </div>
    </div>
  );
}
