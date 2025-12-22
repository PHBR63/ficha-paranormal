/**
 * CombatRollModal - Modal de combate com rolagem de ataque e dano
 * Permite selecionar bônus de classe, poderes paranormais e rituais
 * Detecta crítico dinamicamente baseado na arma e poderes ativos
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Target, Zap, Sparkles, Flame, X, Dices, Shield, Skull, Info, Plus, Minus, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { rollSkillTest, rollDamage, DiceRollResult } from '@/lib/dice-roller';
import { getSkillBonus } from '@/lib/character-data';
import { useRitualBonusesForCombat, useRitualCombatBonuses, SustainedRitualInput } from '@/hooks/useRitualCombatBonuses';
import { WeaponBuff } from '@/hooks/useWeaponBuffs';
import { formatDamageFormula } from '@/lib/rituals/legacy-exports';
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

// Interface para bônus condicionais avançados (Fase 4)
interface AdvancedConditionalBonuses {
  assassinar?: boolean;     // Dobra dados do Ataque Furtivo
  potenciaMaxima?: boolean; // Dobra bônus do Ataque Especial corpo a corpo
  atirarParaMatar?: boolean; // Dano máximo em crítico com arma de fogo
  ataqueFurtivo?: boolean;  // Ataque Furtivo básico
}

// Interface de bônus de poderes de classe pré-calculados
interface ClassPowerCombatBonuses {
  attackBonus: number;
  damageBonus: number;
  criticalMarginBonus: number;
  extraDamageDice: string[];
}

// Interface para fonte de bônus detalhada (exibição)
interface BonusSourceDisplay {
  label: string;
  value: number | string;
  type: 'skill' | 'power' | 'ritual' | 'track' | 'attribute' | 'paranormal' | 'other';
  description?: string; // Descrição detalhada da fonte
  sourceName?: string;  // Nome específico do poder/ritual que concede o bônus
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
  
  // NOVO: Bônus pré-calculados do sistema unificado de poderes de classe
  classPowerBonuses?: ClassPowerCombatBonuses;
  
  // Bônus condicionais avançados (Fase 4)
  advancedBonuses?: AdvancedConditionalBonuses;
  
  // Buffs de arma ativos (Amaldiçoar Arma, etc.)
  weaponBuffs?: WeaponBuff[];
  
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
  classPowerBonuses, // NOVO: Bônus pré-calculados do sistema unificado
  advancedBonuses = {},
  weaponBuffs = [], // Buffs de arma ativos
  onRollComplete,
}: CombatRollModalProps) {
  // Bônus de rituais sustentados processados automaticamente
  const ritualBonuses = useRitualBonusesForCombat(sustainedRituals);
  const ritualCombatSummary = useRitualCombatBonuses(sustainedRituals);
  
  // === PROCESSAR WEAPON BUFFS (Amaldiçoar Arma, etc.) ===
  // REGRA OFICIAL: Rituais NÃO acumulam entre si - usa o MAIOR de cada tipo
  const weaponBuffBonuses = useMemo(() => {
    if (weaponBuffs.length === 0) {
      return {
        attackBonus: 0,
        criticalBonus: 0,
        criticalMultiplierBonus: 0,
        bonusDamage: null as { diceCount: number; diceType: number; damageType?: string } | null,
        summary: [] as string[],
      };
    }
    
    // Coleta todos os valores de cada tipo
    const attackBonuses = weaponBuffs.map(b => b.attackBonus || 0);
    const criticalBonuses = weaponBuffs.map(b => b.criticalBonus || 0);
    const criticalMultiplierBonuses = weaponBuffs.map(b => b.criticalMultiplierBonus || 0);
    
    // Usa o MAIOR de cada tipo (rituais não acumulam)
    const totalAttackBonus = attackBonuses.length > 0 ? Math.max(...attackBonuses) : 0;
    const totalCriticalBonus = criticalBonuses.length > 0 ? Math.max(...criticalBonuses) : 0;
    const totalCriticalMultiplierBonus = criticalMultiplierBonuses.length > 0 ? Math.max(...criticalMultiplierBonuses) : 0;
    
    // Dano extra: usa apenas o maior dado
    const allBonusDamage = weaponBuffs
      .filter(b => b.bonusDamage)
      .map(b => ({ ...b.bonusDamage!, element: b.element }));
    
    // Ordena por "potência" e pega apenas o maior
    const sortedDamage = allBonusDamage.sort((a, b) => {
      const powerA = (a.diceCount || 1) * (a.diceType || 0);
      const powerB = (b.diceCount || 1) * (b.diceType || 0);
      return powerB - powerA;
    });
    
    const bestDamage = sortedDamage.length > 0 ? sortedDamage[0] : null;
    
    // Resumo para exibição
    const summary = weaponBuffs.map(b => b.ritualName);
    
    return {
      attackBonus: totalAttackBonus,
      criticalBonus: totalCriticalBonus,
      criticalMultiplierBonus: totalCriticalMultiplierBonus,
      bonusDamage: bestDamage,
      summary,
    };
  }, [weaponBuffs]);
  
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
  
  // Estados dos modificadores manuais (bônus do mestre)
  const [manualAttackMod, setManualAttackMod] = useState(0);
  const [manualDamageMod, setManualDamageMod] = useState(0);
  const [targetDefense, setTargetDefense] = useState<number | null>(null);

  // Reset ao abrir/fechar
  const handleClose = () => {
    setPhase('setup');
    setSelectedBonuses([]);
    setAttackResult(null);
    setDamageResult(null);
    setManualAttackMod(0);
    setManualDamageMod(0);
    setTargetDefense(null);
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
    if (!weapon) return { name: '', bonus: 0, training: 0 };
    const skillName = weapon.type === 'Disparo' || weapon.type === 'Arremesso' 
      ? 'pontaria' 
      : 'luta';
    const skillValue = skills[skillName] || 0;
    // Usar função centralizada para converter grau em bônus
    const bonus = getSkillBonus(skillValue);
    return { 
      name: skillName === 'pontaria' ? 'Pontaria' : 'Luta', 
      bonus,
      training: skillValue 
    };
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

  // Calcular bônus total de ataque (inclui bônus do sistema unificado, weapon buffs e modificador manual)
  const totalAttackBonus = useMemo(() => {
    let total = attackSkill.bonus;
    
    // Adicionar bônus passivos de poderes de classe do sistema unificado
    if (classPowerBonuses?.attackBonus) {
      total += classPowerBonuses.attackBonus;
    }
    
    // Adicionar bônus de weapon buffs (Amaldiçoar Arma, etc.)
    if (weaponBuffBonuses.attackBonus) {
      total += weaponBuffBonuses.attackBonus;
    }
    
    // Adicionar bônus passivos (rituais sustentados, etc.)
    passiveBonuses.forEach(b => {
      if (b.attackBonus) total += b.attackBonus;
    });
    
    // Adicionar bônus selecionados
    selectedBonuses.forEach(bonusId => {
      const bonus = availableBonuses.find(b => b.id === bonusId);
      if (bonus?.attackBonus) total += bonus.attackBonus;
    });
    
    // Adicionar modificador manual do mestre
    total += manualAttackMod;
    
    return total;
  }, [attackSkill.bonus, passiveBonuses, selectedBonuses, availableBonuses, classPowerBonuses, manualAttackMod, weaponBuffBonuses]);

  // === Detalhamento das fontes de bônus de ataque para exibição ===
  const attackBonusSources = useMemo(() => {
    const sources: BonusSourceDisplay[] = [];
    
    // Bônus de perícia (treinamento)
    if (attackSkill.bonus > 0) {
      sources.push({ 
        label: attackSkill.name, 
        value: attackSkill.bonus, 
        type: 'skill',
        description: `Treinamento na perícia ${attackSkill.name}`,
      });
    }
    
    // Bônus de poderes de classe
    if (classPowerBonuses?.attackBonus && classPowerBonuses.attackBonus > 0) {
      sources.push({ 
        label: 'Poder de Classe', 
        value: classPowerBonuses.attackBonus, 
        type: 'power',
        description: 'Bônus de ataque de poderes de classe ativos (ex: Ataque Especial, Golpe Brutal)',
      });
    }
    
    // Bônus passivos de rituais sustentados
    passiveBonuses.forEach(b => {
      if (b.attackBonus) {
        sources.push({ 
          label: b.name, 
          value: b.attackBonus, 
          type: 'ritual',
          sourceName: b.name,
          description: b.description,
        });
      }
    });
    
    // Bônus de weapon buffs (Amaldiçoar Arma, etc.)
    if (weaponBuffBonuses.attackBonus > 0) {
      const buffNames = weaponBuffBonuses.summary.join(', ');
      sources.push({
        label: 'Buff de Arma',
        value: weaponBuffBonuses.attackBonus,
        type: 'ritual',
        sourceName: buffNames,
        description: `Bônus de ataque de ${buffNames}`,
      });
    }
    
    // Bônus selecionados
    selectedBonuses.forEach(bonusId => {
      const bonus = availableBonuses.find(b => b.id === bonusId);
      if (bonus?.attackBonus) {
        const type = bonus.source === 'paranormal' ? 'paranormal' : bonus.source === 'ritual' ? 'ritual' : 'other';
        sources.push({ 
          label: bonus.name, 
          value: bonus.attackBonus, 
          type,
          sourceName: bonus.name,
          description: bonus.description,
        });
      }
    });
    
    // Modificador manual do mestre
    if (manualAttackMod !== 0) {
      sources.push({
        label: 'Modificador do Mestre',
        value: manualAttackMod,
        type: 'other',
        description: 'Bônus ou penalidade situacional definido pelo mestre (cobertura, terreno, etc.)',
      });
    }
    
    return sources;
  }, [attackSkill, classPowerBonuses, passiveBonuses, selectedBonuses, availableBonuses, manualAttackMod, weaponBuffBonuses]);

  // === Detalhamento das fontes de bônus de dano para exibição ===
  const damageBonusSources = useMemo(() => {
    const sources: BonusSourceDisplay[] = [];
    const isMelee = weapon?.type === 'Corpo a Corpo' || weapon?.type === 'Briga';
    
    // Bônus de Força para corpo a corpo
    if (isMelee && attributes.strength !== 0) {
      sources.push({ 
        label: 'Força', 
        value: attributes.strength, 
        type: 'attribute',
        description: 'Modificador de Força adicionado ao dano de ataques corpo a corpo',
      });
    }
    
    // Bônus de poderes de classe
    if (classPowerBonuses?.damageBonus && classPowerBonuses.damageBonus > 0) {
      sources.push({ 
        label: 'Poder de Classe', 
        value: classPowerBonuses.damageBonus, 
        type: 'power',
        description: 'Bônus de dano de poderes de classe ativos (ex: Ataque Especial, Golpe Pesado)',
      });
    }
    
    // Dados extras de poderes de classe
    if (classPowerBonuses?.extraDamageDice && classPowerBonuses.extraDamageDice.length > 0) {
      sources.push({ 
        label: 'Dados Extras', 
        value: classPowerBonuses.extraDamageDice.join(' + '), 
        type: 'power',
        description: 'Dados de dano extras de poderes de classe (ex: Golpe Pesado)',
      });
    }
    
    // Bônus passivos de rituais sustentados
    passiveBonuses.forEach(b => {
      if (b.damageBonus) {
        const value = typeof b.damageBonus === 'number' ? b.damageBonus : b.damageBonus;
        sources.push({ 
          label: b.name, 
          value, 
          type: 'ritual',
          sourceName: b.name,
          description: b.description,
        });
      }
    });
    
    // Dano extra de weapon buffs (Amaldiçoar Arma, etc.)
    if (weaponBuffBonuses.bonusDamage) {
      const buffNames = weaponBuffBonuses.summary.join(', ');
      const damageStr = `${weaponBuffBonuses.bonusDamage.diceCount}d${weaponBuffBonuses.bonusDamage.diceType}`;
      sources.push({
        label: 'Buff de Arma',
        value: `+${damageStr}`,
        type: 'ritual',
        sourceName: buffNames,
        description: `Dano extra de ${buffNames} (${weaponBuffBonuses.bonusDamage.damageType || 'elemental'})`,
      });
    }
    
    // Bônus selecionados
    selectedBonuses.forEach(bonusId => {
      const bonus = availableBonuses.find(b => b.id === bonusId);
      if (bonus?.damageBonus) {
        const value = typeof bonus.damageBonus === 'number' ? bonus.damageBonus : bonus.damageBonus;
        const type = bonus.source === 'paranormal' ? 'paranormal' : bonus.source === 'ritual' ? 'ritual' : 'other';
        sources.push({ 
          label: bonus.name, 
          value, 
          type,
          sourceName: bonus.name,
          description: bonus.description,
        });
      }
    });
    
    // Modificador manual de dano do mestre
    if (manualDamageMod !== 0) {
      sources.push({
        label: 'Modificador do Mestre',
        value: manualDamageMod,
        type: 'other',
        description: 'Bônus ou penalidade de dano situacional definido pelo mestre',
      });
    }
    
    return sources;
  }, [weapon, attributes, classPowerBonuses, passiveBonuses, selectedBonuses, availableBonuses, manualDamageMod, weaponBuffBonuses]);

  // Calcular margem de crítico efetiva (incluindo weapon buffs)
  const effectiveCritical = useMemo(() => {
    if (!weapon) return 20;
    let critical = parseInt(weapon.critical || '20');
    
    // Aplicar bônus de margem de crítico do sistema unificado de poderes de classe
    if (classPowerBonuses?.criticalMarginBonus) {
      critical -= classPowerBonuses.criticalMarginBonus;
    }
    
    // Aplicar bônus de weapon buffs (Amaldiçoar Arma, etc.)
    if (weaponBuffBonuses.criticalBonus) {
      critical -= weaponBuffBonuses.criticalBonus;
    }
    
    // Reduzir margem com bônus de crítico (passivos de rituais sustentados, etc.)
    passiveBonuses.forEach(b => {
      if (b.criticalBonus) critical -= b.criticalBonus;
    });
    
    return Math.max(1, critical); // Mínimo de 1
  }, [weapon, passiveBonuses, classPowerBonuses, weaponBuffBonuses]);

  // Multiplicador de crítico da arma (incluindo weapon buffs)
  const criticalMultiplier = useMemo(() => {
    let base = 2;
    if (weapon?.criticalMultiplier) {
      const match = weapon.criticalMultiplier.match(/x(\d+)/i);
      base = match ? parseInt(match[1]) : 2;
    }
    
    // Aplicar bônus de multiplicador de weapon buffs
    if (weaponBuffBonuses.criticalMultiplierBonus) {
      base += weaponBuffBonuses.criticalMultiplierBonus;
    }
    
    return base;
  }, [weapon, weaponBuffBonuses]);

  // Cores para cada tipo de bônus
  const bonusTypeColors: Record<BonusSourceDisplay['type'], string> = {
    skill: 'bg-primary/20 text-primary',
    power: 'bg-purple-500/20 text-purple-500',
    ritual: 'bg-blue-500/20 text-blue-400',
    track: 'bg-orange-500/20 text-orange-500',
    attribute: 'bg-amber-500/20 text-amber-500',
    paranormal: 'bg-fuchsia-500/20 text-fuchsia-500',
    other: 'bg-secondary/50 text-secondary-foreground',
  };

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
    
    // Verificar se é arma de fogo (para Atirar para Matar)
    const isFirearm = weapon.type === 'Disparo';
    // Verificar se é corpo a corpo (para Potência Máxima)
    const isMelee = weapon.type === 'Corpo a Corpo' || weapon.type === 'Briga';
    
    // Aplicar Atirar para Matar: dano máximo em crítico com arma de fogo
    const useMaxDamage = advancedBonuses.atirarParaMatar && isCritical && isFirearm;
    
    // Calcular dados base (multiplicados se crítico)
    let diceCount = isCritical ? parsed.count * criticalMultiplier : parsed.count;
    
    // Bônus de dano numérico
    let damageBonus = parsed.bonus;
    
    // NOVO: Adicionar bônus de dano do sistema unificado de poderes de classe
    if (classPowerBonuses?.damageBonus) {
      damageBonus += classPowerBonuses.damageBonus;
    }
    
    // Multiplicador para Potência Máxima (dobra bônus do Ataque Especial)
    const potenciaMaximaMultiplier = advancedBonuses.potenciaMaxima && isMelee ? 2 : 1;
    
    // Dados extras (de poderes como Golpe Pesado)
    let extraDiceCount = 0;
    let extraDiceSize = parsed.size;
    
    // NOVO: Adicionar dados extras do sistema unificado de poderes de classe
    if (classPowerBonuses?.extraDamageDice && classPowerBonuses.extraDamageDice.length > 0) {
      classPowerBonuses.extraDamageDice.forEach(diceStr => {
        const match = diceStr.match(/(\d*)d(\d+)/i);
        if (match) {
          const count = parseInt(match[1]) || 1;
          extraDiceCount += isCritical ? count * criticalMultiplier : count;
          if (match[2]) extraDiceSize = parseInt(match[2]);
        }
      });
    }
    
    // Dados extras de WEAPON BUFFS (Amaldiçoar Arma, etc.)
    // Estes dados são de tipo elemental específico do ritual
    let weaponBuffDiceCount = 0;
    let weaponBuffDiceSize = 6;
    if (weaponBuffBonuses.bonusDamage) {
      const buffDamage = weaponBuffBonuses.bonusDamage;
      weaponBuffDiceCount = isCritical 
        ? (buffDamage.diceCount || 1) * criticalMultiplier 
        : (buffDamage.diceCount || 1);
      weaponBuffDiceSize = buffDamage.diceType || 6;
    }
    
    // Dados extras do Ataque Furtivo (com possível dobro do Assassinar)
    let sneakAttackDice = 0;
    if (advancedBonuses.ataqueFurtivo) {
      // Calcula dados do Ataque Furtivo baseado no NEX
      if (nex >= 99) sneakAttackDice = 4;
      else if (nex >= 65) sneakAttackDice = 3;
      else if (nex >= 40) sneakAttackDice = 2;
      else sneakAttackDice = 1;
      
      // Assassinar dobra os dados
      if (advancedBonuses.assassinar) {
        sneakAttackDice *= 2;
      }
    }
    
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
        // Aplicar multiplicador de Potência Máxima aos bônus do Ataque Especial
        const multiplier = bonusId.includes('ataque-especial') ? potenciaMaximaMultiplier : 1;
        damageBonus += bonus.damageBonus * multiplier;
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
    if (isMelee) {
      damageBonus += attributes.strength;
    }
    
    // Adicionar modificador manual de dano do mestre
    damageBonus += manualDamageMod;

    // Rolar dados principais (ou usar valor máximo se Atirar para Matar)
    const mainDice: number[] = [];
    for (let i = 0; i < diceCount; i++) {
      if (useMaxDamage) {
        mainDice.push(parsed.size); // Dano máximo
      } else {
        mainDice.push(Math.floor(Math.random() * parsed.size) + 1);
      }
    }
    
    // Rolar dados extras
    const extraDice: number[] = [];
    for (let i = 0; i < extraDiceCount; i++) {
      if (useMaxDamage) {
        extraDice.push(extraDiceSize);
      } else {
        extraDice.push(Math.floor(Math.random() * extraDiceSize) + 1);
      }
    }
    
    // Rolar dados do Ataque Furtivo (d6)
    const sneakDice: number[] = [];
    for (let i = 0; i < sneakAttackDice; i++) {
      sneakDice.push(Math.floor(Math.random() * 6) + 1);
    }
    
    // Rolar dados de WEAPON BUFFS (Amaldiçoar Arma - dano elemental)
    const weaponBuffDice: number[] = [];
    for (let i = 0; i < weaponBuffDiceCount; i++) {
      if (useMaxDamage) {
        weaponBuffDice.push(weaponBuffDiceSize);
      } else {
        weaponBuffDice.push(Math.floor(Math.random() * weaponBuffDiceSize) + 1);
      }
    }
    
    // Combinar todos os dados extras (poderes + ataque furtivo + weapon buffs)
    const allExtraDice = [...extraDice, ...sneakDice, ...weaponBuffDice];
    
    const diceTotal = mainDice.reduce((a, b) => a + b, 0) + allExtraDice.reduce((a, b) => a + b, 0);
    const total = diceTotal + damageBonus;

    setDamageResult({
      dice: mainDice,
      extraDice: allExtraDice.length > 0 ? allExtraDice : undefined,
      bonus: damageBonus,
      total: Math.max(1, total), // Dano mínimo 1
      damageType: weapon.damageType,
      isCritical,
      useMaxDamage, // Flag para exibição
      potenciaMaximaActive: advancedBonuses.potenciaMaxima && isMelee,
      assassinarActive: advancedBonuses.assassinar,
      weaponBuffActive: weaponBuffDiceCount > 0, // Flag para exibição de buffs
      weaponBuffElement: weaponBuffBonuses.bonusDamage?.damageType,
    } as any);
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
          <TooltipProvider delayDuration={200}>
            <AnimatePresence mode="wait">
              {phase === 'setup' && (
                <motion.div
                  key="setup"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Base de ataque com detalhamento de fontes */}
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Bônus de Ataque
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-sm">
                      <span className="px-2 py-0.5 rounded bg-secondary/50 font-medium">
                        {weapon.type === 'Disparo' ? 'AGI' : 'FOR'}: {attackAttribute}
                      </span>
                    {attackBonusSources.map((source, idx) => (
                      <span key={idx} className="flex items-center gap-1">
                        <span className="text-muted-foreground">+</span>
                        {source.description || source.sourceName ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={cn('px-2 py-0.5 rounded font-medium text-xs cursor-help flex items-center gap-1', bonusTypeColors[source.type])}>
                                {source.label}: +{source.value}
                                <Info className="w-3 h-3 opacity-60" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="font-medium">{source.sourceName || source.label}</p>
                              {source.description && (
                                <p className="text-xs text-muted-foreground mt-1">{source.description}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className={cn('px-2 py-0.5 rounded font-medium text-xs', bonusTypeColors[source.type])}>
                            {source.label}: +{source.value}
                          </span>
                        )}
                      </span>
                    ))}
                    {attackBonusSources.length > 0 && (
                      <span className="ml-auto font-bold text-primary">
                        = +{totalAttackBonus}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bônus de dano com detalhamento de fontes e tooltips */}
                {damageBonusSources.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Bônus de Dano
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-sm">
                      {damageBonusSources.map((source, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          {idx > 0 && <span className="text-muted-foreground">+</span>}
                          {source.description || source.sourceName ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={cn('px-2 py-0.5 rounded font-medium text-xs cursor-help flex items-center gap-1', bonusTypeColors[source.type])}>
                                  {source.label}: {typeof source.value === 'number' ? `+${source.value}` : source.value}
                                  <Info className="w-3 h-3 opacity-60" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="font-medium">{source.sourceName || source.label}</p>
                                {source.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{source.description}</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className={cn('px-2 py-0.5 rounded font-medium text-xs', bonusTypeColors[source.type])}>
                              {source.label}: {typeof source.value === 'number' ? `+${source.value}` : source.value}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

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

                {/* Modificadores manuais do mestre */}
                <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Modificadores do Mestre
                  </p>
                  
                  {/* Modificador de Ataque */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">Ataque:</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setManualAttackMod(prev => prev - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className={cn(
                        "w-10 text-center font-mono font-bold",
                        manualAttackMod > 0 && "text-green-500",
                        manualAttackMod < 0 && "text-destructive"
                      )}>
                        {manualAttackMod >= 0 ? `+${manualAttackMod}` : manualAttackMod}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setManualAttackMod(prev => prev + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      {manualAttackMod !== 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setManualAttackMod(0)}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Modificador de Dano */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">Dano:</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setManualDamageMod(prev => prev - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className={cn(
                        "w-10 text-center font-mono font-bold",
                        manualDamageMod > 0 && "text-green-500",
                        manualDamageMod < 0 && "text-destructive"
                      )}>
                        {manualDamageMod >= 0 ? `+${manualDamageMod}` : manualDamageMod}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setManualDamageMod(prev => prev + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      {manualDamageMod !== 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setManualDamageMod(0)}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* DT do Alvo (opcional) */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">Defesa do Alvo:</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={targetDefense ?? ''}
                        onChange={(e) => setTargetDefense(e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="DT"
                        className="w-16 h-7 text-center text-sm"
                      />
                      {targetDefense !== null && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setTargetDefense(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-muted-foreground">
                    Use para bônus/penalidades situacionais (cobertura, flanquear, terreno, etc.)
                  </p>
                </div>

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

                {/* Resultado com detalhamento de bônus */}
                <div className="text-center space-y-3">
                  {/* Breakdown de bônus de ataque */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 text-sm">
                    <span className="px-2 py-0.5 rounded bg-secondary/50 font-medium">
                      d20: {attackResult.keptDice}
                    </span>
                    {attackBonusSources.map((source, idx) => (
                      <span key={idx} className="flex items-center gap-1">
                        <span className="text-muted-foreground">+</span>
                        <span className={cn('px-2 py-0.5 rounded font-medium text-xs', bonusTypeColors[source.type])}>
                          {source.label}: +{source.value}
                        </span>
                      </span>
                    ))}
                  </div>
                  
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
                  
                  {/* Resultado vs DT do Alvo */}
                  {targetDefense !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className={cn(
                        "p-3 rounded-lg border-2 text-center",
                        attackResult.total >= targetDefense
                          ? "bg-green-500/10 border-green-500/50 text-green-500"
                          : "bg-destructive/10 border-destructive/50 text-destructive"
                      )}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {attackResult.total >= targetDefense ? (
                          <>
                            <Target className="w-5 h-5" />
                            <span className="font-display font-bold text-lg">ACERTOU!</span>
                          </>
                        ) : (
                          <>
                            <X className="w-5 h-5" />
                            <span className="font-display font-bold text-lg">ERROU</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs opacity-75 mt-1">
                        {attackResult.total} vs Defesa {targetDefense}
                        {attackResult.total >= targetDefense 
                          ? ` (${attackResult.total - targetDefense} acima)` 
                          : ` (faltou ${targetDefense - attackResult.total})`
                        }
                      </p>
                    </motion.div>
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

                {/* Total de dano com detalhamento de bônus */}
                <div className="text-center space-y-2">
                  {/* Breakdown de dados */}
                  <p className="text-sm text-muted-foreground">
                    {damageResult.dice.join(' + ')}
                    {damageResult.extraDice && ` + ${damageResult.extraDice.join(' + ')}`}
                    {damageResult.bonus !== 0 && ` ${damageResult.bonus >= 0 ? '+' : ''}${damageResult.bonus}`}
                  </p>
                  
                  {/* Breakdown de fontes de bônus */}
                  {damageBonusSources.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
                      {damageBonusSources.map((source, idx) => (
                        <span 
                          key={idx} 
                          className={cn('px-2 py-0.5 rounded font-medium', bonusTypeColors[source.type])}
                        >
                          {source.label}: {typeof source.value === 'number' ? `+${source.value}` : source.value}
                        </span>
                      ))}
                    </div>
                  )}
                  
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
          </TooltipProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
