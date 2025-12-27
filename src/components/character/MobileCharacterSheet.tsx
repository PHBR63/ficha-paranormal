/**
 * MobileCharacterSheet - Versão compacta da ficha para dispositivos móveis
 * Usa abas deslizantes e layout otimizado para telas pequenas
 * Inclui sistema de auditoria automática integrado
 * 
 * IDs centralizados em: src/lib/constants/game-ids.ts
 * NOTA: O mapeamento de perícias aceita nomes com acentos para compatibilidade
 * 
 * REFATORADO: Usa componentes extraídos de ./mobile para melhor manutenção
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, 
  Package,
  ChevronRight,
} from 'lucide-react';
import { MobileInventorySheet } from '@/components/inventory/MobileInventorySheet';
import type { ExtendedInventoryItem } from '@/components/inventory/InventoryPanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ORIGINS, getTrackById } from '@/lib/character-data';
import { PowerDetailModal, PowerDetailData } from './PowerDetailModal';
import { ALL_RITUALS } from '@/lib/rituals/legacy-exports';
import { useDefenseBonuses } from '@/hooks/useDefenseBonuses';
// Hook consolidado do SUE - fonte única de verdade para todos os bônus
import { useBonusSummaryFromSUE } from '@/hooks/useBonusSummaryFromSUE';
import { useSustainedRituals } from '@/hooks/useSustainedRituals';
import { MobileAuditBanner } from './MobileAuditBanner';
import { ExcessPowersRemovalModal } from './ExcessPowersRemovalModal';
import { ExcessRitualsRemovalModal } from './ExcessRitualsRemovalModal';
import { RemovedPowersHistory } from './RemovedPowersHistory';
import { IncompleteDataBanner } from './IncompleteDataBanner';
import { getOcultistRituals } from '@/lib/character-data';
import { useCharacterAudit } from '@/hooks/useCharacterAudit';
import { CharacterForAudit, getMaxParanormalPowers } from '@/lib/character-audit-engine';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SavedParanormalPower, PARANORMAL_POWERS, ParanormalElement } from '@/lib/paranormal-powers';
import { useAttributeValidation, logAttributeDiagnostics } from '@/hooks/useAttributeValidation';

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
  // Novos componentes de paridade desktop/mobile
  MobileConditionManager,
  MobileSustainedRitualsPanel,
  MobileConditionalBonusesPanel,
  MobileAffinitySelectorCard,
  MobileRitualCastHistory,
  MobileActiveEffectsPanel,
  MobileParanormalPowerSelectModal,
  MobileLeadershipPanel,
  MobileGuerreiroPanel,
  MobileOperacoesEspeciaisPanel,
  MobileTropaDeChoquePanel,
  MobileAtiradorDeElitePanel,
  MobileInfiltradorPanel,
  MobileMedicoDeCampoPanel,
  MobileNegociadorPanel,
  MobileTecnicoPanel,
  MobileAniquiladorPanel,
  MobileTrackPassiveEffectsWidget,
  type WeaponEntry,
  type BonusSource,
  type ActiveCondition,
} from './mobile';

// Utilitários compartilhados
import {
  getSkillAttributeAbbrev,
  getItemIcon,
} from './mobile/utils';

// Inferência de tipo de arma (corrige pistola como corpo a corpo)
import { normalizeWeaponTypeForDisplay } from '@/lib/weapon-type-inference';

import { useWeaponBuffs } from '@/hooks/useWeaponBuffs';
import { useUnifiedEffects } from '@/hooks/useUnifiedEffects';
import { useRoundTracking } from '@/hooks/useRoundTracking';
import { useActivatedEffects } from '@/hooks/useActivatedEffects';

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
    inventory?: Array<{ id?: string; name: string; category: string; slots: number; itemType?: string; isEquipped?: boolean; equipSlot?: string; armorType?: string }>;
    // Bônus condicionais ativos (persistidos no banco)
    active_conditional_bonuses?: string[];
    // Campos de afinidade elemental
    elemental_affinity?: string | null;
    affinity_active?: boolean;
    // Buffs ativos em armas
    active_buffs?: Array<{ weaponId: string; buffType: string; turnsRemaining: number }>;
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
  } | null>(null);
  
  // Estados dos novos componentes de paridade desktop/mobile
  const [paranormalPowerModalOpen, setParanormalPowerModalOpen] = useState(false);
  const [ritualHistoryOpen, setRitualHistoryOpen] = useState(false);
  
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

  // Calcula limite de poderes paranormais
  const powerLimits = useMemo(() => 
    getMaxParanormalPowers(character.nex, character.origin), 
    [character.nex, character.origin]
  );
  const hasExcessPowers = (character.paranormal_powers?.length || 0) > powerLimits.total;

  // Calcula limite de rituais para Ocultistas
  const ritualLimits = useMemo(() => {
    if (character.class !== 'Ocultista') return null;
    return getOcultistRituals(character.nex);
  }, [character.class, character.nex]);

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

  // Hook de autenticação para obter userId
  const { user } = useAuth();

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
  const { rituals: sustainedRituals } = useSustainedRituals({
    characterId: character?.id,
    enabled: !!character,
  });

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
    elementalAffinity: null,
    affinityActive: false,
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
  });

  // Defesa total com TODOS os bônus (origem, habilidades, poderes, paranormais, rituais)
  const totalDefense = character.defense + bonusSummary.defense.total;

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
  const normalizedInventory: ExtendedInventoryItem[] = useMemo(() => 
    (character.inventory || []).map(item => ({
      id: item.id || crypto.randomUUID(),
      name: item.name,
      category: item.category as '0' | 'I' | 'II' | 'III' | 'IV',
      slots: item.slots || 1,
      quantity: 1,
      itemType: (item.itemType as 'weapon' | 'armor' | 'consumable' | 'misc') || 'misc',
      isEquipped: item.isEquipped,
      equipSlot: item.equipSlot as any,
      armorType: item.armorType as any,
    })),
  [character.inventory]);

  // Hook de buffs de armas
  const { activeBuffs: weaponBuffs } = useWeaponBuffs(character.id);

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
        
        return {
          id: item.id,
          name: item.name,
          type: displayType,
          damage: weaponData.damage || '1d6',
          criticalRange: weaponData.criticalRange || 20,
          criticalMultiplier: weaponData.criticalMultiplier || 2,
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

  // Handler para rolagem de perícia (abre modal de dados)
  const handleSkillRoll = useCallback((skillName: string) => {
    const skillBonus = character.skills?.[skillName.toLowerCase()] || 0;
    const skillAttr = getSkillAttributeAbbrev(skillName);
    const attrValue = {
      'AGI': character.agility,
      'FOR': character.strength,
      'INT': character.intellect,
      'PRE': character.presence,
      'VIG': character.vigor,
    }[skillAttr] || 1;
    
    // Busca bônus do SUE para esta perícia
    const sueBonuses: BonusSource[] = [];
    if (unifiedEffects?.computed?.skills) {
      const skillsMap = unifiedEffects.computed.skills;
      const skillKey = skillName.toLowerCase();
      if (skillsMap[skillKey] && typeof skillsMap[skillKey] === 'number') {
        const skillEffect = skillsMap[skillKey] as number;
        if (skillEffect > 0) {
          sueBonuses.push({ 
            label: 'Efeitos Ativos', 
            value: skillEffect,
            type: 'other',
          });
        }
      }
    }
    
    setDiceModalConfig({
      skillName,
      pool: attrValue,
      bonus: skillBonus,
      bonusSources: [
        { label: 'Treinamento', value: skillBonus, type: 'skill' as const },
        ...sueBonuses,
      ].filter(b => b.value !== 0),
    });
    setDiceModalOpen(true);
  }, [character, unifiedEffects]);

  // Handler para abrir conjuração de ritual
  const handleCastRitual = useCallback((ritualId: string) => {
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

  // Wrapper para onRefetch que retorna Promise<void>
  const handleRefetchForBanner = useCallback(async () => {
    if (onRefetch) {
      await onRefetch();
    }
  }, [onRefetch]);

  // Handler para rolar iniciativa (usado pelo MobileOverviewTab)
  const handleRollInitiative = useCallback(() => {
    setDiceModalConfig({
      skillName: 'Iniciativa',
      pool: character.agility,
      bonus: 0,
      bonusSources: [],
    });
    setDiceModalOpen(true);
  }, [character.agility]);

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
            affinity_active: false 
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

  // Verifica se pode transcender (tem slots disponíveis)
  const canTranscend = useMemo(() => {
    const currentCount = character.paranormal_powers?.length || 0;
    return currentCount < powerLimits.total;
  }, [character.paranormal_powers, powerLimits.total]);

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
              defenseBonuses={defenseBonuses}
              equippedWeapons={equippedWeapons}
              weaponBuffs={weaponBuffs}
              rollHistory={rollHistory}
              attributeValidation={attributeValidation}
              onOpenDiceRoller={onOpenDiceRoller}
              onOpenRest={onOpenRest}
              onLevelUp={onLevelUp}
              onEditStats={onEditStats}
              onOpenCombat={handleOpenCombat}
              onRollInitiative={handleRollInitiative}
              onClearHistory={clearHistory}
              onRemoveRoll={removeRoll}
              onConditionsChange={handleConditionsChange}
              onDamageFromCondition={handleConditionDamage}
              onCharacterDeath={handleCharacterDeath}
            />
            
            {/* Seletor de Afinidade Elemental (NEX 50+) */}
            {character.nex >= 50 && !character.elemental_affinity && (
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
            
            {/* Painel de Liderança - Comandante de Campo */}
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
            
            {/* Painel Aniquilador - Técnicas Secretas */}
            <MobileAniquiladorPanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              onPEChange={handlePEChange}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
            />
            
            {/* Painel Guerreiro - Revidar e Força Opressora */}
            <MobileGuerreiroPanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              onPEChange={handlePEChange}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
            />
            
            {/* Painel Operações Especiais - Ataque Extra e Surto de Adrenalina */}
            <MobileOperacoesEspeciaisPanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              onPEChange={handlePEChange}
              usedAbilitiesThisRound={roundTracking.usedAbilitiesThisRound}
              onAbilityUsed={roundTracking.markAbilityUsed}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
            />
            
            {/* Painel Tropa de Choque - Cai Dentro e Duro de Matar */}
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
            />
            
            {/* Painel Atirador de Elite */}
            <MobileAtiradorDeElitePanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              intellect={character.intellect}
              onPEChange={handlePEChange}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
            />

            {/* Painel Infiltrador */}
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
            />

            {/* Painel Médico de Campo */}
            <MobileMedicoDeCampoPanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              onPEChange={handlePEChange}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
            />

            {/* Painel Negociador */}
            <MobileNegociadorPanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              onPEChange={handlePEChange}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
            />
            
            {/* Painel Técnico */}
            <MobileTecnicoPanel
              classTrack={character.class_track}
              nex={character.nex}
              peCurrent={character.pe_current}
              onPEChange={handlePEChange}
              attributes={{
                strength: character.strength,
                intellect: character.intellect
              }}
              onActivateEffect={activatedEffects.activateEffect}
              isEffectActive={activatedEffects.isEffectActive}
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
            paranormalPowers={character.paranormal_powers}
            generalPowers={character.general_powers}
            originPowers={character.powers}
            rituals={character.rituals}
            powerLimits={powerLimits}
            ritualLimits={ritualLimits}
            hasExcessPowers={hasExcessPowers}
            hasExcessRituals={hasExcessRituals}
            onPowerClick={handlePowerClick}
            onOpenExcessPowersModal={() => setExcessPowersModalOpen(true)}
            onOpenExcessRitualsModal={() => setExcessRitualsModalOpen(true)}
            onOpenRemovedPowersHistory={() => setRemovedPowersHistoryOpen(true)}
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
      />

      {/* ========== MODAIS DE COMBATE MOBILE ========== */}
      
      {/* Modal de rolagem de dados genérica */}
      <MobileDiceRollModal
        open={diceModalOpen}
        onClose={() => {
          setDiceModalOpen(false);
          setDiceModalConfig(null);
        }}
        label={diceModalConfig?.skillName || 'Rolagem'}
        attributeValue={diceModalConfig?.pool || 1}
        skillBonus={diceModalConfig?.bonus}
        bonusSources={diceModalConfig?.bonusSources}
        onRollComplete={(result) => {
          const isInitiative = diceModalConfig?.skillName === 'Iniciativa';
          addRoll({
            type: isInitiative ? 'initiative' : 'skill',
            label: diceModalConfig?.skillName || 'Rolagem',
            diceCount: result.dice.length,
            results: result.dice,
            bestResult: result.keptDice,
            bonus: result.skillBonus + result.otherBonuses,
            total: result.total,
            success: undefined,
            critical: result.isCritical,
            criticalFail: result.keptDice === 1,
            skillName: diceModalConfig?.skillName,
          });
        }}
      />

      {/* Modal de combate completo (ataque + dano) */}
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
          weaponBuffs={weaponBuffs}
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

      {/* Modal de conjuração de ritual */}
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
          onConfirm={async (_ritual, peCost, _enhancements) => {
            await handlePEChange(character.pe_current - peCost);
          }}
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
          effect="reduz_metade"
          damage={resistanceConfig.damageOnFail}
          defaultDT={resistanceConfig.dt}
          targetAttributes={{
            vigor: character.vigor,
            agility: character.agility,
            presence: character.presence,
          }}
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
    </div>
  );
}
