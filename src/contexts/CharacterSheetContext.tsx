/**
 * CharacterSheetContext - Provider Compartilhado Desktop/Mobile
 * 
 * Centraliza estado e lógica da ficha de personagem para garantir
 * paridade completa entre as versões desktop e mobile.
 * 
 * Integra:
 * - Estado consolidado (useCharacterSheetState)
 * - Bônus do SUE (useBonusSummaryFromSUE)
 * - Auditoria (useCharacterAudit)
 * - Rituais sustentados (useSustainedRituals)
 * - Buffs de armas (useWeaponBuffs)
 * 
 * @module contexts/CharacterSheetContext
 */

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  useCharacterSheetState,
  type CharacterSheetState,
  type RollConfig,
  type RitualConfig,
  type WizardConfig,
  type RitualSelectionConfig,
  type SelectedAbility,
  type ModalType,
  type RitualSource,
} from '@/hooks/character/useCharacterSheetState';
import {
  useBonusSummaryFromSUE,
  useSustainedRituals,
  useWeaponBuffs,
  useCharacterAudit,
  useAutoConditions,
  useRoundTracking,
  useActivatedEffects,
  useCampaignRitualSync,
  useConditionalBonusesSync,
  useBonusSync,
  useRitualCombatBonuses,
} from '@/hooks';
import type { DiceRollResult } from '@/lib/dice-roller';
import type { ParanormalPower } from '@/lib/paranormal-powers';
import type { Ritual } from '@/lib/rituals/legacy-exports';
import type { RitualCastRecord } from '@/components/character/RitualCastHistory';
import type { WeaponBuff } from '@/hooks/useWeaponBuffs';

// ========================================
// TIPOS DO CONTEXTO
// ========================================

/** Dados do personagem carregado */
export interface CharacterData {
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
  inventory: any[];
  rituals: string[];
  background: string | null;
  notes: string | null;
  conditions: (string | { id: string; name: string; turnsRemaining: number | null; addedAt: string; dyingCounter?: number })[];
  photo_url?: string | null;
  age?: number | null;
  gender?: string | null;
  appearance?: string | null;
  personality?: string | null;
  paranormal_powers?: Array<{ id: string; name: string; element: string; description: string }>;
  general_powers?: Array<{ id: string; name: string; description: string; category?: string }>;
  elemental_affinity?: string | null;
  affinity_active?: boolean;
  active_buffs?: WeaponBuff[];
  active_conditional_bonuses?: string[];
  versatility_track?: {
    trackId: string;
    trackName: string;
    abilityId: string;
    abilityName: string;
  } | null;
  skill_training_choices?: Record<string, Array<{ skillId: string; fromLevel: number; toLevel: number }>>;
  class_power_choices?: Record<string, { powerId: string; choiceType: string; chosenValues: string[] }>;
  training_grade_choices?: {
    nex35?: Array<{ skillId: string; fromLevel: number; toLevel: number }>;
    nex70?: Array<{ skillId: string; fromLevel: number; toLevel: number }>;
  };
}

/** Actions disponíveis no contexto */
export interface CharacterSheetActions {
  // Modais
  openModal: (modal: ModalType) => void;
  closeModal: (modal: ModalType) => void;
  closeAllModals: () => void;
  
  // Stats
  updateStats: (stats: Partial<{ hp: number; pe: number; san: number }>) => void;
  saveStats: () => Promise<void>;
  
  // Rolagem
  openDiceRoll: (config: Partial<RollConfig>) => void;
  addRollToHistory: (roll: DiceRollResult) => void;
  
  // Rituais
  openRitualCast: (ritual: Ritual) => void;
  openRitualWizard: (ritual: Ritual, enhancements?: string[], peCost?: number) => void;
  addCastToHistory: (cast: RitualCastRecord) => void;
  
  // Habilidades
  openAbilityDetail: (ability: SelectedAbility) => void;
  
  // Poderes
  setPendingPower: (power: ParanormalPower | null) => void;
  
  // Grau de treinamento
  openTrainingGrade: (nex: 35 | 70) => void;
  
  // Outros
  setRitualSource: (source: RitualSource) => void;
  setEditModalTab: (tab: string) => void;
  refetchCharacter: () => Promise<void>;
}

/** Valor do contexto completo */
export interface CharacterSheetContextValue {
  // Dados do personagem
  character: CharacterData | null;
  loading: boolean;
  saving: boolean;
  
  // Estado da UI
  state: CharacterSheetState;
  actions: CharacterSheetActions;
  
  // Bônus do SUE
  bonusSummary: ReturnType<typeof useBonusSummaryFromSUE>;
  
  // Auditoria
  audit: ReturnType<typeof useCharacterAudit>;
  
  // Rituais sustentados
  sustainedRituals: ReturnType<typeof useSustainedRituals>;
  
  // Buffs de armas
  weaponBuffs: ReturnType<typeof useWeaponBuffs>;
  
  // Tracking de rodada
  roundTracking: ReturnType<typeof useRoundTracking>;
  
  // Efeitos ativados
  activatedEffects: ReturnType<typeof useActivatedEffects>;
  
  // Bônus de combate de rituais
  ritualCombatSummary: ReturnType<typeof useRitualCombatBonuses>;
  
  // Campanha
  isInCampaign: boolean;
  syncRitualCast: (
    ritual: Ritual,
    peCost: number,
    enhancements: string[],
    peBefore: number,
    peAfter: number
  ) => Promise<void>;
  
  // Bônus condicionais
  toggleConditionalBonus: (id: string, active: boolean) => Promise<void>;
}

// ========================================
// CONTEXTO
// ========================================

const CharacterSheetContext = createContext<CharacterSheetContextValue | null>(null);

// ========================================
// PROVIDER
// ========================================

interface CharacterSheetProviderProps {
  characterId: string;
  children: ReactNode;
}

export function CharacterSheetProvider({
  characterId,
  children,
}: CharacterSheetProviderProps) {
  const { user } = useAuth();
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);

  // Hook consolidado de estado da UI
  const {
    state,
    actions: stateActions,
    openDiceRoll,
    openRitualCast,
    openRitualWizard,
    openAbilityDetail,
    openTrainingGrade,
  } = useCharacterSheetState(
    character
      ? {
          hp: character.hp_current,
          pe: character.pe_current,
          san: character.san_current,
        }
      : undefined
  );

  // Carrega personagem do banco
  const fetchCharacter = useCallback(async () => {
    if (!characterId || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single();

      if (error) throw error;
      if (data) {
        setCharacter(data as unknown as CharacterData);
        stateActions.updateStats({
          hp: data.hp_current,
          pe: data.pe_current,
          san: data.san_current,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar personagem:', error);
    } finally {
      setLoading(false);
      stateActions.setLoading(false);
    }
  }, [characterId, user, stateActions]);

  useEffect(() => {
    fetchCharacter();
  }, [fetchCharacter]);

  // Salva stats no banco
  const saveStats = useCallback(async () => {
    if (!character) return;

    stateActions.setSaving(true);
    try {
      const { error } = await supabase
        .from('characters')
        .update({
          hp_current: state.stats.hp,
          pe_current: state.stats.pe,
          san_current: state.stats.san,
        })
        .eq('id', character.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar stats:', error);
    } finally {
      stateActions.setSaving(false);
    }
  }, [character, state.stats, stateActions]);

  // Extrai condições ativas para o SUE
  const activeConditionsForSUE = useMemo(
    () =>
      (character?.conditions || []).map((c) =>
        typeof c === 'string' ? c : c.id
      ),
    [character?.conditions]
  );

  // Detecta equipamento
  const equippedWeaponInfo = useMemo(() => {
    const equippedWeapon = (character?.inventory || []).find(
      (item: any) => item.isEquipped && item.itemType === 'weapon'
    );
    if (!equippedWeapon) return { type: undefined, id: undefined, name: undefined, isLightMelee: false };
    
    const weaponTypeMap: Record<string, 'melee' | 'ranged' | 'firearm' | 'tactical' | 'heavy' | 'unarmed' | 'any'> = {
      melee: 'melee',
      ranged: 'ranged',
      firearm: 'firearm',
      tactical: 'tactical',
      heavy: 'heavy',
      unarmed: 'unarmed',
      'corpo-a-corpo': 'melee',
      distância: 'ranged',
      arremesso: 'ranged',
      'arma-de-fogo': 'firearm',
    };
    
    const weaponType = equippedWeapon.weaponType
      ? weaponTypeMap[equippedWeapon.weaponType.toLowerCase()] || 'any'
      : undefined;
    
    const weaponProperties = (equippedWeapon as any).properties || [];
    const hasAgileProperty =
      Array.isArray(weaponProperties) &&
      weaponProperties.some(
        (p: string) =>
          p.toLowerCase().includes('ágil') ||
          p.toLowerCase().includes('agil') ||
          p.toLowerCase() === 'light'
      );
    const isLightMelee = weaponType === 'melee' && hasAgileProperty;
    
    return {
      type: weaponType,
      id: equippedWeapon.id,
      name: equippedWeapon.name,
      isLightMelee,
    };
  }, [character?.inventory]);

  const equippedProtectionType = useMemo(() => {
    const equippedArmor = (character?.inventory || []).find(
      (item: any) =>
        item.isEquipped && (item.itemType === 'armor' || item.itemType === 'protection')
    );
    if (!equippedArmor?.armorType) return undefined;
    const armorTypeMap: Record<string, 'light' | 'heavy' | 'any'> = {
      leve: 'light',
      pesada: 'heavy',
      light: 'light',
      heavy: 'heavy',
    };
    return armorTypeMap[equippedArmor.armorType.toLowerCase()] || 'any';
  }, [character?.inventory]);

  // Hook de rituais sustentados
  const sustainedRituals = useSustainedRituals({
    characterId: character?.id,
    enabled: !!character,
  });

  // Rituais ativos para defesa
  const activeRitualsForDefense = useMemo(
    () =>
      sustainedRituals.rituals.map((r) => ({
        ritualId: r.ritualId,
        ritualName: r.ritualName,
        enhancements: r.selectedEnhancements,
      })),
    [sustainedRituals.rituals]
  );

  // Hook SUE como fonte única de verdade
  const bonusSummary = useBonusSummaryFromSUE({
    origin: character?.origin || '',
    abilities: character?.abilities || [],
    generalPowers: character?.general_powers || [],
    paranormalPowers: character?.paranormal_powers || [],
    inventory: character?.inventory || [],
    nex: character?.nex || 5,
    elementalAffinity: character?.elemental_affinity,
    affinityActive: character?.affinity_active,
    activeConditionalBonuses: character?.active_conditional_bonuses || [],
    activeRituals: activeRitualsForDefense,
    skills: character?.skills || {},
    intellect: character?.intellect ?? 1,
    vigor: character?.vigor ?? 1,
    strength: character?.strength ?? 1,
    agility: character?.agility ?? 1,
    presence: character?.presence ?? 1,
    classId: character?.class,
    classTrack: character?.class_track,
    classPowers: character?.powers?.map((p) => p.name) || [],
    equippedWeaponType: equippedWeaponInfo.type,
    equippedProtectionType,
    equippedWeaponId: equippedWeaponInfo.id,
    equippedWeaponName: equippedWeaponInfo.name,
    isLightMeleeEquipped: equippedWeaponInfo.isLightMelee,
    inCombat: false,
    hpCurrent: state.stats.hp,
    hpMax: character?.hp_max || 0,
    peCurrent: state.stats.pe,
    peMax: character?.pe_max || 0,
    activeConditions: activeConditionsForSUE,
    versatilityTrack: character?.versatility_track || undefined,
    classPowerChoices: character?.class_power_choices || {},
  });

  // Hook de auditoria - passa o personagem completo com cast para CharacterForAudit
  const characterForAudit = character as unknown as import('@/lib/character-audit-engine').CharacterForAudit | null;
  const audit = useCharacterAudit(characterForAudit, user?.id || null, {
    autoRun: true,
  });

  // Hook de tracking de rodada
  const roundTracking = useRoundTracking();

  // Hook de efeitos ativados
  const activatedEffects = useActivatedEffects({
    characterId: character?.id,
    enablePersistence: !!character,
  });

  // Bônus de combate de rituais
  const ritualCombatSummary = useRitualCombatBonuses(sustainedRituals.rituals);

  // Handler para salvar buffs de armas
  const handleWeaponBuffsChange = useCallback(
    async (buffs: WeaponBuff[]) => {
      if (!character) return;
      const { error } = await supabase
        .from('characters')
        .update({ active_buffs: JSON.parse(JSON.stringify(buffs)) })
        .eq('id', character.id);
      if (error) {
        console.error('Erro ao salvar buffs:', error);
      }
    },
    [character]
  );

  // Hook de buffs de armas
  const weaponBuffs = useWeaponBuffs(
    characterId,
    character?.active_buffs,
    handleWeaponBuffsChange
  );

  // Sincronização com campanha
  const { isInCampaign, syncRitualCast } = useCampaignRitualSync({
    characterId: characterId,
    userId: user?.id || '',
    enabled: !!character,
  });

  // Handler para bônus condicionais
  const handleConditionalBonusesChange = useCallback(
    (newBonuses: string[]) => {
      setCharacter((prev) =>
        prev ? { ...prev, active_conditional_bonuses: newBonuses } : null
      );
    },
    []
  );

  // Sincronização de bônus condicionais
  const { toggleBonus: toggleConditionalBonus } = useConditionalBonusesSync({
    characterId: characterId,
    activeBonuses: character?.active_conditional_bonuses || [],
    onBonusesChange: handleConditionalBonusesChange,
    enabled: !!character,
  });

  // Sincronização de bônus com campanha
  useBonusSync({
    characterId: characterId,
    bonusSummary,
    enabled: !!character,
    isInCampaign,
  });

  // Monta actions do contexto
  const actions: CharacterSheetActions = useMemo(
    () => ({
      openModal: stateActions.openModal,
      closeModal: stateActions.closeModal,
      closeAllModals: stateActions.closeAllModals,
      updateStats: stateActions.updateStats,
      saveStats,
      openDiceRoll,
      addRollToHistory: stateActions.addRollToHistory,
      openRitualCast,
      openRitualWizard,
      addCastToHistory: stateActions.addCastToHistory,
      openAbilityDetail,
      setPendingPower: stateActions.setPendingPower,
      openTrainingGrade,
      setRitualSource: stateActions.setRitualSource,
      setEditModalTab: stateActions.setEditModalTab,
      refetchCharacter: fetchCharacter,
    }),
    [
      stateActions,
      saveStats,
      openDiceRoll,
      openRitualCast,
      openRitualWizard,
      openAbilityDetail,
      openTrainingGrade,
      fetchCharacter,
    ]
  );

  // Monta valor do contexto
  const value: CharacterSheetContextValue = useMemo(
    () => ({
      character,
      loading,
      saving: state.saving,
      state,
      actions,
      bonusSummary,
      audit,
      sustainedRituals,
      weaponBuffs,
      roundTracking,
      activatedEffects,
      ritualCombatSummary,
      isInCampaign,
      syncRitualCast,
      toggleConditionalBonus,
    }),
    [
      character,
      loading,
      state,
      actions,
      bonusSummary,
      audit,
      sustainedRituals,
      weaponBuffs,
      roundTracking,
      activatedEffects,
      ritualCombatSummary,
      isInCampaign,
      syncRitualCast,
      toggleConditionalBonus,
    ]
  );

  return (
    <CharacterSheetContext.Provider value={value}>
      {children}
    </CharacterSheetContext.Provider>
  );
}

// ========================================
// HOOK DE CONSUMO
// ========================================

/**
 * Hook para consumir o contexto da ficha de personagem
 * 
 * @throws Error se usado fora do CharacterSheetProvider
 */
export function useCharacterSheet() {
  const context = useContext(CharacterSheetContext);
  if (!context) {
    throw new Error(
      'useCharacterSheet deve ser usado dentro de um CharacterSheetProvider'
    );
  }
  return context;
}

// Re-exporta tipos
export type {
  CharacterSheetState,
  RollConfig,
  RitualConfig,
  WizardConfig,
  RitualSelectionConfig,
  SelectedAbility,
  ModalType,
  RitualSource,
};
