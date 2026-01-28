/**
 * MemberBonusesPanel - Painel para o mestre visualizar os bônus ativos dos jogadores
 * 
 * Mostra em tempo real os modificadores de cada personagem na campanha
 * OTIMIZAÇÃO: Usa React Query com staleTime para reduzir requisições
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Swords,
  Activity,
  Heart,
  Sparkles,
  RefreshCw,
  User,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { CampaignMemberBonuses } from '@/hooks/useBonusSync';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MemberBonusesPanelProps {
  campaignId: string;
  className?: string;
}

interface MemberWithBonuses {
  id: string;
  user_id: string;
  character_id: string | null;
  role: string;
  active_bonuses: any;
  bonuses_updated_at: string | null;
  character?: {
    name: string;
    class: string;
    nex: number;
    photo_url: string | null;
  };
  profile?: {
    display_name: string | null;
  };
}

// Componente de card do membro
function MemberBonusCard({ member }: { member: MemberWithBonuses }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const bonuses = member.active_bonuses;
  
  // Verifica se tem bônus ativos
  const hasBonuses = bonuses && (
    bonuses.defense > 0 ||
    bonuses.resistances?.fortitude > 0 ||
    bonuses.resistances?.reflexos > 0 ||
    bonuses.resistances?.vontade > 0 ||
    bonuses.combat?.attack > 0 ||
    bonuses.combat?.initiative > 0 ||
    bonuses.damageReduction?.physical > 0 ||
    bonuses.damageReduction?.paranormal > 0 ||
    bonuses.stats?.hp > 0 ||
    bonuses.stats?.pe > 0 ||
    Object.keys(bonuses.skills || {}).length > 0
  );

  const totalBonusCount = bonuses?.activeSources?.length || 0;

  return (
    <motion.div
      layout
      className={cn(
        "bg-card/60 border border-border/50 rounded-lg overflow-hidden",
        hasBonuses && "border-primary/30"
      )}
    >
      {/* Header do membro */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-muted/50 overflow-hidden flex-shrink-0">
          {member.character?.photo_url ? (
            <img 
              src={member.character.photo_url} 
              alt={member.character.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-left min-w-0">
          <p className="font-medium text-sm truncate">
            {member.character?.name || member.profile?.display_name || 'Sem personagem'}
          </p>
          {member.character && (
            <p className="text-xs text-muted-foreground">
              {member.character.class} • NEX {member.character.nex}%
            </p>
          )}
        </div>

        {/* Indicador de bônus */}
        {hasBonuses && (
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 rounded-full"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-primary">{totalBonusCount}</span>
            </motion.div>
          </div>
        )}

        {/* Expand icon */}
        {hasBonuses && (
          isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )
        )}
      </button>

      {/* Conteúdo expandido */}
      <AnimatePresence>
        {isExpanded && hasBonuses && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-border/30 pt-2">
              {/* Defesa */}
              {bonuses.defense > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-500" />
                    <span>Defesa</span>
                  </div>
                  <span className="font-mono text-green-500">+{bonuses.defense}</span>
                </div>
              )}

              {/* Resistências */}
              {(bonuses.resistances?.fortitude > 0 || bonuses.resistances?.reflexos > 0 || bonuses.resistances?.vontade > 0) && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Activity className="w-3.5 h-3.5 text-purple-500" />
                    <span>Resistências</span>
                  </div>
                  <div className="flex gap-2 pl-5 text-xs">
                    {bonuses.resistances?.fortitude > 0 && (
                      <span>Fort <span className="text-green-500">+{bonuses.resistances.fortitude}</span></span>
                    )}
                    {bonuses.resistances?.reflexos > 0 && (
                      <span>Ref <span className="text-green-500">+{bonuses.resistances.reflexos}</span></span>
                    )}
                    {bonuses.resistances?.vontade > 0 && (
                      <span>Von <span className="text-green-500">+{bonuses.resistances.vontade}</span></span>
                    )}
                  </div>
                </div>
              )}

              {/* Combate */}
              {(bonuses.combat?.attack > 0 || bonuses.combat?.initiative > 0 || bonuses.combat?.criticalMargin > 0) && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Swords className="w-3.5 h-3.5 text-red-500" />
                    <span>Combate</span>
                  </div>
                  <div className="flex gap-2 pl-5 text-xs flex-wrap">
                    {bonuses.combat?.attack > 0 && (
                      <span>Ataque <span className="text-green-500">+{bonuses.combat.attack}</span></span>
                    )}
                    {bonuses.combat?.initiative > 0 && (
                      <span>Ini <span className="text-green-500">+{bonuses.combat.initiative}</span></span>
                    )}
                    {bonuses.combat?.criticalMargin > 0 && (
                      <span>Crit <span className="text-green-500">+{bonuses.combat.criticalMargin}</span></span>
                    )}
                  </div>
                </div>
              )}

              {/* RD */}
              {(bonuses.damageReduction?.physical > 0 || bonuses.damageReduction?.paranormal > 0) && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Redução de Dano</span>
                  </div>
                  <span className="font-mono">
                    {bonuses.damageReduction?.physical > 0 && (
                      <span className="text-green-500">{bonuses.damageReduction.physical}</span>
                    )}
                    {bonuses.damageReduction?.physical > 0 && bonuses.damageReduction?.paranormal > 0 && '/'}
                    {bonuses.damageReduction?.paranormal > 0 && (
                      <span className="text-purple-500">{bonuses.damageReduction.paranormal}p</span>
                    )}
                  </span>
                </div>
              )}

              {/* Stats */}
              {(bonuses.stats?.hp > 0 || bonuses.stats?.pe > 0) && (
                <div className="flex gap-3 text-xs">
                  {bonuses.stats?.hp > 0 && (
                    <span>PV <span className="text-green-500">+{bonuses.stats.hp}</span></span>
                  )}
                  {bonuses.stats?.pe > 0 && (
                    <span>PE <span className="text-green-500">+{bonuses.stats.pe}</span></span>
                  )}
                </div>
              )}

              {/* Perícias */}
              {Object.keys(bonuses.skills || {}).length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase">Perícias</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(bonuses.skills).map(([skill, bonus]) => (
                      <span key={skill} className="text-xs px-1.5 py-0.5 bg-muted/30 rounded">
                        {skill} <span className="text-green-500">+{bonus as number}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fontes */}
              {bonuses.activeSources?.length > 0 && (
                <div className="pt-1 border-t border-border/30">
                  <p className="text-[10px] text-muted-foreground mb-1">Fontes:</p>
                  <div className="flex flex-wrap gap-1">
                    {bonuses.activeSources.slice(0, 6).map((source: string, i: number) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                        {source}
                      </span>
                    ))}
                    {bonuses.activeSources.length > 6 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{bonuses.activeSources.length - 6}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Última atualização */}
              {member.bonuses_updated_at && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    Atualizado {formatDistanceToNow(new Date(member.bonuses_updated_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function MemberBonusesPanel({ campaignId, className }: MemberBonusesPanelProps) {
  const [refreshing, setRefreshing] = useState(false);

  /**
   * OTIMIZAÇÃO: Query em lote para evitar erro 400 (join inválido)
   * A FK user_id aponta para auth.users, não public.profiles
   * Então buscamos profiles separadamente e mesclamos com Map
   */
  const { data: members = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['campaign-members-bonuses', campaignId],
    queryFn: async () => {
      // 1. Busca membros com join apenas em characters (FK válida)
      const { data: membersRaw, error: membersError } = await supabase
        .from('campaign_members')
        .select(`
          id,
          user_id,
          character_id,
          role,
          active_bonuses,
          bonuses_updated_at,
          characters (
            name,
            class,
            nex,
            photo_url
          )
        `)
        .eq('campaign_id', campaignId)
        .neq('role', 'master');

      if (membersError) throw membersError;
      if (!membersRaw || membersRaw.length === 0) return [];

      // 2. Busca profiles em lote usando IN (sem FK direta)
      const userIds = membersRaw.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      // 3. Cria lookup object para O(1) e mescla
      const profileLookup: Record<string, { user_id: string; display_name: string | null }> = {};
      (profiles || []).forEach(p => { profileLookup[p.user_id] = p; });
      
      return membersRaw.map(m => ({
        ...m,
        character: m.characters as any,
        profile: profileLookup[m.user_id] || { display_name: null },
      }));
    },
    staleTime: 3 * 60 * 1000,  // 3 minutos
    gcTime: 5 * 60 * 1000,     // 5 minutos em cache
  });

  // Escuta atualizações em tempo real (invalidation)
  useEffect(() => {
    const channel = supabase
      .channel(`campaign-bonuses-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaign_members',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          // Invalida cache para refetch automático
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, refetch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Conta membros com bônus ativos
  const membersWithBonuses = members.filter(m => {
    const bonuses = m.active_bonuses as any;
    return bonuses?.activeSources?.length > 0;
  });

  if (loading) {
    return (
      <div className={cn("animate-pulse space-y-2", className)}>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted/30 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-sm">Bônus dos Jogadores</h3>
          {membersWithBonuses.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded-full">
              {membersWithBonuses.length} ativo(s)
            </span>
          )}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handleRefresh}
                className="p-1.5 hover:bg-muted/50 rounded transition-colors"
                disabled={refreshing}
              >
                <RefreshCw className={cn(
                  "w-4 h-4 text-muted-foreground",
                  refreshing && "animate-spin"
                )} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Atualizar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Lista de membros */}
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum jogador na campanha
        </p>
      ) : (
        <div className="space-y-2">
          {members.map(member => (
            <MemberBonusCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
