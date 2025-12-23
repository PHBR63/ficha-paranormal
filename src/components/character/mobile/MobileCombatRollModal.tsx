/**
 * MobileCombatRollModal - Modal de combate completo para mobile
 * Interface step-by-step: Setup → Ataque → Dano
 * Usa Drawer para UX mobile otimizada
 * 
 * Inclui paridade com desktop:
 * - Suporte à trilha Aniquilador (Técnica Secreta, Máquina de Matar)
 * - Detecção de arma favorita
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, 
  Target, 
  Zap, 
  Sparkles, 
  X, 
  Dices, 
  Shield, 
  ChevronRight,
  RotateCcw,
  Info,
  Flame,
  Check,
  Crosshair,
} from 'lucide-react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerFooter 
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { rollSkillTest, rollDamage, DiceRollResult } from '@/lib/dice-roller';
import { getSkillBonus } from '@/lib/character-data';
import { ComputedEffects } from '@/lib/unified-effects-engine';
import { WeaponBuff } from '@/hooks/useWeaponBuffs';
import { getElementConfig } from '@/lib/element-config';
import { WeaponEntry } from './MobileCombatPanel';
import { AniquiladorTechniqueModal, TechniqueEffects } from '@/components/character/AniquiladorTechniqueModal';

// Interface para bônus selecionável
interface CombatBonus {
  id: string;
  name: string;
  source: 'class' | 'paranormal' | 'ritual' | 'general';
  attackBonus?: number;
  damageBonus?: number | string;
  criticalBonus?: number;
  peCost?: number;
  description: string;
  isPassive?: boolean;
}

// Props do modal
interface MobileCombatRollModalProps {
  open: boolean;
  onClose: () => void;
  weapon: WeaponEntry | null;
  attributes: {
    agility: number;
    strength: number;
    presence: number;
    intellect: number;
    vigor: number;
  };
  skills: Record<string, number>;
  currentPE: number;
  maxPE: number;
  onPEChange: (newPE: number) => void;
  characterClass: string;
  /** Trilha de classe (ex: "aniquilador", "comandante de campo") */
  classTrack?: string;
  abilities: string[];
  nex: number;
  unifiedEffects?: ComputedEffects;
  weaponBuffs?: WeaponBuff[];
  onRollComplete?: (result: DiceRollResult) => void;
}

// Fases do combate
type CombatPhase = 'setup' | 'attack' | 'damage' | 'complete';

// Parse damage string (ex: "2d6+3")
function parseDamageString(damage: string): { count: number; size: number; bonus: number } {
  const match = damage.match(/(\d+)d(\d+)([+-]\d+)?/i);
  if (!match) return { count: 1, size: 6, bonus: 0 };
  return {
    count: parseInt(match[1]) || 1,
    size: parseInt(match[2]) || 6,
    bonus: match[3] ? parseInt(match[3]) : 0,
  };
}

// Componente de dado animado compacto
function AnimatedDie({ value, delay = 0, isKept = false, isCritical = false }: { 
  value: number; 
  delay?: number; 
  isKept?: boolean;
  isCritical?: boolean;
}) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center font-display text-lg font-bold shadow-lg",
        isKept && isCritical && "bg-gradient-to-br from-amber-500 to-orange-600 text-white ring-2 ring-amber-300",
        isKept && !isCritical && "bg-primary text-primary-foreground ring-2 ring-primary/50",
        !isKept && "bg-muted text-muted-foreground opacity-50"
      )}
    >
      {value}
    </motion.div>
  );
}

export function MobileCombatRollModal({
  open,
  onClose,
  weapon,
  attributes,
  skills,
  currentPE,
  maxPE,
  onPEChange,
  characterClass,
  classTrack,
  abilities,
  nex,
  unifiedEffects,
  weaponBuffs = [],
  onRollComplete,
}: MobileCombatRollModalProps) {
  // Estados
  const [phase, setPhase] = useState<CombatPhase>('setup');
  const [selectedBonuses, setSelectedBonuses] = useState<string[]>([]);
  const [attackResult, setAttackResult] = useState<DiceRollResult | null>(null);
  const [damageResult, setDamageResult] = useState<{
    dice: number[];
    bonus: number;
    total: number;
    isCritical: boolean;
  } | null>(null);
  const [manualAttackMod, setManualAttackMod] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  
  // === ESTADOS DO ANIQUILADOR ===
  const [showTechniqueModal, setShowTechniqueModal] = useState(false);
  const [activeTechniqueEffects, setActiveTechniqueEffects] = useState<TechniqueEffects | null>(null);
  
  // Detecta se pode usar Técnica Secreta (Aniquilador NEX 40%+ com arma favorita)
  const canUseTechniqueSecreta = useMemo(() => {
    const isAniquilador = classTrack?.toLowerCase().includes('aniquilador');
    return isAniquilador && nex >= 40 && weapon?.isFavoriteWeapon;
  }, [classTrack, nex, weapon?.isFavoriteWeapon]);
  
  // Detecta Máquina de Matar (Aniquilador NEX 99%+ com arma favorita)
  const maquinaDeMatarActive = useMemo(() => {
    const isAniquilador = classTrack?.toLowerCase().includes('aniquilador');
    return isAniquilador && nex >= 99 && weapon?.isFavoriteWeapon;
  }, [classTrack, nex, weapon?.isFavoriteWeapon]);

  // Reset ao fechar
  const handleClose = useCallback(() => {
    setPhase('setup');
    setSelectedBonuses([]);
    setAttackResult(null);
    setDamageResult(null);
    setManualAttackMod(0);
    setIsRolling(false);
    setActiveTechniqueEffects(null);
    onClose();
  }, [onClose]);
  
  // Handler para confirmar técnicas do Aniquilador
  const handleConfirmTechnique = useCallback((effects: TechniqueEffects) => {
    setActiveTechniqueEffects(effects);
    // Deduz PE
    if (effects.peCost > 0) {
      onPEChange(currentPE - effects.peCost);
    }
  }, [currentPE, onPEChange]);

  // Determinar atributo e perícia baseado no tipo de arma
  const attackAttribute = useMemo(() => {
    if (!weapon) return 0;
    return weapon.type === 'Disparo' || weapon.type === 'Arremesso' 
      ? attributes.agility 
      : attributes.strength;
  }, [weapon, attributes]);

  const attackSkill = useMemo(() => {
    if (!weapon) return { name: '', bonus: 0 };
    const skillName = weapon.type === 'Disparo' || weapon.type === 'Arremesso' 
      ? 'pontaria' 
      : 'luta';
    const skillValue = skills[skillName] || 0;
    const bonus = getSkillBonus(skillValue);
    return { 
      name: skillName === 'pontaria' ? 'Pontaria' : 'Luta', 
      bonus 
    };
  }, [weapon, skills]);

  // Bônus disponíveis
  const availableBonuses = useMemo((): CombatBonus[] => {
    const bonuses: CombatBonus[] = [];
    
    // Ataque Especial (Combatente)
    if (abilities.some(a => a.toLowerCase().includes('ataque especial'))) {
      bonuses.push({
        id: 'ataque-especial-ataque',
        name: 'Ataque Especial (+5 atk)',
        source: 'class',
        attackBonus: 5,
        peCost: 2,
        description: '+5 no ataque por 2 PE',
      });
      bonuses.push({
        id: 'ataque-especial-dano',
        name: 'Ataque Especial (+5 dano)',
        source: 'class',
        damageBonus: 5,
        peCost: 2,
        description: '+5 no dano por 2 PE',
      });
    }

    // Golpe Pesado
    if (abilities.some(a => a.toLowerCase().includes('golpe pesado'))) {
      bonuses.push({
        id: 'golpe-pesado',
        name: 'Golpe Pesado (+1 dado)',
        source: 'class',
        damageBonus: '1d',
        peCost: 1,
        description: '+1 dado de dano por 1 PE',
      });
    }

    return bonuses;
  }, [abilities]);

  // Toggle de bônus
  const toggleBonus = (bonusId: string) => {
    setSelectedBonuses(prev => 
      prev.includes(bonusId) 
        ? prev.filter(id => id !== bonusId)
        : [...prev, bonusId]
    );
  };

  // Custo total de PE
  const totalPECost = useMemo(() => {
    return selectedBonuses.reduce((total, bonusId) => {
      const bonus = availableBonuses.find(b => b.id === bonusId);
      return total + (bonus?.peCost || 0);
    }, 0);
  }, [selectedBonuses, availableBonuses]);

  const canAffordPE = currentPE >= totalPECost;

  // Bônus total de ataque
  const totalAttackBonus = useMemo(() => {
    let total = attackSkill.bonus;
    const isMelee = weapon?.type === 'Corpo a Corpo' || weapon?.type === 'Briga';
    
    // Bônus do SUE
    if (unifiedEffects) {
      total += unifiedEffects.attack.general;
      total += isMelee ? unifiedEffects.attack.melee : unifiedEffects.attack.ranged;
    }
    
    // Bônus de weapon buffs
    weaponBuffs.forEach(b => {
      if (b.attackBonus) total += b.attackBonus;
    });
    
    // Bônus selecionados
    selectedBonuses.forEach(bonusId => {
      const bonus = availableBonuses.find(b => b.id === bonusId);
      if (bonus?.attackBonus) total += bonus.attackBonus;
    });
    
    // Modificador manual
    total += manualAttackMod;
    
    return total;
  }, [attackSkill.bonus, selectedBonuses, availableBonuses, manualAttackMod, weaponBuffs, unifiedEffects, weapon]);

  // Margem de crítico efetiva (inclui Máquina de Matar e Técnicas do Aniquilador)
  const criticalMargin = useMemo(() => {
    let margin = 20;
    
    // Da arma
    if (weapon?.critical) {
      const match = weapon.critical.match(/(\d+)/);
      if (match) margin = Math.min(margin, parseInt(match[1]));
    }
    
    // De weapon buffs
    weaponBuffs.forEach(b => {
      if (b.criticalBonus) margin -= b.criticalBonus;
    });
    
    // Máquina de Matar (NEX 99%) - reduz margem em 2
    if (maquinaDeMatarActive) {
      margin -= 2;
    }
    
    // Técnica Letal do Aniquilador
    if (activeTechniqueEffects?.criticalMarginBonus) {
      margin -= activeTechniqueEffects.criticalMarginBonus;
    }
    
    return Math.max(1, margin);
  }, [weapon, weaponBuffs, maquinaDeMatarActive, activeTechniqueEffects]);
  
  // Multiplicador de crítico efetivo (inclui Destruidor)
  const criticalMultiplier = useMemo(() => {
    let multiplier = 2; // Padrão x2
    
    // Da arma
    if (weapon?.criticalMultiplier) {
      const match = weapon.criticalMultiplier.match(/x?(\d+)/i);
      if (match) multiplier = parseInt(match[1]);
    }
    
    // Técnica Destruidor do Aniquilador
    if (activeTechniqueEffects?.criticalMultiplierBonus) {
      multiplier += activeTechniqueEffects.criticalMultiplierBonus;
    }
    
    return multiplier;
  }, [weapon, activeTechniqueEffects]);

  // Rolar ataque
  const rollAttack = useCallback(() => {
    if (!weapon) return;
    
    setIsRolling(true);
    
    setTimeout(() => {
      const result = rollSkillTest({
        attributeValue: attackAttribute,
        skillBonus: totalAttackBonus,
        criticalThreshold: criticalMargin,
        label: `Ataque com ${weapon.name}`,
      });
      
      setAttackResult(result);
      setIsRolling(false);
      setPhase('attack');
      
      // Confetti em crítico
      if (result.isCritical) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffd700', '#ff6b6b', '#4ecdc4'],
        });
      }
      
      // Paga PE
      if (totalPECost > 0 && canAffordPE) {
        onPEChange(currentPE - totalPECost);
      }
      
      onRollComplete?.(result);
    }, 500);
  }, [weapon, attackAttribute, totalAttackBonus, criticalMargin, totalPECost, canAffordPE, currentPE, onPEChange, onRollComplete]);

  // Rolar dano
  const rollDamageAction = useCallback(() => {
    if (!weapon || !attackResult) return;
    
    setIsRolling(true);
    
    setTimeout(() => {
      const isCritical = attackResult.isCritical;
      const parsed = parseDamageString(weapon.damage);
      
      // Dados extras de poderes selecionados
      let extraDice = 0;
      selectedBonuses.forEach(bonusId => {
        const bonus = availableBonuses.find(b => b.id === bonusId);
        if (bonus?.damageBonus === '1d') extraDice++;
      });
      
      // Máquina de Matar (NEX 99%) - adiciona 1 dado extra de dano
      let maquinaDeMatarDice = 0;
      if (maquinaDeMatarActive) {
        maquinaDeMatarDice = 1;
        // Se for crítico, multiplica pelo multiplicador
        if (isCritical) {
          maquinaDeMatarDice = criticalMultiplier;
        }
      }
      
      // Bônus de dano
      let damageBonus = parsed.bonus;
      const isMelee = weapon.type === 'Corpo a Corpo' || weapon.type === 'Briga';
      
      // Força em corpo a corpo
      if (isMelee) {
        damageBonus += attributes.strength;
      }
      
      // SUE
      if (unifiedEffects) {
        damageBonus += unifiedEffects.damage.general;
        damageBonus += isMelee ? unifiedEffects.damage.melee : unifiedEffects.damage.ranged;
      }
      
      // Bônus selecionados numéricos
      selectedBonuses.forEach(bonusId => {
        const bonus = availableBonuses.find(b => b.id === bonusId);
        if (typeof bonus?.damageBonus === 'number') damageBonus += bonus.damageBonus;
      });
      
      const result = rollDamage({
        diceCount: parsed.count + extraDice + maquinaDeMatarDice,
        diceType: parsed.size,
        bonusDamage: damageBonus,
        isCritical,
        criticalMultiplier: criticalMultiplier,
      });
      
      setDamageResult({
        dice: result.dice,
        bonus: result.bonusDamage,
        total: result.total,
        isCritical,
      });
      setIsRolling(false);
      setPhase('damage');
    }, 500);
  }, [weapon, attackResult, selectedBonuses, availableBonuses, attributes, unifiedEffects, maquinaDeMatarActive, criticalMultiplier]);

  if (!weapon) return null;

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sword className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <DrawerTitle className="font-display text-base">{weapon.name}</DrawerTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px]">{weapon.type}</Badge>
                <Badge variant="outline" className="text-[10px]">{weapon.damage}</Badge>
              </div>
            </div>
          </div>
          
          {/* Progress steps */}
          <div className="flex items-center gap-1 mt-3">
            {['setup', 'attack', 'damage'].map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  (phase === step || 
                   (step === 'setup' && phase !== 'setup') ||
                   (step === 'attack' && (phase === 'attack' || phase === 'damage'))
                  ) ? 'bg-primary' : 'bg-muted'
                )} />
              </div>
            ))}
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4">
          <AnimatePresence mode="wait">
            {/* FASE: Setup */}
            {phase === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4 py-4"
              >
                {/* Weapon buffs ativos */}
                {weaponBuffs.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase mb-2">Buffs Ativos</p>
                    <div className="flex flex-wrap gap-1.5">
                      {weaponBuffs.map(buff => {
                        const elementConfig = getElementConfig(buff.element);
                        return (
                          <span
                            key={buff.id}
                            className={cn(
                              "px-2 py-1 rounded text-[10px] font-medium",
                              "flex items-center gap-1",
                              elementConfig?.bg || "bg-primary/10",
                              elementConfig?.text || "text-primary"
                            )}
                          >
                            <Flame className="w-3 h-3" />
                            {buff.ritualName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bônus selecionáveis */}
                {availableBonuses.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase">Poderes Ativáveis</p>
                    {availableBonuses.map(bonus => (
                      <div
                        key={bonus.id}
                        onClick={() => toggleBonus(bonus.id)}
                        className={cn(
                          "p-3 rounded-lg border transition-all cursor-pointer",
                          selectedBonuses.includes(bonus.id)
                            ? "bg-primary/10 border-primary"
                            : "bg-card/50 border-border"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={selectedBonuses.includes(bonus.id)}
                            onCheckedChange={() => toggleBonus(bonus.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{bonus.name}</p>
                            <p className="text-[10px] text-muted-foreground">{bonus.description}</p>
                          </div>
                          {bonus.peCost && (
                            <Badge className="bg-pe/20 text-pe text-[10px]">
                              {bonus.peCost} PE
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Modificador manual */}
                <div className="p-3 rounded-lg bg-card/50 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Modificador do Mestre</span>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setManualAttackMod(m => m - 1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-display">
                        {manualAttackMod >= 0 ? `+${manualAttackMod}` : manualAttackMod}
                      </span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setManualAttackMod(m => m + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Resumo */}
                <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/30">
                  <div className="flex items-center justify-between text-sm">
                    <span>Bônus de Ataque Total</span>
                    <span className="font-display text-lg text-primary">
                      +{totalAttackBonus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span>Pool de dados</span>
                    <span>{attackAttribute}d20</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Margem de crítico</span>
                    <span>{criticalMargin}+</span>
                  </div>
                </div>

                {/* Custo de PE */}
                {totalPECost > 0 && (
                  <div className={cn(
                    "p-3 rounded-lg border",
                    canAffordPE 
                      ? "bg-pe/10 border-pe/30" 
                      : "bg-destructive/10 border-destructive/30"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Custo de PE</span>
                      <div className="text-right">
                        <span className={cn(
                          "font-display text-lg",
                          canAffordPE ? "text-pe" : "text-destructive"
                        )}>
                          {totalPECost}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          / {currentPE}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* === SEÇÃO ANIQUILADOR === */}
                
                {/* Indicador Máquina de Matar (NEX 99%) */}
                {maquinaDeMatarActive && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-amber-400">Máquina de Matar</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Margem de crítico -2 e +1 dado de dano (automático)
                    </p>
                  </div>
                )}
                
                {/* Botão Técnica Secreta (Aniquilador NEX 40%+) */}
                {canUseTechniqueSecreta && (
                  <div className="space-y-2">
                    <Button
                      variant={activeTechniqueEffects ? "default" : "outline"}
                      onClick={() => setShowTechniqueModal(true)}
                      className={cn(
                        "w-full h-12",
                        activeTechniqueEffects && "bg-amber-500 hover:bg-amber-600 text-white"
                      )}
                    >
                      <Crosshair className="w-4 h-4 mr-2" />
                      {activeTechniqueEffects 
                        ? `Técnica Ativa (${activeTechniqueEffects.peCost} PE)` 
                        : 'Usar Técnica Secreta'}
                    </Button>
                    
                    {/* Efeitos ativos da técnica */}
                    {activeTechniqueEffects && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {activeTechniqueEffects.additionalTargets > 0 && (
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <Target className="w-3 h-3" />
                              +{activeTechniqueEffects.additionalTargets} alvo
                            </Badge>
                          )}
                          {activeTechniqueEffects.criticalMultiplierBonus > 0 && (
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <Sword className="w-3 h-3" />
                              +{activeTechniqueEffects.criticalMultiplierBonus} mult.
                            </Badge>
                          )}
                          {activeTechniqueEffects.criticalMarginBonus > 0 && (
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <Crosshair className="w-3 h-3" />
                              +{activeTechniqueEffects.criticalMarginBonus} margem
                            </Badge>
                          )}
                          {activeTechniqueEffects.ignoreResistance > 0 && (
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <Shield className="w-3 h-3" />
                              Ignora {activeTechniqueEffects.ignoreResistance} RD
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Reembolsa PE
                            if (activeTechniqueEffects?.peCost) {
                              onPEChange(currentPE + activeTechniqueEffects.peCost);
                            }
                            setActiveTechniqueEffects(null);
                          }}
                          className="w-full h-8 text-xs text-muted-foreground"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancelar Técnica
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* FASE: Ataque */}
            {phase === 'attack' && attackResult && (
              <motion.div
                key="attack"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="py-6 text-center space-y-4"
              >
                {/* Dados */}
                <div className="flex flex-wrap justify-center gap-2">
                  {attackResult.dice.map((die, i) => (
                    <AnimatedDie
                      key={i}
                      value={die}
                      delay={i * 0.1}
                      isKept={die === attackResult.keptDice}
                      isCritical={attackResult.isCritical}
                    />
                  ))}
                </div>

                {/* Total */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  <div className={cn(
                    "font-display text-5xl font-bold",
                    attackResult.isCritical && "text-yellow-500"
                  )}>
                    {attackResult.total}
                  </div>
                  
                  {attackResult.isCritical && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center gap-2 mt-2"
                    >
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                      <span className="font-display text-yellow-500">CRÍTICO!</span>
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Breakdown */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
                  <span className="px-2 py-1 rounded bg-secondary/50">
                    d20: {attackResult.keptDice}
                  </span>
                  <span className="px-2 py-1 rounded bg-primary/20 text-primary">
                    {attackSkill.name}: +{attackSkill.bonus}
                  </span>
                  {totalAttackBonus - attackSkill.bonus > 0 && (
                    <span className="px-2 py-1 rounded bg-green-500/20 text-green-500">
                      Outros: +{totalAttackBonus - attackSkill.bonus}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* FASE: Dano */}
            {phase === 'damage' && damageResult && (
              <motion.div
                key="damage"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="py-6 text-center space-y-4"
              >
                {/* Dados de dano */}
                <div className="flex flex-wrap justify-center gap-2">
                  {damageResult.dice.map((die, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, y: -20 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ delay: i * 0.1, type: 'spring' }}
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg",
                        "bg-destructive/20 border-2 border-destructive text-destructive"
                      )}
                    >
                      {die}
                    </motion.div>
                  ))}
                  {damageResult.bonus > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: damageResult.dice.length * 0.1 }}
                      className="flex items-center gap-1"
                    >
                      <span className="text-muted-foreground">+</span>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg bg-muted border-2 border-border">
                        {damageResult.bonus}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Total de dano */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                >
                  <div className="font-display text-5xl font-bold text-destructive">
                    {damageResult.total}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dano {damageResult.isCritical ? 'Crítico' : 'Total'}
                  </p>
                </motion.div>

                {/* Tipo de dano */}
                {weapon.damageType && (
                  <Badge variant="outline" className="text-xs">
                    Dano de {weapon.damageType}
                  </Badge>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>

        <DrawerFooter className="pt-2">
          {/* Botões por fase */}
          {phase === 'setup' && (
            <Button
              onClick={rollAttack}
              disabled={!canAffordPE || isRolling}
              className="w-full h-12 font-display"
            >
              {isRolling ? (
                <>
                  <Dices className="w-5 h-5 mr-2 animate-spin" />
                  ROLANDO...
                </>
              ) : (
                <>
                  <Target className="w-5 h-5 mr-2" />
                  ROLAR ATAQUE
                </>
              )}
            </Button>
          )}

          {phase === 'attack' && attackResult && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPhase('setup')}
                className="flex-1 h-12 font-display"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                ROLAR DE NOVO
              </Button>
              <Button
                onClick={rollDamageAction}
                disabled={isRolling}
                className="flex-1 h-12 font-display bg-destructive hover:bg-destructive/90"
              >
                {isRolling ? (
                  <>
                    <Dices className="w-5 h-5 mr-2 animate-spin" />
                    ROLANDO...
                  </>
                ) : (
                  <>
                    <Sword className="w-5 h-5 mr-2" />
                    ROLAR DANO
                  </>
                )}
              </Button>
            </div>
          )}

          {phase === 'damage' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPhase('setup');
                  setAttackResult(null);
                  setDamageResult(null);
                }}
                className="flex-1 h-12 font-display"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                NOVO ATAQUE
              </Button>
              <Button
                onClick={handleClose}
                className="flex-1 h-12 font-display"
              >
                <Check className="w-5 h-5 mr-2" />
                CONCLUIR
              </Button>
            </div>
          )}

          {/* Botão de fechar em todas as fases */}
          <Button variant="ghost" onClick={handleClose} className="font-display">
            <X className="w-4 h-4 mr-2" />
            FECHAR
          </Button>
        </DrawerFooter>
      </DrawerContent>
      
      {/* Modal de Técnicas do Aniquilador */}
      <AniquiladorTechniqueModal
        open={showTechniqueModal}
        onClose={() => setShowTechniqueModal(false)}
        onConfirm={handleConfirmTechnique}
        nex={nex}
        currentPE={currentPE}
        weaponName={weapon?.name || ''}
      />
    </Drawer>
  );
}
