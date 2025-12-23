/**
 * MobileRitualEffectWizard - Wizard de efeitos de rituais para mobile
 * Versão otimizada com Drawer e layout compacto
 * Processa dano, cura, resistência, condições e buffs automaticamente
 */

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Dices,
  Skull,
  Heart,
  Shield,
  Zap,
  Flame,
  Droplet,
  Brain,
  Ghost,
  Snowflake,
  Sparkles,
  RefreshCw,
  Check,
  ChevronRight,
  Target,
  AlertTriangle,
  Swords,
  Timer,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getElementConfig } from '@/lib/element-config';
import { 
  Ritual,
  RitualEffect, 
  DamageFormula,
  AnyDamageType,
  ResistanceType,
  ResistanceEffect,
  getActiveRitualEffect,
  formatDamageFormula,
} from '@/lib/rituals/legacy-exports';
import { CONDITIONS } from '@/lib/conditions';
import { ActiveCondition } from './MobileConditionManager';
import { WeaponBuff } from '@/hooks/useWeaponBuffs';

// ==================== TIPOS ====================

// Etapas do wizard
type WizardStep = 'summary' | 'damage' | 'resistance' | 'conditions' | 'buffs' | 'complete';

// Resultado de dano
interface DamageRollResult {
  dice: number[];
  diceType: number;
  bonus: number;
  total: number;
  damageType: AnyDamageType;
  ignoresRD: boolean;
}

// Resultado de resistência
interface ResistanceResult {
  roll: number;
  modifier: number;
  total: number;
  dt: number;
  passed: boolean;
  adjustedDamage?: number;
}

// Props do wizard
export interface MobileRitualEffectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ritual: Ritual | null;
  enhancements: string[];
  peCost: number;
  // Dados do personagem para testes de resistência
  targetAttributes?: {
    vigor: number;
    agility: number;
    presence: number;
  };
  // Callbacks
  onApplyDamage?: (damage: number, type: AnyDamageType, ignoresRD: boolean) => void;
  onApplyHealing?: (amount: number, type: 'healing' | 'tempHP') => void;
  onApplyConditions?: (conditions: ActiveCondition[]) => void;
  onAddWeaponBuff?: (ritual: Ritual, enhancements: string[]) => void;
  onActivateSustained?: (ritual: Ritual, enhancements: string[], sustain: import('@/lib/rituals/legacy-exports').SustainConfig) => void;
  onComplete?: () => void;
}

// ==================== HELPERS ====================

// Ícones de tipo de dano
const DAMAGE_TYPE_ICONS: Record<string, typeof Skull> = {
  'morte': Skull,
  'sangue': Droplet,
  'energia': Zap,
  'conhecimento': Brain,
  'medo': Ghost,
  'elétrico': Zap,
  'fogo': Flame,
  'frio': Snowflake,
  'mental': Brain,
  'verdadeiro': Skull,
  'corte': Sparkles,
  'impacto': Sparkles,
  'perfuração': Sparkles,
  'balístico': Sparkles,
  'ácido': Droplet,
  'químico': Droplet,
};

// Cores de tipo de dano (usando tokens do design system)
const DAMAGE_TYPE_COLORS: Record<string, string> = {
  'morte': 'text-paranormal',
  'sangue': 'text-hp',
  'energia': 'text-pe',
  'conhecimento': 'text-secondary',
  'medo': 'text-muted-foreground',
  'elétrico': 'text-pe',
  'fogo': 'text-destructive',
  'frio': 'text-secondary',
  'mental': 'text-paranormal',
  'verdadeiro': 'text-foreground',
  'corte': 'text-hp',
  'impacto': 'text-warning',
  'perfuração': 'text-muted-foreground',
  'balístico': 'text-muted-foreground',
  'ácido': 'text-success',
  'químico': 'text-success',
};

// Funções de rolagem
function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function rollDice(count: number, sides: number): number[] {
  return Array.from({ length: count }, () => rollDie(sides));
}

// Atributo de resistência
function getResistanceAttribute(type: ResistanceType): string {
  switch (type) {
    case 'fortitude': return 'vigor';
    case 'reflexos': return 'agility';
    case 'vontade': return 'presence';
  }
}

// ==================== COMPONENTES DE STEP (MOBILE) ====================

// Step: Resumo inicial
const SummaryStep = memo(function SummaryStep({ 
  ritual, 
  effect, 
  enhancements,
  peCost,
  onNext 
}: { 
  ritual: Ritual;
  effect: RitualEffect;
  enhancements: string[];
  peCost: number;
  onNext: () => void;
}) {
  const elementConfig = getElementConfig(ritual.element);
  
  // Calcula quais efeitos estão presentes
  const hasDamage = !!effect.damage;
  const hasHealing = !!effect.healing;
  const hasTempHP = !!effect.tempHP;
  const hasResistance = !!effect.resistance;
  const hasConditions = effect.appliesConditions && effect.appliesConditions.length > 0;
  const hasWeaponBuff = !!effect.weaponEffect;
  const hasDefenseBonus = effect.defenseModifier !== undefined;
  const hasAttackBonus = effect.attackModifier !== undefined;

  return (
    <div className="space-y-3">
      {/* Cabeçalho do ritual - versão compacta */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center",
          "bg-gradient-to-br from-background to-muted border",
          elementConfig?.border || "border-border"
        )}>
          <Sparkles className={cn("w-6 h-6", elementConfig?.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base truncate">{ritual.name}</h3>
          <p className={cn("text-xs", elementConfig?.text)}>
            {ritual.element} • {ritual.circle}º Círculo
          </p>
        </div>
        <Badge variant="secondary" className="text-sm font-mono shrink-0">
          -{peCost} PE
        </Badge>
      </div>

      {/* Aprimoramentos */}
      {enhancements.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {enhancements.map(enh => (
            <Badge key={enh} variant="outline" className="text-[10px]">{enh}</Badge>
          ))}
        </div>
      )}

      {/* Lista de efeitos compacta */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Efeitos:</p>
        
        <div className="grid grid-cols-2 gap-1.5">
          {hasDamage && (
            <EffectChip 
              icon={Skull} 
              label="Dano" 
              value={formatDamageFormula(effect.damage!)}
              color="text-destructive"
            />
          )}
          {hasHealing && (
            <EffectChip 
              icon={Heart} 
              label="Cura" 
              value={`${effect.healing!.diceCount}d${effect.healing!.diceType}`}
              color="text-hp"
            />
          )}
          {hasTempHP && (
            <EffectChip 
              icon={Shield} 
              label="PV Temp" 
              value={`${effect.tempHP!.diceCount}d${effect.tempHP!.diceType}`}
              color="text-pe"
            />
          )}
          {hasResistance && (
            <EffectChip 
              icon={Shield} 
              label="Resist" 
              value={effect.resistance!.type}
              color="text-warning"
            />
          )}
          {hasConditions && (
            <EffectChip 
              icon={AlertTriangle} 
              label="Condições" 
              value={`${effect.appliesConditions!.length}`}
              color="text-destructive"
            />
          )}
          {hasWeaponBuff && (
            <EffectChip 
              icon={Swords} 
              label="Buff" 
              value="Arma"
              color="text-warning"
            />
          )}
          {hasDefenseBonus && (
            <EffectChip 
              icon={Shield} 
              label="Defesa" 
              value={`+${effect.defenseModifier}`}
              color="text-secondary"
            />
          )}
          {hasAttackBonus && (
            <EffectChip 
              icon={Target} 
              label="Ataque" 
              value={`+${effect.attackModifier}`}
              color="text-success"
            />
          )}
        </div>
      </div>

      <Button onClick={onNext} className="w-full gap-2" size="lg">
        Processar Efeitos
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
});

// Chip de efeito compacto
const EffectChip = memo(function EffectChip({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: typeof Skull; 
  label: string; 
  value: string; 
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded bg-secondary/30 border border-border/50">
      <Icon className={cn("w-4 h-4 shrink-0", color)} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        <p className={cn("text-xs font-medium truncate", color)}>{value}</p>
      </div>
    </div>
  );
});

// Step: Dano/Cura (Mobile)
const DamageStep = memo(function DamageStep({ 
  effect, 
  ritual,
  onRoll,
  result,
  isRolling,
  onNext,
  onReroll,
}: { 
  effect: RitualEffect;
  ritual: Ritual;
  onRoll: () => void;
  result: DamageRollResult | null;
  isRolling: boolean;
  onNext: () => void;
  onReroll: () => void;
}) {
  const hasDamage = !!effect.damage;
  const hasHealing = !!effect.healing;
  const hasTempHP = !!effect.tempHP;
  
  const elementConfig = getElementConfig(ritual.element);
  const DamageIcon = result 
    ? DAMAGE_TYPE_ICONS[result.damageType] || Sparkles
    : hasHealing ? Heart : hasTempHP ? Shield : Skull;
  const damageColor = result 
    ? DAMAGE_TYPE_COLORS[result.damageType] || 'text-foreground'
    : hasHealing ? 'text-hp' : hasTempHP ? 'text-pe' : 'text-destructive';

  // Auto-roll na montagem
  useEffect(() => {
    if (!result && !isRolling) {
      onRoll();
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <AnimatePresence mode="wait">
          {isRolling ? (
            <motion.div
              key="rolling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
              >
                <Dices className={cn("w-10 h-10", elementConfig?.text)} />
              </motion.div>
              <span className="text-sm text-muted-foreground">Rolando...</span>
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-3"
            >
              {/* Dados individuais - layout compacto */}
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {result.dice.map((die, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "w-8 h-8 rounded flex items-center justify-center font-mono text-sm font-bold",
                      "bg-secondary border",
                      die === result.diceType && "border-success text-success",
                      die === 1 && "border-destructive text-destructive",
                      die !== result.diceType && die !== 1 && "border-border"
                    )}
                  >
                    {die}
                  </motion.div>
                ))}
                {result.bonus !== 0 && (
                  <span className="text-sm text-muted-foreground font-mono">
                    {result.bonus > 0 ? `+${result.bonus}` : result.bonus}
                  </span>
                )}
              </div>

              {/* Total */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="flex flex-col items-center"
              >
                <DamageIcon className={cn("w-6 h-6 mb-1", damageColor)} />
                <span className={cn("text-4xl font-display font-bold", damageColor)}>
                  {result.total}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5 capitalize">
                  {hasDamage ? `Dano de ${result.damageType}` : hasHealing ? 'PV Recuperados' : 'PV Temporários'}
                  {result.ignoresRD && ' (ignora RD)'}
                </span>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {result && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReroll} className="flex-1 gap-1.5" size="sm">
            <RefreshCw className="w-4 h-4" />
            Rolar
          </Button>
          <Button onClick={onNext} className="flex-1 gap-1.5" size="sm">
            Continuar
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
});

// Step: Resistência (Mobile)
const ResistanceStep = memo(function ResistanceStep({ 
  effect,
  damage,
  targetAttributes,
  onResult,
}: { 
  effect: RitualEffect;
  damage: number;
  targetAttributes?: { vigor: number; agility: number; presence: number };
  onResult: (passed: boolean, adjustedDamage?: number) => void;
}) {
  const [manualRoll, setManualRoll] = useState<string>('');
  const [result, setResult] = useState<ResistanceResult | null>(null);
  const [customDT, setCustomDT] = useState<string>('');

  if (!effect.resistance) return null;

  const resistType = effect.resistance.type;
  const resistEffect = effect.resistance.effect;
  const attrKey = getResistanceAttribute(resistType);
  const attrValue = targetAttributes?.[attrKey as keyof typeof targetAttributes] || 0;
  const defaultDT = effect.resistance.dt || 15;
  const dt = customDT ? parseInt(customDT) : defaultDT;

  const handleRoll = (rollValue?: number) => {
    const roll = rollValue || rollDie(20);
    const modifier = attrValue;
    const total = roll + modifier;
    const passed = total >= dt;
    
    let adjustedDamage: number | undefined;
    if (passed && resistEffect !== 'anula') {
      adjustedDamage = Math.floor(damage / 2);
    } else if (!passed) {
      adjustedDamage = damage;
    }

    setResult({ roll, modifier, total, dt, passed, adjustedDamage });
  };

  const handleConfirm = () => {
    if (result) {
      onResult(result.passed, result.adjustedDamage);
    }
  };

  return (
    <div className="space-y-3">
      {/* Info do teste */}
      <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-warning" />
          <span className="font-medium text-sm">Teste de {resistType}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {resistEffect === 'anula' && 'Sucesso anula o efeito'}
          {resistEffect === 'parcial' && 'Sucesso reduz dano/evita condições'}
          {resistEffect === 'reduz_metade' && 'Sucesso reduz dano pela metade'}
        </p>
      </div>

      {/* DT */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">DT:</span>
        <Input
          type="number"
          value={customDT || defaultDT}
          onChange={(e) => setCustomDT(e.target.value)}
          className="w-16 h-8 text-center text-sm"
        />
      </div>

      {/* Resultado */}
      {result ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-3 rounded-lg border text-center",
            result.passed 
              ? "bg-success/10 border-success/30" 
              : "bg-destructive/10 border-destructive/30"
          )}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="text-xl font-mono">{result.roll}</span>
            <span className="text-muted-foreground text-sm">+</span>
            <span className="text-lg font-mono">{result.modifier}</span>
            <span className="text-muted-foreground text-sm">=</span>
            <span className={cn(
              "text-2xl font-bold",
              result.passed ? "text-success" : "text-destructive"
            )}>
              {result.total}
            </span>
          </div>
          <p className={cn("text-sm font-medium", result.passed ? "text-success" : "text-destructive")}>
            {result.passed ? 'SUCESSO!' : 'FALHOU!'}
          </p>
          {result.adjustedDamage !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              Dano: {damage} → {result.passed && resistEffect !== 'anula' ? result.adjustedDamage : result.passed ? 0 : damage}
            </p>
          )}
        </motion.div>
      ) : (
        <div className="space-y-2">
          {/* Rolagem automática */}
          <Button onClick={() => handleRoll()} className="w-full gap-2" size="sm">
            <Dices className="w-4 h-4" />
            Rolar d20 + {attrValue}
          </Button>

          {/* Rolagem manual */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="d20"
              value={manualRoll}
              onChange={(e) => setManualRoll(e.target.value)}
              className="text-center h-8 text-sm"
              min={1}
              max={20}
            />
            <Button 
              variant="outline" 
              onClick={() => handleRoll(parseInt(manualRoll))}
              disabled={!manualRoll || parseInt(manualRoll) < 1 || parseInt(manualRoll) > 20}
              size="sm"
            >
              Usar
            </Button>
          </div>
        </div>
      )}

      {result && (
        <Button onClick={handleConfirm} className="w-full gap-2" size="sm">
          Continuar
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
});

// Step: Condições (Mobile)
const ConditionsStep = memo(function ConditionsStep({ 
  effect,
  resistancePassed,
  resistanceEffect,
  onApply,
}: { 
  effect: RitualEffect;
  resistancePassed?: boolean;
  resistanceEffect?: ResistanceEffect;
  onApply: (conditions: ActiveCondition[]) => void;
}) {
  if (!effect.appliesConditions || effect.appliesConditions.length === 0) {
    return null;
  }

  // Se passou na resistência e o efeito anula, não aplica condições
  const shouldApply = !(resistancePassed && resistanceEffect === 'anula');

  const conditions: ActiveCondition[] = shouldApply 
    ? effect.appliesConditions.map(c => ({
        id: c.conditionId,
        name: CONDITIONS[c.conditionId]?.name || c.conditionId,
        turnsRemaining: c.duration === 'rodada' ? (c.turnsCount || 1) : null,
        addedAt: new Date().toISOString(),
      }))
    : [];

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="font-medium text-sm">Condições</span>
        </div>
        {!shouldApply && (
          <p className="text-xs text-success">
            ✓ Resistência bem-sucedida - anuladas!
          </p>
        )}
      </div>

      {shouldApply && (
        <div className="space-y-1.5">
          {effect.appliesConditions.map((c, i) => {
            const condData = CONDITIONS[c.conditionId];
            return (
              <motion.div
                key={i}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border"
              >
                <span className="text-lg">{condData?.icon || '⚠️'}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{condData?.name || c.conditionId}</span>
                  <p className="text-[10px] text-muted-foreground truncate">{condData?.effect}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  <Timer className="w-3 h-3 mr-0.5" />
                  {c.duration}
                </Badge>
              </motion.div>
            );
          })}
        </div>
      )}

      <Button onClick={() => onApply(conditions)} className="w-full gap-2" size="sm">
        {shouldApply ? 'Aplicar' : 'Continuar'}
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
});

// Step: Buffs (Mobile)
const BuffsStep = memo(function BuffsStep({ 
  effect,
  ritual,
  onApply,
}: { 
  effect: RitualEffect;
  ritual: Ritual;
  onApply: () => void;
}) {
  const hasWeaponBuff = !!effect.weaponEffect;
  const hasDefense = effect.defenseModifier !== undefined;
  const hasAttack = effect.attackModifier !== undefined;

  if (!hasWeaponBuff && !hasDefense && !hasAttack) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-warning" />
          <span className="font-medium text-sm">Buffs Ativos</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Ativos até o fim da cena
        </p>
      </div>

      <div className="space-y-1.5">
        {hasWeaponBuff && (
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-warning/30"
          >
            <Swords className="w-5 h-5 text-warning" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">Buff de Arma</span>
              <p className="text-[10px] text-muted-foreground">
                {effect.weaponEffect!.bonusDamage && `+${formatDamageFormula(effect.weaponEffect!.bonusDamage)} dano`}
                {effect.weaponEffect!.attackBonus && ` +${effect.weaponEffect!.attackBonus} ataque`}
              </p>
            </div>
            <Check className="w-4 h-4 text-success" />
          </motion.div>
        )}

        {hasDefense && (
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-secondary/30"
          >
            <Shield className="w-5 h-5 text-secondary" />
            <div className="flex-1">
              <span className="text-sm font-medium">Defesa</span>
              <p className="text-[10px] text-muted-foreground">+{effect.defenseModifier}</p>
            </div>
            <Check className="w-4 h-4 text-success" />
          </motion.div>
        )}

        {hasAttack && (
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-success/30"
          >
            <Target className="w-5 h-5 text-success" />
            <div className="flex-1">
              <span className="text-sm font-medium">Ataque</span>
              <p className="text-[10px] text-muted-foreground">+{effect.attackModifier}</p>
            </div>
            <Check className="w-4 h-4 text-success" />
          </motion.div>
        )}
      </div>

      <Button onClick={onApply} className="w-full gap-2" size="sm">
        Continuar
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
});

// Step: Conclusão (Mobile)
const CompleteStep = memo(function CompleteStep({ 
  ritual,
  peCost,
  onClose 
}: { 
  ritual: Ritual;
  peCost: number;
  onClose: () => void;
}) {
  const elementConfig = getElementConfig(ritual.element);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-center space-y-3 py-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className={cn(
          "w-16 h-16 mx-auto rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-success/20 to-success/5 border-2 border-success/50"
        )}
      >
        <Check className="w-8 h-8 text-success" />
      </motion.div>

      <div>
        <h3 className="text-lg font-display">{ritual.name}</h3>
        <p className={cn("text-sm", elementConfig?.text)}>Conjuração completa!</p>
      </div>

      <div className="inline-block px-4 py-2 rounded-lg bg-muted/30">
        <span className="text-xl font-mono font-bold text-pe">-{peCost} PE</span>
      </div>

      <Button onClick={onClose} className="w-full" size="lg">
        Fechar
      </Button>
    </motion.div>
  );
});

// ==================== COMPONENTE PRINCIPAL ====================

export const MobileRitualEffectWizard = memo(function MobileRitualEffectWizard({
  open,
  onOpenChange,
  ritual,
  enhancements,
  peCost,
  targetAttributes,
  onApplyDamage,
  onApplyHealing,
  onApplyConditions,
  onAddWeaponBuff,
  onActivateSustained,
  onComplete,
}: MobileRitualEffectWizardProps) {
  // Estado do wizard
  const [currentStep, setCurrentStep] = useState<WizardStep>('summary');
  const [damageResult, setDamageResult] = useState<DamageRollResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [resistancePassed, setResistancePassed] = useState<boolean | undefined>();
  const [adjustedDamage, setAdjustedDamage] = useState<number | undefined>();

  // Efeito ativo do ritual
  const activeEffect = useMemo(() => {
    if (!ritual) return null;
    return getActiveRitualEffect(ritual.id, enhancements);
  }, [ritual, enhancements]);

  // Determina quais steps são necessários
  const steps = useMemo((): WizardStep[] => {
    if (!activeEffect) return ['summary', 'complete'] as WizardStep[];
    
    const s: WizardStep[] = ['summary'];
    
    if (activeEffect.damage || activeEffect.healing || activeEffect.tempHP) {
      s.push('damage');
    }
    if (activeEffect.resistance && (activeEffect.damage || activeEffect.appliesConditions?.length)) {
      s.push('resistance');
    }
    if (activeEffect.appliesConditions && activeEffect.appliesConditions.length > 0) {
      s.push('conditions');
    }
    if (activeEffect.weaponEffect || activeEffect.defenseModifier !== undefined || activeEffect.attackModifier !== undefined) {
      s.push('buffs');
    }
    
    s.push('complete');
    return s;
  }, [activeEffect]);

  // Progresso atual
  const progress = useMemo(() => {
    const idx = steps.indexOf(currentStep);
    return ((idx + 1) / steps.length) * 100;
  }, [steps, currentStep]);

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setCurrentStep('summary');
      setDamageResult(null);
      setIsRolling(false);
      setResistancePassed(undefined);
      setAdjustedDamage(undefined);
    }
  }, [open]);

  // Handler para próximo step
  const goToNextStep = useCallback(() => {
    const idx = steps.indexOf(currentStep);
    if (idx < steps.length - 1) {
      setCurrentStep(steps[idx + 1]);
    }
  }, [steps, currentStep]);

  // Handler de rolagem de dano
  const handleDamageRoll = useCallback(() => {
    if (!activeEffect) return;
    
    setIsRolling(true);
    
    setTimeout(() => {
      let dice: number[], diceType: number, bonus: number, damageType: AnyDamageType, ignoresRD: boolean;
      
      if (activeEffect.damage) {
        dice = rollDice(activeEffect.damage.diceCount, activeEffect.damage.diceType);
        diceType = activeEffect.damage.diceType;
        bonus = activeEffect.damage.bonus || 0;
        damageType = activeEffect.damage.damageType;
        ignoresRD = activeEffect.damage.ignoresRD || false;
      } else if (activeEffect.healing) {
        dice = rollDice(activeEffect.healing.diceCount, activeEffect.healing.diceType);
        diceType = activeEffect.healing.diceType;
        bonus = activeEffect.healing.bonus || 0;
        damageType = 'verdadeiro';
        ignoresRD = false;
      } else if (activeEffect.tempHP) {
        dice = rollDice(activeEffect.tempHP.diceCount, activeEffect.tempHP.diceType);
        diceType = activeEffect.tempHP.diceType;
        bonus = activeEffect.tempHP.bonus || 0;
        damageType = 'verdadeiro';
        ignoresRD = false;
      } else {
        return;
      }

      const total = dice.reduce((a, b) => a + b, 0) + bonus;
      setDamageResult({ dice, diceType, bonus, total, damageType, ignoresRD });
      setIsRolling(false);
    }, 400);
  }, [activeEffect]);

  // Handler de resistência
  const handleResistanceResult = useCallback((passed: boolean, damage?: number) => {
    setResistancePassed(passed);
    setAdjustedDamage(damage);
    
    // Aplica dano/cura aqui
    if (damageResult && activeEffect?.damage) {
      const finalDamage = passed && activeEffect.resistance?.effect !== 'anula' 
        ? Math.floor(damageResult.total / 2) 
        : passed ? 0 : damageResult.total;
      onApplyDamage?.(finalDamage, damageResult.damageType, damageResult.ignoresRD);
    }
    
    goToNextStep();
  }, [damageResult, activeEffect, goToNextStep, onApplyDamage]);

  // Handler de condições
  const handleApplyConditions = useCallback((conditions: ActiveCondition[]) => {
    onApplyConditions?.(conditions);
    goToNextStep();
  }, [onApplyConditions, goToNextStep]);

  // Handler de buffs
  const handleApplyBuffs = useCallback(() => {
    if (ritual && activeEffect?.weaponEffect) {
      onAddWeaponBuff?.(ritual, enhancements);
    }
    // Ativa ritual sustentado se tiver configuração de sustentação
    if (ritual && activeEffect?.sustain) {
      onActivateSustained?.(ritual, enhancements, activeEffect.sustain);
    }
    goToNextStep();
  }, [ritual, enhancements, activeEffect, onAddWeaponBuff, onActivateSustained, goToNextStep]);

  // Handler de fechamento
  const handleClose = useCallback(() => {
    onComplete?.();
    onOpenChange(false);
  }, [onComplete, onOpenChange]);

  if (!ritual || !activeEffect) return null;

  const elementConfig = getElementConfig(ritual.element);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        {/* Background gradient */}
        <div className={cn(
          "absolute inset-x-0 top-0 h-20 rounded-t-lg opacity-20 pointer-events-none",
          `bg-gradient-to-b ${elementConfig?.color || 'from-primary/20'} to-transparent`
        )} />

        <DrawerHeader className="relative pb-2">
          <DrawerTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className={cn("w-5 h-5", elementConfig?.text)} />
              <span>Efeitos do Ritual</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </DrawerTitle>
        </DrawerHeader>

        {/* Barra de progresso */}
        <div className="px-4 pb-2">
          <Progress value={progress} className="h-1" />
        </div>

        {/* Conteúdo do step atual */}
        <div className="px-4 pb-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
            >
              {currentStep === 'summary' && (
                <SummaryStep
                  ritual={ritual}
                  effect={activeEffect}
                  enhancements={enhancements}
                  peCost={peCost}
                  onNext={goToNextStep}
                />
              )}

              {currentStep === 'damage' && (
                <DamageStep
                  effect={activeEffect}
                  ritual={ritual}
                  onRoll={handleDamageRoll}
                  result={damageResult}
                  isRolling={isRolling}
                  onNext={() => {
                    if (steps.includes('resistance')) {
                      goToNextStep();
                    } else {
                      if (damageResult && activeEffect.damage) {
                        onApplyDamage?.(damageResult.total, damageResult.damageType, damageResult.ignoresRD);
                      } else if (damageResult && activeEffect.healing) {
                        onApplyHealing?.(damageResult.total, 'healing');
                      } else if (damageResult && activeEffect.tempHP) {
                        onApplyHealing?.(damageResult.total, 'tempHP');
                      }
                      goToNextStep();
                    }
                  }}
                  onReroll={handleDamageRoll}
                />
              )}

              {currentStep === 'resistance' && (
                <ResistanceStep
                  effect={activeEffect}
                  damage={damageResult?.total || 0}
                  targetAttributes={targetAttributes}
                  onResult={handleResistanceResult}
                />
              )}

              {currentStep === 'conditions' && (
                <ConditionsStep
                  effect={activeEffect}
                  resistancePassed={resistancePassed}
                  resistanceEffect={activeEffect.resistance?.effect}
                  onApply={handleApplyConditions}
                />
              )}

              {currentStep === 'buffs' && (
                <BuffsStep
                  effect={activeEffect}
                  ritual={ritual}
                  onApply={handleApplyBuffs}
                />
              )}

              {currentStep === 'complete' && (
                <CompleteStep
                  ritual={ritual}
                  peCost={peCost}
                  onClose={handleClose}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
});

export default MobileRitualEffectWizard;
