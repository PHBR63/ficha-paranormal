/**
 * CharacterSheetHeader - Cabeçalho compacto da ficha com avatar e stats principais
 * Layout estilo ficha de papel com barras de HP, PE, XP lado a lado
 * OTIMIZAÇÃO: Componente memoizado para evitar re-renders desnecessários
 */

import { useRef, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Heart, Zap, Star, Edit2, Check, X, Award, Crown, Gem, Sparkles, Droplet, Skull, BookOpen, Sword, Dices, Weight, AlertTriangle } from 'lucide-react';
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
import { ActiveBonusesPanel, BonusPanelFilter } from './ActiveBonusesPanel';
import { ActiveBonusSummaryWidget, BonusCategoryId } from './ActiveBonusSummaryWidget';
import { ParanormalElement, ELEMENT_LABELS, ELEMENT_COLORS, ELEMENT_BG_COLORS } from '@/lib/paranormal-powers';
import { BonusSummary } from '@/hooks/useCharacterBonusSummary';

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

// Interface para breakdown de bônus de defesa
interface DefenseBonusBreakdown {
  source: string;
  type: 'origin' | 'ability' | 'general_power' | 'paranormal' | 'ritual' | 'skill_training' | 'track_effect';
  bonus: number;
  conditional?: string;
  active: boolean;
  duration?: string;
}

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
  // Breakdown de movimento (para tooltip)
  movementBreakdown?: Array<{ source: string; value: number }>;
  hpBonus?: number;
  peBonus?: number;
  defenseBonus?: number;
  defenseBonusBreakdown?: DefenseBonusBreakdown[];
  // Bônus de rituais de combate
  ritualAttackBonus?: number;
  ritualDamageBonus?: number;
  ritualWeaponEffects?: Array<{
    source: string;
    damageType?: string;
    extraDice?: { count: number; type: number };
  }>;
  // Dados de proteção de armaduras
  armorRD?: number;
  armorPenalty?: number;
  armorSpeedPenalty?: number; // Penalidade de deslocamento da armadura
  equippedArmors?: Array<{ name: string; rd: number }>;
  /** Status de carga do inventário */
  loadStatus?: {
    currentLoad: number;
    maxCapacity: number;
    isOverloaded: boolean;
    hasInventarioOtimizado?: boolean;
  };
  // Indicador de bônus ativos
  activeBonusCount?: number;
  activeBonusSources?: string[];
  bonusSummary?: BonusSummary; // Dados completos para o painel expandido
  elementalAffinity?: string | null; // Afinidade elemental escolhida
  onStatsChange?: (stats: { hp: number; pe: number; san: number }) => void | boolean | Promise<void | boolean>;
  onLevelUp?: () => void;
  onToggleConditionalBonus?: (bonusId: string, active: boolean) => void; // Toggle de bônus condicionais
  className?: string;
}

// Estados de condição crítica
interface ConditionStates {
  lesaoGrave: boolean;
  inconsciente: boolean;
  morrendo: boolean;
}

export const CharacterSheetHeader = memo(function CharacterSheetHeader({
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
  defenseBonusBreakdown = [],
  ritualAttackBonus = 0,
  ritualDamageBonus = 0,
  ritualWeaponEffects = [],
  armorRD = 0,
  armorPenalty = 0,
  armorSpeedPenalty = 0,
  equippedArmors = [],
  loadStatus,
  activeBonusCount = 0,
  activeBonusSources = [],
  bonusSummary,
  elementalAffinity,
  onStatsChange,
  onLevelUp,
  onToggleConditionalBonus,
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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveLock = useRef(false);
  
  // Estado do painel de bônus expandido e filtro de categoria
  const [bonusPanelOpen, setBonusPanelOpen] = useState(false);
  const [bonusPanelFilter, setBonusPanelFilter] = useState<BonusPanelFilter>('all');
  
  // Estados de condição (visual apenas por enquanto)
  const [conditions, setConditions] = useState<ConditionStates>({
    lesaoGrave: false,
    inconsciente: false,
    morrendo: false,
  });

  // Configuração da patente atual
  const patentConfig = PATENT_CONFIG[patent] || PATENT_CONFIG['Recruta'];
  const PatentIcon = patentConfig.icon;

  // Calcular percentuais (usando valores totais com bônus, clampados entre 0 e 100)
  const hpPercent = Math.min(100, Math.max(0, (hpCurrent / totalHpMax) * 100));
  const pePercent = Math.min(100, Math.max(0, (peCurrent / totalPeMax) * 100));
  const sanPercent = Math.min(100, Math.max(0, (sanCurrent / sanMax) * 100));
  
  // Valores de exibição (clampados para não mostrar negativos)
  const displayHp = Math.max(0, hpCurrent);
  const displayPe = Math.max(0, peCurrent);
  const displaySan = Math.max(0, sanCurrent);
  
  const isHpLow = hpPercent <= 25;
  const isPeLow = pePercent <= 25;
  const isSanLow = sanPercent <= 30;
  
  // Estados de colapso (HP ou SAN = 0)
  const isUnconscious = displayHp === 0;
  const isMentalCollapse = displaySan === 0;

  // Preserva a edição até confirmar o servidor; os limites são os já exibidos na ficha.
  const handleSave = async () => {
    if (saveLock.current || !onStatsChange) return;
    if ([[tempHp, totalHpMax], [tempPe, totalPeMax], [tempSan, sanMax]].some(([value, max]) => !Number.isInteger(value) || value < 0 || value > max)) {
      setSaveError('Informe valores inteiros entre zero e o máximo de cada recurso.');
      return;
    }
    saveLock.current = true; setSaving(true); setSaveError(null);
    try {
      const confirmed = await onStatsChange({ hp: tempHp, pe: tempPe, san: tempSan });
      if (confirmed === false) throw new Error('Gravação não confirmada.');
      setEditMode(false);
    } catch { setSaveError('Não foi possível confirmar os recursos. Confira a conexão e tente novamente.'); }
    finally { saveLock.current = false; setSaving(false); }
  };

  const handleCancel = () => {
    setTempHp(hpCurrent);
    setTempPe(peCurrent);
    setTempSan(sanCurrent);
    setEditMode(false);
  };

  const startEdit = () => {
    setSaveError(null);
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
              <Shield className="w-12 h-12 text-foreground/40" />
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
            <p className="text-sm text-foreground/70">
              {characterClass} • {origin}
            </p>
          </div>

          {/* NEX e Patente - Separados visualmente */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* NEX */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground/60 uppercase">NEX</span>
              <motion.span 
                key={nex}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="font-display text-2xl font-bold text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
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

            {/* Widget de Resumo de Bônus Ativos - Com tooltips detalhados por categoria */}
            {bonusSummary && (
              <ActiveBonusSummaryWidget 
                bonusSummary={bonusSummary}
                onCategoryClick={(categoryId: BonusCategoryId) => {
                  setBonusPanelFilter(categoryId as BonusPanelFilter);
                  setBonusPanelOpen(true);
                }}
                className="cursor-pointer"
              />
            )}
            
            {/* Botão para abrir painel completo (quando há bônus) */}
            <AnimatePresence>
              {activeBonusCount > 0 && (
                <motion.button
                  type="button"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => {
                    setBonusPanelFilter('all');
                    setBonusPanelOpen(true);
                  }}
                  className="text-[10px] text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                >
                  ver detalhes
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Botão de edição */}
        <div className="flex flex-col items-end">
          {editMode ? (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave} aria-label="Salvar recursos da ficha" disabled={saving}>
                <Check className="w-4 h-4 text-primary" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancel} aria-label="Cancelar edição de recursos" disabled={saving}>
                <X className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={startEdit} aria-label="Editar recursos da ficha" disabled={!onStatsChange}>
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
      {saving && <p role="status" className="text-sm text-muted-foreground">Salvando recursos...</p>}

      {/* Barras de recursos: HP, PE, SAN */}
      <div className="grid grid-cols-3 gap-4">
        {/* HP */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Heart className={cn("w-4 h-4", isHpLow ? "text-destructive" : "text-hp")} />
              <span className="text-xs font-medium">HP</span>
              {/* Bônus de HP com tooltip detalhado */}
              {hpBonus > 0 && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[10px] text-success font-medium cursor-help">(+{hpBonus})</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <p className="font-semibold text-success mb-1">Bônus de PV: +{hpBonus}</p>
                      <p className="text-xs text-muted-foreground">De poderes paranormais ativos</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {/* Indicador de bônus de trilha para HP */}
              {bonusSummary?.special?.some(s => s.source.toLowerCase().includes('casca grossa')) && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[10px] bg-primary/20 text-primary px-1 rounded font-medium cursor-help">
                        ⚔ Trilha
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px]">
                      <p className="font-semibold text-primary mb-1">Casca Grossa</p>
                      <p className="text-xs text-muted-foreground">+1 PV por 5% de NEX (já incluído no máximo)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {editMode ? (
              <Input
                type="number"
                value={Number.isNaN(tempHp) ? '' : tempHp}
                onChange={(e) => setTempHp(e.target.value === '' ? NaN : Number(e.target.value))}
                aria-label="PV atual"
                disabled={saving}
                className="w-14 h-6 text-center text-xs"
                min={0}
                max={totalHpMax}
              />
            ) : (
              <span className={cn("text-sm font-display", isHpLow ? "text-destructive" : "text-hp")}>
                {displayHp}/{totalHpMax}
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
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[10px] text-pe font-medium cursor-help">(+{peBonus})</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <p className="font-semibold text-pe mb-1">Bônus de PE: +{peBonus}</p>
                      <p className="text-xs text-muted-foreground">De poderes paranormais ativos</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {editMode ? (
              <Input
                type="number"
                value={Number.isNaN(tempPe) ? '' : tempPe}
                onChange={(e) => setTempPe(e.target.value === '' ? NaN : Number(e.target.value))}
                aria-label="PE atual"
                disabled={saving}
                className="w-14 h-6 text-center text-xs"
                min={0}
                max={totalPeMax}
              />
            ) : (
              <span className={cn("text-sm font-display", isPeLow ? "text-warning" : "text-pe")}>
                {displayPe}/{totalPeMax}
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
              {/* Indicador de bônus de trilha para SAN */}
              {bonusSummary?.effectResistances?.breakdown?.some(s => 
                s.source.toLowerCase().includes('mente') || s.source.toLowerCase().includes('inabalavel')
              ) && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[10px] bg-san/20 text-san px-1 rounded font-medium cursor-help">
                        🧠 Mental
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px]">
                      <p className="font-semibold text-san mb-1">Resistências Mentais</p>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {bonusSummary.effectResistances.breakdown
                          .filter(s => s.source.toLowerCase().includes('mente') || s.source.toLowerCase().includes('inabalavel'))
                          .map((bonus, i) => (
                            <p key={i}>• {bonus.source}: {typeof bonus.value === 'number' ? `+${bonus.value}` : bonus.value}</p>
                          ))
                        }
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {editMode ? (
              <Input
                type="number"
                value={Number.isNaN(tempSan) ? '' : tempSan}
                onChange={(e) => setTempSan(e.target.value === '' ? NaN : Number(e.target.value))}
                aria-label="SAN atual"
                disabled={saving}
                className="w-14 h-6 text-center text-xs"
                min={0}
                max={sanMax}
              />
            ) : (
              <span className={cn("text-sm font-display", isSanLow ? "text-paranormal" : "text-san")}>
                {displaySan}/{sanMax}
              </span>
            )}
          </div>
          <AnimatedProgress value={editMode ? tempSan : sanCurrent} max={sanMax} variant="san" size="sm" />
        </div>
      </div>

      {/* Indicadores de Bônus de Trilha Ativos */}
      {bonusSummary && (bonusSummary.combat.initiative.total > 0 || bonusSummary.combat.criticalMargin.total > 0 || bonusSummary.damageReduction.physical.total > 0) && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
          {/* Iniciativa */}
          {bonusSummary.combat.initiative.total > 0 && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/30 cursor-help">
                    <Sword className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-medium text-primary">
                      INI +{bonusSummary.combat.initiative.total}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px]">
                  <p className="font-semibold text-primary mb-1">Bônus de Iniciativa</p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {bonusSummary.combat.initiative.breakdown.map((bonus, i) => (
                      <p key={i}>• {bonus.source}: +{bonus.value}</p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Margem de Ameaça */}
          {bonusSummary.combat.criticalMargin.total > 0 && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/10 border border-destructive/30 cursor-help">
                    <Dices className="w-3 h-3 text-destructive" />
                    <span className="text-[10px] font-medium text-destructive">
                      CRIT +{bonusSummary.combat.criticalMargin.total}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px]">
                  <p className="font-semibold text-destructive mb-1">Margem de Ameaça</p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {bonusSummary.combat.criticalMargin.breakdown.map((bonus, i) => (
                      <p key={i}>• {bonus.source}: +{bonus.value}{bonus.conditional ? ` (${bonus.conditional})` : ''}</p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Redução de Dano */}
          {bonusSummary.damageReduction.physical.total > 0 && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 border border-secondary cursor-help">
                    <Shield className="w-3 h-3 text-foreground" />
                    <span className="text-[10px] font-medium">
                      RD {bonusSummary.damageReduction.physical.total}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px]">
                  <p className="font-semibold mb-1">Redução de Dano</p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {bonusSummary.damageReduction.physical.breakdown.map((bonus, i) => (
                      <p key={i}>• {bonus.source}: {bonus.value}{bonus.conditional ? ` (${bonus.conditional})` : ''}</p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Bônus de Perícias de Trilha */}
          {Object.keys(bonusSummary.skills).length > 0 && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-energy/10 border border-energy/30 cursor-help">
                    <BookOpen className="w-3 h-3 text-energy" />
                    <span className="text-[10px] font-medium text-energy">
                      {Object.keys(bonusSummary.skills).length} Perícias
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px]">
                  <p className="font-semibold text-energy mb-1">Bônus de Perícias</p>
                  <div className="text-xs text-muted-foreground space-y-0.5 max-h-32 overflow-y-auto">
                    {Object.entries(bonusSummary.skills).map(([skill, data]) => (
                      <p key={skill} className="capitalize">• {skill}: +{data.total}</p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      {/* Banners de Estado Crítico (HP ou SAN = 0) */}
      <AnimatePresence mode="wait">
        {/* Colapso Total */}
        {isUnconscious && isMentalCollapse && (
          <motion.div
            key="total-collapse-header"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <motion.div
              animate={{ 
                boxShadow: [
                  '0 0 0 0 rgba(239, 68, 68, 0)',
                  '0 0 15px 3px rgba(239, 68, 68, 0.3)',
                  '0 0 0 0 rgba(239, 68, 68, 0)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-center py-2 px-3 rounded-lg bg-gradient-to-r from-destructive/20 via-paranormal/20 to-destructive/20 border border-destructive/50"
            >
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-destructive font-display text-xs tracking-wider"
              >
                💀 COLAPSO TOTAL - Inconsciente + Enlouquecido
              </motion.span>
            </motion.div>
          </motion.div>
        )}

        {/* Inconsciente */}
        {isUnconscious && !isMentalCollapse && (
          <motion.div
            key="unconscious-header"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <motion.div
              animate={{ 
                boxShadow: [
                  '0 0 0 0 rgba(239, 68, 68, 0)',
                  '0 0 12px 2px rgba(239, 68, 68, 0.25)',
                  '0 0 0 0 rgba(239, 68, 68, 0)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-destructive/15 border border-destructive/40"
            >
              <motion.div animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                <Heart className="w-3.5 h-3.5 text-destructive" />
              </motion.div>
              <span className="text-destructive font-display text-xs tracking-wider">
                INCONSCIENTE - HP zerado
              </span>
            </motion.div>
          </motion.div>
        )}

        {/* Colapso Mental */}
        {isMentalCollapse && !isUnconscious && (
          <motion.div
            key="mental-collapse-header"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <motion.div
              animate={{ 
                boxShadow: [
                  '0 0 0 0 rgba(168, 85, 247, 0)',
                  '0 0 12px 2px rgba(168, 85, 247, 0.25)',
                  '0 0 0 0 rgba(168, 85, 247, 0)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-paranormal/15 border border-paranormal/40"
            >
              <motion.div 
                animate={{ opacity: [1, 0.6, 1], rotate: [-2, 2, -2] }} 
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <Star className="w-3.5 h-3.5 text-paranormal" />
              </motion.div>
              <span className="text-paranormal font-display text-xs tracking-wider">
                COLAPSO MENTAL - SAN zerada
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        {/* Afinidade Elemental */}
        <div className="flex items-center">
          {elementalAffinity && (() => {
            const affinity = elementalAffinity as ParanormalElement;
            const AffinityIcon = {
              sangue: Droplet,
              morte: Skull,
              conhecimento: BookOpen,
              energia: Zap,
            }[affinity] || Sparkles;
            return (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-help",
                        ELEMENT_BG_COLORS[affinity]
                      )}
                    >
                      <AffinityIcon className={cn("w-4 h-4", ELEMENT_COLORS[affinity])} />
                      <span className={cn("font-display text-sm tracking-wider", ELEMENT_COLORS[affinity])}>
                        {ELEMENT_LABELS[affinity]}
                      </span>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="font-medium">Afinidade Elemental</p>
                    <p className="text-xs text-muted-foreground">
                      Poderes de {ELEMENT_LABELS[affinity]} têm efeitos aprimorados
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })()}
        </div>

        {/* Stats secundários */}
        <div className="flex items-center gap-4 text-sm">
          {/* Defesa com tooltip de breakdown e animação em tempo real */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-baseline gap-1 cursor-help whitespace-nowrap">
                  <span className="text-muted-foreground">DEF</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={totalDefense}
                      initial={{ y: -8, opacity: 0, scale: 0.9 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: 8, opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={cn(
                        "font-display text-lg",
                        defenseBonus > 0 ? "text-primary" : ""
                      )}
                    >
                      {totalDefense}
                    </motion.span>
                  </AnimatePresence>
                  <AnimatePresence>
                    {defenseBonus !== 0 && (
                      <motion.span 
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        className={cn('text-[10px] font-medium', defenseBonus > 0 ? 'text-success' : 'text-destructive')}
                      >
                        ({defenseBonus > 0 ? '+' : ''}{defenseBonus})
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-2">
                  <p className="font-medium">Defesa Total: {totalDefense}</p>
                  <div className="text-xs space-y-1">
                    <p className="text-muted-foreground">Base: {defense}</p>
                    {defenseBonusBreakdown.length > 0 && (
                      <div className="pt-1 border-t border-border">
                        <p className="font-medium text-primary mb-1">Bônus:</p>
                        {defenseBonusBreakdown.map((bonus, i) => (
                          <p 
                            key={i} 
                            className={cn(
                              "flex justify-between gap-2",
                              !bonus.active && "text-muted-foreground line-through"
                            )}
                          >
                            <span className="flex items-center gap-1">
                              {bonus.type === 'ritual' && (
                                <Sparkles className="w-3 h-3 text-purple-400" />
                              )}
                              {bonus.source}
                              {bonus.conditional && (
                                <span className="text-[10px] text-muted-foreground ml-1">
                                  ({bonus.conditional})
                                </span>
                              )}
                            </span>
                            <span className={bonus.active ? "text-success" : ""}>
                              +{bonus.bonus}
                            </span>
                          </p>
                        ))}
                      </div>
                    )}
                    {defenseBonus === 0 && defenseBonusBreakdown.length === 0 && (
                      <p className="text-muted-foreground italic">Sem bônus ativos</p>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Indicador de Rituais Ativos com bônus de defesa */}
          {(() => {
            const activeRitualBonuses = defenseBonusBreakdown.filter(b => b.type === 'ritual' && b.active);
            if (activeRitualBonuses.length === 0) return null;
            
            const totalRitualBonus = activeRitualBonuses.reduce((sum, b) => sum + b.bonus, 0);
            
            return (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 cursor-help"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
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
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      </motion.div>
                      <span className="text-xs font-medium text-purple-300">+{totalRitualBonus}</span>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-2">
                      <p className="font-medium flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        Rituais Ativos
                      </p>
                      <div className="text-xs space-y-1">
                        {activeRitualBonuses.map((bonus, i) => (
                          <p key={i} className="flex justify-between gap-3">
                            <span className="text-muted-foreground">{bonus.source}</span>
                            <span className="text-purple-300 font-medium">+{bonus.bonus} DEF</span>
                          </p>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground italic pt-1 border-t border-border">
                        Sustentando rituais de proteção
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })()}
          
          {/* Indicador de Bônus de Ataque por Rituais */}
          {ritualAttackBonus > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 cursor-help"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.15, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Sword className="w-3.5 h-3.5 text-red-400" />
                    </motion.div>
                    <span className="text-xs font-medium text-red-300">+{ritualAttackBonus} ATQ</span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Bônus de Ataque por Rituais
                    </p>
                    <p className="text-xs text-muted-foreground">
                      +{ritualAttackBonus} em testes de ataque
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Indicador de Bônus de Dano por Rituais */}
          {ritualDamageBonus > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 cursor-help"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.05 }}
                  >
                    <motion.div
                      animate={{ 
                        rotate: [0, -10, 10, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Skull className="w-3.5 h-3.5 text-orange-400" />
                    </motion.div>
                    <span className="text-xs font-medium text-orange-300">+{ritualDamageBonus} DANO</span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Bônus de Dano por Rituais
                    </p>
                    <p className="text-xs text-muted-foreground">
                      +{ritualDamageBonus} em rolagens de dano
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Indicador de Dados Extras por Rituais */}
          {ritualWeaponEffects.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 cursor-help"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.1 }}
                  >
                    <motion.div
                      animate={{ 
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Dices className="w-3.5 h-3.5 text-amber-400" />
                    </motion.div>
                    <span className="text-xs font-medium text-amber-300">
                      +{ritualWeaponEffects.map(e => `${e.extraDice?.count || 1}d${e.extraDice?.type || 6}`).join(', ')}
                    </span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-medium flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Dados Extras em Ataques
                    </p>
                    <div className="text-xs space-y-1">
                      {ritualWeaponEffects.map((effect, i) => (
                        <p key={i} className="flex justify-between gap-3">
                          <span className="text-muted-foreground">{effect.source}</span>
                          <span className="text-amber-300 font-mono">
                            +{effect.extraDice?.count || 1}d{effect.extraDice?.type || 6}
                            {effect.damageType && ` ${effect.damageType}`}
                          </span>
                        </p>
                      ))}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
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
          {/* Deslocamento com tooltip de breakdown e indicador de sobrecarga */}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-baseline gap-1 whitespace-nowrap cursor-help",
                  loadStatus?.isOverloaded && "text-destructive"
                )}>
                  <span className={cn(
                    loadStatus?.isOverloaded ? "text-destructive" : "text-muted-foreground"
                  )}>DESL</span>
                  <motion.span 
                    key={`${movement}-${loadStatus?.isOverloaded}`}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "font-display text-lg",
                      loadStatus?.isOverloaded && "font-bold"
                    )}
                  >
                    {loadStatus?.isOverloaded ? Math.max(0, movement - 3) : movement}m
                  </motion.span>
                  {/* Indicador visual de penalidade por sobrecarga */}
                  {loadStatus?.isOverloaded && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] text-destructive font-medium flex items-center gap-0.5"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      (-3)
                    </motion.span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1.5 text-xs">
                  <p className="font-medium flex justify-between">
                    <span>Deslocamento</span>
                    <span className={cn(loadStatus?.isOverloaded && "text-destructive")}>
                      {loadStatus?.isOverloaded ? Math.max(0, movement - 3) : movement}m
                    </span>
                  </p>
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground flex justify-between">
                      <span>Base</span>
                      <span>9m</span>
                    </p>
                    {bonusSummary?.movementBreakdown?.map((entry, idx) => (
                      <p key={idx} className="flex justify-between text-primary">
                        <span>{entry.source}</span>
                        <span className="font-medium">+{entry.value}m</span>
                      </p>
                    ))}
                    {armorSpeedPenalty > 0 && (
                      <p className="flex justify-between text-destructive">
                        <span>Armadura</span>
                        <span className="font-medium">-{armorSpeedPenalty}m</span>
                      </p>
                    )}
                    {loadStatus?.isOverloaded && (
                      <p className="flex justify-between text-destructive font-medium">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Sobrecarga
                        </span>
                        <span>-3m</span>
                      </p>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Indicador de Carga do Inventário */}
          {loadStatus && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-baseline gap-1 whitespace-nowrap cursor-help",
                    loadStatus.isOverloaded && "text-destructive"
                  )}>
                    <Weight className={cn("w-4 h-4", loadStatus.isOverloaded ? "text-destructive" : "text-muted-foreground")} />
                    <span className={cn("font-display text-lg", loadStatus.isOverloaded && "font-bold")}>
                      {loadStatus.currentLoad}/{loadStatus.maxCapacity}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-2 text-xs">
                    <p className="font-medium flex justify-between gap-4">
                      <span>Carga do Inventário</span>
                      <span className={cn(loadStatus.isOverloaded && "text-destructive")}>
                        {loadStatus.currentLoad}/{loadStatus.maxCapacity} espaços
                      </span>
                    </p>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          loadStatus.isOverloaded ? "bg-destructive" : "bg-primary"
                        )}
                        style={{ width: `${Math.min((loadStatus.currentLoad / loadStatus.maxCapacity) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="space-y-0.5 pt-1 border-t border-border/50">
                      {loadStatus.hasInventarioOtimizado ? (
                        <>
                          <p className="text-primary flex justify-between">
                            <span>Inventário Otimizado</span>
                            <span className="text-muted-foreground">(FOR + INT) × 5</span>
                          </p>
                          <p className="text-muted-foreground flex justify-between">
                            <span>Capacidade total</span>
                            <span className="text-foreground">{loadStatus.maxCapacity}</span>
                          </p>
                          <p className="text-xs text-muted-foreground/70 italic">
                            -1 espaço por item (mín. 1)
                          </p>
                        </>
                      ) : (
                        <p className="text-muted-foreground flex justify-between">
                          <span>Capacidade (FOR × 5)</span>
                          <span>{loadStatus.maxCapacity}</span>
                        </p>
                      )}
                    </div>
                    {loadStatus.isOverloaded && (
                      <div className="flex items-center gap-1.5 text-destructive pt-1 border-t border-destructive/30">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Sobrecarregado! -5 FOR/AGI/VIG, -3m deslocamento</span>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Painel expandido de bônus ativos */}
      {bonusSummary && (
        <ActiveBonusesPanel
          open={bonusPanelOpen}
          onOpenChange={setBonusPanelOpen}
          bonusSummary={bonusSummary}
          activeBonusSources={activeBonusSources}
          onToggleConditionalBonus={onToggleConditionalBonus}
          filter={bonusPanelFilter}
          onFilterChange={setBonusPanelFilter}
        />
      )}
    </div>
  );
});
