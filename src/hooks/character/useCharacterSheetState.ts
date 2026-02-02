/**
 * Hook Consolidado de Estado da Ficha de Personagem
 * 
 * Substitui os 50+ useState do CharacterSheet por um único useReducer
 * com actions memoizadas para evitar re-renders desnecessários.
 * 
 * @module hooks/character/useCharacterSheetState
 */

import { useReducer, useMemo, useCallback } from 'react';
import type { DiceRollResult } from '@/lib/dice-roller';
import type { BonusSource } from '@/components/dice/DiceRollModal';
import type { Ritual, RitualEffect, SustainConfig } from '@/lib/rituals/legacy-exports';
import type { ParanormalPower } from '@/lib/paranormal-powers';
import type { RitualCastRecord } from '@/components/character/RitualCastHistory';

// ========================================
// TIPOS DE ESTADO
// ========================================

/** Tipos de modais disponíveis na ficha */
export type ModalType =
  | 'nex'
  | 'ritual'
  | 'ritualSelection'
  | 'edit'
  | 'rest'
  | 'paranormalPower'
  | 'missingSkills'
  | 'intellectSkill'
  | 'elementResistance'
  | 'abilityDetail'
  | 'nonOccultistRitual'
  | 'cast'
  | 'damage'
  | 'resistance'
  | 'condition'
  | 'wizard'
  | 'templateSave'
  | 'excessRituals'
  | 'excessPowers'
  | 'trainingGrade'
  | 'validation'
  | 'dice';

/** Estado de configuração de rolagem */
export interface RollConfig {
  /** Label da rolagem (ex: "Teste de Atletismo") */
  label: string;
  /** Valor do atributo base */
  attribute: number;
  /** Bônus de perícia */
  skillBonus: number;
  /** Bônus de resistência (Fort/Ref/Von) */
  resistanceBonus: number;
  /** Dados extras (ex: Discurso Motivador) */
  extraDice: number;
  /** Fontes de bônus para breakdown */
  bonusSources: BonusSource[];
  /** Atributo sendo testado (para filtrar poderes ativáveis) */
  testedAttribute?: 'strength' | 'agility' | 'vigor' | 'intellect' | 'presence';
}

/** Estado de configuração de ritual */
export interface RitualConfig {
  /** Ritual selecionado para conjuração */
  ritual: Ritual | null;
  /** Aprimoramentos selecionados */
  enhancements: string[];
  /** Custo de PE pendente */
  peCost: number;
  /** Dano pendente (para modal de dano) */
  pendingDamage: number;
  /** Efeito de resistência pendente */
  resistanceEffect: RitualEffect | null;
}

/** Estado do wizard de rituais */
export interface WizardConfig {
  /** Ritual no wizard */
  ritual: Ritual | null;
  /** Aprimoramentos selecionados */
  enhancements: string[];
  /** Custo de PE calculado */
  peCost: number;
}

/** Estado de configuração de resistência */
export interface ResistanceConfig {
  /** Tipo de resistência */
  type: 'fortitude' | 'reflexos' | 'vontade';
  /** DT do teste */
  dt: number;
  /** Dano em caso de falha */
  damageOnFail?: number;
  /** Efeito em caso de sucesso/falha */
  effect?: 'anula' | 'parcial' | 'reduz_metade';
  /** Nome do ritual que causou */
  ritualName?: string;
  /** Elemento do ritual */
  ritualElement?: string;
  /** Círculo do ritual */
  ritualCircle?: number;
  /** Se aplica condições */
  appliesConditions?: boolean;
}

/** Estado de configuração de Grau de Treinamento */
export interface TrainingGradeConfig {
  /** NEX para o qual está configurando (35 ou 70) */
  nex: 35 | 70;
}

/** Estado de seleção de ritual */
export interface RitualSelectionConfig {
  /** Slots de ritual pendentes */
  slots: number;
  /** Círculo máximo disponível */
  maxCircle: number;
}

/** Estado de habilidade selecionada */
export interface SelectedAbility {
  id: string;
  name: string;
  description: string;
  minNex: number;
  classId: string;
}

/** Estado de poder paranormal pendente */
export interface PendingPowerState {
  power: ParanormalPower | null;
}

/** Fonte de ritual para não-ocultistas */
export type RitualSource = 'ritual-aprendido' | 'treinamento' | 'poder-geral' | 'item' | 'habilidade';

/** Estado consolidado da ficha de personagem */
export interface CharacterSheetState {
  /** Mapa de modais abertos */
  modals: Record<ModalType, boolean>;
  
  /** Stats editáveis localmente */
  stats: {
    hp: number;
    pe: number;
    san: number;
  };
  
  /** Configuração de rolagem atual */
  roll: RollConfig;
  
  /** Histórico de rolagens na sessão */
  rollHistory: DiceRollResult[];
  
  /** Configuração de ritual atual */
  ritual: RitualConfig;
  
  /** Configuração do wizard */
  wizard: WizardConfig;
  
  /** Histórico de conjurações na sessão */
  castHistory: RitualCastRecord[];
  
  /** Configuração de seleção de ritual */
  ritualSelection: RitualSelectionConfig;
  
  /** Habilidade selecionada para detalhes */
  selectedAbility: SelectedAbility | null;
  
  /** Poder paranormal pendente (para escolhas) */
  pendingPower: PendingPowerState;
  
  /** Fonte de ritual para não-ocultistas */
  ritualSource: RitualSource;
  
  /** Configuração de Grau de Treinamento */
  trainingGrade: TrainingGradeConfig;
  
  /** Tab inicial do modal de edição */
  editModalInitialTab: string;
  
  /** Flag: já usou Transcender pós-NEX 50 */
  hasTranscendedPost50: boolean;
  
  /** Flag: carregando dados */
  loading: boolean;
  
  /** Flag: salvando dados */
  saving: boolean;
}

// ========================================
// ACTIONS
// ========================================

type CharacterSheetAction =
  | { type: 'OPEN_MODAL'; modal: ModalType }
  | { type: 'CLOSE_MODAL'; modal: ModalType }
  | { type: 'CLOSE_ALL_MODALS' }
  | { type: 'UPDATE_STATS'; stats: Partial<CharacterSheetState['stats']> }
  | { type: 'SET_ROLL_CONFIG'; config: Partial<RollConfig> }
  | { type: 'RESET_ROLL_CONFIG' }
  | { type: 'ADD_ROLL_TO_HISTORY'; roll: DiceRollResult }
  | { type: 'CLEAR_ROLL_HISTORY' }
  | { type: 'SET_RITUAL_CONFIG'; config: Partial<RitualConfig> }
  | { type: 'RESET_RITUAL_CONFIG' }
  | { type: 'SET_WIZARD_CONFIG'; config: Partial<WizardConfig> }
  | { type: 'RESET_WIZARD_CONFIG' }
  | { type: 'ADD_CAST_TO_HISTORY'; cast: RitualCastRecord }
  | { type: 'SET_RITUAL_SELECTION'; config: Partial<RitualSelectionConfig> }
  | { type: 'SET_SELECTED_ABILITY'; ability: SelectedAbility | null }
  | { type: 'SET_PENDING_POWER'; power: ParanormalPower | null }
  | { type: 'SET_RITUAL_SOURCE'; source: RitualSource }
  | { type: 'SET_TRAINING_GRADE_NEX'; nex: 35 | 70 }
  | { type: 'SET_EDIT_MODAL_TAB'; tab: string }
  | { type: 'SET_TRANSCENDED_POST_50'; value: boolean }
  | { type: 'SET_LOADING'; value: boolean }
  | { type: 'SET_SAVING'; value: boolean }
  | { type: 'RESET_STATE' };

// ========================================
// ESTADO INICIAL
// ========================================

const initialRollConfig: RollConfig = {
  label: '',
  attribute: 0,
  skillBonus: 0,
  resistanceBonus: 0,
  extraDice: 0,
  bonusSources: [],
  testedAttribute: undefined,
};

const initialRitualConfig: RitualConfig = {
  ritual: null,
  enhancements: [],
  peCost: 0,
  pendingDamage: 0,
  resistanceEffect: null,
};

const initialWizardConfig: WizardConfig = {
  ritual: null,
  enhancements: [],
  peCost: 0,
};

const initialModals: Record<ModalType, boolean> = {
  nex: false,
  ritual: false,
  ritualSelection: false,
  edit: false,
  rest: false,
  paranormalPower: false,
  missingSkills: false,
  intellectSkill: false,
  elementResistance: false,
  abilityDetail: false,
  nonOccultistRitual: false,
  cast: false,
  damage: false,
  resistance: false,
  condition: false,
  wizard: false,
  templateSave: false,
  excessRituals: false,
  excessPowers: false,
  trainingGrade: false,
  validation: false,
  dice: false,
};

const initialState: CharacterSheetState = {
  modals: { ...initialModals },
  stats: { hp: 0, pe: 0, san: 0 },
  roll: { ...initialRollConfig },
  rollHistory: [],
  ritual: { ...initialRitualConfig },
  wizard: { ...initialWizardConfig },
  castHistory: [],
  ritualSelection: { slots: 0, maxCircle: 1 },
  selectedAbility: null,
  pendingPower: { power: null },
  ritualSource: 'ritual-aprendido',
  trainingGrade: { nex: 35 },
  editModalInitialTab: 'info',
  hasTranscendedPost50: false,
  loading: true,
  saving: false,
};

// ========================================
// REDUCER
// ========================================

function characterSheetReducer(
  state: CharacterSheetState,
  action: CharacterSheetAction
): CharacterSheetState {
  switch (action.type) {
    case 'OPEN_MODAL':
      return {
        ...state,
        modals: { ...state.modals, [action.modal]: true },
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        modals: { ...state.modals, [action.modal]: false },
      };

    case 'CLOSE_ALL_MODALS':
      return {
        ...state,
        modals: { ...initialModals },
      };

    case 'UPDATE_STATS':
      return {
        ...state,
        stats: { ...state.stats, ...action.stats },
      };

    case 'SET_ROLL_CONFIG':
      return {
        ...state,
        roll: { ...state.roll, ...action.config },
      };

    case 'RESET_ROLL_CONFIG':
      return {
        ...state,
        roll: { ...initialRollConfig },
      };

    case 'ADD_ROLL_TO_HISTORY':
      return {
        ...state,
        rollHistory: [action.roll, ...state.rollHistory].slice(0, 50),
      };

    case 'CLEAR_ROLL_HISTORY':
      return {
        ...state,
        rollHistory: [],
      };

    case 'SET_RITUAL_CONFIG':
      return {
        ...state,
        ritual: { ...state.ritual, ...action.config },
      };

    case 'RESET_RITUAL_CONFIG':
      return {
        ...state,
        ritual: { ...initialRitualConfig },
      };

    case 'SET_WIZARD_CONFIG':
      return {
        ...state,
        wizard: { ...state.wizard, ...action.config },
      };

    case 'RESET_WIZARD_CONFIG':
      return {
        ...state,
        wizard: { ...initialWizardConfig },
      };

    case 'ADD_CAST_TO_HISTORY':
      return {
        ...state,
        castHistory: [action.cast, ...state.castHistory].slice(0, 100),
      };

    case 'SET_RITUAL_SELECTION':
      return {
        ...state,
        ritualSelection: { ...state.ritualSelection, ...action.config },
      };

    case 'SET_SELECTED_ABILITY':
      return {
        ...state,
        selectedAbility: action.ability,
      };

    case 'SET_PENDING_POWER':
      return {
        ...state,
        pendingPower: { power: action.power },
      };

    case 'SET_RITUAL_SOURCE':
      return {
        ...state,
        ritualSource: action.source,
      };

    case 'SET_TRAINING_GRADE_NEX':
      return {
        ...state,
        trainingGrade: { nex: action.nex },
      };

    case 'SET_EDIT_MODAL_TAB':
      return {
        ...state,
        editModalInitialTab: action.tab,
      };

    case 'SET_TRANSCENDED_POST_50':
      return {
        ...state,
        hasTranscendedPost50: action.value,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.value,
      };

    case 'SET_SAVING':
      return {
        ...state,
        saving: action.value,
      };

    case 'RESET_STATE':
      return { ...initialState };

    default:
      return state;
  }
}

// ========================================
// HOOK PRINCIPAL
// ========================================

/**
 * Hook consolidado de estado da ficha de personagem
 * 
 * Gerencia todos os estados de UI da ficha (modais, rolagens, rituais)
 * em um único useReducer para melhor performance e manutenibilidade.
 * 
 * @param initialStats - Stats iniciais do personagem (HP, PE, SAN)
 * @returns Estado consolidado e actions memoizadas
 */
export function useCharacterSheetState(initialStats?: {
  hp: number;
  pe: number;
  san: number;
}) {
  // Cria estado inicial com stats do personagem se fornecidos
  const [state, dispatch] = useReducer(
    characterSheetReducer,
    initialStats
      ? { ...initialState, stats: initialStats }
      : initialState
  );

  // ========================================
  // ACTIONS MEMOIZADAS
  // ========================================

  const actions = useMemo(
    () => ({
      // Modais
      openModal: (modal: ModalType) => dispatch({ type: 'OPEN_MODAL', modal }),
      closeModal: (modal: ModalType) => dispatch({ type: 'CLOSE_MODAL', modal }),
      closeAllModals: () => dispatch({ type: 'CLOSE_ALL_MODALS' }),

      // Stats
      updateStats: (stats: Partial<CharacterSheetState['stats']>) =>
        dispatch({ type: 'UPDATE_STATS', stats }),

      // Rolagem
      setRollConfig: (config: Partial<RollConfig>) =>
        dispatch({ type: 'SET_ROLL_CONFIG', config }),
      resetRollConfig: () => dispatch({ type: 'RESET_ROLL_CONFIG' }),
      addRollToHistory: (roll: DiceRollResult) =>
        dispatch({ type: 'ADD_ROLL_TO_HISTORY', roll }),
      clearRollHistory: () => dispatch({ type: 'CLEAR_ROLL_HISTORY' }),

      // Rituais
      setRitualConfig: (config: Partial<RitualConfig>) =>
        dispatch({ type: 'SET_RITUAL_CONFIG', config }),
      resetRitualConfig: () => dispatch({ type: 'RESET_RITUAL_CONFIG' }),
      addCastToHistory: (cast: RitualCastRecord) =>
        dispatch({ type: 'ADD_CAST_TO_HISTORY', cast }),

      // Wizard
      setWizardConfig: (config: Partial<WizardConfig>) =>
        dispatch({ type: 'SET_WIZARD_CONFIG', config }),
      resetWizardConfig: () => dispatch({ type: 'RESET_WIZARD_CONFIG' }),

      // Seleção de ritual
      setRitualSelection: (config: Partial<RitualSelectionConfig>) =>
        dispatch({ type: 'SET_RITUAL_SELECTION', config }),

      // Habilidade
      setSelectedAbility: (ability: SelectedAbility | null) =>
        dispatch({ type: 'SET_SELECTED_ABILITY', ability }),

      // Poder pendente
      setPendingPower: (power: ParanormalPower | null) =>
        dispatch({ type: 'SET_PENDING_POWER', power }),

      // Fonte de ritual
      setRitualSource: (source: RitualSource) =>
        dispatch({ type: 'SET_RITUAL_SOURCE', source }),

      // Grau de treinamento
      setTrainingGradeNex: (nex: 35 | 70) =>
        dispatch({ type: 'SET_TRAINING_GRADE_NEX', nex }),

      // Outros
      setEditModalTab: (tab: string) =>
        dispatch({ type: 'SET_EDIT_MODAL_TAB', tab }),
      setTranscendedPost50: (value: boolean) =>
        dispatch({ type: 'SET_TRANSCENDED_POST_50', value }),
      setLoading: (value: boolean) =>
        dispatch({ type: 'SET_LOADING', value }),
      setSaving: (value: boolean) =>
        dispatch({ type: 'SET_SAVING', value }),
      resetState: () => dispatch({ type: 'RESET_STATE' }),
    }),
    []
  );

  // ========================================
  // HELPERS DE CONVENIÊNCIA
  // ========================================

  /**
   * Abre o modal de rolagem de dados com configuração
   */
  const openDiceRoll = useCallback(
    (config: Partial<RollConfig>) => {
      dispatch({ type: 'SET_ROLL_CONFIG', config });
      dispatch({ type: 'OPEN_MODAL', modal: 'dice' });
    },
    []
  );

  /**
   * Abre o modal de conjuração de ritual
   */
  const openRitualCast = useCallback(
    (ritual: Ritual) => {
      dispatch({ type: 'SET_RITUAL_CONFIG', config: { ritual } });
      dispatch({ type: 'OPEN_MODAL', modal: 'cast' });
    },
    []
  );

  /**
   * Abre o wizard de efeitos de ritual
   */
  const openRitualWizard = useCallback(
    (ritual: Ritual, enhancements: string[] = [], peCost: number = 0) => {
      dispatch({
        type: 'SET_WIZARD_CONFIG',
        config: { ritual, enhancements, peCost },
      });
      dispatch({ type: 'OPEN_MODAL', modal: 'wizard' });
    },
    []
  );

  /**
   * Abre o modal de detalhes de habilidade
   */
  const openAbilityDetail = useCallback(
    (ability: SelectedAbility) => {
      dispatch({ type: 'SET_SELECTED_ABILITY', ability });
      dispatch({ type: 'OPEN_MODAL', modal: 'abilityDetail' });
    },
    []
  );

  /**
   * Abre o modal de Grau de Treinamento
   */
  const openTrainingGrade = useCallback(
    (nex: 35 | 70) => {
      dispatch({ type: 'SET_TRAINING_GRADE_NEX', nex });
      dispatch({ type: 'OPEN_MODAL', modal: 'trainingGrade' });
    },
    []
  );

  return {
    state,
    actions,
    // Helpers
    openDiceRoll,
    openRitualCast,
    openRitualWizard,
    openAbilityDetail,
    openTrainingGrade,
  };
}

// Re-exporta tipos úteis
export type { DiceRollResult, BonusSource, Ritual };
