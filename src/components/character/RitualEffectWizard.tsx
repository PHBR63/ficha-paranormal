import type { RitualResolutionRoll } from '@/lib/ritual-roll-history';
/**
 * RitualEffectWizard - Wizard unificado pós-conjuração de rituais
 * Fase 7: Integração completa de dano, resistência, condições e buffs
 * Guia o jogador por todos os efeitos do ritual em sequência
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { RitualResistanceStep } from '@/components/character/RitualResistanceStep';
import { RitualFinalDamageConfirmation } from '@/components/character/RitualFinalDamageConfirmation';
import type { RitualResistanceBonuses } from '@/lib/rituals/ritual-resistance';
import { useRitualEffectExecution } from '@/hooks/character/useRitualEffectExecution';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  ChevronLeft,
  Target,
  AlertTriangle,
  Swords,
  Timer,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getElementConfig } from '@/lib/element-config';
import { 
  Ritual,
  RitualEffect, 
  DamageFormula,
  AnyDamageType,
  ResistanceEffect,
  getActiveRitualEffect,
  formatDamageFormula,
} from '@/lib/rituals/legacy-exports';
import { CONDITIONS } from '@/lib/conditions';
import { ActiveCondition } from './ConditionManager';
import { WeaponBuff } from '@/hooks/useWeaponBuffs';
import { rollRitualDamage } from '@/lib/rituals/ritual-damage';

// ==================== TIPOS ====================

// Etapas do wizard
type WizardStep = 'summary' | 'damage' | 'resistance' | 'conditions' | 'buffs' | 'complete';

// Resultado de dano
interface DamageRollResult {
  dice: number[];
  diceType: number;
  bonus: number;
  diceMultiplier?: number;
  total: number;
  damageType: AnyDamageType;
  ignoresRD: boolean;
}


// Props do wizard
interface RitualEffectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ritual: Ritual | null;
  enhancements: string[];
  peCost: number;
  /** DT calculada com os dados do conjurador, distinta dos atributos do alvo. */
  casterResistanceDT?: number;
  // Dados do personagem para testes de resistência
  applicationTargetId?: string;
  targetResistanceBonuses?: RitualResistanceBonuses;
  targetAttributes?: {
    vigor: number;
    agility: number;
    presence: number;
  };
  // Callbacks
  applicationTarget?: React.ReactNode;
  onResolutionRoll?: (result: RitualResolutionRoll) => void;
  onApplyDamage?: (damage: number, type: AnyDamageType, ignoresRD: boolean) => void | Promise<void>;
  onApplyHealing?: (amount: number, type: 'healing' | 'tempHP') => void | Promise<void>;
  onApplyConditions?: (conditions: ActiveCondition[]) => void | Promise<void>;
  onAddWeaponBuff?: (ritual: Ritual, enhancements: string[]) => void | Promise<void>;
  // Callback para ativar ritual sustentado
  onActivateSustained?: (ritual: Ritual, enhancements: string[], sustain: import('@/lib/rituals/legacy-exports').SustainConfig) => void | Promise<void>;
  onComplete?: () => void;
  // === Bônus do SUE (Sistema Unificado de Efeitos) ===
  ritualDamageBonus?: number; // Bônus fixo de dano de rituais
  damageAttributeBonus?: { attribute: string; value: number }; // Ritual Potente (INT no dano)
  // === Bônus de Cura de Origem (Agente de Saúde / Técnica Medicinal) ===
  healingBonusFromOrigin?: number; // Bônus de Intelecto na cura
  healingBonusFromOriginSource?: string | null; // Fonte do bônus (ex: "Técnica Medicinal")
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

// Cores de tipo de dano
const DAMAGE_TYPE_COLORS: Record<string, string> = {
  'morte': 'text-purple-400',
  'sangue': 'text-red-400',
  'energia': 'text-yellow-400',
  'conhecimento': 'text-blue-400',
  'medo': 'text-gray-400',
  'elétrico': 'text-yellow-300',
  'fogo': 'text-orange-400',
  'frio': 'text-cyan-400',
  'mental': 'text-pink-400',
  'verdadeiro': 'text-white',
  'corte': 'text-red-300',
  'impacto': 'text-amber-400',
  'perfuração': 'text-gray-300',
  'balístico': 'text-gray-400',
  'ácido': 'text-green-400',
  'químico': 'text-lime-400',
};

// Funções de rolagem
function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function rollDice(count: number, sides: number): number[] {
  return Array.from({ length: count }, () => rollDie(sides));
}


// ==================== COMPONENTES DE STEP ====================

// Step: Resumo inicial
function SummaryStep({ 
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
    <div className="space-y-4">
      {/* Cabeçalho do ritual */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border">
        <div className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center",
          "bg-gradient-to-br from-background to-muted border-2",
          elementConfig?.border || "border-border"
        )}>
          <Sparkles className={cn("w-7 h-7", elementConfig?.text)} />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg">{ritual.name}</h3>
          <p className={cn("text-sm", elementConfig?.text)}>
            {ritual.element} • {ritual.circle}º Círculo
          </p>
          {enhancements.length > 0 && (
            <div className="flex gap-1 mt-1">
              {enhancements.map(enh => (
                <Badge key={enh} variant="outline" className="text-[10px]">{enh}</Badge>
              ))}
            </div>
          )}
        </div>
        <Badge variant="secondary" className="text-lg font-mono">
          -{peCost} PE
        </Badge>
      </div>

      {/* Lista de efeitos a processar */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground font-medium">Efeitos a processar:</p>
        
        <div className="grid gap-2">
          {hasDamage && (
            <EffectPreviewCard 
              icon={Skull} 
              label="Dano" 
              value={formatDamageFormula(effect.damage!)}
              color="text-destructive"
            />
          )}
          {hasHealing && (
            <EffectPreviewCard 
              icon={Heart} 
              label="Cura" 
              value={`${effect.healing!.diceCount}d${effect.healing!.diceType}${effect.healing!.bonus ? `+${effect.healing!.bonus}` : ''}`}
              color="text-health"
            />
          )}
          {hasTempHP && (
            <EffectPreviewCard 
              icon={Shield} 
              label="PV Temporários" 
              value={`${effect.tempHP!.diceCount}d${effect.tempHP!.diceType}${effect.tempHP!.bonus ? `+${effect.tempHP!.bonus}` : ''}`}
              color="text-pe"
            />
          )}
          {hasResistance && (
            <EffectPreviewCard 
              icon={Shield} 
              label="Resistência" 
              value={`${effect.resistance!.type} (${effect.resistance!.effect})`}
              color="text-warning"
            />
          )}
          {hasConditions && (
            <EffectPreviewCard 
              icon={AlertTriangle} 
              label="Condições" 
              value={effect.appliesConditions!.map(c => c.conditionId).join(', ')}
              color="text-orange-400"
            />
          )}
          {hasWeaponBuff && (
            <EffectPreviewCard 
              icon={Swords} 
              label="Buff de Arma" 
              value={effect.weaponEffect!.bonusDamage 
                ? `+${formatDamageFormula(effect.weaponEffect!.bonusDamage)}`
                : effect.weaponEffect!.attackBonus 
                  ? `+${effect.weaponEffect!.attackBonus} ataque`
                  : 'Ativo'}
              color="text-amber-400"
            />
          )}
          {hasDefenseBonus && (
            <EffectPreviewCard 
              icon={Shield} 
              label="Defesa" 
              value={`+${effect.defenseModifier}`}
              color="text-blue-400"
            />
          )}
          {hasAttackBonus && (
            <EffectPreviewCard 
              icon={Target} 
              label="Ataque" 
              value={`+${effect.attackModifier}`}
              color="text-green-400"
            />
          )}
        </div>
      </div>

      <Button onClick={onNext} className="w-full gap-2">
        Processar Efeitos
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Card de preview de efeito
function EffectPreviewCard({ 
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
    <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 border border-border/50">
      <Icon className={cn("w-5 h-5", color)} />
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className={cn("text-sm font-medium ml-auto", color)}>{value}</span>
    </div>
  );
}

// Step: Dano/Cura
function DamageStep({ 
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
  onNext: (finalDamage?: number) => void;
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
    : hasHealing ? 'text-health' : hasTempHP ? 'text-pe' : 'text-destructive';

  // Auto-roll na montagem
  useEffect(() => {
    if (!result && !isRolling) {
      onRoll();
    }
  }, [result, isRolling, onRoll]);

  return (
    <div className="space-y-4">
      <div className="text-center py-6">
        <AnimatePresence mode="wait">
          {isRolling ? (
            <motion.div
              key="rolling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
              >
                <Dices className={cn("w-12 h-12", elementConfig?.text)} />
              </motion.div>
              <span className="text-muted-foreground">Rolando dados...</span>
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-4"
            >
              {/* Dados individuais */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {result.dice.map((die, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center font-mono text-lg font-bold",
                      "bg-secondary border",
                      die === result.diceType && "border-green-500 text-green-400",
                      die === 1 && "border-red-500 text-red-400",
                      die !== result.diceType && die !== 1 && "border-border"
                    )}
                  >
                    {die}
                  </motion.div>
                ))}
                {result.diceMultiplier && result.diceMultiplier !== 1 && (
                  <span className="font-mono text-muted-foreground">×{result.diceMultiplier}</span>
                )}
                {result.bonus !== 0 && (
                  <span className="text-muted-foreground font-mono">
                    {result.bonus > 0 ? `+${result.bonus}` : result.bonus}
                  </span>
                )}
              </div>

              {/* Total */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="flex flex-col items-center"
              >
                <DamageIcon className={cn("w-8 h-8 mb-2", damageColor)} />
                <span className={cn("text-5xl font-display font-bold", damageColor)}>
                  {result.total}
                </span>
                <span className="text-sm text-muted-foreground mt-1 capitalize">
                  {hasDamage ? `Dano de ${result.damageType}` : hasHealing ? 'PV Recuperados' : 'PV Temporários'}
                  {result.ignoresRD && ' (ignora RD)'}
                </span>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {result && hasDamage && !effect.resistance && (
        <RitualFinalDamageConfirmation key={result.total} suggestedDamage={result.total} onConfirm={onNext} />
      )}
      {result && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReroll} className="flex-1 gap-2">
            <RefreshCw className="w-4 h-4" />
            Rolar Novamente
          </Button>
          {(!hasDamage || effect.resistance) && <Button onClick={() => onNext()} className="flex-1 gap-2">
            Continuar
            <ChevronRight className="w-4 h-4" />
          </Button>}
        </div>
      )}
    </div>
  );
}

// Step: Condições
function ConditionsStep({ 
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
  const shouldApply = !(resistancePassed && (resistanceEffect === 'anula' || resistanceEffect === 'parcial'));

  const conditions: ActiveCondition[] = shouldApply 
    ? effect.appliesConditions.map(c => ({
        id: c.conditionId,
        name: CONDITIONS[c.conditionId]?.name || c.conditionId,
        turnsRemaining: c.duration === 'rodada' ? (c.turnsCount || 1) : null,
        addedAt: new Date(),
      }))
    : [];

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <span className="font-medium">Condições do Ritual</span>
        </div>
        {!shouldApply && (
          <p className="text-sm text-green-400">
            ✓ Resistência bem-sucedida - condições anuladas!
          </p>
        )}
      </div>

      {shouldApply && (
        <div className="space-y-2">
          {effect.appliesConditions.map((c, i) => {
            const condData = CONDITIONS[c.conditionId];
            return (
              <motion.div
                key={i}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border"
              >
                <span className="text-2xl">{condData?.icon || '⚠️'}</span>
                <div className="flex-1">
                  <span className="font-medium">{condData?.name || c.conditionId}</span>
                  <p className="text-xs text-muted-foreground">{condData?.effect}</p>
                </div>
                <Badge variant="outline">
                  <Timer className="w-3 h-3 mr-1" />
                  {c.duration}
                </Badge>
              </motion.div>
            );
          })}
        </div>
      )}

      <Button onClick={() => onApply(conditions)} className="w-full gap-2">
        {shouldApply ? 'Aplicar Condições' : 'Continuar'}
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Step: Buffs
function BuffsStep({ 
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
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="font-medium">Buffs Aplicados</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Os seguintes bônus estão ativos até o fim da cena:
        </p>
      </div>

      <div className="space-y-2">
        {hasWeaponBuff && (
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-amber-500/30"
          >
            <Swords className="w-6 h-6 text-amber-400" />
            <div className="flex-1">
              <span className="font-medium">Buff de Arma</span>
              <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                {effect.weaponEffect!.bonusDamage && (
                  <span>+{formatDamageFormula(effect.weaponEffect!.bonusDamage)} dano</span>
                )}
                {effect.weaponEffect!.attackBonus && (
                  <span>+{effect.weaponEffect!.attackBonus} ataque</span>
                )}
                {effect.weaponEffect!.criticalBonus && (
                  <span>-{effect.weaponEffect!.criticalBonus} margem crítico</span>
                )}
              </div>
            </div>
            <Check className="w-5 h-5 text-green-400" />
          </motion.div>
        )}

        {hasDefense && (
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-blue-500/30"
          >
            <Shield className="w-6 h-6 text-blue-400" />
            <div className="flex-1">
              <span className="font-medium">Bônus de Defesa</span>
              <p className="text-xs text-muted-foreground">+{effect.defenseModifier} na Defesa</p>
            </div>
            <Check className="w-5 h-5 text-green-400" />
          </motion.div>
        )}

        {hasAttack && (
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-green-500/30"
          >
            <Target className="w-6 h-6 text-green-400" />
            <div className="flex-1">
              <span className="font-medium">Bônus de Ataque</span>
              <p className="text-xs text-muted-foreground">+{effect.attackModifier} em ataques</p>
            </div>
            <Check className="w-5 h-5 text-green-400" />
          </motion.div>
        )}
      </div>

      <Button onClick={onApply} className="w-full gap-2">
        Continuar
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Step: Conclusão
function CompleteStep({ 
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
      className="text-center space-y-4 py-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className={cn(
          "w-20 h-20 mx-auto rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500/50"
        )}
      >
        <Check className="w-10 h-10 text-green-400" />
      </motion.div>

      <div>
        <h3 className="text-xl font-display mb-1">{ritual.name}</h3>
        <p className={cn("text-sm", elementConfig?.text)}>PE consumidos. Confira os efeitos aplicados ou pendentes no histórico.</p>
      </div>

      <div className="p-3 rounded-lg bg-muted/30">
        <span className="text-2xl font-mono font-bold text-pe">-{peCost} PE</span>
      </div>

      <Button onClick={onClose} className="w-full">
        Fechar
      </Button>
    </motion.div>
  );
}

// ==================== COMPONENTE PRINCIPAL ====================

export function RitualEffectWizard({
  open,
  onOpenChange,
  ritual,
  enhancements,
  peCost,
  casterResistanceDT,
  targetAttributes,
  targetResistanceBonuses,
  applicationTargetId,
  applicationTarget,
  onResolutionRoll,
  onApplyDamage,
  onApplyHealing,
  onApplyConditions,
  onAddWeaponBuff,
  onActivateSustained,
  onComplete,
  // Bônus do SUE
  ritualDamageBonus = 0,
  damageAttributeBonus,
  // Bônus de Cura de Origem (Agente de Saúde)
  healingBonusFromOrigin = 0,
  healingBonusFromOriginSource,
}: RitualEffectWizardProps) {
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
    
    // Calcula bônus do SUE (ritualDamageBonus + atributo se Ritual Potente)
    const sueBonus = ritualDamageBonus + (damageAttributeBonus?.value || 0);
    
    setTimeout(() => {
      let dice: number[], diceType: number, bonus: number, damageType: AnyDamageType, ignoresRD: boolean;
      let diceMultiplier = 1;
      let calculatedDamageTotal: number | undefined;
      
      if (activeEffect.damage) {
        // Usa a mesma regra do motor e preserva bônus fixos após o multiplicador.
        const damageRoll = rollRitualDamage(activeEffect.damage, sueBonus);
        ({ dice, diceType, bonus, diceMultiplier } = damageRoll);
        calculatedDamageTotal = damageRoll.total;
        damageType = activeEffect.damage.damageType;
        ignoresRD = activeEffect.damage.ignoresRD || false;
      } else if (activeEffect.healing) {
        dice = rollDice(activeEffect.healing.diceCount, activeEffect.healing.diceType);
        diceType = activeEffect.healing.diceType;
        // Aplica bônus do SUE (Ritual Potente) + bônus de origem (Agente de Saúde/Técnica Medicinal)
        bonus = (activeEffect.healing.bonus || 0) + sueBonus + healingBonusFromOrigin;
        damageType = 'verdadeiro'; // Cura não tem tipo
        ignoresRD = false;
      } else if (activeEffect.tempHP) {
        dice = rollDice(activeEffect.tempHP.diceCount, activeEffect.tempHP.diceType);
        diceType = activeEffect.tempHP.diceType;
        // Aplica bônus do SUE também para PV temporários
        bonus = (activeEffect.tempHP.bonus || 0) + sueBonus;
        damageType = 'verdadeiro';
        ignoresRD = false;
      } else {
        return;
      }

      const total = calculatedDamageTotal ?? (dice.reduce((a, b) => a + b, 0) + bonus);
      setDamageResult({ dice, diceType, bonus, diceMultiplier, total, damageType, ignoresRD });
      onResolutionRoll?.({ dice, diceType, bonus, diceMultiplier, total, damageType, ignoresRD });
      setIsRolling(false);
    }, 500);
  }, [activeEffect, ritualDamageBonus, damageAttributeBonus, healingBonusFromOrigin, onResolutionRoll]);

  const effectExecution = useRitualEffectExecution();

  // Handler de resistência
  const handleResistanceResult = useCallback((passed: boolean, damage?: number) => {
    setResistancePassed(passed);
    setAdjustedDamage(damage);
    
    // Aplica dano/cura aqui
    if (damageResult && activeEffect?.damage) {
      const finalDamage = damage ?? (passed ? activeEffect.resistance?.effect === 'anula' ? 0 : Math.floor(damageResult.total / 2) : damageResult.total);
      void effectExecution.execute(onApplyDamage ? () => onApplyDamage(finalDamage, damageResult.damageType, damageResult.ignoresRD) : undefined, goToNextStep);
      return;
    }
    
    goToNextStep();
  }, [damageResult, activeEffect, goToNextStep, onApplyDamage, effectExecution]);

  // Handler de condições
  const handleApplyConditions = useCallback((conditions: ActiveCondition[]) => {
    if (resistancePassed && ['anula', 'parcial'].includes(activeEffect?.resistance?.effect ?? '')) {
      goToNextStep();
      return;
    }
    void effectExecution.execute(onApplyConditions ? () => onApplyConditions(conditions) : undefined, goToNextStep);
  }, [onApplyConditions, goToNextStep, effectExecution, resistancePassed, activeEffect]);

  // Confirma cada efeito antes de avançar; a falha mantém a etapa pendente.
  const handleApplyBuffs = useCallback(() => {
    void effectExecution.execute(async () => {
      if (ritual && activeEffect?.weaponEffect) {
        if (!onAddWeaponBuff) throw new Error('Bônus da arma pendente de aplicação manual.');
        await onAddWeaponBuff(ritual, enhancements);
      }
      if (ritual && activeEffect?.sustain) {
        if (!onActivateSustained) throw new Error('Sustentação pendente de aplicação manual.');
        await onActivateSustained(ritual, enhancements, activeEffect.sustain);
      }
    }, goToNextStep);
  }, [ritual, enhancements, activeEffect, onAddWeaponBuff, onActivateSustained, goToNextStep, effectExecution]);

  // Handler de fechamento
  const handleClose = useCallback(() => {
    onComplete?.();
    onOpenChange(false);
  }, [onComplete, onOpenChange]);

  if (!ritual || !activeEffect) return null;

  const elementConfig = getElementConfig(ritual.element);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {/* Background gradient */}
        <div className={cn(
          "absolute inset-x-0 top-0 h-24 rounded-t-lg opacity-30",
          `bg-gradient-to-b ${elementConfig?.color || 'from-primary/20'} to-transparent`
        )} />

        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className={cn("w-5 h-5", elementConfig?.text)} />
            Efeitos do Ritual
          </DialogTitle>
          <DialogDescription className="sr-only">
            Processando efeitos de {ritual.name}
          </DialogDescription>
        </DialogHeader>

        {/* Barra de progresso */}
        <Progress value={progress} className="h-1" />

        {/* Conteúdo do step atual */}
        <ScrollArea className="max-h-[60vh]">
          <div className="py-2">
            {applicationTarget}
            {effectExecution.error && <p role="alert" className="mb-3 text-sm text-destructive">{effectExecution.error}</p>}
            {effectExecution.pending && <p role="status" className="mb-3 text-sm">Aguardando confirmação do servidor…</p>}
            <fieldset disabled={effectExecution.pending} className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
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
                    onNext={(finalDamage) => {
                      // Se tem resistência, vai pra lá, senão aplica dano e continua
                      if (steps.includes('resistance')) {
                        goToNextStep();
                      } else {
                        const apply = damageResult && activeEffect.damage
                        ? onApplyDamage && (() => onApplyDamage(finalDamage ?? damageResult.total, damageResult.damageType, damageResult.ignoresRD))
                        : damageResult && activeEffect.healing
                          ? onApplyHealing && (() => onApplyHealing(damageResult.total, 'healing'))
                          : damageResult && activeEffect.tempHP
                            ? onApplyHealing && (() => onApplyHealing(damageResult.total, 'tempHP'))
                            : undefined;
                      void effectExecution.execute(apply || undefined, goToNextStep);
                      }
                    }}
                    onReroll={handleDamageRoll}
                  />
                )}

                {currentStep === 'resistance' && (
                  <RitualResistanceStep key={applicationTargetId}
                    effect={activeEffect}
                    damage={damageResult?.total || 0}
                    casterResistanceDT={casterResistanceDT}
                    targetAttributes={targetAttributes}
                    targetResistanceBonuses={targetResistanceBonuses}
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
            </fieldset>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
