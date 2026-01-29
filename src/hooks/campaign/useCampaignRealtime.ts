/**
 * useCampaignRealtime - Hook unificado para chat e sessões em tempo real
 * 
 * Centraliza toda lógica de realtime para evitar múltiplos canais
 * Usa Ref-First pattern para callbacks estáveis (evita loop #185)
 * 
 * @module hooks/campaign/useCampaignRealtime
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Interface de mensagem
export interface CampaignMessage {
  id: string;
  campaign_id: string;
  user_id: string;
  character_id: string | null;
  recipient_id: string | null;
  message_type: 'chat' | 'dice_roll' | 'system' | 'whisper';
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profiles?: {
    display_name: string | null;
  };
  characters?: {
    name: string;
  } | null;
}

// Interface de sessão
export interface CampaignSession {
  id: string;
  campaign_id: string;
  session_number: number;
  title: string | null;
  summary: string | null;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  notes: Record<string, unknown> | null;
  created_at: string;
}

// Props do hook
interface UseCampaignRealtimeProps {
  campaignId: string;
  userId: string;
  enabled?: boolean;
}

// Retorno do hook
export interface UseCampaignRealtimeReturn {
  messages: CampaignMessage[];
  sessions: CampaignSession[];
  activeSession: CampaignSession | null;
  unreadCount: number;
  isConnected: boolean;
  sendMessage: (content: string, type?: CampaignMessage['message_type'], metadata?: Record<string, unknown>, characterId?: string | null) => Promise<boolean>;
  startSession: (title?: string) => Promise<CampaignSession | null>;
  endSession: (sessionId: string) => Promise<boolean>;
  markAsRead: () => void;
}

export function useCampaignRealtime({
  campaignId,
  userId,
  enabled = true,
}: UseCampaignRealtimeProps): UseCampaignRealtimeReturn {
  const { toast } = useToast();
  
  // Ref-First: estabiliza toast
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);
  
  // Estado
  const [messages, setMessages] = useState<CampaignMessage[]>([]);
  const [sessions, setSessions] = useState<CampaignSession[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  // Ref para rastrear última mensagem lida
  const lastReadIdRef = useRef<string | null>(null);
  
  // Sessão ativa derivada
  const activeSession = sessions.find(s => s.status === 'active') || null;
  
  /**
   * Carrega mensagens iniciais
   */
  const fetchMessages = useCallback(async () => {
    if (!campaignId) return;
    
    try {
      // Tenta v2 primeiro
      let { data: messagesRaw, error } = await supabase
        .from('campaign_messages_v2')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true })
        .limit(100);
      
      // Fallback para v1
      if (error || !messagesRaw) {
        const v1Result = await supabase
          .from('campaign_messages')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: true })
          .limit(100);
        
        messagesRaw = v1Result.data;
        error = v1Result.error;
      }
      
      if (error) throw error;
      if (!messagesRaw) return;
      
      // Busca profiles em lote
      const userIds = [...new Set(messagesRaw.map(m => m.user_id))];
      const charIds = [...new Set(messagesRaw.filter(m => m.character_id).map(m => m.character_id!))];
      
      const [profilesRes, charsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name').in('user_id', userIds),
        charIds.length > 0
          ? supabase.from('characters').select('id, name').in('id', charIds)
          : Promise.resolve({ data: [] }),
      ]);
      
      // Cria lookups
      const profileLookup: Record<string, { display_name: string | null }> = {};
      (profilesRes.data || []).forEach(p => { profileLookup[p.user_id] = p; });
      
      const charLookup: Record<string, { name: string }> = {};
      (charsRes.data || []).forEach(c => { charLookup[c.id] = c; });
      
      // Mescla dados
      const messagesWithData = messagesRaw.map(msg => ({
        ...msg,
        message_type: msg.message_type as CampaignMessage['message_type'],
        recipient_id: msg.recipient_id || null,
        metadata: msg.metadata as Record<string, unknown> | null,
        profiles: profileLookup[msg.user_id] || { display_name: null },
        characters: msg.character_id ? charLookup[msg.character_id] || null : null,
      })) as CampaignMessage[];
      
      setMessages(messagesWithData);
      
      // Marca última como lida
      if (messagesWithData.length > 0) {
        lastReadIdRef.current = messagesWithData[messagesWithData.length - 1].id;
      }
      
    } catch (err: any) {
      console.error('Erro ao carregar mensagens:', err);
    }
  }, [campaignId]);
  
  /**
   * Carrega sessões
   */
  const fetchSessions = useCallback(async () => {
    if (!campaignId) return;
    
    try {
      // Tenta v2 primeiro
      let { data, error } = await supabase
        .from('campaign_sessions_v2')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('session_number', { ascending: false });
      
      // Fallback para v1
      if (error || !data) {
        const v1Result = await supabase
          .from('campaign_sessions')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('session_number', { ascending: false });
        
        data = v1Result.data;
        error = v1Result.error;
      }
      
      if (error) throw error;
      
      setSessions((data || []).map(s => ({
        ...s,
        status: s.status as CampaignSession['status'],
        notes: s.notes as Record<string, unknown> | null,
      })));
      
    } catch (err: any) {
      console.error('Erro ao carregar sessões:', err);
    }
  }, [campaignId]);
  
  /**
   * Envia mensagem
   */
  const sendMessage = useCallback(async (
    content: string,
    type: CampaignMessage['message_type'] = 'chat',
    metadata?: Record<string, unknown>,
    characterId?: string | null
  ): Promise<boolean> => {
    if (!campaignId || !userId || !content.trim()) return false;
    
    try {
      // Usa tabela v1 (campaign_messages) que já existe
      // A v2 será usada quando o schema estiver migrado
      const { error } = await supabase
        .from('campaign_messages')
        .insert([{
          campaign_id: campaignId,
          user_id: userId,
          character_id: characterId || null,
          message_type: type,
          content: content.trim(),
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        }]);
      
      if (error) throw error;
      
      return true;
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
      toastRef.current?.({
        title: 'Erro ao enviar mensagem',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [campaignId, userId]);
  
  /**
   * Inicia nova sessão
   */
  const startSession = useCallback(async (title?: string): Promise<CampaignSession | null> => {
    if (!campaignId || !userId) return null;
    
    try {
      // Calcula próximo número de sessão
      const nextNumber = sessions.length > 0 
        ? Math.max(...sessions.map(s => s.session_number)) + 1 
        : 1;
      
      const insertData = {
        campaign_id: campaignId,
        session_number: nextNumber,
        title: title || `Sessão ${nextNumber}`,
        status: 'active',
        started_at: new Date().toISOString(),
      };
      
      // Usa tabela v1 que já existe
      const { data, error } = await supabase
        .from('campaign_sessions')
        .insert([insertData])
        .select()
        .single();
      
      if (error) throw error;
      
      toastRef.current?.({
        title: 'Sessão iniciada!',
        description: `Sessão #${nextNumber} começou.`,
      });
      
      return data as CampaignSession;
    } catch (err: any) {
      console.error('Erro ao iniciar sessão:', err);
      toastRef.current?.({
        title: 'Erro ao iniciar sessão',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  }, [campaignId, userId, sessions]);
  
  /**
   * Encerra sessão
   */
  const endSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      const updateData = {
        status: 'completed',
        ended_at: new Date().toISOString(),
      };
      
      // Usa tabela v1 que já existe
      const { error } = await supabase
        .from('campaign_sessions')
        .update(updateData)
        .eq('id', sessionId);
      
      if (error) throw error;
      
      toastRef.current?.({
        title: 'Sessão encerrada',
        description: 'A sessão foi finalizada com sucesso.',
      });
      
      return true;
    } catch (err: any) {
      console.error('Erro ao encerrar sessão:', err);
      toastRef.current?.({
        title: 'Erro ao encerrar sessão',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  }, []);
  
  /**
   * Marca mensagens como lidas
   */
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
    if (messages.length > 0) {
      lastReadIdRef.current = messages[messages.length - 1].id;
    }
  }, [messages]);
  
  // Carregamento inicial e realtime
  useEffect(() => {
    if (!enabled || !campaignId) return;
    
    fetchMessages();
    fetchSessions();
    
    // Canal único para mensagens e sessões
    const channelName = `campaign-realtime-${campaignId}`;
    const channel = supabase
      .channel(channelName)
      // Mensagens v2
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'campaign_messages_v2',
        filter: `campaign_id=eq.${campaignId}`,
      }, async (payload) => {
        const newMsg = payload.new as CampaignMessage;
        
        // Busca dados adicionais
        const [profileRes, charRes] = await Promise.all([
          supabase.from('profiles').select('display_name').eq('user_id', newMsg.user_id).maybeSingle(),
          newMsg.character_id
            ? supabase.from('characters').select('name').eq('id', newMsg.character_id).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        
        const messageWithData: CampaignMessage = {
          ...newMsg,
          profiles: profileRes.data || { display_name: null },
          characters: charRes.data || null,
        };
        
        setMessages(prev => [...prev, messageWithData]);
        
        // Incrementa não lidas se não for do usuário atual
        if (newMsg.user_id !== userId) {
          setUnreadCount(prev => prev + 1);
        }
      })
      // Mensagens v1 (fallback)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'campaign_messages',
        filter: `campaign_id=eq.${campaignId}`,
      }, async (payload) => {
        const newMsg = payload.new as CampaignMessage;
        
        const [profileRes, charRes] = await Promise.all([
          supabase.from('profiles').select('display_name').eq('user_id', newMsg.user_id).maybeSingle(),
          newMsg.character_id
            ? supabase.from('characters').select('name').eq('id', newMsg.character_id).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        
        const messageWithData: CampaignMessage = {
          ...newMsg,
          recipient_id: null,
          profiles: profileRes.data || { display_name: null },
          characters: charRes.data || null,
        };
        
        setMessages(prev => [...prev, messageWithData]);
        
        if (newMsg.user_id !== userId) {
          setUnreadCount(prev => prev + 1);
        }
      })
      // Sessões v2
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'campaign_sessions_v2',
        filter: `campaign_id=eq.${campaignId}`,
      }, () => fetchSessions())
      // Sessões v1 (fallback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'campaign_sessions',
        filter: `campaign_id=eq.${campaignId}`,
      }, () => fetchSessions())
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, campaignId, userId, fetchMessages, fetchSessions]);
  
  return {
    messages,
    sessions,
    activeSession,
    unreadCount,
    isConnected,
    sendMessage,
    startSession,
    endSession,
    markAsRead,
  };
}
