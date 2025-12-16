/**
 * useWeaponBuffs - Hook para gerenciar buffs temporários em armas
 * Fase 5: Rituais como Amaldiçoar Arma aplicam buffs que aparecem na tabela de combate
 * Fase 7: Persistência via localStorage para sobreviver reload
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { RitualEffect, getActiveRitualEffect, formatDamageFormula, DamageFormula } from '@/lib/ritual-effects';
import { Ritual } from '@/lib/rituals-data';

// Chave base para localStorage
const STORAGE_KEY_PREFIX = 'weapon-buffs-';

// Interface para buff de arma ativo
export interface WeaponBuff {
  id: string;
  ritualId: string;
  ritualName: string;
  element: string;
  // Efeitos da arma
  bonusDamage?: DamageFormula;
  attackBonus?: number;
  criticalBonus?: number;
  criticalMultiplierBonus?: number;
  // Metadados
  appliedAt: string; // ISO string para serialização
  duration: 'cena' | 'sustentado' | 'rodadas';
  turnsRemaining?: number;
  enhancements: string[];
}

// Interface para estado do sistema de buffs
interface WeaponBuffsState {
  activeBuffs: WeaponBuff[];
}

// Interface de retorno do hook
interface UseWeaponBuffsReturn {
  activeBuffs: WeaponBuff[];
  addBuff: (ritual: Ritual, enhancements: string[]) => void;
  removeBuff: (buffId: string) => void;
  clearAllBuffs: () => void;
  hasWeaponBuff: boolean;
  // Totais agregados para aplicar em ataques
  totalAttackBonus: number;
  totalCriticalBonus: number;
  totalCriticalMultiplierBonus: number;
  allBonusDamage: DamageFormula[];
  // Formatado para UI
  buffsSummary: string;
}

/**
 * Carrega buffs do localStorage para um personagem específico
 */
function loadBuffsFromStorage(characterId: string): WeaponBuff[] {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${characterId}`);
    if (!stored) return [];
    
    const buffs: WeaponBuff[] = JSON.parse(stored);
    
    // Filtra buffs muito antigos (mais de 24h - provavelmente sessão expirada)
    const dayInMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    return buffs.filter(buff => {
      const appliedAt = new Date(buff.appliedAt).getTime();
      return now - appliedAt < dayInMs;
    });
  } catch (error) {
    console.error('Erro ao carregar buffs do localStorage:', error);
    return [];
  }
}

/**
 * Salva buffs no localStorage para um personagem específico
 */
function saveBuffsToStorage(characterId: string, buffs: WeaponBuff[]): void {
  try {
    if (buffs.length === 0) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${characterId}`);
    } else {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${characterId}`, JSON.stringify(buffs));
    }
  } catch (error) {
    console.error('Erro ao salvar buffs no localStorage:', error);
  }
}

/**
 * Hook para gerenciar buffs de armas de rituais com persistência
 * @param characterId - ID do personagem para persistência isolada
 */
export function useWeaponBuffs(characterId?: string): UseWeaponBuffsReturn {
  // Inicializa estado com buffs do localStorage se characterId fornecido
  const [state, setState] = useState<WeaponBuffsState>(() => ({
    activeBuffs: characterId ? loadBuffsFromStorage(characterId) : [],
  }));

  // Recarrega buffs quando characterId muda
  useEffect(() => {
    if (characterId) {
      const loadedBuffs = loadBuffsFromStorage(characterId);
      setState({ activeBuffs: loadedBuffs });
    }
  }, [characterId]);

  // Persiste buffs quando mudam
  useEffect(() => {
    if (characterId) {
      saveBuffsToStorage(characterId, state.activeBuffs);
    }
  }, [characterId, state.activeBuffs]);

  // Adiciona um buff de ritual que afeta armas
  const addBuff = useCallback((ritual: Ritual, enhancements: string[]) => {
    const effect = getActiveRitualEffect(ritual.id, enhancements);
    
    // Só adiciona se o ritual tiver efeito de arma
    if (!effect?.weaponEffect) {
      return;
    }

    const newBuff: WeaponBuff = {
      id: `${ritual.id}-${Date.now()}`,
      ritualId: ritual.id,
      ritualName: ritual.name,
      element: ritual.element,
      bonusDamage: effect.weaponEffect.bonusDamage,
      attackBonus: effect.weaponEffect.attackBonus,
      criticalBonus: effect.weaponEffect.criticalBonus,
      criticalMultiplierBonus: effect.weaponEffect.criticalMultiplierBonus,
      appliedAt: new Date().toISOString(), // ISO string para serialização
      duration: 'cena',
      enhancements,
    };

    setState(prev => ({
      ...prev,
      activeBuffs: [...prev.activeBuffs, newBuff],
    }));
  }, []);

  // Remove um buff específico
  const removeBuff = useCallback((buffId: string) => {
    setState(prev => ({
      ...prev,
      activeBuffs: prev.activeBuffs.filter(b => b.id !== buffId),
    }));
  }, []);

  // Limpa todos os buffs (ex: fim de cena)
  const clearAllBuffs = useCallback(() => {
    setState({ activeBuffs: [] });
  }, []);

  // Calcula totais agregados de todos os buffs ativos
  const aggregatedBonuses = useMemo(() => {
    const { activeBuffs } = state;
    
    let totalAttackBonus = 0;
    let totalCriticalBonus = 0;
    let totalCriticalMultiplierBonus = 0;
    const allBonusDamage: DamageFormula[] = [];

    activeBuffs.forEach(buff => {
      if (buff.attackBonus) totalAttackBonus += buff.attackBonus;
      if (buff.criticalBonus) totalCriticalBonus += buff.criticalBonus;
      if (buff.criticalMultiplierBonus) totalCriticalMultiplierBonus += buff.criticalMultiplierBonus;
      if (buff.bonusDamage) allBonusDamage.push(buff.bonusDamage);
    });

    return {
      totalAttackBonus,
      totalCriticalBonus,
      totalCriticalMultiplierBonus,
      allBonusDamage,
    };
  }, [state.activeBuffs]);

  // Resumo textual dos buffs para UI
  const buffsSummary = useMemo(() => {
    if (state.activeBuffs.length === 0) return '';
    
    const parts: string[] = [];
    
    state.activeBuffs.forEach(buff => {
      const effects: string[] = [];
      
      if (buff.bonusDamage) {
        effects.push(`+${formatDamageFormula(buff.bonusDamage)}`);
      }
      if (buff.attackBonus) {
        effects.push(`+${buff.attackBonus} ataque`);
      }
      if (buff.criticalBonus) {
        effects.push(`-${buff.criticalBonus} margem crítico`);
      }
      if (buff.criticalMultiplierBonus) {
        effects.push(`+${buff.criticalMultiplierBonus} mult. crítico`);
      }
      
      if (effects.length > 0) {
        parts.push(`${buff.ritualName}: ${effects.join(', ')}`);
      }
    });
    
    return parts.join(' | ');
  }, [state.activeBuffs]);

  return {
    activeBuffs: state.activeBuffs,
    addBuff,
    removeBuff,
    clearAllBuffs,
    hasWeaponBuff: state.activeBuffs.length > 0,
    ...aggregatedBonuses,
    buffsSummary,
  };
}

// Tipo do elemento de buff para cores na UI
export const ELEMENT_BUFF_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Sangue: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  Morte: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
  Conhecimento: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50' },
  Energia: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
  Medo: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' },
};
