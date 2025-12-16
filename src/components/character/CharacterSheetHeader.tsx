/**
 * CharacterSheetHeader - Cabeçalho compacto da ficha com avatar e stats principais
 * Layout estilo ficha de papel com barras de HP, PE, XP lado a lado
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Heart, Zap, Star, Edit2, Check, X, Award, Crown, Gem } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Configuração visual das patentes (valores corrigidos conforme livro)
const PATENT_CONFIG: Record<string, { 
  icon: React.ElementType; 
  gradient: string; 
  textColor: string;
  creditLimit: string;
  requiredPP: number;
  itemLimits: { I: number; II: number; III: number; IV: number };
}> = {
  'Recruta': { 
    icon: Shield, 
    gradient: 'from-slate-500 to-slate-600', 
    textColor: 'text-slate-50',
    creditLimit: 'Baixo',
    requiredPP: 0,
    itemLimits: { I: 2, II: 0, III: 0, IV: 0 },
  },
  'Operador': { 
    icon: Star, 
    gradient: 'from-blue-500 to-blue-600', 
    textColor: 'text-blue-50',
    creditLimit: 'Médio',
    requiredPP: 20,
    itemLimits: { I: 3, II: 1, III: 0, IV: 0 },
  },
  'Agente Especial': { 
    icon: Award, 
    gradient: 'from-purple-500 to-purple-600', 
    textColor: 'text-purple-50',
    creditLimit: 'Alto',
    requiredPP: 50,
    itemLimits: { I: 3, II: 2, III: 1, IV: 0 },
  },
  'Oficial de Operações': { 
    icon: Crown, 
    gradient: 'from-amber-500 to-amber-600', 
    textColor: 'text-amber-950',
    creditLimit: 'Ilimitado',
    requiredPP: 100,
    itemLimits: { I: 3, II: 3, III: 2, IV: 1 },
  },
  'Agente de Elite': { 
    icon: Gem, 
    gradient: 'from-red-500 to-red-600', 
    textColor: 'text-red-50',
    creditLimit: 'Ilimitado',
    requiredPP: 200,
    itemLimits: { I: 3, II: 3, III: 3, IV: 2 },
  },
};

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
  // Bônus de poderes paranormais
  hpBonus?: number;
  peBonus?: number;
  defenseBonus?: number;
  // Dados de proteção de armaduras
  armorRD?: number;
  armorPenalty?: number;
  equippedArmors?: Array<{ name: string; rd: number }>;
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
  hpBonus = 0,
  peBonus = 0,
  defenseBonus = 0,
  armorRD = 0,
  armorPenalty = 0,
  equippedArmors = [],
  onStatsChange,
  onLevelUp,
  className,
}: CharacterSheetHeaderProps) {
  // Stats totais com bônus
  const totalHpMax = hpMax + hpBonus;
  const totalPeMax = peMax + peBonus;
  const totalDefense = defense + defenseBonus;

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

  // Configuração da patente atual
  const patentConfig = PATENT_CONFIG[patent] || PATENT_CONFIG['Recruta'];
  const PatentIcon = patentConfig.icon;

  // Calcular percentuais (usando valores totais com bônus)
  const hpPercent = (hpCurrent / totalHpMax) * 100;
  const isHpLow = hpPercent <= 25;

  const handleSave = () => {
    onStatsChange?.({
      hp: Math.max(0, Math.min(totalHpMax, tempHp)),
      pe: Math.max(0, Math.min(totalPeMax, tempPe)),
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

          {/* NEX e Patente - Separados visualmente */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* NEX */}
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

            {/* Patente - Badge visual com tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    key={patent}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r cursor-help",
                      patentConfig.gradient
                    )}
                  >
                    <PatentIcon className={cn("w-4 h-4", patentConfig.textColor)} />
                    <span className={cn("font-display text-sm tracking-wider", patentConfig.textColor)}>
                      {patent}
                    </span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-medium">{patent}</p>
                    <div className="text-xs space-y-1">
                      <p><strong>Limite de Crédito:</strong> {patentConfig.creditLimit}</p>
                      <p>
                        <strong>Itens:</strong> Cat I: {patentConfig.itemLimits.I}, 
                        Cat II: {patentConfig.itemLimits.II}, 
                        Cat III: {patentConfig.itemLimits.III}, 
                        Cat IV: {patentConfig.itemLimits.IV}
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Botão de subir NEX */}
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
              <Heart className={cn("w-4 h-4", isHpLow ? "text-destructive" : "text-hp")} />
              <span className="text-xs font-medium">HP</span>
              {hpBonus > 0 && (
                <span className="text-[10px] text-success font-medium">(+{hpBonus})</span>
              )}
            </div>
            {editMode ? (
              <Input
                type="number"
                value={tempHp}
                onChange={(e) => setTempHp(parseInt(e.target.value) || 0)}
                className="w-14 h-6 text-center text-xs"
                min={0}
                max={totalHpMax}
              />
            ) : (
              <span className={cn("text-sm font-display", isHpLow ? "text-destructive" : "text-hp")}>
                {hpCurrent}/{totalHpMax}
              </span>
            )}
          </div>
          <AnimatedProgress value={editMode ? tempHp : hpCurrent} max={totalHpMax} variant="hp" size="sm" />
        </div>

        {/* PE */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-pe" />
              <span className="text-xs font-medium">PE</span>
              {peBonus > 0 && (
                <span className="text-[10px] text-pe font-medium">(+{peBonus})</span>
              )}
            </div>
            {editMode ? (
              <Input
                type="number"
                value={tempPe}
                onChange={(e) => setTempPe(parseInt(e.target.value) || 0)}
                className="w-14 h-6 text-center text-xs"
                min={0}
                max={totalPeMax}
              />
            ) : (
              <span className="text-sm font-display text-pe">
                {peCurrent}/{totalPeMax}
              </span>
            )}
          </div>
          <AnimatedProgress value={editMode ? tempPe : peCurrent} max={totalPeMax} variant="pe" size="sm" />
        </div>

        {/* SAN */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-san" />
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
              <span className="text-sm font-display text-san">
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
            <span className="font-display text-lg text-primary">{totalDefense}</span>
            {defenseBonus > 0 && (
              <span className="text-[10px] text-success font-medium">(+{defenseBonus})</span>
            )}
          </div>
          {/* RD de Armadura */}
          {armorRD > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <Shield className="w-4 h-4 text-secondary" />
                    <span className="text-muted-foreground">RD</span>
                    <span className="font-display text-lg text-secondary">{armorRD}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="space-y-1">
                    <p className="font-medium">Redução de Dano</p>
                    {equippedArmors.map((armor, i) => (
                      <p key={i} className="text-xs">{armor.name}: RD {armor.rd}</p>
                    ))}
                    {armorPenalty < 0 && (
                      <p className="text-xs text-yellow-400">Penalidade: {armorPenalty} Agilidade</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">DESL</span>
            <span className="font-display text-lg">{movement}m</span>
          </div>
        </div>
      </div>
    </div>
  );
}
