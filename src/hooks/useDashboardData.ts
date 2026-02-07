/**
 * useDashboardData - Hook centralizado para busca de dados do Dashboard
 * Gerencia personagens, campanhas, perfil e atividade recente do usuário
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks';
import type { CampaignCardData } from '@/components/cards/CampaignCard';

// Interface para personagem no dashboard
export interface DashboardCharacter {
  id: string;
  name: string;
  class: string;
  origin: string;
  nex: number;
  patent: string;
  hp_current: number;
  hp_max: number;
  pe_current: number;
  pe_max: number;
  san_current: number;
  san_max: number;
  photo_url?: string | null;
  conditions?: string[];
}

// Interface para atividade recente
export interface RecentActivity {
  id: string;
  type: 'character_created' | 'character_updated' | 'campaign_joined' | 'session_scheduled';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

export function useDashboardData() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [characters, setCharacters] = useState<DashboardCharacter[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Busca perfil e personagens
  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();
      setProfile(profileData);

      const { data: charactersData } = await supabase
        .from('characters')
        .select('id, name, class, origin, nex, patent, hp_current, hp_max, pe_current, pe_max, san_current, san_max, photo_url, conditions, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      const chars = (charactersData || []).map(c => ({
        ...c,
        conditions: Array.isArray(c.conditions) ? c.conditions as string[] : []
      }));
      setCharacters(chars);

      // Monta atividade recente a partir dos personagens
      const activities: RecentActivity[] = (charactersData || [])
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          type: 'character_updated' as const,
          title: c.name,
          description: `${c.class} • NEX ${c.nex}%`,
          timestamp: c.updated_at,
          icon: 'character',
        }));
      setRecentActivity(activities);

      setLoading(false);
    }
    fetchData();
  }, [user]);

  // Busca campanhas (v2 com fallback v1)
  useEffect(() => {
    async function fetchCampaigns() {
      if (!user) return;
      setLoadingCampaigns(true);

      try {
        // Busca membros v2
        const { data: membershipV2 } = await supabase
          .from('campaign_members_v2')
          .select(`campaign_id, role, character_id, characters (id, name, class, photo_url)`)
          .eq('user_id', user.id);

        const campaignIdsV2 = (membershipV2 || []).map(m => m.campaign_id);

        let campaignsV2: CampaignCardData[] = [];
        if (campaignIdsV2.length > 0) {
          const { data: campaignsDataV2 } = await supabase
            .from('campaigns_v2')
            .select('*')
            .in('id', campaignIdsV2);

          const { data: memberCountsV2 } = await supabase
            .from('campaign_members_v2')
            .select('campaign_id')
            .in('campaign_id', campaignIdsV2);

          const { data: sessionsV2 } = await supabase
            .from('campaign_sessions_v2')
            .select('campaign_id, scheduled_at')
            .in('campaign_id', campaignIdsV2)
            .eq('status', 'scheduled')
            .gte('scheduled_at', new Date().toISOString())
            .order('scheduled_at', { ascending: true });

          const countMapV2: Record<string, number> = {};
          (memberCountsV2 || []).forEach(m => {
            countMapV2[m.campaign_id] = (countMapV2[m.campaign_id] || 0) + 1;
          });

          const sessionMapV2: Record<string, string> = {};
          (sessionsV2 || []).forEach(s => {
            if (!sessionMapV2[s.campaign_id]) {
              sessionMapV2[s.campaign_id] = s.scheduled_at!;
            }
          });

          campaignsV2 = (campaignsDataV2 || []).map(c => {
            const membership = membershipV2?.find(m => m.campaign_id === c.id);
            return {
              id: c.id,
              name: c.name,
              description: c.description,
              cover_image_url: c.cover_image_url,
              status: c.status as CampaignCardData['status'],
              current_session: c.current_session,
              master_id: c.master_id,
              player_count: countMapV2[c.id] || 0,
              next_session: sessionMapV2[c.id] || null,
              user_character: membership?.characters ? {
                id: membership.characters.id,
                name: membership.characters.name,
                class: membership.characters.class,
                photo_url: membership.characters.photo_url,
              } : null,
              is_master: c.master_id === user.id,
            };
          });
        }

        // Busca membros v1 (fallback)
        const { data: membershipV1 } = await supabase
          .from('campaign_members')
          .select(`campaign_id, role, character_id, characters (id, name, class, photo_url)`)
          .eq('user_id', user.id);

        const campaignIdsV1 = (membershipV1 || [])
          .map(m => m.campaign_id)
          .filter(id => !campaignIdsV2.includes(id));

        let campaignsV1: CampaignCardData[] = [];
        if (campaignIdsV1.length > 0) {
          const { data: campaignsDataV1 } = await supabase
            .from('campaigns')
            .select('*')
            .in('id', campaignIdsV1);

          const { data: memberCountsV1 } = await supabase
            .from('campaign_members')
            .select('campaign_id')
            .in('campaign_id', campaignIdsV1);

          const { data: sessionsV1 } = await supabase
            .from('campaign_sessions')
            .select('campaign_id, scheduled_at')
            .in('campaign_id', campaignIdsV1)
            .eq('status', 'scheduled')
            .gte('scheduled_at', new Date().toISOString())
            .order('scheduled_at', { ascending: true });

          const countMapV1: Record<string, number> = {};
          (memberCountsV1 || []).forEach(m => {
            countMapV1[m.campaign_id] = (countMapV1[m.campaign_id] || 0) + 1;
          });

          const sessionMapV1: Record<string, string> = {};
          (sessionsV1 || []).forEach(s => {
            if (!sessionMapV1[s.campaign_id] && s.scheduled_at) {
              sessionMapV1[s.campaign_id] = s.scheduled_at;
            }
          });

          campaignsV1 = (campaignsDataV1 || []).map(c => {
            const membership = membershipV1?.find(m => m.campaign_id === c.id);
            return {
              id: c.id,
              name: c.name,
              description: c.description,
              cover_image_url: c.cover_image_url,
              status: c.status as CampaignCardData['status'],
              current_session: c.current_session,
              master_id: c.master_id,
              player_count: countMapV1[c.id] || 0,
              next_session: sessionMapV1[c.id] || null,
              user_character: membership?.characters ? {
                id: membership.characters.id,
                name: membership.characters.name,
                class: membership.characters.class,
                photo_url: membership.characters.photo_url,
              } : null,
              is_master: c.master_id === user.id,
            };
          });
        }

        setCampaigns([...campaignsV2, ...campaignsV1]);
      } catch (error) {
        console.error('Erro ao carregar campanhas:', error);
      } finally {
        setLoadingCampaigns(false);
      }
    }
    fetchCampaigns();
  }, [user]);

  // Exclusão de personagem
  const handleDeleteCharacter = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${name}? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from('characters').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir o personagem.', variant: 'destructive' });
    } else {
      setCharacters(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Agente Removido', description: `O dossiê de ${name} foi arquivado permanentemente.` });
    }
  };

  // Exclusão de campanha
  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a campanha "${name}"? Esta ação não pode ser desfeita.`)) return;
    const { error: errorV2 } = await supabase.from('campaigns_v2').delete().eq('id', id);
    const { error: errorV1 } = await supabase.from('campaigns').delete().eq('id', id);
    if (errorV2 && errorV1) {
      toast({ title: 'Erro', description: 'Não foi possível excluir a campanha.', variant: 'destructive' });
    } else {
      setCampaigns(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Campanha Removida', description: `A campanha "${name}" foi arquivada permanentemente.` });
    }
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Agente';
  const hasLowStats = characters.some(c => c.hp_current < c.hp_max * 0.3 || c.san_current < c.san_max * 0.3);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const masteringCount = campaigns.filter(c => c.is_master).length;

  return {
    characters,
    campaigns,
    loading,
    loadingCampaigns,
    displayName,
    hasLowStats,
    activeCampaigns,
    masteringCount,
    recentActivity,
    handleDeleteCharacter,
    handleDeleteCampaign,
    isAuthenticated: !!user,
  };
}
