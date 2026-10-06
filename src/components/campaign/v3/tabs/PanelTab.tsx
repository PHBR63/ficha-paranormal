/**
 * PanelTab - Dossiê Tático dos Agentes
 * 
 * Dashboard completo dos personagens da campanha com:
 * - Resumo geral (total de agentes, online, críticos)
 * - Cards expandidos com foto, origem, patente, trilha
 * - Barras de PV/SAN/PE detalhadas
 * - Lista completa de condições ativas
 * - Info da sessão ativa
 * 
 * @module components/campaign/v3/tabs/PanelTab
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, Brain, Zap, AlertTriangle, Shield, Users, Wifi, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import type { CampaignSession } from '@/hooks/campaign/useCampaignRealtime';
import type { UserPresence } from '@/hooks/campaign/useCampaignPresence';
import type { CampaignCombatController } from '@/hooks/campaign/useCampaignCombat';
import { CampaignScenePanel } from '../CampaignScenePanel';

// =====================================================
// TIPOS
// =====================================================

interface PanelTabProps {
  campaignId?: string;
  combat?: CampaignCombatController;
  /** Membros da campanha */
  members: CampaignMemberV2[];
  /** Sessão ativa (se houver) */
  activeSession?: CampaignSession | null;
  /** Mapa de presença */
  presenceMap: Record<string, UserPresence>;
  /** Classe CSS adicional */
  className?: string;
}

// =====================================================
// ANIMAÇÕES
// =====================================================

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.35,
      ease: 'easeOut' as const,
    },
  }),
};

// =====================================================
// SUB-COMPONENTES
// =====================================================

/** Resumo geral no topo — agentes, online, críticos */
const PanelSummary = memo(function PanelSummary({
  totalAgents,
  onlineCount,
  criticalCount,
}: {
  totalAgents: number;
  onlineCount: number;
  criticalCount: number;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Total de agentes */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        <span>{totalAgents} {totalAgents === 1 ? 'agente' : 'agentes'}</span>
      </div>
      <Separator orientation="vertical" className="h-3" />
      {/* Online */}
      <div className="flex items-center gap-1.5 text-xs">
        <Wifi className="h-3.5 w-3.5 text-green-500" />
        <span className="text-green-500 font-medium">{onlineCount} online</span>
      </div>
      {/* Críticos */}
      {criticalCount > 0 && (
        <>
          <Separator orientation="vertical" className="h-3" />
          <div className="flex items-center gap-1.5 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-destructive font-medium">
              {criticalCount} em estado crítico
            </span>
          </div>
        </>
      )}
    </div>
  );
});

/** Card de sessão ativa */
const SessionCard = memo(function SessionCard({
  session,
}: {
  session: CampaignSession;
}) {
  // Calcula duração se sessão estiver em andamento
  const duration = useMemo(() => {
    if (!session.started_at) return null;
    const start = new Date(session.started_at).getTime();
    const now = Date.now();
    const diffMs = now - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  }, [session.started_at]);

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-2 w-2 bg-primary rounded-full animate-pulse shrink-0" />
            <span className="text-sm font-medium truncate">
              {session.title || `Sessão ${session.session_number}`}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {duration && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{duration}</span>
              </div>
            )}
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              Em andamento
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

/** Barra de status (PV, SAN ou PE) */
const StatBar = memo(function StatBar({
  icon,
  label,
  current,
  max,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  max: number;
  colorClass: string;
}) {
  const percent = max > 0 ? (current / max) * 100 : 0;
  const isCritical = percent <= 25;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className={cn('font-medium tabular-nums', isCritical && 'text-destructive')}>
          {current}/{max}
        </span>
      </div>
      <Progress
        value={percent}
        className={cn('h-1.5', colorClass)}
      />
    </div>
  );
});

/** Card de dossiê do agente — versão expandida */
const AgentDossierCard = memo(function AgentDossierCard({
  member,
  presence,
  index,
}: {
  member: CampaignMemberV2;
  presence?: UserPresence;
  index: number;
}) {
  const character = member.characters;
  const profile = member.profiles;

  if (!character) return null;

  const displayName = character.name || profile?.display_name || 'Sem nome';
  const avatarUrl = character.photo_url || profile?.avatar_url;
  const initials = displayName.substring(0, 2).toUpperCase();

  // Status de presença
  const status = presence?.status || 'offline';
  const statusColor = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-muted-foreground/40',
  }[status];
  const statusLabel = {
    online: 'Online',
    away: 'Ausente',
    offline: 'Offline',
  }[status];

  // Cálculos de criticidade
  const hpPercent = character.hp_max > 0 ? (character.hp_current / character.hp_max) * 100 : 0;
  const sanPercent = character.san_max > 0 ? (character.san_current / character.san_max) * 100 : 0;
  const isCritical = hpPercent <= 25 || sanPercent <= 25;

  // Condições do personagem
  const conditions = Array.isArray(character.conditions) ? character.conditions as string[] : [];

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <Card className={cn(
        'relative overflow-hidden transition-colors',
        isCritical && 'border-destructive/40 bg-destructive/5',
        status === 'offline' && 'opacity-60'
      )}>
        {/* Barra de presença no topo */}
        <div className={cn('absolute top-0 left-0 right-0 h-0.5', statusColor)} />

        {/* Header — foto maior + identidade */}
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-start gap-3">
            {/* Foto do personagem (maior) */}
            <div className="relative shrink-0">
              <Avatar className="h-14 w-14 border-2 border-border">
                <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                <AvatarFallback className="text-base bg-muted">{initials}</AvatarFallback>
              </Avatar>
              {/* Indicador de presença */}
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
                  statusColor
                )}
              />
            </div>

            {/* Identidade do agente */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold truncate">{displayName}</h3>
                {isCritical && (
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                )}
              </div>

              {/* Classe e Trilha */}
              <p className="text-xs text-muted-foreground">
                {character.class}
                {character.class_track && ` — ${character.class_track}`}
              </p>

              {/* Origem e Patente */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/60">
                  {character.origin}
                </Badge>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {character.patent}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                  NEX {character.nex}%
                </Badge>
              </div>
            </div>

            {/* Status de presença */}
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] capitalize shrink-0',
                status === 'online' && 'border-green-500/50 text-green-500',
                status === 'away' && 'border-yellow-500/50 text-yellow-500',
                status === 'offline' && 'border-muted-foreground/50 text-muted-foreground'
              )}
            >
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-3">
          {/* Barras de status */}
          <div className="space-y-2">
            <StatBar
              icon={<Heart className="h-3 w-3 text-red-500" />}
              label="PV"
              current={character.hp_current}
              max={character.hp_max}
              colorClass=""
            />
            <StatBar
              icon={<Brain className="h-3 w-3 text-purple-500" />}
              label="SAN"
              current={character.san_current}
              max={character.san_max}
              colorClass="[&>div]:bg-purple-500"
            />
            <StatBar
              icon={<Zap className="h-3 w-3 text-blue-500" />}
              label="PE"
              current={character.pe_current}
              max={character.pe_max}
              colorClass="[&>div]:bg-blue-500"
            />
          </div>

          {/* Defesa e Deslocamento */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Defesa {character.defense}</span>
            </div>
            <Separator orientation="vertical" className="h-3" />
            <span>Deslocamento {character.movement}m</span>
          </div>

          {/* Condições ativas — lista completa */}
          {conditions.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Condições Ativas
              </span>
              <div className="flex flex-wrap gap-1">
                {conditions.map((condition, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border-yellow-500/40 text-yellow-600 dark:text-yellow-400"
                  >
                    {typeof condition === 'string' ? condition : String(condition)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export const PanelTab = memo(function PanelTab({
  campaignId,
  members,
  activeSession,
  presenceMap,
  combat,
  className,
}: PanelTabProps) {
  // Filtra membros com personagem
  const membersWithCharacter = members.filter(m => m.characters);

  // Ordena por presença (online primeiro)
  const sortedMembers = useMemo(() => {
    return [...membersWithCharacter].sort((a, b) => {
      const statusA = presenceMap[a.user_id]?.status || 'offline';
      const statusB = presenceMap[b.user_id]?.status || 'offline';
      const order = { online: 0, away: 1, offline: 2 };
      return order[statusA] - order[statusB];
    });
  }, [membersWithCharacter, presenceMap]);

  // Contagens para resumo
  const onlineCount = sortedMembers.filter(
    m => presenceMap[m.user_id]?.status === 'online'
  ).length;
  const criticalCount = sortedMembers.filter(m => {
    const c = m.characters;
    if (!c) return false;
    const hpP = c.hp_max > 0 ? (c.hp_current / c.hp_max) * 100 : 100;
    const sanP = c.san_max > 0 ? (c.san_current / c.san_max) * 100 : 100;
    return hpP <= 25 || sanP <= 25;
  }).length;

  return (
    <ScrollArea className={cn('h-full', className)}>
      {combat && (
        <Card className="m-4 border-primary/30">
          <CardContent className="p-4 space-y-2">
            {campaignId && <CampaignScenePanel key={campaignId} campaignId={campaignId} combat={combat} />}
            <h2 className="text-sm font-semibold">Combate da campanha</h2>
            {combat.error ? <p role="alert">{combat.error}</p> : combat.loading ? <p role="status">Carregando combate...</p> : combat.state.active ? (
              <>
                <p role="status">Rodada {combat.state.round} · {combat.state.combatants.length ? `Turno de ${combat.state.combatants[combat.state.currentTurnIndex]?.name}` : 'Aguardando participantes'}</p>
                <ol className="text-sm space-y-1">{combat.state.combatants.map((entry, index) => (
                  <li key={entry.id} className={index === combat.state.currentTurnIndex ? 'font-semibold text-primary' : ''}>{entry.name} · Iniciativa {entry.initiative}</li>
                ))}</ol>
              </>
            ) : <p>Nenhum combate em andamento.</p>}
          </CardContent>
        </Card>
      )}
      <div className="p-4 space-y-4">
        {/* Título + Resumo */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Dossiê de Campo
          </h2>
          <PanelSummary
            totalAgents={sortedMembers.length}
            onlineCount={onlineCount}
            criticalCount={criticalCount}
          />
        </div>

        {/* Sessão ativa */}
        {activeSession && <SessionCard session={activeSession} />}

        {/* Grid de dossiês */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {sortedMembers.map((member, index) => (
            <AgentDossierCard
              key={member.id}
              member={member}
              presence={presenceMap[member.user_id]}
              index={index}
            />
          ))}
        </div>

        {/* Estado vazio */}
        {sortedMembers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Nenhum personagem na campanha ainda.</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
});

export default PanelTab;
