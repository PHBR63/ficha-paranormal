/**
 * useCampaignEvents - Hook para enviar eventos de campanha ao chat
 * Centraliza a criação de mensagens de eventos (rituais, dano, condições, etc.)
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Tipos de evento suportados
export type CampaignEventType = 
  | 'event_ritual'
  | 'event_damage'
  | 'event_heal'
  | 'event_condition'
  | 'event_attack'
  | 'event_defense';

interface RitualEventData {
  ritualName: string;
  ritualId: string;
  element: string;
  circle: number;
  peCost: number;
  enhancements?: string[];
  targetName?: string;
}

interface DamageEventData {
  amount: number;
  damageType?: string;
  targetName: string;
  targetId?: string;
  sourceName?: string;
  isCritical?: boolean;
}

interface HealEventData {
  amount: number;
  targetName: string;
  targetId?: string;
  sourceName?: string;
  healType?: 'hp' | 'san' | 'pe';
}

interface ConditionEventData {
  conditionName: string;
  action: 'added' | 'removed';
  targetName: string;
  targetId?: string;
  duration?: string;
}

interface AttackEventData {
  attackName: string;
  targetName?: string;
  result: number;
  dice: number[];
  isCritical: boolean;
  isHit?: boolean;
  damage?: number;
}

interface DefenseEventData {
  defenseName: string;
  result: number;
  dice: number[];
  isCritical: boolean;
  isSuccess: boolean;
}

interface UseCampaignEventsProps {
  campaignId: string;
  characterId?: string | null;
  characterName?: string;
}

export function useCampaignEvents({ campaignId, characterId, characterName }: UseCampaignEventsProps) {
  const { user } = useAuth();

  // Função base para enviar evento
  const sendEvent = useCallback(async (
    type: CampaignEventType,
    content: string,
    metadata: any
  ) => {
    if (!user || !campaignId) return null;

    const { data, error } = await supabase
      .from('campaign_messages')
      .insert({
        campaign_id: campaignId,
        user_id: user.id,
        character_id: characterId || null,
        message_type: type,
        content,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao enviar evento:', error);
      return null;
    }

    return data;
  }, [campaignId, characterId, user]);

  // Evento: Ritual conjurado
  const sendRitualEvent = useCallback(async (data: RitualEventData) => {
    const name = characterName || 'Alguém';
    const targetText = data.targetName ? ` em **${data.targetName}**` : '';
    const enhancementText = data.enhancements?.length 
      ? ` com ${data.enhancements.length} aprimoramento(s)` 
      : '';

    const content = `✨ **${name}** conjurou **${data.ritualName}** (${data.element} ${data.circle}º)${targetText}${enhancementText}`;

    return sendEvent('event_ritual', content, data);
  }, [sendEvent, characterName]);

  // Evento: Dano recebido
  const sendDamageEvent = useCallback(async (data: DamageEventData) => {
    const source = data.sourceName || characterName || 'Algo';
    const critText = data.isCritical ? ' ★ CRÍTICO!' : '';
    const typeText = data.damageType ? ` de ${data.damageType}` : '';

    const content = `💀 **${data.targetName}** recebeu **${data.amount}** de dano${typeText} de **${source}**${critText}`;

    return sendEvent('event_damage', content, data);
  }, [sendEvent, characterName]);

  // Evento: Cura recebida
  const sendHealEvent = useCallback(async (data: HealEventData) => {
    const source = data.sourceName || characterName || 'Algo';
    const healTypeMap = { hp: 'PV', san: 'Sanidade', pe: 'PE' };
    const typeText = data.healType ? ` de ${healTypeMap[data.healType]}` : '';

    const content = `💚 **${data.targetName}** recuperou **${data.amount}**${typeText} (${source})`;

    return sendEvent('event_heal', content, data);
  }, [sendEvent, characterName]);

  // Evento: Condição aplicada/removida
  const sendConditionEvent = useCallback(async (data: ConditionEventData) => {
    const actionText = data.action === 'added' ? 'está agora' : 'não está mais';
    const durationText = data.duration ? ` (${data.duration})` : '';

    const content = `⚠️ **${data.targetName}** ${actionText} **${data.conditionName}**${durationText}`;

    return sendEvent('event_condition', content, data);
  }, [sendEvent]);

  // Evento: Ataque realizado
  const sendAttackEvent = useCallback(async (data: AttackEventData) => {
    const name = characterName || 'Alguém';
    const targetText = data.targetName ? ` contra **${data.targetName}**` : '';
    const critText = data.isCritical ? ' ★ CRÍTICO!' : '';
    const hitText = data.isHit !== undefined 
      ? (data.isHit ? ' - **ACERTOU!**' : ' - *errou*')
      : '';
    const damageText = data.damage ? ` (${data.damage} de dano)` : '';

    const content = `⚔️ **${name}** atacou com **${data.attackName}**${targetText}: [${data.dice.join(', ')}] → **${data.result}**${critText}${hitText}${damageText}`;

    return sendEvent('event_attack', content, {
      ...data,
      characterName: name,
    });
  }, [sendEvent, characterName]);

  // Evento: Defesa/Resistência
  const sendDefenseEvent = useCallback(async (data: DefenseEventData) => {
    const name = characterName || 'Alguém';
    const critText = data.isCritical ? ' ★ CRÍTICO!' : '';
    const resultText = data.isSuccess ? ' - **SUCESSO!**' : ' - *falhou*';

    const content = `🛡️ **${name}** testou **${data.defenseName}**: [${data.dice.join(', ')}] → **${data.result}**${critText}${resultText}`;

    return sendEvent('event_defense', content, {
      ...data,
      characterName: name,
    });
  }, [sendEvent, characterName]);

  // Evento de sistema genérico
  const sendSystemMessage = useCallback(async (content: string) => {
    if (!user || !campaignId) return null;

    const { data, error } = await supabase
      .from('campaign_messages')
      .insert({
        campaign_id: campaignId,
        user_id: user.id,
        character_id: null,
        message_type: 'system',
        content,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao enviar mensagem de sistema:', error);
      return null;
    }

    return data;
  }, [campaignId, user]);

  return {
    sendEvent,
    sendRitualEvent,
    sendDamageEvent,
    sendHealEvent,
    sendConditionEvent,
    sendAttackEvent,
    sendDefenseEvent,
    sendSystemMessage,
  };
}
