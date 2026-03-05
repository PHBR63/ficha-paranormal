/**
 * useAdvancedPings - Hook para pings avançados (Fase E)
 * 
 * Gerencia 3 tipos de ping via Supabase Realtime Broadcast:
 * - normal: Ping padrão com animação pulsante
 * - alert: Ping de alerta vermelho com efeito dramático
 * - camera_sync: Centraliza a câmera de todos os jogadores
 * 
 * Também suporta mensagem de texto exibida no mapa.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { BoardPing } from '@/hooks/campaign/useTacticalBoard';

// Tipos de ping (re-exporta para UI)
export type PingType = 'normal' | 'alert' | 'camera_sync';

// Evento de sincronização de câmera
export interface CameraSyncEvent {
  x: number;
  y: number;
  zoom?: number;
  senderId: string;
}

interface UseAdvancedPingsProps {
  campaignId: string;
  mapId: string | null;
  enabled?: boolean;
  /** Nome do usuário atual para exibir nos pings */
  currentUserName?: string;
  currentUserId?: string;
}

interface UseAdvancedPingsReturn {
  /** Lista de pings ativos */
  pings: BoardPing[];
  /** Tipo de ping selecionado */
  pingType: PingType;
  /** Mensagem a ser anexada ao próximo ping */
  pingMessage: string;
  /** Define tipo de ping */
  setPingType: (type: PingType) => void;
  /** Define mensagem do ping */
  setPingMessage: (msg: string) => void;
  /** Envia um ping para todos os jogadores */
  sendPing: (x: number, y: number, color?: string) => void;
  /** Último evento de câmera recebido (para reagir) */
  lastCameraSync: CameraSyncEvent | null;
  /** Limpa o evento de câmera (após processar) */
  clearCameraSync: () => void;
}

export function useAdvancedPings({
  campaignId,
  mapId,
  enabled = true,
  currentUserName = 'Jogador',
  currentUserId,
}: UseAdvancedPingsProps): UseAdvancedPingsReturn {
  const [pings, setPings] = useState<AdvancedPing[]>([]);
  const [pingType, setPingType] = useState<PingType>('normal');
  const [pingMessage, setPingMessage] = useState('');
  const [lastCameraSync, setLastCameraSync] = useState<CameraSyncEvent | null>(null);

  // Refs para estabilidade (padrão Ref-First)
  const pingTypeRef = useRef(pingType);
  useEffect(() => { pingTypeRef.current = pingType; }, [pingType]);

  const pingMessageRef = useRef(pingMessage);
  useEffect(() => { pingMessageRef.current = pingMessage; }, [pingMessage]);

  const currentUserNameRef = useRef(currentUserName);
  useEffect(() => { currentUserNameRef.current = currentUserName; }, [currentUserName]);

  const currentUserIdRef = useRef(currentUserId);
  useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);

  // Cleanup de pings expirados
  const pingTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      pingTimeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  // Canal de broadcast para pings
  useEffect(() => {
    if (!campaignId || !mapId || !enabled) return;

    const channelName = `pings-${campaignId}-${mapId}`;
    const channel = supabase.channel(channelName);

    // Recebe pings de outros jogadores
    channel.on('broadcast', { event: 'ping' }, ({ payload }) => {
      const ping = payload as AdvancedPing;
      
      // Adiciona ao estado local
      setPings(prev => {
        if (prev.some(p => p.id === ping.id)) return prev;
        return [...prev, ping];
      });

      // Auto-remove após duração (alert dura mais)
      const duration = ping.type === 'alert' ? 5000 : 3000;
      const timeout = setTimeout(() => {
        setPings(prev => prev.filter(p => p.id !== ping.id));
      }, duration);
      pingTimeoutsRef.current.push(timeout);
    });

    // Recebe comandos de sincronização de câmera
    channel.on('broadcast', { event: 'camera_sync' }, ({ payload }) => {
      const event = payload as CameraSyncEvent;
      // Não processa se foi enviado por nós mesmos
      if (event.senderId === currentUserIdRef.current) return;
      setLastCameraSync(event);
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, mapId, enabled]);

  // Envia ping via broadcast
  const sendPing = useCallback((x: number, y: number, color: string = '#ff0000') => {
    if (!campaignId || !mapId) return;

    const type = pingTypeRef.current;
    const message = pingMessageRef.current || undefined;
    const senderName = currentUserNameRef.current;

    const ping: AdvancedPing = {
      id: `ping-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      x,
      y,
      color: type === 'alert' ? '#ff0000' : color,
      type,
      message,
      senderName,
      createdAt: Date.now(),
    };

    // Adiciona localmente
    setPings(prev => [...prev, ping]);

    // Auto-remove local
    const duration = type === 'alert' ? 5000 : 3000;
    const timeout = setTimeout(() => {
      setPings(prev => prev.filter(p => p.id !== ping.id));
    }, duration);
    pingTimeoutsRef.current.push(timeout);

    // Broadcast para outros jogadores
    const channelName = `pings-${campaignId}-${mapId}`;
    const channel = supabase.channel(channelName);
    channel.send({
      type: 'broadcast',
      event: 'ping',
      payload: ping,
    });

    // Se for camera_sync, envia também o evento de câmera
    if (type === 'camera_sync') {
      channel.send({
        type: 'broadcast',
        event: 'camera_sync',
        payload: {
          x,
          y,
          senderId: currentUserIdRef.current,
        } as CameraSyncEvent,
      });
    }

    // Limpa mensagem após enviar
    if (message) {
      setPingMessage('');
    }
  }, [campaignId, mapId]);

  const clearCameraSync = useCallback(() => {
    setLastCameraSync(null);
  }, []);

  return {
    pings,
    pingType,
    pingMessage,
    setPingType,
    setPingMessage,
    sendPing,
    lastCameraSync,
    clearCameraSync,
  };
}
