/**
 * BonusSummaryCard - Componente que exibe resumo de todos os bônus ativos do personagem
 * 
 * Mostra de forma organizada:
 * - Bônus de defesa
 * - Bônus de resistências
 * - Bônus de combate (ataque, dano, crítico, iniciativa)
 * - Redução de dano
 * - Bônus de perícias
 * - Efeitos especiais
 */

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Swords, 
  Target, 
  Zap, 
  Heart, 
  Brain, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Activity,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BonusSummary, hasBonusesInCategory } from '@/hooks/useCharacterBonusSummary';

interface BonusSummaryCardProps {
  summary: BonusSummary;
  className?: string;
  compact?: boolean; // Modo compacto para mobile
}

// Componente para seção colapsável
const BonusSection = ({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false,
  colorClass = 'text-primary',
  hasContent = true,
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
  defaultOpen?: boolean;
  colorClass?: string;
  hasContent?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!hasContent) return null;

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 px-1 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', colorClass)} />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 space-y-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente para linha de bônus individual
const BonusLine = ({ 
  label, 
  value, 
  sources,
  conditional,
  active = true,
}: { 
  label: string; 
  value: number | string;
  sources?: string[];
  conditional?: string;
  active?: boolean;
}) => {
  const displayValue = typeof value === 'number' ? 
    (value > 0 ? `+${value}` : value.toString()) : 
    value;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'flex items-center justify-between text-xs py-0.5 px-1 rounded',
            active ? 'text-foreground' : 'text-muted-foreground opacity-60',
            'hover:bg-muted/30 cursor-help'
          )}>
            <span className="flex items-center gap-1">
              {label}
              {conditional && (
                <span className="text-[10px] text-muted-foreground">({conditional})</span>
              )}
            </span>
            <span className={cn(
              'font-mono font-medium',
              active && typeof value === 'number' && value > 0 && 'text-green-500',
              active && typeof value === 'string' && 'text-amber-500'
            )}>
              {displayValue}
            </span>
          </div>
        </TooltipTrigger>
        {sources && sources.length > 0 && (
          <TooltipContent side="left" className="max-w-xs">
            <div className="text-xs">
              <p className="font-medium mb-1">Fontes:</p>
              <ul className="space-y-0.5">
                {sources.map((source, i) => (
                  <li key={i} className="text-muted-foreground">• {source}</li>
                ))}
              </ul>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export const BonusSummaryCard = memo(function BonusSummaryCard({ summary, className, compact = false }: BonusSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Verifica se há bônus para mostrar
  const hasDefense = summary.defense.total > 0;
  const hasResistances = summary.resistances.fortitude.total > 0 || 
                         summary.resistances.reflexos.total > 0 || 
                         summary.resistances.vontade.total > 0;
  const hasCombat = hasBonusesInCategory(summary, 'combat');
  const hasDR = hasBonusesInCategory(summary, 'damageReduction');
  const hasSkills = hasBonusesInCategory(summary, 'skills');
  const hasSpecial = hasBonusesInCategory(summary, 'special');
  const hasStats = summary.hpBonus > 0 || summary.peBonus > 0;

  const hasAnyBonus = hasDefense || hasResistances || hasCombat || hasDR || hasSkills || hasSpecial || hasStats;

  if (!hasAnyBonus) {
    return null; // Não mostra se não há bônus
  }

  // Resumo compacto para header
  const quickStats = [
    hasDefense && { icon: Shield, value: `+${summary.defense.total}`, label: 'DEF', color: 'text-blue-500' },
    hasResistances && { icon: Activity, value: `+${Math.max(summary.resistances.fortitude.total, summary.resistances.reflexos.total, summary.resistances.vontade.total)}`, label: 'RES', color: 'text-purple-500' },
    hasCombat && summary.combat.initiative.total > 0 && { icon: Zap, value: `+${summary.combat.initiative.total}`, label: 'INI', color: 'text-yellow-500' },
    hasDR && { icon: Heart, value: `${summary.damageReduction.physical.total}/${summary.damageReduction.paranormal.total}`, label: 'RD', color: 'text-red-500' },
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Bônus Ativos</span>
        </div>
        
        {/* Quick stats no header */}
        <div className="flex items-center gap-3">
          {quickStats.slice(0, 3).map((stat: any, i) => (
            <div key={i} className="flex items-center gap-1">
              <stat.icon className={cn('h-3 w-3', stat.color)} />
              <span className="text-xs font-mono">{stat.value}</span>
            </div>
          ))}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground ml-2" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground ml-2" />
          )}
        </div>
      </button>

      {/* Conteúdo expandido */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-0">
              {/* Defesa */}
              <BonusSection 
                title="Defesa" 
                icon={Shield} 
                colorClass="text-blue-500"
                hasContent={hasDefense}
                defaultOpen={hasDefense}
              >
                <BonusLine 
                  label="Defesa Total"
                  value={summary.defense.total}
                  sources={summary.defense.breakdown.filter(b => b.active).map(b => `${b.source}: +${b.bonus}`)}
                />
                {summary.defense.breakdown.filter(b => !b.active).map((b, i) => (
                  <BonusLine
                    key={i}
                    label={b.source}
                    value={b.bonus}
                    conditional={b.conditional}
                    active={false}
                  />
                ))}
              </BonusSection>

              {/* Resistências */}
              <BonusSection 
                title="Resistências" 
                icon={Activity} 
                colorClass="text-purple-500"
                hasContent={hasResistances}
                defaultOpen={hasResistances}
              >
                {summary.resistances.fortitude.total > 0 && (
                  <BonusLine 
                    label="Fortitude (VIG)"
                    value={summary.resistances.fortitude.total}
                    sources={summary.resistances.fortitude.breakdown.map(b => `${b.source}: +${b.fortitude}`)}
                  />
                )}
                {summary.resistances.reflexos.total > 0 && (
                  <BonusLine 
                    label="Reflexos (AGI)"
                    value={summary.resistances.reflexos.total}
                    sources={summary.resistances.reflexos.breakdown.map(b => `${b.source}: +${b.reflexos}`)}
                  />
                )}
                {summary.resistances.vontade.total > 0 && (
                  <BonusLine 
                    label="Vontade (PRE)"
                    value={summary.resistances.vontade.total}
                    sources={summary.resistances.vontade.breakdown.map(b => `${b.source}: +${b.vontade}`)}
                  />
                )}
              </BonusSection>

              {/* Combate */}
              <BonusSection 
                title="Combate" 
                icon={Swords} 
                colorClass="text-red-500"
                hasContent={hasCombat}
              >
                {summary.combat.attack.total > 0 && (
                  <BonusLine 
                    label="Ataque"
                    value={summary.combat.attack.total}
                    sources={summary.combat.attack.breakdown.filter(b => b.active).map(b => `${b.source}: +${b.value}${b.conditional ? ` (${b.conditional})` : ''}`)}
                  />
                )}
                {(summary.combat.damage.total > 0 || summary.combat.damage.extraDice.length > 0 || summary.combat.damage.breakdown.length > 0) && (
                  <div className="space-y-0.5">
                    {summary.combat.damage.breakdown.map((b, i) => (
                      <BonusLine
                        key={i}
                        label={`Dano (${b.source})`}
                        value={b.value}
                        conditional={b.conditional}
                        active={b.active}
                      />
                    ))}
                  </div>
                )}
                {summary.combat.criticalMargin.total > 0 && (
                  <BonusLine 
                    label="Margem de Crítico"
                    value={summary.combat.criticalMargin.total}
                    sources={summary.combat.criticalMargin.breakdown.map(b => `${b.source}: +${b.value}`)}
                  />
                )}
                {summary.combat.initiative.total > 0 && (
                  <BonusLine 
                    label="Iniciativa"
                    value={summary.combat.initiative.total}
                    sources={summary.combat.initiative.breakdown.map(b => `${b.source}: +${b.value}`)}
                  />
                )}
              </BonusSection>

              {/* Redução de Dano */}
              <BonusSection 
                title="Redução de Dano" 
                icon={Heart} 
                colorClass="text-rose-500"
                hasContent={hasDR}
              >
                {summary.damageReduction.physical.total > 0 && (
                  <BonusLine 
                    label="RD Físico"
                    value={summary.damageReduction.physical.total}
                    sources={summary.damageReduction.physical.breakdown.map(b => `${b.source}: ${b.value}`)}
                  />
                )}
                {summary.damageReduction.paranormal.total > 0 && (
                  <BonusLine 
                    label="RD Paranormal"
                    value={summary.damageReduction.paranormal.total}
                    sources={summary.damageReduction.paranormal.breakdown.map(b => `${b.source}: ${b.value}`)}
                  />
                )}
                {summary.effectResistances.breakdown.length > 0 && (
                  <>
                    {summary.effectResistances.poison > 0 && (
                      <BonusLine label="Res. Veneno" value={summary.effectResistances.poison} />
                    )}
                    {summary.effectResistances.disease > 0 && (
                      <BonusLine label="Res. Doença" value={summary.effectResistances.disease} />
                    )}
                    {summary.effectResistances.mental > 0 && (
                      <BonusLine label="Res. Mental" value={summary.effectResistances.mental} />
                    )}
                  </>
                )}
              </BonusSection>

              {/* Perícias */}
              <BonusSection 
                title="Perícias" 
                icon={TrendingUp} 
                colorClass="text-green-500"
                hasContent={hasSkills}
              >
                {Object.entries(summary.skills).map(([skill, data]) => (
                  <BonusLine 
                    key={skill}
                    label={skill.charAt(0).toUpperCase() + skill.slice(1)}
                    value={data.total}
                    sources={data.breakdown.map(b => `${b.source}: +${b.value}`)}
                  />
                ))}
              </BonusSection>

              {/* Stats (HP/PE) */}
              <BonusSection 
                title="Atributos Vitais" 
                icon={Heart} 
                colorClass="text-pink-500"
                hasContent={hasStats}
              >
                {summary.hpBonus > 0 && (
                  <BonusLine label="PV Máximo" value={summary.hpBonus} />
                )}
                {summary.peBonus > 0 && (
                  <BonusLine label="PE Máximo" value={summary.peBonus} />
                )}
              </BonusSection>

              {/* Efeitos Especiais */}
              <BonusSection 
                title="Efeitos Especiais" 
                icon={Sparkles} 
                colorClass="text-amber-500"
                hasContent={hasSpecial}
              >
                {summary.special.map((effect, i) => (
                  <div key={i} className="text-xs py-0.5 px-1 flex items-start gap-1">
                    <span className="text-amber-500">•</span>
                    <span className="text-muted-foreground">{effect.source}:</span>
                    <span>{effect.value}</span>
                  </div>
                ))}
              </BonusSection>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
