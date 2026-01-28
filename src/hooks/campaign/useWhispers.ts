/**
 * Hook para gerenciar sussurros (mensagens privadas) na campanha
 * Permite enviar mensagens visíveis apenas para destinatários específicos
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Whisper {
  id: string;
  campaign_id: string;
  user_id: string;
  character_id: string | null;
  recipient_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  recipient_name?: string;
}

export function useWhispers(campaignId: string) {
  const { user } = useAuth();
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar sussurros do usuário atual
  const loadWhispers = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);

    // Buscar mensagens onde o usuário é remetente ou destinatário
    const { data, error } = await supabase
      .from('campaign_messages')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('message_type', 'whisper')
      .or(`user_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao carregar sussurros:', error);
      return;
    }

    // Enriquecer com nomes
    const enrichedWhispers = await Promise.all(
      (data || []).map(async (msg) => {
        // Usar maybeSingle() para evitar erro 406 quando perfil não existe
        const [senderProfile, recipientProfile] = await Promise.all([
          supabase.from('profiles').select('display_name').eq('user_id', msg.user_id).maybeSingle(),
          supabase.from('profiles').select('display_name').eq('user_id', msg.recipient_id).maybeSingle()
        ]);

        return {
          ...msg,
          sender_name: senderProfile.data?.display_name || 'Desconhecido',
          recipient_name: recipientProfile.data?.display_name || 'Desconhecido',
        } as Whisper;
      })
    );

    setWhispers(enrichedWhispers);
    setIsLoading(false);
  }, [campaignId, user]);

  // Enviar sussurro
  const sendWhisper = useCallback(async (
    recipientId: string,
    content: string,
    characterId?: string
  ) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('campaign_messages')
      .insert({
        campaign_id: campaignId,
        user_id: user.id,
        recipient_id: recipientId,
        character_id: characterId || null,
        message_type: 'whisper',
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao enviar sussurro:', error);
      toast.error('Erro ao enviar mensagem privada');
      return null;
    }

    toast.success('Sussurro enviado');
    return data;
  }, [campaignId, user]);

  // Carregar ao montar
  useEffect(() => {
    loadWhispers();
  }, [loadWhispers]);

  // Subscribe para atualizações em tempo real
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`whispers-${campaignId}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_messages',
          filter: `campaign_id=eq.${campaignId}`
        },
        async (payload) => {
          const msg = payload.new as any;
          
          // Verificar se é sussurro e se o usuário está envolvido
          if (msg.message_type !== 'whisper') return;
          if (msg.user_id !== user.id && msg.recipient_id !== user.id) return;

          // Enriquecer com nomes
          // Usar maybeSingle() para evitar erro 406 quando perfil não existe
          const [senderProfile, recipientProfile] = await Promise.all([
            supabase.from('profiles').select('display_name').eq('user_id', msg.user_id).maybeSingle(),
            supabase.from('profiles').select('display_name').eq('user_id', msg.recipient_id).maybeSingle()
          ]);

          const enrichedWhisper: Whisper = {
            ...msg,
            sender_name: senderProfile.data?.display_name || 'Desconhecido',
            recipient_name: recipientProfile.data?.display_name || 'Desconhecido',
          };

          setWhispers(prev => [...prev, enrichedWhisper]);

          // Notificar se for destinatário
          if (msg.recipient_id === user.id) {
            toast.info(`💬 Sussurro de ${enrichedWhisper.sender_name}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, user]);

  return {
    whispers,
    isLoading,
    sendWhisper,
    refreshWhispers: loadWhispers,
  };
}
