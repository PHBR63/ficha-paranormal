/**
 * Hook para gerenciar handouts (documentos, pistas, imagens) da campanha
 * Permite criar, editar, revelar e compartilhar com jogadores específicos
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Handout {
  id: string;
  campaign_id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  handout_type: 'document' | 'image' | 'clue' | 'npc';
  visibility: 'hidden' | 'visible' | 'shared_with';
  shared_with: string[] | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  revealed_at: string | null;
}

export function useHandouts(campaignId: string, isMaster: boolean, userId?: string) {
  const { user } = useAuth();
  const [handouts, setHandouts] = useState<Handout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar handouts
  const loadHandouts = useCallback(async () => {
    setIsLoading(true);
    
    let query = supabase
      .from('campaign_handouts')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    // Se não for mestre, filtra apenas os visíveis para o usuário
    if (!isMaster && userId) {
      query = query.or(`visibility.eq.visible,shared_with.cs.{${userId}}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao carregar handouts:', error);
      toast.error('Erro ao carregar documentos');
      return;
    }

    setHandouts((data || []).map(h => ({
      ...h,
      handout_type: h.handout_type as Handout['handout_type'],
      visibility: h.visibility as Handout['visibility'],
    })));
    setIsLoading(false);
  }, [campaignId, isMaster, userId]);

  // Criar handout
  const createHandout = useCallback(async (
    title: string,
    content: string,
    handoutType: Handout['handout_type'] = 'document',
    imageUrl?: string
  ) => {
    if (!isMaster || !user) return null;

    const { data, error } = await supabase
      .from('campaign_handouts')
      .insert({
        campaign_id: campaignId,
        title,
        content,
        handout_type: handoutType,
        image_url: imageUrl,
        visibility: 'hidden',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar handout:', error);
      toast.error('Erro ao criar documento');
      return null;
    }

    await loadHandouts();
    toast.success(`"${title}" criado!`);
    return data;
  }, [campaignId, isMaster, user, loadHandouts]);

  // Atualizar handout
  const updateHandout = useCallback(async (
    handoutId: string,
    updates: Partial<Pick<Handout, 'title' | 'content' | 'image_url' | 'handout_type'>>
  ) => {
    if (!isMaster) return false;

    const { error } = await supabase
      .from('campaign_handouts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', handoutId);

    if (error) {
      console.error('Erro ao atualizar handout:', error);
      toast.error('Erro ao atualizar documento');
      return false;
    }

    await loadHandouts();
    toast.success('Documento atualizado!');
    return true;
  }, [isMaster, loadHandouts]);

  // Revelar handout para todos
  const revealHandout = useCallback(async (handoutId: string) => {
    if (!isMaster) return false;

    const { error } = await supabase
      .from('campaign_handouts')
      .update({ 
        visibility: 'visible', 
        revealed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', handoutId);

    if (error) {
      console.error('Erro ao revelar handout:', error);
      toast.error('Erro ao revelar documento');
      return false;
    }

    await loadHandouts();
    toast.success('Documento revelado para todos!');
    return true;
  }, [isMaster, loadHandouts]);

  // Compartilhar com jogadores específicos
  const shareHandoutWith = useCallback(async (handoutId: string, memberIds: string[]) => {
    if (!isMaster) return false;

    const { error } = await supabase
      .from('campaign_handouts')
      .update({ 
        visibility: 'shared_with',
        shared_with: memberIds,
        revealed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', handoutId);

    if (error) {
      console.error('Erro ao compartilhar handout:', error);
      toast.error('Erro ao compartilhar documento');
      return false;
    }

    await loadHandouts();
    toast.success('Documento compartilhado!');
    return true;
  }, [isMaster, loadHandouts]);

  // Ocultar handout
  const hideHandout = useCallback(async (handoutId: string) => {
    if (!isMaster) return false;

    const { error } = await supabase
      .from('campaign_handouts')
      .update({ 
        visibility: 'hidden',
        shared_with: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', handoutId);

    if (error) {
      console.error('Erro ao ocultar handout:', error);
      toast.error('Erro ao ocultar documento');
      return false;
    }

    await loadHandouts();
    toast.success('Documento ocultado');
    return true;
  }, [isMaster, loadHandouts]);

  // Deletar handout
  const deleteHandout = useCallback(async (handoutId: string) => {
    if (!isMaster) return false;

    const { error } = await supabase
      .from('campaign_handouts')
      .delete()
      .eq('id', handoutId);

    if (error) {
      console.error('Erro ao deletar handout:', error);
      toast.error('Erro ao deletar documento');
      return false;
    }

    await loadHandouts();
    toast.success('Documento removido');
    return true;
  }, [isMaster, loadHandouts]);

  // Carregar ao montar
  useEffect(() => {
    loadHandouts();
  }, [loadHandouts]);

  // Subscribe para atualizações em tempo real
  useEffect(() => {
    const channel = supabase
      .channel(`handouts-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_handouts',
          filter: `campaign_id=eq.${campaignId}`
        },
        () => {
          loadHandouts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, loadHandouts]);

  return {
    handouts,
    isLoading,
    createHandout,
    updateHandout,
    revealHandout,
    shareHandoutWith,
    hideHandout,
    deleteHandout,
    refreshHandouts: loadHandouts,
  };
}
