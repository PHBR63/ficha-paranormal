/**
 * ValidationHistoryDashboard - Dashboard visual do histórico de validações
 * Exibe gráficos e estatísticas das validações ao longo do tempo
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Calendar,
  Target,
  Award,
  Trash2,
  BarChart3,
  Clock,
} from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';
import { useValidationHistory, type ValidationHistoryEntry } from '@/hooks';

// Cores para os gráficos
const COLORS = {
  primary: 'hsl(var(--primary))',
  success: '#10b981',
  destructive: '#ef4444',
  warning: '#f59e0b',
  muted: 'hsl(var(--muted-foreground))',
};

const PIE_COLORS = ['#10b981', '#ef4444'];

interface ValidationHistoryDashboardProps {
  onRunValidation?: () => void;
}

export function ValidationHistoryDashboard({ onRunValidation }: ValidationHistoryDashboardProps) {
  const { history, stats, clearHistory, isLoading } = useValidationHistory();

  // Dados formatados para gráficos
  const chartData = useMemo(() => {
    return [...history]
      .reverse()
      .map((entry, index) => ({
        index: index + 1,
        date: new Date(entry.timestamp).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        fullDate: new Date(entry.timestamp).toLocaleString('pt-BR'),
        successRate: entry.successRate,
        passed: entry.passed,
        failed: entry.failed,
        total: entry.totalTests,
      }));
  }, [history]);

  // Últimas 10 execuções para gráfico de barras
  const recentData = chartData.slice(-10);

  // Distribuição por categoria (última execução)
  const categoryData = useMemo(() => {
    if (!stats.lastRun) return [];
    
    return Object.entries(stats.lastRun.categorySummary)
      .map(([name, data]) => ({
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        fullName: name,
        passed: data.passed,
        failed: data.failed,
        total: data.total,
        rate: Math.round((data.passed / data.total) * 100),
      }))
      .sort((a, b) => a.rate - b.rate);
  }, [stats.lastRun]);

  // Ícone de tendência
  const TrendIcon = stats.trend === 'up' ? TrendingUp : 
                    stats.trend === 'down' ? TrendingDown : Minus;
  const trendColor = stats.trend === 'up' ? 'text-green-500' : 
                     stats.trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="ordo-panel">
        <CardContent className="py-12 text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold mb-2">Nenhum histórico disponível</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Execute validações para começar a construir o histórico.
          </p>
          {onRunValidation && (
            <Button onClick={onRunValidation}>
              Executar Primeira Validação
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalRuns}</p>
                  <p className="text-xs text-muted-foreground">Execuções</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Target className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.averageSuccessRate}%</p>
                  <p className="text-xs text-muted-foreground">Média Sucesso</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Award className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.bestRun?.successRate || 0}%</p>
                  <p className="text-xs text-muted-foreground">Melhor Taxa</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", 
                  stats.trend === 'up' ? 'bg-green-500/10' : 
                  stats.trend === 'down' ? 'bg-destructive/10' : 'bg-muted/50'
                )}>
                  <TrendIcon className={cn("w-5 h-5", trendColor)} />
                </div>
                <div>
                  <p className="text-2xl font-bold capitalize">
                    {stats.trend === 'up' ? '↑' : stats.trend === 'down' ? '↓' : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Tendência</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Gráfico principal - Evolução da taxa de sucesso */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="ordo-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Evolução da Taxa de Sucesso
            </CardTitle>
            <CardDescription className="text-xs">
              Histórico das últimas {chartData.length} execuções
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `${value}%`}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Taxa de Sucesso']}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                  />
                  <Area
                    type="monotone"
                    dataKey="successRate"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    fill="url(#successGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grid de gráficos secundários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de barras - Testes passados/falhados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="ordo-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Testes por Execução
              </CardTitle>
              <CardDescription className="text-xs">
                Últimas 10 execuções
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recentData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="passed" name="Aprovados" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="failed" name="Reprovados" fill={COLORS.destructive} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Última execução - Distribuição */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="ordo-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Última Execução
              </CardTitle>
              <CardDescription className="text-xs">
                {stats.lastRun && new Date(stats.lastRun.timestamp).toLocaleString('pt-BR')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-32 w-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Aprovados', value: stats.lastRun?.passed || 0 },
                          { name: 'Reprovados', value: stats.lastRun?.failed || 0 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {PIE_COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <Badge variant="secondary">{stats.lastRun?.totalTests || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-500">Aprovados</span>
                    <Badge className="bg-green-500">{stats.lastRun?.passed || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-destructive">Reprovados</span>
                    <Badge variant="destructive">{stats.lastRun?.failed || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Taxa</span>
                    <span className={cn(
                      "text-lg font-bold",
                      (stats.lastRun?.successRate || 0) === 100 ? "text-green-500" :
                      (stats.lastRun?.successRate || 0) >= 90 ? "text-yellow-500" : "text-destructive"
                    )}>
                      {stats.lastRun?.successRate || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Taxa por categoria (última execução) */}
      {categoryData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="ordo-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Taxa por Categoria (Última Execução)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2 pr-4">
                  {categoryData.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate max-w-[200px]" title={cat.fullName}>
                          {cat.name}
                        </span>
                        <span className={cn(
                          "font-medium",
                          cat.rate === 100 ? "text-green-500" :
                          cat.rate >= 90 ? "text-yellow-500" : "text-destructive"
                        )}>
                          {cat.passed}/{cat.total} ({cat.rate}%)
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            cat.rate === 100 ? "bg-green-500" :
                            cat.rate >= 90 ? "bg-yellow-500" : "bg-destructive"
                          )}
                          style={{ width: `${cat.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Ações */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={clearHistory}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Limpar Histórico
        </Button>
      </div>
    </div>
  );
}
