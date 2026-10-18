import { preserveInventoryModifications } from '@/lib/inventory-modifications';
import { savedClassPowerNames } from '@/lib/effects/character-power-input';
import { CreationReviewNotice } from '@/components/character/CreationReviewNotice';
import { useRitualSituationalContext } from '@/hooks/character/useRitualSituationalContext';
import { confirmCombatAttack } from '@/services/combat-attack-service';
import { isAniquiladorFavoriteWeapon } from '@/lib/category-reduction';
import { PETurnBudgetPanel } from '@/components/character/PETurnBudgetPanel';
import { usePETurnBudget } from '@/hooks/character/usePETurnBudget';
import { DEFAULT_CASTING_CONCENTRATION, getCastingWillConfig, rollCastingConcentration, type CastingConcentrationContext } from '@/lib/rituals/casting-concentration';
import { rollParanormalCost } from '@/lib/rituals/paranormal-cost';
import { TemporaryResourcesPanel } from '@/components/character/TemporaryResourcesPanel';
import { useTemporaryResources } from '@/hooks/character/useTemporaryResources';
import { getConcentrationFailureMessage } from '@/lib/rituals/casting-concentration-result';
import { BaseRulesNotice } from '@/components/character/BaseRulesNotice';
import { useConditionTurnApplication } from '@/hooks/character/useConditionTurnApplication';
import { useCharacterResourceUpdate } from '@/hooks/character/useCharacterResourceUpdate';
import { useCharacterServerRead } from '@/hooks/character/useCharacterServerRead';
import { ritualRollHistory } from '@/lib/ritual-roll-history';
import { confirmConditionReplacement } from '@/services/character-resource-service';
import { parseCondition, serializeCondition, getConditionNames } from '@/lib/conditions/condition-serialization';
import { ritualTargetSkillBonuses } from '@/lib/ritual-target-skills';
import { useRitualApplicationTargets } from '@/hooks/character/useRitualApplicationTargets';
import { activityRitualEntries } from '@/lib/ritual-history-adapter';
import { useRitualApplication } from '@/hooks/character/useRitualApplication';
import { RitualApplicationTargetSelector } from '@/components/character/RitualApplicationTargetSelector';
import { CharacterActivityPanel } from '@/components/character/CharacterActivityPanel';
import { useCharacterActivity } from '@/hooks/character/useCharacterActivity';
import { activityJson } from '@/services/character-activity-service';
import { buildWeaponBuff, buildSustainPayload } from '@/lib/ritual-application-payload';
import { activityRollEntries, diceHistoryEntry, entryDiceResult } from '@/lib/roll-history-adapter';
/**
 * CharacterSheet - Ficha de personagem redesenhada
 * Layout de 2 colunas em desktop estilo ficha de papel
 * Com bordas roxas, acordeões colapsáveis e visual temático
 */

import { useEffect, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { EstrategistaGrantedActions } from '@/components/character/tracks/combatente/EstrategistaAction';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast, useIsMobile, useThemeColors } from '@/hooks';
import { ThemeSelector } from '@/components/ui/theme-selector';
// Hooks de UX (Fase 6)
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSheetKeyboardShortcuts } from '@/hooks/useSheetKeyboardShortcuts';
// Componentes de UX (Fase 6)
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SaveStatusIndicator, SaveStatus } from '@/components/ui/SaveStatusIndicator';
import { KeyboardShortcutsHelp } from '@/components/ui/KeyboardShortcutsHelp';
// AtmosphericEffects com lazy loading condicional (substitui Particles e FlickeringGrid)
import { AtmosphericEffects } from '@/components/character/AtmosphericEffects';
import {
  ArrowLeft, 
  Loader2, 
  Edit2,
  Trash2,
  Moon,
  Sparkles,
  BookOpen,
  Users,
  Package,
  Heart,
  FileText,
  Skull,
  GraduationCap,
  MoreVertical,
  History,
  Dices,
  Palette,
  ShieldCheck,
} from '@/components/icons/ordem-icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MobileActionSheet, useActionSheet } from '@/components/ui/mobile-action-sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ORIGINS, CLASSES, getTrackById, getSkillBonus } from '@/lib/character-data';
import { getKnownRitualLimit } from '@/lib/rituals/known-ritual-limit';
import { ALL_RITUALS } from '@/lib/rituals/legacy-exports';
import { ALL_CLASS_ABILITIES } from '@/lib/class-abilities';
import { PARANORMAL_POWERS, ParanormalPower, ParanormalElement, SavedParanormalPower, getPowerById } from '@/lib/paranormal-powers';
// syncLegacyPowers removido - a sincronização automática foi desativada para evitar
// criar registros incorretos para Ocultistas que ganham poderes pela classe
import { GENERAL_POWERS, getGeneralPowerById } from '@/lib/general-powers';
import { TRAINING_GRADE_KEYS } from '@/lib/constants/game-ids';
import { ParanormalPowersPanel } from '@/components/character/ParanormalPowersPanel';
import { TranscenderHistoryPanel } from '@/components/character/TranscenderHistoryPanel';
import { cn } from '@/lib/utils';
import { DiceRollResult } from '@/lib/dice-roller';
import { calculateRitualResistanceDT } from '@/lib/rituals/ritual-resistance';
import { InventoryPanel } from '@/components/inventory/InventoryPanel';
import { ItemSituationalActionsPanel } from '@/components/inventory/ItemSituationalActionsPanel';
import { ExplosivesPanel } from '@/components/inventory/ExplosivesPanel';
import { AccessoryApprovalPanel } from '@/components/inventory/AccessoryApprovalPanel';
import { DataErrorBoundary } from '@/components/DataErrorBoundary';
import { InventoryItem, hasInventarioOtimizado, calculateCarryCapacity } from '@/lib/inventory-system';
import { EspecialistaArmaIndicator } from '@/components/character/EspecialistaArmaIndicator';
import { PeritoIndicator } from '@/components/character/PeritoIndicator';
// Lazy loading para modais pesados (otimização de performance)
const NexProgressionModal = lazy(() => import('@/components/character/NexProgressionModal').then(m => ({ default: m.NexProgressionModal })));
const RitualSelectionModal = lazy(() => import('@/components/character/RitualSelectionModal').then(m => ({ default: m.RitualSelectionModal })));
const CharacterEditModal = lazy(() => import('@/components/character/CharacterEditModal').then(m => ({ default: m.CharacterEditModal })));
import { CharacterHistoryPanel, logCharacterChanges } from '@/components/character/CharacterHistoryPanel';
import { ParanormalPowerSelectModal } from '@/components/character/ParanormalPowerSelectModal';
import { IntellectSkillSelectModal } from '@/components/character/IntellectSkillSelectModal';
import { ElementResistanceSelectModal } from '@/components/character/ElementResistanceSelectModal';
import { TrainingGradeSelectModal, type TrainingGradeResult, type SkillUpgradeChoice, applyTrainingGradeUpgrades } from '@/components/character/TrainingGradeSelectModal';
import { MissingSkillsFixModal } from '@/components/character/MissingSkillsFixModal';
import { ConditionManager, type ActiveCondition } from '@/components/character/ConditionManager';
import { RestModal } from '@/components/character/RestModal';
import { NonOccultistRitualModal, RitualSource } from '@/components/character/NonOccultistRitualModal';
import { LearnedRitual } from '@/components/character/GeneralPowersPanel';
import { ValidationAutoFixModal, type ApplicableFix } from '@/components/character/ValidationAutoFixModal';
import { useValidationAutoFix, characterToState } from '@/hooks/useValidationAutoFix';
import { calculateDerivedStats, countTranscender } from '@/lib/character-data';
import { calculateSkillOrigins } from '@/lib/skill-origins';
import { AffinitySelectorCard } from '@/components/character/AffinitySelectorCard';
import { hasUsedTranscenderPostNex50, hasParanormalPowersFromTranscender } from '@/lib/transcender-system';
import { usePrimeiraImpressao } from '@/hooks/usePrimeiraImpressao';
// Hook consolidado do SUE - fonte única de verdade para todos os bônus
import { 
  useBonusSummaryFromSUE, 
  useRitualBonusesFromSUE, 
  useBonusSync, 
  useConditionalBonusesSync, 
  useCampaignRitualSync, 
  useWeaponBuffs, 
  useAutoConditions, 
  useRitualCombatBonuses, 
  useSustainedRituals, 
  useEquipmentMigration, 
  useRoundTracking, 
  useActivatedEffects,
  useCharacterAudit,
  type ActiveCondition as AutoCondition,
} from '@/hooks';
import { normalizeWeaponTypeForDisplay } from '@/lib/weapon-type-inference';
import { BonusSummaryCard } from '@/components/character/BonusSummaryCard';
import { SustainedRitualControl } from '@/components/character/SustainedRitualControl';
import { ConditionalBonusesPanel } from '@/components/character/ConditionalBonusesPanel';
import { TrackCombatBonusesBar } from '@/components/character/TrackCombatBonusesBar';
import { ActiveAdvancedBonusesBar, useActiveAdvancedBonuses } from '@/components/character/ActiveAdvancedBonusesBar';
import { MaquinaDeMatarIndicator } from '@/components/character/MaquinaDeMatarIndicator';
import { AniquiladorPassivesIndicator } from '@/components/character/AniquiladorPassivesIndicator';
import { CharacterAuditBanner } from '@/components/character/CharacterAuditBanner';
// useCharacterAudit já importado acima via @/hooks
import { CharacterForAudit, canAddParanormalPower } from '@/lib/character-audit-engine';
import { ClassPowerBonusesPanel } from '@/components/character/ClassPowerBonusesPanel';
import { ClassPowersActivationPanel } from '@/components/character/ClassPowersActivationPanel';
import { ParanormalPowersActivationPanel } from '@/components/character/ParanormalPowersActivationPanel';
import { AutomationDebugWidget } from '@/components/character/AutomationDebugWidget';
import { getActivatablePowersForCharacter } from '@/lib/class-powers/activatable-powers-bridge';
import { VersatilityAbilityCard } from '@/components/character/VersatilityAbilityCard';
import { useDeveloperMode } from '@/components/ui/theme-selector';
import { ActiveEffectsPanel } from '@/components/character/ActiveEffectsPanel';
import { SUEDevToolsPanel } from '@/components/dev';
// Trilhas unificadas responsivas (FASE 5 - todas as 15 trilhas)
import {
  // Combatente
  ComandanteCampoPanel as LeadershipAbilitiesPanel,
  GuerreiroPanel as GuerreiroAbilitiesPanel,
  OperacoesEspeciaisPanel,
  TropaDeChoquePanel,
  AniquiladorPanel,
  // Especialista
  AtiradorDeElitePanel,
  InfiltradorPanel,
  MedicoDeCampoPanel,
  NegociadorPanel,
  TecnicoPanel,
  // Ocultista
  ConduitePanel,
  FlageladorPanel,
  GraduadoPanel,
  IntuitivoPanel,
  LaminaParanormalPanel,
} from '@/components/character/tracks';
import { RoundControlPanel } from '@/components/character/RoundControlPanel';
import { TrackPassiveEffectsWidget } from '@/components/character/TrackPassiveEffectsWidget';
import { Logo } from '@/components/ui/logo';

// Novos componentes do redesign 2.0 (estilo ficha de papel)
import { CharacterSheetHeader } from '@/components/character/CharacterSheetHeader';
import { AttributeGridNew } from '@/components/character/AttributeGridNew';
import { SkillsByAttribute } from '@/components/character/SkillsByAttribute';
import { PersonalDataAccordion } from '@/components/character/PersonalDataAccordion';
import { CombatWeaponsTable } from '@/components/character/CombatWeaponsTable';
import { SheetAccordionSection, SheetAccordionItem } from '@/components/character/SheetAccordionSection';
import { RitualCard } from '@/components/character/RitualCard';
import { RitualCastModal } from '@/components/character/RitualCastModal';
import { RitualDamageModal, RitualDamageResult, RitualHealingResult } from '@/components/character/RitualDamageModal';
import { ResistanceCheckModal, ResistanceCheckResult } from '@/components/character/ResistanceCheckModal';
import { RitualConditionModal, PendingCondition, extractConditionsFromEffect } from '@/components/character/RitualConditionApplicator';
import { RitualEffectWizard } from '@/components/character/RitualEffectWizard';
import { RitualCastHistory, RitualCastRecord } from '@/components/character/RitualCastHistory';
import { Ritual, getActiveRitualEffect, ritualDealsDamage, RitualEffect, SustainConfig } from '@/lib/rituals/legacy-exports';

// Componentes existentes que ainda usamos
import { CharacterSheetHelp } from '@/components/character/CharacterSheetHelp';
import { MobileCharacterSheet } from '@/components/character/MobileCharacterSheet';
import { DiceRollModal, BonusSource } from '@/components/dice/DiceRollModal';
import { DiceRollHistoryDrawer, DiceRollHistoryCompact } from '@/components/dice/DiceRollHistory';
import { AbilityDetailModal } from '@/components/character/AbilityDetailModal';
import { ExcessRitualsRemovalModal } from '@/components/character/ExcessRitualsRemovalModal';
import { ExcessPowersRemovalModal } from '@/components/character/ExcessPowersRemovalModal';
import { getMaxParanormalPowers } from '@/lib/character-audit-engine';
import { TemplateSaveModal } from '@/components/templates/TemplateSaveModal';

// Interface estendida para itens do inventário com todos os campos persistidos
interface InventoryItemPersisted {
  catalogId?: string;
  id?: string;
  name: string;
  category: string;
  slots: number;
  quantity?: number;
  itemType?: string;
  isEquipped?: boolean;
  equipSlot?: string;
  description?: string;
  // Campos de armas
  damage?: string;
  damageType?: string;
  critical?: number;
  criticalMultiplier?: number;
  range?: string;
  special?: string;
  ammoType?: string;
  weaponType?: 'melee' | 'ranged' | 'firearm' | 'thrown';
  proficiency?: string;
  properties?: string[];
  // Campos de armaduras
  rd?: number;
  defenseBonus?: number;
  agilityPenalty?: number;
  speedPenalty?: number;
  armorType?: string;
  // Campos de consumíveis
  effect?: string;
  uses?: number;
  maxUses?: number;
  consumable?: boolean;
  // Campos de redução de categoria (A Favorita, Ferramenta Favorita, etc.)
  favoriteAbilityId?: string;
  effectiveCategory?: string;
  // Campos de modificações de armas
  baseCategory?: string;
  baseDamage?: string;
  baseCritical?: number;
  appliedModifications?: string[];
  attackBonus?: number;
  specialEffects?: string[];
  // Campos para itens temporários/improvisados
  isTemporary?: boolean;
  temporarySource?: string;
}

// Interface para condição persistida (objeto completo com dyingCounter para Morrendo)
interface PersistedCondition {
  id: string;
  name: string;
  turnsRemaining: number | null;
  addedAt: string; // ISO string para serialização
  dyingCounter?: number; // Para condição Morrendo (3, 2, 1, 0 = morte)
}

// Interface do personagem
interface Character {
  creation_data?: unknown;
  creation_review?:string[];
  id: string;
  name: string;
  player_name: string | null;
  origin: string;
  class: string;
  class_track: string | null;
  nex: number;
  patent: string;
  agility: number;
  strength: number;
  intellect: number;
  presence: number;
  vigor: number;
  hp_current: number;
  hp_max: number;
  pe_current: number;
  pe_max: number;
  san_current: number;
  san_max: number;
  defense: number;
  movement: number;
  skills: Record<string, number>;
  powers: Array<{ name: string; description: string }>;
  abilities: string[];
  inventory: InventoryItemPersisted[];
  rituals: string[];
  background: string | null;
  notes: string | null;
  conditions: (string | PersistedCondition)[]; // Suporta string legado ou objeto completo
  photo_url?: string | null;
  age?: number | null;
  gender?: string | null;
  appearance?: string | null;
  personality?: string | null;
  // Campos de poderes paranormais e afinidade elemental
  paranormal_powers?: Array<{ id: string; name: string; element: string; description: string }>;
  general_powers?: Array<{ id: string; name: string; description: string; category?: string }>;
  elemental_affinity?: string | null;
  affinity_active?: boolean;
  // Buffs ativos de rituais (persistidos na nuvem)
  active_buffs?: import('@/hooks/useWeaponBuffs').WeaponBuff[];
  // Bônus condicionais ativados manualmente
  active_conditional_bonuses?: string[];
  // Trilha de Versatilidade (NEX 50%)
  versatility_track?: {
    trackId: string;
    trackName: string;
    abilityId: string;
    abilityName: string;
  } | null;
  // Escolhas de Treinamento em Perícia (poder geral)
  skill_training_choices?: Record<string, Array<{ skillId: string; fromLevel: number; toLevel: number }>>;
  // Sub-escolhas de poderes de classe (Especialista em Arma, Perito, etc.)
  class_power_choices?: Record<string, { powerId: string; choiceType: string; chosenValues: string[] }>;
  // Escolhas de Grau de Treinamento (NEX 35% e 70%)
  training_grade_choices?: {
    nex35?: Array<{ skillId: string; fromLevel: number; toLevel: number }>;
    nex70?: Array<{ skillId: string; fromLevel: number; toLevel: number }>;
  };
}

// ==================== UTILITÁRIO DE PARSING ====================

/**
 * Parseia dados do personagem do banco para o formato do cliente
 * Centraliza a lógica de parsing para evitar duplicação entre fetchCharacter e refetchCharacter
 */
function parseCharacterDataFromDB(
  data: Record<string, unknown>, 
  inventory: InventoryItemPersisted[]
): Character {
  return {
    ...data,
    inventory,
    // Suporta condições como string legado ou objeto completo
    conditions: Array.isArray(data.conditions) ? data.conditions : [],
    abilities: Array.isArray(data.abilities) ? (data.abilities as string[]) : [],
    rituals: Array.isArray(data.rituals) ? (data.rituals as string[]) : [],
    class_track: (data.class_track as string) || null,
    elemental_affinity: (data.elemental_affinity as string) || null,
    affinity_active: (data.affinity_active as boolean) || false,
    // Carrega buffs ativos da nuvem
    active_buffs: Array.isArray(data.active_buffs) ? data.active_buffs : [],
    // Carrega escolhas de Treinamento em Perícia
    skill_training_choices: (data as Record<string, unknown>).skill_training_choices || {},
    // Carrega escolhas de Grau de Treinamento (NEX 35% e 70%)
    training_grade_choices: (data as Record<string, unknown>).training_grade_choices as Character['training_grade_choices'] || undefined,
  } as unknown as Character;
}
export default function CharacterSheet() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Hook de migração automática de equipamentos
  const { runMigration, resetMigration } = useEquipmentMigration();
  
  // Hook de modo desenvolvedor (para exibir widget de debug)
  const { developerMode } = useDeveloperMode();
  const [character, setCharacter] = useState<Character | null>(null);
  const readCharacter = useCharacterServerRead(id || '', user?.id || '');
  const [loading, setLoading] = useState(true);
  const [readError, setReadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Stats editáveis
  const [hpCurrent, setHpCurrent] = useState(0);
  const [peCurrent, setPeCurrent] = useState(0);
  const [sanCurrent, setSanCurrent] = useState(0);

  // Uma nova ficha/conta começa sem saldos e condições herdados da tela anterior.
  useEffect(() => {
    setCharacter(null); setHpCurrent(0); setPeCurrent(0); setSanCurrent(0); setLoading(true); setReadError(null);
  }, [id, user?.id]);
  
  // Estado da modal de rolagem imediata
  const [diceModalOpen, setDiceModalOpen] = useState(false);
  const [rollLabel, setRollLabel] = useState('');
  const [rollAttribute, setRollAttribute] = useState(0);
  const [rollSkillBonus, setRollSkillBonus] = useState(0);
  const [rollResistanceBonus, setRollResistanceBonus] = useState(0);
  const [rollExtraDice, setRollExtraDice] = useState(0);  // Dados extras (Discurso Motivador)
  const [rollBonusSources, setRollBonusSources] = useState<BonusSource[]>([]);
  const [rollTestedAttribute, setRollTestedAttribute] = useState<'strength' | 'agility' | 'vigor' | 'intellect' | 'presence' | undefined>(undefined);
  
  // Histórico de rolagens
  const activity = useCharacterActivity(id || '');
  const { addRoll: saveActivityRoll, hideHistory: hideActivityHistory, refresh: refreshActivity } = activity;
  const resourceUpdate = useCharacterResourceUpdate(id || '');
  const prepareTurnApplication = useConditionTurnApplication(character, receipt => {
    const payload = receipt.payload as Record<string, import('@/integrations/supabase/types').Json>;
    const after = payload.after as { hp_current: number; pe_current: number; san_current: number; conditions: Character['conditions'] };
    setHpCurrent(after.hp_current); setPeCurrent(after.pe_current); setSanCurrent(after.san_current);
    setCharacter(previous => previous?.id === receipt.character_id ? { ...previous, ...after } : previous);
    void activity.refetch();
    // Em um retry, o recibo pode ser anterior a outra edição: recuperar também o estado atual.
    void refetchCharacter().catch(() => toast({ title:'Turno confirmado', description:'Recarregue para conferir o estado atual.', variant:'destructive' }));
  });
  const rollHistory = activityRollEntries(activity.events, id || '').map(entryDiceResult);
  
  // Modais
  const [nexModalOpen, setNexModalOpen] = useState(false);
  const [ritualModalOpen, setRitualModalOpen] = useState(false);
  const [pendingRitualSlots, setPendingRitualSlots] = useState(0);
  const [pendingMaxCircle, setPendingMaxCircle] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalInitialTab, setEditModalInitialTab] = useState('info');
  const [restModalOpen, setRestModalOpen] = useState(false);
  const [paranormalPowerModalOpen, setParanormalPowerModalOpen] = useState(false);
  
  // Modal de correção de perícias faltantes (auditoria)
  const [missingSkillsModalOpen, setMissingSkillsModalOpen] = useState(false);
  
  // Modais de escolha para poderes paranormais
  const [intellectSkillModalOpen, setIntellectSkillModalOpen] = useState(false);
  const [elementResistanceModalOpen, setElementResistanceModalOpen] = useState(false);
  const [pendingPower, setPendingPower] = useState<ParanormalPower | null>(null);
  
  // Modal de detalhes de habilidade de classe
  const [abilityDetailOpen, setAbilityDetailOpen] = useState(false);
  const [selectedAbility, setSelectedAbility] = useState<{
    id: string;
    name: string;
    description: string;
    minNex: number;
    classId: string;
  } | null>(null);
  
  // Modal de rituais para não-ocultistas
  const [nonOccultistRitualModalOpen, setNonOccultistRitualModalOpen] = useState(false);
  const [ritualModalSource, setRitualModalSource] = useState<RitualSource>('ritual-aprendido');
  const [learnedRitualsFromPowers, setLearnedRitualsFromPowers] = useState<LearnedRitual[]>([]);

  // Modal de conjuração de rituais
  const [castModalOpen, setCastModalOpen] = useState(false);
  const [ritualToCast, setRitualToCast] = useState<Ritual | null>(null);
  
  // Modal de dano/cura de rituais (Fase 3)
  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [ritualForDamage, setRitualForDamage] = useState<Ritual | null>(null);
  const [ritualEnhancements, setRitualEnhancements] = useState<string[]>([]);
  const [pendingDamage, setPendingDamage] = useState<number>(0);
  
  // Modal de resistência (Fase 4)
  const [resistanceModalOpen, setResistanceModalOpen] = useState(false);
  const [resistanceEffect, setResistanceEffect] = useState<RitualEffect | null>(null);
  
  // Modal de condições (Fase 6)
  const [conditionModalOpen, setConditionModalOpen] = useState(false);
  const [pendingRitualConditions, setPendingRitualConditions] = useState<PendingCondition[]>([]);
  const [conditionRitualName, setConditionRitualName] = useState('');
  const [conditionRitualElement, setConditionRitualElement] = useState('');
  
  // Wizard de efeitos integrado (Fase 7)
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardRitual, setWizardRitual] = useState<Ritual | null>(null);
  const [wizardEnhancements, setWizardEnhancements] = useState<string[]>([]);
  const [wizardPeCost, setWizardPeCost] = useState(0);
  
  // Histórico de rituais conjurados na sessão
  const castHistory = activityRitualEntries(activity.events, id || '');
  
  // Modal de salvar como template
  const [templateSaveModalOpen, setTemplateSaveModalOpen] = useState(false);
  
  // ActionSheet mobile para ações do personagem
  const mobileActionsSheet = useActionSheet();
  
  // Modal de remoção de rituais excedentes
  const [excessRitualsModalOpen, setExcessRitualsModalOpen] = useState(false);
  
  // Modal de remoção de poderes paranormais excedentes
  const [excessPowersModalOpen, setExcessPowersModalOpen] = useState(false);
  
  // Modal de Grau de Treinamento (NEX 35% e 70%)
  const [trainingGradeModalOpen, setTrainingGradeModalOpen] = useState(false);
  const [trainingGradeNex, setTrainingGradeNex] = useState<35 | 70>(35);
  
  // Modal de Validação e Correção Automática
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  
  // Estado para verificar se personagem já usou Transcender em NEX >= 50
  // (necessário para determinar se deve exibir seletor de afinidade elemental)
  const [hasTranscendedPost50, setHasTranscendedPost50] = useState(false);

  // === ESTADOS DE UX (Fase 6) ===
  // Status de conectividade (offline/online)
  const { isOnline, checkRealConnectivity } = useOnlineStatus();
  
  // Status de salvamento (idle, saving, saved, error, offline)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Modal de atalhos de teclado
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  // === HOOK DE ATALHOS DE TECLADO (Fase 6 UX) ===
  // IMPORTANTE: Chamado ANTES dos early returns para respeitar as regras de hooks
  // Atalhos desativados durante loading, sem personagem, ou modais abertos
  useSheetKeyboardShortcuts({
    disabled: loading || !character || diceModalOpen || editModalOpen || nexModalOpen || ritualModalOpen || castModalOpen,
    onRollAttribute: (attr) => {
      if (!character) return; // Guard: personagem deve existir
      const attrMap: Record<string, { value: number; label: string }> = {
        agility: { value: character.agility, label: 'Agilidade' },
        strength: { value: character.strength, label: 'Força' },
        vigor: { value: character.vigor, label: 'Vigor' },
        intellect: { value: character.intellect, label: 'Intelecto' },
        presence: { value: character.presence, label: 'Presença' },
      };
      const attrData = attrMap[attr];
      if (attrData) {
        handleAttributeRoll(attrData.value, attrData.label);
      }
    },
    onRollInitiative: () => {
      if (!character) return; // Guard: personagem deve existir
      setRollLabel('Iniciativa');
      setRollAttribute(character.agility);
      setRollSkillBonus(0);
      setRollResistanceBonus(0);
      setRollExtraDice(0);
      setRollBonusSources([]);
      setRollTestedAttribute('agility');
      setDiceModalOpen(true);
    },
    onSave: () => {
      if (!character) return; // Guard: personagem deve existir
      handleManualSave();
    },
    onShowHelp: () => setShortcutsHelpOpen(true),
  });

  // Hook CONSOLIDADO de todos os bônus do personagem (inclui defenseBonuses e paranormalEffects)
  // OTIMIZAÇÃO: Evita chamadas duplicadas de hooks
  
  const sustainedState = useSustainedRituals({ characterId: character?.id, enabled: !!character });
  // O controle inclui sustentações conjuradas em outros alvos; bônus só afetam o destinatário.
  const sustainedRituals = useMemo(() => sustainedState.rituals.filter(ritual => ritual.characterId === character?.id), [sustainedState.rituals, character?.id]);
  
  // Bônus de combate de rituais sustentados (ataque, dano, dados extras)
  const ritualCombatSummary = useRitualCombatBonuses(sustainedRituals);
  
  // Hook centralizado de tracking de uso por rodada (habilidades 1x/rodada)
  const roundTracking = useRoundTracking();
  
  // Hook de efeitos ativados manualmente (integra com SUE) - com persistência no banco
  const activatedEffects = useActivatedEffects({
    characterId: character?.id,
    enablePersistence: !!character
  });
  
  const activeRitualsForDefense = useMemo(() =>
    sustainedRituals.map(r => ({
      ritualId: r.ritualId,
      ritualName: r.ritualName,
      enhancements: r.selectedEnhancements,
    })),
    [sustainedRituals]
  );
  
  // Detecta tipo de arma e proteção equipada para o sistema de bônus de classe
  const equippedWeaponInfo = useMemo(() => {
    const equippedWeapon = (character?.inventory || []).find(
      item => item.isEquipped && item.itemType === 'weapon'
    );
    if (!equippedWeapon) return { type: undefined, id: undefined, name: undefined, isLightMelee: false };
    
    // Mapeia tipos de arma para categorias do sistema (WeaponCategory)
    const weaponTypeMap: Record<string, 'melee' | 'ranged' | 'firearm' | 'tactical' | 'heavy' | 'unarmed' | 'any'> = {
      'melee': 'melee',
      'ranged': 'ranged',
      'firearm': 'firearm',
      'tactical': 'tactical',
      'heavy': 'heavy',
      'unarmed': 'unarmed',
      'corpo-a-corpo': 'melee',
      'distância': 'ranged',
      'arremesso': 'ranged',
      'arma-de-fogo': 'firearm',
    };
    
    const weaponType = equippedWeapon.weaponType 
      ? weaponTypeMap[equippedWeapon.weaponType.toLowerCase()] || 'any'
      : undefined;
    
    // Detecta se é arma leve corpo a corpo (melee + propriedade Ágil)
    // Armas leves são usadas para Aparas Precisas (+AGI em DEF)
    const weaponProperties = (equippedWeapon as any).properties || [];
    const hasAgileProperty = Array.isArray(weaponProperties) && 
      weaponProperties.some((p: string) => 
        p.toLowerCase().includes('ágil') || p.toLowerCase().includes('agil') || p.toLowerCase() === 'light'
      );
    const isLightMelee = weaponType === 'melee' && hasAgileProperty;
    
    return {
      type: weaponType,
      id: equippedWeapon.id,
      name: equippedWeapon.name,
      isLightMelee,
    };
  }, [character?.inventory]);
  
  const equippedWeaponType = equippedWeaponInfo.type;

  const equippedProtectionType = useMemo(() => {
    const equippedArmor = (character?.inventory || []).find(
      item => item.isEquipped && (item.itemType === 'armor' || item.itemType === 'protection')
    );
    if (!equippedArmor?.armorType) return undefined;
    // Mapeia tipos de armadura para categorias do sistema (ProtectionCategory)
    const armorTypeMap: Record<string, 'light' | 'heavy' | 'any'> = {
      'leve': 'light',
      'pesada': 'heavy',
      'light': 'light',
      'heavy': 'heavy',
    };
    return armorTypeMap[equippedArmor.armorType.toLowerCase()] || 'any';
  }, [character?.inventory]);

  // Monta condições ativas para o SUE
  const activeConditionsForSUE = useMemo(() => 
    (character?.conditions || []).map(c => typeof c === 'string' ? c : c.id),
    [character?.conditions]
  );

  // Hook SUE como fonte única de verdade para todos os bônus
  const bonusSummary = useBonusSummaryFromSUE({
    characterId: character?.id,
    origin: character?.origin || '',
    abilities: character?.abilities || [],
    generalPowers: character?.general_powers || [],
    paranormalPowers: character?.paranormal_powers || [],
    inventory: character?.inventory || [],
    nex: character?.nex || 5,
    elementalAffinity: character?.elemental_affinity,
    affinityActive: character?.affinity_active,
    activeConditionalBonuses: character?.active_conditional_bonuses || [],
    activatedEffectIds: activatedEffects.activatedEffectIds,
    activeRituals: activeRitualsForDefense,
    skills: character?.skills || {},
    intellect: character?.intellect || 1,
    vigor: character?.vigor || 1,
    strength: character?.strength || 1,
    agility: character?.agility || 1,
    presence: character?.presence || 1,
    classId: character?.class,
    classTrack: character?.class_track,
    classPowers: savedClassPowerNames(character?.powers),
    equippedWeaponType,
    equippedProtectionType,
    equippedWeaponId: equippedWeaponInfo.id,
    equippedWeaponName: equippedWeaponInfo.name,
    isLightMeleeEquipped: equippedWeaponInfo.isLightMelee,
    inCombat: false,
    hpCurrent,
    hpMax: character?.hp_max || 0,
    peCurrent,
    peMax: character?.pe_max || 0,
    activeConditions: activeConditionsForSUE,
    versatilityTrack: character?.versatility_track || undefined,
    classPowerChoices: character?.class_power_choices || {},
  });

  // Extrai hooks internos do bonusSummary para evitar chamadas duplicadas
  const defenseBonuses = bonusSummary.defenseBonuses;
  const paranormalEffects = bonusSummary.paranormalEffects;
  
  // Poderes ativáveis para DiceRollModal (Especialista, Combatente e Origens)
  // Recalculado dinamicamente quando o atributo testado muda (ex: Saber é Poder só aparece em testes de INT)
  // Extrai perícias escolhidas para Perito de class_power_choices
  const peritoSkillsForActivation = useMemo(() => {
    if (!character?.class_power_choices) return [];
    const peritoChoice = Object.values(character.class_power_choices).find(
      (choice) => choice.powerId === 'perito'
    );
    return peritoChoice?.chosenValues || [];
  }, [character?.class_power_choices]);
  
  const activatablePowersForCharacter = useMemo(() => {
    if (!character) return [];
    return getActivatablePowersForCharacter({
      powers: character.powers || [],
      abilities: character.abilities || [],
      nex: character.nex || 5,
      peCurrent,
      intellect: character.intellect || 1,
      trainedSkills: Object.keys(character.skills || {}).filter(s => (character.skills?.[s] || 0) >= 1),
      peritoSkills: peritoSkillsForActivation, // Perícias escolhidas para Perito
      characterClass: character.class,
      classTrack: character.class_track, // Trilha para poderes como Ataque Extra
      origin: character.origin, // Para poderes de origem como "Saber é Poder" (Acadêmico)
      testedAttribute: rollTestedAttribute, // Atributo sendo testado (filtra poderes aplicáveis)
    });
  }, [character, peCurrent, rollTestedAttribute, peritoSkillsForActivation]);
  
  // Sistema Unificado de Efeitos já computado pelo useBonusSummaryFromSUE
  const unifiedEffects = bonusSummary.unifiedEffects;
  
  // Extrai bônus de dados extras ativos (Discurso Motivador +1d20 ou +2d20)
  const globalDiceBonus = useMemo(() => {
    // Verifica se Discurso Motivador está ativo nos efeitos ativados
    const discursoEffect = activatedEffects.activatedEffects.find(
      e => e.id === 'track-discurso-motivador'
    );
    if (discursoEffect) {
      // Extrai o diceBonus do metadata (1 ou 2 dados extras)
      return (discursoEffect.metadata?.diceBonus as number) ?? 1;
    }
    return 0;
  }, [activatedEffects.activatedEffects]);
  
  // Hook de bônus de rituais derivado do SUE (DT, dano, redução de PE)
  const ritualBonuses = useRitualBonusesFromSUE(unifiedEffects, {
    intellect: character?.intellect || 1,
    vigor: character?.vigor || 1,
    strength: character?.strength || 1,
    agility: character?.agility || 1,
    presence: character?.presence || 1,
  });

  // Hook de aplicação automática de condições (HP=0 → Inconsciente, SAN=0 → Enlouquecendo)
  const { processResourceChange } = useAutoConditions();

  // Handler para atualizar bônus condicionais no estado local
  const handleConditionalBonusesChange = useCallback((newBonuses: string[]) => {
    setCharacter(prev => prev ? { ...prev, active_conditional_bonuses: newBonuses } : null);
  }, []);

  // Hook de sincronização de bônus condicionais com o banco
  const { toggleBonus: handleToggleConditionalBonus, clearAllBonuses: clearConditionalBonuses } = useConditionalBonusesSync({
    characterId: id || '',
    activeBonuses: character?.active_conditional_bonuses || [],
    onBonusesChange: handleConditionalBonusesChange,
    enabled: !!character,
  });

  // Sincroniza conjurações de rituais com a campanha em tempo real
  const { 
    isInCampaign, 
    syncRitualCast,
    campaignId: ritualCampaignId, campaignVersion: ritualCampaignVersion,
    sessionId: ritualCampaignSessionId,
    error: ritualSyncError,
  } = useCampaignRitualSync({
    characterId: id || '',
    userId: user?.id || '',
    enabled: !!character,
  });

  // OTIMIZAÇÃO: Sincroniza bônus com a campanha apenas se estiver em uma
  // Movido para depois do useCampaignRitualSync para usar isInCampaign
  useBonusSync({
    characterId: id || '',
    bonusSummary,
    enabled: !!character,
    isInCampaign, // Evita queries desnecessárias se não está em campanha
  });

  // Handler para salvar buffs de armas na nuvem
  const handleWeaponBuffsChange = useCallback(async (buffs: import('@/hooks/useWeaponBuffs').WeaponBuff[]) => {
    if (!character) return;
    
    const { error } = await supabase
      .from('characters')
      .update({ active_buffs: JSON.parse(JSON.stringify(buffs)) })
      .eq('id', character.id);

    if (error) {
      console.error('Erro ao salvar buffs:', error);
    }
  }, [character?.id]);

  // Hook de buffs de armas de rituais (Fase 8) - com persistência na nuvem
  const {
    activeBuffs: weaponBuffs,
    addBuff: addWeaponBuff,
    addBuffWithDuration: addWeaponBuffWithDuration,
    removeBuff: removeWeaponBuff,
    clearAllBuffs: clearWeaponBuffs,
    advanceTurn: advanceWeaponBuffTurn,
    setBuffTurns: setWeaponBuffTurns,
    buffsWithTurns: weaponBuffsWithTurns,
    hadAutoCorrections: weaponBuffsHadCorrections,
    clearAutoCorrectionsFlag: clearWeaponBuffsCorrectionsFlag,
  } = useWeaponBuffs(id, character?.active_buffs, handleWeaponBuffsChange);

  // Hook para rastrear "Primeira Impressão" do Especialista
  const primeiraImpressao = usePrimeiraImpressao({
    classPowers: character?.powers || [],
    abilities: character?.abilities || {},
    characterClass: character?.class,
  });

  // Callback para adicionar rolagem ao histórico e marcar perícia testada
  const handleRollComplete = useCallback((result: DiceRollResult) => {
    if (!result.activityOperationId) void saveActivityRoll({ entry: activityJson(diceHistoryEntry(result)), label: result.label || 'Teste', type: result.type });
    // Marca a perícia como testada para Primeira Impressão
    if (rollTestedAttribute) {
      primeiraImpressao.markSkillAsTested(rollTestedAttribute);
    }
  }, [rollTestedAttribute, primeiraImpressao, saveActivityRoll]);

  // Limpar histórico
  const handleClearHistory = useCallback(() => {
    void hideActivityHistory().catch(() => undefined);
  }, [hideActivityHistory]);

  // Verifica se personagem já usou Transcender em NEX >= 50
  // Isso determina se o seletor de afinidade elemental deve aparecer
  useEffect(() => {
    const checkTranscenderPost50 = async () => {
      // Só precisa verificar se NEX >= 50 e ainda não tem afinidade
      if (!character || character.nex < 50 || character.elemental_affinity) {
        setHasTranscendedPost50(false);
        return;
      }
      
      // Verificação rápida: se já tem poderes paranormais, provavelmente usou Transcender
      const hasParanormal = hasParanormalPowersFromTranscender(character.paranormal_powers);
      if (hasParanormal) {
        setHasTranscendedPost50(true);
        return;
      }
      
      // Verificação detalhada: consulta registros de power_choices no banco
      const result = await hasUsedTranscenderPostNex50(character.id);
      setHasTranscendedPost50(result);
    };
    
    checkTranscenderPost50();
  }, [character?.id, character?.nex, character?.elemental_affinity, character?.paranormal_powers]);

  // Fetch character data
  useEffect(() => {
    // Reset migration state quando mudar de personagem
    resetMigration();
    
    async function fetchCharacter() {
      if (!id || !user) return;

      const read = await readCharacter();
      if (!read) return;
      const { data, error } = read;

      if (error || !data) {
        setReadError('Não foi possível carregar a ficha. Verifique a conexão e o acesso.');
        setLoading(false);
        return;
      }

      // Parse inventory
      let inventory: InventoryItemPersisted[] = Array.isArray(data.inventory) 
        ? (data.inventory as unknown as InventoryItemPersisted[]) 
        : [];
      
      // Executa migração automática de equipamentos se necessário
      const migrationResult = await runMigration(id, inventory as any);
      if (!read.isCurrent()) return;
      if (migrationResult) {
        inventory = migrationResult.inventory as unknown as InventoryItemPersisted[];
        console.log('[CharacterSheet] Equipamentos migrados automaticamente');
        
        // Monta mensagem detalhada
        const details: string[] = [];
        if (migrationResult.armorCount > 0) {
          details.push(`${migrationResult.armorCount} armadura(s)`);
        }
        if (migrationResult.weaponCount > 0) {
          details.push(`${migrationResult.weaponCount} arma(s)`);
        }
        if (migrationResult.itemCount > 0) {
          details.push(`${migrationResult.itemCount} item(ns)`);
        }
        
        toast({
          title: 'Equipamentos Corrigidos',
          description: `${details.join(', ')} foram atualizados automaticamente com os valores corretos do catálogo.`,
        });
      }

      // Usa função utilitária para parsing consistente
      const charData = parseCharacterDataFromDB(data, inventory);
      setReadError(null);
      setCharacter(charData as unknown as Character);
      setHpCurrent(data.hp_current);
      setPeCurrent(data.pe_current);
      setSanCurrent(data.san_current);
      setLoading(false);
      
      // Busca registros de character_power_choices para contagem correta de Transcender
      // NOTA: A sincronização automática de legados foi removida pois criava registros incorretos
      // para Ocultistas que ganham poderes paranormais pela classe (não por Transcender)
    }

    fetchCharacter();
  }, [id, user, navigate, toast, runMigration, resetMigration, readCharacter]);
  
  // Função de refetch para atualizar dados do personagem após correções
  // Retorna os dados atualizados para uso imediato (ex: revalidação)
  const refetchCharacter = useCallback(async (): Promise<Character | null | undefined> => {
    if (!id || !user) return null;
    
    const read = await readCharacter();
    // Uma leitura mais recente substituiu esta; isso não é falha de conexão.
    // null permanece reservado à falha atual, undefined indica descarte seguro.
    if (!read) return undefined;
    const { data, error } = read;
    
    if (!error && data) {
      const inventory = Array.isArray(data.inventory) 
        ? (data.inventory as unknown as InventoryItemPersisted[]) 
        : [];
      
      // Usa função utilitária para parsing consistente
      const charData = parseCharacterDataFromDB(data, inventory);
      setReadError(null);
      
      setCharacter(charData);
      setHpCurrent(data.hp_current);
      setPeCurrent(data.pe_current);
      setSanCurrent(data.san_current);
      setLoading(false);
      
      console.log('[CharacterSheet] Dados do personagem atualizados após correção');
      return charData;
    }
    setReadError('Não foi possível atualizar a ficha. Verifique a conexão e tente carregar novamente.');
    setLoading(false);
    return null;
  }, [id, user, readCharacter]);

  useEffect(() => {
    const refreshFromServer = (event: Event) => {
      if ((event as CustomEvent<string>).detail === id) void refetchCharacter();
    };
    window.addEventListener('character-server-updated', refreshFromServer);
    return () => window.removeEventListener('character-server-updated', refreshFromServer);
  }, [id, refetchCharacter]);

  // Handler para rolar atributo (inclui detecção de resistências)
  const handleAttributeRoll = useCallback((attributeValue: number, attributeName: string) => {
    setRollLabel(attributeName);
    setRollAttribute(attributeValue);
    setRollSkillBonus(0);
    
    // Detecta o atributo sendo testado para filtrar poderes ativáveis (ex: Saber é Poder só aparece em INT)
    const labelLower = attributeName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let testedAttr: 'strength' | 'agility' | 'vigor' | 'intellect' | 'presence' | undefined;
    if (labelLower.includes('forca') || labelLower.includes('strength')) testedAttr = 'strength';
    else if (labelLower.includes('agilidade') || labelLower.includes('agility')) testedAttr = 'agility';
    else if (labelLower.includes('vigor')) testedAttr = 'vigor';
    else if (labelLower.includes('intelecto') || labelLower.includes('intellect')) testedAttr = 'intellect';
    else if (labelLower.includes('presenca') || labelLower.includes('presence')) testedAttr = 'presence';
    setRollTestedAttribute(testedAttr);
    
    // Detecta se é um teste de resistência e aplica bônus (reutiliza labelLower)
    let resistBonus = 0;
    let resistType: 'fortitude' | 'reflexos' | 'vontade' | null = null;
    
    if (labelLower.includes('fortitude') || labelLower.includes('vigor')) {
      resistBonus = defenseBonuses.resistances.fortitude;
      resistType = 'fortitude';
    } else if (labelLower.includes('reflexos') || labelLower.includes('agilidade')) {
      resistBonus = defenseBonuses.resistances.reflexos;
      resistType = 'reflexos';
    } else if (labelLower.includes('vontade') || labelLower.includes('presença')) {
      resistBonus = defenseBonuses.resistances.vontade;
      resistType = 'vontade';
    }
    
    // Constrói as fontes de bônus para exibição detalhada com descrições
    const sources: BonusSource[] = [];
    if (resistBonus > 0 && resistType) {
      const descriptions: Record<string, string> = {
        fortitude: 'Resistência contra venenos, doenças e efeitos físicos',
        reflexos: 'Resistência contra armadilhas e efeitos que exigem esquiva',
        vontade: 'Resistência contra efeitos mentais e paranormais',
      };
      sources.push({
        label: resistType === 'fortitude' ? 'Fortitude' : 
               resistType === 'reflexos' ? 'Reflexos' : 'Vontade',
        value: resistBonus,
        type: 'resistance',
        description: descriptions[resistType],
      });
    }
    
    setRollResistanceBonus(resistBonus);
    setRollBonusSources(sources);
    setDiceModalOpen(true);
  }, [defenseBonuses.resistances]);

  // Handler para rolar perícia (inclui bônus de poderes de classe, resistências e dados extras)
  const handleSkillRoll = useCallback((total: number, skillName: string, attributeValue: number, classPowerBonus?: number, extraDice?: number) => {
    // O total já inclui atributo + treinamento + bônus de poderes de classe
    const skillBonus = total - attributeValue;
    setRollLabel(skillName);
    setRollAttribute(attributeValue);
    setRollSkillBonus(skillBonus);
    // Dados extras: Discurso Motivador + Primeira Impressão
    const primeiraImpressaoBonus = primeiraImpressao.getExtraDiceForSkill(skillName);
    setRollExtraDice((extraDice || 0) + primeiraImpressaoBonus);
    
    // Constrói as fontes de bônus para exibição detalhada
    const sources: BonusSource[] = [];
    
    // Obtém o ID da perícia para buscar detalhes e filtrar poderes ativáveis
    const skillId = skillName.toLowerCase().replace(/\s+/g, '-');
    
    // CORREÇÃO: Define o skillId para filtrar poderes ativáveis (ex: Desbravador, Saber é Poder)
    // Antes passava apenas o atributo, agora passa o ID real da perícia
    setRollTestedAttribute(skillId as typeof rollTestedAttribute);
    const skillBonusEntry = bonusSummary.skills[skillId];
    
    // Treinamento (skillBonus sem classPowerBonus)
    const trainingBonus = skillBonus - (classPowerBonus || 0);
    if (trainingBonus > 0) {
      sources.push({
        label: 'Treinamento',
        value: trainingBonus,
        type: 'skill',
        description: `Perícia treinada em ${skillName}`,
      });
    }
    
    // Bônus de poder de classe com detalhamento
    if (classPowerBonus && classPowerBonus > 0) {
      // Tenta identificar a fonte do bônus pelo breakdown
      const powerSourceName = skillBonusEntry?.breakdown?.[0]?.source || 'Poder de Classe';
      sources.push({
        label: 'Poder de Classe',
        value: classPowerBonus,
        type: 'power',
        sourceName: powerSourceName,
        description: `Bônus concedido por ${powerSourceName}`,
      });
    }
    
    // Dados extras (Discurso Motivador)
    if (extraDice && extraDice > 0) {
      sources.push({
        label: 'Discurso Motivador',
        value: extraDice,
        type: 'power',
        sourceName: 'Negociador',
        description: `+${extraDice}d20 no pool de dados (até fim da cena)`,
      });
    }
    
    // Dados extras (Primeira Impressão)
    if (primeiraImpressaoBonus > 0) {
      sources.push({
        label: 'Primeira Impressão',
        value: primeiraImpressaoBonus,
        type: 'power',
        sourceName: 'Especialista',
        description: '+1d20 no primeiro teste social da cena',
      });
    }
    
    // Detecta se é um teste de resistência e aplica bônus
    const labelLower = skillName.toLowerCase();
    let resistBonus = 0;
    
    if (labelLower.includes('fortitude')) {
      resistBonus = defenseBonuses.resistances.fortitude;
      if (resistBonus > 0) {
        sources.push({ 
          label: 'Fortitude', 
          value: resistBonus, 
          type: 'resistance',
          description: 'Bônus de resistência contra efeitos físicos',
        });
      }
    } else if (labelLower.includes('reflexos')) {
      resistBonus = defenseBonuses.resistances.reflexos;
      if (resistBonus > 0) {
        sources.push({ 
          label: 'Reflexos', 
          value: resistBonus, 
          type: 'resistance',
          description: 'Bônus de resistência contra efeitos que exigem agilidade',
        });
      }
    } else if (labelLower.includes('vontade')) {
      resistBonus = defenseBonuses.resistances.vontade;
      if (resistBonus > 0) {
        sources.push({ 
          label: 'Vontade', 
          value: resistBonus, 
          type: 'resistance',
          description: 'Bônus de resistência contra efeitos mentais',
        });
      }
    }
    
    setRollResistanceBonus(resistBonus);
    setRollBonusSources(sources);
    setDiceModalOpen(true);
  }, [defenseBonuses.resistances, bonusSummary.skills]);

  // Recursos e condições são comparados e gravados em uma única operação.
  const handleCombatStatsChange = async (stats: { hp: number; pe: number; san: number }) => {
    if (!character) return false;
    const values = { hp: Math.max(0, Math.min(stats.hp, character.hp_max)),
      pe: Math.max(0, Math.min(stats.pe, character.pe_max)), san: Math.max(0, Math.min(stats.san, character.san_max)) };
    const autoResult = processResourceChange(values.hp, character.hp_max, values.san, character.san_max,
      character.conditions.map(parseCondition), false, { hp: character.hp_current, san: character.san_current });
    const conditions = autoResult.newConditions.map(serializeCondition);
    setSaveStatus('saving');
    const receipt = await resourceUpdate.execute(values,
      activityJson(conditions) as import('@/integrations/supabase/types').Json[],
      { hp_current: character.hp_current, hp_max: character.hp_max, pe_current: character.pe_current,
        pe_max: character.pe_max, san_current: character.san_current, san_max: character.san_max,
        conditions: activityJson(character.conditions) });
    if (!receipt) { setSaveStatus('error'); return false; }
    setHpCurrent(values.hp); setPeCurrent(values.pe); setSanCurrent(values.san);
    setCharacter(prev => prev ? { ...prev, hp_current: values.hp, pe_current: values.pe,
      san_current: values.san, conditions } : null);
    setSaveStatus('saved'); setLastSaved(new Date());
    if (autoResult.messages.length) toast({ title: 'Condições confirmadas', description: autoResult.messages.join(' ') });
    void activity.refetch();
    if (!await refetchCharacter()) toast({ title: 'Recursos confirmados', description: 'A ficha não foi atualizada. Recarregue para conferir o estado atual.', variant: 'destructive' });
    return true;
  };

  // ==================== CALLBACKS MEMOIZADOS (REFATORAÇÃO) ====================
  
  // Usa o snapshot atual da ficha. A confirmação de uma rolagem conserva este
  // callback para repetir o mesmo pedido sem sobrescrever uma alteração concorrente.
  const handlePEChange = (newPE: number) =>
    handleCombatStatsChange({ hp: hpCurrent, pe: newPE, san: sanCurrent });

  /**
   * Handler memoizado para mudança de PE com delta (ex: Infiltrador)
   */
  const handlePEDelta = useCallback(
    (delta: number) => {
      handleCombatStatsChange({ hp: hpCurrent, pe: peCurrent + delta, san: sanCurrent });
    },
    [hpCurrent, peCurrent, sanCurrent]
  );

  /**
   * Handler memoizado para mudança de HP
   */
  const handleHPChange = useCallback(
    (newHP: number) => {
      handleCombatStatsChange({ hp: newHP, pe: peCurrent, san: sanCurrent });
    },
    [peCurrent, sanCurrent]
  );

  // ==================== DADOS DERIVADOS MEMOIZADOS (REFATORAÇÃO) ====================
  
  /**
   * Poderes paranormais enriquecidos com dados completos do catálogo
   * Evita repetir o .map() com PARANORMAL_POWERS.find() em 8+ lugares
   */
  const enrichedParanormalPowers = useMemo(() => {
    const powers = character?.paranormal_powers;
    if (!powers || powers.length === 0) return [];
    
    return powers.map(p => {
      const fullPower = PARANORMAL_POWERS.find(fp => fp.id === p.id);
      return fullPower || {
        id: p.id,
        name: p.name,
        element: p.element as ParanormalElement | 'generic',
        description: p.description,
        effect: { type: 'special' as const, description: p.description },
      };
    });
  }, [character?.paranormal_powers]);

  /**
   * Condições parseadas do formato persistido para ActiveCondition
   * Evita repetir character.conditions.map(parseCondition) em 7+ lugares
   */
  const parsedConditions = useMemo(
    () => (character?.conditions || []).map(parseCondition),
    [character?.conditions]
  );

  const handleManualSave = useCallback(async () => {
    if (!character || saving) return;
    
    setSaveStatus('saving');
    
    try {
      const { error } = await supabase
        .from('characters')
        .update({
          hp_current: hpCurrent,
          pe_current: peCurrent,
          san_current: sanCurrent,
        })
        .eq('id', character.id);

      if (error) throw error;
      
      setSaveStatus('saved');
      setLastSaved(new Date());
      
      // Volta para idle após 3 segundos
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    }
  }, [character, saving, hpCurrent, peCurrent, sanCurrent]);

  // Handler para abrir modal de conjuração de ritual
  const ritualApplication = useRitualApplication(id || '', refetchCharacter);
  const temporaryResources = useTemporaryResources(id || '');
  const peBudget = usePETurnBudget(id || '');
  const { beginCast: beginRitualCast, cast: confirmRitualCast } = ritualApplication;
  const castingRequirements = useRitualSituationalContext(id || '', ritualToCast?.id, castModalOpen);
  const [ritualTargetId, setRitualTargetId] = useState<string | null>(null);
  const ritualTargets = useRitualApplicationTargets(id || '');
  const selectedRitualTarget = ritualTargets.targets.find(target => target.id === ritualTargetId);
  // O alvo precisa ser selecionado. O snapshot do servidor protege contra sobrescrever outra alteração.
  const applyRitualToTarget = async (kind: 'heal' | 'damage' | 'temporary_hp' | 'conditions' | 'weapon_buff' | 'sustain', value: import('@/integrations/supabase/types').Json, damageType?: string) => {
    if (!ritualTargetId) throw new Error('Selecione a ficha que receberá o efeito.');
    await ritualApplication.apply(kind, value, damageType ? { damageType } : {}, ritualTargetId);
    if (kind === 'sustain') await sustainedState.reload();
  };

  const handleOpenCastModal = useCallback((ritual: Ritual) => {
    if (!beginRitualCast()) return;
    setRitualToCast(ritual);
    setRitualTargetId(null);
    setCastModalOpen(true);
  }, [beginRitualCast]);

  // Handler para confirmar conjuração de ritual (desconta PE e registra no histórico)
  const handleCastRitual = useCallback(async (ritual: Ritual, peCost: number, enhancements: string[], _activeModifiers?: string[], _counterRitualCost?: number, concentration: CastingConcentrationContext = DEFAULT_CASTING_CONCENTRATION) => {
    if (!character) return false;

    const peBeforeCast = peCurrent;
    let newPe: number;
    let concentrationFailure: string | null = null;
    try {
      const event = await confirmRitualCast(peBeforeCast, peCost, {
        ritualId: ritual.id, ritualName: ritual.name, ritualElement: ritual.element, ritualCircle: ritual.circle, enhancements, sessionId: ritualCampaignSessionId,
        ...(concentration.situational ? { situational: activityJson(concentration.situational) } : {}),
      }, ritualCampaignId && ritualCampaignVersion ? { campaignId: ritualCampaignId, campaignVersion: ritualCampaignVersion } : {},
        () => ({ concentration: activityJson(rollCastingConcentration(concentration, getCastingWillConfig(character.presence, character.skills || {}, bonusSummary, activeConditionsForSUE, globalDiceBonus))),
          paranormalCost: activityJson(rollParanormalCost(ritual.element, character.intellect, character.skills || {}, bonusSummary, activeConditionsForSUE, globalDiceBonus)),
          expectedSan: sanCurrent, expectedSanMax: character.san_max, requirementsConfirmed: concentration.requirementsConfirmed === true }));
      const payload = event.payload as { peAfter?: number };
      if (typeof payload.peAfter !== 'number') throw new Error('O servidor não confirmou o saldo de PE.');
      newPe = payload.peAfter;
      const confirmed = event.payload as { sanAfter?: number; sanMaxAfter?: number };
      if (typeof confirmed.sanAfter === 'number' && typeof confirmed.sanMaxAfter === 'number') {
        setSanCurrent(confirmed.sanAfter);
        setCharacter(prev => prev ? { ...prev, san_current: confirmed.sanAfter!, san_max: confirmed.sanMaxAfter! } : null);
      }
      concentrationFailure = getConcentrationFailureMessage(event.payload);
    } catch (error) {
      toast({
        title: 'Erro ao conjurar',
        description: error instanceof Error ? error.message : 'O gasto de PE não foi confirmado. Recarregue a ficha.',
        variant: 'destructive',
      });
      return false;
    }

    setPeCurrent(newPe);
    setCharacter(prev => prev ? { ...prev, pe_current: newPe } : null);

    if (concentrationFailure) {
      await refreshActivity().catch(() => undefined);
      toast({ title: 'Concentração falhou', description: concentrationFailure, variant: 'destructive' });
      return { effectsAllowed: false };
    }

    // Registrar no histórico da sessão
    try { await refreshActivity(); }
    catch { window.dispatchEvent(new CustomEvent('character-history-save-failed', { detail: character.id })); }

    // Sincroniza com a campanha em tempo real (se estiver em uma)
    if (isInCampaign) {
      try { await syncRitualCast(ritual, peCost, enhancements, peBeforeCast, newPe); }
      catch { window.dispatchEvent(new CustomEvent('character-history-save-failed', { detail: character.id })); }
    }

    const enhText = enhancements.length > 0 
      ? ` (${enhancements.join(', ')})` 
      : '';

    // Verifica se o ritual tem efeitos a processar
    const activeEffect = getActiveRitualEffect(ritual.id, enhancements);
    const hasEffects = activeEffect && (
      activeEffect.damage || 
      activeEffect.healing || 
      activeEffect.tempHP ||
      activeEffect.weaponEffect ||
      activeEffect.appliesConditions?.length ||
      activeEffect.defenseModifier !== undefined ||
      activeEffect.attackModifier !== undefined
    );
    
    // Fase 7: Se o ritual tem efeitos, abre o wizard integrado
    if (hasEffects) {
      setWizardRitual(ritual);
      setWizardEnhancements(enhancements);
      setWizardPeCost(peCost);
      setWizardOpen(true);
      
      toast({
        title: `${ritual.name} conjurado!`,
        description: `${peCost} PE consumido${enhText}. Processando efeitos...`,
      });
    } else {
      // Ritual sem efeitos mapeados
      toast({
        title: `${ritual.name} conjurado!`,
        description: `${peCost} PE consumido${enhText}. PE restante: ${newPe} • Histórico salvo`,
      });
    }

    // Registrar no histórico de mudanças permanente
    await logCharacterChanges(character.id, user?.id || '', [{
      fieldName: 'pe_current',
      changeType: 'ritual_cast',
      oldValue: String(peCurrent),
      newValue: String(newPe),
      description: `Conjurou ${ritual.name}${enhText} (-${peCost} PE)`,
    }]);
    return true;
  }, [character, peCurrent, toast, user?.id, isInCampaign, syncRitualCast, confirmRitualCast, ritualCampaignId, ritualCampaignVersion, ritualCampaignSessionId, refreshActivity, bonusSummary, globalDiceBonus, activeConditionsForSUE]);

  // Limpar histórico de conjurações
  const handleClearCastHistory = useCallback(() => {
    void hideActivityHistory().catch(() => { toast({ title: 'Histórico não ocultado', description: 'Tente novamente.', variant: 'destructive' }); });
  }, [hideActivityHistory, toast]);

  // Handler para deletar personagem
  const handleDelete = async () => {
    if (!character) return;
    
    if (!confirm(`Tem certeza que deseja excluir ${character.name}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', character.id);

    if (error) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Personagem excluído',
        description: `${character.name} foi removido do sistema.`,
      });
      navigate('/dashboard');
    }
  };

  // Handler para progressão de NEX
  const handleLevelUp = async (newNex: number, newStats: {
    hp_max: number;
    pe_max: number;
    san_max: number;
    patent: string;
    newAbilities: string[];
    elemental_affinity?: ParanormalElement | null;
    affinity_active?: boolean;
    paranormal_powers?: ParanormalPower[];
    attributeIncrease?: string;
    versatilityChoice?: { type: string; trackId?: string; trackName?: string; abilityId?: string; abilityName?: string };
    skillUpgrades?: string[]; // Perícias selecionadas para Grau de Treinamento
    classPowerChoices?: Record<string, { powerId: string; choiceType: string; chosenValues: string[] }>; // Sub-escolhas de poderes de classe
  }) => {
    if (!character) return;

    const updatedAbilities = [
      ...character.abilities,
      ...newStats.newAbilities,
    ];

    // Prepara poderes paranormais atualizados
    const updatedParanormalPowers = newStats.paranormal_powers 
      ? newStats.paranormal_powers.map(p => ({
          id: p.id,
          name: p.name,
          element: p.element,
          description: p.description,
        }))
      : character.paranormal_powers;

    // Prepara dados base de atualização
    const updateData: Record<string, any> = {
      nex: newNex,
      hp_max: newStats.hp_max,
      hp_current: hpCurrent + (newStats.hp_max - character.hp_max),
      pe_max: newStats.pe_max,
      pe_current: peCurrent + (newStats.pe_max - character.pe_max),
      san_max: newStats.san_max,
      san_current: sanCurrent + (newStats.san_max - character.san_max),
      patent: newStats.patent,
      abilities: updatedAbilities,
      elemental_affinity: newStats.elemental_affinity ?? character.elemental_affinity,
      affinity_active: newStats.affinity_active ?? character.affinity_active,
      paranormal_powers: updatedParanormalPowers,
    };

    // Se há aumento de atributo, aplica
    if (newStats.attributeIncrease) {
      const attr = newStats.attributeIncrease as keyof typeof character;
      const currentValue = character[attr] as number;
      if (currentValue < 5) {
        updateData[attr] = currentValue + 1;
        
        // Recalcular HP se for Vigor
        if (attr === 'vigor') {
          const newVigor = currentValue + 1;
          // HP aumenta em +1 por ponto de Vigor por incremento de NEX (simplificado para +1 HP)
          updateData.hp_max = updateData.hp_max + 1;
          updateData.hp_current = updateData.hp_current + 1;
        }
        
        // Recalcular PE se for Presença
        if (attr === 'presence') {
          const newPresence = currentValue + 1;
          // PE aumenta em +1 por ponto de Presença por incremento de NEX (simplificado para +1 PE)
          updateData.pe_max = updateData.pe_max + 1;
          updateData.pe_current = updateData.pe_current + 1;
        }
      }
    }
    
    // Se há escolha de Versatilidade e escolheu trilha diferente, 
    // salva a trilha secundária para aplicação de efeitos pelo SUE
    if (newStats.versatilityChoice?.type === 'track_ability' && newStats.versatilityChoice.trackId) {
      updateData.versatility_track = {
        trackId: newStats.versatilityChoice.trackId,
        trackName: newStats.versatilityChoice.trackName,
        abilityId: newStats.versatilityChoice.abilityId,
        abilityName: newStats.versatilityChoice.abilityName
      };
      console.log(`[Versatilidade] ${character.name} adquiriu habilidade "${newStats.versatilityChoice.abilityName}" da trilha "${newStats.versatilityChoice.trackName}"`);
    }
    
    // Se há escolha de Grau de Treinamento, aplica upgrades de perícias
    if (newStats.skillUpgrades && newStats.skillUpgrades.length > 0) {
      const updatedSkills = { ...character.skills };
      for (const skillId of newStats.skillUpgrades) {
        const currentLevel = updatedSkills[skillId] || 0;
        updatedSkills[skillId] = Math.min(currentLevel + 1, 3);
      }
      updateData.skills = updatedSkills;
      console.log(`[Grau de Treinamento] ${character.name} aprimorou ${newStats.skillUpgrades.length} perícias no NEX ${newNex}%`);
    }
    
    // Se há sub-escolhas de poderes de classe, merge com existentes
    if (newStats.classPowerChoices && Object.keys(newStats.classPowerChoices).length > 0) {
      const existingChoices = character.class_power_choices || {};
      updateData.class_power_choices = {
        ...existingChoices,
        ...newStats.classPowerChoices,
      };
      console.log(`[Sub-escolhas] ${character.name} registrou ${Object.keys(newStats.classPowerChoices).length} sub-escolha(s) de poder de classe`);
    }

    const { error } = await supabase
      .from('characters')
      .update(updateData)
      .eq('id', character.id);

    if (error) {
      toast({
        title: 'Erro ao subir de NEX',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }

    const newHpCurrent = updateData.hp_current;
    const newPeCurrent = updateData.pe_current;
    const newSanCurrent = updateData.san_current;

    setCharacter(prev => prev ? {
      ...prev,
      nex: newNex,
      hp_max: updateData.hp_max,
      hp_current: newHpCurrent,
      pe_max: updateData.pe_max,
      pe_current: newPeCurrent,
      san_max: newStats.san_max,
      san_current: newSanCurrent,
      patent: newStats.patent,
      abilities: updatedAbilities,
      elemental_affinity: newStats.elemental_affinity ?? prev.elemental_affinity,
      affinity_active: newStats.affinity_active ?? prev.affinity_active,
      paranormal_powers: updatedParanormalPowers,
      // Atualiza trilha de Versatilidade se escolheu
      ...(newStats.versatilityChoice?.type === 'track_ability' && newStats.versatilityChoice.trackId ? {
        versatility_track: {
          trackId: newStats.versatilityChoice.trackId,
          trackName: newStats.versatilityChoice.trackName!,
          abilityId: newStats.versatilityChoice.abilityId!,
          abilityName: newStats.versatilityChoice.abilityName!,
        }
      } : {}),
      // Atualiza atributo se aumentado
      ...(newStats.attributeIncrease ? { [newStats.attributeIncrease]: (prev[newStats.attributeIncrease as keyof typeof prev] as number) + 1 } : {}),
      // Atualiza sub-escolhas de poderes de classe
      ...(newStats.classPowerChoices && Object.keys(newStats.classPowerChoices).length > 0 ? {
        class_power_choices: {
          ...(prev.class_power_choices || {}),
          ...newStats.classPowerChoices,
        }
      } : {}),
    } : null);

    setHpCurrent(newHpCurrent);
    setPeCurrent(newPeCurrent);
    setSanCurrent(newSanCurrent);

    toast({
      title: `NEX aumentado para ${newNex}%!`,
      description: `${character.name} subiu de nível!`,
    });

    // Verifica se Ocultista ganhou novos slots de ritual
    if (character.class === 'Ocultista') {
      const ocultistClass = CLASSES.find(c => c.id === 'Ocultista') as any;
      const ritualsPerNex = ocultistClass?.ritualsPerNex || {};
      
      const oldRitualInfo = ritualsPerNex[character.nex] || { count: 0, maxCircle: 1 };
      const newRitualInfo = ritualsPerNex[newNex] || { count: 0, maxCircle: 1 };
      
      const newSlots = newRitualInfo.count - oldRitualInfo.count;
      
      if (newSlots > 0) {
        setPendingRitualSlots(newSlots);
        setPendingMaxCircle(newRitualInfo.maxCircle);
        setRitualModalOpen(true);
      }
    }
  };

  // Handler para salvar novos rituais
  const handleRitualsConfirm = async (selectedRituals: string[]) => {
    if (!character) return;

    const updatedRituals = [...character.rituals, ...selectedRituals];

    const { error } = await supabase
      .from('characters')
      .update({ rituals: updatedRituals })
      .eq('id', character.id);

    if (error) {
      toast({
        title: 'Erro ao salvar rituais',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }

    setCharacter(prev => prev ? { ...prev, rituals: updatedRituals } : null);

    toast({
      title: 'Novos rituais aprendidos!',
      description: `${selectedRituals.length} ritual(is) adicionado(s).`,
    });
  };

  // Handler para adicionar poder paranormal via Transcender
  // REGRA: Ao usar Transcender, o personagem perde a Sanidade que teria ganho no NEX atual
  const handleParanormalPowerSelect = async (power: ParanormalPower) => {
    if (!character || !user) return;

    // Verifica se o poder requer uma escolha adicional
    const fullPower = getPowerById(power.id);
    if (fullPower?.requiresChoice) {
      setPendingPower(power);
      setParanormalPowerModalOpen(false);
      
      switch (fullPower.requiresChoice) {
        case 'skill_intellect':
          setIntellectSkillModalOpen(true);
          return;
        case 'ritual':
          // Abre modal de rituais para não-ocultistas
          setRitualModalSource('aprender-ritual-poder');
          setNonOccultistRitualModalOpen(true);
          return;
        case 'element_resistance':
          setElementResistanceModalOpen(true);
          return;
      }
    }

    // Fluxo normal para poderes sem escolha
    await saveParanormalPower(power);
  };
  
  // Função auxiliar para salvar poder paranormal com ou sem escolhas
  const saveParanormalPower = async (power: ParanormalPower, choices?: SavedParanormalPower['choices']) => {
    if (!character || !user) return;

    const currentPowers = character.paranormal_powers || [];
    const newPower: SavedParanormalPower = {
      id: power.id,
      name: power.name,
      element: power.element,
      description: power.description,
      choices,
    };
    
    const updatedPowers = [...currentPowers, newPower];
    
    // Calcula a sanidade que seria ganha no NEX atual (para aplicar penalidade de Transcender)
    const currentNex = character.nex;
    const previousNex = Math.max(5, currentNex - 5);
    // Transcender adiciona +1 ao contador existente de Transcender do personagem
    const existingTranscenderCount = countTranscender(character.abilities as string[]);
    const currentStats = calculateDerivedStats(character.class, character.vigor, character.presence, currentNex, character.origin, character.abilities as string[], existingTranscenderCount);
    const previousStats = calculateDerivedStats(character.class, character.vigor, character.presence, previousNex, character.origin, character.abilities as string[], existingTranscenderCount);
    const sanLoss = currentStats.san - previousStats.san;
    
    // Nova sanidade máxima e atual (reduz pelo custo do Transcender)
    const newSanMax = Math.max(0, character.san_max - sanLoss);
    const newSanCurrent = Math.min(character.san_current, newSanMax);

    const { error } = await supabase
      .from('characters')
      .update({ 
        paranormal_powers: updatedPowers,
        san_max: newSanMax,
        san_current: newSanCurrent,
      })
      .eq('id', character.id);

    if (error) {
      toast({
        title: 'Erro ao salvar poder',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    // Registrar no histórico de alterações
    await logCharacterChanges(character.id, user.id, [
      {
        changeType: 'transcender',
        fieldName: 'paranormal_powers',
        oldValue: String(currentPowers.length),
        newValue: power.name,
        description: `Adquiriu o poder "${power.name}" (${power.element}) via Transcender`,
      },
      ...(sanLoss > 0 ? [{
        changeType: 'transcender',
        fieldName: 'san_max',
        oldValue: String(character.san_max),
        newValue: String(newSanMax),
        description: `Perdeu ${sanLoss} SAN máxima pelo Transcender`,
      }] : []),
    ]);

    setCharacter(prev => prev ? { 
      ...prev, 
      paranormal_powers: updatedPowers,
      san_max: newSanMax,
      san_current: newSanCurrent,
    } : null);
    setPendingPower(null);

    toast({
      title: 'Poder Paranormal adquirido!',
      description: sanLoss > 0 
        ? `${power.name} foi adicionado. Você perdeu ${sanLoss} de Sanidade máxima pelo Transcender.`
        : `${power.name} foi adicionado.`,
    });
  };
  
  // Handler para confirmar escolha de perícias de Intelecto (Expansão de Conhecimento)
  const handleIntellectSkillConfirm = async (skillIds: string[]) => {
    if (!pendingPower) return;
    await saveParanormalPower(pendingPower, { skills: skillIds });
    setIntellectSkillModalOpen(false);
  };
  
  // Handler para confirmar escolha de elemento de resistência (Resistir a Elemento)
  const handleElementResistanceConfirm = async (element: ParanormalElement) => {
    if (!pendingPower) return;
    await saveParanormalPower(pendingPower, { resistElement: element });
    setElementResistanceModalOpen(false);
  };
  
  // Handler para confirmar escolha de ritual (Aprender Ritual via poder paranormal)
  const handleRitualFromPowerConfirm = async (ritualId: string) => {
    if (!pendingPower || !character) return;
    
    // Salva o poder com a escolha do ritual
    await saveParanormalPower(pendingPower, { ritualId });
    
    // Adiciona o ritual à lista de rituais do personagem
    const updatedRituals = [...(character.rituals || []), ritualId];
    await supabase
      .from('characters')
      .update({ rituals: updatedRituals })
      .eq('id', character.id);
    
    setCharacter(prev => prev ? { ...prev, rituals: updatedRituals } : null);
    setNonOccultistRitualModalOpen(false);
  };

  // Importar marcos oficiais de Transcender derivados da tabela NEX_PROGRESSION
  // Marcos: [15, 30, 45, 60, 75, 90] - cada um oferece 1 oportunidade de Transcender
  const transcenderCount = useMemo(() => {
    if (!character) return 0;
    // Marcos oficiais de Transcender (derivados de getPowerChoiceMilestones)
    const milestones = [15, 30, 45, 60, 75, 90];
    // Conta quantos marcos o personagem já passou/está
    return milestones.filter(m => m <= character.nex).length;
  }, [character?.nex]);
  
  // Estado para armazenar contagem de slots de NEX usados (tabela character_power_choices)
  // Distingue entre: slots usados para Transcender (poderes paranormais) e slots usados para Poderes de Classe
  const [transcenderUsedFromDB, setTranscenderUsedFromDB] = useState(0);
  const [totalSlotsUsedFromDB, setTotalSlotsUsedFromDB] = useState(0);
  const [syncingPowerChoices, setSyncingPowerChoices] = useState(false);
  
  // Importar função de sincronização
  // Busca registros de escolhas de poder no banco e sincroniza retroativamente se necessário
  useEffect(() => {
    if (!character?.id || !user?.id) return;
    
    const fetchAndSyncPowerChoices = async () => {
      // Primeiro, buscar registros existentes
      const { data, error } = await supabase
        .from('character_power_choices')
        .select('id, choice_type, nex')
        .eq('character_id', character.id)
        .in('choice_type', ['transcender', 'transcender_legacy', 'class_power'])
        .eq('status', 'resolved');
      
      if (error) {
        console.error('Erro ao buscar power choices:', error);
        return;
      }
      
      // Calcular quantos marcos de NEX o personagem deveria ter
      const milestones = [15, 30, 45, 60, 75, 90].filter(m => m <= character.nex);
      const existingRecordsCount = data?.length || 0;
      
      // Se há menos registros do que marcos, precisamos sincronizar
      if (existingRecordsCount < milestones.length && !syncingPowerChoices) {
        setSyncingPowerChoices(true);
        console.log(`[PowerChoices] Sincronizando: ${existingRecordsCount} registros, ${milestones.length} marcos esperados`);
        
        try {
          // Importar dinamicamente para evitar ciclos
          const { syncAllPowerChoiceRecords } = await import('@/lib/transcender-system');
          
          const result = await syncAllPowerChoiceRecords(
            character.id,
            user.id,
            character.nex,
            (character.paranormal_powers || []).map(p => ({ id: p.id, name: p.name }))
          );
          
          console.log('[PowerChoices] Sincronização concluída:', result);
          
          if (result.created > 0) {
            // Re-buscar os dados após sincronização
            const { data: newData } = await supabase
              .from('character_power_choices')
              .select('id, choice_type')
              .eq('character_id', character.id)
              .in('choice_type', ['transcender', 'transcender_legacy', 'class_power'])
              .eq('status', 'resolved');
            
            if (newData) {
              setTotalSlotsUsedFromDB(newData.length);
              const transcenderOnly = newData.filter(c => 
                c.choice_type === 'transcender' || c.choice_type === 'transcender_legacy'
              ).length;
              setTranscenderUsedFromDB(transcenderOnly);
            }
          }
        } catch (syncError) {
          console.error('Erro na sincronização:', syncError);
        } finally {
          setSyncingPowerChoices(false);
        }
      } else if (data) {
        // Já tem registros suficientes, apenas atualizar estado
        setTotalSlotsUsedFromDB(data.length);
        const transcenderOnly = data.filter(c => 
          c.choice_type === 'transcender' || c.choice_type === 'transcender_legacy'
        ).length;
        setTranscenderUsedFromDB(transcenderOnly);
      }
    };
    
    fetchAndSyncPowerChoices();
  }, [character?.id, character?.nex, user?.id]);
  
  // Usa a contagem do banco para Transcender
  const transcenderUsed = transcenderUsedFromDB;
  
  // Calcula usos restantes de Transcender (slots de NEX - slots já usados para qualquer escolha)
  const transcenderRemaining = transcenderCount - totalSlotsUsedFromDB;
  
  // Verifica se o personagem pode usar Transcender (tem slots disponíveis E não usou todos)
  const hasTranscender = transcenderRemaining > 0;

  // === SISTEMA DE AUDITORIA AUTOMÁTICA ===
  // Prepara dados do personagem para auditoria
  const characterForAudit: CharacterForAudit | null = useMemo(() => {
    if (!character) return null;
    // Cast para unknown primeiro para acessar campos opcionais
    const charAny = character as unknown as Record<string, unknown>;
    return {
      id: character.id,
      name: character.name,
      class: character.class,
      origin: character.origin,
      nex: character.nex,
      vigor: character.vigor,
      presence: character.presence,
      agility: character.agility,
      intellect: character.intellect,
      hp_max: character.hp_max,
      pe_max: character.pe_max,
      san_max: character.san_max,
      defense: character.defense,
      paranormal_powers: character.paranormal_powers,
      skills: character.skills,
      abilities: character.abilities,
      class_track: character.class_track || undefined,
      rituals: character.rituals,
      creation_data: character.creation_data,
      // Campos opcionais que podem não existir no tipo base
      skill_training_choices: charAny.skill_training_choices as CharacterForAudit['skill_training_choices'] || undefined,
      training_grade_choices: charAny.training_grade_choices as CharacterForAudit['training_grade_choices'] || undefined,
    };
  }, [character]);

  // Hook de auditoria - com callback para atualizar UI após correções
  const {
    auditResult,
    isAuditing,
    isFixing,
    visibleIssues,
    counts: auditCounts,
    runAudit,
    applyAutoFixes,
    dismissIssue,
  } = useCharacterAudit(characterForAudit, user?.id || null, { 
    autoRun: true,
    autoFixCritical: false, // A revisão não sobrescreve a ficha ao abri-la.
    onFixComplete: refetchCharacter,
  });
  
  // === HOOK DE VALIDAÇÃO E CORREÇÃO AUTOMÁTICA ===
  const validationAutoFix = useValidationAutoFix({
    onFixComplete: refetchCharacter,
  });
  
  // Prepara o CharacterState para validação quando o modal abrir
  // Recarrega dados do banco antes de validar para garantir dados atualizados
  const handleOpenValidationModal = useCallback(async () => {
    if (!character) return;
    
    // Se o modal já está aberto, faz refetch e usa dados atualizados
    let charToValidate = character;
    if (validationModalOpen) {
      const refreshedChar = await refetchCharacter();
      if (refreshedChar) {
        charToValidate = refreshedChar;
      }
    }
    
    const state = characterToState({
      id: charToValidate.id,
      name: charToValidate.name,
      class: charToValidate.class,
      origin: charToValidate.origin,
      nex: charToValidate.nex,
      class_track: charToValidate.class_track,
      agility: charToValidate.agility,
      strength: charToValidate.strength,
      vigor: charToValidate.vigor,
      intellect: charToValidate.intellect,
      presence: charToValidate.presence,
      skills: charToValidate.skills,
      powers: charToValidate.abilities || [],
      general_powers: (charToValidate.general_powers || []).map(p => 
        typeof p === 'string' ? { id: p } : { id: p.id }
      ),
      paranormal_powers: (charToValidate.paranormal_powers || []).map(p => 
        typeof p === 'string' ? { id: p } : { id: p.id }
      ),
      rituals: ((charToValidate.rituals || []) as Array<string | { id: string }>).map(r => 
        typeof r === 'string' ? { id: r } : { id: r.id }
      ),
      hp_current: hpCurrent,
      pe_current: peCurrent,
      san_current: sanCurrent,
      conditions: (charToValidate.conditions || []).map(c => 
        typeof c === 'string' ? { id: c } : { id: c.id, name: c.name }
      ),
      inventory: charToValidate.inventory,
    });
    
    validationAutoFix.validate(state);
    setValidationModalOpen(true);
  }, [character, hpCurrent, peCurrent, sanCurrent, validationAutoFix, validationModalOpen, refetchCharacter]);
  
  // Handler para aplicar correções
  const handleApplyValidationFixes = useCallback(async (fixes: ApplicableFix[]) => {
    if (!character || !user) {
      return { success: false, appliedCount: 0, failedCount: 0, errors: ['Personagem não encontrado'] };
    }
    return validationAutoFix.applyFixes(character.id, user.id, fixes);
  }, [character, user, validationAutoFix]);
  
  // === HANDLERS PARA GRAU DE TREINAMENTO ===
  // Handler para abrir modal de Grau de Treinamento
  const handleOpenTrainingGradeModal = useCallback((nex: 35 | 70) => {
    setTrainingGradeNex(nex);
    setTrainingGradeModalOpen(true);
  }, []);

  // Handler para confirmar escolhas de Grau de Treinamento
  const handleTrainingGradeConfirm = useCallback(async (result: TrainingGradeResult) => {
    if (!character || !user) return;
    
    console.log('[TrainingGrade] Recebido resultado:', JSON.stringify(result));
    
    // Busca escolhas existentes
    const existingChoices = character.training_grade_choices || {};
    
    // Atualiza as escolhas para o NEX específico usando constantes centralizadas
    const nexKey = result.nex === 35 ? TRAINING_GRADE_KEYS.NEX_35 : TRAINING_GRADE_KEYS.NEX_70;
    const updatedChoices = {
      ...existingChoices,
      [nexKey]: result.choices,
    };
    
    // Aplica os upgrades às perícias
    const currentSkills = (character.skills || {}) as Record<string, number>;
    const updatedSkills = applyTrainingGradeUpgrades(currentSkills, result.choices);
    
    console.log('[TrainingGrade] Salvando:', { 
      nexKey, 
      choicesCount: result.choices.length,
      updatedChoices: JSON.stringify(updatedChoices), 
      updatedSkills: JSON.stringify(updatedSkills),
      characterId: character.id,
      userId: user.id,
    });
    
    // Salva no banco
    const { error } = await supabase
      .from('characters')
      .update({
        training_grade_choices: JSON.parse(JSON.stringify(updatedChoices)),
        skills: updatedSkills,
        updated_at: new Date().toISOString(),
      })
      .eq('id', character.id)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('[TrainingGrade] Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    
    console.log('[TrainingGrade] Salvo com sucesso!');
    toast({
      title: 'Grau de Treinamento configurado!',
      description: `${result.choices.length} perícias aprimoradas no NEX ${result.nex}%.`,
    });
    
    setTrainingGradeModalOpen(false);
    await refetchCharacter();
  }, [character, user, refetchCharacter, toast]);
  
  // Handler para confirmar correção de perícias faltantes (auditoria)
  const handleMissingSkillsConfirm = useCallback(async (newSkillIds: string[]) => {
    if (!character) return;
    
    // Cria novo objeto de skills com as novas perícias treinadas
    const updatedSkills = { ...(character.skills || {}) };
    newSkillIds.forEach(skillId => {
      updatedSkills[skillId] = 1; // Nível 1 = Treinado
    });
    
    // Salva no banco
    const { error } = await supabase
      .from('characters')
      .update({
        skills: updatedSkills,
      })
      .eq('id', character.id);
    
    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    
    toast({
      title: 'Perícias adicionadas!',
      description: `${newSkillIds.length} nova(s) perícia(s) treinada(s).`,
    });
    
    setMissingSkillsModalOpen(false);
    refetchCharacter();
  }, [character, refetchCharacter, toast]);

  // Handler para abrir modal de poderes paranormais com validação de limite
  const handleOpenParanormalPowerModal = useCallback(() => {
    if (!character) return;
    
    // Valida se pode adicionar mais poderes
    const validation = canAddParanormalPower(
      character.paranormal_powers?.length || 0,
      character.nex,
      character.origin,
      transcenderUsed
    );
    
    if (!validation.canAdd) {
      toast({
        title: 'Limite de poderes atingido',
        description: validation.reason,
        variant: 'destructive',
      });
      return;
    }
    
    setParanormalPowerModalOpen(true);
  }, [character, transcenderUsed, toast]);

  // Handler para edição do personagem
  const handleCharacterEdit = async (data: {
    name: string;
    player_name: string | null;
    age: number | null;
    gender: string | null;
    appearance: string | null;
    personality: string | null;
    background: string | null;
    notes: string | null;
    agility: number;
    strength: number;
    intellect: number;
    presence: number;
    vigor: number;
    skills: Record<string, number>;
    defense: number;
    photo_url: string | null;
  }) => {
    if (!character || !user) throw new Error('Entre novamente na sua conta para salvar a ficha.');

    const transcender = countTranscender(character.abilities as string[]);
    const newStats = calculateDerivedStats(
      character.class,
      data.vigor,
      data.presence,
      character.nex,
      character.origin,
      character.abilities as string[],
      transcender
    );

    // Registra alterações
    const changes: Array<{
      changeType: string;
      fieldName: string;
      oldValue: string | null;
      newValue: string | null;
      description?: string;
    }> = [];

    if (data.name !== character.name) {
      changes.push({ changeType: 'info', fieldName: 'name', oldValue: character.name, newValue: data.name });
    }
    if ((data.player_name || '') !== (character.player_name || '')) {
      changes.push({ changeType: 'info', fieldName: 'player_name', oldValue: character.player_name, newValue: data.player_name });
    }
    if ((data.background || '') !== (character.background || '')) {
      changes.push({ changeType: 'info', fieldName: 'background', oldValue: character.background, newValue: data.background });
    }
    if (data.photo_url !== (character.photo_url || null)) {
      changes.push({ changeType: 'photo', fieldName: 'photo_url', oldValue: 'Foto anterior', newValue: 'Nova foto' });
    }

    const { error } = await supabase
      .from('characters')
      .update({
        name: data.name,
        player_name: data.player_name,
        age: data.age,
        gender: data.gender,
        appearance: data.appearance,
        personality: data.personality,
        background: data.background,
        notes: data.notes,
        agility: data.agility,
        strength: data.strength,
        intellect: data.intellect,
        presence: data.presence,
        vigor: data.vigor,
        skills: data.skills,
        defense: data.defense,
        photo_url: data.photo_url,
        hp_max: newStats.hp,
        pe_max: newStats.pe,
        san_max: newStats.san,
        hp_current: Math.min(hpCurrent, newStats.hp),
        pe_current: Math.min(peCurrent, newStats.pe),
        san_current: Math.min(sanCurrent, newStats.san),
      })
      .eq('id', character.id)
      .select('id')
      .single();

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }

    if (changes.length > 0) {
      await logCharacterChanges(character.id, user.id, changes);
    }

    setCharacter(prev => prev ? {
      ...prev,
      name: data.name,
      player_name: data.player_name,
      background: data.background,
      notes: data.notes,
      agility: data.agility,
      strength: data.strength,
      intellect: data.intellect,
      presence: data.presence,
      vigor: data.vigor,
      skills: data.skills,
      defense: data.defense,
      photo_url: data.photo_url,
      hp_max: newStats.hp,
      pe_max: newStats.pe,
      san_max: newStats.san,
      age: data.age,
      gender: data.gender,
      appearance: data.appearance,
      personality: data.personality,
    } : null);

    setHpCurrent(Math.min(hpCurrent, newStats.hp));
    setPeCurrent(Math.min(peCurrent, newStats.pe));
    setSanCurrent(Math.min(sanCurrent, newStats.san));

    toast({
      title: 'Personagem atualizado!',
      description: 'Alterações salvas.',
    });
  };

  // NOTA: paranormalEffects já é extraído do bonusSummary no início do componente
  // Removida chamada duplicada de useParanormalEffects para otimização

  // Calcular proteção total de armaduras equipadas (DEVE vir antes de qualquer return condicional)
  const armorStats = useMemo(() => {
    if (!character) {
      return {
        totalRD: 0,
        armorDefenseBonus: 0,
        shieldDefenseBonus: 0,
        totalAgilityPenalty: 0,
        totalSpeedPenalty: 0,
        hasArmor: false,
        equippedArmors: [],
      };
    }
    
    // Armaduras (não escudos)
    const equippedArmors = character.inventory
      .filter(item => item.isEquipped && item.itemType === 'armor' && item.armorType !== 'escudo');
    
    // Escudo
    const equippedShield = character.inventory
      .find(item => item.isEquipped && item.itemType === 'armor' && item.armorType === 'escudo');
    
    const totalRD = equippedArmors.reduce((sum, armor) => sum + (armor.rd || 0), 0);
    // Bônus de defesa das armaduras (Proteção Leve +5, Proteção Pesada +10)
    const armorDefenseBonus = equippedArmors.reduce((sum, armor) => sum + (armor.defenseBonus || 0), 0);
    // Bônus de defesa do escudo (+2)
    const shieldDefenseBonus = equippedShield?.defenseBonus || 0;
    const totalAgilityPenalty = equippedArmors.reduce((sum, armor) => sum + (armor.agilityPenalty || 0), 0);
    const totalSpeedPenalty = equippedArmors.reduce((sum, armor) => sum + (armor.speedPenalty || 0), 0);
    
    return {
      totalRD,
      armorDefenseBonus,
      shieldDefenseBonus,
      totalAgilityPenalty,
      totalSpeedPenalty,
      hasArmor: equippedArmors.length > 0,
      equippedArmors: equippedArmors.map(a => ({ name: a.name, rd: a.rd || 0, defenseBonus: a.defenseBonus || 0 })),
    };
  }, [character?.inventory]);

  // Calcula status de carga do inventário para o header
  // Detecta automaticamente Inventário Otimizado (Técnico NEX 10%+)
  const inventoryLoadStatus = useMemo(() => {
    if (!character) return undefined;
    
    // Extrai nomes das habilidades (pode ser array de strings ou objetos)
    const abilityNames = Array.isArray(character.abilities) 
      ? character.abilities.map((a: unknown) => typeof a === 'string' ? a : (a as { name?: string })?.name || '') 
      : [];
    
    // Verifica se personagem possui Inventário Otimizado
    const hasInvOtimizado = hasInventarioOtimizado({
      classTrack: character.class_track,
      abilities: abilityNames,
      nex: character.nex,
    });
    
    // Calcula carga atual (com redução de espaços se aplicável)
    const inventory = character.inventory || [];
    const currentLoad = inventory.reduce((sum, item) => {
      const baseSlots = item.slots || 1;
      // Inventário Otimizado: -1 espaço por item (mínimo 1)
      const effectiveSlots = hasInvOtimizado ? Math.max(1, baseSlots - 1) : baseSlots;
      return sum + (effectiveSlots * (item.quantity || 1));
    }, 0);
    
    // Calcula capacidade máxima (FOR * 5 ou (FOR + INT) * 5 com Inventário Otimizado)
    const maxCapacity = calculateCarryCapacity(character.strength, {
      hasInventarioOtimizado: hasInvOtimizado,
      intellect: character.intellect,
    });
    
    return {
      currentLoad,
      maxCapacity,
      isOverloaded: currentLoad > maxCapacity,
      hasInventarioOtimizado: hasInvOtimizado,
      // Dados extras para tooltip
      intellect: hasInvOtimizado ? character.intellect : undefined,
    };
  }, [character?.inventory, character?.strength, character?.intellect, character?.class_track, character?.abilities, character?.nex]);

  // Bônus total de defesa combinando todas as fontes (defenseBonuses já está definido acima)
  // Inclui: poderes paranormais + bônus de origem/habilidades + bônus de armadura + bônus de escudo
  const totalDefenseBonus = bonusSummary.defense.total + armorStats.armorDefenseBonus + armorStats.shieldDefenseBonus;

  // OTIMIZAÇÃO: Memoiza arrays que eram recriados inline a cada render
  const memoizedDefenseBonusBreakdown = useMemo(() => [
    // Bônus de armadura
    ...(armorStats.armorDefenseBonus > 0 ? armorStats.equippedArmors.filter(a => a.defenseBonus > 0).map(armor => ({
      source: armor.name,
      type: 'origin' as const,
      bonus: armor.defenseBonus,
      active: true,
    })) : []),
    // Bônus de escudo
    ...(armorStats.shieldDefenseBonus > 0 ? [{
      source: 'Escudo',
      type: 'origin' as const,
      bonus: armorStats.shieldDefenseBonus,
      active: true,
    }] : []),
    // Inclui condições consolidadas pelo SUE, sem reaplicar suas penalidades.
    ...bonusSummary.defense.breakdown,
  ], [armorStats, bonusSummary.defense.breakdown]);

  // OTIMIZAÇÃO: Memoiza contagem de bônus ativos
  const activeBonusCount = useMemo(() => (
    (bonusSummary.defense.total > 0 ? 1 : 0) +
    (bonusSummary.resistances.fortitude.total > 0 ? 1 : 0) +
    (bonusSummary.resistances.reflexos.total > 0 ? 1 : 0) +
    (bonusSummary.resistances.vontade.total > 0 ? 1 : 0) +
    (bonusSummary.combat.attack.total > 0 ? 1 : 0) +
    (bonusSummary.combat.initiative.total > 0 ? 1 : 0) +
    (bonusSummary.combat.criticalMargin.total > 0 ? 1 : 0) +
    (bonusSummary.damageReduction.physical.total > 0 ? 1 : 0) +
    (bonusSummary.damageReduction.paranormal.total > 0 ? 1 : 0) +
    Object.keys(bonusSummary.skills).length +
    (bonusSummary.hpBonus > 0 ? 1 : 0) +
    (bonusSummary.peBonus > 0 ? 1 : 0) +
    bonusSummary.special.length
  ), [bonusSummary]);

  // OTIMIZAÇÃO: Memoiza lista de fontes de bônus ativas
  const activeBonusSources = useMemo(() => [
    ...(bonusSummary.defense.total > 0 ? [`Defesa +${bonusSummary.defense.total}`] : []),
    ...(bonusSummary.resistances.fortitude.total > 0 ? [`Fortitude +${bonusSummary.resistances.fortitude.total}`] : []),
    ...(bonusSummary.resistances.reflexos.total > 0 ? [`Reflexos +${bonusSummary.resistances.reflexos.total}`] : []),
    ...(bonusSummary.resistances.vontade.total > 0 ? [`Vontade +${bonusSummary.resistances.vontade.total}`] : []),
    ...(bonusSummary.combat.attack.total > 0 ? [`Ataque +${bonusSummary.combat.attack.total}`] : []),
    ...(bonusSummary.combat.initiative.total > 0 ? [`Iniciativa +${bonusSummary.combat.initiative.total}`] : []),
    ...(bonusSummary.hpBonus > 0 ? [`PV +${bonusSummary.hpBonus}`] : []),
    ...(bonusSummary.peBonus > 0 ? [`PE +${bonusSummary.peBonus}`] : []),
    ...Object.entries(bonusSummary.skills).map(([skill, data]) => `${skill} +${data.total}`),
    ...bonusSummary.special.map(s => s.source),
  ], [bonusSummary]);

  // Calcula limite de rituais para Ocultistas (ANTES do early return para evitar erro de hooks)
  const ritualLimits = useMemo(() => {
    if (!character || character.class !== 'Ocultista') return null;
    return getKnownRitualLimit(character);
  }, [character]);
  
  // Verifica se há rituais excedentes
  const hasExcessRituals = ritualLimits && character
    ? character.rituals.length > ritualLimits.count 
    : false;

  // Calcular origens das perícias para tooltips (ANTES do early return para evitar erro de hooks)
  const skillOrigins = useMemo(() => {
    if (!character) return {};
    return calculateSkillOrigins(
      character.skills,
      character.origin,
      character.class,
      character.skill_training_choices
    );
  }, [character?.skills, character?.origin, character?.class, character?.skill_training_choices]);

  // Identificar arma favorita para indicador Aniquilador (A Favorita, Técnica Secreta, Máquina de Matar) - ANTES do early return
  const favoriteWeapon = useMemo(() => {
    if (!character) return null;
    const favoriteItem = character.inventory.find(
      (item: any) => item.isEquipped && item.itemType === 'weapon' && item.favoriteAbilityId
    );
    if (favoriteItem) {
      return {
        id: favoriteItem.id || '',
        name: favoriteItem.name,
        damage: (favoriteItem as any).damage,
        category: (favoriteItem as any).category,
        effectiveCategory: (favoriteItem as any).effectiveCategory,
      };
    }
    return null;
  }, [character?.inventory]);

  // Theme colors para efeitos dinâmicos (ANTES do early return para evitar erro de hooks)
  const themeColors = useThemeColors();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo size="lg" animate glow />
          <p className="text-muted-foreground font-display tracking-wider text-sm">CARREGANDO DOSSIÊ...</p>
        </div>
      </div>
    );
  }

  if (readError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <p role="alert" className="text-muted-foreground">{readError}</p>
          <Button onClick={() => { setLoading(true); void refetchCharacter(); }}>Tentar carregar novamente</Button>
          <Link to="/dashboard" className="block text-primary hover:underline">Voltar para fichas</Link>
        </div>
      </div>
    );
  }

  if (!character || character.id !== id) return null;

  // Verificar sanidade baixa para efeito visual
  const sanPercentage = (sanCurrent / character.san_max) * 100;
  const isSanLow = sanPercentage < 30;
  
  // Verificar se precisa escolher afinidade elemental
  // Só aparece se: NEX >= 50 + sem afinidade + já usou Transcender após NEX 50
  const needsAffinitySelection = character.nex >= 50 && !character.elemental_affinity && hasTranscendedPost50;

  // Handler para salvar afinidade elemental
  const handleSelectAffinity = async (element: ParanormalElement) => {
    const { error } = await supabase
      .from('characters')
      .update({ 
        elemental_affinity: element,
        affinity_active: true 
      })
      .eq('id', character.id);

    if (error) {
      toast({
        title: 'Erro ao salvar afinidade',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setCharacter(prev => prev ? { 
      ...prev, 
      elemental_affinity: element,
      affinity_active: true 
    } : null);

    toast({
      title: 'Afinidade Elemental definida!',
      description: `Você agora tem afinidade com ${element}.`,
    });
  };

  // Preparar atributos
  const attributes = {
    agility: character.agility,
    strength: character.strength,
    intellect: character.intellect,
    presence: character.presence,
    vigor: character.vigor,
  };

  // Preparar armas para tabela de combate usando dados reais do item
  // Usa a função centralizada normalizeWeaponTypeForDisplay para consistência com mobile
  const equippedWeapons = character.inventory
    .filter(item => item.isEquipped && item.itemType === 'weapon')
    .map(item => ({
      id: item.id || crypto.randomUUID(),
      name: item.name,
      isFavoriteWeapon: isAniquiladorFavoriteWeapon(item),
      favoriteAbilityId: item.favoriteAbilityId,
      // Usa inferência centralizada (mesmo que o mobile) para consistência
      type: normalizeWeaponTypeForDisplay({
        weaponType: item.weaponType,
        ammoType: item.ammoType,
        range: item.range,
        properties: item.properties,
        damageType: item.damageType,
        name: item.name, // Para heurística por nome
      }),
      // Usa dados reais da arma se disponíveis
      damage: item.damage || '1d6',
      damageType: item.damageType,
      range: item.range,
      baseRange: 'baseRange' in item && typeof item.baseRange === 'string' ? item.baseRange : undefined,
      critical: item.critical ? `${item.critical}` : undefined,
      criticalMultiplier: item.criticalMultiplier 
        ? (typeof item.criticalMultiplier === 'number' 
            ? `x${item.criticalMultiplier}` 
            : item.criticalMultiplier)
        : undefined,
      special: item.special,
      appliedModifications: item.appliedModifications,
      modificationAttackBonus: item.attackBonus,
      modificationEffects: item.specialEffects,
      catalogId: item.catalogId, weaponType: item.weaponType, properties: item.properties,
      ammoType: item.ammoType,
    }));


  // Obter dados da origem
  const originData = ORIGINS.find(o => o.id === character.origin);


  return (
    <div className={cn("min-h-screen bg-background sheet-background relative overflow-hidden", isSanLow && "animate-flicker")}>
      {/* Atmospheric Effects - Condicional: desativado em mobile, preferência de movimento reduzido, ou baixo desempenho */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <AtmosphericEffects
          particleColor={themeColors.primary}
          particleQuantity={20}
          gridColor={`rgb(${themeColors.rgb})`}
          gridMaxOpacity={0.02}
          className="absolute inset-0"
        />
        {/* Mist - Dynamic */}
        <div 
          className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent"
          style={{ 
            backgroundImage: `linear-gradient(to top, ${themeColors.primary}08, transparent, transparent)` 
          }}
        />
        {/* Scan lines - Dynamic */}
        <div 
          className="absolute inset-0 opacity-[0.01]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${themeColors.primary}18 2px, ${themeColors.primary}18 4px)`,
          }}
        />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
      </div>

      {/* Banner de Offline - Fase 6 UX */}
      <OfflineBanner 
        isOffline={!isOnline} 
        onRetry={checkRealConnectivity}
        className="sticky top-0 z-20"
      />

      {/* Header fixo - responsivo para mobile */}
      <header className="border-b border-border bg-card/80 sticky top-0 z-10 backdrop-blur-md relative">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Lado esquerdo: Voltar + Nome */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Link to="/dashboard" className="flex-shrink-0">
                <Button variant="ghost" size="sm" className="text-muted-foreground h-8 px-2 sm:px-3">
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Voltar</span>
                </Button>
              </Link>
              <h1 className="font-display text-sm sm:text-xl tracking-wider truncate text-primary">
                {character.name}
              </h1>
            </div>
            
            {/* Ações em linha própria; tablet pode quebrar botões sem cortar o nome. */}
            <div className="hidden w-full min-w-0 flex-wrap items-center gap-2 sm:flex" aria-label="Ações da ficha">
              {/* Indicador de Status de Salvamento - Fase 6 UX */}
              <SaveStatusIndicator
                status={!isOnline ? 'offline' : saveStatus}
                lastSaved={lastSaved}
                showLabel={false}
                size="sm"
              />
              
              {/* Botão de Atalhos de Teclado - Fase 6 UX */}
              <KeyboardShortcutsHelp
                open={shortcutsHelpOpen}
                onOpenChange={setShortcutsHelpOpen}
              />
              
              <ThemeSelector />
              <DiceRollHistoryDrawer 
                rolls={rollHistory}
                onClear={handleClearHistory}
              />
              {ritualApplication.error && <p role="alert" className="w-full text-sm text-destructive">{ritualApplication.error}</p>}
              {resourceUpdate.error && <p role="alert" className="w-full text-sm text-destructive">{resourceUpdate.error}</p>}
              {activity.saveError && <p role="alert" className="w-full text-sm text-destructive">{activity.saveError}</p>}
              {activity.pendingRolls.length > 0 && <p role="status" className="w-full text-sm text-muted-foreground">{activity.pendingRolls.length} rolagem(ns) aguardando gravação. Abra o histórico salvo para recuperar.</p>}
              {ritualSyncError && <p role="alert" className="w-full text-sm text-destructive">{ritualSyncError} A gravação da ficha e a sincronização da campanha são verificações separadas.</p>}
              <CharacterActivityPanel characterId={character.id} characterName={character.name} />
            <CharacterHistoryPanel
                characterId={character.id} 
                characterName={character.name} 
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTemplateSaveModalOpen(true)}
                className="font-display"
              >
                <Package className="w-4 h-4 mr-2" />
                TEMPLATE
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditModalOpen(true)}
                className="font-display"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                EDITAR
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleOpenValidationModal}
                className="font-display"
                title="Validar e corrigir problemas do personagem"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                VALIDAR
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleDelete}
                aria-label="Excluir personagem"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Lado direito: Menu ActionSheet - Mobile */}
            <div className="flex sm:hidden items-center gap-1 flex-shrink-0">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={mobileActionsSheet.open}
                aria-label="Ações do personagem"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
              <MobileActionSheet
                open={mobileActionsSheet.isOpen}
                onOpenChange={mobileActionsSheet.setIsOpen}
                title="Ações do Personagem"
                description={character?.name}
                actions={[
                  {
                    id: 'edit',
                    label: 'Editar Personagem',
                    icon: Edit2,
                    onPress: () => setEditModalOpen(true),
                  },
                  {
                    id: 'save-template',
                    label: 'Salvar como Template',
                    icon: Package,
                    onPress: () => setTemplateSaveModalOpen(true),
                  },
                  {
                    id: 'dice-history',
                    label: 'Histórico de Dados',
                    icon: Dices,
                    onPress: () => {
                      const historyBtn = document.querySelector('[data-dice-history-trigger]') as HTMLButtonElement;
                      historyBtn?.click();
                    },
                  },
                  {
                    id: 'char-history',
                    label: 'Histórico de Alterações',
                    icon: History,
                    onPress: () => {
                      const charHistoryBtn = document.querySelector('[data-character-history-trigger]') as HTMLButtonElement;
                      charHistoryBtn?.click();
                    },
                  },
                  {
                    id: 'validate',
                    label: 'Validar Personagem',
                    icon: ShieldCheck,
                    onPress: handleOpenValidationModal,
                  },
                  {
                    id: 'delete',
                    label: 'Excluir Personagem',
                    icon: Trash2,
                    destructive: true,
                    onPress: handleDelete,
                  },
                ]}
              />
              <ThemeSelector />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 relative z-[1]">
        <CreationReviewNotice issues={character.creation_review} onReview={()=>setEditModalOpen(true)} />
        {/* Modo mobile: layout compacto */}
        {isMobile ? (
          <MobileCharacterSheet
            character={{
              creation_data: character.creation_data,
              id: character.id,
              name: character.name,
              class: character.class,
              class_track: character.class_track,
              origin: character.origin,
              nex: character.nex,
              patent: character.patent,
              photo_url: character.photo_url,
              hp_current: hpCurrent,
              hp_max: character.hp_max,
              pe_current: peCurrent,
              pe_max: character.pe_max,
              san_current: sanCurrent,
              san_max: character.san_max,
              defense: character.defense,
              movement: character.movement || 9,
              agility: character.agility,
              strength: character.strength,
              intellect: character.intellect,
              presence: character.presence,
              vigor: character.vigor,
              conditions: character.conditions,
              abilities: character.abilities,
              powers: character.powers,
              rituals: character.rituals,
              // Repassa os efeitos confirmados para combate e sincronização mobile.
              active_buffs: character.active_buffs,
              // Campos que estavam faltando:
              skills: character.skills,
              paranormal_powers: character.paranormal_powers,
              general_powers: character.general_powers,
              inventory: character.inventory,
              // Bônus condicionais ativos (persistidos)
              active_conditional_bonuses: character.active_conditional_bonuses,
              // Escolhas de Treinamento em Perícia
              skill_training_choices: character.skill_training_choices,
            }}
            onOpenDiceRoller={() => {
              setRollLabel('Teste Geral');
              setRollAttribute(character.agility);
              setRollSkillBonus(0);
              setDiceModalOpen(true);
            }}
            onOpenRest={() => setRestModalOpen(true)}
            onLevelUp={() => setNexModalOpen(true)}
            onEditStats={() => setEditModalOpen(true)}
            onToggleConditionalBonus={handleToggleConditionalBonus}
            onRefetch={refetchCharacter}
          />
        ) : (
          /* Desktop: Layout de 2 colunas estilo ficha de papel */
          <div className="sheet-grid">
            {/* === COLUNA ESQUERDA === */}
            <div className="space-y-4 min-w-0">
            {/* Banner de Auditoria (se houver problemas) */}
            {auditCounts.total > 0 && (
              <CharacterAuditBanner
                auditResult={auditResult}
                visibleIssues={visibleIssues}
                counts={auditCounts}
                isAuditing={isAuditing}
                isFixing={isFixing}
                onAutoFix={applyAutoFixes}
                onDismiss={dismissIssue}
                onRerunAudit={runAudit}
                onManualFix={(category, issueId) => {
                  // Abre o modal correspondente baseado na categoria do problema
                  if (category === 'transcender') {
                    setExcessPowersModalOpen(true);
                  } else if (category === 'rituals') {
                    setExcessRitualsModalOpen(true);
                  } else if (category === 'skill_training' && issueId) {
                    // Grau de Treinamento (NEX 35% ou 70%)
                    if (issueId.includes('training_grade_35')) {
                      handleOpenTrainingGradeModal(35);
                    } else if (issueId.includes('training_grade_70')) {
                      handleOpenTrainingGradeModal(70);
                    } 
                    // Perícias abaixo do esperado - abre modal específico de correção
                    else if (issueId.includes('low_trained_skills')) {
                      setMissingSkillsModalOpen(true);
                    }
                  }
                }}
                className="mb-4"
              />
            )}
            {/* Cabeçalho com avatar e stats principais */}
              <CharacterSheetHeader
                name={character.name}
                photoUrl={character.photo_url}
                characterClass={character.class}
                origin={originData?.name || character.origin}
                nex={character.nex}
                patent={character.patent}
                hpCurrent={hpCurrent}
                hpMax={character.hp_max}
                peCurrent={peCurrent}
                peMax={character.pe_max}
                sanCurrent={sanCurrent}
                sanMax={character.san_max}
                defense={character.defense}
                movement={(character.movement || 9) + (bonusSummary?.movementBonus || 0)}
                hpBonus={paranormalEffects.hpBonus}
                peBonus={paranormalEffects.peBonus}
                defenseBonus={totalDefenseBonus}
                defenseBonusBreakdown={memoizedDefenseBonusBreakdown}
                ritualAttackBonus={ritualCombatSummary.totalAttackBonus}
                ritualDamageBonus={ritualCombatSummary.totalDamageBonus}
                ritualWeaponEffects={ritualCombatSummary.weaponEffects}
                armorRD={armorStats.totalRD}
                armorPenalty={armorStats.totalAgilityPenalty}
                armorSpeedPenalty={armorStats.totalSpeedPenalty}
                equippedArmors={armorStats.equippedArmors}
                loadStatus={inventoryLoadStatus}
                activeBonusCount={activeBonusCount}
                activeBonusSources={activeBonusSources}
                bonusSummary={bonusSummary}
                elementalAffinity={character.elemental_affinity}
                onStatsChange={handleCombatStatsChange}
                onLevelUp={() => setNexModalOpen(true)}
                onToggleConditionalBonus={handleToggleConditionalBonus}
              />

              {/* Seletor de Afinidade Elemental (se NEX >= 50 e sem afinidade) */}
              {needsAffinitySelection && (
                <AffinitySelectorCard
                  nex={character.nex}
                  onSelectAffinity={handleSelectAffinity}
                />
              )}


              {/* Grid de Atributos */}
              <AttributeGridNew
                attributes={attributes}
                onRoll={handleAttributeRoll}
              />

              <BaseRulesNotice />
              {/* Gerenciador de condições */}
              <div className="sheet-panel p-4">
                <h3 className="font-display text-sm tracking-wider text-primary mb-3 uppercase">
                  Condições Ativas
                </h3>
                <ConditionManager
                  conditions={parsedConditions}
                  vigor={character.vigor}
                  prepareTurnApplication={prepareTurnApplication}
                  onConditionsChange={async (newConditions) => {
                    const serializedConditions = newConditions.map(serializeCondition);
                    // Só atualiza a tela depois do recibo do servidor; conflito preserva o estado anterior.
                    await confirmConditionReplacement(character.id,
                      activityJson(serializedConditions) as import('@/integrations/supabase/types').Json[],
                      activityJson(character.conditions || []) as import('@/integrations/supabase/types').Json[],
                      crypto.randomUUID());
                    setCharacter(prev => prev ? { ...prev, conditions: serializedConditions } : null);
                    void activity.refetch();
                  }}
                />
              </div>

              {/* Resumo de Todos os Bônus Ativos - após condições */}
              <BonusSummaryCard summary={bonusSummary} />

              {/* Painel de Bônus de Poderes de Classe */}
              {bonusSummary.classPowerBonuses && (
                <ClassPowerBonusesPanel bonuses={bonusSummary.classPowerBonuses} />
              )}

              {/* Painel de Bônus Condicionais (Inquebrável, Disparo Letal, etc.) */}
              {bonusSummary.conditionalBonuses.length > 0 && (
                <ConditionalBonusesPanel
                  conditionalBonuses={bonusSummary.conditionalBonuses}
                  onToggleBonus={handleToggleConditionalBonus}
                  excludedEffects={bonusSummary.unifiedEffects?.hardening?.excludedEffects || []}
                />
              )}

              {/* Controle de Rodada - Tracking centralizado */}
              <RoundControlPanel
                currentRound={roundTracking.currentRound}
                usedAbilitiesThisRound={roundTracking.usedAbilitiesThisRound}
                peSpentThisRound={roundTracking.peSpentThisRound}
                peSpentBreakdown={roundTracking.peSpentBreakdown}
                onAdvanceRound={roundTracking.advanceRound}
                onResetCombat={roundTracking.resetCombat}
              />

              {/* Painel de Poderes de Classe Ativáveis (Incansável, Segurar o Gatilho, etc.) */}
              <ClassPowersActivationPanel
                classPowers={character.powers as unknown[] || []}
                abilities={(Array.isArray(character.abilities) ? {} : character.abilities) as Record<string, unknown> || {}}
                nex={character.nex}
                peCurrent={peCurrent}
                onPEChange={handlePEChange}
                onTrackPESpent={roundTracking.trackPESpent}
                onToggleConditionalBonus={handleToggleConditionalBonus}
                activeConditionalBonuses={character.active_conditional_bonuses || []}
              />

              {/* Painel de Poderes Paranormais Ativáveis (Surto Temporal, Manipular Entropia, etc.) */}
              <ParanormalPowersActivationPanel
                paranormalPowers={character.paranormal_powers as SavedParanormalPower[] || []}
                nex={character.nex}
                elementalAffinity={character.elemental_affinity as ParanormalElement || null}
                affinityActive={character.affinity_active || false}
                hpCurrent={hpCurrent}
                peCurrent={peCurrent}
                onHPChange={async (newHP) => {
                  await handleCombatStatsChange({ hp: newHP, pe: peCurrent, san: sanCurrent });
                }}
                onPEChange={handlePEChange}
                onTrackPESpent={roundTracking.trackPESpent}
                onToggleConditionalBonus={handleToggleConditionalBonus}
                activeConditionalBonuses={character.active_conditional_bonuses || []}
              />

              {/* ====================================================== */}
              {/* PAINÉIS DE TRILHA - Combatente */}
              {/* ====================================================== */}
              
              {/* Comandante de Campo */}
              <LeadershipAbilitiesPanel
                characterId={character.id}
                onRefetch={refetchCharacter}
                classTrack={character.class_track}
                nex={character.nex}
                peCurrent={peCurrent}
                intellect={character.intellect}
                onPEChange={handlePEChange}
                usedAbilitiesThisRound={roundTracking.usedAbilitiesThisRound}
                onAbilityUsed={roundTracking.markAbilityUsed}
                onActivateEffect={activatedEffects.activateEffect}
                isEffectActive={activatedEffects.isEffectActive}
                onTrackPESpent={roundTracking.trackPESpent}
              />
              <EstrategistaGrantedActions characterId={character.id} onRefetch={refetchCharacter} />

              {/* Aniquilador */}
              <AniquiladorPanel
                classTrack={character.class_track}
                nex={character.nex}
                peCurrent={peCurrent}
                onPEChange={handlePEChange}
                onActivateEffect={activatedEffects.activateEffect}
                isEffectActive={activatedEffects.isEffectActive}
                versatilityTrack={character.versatility_track}
              />

              {/* Guerreiro */}
              <GuerreiroAbilitiesPanel
                classTrack={character.class_track}
                nex={character.nex}
                peCurrent={peCurrent}
                onPEChange={handlePEChange}
                onActivateEffect={activatedEffects.activateEffect}
                isEffectActive={activatedEffects.isEffectActive}
                onTrackPESpent={roundTracking.trackPESpent}
              />

              {/* Operações Especiais */}
              <OperacoesEspeciaisPanel
                classTrack={character.class_track}
                nex={character.nex}
                peCurrent={peCurrent}
                onPEChange={handlePEChange}
                usedAbilitiesThisRound={roundTracking.usedAbilitiesThisRound}
                onAbilityUsed={roundTracking.markAbilityUsed}
                onActivateEffect={activatedEffects.activateEffect}
                isEffectActive={activatedEffects.isEffectActive}
                onTrackPESpent={roundTracking.trackPESpent}
                versatilityTrack={character.versatility_track}
              />

              {/* Tropa de Choque */}
              <TropaDeChoquePanel
                classTrack={character.class_track}
                nex={character.nex}
                peCurrent={peCurrent}
                vigor={character.vigor}
                hpCurrent={hpCurrent}
                hpMax={character.hp_max}
                onPEChange={handlePEChange}
                onActivateEffect={activatedEffects.activateEffect}
                isEffectActive={activatedEffects.isEffectActive}
                onTrackPESpent={roundTracking.trackPESpent}
                versatilityTrack={character.versatility_track}
              />

              {/* ====================================================== */}
              {/* PAINÉIS DE TRILHA - Especialista */}
              {/* ====================================================== */}

              {/* Atirador de Elite */}
              <AtiradorDeElitePanel
                classTrack={character.class_track}
                nex={character.nex}
                peCurrent={peCurrent}
                intellect={character.intellect}
                onPEChange={handlePEChange}
                onActivateEffect={activatedEffects.activateEffect}
                isEffectActive={activatedEffects.isEffectActive}
                onTrackPESpent={roundTracking.trackPESpent}
                versatilityTrack={character.versatility_track}
              />

              {/* Infiltrador */}
              <InfiltradorPanel
                classTrack={character.class_track}
                nex={character.nex}
                peCurrent={peCurrent}
                agility={character.agility}
                onPEChange={handlePEDelta}
                usedAbilitiesThisRound={roundTracking.usedAbilitiesThisRound}
                onAbilityUsed={roundTracking.markAbilityUsed}
                onActivateEffect={activatedEffects.activateEffect}
                isEffectActive={activatedEffects.isEffectActive}
                onTrackPESpent={roundTracking.trackPESpent}
                versatilityTrack={character.versatility_track}
              />

              {/* Médico de Campo */}
              <MedicoDeCampoPanel
                classTrack={character.class_track}
                nex={character.nex}
                peCurrent={peCurrent}
                onPEChange={handlePEChange}
                onActivateEffect={activatedEffects.activateEffect}
                isEffectActive={activatedEffects.isEffectActive}
                onTrackPESpent={roundTracking.trackPESpent}
                pvCurrent={hpCurrent}
                pvMax={character.hp_max}
                onHPChange={(newHP) => handleCombatStatsChange({ 
                  hp: newHP, 
                  pe: peCurrent, 
                  san: sanCurrent 
                })}
                computedEffects={unifiedEffects?.computed}
                versatilityTrack={character.versatility_track}
                // Props para Equipe de Trauma
                characterId={character.id}
                characterName={character.name}
                characterConditions={character.conditions.map(c => {
                  const parsed = parseCondition(c);
                  // Converte para o formato esperado pelo EquipeTraumaModal
                  return {
                    id: parsed.id,
                    character_id: character.id,
                    user_id: user?.id ?? '',
                    condition_id: parsed.id,
                    condition_name: parsed.name,
                    condition_type: 'condition' as const,
                    description: null,
                    mechanical_effect: null,
                    duration_type: parsed.turnsRemaining !== null ? 'rounds' as const : 'permanent' as const,
                    duration_remaining: parsed.turnsRemaining,
                    duration_total: null,
                    applied_at_round: null,
                    applied_at_turn: null,
                    decrements_at: 'end_of_turn' as const,
                    icon: null,
                    color: null,
                    source_name: null,
                    source_type: null,
                    stacks: 1,
                    max_stacks: 1,
                    can_be_removed: true,
                    campaign_id: null,
                    session_id: null,
                    created_at: parsed.addedAt instanceof Date ? parsed.addedAt.toISOString() : String(parsed.addedAt),
                    updated_at: new Date().toISOString(),
                  };
                })}
              />

              {/* Negociador */}
              <NegociadorPanel
                classTrack={character.class_track}
                nex={character.nex}
                peCurrent={peCurrent}
                onPEChange={handlePEChange}
                onActivateEffect={activatedEffects.activateEffect}
                isEffectActive={activatedEffects.isEffectActive}
                onTrackPESpent={roundTracking.trackPESpent}
                versatilityTrack={character.versatility_track}
              />

              {/* Técnico */}
              <TecnicoPanel
                classTrack={character.class_track}
                nex={character.nex}
                peCurrent={peCurrent}
                onPEChange={handlePEChange}
                attributes={{
                  strength: character.strength,
                  intellect: character.intellect
                }}
                inventory={character.inventory as any[]}
                onAddTemporaryItem={async (newItem) => {
                  // Adiciona item temporário ao inventário e persiste
                  const currentInventory = (character.inventory || []) as InventoryItemPersisted[];
                  const itemToPersist: InventoryItemPersisted = {
                    id: newItem.id,
                    name: newItem.name,
                    category: newItem.category,
                    slots: newItem.slots,
                    quantity: newItem.quantity,
                    itemType: 'misc',
                    description: newItem.description,
                    effect: newItem.effect,
                    uses: newItem.uses,
                    maxUses: newItem.maxUses,
                    consumable: newItem.consumable,
                    isTemporary: newItem.isTemporary,
                    temporarySource: newItem.temporarySource,
                  };
                  const updatedInventory = [...currentInventory, itemToPersist];
                  
                  const { error } = await supabase
                    .from('characters')
                    .update({ inventory: JSON.parse(JSON.stringify(updatedInventory)) })
                    .eq('id', character.id);

                  if (!error) {
                    setCharacter(prev => prev ? {
                      ...prev,
                      inventory: updatedInventory,
                    } : null);
                  }
                }}
                onActivateEffect={activatedEffects.activateEffect}
                isEffectActive={activatedEffects.isEffectActive}
                onTrackPESpent={roundTracking.trackPESpent}
                versatilityTrack={character.versatility_track}
              />

              {/* ====================================================== */}
              {/* PAINÉIS DE TRILHA - Ocultista */}
              {/* ====================================================== */}

              {/* Conduíte */}
              <ConduitePanel
                classTrack={character.class_track}
                nex={character.nex}
                peCurrent={peCurrent}
                onPEChange={handlePEChange}
                onActivateEffect={activatedEffects.activateEffect}
                isEffectActive={activatedEffects.isEffectActive}
                onTrackPESpent={roundTracking.trackPESpent}
                versatilityTrack={character.versatility_track}
              />

              {/* Flagelador */}
              <FlageladorPanel
                classTrack={character.class_track}
                nex={character.nex}
                peCurrent={peCurrent}
                onPEChange={handlePEChange}
                onActivateEffect={activatedEffects.activateEffect}
                isEffectActive={activatedEffects.isEffectActive}
                onTrackPESpent={roundTracking.trackPESpent}
                versatilityTrack={character.versatility_track}
              />

              {/* Graduado */}
              <GraduadoPanel
                classTrack={character.class_track}
                nex={character.nex}
                intellect={character.intellect}
                versatilityTrack={character.versatility_track}
              />

              {/* Intuitivo */}
              <IntuitivoPanel
                classTrack={character.class_track}
                nex={character.nex}
                presence={character.presence}
                versatilityTrack={character.versatility_track}
              />

              {/* Lâmina Paranormal */}
              <LaminaParanormalPanel
                classTrack={character.class_track}
                nex={character.nex}
                peCurrent={peCurrent}
                onPEChange={handlePEChange}
                onActivateEffect={activatedEffects.activateEffect}
                isEffectActive={activatedEffects.isEffectActive}
                onTrackPESpent={roundTracking.trackPESpent}
                versatilityTrack={character.versatility_track}
              />

              {/* Widget de Efeitos Passivos da Trilha */}
              <TrackPassiveEffectsWidget
                classTrack={character.class_track}
                nex={character.nex}
                attributes={{
                  agility: character.agility,
                  strength: character.strength,
                  intellect: character.intellect,
                  presence: character.presence,
                  vigor: character.vigor,
                }}
                activatedEffects={activatedEffects.activatedEffectIds}
              />
              
              {/* Habilidade de Versatilidade (NEX 50%) */}
              {character.versatility_track && (
                <VersatilityAbilityCard
                  versatilityTrack={character.versatility_track}
                  classId={character.class}
                />
              )}

              {/* Rituais e Histórico (acordeão com abas) */}
              {character.rituals && character.rituals.length > 0 && (
                <SheetAccordionSection
                  title="Rituais"
                  icon={Skull}
                  count={character.rituals.length}
                  defaultOpen={false}
                  variant="paranormal"
                >
                  <Tabs defaultValue="rituais" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 mb-3 bg-paranormal/10">
                      <TabsTrigger 
                        value="rituais" 
                        className="text-xs data-[state=active]:bg-paranormal data-[state=active]:text-paranormal-foreground"
                      >
                        <Skull className="w-3.5 h-3.5 mr-1.5" />
                        Rituais ({character.rituals.length})
                      </TabsTrigger>
                      <TabsTrigger 
                        value="historico"
                        className="text-xs data-[state=active]:bg-paranormal data-[state=active]:text-paranormal-foreground"
                      >
                        <History className="w-3.5 h-3.5 mr-1.5" />
                        Histórico ({castHistory.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="rituais" className="mt-0">
                      {/* Alerta de rituais excedentes */}
                      {ritualLimits && (
                        <div className="flex items-center justify-between gap-2 mb-3">
                          {hasExcessRituals ? (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30 flex-1">
                              <span className="text-destructive font-medium text-xs">
                                ⚠️ {character.rituals.length}/{ritualLimits.count} rituais
                              </span>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                className="h-7 text-xs ml-auto"
                                onClick={() => setExcessRitualsModalOpen(true)}
                              >
                                Remover
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {character.rituals.length}/{ritualLimits.count} rituais
                              {ritualLimits.extraCount > 0 && ` · ${ritualLimits.extraCount} extras com fonte registrada`}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {character.rituals.map((ritualId, i) => {
                          const ritual = ALL_RITUALS.find(r => r.id === ritualId);
                          if (!ritual) return null;
                          return (
                            <RitualCard
                              key={i}
                              ritual={ritual}
                              isNonOccultist={character.class !== 'Ocultista'}
                              peCurrent={peCurrent}
                              onCast={handleOpenCastModal}
                            />
                          );
                        })}
                      </div>
                    </TabsContent>

                    <TabsContent value="historico" className="mt-0">
                      {castHistory.length > 0 ? (
                        <RitualCastHistory
                          history={castHistory}
                          onClear={handleClearCastHistory}
                          characterName={character.name}
                        />
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Nenhuma conjuração registrada</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </SheetAccordionSection>
              )}

              {/* Inventário (acordeão) - após rituais */}
              <SheetAccordionSection
                title="Inventário"
                icon={Package}
                count={character.inventory.length}
                defaultOpen={false}
              >
                <DataErrorBoundary fallbackMessage="Erro ao carregar inventário">
                  <AccessoryApprovalPanel state={bonusSummary.accessories} />
                  <ExplosivesPanel key={`explosives-${character.id}`} characterId={character.id} inventory={character.inventory} conditions={activityJson(character.conditions || [])} onRefetch={refetchCharacter} />
                  <ItemSituationalActionsPanel key={character.id} characterId={character.id} inventory={character.inventory}
                    agility={character.agility} powers={character.powers} abilities={character.abilities} skills={character.skills} conditions={activityJson(character.conditions || [])}
                    conditionIds={activeConditionsForSUE} summary={bonusSummary} onRefetch={refetchCharacter} />
                  <InventoryPanel
                    inventory={character.inventory.map((item) => ({
                      ...preserveInventoryModifications(item),
                      // Usa ID persistido ou gera novo UUID se não existir
                      id: item.id || crypto.randomUUID(),
                      name: item.name,
                      category: (item.category as InventoryItem['category']) || '0',
                      slots: item.slots,
                      quantity: item.quantity || 1,
                      itemType: (item.itemType as any) || 'misc',
                      isEquipped: item.isEquipped || false,
                      equipSlot: item.equipSlot as any,
                      description: item.description,
                      // Campos de armas
                      damage: item.damage,
                      damageType: item.damageType,
                      critical: item.critical,
                      criticalMultiplier: item.criticalMultiplier,
                      range: item.range,
                      special: item.special,
                      ammoType: item.ammoType,
                      weaponType: item.weaponType,
                      // Campos de armaduras
                      rd: item.rd,
                      defenseBonus: item.defenseBonus,
                      agilityPenalty: item.agilityPenalty,
                      speedPenalty: item.speedPenalty,
                      armorType: item.armorType,
                      // Campos de consumíveis
                      effect: item.effect,
                      uses: item.uses,
                      maxUses: item.maxUses,
                      consumable: item.consumable,
                      // Campos de redução de categoria
                      favoriteAbilityId: item.favoriteAbilityId,
                      effectiveCategory: item.effectiveCategory as any,
                    }))}
                    strength={character.strength}
                    patent={character.patent}
                    characterData={{
                      origin: character.origin,
                      classId: character.class,
                      classTrack: character.class_track || undefined,
                      nex: character.nex,
                      abilities: character.abilities,
                      powers: savedClassPowerNames(character.powers),
                      generalPowers: character.general_powers,
                      intellect: character.intellect,
                    }}
                    sueCategoryReductions={bonusSummary?.categoryReductions}
                    onInventoryChange={async (newInventory) => {
                      // Persiste TODOS os campos importantes do item
                      const updatedInventory: InventoryItemPersisted[] = newInventory.map(item => ({
                        ...preserveInventoryModifications(item),
                        id: item.id,
                        name: item.name,
                        category: item.category,
                        slots: item.slots,
                        quantity: item.quantity,
                        itemType: item.itemType,
                        isEquipped: item.isEquipped,
                        equipSlot: item.equipSlot,
                        description: (item as any).description,
                        // Campos de armas
                        damage: (item as any).damage,
                        damageType: (item as any).damageType,
                        critical: (item as any).critical,
                        criticalMultiplier: (item as any).criticalMultiplier,
                        range: (item as any).range,
                        special: (item as any).special,
                        ammoType: (item as any).ammoType,
                        weaponType: (item as any).weaponType,
                        // Campos de armaduras
                        rd: (item as any).rd,
                        defenseBonus: (item as any).defenseBonus,
                        agilityPenalty: (item as any).agilityPenalty,
                        speedPenalty: (item as any).speedPenalty,
                        armorType: (item as any).armorType,
                        // Campos de consumíveis
                        effect: (item as any).effect,
                        uses: (item as any).uses,
                        maxUses: (item as any).maxUses,
                        consumable: (item as any).consumable,
                        // Campos de redução de categoria
                        favoriteAbilityId: (item as any).favoriteAbilityId,
                        effectiveCategory: (item as any).effectiveCategory,
                        // Campos de modificações de armas
                        baseCategory: (item as any).baseCategory,
                        baseDamage: (item as any).baseDamage,
                        baseCritical: (item as any).baseCritical,
                        appliedModifications: (item as any).appliedModifications,
                        // Campos de itens temporários
                        isTemporary: (item as any).isTemporary,
                        temporarySource: (item as any).temporarySource,
                      }));
                      
                      const { error } = await supabase
                        .from('characters')
                        .update({ inventory: JSON.parse(JSON.stringify(updatedInventory)) })
                        .eq('id', character.id);

                      if (error) throw new Error('Não foi possível salvar o inventário. Tente novamente.');
                      setCharacter(prev => prev ? { ...prev, inventory: updatedInventory } : null);
                    }}
                  />
                </DataErrorBoundary>
              </SheetAccordionSection>

              {/* Dados Pessoais (acordeão) - após rituais */}
              <PersonalDataAccordion
                data={{
                  name: character.name,
                  playerName: character.player_name,
                  characterClass: character.class,
                  origin: originData?.name || character.origin,
                  age: character.age,
                  gender: character.gender,
                  appearance: character.appearance,
                  personality: character.personality,
                }}
              />

              {/* História e Biografia (acordeão) */}
              <SheetAccordionSection
                title="Biografia"
                icon={BookOpen}
                defaultOpen={false}
              >
                {character.background ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {character.background}
                    </p>
                    {character.notes && (
                      <div className="pt-4 border-t border-border/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                          Notas
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {character.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma história registrada. Clique em "Editar" para adicionar.
                  </p>
                )}
              </SheetAccordionSection>

              {/* Histórico de Rolagens Compacto */}
              <div className="sheet-panel p-4">
                <h3 className="font-display text-sm tracking-wider text-primary mb-3 uppercase">
                  Últimas Rolagens
                </h3>
                <DiceRollHistoryCompact 
                  rolls={rollHistory}
                  maxRolls={5}
                />
              </div>
            </div>

            {/* === COLUNA DIREITA === */}
            <div className="space-y-4 min-w-0">
              {/* Indicador de Passivas do Aniquilador (A Favorita, Técnica Secreta, Máquina de Matar) */}
              <AniquiladorPassivesIndicator
                classTrack={character.class_track}
                nex={character.nex}
                favoriteWeapon={favoriteWeapon}
                className="mb-3"
                defaultExpanded={true}
              />

              {/* Barra de bônus avançados ativos (Assassinar, Potência Máxima, Atirar para Matar) */}
              <ActiveAdvancedBonusesBar
                activeBonuses={bonusSummary.conditionalBonuses.map(b => ({
                  id: b.id,
                  name: b.name,
                  effect: b.effects[0] || '',
                  active: b.active,
                }))}
                className="mb-2"
              />

              {/* Barra de bônus de trilha em combate + Botão de Iniciativa */}
              <TrackCombatBonusesBar
                combat={bonusSummary.combat}
                damageReduction={bonusSummary.damageReduction}
                effectResistances={bonusSummary.effectResistances}
                agility={character.agility}
                attributes={attributes}
                activeConditions={activeConditionsForSUE}
                skillBonuses={Object.fromEntries(Object.entries(character.skills).map(([skill, grade]) => [skill, getSkillBonus(grade)]))}
                characterClass={character.class}
                classTrack={character.class_track}
                nex={character.nex}
                versatilityTrack={character.versatility_track}
                onInitiativeRoll={handleRollComplete}
                className="mb-2"
              />

              {/* Tabela de Combate */}
              <CombatWeaponsTable
                ammunition={character.inventory.filter(item => item.itemType === 'consumable') as any}
                activeConditions={activeConditionsForSUE}
                weapons={equippedWeapons}
                attributes={attributes}
                skills={character.skills}
                currentPE={peCurrent}
                maxPE={character.pe_max}
                onPEChange={handlePEChange}
                temporaryPE={temporaryResources.pe}
                confirmationUnavailable={peBudget.isLoading ? "Carregando o orçamento de PE do servidor…" : peBudget.error || !peBudget.data ? "Não foi possível conferir o turno. Recarregue a ficha antes de atacar." : undefined}
                onConfirmAttack={async request => {
                  await confirmCombatAttack(character.id, request, peBudget.data?.key ?? null);
                  try { await refetchCharacter(); await peBudget.refetch(); await temporaryResources.refetch(); }
                  catch { toast({ title: 'Ataque confirmado', description: 'Recarregue para atualizar a ficha.' }); }
                  return true;
                }}
                classTrack={character.class_track || undefined}
                characterClass={character.class}
                abilities={character.abilities || []}
                paranormalPowers={character.paranormal_powers?.map(p => ({
                  id: p.id,
                  name: p.name,
                  element: p.element,
                })) || []}
                hasAffinity={character.affinity_active || false}
                affinityElement={character.elemental_affinity}
                sustainedRituals={sustainedRituals}
                nex={character.nex}
                classPowerBonuses={{
                  attackBonus: bonusSummary.combat.attack.total,
                  damageBonus: bonusSummary.combat.damage.total,
                  criticalMarginBonus: bonusSummary.combat.criticalMargin.total,
                  extraDamageDice: bonusSummary.combat.damage.extraDice,
                }}
                unifiedEffects={unifiedEffects.computed}
                excludedEffects={unifiedEffects.hardening?.excludedEffects || []}
                activeConditionalBonuses={character.active_conditional_bonuses || []}
                activatedTrackEffects={activatedEffects.activatedEffectIds}
                onRollComplete={handleRollComplete}
                weaponBuffs={weaponBuffs}
                onRemoveWeaponBuff={removeWeaponBuff}
                onClearAllWeaponBuffs={clearWeaponBuffs}
                onAdvanceWeaponBuffTurn={advanceWeaponBuffTurn}
                onSetWeaponBuffTurns={setWeaponBuffTurns}
                hadAutoCorrections={weaponBuffsHadCorrections}
                onDismissCorrectionsNotice={clearWeaponBuffsCorrectionsFlag}
              />

              {/* Perícias por Atributo (acordeão colapsado) */}
              <SheetAccordionSection
                title="Perícias"
                icon={GraduationCap}
                count={Object.values(character.skills).filter(v => v > 0).length}
                defaultOpen={false}
              >
                <SkillsByAttribute
                  skills={character.skills}
                  attributes={attributes}
                  onRoll={handleSkillRoll}
                  skillBonuses={bonusSummary.skills}
                  skillOrigins={skillOrigins}
                  globalDiceBonus={globalDiceBonus}
                />
              </SheetAccordionSection>

              {/* Habilidades e Poderes (acordeão) */}
              <SheetAccordionSection
                title="Habilidades & Poderes"
                icon={Sparkles}
                count={(character.abilities?.length || 0) + (character.powers?.length || 0)}
                defaultOpen={true}
                variant="paranormal"
              >
                <div className="space-y-3">
                  {/* Habilidades de Classe */}
                  {character.abilities && character.abilities.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Habilidades de Classe
                      </p>
                      {character.abilities.map((abilityName, i) => {
                        // Busca a habilidade na lista de habilidades da classe para obter descrição
                        const abilityData = ALL_CLASS_ABILITIES.find(
                          a => a.name === abilityName && a.classId === character.class
                        );
                        const isAbilityActive = (character.active_conditional_bonuses || []).includes(abilityData?.id || '');
                        
                        // Verifica se há sub-escolha para este poder (Especialista em Arma, Perito, etc.)
                        const powerSubchoice = abilityData?.id ? character.class_power_choices?.[abilityData.id] : undefined;
                        const subchoiceText = powerSubchoice?.chosenValues?.join(', ');
                        
                        // Verifica se é Especialista em Arma para mostrar indicador especial
                        const isEspecialistaArma = abilityData?.id === 'especialista-arma' || 
                          powerSubchoice?.powerId === 'especialista-arma';
                        
                        // Verifica se é Perito para mostrar indicador especial
                        const isPerito = abilityData?.id === 'perito' || 
                          powerSubchoice?.powerId === 'perito';
                        
                        // Determina se deve ocultar o texto padrão de sub-escolha
                        const hasCustomIndicator = isEspecialistaArma || isPerito;
                        
                        return (
                          <div key={i} className="space-y-2">
                            <SheetAccordionItem
                              title={abilityName}
                              description={
                                subchoiceText && !hasCustomIndicator
                                  ? `${abilityData?.description || ''}\n\n📌 Escolha: ${subchoiceText}`
                                  : abilityData?.description
                              }
                              badge={
                                hasCustomIndicator 
                                  ? undefined // Usa indicador especial abaixo
                                  : subchoiceText ? subchoiceText : "Classe"
                              }
                              badgeVariant={subchoiceText ? "secondary" : "default"}
                              isActive={isAbilityActive}
                              onClick={() => {
                                if (abilityData) {
                                  setSelectedAbility(abilityData);
                                  setAbilityDetailOpen(true);
                                }
                              }}
                            />
                            
                            {/* Indicador especial de Especialista em Arma */}
                            {isEspecialistaArma && powerSubchoice?.chosenValues && powerSubchoice.chosenValues.length > 0 && (
                              <EspecialistaArmaIndicator
                                chosenGroups={powerSubchoice.chosenValues}
                                equippedWeaponId={equippedWeaponInfo.id}
                                equippedWeaponName={equippedWeaponInfo.name}
                                compact={false}
                                className="ml-2"
                              />
                            )}
                            
                            {/* Indicador especial de Perito */}
                            {isPerito && powerSubchoice?.chosenValues && powerSubchoice.chosenValues.length > 0 && (
                              <PeritoIndicator
                                chosenSkills={powerSubchoice.chosenValues}
                                nex={character.nex}
                                compact={false}
                                className="ml-2"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Trilha de Classe */}
                  {character.class_track && (() => {
                    const track = getTrackById(character.class_track);
                    if (!track) return null;
                    const unlockedAbilities = track.abilities.filter(a => a.minNex <= character.nex);
                    return (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          Trilha: {track.name}
                        </p>
                        {unlockedAbilities.map((ability) => {
                          const isTrackAbilityActive = (character.active_conditional_bonuses || []).includes(ability.id);
                          return (
                            <SheetAccordionItem
                              key={ability.id}
                              title={ability.name}
                              description={ability.description}
                              badge={`NEX ${ability.minNex}%`}
                              badgeVariant="secondary"
                              isActive={isTrackAbilityActive}
                              onClick={() => {
                                setSelectedAbility({
                                  ...ability,
                                  classId: character.class_track || '',
                                });
                                setAbilityDetailOpen(true);
                              }}
                            />
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Poderes de Origem */}
                  {character.powers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Poderes de Origem
                      </p>
                      {character.powers.map((power, i) => (
                        <SheetAccordionItem
                          key={i}
                          title={power.name}
                          description={power.description}
                          badge="Origem"
                          badgeVariant="paranormal"
                        />
                      ))}
                    </div>
                  )}

                  {/* Poderes Paranormais (usando o novo painel) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Poderes Paranormais
                      </p>
                      {hasTranscender && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-paranormal hover:text-paranormal"
                          onClick={handleOpenParanormalPowerModal}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Transcender ({transcenderRemaining})
                        </Button>
                      )}
                    </div>
                    
                    {enrichedParanormalPowers.length > 0 ? (
                      <ParanormalPowersPanel
                        powers={enrichedParanormalPowers}
                        elementalAffinity={character.elemental_affinity as ParanormalElement | null}
                        affinityActive={character.affinity_active}
                        nex={character.nex}
                        transcenderTotal={transcenderCount}
                        transcenderUsed={transcenderUsedFromDB}
                        totalSlotsUsed={totalSlotsUsedFromDB}
                        originId={character.origin}
                        onRemovePowers={async (powerIds) => {
                          // Remove os poderes selecionados
                          const updatedPowers = character.paranormal_powers?.filter(
                            p => !powerIds.includes(p.id)
                          ) || [];
                          
                          // Atualiza no banco
                          await supabase
                            .from('characters')
                            .update({ paranormal_powers: updatedPowers })
                            .eq('id', character.id);
                          
                          // Atualiza estado local
                          await refetchCharacter();
                        }}
                      />
                    ) : hasTranscender ? (
                      <div className="text-center py-4 text-muted-foreground text-sm border border-dashed border-muted rounded-lg">
                        <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        <p>Nenhum poder paranormal.</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-paranormal"
                          onClick={handleOpenParanormalPowerModal}
                        >
                          Escolher Poder ({transcenderRemaining})
                        </Button>
                      </div>
                    ) : transcenderCount > 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-sm border border-dashed border-muted rounded-lg">
                        <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">Todos os usos de Transcender consumidos.</p>
                        <p className="text-xs mt-1 opacity-70">{transcenderUsed}/{transcenderCount} poderes adquiridos</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Requer habilidade Transcender
                      </p>
                    )}
                  </div>
                  
                  {/* Histórico de Transcender */}
                  {transcenderUsed > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <TranscenderHistoryPanel
                        characterId={character.id}
                        currentNex={character.nex}
                        onRevert={async (revertedPowerId) => {
                          // Remover o poder paranormal revertido da lista local
                          if (character.paranormal_powers) {
                            const updatedPowers = character.paranormal_powers.filter(
                              p => p.id !== revertedPowerId
                            );
                            
                            // Atualizar no banco
                            await supabase
                              .from('characters')
                              .update({ paranormal_powers: updatedPowers })
                              .eq('id', character.id);
                            
                            // Atualizar estado local
                            setCharacter(prev => prev ? {
                              ...prev,
                              paranormal_powers: updatedPowers,
                            } : null);
                          }
                        }}
                      />
                    </div>
                  )}

                  {character.general_powers && character.general_powers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Poderes Gerais
                      </p>
                      {character.general_powers.map((power) => {
                        const powerData = getGeneralPowerById(power.id);
                        const hasRitualGrant = powerData?.grantsRitual && character.class !== 'Ocultista';
                        
                        return (
                          <div key={power.id}>
                            <SheetAccordionItem
                              title={power.name}
                              description={powerData?.description || power.description}
                              badge={power.category || 'Geral'}
                              badgeVariant="default"
                            />
                            {/* Mostrar botão para escolher ritual se o poder conceder */}
                            {hasRitualGrant && (
                              <div className="ml-4 mt-1 p-2 rounded bg-paranormal/10 border border-paranormal/30">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs">
                                    <Sparkles className="w-3 h-3 text-paranormal" />
                                    <span className="text-paranormal">
                                      {learnedRitualsFromPowers.filter(r => r.source === 'ritual-aprendido').length > 0 
                                        ? `Ritual: ${ALL_RITUALS.find(r => r.id === learnedRitualsFromPowers.find(lr => lr.source === 'ritual-aprendido')?.ritualId)?.name || 'Escolhido'}`
                                        : 'Nenhum ritual escolhido'}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-paranormal hover:text-paranormal"
                                    onClick={() => {
                                      setRitualModalSource('ritual-aprendido');
                                      setNonOccultistRitualModalOpen(true);
                                    }}
                                  >
                                    {learnedRitualsFromPowers.some(r => r.source === 'ritual-aprendido') ? 'Alterar' : 'Escolher'}
                                  </Button>
                                </div>
                                {learnedRitualsFromPowers.some(r => r.source === 'ritual-aprendido') && (
                                  <p className="text-[10px] text-yellow-400/80 mt-1">
                                    ⚠️ Custo: ×2 PE (não-ocultista)
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </SheetAccordionSection>

              {/* Painel de Rituais Sustentados */}
              <SustainedRitualControl key={character.id} characterId={character.id}
                state={sustainedState} peCurrent={peCurrent} onRefetch={refetchCharacter}  />

              {/* Painel do Sistema Unificado de Efeitos */}
              <ActiveEffectsPanel effectsResult={unifiedEffects} />
              
              {/* DevTools do SUE - apenas em modo desenvolvedor */}
              <SUEDevToolsPanel 
                hardeningData={unifiedEffects?.hardening ? {
                  effects: unifiedEffects.hardening.preparedEffects,
                  stackingBreakdowns: unifiedEffects.hardening.stackingBreakdowns,
                  excludedEffects: unifiedEffects.hardening.excludedEffects,
                  metadata: unifiedEffects.hardening.metadata,
                } : null}
                isDeveloperMode={developerMode}
              />

              {/* Botão de Descanso */}
              <Button
                variant="outline"
                onClick={() => setRestModalOpen(true)}
                className="w-full font-display tracking-wider sheet-panel border-2 border-primary/40 hover:border-primary/60"
              >
                <Moon className="w-4 h-4 mr-2" />
                DESCANSAR
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Painel de ajuda flutuante */}
      <CharacterSheetHelp 
        characterClass={character.class} 
        nex={character.nex} 
      />

      {/* Modais com Lazy Loading (carregados sob demanda) */}
      <Suspense fallback={null}>
        <NexProgressionModal
          open={nexModalOpen}
          onClose={() => setNexModalOpen(false)}
          character={{
            id: character.id,
            name: character.name,
            class: character.class,
            class_track: character.class_track,
            nex: character.nex,
            vigor: character.vigor,
            presence: character.presence,
            agility: character.agility,
            strength: character.strength,
            intellect: character.intellect,
            origin: character.origin,
            hp_max: character.hp_max,
            pe_max: character.pe_max,
            san_max: character.san_max,
            rituals: character.rituals,
            abilities: character.abilities,
            skills: character.skills,
            paranormal_powers: character.paranormal_powers?.map(p => {
              const fullPower = PARANORMAL_POWERS.find(fp => fp.id === p.id);
              return fullPower || {
                id: p.id,
                name: p.name,
                element: p.element as ParanormalElement | 'generic',
                description: p.description,
                effect: { type: 'special' as const, description: p.description },
              };
            }),
            elemental_affinity: character.elemental_affinity as ParanormalElement | null,
            affinity_active: character.affinity_active,
          }}
          onLevelUp={handleLevelUp}
        />
      </Suspense>
      
      <Suspense fallback={null}>
        <RitualSelectionModal
          open={ritualModalOpen}
          onClose={() => setRitualModalOpen(false)}
          currentRituals={character.rituals}
          maxCircle={pendingMaxCircle}
          newSlots={pendingRitualSlots}
          onConfirm={handleRitualsConfirm}
        />
      </Suspense>
      
      <Suspense fallback={null}>
        <CharacterEditModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            // Reset para aba padrão ao fechar
            setEditModalInitialTab('info');
          }}
          character={{
            ...character,
            class_track: character.class_track || null,
          }}
          onSave={handleCharacterEdit}
          initialTab={editModalInitialTab}
        />
      </Suspense>
      
      <RestModal
        open={restModalOpen}
        onOpenChange={setRestModalOpen}
        character={{
          hp_current: hpCurrent,
          hp_max: character.hp_max,
          pe_current: peCurrent,
          pe_max: character.pe_max,
          san_current: sanCurrent,
          san_max: character.san_max,
          vigor: character.vigor,
          presence: character.presence,
          conditions: getConditionNames(character.conditions),
        }}
        onRest={async (newStats) => {
          const { error } = await supabase
            .from('characters')
            .update({
              hp_current: newStats.hp_current,
              pe_current: newStats.pe_current,
              san_current: newStats.san_current,
              conditions: newStats.conditions,
            })
            .eq('id', character.id);

          if (error) {
            toast({
              title: 'Erro ao salvar descanso',
              description: error.message,
              variant: 'destructive',
            });
            return;
          }

          setHpCurrent(newStats.hp_current);
          setPeCurrent(newStats.pe_current);
          setSanCurrent(newStats.san_current);
          setCharacter(prev => prev ? {
            ...prev,
            hp_current: newStats.hp_current,
            pe_current: newStats.pe_current,
            san_current: newStats.san_current,
            conditions: newStats.conditions,
          } : null);

          toast({
            title: 'Descanso concluído!',
            description: 'Seus recursos foram recuperados.',
          });
        }}
      />
      
      {/* Modal de rolagem imediata */}
      <DiceRollModal
        open={diceModalOpen}
        onClose={() => setDiceModalOpen(false)}
        label={rollLabel}
        attributeValue={rollAttribute}
        skillBonus={rollSkillBonus}
        resistanceBonus={rollResistanceBonus}
        extraDice={rollExtraDice}
        activeConditions={activeConditionsForSUE}
        bonusSources={rollBonusSources}
        onRollComplete={handleRollComplete}
        activatablePowers={activatablePowersForCharacter}
        peCurrent={peCurrent}
        nex={character.nex}
        intellect={character.intellect}
        strength={character.strength}
        agility={character.agility}
        presence={character.presence}
        vigor={character.vigor}
        currentSkill={rollTestedAttribute}
        characterSkillTraining={character.skills || {}}
        characterSkills={Object.fromEntries(
          Object.entries(bonusSummary.skills).map(([k, v]) => [k, v.total])
        )}
        onPEChange={handlePEChange}
      />

      {/* Modal de seleção de poderes paranormais */}
      <ParanormalPowerSelectModal
        open={paranormalPowerModalOpen}
        onOpenChange={setParanormalPowerModalOpen}
        onSelectPower={handleParanormalPowerSelect}
        characterPowers={enrichedParanormalPowers}
        elementalAffinity={character.elemental_affinity as ParanormalElement | null}
        affinityActive={character.affinity_active}
      />

      {/* Modal de escolha de perícias de Intelecto (Expansão de Conhecimento) */}
      <IntellectSkillSelectModal
        open={intellectSkillModalOpen}
        onClose={() => {
          setIntellectSkillModalOpen(false);
          setPendingPower(null);
        }}
        onConfirm={handleIntellectSkillConfirm}
        hasAffinity={character.affinity_active && character.elemental_affinity === 'conhecimento'}
        alreadyChosenSkills={(character.paranormal_powers || [])
          .filter(p => p.id === 'expansao-de-conhecimento')
          .flatMap(p => (p as SavedParanormalPower).choices?.skills || [])}
      />

      {/* Modal de escolha de elemento de resistência (Resistir a Elemento) */}
      <ElementResistanceSelectModal
        open={elementResistanceModalOpen}
        onClose={() => {
          setElementResistanceModalOpen(false);
          setPendingPower(null);
        }}
        onConfirm={handleElementResistanceConfirm}
        alreadyResistant={(character.paranormal_powers || [])
          .filter(p => p.id === 'resistir-a-elemento')
          .map(p => (p as SavedParanormalPower).choices?.resistElement)
          .filter(Boolean) as ParanormalElement[]}
      />

      {/* Modal de seleção de ritual para não-ocultistas */}
      <NonOccultistRitualModal
        open={nonOccultistRitualModalOpen}
        onClose={() => setNonOccultistRitualModalOpen(false)}
        source={ritualModalSource}
        currentRituals={[
          ...character.rituals,
          ...learnedRitualsFromPowers.map(r => r.ritualId)
        ]}
        onConfirm={(ritualIds) => {
          // Caso especial: ritual do poder paranormal "Aprender Ritual"
          if (ritualModalSource === 'aprender-ritual-poder' && pendingPower && ritualIds.length > 0) {
            handleRitualFromPowerConfirm(ritualIds[0]);
            return;
          }
          
          // Salvar os rituais aprendidos via poderes gerais
          const newRituals: LearnedRitual[] = ritualIds.map(id => ({
            ritualId: id,
            source: ritualModalSource,
            peMultiplier: ritualModalSource === 'ritual-aprendido' ? 2 : 1,
          }));
          
          // Substituir rituais da mesma fonte
          const filteredRituals = learnedRitualsFromPowers.filter(r => r.source !== ritualModalSource);
          setLearnedRitualsFromPowers([...filteredRituals, ...newRituals]);
          setNonOccultistRitualModalOpen(false);
          
          toast({
            title: 'Ritual aprendido!',
            description: `Você aprendeu ${ritualIds.length} ritual(is). Lembre-se: custo de PE é dobrado para não-ocultistas.`,
          });
        }}
      />

      {/* Modal de conjuração de ritual com validação de requisitos e bônus SUE */}
      <RitualCastModal
        open={castModalOpen}
        onOpenChange={setCastModalOpen}
        ritual={ritualToCast}
        context={castingRequirements.context}
        loading={castingRequirements.loading}
        error={castingRequirements.error}
        onReview={castingRequirements.review}
        reviewing={castingRequirements.reviewing}
        reviewError={castingRequirements.reviewError}
        peCurrent={peCurrent}
        temporaryPE={temporaryResources.pe}
        peBudget={peBudget.data}
        peBudgetLoading={peBudget.isLoading}
        peBudgetError={peBudget.error instanceof Error ? peBudget.error.message : undefined}
        peMax={character.pe_max}
        isNonOccultist={character.class !== 'Ocultista'}
        nex={character.nex}
        elementalAffinity={character.elemental_affinity}
        onConfirm={handleCastRitual}
        ritualBonuses={ritualBonuses}
        intellect={character.intellect}
        peLimitBonus={bonusSummary?.unifiedEffects?.computed?.resources?.peLimitBonus || 0}
      />

      {/* Modal de dano/cura do ritual (Fase 3) */}
      <RitualDamageModal
        open={damageModalOpen}
        onOpenChange={setDamageModalOpen}
        ritual={ritualForDamage}
        enhancements={ritualEnhancements}
        // Bônus do SUE para dano de rituais
        ritualDamageBonus={ritualBonuses.damageBonus}
        damageAttributeBonus={ritualBonuses.damageAttributeBonus}
        onApplyDamage={async result => { await applyRitualToTarget('damage', result.total, result.damageType); }}
        onApplyHealing={async result => {
          if (result.type !== 'healing') throw new Error('PV temporários permanecem pendentes de controle manual.');
          await applyRitualToTarget('heal', result.total);
        }}
        onRequestResistance={(damage) => {
          // Abre o modal de resistência com o dano atual
          setPendingDamage(damage);
          const effect = ritualForDamage ? getActiveRitualEffect(ritualForDamage.id, ritualEnhancements) : null;
          setResistanceEffect(effect || null);
          setResistanceModalOpen(true);
        }}
        onRequestConditions={() => {
          // Abre o modal de condições (Fase 6)
          if (!ritualForDamage) return;
          const effect = getActiveRitualEffect(ritualForDamage.id, ritualEnhancements);
          if (!effect) return;
          
          const conditions = extractConditionsFromEffect(effect);
          if (conditions.length === 0) return;
          
          setPendingRitualConditions(conditions);
          setConditionRitualName(ritualForDamage.name);
          setConditionRitualElement(ritualForDamage.element);
          setConditionModalOpen(true);
        }}
        onClose={() => {
          setRitualForDamage(null);
          setRitualEnhancements([]);
        }}
      />

      {/* Modal de teste de resistência (Fase 4) */}
      <ResistanceCheckModal
        characterClass={character.class}
        classTrack={character.class_track}
        nex={character.nex}
        activeConditions={activeConditionsForSUE}
        targetSkills={Object.fromEntries(Object.entries(character.skills).map(([skill, grade]) => [skill, getSkillBonus(grade)]))}
        open={resistanceModalOpen}
        onOpenChange={setResistanceModalOpen}
        ritual={ritualForDamage}
        effect={resistanceEffect}
        damage={pendingDamage}
        targetAttributes={{
          vigor: character.vigor,
          agility: character.agility,
          presence: character.presence,
        }}
        onResult={(result, adjustedDamage) => {
          if (result.passed) {
            toast({
              title: `Resistência bem-sucedida!`,
              description: adjustedDamage !== undefined 
                ? `Dano reduzido: ${pendingDamage} → ${adjustedDamage}`
                : `Efeito evitado ou reduzido`,
            });
          } else {
            toast({
              title: `Resistência falhou!`,
              description: `Dano total: ${pendingDamage}`,
              variant: 'destructive',
            });
          }
          setResistanceModalOpen(false);
          setPendingDamage(0);
          setResistanceEffect(null);
        }}
      />

      {/* Modal de aplicação de condições de rituais (Fase 6) */}
      <RitualConditionModal
        open={conditionModalOpen}
        onClose={() => {
          setConditionModalOpen(false);
          setPendingRitualConditions([]);
        }}
        ritualName={conditionRitualName}
        ritualElement={conditionRitualElement}
        pendingConditions={pendingRitualConditions}
        targetName={character.name}
        onApplyConditions={async (newConditions) => {
          // Merge com condições existentes usando helper
          const existingConditions = (character.conditions || []).map(parseCondition);
          
          // Filtra duplicatas
          const uniqueNew = newConditions.filter(
            nc => !existingConditions.some(ec => ec.id === nc.id)
          );
          
          const allConditions = [...existingConditions, ...uniqueNew];
          const serializedConditions = allConditions.map(serializeCondition);
          
          const { error } = await supabase
            .from('characters')
            .update({ conditions: JSON.parse(JSON.stringify(serializedConditions)) })
            .eq('id', character.id);

          if (error) {
            toast({
              title: 'Erro ao aplicar condições',
              description: error.message,
              variant: 'destructive',
            });
            return;
          }

          setCharacter(prev => prev ? {
            ...prev,
            conditions: serializedConditions,
          } : null);

          toast({
            title: 'Condições aplicadas!',
            description: `${uniqueNew.map(c => c.name).join(', ')} adicionadas a ${character.name}`,
          });
        }}
      />

      {/* Wizard de efeitos integrado (Fase 7) */}
      {!isMobile && <><PETurnBudgetPanel characterId={character.id} /><TemporaryResourcesPanel characterId={character.id} /></>}
      <RitualEffectWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        ritual={wizardRitual}
        enhancements={wizardEnhancements}
        peCost={wizardPeCost}
        casterResistanceDT={calculateRitualResistanceDT(
          character.nex,
          character.presence,
          bonusSummary?.unifiedEffects?.computed?.resources?.peLimitBonus || 0,
          wizardRitual ? ritualBonuses.getDTForRitual(wizardRitual.element) : 0,
        )}
        // Bônus do SUE para dano de rituais
        ritualDamageBonus={ritualBonuses.damageBonus}
        damageAttributeBonus={ritualBonuses.damageAttributeBonus}
        // Bônus de Cura de Origem (Agente de Saúde / Técnica Medicinal)
        healingBonusFromOrigin={ritualBonuses.healingBonusFromOrigin}
        healingBonusFromOriginSource={ritualBonuses.healingBonusFromOriginSource}
        targetAttributes={selectedRitualTarget ? { vigor: selectedRitualTarget.vigor, agility: selectedRitualTarget.agility, presence: selectedRitualTarget.presence } : undefined}
          applicationTargetId={ritualTargetId ?? undefined}
          onResolutionRoll={result => {
            const entry = ritualRollHistory(wizardRitual?.name ?? 'Ritual', result);
            void saveActivityRoll({ entry: activityJson(entry), label: entry.label, type: entry.type });
          }}
          targetResistanceBonuses={selectedRitualTarget ? ritualTargetSkillBonuses(selectedRitualTarget.skills) : undefined}
        applicationTarget={<>
          <RitualApplicationTargetSelector characterId={character.id} value={ritualTargetId} onChange={setRitualTargetId} disabled={ritualApplication.busy} />
          {wizardRitual && getActiveRitualEffect(wizardRitual.id, wizardEnhancements)?.weaponEffect && <p role="status" className="text-sm text-amber-300">O bônus de arma será associado à ficha escolhida e usado em seus ataques. Este fluxo ainda não diferencia uma arma específica.</p>}
        </>}
        onApplyDamage={async (damage, type) => { await applyRitualToTarget('damage', damage, type); }}
        onApplyHealing={async (amount, type) => {
          await applyRitualToTarget(type === 'healing' ? 'heal' : 'temporary_hp', amount);
        }}
        onApplyConditions={async conditions => { await applyRitualToTarget('conditions', activityJson(conditions)); }}
        onAddWeaponBuff={async (ritual, enhancements) => { await applyRitualToTarget('weapon_buff', activityJson(buildWeaponBuff(ritual, enhancements))); }}
        onActivateSustained={async (ritual, enhancements, sustain) => { await applyRitualToTarget('sustain', activityJson(buildSustainPayload(ritual, enhancements, sustain))); }}
        onComplete={() => {
          setWizardRitual(null);
          setWizardEnhancements([]);
          setWizardPeCost(0);
        }}
      />

      {/* Modal de detalhes de habilidade */}
      <AbilityDetailModal
        ability={selectedAbility}
        isOpen={abilityDetailOpen}
        onClose={() => setAbilityDetailOpen(false)}
        nex={character?.nex || 5}
      />

      {/* Modal de remoção de rituais excedentes */}
      {ritualLimits && (
        <ExcessRitualsRemovalModal
          open={excessRitualsModalOpen}
          onOpenChange={setExcessRitualsModalOpen}
          ritualIds={character.rituals}
          maxRituals={ritualLimits.count}
          characterId={character.id}
          onRemoveRituals={async (ritualsToRemove) => {
            const newRituals = character.rituals.filter(
              ritualId => !ritualsToRemove.includes(ritualId)
            );
            
            const { error } = await supabase
              .from('characters')
              .update({ rituals: newRituals })
              .eq('id', character.id);

            if (error) {
              throw error;
            }

            await refetchCharacter();
          }}
        />
      )}
      
      {/* Modal de remoção de poderes paranormais excedentes */}
      <ExcessPowersRemovalModal
        open={excessPowersModalOpen}
        onOpenChange={setExcessPowersModalOpen}
        powers={(character.paranormal_powers || []) as SavedParanormalPower[]}
        maxPowers={getMaxParanormalPowers(character.nex, character.origin).total}
        characterId={character.id}
        onRemovePowers={async (powerIds, powersToArchive) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Salva poderes no histórico antes de remover
          for (const power of powersToArchive) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from('character_removed_powers') as any).insert({
              character_id: character.id,
              user_id: user.id,
              power_id: power.id,
              power_name: power.name,
              power_element: power.element || null,
              power_description: power.description || null,
              power_data: power,
              removal_reason: 'excess_limit',
            });
          }

          // Remove os poderes selecionados
          const updatedPowers = character.paranormal_powers?.filter(
            p => !powerIds.includes(p.id)
          ) || [];
          
          const { error } = await supabase
            .from('characters')
            .update({ paranormal_powers: updatedPowers })
            .eq('id', character.id);

          if (error) {
            throw error;
          }

          await refetchCharacter();
        }}
      />

      {/* Widget de Debug de Automações - apenas para modo desenvolvedor */}
      {developerMode && (
        <AutomationDebugWidget
          auditCounts={auditCounts}
          isAuditing={isAuditing}
          bonusSummary={bonusSummary}
          defenseBonuses={defenseBonuses}
          activeConditions={parsedConditions.map(c => ({
            id: c.id,
            name: c.name,
            turnsRemaining: c.turnsRemaining,
          }))}
          sustainedRituals={sustainedRituals}
          weaponBuffs={weaponBuffs}
          activeConditionalBonuses={character.active_conditional_bonuses || []}
          affinityActive={character.affinity_active || false}
          elementalAffinity={character.elemental_affinity || undefined}
          characterDefense={character.defense}
          characterAgility={character.agility}
        />
      )}

      {/* Modal de Salvar como Template */}
      {character && (
        <TemplateSaveModal
          open={templateSaveModalOpen}
          onOpenChange={setTemplateSaveModalOpen}
          character={{
            id: character.id,
            name: character.name,
            origin: character.origin,
            class: character.class,
            class_track: character.class_track,
            elemental_affinity: character.elemental_affinity,
            nex: character.nex,
            agility: character.agility,
            strength: character.strength,
            intellect: character.intellect,
            vigor: character.vigor,
            presence: character.presence,
            skills: character.skills,
            abilities: (character.abilities || []).map((a: any) => typeof a === 'string' ? { id: a, name: a } : { id: a.id || a.name, name: a.name }),
            general_powers: (character.general_powers || []).map((p: any) => typeof p === 'string' ? { id: p, name: p } : { id: p.id || p.name, name: p.name }),
            paranormal_powers: (character.paranormal_powers || []).map((p: any) => typeof p === 'string' ? { id: p, name: p, element: '' } : { id: p.id || p.name, name: p.name, element: p.element || '' }),
            rituals: character.rituals,
            inventory: character.inventory,
          }}
        />
      )}

      {/* Modal de Grau de Treinamento (NEX 35% e 70%) */}
      {character && (
        <TrainingGradeSelectModal
          isOpen={trainingGradeModalOpen}
          onClose={() => setTrainingGradeModalOpen(false)}
          onConfirm={handleTrainingGradeConfirm}
          nex={trainingGradeNex}
          characterClass={character.class}
          intellect={character.intellect}
          currentSkills={character.skills || {}}
          existingChoices={
            (trainingGradeNex === 35
              ? character.training_grade_choices?.nex35 || []
              : character.training_grade_choices?.nex70 || []) as SkillUpgradeChoice[]
          }
          previousNexConfigured={
            trainingGradeNex === 70
              ? (character.training_grade_choices?.nex35 || []).length > 0
              : true // Para NEX 35%, sempre true (não há anterior obrigatório)
          }
        />
      )}
      
      {/* Modal de Correção de Perícias Faltantes */}
      {character && missingSkillsModalOpen && auditResult && (() => {
        // Extrai valores da issue específica low_trained_skills
        const lowSkillsIssue = auditResult.issues.find(i => i.id.includes('low_trained_skills'));
        const currentTrained = typeof lowSkillsIssue?.currentValue === 'number' ? lowSkillsIssue.currentValue : 0;
        const expectedTrained = typeof lowSkillsIssue?.expectedValue === 'number' ? lowSkillsIssue.expectedValue : 0;
        
        return (
          <MissingSkillsFixModal
            isOpen={missingSkillsModalOpen}
            onClose={() => setMissingSkillsModalOpen(false)}
            onConfirm={handleMissingSkillsConfirm}
            currentSkills={character.skills || {}}
            currentTrainedCount={currentTrained}
            expectedTrainedCount={expectedTrained}
          />
        );
      })()}

      {/* Modal de Validação e Correção Automática */}
      <ValidationAutoFixModal
        open={validationModalOpen}
        onOpenChange={setValidationModalOpen}
        validationResult={validationAutoFix.validationResult}
        onApplyFixes={handleApplyValidationFixes}
        onRefresh={handleOpenValidationModal}
        isApplying={validationAutoFix.isApplying}
        characterName={character?.name}
      />
    </div>
  );
}
