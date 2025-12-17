/**
 * CombatRollModal - Modal de combate com rolagem de ataque e dano
 * Permite selecionar bônus de classe, poderes paranormais e rituais
 * Detecta crítico dinamicamente baseado na arma e poderes ativos
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Target, Zap, Sparkles, Flame, X, Dices, Shield, Skull, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { rollSkillTest, rollDamage, DiceRollResult } from '@/lib/dice-roller';
import { useRitualBonusesForCombat, useRitualCombatBonuses, SustainedRitualInput } from '@/hooks/useRitualCombatBonuses';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Interface para arma (mesma do CombatWeaponsTable)
interface WeaponEntry {
  id: string;
  name: string;
  type: 'Briga' | 'Arremesso' | 'Disparo' | 'Corpo a Corpo';
  damage: string;
  damageType?: string;
  ammoCurrenteRent?: number;
  ammoMax?: number;
  range?: string;
  critical?: string;
  criticalMultiplier?: string;
  special?: string;
  notes?: string;
  ammoType?: string;
}

// Interface para bônus selecionável
interface CombatBonus {
  id: string;
  name: string;
  source: 'class' | 'paranormal' | 'ritual' | 'general';
  attackBonus?: number;
  damageBonus?: number | string; // Pode ser número ou dado extra (ex: "1d6")
  criticalBonus?: number; // Reduz margem de crítico
  peCost?: number;
  description: string;
  isPassive?: boolean; // Se true, sempre ativo
  requiresAffinity?: boolean;
  affinityElement?: string;
}

// Props do modal
interface CombatRollModalProps {
  open: boolean;
  onClose: () => void;
  weapon: WeaponEntry | null;
  
  // Atributos do personagem
  attributes: {
    agility: number;
    strength: number;
    presence: number;
    intellect: number;
    vigor: number;
  };
  skills: Record<string, number>;
  
  // Recursos
  currentPE: number;
  maxPE: number;
  onPEChange: (newPE: number) => void;
  
  // Dados de classe e poderes
  characterClass: string;
  abilities: string[];
  paranormalPowers: Array<{ id: string; name: string; element: string }>;
  hasAffinity: boolean;
  affinityElement?: string | null;
  sustainedRituals?: SustainedRitualInput[]; // Agora usa rituais sustentados
  nex: number;
  
  // Callback
  onRollComplete?: (result: DiceRollResult) => void;
}

// Fases do combate
type CombatPhase = 'setup' | 'attack' | 'damage' | 'complete';

// Função para parsear string de dano (ex: "2d6+3")
function parseDamageString(damage: string): { count: number; size: number; bonus: number } {
  const match = damage.match(/(\d+)d(\d+)([+-]\d+)?/i);
  if (!match) return { count: 1, size: 6, bonus: 0 };
  return {
    count: parseInt(match[1]) || 1,
    size: parseInt(match[2]) || 6,
    bonus: match[3] ? parseInt(match[3]) : 0,
  };
}

// Componente de dado animado
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
        "w-12 h-12 rounded-lg flex items-center justify-center font-display text-xl font-bold shadow-lg",
        isKept && isCritical && "bg-gradient-to-br from-amber-500 to-orange-600 text-white ring-2 ring-amber-300",
        isKept && !isCritical && "bg-primary text-primary-foreground ring-2 ring-primary/50",
        !isKept && "bg-muted text-muted-foreground opacity-50"
      )}
    >
      {value}
    </motion.div>
  );
}

export function CombatRollModal({
  open,
  onClose,
  weapon,
  attributes,
  skills,
  currentPE,
  maxPE,
  onPEChange,
  characterClass,
  abilities,
  paranormalPowers,
  hasAffinity,
  affinityElement,
  sustainedRituals = [],
  nex,
  onRollComplete,
}: CombatRollModalProps) {
  // Bônus de rituais sustentados processados automaticamente
  const ritualBonuses = useRitualBonusesForCombat(sustainedRituals);
  const ritualCombatSummary = useRitualCombatBonuses(sustainedRituals);
  // Estados do modal
  const [phase, setPhase] = useState<CombatPhase>('setup');
  const [selectedBonuses, setSelectedBonuses] = useState<string[]>([]);
  const [attackResult, setAttackResult] = useState<DiceRollResult | null>(null);
  const [damageResult, setDamageResult] = useState<{
    dice: number[];
    bonus: number;
    total: number;
    damageType?: string;
    isCritical: boolean;
    extraDice?: number[];
  } | null>(null);

  // Reset ao abrir/fechar
  const handleClose = () => {
    setPhase('setup');
    setSelectedBonuses([]);
    setAttackResult(null);
    setDamageResult(null);
    onClose();
  };

  // Determinar atributo e perícia baseado no tipo de arma
  const attackAttribute = useMemo(() => {
    if (!weapon) return 0;
    // Disparo usa Agilidade, Corpo a Corpo usa Força
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
    // Bônus de perícia: 5 se treinado, +5 por grau (veterano, expert)
    const bonus = skillValue > 0 ? skillValue : 0;
    return { name: skillName === 'pontaria' ? 'Pontaria' : 'Luta', bonus };
  }, [weapon, skills]);

  // Calcular bônus disponíveis baseado nas habilidades do personagem
  const availableBonuses = useMemo((): CombatBonus[] => {
    const bonuses: CombatBonus[] = [];

    // === BÔNUS DE CLASSE ===
    
    // Ataque Especial (Combatente)
    if (abilities.some(a => a.toLowerCase().includes('ataque especial'))) {
      bonuses.push({
        id: 'ataque-especial-ataque',
        name: 'Ataque Especial (+5 ataque)',
        source: 'class',
        attackBonus: 5,
        peCost: 2,
        description: 'Gasta 2 PE para +5 no teste de ataque',
      });
      bonuses.push({
        id: 'ataque-especial-dano',
        name: 'Ataque Especial (+5 dano)',
        source: 'class',
        damageBonus: 5,
        peCost: 2,
        description: 'Gasta 2 PE para +5 no dano',
      });
    }

    // Golpe Pesado (Combatente - Trilha Operações Especiais ou poder)
    if (abilities.some(a => a.toLowerCase().includes('golpe pesado'))) {
      bonuses.push({
        id: 'golpe-pesado',
        name: 'Golpe Pesado (+1 dado)',
        source: 'class',
        damageBonus: '1d', // Adiciona 1 dado extra
        peCost: 1,
        description: 'Gasta 1 PE para +1 dado de dano',
      });
    }

    // Tiro Certeiro (Especialista)
    if (abilities.some(a => a.toLowerCase().includes('tiro certeiro')) && 
        (weapon?.type === 'Disparo' || weapon?.type === 'Arremesso')) {
      bonuses.push({
        id: 'tiro-certeiro',
        name: `Tiro Certeiro (+${attributes.agility} dano)`,
        source: 'class',
        damageBonus: attributes.agility,
        isPassive: true,
        description: 'Soma Agilidade no dano de ataques à distância',
      });
    }

    // === PODERES PARANORMAIS ===
    
    // Golpe de Sorte (reduz margem de crítico)
    const hasGolpeDeSorte = paranormalPowers.some(p => p.id === 'golpe-de-sorte');
    if (hasGolpeDeSorte) {
      const critBonus = hasAffinity && affinityElement === 'energia' ? 2 : 1;
      bonuses.push({
        id: 'golpe-de-sorte',
        name: `Golpe de Sorte (-${critBonus} crítico)`,
        source: 'paranormal',
        criticalBonus: critBonus,
        isPassive: true,
        description: `Reduz margem de crítico em ${critBonus}`,
        requiresAffinity: critBonus === 2,
        affinityElement: 'energia',
      });
    }

    // Mãos Flamejantes (dano extra de fogo)
    const hasMaosFlamejantes = paranormalPowers.some(p => 
      p.id === 'maos-flamejantes' || p.name.toLowerCase().includes('mãos flamejantes')
    );
    if (hasMaosFlamejantes && weapon?.type !== 'Disparo') {
      const extraDamage = hasAffinity && affinityElement === 'energia' ? '2d6' : '1d6';
      bonuses.push({
        id: 'maos-flamejantes',
        name: `Mãos Flamejantes (+${extraDamage} fogo)`,
        source: 'paranormal',
        damageBonus: extraDamage,
        peCost: 1,
        description: 'Adiciona dano de fogo ao ataque corpo a corpo',
      });
    }

    // === BÔNUS DE RITUAIS SUSTENTADOS (processados pelo hook) ===
    // Os bônus de rituais como Frenesi, Velocidade, Forma Monstruosa, etc.
    // são processados automaticamente pelo hook useRitualBonusesForCombat
    ritualBonuses.forEach(ritual => {
      bonuses.push({
        id: ritual.id,
        name: ritual.name,
        source: ritual.source,
        attackBonus: ritual.attackBonus,
        damageBonus: ritual.damageBonus,
        isPassive: ritual.isPassive,
        description: ritual.description,
      });
    });

    return bonuses;
  }, [abilities, paranormalPowers, hasAffinity, affinityElement, weapon, attributes, ritualBonuses]);

  // Bônus passivos (sempre ativos)
  const passiveBonuses = useMemo(() => 
    availableBonuses.filter(b => b.isPassive),
    [availableBonuses]
  );

  // Bônus selecionáveis
  const selectableBonuses = useMemo(() => 
    availableBonuses.filter(b => !b.isPassive),
    [availableBonuses]
  );

  // Toggle de bônus
  const toggleBonus = (bonusId: string) => {
    setSelectedBonuses(prev => 
      prev.includes(bonusId) 
        ? prev.filter(id => id !== bonusId)
        : [...prev, bonusId]
    );
  };

  // Calcular custo total de PE
  const totalPECost = useMemo(() => {
    return selectedBonuses.reduce((total, bonusId) => {
      const bonus = availableBonuses.find(b => b.id === bonusId);
      return total + (bonus?.peCost || 0);
    }, 0);
  }, [selectedBonuses, availableBonuses]);

  // Verificar se pode pagar o PE
  const canAffordPE = currentPE >= totalPECost;

  // Calcular bônus total de ataque
  const totalAttackBonus = useMemo(() => {
    let total = attackSkill.bonus;
    
    // Adicionar bônus passivos
    passiveBonuses.forEach(b => {
      if (b.attackBonus) total += b.attackBonus;
    });
    
    // Adicionar bônus selecionados
    selectedBonuses.forEach(bonusId => {
      const bonus = availableBonuses.find(b => b.id === bonusId);
      if (bonus?.attackBonus) total += bonus.attackBonus;
    });
    
    return total;
  }, [attackSkill.bonus, passiveBonuses, selectedBonuses, availableBonuses]);

  // Calcular margem de crítico efetiva
  const effectiveCritical = useMemo(() => {
    if (!weapon) return 20;
    let critical = parseInt(weapon.critical || '20');
    
    // Reduzir margem com bônus de crítico (passivos)
    passiveBonuses.forEach(b => {
      if (b.criticalBonus) critical -= b.criticalBonus;
    });
    
    return Math.max(1, critical); // Mínimo de 1
  }, [weapon, passiveBonuses]);

  // Multiplicador de crítico da arma
  const criticalMultiplier = useMemo(() => {
    if (!weapon?.criticalMultiplier) return 2;
    const match = weapon.criticalMultiplier.match(/x(\d+)/i);
    return match ? parseInt(match[1]) : 2;
  }, [weapon]);

  // === HANDLERS DE ROLAGEM ===

  // Rolar ataque
  const handleRollAttack = () => {
    if (!weapon || !canAffordPE) return;

    // Deduzir PE
    if (totalPECost > 0) {
      onPEChange(currentPE - totalPECost);
    }

    // Rolar ataque
    const result = rollSkillTest({
      attributeValue: attackAttribute,
      skillBonus: totalAttackBonus,
      otherBonuses: 0,
      label: `Ataque: ${weapon.name}`,
      criticalThreshold: effectiveCritical,
    });

    setAttackResult(result);
    setPhase('attack');
    onRollComplete?.(result);
  };

  // Rolar dano
  const handleRollDamage = () => {
    if (!weapon || !attackResult) return;

    const parsed = parseDamageString(weapon.damage);
    const isCritical = attackResult.isCritical;
    
    // Calcular dados base (multiplicados se crítico)
    let diceCount = isCritical ? parsed.count * criticalMultiplier : parsed.count;
    
    // Bônus de dano numérico
    let damageBonus = parsed.bonus;
    
    // Dados extras (de poderes como Golpe Pesado)
    let extraDiceCount = 0;
    let extraDiceSize = parsed.size;
    
    // Aplicar bônus passivos
    passiveBonuses.forEach(b => {
      if (typeof b.damageBonus === 'number') {
        damageBonus += b.damageBonus;
      } else if (typeof b.damageBonus === 'string') {
        const extraMatch = b.damageBonus.match(/(\d*)d(\d+)?/i);
        if (extraMatch) {
          const count = parseInt(extraMatch[1]) || 1;
          extraDiceCount += isCritical ? count * criticalMultiplier : count;
          if (extraMatch[2]) extraDiceSize = parseInt(extraMatch[2]);
        }
      }
    });
    
    // Aplicar bônus selecionados
    selectedBonuses.forEach(bonusId => {
      const bonus = availableBonuses.find(b => b.id === bonusId);
      if (!bonus) return;
      
      if (typeof bonus.damageBonus === 'number') {
        damageBonus += bonus.damageBonus;
      } else if (typeof bonus.damageBonus === 'string') {
        // Pode ser "1d" (adiciona dado do mesmo tipo) ou "1d6" (dado específico)
        if (bonus.damageBonus === '1d') {
          diceCount += isCritical ? criticalMultiplier : 1;
        } else {
          const extraMatch = bonus.damageBonus.match(/(\d*)d(\d+)/i);
          if (extraMatch) {
            const count = parseInt(extraMatch[1]) || 1;
            extraDiceCount += isCritical ? count * criticalMultiplier : count;
            extraDiceSize = parseInt(extraMatch[2]);
          }
        }
      }
    });
    
    // Bônus de FOR para corpo a corpo
    if (weapon.type === 'Corpo a Corpo' || weapon.type === 'Briga') {
      damageBonus += attributes.strength;
    }

    // Rolar dados principais
    const mainDice: number[] = [];
    for (let i = 0; i < diceCount; i++) {
      mainDice.push(Math.floor(Math.random() * parsed.size) + 1);
    }
    
    // Rolar dados extras
    const extraDice: number[] = [];
    for (let i = 0; i < extraDiceCount; i++) {
      extraDice.push(Math.floor(Math.random() * extraDiceSize) + 1);
    }
    
    const diceTotal = mainDice.reduce((a, b) => a + b, 0) + extraDice.reduce((a, b) => a + b, 0);
    const total = diceTotal + damageBonus;

    setDamageResult({
      dice: mainDice,
      extraDice: extraDice.length > 0 ? extraDice : undefined,
      bonus: damageBonus,
      total: Math.max(1, total), // Dano mínimo 1
      damageType: weapon.damageType,
      isCritical,
    });
    setPhase('damage');
  };

  if (!weapon) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-primary">
            {weapon.type === 'Disparo' ? (
              <Target className="w-5 h-5" />
            ) : (
              <Sword className="w-5 h-5" />
            )}
            {weapon.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info da arma */}
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline">{weapon.type}</Badge>
            <Badge variant="destructive">{weapon.damage} {weapon.damageType}</Badge>
            <Badge variant="secondary">
              Crítico: {effectiveCritical}+ {weapon.criticalMultiplier || 'x2'}
            </Badge>
          </div>

          <Separator />

          {/* Fase: Setup - Seleção de bônus */}
          <AnimatePresence mode="wait">
            {phase === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Base de ataque */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Base de Ataque
                  </p>
                  <p className="text-sm">
                    {weapon.type === 'Disparo' ? 'AGI' : 'FOR'} {attackAttribute} + {attackSkill.name} +{attackSkill.bonus}
                    {totalAttackBonus > attackSkill.bonus && (
                      <span className="text-primary ml-1">
                        + {totalAttackBonus - attackSkill.bonus} (bônus)
                      </span>
                    )}
                  </p>
                </div>

                {/* Bônus passivos */}
                {passiveBonuses.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Bônus Ativos (passivos)
                    </p>
                    {passiveBonuses.map(bonus => (
                      <div 
                        key={bonus.id}
                        className="flex items-center gap-2 p-2 rounded bg-primary/10 border border-primary/20"
                      >
                        <Zap className="w-4 h-4 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{bonus.name}</p>
                          <p className="text-xs text-muted-foreground">{bonus.description}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {bonus.source}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bônus selecionáveis */}
                {selectableBonuses.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Modificadores Disponíveis
                    </p>
                    {selectableBonuses.map(bonus => (
                      <label
                        key={bonus.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded border cursor-pointer transition-colors",
                          selectedBonuses.includes(bonus.id)
                            ? "bg-primary/10 border-primary"
                            : "bg-muted/30 border-border hover:border-primary/50"
                        )}
                      >
                        <Checkbox
                          checked={selectedBonuses.includes(bonus.id)}
                          onCheckedChange={() => toggleBonus(bonus.id)}
                          disabled={!selectedBonuses.includes(bonus.id) && bonus.peCost && currentPE < bonus.peCost}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{bonus.name}</p>
                          <p className="text-xs text-muted-foreground">{bonus.description}</p>
                        </div>
                        {bonus.peCost && (
                          <Badge variant="secondary" className="text-[10px]">
                            {bonus.peCost} PE
                          </Badge>
                        )}
                      </label>
                    ))}
                  </div>
                )}

                {/* Custo de PE */}
                {totalPECost > 0 && (
                  <div className={cn(
                    "p-2 rounded text-sm text-center",
                    canAffordPE ? "bg-blue-500/10 text-blue-400" : "bg-destructive/10 text-destructive"
                  )}>
                    Custo: {totalPECost} PE (você tem {currentPE}/{maxPE})
                  </div>
                )}

                {/* Botão de rolar */}
                <Button
                  className="w-full font-display"
                  size="lg"
                  onClick={handleRollAttack}
                  disabled={!canAffordPE}
                >
                  <Dices className="w-5 h-5 mr-2" />
                  ROLAR ATAQUE
                </Button>
              </motion.div>
            )}

            {/* Fase: Ataque - Resultado do ataque */}
            {phase === 'attack' && attackResult && (
              <motion.div
                key="attack"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Pool de dados */}
                <div className="flex flex-wrap justify-center gap-2">
                  {attackResult.dice.map((die, i) => (
                    <AnimatedDie
                      key={i}
                      value={die}
                      delay={i * 0.1}
                      isKept={die === attackResult.keptDice}
                      isCritical={die >= effectiveCritical}
                    />
                  ))}
                </div>

                {/* Resultado */}
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    d20: <span className="font-bold text-foreground">{attackResult.keptDice}</span>
                    {attackResult.skillBonus > 0 && ` + ${attackResult.skillBonus}`}
                    {attackResult.otherBonuses > 0 && ` + ${attackResult.otherBonuses}`}
                  </p>
                  
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.3 }}
                    className="text-4xl font-display font-bold text-primary"
                  >
                    {attackResult.total}
                  </motion.div>

                  {/* Crítico! */}
                  {attackResult.isCritical && (
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', delay: 0.5 }}
                      className="flex items-center justify-center gap-2 text-amber-500"
                    >
                      <Zap className="w-6 h-6" />
                      <span className="text-xl font-display font-bold tracking-wider">
                        CRÍTICO!
                      </span>
                      <Zap className="w-6 h-6" />
                    </motion.div>
                  )}

                  {attackResult.isDisadvantage && (
                    <p className="text-xs text-destructive">
                      (Desvantagem - atributo 0)
                    </p>
                  )}
                </div>

                <Separator />

                {/* Botão de rolar dano */}
                <Button
                  className={cn(
                    "w-full font-display",
                    attackResult.isCritical && "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  )}
                  size="lg"
                  onClick={handleRollDamage}
                >
                  <Skull className="w-5 h-5 mr-2" />
                  ROLAR DANO {attackResult.isCritical && `(${weapon.criticalMultiplier || 'x2'})`}
                </Button>
              </motion.div>
            )}

            {/* Fase: Dano - Resultado do dano */}
            {phase === 'damage' && damageResult && (
              <motion.div
                key="damage"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Resultado do ataque (resumo) */}
                <div className="p-2 rounded bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">
                    Ataque: <span className="font-bold text-foreground">{attackResult?.total}</span>
                    {attackResult?.isCritical && (
                      <Badge variant="default" className="ml-2 bg-amber-500">CRÍTICO</Badge>
                    )}
                  </p>
                </div>

                {/* Dados de dano */}
                <div className="flex flex-wrap justify-center gap-2">
                  {damageResult.dice.map((die, i) => (
                    <motion.div
                      key={`main-${i}`}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: i * 0.08, type: 'spring' }}
                      className={cn(
                        "w-10 h-10 rounded flex items-center justify-center font-display text-lg font-bold",
                        damageResult.isCritical 
                          ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white" 
                          : "bg-destructive text-destructive-foreground"
                      )}
                    >
                      {die}
                    </motion.div>
                  ))}
                  {damageResult.extraDice?.map((die, i) => (
                    <motion.div
                      key={`extra-${i}`}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: (damageResult.dice.length + i) * 0.08, type: 'spring' }}
                      className="w-10 h-10 rounded flex items-center justify-center font-display text-lg font-bold bg-paranormal text-white"
                    >
                      {die}
                    </motion.div>
                  ))}
                </div>

                {/* Total de dano */}
                <div className="text-center space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {damageResult.dice.join(' + ')}
                    {damageResult.extraDice && ` + ${damageResult.extraDice.join(' + ')}`}
                    {damageResult.bonus !== 0 && ` ${damageResult.bonus >= 0 ? '+' : ''}${damageResult.bonus}`}
                  </p>
                  
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.4 }}
                    className={cn(
                      "text-5xl font-display font-bold",
                      damageResult.isCritical ? "text-amber-500" : "text-destructive"
                    )}
                  >
                    {damageResult.total}
                  </motion.div>
                  
                  <p className="text-sm text-muted-foreground">
                    pontos de dano{' '}
                    {damageResult.damageType && (
                      <Badge variant="outline">{damageResult.damageType}</Badge>
                    )}
                  </p>
                </div>

                <Separator />

                {/* Botão de fechar */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setPhase('setup');
                      setAttackResult(null);
                      setDamageResult(null);
                    }}
                  >
                    Novo Ataque
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleClose}
                  >
                    Fechar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
