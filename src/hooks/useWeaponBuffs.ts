/**
 * useWeaponBuffs - Hook para gerenciar buffs temporários em armas
 * Fase 5: Rituais como Amaldiçoar Arma aplicam buffs que aparecem na tabela de combate
 * Fase 8: Persistência via Supabase (nuvem) em vez de localStorage
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { RitualEffect, getActiveRitualEffect, formatDamageFormula, DamageFormula, Ritual } from '@/lib/rituals/legacy-exports';

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
  addBuffWithDuration: (ritual: Ritual, enhancements: string[], duration: 'cena' | 'sustentado' | 'rodadas', turnsRemaining?: number) => void;
  removeBuff: (buffId: string) => void;
  clearAllBuffs: () => void;
  // Sistema de rodadas
  advanceTurn: () => { expired: WeaponBuff[]; remaining: WeaponBuff[] };
  setBuffTurns: (buffId: string, turns: number) => void;
  // Contadores
  hasWeaponBuff: boolean;
  buffsWithTurns: WeaponBuff[]; // Buffs que têm contagem de rodadas
  // Totais agregados para aplicar em ataques
  totalAttackBonus: number;
  totalCriticalBonus: number;
  totalCriticalMultiplierBonus: number;
  allBonusDamage: DamageFormula[];
  // Formatado para UI
  buffsSummary: string;
  // Indica se houve auto-correção de buffs ao carregar
  hadAutoCorrections: boolean;
  clearAutoCorrectionsFlag: () => void;
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
 * Normaliza e valida bonusDamage de buffs carregados do banco
 * Corrige formatos incorretos ou incompletos que podem ter sido salvos
 */
function normalizeBuffBonusDamage(buff: WeaponBuff): WeaponBuff {
  // Se já tem bonusDamage válido, retorna sem modificar
  if (buff.bonusDamage && 
      typeof buff.bonusDamage.diceCount === 'number' && 
      typeof buff.bonusDamage.diceType === 'number') {
    return buff;
  }
  
  // Tenta recuperar de formatos alternativos que podem estar no objeto
  const anyBuff = buff as any;
  let normalizedBonusDamage: DamageFormula | undefined = undefined;
  
  // Verifica extraDice (formato do ritual-adapter)
  if (anyBuff.extraDice && typeof anyBuff.extraDice.count === 'number') {
    normalizedBonusDamage = {
      diceCount: anyBuff.extraDice.count || 1,
      diceType: anyBuff.extraDice.type || 6,
      damageType: anyBuff.damageType || buff.element as any,
    };
    console.log('[useWeaponBuffs] Buff normalizado via extraDice:', buff.ritualName, normalizedBonusDamage);
  }
  
  // Verifica damageBonus string (ex: "2d6")
  if (!normalizedBonusDamage && typeof anyBuff.damageBonus === 'string') {
    const match = anyBuff.damageBonus.match(/(\d+)d(\d+)(?:\+(\d+))?/i);
    if (match) {
      normalizedBonusDamage = {
        diceCount: parseInt(match[1]) || 1,
        diceType: parseInt(match[2]) || 6,
        bonus: match[3] ? parseInt(match[3]) : undefined,
        damageType: anyBuff.damageType || buff.element as any,
      };
      console.log('[useWeaponBuffs] Buff normalizado via damageBonus string:', buff.ritualName, normalizedBonusDamage);
    }
  }
  
  // Verifica se bonusDamage é uma string malformada (ex: salvo como "1d6" em vez de objeto)
  if (!normalizedBonusDamage && typeof buff.bonusDamage === 'string') {
    const match = (buff.bonusDamage as unknown as string).match(/(\d+)d(\d+)(?:\+(\d+))?/i);
    if (match) {
      normalizedBonusDamage = {
        diceCount: parseInt(match[1]) || 1,
        diceType: parseInt(match[2]) || 6,
        bonus: match[3] ? parseInt(match[3]) : undefined,
        damageType: buff.element as any,
      };
      console.log('[useWeaponBuffs] Buff normalizado de string malformada:', buff.ritualName, normalizedBonusDamage);
    }
  }
  
  // Se encontrou formato válido, retorna buff corrigido
  if (normalizedBonusDamage) {
    return {
      ...buff,
      bonusDamage: normalizedBonusDamage,
    };
  }
  
  // Se não conseguiu normalizar e deveria ter dano, loga warning
  if (!buff.bonusDamage && buff.ritualName?.toLowerCase().includes('amaldiçoar')) {
    console.warn('[useWeaponBuffs] Buff sem bonusDamage válido:', {
      ritualName: buff.ritualName,
      bonusDamage: buff.bonusDamage,
      element: buff.element,
    });
  }
  
  return buff;
}

/**
 * Processa buffs do banco: filtra expirados e normaliza bonusDamage
 */
function processLoadedBuffs(buffs: WeaponBuff[]): { 
  processed: WeaponBuff[]; 
  hadCorrections: boolean;
} {
  const filtered = filterExpiredBuffs(buffs);
  let hadCorrections = false;
  
  const processed = filtered.map(buff => {
    const normalized = normalizeBuffBonusDamage(buff);
    if (normalized !== buff) {
      hadCorrections = true;
    }
    return normalized;
  });
  
  return { processed, hadCorrections };
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
  const correctionsPersisted = useRef(false);
  
  // Estado para indicar que houve auto-correções (para UI)
  const [hadAutoCorrections, setHadAutoCorrections] = useState(false);
  
  // Inicializa estado com buffs do banco, processando e normalizando
  const [state, setState] = useState<WeaponBuffsState>(() => {
    if (!initialBuffs) return { activeBuffs: [] };
    
    const { processed, hadCorrections } = processLoadedBuffs(initialBuffs);
    
    // Se houve correções, marca para persistir depois e para exibir na UI
    if (hadCorrections) {
      correctionsPersisted.current = false;
    }
    
    return { activeBuffs: processed };
  });

  // Atualiza estado quando initialBuffs mudam (ex: reload do personagem)
  useEffect(() => {
    if (initialBuffs) {
      const { processed, hadCorrections } = processLoadedBuffs(initialBuffs);
      setState({ activeBuffs: processed });
      
      // Se houve correções, persiste imediatamente e marca para UI
      if (hadCorrections && onBuffsChange && !correctionsPersisted.current) {
        console.log('[useWeaponBuffs] Persistindo correções de buffs...');
        setHadAutoCorrections(true);
        onBuffsChange(processed);
        correctionsPersisted.current = true;
      } else {
        isInitialMount.current = true; // Reseta flag para não disparar onChange
      }
    }
  }, [initialBuffs, onBuffsChange]);
  
  // Função para limpar flag de auto-correções (para dismissar notificação)
  const clearAutoCorrectionsFlag = useCallback(() => {
    setHadAutoCorrections(false);
  }, []);

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

  // Adiciona um buff de ritual que afeta armas (duração padrão: cena)
  const addBuff = useCallback((ritual: Ritual, enhancements: string[]) => {
    const effect = getActiveRitualEffect(ritual.id, enhancements);
    
    // Só adiciona se o ritual tiver efeito de arma
    if (!effect?.weaponEffect) {
      return;
    }

    // Normaliza o dano extra para DamageFormula
    // Fontes possíveis (em ordem de prioridade):
    // 1. weaponEffect.bonusDamage (já no formato DamageFormula)
    // 2. weaponEffect.extraDice (gerado pelo ritual-adapter a partir de damageBonus string)
    // 3. weaponEffect.damageBonus (string como "2d6" - rituais do sistema unificado)
    let normalizedBonusDamage: DamageFormula | undefined = effect.weaponEffect.bonusDamage;

    const maybeExtraDice = (effect.weaponEffect as any).extraDice;
    const maybeDamageBonus = (effect.weaponEffect as any).damageBonus;
    const maybeDamageType = (effect.weaponEffect as any).damageType || effect.weaponEffect.damageType;

    // Tenta extraDice primeiro (formato do ritual-adapter)
    if (!normalizedBonusDamage && maybeExtraDice && typeof maybeExtraDice.count === 'number') {
      normalizedBonusDamage = {
        diceCount: maybeExtraDice.count || 1,
        diceType: maybeExtraDice.type || 6,
        damageType: maybeDamageType as unknown as DamageFormula['damageType'],
      };
      console.log('[useWeaponBuffs] Normalizado via extraDice:', normalizedBonusDamage);
    }

    // Fallback para damageBonus string (rituais do sistema unificado)
    if (!normalizedBonusDamage && typeof maybeDamageBonus === 'string') {
      const match = maybeDamageBonus.match(/(\d+)d(\d+)(?:\+(\d+))?/i);
      if (match) {
        normalizedBonusDamage = {
          diceCount: parseInt(match[1]) || 1,
          diceType: parseInt(match[2]) || 6,
          bonus: match[3] ? parseInt(match[3]) : undefined,
          damageType: maybeDamageType as unknown as DamageFormula['damageType'],
        };
        console.log('[useWeaponBuffs] Normalizado via damageBonus string:', normalizedBonusDamage);
      }
    }
    
    // Log de debug se nenhuma fonte foi encontrada
    if (!normalizedBonusDamage) {
      console.warn('[useWeaponBuffs] Nenhum bonusDamage encontrado para:', {
        ritualId: ritual.id,
        weaponEffect: effect.weaponEffect,
        bonusDamage: effect.weaponEffect.bonusDamage,
        extraDice: maybeExtraDice,
        damageBonus: maybeDamageBonus,
      });
    }

    const newBuff: WeaponBuff = {
      id: `${ritual.id}-${Date.now()}`,
      ritualId: ritual.id,
      ritualName: ritual.name,
      element: ritual.element,
      bonusDamage: normalizedBonusDamage,
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

  // Adiciona um buff com duração específica (permite definir rodadas)
  const addBuffWithDuration = useCallback((
    ritual: Ritual, 
    enhancements: string[], 
    duration: 'cena' | 'sustentado' | 'rodadas',
    turnsRemaining?: number
  ) => {
    const effect = getActiveRitualEffect(ritual.id, enhancements);
    
    // Só adiciona se o ritual tiver efeito de arma
    if (!effect?.weaponEffect) {
      return;
    }

    // Normaliza o dano extra para DamageFormula (mesma lógica do addBuff)
    // Fontes possíveis: bonusDamage, extraDice, damageBonus string
    let normalizedBonusDamage: DamageFormula | undefined = effect.weaponEffect.bonusDamage;

    const maybeExtraDice = (effect.weaponEffect as any).extraDice;
    const maybeDamageBonus = (effect.weaponEffect as any).damageBonus;
    const maybeDamageType = (effect.weaponEffect as any).damageType || effect.weaponEffect.damageType;

    // Tenta extraDice primeiro (formato do ritual-adapter)
    if (!normalizedBonusDamage && maybeExtraDice && typeof maybeExtraDice.count === 'number') {
      normalizedBonusDamage = {
        diceCount: maybeExtraDice.count || 1,
        diceType: maybeExtraDice.type || 6,
        damageType: maybeDamageType as unknown as DamageFormula['damageType'],
      };
    }

    // Fallback para damageBonus string
    if (!normalizedBonusDamage && typeof maybeDamageBonus === 'string') {
      const match = maybeDamageBonus.match(/(\d+)d(\d+)(?:\+(\d+))?/i);
      if (match) {
        normalizedBonusDamage = {
          diceCount: parseInt(match[1]) || 1,
          diceType: parseInt(match[2]) || 6,
          bonus: match[3] ? parseInt(match[3]) : undefined,
          damageType: maybeDamageType as unknown as DamageFormula['damageType'],
        };
      }
    }

    const newBuff: WeaponBuff = {
      id: `${ritual.id}-${Date.now()}`,
      ritualId: ritual.id,
      ritualName: ritual.name,
      element: ritual.element,
      bonusDamage: normalizedBonusDamage,
      attackBonus: effect.weaponEffect.attackBonus,
      criticalBonus: effect.weaponEffect.criticalBonus,
      criticalMultiplierBonus: effect.weaponEffect.criticalMultiplierBonus,
      appliedAt: new Date().toISOString(),
      duration,
      turnsRemaining: duration === 'rodadas' ? (turnsRemaining ?? 1) : undefined,
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

  // Avança uma rodada: decrementa turnsRemaining e remove buffs expirados
  const advanceTurn = useCallback((): { expired: WeaponBuff[]; remaining: WeaponBuff[] } => {
    const expired: WeaponBuff[] = [];
    const remaining: WeaponBuff[] = [];
    
    state.activeBuffs.forEach(buff => {
      // Se não é um buff de rodadas, mantém ativo
      if (buff.duration !== 'rodadas') {
        remaining.push(buff);
        return;
      }
      
      // Decrementa rodadas restantes
      const newTurns = (buff.turnsRemaining ?? 1) - 1;
      
      if (newTurns <= 0) {
        // Buff expirou
        expired.push(buff);
      } else {
        // Buff ainda tem rodadas restantes
        remaining.push({
          ...buff,
          turnsRemaining: newTurns,
        });
      }
    });
    
    // Atualiza estado com buffs restantes
    setState({ activeBuffs: remaining });
    
    return { expired, remaining };
  }, [state.activeBuffs]);

  // Define manualmente o número de rodadas de um buff
  const setBuffTurns = useCallback((buffId: string, turns: number) => {
    setState(prev => ({
      ...prev,
      activeBuffs: prev.activeBuffs.map(buff => 
        buff.id === buffId 
          ? { ...buff, turnsRemaining: Math.max(0, turns), duration: 'rodadas' as const }
          : buff
      ),
    }));
  }, []);

  // Buffs que têm contagem de rodadas (para exibição de UI)
  const buffsWithTurns = useMemo(() => 
    state.activeBuffs.filter(b => b.duration === 'rodadas'),
    [state.activeBuffs]
  );

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
      
      // Adiciona contagem de rodadas se aplicável
      if (buff.duration === 'rodadas' && buff.turnsRemaining !== undefined) {
        effects.push(`${buff.turnsRemaining} rodada(s)`);
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
    addBuffWithDuration,
    removeBuff,
    clearAllBuffs,
    advanceTurn,
    setBuffTurns,
    hasWeaponBuff: state.activeBuffs.length > 0,
    buffsWithTurns,
    ...aggregatedBonuses,
    buffsSummary,
    hadAutoCorrections,
    clearAutoCorrectionsFlag,
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
