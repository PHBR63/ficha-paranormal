/**
 * AdminMetricsDashboard - Dashboard de métricas administrativas
 * Exibe estatísticas gerais do sistema, gráficos de distribuição e atividade
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileUser, 
  Swords, 
  Calendar,
  RefreshCw,
  Loader2,
  TrendingUp,
  PieChart,
  Activity
} from '@/components/icons/ordem-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MetricsStatsCards } from './MetricsStatsCards';
import { ClassDistributionChart } from './ClassDistributionChart';
import { OriginDistributionChart } from './OriginDistributionChart';
import { ActivityChart } from './ActivityChart';
import { NexDistributionChart } from './NexDistributionChart';
import { AdminPageSkeleton } from '../AdminSkeletons';

// Interface para estatísticas gerais
export interface SystemStats {
  totalUsers: number;
  totalCharacters: number;
  totalCampaigns: number;
  totalSessions: number;
  adminCount: number;
}

// Interface para distribuição de classe
export interface ClassDistribution {
  class: string;
  count: number;
}

// Interface para distribuição de origem
export interface OriginDistribution {
  origin: string;
  count: number;
}

// Interface para atividade mensal
export interface MonthlyActivity {
  month: string;
  characters: number;
  campaigns: number;
}

// Interface para distribuição de NEX
export interface NexDistribution {
  nex: number;
  count: number;
}

/**
 * Hook para buscar estatísticas do sistema
 */
function useSystemStats() {
  return useQuery({
    queryKey: ['admin-system-stats'],
    queryFn: async (): Promise<SystemStats> => {
      // Buscar contagens em paralelo
      const [
        { count: totalUsers },
        { count: totalCharacters },
        { count: campaignsV1 },
        { count: campaignsV2 },
        { count: sessionsV1 },
        { count: sessionsV2 },
        { count: adminCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('characters').select('*', { count: 'exact', head: true }),
        supabase.from('campaigns').select('*', { count: 'exact', head: true }),
        supabase.from('campaigns_v2').select('*', { count: 'exact', head: true }),
        supabase.from('campaign_sessions').select('*', { count: 'exact', head: true }),
        supabase.from('campaign_sessions_v2').select('*', { count: 'exact', head: true }),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'admin')
      ]);

      return {
        totalUsers: totalUsers || 0,
        totalCharacters: totalCharacters || 0,
        totalCampaigns: (campaignsV1 || 0) + (campaignsV2 || 0),
        totalSessions: (sessionsV1 || 0) + (sessionsV2 || 0),
        adminCount: adminCount || 0
      };
    },
    staleTime: 1000 * 60 * 5 // 5 minutos de cache
  });
}

/**
 * Hook para buscar distribuição de classes
 */
function useClassDistribution() {
  return useQuery({
    queryKey: ['admin-class-distribution'],
    queryFn: async (): Promise<ClassDistribution[]> => {
      const { data, error } = await supabase
        .from('characters')
        .select('class');

      if (error) throw error;

      // Agrupar por classe
      const counts: Record<string, number> = {};
      data?.forEach((char) => {
        counts[char.class] = (counts[char.class] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([className, count]) => ({ class: className, count }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 1000 * 60 * 5
  });
}

/**
 * Hook para buscar distribuição de origens
 */
function useOriginDistribution() {
  return useQuery({
    queryKey: ['admin-origin-distribution'],
    queryFn: async (): Promise<OriginDistribution[]> => {
      const { data, error } = await supabase
        .from('characters')
        .select('origin');

      if (error) throw error;

      // Agrupar por origem
      const counts: Record<string, number> = {};
      data?.forEach((char) => {
        counts[char.origin] = (counts[char.origin] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([origin, count]) => ({ origin, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 origens
    },
    staleTime: 1000 * 60 * 5
  });
}

/**
 * Hook para buscar atividade mensal
 */
function useMonthlyActivity() {
  return useQuery({
    queryKey: ['admin-monthly-activity'],
    queryFn: async (): Promise<MonthlyActivity[]> => {
      // Buscar personagens dos últimos 12 meses
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 11);
      startDate.setDate(1);

      const { data: characters } = await supabase
        .from('characters')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      const { data: campaignsV1 } = await supabase
        .from('campaigns')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      const { data: campaignsV2 } = await supabase
        .from('campaigns_v2')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      // Gerar array dos últimos 12 meses
      const months: MonthlyActivity[] = [];
      for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.push({ month: monthKey, characters: 0, campaigns: 0 });
      }

      // Contar personagens por mês
      characters?.forEach((char) => {
        const date = new Date(char.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthEntry = months.find((m) => m.month === monthKey);
        if (monthEntry) monthEntry.characters++;
      });

      // Contar campanhas por mês (v1 + v2)
      [...(campaignsV1 || []), ...(campaignsV2 || [])].forEach((camp) => {
        const date = new Date(camp.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthEntry = months.find((m) => m.month === monthKey);
        if (monthEntry) monthEntry.campaigns++;
      });

      return months;
    },
    staleTime: 1000 * 60 * 5
  });
}

/**
 * Hook para buscar distribuição de NEX
 */
function useNexDistribution() {
  return useQuery({
    queryKey: ['admin-nex-distribution'],
    queryFn: async (): Promise<NexDistribution[]> => {
      const { data, error } = await supabase
        .from('characters')
        .select('nex');

      if (error) throw error;

      // Agrupar por faixa de NEX
      const ranges = [
        { min: 0, max: 10, label: '0-10%' },
        { min: 15, max: 25, label: '15-25%' },
        { min: 30, max: 45, label: '30-45%' },
        { min: 50, max: 65, label: '50-65%' },
        { min: 70, max: 85, label: '70-85%' },
        { min: 90, max: 99, label: '90-99%' }
      ];

      const distribution = ranges.map((range) => ({
        nex: range.min,
        label: range.label,
        count: data?.filter((c) => c.nex >= range.min && c.nex <= range.max).length || 0
      }));

      return distribution;
    },
    staleTime: 1000 * 60 * 5
  });
}

/**
 * Dashboard principal de métricas
 */
export function AdminMetricsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const statsQuery = useSystemStats();
  const classQuery = useClassDistribution();
  const originQuery = useOriginDistribution();
  const activityQuery = useMonthlyActivity();
  const nexQuery = useNexDistribution();

  // Refetch de todos os dados
  const handleRefresh = () => {
    statsQuery.refetch();
    classQuery.refetch();
    originQuery.refetch();
    activityQuery.refetch();
    nexQuery.refetch();
  };

  const isLoading = statsQuery.isLoading || classQuery.isLoading;

  if (isLoading) {
    return <AdminPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display tracking-wider">Métricas do Sistema</h2>
          <p className="text-sm text-muted-foreground">
            Estatísticas e análises de uso da plataforma
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={statsQuery.isFetching}
        >
          {statsQuery.isFetching ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Atualizar
        </Button>
      </div>

      {/* Cards de estatísticas */}
      <MetricsStatsCards stats={statsQuery.data} />

      {/* Tabs de gráficos */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            <span className="hidden sm:inline">Distribuição</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Atividade</span>
          </TabsTrigger>
          <TabsTrigger value="progression" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Progressão</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba de distribuição */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ClassDistributionChart data={classQuery.data || []} />
            <OriginDistributionChart data={originQuery.data || []} />
          </div>
        </TabsContent>

        {/* Aba de atividade */}
        <TabsContent value="activity" className="space-y-6">
          <ActivityChart data={activityQuery.data || []} />
        </TabsContent>

        {/* Aba de progressão */}
        <TabsContent value="progression" className="space-y-6">
          <NexDistributionChart data={nexQuery.data || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminMetricsDashboard;
