/**
 * MetricsStatsCards - Cards de estatísticas gerais do sistema
 * Exibe contagens de usuários, personagens, campanhas e sessões
 */
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  FileUser, 
  Swords, 
  Calendar,
  Shield
} from '@/components/icons/ordem-icons';
import type { SystemStats } from './AdminMetricsDashboard';

interface MetricsStatsCardsProps {
  stats?: SystemStats;
}

/**
 * Cards com estatísticas principais do sistema
 */
export function MetricsStatsCards({ stats }: MetricsStatsCardsProps) {
  const cards = [
    {
      title: 'Usuários',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      description: `${stats?.adminCount ?? 0} admin(s)`,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Personagens',
      value: stats?.totalCharacters ?? 0,
      icon: FileUser,
      description: 'Fichas criadas',
      color: 'text-sky-500',
      bgColor: 'bg-sky-500/10'
    },
    {
      title: 'Campanhas',
      value: stats?.totalCampaigns ?? 0,
      icon: Swords,
      description: 'V1 e V2 combinadas',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      title: 'Sessões',
      value: stats?.totalSessions ?? 0,
      icon: Calendar,
      description: 'Sessões registradas',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default MetricsStatsCards;
