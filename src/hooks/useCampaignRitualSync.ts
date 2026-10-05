/**
 * useCampaignRitualSync - Hook para sincronizar conjurações de rituais com a campanha
 * Envia conjurações para o banco em tempo real quando o personagem está em uma campanha
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Ritual } from '@/lib/rituals/legacy-exports';
import { useToast } from '@/hooks/use-toast';

// Interface para conjuração de ritual na campanha
export interface CampaignRitualCast {
  id: string;
  campaign_id: string;
  character_id: string;
  user_id: string;
  session_id: string | null;
  ritual_id: string;
  ritual_name: string;
  ritual_element: string;
  ritual_circle: number;
  pe_cost: number;
  enhancements: string[];
  pe_before: number;
  pe_after: number;
  created_at: string;
  // Campos adicionados pelo join
  character_name?: string;
}

interface UseCampaignRitualSyncProps {
  characterId: string;
  userId: string;
  enabled?: boolean;
}

interface UseCampaignRitualSyncReturn {
  campaignId: string | null;
  sessionId: string | null;
  isInCampaign: boolean;
  isMaster: boolean;
  syncRitualCast: (
    ritual: Ritual,
    peCost: number,
    enhancements: string[],
    peBefore: number,
    peAfter: number
  ) => Promise<void>;
  recentCasts: CampaignRitualCast[];
  loading: boolean;
}

export function useCampaignRitualSync({
  characterId,
  userId,
  enabled = true,
}: UseCampaignRitualSyncProps): UseCampaignRitualSyncReturn {
  const { toast } = useToast();
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isMaster, setIsMaster] = useState(false);
  const [recentCasts, setRecentCasts] = useState<CampaignRitualCast[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca a campanha associada ao personagem
  useEffect(() => {
    if (!enabled || !characterId || !userId) {
      setLoading(false);
      return;
    }

    const fetchCampaignInfo = async () => {
      try {
        // Busca se o personagem está em alguma campanha
        const { data: memberData, error: memberError } = await supabase
          .from('campaign_members')
          .select(`
            campaign_id,
            role,
            campaigns!inner (
              id,
              master_id,
              current_session
            )
          `)
          .eq('character_id', characterId)
          .eq('user_id', userId)
          .maybeSingle();

        if (memberError) {
          console.error('Erro ao buscar campanha:', memberError);
          setLoading(false);
          return;
        }

        if (memberData) {
          const campaign = memberData.campaigns as any;
          setCampaignId(campaign.id);
          setIsMaster(campaign.master_id === userId);

          // Busca a sessão ativa (se houver)
          const { data: sessionData } = await supabase
            .from('campaign_sessions')
            .select('id')
            .eq('campaign_id', campaign.id)
            .eq('status', 'in_progress')
            .maybeSingle();

          if (sessionData) {
            setSessionId(sessionData.id);
          }

          // Busca conjurações recentes da campanha
          const { data: castsData } = await supabase
            .from('campaign_ritual_casts')
            .select('*')
            .eq('campaign_id', campaign.id)
            .order('created_at', { ascending: false })
            .limit(50);

          if (castsData) {
            setRecentCasts(castsData as CampaignRitualCast[]);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar info da campanha:', error);
        setLoading(false);
      }
    };

    fetchCampaignInfo();
  }, [characterId, userId, enabled]);

  // Subscreve para atualizações em tempo real
  useEffect(() => {
    if (!campaignId || !enabled) return;

    console.log('[RitualSync] Subscribing to realtime updates for campaign:', campaignId);

    const channel = supabase
      .channel(`campaign-ritual-casts-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_ritual_casts',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          console.log('[RitualSync] New ritual cast received:', payload);
          const newCast = payload.new as CampaignRitualCast;
          setRecentCasts(prev => [newCast, ...prev].slice(0, 50));
        }
      )
      .subscribe((status) => {
        console.log('[RitualSync] Subscription status:', status);
      });

    return () => {
      console.log('[RitualSync] Unsubscribing from realtime updates');
      supabase.removeChannel(channel);
    };
  }, [campaignId, enabled]);

  // Função para sincronizar uma conjuração com a campanha
  const syncRitualCast = useCallback(async (
    ritual: Ritual,
    peCost: number,
    enhancements: string[],
    peBefore: number,
    peAfter: number
  ) => {
    if (!campaignId || !characterId || !userId) {
      console.log('[RitualSync] Skipping sync - not in campaign');
      return;
    }

    try {
      console.log('[RitualSync] Syncing ritual cast to campaign:', {
        campaignId,
        characterId,
        ritual: ritual.name,
        peCost,
      });

      const { error } = await supabase
        .from('campaign_ritual_casts')
        .insert({
          campaign_id: campaignId,
          character_id: characterId,
          user_id: userId,
          session_id: sessionId,
          ritual_id: ritual.id,
          ritual_name: ritual.name,
          ritual_element: ritual.element,
          ritual_circle: ritual.circle,
          pe_cost: peCost,
          enhancements,
          pe_before: peBefore,
          pe_after: peAfter,
        });

      if (error) {
        console.error('[RitualSync] Error syncing ritual cast:', error);
        // Não mostra toast de erro para não interromper a experiência
      } else {
        console.log('[RitualSync] Ritual cast synced successfully');
      }
    } catch (error) {
      console.error('[RitualSync] Exception syncing ritual cast:', error);
    }
  }, [campaignId, characterId, userId, sessionId]);

  return {
    campaignId,
    sessionId,
    isInCampaign: !!campaignId,
    isMaster,
    syncRitualCast,
    recentCasts,
    loading,
  };
}
