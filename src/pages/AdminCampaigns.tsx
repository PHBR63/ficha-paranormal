/**
 * AdminCampaigns - Painel administrativo de gerenciamento de campanhas
 * 
 * Funcionalidades:
 * - Listagem de todas as campanhas (v1 e v2) com status, mestre e jogadores
 * - Moderação: pausar, encerrar ou excluir campanhas
 * - Monitoramento em tempo real de atividade
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Swords,
  Users,
  Loader2,
  Crown,
  MoreVertical,
  Pause,
  Play,
  Trash2,
  XCircle,
  Activity,
  Clock,
  Eye,
  RefreshCw,
  Signal,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AdminNav, AdminPageSkeleton, AdminSearchBar, AdminPagination } from '@/components/admin';
import { useAdminFilters } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// Tipos e interfaces
// ============================================================

/** Status possível de uma campanha */
type CampaignStatus = 'active' | 'paused' | 'completed' | 'archived';

/** Dados da campanha combinados para exibição */
interface CampaignData {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  master_id: string;
  master_name: string | null;
  master_avatar: string | null;
  member_count: number;
  current_session: number;
  created_at: string;
  updated_at: string;
  cover_image_url: string | null;
  /** Versão do schema: 'v1' ou 'v2' */
  schema_version: 'v1' | 'v2';
}

/** Evento recente para monitoramento em tempo real */
interface RecentEvent {
  id: string;
  type: 'message' | 'session_start' | 'member_join' | 'campaign_created';
  campaign_name: string;
  campaign_id: string;
  description: string;
  timestamp: string;
  user_name: string | null;
}

// ============================================================
// Configuração visual de status
// ============================================================

const statusConfig: Record<CampaignStatus, {
  label: string;
  badgeClass: string;
  icon: React.ReactNode;
}> = {
  active: {
    label: 'Ativa',
    badgeClass: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
    icon: <Play className="h-3 w-3" />,
  },
  paused: {
    label: 'Pausada',
    badgeClass: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    icon: <Pause className="h-3 w-3" />,
  },
  completed: {
    label: 'Concluída',
    badgeClass: 'bg-sky-500/20 text-sky-500 border-sky-500/30',
    icon: <XCircle className="h-3 w-3" />,
  },
  archived: {
    label: 'Arquivada',
    badgeClass: 'bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30',
    icon: <Clock className="h-3 w-3" />,
  },
};

// ============================================================
// Componente principal
// ============================================================

export default function AdminCampaigns() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Estados de dados
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRealtime, setShowRealtime] = useState(true);

  // Dialog de confirmação para ações destrutivas
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    campaignId: string;
    campaignName: string;
    action: 'pause' | 'resume' | 'complete' | 'archive' | 'delete';
    schemaVersion: 'v1' | 'v2';
  } | null>(null);

  // Hook de filtros e paginação
  const {
    paginatedData,
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    pagination,
    goToPage,
    setPageSize,
    hasActiveFilters,
    clearFilters,
  } = useAdminFilters<CampaignData, { status: string; version: string }>({
    data: campaigns,
    pageSize: 20,
    searchFn: (campaign, term) =>
      campaign.name.toLowerCase().includes(term) ||
      (campaign.master_name?.toLowerCase().includes(term) || false) ||
      campaign.id.toLowerCase().includes(term),
    filterFn: (campaign, f) => {
      const statusMatch = !f.status || f.status === 'all' || campaign.status === f.status;
      const versionMatch = !f.version || f.version === 'all' || campaign.schema_version === f.version;
      return statusMatch && versionMatch;
    },
    initialSortField: 'updated_at',
    initialSortOrder: 'desc',
    sortFn: (a, b, sort) => {
      if (sort.field === 'updated_at') {
        const dateA = new Date(a.updated_at).getTime();
        const dateB = new Date(b.updated_at).getTime();
        return sort.order === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (sort.field === 'member_count') {
        return sort.order === 'asc'
          ? a.member_count - b.member_count
          : b.member_count - a.member_count;
      }
      return 0;
    },
  });

  // ============================================================
  // Estatísticas rápidas
  // ============================================================

  const stats = useMemo(() => {
    const active = campaigns.filter(c => c.status === 'active').length;
    const paused = campaigns.filter(c => c.status === 'paused').length;
    const totalMembers = campaigns.reduce((sum, c) => sum + c.member_count, 0);
    const uniqueMasters = new Set(campaigns.map(c => c.master_id)).size;
    return { total: campaigns.length, active, paused, totalMembers, uniqueMasters };
  }, [campaigns]);

  // ============================================================
  // Buscar dados
  // ============================================================

  /** Busca todas as campanhas v1 e v2 com dados do mestre e contagem de membros */
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      // Buscar campanhas v1
      const { data: campaignsV1, error: errV1 } = await supabase
        .from('campaigns')
        .select('id, name, description, status, master_id, current_session, created_at, updated_at, cover_image_url')
        .order('updated_at', { ascending: false });

      if (errV1) throw errV1;

      // Buscar campanhas v2
      const { data: campaignsV2, error: errV2 } = await supabase
        .from('campaigns_v2')
        .select('id, name, description, status, master_id, current_session, created_at, updated_at, cover_image_url')
        .order('updated_at', { ascending: false });

      if (errV2) throw errV2;

      // Buscar membros v1
      const { data: membersV1, error: errM1 } = await supabase
        .from('campaign_members')
        .select('campaign_id');

      if (errM1) throw errM1;

      // Buscar membros v2
      const { data: membersV2, error: errM2 } = await supabase
        .from('campaign_members_v2')
        .select('campaign_id');

      if (errM2) throw errM2;

      // Contagem de membros por campanha
      const memberCountMap = new Map<string, number>();
      membersV1?.forEach(m => {
        memberCountMap.set(m.campaign_id, (memberCountMap.get(m.campaign_id) || 0) + 1);
      });
      membersV2?.forEach(m => {
        memberCountMap.set(m.campaign_id, (memberCountMap.get(m.campaign_id) || 0) + 1);
      });

      // IDs de mestres únicos para buscar perfis
      const allMasterIds = new Set<string>();
      campaignsV1?.forEach(c => allMasterIds.add(c.master_id));
      campaignsV2?.forEach(c => allMasterIds.add(c.master_id));

      // Buscar perfis dos mestres
      const { data: profiles, error: errP } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', Array.from(allMasterIds));

      if (errP) throw errP;

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Montar dados combinados
      const allCampaigns: CampaignData[] = [
        ...(campaignsV1 || []).map(c => {
          const profile = profileMap.get(c.master_id);
          return {
            ...c,
            status: (c.status as CampaignStatus) || 'active',
            master_name: profile?.display_name || null,
            master_avatar: profile?.avatar_url || null,
            member_count: memberCountMap.get(c.id) || 0,
            schema_version: 'v1' as const,
          };
        }),
        ...(campaignsV2 || []).map(c => {
          const profile = profileMap.get(c.master_id);
          return {
            ...c,
            status: (c.status as CampaignStatus) || 'active',
            master_name: profile?.display_name || null,
            master_avatar: profile?.avatar_url || null,
            member_count: memberCountMap.get(c.id) || 0,
            schema_version: 'v2' as const,
          };
        }),
      ];

      // Ordenar por atualização mais recente
      allCampaigns.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      setCampaigns(allCampaigns);
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  /** Busca eventos recentes para monitoramento em tempo real */
  const fetchRecentEvents = async () => {
    try {
      // Buscar mensagens recentes (v1 e v2)
      const { data: messagesV1 } = await supabase
        .from('campaign_messages')
        .select('id, campaign_id, content, created_at, user_id, message_type')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: messagesV2 } = await supabase
        .from('campaign_messages_v2')
        .select('id, campaign_id, content, created_at, user_id, message_type')
        .order('created_at', { ascending: false })
        .limit(10);

      // Combinar e converter em eventos
      const events: RecentEvent[] = [];

      const allMessages = [
        ...(messagesV1 || []).map(m => ({ ...m, version: 'v1' as const })),
        ...(messagesV2 || []).map(m => ({ ...m, version: 'v2' as const })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 15);

      // Buscar nomes das campanhas e usuários
      const campaignIds = new Set(allMessages.map(m => m.campaign_id));
      const userIds = new Set(allMessages.map(m => m.user_id));

      // Buscar perfis dos usuários
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', Array.from(userIds));

      const userMap = new Map(userProfiles?.map(p => [p.user_id, p.display_name]) || []);

      // Mapear nomes de campanhas dos dados já carregados
      const campaignNameMap = new Map(campaigns.map(c => [c.id, c.name]));

      allMessages.forEach(msg => {
        events.push({
          id: msg.id,
          type: 'message',
          campaign_name: campaignNameMap.get(msg.campaign_id) || 'Campanha',
          campaign_id: msg.campaign_id,
          description: msg.message_type === 'dice_roll'
            ? 'realizou uma rolagem de dados'
            : msg.content.slice(0, 60) + (msg.content.length > 60 ? '...' : ''),
          timestamp: msg.created_at,
          user_name: userMap.get(msg.user_id) || null,
        });
      });

      setRecentEvents(events);
    } catch (error) {
      console.error('Erro ao buscar eventos recentes:', error);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Carregar eventos quando campanhas estiverem disponíveis
  useEffect(() => {
    if (campaigns.length > 0) {
      fetchRecentEvents();
    }
  }, [campaigns.length]);

  // Realtime: escutar novas mensagens
  useEffect(() => {
    if (!showRealtime) return;

    const channel = supabase
      .channel('admin-campaign-monitor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaign_messages_v2' },
        () => {
          // Atualizar eventos recentes quando houver nova atividade (v2)
          fetchRecentEvents();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaign_messages' },
        () => {
          // Atualizar eventos recentes quando houver nova atividade (v1)
          fetchRecentEvents();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaigns_v2' },
        () => {
          // Recarregar campanhas quando houver mudanças (v2)
          fetchCampaigns();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaigns' },
        () => {
          // Recarregar campanhas quando houver mudanças (v1)
          fetchCampaigns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showRealtime, campaigns.length]);

  // ============================================================
  // Ações de moderação
  // ============================================================

  /** Alterar status de uma campanha */
  const changeCampaignStatus = async (
    campaignId: string,
    newStatus: CampaignStatus,
    schemaVersion: 'v1' | 'v2'
  ) => {
    setActionLoading(campaignId);
    try {
      const table = schemaVersion === 'v2' ? 'campaigns_v2' : 'campaigns';
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', campaignId);

      if (error) throw error;

      // Registrar log de auditoria (target_user_id = mestre da campanha afetada)
      await supabase.from('audit_logs').insert({
        action_type: 'campaign_status_change',
        target_user_id: campaigns.find(c => c.id === campaignId)?.master_id || currentUser?.id || '',
        performed_by: currentUser?.id || '',
        old_value: campaigns.find(c => c.id === campaignId)?.status || '',
        new_value: newStatus,
        details: {
          campaign_id: campaignId,
          campaign_name: campaigns.find(c => c.id === campaignId)?.name,
          schema_version: schemaVersion,
        },
      });

      toast.success(`Campanha ${statusConfig[newStatus].label.toLowerCase()} com sucesso`);
      fetchCampaigns();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status da campanha');
    } finally {
      setActionLoading(null);
      setConfirmDialog(null);
    }
  };

  /** Excluir campanha (ação destrutiva) */
  const deleteCampaign = async (campaignId: string, schemaVersion: 'v1' | 'v2') => {
    setActionLoading(campaignId);
    try {
      const table = schemaVersion === 'v2' ? 'campaigns_v2' : 'campaigns';
      const campaign = campaigns.find(c => c.id === campaignId);

      const { error } = await supabase.from(table).delete().eq('id', campaignId);

      if (error) throw error;

      // Registrar log de auditoria
      await supabase.from('audit_logs').insert({
        action_type: 'campaign_deleted',
        target_user_id: campaign?.master_id || '',
        performed_by: currentUser?.id || '',
        old_value: campaign?.name || '',
        new_value: null,
        details: {
          campaign_id: campaignId,
          campaign_name: campaign?.name,
          schema_version: schemaVersion,
          member_count: campaign?.member_count,
        },
      });

      toast.success('Campanha excluída com sucesso');
      fetchCampaigns();
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
      toast.error('Erro ao excluir campanha');
    } finally {
      setActionLoading(null);
      setConfirmDialog(null);
    }
  };

  /** Executar ação confirmada */
  const handleConfirmAction = () => {
    if (!confirmDialog) return;

    switch (confirmDialog.action) {
      case 'pause':
        changeCampaignStatus(confirmDialog.campaignId, 'paused', confirmDialog.schemaVersion);
        break;
      case 'resume':
        changeCampaignStatus(confirmDialog.campaignId, 'active', confirmDialog.schemaVersion);
        break;
      case 'complete':
        changeCampaignStatus(confirmDialog.campaignId, 'completed', confirmDialog.schemaVersion);
        break;
      case 'archive':
        changeCampaignStatus(confirmDialog.campaignId, 'archived', confirmDialog.schemaVersion);
        break;
      case 'delete':
        deleteCampaign(confirmDialog.campaignId, confirmDialog.schemaVersion);
        break;
    }
  };

  /** Obter iniciais do nome */
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  /** Texto do dialog de confirmação baseado na ação */
  const getConfirmText = () => {
    if (!confirmDialog) return { title: '', description: '' };

    const texts = {
      pause: {
        title: 'Pausar Campanha',
        description: `Tem certeza que deseja pausar a campanha "${confirmDialog.campaignName}"? Os jogadores não poderão interagir enquanto estiver pausada.`,
      },
      resume: {
        title: 'Retomar Campanha',
        description: `Deseja retomar a campanha "${confirmDialog.campaignName}"? Ela voltará ao status ativa.`,
      },
      complete: {
        title: 'Encerrar Campanha',
        description: `Tem certeza que deseja encerrar a campanha "${confirmDialog.campaignName}"? Esta ação marca a campanha como concluída.`,
      },
      archive: {
        title: 'Arquivar Campanha',
        description: `Deseja arquivar a campanha "${confirmDialog.campaignName}"? Campanhas arquivadas ficam preservadas mas inacessíveis para os jogadores.`,
      },
      delete: {
        title: 'Excluir Campanha',
        description: `ATENÇÃO: Esta ação é IRREVERSÍVEL. Todos os dados da campanha "${confirmDialog.campaignName}" (mensagens, sessões, notas, mapas) serão permanentemente excluídos.`,
      },
    };

    return texts[confirmDialog.action];
  };

  // ============================================================
  // Renderização
  // ============================================================

  return (
    <div className="min-h-screen bg-background">
      {/* Header com navegação unificada */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Swords className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Painel Administrativo
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerenciamento de Campanhas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchCampaigns();
                  fetchRecentEvents();
                }}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </div>
          <AdminNav currentPage="campaigns" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Swords className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Play className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Pause className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.paused}</p>
                  <p className="text-xs text-muted-foreground">Pausadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10">
                  <Users className="h-5 w-5 text-sky-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalMembers}</p>
                  <p className="text-xs text-muted-foreground">Jogadores</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Crown className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.uniqueMasters}</p>
                  <p className="text-xs text-muted-foreground">Mestres</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monitor em tempo real */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Signal className="h-5 w-5 text-emerald-500" />
                <CardTitle className="text-base">Atividade Recente</CardTitle>
                {showRealtime && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-xs gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Ao vivo
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRealtime(!showRealtime)}
                className="text-xs"
              >
                {showRealtime ? 'Pausar monitor' : 'Ativar monitor'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atividade recente detectada
              </p>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {recentEvents.map((event) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                      >
                        <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-foreground">
                            {event.user_name || 'Usuário'}
                          </span>
                          <span className="text-muted-foreground"> em </span>
                          <span className="font-medium text-primary">
                            {event.campaign_name}
                          </span>
                          <span className="text-muted-foreground">: {event.description}</span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(event.timestamp), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Tabela de campanhas */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Swords className="h-5 w-5 text-primary" />
                  Campanhas ({campaigns.length})
                </CardTitle>
                <CardDescription>
                  Visualize, modere e gerencie todas as campanhas do sistema
                </CardDescription>
              </div>
            </div>

            {/* Barra de busca e filtros */}
            <AdminSearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Buscar por nome, mestre ou ID..."
              filters={[
                {
                  id: 'status',
                  label: 'Status',
                  value: filters.status || 'all',
                  options: [
                    { value: 'all', label: 'Todos' },
                    { value: 'active', label: 'Ativas', icon: <Play className="h-3 w-3 text-emerald-500" /> },
                    { value: 'paused', label: 'Pausadas', icon: <Pause className="h-3 w-3 text-amber-500" /> },
                    { value: 'completed', label: 'Concluídas', icon: <XCircle className="h-3 w-3 text-sky-500" /> },
                  ],
                  onChange: (value) => setFilter('status', value),
                },
                {
                  id: 'version',
                  label: 'Versão',
                  value: filters.version || 'all',
                  options: [
                    { value: 'all', label: 'Todas' },
                    { value: 'v1', label: 'Schema v1' },
                    { value: 'v2', label: 'Schema v2' },
                  ],
                  onChange: (value) => setFilter('version', value),
                },
              ]}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              totalResults={pagination.totalItems}
              totalItems={campaigns.length}
            />
          </CardHeader>

          <CardContent>
            {loading ? (
              <AdminPageSkeleton />
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma campanha encontrada
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campanha</TableHead>
                      <TableHead>Mestre</TableHead>
                      <TableHead className="text-center">Jogadores</TableHead>
                      <TableHead className="text-center">Sessões</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Última Atividade</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((campaign) => {
                      const isLoading = actionLoading === campaign.id;
                      const config = statusConfig[campaign.status] || statusConfig.active;

                      return (
                        <TableRow key={`${campaign.schema_version}-${campaign.id}`}>
                          {/* Nome da campanha */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="font-medium text-foreground">
                                  {campaign.name}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {campaign.schema_version.toUpperCase()} · {campaign.id.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Mestre */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={campaign.master_avatar || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(campaign.master_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-foreground">
                                {campaign.master_name || 'Sem nome'}
                              </span>
                            </div>
                          </TableCell>

                          {/* Jogadores */}
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">{campaign.member_count}</span>
                            </div>
                          </TableCell>

                          {/* Sessões */}
                          <TableCell className="text-center">
                            <span className="text-sm">{campaign.current_session}</span>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`gap-1 ${config.badgeClass}`}
                            >
                              {config.icon}
                              {config.label}
                            </Badge>
                          </TableCell>

                          {/* Última atividade */}
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(campaign.updated_at), {
                                    addSuffix: true,
                                    locale: ptBR,
                                  })}
                                </TooltipTrigger>
                                <TooltipContent>
                                  {format(new Date(campaign.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>

                          {/* Ações */}
                          <TableCell className="text-right">
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {/* Pausar / Retomar */}
                                  {campaign.status === 'active' ? (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setConfirmDialog({
                                          open: true,
                                          campaignId: campaign.id,
                                          campaignName: campaign.name,
                                          action: 'pause',
                                          schemaVersion: campaign.schema_version,
                                        })
                                      }
                                      className="gap-2"
                                    >
                                      <Pause className="h-4 w-4 text-amber-500" />
                                      Pausar
                                    </DropdownMenuItem>
                                  ) : campaign.status === 'paused' ? (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setConfirmDialog({
                                          open: true,
                                          campaignId: campaign.id,
                                          campaignName: campaign.name,
                                          action: 'resume',
                                          schemaVersion: campaign.schema_version,
                                        })
                                      }
                                      className="gap-2"
                                    >
                                      <Play className="h-4 w-4 text-emerald-500" />
                                      Retomar
                                    </DropdownMenuItem>
                                  ) : null}

                                  {/* Encerrar */}
                                  {campaign.status !== 'completed' && campaign.status !== 'archived' && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setConfirmDialog({
                                          open: true,
                                          campaignId: campaign.id,
                                          campaignName: campaign.name,
                                          action: 'complete',
                                          schemaVersion: campaign.schema_version,
                                        })
                                      }
                                      className="gap-2"
                                    >
                                      <XCircle className="h-4 w-4 text-sky-500" />
                                      Encerrar
                                    </DropdownMenuItem>
                                  )}

                                  {/* Arquivar (disponível para campanhas concluídas) */}
                                  {campaign.status === 'completed' && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setConfirmDialog({
                                          open: true,
                                          campaignId: campaign.id,
                                          campaignName: campaign.name,
                                          action: 'archive',
                                          schemaVersion: campaign.schema_version,
                                        })
                                      }
                                      className="gap-2"
                                    >
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      Arquivar
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuSeparator />

                                  {/* Excluir */}
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setConfirmDialog({
                                        open: true,
                                        campaignId: campaign.id,
                                        campaignName: campaign.name,
                                        action: 'delete',
                                        schemaVersion: campaign.schema_version,
                                      })
                                    }
                                    className="gap-2 text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Paginação */}
                <AdminPagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalItems}
                  pageSize={pagination.pageSize}
                  onPageChange={goToPage}
                  onPageSizeChange={setPageSize}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmação */}
      <AlertDialog
        open={confirmDialog?.open || false}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getConfirmText().title}</AlertDialogTitle>
            <AlertDialogDescription>
              {getConfirmText().description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={
                confirmDialog?.action === 'delete'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}