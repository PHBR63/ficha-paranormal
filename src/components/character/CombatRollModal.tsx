import { parseWeaponDamage as parseDamageString } from '@/lib/weapon-damage-formula';
import { resolveWeaponBurst, burstWeaponDiceCount } from '@/lib/weapon-burst';
import { attackCanRollDamage, type AttackVisibilitySelection } from '@/lib/attack-concealment';
import { resolveConditionId } from '@/lib/conditions/condition-identity';
import { AttackVisibilityControls, AttackConcealmentSummary } from './AttackVisibilityControls';
import { WeaponBurstSelector } from './WeaponBurstSelector';
import { getCompatibleAmmunition, getAmmunitionEffects, type CombatAmmunition } from '@/lib/ammunition-effects';
import { CombatAmmunitionSelector } from './CombatAmmunitionSelector';
import { WeaponModificationNotes } from './WeaponModificationNotes';
import type { ConfirmCombatAttack, CombatCostSelection } from '@/services/combat-attack-service';
import { AttackIntentGate, type AttackGateSelection } from './AttackIntentGate';
/**
 * CombatRollModal - Modal de combate com rolagem de ataque e dano
 * Permite selecionar bônus de classe, poderes paranormais e rituais
 * Detecta crítico dinamicamente baseado na arma e poderes ativos
 */

import { useConfirmedDiceRoll, type ConfirmDicePE } from '@/hooks/useConfirmedDiceRoll';
import { getCombatPowerDicePenalty } from '@/lib/class-powers/combat-test-dice';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Target, Zap, Sparkles, Flame, X, Dices, Shield, Skull, Info, Plus, Minus, RotateCcw, Clock, RefreshCw, Timer, Infinity as InfinityIcon, Droplets, Crosshair, AlertCircle } from '@/components/icons/ordem-icons';
import { SpecialAttackSelector, useSpecialAttackState } from './SpecialAttackSelector';
import { useMirarAction } from '@/hooks/useMirarAction';
import {
  getSpecialAttackOptions,
  calculateSpecialAttackFinal,
  hasSpecialAttack,
  hasForcaBrutaAbility,
  isMeleeWeapon,
} from '@/lib/class-powers/special-attack-utils';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getAttributeDicePool } from '@/lib/attribute-dice-pool';
import { getConditionTestDicePenalty } from '@/lib/conditions/condition-test-penalty';
import { rollSkillTest, rollDamage, DiceRollResult } from '@/lib/dice-roller';
// Integração SUE: useCombatRollWithSUE encapsula rollAttackWithContext e rollDamageWithContext
// com integração completa ao SUE para bônus automáticos
import { useCombatRollWithSUE, type WeaponEntryCompat } from '@/hooks/use-combat-roll-with-sue';
import { validateSneakAttackDeclaration, type SneakAttackDeclaration } from '@/lib/sneak-attack-context';
import { ComputedEffects } from '@/lib/unified-effects-engine';
import { getWeaponDamageEffects, hasLongFirearmDamage, withoutHandledCombatEffects } from '@/lib/effects/weapon-damage-effects';
import { getSkillBonus } from '@/lib/character-data';
import { useRitualBonusesForCombat, useRitualCombatBonuses, SustainedRitualInput, WeaponBuff, ELEMENT_BUFF_COLORS, useCombatFeedback } from '@/hooks';
import { formatDamageFormula as formatBuffDamage } from '@/lib/rituals/legacy-exports';
import { formatDamageFormula } from '@/lib/rituals/legacy-exports';
import { getTrackCombatBonuses } from '@/lib/effects/track-effects-adapter';
import type { AttributeType } from '@/lib/unified-effects-engine';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { StackingExclusionIndicator, type ExcludedEffectInfo } from './StackingExclusionIndicator';
import { AniquiladorTechniqueModal, TechniqueEffects } from './AniquiladorTechniqueModal';
import { checkWeaponProficiency, type ProficiencyCheckResult } from '@/lib/proficiency-utils';

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
  baseRange?: string;
  critical?: string;
  criticalMultiplier?: string;
  special?: string;
  notes?: string;
  ammoType?: string;
  catalogId?: string;
  weaponType?: string;
  properties?: string[];
  appliedModifications?: string[];
  modificationAttackBonus?: number;
  modificationEffects?: string[];
  // Aniquilador: indica se esta arma é a favorita
  isFavoriteWeapon?: boolean;
  favoriteAbilityId?: string;
  // Categoria da arma para proficiência (0=Simples, I=Tática, II=Pesada)
  category?: '0' | 'I' | 'II';
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
  characterId?: string;
  combatControlled?: boolean;
  expectedTurnKey?: string | null;
  campaignId?: string | null;
  onClose: (pendingAttack?: boolean) => void;
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
  onPEChange: ConfirmDicePE;
  onConfirmAttack?: ConfirmCombatAttack;
  onMirarRegistered?: () => Promise<unknown>;
  temporaryPE?: number;
  confirmationUnavailable?: string;
  
  // Dados de classe e poderes
  characterClass: string;
  classTrack?: string; // Trilha do personagem (ex: 'aniquilador')
  abilities: string[];
  paranormalPowers: Array<{ id: string; name: string; element: string }>;
  hasAffinity: boolean;
  affinityElement?: string | null;
  sustainedRituals?: SustainedRitualInput[]; // Agora usa rituais sustentados
  nex: number;
  
  // Aniquilador: indica se a arma atual é a favorita
  isFavoriteWeapon?: boolean;
  
  // NOVO: Bônus pré-calculados do sistema unificado de poderes de classe
  classPowerBonuses?: ClassPowerCombatBonuses;
  
  // NOVO: Efeitos consolidados do Sistema Unificado de Efeitos (SUE)
  unifiedEffects?: ComputedEffects;
  
  // Bônus condicionais avançados (Fase 4)
  advancedBonuses?: AdvancedConditionalBonuses;
  
  // Condições ativas do personagem (para exibir penalidades de condição)
  activeConditions?: string[];
  
  // NOVO: Bônus condicionais ativos (Combate Defensivo, Sentido Tático, etc.)
  activeConditionalBonuses?: string[];
  
  // Buffs de arma ativos (Amaldiçoar Arma, etc.)
  weaponBuffs?: WeaponBuff[];
  
  // Efeitos de trilha ativados (para processar bônus automáticos)
  activatedTrackEffects?: string[];
  
  // === SUE HARDENING ===
  // Efeitos excluídos por stacking (para indicadores visuais)
  excludedEffects?: Array<{
    effect: { id: string; name: string; source: string };
    reason: string;
    replacedBy: string;
  }>;
  
  // === ORIGENS ===
  // ID da origem do personagem (ex: 'militar', 'operario')
  characterOrigin?: string;
  // Arma vinculada pela origem (Operário - Ferramenta de Trabalho)
  originBoundWeaponId?: string;
  
  // Callback
  ammunition?: CombatAmmunition[];
  onRollComplete?: (result: DiceRollResult) => void;
}

// Fases do combate
type CombatPhase = 'setup' | 'attack' | 'damage' | 'complete';

// Função para parsear string de dano (ex: "2d6+3")


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
  characterId,
  combatControlled = false,
  expectedTurnKey,
  campaignId,
  onClose,
  weapon,
  attributes,
  skills,
  currentPE,
  maxPE,
  onPEChange,
  onConfirmAttack,
  onMirarRegistered,
  temporaryPE = 0,
  confirmationUnavailable,
  characterClass,
  classTrack = '',
  abilities,
  paranormalPowers,
  hasAffinity,
  affinityElement,
  sustainedRituals = [],
  nex,
  isFavoriteWeapon = false,
  classPowerBonuses, // Bônus pré-calculados do sistema de poderes
  unifiedEffects: sheetEffects,
  advancedBonuses = {},
  weaponBuffs = [], // Buffs de arma ativos
  activeConditions = [], // Condições ativas para exibição
  activeConditionalBonuses = [], // Bônus condicionais ativos (Combate Defensivo, etc.)
  activatedTrackEffects = [], // Efeitos de trilha ativados
  excludedEffects = [], // SUE Hardening: Efeitos excluídos por stacking
  characterOrigin, // ID da origem do personagem
  originBoundWeaponId, // Arma vinculada pela origem (Operário)
  onRollComplete,
  ammunition = [],
}: CombatRollModalProps) {
  const mirar = useMirarAction(characterId, weapon?.id, open);
  const handledCombatEffectIds = useMemo(() =>
    classTrack?.toLowerCase().includes('aniquilador') && nex >= 99
      ? ['track-maquina-de-matar'] : [], [classTrack, nex]);
  const unifiedEffects = useMemo(() => withoutHandledCombatEffects(
    getWeaponDamageEffects(sheetEffects, weapon), handledCombatEffectIds,
  ), [sheetEffects, weapon, handledCombatEffectIds]);
  // === HOOK DE COMBATE INTEGRADO COM SUE ===
  // Provê funções executeAttackRoll e executeDamageRoll que automaticamente
  // aplicam todos os bônus do SUE (origem, trilha, poderes, rituais, condições).
  // O hook também expõe getAttackBonusBreakdown e getDamageBonusBreakdown para UI.
  const combatRollWithSUE = useCombatRollWithSUE({
    characterClass,
    classTrack,
    nex,
    attributes,
    skills,
    abilities,
    classPowers: abilities, // Poderes de classe são incluídos em abilities
    generalPowers: [],
    paranormalPowers,
    unifiedEffects,
    activeConditions: activeConditions,
    activatedPowers: activeConditionalBonuses,
    activeConditionalBonuses,
  });
  
  // Breakdowns pré-calculados do SUE para exibição na UI
  const sueAttackBreakdown = useMemo(() => {
    if (!weapon) return null;
    return combatRollWithSUE.getAttackBonusBreakdown(weapon as WeaponEntryCompat);
  }, [weapon, combatRollWithSUE]);
  
  const sueDamageBreakdown = useMemo(() => {
    if (!weapon) return null;
    return combatRollWithSUE.getDamageBonusBreakdown(weapon as WeaponEntryCompat);
  }, [weapon, combatRollWithSUE]);
  
  // Bônus de rituais sustentados processados automaticamente
  const ritualBonuses = useRitualBonusesForCombat(sustainedRituals);
  const ritualCombatSummary = useRitualCombatBonuses(sustainedRituals);
  
  // === PROCESSAR BÔNUS DA TRILHA (10 trilhas de Combatente/Especialista) ===
  // Detecta tipo de ataque baseado na arma
  const attackType: 'melee' | 'ranged' = useMemo(() => {
    if (!weapon) return 'melee';
    return weapon.type === 'Disparo' || weapon.type === 'Arremesso' ? 'ranged' : 'melee';
  }, [weapon]);
  
  // Converte atributos para o formato esperado pelo adapter
  const attributesForTrack: Record<AttributeType, number> = useMemo(() => ({
    agility: attributes.agility,
    strength: attributes.strength,
    presence: attributes.presence,
    intellect: attributes.intellect,
    vigor: attributes.vigor,
  }), [attributes]);
  
  // Combina efeitos de trilha ativados com bônus condicionais que têm prefixo track-
  // Isso garante que quando o usuário ativa pelo painel de bônus condicionais, o efeito seja aplicado
  const combinedActivatedEffects = useMemo(() => {
    const effectIds = new Set(activatedTrackEffects);
    // Adiciona IDs de bônus condicionais que são efeitos de trilha
    activeConditionalBonuses.forEach(id => {
      if (id.startsWith('track-')) {
        effectIds.add(id);
      }
    });
    return Array.from(effectIds);
  }, [activatedTrackEffects, activeConditionalBonuses]);
  
  // Obtém bônus de trilha consolidados
  const trackCombatBonuses = useMemo(() => {
    return getTrackCombatBonuses(
      classTrack,
      nex,
      attributesForTrack,
      attackType,
      combinedActivatedEffects,
      {
        representedEffectIds: unifiedEffects?.damage.breakdown.flatMap(entry => entry.effectId ? [entry.effectId] : []) ?? [],
        isLongFirearm: hasLongFirearmDamage(weapon),
        handledEffectIds: handledCombatEffectIds,
      },
    );
  }, [classTrack, nex, attributesForTrack, attackType, combinedActivatedEffects, unifiedEffects, weapon, handledCombatEffectIds]);
  
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
    useMaxDamage?: boolean;
    potenciaMaximaActive?: boolean;
    assassinarActive?: boolean;
  } | null>(null);
  
  // Estado separado para dados do buff (Amaldiçoar Arma, etc.)
  const [buffDiceResult, setBuffDiceResult] = useState<{
    dice: number[];
    formula: string;      // "1d6", "2d6", "4d6"
    element: string;
    ritualName: string;
    enhancement: string | null; // "Discente", "Verdadeiro" ou null para base
    total: number;
  } | null>(null);
  
  // Estados dos modificadores manuais (bônus do mestre)
  const [manualAttackMod, setManualAttackMod] = useState(0);
  const [manualDamageMod, setManualDamageMod] = useState(0);
  const [targetDefense, setTargetDefense] = useState<number | null>(null);
  const [gateSelection, setGateSelection] = useState<AttackGateSelection>({ mode: 'waiting' });
  const intentRequired = !!(combatControlled && campaignId && characterId);
  const [visibility, setVisibility] = useState<AttackVisibilitySelection>({ level: 'none', confirmed: false, totalCover: false });
  const attackerBlind = activeConditions.some(id => resolveConditionId(id) === 'cego');
  const visibilityUnavailable = visibility.totalCover || ((visibility.level !== 'none' || attackerBlind) && !visibility.confirmed)
    || ((visibility.level !== 'none' || attackerBlind) && !onConfirmAttack);
  
  // === ESTADO PARA TÉCNICAS DO ANIQUILADOR ===
  const [showTechniqueModal, setShowTechniqueModal] = useState(false);
  const [activeTechniqueEffects, setActiveTechniqueEffects] = useState<TechniqueEffects | null>(null);
  
  // === ESTADO PARA ATAQUE ESPECIAL (Combatente) ===
  const { config: specialAttackConfig, setConfig: setSpecialAttackConfig, reset: resetSpecialAttack } = useSpecialAttackState();
  
  // === ESTADO PARA ATAQUE FURTIVO (Infiltrador) ===
  const { config: sneakAttackConfig, setConfig: setSneakAttackConfig, reset: resetSneakAttack } = useSneakAttackState();
  
  // === ESTADO PARA DISPARO LETAL (Atirador de Elite) ===
  const { config: disparoLetalConfig, setConfig: setDisparoLetalConfig, resetDisparoLetal } = useDisparoLetalState();
  
  // Verifica se é Infiltrador
  const isInfiltrador = useMemo(() => 
    classTrack?.toLowerCase().includes('infiltrador'),
  [classTrack]);
  const sneakAttackError = isInfiltrador && sneakAttackConfig.enabled
    ? !onConfirmAttack ? 'Ataque Furtivo exige confirmação pelo servidor.'
      : targetDefense === null ? 'Informe a Defesa do alvo para cobrar Ataque Furtivo somente no acerto.'
        : !Number.isSafeInteger(targetDefense) || targetDefense < 0 || targetDefense > 1000
          ? 'Defesa do alvo inválida. Informe um valor entre 0 e 1000.'
        : validateSneakAttackDeclaration(weapon, sneakAttackConfig.declaration)
    : null;
  
  // Verifica se é Atirador de Elite
  const isAtiradorElite = useMemo(() => 
    classTrack?.toLowerCase().includes('atirador') && classTrack?.toLowerCase().includes('elite'),
  [classTrack]);
  
  // Detecta se pode usar Técnica Secreta (Aniquilador NEX 40%+ com arma favorita)
  const canUseTechniqueSecreta = useMemo(() => {
    const isAniquilador = classTrack?.toLowerCase().includes('aniquilador');
    return isAniquilador && nex >= 40 && isFavoriteWeapon;
  }, [classTrack, nex, isFavoriteWeapon]);
  
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

  const attackConfirmation = useConfirmedDiceRoll();
  const preparingAttack = useRef(false);
  const [burstEnabled, setBurstEnabled] = useState(false);
  useEffect(() => {
    setBurstEnabled(false);
    setVisibility(value => ({ ...value, confirmed: false }));
    resetSneakAttack();
  }, [open, weapon?.id, resetSneakAttack]);
  const burst = resolveWeaponBurst(weapon, burstEnabled);

  // Reset ao abrir/fechar
  const handleClose = () => {
    if (attackConfirmation.confirming || (attackConfirmation.pending && !attackConfirmation.error)) return;
    // Uma resposta incerta pode ter consumido PE: o pai guarda esta arma e reabre a mesma intenção.
    if (attackConfirmation.pending) { onClose(true); return; }
    attackConfirmation.reset();
    setPhase('setup');
    setBurstEnabled(false);
    setVisibility(value => ({ ...value, confirmed: false }));
    setSelectedBonuses([]);
    setAttackResult(null);
    setDamageResult(null);
    setBuffDiceResult(null);
    setManualAttackMod(0);
    setManualDamageMod(0);
    setTargetDefense(null);
    setVisibility({ level: 'none', confirmed: false, totalCover: false });
    setActiveTechniqueEffects(null);
    resetSpecialAttack();
    resetSneakAttack();
    resetDisparoLetal();
    onClose();
  };
  
  // Handler para confirmar técnicas do Aniquilador
  // Selecionar prepara o custo; o débito pertence à confirmação do ataque.
  const handleConfirmTechnique = useCallback((effects: TechniqueEffects) => {
    setActiveTechniqueEffects(effects);
  }, []);

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

  const rangedAttack = weapon?.type === 'Disparo' || weapon?.type === 'Arremesso';
  const attackBaseDicePenalty = getConditionTestDicePenalty(activeConditions,
    rangedAttack ? 'agility' : 'strength', attackSkill.name, rangedAttack ? 'ranged' : 'melee')
    + getCombatPowerDicePenalty([...activeConditionalBonuses, ...selectedBonuses]);
  const attackDicePenalty = attackBaseDicePenalty + burst.dicePenalty;
  const attackDicePool = getAttributeDicePool(attackAttribute, attackDicePenalty);

  // Calcular bônus disponíveis baseado nas habilidades do personagem
  // NOTA: Ataque Especial agora é gerenciado pelo SpecialAttackSelector (distribuição flexível)
  const availableBonuses = useMemo((): CombatBonus[] => {
    const bonuses: CombatBonus[] = [];

    // === BÔNUS DE CLASSE ===
    // (Ataque Especial removido - agora usa SpecialAttackSelector com distribuição flexível)

    // Golpe Pesado é PASSIVO - aplicado automaticamente no rollDamage (não precisa de toggle)

    // Combater com Duas Armas (Combatente) - Penalidade de -1d20 no ataque
    // IMPORTANTE: Se ativo via activeConditionalBonuses, é aplicado automaticamente
    // Se NÃO ativo, aparece como opção selecionável
    const isCombaterDuasArmasActive = activeConditionalBonuses.includes('combater-duas-armas');
    if (abilities.some(a => 
      a.toLowerCase().includes('combater com duas armas') || 
      a.toLowerCase().includes('combater duas armas')
    )) {
      if (isCombaterDuasArmasActive) {
        // Já ativado pelo painel - será aplicado automaticamente abaixo
        // Não adiciona aos bônus selecionáveis
      } else {
        // Ainda não ativado - mostra como opção selecionável
        bonuses.push({
          id: 'combater-duas-armas',
          name: 'Combater com Duas Armas (-1d20 ataque)',
          source: 'class',
          peCost: 0,
          description: 'Dois ataques com duas armas. Penalidade de -1d20 em todos os testes de ataque até o próximo turno.',
        });
      }
    }

    // Combate Defensivo (Combatente) - Penalidade de -1d20 no ataque, +5 Defesa
    // IMPORTANTE: Se ativo via activeConditionalBonuses, é aplicado automaticamente (não selecionável)
    // Se NÃO ativo, aparece como opção selecionável
    const isCombateDefensivoActive = activeConditionalBonuses.includes('combate-defensivo');
    if (abilities.some(a => 
      a.toLowerCase().includes('combate defensivo')
    )) {
      if (isCombateDefensivoActive) {
        // Já ativado pelo painel - será aplicado automaticamente abaixo
        // Não adiciona aos bônus selecionáveis
      } else {
        // Ainda não ativado - mostra como opção selecionável
        bonuses.push({
          id: 'combate-defensivo',
          name: 'Combate Defensivo (-1d20 ataque, +5 Def)',
          source: 'class',
          peCost: 0,
          description: 'Sofre -1d20 em ataques, mas recebe +5 na Defesa até o próximo turno.',
        });
      }
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
  }, [abilities, paranormalPowers, hasAffinity, affinityElement, weapon, attributes, ritualBonuses, activeConditionalBonuses]);

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

  // Calcular custo total de PE (incluindo Ataque Especial)
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
    
    // Adicionar custo do Ataque Especial se ativo
    if (specialAttackConfig.enabled) {
      total += specialAttackResult.peCost;
    }
    
    // Adicionar custo do Ataque Furtivo se ativo (Infiltrador)
    if (isInfiltrador && sneakAttackConfig.enabled) {
      total += sneakAttackResult.peCost;
    }
    
    return total + (activeTechniqueEffects?.peCost ?? 0);
  }, [activeTechniqueEffects?.peCost, selectedBonuses, availableBonuses, specialAttackConfig.enabled, specialAttackResult.peCost, isInfiltrador, sneakAttackConfig.enabled, sneakAttackResult.peCost]);

  // Verificar se pode pagar o PE
  const canAffordPE = currentPE + temporaryPE >= totalPECost;

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

  // Calcular bônus total de ataque (inclui bônus do SUE, trilha, weapon buffs e modificador manual)
  const totalAttackBonus = useMemo(() => {
    let total = attackSkill.bonus + (weapon?.modificationAttackBonus ?? 0);
    const isMeleeAttack = weapon?.type === 'Corpo a Corpo' || weapon?.type === 'Briga';
    
    // === BÔNUS DO SISTEMA UNIFICADO DE EFEITOS (SUE) ===
    // Inclui origem, trilha, condições e rituais consolidados
    if (unifiedEffects) {
      // Bônus geral de ataque
      total += unifiedEffects.attack.general;
      // Bônus específico por tipo de ataque
      if (isMeleeAttack) {
        total += unifiedEffects.attack.melee;
      } else {
        total += unifiedEffects.attack.ranged;
      }
    }
    
    // === BÔNUS DE TRILHA (via track-effects-adapter) ===
    // Aplica bônus de ataque de habilidades de trilha ativas
    if (trackCombatBonuses.attackBonus > 0) {
      total += trackCombatBonuses.attackBonus;
    }
    
    // Adicionar bônus passivos de poderes de classe (sistema legado - backup)
    if (classPowerBonuses?.attackBonus && !unifiedEffects) {
      total += classPowerBonuses.attackBonus;
    }
    
    // Adicionar bônus de weapon buffs (Amaldiçoar Arma, etc.)
    if (weaponBuffBonuses.attackBonus) {
      total += weaponBuffBonuses.attackBonus;
    }
    
    // Adicionar bônus passivos (rituais sustentados manuais, etc.)
    passiveBonuses.forEach(b => {
      if (b.attackBonus) total += b.attackBonus;
    });
    
    // Adicionar bônus selecionados
    selectedBonuses.forEach(bonusId => {
      const bonus = availableBonuses.find(b => b.id === bonusId);
      if (bonus?.attackBonus) total += bonus.attackBonus;
    });
    
    // === BÔNUS DO ATAQUE ESPECIAL (distribuição flexível) ===
    if (specialAttackConfig.enabled && specialAttackResult.attackBonus > 0) {
      total += specialAttackResult.attackBonus;
    }
    
    // Adicionar modificador manual do mestre
    total += manualAttackMod;
    
    // === PENALIDADE DE COMBATE DEFENSIVO (se ativo via painel) ===
    // A penalidade deste poder está no pool de dados, acima.
    
    // === PENALIDADE DE COMBATER COM DUAS ARMAS (se ativo via painel) ===
    // A penalidade deste poder está no pool de dados, acima.
    
    // === PENALIDADE DE PROFICIÊNCIA ===
    // Regra oficial: -5 no ataque se não tiver proficiência adequada
    if (!proficiencyCheck.hasProficiency) {
      total += proficiencyCheck.penalty; // -5
    }
    
    return total;
  }, [attackSkill.bonus, passiveBonuses, selectedBonuses, availableBonuses, classPowerBonuses, manualAttackMod, weaponBuffBonuses, unifiedEffects, weapon, trackCombatBonuses, specialAttackConfig.enabled, specialAttackResult.attackBonus, proficiencyCheck]);

  // === Detalhamento das fontes de bônus de ataque para exibição ===
  const [selectedAmmunitionId, setSelectedAmmunitionId] = useState('');
  useEffect(() => { if (open) setSelectedAmmunitionId(''); }, [open, weapon?.id]);
  const compatibleAmmunition = getCompatibleAmmunition(weapon ?? {}, ammunition);
  const selectedAmmunition = compatibleAmmunition.find(item => item.id === selectedAmmunitionId);
  const ammunitionEffects = getAmmunitionEffects(selectedAmmunition);
  const requiresCalibreGrosso = weapon?.appliedModifications?.includes('calibre_grosso') ?? false;
  const ammunitionUnavailable = (requiresCalibreGrosso || !!selectedAmmunitionId) && !selectedAmmunition;

  const attackBonusSources = useMemo(() => {
    const sources: BonusSourceDisplay[] = [];
    if (weapon?.modificationAttackBonus) sources.push({ label: 'Modificações da arma', value: weapon.modificationAttackBonus, type: 'other', description: 'Certeira ou Alongada: bônus do item salvo no inventário.' });
    const isMeleeAttack = weapon?.type === 'Corpo a Corpo' || weapon?.type === 'Briga';
    
    // Bônus de perícia (treinamento)
    if (attackSkill.bonus > 0) {
      sources.push({ 
        label: attackSkill.name, 
        value: attackSkill.bonus, 
        type: 'skill',
        description: `Treinamento na perícia ${attackSkill.name}`,
      });
    }
    
    // === BÔNUS DO SUE (origem, trilha, condições) ===
    if (unifiedEffects) {
      // Bônus geral de ataque do SUE
      if (unifiedEffects.attack.general !== 0) {
        // Mostrar breakdown detalhado
        unifiedEffects.attack.breakdown.forEach(entry => {
          sources.push({
            label: entry.source,
            value: entry.value,
            type: entry.conditional ? 'track' : 'track',
            description: entry.conditional || `Bônus de ${entry.source}`,
          });
        });
      }
      // Bônus específico melee/ranged
      const specificBonus = isMeleeAttack ? unifiedEffects.attack.melee : unifiedEffects.attack.ranged;
      if (specificBonus !== 0) {
        sources.push({
          label: isMeleeAttack ? 'Bônus Corpo a Corpo' : 'Bônus à Distância',
          value: specificBonus,
          type: 'track',
          description: `Bônus específico para ataques ${isMeleeAttack ? 'corpo a corpo' : 'à distância'}`,
        });
      }
    }
    
    // === BÔNUS DE TRILHA (via track-effects-adapter) ===
    if (trackCombatBonuses.attackBonus > 0) {
      sources.push({
        label: 'Trilha',
        value: trackCombatBonuses.attackBonus,
        type: 'track',
        description: 'Bônus de ataque de habilidades de trilha ativas',
      });
    }
    
    // Bônus de poderes de classe (sistema legado - backup se SUE não estiver ativo)
    if (!unifiedEffects && classPowerBonuses?.attackBonus && classPowerBonuses.attackBonus > 0) {
      sources.push({ 
        label: 'Poder de Classe', 
        value: classPowerBonuses.attackBonus, 
        type: 'power',
        description: 'Bônus de ataque de poderes de classe ativos (ex: Ataque Especial, Golpe Brutal)',
      });
    }
    
    // Bônus passivos de rituais sustentados manuais
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
    
    // === BÔNUS DO ATAQUE ESPECIAL (distribuição flexível) ===
    if (specialAttackConfig.enabled && specialAttackResult.attackBonus > 0) {
      sources.push({
        label: 'Ataque Especial',
        value: specialAttackResult.attackBonus,
        type: 'power',
        description: specialAttackResult.breakdown.filter(b => b.includes('ataque')).join('; ') || 
          `+${specialAttackResult.attackBonus} no ataque`,
      });
    }
    
    // Modificador manual do mestre
    if (manualAttackMod !== 0) {
      sources.push({
        label: 'Modificador do Mestre',
        value: manualAttackMod,
        type: 'other',
        description: 'Bônus ou penalidade situacional definido pelo mestre (cobertura, terreno, etc.)',
      });
    }
    
    // === PENALIDADE DE PROFICIÊNCIA ===
    if (!proficiencyCheck.hasProficiency) {
      sources.push({
        label: `Sem ${proficiencyCheck.missingProficiency}`,
        value: proficiencyCheck.penalty,
        type: 'other',
        description: `Penalidade por usar arma sem proficiência em ${proficiencyCheck.missingProficiency}`,
      });
    }
    
    // === PENALIDADE DE COMBATE DEFENSIVO (se ativo via painel) ===
    // A penalidade deste poder está no pool de dados, acima.
    
    // === PENALIDADE DE COMBATER COM DUAS ARMAS (se ativo via painel) ===
    // A penalidade deste poder está no pool de dados, acima.
    
    // === TÉCNICAS DO ANIQUILADOR ATIVAS ===
    // Exibe as técnicas selecionadas para que o usuário saiba que estão aplicadas
    if (activeTechniqueEffects && activeTechniqueEffects.selectedTechniques.length > 0) {
      // Lista as técnicas ativas (para informação visual - bônus de crítico são aplicados separadamente)
      const techniqueNames = activeTechniqueEffects.selectedTechniques.map(id => {
        switch (id) {
          case 'amplo': return 'Amplo';
          case 'destruidor': return 'Destruidor';
          case 'letal': return `Letal${activeTechniqueEffects.letalCount > 1 ? ` (${activeTechniqueEffects.letalCount}x)` : ''}`;
          case 'perfurante': return 'Perfurante';
          default: return id;
        }
      });
      sources.push({
        label: 'Técnicas Aniquilador',
        value: techniqueNames.join(', '),
        type: 'track',
        sourceName: 'Trilha Aniquilador',
        description: `Técnicas ativas: ${techniqueNames.join(', ')}. Bônus aplicados ao crítico e efeitos especiais.`,
      });
    }
    
    return sources;
  }, [activeTechniqueEffects, attackSkill, classPowerBonuses, passiveBonuses, selectedBonuses, availableBonuses, manualAttackMod, weaponBuffBonuses, unifiedEffects, weapon, trackCombatBonuses, specialAttackConfig.enabled, specialAttackResult, proficiencyCheck, activeConditionalBonuses]);

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
    
    // === BÔNUS DO SUE (origem, trilha, condições) ===
    if (unifiedEffects) {
      // Bônus geral de dano
      if (unifiedEffects.damage.general !== 0 || unifiedEffects.damage.breakdown.length > 0) {
        unifiedEffects.damage.breakdown.filter(entry =>
          (entry.conditional !== 'corpo a corpo' || isMelee) && (entry.conditional !== 'distância' || !isMelee)
        ).forEach(entry => {
          sources.push({
            label: entry.source,
            value: entry.value,
            type: 'track',
            description: entry.conditional || `Bônus de dano de ${entry.source}`,
          });
        });
      }
      // Bônus específico melee/ranged
      const specificDamage = isMelee ? unifiedEffects.damage.melee : unifiedEffects.damage.ranged;
      if (specificDamage !== 0 && !unifiedEffects.damage.breakdown.some(entry => entry.conditional === (isMelee ? 'corpo a corpo' : 'distância'))) {
        sources.push({
          label: isMelee ? 'Dano Corpo a Corpo' : 'Dano à Distância',
          value: specificDamage,
          type: 'track',
          description: `Bônus de dano específico para ataques ${isMelee ? 'corpo a corpo' : 'à distância'}`,
        });
      }
      // Dados extras do SUE
      // Traduz marcador "NW" para dado real da arma
      if (unifiedEffects.damage.extraDice.length > 0) {
        const weaponDieSize = weapon?.damage ? parseDamageString(weapon.damage).size : 6;
        const translatedDice = unifiedEffects.damage.extraDice.map(dice => {
          const weaponDieMatch = dice.match(/^(\d+)W$/i);
          return weaponDieMatch ? `${weaponDieMatch[1]}d${weaponDieSize}` : dice;
        });
        sources.push({
          label: 'Dados Extras (SUE)',
          value: translatedDice.join(' + '),
          type: 'track',
          description: 'Dados de dano extras de origem, trilha ou condições',
        });
      }
    }
    
    // === BÔNUS DE TRILHA (via track-effects-adapter) ===
    if (trackCombatBonuses.damageBonus > 0) {
      sources.push({
        label: 'Trilha (Dano)',
        value: trackCombatBonuses.damageBonus,
        type: 'track',
        description: 'Bônus de dano de habilidades de trilha ativas',
      });
    }
    
    // Dados extras de trilha
    // Traduz marcador "NW" para dado real da arma
    if (trackCombatBonuses.extraDamageDice.length > 0) {
      const weaponDieSize = weapon?.damage ? parseDamageString(weapon.damage).size : 6;
      const translatedDice = trackCombatBonuses.extraDamageDice.map(dice => {
        const weaponDieMatch = dice.match(/^(\d+)W$/i);
        return weaponDieMatch ? `${weaponDieMatch[1]}d${weaponDieSize}` : dice;
      });
      sources.push({
        label: 'Trilha (Dados)',
        value: translatedDice.join(' + '),
        type: 'track',
        description: 'Dados de dano extras de habilidades de trilha',
      });
    }
    
    // Bônus de poderes de classe (sistema legado - backup)
    if (!unifiedEffects && classPowerBonuses?.damageBonus && classPowerBonuses.damageBonus > 0) {
      sources.push({ 
        label: 'Poder de Classe', 
        value: classPowerBonuses.damageBonus, 
        type: 'power',
        description: 'Bônus de dano de poderes de classe ativos (ex: Ataque Especial, Golpe Pesado)',
      });
    }
    
    // Dados extras de poderes de classe (sistema legado - backup)
    // Traduz marcador "NW" para dado real da arma
    if (!unifiedEffects && classPowerBonuses?.extraDamageDice && classPowerBonuses.extraDamageDice.length > 0) {
      const weaponDieSize = weapon?.damage ? parseDamageString(weapon.damage).size : 6;
      const translatedDice = classPowerBonuses.extraDamageDice.map(dice => {
        const weaponDieMatch = dice.match(/^(\d+)W$/i);
        return weaponDieMatch ? `${weaponDieMatch[1]}d${weaponDieSize}` : dice;
      });
      sources.push({ 
        label: 'Dados Extras', 
        value: translatedDice.join(' + '), 
        type: 'power',
        description: 'Dados de dano extras de poderes de classe (ex: Golpe Pesado)',
      });
    }
    
    // === GOLPE PESADO (passivo, corpo a corpo) ===
    const hasGolpePesado = abilities.some(a => a.toLowerCase().includes('golpe pesado'));
    if (hasGolpePesado && isMelee) {
      sources.push({
        label: 'Golpe Pesado',
        value: `+1d${weapon?.damage ? parseDamageString(weapon.damage).size : '?'}`,
        type: 'power',
        description: 'Passivo: +1 dado do mesmo tipo da arma corpo a corpo',
      });
    }
    
    // Bônus passivos de rituais sustentados manuais
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
    
    // === BÔNUS DO ATAQUE ESPECIAL (distribuição flexível) ===
    if (specialAttackConfig.enabled && specialAttackResult.damageBonus > 0) {
      sources.push({
        label: 'Ataque Especial',
        value: specialAttackResult.damageBonus,
        type: 'power',
        description: specialAttackResult.breakdown.filter(b => b.includes('dano')).join('; ') || 
          `+${specialAttackResult.damageBonus} no dano`,
      });
    }
    
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
  }, [weapon, attributes, classPowerBonuses, passiveBonuses, selectedBonuses, availableBonuses, manualDamageMod, weaponBuffBonuses, unifiedEffects, trackCombatBonuses, specialAttackConfig.enabled, specialAttackResult, abilities]);

  // === MÁQUINA DE MATAR (Aniquilador NEX 99%) ===
  // Bônus automáticos quando atacando com arma favorita em NEX 99%
  const maquinaDeMatarActive = useMemo(() => {
    const isAniquilador = classTrack?.toLowerCase().includes('aniquilador');
    return isAniquilador && nex >= 99 && isFavoriteWeapon;
  }, [classTrack, nex, isFavoriteWeapon]);

  // Calcular margem de crítico efetiva (incluindo SUE, weapon buffs, Máquina de Matar, Técnicas e Técnica Letal)
  const effectiveCritical = useMemo(() => {
    if (!weapon) return 20;
    let critical = parseInt(weapon.critical || '20');
    const isMeleeAttack = weapon?.type === 'Corpo a Corpo' || weapon?.type === 'Briga';
    
    // === TÉCNICA LETAL (Guerreiro NEX 10%): +2 margem de ameaça corpo a corpo ===
    // Aplicação explícita para garantir que funcione independente do SUE
    const isGuerreiro = classTrack?.toLowerCase().includes('guerreiro');
    if (isGuerreiro && nex >= 10 && isMeleeAttack) {
      critical -= 2;
    }
    
    // === BÔNUS DO SUE ===
    // Só aplica se não for Guerreiro (para evitar duplicação, já que Técnica Letal é aplicada acima)
    if (unifiedEffects && !isGuerreiro) {
      critical -= unifiedEffects.critical.marginBonus;
    } else if (unifiedEffects && isGuerreiro) {
      // Para Guerreiro, aplica apenas bônus não relacionados à Técnica Letal
      // (outros efeitos de margem de crítico que não sejam da trilha)
      const nonTrackCriticalBonus = unifiedEffects.critical.breakdown?.filter(
        b => !b.source.toLowerCase().includes('técnica letal')
      ).reduce((sum, b) => sum + b.value, 0) || 0;
      critical -= nonTrackCriticalBonus;
    } else if (classPowerBonuses?.criticalMarginBonus && !isGuerreiro) {
      // Sistema legado - backup (só se não for Guerreiro)
      // A síntese legada já contém Máquina de Matar, tratada pela arma favorita abaixo.
      critical -= Math.max(0, classPowerBonuses.criticalMarginBonus
        - (handledCombatEffectIds.includes('track-maquina-de-matar') ? 2 : 0));
    }
    
    // Aplicar bônus de weapon buffs (Amaldiçoar Arma, etc.)
    if (weaponBuffBonuses.criticalBonus) {
      critical -= weaponBuffBonuses.criticalBonus;
    }
    
    // Reduzir margem com bônus de crítico (passivos de rituais sustentados, etc.)
    passiveBonuses.forEach(b => {
      if (b.criticalBonus) critical -= b.criticalBonus;
    });
    
    // === MÁQUINA DE MATAR (Aniquilador NEX 99%): +2 margem de ameaça ===
    if (maquinaDeMatarActive) {
      critical -= 2;
    }
    
    // === TÉCNICAS DO ANIQUILADOR: Letal (+2 ou +5 margem) ===
    if (activeTechniqueEffects?.criticalMarginBonus) {
      critical -= activeTechniqueEffects.criticalMarginBonus;
    }
    
    // === BÔNUS DE TRILHA (via track-effects-adapter) ===
    // Aplica bônus de margem de crítico de habilidades de trilha ativas
    if (trackCombatBonuses.criticalMarginBonus > 0) {
      critical -= trackCombatBonuses.criticalMarginBonus;
    }
    
    // === DISPARO LETAL (Atirador de Elite NEX 40%): +2 margem de ameaça ===
    // Aplicação direta quando ativado no seletor de combate
    if (isAtiradorElite && disparoLetalResult.enabled) {
      critical -= disparoLetalResult.criticalMarginBonus;
    }
    
    return Math.max(1, critical); // Mínimo de 1
  }, [weapon, passiveBonuses, classPowerBonuses, weaponBuffBonuses, unifiedEffects, maquinaDeMatarActive, activeTechniqueEffects, classTrack, nex, trackCombatBonuses, handledCombatEffectIds, isAtiradorElite, disparoLetalResult.enabled, disparoLetalResult.criticalMarginBonus]);

  // Multiplicador de crítico da arma (incluindo SUE, weapon buffs, trilha e Técnicas)
  // Conversão segura para string - pode vir como número ou string
  const criticalMultiplier = useMemo(() => {
    let base = 2;
    if (weapon?.criticalMultiplier !== undefined) {
      const critValue = String(weapon.criticalMultiplier);
      const match = critValue.match(/x?(\d+)/i);
      if (match) {
        base = parseInt(match[1]);
      } else if (!isNaN(Number(weapon.criticalMultiplier))) {
        base = Number(weapon.criticalMultiplier);
      }
    }
    
    // === BÔNUS DO SUE ===
    if (unifiedEffects) {
      base += unifiedEffects.critical.multiplierBonus;
    }
    
    // === BÔNUS DE TRILHA (via track-effects-adapter) ===
    if (trackCombatBonuses.criticalMultiplierBonus > 0) {
      base += trackCombatBonuses.criticalMultiplierBonus;
    }
    
    // Aplicar bônus de multiplicador de weapon buffs
    if (weaponBuffBonuses.criticalMultiplierBonus) {
      base += weaponBuffBonuses.criticalMultiplierBonus;
    }
    
    // === TÉCNICAS DO ANIQUILADOR: Destruidor (+1 multiplicador) ===
    if (activeTechniqueEffects?.criticalMultiplierBonus) {
      base += activeTechniqueEffects.criticalMultiplierBonus;
    }
    
    return base + ammunitionEffects.criticalMultiplierBonus;
  }, [ammunitionEffects.criticalMultiplierBonus, weapon, weaponBuffBonuses, unifiedEffects, activeTechniqueEffects, trackCombatBonuses]);

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

  // === FEEDBACK SONORO E HÁPTICO ===
  const combatFeedback = useCombatFeedback();

  // === HANDLERS DE ROLAGEM ===

  // Rolar ataque
  const handleRollAttack = () => {
    if (preparingAttack.current || attackConfirmation.confirming) return;
    if (attackConfirmation.pending) { void attackConfirmation.confirm(); return; }
    if (!weapon || !canAffordPE || confirmationUnavailable || ammunitionUnavailable || visibilityUnavailable || sneakAttackError) return;
    if (intentRequired && (gateSelection.mode === 'waiting' || gateSelection.weaponId !== weapon.id)) return;
    preparingAttack.current = true;

    // Feedback de rolagem
    combatFeedback.triggerRoll();

    // Rolar ataque
    const result = rollSkillTest({
      attributeValue: attackAttribute,
      dicePenalty: attackDicePenalty,
      skillBonus: attackSkill.bonus,
      otherBonuses: totalAttackBonus - attackSkill.bonus,
      label: `Ataque: ${weapon.name}`,
      criticalThreshold: effectiveCritical,
    });

    result.weaponBurst = burst;
    result.attackContext = { attribute: attackAttribute, baseDicePenalty: attackBaseDicePenalty };
    if (burst.enabled) result.label += ' — Rajada';
    const selection: CombatCostSelection = {
      weaponId: weapon.id,
      ...(gateSelection.mode === 'targeted' && gateSelection.weaponId === weapon.id
        ? { targetCharacterId: gateSelection.targetCharacterId, attackIntentId: gateSelection.attackIntentId,
          ...(gateSelection.counterattackDefenseEventId ? { counterattackDefenseEventId: gateSelection.counterattackDefenseEventId } : {}) } : {}),
      concealment: visibility.level, concealmentConfirmed: visibility.confirmed || (visibility.level === 'none' && !attackerBlind),
      totalCover: visibility.totalCover, attackerBlind, targetDefense,
      burst: burst.enabled,
      specialAttackIncrements: specialAttackConfig.enabled ? specialAttackConfig.attackIncrements + specialAttackConfig.damageIncrements : 0,
      sneakAttack: !!(isInfiltrador && sneakAttackConfig.enabled),
      ...(isInfiltrador && sneakAttackConfig.enabled ? { sneakAttackContext: sneakAttackConfig.declaration as SneakAttackDeclaration } : {}),
      lethalShot: !!(isAtiradorElite && disparoLetalResult.enabled),
      mirarDeclared: !!(isAtiradorElite && disparoLetalResult.enabled && disparoLetalConfig.mirarDeclared),
      techniques: [...(activeTechniqueEffects?.selectedTechniques ?? [])],
      lethalCount: activeTechniqueEffects?.letalCount ?? 0,
      otherPaidBonuses: selectedBonuses.filter(id => (availableBonuses.find(b => b.id === id)?.peCost ?? 0) > 0),
    };
    const request = { operationId: crypto.randomUUID(), expectedPE: currentPE, expectedCost: totalPECost, selection, result };
    // O resultado só é publicado depois de o servidor aceitar o custo.
    void attackConfirmation.confirm({
      result,
      nextPE: totalPECost > 0 ? currentPE - totalPECost : undefined,
      confirmPE: onPEChange,
      confirmOperation: onConfirmAttack ? () => onConfirmAttack(request) : undefined,
      onConfirmed: (result) => {
        // Feedback baseado no resultado
        // Fumble = todos os d20 rolaram 1 (falha crítica)
        const isFumble = result.dice.every(d => d === 1);

        // Verifica se acertou (regra personalizada: crítico NÃO é acerto automático)
        const didHit = attackCanRollDamage(result, targetDefense);

        if (isFumble) {
          combatFeedback.triggerFumble();
        } else if (result.isCritical && !didHit) {
          // REGRA PERSONALIZADA: Crítico que não acerta - som único de expectativa frustrada
          combatFeedback.triggerCriticalMiss();
        } else if (result.isCritical && didHit) {
          combatFeedback.triggerCritical();
        } else if (targetDefense !== null) {
          // Se defesa foi informada, verifica acerto/erro
          if (didHit) {
            combatFeedback.triggerHit();
          } else {
            combatFeedback.triggerMiss();
          }
        } else {
          // Sem defesa, feedback neutro de rolagem completa
          combatFeedback.triggerHit();
        }

        setAttackResult(result);
        // O próximo ataque consumiu a declaração; um novo disparo exige Mirar novamente.
        if (selection.lethalShot || mirar.pending) resetDisparoLetal();
        mirar.consumed();
        setPhase('attack');
        onRollComplete?.(result);
      },
    }).finally(() => { preparingAttack.current = false; });
  };

  // Rolar dano
  const handleRollDamage = () => {
    if (!weapon || !attackResult || !attackCanRollDamage(attackResult, targetDefense)) return;

    const parsed = parseDamageString(weapon.damage);
    const isCritical = attackResult.isCritical;
    
    // Verificar se é arma de fogo (para Atirar para Matar)
    const isFirearm = weapon.type === 'Disparo';
    // Verificar se é corpo a corpo (para Potência Máxima)
    const isMelee = weapon.type === 'Corpo a Corpo' || weapon.type === 'Briga';
    
    // Aplicar Atirar para Matar: dano máximo em crítico com arma de fogo
    // REGRA OFICIAL v1.3: Atirar para Matar só funciona com armas de fogo (firearm)
    // advancedBonuses.atirarParaMatar = bônus condicional ativado manualmente
    // trackCombatBonuses.maximumDamageOnCrit = habilidade passiva da trilha Atirador de Elite
    const useMaxDamage = isCritical && isFirearm && (
      advancedBonuses.atirarParaMatar || 
      trackCombatBonuses.maximumDamageOnCrit
    );
    
    // Calcular dados base (multiplicados se crítico)
    let diceCount = burstWeaponDiceCount(parsed.count, attackResult.weaponBurst, isCritical, criticalMultiplier);
    
    // Bônus de dano numérico
    let damageBonus = parsed.bonus;
    
    // === BÔNUS DO SISTEMA UNIFICADO DE EFEITOS (SUE) ===
    // Inclui origem, trilha, condições consolidados
    if (unifiedEffects) {
      // Bônus geral de dano
      damageBonus += unifiedEffects.damage.general;
      // Bônus específico por tipo
      if (isMelee) {
        damageBonus += unifiedEffects.damage.melee;
      } else {
        damageBonus += unifiedEffects.damage.ranged;
        // Bônus específico de armas de fogo (Balística Avançada)
        if (isFirearm && unifiedEffects.damage.firearm) {
          damageBonus += unifiedEffects.damage.firearm;
        }
      }
    } else if (classPowerBonuses?.damageBonus) {
      // Sistema legado - backup
      damageBonus += classPowerBonuses.damageBonus;
    }
    
    // === BÔNUS DE TRILHA (via track-effects-adapter) ===
    // Aplica bônus de dano de habilidades de trilha ativas
    if (trackCombatBonuses.damageBonus > 0) {
      damageBonus += trackCombatBonuses.damageBonus;
    }
    
    // === BÔNUS DO ATAQUE ESPECIAL (distribuição flexível) ===
    // O bônus já está calculado com Força Bruta e Potência Máxima aplicados
    if (specialAttackConfig.enabled && specialAttackResult.damageBonus > 0) {
      damageBonus += specialAttackResult.damageBonus;
    }
    
    // Multiplicador para Potência Máxima (dobra bônus do Ataque Especial)
    // NOTA: Já aplicado dentro do specialAttackResult, mantido apenas para outros poderes
    const potenciaMaximaMultiplier = 1; // Desativado aqui, processado em specialAttackResult
    
    // Dados extras (de poderes como Golpe Pesado, origens, trilhas)
    // Cada fonte conserva o tamanho dos próprios dados, inclusive com bônus mistos (d6 e d8).
    const extraDiceGroups: Array<{ count: number; size: number }> = [];
    
    // Dados extras do SUE (origem, trilha, condições)
    // Suporta marcador especial "NW" para dados do tipo da arma (ex: "1W" = 1 dado do tipo da arma)
    if (unifiedEffects && unifiedEffects.damage.extraDice.length > 0) {
      unifiedEffects.damage.extraDice.forEach(diceStr => {
        // Verificar marcador especial "NW" (dado do tipo da arma)
        const weaponDieMatch = diceStr.match(/^(\d+)W$/i);
        if (weaponDieMatch) {
          const count = parseInt(weaponDieMatch[1]) || 1;
          extraDiceGroups.push({ count: isCritical ? count * criticalMultiplier : count, size: parsed.size });
          return;
        }
        
        // Parse normal para dados explícitos (ex: "1d6", "2d8")
        const match = diceStr.match(/(\d*)d(\d+)/i);
        if (match) {
          const count = parseInt(match[1]) || 1;
          extraDiceGroups.push({ count, size: parseInt(match[2]) });
        }
      });
    } else if (classPowerBonuses?.extraDamageDice && classPowerBonuses.extraDamageDice.length > 0) {
      // Sistema legado - backup
      classPowerBonuses.extraDamageDice.forEach(diceStr => {
        // Verificar marcador especial "NW" (dado do tipo da arma)
        const weaponDieMatch = diceStr.match(/^(\d+)W$/i);
        if (weaponDieMatch) {
          const count = parseInt(weaponDieMatch[1]) || 1;
          if (handledCombatEffectIds.length > 0) return;
          extraDiceGroups.push({ count: isCritical ? count * criticalMultiplier : count, size: parsed.size });
          return;
        }
        
        const match = diceStr.match(/(\d*)d(\d+)/i);
        if (match) {
          const count = parseInt(match[1]) || 1;
          extraDiceGroups.push({ count, size: parseInt(match[2]) });
        }
      });
    }
    
    // === DADOS EXTRAS DA TRILHA (via track-effects-adapter) ===
    if (trackCombatBonuses.extraDamageDice.length > 0) {
      trackCombatBonuses.extraDamageDice.forEach(diceStr => {
        // Verificar marcador especial "NW" (dado do tipo da arma)
        const weaponDieMatch = diceStr.match(/^(\d+)W$/i);
        if (weaponDieMatch) {
          const count = parseInt(weaponDieMatch[1]) || 1;
          extraDiceGroups.push({ count: isCritical ? count * criticalMultiplier : count, size: parsed.size });
          return;
        }
        
        const match = diceStr.match(/(\d*)d(\d+)/i);
        if (match) {
          const count = parseInt(match[1]) || 1;
          extraDiceGroups.push({ count, size: parseInt(match[2]) });
        }
      });
    }
    
    // Dados extras de WEAPON BUFFS (Amaldiçoar Arma, etc.)
    // Estes dados são de tipo elemental específico do ritual - AGORA SEPARADOS
    let weaponBuffDiceCount = 0;
    let weaponBuffDiceSize = 6;
    let weaponBuffBaseDice = 0; // Dados extras do ritual não aumentam no crítico.
    let weaponBuffEnhancement: string | null = null;
    
    if (weaponBuffBonuses.bonusDamage && weaponBuffs.length > 0) {
      const buffDamage = weaponBuffBonuses.bonusDamage;
      const activeBuff = weaponBuffs[0]; // Pega o buff ativo principal
      
      // Identificar o enhancement usado (Base/Discente/Verdadeiro)
      if (activeBuff.enhancements?.includes('Verdadeiro')) {
        weaponBuffEnhancement = 'Verdadeiro';
      } else if (activeBuff.enhancements?.includes('Discente')) {
        weaponBuffEnhancement = 'Discente';
      }
      
      weaponBuffBaseDice = buffDamage.diceCount || 1;
      weaponBuffDiceCount = weaponBuffBaseDice;
      weaponBuffDiceSize = buffDamage.diceType || 6;
    }
    
    // Dados extras do Ataque Furtivo (com possível dobro do Assassinar)
    // NOVO: Usa o SneakAttackSelector para Infiltradores
    let sneakAttackDice = 0;
    if (isInfiltrador && sneakAttackConfig.enabled) {
      // Usa o selector para calcular dados
      const sneakResult = calculateSneakAttackResult(
        nex, 
        sneakAttackConfig, 
        advancedBonuses.assassinar || false
      );
      sneakAttackDice = sneakResult.finalDice;
    } else if (!isInfiltrador && advancedBonuses.ataqueFurtivo) {
      // Fallback legado só para outras trilhas; Infiltrador exige a escolha deste ataque.
      if (nex >= 99) sneakAttackDice = 4;
      else if (nex >= 65) sneakAttackDice = 3;
      else if (nex >= 40) sneakAttackDice = 2;
      else sneakAttackDice = 1;
      
      // Assassinar dobra os dados
      if (advancedBonuses.assassinar) {
        sneakAttackDice *= 2;
      }
    }
    
    // === MÁQUINA DE MATAR: +1 dado do mesmo tipo da arma ===
    let maquinaDeMatarDice = 0;
    if (maquinaDeMatarActive) {
      // Adiciona 1 dado do mesmo tipo da arma (multiplicado por crítico se aplicável)
      maquinaDeMatarDice = isCritical ? 1 * criticalMultiplier : 1;
    }
    
    // === GOLPE PESADO: +1 dado do mesmo tipo da arma (PASSIVO, corpo a corpo apenas) ===
    const hasGolpePesado = abilities.some(a => a.toLowerCase().includes('golpe pesado'));
    let golpePesadoDice = 0;
    if (hasGolpePesado && isMelee) {
      // +1 dado do mesmo tipo da arma automaticamente
      golpePesadoDice = isCritical ? 1 * criticalMultiplier : 1;
    }

    // Aplicar bônus passivos
    passiveBonuses.forEach(b => {
      if (typeof b.damageBonus === 'number') {
        damageBonus += b.damageBonus;
      } else if (typeof b.damageBonus === 'string') {
        const extraMatch = b.damageBonus.match(/(\d*)d(\d+)?/i);
        if (extraMatch) {
          const count = parseInt(extraMatch[1]) || 1;
          extraDiceGroups.push({ count, size: extraMatch[2] ? parseInt(extraMatch[2]) : parsed.size });
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
            extraDiceGroups.push({ count, size: parseInt(extraMatch[2]) });
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
    for (const group of extraDiceGroups) {
      for (let i = 0; i < group.count; i++) {
        extraDice.push(useMaxDamage ? group.size : Math.floor(Math.random() * group.size) + 1);
      }
    }
    
    // Rolar dados do Ataque Furtivo (d6)
    const sneakDice: number[] = [];
    for (let i = 0; i < sneakAttackDice; i++) {
      sneakDice.push(Math.floor(Math.random() * 6) + 1);
    }
    
    // Rolar dados do Máquina de Matar (mesmo tipo da arma)
    const maquinaDeMatarDiceResults: number[] = [];
    for (let i = 0; i < maquinaDeMatarDice; i++) {
      if (useMaxDamage) {
        maquinaDeMatarDiceResults.push(parsed.size);
      } else {
        maquinaDeMatarDiceResults.push(Math.floor(Math.random() * parsed.size) + 1);
      }
    }
    
    // Rolar dados do Golpe Pesado (mesmo tipo da arma, PASSIVO)
    const golpePesadoDiceResults: number[] = [];
    for (let i = 0; i < golpePesadoDice; i++) {
      if (useMaxDamage) {
        golpePesadoDiceResults.push(parsed.size);
      } else {
        golpePesadoDiceResults.push(Math.floor(Math.random() * parsed.size) + 1);
      }
    }
    
    // Rolar dados de WEAPON BUFFS SEPARADAMENTE (Amaldiçoar Arma - dano elemental)
    const weaponBuffDice: number[] = [];
    for (let i = 0; i < weaponBuffDiceCount; i++) {
      if (useMaxDamage) {
        weaponBuffDice.push(weaponBuffDiceSize);
      } else {
        weaponBuffDice.push(Math.floor(Math.random() * weaponBuffDiceSize) + 1);
      }
    }
    
    // SEPARAR os dados do buff do resto dos dados extras
    // Os dados extras agora são: poderes + ataque furtivo + máquina de matar + golpe pesado (SEM weapon buffs)
    const ammunitionDice = Array.from({ length: ammunitionEffects.explosiveDice }, () => Math.floor(Math.random() * 6) + 1);
    const allExtraDice = [...ammunitionDice, ...extraDice, ...sneakDice, ...maquinaDeMatarDiceResults, ...golpePesadoDiceResults];
    
    // Calcular totais SEPARADOS
    const weaponDiceTotal = mainDice.reduce((a, b) => a + b, 0);
    const extraDiceTotal = allExtraDice.reduce((a, b) => a + b, 0);
    const buffDiceTotal = weaponBuffDice.reduce((a, b) => a + b, 0);
    
    const total = weaponDiceTotal + extraDiceTotal + buffDiceTotal + damageBonus;
      // O histórico inclui cada dado adicional, sem recalcular nem sortear de novo.
      const historyDice = [...mainDice, ...allExtraDice, ...weaponBuffDice];
      onRollComplete?.({
        weaponBurst: attackResult.weaponBurst, type: 'damage', label: `Dano: ${weapon.name}${attackResult.weaponBurst?.enabled ? ' — Rajada' : ''}${selectedAmmunition ? ` — ${selectedAmmunition.name}` : ''}${total < 1 ? ' (mínimo 1)' : ''}`,
        dice: historyDice, keptDice: historyDice.reduce((sum, die) => sum + die, 0),
        skillBonus: 0, otherBonuses: damageBonus, extraDice: allExtraDice.length + weaponBuffDice.length,
        total: Math.max(1, total), isCritical, isDisadvantage: false, timestamp: new Date(),
      });


    // Armazenar resultado de dano da arma (SEM os dados do buff)
    setDamageResult({
      dice: mainDice,
      extraDice: allExtraDice.length > 0 ? allExtraDice : undefined,
      bonus: damageBonus,
      total: Math.max(1, total), // Dano mínimo 1
      damageType: weapon.damageType,
      isCritical,
      useMaxDamage,
      potenciaMaximaActive: advancedBonuses.potenciaMaxima && isMelee,
      assassinarActive: advancedBonuses.assassinar,
    });
    
    // Armazenar resultado do buff SEPARADAMENTE
    if (weaponBuffDice.length > 0 && weaponBuffs.length > 0) {
      const activeBuff = weaponBuffs[0];
      setBuffDiceResult({
        dice: weaponBuffDice,
        formula: `${weaponBuffBaseDice}d${weaponBuffDiceSize}`,
        element: activeBuff.element,
        ritualName: activeBuff.ritualName,
        enhancement: weaponBuffEnhancement,
        total: buffDiceTotal,
      });
    } else {
      setBuffDiceResult(null);
    }
    
    setPhase('damage');
  };

  if (!weapon) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-primary">
            {weapon.type === 'Disparo' ? (
              <Target className="w-5 h-5" />
            ) : (
              <Sword className="w-5 h-5" />
            )}
            {weapon.name}
          </DialogTitle>
          <DialogDescription className="sr-only">Rolagem de ataque e dano com modificadores e Defesa do alvo.</DialogDescription>
        </DialogHeader>

        <WeaponModificationNotes effects={weapon.modificationEffects} />
          <AttackVisibilityControls value={visibility} onChange={setVisibility} weapon={weapon} blind={attackerBlind}
            disabled={phase !== 'setup' || attackConfirmation.confirming || !!attackConfirmation.pending} />
          <AttackConcealmentSummary result={attackResult?.concealmentResult} />
          <WeaponBurstSelector weapon={weapon} damage={weapon.damage} criticalMultiplier={criticalMultiplier} enabled={burst.enabled} onChange={setBurstEnabled}
            disabled={phase !== 'setup' || attackConfirmation.confirming || !!attackConfirmation.pending} />
        {weapon.ammoType && <CombatAmmunitionSelector ammunition={compatibleAmmunition} selectedId={selectedAmmunitionId} onSelect={setSelectedAmmunitionId}
          disabled={phase !== 'setup' || attackConfirmation.confirming || !!attackConfirmation.pending} requiresCalibreGrosso={requiresCalibreGrosso} />}

        <div className="space-y-4">
          {/* Info da arma */}
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline">{weapon.type}</Badge>
            <Badge variant="destructive">{weapon.damage} {weapon.damageType}</Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              Crítico: {effectiveCritical}+ x{criticalMultiplier}
              {/* Indicador visual se há bônus de técnica aplicados */}
              {(activeTechniqueEffects?.criticalMarginBonus || activeTechniqueEffects?.criticalMultiplierBonus) && (
                <Sparkles className="w-3 h-3 text-amber-400" />
              )}
            </Badge>
            {/* Indicador visual de técnicas ativas em destaque */}
            {activeTechniqueEffects && activeTechniqueEffects.selectedTechniques.length > 0 && (
              <Badge variant="outline" className="bg-amber-500/10 border-amber-500/50 text-amber-400 gap-1">
                <Crosshair className="w-3 h-3" />
                {activeTechniqueEffects.selectedTechniques.length} técnica(s)
              </Badge>
            )}
          </div>

          {/* Indicador de Buffs de Arma Ativos - ANTES de rolar */}
          {weaponBuffs && weaponBuffs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-gradient-to-r from-paranormal/10 via-purple-500/5 to-paranormal/10 border border-paranormal/30 p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-paranormal animate-pulse" />
                <span className="text-sm font-medium text-paranormal">
                  Buffs de Arma Ativos
                </span>
              </div>
              
              {weaponBuffs.map(buff => {
                // Determinar label e cor da duração
                const getDurationInfo = () => {
                  switch (buff.duration) {
                    case 'cena':
                      return { 
                        text: 'Dura toda a cena', 
                        icon: <Clock className="w-3 h-3" />, 
                        color: 'bg-green-500/20 text-green-400 border-green-500/40' 
                      };
                    case 'sustentado':
                      return { 
                        text: 'Ritual sustentado', 
                        icon: <RefreshCw className="w-3 h-3" />, 
                        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' 
                      };
                    case 'rodadas':
                      return { 
                        text: `${buff.turnsRemaining || '?'} rodada(s)`, 
                        icon: <Timer className="w-3 h-3" />, 
                        color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' 
                      };
                    default:
                      return { 
                        text: 'Permanente', 
                        icon: <InfinityIcon className="w-3 h-3" />,
                        color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' 
                      };
                  }
                };
                
                const durationInfo = getDurationInfo();
                const elementColors = ELEMENT_BUFF_COLORS[buff.element] || { 
                  bg: 'bg-paranormal/20', 
                  text: 'text-paranormal', 
                  border: 'border-paranormal/50' 
                };
                
                // Construir lista de efeitos
                const effects: string[] = [];
                if (buff.bonusDamage) {
                  effects.push(`+${formatBuffDamage(buff.bonusDamage)} dano de ${buff.element}`);
                }
                if (buff.attackBonus) {
                  effects.push(`+${buff.attackBonus} ataque`);
                }
                if (buff.criticalBonus) {
                  effects.push(`-${buff.criticalBonus} margem de crítico`);
                }
                if (buff.criticalMultiplierBonus) {
                  effects.push(`+${buff.criticalMultiplierBonus} multiplicador`);
                }
                
                return (
                  <div 
                    key={buff.id}
                    className={`rounded-md p-2 ${elementColors.bg} ${elementColors.border} border space-y-1.5`}
                  >
                    {/* Nome do ritual e elemento */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Droplets className={`w-4 h-4 ${elementColors.text}`} />
                        <span className={`font-medium text-sm ${elementColors.text}`}>
                          {buff.ritualName}
                        </span>
                        <Badge variant="outline" className={`text-[10px] ${elementColors.border} ${elementColors.text}`}>
                          {buff.element}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Efeitos do buff */}
                    {effects.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {effects.map((effect, idx) => (
                          <span 
                            key={idx} 
                            className="text-xs px-1.5 py-0.5 rounded bg-background/50 text-foreground/80"
                          >
                            {effect}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Duração */}
                    <div className="flex items-center gap-1.5">
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] gap-1 ${durationInfo.color}`}
                      >
                        {durationInfo.icon}
                        {durationInfo.text}
                      </Badge>
                      
                      {/* Enhancements ativos */}
                      {buff.enhancements && buff.enhancements.length > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {buff.enhancements.join(', ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* === INDICADORES VISUAIS DE BÔNUS DE TRILHA === */}
          {classTrack && (trackCombatBonuses.attackBonus > 0 || 
            trackCombatBonuses.damageBonus > 0 || 
            trackCombatBonuses.criticalMarginBonus > 0 ||
            trackCombatBonuses.criticalMultiplierBonus > 0 ||
            trackCombatBonuses.specialEffects.length > 0 ||
            maquinaDeMatarActive) && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-orange-500/10 border border-orange-500/30 p-3 space-y-3"
            >
              {/* Header com nome da trilha */}
              <div className="flex items-center gap-2">
                <Sword className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-orange-400">
                  Bônus de Trilha: {classTrack.charAt(0).toUpperCase() + classTrack.slice(1).replace(/([A-Z])/g, ' $1')}
                </span>
              </div>
              
              {/* Resumo numérico de bônus */}
              <div className="flex flex-wrap gap-2">
                {trackCombatBonuses.attackBonus > 0 && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="gap-1 text-xs bg-blue-500/20 text-blue-400 border-blue-500/30 cursor-help">
                          <Target className="w-3 h-3" />
                          +{trackCombatBonuses.attackBonus} Ataque
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        Bônus de ataque da trilha {classTrack}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {trackCombatBonuses.damageBonus > 0 && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="gap-1 text-xs bg-destructive/20 text-destructive border-destructive/30 cursor-help">
                          <Flame className="w-3 h-3" />
                          +{trackCombatBonuses.damageBonus} Dano
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        Bônus de dano da trilha {classTrack}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {trackCombatBonuses.criticalMarginBonus > 0 && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="gap-1 text-xs bg-amber-500/20 text-amber-400 border-amber-500/30 cursor-help">
                          <Crosshair className="w-3 h-3" />
                          -{trackCombatBonuses.criticalMarginBonus} Crítico
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        Reduz margem de acerto crítico em {trackCombatBonuses.criticalMarginBonus}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {trackCombatBonuses.criticalMultiplierBonus > 0 && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="gap-1 text-xs bg-purple-500/20 text-purple-400 border-purple-500/30 cursor-help">
                          <Skull className="w-3 h-3" />
                          x{criticalMultiplier} Multiplicador
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        Multiplicador de dano crítico aumentado
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* Indicador de dados extras de trilha */}
                {trackCombatBonuses.extraDamageDice.length > 0 && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="gap-1 text-xs bg-green-500/20 text-green-400 border-green-500/30 cursor-help">
                          <Dices className="w-3 h-3" />
                          +{trackCombatBonuses.extraDamageDice.join(', ')}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        Dados extras de dano da trilha
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              
              {/* Efeitos especiais da trilha */}
              {trackCombatBonuses.specialEffects.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Efeitos Especiais Ativos
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {trackCombatBonuses.specialEffects.map((effect, idx) => (
                      <TooltipProvider key={idx} delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="outline" 
                              className="text-[10px] gap-1 bg-orange-500/10 text-orange-300 border-orange-500/40 cursor-help"
                            >
                              <Zap className="w-3 h-3" />
                              {effect.length > 25 ? effect.substring(0, 25) + '...' : effect}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[200px] text-xs">
                            {effect}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Indicador Máquina de Matar (Aniquilador NEX 99%) */}
              {maquinaDeMatarActive && (
                <div className="p-2 rounded-md bg-amber-500/15 border border-amber-500/40 flex items-center gap-2">
                  <Skull className="w-4 h-4 text-amber-400" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-amber-400">Máquina de Matar</span>
                    <p className="text-[10px] text-muted-foreground">
                      Crítico -2 e +1 dado de dano com arma favorita
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/40">
                    NEX 99%
                  </Badge>
                </div>
              )}
            </motion.div>
          )}

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
                <div inert={attackConfirmation.pending} className="space-y-4">
                  {/* Base de ataque com detalhamento de fontes */}
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Bônus de Ataque
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-sm">
                      <span className="px-2 py-0.5 rounded bg-secondary/50 font-medium">
                        {rangedAttack ? 'AGI' : 'FOR'}: {attackAttribute} · {attackDicePool.count}d20 ({attackDicePool.keep === 'lowest' ? 'menor' : 'maior'})
                      </span>
                      {attackDicePenalty > 0 && (
                        <span className="text-xs text-destructive">Penalidades: -{attackDicePenalty}d20</span>
                      )}
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

                {/* === INDICADOR DE STACKING (SUE Hardening) === */}
                {excludedEffects.length > 0 && (
                  <StackingExclusionIndicator
                    excludedEffects={excludedEffects as ExcludedEffectInfo[]}
                    variant="inline"
                    className="mt-2"
                  />
                )}

                {/* === ATAQUE ESPECIAL (Combatente) com distribuição flexível === */}
                {hasSpecialAttack(abilities) && (
                  <SpecialAttackSelector
                    nex={nex}
                    abilities={abilities}
                    weaponType={weapon.type}
                    hasPotenciaMaxima={advancedBonuses.potenciaMaxima}
                    currentPE={currentPE + temporaryPE}
                    config={specialAttackConfig}
                    onConfigChange={setSpecialAttackConfig}
                    variant="default"
                  />
                )}
                
                {/* === ATAQUE FURTIVO (Infiltrador) com seleção de PE extra === */}
                {isInfiltrador && (
                  <SneakAttackSelector
                    weapon={weapon}
                    nex={nex}
                    currentPE={currentPE + temporaryPE}
                    assassinarActive={advancedBonuses.assassinar || false}
                    config={sneakAttackConfig}
                    onConfigChange={setSneakAttackConfig}
                    variant="default"
                  />
                )}
                
                {/* === DISPARO LETAL (Atirador de Elite NEX 40%+) === */}
                {isAtiradorElite && nex >= 40 && (
                  <DisparoLetalSelector
                    nex={nex}
                    currentPE={currentPE + temporaryPE}
                    pontariaTrained={Number(skills.pontaria ?? skills.Pontaria ?? 0) > 0}
                    config={disparoLetalConfig}
                    onConfigChange={setDisparoLetalConfig}
                    combatControlled={combatControlled}
                    turnControlled={!!expectedTurnKey}
                    mirarRegistered={mirar.registered}
                    mirarPending={mirar.pending}
                    mirarRegistering={mirar.busy}
                    mirarError={mirar.error}
                    onRegisterMirar={() => { void mirar.register(expectedTurnKey, weapon?.id, onMirarRegistered); }}
                    onDismissMirar={() => { void mirar.dismiss(); }}
                    variant="default"
                  />
                )}

                {/* === TÉCNICA SECRETA (Aniquilador NEX 40%+) === */}
                {canUseTechniqueSecreta && (
                  <div className="space-y-2">
                    <Button
                      variant={activeTechniqueEffects ? "default" : "outline"}
                      className={cn(
                        "w-full gap-2",
                        activeTechniqueEffects && "bg-amber-600 hover:bg-amber-700 text-white"
                      )}
                      onClick={() => setShowTechniqueModal(true)}
                    >
                      <Crosshair className="w-4 h-4" />
                      {activeTechniqueEffects 
                        ? `Técnica Secreta Ativa (${activeTechniqueEffects.selectedTechniques.length} técnica${activeTechniqueEffects.selectedTechniques.length > 1 ? 's' : ''})`
                        : 'Usar Técnica Secreta'
                      }
                    </Button>
                    
                    {/* Indicador de efeitos ativos */}
                    {activeTechniqueEffects && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-amber-400">
                            Técnicas Ativas
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              // Cancela apenas a preparação: o custo ainda não foi confirmado.
                              setActiveTechniqueEffects(null);
                            }}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5">
                          {activeTechniqueEffects.additionalTargets > 0 && (
                            <Badge variant="secondary" className="gap-1 text-[10px]">
                              <Target className="w-3 h-3" />
                              +{activeTechniqueEffects.additionalTargets} alvo
                            </Badge>
                          )}
                          {activeTechniqueEffects.criticalMultiplierBonus > 0 && (
                            <Badge variant="secondary" className="gap-1 text-[10px]">
                              <Sword className="w-3 h-3" />
                              +{activeTechniqueEffects.criticalMultiplierBonus} mult.
                            </Badge>
                          )}
                          {activeTechniqueEffects.criticalMarginBonus > 0 && (
                            <Badge variant="secondary" className="gap-1 text-[10px]">
                              <Crosshair className="w-3 h-3" />
                              +{activeTechniqueEffects.criticalMarginBonus} margem
                            </Badge>
                          )}
                          {activeTechniqueEffects.ignoreResistance > 0 && (
                            <Badge variant="secondary" className="gap-1 text-[10px]">
                              <Shield className="w-3 h-3" />
                              Ignora {activeTechniqueEffects.ignoreResistance} RD
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    )}
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
                          disabled={!selectedBonuses.includes(bonus.id) && bonus.peCost && currentPE + temporaryPE < bonus.peCost}
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
                    {isInfiltrador && sneakAttackConfig.enabled ? 'Custo máximo' : 'Custo'}: {totalPECost} PE (você tem {currentPE}/{maxPE})
                  </div>
                )}

</div>
                {temporaryPE > 0 && <p className="text-sm text-muted-foreground">PE disponíveis: {currentPE} normais + {temporaryPE} temporários. Temporários são consumidos primeiro.</p>}
        {intentRequired && campaignId && characterId && weapon && phase === 'setup' &&
          <AttackIntentGate key={`${campaignId}:${characterId}:${weapon.id}`} campaignId={campaignId}
            attackerId={characterId} weaponId={weapon.id} enabled={open}
            onSelectionChange={setGateSelection} />}
        {confirmationUnavailable && !attackConfirmation.pending && <p role="status" className="p-3 text-sm text-muted-foreground">{confirmationUnavailable}</p>}
        {sneakAttackError && !attackConfirmation.pending && <p role="alert" className="p-3 text-sm text-destructive">{sneakAttackError}</p>}
        {attackConfirmation.error && (
          <p role="alert" className="p-3 text-sm text-destructive">
            {attackConfirmation.error}
            {attackConfirmation.pending && ' Você pode fechar esta janela e reabrir a arma para confirmar o mesmo ataque. Não inicie outro ataque antes disso.'}
          </p>
        )}
                {/* Botão de rolar */}
                <Button
                  className="w-full font-display"
                  size="lg"
                  onClick={handleRollAttack}
                  disabled={attackConfirmation.confirming || (!attackConfirmation.pending && (!canAffordPE || !!confirmationUnavailable || ammunitionUnavailable || visibilityUnavailable || !!sneakAttackError || (intentRequired && (gateSelection.mode === 'waiting' || gateSelection.weaponId !== weapon?.id))))}
                >
                  <Dices className="w-5 h-5 mr-2" />
                  {attackConfirmation.confirming ? "CONFIRMANDO ATAQUE…" : attackConfirmation.pending ? "TENTAR CONFIRMAR ATAQUE" : "ROLAR ATAQUE"}
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
                {attackResult.sneakAttackResult && (
                  <p role="status" className="rounded border border-purple-500/30 bg-purple-950/30 p-2 text-sm">
                    {attackResult.sneakAttackResult.applied
                      ? 'Ataque Furtivo aplicado: 1 PE cobrado neste acerto.'
                      : 'Ataque Furtivo não aplicado: ataque falhou; 0 PE da habilidade cobrado.'}
                    {!attackResult.sneakAttackResult.applied
                      ? ' Uso da rodada preservado.'
                      : !attackResult.sneakAttackResult.roundLimitChecked && ' Limite por rodada: conferência da mesa.'}
                  </p>
                )}
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
                      (Desvantagem - mantém o menor dado)
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
                        attackCanRollDamage(attackResult, targetDefense)
                          ? "bg-green-500/10 border-green-500/50 text-green-500"
                          : attackResult.isCritical
                            ? "bg-amber-500/10 border-amber-500/50 text-amber-500"
                            : "bg-destructive/10 border-destructive/50 text-destructive"
                      )}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {attackCanRollDamage(attackResult, targetDefense) ? (
                          <>
                            <Target className="w-5 h-5" />
                            <span className="font-display font-bold text-lg">ACERTOU!</span>
                          </>
                        ) : attackResult.isCritical ? (
                          <>
                            <Sparkles className="w-5 h-5" />
                            <span className="font-display font-bold text-lg">CRÍTICO, mas ERROU</span>
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
                      {attackResult.isCritical && attackResult.total < targetDefense && (
                        <p className="text-[10px] opacity-60 mt-1">
                          Crítico só dobra dano se acertar
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>

                <Separator />

                {/* Botão de rolar dano - apenas se acertou */}
                {(() => {
                  // REGRA PERSONALIZADA: Crítico NÃO é acerto automático
                  // Pode rolar dano apenas se: sem defesa informada OU total >= defesa
                  const canRollDamage = attackCanRollDamage(attackResult, targetDefense);
                  
                  if (canRollDamage) {
                    return (
                      <Button
                        className={cn(
                          "w-full font-display",
                          attackResult.isCritical && "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                        )}
                        size="lg"
                        onClick={handleRollDamage}
                      >
                        <Skull className="w-5 h-5 mr-2" />
                        ROLAR DANO {attackResult.isCritical && `(x${criticalMultiplier})`}
                      </Button>
                    );
                  } else {
                    return (
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-muted/50 text-center border border-muted">
                          <p className="text-sm text-muted-foreground">
                            O ataque errou. Nenhum dano a ser rolado.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setPhase('setup');
                            resetSneakAttack();
                            setBurstEnabled(false);
    setVisibility(value => ({ ...value, confirmed: false }));
                            setAttackResult(null);
                          }}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Tentar Novo Ataque
                        </Button>
                      </div>
                    );
                  }
                })()}
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
                  <div className="text-sm text-muted-foreground">
                    Ataque: <span className="font-bold text-foreground">{attackResult?.total}</span>
                    {attackResult?.isCritical && (
                      <Badge variant="default" className="ml-2 bg-amber-500">CRÍTICO</Badge>
                    )}
                  </div>
                </div>

                {/* Seção de Dados de Dano */}
                <div className="space-y-4">
                  {/* === DADOS DA ARMA === */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                      <Dices className="w-3 h-3" />
                      <span>Dados de Dano da Arma</span>
                      <span className="text-muted-foreground/50">
                        ({damageResult.dice.length}d{parseDamageString(weapon.damage).size})
                      </span>
                    </div>
                    
                    {/* Dados principais da arma */}
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
                    </div>
                    
                    {/* Subtotal da arma */}
                    <p className="text-center text-sm text-muted-foreground">
                      {damageResult.dice.join(' + ')} = <span className="font-bold text-foreground">{damageResult.dice.reduce((a, b) => a + b, 0)}</span>
                    </p>
                  </div>
                  
                  {/* === DADOS EXTRAS DE PODERES === */}
                  {damageResult.extraDice && damageResult.extraDice.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-xs text-purple-400 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" />
                        <span>{ammunitionEffects.explosiveDice ? 'Dados Extras (Munição e Poderes)' : 'Dados Extras (Poderes)'}</span>
                      </div>
                      
                      <div className="flex flex-wrap justify-center gap-2">
                        {damageResult.extraDice.map((die, i) => (
                          <motion.div
                            key={`extra-${i}`}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: (damageResult.dice.length + i) * 0.08, type: 'spring' }}
                            className="w-10 h-10 rounded flex items-center justify-center font-display text-lg font-bold bg-purple-600 text-white"
                          >
                            {die}
                          </motion.div>
                        ))}
                      </div>
                      
                      <p className="text-center text-sm text-muted-foreground">
                        {damageResult.extraDice.join(' + ')} = <span className="font-bold text-purple-400">{damageResult.extraDice.reduce((a, b) => a + b, 0)}</span>
                      </p>
                    </div>
                  )}
                  
                  {/* === DADOS DO BUFF DE ARMA (SEPARADO) === */}
                  {buffDiceResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      {/* Header do buff com cor do elemento */}
                      {(() => {
                        const elementColors = ELEMENT_BUFF_COLORS[buffDiceResult.element] || { 
                          bg: 'bg-paranormal/20', 
                          text: 'text-paranormal', 
                          border: 'border-paranormal/50' 
                        };
                        
                        // Determinar label do enhancement
                        const enhancementLabel = buffDiceResult.enhancement 
                          ? `${buffDiceResult.enhancement}` 
                          : 'Base';
                        
                        return (
                          <>
                            <div className={cn(
                              "flex items-center justify-center gap-2 text-xs uppercase tracking-wider",
                              elementColors.text
                            )}>
                              <Droplets className="w-3 h-3" />
                              <span>Dano Extra: {buffDiceResult.ritualName}</span>
                            </div>
                            
                            {/* Badge com enhancement e fórmula */}
                            <div className="flex items-center justify-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs gap-1",
                                  elementColors.bg,
                                  elementColors.border,
                                  elementColors.text
                                )}
                              >
                                <span className="font-bold">{enhancementLabel}</span>
                                <span className="opacity-75">
                                  ({buffDiceResult.formula} de {buffDiceResult.element})
                                </span>
                              </Badge>
                              
                            </div>
                            
                            {/* Dados do buff com cor do elemento */}
                            <div className="flex flex-wrap justify-center gap-2">
                              {buffDiceResult.dice.map((die, i) => (
                                <motion.div
                                  key={`buff-${i}`}
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ delay: (damageResult.dice.length + (damageResult.extraDice?.length || 0) + i) * 0.08, type: 'spring' }}
                                  className={cn(
                                    "w-10 h-10 rounded flex items-center justify-center font-display text-lg font-bold ring-2",
                                    elementColors.bg.replace('/20', '/60'),
                                    elementColors.text,
                                    elementColors.border.replace('/50', '/80')
                                  )}
                                >
                                  {die}
                                </motion.div>
                              ))}
                            </div>
                            
                            {/* Subtotal do buff */}
                            <p className={cn(
                              "text-center text-sm",
                              elementColors.text
                            )}>
                              {buffDiceResult.dice.join(' + ')} = <span className="font-bold">{buffDiceResult.total}</span>
                              <span className="text-muted-foreground ml-1">dano de {buffDiceResult.element}</span>
                            </p>
                          </>
                        );
                      })()}
                    </motion.div>
                  )}
                  
                </div>

                {/* Total de dano com detalhamento de bônus */}
                <div className="text-center space-y-2 pt-2 border-t border-border">
                  {/* Breakdown completo */}
                  <div className="flex flex-wrap items-center justify-center gap-1 text-xs text-muted-foreground pt-2">
                    <span>Arma: {damageResult.dice.reduce((a, b) => a + b, 0)}</span>
                    {damageResult.extraDice && damageResult.extraDice.length > 0 && (
                      <>
                        <span>+</span>
                        <span className="text-purple-400">Extras: {damageResult.extraDice.reduce((a, b) => a + b, 0)}</span>
                      </>
                    )}
                    {buffDiceResult && (
                      <>
                        <span>+</span>
                        <span className={ELEMENT_BUFF_COLORS[buffDiceResult.element]?.text || 'text-paranormal'}>
                          {buffDiceResult.element}: {buffDiceResult.total}
                        </span>
                      </>
                    )}
                    {damageResult.bonus !== 0 && (
                      <>
                        <span>+</span>
                        <span>Bônus: {damageResult.bonus}</span>
                      </>
                    )}
                  </div>
                  
                  {/* Breakdown de fontes de bônus numérico */}
                  {damageBonusSources.filter(s => typeof s.value === 'number').length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
                      {damageBonusSources.filter(s => typeof s.value === 'number').map((source, idx) => (
                        <span 
                          key={idx} 
                          className={cn('px-2 py-0.5 rounded font-medium', bonusTypeColors[source.type])}
                        >
                          {source.label}: +{source.value}
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
                  
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    <span className="text-sm text-muted-foreground">pontos de dano</span>
                    {damageResult.damageType && (
                      <Badge variant="outline">{damageResult.damageType}</Badge>
                    )}
                    {buffDiceResult && (
                      <>
                        <span className="text-muted-foreground">+</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            ELEMENT_BUFF_COLORS[buffDiceResult.element]?.bg || 'bg-paranormal/10',
                            ELEMENT_BUFF_COLORS[buffDiceResult.element]?.border || 'border-paranormal/50',
                            ELEMENT_BUFF_COLORS[buffDiceResult.element]?.text || 'text-paranormal'
                          )}
                        >
                          {buffDiceResult.element}
                        </Badge>
                      </>
                    )}
                  </div>
                  
                  {/* === INDICADORES DAS TÉCNICAS DO ANIQUILADOR APLICADAS === */}
                  {activeTechniqueEffects && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-wrap items-center justify-center gap-1.5 pt-2"
                    >
                      {activeTechniqueEffects.ignoreResistance > 0 && (
                        <Badge variant="outline" className="text-xs gap-1 bg-rose-500/10 border-rose-500/50 text-rose-400">
                          <Shield className="w-3 h-3" />
                          Ignora {activeTechniqueEffects.ignoreResistance} RD
                        </Badge>
                      )}
                      {activeTechniqueEffects.additionalTargets > 0 && (
                        <Badge variant="outline" className="text-xs gap-1 bg-cyan-500/10 border-cyan-500/50 text-cyan-400">
                          <Target className="w-3 h-3" />
                          +{activeTechniqueEffects.additionalTargets} alvo adjacente
                        </Badge>
                      )}
                      {activeTechniqueEffects.criticalMultiplierBonus > 0 && damageResult.isCritical && (
                        <Badge variant="outline" className="text-xs gap-1 bg-amber-500/10 border-amber-500/50 text-amber-400">
                          <Zap className="w-3 h-3" />
                          +{activeTechniqueEffects.criticalMultiplierBonus} multiplicador
                        </Badge>
                      )}
                      {activeTechniqueEffects.criticalMarginBonus > 0 && (
                        <Badge variant="outline" className="text-xs gap-1 bg-purple-500/10 border-purple-500/50 text-purple-400">
                          <Crosshair className="w-3 h-3" />
                          +{activeTechniqueEffects.criticalMarginBonus} margem crítico
                        </Badge>
                      )}
                    </motion.div>
                  )}
                </div>

                <Separator />

                {/* Botão de fechar */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setPhase('setup');
                      resetSneakAttack();
                      setBurstEnabled(false);
    setVisibility(value => ({ ...value, confirmed: false }));
                      setAttackResult(null);
                      setDamageResult(null);
                      setBuffDiceResult(null);
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
      
      {/* Modal de Técnicas do Aniquilador */}
      <AniquiladorTechniqueModal
        open={showTechniqueModal}
        onClose={() => setShowTechniqueModal(false)}
        onConfirm={handleConfirmTechnique}
        nex={nex}
        currentPE={currentPE + temporaryPE}
        weaponName={weapon?.name || ''}
      />
    </Dialog>
  );
}
