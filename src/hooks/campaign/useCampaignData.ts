/**
 * useCampaignData - Hook único para dados da campanha v2
 *
 * Centraliza carregamento de campanha + membros + profiles
 * Usa Ref-First pattern para callbacks estáveis (evita loop #185)
 *
 * @module hooks/campaign/useCampaignData
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getCampaignConditionLabels } from '@/lib/campaign-condition-presentation';

// Interface da campanha v2
export interface CampaignV2 {
  id: string;
  master_id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  status: 'active' | 'paused' | 'completed' | 'archived';
  current_session: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Interface de membro da campanha v2
export interface CampaignMemberV2 {
  id: string;
  campaign_id: string;
  user_id: string;
  character_id: string | null;
  role: 'master' | 'player';
  active_bonuses: Record<string, unknown> | null;
  bonuses_updated_at: string | null;
  joined_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  characters?: {
    id: string;
    name: string;
    class: string;
    class_track: string | null;
    origin: string;
    patent: string;
    nex: number;
    hp_current: number;
    hp_max: number;
    pe_current: number;
    pe_max: number;
    san_current: number;
    san_max: number;
    defense: number;
    movement: number;
    photo_url: string | null;
    conditions: string[];
  } | null;
}

// Props do hook
interface UseCampaignDataProps {
  campaignId: string;
  userId: string;
}

// Retorno do hook
export interface UseCampaignDataReturn {
  schemaVersion: 'v1' | 'v2' | null;
  campaign: CampaignV2 | null;
  members: CampaignMemberV2[];
  isMaster: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCampaignData({
  campaignId,
  userId,
}: UseCampaignDataProps): UseCampaignDataReturn {
  const { toast } = useToast();

  // Ref-First: estabiliza toast para evitar recriação de callbacks
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  // Estado principal
  const [campaign, setCampaign] = useState<CampaignV2 | null>(null);
  const [schemaVersion, setSchemaVersion] = useState<'v1' | 'v2' | null>(null);
  const [members, setMembers] = useState<CampaignMemberV2[]>([]);
  const memberCharacterIds = useRef(new Set<string>());
  const currentContext = useRef(`${userId}:${campaignId}`);
  currentContext.current = `${userId}:${campaignId}`;
  memberCharacterIds.current = new Set(members.flatMap(member => member.character_id ? [member.character_id] : []));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calcula isMaster de forma derivada (estável)
  const isMaster = !!(campaign?.master_id && campaign.master_id === userId);

  /**
   * Fallback para carregar membros v1 (compatibilidade)
   */
  const loadMembersV1 = useCallback(async (campId: string) => {
    const requestContext = `${userId}:${campId}`;
    try {
      const { data: membersRaw, error: membersError } = await supabase
        .from('campaign_members')
        .select(`
          id, user_id, character_id, role, joined_at,
          characters (id, name, class, class_track, origin, patent, nex, hp_current, hp_max, pe_current, pe_max, san_current, san_max, defense, movement, photo_url, conditions)
        `)
        .eq('campaign_id', campId);

      if (membersError) throw membersError;
      if (currentContext.current !== requestContext) return;

      const userIds = (membersRaw || []).map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);
      if (profilesError) throw profilesError;
      if (currentContext.current !== requestContext) return;

      const profileLookup: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      (profiles || []).forEach(p => { profileLookup[p.user_id] = p; });

      const membersWithData = (membersRaw || []).map(member => ({
        ...member,
        campaign_id: campId,
        role: member.role as CampaignMemberV2['role'],
        active_bonuses: null,
        bonuses_updated_at: null,
        profiles: profileLookup[member.user_id] || { display_name: null, avatar_url: null },
        characters: member.characters ? {
          ...member.characters,
          conditions: getCampaignConditionLabels(member.characters.conditions),
        } : null,
      })) as CampaignMemberV2[];

      setMembers(membersWithData);
      setError(null);
    } catch (err: unknown) {
      if (currentContext.current !== requestContext) return;
      console.error('Erro ao carregar membros v1:', err);
      setError('Não foi possível carregar os membros da campanha. Verifique a conexão e o acesso.');
    } finally {
      if (currentContext.current === requestContext) setLoading(false);
    }
  }, [userId]);

  /**
   * Carrega dados da campanha com queries em lote
   * Memoizado com dependências mínimas para estabilidade
   */
  const refetch = useCallback(async () => {
    const requestContext = `${userId}:${campaignId}`;
    if (!campaignId || !userId) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch campanha v2 - usa .limit(1) para evitar erro 406 (Not Acceptable)
      const { data: campaignDataArr, error: campaignError } = await supabase
        .from('campaigns_v2')
        .select('*')
        .eq('id', campaignId)
        .limit(1);

      const campaignData = campaignDataArr?.[0];
      if (currentContext.current !== requestContext) return;

      if (campaignError || !campaignData) {
        // Se não encontrar na v2, tenta v1 como fallback
        const { data: campaignV1Arr, error: v1Error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .limit(1);

        const campaignV1 = campaignV1Arr?.[0];
        if (currentContext.current !== requestContext) return;
        if (v1Error || !campaignV1) throw v1Error || new Error('Campanha não encontrada');

        // Adapta dados v1 para interface v2
        setSchemaVersion('v1');
        setCampaign({
          ...campaignV1,
          status: campaignV1.status as CampaignV2['status'],
          settings: typeof campaignV1.settings === 'object' ? campaignV1.settings as Record<string, unknown> : {},
        });

        // Continua com membros v1
        await loadMembersV1(campaignId);
        return;
      }

      setCampaign(campaignData as CampaignV2);
      setSchemaVersion('v2');

      // 2. Fetch membros v2 com join em characters
      const { data: membersRaw, error: membersError } = await supabase
        .from('campaign_members_v2')
        .select(`
          id, campaign_id, user_id, character_id, role, active_bonuses, bonuses_updated_at, joined_at,
          characters (id, name, class, class_track, origin, patent, nex, hp_current, hp_max, pe_current, pe_max, san_current, san_max, defense, movement, photo_url, conditions)
        `)
        .eq('campaign_id', campaignId);

      if (membersError) throw membersError;
      if (currentContext.current !== requestContext) return;

      // 3. Busca profiles em lote (sem FK, usa IN)
      const userIds = (membersRaw || []).map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);
      if (profilesError) throw profilesError;
      if (currentContext.current !== requestContext) return;

      // 4. Cria lookup Map para O(1) e mescla
      const profileLookup: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      (profiles || []).forEach(p => { profileLookup[p.user_id] = p; });

      const membersWithData = (membersRaw || []).map(member => ({
        ...member,
        role: member.role as CampaignMemberV2['role'],
        profiles: profileLookup[member.user_id] || { display_name: null, avatar_url: null },
        characters: member.characters ? {
          ...member.characters,
          conditions: getCampaignConditionLabels(member.characters.conditions),
        } : null,
      })) as CampaignMemberV2[];

      setMembers(membersWithData);
      setError(null);

    } catch (err: unknown) {
      if (currentContext.current !== requestContext) return;
      console.error('Erro ao carregar campanha:', err);
      setError('Não foi possível carregar a campanha. Verifique a conexão e o acesso.');
      toastRef.current?.({
        title: 'Erro',
        description: 'Não foi possível carregar a campanha.',
        variant: 'destructive',
      });
    } finally {
      if (currentContext.current === requestContext) setLoading(false);
    }
  }, [campaignId, userId, loadMembersV1]); // Deps mínimas - toast usa ref

  // Carregamento inicial e realtime
  useEffect(() => {
    setMembers([]); setCampaign(null); setSchemaVersion(null); setError(null); setLoading(true);
    memberCharacterIds.current.clear();
    if (!campaignId || !userId) return;

    refetch();

    // Subscribe para mudanças em membros (v2 primeiro, fallback v1)
    const channelName = `campaign-data-${campaignId}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'campaign_members_v2',
        filter: `campaign_id=eq.${campaignId}`,
      }, () => refetch())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'campaign_members',
        filter: `campaign_id=eq.${campaignId}`,
      }, () => refetch())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'characters',
      }, payload => {
        // Recursos/condições confirmados podem mudar sem UPDATE no membro.
        // RLS filtra o servidor; este filtro evita recarregar campanhas alheias.
        if (typeof payload.new.id === 'string' && memberCharacterIds.current.has(payload.new.id)) void refetch();
      })
      .subscribe(status => {
        // SUBSCRIBED também ocorre após reconexão: recupera eventos perdidos.
        if (status === 'SUBSCRIBED') void refetch();
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, userId, refetch]);

  return {
    schemaVersion,
    campaign,
    members,
    isMaster,
    loading,
    error,
    refetch,
  };
}
