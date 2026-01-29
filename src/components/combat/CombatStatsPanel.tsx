/**
 * Painel de Estatísticas de Combate
 * Exibe total de dano bloqueado, hooks disparados e eficiência dos rituais
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
// ScrollArea removido - usando overflow nativo para evitar bug #185 com React 19
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Zap, 
  Target, 
  TrendingUp, 
  BarChart3, 
  RefreshCw,
  Flame,
  Skull,
  Heart,
  Activity
} from 'lucide-react';
import { getCombatStats, resetCombatStats, CombatStats } from '@/lib/ritual-hooks-engine';

interface CombatStatsPanelProps {
  refreshKey?: number;
}

export function CombatStatsPanel({ refreshKey }: CombatStatsPanelProps) {
  const [stats, setStats] = useState<CombatStats>(getCombatStats());

  useEffect(() => {
    setStats(getCombatStats());
  }, [refreshKey]);

  const handleReset = () => {
    resetCombatStats();
    setStats(getCombatStats());
  };

  const efficiencyRate = stats.totalDamageReceived > 0 
    ? Math.round((stats.totalDamageBlocked / (stats.totalDamageReceived + stats.totalDamageBlocked)) * 100)
    : 0;

  const hookSuccessRate = stats.totalHooksTriggered > 0
    ? Math.round((stats.totalHooksApplied / stats.totalHooksTriggered) * 100)
    : 0;

  // Calcula ritual mais eficiente
  const topRitual = Object.entries(stats.ritualStats)
    .sort((a, b) => b[1].damageBlocked - a[1].damageBlocked)[0];

  // Calcula trigger mais comum
  const topTrigger = Object.entries(stats.triggerCounts)
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Estatísticas de Combate
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Resumo Principal */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Shield className="h-4 w-4 text-blue-400" />}
            label="Dano Bloqueado"
            value={stats.totalDamageBlocked}
            subtext={`de ${stats.totalDamageBlocked + stats.totalDamageReceived} total`}
            color="blue"
          />
          <StatCard
            icon={<Zap className="h-4 w-4 text-yellow-400" />}
            label="Hooks Disparados"
            value={stats.totalHooksTriggered}
            subtext={`${stats.totalHooksApplied} aplicados`}
            color="yellow"
          />
          <StatCard
            icon={<Skull className="h-4 w-4 text-red-400" />}
            label="Dano Recebido"
            value={stats.totalDamageReceived}
            subtext="após proteções"
            color="red"
          />
          <StatCard
            icon={<Activity className="h-4 w-4 text-green-400" />}
            label="Eventos de Dano"
            value={stats.damageEvents}
            subtext={`${stats.blockedEvents} bloqueados`}
            color="green"
          />
        </div>

        <Separator className="bg-border/50" />

        {/* Barras de Eficiência */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Eficiência de Proteção</span>
              <span className="font-mono text-primary">{efficiencyRate}%</span>
            </div>
            <Progress value={efficiencyRate} className="h-2" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Taxa de Sucesso dos Hooks</span>
              <span className="font-mono text-primary">{hookSuccessRate}%</span>
            </div>
            <Progress value={hookSuccessRate} className="h-2" />
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Estatísticas por Ritual */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Target className="h-4 w-4" />
            Eficiência por Ritual
          </h4>
          
          <div className="h-32 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            <div className="space-y-2">
              {Object.entries(stats.ritualStats).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Nenhum ritual ativado ainda
                </p>
              ) : (
                Object.entries(stats.ritualStats)
                  .sort((a, b) => b[1].damageBlocked - a[1].damageBlocked)
                  .map(([ritualName, ritualStat]) => (
                    <RitualStatRow 
                      key={ritualName} 
                      name={ritualName} 
                      stats={ritualStat}
                      isTop={topRitual?.[0] === ritualName}
                    />
                  ))
              )}
            </div>
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Contagem por Trigger */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Triggers Mais Frequentes
          </h4>
          
          <div className="flex flex-wrap gap-1">
            {Object.entries(stats.triggerCounts).length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum trigger registrado</p>
            ) : (
              Object.entries(stats.triggerCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([trigger, count]) => (
                  <Badge 
                    key={trigger}
                    variant={topTrigger?.[0] === trigger ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {formatTriggerName(trigger)}: {count}
                  </Badge>
                ))
            )}
          </div>
        </div>

        {/* Destaque do Melhor Ritual */}
        {topRitual && topRitual[1].damageBlocked > 0 && (
          <>
            <Separator className="bg-border/50" />
            <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Ritual Mais Eficiente</span>
              </div>
              <div className="text-lg font-bold text-primary">{topRitual[0]}</div>
              <div className="text-xs text-muted-foreground">
                Bloqueou {topRitual[1].damageBlocked} de dano em {topRitual[1].timesTriggered} ativações
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtext: string;
  color: 'blue' | 'yellow' | 'red' | 'green';
}

function StatCard({ icon, label, value, subtext, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/20',
    yellow: 'bg-yellow-500/10 border-yellow-500/20',
    red: 'bg-red-500/10 border-red-500/20',
    green: 'bg-green-500/10 border-green-500/20',
  };

  return (
    <div className={`rounded-lg p-3 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{subtext}</div>
    </div>
  );
}

interface RitualStatRowProps {
  name: string;
  stats: {
    timesTriggered: number;
    timesApplied: number;
    damageBlocked: number;
  };
  isTop: boolean;
}

function RitualStatRow({ name, stats, isTop }: RitualStatRowProps) {
  const successRate = stats.timesTriggered > 0 
    ? Math.round((stats.timesApplied / stats.timesTriggered) * 100) 
    : 0;

  return (
    <div className={`flex items-center justify-between p-2 rounded ${isTop ? 'bg-primary/10' : 'bg-muted/30'}`}>
      <div className="flex items-center gap-2">
        {isTop && <TrendingUp className="h-3 w-3 text-primary" />}
        <span className="text-sm font-medium">{name}</span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-blue-400">
          <Shield className="h-3 w-3 inline mr-1" />
          {stats.damageBlocked}
        </span>
        <span className="text-yellow-400">
          <Zap className="h-3 w-3 inline mr-1" />
          {stats.timesTriggered}
        </span>
        <Badge variant="outline" className="text-xs">
          {successRate}%
        </Badge>
      </div>
    </div>
  );
}

function formatTriggerName(trigger: string): string {
  const names: Record<string, string> = {
    'onPreDamage': 'Pré-Dano',
    'onPostDamage': 'Pós-Dano',
    'onTurnStart': 'Início Turno',
    'onTurnEnd': 'Fim Turno',
    'onRollBefore': 'Pré-Rolagem',
    'onRollAfter': 'Pós-Rolagem',
    'onFallDamage': 'Queda',
    'onProjectileHit': 'Projétil',
    'onCritical': 'Crítico',
    'onSanityLoss': 'Perda SAN',
  };
  return names[trigger] || trigger;
}

export default CombatStatsPanel;
