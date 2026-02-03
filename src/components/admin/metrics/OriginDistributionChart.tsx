/**
 * OriginDistributionChart - Gráfico de distribuição de origens
 * Exibe barra horizontal com as origens mais populares
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import type { OriginDistribution } from './AdminMetricsDashboard';

// Mapa de nomes amigáveis para origens
const ORIGIN_NAMES: Record<string, string> = {
  'policial': 'Policial',
  'cultista-arrependido': 'Cultista Arrependido',
  'vitima': 'Vítima',
  'militar': 'Militar',
  'criminoso': 'Criminoso',
  'trabalhador-rural': 'Trabalhador Rural',
  'agente-de-saude': 'Agente de Saúde',
  'mercenario': 'Mercenário',
  'lutador': 'Lutador',
  'artista-marcial': 'Artista Marcial',
  'academico': 'Acadêmico',
  'amnesiaco': 'Amnésico',
  'atleta': 'Atleta',
  'chef-do-outro-lado': 'Chef do Outro Lado',
  'engenheiro': 'Engenheiro',
  'investigador': 'Investigador',
  'magnata': 'Magnata',
  'operario': 'Operário',
  'servidor-publico': 'Servidor Público',
  'teórico-da-conspiracao': 'Teórico da Conspiração',
  't-i': 'T.I.',
  'trambiqueiro': 'Trambiqueiro',
  'universitario': 'Universitário',
  'desgarrado': 'Desgarrado',
  'diplomata': 'Diplomata',
  'experimento-de-lab': 'Experimento de Lab.'
};

// Cores gradientes para as barras
const BAR_COLORS = [
  'hsl(220, 70%, 50%)',
  'hsl(220, 65%, 55%)',
  'hsl(220, 60%, 58%)',
  'hsl(220, 55%, 60%)',
  'hsl(220, 50%, 62%)',
  'hsl(220, 45%, 64%)',
  'hsl(220, 40%, 66%)',
  'hsl(220, 35%, 68%)',
  'hsl(220, 30%, 70%)',
  'hsl(220, 25%, 72%)'
];

interface OriginDistributionChartProps {
  data: OriginDistribution[];
}

/**
 * Tooltip customizado
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
      <p className="font-medium">{data.displayName}</p>
      <p className="text-sm text-muted-foreground">
        {data.count} personagen{data.count !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

/**
 * Gráfico de barras horizontais de origens
 */
export function OriginDistributionChart({ data }: OriginDistributionChartProps) {
  // Preparar dados com nomes amigáveis
  const chartData = data.map((item) => ({
    ...item,
    displayName: ORIGIN_NAMES[item.origin] || item.origin,
    shortName: (ORIGIN_NAMES[item.origin] || item.origin).slice(0, 15) + 
      ((ORIGIN_NAMES[item.origin] || item.origin).length > 15 ? '...' : '')
  }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Origens Mais Populares</CardTitle>
          <CardDescription>Top 10 origens escolhidas</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Origens Mais Populares</CardTitle>
        <CardDescription>Top 10 origens escolhidas</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis 
              type="category" 
              dataKey="shortName" 
              tickLine={false} 
              axisLine={false}
              width={75}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default OriginDistributionChart;
