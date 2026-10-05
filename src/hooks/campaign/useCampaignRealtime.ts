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
import { getCampaignRows, mergeCampaignMessages, mergeCampaignRows, normalizeCampaignSession } from '@/lib/campaign-realtime-compat';

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
  const sessionSourcesRef = useRef<Record<string, 'campaign_sessions' | 'campaign_sessions_v2'>>({});
  const seenMessageIdsRef = useRef(new Set<string>());
  const loadVersionRef = useRef(0);
  
  // Sessão ativa derivada
  const activeSession = sessions.find(s => s.status === 'active') || null;
  
  /**
   * Carrega mensagens iniciais
   */
  const fetchMessages = useCallback(async () => {
    if (!campaignId) return;
    const loadVersion = loadVersionRef.current;
    
    try {
      // Os demais produtores ainda gravam em v1; v2 contém cópias históricas.
      const [legacyResult, migratedResult] = await Promise.all([
        supabase
          .from('campaign_messages')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('campaign_messages_v2')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false })
          .limit(100),
      ]);
      const messagesRaw = mergeCampaignMessages(
        getCampaignRows(legacyResult), getCampaignRows(migratedResult),
      );
      
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
      
      if (loadVersion !== loadVersionRef.current) return;
      // Preserva mensagens recebidas enquanto o histórico estava sendo consultado.
      setMessages(previous => mergeCampaignMessages(previous, messagesWithData));
      messagesWithData.forEach(message => seenMessageIdsRef.current.add(message.id));
      
      // Marca última como lida
      if (messagesWithData.length > 0) {
        lastReadIdRef.current = messagesWithData[messagesWithData.length - 1].id;
      }
      
    } catch (err: unknown) {
      if (loadVersion !== loadVersionRef.current) return;
      console.error('Erro ao carregar mensagens:', err);
      toastRef.current?.({ title: 'Erro ao carregar mensagens', description: 'Não foi possível carregar o histórico da campanha.', variant: 'destructive' });
    }
  }, [campaignId]);
  
  /**
   * Carrega sessões
   */
  const fetchSessions = useCallback(async () => {
    if (!campaignId) return;
    const loadVersion = loadVersionRef.current;
    
    try {
      const [legacyResult, migratedResult] = await Promise.all([
        supabase
          .from('campaign_sessions')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('session_number', { ascending: false }),
        supabase
          .from('campaign_sessions_v2')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('session_number', { ascending: false }),
      ]);
      const legacy = getCampaignRows(legacyResult);
      const migrated = getCampaignRows(migratedResult);
      if (loadVersion !== loadVersionRef.current) return;
      const sources: typeof sessionSourcesRef.current = {};
      migrated.forEach(session => { sources[session.id] = 'campaign_sessions_v2'; });
      legacy.forEach(session => { sources[session.id] = 'campaign_sessions'; });
      sessionSourcesRef.current = sources;

      setSessions(mergeCampaignRows(legacy, migrated)
        .sort((a, b) => b.session_number - a.session_number)
        .map(normalizeCampaignSession).map(s => ({
        ...s,
        status: s.status as CampaignSession['status'],
        notes: s.notes as Record<string, unknown> | null,
      })));
      
    } catch (err: unknown) {
      if (loadVersion !== loadVersionRef.current) return;
      console.error('Erro ao carregar sessões:', err);
      toastRef.current?.({ title: 'Erro ao carregar sessões', description: 'Não foi possível carregar as sessões da campanha.', variant: 'destructive' });
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
    if (!enabled || !campaignId || !userId || !content.trim()) return false;
    
    try {
      // Mantém o mesmo destino dos eventos e sussurros existentes.
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
    } catch (err: unknown) {
      console.error('Erro ao enviar mensagem:', err);
      toastRef.current?.({
        title: 'Erro ao enviar mensagem',
        description: 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive',
      });
      return false;
    }
  }, [enabled, campaignId, userId]);
  
  /**
   * Inicia nova sessão
   */
  const startSession = useCallback(async (title?: string): Promise<CampaignSession | null> => {
    if (!enabled || !campaignId || !userId) return null;
    
    try {
      // Calcula próximo número de sessão
      const nextNumber = sessions.length > 0 
        ? Math.max(...sessions.map(s => s.session_number)) + 1 
        : 1;
      
      const insertData = {
        campaign_id: campaignId,
        session_number: nextNumber,
        title: title || `Sessão ${nextNumber}`,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      };
      
      // Usa tabela v1 que já existe
      const { data, error } = await supabase
        .from('campaign_sessions')
        .insert([insertData])
        .select()
        .single();
      
      if (error) throw error;
      const session = normalizeCampaignSession(data) as CampaignSession;
      sessionSourcesRef.current[session.id] = 'campaign_sessions';
      setSessions(previous => [session, ...previous.filter(item => item.id !== session.id)]);
      
      toastRef.current?.({
        title: 'Sessão iniciada!',
        description: `Sessão #${nextNumber} começou.`,
      });
      
      return session;
    } catch (err: unknown) {
      console.error('Erro ao iniciar sessão:', err);
      toastRef.current?.({
        title: 'Erro ao iniciar sessão',
        description: 'Não foi possível iniciar a sessão. Tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  }, [enabled, campaignId, userId, sessions]);
  
  /**
   * Encerra sessão
   */
  const endSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!enabled || !campaignId || !userId || !sessionId) return false;
    try {
      const table = sessionSourcesRef.current[sessionId];
      if (!table) throw new Error('Sessão não carregada nesta campanha');
      const updateData = {
        status: 'completed',
        ended_at: new Date().toISOString(),
      };
      
      // Atualiza a origem real, inclusive para sessões exclusivas de v2.
      const { data, error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', sessionId)
        .eq('campaign_id', campaignId)
        .select('id')
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('A sessão não foi atualizada');
      setSessions(previous => previous.map(session => session.id === sessionId
        ? { ...session, ...updateData, status: 'completed' } : session));
      
      toastRef.current?.({
        title: 'Sessão encerrada',
        description: 'A sessão foi finalizada com sucesso.',
      });
      
      return true;
    } catch (err: unknown) {
      console.error('Erro ao encerrar sessão:', err);
      toastRef.current?.({
        title: 'Erro ao encerrar sessão',
        description: 'Não foi possível encerrar a sessão. Atualize a campanha e tente novamente.',
        variant: 'destructive',
      });
      return false;
    }
  }, [enabled, campaignId, userId]);
  
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
    const loadVersion = ++loadVersionRef.current;
    setMessages([]);
    setSessions([]);
    setUnreadCount(0);
    setIsConnected(false);
    seenMessageIdsRef.current.clear();
    sessionSourcesRef.current = {};
    lastReadIdRef.current = null;
    if (!enabled || !campaignId || !userId) return;
    
    fetchMessages();
    fetchSessions();

    /** Enriquece eventos recebidos sem duplicar cópias migradas nem os não lidos. */
    const receiveMessage = async (newMsg: CampaignMessage) => {
      const [profileRes, charRes] = await Promise.all([
        supabase.from('profiles').select('display_name').eq('user_id', newMsg.user_id).limit(1),
        newMsg.character_id
          ? supabase.from('characters').select('name').eq('id', newMsg.character_id).limit(1)
          : Promise.resolve({ data: [] }),
      ]);
      if (loadVersion !== loadVersionRef.current) return;
      const messageWithData: CampaignMessage = {
        ...newMsg,
        recipient_id: newMsg.recipient_id ?? null,
        profiles: profileRes.data?.[0] || { display_name: null },
        characters: charRes.data?.[0] || null,
      };
      const alreadySeen = seenMessageIdsRef.current.has(newMsg.id);
      seenMessageIdsRef.current.add(newMsg.id);
      setMessages(previous => alreadySeen ? previous
        : mergeCampaignMessages([...previous, messageWithData], []));
      if (!alreadySeen && newMsg.user_id !== userId) setUnreadCount(previous => previous + 1);
    };
    
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
      }, payload => receiveMessage(payload.new as CampaignMessage))
      // Mensagens v1 (fallback)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'campaign_messages',
        filter: `campaign_id=eq.${campaignId}`,
      }, payload => receiveMessage(payload.new as CampaignMessage))
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
      loadVersionRef.current += 1;
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
