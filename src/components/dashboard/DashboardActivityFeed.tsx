/**
 * DashboardActivityFeed - Feed de atividade recente estilo log de operações
 */
import { ClockCountdown, IdentificationBadge, UsersThree, CalendarCheck } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import type { RecentActivity } from '@/hooks/useDashboardData';

interface DashboardActivityFeedProps {
  activities: RecentActivity[];
}

// Formata a data relativa (ex: "há 2 horas")
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `há ${diffMins}min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays < 7) return `há ${diffDays}d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// Ícone baseado no tipo de atividade
function getActivityIcon(type: RecentActivity['type']) {
  switch (type) {
    case 'character_created':
    case 'character_updated':
      return IdentificationBadge;
    case 'campaign_joined':
      return UsersThree;
    case 'session_scheduled':
      return CalendarCheck;
    default:
      return ClockCountdown;
  }
}

export function DashboardActivityFeed({ activities }: DashboardActivityFeedProps) {
  if (activities.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Atividade Recente
        </h3>
        <div className="flex-1 h-px bg-primary/10" />
      </div>

      <div className="space-y-1">
        {activities.map((activity, i) => {
          const Icon = getActivityIcon(activity.type);
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-primary/5 transition-colors group"
            >
              {/* Linha temporal */}
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:border-primary/40 transition-colors">
                  <Icon className="w-3.5 h-3.5 text-primary/70" weight="duotone" />
                </div>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate font-medium">{activity.title}</p>
                <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
              </div>

              {/* Timestamp */}
              <span className="text-[10px] font-mono text-muted-foreground/60 whitespace-nowrap">
                {formatRelativeTime(activity.timestamp)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
