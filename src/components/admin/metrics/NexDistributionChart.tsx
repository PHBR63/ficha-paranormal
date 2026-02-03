/**
 * NexDistributionChart - Gráfico de distribuição de NEX
 * Exibe barras com faixas de progressão dos personagens
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, CartesianGrid } from 'recharts';
import type { NexDistribution } from './AdminMetricsDashboard';

// Labels para faixas de NEX
const NEX_LABELS: Record<number, string> = {
  0: '0-10%',
  15: '15-25%',
  30: '30-45%',
  50: '50-65%',
  70: '70-85%',
  90: '90-99%'
};

// Cores gradientes para as barras (do verde ao vermelho)
const NEX_COLORS = [
  'hsl(120, 60%, 45%)', // Verde claro - iniciante
  'hsl(90, 60%, 45%)',  // Verde-amarelo
  'hsl(60, 70%, 45%)',  // Amarelo
  'hsl(35, 85%, 50%)',  // Laranja
  'hsl(15, 90%, 50%)',  // Laranja-vermelho
  'hsl(0, 85%, 50%)'    // Vermelho - veterano
];

interface NexDistributionChartProps {
  data: NexDistribution[];
}

/**
 * Tooltip customizado
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
      <p className="font-medium">NEX {data.label}</p>
      <p className="text-sm text-muted-foreground">
        {data.count} personagen{data.count !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

/**
 * Gráfico de barras de distribuição de NEX
 */
export function NexDistributionChart({ data }: NexDistributionChartProps) {
  // Preparar dados com labels
  const chartData = data.map((item, index) => ({
    ...item,
    label: NEX_LABELS[item.nex] || `${item.nex}%`,
    color: NEX_COLORS[index % NEX_COLORS.length]
  }));

  // Verificar se há dados
  const hasData = data.some((item) => item.count > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribuição por NEX</CardTitle>
          <CardDescription>Progressão dos personagens por faixa de exposição</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  // Calcular total e média
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const weightedSum = data.reduce((sum, item) => sum + (item.nex * item.count), 0);
  const avgNex = total > 0 ? Math.round(weightedSum / total) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Distribuição por NEX</CardTitle>
            <CardDescription>Progressão dos personagens por faixa de exposição</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{avgNex}%</p>
            <p className="text-xs text-muted-foreground">NEX médio</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false}
            />
            <XAxis 
              dataKey="label" 
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legenda de patentes */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            💡 NEX baixo = Recruta/Operador • NEX médio = Agente Especial • NEX alto = Oficial de Operações/Elite
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default NexDistributionChart;
