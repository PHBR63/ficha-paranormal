import { useRitualEffectExecution } from '@/hooks/character/useRitualEffectExecution';
/**
 * RitualDamageModal - Modal de resultado de dano de rituais
 * Fase 4: Migração para useRitualDamageWithSUE
 * 
 * Integrado com SUE para bônus automáticos de dano de rituais.
 * Mostra dados rolados, total, tipo de dano e permite aplicar.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  Copy,
  Target,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getElementConfig } from '@/lib/element-config';
import { 
  Ritual,
  DamageFormula, 
  RitualEffect, 
  AnyDamageType,
  getActiveRitualEffect,
  formatDamageFormula,
} from '@/lib/rituals/legacy-exports';
import { 
  useRitualDamageWithSUE, 
  type RitualDamageCharacterConfig,
  type RitualDamageResult as SUERitualDamageResult,
} from '@/hooks/sue';

// Ícones para tipos de dano
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

// Cores para tipos de dano
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

// Função para rolar um dado (mantida para cura que não usa SUE)
function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

// Função para rolar múltiplos dados (mantida para cura que não usa SUE)
function rollDice(count: number, sides: number): number[] {
  return Array.from({ length: count }, () => rollDie(sides));
}

// Interface para resultado de dano
export interface RitualDamageResult {
  dice: number[];
  diceType: number;
  diceMultiplier?: number;
  bonus: number;
  total: number;
  damageType: AnyDamageType;
  ignoresRD: boolean;
  formula: string;
  ritualName: string;
  ritualId: string;
  enhancements: string[];
}

// Interface para resultado de cura
export interface RitualHealingResult {
  dice: number[];
  diceType: number;
  bonus: number;
  total: number;
  formula: string;
  ritualName: string;
  ritualId: string;
  enhancements: string[];
  type: 'healing' | 'tempHP';
}

interface RitualDamageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ritual: Ritual | null;
  enhancements: string[];
  onApplyDamage?: (result: RitualDamageResult) => void | Promise<void>;
  onApplyHealing?: (result: RitualHealingResult) => void | Promise<void>;
  onRequestResistance?: (damage: number) => void; // Callback para solicitar teste de resistência
  onRequestConditions?: () => void; // Callback para abrir modal de condições (Fase 6)
  onClose?: () => void;
  
  // === Configuração do Personagem para SUE ===
  characterClass?: string;
  classTrack?: string;
  nex?: number;
  origin?: string;
  attributes?: {
    agility: number;
    strength: number;
    presence: number;
    intellect: number;
    vigor: number;
  };
  classPowers?: string[];
  generalPowers?: string[];
  paranormalPowers?: Array<{ id: string; name: string; element: string }>;
  activeConditions?: string[];
  
  // === Bônus Legados (retrocompatibilidade) ===
  /** @deprecated Use configuração de personagem para SUE */
  ritualDamageBonus?: number;
  /** @deprecated Use configuração de personagem para SUE */
  damageAttributeBonus?: { attribute: string; value: number };
}

export function RitualDamageModal({
  open,
  onOpenChange,
  ritual,
  enhancements,
  onApplyDamage,
  onApplyHealing,
  onRequestResistance,
  onRequestConditions,
  onClose,
  // Configuração do personagem para SUE
  characterClass = 'Combatente',
  classTrack,
  nex = 5,
  origin,
  attributes = { agility: 1, strength: 1, presence: 1, intellect: 1, vigor: 1 },
  classPowers = [],
  generalPowers = [],
  paranormalPowers = [],
  activeConditions = [],
  // Bônus legados (retrocompatibilidade)
  ritualDamageBonus = 0,
  damageAttributeBonus,
}: RitualDamageModalProps) {
  // Estado do resultado da rolagem
  const [damageResult, setDamageResult] = useState<RitualDamageResult | null>(null);
  const [sueResult, setSueResult] = useState<SUERitualDamageResult | null>(null);
  const [healingResult, setHealingResult] = useState<RitualHealingResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showDice, setShowDice] = useState(false);

  // Configuração do personagem para o hook SUE
  const characterConfig: RitualDamageCharacterConfig = useMemo(() => ({
    characterClass,
    classTrack,
    nex,
    origin,
    attributes,
    classPowers,
    generalPowers,
    paranormalPowers,
    activeConditions,
  }), [characterClass, classTrack, nex, origin, attributes, classPowers, generalPowers, paranormalPowers, activeConditions]);

  // Hook integrado com SUE para dano de rituais
  const { executeRitualDamageRoll, getRitualDamageBonusBreakdown } = useRitualDamageWithSUE(characterConfig);

  // Obtém o efeito ativo do ritual
  const activeEffect = useMemo(() => {
    if (!ritual) return null;
    return getActiveRitualEffect(ritual.id, enhancements);
  }, [ritual, enhancements]);

  // Determina se o ritual causa dano, cura ou PV temp
  const hasDamage = activeEffect?.damage;
  const hasHealing = activeEffect?.healing;
  const hasTempHP = activeEffect?.tempHP;

  // Função para rolar dano usando SUE
  const rollDamage = useCallback(() => {
    if (!ritual || !activeEffect?.damage) return;

    setIsRolling(true);
    setShowDice(false);
    setSueResult(null);

    const { diceCount, diceType, diceMultiplier = 1, bonus = 0, damageType, ignoresRD = false } = activeEffect.damage;
    
    // Calcula bônus legado (retrocompatibilidade)
    const legacyBonus = ritualDamageBonus + (damageAttributeBonus?.value || 0);
    
    // Animação de rolagem
    setTimeout(() => {
      // Executa rolagem via hook SUE
      const sueRollResult = executeRitualDamageRoll({
        ritualId: ritual.id,
        ritualName: ritual.name,
        element: ritual.element,
        circle: ritual.circle,
        baseDamage: `${diceCount}d${diceType}${bonus > 0 ? `+${bonus}` : ''}`,
        diceMultiplier,
        damageType,
        manualModifiers: legacyBonus, // Aplica bônus legado como modificador
      });
      
      setSueResult(sueRollResult);
      
      // Converte para formato legacy para retrocompatibilidade
      setDamageResult({
        dice: sueRollResult.baseDice,
        diceType,
        diceMultiplier,
        bonus: sueRollResult.bonusSources.reduce((sum, b) => sum + b.value, 0) + bonus,
        total: sueRollResult.total,
        damageType,
        ignoresRD,
        formula: formatDamageFormula({ ...activeEffect.damage,
          bonus: bonus + sueRollResult.bonusSources.reduce((sum, source) => sum + source.value, 0) }),
        ritualName: ritual.name,
        ritualId: ritual.id,
        enhancements,
      });
      
      setShowDice(true);
      setIsRolling(false);
    }, 500);
  }, [ritual, activeEffect, enhancements, ritualDamageBonus, damageAttributeBonus, executeRitualDamageRoll]);

  // Função para rolar cura
  const rollHealing = (type: 'healing' | 'tempHP') => {
    if (!ritual || !activeEffect) return;
    
    const healData = type === 'healing' ? activeEffect.healing : activeEffect.tempHP;
    if (!healData) return;

    setIsRolling(true);
    setShowDice(false);

    const { diceCount, diceType, bonus = 0 } = healData;
    
    setTimeout(() => {
      const dice = rollDice(diceCount, diceType);
      const total = dice.reduce((a, b) => a + b, 0) + bonus;
      
      setHealingResult({
        dice,
        diceType,
        bonus,
        total,
        formula: `${diceCount}d${diceType}${bonus > 0 ? `+${bonus}` : ''}`,
        ritualName: ritual.name,
        ritualId: ritual.id,
        enhancements,
        type,
      });
      
      setShowDice(true);
      setIsRolling(false);
    }, 500);
  };

  // Auto-rolar ao abrir se tiver dano
  useEffect(() => {
    if (open && ritual && activeEffect) {
      setDamageResult(null);
      setHealingResult(null);
      setSueResult(null);
      setShowDice(false);
      
      // Auto-rola após um pequeno delay
      if (hasDamage) {
        setTimeout(rollDamage, 300);
      } else if (hasHealing) {
        setTimeout(() => rollHealing('healing'), 300);
      } else if (hasTempHP) {
        setTimeout(() => rollHealing('tempHP'), 300);
      }
    }
  }, [open, ritual?.id, rollDamage]);

  // Handler para fechar
  const handleClose = () => {
    onOpenChange(false);
    onClose?.();
  };

  const effectExecution = useRitualEffectExecution();

  // Handler para aplicar dano
  const handleApplyDamage = () => {
    if (damageResult) void effectExecution.execute(onApplyDamage ? () => onApplyDamage(damageResult) : undefined, handleClose);
  };
  const handleApplyHealing = () => {
    if (healingResult) void effectExecution.execute(onApplyHealing ? () => onApplyHealing(healingResult) : undefined, handleClose);
  };

  if (!ritual || !activeEffect) return null;

  // Configuração visual do elemento
  const elementConfig = getElementConfig(ritual.element);
  const DamageIcon = damageResult 
    ? DAMAGE_TYPE_ICONS[damageResult.damageType] || Sparkles
    : healingResult?.type === 'healing' 
      ? Heart 
      : Shield;
  const damageColor = damageResult 
    ? DAMAGE_TYPE_COLORS[damageResult.damageType] || 'text-foreground'
    : healingResult?.type === 'healing'
      ? 'text-health'
      : 'text-pe';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        {/* Gradient background */}
        <div className={cn(
          "absolute inset-x-0 top-0 h-32 rounded-t-lg opacity-40",
          `bg-gradient-to-b ${elementConfig?.color || 'from-primary/20 to-transparent'}`
        )} />

        {effectExecution.error && <p role="alert" className="text-sm text-destructive">{effectExecution.error}</p>}
        {effectExecution.pending && <p role="status">Aguardando confirmação do servidor…</p>}
        <DialogHeader className="relative">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br from-background to-muted",
                "border-2",
                elementConfig?.border || "border-border"
              )}
            >
              <DamageIcon className={cn("w-7 h-7", damageColor)} />
            </motion.div>

            <div>
              <DialogTitle className="font-display tracking-wider text-lg">
                {hasDamage ? 'Dano do Ritual' : hasHealing ? 'Cura do Ritual' : 'PV Temporários'}
              </DialogTitle>
              <p className={cn("text-sm", elementConfig?.text)}>
                {ritual.name}
              </p>
              {enhancements.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {enhancements.map(enh => (
                    <Badge key={enh} variant="outline" className="text-[10px] py-0">
                      {enh}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="relative py-6">
          {/* Área de resultado */}
          <div className="text-center">
            {/* Animação de rolagem */}
            <AnimatePresence mode="wait">
              {isRolling ? (
                <motion.div
                  key="rolling"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                  >
                    <Dices className={cn("w-8 h-8", elementConfig?.text)} />
                  </motion.div>
                  <span className="text-muted-foreground">Rolando...</span>
                </motion.div>
              ) : showDice && (damageResult || healingResult) ? (
                <motion.div
                  key="result"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  {/* Dados individuais */}
                  <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                    {(damageResult?.dice || healingResult?.dice || []).map((die, i) => (
                      <motion.div
                        key={i}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg",
                          "bg-card border-2",
                          die === (damageResult?.diceType || healingResult?.diceType)
                            ? "border-yellow-400 text-yellow-400" // Máximo
                            : die === 1
                              ? "border-red-400 text-red-400" // Mínimo
                              : "border-border text-foreground"
                        )}
                      >
                        {die}
                      </motion.div>
                    ))}
                    {damageResult?.diceMultiplier && damageResult.diceMultiplier !== 1 && (
                      <span className="font-mono text-muted-foreground">×{damageResult.diceMultiplier}</span>
                    )}
                    {(damageResult?.bonus || healingResult?.bonus || 0) !== 0 && (
                      <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: (damageResult?.dice.length || healingResult?.dice.length || 0) * 0.1 }}
                        className="flex items-center gap-1 text-lg font-medium text-muted-foreground"
                      >
                        <span>+</span>
                        <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted border border-border">
                          {damageResult?.bonus || healingResult?.bonus}
                        </span>
                      </motion.div>
                    )}
                  </div>

                  {/* Total */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="relative"
                  >
                    <div className={cn(
                      "text-6xl font-display font-bold",
                      damageColor
                    )}>
                      {damageResult?.total || healingResult?.total}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {damageResult ? (
                        <span className="flex items-center justify-center gap-1">
                          <DamageIcon className="w-4 h-4" />
                          Dano de {damageResult.damageType}
                          {damageResult.ignoresRD && (
                            <Badge variant="destructive" className="ml-1 text-[10px]">
                              Ignora RD
                            </Badge>
                          )}
                        </span>
                      ) : healingResult?.type === 'healing' ? (
                        <span className="flex items-center justify-center gap-1">
                          <Heart className="w-4 h-4" />
                          Pontos de Vida recuperados
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          <Shield className="w-4 h-4" />
                          PV Temporários
                        </span>
                      )}
                    </div>
                  </motion.div>

                  {/* Fórmula */}
                  <div className="mt-4 text-xs text-muted-foreground">
                    Fórmula: <span className="font-mono">{damageResult?.formula || healingResult?.formula}</span>
                  </div>

                  {/* Bônus do SUE - Exibe fontes detalhadas */}
                  {sueResult && sueResult.bonusSources.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="mt-3 flex flex-wrap justify-center gap-1"
                    >
                      <TooltipProvider>
                        {sueResult.bonusSources.map((source, idx) => (
                          <Tooltip key={idx}>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant="outline" 
                                className="text-[10px] bg-purple-500/10 border-purple-500/30 text-purple-300"
                              >
                                <Info className="w-2.5 h-2.5 mr-1" />
                                {source.source}: +{source.value}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              Bônus de dano de ritual via SUE
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </TooltipProvider>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  className="text-muted-foreground"
                >
                  Preparando rolagem...
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Informações de resistência com botão */}
          {activeEffect.resistance && damageResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-warning" />
                  <span className="text-muted-foreground">Resistência:</span>
                  <Badge variant="outline" className="capitalize">
                    {activeEffect.resistance.type}
                  </Badge>
                </div>
                {onRequestResistance && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRequestResistance(damageResult.total)}
                    className="gap-1 h-7 text-xs border-warning/50 hover:bg-warning/10"
                  >
                    <Target className="w-3 h-3" />
                    Testar
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeEffect.resistance.effect === 'anula' 
                  ? 'Sucesso anula completamente o efeito' 
                  : activeEffect.resistance.effect === 'parcial'
                    ? 'Sucesso reduz dano à metade ou evita condição'
                    : 'Sucesso reduz dano à metade'}
              </p>
            </motion.div>
          )}

          {/* Condições aplicadas (Fase 6) */}
          {activeEffect.appliesConditions && activeEffect.appliesConditions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-muted-foreground">Aplica condição:</span>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {activeEffect.appliesConditions.map((cond, i) => (
                      <Badge key={i} className="capitalize bg-orange-500/20 text-orange-400 hover:bg-orange-500/30">
                        {cond.conditionId}
                        {cond.duration && (
                          <span className="ml-1 opacity-70">({cond.duration})</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
                {onRequestConditions && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRequestConditions}
                    className="gap-1 h-7 text-xs border-orange-500/50 hover:bg-orange-500/10 text-orange-400"
                  >
                    <Target className="w-3 h-3" />
                    Aplicar
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (hasDamage) rollDamage();
              else if (hasHealing) rollHealing('healing');
              else if (hasTempHP) rollHealing('tempHP');
            }}
            disabled={isRolling}
            className="gap-1"
          >
            <RefreshCw className={cn("w-4 h-4", isRolling && "animate-spin")} />
            Rolar novamente
          </Button>
          
          <Button
            onClick={damageResult ? handleApplyDamage : handleApplyHealing}
            disabled={isRolling || (!damageResult && !healingResult)}
            className={cn(
              "gap-2",
              elementConfig?.bg,
              elementConfig?.text
            )}
          >
            <Check className="w-4 h-4" />
            {damageResult ? 'Aplicar Dano' : healingResult?.type === 'healing' ? 'Aplicar Cura' : 'Aplicar PV Temp'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
