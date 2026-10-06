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
  message_type: 'chat' | 'dice_roll' | 'system' | 'whisper' | 'event_damage' | 'event_heal' | 'event_ritual' | 'event_condition' | 'event_attack' | 'event_defense';
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

/** Mantém compatibilidade com eventos já salvos como system nas tabelas SQL. */
function readMessageType(type: string, metadata: unknown): CampaignMessage['message_type'] {
  const eventTypes = ['event_damage', 'event_heal', 'event_ritual', 'event_condition', 'event_attack', 'event_defense'];
  if (type === 'system' && typeof metadata === 'object' && metadata !== null && 'eventType' in metadata
    && typeof metadata.eventType === 'string' && eventTypes.includes(metadata.eventType)) {
    return metadata.eventType as CampaignMessage['message_type'];
  }
  return type as CampaignMessage['message_type'];
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
  schemaVersion?: 'v1' | 'v2';
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
  schemaVersion = 'v2',
}: UseCampaignRealtimeProps): UseCampaignRealtimeReturn {
  const { toast } = useToast();
  // A versão vem do carregamento da campanha; nunca tentar gravar em outra FK.
  const messagesTable = schemaVersion === 'v2' ? 'campaign_messages_v2' : 'campaign_messages';
  const sessionsTable = schemaVersion === 'v2' ? 'campaign_sessions_v2' : 'campaign_sessions';
  
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
  const startingSession = useRef(false);
  const messagesEpoch = useRef(0);
  const sessionsEpoch = useRef(0);
  const scope = `${campaignId}:${userId}:${schemaVersion}`;
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  
  // Sessão ativa derivada
  const activeSession = sessions.find(s => s.status === 'active') || null;
  
  /**
   * Carrega mensagens iniciais
   */
  const fetchMessages = useCallback(async () => {
    if (!campaignId) return;
    const epoch = messagesEpoch.current;
    
    try {
      const { data: messagesRaw, error } = await supabase
        .from(messagesTable)
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true })
        .limit(100);
      
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
        message_type: readMessageType(msg.message_type, msg.metadata),
        recipient_id: ('recipient_id' in msg ? msg.recipient_id : null) || null,
        metadata: msg.metadata as Record<string, unknown> | null,
        profiles: profileLookup[msg.user_id] || { display_name: null },
        characters: msg.character_id ? charLookup[msg.character_id] || null : null,
      })) as CampaignMessage[];
      
      // Uma leitura iniciada antes de uma escrita não pode apagar o resultado novo.
      if (messagesEpoch.current !== epoch || scopeRef.current !== scope) return;
      setMessages(messagesWithData);
      
      // Marca última como lida
      if (messagesWithData.length > 0) {
        lastReadIdRef.current = messagesWithData[messagesWithData.length - 1].id;
      }
      
    } catch (err: any) {
      console.error('Erro ao carregar mensagens:', err);
    }
  }, [campaignId, messagesTable, scope]);
  
  /**
   * Carrega sessões
   */
  const fetchSessions = useCallback(async () => {
    if (!campaignId) return;
    const epoch = sessionsEpoch.current;
    
    try {
      const { data, error } = await supabase
        .from(sessionsTable)
        .select('*')
        .eq('campaign_id', campaignId)
        .order('session_number', { ascending: false });
      
      if (error) throw error;
      if (sessionsEpoch.current !== epoch || scopeRef.current !== scope) return;
      
      setSessions((data || []).map(s => ({
        ...s,
        status: (s.status === 'in_progress' ? 'active' : s.status) as CampaignSession['status'],
        notes: s.notes as Record<string, unknown> | null,
      })));
      
    } catch (err: any) {
      console.error('Erro ao carregar sessões:', err);
    }
  }, [campaignId, sessionsTable, scope]);
  
  /**
   * Envia mensagem
   */
  const sendMessage = useCallback(async (
    content: string,
    type: CampaignMessage['message_type'] = 'chat',
    metadata?: Record<string, unknown>,
    characterId?: string | null
  ): Promise<boolean> => {
    if (!enabled || !campaignId || !userId || !content.trim()) return false;
    
    try {
      const { data, error } = await supabase
        .from(messagesTable)
        .insert([{
          campaign_id: campaignId,
          user_id: userId,
          character_id: characterId || null,
          // Eventos da ficha usam o tipo SQL system e preservam o subtipo no JSON.
          message_type: type.startsWith('event_') ? 'system' : type,
          content: content.trim(),
          metadata: metadata || type.startsWith('event_')
            ? JSON.parse(JSON.stringify({ ...metadata, ...(type.startsWith('event_') ? { eventType: type } : {}) })) : null,
        }])
        .select('*')
        .single();
      
      if (error) throw error;
      if (scopeRef.current !== scope) return true;
      messagesEpoch.current += 1;
      const sent = { ...data, message_type: type, recipient_id: null, metadata: data.metadata as Record<string, unknown> | null } as CampaignMessage;
      setMessages(previous => previous.some(message => message.id === sent.id) ? previous : [...previous, sent]);
      
      return true;
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
      toastRef.current?.({
        title: 'Erro ao enviar mensagem',
        description: 'A mensagem não foi enviada. Confira sua conexão e tente novamente.',
        variant: 'destructive',
      });
      return false;
    }
  }, [enabled, campaignId, userId, messagesTable, scope]);
  
  /**
   * Inicia nova sessão
   */
  const startSession = useCallback(async (title?: string): Promise<CampaignSession | null> => {
    if (!enabled || !campaignId || !userId) return null;
    if (activeSession) return activeSession;
    if (startingSession.current) return null;
    startingSession.current = true;
    
    try {
      // Calcula próximo número de sessão
      const nextNumber = sessions.length > 0 
        ? Math.max(...sessions.map(s => s.session_number)) + 1 
        : 1;
      
      const insertData = {
        campaign_id: campaignId,
        session_number: nextNumber,
        title: title || `Sessão ${nextNumber}`,
        status: schemaVersion === 'v2' ? 'active' : 'in_progress',
        started_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from(sessionsTable)
        .insert([insertData])
        .select()
        .single();
      
      if (error) throw error;
      if (scopeRef.current !== scope) return null;
      sessionsEpoch.current += 1;
      const session = { ...data, status: 'active' } as CampaignSession;
      setSessions(previous => [session, ...previous.filter(item => item.id !== session.id)]);
      
      toastRef.current?.({
        title: 'Sessão iniciada!',
        description: `Sessão #${nextNumber} começou.`,
      });
      
      return session;
    } catch (err: any) {
      console.error('Erro ao iniciar sessão:', err);
      toastRef.current?.({
        title: 'Erro ao iniciar sessão',
        description: 'A sessão não foi iniciada. Confira sua conexão e o acesso de mestre à campanha.',
        variant: 'destructive',
      });
      return null;
    } finally {
      startingSession.current = false;
    }
  }, [enabled, campaignId, userId, sessions, sessionsTable, schemaVersion, activeSession, scope]);
  
  /**
   * Encerra sessão
   */
  const endSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!enabled || !campaignId || !userId) return false;
    try {
      const updateData = {
        status: 'completed',
        ended_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from(sessionsTable)
        .update(updateData)
        .eq('id', sessionId)
        .eq('campaign_id', campaignId)
        .select('id')
        .single();
      
      if (error) throw error;
      if (scopeRef.current !== scope) return true;
      sessionsEpoch.current += 1;
      setSessions(previous => previous.map(session => session.id === sessionId ? { ...session, status: 'completed', ended_at: updateData.ended_at } : session));
      
      toastRef.current?.({
        title: 'Sessão encerrada',
        description: 'A sessão foi finalizada com sucesso.',
      });
      
      return true;
    } catch (err: any) {
      console.error('Erro ao encerrar sessão:', err);
      toastRef.current?.({
        title: 'Erro ao encerrar sessão',
        description: 'A sessão não foi encerrada. Confira sua conexão e tente novamente.',
        variant: 'destructive',
      });
      return false;
    }
  }, [enabled, campaignId, userId, sessionsTable, scope]);
  
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
    messagesEpoch.current += 1;
    sessionsEpoch.current += 1;
    setMessages([]);
    setSessions([]);
    setUnreadCount(0);
    setIsConnected(false);
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
        table: messagesTable,
        filter: `campaign_id=eq.${campaignId}`,
      }, async (payload) => {
        const newMsg = payload.new as CampaignMessage;
        newMsg.message_type = readMessageType(newMsg.message_type, newMsg.metadata);
        
        // Busca dados adicionais - usa .limit(1) para evitar erro 406
        const [profileRes, charRes] = await Promise.all([
          supabase.from('profiles').select('display_name').eq('user_id', newMsg.user_id).limit(1),
          newMsg.character_id
            ? supabase.from('characters').select('name').eq('id', newMsg.character_id).limit(1)
            : Promise.resolve({ data: [] }),
        ]);
        
        const messageWithData: CampaignMessage = {
          ...newMsg,
          profiles: profileRes.data?.[0] || { display_name: null },
          characters: charRes.data?.[0] || null,
        };
        if (scopeRef.current !== scope) return;
        messagesEpoch.current += 1;
        setMessages(prev => prev.some(message => message.id === messageWithData.id) ? prev.map(message => message.id === messageWithData.id ? messageWithData : message) : [...prev, messageWithData]);
        
        // Incrementa não lidas se não for do usuário atual
        if (newMsg.user_id !== userId) {
          setUnreadCount(prev => prev + 1);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: sessionsTable,
        filter: `campaign_id=eq.${campaignId}`,
      }, () => fetchSessions())
      .subscribe((status) => {
        if (scopeRef.current === scope) setIsConnected(status === 'SUBSCRIBED');
      });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, campaignId, userId, messagesTable, sessionsTable, scope, fetchMessages, fetchSessions]);
  
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
