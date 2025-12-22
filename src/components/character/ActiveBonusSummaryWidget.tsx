/**
 * ActiveBonusSummaryWidget - Widget compacto que exibe resumo de bônus ativos no cabeçalho
 * Mostra indicadores visuais por categoria com tooltips detalhados
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Swords, 
  Shield, 
  Zap, 
  BookOpen, 
  Flame,
  Target,
  Heart,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { BonusSummary } from '@/hooks/useCharacterBonusSummary';

// Definição de categorias de bônus com cores e ícones
interface BonusCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

const BONUS_CATEGORIES: BonusCategory[] = [
  { 
    id: 'combat', 
    label: 'Combate', 
    icon: Swords, 
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/20',
    borderClass: 'border-destructive/40'
  },
  { 
    id: 'defense', 
    label: 'Defesa', 
    icon: Shield, 
    colorClass: 'text-primary',
    bgClass: 'bg-primary/20',
    borderClass: 'border-primary/40'
  },
  { 
    id: 'ritual', 
    label: 'Rituais', 
    icon: BookOpen, 
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/20',
    borderClass: 'border-blue-500/40'
  },
  { 
    id: 'paranormal', 
    label: 'Paranormal', 
    icon: Flame, 
    colorClass: 'text-fuchsia-400',
    bgClass: 'bg-fuchsia-500/20',
    borderClass: 'border-fuchsia-500/40'
  },
  { 
    id: 'skill', 
    label: 'Perícias', 
    icon: Target, 
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/20',
    borderClass: 'border-amber-500/40'
  },
  { 
    id: 'resistance', 
    label: 'Resistências', 
    icon: Heart, 
    colorClass: 'text-hp',
    bgClass: 'bg-hp/20',
    borderClass: 'border-hp/40'
  },
];

// Interface para item de bônus processado
interface ProcessedBonus {
  source: string;
  value: string | number;
  description?: string;
  isConditional?: boolean;
  isActive?: boolean;
}

// Interface para categoria processada
interface ProcessedCategory {
  category: BonusCategory;
  bonuses: ProcessedBonus[];
  totalCount: number;
  activeCount: number;
}

interface ActiveBonusSummaryWidgetProps {
  bonusSummary: BonusSummary;
  className?: string;
}

/**
 * Processa o resumo de bônus em categorias organizadas
 */
function processBonusSummary(summary: BonusSummary): ProcessedCategory[] {
  const categories: ProcessedCategory[] = [];

  // === COMBATE ===
  const combatBonuses: ProcessedBonus[] = [];
  
  // Bônus de ataque
  if (summary.combat.attack.total !== 0) {
    combatBonuses.push({
      source: 'Ataque',
      value: summary.combat.attack.total > 0 
        ? `+${summary.combat.attack.total}` 
        : `${summary.combat.attack.total}`,
      description: summary.combat.attack.breakdown
        .filter(b => b.active)
        .map(b => `${b.source}: ${typeof b.value === 'number' && b.value > 0 ? '+' : ''}${b.value}`)
        .join('\n'),
    });
  }
  
  // Bônus de dano
  if (summary.combat.damage.total !== 0 || summary.combat.damage.extraDice.length > 0) {
    const damageText = [];
    if (summary.combat.damage.total !== 0) {
      damageText.push(summary.combat.damage.total > 0 
        ? `+${summary.combat.damage.total}` 
        : `${summary.combat.damage.total}`);
    }
    if (summary.combat.damage.extraDice.length > 0) {
      damageText.push(summary.combat.damage.extraDice.join(', '));
    }
    combatBonuses.push({
      source: 'Dano',
      value: damageText.join(' '),
      description: summary.combat.damage.breakdown
        .filter(b => b.active)
        .map(b => `${b.source}: ${typeof b.value === 'number' && b.value > 0 ? '+' : ''}${b.value}`)
        .join('\n'),
    });
  }
  
  // Margem crítica
  if (summary.combat.criticalMargin.total > 0) {
    combatBonuses.push({
      source: 'Margem Crítica',
      value: `+${summary.combat.criticalMargin.total}`,
      description: summary.combat.criticalMargin.breakdown
        .filter(b => b.active)
        .map(b => `${b.source}: +${b.value}`)
        .join('\n'),
    });
  }
  
  // Iniciativa
  if (summary.combat.initiative.total > 0) {
    combatBonuses.push({
      source: 'Iniciativa',
      value: `+${summary.combat.initiative.total}`,
      description: summary.combat.initiative.breakdown
        .filter(b => b.active)
        .map(b => `${b.source}: +${b.value}`)
        .join('\n'),
    });
  }

  if (combatBonuses.length > 0) {
    categories.push({
      category: BONUS_CATEGORIES.find(c => c.id === 'combat')!,
      bonuses: combatBonuses,
      totalCount: combatBonuses.length,
      activeCount: combatBonuses.length,
    });
  }

  // === DEFESA ===
  const defenseBonuses: ProcessedBonus[] = [];
  
  const totalDefenseBonus = summary.defense.breakdown
    .filter(b => b.active)
    .reduce((sum, b) => sum + b.bonus, 0);
  
  if (totalDefenseBonus > 0) {
    defenseBonuses.push({
      source: 'Defesa',
      value: `+${totalDefenseBonus}`,
      description: summary.defense.breakdown
        .filter(b => b.active)
        .map(b => `${b.source}: +${b.bonus}${b.conditional ? ` (${b.conditional})` : ''}`)
        .join('\n'),
    });
  }
  
  // RD
  const totalPhysicalRD = summary.damageReduction.physical.total;
  const totalParanormalRD = summary.damageReduction.paranormal.total;
  
  if (totalPhysicalRD > 0) {
    defenseBonuses.push({
      source: 'RD Física',
      value: `${totalPhysicalRD}`,
      description: summary.damageReduction.physical.breakdown
        .filter(b => b.active)
        .map(b => `${b.source}: ${b.value}`)
        .join('\n'),
    });
  }
  
  if (totalParanormalRD > 0) {
    defenseBonuses.push({
      source: 'RD Paranormal',
      value: `${totalParanormalRD}`,
      description: summary.damageReduction.paranormal.breakdown
        .filter(b => b.active)
        .map(b => `${b.source}: ${b.value}`)
        .join('\n'),
    });
  }

  if (defenseBonuses.length > 0) {
    categories.push({
      category: BONUS_CATEGORIES.find(c => c.id === 'defense')!,
      bonuses: defenseBonuses,
      totalCount: defenseBonuses.length,
      activeCount: defenseBonuses.length,
    });
  }

  // === RESISTÊNCIAS ===
  const resistanceBonuses: ProcessedBonus[] = [];
  
  // ResistanceBonusBreakdown tem fortitude, reflexos, vontade como propriedades separadas
  const fortBonus = summary.resistances.fortitude.breakdown
    .filter(b => b.active)
    .reduce((sum, b) => sum + b.fortitude, 0);
  const refBonus = summary.resistances.reflexos.breakdown
    .filter(b => b.active)
    .reduce((sum, b) => sum + b.reflexos, 0);
  const vonBonus = summary.resistances.vontade.breakdown
    .filter(b => b.active)
    .reduce((sum, b) => sum + b.vontade, 0);

  if (fortBonus > 0) {
    resistanceBonuses.push({
      source: 'Fortitude',
      value: `+${fortBonus}`,
      description: summary.resistances.fortitude.breakdown
        .filter(b => b.active && b.fortitude > 0)
        .map(b => `${b.source}: +${b.fortitude}`)
        .join('\n'),
    });
  }
  
  if (refBonus > 0) {
    resistanceBonuses.push({
      source: 'Reflexos',
      value: `+${refBonus}`,
      description: summary.resistances.reflexos.breakdown
        .filter(b => b.active && b.reflexos > 0)
        .map(b => `${b.source}: +${b.reflexos}`)
        .join('\n'),
    });
  }
  
  if (vonBonus > 0) {
    resistanceBonuses.push({
      source: 'Vontade',
      value: `+${vonBonus}`,
      description: summary.resistances.vontade.breakdown
        .filter(b => b.active && b.vontade > 0)
        .map(b => `${b.source}: +${b.vontade}`)
        .join('\n'),
    });
  }

  if (resistanceBonuses.length > 0) {
    categories.push({
      category: BONUS_CATEGORIES.find(c => c.id === 'resistance')!,
      bonuses: resistanceBonuses,
      totalCount: resistanceBonuses.length,
      activeCount: resistanceBonuses.length,
    });
  }

  // === PERÍCIAS ===
  const skillBonuses: ProcessedBonus[] = [];
  
  for (const [skillName, data] of Object.entries(summary.skills)) {
    if (data.total > 0) {
      skillBonuses.push({
        source: skillName.charAt(0).toUpperCase() + skillName.slice(1),
        value: `+${data.total}`,
        description: data.breakdown
          .filter(b => b.active)
          .map(b => `${b.source}: +${b.value}`)
          .join('\n'),
      });
    }
  }

  if (skillBonuses.length > 0) {
    categories.push({
      category: BONUS_CATEGORIES.find(c => c.id === 'skill')!,
      bonuses: skillBonuses,
      totalCount: skillBonuses.length,
      activeCount: skillBonuses.length,
    });
  }

  // === EFEITOS PARANORMAIS ===
  const paranormalBonuses: ProcessedBonus[] = [];
  
  if (summary.hpBonus > 0) {
    paranormalBonuses.push({
      source: 'PV Máx',
      value: `+${summary.hpBonus}`,
      description: 'Bônus de poderes paranormais',
    });
  }
  
  if (summary.peBonus > 0) {
    paranormalBonuses.push({
      source: 'PE Máx',
      value: `+${summary.peBonus}`,
      description: 'Bônus de poderes paranormais',
    });
  }
  
  // Efeitos especiais
  for (const special of summary.special) {
    if (special.active) {
      paranormalBonuses.push({
        source: special.source,
        value: typeof special.value === 'number' 
          ? (special.value > 0 ? `+${special.value}` : `${special.value}`)
          : special.value,
        description: special.conditional,
      });
    }
  }

  if (paranormalBonuses.length > 0) {
    categories.push({
      category: BONUS_CATEGORIES.find(c => c.id === 'paranormal')!,
      bonuses: paranormalBonuses,
      totalCount: paranormalBonuses.length,
      activeCount: paranormalBonuses.length,
    });
  }

  // === BÔNUS CONDICIONAIS ATIVOS ===
  const conditionalActive = summary.conditionalBonuses.filter(b => b.active);
  if (conditionalActive.length > 0) {
    // Adiciona ao combate se não existir
    const combatCategory = categories.find(c => c.category.id === 'combat');
    if (combatCategory) {
      for (const cond of conditionalActive) {
        combatCategory.bonuses.push({
          source: cond.name,
          value: cond.effects.join(', '),
          description: `Condição: ${cond.condition}`,
          isConditional: true,
          isActive: true,
        });
        combatCategory.totalCount++;
        combatCategory.activeCount++;
      }
    }
  }

  return categories.filter(c => c.bonuses.length > 0);
}

export const ActiveBonusSummaryWidget = memo(function ActiveBonusSummaryWidget({
  bonusSummary,
  className,
}: ActiveBonusSummaryWidgetProps) {
  // Processa categorias de bônus
  const processedCategories = useMemo(
    () => processBonusSummary(bonusSummary),
    [bonusSummary]
  );

  // Conta total de bônus ativos
  const totalBonuses = processedCategories.reduce(
    (sum, cat) => sum + cat.activeCount,
    0
  );

  if (totalBonuses === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg",
          "bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10",
          "border border-primary/20",
          className
        )}
      >
        {/* Ícone principal com contagem */}
        <div className="flex items-center gap-1">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </motion.div>
          <span className="text-xs font-medium text-primary">{totalBonuses}</span>
        </div>

        {/* Separador */}
        <div className="w-px h-4 bg-border/50" />

        {/* Indicadores por categoria */}
        <div className="flex items-center gap-1">
          <AnimatePresence mode="popLayout">
            {processedCategories.map((cat) => (
              <Tooltip key={cat.category.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.15 }}
                    className={cn(
                      "flex items-center gap-0.5 px-1.5 py-0.5 rounded-md cursor-help",
                      "transition-all duration-200 hover:shadow-sm",
                      cat.category.bgClass,
                      cat.category.borderClass,
                      "border"
                    )}
                  >
                    <cat.category.icon 
                      className={cn("w-3 h-3", cat.category.colorClass)} 
                    />
                    <span className={cn(
                      "text-[10px] font-medium",
                      cat.category.colorClass
                    )}>
                      {cat.activeCount}
                    </span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent 
                  side="bottom" 
                  className="max-w-xs z-50"
                  sideOffset={8}
                >
                  <div className="space-y-2">
                    {/* Cabeçalho da categoria */}
                    <div className="flex items-center gap-2 pb-1 border-b border-border/50">
                      <cat.category.icon 
                        className={cn("w-4 h-4", cat.category.colorClass)} 
                      />
                      <span className="font-semibold text-sm">
                        {cat.category.label}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {cat.activeCount} ativo{cat.activeCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Lista de bônus */}
                    <div className="space-y-1.5">
                      {cat.bonuses.slice(0, 6).map((bonus, idx) => (
                        <div 
                          key={idx}
                          className={cn(
                            "flex items-start gap-2 text-xs",
                            bonus.isConditional && "pl-2 border-l-2 border-amber-500/50"
                          )}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-foreground">
                                {bonus.source}:
                              </span>
                              <span className={cn(
                                "font-semibold",
                                cat.category.colorClass
                              )}>
                                {bonus.value}
                              </span>
                              {bonus.isConditional && (
                                <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400">
                                  COND
                                </span>
                              )}
                            </div>
                            {bonus.description && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 whitespace-pre-line">
                                {bonus.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      {cat.bonuses.length > 6 && (
                        <p className="text-[10px] text-muted-foreground italic">
                          +{cat.bonuses.length - 6} mais...
                        </p>
                      )}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </TooltipProvider>
  );
});
