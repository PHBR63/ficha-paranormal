import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sword, Target, Crosshair, Hand, Zap, AlertTriangle, CheckCircle2, XCircle, Sparkles, X } from 'lucide-react';
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

interface AttackResult {
  weaponName: string;
  attackRoll: number;
  modifier: number;
  total: number;
  isCritical: boolean;
  isCriticalFail: boolean;
  damageRoll?: string;
  damageTotal?: number;
}

const WEAPON_TYPE_SKILLS: Record<string, { skill: string; attribute: keyof SessionAttackPanelProps['attributes'] }> = {
  'Corpo a Corpo': { skill: 'luta', attribute: 'strength' },
  'Briga': { skill: 'luta', attribute: 'strength' },
  'Arremesso': { skill: 'pontaria', attribute: 'agility' },
  'Disparo': { skill: 'pontaria', attribute: 'agility' },
};

const WeaponTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'Briga': return <Hand className="h-4 w-4" />;
    case 'Arremesso': return <Target className="h-4 w-4" />;
    case 'Disparo': return <Crosshair className="h-4 w-4" />;
    default: return <Sword className="h-4 w-4" />;
  }
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
    let bonusDamageDesc: string | undefined;
    let bonusDamageTotal = 0;

    // Roll damage if hit (assuming hit for now, DT comparison happens elsewhere)
    if (!isCriticalFail && weapon.damage) {
      const damageMatch = weapon.damage.match(/(\d+)d(\d+)/);
      if (damageMatch) {
        const diceCount = parseInt(damageMatch[1]);
        const diceType = parseInt(damageMatch[2]);
        const diceRolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * diceType) + 1);
        damageRoll = weapon.damage;
        damageTotal = diceRolls.reduce((a, b) => a + b, 0);
      } else {
        damageRoll = weapon.damage;
        damageTotal = 0;
      }
      
      // Roll bonus damage from weapon buffs
      weaponBuffs.forEach(buff => {
        if (buff.bonusDamage) {
          const buffDiceRolls = Array.from({ length: buff.bonusDamage.diceCount }, () => 
            Math.floor(Math.random() * buff.bonusDamage!.diceType) + 1
          );
          const buffDamage = buffDiceRolls.reduce((a, b) => a + b, 0) + (buff.bonusDamage.bonus || 0);
          bonusDamageTotal += buffDamage;
          if (!bonusDamageDesc) {
            bonusDamageDesc = `+${formatDamageFormula(buff.bonusDamage)}`;
          } else {
            bonusDamageDesc += ` +${formatDamageFormula(buff.bonusDamage)}`;
          }
        }
      });
      
      if (isCritical) {
        const baseCritMultiplier = weapon.criticalMultiplier || 2;
        const critMultiplier = baseCritMultiplier + buffBonuses.criticalMultiplierBonus;
        damageTotal = damageTotal * critMultiplier;
        // Bonus damage from buffs is also multiplied on critical
        bonusDamageTotal = bonusDamageTotal * critMultiplier;
      }
      
      damageTotal += bonusDamageTotal;
    }

    const result: AttackResult = {
      weaponName: weapon.name,
      attackRoll,
      modifier,
      total,
      isCritical,
      isCriticalFail,
      damageRoll: bonusDamageDesc ? `${damageRoll} ${bonusDamageDesc}` : damageRoll,
      damageTotal,
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
              <Badge 
                key={buff.id} 
                variant="secondary" 
                className="gap-1 pr-1"
              >
                <span>{buff.ritualName}</span>
                {buff.bonusDamage && (
                  <span className="text-primary">+{formatDamageFormula(buff.bonusDamage)}</span>
                )}
                {buff.attackBonus && (
                  <span className="text-green-500">+{buff.attackBonus} atq</span>
                )}
                {buff.criticalBonus && (
                  <span className="text-yellow-500">-{buff.criticalBonus} crit</span>
                )}
                {onRemoveWeaponBuff && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-destructive/20"
                    onClick={() => onRemoveWeaponBuff(buff.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </Badge>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SessionAttackPanel;
