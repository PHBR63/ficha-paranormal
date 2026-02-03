/**
 * ActivityChart - Gráfico de atividade mensal
 * Exibe linha/área com criação de personagens e campanhas ao longo do tempo
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip, 
  CartesianGrid,
  Legend
} from 'recharts';
import type { MonthlyActivity } from './AdminMetricsDashboard';

// Meses em português
const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

interface ActivityChartProps {
  data: MonthlyActivity[];
}

/**
 * Formatar mês para exibição
 */
function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  const monthIndex = parseInt(monthNum, 10) - 1;
  return `${MONTH_NAMES[monthIndex]}/${year.slice(2)}`;
}

/**
 * Tooltip customizado
 */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
      <p className="font-medium mb-2">{formatMonth(label)}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-medium">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

/**
 * Gráfico de área com atividade mensal
 */
export function ActivityChart({ data }: ActivityChartProps) {
  // Preparar dados com labels formatados
  const chartData = data.map((item) => ({
    ...item,
    label: formatMonth(item.month)
  }));

  // Verificar se há atividade
  const hasActivity = data.some((item) => item.characters > 0 || item.campaigns > 0);

  if (!hasActivity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Atividade Mensal</CardTitle>
          <CardDescription>Criação de personagens e campanhas nos últimos 12 meses</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <p className="text-muted-foreground">Nenhuma atividade registrada no período</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Atividade Mensal</CardTitle>
        <CardDescription>Criação de personagens e campanhas nos últimos 12 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCharacters" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(200, 98%, 48%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(200, 98%, 48%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCampaigns" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top"
              height={36}
              formatter={(value) => <span className="text-sm">{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="characters"
              name="Personagens"
              stroke="hsl(200, 98%, 48%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCharacters)"
            />
            <Area
              type="monotone"
              dataKey="campaigns"
              name="Campanhas"
              stroke="hsl(45, 93%, 47%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCampaigns)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default ActivityChart;
