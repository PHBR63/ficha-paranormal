/**
 * useCombatWeaponBuffs - Hook para sincronizar buffs de arma com o CombatTracker
 * 
 * Fase 9: Automação completa de buffs de arma que expiram por turno
 * - Decrementação automática no avanço de turno do combate
 * - Sincronização com combatentes vinculados a personagens
 * - Notificações de buffs expirando
 * 
 * @module hooks/combat/useCombatWeaponBuffs
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { WeaponBuff } from '@/hooks/useWeaponBuffs';
import type { CombatantState } from '@/lib/game-engine';

// Interface para buffs de um combatente específico
export interface CombatantWeaponBuffs {
  combatantId: string;
  combatantName: string;
  characterId?: string;
  buffs: WeaponBuff[];
  totalAttackBonus: number;
  totalCriticalBonus: number;
  hasTurnBasedBuffs: boolean;
}

// Interface para resultado de avanço de turno
export interface TurnAdvanceBuffResult {
  combatantId: string;
  combatantName: string;
  expired: WeaponBuff[];
  remaining: WeaponBuff[];
  messages: string[];
}

// Props para o hook
export interface UseCombatWeaponBuffsProps {
  combatants: CombatantState[];
  currentRound: number;
  isActive: boolean;
  // Mapa de characterId -> buffs e funções de controle
  characterBuffsMap: Map<string, {
    buffs: WeaponBuff[];
    advanceTurn: () => { expired: WeaponBuff[]; remaining: WeaponBuff[] };
    setBuffTurns: (buffId: string, turns: number) => void;
    removeBuff: (buffId: string) => void;
  }>;
  // Callback para notificar mudanças (opcional)
  onBuffsExpired?: (results: TurnAdvanceBuffResult[]) => void;
}

// Interface de retorno
export interface UseCombatWeaponBuffsReturn {
  /** Buffs agregados por combatente */
  combatantBuffs: CombatantWeaponBuffs[];
  /** Avança turno de todos os buffs de combatentes */
  advanceAllBuffTurns: () => TurnAdvanceBuffResult[];
  /** Avança turno apenas do combatente atual */
  advanceCurrentCombatantBuffs: (combatantId: string) => TurnAdvanceBuffResult | null;
  /** Verifica se há buffs com contagem de turnos no combate */
  hasTurnBasedBuffsInCombat: boolean;
  /** Total de buffs ativos no combate */
  totalActiveBuffs: number;
  /** Resumo formatado de buffs por combatente */
  buffsSummary: string;
  /** Obtém buffs de um combatente específico */
  getBuffsForCombatant: (combatantId: string) => CombatantWeaponBuffs | undefined;
}

/**
 * Hook para gerenciar sincronização de weapon buffs com o combat tracker
 */
export function useCombatWeaponBuffs({
  combatants,
  currentRound,
  isActive,
  characterBuffsMap,
  onBuffsExpired,
}: UseCombatWeaponBuffsProps): UseCombatWeaponBuffsReturn {
  // Ref para rastrear última rodada processada (evita duplicação)
  const lastProcessedRound = useRef<number>(0);
  
  // Mapeia combatentes para seus buffs
  const combatantBuffs = useMemo((): CombatantWeaponBuffs[] => {
    return combatants
      .filter(c => c.characterId) // Apenas combatentes com personagem vinculado
      .map(combatant => {
        const charData = characterBuffsMap.get(combatant.characterId!);
        
        if (!charData) {
          return {
            combatantId: combatant.id,
            combatantName: combatant.name,
            characterId: combatant.characterId,
            buffs: [],
            totalAttackBonus: 0,
            totalCriticalBonus: 0,
            hasTurnBasedBuffs: false,
          };
        }
        
        const { buffs } = charData;
        
        // Calcula bônus agregados (regra: não acumula, usa maior)
        const attackBonuses = buffs.map(b => b.attackBonus || 0);
        const criticalBonuses = buffs.map(b => b.criticalBonus || 0);
        
        return {
          combatantId: combatant.id,
          combatantName: combatant.name,
          characterId: combatant.characterId,
          buffs,
          totalAttackBonus: attackBonuses.length > 0 ? Math.max(...attackBonuses) : 0,
          totalCriticalBonus: criticalBonuses.length > 0 ? Math.max(...criticalBonuses) : 0,
          hasTurnBasedBuffs: buffs.some(b => b.duration === 'rodadas'),
        };
      })
      .filter(cb => cb.buffs.length > 0); // Remove combatentes sem buffs
  }, [combatants, characterBuffsMap]);
  
  // Verifica se há buffs com turnos no combate
  const hasTurnBasedBuffsInCombat = useMemo(() => 
    combatantBuffs.some(cb => cb.hasTurnBasedBuffs),
    [combatantBuffs]
  );
  
  // Total de buffs ativos
  const totalActiveBuffs = useMemo(() => 
    combatantBuffs.reduce((sum, cb) => sum + cb.buffs.length, 0),
    [combatantBuffs]
  );
  
  // Resumo formatado
  const buffsSummary = useMemo(() => {
    if (combatantBuffs.length === 0) return '';
    
    return combatantBuffs
      .map(cb => {
        const turnBuffs = cb.buffs.filter(b => b.duration === 'rodadas');
        if (turnBuffs.length === 0) return `${cb.combatantName}: ${cb.buffs.length} buff(s)`;
        
        const turnsInfo = turnBuffs.map(b => `${b.ritualName} (${b.turnsRemaining} rodada(s))`).join(', ');
        return `${cb.combatantName}: ${turnsInfo}`;
      })
      .join(' | ');
  }, [combatantBuffs]);
  
  // Avança turnos de TODOS os combatentes
  const advanceAllBuffTurns = useCallback((): TurnAdvanceBuffResult[] => {
    const results: TurnAdvanceBuffResult[] = [];
    
    combatants.forEach(combatant => {
      if (!combatant.characterId) return;
      
      const charData = characterBuffsMap.get(combatant.characterId);
      if (!charData || charData.buffs.length === 0) return;
      
      // Só processa buffs com duração em rodadas
      const turnBasedBuffs = charData.buffs.filter(b => b.duration === 'rodadas');
      if (turnBasedBuffs.length === 0) return;
      
      const { expired, remaining } = charData.advanceTurn();
      
      const messages: string[] = [];
      
      if (expired.length > 0) {
        messages.push(`⏰ ${combatant.name}: ${expired.map(b => b.ritualName).join(', ')} expirou(aram)`);
      }
      
      const remainingTurnBuffs = remaining.filter(b => b.duration === 'rodadas');
      if (remainingTurnBuffs.length > 0) {
        const info = remainingTurnBuffs.map(b => `${b.ritualName} (${b.turnsRemaining})`).join(', ');
        messages.push(`🔮 ${combatant.name}: ${info} restante(s)`);
      }
      
      results.push({
        combatantId: combatant.id,
        combatantName: combatant.name,
        expired,
        remaining,
        messages,
      });
    });
    
    // Notifica callback se houver buffs expirados
    if (onBuffsExpired && results.some(r => r.expired.length > 0)) {
      onBuffsExpired(results);
    }
    
    // Exibe toasts para buffs expirados
    results.forEach(result => {
      if (result.expired.length > 0) {
        toast.warning(`Buffs expirados: ${result.combatantName}`, {
          description: result.expired.map(b => b.ritualName).join(', '),
          duration: 4000,
        });
      }
    });
    
    return results;
  }, [combatants, characterBuffsMap, onBuffsExpired]);
  
  // Avança turno apenas do combatente atual
  const advanceCurrentCombatantBuffs = useCallback((combatantId: string): TurnAdvanceBuffResult | null => {
    const combatant = combatants.find(c => c.id === combatantId);
    if (!combatant?.characterId) return null;
    
    const charData = characterBuffsMap.get(combatant.characterId);
    if (!charData) return null;
    
    // Só processa se houver buffs com rodadas
    const turnBasedBuffs = charData.buffs.filter(b => b.duration === 'rodadas');
    if (turnBasedBuffs.length === 0) return null;
    
    const { expired, remaining } = charData.advanceTurn();
    
    const messages: string[] = [];
    
    if (expired.length > 0) {
      messages.push(`⏰ ${combatant.name}: ${expired.map(b => b.ritualName).join(', ')} expirou(aram)`);
      
      toast.warning(`Buffs expirados`, {
        description: `${combatant.name}: ${expired.map(b => b.ritualName).join(', ')}`,
        duration: 4000,
      });
    }
    
    const remainingTurnBuffs = remaining.filter(b => b.duration === 'rodadas');
    if (remainingTurnBuffs.length > 0) {
      const info = remainingTurnBuffs.map(b => `${b.ritualName} (${b.turnsRemaining})`).join(', ');
      messages.push(`🔮 ${info}`);
    }
    
    const result: TurnAdvanceBuffResult = {
      combatantId: combatant.id,
      combatantName: combatant.name,
      expired,
      remaining,
      messages,
    };
    
    // Notifica callback
    if (onBuffsExpired && expired.length > 0) {
      onBuffsExpired([result]);
    }
    
    return result;
  }, [combatants, characterBuffsMap, onBuffsExpired]);
  
  // Obtém buffs de um combatente específico
  const getBuffsForCombatant = useCallback((combatantId: string): CombatantWeaponBuffs | undefined => {
    return combatantBuffs.find(cb => cb.combatantId === combatantId);
  }, [combatantBuffs]);
  
  // Efeito para processar buffs automaticamente ao mudar de rodada
  // DESABILITADO: O avanço é feito manualmente pelo CombatTracker
  // useEffect(() => {
  //   if (!isActive || currentRound <= lastProcessedRound.current) return;
  //   
  //   // Avança buffs de todos quando a rodada muda
  //   if (hasTurnBasedBuffsInCombat) {
  //     advanceAllBuffTurns();
  //   }
  //   
  //   lastProcessedRound.current = currentRound;
  // }, [currentRound, isActive, hasTurnBasedBuffsInCombat, advanceAllBuffTurns]);
  
  return {
    combatantBuffs,
    advanceAllBuffTurns,
    advanceCurrentCombatantBuffs,
    hasTurnBasedBuffsInCombat,
    totalActiveBuffs,
    buffsSummary,
    getBuffsForCombatant,
  };
}

/**
 * Constantes de cores para elementos de buffs
 */
export const COMBAT_BUFF_ELEMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Sangue: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  Morte: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
  Energia: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
  Conhecimento: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
  Medo: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' },
};
