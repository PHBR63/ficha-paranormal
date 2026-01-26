/**
 * MobileCharacterSheet - Versão compacta da ficha para dispositivos móveis
 * Usa abas deslizantes e layout otimizado para telas pequenas
 * Inclui sistema de auditoria automática integrado
 * 
 * IDs centralizados em: src/lib/constants/game-ids.ts
 * NOTA: O mapeamento de perícias aceita nomes com acentos para compatibilidade
 * 
 * REFATORADO: Usa componentes extraídos de ./mobile para melhor manutenção
 * PARIDADE COMPLETA: Mesmas funcionalidades do desktop
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, 
  Package,
  ChevronRight,
  Edit2,
  Trash2,
  History,
} from 'lucide-react';
import { useCampaignRitualSync } from '@/hooks/useCampaignRitualSync';
import type { RitualCastRecord } from './mobile/MobileRitualCastHistory';
import { MobileInventorySheet } from '@/components/inventory/MobileInventorySheet';
import type { ExtendedInventoryItem } from '@/components/inventory/InventoryPanel';
import { hasInventarioOtimizado, calculateCarryCapacity } from '@/lib/inventory-system';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ORIGINS, getTrackById, getSkillBonus, getTrainingLabel } from '@/lib/character-data';
import { PowerDetailModal, PowerDetailData } from './PowerDetailModal';
import { ALL_RITUALS, getActiveRitualEffect, Ritual, SustainConfig } from '@/lib/rituals/legacy-exports';
import { 
  useDefenseBonuses, 
  useBonusSummaryFromSUE, 
  useRitualBonusesFromSUE, 
  useSustainedRituals,
  useCharacterAudit,
  useAttributeValidation,
  logAttributeDiagnostics,
} from '@/hooks';
import { MobileAuditBanner } from './MobileAuditBanner';
import { ExcessPowersRemovalModal } from './ExcessPowersRemovalModal';
import { ExcessRitualsRemovalModal } from './ExcessRitualsRemovalModal';
import { RemovedPowersHistory } from './RemovedPowersHistory';
import { IncompleteDataBanner } from './IncompleteDataBanner';
import { getOcultistRituals } from '@/lib/character-data';
// useCharacterAudit já importado acima
import { CharacterForAudit, getMaxParanormalPowers } from '@/lib/character-audit-engine';
import { useAuth } from '@/contexts/AuthContext';
import { TRAINING_GRADE_KEYS } from '@/lib/constants/game-ids';
import { supabase } from '@/integrations/supabase/client';
import { SavedParanormalPower, PARANORMAL_POWERS, ParanormalElement } from '@/lib/paranormal-powers';
// useAttributeValidation já importado acima
// Modais de paridade desktop
import { NexProgressionModal } from './NexProgressionModal';
import { CharacterEditModal } from './CharacterEditModal';
import { CharacterHistoryPanel, logCharacterChanges } from './CharacterHistoryPanel';
import { RestModal } from './RestModal';
import { AbilityDetailModal } from './AbilityDetailModal';
import { RitualSelectionModal } from './RitualSelectionModal';
import { MissingSkillsFixModal } from './MissingSkillsFixModal';
import { NonOccultistRitualModal, RitualSource } from './NonOccultistRitualModal';
import { IntellectSkillSelectModal } from './IntellectSkillSelectModal';
import { 
  OriginWeaponBindingModal, 
  originRequiresWeaponBinding,
  type BindableWeapon,
} from './OriginWeaponBindingModal';
import { ElementResistanceSelectModal } from './ElementResistanceSelectModal';
import { TrainingGradeSelectModal, type TrainingGradeResult, type SkillUpgradeChoice, applyTrainingGradeUpgrades } from './TrainingGradeSelectModal';
import { BonusSummaryCard } from './BonusSummaryCard';
import { ClassPowerBonusesPanel } from './ClassPowerBonusesPanel';
import { useAutoConditions } from '@/hooks/useAutoConditions';
import { calculateDerivedStats, countTranscender, CLASSES } from '@/lib/character-data';
import { getPowerById, ParanormalPower } from '@/lib/paranormal-powers';
import { hasUsedTranscenderPostNex50, hasParanormalPowersFromTranscender } from '@/lib/transcender-system';
import { MobileRitualEffectWizard } from './mobile/MobileRitualEffectWizard';
import type { WeaponBuff } from '@/hooks/useWeaponBuffs';
import { getActivatablePowersForCharacter } from '@/lib/class-powers/activatable-powers-bridge';
import { usePrimeiraImpressao, isEligibleForPrimeiraImpressao } from '@/hooks/usePrimeiraImpressao';

// Componentes mobile extraídos e memoizados
import {
  MobileOverviewTab,
  MobileSkillsTab,
  MobilePowersTab,
  MobileTabNavigation,
  MobileCollapsibleSection,
  MobileCombatPanel,
  MobileCombatRollModal,
  MobileDiceRollModal,
  MobileRitualCastModal,
  MobileResistanceCheckModal,
  useRollHistory,
  // Componentes de paridade desktop/mobile
  MobileConditionManager,
  MobileSustainedRitualsPanel,
  MobileConditionalBonusesPanel,
  MobileAffinitySelectorCard,
  MobileRitualCastHistory,
  MobileActiveEffectsPanel,
  MobileParanormalPowerSelectModal,
  MobileTrackPassiveEffectsWidget,
  MobileSUEDebugPanel,
  // Trilhas do Combatente (unificadas)
  MobileLeadershipPanel,
  MobileGuerreiroPanel,
  MobileOperacoesEspeciaisPanel,
  MobileTropaDeChoquePanel,
  MobileAniquiladorPanel,
  // Trilhas do Especialista (unificadas)
  MobileAtiradorDeElitePanel,
  MobileInfiltradorPanel,
  MobileMedicoDeCampoPanel,
  MobileNegociadorPanel,
  MobileTecnicoPanel,
  // Trilhas do Ocultista (unificadas)
  MobileConduitePanel,
  MobileFlageladorPanel,
  MobileGraduadoPanel,
  MobileIntuitivoPanel,
  MobileLaminaParanormalPanel,
  // Tipos
  type WeaponEntry,
  type BonusSource,
  type ActiveCondition,
} from './mobile';
import { SUEDevToolsPanel } from '@/components/dev';

// Utilitários compartilhados
import {
  getSkillAttributeAbbrev,
  getItemIcon,
} from './mobile/utils';

// Inferência de tipo de arma (corrige pistola como corpo a corpo)
import { normalizeWeaponTypeForDisplay } from '@/lib/weapon-type-inference';
import { VersatilityAbilityCard } from './VersatilityAbilityCard';

import { useWeaponBuffs, useUnifiedEffects, useRoundTracking, useActivatedEffects } from '@/hooks';

// Tipos
interface MobileCharacterSheetProps {
  character: {
    id: string;
    name: string;
    class: string;
    class_track?: string | null;
    origin: string;
    nex: number;
    patent: string;
    photo_url?: string | null;
    hp_current: number;
    hp_max: number;
    pe_current: number;
    pe_max: number;
    san_current: number;
    san_max: number;
    defense: number;
    movement: number;
    agility: number;
    strength: number;
    intellect: number;
    presence: number;
    vigor: number;
    conditions: string[];
    abilities: string[];
    powers: Array<{ name: string; description: string }>;
    rituals: string[];
    skills?: Record<string, number>;
    // Novos campos para exibição completa
    paranormal_powers?: Array<{ id: string; name: string; element: string; description: string }>;
    general_powers?: Array<{ id: string; name: string; description: string; category?: string }>;
    // Inventário com todos os campos de armas, armaduras e itens para inferência correta de tipo
    inventory?: Array<{
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
      weaponType?: string;
      proficiency?: string;
      properties?: string[];
      // Campos de armaduras
      armorType?: string;
      defenseBonus?: number;
      rd?: number;
      agilityPenalty?: number;
      speedPenalty?: number;
      // Campos de consumíveis
      effect?: string;
      uses?: number;
      maxUses?: number;
      consumable?: boolean;
      // Campos de redução de categoria
      favoriteAbilityId?: string;
      effectiveCategory?: string;
    }>;
    // Bônus condicionais ativos (persistidos no banco)
    active_conditional_bonuses?: string[];
    // Campos de afinidade elemental
    elemental_affinity?: string | null;
    affinity_active?: boolean;
    // Buffs ativos em armas
    active_buffs?: Array<{ weaponId: string; buffType: string; turnsRemaining: number }>;
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
  };
  onOpenDiceRoller: () => void;
  onOpenRest: () => void;
  onLevelUp: () => void;
  onEditStats: () => void;
  onOpenSkills?: () => void;
  onOpenInventory?: () => void;
  // Callback para toggle de bônus condicionais
  onToggleConditionalBonus?: (bonusId: string, active: boolean) => void;
  // Callback para atualizar dados após correções automáticas
  onRefetch?: () => Promise<void> | void;
  // Callback para seleção de afinidade
  onSelectAffinity?: (element: string) => Promise<void>;
  // Callback para adicionar poderes paranormais (Transcender)
  onAddParanormalPower?: (power: { id: string; name: string; element: string; description: string }) => Promise<void>;
  // Campaign ID para sincronização de rituais
  campaignId?: string | null;
}

// Tab de navegação mobile
type MobileTab = 'overview' | 'skills' | 'powers' | 'inventory';

// Componente principal
export function MobileCharacterSheet({
  character,
  onOpenDiceRoller,
  onOpenRest,
  onLevelUp,
  onEditStats,
  onToggleConditionalBonus,
  onRefetch,
  onSelectAffinity,
  onAddParanormalPower,
  campaignId,
}: MobileCharacterSheetProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('overview');
  const [powerModalOpen, setPowerModalOpen] = useState(false);
  const [selectedPower, setSelectedPower] = useState<PowerDetailData | null>(null);
  const [excessPowersModalOpen, setExcessPowersModalOpen] = useState(false);
  const [excessRitualsModalOpen, setExcessRitualsModalOpen] = useState(false);
  const [removedPowersHistoryOpen, setRemovedPowersHistoryOpen] = useState(false);
  const [inventorySheetOpen, setInventorySheetOpen] = useState(false);
  
  // Estados dos modais de combate mobile
  const [combatModalOpen, setCombatModalOpen] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponEntry | null>(null);
  const [diceModalOpen, setDiceModalOpen] = useState(false);
  const [diceModalConfig, setDiceModalConfig] = useState<{
    skillName: string;
    pool: number;
    bonus: number;
    bonusSources: BonusSource[];
  } | null>(null);
  const [ritualCastModalOpen, setRitualCastModalOpen] = useState(false);
  const [selectedRitual, setSelectedRitual] = useState<typeof ALL_RITUALS[number] | null>(null);
  const [resistanceModalOpen, setResistanceModalOpen] = useState(false);
  const [resistanceConfig, setResistanceConfig] = useState<{
    type: 'fortitude' | 'reflexos' | 'vontade';
    dt: number;
    damageOnFail?: number;
    effect?: 'anula' | 'parcial' | 'reduz_metade';
    ritualName?: string;
    ritualElement?: string;
    ritualCircle?: number;
    appliesConditions?: boolean;
  } | null>(null);
  
  // Estados dos novos componentes de paridade desktop/mobile
  const [paranormalPowerModalOpen, setParanormalPowerModalOpen] = useState(false);
  const [ritualHistoryOpen, setRitualHistoryOpen] = useState(false);
  
  // Histórico de rituais conjurados na sessão (paridade com desktop)
  const [castHistory, setCastHistory] = useState<RitualCastRecord[]>([]);
  
  // ========== NOVOS ESTADOS PARA PARIDADE COMPLETA DESKTOP ==========
  
  // Modais essenciais
  const [nexModalOpen, setNexModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalInitialTab, setEditModalInitialTab] = useState('info');
  const [restModalOpen, setRestModalOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  
  // Modal de correção de perícias faltantes (auditoria)
  const [missingSkillsModalOpen, setMissingSkillsModalOpen] = useState(false);
  
  // Modal de rituais (pós-progressão para Ocultistas)
  const [ritualModalOpen, setRitualModalOpen] = useState(false);
  const [pendingRitualSlots, setPendingRitualSlots] = useState(0);
  const [pendingMaxCircle, setPendingMaxCircle] = useState(1);
  
  // Modais de poderes paranormais e escolhas
  const [intellectSkillModalOpen, setIntellectSkillModalOpen] = useState(false);
  const [elementResistanceModalOpen, setElementResistanceModalOpen] = useState(false);
  const [pendingPower, setPendingPower] = useState<ParanormalPower | null>(null);
  
  // Modal de Grau de Treinamento (NEX 35% e 70%)
  const [trainingGradeModalOpen, setTrainingGradeModalOpen] = useState(false);
  const [trainingGradeNex, setTrainingGradeNex] = useState<35 | 70>(35);
  
  // Estado para verificar se personagem já usou Transcender em NEX >= 50
  // (necessário para determinar se deve exibir seletor de afinidade elemental)
  const [hasTranscendedPost50, setHasTranscendedPost50] = useState(false);
  
  // Modal de rituais para não-ocultistas
  const [nonOccultistRitualModalOpen, setNonOccultistRitualModalOpen] = useState(false);
  const [ritualModalSource, setRitualModalSource] = useState<RitualSource>('ritual-aprendido');
  
  // Modal de detalhes de habilidade de classe
  const [abilityDetailOpen, setAbilityDetailOpen] = useState(false);
  const [selectedAbility, setSelectedAbility] = useState<{
    id: string;
    name: string;
    description: string;
    minNex: number;
    classId: string;
  } | null>(null);
  
  // Wizard de efeitos de rituais
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardRitual, setWizardRitual] = useState<Ritual | null>(null);
  const [wizardEnhancements, setWizardEnhancements] = useState<string[]>([]);
  
  // Modal de seleção de arma para origens (Operário - Ferramenta de Trabalho)
  const [originWeaponModalOpen, setOriginWeaponModalOpen] = useState(false);
  const [wizardPeCost, setWizardPeCost] = useState(0);
  
  // Estado para rastrear qual atributo está sendo testado (paridade com desktop - ativação de poderes)
  const [rollTestedAttribute, setRollTestedAttribute] = useState<'agility' | 'intellect' | 'strength' | 'presence' | 'vigor' | undefined>(undefined);
  
  // Estado local de stats para edição
  const [localHpCurrent, setLocalHpCurrent] = useState(character.hp_current);
  const [localPeCurrent, setLocalPeCurrent] = useState(character.pe_current);
  const [localSanCurrent, setLocalSanCurrent] = useState(character.san_current);
  
  // Hook de histórico de rolagens
  const { rolls: rollHistory, addRoll, removeRoll, clearHistory } = useRollHistory();
  
  const originData = ORIGINS.find(o => o.id === character.origin);
  const trackData = character.class_track ? getTrackById(character.class_track) : null;

  // Validação de atributos - detecta dados incompletos
  const attributeValidation = useAttributeValidation({
    agility: character.agility,
    strength: character.strength,
    intellect: character.intellect,
    presence: character.presence,
    vigor: character.vigor,
  });

  // Log de diagnóstico quando atributos estão inválidos (apenas em desenvolvimento)
  useEffect(() => {
    if (!attributeValidation.isValid) {
      logAttributeDiagnostics(
        character.id,
        character.name,
        {
          agility: character.agility,
          strength: character.strength,
          intellect: character.intellect,
          presence: character.presence,
          vigor: character.vigor,
        },
        'MobileCharacterSheet'
      );
    }
  }, [attributeValidation.isValid, character]);

  // Hook centralizado de tracking de uso por rodada (habilidades 1x/rodada)
  const roundTracking = useRoundTracking();
  
  // Hook de efeitos ativados para integração com SUE - com persistência no banco
  const activatedEffects = useActivatedEffects({
    characterId: character?.id,
    enablePersistence: !!character
  });

  // Bônus de dados extras (Discurso Motivador: +1d20 ou +2d20)
  const globalDiceBonus = useMemo(() => {
    const discursoEffect = activatedEffects.activatedEffects.find(
      e => e.id === 'track-discurso-motivador'
    );
    if (discursoEffect) {
      return (discursoEffect.metadata?.diceBonus as number) ?? 1;
    }
    return 0;
  }, [activatedEffects.activatedEffects]);
  const { user } = useAuth();

  // Calcula limite de poderes paranormais
  const powerLimits = useMemo(() => 
    getMaxParanormalPowers(character.nex, character.origin), 
    [character.nex, character.origin]
  );
  const hasExcessPowers = (character.paranormal_powers?.length || 0) > powerLimits.total;
  
  // Estado para armazenar contagem de slots de NEX usados (tabela character_power_choices)
  // Distingue entre: slots usados para Transcender e slots usados para Poderes de Classe
  const [transcenderUsedFromDB, setTranscenderUsedFromDB] = useState(0);
  const [totalSlotsUsedFromDB, setTotalSlotsUsedFromDB] = useState(0);
  const [syncingPowerChoices, setSyncingPowerChoices] = useState(false);
  
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

  // Verifica se personagem já usou Transcender em NEX >= 50
  // Isso determina se o seletor de afinidade elemental deve aparecer
  useEffect(() => {
    const checkTranscenderPost50 = async () => {
      // Só precisa verificar se NEX >= 50 e ainda não tem afinidade
      if (character.nex < 50 || character.elemental_affinity) {
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
  }, [character.id, character.nex, character.elemental_affinity, character.paranormal_powers]);
  const ritualLimits = useMemo(() => {
    if (character.class !== 'Ocultista') return null;
    return getOcultistRituals(character.nex);
  }, [character.class, character.nex]);

  // Extrai grupos de armas escolhidos em Especialista em Arma para indicadores visuais
  const especialistaArmaGroups = useMemo(() => {
    const choices = character.class_power_choices;
    if (!choices) return [];
    
    // Encontrar a escolha de especialista-arma
    const especialistaChoice = Object.values(choices).find(
      (choice) => choice.powerId === 'especialista-arma'
    );
    
    return especialistaChoice?.chosenValues || [];
  }, [character.class_power_choices]);

  const hasExcessRituals = ritualLimits
    ? character.rituals.length > ritualLimits.count 
    : false;

  // Preparar dados para auditoria
  const characterForAudit: CharacterForAudit | null = useMemo(() => ({
    id: character.id,
    name: character.name,
    class: character.class,
    origin: character.origin,
    nex: character.nex,
    hp_max: character.hp_max,
    pe_max: character.pe_max,
    san_max: character.san_max,
    defense: character.defense,
    agility: character.agility,
    strength: character.strength,
    vigor: character.vigor,
    intellect: character.intellect,
    presence: character.presence,
    paranormal_powers: character.paranormal_powers || [],
    general_powers: character.general_powers || [],
    skills: character.skills || {},
    abilities: character.abilities || [],
    inventory: character.inventory || [],
  }), [character]);

  // useAuth já foi chamado acima para sincronização de power choices

  // Hook de auditoria automática com callback para atualizar UI
  const {
    auditResult,
    isAuditing,
    isFixing,
    visibleIssues,
    counts,
    runAudit,
    applyAutoFixes,
    dismissIssue,
  } = useCharacterAudit(characterForAudit, user?.id || null, { 
    autoRun: true,
    autoFixCritical: true,
    onFixComplete: onRefetch,
  });

  // Calcular bônus de defesa de origem, habilidades de classe e poderes gerais
  // Usa optional chaining para proteção durante carregamento
  const defenseBonuses = useDefenseBonuses({
    origin: character?.origin || '',
    abilities: character?.abilities || [],
    generalPowers: character?.general_powers || [],
    inventory: character?.inventory || [],
  });

  // Hook reativo de rituais sustentados (com realtime para defesa)
  const { 
    rituals: sustainedRituals,
    activateRitual,
    deactivateRitual,
    deactivateByRitualId,
    clearAll: clearSustainedRituals,
  } = useSustainedRituals({
    characterId: character?.id,
    enabled: !!character,
  });
  
  // Hook de aplicação automática de condições (paridade desktop)
  const { processResourceChange } = useAutoConditions();
  
  // Hook para rastrear "Primeira Impressão" do Especialista (paridade desktop)
  // Concede +1d20 no primeiro teste de Diplomacia, Enganação, Intimidação ou Intuição da cena
  const primeiraImpressao = usePrimeiraImpressao({
    classPowers: character.powers?.map(p => p.name) || [],
    abilities: character.abilities || [],
    characterClass: character.class,
  });
  
  // Handler para salvar buffs de armas na nuvem
  const handleWeaponBuffsChange = useCallback(async (buffs: WeaponBuff[]) => {
    if (!character) return;
    
    const { error } = await supabase
      .from('characters')
      .update({ active_buffs: JSON.parse(JSON.stringify(buffs)) })
      .eq('id', character.id);

    if (error) {
      console.error('Erro ao salvar buffs:', error);
    }
  }, [character?.id]);
  
  // Hook de buffs de armas com persistência
  const {
    activeBuffs: weaponBuffs,
    addBuff: addWeaponBuff,
    addBuffWithDuration: addWeaponBuffWithDuration,
    removeBuff: removeWeaponBuff,
    clearAllBuffs: clearWeaponBuffs,
    advanceTurn: advanceWeaponBuffTurn,
  } = useWeaponBuffs(character.id, (character.active_buffs as unknown as WeaponBuff[]) || undefined, handleWeaponBuffsChange);

  // Converte rituais sustentados para formato de defesa
  const activeRitualsForDefense = useMemo(() => 
    sustainedRituals.map(r => ({
      ritualId: r.ritualId,
      ritualName: r.ritualName,
      enhancements: r.selectedEnhancements,
    })),
    [sustainedRituals]
  );

  // Hook SUE como fonte única de verdade para todos os bônus
  // Usa optional chaining para proteção durante carregamento
  const bonusSummary = useBonusSummaryFromSUE({
    origin: character?.origin || '',
    abilities: character?.abilities || [],
    generalPowers: character?.general_powers || [],
    paranormalPowers: character?.paranormal_powers || [],
    inventory: character?.inventory || [],
    nex: character?.nex || 5,
    elementalAffinity: character?.elemental_affinity,
    affinityActive: character?.affinity_active ?? false,
    activeConditionalBonuses: character?.active_conditional_bonuses || [],
    activeRituals: activeRitualsForDefense,
    skills: character?.skills || {},
    intellect: character?.intellect || 1,
    vigor: character?.vigor || 1,
    strength: character?.strength || 1,
    agility: character?.agility || 1,
    presence: character?.presence || 1,
    classId: character?.class,
    classTrack: character?.class_track,
    classPowers: character?.powers?.map(p => p.name) || [],
    activeConditions: character?.conditions || [],
    // Novos campos para bônus condicionais do SUE
    hpCurrent: localHpCurrent,
    hpMax: character?.hp_max || 0,
    peCurrent: localPeCurrent,
    peMax: character?.pe_max || 0,
  });

  // Sincroniza conjurações de rituais com a campanha em tempo real (paridade com desktop)
  const { 
    isInCampaign, 
    syncRitualCast,
  } = useCampaignRitualSync({
    characterId: character?.id || '',
    userId: user?.id || '',
    enabled: !!character,
  });

  // Defesa total com TODOS os bônus (origem, habilidades, poderes, paranormais, rituais)
  const totalDefense = character.defense + bonusSummary.defense.total;

  // Calcula penalidade de deslocamento de armaduras equipadas (paridade com desktop)
  const armorSpeedPenalty = useMemo(() => {
    const equippedArmors = (character.inventory || [])
      .filter(item => item.isEquipped && item.itemType === 'armor' && item.armorType !== 'escudo');
    return equippedArmors.reduce((sum, armor) => sum + (armor.speedPenalty || 0), 0);
  }, [character.inventory]);

  // Detecta automaticamente Inventário Otimizado (Técnico NEX 10%+) e calcula carga
  const inventoryLoadStatus = useMemo(() => {
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
      intellect: hasInvOtimizado ? character.intellect : undefined,
    };
  }, [character.inventory, character.strength, character.intellect, character.class_track, character.abilities, character.nex]);

  // Handler para abrir modal de detalhes do poder
  const handlePowerClick = useCallback((power: PowerDetailData) => {
    setSelectedPower(power);
    setPowerModalOpen(true);
  }, []);

  // Buscar dados completos do ritual pelo nome (usado pelos modais)
  const getRitualData = useCallback((ritualName: string) => {
    return ALL_RITUALS.find(r => r.name === ritualName || r.id === ritualName);
  }, []);

  // Handler para atualização de inventário no mobile
  const handleInventoryChange = useCallback(async (newInventory: ExtendedInventoryItem[]) => {
    try {
      const inventoryJson = newInventory.map(item => ({ ...item }));
      
      await supabase
        .from('characters')
        .update({ inventory: inventoryJson as unknown as import('@/integrations/supabase/types').Json })
        .eq('id', character.id);
      
      if (onRefetch) {
        await onRefetch();
      }
    } catch (error) {
      console.error('Erro ao atualizar inventário:', error);
    }
  }, [character.id, onRefetch]);

  // Normaliza o inventário para ExtendedInventoryItem[]
  // IMPORTANTE: Propaga TODOS os campos de armas, armaduras e itens para inferência correta de tipo
  const normalizedInventory: ExtendedInventoryItem[] = useMemo(() => 
    (character.inventory || []).map(item => ({
      id: item.id || crypto.randomUUID(),
      name: item.name,
      category: item.category as '0' | 'I' | 'II' | 'III' | 'IV',
      slots: item.slots || 1,
      quantity: item.quantity || 1,
      itemType: (item.itemType as 'weapon' | 'armor' | 'consumable' | 'misc') || 'misc',
      isEquipped: item.isEquipped,
      equipSlot: item.equipSlot as any,
      description: item.description,
      // ARMAS - Campos essenciais para inferência de tipo
      damage: item.damage,
      damageType: item.damageType,
      critical: item.critical,
      criticalMultiplier: item.criticalMultiplier,
      range: item.range,
      special: item.special,
      ammoType: item.ammoType,
      weaponType: item.weaponType,
      proficiency: item.proficiency,
      properties: item.properties,
      // ARMADURAS
      armorType: item.armorType as any,
      defenseBonus: item.defenseBonus,
      rd: item.rd,
      agilityPenalty: item.agilityPenalty,
      speedPenalty: item.speedPenalty,
      // CONSUMÍVEIS
      effect: item.effect,
      uses: item.uses,
      maxUses: item.maxUses,
      consumable: item.consumable,
      // REDUÇÃO DE CATEGORIA
      favoriteAbilityId: item.favoriteAbilityId,
      effectiveCategory: item.effectiveCategory as any,
    })),
  [character.inventory]);

  // Hook de buffs de armas já declarado acima com persistência

  // Hook de efeitos unificados (SUE) - conversão segura de tipos
  const paranormalPowersForSUE = useMemo(() => 
    (character.paranormal_powers || []).map(p => ({
      ...p,
      element: p.element as "sangue" | "morte" | "conhecimento" | "energia" | "generic",
    })),
    [character.paranormal_powers]
  );

  const activeRitualsForSUE = useMemo(() => 
    sustainedRituals.map(r => ({
      ritualId: r.ritualId,
      ritualName: r.ritualName,
      element: r.element,
      circle: r.circle,
      enhancements: r.selectedEnhancements,
    })),
    [sustainedRituals]
  );

  const unifiedEffects = useUnifiedEffects({
    origin: character.origin,
    classId: character.class,
    classTrack: character.class_track || null,
    nex: character.nex,
    attributes: {
      strength: character.strength,
      agility: character.agility,
      vigor: character.vigor,
      intellect: character.intellect,
      presence: character.presence,
    },
    conditions: character.conditions || [],
    activeRituals: activeRitualsForSUE,
    paranormalPowers: paranormalPowersForSUE,
  });
  
  // Hook de bônus de rituais derivado do SUE (DT, dano, redução de PE)
  const ritualBonuses = useRitualBonusesFromSUE(unifiedEffects, {
    intellect: character.intellect,
    vigor: character.vigor,
    strength: character.strength,
    agility: character.agility,
    presence: character.presence,
  });

  // Lista de armas equipadas para o painel de combate
  // Usa normalizeWeaponTypeForDisplay para inferir corretamente o tipo de arma
  const equippedWeapons: WeaponEntry[] = useMemo(() => {
    return normalizedInventory
      .filter(item => item.itemType === 'weapon' && item.isEquipped)
      .map(item => {
        const weaponData = (item as any);
        // Usa inferência inteligente para classificar a arma corretamente
        const displayType = normalizeWeaponTypeForDisplay({
          weaponType: weaponData.weaponType,
          ammoType: weaponData.ammoType,
          range: weaponData.range,
          properties: weaponData.properties,
          damageType: weaponData.damageType,
        });
        
        // Detecta se a arma é a favorita do Aniquilador
        const isFavoriteWeapon = !!(weaponData.favoriteAbilityId);
        
        // Normaliza criticalMultiplier para string (ex: 'x2', 'x3')
        const normalizedCritMultiplier = typeof weaponData.criticalMultiplier === 'number'
          ? `x${weaponData.criticalMultiplier}`
          : weaponData.criticalMultiplier || 'x2';
        
        return {
          id: item.id,
          name: item.name,
          type: displayType,
          damage: weaponData.damage || '1d6',
          damageType: weaponData.damageType, // Tipo de dano (Balístico, Corte, etc.)
          criticalRange: weaponData.criticalRange || 20,
          criticalMultiplier: normalizedCritMultiplier,
          range: weaponData.range,
          ammo: weaponData.ammo,
          maxAmmo: weaponData.maxAmmo,
          ammoType: weaponData.ammoType,
          isFavoriteWeapon,
        };
      });
  }, [normalizedInventory]);

  // Handler para abrir combate com arma
  const handleOpenCombat = useCallback((weapon: WeaponEntry) => {
    setSelectedWeapon(weapon);
    setCombatModalOpen(true);
  }, []);

  // Memo de poderes ativáveis para rolagens (paridade com desktop)
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
      peCurrent: localPeCurrent,
      intellect: character.intellect || 1,
      trainedSkills: Object.keys(character.skills || {}).filter(
        s => (character.skills?.[s] || 0) >= 1
      ),
      peritoSkills: peritoSkillsForActivation, // Perícias escolhidas para Perito
      characterClass: character.class,
      classTrack: character.class_track, // Trilha para poderes como Ataque Extra
      origin: character.origin,
      testedAttribute: rollTestedAttribute,
    });
  }, [character, localPeCurrent, rollTestedAttribute, peritoSkillsForActivation]);

  // Handler para rolagem de perícia (abre modal de dados)
  const handleSkillRoll = useCallback((skillName: string) => {
    const trainingBonus = character.skills?.[skillName.toLowerCase()] || 0;
    const skillAttr = getSkillAttributeAbbrev(skillName);
    const attrValue = {
      'AGI': character.agility,
      'FOR': character.strength,
      'INT': character.intellect,
      'PRE': character.presence,
      'VIG': character.vigor,
    }[skillAttr] || 1;
    
    // Detectar atributo sendo testado para filtrar poderes ativáveis (paridade desktop)
    const attrMap: Record<string, 'agility' | 'intellect' | 'strength' | 'presence' | 'vigor'> = {
      'INT': 'intellect',
      'AGI': 'agility',
      'FOR': 'strength',
      'PRE': 'presence',
      'VIG': 'vigor',
    };
    // CORREÇÃO: Define o skillId para filtrar poderes ativáveis (ex: Desbravador, Saber é Poder)
    // Antes passava apenas o atributo, agora passa o ID real da perícia
    const skillKey = skillName.toLowerCase().replace(/\s+/g, '-');
    setRollTestedAttribute(skillKey as typeof rollTestedAttribute);
    const classPowerBonus = bonusSummary?.skills?.[skillKey]?.total || 0;
    
    
    // Busca bônus do SUE para esta perícia (efeitos ativos)
    let sueSkillBonus = 0;
    if (unifiedEffects?.computed?.skills) {
      const skillsMap = unifiedEffects.computed.skills;
      const normalizedKey = skillName.toLowerCase();
      if (skillsMap[normalizedKey] && typeof skillsMap[normalizedKey] === 'number') {
        sueSkillBonus = skillsMap[normalizedKey] as number;
      }
    }
    
    // Total de bônus = treinamento + poderes de classe + SUE
    const totalSkillBonus = trainingBonus + classPowerBonus + sueSkillBonus;
    
    // Verifica se aplica +1d20 de "Primeira Impressão" (Especialista)
    // Se for o primeiro teste de Diplomacia/Enganação/Intimidação/Intuição na cena
    const primeiraImpressaoBonus = primeiraImpressao.shouldApplyExtraDice(skillName) ? 1 : 0;
    
    // Constrói fontes de bônus para exibição detalhada
    const bonusSources: BonusSource[] = [];
    if (trainingBonus > 0) {
      bonusSources.push({ label: 'Treinamento', value: trainingBonus, type: 'skill' as const });
    }
    if (classPowerBonus > 0) {
      const powerSourceName = bonusSummary?.skills?.[skillKey]?.breakdown?.[0]?.source || 'Poder de Classe';
      bonusSources.push({ 
        label: 'Poder de Classe', 
        value: classPowerBonus, 
        type: 'power' as const,
        sourceName: powerSourceName,
      });
    }
    if (sueSkillBonus > 0) {
      bonusSources.push({ label: 'Efeitos Ativos', value: sueSkillBonus, type: 'other' as const });
    }
    // Adiciona fonte de "Primeira Impressão" se aplicável
    if (primeiraImpressaoBonus > 0) {
      bonusSources.push({ 
        label: 'Primeira Impressão', 
        value: primeiraImpressaoBonus, 
        type: 'power' as const,
        sourceName: 'Primeira Impressão (+1d20)',
      });
    }
    
    setDiceModalConfig({
      skillName,
      pool: attrValue + primeiraImpressaoBonus, // +1d20 se Primeira Impressão ativa
      bonus: totalSkillBonus,
      bonusSources: bonusSources.filter(b => b.value !== 0),
    });
    setDiceModalOpen(true);
  }, [character, unifiedEffects, bonusSummary, primeiraImpressao]);

  // Handler para abrir modal de conjuração de ritual
  const handleOpenRitualModal = useCallback((ritualId: string) => {
    const ritual = ALL_RITUALS.find(r => r.id === ritualId || r.name === ritualId);
    if (ritual) {
      setSelectedRitual(ritual);
      setRitualCastModalOpen(true);
    }
  }, []);

  // Handler para atualizar PE após conjuração
  const handlePEChange = useCallback(async (newPE: number) => {
    try {
      await supabase
        .from('characters')
        .update({ pe_current: Math.max(0, Math.min(newPE, character.pe_max)) })
        .eq('id', character.id);
      
      if (onRefetch) {
        await onRefetch();
      }
    } catch (error) {
      console.error('Erro ao atualizar PE:', error);
    }
  }, [character.id, character.pe_max, onRefetch]);

  // Handler completo para conjuração de ritual (paridade com desktop)
  const handleConfirmRitualCast = useCallback(async (
    ritual: typeof ALL_RITUALS[0],
    peCost: number,
    enhancements: string[],
    activeModifiers?: string[],
    counterRitualCost?: number
  ) => {
    if (!character) return;
    
    const peBeforeCast = character.pe_current;
    const newPe = peBeforeCast - peCost;
    if (newPe < 0) return;
    
    await handlePEChange(newPe);
    
    // Registrar no histórico da sessão (paridade com desktop)
    const castRecord: RitualCastRecord = {
      id: `${ritual.id}-${Date.now()}`,
      ritual,
      peCost,
      enhancements,
      timestamp: new Date(),
      peBeforeCast,
      peAfterCast: newPe,
    };
    setCastHistory(prev => [castRecord, ...prev]);
    
    // Sincroniza com a campanha em tempo real (se estiver em uma)
    if (isInCampaign) {
      await syncRitualCast(ritual, peCost, enhancements, peBeforeCast, newPe);
    }
    
    // Toast de confirmação com detalhes
    const enhText = enhancements.length > 0 
      ? ` (${enhancements.join(', ')})` 
      : '';
    const modText = activeModifiers?.length 
      ? ` • ${activeModifiers.length} modificador(es)` 
      : '';
    const counterText = counterRitualCost 
      ? ` [Anular: +${counterRitualCost} PE]` 
      : '';
    
    toast.success(`${ritual.name} conjurado!`, {
      description: `${peCost} PE consumido${enhText}${modText}${counterText}. PE restante: ${newPe}`,
    });
  }, [character, handlePEChange, isInCampaign, syncRitualCast]);

  // Handler para limpar histórico de rituais
  const handleClearCastHistory = useCallback(() => {
    setCastHistory([]);
    toast.success('Histórico limpo');
  }, []);

  // ========== HANDLERS DE PARIDADE COMPLETA DESKTOP ==========
  
  // Handler para deletar personagem
  const handleDelete = useCallback(async () => {
    if (!character) return;
    
    if (!confirm(`Tem certeza que deseja excluir ${character.name}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', character.id);

    if (error) {
      toast.error('Erro ao excluir', { description: error.message });
    } else {
      toast.success('Personagem excluído', { description: `${character.name} foi removido.` });
      // Navegar via callback se disponível, senão recarrega
      window.location.href = '/dashboard';
    }
  }, [character]);

  // Handler para progressão de NEX (paridade desktop)
  const handleLevelUp = useCallback(async (newNex: number, newStats: {
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
  }) => {
    if (!character || !user) return;

    const updatedAbilities = [
      ...(character.abilities || []),
      ...newStats.newAbilities,
    ];

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
      hp_current: character.hp_current + (newStats.hp_max - character.hp_max),
      pe_max: newStats.pe_max,
      pe_current: character.pe_current + (newStats.pe_max - character.pe_max),
      san_max: newStats.san_max,
      san_current: character.san_current + (newStats.san_max - character.san_max),
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
          updateData.hp_max = updateData.hp_max + 1;
          updateData.hp_current = updateData.hp_current + 1;
        }
        
        // Recalcular PE se for Presença
        if (attr === 'presence') {
          updateData.pe_max = updateData.pe_max + 1;
          updateData.pe_current = updateData.pe_current + 1;
        }
      }
    }
    
    // Se há escolha de Versatilidade e escolheu trilha diferente,
    // a habilidade já foi adicionada no newAbilities pelo NexProgressionModal
    if (newStats.versatilityChoice?.type === 'track_ability' && newStats.versatilityChoice.trackId) {
      console.log(`[Versatilidade] ${character.name} adquiriu habilidade "${newStats.versatilityChoice.abilityName}" da trilha "${newStats.versatilityChoice.trackName}"`);
    }

    const { error } = await supabase
      .from('characters')
      .update(updateData)
      .eq('id', character.id);

    if (error) {
      toast.error('Erro ao subir de NEX', { description: error.message });
      throw error;
    }

    toast.success(`NEX aumentado para ${newNex}%!`, { description: `${character.name} subiu de nível!` });

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

    if (onRefetch) await onRefetch();
  }, [character, user, onRefetch]);

  // Handler para salvar novos rituais
  const handleRitualsConfirm = useCallback(async (selectedRituals: string[]) => {
    if (!character) return;

    const updatedRituals = [...character.rituals, ...selectedRituals];

    const { error } = await supabase
      .from('characters')
      .update({ rituals: updatedRituals })
      .eq('id', character.id);

    if (error) {
      toast.error('Erro ao salvar rituais', { description: error.message });
      throw error;
    }

    toast.success('Novos rituais aprendidos!', { description: `${selectedRituals.length} ritual(is) adicionado(s).` });
    if (onRefetch) await onRefetch();
  }, [character, onRefetch]);

  // Handler para edição do personagem (paridade desktop)
  const handleCharacterEdit = useCallback(async (data: {
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
    if (!character || !user) return;

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
        hp_current: Math.min(character.hp_current, newStats.hp),
        pe_current: Math.min(character.pe_current, newStats.pe),
        san_current: Math.min(character.san_current, newStats.san),
      })
      .eq('id', character.id);

    if (error) {
      toast.error('Erro ao salvar', { description: error.message });
      throw error;
    }

    // Log de alterações
    await logCharacterChanges(character.id, user.id, [{
      changeType: 'edit',
      fieldName: 'character',
      oldValue: character.name,
      newValue: data.name,
      description: 'Personagem editado',
    }]);

    toast.success('Personagem atualizado!');
    if (onRefetch) await onRefetch();
  }, [character, user, onRefetch]);

  // Handler de stats simplificado (paridade desktop)
  const handleCombatStatsChange = useCallback(async (stats: { hp: number; pe: number; san: number }) => {
    if (!character) return;

    const { error } = await supabase
      .from('characters')
      .update({
        hp_current: stats.hp,
        pe_current: stats.pe,
        san_current: stats.san,
      })
      .eq('id', character.id);

    if (!error && onRefetch) {
      await onRefetch();
    }
  }, [character, onRefetch]);

  // Handler para wizard de efeitos (abre após conjurar ritual com efeitos)
  const handleOpenWizard = useCallback((ritual: Ritual, enhancements: string[], peCost: number) => {
    setWizardRitual(ritual);
    setWizardEnhancements(enhancements);
    setWizardPeCost(peCost);
    setWizardOpen(true);
  }, []);

  // Handler para aplicar dano do wizard
  const handleWizardApplyDamage = useCallback((damage: number, type: string, ignoresRD: boolean) => {
    toast.success(`Dano aplicado: ${damage} (${type})${ignoresRD ? ' - Ignora RD' : ''}`);
  }, []);

  // Handler para aplicar cura do wizard
  const handleWizardApplyHealing = useCallback((amount: number, type: 'healing' | 'tempHP') => {
    if (type === 'healing') {
      toast.success(`Cura aplicada: ${amount} PV`);
    } else {
      toast.success(`PV Temporários: +${amount}`);
    }
  }, []);

  // Handler para aplicar condições do wizard (será vinculado depois)
  const handleWizardApplyConditions = useCallback(async (conditions: ActiveCondition[]) => {
    toast.success(`${conditions.length} condição(ões) aplicada(s)`);
  }, []);

  // Handler para adicionar buff de arma do wizard
  const handleWizardAddWeaponBuff = useCallback((ritual: Ritual, _enhancements: string[]) => {
    toast.success(`Buff de ${ritual.name} aplicado à arma`);
  }, []);

  // Handler para ativar ritual sustentado do wizard
  const handleWizardActivateSustained = useCallback(async (ritual: Ritual, _enhancements: string[], _sustain: SustainConfig) => {
    toast.success(`${ritual.name} sustentado ativado`);
  }, [activateRitual]);

  // Handler para adicionar poder paranormal via Transcender
  const handleParanormalPowerSelect = useCallback(async (power: ParanormalPower) => {
    if (!character || !user) return;

    const fullPower = getPowerById(power.id);
    if (fullPower?.requiresChoice) {
      setPendingPower(power);
      setParanormalPowerModalOpen(false);
      
      switch (fullPower.requiresChoice) {
        case 'skill_intellect':
          setIntellectSkillModalOpen(true);
          return;
        case 'ritual':
          setRitualModalSource('aprender-ritual-poder');
          setNonOccultistRitualModalOpen(true);
          return;
        case 'element_resistance':
          setElementResistanceModalOpen(true);
          return;
      }
    }

    await saveParanormalPower(power);
  }, [character, user]);

  // Função auxiliar para salvar poder paranormal
  const saveParanormalPower = useCallback(async (power: ParanormalPower, choices?: SavedParanormalPower['choices']) => {
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
    
    const currentNex = character.nex;
    const previousNex = Math.max(5, currentNex - 5);
    // Transcender adiciona +1 ao contador existente de Transcender do personagem
    const existingTranscenderCount = countTranscender(character.abilities as string[]);
    const currentStats = calculateDerivedStats(character.class, character.vigor, character.presence, currentNex, character.origin, character.abilities as string[], existingTranscenderCount);
    const previousStats = calculateDerivedStats(character.class, character.vigor, character.presence, previousNex, character.origin, character.abilities as string[], existingTranscenderCount);
    const sanLoss = currentStats.san - previousStats.san;
    
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
      toast.error('Erro ao salvar poder', { description: error.message });
      return;
    }

    await logCharacterChanges(character.id, user.id, [
      {
        changeType: 'transcender',
        fieldName: 'paranormal_powers',
        oldValue: String(currentPowers.length),
        newValue: power.name,
        description: `Adquiriu "${power.name}" (${power.element}) via Transcender`,
      },
    ]);

    setPendingPower(null);
    toast.success('Poder Paranormal adquirido!', {
      description: sanLoss > 0 
        ? `${power.name} adicionado. Você perdeu ${sanLoss} SAN máxima.`
        : `${power.name} adicionado.`,
    });
    if (onRefetch) await onRefetch();
  }, [character, user, onRefetch]);

  // Handler para confirmar escolha de perícias de Intelecto
  const handleIntellectSkillConfirm = useCallback(async (skillIds: string[]) => {
    if (!pendingPower) return;
    await saveParanormalPower(pendingPower, { skills: skillIds });
    setIntellectSkillModalOpen(false);
  }, [pendingPower, saveParanormalPower]);

  // Handler para confirmar escolha de elemento de resistência
  const handleElementResistanceConfirm = useCallback(async (element: ParanormalElement) => {
    if (!pendingPower) return;
    await saveParanormalPower(pendingPower, { resistElement: element });
    setElementResistanceModalOpen(false);
  }, [pendingPower, saveParanormalPower]);

  // Handler para abrir modal de Grau de Treinamento
  const handleOpenTrainingGradeModal = useCallback((nex: 35 | 70) => {
    setTrainingGradeNex(nex);
    setTrainingGradeModalOpen(true);
  }, []);

  // Handler para confirmar escolhas de Grau de Treinamento
  const handleTrainingGradeConfirm = useCallback(async (result: TrainingGradeResult) => {
    if (!character) return;
    
    // Busca escolhas existentes
    const existingChoices = character.training_grade_choices || {};
    
    // Atualiza as escolhas para o NEX específico usando constantes centralizadas
    const updatedChoices = {
      ...existingChoices,
      [result.nex === 35 ? TRAINING_GRADE_KEYS.NEX_35 : TRAINING_GRADE_KEYS.NEX_70]: result.choices,
    };
    
    // Aplica os upgrades às perícias
    const updatedSkills = applyTrainingGradeUpgrades(
      character.skills || {},
      result.choices
    );
    
    // Salva no banco
    const { error } = await supabase
      .from('characters')
      .update({
        training_grade_choices: updatedChoices,
        skills: updatedSkills,
      })
      .eq('id', character.id);
    
    if (error) {
      toast.error('Erro ao salvar', { description: error.message });
      return;
    }
    
    toast.success('Grau de Treinamento configurado!', {
      description: `${result.choices.length} perícias aprimoradas no NEX ${result.nex}%.`,
    });
    
    setTrainingGradeModalOpen(false);
    if (onRefetch) await onRefetch();
  }, [character, onRefetch]);
  
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
      toast.error('Erro ao salvar', { description: error.message });
      return;
    }
    
    toast.success('Perícias adicionadas!', {
      description: `${newSkillIds.length} nova(s) perícia(s) treinada(s).`,
    });
    
    setMissingSkillsModalOpen(false);
    if (onRefetch) await onRefetch();
  }, [character, onRefetch]);

  // Handler para confirmar escolha de ritual
  const handleRitualFromPowerConfirm = useCallback(async (ritualId: string) => {
    if (!pendingPower || !character) return;
    
    await saveParanormalPower(pendingPower, { ritualId });
    
    const updatedRituals = [...(character.rituals || []), ritualId];
    await supabase
      .from('characters')
      .update({ rituals: updatedRituals })
      .eq('id', character.id);
    
    setNonOccultistRitualModalOpen(false);
    if (onRefetch) await onRefetch();
  }, [pendingPower, character, saveParanormalPower, onRefetch]);

  // Handler para descanso (paridade desktop)
  const handleRest = useCallback(async (type: 'short' | 'long', healHP: number, healPE: number, healSAN: number) => {
    if (!character) return;
    
    const newHP = Math.min(character.hp_max, character.hp_current + healHP);
    const newPE = Math.min(character.pe_max, character.pe_current + healPE);
    const newSAN = Math.min(character.san_max, character.san_current + healSAN);
    
    const { error } = await supabase
      .from('characters')
      .update({
        hp_current: newHP,
        pe_current: newPE,
        san_current: newSAN,
      })
      .eq('id', character.id);
    
    if (error) {
      toast.error('Erro ao descansar', { description: error.message });
      return;
    }
    
    const typeLabel = type === 'short' ? 'Descanso Curto' : 'Descanso Longo';
    toast.success(typeLabel, {
      description: `Recuperou ${healHP} PV, ${healPE} PE e ${healSAN} SAN.`,
    });
    
    if (onRefetch) await onRefetch();
  }, [character, onRefetch]);

  // Wrapper para onRefetch que retorna Promise<void>
  const handleRefetchForBanner = useCallback(async () => {
    if (onRefetch) {
      await onRefetch();
    }
  }, [onRefetch]);

  // Handler para rolar iniciativa (usado pelo MobileOverviewTab)
  // Aplica bônus de trilha (ex: Operações Especiais +5 Iniciativa Aprimorada) e treinamento
  const handleRollInitiative = useCallback(() => {
    // Usa diretamente o breakdown do SUE que já tem todas as fontes consolidadas
    // (origem, trilha, treinamento, poderes, condições, etc.)
    const bonusSources: BonusSource[] = bonusSummary.combat.initiative.breakdown
      .filter(b => b.active && typeof b.value === 'number' && b.value !== 0)
      .map(b => {
        // Determina o tipo baseado no type do breakdown do SUE
        let sourceType: BonusSource['type'] = 'other';
        const lowerSource = b.source.toLowerCase();
        
        // Mapeia os tipos do SUE para os tipos do BonusSource para exibição
        if (b.type === 'ability' || b.type === 'track_effect' || 
            lowerSource.includes('trilha') || lowerSource.includes('operações') || 
            lowerSource.includes('iniciativa aprimorada')) {
          sourceType = 'track';
        } else if (b.type === 'origin' || lowerSource.includes('origem') || 
                   lowerSource.includes('posição de combate') || lowerSource.includes('mercenário')) {
          sourceType = 'origin';
        } else if (b.type === 'skill_training' || lowerSource.includes('treinamento') || 
                   lowerSource.includes('treinado') || lowerSource.includes('veterano') || 
                   lowerSource.includes('expert')) {
          sourceType = 'skill';
        } else if (b.type === 'general_power' || lowerSource.includes('poder')) {
          sourceType = 'power';
        } else if (b.type === 'ritual' || lowerSource.includes('ritual')) {
          sourceType = 'other';
        }
        
        return {
          label: b.source,
          value: b.value as number,
          type: sourceType,
          sourceName: b.source,
          description: b.conditional, // Usa conditional como descrição se houver
        };
      });
    
    // Usa o total já calculado pelo SUE (não precisa somar manualmente)
    const totalBonus = bonusSummary.combat.initiative.total;
    
    setDiceModalConfig({
      skillName: 'Iniciativa',
      pool: character.agility,
      bonus: totalBonus,
      bonusSources,
    });
    setDiceModalOpen(true);
  }, [character.agility, bonusSummary.combat.initiative]);

  // Handler para atualizar condições (converte ActiveCondition[] para formato do banco)
  const handleConditionsChange = useCallback(async (newConditions: ActiveCondition[]) => {
    try {
      // Converte ActiveCondition[] para formato JSON para persistir no banco
      const conditionsJson = newConditions.map(c => ({
        id: c.id,
        name: c.name,
        turnsRemaining: c.turnsRemaining,
        addedAt: typeof c.addedAt === 'string' ? c.addedAt : c.addedAt.toISOString(),
        dyingCounter: c.dyingCounter,
        params: c.params,
      }));
      
      await supabase
        .from('characters')
        .update({ conditions: conditionsJson as any })
        .eq('id', character.id);
      
      if (onRefetch) {
        await onRefetch();
      }
    } catch (error) {
      console.error('Erro ao atualizar condições:', error);
    }
  }, [character.id, onRefetch]);

  // Converte conditions do banco para ActiveCondition[]
  const activeConditions: ActiveCondition[] = useMemo(() => {
    if (!character.conditions || !Array.isArray(character.conditions)) return [];
    
    // Verifica se é formato antigo (string[]) ou novo (ActiveCondition[])
    return character.conditions.map((c: any) => {
      if (typeof c === 'string') {
        // Formato antigo: converte string para ActiveCondition
        return {
          id: c,
          name: c,
          turnsRemaining: null,
          addedAt: new Date().toISOString(),
        };
      }
      // Formato novo: já é ActiveCondition
      return {
        id: c.id || c.name,
        name: c.name,
        turnsRemaining: c.turnsRemaining ?? null,
        addedAt: c.addedAt || new Date().toISOString(),
        dyingCounter: c.dyingCounter,
        params: c.params,
      };
    });
  }, [character.conditions]);

  // Handler para dano de condições (ex: sangrando, envenenado)
  const handleConditionDamage = useCallback((damage: number, isVerdadeiro: boolean) => {
    console.log(`Dano de condição: ${damage} (${isVerdadeiro ? 'verdadeiro' : 'normal'})`);
    // Implementar lógica de dano quando necessário
  }, []);

  // Handler para morte do personagem
  const handleCharacterDeath = useCallback(() => {
    console.log('Personagem morreu!');
    // Implementar lógica de morte quando necessário
  }, []);

  // Handler para seleção de afinidade elemental
  const handleAffinitySelect = useCallback(async (element: string) => {
    if (onSelectAffinity) {
      await onSelectAffinity(element);
    } else {
      try {
        await supabase
          .from('characters')
          .update({ 
            elemental_affinity: element,
            affinity_active: true  // Consistente com desktop: ativa afinidade ao selecionar
          })
          .eq('id', character.id);
        
        if (onRefetch) {
          await onRefetch();
        }
      } catch (error) {
        console.error('Erro ao selecionar afinidade:', error);
      }
    }
  }, [character.id, onRefetch, onSelectAffinity]);

  // Handler para adicionar poder paranormal (Transcender)
  const handleAddParanormalPower = useCallback(async (power: { id: string; name: string; element: string; description: string }) => {
    if (onAddParanormalPower) {
      await onAddParanormalPower(power);
    } else {
      try {
        const updatedPowers = [...(character.paranormal_powers || []), power];
        await supabase
          .from('characters')
          .update({ paranormal_powers: updatedPowers })
          .eq('id', character.id);
        
        if (onRefetch) {
          await onRefetch();
        }
      } catch (error) {
        console.error('Erro ao adicionar poder paranormal:', error);
      }
    }
    setParanormalPowerModalOpen(false);
  }, [character.id, character.paranormal_powers, onRefetch, onAddParanormalPower]);

  // Handler interno para toggle de bônus condicional
  const handleToggleConditionalBonus = useCallback(async (bonusId: string, active: boolean) => {
    if (onToggleConditionalBonus) {
      onToggleConditionalBonus(bonusId, active);
    } else {
      try {
        const currentBonuses = character.active_conditional_bonuses || [];
        const updatedBonuses = active
          ? [...currentBonuses, bonusId]
          : currentBonuses.filter(id => id !== bonusId);
        
        await supabase
          .from('characters')
          .update({ active_conditional_bonuses: updatedBonuses })
          .eq('id', character.id);
        
        if (onRefetch) {
          await onRefetch();
        }
      } catch (error) {
        console.error('Erro ao toggle bônus condicional:', error);
      }
    }
  }, [character.id, character.active_conditional_bonuses, onRefetch, onToggleConditionalBonus]);

  // Verifica se pode transcender (tem slots de NEX disponíveis E não usou todos)
  // Usa a contagem de slots total do banco (transcender + class_power)
  const canTranscend = useMemo(() => {
    const availableSlots = powerLimits.fromTranscender - totalSlotsUsedFromDB;
    return availableSlots > 0;
  }, [powerLimits.fromTranscender, totalSlotsUsedFromDB]);

  return (
    <div className="pb-20">
      {/* Banner de dados incompletos (atributos null/undefined) */}
      {!attributeValidation.isValid && onRefetch && (
        <IncompleteDataBanner
          message={attributeValidation.errorMessage || 'Alguns dados do personagem estão faltando.'}
          onRefetch={handleRefetchForBanner}
          missingFields={attributeValidation.missingAttributes}
        />
      )}

      {/* Banner de Auditoria - sempre visível no topo */}
      <MobileAuditBanner
        auditResult={auditResult}
        visibleIssues={visibleIssues}
        counts={counts}
        isAuditing={isAuditing}
        isFixing={isFixing}
        onAutoFix={applyAutoFixes}
        onDismiss={dismissIssue}
        onRerunAudit={runAudit}
        onManualFix={(category: string, issueId?: string) => {
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
      />
      
      {/* Conteúdo baseado na tab ativa */}
      <AnimatePresence mode="wait">
        {/* Tab Overview - Componente extraído */}
        {activeTab === 'overview' && (
          <>
            <MobileOverviewTab
              key="overview"
              character={character}
              conditions={activeConditions}
              originName={originData?.name}
              trackName={trackData?.name}
              bonusSummary={bonusSummary}
              totalDefense={totalDefense}
              armorSpeedPenalty={armorSpeedPenalty}
              loadStatus={inventoryLoadStatus}
              defenseBonuses={defenseBonuses}
              equippedWeapons={equippedWeapons}
              weaponBuffs={weaponBuffs}
              rollHistory={rollHistory}
              attributeValidation={attributeValidation}
              onOpenDiceRoller={onOpenDiceRoller}
              onOpenRest={() => setRestModalOpen(true)}
              onLevelUp={() => setNexModalOpen(true)}
              onEditStats={() => setEditModalOpen(true)}
              onOpenCombat={handleOpenCombat}
              onRollInitiative={handleRollInitiative}
              onClearHistory={clearHistory}
              onRemoveRoll={removeRoll}
              onConditionsChange={handleConditionsChange}
              onDamageFromCondition={handleConditionDamage}
              onCharacterDeath={handleCharacterDeath}
              especialistaArmaGroups={especialistaArmaGroups}
              roundTracking={{
                currentRound: roundTracking.currentRound,
                usedAbilitiesThisRound: roundTracking.usedAbilitiesThisRound,
                peSpentThisRound: roundTracking.peSpentThisRound,
                peSpentBreakdown: roundTracking.peSpentBreakdown,
                advanceRound: roundTracking.advanceRound,
                resetCombat: () => {
                  roundTracking.resetCombat();
                  // Reseta "Primeira Impressão" junto com reset de cena
                  primeiraImpressao.resetSceneTracking();
                },
                trackPESpent: roundTracking.trackPESpent,
              }}
              classPowers={character.powers as unknown[] || []}
              abilities={(Array.isArray(character.abilities) ? {} : character.abilities) as Record<string, unknown> || {}}
              paranormalPowers={character.paranormal_powers as SavedParanormalPower[] || []}
              elementalAffinity={character.elemental_affinity as ParanormalElement || null}
              affinityActive={character.affinity_active || false}
              onHPChange={async (newHP) => {
                if (handleCombatStatsChange) {
                  await handleCombatStatsChange({ 
                    hp: newHP, 
                    pe: character.pe_current, 
                    san: character.san_current 
                  });
                }
              }}
              onPEChange={handlePEChange}
              onToggleConditionalBonus={handleToggleConditionalBonus}
              activeConditionalBonuses={character.active_conditional_bonuses || []}
            />
            
            {/* Seletor de Afinidade Elemental - só aparece após usar Transcender em NEX 50+ */}
            {character.nex >= 50 && !character.elemental_affinity && hasTranscendedPost50 && (
              <MobileAffinitySelectorCard
                nex={character.nex}
                onSelectAffinity={handleAffinitySelect}
              />
            )}
            
            {/* Painel de Bônus Condicionais */}
            {(bonusSummary.conditionalBonuses?.length ?? 0) > 0 && (
              <MobileConditionalBonusesPanel
                conditionalBonuses={bonusSummary.conditionalBonuses}
                onToggleBonus={handleToggleConditionalBonus}
                excludedEffects={bonusSummary.unifiedEffects?.hardening?.excludedEffects || []}
              />
            )}
            
            {/* Painel de Rituais Sustentados */}
            {sustainedRituals.length > 0 && (
              <MobileSustainedRitualsPanel
                rituals={sustainedRituals}
                onDeactivate={async (ritualId) => {
                  // O hook useSustainedRituals já cuida da remoção
                  if (onRefetch) await onRefetch();
                }}
                onClearAll={async () => {
                  // Desativar todos os rituais sustentados
                  if (onRefetch) await onRefetch();
                }}
              />
            )}
            
            {/* Painel de Efeitos Ativos (SUE) */}
            {unifiedEffects && (
              <MobileActiveEffectsPanel
                effectsResult={unifiedEffects}
              />
            )}
            
            {/* DevTools do SUE - apenas em desenvolvimento */}
            <SUEDevToolsPanel 
              hardeningData={unifiedEffects?.hardening ? {
                effects: unifiedEffects.hardening.preparedEffects,
                stackingBreakdowns: unifiedEffects.hardening.stackingBreakdowns,
                excludedEffects: unifiedEffects.hardening.excludedEffects,
                metadata: unifiedEffects.hardening.metadata,
              } : null}
            />
            
            {/* Controle de Rodada Mobile - Exibido apenas se houver uso de habilidades ou rodada > 1 */}
            {(roundTracking.usedCount > 0 || roundTracking.currentRound > 1) && (
              <div className="bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Rodada</span>
                    <span className="text-lg font-bold text-primary">{roundTracking.currentRound}</span>
                    {roundTracking.usedCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({roundTracking.usedCount} habilidade{roundTracking.usedCount > 1 ? 's' : ''} usada{roundTracking.usedCount > 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={roundTracking.advanceRound}
                      className="text-xs h-8"
                    >
                      <ChevronRight className="h-3 w-3 mr-1" />
                      Próxima
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={roundTracking.resetCombat}
                      className="text-xs h-8 text-muted-foreground"
                    >
                      Resetar
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* ====================================================== */}
            {/* PAINÉIS DE TRILHA - Combatente */}
            {/* ====================================================== */}

            {/* Comandante de Campo */}
            <MobileLeadershipPanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              intellect={character.intellect}
              onPEChange={handlePEChange}
              usedAbilitiesThisRound={roundTracking.usedAbilitiesThisRound}
              onAbilityUsed={roundTracking.markAbilityUsed}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
            />
            
            {/* Aniquilador */}
            <MobileAniquiladorPanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              onPEChange={handlePEChange}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
            />
            
            {/* Guerreiro */}
            <MobileGuerreiroPanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              onPEChange={handlePEChange}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
            />
            
            {/* Operações Especiais */}
            <MobileOperacoesEspeciaisPanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              onPEChange={handlePEChange}
              usedAbilitiesThisRound={roundTracking.usedAbilitiesThisRound}
              onAbilityUsed={roundTracking.markAbilityUsed}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
              onTrackPESpent={roundTracking.trackPESpent}
            />
            
            {/* Tropa de Choque */}
            <MobileTropaDeChoquePanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              vigor={character.vigor}
              hpCurrent={character.hp_current}
              hpMax={character.hp_max}
              onPEChange={handlePEChange}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
              onTrackPESpent={roundTracking.trackPESpent}
            />

            {/* ====================================================== */}
            {/* PAINÉIS DE TRILHA - Especialista */}
            {/* ====================================================== */}
            
            {/* Atirador de Elite */}
            <MobileAtiradorDeElitePanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              intellect={character.intellect}
              onPEChange={handlePEChange}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
              onTrackPESpent={roundTracking.trackPESpent}
            />

            {/* Infiltrador */}
            <MobileInfiltradorPanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              agility={character.agility}
              onPEChange={handlePEChange}
              usedAbilitiesThisRound={roundTracking.usedAbilitiesThisRound}
              onAbilityUsed={roundTracking.markAbilityUsed}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
              onTrackPESpent={roundTracking.trackPESpent}
            />

            {/* Médico de Campo */}
            <MobileMedicoDeCampoPanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              onPEChange={handlePEChange}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
              onTrackPESpent={roundTracking.trackPESpent}
              pvCurrent={character.hp_current}
              pvMax={character.hp_max}
              onHPChange={(newHP) => handleCombatStatsChange?.({ hp: newHP, pe: character.pe_current, san: character.san_current })}
              computedEffects={unifiedEffects?.computed}
            />

            {/* Negociador */}
            <MobileNegociadorPanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              onPEChange={handlePEChange}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
              onTrackPESpent={roundTracking.trackPESpent}
            />
            
            {/* Técnico */}
            <MobileTecnicoPanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              onPEChange={handlePEChange}
              attributes={{
                strength: character.strength,
                intellect: character.intellect
              }}
              inventory={normalizedInventory as any[]}
              onAddTemporaryItem={async (newItem) => {
                // Adiciona item temporário ao inventário
                const currentInventory = character.inventory || [];
                const updatedInventory = [...currentInventory, {
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
                }];
                
                await supabase
                  .from('characters')
                  .update({ inventory: updatedInventory as unknown as import('@/integrations/supabase/types').Json })
                  .eq('id', character.id);
                
                if (onRefetch) await onRefetch();
              }}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
              onTrackPESpent={roundTracking.trackPESpent}
            />

            {/* ====================================================== */}
            {/* PAINÉIS DE TRILHA - Ocultista */}
            {/* ====================================================== */}

            {/* Conduíte */}
            <MobileConduitePanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              onPEChange={handlePEChange}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
              onTrackPESpent={roundTracking.trackPESpent}
            />

            {/* Flagelador */}
            <MobileFlageladorPanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              onPEChange={handlePEChange}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
              onTrackPESpent={roundTracking.trackPESpent}
            />

            {/* Graduado */}
            <MobileGraduadoPanel
              classTrack={character.class_track}
              nex={character.nex}
              intellect={character.intellect}
            />

            {/* Intuitivo */}
            <MobileIntuitivoPanel
              classTrack={character.class_track}
              nex={character.nex}
              presence={character.presence}
            />

            {/* Lâmina Paranormal */}
            <MobileLaminaParanormalPanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              onPEChange={handlePEChange}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
              onTrackPESpent={roundTracking.trackPESpent}
            />
            
            {/* Widget de Efeitos Passivos da Trilha */}
            <MobileTrackPassiveEffectsWidget
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
                compact
              />
            )}
          </>
        )}

        {/* Tab Skills - Componente extraído */}
        {activeTab === 'skills' && (
          <MobileSkillsTab 
            key="skills"
            skills={character.skills || {}}
            onSkillRoll={handleSkillRoll}
          />
        )}

        {/* Tab Powers - Componente extraído com virtualização */}
        {activeTab === 'powers' && (
          <MobilePowersTab
            key="powers"
            abilities={character.abilities}
            characterClass={character.class}
            nex={character.nex}
            intellect={character.intellect}
            classPowerChoices={character.class_power_choices || {}}
            equippedWeaponId={equippedWeapons[0]?.id}
            equippedWeaponName={equippedWeapons[0]?.name}
            paranormalPowers={character.paranormal_powers}
            generalPowers={character.general_powers}
            originPowers={character.powers}
            rituals={character.rituals}
            powerLimits={powerLimits}
            ritualLimits={ritualLimits}
            hasExcessPowers={hasExcessPowers}
            hasExcessRituals={hasExcessRituals}
            transcenderUsed={transcenderUsedFromDB}
            totalSlotsUsed={totalSlotsUsedFromDB}
            trainingGradeChoices={character.training_grade_choices}
            onPowerClick={handlePowerClick}
            onOpenExcessPowersModal={() => setExcessPowersModalOpen(true)}
            onOpenExcessRitualsModal={() => setExcessRitualsModalOpen(true)}
            onOpenRemovedPowersHistory={() => setRemovedPowersHistoryOpen(true)}
            onConfigureTrainingGrade={handleOpenTrainingGradeModal}
            ritualHistoryButton={
              <MobileRitualCastHistory
                history={castHistory}
                onClear={handleClearCastHistory}
                characterName={character.name}
              />
            }
          />
        )}

        {activeTab === 'inventory' && (
          <motion.div
            key="inventory"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {/* Resumo de capacidade */}
            {normalizedInventory.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <div className="flex-shrink-0 px-3 py-1.5 bg-muted/50 rounded-full text-[10px] flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {normalizedInventory.length} itens
                </div>
                <div className="flex-shrink-0 px-3 py-1.5 bg-muted/50 rounded-full text-[10px]">
                  {normalizedInventory.reduce((acc, i) => acc + (i.slots || 1), 0)} espaços usados
                </div>
                {normalizedInventory.filter(i => i.isEquipped).length > 0 && (
                  <div className="flex-shrink-0 px-3 py-1.5 bg-primary/10 rounded-full text-[10px] text-primary">
                    {normalizedInventory.filter(i => i.isEquipped).length} equipados
                  </div>
                )}
              </div>
            )}

            {/* Itens equipados - Preview rápido */}
            {normalizedInventory.filter(i => i.isEquipped).length > 0 && (
              <MobileCollapsibleSection 
                title="EQUIPAMENTO" 
                icon={<Swords className="w-4 h-4 text-primary" />}
                badge={normalizedInventory.filter(i => i.isEquipped).length}
                defaultOpen={true}
              >
                <div className="space-y-2">
                  {normalizedInventory.filter(i => i.isEquipped).map((item) => (
                    <div 
                      key={item.id} 
                      className="p-3 bg-primary/10 rounded-lg border border-primary/30 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        {getItemIcon(item.itemType || item.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium block truncate">{item.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.equipSlot && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-primary/30 rounded capitalize">
                              {item.equipSlot.replace('_', ' ')}
                            </span>
                          )}
                          <span className="text-[9px] text-muted-foreground">
                            Cat. {item.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </MobileCollapsibleSection>
            )}

            {/* Botão para abrir inventário completo */}
            <Button
              onClick={() => setInventorySheetOpen(true)}
              className="w-full h-14 gap-3"
              variant="outline"
            >
              <Package className="w-5 h-5" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Gerenciar Inventário</span>
                <span className="text-[10px] text-muted-foreground">
                  Adicionar, equipar e usar itens
                </span>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto" />
            </Button>

            {/* Inventário vazio */}
            {normalizedInventory.length === 0 && (
              <div className="ordo-panel p-6">
                <div className="text-center">
                  <Package className="w-12 h-12 mx-auto text-foreground/40 mb-3" />
                  <p className="text-foreground/70 text-sm">Nenhum item no inventário.</p>
                  <p className="text-[10px] text-foreground/60 mt-1">
                    Toque no botão acima para adicionar itens
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Painel de Debug do SUE (modo desenvolvedor) */}
      <MobileSUEDebugPanel 
        effectsResult={unifiedEffects} 
        characterName={character.name}
      />

      {/* Barra de navegação fixa no bottom - Componente extraído */}
      <MobileTabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        badges={{
          inventory: normalizedInventory.length > 0 ? normalizedInventory.length : undefined,
        }}
      />

      {/* Modal de detalhes do poder */}
      <PowerDetailModal
        open={powerModalOpen}
        onOpenChange={setPowerModalOpen}
        power={selectedPower}
        onCastRitual={handleOpenRitualModal}
      />

      {/* Modal de remoção de poderes excedentes */}
      <ExcessPowersRemovalModal
        open={excessPowersModalOpen}
        onOpenChange={setExcessPowersModalOpen}
        powers={(character.paranormal_powers || []) as SavedParanormalPower[]}
        maxPowers={powerLimits.total}
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
          
          // Atualiza no banco
          await supabase
            .from('characters')
            .update({ paranormal_powers: updatedPowers })
            .eq('id', character.id);
          
          // Atualiza UI
          if (onRefetch) {
            await onRefetch();
          }
        }}
      />

      {/* Modal de remoção de rituais excedentes */}
      {ritualLimits && (
        <ExcessRitualsRemovalModal
          open={excessRitualsModalOpen}
          onOpenChange={setExcessRitualsModalOpen}
          ritualIds={character.rituals}
          maxRituals={ritualLimits.count}
          characterId={character.id}
          onRemoveRituals={async (ritualIdsToRemove) => {
            const updatedRituals = character.rituals.filter(
              id => !ritualIdsToRemove.includes(id)
            );
            
            await supabase
              .from('characters')
              .update({ rituals: updatedRituals })
              .eq('id', character.id);
            
            if (onRefetch) {
              await onRefetch();
            }
          }}
        />
      )}

      {/* Modal de histórico de poderes removidos */}
      <RemovedPowersHistory
        open={removedPowersHistoryOpen}
        onOpenChange={setRemovedPowersHistoryOpen}
        characterId={character.id}
        currentPowersCount={character.paranormal_powers?.length || 0}
        maxPowers={powerLimits.total}
        onRestorePower={async (power) => {
          const updatedPowers = [...(character.paranormal_powers || []), power];
          
          await supabase
            .from('characters')
            .update({ paranormal_powers: updatedPowers })
            .eq('id', character.id);
          
          if (onRefetch) {
            await onRefetch();
          }
        }}
      />

      {/* Sheet de Inventário Mobile */}
      <MobileInventorySheet
        open={inventorySheetOpen}
        onOpenChange={setInventorySheetOpen}
        inventory={normalizedInventory}
        strength={character.strength}
        patent={character.patent}
        onInventoryChange={handleInventoryChange}
        intellect={character.intellect}
        characterData={{
          origin: character.origin,
          classId: character.class,
          classTrack: character.class_track || undefined,
          nex: character.nex,
          abilities: character.abilities,
          powers: character.powers?.map(p => p.name) || [],
          generalPowers: character.general_powers,
          intellect: character.intellect,
        }}
      />

      {/* ========== MODAIS DE COMBATE MOBILE ========== */}
      
      {/* Modal de rolagem de dados genérica */}
      <MobileDiceRollModal
        open={diceModalOpen}
        onClose={() => {
          setDiceModalOpen(false);
          setDiceModalConfig(null);
          setRollTestedAttribute(undefined);
        }}
        label={diceModalConfig?.skillName || 'Rolagem'}
        attributeValue={diceModalConfig?.pool || 1}
        skillBonus={diceModalConfig?.bonus}
        extraDice={globalDiceBonus}
        bonusSources={diceModalConfig?.bonusSources}
        // Props para ativação de poderes (paridade desktop)
        activatablePowers={activatablePowersForCharacter}
        peCurrent={localPeCurrent}
        nex={character.nex}
        intellect={character.intellect}
        strength={character.strength}
        agility={character.agility}
        currentSkill={rollTestedAttribute}
        onPEChange={(newPE) => handleCombatStatsChange({ 
          hp: localHpCurrent, 
          pe: newPE, 
          san: localSanCurrent 
        })}
        onRollComplete={(result) => {
          const skillName = diceModalConfig?.skillName || 'Rolagem';
          const isInitiative = skillName === 'Iniciativa';
          
          // Marca perícia como testada na cena (para Primeira Impressão do Especialista)
          if (isEligibleForPrimeiraImpressao(skillName)) {
            primeiraImpressao.markSkillAsTested(skillName);
          }
          
          addRoll({
            type: isInitiative ? 'initiative' : 'skill',
            label: skillName,
            diceCount: result.dice.length,
            results: result.dice,
            bestResult: result.keptDice,
            bonus: result.skillBonus + result.otherBonuses,
            total: result.total,
            success: undefined,
            critical: result.isCritical,
            criticalFail: result.keptDice === 1,
            skillName: skillName,
          });
        }}
      />

      {/* Modal de combate completo (ataque + dano) - PARIDADE COMPLETA DESKTOP */}
      {selectedWeapon && (
        <MobileCombatRollModal
          open={combatModalOpen}
          onClose={() => {
            setCombatModalOpen(false);
            setSelectedWeapon(null);
          }}
          weapon={selectedWeapon}
          attributes={{
            strength: character.strength,
            agility: character.agility,
            vigor: character.vigor,
            intellect: character.intellect,
            presence: character.presence,
          }}
          skills={character.skills || {}}
          currentPE={character.pe_current}
          maxPE={character.pe_max}
          onPEChange={handlePEChange}
          characterClass={character.class}
          classTrack={character.class_track || undefined}
          abilities={character.abilities}
          nex={character.nex}
          unifiedEffects={unifiedEffects?.computed}
          excludedEffects={unifiedEffects?.hardening?.excludedEffects || []}
          weaponBuffs={weaponBuffs}
          paranormalPowers={character.paranormal_powers?.map(p => ({
            id: p.id, 
            name: p.name, 
            element: p.element 
          }))}
          hasAffinity={character.affinity_active || false}
          affinityElement={character.elemental_affinity}
          sustainedRituals={sustainedRituals.map(r => ({
            ritualId: r.ritualId,
            ritualName: r.ritualName,
            element: r.element,
            circle: r.circle,
            selectedEnhancements: r.selectedEnhancements,
          }))}
          advancedBonuses={{
            assassinar: character.active_conditional_bonuses?.includes('assassinar'),
            potenciaMaxima: character.active_conditional_bonuses?.includes('potencia_maxima'),
            atirarParaMatar: character.active_conditional_bonuses?.includes('atirar_para_matar'),
            ataqueFurtivo: character.active_conditional_bonuses?.includes('ataque_furtivo'),
          }}
          isFavoriteWeapon={selectedWeapon?.id === (character as any).favorite_weapon_id}
          activatedTrackEffects={activatedEffects.activatedEffectIds}
          activeConditionalBonuses={character.active_conditional_bonuses || []}
          onRollComplete={(result) => {
            addRoll({
              type: 'attack',
              label: `Ataque: ${selectedWeapon.name}`,
              diceCount: result.dice.length,
              results: result.dice,
              bestResult: result.keptDice,
              bonus: result.skillBonus + result.otherBonuses,
              total: result.total,
              success: undefined,
              critical: result.isCritical,
              criticalFail: result.keptDice === 1,
              weaponName: selectedWeapon.name,
            });
          }}
        />
      )}

      {/* Modal de conjuração de ritual com bônus SUE e paridade desktop */}
      {selectedRitual && (
        <MobileRitualCastModal
          open={ritualCastModalOpen}
          onOpenChange={(open) => {
            setRitualCastModalOpen(open);
            if (!open) setSelectedRitual(null);
          }}
          ritual={selectedRitual}
          peCurrent={character.pe_current}
          peMax={character.pe_max}
          nex={character.nex}
          elementalAffinity={character.elemental_affinity}
          isNonOccultist={character.class !== 'Ocultista'}
          onConfirm={handleConfirmRitualCast}
          ritualBonuses={ritualBonuses}
          intellect={character.intellect}
          peLimitBonus={bonusSummary?.unifiedEffects?.computed?.resources?.peLimitBonus || 0}
        />
      )}

      {/* Modal de teste de resistência */}
      {resistanceConfig && (
        <MobileResistanceCheckModal
          open={resistanceModalOpen}
          onOpenChange={(open) => {
            setResistanceModalOpen(open);
            if (!open) setResistanceConfig(null);
          }}
          resistanceType={resistanceConfig.type}
          effect={resistanceConfig.effect || 'reduz_metade'}
          damage={resistanceConfig.damageOnFail}
          defaultDT={resistanceConfig.dt}
          targetAttributes={{
            vigor: character.vigor,
            agility: character.agility,
            presence: character.presence,
          }}
          ritualName={resistanceConfig.ritualName}
          ritualElement={resistanceConfig.ritualElement}
          ritualCircle={resistanceConfig.ritualCircle}
          appliesConditions={resistanceConfig.appliesConditions}
          onResult={(result, adjustedDamage) => {
            console.log('Resultado do teste:', result, adjustedDamage);
          }}
        />
      )}

      {/* ========== MODAIS DE PARIDADE DESKTOP/MOBILE ========== */}
      
      {/* Modal de seleção de poder paranormal (Transcender) */}
      <MobileParanormalPowerSelectModal
        open={paranormalPowerModalOpen}
        onOpenChange={setParanormalPowerModalOpen}
        characterPowers={(character.paranormal_powers || []).map(p => {
          // Busca os dados completos do poder no catálogo
          const fullPower = PARANORMAL_POWERS.find(pp => pp.id === p.id);
          return fullPower || {
            id: p.id,
            name: p.name,
            element: p.element as ParanormalElement | 'generic',
            description: p.description,
            effect: { type: 'special' as const, description: p.description },
          };
        })}
        elementalAffinity={character.elemental_affinity as ParanormalElement | null}
        affinityActive={character.affinity_active}
        onSelectPower={(power) => handleAddParanormalPower({
          id: power.id,
          name: power.name,
          element: power.element,
          description: power.description,
        })}
      />

      {/* ========== MODAIS DE PARIDADE DESKTOP ========== */}
      
      {/* Modal de Progressão de NEX */}
      <NexProgressionModal
        open={nexModalOpen}
        onClose={() => setNexModalOpen(false)}
        character={{
          id: character.id,
          name: character.name,
          class: character.class,
          class_track: character.class_track || null,
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
          rituals: character.rituals || [],
          abilities: character.abilities || [],
          skills: character.skills || {},
          // Converte paranormal_powers para o tipo esperado pelo NexProgressionModal
          // Usa unknown como intermediário para compatibilidade de tipos
          paranormal_powers: (character.paranormal_powers?.map(p => 
            getPowerById(p.id) || p
          ).filter(Boolean)) as unknown as ParanormalPower[] | undefined,
          elemental_affinity: character.elemental_affinity as ParanormalElement | null,
          affinity_active: character.affinity_active,
        }}
        onLevelUp={handleLevelUp}
      />

      {/* Modal de Edição do Personagem */}
      <CharacterEditModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          // Reset para aba padrão ao fechar
          setEditModalInitialTab('info');
        }}
        character={{
          id: character.id,
          name: character.name,
          player_name: null,
          age: null,
          gender: null,
          appearance: null,
          personality: null,
          background: null,
          notes: null,
          class: character.class,
          origin: character.origin,
          nex: character.nex,
          agility: character.agility,
          strength: character.strength,
          intellect: character.intellect,
          presence: character.presence,
          vigor: character.vigor,
          skills: character.skills || {},
          defense: character.defense,
          photo_url: character.photo_url || null,
          abilities: character.abilities || [],
        }}
        onSave={handleCharacterEdit}
        initialTab={editModalInitialTab}
      />

      {/* Modal de Descanso */}
      <RestModal
        open={restModalOpen}
        onOpenChange={setRestModalOpen}
        character={{
          hp_current: character.hp_current,
          hp_max: character.hp_max,
          pe_current: character.pe_current,
          pe_max: character.pe_max,
          san_current: character.san_current,
          san_max: character.san_max,
          vigor: character.vigor,
          presence: character.presence,
          conditions: character.conditions || [],
        }}
        onRest={async (newStats) => {
          // Adapta interface do RestModal para o handleCombatStatsChange
          await handleCombatStatsChange({
            hp: newStats.hp_current,
            pe: newStats.pe_current,
            san: newStats.san_current,
          });
          // Reseta rastreamento de "Primeira Impressão" (descanso = nova cena)
          primeiraImpressao.resetSceneTracking();
        }}
      />

      {/* Painel de Histórico de Alterações */}
      <CharacterHistoryPanel
        characterId={character.id}
        characterName={character.name}
      />

      {/* Modal de Seleção de Rituais (pós-progressão Ocultista) */}
      <RitualSelectionModal
        open={ritualModalOpen}
        onClose={() => setRitualModalOpen(false)}
        maxCircle={pendingMaxCircle}
        newSlots={pendingRitualSlots}
        currentRituals={character.rituals || []}
        onConfirm={handleRitualsConfirm}
      />

      {/* Wizard de Efeitos de Rituais Mobile */}
      {wizardRitual && (
        <MobileRitualEffectWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          ritual={wizardRitual}
          enhancements={wizardEnhancements}
          peCost={wizardPeCost}
          // Bônus do SUE para dano de rituais
          ritualDamageBonus={ritualBonuses.damageBonus}
          damageAttributeBonus={ritualBonuses.damageAttributeBonus}
          // Bônus de Cura de Origem (Agente de Saúde / Técnica Medicinal)
          healingBonusFromOrigin={ritualBonuses.healingBonusFromOrigin}
          healingBonusFromOriginSource={ritualBonuses.healingBonusFromOriginSource}
          targetAttributes={{
            vigor: character.vigor,
            agility: character.agility,
            presence: character.presence,
          }}
          onApplyDamage={handleWizardApplyDamage}
          onApplyHealing={handleWizardApplyHealing}
          onApplyConditions={handleWizardApplyConditions}
          onAddWeaponBuff={handleWizardAddWeaponBuff}
          onActivateSustained={handleWizardActivateSustained}
          onComplete={() => setWizardOpen(false)}
        />
      )}

      {/* Modal de Escolha de Perícias de Intelecto */}
      <IntellectSkillSelectModal
        open={intellectSkillModalOpen}
        onClose={() => setIntellectSkillModalOpen(false)}
        onConfirm={handleIntellectSkillConfirm}
        hasAffinity={character.elemental_affinity === 'conhecimento'}
        alreadyChosenSkills={[]}
      />

      {/* Modal de Escolha de Elemento de Resistência */}
      <ElementResistanceSelectModal
        open={elementResistanceModalOpen}
        onClose={() => setElementResistanceModalOpen(false)}
        onConfirm={handleElementResistanceConfirm}
        alreadyResistant={[]}
      />

      {/* Modal de Grau de Treinamento */}
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

      {/* Modal de Seleção de Arma para Origens (Operário - Ferramenta de Trabalho) */}
      <OriginWeaponBindingModal
        open={originWeaponModalOpen}
        onClose={() => setOriginWeaponModalOpen(false)}
        originId={character.origin?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-') || ''}
        weapons={normalizedInventory
          .filter(item => item.itemType === 'weapon')
          .map(item => ({
            id: item.id || '',
            name: item.name,
            category: (item as any).category || '0',
            damage: (item as any).damage || '1d6',
            damageType: (item as any).damageType,
            type: (item as any).weaponType,
            isEquipped: item.isEquipped,
          })) as BindableWeapon[]}
        currentBoundWeaponId={normalizedInventory.find(i => 
          i.favoriteAbilityId === 'ferramenta-de-trabalho'
        )?.id}
        onSelectWeapon={async (weaponId: string) => {
          // Remove binding anterior
          const updatedInventory = normalizedInventory.map(item => ({
            ...item,
            favoriteAbilityId: item.favoriteAbilityId === 'ferramenta-de-trabalho' 
              ? undefined 
              : item.favoriteAbilityId,
          }));
          
          // Aplica novo binding
          const targetIndex = updatedInventory.findIndex(i => i.id === weaponId);
          if (targetIndex >= 0) {
            updatedInventory[targetIndex] = {
              ...updatedInventory[targetIndex],
              favoriteAbilityId: 'ferramenta-de-trabalho',
            };
          }
          
          await handleInventoryChange(updatedInventory);
          toast.success('Ferramenta de Trabalho selecionada!');
        }}
      />

      {/* Modal de Correção de Perícias Faltantes */}
      {missingSkillsModalOpen && auditResult && (() => {
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
    </div>
  );
}
