import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sword, Target, Crosshair, Hand, Zap, AlertTriangle, CheckCircle2, XCircle, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { rollSkillTest } from '@/lib/dice-roller';
import { getAttackModifierFromConditions } from '@/lib/conditions';
import { motion, AnimatePresence } from 'framer-motion';
import type { WeaponBuff } from '@/hooks/useWeaponBuffs';
import { formatDamageFormula } from '@/lib/ritual-effects';

interface WeaponData {
  id: string;
  name: string;
  type: string;
  damage: string;
  criticalRange?: number;
  criticalMultiplier?: number;
  range?: string;
  ammo?: { current: number; max: number };
  special?: string[];
  category?: string;
}

interface SessionAttackPanelProps {
  weapons: WeaponData[];
  attributes: {
    agility: number;
    strength: number;
    intellect: number;
    presence: number;
    vigor: number;
  };
  skills: Record<string, { trained: boolean; bonus: number }>;
  conditions: string[];
  weaponBuffs?: WeaponBuff[];
  onAttackResult: (result: AttackResult) => void;
  onAmmoConsume?: (weaponId: string) => void;
  onRemoveWeaponBuff?: (buffId: string) => void;
}

interface DamageComponent {
  source: string;
  formula: string;
  rolls: number[];
  total: number;
  type?: string;
}

interface DamageBreakdown {
  baseDamage: DamageComponent;
  buffDamages: DamageComponent[];
  critical?: {
    multiplier: number;
    baseMultiplier: number;
    bonusMultiplier: number;
    sources: string[];
  };
  subtotal: number;
  finalTotal: number;
}

interface AttackResult {
  weaponName: string;
  attackRoll: number;
  modifier: number;
  total: number;
  isCritical: boolean;
  isCriticalFail: boolean;
  damageRoll?: string;
  damageTotal?: number;
  damageBreakdown?: DamageBreakdown;
}

const WEAPON_TYPE_SKILLS: Record<string, { skill: string; attribute: keyof SessionAttackPanelProps['attributes'] }> = {
  'Corpo a Corpo': { skill: 'luta', attribute: 'strength' },
  'Briga': { skill: 'luta', attribute: 'strength' },
  'Arremesso': { skill: 'pontaria', attribute: 'agility' },
  'Disparo': { skill: 'pontaria', attribute: 'agility' },
};

const ELEMENT_COLORS: Record<string, string> = {
  'Sangue': 'text-red-500',
  'Morte': 'text-purple-500',
  'Energia': 'text-yellow-500',
  'Conhecimento': 'text-blue-500',
  'Medo': 'text-gray-400',
};

const WeaponTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'Briga': return <Hand className="h-4 w-4" />;
    case 'Arremesso': return <Target className="h-4 w-4" />;
    case 'Disparo': return <Crosshair className="h-4 w-4" />;
    default: return <Sword className="h-4 w-4" />;
  }
};

// Componente de tooltip detalhado para buffs
const BuffTooltipContent: React.FC<{ buff: WeaponBuff }> = ({ buff }) => {
  const effects: string[] = [];
  
  if (buff.bonusDamage) {
    effects.push(`+${formatDamageFormula(buff.bonusDamage)} dano de ${buff.element}`);
  }
  if (buff.attackBonus) {
    effects.push(`+${buff.attackBonus} nos testes de ataque`);
  }
  if (buff.criticalBonus) {
    effects.push(`-${buff.criticalBonus} na margem de ameaça`);
  }
  if (buff.criticalMultiplierBonus) {
    effects.push(`+${buff.criticalMultiplierBonus} no multiplicador de crítico`);
  }

  // Calcula duração restante (se aplicável)
  const appliedAt = buff.appliedAt ? new Date(buff.appliedAt) : null;
  const durationInfo = buff.duration ? `Duração: ${buff.duration} rodadas` : 'Duração: até o fim da cena';

  return (
    <div className="space-y-2 max-w-xs">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-semibold">{buff.ritualName}</span>
      </div>
      <div className={cn("text-xs px-2 py-0.5 rounded inline-block", ELEMENT_COLORS[buff.element] || 'text-primary')}>
        Elemento: {buff.element}
      </div>
      <div className="border-t border-border pt-2">
        <p className="text-xs font-medium mb-1">Efeitos:</p>
        <ul className="text-xs space-y-1">
          {effects.map((effect, i) => (
            <li key={i} className="flex items-start gap-1">
              <span className="text-primary">•</span>
              <span>{effect}</span>
            </li>
          ))}
        </ul>
      </div>
      {buff.enhancements && buff.enhancements.length > 0 && (
        <div className="border-t border-border pt-2">
          <p className="text-xs font-medium mb-1">Aprimoramentos:</p>
          <ul className="text-xs space-y-1">
            {buff.enhancements.map((enh, i) => (
              <li key={i} className="text-muted-foreground">• {enh}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="text-xs text-muted-foreground border-t border-border pt-2">
        {durationInfo}
      </div>
    </div>
  );
};

// Componente de exibição do detalhamento de dano
const DamageBreakdownDisplay: React.FC<{ breakdown: DamageBreakdown; isCritical: boolean }> = ({ breakdown, isCritical }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        <span>Detalhamento do Dano</span>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2 text-xs bg-card/50 rounded-lg p-3">
              {/* Dano Base */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Dano Base ({breakdown.baseDamage.source})</span>
                <div className="font-mono">
                  <span className="text-muted-foreground">{breakdown.baseDamage.formula} → </span>
                  <span className="text-foreground">[{breakdown.baseDamage.rolls.join(', ')}]</span>
                  <span className="text-foreground"> = {breakdown.baseDamage.total}</span>
                </div>
              </div>

              {/* Danos de Buff */}
              {breakdown.buffDamages.map((buff, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className={cn("text-muted-foreground", buff.type && ELEMENT_COLORS[buff.type])}>
                    {buff.source} ({buff.type})
                  </span>
                  <div className="font-mono">
                    <span className="text-muted-foreground">{buff.formula} → </span>
                    <span className={cn(buff.type && ELEMENT_COLORS[buff.type])}>
                      [{buff.rolls.join(', ')}] = {buff.total}
                    </span>
                  </div>
                </div>
              ))}

              {/* Subtotal */}
              <div className="flex items-center justify-between border-t border-border/50 pt-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono font-medium">{breakdown.subtotal}</span>
              </div>

              {/* Crítico */}
              {breakdown.critical && isCritical && (
                <div className="border-t border-yellow-500/30 pt-2 bg-yellow-500/5 -mx-3 px-3 py-2 rounded">
                  <div className="flex items-center justify-between text-yellow-500">
                    <span className="font-medium">CRÍTICO!</span>
                    <span className="font-mono">×{breakdown.critical.multiplier}</span>
                  </div>
                  <div className="text-muted-foreground mt-1 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Multiplicador base</span>
                      <span className="font-mono">×{breakdown.critical.baseMultiplier}</span>
                    </div>
                    {breakdown.critical.bonusMultiplier > 0 && breakdown.critical.sources.map((src, i) => (
                      <div key={i} className="flex justify-between text-yellow-500/80">
                        <span>{src}</span>
                        <span className="font-mono">+{breakdown.critical.bonusMultiplier}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total Final */}
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="font-semibold">Total Final</span>
                <span className="font-mono text-lg font-bold text-destructive">{breakdown.finalTotal}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SessionAttackPanel: React.FC<SessionAttackPanelProps> = ({
  weapons,
  attributes,
  skills,
  conditions,
  weaponBuffs = [],
  onAttackResult,
  onAmmoConsume,
  onRemoveWeaponBuff,
}) => {
  const [lastResult, setLastResult] = useState<AttackResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // Calculate aggregated weapon buff bonuses
  const buffBonuses = useMemo(() => {
    let attackBonus = 0;
    let criticalBonus = 0;
    let criticalMultiplierBonus = 0;
    
    weaponBuffs.forEach(buff => {
      if (buff.attackBonus) attackBonus += buff.attackBonus;
      if (buff.criticalBonus) criticalBonus += buff.criticalBonus;
      if (buff.criticalMultiplierBonus) criticalMultiplierBonus += buff.criticalMultiplierBonus;
    });
    
    return { attackBonus, criticalBonus, criticalMultiplierBonus };
  }, [weaponBuffs]);

  const conditionModifier = getAttackModifierFromConditions(conditions);
  const hasCego = conditions.includes('cego');
  const hasLento = conditions.includes('lento');

  const getWeaponModifier = (weapon: WeaponData) => {
    const typeConfig = WEAPON_TYPE_SKILLS[weapon.type] || WEAPON_TYPE_SKILLS['Corpo a Corpo'];
    const attrValue = attributes[typeConfig.attribute] || 0;
    const skillData = skills[typeConfig.skill];
    const skillBonus = skillData?.trained ? (skillData.bonus || 0) : 0;
    
    // Include buff attack bonus
    return attrValue + skillBonus + conditionModifier + buffBonuses.attackBonus;
  };

  // Calculate effective critical range with buffs
  const getEffectiveCritRange = (baseCritRange?: number) => {
    const base = baseCritRange || 20;
    return Math.max(1, base - buffBonuses.criticalBonus);
  };

  const handleAttack = async (weapon: WeaponData) => {
    // Check ammo
    if (weapon.ammo && weapon.ammo.current <= 0) {
      return;
    }

    setIsRolling(true);
    
    // Simulate rolling animation
    await new Promise(resolve => setTimeout(resolve, 300));

    const modifier = getWeaponModifier(weapon);
    const attackResult = rollSkillTest({ attributeValue: 1, skillBonus: modifier, label: weapon.name });
    const attackRoll = attackResult.keptDice;
    const total = attackResult.total;
    const critRange = getEffectiveCritRange(weapon.criticalRange);
    const isCritical = attackRoll >= critRange;
    const isCriticalFail = attackRoll === 1;

    let damageRoll: string | undefined;
    let damageTotal: number | undefined;
    let damageBreakdown: DamageBreakdown | undefined;

    // Roll damage if hit (assuming hit for now, DT comparison happens elsewhere)
    if (!isCriticalFail && weapon.damage) {
      const damageMatch = weapon.damage.match(/(\d+)d(\d+)/);
      let baseDamageRolls: number[] = [];
      let baseDamageTotal = 0;

      if (damageMatch) {
        const diceCount = parseInt(damageMatch[1]);
        const diceType = parseInt(damageMatch[2]);
        baseDamageRolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * diceType) + 1);
        baseDamageTotal = baseDamageRolls.reduce((a, b) => a + b, 0);
        damageRoll = weapon.damage;
      }

      // Calcular dano dos buffs com detalhamento
      const buffDamages: DamageComponent[] = [];
      let bonusDamageDesc = '';

      weaponBuffs.forEach(buff => {
        if (buff.bonusDamage) {
          const buffDiceRolls = Array.from({ length: buff.bonusDamage.diceCount }, () => 
            Math.floor(Math.random() * buff.bonusDamage!.diceType) + 1
          );
          const buffDamage = buffDiceRolls.reduce((a, b) => a + b, 0) + (buff.bonusDamage.bonus || 0);
          
          buffDamages.push({
            source: buff.ritualName,
            formula: formatDamageFormula(buff.bonusDamage),
            rolls: buffDiceRolls,
            total: buffDamage,
            type: buff.element,
          });

          if (!bonusDamageDesc) {
            bonusDamageDesc = `+${formatDamageFormula(buff.bonusDamage)}`;
          } else {
            bonusDamageDesc += ` +${formatDamageFormula(buff.bonusDamage)}`;
          }
        }
      });

      const totalBuffDamage = buffDamages.reduce((sum, b) => sum + b.total, 0);
      const subtotal = baseDamageTotal + totalBuffDamage;

      // Preparar breakdown
      const baseCritMultiplier = weapon.criticalMultiplier || 2;
      const critMultiplier = baseCritMultiplier + buffBonuses.criticalMultiplierBonus;
      
      let finalTotal = subtotal;
      let criticalInfo: DamageBreakdown['critical'] | undefined;

      if (isCritical) {
        finalTotal = subtotal * critMultiplier;
        const sources: string[] = [];
        if (buffBonuses.criticalMultiplierBonus > 0) {
          sources.push('Arma Atroz Verdadeiro');
        }
        criticalInfo = {
          multiplier: critMultiplier,
          baseMultiplier: baseCritMultiplier,
          bonusMultiplier: buffBonuses.criticalMultiplierBonus,
          sources,
        };
      }

      damageTotal = finalTotal;
      
      damageBreakdown = {
        baseDamage: {
          source: weapon.name,
          formula: weapon.damage,
          rolls: baseDamageRolls,
          total: baseDamageTotal,
        },
        buffDamages,
        critical: criticalInfo,
        subtotal,
        finalTotal,
      };

      if (bonusDamageDesc) {
        damageRoll = `${damageRoll} ${bonusDamageDesc}`;
      }
    }

    const result: AttackResult = {
      weaponName: weapon.name,
      attackRoll,
      modifier,
      total,
      isCritical,
      isCriticalFail,
      damageRoll,
      damageTotal,
      damageBreakdown,
    };

    setLastResult(result);
    setIsRolling(false);
    onAttackResult(result);

    // Consume ammo
    if (weapon.ammo && onAmmoConsume) {
      onAmmoConsume(weapon.id);
    }
  };

  const equippedWeapons = weapons.filter(w => w.type);

  if (equippedWeapons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Sword className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">Nenhuma arma equipada</p>
        <p className="text-xs mt-1">Equipe armas no inventário para atacar</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Active Weapon Buffs */}
        {weaponBuffs.length > 0 && (
          <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Buffs de Arma Ativos</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {weaponBuffs.map(buff => (
                <Tooltip key={buff.id}>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="secondary" 
                      className="gap-1 pr-1 cursor-help"
                    >
                      <span>{buff.ritualName}</span>
                      {buff.bonusDamage && (
                        <span className={cn("ml-1", ELEMENT_COLORS[buff.element] || 'text-primary')}>
                          +{formatDamageFormula(buff.bonusDamage)}
                        </span>
                      )}
                      {buff.attackBonus && (
                        <span className="text-green-500 ml-1">+{buff.attackBonus} atq</span>
                      )}
                      {buff.criticalBonus && (
                        <span className="text-yellow-500 ml-1">-{buff.criticalBonus} crit</span>
                      )}
                      {onRemoveWeaponBuff && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 hover:bg-destructive/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveWeaponBuff(buff.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="p-3">
                    <BuffTooltipContent buff={buff} />
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            {(buffBonuses.attackBonus > 0 || buffBonuses.criticalBonus > 0) && (
              <p className="text-xs text-muted-foreground mt-2">
                Total: {buffBonuses.attackBonus > 0 && `+${buffBonuses.attackBonus} ataque`}
                {buffBonuses.attackBonus > 0 && buffBonuses.criticalBonus > 0 && ' | '}
                {buffBonuses.criticalBonus > 0 && `-${buffBonuses.criticalBonus} margem crítico`}
              </p>
            )}
          </div>
        )}

        {/* Condition Warnings */}
        {(hasCego || hasLento) && (
          <div className="flex flex-wrap gap-2">
            {hasCego && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Cego: -5 em ataques
              </Badge>
            )}
            {hasLento && (
              <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-500">
                <AlertTriangle className="h-3 w-3" />
                Lento: 1 ação/turno
              </Badge>
            )}
          </div>
        )}

        {/* Weapons List */}
        <ScrollArea className="h-[280px]">
          <div className="space-y-2 pr-2">
            {equippedWeapons.map((weapon) => {
              const modifier = getWeaponModifier(weapon);
              const hasAmmo = !weapon.ammo || weapon.ammo.current > 0;
              
              return (
                <motion.div
                  key={weapon.id}
                  className={cn(
                    "p-3 rounded-lg border bg-card/50 transition-all",
                    !hasAmmo && "opacity-50"
                  )}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="p-1.5 rounded bg-primary/10 text-primary">
                        <WeaponTypeIcon type={weapon.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{weapon.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{weapon.damage}</span>
                          {weapon.criticalRange && weapon.criticalRange < 20 && (
                            <span className="text-yellow-500">
                              Crit {weapon.criticalRange}+
                            </span>
                          )}
                          {weapon.ammo && (
                            <span className={cn(
                              weapon.ammo.current <= 0 && "text-destructive"
                            )}>
                              {weapon.ammo.current}/{weapon.ammo.max}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono">
                        {modifier >= 0 ? '+' : ''}{modifier}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => handleAttack(weapon)}
                        disabled={!hasAmmo || isRolling}
                        className="gap-1"
                      >
                        <Zap className="h-3 w-3" />
                        Atacar
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Last Result Display */}
        <AnimatePresence mode="wait">
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "p-4 rounded-lg border-2",
                lastResult.isCritical && "border-yellow-500 bg-yellow-500/10",
                lastResult.isCriticalFail && "border-destructive bg-destructive/10",
                !lastResult.isCritical && !lastResult.isCriticalFail && "border-border bg-card/50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{lastResult.weaponName}</span>
                {lastResult.isCritical && (
                  <Badge className="bg-yellow-500 text-yellow-950 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    CRÍTICO!
                  </Badge>
                )}
                {lastResult.isCriticalFail && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    FALHA CRÍTICA
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Ataque</p>
                  <p className="font-mono text-lg">
                    {lastResult.attackRoll} + {lastResult.modifier} = <strong>{lastResult.total}</strong>
                  </p>
                </div>
                {lastResult.damageTotal !== undefined && !lastResult.isCriticalFail && (
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Dano {lastResult.isCritical && '(crítico)'}
                    </p>
                    <p className="font-mono text-lg text-destructive">
                      <strong>{lastResult.damageTotal}</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* Damage Breakdown */}
              {lastResult.damageBreakdown && !lastResult.isCriticalFail && (
                <DamageBreakdownDisplay 
                  breakdown={lastResult.damageBreakdown} 
                  isCritical={lastResult.isCritical}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
};

export default SessionAttackPanel;
