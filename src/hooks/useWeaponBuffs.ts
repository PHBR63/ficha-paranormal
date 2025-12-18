/**
 * useWeaponBuffs - Hook para gerenciar buffs temporários em armas
 * Fase 5: Rituais como Amaldiçoar Arma aplicam buffs que aparecem na tabela de combate
 * Fase 8: Persistência via Supabase (nuvem) em vez de localStorage
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { RitualEffect, getActiveRitualEffect, formatDamageFormula, DamageFormula } from '@/lib/ritual-effects';
import { Ritual } from '@/lib/rituals-data';

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
 * Filtra buffs muito antigos (mais de 24h - provavelmente sessão expirada)
 */
function filterExpiredBuffs(buffs: WeaponBuff[]): WeaponBuff[] {
  const dayInMs = 24 * 60 * 60 * 1000;
  const now = Date.now();
  
  return buffs.filter(buff => {
    const appliedAt = new Date(buff.appliedAt).getTime();
    return now - appliedAt < dayInMs;
  });
}

/**
 * Hook para gerenciar buffs de armas de rituais com persistência na nuvem
 * @param characterId - ID do personagem (não usado diretamente, mantido para compatibilidade)
 * @param initialBuffs - Buffs carregados do banco de dados
 * @param onBuffsChange - Callback para persistir mudanças no banco
 */
export function useWeaponBuffs(
  characterId?: string,
  initialBuffs?: WeaponBuff[],
  onBuffsChange?: (buffs: WeaponBuff[]) => void
): UseWeaponBuffsReturn {
  // Ref para evitar chamadas desnecessárias ao onBuffsChange
  const isInitialMount = useRef(true);
  
  // Inicializa estado com buffs do banco, filtrando expirados
  const [state, setState] = useState<WeaponBuffsState>(() => ({
    activeBuffs: initialBuffs ? filterExpiredBuffs(initialBuffs) : [],
  }));

  // Atualiza estado quando initialBuffs mudam (ex: reload do personagem)
  useEffect(() => {
    if (initialBuffs) {
      const filteredBuffs = filterExpiredBuffs(initialBuffs);
      setState({ activeBuffs: filteredBuffs });
      isInitialMount.current = true; // Reseta flag para não disparar onChange
    }
  }, [initialBuffs]);

  // Persiste buffs quando mudam (exceto na montagem inicial)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (onBuffsChange) {
      onBuffsChange(state.activeBuffs);
    }
  }, [state.activeBuffs, onBuffsChange]);

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
      appliedAt: new Date().toISOString(),
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
  // REGRA OFICIAL: Rituais NÃO acumulam entre si - usa o MAIOR
  const aggregatedBonuses = useMemo(() => {
    const { activeBuffs } = state;
    
    // Coleta todos os valores de cada tipo
    const attackBonuses = activeBuffs.map(b => b.attackBonus || 0);
    const criticalBonuses = activeBuffs.map(b => b.criticalBonus || 0);
    const criticalMultiplierBonuses = activeBuffs.map(b => b.criticalMultiplierBonus || 0);
    const allBonusDamage: DamageFormula[] = [];

    // Usa o MAIOR de cada tipo (rituais não acumulam)
    const totalAttackBonus = attackBonuses.length > 0 ? Math.max(...attackBonuses) : 0;
    const totalCriticalBonus = criticalBonuses.length > 0 ? Math.max(...criticalBonuses) : 0;
    const totalCriticalMultiplierBonus = criticalMultiplierBonuses.length > 0 ? Math.max(...criticalMultiplierBonuses) : 0;
    
    // Dano extra: também usa apenas o maior dado
    // Se tiver múltiplos buffs de dano, usa o de maior dice count * dice type
    activeBuffs.forEach(buff => {
      if (buff.bonusDamage) allBonusDamage.push(buff.bonusDamage);
    });
    
    // Ordena por "potência" e pega apenas o maior
    const sortedDamage = allBonusDamage.sort((a, b) => {
      const powerA = (a.diceCount || 1) * (a.diceType || 0);
      const powerB = (b.diceCount || 1) * (b.diceType || 0);
      return powerB - powerA;
    });
    
    const bestDamage = sortedDamage.length > 0 ? [sortedDamage[0]] : [];

    return {
      totalAttackBonus,
      totalCriticalBonus,
      totalCriticalMultiplierBonus,
      allBonusDamage: bestDamage,
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
