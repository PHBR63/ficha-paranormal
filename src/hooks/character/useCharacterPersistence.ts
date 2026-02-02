/**
 * Hook de Persistência do Personagem
 * 
 * Centraliza todas as operações de persistência (save/update) do personagem
 * para evitar duplicidade de código em CharacterSheet.tsx
 * 
 * @module hooks/character/useCharacterPersistence
 */

import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  parseCondition, 
  serializeCondition,
  type PersistedCondition,
} from '@/lib/conditions/condition-serialization';
import { PARANORMAL_POWERS, type ParanormalPower, type ParanormalElement, type SavedParanormalPower } from '@/lib/paranormal-powers';
import type { ActiveCondition } from '@/components/character/ConditionManager';
import type { InventoryItem } from '@/lib/inventory-system';

// ==================== TIPOS ====================

/** Item de inventário no formato persistido */
export interface InventoryItemPersisted {
  id: string;
  name: string;
  category: number;
  quantity: number;
  spaces: number;
  equipped: boolean;
  notes?: string;
  damage?: string;
  criticalMultiplier?: number;
  criticalMargin?: number;
  range?: string;
  damageType?: string;
  armorDefenseBonus?: number;
  description?: string;
  uses?: number;
  maxUses?: number;
  consumable?: boolean;
  isTemporary?: boolean;
  temporarySource?: string;
}

/** Interface mínima do personagem para o hook */
export interface CharacterForPersistence {
  id: string;
  hp_max: number;
  hp_current: number;
  pe_current: number;
  san_current: number;
  paranormal_powers?: SavedParanormalPower[];
  conditions: (string | PersistedCondition)[];
  inventory: InventoryItemPersisted[];
}

/** Props do hook */
export interface UseCharacterPersistenceProps {
  characterId: string | undefined;
  character: CharacterForPersistence | null;
  setCharacter: React.Dispatch<React.SetStateAction<CharacterForPersistence | null>>;
  hpCurrent: number;
  setHpCurrent: (hp: number) => void;
  peCurrent: number;
  setPeCurrent: (pe: number) => void;
  sanCurrent: number;
  setSanCurrent: (san: number) => void;
  /** Handler de mudança de stats de combate já existente */
  handleCombatStatsChange: (stats: { hp: number; pe: number; san: number }) => Promise<void>;
}

// ==================== UTILITÁRIOS ====================

/**
 * Enriquece poderes paranormais salvos com dados completos do catálogo
 * Retorna os poderes completos do catálogo quando disponíveis
 */
export function enrichParanormalPowers(
  powers: SavedParanormalPower[] | null | undefined
): ParanormalPower[] {
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
}

/**
 * Parseia dados do personagem do banco para o formato do cliente
 */
export function parseCharacterData<T extends Record<string, unknown>>(data: T): T & {
  inventory: InventoryItemPersisted[];
  conditions: (string | PersistedCondition)[];
  abilities: string[];
  rituals: string[];
  class_track: string | null;
  elemental_affinity: string | null;
  affinity_active: boolean;
  active_buffs: unknown[];
  skill_training_choices: Record<string, unknown>;
} {
  // Parse inventory
  const inventory: InventoryItemPersisted[] = Array.isArray(data.inventory)
    ? (data.inventory as unknown as InventoryItemPersisted[])
    : [];
  
  return {
    ...data,
    inventory,
    // Suporta condições como string legado ou objeto completo
    conditions: Array.isArray(data.conditions) ? data.conditions as (string | PersistedCondition)[] : [],
    abilities: Array.isArray(data.abilities) ? (data.abilities as string[]) : [],
    rituals: Array.isArray(data.rituals) ? (data.rituals as string[]) : [],
    class_track: (data.class_track as string) || null,
    elemental_affinity: (data.elemental_affinity as string) || null,
    affinity_active: (data.affinity_active as boolean) || false,
    // Carrega buffs ativos da nuvem
    active_buffs: Array.isArray(data.active_buffs) ? data.active_buffs : [],
    // Carrega escolhas de Treinamento em Perícia
    skill_training_choices: (data as Record<string, unknown>).skill_training_choices as Record<string, unknown> || {},
  };
}

// ==================== HOOK PRINCIPAL ====================

/**
 * Hook que centraliza todas as operações de persistência do personagem
 * 
 * Inclui:
 * - Callbacks memoizados para atualização de PE, HP, condições, inventário
 * - Dados derivados memoizados (poderes enriquecidos, condições parseadas)
 * - Funções utilitárias de cura e remoção de poderes
 */
export function useCharacterPersistence({
  characterId,
  character,
  setCharacter,
  hpCurrent,
  setHpCurrent,
  peCurrent,
  setPeCurrent,
  sanCurrent,
  setSanCurrent,
  handleCombatStatsChange,
}: UseCharacterPersistenceProps) {
  const { toast } = useToast();
  
  // ==================== CALLBACKS MEMOIZADOS ====================

  /**
   * Handler memoizado para mudança de PE
   * Substitui os 15+ callbacks inline `onPEChange`
   */
  const handlePEChange = useCallback(
    (newPE: number) => {
      handleCombatStatsChange({ hp: hpCurrent, pe: newPE, san: sanCurrent });
    },
    [hpCurrent, sanCurrent, handleCombatStatsChange]
  );

  /**
   * Handler memoizado para mudança de HP
   */
  const handleHPChange = useCallback(
    (newHP: number) => {
      handleCombatStatsChange({ hp: newHP, pe: peCurrent, san: sanCurrent });
    },
    [peCurrent, sanCurrent, handleCombatStatsChange]
  );

  /**
   * Handler memoizado para mudança de delta de PE (ex: Infiltrador)
   */
  const handlePEDelta = useCallback(
    (delta: number) => {
      handleCombatStatsChange({ hp: hpCurrent, pe: peCurrent + delta, san: sanCurrent });
    },
    [hpCurrent, peCurrent, sanCurrent, handleCombatStatsChange]
  );

  /**
   * Atualiza condições no banco e estado local
   */
  const handleConditionsUpdate = useCallback(
    async (newConditions: ActiveCondition[]) => {
      if (!characterId) return;
      
      const serializedConditions = newConditions.map(serializeCondition);
      
      const { error } = await supabase
        .from('characters')
        .update({ conditions: JSON.parse(JSON.stringify(serializedConditions)) })
        .eq('id', characterId);

      if (error) {
        toast({
          title: 'Erro ao salvar condições',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setCharacter(prev => prev ? {
        ...prev,
        conditions: serializedConditions,
      } : null);
    },
    [characterId, setCharacter, toast]
  );

  /**
   * Adiciona novas condições (merge com existentes)
   */
  const handleAddConditions = useCallback(
    async (newConditions: ActiveCondition[], showToast = true) => {
      if (!character || !characterId) return;
      
      const existingConditions = (character.conditions || []).map(parseCondition);
      
      // Filtra duplicatas pelo ID
      const uniqueNew = newConditions.filter(
        nc => !existingConditions.some(ec => ec.id === nc.id)
      );
      
      if (uniqueNew.length === 0) return;
      
      const allConditions = [...existingConditions, ...uniqueNew];
      const serializedConditions = allConditions.map(serializeCondition);
      
      const { error } = await supabase
        .from('characters')
        .update({ conditions: JSON.parse(JSON.stringify(serializedConditions)) })
        .eq('id', characterId);

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

      if (showToast) {
        toast({
          title: 'Condições aplicadas!',
          description: uniqueNew.map(c => c.name).join(', '),
        });
      }
    },
    [character, characterId, setCharacter, toast]
  );

  /**
   * Atualiza inventário no banco e estado local
   */
  const handleInventoryUpdate = useCallback(
    async (updatedInventory: InventoryItemPersisted[]) => {
      if (!characterId) return;
      
      const { error } = await supabase
        .from('characters')
        .update({ inventory: JSON.parse(JSON.stringify(updatedInventory)) })
        .eq('id', characterId);

      if (!error) {
        setCharacter(prev => prev ? {
          ...prev,
          inventory: updatedInventory,
        } : null);
      }
      
      return { error };
    },
    [characterId, setCharacter]
  );

  /**
   * Aplica cura ao personagem
   */
  const handleApplyHealing = useCallback(
    async (amount: number, showToast = true): Promise<number> => {
      if (!character || !characterId) return hpCurrent;
      
      const newHp = Math.min(character.hp_max, hpCurrent + amount);
      setHpCurrent(newHp);
      setCharacter(prev => prev ? { ...prev, hp_current: newHp } : null);
      
      await supabase
        .from('characters')
        .update({ hp_current: newHp })
        .eq('id', characterId);
      
      if (showToast) {
        toast({
          title: `+${amount} PV recuperados!`,
          description: `PV atual: ${newHp}/${character.hp_max}`,
        });
      }
      
      return newHp;
    },
    [character, characterId, hpCurrent, setHpCurrent, setCharacter, toast]
  );

  /**
   * Remove poderes paranormais do personagem
   */
  const handleRemoveParanormalPowers = useCallback(
    async (powerIds: string[]) => {
      if (!character || !characterId) return;
      
      const updatedPowers = (character.paranormal_powers || []).filter(
        p => !powerIds.includes(p.id)
      );
      
      await supabase
        .from('characters')
        .update({ paranormal_powers: JSON.parse(JSON.stringify(updatedPowers)) })
        .eq('id', characterId);
      
      setCharacter(prev => prev ? {
        ...prev,
        paranormal_powers: updatedPowers,
      } : null);
    },
    [character, characterId, setCharacter]
  );

  // ==================== DADOS DERIVADOS MEMOIZADOS ====================

  /**
   * Poderes paranormais enriquecidos com dados do catálogo
   */
  const enrichedParanormalPowers = useMemo(
    () => enrichParanormalPowers(character?.paranormal_powers),
    [character?.paranormal_powers]
  );

  /**
   * Condições parseadas do formato persistido
   */
  const parsedConditions = useMemo(
    () => (character?.conditions || []).map(parseCondition),
    [character?.conditions]
  );

  // ==================== RETORNO ====================

  return {
    // Callbacks de stats
    handlePEChange,
    handleHPChange,
    handlePEDelta,
    
    // Callbacks de persistência
    handleConditionsUpdate,
    handleAddConditions,
    handleInventoryUpdate,
    handleApplyHealing,
    handleRemoveParanormalPowers,
    
    // Dados derivados memoizados
    enrichedParanormalPowers,
    parsedConditions,
  };
}
