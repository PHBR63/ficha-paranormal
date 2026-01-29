/**
 * useCampaignPresence - Hook para gerenciar presença em tempo real na campanha
 * 
 * Usa Supabase Realtime Presence para rastrear quais jogadores estão online
 * e sincronizar estado entre todos os membros da campanha
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Interface para dados de presença do usuário
export interface UserPresence {
  oderId: string;
  odername?: string;
  oderAvatar?: string;
  onlineSince: string;
  lastSeen: string;
  status: 'online' | 'away' | 'offline';
}

// Interface para estado de presença consolidado
export interface PresenceState {
  onlineUsers: string[]; // Array de user_ids online
  presenceMap: Record<string, UserPresence>; // Mapa completo de presença
  isConnected: boolean;
  connectionError: string | null;
}

interface UseCampaignPresenceProps {
  campaignId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  enabled?: boolean;
}

export function useCampaignPresence({
  campaignId,
  userId,
  userName,
  userAvatar,
  enabled = true,
}: UseCampaignPresenceProps) {
  // Estado de presença
  const [presenceState, setPresenceState] = useState<PresenceState>({
    onlineUsers: [],
    presenceMap: {},
    isConnected: false,
    connectionError: null,
  });

  // Referência do canal para cleanup
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Handler para sincronizar estado de presença
  const syncPresence = useCallback((state: Record<string, unknown[]>) => {
    const onlineUsers: string[] = [];
    const presenceMap: Record<string, UserPresence> = {};

    // Processa estado de presença de todos os usuários
    Object.entries(state).forEach(([_key, presences]) => {
      // Cada usuário pode ter múltiplas sessões, pegamos a mais recente
      if (presences.length > 0) {
        const latestPresence = presences[presences.length - 1] as UserPresence;
        const oderId = latestPresence.oderId;
        
        if (oderId) {
          onlineUsers.push(oderId);
          presenceMap[oderId] = latestPresence;
        }
      }
    });

    setPresenceState(prev => ({
      ...prev,
      onlineUsers,
      presenceMap,
    }));
  }, []);

  // Handler para quando um usuário entra
  const handleJoin = useCallback((_payload: { key: string; newPresences: unknown[] }) => {
    // Evento de entrada processado silenciosamente
  }, []);

  // Handler para quando um usuário sai
  const handleLeave = useCallback((_payload: { key: string; leftPresences: unknown[] }) => {
    // Evento de saída processado silenciosamente
  }, []);

  // Refs para valores que mudam mas não devem re-subscripar o canal
  const userNameRef = useRef(userName);
  const userAvatarRef = useRef(userAvatar);
  
  useEffect(() => {
    userNameRef.current = userName;
    userAvatarRef.current = userAvatar;
  }, [userName, userAvatar]);

  // Inicializa canal de presença
  // NOTA: Dependências mínimas para evitar re-subscriptions (bug #185)
  useEffect(() => {
    if (!enabled || !campaignId || !userId) {
      return;
    }

    const channelName = `campaign-presence:${campaignId}`;
    
    // Cria canal com presença
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    // Configura handlers de presença
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        syncPresence(state as Record<string, unknown[]>);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        handleJoin({ key, newPresences: newPresences as unknown[] });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        handleLeave({ key, leftPresences: leftPresences as unknown[] });
      });

    // Subscreve e envia presença inicial
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Envia dados de presença do usuário atual (usa refs para valores atuais)
        const presenceData: UserPresence = {
          oderId: userId,
          odername: userNameRef.current,
          oderAvatar: userAvatarRef.current,
          onlineSince: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          status: 'online',
        };

        const trackResult = await channel.track(presenceData);
        
        if (trackResult === 'ok') {
          setPresenceState(prev => ({
            ...prev,
            isConnected: true,
            connectionError: null,
          }));
        } else {
          setPresenceState(prev => ({
            ...prev,
            isConnected: false,
            connectionError: 'Falha ao rastrear presença',
          }));
        }
      } else if (status === 'CHANNEL_ERROR') {
        setPresenceState(prev => ({
          ...prev,
          isConnected: false,
          connectionError: 'Erro de conexão com o canal',
        }));
      }
    });

    channelRef.current = channel;

    // Cleanup ao desmontar
    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, campaignId, userId, syncPresence, handleJoin, handleLeave]);

  // Atualiza status de "away" quando usuário fica inativo
  useEffect(() => {
    if (!enabled || !channelRef.current) return;

    let inactivityTimeout: NodeJS.Timeout;

    const updateActivity = () => {
      // Reseta timer de inatividade
      clearTimeout(inactivityTimeout);
      
      // Atualiza lastSeen
      if (channelRef.current) {
        channelRef.current.track({
          oderId: userId,
          odername: userName,
          oderAvatar: userAvatar,
          onlineSince: presenceState.presenceMap[userId]?.onlineSince || new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          status: 'online' as const,
        });
      }

      // Define timer para marcar como "away" após 5 minutos de inatividade
      inactivityTimeout = setTimeout(() => {
        if (channelRef.current) {
          channelRef.current.track({
            oderId: userId,
            odername: userName,
            oderAvatar: userAvatar,
            onlineSince: presenceState.presenceMap[userId]?.onlineSince || new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            status: 'away' as const,
          });
        }
      }, 5 * 60 * 1000); // 5 minutos
    };

    // Eventos de atividade do usuário
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Atividade inicial
    updateActivity();

    return () => {
      clearTimeout(inactivityTimeout);
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [enabled, userId, userName, userAvatar, presenceState.presenceMap]);

  // Helper para verificar se um usuário está online
  const isUserOnline = useCallback((checkUserId: string): boolean => {
    return presenceState.onlineUsers.includes(checkUserId);
  }, [presenceState.onlineUsers]);

  // Helper para obter status de um usuário
  const getUserStatus = useCallback((checkUserId: string): 'online' | 'away' | 'offline' => {
    const presence = presenceState.presenceMap[checkUserId];
    return presence?.status || 'offline';
  }, [presenceState.presenceMap]);

  return {
    ...presenceState,
    isUserOnline,
    getUserStatus,
  };
}
