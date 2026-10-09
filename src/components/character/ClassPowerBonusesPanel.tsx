/**
 * ClassPowerBonusesPanel - Painel visual que exibe bônus de poderes de classe e trilha
 * 
 * Mostra de forma organizada:
 * - Bônus de ataque/dano por tipo de arma
 * - Defesa e resistências
 * - Dados extras de dano
 * - Perícias bonificadas
 * - Habilidades especiais ativas
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, 
  Shield, 
  Target, 
  Zap, 
  Heart,
  Flame,
  Skull,
  Crosshair,
  ChevronDown,
  ChevronUp,
  Star,
  BookOpen,
  Sparkles,
  Dice6,
  Award,
  Activity,
} from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ClassPowerBonusResult } from '@/hooks/useClassPowerBonuses';

interface ClassPowerBonusesPanelProps {
  bonuses: ClassPowerBonusResult;
  className?: string;
  compact?: boolean;
}

// ========================================
// COMPONENTES AUXILIARES
// ========================================

/**
 * Seção colapsável para organizar os bônus
 */
function BonusSection({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false,
  colorClass = 'text-primary',
  hasContent = true,
  badge,
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
  defaultOpen?: boolean;
  colorClass?: string;
  hasContent?: boolean;
  badge?: string | number;
}) {
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
          {badge !== undefined && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {badge}
            </Badge>
          )}
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
}

/**
 * Linha de bônus individual com tooltip
 */
function BonusLine({ 
  label, 
  value, 
  sources,
  icon: Icon,
  colorClass,
}: { 
  label: string; 
  value: number | string;
  sources?: string[];
  icon?: React.ElementType;
  colorClass?: string;
}) {
  const displayValue = typeof value === 'number' 
    ? (value > 0 ? `+${value}` : value === 0 ? '0' : value.toString()) 
    : value;

  const hasValue = typeof value === 'number' ? value !== 0 : !!value;
  if (!hasValue) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-between text-xs py-0.5 px-1 rounded hover:bg-muted/30 cursor-help">
            <span className="flex items-center gap-1.5">
              {Icon && <Icon className={cn('h-3 w-3', colorClass || 'text-muted-foreground')} />}
              {label}
            </span>
            <span className={cn(
              'font-mono font-medium',
              typeof value === 'number' && value > 0 && 'text-green-500',
              typeof value === 'string' && 'text-amber-500'
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
}

/**
 * Badge de efeito especial
 */
function SpecialEffectBadge({ effect }: { effect: string }) {
  return (
    <Badge 
      variant="outline" 
      className="text-[10px] px-1.5 py-0.5 border-primary/30 text-primary bg-primary/10"
    >
      {effect}
    </Badge>
  );
}

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

function ClassPowerBonusesPanelComponent({ 
  bonuses, 
  className, 
  compact = false 
}: ClassPowerBonusesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Verifica se há bônus para mostrar
  const hasAttack = bonuses.totals.attack.general !== 0 || 
                    bonuses.totals.attack.melee !== 0 || 
                    bonuses.totals.attack.ranged !== 0 ||
                    bonuses.totals.attack.firearm !== 0;
  
  const hasDamage = bonuses.totals.damage.general !== 0 || 
                    bonuses.totals.damage.melee !== 0 || 
                    bonuses.totals.damage.ranged !== 0 ||
                    bonuses.totals.damage.firearm !== 0 ||
                    bonuses.extraDamageDice.length > 0;
  
  const hasDefense = bonuses.totals.defense !== 0;
  
  const hasResistance = bonuses.totals.damageResistance !== 0 || 
                        bonuses.totals.paranormalResistance !== 0;
  
  const hasInitiative = bonuses.totals.initiative !== 0;
  const hasCritical = bonuses.totals.criticalMargin !== 0;
  const hasBonusHP = bonuses.totals.bonusHP !== 0;
  const hasSkills = Object.keys(bonuses.skillBonuses).length > 0;
  const hasProficiencies = bonuses.proficiencies.weapons.length > 0 || 
                           bonuses.proficiencies.protections.length > 0;
  const hasSpecialFlags = bonuses.specialFlags.length > 0;
  const hasTrackBreakdown = bonuses.breakdown.track.length > 0;
  const hasUnarmedDamage = !!bonuses.unarmedDamage;
  const hasSpecialAbilities = bonuses.canUseHPAsPE || bonuses.canUseOccultismAsAttack;

  const hasAnyBonus = hasAttack || hasDamage || hasDefense || hasResistance || 
                      hasInitiative || hasCritical || hasBonusHP || hasSkills || 
                      hasProficiencies || hasSpecialFlags || hasTrackBreakdown ||
                      hasUnarmedDamage || hasSpecialAbilities;

  if (!hasAnyBonus) {
    return null;
  }

  // Quick stats para o header
  const quickStats = [
    hasAttack && { icon: Crosshair, value: bonuses.totals.attack.general, label: 'ATQ', color: 'text-primary' },
    hasDamage && { icon: Swords, value: bonuses.totals.damage.general, label: 'DANO', color: 'text-destructive' },
    hasDefense && { icon: Shield, value: bonuses.totals.defense, label: 'DEF', color: 'text-energy' },
    hasInitiative && { icon: Zap, value: bonuses.totals.initiative, label: 'INI', color: 'text-yellow-500' },
  ].filter(Boolean) as { icon: React.ElementType; value: number; label: string; color: string }[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-card/80 backdrop-blur-sm border border-primary/20 rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors bg-primary/5"
      >
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Poderes de Classe</span>
        </div>
        
        {/* Quick stats no header */}
        <div className="flex items-center gap-3">
          {quickStats.slice(0, 4).map((stat, i) => (
            <div key={i} className="flex items-center gap-1">
              <stat.icon className={cn('h-3 w-3', stat.color)} />
              <span className="text-xs font-mono">
                {stat.value > 0 ? `+${stat.value}` : stat.value}
              </span>
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
              {/* Combate - Ataque e Dano */}
              <BonusSection 
                title="Combate" 
                icon={Swords} 
                colorClass="text-destructive"
                hasContent={hasAttack || hasDamage || hasCritical || hasUnarmedDamage}
                defaultOpen={true}
              >
                {/* Ataque */}
                {hasAttack && (
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mt-1">
                      Ataque
                    </div>
                    <BonusLine 
                      label="Geral" 
                      value={bonuses.totals.attack.general}
                      icon={Crosshair}
                      colorClass="text-primary"
                    />
                    {bonuses.totals.attack.melee !== 0 && (
                      <BonusLine 
                        label="Corpo-a-corpo" 
                        value={bonuses.totals.attack.melee}
                      />
                    )}
                    {bonuses.totals.attack.ranged !== 0 && (
                      <BonusLine 
                        label="Distância" 
                        value={bonuses.totals.attack.ranged}
                      />
                    )}
                    {bonuses.totals.attack.firearm !== 0 && (
                      <BonusLine 
                        label="Armas de Fogo" 
                        value={bonuses.totals.attack.firearm}
                      />
                    )}
                  </div>
                )}
                
                {/* Dano */}
                {hasDamage && (
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mt-2">
                      Dano
                    </div>
                    <BonusLine 
                      label="Geral" 
                      value={bonuses.totals.damage.general}
                      icon={Swords}
                      colorClass="text-destructive"
                    />
                    {bonuses.totals.damage.melee !== 0 && (
                      <BonusLine 
                        label="Corpo-a-corpo" 
                        value={bonuses.totals.damage.melee}
                      />
                    )}
                    {bonuses.totals.damage.ranged !== 0 && (
                      <BonusLine 
                        label="Distância" 
                        value={bonuses.totals.damage.ranged}
                      />
                    )}
                    {bonuses.totals.damage.firearm !== 0 && (
                      <BonusLine 
                        label="Armas de Fogo" 
                        value={bonuses.totals.damage.firearm}
                      />
                    )}
                    {/* Dados extras de dano */}
                    {bonuses.extraDamageDice.length > 0 && (
                      <div className="flex items-center gap-1 text-xs py-0.5 px-1">
                        <Dice6 className="h-3 w-3 text-amber-500" />
                        <span className="text-muted-foreground">Dados extras:</span>
                        <span className="font-mono text-amber-500">
                          {bonuses.extraDamageDice.join(', ')}
                        </span>
                      </div>
                    )}
                    {/* Atributos como bônus de dano */}
                    {bonuses.damageAttributes.length > 0 && (
                      <div className="flex items-center gap-1 text-xs py-0.5 px-1">
                        <Activity className="h-3 w-3 text-purple-500" />
                        <span className="text-muted-foreground">+Atributo:</span>
                        <span className="font-medium text-purple-500">
                          {bonuses.damageAttributes.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Dano desarmado */}
                {hasUnarmedDamage && (
                  <div className="flex items-center gap-1 text-xs py-0.5 px-1 mt-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    <span className="text-muted-foreground">Desarmado:</span>
                    <span className="font-mono font-medium text-orange-500">
                      {bonuses.unarmedDamage}
                    </span>
                  </div>
                )}

                {/* Margem de Crítico */}
                {hasCritical && (
                  <BonusLine 
                    label="Margem de Ameaça" 
                    value={bonuses.totals.criticalMargin}
                    icon={Target}
                    colorClass="text-amber-500"
                  />
                )}
              </BonusSection>

              {/* Defesa e Resistências */}
              <BonusSection 
                title="Defesa" 
                icon={Shield} 
                colorClass="text-energy"
                hasContent={hasDefense || hasResistance || hasBonusHP}
              >
                {hasDefense && (
                  <BonusLine 
                    label="Defesa" 
                    value={bonuses.totals.defense}
                    icon={Shield}
                    colorClass="text-energy"
                  />
                )}
                {bonuses.totals.damageResistance !== 0 && (
                  <BonusLine 
                    label="Resistência a Dano" 
                    value={bonuses.totals.damageResistance}
                    icon={Heart}
                    colorClass="text-red-500"
                  />
                )}
                {bonuses.totals.paranormalResistance !== 0 && (
                  <BonusLine 
                    label="Resistência Paranormal" 
                    value={bonuses.totals.paranormalResistance}
                    icon={Skull}
                    colorClass="text-purple-500"
                  />
                )}
                {hasBonusHP && (
                  <BonusLine 
                    label="PV Bônus" 
                    value={bonuses.totals.bonusHP}
                    icon={Heart}
                    colorClass="text-green-500"
                  />
                )}
              </BonusSection>

              {/* Iniciativa */}
              {hasInitiative && (
                <BonusSection 
                  title="Iniciativa" 
                  icon={Zap} 
                  colorClass="text-yellow-500"
                  hasContent={hasInitiative}
                >
                  <BonusLine 
                    label="Iniciativa" 
                    value={bonuses.totals.initiative}
                    icon={Zap}
                    colorClass="text-yellow-500"
                  />
                </BonusSection>
              )}

              {/* Perícias */}
              {hasSkills && (
                <BonusSection 
                  title="Perícias" 
                  icon={BookOpen} 
                  colorClass="text-blue-500"
                  hasContent={hasSkills}
                  badge={Object.keys(bonuses.skillBonuses).length}
                >
                  {Object.entries(bonuses.skillBonuses).map(([skill, bonus]) => (
                    <BonusLine 
                      key={skill}
                      label={skill}
                      value={bonus}
                    />
                  ))}
                </BonusSection>
              )}

              {/* Proficiências */}
              {hasProficiencies && (
                <BonusSection 
                  title="Proficiências" 
                  icon={Award} 
                  colorClass="text-amber-500"
                  hasContent={hasProficiencies}
                >
                  {bonuses.proficiencies.weapons.length > 0 && (
                    <div className="text-xs py-0.5 px-1">
                      <span className="text-muted-foreground">Armas: </span>
                      <span className="font-medium">
                        {bonuses.proficiencies.weapons.join(', ')}
                      </span>
                    </div>
                  )}
                  {bonuses.proficiencies.protections.length > 0 && (
                    <div className="text-xs py-0.5 px-1">
                      <span className="text-muted-foreground">Proteções: </span>
                      <span className="font-medium">
                        {bonuses.proficiencies.protections.join(', ')}
                      </span>
                    </div>
                  )}
                </BonusSection>
              )}

              {/* Habilidades Especiais */}
              {(hasSpecialFlags || hasSpecialAbilities || hasTrackBreakdown) && (
                <BonusSection 
                  title="Habilidades Especiais" 
                  icon={Sparkles} 
                  colorClass="text-purple-500"
                  hasContent={hasSpecialFlags || hasSpecialAbilities || hasTrackBreakdown}
                  defaultOpen={true}
                >
                  {/* Flags especiais de poderes */}
                  {hasSpecialFlags && (
                    <div className="flex flex-wrap gap-1 py-1">
                      {bonuses.specialFlags.map((flag, i) => (
                        <SpecialEffectBadge key={i} effect={flag} />
                      ))}
                    </div>
                  )}

                  {/* Habilidades especiais de trilha */}
                  {bonuses.canUseHPAsPE && (
                    <div className="flex items-center gap-1 text-xs py-0.5 px-1 text-purple-400">
                      <Flame className="h-3 w-3" />
                      <span>Pode usar PV como PE (Transcender)</span>
                    </div>
                  )}
                  {bonuses.canUseOccultismAsAttack && (
                    <div className="flex items-center gap-1 text-xs py-0.5 px-1 text-purple-400">
                      <BookOpen className="h-3 w-3" />
                      <span>Usa Ocultismo para ataques (Flagelo)</span>
                    </div>
                  )}

                  {/* Breakdown de trilha */}
                  {hasTrackBreakdown && (
                    <div className="mt-1 space-y-1">
                      {bonuses.breakdown.track.map((item, i) => (
                        <div key={i} className="text-xs py-0.5 px-1">
                          <span className="font-medium text-primary">{item.source}</span>
                          {item.effects.length > 0 && (
                            <ul className="ml-4 text-muted-foreground">
                              {item.effects.map((effect, j) => (
                                <li key={j}>• {effect}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </BonusSection>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const ClassPowerBonusesPanel = React.memo(ClassPowerBonusesPanelComponent);
