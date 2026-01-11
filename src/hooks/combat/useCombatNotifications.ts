/**
 * useCombatNotifications - Hook para gerenciar notificações push de combate
 * Combat 7.5: Notifica jogadores sobre turnos e eventos importantes
 */

import { useCallback, useRef } from 'react';
import { 
  notifyTurnStart, 
  notifyOpportunityAttack, 
  notifyLowHP, 
  notifyConditionApplied 
} from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';
import type { CombatantState } from '@/lib/game-engine';

interface UseCombatNotificationsProps {
  campaignId?: string;
  isMaster: boolean;
  enabled?: boolean;
}

interface UseCombatNotificationsReturn {
  // Notificação de turno
  notifyPlayerTurn: (combatant: CombatantState, round: number) => Promise<void>;
  
  // Notificação de ataque de oportunidade
  notifyOpportunity: (attacker: CombatantState, targetName: string) => Promise<void>;
  
  // Notificação de HP baixo (< 25%)
  checkAndNotifyLowHP: (combatant: CombatantState) => Promise<void>;
  
  // Notificação de condição aplicada
  notifyCondition: (combatant: CombatantState, conditionName: string, duration?: number) => Promise<void>;
}

export function useCombatNotifications({
  campaignId,
  isMaster,
  enabled = true,
}: UseCombatNotificationsProps): UseCombatNotificationsReturn {
  const { toast } = useToast();
  
  // Evita notificar o mesmo jogador múltiplas vezes no mesmo turno
  const notifiedTurnsRef = useRef<Set<string>>(new Set());
  
  // Evita spam de notificações de HP baixo
  const lowHPNotifiedRef = useRef<Set<string>>(new Set());

  /**
   * Notifica um jogador que é seu turno
   * Só envia se o combatente tem um characterId (jogador vinculado)
   */
  const notifyPlayerTurn = useCallback(async (combatant: CombatantState, round: number) => {
    // Só mestres podem enviar notificações e apenas em campanha
    if (!isMaster || !campaignId || !enabled) return;
    
    // Só notifica jogadores (não NPCs) com personagem vinculado
    if (combatant.isNPC || !combatant.characterId || !combatant.userId) return;
    
    // Evita notificar o mesmo turno duas vezes
    const turnKey = `${combatant.id}-${round}`;
    if (notifiedTurnsRef.current.has(turnKey)) return;
    notifiedTurnsRef.current.add(turnKey);
    
    // Limpa turnos antigos (mantém apenas última rodada)
    if (notifiedTurnsRef.current.size > 20) {
      notifiedTurnsRef.current.clear();
      notifiedTurnsRef.current.add(turnKey);
    }
    
    try {
      await notifyTurnStart({
        campaignId,
        playerId: combatant.userId,
        characterName: combatant.name,
        round,
      });
    } catch (error) {
      console.error('[CombatNotifications] Erro ao notificar turno:', error);
    }
  }, [campaignId, isMaster, enabled]);

  /**
   * Notifica jogador sobre ataque de oportunidade disponível
   */
  const notifyOpportunity = useCallback(async (attacker: CombatantState, targetName: string) => {
    if (!isMaster || !campaignId || !enabled) return;
    if (attacker.isNPC || !attacker.userId) return;
    
    try {
      await notifyOpportunityAttack({
        campaignId,
        attackerId: attacker.userId,
        attackerName: attacker.name,
        targetName,
      });
      
      toast({
        title: 'Ataque de Oportunidade',
        description: `${attacker.name} foi notificado sobre a oportunidade de atacar ${targetName}`,
      });
    } catch (error) {
      console.error('[CombatNotifications] Erro ao notificar oportunidade:', error);
    }
  }, [campaignId, isMaster, enabled, toast]);

  /**
   * Verifica se HP está baixo (< 25%) e notifica jogador
   */
  const checkAndNotifyLowHP = useCallback(async (combatant: CombatantState) => {
    if (!isMaster || !campaignId || !enabled) return;
    if (combatant.isNPC || !combatant.userId) return;
    
    const hpPercentage = (combatant.hp / combatant.hpMax) * 100;
    
    // Só notifica se HP < 25% e ainda não foi notificado
    if (hpPercentage >= 25) {
      // Remove da lista se HP voltou ao normal
      lowHPNotifiedRef.current.delete(combatant.id);
      return;
    }
    
    if (lowHPNotifiedRef.current.has(combatant.id)) return;
    lowHPNotifiedRef.current.add(combatant.id);
    
    try {
      await notifyLowHP({
        campaignId,
        playerId: combatant.userId,
        characterName: combatant.name,
        currentHP: combatant.hp,
        maxHP: combatant.hpMax,
      });
    } catch (error) {
      console.error('[CombatNotifications] Erro ao notificar HP baixo:', error);
    }
  }, [campaignId, isMaster, enabled]);

  /**
   * Notifica jogador sobre condição aplicada
   */
  const notifyCondition = useCallback(async (
    combatant: CombatantState, 
    conditionName: string, 
    duration?: number
  ) => {
    if (!isMaster || !campaignId || !enabled) return;
    if (combatant.isNPC || !combatant.userId) return;
    
    try {
      await notifyConditionApplied({
        campaignId,
        playerId: combatant.userId,
        characterName: combatant.name,
        conditionName,
        duration,
      });
    } catch (error) {
      console.error('[CombatNotifications] Erro ao notificar condição:', error);
    }
  }, [campaignId, isMaster, enabled]);

  return {
    notifyPlayerTurn,
    notifyOpportunity,
    checkAndNotifyLowHP,
    notifyCondition,
  };
}
