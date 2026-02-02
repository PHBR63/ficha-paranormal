/**
 * useCharacterStatsSync - Hook para sincronizar stats (HP/PE/SAN) com a campanha
 * 
 * Broadcast em tempo real das mudanças de recursos do personagem
 * para que o mestre e outros jogadores vejam as atualizações instantaneamente.
 * 
 * @module hooks/campaign/useCharacterStatsSync
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Tipos para os stats sincronizados
export interface CharacterStats {
  hp_current: number;
  hp_max: number;
  pe_current: number;
  pe_max: number;
  san_current: number;
  san_max: number;
}

// Tipos para evento de broadcast
export interface StatsBroadcastPayload {
  characterId: string;
  characterName: string;
  userId: string;
  stats: CharacterStats;
  changedField: 'hp' | 'pe' | 'san' | 'all';
  delta?: number; // Diferença (positiva ou negativa)
  timestamp: string;
}

interface UseCharacterStatsSyncProps {
  /** ID do personagem */
  characterId: string;
  /** Nome do personagem (para exibição) */
  characterName: string;
  /** ID do usuário dono do personagem */
  userId: string;
  /** ID da campanha (se estiver em uma) */
  campaignId: string | null;
  /** Stats atuais do personagem */
  currentStats: CharacterStats;
  /** Se o sync está habilitado */
  enabled?: boolean;
  /** Callback para quando receber atualização de outro personagem */
  onExternalUpdate?: (payload: StatsBroadcastPayload) => void;
}

interface UseCharacterStatsSyncReturn {
  /** Se está conectado à campanha */
  isConnected: boolean;
  /** Envia atualização de HP para a campanha */
  broadcastHPChange: (newHP: number) => void;
  /** Envia atualização de PE para a campanha */
  broadcastPEChange: (newPE: number) => void;
  /** Envia atualização de SAN para a campanha */
  broadcastSANChange: (newSAN: number) => void;
  /** Envia todos os stats de uma vez */
  broadcastAllStats: () => void;
}

/**
 * Hook para sincronizar stats do personagem em tempo real com a campanha
 * 
 * Usa Supabase Realtime para broadcast de mudanças para todos os membros.
 * Implementa throttle para evitar spam de mensagens.
 * 
 * @example
 * ```tsx
 * const { broadcastHPChange, broadcastPEChange } = useCharacterStatsSync({
 *   characterId: character.id,
 *   characterName: character.name,
 *   userId: user.id,
 *   campaignId: campaignId,
 *   currentStats: {
 *     hp_current: character.hp_current,
 *     hp_max: character.hp_max,
 *     pe_current: character.pe_current,
 *     pe_max: character.pe_max,
 *     san_current: character.san_current,
 *     san_max: character.san_max,
 *   },
 * });
 * 
 * // Quando o HP mudar
 * broadcastHPChange(newHP);
 * ```
 */
export function useCharacterStatsSync({
  characterId,
  characterName,
  userId,
  campaignId,
  currentStats,
  enabled = true,
  onExternalUpdate,
}: UseCharacterStatsSyncProps): UseCharacterStatsSyncReturn {
  // Refs para evitar re-renderizações e loops
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isConnectedRef = useRef(false);
  const lastBroadcastRef = useRef<number>(0);
  const previousStatsRef = useRef<CharacterStats>(currentStats);
  
  // Callback estável para updates externos
  const onExternalUpdateRef = useRef(onExternalUpdate);
  useEffect(() => {
    onExternalUpdateRef.current = onExternalUpdate;
  }, [onExternalUpdate]);
  
  // Nome do canal único para a campanha
  const channelName = useMemo(() => 
    campaignId ? `campaign-stats-${campaignId}` : null,
  [campaignId]);
  
  // Throttle: mínimo 300ms entre broadcasts
  const BROADCAST_THROTTLE_MS = 300;
  
  /**
   * Envia uma mensagem de broadcast para o canal da campanha
   */
  const sendBroadcast = useCallback((
    changedField: StatsBroadcastPayload['changedField'],
    delta?: number
  ) => {
    if (!channelRef.current || !isConnectedRef.current) {
      console.log('[StatsSync] Canal não conectado, ignorando broadcast');
      return;
    }
    
    // Throttle para evitar spam
    const now = Date.now();
    if (now - lastBroadcastRef.current < BROADCAST_THROTTLE_MS) {
      console.log('[StatsSync] Throttled, ignorando broadcast');
      return;
    }
    lastBroadcastRef.current = now;
    
    const payload: StatsBroadcastPayload = {
      characterId,
      characterName,
      userId,
      stats: currentStats,
      changedField,
      delta,
      timestamp: new Date().toISOString(),
    };
    
    console.log('[StatsSync] Enviando broadcast:', changedField, delta);
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'stats_update',
      payload,
    });
  }, [characterId, characterName, userId, currentStats]);
  
  /**
   * Broadcast de mudança de HP
   */
  const broadcastHPChange = useCallback((newHP: number) => {
    const delta = newHP - previousStatsRef.current.hp_current;
    previousStatsRef.current = { ...previousStatsRef.current, hp_current: newHP };
    sendBroadcast('hp', delta);
  }, [sendBroadcast]);
  
  /**
   * Broadcast de mudança de PE
   */
  const broadcastPEChange = useCallback((newPE: number) => {
    const delta = newPE - previousStatsRef.current.pe_current;
    previousStatsRef.current = { ...previousStatsRef.current, pe_current: newPE };
    sendBroadcast('pe', delta);
  }, [sendBroadcast]);
  
  /**
   * Broadcast de mudança de SAN
   */
  const broadcastSANChange = useCallback((newSAN: number) => {
    const delta = newSAN - previousStatsRef.current.san_current;
    previousStatsRef.current = { ...previousStatsRef.current, san_current: newSAN };
    sendBroadcast('san', delta);
  }, [sendBroadcast]);
  
  /**
   * Broadcast de todos os stats
   */
  const broadcastAllStats = useCallback(() => {
    previousStatsRef.current = currentStats;
    sendBroadcast('all');
  }, [sendBroadcast, currentStats]);
  
  /**
   * Configura e gerencia a conexão com o canal Realtime
   */
  useEffect(() => {
    // Não conectar se não estiver em campanha ou desabilitado
    if (!channelName || !enabled || !campaignId) {
      return;
    }
    
    console.log('[StatsSync] Conectando ao canal:', channelName);
    
    // Criar canal
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: {
          // Não enviar de volta para o próprio cliente
          self: false,
        },
      },
    });
    
    // Listener para updates de outros personagens
    channel.on('broadcast', { event: 'stats_update' }, (message) => {
      const payload = message.payload as StatsBroadcastPayload;
      
      // Ignorar updates do próprio personagem
      if (payload.characterId === characterId) {
        return;
      }
      
      console.log('[StatsSync] Recebido update de:', payload.characterName, payload.changedField);
      
      // Notificar callback se existir
      if (onExternalUpdateRef.current) {
        onExternalUpdateRef.current(payload);
      }
    });
    
    // Subscrever
    channel.subscribe((status) => {
      console.log('[StatsSync] Status do canal:', status);
      isConnectedRef.current = status === 'SUBSCRIBED';
    });
    
    channelRef.current = channel;
    
    // Cleanup
    return () => {
      console.log('[StatsSync] Desconectando do canal:', channelName);
      isConnectedRef.current = false;
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [channelName, enabled, campaignId, characterId]);
  
  // Atualizar ref de stats quando mudam
  useEffect(() => {
    previousStatsRef.current = currentStats;
  }, [currentStats]);
  
  return {
    isConnected: isConnectedRef.current,
    broadcastHPChange,
    broadcastPEChange,
    broadcastSANChange,
    broadcastAllStats,
  };
}
