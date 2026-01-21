/**
 * MobileCombatRollModal - Modal de combate completo para mobile
 * Interface step-by-step: Setup → Ataque → Dano
 * Usa Drawer para UX mobile otimizada
 * 
 * PARIDADE COMPLETA COM DESKTOP:
 * - Suporte à trilha Aniquilador (Técnica Secreta, Máquina de Matar)
 * - Detecção de arma favorita
 * - Modificador manual de dano (manualDamageMod)
 * - Defesa do alvo (targetDefense) com comparação automática
 * - Poderes paranormais (paranormalPowers)
 * - Rituais sustentados (sustainedRituals)
 * - Bônus condicionais avançados (advancedBonuses)
 * - Dados separados de buffs de arma (buffDiceResult)
 * - Breakdown detalhado de bônus com tooltips
 */

import { useState, useMemo, useCallback } from 'react';
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
  Skull,
  Plus,
  Minus,
  Droplets,
  Clock,
  RefreshCw,
  Timer,
  Infinity as InfinityIcon,
  AlertCircle,
} from 'lucide-react';
import { 
  MobileDrawer, 
  MobileDrawerContent, 
  MobileDrawerHeader, 
  MobileDrawerTitle, 
  MobileDrawerBody,
  MobileDrawerFooter 
} from '@/components/ui/mobile-drawer';
import { Button } from '@/components/ui/button';
import { MobileButtonGroup } from '@/components/ui/mobile-button-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { rollSkillTest, rollDamage, DiceRollResult } from '@/lib/dice-roller';
import { getSkillBonus } from '@/lib/character-data';
import { ComputedEffects } from '@/lib/unified-effects-engine';
import { WeaponBuff, ELEMENT_BUFF_COLORS, useRitualBonusesForCombat, useRitualCombatBonuses, SustainedRitualInput, useCombatFeedback } from '@/hooks';
import { getElementConfig } from '@/lib/element-config';
import { WeaponEntry } from './MobileCombatPanel';
import { AniquiladorTechniqueModal, TechniqueEffects } from '@/components/character/AniquiladorTechniqueModal';
import { getTrackCombatBonuses } from '@/lib/effects/track-effects-adapter';
import { formatDamageFormula as formatBuffDamage } from '@/lib/rituals/legacy-exports';
import { SpecialAttackSelector, useSpecialAttackState } from '@/components/character/SpecialAttackSelector';
import {
  getSpecialAttackOptions,
  calculateSpecialAttackFinal,
  hasSpecialAttack,
  hasForcaBrutaAbility,
  isMeleeWeapon,
} from '@/lib/class-powers/special-attack-utils';
import { checkWeaponProficiency, type ProficiencyCheckResult } from '@/lib/proficiency-utils';
import { 
  SneakAttackSelector, 
  useSneakAttackState,
  calculateSneakAttackResult,
} from '@/components/character/SneakAttackSelector';
import {
  DisparoLetalSelector,
  useDisparoLetalState,
  calculateDisparoLetalResult,
} from '@/components/character/DisparoLetalSelector';

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
  requiresAffinity?: boolean;
  affinityElement?: string;
}

// Interface para bônus condicionais avançados (paridade desktop)
interface AdvancedConditionalBonuses {
  assassinar?: boolean;     // Dobra dados do Ataque Furtivo
  potenciaMaxima?: boolean; // Dobra bônus do Ataque Especial corpo a corpo
  atirarParaMatar?: boolean; // Dano máximo em crítico com arma de fogo
  ataqueFurtivo?: boolean;  // Ataque Furtivo básico
}

// Interface para fonte de bônus detalhada (exibição)
interface BonusSourceDisplay {
  label: string;
  value: number | string;
  type: 'skill' | 'power' | 'ritual' | 'track' | 'attribute' | 'paranormal' | 'other';
  description?: string;
  sourceName?: string;
}

// Props do modal - PARIDADE COMPLETA COM DESKTOP
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
  classTrack?: string;
  abilities: string[];
  nex: number;
  unifiedEffects?: ComputedEffects;
  weaponBuffs?: WeaponBuff[];
  onRollComplete?: (result: DiceRollResult) => void;
  // NOVAS PROPS - Paridade com desktop
  paranormalPowers?: Array<{ id: string; name: string; element: string }>;
  hasAffinity?: boolean;
  affinityElement?: string | null;
  sustainedRituals?: SustainedRitualInput[];
  advancedBonuses?: AdvancedConditionalBonuses;
  isFavoriteWeapon?: boolean;
  activatedTrackEffects?: string[];
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
  // NOVAS PROPS - Paridade com desktop
  paranormalPowers = [],
  hasAffinity = false,
  affinityElement = null,
  sustainedRituals = [],
  advancedBonuses = {},
  isFavoriteWeapon,
  activatedTrackEffects = [],
}: MobileCombatRollModalProps) {
  // Bônus de rituais sustentados processados automaticamente
  const ritualBonuses = useRitualBonusesForCombat(sustainedRituals);
  const ritualCombatSummary = useRitualCombatBonuses(sustainedRituals);
  
  // Estados
  const [phase, setPhase] = useState<CombatPhase>('setup');
  const [selectedBonuses, setSelectedBonuses] = useState<string[]>([]);
  const [attackResult, setAttackResult] = useState<DiceRollResult | null>(null);
  const [damageResult, setDamageResult] = useState<{
    dice: number[];
    bonus: number;
    total: number;
    isCritical: boolean;
    extraDice?: number[];
    useMaxDamage?: boolean;
    potenciaMaximaActive?: boolean;
    assassinarActive?: boolean;
  } | null>(null);
  const [manualAttackMod, setManualAttackMod] = useState(0);
  const [manualDamageMod, setManualDamageMod] = useState(0); // NOVO - paridade desktop
  const [targetDefense, setTargetDefense] = useState<number | null>(null); // NOVO - paridade desktop
  const [isRolling, setIsRolling] = useState(false);
  
  // Estado separado para dados do buff (Amaldiçoar Arma, etc.) - NOVO
  const [buffDiceResult, setBuffDiceResult] = useState<{
    dice: number[];
    formula: string;
    element: string;
    ritualName: string;
    enhancement: string | null;
    total: number;
    criticalMultiplier?: number;
    isCritical: boolean;
  } | null>(null);
  
  // === ESTADOS DO ANIQUILADOR ===
  const [showTechniqueModal, setShowTechniqueModal] = useState(false);
  const [activeTechniqueEffects, setActiveTechniqueEffects] = useState<TechniqueEffects | null>(null);
  
  // === ESTADO PARA ATAQUE ESPECIAL (Combatente) ===
  const { config: specialAttackConfig, setConfig: setSpecialAttackConfig, reset: resetSpecialAttack } = useSpecialAttackState();
  
  // === ESTADO PARA ATAQUE FURTIVO (Infiltrador) ===
  const { config: sneakAttackConfig, setConfig: setSneakAttackConfig, reset: resetSneakAttack } = useSneakAttackState();
  
  // === ESTADO PARA DISPARO LETAL (Atirador de Elite) ===
  const { config: disparoLetalConfig, setConfig: setDisparoLetalConfig, resetDisparoLetal } = useDisparoLetalState();
  
  // Verifica se é Infiltrador
  const isInfiltrador = classTrack === 'infiltrador';
  
  // Verifica se é Atirador de Elite
  const isAtiradorElite = useMemo(() => 
    classTrack?.toLowerCase().includes('atirador') && classTrack?.toLowerCase().includes('elite'),
  [classTrack]);
  
  // Detecta tipo de ataque baseado na arma
  const attackType: 'melee' | 'ranged' = useMemo(() => {
    if (!weapon) return 'melee';
    return weapon.type === 'Disparo' || weapon.type === 'Arremesso' ? 'ranged' : 'melee';
  }, [weapon]);
  
  // Detecta se a arma é favorita (via prop ou campo da arma)
  const weaponIsFavorite = isFavoriteWeapon ?? weapon?.isFavoriteWeapon ?? false;
  
  // Detecta se pode usar Técnica Secreta (Aniquilador NEX 40%+ com arma favorita)
  const canUseTechniqueSecreta = useMemo(() => {
    const isAniquilador = classTrack?.toLowerCase().includes('aniquilador');
    return isAniquilador && nex >= 40 && weaponIsFavorite;
  }, [classTrack, nex, weaponIsFavorite]);
  
  // Detecta Máquina de Matar (Aniquilador NEX 99%+ com arma favorita)
  const maquinaDeMatarActive = useMemo(() => {
    const isAniquilador = classTrack?.toLowerCase().includes('aniquilador');
    return isAniquilador && nex >= 99 && weaponIsFavorite;
  }, [classTrack, nex, weaponIsFavorite]);
  
  // Detecta poderes relacionados ao Ataque Especial
  const hasForcaBruta = useMemo(() => hasForcaBrutaAbility(abilities), [abilities]);
  const isMeleeForSpecialAttack = useMemo(() => isMeleeWeapon(weapon?.type), [weapon?.type]);
  
  // Calcula bônus do Ataque Especial
  const specialAttackResult = useMemo(() => {
    return calculateSpecialAttackFinal(
      nex,
      specialAttackConfig,
      hasForcaBruta,
      advancedBonuses.potenciaMaxima || false,
      isMeleeForSpecialAttack
    );
  }, [nex, specialAttackConfig, hasForcaBruta, advancedBonuses.potenciaMaxima, isMeleeForSpecialAttack]);
  
  // Obtém bônus de trilha consolidados
  const trackCombatBonuses = useMemo(() => {
    return getTrackCombatBonuses(
      classTrack || '',
      nex,
      attributes,
      attackType,
      activatedTrackEffects
    );
  }, [classTrack, nex, attributes, attackType, activatedTrackEffects]);
  
  // === PROCESSAR WEAPON BUFFS (Amaldiçoar Arma, etc.) ===
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
    
    const attackBonuses = weaponBuffs.map(b => b.attackBonus || 0);
    const criticalBonuses = weaponBuffs.map(b => b.criticalBonus || 0);
    const criticalMultiplierBonuses = weaponBuffs.map(b => b.criticalMultiplierBonus || 0);
    
    // Usa o MAIOR de cada tipo (rituais não acumulam)
    const totalAttackBonus = attackBonuses.length > 0 ? Math.max(...attackBonuses) : 0;
    const totalCriticalBonus = criticalBonuses.length > 0 ? Math.max(...criticalBonuses) : 0;
    const totalCriticalMultiplierBonus = criticalMultiplierBonuses.length > 0 ? Math.max(...criticalMultiplierBonuses) : 0;
    
    const allBonusDamage = weaponBuffs
      .filter(b => b.bonusDamage)
      .map(b => ({ ...b.bonusDamage!, element: b.element }));
    
    const sortedDamage = allBonusDamage.sort((a, b) => {
      const powerA = (a.diceCount || 1) * (a.diceType || 0);
      const powerB = (b.diceCount || 1) * (b.diceType || 0);
      return powerB - powerA;
    });
    
    const bestDamage = sortedDamage.length > 0 ? sortedDamage[0] : null;
    const summary = weaponBuffs.map(b => b.ritualName);
    
    return {
      attackBonus: totalAttackBonus,
      criticalBonus: totalCriticalBonus,
      criticalMultiplierBonus: totalCriticalMultiplierBonus,
      bonusDamage: bestDamage,
      summary,
    };
  }, [weaponBuffs]);

  // Reset ao fechar
  const handleClose = useCallback(() => {
    setPhase('setup');
    setSelectedBonuses([]);
    setAttackResult(null);
    setDamageResult(null);
    setBuffDiceResult(null);
    setManualAttackMod(0);
    setManualDamageMod(0);
    setTargetDefense(null);
    setIsRolling(false);
    setActiveTechniqueEffects(null);
    resetSpecialAttack();
    resetSneakAttack();
    resetDisparoLetal();
    onClose();
  }, [onClose, resetSpecialAttack, resetSneakAttack, resetDisparoLetal]);
  
  // Handler para confirmar técnicas do Aniquilador
  const handleConfirmTechnique = useCallback((effects: TechniqueEffects) => {
    setActiveTechniqueEffects(effects);
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

  // Bônus disponíveis - ATUALIZADO com poderes paranormais e rituais
  const availableBonuses = useMemo((): CombatBonus[] => {
    const bonuses: CombatBonus[] = [];
    const isMelee = weapon?.type === 'Corpo a Corpo' || weapon?.type === 'Briga';
    
    // === BÔNUS DE CLASSE ===
    // (Ataque Especial removido - agora usa SpecialAttackSelector com distribuição flexível)

    // Golpe Pesado é PASSIVO - aplicado automaticamente no rollDamage (não precisa de toggle)

    // Combater com Duas Armas (Combatente) - Penalidade de -2 no ataque
    if (abilities.some(a => 
      a.toLowerCase().includes('combater com duas armas') || 
      a.toLowerCase().includes('combater duas armas')
    )) {
      bonuses.push({
        id: 'combater-duas-armas',
        name: 'Combater com Duas Armas (-2 ataque)',
        source: 'class',
        attackBonus: -2,
        peCost: 0,
        description: 'Dois ataques com duas armas. Penalidade de -2 em todos os testes de ataque.',
      });
    }

    // Combate Defensivo (Combatente) - Penalidade de -2 no ataque, +5 Defesa
    if (abilities.some(a => 
      a.toLowerCase().includes('combate defensivo')
    )) {
      bonuses.push({
        id: 'combate-defensivo',
        name: 'Combate Defensivo (-2 ataque, +5 Def)',
        source: 'class',
        attackBonus: -2,
        peCost: 0,
        description: 'Sofre -2 em ataques, mas recebe +5 na Defesa até o próximo turno.',
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
    
    const hasMaosFlamejantes = paranormalPowers.some(p => 
      p.id === 'maos-flamejantes' || p.name.toLowerCase().includes('mãos flamejantes')
    );
    if (hasMaosFlamejantes && isMelee) {
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
    
    // === BÔNUS DE RITUAIS SUSTENTADOS ===
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

  // Toggle de bônus
  const toggleBonus = (bonusId: string) => {
    setSelectedBonuses(prev => 
      prev.includes(bonusId) 
        ? prev.filter(id => id !== bonusId)
        : [...prev, bonusId]
    );
  };

  // Custo total de PE (incluindo Ataque Especial)
  // Calcula o resultado do Ataque Furtivo para obter o custo de PE
  const sneakAttackResult = useMemo(() => 
    calculateSneakAttackResult(nex, sneakAttackConfig, advancedBonuses.assassinar || false),
  [nex, sneakAttackConfig, advancedBonuses.assassinar]);
  
  // Calcula o resultado do Disparo Letal para obter o custo de PE
  const disparoLetalResult = useMemo(() => 
    calculateDisparoLetalResult(nex, disparoLetalConfig),
  [nex, disparoLetalConfig]);
  
  const totalPECost = useMemo(() => {
    let total = selectedBonuses.reduce((sum, bonusId) => {
      const bonus = availableBonuses.find(b => b.id === bonusId);
      return sum + (bonus?.peCost || 0);
    }, 0);
    if (specialAttackConfig.enabled) {
      total += specialAttackResult.peCost;
    }
    // Adicionar custo do Ataque Furtivo se ativo (Infiltrador)
    if (isInfiltrador && sneakAttackConfig.enabled) {
      total += sneakAttackResult.peCost;
    }
    // Adicionar custo do Disparo Letal se ativo (Atirador de Elite)
    if (isAtiradorElite && disparoLetalConfig.enabled) {
      total += disparoLetalResult.peCost;
    }
    return total;
  }, [selectedBonuses, availableBonuses, specialAttackConfig.enabled, specialAttackResult.peCost, isInfiltrador, sneakAttackConfig.enabled, sneakAttackResult.peCost, isAtiradorElite, disparoLetalConfig.enabled, disparoLetalResult.peCost]);

  const canAffordPE = currentPE >= totalPECost;

  // === VERIFICAÇÃO DE PROFICIÊNCIA COM ARMA ===
  // Regra oficial: -5 no ataque se não tiver proficiência adequada
  const proficiencyCheck = useMemo((): ProficiencyCheckResult => {
    if (!weapon) return { hasProficiency: true, penalty: 0 };
    
    // Coleta proficiências do personagem (do SUE ou padrão da classe)
    const characterProficiencies: string[] = unifiedEffects?.proficiencies || [];
    
    return checkWeaponProficiency(
      weapon.category,
      characterProficiencies,
      characterClass
    );
  }, [weapon, unifiedEffects, characterClass]);

  // Bônus total de ataque - ATUALIZADO com SUE, trilha, weapon buffs
  const totalAttackBonus = useMemo(() => {
    let total = attackSkill.bonus;
    const isMelee = weapon?.type === 'Corpo a Corpo' || weapon?.type === 'Briga';
    
    // Bônus do SUE
    if (unifiedEffects) {
      total += unifiedEffects.attack.general;
      total += isMelee ? unifiedEffects.attack.melee : unifiedEffects.attack.ranged;
    }
    
    // Bônus de trilha
    if (trackCombatBonuses.attackBonus > 0) {
      total += trackCombatBonuses.attackBonus;
    }
    
    // Bônus de weapon buffs
    if (weaponBuffBonuses.attackBonus) {
      total += weaponBuffBonuses.attackBonus;
    }
    
    // Bônus passivos
    passiveBonuses.forEach(b => {
      if (b.attackBonus) total += b.attackBonus;
    });
    
    // Bônus selecionados
    selectedBonuses.forEach(bonusId => {
      const bonus = availableBonuses.find(b => b.id === bonusId);
      if (bonus?.attackBonus) total += bonus.attackBonus;
    });
    
    // === BÔNUS DO ATAQUE ESPECIAL (distribuição flexível) ===
    if (specialAttackConfig.enabled && specialAttackResult.attackBonus > 0) {
      total += specialAttackResult.attackBonus;
    }
    
    // Modificador manual
    total += manualAttackMod;
    
    // === PENALIDADE DE PROFICIÊNCIA ===
    // Regra oficial: -5 no ataque se não tiver proficiência adequada
    if (!proficiencyCheck.hasProficiency) {
      total += proficiencyCheck.penalty; // -5
    }
    
    return total;
  }, [attackSkill.bonus, selectedBonuses, availableBonuses, manualAttackMod, weaponBuffBonuses, unifiedEffects, weapon, trackCombatBonuses, passiveBonuses, specialAttackConfig.enabled, specialAttackResult.attackBonus, proficiencyCheck]);

  // Detalhamento das fontes de bônus de ataque - NOVO
  const attackBonusSources = useMemo(() => {
    const sources: BonusSourceDisplay[] = [];
    const isMelee = weapon?.type === 'Corpo a Corpo' || weapon?.type === 'Briga';
    
    if (attackSkill.bonus > 0) {
      sources.push({ label: attackSkill.name, value: attackSkill.bonus, type: 'skill' });
    }
    
    if (unifiedEffects) {
      if (unifiedEffects.attack.general !== 0) {
        unifiedEffects.attack.breakdown.forEach(entry => {
          sources.push({ label: entry.source, value: entry.value, type: 'track' });
        });
      }
      const specificBonus = isMelee ? unifiedEffects.attack.melee : unifiedEffects.attack.ranged;
      if (specificBonus !== 0) {
        sources.push({ 
          label: isMelee ? 'Corpo a Corpo' : 'À Distância', 
          value: specificBonus, 
          type: 'track' 
        });
      }
    }
    
    if (trackCombatBonuses.attackBonus > 0) {
      sources.push({ label: 'Trilha', value: trackCombatBonuses.attackBonus, type: 'track' });
    }
    
    if (weaponBuffBonuses.attackBonus > 0) {
      sources.push({ label: 'Buff', value: weaponBuffBonuses.attackBonus, type: 'ritual' });
    }
    
    passiveBonuses.forEach(b => {
      if (b.attackBonus) sources.push({ label: b.name, value: b.attackBonus, type: 'ritual' });
    });
    
    selectedBonuses.forEach(bonusId => {
      const bonus = availableBonuses.find(b => b.id === bonusId);
      if (bonus?.attackBonus) {
        sources.push({ label: bonus.name, value: bonus.attackBonus, type: bonus.source === 'paranormal' ? 'paranormal' : 'power' });
      }
    });
    
    if (manualAttackMod !== 0) {
      sources.push({ label: 'Mestre', value: manualAttackMod, type: 'other' });
    }
    
    // === PENALIDADE DE PROFICIÊNCIA ===
    if (!proficiencyCheck.hasProficiency) {
      sources.push({
        label: `Sem ${proficiencyCheck.missingProficiency}`,
        value: proficiencyCheck.penalty,
        type: 'other',
        description: `Penalidade por usar arma sem proficiência`,
      });
    }
    
    return sources;
  }, [attackSkill, unifiedEffects, weapon, trackCombatBonuses, weaponBuffBonuses, passiveBonuses, selectedBonuses, availableBonuses, manualAttackMod, proficiencyCheck]);

  // Margem de crítico efetiva
  const criticalMargin = useMemo(() => {
    let margin = 20;
    const isMelee = weapon?.type === 'Corpo a Corpo' || weapon?.type === 'Briga';
    
    if (weapon?.critical) {
      const match = weapon.critical.match(/(\d+)/);
      if (match) margin = Math.min(margin, parseInt(match[1]));
    }
    
    // Técnica Letal (Guerreiro)
    const isGuerreiro = classTrack?.toLowerCase().includes('guerreiro');
    if (isGuerreiro && nex >= 10 && isMelee) {
      margin -= 2;
    }
    
    // SUE
    if (unifiedEffects && !isGuerreiro) {
      margin -= unifiedEffects.critical.marginBonus;
    }
    
    // Weapon buffs
    if (weaponBuffBonuses.criticalBonus) {
      margin -= weaponBuffBonuses.criticalBonus;
    }
    
    // Bônus passivos
    passiveBonuses.forEach(b => {
      if (b.criticalBonus) margin -= b.criticalBonus;
    });
    
    // Máquina de Matar
    if (maquinaDeMatarActive) {
      margin -= 2;
    }
    
    // Técnicas do Aniquilador
    if (activeTechniqueEffects?.criticalMarginBonus) {
      margin -= activeTechniqueEffects.criticalMarginBonus;
    }
    
    // Trilha
    if (trackCombatBonuses.criticalMarginBonus > 0) {
      margin -= trackCombatBonuses.criticalMarginBonus;
    }
    
    // === DISPARO LETAL (Atirador de Elite NEX 40%): +2 margem de ameaça ===
    // Aplicação direta quando ativado no seletor de combate
    if (isAtiradorElite && disparoLetalConfig.enabled) {
      margin -= disparoLetalResult.criticalMarginBonus;
    }
    
    return Math.max(1, margin);
  }, [weapon, weaponBuffBonuses, unifiedEffects, maquinaDeMatarActive, activeTechniqueEffects, classTrack, nex, passiveBonuses, trackCombatBonuses, isAtiradorElite, disparoLetalConfig.enabled, disparoLetalResult.criticalMarginBonus]);
  
  // Multiplicador de crítico efetivo (conversão segura para string)
  const criticalMultiplier = useMemo(() => {
    let multiplier = 2;
    
    if (weapon?.criticalMultiplier !== undefined) {
      // Converte para string de forma segura (pode vir como número ou string)
      const critValue = String(weapon.criticalMultiplier);
      const match = critValue.match(/x?(\d+)/i);
      if (match) {
        multiplier = parseInt(match[1]);
      } else if (!isNaN(Number(weapon.criticalMultiplier))) {
        // Fallback: se for número direto (ex: 2, 3, 4)
        multiplier = Number(weapon.criticalMultiplier);
      }
    }
    
    if (unifiedEffects) {
      multiplier += unifiedEffects.critical.multiplierBonus;
    }
    
    if (trackCombatBonuses.criticalMultiplierBonus > 0) {
      multiplier += trackCombatBonuses.criticalMultiplierBonus;
    }
    
    if (weaponBuffBonuses.criticalMultiplierBonus) {
      multiplier += weaponBuffBonuses.criticalMultiplierBonus;
    }
    
    if (activeTechniqueEffects?.criticalMultiplierBonus) {
      multiplier += activeTechniqueEffects.criticalMultiplierBonus;
    }
    
    return multiplier;
  }, [weapon, weaponBuffBonuses, unifiedEffects, activeTechniqueEffects, trackCombatBonuses]);

  // === FEEDBACK SONORO E HÁPTICO ===
  const combatFeedback = useCombatFeedback();

  // Rolar ataque
  const rollAttack = useCallback(() => {
    if (!weapon) return;
    
    setIsRolling(true);
    combatFeedback.triggerRoll();
    
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
      
      // Feedback baseado no resultado
      const isFumble = result.dice.every(d => d === 1);
      
      if (isFumble) {
        combatFeedback.triggerFumble();
      } else if (result.isCritical) {
        // Confetti + som de crítico
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffd700', '#ff6b6b', '#4ecdc4'],
        });
        combatFeedback.triggerCritical();
      } else if (targetDefense !== null) {
        if (result.total >= targetDefense) {
          combatFeedback.triggerHit();
        } else {
          combatFeedback.triggerMiss();
        }
      } else {
        combatFeedback.triggerHit();
      }
      
      // Paga PE
      if (totalPECost > 0 && canAffordPE) {
        onPEChange(currentPE - totalPECost);
      }
      
      onRollComplete?.(result);
    }, 500);
  }, [weapon, attackAttribute, totalAttackBonus, criticalMargin, totalPECost, canAffordPE, currentPE, onPEChange, onRollComplete, targetDefense, combatFeedback]);

  // Rolar dano - ATUALIZADO com advancedBonuses e buffDiceResult
  const rollDamageAction = useCallback(() => {
    if (!weapon || !attackResult) return;
    
    setIsRolling(true);
    
    setTimeout(() => {
      const isCritical = attackResult.isCritical;
      const parsed = parseDamageString(weapon.damage);
      const isMelee = weapon.type === 'Corpo a Corpo' || weapon.type === 'Briga';
      const isFirearm = weapon.type === 'Disparo';
      
      // Atirar para Matar ou dano máximo da trilha
      const useMaxDamage = (advancedBonuses.atirarParaMatar && isCritical && isFirearm) ||
        (trackCombatBonuses.maximumDamageOnCrit && isCritical);
      
      // Dados base
      let diceCount = isCritical ? parsed.count * criticalMultiplier : parsed.count;
      
      // Bônus de dano
      let damageBonus = parsed.bonus;
      
      // SUE
      if (unifiedEffects) {
        damageBonus += unifiedEffects.damage.general;
        damageBonus += isMelee ? unifiedEffects.damage.melee : unifiedEffects.damage.ranged;
      }
      
      // Trilha
      if (trackCombatBonuses.damageBonus > 0) {
        damageBonus += trackCombatBonuses.damageBonus;
      }
      
      // Potência Máxima
      const potenciaMaximaMultiplier = advancedBonuses.potenciaMaxima && isMelee ? 2 : 1;
      
      // Dados extras
      let extraDiceCount = 0;
      let extraDiceSize = parsed.size;
      
      // SUE extra dice
      if (unifiedEffects && unifiedEffects.damage.extraDice.length > 0) {
        unifiedEffects.damage.extraDice.forEach(diceStr => {
          const match = diceStr.match(/(\d*)d(\d+)/i);
          if (match) {
            const count = parseInt(match[1]) || 1;
            extraDiceCount += isCritical ? count * criticalMultiplier : count;
            if (match[2]) extraDiceSize = parseInt(match[2]);
          }
        });
      }
      
      // Trilha extra dice
      if (trackCombatBonuses.extraDamageDice.length > 0) {
        trackCombatBonuses.extraDamageDice.forEach(diceStr => {
          const match = diceStr.match(/(\d*)d(\d+)/i);
          if (match) {
            const count = parseInt(match[1]) || 1;
            extraDiceCount += isCritical ? count * criticalMultiplier : count;
            if (match[2]) extraDiceSize = parseInt(match[2]);
          }
        });
      }
      
      // Weapon buff dice
      let weaponBuffDiceCount = 0;
      let weaponBuffDiceSize = 6;
      let weaponBuffBaseDice = 0;
      let weaponBuffEnhancement: string | null = null;
      
      if (weaponBuffBonuses.bonusDamage && weaponBuffs.length > 0) {
        const buffDamage = weaponBuffBonuses.bonusDamage;
        const activeBuff = weaponBuffs[0];
        
        if (activeBuff.enhancements?.includes('Verdadeiro')) {
          weaponBuffEnhancement = 'Verdadeiro';
        } else if (activeBuff.enhancements?.includes('Discente')) {
          weaponBuffEnhancement = 'Discente';
        }
        
        weaponBuffBaseDice = buffDamage.diceCount || 1;
        weaponBuffDiceCount = isCritical ? weaponBuffBaseDice * criticalMultiplier : weaponBuffBaseDice;
        weaponBuffDiceSize = buffDamage.diceType || 6;
      }
      
      // Ataque Furtivo - agora usa SneakAttackSelector
      let sneakAttackDice = 0;
      if (sneakAttackConfig.enabled && isInfiltrador && nex >= 10) {
        const sneakResult = calculateSneakAttackResult(nex, sneakAttackConfig, advancedBonuses.assassinar || false);
        sneakAttackDice = sneakResult.finalDice;
      } else if (advancedBonuses.ataqueFurtivo) {
        // Fallback para sistema legado
        if (nex >= 99) sneakAttackDice = 4;
        else if (nex >= 65) sneakAttackDice = 3;
        else if (nex >= 40) sneakAttackDice = 2;
        else sneakAttackDice = 1;
        
        if (advancedBonuses.assassinar) {
          sneakAttackDice *= 2;
        }
      }
      
      // Máquina de Matar
      let maquinaDeMatarDice = 0;
      if (maquinaDeMatarActive) {
        maquinaDeMatarDice = isCritical ? criticalMultiplier : 1;
      }
      
      // === GOLPE PESADO: +1 dado do mesmo tipo da arma (PASSIVO, corpo a corpo apenas) ===
      const hasGolpePesado = abilities.some(a => a.toLowerCase().includes('golpe pesado'));
      let golpePesadoDice = 0;
      if (hasGolpePesado && isMelee) {
        golpePesadoDice = isCritical ? criticalMultiplier : 1;
      }

      // Bônus passivos
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
      
      // Bônus selecionados
      selectedBonuses.forEach(bonusId => {
        const bonus = availableBonuses.find(b => b.id === bonusId);
        if (!bonus) return;
        
        if (typeof bonus.damageBonus === 'number') {
          const multiplier = bonusId.includes('ataque-especial') ? potenciaMaximaMultiplier : 1;
          damageBonus += bonus.damageBonus * multiplier;
        } else if (typeof bonus.damageBonus === 'string') {
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
      
      // Força em corpo a corpo
      if (isMelee) {
        damageBonus += attributes.strength;
      }
      
      // Modificador manual de dano
      damageBonus += manualDamageMod;

      // Rolar dados principais
      const mainDice: number[] = [];
      for (let i = 0; i < diceCount; i++) {
        mainDice.push(useMaxDamage ? parsed.size : Math.floor(Math.random() * parsed.size) + 1);
      }
      
      // Rolar dados extras
      const extraDice: number[] = [];
      for (let i = 0; i < extraDiceCount; i++) {
        extraDice.push(useMaxDamage ? extraDiceSize : Math.floor(Math.random() * extraDiceSize) + 1);
      }
      
      // Rolar dados do Ataque Furtivo
      const sneakDice: number[] = [];
      for (let i = 0; i < sneakAttackDice; i++) {
        sneakDice.push(Math.floor(Math.random() * 6) + 1);
      }
      
      // Rolar dados do Máquina de Matar
      const maquinaDeMatarDiceResults: number[] = [];
      for (let i = 0; i < maquinaDeMatarDice; i++) {
        maquinaDeMatarDiceResults.push(useMaxDamage ? parsed.size : Math.floor(Math.random() * parsed.size) + 1);
      }
      
      // Rolar dados do Golpe Pesado (PASSIVO, mesmo tipo da arma)
      const golpePesadoDiceResults: number[] = [];
      for (let i = 0; i < golpePesadoDice; i++) {
        golpePesadoDiceResults.push(useMaxDamage ? parsed.size : Math.floor(Math.random() * parsed.size) + 1);
      }
      
      // Rolar dados de weapon buffs separadamente
      const weaponBuffDice: number[] = [];
      for (let i = 0; i < weaponBuffDiceCount; i++) {
        weaponBuffDice.push(useMaxDamage ? weaponBuffDiceSize : Math.floor(Math.random() * weaponBuffDiceSize) + 1);
      }
      
      const allExtraDice = [...extraDice, ...sneakDice, ...maquinaDeMatarDiceResults, ...golpePesadoDiceResults];
      
      const weaponDiceTotal = mainDice.reduce((a, b) => a + b, 0);
      const extraDiceTotal = allExtraDice.reduce((a, b) => a + b, 0);
      const buffDiceTotal = weaponBuffDice.reduce((a, b) => a + b, 0);
      
      const total = weaponDiceTotal + extraDiceTotal + buffDiceTotal + damageBonus;
      
      setDamageResult({
        dice: mainDice,
        extraDice: allExtraDice.length > 0 ? allExtraDice : undefined,
        bonus: damageBonus,
        total: Math.max(1, total),
        isCritical,
        useMaxDamage,
        potenciaMaximaActive: advancedBonuses.potenciaMaxima && isMelee,
        assassinarActive: advancedBonuses.assassinar,
      });
      
      // Armazenar buff dice separadamente
      if (weaponBuffDice.length > 0 && weaponBuffs.length > 0) {
        const activeBuff = weaponBuffs[0];
        setBuffDiceResult({
          dice: weaponBuffDice,
          formula: `${weaponBuffBaseDice}d${weaponBuffDiceSize}`,
          element: activeBuff.element,
          ritualName: activeBuff.ritualName,
          enhancement: weaponBuffEnhancement,
          total: buffDiceTotal,
          criticalMultiplier: isCritical ? criticalMultiplier : undefined,
          isCritical,
        });
      } else {
        setBuffDiceResult(null);
      }
      
      setIsRolling(false);
      setPhase('damage');
    }, 500);
  }, [weapon, attackResult, selectedBonuses, availableBonuses, attributes, unifiedEffects, maquinaDeMatarActive, criticalMultiplier, advancedBonuses, trackCombatBonuses, weaponBuffBonuses, weaponBuffs, passiveBonuses, manualDamageMod, nex]);

  if (!weapon) return null;

  // Verificar se acertou (se targetDefense foi definido)
  const hitResult = attackResult && targetDefense 
    ? attackResult.total >= targetDefense ? 'hit' : 'miss' 
    : null;

  return (
    <MobileDrawer open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <MobileDrawerContent maxHeight="xl">
        <MobileDrawerHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sword className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <MobileDrawerTitle className="font-display text-base">{weapon.name}</MobileDrawerTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px]">{weapon.type}</Badge>
                <Badge variant="outline" className="text-[10px]">{weapon.damage}</Badge>
              </div>
            </div>
          </div>
          
          {/* Progress steps */}
          <div className="flex items-center gap-1 mt-3">
            {['setup', 'attack', 'damage'].map((step) => (
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
        </MobileDrawerHeader>

        <MobileDrawerBody>
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
                        const elementColors = ELEMENT_BUFF_COLORS[buff.element] || { bg: 'bg-paranormal/20', text: 'text-paranormal' };
                        return (
                          <span
                            key={buff.id}
                            className={cn(
                              "px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1",
                              elementColors.bg, elementColors.text
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

                {/* Bônus de Trilha Ativos */}
                {classTrack && (
                  trackCombatBonuses.attackBonus > 0 ||
                  trackCombatBonuses.damageBonus > 0 ||
                  trackCombatBonuses.criticalMarginBonus > 0 ||
                  trackCombatBonuses.criticalMultiplierBonus > 0 ||
                  trackCombatBonuses.extraDamageDice.length > 0 ||
                  trackCombatBonuses.specialEffects.length > 0 ||
                  maquinaDeMatarActive
                ) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-red-500/5 border border-amber-500/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sword className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-medium text-amber-400 capitalize">
                        Bônus: {classTrack}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <TooltipProvider>
                        {trackCombatBonuses.attackBonus > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                                <Target className="w-3 h-3" />
                                +{trackCombatBonuses.attackBonus} atk
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Bônus de ataque da trilha</TooltipContent>
                          </Tooltip>
                        )}

                        {trackCombatBonuses.damageBonus > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-[10px] gap-1 bg-red-500/10 border-red-500/30 text-red-400">
                                <Flame className="w-3 h-3" />
                                +{trackCombatBonuses.damageBonus} dano
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Bônus de dano da trilha</TooltipContent>
                          </Tooltip>
                        )}

                        {trackCombatBonuses.criticalMarginBonus > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-[10px] gap-1 bg-amber-500/10 border-amber-500/30 text-amber-400">
                                <Crosshair className="w-3 h-3" />
                                -{trackCombatBonuses.criticalMarginBonus} crítico
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Margem de crítico reduzida</TooltipContent>
                          </Tooltip>
                        )}

                        {trackCombatBonuses.criticalMultiplierBonus > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-[10px] gap-1 bg-orange-500/10 border-orange-500/30 text-orange-400">
                                <Skull className="w-3 h-3" />
                                +{trackCombatBonuses.criticalMultiplierBonus} mult.
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Multiplicador de crítico aumentado</TooltipContent>
                          </Tooltip>
                        )}

                        {maquinaDeMatarActive && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-[10px] gap-1 bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse">
                                <Sparkles className="w-3 h-3" />
                                Máquina de Matar
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>NEX 99%: -2 margem crítico, +1d dano</TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>
                    </div>

                    {trackCombatBonuses.specialEffects.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-amber-500/10">
                        <p className="text-[9px] text-muted-foreground uppercase">Efeitos</p>
                        <div className="flex flex-wrap gap-1">
                          {trackCombatBonuses.specialEffects.map((effect, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[9px] gap-1 bg-amber-500/10 text-amber-300">
                              <Zap className="w-2.5 h-2.5" />
                              {effect}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* === ATAQUE ESPECIAL (Combatente) com distribuição flexível === */}
                {hasSpecialAttack(abilities) && (
                  <SpecialAttackSelector
                    nex={nex}
                    abilities={abilities}
                    weaponType={weapon.type}
                    hasPotenciaMaxima={advancedBonuses.potenciaMaxima}
                    currentPE={currentPE}
                    config={specialAttackConfig}
                    onConfigChange={setSpecialAttackConfig}
                    variant="compact"
                  />
                )}
                
                {/* === DISPARO LETAL (Atirador de Elite NEX 40%+) === */}
                {isAtiradorElite && nex >= 40 && (
                  <DisparoLetalSelector
                    nex={nex}
                    currentPE={currentPE}
                    config={disparoLetalConfig}
                    onConfigChange={setDisparoLetalConfig}
                    variant="compact"
                  />
                )}

                {/* === TÉCNICA SECRETA (Aniquilador NEX 40%+) === */}
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

                {/* Bônus selecionáveis */}
                {availableBonuses.filter(b => !b.isPassive).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase">Poderes Ativáveis</p>
                    {availableBonuses.filter(b => !b.isPassive).map(bonus => (
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

                {/* Modificadores manuais do Mestre */}
                <div className="space-y-3">
                  <p className="text-[10px] text-muted-foreground uppercase">Modificadores do Mestre</p>
                  
                  {/* Modificador de Ataque */}
                  <div className="p-3 rounded-lg bg-card/50 border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mod. Ataque</span>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setManualAttackMod(m => m - 1)}
                        >
                          <Minus className="w-3 h-3" />
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
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Modificador de Dano - NOVO */}
                  <div className="p-3 rounded-lg bg-card/50 border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mod. Dano</span>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setManualDamageMod(m => m - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-display">
                          {manualDamageMod >= 0 ? `+${manualDamageMod}` : manualDamageMod}
                        </span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setManualDamageMod(m => m + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Defesa do Alvo - NOVO */}
                  <div className="p-3 rounded-lg bg-card/50 border border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Defesa do Alvo</span>
                      </div>
                      <Input
                        type="number"
                        value={targetDefense ?? ''}
                        onChange={(e) => setTargetDefense(e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="--"
                        className="w-16 h-8 text-center"
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1">
                      Opcional - para comparação automática
                    </p>
                  </div>
                </div>

                {/* Resumo de ataque */}
                <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/30">
                  <div className="flex items-center justify-between text-sm">
                    <span>Bônus de Ataque Total</span>
                    <span className="font-display text-lg text-primary">
                      +{totalAttackBonus}
                    </span>
                  </div>
                  
                  {/* Breakdown de bônus */}
                  {attackBonusSources.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <TooltipProvider>
                        {attackBonusSources.map((src, idx) => (
                          <Tooltip key={idx}>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant="secondary" 
                                className={cn("text-[9px] gap-0.5", bonusTypeColors[src.type])}
                              >
                                {src.label}: {typeof src.value === 'number' && src.value >= 0 ? '+' : ''}{src.value}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>{src.description || src.label}</TooltipContent>
                          </Tooltip>
                        ))}
                      </TooltipProvider>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>Pool de dados</span>
                    <span>{attackAttribute}d20</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Margem de crítico</span>
                    <span>{criticalMargin}+ (x{criticalMultiplier})</span>
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
                
                {/* Máquina de Matar indicador */}
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
                <div className="flex items-center justify-center gap-2">
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

                {/* Resultado */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="space-y-2"
                >
                  <p className="text-sm text-muted-foreground">
                    {attackResult.keptDice} + {totalAttackBonus} =
                  </p>
                  <p className={cn(
                    "text-5xl font-display font-bold",
                    attackResult.isCritical && "text-amber-500"
                  )}>
                    {attackResult.total}
                  </p>
                  
                  {/* Hit/Miss comparison - NOVO */}
                  {hitResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                        hitResult === 'hit' 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : "bg-destructive/20 text-destructive"
                      )}
                    >
                      {hitResult === 'hit' ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="font-medium">Acertou! (Def {targetDefense})</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          <span className="font-medium">Errou (Def {targetDefense})</span>
                        </>
                      )}
                    </motion.div>
                  )}
                  
                  {attackResult.isCritical && (
                    <Badge className="bg-amber-500/20 text-amber-500 text-sm px-4 py-1">
                      <Sparkles className="w-4 h-4 mr-1" />
                      CRÍTICO! (x{criticalMultiplier})
                    </Badge>
                  )}
                </motion.div>
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
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase">Dados de Dano</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {damageResult.dice.map((die, i) => (
                      <motion.div
                        key={`main-${i}`}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: i * 0.05, type: 'spring' }}
                        className="w-9 h-9 rounded-lg bg-destructive/20 text-destructive flex items-center justify-center font-display font-bold"
                      >
                        {die}
                      </motion.div>
                    ))}
                    {damageResult.extraDice?.map((die, i) => (
                      <motion.div
                        key={`extra-${i}`}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: (damageResult.dice.length + i) * 0.05, type: 'spring' }}
                        className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-display font-bold"
                      >
                        {die}
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Dados do buff separados - NOVO */}
                {buffDiceResult && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase">
                      {buffDiceResult.ritualName} ({buffDiceResult.element})
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                {buffDiceResult.dice.map((die, i) => {
                        const elementColors = ELEMENT_BUFF_COLORS[buffDiceResult.element] || { bg: 'bg-paranormal/20', text: 'text-paranormal' };
                        return (
                          <motion.div
                            key={`buff-${i}`}
                            initial={{ scale: 0, rotate: -180 as number }}
                            animate={{ scale: 1, rotate: 0 as number }}
                            transition={{ delay: i * 0.05, type: 'spring' }}
                            className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold",
                              elementColors.bg, elementColors.text
                            )}
                          >
                            {die}
                          </motion.div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {buffDiceResult.formula} ({buffDiceResult.enhancement || 'Base'}) = {buffDiceResult.total}
                    </p>
                  </div>
                )}

                {/* Total de dano */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="space-y-1"
                >
                  {damageResult.bonus !== 0 && (
                    <p className="text-sm text-muted-foreground">
                      + {damageResult.bonus} bônus
                    </p>
                  )}
                  <p className={cn(
                    "text-5xl font-display font-bold text-destructive",
                    damageResult.isCritical && "animate-pulse"
                  )}>
                    {damageResult.total}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {weapon.damageType || 'Corte'}
                  </p>
                  
                  {/* Indicadores especiais */}
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {damageResult.isCritical && (
                      <Badge className="bg-amber-500/20 text-amber-500 text-xs">
                        Crítico x{criticalMultiplier}
                      </Badge>
                    )}
                    {damageResult.useMaxDamage && (
                      <Badge className="bg-red-500/20 text-red-400 text-xs">
                        Dano Máximo
                      </Badge>
                    )}
                    {damageResult.potenciaMaximaActive && (
                      <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                        Potência Máxima
                      </Badge>
                    )}
                    {damageResult.assassinarActive && (
                      <Badge className="bg-fuchsia-500/20 text-fuchsia-400 text-xs">
                        Assassinar
                      </Badge>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </MobileDrawerBody>

        <MobileDrawerFooter>
          {phase === 'setup' && (
            <>
              <MobileButtonGroup
                buttons={[
                  {
                    id: 'roll-attack',
                    label: isRolling ? '' : 'Rolar Ataque',
                    icon: isRolling ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                      >
                        <Dices className="w-5 h-5" />
                      </motion.div>
                    ) : <Target className="w-5 h-5" />,
                    onClick: rollAttack,
                    type: 'primary',
                    disabled: !canAffordPE || isRolling,
                  }
                ]}
              />
              <MobileButtonGroup
                buttons={[
                  {
                    id: 'close-setup',
                    label: 'Fechar',
                    icon: <X className="w-4 h-4" />,
                    onClick: handleClose,
                    variant: 'ghost',
                    type: 'secondary',
                  }
                ]}
                className="mt-1"
              />
            </>
          )}
          
          {phase === 'attack' && (
            <>
              {/* REGRA PERSONALIZADA: Crítico NÃO é acerto automático */}
              {(() => {
                // Pode rolar dano apenas se: sem defesa informada OU total >= defesa
                const canRollDamage = targetDefense === null || 
                  (attackResult && attackResult.total >= targetDefense);
                
                if (canRollDamage) {
                  return (
                    <>
                      <MobileButtonGroup
                        buttons={[
                          {
                            id: 'new-attack',
                            label: 'Novo Ataque',
                            icon: <RotateCcw className="w-4 h-4" />,
                            onClick: () => {
                              setPhase('setup');
                              setAttackResult(null);
                            },
                            variant: 'outline',
                            type: 'secondary',
                          },
                          {
                            id: 'roll-damage',
                            label: isRolling ? '' : 'Rolar Dano',
                            icon: isRolling ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                              >
                                <Dices className="w-4 h-4" />
                              </motion.div>
                            ) : <Flame className="w-4 h-4" />,
                            onClick: rollDamageAction,
                            type: 'secondary',
                            disabled: isRolling,
                          }
                        ]}
                      />
                      <MobileButtonGroup
                        buttons={[
                          {
                            id: 'close-attack',
                            label: 'Fechar',
                            icon: <X className="w-4 h-4" />,
                            onClick: handleClose,
                            variant: 'ghost',
                            type: 'secondary',
                          }
                        ]}
                        className="mt-1"
                      />
                    </>
                  );
                } else {
                  return (
                    <>
                      {/* Mensagem de erro quando ataque erra */}
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-center mb-2">
                        <p className="text-sm text-destructive font-medium">Ataque errou</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Nenhum dano a ser rolado
                        </p>
                      </div>
                      <MobileButtonGroup
                        buttons={[
                          {
                            id: 'new-attack-miss',
                            label: 'Tentar Novo Ataque',
                            icon: <RotateCcw className="w-4 h-4" />,
                            onClick: () => {
                              setPhase('setup');
                              setAttackResult(null);
                            },
                            type: 'primary',
                          },
                          {
                            id: 'close-attack-miss',
                            label: 'Fechar',
                            icon: <X className="w-4 h-4" />,
                            onClick: handleClose,
                            variant: 'ghost',
                            type: 'secondary',
                          }
                        ]}
                      />
                    </>
                  );
                }
              })()}
            </>
          )}
          
          {phase === 'damage' && (
            <MobileButtonGroup
              buttons={[
                {
                  id: 'conclude-attack',
                  label: 'Concluir Ataque',
                  icon: <Check className="w-5 h-5" />,
                  onClick: handleClose,
                  type: 'primary',
                },
                {
                  id: 'reroll-damage',
                  label: 'Rolar Dano',
                  icon: <RotateCcw className="w-4 h-4" />,
                  onClick: rollDamageAction,
                  variant: 'outline',
                  type: 'secondary',
                },
                {
                  id: 'new-attack-from-damage',
                  label: 'Novo Ataque',
                  icon: <Sword className="w-4 h-4" />,
                  onClick: () => {
                    setPhase('setup');
                    setAttackResult(null);
                    setDamageResult(null);
                    setBuffDiceResult(null);
                  },
                  variant: 'outline',
                  type: 'secondary',
                }
              ]}
            />
          )}
        </MobileDrawerFooter>
      </MobileDrawerContent>

      {/* Modal de técnicas do Aniquilador */}
      <AniquiladorTechniqueModal
        open={showTechniqueModal}
        onClose={() => setShowTechniqueModal(false)}
        nex={nex}
        currentPE={currentPE}
        onConfirm={handleConfirmTechnique}
        weaponName={weapon?.name || 'Arma'}
      />
    </MobileDrawer>
  );
}
